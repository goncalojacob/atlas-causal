// JSON Schema subset validator. Pure: no fs, no network; runs in Node and in
// the browser. The schema files are handed in as an object keyed by their
// path relative to schema/, so $ref can be resolved between files.
//
// The subset is deliberately small and FAILS CLOSED: a keyword outside the
// list below is an error of the schema itself, not something silently
// ignored. Otherwise a schema could document checks nobody performs
// (docs/review-2026-09-01.md, finding 14).

export const VALIDATION_KEYWORDS = Object.freeze([
  'type', 'enum', 'const', 'required', 'properties', 'additionalProperties',
  'items', 'pattern', 'minimum', 'maximum', 'minLength', 'maxLength',
  'oneOf', '$ref',
]);

// Carry no validation semantics; kept so the files stay readable by external
// tools and say which draft they are written in.
export const ANNOTATION_KEYWORDS = Object.freeze(['$schema', '$id', 'title', 'description']);

const TYPES = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string']);
const VALIDATION = new Set(VALIDATION_KEYWORDS);
const ANNOTATION = new Set(ANNOTATION_KEYWORDS);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value, type) {
  switch (type) {
    case 'integer': return Number.isInteger(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'object': return isPlainObject(value);
    default: return typeOf(value) === type;
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeOf(a) !== typeOf(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (isPlainObject(a)) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return deepEqual(ka, kb) && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

// --- $ref resolution -------------------------------------------------------

function dirname(file) {
  const i = file.lastIndexOf('/');
  return i < 0 ? '' : file.slice(0, i);
}

function normalisePath(path) {
  const out = [];
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}

function unescapePointer(seg) {
  return seg.replace(/~1/g, '/').replace(/~0/g, '~');
}

// A ref is "<relative path>", "#<pointer>" or "<relative path>#<pointer>".
// Refs never leave the schema set: there is no URL fetching, by design.
export function resolveRef(files, fromFile, ref, cache = null) {
  if (cache) {
    const key = `${fromFile} ${ref}`;
    const seen = cache.get(key);
    if (seen) return seen;
    const found = resolveRef(files, fromFile, ref);
    cache.set(key, found);
    return found;
  }
  const hash = ref.indexOf('#');
  const pathPart = hash < 0 ? ref : ref.slice(0, hash);
  const pointer = hash < 0 ? '' : ref.slice(hash + 1);
  const file = pathPart === '' ? fromFile : normalisePath(`${dirname(fromFile)}/${pathPart}`);
  if (!Object.hasOwn(files, file)) {
    return { error: `$ref "${ref}" points at unknown schema file "${file}"` };
  }
  let node = files[file];
  let at = '';
  if (pointer !== '') {
    if (!pointer.startsWith('/')) return { error: `$ref "${ref}" has a fragment that is not a JSON pointer` };
    for (const raw of pointer.slice(1).split('/')) {
      const seg = unescapePointer(raw);
      if (!isPlainObject(node) || !Object.hasOwn(node, seg)) {
        return { error: `$ref "${ref}" does not resolve: no "${seg}" under ${file}#${at}` };
      }
      node = node[seg];
      at += `/${seg}`;
    }
  }
  return { file, pointer, node };
}

// --- Checking the schemas themselves (fail closed) ------------------------

function schemaError(errors, file, pointer, message) {
  errors.push({ schema: `${file}#${pointer}`, message });
}

function checkSchema(node, file, pointer, files, errors, patterns = null) {
  if (typeof node === 'boolean') return;
  if (!isPlainObject(node)) {
    schemaError(errors, file, pointer, 'a schema must be an object or a boolean');
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    const here = `${pointer}/${key}`;
    if (ANNOTATION.has(key)) continue;
    if (!VALIDATION.has(key)) {
      schemaError(errors, file, here, `unknown keyword "${key}" — the validator implements only: ${VALIDATION_KEYWORDS.join(', ')}`);
      continue;
    }
    switch (key) {
      case 'type': {
        const list = Array.isArray(value) ? value : [value];
        for (const t of list) {
          if (!TYPES.has(t)) schemaError(errors, file, here, `unknown type "${t}"`);
        }
        break;
      }
      case 'enum':
        if (!Array.isArray(value) || value.length === 0) schemaError(errors, file, here, 'enum must be a non-empty array');
        break;
      case 'const':
        break;
      case 'required':
        if (!Array.isArray(value) || !value.every((s) => typeof s === 'string')) {
          schemaError(errors, file, here, 'required must be an array of strings');
        }
        break;
      case 'properties':
        if (!isPlainObject(value)) {
          schemaError(errors, file, here, 'properties must be an object');
          break;
        }
        for (const [name, sub] of Object.entries(value)) checkSchema(sub, file, `${here}/${name}`, files, errors, patterns);
        break;
      case 'additionalProperties':
      case 'items':
        checkSchema(value, file, here, files, errors, patterns);
        break;
      case 'pattern':
        if (typeof value !== 'string') {
          schemaError(errors, file, here, 'pattern must be a string');
          break;
        }
        try {
          // Compiled here and kept: this walk already has to prove every
          // pattern compiles, and compiling one per value checked was four
          // fifths of the schema pass at twenty thousand records (health
          // review A, finding 11). Keyed by the pattern text, so the same
          // id pattern behind fifty $refs is one RegExp.
          const compiled = new RegExp(value, 'u');
          if (patterns && !patterns.has(value)) patterns.set(value, compiled);
        } catch (e) {
          schemaError(errors, file, here, `pattern does not compile: ${e.message}`);
        }
        break;
      case 'minimum':
      case 'maximum':
        if (typeof value !== 'number' || !Number.isFinite(value)) schemaError(errors, file, here, `${key} must be a number`);
        break;
      case 'minLength':
      case 'maxLength':
        if (!Number.isInteger(value) || value < 0) schemaError(errors, file, here, `${key} must be a non-negative integer`);
        break;
      case 'oneOf':
        if (!Array.isArray(value) || value.length === 0) {
          schemaError(errors, file, here, 'oneOf must be a non-empty array');
          break;
        }
        value.forEach((sub, i) => checkSchema(sub, file, `${here}/${i}`, files, errors, patterns));
        break;
      case '$ref': {
        if (typeof value !== 'string') {
          schemaError(errors, file, here, '$ref must be a string');
          break;
        }
        const target = resolveRef(files, file, value);
        if (target.error) schemaError(errors, file, here, target.error);
        else if (!isPlainObject(target.node) && typeof target.node !== 'boolean') {
          schemaError(errors, file, here, `$ref "${value}" points at something that is not a schema`);
        }
        break;
      }
      default:
        // Unreachable: every keyword in VALIDATION is handled above.
        schemaError(errors, file, here, `keyword "${key}" listed but not implemented`);
    }
  }
}

// --- Validating instances -------------------------------------------------

function fail(errors, path, keyword, message, extra) {
  errors.push({ path, keyword, message, ...extra });
}

// `ctx` is what does not change between values: the schema files, the
// patterns compiled once by checkSchema, and the $ref resolutions memoised
// as they are asked for. It is built once per createValidator.
function validateNode(schema, file, value, path, ctx, errors, refChain) {
  if (schema === true) return;
  if (schema === false) {
    fail(errors, path, 'false', 'no value is allowed here');
    return;
  }

  if (Object.hasOwn(schema, '$ref')) {
    const target = resolveRef(ctx.files, file, schema.$ref, ctx.refs);
    // Refs are checked at construction, so `error` here is unreachable unless
    // a caller bypassed createValidator.
    if (target.error) {
      fail(errors, path, '$ref', target.error);
      return;
    }
    const key = `${target.file}#${target.pointer}`;
    if (refChain.has(key)) {
      fail(errors, path, '$ref', `circular $ref through ${key}`);
      return;
    }
    const next = new Set(refChain);
    next.add(key);
    validateNode(target.node, target.file, value, path, ctx, errors, next);
  }

  if (Object.hasOwn(schema, 'type')) {
    const list = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!list.some((t) => matchesType(value, t))) {
      fail(errors, path, 'type', `expected ${list.join(' or ')}, got ${typeOf(value)}`);
      return;
    }
  }

  if (Object.hasOwn(schema, 'const') && !deepEqual(value, schema.const)) {
    fail(errors, path, 'const', `expected exactly ${JSON.stringify(schema.const)}`);
  }

  if (Object.hasOwn(schema, 'enum') && !schema.enum.some((v) => deepEqual(value, v))) {
    fail(errors, path, 'enum', `expected one of ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}, got ${JSON.stringify(value)}`);
  }

  if (typeof value === 'string') {
    // Code points, not UTF-16 units: an accented title counts its letters.
    const length = [...value].length;
    if (Object.hasOwn(schema, 'minLength') && length < schema.minLength) {
      fail(errors, path, 'minLength', `must be at least ${schema.minLength} characters`);
    }
    if (Object.hasOwn(schema, 'maxLength') && length > schema.maxLength) {
      fail(errors, path, 'maxLength', `must be at most ${schema.maxLength} characters`);
    }
    if (Object.hasOwn(schema, 'pattern')) {
      // Compiled by checkSchema at construction; the fallback is for a
      // pattern reached by a caller that bypassed createValidator.
      let re = ctx.patterns.get(schema.pattern);
      if (!re) {
        re = new RegExp(schema.pattern, 'u');
        ctx.patterns.set(schema.pattern, re);
      }
      if (!re.test(value)) fail(errors, path, 'pattern', `must match ${schema.pattern}`);
    }
  }

  if (typeof value === 'number') {
    if (Object.hasOwn(schema, 'minimum') && value < schema.minimum) {
      fail(errors, path, 'minimum', `must be at least ${schema.minimum}`);
    }
    if (Object.hasOwn(schema, 'maximum') && value > schema.maximum) {
      fail(errors, path, 'maximum', `must be at most ${schema.maximum}`);
    }
  }

  if (Array.isArray(value) && Object.hasOwn(schema, 'items')) {
    value.forEach((item, i) => validateNode(schema.items, file, item, `${path}/${i}`, ctx, errors, new Set()));
  }

  if (isPlainObject(value)) {
    if (Object.hasOwn(schema, 'required')) {
      for (const name of schema.required) {
        if (!Object.hasOwn(value, name)) fail(errors, path, 'required', `missing required property "${name}"`);
      }
    }
    const props = Object.hasOwn(schema, 'properties') ? schema.properties : {};
    for (const [name, sub] of Object.entries(props)) {
      if (Object.hasOwn(value, name)) {
        validateNode(sub, file, value[name], `${path}/${name}`, ctx, errors, new Set());
      }
    }
    if (Object.hasOwn(schema, 'additionalProperties')) {
      for (const name of Object.keys(value)) {
        if (Object.hasOwn(props, name)) continue;
        if (schema.additionalProperties === false) {
          fail(errors, `${path}/${name}`, 'additionalProperties', `unexpected property "${name}"`);
        } else {
          validateNode(schema.additionalProperties, file, value[name], `${path}/${name}`, ctx, errors, new Set());
        }
      }
    }
  }

  if (Object.hasOwn(schema, 'oneOf')) {
    const attempts = schema.oneOf.map((sub) => {
      const subErrors = [];
      validateNode(sub, file, value, path, ctx, subErrors, refChain);
      return subErrors;
    });
    const matched = attempts.filter((e) => e.length === 0).length;
    if (matched !== 1) {
      fail(errors, path, 'oneOf', `expected exactly one of ${schema.oneOf.length} alternatives to match, ${matched} did`, {
        alternatives: matched === 0 ? attempts : undefined,
      });
    }
  }
}

// files: { 'v1/event.json': {...}, 'common/interval.json': {...}, ... }.
// Returns { schemaErrors, validate }. When schemaErrors is non-empty the set
// is unusable and validate() throws: nothing is checked against a schema
// that could not be trusted.
export function createValidator(files) {
  if (!isPlainObject(files)) throw new TypeError('createValidator expects an object of schema files');
  const schemaErrors = [];
  // The two caches every validation shares. Both are filled by the walk
  // below, which has to visit every keyword anyway; nothing is compiled or
  // resolved twice for the life of the validator.
  const patterns = new Map();
  const refs = new Map();
  for (const [file, schema] of Object.entries(files)) {
    checkSchema(schema, file, '', files, schemaErrors, patterns);
  }
  const ctx = { files, patterns, refs };
  return {
    schemaErrors,
    validate(file, value) {
      if (schemaErrors.length > 0) {
        throw new Error(`schema set is invalid (${schemaErrors.length} problem(s)); refusing to validate`);
      }
      if (!Object.hasOwn(files, file)) throw new Error(`unknown schema file "${file}"`);
      const errors = [];
      validateNode(files[file], file, value, '', ctx, errors, new Set());
      return errors;
    },
  };
}

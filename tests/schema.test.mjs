import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createValidator, resolveRef, VALIDATION_KEYWORDS } from '../src/validate/schema.js';
import { schemas, clone } from './helpers.mjs';

const minimalEvent = {
  schema: 1,
  id: 'fixture-event-a',
  kind: 'event',
  status: 'active',
  supersededBy: null,
  aliases: [],
  authors: [{ name: 'Fixture Author', github: 'fixture-author' }],
  license: 'CC-BY-SA-4.0',
  created: '2026-01-01',
  revised: null,
  sources: [{ source: 'fixture-source-1', locator: 'p. 1' }],
  title: 'Fixture event A',
  summary: 'A synthetic event used only by the tests.',
  when: { start: 1200, end: 1200 },
  where: { lon: 10, lat: 10, precision: 'city', label: 'Fixture place' },
  region: null,
  actors: [],
};

test('the repository schemas use only the implemented subset', async () => {
  const v = createValidator(await schemas());
  assert.deepEqual(v.schemaErrors, []);
});

test('fails closed: an unknown keyword is an error of the schema itself', () => {
  for (const keyword of ['format', 'uniqueItems', 'allOf', '$defs', 'patternProperties', 'minItems']) {
    const v = createValidator({ 'x.json': { type: 'string', [keyword]: true } });
    assert.equal(v.schemaErrors.length, 1, keyword);
    assert.ok(v.schemaErrors[0].message.includes(`unknown keyword "${keyword}"`), v.schemaErrors[0].message);
    assert.throws(() => v.validate('x.json', 'anything'), /refusing to validate/);
  }
});

test('fails closed inside nested positions too', () => {
  const v = createValidator({
    'x.json': {
      type: 'object',
      properties: { a: { type: 'array', items: { type: 'string', format: 'date' } } },
    },
  });
  assert.equal(v.schemaErrors.length, 1);
  assert.equal(v.schemaErrors[0].schema, 'x.json#/properties/a/items/format');
});

test('property names are not keywords', () => {
  const v = createValidator({ 'x.json': { type: 'object', properties: { format: { type: 'string' } } } });
  assert.deepEqual(v.schemaErrors, []);
  assert.deepEqual(v.validate('x.json', { format: 'x' }), []);
});

test('malformed keyword values are schema errors', () => {
  const cases = [
    { type: 'strin' },
    { enum: [] },
    { required: ['a', 1] },
    { pattern: '[' },
    { minLength: -1 },
    { oneOf: [] },
    { $ref: 42 },
    { properties: [] },
  ];
  for (const schema of cases) {
    const v = createValidator({ 'x.json': schema });
    assert.ok(v.schemaErrors.length >= 1, JSON.stringify(schema));
  }
});

test('every listed keyword is implemented (nothing silently accepted)', () => {
  const schema = {
    type: 'object', enum: [{}], const: {}, required: [], properties: {}, additionalProperties: false,
    items: true, pattern: '.', minimum: 0, maximum: 1, minLength: 0, maxLength: 1, oneOf: [true], $ref: '#',
  };
  assert.deepEqual(Object.keys(schema).sort(), [...VALIDATION_KEYWORDS].sort());
  const v = createValidator({ 'x.json': { type: 'object', properties: { k: schema } } });
  assert.deepEqual(v.schemaErrors.filter((e) => /unknown keyword/.test(e.message)), []);
});

test('$ref resolves relative paths, pointers, and rejects the unknown', async () => {
  const files = await schemas();
  assert.equal(resolveRef(files, 'v1/event.json', '../common/interval.json').file, 'common/interval.json');
  const r = resolveRef(files, 'v1/edge.json', '../common/provenance.json#/properties/sources');
  assert.equal(r.node.type, 'array');
  assert.match(resolveRef(files, 'v1/event.json', '../common/missing.json').error, /unknown schema file/);
  assert.match(resolveRef(files, 'v1/event.json', '#/properties/nope').error, /does not resolve/);
  const bad = createValidator({ 'x.json': { $ref: 'y.json' } });
  assert.equal(bad.schemaErrors.length, 1);
});

test('a circular $ref is reported rather than looping', () => {
  const v = createValidator({ 'x.json': { $ref: '#' } });
  assert.deepEqual(v.schemaErrors, []);
  const errors = v.validate('x.json', 1);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /circular/);
});

test('a valid event passes v1/event.json', async () => {
  const v = createValidator(await schemas());
  assert.deepEqual(v.validate('v1/event.json', minimalEvent), []);
});

test('type, enum, const, required, additionalProperties, pattern, lengths, bounds', async () => {
  const v = createValidator(await schemas());
  const check = (mutate, keyword, pathRe) => {
    const e = clone(minimalEvent);
    mutate(e);
    const errors = v.validate('v1/event.json', e);
    assert.ok(errors.some((x) => x.keyword === keyword && pathRe.test(x.path)), `${keyword} ${pathRe}: ${JSON.stringify(errors)}`);
  };
  check((e) => { e.title = 5; }, 'type', /^\/title$/);
  check((e) => { e.status = 'deleted'; }, 'enum', /^\/status$/);
  check((e) => { e.kind = 'edge'; }, 'const', /^\/kind$/);
  check((e) => { delete e.summary; }, 'required', /^$/);
  check((e) => { e.tags = []; }, 'additionalProperties', /^\/tags$/);
  check((e) => { e.id = 'Not-A-Slug'; }, 'pattern', /^\/id$/);
  check((e) => { e.title = ''; }, 'minLength', /^\/title$/);
  check((e) => { e.title = 'x'.repeat(201); }, 'maxLength', /^\/title$/);
  check((e) => { e.when.start = 'soon'; }, 'oneOf', /^\/when\/start$/);
  check((e) => { e.where.precision = 'exactish'; }, 'oneOf', /^\/where$/);

  const r = createValidator({ 'x.json': { type: 'integer', minimum: 1, maximum: 5 } });
  assert.equal(r.validate('x.json', 0)[0].keyword, 'minimum');
  assert.equal(r.validate('x.json', 6)[0].keyword, 'maximum');
  assert.equal(r.validate('x.json', 1.5)[0].keyword, 'type');
  assert.deepEqual(r.validate('x.json', 3), []);
});

test('oneOf demands exactly one match and explains a zero-match', () => {
  const v = createValidator({ 'x.json': { oneOf: [{ type: 'integer' }, { type: 'number' }] } });
  const both = v.validate('x.json', 1);
  assert.match(both[0].message, /2 did/);
  const none = v.validate('x.json', 'a');
  assert.equal(none[0].alternatives.length, 2);
});

test('type accepts an array of types and minLength counts code points', () => {
  const v = createValidator({ 'x.json': { type: ['integer', 'null'], minLength: 2 } });
  assert.deepEqual(v.validate('x.json', null), []);
  assert.deepEqual(v.validate('x.json', 3), []);
  assert.equal(v.validate('x.json', 'x').length, 1);
  const s = createValidator({ 'x.json': { type: 'string', minLength: 2 } });
  assert.deepEqual(s.validate('x.json', 'çã'), []);
});

test('bundle accepts a list of mixed records and rejects a stranger', async () => {
  const v = createValidator(await schemas());
  const bundle = { schema: 1, records: [minimalEvent] };
  assert.deepEqual(v.validate('v1/bundle.json', bundle), []);
  const bad = { schema: 1, records: [{ kind: 'presence' }] };
  assert.equal(v.validate('v1/bundle.json', bad)[0].keyword, 'oneOf');
});

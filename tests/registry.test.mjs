// The registry against the schemas.
//
// `src/kinds.js` and `src/vocab.js` are the one place the kinds and the closed
// vocabularies are written — except for the JSON Schemas, which cannot import
// JavaScript and therefore carry a second copy of every enum. That copy is the
// one duplication H2 could not remove, so it is the one this file watches:
// a type added to a schema's enum and not to `vocab.js`, or a kind added to
// `provenance.json` and not to the registry, fails here rather than in the
// form six weeks later.
//
// The second consistency test is the other half of finding 9's complaint:
// `KINDS` and the directory map used to be written out in two files, one in
// the browser and one in Node, and nothing held them together.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import {
  KIND, KINDS, KIND_DIRS, CITER_ORDER, CONTRIBUTED_KINDS, IMPORT_KINDS,
  kindsWhere, byKind, licensesOf,
} from '../src/kinds.js';
import {
  EDGE_TYPES, EDGE_TYPE_IDS, RELATION_TYPES, RELATION_TYPE_IDS,
  EDGE_ID, RELATION_ID, FOCUS, FOCUS_PARAM, FOCUS_NONE, GROUPS, FOCUS_KINDS,
  RELATION_ENDPOINTS, RELATION_GROUP_ORDER, ACYCLIC_RELATION_TYPES,
  NARRATIVE_STEP_REF, OFFICE_CATEGORY_IDS, OFFICE_ENDPOINTS, OFFICE_CATEGORY_LABEL,
  EVENT_SCOPES,
} from '../src/vocab.js';
import { ACTOR_TYPES, CONFIDENCE_ORDER, DEPENDENCY_KINDS, RECORD_STATUSES } from '../src/validate/rules.js';
import { KIND_DIRS as READ_KIND_DIRS } from '../tools/lib/read.mjs';
import { SCHEMA_FILES, TOOL_SIDE } from '../src/validate/schemas.js';
import { CARDS, OPENINGS } from '../src/state.js';
import {
  ORIGIN_TOOLS, IMPORT_TOOLS, NC_ORIGINS, REVIEW_STATUS,
} from '../src/origin.js';
import { ENRICHABLE, CREATOR_ONLY } from '../tools/import/identity.mjs';
import {
  REFERENCES, IMPORT_REFERENCES, VOCABULARY_FIELDS, BODY_FIELD, ITEM, VALUES, ANY_KIND,
} from '../src/references.js';
import { IMPORT_SCHEMAS } from '../tools/validate.mjs';
import { ROOT, SCHEMA_DIR } from './helpers.mjs';

const schema = async (file) => JSON.parse(await readFile(path.join(SCHEMA_DIR, file), 'utf8'));

// The alternation out of a schema's own id pattern: "(caused|enabled|…)". The
// patterns in vocab.js are *built* from the type lists, so comparing the raw
// source would only compare two spellings of the same thing; comparing the
// third part of the id is comparing what the pattern is for.
function typesInPattern(pattern) {
  const groups = [...pattern.matchAll(/\(([a-z0-9|-]+)\)/g)].filter((m) => m[1].includes('|'));
  assert.equal(groups.length, 1, `no single type alternation in ${pattern}`);
  return groups[0][1].split('|');
}

test('the registry names every kind the schemas do, in the same order', async () => {
  const provenance = await schema('common/provenance.json');
  assert.deepEqual([...KINDS], provenance.properties.kind.enum);

  // Every kind has a schema file, that file exists, it is in the list the
  // browser loads, and it declares itself to be about that kind.
  for (const kind of KINDS) {
    const file = KIND[kind].schema;
    assert.ok(SCHEMA_FILES.includes(file), `${file} is not in SCHEMA_FILES`);
    const doc = await schema(file);
    assert.equal(doc.properties.kind.const, kind, `${file} declares another kind`);
  }

  // And nothing under schema/v1/ is a record schema the registry has not
  // heard of: a ninth kind whose schema is written and whose entry is not
  // fails here rather than at the first record.
  const claimed = new Set(KINDS.map((k) => KIND[k].schema));
  for (const name of await readdir(path.join(SCHEMA_DIR, 'v1'))) {
    const file = `v1/${name}`;
    if (TOOL_SIDE.includes(file) || claimed.has(file)) continue;
    const doc = await schema(file);
    const declares = doc.properties?.kind?.const;
    assert.equal(declares, undefined, `${file} is about kind "${declares}", which is not in the registry`);
  }

  // The licences a kind may carry are a subset of the licences a record may
  // declare at all: the schema is the wider gate and rule 11 the narrower.
  const licences = new Set((await schema('common/provenance.json')).properties.license.enum);
  for (const [kind, allowed] of Object.entries(licensesOf())) {
    for (const licence of allowed) assert.ok(licences.has(licence), `${kind}: ${licence} is not in the schema's enum`);
  }
});

test('the registry equals the directory map, in Node and in the browser', async () => {
  // One table, re-exported: tools/lib/read.mjs used to declare its own.
  assert.equal(READ_KIND_DIRS, KIND_DIRS);
  assert.deepEqual(Object.keys(KIND_DIRS), [...KINDS]);

  // Every directory exists under data/ and holds records of that kind only —
  // which is what the map is for, and the reason a kind cannot have one
  // directory in the tools and another in the atlas.
  const dirs = new Set(await readdir(path.join(ROOT, 'data'), { withFileTypes: true })
    .then((es) => es.filter((e) => e.isDirectory()).map((e) => e.name)));
  for (const kind of KINDS) assert.ok(dirs.has(KIND_DIRS[kind]), `data/${KIND_DIRS[kind]}/ does not exist`);
  assert.equal(new Set(Object.values(KIND_DIRS)).size, KINDS.length, 'two kinds share a directory');

  // The derived lists are the kinds they say they are, and each is a subset
  // of the registry's own.
  for (const list of [kindsWhere('identity'), kindsWhere('body'), kindsWhere('entryPage'),
    kindsWhere('linkable'), CITER_ORDER, CONTRIBUTED_KINDS, IMPORT_KINDS]) {
    for (const kind of list) assert.ok(KINDS.includes(kind), `${kind} is not a kind`);
    assert.equal(new Set(list).size, list.length, `${list} repeats a kind`);
  }
  // A presence is the one kind the form does not build, and it is the one
  // kind with no fields: the two statements have to stay the same statement.
  assert.deepEqual(
    [...CONTRIBUTED_KINDS].sort(),
    KINDS.filter((k) => KIND[k].fields.length > 0).sort(),
  );
  // A citer group needs a name, and a name is only worth having on a kind
  // that cites.
  assert.deepEqual([...CITER_ORDER].sort(), Object.keys(byKind('citerLabel')).sort());

  // The parameters that open a record are the registry's, and `state.js`'s
  // CARDS is the same five: a kind that gains a URL of its own gains a slot
  // the history pushes on, and the two must not part company. (H1c left this
  // pair for H2; the answer is that the registry is where a kind says it has
  // an address, and state.js says what that means for the Back button.)
  assert.deepEqual([...CARDS].sort(), [...new Set(Object.values(byKind('urlParam')))].sort());
  for (const key of CARDS) assert.ok(OPENINGS.includes(key), key);
});

test('the vocabularies equal the enums in schema/**', async () => {
  const edge = await schema('v1/edge.json');
  const relation = await schema('v1/relation.json');
  const narrative = await schema('v1/narrative.json');

  assert.deepEqual([...EDGE_TYPE_IDS], edge.properties.type.enum);
  assert.deepEqual([...RELATION_TYPE_IDS], relation.properties.type.enum);

  // The four lists I2 writes into the index as integers. A file's integer is
  // an index into one of these, so a list that had drifted from the schema's
  // enum would be a file that decoded to the wrong word — in the same order,
  // not only the same set.
  const provenance = await schema('common/provenance.json');
  const actor = await schema('v1/actor.json');
  const presence = await schema('v1/presence.json');
  const confidence = await schema('common/confidence.json');
  assert.deepEqual([...RECORD_STATUSES], provenance.properties.status.enum);
  assert.deepEqual([...ACTOR_TYPES], actor.properties.actorType.enum);
  assert.deepEqual([...CONFIDENCE_ORDER], confidence.enum);
  assert.deepEqual([...DEPENDENCY_KINDS], presence.properties.dependencyKind.oneOf.find((s) => s.enum).enum);
  assert.deepEqual([...EVENT_SCOPES], (await schema('v1/event.json')).properties.scope.oneOf.find((s) => s.enum).enum);

  // The id patterns are built from the type lists; the schemas write theirs
  // out. Same types, in the same order, in all four places.
  assert.deepEqual(typesInPattern(edge.properties.id.pattern), [...EDGE_TYPE_IDS]);
  assert.deepEqual(typesInPattern(relation.properties.id.pattern), [...RELATION_TYPE_IDS]);
  // A step's ref names an edge or, since H7, a relation, so its pattern
  // carries both vocabularies — the edges first, in their own order, then the
  // relations in theirs.
  const step = narrative.properties.steps.items.properties.ref.pattern;
  assert.deepEqual(typesInPattern(step), [...EDGE_TYPE_IDS, ...RELATION_TYPE_IDS]);
  assert.deepEqual(typesInPattern(NARRATIVE_STEP_REF.source), [...EDGE_TYPE_IDS, ...RELATION_TYPE_IDS]);
  for (const type of [...EDGE_TYPE_IDS, ...RELATION_TYPE_IDS]) {
    assert.ok(NARRATIVE_STEP_REF.test(`a--b--${type}`), type);
    assert.ok(new RegExp(step).test(`a--b--${type}`), type);
  }

  // And the built patterns accept exactly the ids the schemas' do.
  for (const type of EDGE_TYPE_IDS) {
    assert.ok(EDGE_ID.test(`a--b--${type}`), type);
    assert.ok(!RELATION_ID.test(`a--b--${type}`), `${type} is not a relation`);
    assert.ok(new RegExp(edge.properties.id.pattern).test(`a--b--${type}`), type);
  }
  for (const type of RELATION_TYPE_IDS) {
    assert.ok(RELATION_ID.test(`a--b--${type}`), type);
    assert.ok(!EDGE_ID.test(`a--b--${type}`), `${type} is not an edge`);
    assert.ok(new RegExp(relation.properties.id.pattern).test(`a--b--${type}`), type);
  }

  // Every type carries what the pictures and the rules ask of it: a label,
  // and for a relation both directions, its endpoints and its place in the
  // order an actor's card draws.
  for (const type of EDGE_TYPES) assert.equal(typeof type.label, 'string');
  for (const type of RELATION_TYPES) {
    assert.equal(typeof type.out, 'string', type.id);
    assert.equal(typeof type.in, 'string', type.id);
    assert.ok(RELATION_ENDPOINTS[type.id], type.id);
    assert.ok(RELATION_GROUP_ORDER.includes(`${type.id}:out`), type.id);
    assert.equal(RELATION_GROUP_ORDER.includes(`${type.id}:in`), type.symmetric !== true, type.id);
  }
  for (const type of ACYCLIC_RELATION_TYPES) assert.ok(RELATION_TYPE_IDS.includes(type), type);

  // The endpoints name actor types the actor schema knows: rule 19 checks a
  // record against this table, so a typo in it is a rule that never fires.
  const actorTypes = new Set((await schema('v1/actor.json')).properties.actorType.enum);
  for (const [type, ends] of Object.entries(RELATION_ENDPOINTS)) {
    for (const at of [...ends.from, ...ends.to]) assert.ok(actorTypes.has(at), `${type}: ${at}`);
  }

  // The same pair for the offices: the categories are the schema's enum in
  // the schema's order, and the actor type each category may belong to is an
  // actor type the actor schema knows. Rule 26 reads that table, so a
  // category spelled two ways here would be a rule that never fires
  // (amendment A5).
  const office = await schema('v1/office.json');
  assert.deepEqual([...OFFICE_CATEGORY_IDS], office.properties.category.enum);
  assert.deepEqual(Object.keys(OFFICE_ENDPOINTS).sort(), [...OFFICE_CATEGORY_IDS].sort());
  for (const [category, allowed] of Object.entries(OFFICE_ENDPOINTS)) {
    assert.ok(allowed.length > 0, category);
    for (const at of allowed) assert.ok(actorTypes.has(at), `${category}: ${at}`);
  }
  for (const category of OFFICE_CATEGORY_IDS) {
    assert.equal(typeof OFFICE_CATEGORY_LABEL[category], 'string', category);
  }

  // An event's `scope` is a closed vocabulary in code, so it is a second copy
  // in the schema like the types above. `category` is deliberately *not* here:
  // it is a closed list in data (data/categories.json), the schema says only
  // that it is an id, and the warning is what holds it to the list.
  const event = await schema('v1/event.json');
  const scope = event.properties.scope.oneOf.find((branch) => Array.isArray(branch.enum));
  assert.deepEqual([...EVENT_SCOPES], scope.enum);

  // The lens's six kinds and its pattern accept exactly each other. Five of
  // them are record kinds; `region` is not — a region is a lane the atlas
  // draws in, declared in `regions.json` and named by every event, which is
  // exactly why a reader may focus on one. The four groupings are three of
  // the lens kinds plus "none", which is a coincidence of the vocabulary and
  // not a rule, so only the shape of each is asserted.
  for (const kind of FOCUS_KINDS) {
    assert.ok(KINDS.includes(kind) || kind === 'region', kind);
    assert.ok(FOCUS.test(`${kind}:some-id`), kind);
    assert.ok(FOCUS_PARAM.test(`${kind}:some-id`), kind);
  }
  assert.ok(!FOCUS.test('edge:a--b--caused'));
  // The whole parameter is a list of those, or the literal `none`.
  assert.ok(FOCUS_PARAM.test(FOCUS_KINDS.map((k) => `${k}:some-id`).join(',')));
  assert.ok(FOCUS_PARAM.test(FOCUS_NONE));
  assert.ok(!FOCUS_PARAM.test(''));
  assert.ok(!FOCUS_PARAM.test('actor:a,'));
  assert.ok(!FOCUS_PARAM.test(`${FOCUS_NONE},actor:a`));
  assert.equal(GROUPS[0], 'none', 'the default grouping is first');
  assert.equal(new Set(GROUPS).size, GROUPS.length);
});

// --- src/origin.js against the schema, and against the additive rule --------

test('the writers and the review statuses are the ones the schema names', async () => {
  const provenance = await schema('common/provenance.json');
  assert.deepEqual([...ORIGIN_TOOLS], provenance.properties.origin.properties.tool.enum);
  assert.deepEqual(Object.values(REVIEW_STATUS), provenance.properties.review.properties.status.enum);
  // The two narrower lists are subsets of the vocabulary, not a second one:
  // an import that is not a writer, or an NC origin that is not an import,
  // would be a licence hole nobody had opened on purpose.
  for (const tool of IMPORT_TOOLS) assert.ok(ORIGIN_TOOLS.includes(tool), tool);
  for (const tool of NC_ORIGINS) assert.ok(IMPORT_TOOLS.includes(tool), tool);
});

test('an enrichment pass can never be told to write what a creator writes', () => {
  // Rule 29 in the one place it can be enforced rather than checked: `origin`
  // answers "who wrote this record", so an import that fills in an identifier
  // on somebody else's record must not come away owning it. The mistake this
  // catches is a field added to ENRICHABLE without reading why it is short.
  for (const field of ENRICHABLE) assert.ok(!CREATOR_ONLY.includes(field), `${field} is not an import's to write`);
  assert.ok(CREATOR_ONLY.includes('origin'));
  assert.ok(CREATOR_ONLY.includes('review'));
  assert.ok(CREATOR_ONLY.includes('retraction'));
  assert.ok(CREATOR_ONLY.includes('authors'));
});

// The path an id-shaped field sits at in a schema, as `references.js` writes
// one: `/properties/actors/items/properties/actor` → `['actors', ITEM,
// 'actor']`. `oneOf` is how a nullable field is declared and says nothing
// about where the field is, so it is dropped along with the branch index.
function pathsToIds(node, at = [], out = []) {
  if (node === null || typeof node !== 'object') return out;
  if (typeof node.$ref === 'string' && node.$ref.includes('provenance.json#/properties/id')) out.push(at);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'properties' || key === 'oneOf' || key === 'anyOf') pathsToIds(value, at, out);
    else if (key === 'items') pathsToIds(value, [...at, ITEM], out);
    else if (key === 'additionalProperties') pathsToIds(value, [...at, VALUES], out);
    else if (Array.isArray(node) || /^\d+$/.test(key)) pathsToIds(value, at, out);
    else if (at.length || key !== '$id') pathsToIds(value, [...at, key], out);
  }
  return out;
}

test('the reference table covers every kind and every id-shaped field the schemas declare', async () => {
  // Every kind has a row, in the registry's order: a tenth kind is a row here
  // and not a branch in the rename tool (i7-brief §2).
  assert.deepEqual(Object.keys(REFERENCES), [...KINDS]);

  const own = new Set(['id']);
  for (const kind of KINDS) {
    const declared = pathsToIds(await schema(KIND[kind].schema))
      .map((p) => p.join('/'))
      // The record's own id is what a rename changes, not a reference to one;
      // `aliases` holds its former ones, which the tool appends to rather
      // than rewrites.
      .filter((p) => !own.has(p) && p !== `aliases/${ITEM}`);
    const known = new Set([
      ...REFERENCES[kind].map((r) => r.at.join('/')),
      ...(VOCABULARY_FIELDS[kind] ?? []),
    ]);
    for (const field of declared) {
      assert.ok(known.has(field), `${kind}: /${field} is an id in the schema and is in no table`);
    }
    // And nothing in the table is a field the schema does not have: a row
    // left behind by a renamed field would silently rewrite nothing. The two
    // envelope rows are exempt, because a kind may not carry the field at
    // all — a source cites nothing, so `schema/v1/source.json` declares no
    // `sources`, and the row is simply matched by no source record.
    const properties = new Set(Object.keys((await schema(KIND[kind].schema)).properties ?? {}));
    const envelope = new Set(['supersededBy', `sources/${ITEM}/source`]);
    for (const row of REFERENCES[kind]) {
      if (envelope.has(row.at.join('/'))) continue;
      assert.ok(properties.has(row.at[0]), `${kind}: /${row.at.join('/')} is in the table and not in the schema`);
    }
  }

  // The envelope's two are on every kind, and the narrative step is the one
  // reference whose kind the id decides rather than the field.
  for (const kind of KINDS) {
    const at = REFERENCES[kind].map((r) => r.at.join('/'));
    assert.ok(at.includes('supersededBy'), kind);
    assert.ok(at.includes(`sources/${ITEM}/source`), kind);
  }
  assert.equal(REFERENCES.narrative.find((r) => r.at[0] === 'steps').to, ANY_KIND);

  // A full entry's citation marks and links by id are references too, and
  // they are in prose rather than in a field of their own: rule 23 checks
  // them, so `rewriteReferences` moves them, and the kinds that carry one are
  // the registry's.
  for (const kind of kindsWhere('body')) {
    const properties = (await schema(KIND[kind].schema)).properties ?? {};
    assert.ok(Object.hasOwn(properties, BODY_FIELD), `${kind} carries a body and the schema does not declare one`);
  }

  // The import files are keyed by the `kind` field tools/lib/read.mjs
  // dispatches on, and every one of those kinds has a row.
  assert.deepEqual(Object.keys(IMPORT_REFERENCES).sort(), Object.keys(IMPORT_SCHEMAS).sort());
});

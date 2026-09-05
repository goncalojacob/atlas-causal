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
  EDGE_ID, RELATION_ID, FOCUS, GROUPS, FOCUS_KINDS,
  RELATION_ENDPOINTS, RELATION_GROUP_ORDER, ACYCLIC_RELATION_TYPES,
} from '../src/vocab.js';
import { KIND_DIRS as READ_KIND_DIRS } from '../tools/lib/read.mjs';
import { SCHEMA_FILES, TOOL_SIDE } from '../src/validate/schemas.js';
import { CARDS, OPENINGS } from '../src/state.js';
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

  // The id patterns are built from the type lists; the schemas write theirs
  // out. Same types, in the same order, in all four places.
  assert.deepEqual(typesInPattern(edge.properties.id.pattern), [...EDGE_TYPE_IDS]);
  assert.deepEqual(typesInPattern(relation.properties.id.pattern), [...RELATION_TYPE_IDS]);
  const step = narrative.properties.steps.items.properties.ref.pattern;
  assert.deepEqual(typesInPattern(step), [...EDGE_TYPE_IDS]);

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

  // The lens's three kinds are kinds, its pattern accepts exactly them, and
  // the four groupings are the lens kinds plus "none" and "region" — which is
  // a coincidence of the vocabulary and not a rule, so only the shape of each
  // is asserted.
  for (const kind of FOCUS_KINDS) {
    assert.ok(KINDS.includes(kind), kind);
    assert.ok(FOCUS.test(`${kind}:some-id`), kind);
  }
  assert.ok(!FOCUS.test('edge:a--b--caused'));
  assert.equal(GROUPS[0], 'none', 'the default grouping is first');
  assert.equal(new Set(GROUPS).size, GROUPS.length);
});

// The event's own new fields (M30a-3): `parent` and rule 24, `scope`,
// `category`, a role's `note`, `region` gone optional, and the two
// vocabularies that live in data rather than in code.
//
// Every case builds its own synthetic records over the fixture corpus, so the
// one parent, the one scope, the one category and the one role note the
// fixtures carry are never the thing under test; what those are for is that
// the whole pipeline — the index, the spine, the search shard, the review
// digests — is exercised against a corpus that has them.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validate, buildTopology, buildSpine, eventWeights, subtreeWeights,
} from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { readCategories, readRoles } from '../tools/lib/read.mjs';
import { fixtures, schemas, ROOT } from './helpers.mjs';
import { expandSpine } from '../src/data.js';

// The fixtures deliberately carry neither data/roles.json nor
// data/categories.json, which is what makes them the "absent means no check"
// case. A test that wants the vocabularies asks for the repository's own.
const vocabularies = async () => ({
  roles: await readRoles(`${ROOT}/data`),
  categories: await readCategories(`${ROOT}/data`),
});

async function run(mutate = () => {}, options = {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, {
    deriveRegion: createRegionDeriver(fx.polygons),
    ...options,
  });
  return validate(fx.records, topology, await schemas());
}

const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');
const errorsOf = (result, rule) => result.errors.filter((e) => e.rule === rule);
const warningsOf = (result, code) => result.warnings.filter((w) => w.rule === code);
const event = (fx, id) => fx.records.find((r) => r.kind === 'event' && r.id === id);

// --- rule 24: the parent ---------------------------------------------------

test('the fixtures carry a parent with two children, and nothing complains', async () => {
  const r = await run();
  assert.equal(r.errors.length, 0, messages(r));
  const fx = await fixtures();
  const parent = event(fx, 'fixture-event-f');
  assert.ok(parent, 'the fixture parent');
  const children = fx.records.filter((x) => x.kind === 'event' && x.parent === 'fixture-event-f');
  assert.deepEqual(children.map((c) => c.id).sort(), ['fixture-event-h', 'fixture-event-t']);
  assert.equal(parent.scope, 'regional');
  assert.equal(parent.category, 'war');
});

test('a parent that is not an event is rule 24', async () => {
  const r = await run((fx) => { event(fx, 'fixture-event-h').parent = 'fixture-actor-one'; });
  const hit = errorsOf(r, 24);
  assert.equal(hit.length, 1, messages(r));
  assert.match(hit[0].message, /is not an event record/);
  assert.equal(hit[0].path, '/parent');
});

test('an active event may not be part of a tombstone', async () => {
  const r = await run((fx) => { event(fx, 'fixture-event-h').parent = 'fixture-event-m'; });
  const hit = errorsOf(r, 24);
  assert.equal(hit.length, 1, messages(r));
  assert.match(hit[0].message, /cannot be part of the merged event/);
});

test('an event that is its own parent, and a chain that closes on itself, are both rule 24', async () => {
  const own = await run((fx) => { event(fx, 'fixture-event-h').parent = 'fixture-event-h'; });
  assert.equal(errorsOf(own, 24).length, 1);
  assert.match(errorsOf(own, 24)[0].message, /cannot be part of itself/);

  // f → h → t → f, a three-hop cycle: every record on it is under validation,
  // so every one of them reports it.
  const ring = await run((fx) => {
    event(fx, 'fixture-event-f').parent = 'fixture-event-h';
    event(fx, 'fixture-event-h').parent = 'fixture-event-t';
    event(fx, 'fixture-event-t').parent = 'fixture-event-f';
  });
  assert.equal(errorsOf(ring, 24).length, 3, messages(ring));
  for (const e of errorsOf(ring, 24)) assert.match(e.message, /cannot be part of itself/);
});

test('a child dated outside its parent is a warning and not an error', async () => {
  const r = await run((fx) => { event(fx, 'fixture-event-h').when = { start: 1900, end: 1900 }; });
  assert.equal(errorsOf(r, 24).length, 0, messages(r));
  const warned = warningsOf(r, 'child-outside-parent');
  assert.equal(warned.length, 1);
  assert.equal(warned[0].id, 'fixture-event-h');
});

test('a parent never enters the adjacency: rules 4 and 5 do not see it', async () => {
  // An event of 1200 declared part of one that begins in 1290. An *edge* that
  // way round is rule 4's arrow of time; `parent` is a display fact and says
  // nothing about what caused what, so rule 4 has no opinion and the dates
  // are the named warning instead.
  const backwards = await run((fx) => { event(fx, 'fixture-event-a').parent = 'fixture-event-h'; });
  assert.equal(errorsOf(backwards, 4).length, 0, messages(backwards));
  assert.deepEqual(warningsOf(backwards, 'child-outside-parent').map((w) => w.id), ['fixture-event-a']);

  // And a ring of parents is rule 24's error, never rule 5's: the DAG rule is
  // about the edge graph, which a parent is not part of.
  const ring = await run((fx) => {
    event(fx, 'fixture-event-f').parent = 'fixture-event-h';
    event(fx, 'fixture-event-h').parent = 'fixture-event-t';
    event(fx, 'fixture-event-t').parent = 'fixture-event-f';
  });
  assert.equal(errorsOf(ring, 5).length, 0, messages(ring));
});

// --- the two vocabularies --------------------------------------------------

// M32b-1: the warning became rule 25. The shape is the warning's — one a
// record, naming the roles, active events only — and only the level moved.
test('a role outside data/roles.json is rule 25, once a record and naming the roles', async () => {
  const { roles } = await vocabularies();
  const r = await run((fx) => {
    event(fx, 'fixture-event-b').actors = [
      { actor: 'fixture-actor-one', role: 'a role nobody approved' },
      { actor: 'fixture-actor-two', role: 'another one nobody approved' },
      { actor: 'fixture-actor-one', role: 'leader' },
    ];
  }, { roles });
  const refused = errorsOf(r, 25).filter((e) => e.id === 'fixture-event-b');
  assert.equal(refused.length, 1, 'one error a record, not one a line');
  assert.equal(refused[0].path, '/actors');
  assert.match(refused[0].message, /"a role nobody approved", "another one nobody approved"/);
  assert.doesNotMatch(refused[0].message, /"leader"/);
  // And nothing warns about it any more: the code is gone, not doubled up.
  assert.deepEqual(warningsOf(r, 'role-unknown'), []);
  assert.deepEqual(r.errors.filter((e) => e.rule !== 25), [], messages(r));
});

// A tombstone written before the list closed is a record of what the atlas
// used to say. Refusing to validate it would mean editing history, so rule 25
// is the warning's scope exactly: active events, and nothing else.
test('rule 25 is active events only, and says nothing about any other kind', async () => {
  const { roles } = await vocabularies();
  const retracted = await run((fx) => {
    const e = event(fx, 'fixture-event-b');
    e.actors = [{ actor: 'fixture-actor-one', role: 'a role nobody approved' }];
    e.status = 'retracted';
    e.retraction = { on: '2026-09-06', reason: 'Withdrawn in a test, and the role it carries is not rule 25\'s business.' };
    e.review = undefined;
  }, { roles });
  assert.deepEqual(errorsOf(retracted, 25), [], messages(retracted));
});

test('a category outside data/categories.json is a warning, and one inside it is not', async () => {
  const { categories } = await vocabularies();
  const bad = await run((fx) => { event(fx, 'fixture-event-b').category = 'not-a-category'; }, { categories });
  assert.deepEqual(warningsOf(bad, 'category-unknown').map((w) => w.id), ['fixture-event-b']);
  assert.equal(bad.errors.length, 0, messages(bad));

  const good = await run((fx) => { event(fx, 'fixture-event-b').category = 'treaty'; }, { categories });
  assert.deepEqual(warningsOf(good, 'category-unknown'), []);
});

// Amendment A8, in one test: an absent list means no check at all, never an
// empty closed set. The fixtures have no vocabulary files, so the same corpus
// that warns above says nothing here.
test('a dataset with no vocabulary is not a dataset whose every role is wrong', async () => {
  const mutate = (fx) => {
    event(fx, 'fixture-event-b').actors = [{ actor: 'fixture-actor-one', role: 'a role nobody approved' }];
    event(fx, 'fixture-event-b').category = 'not-a-category';
  };
  const absent = await run(mutate);
  assert.deepEqual(warningsOf(absent, 'role-unknown'), []);
  assert.deepEqual(warningsOf(absent, 'category-unknown'), []);
  // The half that matters now that the role is rule 25: an absent list is not
  // an empty closed set, so a fork with no `data/roles.json` is not a fork
  // whose every event is refused. This is the one property easiest to lose
  // when a warning becomes an error (amendments A8 and A7).
  assert.deepEqual(errorsOf(absent, 25), [], messages(absent));
  assert.equal(absent.errors.length, 0, messages(absent));

  // And with the list carried, the same corpus is refused: it is the presence
  // of the vocabulary that decides, not the record.
  const { roles: closed } = await vocabularies();
  const checked = await run(mutate, { roles: closed });
  assert.deepEqual(errorsOf(checked, 25).map((e) => e.id), ['fixture-event-b']);

  // And the topology carries neither key rather than carrying an empty one,
  // which is what the manifest and the browser read.
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  assert.equal(Object.hasOwn(topology, 'rolesAllowed'), false);
  assert.equal(Object.hasOwn(topology, 'categoriesAllowed'), false);
  const { roles, categories } = await vocabularies();
  const carried = buildTopology(fx.records, fx.regions, { roles, categories });
  assert.deepEqual(carried.rolesAllowed, roles);
  assert.deepEqual(carried.categoriesAllowed, categories);
});

test('the 31 roles are the list the owner approved, and the categories the twelve of decision 13', async () => {
  const { roles, categories } = await vocabularies();
  assert.equal(roles.length, 31);
  assert.equal(categories.length, 12);
  for (const list of [roles, categories]) {
    const ids = list.map((entry) => entry.id);
    assert.deepEqual([...new Set(ids)], ids, 'no id twice');
    for (const entry of list) {
      assert.match(entry.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.equal(typeof entry.label, 'string');
      assert.ok(entry.description.length > 0, entry.id);
    }
  }
  assert.deepEqual(categories.map((c) => c.id), [
    'war', 'treaty', 'election', 'revolution', 'law', 'founding',
    'disaster', 'economy', 'culture', 'science', 'death', 'other',
  ]);
});

// --- region optional, and the lane that is then missing --------------------

test('an event with neither a place nor a region is a warning now, not an error', async () => {
  const r = await run((fx) => {
    const e = event(fx, 'fixture-event-b');
    e.place = null;
    e.region = null;
  });
  assert.equal(r.errors.filter((e) => e.rule === 10).length, 0, messages(r));
  assert.deepEqual(warningsOf(r, 'no-lane').map((w) => w.id), ['fixture-event-b']);
});

test('a placeless event that names its lane is drawn in it and says nothing', async () => {
  const r = await run((fx) => {
    const e = event(fx, 'fixture-event-b');
    e.place = null;
    e.region = 'fixture-lane-1';
  });
  assert.deepEqual(warningsOf(r, 'no-lane'), []);
  assert.equal(r.errors.length, 0, messages(r));
});

// --- the note beside a role ------------------------------------------------

test('a role carries a note, and the note reaches the topology and the spine', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const withNote = topology.events.find((e) => (e.actors ?? []).some((a) => typeof a.note === 'string'));
  assert.equal(withNote.id, 'fixture-event-t');
  assert.deepEqual(withNote.actors, [
    { actor: 'fixture-actor-two', role: 'signatory', note: 'signed it for the synthetic party' },
  ]);
  // A line with no note carries no key, rather than a null nothing draws.
  const plain = topology.events.find((e) => e.id === 'fixture-event-a');
  assert.deepEqual(plain.actors, [{ actor: 'fixture-actor-one', role: 'leader' }]);

  // Rows since I2, read back through the one decoder (index2-plan, D3).
  const spine = expandSpine(buildSpine(topology));
  const inSpine = spine.events.find((e) => e.id === 'fixture-event-t');
  assert.equal(inSpine.actors[0].note, 'signed it for the synthetic party');
  assert.equal(inSpine.parent, 'fixture-event-f');
});

// --- what the index derives from a parent ----------------------------------

test('the three fields reach the topology and the spine, and only where a record has them', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const parent = topology.events.find((e) => e.id === 'fixture-event-f');
  assert.equal(parent.scope, 'regional');
  assert.equal(parent.category, 'war');
  assert.equal(Object.hasOwn(parent, 'parent'), false);
  const child = topology.events.find((e) => e.id === 'fixture-event-h');
  assert.equal(child.parent, 'fixture-event-f');
  for (const key of ['scope', 'category']) assert.equal(Object.hasOwn(child, key), false, key);
  const spine = expandSpine(buildSpine(topology));
  const plain = spine.events.find((e) => e.id === 'fixture-event-a');
  for (const key of ['parent', 'scope', 'category', 'subtreeWeight']) {
    assert.equal(Object.hasOwn(plain, key), false, `${key} is absent where there is none`);
  }
});

test('subtreeWeight sums the parts, leaves weight alone, and is absent on a leaf', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const byId = Object.fromEntries(topology.events.map((e) => [e.id, e]));
  const parent = byId['fixture-event-f'];
  const children = ['fixture-event-h', 'fixture-event-t'];
  assert.equal(parent.subtreeWeight, parent.weight + children.reduce((n, id) => n + byId[id].weight, 0));
  for (const id of children) assert.equal(Object.hasOwn(byId[id], 'subtreeWeight'), false, id);
  // `weight` is what it always was: the parent's own edges and actors.
  const alone = eventWeights(topology.events, topology.edges);
  for (const event of topology.events) assert.equal(event.weight, alone.get(event.id), event.id);
});

test('subtreeWeights adds a grandchild to both of its ancestors, and survives a cycle', async () => {
  const events = [
    { id: 'a', parent: null },
    { id: 'b', parent: 'a' },
    { id: 'c', parent: 'b' },
    { id: 'lonely', parent: null },
  ];
  const weights = new Map([['a', 1], ['b', 2], ['c', 4], ['lonely', 8]]);
  const sums = subtreeWeights(events, weights);
  assert.equal(sums.get('a'), 7);
  assert.equal(sums.get('b'), 6);
  assert.equal(sums.get('c'), 4);
  assert.equal(sums.get('lonely'), 8);
  // A cycle is rule 24's error and never reaches a committed index; what this
  // says is that computing the number over one anyway ends (amendment A11).
  const ring = subtreeWeights(
    [{ id: 'x', parent: 'y' }, { id: 'y', parent: 'x' }],
    new Map([['x', 1], ['y', 2]]),
  );
  assert.equal(ring.get('x'), 3);
  assert.equal(ring.get('y'), 3);
});

test('the offices are joined to the events and to their own strips', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  // One office, its holders in the order they held it: by the year each
  // began, then by id.
  assert.deepEqual(topology.tenuresByOffice, {
    'fixture-office-one': ['fixture-tenure-one', 'fixture-tenure-two', 'fixture-tenure-three'],
    'leadership-of-fixture-actor-two': ['fixture-actor-one-fixture-actor-two-1210'],
  });
  // And the other direction: the turn that was running when an event that
  // names the holder happened. Event A is 1200, inside the first tenure
  // alone; event B is 1220, the last year of the second and inside the
  // party leadership as well. Sorted by id, and no line for an event that
  // names nobody who held anything.
  assert.deepEqual(topology.officesByEvent, {
    'fixture-event-a': ['fixture-tenure-one'],
    'fixture-event-b': ['fixture-actor-one-fixture-actor-two-1210', 'fixture-tenure-two'],
  });
});

test('an open tenure covers every later year, and a tombstone joins nothing', async () => {
  const open = await fixtures();
  const tenure = open.records.find((r) => r.id === 'fixture-tenure-three');
  tenure.when = { start: 1230, end: null };
  const joined = buildTopology(open.records, open.regions).officesByEvent;
  // Event B (1220) is still outside it; an event of 1230 or later that named
  // the holder would be inside it for ever after.
  assert.deepEqual(joined['fixture-event-b'], ['fixture-actor-one-fixture-actor-two-1210', 'fixture-tenure-two']);

  const withdrawn = await fixtures();
  for (const r of withdrawn.records) {
    if (r.kind === 'tenure') {
      r.status = 'retracted';
      r.retraction = { on: '2026-01-02', reason: 'Synthetic: withdrawn inside a test and never on disk.' };
    }
  }
  const none = buildTopology(withdrawn.records, withdrawn.regions);
  assert.deepEqual(none.officesByEvent, {});
  assert.deepEqual(none.tenuresByOffice, {});
});

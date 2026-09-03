// The relation kind: what the topology carries, rule 19 — the endpoints
// table, the two different actors, acyclicity per type — and the reach of
// rules 2, 3, 6, 11, 12 and 15 into it. Every case builds its own synthetic
// relation over the fixture actors, so the three relations the fixtures carry
// are never the thing under test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { RELATION_ID, RELATION_TYPES, RELATION_ENDPOINTS } from '../src/validate/rules.js';
import { fixtures, schemas } from './helpers.mjs';

function relation(from, to, type, overrides = {}) {
  return {
    schema: 1,
    id: `${from}--${to}--${type}`,
    kind: 'relation',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: 'Fixture Author', github: 'fixture-author' }],
    license: 'CC-BY-SA-4.0',
    created: '2026-01-01',
    revised: null,
    sources: [{ source: 'fixture-source-1', locator: null }],
    from,
    to,
    type,
    when: { start: 1200, end: 1240 },
    note: null,
    ...overrides,
  };
}

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const rulesHit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

test('the id pattern is the edge shape with its own closed vocabulary', () => {
  assert.ok(RELATION_ID.test('estado-novo--portugal--regime-of'));
  assert.ok(RELATION_TYPES.every((t) => RELATION_ID.test(`a--b--${t}`)));
  // An edge type is not a relation type, and neither is a plausible invention.
  for (const type of ['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired', 'related-to', 'part']) {
    assert.equal(RELATION_ID.test(`a--b--${type}`), false, type);
  }
  assert.equal(RELATION_ID.test('a--b'), false);
  assert.equal(RELATION_ID.test('../../etc--b--led'), false);
});

test('a relation reaches the topology whole, note and all', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const byId = Object.fromEntries(topology.relations.map((r) => [r.id, r]));
  const one = byId['fixture-polity-four--fixture-polity-three--regime-of'];
  assert.equal(one.from, 'fixture-polity-four');
  assert.equal(one.to, 'fixture-polity-three');
  assert.equal(one.type, 'regime-of');
  assert.deepEqual(one.when, { start: 1120, end: 1260 });
  // The note comes with it: an actor's card draws every relation it stands in
  // without fetching one record each.
  assert.match(one.note, /^Synthetic/);
  assert.equal(byId['fixture-actor-one--fixture-actor-two--member-of'].note, null);
  assert.equal(topology.relations.length, 3);
  // Sorted by id like every other list in the index.
  assert.deepEqual([...topology.relations].map((r) => r.id).sort(), topology.relations.map((r) => r.id));
});

test('rule 2: the id is derived from from, to and type', async () => {
  let r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { id: 'fixture-actor-one--fixture-polity-three--led' })); });
  assert.match(rulesHit(r, 2)[0].message, /must be derived from its fields/);
  // An id that is not even the right shape is caught by the schema's own
  // pattern, before the rules see the record at all.
  r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { id: 'not-an-id' })); });
  assert.equal(rulesHit(r, 1)[0].path, '/id', messages(r));
});

test('rule 3: both ends resolve to actor records', async () => {
  const r = await run((fx) => { fx.records.push(relation('fixture-event-a', 'fixture-nobody', 'member-of')); });
  const hits = rulesHit(r, 3);
  // An event is not an actor, and an id that names nothing is not one either.
  assert.ok(hits.some((e) => e.path === '/from'), messages(r));
  assert.ok(hits.some((e) => e.path === '/to'), messages(r));
});

test('rule 6 and rule 12: a relation cites, and is CC BY-SA', async () => {
  let r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { sources: [] })); });
  assert.equal(rulesHit(r, 6).length, 1, messages(r));
  r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { license: 'CC-BY-NC-SA-4.0' })); });
  assert.equal(rulesHit(r, 12).length, 1, messages(r));
});

test('rule 15: a relation\'s years are years', async () => {
  let r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { when: { start: 0, end: 1240 } })); });
  assert.equal(rulesHit(r, 15)[0].path, '/when/start');
  r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { when: { start: 1240, end: 1200 } })); });
  assert.equal(rulesHit(r, 15)[0].path, '/when/end');
});

test('rule 19: two different actors', async () => {
  const r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-actor-one', 'member-of')); });
  assert.equal(rulesHit(r, 19).length, 1, messages(r));
  assert.equal(rulesHit(r, 19)[0].path, '/to');
});

test('rule 19: which kind of actor may stand at each end', async () => {
  // A person is not a regime of anything, which is the case the brief names.
  let r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'regime-of')); });
  assert.equal(rulesHit(r, 19)[0].path, '/from', messages(r));
  // An institution is not a state, so nothing is a regime of it.
  r = await run((fx) => { fx.records.push(relation('fixture-polity-four', 'fixture-actor-two', 'regime-of')); });
  assert.equal(rulesHit(r, 19)[0].path, '/to', messages(r));
  // A body is part-of; a person is member-of. Neither takes the other's type.
  r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-actor-two', 'part-of')); });
  assert.equal(rulesHit(r, 19).length, 1, messages(r));
  r = await run((fx) => { fx.records.push(relation('fixture-actor-two', 'fixture-polity-three', 'member-of')); });
  assert.equal(rulesHit(r, 19).length, 1, messages(r));
  // And the passing cases really pass.
  r = await run((fx) => {
    fx.records.push(relation('fixture-actor-two', 'fixture-polity-three', 'part-of'));
    fx.records.push(relation('fixture-actor-one', 'fixture-polity-four', 'led'));
    fx.records.push(relation('fixture-polity-three', 'fixture-polity-four', 'allied-with'));
  });
  assert.equal(r.errors.length, 0, messages(r));
  // The table itself covers every type in the enum: a type with no row would
  // be checked by nothing.
  assert.deepEqual(Object.keys(RELATION_ENDPOINTS).sort(), [...RELATION_TYPES].sort());
});

test('rule 19: a succession runs between two actors of the same kind', async () => {
  let r = await run((fx) => { fx.records.push(relation('fixture-polity-four', 'fixture-actor-two', 'succeeded')); });
  assert.equal(rulesHit(r, 19).length, 1, messages(r));
  r = await run((fx) => { fx.records.push(relation('fixture-polity-four', 'fixture-polity-three', 'succeeded', { when: { start: 1260, end: 1260 } })); });
  assert.equal(r.errors.length, 0, messages(r));
});

test('rule 19: regime-of and succeeded are acyclic, each on its own', async () => {
  // Two regimes of each other is a mistake in the data.
  let r = await run((fx) => {
    fx.records.push(relation('fixture-polity-three', 'fixture-polity-four', 'regime-of'));
    fx.records.push(relation('fixture-polity-four', 'fixture-polity-three', 'regime-of', { id: 'fixture-polity-four--fixture-polity-three--regime-of' }));
  });
  assert.ok(rulesHit(r, 19).some((e) => /closes on itself/.test(e.message)), messages(r));
  // Acyclicity is per type: the same pair under two different types is not a
  // cycle, because neither line closes.
  r = await run((fx) => {
    fx.records.push(relation('fixture-polity-three', 'fixture-polity-four', 'succeeded', { when: { start: 1260, end: 1260 } }));
  });
  assert.equal(r.errors.length, 0, messages(r));
  // A retracted relation is not in the line either.
  r = await run((fx) => {
    fx.records.push(relation('fixture-polity-three', 'fixture-polity-four', 'regime-of', { status: 'retracted' }));
  });
  assert.equal(rulesHit(r, 19).length, 0, messages(r));
});

test('rule 11 and the warnings a relation moves', async () => {
  // An actor standing in a relation is used, even if no event names it.
  let r = await run((fx) => {
    for (const rec of fx.records) {
      if (rec.kind === 'event') rec.actors = (rec.actors ?? []).filter((a) => a.actor !== 'fixture-actor-two');
    }
  });
  assert.equal(r.warnings.filter((w) => w.rule === 'actor-unused').length, 0, JSON.stringify(r.warnings));
  // Dates that cannot both be right are a warning, not an error: the relation
  // and the actor come from two records.
  r = await run((fx) => { fx.records.push(relation('fixture-actor-one', 'fixture-polity-three', 'member-of', { when: { start: 1500, end: 1520 } })); });
  assert.equal(r.errors.length, 0, messages(r));
  assert.equal(r.warnings.filter((w) => w.rule === 'relation-outside-actor-when').length, 1);
  // A retracted relation cannot name an active actor's tombstone either way
  // round: the error is reported on both records.
  r = await run((fx) => { fx.byId['fixture-polity-four'].status = 'retracted'; });
  assert.ok(rulesHit(r, 11).some((e) => e.id === 'fixture-polity-four--fixture-polity-three--regime-of'), messages(r));
});

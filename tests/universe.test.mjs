// The prebuilt universe and the indexes the rules read through it (H4d).
//
// Two things are asserted here and nothing else: that a validation against a
// universe built once says exactly what a validation that builds its own
// says — down to the order of the messages — and that the lookups which
// replaced rule 11's and rule 17's scans still find every referrer they used
// to find. If the second ever drifts from the first, the fast path is
// reporting something else and the numbers in STATUS.md are about a
// different program.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUniverse, checkRules } from '../src/validate/rules.js';
import { validate, buildTopology } from '../src/validate/core.js';
import { createValidator } from '../src/validate/schema.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas, clone } from './helpers.mjs';

const say = (result) => [
  ...result.errors.map((e) => `error ${e.rule} ${e.id}${e.path ?? ''}: ${e.message}`),
  ...result.warnings.map((w) => `warning ${w.rule} ${w.id}: ${w.message}`),
];

async function fixtureAtlas() {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return { fx, topology };
}

test('a prebuilt universe says exactly what building one per call says', async () => {
  const { fx, topology } = await fixtureAtlas();
  const universe = buildUniverse(topology);
  // The whole dataset under validation, which is what the CLI and the index
  // builder do: every topology entry is shadowed by a record.
  assert.deepEqual(
    say(checkRules(fx.records, topology, { universe })),
    say(checkRules(fx.records, topology)),
  );
  // And one record at a time, which is what the form and the editor do.
  for (const record of fx.records) {
    assert.deepEqual(
      say(checkRules([record], topology, { universe })),
      say(checkRules([record], topology)),
      `${record.kind} ${record.id} judged differently against a prebuilt universe`,
    );
  }
});

test('a prebuilt universe is refused when it is not this topology\'s', async () => {
  const { fx, topology } = await fixtureAtlas();
  const other = buildTopology(fx.records.filter((r) => r.kind !== 'edge'), fx.regions);
  // Handed the wrong one, checkRules builds its own rather than answering
  // about an atlas nobody asked about.
  assert.deepEqual(
    say(checkRules(fx.records, topology, { universe: buildUniverse(other) })),
    say(checkRules(fx.records, topology)),
  );
});

test('validate() takes the universe and the validator ready-made', async () => {
  const { fx, topology } = await fixtureAtlas();
  const files = await schemas();
  const plain = validate(fx.records, topology, files);
  const reused = validate(fx.records, topology, files, {
    universe: buildUniverse(topology),
    validator: createValidator(files),
  });
  assert.deepEqual(say(reused), say(plain));
  assert.equal(plain.errors.length, 0, say(plain).join('\n'));
});

test('the form\'s validateBundle says the same thing with the halves reused', async () => {
  const { validateBundle, preparedFor } = await import('../src/contribute/bundle.js');
  const { fx, topology } = await fixtureAtlas();
  const files = await schemas();
  const reuse = preparedFor(topology, files);
  for (const record of fx.records.slice(0, 30)) {
    const bundle = { schema: 1, records: [record] };
    assert.deepEqual(
      say(validateBundle(bundle, topology, files, reuse)),
      say(validateBundle(bundle, topology, files)),
      `${record.kind} ${record.id}`,
    );
  }
  // And a broken one, so the agreement is not just two empty lists.
  const broken = { ...clone(fx.byId['fixture-event-a']), summary: '' };
  const bundle = { schema: 1, records: [broken] };
  const withReuse = validateBundle(bundle, topology, files, reuse);
  assert.ok(withReuse.errors.length > 0);
  assert.deepEqual(say(withReuse), say(validateBundle(bundle, topology, files)));
});

test('rule 11 still finds every referrer of a tombstone', async () => {
  const { fx, topology } = await fixtureAtlas();
  const event = clone(fx.byId['fixture-event-a']);
  event.status = 'retracted';
  const edges = checkRules([event], topology).errors.filter((e) => e.rule === 11);
  assert.ok(edges.length > 0, 'a retracted event with active edges is an error');
  for (const e of edges) assert.match(e.message, /still has an active edge/);

  const actor = clone(fx.byId['fixture-actor-one']);
  actor.status = 'retracted';
  const named = checkRules([actor], topology).errors.filter((e) => e.rule === 11);
  assert.ok(named.some((e) => /active event/.test(e.message)), 'the events that name it');

  const place = clone(fx.byId['fixture-place-a']);
  place.status = 'retracted';
  const stood = checkRules([place], topology).errors.filter((e) => e.rule === 11);
  assert.ok(stood.some((e) => /active event/.test(e.message)), 'the events that stand there');
});

test('an event naming one actor twice is one referrer, not two', () => {
  const actor = { schema: 1, kind: 'actor', id: 'a', status: 'retracted', supersededBy: null, aliases: [] };
  const topology = {
    events: [{
      id: 'e',
      status: 'active',
      actors: [{ actor: 'a', role: 'deposed' }, { actor: 'a', role: 'signatory' }],
    }],
    regions: [],
  };
  const hits = checkRules([actor], topology).errors.filter((e) => e.rule === 11);
  assert.equal(hits.length, 1, 'one event, one message');
  assert.match(hits[0].message, /active event "e"/);
});

test('rule 17 compares two presences only when they carry the same outline', () => {
  const presence = (id, key, start, end) => ({
    schema: 1,
    kind: 'presence',
    id,
    status: 'active',
    supersededBy: null,
    aliases: [],
    actor: 'holder',
    dependencyOf: null,
    dependencyKind: null,
    when: { start, end },
    geometry: { key, files: ['geo/presences/1-2.json'] },
  });
  const topology = {
    presences: [presence('standing', 'outline-one', 1900, 1950)],
    actors: [{ id: 'holder', status: 'active' }],
    regions: [],
  };
  // The same outline over years that overlap: the one pair this rule is for.
  const clash = checkRules([presence('added', 'outline-one', 1940, 1960)], topology)
    .errors.filter((e) => e.rule === 17 && e.path === '/when');
  assert.equal(clash.length, 1);
  assert.match(clash[0].message, /the same outline/);
  // A different outline over the same years is a border that moved, not a
  // mistake, and the grouping must not bring the two together.
  assert.equal(
    checkRules([presence('added', 'outline-two', 1940, 1960)], topology)
      .errors.filter((e) => e.rule === 17 && e.path === '/when').length,
    0,
  );
  // The same outline over years that do not overlap is the same territory
  // held twice, which is ordinary.
  assert.equal(
    checkRules([presence('added', 'outline-one', 1960, 1980)], topology)
      .errors.filter((e) => e.rule === 17 && e.path === '/when').length,
    0,
  );
});

test('a compiled pattern is the same judgement as a fresh one', async () => {
  const validator = createValidator(await schemas());
  assert.deepEqual(validator.schemaErrors, []);
  const record = { id: 'Not A Slug', label: 'x', order: 1 };
  const errors = validator.validate('v1/region.json', record);
  assert.ok(errors.some((e) => e.keyword === 'pattern'), 'the id pattern still fires');
  // Twice, because the compiled RegExp is shared and a stateful one (a `g`
  // flag anywhere) would answer differently the second time.
  assert.deepEqual(validator.validate('v1/region.json', record), errors);
  assert.deepEqual(validator.validate('v1/region.json', { ...record, id: 'a-slug' }), []);
});

// Rule 5, asked the way a page asks it. a → b → d → t is in the fixture set,
// so an edge t → a closes a cycle through four events; the page walks
// forward from the new edge's `to` instead of sweeping the whole graph, and
// has to reach the same verdict, name the same events, and blame the edge
// that was added rather than one that was already there.
test('a new edge that closes a cycle is caught from its own end', async () => {
  const { fx, topology } = await fixtureAtlas();
  const universe = buildUniverse(topology);
  const back = clone(fx.byId['fixture-event-d--fixture-event-t--caused']);
  back.id = 'fixture-event-t--fixture-event-a--caused';
  back.from = 'fixture-event-t';
  back.to = 'fixture-event-a';

  const incremental = checkRules([back], topology, { universe }).errors.filter((e) => e.rule === 5);
  assert.equal(incremental.length, 1);
  assert.equal(incremental[0].id, back.id, 'the edge under validation is the one blamed');
  assert.equal(
    incremental[0].message,
    'the edge graph has a cycle through: fixture-event-a, fixture-event-b, fixture-event-d, fixture-event-t',
  );
  // The sweep, over the same atlas plus the same edge, refuses it too. It
  // does not name the same events, and that is the one place the two paths
  // differ: Kahn's ordering leaves stuck everything it could not reach past
  // the cycle, so the CLI also names `fixture-event-a2`, which is downstream
  // of the cycle and not on it. The walk names the cycle itself, which is
  // what the contributor has to undo.
  const swept = checkRules([...fx.records, back], topology).errors.filter((e) => e.rule === 5);
  assert.equal(swept.length, 1);
  const named = (e) => e.message.replace(/^.*: /, '').split(', ');
  for (const id of named(incremental[0])) assert.ok(named(swept[0]).includes(id), `${id} is in both accounts`);
  assert.deepEqual(named(swept[0]).filter((id) => !named(incremental[0]).includes(id)), ['fixture-event-a2']);

  // An edge onto itself is a cycle of one, and the walk never leaves home.
  const loop = { ...clone(back), id: 'fixture-event-a--fixture-event-a--caused', from: 'fixture-event-a', to: 'fixture-event-a' };
  const alone = checkRules([loop], topology, { universe }).errors.filter((e) => e.rule === 5);
  assert.equal(alone.length, 1);
  assert.match(alone[0].message, /cycle through: fixture-event-a$/);

  // The other direction is not a cycle: a → t is the way the graph already
  // runs, and adding it again closes nothing.
  const forward = { ...clone(back), id: 'fixture-event-a--fixture-event-t--caused', from: 'fixture-event-a', to: 'fixture-event-t' };
  assert.deepEqual(checkRules([forward], topology, { universe }).errors.filter((e) => e.rule === 5), []);

  // A retracted edge is not in the graph, so it cannot close one either.
  assert.deepEqual(
    checkRules([{ ...back, status: 'retracted' }], topology, { universe }).errors.filter((e) => e.rule === 5),
    [],
  );
});

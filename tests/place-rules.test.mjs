// The place kind: what the topology derives from it, rule 18, and the reach
// of rules 3, 6, 10, 11 and 12 into it. Written so it holds both before and
// after tools/migrate-places.mjs has run over the fixtures — every case builds
// its own synthetic place and points a fixture event at it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas } from './helpers.mjs';

const ID = 'fixture-place-test';

// A place at the coordinates fixture event A has always used, so the lane it
// derives is a lane the fixture polygons really cover.
function place(overrides = {}) {
  return {
    schema: 1,
    id: ID,
    kind: 'place',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: 'Fixture Author', github: 'fixture-author' }],
    license: 'CC-BY-SA-4.0',
    created: '2026-01-01',
    revised: null,
    sources: [],
    names: ['Fixture place test', 'Fixtura'],
    where: { lon: -30, lat: 40, precision: 'city', label: 'Fixture place test' },
    region: null,
    summary: null,
    ...overrides,
  };
}

// Adds the place and points fixture event A at it, which is the shape every
// event has after the migration.
function withPlace(overrides = {}, event = {}) {
  return (fx) => {
    fx.records.push(place(overrides));
    Object.assign(fx.byId['fixture-event-a'], { place: ID, region: null }, event);
  };
}

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return { result: validate(fx.records, topology, await schemas()), topology };
}

const hit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

test('an event takes its point and its lane from the place it names', async () => {
  const { result, topology } = await run(withPlace());
  assert.equal(result.errors.length, 0, messages(result));
  const entry = topology.places.find((p) => p.id === ID);
  assert.equal(entry.name, 'Fixture place test');
  assert.deepEqual(entry.names, ['Fixture place test', 'Fixtura']);
  assert.deepEqual(entry.where, { lon: -30, lat: 40, precision: 'city', label: 'Fixture place test' });
  assert.ok(entry.region, 'the place derives a lane from its own point');
  assert.equal(entry.regionMethod, 'inside');

  const event = topology.events.find((e) => e.id === 'fixture-event-a');
  assert.equal(event.place, ID);
  assert.equal(Object.hasOwn(event, 'where'), false, 'the coordinates live on the place, not on the event');
  assert.equal(event.region, entry.region);
  assert.equal(event.regionMethod, entry.regionMethod);
  assert.deepEqual(topology.places.map((p) => p.id), [...topology.places.map((p) => p.id)].sort());
});

test('an override wins over derivation, on the place and then on the event', async () => {
  let r = await run(withPlace({ region: 'fixture-lane-3' }));
  let event = r.topology.events.find((e) => e.id === 'fixture-event-a');
  assert.equal(event.region, 'fixture-lane-3');
  assert.equal(event.regionMethod, 'override');

  // The event's own override is the last word: Tordesillas is about the
  // Americas and was signed in Castile.
  r = await run(withPlace({ region: 'fixture-lane-3' }, { region: 'fixture-lane-2' }));
  event = r.topology.events.find((e) => e.id === 'fixture-event-a');
  assert.equal(event.region, 'fixture-lane-2');
});

test('rule 3: an event\'s place resolves, and to a place', async () => {
  let { result } = await run(withPlace({}, { place: 'nowhere-at-all' }));
  assert.equal(hit(result, 3)[0].path, '/place');
  assert.match(hit(result, 3)[0].message, /is not a place record/);
  // An actor id resolves to something, but not to a place.
  ({ result } = await run(withPlace({}, { place: 'fixture-actor-one' })));
  assert.equal(hit(result, 3).length, 1);
  // And a place's own region has to be a lane.
  ({ result } = await run(withPlace({ region: 'no-such-lane' })));
  assert.equal(hit(result, 3)[0].id, ID);
});

test('rule 6: a place cites nothing, and rule 10 still wants a point on Earth', async () => {
  let { result } = await run(withPlace());
  assert.equal(hit(result, 6).length, 0, 'a place is a geographic fact, exempt like a source');

  ({ result } = await run(withPlace({ where: { lon: 181, lat: 40, precision: 'city', label: 'Off the edge' } })));
  assert.equal(hit(result, 10)[0].path, '/where/lon');

  // An event with no place needs a lane of its own; with one it does not.
  ({ result } = await run((fx) => {
    Object.assign(fx.byId['fixture-event-a'], { place: null, region: null });
  }));
  assert.match(hit(result, 10)[0].message, /region is required when the event has no place/);
});

test('rule 11: an active event cannot stand at a retracted place', async () => {
  const { result } = await run(withPlace({ status: 'retracted' }));
  const eleven = hit(result, 11);
  assert.equal(eleven.length, 2, messages(result));
  assert.ok(eleven.some((e) => e.id === ID && /still referenced by the active event/.test(e.message)));
  assert.ok(eleven.some((e) => e.id === 'fixture-event-a' && e.path === '/place'));
});

test('rule 12: a place is CC BY-SA, like everything else under data/', async () => {
  const { result } = await run(withPlace({ license: 'CC-BY-NC-SA-4.0' }));
  assert.equal(hit(result, 12)[0].path, '/license');
});

test('rule 18: a place has at least one name, and no name twice', async () => {
  let { result } = await run(withPlace({ names: [] }));
  assert.match(hit(result, 18)[0].message, /at least one name/);
  ({ result } = await run(withPlace({ names: ['Fixtura', 'Fixtura'] })));
  assert.equal(hit(result, 18)[0].path, '/names/1');
});

test('a place nothing happened at is a warning, not an error', async () => {
  const { result } = await run((fx) => { fx.records.push(place()); });
  assert.equal(result.errors.length, 0, messages(result));
  assert.ok(result.warnings.some((w) => w.rule === 'place-unused' && w.id === ID));

  // Referenced, and the warning is gone.
  const { result: used } = await run(withPlace());
  assert.equal(used.warnings.filter((w) => w.rule === 'place-unused' && w.id === ID).length, 0);
});

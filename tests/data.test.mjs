import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createAtlas, loadAtlas } from '../src/data.js';
import { FIXTURE_DATA } from './helpers.mjs';

// A fetchJson over the fixture directory, so loadAtlas runs without a
// browser and the on-demand record fetch can be observed.
const calls = [];
async function fetchJson(url) {
  calls.push(url);
  const file = path.join(FIXTURE_DATA, '..', '..', '..', url);
  return JSON.parse(await readFile(file, 'utf8'));
}

test('loadAtlas reads the manifest, both indexes, and record text on demand', async () => {
  calls.length = 0;
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.equal(calls[0], 'tests/fixtures/data/index/manifest.json');
  assert.equal(atlas.events.size, 12);
  assert.equal(atlas.activeEvents.length, 11);
  assert.equal(atlas.sources.size, 4);
  assert.equal(atlas.land, null, 'fixture manifest lists no land');
  assert.deepEqual(atlas.extent, { min: 1200, max: 1300 });
  assert.deepEqual(atlas.regions.map((r) => r.id), ['fixture-lane-1', 'fixture-lane-2', 'fixture-lane-3']);

  const before = calls.length;
  const record = await atlas.record('event', 'fixture-event-a');
  assert.equal(record.summary.startsWith('Synthetic record'), true);
  await atlas.record('event', 'fixture-event-a');
  assert.equal(calls.length, before + 1, 'cached');
  assert.equal(calls[before], 'tests/fixtures/data/events/fixture-event-a.json');
});

test('resolve follows aliases and merged tombstones', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.equal(atlas.resolve('fixture-event-b').record.id, 'fixture-event-b');
  const alias = atlas.resolve('fixture-event-b-old');
  assert.equal(alias.record.id, 'fixture-event-b');
  assert.deepEqual(alias.via, [{ id: 'fixture-event-b-old', reason: 'alias' }]);
  const merged = atlas.resolve('fixture-event-m');
  assert.equal(merged.record.id, 'fixture-event-b');
  assert.deepEqual(merged.via, [{ id: 'fixture-event-m', reason: 'merged' }]);
  assert.equal(atlas.resolve('fixture-source-1').kind, 'source');
  assert.equal(atlas.resolve('fixture-actor-one').kind, 'actor');
  assert.equal(atlas.resolve('nothing-here'), null);
});

test('actors resolve and carry the events they appear in, chronologically', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.equal(atlas.actors.size, 4);
  assert.equal(atlas.actors.get('fixture-actor-one').name, 'Fixture Actor One');
  assert.deepEqual(
    atlas.eventsByActor.get('fixture-actor-one').map((a) => [a.event.id, a.role]),
    [['fixture-event-a', 'leader'], ['fixture-event-b', 'signatory']],
  );
  assert.deepEqual(
    atlas.eventsByActor.get('fixture-actor-two').map((a) => a.event.id),
    ['fixture-event-b', 'fixture-event-t'],
  );
  assert.equal(atlas.events.get('fixture-event-a').actors[0].actor, 'fixture-actor-one');
});

test('createAtlas copes with an empty dataset', () => {
  const atlas = createAtlas({
    manifest: { schema: 1, regions: [], land: [], files: {} },
    topology: { events: [], edges: [] },
    sources: [],
  });
  assert.equal(atlas.extent, null);
  assert.deepEqual(atlas.activeEvents, []);
  assert.equal(atlas.resolve('x'), null);
});

test('the window\'s far end is clamped to the years the outlines cover', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.deepEqual(atlas.presenceCoverage, { from: 1100, to: 1299 });
  assert.equal(atlas.territoryYear(1250), 1250, 'inside the coverage, the year asked for');
  assert.equal(atlas.territoryYear(1400), 1299, 'past it, the last year there is');
  assert.equal(atlas.territoryYear(1000), 1000, 'before it, unchanged — and nothing is drawn');
  assert.equal(atlas.territoryYear(null), null);
  // presencesAt clamps the same way, so the map, the actor card and the
  // band's marker cannot end up disagreeing about which year is drawn.
  assert.deepEqual(atlas.presencesAt(1400).map((p) => p.id), atlas.presencesAt(1299).map((p) => p.id));
  assert.deepEqual(atlas.presencesAt(1000), []);
  assert.deepEqual(atlas.presencesAt(1250).map((p) => p.id), ['fixture-polity-four-1200', 'fixture-polity-three-1100']);
});

test('an atlas with no outlines at all has no coverage and clamps nothing', () => {
  const atlas = createAtlas({
    manifest: { schema: 1, regions: [], land: [], files: {} },
    topology: { events: [], edges: [] },
    sources: [],
  });
  assert.equal(atlas.presenceCoverage, null);
  assert.equal(atlas.territoryYear(1400), 1400);
});

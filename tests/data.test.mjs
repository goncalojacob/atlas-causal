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
  assert.equal(atlas.resolve('nothing-here'), null);
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, writeFile, readdir, readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { canonical, serialize, buildIndex, writeIndex, readIndex, compareIndex } from '../tools/build-index.mjs';
import { runValidation } from '../tools/validate.mjs';
import { buildTopology, eventWeights } from '../src/validate/core.js';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';

async function tempCopyOfFixtures() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-index-'));
  await cp(FIXTURE_DATA, dir, { recursive: true });
  return dir;
}

test('canonical sorts keys recursively by code unit and serialize ends with a newline', () => {
  const text = serialize({ b: 1, a: { z: [{ y: 1, x: 2 }], 'é': 3, Z: 4 } });
  assert.equal(text, '{\n  "a": {\n    "Z": 4,\n    "z": [\n      {\n        "x": 2,\n        "y": 1\n      }\n    ],\n    "é": 3\n  },\n  "b": 1\n}\n');
  assert.deepEqual(Object.keys(canonical({ b: 1, a: 2, B: 3 })), ['B', 'a', 'b']);
});

test('building twice from the same data is byte-identical', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  assert.deepEqual(first.files, second.files);
  assert.deepEqual(Object.keys(first.files).sort(), Object.keys(second.files).sort());
});

test('key order and file order in the source records do not change the bytes', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    const events = path.join(dir, 'events');
    for (const name of await readdir(events)) {
      const record = JSON.parse(await readFile(path.join(events, name), 'utf8'));
      const shuffled = Object.fromEntries(Object.entries(record).reverse());
      await writeFile(path.join(events, name), JSON.stringify(shuffled));
    }
    const shuffledBuild = await buildIndex(dir);
    const reference = await buildIndex(FIXTURE_DATA);
    assert.deepEqual(shuffledBuild.files, reference.files);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manifest names the hashed files, counts, lanes and land', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(built.files['manifest.json']);
  assert.equal(manifest.schema, 1);
  assert.deepEqual(manifest.counts, { events: 12, edges: 10, sources: 4, actors: 4, presences: 3, regions: 3 });
  assert.match(manifest.files.topology, /^index\/topology-[0-9a-f]{12}\.json$/);
  assert.match(manifest.files.sources, /^index\/sources-[0-9a-f]{12}\.json$/);
  assert.ok(Object.hasOwn(built.files, path.basename(manifest.files.topology)));
  assert.equal(manifest.regions[0].id, 'fixture-lane-1');
  assert.deepEqual(manifest.land, []);
  const topology = JSON.parse(built.files[path.basename(manifest.files.topology)]);
  const byId = Object.fromEntries(topology.events.map((e) => [e.id, e]));
  assert.equal(byId['fixture-event-a'].region, 'fixture-lane-1');
  assert.equal(byId['fixture-event-m'].regionMethod, 'nearest');
  assert.equal(byId['fixture-event-o'].regionMethod, 'override');
  assert.equal(Object.hasOwn(byId['fixture-event-a'], 'summary'), false, 'text stays out of the index');
  assert.deepEqual(built.unresolved, []);
});

test('weight counts active edges in and out plus the actors named', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const byId = Object.fromEntries(topology.events.map((e) => [e.id, e]));
  for (const event of topology.events) {
    const degree = topology.edges.filter((e) => e.status === 'active' && (e.from === event.id || e.to === event.id)).length;
    assert.equal(event.weight, degree + (event.actors ?? []).length, event.id);
    assert.ok(Number.isInteger(event.weight) && event.weight >= 0);
  }
  // An event nothing links to and nobody appears in weighs nothing.
  assert.equal(byId['fixture-event-h'].weight, 0);
  // fixture-event-e has one active edge each way and a retracted third: a
  // retracted edge never adds to either end.
  assert.equal(byId['fixture-event-e'].weight, 2);
  const weights = eventWeights(topology.events, topology.edges.filter((e) => e.status === 'active'));
  for (const event of topology.events) assert.equal(weights.get(event.id), event.weight, `${event.id}: inactive edges are not counted`);
});

test('weight is in the built index and does not change between builds', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const name = path.basename(JSON.parse(first.files['manifest.json']).files.topology);
  const events = JSON.parse(first.files[name]).events;
  assert.ok(events.every((e) => Number.isInteger(e.weight)), 'every event in the index carries a weight');
  assert.ok(events.some((e) => e.weight > 0));
  assert.equal(first.files[name], second.files[name]);
});

test('writeIndex removes stale hashed files and the result is fresh', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    await mkdir(path.join(dir, 'index'), { recursive: true });
    await writeFile(path.join(dir, 'index', 'topology-deadbeef0000.json'), '{}\n');
    const built = await buildIndex(dir);
    await writeIndex(dir, built);
    const names = (await readdir(path.join(dir, 'index'))).sort();
    assert.deepEqual(names, Object.keys(built.files).sort());
    assert.deepEqual(compareIndex(await readIndex(dir), built), []);
    await writeFile(path.join(dir, 'index', 'manifest.json'), '{}\n');
    assert.deepEqual(compareIndex(await readIndex(dir), built), ['differs manifest.json']);
    const check = await runValidation(dir, { index: true });
    assert.ok(check.errors.some((e) => e.rule === 16));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the committed fixture index is fresh', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  assert.deepEqual(compareIndex(await readIndex(FIXTURE_DATA), built), []);
});

test('an empty dataset builds a manifest with zero records and validates', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-empty-'));
  try {
    await writeFile(path.join(dir, 'regions.json'), '[]\n');
    const built = await buildIndex(dir);
    assert.deepEqual(JSON.parse(built.files['manifest.json']).counts, { events: 0, edges: 0, sources: 0, actors: 0, presences: 0, regions: 0 });
    await writeIndex(dir, built);
    const result = await runValidation(dir, { index: true });
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the repository data/ validates and its index is fresh', async () => {
  const result = await runValidation(path.join(ROOT, 'data'), { index: true });
  assert.deepEqual(result.errors, [], JSON.stringify(result.errors, null, 1));
});

test('a point with no lane in reach blocks the index', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    const file = path.join(dir, 'events', 'fixture-event-o.json');
    const record = JSON.parse(await readFile(file, 'utf8'));
    record.region = null;
    await writeFile(file, JSON.stringify(record));
    const built = await buildIndex(dir);
    assert.deepEqual(built.unresolved.map((e) => e.id), ['fixture-event-o']);
    const result = await runValidation(dir);
    assert.ok(result.errors.some((e) => e.rule === 10 && e.id === 'fixture-event-o'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

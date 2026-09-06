// The tools reading and computing once instead of twice (H4d).
//
// `validate --index` used to read every record twice, build the topology
// twice, run the rules twice and rasterise every border again on top
// (health review B, finding 5). Handing what is already in hand to the next
// step is only safe if the answer is the same, so what is asserted here is
// exactly that: byte for byte, the same index and the same palette.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTopology, validate } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { buildIndex } from '../tools/build-index.mjs';
import { buildPalette, paletteInputHash } from '../tools/build-palette.mjs';
import { readRecords, readRegions, readRegionPolygons, readRoles, readCategories, readPresenceShards, readPresenceGeometry } from '../tools/lib/read.mjs';
import { ROOT, FIXTURE_DATA, schemas } from './helpers.mjs';

async function readEverything(dataDir) {
  const { entries, problems } = await readRecords(dataDir);
  assert.deepEqual(problems, []);
  const records = entries.map((e) => e.record);
  const regions = await readRegions(dataDir);
  const polygons = await readRegionPolygons(dataDir);
  // Everything tools/validate.mjs reads before it builds the topology, in the
  // same order and with the same arguments: the two vocabularies are part of
  // the topology it hands on, so a reader here that skipped them would be
  // asserting that two different topologies produce one index.
  const topology = buildTopology(records, regions, {
    deriveRegion: polygons ? createRegionDeriver(polygons) : undefined,
    roles: await readRoles(dataDir),
    categories: await readCategories(dataDir),
  });
  const shards = await readPresenceShards(dataDir);
  return { records, regions, polygons, topology, shards };
}

for (const [name, dataDir] of [['the fixtures', FIXTURE_DATA], ['the real dataset', `${ROOT}/data`]]) {
  test(`build-index over ${name} is the same whether or not it is handed what was read`, async () => {
    const { records, regions, topology, shards } = await readEverything(dataDir);
    const { warnings } = validate(records, topology, await schemas());
    const alone = await buildIndex(dataDir);
    const handed = await buildIndex(dataDir, { records, regions, topology, presenceShards: shards, warnings });
    assert.deepEqual(Object.keys(handed.files).sort(), Object.keys(alone.files).sort());
    for (const [file, text] of Object.entries(alone.files)) {
      assert.equal(handed.files[file], text, `${file} differs when the reading is handed on`);
    }
  });

  test(`build-palette over ${name} is the same, and the same again from the memo`, async () => {
    const { records, shards } = await readEverything(dataDir);
    const geometry = await readPresenceGeometry(dataDir, shards);
    const alone = await buildPalette(dataDir);
    const handed = await buildPalette(dataDir, { records, shards, geometry });
    assert.equal(handed, alone);
    // Twice more: the second is the memo answering, and it must answer with
    // the same bytes rather than with the last palette some other dataset
    // left behind.
    assert.equal(await buildPalette(dataDir, { records, shards, geometry }), alone);
    assert.equal(await buildPalette(dataDir), alone);
  });
}

test('the palette\'s input hash moves when the territories do and not otherwise', async () => {
  const dataDir = `${ROOT}/data`;
  const { records, shards } = await readEverything(dataDir);
  const geometry = await readPresenceGeometry(dataDir, shards);
  const presences = records.filter((r) => r.kind === 'presence' && r.status === 'active');
  const hash = paletteInputHash(presences, geometry);
  assert.equal(paletteInputHash(presences, geometry), hash, 'the same inputs, the same hash');
  // The order the presences arrive in is not an input: the palette is sorted.
  assert.equal(paletteInputHash([...presences].reverse(), geometry), hash);
  // A presence held for one more year is a different map.
  const moved = presences.map((p, i) => (i === 0 ? { ...p, when: { ...p.when, start: p.when.start - 1 } } : p));
  assert.notEqual(paletteInputHash(moved, geometry), hash);
  // And so is an outline that changed, even with every record untouched.
  const redrawn = new Map(geometry);
  const first = [...redrawn.keys()][0];
  redrawn.set(first, { ...redrawn.get(first), hash: 'not the bytes that were there' });
  assert.notEqual(paletteInputHash(presences, redrawn), hash);
});

test('a shard is read once and answers both readers', async () => {
  const dataDir = `${ROOT}/data`;
  const shards = await readPresenceShards(dataDir);
  const geometry = await readPresenceGeometry(dataDir, shards);
  assert.ok(shards.length > 0);
  const withKeys = await readPresenceShards(dataDir, { keys: true });
  for (const shard of withKeys) {
    const read = geometry.get(shard.file);
    assert.deepEqual([...shard.keys].sort(), [...read.keys].sort(), `${shard.file}: the feature ids`);
    assert.deepEqual([...read.geometry.keys()].sort(), [...read.keys].sort(), 'one geometry per feature id');
    assert.match(read.hash, /^[0-9a-f]{64}$/);
  }
});

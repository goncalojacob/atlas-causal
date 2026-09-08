// Shared test helpers. Zero dependencies; node --test.

import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createAtlas, createAtlasFromSpine, presencesFromIndex } from '../src/data.js';
import { buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { readSchemaFiles, readRecords, readRegions, readRegionPolygons } from '../tools/lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCHEMA_DIR = path.join(ROOT, 'schema');
export const FIXTURE_DATA = path.join(ROOT, 'tests', 'fixtures', 'data');

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ─── The atlas ─────────────────────────────────────────────────────────────
//
// One way to build one since H3c: out of the spine, which is the only graph
// file the index emits. Between H3a-2 and H3b every suite here ran twice, so
// that the round trip was proved by the assertions those suites already
// make rather than by a hand-written field list (h3a-brief, A12); the second
// build went with the file it read.
//
// What the projection is still checked against is `buildTopology`'s own
// output — `topologyOf` below — which is what `buildSpine` projects and what
// the rules read. That is a shape the index builds in memory on every run
// and no longer writes anywhere.
//
// The sources index is not in the spine; it is read beside it.

// A card fetches the record for its own text. Nothing here does, and a card
// that started to would be asking the network in a unit test.
const refuse = () => Promise.reject(new Error('the atlas fetches record text separately'));

async function indexOf(dataDir) {
  const read = async (rel) => JSON.parse(await readFile(path.join(dataDir, rel), 'utf8'));
  const manifest = await read('index/manifest.json');
  return { manifest, read };
}

// The citer directory off disk, whole. The browser fetches one file when a
// reader opens one source; a test asserting about every source would
// otherwise have to fetch, so the atlas is seeded with the lot (h3a-brief,
// A7). What is proved by seeding is what a card does with the rows, not how
// they arrived — `tests/citers.test.mjs` is where the fetching is held.
export async function citersOnDisk(dataDir) {
  const manifest = JSON.parse(await readFile(path.join(dataDir, 'index', 'manifest.json'), 'utf8'));
  const dir = path.join(dataDir, manifest.files.citers);
  const rows = new Map();
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
    rows.set(file.id, file.citations ?? []);
  }
  return rows;
}

// The presence metadata off disk, whole. Its own file since I1, and the
// browser fetches it when the territory layer first draws; every atlas built
// here is built with `fetchJson: refuse`, so a suite that did not seed it
// would have no territory at all and `spine-loader.test.mjs` would fail on
// I1's own commit (index2 review, finding 5). Seeded exactly as the citers
// are: what is proved by seeding is what a card does with the list, not how
// it arrived — `tests/data.test.mjs` is where the fetching is held.
//
// An empty list where the manifest names no file: that is what says a dataset
// has no presences, and the atlas answers the same way.
export async function presencesOnDisk(dataDir) {
  const manifest = JSON.parse(await readFile(path.join(dataDir, 'index', 'manifest.json'), 'utf8'));
  if (!manifest.files?.presences) return [];
  const file = JSON.parse(await readFile(path.join(dataDir, manifest.files.presences), 'utf8'));
  // Rows over the file's own id table since I2, and read back through the one
  // decoder rather than off the file's keys.
  return presencesFromIndex(file);
}

// The atlas as the site builds it: the spine and the sources index the
// manifest names, with the citer rows and the presences seeded.
export async function atlasOf(dataDir, options = {}) {
  const { manifest, read } = await indexOf(dataDir);
  const [spine, sources, citers, presences] = await Promise.all([
    read(manifest.files.spine), read(manifest.files.sources), citersOnDisk(dataDir), presencesOnDisk(dataDir),
  ]);
  return createAtlasFromSpine({ manifest, spine, sources: sources.sources, citers, presences, fetchJson: refuse, ...options });
}

// The in-memory build the spine is a projection of, read from the records
// themselves: the reference an assertion about the projection is made
// against. No file holds this shape.
export async function topologyOf(dataDir) {
  const { entries, problems } = await readRecords(dataDir);
  if (problems.length) throw new Error(`record problems: ${JSON.stringify(problems)}`);
  const polygons = await readRegionPolygons(dataDir);
  return buildTopology(entries.map((e) => e.record), await readRegions(dataDir), {
    deriveRegion: polygons ? createRegionDeriver(polygons) : undefined,
  });
}

// An atlas over that in-memory build, for the same purpose. `createAtlas` is
// the assembly `createAtlasFromSpine` delegates to once the spine's lists are
// expanded, so this is the atlas with one step of the projection taken out.
export async function atlasFromTopology(dataDir, options = {}) {
  const { manifest, read } = await indexOf(dataDir);
  const [topology, sources, citers] = await Promise.all([
    topologyOf(dataDir), read(manifest.files.sources), citersOnDisk(dataDir),
  ]);
  return createAtlas({ manifest, topology, sources: sources.sources, citers, fetchJson: refuse, ...options });
}

let schemaCache = null;
export async function schemas() {
  if (!schemaCache) schemaCache = await readSchemaFiles(SCHEMA_DIR);
  return clone(schemaCache);
}

// The synthetic fixture dataset: every record, the lane list and the lane
// polygons. Fresh copies each call, so tests may mutate freely.
export async function fixtures() {
  const { entries, problems } = await readRecords(FIXTURE_DATA);
  if (problems.length) throw new Error(`fixture problems: ${JSON.stringify(problems)}`);
  const records = entries.map((e) => e.record);
  const regions = await readRegions(FIXTURE_DATA);
  const polygons = await readRegionPolygons(FIXTURE_DATA);
  const byId = Object.fromEntries(records.map((r) => [r.id, r]));
  return { records, regions, polygons, byId, entries };
}

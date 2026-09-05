// Shared test helpers. Zero dependencies; node --test.

import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createAtlas, createAtlasFromSpine } from '../src/data.js';
import { readSchemaFiles, readRecords, readRegions, readRegionPolygons } from '../tools/lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCHEMA_DIR = path.join(ROOT, 'schema');
export const FIXTURE_DATA = path.join(ROOT, 'tests', 'fixtures', 'data');

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ─── The two ways to build an atlas ────────────────────────────────────────
//
// From the topology, as every page does today, and from the spine, as H3b
// will. Every suite that builds a real atlas runs over both: the round trip
// is then proved by the assertions those suites already make — every field a
// card, a lane, a query or a rule reads — rather than by a hand-written list
// of fields, which drifts (docs/health/h3a-brief.md, A12).
//
// The sources index is the same file on both paths; it is not in the spine.

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

export async function atlasFromTopology(dataDir, options = {}) {
  const { manifest, read } = await indexOf(dataDir);
  const [topology, sources, citers] = await Promise.all([
    read(manifest.files.topology), read(manifest.files.sources), citersOnDisk(dataDir),
  ]);
  return createAtlas({ manifest, topology, sources: sources.sources, citers, fetchJson: refuse, ...options });
}

export async function atlasFromSpine(dataDir, options = {}) {
  const { manifest, read } = await indexOf(dataDir);
  const [spine, sources, citers] = await Promise.all([
    read(manifest.files.spine), read(manifest.files.sources), citersOnDisk(dataDir),
  ]);
  return createAtlasFromSpine({ manifest, spine, sources: sources.sources, citers, fetchJson: refuse, ...options });
}

// `for (const [label, buildAtlas] of ATLAS_BUILDS)` — the label goes in the
// test's name, so a failure says which of the two files it came from.
export const ATLAS_BUILDS = Object.freeze([
  Object.freeze(['the topology', atlasFromTopology]),
  Object.freeze(['the spine', atlasFromSpine]),
]);

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

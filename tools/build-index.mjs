#!/usr/bin/env node
// Writes data/index/: manifest.json (never cached) plus topology-<hash>.json
// and sources-<hash>.json (immutable, named by content). Deterministic by
// construction — recursive key sort, code-unit comparison, two-space
// indent, trailing newline — so the deploy job can assert that main's
// committed index is byte-identical to a fresh build.
//
//   node tools/build-index.mjs [--data <dir>]

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildTopology, rolesInUse } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { readRecords, readRegions, readRegionPolygons, readLandFiles, readPresenceShards } from './lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
const HASHED = /^(topology|sources)-[0-9a-f]{12}\.json$/;

// Deep copy with keys sorted by UTF-16 code unit (Array.prototype.sort's
// default), never by locale.
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

export function serialize(value) {
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

export function hashOf(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
}

// Builds the index in memory. Returns the file map, the topology, and the
// active events whose region could not be derived (a build with those is
// not written: the timeline would have nowhere to put them).
export async function buildIndex(dataDir = DEFAULT_DATA) {
  const { entries, problems } = await readRecords(dataDir);
  if (problems.length) {
    throw new Error(problems.map((p) => `${p.file}: ${p.message}`).join('\n'));
  }
  const records = entries.map((e) => e.record);
  const regions = await readRegions(dataDir);
  const polygons = await readRegionPolygons(dataDir);
  const land = await readLandFiles(dataDir);
  const presenceShards = await readPresenceShards(dataDir);
  const deriveRegion = polygons ? createRegionDeriver(polygons) : undefined;
  const topology = buildTopology(records, regions, { deriveRegion });

  const topologyText = serialize({
    schema: 1,
    events: topology.events,
    edges: topology.edges,
    actors: topology.actors,
    presences: topology.presences,
    places: topology.places,
  });
  const sourcesText = serialize({ schema: 1, sources: topology.sources });
  const topologyName = `topology-${hashOf(topologyText)}.json`;
  const sourcesName = `sources-${hashOf(sourcesText)}.json`;
  const manifest = serialize({
    schema: 1,
    counts: {
      events: topology.events.length,
      edges: topology.edges.length,
      sources: topology.sources.length,
      actors: topology.actors.length,
      presences: topology.presences.length,
      places: topology.places.length,
      regions: topology.regions.length,
    },
    files: { topology: `index/${topologyName}`, sources: `index/${sourcesName}` },
    regions: topology.regions,
    // What people actually wrote in `role`, normalised. The vocabulary is
    // open on purpose; this is the evidence for closing it later.
    roles: rolesInUse(topology.events),
    // Paleo-coastlines will list a year range here; the present covers all.
    land: land.map((l) => ({ file: l.file, epoch: l.epoch, from: null, to: null })),
    // The territory shards, in year order. The site loads the one that
    // covers the year on the slider and nothing else.
    presenceShards,
  });

  const unresolved = topology.events.filter((e) => e.status === 'active' && e.place && !e.region);
  return {
    files: { 'manifest.json': manifest, [topologyName]: topologyText, [sourcesName]: sourcesText },
    topology,
    unresolved,
  };
}

export async function readIndex(dataDir = DEFAULT_DATA) {
  const dir = path.join(dataDir, 'index');
  const files = {};
  if (!existsSync(dir)) return files;
  for (const name of (await readdir(dir)).sort()) {
    if (name === 'manifest.json' || HASHED.test(name)) files[name] = await readFile(path.join(dir, name), 'utf8');
  }
  return files;
}

// Differences between what is on disk and a fresh build: [] when fresh.
export function compareIndex(existing, built) {
  const problems = [];
  for (const name of Object.keys(built.files)) {
    if (!Object.hasOwn(existing, name)) problems.push(`missing ${name}`);
    else if (existing[name] !== built.files[name]) problems.push(`differs ${name}`);
  }
  for (const name of Object.keys(existing)) {
    if (!Object.hasOwn(built.files, name)) problems.push(`stale ${name}`);
  }
  return problems;
}

export async function writeIndex(dataDir, built) {
  const dir = path.join(dataDir, 'index');
  await mkdir(dir, { recursive: true });
  for (const name of await readdir(dir)) {
    if (HASHED.test(name) && !Object.hasOwn(built.files, name)) await unlink(path.join(dir, name));
  }
  for (const [name, text] of Object.entries(built.files)) {
    await writeFile(path.join(dir, name), text, 'utf8');
  }
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const built = await buildIndex(dataDir);
  if (built.unresolved.length) {
    for (const e of built.unresolved) {
      console.error(`error: ${e.id}: region could not be derived from its place; set region on the place or on the event`);
    }
    return 1;
  }
  await writeIndex(dataDir, built);
  const c = built.topology;
  console.log(`index written to ${path.relative(process.cwd(), path.join(dataDir, 'index')) || '.'}: ${c.events.length} events, ${c.edges.length} edges, ${c.actors.length} actors, ${c.places.length} places, ${c.presences.length} presences, ${c.sources.length} sources`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

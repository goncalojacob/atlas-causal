// Filesystem access shared by the tools. The validation and index code in
// src/ is pure; everything that touches disk lives here so the same logic
// runs in the browser against fetched files.

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const KIND_DIRS = Object.freeze({ event: 'events', edge: 'edges', source: 'sources', actor: 'actors', presence: 'presences' });
export const PRESENCE_GEO_DIR = 'geo/presences';
export const IMPORTS_DIR = 'imports';

async function readJson(file) {
  const text = await readFile(file, 'utf8');
  return JSON.parse(text);
}

// { 'common/interval.json': {...}, 'v1/event.json': {...}, ... }, keys always
// with forward slashes so $ref resolution is the same on every platform.
export async function readSchemaFiles(schemaDir) {
  const files = {};
  for (const sub of ['common', 'v1']) {
    const dir = path.join(schemaDir, sub);
    if (!existsSync(dir)) continue;
    for (const name of (await readdir(dir)).sort()) {
      if (!name.endsWith('.json')) continue;
      files[`${sub}/${name}`] = await readJson(path.join(dir, name));
    }
  }
  return files;
}

// Every record under data/{events,edges,sources,actors}, with the file it came from,
// so the CLI can check id = file name. Files that are not valid JSON are
// reported as problems rather than thrown, so one bad file does not hide the
// rest.
export async function readRecords(dataDir) {
  const entries = [];
  const problems = [];
  for (const [kind, sub] of Object.entries(KIND_DIRS)) {
    const dir = path.join(dataDir, sub);
    if (!existsSync(dir)) continue;
    for (const name of (await readdir(dir)).sort()) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(dir, name);
      try {
        const record = await readJson(file);
        entries.push({ kind, file: `${sub}/${name}`, record });
      } catch (e) {
        problems.push({ file: `${sub}/${name}`, message: `not valid JSON: ${e.message}` });
      }
    }
  }
  return { entries, problems };
}

// The import maps under data/imports/: how a source's entities become actors
// of this atlas. Not records — no envelope, no kind, and the browser never
// reads them — so they are read here and checked by tools/validate.mjs only.
// A file that is not valid JSON is reported rather than thrown, like a record.
export async function readImportMaps(dataDir) {
  const dir = path.join(dataDir, IMPORTS_DIR);
  const maps = [];
  const problems = [];
  if (!existsSync(dir)) return { maps, problems };
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = `${IMPORTS_DIR}/${name}`;
    try {
      maps.push({ file, name: name.slice(0, -'.json'.length), map: await readJson(path.join(dir, name)) });
    } catch (e) {
      problems.push({ file, message: `not valid JSON: ${e.message}` });
    }
  }
  return { maps, problems };
}

export async function readRegions(dataDir) {
  const file = path.join(dataDir, 'regions.json');
  if (!existsSync(file)) return [];
  return readJson(file);
}

// GeoJSON FeatureCollection with one feature per lane, or null when the
// polygons have not been generated.
export async function readRegionPolygons(dataDir) {
  const file = path.join(dataDir, 'geo', 'regions.json');
  if (!existsSync(file)) return null;
  return readJson(file);
}

// The geometry shards under data/geo/presences/, named <from>-<to>.json, in
// year order: what the manifest lists and what the site loads one of, by
// year. Returns the years and, when `keys` is asked for, the set of feature
// keys each shard holds, so the validator can check a presence's outline is
// really where the record says it is.
export async function readPresenceShards(dataDir, { keys = false } = {}) {
  const dir = path.join(dataDir, 'geo', 'presences');
  if (!existsSync(dir)) return [];
  const shards = [];
  for (const name of (await readdir(dir)).sort()) {
    const m = /^(-?\d+)-(-?\d+)\.json$/.exec(name);
    if (!m) continue;
    const shard = { file: `${PRESENCE_GEO_DIR}/${name}`, from: Number(m[1]), to: Number(m[2]) };
    if (keys) {
      const collection = await readJson(path.join(dir, name));
      shard.keys = new Set((collection.features ?? []).map((f) => f.id));
    }
    shards.push(shard);
  }
  return shards.sort((a, b) => a.from - b.from || a.to - b.to);
}

// Land files are listed in the manifest by epoch. Only the present exists;
// paleo-coastlines are reserved by name in ARCHITECTURE.md.
export async function readLandFiles(dataDir) {
  const dir = path.join(dataDir, 'geo');
  if (!existsSync(dir)) return [];
  return (await readdir(dir))
    .filter((name) => /^land-[a-z0-9-]+\.json$/.test(name))
    .sort()
    .map((name) => ({ file: `geo/${name}`, epoch: name.slice('land-'.length, -'.json'.length) }));
}

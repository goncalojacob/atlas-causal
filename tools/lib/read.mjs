// Filesystem access shared by the tools. The validation and index code in
// src/ is pure; everything that touches disk lives here so the same logic
// runs in the browser against fetched files.

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { migrateRecord } from '../../src/validate/migrate.js';

export const KIND_DIRS = Object.freeze({ event: 'events', edge: 'edges', source: 'sources', actor: 'actors', presence: 'presences', place: 'places', relation: 'relations', narrative: 'narratives' });
export const PRESENCE_GEO_DIR = 'geo/presences';
// Which of the eight territory hues each actor is drawn in; written by
// tools/build-palette.mjs, named in the manifest so the site fetches it only
// where it exists.
export const PALETTE_FILE = 'geo/palette.json';
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
//
// The migration chain is applied here, on the way in, so that the validator,
// the index builder, the local server and the imports all see one shape and
// none of them has to know which version of it is on disk (health review A,
// finding 25). `migrate: false` is for the one caller that must see the bytes
// as they are: tools/migrate/apply.mjs, which is what puts them there.
export async function readRecords(dataDir, { migrate = true } = {}) {
  const entries = [];
  const problems = [];
  for (const [kind, sub] of Object.entries(KIND_DIRS)) {
    const dir = path.join(dataDir, sub);
    if (!existsSync(dir)) continue;
    for (const name of (await readdir(dir)).sort()) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(dir, name);
      try {
        const raw = await readJson(file);
        entries.push({ kind, file: `${sub}/${name}`, record: migrate ? migrateRecord(raw) : raw });
      } catch (e) {
        problems.push({ file: `${sub}/${name}`, message: `not valid JSON: ${e.message}` });
      }
    }
  }
  return { entries, problems };
}

// What the directory held when there was only one kind of file in it: a map
// from a source's entity codes to actors of this atlas. A file that does not
// name its kind is still one of those, so nothing that predates the seeds
// file has to be rewritten to keep validating.
export const DEFAULT_IMPORT_KIND = 'import-map';

// Everything under data/imports/: how a source's entities become actors
// (`import-map`), which items an import is pointed at (`import-seeds`), and
// where a cut-off run stopped (`import-state`). None of them is a record — no
// envelope, no node of the graph, and the browser never reads them — so they
// are read here and checked by tools/validate.mjs only. The `kind` field is
// what says which is which, because the file name is a contributor's choice
// and validating by name would be validating by convention. A file that is
// not valid JSON is reported rather than thrown, like a record.
export async function readImportMaps(dataDir) {
  const dir = path.join(dataDir, IMPORTS_DIR);
  const maps = [];
  const problems = [];
  if (!existsSync(dir)) return { maps, problems };
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = `${IMPORTS_DIR}/${name}`;
    try {
      const map = await readJson(path.join(dir, name));
      const kind = typeof map?.kind === 'string' ? map.kind : DEFAULT_IMPORT_KIND;
      maps.push({ file, name: name.slice(0, -'.json'.length), kind, map });
    } catch (e) {
      problems.push({ file, message: `not valid JSON: ${e.message}` });
    }
  }
  return { maps, problems };
}

// The Wikipedia leads an import has cached, under tools/import/cache/wikipedia/.
// Outside data/ on purpose — they are somebody else's text, not records — but
// still checked by tools/validate.mjs, because a cached quotation with no
// revision behind it is worse than no cache at all.
export async function readCachedLeads(cacheDir) {
  const leads = [];
  const problems = [];
  if (!existsSync(cacheDir)) return { leads, problems };
  for (const name of (await readdir(cacheDir)).sort()) {
    if (!name.endsWith('.json')) continue;
    try {
      leads.push({ file: name, lead: await readJson(path.join(cacheDir, name)) });
    } catch (e) {
      problems.push({ file: name, message: `not valid JSON: ${e.message}` });
    }
  }
  return { leads, problems };
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

// The palette's file name when it is there, null when it is not: a dataset
// with no presences has nothing to colour and the manifest says nothing.
export function paletteFile(dataDir) {
  return existsSync(path.join(dataDir, ...PALETTE_FILE.split('/'))) ? PALETTE_FILE : null;
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

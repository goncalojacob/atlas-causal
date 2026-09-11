// Filesystem access shared by the tools. The validation and index code in
// src/ is pure; everything that touches disk lives here so the same logic
// runs in the browser against fetched files.

import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { migrateRecord } from '../../src/validate/migrate.js';
// The directories are the registry's (src/kinds.js): the browser and the
// tools read the same table, so a kind cannot have one directory in Node and
// another in the atlas.
import { KIND_DIRS, CONTRIBUTED_KINDS } from '../../src/kinds.js';

export { KIND_DIRS, CONTRIBUTED_KINDS };
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

// How many files are in flight at once. One at a time is what made reading
// data/ the slowest part of the validator and of the index build — twenty
// thousand awaits in a row, each waiting for one file (health review B,
// finding 5) — and all of them at once exhausts the descriptor table on a
// directory this size. Sixty-four is well inside every default limit and
// already saturates a local disk.
export const READ_CONCURRENCY = 64;

// map() over batches, in order: the answers come back in the order the items
// were given, so nothing downstream has to sort.
async function mapBounded(items, fn, limit = READ_CONCURRENCY) {
  const out = new Array(items.length);
  for (let i = 0; i < items.length; i += limit) {
    const batch = await Promise.all(items.slice(i, i + limit).map((item, j) => fn(item, i + j)));
    for (let j = 0; j < batch.length; j += 1) out[i + j] = batch[j];
  }
  return out;
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
    const names = (await readdir(dir)).sort().filter((name) => name.endsWith('.json'));
    const read = await mapBounded(names, async (name) => {
      try {
        return { raw: await readJson(path.join(dir, name)) };
      } catch (e) {
        return { message: `not valid JSON: ${e.message}` };
      }
    });
    names.forEach((name, i) => {
      const one = read[i];
      if (one.message) problems.push({ file: `${sub}/${name}`, message: one.message });
      else entries.push({ kind, file: `${sub}/${name}`, record: migrate ? migrateRecord(one.raw) : one.raw });
    });
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

// The two closed vocabularies that live in data rather than in code: what an
// actor did in an event, and what kind of thing an event was. Adding a role
// or a category is an edit to a file somebody can argue with in a pull
// request, never a code change (plan decisions 7 and 13).
//
// `null` and not `[]` when the file is absent, and the difference is the
// whole point: an absent list means the dataset has no vocabulary and
// nothing is checked, while an empty one would mean a closed set with
// nothing in it, under which every role and every category in the atlas is
// unknown. A fork with no data/roles.json is not a fork whose every record
// is wrong (amendment A8).
async function readVocabulary(dataDir, name) {
  const file = path.join(dataDir, name);
  if (!existsSync(file)) return null;
  return readJson(file);
}

export function readRoles(dataDir) {
  return readVocabulary(dataDir, 'roles.json');
}

export function readCategories(dataDir) {
  return readVocabulary(dataDir, 'categories.json');
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
    shards.push({ file: `${PRESENCE_GEO_DIR}/${name}`, from: Number(m[1]), to: Number(m[2]) });
  }
  shards.sort((a, b) => a.from - b.from || a.to - b.to);
  if (!keys) return shards;
  const read = await readPresenceGeometry(dataDir, shards);
  for (const shard of shards) shard.keys = read.get(shard.file)?.keys ?? new Set();
  return shards;
}

// The shards read once, for the three readers that used to read them each:
// the feature ids rule 17 checks against the records, the geometry the
// palette rasterises, and a digest of the bytes, which is what says whether
// the territories have moved since the palette was last built.
//
// Whoever holds the result holds every outline in memory, which is what
// build-palette has always done; nothing else keeps it.
export async function readPresenceGeometry(dataDir, shards) {
  const out = new Map();
  const read = await mapBounded(shards, async (shard) => {
    const text = await readFile(path.join(dataDir, ...shard.file.split('/')), 'utf8');
    const collection = JSON.parse(text);
    return {
      hash: createHash('sha256').update(text, 'utf8').digest('hex'),
      keys: new Set((collection.features ?? []).map((f) => f.id)),
      geometry: new Map((collection.features ?? []).map((f) => [String(f.id), f.geometry])),
    };
  });
  shards.forEach((shard, i) => out.set(shard.file, read[i]));
  return out;
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

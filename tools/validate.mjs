#!/usr/bin/env node
// Validator CLI. Reads data/, builds the topology, runs src/validate/core
// (schemas + rules), adds the checks only the disk can answer — file name
// equals id, kind matches directory, region derivable — and, with --index,
// invariant 16: data/index/ is byte-identical to a fresh build. Exit code
// 1 on any error; warnings never fail.
//
//   node tools/validate.mjs [--data <dir>] [--index] [--quiet]

import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate, buildTopology } from '../src/validate/core.js';
import { createValidator } from '../src/validate/schema.js';
import { createRegionDeriver, NEAREST_TOLERANCE } from '../src/util/geo.js';
import { readSchemaFiles, readRecords, readRegions, readRegionPolygons, readPresenceShards, readImportMaps, readCachedLeads, DEFAULT_IMPORT_KIND, KIND_DIRS } from './lib/read.mjs';
import { buildIndex, readIndex, compareIndex } from './build-index.mjs';
import { countDrafts } from '../src/review/queue.js';
import { countCitations } from '../src/review/citations.js';

export const IMPORT_MAP_SCHEMA = 'v1/import-map.json';
export const LEAD_SCHEMA = 'v1/wikipedia-lead.json';

// Which schema each kind of file under data/imports/ is held to. A kind that
// is not in here is an error rather than a file nobody checks: the directory
// is contributor-editable, and an unchecked file in it would be a hole in the
// only thing that stands between a pull request and the data.
export const IMPORT_SCHEMAS = Object.freeze({
  [DEFAULT_IMPORT_KIND]: IMPORT_MAP_SCHEMA,
  'import-seeds': 'v1/import-seeds.json',
  'import-state': 'v1/import-state.json',
});

// An import map is not a record and has no rules file: what holds it together
// is here. The schema has already said the shape is right; these are the
// things a shape cannot say. Whether a code exists in the source at all is
// not checkable without the source, so the import checks that at run time and
// says so loudly instead.
export function checkImportMap(file, map) {
  const problems = [];
  const say = (path, message) => problems.push({ path, message });
  const names = (list, path) => {
    if (!Array.isArray(list)) return;
    const seen = new Set();
    list.forEach((name, i) => {
      const key = name.trim().toLowerCase();
      if (seen.has(key)) say(`${path}/${i}`, `"${name}" is listed twice`);
      seen.add(key);
    });
  };
  for (const [code, entry] of Object.entries(map?.entries ?? {})) {
    const at = `/entries/${code}`;
    if (!/^[0-9]+$/.test(code)) say(at, `"${code}" is not an entity code of the source (digits)`);
    names(entry.names, `${at}/names`);
    const used = new Map([[entry.actor, 'the entry itself']]);
    let previous = null;
    (entry.splits ?? []).forEach((split, i) => {
      const here = `${at}/splits/${i}`;
      // Sortable as strings because the pattern fixes the width; a date that
      // is not a real day is caught below.
      if (previous !== null && split.from <= previous) {
        say(`${here}/from`, `${split.from} does not come after ${previous}; splits are in order and strictly increasing`);
      }
      previous = split.from;
      const parsed = new Date(`${split.from}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== split.from) {
        say(`${here}/from`, `${split.from} is not a real date`);
      }
      if (used.has(split.actor)) {
        say(`${here}/actor`, `"${split.actor}" is already the actor of ${used.get(split.actor)}; a split cuts a code into different actors`);
      }
      used.set(split.actor, `split ${i}`);
      names(split.names, `${here}/names`);
    });
  }
  return problems.map((p) => ({ ...p, file }));
}

// The same for a seeds file: the shape has been checked, and what is left is
// what a shape cannot say. Uniqueness above all — the keyword subset has no
// uniqueItems, and an item listed twice would be fetched twice and counted
// twice against the call budget.
export function checkImportSeeds(file, seeds) {
  const problems = [];
  const say = (path, message) => problems.push({ path, message, file });
  const seen = new Set();
  (seeds?.items ?? []).forEach((qid, i) => {
    if (seen.has(qid)) say(`/items/${i}`, `${qid} is listed twice`);
    seen.add(qid);
  });
  for (const [qid, entry] of Object.entries(seeds?.classes ?? {})) {
    if (!/^Q[1-9][0-9]*$/.test(qid)) say(`/classes/${qid}`, `"${qid}" is not an item of the source`);
    // The shape cannot make one property depend on another: an actor class
    // with no actorType would create actors of no type at all.
    if (entry?.kind === 'actor' && !entry?.actorType) say(`/classes/${qid}`, 'an actor class has to say which actorType its items become');
    if (entry?.kind !== 'actor' && entry?.actorType) say(`/classes/${qid}`, `actorType means nothing on a ${entry?.kind} class`);
  }
  const names = new Set();
  (seeds?.queries ?? []).forEach((query, i) => {
    if (names.has(query?.name)) say(`/queries/${i}/name`, `"${query.name}" names two queries; the candidate list is grouped by it`);
    names.add(query?.name);
  });
  return problems;
}

// Not an error: a seeds file with nothing in it yet is the ordinary state of
// one waiting for somebody to decide what this atlas should draw from, and
// the import says the same thing and does nothing.
export function seedsAreEmpty(seeds) {
  return !(seeds?.items ?? []).length && !(seeds?.queries ?? []).length;
}

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Where the Wikipedia leads live, relative to the repository root rather than
// to --data: they are not data, and a run against a scratch directory must
// not pick up the real cache or miss it.
export const LEAD_CACHE = 'tools/import/cache/wikipedia';
const SCHEMA_DIR = path.join(ROOT, 'schema');
const DEFAULT_DATA = path.join(ROOT, 'data');

export async function runValidation(dataDir = DEFAULT_DATA, { index = false } = {}) {
  const errors = [];
  const warnings = [];
  const schemas = await readSchemaFiles(SCHEMA_DIR);
  const { entries, problems } = await readRecords(dataDir);
  for (const p of problems) errors.push({ rule: 1, id: null, file: p.file, path: '', message: p.message });

  const fileOf = new Map();
  for (const e of entries) {
    const r = e.record;
    const id = r && typeof r.id === 'string' ? r.id : null;
    if (id !== null && !fileOf.has(id)) fileOf.set(id, e.file);
    if (id === null) continue;
    if (path.basename(e.file, '.json') !== id) {
      errors.push({ rule: 2, id, file: e.file, path: '/id', message: `id "${id}" does not equal the file name` });
    }
    if (r.kind !== e.kind) {
      errors.push({ rule: 1, id, file: e.file, path: '/kind', message: `a ${JSON.stringify(r.kind)} record does not belong under ${KIND_DIRS[e.kind]}/` });
    }
  }

  const records = entries.map((e) => e.record);
  const regions = await readRegions(dataDir);
  const polygons = await readRegionPolygons(dataDir);
  const deriveRegion = polygons ? createRegionDeriver(polygons) : undefined;
  const topology = buildTopology(records, regions, { deriveRegion });

  const result = validate(records, topology, schemas);
  for (const e of result.errors) errors.push({ ...e, file: fileOf.get(e.id) ?? null });
  for (const w of result.warnings) warnings.push({ ...w, file: fileOf.get(w.id) ?? null });

  if (polygons) {
    const lanes = new Set(polygons.features.map((f) => f.properties?.region));
    for (const region of regions) {
      if (!lanes.has(region.id)) warnings.push({ rule: 'no-polygon', id: region.id, file: 'regions.json', path: '', message: `lane "${region.id}" has no polygon in geo/regions.json; events reach it only by override` });
    }
    for (const p of topology.places) {
      if (p.status === 'active' && p.where && !p.region) {
        errors.push({ rule: 10, id: p.id, file: fileOf.get(p.id) ?? null, path: '/region', message: `no lane polygon within ${NEAREST_TOLERANCE}° of where; set region on the place` });
      }
    }
    for (const e of topology.events) {
      if (e.status === 'active' && e.place && !e.region) {
        errors.push({ rule: 10, id: e.id, file: fileOf.get(e.id) ?? null, path: '/region', message: `no lane polygon within ${NEAREST_TOLERANCE}° of the place; set region on the place or on the event` });
      }
    }
  } else if (topology.events.some((e) => e.place && !e.region)) {
    warnings.push({ rule: 'no-polygons', id: null, file: 'geo/regions.json', path: '', message: 'geo/regions.json is missing; regions cannot be derived from a place (run tools/build-regions.mjs)' });
  }

  // Rule 17's half that needs the disk: the files a presence names exist,
  // hold its key, and between them cover every year the presence claims —
  // a shard missing from the middle would make a territory blink out.
  if (topology.presences.length) {
    const shards = await readPresenceShards(dataDir, { keys: true });
    const byFile = new Map(shards.map((s) => [s.file, s]));
    for (const p of topology.presences) {
      if (p.status !== 'active') continue;
      const files = Array.isArray(p.geometry?.files) ? p.geometry.files : [];
      const covered = [];
      for (const file of files) {
        const shard = byFile.get(file);
        if (!shard) {
          errors.push({ rule: 17, id: p.id, file: fileOf.get(p.id) ?? null, path: '/geometry/files', message: `no such geometry shard: data/${file}` });
          continue;
        }
        if (!shard.keys.has(p.geometry.key)) {
          errors.push({ rule: 17, id: p.id, file: fileOf.get(p.id) ?? null, path: '/geometry/key', message: `data/${file} holds no feature "${p.geometry.key}"` });
          continue;
        }
        covered.push(shard);
      }
      const start = Number.isInteger(p.when?.start) ? p.when.start : p.when?.start?.min;
      const end = p.when?.end === null ? (shards[shards.length - 1]?.to ?? start)
        : Number.isInteger(p.when?.end) ? p.when.end : p.when?.end?.max;
      if (Number.isInteger(start) && Number.isInteger(end)) {
        for (const shard of shards) {
          const touches = shard.from <= end && start <= shard.to;
          if (touches && !covered.includes(shard)) {
            errors.push({ rule: 17, id: p.id, file: fileOf.get(p.id) ?? null, path: '/geometry/files', message: `the presence runs through ${shard.from}–${shard.to} but does not name data/${shard.file}` });
          }
        }
      }
    }
  }

  // Everything under data/imports/: the right schema for the file's kind
  // first, then the things a shape cannot say. They are not records, so they
  // are not in `entries` and no rule number owns them.
  const { maps, problems: mapProblems } = await readImportMaps(dataDir);
  for (const p of mapProblems) errors.push({ rule: 'import', id: null, file: p.file, path: '', message: p.message });
  const validator = createValidator(schemas);
  if (maps.length) {
    const sourceIds = new Set(records.filter((r) => r?.kind === 'source').map((r) => r.id));
    for (const { file, kind, map } of maps) {
      const schema = IMPORT_SCHEMAS[kind];
      if (!schema) {
        errors.push({ rule: 'import', id: null, file, path: '/kind', message: `"${kind}" is not a kind of file data/imports/ holds (${Object.keys(IMPORT_SCHEMAS).join(', ')})` });
        continue;
      }
      for (const e of validator.validate(schema, map)) {
        errors.push({ rule: kind, id: null, file, path: e.path, message: e.message, alternatives: e.alternatives });
      }
      const checks = kind === 'import-seeds' ? checkImportSeeds(file, map) : kind === DEFAULT_IMPORT_KIND ? checkImportMap(file, map) : [];
      for (const p of checks) {
        errors.push({ rule: kind, id: null, file, path: p.path, message: p.message });
      }
      if (typeof map?.source === 'string' && sourceIds.size && !sourceIds.has(map.source)) {
        warnings.push({ rule: kind, id: null, file, path: '/source', message: `no source record "${map.source}"; the import writes one, so this is expected only before it has run` });
      }
      if (kind === 'import-seeds' && seedsAreEmpty(map)) {
        warnings.push({ rule: kind, id: null, file, path: '', message: 'neither items nor queries: the import has nothing to fetch until somebody decides what it should draw from' });
      }
    }
  }

  // The cached Wikipedia leads. They are not under data/ and are never
  // published, but they are quotations of somebody else's writing and a
  // quotation with no revision behind it cannot be checked by anyone, so the
  // envelope is held to its schema like everything else.
  const cacheDir = path.join(ROOT, ...LEAD_CACHE.split('/'));
  const { leads, problems: leadProblems } = await readCachedLeads(cacheDir);
  for (const p of leadProblems) errors.push({ rule: 'lead-cache', id: null, file: `${LEAD_CACHE}/${p.file}`, path: '', message: p.message });
  for (const { file, lead } of leads) {
    for (const e of validator.validate(LEAD_SCHEMA, lead)) {
      errors.push({ rule: 'lead-cache', id: null, file: `${LEAD_CACHE}/${file}`, path: e.path, message: e.message, alternatives: e.alternatives });
    }
    const expected = `${lead?.qid}.${lead?.lang}.json`;
    if (typeof lead?.qid === 'string' && typeof lead?.lang === 'string' && file !== expected) {
      errors.push({ rule: 'lead-cache', id: null, file: `${LEAD_CACHE}/${file}`, path: '', message: `holds ${lead.qid} in ${lead.lang} and should be called ${expected}` });
    }
  }

  if (index) {
    const built = await buildIndex(dataDir);
    const existing = await readIndex(dataDir);
    for (const p of compareIndex(existing, built)) {
      errors.push({ rule: 16, id: null, file: `index/${p.split(' ')[1]}`, path: '', message: `data/index/ is not what build-index.mjs produces (${p}); run node tools/build-index.mjs` });
    }
  }

  return {
    errors,
    warnings,
    // How much of the assistant-draft exception is still standing, and how
    // much of the dataset nobody has checked against the sources it names.
    // Neither is an error: the first is allowed to be there and the second is
    // work in progress, and both are numbers the review dashboard exists to
    // bring to zero, so the validator that runs on every commit is where they
    // are counted.
    counts: {
      records: records.length,
      regions: regions.length,
      unreviewed: countDrafts(records),
      ...countCitations(records),
    },
  };
}

function formatItem(kind, item) {
  const where = item.file ?? item.id ?? '';
  const rule = typeof item.rule === 'number' ? `rule ${item.rule}` : item.rule;
  const lines = [`${kind} [${rule}] ${where}${item.path ? ` ${item.path}` : ''}: ${item.message}`];
  if (item.alternatives) {
    item.alternatives.forEach((alt, i) => {
      for (const e of alt) lines.push(`    alternative ${i + 1}${e.path ? ` ${e.path}` : ''}: ${e.message}`);
    });
  }
  return lines.join('\n');
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let index = false;
  let quiet = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--index') index = true;
    else if (argv[i] === '--quiet') quiet = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  if (!existsSync(dataDir)) {
    console.error(`no such data directory: ${dataDir}`);
    return 2;
  }
  const { errors, warnings, counts } = await runValidation(dataDir, { index });
  for (const e of errors) console.error(formatItem('error', e));
  if (!quiet) for (const w of warnings) console.log(formatItem('warning', w));
  console.log(`${counts.records} records, ${counts.regions} regions: ${errors.length} error(s), ${warnings.length} warning(s)`);
  if (counts.unreviewed) console.log(`${counts.unreviewed} record(s) still carry the assistant-draft marker: open review.html`);
  console.log(`${counts.unverified} of ${counts.citations} citation(s) not yet checked against the source`);
  return errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

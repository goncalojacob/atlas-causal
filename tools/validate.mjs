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
import { createRegionDeriver, NEAREST_TOLERANCE } from '../src/util/geo.js';
import { readSchemaFiles, readRecords, readRegions, readRegionPolygons, readPresenceShards, KIND_DIRS } from './lib/read.mjs';
import { buildIndex, readIndex, compareIndex } from './build-index.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
    for (const e of topology.events) {
      if (e.status === 'active' && e.where && !e.region) {
        errors.push({ rule: 10, id: e.id, file: fileOf.get(e.id) ?? null, path: '/region', message: `no lane polygon within ${NEAREST_TOLERANCE}° of where; set region on the record` });
      }
    }
  } else if (topology.events.some((e) => e.where && !e.region)) {
    warnings.push({ rule: 'no-polygons', id: null, file: 'geo/regions.json', path: '', message: 'geo/regions.json is missing; regions cannot be derived from where (run tools/build-regions.mjs)' });
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

  if (index) {
    const built = await buildIndex(dataDir);
    const existing = await readIndex(dataDir);
    for (const p of compareIndex(existing, built)) {
      errors.push({ rule: 16, id: null, file: `index/${p.split(' ')[1]}`, path: '', message: `data/index/ is not what build-index.mjs produces (${p}); run node tools/build-index.mjs` });
    }
  }

  return { errors, warnings, counts: { records: records.length, regions: regions.length } };
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
  return errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

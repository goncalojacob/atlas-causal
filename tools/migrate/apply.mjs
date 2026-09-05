#!/usr/bin/env node
// The migration chain, applied to the tree itself.
//
//   node tools/migrate/apply.mjs [--data <dir>] [--to <version>] [--dry-run] [--quiet]
//
// `tools/lib/read.mjs` runs the chain on the way in, so the validator, the
// index builder and the browser all see the current shape whatever is on
// disk. This is the other half of that: it puts the current shape *on* disk,
// so that a tree is never permanently a migration behind what reads it
// (docs/review-2026-09-05-health-plan.md, finding 5 — a migration applied on
// read and nowhere else wedges `validate --index`, the deploy and the import
// loop). Run it in the same commit as any migration that changes bytes.
//
// It is idempotent: applied twice it writes nothing the second time, because
// every `up` in the chain is. Nothing is written until every record has been
// migrated *and* validated, so a migration with a mistake in it leaves the
// tree exactly as it found it rather than half rewritten.
//
// `--to <version>` leaves the tree at that step of the chain rather than at
// the end of it, which is how the reversible pair 2/3 is exercised on a
// scratch copy of the fixtures. It converges from either side: the `up`s up
// to that version first, for a tree that is behind, then the `down`s above
// it, for one that is ahead. `--to 0` is refused, because migration 1 has no
// `down` and a tree it cannot come back from is not one to write.
//
// It never touches `data/index/`. The index is generated, it is owned by
// `deploy.yml` on main, and rebuilding it here would hide the fact that a
// migration changed records: `node tools/build-index.mjs` afterwards, which
// is what this prints when it has written anything, and `node
// tools/validate.mjs --index` is what checks it was done.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LATEST, migrateRecord, rollbackRecord } from '../../src/validate/migrate.js';
import { validate, buildTopology } from '../../src/validate/core.js';
import { createRegionDeriver } from '../../src/util/geo.js';
import { readRecords, readRegions, readRegionPolygons, readSchemaFiles } from '../lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
export const DEFAULT_SCHEMA = path.join(ROOT, 'schema');

// How a record is written everywhere else in this repository: two-space
// indent, one trailing newline. A migration that changed the formatting of
// every file while adding one key would be unreviewable.
export function serialize(record) {
  return `${JSON.stringify(record, null, 2)}\n`;
}

// The record as the chain says it should be at `to`, reached from wherever it
// is: the `up`s to that version, then the `down`s above it. Both directions
// are idempotent, so whichever of the two is the no-op costs nothing.
export function recordAt(record, to = LATEST) {
  return rollbackRecord(migrateRecord(record, { to }), { from: LATEST, to });
}

// What would change, and what it would become. Reads the bytes as they are —
// this is the one caller that must not have the chain applied for it.
export async function planMigration(dataDir, { to = LATEST } = {}) {
  const { entries, problems } = await readRecords(dataDir, { migrate: false });
  const records = [];
  const changes = [];
  for (const entry of entries) {
    const next = recordAt(entry.record, to);
    records.push(next);
    const before = await readFile(path.join(dataDir, entry.file), 'utf8');
    const after = serialize(next);
    if (before !== after) changes.push({ file: entry.file, text: after });
  }
  return { records, changes, problems };
}

export async function apply(dataDir, { to = LATEST, dryRun = false, schemaDir = DEFAULT_SCHEMA } = {}) {
  if (!Number.isInteger(to) || to < 1 || to > LATEST) {
    throw new Error(`--to must be a version between 1 and ${LATEST}`);
  }
  const { records, changes, problems } = await planMigration(dataDir, { to });
  if (problems.length) return { changes: [], problems, errors: [], written: 0 };

  // Validated before writing, and against the tree as it would be: a
  // migration is a change to every record at once, and there is no reviewing
  // that one file at a time afterwards.
  const regions = await readRegions(dataDir);
  const polygons = await readRegionPolygons(dataDir);
  const schemas = await readSchemaFiles(schemaDir);
  const topology = buildTopology(records, regions, { deriveRegion: createRegionDeriver(polygons) });
  const { errors } = validate(records, topology, schemas);
  if (errors.length) return { changes, problems, errors, written: 0 };

  if (!dryRun) {
    for (const change of changes) await writeFile(path.join(dataDir, change.file), change.text, 'utf8');
  }
  return { changes, problems, errors: [], written: dryRun ? 0 : changes.length };
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let to = LATEST;
  let dryRun = false;
  let quiet = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--to') to = Number(argv[++i]);
    else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--quiet') quiet = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }

  let result;
  try {
    result = await apply(dataDir, { to, dryRun });
  } catch (e) {
    console.error(`error: ${e.message}`);
    return 2;
  }
  for (const problem of result.problems) console.error(`error: ${problem.file}: ${problem.message}`);
  for (const e of result.errors) console.error(`error: rule ${e.rule} ${e.id ?? ''}${e.path}: ${e.message}`);
  if (result.problems.length || result.errors.length) {
    console.error('nothing was written');
    return 1;
  }
  if (!quiet) {
    for (const change of result.changes) console.log(`${dryRun ? 'would rewrite' : 'rewrote'} ${change.file}`);
    console.log(`chain at ${to} of ${LATEST}: ${result.changes.length} record(s) ${dryRun ? 'would change' : 'changed'}`);
    if (!dryRun && result.written) console.log('now: node tools/build-index.mjs && node tools/validate.mjs --index');
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

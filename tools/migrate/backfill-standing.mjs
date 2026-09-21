#!/usr/bin/env node
// One-time backfill, kept so a contributor can see how it was done: a record
// an import created before its import said `draft` is given the standing that
// is true of it — nobody has read it.
//
//   { "origin": { "tool": "cshapes" } }            (and no `review` at all)
//   → { "review": { "status": "draft",
//                   "flags": ["standing-backfilled", "imported-by-cshapes"] } }
//
// It is standing and not content. Nothing here reads `summary`, `when`,
// `sources` or any other field a record makes a claim with, and nothing here
// writes one: the only key it adds is `review`, and the only thing `review`
// ever says is how far the record has been read.
//
// Why a warning existed to backfill. A record with neither `review.status` nor
// a signature has no standing at all — `isDraft` says no and `isReviewed` says
// no — so it is in no queue and on no dashboard, and `review.html`'s count is a
// promise about a corpus it has not seen (health review of 6 September, R10;
// H9 item 7 added the `unread` warning and left the data alone, because
// backfilling it is a data change). `draft` is the true answer and not a
// convenient one: no person has read any of these records.
//
// The two flags are what a reviewer needs and the record does not otherwise
// say in a place they will look: `standing-backfilled` says the status was
// written afterwards by this tool and not by whoever created the record, and
// `imported-by-<tool>` says which import did create it. Both are the
// reviewer's to clear, and signing clears them.
//
// It is a tool and not a step of `src/validate/migrate.js`'s chain, for the
// reason `roles.mjs` and `categories.mjs` give: a chain step is re-applied on
// every read for ever, and "the records the CShapes import wrote in September
// 2026" is a fact about one afternoon rather than a shape the data has. No
// migration number is consumed.
//
// Four things it never does: it never touches a record that already has a
// status or a signature, so nothing a person decided is overwritten; it never
// touches a record that is not `active`, because a tombstone is out of the
// corpus and no reviewer is waiting on it (the same line the `unread` warning
// draws); it never writes `reviewed`, which is a person's act; and it never
// touches a record with no `origin.tool`, because there is no import to name
// and whether somebody's unmarked record is a draft is a different question
// from this one.
//
// Idempotent: a record that already has standing is left alone, so a run cut
// off half-way finishes cleanly on the next one.
//
//   node tools/migrate/backfill-standing.mjs [--data <dir>] [--today YYYY-MM-DD] [--dry-run]

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND_DIRS } from '../lib/read.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA = path.join(ROOT, 'data');

// The status this tool writes, and the only one it may write.
export const BACKFILLED_STATUS = 'draft';

// Says the status was not written by whoever created the record.
export const BACKFILL_FLAG = 'standing-backfilled';

// Says which import did. Built from `origin.tool` rather than listed, so a
// third import needs no edit here; the schema's own pattern for a flag is
// lower-case words joined by hyphens, which every writer name in
// `src/origin.js` already is.
export function importFlag(tool) {
  return `imported-by-${tool}`;
}

// Whether a record has standing: exactly the question the `unread` warning of
// src/validate/rules.js asks, and asked the same way so that the two cannot
// drift apart — a status of any kind, or at least one signature.
export function hasStanding(record) {
  return record?.review?.status !== undefined || record?.review?.signedBy?.length > 0;
}

// What happens to one record. `backfill` is the only action that changes
// anything on disk; everything else is counted and reported.
export function classify(record) {
  if (record?.status !== 'active') return { action: 'inactive' };
  if (hasStanding(record)) return { action: 'kept' };
  const tool = record?.origin?.tool;
  if (typeof tool !== 'string' || !tool) return { action: 'no-origin' };
  return { action: 'backfill', tool };
}

// The record with its standing in it. A block that is already there keeps
// whatever else it holds — a note, a flag, an audit of checked citations — and
// gains the status and the two flags; a flag it already carries is not written
// twice.
//
// `review` goes immediately after `origin`, which is where `schema/common/
// provenance.json` declares it, where migration 4 writes it and where 6 505 of
// the 6 662 records that carry both already keep it. Not `tools/lib/order.mjs`,
// which reads `schema/v1/<kind>.json`: those files declare `review` *before*
// `origin`, so ordering by them would swap the two on every file this touches
// and turn a one-key addition into a reshuffle — the diff that order.mjs exists
// to prevent. A record that already has the key keeps it exactly where it is.
export function withStanding(record, tool) {
  const before = record.review && typeof record.review === 'object' ? record.review : {};
  const flags = [...(before.flags ?? [])];
  for (const flag of [BACKFILL_FLAG, importFlag(tool)]) {
    if (!flags.includes(flag)) flags.push(flag);
  }
  const review = { status: BACKFILLED_STATUS, ...before, flags };
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === 'review') { out.review = review; continue; }
    out[key] = value;
    if (key === 'origin' && !('review' in record)) out.review = review;
  }
  if (!('review' in out)) out.review = review;
  return out;
}

async function readKind(dataDir, kind) {
  const dir = path.join(dataDir, KIND_DIRS[kind]);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(dir, name);
    out.push({ file, record: JSON.parse(await readFile(file, 'utf8')) });
  }
  return out;
}

const write = (file, record) => writeFile(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let today = new Date().toISOString().slice(0, 10);
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--today') today = argv[++i];
    else if (argv[i] === '--dry-run') dryRun = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }

  const byTool = new Map();
  const byKind = new Map();
  const noOrigin = [];
  let records = 0;
  let written = 0;
  let kept = 0;
  let inactive = 0;

  for (const kind of Object.keys(KIND_DIRS)) {
    for (const { file, record } of await readKind(dataDir, kind)) {
      records += 1;
      const outcome = classify(record);
      if (outcome.action === 'inactive') { inactive += 1; continue; }
      if (outcome.action === 'kept') { kept += 1; continue; }
      if (outcome.action === 'no-origin') { noOrigin.push(record.id); continue; }
      written += 1;
      byTool.set(outcome.tool, (byTool.get(outcome.tool) ?? 0) + 1);
      byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
      const next = withStanding(record, outcome.tool);
      // The file was written today; nothing it claims changed.
      next.revised = today;
      if (!dryRun) await write(file, next);
    }
  }

  for (const id of noOrigin) {
    console.log(`left    ${id}: no origin.tool, so there is no import to name — a person decides`);
  }

  const tools = [...byTool].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tool, n]) => `${n} ${tool}`).join(', ');
  const kinds = [...byKind].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([kind, n]) => `${n} ${kind}`).join(', ');
  console.log(`${records} record(s): ${written} given standing (${tools || 'none'}; ${kinds || 'none'}), ${kept} already had it, ${inactive} not active, ${noOrigin.length} left with no origin${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (written && !dryRun) console.log('now run node tools/validate.mjs and node tools/build-index.mjs');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

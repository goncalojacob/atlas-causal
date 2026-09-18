#!/usr/bin/env node
// One-time assignment, kept so a contributor can see how it was done: an event
// an import titled gets the `category` its Wikidata class carries in
// `data/imports/wikidata-seeds.json`, read off the event's own title.
//
//   { "title": "1908 Portuguese legislative election", "origin": { "tool": "wikidata" } }
//   → { "category": "election" }
//
// It is a tool and not a step of `src/validate/migrate.js`'s chain, for the
// reason `roles.mjs` gives: a chain step is re-applied on every read for ever,
// and a table of class labels read in September 2026 is not something a reader
// in 2030 should carry around. No migration number is consumed.
//
// Nothing historical is added. The correspondence between a class and a
// category is `data/imports/wikidata-seeds.json`, which M30a-3 filled under
// amendment A17 and which `tools/validate.mjs` checks against
// `data/categories.json`; the string matched against it is the source's own
// label for the item, copied into `title` by the import. That is the whole of
// the tool's judgement, and it is why it refuses to look at any other record:
//
//   **Only where `origin.tool` is `"wikidata"`** (brief amendment A5). A
//   hand-written title is composed rather than copied, and a pattern over one
//   is a guess dressed as a rule — "The revision that ends direct presidential
//   elections" is a law and the table would file it as an election. The tool
//   prints those as suggestions for a person and writes none of them.
//
// Three things it never does (brief §4): it never writes `other`, which is a
// person's judgement that nothing in the list fits and not a fallback for a
// tool that could not decide; it never overwrites a category a record already
// carries; and it writes nothing else — not `parent`, not `scope`, not a
// summary, and not `revised` on a file it did not change.
//
// Idempotent: a record that already carries a category is left alone, so a run
// cut off half-way finishes cleanly on the next one.
//
//   node tools/migrate/categories.mjs [--data <dir>] [--today YYYY-MM-DD] [--dry-run]

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND_DIRS, readCategories, readImportMaps } from '../lib/read.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA = path.join(ROOT, 'data');

// The one origin whose titles are the source's own words, and so the only one
// this tool reads (amendment A5).
export const IMPORT_TOOL = 'wikidata';

// `other` is never written: see the header. It is filtered out of the table
// rather than handled at the point of writing, so that a class the owner one
// day files as `other` simply stops reaching records instead of silently
// giving every match a category nobody chose.
export const NEVER_WRITTEN = 'other';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A whole-word, case-insensitive match on the class's label, with an optional
// plural `s` so that "Portuguese local elections" is reached by the label
// "election" (amendment A4). The boundaries are lookarounds over `\p{L}\p{N}`
// and not `\b`, because `\b` is ASCII-only: a label ending in an accented
// letter would have its boundary inverted rather than enforced. On today's
// fifty labels the two agree exactly.
export function labelPattern(label) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(label)}s?(?![\\p{L}\\p{N}])`, 'iu');
}

// The class table as this tool reads it: one row per event class that carries
// a category, longest label first so that "legislative election" is tried
// before "election" and "presidential election" before either. Ties are broken
// by the label and then by the class id, so the order is the same on every
// machine.
//
// Two classes may share a label — `earthquake` is Q7944, Q8065 and Q3839081 —
// and that is only a duplicate as long as they agree. Two classes that give
// one label two categories are a question for the owner and not something to
// resolve by sort order, so they are refused.
export function buildTable(classes) {
  const rows = [];
  const problems = [];
  for (const [id, entry] of Object.entries(classes ?? {})) {
    if (entry?.kind !== 'event') continue;
    if (typeof entry.label !== 'string' || !entry.label) continue;
    if (typeof entry.category !== 'string' || !entry.category) continue;
    if (entry.category === NEVER_WRITTEN) continue;
    rows.push({ id, label: entry.label, category: entry.category });
  }
  rows.sort((a, b) => b.label.length - a.label.length
    || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));

  const byLabel = new Map();
  for (const row of rows) {
    const key = row.label.toLowerCase();
    const seen = byLabel.get(key);
    if (seen && seen.category !== row.category) {
      problems.push(`the label ${JSON.stringify(row.label)} is ${seen.category} on ${seen.id} and ${row.category} on ${row.id}`);
      continue;
    }
    if (!seen) byLabel.set(key, row);
  }
  return { rows: rows.map((row) => ({ ...row, pattern: labelPattern(row.label) })), problems };
}

// Which category a title earns, or null. Pure, and the whole of the match.
export function categoryFor(title, rows) {
  if (typeof title !== 'string' || !title) return null;
  for (const row of rows) {
    if (row.pattern.test(title)) return row;
  }
  return null;
}

// The record with `category` in it, in the key order the schema and the
// contribution form use: after `place`, `region`, `parent` and `scope`, and
// before `actors`. A new key at the end of a record would be a diff nobody can
// read beside the other three hundred.
export function withCategory(record, category) {
  const out = {};
  let placed = false;
  for (const [key, value] of Object.entries(record)) {
    if (key === 'actors' && !placed) { out.category = category; placed = true; }
    out[key] = value;
  }
  if (!placed) out.category = category;
  return out;
}

// What happens to one record. `reason` is what the caller reports: `written`
// is the only one that changes anything on disk.
export function classify(record, rows) {
  if (record?.review?.status === 'reviewed') return { action: 'reviewed' };
  if (record?.category !== undefined && record?.category !== null) return { action: 'kept' };
  const row = categoryFor(record?.title, rows);
  if (!row) return { action: 'unreached' };
  if (record?.origin?.tool !== IMPORT_TOOL) return { action: 'suggested', row };
  return { action: 'written', row };
}

async function readEvents(dataDir) {
  const dir = path.join(dataDir, KIND_DIRS.event);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(dir, name);
    out.push({ file, record: JSON.parse(await readFile(file, 'utf8')) });
  }
  return out;
}

// Every import-seeds file the dataset has, merged. There is one today; reading
// them all means a second source's class table works the day it arrives,
// without the tool naming a file.
async function readClasses(dataDir) {
  const { maps, problems } = await readImportMaps(dataDir);
  const classes = {};
  const files = [];
  for (const { file, kind, map } of maps) {
    if (kind !== 'import-seeds') continue;
    if (!map?.classes || typeof map.classes !== 'object') continue;
    files.push(file);
    Object.assign(classes, map.classes);
  }
  return { classes, files, problems: problems.map((p) => `${p.file}: ${p.message}`) };
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

  const { classes, files: seedFiles, problems: readProblems } = await readClasses(dataDir);
  const { rows, problems } = buildTable(classes);
  for (const problem of [...readProblems, ...problems]) {
    console.error(`error: ${problem}. The owner decides; this tool does not pick one.`);
  }
  if (readProblems.length || problems.length) return 1;

  // A category spelled wrong in the class table would be written onto every
  // record that class reaches, so it is refused here as well as warned about
  // by tools/validate.mjs. An absent data/categories.json is not an empty one
  // (M30a amendment A8): a dataset with no vocabulary is checked against none.
  const vocabulary = await readCategories(dataDir);
  if (vocabulary) {
    const allowed = new Set(vocabulary.map((row) => row.id));
    const wrong = [...new Set(rows.filter((row) => !allowed.has(row.category)).map((row) => row.category))];
    for (const category of wrong.sort()) {
      console.error(`error: the class table gives the category ${JSON.stringify(category)}, which is not in data/categories.json`);
    }
    if (wrong.length) return 1;
  }

  const events = await readEvents(dataDir);
  const counts = new Map();
  const suggestions = [];
  const reviewed = [];
  let written = 0;
  let kept = 0;
  let unreached = 0;
  let imported = 0;

  for (const { file, record } of events) {
    if (record.origin?.tool === IMPORT_TOOL) imported += 1;
    const outcome = classify(record, rows);
    if (outcome.action === 'reviewed') { reviewed.push(record.id); continue; }
    if (outcome.action === 'kept') { kept += 1; continue; }
    if (outcome.action === 'unreached') { unreached += 1; continue; }
    if (outcome.action === 'suggested') {
      // The row's own `id` is the class's; the record's is what a reader needs.
      suggestions.push({
        id: record.id,
        status: record.status,
        category: outcome.row.category,
        label: outcome.row.label,
        title: record.title,
      });
      continue;
    }
    written += 1;
    counts.set(outcome.row.category, (counts.get(outcome.row.category) ?? 0) + 1);
    const next = withCategory(record, outcome.row.category);
    // The record was categorised today; nothing else about it changed.
    next.revised = today;
    if (!dryRun) await write(file, next);
    console.log(`${record.id.padEnd(56)} ${outcome.row.category.padEnd(10)} via "${outcome.row.label}"`);
  }

  for (const s of suggestions) {
    console.log(`left    ${s.id} (${s.status}): the table would say ${s.category}, via "${s.label}" in "${s.title}" — a hand-written title, so a person decides`);
  }
  for (const id of reviewed) console.log(`left    ${id} (reviewed: a signature was given against what it says)`);

  const breakdown = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([category, n]) => `${n} ${category}`).join(', ');
  console.log(`${seedFiles.length} seed file(s), ${rows.length} class label(s); ${events.length} event(s), ${imported} of them from ${IMPORT_TOOL}: ${written} given a category (${breakdown || 'none'}), ${kept} already had one, ${suggestions.length} left as a suggestion, ${reviewed.length} left as reviewed, ${unreached} not reached${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (written && !dryRun) console.log('now run node tools/validate.mjs and node tools/build-index.mjs');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

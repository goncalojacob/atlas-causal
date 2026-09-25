// The §4.1 row of `docs/m53-polities.md`, measured and written.
//
// §4.1 is a **coverage** figure: how many active events name at least one
// actor that was alive in the year the event starts, over the two M50 chains
// and over the whole corpus. `tests/m53.test.mjs` held the document's last
// row against the live corpus, so a batch of records that moved the
// denominator turned that test red until somebody retyped four numbers — and
// on a branch writing records every hour, that is a test that is red more
// often than it is green (M88 §4, review B finding 4).
//
// Two things fix it, and this file is both of them.
//
//   1. **The row says the size it was measured at.** `| **after M42, 1257
//      active** | 36 of 36 | 403 of 1257 |`. A row whose size is not the
//      corpus's own size is a measurement of a corpus that is not this one:
//      the test then holds the document's *rules* — the start-rule and
//      overlap predicates, and the paragraph that states the gap between them
//      — and says nothing about four figures it cannot check. A row that does
//      name this corpus's size is checked to the digit, as it always was.
//   2. **The measuring is a command and not a person.** The records lanes and
//      the landing script call this rather than asking somebody to count; the
//      pure half below is what the test reads the row with, so the document
//      and the test cannot come apart about what a row means.
//
// Pure functions and one `main`, in the shape of `tools/m72-sources.mjs`:
//
//   node tools/m53-retake.mjs            print the row the corpus shows
//   node tools/m53-retake.mjs --write    and put it under the last one
//   node tools/m53-retake.mjs --json     for a script

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DOC = 'docs/m53-polities.md';

// The row, with the size it was measured at optional: every row written
// before M88 carries none, and a row with none is history rather than a claim
// about the corpus in front of us.
export const COUNT_ROW = /^\| \*\*after (M[\w.]+?)(?:, (\d+) active)?\*\* \| (\d+) of (\d+) \| (\d+) of (\d+) \|/;

// The last such row of a document, read. `size` is null where the row does
// not say what corpus it was measured over.
export function lastCountRow(doc) {
  const rows = doc.split('\n')
    .map((line, i) => ({ line, number: i + 1, found: COUNT_ROW.exec(line) }))
    .filter((row) => row.found);
  if (rows.length === 0) return null;
  const { line, number, found } = rows[rows.length - 1];
  const [, milestone, size, chainNamed, chainTotal, allNamed, allTotal] = found;
  return {
    line,
    number,
    milestone,
    size: size === undefined ? null : Number(size),
    chainNamed: Number(chainNamed),
    chainTotal: Number(chainTotal),
    allNamed: Number(allNamed),
    allTotal: Number(allTotal),
  };
}

// And the row a measurement writes.
export function countRowLine({
  milestone, size, chainNamed, chainTotal, allNamed, allTotal,
}) {
  return `| **after ${milestone}, ${size} active** | ${chainNamed} of ${chainTotal} | ${allNamed} of ${allTotal} |`;
}

// Whether the document's last row is a claim about *this* corpus, and whether
// it is true. `compared` is false when the row names no size, or names one
// that is not the size in hand: the figures are then somebody else's
// measurement and the test holds the rules instead of them.
//
// `measured` is `{ size, chainNamed, chainTotal, allNamed, allTotal }` — what
// `measure()` below returns of the live corpus.
export function checkCountRow(doc, measured) {
  const row = lastCountRow(doc);
  if (!row) return { row: null, compared: false, problems: [`${DOC} §4.1 carries no "after M<n>" row`] };
  if (row.size === null || row.size !== measured.size) {
    return { row, compared: false, problems: [] };
  }
  const problems = [];
  const same = (field, said) => {
    if (row[field] !== measured[field]) problems.push(`${DOC} says ${row[field]} ${said}, and the corpus shows ${measured[field]}`);
  };
  same('chainTotal', 'active chain events');
  same('chainNamed', 'chain events name an actor alive at their start');
  same('allTotal', 'active events');
  same('allNamed', 'active events name an actor alive at their start');
  return { row, compared: true, problems };
}

// --- the measurement ------------------------------------------------------

const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);
const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
export const startOf = (when) => earliest(when?.start);
export const endOf = (when) => (when?.end === null || when?.end === undefined ? Infinity : latest(when.end));

// The two predicates §4.1 names, in one place: the document states the first
// in its own words and both where they differ, and `tests/m53.test.mjs` reads
// them from here rather than writing them twice.
export function alive(actor, year) {
  if (!actor || actor.status !== 'active') return false;
  return year >= startOf(actor.when) && year <= endOf(actor.when);
}
export function meets(actor, when) {
  if (!actor || actor.status !== 'active') return false;
  return !(endOf(actor.when) < startOf(when) || startOf(actor.when) > endOf(when));
}

export const namesOneAlive = (event, byId) => (event.actors ?? [])
  .some((x) => alive(byId.get(x.actor), startOf(event.when)));
export const namesOneMeeting = (event, byId) => (event.actors ?? [])
  .some((x) => meets(byId.get(x.actor), event.when));

async function readDir(kind, root = ROOT) {
  const dir = path.join(root, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
}

// The chain is the one §4.1 counts over: the events `docs/m50-chains.md`
// lists, read off that document as the test reads them.
export async function chainIds(root = ROOT) {
  const doc = await readFile(path.join(root, 'docs/m50-chains.md'), 'utf8');
  return new Set([...doc.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]));
}

// What the corpus shows, by both rules. `size` is the active count, which is
// what the row names itself by.
export function measureOver(events, actors, chain) {
  const byId = new Map(actors.map((a) => [a.id, a]));
  const active = events.filter((e) => e.status === 'active');
  const inChain = active.filter((e) => chain.has(e.id));
  return {
    size: active.length,
    chainTotal: inChain.length,
    chainNamed: inChain.filter((e) => namesOneAlive(e, byId)).length,
    allTotal: active.length,
    allNamed: active.filter((e) => namesOneAlive(e, byId)).length,
    byOverlap: active.filter((e) => namesOneMeeting(e, byId)).length,
  };
}

export async function measure({ root = ROOT } = {}) {
  const [events, actors, chain] = await Promise.all([
    readDir('events', root), readDir('actors', root), chainIds(root),
  ]);
  return measureOver(events, actors, chain);
}

// Which milestone the row is filed under: the caller's word, or the one the
// document's last row already carries, so a retake after a batch of records
// says the same milestone the batch is part of.
export async function retake({ root = ROOT, milestone = null, write = false } = {}) {
  const file = path.join(root, DOC);
  const doc = await readFile(file, 'utf8');
  const last = lastCountRow(doc);
  const measured = await measure({ root });
  const line = countRowLine({
    ...measured, milestone: milestone ?? last?.milestone ?? 'M53',
  });
  if (!write) return { line, measured, written: false };
  if (!last) throw new Error(`${DOC} §4.1 carries no "after M<n>" row to write under`);
  const lines = doc.split('\n');
  // Under the last row when it is somebody else's milestone, over it when it
  // is the same one being re-measured: two rows saying "after M42" would be
  // two answers to one question.
  if (last.milestone === (milestone ?? last.milestone)) lines[last.number - 1] = line;
  else lines.splice(last.number, 0, line);
  await writeFile(file, lines.join('\n'));
  return { line, measured, written: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--milestone');
  const result = await retake({
    milestone: at >= 0 ? args[at + 1] : null,
    write: args.includes('--write'),
  });
  if (args.includes('--json')) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${result.line}\n${result.written ? `written into ${DOC}\n` : ''}`);
}

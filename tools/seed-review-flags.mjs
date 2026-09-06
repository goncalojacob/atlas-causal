#!/usr/bin/env node
// Turns STATUS.md's "Dates to verify" into data: a `review` block on the
// records that list names, so the dashboard can filter by what wants checking
// instead of asking a reviewer to keep a page of prose in their head.
//
//   node tools/seed-review-flags.mjs [--data <dir>] [--dry-run]
//
// The table below is the mapping, written by hand and kept auditable: every
// entry names records STATUS.md lists by id, and the note says what has not
// been checked — never what the record claims. Nothing here is a historical
// statement, and nothing here changes one: the flags say how much a record
// has been read, and only signing it takes them off.
//
// It runs once. A record that already carries a `review` block is left alone,
// so re-running after a review has begun cannot undo anybody's work.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND_DIRS } from './lib/read.mjs';
import { buildIndex, writeIndex } from './build-index.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');

// The four flags in use. Not a schema-level vocabulary — the schema allows
// any slug — but the set this seeding writes, and what each means.
export const FLAGS = Object.freeze({
  date: 'a date, an interval or a year that was written from memory',
  figures: 'a number in the summary that was written from memory',
  claim: 'a statement in the summary that goes beyond the dates',
  place: 'coordinates that stand for something rather than name it',
});

const EVENTS_EXACT_DAY = [
  'pimenta-de-castro-government-1915', 'monarchy-of-the-north-1919', 'legiao-portuguesa-founded-1936',
  'exposicao-mundo-portugues-1940', 'constitutional-revision-1959', 'santa-maria-hijacking-1961',
  'botelho-moniz-coup-attempt-1961', 'delgado-assassinated-1965', 'wiriyamu-massacre-1972',
  'imf-agreement-1978', 'imf-agreement-1983', 'constitutional-revision-1982',
  'soares-elected-president-1986', 'cavaco-absolute-majority-1987', 'expo-98', 'bpn-nationalisation-2008',
];

const EVENTS_RECENT = [
  'troika-programme-ends-2014', 'bes-resolution-2014', 'legislative-election-2015', 'geringonca-2015',
  'marcelo-elected-president-2016', 'euro-2016-final', 'pedrogao-grande-fires-2017', 'october-fires-2017',
  'legislative-election-2019', 'covid-state-of-emergency-2020', 'marcelo-reelected-2021',
  'legislative-election-2022', 'world-youth-day-2023', 'costa-resigns-2023', 'legislative-election-2024',
  'montenegro-government-2024', 'fiftieth-anniversary-25-april-2024', 'government-falls-2025',
  'iberian-blackout-2025', 'legislative-election-2025',
];

const ACTORS_RECENT = [
  'antonio-costa', 'pedro-passos-coelho', 'marcelo-rebelo-de-sousa', 'luis-montenegro', 'andre-ventura',
  'ricardo-salgado', 'partido-socialista', 'psd', 'cds-pp', 'pcp', 'bloco-de-esquerda', 'chega',
  'banco-espirito-santo', 'novo-banco', 'banco-de-portugal', 'european-central-bank', 'european-commission',
];

// The flags each group carries, and the note the reviewer reads first. Ids
// only: what the record says is the record's business.
export const SEED = Object.freeze([
  {
    ids: EVENTS_EXACT_DAY,
    flags: ['date'],
    note: 'Written from memory, and STATUS.md lists it among the dates it is least sure of. Check the day, the month and the interval against a source before signing.',
  },
  {
    ids: EVENTS_RECENT,
    flags: ['date'],
    note: 'Filed in a run that could not reach a source: no date on this record has been checked against one.',
  },
  {
    ids: ['pedrogao-grande-fires-2017', 'october-fires-2017', 'marcelo-reelected-2021', 'legislative-election-2024'],
    flags: ['figures'],
    note: 'The summary carries a number that was written from memory. Check it, or take it out.',
  },
  {
    ids: ['covid-state-of-emergency-2020', 'costa-resigns-2023', 'legislative-election-2025'],
    flags: ['claim'],
    note: 'The summary says more than the dates do, and what it adds was written from memory rather than read in a source.',
  },
  {
    ids: ACTORS_RECENT,
    flags: ['date'],
    note: 'The birth or founding year, and the end where there is one, were written from memory.',
  },
  {
    ids: ['gomes-da-costa', 'paiva-couceiro', 'pimenta-de-castro'],
    flags: ['date'],
    note: 'STATUS.md names these as the least certain years of the twenty persons in the dataset.',
  },
  {
    ids: ['paigc', 'mpla', 'fnla', 'unita', 'fretilin', 'frelimo'],
    flags: ['date'],
    note: 'A founding year from memory, and for the movements that were founded under another name it is also a question of which year the record should carry.',
  },
  {
    ids: ['armed-forces-movement', 'council-of-the-revolution'],
    flags: ['date'],
    note: 'The interval is a convention rather than a date in a document. Decide which it should be and say so in the summary.',
  },
  {
    ids: ['european-economic-community'],
    flags: ['date', 'claim'],
    note: 'Closing this actor rather than renaming it is an editorial choice nobody has made deliberately; the closing year follows from it.',
  },
  {
    ids: ['central-portugal'],
    flags: ['place'],
    note: 'A point invented to stand for an area, not a settlement. Either name the place the events happened at or say in the summary what the point stands for.',
  },
  {
    ids: ['frelimo', 'eduardo-mondlane'],
    flags: ['place'],
    note: 'The point on this record stands for a region or a seat it is not certain of. Check it, and drop it rather than keep a guess.',
  },
]);

// Every dated claim between two actors in the dataset: the four regime-of and
// three part-of intervals follow the actor records they join, and the rest
// were written from memory. Both wanted checking, so all of them are flagged
// and the note says which case a reviewer is in.
//
// It is relations *and tenures* since M30a-2, and only the active ones. The
// twelve `led` records were re-filed as tenures and their flags went with
// them (amendment A4); the tombstones they left behind claim nothing anybody
// is waiting to check, and a withdrawn record is in no queue to filter.
export const RELATION_NOTE = 'The interval is either the actors\' own, and only as good as those records, or it was written from memory. Neither has been read in a source.';

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// The record with `review` in the envelope's own order — after `revised`,
// where the schema puts it — so a file that is written back keeps its shape.
export function withReview(record, review) {
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = value;
    if (key === 'revised') out.review = review;
  }
  if (!Object.hasOwn(out, 'review')) out.review = review;
  return out;
}

// The table, plus every relation, resolved to one entry per id.
export function plan(relationIds = []) {
  const byId = new Map();
  const add = (id, flags, note) => {
    if (!byId.has(id)) byId.set(id, { id, flags: [], note });
    const entry = byId.get(id);
    for (const flag of flags) if (!entry.flags.includes(flag)) entry.flags.push(flag);
    // Two groups meeting on one record: the notes are joined rather than one
    // of them silently winning.
    if (!entry.note.includes(note)) entry.note = entry.note === note ? note : `${entry.note} ${note}`;
  };
  for (const group of SEED) for (const id of group.ids) add(id, group.flags, group.note);
  for (const id of relationIds) add(id, ['date'], RELATION_NOTE);
  for (const entry of byId.values()) entry.flags.sort();
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

async function fileFor(dataDir, id) {
  for (const dir of Object.values(KIND_DIRS)) {
    const file = path.join(dataDir, dir, `${id}.json`);
    if (existsSync(file)) return file;
  }
  return null;
}

// The ids of the active records of one kind, read off the directory: the
// tombstones are the ones this has to leave out.
async function activeIdsIn(dataDir, kind) {
  const dir = path.join(dataDir, KIND_DIRS[kind]);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const record = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
    if (record.status === 'active') out.push(record.id);
  }
  return out;
}

export async function seed(dataDir = DEFAULT_DATA, { dryRun = false } = {}) {
  const intervalIds = [
    ...await activeIdsIn(dataDir, 'relation'),
    ...await activeIdsIn(dataDir, 'tenure'),
  ].sort();
  const entries = plan(intervalIds);

  const written = [];
  const missing = [];
  const kept = [];
  for (const entry of entries) {
    const file = await fileFor(dataDir, entry.id);
    if (!file) {
      missing.push(entry.id);
      continue;
    }
    const record = JSON.parse(await readFile(file, 'utf8'));
    if (isObject(record.review)) {
      kept.push(entry.id);
      continue;
    }
    const next = withReview(record, { flags: entry.flags, note: entry.note });
    if (!dryRun) await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    written.push({ id: entry.id, file: path.relative(dataDir, file), flags: entry.flags });
  }
  return { written, missing, kept };
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--dry-run') dryRun = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const { written, missing, kept } = await seed(dataDir, { dryRun });
  for (const id of missing) console.error(`error: ${id} is in the table and not in ${path.relative(process.cwd(), dataDir) || '.'}/`);
  for (const id of kept) console.log(`${id} already carries a review block: left alone`);
  console.log(`${written.length} record(s) ${dryRun ? 'would be' : ''} flagged`);
  if (missing.length) return 1;
  if (!dryRun && written.length) {
    const built = await buildIndex(dataDir);
    await writeIndex(dataDir, built);
    console.log('index rebuilt');
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

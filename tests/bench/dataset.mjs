// A synthetic atlas, generated from a seed and written to a scratch
// directory: what the tools' benchmark measures itself against.
//
// It is a generator and never its output (review of the health plan,
// finding 26). Nothing here is committed and nothing here is history —
// every title, name and explanation is filler, shaped only so that the
// records pass their schemas and the cross-record rules, because a
// dataset the validator rejects measures the error path instead of the
// one the tools actually walk.
//
// The one thing it does model faithfully is the shape the health review
// found in the real data: **tombstones**. Rule 11's inactive-record checks
// are quadratic in them, and 40 % of this atlas is already retracted, so
// the set is generated with the same share and the retracted records are
// kept internally consistent — a retracted event names retracted actors
// and a retracted place, and every edge that touches one is retracted
// too. Otherwise rule 11 would report ten thousand errors and the numbers
// would be about building an error list.

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KIND_DIRS } from '../../src/kinds.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const AUTHORS = [{ name: 'Bench Generator', github: null }];
const ENVELOPE = { schema: 1, supersededBy: null, aliases: [], authors: AUTHORS, license: 'CC-BY-SA-4.0', created: '2026-09-05', revised: null };

// Long enough for rule 7's MIN_TEXT_LENGTH, and obviously filler.
const EXPLANATION = 'Generated filler, not an argument: this text exists only so the record is long enough to be a record.';

// Deterministic and cheap: the same seed gives the same atlas on any
// machine, which is the whole point of measuring twice.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(6, '0');

// The records, in memory. `tombstones` is the share of events, actors and
// places that are retracted; the edges follow their endpoints.
export function syntheticRecords(events = 20000, { tombstones = 0.4, seed = 20260905, sources = 200, actors = 500, perPlace = 8, placed = 0.7 } = {}) {
  const random = seeded(seed);
  const records = [];

  const sourceIds = [];
  for (let i = 0; i < sources; i += 1) {
    const id = `bench-source-${pad(i)}`;
    sourceIds.push(id);
    records.push({
      ...ENVELOPE,
      id,
      kind: 'source',
      status: 'active',
      type: 'book',
      // A creator per source, so rule 9's "two authors who are not the same
      // author" is a real comparison rather than a trivial one.
      creators: [`Bench Author ${pad(i)}`],
      title: `Bench source ${pad(i)}`,
      year: 1900 + (i % 120),
      publisher: 'Bench Press',
      isbn: null,
      doi: `10.5555/bench.${pad(i)}`,
      url: null,
      accessed: null,
      repository: null,
      reference: null,
    });
  }
  const citation = (i) => [{ source: sourceIds[i % sourceIds.length], locator: null }];
  // Two sources by two authors: what rule 9 asks of a consensus edge.
  const twoCitations = (i) => [
    { source: sourceIds[i % sourceIds.length], locator: null },
    { source: sourceIds[(i + 1) % sourceIds.length], locator: null },
  ];

  // Retracted first in each list, so an index says which pool a record
  // belongs to and the two never reference each other.
  const deadActors = Math.round(actors * tombstones);
  for (let i = 0; i < actors; i += 1) {
    records.push({
      ...ENVELOPE,
      id: `bench-actor-${pad(i)}`,
      kind: 'actor',
      status: i < deadActors ? 'retracted' : 'active',
      sources: citation(i),
      actorType: 'polity',
      names: [`Bench actor ${pad(i)}`],
      summary: 'Generated filler. This polity never existed and did nothing.',
      when: { start: 1300, end: 2100 },
    });
  }

  const placeCount = Math.max(2, Math.round((events * placed) / perPlace));
  const deadPlaces = Math.round(placeCount * tombstones);
  for (let i = 0; i < placeCount; i += 1) {
    records.push({
      ...ENVELOPE,
      id: `bench-place-${pad(i)}`,
      kind: 'place',
      status: i < deadPlaces ? 'retracted' : 'active',
      sources: [],
      names: [`Bench place ${pad(i)}`],
      where: { lon: random() * 360 - 180, lat: random() * 130 - 60, precision: 'city', label: `Bench place ${pad(i)}` },
      region: 'europe',
      summary: null,
    });
  }

  // Every fifth event and the one after it are tombstones at 40 %: a share
  // taken by arithmetic rather than by the random draw, so the count is
  // exact and the pools below can be sized from it.
  const dead = (i) => (i % 100) < Math.round(tombstones * 100);
  const ids = [];
  for (let i = 0; i < events; i += 1) {
    const id = `bench-event-${pad(i)}`;
    ids.push(id);
    const retracted = dead(i);
    // A place from the pool that matches: an active event on a retracted
    // place is rule 11's error, and this set is about how long the rules
    // take, not about how long a list of ten thousand errors takes.
    const pool = retracted ? deadPlaces : placeCount - deadPlaces;
    const place = pool > 0 && random() < placed
      ? `bench-place-${pad(retracted ? i % deadPlaces : deadPlaces + (i % (placeCount - deadPlaces)))}`
      : null;
    const actorPool = retracted ? deadActors : actors - deadActors;
    const actor = `bench-actor-${pad(retracted ? i % deadActors : deadActors + (i % (actors - deadActors)))}`;
    records.push({
      ...ENVELOPE,
      id,
      kind: 'event',
      status: retracted ? 'retracted' : 'active',
      sources: citation(i),
      title: `Bench event ${pad(i)}`,
      summary: 'Generated filler. Nothing here happened and nothing here is claimed.',
      // Non-decreasing with the index, so every edge below runs forward in
      // time and rule 4 has nothing to say.
      when: { start: 1400 + Math.floor((i * 600) / events), end: 1400 + Math.floor((i * 600) / events) },
      place,
      region: place === null ? 'europe' : null,
      actors: actorPool > 0 ? [{ actor, role: 'signatory' }] : [],
    });
  }

  // Two edges per event, both forward: the graph is a DAG by construction
  // and every active event has a degree, so the warning pass has nothing to
  // report either.
  let edge = 0;
  for (let i = 0; i + 2 < events; i += 1) {
    for (const step of [1, 2]) {
      const from = ids[i];
      const to = ids[i + step];
      const retracted = dead(i) || dead(i + step);
      const type = ['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired'][edge % 5];
      // A fifth of them consensus, so rule 9's per-source author sets are
      // built and compared rather than skipped.
      const consensus = !retracted && edge % 5 === 0;
      records.push({
        ...ENVELOPE,
        id: `${from}--${to}--${type}`,
        kind: 'edge',
        status: retracted ? 'retracted' : 'active',
        sources: consensus ? twoCitations(edge) : citation(edge),
        from,
        to,
        type,
        confidence: consensus ? 'consensus' : 'probable',
        explanation: EXPLANATION,
        dispute: null,
      });
      edge += 1;
    }
  }
  return records;
}

// The same atlas on disk, in a scratch directory outside the repository,
// with the real regions.json beside it so the lanes resolve. Generated once
// per (count, share, seed) and kept: writing thirty thousand files takes
// longer than any case that reads them, and a benchmark that spends its
// time in mkdir measures mkdir.
//
// **`under` is required, and there is no default.** This wrote 62 657 files
// into `os.tmpdir()` with no option and nothing to remove them (health review
// of 6 September, R4); where the atlas lands is now the caller's decision —
// `node tests/bench/run.mjs --dataset <dir>` — and so is removing it, which
// is one `rm -r` on a directory they named.
export async function syntheticDataDir(events = 20000, options = {}) {
  const { tombstones = 0.4, seed = 20260905, under = null } = options;
  if (typeof under !== 'string' || under === '') {
    throw new Error('syntheticDataDir needs `under`: the directory to write the synthetic atlas into (run.mjs --dataset <dir>)');
  }
  const dir = path.join(under, `atlas-bench-${events}-${Math.round(tombstones * 100)}-${seed}`);
  const stamp = path.join(dir, '.generated');
  const want = `${events} ${tombstones} ${seed}\n`;
  if (existsSync(stamp) && await readFile(stamp, 'utf8') === want) return dir;
  await rm(dir, { recursive: true, force: true });
  const records = syntheticRecords(events, options);
  for (const sub of Object.values(KIND_DIRS)) await mkdir(path.join(dir, sub), { recursive: true });
  // Batched for the same reason readRecords is: thirty thousand awaits in a
  // row spend their time waiting one file at a time.
  const BATCH = 64;
  for (let i = 0; i < records.length; i += BATCH) {
    await Promise.all(records.slice(i, i + BATCH).map((record) => writeFile(
      path.join(dir, KIND_DIRS[record.kind], `${record.id}.json`),
      `${JSON.stringify(record, null, 2)}\n`,
      'utf8',
    )));
  }
  await writeFile(path.join(dir, 'regions.json'), await readFile(path.join(ROOT, 'data', 'regions.json'), 'utf8'), 'utf8');
  await writeFile(stamp, want, 'utf8');
  return dir;
}

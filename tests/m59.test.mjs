import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { remeasure } from '../tools/m59-singletons.mjs';
import { JOINS } from '../tools/m59-join.mjs';
import { DISSOLUTIONS, HORIZON_FLAG, DATED_FLAG } from '../tools/m59-ends.mjs';

// M59 clears what M51 left at the 1885/1886 seam: the records that end where
// Historical Basemaps stops and have no counterpart to be joined to. Every
// test here is written to hold both before and after the records move, because
// the commit that teaches the tests goes with the one that changes what they
// see or before it (deviations 711 and 717), and a test that must fail for one
// commit is not a test.
//
// **Nothing here pins a count of actors.** The brief asks for that explicitly
// and it is the right ask: a count is a fact about one afternoon, and a test
// that holds one turns every later import into a false failure. What is
// asserted instead is correspondence — between a ratio in the document and the
// ground it was measured from, between a verdict in the document and what the
// records actually are, and between a date on a record and the citation that
// licensed it. Counts live in `STATUS.md`, which is an account and not a gate.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m59-singletons.md';
const doc = await readFile(path.join(ROOT, DOC), 'utf8');

const readDir = async (kind) => {
  const dir = path.join(ROOT, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
};

const actors = await readDir('actors');
const byId = new Map(actors.map((a) => [a.id, a]));
for (const a of actors) for (const alias of a.aliases ?? []) if (!byId.has(alias)) byId.set(alias, a);
const active = actors.filter((a) => a.status === 'active');
const endsAtTheSeam = active.filter((a) => a.when?.end === 1885);
const flagsOf = (a) => a.review?.flags ?? [];

// --- the file and the ground -------------------------------------------

// Section 4's table is the whole argument of this milestone: it is what says
// which records stand on which ground, and every verdict in section 6 rests on
// a row of it. So it is not allowed to be prose that once was true.
//
// It is re-measured by the **presence ids** each row names, never by the actor
// ids, and that is deliberate. A join rewrites the `actor` of every presence of
// the record it absorbs and takes that record out of the list the tool
// discovers, so a lookup through the actor would give the measurement before
// this milestone ran and nothing after it. A presence id does not move.
const ROW = /^\| (\d\.\d{4}) \| (\d\.\d{4}) \| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \| [\d.]+ \| [\d.]+ \| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \|$/;
const measuredRows = doc.split('\n')
  .map((line) => ROW.exec(line))
  .filter(Boolean)
  .map(([, jaccard, ratio, before, after, lastBefore, firstAfter]) => ({
    before, after, lastBefore, firstAfter, jaccard: Number(jaccard), ratio: Number(ratio),
  }));

test(`${DOC} carries the measurement it says it carries`, () => {
  assert.ok(measuredRows.length > 0, `${DOC} has no readable row in its measurement table`);
});

test(`every overlap in ${DOC} is the one the ground still gives`, () => {
  const measured = new Map(remeasure(measuredRows).map((r) => [`${r.lastBefore}--${r.firstAfter}`, r]));
  const drifted = [];
  for (const row of measuredRows) {
    const m = measured.get(`${row.lastBefore}--${row.firstAfter}`);
    if (!m || m.ratio === null) { drifted.push(`${row.before} / ${row.after}: the presences it names no longer measure`); continue; }
    if (Math.abs(m.ratio - row.ratio) > 0.0005) drifted.push(`${row.before} / ${row.after}: overlap says ${row.ratio}, measures ${m.ratio}`);
    if (Math.abs(m.jaccard - row.jaccard) > 0.0005) drifted.push(`${row.before} / ${row.after}: jaccard says ${row.jaccard}, measures ${m.jaccard}`);
  }
  assert.deepEqual(drifted, [], drifted.join('; '));
});

// --- every record at the seam is accounted for -------------------------

// The brief's first test, in the form that holds on every commit. A record may
// still end in 1885 — this milestone would rather mark one than invent a date
// for it — but it may not end there unaccounted for. Before the records move
// this holds because the document names all hundred; after they move it holds
// because it names the ones that stayed.
test(`${DOC} accounts for every actor that still ends in exactly 1885`, () => {
  const unlisted = endsAtTheSeam
    .filter((a) => !doc.includes(`\`${a.id}\``))
    .map((a) => a.id);
  assert.deepEqual(unlisted.sort(), [], unlisted.length
    ? `${unlisted.length} active actor(s) end in exactly 1885 and are named nowhere in ${DOC}: ${unlisted.join(', ')}. `
      + 'A record left at the seam is honest; one left there unwritten is not.'
    : undefined);
});

// --- a join and the measurement under it -------------------------------

// The brief's second test: a join rests on a measured overlap, and the
// measurement is in the document. Not on a number this file carries — on a row
// of section 4, which the drift test above holds to the ground.
test('every join this milestone makes rests on a row of the measurement table', () => {
  const rows = new Map(measuredRows.map((r) => [`${r.before}--${r.after}`, r]));
  const unsupported = [];
  for (const { survivor, merged, overlap: claimed } of JOINS) {
    const row = rows.get(`${survivor}--${merged}`) ?? rows.get(`${merged}--${survivor}`);
    if (!row) { unsupported.push(`${survivor} / ${merged}: no measured row in ${DOC}`); continue; }
    if (Math.abs(row.ratio - claimed) > 0.0005) unsupported.push(`${survivor} / ${merged}: the join says ${claimed}, the table says ${row.ratio}`);
    // M51's cut, inherited rather than re-fitted: below it the two records are
    // not on the same ground and no name may join them.
    if (row.ratio < 0.5) unsupported.push(`${survivor} / ${merged}: ${row.ratio} is below M51's cut of 0.50`);
  }
  assert.deepEqual(unsupported, [], unsupported.join('; '));
});

// A join is one record absorbing another, and rule 11 says the record and
// everything naming it move together. Vacuous until the first join lands.
test('a join leaves one active record, a merged one pointing at it, and no presence behind', async () => {
  const presences = await readDir('presences');
  const broken = [];
  for (const { survivor: survivorId, merged: mergedId } of JOINS) {
    const survivor = byId.get(survivorId);
    const merged = byId.get(mergedId);
    if (!survivor || !merged) { broken.push(`${survivorId} / ${mergedId}: a record is missing`); continue; }
    if (survivor.status === 'active' && merged.status === 'active') continue; // not joined yet
    if (survivor.status !== 'active') broken.push(`${survivorId}: the survivor is ${survivor.status}, not active`);
    else if (merged.status !== 'merged') broken.push(`${mergedId}: status is ${merged.status}, not "merged"`);
    else if (merged.supersededBy !== survivorId) broken.push(`${mergedId}: supersededBy is ${merged.supersededBy}, not ${survivorId}`);
    else if (presences.some((p) => p.actor === mergedId)) broken.push(`${mergedId}: a presence still names it`);
    // No date is authored: the survivor's span is the 1885 record's own start
    // and the 1886 record's own end, and both were in the atlas before this.
    else if (survivor.when?.end === 1885) broken.push(`${survivorId}: still ends in 1885 after absorbing ${mergedId}`);
  }
  assert.deepEqual(broken, [], broken.join('; '));
});

// --- a date this milestone writes --------------------------------------

// The brief's "no invented date", as a check a reader can run. Vacuous until
// the first dissolution lands. What it asks of a record is not that its year be
// right — no test can ask that — but that the year name the item and the
// property it was read from, so that a person can go and disagree with it.
const QID = /\bQ[1-9][0-9]*\b/;

test('a dissolution this milestone writes cites the Wikidata item and the property its date came from', () => {
  const bad = [];
  for (const a of actors) {
    if (!flagsOf(a).includes(DATED_FLAG)) continue;
    const cited = (a.sources ?? []).filter((s) => s.source === 'wikidata' && /\bP576\b/.test(s.locator ?? ''));
    if (!cited.length) { bad.push(`${a.id}: nothing in sources cites a P576`); continue; }
    if (!cited.some((s) => QID.test(s.locator))) bad.push(`${a.id}: its P576 citation names no Wikidata item`);
    if (a.when?.end === 1885) bad.push(`${a.id}: carries a cited dissolution and still ends in 1885`);
  }
  assert.deepEqual(bad, [], bad.join('; '));
});

test(`a dissolution in ${DOC} and the year on the record are the same year`, () => {
  const wrong = [];
  for (const { actor: id, end, qid } of DISSOLUTIONS) {
    const a = byId.get(id);
    if (!a) { wrong.push(`${id}: no such record`); continue; }
    if (!flagsOf(a).includes(DATED_FLAG)) continue; // not dated yet
    if (a.when?.end !== end) wrong.push(`${id}: the table says ${end}, the record says ${a.when?.end}`);
    if (!(a.sources ?? []).some((s) => (s.locator ?? '').includes(qid))) wrong.push(`${id}: nothing on the record cites ${qid}`);
    if (!doc.includes(qid)) wrong.push(`${id}: ${qid} is cited on the record and appears nowhere in ${DOC}`);
  }
  assert.deepEqual(wrong, [], wrong.join('; '));
});

// --- the mark, and the rule the whole milestone is for -----------------

// A mark is not a new record type and not a new field: it is the two the
// envelope already has for saying why a record is what it is. What this asks is
// that a record claiming the mark actually says what the mark means, so that
// the flag cannot become a label nobody wrote a reason under.
test(`a record marked ${HORIZON_FLAG} says on its own face what 1885 is`, () => {
  const silent = [];
  for (const a of actors) {
    if (!flagsOf(a).includes(HORIZON_FLAG)) continue;
    const note = a.review?.note ?? '';
    if (!note) { silent.push(`${a.id}: carries the flag and no note`); continue; }
    if (!note.includes('Historical Basemaps')) silent.push(`${a.id}: its note does not name the source whose horizon 1885 is`);
    if (!note.includes('1885')) silent.push(`${a.id}: its note does not name the year it is about`);
  }
  assert.deepEqual(silent, [], silent.join('; '));
});

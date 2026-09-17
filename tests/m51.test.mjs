import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PAIRS, measure } from '../tools/m51-overlaps.mjs';

// M51 closes the 1885/1886 seam on territory. Every test here is written to
// hold both before and after the records move, because the commit that
// teaches the tests goes before the one that changes what they see
// (deviations 711 and 717) and a test that must fail for one commit is not a
// test, it is a broken gate.
//
// So nothing below pins a state. Each asserts a *correspondence*: between the
// ratios in `docs/m51-overlaps.md` and the ground they were measured from,
// between a verdict in that file and what the records actually are, and
// between a succession and the citation that licensed its date. A run that
// joins a pair and does not say so fails, and so does one that says so and
// does not do it.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m51-overlaps.md';
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
const relations = await readDir('relations');
const presences = await readDir('presences');
const events = await readDir('events');
const byId = new Map(actors.map((a) => [a.id, a]));

// --- the file and the ground -------------------------------------------

// The overlap table is the whole argument of this milestone: it is what says
// two records stand on the same land, and every verdict rests on it. So it is
// not allowed to be prose that once was true. `tools/m51-overlaps.mjs`
// re-measures from `data/` in under a second, and this holds the file to it.
test(`every overlap in ${DOC} is the one the ground still gives`, () => {
  const rows = new Map(measure().map((r) => [`${r.before}--${r.after}`, r.ratio]));
  const written = doc.split('\n')
    .map((line) => /^\| (\d\.\d{4}) \| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \|/.exec(line))
    .filter(Boolean)
    .map(([, ratio, before, after]) => ({ before, after, written: Number(ratio) }));
  assert.equal(written.length, PAIRS.length,
    `${DOC} should carry one measured row per candidate pair`);
  const drifted = written
    .map((row) => ({ ...row, measured: rows.get(`${row.before}--${row.after}`) }))
    .filter((row) => row.measured === undefined || Math.abs(row.measured - row.written) > 0.0005);
  assert.deepEqual(drifted, [], drifted.length
    ? `${drifted.length} row(s) in ${DOC} no longer match the presences they were measured from: `
      + `${drifted.map((d) => `${d.before} says ${d.written}, measures ${d.measured}`).join('; ')}`
    : undefined);
});

// --- the verdict and the records ---------------------------------------

// Section 5 of the document sorts all 26 into four verdicts. This reads them
// back out of the prose so that the file cannot claim one thing while the
// records do another.
const section = (heading) => {
  const from = doc.indexOf(`**${heading}`);
  if (from < 0) return '';
  const next = doc.indexOf('\n**', from + 3);
  return doc.slice(from, next < 0 ? doc.length : next);
};
const verdicts = new Map();
for (const [heading, verdict] of [['Joined', 'joined'], ['Split, with a sourced date', 'split'], ['Left open', 'open'], ['Not a pair', 'not-a-pair']]) {
  const text = section(heading);
  for (const [before, after] of PAIRS) {
    if (text.includes(`\`${before}\``) && text.includes(`\`${after}\``)) verdicts.set(`${before}--${after}`, verdict);
  }
}

test(`${DOC} gives all 26 candidate pairs a verdict`, () => {
  const missing = PAIRS.filter(([b, a]) => !verdicts.has(`${b}--${a}`)).map(([b, a]) => `${b} / ${a}`);
  assert.deepEqual(missing, [], missing.length
    ? `${missing.length} pair(s) from docs/m49-actors.md are in no verdict section of ${DOC}: ${missing.join(', ')}`
    : undefined);
});

// The brief's first test, as a correspondence and not as a count. A pair may
// still sit at the seam — this milestone would rather leave one open than
// guess a date for it — but it may not sit there unnamed. The stem reduction
// is the one section 4 of the document describes: strip what the two imports
// added (`-before-1886`, `-under-<sovereign>`, `-fr`, `-uk`) and nothing else,
// so `congo-before-1886` and `congo-under-france` are one stem and
// `ottoman-empire` and `turkey-ottoman-empire` are not.
const stemOf = (id) => id.replace(/-before-1886$/, '').replace(/-under-.+$/, '').replace(/-(fr|uk)$/, '');

test(`every same-stem pair still at the seam is named in ${DOC} with a verdict`, () => {
  const active = actors.filter((a) => a.status === 'active');
  const begins = new Map();
  for (const a of active.filter((x) => x.when?.start === 1886)) {
    const stem = stemOf(a.id);
    if (!begins.has(stem)) begins.set(stem, []);
    begins.get(stem).push(a.id);
  }
  const unlisted = [];
  for (const a of active.filter((x) => x.when?.end === 1885)) {
    for (const other of begins.get(stemOf(a.id)) ?? []) {
      if (!verdicts.has(`${a.id}--${other}`)) unlisted.push(`${a.id} / ${other}`);
    }
  }
  assert.deepEqual(unlisted.sort(), [], unlisted.length
    ? `${unlisted.length} pair(s) end 1885 against a same-stem record beginning 1886 and carry no verdict in ${DOC}: `
      + `${unlisted.join(', ')}. A pair left at the seam is honest; one left there unwritten is not.`
    : undefined);
});

// The other direction: a pair the file calls open, or no pair at all, must
// still have both its records standing. Joining one of them quietly and
// leaving the file saying "open" is the same mistake the other way round.
test('a pair the file leaves open still has both its records active', () => {
  const wrong = PAIRS
    .filter((pair) => ['open', 'not-a-pair'].includes(verdicts.get(`${pair[0]}--${pair[1]}`)))
    .filter(([b, a]) => byId.get(b)?.status !== 'active' || byId.get(a)?.status !== 'active')
    .map(([b, a]) => `${b} / ${a}`);
  assert.deepEqual(wrong, [], wrong.length
    ? `${wrong.length} pair(s) are left open or struck in ${DOC} and one of the two records is no longer active: ${wrong.join(', ')}`
    : undefined);
});

// A join is one record absorbing another, and rule 11 says the record and
// everything naming it move together. Vacuous before the first join lands.
//
// **The span rule has an exception since M55**, and the exception is the
// reason the rule exists rather than a hole in it. M51's nineteen joins had no
// date for either side, so the only honest interval was the two files' own
// boundaries: the 1885-side record's start and the 1886-side record's end,
// neither authored here. M55 joined `germany` into `germany-prussia` with
// Q43287's P571 and P576 in hand — dates that are better than both boundaries
// and that no longer end in 1945, because the Weimar Republic and the Nazi
// state were split out of the survivor in the same milestone. So where a
// survivor's interval is cited to a Wikidata item and property, that is what
// is asserted of it; where it is not, M51's rule stands unchanged.
const intervalCited = (a) => (a.sources ?? [])
  .some((s) => s.source === 'wikidata' && /\bP5(71|76)\b/.test(s.locator ?? ''));

test('a join leaves one active record and a merged one pointing at it', () => {
  const broken = [];
  for (const [before, after] of PAIRS) {
    if (verdicts.get(`${before}--${after}`) !== 'joined') continue;
    const b = byId.get(before);
    const a = byId.get(after);
    if (!b || !a) { broken.push(`${before} / ${after}: a record is missing`); continue; }
    if (b.status === 'active' && a.status === 'active') continue; // not joined yet
    const [survivor, merged] = b.status === 'active' ? [b, a] : [a, b];
    if (survivor.status !== 'active') broken.push(`${before} / ${after}: neither record is active`);
    else if (merged.status !== 'merged') broken.push(`${merged.id}: status is ${merged.status}, not "merged"`);
    else if (merged.supersededBy !== survivor.id) broken.push(`${merged.id}: supersededBy is ${merged.supersededBy}, not ${survivor.id}`);
    else if (intervalCited(survivor)) continue;
    else if (survivor.when?.start !== b.when?.start) broken.push(`${survivor.id}: begins ${survivor.when?.start}, not ${before}'s own ${b.when?.start}`);
    else if (survivor.when?.end !== a.when?.end) broken.push(`${survivor.id}: ends ${survivor.when?.end}, not ${after}'s own ${a.when?.end}`);
  }
  assert.deepEqual(broken, [], broken.join('; '));
});

// --- what a split is allowed to say ------------------------------------

// The brief's third test, scoped to what this milestone writes. The 128
// `succeeded` relations the corpus already held were derived by the CShapes
// import from boundaries the dataset itself draws, and they cite the dataset;
// they are not rewritten here. What may not happen is a succession written by
// M51 — flagged `m51-split` — whose date rests on nothing a reader can check.
const QID = /\bQ[1-9][0-9]*\b/;
const PROPERTY = /\bP5(71|76)\b/;

test('a succession this milestone writes cites a Wikidata item and the property its date came from', () => {
  const bad = [];
  for (const rel of relations) {
    if (!(rel.review?.flags ?? []).includes('m51-split')) continue;
    const text = `${rel.note ?? ''} ${JSON.stringify(rel.sources ?? [])}`;
    if (!QID.test(text)) bad.push(`${rel.id}: names no Wikidata item`);
    else if (!PROPERTY.test(text)) bad.push(`${rel.id}: names no property (P571 or P576) for its date`);
  }
  assert.deepEqual(bad, [], bad.join('; '));
});

// --- the records this milestone touched --------------------------------

// Not a sweep of the corpus: 169 presences already sit outside their actor's
// interval and predate this milestone, and the validator reports them as the
// warning `presence-outside-actor-when`. This asks only about the records M51
// moved, where a presence outside the interval would be this run's own doing.
const touched = new Set(actors.filter((a) => (a.review?.flags ?? []).some((f) => f === 'm51-joined' || f === 'm51-split')).map((a) => a.id));

test('a presence of a record this milestone touched falls inside that actor\'s interval', () => {
  const outside = [];
  for (const p of presences) {
    if (p.status !== 'active' || !touched.has(p.actor)) continue;
    const a = byId.get(p.actor);
    const start = a.when?.start;
    const end = a.when?.end ?? Infinity;
    const from = p.when?.start;
    const to = p.when?.end ?? Infinity;
    if (to < start || from > end) outside.push(`${p.id} (${from}–${p.when?.end ?? 'open'}) is outside ${a.id} (${start}–${a.when?.end ?? 'open'})`);
  }
  assert.deepEqual(outside.sort(), [], outside.join('; '));
});

// The brief's fifth test, and the same scoping. `chinese-civil-war` (1946)
// names `taiwan` (1949–open); it is known, it predates M51, and this run does
// not touch either record, so it is listed here rather than fixed.
const KNOWN = new Set(['chinese-civil-war--taiwan']);

test('an event naming a record this milestone touched names one that was alive then', () => {
  const wrong = [];
  for (const event of events) {
    if (event.status !== 'active') continue;
    const year = event.when?.start;
    if (typeof year !== 'number') continue;
    for (const entry of event.actors ?? []) {
      if (!touched.has(entry.actor)) continue;
      if (KNOWN.has(`${event.id}--${entry.actor}`)) continue;
      const a = byId.get(entry.actor);
      if (!a) { wrong.push(`${event.id} names ${entry.actor}, which is not there`); continue; }
      const start = a.when?.start;
      const end = a.when?.end ?? Infinity;
      if (year < start || year > end) wrong.push(`${event.id} (${year}) names ${a.id} (${start}–${a.when?.end ?? 'open'})`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

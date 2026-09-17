import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M55 splits `germany-prussia` into the polities it was carrying, puts the
// Kingdom of Prussia on its own cited span, and gives every event the German
// actor that held its role at the time.
//
// Written the way `tests/m51.test.mjs`, `tests/m52.test.mjs` and
// `tests/m53.test.mjs` were: every test is a *correspondence* between
// `docs/m55-germany.md` and the records, so the document cannot claim
// something the data did not do, or stay silent about something it did.
// Nothing here pins a count of actors.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m55-germany.md';
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
const byId = new Map(actors.map((a) => [a.id, a]));
const byRelation = new Map(relations.map((r) => [r.id, r]));
const byPresence = new Map(presences.map((p) => [p.id, p]));

const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);
const rows = (re) => doc.split('\n').map((line) => re.exec(line)).filter(Boolean);

// --- §1: the lookup, and the promise that nothing else was authored ------

const LOOKUP_ROW = /^\| \*\*[^|]+\*\* \| `(Q[1-9][0-9]*)` \| ([^|]+?) \| ([^|]+?) \|$/;
const looked = rows(LOOKUP_ROW).map(([, qid, inception, dissolved]) => ({ qid, inception, dissolved }));

// --- §2: the records -----------------------------------------------------

const POLITY_ROW = /^\| `([a-z0-9-]+)` \| ([^|]+?) \| (-?\d{3,4}) – (-?\d{3,4}|open) \| ([^|]+?) \|/;
const written = rows(POLITY_ROW).map(([, id, name, start, end, provenance]) => ({
  id, name, start: Number(start), end: end === 'open' ? null : Number(end), provenance,
}));

test(`${DOC} §2 names the records M55 wrote, their dates and where each date came from`, () => {
  assert.ok(written.length > 0, `${DOC} §2 carries no table`);
  const wrong = [];
  for (const row of written) {
    const a = byId.get(row.id);
    if (!a) { wrong.push(`${row.id}: no such record`); continue; }
    if (a.status !== 'active') wrong.push(`${row.id}: ${a.status}, not active`);
    if (a.names?.[0] !== row.name) wrong.push(`${row.id}: named "${a.names?.[0]}", not "${row.name}"`);
    if (earliest(a.when?.start) !== row.start) wrong.push(`${row.id}: begins ${earliest(a.when?.start)}, not ${row.start}`);
    const end = a.when?.end === null || a.when?.end === undefined ? null : latest(a.when.end);
    if (end !== row.end) wrong.push(`${row.id}: ends ${end}, not ${row.end}`);
    // Every QID and property the row claims is cited on the record itself, so
    // the document cannot claim a provenance the record does not carry.
    const cited = JSON.stringify(a.sources ?? []);
    for (const token of row.provenance.match(/Q[1-9][0-9]*|P5(?:71|76)/g) ?? []) {
      if (!cited.includes(token)) wrong.push(`${row.id}: ${DOC} says ${token} and the record cites no such thing`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// The "no invented date" rule as an assertion rather than as a promise: every
// year a record of this milestone carries is a year §1 gives.
test(`${DOC} §1 cites a QID and a property for every date M55's own records give`, () => {
  assert.ok(looked.length > 0, `${DOC} §1 carries no lookup table`);
  const years = new Set();
  for (const row of looked) {
    for (const value of [row.inception, row.dissolved]) {
      for (const [, year] of value.matchAll(/(-?\d{3,4})(?:-\d{2})?/g)) years.add(Number(year));
    }
  }
  const wrong = [];
  for (const row of written) {
    if (!years.has(row.start)) wrong.push(`${row.id}: begins ${row.start} and no row of §1 gives that year`);
    if (row.end !== null && !years.has(row.end)) wrong.push(`${row.id}: ends ${row.end} and no row of §1 gives that year`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// --- §3: the territory ---------------------------------------------------

const PRESENCE_ROW = /^\| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \| (\d{4}) \| (\d{4}) \|/;
const moved = rows(PRESENCE_ROW).map(([, id, actor, from, to]) => ({ id, actor, from: Number(from), to: Number(to) }));

test(`${DOC} §3's periods are where it says, and every one belongs to a record`, () => {
  assert.ok(moved.length > 0, `${DOC} §3 carries no table`);
  const wrong = [];
  for (const row of moved) {
    const p = byPresence.get(row.id);
    if (!p) { wrong.push(`${row.id}: no such presence`); continue; }
    if (p.status !== 'active') wrong.push(`${row.id}: ${p.status}, not active`);
    if (p.actor !== row.actor) wrong.push(`${row.id}: belongs to ${p.actor}, not ${row.actor}`);
    if (earliest(p.when?.start) !== row.from) wrong.push(`${row.id}: begins ${earliest(p.when?.start)}, not ${row.from}`);
    if (latest(p.when?.end) !== row.to) wrong.push(`${row.id}: ends ${latest(p.when?.end)}, not ${row.to}`);
    if (!byId.get(p.actor)) wrong.push(`${row.id}: ${p.actor} is not an actor`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// "Presences move; geometry is never redrawn." A period cut at a cited date
// leaves two halves, and the two halves carry one outline between them — the
// same key, and a file list that is the one the dataset already filed it under.
test('the two halves of every period M55 cut carry one outline between them', () => {
  const halves = new Map();
  for (const p of presences) {
    if (!(p.review?.flags ?? []).includes('m55-split')) continue;
    const key = p.geometry?.key;
    if (!halves.has(key)) halves.set(key, []);
    halves.get(key).push(p);
  }
  assert.ok(halves.size > 0, 'no presence is flagged m55-split');
  const wrong = [];
  for (const [key, pair] of halves) {
    if (pair.length !== 2) { wrong.push(`key ${key}: ${pair.length} half/halves, not two`); continue; }
    const [first, second] = pair.sort((a, b) => earliest(a.when.start) - earliest(b.when.start));
    if (JSON.stringify(first.sources) !== JSON.stringify(second.sources)) {
      wrong.push(`key ${key}: the two halves cite different sources, so they are not one period`);
    }
    if (latest(first.when?.end) !== earliest(second.when?.start)) {
      wrong.push(`key ${key}: ${first.id} ends ${latest(first.when?.end)} and ${second.id} begins ${earliest(second.when?.start)}`);
    }
    for (const half of pair) {
      const files = half.geometry?.files ?? [];
      if (files.length === 0) wrong.push(`${half.id}: carries no outline`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// --- §4: the successions -------------------------------------------------

const SUCCESSION_ROW = /^\| `([a-z0-9-]+--[a-z0-9-]+--succeeded)` \| (none|\d+ years?) \| (yes|no) \| ([^|]+?) \|/;
const successions = rows(SUCCESSION_ROW).map(([, id, gap, meet, names]) => ({
  id, gap: gap === 'none' ? 0 : Number(/\d+/.exec(gap)[0]), meet: meet === 'yes', names: names.trim(),
}));

test(`${DOC} §4 lists every succession M55 wrote, with the gap the records show`, () => {
  const mine = relations
    .filter((r) => r.type === 'succeeded' && r.status === 'active' && r.origin?.run === 'm55')
    .map((r) => r.id).sort();
  assert.deepEqual(successions.map((row) => row.id).sort(), mine,
    `${DOC} §4 and the successions M55 wrote are not the same set`);
  const wrong = [];
  for (const row of successions) {
    const r = byRelation.get(row.id);
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to) { wrong.push(`${row.id}: an end does not resolve to an actor`); continue; }
    const gap = Math.max(0, earliest(to.when?.start) - latest(from.when?.end));
    if (gap !== row.gap) wrong.push(`${row.id}: the gap is ${gap} years and ${DOC} says ${row.gap}`);
    // A succession's dates are cited: M52's amendment A2, which M53 kept.
    if (!Array.isArray(r.sources) || r.sources.length === 0) wrong.push(`${row.id}: cites no source`);
    if (!(r.sources ?? []).some((s) => /Q\d+, P57[16]/.test(s.locator ?? ''))) {
      wrong.push(`${row.id}: cites no QID and property for the date it gives`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// The brief's second test. A gap no longer forbids a succession, so what a
// succession owes the reader is the gap itself: where the two cited dates do
// not meet, the relation's own note carries the successor's date and names
// what stood in between. A row saying "no" and a note that says nothing is
// the thing the owner's relaxation was not meant to license.
test('every succession whose cited dates do not meet says so in its own note', () => {
  const thin = [];
  for (const row of successions) {
    const r = byRelation.get(row.id);
    if (!r) { thin.push(`${row.id}: no such relation`); continue; }
    if (row.meet) {
      if (row.names !== '—') thin.push(`${row.id}: ${DOC} says the dates meet and names an occupant anyway`);
      continue;
    }
    const note = r.note ?? '';
    if (!note) { thin.push(`${row.id}: carries no note`); continue; }
    if (!note.includes(row.names)) thin.push(`${row.id}: the note does not carry ${row.names}`);
    if (note.length < 80) thin.push(`${row.id}: the note is too short to name what stood in the gap`);
  }
  assert.deepEqual(thin.sort(), [], thin.join('; '));
});

// --- §6.1: the presences that begin before their actor does --------------

const GAP_ROW = /^\| `([a-z0-9-]+)` \| (\d{4}) \| (\d{4}) \| /;
const gapListed = rows(GAP_ROW).map(([, id, begins, actorBegins]) => ({ id, begins: Number(begins), actorBegins: Number(actorBegins) }));

test(`the presences ${DOC} §6.1 lists are exactly the ones flagged m55-gap`, () => {
  const flagged = presences.filter((p) => (p.review?.flags ?? []).includes('m55-gap')).map((p) => p.id).sort();
  assert.ok(gapListed.length > 0, `${DOC} §6.1 lists no period`);
  assert.deepEqual(flagged, gapListed.map((row) => row.id).sort(),
    `${DOC} §6.1 and the records flagged m55-gap are not the same set`);
  const wrong = [];
  for (const row of gapListed) {
    const p = byPresence.get(row.id);
    if (!p) { wrong.push(`${row.id}: no such presence`); continue; }
    if (earliest(p.when?.start) !== row.begins) wrong.push(`${row.id}: begins ${earliest(p.when?.start)}, not ${row.begins}`);
    const a = byId.get(p.actor);
    if (!a) { wrong.push(`${row.id}: ${p.actor} is not an actor`); continue; }
    if (earliest(a.when?.start) !== row.actorBegins) wrong.push(`${row.id}: ${a.id} begins ${earliest(a.when?.start)}, not ${row.actorBegins}`);
    if (earliest(p.when?.start) >= earliest(a.when?.start)) wrong.push(`${row.id}: does not begin before ${a.id} and has no business on this list`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// The brief's fourth test, with the exception the milestone is honest about:
// no presence of a record M55 touched sits outside its actor's interval
// unless §6.1 names it. Not a sweep of the corpus — 177 presences already sat
// outside their actor's interval before this run and the validator reports
// them as `presence-outside-actor-when`.
const TOUCHED = new Set(actors
  .filter((a) => (a.review?.flags ?? []).some((f) => f.startsWith('m55-')))
  .map((a) => a.id));

test('every presence of a record M55 wrote or re-dated is inside that actor\'s interval', () => {
  const allowed = new Set(gapListed.map((row) => row.id));
  const outside = [];
  for (const p of presences) {
    if (p.status !== 'active' || !TOUCHED.has(p.actor) || allowed.has(p.id)) continue;
    const a = byId.get(p.actor);
    const start = earliest(a.when?.start);
    const end = a.when?.end === null || a.when?.end === undefined ? Infinity : latest(a.when.end);
    const from = earliest(p.when?.start);
    const to = p.when?.end === null || p.when?.end === undefined ? Infinity : latest(p.when.end);
    if (from < start || to > end) outside.push(`${p.id} (${from}–${p.when?.end ?? 'open'}) is outside ${a.id} (${start}–${a.when?.end ?? 'open'})`);
  }
  assert.deepEqual(outside.sort(), [], outside.join('; '));
});

// --- §6.2: the pair no relation is written for ---------------------------

// The finding, asserted rather than promised: the Kingdom and the Empire are
// contemporaries on the dates this milestone cites, so nothing joins them.
test('no relation is written between the Kingdom of Prussia and the German Empire', () => {
  const pair = new Set(['prussia', 'germany-prussia']);
  const between = relations
    .filter((r) => r.status === 'active' && pair.has(r.from) && pair.has(r.to))
    .map((r) => r.id);
  assert.deepEqual(between, [], between.length
    ? `${between.join(', ')}: the two stand together for forty-seven years and end on the same day, which ${DOC} §6.2 is about`
    : undefined);
});

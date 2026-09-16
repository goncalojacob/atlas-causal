import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M52 splits `russia-soviet-union` into the polities it was carrying, and
// turns the owner's rule about successions — the dates have to meet — into
// rule 30. Every test here is a *correspondence* between `docs/m52-russia.md`
// and the records, written the way `tests/m51.test.mjs` was and for the same
// reason: the commit that teaches the tests goes with or before the commit
// that changes what they see (deviations 711 and 717), so nothing below pins
// a state that only one commit has.
//
// A run that retracts a succession and does not list it fails, and so does
// one that lists it and does not retract it.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m52-russia.md';
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
const byId = new Map(actors.map((a) => [a.id, a]));

// A bound is a year or { min, max }; the latest a record may have ended and
// the earliest it may have begun are what rule 30 compares, so an uncertain
// date is read by the side that favours the record.
const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);

// --- the rule (amendments A1 and A3) ------------------------------------

// Rule 30 as the corpus sees it, asserted here as well as in the validator
// because this is the statement the milestone exists to make. The validator
// reports it on the record; this says it about `data/` as a whole, so that a
// succession reinstated by hand cannot slip past by not being under
// validation at the time.
test('every active succession begins where the record before it ends', () => {
  const wrong = [];
  for (const r of relations) {
    if (r.type !== 'succeeded' || r.status !== 'active') continue;
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to) { wrong.push(`${r.id}: an end does not resolve to an actor`); continue; }
    const ends = from.when?.end;
    const starts = to.when?.start;
    if (ends === null || ends === undefined) { wrong.push(`${r.id}: "${from.id}" has not ended`); continue; }
    const gap = earliest(starts) - latest(ends);
    if (gap > 1) wrong.push(`${r.id}: "${from.id}" ends ${latest(ends)} and "${to.id}" begins ${earliest(starts)}, ${gap} years later`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.length
    ? `${wrong.length} active succession(s) are written across a gap, which amendment A1 forbids: ${wrong.join('; ')}`
    : undefined);
});

// The other direction, which rule 30 deliberately leaves alone because an
// overlap explains no ground away. It is still not something the corpus
// should acquire quietly, so it is asserted here over `data/` (the brief's
// test 2).
test('no active succession has its successor beginning before its predecessor ends', () => {
  const wrong = [];
  for (const r of relations) {
    if (r.type !== 'succeeded' || r.status !== 'active') continue;
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to || from.when?.end === null || from.when?.end === undefined) continue;
    if (earliest(to.when?.start) < latest(from.when.end)) {
      wrong.push(`${r.id}: "${to.id}" begins ${earliest(to.when?.start)} and "${from.id}" ends ${latest(from.when.end)}`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// A succession states a date, and a date in this atlas is somebody else's
// claim or a dataset's boundary — never a year that sounded right.
test('every active succession cites a source for the date it gives', () => {
  const bare = relations
    .filter((r) => r.type === 'succeeded' && r.status === 'active')
    .filter((r) => !Array.isArray(r.sources) || r.sources.length === 0)
    .map((r) => r.id);
  assert.deepEqual(bare.sort(), [], bare.join('; '));
});

// --- the four (amendment A2) --------------------------------------------

// The audit table of §1.2 against the records. Read out of the prose so the
// file cannot claim a retraction the data did not make, or stay silent about
// one it did.
const GAP_ROW = /^\| \+\d+ y \| `([a-z0-9-]+)` \| (\d{3,4}) \| `([a-z0-9-]+)` \| (\d{3,4}) \|/;
const listed = doc.split('\n').map((line) => GAP_ROW.exec(line)).filter(Boolean)
  .map(([, from, ends, to, starts]) => ({ id: `${from}--${to}--succeeded`, from, to, ends: Number(ends), starts: Number(starts) }));

test(`${DOC} lists a gap for every succession M52 retracted, and no other`, () => {
  assert.ok(listed.length > 0, `${DOC} carries no audit table`);
  const retracted = relations
    .filter((r) => r.type === 'succeeded' && r.status === 'retracted')
    .filter((r) => /M52/.test(r.retraction?.reason ?? ''))
    .map((r) => r.id).sort();
  assert.deepEqual(retracted, listed.map((row) => row.id).sort(),
    `${DOC}'s table and the relations M52 retracted are not the same set`);
});

test(`every gap ${DOC} lists is the gap those two records still show`, () => {
  const drifted = [];
  for (const row of listed) {
    const from = byId.get(row.from);
    const to = byId.get(row.to);
    if (!from || !to) { drifted.push(`${row.id}: a record is missing`); continue; }
    if (latest(from.when?.end) !== row.ends) drifted.push(`${row.from} ends ${latest(from.when?.end)}, not ${row.ends}`);
    if (earliest(to.when?.start) !== row.starts) drifted.push(`${row.to} begins ${earliest(to.when?.start)}, not ${row.starts}`);
    // Retracting the relation is the whole of what was done: both records
    // stand, and so does their territory.
    if (from.status !== 'active' || to.status !== 'active') drifted.push(`${row.id}: a record was not left standing`);
  }
  assert.deepEqual(drifted.sort(), [], drifted.join('; '));
});

// Rule 27 already requires a retracted record to carry a reason. This asks
// that the reason be the argument and not a label: both dates, and the rule
// they break.
test('every retraction M52 wrote says which two dates do not meet', () => {
  const thin = [];
  for (const r of relations) {
    const reason = r.retraction?.reason ?? '';
    if (!/M52/.test(reason)) continue;
    const row = listed.find((l) => l.id === r.id);
    if (!row) { thin.push(`${r.id}: retracted by M52 and not in ${DOC}`); continue; }
    if (!reason.includes(String(row.ends))) thin.push(`${r.id}: the reason does not say it ends ${row.ends}`);
    if (!reason.includes(String(row.starts))) thin.push(`${r.id}: the reason does not say it begins ${row.starts}`);
  }
  assert.deepEqual(thin.sort(), [], thin.join('; '));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRules } from '../src/validate/rules.js';

// M53 relaxes the contiguity rule the owner imposed on M52 and then withdrew,
// creates the polities the Brazilian and Russian chains need, and gives every
// chain event an actor that was alive when it happened.
//
// Written the way `tests/m51.test.mjs` and `tests/m52.test.mjs` were: every
// test is a *correspondence* between `docs/m53-polities.md` and the records,
// so the document cannot claim something the data did not do, or stay silent
// about something it did. Nothing here pins a count of actors.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m53-polities.md';
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

const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);

// --- §1: the rule relaxed, and the four restored ------------------------

const RESTORED_ROW = /^\| `([a-z0-9-]+--[a-z0-9-]+--succeeded)` \| (\d+) \| (\d{3,4}) \| (\d{3,4}) \|/;
const restored = doc.split('\n').map((line) => RESTORED_ROW.exec(line)).filter(Boolean)
  .map(([, id, gap, ends, starts]) => ({ id, gap: Number(gap), ends: Number(ends), starts: Number(starts) }));

test(`${DOC} §1.2 lists the successions M53 restored, and each one is active`, () => {
  assert.equal(restored.length, 4, `${DOC} §1.2 should carry one row per restored succession`);
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const wrong = [];
  for (const row of restored) {
    const r = byRelation.get(row.id);
    if (!r) { wrong.push(`${row.id}: no such relation`); continue; }
    if (r.status !== 'active') wrong.push(`${row.id}: ${r.status}, not active`);
    if (r.type !== 'succeeded') wrong.push(`${row.id}: type ${r.type}`);
    // Rule 27 permits a retraction block only on a retracted record, so a
    // restoration that forgot to drop it would be an error in the validator;
    // this says the same thing where the restoration is described.
    if (r.retraction !== undefined) wrong.push(`${row.id}: still carries a retraction block`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

test('no succession anywhere is still retracted for the reason M52 gave', () => {
  const stuck = relations
    .filter((r) => r.status === 'retracted' && /amendment A1|dates.*meet/i.test(r.retraction?.reason ?? ''))
    .map((r) => r.id);
  assert.deepEqual(stuck.sort(), [], `${stuck.join(', ')}: amendment A1 of M53 withdrew that reason`);
});

// The gap each row claims is the gap the two records still show, and the
// relation's own note carries it. A restored relation that says nothing about
// what stood between is the thing A1 asked for and did not get.
test('every restored succession carries its own gap in its own note', () => {
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const thin = [];
  for (const row of restored) {
    const r = byRelation.get(row.id);
    if (!r) continue;
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to) { thin.push(`${row.id}: an end does not resolve to an actor`); continue; }
    if (latest(from.when?.end) !== row.ends) thin.push(`${r.from} ends ${latest(from.when?.end)}, not ${row.ends}`);
    if (earliest(to.when?.start) !== row.starts) thin.push(`${r.to} begins ${earliest(to.when?.start)}, not ${row.starts}`);
    if (earliest(to.when?.start) - latest(from.when?.end) !== row.gap) thin.push(`${row.id}: the gap is not ${row.gap} years`);
    const note = r.note ?? '';
    if (!/M53/.test(note)) thin.push(`${row.id}: the note does not say it was restored`);
    if (!note.includes(String(row.starts))) thin.push(`${row.id}: the note does not say the successor begins ${row.starts}`);
  }
  assert.deepEqual(thin.sort(), [], thin.join('; '));
});

// The point of A1, stated over `data/` rather than over a fixture: a gap is
// reported and not refused. The validator is run for real here, because the
// claim is about what the validator does and not about what the records hold.
test('a succession written across a gap is a warning and not an error', async () => {
  assert.ok(restored.length > 0, `${DOC} lists no restored succession to check`);
  // The four relations and the six actors they name are all `succession-gap`
  // reads, so the check runs over those and not over the whole corpus.
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const records = [];
  for (const row of restored) {
    const r = byRelation.get(row.id);
    if (!r) continue;
    records.push(r, byId.get(r.from), byId.get(r.to));
  }
  const result = checkRules(records.filter(Boolean), {});
  const named = result.warnings.filter((w) => w.rule === 'succession-gap').map((w) => w.id).sort();
  assert.deepEqual(named, restored.map((row) => row.id).sort(),
    'the four restored successions are exactly the ones `succession-gap` names');
  assert.deepEqual(result.errors.filter((e) => e.rule === 30), [],
    'rule 30 is gone and nothing reports under its number');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTable, categoryFor } from '../tools/migrate/categories.mjs';
import { BACKFILL_FLAG, importFlag } from '../tools/migrate/backfill-standing.mjs';

// M69 is four things the backlog had carried for weeks, and two of them wrote
// records. This file judges those two.
//
// It is written with the records it judges (deviations 711 and 717), and in
// the idiom `tests/m67.test.mjs` settled on: **nothing here pins a count and
// almost nothing names a record.** What this run wrote is found by the flags
// it wrote — `standing-backfilled` for a record given the standing that was
// true of it, `m69-categorised` for one of the sixteen hand-written titles the
// category pass declined and this run put to the table — and everything else
// is asserted of whatever carries them. A suite that listed the ids would go
// on passing the day a fourteenth record is categorised badly.
//
// The one record named below is named because the owner named it: the brief
// gives `constitutional-revision-1959` as the shape of mistake to refuse, so
// that refusal is the one thing here that a later pass cannot quietly undo.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readDir = async (kind) => {
  const dir = path.join(ROOT, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
};

const events = await readDir('events');
const categories = JSON.parse(await readFile(path.join(ROOT, 'data', 'categories.json'), 'utf8'));
const seeds = JSON.parse(await readFile(path.join(ROOT, 'data', 'imports', 'wikidata-seeds.json'), 'utf8'));
const { rows } = buildTable(seeds.classes);

const CATEGORISED_FLAG = 'm69-categorised';
const flagged = (record, flag) => (record.review?.flags ?? []).includes(flag);
const categorised = events.filter((e) => flagged(e, CATEGORISED_FLAG));

// ---- item 3: the sixteen the category pass declined -------------------------

test('this run categorised something, and every one of them is an active event', () => {
  assert.ok(categorised.length > 0, 'the flag is how the rest of this file finds them');
  for (const e of categorised) {
    assert.equal(e.kind, 'event', e.id);
    assert.equal(e.status, 'active', e.id);
  }
});

test('every category it wrote is one of the owner\'s twelve, and never `other`', () => {
  const allowed = new Set(categories.map((c) => c.id));
  for (const e of categorised) {
    assert.ok(allowed.has(e.category), `${e.id}: ${e.category}`);
    // `other` is a person's judgement that nothing in the list fits, not a
    // fallback for a pass that could not decide (M32b-2).
    assert.notEqual(e.category, 'other', e.id);
  }
});

test('the category it wrote is the table\'s answer and not a new one', () => {
  // The whole of item 3 is "apply the table's answer where the record's own
  // body confirms it". Where a record's body called for something the table
  // does not say, the answer was to refuse and list it — never to write a
  // different category, which would be this run deciding what an event was.
  for (const e of categorised) {
    const row = categoryFor(e.title, rows);
    assert.ok(row, `${e.id}: the table must reach "${e.title}"`);
    assert.equal(e.category, row.category, `${e.id}: the table says ${row.category}`);
  }
});

test('it took only titles the category pass had left, never one an import copied', () => {
  // M32b-2 read a title an import copied and refused a composed one (amendment
  // A5). The sixteen it declined are hand-written, and those are the only ones
  // this run had any business reading.
  for (const e of categorised) {
    assert.notEqual(e.origin?.tool, 'wikidata', `${e.id} was the category pass's own`);
  }
});

test('nothing it categorised had been signed, or already carried a category', () => {
  for (const e of categorised) {
    assert.notEqual(e.review?.status, 'reviewed', `${e.id}: a signature was given against what it says`);
    assert.equal(e.review?.status, 'draft', `${e.id} is in the queue and stays there`);
  }
});

test('the revision of 1959 is not an election, and carries no category at all', () => {
  // The one named record. Its own summary says the constitution was revised so
  // that the president would be chosen by an electoral college — the state
  // changing what the rules are, which is `law` — and the class table would
  // file it as an `election` on the word in its title. Deciding it is `law` is
  // a person's to do; refusing the table's answer is this run's.
  const record = events.find((e) => e.id === 'constitutional-revision-1959');
  assert.ok(record, 'the record is still here');
  assert.equal(record.category, undefined);
  assert.equal(flagged(record, CATEGORISED_FLAG), false);
  assert.equal(categoryFor(record.title, rows)?.category, 'election', 'the table still says the wrong thing');
});

// ---- item 1: the import records with no standing ----------------------------

test('every record given standing says draft, and says which import wrote it', async () => {
  const kinds = ['actors', 'presences', 'sources', 'events', 'edges', 'places', 'relations'];
  let seen = 0;
  for (const kind of kinds) {
    for (const record of await readDir(kind)) {
      if (!flagged(record, BACKFILL_FLAG)) continue;
      seen += 1;
      // Standing, and the true one: nobody has read any of these.
      assert.equal(record.review.status, 'draft', record.id);
      assert.equal(record.review.signedBy, undefined, `${record.id} was never signed by this run`);
      assert.equal(record.status, 'active', `${record.id}: a tombstone is out of the corpus`);
      // And which import wrote it, from the record's own `origin`.
      const tool = record.origin?.tool;
      assert.ok(tool, `${record.id} must say who created it`);
      assert.ok(record.review.flags.includes(importFlag(tool)), `${record.id}: ${importFlag(tool)}`);
    }
  }
  assert.ok(seen > 0, 'the backfill left its mark on the records it touched');
});

test('no record is left without standing: the unread warning has nothing to say', async () => {
  // The count `node tools/validate.mjs` prints on its last line but one, asked
  // of the tree directly. A record with neither a status nor a signature is in
  // no queue and on no dashboard (health review of 6 September, R10).
  const kinds = ['events', 'edges', 'sources', 'actors', 'places', 'relations', 'offices', 'tenures', 'presences', 'narratives'];
  const without = [];
  for (const kind of kinds) {
    for (const record of await readDir(kind)) {
      if (record.status !== 'active') continue;
      if (record.review?.status !== undefined || record.review?.signedBy?.length > 0) continue;
      without.push(record.id);
    }
  }
  assert.deepEqual(without, []);
});

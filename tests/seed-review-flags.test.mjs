// The seeding of review flags: the table is only useful if every id in it is
// a record that exists, and only safe if running it again cannot overwrite a
// block somebody has since edited.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SEED, RELATION_NOTE, plan, withReview, seed } from '../tools/seed-review-flags.mjs';
import { readRecords, KIND_DIRS } from '../tools/lib/read.mjs';
import { isDraft } from '../src/review/queue.js';
import { handWritten } from '../src/origin.js';
import { ROOT } from './helpers.mjs';

const FLAG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

test('every record the table names exists, is a draft, and carries the block', async () => {
  const { entries, problems } = await readRecords(path.join(ROOT, 'data'));
  assert.deepEqual(problems, []);
  const byId = new Map(entries.map((e) => [e.record.id, e.record]));
  // Relations and tenures, and only the ones still standing: M30a-2 re-filed
  // the twelve `led` records and their flags went to the tenures with them.
  // And only the ones a person wrote: the 77 successions the CShapes import
  // derived in I8 have their interval from the source they cite, so the
  // seeding's sentence about memory is not true of them and they are not in
  // the table (they carry `imported-facts` instead).
  const dated = entries
    .filter((e) => (e.kind === 'relation' || e.kind === 'tenure') && e.record.status === 'active')
    .filter((e) => handWritten(e.record))
    .map((e) => e.record.id);
  const entriesPlanned = plan(dated);
  assert.ok(entriesPlanned.length > 50, 'STATUS.md names more than fifty records');

  for (const item of entriesPlanned) {
    const record = byId.get(item.id);
    assert.ok(record, `${item.id} is in the table and not in data/`);
    // Flagging a record a person has already signed would be telling them to
    // look again at what they have read.
    assert.ok(isDraft(record), `${item.id} is not a draft`);
    // What the table put there has to still be there — but it need not be all
    // that is there. M20 added `wikidata-assigned-by-assistant` to the records
    // it matched by judgment, and some of those already carried a seeded flag.
    for (const flag of item.flags) {
      assert.ok(record.review?.flags?.includes(flag), `${item.id}: lost the flag ${flag}`);
    }
    assert.equal(typeof record.review?.note, 'string');
    assert.ok(record.review.note.length <= 500, `${item.id}: the note is over the schema's cap`);
    for (const flag of item.flags) assert.match(flag, FLAG, item.id);
  }

  // Every one of them is flagged and says in a note what a reviewer has to
  // check. The seeding's own sentence is on every active relation — the ten
  // M31-1 re-typed carried their review block across unchanged — and on the
  // twelve tenures M30a-2 re-filed. A tenure written after the seeding says
  // the same thing in its own words instead (M31-1 wrote twenty-four), so
  // what is asked of a tenure here is the flag and a note of its own.
  for (const id of dated) {
    const record = byId.get(id);
    assert.ok(record.review?.flags?.includes('date'), `${id}: not flagged`);
    assert.equal(typeof record.review?.note, 'string');
    assert.ok(record.review.note.length > 0, `${id}: an empty note`);
    if (record.kind === 'relation') assert.ok(record.review.note.includes(RELATION_NOTE), id);
  }
});

test('a record in two groups keeps both flags and both notes', () => {
  const both = plan().find((e) => e.id === 'frelimo');
  assert.deepEqual(both.flags, ['date', 'place']);
  const notes = SEED.filter((g) => g.ids.includes('frelimo')).map((g) => g.note);
  assert.equal(notes.length, 2);
  for (const note of notes) assert.ok(both.note.includes(note));
});

test('review goes where the schema puts it, after revised', () => {
  const record = { schema: 1, id: 'x', kind: 'event', revised: null, sources: [], title: 'x' };
  assert.deepEqual(Object.keys(withReview(record, { flags: ['date'] })),
    ['schema', 'id', 'kind', 'revised', 'review', 'sources', 'title']);
  // A record with no `revised` still gets one, at the end rather than nowhere.
  assert.deepEqual(Object.keys(withReview({ id: 'x' }, { flags: [] })), ['id', 'review']);
});

test('running it again changes nothing', async () => {
  const outcome = await seed(path.join(ROOT, 'data'), { dryRun: true });
  assert.deepEqual(outcome.written, [], 'every record in the table already carries a block');
  assert.deepEqual(outcome.missing, []);
  assert.ok(outcome.kept.length > 50);
  assert.ok(Object.hasOwn(KIND_DIRS, 'relation'));
});

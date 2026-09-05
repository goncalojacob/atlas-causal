// The per-citation verification flags: what they are on a record, what the
// queue counts, and what the validator prints. Everything synthetic.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  citationsOf, citationRows, unverified, countCitations, setVerified, clearVerified,
} from '../src/review/citations.js';
import { buildQueue, digestOf, DIGEST_KEYS } from '../src/review/queue.js';
import { signRecord, retractRecord } from '../src/review/sign.js';
import { runValidation } from '../tools/validate.mjs';
import { fixtures, clone, FIXTURE_DATA } from './helpers.mjs';

const WHO = { name: 'A Reviewer', github: 'a-reviewer' };
const TODAY = '2026-09-04';

test('a record with no flags has every citation unchecked', async () => {
  const { byId } = await fixtures();
  const event = byId['fixture-event-a'];
  assert.deepEqual(citationsOf(event), ['fixture-source-1']);
  assert.deepEqual(citationRows(event), [{ source: 'fixture-source-1', verified: null }]);
  assert.deepEqual(unverified(event), ['fixture-source-1']);
});

test('a disputed edge is checked source by source, dissent included and each once', async () => {
  const { byId } = await fixtures();
  const edge = Object.values(byId).find((r) => r.kind === 'edge' && r.confidence === 'disputed');
  const cited = citationsOf(edge);
  assert.ok(cited.length >= 2, 'a disputed edge cites and dissents');
  assert.deepEqual([...new Set(cited)], cited);
});

test('ticking and unticking leave the record exactly as they found it', async () => {
  const { byId } = await fixtures();
  const event = clone(byId['fixture-event-a']);
  const before = JSON.stringify(event);

  const ticked = setVerified(event, 'fixture-source-1', WHO, { today: TODAY });
  assert.deepEqual(ticked.review.citations, { 'fixture-source-1': { verified: { by: 'A Reviewer', on: TODAY } } });
  assert.deepEqual(unverified(ticked), []);
  // Never mutates: the editor holds what it opened and the save is what comes
  // back.
  assert.equal(JSON.stringify(event), before);

  const back = clearVerified(ticked, 'fixture-source-1');
  assert.equal(Object.hasOwn(back, 'review'), false, 'an empty review block goes with the last tick');
  assert.equal(JSON.stringify(back), before);
});

test('a tick keeps the flags and the note a draft already carries', async () => {
  const { byId } = await fixtures();
  const event = { ...clone(byId['fixture-event-a']), review: { flags: ['date'], note: 'the day is a guess' } };
  const ticked = setVerified(event, 'fixture-source-1', WHO, { today: TODAY });
  assert.deepEqual(ticked.review.flags, ['date']);
  assert.equal(ticked.review.note, 'the day is a guess');
  const back = clearVerified(ticked, 'fixture-source-1');
  assert.deepEqual(back.review, { flags: ['date'], note: 'the day is a guess' });
});

test('a tick needs a name and a source the record actually cites', async () => {
  const { byId } = await fixtures();
  const event = clone(byId['fixture-event-a']);
  assert.equal(setVerified(event, 'fixture-source-4', WHO, { today: TODAY }), event);
  assert.equal(setVerified(event, 'fixture-source-1', { name: '  ' }, { today: TODAY }), event);
  assert.equal(clearVerified(event, 'fixture-source-1'), event);
});

test('the queue says how many citations a record still has unchecked', async () => {
  const { records, byId } = await fixtures();
  const event = clone(byId['fixture-event-a']);
  event.review = { status: 'draft' };
  let [item] = buildQueue([event]);
  assert.equal(item.citations, 1);
  assert.equal(item.unverified, 1);
  [item] = buildQueue([setVerified(event, 'fixture-source-1', WHO, { today: TODAY })]);
  assert.equal(item.unverified, 0);

  // The queue in the browser is built from digests, not from records, so the
  // count has to survive digestOf.
  const digest = digestOf(event);
  for (const key of Object.keys(digest)) assert.ok(DIGEST_KEYS.includes(key), key);
  assert.deepEqual(digest.cites, ['fixture-source-1']);
  assert.equal(buildQueue([digest])[0].unverified, 1);
  assert.equal(JSON.stringify(digest).includes(event.summary), false, 'a digest carries no prose');
  // A source cites nothing, so it has nothing to check and no key for it.
  assert.equal(Object.hasOwn(digestOf(byId['fixture-source-1']), 'cites'), false);
  assert.ok(records.length > 0);
});

test('countCitations sums the whole dataset and leaves tombstones out', async () => {
  const { records, byId } = await fixtures();
  const before = countCitations(records);
  assert.ok(before.citations > 0);
  assert.equal(before.unverified, before.citations, 'nothing is checked yet');

  const ticked = records.map((r) => (r.id === 'fixture-event-a' ? setVerified(clone(r), 'fixture-source-1', WHO, { today: TODAY }) : r));
  assert.equal(countCitations(ticked).unverified, before.unverified - 1);

  const tombstone = Object.values(byId).find((r) => r.status !== 'active' && citationsOf(r).length > 0);
  if (tombstone) {
    assert.equal(countCitations([tombstone]).citations, 0, 'a tombstone is not read again');
  }
});

test('the validator counts the unchecked citations of the fixture dataset', async () => {
  const { counts } = await runValidation(FIXTURE_DATA);
  const { records } = await fixtures();
  assert.deepEqual(
    { citations: counts.citations, unverified: counts.unverified },
    countCitations(records),
  );
  assert.ok(counts.citations > 0);
  assert.ok(path.isAbsolute(FIXTURE_DATA));
});

// Health review A, finding 7. The dashboard's own flow is tick, then Sign,
// and Sign deleted `review` whole — so the ticks a reviewer had just made
// went with the flags, the validator's headline count could never fall
// through the dashboard, and a signed record had no record of what had been
// checked against the source. `flags` and `note` are the reviewer's to clear;
// `citations` is their audit trail and survives both acts.
test('signing and retracting keep the citation checks and clear the rest', async () => {
  const { byId } = await fixtures();
  const base = clone(byId['fixture-event-a']);
  base.review = { status: 'draft', flags: ['date'], note: 'check the month' };
  const ticked = setVerified(base, 'fixture-source-1', WHO, { today: TODAY });
  assert.equal(unverified(ticked).length, 0);

  const signed = signRecord(ticked, WHO, { today: TODAY });
  assert.deepEqual(signed.review.citations, ticked.review.citations, 'the ticks survive the signature');
  assert.equal(signed.review.status, 'reviewed');
  assert.equal(Object.hasOwn(signed.review, 'flags'), false);
  assert.equal(Object.hasOwn(signed.review, 'note'), false);
  assert.equal(unverified(signed).length, 0, 'and the count the validator prints has fallen');

  const retracted = retractRecord(ticked, { today: TODAY, reason: 'A synthetic withdrawal, written in a test.' });
  assert.deepEqual(retracted.review.citations, ticked.review.citations);
  assert.equal(Object.hasOwn(retracted.review, 'flags'), false);

  // A record nobody ticked anything on ends with no block at all rather than
  // an empty one: an absent `review` says what an empty one would.
  const plain = clone(byId['fixture-event-b']);
  plain.review = { status: 'draft', flags: ['date'] };
  assert.equal(Object.hasOwn(retractRecord(plain, { today: TODAY, reason: 'A synthetic withdrawal.' }), 'review'), false);
});

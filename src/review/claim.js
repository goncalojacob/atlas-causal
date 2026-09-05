// Who is reading a record right now. `review.claimedBy` and the week it
// stands for.
//
// The dashboard is one person's tool today and will not stay one: the
// contribution pipeline already lands strangers' records in this queue, and
// two maintainers working through it at once would each spend an evening on
// the same forty records without ever finding out (health review B, finding
// 7). A claim is the cheapest thing that fixes that — a name and a date on
// the record, written like any other field, visible in the list.
//
// It is not a lock. Nothing refuses a save because somebody else holds the
// claim, and nothing ever could: the record files are a git repository that
// two people can edit on two machines with no server between them, and a
// lock that the only honest storage cannot enforce is a lie told to whoever
// trusts it. What this buys is that the second reviewer sees the first one's
// name before starting rather than after.
//
// And it expires. A claim nobody released is the normal end of an evening,
// not a promise; after a week the record is free again and the list says so
// rather than showing a name from March for ever.

import { inEnvelopeOrder } from '../validate/migrate.js';

export const CLAIM_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Whole days between two `YYYY-MM-DD` days, or null if either is not one.
// UTC on both sides: these are days and not instants, and the difference
// between two days must not depend on which side of a summer the reader is on.
export function daysBetween(from, to) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / DAY);
}

// The claim written on a record, or null. Shape is the reviewer's, like a
// signature: a name, a GitHub login or null, and the day it was taken.
export function claimOf(record) {
  const claim = record?.review?.claimedBy;
  if (!isObject(claim) || typeof claim.name !== 'string' || !claim.name) return null;
  return { name: claim.name, github: claim.github ?? null, on: claim.on ?? null };
}

// The three below take the claim itself and not the record it came off,
// because a queue row carries the claim and not the record: the digest holds
// what the list draws, and going back to the file for a name would be a fetch
// per row.
//
// 'held', 'expired', or null where there is no claim. A claim with no date is
// expired: the date is what makes it temporary, and one without it would
// stand for ever, which is the thing this is for.
export function claimState(claim, today) {
  if (!claim?.name) return null;
  const age = claim.on && today ? daysBetween(claim.on, today) : null;
  if (age === null) return 'expired';
  return age >= 0 && age < CLAIM_DAYS ? 'held' : 'expired';
}

// The claim if it still stands, else null: what the list shows beside a row
// and what a second reviewer is warned about.
export function heldBy(claim, today) {
  return claimState(claim, today) === 'held' ? claim : null;
}

// How many days a standing claim has left, for the sentence the dashboard
// puts under it. Null when there is no standing claim.
export function claimDaysLeft(claim, today) {
  if (!heldBy(claim, today)) return null;
  return CLAIM_DAYS - daysBetween(claim.on, today);
}

// Take the record, or hand it back. Both are ordinary edits to the record:
// they go through the same save as everything else, and the claim lands where
// the schemas declare it.
export function claimRecord(record, reviewer, { today } = {}) {
  const name = String(reviewer?.name ?? '').trim();
  if (!name) throw new Error('a claim says who is reading it: nothing was written');
  const claimedBy = { name, github: reviewer?.github ?? null, on: today ?? record?.revised ?? null };
  return inEnvelopeOrder({ ...record, review: { ...(record?.review ?? {}), claimedBy } });
}

export function releaseClaim(record) {
  if (!isObject(record?.review)) return record;
  const { claimedBy, ...rest } = record.review;
  if (claimedBy === undefined) return record;
  return inEnvelopeOrder({
    ...record,
    review: Object.keys(rest).length ? rest : undefined,
  });
}

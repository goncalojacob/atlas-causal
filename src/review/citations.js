// The per-citation verification flags. Pure: the dashboard draws what is here
// and main.js decides when, exactly as sign.js and queue.js are split.
//
// The owner's question is not only whether a record's text is right but
// whether each source it names says what the record says it says. That is a
// different act from signing — one book at a time, often on a different day —
// so it is recorded per citation rather than folded into the signature. It is
// a **flag and not a gate**: an unchecked citation is counted, shown and
// warned about, and it never stops a record being saved or signed. A reviewer
// who has read the record and not yet got hold of the book is still further
// along than nobody having read it at all.
//
// Like everything under `review`, this says how far the record has been read
// and never anything about the world. Signing clears it, because a signed
// record is one a person stands behind.

import { citedSources } from '../validate/rules.js';

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// The sources a record rests on, in the order they are keyed. A digest out of
// the review index carries the list ready-made in `cites`: the digest holds no
// prose, so it has no dispute block for citedSources to read.
export function citationsOf(record) {
  return Array.isArray(record?.cites) ? [...record.cites] : citedSources(record);
}

function flagsOn(record) {
  return isObject(record?.review?.citations) ? record.review.citations : {};
}

// One row per source the record cites: what the dashboard lists beside the
// source's own link, and what the toggle acts on.
export function citationRows(record) {
  const flags = flagsOn(record);
  return citationsOf(record).map((source) => ({
    source,
    verified: isObject(flags[source]?.verified) ? flags[source].verified : null,
  }));
}

export function unverified(record) {
  return citationRows(record).filter((row) => row.verified === null).map((row) => row.source);
}

// Records in, two numbers out: how many citations there are and how many
// nobody has opened. Tombstones are left out for the same reason they cite
// nothing in the sources index — they are not part of the atlas any more, and
// counting them would make the number the dashboard works down never reach
// zero.
export function countCitations(records) {
  let citations = 0;
  let unchecked = 0;
  for (const record of records ?? []) {
    if (record?.status !== 'active') continue;
    citations += citationsOf(record).length;
    unchecked += unverified(record).length;
  }
  return { citations, unverified: unchecked };
}

// A new record with one citation marked as checked. Never mutates: the editor
// holds the record it opened and the save is what this returns.
export function setVerified(record, source, reviewer, { today } = {}) {
  const name = String(reviewer?.name ?? '').trim();
  if (!citationsOf(record).includes(source) || name === '') return record;
  const review = isObject(record.review) ? { ...record.review } : { flags: [] };
  review.citations = { ...flagsOn(record), [source]: { verified: { by: name, on: today } } };
  return { ...record, review };
}

// The other way: a tick taken back leaves no trace, and a review block that
// held nothing else goes with it, so a record returns to exactly the shape it
// had before anybody ticked anything.
export function clearVerified(record, source) {
  const flags = flagsOn(record);
  if (!Object.hasOwn(flags, source)) return record;
  const citations = { ...flags };
  delete citations[source];
  const review = { ...record.review };
  if (Object.keys(citations).length === 0) delete review.citations;
  else review.citations = citations;
  const out = { ...record, review };
  // What "no trace" means: nothing left but an empty `flags`. A `status` is
  // not a trace of a tick — a draft whose last tick was taken back is still a
  // draft, and dropping the block would take the record off the queue that
  // sent the reviewer to it (health review of 6 September, R10).
  const left = Object.keys(review).filter((key) => key !== 'flags' || (review.flags ?? []).length > 0);
  if (left.length === 0) delete out.review;
  return out;
}

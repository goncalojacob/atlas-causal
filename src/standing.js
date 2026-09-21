// How far a record has been read, said in one line and in one place.
//
// 10,311 of the atlas's 10,638 records are `draft` and 11,061 of 11,061
// citations have never been opened against the source. The owner's decision of
// 2 September is that the atlas draws all of it anyway — a draft is a record
// nobody has read, not a record that is wrong — and the validator has counted
// it down from the command line ever since. What was missing is that a
// **reader** could not see it: a card said what the record claims and nothing
// about who, if anyone, had checked the claim.
//
// So this is honesty on the surface and it is **not a filter**. Nothing here
// decides what is drawn, and nothing here may ever be asked to: a marker that
// started hiding drafts would take 97 % of the corpus off the map and call it
// an improvement. `emphasis.js` decides what a view draws and does not import
// this file.
//
// **One predicate, two shapes.** A card holds the record's own file, with its
// `review` block; the masthead holds core rows from `data/index/`, which carry
// the same answer precomputed in a `reviewed` column (spine.js). `hasBeenRead`
// reads either, and the index column is written by calling it — so the count
// in the masthead and the line on the card are the same function twice and
// cannot come to disagree. That is what `tests/m70.test.mjs` asserts, record by
// record, rather than trusting the two to agree by inspection.
//
// Pure: records in, an answer out. Nothing here knows the DOM, and the one
// function that returns markup escapes everything that came out of `data/`.

import { isReviewed } from './origin.js';
import { esc } from './util/esc.js';

// Somebody has read this record and signed it. Everything else — `draft`, and
// the 285 records that claim no standing at all — is unread, and says so in
// the same words: a record nobody has signed is a record nobody has read,
// whatever the file does or does not say about it.
//
// `record.reviewed` is the index's own copy of this answer, written by this
// same function at build time (validate/core.js, `slotReader`). It is read
// first because a core row has no `review` block to read instead.
export function hasBeenRead(record) {
  if (record?.reviewed === true) return true;
  return isReviewed(record);
}

// Who signed it and when, in the order the record names them. Defensive about
// the shape because `data/` is untrusted input: a malformed signature is
// dropped rather than printed as `undefined`.
export function readersOf(record) {
  const signed = record?.review?.signedBy;
  if (!Array.isArray(signed)) return [];
  return signed
    .filter((s) => s !== null && typeof s === 'object' && typeof s.name === 'string' && s.name !== '')
    .map((s) => ({ name: s.name, on: typeof s.on === 'string' ? s.on : null }));
}

// The sentence, as text. The card escapes it; `review.html` and anything else
// that wants the same fact in different markup can have the same words.
//
// A reviewed record whose signatures did not survive the check above still
// says it has been read: rule 28 refuses `reviewed` without a `signedBy`, so
// that is a record the validator is already complaining about, and the honest
// answer to "has a person read this" is still yes.
export function standingText(record) {
  if (!hasBeenRead(record)) {
    return 'Unread: no person has checked this record.';
  }
  const readers = readersOf(record);
  if (readers.length === 0) return 'Read and signed.';
  const names = readers.map((r) => (r.on ? `${r.name} (${r.on})` : r.name));
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Read by ${list}.`;
}

// The line a card carries. `data-slot` because a card is built before its
// record text arrives and the line is written into the slot when it does
// (panel/event.js, the same discipline the summary follows).
//
// `unread` is a class and not a colour: the stylesheet gives the line the ink
// and the face a citation's own `unchecked` mark uses, and standing is not
// emphasis — a draft is drawn exactly as a signed record is.
export function standingHtml(record) {
  const read = hasBeenRead(record);
  return `<p class="standing ${read ? 'read' : 'unread'}" data-slot="standing">${esc(standingText(record))}</p>`;
}

// The empty slot, for a card built before the record's own file has landed.
// Nothing at all until the answer is known: a card that said "unread" while it
// was still loading would be making a claim it had not checked, which is the
// one thing this marker exists not to do.
export function standingSlot() {
  return '<p class="standing" data-slot="standing"></p>';
}

// The line written into a card's slot when the record's own file lands. It is
// here and not in `panel.js`'s `ctx` on purpose: the slot needs nothing a card
// is given, so a card reaches for one module rather than for a member of an
// object every card's tests would then have to know about.
export function fillStanding(container, record) {
  const slot = container?.querySelector?.('[data-slot="standing"]');
  if (slot) slot.outerHTML = standingHtml(record);
}

// How many of these have been read. The masthead's half, and the only counting
// in the file: `of` is however many were handed in, because what "in view"
// means is the caller's question and not this file's.
export function readCount(records) {
  let read = 0;
  let of = 0;
  for (const record of records ?? []) {
    of += 1;
    if (hasBeenRead(record)) read += 1;
  }
  return { read, of };
}

// And the words the masthead says it in. Short, because it stands in a bar
// that already carries the search, three view buttons, two year fields, a
// density hint and two groups of switches.
export function readCountText({ read, of }) {
  if (of === 0) return '';
  return `${read} of ${of} read`;
}

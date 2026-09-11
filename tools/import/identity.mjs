// The additive rule, in one place because two imports obey it.
//
// An import may fill in an identity field that is not there. It may not
// change one that is, may not remove one, may not touch any other field, and
// may not add itself to `authors` for having done it. That is the whole of
// what an automated writer is allowed to do to a record somebody else wrote,
// and it is stated once here rather than implemented twice — tools/import/
// wikidata.mjs uses it to write what an item says, and cshapes.mjs uses it to
// carry forward what is already on disk when it rewrites a record it owns
// (docs/review-2026-09-04-plan.md, findings 10 and 11).
//
// Pure: no fs, no network.

export const ENRICHABLE = Object.freeze(['wikidata', 'wikipedia', 'sitelinks']);

// What an enrichment pass may never write, whatever it is asked for. `origin`
// heads the list and is the reason it exists: it answers "who wrote this
// record", not "who has touched it" (rule 29), so an import that fills in an
// identifier on somebody else's record must not come away owning it — which
// is what it would mean once the licence hole, the review queue and the
// import's own idea of what it may rewrite all read that field. `review` and
// `retraction` are the reviewer's and the record's history; `authors` was
// already forbidden in prose and is written down here instead.
//
// ENRICHABLE and this list may not intersect, which is a test rather than a
// check at run time: the mistake this guards against is a field added to
// ENRICHABLE by somebody who did not read this comment, and that is caught
// once, when the tests run, and not on every record.
export const CREATOR_ONLY = Object.freeze([
  'schema', 'id', 'kind', 'status', 'origin', 'authors', 'license', 'created', 'review', 'retraction',
]);

// A gap, as opposed to a value. `sitelinks: 0` is a value — an item nobody
// has written an article about — and is never overwritten.
export function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// → { record, added, kept }. `record` is the same object back when nothing
// was added, so a caller can write only what changed.
export function mergeIdentity(record, identity) {
  const added = [];
  const kept = [];
  const out = { ...record };
  for (const field of ENRICHABLE) {
    if (!Object.hasOwn(identity ?? {}, field) || identity[field] === undefined) continue;
    if (!isEmpty(record?.[field])) {
      kept.push(field);
      continue;
    }
    out[field] = identity[field];
    added.push(field);
  }
  if (!added.length) return { record, added, kept };
  // Written where the schemas list them — after the envelope, before
  // `sources` — so a record an import touches reads like one the form wrote
  // and the diff is the fields and not a reshuffle.
  const result = {};
  for (const key of Object.keys(record)) {
    if (ENRICHABLE.includes(key)) continue;
    if (key === 'sources') for (const field of ENRICHABLE) if (Object.hasOwn(out, field)) result[field] = out[field];
    result[key] = out[key];
  }
  for (const field of ENRICHABLE) if (Object.hasOwn(out, field) && !Object.hasOwn(result, field)) result[field] = out[field];
  return { record: result, added, kept };
}

// --- the other names, one clause narrower ---------------------------------
//
// `names` is not an identity field: it is a claim about what a thing is
// called, which is why it is not in ENRICHABLE and has a rule of its own
// (I8, owner question 3; docs/index2-plan.md, D12). The owner allowed the
// import to write it onto a record it did not create, on three conditions,
// and this is all three:
//
//   1. only where the field is **absent** — never adding to a list, never
//      reordering one, never replacing a name somebody chose;
//   2. only on a record whose `review.status` is `draft` — never on one a
//      person has signed, and never on one with no standing at all, because
//      a record nobody has claimed either way is not in the queue where this
//      would be seen and cleared;
//   3. with `imported-names` added to `review.flags`, so the reviewer is
//      told where the names came from and can take them off.
//
// Everything else the additive rule says still holds: no other field is
// touched, and nothing is added to `authors` for having done it.
//
// Condition 3 is the one place an import writes into `review`, which
// CREATOR_ONLY otherwise forbids, and it is narrow on purpose: a flag added,
// never a flag removed, never `status`, never `signedBy`, never `note`. The
// forbidding is what keeps `names` out of ENRICHABLE — it is not an
// identifier and it is not written by the generic pass — and this function is
// the whole of the exception the owner allowed.
export const NAMES_FLAG = 'imported-names';

// → { record, added }. `record` is the same object back when nothing was
// written, so a caller can write only what changed. `names` is expected
// already deduplicated and non-empty — an empty list is refused by rule 18,
// so the caller writes no key rather than an empty one.
export function mergeNames(record, names) {
  const wanted = (names ?? []).filter((n) => typeof n === 'string' && n.trim() !== '');
  if (!wanted.length) return { record, added: false };
  if (!isEmpty(record?.names)) return { record, added: false };
  if (record?.review?.status !== 'draft') return { record, added: false };

  const flags = record.review.flags ?? [];
  const review = { ...record.review, flags: flags.includes(NAMES_FLAG) ? [...flags] : [...flags, NAMES_FLAG] };
  // Written where the schemas list it — after `title`, before `summary` —
  // for the reason mergeIdentity writes its fields where it does: a record an
  // import touches should read like one the form wrote, and the diff should
  // be the field and not a reshuffle. A record with no `title` (an actor, a
  // place) keeps its own order and takes the key at the end, which cannot
  // happen in practice because both kinds require `names` already.
  const out = {};
  for (const key of Object.keys(record)) {
    if (key === 'names') continue;
    out[key] = key === 'review' ? review : record[key];
    if (key === 'title') out.names = wanted;
  }
  if (!Object.hasOwn(out, 'names')) out.names = wanted;
  return { record: out, added: true };
}

// The identity fields a record already on disk carries, for an import that is
// about to rewrite it. A re-run of an import must not wipe an identifier
// somebody or another import added between runs, and `created` is not the
// only thing that has to survive being regenerated.
export function identityOnDisk(record) {
  const identity = {};
  for (const field of ENRICHABLE) if (!isEmpty(record?.[field])) identity[field] = record[field];
  return identity;
}

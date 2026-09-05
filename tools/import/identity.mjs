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

// The identity fields a record already on disk carries, for an import that is
// about to rewrite it. A re-run of an import must not wipe an identifier
// somebody or another import added between runs, and `created` is not the
// only thing that has to survive being regenerated.
export function identityOnDisk(record) {
  const identity = {};
  for (const field of ENRICHABLE) if (!isEmpty(record?.[field])) identity[field] = record[field];
  return identity;
}

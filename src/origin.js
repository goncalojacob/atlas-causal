// Who wrote a record, and whether anybody has read it.
//
// A leaf module, like `kinds.js` and `vocab.js`: two closed vocabularies and
// the handful of questions asked of them. It exists because those two facts
// used to be inferred from `authors[].name` matching a literal string, in
// four separate places — rule 12's licence hole, the review queue's
// `isDraft`, the Wikidata import's `handWritten` and the CShapes import's
// `ownedBy`. Whether a record is reviewed, who is legally its author for
// attribution, and which process wrote it are three different facts, and a
// rename of any of those strings silently changed two of them (health review
// A, findings 8, 22 and 24; review B, finding 31).
//
// `authors` is attribution and nothing else now. `origin` says who created
// the record, `review.status` says how far it has been read, and everything
// below reads one of those two.

// The writers that can create a record. Closed, for the reason the edge types
// are closed: a writer nobody has decided about is a line added here and in
// `schema/common/provenance.json`, not a string invented at a call site.
export const ORIGIN_TOOLS = Object.freeze(['cshapes', 'basemaps', 'wikidata', 'assistant', 'form']);

// The two that read somebody else's database. What separates them from the
// other writers is that they run again: a re-run rewrites the records it
// owns, which is why `origin` — and not an author's name — is what says which
// records those are.
export const IMPORT_TOOLS = Object.freeze(['cshapes', 'basemaps', 'wikidata']);

// The imports whose material is not CC BY-SA, and so the whole of rule 12's
// exception for `data/actors/` and `data/relations/`. Adding an import adds a
// line here; nothing else can quietly relicense an actor, and a person named
// exactly like an import no longer can at all.
//
// It was `NC_ORIGINS` until M43a, when the second territory import arrived
// under GPL-3.0 rather than under a Creative Commons licence at all. The list
// never was about the NC clause: it is about which writers may put a licence
// on a record that `data/LICENSE` does not cover, and CShapes' happened to be
// the only one. `licensing.js` → `IMPORTED_LICENSES` is the other half — which
// licences those are — and rule 12 is the two of them read together.
export const IMPORT_LICENCE_ORIGINS = Object.freeze(['cshapes', 'basemaps']);

export const REVIEW_STATUS = Object.freeze({ draft: 'draft', reviewed: 'reviewed' });

// Which writer created this record, or null where a person did. Absent is
// deliberate and not a gap: `origin` is written once, by whatever made the
// record, and an enrichment pass that fills in a field on somebody else's
// record never sets it (rule 29).
export function originTool(record) {
  const origin = record?.origin;
  const tool = origin !== null && typeof origin === 'object' ? origin.tool : null;
  return typeof tool === 'string' ? tool : null;
}

export const writtenBy = (record, tool) => originTool(record) === tool;

export const importWritten = (record) => IMPORT_TOOLS.includes(originTool(record));

// A person wrote this record. The imports' own name for it: what the matching
// pass may write identifiers onto is a record no import created, which
// includes the assistant's drafts — they are exactly the records that have no
// identifier yet and want one.
export const handWritten = (record) => !importWritten(record);

// A record an import may create and relicense as its source demands.
export const mayRelicense = (record) => IMPORT_LICENCE_ORIGINS.includes(originTool(record));

// Nobody has read this record. What `review.html` lists and what
// `node tools/validate.mjs` counts down.
export const isDraft = (record) => record?.review?.status === REVIEW_STATUS.draft;

// Somebody has read this record and signed it. An import that meets one
// reports it and writes nothing: a signature is the one thing an automated
// writer must never take off a record (plan decision 2).
export const isReviewed = (record) => record?.review?.status === REVIEW_STATUS.reviewed;

// Where an id may stand in a record, once. A leaf module beside `kinds.js`
// and `vocab.js`: it imports the registry and nothing else, so the rename
// tool, the tests and anything later that has to walk the references can read
// one table instead of writing an if-chain of their own.
//
// It exists because `tools/migrate/ids.mjs` has to rewrite *every* reference
// to a renamed record, and a field left out of that list is a dangling
// reference the validator finds and a reader does not (i7-brief §1.3). The
// list is a table and not a chain of branches for the reason `kinds.js` is a
// registry: a tenth kind adds a row here, and the coverage test in
// `tests/references.test.mjs` fails on a schema that grew an id-shaped field
// this file does not know about — which is the one way a future kind cannot
// quietly slip past the rename.
//
// What is *not* here is what a reference means. Rule 3 in
// `src/validate/rules.js` is the authority on which kind a field may name and
// on whether it resolves; `to` below is the same answer written down so the
// coverage test can compare the two, and nothing reads it to decide anything.

import { KINDS } from './kinds.js';
// The kinds a full entry may link to by id, from the one place that list is
// written. `markdown.js` is pure — no DOM, no fetch — and it is the module
// that decides what a body's two reference shapes are, so the rewrite below
// reads its answer rather than keeping a second one.
import { RECORD_LINK_KINDS } from './markdown.js';

// Two steps that are not field names. A field cannot be called either of
// these — an object key in a record is a schema property name, and both
// schemas' `additionalProperties: false` keeps it that way — so a path is
// still a plain list of strings and prints as one.
export const ITEM = '[]'; // every element of an array
export const VALUES = '{}'; // every value of an object

// `to` for a reference that names a record of the referring record's own
// kind: `supersededBy` on an event is an event, on a source a source.
export const OWN_KIND = 'self';

// `to` for a reference whose kind is decided by the id and not by the field.
// A narrative step may name an event, an edge, an actor, a relation or a
// presence, and `NARRATIVE_REF_KINDS` is the order they are tried in.
export const ANY_KIND = null;

// On every record, whatever its kind. `review.citations` is not here: its
// **keys** are source ids and its values are not, which no path over values
// can say — see `CITATION_KEYS` below.
const ENVELOPE_REFERENCES = Object.freeze([
  Object.freeze({ at: Object.freeze(['supersededBy']), to: OWN_KIND }),
  Object.freeze({ at: Object.freeze(['sources', ITEM, 'source']), to: 'source' }),
]);

// Per kind, in registry order. Every entry is a field a schema declares as an
// id (`$ref: common/provenance.json#/properties/id`) or, for a narrative
// step, as one of the two id shapes.
//
// Two id-shaped fields are deliberately absent, and both name a **vocabulary**
// rather than a record: an event's and a place's `region`, which is a row of
// `data/regions.json`, and an event's `category`, which is a row of
// `data/categories.json`. Renaming a record never touches either, and
// `VOCABULARY_FIELDS` below is that exception written down so the coverage
// test can hold it.
const KIND_REFERENCES = Object.freeze({
  event: Object.freeze([
    Object.freeze({ at: Object.freeze(['place']), to: 'place' }),
    Object.freeze({ at: Object.freeze(['parent']), to: 'event' }),
    Object.freeze({ at: Object.freeze(['actors', ITEM, 'actor']), to: 'actor' }),
  ]),
  edge: Object.freeze([
    Object.freeze({ at: Object.freeze(['from']), to: 'event' }),
    Object.freeze({ at: Object.freeze(['to']), to: 'event' }),
    // The dissenting sources of a disputed link cite like any other
    // citation, and they are the one citation list that is not `/sources`.
    Object.freeze({ at: Object.freeze(['dispute', 'sources', ITEM, 'source']), to: 'source' }),
  ]),
  source: Object.freeze([]),
  actor: Object.freeze([]),
  presence: Object.freeze([
    Object.freeze({ at: Object.freeze(['actor']), to: 'actor' }),
    Object.freeze({ at: Object.freeze(['dependencyOf']), to: 'actor' }),
  ]),
  place: Object.freeze([]),
  relation: Object.freeze([
    Object.freeze({ at: Object.freeze(['from']), to: 'actor' }),
    Object.freeze({ at: Object.freeze(['to']), to: 'actor' }),
  ]),
  office: Object.freeze([
    Object.freeze({ at: Object.freeze(['of']), to: 'actor' }),
  ]),
  tenure: Object.freeze([
    Object.freeze({ at: Object.freeze(['person']), to: 'actor' }),
    Object.freeze({ at: Object.freeze(['office']), to: 'office' }),
    Object.freeze({ at: Object.freeze(['startedBy']), to: 'event' }),
  ]),
  narrative: Object.freeze([
    Object.freeze({ at: Object.freeze(['steps', ITEM, 'ref']), to: ANY_KIND }),
  ]),
});

// The id-shaped fields that name a row of a vocabulary in `data/` and never a
// record. They are id-shaped because a vocabulary key is a slug like any
// other, and they must stay out of the rename: renaming an event to
// `iberia` would otherwise move every event of the Iberia region with it.
export const VOCABULARY_FIELDS = Object.freeze({
  event: Object.freeze(['region', 'category']),
  place: Object.freeze(['region']),
});

// The full entry is prose, and two things inside it are references rather
// than words: a citation mark `[^source-id]`, which must name a source the
// record cites, and a link `[label](kind:id)` to another record. Rule 23
// checks both, so a rename that left them behind would turn a body's
// footnotes into footnotes to nothing — which is why `body` is on this list
// even though not a word of what the entry *says* is edited.
//
// The two patterns are `src/markdown.js`'s own, narrowed to the part that is
// an id: the parser cannot be used for the rewrite because it returns tokens
// and not offsets, so `tests/migrate-ids.test.mjs` holds the two together by
// asking `bodyCitations` and `bodyLinks` what the rewritten body says.
export const BODY_FIELD = 'body';
const BODY_CITATION = /\[\^([a-z0-9][a-z0-9-]*)((?:[ \t]+[^\]\n]+)?)\]/g;
const BODY_RECORD_LINK = new RegExp(String.raw`\]\((${RECORD_LINK_KINDS.join('|')}):([a-z0-9][a-z0-9-]*)\)`, 'g');

// Where the per-citation verification flags live. The **keys** of that object
// are the ids of the sources a record cites (`schema/common/provenance.json`,
// and rule 3 checks them), so a rename has to rewrite keys and not values —
// which is why this is a path to the object and not a row of the table above.
export const CITATION_KEYS = Object.freeze(['review', 'citations']);

// Every reference field of one kind: the envelope's, then the kind's own.
export function referencesOf(kind) {
  return [...ENVELOPE_REFERENCES, ...(KIND_REFERENCES[kind] ?? [])];
}

// The whole table, kind by kind, in registry order. For the tests and for a
// report; nothing in the rewrite needs it.
export const REFERENCES = Object.freeze(Object.fromEntries(
  KINDS.map((kind) => [kind, Object.freeze(referencesOf(kind))]),
));

// The files under `data/imports/` also name records — which actor a
// territory's entity code belongs to, which source an import cites — and they
// are not records themselves, so they carry no envelope and no kind of node.
// They are keyed here by the `kind` field `tools/lib/read.mjs` dispatches on
// (i7-brief §1.3 and amendment A3).
//
// `import-state`'s `pending` and `done` are **not** here and are not
// references: they are a cursor into a walk, whose entries are whatever
// identifier that walk is over — Q-numbers for `--import`, record ids for
// `--reconcile` — and the schema says only that they are strings. A stale
// entry there costs one item re-read on the next run; rewriting a list that
// may hold somebody else's identifiers would be the tool guessing.
export const IMPORT_REFERENCES = Object.freeze({
  'import-map': Object.freeze([
    Object.freeze({ at: Object.freeze(['source']), to: 'source' }),
    Object.freeze({ at: Object.freeze(['entries', VALUES, 'actor']), to: 'actor' }),
    Object.freeze({ at: Object.freeze(['entries', VALUES, 'splits', ITEM, 'actor']), to: 'actor' }),
  ]),
  'import-seeds': Object.freeze([
    Object.freeze({ at: Object.freeze(['source']), to: 'source' }),
  ]),
  'import-state': Object.freeze([
    Object.freeze({ at: Object.freeze(['source']), to: 'source' }),
  ]),
});

// ─── The walk ───────────────────────────────────────────────────────────────
//
// One rewrite, done in one place: the tool below and any later reader of the
// table share it, so "which fields" and "how they are replaced" cannot come
// to disagree.
//
// Every rewrite is structural — a node whose subtree did not change is
// returned as it was, and one that did is rebuilt with `{ ...node }` — so an
// untouched record comes back identical and a touched one keeps the key order
// it was written in. That is what lets the tool leave a record's own text
// byte-identical but for the fields it means to change.

function rewriteAt(node, path, rename, count) {
  if (node === null || node === undefined) return node;
  if (path.length === 0) {
    if (typeof node !== 'string') return node;
    const to = rename(node);
    if (typeof to !== 'string' || to === node) return node;
    count.n += 1;
    return to;
  }
  const [step, ...rest] = path;
  if (step === ITEM) {
    if (!Array.isArray(node)) return node;
    let changed = false;
    const out = node.map((item) => {
      const next = rewriteAt(item, rest, rename, count);
      if (next !== item) changed = true;
      return next;
    });
    return changed ? out : node;
  }
  if (typeof node !== 'object' || Array.isArray(node)) return node;
  if (step === VALUES) {
    let changed = false;
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      const next = rewriteAt(value, rest, rename, count);
      if (next !== value) changed = true;
      out[key] = next;
    }
    return changed ? out : node;
  }
  if (!Object.hasOwn(node, step)) return node;
  const next = rewriteAt(node[step], rest, rename, count);
  return next === node[step] ? node : { ...node, [step]: next };
}

// The keys of `review.citations`, which are source ids. The order is the
// order they were written in: a renamed key stays where it stood, so the
// diff of a rename is the key and nothing around it.
function rewriteCitationKeys(record, rename, count) {
  const citations = record?.review?.citations;
  if (citations === null || typeof citations !== 'object' || Array.isArray(citations)) return record;
  let changed = false;
  const out = {};
  for (const [key, value] of Object.entries(citations)) {
    const to = rename(key);
    if (typeof to === 'string' && to !== key) { changed = true; count.n += 1; out[to] = value; } else out[key] = value;
  }
  return changed ? { ...record, review: { ...record.review, citations: out } } : record;
}

// The two references inside a full entry. Nothing else in the text is
// touched: the locator after a citation mark, the label of a link and every
// other character come through as they were written.
function rewriteBody(record, rename, count) {
  const body = record?.body;
  if (typeof body !== 'string' || body === '') return record;
  const swap = (whole, id, tail, build) => {
    const to = rename(id);
    if (typeof to !== 'string' || to === id) return whole;
    count.n += 1;
    return build(to, tail);
  };
  const out = body
    .replace(BODY_CITATION, (whole, id, locator) => swap(whole, id, locator, (to, tail) => `[^${to}${tail}]`))
    .replace(BODY_RECORD_LINK, (whole, kind, id) => swap(whole, id, kind, (to, k) => `](${k}:${to})`));
  return out === body ? record : { ...record, body: out };
}

// One record with every reference rewritten by `rename`, which answers the id
// that stands for the one it is given — the identity for anything untouched.
// → { record, count }, where `record` is the same object when nothing
// matched, and `count` is how many references were rewritten.
export function rewriteReferences(record, rename) {
  const count = { n: 0 };
  let out = record;
  for (const { at } of referencesOf(record?.kind)) out = rewriteAt(out, at, rename, count);
  out = rewriteCitationKeys(out, rename, count);
  out = rewriteBody(out, rename, count);
  return { record: out, count: count.n };
}

// The same for one of the files under `data/imports/`, by the kind
// `readImportMaps` reports for it. A file of a kind this table does not know
// is left alone.
export function rewriteImportMap(map, kind, rename) {
  const count = { n: 0 };
  let out = map;
  for (const { at } of IMPORT_REFERENCES[kind] ?? []) out = rewriteAt(out, at, rename, count);
  return { map: out, count: count.n };
}

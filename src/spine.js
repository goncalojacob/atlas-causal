// The index's row encoding, in one place: the column table, the encoder and
// the decoder that every kind in `data/index/` is written and read through.
//
// Until I2 the projection was nine hand-written object literals in
// `validate/core.js` and a hand-written inverse in `data.js`, and a tenth kind
// meant writing both again. It is now one table — `SPINE_COLUMNS` — read
// forwards by `buildSpine` and backwards by `topologyFromSpine`, and a tenth
// kind is a row in it and nothing else (docs/index2-plan.md, D3).
//
// A record is a **positional row** over a shared table of ids, with the closed
// vocabularies as integers: `["1974-04-25", 0, …]` is `["carnation-revolution",
// "active", …]` read through `ids` and `vocab`. Measured on the built index the
// same information is 10.6x smaller raw on the real data and 5.2x at 10^4;
// gzip already hid most of that over the wire, and what it buys is `JSON.parse`
// and heap, which is where the wall is.
//
// It stays JSON — an array is a row, a file is readable in a diff and parsed by
// `JSON.parse`, and there is no binary format and no build step (i2-brief,
// "What this run must not do").
//
// A leaf module on purpose: `data.js` (the browser's decoder) cannot import
// `validate/core.js`, because `core.js` imports `data.js`. The base vocabulary
// lists are therefore *passed in* by the encoder rather than imported here, so
// that nothing of the validator reaches a page through this file.

import { edgeId } from './vocab.js';

// A tombstone still resolves its own URL and still reaches a card — 175
// retracted events do — but it is not part of the graph, so it carries what
// the card's head and meta line are built from and nothing else (h3a, A10).
// The label is kept whatever its kind calls it: a merged actor with no name
// would give the panel nothing to say it was merged *from* (deviation 215).
//
// Since I2 this is a **slot mask** and it is applied in both directions: the
// encoder writes `null` in a column it excludes, and the decoder writes no key
// for one. That is what keeps `note` off a retracted relation while an active
// one still carries `note: null`, which a per-slot rule alone cannot say.
export const TOMBSTONE_KEYS = new Set(['id', 'kind', 'status', 'supersededBy', 'aliases', 'wikidata', 'title', 'name', 'names', 'when', 'place', 'region', 'revised']);

// What a trimmed or `null` slot decodes to. Written per slot rather than
// discovered by failing (index2 review, finding 22): the spine writes
// `place: null` and omits `parent`, and "trailing nulls trimmed" cannot tell
// the two apart on its own.
const NULL = 'null';   // the key is there and its value is null
const OMIT = 'omit';   // there is no key
const LIST = 'list';   // the key is there and its value is []

// `type` says how the slot is spelled in the file:
//
//   raw       the value verbatim, whatever JSON it is
//   id        an index into the file's `ids` table
//   vocab     an index into one of the file's `vocab` lists
//   list      a JSON array verbatim; an empty one is not written
//   actors    an event's actor lines, each a row of its own
//   geometry  a presence's outline key, which is the whole of the object
const col = (name, type, extra = {}) => ({ name, type, absent: NULL, ...extra });

// The envelope every kind opens with. `id` is what the id table exists for and
// `status` decides the tombstone mask, so both are read before anything else.
const ENVELOPE = [col('id', 'id'), col('status', 'vocab', { vocab: 'status' })];

// The order inside a kind is chosen for the trailing trim, not for reading:
// what a tombstone keeps comes first, then what every active record has, then
// what few of them do. A short row means "the rest are absent", and that is
// what puts `parent`, `scope`, `category` and `subtreeWeight` back to costing
// nothing on the events that carry none.
const KIND_COLUMNS = {
  event: [
    ...ENVELOPE,
    col('title', 'raw', { absent: OMIT }),
    col('when', 'raw'),
    col('region', 'vocab', { vocab: 'region' }),
    col('place', 'id'),
    col('revised', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('weight', 'raw', { absent: OMIT }),
    col('citesCount', 'raw', { absent: OMIT }),
    col('actors', 'actors', { absent: LIST }),
    col('category', 'vocab', { vocab: 'category', absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
    col('parent', 'id', { absent: OMIT }),
    col('scope', 'vocab', { vocab: 'scope', absent: OMIT }),
    col('subtreeWeight', 'raw', { absent: OMIT }),
  ],
  // The one kind whose row was already a row: `[from, to, type, confidence,
  // status, revised]` since H3a, and the first six slots are still those six in
  // that order. The seventh is the id, which is `null` on every edge whose id
  // is `from--to--type` — which is all of them — and which used to be the
  // reason an edge was written as a whole object instead (i2-brief, section 2).
  //
  // No tombstone mask: a retracted edge keeps its ends and its type, because
  // the id the loader synthesises is made of them.
  edge: [
    col('from', 'id'),
    col('to', 'id'),
    col('type', 'vocab', { vocab: 'edgeType' }),
    col('confidence', 'vocab', { vocab: 'confidence' }),
    col('status', 'vocab', { vocab: 'status' }),
    col('revised', 'raw'),
    col('id', 'id', { absent: OMIT }),
  ],
  actor: [
    ...ENVELOPE,
    col('name', 'raw', { absent: OMIT }),
    col('when', 'raw'),
    col('revised', 'raw'),
    col('names', 'list', { absent: LIST }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('actorType', 'vocab', { vocab: 'actorType', absent: OMIT }),
    col('citesCount', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  place: [
    ...ENVELOPE,
    col('name', 'raw', { absent: OMIT }),
    col('region', 'vocab', { vocab: 'region' }),
    col('revised', 'raw'),
    col('names', 'list', { absent: LIST }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('where', 'raw', { absent: OMIT }),
    col('citesCount', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  relation: [
    ...ENVELOPE,
    col('when', 'raw'),
    col('from', 'id', { absent: OMIT }),
    col('to', 'id', { absent: OMIT }),
    col('type', 'vocab', { vocab: 'relationType', absent: OMIT }),
    col('note', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  office: [
    ...ENVELOPE,
    col('title', 'raw', { absent: OMIT }),
    col('when', 'raw'),
    col('revised', 'raw'),
    col('of', 'id', { absent: OMIT }),
    col('category', 'vocab', { vocab: 'officeCategory', absent: OMIT }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  tenure: [
    ...ENVELOPE,
    col('when', 'raw'),
    col('person', 'id', { absent: OMIT }),
    col('office', 'id', { absent: OMIT }),
    col('startedBy', 'id'),
    col('note', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  narrative: [
    ...ENVELOPE,
    col('title', 'raw', { absent: OMIT }),
    col('revised', 'raw'),
    col('summary', 'raw', { absent: OMIT }),
    col('authors', 'list', { absent: LIST }),
    col('window', 'raw'),
    // The refs and not a word of the prose; carried verbatim because a step's
    // ref may name an edge or a relation, whose ids are derived and are in no
    // id table.
    col('steps', 'list', { absent: LIST }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  presence: [
    ...ENVELOPE,
    col('when', 'raw'),
    col('actor', 'id', { absent: OMIT }),
    // Only the key of the outline: the shard that holds it is chosen by year
    // from the manifest, and `geometry.files` is read nowhere.
    col('geometry', 'geometry'),
    col('confidence', 'vocab', { vocab: 'confidence', absent: OMIT }),
    col('dependencyOf', 'id'),
    col('dependencyKind', 'vocab', { vocab: 'dependencyKind' }),
    col('capital', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
};

// An event's actor line is a row of the same kind, one level down: an actor id,
// a role from the data's own vocabulary, and the note the writer left about
// what that actor did — which 184 of 349 lines carry and the rest do not.
const ACTOR_LINE = [
  col('actor', 'id', { absent: OMIT }),
  col('role', 'vocab', { vocab: 'role', absent: OMIT }),
  col('note', 'raw', { absent: OMIT }),
];

// Two kinds are not rows in a file: `source` is the sources index, which
// carries every bibliographic field a spine row would only repeat, and
// `presence` is its own file since I1 — it is here because it is a row of this
// same table, written into that file.
export const SPINE_COLUMNS = Object.freeze(Object.fromEntries(
  Object.entries(KIND_COLUMNS).map(([kind, columns]) => [kind, Object.freeze({
    columns: Object.freeze(columns),
    byName: new Map(columns.map((c) => [c.name, c])),
    // Every kind but the edge is written through the record envelope: it says
    // what kind it is, and the tombstone mask applies to it. An edge says
    // neither — it is three slots and a type, its kind is the list it is in,
    // and a mask would take away the three the id is made of.
    envelope: kind !== 'edge',
    // An edge id is `from--to--type` on every one of them, so the id table does
    // not carry 39,996 of them at 10^4: the loader synthesises what the row
    // leaves out.
    derivedId: kind === 'edge',
  })]),
));

// The kinds each file carries, in `src/kinds.js` registry order — which is what
// fixes the id table's order and therefore every integer in the file.
export const SPINE_KINDS = Object.freeze(['event', 'edge', 'actor', 'place', 'relation', 'office', 'tenure', 'narrative']);
export const PRESENCE_KINDS = Object.freeze(['presence']);

const listName = (kind) => `${kind}s`;

// ─── The encoder ───────────────────────────────────────────────────────────

// `vocabBase` is the list each vocabulary starts as, and the whole of the
// difference between a closed vocabulary and a data-defined one: a closed list
// comes from `vocab.js` and `kinds.js`, a data-defined one (`region`,
// `category`, `role`) from its own file in that file's order, and a value met
// in a record that is in neither is appended in first-seen order — which is
// deterministic because the records are in id order (index2 review, finding 8).
//
// `read(kind, name, record)` is the one accessor the nine literals became; the
// caller supplies it because two slots are not `record[name]` (`citesCount` is
// counted at build time, and a presence's `geometry` is one key of an object).
export function encodeSpineFile({ schema, kinds, listOf, vocabBase = {}, read }) {
  const ids = [];
  const idIndex = new Map();
  const intern = (id) => {
    const found = idIndex.get(id);
    if (found !== undefined) return found;
    idIndex.set(id, ids.length);
    ids.push(id);
    return ids.length - 1;
  };

  const vocab = {};
  const vocabIndex = {};
  const useVocab = (name) => {
    if (vocab[name] === undefined) {
      vocab[name] = [...(vocabBase[name] ?? [])];
      vocabIndex[name] = new Map(vocab[name].map((value, i) => [value, i]));
    }
    return name;
  };
  const internVocab = (name, value) => {
    const found = vocabIndex[name].get(value);
    if (found !== undefined) return found;
    vocabIndex[name].set(value, vocab[name].length);
    vocab[name].push(value);
    return vocab[name].length - 1;
  };
  // Declared before the first row, so that a file names every vocabulary its
  // columns can use even where no record happens to use one.
  for (const kind of kinds) {
    for (const c of SPINE_COLUMNS[kind].columns) if (c.type === 'vocab') useVocab(c.vocab);
    if (SPINE_COLUMNS[kind].columns.some((c) => c.type === 'actors')) {
      for (const c of ACTOR_LINE) if (c.type === 'vocab') useVocab(c.vocab);
    }
  }

  // The whole of the saving on the four fields most events do not carry: a row
  // stops where its values stop, and the column table says what the rest were.
  const trim = (row) => {
    let end = row.length;
    while (end > 0 && row[end - 1] === null) end -= 1;
    return end === row.length ? row : row.slice(0, end);
  };

  const encodeSlot = (c, value) => {
    if (value === null || value === undefined) return null;
    switch (c.type) {
      case 'id': return intern(value);
      case 'vocab': return internVocab(c.vocab, value);
      case 'list': return value.length === 0 ? null : value;
      case 'geometry': return value.key ?? null;
      case 'actors': return value.length === 0 ? null : value.map((line) => trim(
        ACTOR_LINE.map((lc) => encodeSlot(lc, Object.hasOwn(line, lc.name) ? line[lc.name] : undefined)),
      ));
      default: return value;
    }
  };

  // Every record id first, in registry order and in id order within a kind, so
  // that the table's front is the same for two builds of one dataset; anything
  // else is appended as it is met below.
  for (const kind of kinds) {
    if (SPINE_COLUMNS[kind].derivedId) continue;
    for (const record of listOf(kind)) intern(record.id);
  }

  // `aliases` and `supersededBy` are on every record whatever its kind, and on
  // the real data 1,703 of 1,720 carry `[]` and `null`. Two empty slots per
  // record per kind is what this list exists to remove; the whole-object case
  // of the old edge tuple folds into it as well (i2-brief, section 1 and A6).
  const merges = { aliases: [], superseded: [] };
  const out = { schema, ids, vocab, columns: {}, merges };

  for (const kind of kinds) {
    const spec = SPINE_COLUMNS[kind];
    out.columns[kind] = spec.columns.map((c) => c.name);
    out[listName(kind)] = listOf(kind).map((record) => {
      const active = record.status === 'active';
      const row = trim(spec.columns.map((c) => {
        if (spec.envelope && !active && !TOMBSTONE_KEYS.has(c.name)) return null;
        if (c.name === 'id' && spec.derivedId && record.id === edgeId(record)) return null;
        return encodeSlot(c, read(kind, c.name, record));
      }));
      for (const alias of record.aliases ?? []) merges.aliases.push([intern(alias), intern(record.id)]);
      if (record.supersededBy) merges.superseded.push([intern(record.id), intern(record.supersededBy)]);
      return row;
    });
  }
  return out;
}

// ─── The decoder ───────────────────────────────────────────────────────────

// Read through the file's **own** `columns` and `vocab` and never through a
// copy of the tables above: a file that names its own shape is decoded by name,
// and a file naming a column this build does not know is refused by name rather
// than read as though it were something else (i2-brief, section 2).
export function decodeSpineFile(file, kinds) {
  const ids = file?.ids ?? [];
  const vocab = file?.vocab ?? {};
  const idOf = (i) => (typeof i === 'number' ? ids[i] ?? null : i ?? null);
  const wordOf = (name, i) => (typeof i === 'number' ? vocab[name]?.[i] ?? null : i ?? null);

  const decodeSlot = (c, value) => {
    if (c.type === 'geometry') return { key: value ?? null };
    if (value === null || value === undefined) return c.absent === LIST ? [] : null;
    switch (c.type) {
      case 'id': return idOf(value);
      case 'vocab': return wordOf(c.vocab, value);
      case 'actors': return value.map((line) => {
        const out = {};
        for (const [i, lc] of ACTOR_LINE.entries()) {
          const raw = i < line.length ? line[i] : null;
          if (raw === null || raw === undefined) continue;
          out[lc.name] = decodeSlot(lc, raw);
        }
        return out;
      });
      default: return value;
    }
  };

  const out = {};
  const byId = new Map();
  for (const kind of kinds) {
    const spec = SPINE_COLUMNS[kind];
    const names = file?.columns?.[kind] ?? spec.columns.map((c) => c.name);
    const columns = names.map((name) => {
      const c = spec.byName.get(name);
      if (c === undefined) {
        throw new Error(`data/index/: a ${kind} row carries the column "${name}", which this build does not read. Rebuild the index: node tools/build-index.mjs`);
      }
      return c;
    });
    const statusAt = columns.findIndex((c) => c.name === 'status');

    out[listName(kind)] = (file?.[listName(kind)] ?? []).map((row) => {
      const status = statusAt === -1 ? 'active' : decodeSlot(columns[statusAt], row[statusAt] ?? null);
      const active = status === 'active';
      const record = spec.envelope ? { kind } : {};
      for (const [i, c] of columns.entries()) {
        if (spec.envelope && !active && !TOMBSTONE_KEYS.has(c.name)) continue;
        const raw = i < row.length ? row[i] : null;
        if ((raw === null || raw === undefined) && c.absent === OMIT) continue;
        record[c.name] = decodeSlot(c, raw);
      }
      // The two the merges list carries for every kind at once. They are on
      // every record even when empty: they are the hop `resolve()` walks.
      record.supersededBy = null;
      record.aliases = [];
      if (spec.derivedId && record.id === undefined) record.id = edgeId(record);
      byId.set(record.id, record);
      return record;
    });
  }

  for (const [alias, id] of file?.merges?.aliases ?? []) {
    byId.get(idOf(id))?.aliases.push(idOf(alias));
  }
  for (const [id, target] of file?.merges?.superseded ?? []) {
    const record = byId.get(idOf(id));
    if (record) record.supersededBy = idOf(target);
  }
  return out;
}

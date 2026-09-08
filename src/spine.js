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
import { extent, fromAstronomical, toAstronomical } from './util/dates.js';

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
//   lines     a list of sub-rows, each read through the column list in `lines`
//   pick      the named keys of an object, as a row of their own
//   years     the astronomical bounds of `when` or of `window` — I3's core
//   geometry  a presence's outline key, which is the whole of the object
const col = (name, type, extra = {}) => ({ name, type, absent: NULL, ...extra });

// The envelope every kind opens with. `id` is what the id table exists for and
// `status` decides the tombstone mask, so both are read before anything else.
const ENVELOPE = [col('id', 'id'), col('status', 'vocab', { vocab: 'status' })];

// An event's actor line is a row of the same kind, one level down: an actor id,
// a role from the data's own vocabulary, and the note the writer left about
// what that actor did — which 184 of 349 lines carry and the rest do not.
//
// Split by I3 like the record above it: which actor is a **join** and is in the
// core, and what they are said to have done is read by a card and is in the
// attribute shard (docs/index2-plan.md, D4).
const ACTOR_LINE_JOIN = [col('actor', 'id', { absent: OMIT })];
const ACTOR_LINE_TEXT = [
  col('role', 'vocab', { vocab: 'role', absent: OMIT }),
  col('note', 'raw', { absent: OMIT }),
];
const ACTOR_LINE = [...ACTOR_LINE_JOIN, ...ACTOR_LINE_TEXT];

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
    col('actors', 'lines', { lines: ACTOR_LINE, absent: LIST }),
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

// A column table: one spec per kind, read forwards by the encoder and
// backwards by the decoder. Three of them exist — the spine, and since I3 the
// core and the attribute shards it splits into — and they differ only in which
// columns each kind carries.
function columnTable(byKind, { tombstoneKeys = TOMBSTONE_KEYS } = {}) {
  return Object.freeze(Object.fromEntries(
    Object.entries(byKind).map(([kind, columns]) => [kind, Object.freeze({
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
      // What a row of this kind says about itself before it says anything: the
      // slots that name the record rather than describe it. Every table's rows
      // carry them; only the attribute tables carry nothing else that is not a
      // value, which is what the union test in tests/spine.test.mjs rests on.
      keys: Object.freeze(columns.filter((c) => c.key).map((c) => c.name)),
      tombstoneKeys,
    })]),
  ));
}

// Two kinds are not rows in a file: `source` is the sources index, which
// carries every bibliographic field a spine row would only repeat, and
// `presence` is its own file since I1 — it is here because it is a row of this
// same table, written into that file.
export const SPINE_COLUMNS = columnTable(KIND_COLUMNS);

// ─── The core and the attribute shards (I3) ────────────────────────────────
//
// The same records, split in two along the line `docs/index2-plan.md` D4 draws:
// the **core** is what the whole-graph guarantee needs plus what a mark, a bar
// and a lane are drawn from, and every page will load it whole; the
// **attributes** are everything a card, a label or a strip reads, filed by
// century and fetched for the window.
//
// The two tables below are one partition of `KIND_COLUMNS` above and are held
// to that by `tests/spine.test.mjs`: per kind, the core's value columns and the
// shard's together are the spine's, with nothing invented and nothing dropped.
// Three columns are in both because they are split *inside* — `when`, `where`
// and `actors` — and each half says which part it takes.
//
// Why the joins are in the core and not the shards: `eventsByActor`,
// `eventsByPlace`, the `actor:` and `place:` lenses and the actor card's list
// are all unwindowed, and a join that arrived by century would answer half a
// question (index2-plan, section 6 risk 4).

// The id and the status name the record and decide the tombstone mask, so an
// attribute row opens with them and neither is one of its values: `id` and
// `status` are the core's to carry.
const KEY_ENVELOPE = [col('id', 'id', { key: true }), col('status', 'vocab', { vocab: 'status', key: true })];

// The astronomical bounds of an interval: the numbers `overlaps`, the scales
// and the sorts use, and the whole of what the three views need of a date. The
// record's **own** numbering — the day, the calendar, a bound of two years, a
// BCE year — stays in the shard, verbatim, and is never replaced by this
// (h3a-brief, A1; index2 review, finding 21).
const years = (name, shape) => col(name, 'years', { shape });

// The keys of an object this table takes, the rest belonging to the other one.
const pick = (name, keys) => col(name, 'pick', { keys });

const CORE_BY_KIND = {
  event: [
    ...ENVELOPE,
    years('when', 'when'),
    col('region', 'vocab', { vocab: 'region' }),
    col('place', 'id'),
    col('weight', 'raw', { absent: OMIT }),
    col('actors', 'lines', { lines: ACTOR_LINE_JOIN, absent: LIST }),
    col('parent', 'id', { absent: OMIT }),
    col('subtreeWeight', 'raw', { absent: OMIT }),
  ],
  // The tuple, less the one slot a card reads: `revised` is what a record's
  // file is asked for with, and `record()` waits for the shard that carries it
  // (index2 review, finding 3; i3-brief, A2).
  edge: [
    col('from', 'id'),
    col('to', 'id'),
    col('type', 'vocab', { vocab: 'edgeType' }),
    col('confidence', 'vocab', { vocab: 'confidence' }),
    col('status', 'vocab', { vocab: 'status' }),
    col('id', 'id', { absent: OMIT }),
  ],
  actor: [...ENVELOPE, years('when', 'when'), col('actorType', 'vocab', { vocab: 'actorType', absent: OMIT })],
  place: [...ENVELOPE, pick('where', ['lon', 'lat']), col('region', 'vocab', { vocab: 'region' })],
  relation: [...ENVELOPE, years('when', 'when'), col('from', 'id', { absent: OMIT }), col('to', 'id', { absent: OMIT })],
  office: [...ENVELOPE, years('when', 'when'), col('of', 'id', { absent: OMIT })],
  tenure: [...ENVELOPE, years('when', 'when'), col('person', 'id', { absent: OMIT }), col('office', 'id', { absent: OMIT })],
  narrative: [...ENVELOPE, years('window', 'window')],
};

const ATTRIBUTES_BY_KIND = {
  event: [
    ...KEY_ENVELOPE,
    col('title', 'raw', { absent: OMIT }),
    col('when', 'raw'),
    col('revised', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('citesCount', 'raw', { absent: OMIT }),
    col('actors', 'lines', { lines: ACTOR_LINE_TEXT, absent: LIST }),
    col('category', 'vocab', { vocab: 'category', absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
    col('scope', 'vocab', { vocab: 'scope', absent: OMIT }),
  ],
  // An edge says which one it is the way the loader does: `from--to--type`,
  // three integers into this file's own id table rather than the id itself,
  // which is what keeps 39,996 long strings out of the shards at 10^4.
  edge: [
    col('from', 'id', { key: true }),
    col('to', 'id', { key: true }),
    col('type', 'vocab', { vocab: 'edgeType', key: true }),
    col('revised', 'raw'),
    col('id', 'id', { key: true, absent: OMIT }),
  ],
  actor: [
    ...KEY_ENVELOPE,
    col('name', 'raw', { absent: OMIT }),
    col('when', 'raw'),
    col('revised', 'raw'),
    col('names', 'list', { absent: LIST }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('citesCount', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  place: [
    ...KEY_ENVELOPE,
    col('name', 'raw', { absent: OMIT }),
    col('revised', 'raw'),
    col('names', 'list', { absent: LIST }),
    col('wikidata', 'raw', { absent: OMIT }),
    pick('where', ['precision', 'label']),
    col('citesCount', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  relation: [
    ...KEY_ENVELOPE,
    col('when', 'raw'),
    col('type', 'vocab', { vocab: 'relationType', absent: OMIT }),
    col('note', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  office: [
    ...KEY_ENVELOPE,
    col('title', 'raw', { absent: OMIT }),
    col('when', 'raw'),
    col('revised', 'raw'),
    col('category', 'vocab', { vocab: 'officeCategory', absent: OMIT }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  tenure: [
    ...KEY_ENVELOPE,
    col('when', 'raw'),
    col('startedBy', 'id'),
    col('note', 'raw'),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
  narrative: [
    ...KEY_ENVELOPE,
    col('title', 'raw', { absent: OMIT }),
    col('revised', 'raw'),
    col('summary', 'raw', { absent: OMIT }),
    col('authors', 'list', { absent: LIST }),
    col('window', 'raw'),
    col('steps', 'list', { absent: LIST }),
    col('wikidata', 'raw', { absent: OMIT }),
    col('wikipedia', 'raw', { absent: OMIT }),
  ],
};

export const CORE_COLUMNS = columnTable(CORE_BY_KIND);
export const ATTRIBUTE_COLUMNS = columnTable(ATTRIBUTES_BY_KIND);

// The four columns that are in both tables because they are split inside, and
// what each half takes. Named here so the union test can say "these and no
// others" rather than allowing any overlap at all.
export const SPLIT_COLUMNS = Object.freeze(new Set(['when', 'window', 'where', 'actors']));

// What a record reads as while its shard is in flight. The three views draw
// from these — a mark, a bar and a node, with no label until the shard lands —
// and a card, an entry page and a search result row draw from nothing until
// `attributesLoaded(id)` is true (index2 review, finding 21; i3-brief, A3).
//
// Applied per attribute column and never past the tombstone mask, so a
// retracted record gets no `citesCount` it would not have had.
export const ATTRIBUTE_FALLBACKS = Object.freeze({
  title: (record) => record.id,
  name: (record) => record.id,
  citesCount: () => 0,
  names: () => [],
});

// The kinds each file carries, in `src/kinds.js` registry order — which is what
// fixes the id table's order and therefore every integer in the file.
export const SPINE_KINDS = Object.freeze(['event', 'edge', 'actor', 'place', 'relation', 'office', 'tenure', 'narrative']);
export const PRESENCE_KINDS = Object.freeze(['presence']);

const listName = (kind) => `${kind}s`;

// ─── The year bounds a `years` column carries ──────────────────────────────
//
// `[min, max]` in astronomical years, `max` null where the interval is open;
// null where the record has no interval at all. It is `extent(when)` written
// down — the pair every scale, sort and overlap in the atlas already computes
// — and it is the one thing the core says about a date. What the record itself
// says (the day, the calendar, a bound of two years, a BCE year) is in the
// shard and is not derivable from this, which is why they are two columns and
// not one (index2 review, finding 21).
//
// A malformed interval is nobody's business here: the validator refuses it and
// this writes null rather than throwing in the middle of a build.
function yearRow(c, value) {
  try {
    if (c.shape === 'window') {
      return [toAstronomical(value.from), toAstronomical(value.to)];
    }
    const { min, max } = extent(value);
    return [min, max];
  } catch {
    return null;
  }
}

// And back: the shape the atlas reads a date in, carrying the same numbers.
// `extent()` of what comes out is `[min, max]` again, so a bar, a mark and a
// sort are where they would have been with the record's own numbering — and a
// card draws none of it, because `attributesLoaded(id)` is false until the
// shard lands (i3-brief, A3).
function yearsFrom(c, row) {
  if (!Array.isArray(row)) return null;
  const [min, max] = row;
  try {
    if (c.shape === 'window') return { from: fromAstronomical(min), to: fromAstronomical(max) };
    return { start: fromAstronomical(min), end: max === null || max === undefined ? null : fromAstronomical(max) };
  } catch {
    return null;
  }
}

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
//
// `table` is which column table is being written: the spine, or since I3 the
// core or one attribute shard. The three differ in their columns and in nothing
// else, which is why they are one encoder.
export function encodeSpineFile({ schema, kinds, listOf, vocabBase = {}, read, table = SPINE_COLUMNS, merges: writeMerges = true }) {
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
    for (const c of table[kind].columns) {
      if (c.type === 'vocab') useVocab(c.vocab);
      if (c.type === 'lines') for (const lc of c.lines) if (lc.type === 'vocab') useVocab(lc.vocab);
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
      case 'years': return yearRow(c, value);
      case 'pick': return trim(c.keys.map((key) => value[key] ?? null));
      case 'lines': return value.length === 0 ? null : value.map((line) => trim(
        c.lines.map((lc) => encodeSlot(lc, Object.hasOwn(line, lc.name) ? line[lc.name] : undefined)),
      ));
      default: return value;
    }
  };

  // Every record id first, in registry order and in id order within a kind, so
  // that the table's front is the same for two builds of one dataset; anything
  // else is appended as it is met below.
  for (const kind of kinds) {
    if (table[kind].derivedId) continue;
    for (const record of listOf(kind)) intern(record.id);
  }

  // `aliases` and `supersededBy` are on every record whatever its kind, and on
  // the real data 1,703 of 1,720 carry `[]` and `null`. Two empty slots per
  // record per kind is what this list exists to remove; the whole-object case
  // of the old edge tuple folds into it as well (i2-brief, section 1 and A6).
  // An attribute shard carries none of it: the merges are what `resolve()`
  // walks, they are on every record whatever its century, and they are the
  // core's (i3-brief, section 1).
  const merges = { aliases: [], superseded: [] };
  const out = { schema, ids, vocab, columns: {}, ...(writeMerges ? { merges } : {}) };

  for (const kind of kinds) {
    const spec = table[kind];
    out.columns[kind] = spec.columns.map((c) => c.name);
    out[listName(kind)] = listOf(kind).map((record) => {
      const active = record.status === 'active';
      const row = trim(spec.columns.map((c) => {
        if (spec.envelope && !active && !spec.tombstoneKeys.has(c.name)) return null;
        if (c.name === 'id' && spec.derivedId && record.id === edgeId(record)) return null;
        return encodeSlot(c, read(kind, c.name, record));
      }));
      if (writeMerges) {
        for (const alias of record.aliases ?? []) merges.aliases.push([intern(alias), intern(record.id)]);
        if (record.supersededBy) merges.superseded.push([intern(record.id), intern(record.supersededBy)]);
      }
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
export function decodeSpineFile(file, kinds, table = SPINE_COLUMNS) {
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
      case 'years': return yearsFrom(c, value);
      case 'pick': return Object.fromEntries(c.keys
        .map((key, i) => [key, i < value.length ? value[i] : null])
        .filter(([, v]) => v !== null));
      case 'lines': return value.map((line) => {
        const out = {};
        for (const [i, lc] of c.lines.entries()) {
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
    const spec = table[kind];
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
        if (spec.envelope && !active && !spec.tombstoneKeys.has(c.name)) continue;
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

// ─── The two halves put back together ──────────────────────────────────────
//
// A record in the atlas is a core row that an attribute shard fills in when it
// lands and that goes back to its fallbacks when the shard is evicted. Both
// directions are driven by the same column table, so a column added to the
// shard cannot be forgotten by either one, and the test that says the two
// halves are the spine is asserted on the merged record.
//
// The record is filled **in place**: a card, a lens or a layer holds the object
// itself, and replacing it would leave them all reading the version they were
// handed.

// Which columns of a kind an attribute row carries values in, past the mask a
// tombstone's status applies. The keys are what say which record it is and are
// the core's.
function attributeValues(kind, status) {
  const spec = ATTRIBUTE_COLUMNS[kind];
  if (!spec) return [];
  const active = status === 'active';
  return spec.columns.filter((c) => !c.key && (active || !spec.envelope || spec.tombstoneKeys.has(c.name)));
}

// One record, filled from the row its shard carries. `partial` is what the
// decoder gave for that row; a column absent from it is absent from the record,
// which is how "the shard says this record has no `scope`" is told from "the
// shard has not landed".
export function applyAttributes(record, partial) {
  for (const c of attributeValues(record.kind ?? 'edge', record.status)) {
    const has = Object.hasOwn(partial, c.name);
    if (c.type === 'pick') {
      const into = record[c.name];
      if (into === null || into === undefined || !has) {
        if (has) record[c.name] = partial[c.name];
        continue;
      }
      for (const key of c.keys) {
        if (partial[c.name] !== null && Object.hasOwn(partial[c.name] ?? {}, key)) into[key] = partial[c.name][key];
        else delete into[key];
      }
    } else if (c.type === 'lines') {
      const into = Array.isArray(record[c.name]) ? record[c.name] : [];
      for (const [i, line] of into.entries()) {
        const from = has ? partial[c.name][i] ?? {} : {};
        for (const lc of c.lines) {
          if (Object.hasOwn(from, lc.name)) line[lc.name] = from[lc.name];
          else delete line[lc.name];
        }
      }
    } else if (has) record[c.name] = partial[c.name];
    else delete record[c.name];
  }
}

// And the other way, when the LRU drops a shard: everything that came out of it
// goes, and what a view draws instead is the fallback. `bounds` is the one
// value the core carried and the shard overwrote, so it is handed back in.
export function stripAttributes(record, bounds = undefined) {
  for (const c of attributeValues(record.kind ?? 'edge', record.status)) {
    if (c.type === 'pick') {
      for (const key of c.keys) if (record[c.name] !== null && record[c.name] !== undefined) delete record[c.name][key];
    } else if (c.type === 'lines') {
      for (const line of Array.isArray(record[c.name]) ? record[c.name] : []) {
        for (const lc of c.lines) delete line[lc.name];
      }
    } else delete record[c.name];
  }
  fillFallbacks(record, bounds);
}

// What a record reads as with no shard in hand: the core's own bounds where the
// shard would have put the record's numbering, and a name that is the id.
export function fillFallbacks(record, bounds = undefined) {
  const kind = record.kind ?? 'edge';
  for (const c of attributeValues(kind, record.status)) {
    if (c.type === 'years' || !Object.hasOwn(ATTRIBUTE_FALLBACKS, c.name)) continue;
    record[c.name] = ATTRIBUTE_FALLBACKS[c.name](record);
  }
  // `when` and `window` are not fallbacks but the core's own answer, kept from
  // the moment the file was read so that evicting a shard cannot lose them.
  // `undefined` is "the core row had no such slot" — a tombstone's `window`,
  // say — and `null` is a slot the core wrote as null, which an office with
  // `when: null` has and which is not the same thing.
  for (const c of CORE_COLUMNS[kind]?.columns ?? []) {
    if (c.type !== 'years') continue;
    if (bounds === undefined) delete record[c.name];
    else record[c.name] = bounds;
  }
}

// The bounds a core record carries, kept beside the atlas so that a shard can
// be dropped and the record still drawn. Two numbers a record, against the
// whole of `when` — which is what the LRU cap exists to stop holding.
export function boundsOf(record) {
  for (const c of CORE_COLUMNS[record.kind ?? 'edge']?.columns ?? []) {
    if (c.type === 'years' && Object.hasOwn(record, c.name)) return record[c.name];
  }
  return undefined;
}

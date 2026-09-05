// The record kinds, once. A leaf module beside `vocab.js`: it imports
// nothing, so the rules, the form, the review queue, the entry page and the
// tools can all read it without any of them importing each other.
//
// Adding a ninth kind touched about thirty places (health review A, finding
// 9; B, finding 19): the directory in one file, the schema file in another,
// the licences in a third, the form's fields in a fourth, the label and the
// hint in a fifth, the citation lists in a sixth, the queue's order in a
// seventh. Every one of them is a place a contributor can forget, and the
// only way to find them all was a grep somebody had to think of running.
//
// So a kind is one entry here, and the lists the rest of the atlas used to
// keep are derived from it. What is *not* here is anything that needs the
// DOM, the topology or a schema document: the card modules stay in `panel/`,
// the projections in `validate/core.js`, and `validate/schemas.js` keeps its
// own list because it also carries the four schema files that belong to no
// kind and its order is tested against the disk.
//
// Adding a kind is now: one entry below, one `schema/v1/<kind>.json`, one
// line in `schemas.js`, the `kind` enum in `schema/common/provenance.json`,
// one projection in `buildTopology`, one card module. The consistency tests
// in `tests/registry.test.mjs` fail on a registry that has drifted from the
// schemas, which is the one duplication that cannot be removed — a JSON
// Schema cannot import JavaScript.

// One kind. The fields, in order:
//
//   dir          the directory under data/ its records live in
//   schema       its schema file, as loadSchemas and readSchemaFiles key them
//   label        what the contribution form calls it
//   hint         the sentence under that label: what the kind is for
//   licenses     the licences a record of this kind may carry (rule 11)
//   identity     may it claim a Wikidata item (rules 21 and 22)
//   body         may it carry a long entry in the Markdown subset
//   entryPage    does entry.html render it, or does it live inside the atlas
//   linkable     may a body link to it by id
//   urlParam     the atlas parameter that opens one
//   titleKey     the field whose text suggests an id in the form
//   citerLabel   what a source's card calls the group of these that cite it
//   citations    the bundle's citation lists, in the order the form draws them
//   actors       the bundle's actor lists (one kind has one; the rest none)
//   steps        the bundle's step lists (likewise)
//   fields       the names of its form fields, in the order they are drawn
//   importOrder  where an import creates it, or null if nothing imports it
//
// `citations`, `actors` and `steps` carry `{ key, label, path }` and, on one
// list, a `when` predicate over the form's own values — a dispute's dissenting
// sources are asked for only once the confidence says there is a dispute.
const KIND_ENTRIES = {
  event: {
    dir: 'events',
    schema: 'v1/event.json',
    label: 'Event',
    hint: 'One point in space and time, or a long process with an interval and no place.',
    licenses: ['CC-BY-SA-4.0'],
    identity: true,
    body: true,
    entryPage: true,
    linkable: true,
    urlParam: 'selected',
    titleKey: 'title',
    citerLabel: 'Events',
    citations: [{ key: 'citations', label: 'Sources', path: '/sources' }],
    actors: [{ key: 'actors', label: 'Actors', path: '/actors' }],
    steps: [],
    fields: ['title', 'id', 'summary', 'start', 'end', 'date', 'calendar', 'endDate', 'place', 'region', 'body', 'wikidata'],
    // Places before actors before events, so an event can point at a place
    // the same batch created rather than being refused for a record about to
    // exist.
    importOrder: 3,
  },
  edge: {
    dir: 'edges',
    schema: 'v1/edge.json',
    label: 'Edge',
    hint: 'One causal link, with the argument for it. The id is derived: from, to and type.',
    licenses: ['CC-BY-SA-4.0'],
    identity: false,
    body: false,
    entryPage: false,
    linkable: false,
    urlParam: 'selected',
    titleKey: null,
    citerLabel: 'Links',
    citations: [
      { key: 'citations', label: 'Supporting sources', path: '/sources' },
      { key: 'disputeCitations', label: 'Dissenting sources', path: '/dispute/sources', when: (v) => v.confidence === 'disputed' },
    ],
    actors: [],
    steps: [],
    fields: ['from', 'to', 'type', 'confidence', 'explanation', 'disputeText'],
    importOrder: null,
  },
  source: {
    dir: 'sources',
    schema: 'v1/source.json',
    label: 'Source',
    hint: 'A bibliography entry, cited by reference. Fifty records citing the same book cite one file.',
    licenses: ['CC-BY-SA-4.0'],
    identity: false,
    body: false,
    entryPage: false,
    // A body cites a source with [^source-id] and links to one by id: the
    // work behind a sentence is a thing a reader opens.
    linkable: true,
    urlParam: 'source',
    titleKey: null,
    // A source is never a citer: rule 6 exempts it and it cites nothing.
    citerLabel: null,
    citations: [],
    actors: [],
    steps: [],
    fields: [
      'id', 'type', 'creators', 'title', 'year',
      'containerTitle', 'containerKind', 'volume', 'issue', 'pages',
      'publisher', 'isbn', 'doi', 'url', 'accessed', 'repository', 'reference',
    ],
    importOrder: null,
  },
  actor: {
    dir: 'actors',
    schema: 'v1/actor.json',
    label: 'Actor',
    hint: 'A person, polity, institution or people. Actors are reached through their events, never listed on their own.',
    // An actor may be NC-SA only when an import created it: see NC_ORIGINS in
    // src/origin.js.
    licenses: ['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0'],
    identity: true,
    body: true,
    entryPage: true,
    linkable: true,
    urlParam: 'actor',
    titleKey: 'names',
    citerLabel: 'Actors',
    citations: [{ key: 'citations', label: 'Sources', path: '/sources' }],
    actors: [],
    steps: [],
    fields: ['names', 'id', 'actorType', 'summary', 'start', 'end', 'label', 'lon', 'lat', 'precision', 'body', 'wikidata'],
    importOrder: 2,
  },
  presence: {
    dir: 'presences',
    schema: 'v1/presence.json',
    // No label and no hint: the form does not offer a presence, so there is
    // nothing to call it there (see CONTRIBUTED_KINDS).
    label: null,
    hint: null,
    // A presence is written from imported geometry more often than not, and
    // that geometry's licence is not data/LICENSE's. A hand-made presence is
    // CC BY-SA like every other record.
    licenses: ['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0'],
    identity: false,
    body: false,
    entryPage: false,
    linkable: false,
    urlParam: null,
    titleKey: null,
    citerLabel: 'Territories',
    // The form does not build one: a presence carries geometry, and geometry
    // arrives through tools/import/ (M5). It cites like the rest of data/ and
    // the citer group on a source's card is where those citations show.
    citations: [],
    actors: [],
    steps: [],
    fields: [],
    importOrder: null,
  },
  place: {
    dir: 'places',
    schema: 'v1/place.json',
    label: 'Place',
    hint: 'Somewhere events happen, with its own coordinates. A place is a geographic fact, so it needs no source — the events that point at it still do.',
    licenses: ['CC-BY-SA-4.0'],
    identity: true,
    body: true,
    entryPage: true,
    linkable: true,
    urlParam: 'place',
    titleKey: 'names',
    citerLabel: 'Places',
    // A place is a geographic fact, not an argument: rule 6 exempts it, and
    // the form says so rather than asking for a citation nobody has.
    citations: [],
    actors: [],
    steps: [],
    fields: ['names', 'id', 'lon', 'lat', 'precision', 'region', 'summary', 'body', 'wikidata'],
    importOrder: 1,
  },
  relation: {
    dir: 'relations',
    schema: 'v1/relation.json',
    label: 'Relation',
    hint: 'A dated link between two actors — a regime of a state, a member of a party, who led a body. The id is derived: from, to and type.',
    // A relation is written by a person about two actors; nothing imports
    // one, so there is no NC hole here.
    licenses: ['CC-BY-SA-4.0'],
    identity: false,
    body: false,
    entryPage: false,
    linkable: false,
    // A relation has no card and no URL of its own; it is read on the cards
    // of the two actors at its ends.
    urlParam: null,
    titleKey: null,
    citerLabel: 'Relations between actors',
    // A relation is an assertion about two actors, so it cites like an edge.
    citations: [{ key: 'citations', label: 'Sources', path: '/sources' }],
    actors: [],
    steps: [],
    fields: ['from', 'to', 'type', 'start', 'end', 'date', 'note'],
    importOrder: null,
  },
  narrative: {
    dir: 'narratives',
    schema: 'v1/narrative.json',
    label: 'Narrative',
    hint: 'A signed walk through records that are already here: your account of them, in order, changing none of them. Where yours and somebody else\'s disagree, both stand.',
    // A narrative is prose about records that are already here, and it is
    // signed: the same licence as everything else somebody wrote.
    licenses: ['CC-BY-SA-4.0'],
    identity: false,
    body: false,
    entryPage: false,
    linkable: false,
    urlParam: 'narrative',
    titleKey: 'title',
    citerLabel: 'Narratives',
    // A narrative cites what it rests on beyond the records it walks.
    citations: [{ key: 'citations', label: 'Sources', path: '/sources' }],
    actors: [],
    // The steps of a narrative: a reference and a bit of text, except that
    // the reference is to an event *or* a link and the text is the narrator's
    // own paragraph. Order is the order of the rows, which is the order of
    // the walk.
    steps: [{ key: 'steps', label: 'Steps', path: '/steps' }],
    fields: ['title', 'id', 'summary', 'windowFrom', 'windowTo'],
    importOrder: null,
  },
};

const deepFreeze = (value) => {
  if (value === null || typeof value !== 'object') return value;
  for (const v of Object.values(value)) deepFreeze(v);
  return Object.freeze(value);
};

// The registry, frozen through: a caller that could push a licence onto a
// kind's list would be back to a vocabulary with two definitions.
export const KIND = deepFreeze(KIND_ENTRIES);

// The kinds, in the order a record set is walked in. It is the order
// `schema/common/provenance.json` writes its `kind` enum in, and
// tests/registry.test.mjs holds the two together.
export const KINDS = Object.freeze(Object.keys(KIND));

// kind → directory under data/. What tools/lib/read.mjs reads records from
// and what bundle-to-files.mjs writes them to.
export const KIND_DIRS = Object.freeze(Object.fromEntries(KINDS.map((k) => [k, KIND[k].dir])));

// The kinds for which a flag is true, in registry order. `IDENTITY_KINDS`,
// `BODY_KINDS`, `ENTRY_KINDS` and `RECORD_LINK_KINDS` are each one call.
export function kindsWhere(flag) {
  return Object.freeze(KINDS.filter((k) => KIND[k][flag] === true));
}

// kind → the value of one field, for the kinds that have one. A kind whose
// value is null is left out, which is how `ATLAS_PARAM` loses `relation` and
// `presence` and `CITER_LABEL` loses `source`.
export function byKind(field) {
  return Object.freeze(Object.fromEntries(
    KINDS.filter((k) => KIND[k][field] !== null && KIND[k][field] !== undefined)
      .map((k) => [k, KIND[k][field]]),
  ));
}

// kind → its licences, the table rule 11 checks against.
export function licensesOf() {
  return Object.freeze(Object.fromEntries(KINDS.map((k) => [k, KIND[k].licenses])));
}

// The kinds an import may create, in the order it must create them in.
export const IMPORT_KINDS = Object.freeze(
  KINDS.filter((k) => KIND[k].importOrder !== null)
    .sort((a, b) => KIND[a].importOrder - KIND[b].importOrder),
);

// The bundle's three list families, keyed by kind. Every kind appears, with
// an empty list where it carries none: the form asks each kind for all three
// and an absent key would be a crash rather than "this kind has no steps".
export const listsOf = (family) => Object.freeze(Object.fromEntries(KINDS.map((k) => [k, KIND[k][family]])));

// The kinds a person writes by hand, in the order the form offers them and
// the review queue groups them: the things an argument rests on first, then
// the arguments, then the walks through them. A presence is not one — it
// carries geometry, which arrives through tools/import/ — and it is the one
// kind with no form fields, which is what tests/registry.test.mjs checks this
// list against.
//
// The order is not the registry's own, which follows the topology, so it is
// written out; it is still one list, read by the form's buttons and by the
// queue alike.
export const CONTRIBUTED_KINDS = Object.freeze(['source', 'place', 'actor', 'event', 'edge', 'relation', 'narrative']);

// The order a source's card draws its citer groups in: what an argument is
// made of before what walks through it. A kind the record set does not have
// yet simply never appears.
export const CITER_ORDER = Object.freeze(['event', 'edge', 'actor', 'relation', 'place', 'presence', 'narrative']);

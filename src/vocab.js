// The closed vocabularies, once. A leaf module: it imports nothing, so that
// any file — the rules, the state, the views, the tools — can import it
// without dragging the data or the DOM along with it.
//
// The edge types, the relation types, the groupings and the lens kinds were
// each written out in four to eleven places (health review A, findings 9 and
// 28; B, finding 19): `state.js` kept its own copies of the two id patterns
// "so that this file stays free of the data", `lanes.js` and `state.js` each
// declared `GROUPS`, and the labels and the orders lived in `graph.js` and in
// two panel cards. Two definitions of one closed set drift, and adding a
// sixth relation type meant finding eleven of them.
//
// Nothing here is data: it is the grammar the data is written in. A type that
// is not in this file is not a type the atlas knows, and the JSON schemas'
// enums are the one remaining copy — kept because a schema cannot import
// JavaScript, and checked against this file by tests/registry.test.mjs.

// The slug every id in this repository is made of, written once so the two
// id patterns below cannot come to disagree about it.
// Non-capturing inside, so that the groups of the patterns built from it are
// the three parts of an id and nothing else: `parseFocus` reads m[1] and m[2]
// and a stray group would silently shift them.
const SLUG_SOURCE = '[a-z0-9]+(?:-[a-z0-9]+)*';

// Five types exist specifically so that everything does not collapse into
// plain causation (CLAUDE.md). `label` is what a card says; the order is the
// order an answer list is sorted in — the strongest claim first, the loosest
// last — and it is the order the key in `about.html` and the graph's own key
// are written in.
export const EDGE_TYPES = Object.freeze([
  Object.freeze({ id: 'caused', label: 'caused' }),
  Object.freeze({ id: 'enabled', label: 'enabled' }),
  Object.freeze({ id: 'reacted-to', label: 'reacted to' }),
  Object.freeze({ id: 'precondition-of', label: 'precondition of' }),
  Object.freeze({ id: 'inspired', label: 'inspired' }),
]);

// A relation reads two ways: the same record is "Regime of Portugal" on the
// Estado Novo's card and "Regimes" on Portugal's, which is why a card groups
// by type *and* direction. `allied-with` is symmetric and is the one type
// whose two directions are one group.
//
// `endpoints` is which kind of actor may stand at each end (rule 19): a
// person is not a regime and a party is not a state, and the shape of the
// record cannot say so. `acyclic` marks the two types that describe a line of
// succession and must therefore not close on themselves — each on its own,
// since a body may be part of a state that is a regime of it in no sense.
export const RELATION_TYPES = Object.freeze([
  Object.freeze({
    id: 'regime-of', out: 'Regime of', in: 'Regimes', acyclic: true,
    endpoints: Object.freeze({ from: Object.freeze(['polity']), to: Object.freeze(['polity']) }),
  }),
  Object.freeze({
    id: 'succeeded', out: 'Succeeded by', in: 'Successor of', acyclic: true,
    // A colony and the state after it are two actors of the same kind; a
    // ministry is not succeeded by a country.
    endpoints: Object.freeze({ from: Object.freeze(['polity', 'institution']), to: Object.freeze(['polity', 'institution']), sameKind: true }),
  }),
  Object.freeze({
    id: 'member-of', out: 'Member of', in: 'Members',
    // A state can be a member. M29 found that a person at the `from` end is
    // all this allowed, so Portugal's ten memberships of international bodies
    // were written as `allied-with` with a note saying they were not
    // alliances; M31 re-types them and `allied-with` goes back to meaning an
    // alliance (plan decision 12). The `to` end is unchanged: what a person
    // may be a member of, a state may be a member of too.
    endpoints: Object.freeze({ from: Object.freeze(['person', 'polity', 'institution']), to: Object.freeze(['institution', 'polity']) }),
  }),
  Object.freeze({
    id: 'part-of', out: 'Part of', in: 'Parts of it',
    endpoints: Object.freeze({ from: Object.freeze(['institution']), to: Object.freeze(['institution', 'polity']) }),
  }),
  // Deprecated, and here on purpose. Who led a body is an office somebody
  // held: a relation's id is `from--to--type`, so this type could say that one
  // person led one body once and no more, and Soares led the Partido
  // Socialista and held three governments (plan review, finding 1). M30a-2
  // re-filed its twelve records as tenures and left twelve tombstones, and a
  // tombstone still has to validate — which is why the type stays in this
  // list, in the schema's enum and id pattern, in the narrative step pattern
  // and in the group order below, all of which name it. Rule 19 is where the
  // deprecation bites: no *active* relation may be of a type marked here, and
  // the scaffold and the form do not offer one.
  Object.freeze({
    id: 'led', out: 'Led', in: 'Led by', deprecated: true,
    endpoints: Object.freeze({ from: Object.freeze(['person']), to: Object.freeze(['institution', 'polity']) }),
  }),
  Object.freeze({
    id: 'allied-with', out: 'Allied with', in: 'Allied with', symmetric: true,
    endpoints: Object.freeze({ from: Object.freeze(['polity', 'institution']), to: Object.freeze(['polity', 'institution']) }),
  }),
]);

// What kind of thing an office is, and — the part no schema can say — which
// kind of actor may stand at its `of` end. A crown and a presidency are
// offices of a state; a general secretaryship is an office of a party, which
// is an institution here, and a command may be either (plan decision 1,
// amendment A5).
//
// It is the same shape as `RELATION_ENDPOINTS` and lives beside it for the
// same reason: rule 26 checks a record against this table, so a category
// spelled two ways would be a rule that never fires. `label` is what a card
// says; the order is the order the form offers them in and the schema's enum.
export const OFFICE_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'head-of-state', label: 'Head of state', of: Object.freeze(['polity']) }),
  Object.freeze({ id: 'head-of-government', label: 'Head of government', of: Object.freeze(['polity']) }),
  Object.freeze({ id: 'legislature', label: 'Legislature', of: Object.freeze(['polity']) }),
  Object.freeze({ id: 'party-leadership', label: 'Party leadership', of: Object.freeze(['polity', 'institution']) }),
  Object.freeze({ id: 'military-command', label: 'Military command', of: Object.freeze(['polity', 'institution']) }),
  Object.freeze({ id: 'religious', label: 'Religious', of: Object.freeze(['polity', 'institution']) }),
  Object.freeze({ id: 'other', label: 'Other', of: Object.freeze(['polity', 'institution']) }),
]);

// The four groupings a reader can ask the lanes for. `none` is the default
// and names no lanes at all: the arrangement that says least about the data,
// and therefore the right first thing to show.
export const GROUPS = Object.freeze(['none', 'actor', 'place', 'region']);

// The kinds a lens can be about. Three until H7, and six since: the owner
// asked to be able to focus on "parent events, actors, timelines or others, or
// any number of these together", so an event, a region and a narrative are
// kinds a focus may name as well. An edge is still not one — it is a single
// argument between two events, and a lens on it would be a lens on those two.
export const FOCUS_KINDS = Object.freeze(['actor', 'place', 'source', 'event', 'region', 'narrative']);

// The literal a reader writes when they turn off a lens the atlas offered
// them. Opening an actor or a place with no `?focus=` behaves as a one-focus
// lens on it (lens.js), and without this there would be no way to say "no,
// show me everything" while keeping the card open: an absent parameter is
// what asks for that lens in the first place.
export const FOCUS_NONE = 'none';

// The two views the atlas draws the same state in.
export const VIEWS = Object.freeze(['map', 'graph']);

const ids = (types) => Object.freeze(types.map((t) => t.id));
const alternation = (types) => types.map((t) => t.id).join('|');

export const EDGE_TYPE_IDS = ids(EDGE_TYPES);
export const RELATION_TYPE_IDS = ids(RELATION_TYPES);
export const OFFICE_CATEGORY_IDS = ids(OFFICE_CATEGORIES);

// A relation's id has the same three-part shape as an edge's and is not one:
// its third part comes from the other vocabulary, and the two never meet.
// Anything that turns an id into a path, a URL or a step of a walk has to
// know which of the two it is holding, so both patterns are **built** here
// from the lists above and never written out again.
export const EDGE_ID = new RegExp(`^(${SLUG_SOURCE})--(${SLUG_SOURCE})--(${alternation(EDGE_TYPES)})$`);
export const RELATION_ID = new RegExp(`^(${SLUG_SOURCE})--(${SLUG_SOURCE})--(${alternation(RELATION_TYPES)})$`);

// The other direction of `EDGE_ID`: the three parts it matches, joined. The
// spine writes an edge as a tuple and lets the loader synthesise the id
// (h3a-brief, A2), so the pattern and the synthesis have to be the same
// sentence — which is why this lives beside it and not in the validator: a
// page that reads the spine would otherwise import the whole of `core.js`
// to build an id.
export function edgeId(edge) {
  return `${edge.from}--${edge.to}--${edge.type}`;
}
// "actor:salazar" — a lens kind and the id it is about.
export const FOCUS = new RegExp(`^(${FOCUS_KINDS.join('|')}):(${SLUG_SOURCE})$`);

// The whole `?focus=` parameter since H7: a comma-separated list of those, or
// the literal `none`. One focus is the same string it always was, so every
// link ever shared still opens on the lens it named.
const ONE_FOCUS = `(?:${FOCUS_KINDS.join('|')}):${SLUG_SOURCE}`;
export const FOCUS_PARAM = new RegExp(`^(?:${FOCUS_NONE}|${ONE_FOCUS}(?:,${ONE_FOCUS})*)$`);

const labelMap = (types, key) => Object.freeze(Object.fromEntries(types.map((t) => [t.id, t[key]])));

// { caused: 'caused', 'reacted-to': 'reacted to', … } for the cards.
export const EDGE_TYPE_LABEL = labelMap(EDGE_TYPES, 'label');

// { 'regime-of': { out: 'Regime of', in: 'Regimes' }, … }
export const RELATION_LABEL = Object.freeze(Object.fromEntries(
  RELATION_TYPES.map((t) => [t.id, Object.freeze({ out: t.out, in: t.in })]),
));

export const RELATION_ENDPOINTS = labelMap(RELATION_TYPES, 'endpoints');
export const ACYCLIC_RELATION_TYPES = Object.freeze(RELATION_TYPES.filter((t) => t.acyclic).map((t) => t.id));

// A type the atlas still reads and no longer writes. The records that carry
// one are tombstones and keep validating; rule 19 refuses an active relation
// of one, so a deprecation cannot be undone by accident.
export const DEPRECATED_RELATION_TYPES = Object.freeze(RELATION_TYPES.filter((t) => t.deprecated).map((t) => t.id));

// What a writer may choose from: the closed vocabulary less what has been
// retired out of it. The scaffold and the contribution form offer this, and
// `RELATION_TYPE_IDS` stays the whole list, because the schema's enum, the id
// pattern and every tombstone are written against that.
export const WRITABLE_RELATION_TYPE_IDS = Object.freeze(RELATION_TYPES.filter((t) => !t.deprecated).map((t) => t.id));

// { 'head-of-state': ['polity'], … } — the actor types an office of each
// category may belong to (rule 26), and { 'head-of-state': 'Head of state' }
// for the cards and the form.
export const OFFICE_ENDPOINTS = labelMap(OFFICE_CATEGORIES, 'of');
export const OFFICE_CATEGORY_LABEL = labelMap(OFFICE_CATEGORIES, 'label');

// The order an actor's card draws its relation groups in: what this actor is,
// then what it was made of, then who ran it, then who it stood beside. A
// symmetric type has one group and not two, so it contributes one key.
export const RELATION_GROUP_ORDER = Object.freeze([
  'regime-of', 'succeeded', 'part-of', 'member-of', 'led', 'allied-with',
].flatMap((id) => {
  const type = RELATION_TYPES.find((t) => t.id === id);
  return type.symmetric ? [`${id}:out`] : [`${id}:out`, `${id}:in`];
}));

// What a narrative step may point at. Two shapes — a bare slug, or a
// three-part id — and four kinds behind them, because a walk that could only
// name an event or a link could not say "and this is the body that did it"
// (health review B, finding 18; H7 item 6). A bare slug is an event, an actor
// or a presence and which of the three is decided by the atlas, never by the
// pattern: the ids are the only authority on that (narrative.js). A three-part
// id is an edge or a relation, and those two vocabularies stay apart.
export const NARRATIVE_STEP_REF = new RegExp(`^${SLUG_SOURCE}(--${SLUG_SOURCE}--(${alternation(EDGE_TYPES)}|${alternation(RELATION_TYPES)}))?$`);

// The kinds a step's ref may name, in the order a bare slug is tried in: an
// event first, because a walk is a walk over events and that is what almost
// every step is.
export const NARRATIVE_REF_KINDS = Object.freeze(['event', 'edge', 'actor', 'relation', 'presence']);

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
    endpoints: Object.freeze({ from: Object.freeze(['person']), to: Object.freeze(['institution', 'polity']) }),
  }),
  Object.freeze({
    id: 'part-of', out: 'Part of', in: 'Parts of it',
    endpoints: Object.freeze({ from: Object.freeze(['institution']), to: Object.freeze(['institution', 'polity']) }),
  }),
  Object.freeze({
    id: 'led', out: 'Led', in: 'Led by',
    endpoints: Object.freeze({ from: Object.freeze(['person']), to: Object.freeze(['institution', 'polity']) }),
  }),
  Object.freeze({
    id: 'allied-with', out: 'Allied with', in: 'Allied with', symmetric: true,
    endpoints: Object.freeze({ from: Object.freeze(['polity', 'institution']), to: Object.freeze(['polity', 'institution']) }),
  }),
]);

// The four groupings a reader can ask the lanes for. `none` is the default
// and names no lanes at all: the arrangement that says least about the data,
// and therefore the right first thing to show.
export const GROUPS = Object.freeze(['none', 'actor', 'place', 'region']);

// The three kinds a lens can be about. An edge and a narrative are arguments
// about records rather than records events belong to, so neither is one.
export const FOCUS_KINDS = Object.freeze(['actor', 'place', 'source']);

// The two views the atlas draws the same state in.
export const VIEWS = Object.freeze(['map', 'graph']);

const ids = (types) => Object.freeze(types.map((t) => t.id));
const alternation = (types) => types.map((t) => t.id).join('|');

export const EDGE_TYPE_IDS = ids(EDGE_TYPES);
export const RELATION_TYPE_IDS = ids(RELATION_TYPES);

// A relation's id has the same three-part shape as an edge's and is not one:
// its third part comes from the other vocabulary, and the two never meet.
// Anything that turns an id into a path, a URL or a step of a walk has to
// know which of the two it is holding, so both patterns are **built** here
// from the lists above and never written out again.
export const EDGE_ID = new RegExp(`^(${SLUG_SOURCE})--(${SLUG_SOURCE})--(${alternation(EDGE_TYPES)})$`);
export const RELATION_ID = new RegExp(`^(${SLUG_SOURCE})--(${SLUG_SOURCE})--(${alternation(RELATION_TYPES)})$`);
// "actor:salazar" — a lens kind and the id it is about.
export const FOCUS = new RegExp(`^(${FOCUS_KINDS.join('|')}):(${SLUG_SOURCE})$`);

const labelMap = (types, key) => Object.freeze(Object.fromEntries(types.map((t) => [t.id, t[key]])));

// { caused: 'caused', 'reacted-to': 'reacted to', … } for the cards.
export const EDGE_TYPE_LABEL = labelMap(EDGE_TYPES, 'label');

// { 'regime-of': { out: 'Regime of', in: 'Regimes' }, … }
export const RELATION_LABEL = Object.freeze(Object.fromEntries(
  RELATION_TYPES.map((t) => [t.id, Object.freeze({ out: t.out, in: t.in })]),
));

export const RELATION_ENDPOINTS = labelMap(RELATION_TYPES, 'endpoints');
export const ACYCLIC_RELATION_TYPES = Object.freeze(RELATION_TYPES.filter((t) => t.acyclic).map((t) => t.id));

// The order an actor's card draws its relation groups in: what this actor is,
// then what it was made of, then who ran it, then who it stood beside. A
// symmetric type has one group and not two, so it contributes one key.
export const RELATION_GROUP_ORDER = Object.freeze([
  'regime-of', 'succeeded', 'part-of', 'member-of', 'led', 'allied-with',
].flatMap((id) => {
  const type = RELATION_TYPES.find((t) => t.id === id);
  return type.symmetric ? [`${id}:out`] : [`${id}:out`, `${id}:in`];
}));

// A narrative walks events and edges and nothing else, so a step's ref is one
// of two shapes: an edge id, or the slug of an event.
export const NARRATIVE_STEP_REF = new RegExp(`^${SLUG_SOURCE}(--${SLUG_SOURCE}--(${alternation(EDGE_TYPES)}))?$`);

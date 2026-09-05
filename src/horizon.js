// "What did this lead to by year X?", between the traversal and the four
// things that draw it. graph.js answers the question; util/window.js says
// which year is being asked about; this file is the one place the two are
// put together, so the panel's list and the sets lit on the map, the graph
// view and the timeline cannot disagree about what is downstream.
//
// Pure: an atlas and a state in, records out. Nothing here knows the DOM.

import { reachableBy } from './graph.js';
import { resolveWindow, resolveHorizon, horizonIsOpen } from './util/window.js';
import { keyedCache, SEP } from './util/memo.js';

// How many of the answer the panel lists, and — the same number, deliberately
// — how many of it are kept out of the stacks on the map and in the graph
// (health review B, finding 22). A reader can only aim at what they can see.
export const SHOWN = 40;

// How far out a reachable event is, in three bands, because opacity in
// twenty steps says nothing a reader can read. One step away is `near`, two
// or three `mid`, further out `far`.
export function horizonBand(depth) {
  if (depth <= 1) return 'near';
  if (depth <= 3) return 'mid';
  return 'far';
}

// The year the question is asked about, astronomical: the reader's own if
// they chose one, otherwise the window's far end. Null when there is no data.
export function horizonYear(atlas, state) {
  return resolveHorizon(state, resolveWindow(state, atlas.extent));
}

// The answer, in full, for the panel: [{ event, depth, edges, first, last,
// disputed }] ordered by path length then year. Empty without a selection.
// Memoised on the adjacency, the event asked about and the year: the map,
// the timeline, the graph view and the panel each ask, and each was walking
// the whole downstream of the selected event for itself on every state
// change — four breadth-first walks of the corpus per click (health review A,
// finding 12; B, finding 22). Four answers are held per graph, least recently
// used dropped first, so a reader nudging the year up and down does not hold
// a hundred reachable sets alive.
//
// The list is shared and never copied, so nothing that reads it may sort it
// or push to it. Nothing does: the panel slices, and the views count.
const answered = keyedCache(4);

export function horizonResults(atlas, state, id = state.selected) {
  const year = horizonYear(atlas, state);
  if (year === null || !id || !atlas.events.has(id)) return [];
  return answered(atlas.adjacency, `${id}${SEP}${year}`, () => reachableBy(atlas.adjacency, id, year));
}

// The same answer as a Map<event id, depth>, for whatever draws it — and
// empty unless the horizon is open, since the default year is the window's
// own and lighting every event's whole downstream by default would say
// something the reader has not asked.
export function horizonSet(atlas, state) {
  if (!horizonIsOpen(state)) return new Map();
  return new Map(horizonResults(atlas, state).map((r) => [r.event.id, r.depth]));
}

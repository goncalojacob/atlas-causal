// "What did this lead to by year X?", between the traversal and the four
// things that draw it. graph.js answers the question; util/window.js says
// which year is being asked about; this file is the one place the two are
// put together, so the panel's list and the sets lit on the map, the graph
// view and the timeline cannot disagree about what is downstream.
//
// Pure: an atlas and a state in, records out. Nothing here knows the DOM.

import { reachableBy } from './graph.js';
import { resolveWindow, resolveHorizon, horizonIsOpen } from './util/window.js';

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
export function horizonResults(atlas, state, id = state.selected) {
  const year = horizonYear(atlas, state);
  if (year === null || !id || !atlas.events.has(id)) return [];
  return reachableBy(atlas.adjacency, id, year);
}

// The same answer as a Map<event id, depth>, for whatever draws it — and
// empty unless the horizon is open, since the default year is the window's
// own and lighting every event's whole downstream by default would say
// something the reader has not asked.
export function horizonSet(atlas, state) {
  if (!horizonIsOpen(state)) return new Map();
  return new Map(horizonResults(atlas, state).map((r) => [r.event.id, r.depth]));
}

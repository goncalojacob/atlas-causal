// What the graph view lays out, and the key that says when it has to be laid
// out again.
//
// The arrangement is the events there are to draw and the bands they are
// drawn in — both asked of the same two files the timeline asks (lens.js,
// lanes.js), so the two pictures cannot disagree about either. It is rebuilt
// when they change and kept when they do not, so panning, selecting and
// walking a chain never move a node under the reader.
//
// Pure, and here rather than in graph-view.js, because the key is the whole
// of that promise and `node --test` has no DOM to build a view in.

import { overlaps, resolveWindow, withMargin } from '../util/window.js';
import { lensSet } from '../lens.js';
import { lanesFor } from '../lanes.js';

// What the reader is holding, written from the state rather than counted out
// of the held set itself. The set is derived from these six fields and from
// the lens, which the key carries already, so two states that agree on them
// hold the same events; a key of the ids would have been the same answer
// spelled at the length of the corpus.
//
// It is only ever appended when something held falls outside the margin —
// otherwise selecting an event would move every node in the picture, which
// is the one thing the arrangement promises never to do.
export function holdingKey(state) {
  return [
    state.selected ?? '',
    (state.chain ?? []).join('>'),
    state.actor ?? '',
    state.narrative ?? '',
    state.step ?? '',
    state.horizon ?? '',
  ].join('~');
}

// The key of an arrangement. Two states with the same key have the same
// picture; two with different keys do not.
//
// The lens as it is *applied*, not as it is written: reading a narrative
// suspends the focus (lens.js), so a key made of `state.focus` said the
// arrangement was unchanged while the set of events had gone from one
// actor's to all of them, and the nodes stayed where the lens had put them
// (review finding 14).
//
// Membership, not the lane ids: which lane an event is drawn in is the
// heaviest of its actors *among the lanes on screen*, and that weight is
// counted inside the window (lanes.js). The same six lanes in the same order
// can therefore hold different events after the band is moved, which a key of
// ids alone could not see.
//
// The band the events are taken from is part of the key too (H4b): the
// arrangement is laid out over the window and one period either side of it,
// so a reader who moves the band is looking at a different set of events and
// therefore at a different picture. Nothing else about the picture moves a
// node — panning, zooming, selecting and walking all leave the key alone.
export function arrangementKey(state, events, lanes, lens, margin = null, holding = '') {
  const focus = lens === null ? '' : (state.focus ?? '');
  const at = new Map();
  lanes.forEach((lane, index) => {
    for (const id of lane.members) at.set(id, index);
  });
  // With no grouping there are no lanes and nothing to be a member of; the
  // set of events is then the whole of the arrangement.
  const membership = lanes.length === 0 ? '' : events.map((e) => at.get(e.id) ?? -1).join(',');
  const band = margin ? `${margin.from}:${margin.to}` : '';
  return `${focus}|${state.group}|${lanes.map((l) => l.id).join(',')}|${membership}|${band}|${holding}`;
}

// `held` is what the reader is holding — the graph's own `alone` set, which
// it has already had to build to draw. It is passed in rather than asked for
// here because `workingSet` runs the convergence query and this is called on
// every render; the view computes it once and gives it to both.
export function arrangementOf(atlas, state, held = null) {
  const lens = lensSet(atlas, state);
  const all = lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents;
  const window = resolveWindow(state, atlas.extent);
  // The window and one period either side, which is what the view draws
  // (window.js) and, since H4b, all it lays out. Laying out the whole corpus
  // to draw a decade of it was the cost the window was meant to save.
  const margin = withMargin(window);
  // Beyond the margin, only what the reader is holding: a walked chain that
  // ran off the end of the band is still a chain, and a node of it with no
  // coordinates would be a link into nothing.
  const events = [];
  let beyond = 0;
  for (const event of all) {
    if (overlaps(event.when, margin)) events.push(event);
    else if (held && held.has(event.id)) {
      events.push(event);
      beyond += 1;
    }
  }
  const lanes = state.group === 'none' ? [] : lanesFor(state.group, atlas, window, lens, state.lanes);
  return {
    events,
    lanes,
    key: arrangementKey(state, events, lanes, lens, margin, beyond === 0 ? '' : holdingKey(state)),
  };
}

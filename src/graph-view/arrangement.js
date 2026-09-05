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

import { resolveWindow } from '../util/window.js';
import { lensSet } from '../lens.js';
import { lanesFor } from '../lanes.js';

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
export function arrangementKey(state, events, lanes, lens) {
  const focus = lens === null ? '' : (state.focus ?? '');
  const at = new Map();
  lanes.forEach((lane, index) => {
    for (const id of lane.members) at.set(id, index);
  });
  // With no grouping there are no lanes and nothing to be a member of; the
  // set of events is then the whole of the arrangement.
  const membership = lanes.length === 0 ? '' : events.map((e) => at.get(e.id) ?? -1).join(',');
  return `${focus}|${state.group}|${lanes.map((l) => l.id).join(',')}|${membership}`;
}

export function arrangementOf(atlas, state) {
  const lens = lensSet(atlas, state);
  const events = lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents;
  const window = resolveWindow(state, atlas.extent);
  const lanes = state.group === 'none' ? [] : lanesFor(state.group, atlas, window, lens, state.lanes);
  return { events, lanes, key: arrangementKey(state, events, lanes, lens) };
}

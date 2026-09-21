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

import { formatFoci, lensView } from '../lens.js';
import { lanesFor } from '../lanes.js';

// What the reader is holding, written from the state rather than counted out
// of the held set itself. The set is derived from these six fields and from
// the lens, which the key carries already, so two states that agree on them
// hold the same events; a key of the ids would have been the same answer
// spelled at the length of the corpus.
//
// It was only ever appended to an arrangement's key when something held fell
// outside the band's margin, and since M76 there is no margin and nothing
// falls outside one: selecting an event does not move a node, which is the one
// thing the arrangement promises never to do. What still reads it is the
// graph's *stacking* key (graph-view.js) — what a cluster may not swallow is a
// question about what the reader is holding and always was.
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
// The lens as it is *applied*, not as it is written: a key made of
// `state.focus` said the arrangement was unchanged while the set of events had
// gone from one actor's to all of them, and the nodes stayed where the lens
// had put them (review finding 14). `foci` is that list, formatted by the
// caller, and it is not the same string as `state.focus` whenever the lens is
// an implied one — an open actor, an open place, or, since M48, a narrative
// being read. Two narratives, or two actors, write no `focus=` at all and
// would otherwise key alike and adopt each other's layout. Null for a caller
// with only the parameter in hand, which is what this was before.
//
// Membership, not the lane ids: which lane an event is drawn in is the
// heaviest of its actors *among the lanes on screen* (lanes.js). The same six
// lanes in the same order can therefore hold different events, which a key of
// ids alone could not see.
//
// **The band is no longer part of the key** (M76). It was, from H4b until this
// milestone, because the arrangement was laid out over the window and one
// period either side of it and a reader who moved the band was looking at a
// different set of events. The owner, 21 September: *"I think the graph can
// always show all dates, then one can zoom in and out and pan to look at
// different times."* So the graph lays out every event it draws, whatever the
// window says, and moving the band moves no node at all — which is what
// panning, zooming, selecting and walking already promised.
export function arrangementKey(state, events, lanes, lens, holding = '', foci = null) {
  const focus = lens === null ? '' : (foci ?? state.focus ?? '');
  // What the graph draws, when it is the graph deciding: inside a lens the two
  // filters are off and two states that differ only in them are one picture.
  const filters = lens === null ? `${state.degree ?? 0}:${state.tops ? 1 : 0}` : '';
  // The layer list, whole and as it stands: since the glyph run a category
  // toggle removes events here as the lens does, and two arrangements of two
  // different sets of categories would otherwise key the same and the second
  // would adopt the first's layout. The whole list, because this file has no
  // business knowing which of its names is a category.
  const layers = (state.layers ?? []).join(',');
  const at = new Map();
  lanes.forEach((lane, index) => {
    for (const id of lane.members) at.set(id, index);
  });
  // With no grouping there are no lanes and nothing to be a member of; the
  // set of events is then the whole of the arrangement.
  const membership = lanes.length === 0 ? '' : events.map((e) => at.get(e.id) ?? -1).join(',');
  return `${focus}|${filters}|${layers}|${state.group}|${lanes.map((l) => l.id).join(',')}|${membership}|${holding}`;
}

// How many active links an event has, both directions counted: the adjacency
// holds only active edges between active events (graph.js), so this is the
// degree the reader can actually see lines for.
export function degreeOf(atlas, id) {
  return (atlas.adjacency?.out.get(id)?.length ?? 0) + (atlas.adjacency?.in.get(id)?.length ?? 0);
}

// **What the graph draws, which is not everything** (M48 §3). 103 of the 250
// active events have one edge or none and eight carry seven or more; a picture
// of all of them is eight nodes a reader can read and two hundred they cannot.
// Two filters, and they are not alternatives: at least `degree` active links,
// and — for the hierarchy M42 brings — no parent.
//
// Three rules hold them honest:
//
//   * **neither applies inside a lens.** A reader who has focused has already
//     said what they want to see, and a focus that then hid half its own
//     answer would be the atlas arguing with them;
//   * **neither may take away what the reader is holding.** The selected
//     event, the walked chain, an open actor's events, an open narrative's
//     walk — `held` is `emphasis.js`'s own answer, so walking to a hidden
//     event brings it into the picture, which is what makes this a filter
//     and not a deletion;
//   * **neither is on any other view.** The map and the timeline draw the
//     whole corpus as they did: an event the graph does not organise is still
//     an event that happened somewhere on a day.
export function organises(atlas, event, state, held = null) {
  if (held?.has(event.id)) return true;
  if (state.tops && event.parent) return false;
  return degreeOf(atlas, event.id) >= (state.degree ?? 0);
}

// `held` is what the reader is holding — the graph's own `alone` set, which
// it has already had to build to draw. It is passed in rather than asked for
// here because `workingSet` runs the convergence query and this is called on
// every render; the view computes it once and gives it to both.
// `shown` is what the view draws at all — the lens narrowed by the category
// toggles still on, from `workingSet` (emphasis.js). Given rather than asked
// for, like `held` and for the same reason. `null` is a caller with nothing to
// narrow by, and then the lens alone decides, as it did before the glyph run.
export function arrangementOf(atlas, state, held = null, shown = undefined) {
  const view = lensView(atlas, state);
  const lens = view?.shown ?? null;
  const drawable = shown === undefined ? lens : shown;
  const kept = drawable ? atlas.activeEvents.filter((e) => drawable.has(e.id)) : atlas.activeEvents;
  // Inside a lens the reader has already said what they want; outside it the
  // graph draws what organises other events (`organises` above).
  const all = view ? kept : kept.filter((e) => organises(atlas, e, state, held));
  // **Every one of them, whatever the window says** (M76). From H4b until this
  // milestone the arrangement was the window and one period either side, and
  // what fell outside it was not faded but absent — the reader moved the band
  // to see another century. The owner, 21 September: *"I think the graph can
  // always show all dates, then one can zoom in and out and pan to look at
  // different times."* Zoom and pan are M61's and already do that, so the
  // window has nothing left to decide here: what is laid out is what is drawn,
  // and what is drawn is `shown`.
  //
  // What H4b was buying — not laying out thirty thousand events to draw a
  // decade of them — is bought instead by `shown` itself, which since M65 is
  // the main events at rest and the lens when there is one, and by I6's cull,
  // which puts in the DOM only what falls inside the rectangle on screen.
  const events = all;
  // And the lanes are chosen over everything drawn, not over the window: which
  // lane an event goes in is the heaviest of its actors *among the lanes on
  // screen*, weighted inside a window (lanes.js) — so a window passed here
  // would have the band silently reordering a picture that no longer obeys it.
  const lanes = state.group === 'none' ? [] : lanesFor(state.group, atlas, null, lens, state.lanes);
  return {
    events,
    lanes,
    key: arrangementKey(state, events, lanes, lens, '', view ? formatFoci(view.foci) : null),
  };
}

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
import { shardsArrived } from '../render-key.js';
import { timeAxis } from './layout.js';
import { extent } from '../util/dates.js';

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
// Membership, not the lane ids. It has nothing left to say since M77 — the
// graph has no lanes at all and `lanes` is always empty — and it is kept
// rather than deleted because `layoutGraph` still takes lanes and this is the
// key that would have to see them again if anything ever passed some.
//
// **The grouping is no longer part of the key** (M77): there is one
// arrangement of the lanes and it is the only one there has ever been a
// default for.
//
// **The band is no longer part of the key** (M76). It was, from H4b until this
// milestone, because the arrangement was laid out over the window and one
// period either side of it and a reader who moved the band was looking at a
// different set of events. The owner, 21 September: *"I think the graph can
// always show all dates, then one can zoom in and out and pan to look at
// different times."* So the graph lays out every event it draws, whatever the
// window says, and moving the band moves no node at all — which is what
// panning, zooming, selecting and walking already promised.
//
// **And the attribute shards, inside a lens** (M83, A1-2). Since this milestone
// a node stands at the day inside its year where the record gives one, and a
// `when` with its day in it is an attribute: it arrives with its century, after
// the picture. An arrangement laid out before the shard landed is an
// arrangement of years, and the key has to say which it is or the layout of
// years stands for as long as the question does — which, for a reader who
// arrives on a link with a war already open, is for ever.
//
// **Only inside a lens**, because at rest the promise is the stronger one. M76:
// moving the band moves no node at all, and moving the band is what fetches a
// century. A resting arrangement that re-laid itself out every time a shard
// landed would be the window deciding the picture again, by the back door and
// a second late. At rest a day is sub-pixel anyway — the axis is centuries
// wide — so there is nothing to buy there; inside a six-year lens it is the
// whole of A1-2. And inside a lens a late file already re-answers the picture:
// an actor's grounds, a source's citers and a narrative's steps all change what
// `lensView` keeps after the state has stopped moving.
//
// It is the same integer every view's render key carries (`shardsArrived`,
// render-key.js), read by the caller and passed in — this file has no atlas.
export function arrangementKey(state, events, lanes, lens, holding = '', foci = null, shards = 0) {
  const focus = lens === null ? '' : (foci ?? state.focus ?? '');
  // What the graph draws, when it is the graph deciding: inside a lens the
  // filter is off and two states that differ only in it are one picture.
  const filters = lens === null ? `${state.degree ?? 0}` : '';
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
  return `${focus}|${filters}|${layers}|${lanes.map((l) => l.id).join(',')}|${membership}|${holding}|${shards}`;
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
// One filter: at least `degree` active links.
//
// There were two until M83 (B10). "Top level only" was the other, and M65 took
// its lever: this is applied to `shown`, which at rest is the resting picture —
// the events that are part of nothing the atlas is drawing — so a second filter
// for "has no parent at all" differed from it only for an event whose sole
// parents are retracted or missing, and over the corpus of 22 September that is
// no event at all. It was off inside a lens by rule. What is left is the floor.
//
// Three rules hold it honest:
//
//   * **it does not apply inside a lens.** A reader who has focused has already
//     said what they want to see, and a focus that then hid half its own
//     answer would be the atlas arguing with them;
//   * **it may not take away what the reader is holding.** The selected
//     event, the walked chain, an open actor's events, an open narrative's
//     walk — `held` is `emphasis.js`'s own answer, so walking to a hidden
//     event brings it into the picture, which is what makes this a filter
//     and not a deletion;
//   * **it is on no other view.** The map and the timeline draw the whole
//     corpus as they did: an event the graph does not organise is still an
//     event that happened somewhere on a day.
export function organises(atlas, event, state, held = null) {
  if (held?.has(event.id)) return true;
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
// **A ring node stands on its own date or it is not drawn** (M83, A1-1).
//
// A lens is laid out on its own time axis since M81 — the extent of the events
// the lens itself names — and the ring around it is drawn where its own dates
// put it, which for a six-year war is mostly nowhere: the causes forty years
// upstream and the consequences two years down are off the width, and what the
// owner saw of them was a row of hollow circles pinned along the edge of the
// picture with no year a reader could read them at.
//
// So a node the lens merely reaches is kept when the axis holds its date and
// dropped when it does not. The two halves of the lens itself are never
// dropped — they are what the axis was built from — and neither is anything
// the reader is holding, which is the rule every other filter on this picture
// obeys: walking to an event brings it into the picture rather than out of it.
//
// Where the lens has no extent of its own — one event chosen, one date — the
// axis falls back to the extent of everything drawn (`timeAxis`), so nothing
// is outside it and nothing is dropped. That is the same rule read honestly
// and not a case.
function onTheAxis(events, view, held) {
  if (!view) return events;
  const axis = timeAxis(events, view.kept);
  if (!axis) return events;
  const { min, max } = axis.extent;
  return events.filter((event) => {
    if (view.kept.has(event.id) || held?.has(event.id)) return true;
    const year = extent(event.when).min;
    return Number.isFinite(year) && year >= min && year <= max;
  });
}

export function arrangementOf(atlas, state, held = null, shown = undefined) {
  const view = lensView(atlas, state);
  const lens = view?.shown ?? null;
  // `shown` is a set on every frame since M65 (emphasis.js), and the one caller
  // that leaves it out is a test asking what the lens alone keeps; only that
  // case can be null, and it means the whole corpus (M83, B12).
  const drawable = shown === undefined ? lens : shown;
  const kept = drawable ? atlas.activeEvents.filter((e) => drawable.has(e.id)) : atlas.activeEvents;
  // Inside a lens the reader has already said what they want; outside it the
  // graph draws what organises other events (`organises` above).
  const all = onTheAxis(view ? kept : kept.filter((e) => organises(atlas, e, state, held)), view, held);
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
  // And there are no lanes at all, ever (M77). The graph's bands were the
  // grouping's, and the grouping is gone; what the layout is given is one
  // unnamed field, which is what `none` — the default and what the atlas
  // always opened on — always gave it.
  const lanes = [];
  return {
    events,
    lanes,
    // **What the lens itself names**, or null at rest, which since M81 is what
    // the time axis is built from: the domain is those events' own extent, so
    // a six-year war opened is its parts across the width rather than inside a
    // hundredth of it. `kept` and not `shown` — the ring is context and is
    // drawn where its own dates put it, which may be off the width entirely;
    // stretching the axis to reach a cause forty years upstream would give the
    // question back the sliver it was asked to get out of. The camera knows
    // this already: it offers the whole picture first and the lens's own half
    // as the fallback (frame.js, M74), and the fallback is what a ring this
    // wide leaves it.
    //
    // Said here rather than asked again of `lensView` by the caller, because
    // the answer has to be the one this arrangement was built from: the domain
    // and the set of events are one picture.
    lens: view ? view.kept : null,
    key: arrangementKey(state, events, lanes, lens, '', view ? formatFoci(view.foci) : null, view ? shardsArrived(atlas) : 0),
    // **The same key without the shards**: what the reader *asked*, as against
    // what has arrived since they asked it. A century landing changes where a
    // node stands (the day inside its year, A1-2) and changes no question, so
    // the layout is rebuilt and the camera is not — a picture that reframed
    // itself under a reader who had panned into it would be the atlas moving
    // the drawing for a reason nobody could see. `graph-view.js`'s camera is
    // the one caller (M83).
    question: arrangementKey(state, events, lanes, lens, '', view ? formatFoci(view.foci) : null),
  };
}

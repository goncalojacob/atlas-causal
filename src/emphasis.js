// What the reader is working with, once.
//
// The map, the timeline and the graph each drew the same idea — the events
// this reader is holding, which may never be faded out of the picture and may
// never be swallowed by a cluster — and each assembled it differently: the
// graph added the convergence branches and the lens's own events, the map
// added the endpoints of the consequence lines, the timeline used a smaller
// set for the viewport's exemption (health review A, finding 27). M25's brief
// said there should be one place where "a cluster never swallows the chain"
// is true; `cluster.js` is that place for *how* it is done, and this file is
// that place for *what* it is done to. A fourth picture — the Why mode the
// plan reserves — is a fourth reader of this function and not a fourth copy.
//
// Pure: the atlas and a state in, eight sets of ids out. Nothing here knows
// the DOM, and every part of it was already a pure function somewhere else;
// what this file adds is that they are asked together and answered the same
// way for every view.
//
// **The lens applies to all of it.** A lens removes rather than dims, and it
// removes from everything: the marks, the lines of the chain, the actor's
// emphasis and the horizon's reachable set alike (lens.js, and the comment
// the map has carried since M14). An event kept out by the filter and let
// back in through the walked path would be an event the lens says is not
// there, drawn. The map already did this and the other two views did not have
// to, because each filtered its own event list first; doing it here means
// they cannot come to disagree.

import { chainEdges } from './chain.js';
import { convergence } from './graph.js';
import { horizonSet, SHOWN } from './horizon.js';
import { narrativeSet } from './narrative.js';
import { lensView, restingSet } from './lens.js';
import { categoriesOn } from './categories.js';

// The eight sets, and what each one is:
//
//   selected      the open event, if there is one and the lens keeps it
//   path          the events at the ends of the walked chain
//   consequences  the events the selected event leads to directly
//   chosen        the two ends of the link the reader has open (`?edge=`), or
//                 empty; a link is not a lens and narrows nothing, and its two
//                 ends are something the reader is holding all the same
//   converging    the other branches that fed it, the convergence query's own
//                 answer, computed exactly as the panel computes it
//   pathIds       the walked path and the selected event as one set, which is
//                 what a mark is drawn madder by
//   walkedEdges   the walked chain as edge objects, filtered to `shown`
//   consequenceEdges  the selected event's outgoing links, likewise
//   convergingEdges   the edges those other branches fed the target through
//   actor         the events of the actor whose card is open
//   narrative     the whole of an open narrative's walk, not only the step
//                 the reader has got to
//   reachable     what the selected event had led to by the horizon year, as
//                 a Map<id, depth> rather than a Set: the depth is what fades
//                 a mark, and dropping it would cost the view the band
//   lens          the events a lens draws at all — the focus set and its
//                 direct neighbours — or null when there is no lens
//   lensNear      the neighbours alone, which are the ones drawn dimmed
//   lensFocus     the focus set alone, or null when there is no lens
//   shown         what a view draws at all: the lens — or, with no lens, the
//                 resting picture of the main events (M65) — narrowed by the
//                 category toggles still on. Never null: there is always a
//                 picture, and at rest it is smaller than the corpus.
//                 The three views filter their event list by this and not by
//                 `lens`, which stays the reader's own question
//
// `held` is the union of the first six plus the narrative's walk — everything
// the reader is holding, which is the set a cluster may never swallow and the
// map's viewport may never take away. `reachable` is deliberately not in it:
// a reachable event is drawn wherever it falls, but forty of them in Lisbon
// still join one cluster or they are forty circles on one point.
// **Once per state change, not once per view.** The three views each asked
// for this and each paid for the convergence query and the horizon's walk
// again (health review A, finding 12; B, finding 22); the graph view had
// already noticed and kept its own answer by the state it was given. The
// store hands every subscriber the *same* state object and replaces it only
// in `set`, so that object is the key: while it stands, the answer stands.
// Weakly, so the state the reader has left takes its answer with it.
//
// It is a cache and not a memo of a pure function of two arguments: a state
// mutated in place would keep the answer it had before, and nothing mutates
// one — `state.js` replaces.
const held = new WeakMap();

export function workingSet(atlas, state) {
  // **The lens is asked first, and its answer is part of the key.** Two
  // things the lens depends on arrive *after* the state does — a source's
  // citer rows, and since M48 a narrative's steps, which are an attribute and
  // come with their century — and `lensView` already knows to answer again
  // when they do (lens.js, `stamp`). This cache did not: the state object is
  // the same object, so the first answer stood for ever and the walk was
  // drawn over the whole corpus however often the views redrew. Comparing the
  // lens itself costs a memoised call and cannot come apart from it, where a
  // stamp of its own here would be the same knowledge written twice.
  const view = lensView(atlas, state);
  const found = held.get(state);
  // The atlas is compared as well as the state, because a test builds several
  // and could hand two of them one state literal.
  if (found && found.atlas === atlas && found.view === view) return found.value;
  const value = assemble(atlas, state, view);
  held.set(state, { atlas, view, value });
  return value;
}

function assemble(atlas, state, view) {
  const lens = view?.shown ?? null;
  // The category filter, applied exactly where the lens is and nowhere else
  // (review of the map block, F6). A toggle that narrowed the map alone would
  // leave the timeline drawing the bars and the corner counting the events it
  // had just taken away; written here, the three views and the count narrow
  // together, and every set below is already filtered by it.
  //
  // An event with no category is removed by no category token: the bare
  // `events` means every category *and* the events that have none, and turning
  // one category off says nothing about a record that has none (M30b, A11;
  // glyphs-brief, §4).
  const categories = categoriesOn(state.layers);
  const inCategory = (id) => {
    if (!categories) return true;
    const category = atlas.events.get(id)?.category;
    return typeof category !== 'string' || categories.has(category);
  };
  // What a view draws at all: the lens's own set, narrowed by the categories
  // still on. `lens` itself stays what it was — a lens is a question the reader
  // asked about a neighbourhood, and the graph draws what it kept one event to
  // a node (heldSet, `lens: true`), which a category filter over the whole
  // corpus is not.
  //
  // **And with no lens at all it is the resting picture and not the corpus**
  // (M65). At rest a view draws the main events alone — what is part of
  // something else is inside it and is drawn when the reader opens it. So
  // `shown` is a set on every frame now, where it used to be `null` for "draw
  // everything"; the three views and the masthead's count already read it, so
  // they rest on the same smaller picture without one of them being told.
  const shown = new Set([...(lens ?? restingSet(atlas, state))].filter(inCategory));
  const kept = (id) => shown.has(id);
  const filter = (ids) => new Set([...ids].filter(kept));

  const walked = chainEdges(atlas, state.chain ?? [])
    .filter((e) => kept(e.from) && kept(e.to));
  const path = new Set(walked.flatMap((e) => [e.from, e.to]));

  const selected = new Set();
  if (state.selected && kept(state.selected)) selected.add(state.selected);

  const outgoing = (state.selected ? (atlas.adjacency.out.get(state.selected) ?? []) : [])
    .filter((e) => kept(e.from) && kept(e.to));
  const consequences = new Set(outgoing.flatMap((e) => [e.from, e.to]));

  // **The two ends of the link the reader has open** (M83, B7). `?edge=` is a
  // record being read, so its ends are something the reader is holding: they
  // may not be swallowed by a cluster and may not be taken away by a box or a
  // band, exactly as the selected event's consequences may not. It narrows
  // nothing — a link is not a lens (M80) — and `keptRegardless` is what keeps
  // the two in the picture at all; this is what keeps them each a mark of their
  // own once they are.
  const chosenEdge = state.edge ? atlas.edges.get(state.edge) : null;
  const chosen = new Set(chosenEdge && chosenEdge.status === 'active'
    && kept(chosenEdge.from) && kept(chosenEdge.to)
    ? [chosenEdge.from, chosenEdge.to] : []);

  // The walked path is what the convergence query excludes, and it excludes
  // that only: see the note in CLAUDE.md about why the wider exclusion always
  // returned empty.
  //
  // **Run once for both halves** (M85, B13). A branch carries its event *and*
  // the edge that fed the target (graph.js), and the graph view used to run the
  // whole query a second time to take the edges out of it — the same walk, the
  // same exclusion, on every render. One call, two sets, and the picture and
  // the panel's list cannot come to disagree about which branches those are.
  const converging = new Set();
  const convergingEdges = new Set();
  if (state.selected && atlas.events.has(state.selected)) {
    const walkedIds = new Set(path);
    if (state.selected) walkedIds.add(state.selected);
    for (const branch of convergence(atlas.adjacency, state.selected, [...walkedIds])) {
      if (kept(branch.event.id)) converging.add(branch.event.id);
      if (branch.edge) convergingEdges.add(branch.edge.id);
    }
  }

  // Through resolve(), so a former id in the URL emphasises the same actor
  // the panel is showing.
  const resolved = state.actor ? atlas.resolve(state.actor) : null;
  const actor = resolved && resolved.kind === 'actor'
    ? filter(new Set((atlas.eventsByActor.get(resolved.id) ?? []).map((a) => a.event.id)))
    : null;

  // Since M48 a narrative *is* the lens (lens.js), so the walk is inside the
  // focus set by construction and the filter can only ever take a step away
  // for a reason the reader set themselves: a category switched off, or a
  // `?focus=` of their own that the walk runs outside of. Filtered like the
  // actor's set beside it, so that nothing is emphasised that no view draws.
  const narrative = narrativeSet(atlas, state);

  const reachable = horizonSet(atlas, state);

  return {
    selected,
    path,
    consequences,
    chosen,
    converging,
    // ─── and the four the three views used to rebuild (M85, B13) ───────────
    //
    // Each of these was composed identically in `map.js`, `timeline.js` and
    // `graph-view.js`, out of what this function had already computed and
    // thrown away. They are answers and not new work: `walked` and `outgoing`
    // are the edge objects whose ids `path` and `consequences` already carry,
    // `pathIds` is the union every view took, and `convergingEdges` is the
    // other half of the query above.
    //
    // A selected event is on the path it is the head of, which is what makes
    // its mark madder rather than merely ringed.
    pathIds: new Set([...path, ...selected]),
    // The two lists of *edges*, which are lines and not marks: already
    // filtered to what the view draws, as everything else here is.
    walkedEdges: walked,
    consequenceEdges: outgoing,
    convergingEdges,
    actor,
    narrative: narrative ? filter(narrative) : null,
    reachable: new Map([...reachable].filter(([id]) => shown.has(id))),
    lens,
    // What each view filters its event list by: the lens, or the resting
    // picture where there is none, and the categories over either.
    shown,
    // The half of the lens that is drawn faintly: the direct causes and
    // consequences of the focus set, which are in the picture so that a
    // neighbourhood does not look like an atlas in which nothing else
    // happened, and dimmed so that nobody mistakes them for what was asked
    // for (lens.js). Empty when there is no lens: there is nothing to dim.
    lensNear: view?.near ?? new Set(),
    lensFocus: view?.set ?? null,
  };
}

// Everything the reader is holding, as one Set. The three views ask for this
// and not for the parts, except where they draw one part differently from
// another — the map's chain lines, the graph's converging marks.
export function heldSet(working, { lens = false, reachable = false } = {}) {
  const ids = new Set();
  for (const set of [working.selected, working.path, working.consequences,
    working.chosen ?? new Set(), working.converging]) {
    for (const id of set) ids.add(id);
  }
  if (working.actor) for (const id of working.actor) ids.add(id);
  if (working.narrative) for (const id of working.narrative) ids.add(id);
  // A lens has already taken everything else away; what it kept is what the
  // reader asked to see, and the graph draws it one event to a node.
  if (lens && working.lens) for (const id of working.lens) ids.add(id);
  // An answer to "what did this lead to by 2011" that the time band had
  // hidden would not be an answer, so the map keeps the reachable set drawn —
  // drawn is not the same as alone, and it says which it means.
  //
  // **Capped at what the panel lists** (health review B, finding 22). With a
  // horizon open on an early event the reachable set is most of the corpus,
  // and holding all of it out of the stacks meant nothing stacked at all —
  // fifty-six thousand marks on their own at a hundred thousand events. The
  // answer is ordered by depth and then by year (graph.js), so the first
  // `SHOWN` of it are exactly the rows the panel offers to walk to, and a
  // reader cannot aim at the rest without opening them first.
  if (reachable) {
    let left = SHOWN;
    for (const id of working.reachable.keys()) {
      if (left <= 0) break;
      ids.add(id);
      left -= 1;
    }
  }
  return ids;
}

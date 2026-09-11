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
import { lensView } from './lens.js';

// The eight sets, and what each one is:
//
//   selected      the open event, if there is one and the lens keeps it
//   path          the events at the ends of the walked chain
//   consequences  the events the selected event leads to directly
//   converging    the other branches that fed it, the convergence query's own
//                 answer, computed exactly as the panel computes it
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
  const found = held.get(state);
  // The atlas is compared as well as the state, because a test builds several
  // and could hand two of them one state literal.
  if (found && found.atlas === atlas) return found.value;
  const value = assemble(atlas, state);
  held.set(state, { atlas, value });
  return value;
}

function assemble(atlas, state) {
  const view = lensView(atlas, state);
  const lens = view?.shown ?? null;
  const kept = (id) => !lens || lens.has(id);
  const filter = (ids) => new Set([...ids].filter(kept));

  const walked = chainEdges(atlas, state.chain ?? [])
    .filter((e) => kept(e.from) && kept(e.to));
  const path = new Set(walked.flatMap((e) => [e.from, e.to]));

  const selected = new Set();
  if (state.selected && kept(state.selected)) selected.add(state.selected);

  const outgoing = (state.selected ? (atlas.adjacency.out.get(state.selected) ?? []) : [])
    .filter((e) => kept(e.from) && kept(e.to));
  const consequences = new Set(outgoing.flatMap((e) => [e.from, e.to]));

  // The walked path is what the convergence query excludes, and it excludes
  // that only: see the note in CLAUDE.md about why the wider exclusion always
  // returned empty.
  const converging = new Set();
  if (state.selected && atlas.events.has(state.selected)) {
    const walkedIds = new Set(path);
    if (state.selected) walkedIds.add(state.selected);
    for (const branch of convergence(atlas.adjacency, state.selected, [...walkedIds])) {
      if (kept(branch.event.id)) converging.add(branch.event.id);
    }
  }

  // Through resolve(), so a former id in the URL emphasises the same actor
  // the panel is showing.
  const resolved = state.actor ? atlas.resolve(state.actor) : null;
  const actor = resolved && resolved.kind === 'actor'
    ? filter(new Set((atlas.eventsByActor.get(resolved.id) ?? []).map((a) => a.event.id)))
    : null;

  // A narrative suspends the lens, so there is nothing to filter out of it.
  const narrative = narrativeSet(atlas, state);

  const reachable = horizonSet(atlas, state);

  return {
    selected,
    path,
    consequences,
    converging,
    actor,
    narrative,
    reachable: lens ? new Map([...reachable].filter(([id]) => lens.has(id))) : reachable,
    lens,
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
  for (const set of [working.selected, working.path, working.consequences, working.converging]) {
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

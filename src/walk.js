// The walk the atlas assembles, and the provenance that says it did.
//
// A reader arrives with a question rather than an event — *why is Angola
// poor?* — and the answer the atlas can give is a path into the endpoint they
// asked about (plan decision 11). Clicking that path out by hand is what the
// three views already let them do; this file is the same walk, produced in one
// call, so that the Why mode (M35) has something to draw.
//
// Pure, and it adds no traversal of its own. `shortestPaths` and `pathTo`
// (graph.js) are the path, `pathCost` is which of several is best, `subgraph`
// is what surrounds it. That is deliberate and is the whole discipline of this
// file: `shortestPaths` stays by hops (plan decision 6), so the chain a reader
// is handed here is the same chain they would have walked for the same clicks.
// A producer that ranked its own traversal would hand them a different
// argument and call it the shortest one.
//
// **Nothing here is a record.** A walk lives in the session, is held beside
// the state (state.js) and never enters `data/`: a stitched path is itself a
// claim, and an unsigned claim does not join the corpus (plan decision 7,
// D13). It is not written to a file, it is not a narrative — a narrative is
// signed prose somebody wrote — and `origin.tool` gains no `generated` value
// for it, because `origin` says who created a *record* and this is not one.
//
// The prose it carries is the reader's own question and a day. No sentence of
// history is composed here; every step is an edge somebody wrote, with its
// confidence and its dispute marks unchanged, which is exactly what the line
// on the card says (panel/event.js).

import { shortestPaths, pathTo, pathCost, subgraph } from './graph.js';

// Where a question starts, in the order the state answers it: the event the
// reader's own walk began at, then the one they have open. Both are records
// they are holding; neither is a guess.
//
// The lens is deliberately not among them. `?focus=` says which events exist
// for the views, not where an argument begins, and a walk is not an opening
// and not a lens — the same reason `LAYERS`, `GROUPS` and `OPENINGS` gain no
// member for it.
export function walkStarts(atlas, state = {}) {
  const starts = [];
  const add = (id) => {
    const event = id ? atlas.events?.get(id) : null;
    if (event && event.status === 'active' && !starts.includes(id)) starts.push(id);
  };
  const first = (state.chain ?? [])[0];
  if (first) add(atlas.edges?.get(first)?.from);
  add(state.selected);
  return starts;
}

// The day a walk was put together, as a bare date. The hour is not carried:
// what the line on the card owes the reader is that this path was assembled
// and when, not a timestamp precise enough to identify their session.
const dayOf = (now) => new Date(now).toISOString().slice(0, 10);

// A walk with no steps still has a provenance, because the card still has to
// say who was asked and what they answered. `reason` is why there are none.
function nothing(target, question, on, reason) {
  return Object.freeze({
    target,
    from: null,
    steps: Object.freeze([]),
    events: Object.freeze([]),
    reason,
    provenance: Object.freeze({ by: 'atlas', question, on, steps: Object.freeze([]) }),
  });
}

// The walk to `target` from wherever the question starts: an ordered list of
// edge ids, the events along it, and the provenance beside them.
//
// Of the paths from the candidate starts, the one that costs least — the
// confidence of its steps before their type (graph.js) — then the shortest,
// then the first by its own ids, so that two calls with the same arguments
// answer the same walk on every machine.
//
// `now` is an argument and not a clock read here: a producer that reads the
// time is a producer whose answer cannot be compared with itself.
export function walkTo(atlas, target, state = {}, { question = null, now = Date.now() } = {}) {
  const on = dayOf(now);
  const event = target ? atlas.events?.get(target) : null;
  const asked = question ?? `Why ${event?.title ?? target ?? 'this'}?`;
  if (!event || event.status !== 'active') return nothing(target ?? null, asked, on, 'no-target');

  const starts = walkStarts(atlas, state);
  if (starts.length === 0) return nothing(target, asked, on, 'no-start');
  // Standing on the endpoint is not a question the atlas can walk an answer
  // to, and it is not a failure either: the reader is already there.
  if (starts.includes(target)) return nothing(target, asked, on, 'arrived');

  let best = null;
  for (const from of starts) {
    const edges = pathTo(shortestPaths(atlas.adjacency, from), target);
    if (edges.length === 0) continue;
    const candidate = { from, edges, cost: pathCost(edges) };
    if (!best || better(candidate, best)) best = candidate;
  }
  if (!best) return nothing(target, asked, on, 'no-path');

  const steps = Object.freeze(best.edges.map((edge) => edge.id));
  const events = Object.freeze([best.from, ...best.edges.map((edge) => edge.to)]);
  return Object.freeze({
    target,
    from: best.from,
    steps,
    events,
    reason: null,
    provenance: Object.freeze({ by: 'atlas', question: asked, on, steps }),
  });
}

function better(a, b) {
  if (a.cost !== b.cost) return a.cost < b.cost;
  if (a.edges.length !== b.edges.length) return a.edges.length < b.edges.length;
  return a.edges.map((e) => e.id).join() < b.edges.map((e) => e.id).join();
}

// What surrounds a walk: the neighbourhood of the events along it, whole —
// the events, the edges between them, the actors they name and the relations
// between those actors (graph.js). One answer rather than four walks, which is
// what `subgraph` exists for and what the Why mode will lay out by depth.
export function walkContext(atlas, walk, depth = 1) {
  return subgraph(atlas, walk?.events ?? [], depth);
}

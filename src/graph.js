// Traversal over the topology: consequences, ancestors, convergence, and
// what an event led to by a given year. Pure functions over an adjacency
// object; nothing here knows the DOM or how files are loaded. Results are
// ordered by edge type, then confidence, then id, so the panel never depends
// on file order.

import { extent } from './util/dates.js';
import { EDGE_TYPE_IDS } from './vocab.js';

// The order an answer list is sorted in is the order the types are declared
// in (vocab.js): the strongest claim first, the loosest last.
export const TYPE_ORDER = EDGE_TYPE_IDS;
export const CONFIDENCE_ORDER = Object.freeze(['consensus', 'probable', 'disputed']);

function rank(list, value) {
  const i = list.indexOf(value);
  return i < 0 ? list.length : i;
}

export function compareEdges(a, b) {
  return rank(TYPE_ORDER, a.type) - rank(TYPE_ORDER, b.type)
    || rank(CONFIDENCE_ORDER, a.confidence) - rank(CONFIDENCE_ORDER, b.confidence)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// Only active edges between active events are walkable. Merged and
// retracted records stay in the maps so ids keep resolving, but they carry
// no edges (the validator guarantees it; this filters defensively).
export function buildAdjacency(events, edges) {
  const eventById = new Map(events.map((e) => [e.id, e]));
  const edgeById = new Map();
  const out = new Map();
  const inc = new Map();
  for (const id of eventById.keys()) {
    out.set(id, []);
    inc.set(id, []);
  }
  for (const edge of edges) {
    edgeById.set(edge.id, edge);
    if (edge.status !== 'active') continue;
    const from = eventById.get(edge.from);
    const to = eventById.get(edge.to);
    if (!from || !to || from.status !== 'active' || to.status !== 'active') continue;
    out.get(edge.from).push(edge);
    inc.get(edge.to).push(edge);
  }
  for (const list of out.values()) list.sort(compareEdges);
  for (const list of inc.values()) list.sort(compareEdges);
  return { events: eventById, edges: edgeById, out, in: inc };
}

// Direct consequences: [{ edge, event }] for every active outgoing edge.
export function consequences(adj, id) {
  return (adj.out.get(id) ?? []).map((edge) => ({ edge, event: adj.events.get(edge.to) }));
}

// Direct antecedents: [{ edge, event }] for every active incoming edge.
export function antecedents(adj, id) {
  return (adj.in.get(id) ?? []).map((edge) => ({ edge, event: adj.events.get(edge.from) }));
}

function reach(adj, id, direction) {
  const seen = new Set();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift();
    for (const edge of adj[direction].get(current) ?? []) {
      const next = direction === 'out' ? edge.to : edge.from;
      if (seen.has(next) || next === id) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

export function ancestors(adj, id) {
  return reach(adj, id, 'in');
}

export function descendants(adj, id) {
  return reach(adj, id, 'out');
}

// The start of an event's interval, astronomical, which is the only
// numbering years may be compared in (dates.js). A record whose interval
// will not parse sorts last rather than throwing: the validator's business,
// not the panel's.
function startOf(event) {
  try {
    return extent(event.when).min;
  } catch {
    return Infinity;
  }
}

// Breadth-first from `id` over active edges: Map<event id, { depth, edge,
// from }>, the tree of shortest paths outward. Breadth-first is what makes
// the first arrival the shortest one in hops; where two paths of the same
// length arrive, the earlier predecessor wins, then the smaller id, then the
// edge's own order — so the tree is one tree on every machine and the chain
// a reader is handed is the same chain twice running.
export function shortestPaths(adj, id) {
  const best = new Map();
  let frontier = [id];
  let depth = 0;
  while (frontier.length) {
    const next = new Map();
    depth += 1;
    for (const current of frontier) {
      for (const edge of adj.out.get(current) ?? []) {
        const to = edge.to;
        if (to === id || best.has(to)) continue;
        const candidate = { depth, edge, from: current };
        const standing = next.get(to);
        if (!standing || better(candidate, standing)) next.set(to, candidate);
      }
    }
    for (const [to, entry] of next) best.set(to, entry);
    frontier = [...next.keys()].sort();
  }
  return best;

  function better(a, b) {
    const ya = startOf(adj.events.get(a.from));
    const yb = startOf(adj.events.get(b.from));
    if (ya !== yb) return ya < yb;
    if (a.from !== b.from) return a.from < b.from;
    return compareEdges(a.edge, b.edge) < 0;
  }
}

// The edges of the shortest path from the event `shortestPaths` was called
// on to `target`, in order. Empty when the target is that event itself or is
// not reachable from it.
export function pathTo(best, target) {
  const edges = [];
  let current = target;
  while (best.has(current)) {
    const step = best.get(current);
    edges.push(step.edge);
    current = step.from;
  }
  return edges.reverse();
}

// "What did this lead to by year X?" Every event reachable downstream from
// `id` whose interval has begun by `horizon` — `start.min ≤ horizon`,
// astronomical, the same lenient bound the arrow of time and the window use
// — each with the shortest path to it, the first step of that path, and
// whether any step of it is disputed.
//
// The horizon cuts the *answer*, not the walk: reachability is explored in
// full and the year is applied to what it found. Under the arrow of time the
// years along a path mostly rise, but a start written as { min, max } can
// dip below its own antecedent's, and a walk that stopped at the first event
// past the horizon would silently drop what lies beyond it.
//
// Ordered by path length, then by year, then by id, which is the order the
// question is asked in: what did this lead to first, and how soon.
export function reachableBy(adj, id, horizon) {
  const best = shortestPaths(adj, id);
  const results = [];
  for (const [eventId, step] of best) {
    const event = adj.events.get(eventId);
    if (!event || event.status !== 'active') continue;
    if (startOf(event) > horizon) continue;
    const edges = pathTo(best, eventId);
    results.push({
      event,
      depth: step.depth,
      edges,
      first: edges[0] ?? null,
      last: edges[edges.length - 1] ?? null,
      disputed: edges.some((e) => e.confidence === 'disputed'),
    });
  }
  results.sort((a, b) => a.depth - b.depth
    || startOf(a.event) - startOf(b.event)
    || (a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0));
  return results;
}

// The convergence query. Given the target and the path the user walked
// (event ids, target included), every ancestor of the target that is not
// on the walked path, each with the edge by which it feeds the way to the
// target and the depth at which it was met.
//
// Only the walked path is excluded, not everything descending from the
// starting event: that wider exclusion always returned empty, because in a
// connected graph nearly every node descends from the oldest one
// (CONTEXT.md). Traversal passes through path nodes, so a branch feeding
// the middle of the path is reported too. Do not "simplify" this back.
export function convergence(adj, target, path = []) {
  const excluded = new Set([...path, target]);
  const seen = new Set([target]);
  const results = [];
  const queue = [{ id: target, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift();
    for (const edge of adj.in.get(id) ?? []) {
      const source = edge.from;
      if (seen.has(source)) continue;
      seen.add(source);
      if (!excluded.has(source)) {
        results.push({ event: adj.events.get(source), edge, to: adj.events.get(id), depth: depth + 1 });
      }
      queue.push({ id: source, depth: depth + 1 });
    }
  }
  results.sort((a, b) => compareEdges(a.edge, b.edge) || a.depth - b.depth);
  return results;
}

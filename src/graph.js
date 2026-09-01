// Traversal over the topology: consequences, ancestors, convergence. Pure
// functions over an adjacency object; nothing here knows the DOM or how
// files are loaded. Results are ordered by edge type, then confidence, then
// id, so the panel never depends on file order.

export const TYPE_ORDER = Object.freeze(['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired']);
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

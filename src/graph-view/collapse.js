// The semantic level of detail: an event's parts drawn inside it while the
// reader is zoomed out.
//
// M25 gave the graph a *geometric* level of detail — what is too close
// together to be told apart at this zoom is one mark with a count
// (layout.js, `stackLayout`). This is the other kind, and it runs first: two
// events are drawn as one here because one is part of the other, which is
// something the records say, and not because they happen to have landed near
// each other on the screen. The two compose — the collapse produces a node
// set and the stacking runs on that set (plan decision 4).
//
// Pure: a laid-out layout in, a laid-out layout out. Applied after
// `layoutGraph` and before `stackLayout`, so no node ever moves for it:
// a collapsed parent is drawn exactly where the parent was already placed,
// and expanding it puts its parts back where they already were.
// `arrangementKey` never sees it (arrangement.js:57-68). That key deliberately
// excludes the zoom, and a collapse inside it would lay the whole graph out
// again on every wheel notch and undo H4b.
//
// `parent` is read off the nodes' own events and nothing else is asked of the
// atlas, so this file needs no topology and no state to be tested.

import { COLLAPSE_ZOOM } from './layout.js';

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// layout: what `layoutGraph` returned. k: the zoom in force. alone: the ids
// the reader is working with, which are never folded into anything and never
// have anything folded over them — M25's never-hide rule, unchanged.
//
// Above the threshold nothing is collapsed and the very same layout object is
// returned, so the picture at a reading zoom costs nothing at all.
export function collapseLayout(layout, { k = 1, alone = null, zoom = COLLAPSE_ZOOM } = {}) {
  if (k >= zoom) return layout;

  const nodes = new Map(layout.nodes.map((node) => [node.id, node]));
  // A parent outside this arrangement — beyond the band's margin, or removed
  // by the lens — is not a parent here: there is no node to fold into.
  const parentOf = (node) => {
    const id = typeof node.event?.parent === 'string' ? node.event.parent : null;
    return id ? nodes.get(id) ?? null : null;
  };

  // Which parents may not swallow their parts: every ancestor of everything
  // the reader is holding. Walked upwards from the held nodes rather than
  // downwards from the parents, so one pass covers a subtree of any depth,
  // and with a visited set, because rule 24 refuses a cycle and a picture
  // should not hang on a file that has one anyway.
  const blocked = new Set();
  for (const node of layout.nodes) {
    if (!alone?.has(node.id)) continue;
    const seen = new Set([node.id]);
    for (let up = parentOf(node); up && !seen.has(up.id); up = parentOf(up)) {
      blocked.add(up.id);
      seen.add(up.id);
    }
  }

  // The node each node is drawn as: itself, or the highest ancestor that is
  // allowed to hold it. Nothing in `alone` is ever folded into anything, and
  // a node whose chain of parents closes on itself stands for itself — rule
  // 24 refuses that ring and `subtreeWeights` treats it the same way (M30a,
  // A11). Folding both ends of a ring into each other would draw neither.
  const targetOf = (node) => {
    if (alone?.has(node.id)) return node;
    let at = node;
    const seen = new Set([node.id]);
    for (let up = parentOf(at); up; up = parentOf(at)) {
      if (seen.has(up.id)) return node;
      if (blocked.has(up.id)) break;
      at = up;
      seen.add(up.id);
    }
    return at;
  };

  const drawnAs = new Map();
  const inside = new Map();
  for (const node of layout.nodes) {
    const target = targetOf(node);
    drawnAs.set(node.id, target.id);
    if (target.id === node.id) continue;
    if (!inside.has(target.id)) inside.set(target.id, []);
    inside.get(target.id).push(node);
  }
  // Nothing was folded: the same layout, the same object, the same cache.
  if (inside.size === 0) return layout;

  const placed = layout.nodes
    .filter((node) => drawnAs.get(node.id) === node.id)
    .map((node) => {
      const members = inside.get(node.id);
      if (!members) return node;
      members.sort((a, b) => a.year - b.year || byId(a.id, b.id));
      // The weight of the whole subtree, which the index derives for exactly
      // this (M30a, A11) and omits on every leaf. It is the weight of every
      // descendant through `parent`, which is not always the number folded
      // here — a part outside the band was never laid out — so the count
      // beside it is counted here and not read off the record: a weight is
      // not a count.
      const weight = node.event?.subtreeWeight ?? node.weight;
      return {
        ...node,
        weight,
        collapsed: {
          count: members.length,
          weight,
          members: members.map((m) => m.id),
          years: { min: members[0].year, max: members[members.length - 1].year },
        },
      };
    });

  const by = new Map(placed.map((node) => [node.id, node]));
  const edges = [];
  for (const line of layout.edges) {
    const from = by.get(drawnAs.get(line.from));
    const to = by.get(drawnAs.get(line.to));
    // A link between two events inside one parent is a link the collapsed
    // mark cannot draw: it would be a loop on itself, saying nothing.
    if (!from || !to || from === to) continue;
    edges.push({
      ...line, from: from.id, to: to.id, x1: from.x, y1: from.y, x2: to.x, y2: to.y,
    });
  }

  return { ...layout, nodes: placed, edges };
}

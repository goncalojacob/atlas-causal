// Where every node of the graph view goes. Pure: topology in, coordinates
// out, no DOM, no state — so the arrangement can be tested for the two
// things that matter about it, that it is the same every time and that it
// does not tangle the edges more than doing nothing would.
//
// x is the year, on the whole extent of the data, exactly the scale the
// timeline keeps. No force simulation: physics would put 1910 beside 2011
// and lie about time, which is the one thing this atlas may not do.
//
// y is free, and is spent on two things. First, one horizontal band per
// lane — a region, an actor, a place, whatever the grouping says (lanes.js,
// M14) — so that a group stays in one place and the eye can follow it.
// Second, inside a band, the events of the same year are spread apart and
// ordered by a barycentre pass — each node pulled towards the average
// height of the events it is linked to — so that edges come out short and
// cross each other less often.
//
// With no grouping there are no bands at all: one full-height field and the
// barycentre free to place a node wherever the links want it. That is the
// arrangement with the fewest crossings and the fewest claims, which is why
// it is the default.
//
// The sweeps are not trusted blindly: the arrangement of every sweep is
// counted, and the one with the fewest crossings wins, the naive order
// included. That is why the layout can promise never to be worse than
// doing nothing.

import { extent } from '../util/dates.js';
import { createLinearScale } from '../timeline-scale.js';
import { laneOf } from '../lanes.js';
import { clusterPoints, mergeEdges } from '../cluster.js';

export const WIDTH = 960;
export const BAND_HEIGHT = 96;
// How tall the one bandless field is, in bands: the picture keeps the height
// it had with five regions, so switching the grouping off does not resize
// the view under the reader.
const BANDLESS_BANDS = 5;
// Thirteen bands at a region's height would be a picture four screens tall.
// Past five, a band gives up height until it reaches the least a node and
// its label can be read in.
const MIN_BAND_HEIGHT = 54;
// Room over the bands for the year axis.
export const AXIS_HEIGHT = 26;
// The left gutter carries the band labels; the right one keeps the last
// year off the edge.
const GUTTER_LEFT = 88;
const GUTTER_RIGHT = 18;
// Breathing room at the top and bottom of a band, so a node never sits on
// the line between two regions.
const BAND_PAD = 12;
// The same padding the timeline puts around its domain, so both scales
// start and end at the same place and the two readings agree.
const DOMAIN_PADDING = 0.04;
// A few is enough: with columns of two to five nodes the barycentre settles
// almost immediately, and every sweep is paid for in crossing counts.
const SWEEPS = 6;
// The furthest apart two nodes of one column are placed, as a fraction of
// the band's usable height. A column of two should not span the whole band.
const MAX_GAP = 0.3;
// How close to the edge of a band a node may be pushed.
const EDGE = 0.06;

// How far the graph view zooms. The pair lives here rather than in
// graph-view.js because the merging rule and the zoom limit are one
// question, exactly as they are on the map (cluster.js): whether a stack can
// ever be pulled apart depends on how far in the reader is allowed to go.
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;
// D for the graph: two nodes closer than this at k = 1 are drawn as one.
// Derived the way the map derives its own — a little under the distance at
// which two hit targets overlap, which here is 2 × HIT_RADIUS = 16 — and so
// smaller than the map's 16, because a node in this picture is smaller than
// a mark on that one. Below it two nodes cannot both be aimed at, which is
// the honest moment to stop drawing them as two.
export const STACK_DISTANCE = 13;

// Sorting anything that feeds a floating-point sum: two runs given the same
// records in a different order must produce the same numbers, and addition
// is not commutative in binary floating point.
const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function domainOf(dataExtent) {
  if (!dataExtent) return [0, 1];
  const span = dataExtent.max - dataExtent.min;
  return [dataExtent.min - span * DOMAIN_PADDING - 1, dataExtent.max + span * DOMAIN_PADDING + 1];
}

// Do two segments cross? Proper intersection only: edges that merely share
// an endpoint are the graph doing its job, not a crossing.
function crosses(a, b) {
  if (a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to) return false;
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const d1 = side(a.p1, a.p2, b.p1);
  const d2 = side(a.p1, a.p2, b.p2);
  const d3 = side(b.p1, b.p2, a.p1);
  const d4 = side(b.p1, b.p2, a.p2);
  return d1 !== d2 && d3 !== d4 && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0;
}

// Places the nodes of one column so that they do not sit on each other,
// as near as possible to where the barycentre wants them. Ties break by id,
// then by weight, so the order never depends on the order of the input.
function resolveColumn(ids, positions, weights) {
  const order = [...ids].sort(
    (a, b) => positions.get(a) - positions.get(b) || byId(a, b) || weights.get(a) - weights.get(b),
  );
  const n = order.length;
  const out = new Map();
  if (n === 1) {
    out.set(order[0], Math.min(1 - EDGE, Math.max(EDGE, positions.get(order[0]))));
    return out;
  }
  const gap = Math.min(MAX_GAP, (1 - 2 * EDGE) / (n - 1));
  const span = gap * (n - 1);
  const mean = order.reduce((sum, id) => sum + positions.get(id), 0) / n;
  const centre = Math.min(1 - EDGE - span / 2, Math.max(EDGE + span / 2, mean));
  order.forEach((id, i) => out.set(id, centre + (i - (n - 1) / 2) * gap));
  return out;
}

// events: the events to draw, with a `when`. edges: active edges between
// them. lanes: what lanes.js gave for the current grouping, in order, each
// with its members — empty for no grouping at all. dataExtent: the atlas's
// own { min, max } in astronomical years.
export function layoutGraph({ events, edges, lanes = [], extent: dataExtent, width = WIDTH }) {
  // No grouping is one unnamed field the whole height of the picture, and
  // `hidden` is how the drawing knows not to paint a band or a label for it.
  const bandHeight = lanes.length > BANDLESS_BANDS
    ? Math.max(MIN_BAND_HEIGHT, (BANDLESS_BANDS * BAND_HEIGHT) / lanes.length)
    : BAND_HEIGHT;
  const pad = Math.min(BAND_PAD, bandHeight * 0.15);
  const bands = lanes.length === 0
    ? [{
      id: null, label: '', hidden: true, even: true,
      y0: AXIS_HEIGHT, y1: AXIS_HEIGHT + BANDLESS_BANDS * BAND_HEIGHT,
    }]
    : lanes.map((lane, i) => ({
      id: lane.id,
      label: lane.label,
      hidden: false,
      y0: AXIS_HEIGHT + i * bandHeight,
      y1: AXIS_HEIGHT + (i + 1) * bandHeight,
      even: i % 2 === 0,
    }));
  const height = bands[bands.length - 1].y1;
  const scale = createLinearScale({ domain: domainOf(dataExtent), range: [GUTTER_LEFT, width - GUTTER_RIGHT] });

  // An event with no lane would have nowhere to go. lanes.js gives every
  // shown event one, so this is a guard, not a case: it lands in the last
  // band rather than disappearing from the picture.
  const bandOf = new Map(bands.map((b) => [b.id, b]));
  const fallback = bands[bands.length - 1] ?? null;
  const list = [...events].sort((a, b) => byId(a.id, b.id));

  const nodes = new Map();
  const columns = new Map();
  for (const event of list) {
    const band = (lanes.length === 0 ? bands[0] : bandOf.get(laneOf(event, lanes)?.id)) ?? fallback;
    if (!band) continue;
    const year = extent(event.when).min;
    const node = { id: event.id, event, band, year, x: scale.x(year), weight: event.weight ?? 0, y: 0 };
    nodes.set(node.id, node);
    const key = `${band.id}|${year}`;
    if (!columns.has(key)) columns.set(key, []);
    columns.get(key).push(node.id);
  }

  const weights = new Map([...nodes].map(([id, n]) => [id, n.weight]));
  // Neighbours by id and by direction. A sweep looks only one way — back
  // along the arrows or forward along them — which is what lets it break
  // the symmetry of two chains that mirror each other; pulling on both
  // ends at once only ever moved them together.
  const before = new Map([...nodes.keys()].map((id) => [id, []]));
  const after = new Map([...nodes.keys()].map((id) => [id, []]));
  const drawnEdges = [];
  for (const edge of [...edges].sort((a, b) => byId(a.id, b.id))) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) continue;
    drawnEdges.push(edge);
    before.get(edge.to).push(edge.from);
    after.get(edge.from).push(edge.to);
  }
  for (const l of before.values()) l.sort(byId);
  for (const l of after.values()) l.sort(byId);

  const columnKeys = [...columns.keys()].sort(byId);
  const columnsByYear = new Map();
  for (const key of columnKeys) {
    const year = nodes.get(columns.get(key)[0]).year;
    if (!columnsByYear.has(year)) columnsByYear.set(year, []);
    columnsByYear.get(year).push(key);
  }
  const years = [...columnsByYear.keys()].sort((a, b) => a - b);

  const place = (positions) => {
    const out = new Map();
    for (const key of columnKeys) {
      for (const [id, p] of resolveColumn(columns.get(key), positions, weights)) out.set(id, p);
    }
    return out;
  };

  // Absolute coordinates from band-relative positions, and the crossing
  // count of the whole drawing at those coordinates.
  const absolute = (positions) => {
    const xy = new Map();
    for (const [id, node] of nodes) {
      const p = positions.get(id) ?? 0.5;
      const usable = node.band.y1 - node.band.y0 - 2 * pad;
      xy.set(id, { x: node.x, y: node.band.y0 + pad + p * usable });
    }
    return xy;
  };
  const countCrossings = (positions) => {
    const xy = absolute(positions);
    const segments = drawnEdges.map((e) => ({ from: e.from, to: e.to, p1: xy.get(e.from), p2: xy.get(e.to) }));
    let count = 0;
    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) if (crosses(segments[i], segments[j])) count += 1;
    }
    return count;
  };

  // The naive order — by id inside each column, nothing moved — is the
  // arrangement every sweep has to beat.
  let positions = new Map();
  for (const key of columnKeys) {
    const ids = [...columns.get(key)].sort(byId);
    ids.forEach((id, i) => positions.set(id, (i + 0.5) / ids.length));
  }
  positions = place(positions);
  let best = positions;
  let bestCrossings = countCrossings(positions);
  const naiveCrossings = bestCrossings;

  // Year by year, forwards then backwards. Each layer is settled against
  // the layers already moved in this sweep, as a layered drawing is
  // ordinarily built; a column is resolved the moment it is computed so
  // the next layer reads where its neighbours actually ended up.
  for (let sweep = 0; sweep < SWEEPS; sweep += 1) {
    const forward = sweep % 2 === 0;
    const near = forward ? before : after;
    const next = new Map(positions);
    for (const year of forward ? years : [...years].reverse()) {
      for (const key of columnsByYear.get(year)) {
        const wanted = new Map(next);
        for (const id of columns.get(key)) {
          const list = near.get(id);
          if (list.length === 0) continue;
          wanted.set(id, list.reduce((sum, other) => sum + (next.get(other) ?? 0.5), 0) / list.length);
        }
        for (const [id, p] of resolveColumn(columns.get(key), wanted, weights)) next.set(id, p);
      }
    }
    positions = next;
    const crossings = countCrossings(positions);
    // Strictly fewer, so the earliest arrangement wins a tie and the result
    // does not depend on how many sweeps happened to run.
    if (crossings < bestCrossings) {
      bestCrossings = crossings;
      best = positions;
    }
  }

  const xy = absolute(best);
  const placed = [...nodes.values()]
    .map((node) => ({
      id: node.id,
      event: node.event,
      lane: node.band.id,
      year: node.year,
      weight: node.weight,
      x: xy.get(node.id).x,
      y: xy.get(node.id).y,
    }))
    .sort((a, b) => a.x - b.x || byId(a.id, b.id));

  const laid = drawnEdges.map((edge) => ({
    id: edge.id,
    edge,
    from: edge.from,
    to: edge.to,
    x1: xy.get(edge.from).x,
    y1: xy.get(edge.from).y,
    x2: xy.get(edge.to).x,
    y2: xy.get(edge.to).y,
  }));

  return { width, height, bands, nodes: placed, edges: laid, scale, crossings: bestCrossings, naiveCrossings };
}

// The level of detail. `layoutGraph` above places every event once and knows
// nothing of the zoom; this reads those coordinates and says what is drawn
// at a given k — nodes closer than D / k merged into a stack, and the links
// between two stacks merged into one line. That split is the whole reason a
// stack can open without the picture moving under the reader: zooming
// changes which marks are drawn, never where a mark is.
//
// Merging is within a band and never across one: a lane is a claim about
// where a group of events belongs, and a mark straddling two of them would
// be a claim the data does not make. With no grouping there is one band and
// the rule is simply the whole picture.
//
// `alone` is the set of ids that must keep a node of their own — the
// selection, the walked chain, and everything else the reader is currently
// working with. cluster.js keeps that promise; this file only passes it on.
export function stackLayout(layout, { k = 1, alone = null, distance = STACK_DISTANCE } = {}) {
  const byLane = new Map();
  for (const node of layout.nodes) {
    const lane = node.lane ?? '';
    if (!byLane.has(lane)) byLane.set(lane, []);
    byLane.get(lane).push({ id: node.id, x: node.x, y: node.y, weight: node.weight, node });
  }

  const stacks = [];
  for (const lane of [...byLane.keys()].sort(byId)) {
    const clusters = clusterPoints(byLane.get(lane), {
      k,
      distance,
      // Below this the deepest zoom the view allows would still draw them as
      // one, so nothing is gained by promising the reader they can be parted.
      epsilon: distance / MAX_ZOOM,
      alone,
    });
    for (const cluster of clusters) {
      // Chronological: a stack's list is read as a stretch of time, and the
      // years are what the title and the panel say about it.
      const members = cluster.members.map((m) => m.node)
        .sort((a, b) => a.year - b.year || byId(a.id, b.id));
      stacks.push({
        key: cluster.key,
        lane: cluster.representative.node.lane,
        x: cluster.x,
        y: cluster.y,
        centre: cluster.centre,
        representative: cluster.representative.node,
        members,
        count: cluster.count,
        // The members' weights together, as on the map: what a stack is
        // worth is what is inside it, and that is what decides a label.
        weight: cluster.weight,
        years: { min: members[0].year, max: members[members.length - 1].year },
        coincident: cluster.coincident,
        splittable: cluster.splittable,
        coreZoom: cluster.coreZoom,
        alone: cluster.alone,
      });
    }
  }
  stacks.sort((a, b) => a.x - b.x || byId(a.key, b.key));

  const stackOf = new Map();
  for (const stack of stacks) for (const member of stack.members) stackOf.set(member.id, stack.key);
  const byKey = new Map(stacks.map((s) => [s.key, s]));
  const edges = mergeEdges(
    layout.edges.map((line) => ({
      id: line.id,
      from: line.from,
      to: line.to,
      type: line.edge.type,
      confidence: line.edge.confidence,
      edge: line.edge,
    })),
    stackOf,
  ).map((merged) => {
    const from = byKey.get(merged.from);
    const to = byKey.get(merged.to);
    return { ...merged, x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  });

  return { k, nodes: stacks, edges, stackOf };
}

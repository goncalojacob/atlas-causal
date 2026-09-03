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
// region, so a continent stays in one place and the eye can follow it.
// Second, inside a band, the events of the same year are spread apart and
// ordered by a barycentre pass — each node pulled towards the average
// height of the events it is linked to — so that edges come out short and
// cross each other less often.
//
// The sweeps are not trusted blindly: the arrangement of every sweep is
// counted, and the one with the fewest crossings wins, the naive order
// included. That is why the layout can promise never to be worse than
// doing nothing.

import { extent } from '../util/dates.js';
import { createLinearScale } from '../timeline-scale.js';

export const WIDTH = 960;
export const BAND_HEIGHT = 96;
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

// events: active events with a region and a `when`. edges: active edges
// between them. regions: the lane list, in order. dataExtent: the atlas's
// own { min, max } in astronomical years.
export function layoutGraph({ events, edges, regions, extent: dataExtent, width = WIDTH }) {
  const bands = regions.map((region, i) => ({
    id: region.id,
    label: region.label,
    y0: AXIS_HEIGHT + i * BAND_HEIGHT,
    y1: AXIS_HEIGHT + (i + 1) * BAND_HEIGHT,
    even: i % 2 === 0,
  }));
  const height = AXIS_HEIGHT + Math.max(bands.length, 1) * BAND_HEIGHT;
  const scale = createLinearScale({ domain: domainOf(dataExtent), range: [GUTTER_LEFT, width - GUTTER_RIGHT] });

  // An event whose region is not a lane would have nowhere to go. The
  // validator derives one for every event, so this is a guard, not a case:
  // it lands in the last band rather than disappearing from the picture.
  const bandOf = new Map(bands.map((b) => [b.id, b]));
  const fallback = bands[bands.length - 1] ?? null;
  const list = [...events].sort((a, b) => byId(a.id, b.id));

  const nodes = new Map();
  const columns = new Map();
  for (const event of list) {
    const band = bandOf.get(event.region) ?? fallback;
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
      const usable = node.band.y1 - node.band.y0 - 2 * BAND_PAD;
      xy.set(id, { x: node.x, y: node.band.y0 + BAND_PAD + p * usable });
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
      region: node.band.id,
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

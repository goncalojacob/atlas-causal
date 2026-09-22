// Where every node of the graph view goes. Pure: topology in, coordinates
// out, no DOM, no state — so the arrangement can be tested for the two
// things that matter about it, that it is the same every time and that it
// does not tangle the edges more than doing nothing would.
//
// x is the year, on the whole extent of the data, exactly the scale the
// timeline keeps — which since M43b means the bucketed one over a corpus long
// enough to need it (timeline-scale.js). The two pictures share the scale and
// not merely the extent, and they have to: a reader who has just read the
// thirteenth century as a third of the timeline must not find it a hundredth
// of the graph. No force simulation: physics would put 1910 beside 2011
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

import { extent, startPoint } from '../util/dates.js';
import { createTimelineScale } from '../timeline-scale.js';
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
// How many sweeps in a row may bring no improvement before the rest are
// given up. Two, and never a clock: a layout that stopped because the
// machine was busy would draw a different picture on a slower one, and this
// file's first promise is that the same records give the same picture.
const PATIENCE = 2;
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
// The least room the layout leaves between two nodes of one column, in the same
// units — and it is the same number, because it is the same question asked the
// other way round. A column exists so that nodes near enough in x to be drawn
// on each other are not drawn on each other; `STACK_DISTANCE` is this file's
// own answer to how near that is; so the room a column makes is exactly it. Any
// less and the pair is below the merge threshold and would have been one mark
// anyway; any more is height spent on nothing. Two nodes in *neighbouring*
// columns can still be nearer than this, which is what leaves the clusterer its
// work — a crowded picture is still answered by a stack and its `+N` badge and
// not by a field of marks pressed apart (M83, A1-3).
const COLUMN_GAP = STACK_DISTANCE;
// There was a second level of detail here until M70 — a *semantic* one, below
// whose zoom an event's parts were drawn inside it. M65 left it dead and the
// owner removed it: the resting rule keeps a part out of the picture until
// the reader opens what it is part of, and the ring on the mark says there is
// more inside. What is left is the geometric one above, and nothing in this
// file has a threshold of its own any more.

// Sorting anything that feeds a floating-point sum: two runs given the same
// records in a different order must produce the same numbers, and addition
// is not commutative in binary floating point.
const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function domainOf(dataExtent) {
  if (!dataExtent) return [0, 1];
  const span = dataExtent.max - dataExtent.min;
  return [dataExtent.min - span * DOMAIN_PADDING - 1, dataExtent.max + span * DOMAIN_PADDING + 1];
}

// The years a set of events actually stands on: the min of every event's own
// start, which is the year `layoutGraph` places a node at, and the max of the
// same. **Not the max of the intervals** — an event that ran for forty years
// has one node and it is at the year it began, so a domain stretched to the
// end of it would be width nobody stands in.
//
// It is what a lens's axis is built from (M81). With a lens on, the arrangement
// is not the corpus and laying it out over the corpus's extent puts every event
// of a six-year war inside a sliver of the width; over its own extent they
// spread across it in the order they happened. Null for a set with no year in
// it at all, and then the caller's own extent stands.
export function timeSpan(events) {
  let min = Infinity;
  let max = -Infinity;
  for (const event of events) {
    const year = extent(event.when).min;
    if (!Number.isFinite(year)) continue;
    if (year < min) min = year;
    if (year > max) max = year;
  }
  return Number.isFinite(min) ? { min, max } : null;
}

// And what a lens is actually laid out over (M81): the extent of the events the
// lens itself names, and the events to count the centuries of — the two travel
// together, because the counts are what decide whether the scale buckets and a
// table of one set laid over the domain of another is a bucketing of centuries
// that are not there. Null at rest, and then the corpus's own extent stands.
//
// Two cases, and the second is not a special one but the same rule read
// honestly. **A lens of one date has no extent of its own.** Most lenses are
// one event chosen, whose own half is that event alone: an axis of a single
// year is a domain a year wide, and the ring — which is why the reader can see
// what the event answers to at all — would be flung tens of widths off the
// picture and culled. So what stands then is the extent of everything drawn,
// which is what the ring is, and it is the narrowest axis that holds the whole
// of the answer.
//
// Where the lens *does* have an extent — a war with its parts inside it, a
// narrative's walk — that extent is the axis, and the ring is drawn where its
// own dates put it, off the width where its own dates are off the width. The
// margin `domainOf` adds is the margin: four per cent and a year, which on a
// six-year war is the difference between the parts taking seven tenths of the
// drawing and taking all of it with two of them on the edge.
//
// **And at rest it is the same rule** (M82, A1). Until this milestone it
// answered `null` with no lens on and the caller fell back to the corpus's own
// extent and the corpus's own century counts — which is an axis built from 582
// events to lay out the 245 the picture holds. The reviewer's sentence is that
// the resting graph is a tangle stacked at 1900–2000; part of that is an axis
// describing a set that is not what is drawn. The rule the lens has had since
// M81 is that the axis is the extent of what the picture is *of*, and there is
// nothing about a lens in it: at rest the picture is the resting set, so the
// axis is the resting set's.
//
// Measured on the corpus of 22 September, the difference is small — the 20th
// century holds most of the main events as it holds most of the corpus, so its
// share of the width moves by about a point. It is the honest axis either way:
// what it can no longer do is describe a century by the events the reader is
// not being shown.
export function timeAxis(events, lens) {
  const own = lens ? events.filter((event) => lens.has(event.id)) : events;
  const span = own.length ? timeSpan(own) : null;
  if (span && span.max > span.min) return { extent: span, events: own };
  const all = timeSpan(events);
  return all ? { extent: all, events } : null;
}

// Do two segments cross? Proper intersection only: edges that merely share
// an endpoint are the graph doing its job, not a crossing.
//
// Exported so a test can count the crossings of a finished drawing the slow
// way — every pair, no pruning — and hold the sweep below to the same
// number. A second implementation of the geometry would only be testing
// itself.
export function crosses(a, b) {
  if (a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to) return false;
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const d1 = side(a.p1, a.p2, b.p1);
  const d2 = side(a.p1, a.p2, b.p2);
  const d3 = side(b.p1, b.p2, a.p1);
  const d4 = side(b.p1, b.p2, a.p2);
  return d1 !== d2 && d3 !== d4 && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0;
}

// Places the nodes of one column so that they do not sit on each other,
// **as near as possible to where the barycentre wants them** — which until M83
// it did not do. Ties break by id, then by weight, so the order never depends
// on the order of the input.
//
// What it did was share the band out evenly: the gap between two nodes was
// `(1 - 2 × EDGE) / (n - 1)` wherever that was the smaller of the two terms,
// which is every column of four or more. So every such column spanned the whole
// field whatever its nodes wanted, the first of them stood exactly on the top
// line and the last exactly on the bottom — and that is the row of circles
// capping every year column in the owner's screenshot, and half of why the
// edges fanned from the bottom left to the top right (A1-1, A1-3).
//
// Now the wanted positions are kept and only pressed apart where two of them
// are nearer than `gap`: down the column, then back up it, which also brings a
// run that was pushed past the bottom back inside the band. The pass cannot
// overflow, because `gap` is never more than the room the column has
// (`(1 - 2 × EDGE) / (n - 1)`), so the first node is never pushed above the top
// line and there is no third pass to write.
//
// A layered ordering is what this makes of the sweep above it: each layer is
// settled against the one to its left and stays where its neighbours are,
// instead of being dealt out over the height by rank.
function resolveColumn(ids, positions, weights, gap) {
  const order = [...ids].sort(
    (a, b) => positions.get(a) - positions.get(b) || byId(a, b) || weights.get(a) - weights.get(b),
  );
  const n = order.length;
  const lo = EDGE;
  const hi = 1 - EDGE;
  const clamp = (p) => Math.min(hi, Math.max(lo, p ?? 0.5));
  const out = new Map();
  if (n === 1) {
    out.set(order[0], clamp(positions.get(order[0])));
    return out;
  }
  const step = Math.min(gap, (hi - lo) / (n - 1));
  const wanted = order.map((id) => clamp(positions.get(id)));
  const placed = [...wanted];
  for (let i = 1; i < n; i += 1) placed[i] = Math.max(placed[i], placed[i - 1] + step);
  placed[n - 1] = Math.min(placed[n - 1], hi);
  for (let i = n - 2; i >= 0; i -= 1) placed[i] = Math.min(placed[i], placed[i + 1] - step);
  // The two passes push down and then pull up only as far as the bottom line
  // makes them, which leaves every column that had to be pressed apart sitting
  // low in the field — six of the war's nodes on the bottom line, measured, and
  // the same fault the even spread had at the top. Sliding the finished run
  // back to the middle of what its nodes wanted takes the bias out; the shift is
  // bounded by the band, and the bound always holds zero because the run is
  // never longer than the room it was given.
  const mean = (list) => list.reduce((sum, p) => sum + p, 0) / n;
  const shift = Math.max(lo - placed[0], Math.min(hi - placed[n - 1], mean(wanted) - mean(placed)));
  order.forEach((id, i) => out.set(id, placed[i] + shift));
  return out;
}

// events: the events to draw, with a `when`. edges: active edges between
// them. lanes: what lanes.js gave for the current grouping, in order, each
// with its members — empty for no grouping at all. dataExtent: the atlas's
// own { min, max } in astronomical years. counts: how many events each century
// holds (util/window.js), which is what decides whether the scale buckets;
// null is a caller with no corpus to ask, and then the scale is linear.
export function layoutGraph({
  events, edges, lanes = [], extent: dataExtent, counts = null, width = WIDTH,
}) {
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
  // The highest and lowest line a node of this band may be placed on. The
  // layout's own arithmetic said out loud, so that what reads the finished
  // drawing — a test, a camera — can ask whether a mark was pinned to the edge
  // of the field rather than working `EDGE` and the padding out again (M83).
  for (const band of bands) {
    const usableHeight = band.y1 - band.y0 - 2 * pad;
    band.top = band.y0 + pad + EDGE * usableHeight;
    band.bottom = band.y0 + pad + (1 - EDGE) * usableHeight;
  }
  const height = bands[bands.length - 1].y1;
  // Kept beside the scale as well as inside it: a function does not survive a
  // structured clone, and the Worker's reply has to carry enough to build the
  // same one again (layout-message.js).
  const scaleInput = {
    domain: domainOf(dataExtent),
    range: [GUTTER_LEFT, width - GUTTER_RIGHT],
    counts,
    extent: dataExtent,
  };
  const scale = createTimelineScale(scaleInput);

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
    // Two numbers and they are not the same one (M83, A1-2). `year` is what the
    // picture *says* — a stack's span, a tie broken chronologically — and is the
    // integer it always was. `at` is where the mark stands on the axis, which is
    // the day inside that year wherever the record gives one, so the parts of a
    // six-year war spread along the width instead of stacking in seven columns.
    const year = extent(event.when).min;
    const at = startPoint(event.when);
    const node = {
      id: event.id, event, band, year, at, x: scale.x(at), weight: event.weight ?? 0, y: 0,
    };
    nodes.set(node.id, node);
    // And a column is a column of the *drawing* and no longer of the calendar:
    // the nodes near enough in x that one would be drawn over another, which is
    // the only reason a column exists. `STACK_DISTANCE` is this file's own
    // answer to "near enough to be one mark", so it is the width of a column
    // too, and there is no second number to keep in step with it.
    const key = `${band.id}|${Math.round(node.x / STACK_DISTANCE)}`;
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
  // The layers the sweep walks, in the order they are drawn in: one per slot of
  // the drawing, however many bands share it. The slot and not the year, since
  // M83 — a layered ordering settles each layer against the one before it, and
  // what "before" means here is what the reader sees to the left.
  const columnsBySlot = new Map();
  for (const key of columnKeys) {
    const slot = Number(key.slice(key.lastIndexOf('|') + 1));
    if (!columnsBySlot.has(slot)) columnsBySlot.set(slot, []);
    columnsBySlot.get(slot).push(key);
  }
  const slots = [...columnsBySlot.keys()].sort((a, b) => a - b);

  // The least room between two nodes of one column, as a fraction of the band
  // they are in: `COLUMN_GAP` is in the drawing's own units and a band's usable
  // height is what a position of 0 to 1 is measured over.
  const usable = bandHeight - 2 * pad;
  const gap = usable > 0 ? Math.min(1, COLUMN_GAP / usable) : 1;

  const place = (positions) => {
    const out = new Map();
    for (const key of columnKeys) {
      for (const [id, p] of resolveColumn(columns.get(key), positions, weights, gap)) out.set(id, p);
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
  // Every pair of segments, minus the pairs that cannot possibly cross.
  //
  // The count is the exact one: `crosses` decides a proper intersection, and
  // a proper intersection is a point on both segments, so it lies in both
  // bounding boxes. Two segments whose boxes miss each other are therefore
  // never a crossing, and not testing them changes the answer by nothing.
  // This is a prune, not another metric — an adjacent-layer inversion count
  // would have been a different number about a different picture (review of
  // the health plan, finding 13).
  //
  // The sweep is over x, which here is the year: segments are taken in the
  // order their earlier end falls, and the ones whose later end is already
  // behind the sweep are dropped. What is left in hand is exactly the set
  // whose span overlaps the segment being tested, and a pair meets exactly
  // once — when the later-starting of the two comes up.
  const countCrossings = (positions) => {
    const xy = absolute(positions);
    const segments = drawnEdges.map((e) => {
      const p1 = xy.get(e.from);
      const p2 = xy.get(e.to);
      return {
        from: e.from,
        to: e.to,
        p1,
        p2,
        x0: Math.min(p1.x, p2.x),
        x1: Math.max(p1.x, p2.x),
        y0: Math.min(p1.y, p2.y),
        y1: Math.max(p1.y, p2.y),
      };
    });
    // By the near end, ties by id: the count does not depend on the order —
    // it is a whole number over unordered pairs — but the work should, so
    // that a slow run and a fast one do the same amount of it.
    segments.sort((a, b) => a.x0 - b.x0 || byId(a.from, b.from) || byId(a.to, b.to));
    let count = 0;
    const active = [];
    for (const segment of segments) {
      let kept = 0;
      for (let i = 0; i < active.length; i += 1) {
        if (active[i].x1 >= segment.x0) {
          active[kept] = active[i];
          kept += 1;
        }
      }
      active.length = kept;
      for (let i = 0; i < kept; i += 1) {
        const other = active[i];
        // The bands make this worth doing: two segments that share a stretch
        // of years but sit in different bands are most of the pairs left.
        if (other.y0 > segment.y1 || segment.y0 > other.y1) continue;
        if (crosses(other, segment)) count += 1;
      }
      active.push(segment);
    }
    return count;
  };

  // The naive order — by id inside each column, nothing moved — is the
  // arrangement every sweep has to beat.
  //
  // **Packed around the middle of the field and not dealt out over it** (M83).
  // It was `(i + 0.5) / n`, which put a column of two a third of the field
  // apart before anything had asked for it; the sweeps below only ever press
  // nodes apart, never together, so that opening spread was where a great many
  // of them stayed — and two marks a third of a field apart are two marks the
  // clusterer will not merge however near in time they are. The seed is now the
  // same minimum room the sweeps keep, centred, so what moves a node from the
  // middle is a neighbour and nothing else.
  let positions = new Map();
  for (const key of columnKeys) {
    const ids = [...columns.get(key)].sort(byId);
    const step = Math.min(gap, (1 - 2 * EDGE) / Math.max(1, ids.length - 1));
    ids.forEach((id, i) => positions.set(id, 0.5 + (i - (ids.length - 1) / 2) * step));
  }
  positions = place(positions);
  let best = positions;
  let bestCrossings = countCrossings(positions);
  const naiveCrossings = bestCrossings;

  // Year by year, forwards then backwards. Each layer is settled against
  // the layers already moved in this sweep, as a layered drawing is
  // ordinarily built; a column is resolved the moment it is computed so
  // the next layer reads where its neighbours actually ended up.
  // Sweeps that brought nothing, in a row. The stop is on the count and on
  // nothing else: `PATIENCE` flat sweeps and the rest are not worth the
  // counting. Two runs of the same records stop at the same sweep.
  let flat = 0;
  for (let sweep = 0; sweep < SWEEPS; sweep += 1) {
    const forward = sweep % 2 === 0;
    const near = forward ? before : after;
    const next = new Map(positions);
    for (const slot of forward ? slots : [...slots].reverse()) {
      for (const key of columnsBySlot.get(slot)) {
        const wanted = new Map(next);
        for (const id of columns.get(key)) {
          const list = near.get(id);
          if (list.length === 0) continue;
          wanted.set(id, list.reduce((sum, other) => sum + (next.get(other) ?? 0.5), 0) / list.length);
        }
        for (const [id, p] of resolveColumn(columns.get(key), wanted, weights, gap)) next.set(id, p);
      }
    }
    positions = next;
    const crossings = countCrossings(positions);
    // Strictly fewer, so the earliest arrangement wins a tie and the result
    // does not depend on how many sweeps happened to run.
    if (crossings < bestCrossings) {
      bestCrossings = crossings;
      best = positions;
      flat = 0;
    } else {
      flat += 1;
      if (flat >= PATIENCE) break;
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

  return { width, height, bands, nodes: placed, edges: laid, scale, scaleInput, crossings: bestCrossings, naiveCrossings };
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
//
// `stretch` is how much wider than the arrangement time is being drawn
// (stretch.js, M81), and it is applied **here** rather than at the drawing,
// because what it changes is not only where a mark goes but which marks there
// are: two nodes a year apart drawn four times further apart come off one mark
// at a quarter of the zoom. So what this returns is in the picture's own
// coordinates — x already stretched — and the view draws and hit-tests in them.
// The nodes it is made of are untouched: `layout` is the arrangement, and the
// arrangement never moves (arrangement.js).
export function stackLayout(layout, {
  k = 1, alone = null, distance = STACK_DISTANCE, stretch = 1,
} = {}) {
  const byLane = new Map();
  for (const node of layout.nodes) {
    const lane = node.lane ?? '';
    if (!byLane.has(lane)) byLane.set(lane, []);
    byLane.get(lane).push({
      id: node.id, x: node.x * stretch, y: node.y, weight: node.weight, node,
    });
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

  return {
    k, stretch, nodes: stacks, edges, stackOf,
  };
}

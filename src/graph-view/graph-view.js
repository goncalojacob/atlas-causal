// The third view of the same graph: every event a node, every edge a line,
// the whole web at once instead of one chain at a time. It shares the
// panel, the search, the window, the URL, the selection and the walked
// chain with the map — it is the same atlas, drawn another way — and takes
// the map's place in the layout behind the Map | Graph toggle.
//
// Nothing here decides where a node goes; layout.js does, purely. This file
// draws what it is given, says what is inside the window and what is not,
// and turns a click into a move through the graph.
//
// The one thing it does that the map does not: clicking a node that the
// selected event actually leads to walks the chain rather than starting a
// new one. In a picture of the whole web, following an arrow with the eye
// and then clicking its head is the obvious gesture, and it is the same
// step the panel's "follow" button takes.
//
// Since M25 it draws a level of detail rather than every node: what is too
// close together to be told apart at this zoom is one mark with a count, and
// the links between two such marks are one line with a count of their own.
// layout.js decides all of that, purely; this file draws it, and decides the
// one thing a pure function cannot — which events are the ones the reader is
// working with, and therefore may never be swallowed by a stack.

import { svg, svgTitle } from '../util/dom.js';
import { formatInterval, formatYear } from '../util/dates.js';
import { centuryCounts } from '../util/window.js';
import { renderKey, shardsArrived } from '../render-key.js';
import { labelOf, LOADING_LABEL } from '../attributes.js';
import { convergence } from '../graph.js';
import { EDGE_TYPE_IDS, EDGE_TYPE_LABEL } from '../vocab.js';
import { CONFIDENCE_ORDER, CONFIDENCE_CLASS, bundleClass } from '../confidence.js';
import { chainEdges as walkedEdges, walkOrSelect } from '../chain.js';
import { horizonBand } from '../horizon.js';
import { workingSet, heldSet } from '../emphasis.js';
import { isParent, ringClasses } from '../parts.js';
import { zoomBucket } from '../cluster.js';
import { onScreen } from '../map/layers/events.js';
import { arrangementOf, holdingKey } from './arrangement.js';
import {
  layoutGraph, stackLayout, timeAxis, MIN_ZOOM, MAX_ZOOM,
} from './layout.js';
import { createLayoutRunner } from './layout-runner.js';
import { frameFor } from './frame.js';
import { STRETCH_CAP, stretchStep } from './stretch.js';
import { LABEL_SIZE, shorten } from './label-fit.js';
import {
  naming, placeLabels, placeOne, labelBoxAt, movedAway, LENS_ROWS_AWAY,
} from './labels.js';
import { exportButton } from '../share.js';

// Sizes in SVG units at k = 1; divided by k when drawn, so a node keeps its
// size on screen at any zoom, as the map's marks do.
const MIN_RADIUS = 4;
const MAX_RADIUS = 6.5;
// How far from a node's centre a click still means that node.
const HIT_RADIUS = 8;
// And how far from a line a click still means that line (M80). Smaller than
// the node's reach, and asked only after the nodes have said no: a line runs
// into the mark at either end of it, so a click near a node would otherwise be
// ambiguous everywhere the picture is dense. Points are in the graph's own
// coordinates, so this is divided by the zoom exactly as the node's is.
const EDGE_HIT_RADIUS = 5;
const SELECTED_RADIUS = 7.5;
// A stack is a little larger than the node it is drawn on, and CSS gives it a
// heavier ring: the reader has to be able to tell one mark from many at a
// glance, as they can on the map.
const STACK_BONUS = 1.2;
const HEAD_LENGTH = 7;
const HEAD_WIDTH = 4.5;
// How far from a mark's centre the text of its label starts, clear of the
// widest node and its outline. In units of the screen, like every other size
// here, and divided by the zoom where it is used.
const LABEL_GAP = MAX_RADIUS + 3;
// What fits in the left gutter a band label is written in.
const BAND_LABEL_CHARS = 12;
// Every node on screen is offered its name at every zoom since M82 (A1), so
// there is no zoom at which naming begins and no cap on how many are offered.
// `LABEL_LIMIT` is what `naming` falls back to for a caller that asks for a
// capped list, and nothing here asks for one.
const LABEL_LIMIT = 14;
const BADGE_SIZE = 10;
// How far outside the rectangle on screen a mark is still worth putting in
// the DOM: a node whose centre is just past the edge still has half of
// itself, its ring and its count inside it. The map's `DRAW_MARGIN` is the
// same sum for the same reason (map/layers/events.js).
const DRAW_MARGIN = HIT_RADIUS + BADGE_SIZE;
// The ring outside the node of an event that has parts: how far outside it,
// and how thin. A ring says "there is more inside" and nothing else, so it is
// thinner than the node's own outline.
const RING_GAP = 2.5;
const RING_WIDTH = 1;
// How much heavier a merged line is drawn. Logarithmic, so a line carrying
// twenty links is thicker than one carrying two without being a ribbon:
// weight here says "several", not "exactly n" — the count is in the title.
const MERGED_BASE = 1.6;
const MERGED_STEP = 1.1;
const mergedWidth = (count) => MERGED_BASE + Math.log2(count) * MERGED_STEP;
// One notch of the wheel, for the click that opens a stack no zoom quite
// parts: never less than this much further in.
const CLUSTER_ZOOM_STEP = 1.2;
// As far as the first drawing will zoom in on its own. It was the cap on the
// zoom to a narrow window (deviation 54); M74 gave the same cap to a frame of
// a lens, and M76 left it the only one there is — the graph no longer opens on
// the window at all, so a frame of the picture and a frame of a walk go as far
// in as each other and no further. Since M81 it is the cap on **the height's**
// fit: the width has a cap of its own, `STRETCH_CAP` (stretch.js).
const FIT_ZOOM = 2;
// The room a frame leaves around what it frames: the widest a mark is drawn,
// its ring and the ring's own stroke. In the SVG's units, which is what a mark
// measures in at any zoom — the radius is divided by k and the viewport
// multiplies by it — so a node framed at the very edge of the rectangle would
// be a node half off the screen (frame.js).
const FRAME_PAD = SELECTED_RADIUS + RING_GAP + RING_WIDTH;
// How many arrangements and how many stackings are kept. Small on purpose:
// what these are for is the reader who narrows the band and widens it again,
// or zooms in and back out, and finds the picture already there. Holding
// every arrangement of a session would be holding the corpus several times
// over (health review A, finding 2: cached per key, with a size cap).
const LAYOUT_CACHE = 6;
const STACK_CACHE = 12;

// Least recently used, by insertion order, which a Map already keeps: a hit
// is deleted and set again so it goes back to the young end.
function createCache(limit) {
  const entries = new Map();
  return {
    get(key) {
      if (!entries.has(key)) return null;
      const value = entries.get(key);
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, value);
      if (entries.size > limit) entries.delete(entries.keys().next().value);
      return value;
    },
  };
}

function textNode(text, attrs) {
  const el = svg('text', attrs);
  el.textContent = text;
  return el;
}

// Weight decides size only within a small range: the graph is about the
// links, and a node four times the size of its neighbour would be an
// argument the data does not make.
function radiusFor(weight, weights) {
  if (weights.max === weights.min) return MIN_RADIUS;
  // Clamped, because a node may carry a weight the range was not measured
  // over — `subtreeWeight` on a parent the index derived one for: the
  // heaviest mark is the heaviest size and not a larger one.
  const t = Math.min(1, Math.max(0, (weight - weights.min) / (weights.max - weights.min)));
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

function classes(...list) {
  return list.filter(Boolean).join(' ');
}

// What a line is called, to the pointer and to a screen reader: the two ends
// with the type between them, which is the only name a link has — it has no
// title of its own, being an argument and not a thing. A name that has not
// arrived yet reads as the interface saying so, exactly as a mark's does
// (attributes.js); it is never the id, which is a slug shown where a name
// goes.
function edgeName(atlas, edge) {
  const named = (id) => labelOf(atlas, atlas.events.get(id)) ?? LOADING_LABEL;
  return `${named(edge.from)} — ${EDGE_TYPE_LABEL[edge.type] ?? edge.type} → ${named(edge.to)}`;
}

// How far a point is from a segment, in whatever units both are written in.
// Pure arithmetic and the only geometry this file does: it is what decides
// which line a click means (M80), the way `nearestStack` decides which mark
// one means. The projection onto the segment is clamped to its two ends, so a
// click well past the arrowhead is measured to the arrowhead and not to the
// infinite line the segment lies on.
export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  if (length === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.min(1, Math.max(0, ((px - x1) * dx + (py - y1) * dy) / length));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// The key to the five line patterns, in the corner of the view that uses
// them, and — since M73 — to the ink that says how sure the atlas is of one.
// Drawn with the very same classes the edges are drawn with, so the key
// cannot come to disagree with the picture; about.html carries the same rows
// for the same reason. Outside the SVG, so panning and zooming leave it
// where it is.
export function edgeKey() {
  const box = document.createElement('div');
  box.className = 'graph-key';
  const line = (type, extra = '') => `<svg class="graph key-line" viewBox="0 0 62 12" aria-hidden="true">
      <line class="edge type-${type} ${extra}" x1="1" y1="6" x2="50" y2="6"/>
      <polygon class="edge-head type-${type}" points="60,6 50,3 50,9"/></svg>`;
  // The three confidences as three segments of one type, surest first: the
  // dash is the type's and stays the type's, so what the reader is being
  // shown here is the ink alone, which is the one thing this row is about.
  const sureness = `<svg class="graph key-line" viewBox="0 0 62 12" aria-hidden="true">
      ${CONFIDENCE_ORDER.map((confidence, i) => `<line class="edge type-caused ${CONFIDENCE_CLASS[confidence]}"
        x1="${i * 21 + 1}" y1="6" x2="${i * 21 + 19}" y2="6"/>`).join('')}
    </svg>`;
  // **One line, on every width** (M82 A1, and M83 A1-4). At 390 px the key
  // covered half the picture — `m77-graph-phone.png`, `m81-graph-war-phone.png`
  // — and M82 folded it there. The owner, 22 September, looking at World War II
  // opened on a 1440 px screen: the key is over the bottom-left corner of the
  // drawing there too. A legend standing on the thing it is a legend to is the
  // same fault at either width, so there is one behaviour now and the button is
  // it. The class it toggles is what the stylesheet opens. The key is not in
  // the SVG, so nothing here moves a mark.
  box.innerHTML = `<button type="button" class="graph-key-toggle" aria-expanded="false" aria-controls="graph-key-body">Key</button>
    <div id="graph-key-body" class="graph-key-body"><h2>Links</h2><dl class="edge-key">
    ${EDGE_TYPE_IDS
      .map((type) => `<dt>${line(type)}</dt><dd>${type}</dd>`).join('')}
    <dt>${sureness}</dt><dd>how sure: ${CONFIDENCE_ORDER.join(', ')}</dd>
  </dl></div>`;
  const toggle = box.querySelector('.graph-key-toggle');
  toggle.addEventListener('click', () => {
    const open = box.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  return box;
}

export function createGraphView(container, { atlas, state, onCluster = null }) {
  // How the corpus is spread over the centuries, counted once at build as the
  // timeline counts it: it is what decides whether the scale buckets, and the
  // two pictures must not answer that differently (timeline-scale.js).
  const counts = centuryCounts(atlas.activeEvents);
  // The arrangement depends on which events are shown, what the bands are and
  // where the band of time is, and all three change under the reader: it is
  // rebuilt when they do and kept when they do not, so panning, zooming,
  // selecting and walking a chain never move a node.
  let laid = null;
  // What is actually drawn at the current zoom: the arrangement above, with
  // everything too close together to tell apart merged into one mark.
  let stacked = null;
  let weights = { min: 0, max: 0 };
  let arrangedFor = null;
  // And the same arrangement's *question* — its key without the attribute-shard
  // count — which is what the camera is filed under (M83, and `frameCamera`).
  let askedFor = null;
  // Both of the expensive answers are kept by their key rather than only for
  // as long as the key holds still: a reader who widens the band and narrows
  // it again, or zooms out and back in, gets the picture they had.
  const arrangements = createCache(LAYOUT_CACHE);
  const stackings = createCache(STACK_CACHE);

  // The working set — what the reader is holding — is asked of emphasis.js
  // once per state and not once per caller. It runs the convergence query,
  // and the arrangement, the stacking and the drawing all need it. The cache
  // this view kept for itself moved into `emphasis.js` in H4c, where the map
  // and the timeline share it: three views asking the same question of the
  // same state now walk the graph once between them, not once each.
  const workingOf = (s) => workingSet(atlas, s);
  // And what of it may never be swallowed by a stack, nor left without a
  // place to stand when the band moves away from it. The graph, unlike the
  // map, never stacks the reachable set: the horizon is the answer this
  // picture exists to draw, and a band inside a stack is a band the reader
  // cannot read off.
  //
  // Kept by the working set it is made of and **not by the state**, which is
  // what it was keyed on until M74. Two of the things a lens is built from
  // arrive after the state does — a narrative's steps come with their century,
  // an actor's ground with its own file (lens.js, `stamp`) — and `workingSet`
  // answers again when they land, on the very same state object. This cache
  // did not: the answer computed before the walk existed stood for the rest of
  // the session, so eighteen events of a twelve-step lens were swallowed by
  // stacks that M25's rule says may never hold one. `workingSet` replaces the
  // object exactly when the answer changes, so the object is the key.
  let aloneFor = null;
  let aloneIs = null;
  const alonesOf = (s) => {
    const working = workingOf(s);
    if (working !== aloneFor) {
      aloneFor = working;
      aloneIs = heldSet(working, { lens: true, reachable: true });
    }
    return aloneIs;
  };

  const viewport = svg('g', { class: 'viewport' });
  const bandsGroup = svg('g', { class: 'layer layer-bands' });
  const edgesGroup = svg('g', { class: 'layer layer-edges' });
  const nodesGroup = svg('g', { class: 'layer layer-nodes' });
  const labelsGroup = svg('g', { class: 'layer layer-labels' });
  // Over every other layer: the one name the pointer is asking for.
  const hoverGroup = svg('g', { class: 'layer layer-hover' });
  viewport.append(bandsGroup, edgesGroup, nodesGroup, labelsGroup, hoverGroup);
  const root = svg('svg', {
    class: 'graph',
    role: 'img',
    'aria-label': 'The graph of events and the links between them',
  }, [viewport]);

  // The one line the reader sees while a first arrangement too large to make
  // here is being made elsewhere. Never shown at the sizes this atlas holds:
  // below the runner's threshold the nodes are there before the frame is.
  const waiting = document.createElement('p');
  waiting.className = 'graph-note';
  waiting.hidden = true;
  waiting.textContent = 'Arranging the graph…';

  // Which arrangement the coordinates in `laid` belong to, which is not
  // always the one the reader has asked for: while a large one is being made
  // the last picture stays on screen, and a stacking of it must not be filed
  // under the key of a layout it was not made from.
  let laidFor = null;
  const runner = createLayoutRunner({ records: { events: atlas.events, edges: atlas.edges } });

  // Pan and zoom, as the map has them. Not in the state: the URL carries what
  // the reader is looking at, not how far they have pushed the view about.
  //
  // Declared here, above the first `arrange()`, rather than beside the
  // gestures that use them. It was `adopt()` calling the window fit that
  // needed that — on a narrow window, a narrative's step or a shared
  // `?from=&to=&view=graph`, the fit did not return early and died with
  // `Cannot access 'transform' before initialization`, leaving the graph's
  // pane blank. Where the camera is put moved into `render` in M74, the window
  // fit itself went in M76, and the declaration stays where it is because
  // every gesture below still reads it.
  // `s` is the fourth number and M81's: how much wider than the arrangement
  // time is drawn (stretch.js). It is not in the SVG's transform — that stays
  // the uniform `scale(k)`, so a mark is a circle and a label is set at one
  // size — it is in the picture's own coordinates, applied by `stackLayout`,
  // and everything drawn and hit-tested below is in those.
  let transform = {
    x: 0, y: 0, k: 1, s: 1,
  };
  // Whether the zoom in force was chosen to part a stack, in which case the
  // stacking is done at exactly it rather than at the bucket below it: the
  // bucket below `coreZoom` is a zoom that does not part them, and the click
  // would have moved the picture and parted nothing. The map has kept the
  // same flag for the same reason since H4a (map.js, `exactZoom`; cluster.js,
  // `zoomBucket`). Cleared by every other way the zoom can move.
  let exactZoom = false;
  const applyTransform = () => {
    viewport.setAttribute('transform', `translate(${transform.x} ${transform.y}) scale(${transform.k})`);
  };

  // The frame the reader keeps their bearings by: the bands and the year
  // axis. Redrawn when the arrangement is, and — since M81 — when the stretch
  // is, because the axis is the one thing on the picture that says what the
  // stretch has done to it: the ticks are years and they have to stand under
  // the marks of those years.
  let axisAt = null;
  function drawFrame() {
    axisAt = transform.s;
    bandsGroup.replaceChildren();
    for (const band of laid.bands) {
      if (band.hidden) continue;
      bandsGroup.appendChild(svg('rect', {
        x: 0, y: band.y0, width: laid.width * transform.s, height: band.y1 - band.y0,
        class: classes('band', band.even ? 'even' : 'odd'),
      }));
      // A band is a lane now, and an actor's name is longer than a region's:
      // the label is cut to the gutter and the whole of it is in the title.
      const label = textNode(shorten(band.label, BAND_LABEL_CHARS), { x: 8, y: band.y0 + 15, class: 'band-label' });
      label.appendChild(svgTitle(band.label));
      bandsGroup.appendChild(label);
    }
    for (const tick of laid.scale.ticks(10)) {
      const x = laid.scale.x(tick.value) * transform.s;
      bandsGroup.appendChild(svg('line', { x1: x, y1: laid.bands[0]?.y0 ?? 0, x2: x, y2: laid.height, class: 'tick' }));
      bandsGroup.appendChild(textNode(tick.label, { x, y: 16, class: 'tick-label', 'text-anchor': 'middle' }));
    }
  }

  // What `layoutGraph` is given: the arrangement's events, and the edges with
  // both ends in it. An edge with one end removed by the lens, or with one
  // end outside the band the arrangement covers, has nothing to join.
  //
  // And what time axis it is laid out on. **A lens has its own** (M81): the
  // extent of the events the lens itself names, so World War II opened is its
  // twenty-seven children spread across the width in the order they happened
  // rather than every one of them inside the hundredth of it the corpus's own
  // axis gives to 1939–1945. At rest the domain is the whole extent, as it was,
  // and the graph and the timeline still share a scale and not merely an
  // extent.
  //
  // The counts travel with the extent, because they are what decides whether
  // the scale buckets by century (timeline-scale.js) and a lens's own counts
  // are the lens's own events. A century table of the corpus laid over a
  // six-year domain would be a bucketing of centuries that are not there.
  function inputFor(events, lanes, lens = null) {
    const ids = new Set(events.map((e) => e.id));
    const axis = timeAxis(events, lens);
    return {
      events,
      edges: [...atlas.edges.values()].filter((e) => e.status === 'active' && ids.has(e.from) && ids.has(e.to)),
      lanes,
      extent: axis?.extent ?? atlas.extent,
      // The same count the timeline's scale is built from (util/window.js), so
      // the two pictures share a scale and not only an extent.
      counts: axis ? centuryCounts(axis.events) : counts,
    };
  }

  function entryFor(layout) {
    return {
      layout,
      weights: {
        min: Math.min(...layout.nodes.map((n) => n.weight), 0),
        max: Math.max(...layout.nodes.map((n) => n.weight), 0),
      },
    };
  }

  // The arrangement in hand becomes the one on screen.
  function adopt(entry, key) {
    laid = entry.layout;
    laidFor = key;
    weights = entry.weights;
    waiting.hidden = true;
    root.setAttribute('viewBox', `0 0 ${laid.width} ${laid.height}`);
    drawFrame();
    // Where the camera is put is decided in `render`, on the drawing that
    // follows this one: it needs the rectangle the reader can see, and asking
    // for that here would be asking the browser to lay out a picture that has
    // not been drawn yet.
  }

  function arrange(s) {
    const {
      events, lanes, key, lens, question,
    } = arrangementOf(atlas, s, alonesOf(s), workingOf(s).shown);
    askedFor = question;
    if (key === arrangedFor) return false;
    arrangedFor = key;
    const cached = arrangements.get(key);
    if (cached) {
      adopt(cached, key);
      return true;
    }
    // Small enough to arrange here, which is every corpus this atlas has
    // held so far and the only path `node --test` can reach (layout-runner).
    if (!runner.offloads(events.length)) {
      adopt(arrangements.set(key, entryFor(layoutGraph(inputFor(events, lanes, lens)))), key);
      return true;
    }
    // Otherwise the picture the reader already has stays on screen until the
    // new one lands, and on the very first arrangement — when there is none —
    // the frame says what it is doing rather than showing an empty field.
    if (!laid) waiting.hidden = false;
    runner.run(inputFor(events, lanes, lens), (layout) => {
      const entry = arrangements.set(key, entryFor(layout));
      // The reader may have moved the band again while this was away. The
      // arrangement is kept either way; it is simply not what is on screen.
      if (arrangedFor !== key) return;
      adopt(entry, key);
      render(state.get(), { force: true });
    });
    return laid !== null;
  }
  arrange(state.get());

  // --- what the reader can actually see -------------------------------------
  //
  // The `<svg>` carries a viewBox and no preserveAspectRatio of its own, and
  // CSS gives it the whole pane, so it is letterboxed: in a pane wider than
  // the arrangement's ratio the visible SVG units run a few hundred either
  // side of it, and a third of what is on the screen lies outside the nominal
  // box. That did not matter while this rectangle only chose which marks were
  // worth naming; it matters now that it decides which are drawn at all, so
  // it goes through the element's own matrix, exactly as the map's does
  // (map.js, `visibleBox`; health review A, finding 4).
  //
  // The nominal box is the answer when there is nothing to measure — a test
  // with no layout behind it, or a pane collapsed to nothing — which is what
  // this returned before.
  const nominalBox = () => ({ x0: 0, y0: 0, x1: laid?.width ?? 0, y1: laid?.height ?? 0 });
  // Measured once and kept. This rectangle is in the SVG's own units and
  // moves only when the element does — a pan or a zoom moves the picture
  // *inside* it — and asking the browser for the matrix is asking it to lay
  // the whole drawing out first. At 20,000 events one such question was a
  // third of a wheel notch, and a notch would otherwise ask two: one in the
  // handler, to find the point under the pointer, and one here. What makes it
  // stale is the pane changing size, which the observer at the end of this
  // file is watching for.
  let measured = null;
  const visibleBox = () => {
    if (measured) return measured;
    if (typeof DOMPoint !== 'function' || typeof root.getScreenCTM !== 'function') return nominalBox();
    const ctm = root.getScreenCTM();
    const rect = root.getBoundingClientRect?.();
    if (!ctm || ctm.a === 0 || ctm.d === 0 || !rect || !rect.width || !rect.height) return nominalBox();
    const inverse = ctm.inverse();
    const a = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
    const b = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);
    measured = {
      x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y),
    };
    return measured;
  };
  // That rectangle in the graph's own coordinates, under the pan and zoom.
  //
  // Measured once per drawing and handed down, never asked for again from
  // inside `draw`: `getScreenCTM` on an element whose children have just been
  // replaced forces the browser to lay the whole picture out again, and at
  // 20,000 events that one call was a third of a wheel notch (STATUS.md,
  // "what the graph's notch actually costs").
  const view = () => {
    const box = visibleBox();
    return {
      x0: (box.x0 - transform.x) / transform.k,
      y0: (box.y0 - transform.y) / transform.k,
      x1: (box.x1 - transform.x) / transform.k,
      y1: (box.y1 - transform.y) / transform.k,
    };
  };
  // Client coordinates into the coordinates of the viewBox, through the
  // SVG's own matrix: the element is letterboxed inside its box, so scaling
  // by the bounding rectangle would be a few units out — enough to miss a
  // node in a picture where a year is eight units wide.
  const toSvg = (e) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(root.getScreenCTM().inverse());
    return [p.x, p.y];
  };
  // And from there into the graph's own coordinates, under the pan and zoom.
  const toGraph = (e) => {
    const [x, y] = toSvg(e);
    return [(x - transform.x) / transform.k, (y - transform.y) / transform.k];
  };
  // Put a point in the middle of the view at a given zoom, clamped to the
  // limits. What opening a stack does, and the same move the map makes.
  // The stretch is left where it is: opening a stack is a move in `k`, and a
  // picture that also widened under the click would have parted the stack by
  // moving it out from under the pointer that asked.
  const zoomTo = (point, wanted) => {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, wanted));
    transform = {
      ...transform, k, x: laid.width / 2 - point.x * k, y: laid.height / 2 - point.y * k,
    };
    applyTransform();
    render(state.get());
  };

  let drag = null;
  // The drag is over by the time the click arrives, so whether it moved has
  // to outlive it — the same guard the map needs (STATUS.md, deviation 34).
  let dragged = false;
  const capture = (method, pointerId) => {
    try {
      root[method](pointerId);
    } catch {
      // No such pointer any more; nothing to capture or release.
    }
  };
  root.addEventListener('pointerdown', (e) => {
    drag = { start: toSvg(e), origin: { ...transform }, moved: false, pointerId: e.pointerId };
    dragged = false;
  });
  root.addEventListener('pointermove', (e) => {
    // Not dragging: the pointer is asking what a mark is called. Since M77 a
    // mark whose name did not fit carries no label at all, so this is how the
    // reader gets it back — and it is one element written and rubbed out, not
    // a redraw (`hoverLabel` returns at once when the mark has not changed).
    if (!drag) {
      if (stacked) hoverLabel(nearestStack(e));
      return;
    }
    const [x, y] = toSvg(e);
    const dx = x - drag.start[0];
    const dy = y - drag.start[1];
    if (Math.abs(dx) + Math.abs(dy) > 2 && !drag.moved) {
      drag.moved = true;
      // Captured only once the press becomes a drag: capturing at the press
      // retargets the click to the root and no node could be selected.
      capture('setPointerCapture', drag.pointerId);
    }
    transform = { ...transform, x: drag.origin.x + dx, y: drag.origin.y + dy };
    applyTransform();
  });
  root.addEventListener('pointerup', () => {
    if (drag?.moved) capture('releasePointerCapture', drag.pointerId);
    dragged = drag?.moved ?? false;
    drag = null;
  });
  // **A notch widens time by more than it grows the picture** (M81). One
  // gesture, two numbers: `k` is the zoom, and `s` is how much wider than the
  // arrangement time is drawn, each clamped to its own limits (stretch.js). The
  // point under the pointer stays under it in both directions, which is why the
  // two translations are computed from two ratios — the horizontal from the
  // magnification `k * s`, which is what the drawing is actually scaled by
  // across, and the vertical from `k` alone.
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [x, y] = toSvg(e);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.k * factor));
    const s = stretchStep(transform.s, factor);
    const across = (k * s) / (transform.k * transform.s);
    const down = k / transform.k;
    transform = {
      k, s, x: x - (x - transform.x) * across, y: y - (y - transform.y) * down,
    };
    exactZoom = false;
    applyTransform();
    render(state.get());
  }, { passive: false });
  root.addEventListener('dblclick', () => {
    transform = {
      x: 0, y: 0, k: 1, s: 1,
    };
    exactZoom = false;
    applyTransform();
    render(state.get());
  });

  // Which mark a pointer means is decided by distance, not by which circle
  // happens to be on top. Two adjacent years are about eight units apart
  // here, and a mark or its stroke covering a neighbour's centre would have
  // made that neighbour unreachable at rest — the nearest centre inside the
  // reach is always the one the reader aimed at. One answer for the click and
  // for the hover, so the mark that is named is the mark that would open.
  function nearestStack(e) {
    const [x, y] = toGraph(e);
    const reach = HIT_RADIUS / transform.k;
    let best = null;
    let distance = Infinity;
    for (const stack of stacked.nodes) {
      const d = Math.hypot(stack.x - x, stack.y - y);
      if (d < distance || (d === distance && best && stack.key < best.key)) {
        best = stack;
        distance = d;
      }
    }
    return best && distance <= reach ? best : null;
  }

  // And which *line* a pointer means, asked only once every node has said no
  // (M80). The same idiom as `nearestStack` and for the same reason: a line is
  // a stroke a pixel or two wide, and hit-testing the element would make
  // choosing one a test of the reader's aim. Distance from the point to the
  // segment, nearest wins, ties by key so the answer is the same on every
  // machine.
  //
  // **Only a line that stands for one link.** A line drawn between two stacks
  // may carry several links (cluster.js, `mergeEdges`), and those members are
  // collinear by construction — there is nothing in the picture that could say
  // which of them the reader aimed at. Zooming in parts the stacks and the
  // line becomes one link, which is the same answer the map gives for a
  // cluster of marks.
  function nearestLine(e) {
    if (!stacked) return null;
    const [x, y] = toGraph(e);
    const reach = EDGE_HIT_RADIUS / transform.k;
    let best = null;
    let distance = Infinity;
    for (const line of stacked.edges) {
      if (line.members.length !== 1) continue;
      const d = distanceToSegment(x, y, line.x1, line.y1, line.x2, line.y2);
      if (d < distance || (d === distance && best && line.key < best.key)) {
        best = line;
        distance = d;
      }
    }
    return best && distance <= reach ? best : null;
  }

  root.addEventListener('pointerleave', () => hoverLabel(null));

  root.addEventListener('click', (e) => {
    // A drag that ends over a node must not select it; the flag is cleared
    // here, once this click has been judged, so the next clean one selects.
    if (dragged) {
      dragged = false;
      return;
    }
    const best = nearestStack(e);
    if (!best) {
      // The owner, 22 September: *"In the graph I should be able to select a
      // connection the same way I select an event."* A node first and always —
      // the events are what the picture is of — and the lines underneath them
      // when no node is near enough to have been meant.
      const line = nearestLine(e);
      if (line) chooseEdge(line.members[0].id);
      return;
    }
    if (best.count === 1) {
      select(best.representative.id);
      return;
    }
    openStack(best);
  });

  // A line is a control, so it answers Enter and Space, exactly as a mark on
  // the map has since M63. It is a `<line>` and not a `<button>`, so neither
  // key is free.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest?.('[data-edge]');
    if (!el) return;
    e.preventDefault();
    chooseEdge(el.getAttribute('data-edge'));
  });

  // A stack of nodes drawn as one, clicked. The members go to the panel
  // whatever happens — the list is the only way to reach one of them by name,
  // and the only way at all when zooming cannot part them — and a stack that
  // zooming *can* part is opened by going straight to the zoom where it does,
  // rather than peeling one neighbour off per click. Exactly the map's move.
  function openStack(stack) {
    if (onCluster) {
      onCluster({
        key: stack.key,
        on: 'graph',
        count: stack.count,
        coincident: stack.coincident,
        representative: { id: stack.representative.id, event: stack.representative.event },
        members: stack.members.map((m) => ({ id: m.id, event: m.event })),
        lane: laid.bands.find((b) => b.id === stack.lane) ?? null,
        years: stack.years,
      });
    }
    if (!stack.splittable) return;
    // And that zoom is not rounded to a bucket when the stack named one:
    // `coreZoom` is the zoom at which this stack comes apart, and the bucket
    // below it is a zoom that does not (review of the health plan, finding
    // 12).
    exactZoom = stack.coreZoom !== null && stack.coreZoom !== undefined;
    zoomTo(stack.centre, Math.max(stack.coreZoom ?? 0, transform.k * CLUSTER_ZOOM_STEP));
  }

  // Clicking on a consequence of the selected event walks the chain; clicking
  // anywhere else starts afresh. The rule was written here first and lives in
  // chain.js now, so the map and the timeline answer the same click the same
  // way (health review B, finding 10).
  const select = (id) => walkOrSelect(state, atlas, id);

  // Which link the keyboard is on, and putting it back after a redraw. By the
  // link's own id and not by the element: the elements are all replaced.
  const focusedEdgeId = () => {
    const active = root.ownerDocument?.activeElement;
    return active && root.contains(active) && active.hasAttribute?.('data-edge')
      ? active.getAttribute('data-edge') : null;
  };
  const restoreEdgeFocus = (id) => {
    if (id === null) return;
    for (const el of edgesGroup.querySelectorAll('[data-edge]')) {
      if (el.getAttribute('data-edge') === id) {
        el.focus?.({ preventScroll: true });
        return;
      }
    }
  };

  // And choosing a line, which is the other thing this view can be asked. It
  // sets one field and clears none: a link is read, not walked, so the window,
  // the chain, the lens and the selection are all exactly where the reader
  // left them and the picture does not narrow (M80).
  const chooseEdge = (id) => {
    if (id) state.set({ edge: id });
  };

  // There was a note here, a paragraph wide across the top of the picture,
  // saying that the map is looking at part of the world and the graph has no
  // viewport of its own. It went in M77. It was drawn whenever `?bbox=` was in
  // the state — which is after any pan or zoom of the map, so most visits —
  // and it answered a question about the lanes that used to run under the map
  // and have been a view of their own since M60. The owner, 21 September,
  // pointing at it in a screenshot of a narrative: it is not what the reader
  // asked about. What the map is looking at is said in the masthead, where the
  // count of events in view has been since M60.

  container.append(root);
  container.append(waiting);
  container.append(exportButton(root, 'graph'));
  container.append(edgeKey());

  // --- when the graph is drawn again ---------------------------------------
  //
  // The whole state, plus the transform and the rectangle on screen — the
  // zoom decides what is stacked and what is named, and neither is state
  // (render-key.js). The arrangement has a key of its own above: this one
  // says whether the picture has to be drawn, that one whether the nodes
  // have to be laid out again.
  let drawnFor = null;

  function render(s, { force = false } = {}) {
    // The arrangement first and always: it is what `laid` is, and it is laid
    // out again whenever its own key moves, whatever this one says. Only the
    // drawing is skipped, and only of a picture already on screen.
    const arranged = arrange(s);
    // And there is no picture at all until the first arrangement lands, which
    // it does on this turn at every size this atlas has held (layout-runner).
    if (!laid) return;
    // Then where the camera stands, which is not one of the reader's gestures.
    // The rectangle on the screen is what a frame is computed against and does
    // not move with the camera, so it is measured first and the rectangle in
    // the graph's own coordinates read off it afterwards, under the transform
    // this may have just changed.
    frameCamera(s, visibleBox());
    // The axis is drawn in the picture's own coordinates, so a stretch moves
    // every tick: it is redrawn here rather than in `adopt`, which runs before
    // the camera has said what the stretch is.
    if (axisAt !== transform.s) drawFrame();
    const box = view();
    const key = renderKey(s, transform.x, transform.y, transform.k, transform.s, shardsArrived(atlas),
      Math.round(box.x0), Math.round(box.y0), Math.round(box.x1), Math.round(box.y1));
    if (!force && !arranged && key === drawnFor) return;
    drawnFor = key;
    draw(s, box);
  }

  // `box` is the rectangle on screen, measured by `render` before the drawing
  // is touched. A default for the one caller that has no measurement of its
  // own to hand: the fixture-free tests that call `draw` through `render`
  // always pass one.
  function draw(s, box = view()) {
    // **The window is not this picture's business** (M76). The owner, 21
    // September: *"I think the graph can always show all dates, then one can
    // zoom in and out and pan to look at different times."* So there is no
    // band shaded across the drawing, nothing is drawn faded for falling
    // outside one, and the arrangement is every event of `shown` whatever the
    // band says (arrangement.js). The window is still state — the map and the
    // timeline read it — and this view simply does not ask.
    // What the reader is working with, from the one place that decides it
    // (emphasis.js): the same sets the map and the timeline draw, so a fourth
    // picture is a fourth reader of that function and not a fourth copy.
    // Once per state, because the arrangement had to ask for it too.
    const working = workingOf(s);
    const chainEdges = walkedEdges(atlas, s.chain);
    const pathIds = new Set([...working.path, ...working.selected]);
    const chainEdgeIds = new Set(chainEdges.map((e) => e.id));
    const consequences = s.selected ? (atlas.adjacency.out.get(s.selected) ?? []) : [];
    const consequenceIds = new Set(consequences.map((e) => e.id));

    // The other branches that fed the selected event; their *edges* are what
    // this view draws, and emphasis.js has already answered which events they
    // are, so the picture and the panel's list cannot disagree.
    const converging = working.converging;
    const convergingEdges = new Set();
    if (s.selected && atlas.events.has(s.selected)) {
      for (const branch of convergence(atlas.adjacency, s.selected, [...pathIds])) {
        convergingEdges.add(branch.edge.id);
      }
    }

    // The same lens the arrangement was built from; what it kept is drawn
    // one event to a node — the focus set in full, and the direct causes and
    // consequences around it faintly (lens.js).
    // What the lens itself names, or null at rest: since M77 it is what says
    // which lines are in ink and which marks are labelled.
    const lensFocus = working.lensFocus;
    const lensNear = working.lensNear;
    const actorIds = working.actor;
    // The whole of an open narrative's walk: where it is going, not only
    // where the reader has got to.
    const narrativeIds = working.narrative;
    // What the selected event had led to by the horizon year, faded by how
    // far out it is. Empty unless the reader chose a year (horizon.js).
    const reachable = working.reachable;

    const k = transform.k;

    // Everything the reader is currently working with keeps a node of its
    // own. The map has drawn its marks alone for the same reason since M7:
    // a chain that vanished into a stack would be worse than no stack at
    // all, and the answer to "what else fed this" cannot be inside a mark
    // that does not say so.
    const alone = alonesOf(s);

    // What is laid out is what is drawn: since H4b the arrangement covers the
    // window, one period either side of it, and whatever the reader is
    // holding beyond that (arrangement.js) — which is exactly the rule this
    // line used to apply afterwards to a layout of the whole corpus. Moving
    // the band therefore moves the nodes now, and the cache above is what
    // gives the reader their picture back when they move it home again.
    //
    // The stacking is kept by the same three things it depends on: which
    // arrangement, how far in, and what may not be swallowed. A wheel notch
    // that returns to a zoom already seen redraws rather than re-clusters.
    //
    // One level of detail, M25's geometric one. There were two until M70: a
    // *semantic* fold drew an event's parts inside it while the reader was
    // zoomed out, and M65 left it dead — at rest there are no parts in the
    // picture to fold, and inside a lens M25's never-hide rule holds
    // everything the lens kept out of any fold. What it said, *there is more
    // inside this one*, the resting rule says by hiding the parts and the
    // ring (M30c) says on the mark.
    //
    // And the zoom it is filed under is the bucket below the one the picture
    // is drawn at, as the map's grouping has been since H4a: what decides a
    // stacking is the threshold D / k, so what matters is the ratio between
    // two zooms and not the difference (cluster.js, `zoomBucket`). Sixteen
    // buckets to the octave, so no bucket is more than about 4.4 % of
    // threshold wide; a wheel notch is ×1.16 and never lands in the bucket it
    // left, but the way back does, and so do a trackpad's small deltas and
    // every animation between two zooms. `exactZoom` is this view saying the
    // zoom in force was chosen to part a stack, and a bucket below it would
    // not part it.
    //
    // The stretch is the fourth thing it depends on and it is not bucketed
    // (M81): it decides where a mark is drawn and not only which marks there
    // are, so a bucket of it would be the picture jumping sideways by four per
    // cent every time the wheel crossed one. It costs nothing that the zoom did
    // not already cost — a notch leaves the zoom's bucket too — and a pan,
    // which moves neither, still redraws without restacking.
    const groupAt = exactZoom ? k : zoomBucket(k);
    const stackKey = `${laidFor}|${groupAt}|${transform.s}|${holdingKey(s)}`;
    stacked = stackings.get(stackKey)
      ?? stackings.set(stackKey, stackLayout(laid, { k: groupAt, alone, stretch: transform.s }));
    // What is worth putting in the DOM. The map has drawn only the marks
    // inside its viewport since H4a; the graph drew every stack of the whole
    // arrangement at every notch, and at 20,000 events that is 24,310
    // elements to build, insert and lay out for a picture of which two
    // thirds are off the screen (STATUS.md, "what the graph's notch actually
    // costs"). The rectangle is already in this view's render key, so a pan
    // redraws and the cull can never leave a stale picture behind.
    //
    // The selected event keeps its mark wherever it is, exactly as it does on
    // the map: it is what the panel is showing, and the picture must not
    // disagree with the panel about whether the thing exists. The rest of the
    // working set is drawn when it is on screen — being drawn alone rather
    // than inside a stack (M25's never-hide rule, `alone` above) is a
    // question about stacking and is untouched by this.
    const drawable = (stack) => Boolean(stack) && (stack.representative.id === s.selected
      || onScreen(stack.x, stack.y, box, DRAW_MARGIN / k));
    const radiusOf = new Map(stacked.nodes.map((stack) => [
      stack.key,
      stack.representative.id === s.selected
        ? SELECTED_RADIUS
        : radiusFor(stack.representative.weight, weights) + (stack.count > 1 ? STACK_BONUS : 0),
    ]));

    // One line per pair of marks. A line carrying several links is drawn in
    // the commonest of their types, heavier for how many it carries, and
    // inked as the least sure of them — a bundle one of whose links
    // historians argue about is a bundle the reader must not read as settled
    // (cluster.js, and confidence.js for all three levels of it).
    const stackByKey = new Map(stacked.nodes.map((stack) => [stack.key, stack]));
    // Every line is drawn again on every render, so a line activated from the
    // keyboard would take the focus back to the document with it. What was
    // focused is remembered by the link it names and given back once the new
    // lines exist — the map's marks have done exactly this since M63
    // (map/layers/events.js, `focusedKey`).
    const focusedEdge = focusedEdgeId();
    edgesGroup.replaceChildren();
    for (const line of stacked.edges) {
      // A line is drawn when either of its ends is: an arrow into the view
      // from a cause off the left of it is half the point of the picture, and
      // one whose both ends are outside it is a line across a rectangle it
      // never enters (index2 review, finding 11's amendment).
      if (!drawable(stackByKey.get(line.from)) && !drawable(stackByKey.get(line.to))) continue;
      const any = (ids) => line.members.some((m) => ids.has(m.id));
      // **With a lens on, the lens's own links are the ones in ink** (M77).
      // A line between two events the lens merely reaches is drawn faintly,
      // with the very class the ring's marks already carry — the owner, 21
      // September: *"It looks clouded."* Two thirds of the lines on the page
      // with a narrative open are not the walk (STATUS.md, the measurement),
      // and they were drawn in the same five patterns and three inks as the
      // argument running under them. At rest there is no lens and no line is
      // faint: nothing has been asked, so nothing is the answer.
      const ofLens = lensFocus === null
        || line.members.every((m) => lensFocus.has(m.from) && lensFocus.has(m.to));
      // The one the reader has chosen, drawn as chosen (M80): madder over the
      // picture, which is what the walked chain is drawn in and what the
      // selected mark is filled with — the accent means *this is the one you
      // are holding*, and a link being read is one of those.
      const chosen = s.edge !== null && line.members.some((m) => m.id === s.edge);
      const marks = classes(
        `type-${line.type}`,
        bundleClass(line.members),
        ofLens ? '' : 'lens-near',
        any(chainEdgeIds) ? 'chain' : '',
        any(consequenceIds) ? 'consequence' : '',
        any(convergingEdges) ? 'converging' : '',
        line.count > 1 ? 'merged' : '',
        chosen ? 'chosen' : '',
      );
      const cls = classes('edge', marks);
      // The line stops short of the mark it points at, so the arrowhead is
      // not buried under it.
      const dx = line.x2 - line.x1;
      const dy = line.y2 - line.y1;
      const length = Math.hypot(dx, dy) || 1;
      const back = (radiusOf.get(line.to) + 1.5) / k;
      const tipX = line.x2 - (dx / length) * back;
      const tipY = line.y2 - (dy / length) * back;
      // The weight of a merged line is a custom property rather than a
      // stroke-width, so the stylesheet keeps deciding how a line is drawn
      // and this only says how many it carries.
      const weight = line.count > 1 ? { style: `--merged-width: ${mergedWidth(line.count).toFixed(2)}` } : {};
      // A line that stands for one link is a control: it carries the link's
      // id, takes the focus and answers Enter (M80, and M63 for the marks it
      // follows). A line carrying several is not — there is no way to say
      // which of them the reader means, so it keeps the title it had and
      // parting the stacks is what makes it one link.
      const one = line.members.length === 1 ? line.members[0] : null;
      const name = one ? edgeName(atlas, one) : null;
      const title = one
        ? svgTitle(name)
        : svgTitle(`${line.count} links, mostly ${line.type}${line.disputed ? ', one of them disputed' : ''}`);
      const control = one
        ? { 'data-edge': one.id, tabindex: '0', role: 'button', 'aria-label': name }
        : {};
      edgesGroup.appendChild(svg(
        'line',
        {
          x1: line.x1, y1: line.y1, x2: tipX, y2: tipY, class: cls, ...weight, ...control,
        },
        [title],
      ));
      // The arrowhead is drawn rather than a marker, so it carries the same
      // classes as its line and fades, dashes and reddens with it.
      const ux = dx / length;
      const uy = dy / length;
      const baseX = tipX - ux * (HEAD_LENGTH / k);
      const baseY = tipY - uy * (HEAD_LENGTH / k);
      const wx = (-uy * HEAD_WIDTH) / 2 / k;
      const wy = (ux * HEAD_WIDTH) / 2 / k;
      edgesGroup.appendChild(svg('polygon', {
        points: `${tipX},${tipY} ${baseX + wx},${baseY + wy} ${baseX - wx},${baseY - wy}`,
        class: classes('edge-head', marks),
      }));
    }
    restoreEdgeFocus(focusedEdge);

    nodesGroup.replaceChildren();
    let selectedMark = null;
    for (const stack of stacked.nodes) {
      if (!drawable(stack)) continue;
      const node = stack.representative;
      const radius = radiusOf.get(stack.key);
      if (stack.count > 1) {
        const nearest = Math.min(...stack.members.map((m) => reachable.get(m.id) ?? Infinity));
        const hidden = stack.count - 1;
        const span = stack.years.min === stack.years.max
          ? formatYear(stack.years.min)
          : `${formatYear(stack.years.min)}–${formatYear(stack.years.max)}`;
        nodesGroup.appendChild(svg('circle', {
          cx: stack.x, cy: stack.y, r: radius / k,
          class: classes('node', 'stack', stack.coincident ? 'coincident' : 'splittable',
            stack.members.every((m) => lensNear.has(m.id)) ? 'lens-near' : '',
            Number.isFinite(nearest) ? `in-horizon ${horizonBand(nearest)}` : ''),
          'data-stack': stack.key,
        }, [svgTitle(`${labelOf(atlas, node.event) ?? LOADING_LABEL} — and ${hidden} more event${hidden === 1 ? '' : 's'} here, ${span}`)]));
        nodesGroup.appendChild(textNode(`+${hidden}`, {
          x: stack.x + (radius + 2) / k,
          y: stack.y - (radius + 1) / k,
          class: 'cluster-count',
          'font-size': BADGE_SIZE / k,
        }));
        continue;
      }
      const isSelected = node.id === s.selected;
      const cls = classes(
        'node',
        lensNear.has(node.id) ? 'lens-near' : '',
        reachable.has(node.id) ? `in-horizon ${horizonBand(reachable.get(node.id))}` : '',
        narrativeIds && narrativeIds.has(node.id) ? 'of-narrative' : '',
        actorIds && actorIds.has(node.id) ? 'of-actor' : '',
        converging.has(node.id) ? 'converging' : '',
        pathIds.has(node.id) ? 'on-path' : '',
        isSelected ? 'selected' : '',
      );
      // The node is drawn out of the core; what it is called arrives with its
      // century, and until then it is a node with no name (attributes.js).
      const name = labelOf(atlas, node.event);
      const title = name === null ? LOADING_LABEL
        : `${name} — ${formatInterval(node.event.when)}`;
      // The stack's own point and not the node's. They were the same number
      // until M81 — a stack of one is drawn on its only member — and they are
      // not any more: `stackLayout` returns the picture's coordinates, with
      // time stretched, and `representative` is the arrangement's node, which
      // never moves.
      const mark = svg('circle', {
        cx: stack.x, cy: stack.y, r: radius / k, class: cls, 'data-id': node.id,
      }, [svgTitle(title)]);
      nodesGroup.appendChild(mark);
      // An event with parts carries the ring at every zoom (m30c-brief, §1),
      // and since M70 it is the whole of what says *there is more inside this
      // one* on the graph: the fold that used to draw a count beside it is
      // gone, and the parts are in the picture when the reader opens the
      // event and out of it when they do not. Not a control — no `data-id` —
      // so a click still lands on the node and opens the one record.
      if (isParent(atlas, node.event)) {
        nodesGroup.appendChild(svg('circle', {
          cx: stack.x, cy: stack.y, r: (radius + RING_GAP) / k, class: ringClasses(cls, 'node'),
          'stroke-width': RING_WIDTH / k,
        }));
      }
      if (isSelected) selectedMark = mark;
    }
    if (selectedMark) nodesGroup.appendChild(selectedMark);

    drawLabels(s, k, box, working);
  }

  // Which marks are named, and where each name goes: `labels.js`, purely.
  // What this function does is ask it and build the text.
  //
  // **A name is drawn whole or it is not drawn at all** (M77). It used to be
  // cut to the room beside its mark, and eight of the fourteen names on the
  // page with a narrative open were `The Ab…`, `The Rev…`, `Dutch B…` — ink
  // where a name should be. A name that does not fit waits for the reader's
  // pointer, which is what the mark's title has always carried.
  //
  // **With a lens on, the lens is what is named.** A lens is a question the
  // reader asked and the ring around it is context: the walk of an open
  // narrative is named in the narrator's own order, first step first, so the
  // room a crowded picture has goes to the argument rather than to whichever
  // neighbour happens to weigh most.
  //
  // **And at rest, M77's rule reaches the resting picture too** (M82, A1). It
  // did not: at rest fourteen marks were offered a name, each capped to M61's
  // slice of the width and allowed two lines either side of its own — so the
  // reviewer's first screen of the graph was "some two hundred unlabelled
  // circles" with a dozen names among them. There is no reason for the
  // difference. The resting picture is a set somebody is looking at exactly as
  // a lens is; the field above and below a mark is as free in one as in the
  // other; and the rule that makes a crowded picture legible — *whole or not at
  // all, on a nearby free line, and the pointer for what is left* — is the same
  // rule. So every mark on screen is offered its name, uncapped, with the
  // room a lens has. What still cannot be written whole is what the hover
  // label is for, and that is unchanged.
  //
  // The order is unchanged too: heaviest first at rest, so a picture that
  // cannot hold every name holds the names that carry the most of the atlas.
  function drawLabels(s, k, box, working) {
    labelsGroup.replaceChildren();
    const onScreen = stacked.nodes.filter((n) => n.x >= box.x0 && n.x <= box.x1 && n.y >= box.y0 && n.y <= box.y1);
    const focus = working.lensFocus;
    const order = working.narrative ? [...working.narrative] : null;
    const candidates = naming(onScreen, { focus, order, limit: LABEL_LIMIT, all: true })
      .map((node) => ({ node, name: labelOf(atlas, node.representative.event) }))
      // No name yet is no label, and the next node still gets its own.
      .filter((c) => c.name !== null);
    // Neither picture is capped by M61's slice any more: a name is written
    // whole or not at all, and a cap on how wide "whole" may be is a second
    // answer to a question `placeOne` has already answered honestly.
    const placed = placeLabels(candidates, {
      k,
      gap: LABEL_GAP,
      view: box,
      capped: false,
      rows: LENS_ROWS_AWAY,
    });
    named = new Set(placed.map((p) => p.node.key));
    for (const { node, text, rect } of placed) {
      // A label that had to be written on another line is tied back to its
      // mark by a hairline. It is what buys the room: 22 of a 28-step walk sit
      // on one line of the layout with the whole field free above and below,
      // and a name on a line of its own with a leader under it is legible
      // where a name cut to six letters is not. Nothing at all when the label
      // is where it has always been, which is every label at rest.
      if (movedAway(node, rect, k)) {
        labelsGroup.appendChild(svg('line', {
          x1: node.x + (rect.right ? 1 : -1) * (MAX_RADIUS / k),
          y1: node.y,
          x2: rect.x - (rect.right ? 1 : -1) * (1 / k),
          y2: rect.y,
          class: 'label-leader',
        }));
      }
      labelsGroup.appendChild(textNode(text, {
        x: rect.x, y: rect.y + (LABEL_SIZE * 0.35) / k,
        class: classes('node-label', node.representative.id === s.selected ? 'selected' : ''),
        'text-anchor': rect.right ? 'start' : 'end',
        'font-size': LABEL_SIZE / k,
      }));
    }
  }

  // --- the name under the pointer -------------------------------------------
  //
  // What is not always visible has to be findable, or taking it away is just
  // taking it away. A mark with no drawn label is named while the pointer is
  // on it: one label, in a layer of its own over everything, whole, and gone
  // when the pointer moves off. It is drawn outside `render` and is in no
  // render key — it is not a fact about the picture, it is the reader's finger.
  let named = new Set();
  let hovering = null;
  function hoverLabel(stack) {
    if (stack?.key === hovering) return;
    hovering = stack?.key ?? null;
    hoverGroup.replaceChildren();
    if (!stack || named.has(stack.key)) return;
    const name = labelOf(atlas, stack.representative.event);
    if (name === null) return;
    const k = transform.k;
    const found = placeOne(name, stack, { k, gap: LABEL_GAP, view: view(), capped: false })
      // Nowhere clear to write it is still written: the reader is pointing at
      // this mark and at no other, so there is nothing for it to be confused
      // with. Its halo is what keeps it readable over whatever is under it.
      ?? { text: name, right: true, rect: labelBoxAt(stack, name, true, { k, gap: LABEL_GAP }) };
    hoverGroup.appendChild(textNode(found.text, {
      x: found.rect.x, y: found.rect.y + (LABEL_SIZE * 0.35) / k,
      class: 'node-label hovered',
      'text-anchor': found.right ? 'start' : 'end',
      'font-size': LABEL_SIZE / k,
    }));
  }

  // --- where the camera starts ----------------------------------------------
  //
  // Not a gesture and not in the URL: a link carries the picture its sender
  // saw, and the reader's own pan and zoom are theirs to keep. One rule now,
  // where there were two.
  //
  // **The camera fits what is drawn.** At rest that is the whole of `shown`,
  // and with a lens on it is the lens (M74). Until M76 the resting camera was
  // the *window's* — the first drawing zoomed to a narrow band so that a
  // reader arriving on one did not have to hunt for it (deviation 54). The
  // owner, 21 September: *"I think the graph can always show all dates, then
  // one can zoom in and out and pan to look at different times."* A camera
  // that opened on the band would be the window deciding the picture by the
  // back door, so it opens on the picture and the reader pans.
  //
  // The graph draws what falls inside the rectangle on screen and nothing else
  // (I6's cull), so the opening rectangle decides what a reader sees — and
  // where the layout happens to put a walk is a fact about the arrangement,
  // not about the question. Two thirds of the owner's twelve-step argument
  // about the colonial war fell outside that rectangle and were not in the
  // picture at all, while the map and the timeline, which have no camera, went
  // on drawing every step. The frame is offered a lens widest first —
  // everything it draws, then the focus alone — so an event chosen with a
  // small ring is framed with its ring and one whose ring is wider than the
  // pane is framed on the event (frame.js). At rest there is one set to offer
  // and it is everything.
  //
  // The key is the arrangement's own, which already carries the lens as it is
  // *applied* and not as it is written (arrangement.js): a new question, or a
  // new arrangement of the same one, frames again, and a pan, a zoom or a
  // click inside the lens does not. Since M76 the band is not in that key at
  // all, so moving it re-fits nothing — which is the same promise the old
  // resting case made by collapsing its key to one string, kept now for the
  // whole of the view rather than for half of it.
  //
  // **The rectangle itself is in that key**, and it has to be: a frame is a
  // set of nodes put inside a rectangle, and one measured against a rectangle
  // that no longer exists is not a frame of anything. The first drawing of a
  // view lands before the pane has settled — the masthead wraps, the panel
  // takes its remembered width — and a walk framed to a pane 30 px taller than
  // the one it ends in loses its outermost steps off the bottom. The observer
  // at the end of this file throws the measurement away when the pane changes
  // size; keying on what was measured, rather than on the size read live off
  // the element, is what makes the next drawing act on it.
  let framedFor = null;
  function frameCamera(s, seen) {
    const working = workingOf(s);
    // **The question and not the whole arrangement key** (M83). The key carries
    // the attribute-shard count since A1-2, because a century landing carries
    // the days the nodes stand on; the camera must not move for that. What
    // frames again is a new question — a lens set or cleared, a filter, a
    // category — which is `question` (arrangement.js).
    const key = `${askedFor}|${seen.x0},${seen.y0},${seen.x1},${seen.y1}`;
    if (key === framedFor) return;
    // Whether this is the first camera this arrangement has been given, which
    // is the whole of what the chosen link may decide (M80). A reader who
    // *arrives* on `?edge=` has not seen the picture yet and the two ends are
    // what they came for; a reader who **clicks** a line is looking straight
    // at it, and a camera that jumped on the click would move the picture out
    // from under the gesture that chose it. So the ends frame the drawing they
    // open and never one already on screen — which is also why the link is not
    // in the key above: a click changes nothing this function decides.
    const arriving = framedFor === null || !framedFor.startsWith(`${askedFor}|`);
    framedFor = key;
    // And what that frame is: the link's own two ends and nothing else. The
    // card names them, and a camera that left one of them off the screen would
    // be the picture disagreeing with the card. It is the only set offered,
    // because the widest that fits wins and the whole picture fits at the
    // floor — the rule that makes a lens frame the lens.
    const ends = arriving && s.edge ? atlas.edges.get(s.edge) : null;
    // Widest first, and at rest there is only the widest: everything drawn.
    // `MIN_ZOOM` is the floor, so a picture too large for the pane is drawn as
    // far out as the graph goes and the reader pans for the rest — which is
    // what the owner's sentence asks for.
    const wanted = ends
      ? [new Set([ends.from, ends.to])]
      : working.lens
        ? [working.shown, working.lensFocus].filter(Boolean)
        : [working.shown];
    // Two fits and not one since M81: `FIT_ZOOM` is still as far in as the
    // camera will go on its own, and it is the height's — what the stacks are
    // fitted to. `STRETCH_CAP` is the cap on the other one, the width the time
    // extent is fitted to (frame.js, stretch.js).
    const at = frameFor(laid.nodes, wanted, seen, {
      min: MIN_ZOOM, max: FIT_ZOOM, pad: FRAME_PAD, maxStretch: STRETCH_CAP,
    });
    // A set the arrangement holds no node of leaves the camera alone: there is
    // nothing to frame, and a frame of nothing would be a number invented.
    if (!at) return;
    transform = at;
    exactZoom = false;
    applyTransform();
  }

  // A pane that has changed size shows a different rectangle of the picture,
  // and that rectangle decides what is drawn: the measurement above is thrown
  // away and the graph is drawn again. The same observer the map keeps, with
  // the same guard against the size that has not actually changed.
  if (typeof ResizeObserver !== 'undefined') {
    let last = '';
    new ResizeObserver(() => {
      const now = `${container.clientWidth}x${container.clientHeight}`;
      if (now === last) return;
      last = now;
      measured = null;
      render(state.get());
    }).observe(container);
  }

  state.subscribe(render);
  render(state.get());
  return { render, layout: laid, drawn: () => stacked };
}

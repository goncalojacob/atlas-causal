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
import { overlaps, resolveWindow } from '../util/window.js';
import { convergence } from '../graph.js';
import { horizonSet, horizonBand } from '../horizon.js';
import { narrativeSet } from '../narrative.js';
import { lensSet } from '../lens.js';
import { lanesFor } from '../lanes.js';
import { layoutGraph, stackLayout, MIN_ZOOM, MAX_ZOOM } from './layout.js';
import { exportButton } from '../share.js';

// Sizes in SVG units at k = 1; divided by k when drawn, so a node keeps its
// size on screen at any zoom, as the map's marks do.
const MIN_RADIUS = 4;
const MAX_RADIUS = 6.5;
// How far from a node's centre a click still means that node.
const HIT_RADIUS = 8;
const SELECTED_RADIUS = 7.5;
// A stack is a little larger than the node it is drawn on, and CSS gives it a
// heavier ring: the reader has to be able to tell one mark from many at a
// glance, as they can on the map.
const STACK_BONUS = 1.2;
const HEAD_LENGTH = 7;
const HEAD_WIDTH = 4.5;
const LABEL_SIZE = 11;
const LABEL_CHARS = 28;
// What fits in the left gutter a band label is written in.
const BAND_LABEL_CHARS = 12;
// Below this zoom only the heaviest nodes on screen are named; at or above
// it every node on screen is, which at sixty events is all of them.
const LABEL_ALL_ZOOM = 2;
const LABEL_LIMIT = 14;
const BADGE_SIZE = 10;
// How much heavier a merged line is drawn. Logarithmic, so a line carrying
// twenty links is thicker than one carrying two without being a ribbon:
// weight here says "several", not "exactly n" — the count is in the title.
const MERGED_BASE = 1.6;
const MERGED_STEP = 1.1;
const mergedWidth = (count) => MERGED_BASE + Math.log2(count) * MERGED_STEP;
// One notch of the wheel, for the click that opens a stack no zoom quite
// parts: never less than this much further in.
const CLUSTER_ZOOM_STEP = 1.2;
// As far as the first drawing will zoom to a narrow window on its own, and
// the share of the data a window has to be under before it zooms at all.
const FIT_ZOOM = 2;
const FIT_SHARE = 0.6;

function textNode(text, attrs) {
  const el = svg('text', attrs);
  el.textContent = text;
  return el;
}

function shorten(text, chars = LABEL_CHARS) {
  return text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text;
}

// Weight decides size only within a small range: the graph is about the
// links, and a node four times the size of its neighbour would be an
// argument the data does not make.
function radiusFor(weight, weights) {
  if (weights.max === weights.min) return MIN_RADIUS;
  const t = (weight - weights.min) / (weights.max - weights.min);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

function classes(...list) {
  return list.filter(Boolean).join(' ');
}

// The key to the five line patterns, in the corner of the view that uses
// them. Drawn with the very same classes the edges are drawn with, so the
// key cannot come to disagree with the picture; about.html carries the same
// six lines for the same reason. Outside the SVG, so panning and zooming
// leave it where it is.
export function edgeKey() {
  const box = document.createElement('div');
  box.className = 'graph-key';
  const line = (type, extra = '') => `<svg class="graph key-line" viewBox="0 0 62 12" aria-hidden="true">
      <line class="edge type-${type} ${extra}" x1="1" y1="6" x2="50" y2="6"/>
      <polygon class="edge-head type-${type}" points="60,6 50,3 50,9"/></svg>`;
  box.innerHTML = `<h2>Links</h2><dl class="edge-key">
    ${['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired']
      .map((type) => `<dt>${line(type)}</dt><dd>${type}</dd>`).join('')}
    <dt>${line('caused', 'disputed')}</dt><dd>any type, disputed</dd>
  </dl>`;
  return box;
}

export function createGraphView(container, { atlas, state, onCluster = null }) {
  // The arrangement depends on which events are shown and what the bands
  // are, and both of those change under the reader: it is rebuilt when they
  // do and kept when they do not, so panning, selecting and walking a chain
  // never move a node.
  let laid = null;
  // What is actually drawn at the current zoom: the arrangement above, with
  // everything too close together to tell apart merged into one mark.
  let stacked = null;
  let weights = { min: 0, max: 0 };
  let arrangedFor = null;

  const viewport = svg('g', { class: 'viewport' });
  const bandsGroup = svg('g', { class: 'layer layer-bands' });
  const windowGroup = svg('g', { class: 'layer layer-window' });
  const edgesGroup = svg('g', { class: 'layer layer-edges' });
  const nodesGroup = svg('g', { class: 'layer layer-nodes' });
  const labelsGroup = svg('g', { class: 'layer layer-labels' });
  viewport.append(bandsGroup, windowGroup, edgesGroup, nodesGroup, labelsGroup);
  const root = svg('svg', {
    class: 'graph',
    role: 'img',
    'aria-label': 'The graph of events and the links between them',
  }, [viewport]);

  // The lanes the bands are, and the events there are to draw. Both are
  // asked of the same two files the timeline asks (lanes.js, lens.js), so
  // the two pictures cannot disagree about either.
  function arrangement(s) {
    const lens = lensSet(atlas, s);
    const events = lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents;
    const window = resolveWindow(s, atlas.extent);
    const lanes = s.group === 'none' ? [] : lanesFor(s.group, atlas, window, lens, s.lanes);
    return { events, lanes, key: `${s.focus ?? ''}|${s.group}|${lanes.map((l) => l.id).join(',')}` };
  }

  // The frame the reader keeps their bearings by: the bands and the year
  // axis. Redrawn only when the arrangement is.
  function drawFrame() {
    bandsGroup.replaceChildren();
    for (const band of laid.bands) {
      if (band.hidden) continue;
      bandsGroup.appendChild(svg('rect', {
        x: 0, y: band.y0, width: laid.width, height: band.y1 - band.y0,
        class: classes('band', band.even ? 'even' : 'odd'),
      }));
      // A band is a lane now, and an actor's name is longer than a region's:
      // the label is cut to the gutter and the whole of it is in the title.
      const label = textNode(shorten(band.label, BAND_LABEL_CHARS), { x: 8, y: band.y0 + 15, class: 'band-label' });
      label.appendChild(svgTitle(band.label));
      bandsGroup.appendChild(label);
    }
    for (const tick of laid.scale.ticks(10)) {
      const x = laid.scale.x(tick.value);
      bandsGroup.appendChild(svg('line', { x1: x, y1: laid.bands[0]?.y0 ?? 0, x2: x, y2: laid.height, class: 'tick' }));
      bandsGroup.appendChild(textNode(tick.label, { x, y: 16, class: 'tick-label', 'text-anchor': 'middle' }));
    }
  }

  function arrange(s) {
    const { events, lanes, key } = arrangement(s);
    if (key === arrangedFor) return false;
    arrangedFor = key;
    const ids = new Set(events.map((e) => e.id));
    laid = layoutGraph({
      events,
      // An edge with one end removed by the lens has nothing to join.
      edges: [...atlas.edges.values()].filter((e) => e.status === 'active' && ids.has(e.from) && ids.has(e.to)),
      lanes,
      extent: atlas.extent,
    });
    weights = {
      min: Math.min(...laid.nodes.map((n) => n.weight), 0),
      max: Math.max(...laid.nodes.map((n) => n.weight), 0),
    };
    root.setAttribute('viewBox', `0 0 ${laid.width} ${laid.height}`);
    drawFrame();
    return true;
  }
  arrange(state.get());

  // Pan and zoom, as the map has them. Not in the state: the URL carries
  // what the reader is looking at, not how far they scrolled.
  let transform = { x: 0, y: 0, k: 1 };
  const applyTransform = () => {
    viewport.setAttribute('transform', `translate(${transform.x} ${transform.y}) scale(${transform.k})`);
  };
  const view = () => ({
    x0: -transform.x / transform.k,
    y0: -transform.y / transform.k,
    x1: (laid.width - transform.x) / transform.k,
    y1: (laid.height - transform.y) / transform.k,
  });
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
  const zoomTo = (point, wanted) => {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, wanted));
    transform = { k, x: laid.width / 2 - point.x * k, y: laid.height / 2 - point.y * k };
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
    if (!drag) return;
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
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [x, y] = toSvg(e);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.k * factor));
    const ratio = k / transform.k;
    transform = { k, x: x - (x - transform.x) * ratio, y: y - (y - transform.y) * ratio };
    applyTransform();
    render(state.get());
  }, { passive: false });
  root.addEventListener('dblclick', () => {
    transform = { x: 0, y: 0, k: 1 };
    applyTransform();
    render(state.get());
  });

  // Which mark a click means is decided by distance, not by which circle
  // happens to be on top. Two adjacent years are about eight units apart
  // here, and a mark or its stroke covering a neighbour's centre would have
  // made that neighbour unreachable at rest — the nearest centre inside the
  // reach is always the one the reader aimed at.
  root.addEventListener('click', (e) => {
    // A drag that ends over a node must not select it; the flag is cleared
    // here, once this click has been judged, so the next clean one selects.
    if (dragged) {
      dragged = false;
      return;
    }
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
    if (!best || distance > reach) return;
    if (best.count === 1) {
      select(best.representative.id);
      return;
    }
    openStack(best);
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
    zoomTo(stack.centre, Math.max(stack.coreZoom ?? 0, transform.k * CLUSTER_ZOOM_STEP));
  }

  // Clicking on a consequence of the selected event walks the chain;
  // clicking anywhere else starts afresh, as the map does.
  function select(id) {
    const s = state.get();
    const step = s.selected ? (atlas.adjacency.out.get(s.selected) ?? []).find((edge) => edge.to === id) : null;
    if (step) state.set({ chain: [...s.chain, step.id], selected: id });
    else state.set({ selected: id, chain: [] });
  }

  // The map's viewport narrows the timeline, and this view has no viewport of
  // its own to be narrowed by: the graph is arranged by year and by band, and
  // nothing in it is anywhere. Rather than filter it by a box that means
  // nothing here, or leave the reader wondering why the lanes below are
  // shorter than the picture above, it says so.
  const note = document.createElement('p');
  note.className = 'graph-note';
  note.hidden = true;
  note.textContent = 'The map is looking at part of the world. The graph has no viewport of its own, so it draws every event; the lanes below are narrowed to what the map can see.';

  container.append(root);
  container.append(note);
  container.append(exportButton(root, 'graph'));
  container.append(edgeKey());

  function render(s) {
    arrange(s);
    note.hidden = !s.bbox;
    const timeWindow = resolveWindow(s, atlas.extent);
    const chainEdges = s.chain.map((id) => atlas.edges.get(id)).filter(Boolean);
    const pathIds = new Set(chainEdges.flatMap((e) => [e.from, e.to]));
    if (s.selected) pathIds.add(s.selected);
    const chainEdgeIds = new Set(chainEdges.map((e) => e.id));
    const consequences = s.selected ? (atlas.adjacency.out.get(s.selected) ?? []) : [];
    const consequenceIds = new Set(consequences.map((e) => e.id));

    // The other branches that fed the selected event, computed exactly as
    // the panel computes them, so the picture and the list agree.
    const converging = new Set();
    const convergingEdges = new Set();
    if (s.selected && atlas.events.has(s.selected)) {
      for (const branch of convergence(atlas.adjacency, s.selected, [...pathIds])) {
        converging.add(branch.event.id);
        convergingEdges.add(branch.edge.id);
      }
    }

    // The same lens the arrangement was built from; what it kept is drawn
    // one event to a node.
    const lens = lensSet(atlas, s);
    const actor = s.actor ? atlas.resolve(s.actor) : null;
    const actorIds = actor && actor.kind === 'actor'
      ? new Set((atlas.eventsByActor.get(actor.id) ?? []).map((a) => a.event.id))
      : null;
    // The whole of an open narrative's walk: where it is going, not only
    // where the reader has got to.
    const narrativeIds = narrativeSet(atlas, s);
    // What the selected event had led to by the horizon year, faded by how
    // far out it is. Empty unless the reader chose a year (horizon.js).
    const reachable = horizonSet(atlas, s);

    const inWindow = new Map(laid.nodes.map((n) => [n.id, overlaps(n.event.when, timeWindow)]));
    const k = transform.k;

    // Everything the reader is currently working with keeps a node of its
    // own. The map has drawn its marks alone for the same reason since M7:
    // a chain that vanished into a stack would be worse than no stack at
    // all, and the answer to "what else fed this" cannot be inside a mark
    // that does not say so.
    const alone = new Set();
    if (s.selected) alone.add(s.selected);
    for (const id of pathIds) alone.add(id);
    for (const edge of [...chainEdges, ...consequences]) {
      alone.add(edge.from);
      alone.add(edge.to);
    }
    for (const id of converging) alone.add(id);
    // A lens has already taken everything else away; what it kept is what
    // the reader asked to see, one by one.
    if (lens) for (const id of lens) alone.add(id);
    for (const id of reachable.keys()) alone.add(id);
    if (narrativeIds) for (const id of narrativeIds) alone.add(id);
    if (actorIds) for (const id of actorIds) alone.add(id);

    stacked = stackLayout(laid, { k, alone });
    // A stack is in the window if any event under it is, and in the horizon
    // at the band of its nearest member: the same rule the map's stacks
    // follow. Both are only ever asked of a stack of one in practice, since
    // the horizon's own events are held out above, but the picture should
    // not depend on that staying true.
    const stackInWindow = (stack) => stack.members.some((m) => inWindow.get(m.id));
    const radiusOf = new Map(stacked.nodes.map((stack) => [
      stack.key,
      stack.representative.id === s.selected
        ? SELECTED_RADIUS
        : radiusFor(stack.representative.weight, weights) + (stack.count > 1 ? STACK_BONUS : 0),
    ]));

    // The window is a shaded band across the whole graph, and what falls
    // outside it fades rather than leaving: the web is always all there.
    windowGroup.replaceChildren();
    if (timeWindow) {
      const x0 = laid.scale.x(timeWindow.from);
      const x1 = laid.scale.x(timeWindow.to);
      windowGroup.appendChild(svg('rect', {
        x: Math.min(x0, x1), y: laid.bands[0]?.y0 ?? 0,
        width: Math.max(1, Math.abs(x1 - x0)), height: laid.height - (laid.bands[0]?.y0 ?? 0),
        class: 'window-band',
      }));
    }

    // One line per pair of marks. A line carrying several links is drawn in
    // the commonest of their types, heavier for how many it carries, and
    // dashed as disputed if any single one of them is — a bundle the reader
    // must not read as settled (cluster.js).
    const stackByKey = new Map(stacked.nodes.map((stack) => [stack.key, stack]));
    edgesGroup.replaceChildren();
    for (const line of stacked.edges) {
      const any = (ids) => line.members.some((m) => ids.has(m.id));
      const faded = !stackInWindow(stackByKey.get(line.from)) || !stackInWindow(stackByKey.get(line.to));
      const marks = classes(
        `type-${line.type}`,
        line.disputed ? 'disputed' : '',
        faded ? 'faded' : '',
        any(chainEdgeIds) ? 'chain' : '',
        any(consequenceIds) ? 'consequence' : '',
        any(convergingEdges) ? 'converging' : '',
        line.count > 1 ? 'merged' : '',
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
      const title = line.count > 1
        ? svgTitle(`${line.count} links, mostly ${line.type}${line.disputed ? ', one of them disputed' : ''}`)
        : null;
      edgesGroup.appendChild(svg(
        'line',
        { x1: line.x1, y1: line.y1, x2: tipX, y2: tipY, class: cls, ...weight },
        title ? [title] : [],
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

    nodesGroup.replaceChildren();
    let selectedMark = null;
    for (const stack of stacked.nodes) {
      const node = stack.representative;
      const radius = radiusOf.get(stack.key);
      if (stack.count > 1) {
        const faded = !stackInWindow(stack);
        const nearest = Math.min(...stack.members.map((m) => reachable.get(m.id) ?? Infinity));
        const hidden = stack.count - 1;
        const span = stack.years.min === stack.years.max
          ? formatYear(stack.years.min)
          : `${formatYear(stack.years.min)}–${formatYear(stack.years.max)}`;
        nodesGroup.appendChild(svg('circle', {
          cx: stack.x, cy: stack.y, r: radius / k,
          class: classes('node', 'stack', stack.coincident ? 'coincident' : 'splittable', faded ? 'faded' : '',
            Number.isFinite(nearest) ? `in-horizon ${horizonBand(nearest)}` : ''),
          'data-stack': stack.key,
        }, [svgTitle(`${node.event.title} — and ${hidden} more event${hidden === 1 ? '' : 's'} here, ${span}`)]));
        nodesGroup.appendChild(textNode(`+${hidden}`, {
          x: stack.x + (radius + 2) / k,
          y: stack.y - (radius + 1) / k,
          class: classes('cluster-count', faded ? 'faded' : ''),
          'font-size': BADGE_SIZE / k,
        }));
        continue;
      }
      const faded = !inWindow.get(node.id);
      const isSelected = node.id === s.selected;
      const cls = classes(
        'node',
        faded ? 'faded' : '',
        reachable.has(node.id) ? `in-horizon ${horizonBand(reachable.get(node.id))}` : '',
        narrativeIds && narrativeIds.has(node.id) ? 'of-narrative' : '',
        actorIds && actorIds.has(node.id) ? 'of-actor' : '',
        converging.has(node.id) ? 'converging' : '',
        pathIds.has(node.id) ? 'on-path' : '',
        isSelected ? 'selected' : '',
      );
      const title = `${node.event.title} — ${formatInterval(node.event.when)}${faded ? ' — outside the window' : ''}`;
      const mark = svg('circle', {
        cx: node.x, cy: node.y, r: radius / k, class: cls, 'data-id': node.id,
      }, [svgTitle(title)]);
      nodesGroup.appendChild(mark);
      if (isSelected) selectedMark = mark;
    }
    if (selectedMark) nodesGroup.appendChild(selectedMark);

    drawLabels(s, k);
  }

  // Zoomed out, only the heaviest marks on screen are named and a label
  // that would land on one already placed is skipped, as on the map. A
  // stack is named after its representative — the heaviest event under it,
  // which is the one worth showing (cluster.js) — and weighs what its
  // members weigh together, so a thicket of small events can outrank a
  // single large one and say what it is. Zoomed in, every mark on screen is
  // named: a name that disappeared because a neighbour got there first
  // would be the wrong kind of tidy. A label that collides is moved to the
  // other side of its mark first, and only drawn over another if neither
  // side is free.
  function drawLabels(s, k) {
    labelsGroup.replaceChildren();
    const box = view();
    const all = k >= LABEL_ALL_ZOOM;
    const onScreen = stacked.nodes.filter((n) => n.x >= box.x0 && n.x <= box.x1 && n.y >= box.y0 && n.y <= box.y1);
    const candidates = [...onScreen].sort(
      (a, b) => b.weight - a.weight || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    );
    const placed = [];
    // Rough, and deliberately so: an em is about half the font size, and the
    // box only has to be good enough to keep two labels off each other.
    const boxFor = (node, text, right) => {
      const width = (text.length * LABEL_SIZE * 0.55) / k;
      const x = node.x + (right ? 1 : -1) * (MAX_RADIUS + 3) / k;
      return {
        x0: right ? x : x - width,
        x1: right ? x + width : x,
        y0: node.y - (LABEL_SIZE * 0.7) / k,
        y1: node.y + (LABEL_SIZE * 0.7) / k,
        x,
        right,
      };
    };
    const free = (rect) => !placed.some((p) => rect.x0 < p.x1 && p.x0 < rect.x1 && rect.y0 < p.y1 && p.y0 < rect.y1);
    for (const node of candidates) {
      if (!all && placed.length >= LABEL_LIMIT) break;
      const text = shorten(node.representative.event.title);
      let rect = boxFor(node, text, true);
      if (!free(rect)) {
        const other = boxFor(node, text, false);
        if (free(other)) rect = other;
        else if (!all) continue;
      }
      placed.push(rect);
      labelsGroup.appendChild(textNode(text, {
        x: rect.x, y: node.y + (LABEL_SIZE * 0.35) / k,
        class: classes('node-label', node.representative.id === s.selected ? 'selected' : ''),
        'text-anchor': rect.right ? 'start' : 'end',
        'font-size': LABEL_SIZE / k,
      }));
    }
  }

  // The reader arriving on a narrow window should not have to hunt for it,
  // so the first drawing zooms to it. Capped: a window of two years filling
  // the width would push the outer bands off the screen, and the bands are
  // what the view is read against (STATUS.md, deviation 54).
  const fitToWindow = () => {
    const timeWindow = resolveWindow(state.get(), atlas.extent);
    if (!timeWindow) return;
    const x0 = laid.scale.x(timeWindow.from);
    const x1 = laid.scale.x(timeWindow.to);
    const span = Math.max(1, Math.abs(x1 - x0));
    const whole = Math.abs(laid.scale.x(atlas.extent.max) - laid.scale.x(atlas.extent.min));
    // A window that is most of the data is not worth zooming to: the right
    // first view of the whole graph is the whole graph.
    if (span > whole * FIT_SHARE) return;
    const k = Math.min(FIT_ZOOM, laid.width / span);
    transform = { k, x: laid.width / 2 - ((x0 + x1) / 2) * k, y: laid.height / 2 - (laid.height / 2) * k };
    applyTransform();
  };

  fitToWindow();
  state.subscribe(render);
  render(state.get());
  return { render, layout: laid, drawn: () => stacked };
}

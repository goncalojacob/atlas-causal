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

import { svg, svgTitle } from '../util/dom.js';
import { formatInterval } from '../util/dates.js';
import { overlaps, resolveWindow } from '../util/window.js';
import { convergence } from '../graph.js';
import { layoutGraph } from './layout.js';

// Sizes in SVG units at k = 1; divided by k when drawn, so a node keeps its
// size on screen at any zoom, as the map's marks do.
const MIN_RADIUS = 4;
const MAX_RADIUS = 7;
const HIT_RADIUS = 9;
const SELECTED_RADIUS = 8;
const HEAD_LENGTH = 7;
const HEAD_WIDTH = 4.5;
const LABEL_SIZE = 11;
const LABEL_CHARS = 28;
// Below this zoom only the heaviest nodes on screen are named; at or above
// it every node on screen is, which at sixty events is all of them.
const LABEL_ALL_ZOOM = 2;
const LABEL_LIMIT = 14;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
// As far as the first drawing will zoom to a narrow window on its own.
const FIT_ZOOM = 2;

function textNode(text, attrs) {
  const el = svg('text', attrs);
  el.textContent = text;
  return el;
}

function shorten(text) {
  return text.length > LABEL_CHARS ? `${text.slice(0, LABEL_CHARS - 1).trimEnd()}…` : text;
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

export function createGraphView(container, { atlas, state }) {
  const laid = layoutGraph({
    events: atlas.activeEvents,
    edges: [...atlas.edges.values()].filter((e) => e.status === 'active'),
    regions: atlas.regions,
    extent: atlas.extent,
  });
  const weights = {
    min: Math.min(...laid.nodes.map((n) => n.weight), 0),
    max: Math.max(...laid.nodes.map((n) => n.weight), 0),
  };
  const nodeById = new Map(laid.nodes.map((n) => [n.id, n]));

  const viewport = svg('g', { class: 'viewport' });
  const bandsGroup = svg('g', { class: 'layer layer-bands' });
  const windowGroup = svg('g', { class: 'layer layer-window' });
  const edgesGroup = svg('g', { class: 'layer layer-edges' });
  const nodesGroup = svg('g', { class: 'layer layer-nodes' });
  const labelsGroup = svg('g', { class: 'layer layer-labels' });
  viewport.append(bandsGroup, windowGroup, edgesGroup, nodesGroup, labelsGroup);
  const root = svg('svg', {
    viewBox: `0 0 ${laid.width} ${laid.height}`,
    class: 'graph',
    role: 'img',
    'aria-label': 'The graph of events and the links between them',
  }, [viewport]);

  // The bands and the axis never change: they are the frame the reader
  // keeps their bearings by, so they are drawn once.
  for (const band of laid.bands) {
    bandsGroup.appendChild(svg('rect', {
      x: 0, y: band.y0, width: laid.width, height: band.y1 - band.y0,
      class: classes('band', band.even ? 'even' : 'odd'),
    }));
    bandsGroup.appendChild(textNode(band.label, { x: 8, y: band.y0 + 15, class: 'band-label' }));
  }
  for (const tick of laid.scale.ticks(10)) {
    const x = laid.scale.x(tick.value);
    bandsGroup.appendChild(svg('line', { x1: x, y1: laid.bands[0]?.y0 ?? 0, x2: x, y2: laid.height, class: 'tick' }));
    bandsGroup.appendChild(textNode(tick.label, { x, y: 16, class: 'tick-label', 'text-anchor': 'middle' }));
  }

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
  const toSvg = (e) => {
    const rect = root.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * laid.width, ((e.clientY - rect.top) / rect.height) * laid.height];
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
  root.addEventListener('click', (e) => {
    if (dragged) {
      dragged = false;
      e.stopPropagation();
    }
  }, true);
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

  nodesGroup.addEventListener('click', (e) => {
    const el = e.target.closest('[data-id]');
    if (!el) return;
    select(el.getAttribute('data-id'));
  });

  // Clicking on a consequence of the selected event walks the chain;
  // clicking anywhere else starts afresh, as the map does.
  function select(id) {
    const s = state.get();
    const step = s.selected ? (atlas.adjacency.out.get(s.selected) ?? []).find((edge) => edge.to === id) : null;
    if (step) state.set({ chain: [...s.chain, step.id], selected: id });
    else state.set({ selected: id, chain: [] });
  }

  container.append(root);

  function render(s) {
    const timeWindow = resolveWindow(s, atlas.extent);
    const chainEdges = s.chain.map((id) => atlas.edges.get(id)).filter(Boolean);
    const pathIds = new Set(chainEdges.flatMap((e) => [e.from, e.to]));
    if (s.selected) pathIds.add(s.selected);
    const chainEdgeIds = new Set(chainEdges.map((e) => e.id));
    const consequenceIds = new Set(s.selected ? (atlas.adjacency.out.get(s.selected) ?? []).map((e) => e.id) : []);

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

    const actor = s.actor ? atlas.resolve(s.actor) : null;
    const actorIds = actor && actor.kind === 'actor'
      ? new Set((atlas.eventsByActor.get(actor.id) ?? []).map((a) => a.event.id))
      : null;

    const inWindow = new Map(laid.nodes.map((n) => [n.id, overlaps(n.event.when, timeWindow)]));
    const k = transform.k;

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

    edgesGroup.replaceChildren();
    for (const line of laid.edges) {
      const { edge } = line;
      const faded = !inWindow.get(edge.from) || !inWindow.get(edge.to);
      const marks = classes(
        `type-${edge.type}`,
        edge.confidence === 'disputed' ? 'disputed' : '',
        faded ? 'faded' : '',
        chainEdgeIds.has(edge.id) ? 'chain' : '',
        consequenceIds.has(edge.id) ? 'consequence' : '',
        convergingEdges.has(edge.id) ? 'converging' : '',
      );
      const cls = classes('edge', marks);
      // The line stops short of the node it points at, so the arrowhead is
      // not buried under the mark.
      const dx = line.x2 - line.x1;
      const dy = line.y2 - line.y1;
      const length = Math.hypot(dx, dy) || 1;
      const back = (radiusFor(nodeById.get(edge.to).weight, weights) + 1.5) / k;
      const tipX = line.x2 - (dx / length) * back;
      const tipY = line.y2 - (dy / length) * back;
      edgesGroup.appendChild(svg('line', { x1: line.x1, y1: line.y1, x2: tipX, y2: tipY, class: cls }));
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
    for (const node of laid.nodes) {
      const faded = !inWindow.get(node.id);
      const isSelected = node.id === s.selected;
      const cls = classes(
        'node',
        faded ? 'faded' : '',
        actorIds && actorIds.has(node.id) ? 'of-actor' : '',
        converging.has(node.id) ? 'converging' : '',
        pathIds.has(node.id) ? 'on-path' : '',
        isSelected ? 'selected' : '',
      );
      const title = `${node.event.title} — ${formatInterval(node.event.when)}${faded ? ' — outside the window' : ''}`;
      nodesGroup.appendChild(svg('circle', { cx: node.x, cy: node.y, r: HIT_RADIUS / k, class: 'hit', 'data-id': node.id }));
      const mark = svg('circle', {
        cx: node.x, cy: node.y,
        r: (isSelected ? SELECTED_RADIUS : radiusFor(node.weight, weights)) / k,
        class: cls, 'data-id': node.id,
      }, [svgTitle(title)]);
      nodesGroup.appendChild(mark);
      if (isSelected) selectedMark = mark;
    }
    if (selectedMark) nodesGroup.appendChild(selectedMark);

    drawLabels(s, k);
  }

  // Zoomed in, every node on screen is named; zoomed out, only the heaviest,
  // and a label that would land on one already placed is skipped rather than
  // nudged — the same rule the map's labels follow.
  function drawLabels(s, k) {
    labelsGroup.replaceChildren();
    const box = view();
    const onScreen = laid.nodes.filter((n) => n.x >= box.x0 && n.x <= box.x1 && n.y >= box.y0 && n.y <= box.y1);
    const candidates = [...onScreen].sort(
      (a, b) => b.weight - a.weight || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    const limit = k >= LABEL_ALL_ZOOM ? candidates.length : LABEL_LIMIT;
    const placed = [];
    for (const node of candidates) {
      if (placed.length >= limit) break;
      const text = shorten(node.event.title);
      const x = node.x + (MAX_RADIUS + 3) / k;
      const y = node.y;
      const rect = {
        x0: x,
        x1: x + (text.length * LABEL_SIZE * 0.55) / k,
        y0: y - (LABEL_SIZE * 0.7) / k,
        y1: y + (LABEL_SIZE * 0.7) / k,
      };
      if (placed.some((p) => rect.x0 < p.x1 && p.x0 < rect.x1 && rect.y0 < p.y1 && p.y0 < rect.y1)) continue;
      placed.push(rect);
      labelsGroup.appendChild(textNode(text, {
        x, y: y + (LABEL_SIZE * 0.35) / k,
        class: classes('node-label', node.id === s.selected ? 'selected' : ''),
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
    const wanted = laid.width / Math.max(1, Math.abs(x1 - x0));
    if (wanted < 1.15) return;
    const k = Math.min(FIT_ZOOM, wanted);
    transform = { k, x: laid.width / 2 - ((x0 + x1) / 2) * k, y: laid.height / 2 - (laid.height / 2) * k };
    applyTransform();
  };

  fitToWindow();
  state.subscribe(render);
  render(state.get());
  return { render, layout: laid };
}

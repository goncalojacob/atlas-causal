// One lane per region, events as bars, and the window of time drawn over
// them as a band with a handle at each end. The scale is injected
// (timeline-scale.js) so deep time can swap it. Knows the lane list only
// through the manifest it is given.
//
// The lanes stay on the whole extent of the data whatever the window is.
// Zooming them to the window was tried on paper and rejected: a handle at
// the edge of its own scale has no room left to widen into, so narrowing the
// window once would be a trap. Narrowing filters the map and greys the
// timeline outside the band; it does not rescale the lanes.
//
// Bars that would overlap at the current width are drawn as one with a `+n`
// badge, by the same cluster.js the map uses, in one dimension. Only the
// events inside the window are stacked together, so narrowing the band
// splits the stacks — which is what "zooming" means here, since the scale
// itself does not move. What the reader is working with — the selected
// event, the walked path, the events of the selected actor — is never
// stacked.

import { svg, svgTitle } from './util/dom.js';
import { createLinearScale } from './timeline-scale.js';
import { clusterPoints } from './cluster.js';
import { extent, fromAstronomical, formatYear } from './util/dates.js';
import { resolveWindow, overlaps, windowAt, decadeOf } from './util/window.js';
import { horizonBand, horizonSet } from './horizon.js';

const LANE_HEIGHT = 34;
const LABEL_WIDTH = 120;
// Room above the lanes for the tick labels and, over them, the one line the
// band says about the borders it is showing.
const MARKER_HEIGHT = 17;
const AXIS_HEIGHT = MARKER_HEIGHT + 26;
const PADDING = 0.04;
// Two bars whose middles are closer than this are drawn as one. In pixels of
// the lane, not years: what overlaps is a question about the drawing.
const BAR_MERGE = 11;
const HANDLE_WIDTH = 9;
const BADGE_SIZE = 10;

export function createTimeline(container, { atlas, state, createScale = createLinearScale, onCluster = null }) {
  const root = svg('svg', { class: 'timeline', role: 'group', 'aria-label': 'Timeline and the window of time' });
  container.appendChild(root);

  const lanes = atlas.regions;
  const height = AXIS_HEIGHT + Math.max(lanes.length, 1) * LANE_HEIGHT;

  const domain = atlas.extent
    ? [atlas.extent.min - (atlas.extent.max - atlas.extent.min) * PADDING - 1, atlas.extent.max + (atlas.extent.max - atlas.extent.min) * PADDING + 1]
    : [0, 1];

  let width = 0;
  let scale = null;
  // What the last render drew, so a click on a stack can be answered with the
  // cluster itself rather than an id the caller would have to look up.
  let drawn = new Map();
  const measure = () => {
    width = Math.max(container.clientWidth || 960, 320);
    scale = createScale({ domain, range: [LABEL_WIDTH, width - 12] });
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    root.setAttribute('width', width);
    root.setAttribute('height', height);
  };

  // Years, clamped to the data: the band never leaves the scale it is drawn
  // on, and its ends never cross.
  const clamp = (year) => Math.min(atlas.extent.max, Math.max(atlas.extent.min, Math.round(year)));
  const setWindow = ({ from, to }) => state.set({
    from: fromAstronomical(clamp(Math.min(from, to))),
    to: fromAstronomical(clamp(Math.max(from, to))),
  });
  const yearAt = (clientX) => {
    const rect = root.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    return { x, year: Math.round(scale.invert(x)) };
  };

  // --- moving the band ----------------------------------------------------
  // A drag is over by the time the click arrives, so whether it moved has to
  // outlive it — the same guard the map needs (STATUS.md, deviation 34).
  let drag = null;
  let dragged = false;

  root.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('[data-window]');
    if (!handle || !atlas.extent) return;
    const window = resolveWindow(state.get(), atlas.extent);
    drag = { kind: handle.getAttribute('data-window'), origin: window, startYear: yearAt(e.clientX).year };
    dragged = false;
    try { root.setPointerCapture(e.pointerId); } catch { /* no such pointer any more */ }
    e.preventDefault();
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { year } = yearAt(e.clientX);
    if (year !== drag.startYear) dragged = true;
    if (drag.kind === 'from') setWindow({ from: year, to: drag.origin.to });
    else if (drag.kind === 'to') setWindow({ from: drag.origin.from, to: year });
    else {
      // The band slides as a whole and keeps its width, stopping at the ends
      // of the data rather than shrinking against them.
      const span = drag.origin.to - drag.origin.from;
      const shift = year - drag.startYear;
      const from = Math.min(Math.max(drag.origin.from + shift, atlas.extent.min), atlas.extent.max - span);
      setWindow({ from, to: from + span });
    }
  });
  const endDrag = (e) => {
    if (!drag) return;
    try { root.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    drag = null;
  };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  // Arrow keys nudge the focused handle; shift makes it a decade. The band
  // itself moves whole under the same keys.
  root.addEventListener('keydown', (e) => {
    const el = e.target.closest?.('[data-window]');
    if (!el || !atlas.extent) return;
    const step = e.shiftKey ? 10 : 1;
    const delta = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    if (!delta) return;
    e.preventDefault();
    const window = resolveWindow(state.get(), atlas.extent);
    const kind = el.getAttribute('data-window');
    if (kind === 'from') setWindow({ from: window.from + delta, to: window.to });
    else if (kind === 'to') setWindow({ from: window.from, to: window.to + delta });
    else {
      const span = window.to - window.from;
      const from = Math.min(Math.max(window.from + delta, atlas.extent.min), atlas.extent.max - span);
      setWindow({ from, to: from + span });
    }
  });

  root.addEventListener('click', (e) => {
    if (dragged) {
      dragged = false;
      return;
    }
    const bar = e.target.closest('[data-id], [data-cluster]');
    if (bar) {
      const id = bar.getAttribute('data-id');
      if (id) {
        state.set({ selected: id, chain: [] });
        return;
      }
      const cluster = drawn.get(bar.getAttribute('data-cluster'));
      if (cluster && onCluster) onCluster(cluster);
      return;
    }
    if (e.target.closest('[data-window]')) return;
    const { x, year } = yearAt(e.clientX);
    if (x < LABEL_WIDTH || !atlas.extent) return;
    // A click in the lanes means the same as "map at 1911" in the panel: the
    // far end goes there and the near end comes with it if it was later.
    const moved = windowAt(state.get(), fromAstronomical(clamp(year)));
    state.set({ from: moved.from, to: moved.to });
  });

  // The band is a drag surface, but a double-click still means "that
  // decade" wherever it lands in the lanes — otherwise the whole gesture
  // would be unavailable at the default window, which covers everything.
  root.addEventListener('dblclick', (e) => {
    if (!atlas.extent || e.target.closest('.window-handle')) return;
    const { x, year } = yearAt(e.clientX);
    if (x < LABEL_WIDTH) return;
    setWindow(decadeOf(clamp(year)));
  });

  // --- drawing ------------------------------------------------------------

  function laneBars(root_, lane, i, events, s, window, actorIds, pathIds, reachable) {
    const y = AXIS_HEIGHT + i * LANE_HEIGHT + 8;
    const barHeight = LANE_HEIGHT - 16;
    const geometry = (event) => {
      const x = extent(event.when);
      const x0 = scale.x(x.min);
      const x1 = scale.x(x.max ?? domain[1]);
      const w = Math.max(x1 - x0, 6);
      return { x: x0 - (x1 - x0 < 6 ? 3 : 0), width: w, ongoing: x.max === null };
    };

    const alone = [];
    const groups = { inside: [], outside: [] };
    for (const event of events) {
      const onPath = pathIds.has(event.id);
      const selected = event.id === s.selected;
      const ofActor = actorIds ? actorIds.has(event.id) : false;
      const inside = overlaps(event.when, window);
      const box = geometry(event);
      const depth = reachable.get(event.id) ?? null;
      const item = { id: event.id, event, onPath, selected, ofActor, inside, depth, ...box };
      if (onPath || selected || ofActor) alone.push(item);
      else groups[inside ? 'inside' : 'outside'].push(item);
    }

    const bar = (item, { count = 0, key = null } = {}) => {
      const classes = ['bar',
        item.ongoing ? 'ongoing' : '',
        item.inside ? '' : 'faded',
        count ? 'stack' : '',
        item.depth === null ? '' : `in-horizon ${horizonBand(item.depth)}`,
        item.ofActor ? 'of-actor' : '',
        item.onPath ? 'on-path' : '',
        item.selected ? 'selected' : '',
      ].filter(Boolean).join(' ');
      const title = count
        ? `${item.event.title} — and ${count} more here`
        : item.inside ? item.event.title : `${item.event.title} — outside the window`;
      const data = key === null ? { 'data-id': item.id } : { 'data-cluster': key };
      const el = svg('rect', { x: item.x, y, width: item.width, height: barHeight, rx: 3, class: classes, ...data }, [svgTitle(title)]);
      root_.appendChild(el);
      if (count) {
        const badge = svg('text', {
          x: item.x + item.width + 3, y: y + barHeight / 2, class: `cluster-count ${item.inside ? '' : 'faded'}`.trim(),
          'dominant-baseline': 'middle', 'font-size': BADGE_SIZE, 'data-cluster': key,
        });
        badge.textContent = `+${count}`;
        root_.appendChild(badge);
      }
      return el;
    };

    // Stacks, per group: the events in the window merge with each other and
    // the events outside it with each other, so moving the band splits both.
    for (const [name, list] of Object.entries(groups)) {
      if (list.length === 0) continue;
      const clusters = clusterPoints(
        list.map((item) => ({ id: item.id, x: item.x + item.width / 2, y: 0, weight: item.event.weight ?? 0, item })),
        { k: 1, distance: BAR_MERGE, epsilon: 0 },
      );
      for (const cluster of clusters) {
        const item = cluster.representative.item;
        if (cluster.count === 1) {
          bar(item);
          continue;
        }
        // A stack is in the horizon when any bar under it is, at the band of
        // its nearest member — the same rule the map's stacks follow.
        const depths = cluster.members.map((m) => m.item.depth).filter((d) => d !== null);
        const stacked = { ...item, depth: depths.length ? Math.min(...depths) : null };
        // Namespaced by lane and group, because one event's id names at most
        // one cluster but the same id could seed two if a lane were redrawn.
        const key = `${lane.id}:${name}:${cluster.key}`;
        drawn.set(key, {
          key,
          count: cluster.count,
          representative: { id: item.id, event: item.event },
          members: cluster.members.map((m) => ({ id: m.id, event: m.item.event })),
          on: 'timeline',
          lane,
          inside: item.inside,
        });
        bar(stacked, { count: cluster.count - 1, key });
      }
    }
    // Path, actor and selection last, so they sit above their neighbours.
    return alone;
  }

  function render(s) {
    measure();
    root.replaceChildren();
    drawn = new Map();
    const window = resolveWindow(s, atlas.extent);
    const pathIds = new Set(s.chain.flatMap((id) => {
      const edge = atlas.edges.get(id);
      return edge ? [edge.from, edge.to] : [];
    }));
    // A second emphasis, distinct from the path's: the events of the actor
    // whose card is open. Through resolve(), so a former id in the URL
    // highlights the same actor the panel is showing.
    const actor = s.actor ? atlas.resolve(s.actor) : null;
    const actorIds = actor && actor.kind === 'actor'
      ? new Set((atlas.eventsByActor.get(actor.id) ?? []).map((a) => a.event.id))
      : null;
    // What the selected event had led to by the horizon year, faded by how
    // far out it is. Empty unless the reader chose a year (horizon.js).
    const reachable = horizonSet(atlas, s);

    lanes.forEach((lane, i) => {
      const y = AXIS_HEIGHT + i * LANE_HEIGHT;
      root.appendChild(svg('rect', { x: 0, y, width, height: LANE_HEIGHT, class: `lane ${i % 2 ? 'odd' : 'even'}` }));
      const label = svg('text', { x: 10, y: y + LANE_HEIGHT / 2, class: 'lane-label', 'dominant-baseline': 'middle' });
      label.textContent = lane.label;
      root.appendChild(label);
    });

    for (const tick of scale.ticks(Math.max(4, Math.floor((width - LABEL_WIDTH) / 90)))) {
      const x = scale.x(tick.value);
      root.appendChild(svg('line', { x1: x, y1: AXIS_HEIGHT - 6, x2: x, y2: height, class: 'tick' }));
      const t = svg('text', { x, y: AXIS_HEIGHT - 10, class: 'tick-label', 'text-anchor': 'middle' });
      t.textContent = tick.label;
      root.appendChild(t);
    }

    // The band under the bars, its handles over them: the shading must not
    // hide a record, and a handle must always be grabbable.
    if (window) root.appendChild(bandShade(window));

    const byLane = new Map(lanes.map((lane) => [lane.id, []]));
    for (const event of atlas.activeEvents) {
      if (byLane.has(event.region)) byLane.get(event.region).push(event);
    }
    const deferred = [];
    lanes.forEach((lane, i) => {
      for (const item of laneBars(root, lane, i, byLane.get(lane.id), s, window, actorIds, pathIds, reachable)) {
        deferred.push({ item, i });
      }
    });
    for (const { item, i } of deferred) {
      const y = AXIS_HEIGHT + i * LANE_HEIGHT + 8;
      const classes = ['bar',
        item.ongoing ? 'ongoing' : '',
        item.inside ? '' : 'faded',
        item.depth === null ? '' : `in-horizon ${horizonBand(item.depth)}`,
        item.ofActor ? 'of-actor' : '',
        item.onPath ? 'on-path' : '',
        item.selected ? 'selected' : '',
      ].filter(Boolean).join(' ');
      root.appendChild(svg('rect', { x: item.x, y, width: item.width, height: LANE_HEIGHT - 16, rx: 3, class: classes, 'data-id': item.id }, [svgTitle(item.event.title)]));
      if (item.selected || item.onPath) {
        const text = svg('text', { x: item.x + item.width + 4, y: y + (LANE_HEIGHT - 16) / 2, class: `bar-label ${item.selected ? 'selected' : ''}`, 'dominant-baseline': 'middle' });
        text.textContent = item.event.title;
        root.appendChild(text);
      }
    }

    if (window) for (const el of bandHandles(window, s)) root.appendChild(el);
  }

  function bandShade({ from, to }) {
    const x0 = scale.x(from);
    const x1 = scale.x(to);
    return svg('rect', { x: x0, y: MARKER_HEIGHT, width: Math.max(x1 - x0, 1), height: height - MARKER_HEIGHT, class: 'window-band', 'data-window': 'band' },
      [svgTitle('The window of time. Drag it to slide, drag an end to widen, double-click a year to snap to its decade.')]);
  }

  // The two handles, and the one line the far end says about the borders the
  // map is drawing — which is a different year from `to` whenever the window
  // runs past where the outlines stop.
  function bandHandles({ from, to }, s) {
    const out = [];
    const ends = [['from', from], ['to', to]];
    for (const [kind, year] of ends) {
      const x = scale.x(year);
      const handle = svg('rect', {
        x: x - HANDLE_WIDTH / 2, y: MARKER_HEIGHT, width: HANDLE_WIDTH, height: height - MARKER_HEIGHT,
        class: `window-handle ${kind}`, 'data-window': kind, tabindex: '0', role: 'slider',
        'aria-label': kind === 'from' ? 'Start of the window' : 'End of the window',
        'aria-valuemin': String(fromAstronomical(atlas.extent.min)),
        'aria-valuemax': String(fromAstronomical(atlas.extent.max)),
        'aria-valuenow': String(fromAstronomical(year)),
        'aria-valuetext': formatYear(fromAstronomical(year)),
      }, [svgTitle(`${kind === 'from' ? 'Start' : 'End'} of the window — ${formatYear(fromAstronomical(year))}`)]);
      out.push(handle);
      const label = svg('text', {
        x: kind === 'from' ? x - 4 : x + 4, y: MARKER_HEIGHT - 5,
        class: 'window-year', 'text-anchor': kind === 'from' ? 'end' : 'start',
      });
      label.textContent = formatYear(fromAstronomical(year));
      out.push(label);
    }
    if (s.layers.includes('territories') && atlas.presenceCoverage) {
      const shown = atlas.territoryYear(to);
      const x = scale.x(to);
      const text = svg('text', {
        x: Math.min(x + 34, width - 8), y: MARKER_HEIGHT - 5, class: 'window-marker', 'text-anchor': 'end',
      });
      text.textContent = to > atlas.presenceCoverage.to
        ? `borders as of ${formatYear(fromAstronomical(shown))}, the latest the source covers`
        : to < atlas.presenceCoverage.from
          ? `no borders before ${formatYear(fromAstronomical(atlas.presenceCoverage.from))} in this source`
          : `borders as of ${formatYear(fromAstronomical(shown))}`;
      out.push(text);
    }
    return out;
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => render(state.get())).observe(container);
  }
  state.subscribe(render);
  render(state.get());
  return { render };
}

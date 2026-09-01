// One lane per region, events as bars, a playhead at the current year. The
// scale is injected (timeline-scale.js) so deep time can swap it. Knows
// the lane list only through the manifest it is given.

import { svg, svgTitle } from './util/dom.js';
import { createLinearScale } from './timeline-scale.js';
import { extent, fromAstronomical, toAstronomical } from './util/dates.js';

const LANE_HEIGHT = 34;
const LABEL_WIDTH = 120;
const AXIS_HEIGHT = 26;
const PADDING = 0.04;

export function createTimeline(container, { atlas, state, createScale = createLinearScale }) {
  const root = svg('svg', { class: 'timeline', role: 'img', 'aria-label': 'Timeline' });
  container.appendChild(root);

  const lanes = atlas.regions;
  const laneIndex = new Map(lanes.map((r, i) => [r.id, i]));
  const height = AXIS_HEIGHT + Math.max(lanes.length, 1) * LANE_HEIGHT;

  const domain = atlas.extent
    ? [atlas.extent.min - (atlas.extent.max - atlas.extent.min) * PADDING - 1, atlas.extent.max + (atlas.extent.max - atlas.extent.min) * PADDING + 1]
    : [0, 1];

  let width = 0;
  let scale = null;
  const measure = () => {
    width = Math.max(container.clientWidth || 960, 320);
    scale = createScale({ domain, range: [LABEL_WIDTH, width - 12] });
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    root.setAttribute('width', width);
    root.setAttribute('height', height);
  };

  root.addEventListener('click', (e) => {
    const bar = e.target.closest('[data-id]');
    if (bar) {
      state.set({ selected: bar.getAttribute('data-id'), chain: [] });
      return;
    }
    const rect = root.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    if (x < LABEL_WIDTH || !atlas.extent) return;
    const year = Math.round(scale.invert(x));
    const clamped = Math.min(atlas.extent.max, Math.max(atlas.extent.min, year));
    state.set({ year: fromAstronomical(clamped) });
  });

  function render(s) {
    measure();
    root.replaceChildren();
    const pathIds = new Set(s.chain.flatMap((id) => {
      const edge = atlas.edges.get(id);
      return edge ? [edge.from, edge.to] : [];
    }));

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

    const deferred = [];
    for (const event of atlas.activeEvents) {
      const i = laneIndex.get(event.region);
      if (i === undefined) continue;
      const x = extent(event.when);
      const x0 = scale.x(x.min);
      const x1 = scale.x(x.max ?? domain[1]);
      const w = Math.max(x1 - x0, 6);
      const y = AXIS_HEIGHT + i * LANE_HEIGHT + 8;
      const onPath = pathIds.has(event.id);
      const selected = event.id === s.selected;
      const classes = ['bar', x.max === null ? 'ongoing' : '', onPath ? 'on-path' : '', selected ? 'selected' : ''].join(' ').trim();
      const bar = svg('rect', { x: x0 - (x1 - x0 < 6 ? 3 : 0), y, width: w, height: LANE_HEIGHT - 16, rx: 3, class: classes, 'data-id': event.id }, [svgTitle(event.title)]);
      // Path and selection are drawn last so they sit above their neighbours.
      if (selected || onPath) deferred.push(bar);
      else root.appendChild(bar);
      if (selected || onPath) {
        const text = svg('text', { x: x0 + w + 4, y: y + (LANE_HEIGHT - 16) / 2, class: `bar-label ${selected ? 'selected' : ''}`, 'dominant-baseline': 'middle' });
        text.textContent = event.title;
        deferred.push(text);
      }
    }
    for (const el of deferred) root.appendChild(el);

    if (s.year !== null && atlas.extent) {
      const x = scale.x(toAstronomical(s.year));
      root.appendChild(svg('line', { x1: x, y1: AXIS_HEIGHT - 6, x2: x, y2: height, class: 'playhead' }));
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => render(state.get())).observe(container);
  }
  state.subscribe(render);
  render(state.get());
  return { render };
}

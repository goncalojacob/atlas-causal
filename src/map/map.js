// The SVG map: scaffold, pan and zoom, year slider. Layers draw; this file
// only places them and forwards state.

import { svg, html } from '../util/dom.js';
import { fitBounds, WORLD } from './projection.js';
import { createLandLayer } from './layers/land.js';
import { createEventsLayer } from './layers/events.js';
import { fromAstronomical, toAstronomical, formatYear } from '../util/dates.js';

const WIDTH = 960;
const HEIGHT = 540;
const MIN_ZOOM = 1;
const MAX_ZOOM = 40;

function eventBounds(events) {
  const placed = events.filter((e) => e.where);
  if (placed.length === 0) return WORLD;
  const lons = placed.map((e) => e.where.lon);
  const lats = placed.map((e) => e.where.lat);
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]];
}

export function createMap(container, { atlas, state }) {
  const projection = fitBounds(eventBounds(atlas.activeEvents), { width: WIDTH, height: HEIGHT, margin: 0.15 });
  const viewport = svg('g', { class: 'viewport' });
  const landGroup = svg('g', { class: 'layer layer-land' });
  const eventsGroup = svg('g', { class: 'layer layer-events' });
  viewport.append(landGroup, eventsGroup);
  const root = svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, class: 'map', role: 'img', 'aria-label': 'Map' }, [viewport]);

  const land = createLandLayer(landGroup, projection);
  const events = createEventsLayer(eventsGroup, projection, {
    onSelect: (id) => state.set({ selected: id, chain: [] }),
  });
  land.render(atlas.land);

  // Pan and zoom live here, not in the state: the URL carries what the user
  // is looking at in history, not how far they scrolled.
  let transform = { x: 0, y: 0, k: 1 };
  const applyTransform = () => {
    viewport.setAttribute('transform', `translate(${transform.x} ${transform.y}) scale(${transform.k})`);
  };
  const toSvg = (e) => {
    const rect = root.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * WIDTH, ((e.clientY - rect.top) / rect.height) * HEIGHT];
  };
  let drag = null;
  root.addEventListener('pointerdown', (e) => {
    drag = { start: toSvg(e), origin: { ...transform }, moved: false };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y] = toSvg(e);
    const dx = x - drag.start[0];
    const dy = y - drag.start[1];
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    transform = { ...transform, x: drag.origin.x + dx, y: drag.origin.y + dy };
    applyTransform();
  });
  root.addEventListener('pointerup', () => { drag = null; });
  root.addEventListener('click', (e) => {
    // A drag that ends on a mark must not select it.
    if (drag?.moved) e.stopPropagation();
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

  // The slider works on the astronomical axis (continuous integers); the
  // state keeps historians' years.
  const controls = html('div', { class: 'map-controls' });
  const slider = html('input', { type: 'range', class: 'year-slider', 'aria-label': 'Year' });
  const label = html('output', { class: 'year-label' });
  if (atlas.extent) {
    slider.min = String(atlas.extent.min);
    slider.max = String(atlas.extent.max);
    slider.step = '1';
  } else {
    slider.disabled = true;
  }
  slider.addEventListener('input', () => state.set({ year: fromAstronomical(Number(slider.value)) }));
  controls.append(slider, label);
  container.append(root, controls);

  function render(s) {
    landGroup.style.display = s.layers.includes('land') ? '' : 'none';
    eventsGroup.style.display = s.layers.includes('events') ? '' : 'none';
    const year = s.year === null ? null : toAstronomical(s.year);
    if (year !== null && !slider.disabled) slider.value = String(year);
    label.textContent = s.year === null ? '' : formatYear(s.year);

    const chainEdges = s.chain.map((id) => atlas.edges.get(id)).filter(Boolean);
    const pathIds = new Set(chainEdges.flatMap((e) => [e.from, e.to]));
    if (s.selected) pathIds.add(s.selected);
    const consequenceEdges = s.selected ? (atlas.adjacency.out.get(s.selected) ?? []) : [];
    // Through resolve(), so a former id in the URL highlights the same
    // actor the panel is showing.
    const actor = s.actor ? atlas.resolve(s.actor) : null;
    const actorIds = actor && actor.kind === 'actor'
      ? new Set((atlas.eventsByActor.get(actor.id) ?? []).map((a) => a.event.id))
      : null;
    events.render({
      events: atlas.activeEvents,
      year,
      selected: s.selected,
      pathIds,
      actorIds,
      chainEdges,
      consequenceEdges,
      eventById: atlas.events,
      k: transform.k,
    });
  }

  state.subscribe(render);
  render(state.get());
  return { render };
}

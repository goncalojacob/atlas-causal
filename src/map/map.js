// The SVG map: scaffold, pan and zoom. Layers draw; this file only places
// them and forwards state.
//
// There is no year control here any more. Time is a window now, and the
// timeline's band is the one place it is set — a slider that moved only one
// end of it would have been a second, quieter answer to the same question.

import { svg } from '../util/dom.js';
import { fitBounds, WORLD } from './projection.js';
import { createLandLayer } from './layers/land.js';
import { createPresencesLayer } from './layers/presences.js';
import { createEventsLayer } from './layers/events.js';
import { DEEPEST_ZOOM } from '../cluster.js';
import { resolveWindow } from '../util/window.js';
import { horizonSet } from '../horizon.js';
import { narrativeSet } from '../narrative.js';

const WIDTH = 960;
const HEIGHT = 540;
const MIN_ZOOM = 1;
// Shared with cluster.js, which needs it to know whether a cluster can ever
// be pulled apart at all.
const MAX_ZOOM = DEEPEST_ZOOM;
// A cluster whose members are simply too close to place cannot say where it
// would come apart; it gets a plain step in instead.
const CLUSTER_ZOOM_STEP = 3;
const ZOOM_DURATION = 260;

// The box every placed event fits in. An event's coordinates are its place's:
// pointOf resolves the one to the other.
function eventBounds(events, pointOf) {
  const points = events.map(pointOf).filter(Boolean);
  if (points.length === 0) return WORLD;
  const lons = points.map((p) => p.lon);
  const lats = points.map((p) => p.lat);
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]];
}

export function createMap(container, { atlas, state, onCluster = null }) {
  const projection = fitBounds(eventBounds(atlas.activeEvents, atlas.pointOf), { width: WIDTH, height: HEIGHT, margin: 0.15 });
  const viewport = svg('g', { class: 'viewport' });
  const landGroup = svg('g', { class: 'layer layer-land' });
  // Territories go between the coastlines and the marks: an event still sits
  // on top of the state it happened in.
  const presencesGroup = svg('g', { class: 'layer layer-presences' });
  const eventsGroup = svg('g', { class: 'layer layer-events' });
  viewport.append(landGroup, presencesGroup, eventsGroup);
  const root = svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, class: 'map', role: 'img', 'aria-label': 'Map' }, [viewport]);

  const land = createLandLayer(landGroup, projection);
  const presences = createPresencesLayer(presencesGroup, projection, {
    atlas,
    onSelect: (id) => state.set({ actor: id, selected: null, chain: [] }),
  });
  // A cluster of marks that zooming can pull apart is zoomed into; one whose
  // members share a point — Lisbon's thirty-seven — is spread open instead,
  // because no zoom would ever separate those. Either way the panel is given
  // the members, so there is a way to read the stack and a way in from the
  // keyboard.
  const events = createEventsLayer(eventsGroup, projection, {
    pointOf: atlas.pointOf,
    onSelect: (id) => state.set({ selected: id, chain: [] }),
    onCluster: (cluster) => {
      if (onCluster) onCluster(cluster);
      if (cluster.splittable) {
        spread = null;
        // Straight to the zoom where everything that can leave the cluster
        // has left, so one click turns a blob over a capital into the stack
        // of records that really do share a point.
        const wanted = cluster.coreZoom ?? transform.k * CLUSTER_ZOOM_STEP;
        zoomTo(cluster.centre, Math.min(MAX_ZOOM, Math.max(wanted, transform.k * 1.2)));
      } else {
        spread = spread === cluster.key ? null : cluster.key;
        render(state.get());
      }
    },
  });
  land.render(atlas.land);

  // Pan and zoom live here, not in the state: the URL carries what the user
  // is looking at in history, not how far they scrolled.
  let transform = { x: 0, y: 0, k: 1 };
  // The key of the coincident cluster the reader has opened, if any.
  let spread = null;
  const applyTransform = () => {
    viewport.setAttribute('transform', `translate(${transform.x} ${transform.y}) scale(${transform.k})`);
  };
  // The rectangle of projected space on screen: what the events layer needs
  // to know which clusters are worth labelling.
  const view = () => ({
    x0: -transform.x / transform.k,
    y0: -transform.y / transform.k,
    x1: (WIDTH - transform.x) / transform.k,
    y1: (HEIGHT - transform.y) / transform.k,
  });

  const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

  // Puts a point in the middle of the map at a given zoom. Animated, unless
  // the reader has asked for less motion, in which case it simply arrives.
  function zoomTo({ x, y }, k) {
    const target = { k, x: WIDTH / 2 - x * k, y: HEIGHT / 2 - y * k };
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
      transform = target;
      applyTransform();
      render(state.get());
      return;
    }
    const from = { ...transform };
    const started = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - started) / ZOOM_DURATION);
      const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
      transform = {
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        k: from.k + (target.k - from.k) * eased,
      };
      applyTransform();
      render(state.get());
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  const toSvg = (e) => {
    const rect = root.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * WIDTH, ((e.clientY - rect.top) / rect.height) * HEIGHT];
  };
  let drag = null;
  // The drag is over by the time the click arrives, so whether it moved has
  // to outlive it in a flag of its own; reading it off `drag` meant reading
  // it off null, and every drag that ended on a mark selected it.
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
      // The pointer is captured here and not on pointerdown. Capturing at
      // the press retargets pointerup — and with it the click — to the SVG
      // root, so the click never reached the mark under the cursor and no
      // event on the map could be selected at all. A pan still needs the
      // capture to survive leaving the map, so it is taken the moment the
      // press becomes a drag.
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
    // A drag that ends on a mark must not select it. Cleared here, once the
    // click has been judged, so the next clean click selects.
    if (dragged) {
      dragged = false;
      e.stopPropagation();
    }
  }, true);
  root.addEventListener('click', (e) => {
    // A click on the map itself, away from any mark, closes an open spread.
    if (spread && !e.target.closest('[data-id], [data-cluster]')) {
      spread = null;
      render(state.get());
    }
  });
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [x, y] = toSvg(e);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.k * factor));
    const ratio = k / transform.k;
    transform = { k, x: x - (x - transform.x) * ratio, y: y - (y - transform.y) * ratio };
    // Zooming rearranges the clusters under the spread, so it closes.
    spread = null;
    applyTransform();
    render(state.get());
  }, { passive: false });
  root.addEventListener('dblclick', () => {
    transform = { x: 0, y: 0, k: 1 };
    spread = null;
    applyTransform();
    render(state.get());
  });

  container.append(root);

  function render(s) {
    landGroup.style.display = s.layers.includes('land') ? '' : 'none';
    presencesGroup.style.display = s.layers.includes('territories') ? '' : 'none';
    eventsGroup.style.display = s.layers.includes('events') ? '' : 'none';
    // Events by overlap with the window, territories by its far end: a
    // border is a state of affairs at a moment, an event is an interval.
    const timeWindow = resolveWindow(s, atlas.extent);

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
    // Drawn before the marks so the marks are appended over them, and only
    // when the layer is on: an off layer costs no fetch.
    if (s.layers.includes('territories')) {
      presences.render({ year: timeWindow ? timeWindow.to : null, actorId: actor && actor.kind === 'actor' ? actor.id : null, onReady: () => render(state.get()) });
    }
    const result = events.render({
      events: atlas.activeEvents,
      window: timeWindow,
      selected: s.selected,
      pathIds,
      actorIds,
      // The whole walk, when one is open: where the narrative is going, not
      // only where the reader has got to (narrative.js).
      narrativeIds: narrativeSet(atlas, s),
      // Empty unless the reader has chosen a horizon year (horizon.js).
      reachable: horizonSet(atlas, s),
      chainEdges,
      consequenceEdges,
      eventById: atlas.events,
      k: transform.k,
      view: view(),
      spread,
    });
    // A spread survives a re-render — the band moving, a selection — for as
    // long as its cluster is still there to be spread.
    if (spread && !result.spread) spread = null;
  }

  state.subscribe(render);
  render(state.get());
  return { render };
}

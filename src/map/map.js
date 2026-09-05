// The SVG map: scaffold, pan and zoom. Layers draw; this file only places
// them and forwards state.
//
// There is no year control here any more. Time is a window now, and the
// timeline's band is the one place it is set — a slider that moved only one
// end of it would have been a second, quieter answer to the same question.

import { svg } from '../util/dom.js';
import { fitBounds, WORLD, viewBboxIn, bboxTransform } from './projection.js';
import { createLandLayer } from './layers/land.js';
import { createPresencesLayer } from './layers/presences.js';
import { chainEdges, walkOrSelect } from '../chain.js';
import { createEventsLayer } from './layers/events.js';
import { DEEPEST_ZOOM } from '../cluster.js';
import { resolveWindow, withMargin } from '../util/window.js';
import { workingSet, heldSet } from '../emphasis.js';
import { normalizeBbox } from '../state.js';
import { renderKey } from '../render-key.js';
import { exportButton } from '../share.js';

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
// The pan and the wheel move the transform many times a second; the box in
// the URL is written once they stop. Long enough that a drag across the
// Atlantic is one write and one redrawn timeline, short enough that letting
// go and looking down finds the lanes already narrowed.
const BBOX_SETTLE = 180;

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
  // A shard of borders that will not load leaves the map showing the year
  // before it, which is usually the same picture and therefore says nothing.
  // This is the one place it is said. It is not state and never reaches the
  // URL: whether one request failed on this machine is not part of what the
  // link describes.
  const territoriesNote = document.createElement('p');
  territoriesNote.className = 'map-note';
  territoriesNote.hidden = true;
  territoriesNote.textContent = 'The territories could not be loaded; the borders drawn are the last that arrived.';
  const presences = createPresencesLayer(presencesGroup, projection, {
    atlas,
    onSelect: (id) => state.set({ actor: id, selected: null, chain: [] }),
    onFailed: (failed) => { territoriesNote.hidden = !failed; },
  });
  // A cluster of marks that zooming can pull apart is zoomed into; one whose
  // members share a point — Lisbon's thirty-seven — is spread open instead,
  // because no zoom would ever separate those. Either way the panel is given
  // the members, so there is a way to read the stack and a way in from the
  // keyboard.
  const events = createEventsLayer(eventsGroup, projection, {
    pointOf: atlas.pointOf,
    // One rule for the three pictures: a click on a consequence of what is
    // open follows that link, anything else starts afresh (chain.js). The map
    // draws the consequence line and then refused to follow it.
    onSelect: (id) => walkOrSelect(state, atlas, id),
    onCluster: (cluster) => {
      if (onCluster) onCluster(cluster);
      if (cluster.splittable) {
        spread = null;
        // Straight to the zoom where everything that can leave the cluster
        // has left, so one click turns a blob over a capital into the stack
        // of records that really do share a point.
        const wanted = cluster.coreZoom ?? transform.k * CLUSTER_ZOOM_STEP;
        // And that zoom is not rounded to a bucket. `coreZoom` is chosen so
        // the cluster comes apart at exactly it; the bucket below it is a
        // zoom that does not part them, and the click would do nothing but
        // move the map (review of the health plan, finding 12).
        exactZoom = cluster.coreZoom !== null;
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
  // Whether the zoom in force was chosen to split a cluster, in which case
  // the grouping is done at exactly it rather than at the bucket below it
  // (cluster.js, `zoomBucket`). Set when a splittable cluster is clicked and
  // cleared by every other way the zoom can move.
  let exactZoom = false;
  const applyTransform = () => {
    viewport.setAttribute('transform', `translate(${transform.x} ${transform.y}) scale(${transform.k})`);
  };
  // --- what the reader can actually see -----------------------------------
  //
  // The `<svg>` carries a viewBox and no preserveAspectRatio of its own, and
  // CSS gives it the whole pane, so it is letterboxed: at a map area wider
  // than 960 × 540's ratio the visible SVG units run from about −220 to about
  // 1180, and a third of the picture lies outside the nominal box. Every
  // number this file derives from the screen therefore goes through the
  // element's own matrix, as the graph view already did (graph-view.js) —
  // scaling by the bounding rectangle instead put the wheel's centre, the
  // pan's speed, the labels and the published box all a long way out (health
  // review A, finding 4).
  const nominalBox = { x0: 0, y0: 0, x1: WIDTH, y1: HEIGHT };
  const matrix = () => {
    if (typeof DOMPoint !== 'function' || typeof root.getScreenCTM !== 'function') return null;
    const ctm = root.getScreenCTM();
    // Null before the element is laid out, and singular in a pane that has
    // been collapsed to nothing; either way there is no picture to measure.
    return ctm && ctm.a !== 0 && ctm.d !== 0 ? ctm.inverse() : null;
  };
  const clientToSvg = (inverse, clientX, clientY) => {
    const p = new DOMPoint(clientX, clientY).matrixTransform(inverse);
    return [p.x, p.y];
  };
  // The rectangle of SVG space the pane shows, in the units the transform is
  // applied in. The nominal box when there is nothing to measure, which is
  // what a test with no layout behind it gets.
  const visibleBox = () => {
    const inverse = matrix();
    const rect = root.getBoundingClientRect?.();
    if (!inverse || !rect || !rect.width || !rect.height) return nominalBox;
    const [ax, ay] = clientToSvg(inverse, rect.left, rect.top);
    const [bx, by] = clientToSvg(inverse, rect.right, rect.bottom);
    return { x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by) };
  };
  // The rectangle of projected space on screen: what the events layer needs
  // to know which clusters are worth labelling. The visible rectangle, not the
  // nominal one, so a label at the side of a wide pane is a candidate.
  const view = () => {
    const box = visibleBox();
    return {
      x0: (box.x0 - transform.x) / transform.k,
      y0: (box.y0 - transform.y) / transform.k,
      x1: (box.x1 - transform.x) / transform.k,
      y1: (box.y1 - transform.y) / transform.k,
    };
  };

  // --- the box the timeline reads -----------------------------------------
  //
  // Pan and zoom are still not state; what the reader can *see* is. The box
  // is written when the movement stops rather than on every frame, because a
  // write redraws the lanes and rewrites the URL, and neither is worth doing
  // sixty times a second.
  //
  // `published` is what this map last put in the state. Without it the map's
  // own write would come back through the subscription as a box somebody
  // else had asked for, and the map would refit itself to where it already
  // was — once per pan, for ever.
  let published = null;
  let settling = null;
  const sameBox = (a, b) => (a === b) || Boolean(a && b && a.every((v, i) => v === b[i]));
  const publishBbox = () => {
    settling = null;
    const bbox = normalizeBbox(viewBboxIn(projection, transform, visibleBox()));
    if (sameBox(bbox, state.get().bbox)) return;
    published = bbox;
    state.set({ bbox });
  };
  const scheduleBbox = () => {
    if (typeof setTimeout !== 'function') return publishBbox();
    if (settling) clearTimeout(settling);
    settling = setTimeout(publishBbox, BBOX_SETTLE);
    return undefined;
  };

  // A link that names a box opens on it. Only a box the map did not write
  // itself moves it: clearing the box is the timeline's pin saying "show me
  // everything again", which is a statement about the lanes and not an
  // instruction to fly the map back to the Atlantic.
  const fitTo = (bbox) => {
    published = bbox;
    exactZoom = false;
    transform = bboxTransform(projection, bbox, { width: WIDTH, height: HEIGHT, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM });
    applyTransform();
  };

  const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

  // Puts a point in the middle of the map at a given zoom. Animated, unless
  // the reader has asked for less motion, in which case it simply arrives.
  //
  // The animation moves the transform and nothing else. It used to redraw the
  // whole layer on every one of its sixteen frames, which meant grouping
  // every point sixteen times over 260 ms for a picture the reader is
  // watching slide past (health review A, finding 13); what they see now is
  // the same picture scaled, which is what a zoom looks like, and the marks
  // are put back at their screen size when it stops.
  function zoomTo({ x, y }, k) {
    const target = { k, x: WIDTH / 2 - x * k, y: HEIGHT / 2 - y * k };
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
      transform = target;
      applyTransform();
      render(state.get());
      scheduleBbox();
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
      if (t < 1) {
        requestAnimationFrame(frame);
        return;
      }
      render(state.get());
      scheduleBbox();
    };
    requestAnimationFrame(frame);
  }
  const toSvg = (e) => {
    const inverse = matrix();
    if (inverse) return clientToSvg(inverse, e.clientX, e.clientY);
    const rect = root.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return [0, 0];
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
    if (dragged) scheduleBbox();
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
    // And a click on the sea — no mark, no cluster, no territory — puts down
    // what the reader was holding. Only the event and the path: the actor is
    // a different question, and a click on a territory is how it is asked.
    if (e.target.closest('[data-id], [data-cluster], [data-actor]')) return;
    const s = state.get();
    if (s.selected || s.chain.length) state.set({ selected: null, chain: [] });
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
    exactZoom = false;
    applyTransform();
    render(state.get());
    scheduleBbox();
  }, { passive: false });
  root.addEventListener('dblclick', () => {
    transform = { x: 0, y: 0, k: 1 };
    spread = null;
    exactZoom = false;
    applyTransform();
    render(state.get());
    scheduleBbox();
  });

  container.append(root);
  container.append(territoriesNote);
  container.append(exportButton(root, 'map'));

  // --- when the map is drawn again ----------------------------------------
  //
  // The whole state, plus what the map holds outside it: the transform, the
  // rectangle on screen, the spread, and a count of the territory shards
  // that have arrived. That last one is not decoration — the presences layer
  // asks for a redraw when a shard lands, and a key that could not see it
  // would skip exactly that redraw and leave the borders undrawn for ever
  // (render-key.js).
  let drawnFor = null;
  let shardsIn = 0;

  function render(s, { force = false } = {}) {
    const box = view();
    const key = renderKey(s, transform.x, transform.y, transform.k, spread ?? '', shardsIn, exactZoom,
      Math.round(box.x0), Math.round(box.y0), Math.round(box.x1), Math.round(box.y1));
    if (!force && key === drawnFor) return;
    drawnFor = key;
    draw(s, box);
  }

  function draw(s, box) {
    landGroup.style.display = s.layers.includes('land') ? '' : 'none';
    presencesGroup.style.display = s.layers.includes('territories') ? '' : 'none';
    eventsGroup.style.display = s.layers.includes('events') ? '' : 'none';
    // Events by overlap with the window, territories by its far end: a
    // border is a state of affairs at a moment, an event is an interval.
    const timeWindow = resolveWindow(s, atlas.extent);
    // And one period either side of it, which is as far out as the map draws
    // at all. Inside the margin and outside the band a mark is faded; past
    // the margin there is no mark, and the timeline is where the reader sees
    // that the rest of the dataset is still there (window.js).
    const margin = withMargin(timeWindow);

    // What the reader is working with, from the one place that decides it
    // (emphasis.js). The lens is applied to every part of it there: it
    // removes rather than dims, and it removes from the marks, the lines of
    // the chain, the actor's emphasis and the horizon's reachable set alike.
    const working = workingSet(atlas, s);
    const lens = working.lens;
    const kept = (id) => !lens || lens.has(id);

    // The two lists of *edges*, which are lines and not marks: the ids of
    // their ends are in the working set, the edge objects are needed here.
    const walked = chainEdges(atlas, s.chain)
      .filter((e) => kept(e.from) && kept(e.to));
    const consequenceEdges = (s.selected ? (atlas.adjacency.out.get(s.selected) ?? []) : [])
      .filter((e) => kept(e.from) && kept(e.to));
    // A selected event is on the path it is the head of, which is what makes
    // its mark madder rather than merely ringed.
    const pathIds = new Set([...working.path, ...working.selected]);
    // Through resolve(), so a former id in the URL highlights the same
    // actor the panel is showing.
    const actor = s.actor ? atlas.resolve(s.actor) : null;
    // Drawn before the marks so the marks are appended over them, and only
    // when the layer is on: an off layer costs no fetch.
    if (s.layers.includes('territories')) {
      presences.render({
        year: timeWindow ? timeWindow.to : null,
        actorId: actor && actor.kind === 'actor' ? actor.id : null,
        onReady: () => { shardsIn += 1; render(state.get()); },
      });
    }
    const result = events.render({
      events: lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents,
      window: timeWindow,
      margin,
      selected: s.selected,
      pathIds,
      actorIds: working.actor,
      // The whole walk, when one is open: where the narrative is going, not
      // only where the reader has got to (narrative.js).
      narrativeIds: working.narrative,
      // Empty unless the reader has chosen a horizon year (horizon.js).
      reachable: working.reachable,
      // Everything the reader is holding keeps a mark of its own; the wider
      // set is what is drawn at all, in the window or out of it.
      alone: heldSet(working),
      kept: heldSet(working, { reachable: true }),
      chainEdges: walked,
      consequenceEdges,
      eventById: atlas.events,
      k: transform.k,
      view: box,
      spread,
      exactZoom,
    });
    // A spread survives a re-render — the band moving, a selection — for as
    // long as its cluster is still there to be spread.
    if (spread && !result.spread) spread = null;
  }

  // A pane that changes size shows a different part of the world at the same
  // transform, so the labels are chosen again and the box is written again —
  // but only when there is a box in force. A resize is not a way of asking to
  // narrow the timeline: a reader who has never moved the map should not find
  // the lanes filtered because they widened their window.
  if (typeof ResizeObserver !== 'undefined') {
    let last = '';
    new ResizeObserver(() => {
      const rect = root.getBoundingClientRect();
      const now = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
      if (now === last) return;
      last = now;
      render(state.get());
      if (state.get().bbox) scheduleBbox();
    }).observe(container);
  }

  // A link that names a box opens on it, before anything is drawn.
  if (state.get().bbox) fitTo(state.get().bbox);

  state.subscribe((s) => {
    if (s.bbox && !sameBox(s.bbox, published)) fitTo(s.bbox);
    render(s);
  });
  render(state.get());
  return { render, root };
}

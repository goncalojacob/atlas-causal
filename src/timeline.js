// Lanes, events as bars, and the window of time drawn over them as a band
// with a handle at each end. The scale is injected (timeline-scale.js) so
// deep time can swap it.
//
// What a lane *is* is not decided here any more (M14): lanes.js is asked,
// and the graph view asks the same file, so the two pictures cannot disagree
// about which lane an event belongs in. Without a grouping — the default —
// there are no named lanes at all: the bars are packed into as many
// unlabelled rows as it takes for none of them to overlap at this width.
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
import { fromAstronomical, formatYear } from './util/dates.js';
import { resolveWindow, overlaps, decadeOf, zoomWindow, withMargin } from './util/window.js';
import { renderKey } from './render-key.js';
import { horizonBand } from './horizon.js';
import { workingSet, heldSet } from './emphasis.js';
import { walkOrSelect } from './chain.js';
import { lanesFor, rowLanes, laneOf, barBox } from './lanes.js';
import { eventsInView } from './util/viewport.js';

const LANE_HEIGHT = 34;
// A packed row carries no label, so it needs only the height of a bar and
// the air around it; ten rows of a named lane's height would push the map
// off the screen.
const ROW_HEIGHT = 22;
// How far a lane and a row may be squeezed to fit the pane. A named lane has
// to keep room for its label; a packed row only for a bar and a hair of air
// around it. Past this the lanes stop shrinking and the pane scrolls, which
// is the honest answer: a row two pixels high is not a row.
const MIN_LANE_HEIGHT = 22;
const MIN_ROW_HEIGHT = 14;
// Past this the rows share and stacking draws the overlap as one bar with a
// count, which is what the timeline did before packing existed.
const MAX_ROWS = 20;
// The gap the packing leaves between two bars in one row. Wider than the
// hairline that would technically not overlap: two bars touching read as one
// long bar.
const ROW_GAP = 4;
const LABEL_WIDTH = 120;
// Room above the lanes for three lines that must not sit on top of one
// another: what the map's borders are dated to, then the two years the
// window's handles are at, then the axis's own ticks. They used to share one
// line, and a window as wide as the data drew "1911" over "1911 of 1911".
const MARKER_HEIGHT = 32;
const AXIS_HEIGHT = MARKER_HEIGHT + 26;
const PADDING = 0.04;
// Two bars whose middles are closer than this are drawn as one. In pixels of
// the lane, not years: what overlaps is a question about the drawing.
const BAR_MERGE = 11;
const HANDLE_WIDTH = 9;
const BADGE_SIZE = 10;
// The stub an event past the margin is drawn as: a tick on the floor of its
// lane, faded, with no title and no click. It is not a bar — it says the
// dataset carries on past what the reader is looking at, and nothing else
// (ARCHITECTURE.md, "The window is what the views draw").
const STUB_WIDTH = 2;
const STUB_HEIGHT = 3;

export function createTimeline(container, { atlas, state, createScale = createLinearScale, onCluster = null }) {
  const root = svg('svg', { class: 'timeline', role: 'group', 'aria-label': 'Timeline and the window of time' });

  // The one part of the timeline that is not drawn in SVG: the line saying
  // the lanes are showing what the map is looking at rather than the world,
  // and the pin that gives the world back. A button is a button — focus ring,
  // keyboard, a name a screen reader can say — and none of that is free
  // inside an <svg>.
  const note = document.createElement('p');
  note.className = 'timeline-note';
  note.hidden = true;
  const noteText = document.createElement('span');
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'pin';
  pin.textContent = 'show the world';
  pin.title = 'Draw every event again, wherever the map is looking';
  // The pin says something about the lanes, not about the map: it stops the
  // filtering and leaves the map where the reader put it. Moving the map
  // again narrows the lanes again, which is the whole of the coupling.
  pin.addEventListener('click', () => state.set({ bbox: null }));
  note.append(noteText, pin);
  container.appendChild(note);
  container.appendChild(root);

  // The lanes, their height and the height of the drawing are all decided by
  // the grouping, and the grouping changes under the reader: they are read
  // at every render and not once at build.
  let lanes = [];
  let laneHeight = LANE_HEIGHT;
  let height = AXIS_HEIGHT + LANE_HEIGHT;

  const domain = atlas.extent
    ? [atlas.extent.min - (atlas.extent.max - atlas.extent.min) * PADDING - 1, atlas.extent.max + (atlas.extent.max - atlas.extent.min) * PADDING + 1]
    : [0, 1];

  let width = 0;
  // The height the pane gives the drawing, minus whatever the note above it
  // is taking. The timeline is as tall as its pane and no taller: the lanes
  // are laid out into that height rather than the pane growing to hold them,
  // which is what left the bottom row clipped whenever the window was short
  // (owner, 5 September).
  let paneHeight = 0;
  let scale = null;
  // What the last render drew, so a click on a stack can be answered with the
  // cluster itself rather than an id the caller would have to look up.
  let drawn = new Map();
  // The width and the scale first, because the packing needs the scale to
  // know what overlaps; the height only once the lanes are known.
  const measure = () => {
    width = Math.max(container.clientWidth || 960, 320);
    scale = createScale({ domain, range: [LABEL_WIDTH, width - 12] });
    // The note is inside the pane and above the drawing, so it is the pane's
    // height less the note's, and it is measured after `note.hidden` is set.
    paneHeight = Math.max(0, (container.clientHeight || 0) - (note.hidden ? 0 : note.offsetHeight || 0));
  };
  const resize = () => {
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
    if (!atlas.extent) return;
    const handle = e.target.closest('[data-window]');
    // The empty ground of the lanes is a drag surface too, and it slides the
    // band as the band itself does: the gesture that pans the map sideways
    // should move the window here, since time is the timeline's one
    // dimension. A press on a bar or a stack is not a drag — it is how a
    // record is opened.
    const onGround = !handle
      && !e.target.closest('[data-id], [data-cluster]')
      && yearAt(e.clientX).x >= LABEL_WIDTH;
    if (!handle && !onGround) return;
    const window = resolveWindow(state.get(), atlas.extent);
    drag = {
      kind: handle ? handle.getAttribute('data-window') : 'band',
      origin: window,
      startYear: yearAt(e.clientX).year,
    };
    dragged = false;
    try { root.setPointerCapture(e.pointerId); } catch { /* no such pointer any more */ }
    e.preventDefault();
  });

  // The wheel narrows or widens the band around the year under the cursor.
  // The lanes themselves do not move: they stay on the whole extent of the
  // data (M6), so "zooming" the timeline is a statement about the window and
  // nothing else. The map's own factor, so both pictures answer a wheel at
  // the same rate.
  root.addEventListener('wheel', (e) => {
    if (!atlas.extent) return;
    const { x, year } = yearAt(e.clientX);
    if (x < LABEL_WIDTH) return;
    e.preventDefault();
    const whole = Math.max(atlas.extent.max - atlas.extent.min, 1);
    setWindow(zoomWindow(resolveWindow(state.get(), atlas.extent), year, e.deltaY, { whole }));
  }, { passive: false });
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

  // --- the bars from the keyboard -----------------------------------------
  //
  // Nothing in the lanes could be reached from the keyboard: a <rect> is not
  // a button, and there is no button to be had inside an <svg> (health review
  // B, finding 11). Every bar is a control now, but Tab does not visit them
  // one by one — twenty thousand rects would be twenty thousand stops. One
  // bar per lane is in the tab order and the arrow keys move along the lane
  // from there, which is the roving tabindex the finding asks for.
  //
  // Which bar that is, per lane, is remembered by what it names, so that
  // redrawing the lanes does not send the focus back to the first bar.
  const roving = new Map();
  const keyOf = (el) => el.getAttribute('data-id') ?? `cluster:${el.getAttribute('data-cluster')}`;
  const barControl = (laneId, label) => ({
    'data-bar': '', 'data-lane': laneId, tabindex: '-1', role: 'button', 'aria-label': label,
  });
  // Matched in JavaScript rather than in a selector: a lane's id comes from
  // the data and has no business being escaped into one.
  const barsOf = (laneId) => [...root.querySelectorAll('[data-bar]')]
    .filter((el) => el.getAttribute('data-lane') === laneId)
    .sort((a, b) => Number(a.getAttribute('x')) - Number(b.getAttribute('x')));

  const applyRoving = () => {
    const byLane = new Map();
    for (const el of root.querySelectorAll('[data-bar]')) {
      const lane = el.getAttribute('data-lane');
      if (!byLane.has(lane)) byLane.set(lane, []);
      byLane.get(lane).push(el);
    }
    for (const [lane, list] of byLane) {
      list.sort((a, b) => Number(a.getAttribute('x')) - Number(b.getAttribute('x')));
      const wanted = roving.get(lane);
      const chosen = list.find((el) => keyOf(el) === wanted) ?? list[0];
      for (const el of list) el.setAttribute('tabindex', el === chosen ? '0' : '-1');
      roving.set(lane, keyOf(chosen));
    }
    for (const lane of [...roving.keys()]) if (!byLane.has(lane)) roving.delete(lane);
  };

  const activate = (bar) => {
    const id = bar.getAttribute('data-id');
    if (id) {
      // The same rule the map and the graph follow: a bar that is a
      // consequence of what is open is a step of the walk (chain.js).
      walkOrSelect(state, atlas, id);
      return;
    }
    const cluster = drawn.get(bar.getAttribute('data-cluster'));
    if (cluster && onCluster) onCluster(cluster);
  };

  // The focused bar is drawn again on every state change, so what it names is
  // remembered across the redraw and the focus given back to whatever stands
  // for it now.
  const focusedBar = () => {
    const active = root.ownerDocument?.activeElement;
    return active && root.contains(active) && active.hasAttribute?.('data-bar')
      ? { lane: active.getAttribute('data-lane'), key: keyOf(active) } : null;
  };
  const restoreFocus = (was) => {
    if (!was) return;
    const bar = barsOf(was.lane).find((el) => keyOf(el) === was.key);
    if (bar) bar.focus?.({ preventScroll: true });
  };

  const focusBar = (bar) => {
    if (!bar) return;
    const lane = bar.getAttribute('data-lane');
    for (const el of barsOf(lane)) el.setAttribute('tabindex', el === bar ? '0' : '-1');
    roving.set(lane, keyOf(bar));
    bar.focus?.({ preventScroll: true });
  };

  root.addEventListener('keydown', (e) => {
    const bar = e.target.closest?.('[data-bar]');
    if (!bar) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(bar);
      return;
    }
    const lane = barsOf(bar.getAttribute('data-lane'));
    const at = lane.indexOf(bar);
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (step) {
      e.preventDefault();
      focusBar(lane[Math.min(lane.length - 1, Math.max(0, at + step))]);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      focusBar(e.key === 'Home' ? lane[0] : lane[lane.length - 1]);
    }
  });

  root.addEventListener('click', (e) => {
    if (dragged) {
      dragged = false;
      return;
    }
    const bar = e.target.closest('[data-id], [data-cluster]');
    if (bar) {
      if (bar.hasAttribute('data-bar')) focusBar(bar);
      activate(bar);
      return;
    }
    if (e.target.closest('[data-window]')) return;
    // A click on the empty ground puts down what the reader was holding. It
    // used to mean "map at that year"; the ground is a drag surface now
    // (STATUS.md, deviation 170), and a gesture that both moved time and
    // dropped the walked chain would be two answers to one click. The year is
    // still one double-click away, and "Map at 1911" is still on the card.
    const s = state.get();
    if (s.selected || s.chain.length) state.set({ selected: null, chain: [] });
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

  // The height of a bar and where it sits in its lane, from the lane's own
  // height: a packed row is shorter than a named lane because it has no label
  // to make room for.
  const barHeight = () => Math.max(8, laneHeight - 16);
  const barTop = (i) => AXIS_HEIGHT + i * laneHeight + (laneHeight - barHeight()) / 2;

  function laneBars(root_, lane, i, events, s, window, actorIds, narrativeIds, pathIds, reachable) {
    const y = barTop(i);
    const height_ = barHeight();
    // barBox is lanes.js's, and it is the geometry the packing itself used:
    // a row packed on one geometry and drawn on another would overlap
    // exactly where it promised not to.
    const geometry = (event) => barBox(event, scale, { openEnd: domain[1] });

    const alone = [];
    const groups = { inside: [], outside: [] };
    for (const event of events) {
      const onPath = pathIds.has(event.id);
      const selected = event.id === s.selected;
      const ofActor = actorIds ? actorIds.has(event.id) : false;
      const ofNarrative = narrativeIds ? narrativeIds.has(event.id) : false;
      const inside = overlaps(event.when, window);
      const box = geometry(event);
      const depth = reachable.get(event.id) ?? null;
      const item = { id: event.id, event, onPath, selected, ofActor, ofNarrative, inside, depth, ...box };
      if (onPath || selected || ofActor || ofNarrative) alone.push(item);
      else groups[inside ? 'inside' : 'outside'].push(item);
    }

    const bar = (item, { count = 0, key = null } = {}) => {
      const classes = ['bar',
        item.instant ? 'instant' : '',
        item.ongoing ? 'ongoing' : '',
        item.inside ? '' : 'faded',
        count ? 'stack' : '',
        item.depth === null ? '' : `in-horizon ${horizonBand(item.depth)}`,
        item.ofNarrative ? 'of-narrative' : '',
        item.ofActor ? 'of-actor' : '',
        item.onPath ? 'on-path' : '',
        item.selected ? 'selected' : '',
      ].filter(Boolean).join(' ');
      const title = count
        ? `${item.event.title} — and ${count} more here`
        : item.inside ? item.event.title : `${item.event.title} — outside the window`;
      const data = key === null ? { 'data-id': item.id } : { 'data-cluster': key };
      const el = svg('rect', {
        x: item.x, y, width: item.width, height: height_, rx: 3, class: classes, ...data,
        ...barControl(lane.id, title),
      }, [svgTitle(title)]);
      root_.appendChild(el);
      if (count) {
        const badge = svg('text', {
          x: item.x + item.width + 3, y: y + height_ / 2, class: `cluster-count ${item.inside ? '' : 'faded'}`.trim(),
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

  // --- when the lanes are drawn again --------------------------------------
  //
  // The whole state, plus the pane the lanes are laid out into: everything
  // else this file draws from is derived from those two. The box the map
  // publishes 180 ms after a zoom is in the state and does change the lanes,
  // so it is in the key; the pan and the zoom themselves are not state and
  // never reach here (render-key.js).
  let drawnFor = null;

  function render(s, { force = false } = {}) {
    const key = renderKey(s, container.clientWidth || 0, container.clientHeight || 0);
    if (!force && key === drawnFor) return;
    drawnFor = key;
    draw(s);
  }

  function draw(s) {
    const wasFocused = focusedBar();
    root.replaceChildren();
    drawn = new Map();
    const window = resolveWindow(s, atlas.extent);
    // What is drawn as a bar at all: the band and one period either side of
    // it. Past that an event is a stub — it is still there, it is simply not
    // what the reader is looking at, and packing, stacking and labelling a
    // thousand of them was the cost the window exists to avoid.
    const margin = withMargin(window);
    // What the reader is working with, from the one place that decides it
    // (emphasis.js). The lens removes rather than dims: an event outside it
    // is not drawn faded, it is not drawn (lens.js).
    const working = workingSet(atlas, s);
    const lens = working.lens;
    const inLens = lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents;
    const pathIds = new Set([...working.path, ...working.selected]);
    // And then the map's viewport, which composes with the lens rather than
    // replacing it: the lens says which events exist, the box says which of
    // them are on screen. What the reader is holding is exempt from the box
    // and never from the lens (viewport.js) — and what the reader is holding
    // is the whole working set now, not the walk alone: an actor's events and
    // an open narrative's walk were being taken away by a box the reader had
    // panned somewhere else.
    const shown = eventsInView(inLens, s.bbox, atlas.places, { keep: heldSet(working), regions: atlas.regionBoxes });
    // The margin's two halves. What the reader is holding is a bar wherever
    // it falls, as it is exempt from the box: a walk whose next step was a
    // tick would be a walk the reader cannot follow.
    const held = heldSet(working);
    const near = [];
    const far = [];
    for (const event of shown) {
      (overlaps(event.when, margin) || held.has(event.id) ? near : far).push(event);
    }
    note.hidden = !s.bbox;
    if (s.bbox) {
      const n = shown.length;
      noteText.textContent = `${n} of ${inLens.length} ${inLens.length === 1 ? 'event' : 'events'} in view`;
    }
    // After the note, because it is above the drawing and takes some of the
    // pane's height; before the lanes, because they are laid out into it.
    measure();
    // A second emphasis, distinct from the path's: the events of the actor
    // whose card is open; the whole of an open narrative's walk, so the lanes
    // show where it is going and not only the step reached; and what the
    // selected event had led to by the horizon year, faded by how far out it
    // is. All three are the working set's.
    const actorIds = working.actor;
    const narrativeIds = working.narrative;
    const reachable = working.reachable;

    // The lanes, from the one file that decides what a lane is. Packing keeps
    // the walked path and the events of one place together where a row has
    // the room, so a reader following a chain finds its steps near each
    // other instead of scattered down the rows.
    let natural = ROW_HEIGHT;
    let minimum = MIN_ROW_HEIGHT;
    if (s.group === 'none') {
      lanes = rowLanes(near, scale, width, {
        openEnd: domain[1],
        gap: ROW_GAP,
        maxRows: MAX_ROWS,
        affinity: (event) => (pathIds.has(event.id) ? 'chain' : event.place ?? null),
      });
    } else {
      lanes = lanesFor(s.group, atlas, window, lens, s.lanes);
      natural = LANE_HEIGHT;
      minimum = MIN_LANE_HEIGHT;
    }
    // The lanes are laid out into the height the pane has. They never grow
    // past the height they want, and they shrink to fit down to a floor; past
    // that the drawing is taller than the pane and the pane scrolls, which is
    // better than a row two pixels high. The drawing is never shorter than
    // the pane either, so the band and its handles run its whole height and
    // there is no dead strip under the last lane.
    const rows = Math.max(lanes.length, 1);
    const room = Math.max(0, paneHeight - AXIS_HEIGHT);
    laneHeight = room > 0 ? Math.max(minimum, Math.min(natural, room / rows)) : natural;
    height = Math.max(AXIS_HEIGHT + rows * laneHeight, paneHeight);
    resize();

    lanes.forEach((lane, i) => {
      const y = AXIS_HEIGHT + i * laneHeight;
      root.appendChild(svg('rect', { x: 0, y, width, height: laneHeight, class: `lane ${i % 2 ? 'odd' : 'even'}` }));
      if (!lane.label) return;
      const label = svg('text', { x: 10, y: y + laneHeight / 2, class: `lane-label ${lane.other ? 'other' : ''}`.trim(), 'dominant-baseline': 'middle' }, [svgTitle(lane.label)]);
      label.textContent = lane.label.length > 16 ? `${lane.label.slice(0, 15).trimEnd()}…` : lane.label;
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
    for (const event of near) {
      const lane = laneOf(event, lanes);
      if (lane) byLane.get(lane.id).push(event);
    }
    // The stubs first, under everything: a tick on the floor of the lane the
    // event belongs to, or of the first row when there are no named lanes and
    // the packing never gave it one. Not a control — no id, no title, no
    // focus — because a two-pixel tick is not something to aim at.
    for (const event of far) {
      const lane = laneOf(event, lanes);
      const i = lane ? lanes.indexOf(lane) : 0;
      if (i < 0 || lanes.length === 0) continue;
      root.appendChild(svg('rect', {
        x: barBox(event, scale, { openEnd: domain[1] }).x,
        y: barTop(i) + barHeight() - STUB_HEIGHT,
        width: STUB_WIDTH, height: STUB_HEIGHT, class: 'bar stub faded', 'aria-hidden': 'true',
      }));
    }
    const deferred = [];
    lanes.forEach((lane, i) => {
      for (const item of laneBars(root, lane, i, byLane.get(lane.id), s, window, actorIds, narrativeIds, pathIds, reachable)) {
        deferred.push({ item, i });
      }
    });
    for (const { item, i } of deferred) {
      const y = barTop(i);
      const classes = ['bar',
        item.instant ? 'instant' : '',
        item.ongoing ? 'ongoing' : '',
        item.inside ? '' : 'faded',
        item.depth === null ? '' : `in-horizon ${horizonBand(item.depth)}`,
        item.ofNarrative ? 'of-narrative' : '',
        item.ofActor ? 'of-actor' : '',
        item.onPath ? 'on-path' : '',
        item.selected ? 'selected' : '',
      ].filter(Boolean).join(' ');
      root.appendChild(svg('rect', {
        x: item.x, y, width: item.width, height: barHeight(), rx: 3, class: classes, 'data-id': item.id,
        ...barControl(lanes[i]?.id ?? '', item.event.title),
      }, [svgTitle(item.event.title)]));
      if (item.selected || item.onPath) {
        const text = svg('text', { x: item.x + item.width + 4, y: y + barHeight() / 2, class: `bar-label ${item.selected ? 'selected' : ''}`, 'dominant-baseline': 'middle' });
        text.textContent = item.event.title;
        root.appendChild(text);
      }
    }

    if (window) for (const el of bandHandles(window, s)) root.appendChild(el);

    applyRoving();
    restoreFocus(wasFocused);
  }

  function bandShade({ from, to }) {
    const x0 = scale.x(from);
    const x1 = scale.x(to);
    return svg('rect', {
      x: x0, y: MARKER_HEIGHT, width: Math.max(x1 - x0, 1), height: height - MARKER_HEIGHT,
      class: 'window-band', 'data-window': 'band',
      // Focusable, so the arrow keys slide the band as they nudge a handle;
      // the handles are the two ends of the same slider and say so.
      tabindex: '0', role: 'slider',
      'aria-label': 'The window of time',
      'aria-valuemin': String(fromAstronomical(atlas.extent.min)),
      'aria-valuemax': String(fromAstronomical(atlas.extent.max)),
      'aria-valuenow': String(fromAstronomical(from)),
      'aria-valuetext': `${formatYear(fromAstronomical(from))} to ${formatYear(fromAstronomical(to))}`,
    }, [svgTitle('The window of time. Drag it or the ground to slide, drag an end to widen, the wheel to narrow, double-click a year to snap to its decade.')]);
  }

  // The two handles, and the one line the far end says about the borders the
  // map is drawing — which is a different year from `to` whenever the window
  // runs past where the outlines stop.
  function bandHandles({ from, to }, s) {
    const out = [];
    const ends = [['from', from], ['to', to]];
    // A window one year wide has both handles on the same pixel, and two
    // labels either side of it read as "1911 1911" — a range, which is what
    // the reader has just narrowed away from. One label, centred, instead.
    const single = from === to;
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
      if (single && kind === 'from') continue;
      const label = svg('text', {
        x: single ? x : kind === 'from' ? x - 6 : x + 6, y: MARKER_HEIGHT - 6,
        class: 'window-year', 'text-anchor': single ? 'middle' : kind === 'from' ? 'end' : 'start',
      });
      label.textContent = formatYear(fromAstronomical(year));
      out.push(label);
    }
    if (s.layers.includes('territories') && atlas.presenceCoverage) {
      const shown = atlas.territoryYear(to);
      // On its own line, at the right edge rather than beside the handle:
      // it is a note about the whole map, not about that year, and beside
      // the handle it collided with the handle's own label.
      const text = svg('text', {
        x: width - 8, y: 12, class: 'window-marker', 'text-anchor': 'end',
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

  // Both dimensions are worth redrawing for now: the width decides what the
  // packing can fit in a row, and the height decides how tall a lane is. The
  // guard is still needed and still against the same thing — a redraw that
  // changed the container's own size would set the two of them chasing each
  // other — but the pane no longer grows with the drawing (the row is a
  // length in the stylesheet, not `auto`), so the only loop left would be a
  // scrollbar appearing, which the compare stops in one turn.
  if (typeof ResizeObserver !== 'undefined') {
    let last = '';
    new ResizeObserver(() => {
      const now = `${container.clientWidth}x${container.clientHeight}`;
      if (now === last) return;
      last = now;
      render(state.get());
    }).observe(container);
  }
  state.subscribe(render);
  render(state.get());
  return { render };
}

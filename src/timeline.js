// Lanes, events as bars, and the window of time drawn over them as a band
// with a handle at each end. The scale is injected (timeline-scale.js) so
// deep time can swap it.
//
// **A view since M60, not a strip.** It used to run along the bottom of the
// map, thirty per cent of every screen whether the reader was reading it or
// not, which is what the owner asked to have back. Nothing about what it draws
// changed: the window is set from the masthead now (window-control.js) and the
// band is still here, because a control can say which years are in the window
// and only this picture can say where history is dense. It is given the whole
// pane when it is chosen, so the lanes have the height the strip never had.
//
// What a lane *is* is not decided here (M14): lanes.js is asked. Since M77
// there is one arrangement and it is what the atlas always opened on — the
// bars packed into as many unlabelled rows as it takes for none of them to
// overlap at this width, with no named lanes at all. The picker that offered
// one lane per actor, per place or per region went at the owner's word.
//
// The lanes stay on the whole extent of the data whatever the window is.
// Zooming them to the window was tried on paper and rejected: a handle at
// the edge of its own scale has no room left to widen into, so narrowing the
// window once would be a trap. Narrowing filters the map and greys the
// timeline outside the band; it does not rescale the lanes.
//
// **Every bar carries its title** (M77). The owner, 21 September: *"The
// timeline has too many events. As it is right now it is useless. For it to
// be useful it should only show parent and main events and the title for the
// events… and then when you click on it it can show you everything that
// happened during that time."* So there are no stacks and no `+n` badges any
// more: two bars that would have been drawn as one with a count are two bars
// in two rows, and the packing reserves the room each title needs beside its
// bar rather than only the room the bar itself takes. If the rows do not fit
// the pane, the pane scrolls — a title never disappears to make room.
//
// What is at rest is the **main events** (M65, unchanged), and an event with
// parts is drawn with the ring that says there is more inside it. Clicking it
// is a lens on it: the timeline then holds that event and what happened
// during it, each with its own title, and a click on the empty ground gives
// the whole picture back.

import { svg, reuse } from './util/dom.js';
import { timelineKey } from './view-key.js';
import { createTimelineScale } from './timeline-scale.js';
import { fromAstronomical, formatYear } from './util/dates.js';
import {
  resolveWindow, overlaps, withMargin, centuryCounts,
} from './util/window.js';
// The band, its two handles and every gesture that moves them: one
// implementation, shared with the strip M64 opens over the map, so the two
// pictures cannot come to disagree about the same window (window-band.js).
import {
  bandEvents, bandShade, bandHandles, bindWindowGestures,
} from './window-band.js';
import { renderKey, shardsArrived } from './render-key.js';
import { labelOf, LOADING_LABEL } from './attributes.js';
import { horizonBand } from './horizon.js';
import { workingSet, heldSet } from './emphasis.js';
import { walkOrSelect } from './chain.js';
import { rowLanes, laneOf, barBox } from './lanes.js';
import { largeEventsIn } from './large.js';
import { isParent, ringClasses } from './parts.js';
import { GLYPH_BOX, glyphAttributes, glyphClasses, hasGlyph, installGlyphs } from './map/glyphs.js';
import { eventsInView } from './util/viewport.js';
import { densityPath } from './density.js';

// How tall a row is: enough for a bar, the air around it, and the title
// written beside it. There is one kind of row since M77 — the named lanes
// went with the grouping — so there is one height and one floor, and the
// floor is the height a row of titles needs. It was 14 px while a row was a
// bar and nothing else, and a title at 14 px in a 14 px row is a title with
// its ascenders in the row above.
const ROW_HEIGHT = 22;
// The gap the packing leaves between two bars in one row. Wider than the
// hairline that would technically not overlap: two bars touching read as one
// long bar.
const ROW_GAP = 4;
// The gutter the scale starts at on the left. It was 120 px, the room a lane's
// name needed — and M77 took the names away: every lane is `row-i` with no
// label, the label branch below could never be taken, and the `laneLabels`
// layer was always empty, while the scale still began at 120, the gestures
// still treated x < 120 as *not the scale*, and the tick count was still
// computed on `width − 120`. On a 390 px phone that was 31 % of the drawing
// spent on nothing, at a time when the right gutter had been cut to 7 % for
// exactly this reason. What is left is the room the first bar's ring needs so
// it is not drawn half off the edge (M83, B11).
const LABEL_WIDTH = 8;
// And the gutter the scale stops short of on the right, where the titles are
// written. It was 12 px — enough to keep the last year's bar off the edge —
// and since M77 a bar carries its name beside it, so the last century's
// events were named into the pane's edge. Not the width of a title, which
// would be a sixth of the drawing spent on air: the room a short one needs,
// with a long one still running to the edge as every label on the map does.
//
// A share of the drawing under that, because on a phone it is not room going
// spare: 96 px of a 390 px pane is a third of what is left after the left
// gutter, and it took the window band — the one control on this view — under
// the forty pixels a thumb needs (`tests/phone-browser.test.mjs`).
const RIGHT_GUTTER = 96;
const RIGHT_GUTTER_SHARE = 0.07;
const rightGutter = (paneWidth) => Math.min(RIGHT_GUTTER, Math.round(paneWidth * RIGHT_GUTTER_SHARE));
// Room above the lanes for the lines that must not sit on top of one another,
// each on a row of its own and the rows spelled out (M82, A6).
//
// There were three and they were four: what the map's borders are dated to,
// the two years the window's handles are at, the names of the umbrella events
// the window holds, and the axis's own ticks. Three rows were declared and the
// umbrella names were squeezed in ten pixels under the band's years, which at
// this type size is two lines of text in the room for one — the reviewer's
// *"the umbrella names overprint each other"* and *"a second row of years runs
// under the first"* are the same fault seen twice.
//
// So the rows are named, they are a line apart, and the axis is as tall as the
// rows it holds. `LABEL_LINE` is not a type size — the axis is set at the one
// size `.timeline .tick-label` and `.large-band-label` give it in style.css,
// and this file adds none — it is the room that size needs, the same reckoning
// `graph-view/labels.js` makes about a line of its own labels.
const LABEL_LINE = 14;
// The borders line, top right: a note about the whole drawing.
const MARKER_Y = 12;
// Where the window band begins, which is under the borders line and over
// everything else. The band's two years stand just above it.
const MARKER_HEIGHT = 32;
const BAND_YEAR_Y = MARKER_HEIGHT - 6;
// The umbrella names, on as many rows as it takes for two of them not to
// overlap — and never more than this many, because the rows are room taken
// from the lanes. A name that fits on none of them is not drawn, which is
// M77's rule for a bar's title said about a band's name.
const UMBRELLA_Y = BAND_YEAR_Y + LABEL_LINE;
const UMBRELLA_ROWS = 2;
// And the axis's own ticks, last, against the lanes they measure.
const TICK_LABEL_Y = UMBRELLA_Y + UMBRELLA_ROWS * LABEL_LINE;
const AXIS_HEIGHT = TICK_LABEL_Y + 10;
// How near a tick label may come to one of the band's two years before the two
// read as one number twice (A6). Room and not a type size: a four-digit year
// at 11 px is about 24 px of ink, and a third of that again is the air that
// keeps two of them apart — the same reckoning `timeline-scale.js` makes about
// two tick labels. The band's year wins, because it is the one the reader is
// holding.
const YEAR_CLEAR = 34;
// How tall a row may grow. M60 gave the timeline the whole pane; its rows were
// still sized for the strip it used to be, so twenty of them at 22 px left a
// band of empty ground under the bottom one — 304 px of the 795 a 900 px
// window gives — and it read as a drawing that had stopped early (the owner,
// 18 September). A row takes the room going spare now, as far as this.
//
// Measured rather than picked: docs/m66-rows.md has the four candidates at
// both window heights and what each does to the bar inside the row.
const LANE_MAX = 44;
// The title beside a bar: how far from the bar's right end it starts, what
// size it is drawn at, and how wide a character of it is on average. The
// width is an estimate of the stylesheet and not a second one — the same
// reckoning `map/labels.js` and `graph-view/label-fit.js` make — and it is
// what the packing reserves so that two titles never land on each other.
const BAR_LABEL_SIZE = 11;
const BAR_LABEL_EM = 0.55;
const BAR_LABEL_GAP = 5;
// What a bar with no name yet reserves. A title arrives with its century
// (attributes.js) and the rows are packed again when it does; until then the
// room is a plausible one rather than none, so the arrival moves a few bars
// instead of re-cutting every row.
const BAR_LABEL_UNKNOWN = 16;
export const ROW_LIMITS = {
  AXIS_HEIGHT, ROW_HEIGHT, LANE_MAX,
};

// How tall a row is in a pane of this height: the room under the axis shared
// between the rows, never below the floor a title needs, never past the cap
// above. A pane that has measured nothing — a test with no layout behind it,
// the first render before the panes are sized — gets the height the row would
// like, which is what every pane got before the pane was measured at all.
//
// **It no longer shrinks to fit** (M77). It did, down to a 14 px floor, and
// below that the drawing took fewer rows rather than overflowing; a row is a
// bar and a title now, and a title is not something the timeline may drop to
// keep its drawing inside the pane. Too many rows for the pane is a pane that
// scrolls.
export function laneHeightFor(paneHeight, rows, { natural, minimum, cap = LANE_MAX }) {
  const room = Math.max(0, (paneHeight ?? 0) - AXIS_HEIGHT);
  if (!(room > 0) || !(rows > 0)) return natural;
  return Math.max(minimum, Math.min(Math.max(cap, natural), room / rows));
}
const PADDING = 0.04;
// The corner a bar is rounded by, and the ring outside a parent's bar: how far
// outside it on every side, and how thin. A ring says "there is more inside"
// and nothing else, so it is thinner than the bar's own outline.
const BAR_ROUND = 3;
const RING_GAP = 2;
const RING_WIDTH = 0.8;
// The bar that is big enough to carry its category's symbol, on either side:
// the symbol's own size, which is what "shorter or thinner than the glyph"
// means (glyphs-brief, §3). Below it the bar gets none — a symbol drawn at
// three pixels is a smudge, and a smudge says something false about how much
// the atlas knows — and it is never shrunk to fit, because twelve line
// drawings are not tellable apart below ten (review of the map block, F14).
//
// **No bar reaches it in a 22 px row**, where `barHeight` is 8 (deviation
// 585); a row that has grown into a pane's spare height does. Making the bar
// taller is a change to the timeline's own look and is the owner's to ask
// for.
const GLYPH_MIN_BAR = GLYPH_BOX;
// The stub an event past the margin is drawn as: a tick on the floor of its
// lane, faded, with no title and no click. It is not a bar — it says the
// dataset carries on past what the reader is looking at, and nothing else
// (ARCHITECTURE.md, "The window is what the views draw"). Where several fall
// on one column they are drawn as one, as tall as their number asks up to
// `STUB_TALLEST`: one path per row rather than one rect per event
// (density.js).
const STUB_WIDTH = 2;
const STUB_HEIGHT = 3;
const STUB_TALLEST = 9;

export function createTimeline(container, { atlas, state, createScale = createTimelineScale }) {
  const root = svg('svg', { class: 'timeline', role: 'group', 'aria-label': 'Timeline and the window of time' });

  // There used to be one part of the timeline that was not drawn in SVG: the
  // line saying the lanes were showing what the map is looking at rather than
  // the world, and the pin that gives the world back. Both are in the masthead
  // since M60 (window-control.js), where they are on every view — a reader on
  // the map could not see a note that lived under lanes that are not there any
  // more, and a count said in two places is a count that can disagree with
  // itself.
  container.appendChild(root);
  // And the key to the bars (M82, A7), beside the map's own and built the same
  // way: a row is drawn with the classes a bar is drawn with, so the key and
  // the picture cannot come to disagree.
  container.appendChild(timelineKey());

  // How many rows the packing needs, and therefore how tall the drawing is,
  // changes under the reader: both are read at every render and not once at
  // build.
  let lanes = [];
  let laneHeight = ROW_HEIGHT;
  let height = AXIS_HEIGHT + ROW_HEIGHT;

  const domain = atlas.extent
    ? [atlas.extent.min - (atlas.extent.max - atlas.extent.min) * PADDING - 1, atlas.extent.max + (atlas.extent.max - atlas.extent.min) * PADDING + 1]
    : [0, 1];
  // How the corpus is spread over the centuries, counted once at build and
  // not per render: it is a fact about the data, and the data does not change
  // under a reader. It is what decides whether the scale is the linear one it
  // has always been or the bucketed one (timeline-scale.js), and the atlas
  // opens on the same count in main.js, so the two never disagree about which
  // century is the busy one.
  const counts = centuryCounts(atlas.activeEvents);

  let width = 0;
  // The height the pane gives the drawing. The timeline is as tall as its pane
  // and no taller: the lanes are laid out into that height rather than the
  // pane growing to hold them, which is what left the bottom row clipped
  // whenever the window was short (owner, 5 September).
  let paneHeight = 0;
  let scale = null;
  // The layers, made once and kept. Everything this file draws goes into one
  // of them, in this order — which is the z-order, and the only place it is
  // decided — and each layer hands its children back to the next render
  // instead of being emptied and filled again (util/dom.js, `reuse`). One
  // layer per kind of element, because a layer that alternated <rect> and
  // <text> would swap one for the other on every render and keep nothing.
  const layers = {};
  for (const name of [
    'lanes', 'bands', 'bandLabels', 'ticks', 'tickLabels', 'band', 'strips',
    'bars', 'rings', 'barLabels', 'glyphs', 'held', 'heldRings', 'heldGlyphs', 'heldLabels', 'handles', 'handleLabels',
  ]) {
    layers[name] = svg('g', { class: `layer layer-${name}` });
    root.appendChild(layers[name]);
  }
  // The twelve symbols, if the map has not already put them in the document:
  // whichever view is built first owns the `<defs>` and both draw from it by
  // id, so a page with a timeline and no map still has its glyphs (glyphs.js).
  installGlyphs(root);

  // The width and the scale first, because the packing needs the scale to
  // know what overlaps; the height only once the lanes are known.
  const measure = () => {
    width = Math.max(container.clientWidth || 960, 320);
    scale = createScale({ domain, range: [LABEL_WIDTH, width - rightGutter(width)], counts, extent: atlas.extent });
    paneHeight = Math.max(0, container.clientHeight || 0);
  };
  const resize = () => {
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    root.setAttribute('width', width);
    root.setAttribute('height', height);
  };

  // --- moving the band ----------------------------------------------------
  //
  // Not written here any more (M64). A handle dragged, the ground under the
  // lanes slid, the wheel, the arrow keys and the double-click that snaps to a
  // decade are all `window-band.js`'s, and the strip over the map is given the
  // same ones — a band on the map that answered a wheel differently from this
  // one would be the second band this milestone exists to prevent.
  //
  // One argument is the timeline's own: the left gutter, which since M83 (B11)
  // is the room a ring needs and no longer the room a lane's name needed. A
  // press on a bar or a stack is not a drag but the way a record is opened.
  const gestures = bindWindowGestures(root, {
    atlas,
    state,
    scale: () => scale,
    viewWidth: () => width,
    gutter: () => LABEL_WIDTH,
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
  const keyOf = (el) => el.getAttribute('data-id');
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
    if (!id) return;
    // The same rule the map and the graph follow: a bar that is a consequence
    // of what is open is a step of the walk (chain.js). Otherwise it is a
    // selection, which since M65 is a lens on that event and its parts — the
    // owner's *"when you click on it it can show you everything that happened
    // during that time"*. Clicking the empty ground below puts it down again.
    walkOrSelect(state, atlas, id);
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
    // A drag is over by the time the click arrives, so whether it moved has to
    // outlive it — the same guard the map needs (STATUS.md, deviation 34). The
    // band keeps it now, and hands it over once.
    if (gestures.consumedDrag()) return;
    const bar = e.target.closest('[data-id]');
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

  // --- drawing ------------------------------------------------------------

  // The height of a bar and where it sits in its lane, from the lane's own
  // height: a packed row is shorter than a named lane because it has no label
  // to make room for.
  const barHeight = () => Math.max(8, laneHeight - 16);
  const barTop = (i) => AXIS_HEIGHT + i * laneHeight + (laneHeight - barHeight()) / 2;

  // What a bar is drawn like, said once: the drawing has two paths through it
  // — the ordinary bars and, above them, the ones the reader is holding — and
  // two lists of classes that could come apart would be two bars that look
  // different for the same reason.
  const barClasses = (item) => ['bar',
    item.instant ? 'instant' : '',
    item.ongoing ? 'ongoing' : '',
    item.inside ? '' : 'faded',
    item.lensNear ? 'lens-near' : '',
    item.depth === null ? '' : `in-horizon ${horizonBand(item.depth)}`,
    item.ofNarrative ? 'of-narrative' : '',
    item.ofActor ? 'of-actor' : '',
    item.onPath ? 'on-path' : '',
    item.selected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  // How much room a title needs beside its bar, in pixels of the drawing.
  // What the packing reserves and what the drawing then writes, so a row that
  // was packed with room for a title is a row the title fits in.
  const labelRoom = (name) => BAR_LABEL_GAP
    + (name === null ? BAR_LABEL_UNKNOWN : name.length) * BAR_LABEL_SIZE * BAR_LABEL_EM;

  // **Every bar carries its title** (M77). No `+N`, no unlabelled mark: the
  // owner asked for the titles and for nothing to be packed away behind a
  // count, and the rows are as many as that takes.
  const barLabel = (into, item, { classes, y: top, height: tall, name }) => {
    if (name === null) return;
    // To the right of the bar, which is where the packing reserved the room.
    // Never to its left: the packing is left to right and packs tight, so the
    // ground on that side belongs to the bar before this one and its own
    // title. What keeps the last century's titles on the drawing is the
    // gutter the scale ends at (`RIGHT_GUTTER`) and not a second side.
    into.take('text', {
      x: item.x + item.width + BAR_LABEL_GAP, y: top + tall / 2,
      class: `bar-label ${classes.includes('selected') ? 'selected' : ''}${item.inside ? '' : ' faded'}`.trim(),
      'dominant-baseline': 'middle', 'font-size': BAR_LABEL_SIZE,
    }, { text: name });
  };

  function laneBars(bars, rings, labels, glyphs, lane, i, events, s, window, actorIds, narrativeIds, pathIds, reachable, lensNear) {
    const y = barTop(i);
    const height_ = barHeight();
    // barBox is lanes.js's, and it is the geometry the packing itself used:
    // a row packed on one geometry and drawn on another would overlap
    // exactly where it promised not to.
    const geometry = (event) => barBox(event, scale, { openEnd: domain[1] });

    const alone = [];
    const ordinary = [];
    for (const event of events) {
      const onPath = pathIds.has(event.id);
      const selected = event.id === s.selected;
      const ofActor = actorIds ? actorIds.has(event.id) : false;
      const ofNarrative = narrativeIds ? narrativeIds.has(event.id) : false;
      const inside = overlaps(event.when, window);
      const box = geometry(event);
      const depth = reachable.get(event.id) ?? null;
      const item = {
        id: event.id, event, onPath, selected, ofActor, ofNarrative, inside, depth,
        // A direct neighbour of the lens's focus set, drawn faintly (lens.js).
        lensNear: lensNear ? lensNear.has(event.id) : false,
        ...box,
      };
      if (onPath || selected || ofActor || ofNarrative) alone.push(item);
      else ordinary.push(item);
    }

    const bar = (item) => {
      const classes = barClasses(item);
      // No name until the century carrying it has landed: a bar is drawn, and
      // labelled when the shard arrives (attributes.js). "Outside the window"
      // is the timeline's own word about a bar it has drawn, so it is said
      // either way.
      const name = labelOf(atlas, item.event);
      const title = name === null ? LOADING_LABEL
        : item.inside ? name : `${name} — outside the window`;
      const el = bars.take('rect', {
        x: item.x, y, width: item.width, height: height_, rx: BAR_ROUND, class: classes, 'data-id': item.id,
        ...barControl(lane.id, title),
      }, { title });
      // An event with parts: a second, thinner outline two pixels outside its
      // bar on every side — the one look a parent has on the three views
      // (m30c-brief, §1), and since M77 the whole of what says *this one opens*
      // on the timeline. Through the same pool as the bars, so a state change
      // updates the drawing in place rather than rebuilding it.
      if (isParent(atlas, item.event)) ring(item, { classes, y, height: height_ });
      // And the symbol of its category at the left end of the bar, vertically
      // centred.
      glyph(glyphs, item, { classes, y, height: height_ });
      barLabel(labels, item, { classes, y, height: height_, name });
      return el;
    };

    // The symbol over a bar, through its own pool: `reuse` hands the next
    // child of a layer back, and a layer that alternated <rect> and <use>
    // would swap one for the other on every render and keep nothing. Not a
    // control either — the bar underneath takes the click and the keys.
    //
    // A bar below the threshold carries none. `x` is the left end plus half
    // the symbol, because `glyphAttributes` takes the centre.
    const glyph = (into, item, { classes, y: top, height: tall }) => {
      if (!hasGlyph(item.event.category)) return;
      if (tall < GLYPH_MIN_BAR || item.width < GLYPH_MIN_BAR) return;
      into.take('use', glyphAttributes(item.event.category, {
        x: item.x + GLYPH_BOX / 2 + 1, y: top + tall / 2, size: GLYPH_BOX,
        classes: glyphClasses(classes, 'bar'),
      }));
    };

    // Not a control: no id, no title, no focus. What an event's parts are is
    // read on its card, and the bar under the ring opens it.
    //
    // Through a pool of its own since M77. It shared the bars', and a bar
    // leaving the packed rows for the layer of what the reader is holding
    // shifted every element after it by two — so a pooled element that had
    // been a bar came back as a ring and lost the `<title>` a ring does not
    // have. Seventy-three titles removed and made again on one click, for a
    // click that changes one bar (`tests/timeline-browser.test.mjs`, *a state
    // change updates the bars in place*).
    const ring = (item, { classes, y: top, height: tall }) => {
      rings.take('rect', {
        x: item.x - RING_GAP, y: top - RING_GAP,
        width: item.width + RING_GAP * 2, height: tall + RING_GAP * 2,
        rx: BAR_ROUND + RING_GAP, class: ringClasses(classes, 'bar'),
        'stroke-width': RING_WIDTH,
      });
    };

    for (const item of ordinary) bar(item);
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
    const key = renderKey(s, container.clientWidth || 0, container.clientHeight || 0,
      shardsArrived(atlas));
    if (!force && key === drawnFor) return;
    drawnFor = key;
    draw(s);
  }

  function draw(s) {
    const wasFocused = focusedBar();
    // Each layer hands its children out from the start again; whatever this
    // render does not ask for is dropped by `done()` at the end.
    const into = Object.fromEntries(Object.entries(layers).map(([name, g]) => [name, reuse(g)]));
    const window = resolveWindow(s, atlas.extent, atlas.opens);
    // What is drawn as a bar at all: the band and one period either side of
    // it. Past that an event is a stub — it is still there, it is simply not
    // what the reader is looking at, and packing, stacking and labelling a
    // thousand of them was the cost the window exists to avoid.
    const margin = withMargin(window);
    // What the reader is working with, from the one place that decides it
    // (emphasis.js). The lens removes rather than dims: an event outside it
    // is not drawn faded, it is not drawn (lens.js).
    const working = workingSet(atlas, s);
    // The lens and the category toggles together, from the one place both are
    // applied (emphasis.js): a category the reader turned off on the map is
    // not a bar here either.
    const drawable = working.shown;
    // The events this picture is of, from the one function the masthead's count
    // and the strip over the map also ask (window-band.js). It is the line that
    // used to stand here; it is shared so that the band on the map cannot draw
    // a different corpus from the lanes.
    const inLens = bandEvents(atlas, s);
    const pathIds = new Set([...working.path, ...working.selected]);
    // And then the map's viewport, which composes with the lens rather than
    // replacing it: the lens says which events exist, the box says which of
    // them are on screen. What the reader is holding is exempt from the box
    // and never from the lens (viewport.js) — and what the reader is holding
    // is the whole working set now, not the walk alone: an actor's events and
    // an open narrative's walk were being taken away by a box the reader had
    // panned somewhere else.
    // `{ reachable: true }` for the same reason the map passes it (map.js):
    // an answer to "what did this lead to by 2011" that the band had hidden
    // would not be an answer. Without it a reachable event past the fifty-year
    // margin went into the density strip with no `in-horizon` class and no
    // click, while `panel/horizon.js` said it was lit on all three views
    // (health review of 6 September, R11) — invisible on a 135-year corpus,
    // and wrong at 1415→.
    // **And `{ lens: true }`, since M83 (B4).** Without it the lens's own
    // children were held by nothing: a reader who opened the Thirty Years' War
    // while the atlas was on its busiest century got one faded bar for the war
    // and a row of two-pixel ticks for its parts. The promise M65/M79 make is
    // that opening an umbrella narrows all three views to it and its children,
    // and the graph was the only one keeping it.
    const held = heldSet(working, { lens: true, reachable: true });
    const shown = eventsInView(inLens, s.bbox, atlas.places, { keep: held, regions: atlas.regionBoxes });
    // The margin's two halves. What the reader is holding is a bar wherever
    // it falls, as it is exempt from the box: a walk whose next step was a
    // tick would be a walk the reader cannot follow.
    const near = [];
    const far = [];
    for (const event of shown) {
      (overlaps(event.when, margin) || held.has(event.id) ? near : far).push(event);
    }
    // Before the lanes, because they are laid out into the pane it measures.
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
    //
    // **As many rows as it takes, and no ceiling** (M77). There was one — the
    // number the pane could hold at a 14 px floor — and past it the bars
    // shared a row and stacking drew the overlap as one bar with a count.
    // Every bar carries its title now, and a title is not something the
    // timeline may pack away to keep its drawing inside the pane: what does
    // not fit the pane is what the pane scrolls to.
    //
    // And what the packing reserves is the bar **and its title**: two bars a
    // hair apart whose titles run over each other are two titles nobody can
    // read, which is the fault this section exists to fix and not a smaller
    // version of it.
    lanes = rowLanes(near, scale, width, {
      openEnd: domain[1],
      gap: ROW_GAP,
      extra: (event) => labelRoom(labelOf(atlas, event)),
      affinity: (event) => (pathIds.has(event.id) ? 'chain' : event.place ?? null),
    });
    // The rows are laid out into the height the pane has: they grow into the
    // room it has going spare, as far as `LANE_MAX`, and they never shrink
    // below the height a title needs. The drawing is never shorter than the
    // pane either, so the band and its handles run its whole height and there
    // is no dead strip under the last row.
    const rows = Math.max(lanes.length, 1);
    laneHeight = laneHeightFor(paneHeight, rows, { natural: ROW_HEIGHT, minimum: ROW_HEIGHT });
    // A whole number of pixels, and the last lane carried down to it. A lane
    // height that divides the pane exactly — which is what a full pane gives,
    // 337 over twenty rows — makes `rows * laneHeight` land a fraction of a
    // billionth of a pixel past the pane it was computed from, so the drawing
    // was that much shorter than its own last lane and the pane scrolled by
    // nothing at all. Rounding is the honest half-pixel; the clamp below is
    // what makes the ground under the last row end where the drawing does.
    height = Math.max(Math.round(AXIS_HEIGHT + rows * laneHeight), paneHeight);
    resize();

    lanes.forEach((row, i) => {
      const y = AXIS_HEIGHT + i * laneHeight;
      const tall = i === rows - 1 ? Math.max(0, height - y) : laneHeight;
      into.lanes.take('rect', { x: 0, y, width, height: tall, class: `lane ${i % 2 ? 'odd' : 'even'}` });
    });

    // Large events, under everything: a band the whole height of the drawing
    // rather than a bar in one lane, because a world war is the ground the
    // other events stand on and not one of them (large.js). It has no handles
    // and its title is on the axis, so it is never mistaken for the window
    // band — the one band on this drawing a reader can take hold of. The bar
    // stays: the band is not a control, and an event a reader could no longer
    // open or reach with the keyboard would be an event the timeline had
    // hidden.
    //
    // **A name is written whole or it is not written** (M82, A6, and M77's own
    // rule about a bar's title). It was cut at twenty-eight characters and laid
    // on one line whatever else was there, so "World War I" and "The Estado
    // Novo" were drawn over each other on the owner's own screenshot. Now each
    // takes the first of `UMBRELLA_ROWS` rows where the whole of it has room,
    // and a name that fits on none of them is not drawn: the event still has
    // its bar, with its own title under the pointer, which is the same answer
    // the graph gives for a mark it could not name (graph-view/labels.js).
    if (window) {
      const rows = Array.from({ length: UMBRELLA_ROWS }, () => []);
      for (const { event } of largeEventsIn(near.filter((e) => overlaps(e.when, window)), atlas)) {
        const box = barBox(event, scale, { openEnd: domain[1] });
        into.bands.take('rect', {
          x: box.x, y: AXIS_HEIGHT, width: box.width, height: Math.max(0, height - AXIS_HEIGHT),
          class: 'large-band', 'aria-hidden': 'true',
        });
        const name = labelOf(atlas, event);
        if (!name) continue;
        const x = box.x + 4;
        const end = x + labelRoom(name);
        const row = rows.findIndex((taken) => taken.every((other) => end <= other.x || other.end <= x));
        if (row < 0) continue;
        rows[row].push({ x, end });
        into.bandLabels.take('text', {
          x, y: UMBRELLA_Y + row * LABEL_LINE, class: 'large-band-label',
        }, { text: name });
      }
    }

    // The axis, once. A tick that lands under one of the band's two years is
    // left unlabelled: the year is already written there, in the reader's own
    // hand, and the same number twice on two rows is what read as two axes
    // (A6). The tick itself stays — it is the measure, and the measure has no
    // gaps.
    const bandYears = window ? [scale.x(window.from), scale.x(window.to)] : [];
    for (const tick of scale.ticks(Math.max(4, Math.floor((width - LABEL_WIDTH) / 90)))) {
      const x = scale.x(tick.value);
      into.ticks.take('line', { x1: x, y1: AXIS_HEIGHT - 6, x2: x, y2: height, class: 'tick' });
      if (bandYears.some((at) => Math.abs(at - x) < YEAR_CLEAR)) continue;
      into.tickLabels.take('text', { x, y: TICK_LABEL_Y, class: 'tick-label', 'text-anchor': 'middle' }, { text: tick.label });
    }

    // The band under the bars, its handles over them: the shading must not
    // hide a record, and a handle must always be grabbable.
    if (window) bandShade(into.band, window, bandBox());

    const byLane = new Map(lanes.map((lane) => [lane.id, []]));
    for (const event of near) {
      const lane = laneOf(event, lanes);
      if (lane) byLane.get(lane.id).push(event);
    }
    // The strip first, under everything: one path per row, on the floor of
    // the lane the events belong to, or of the first row when there are no
    // named lanes and the packing never gave them one. Not a control — no
    // id, no title, no focus — because a two-pixel tick is not something to
    // aim at, and sixteen thousand of them were sixteen thousand nodes the
    // browser rebuilt on every move of the band (density.js).
    if (lanes.length > 0) {
      const beyond = new Map();
      for (const event of far) {
        const lane = laneOf(event, lanes);
        const i = lane ? lanes.indexOf(lane) : 0;
        if (i < 0) continue;
        if (!beyond.has(i)) beyond.set(i, []);
        beyond.get(i).push(barBox(event, scale, { openEnd: domain[1] }).x);
      }
      // In row order, so a strip stays the same element from render to
      // render and only its `d` changes.
      for (const i of [...beyond.keys()].sort((a, b) => a - b)) {
        const d = densityPath(beyond.get(i), { floor: barTop(i) + barHeight(), unit: STUB_WIDTH, min: STUB_HEIGHT, max: STUB_TALLEST });
        if (d) into.strips.take('path', { d, class: 'bar stub faded', 'aria-hidden': 'true' });
      }
    }
    // A parent's parts used to be drawn with a bracket over them — a thin rule
    // along the top edge of the lane they shared — and only where the lanes
    // were named, which since M77 they never are. It went with the grouping.
    // What says an event has parts is the ring around its bar, on this view as
    // on the other two (parts.js), and what a click on it does is open it.

    const deferred = [];
    lanes.forEach((lane, i) => {
      for (const item of laneBars(into.bars, into.rings, into.barLabels, into.glyphs, lane, i, byLane.get(lane.id), s, window, actorIds, narrativeIds, pathIds, reachable, working.lensNear)) {
        deferred.push({ item, i });
      }
    });
    for (const { item, i } of deferred) {
      const y = barTop(i);
      const classes = barClasses(item);
      const name = labelOf(atlas, item.event);
      into.held.take('rect', {
        x: item.x, y, width: item.width, height: barHeight(), rx: BAR_ROUND, class: classes, 'data-id': item.id,
        ...barControl(lanes[i]?.id ?? '', name ?? LOADING_LABEL),
      }, { title: name ?? LOADING_LABEL });
      // And the ring around a parent the reader is holding, through this
      // layer's own pool rather than the bars': it has to sit above the
      // neighbours its bar sits above.
      if (isParent(atlas, item.event)) {
        into.heldRings.take('rect', {
          x: item.x - RING_GAP, y: y - RING_GAP,
          width: item.width + RING_GAP * 2, height: barHeight() + RING_GAP * 2,
          rx: BAR_ROUND + RING_GAP, class: ringClasses(classes, 'bar'),
          'stroke-width': RING_WIDTH,
        });
      }
      // The symbol too, for the same reason and through its own pool: a bar
      // the reader is holding sits above its neighbours and so does what is
      // drawn on it.
      if (hasGlyph(item.event.category)
        && barHeight() >= GLYPH_MIN_BAR && item.width >= GLYPH_MIN_BAR) {
        into.heldGlyphs.take('use', glyphAttributes(item.event.category, {
          x: item.x + GLYPH_BOX / 2 + 1, y: y + barHeight() / 2, size: GLYPH_BOX,
          classes: glyphClasses(classes, 'bar'),
        }));
      }
      // And its title, like every other bar's — it was the selection's and
      // the walked path's alone until M77, which is exactly the half of the
      // owner's sentence this milestone is about.
      barLabel(into.heldLabels, item, {
        classes, y, height: barHeight(), name,
      });
    }

    if (window) {
      bandHandles(into.handles, into.handleLabels, window, bandBox());
      territoryMarker(into.handleLabels, window, s);
    }

    for (const layer of Object.values(into)) layer.done();
    applyRoving();
    restoreFocus(wasFocused);
  }

  // The geometry of the band on this drawing: the whole height under the
  // marker row. What it is drawn like is `window-band.js`'s and is the same on
  // the strip over the map.
  const bandBox = () => ({
    scale, extent: atlas.extent, top: MARKER_HEIGHT, height: height - MARKER_HEIGHT, labelY: BAND_YEAR_Y,
  });

  // The two handles, and the one line the far end says about the borders the
  // map is drawing — which is a different year from `to` whenever the window
  // runs past where the outlines stop. The handles are shared; the line about
  // the borders is the timeline's own, because it is a note about what the map
  // beside it is showing and there is no map beside the strip.
  function territoryMarker(labels, { to }, s) {
    if (s.layers.includes('territories') && atlas.presenceCoverage) {
      const shown = atlas.territoryYear(to);
      // On its own line, at the right edge rather than beside the handle:
      // it is a note about the whole map, not about that year, and beside
      // the handle it collided with the handle's own label.
      labels.take('text', {
        x: width - 8, y: MARKER_Y, class: 'window-marker', 'text-anchor': 'end',
      }, {
        text: to > atlas.presenceCoverage.to
          ? `borders as of ${formatYear(fromAstronomical(shown))}, the latest the source covers`
          : to < atlas.presenceCoverage.from
            ? `no borders before ${formatYear(fromAstronomical(atlas.presenceCoverage.from))} in this source`
            : `borders as of ${formatYear(fromAstronomical(shown))}`,
      });
    }
  }

  // Both dimensions are worth redrawing for now: the width decides what the
  // packing can fit in a row, and the height decides how tall a lane is. The
  // guard is still needed and still against the same thing — a redraw that
  // changed the container's own size would set the two of them chasing each
  // other — but the pane no longer grows with the drawing (the row is a
  // length in the stylesheet, not `auto`), so the only loop left would be a
  // scrollbar appearing, which the compare stops in one turn.
  if (typeof ResizeObserver !== 'undefined') {
    let queued = false;
    // On the next frame rather than inside the callback. Since M77 the drawing
    // is regularly taller than its pane — every bar carries its title and the
    // rows are as many as that takes — so the first drawing brings a
    // scrollbar, the scrollbar changes the pane's width, and a render *inside*
    // the observer's own callback is the loop Chromium reports as *ResizeObserver
    // loop completed with undelivered notifications*. It always settled in one
    // turn and the picture was right either way; what it left was a console
    // error on an ordinary visit. A frame later is the same redraw with the
    // observation finished.
    new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      // **`render` decides, and nothing here second-guesses it** (M78). This
      // kept a string of the pane's size and skipped the render when it had
      // not moved — a guard that read the size *live, a frame after the
      // observation*, and so threw the observation away whenever the pane came
      // back to that size in between. The atlas is drawn from more than one
      // place: `remeasure` in main.js draws the timeline too, so the pane could
      // be observed at 295, drawn at 295 by that other path, be back at 795 by
      // the time this frame ran, and read as "unchanged" — leaving the rows
      // laid out for a pane the reader is no longer in, for good. Reproduced at
      // one round in thirty with a fresh browser each round, and red in one
      // browser pass in five.
      //
      // `render` already asks the right question: its key carries the pane's
      // width and height and is set by whoever last drew, from any path
      // (`drawnFor`). So a frame later, unconditionally, is both the loop
      // protection M77 added and the whole of the guard.
      const draw = () => {
        queued = false;
        render(state.get());
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(draw);
      else draw();
    }).observe(container);
  }
  state.subscribe(render);
  render(state.get());
  return { render };
}

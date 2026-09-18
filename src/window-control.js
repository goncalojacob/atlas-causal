// The window of time, set from the masthead.
//
// The owner, 18 September: *"I don't think the bottom timeline on the map is
// still necessary, I think something to choose the timeline is enough"*. The
// band and its two handles used to be the only way to move the window, and
// they cost the bottom third of every screen whether the reader was reading
// the lanes or not. This is the "something": two years the reader can read and
// type into, wherever they are.
//
// It is **not** a replacement for the timeline, and saying so is the whole of
// M60's argument. The strip did two jobs — setting the window, and showing
// where history is dense — and only the first is what a control can do. The
// second is why the timeline is a view now rather than deleted, and why the
// hint below is beside the two years: a reader on the map can still see that
// the corpus is heaped in one century, without leaving the map to find out.
//
// Three things, in the order a reader meets them:
//
//   1. the two ends of the window, as numbers to read and to type;
//   2. the density hint — one column per century of the data, the window's own
//      centuries marked — drawn at the same logarithmic, absolute scale the
//      timeline's density strip uses (density.js), from the tokens the
//      stylesheet already has and with no size, colour or type of its own;
//   3. what the map is looking at, when it is looking at part of the world:
//      "N of N events in view", with the pin that gives the world back. That
//      line lived under the lanes until M60 and would have gone with them.
//
// The pure half — what a typed pair of years is allowed to become, and where
// the columns of the hint go — is separate from the DOM, so `node --test`
// holds it without a browser.

import {
  fromAstronomical, toAstronomical, isValidYear,
} from './util/dates.js';
import {
  resolveWindow, centuryCounts, centuryOf, CENTURY,
} from './util/window.js';
import { columnHeight } from './density.js';
import { workingSet, heldSet } from './emphasis.js';
import { eventsInView } from './util/viewport.js';

// The hint's own box, in the units of its `viewBox`. Not a token and not a
// type size: it is the geometry of a drawing, like the eleven pixels of a lane
// label or the nine of a handle, and the brief's "no new hex value, token or
// type size" is about the palette and the type scale (m60-brief §4). Every
// colour it is drawn in is a variable in style.css and there is no new one.
export const DENSITY = Object.freeze({ width: 84, height: 12 });

// Two years typed by a reader → the two the state carries, or null for
// anything that is not a pair of years. Historians' numbering in and out, as
// the URL carries it; the clamping is done in astronomical years, because that
// is the only numbering arithmetic is allowed on (util/dates.js).
//
// The same two rules the band's own drag follows: the window never leaves the
// scale it is drawn on, and its ends never cross — written backwards is two
// ends the wrong way round and not garbage to drop, exactly as `?from=` and
// `?to=` are read that way in state.js.
export function windowPatch(from, to, extent) {
  if (!extent) return null;
  if (!isValidYear(from) || !isValidYear(to)) return null;
  const clamp = (year) => Math.min(extent.max, Math.max(extent.min, toAstronomical(year)));
  const a = clamp(from);
  const b = clamp(to);
  return { from: fromAstronomical(Math.min(a, b)), to: fromAstronomical(Math.max(a, b)) };
}

// The hint: one column per century the corpus actually holds events in, over
// the **whole extent of the data whatever the window is**. That is the
// timeline's own rule and the reason it is there — a drawing that rescaled
// itself to the band would say the corpus had changed when the reader narrowed
// it, and a handle at the edge of its own scale has no room to widen into
// (timeline.js's head comment). Narrowing marks fewer columns; it never moves
// one.
//
// A century with no events gets no column: a bar drawn at the floor height
// for nothing there would say the atlas holds something it does not.
export function densityColumns(counts, extent, window, { width = DENSITY.width, height = DENSITY.height } = {}) {
  if (!counts || counts.size === 0 || !extent) return [];
  const first = centuryOf(extent.min);
  const last = centuryOf(extent.max);
  const span = Math.max(last + CENTURY - first, CENTURY);
  const columns = [];
  for (let century = first; century <= last; century += CENTURY) {
    const n = counts.get(century) ?? 0;
    if (n <= 0) continue;
    columns.push({
      century,
      x: ((century - first) / span) * width,
      width: Math.max(1, (CENTURY / span) * width),
      // The strip's own scale, imported rather than copied: two drawings of
      // the same corpus must not disagree about which century is the busy one.
      height: columnHeight(n, { min: 1, max: height }),
      inside: !window || (century <= window.to && century + CENTURY - 1 >= window.from),
    });
  }
  return columns;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createWindowControl(group, { atlas, state }) {
  if (!group) return { render: () => {} };

  const { width, height } = DENSITY;
  // Written here because nothing in it comes from `data/`: two inputs, a
  // drawing whose only content is numbers this file computes, and one
  // sentence of the interface's own words. The columns are made as elements
  // below rather than as markup, so a render moves an attribute instead of
  // parsing a string.
  group.innerHTML = `
    <label class="window-end-label">from
      <input class="window-end" data-window="from" type="number" step="1" inputmode="numeric"
             aria-label="The first year of the window">
    </label>
    <label class="window-end-label">to
      <input class="window-end" data-window="to" type="number" step="1" inputmode="numeric"
             aria-label="The last year of the window">
    </label>
    <svg class="window-density" role="img" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
         aria-label="How many events each century of the corpus holds, and which of them the window covers"></svg>
    <p class="window-view" hidden>
      <span class="window-count"></span>
      <button type="button" class="pin" title="Draw every event again, wherever the map is looking">show the world</button>
    </p>`;

  const ends = {
    from: group.querySelector('[data-window="from"]'),
    to: group.querySelector('[data-window="to"]'),
  };
  const hint = group.querySelector('.window-density');
  const view = group.querySelector('.window-view');
  const count = group.querySelector('.window-count');
  const pin = group.querySelector('.pin');

  // How the corpus is spread over the centuries, counted once at build and not
  // per render: it is a fact about the data, and the data does not change
  // under a reader. The same count the timeline's scale is chosen by and the
  // same one the atlas opens on (util/window.js), so no two of the three can
  // disagree about which century is the busy one.
  const counts = centuryCounts(atlas.activeEvents);

  // The pin says something about the lanes and the marks, not about the map:
  // it stops the filtering and leaves the map where the reader put it, which
  // is what it did under the lanes (timeline.js).
  pin.addEventListener('click', () => state.set({ bbox: null }));

  const typed = () => {
    if (!atlas.extent) return;
    const patch = windowPatch(Number(ends.from.value), Number(ends.to.value), atlas.extent);
    // Not a pair of years: the control says so by going back to the window
    // that is in force, rather than guessing what was meant.
    if (!patch) {
      render(state.get(), { force: true });
      return;
    }
    state.set(patch);
  };
  for (const input of Object.values(ends)) {
    input.addEventListener('change', typed);
    // Enter without leaving the field, which is how a number is set in a
    // hurry; `change` follows on blur and sets the same window again, which
    // is a no-op in the state.
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') typed();
    });
  }

  // What the hint drew last, so the columns are moved in place and not built
  // again: the drawing changes on every nudge of the band and its shape does
  // not.
  let drawnColumns = 0;
  const drawHint = (window) => {
    const columns = densityColumns(counts, atlas.extent, window);
    hint.hidden = columns.length === 0;
    while (hint.childNodes.length > columns.length) hint.removeChild(hint.lastChild);
    while (hint.childNodes.length < columns.length) {
      hint.appendChild(document.createElementNS(SVG_NS, 'rect'));
    }
    columns.forEach((column, i) => {
      const rect = hint.childNodes[i];
      rect.setAttribute('x', column.x);
      rect.setAttribute('y', height - column.height);
      rect.setAttribute('width', column.width);
      rect.setAttribute('height', column.height);
      rect.setAttribute('class', `density-column${column.inside ? ' in' : ''}`);
    });
    drawnColumns = columns.length;
  };

  // "N of N events in view", the one line the strip carried that is not a
  // picture. The same answer the lanes and the marks are drawn from, from the
  // same two files (emphasis.js, viewport.js) — and computed only while the
  // map is looking at part of the world, so a reader who has never moved the
  // map pays nothing for it, at first paint or after.
  const countInView = (s) => {
    const working = workingSet(atlas, s);
    const drawable = working.shown;
    const inLens = drawable ? atlas.activeEvents.filter((e) => drawable.has(e.id)) : atlas.activeEvents;
    const held = heldSet(working, { reachable: true });
    const shown = eventsInView(inLens, s.bbox, atlas.places, { keep: held, regions: atlas.regionBoxes });
    return { shown: shown.length, whole: inLens.length };
  };

  function render(s, { force = false } = {}) {
    if (!atlas.extent) return;
    const window = resolveWindow(s, atlas.extent, atlas.opens);
    if (!window) return;
    for (const [kind, input] of Object.entries(ends)) {
      input.min = String(fromAstronomical(atlas.extent.min));
      input.max = String(fromAstronomical(atlas.extent.max));
      const year = String(fromAstronomical(kind === 'from' ? window.from : window.to));
      // Never under the reader's hands: a render while they are typing would
      // take the digits back as they wrote them. Whatever they end on goes
      // through `typed` and comes back here.
      if (force || input !== input.ownerDocument.activeElement) input.value = year;
    }
    drawHint(window);
    view.hidden = !s.bbox;
    if (s.bbox) {
      const n = countInView(s);
      count.textContent = `${n.shown} of ${n.whole} ${n.whole === 1 ? 'event' : 'events'} in view`;
    }
  }

  state.subscribe(render);
  render(state.get());
  return { render, columns: () => drawnColumns };
}

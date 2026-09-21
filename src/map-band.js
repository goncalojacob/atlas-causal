// The band on the map, always.
//
// The owner, 18 September, after using what M60 built: *"There should be a
// toggle on the map so I can choose the dates instead of a selector."* M64
// built the control and put it behind a button. The owner, 21 September, after
// using that: *"still don't like the way years are selected when looking at
// the map, should be more intuitive"* — and, asked what shape the fix should
// take: **"The dates two-handled band should not be hidden."**
//
// So M75 keeps the control whole and removes the mode around it. The strip is
// present on the map from first paint, on every visit, with nothing to press
// and nothing to remember. A reader arrives, sees the years, and drags.
//
// M60 was right and nothing about it is undone: the timeline is still a view
// of its own, the two number fields are still in the masthead, and **the map
// pane is still the whole layout**. What M60 lost is that a year could be
// *swept* — you pulled an end and the map answered as you moved, and you could
// see where the events were while you were choosing. A number field can do
// neither, because you must already know the year you want. That is what is
// back, and now without a door in front of it.
//
// Two things it must never become:
//
//   * **the strip again.** It is an overlay and not a row of the grid, so the
//     map pane is the layout's own height with the band on it. M64's gain and
//     M60's, kept together: `tests/m75-browser.test.mjs` measures the pane
//     against the layout with the band present and not merely when it is away.
//   * **a second band.** The shade, the handles, their years and every gesture
//     that moves them are `window-band.js`'s, which is where the timeline's
//     band went. Two bands that could disagree about one window would be a
//     worse fault than the one being fixed.
//
// The cost M64 deferred is now paid at first paint, which is the honest price
// of the owner's sentence and is named in `STATUS.md` rather than hidden: the
// century counts, the scale, the four layers and the first drawing.
//
// What it draws under itself is `density.js`'s answer over `bandEvents` —
// **what the atlas is currently showing** and not the corpus (M65). Choosing an
// event narrows the profile with the picture, which is the honest thing for a
// strip whose whole job is to say where the events are.
//
// Nothing here is remembered. The window is URL state, as it always was; there
// is no control left to be a preference, so `panes.js` keeps only the panel's
// width and a value an M64 reader's browser still holds is read into nothing
// (deviation 848's rule).

import { svg, reuse, html } from './util/dom.js';
import { createTimelineScale } from './timeline-scale.js';
import { resolveWindow, centuryCounts } from './util/window.js';
import { renderKey } from './render-key.js';
import {
  HANDLE_WIDTH, profileEvents, bandProfile, bandShade, bandHandles, bindWindowGestures,
} from './window-band.js';

// The strip, in the units of its own `viewBox`. Not tokens and not type sizes:
// this is the geometry of a drawing, like the nine pixels of a handle or the
// eleven of a lane label, and the brief's "no new hex value, token or type
// size" is about the palette and the type scale (m60-brief §4, and the same
// reading M60's own density hint and M64's strip were written under). Every
// colour it is drawn in is a variable in `style.css` and there is no new one.
//
// Forty-four: a row for the two years the handles stand on, and a body deep
// enough to take hold of with a pointer and to draw the profile in. The whole
// of "a slim strip over the map" is this number being small, and the test
// asserts it against the pane rather than against itself. It is the same
// forty-four on a phone: the strip is now something a thumb must find and
// hold, and forty-four is what a touch target is (`--touch` is forty) — a
// slimmer band would be the harder control, not the lighter one, and the
// measurement is in `STATUS.md`.
export const STRIP = Object.freeze({
  height: 44,
  // The row the two years are written on, above the band so that a label and a
  // handle are never on top of each other — the timeline's own arrangement.
  marker: 16,
  // Room at each end so that a handle at the first or the last year of the data
  // is drawn whole and not half off the edge.
  inset: HANDLE_WIDTH,
});

// A width below this is a pane that has not been laid out — a hidden view, a
// first render before the grid has sized anything — and there is no scale to be
// had from it.
const MIN_WIDTH = 2 * STRIP.inset + 1;

export function createMapBand(container, { atlas, state } = {}) {
  if (!container) return { render: () => {} };

  const wrap = html('div', { class: 'map-band' });
  container.append(wrap);

  const root = svg('svg', {
    class: 'window-strip', id: 'map-band-strip', role: 'group', 'aria-label': 'The window of time',
  });
  // One layer per kind of element, in z-order: the profile of where the events
  // are, then the shade over it, then the handles over that, then their years.
  // The same order and the same reason as the timeline's (util/dom.js,
  // `reuse`): the shading must not hide what it is shading, and a handle must
  // always be grabbable.
  const layers = {};
  for (const name of ['profile', 'band', 'handles', 'handleLabels']) {
    layers[name] = svg('g', { class: `layer layer-${name}` });
    root.appendChild(layers[name]);
  }
  wrap.append(root);

  // Counted once, here rather than on every render: it is a fact about the data
  // and the data does not change under a reader, and it is the same count the
  // timeline's scale is chosen by and the masthead's hint is drawn at
  // (util/window.js), so no two of the three can disagree about which century
  // is the busy one.
  const counts = centuryCounts(atlas.activeEvents);
  const domain = atlas.extent ? [atlas.extent.min - 1, atlas.extent.max + 1] : [0, 1];

  let width = 0;
  let scale = null;
  let drawnFor = null;

  const measure = () => {
    width = Math.max(0, wrap.clientWidth || 0);
    if (width < MIN_WIDTH || !atlas.extent) {
      scale = null;
      return;
    }
    scale = createTimelineScale({
      domain, range: [STRIP.inset, width - STRIP.inset], counts, extent: atlas.extent,
    });
  };

  bindWindowGestures(root, {
    atlas,
    state,
    scale: () => scale,
    viewWidth: () => width,
    // No lane labels to keep clear of, and nothing on the strip that a press
    // could be opening instead: every pixel of it is the scale.
    gutter: () => 0,
    isRecord: () => false,
  });

  function draw(s) {
    measure();
    if (!scale) return;
    root.setAttribute('viewBox', `0 0 ${width} ${STRIP.height}`);
    root.setAttribute('width', width);
    root.setAttribute('height', STRIP.height);
    const into = Object.fromEntries(
      Object.entries(layers).map(([name, g]) => [name, reuse(g)]),
    );
    const window = resolveWindow(s, atlas.extent, atlas.opens);
    // Where the events are, over **what the reader has chosen**: since M76
    // `profileEvents` is the lens's own half and not the ring around it, so a
    // band saying "Portugal" is Portugal's events and nothing else, and with
    // nothing chosen it is the resting picture as before.
    //
    // At the set's own scale — `own` — because this is one row over one set
    // and the absolute scale spent the narrowing on a pixel: the world's
    // tallest column was 6 px and Portugal's was 5, inside a strip 44 deep.
    // The body of the band is the cap, so the busiest column reaches the top
    // of it and the row the two years are written on is still clear.
    const d = bandProfile(profileEvents(atlas, s), scale, {
      floor: STRIP.height,
      openEnd: domain[1],
      own: true,
      max: STRIP.height - STRIP.marker,
    });
    if (d) into.profile.take('path', { d, class: 'bar stub', 'aria-hidden': 'true' });
    const box = {
      scale,
      extent: atlas.extent,
      top: STRIP.marker,
      height: STRIP.height - STRIP.marker,
      labelY: STRIP.marker - 6,
    };
    if (window) {
      bandShade(into.band, window, box);
      bandHandles(into.handles, into.handleLabels, window, box);
    }
    for (const layer of Object.values(into)) layer.done();
  }

  // The same discipline the three views follow: the whole state plus what the
  // drawing holds outside it, which here is only its own width. No attribute
  // shard is read — the strip carries no name — so the shard count that every
  // view's key carries is not in this one.
  const render = (s, { force = false } = {}) => {
    const key = renderKey(s, wrap.clientWidth || 0);
    if (!force && key === drawnFor) return;
    drawnFor = key;
    draw(s);
  };

  // The map view can be put away for the graph or the timeline, and a pane that
  // is `hidden` measures nothing. The observer is what brings the drawing back
  // at the width it returns to, which is the same thing it did for a reader who
  // resized their window.
  let observer = null;
  if (typeof ResizeObserver !== 'undefined') {
    let last = '';
    observer = new ResizeObserver(() => {
      const now = String(wrap.clientWidth);
      if (now === last) return;
      last = now;
      render(state.get(), { force: true });
    });
    observer.observe(wrap);
  }

  const unsubscribe = state.subscribe(render);
  render(state.get(), { force: true });

  return {
    render: (s, options) => render(s, options),
    // Nothing in the atlas takes the band away, but a drawing that subscribes
    // to the state owes a way to stop: a test that builds one into a scratch
    // container should be able to leave nothing behind.
    destroy: () => {
      unsubscribe?.();
      observer?.disconnect?.();
      wrap.remove();
    },
  };
}

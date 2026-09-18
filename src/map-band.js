// The band on the map, on demand.
//
// The owner, 18 September, after using what M60 built: *"There should be a
// toggle on the map so I can choose the dates instead of a selector."*
//
// M60 was right to stop the timeline permanently eating the bottom of the map,
// and nothing about that is undone here: the timeline is still a view of its
// own, the two number fields are still in the masthead, and **a first visit is
// still the whole pane**. What M60 lost is that a year could be *swept* — you
// pulled an end and the map answered as you moved, and you could see where the
// events were while you were choosing. A number field can do neither, because
// you must already know the year you want.
//
// So this is a toggle at the top-left corner of the map and a slim strip it
// opens above it. Three things it must never become:
//
//   * **the strip again.** It is an overlay and not a row of the grid, so the
//     map pane is the whole layout open or closed; it is dismissed with the
//     same button that opened it; and it never comes back by itself.
//   * **a second band.** The shade, the handles, their years and every gesture
//     that moves them are `window-band.js`'s, which is where the timeline's
//     band went. Two bands that could disagree about one window would be a
//     worse fault than the one being fixed.
//   * **a cost at first paint.** Nothing below the toggle exists until the
//     first time a reader opens it: no scale, no century counts, no
//     subscription. A reader who never opens it pays for one `<button>`.
//
// What it draws under itself is `density.js`'s answer over `bandEvents` —
// **what the atlas is currently showing** and not the corpus (M65). Choosing an
// event narrows the profile with the picture, which is the honest thing for a
// strip whose whole job is to say where the events are.
//
// The window is URL state and the toggle is not: a link opens on the picture
// its sender saw, not on whether they had a control open. The toggle is
// remembered per reader in localStorage, the way the panel's width is
// (`panes.js`).

import { svg, reuse, html } from './util/dom.js';
import { createTimelineScale } from './timeline-scale.js';
import { resolveWindow, centuryCounts } from './util/window.js';
import { renderKey } from './render-key.js';
import { readBandOpen, writeBandOpen } from './panes.js';
import {
  HANDLE_WIDTH, bandEvents, bandProfile, bandShade, bandHandles, bindWindowGestures,
} from './window-band.js';

// The strip, in the units of its own `viewBox`. Not tokens and not type sizes:
// this is the geometry of a drawing, like the nine pixels of a handle or the
// eleven of a lane label, and the brief's "no new hex value, token or type
// size" is about the palette and the type scale (m60-brief §4, and the same
// reading M60's own density hint was written under). Every colour it is drawn
// in is a variable in `style.css` and there is no new one.
//
// Forty-four: a row for the two years the handles stand on, and a body deep
// enough to take hold of with a pointer and to draw the profile in. The whole
// of "a slim strip the reader dismisses" is this number being small, and the
// test asserts it against the pane rather than against itself.
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

export function createMapBand(container, {
  atlas, state, storage = globalThis.localStorage,
} = {}) {
  if (!container) return { isOpen: () => false, toggle: () => {}, render: () => {} };

  const wrap = html('div', { class: 'map-band' });
  // The strip comes first in the flow and the toggle under it, so the button
  // stays against the band it opens rather than the band pushing it about.
  const toggle = html('button', {
    type: 'button',
    class: 'map-band-toggle',
    id: 'map-band-toggle',
    'aria-controls': 'map-band-strip',
    'aria-expanded': 'false',
    title: 'Choose the window of time on the map: drag either end and the map follows',
  }, 'years');
  wrap.append(toggle);
  container.append(wrap);

  // Everything below is null until the first open. `built` is the whole of
  // "first paint must not get slower".
  let built = null;

  function build() {
    const root = svg('svg', {
      class: 'window-strip', id: 'map-band-strip', role: 'group', 'aria-label': 'The window of time',
    });
    // One layer per kind of element, in z-order: the profile of where the
    // events are, then the shade over it, then the handles over that, then
    // their years. The same order and the same reason as the timeline's
    // (util/dom.js, `reuse`): the shading must not hide what it is shading, and
    // a handle must always be grabbable.
    const layers = {};
    for (const name of ['profile', 'band', 'handles', 'handleLabels']) {
      layers[name] = svg('g', { class: `layer layer-${name}` });
      root.appendChild(layers[name]);
    }
    wrap.insertBefore(root, toggle);

    // Counted once, here rather than at load: it is a fact about the data and
    // the data does not change under a reader, and it is the same count the
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

    const gestures = bindWindowGestures(root, {
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
      // Where the events are, over what the atlas is showing: `bandEvents` is
      // M65's `shown`, so a selection that has narrowed the map has narrowed
      // this too. Drawn at `density.js`'s own absolute scale, which is the
      // scale the timeline's stubs and the masthead's hint are drawn at.
      const d = bandProfile(bandEvents(atlas, s), scale, {
        floor: STRIP.height, openEnd: domain[1],
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
    built = { root, render, unsubscribe, observer, gestures };
    render(state.get(), { force: true });
  }

  // Closed is the strip gone from the document and not hidden: a drawing that
  // is still there is still redrawn on every nudge of the window, and "closed
  // costs nothing" would stop being true the moment anybody believed it.
  function teardown() {
    if (!built) return;
    built.unsubscribe?.();
    built.observer?.disconnect?.();
    built.root.remove();
    built = null;
  }

  let open = readBandOpen(storage);

  function apply({ remember = true } = {}) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.title = open
      ? 'Close the window of time'
      : 'Choose the window of time on the map: drag either end and the map follows';
    container.classList.toggle('band-open', open);
    if (open && !built) build();
    if (!open) teardown();
    if (remember) writeBandOpen(storage, open);
  }

  toggle.addEventListener('click', () => {
    open = !open;
    apply();
  });

  // A reader who left it open gets it back; a first visit does not, and pays
  // nothing for the band it has not asked for.
  apply({ remember: false });

  return {
    isOpen: () => open,
    toggle: () => { open = !open; apply(); },
    render: (s, options) => built?.render(s, options),
  };
}

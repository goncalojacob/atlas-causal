// The window of time as a band with a handle at each end — once, for both
// pictures that carry one.
//
// The band was written inside `src/timeline.js` and belonged to the strip
// along the bottom of the map. M60 made the timeline a view of its own and
// moved the window to two number fields in the masthead, which was right: the
// strip cost the bottom third of every screen whether it was being read or
// not. What it lost is that **a year could be swept**. You pulled an end and
// the map answered as you moved, and you could see where the events were while
// you were choosing; a number field can do neither, because you must already
// know the year you want.
//
// So M64 brought the band back over the map behind a button, and M75 took the
// button away — the owner, 21 September: *"The dates two-handled band should
// not be hidden"* — so it is simply on the map (`map-band.js`). Neither run
// changed a line below this comment, which is the point: this file is why
// there is still one band and not two. Two bands that can
// disagree about the same window would be a worse fault than the one being
// fixed, so the shade, the handles, their labels and every gesture that moves
// them live here, and the timeline and the map's strip both draw from it.
// Nothing here knows which of the two it is drawing into: it is given a pool
// of elements, a scale and a box.
//
// The pure halves — which events the band is a band *over*, what the window a
// drag asks for is allowed to be, and where the profile's columns go — are
// separate from the DOM, so `node --test` holds them without a browser.

import { fromAstronomical, formatYear } from './util/dates.js';
import { resolveWindow, zoomWindow, decadeOf } from './util/window.js';
import { densityPath, busiestColumn } from './density.js';
import { workingSet } from './emphasis.js';
import { lensView } from './lens.js';
import { barBox } from './lanes.js';

// How wide a handle is, in the units of whatever drawing it is put into: wide
// enough to take hold of with a pointer and narrow enough not to hide the year
// it is standing on. It was the timeline's own constant and is shared now, so
// that a reader who has learnt one band has learnt the other.
export const HANDLE_WIDTH = 9;

// One sentence, said on both bands, because the gestures are the same on both.
const BAND_TITLE = 'The window of time. Drag it or the ground to slide, drag an end to widen, the wheel to narrow, double-click a year to snap to its decade.';

// --- the pure halves --------------------------------------------------------

// **Which events the band is a band over.** Since M65 a view rests on the main
// events alone and a choice hides everything unrelated, and `emphasis.js` is
// the one place that decides it: `shown` is the set every picture filters by.
// The band draws its profile over the same set, so the strip under the band
// says where the events are *in the atlas the reader is looking at* and not in
// the corpus — narrowing the picture narrows the profile with it.
//
// It is the timeline's own first line and the masthead count's, lifted here so
// that the three read one answer rather than three copies of it. `workingSet`
// is memoised on the state object, so asking it again costs nothing.
export function bandEvents(atlas, state) {
  const { shown } = workingSet(atlas, state);
  return atlas.activeEvents.filter((event) => shown.has(event.id));
}

// **Which events the band draws a profile of**, which since M76 is not the
// same question.
//
// The owner, 21 September: *"If for example I select portugal, the map
// timeline I use to pick the dates should show only those events."* `shown` is
// the lens **and its one-hop ring** — and the ring is right, because a
// neighbourhood drawn with nothing around it would be an atlas in which
// nothing else happened. But it is not what the sentence points at: on this
// corpus Portugal names nine events and `shown` is thirty-three, so three
// quarters of the ink under a band saying "Portugal" was the Boer War, Franz
// Ferdinand and the Armenian genocide.
//
// So the profile is over the lens's **own** half — `kept`, what the foci name,
// which for a chosen event is that event and its parts (M65) — and the picture
// keeps the ring it always had. Intersected with `bandEvents` rather than read
// straight off the lens, so a category switched off narrows the profile with
// everything else.
//
// With no lens there is no selection to follow and this is `bandEvents`, to
// the record: the resting picture, exactly as M75 drew it.
export function profileEvents(atlas, state) {
  const shown = bandEvents(atlas, state);
  const own = lensView(atlas, state)?.kept ?? null;
  return own ? shown.filter((event) => own.has(event.id)) : shown;
}

// **What a window a gesture asks for is allowed to be**: never off the scale it
// is drawn on, and its ends never crossed — written backwards is two ends the
// wrong way round and not garbage to drop. Astronomical years in, because that
// is the only numbering arithmetic is allowed on; historians' numbering out,
// because that is what the state and the URL carry (util/dates.js).
//
// The band's drag and the masthead's two number fields both come through here
// (`window-control.js`, `windowPatch`), so typing 1600 and dragging to 1600 can
// only ever mean the same thing.
export function windowOf(from, to, extent) {
  if (!extent) return null;
  const clamp = (year) => Math.min(extent.max, Math.max(extent.min, Math.round(year)));
  const a = clamp(from);
  const b = clamp(to);
  return { from: fromAstronomical(Math.min(a, b)), to: fromAstronomical(Math.max(a, b)) };
}

// **Where the events are, under the band.** One column per column of the
// drawing, its height saying how many fall there — `density.js`'s own answer.
//
// At `density.js`'s absolute scale by default, which is what the timeline's
// per-lane stubs are drawn at: those are rows compared with each other, and a
// scale relative to each row would say one far event and a thousand of them
// were the same thing.
//
// `own` is for the caller that is **one row over one set**, which is the map's
// band: there is no second row to disagree with, and the absolute scale cost
// it the whole picture — 3 to 9 px of range inside a 44-unit strip, so the
// world drew a tallest column of 6 and one country drew 5 (M76, and the
// diagnosis in `STATUS.md`). With `own` the busiest column of the set in hand
// reaches `max` and the rest are drawn against it, so the band has a shape
// again and the shape follows the selection.
//
// `barBox` is asked for the x, so a column stands where the bar would: the
// profile and the lanes are the same events at the same places.
export function bandProfile(events, scale, {
  floor, openEnd, own = false, ...rest
} = {}) {
  const xs = events.map((event) => barBox(event, scale, { openEnd }).x);
  const scaled = own ? { ...rest, saturatesAt: busiestColumn(xs, { unit: rest.unit }) } : rest;
  return densityPath(xs, { floor, ...scaled });
}

// --- the drawing ------------------------------------------------------------

// The shade, and the whole of what a reader can take hold of to slide the
// window. Under the bars wherever there are bars: the shading must not hide a
// record.
export function bandShade(into, { from, to }, { scale, extent, top, height }) {
  const x0 = scale.x(from);
  const x1 = scale.x(to);
  into.take('rect', {
    x: x0, y: top, width: Math.max(x1 - x0, 1), height: Math.max(height, 0),
    class: 'window-band', 'data-window': 'band',
    // Focusable, so the arrow keys slide the band as they nudge a handle; the
    // handles are the two ends of the same slider and say so.
    tabindex: '0', role: 'slider',
    'aria-label': 'The window of time',
    'aria-valuemin': String(fromAstronomical(extent.min)),
    'aria-valuemax': String(fromAstronomical(extent.max)),
    'aria-valuenow': String(fromAstronomical(from)),
    'aria-valuetext': `${formatYear(fromAstronomical(from))} to ${formatYear(fromAstronomical(to))}`,
  }, { title: BAND_TITLE });
}

// The two handles and the year each stands on. Over the bars, because a handle
// must always be grabbable.
//
// A window one year wide has both handles on the same pixel, and two labels
// either side of it read as "1911 1911" — a range, which is what the reader has
// just narrowed away from. One label, centred, instead.
export function bandHandles(into, labels, { from, to }, {
  scale, extent, top, height, labelY,
}) {
  const single = from === to;
  for (const [kind, year] of [['from', from], ['to', to]]) {
    const x = scale.x(year);
    into.take('rect', {
      x: x - HANDLE_WIDTH / 2, y: top, width: HANDLE_WIDTH, height: Math.max(height, 0),
      class: `window-handle ${kind}`, 'data-window': kind, tabindex: '0', role: 'slider',
      'aria-label': kind === 'from' ? 'Start of the window' : 'End of the window',
      'aria-valuemin': String(fromAstronomical(extent.min)),
      'aria-valuemax': String(fromAstronomical(extent.max)),
      'aria-valuenow': String(fromAstronomical(year)),
      'aria-valuetext': formatYear(fromAstronomical(year)),
    }, { title: `${kind === 'from' ? 'Start' : 'End'} of the window — ${formatYear(fromAstronomical(year))}` });
    if (single && kind === 'from') continue;
    labels.take('text', {
      x: single ? x : kind === 'from' ? x - 6 : x + 6, y: labelY,
      class: 'window-year', 'text-anchor': single ? 'middle' : kind === 'from' ? 'end' : 'start',
    }, { text: formatYear(fromAstronomical(year)) });
  }
}

// --- the gestures -----------------------------------------------------------

// Every way a reader moves the window on a drawing: a handle dragged, the band
// or the ground under it slid, the wheel narrowing on the year under the
// pointer, the arrow keys nudging whichever end has the focus, and a
// double-click snapping to a decade.
//
// Given to both bands from here rather than written twice. The two differ in
// exactly two ways and both are arguments: `gutter` is the x below which the
// drawing is not the scale — the timeline's lane labels — and `isRecord` says
// what a press must not be taken for, because a press on a bar is how a record
// is opened and the strip over the map has no records on it.
//
// `consumedDrag` is the one piece of state a caller needs back: a drag is over
// by the time the click arrives, so whether it moved has to outlive it — the
// same guard the map needs (STATUS.md, deviation 34).
export function bindWindowGestures(root, {
  atlas, state,
  scale,
  viewWidth,
  gutter = () => 0,
  isRecord = (target) => Boolean(target.closest?.('[data-id], [data-cluster]')),
} = {}) {
  let drag = null;
  let dragged = false;

  const setWindow = (patch) => {
    const next = windowOf(patch.from, patch.to, atlas.extent);
    if (next) state.set(next);
  };
  const currentWindow = () => resolveWindow(state.get(), atlas.extent);
  const yearAt = (clientX) => {
    const rect = root.getBoundingClientRect();
    const x = ((clientX - rect.left) / (rect.width || 1)) * viewWidth();
    return { x, year: Math.round(scale().invert(x)) };
  };

  root.addEventListener('pointerdown', (e) => {
    if (!atlas.extent || !scale()) return;
    const handle = e.target.closest('[data-window]');
    // The empty ground is a drag surface too, and it slides the band as the
    // band itself does: the gesture that pans the map sideways should move the
    // window here, since time is this drawing's one dimension.
    const onGround = !handle && !isRecord(e.target) && yearAt(e.clientX).x >= gutter();
    if (!handle && !onGround) return;
    drag = {
      kind: handle ? handle.getAttribute('data-window') : 'band',
      origin: currentWindow(),
      startYear: yearAt(e.clientX).year,
    };
    dragged = false;
    try { root.setPointerCapture(e.pointerId); } catch { /* no such pointer any more */ }
    // **And the thing pressed takes the focus** (M83, B19). `preventDefault`
    // below is what keeps a press from selecting text and from becoming a
    // scroll, and it also suppresses the focus a click would otherwise give a
    // `tabindex="0"` element — so the title's promise that *the arrow keys
    // nudge* held only after a Tab, and a reader who had just dragged a handle
    // with the mouse could not then nudge it with a key. `preventScroll`,
    // because the band is the one control on the map pane and scrolling to it
    // would move the picture under the gesture.
    handle?.focus?.({ preventScroll: true });
    e.preventDefault();
  });

  // The wheel narrows or widens the band around the year under the cursor. The
  // drawing under it does not move: the timeline's lanes stay on the whole
  // extent of the data (M6) and the map has no time axis at all, so "zooming"
  // is a statement about the window and nothing else. The map's own factor, so
  // both pictures answer a wheel at the same rate.
  root.addEventListener('wheel', (e) => {
    if (!atlas.extent || !scale()) return;
    const { x, year } = yearAt(e.clientX);
    if (x < gutter()) return;
    e.preventDefault();
    const whole = Math.max(atlas.extent.max - atlas.extent.min, 1);
    setWindow(zoomWindow(currentWindow(), year, e.deltaY, { whole }));
  }, { passive: false });

  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { year } = yearAt(e.clientX);
    if (year !== drag.startYear) dragged = true;
    if (drag.kind === 'from') setWindow({ from: year, to: drag.origin.to });
    else if (drag.kind === 'to') setWindow({ from: drag.origin.from, to: year });
    else {
      // The band slides as a whole and keeps its width, stopping at the ends of
      // the data rather than shrinking against them.
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
  //
  // **And Home and End are the data's two ends** (M83, B19). The panel's pane
  // handle and the timeline's bars answer them and this did not, so the one
  // control that is a slider was the one a keyboard could not take to either
  // end of its range. On a handle it moves that end; on the band it slides the
  // whole window to the far end without changing its span, which is what
  // dragging the ground to the edge does.
  root.addEventListener('keydown', (e) => {
    const el = e.target.closest?.('[data-window]');
    if (!el || !atlas.extent) return;
    const kind = el.getAttribute('data-window');
    const window = currentWindow();
    const ends = { Home: atlas.extent.min, End: atlas.extent.max };
    if (e.key in ends) {
      e.preventDefault();
      const end = ends[e.key];
      if (kind === 'from') setWindow({ from: end, to: window.to });
      else if (kind === 'to') setWindow({ from: window.from, to: end });
      else {
        const span = window.to - window.from;
        const from = e.key === 'Home' ? atlas.extent.min : atlas.extent.max - span;
        setWindow({ from, to: from + span });
      }
      return;
    }
    const step = e.shiftKey ? 10 : 1;
    const delta = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    if (!delta) return;
    e.preventDefault();
    if (kind === 'from') setWindow({ from: window.from + delta, to: window.to });
    else if (kind === 'to') setWindow({ from: window.from, to: window.to + delta });
    else {
      const span = window.to - window.from;
      const from = Math.min(Math.max(window.from + delta, atlas.extent.min), atlas.extent.max - span);
      setWindow({ from, to: from + span });
    }
  });

  // The band is a drag surface, but a double-click still means "that decade"
  // wherever it lands — otherwise the whole gesture would be unavailable at the
  // default window, which covers everything.
  root.addEventListener('dblclick', (e) => {
    if (!atlas.extent || !scale() || e.target.closest('.window-handle')) return;
    const { x, year } = yearAt(e.clientX);
    if (x < gutter()) return;
    const clamp = (y) => Math.min(atlas.extent.max, Math.max(atlas.extent.min, Math.round(y)));
    setWindow(decadeOf(clamp(year)));
  });

  return {
    // Asked, and cleared, by a caller's own click handler before it decides
    // what the click meant.
    consumedDrag() {
      if (!dragged) return false;
      dragged = false;
      return true;
    },
  };
}

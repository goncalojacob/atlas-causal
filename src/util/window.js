// The window of time the atlas is looking at. `state.js` carries two years
// and no data; these are the pure functions that turn them into a span and
// answer what falls inside it. Astronomical years throughout (util/dates.js),
// because that is the only numbering arithmetic is allowed on.
//
// A null bound means "as far as the data goes". Which year that is, only a
// loaded atlas knows, so resolving happens here — at the edge of a view —
// and never in the state.

import { extent, toAstronomical } from './dates.js';

// state + the data's own extent → { from, to } in astronomical years, or
// null when there is no data to bound it with.
//
// **A URL that names neither end is the whole of the data** (M85, A4). It was
// the densest century between M43b and M85: `opensOn` below picked it, and the
// resting map was 1900–1999 with nothing of 1492–1899 drawn at all — "Portugal
// in the 20th century", where the atlas is about the world since 1492. M65 is
// what makes the whole span cheap: at rest a view draws the **main events**
// alone, so six centuries at once is twenty marks and not six thousand, and
// the reader narrows from there rather than being narrowed for.
export function resolveWindow(state, dataExtent) {
  if (!dataExtent) return null;
  const from = state.from === null ? dataExtent.min : toAstronomical(state.from);
  const to = state.to === null ? dataExtent.max : toAstronomical(state.to);
  return from <= to ? { from, to } : { from: to, to: from };
}

// An interval is in the window when it has begun by the far end and has not
// ended before the near one. On the lenient bound at each end, as the arrow
// of time is: a record that may have started in 1960 and may have started in
// 1975 is in a window that opens in 1970.
export function overlaps(when, window) {
  if (!window) return true;
  const x = extent(when);
  return x.min <= window.to && (x.max === null || x.max >= window.from);
}

// The margin the three views draw beyond the band, in years. Since H3b a
// view draws the window and this much either side of it, and nothing further
// out except what the reader is holding: a bar, a mark or a node that is
// eight hundred years away from the band is not what the reader is looking
// at, and drawing all of them was the whole of the cost the window was
// supposed to save.
//
// Fifty years, because that is what a "period" would have been over the era
// this dataset occupies: the index's shard table was to be before 1800,
// 1800–1899, 1900–1949, 1950–1999, 2000 on, and the three that cover 1899 to
// 2025 are fifty years each. The shards themselves were dropped (h3a-brief,
// A4); the span they were to be cut on is still the right distance to look
// past the edge of the band by. The timeline keeps a faded stub for what
// falls beyond it, so the reader can see the rest of the dataset is there;
// the map and the graph draw nothing (ARCHITECTURE.md, "The window is what
// the views draw").
export const MARGIN_YEARS = 50;

// The window a view actually draws: the band plus one period at each end.
// Null in, null out — no window at all is the whole of the data, and there
// is nothing to widen.
export function withMargin(window, years = MARGIN_YEARS) {
  return window ? { from: window.from - years, to: window.to + years } : null;
}

// The year "what did this lead to by then?" is asked about: the reader's own
// if they chose one, otherwise the window's far end. Astronomical, like
// everything the traversal compares. Null only when there is no data at all.
export function resolveHorizon(state, window) {
  if (state.horizon !== null && state.horizon !== undefined) return toAstronomical(state.horizon);
  return window ? window.to : null;
}

// The horizon is *open* — the reachable set lit on the map, the graph and the
// timeline — only when a reader has chosen a year and an event to ask about.
// The default is the window's own far end and is never written to the URL;
// lighting the whole downstream of every event by default would say
// something the reader has not asked.
export function horizonIsOpen(state) {
  return Boolean(state.selected) && state.horizon !== null && state.horizon !== undefined;
}

// Whether the window as it is written already holds a year. A null bound is
// "as far as the data goes" and therefore holds everything on its side.
// Historians' numbering, like the two ends themselves and like `windowAt`:
// the order of the years is the same in both numberings, and only arithmetic
// needs the astronomical one.
//
// It took an `opens` argument until M85, so that a question about the drawn
// window was not answered from the written one. The two are the same answer
// again now that nothing narrows a resting window.
export function containsYear(state, year) {
  return (state.from === null || year >= state.from) && (state.to === null || year <= state.to);
}

// "Map at 1911", wherever it is offered: the far end goes to that year and
// the near end comes with it if it was later. Never the other way round —
// moving the far end backwards past the near one would silently empty the
// window.
export function windowAt(state, year) {
  return { to: year, from: state.from !== null && state.from > year ? year : state.from };
}

// The decade an astronomical year falls in — 1975 → 1970–1979 — in and out.
// Floor, not truncation, so a year before the era lands in the decade that
// contains it rather than the one that starts at the same digits.
export function decadeOf(astronomicalYear) {
  const start = Math.floor(astronomicalYear / 10) * 10;
  return { from: start, to: start + 9 };
}

// ─── Centuries: how the corpus is spread ───────────────────────────────────
//
// M43b. Until then the extent was the whole of what the timeline needed to
// know about time: the lanes were drawn on it linearly. Over 1890–2025 that is
// right — a hundred and thirty-five years is one picture — and over 1415–2025
// it is not: an even scale over six centuries gives the years nobody wrote
// about the same width as the years everybody did.
//
// So one question is asked of the corpus here: how many events each century
// holds. The timeline's scale asks it to know whether to bucket
// (timeline-scale.js). It is a fact about the data and not state, which is why
// it is never written into the URL.
//
// M43b asked it a second time as well, to choose the century the atlas opened
// on. That is gone (M85, A4, and `resolveWindow` above): at rest the window is
// the whole span, because M65 made the resting picture the main events and the
// whole span is what the atlas is about. `crowded` stays and has one reader
// left — the scale, which still has six centuries to draw on one axis.

export const CENTURY = 100;

// The century an astronomical year falls in — 1975 → 1900, -44 → -100. Floor
// again, and for the same reason `decadeOf` floors.
export function centuryOf(astronomicalYear) {
  return Math.floor(astronomicalYear / CENTURY) * CENTURY;
}

// How many events begin in each century, keyed by the century's first year.
// By the year an event *began*, not by every year it covers: an event belongs
// to the century it started in, and a war counted twice would say the corpus
// is denser than it is. Astronomical throughout, like the extent it is read
// beside.
export function centuryCounts(events) {
  const counts = new Map();
  for (const event of events ?? []) {
    const at = centuryOf(extent(event.when).min);
    counts.set(at, (counts.get(at) ?? 0) + 1);
  }
  return counts;
}

// The corpus is long and lopsided — which is the one condition under which the
// timeline changes what it has always done. Two tests, and both have to hold.
//
// Long: more than `SPREAD` centuries from the first event to the last. A
// corpus inside two centuries is one picture and a linear scale is the honest
// drawing of it, which is what `data/` is today and what every screenshot
// under docs/screens/ was taken of.
//
// Lopsided: some century holds more than `CROWDING` times its even share. An
// evenly spread corpus over five centuries needs no compression either — the
// years really are all alike — and bucketing it would move the drawing for
// nothing.
const SPREAD = 2;
const CROWDING = 3;

export function crowded(counts, dataExtent) {
  if (!counts || counts.size === 0 || !dataExtent) return false;
  const span = dataExtent.max - dataExtent.min;
  if (span <= SPREAD * CENTURY) return false;
  let total = 0;
  let most = 0;
  for (const n of counts.values()) {
    total += n;
    if (n > most) most = n;
  }
  return most > CROWDING * (total / (span / CENTURY));
}

// How fast a wheel answers, everywhere a wheel is answered: the exponent one
// notch of `deltaY` is multiplied by before `Math.exp`.
//
// **One export and three readers** (M85, B13). It was written out three times
// — here, in `map.js` and in `graph-view.js` — each with a comment saying it
// was the map's own factor "so both pictures answer a wheel at the same rate",
// which is a rule three copies of a number cannot keep. The band's own rule
// (`tests/m64.test.mjs`) is now held by the two pictures importing this rather
// than by the absence of a string in their source.
export const WHEEL_FACTOR = 0.0015;

// The wheel over the timeline. Narrowing and widening the band around the
// year under the cursor, in astronomical years, with the cursor's year
// keeping its place inside the band — so the reader zooms onto what the
// pointer is over and not onto the middle.
//
// `deltaY` is the browser's own, and the factor is the shared one above, so a
// wheel answers at the same rate in all three pictures. The result is the two
// ends, not yet clamped to the data: what the extent allows is the caller's,
// which is the same clamp every other move of the band goes through.
export function zoomWindow(window, year, deltaY, { whole = Infinity } = {}) {
  const span = Math.max(window.to - window.from, 1);
  let wanted = Math.round(span * Math.exp(deltaY * WHEEL_FACTOR));
  // A one-year band multiplied by 1.15 rounds back to one year, and the
  // wheel would do nothing at the narrow end for ever.
  if (wanted === span) wanted = span + (deltaY > 0 ? 1 : -1);
  wanted = Math.min(whole, Math.max(1, wanted));
  const t = Math.min(1, Math.max(0, (year - window.from) / span));
  const from = Math.round(year - t * wanted);
  return { from, to: from + wanted };
}

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

// The wheel over the timeline. Narrowing and widening the band around the
// year under the cursor, in astronomical years, with the cursor's year
// keeping its place inside the band — so the reader zooms onto what the
// pointer is over and not onto the middle.
//
// `deltaY` is the browser's own, and the factor is the map's, so a wheel
// answers at the same rate in both pictures. The result is the two ends, not
// yet clamped to the data: what the extent allows is the caller's, which is
// the same clamp every other move of the band goes through.
export function zoomWindow(window, year, deltaY, { whole = Infinity } = {}) {
  const span = Math.max(window.to - window.from, 1);
  let wanted = Math.round(span * Math.exp(deltaY * 0.0015));
  // A one-year band multiplied by 1.15 rounds back to one year, and the
  // wheel would do nothing at the narrow end for ever.
  if (wanted === span) wanted = span + (deltaY > 0 ? 1 : -1);
  wanted = Math.min(whole, Math.max(1, wanted));
  const t = Math.min(1, Math.max(0, (year - window.from) / span));
  const from = Math.round(year - t * wanted);
  return { from, to: from + wanted };
}

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

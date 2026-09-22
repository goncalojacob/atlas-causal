// Years in the data use historians' numbering: negative for BCE, no year 0
// (1 BCE is -1, 1 CE is 1). Every piece of arithmetic — arrow of time,
// timeline scale, sorting — goes through toAstronomical() so the missing
// year never produces an off-by-one in one place and not another. Nothing
// else in the codebase compares years directly.

export function isValidYear(year) {
  return Number.isInteger(year) && year !== 0;
}

// Historians' year → astronomical year (…, -1 → 0, 1 → 1). The only place
// the two numberings meet.
export function toAstronomical(year) {
  if (!isValidYear(year)) throw new RangeError(`invalid year ${JSON.stringify(year)}: integer, not 0`);
  return year < 0 ? year + 1 : year;
}

export function fromAstronomical(value) {
  if (!Number.isInteger(value)) throw new RangeError(`invalid astronomical year ${JSON.stringify(value)}`);
  return value <= 0 ? value - 1 : value;
}

// A bound is an exact year or { min, max }. Normalises to { min, max } in
// historians' years without judging them (rule 15 does that).
export function bounds(bound) {
  if (Number.isInteger(bound)) return { min: bound, max: bound };
  if (bound !== null && typeof bound === 'object' && Number.isInteger(bound.min) && Number.isInteger(bound.max)) {
    return { min: bound.min, max: bound.max };
  }
  throw new TypeError(`invalid year bound ${JSON.stringify(bound)}`);
}

export function astronomicalBounds(bound) {
  const b = bounds(bound);
  return { min: toAstronomical(b.min), max: toAstronomical(b.max) };
}

export function compareYears(a, b) {
  return toAstronomical(a) - toAstronomical(b);
}

// The Gregorian calendar starts in October 1582; the year is enough for a
// default, and `calendar` on the record overrides it.
export function defaultCalendar(year) {
  return toAstronomical(year) >= 1582 ? 'gregorian' : 'julian';
}

export function formatYear(year) {
  if (!isValidYear(year)) throw new RangeError(`invalid year ${JSON.stringify(year)}`);
  return year < 0 ? `${-year} BCE` : `${year}`;
}

export function formatBound(bound) {
  const b = bounds(bound);
  if (b.min === b.max) return formatYear(b.min);
  if (b.min < 0 && b.max < 0) return `${-b.min}–${-b.max} BCE`;
  return `${formatYear(b.min)}–${formatYear(b.max)}`;
}

// "1415", "1415 – 1580", "1500 – ongoing", "9600–9000 BCE – 8500–8000 BCE".
export function formatInterval(when) {
  const start = bounds(when.start);
  if (when.end === null) return `${formatBound(start)} – ongoing`;
  const end = bounds(when.end);
  if (start.min === end.min && start.max === end.max) return formatBound(start);
  return `${formatBound(start)} – ${formatBound(end)}`;
}

// Astronomical extent of an interval for scales: { min, max }, max null when
// ongoing.
export function extent(when) {
  const start = astronomicalBounds(when.start);
  const end = when.end === null ? null : astronomicalBounds(when.end);
  return { min: start.min, max: end === null ? null : end.max };
}

// How much of a year has gone by at each month's first day. A fixed table and
// no leap years: what this is for is where along an axis a mark is drawn, and
// one day in three hundred and sixty-five is a fifth of a pixel on a picture
// six years wide.
const MONTH_START = Object.freeze([0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]);
const YEAR_DAYS = 365;

// A `date` or `endDate` as the year it names and how far into that year it
// falls, or null where there is none or it is not a date. The string's shape is
// the schema's (`schema/common/interval.json`): YYYY-MM or YYYY-MM-DD, with a
// leading minus for BCE, in historians' numbering as every year in the data is.
export function dayOfYear(date) {
  if (typeof date !== 'string') return null;
  const parts = /^(-?\d{1,6})-(\d{2})(?:-(\d{2}))?$/.exec(date);
  if (!parts) return null;
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = parts[3] === undefined ? 1 : Number(parts[3]);
  if (!isValidYear(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, fraction: (MONTH_START[month - 1] + (day - 1)) / YEAR_DAYS };
}

// **Where on a time axis an interval begins** (M83, A1-2): its start year, and
// the day inside that year where the record gives one.
//
// The owner, 22 September, with the 1940 column of World War II opened —
// Katyn, Britain, Franco-Thai, Continuation and Dunkirk on one vertical line:
// *"if you have several events on the same line it gets confusing. Even if
// these events happened in the same year, perhaps it was not on the same day so
// it should appear differently."*
//
// The schema calls `date` display-only, and this is a display and nothing else:
// it decides where a mark is drawn along an axis and is read by no comparison,
// no sort, no overlap and no rule. Everything that asks *which year* still asks
// `extent`, which is untouched — so the year a card prints, the year a bar is
// packed on and the year a window holds are the same numbers they were.
//
// A `date` naming another year than the interval starts in is not this
// interval's start and is not read: the node stands at the year, as it did.
export function startPoint(when) {
  const year = extent(when).min;
  const date = dayOfYear(when?.date);
  if (!date || toAstronomical(date.year) !== year) return year;
  return year + date.fraction;
}

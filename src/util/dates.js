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

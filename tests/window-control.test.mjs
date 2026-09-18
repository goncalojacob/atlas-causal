// The window control's own two answers, before anything is wired to it: what
// a typed pair of years is allowed to become, and where the columns of the
// density hint go (src/window-control.js).
//
// M60 puts this control in the masthead, where the band used to be the only
// way to move the window. Written before the behaviour it judges (deviations
// 711 and 717), and **nothing here pins a count of events**: what is asserted
// is the shape of the answer — a column per century over the whole extent, a
// window clamped to the data — and never a number a later import would make
// false.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { windowPatch, densityColumns, DENSITY } from '../src/window-control.js';
import { columnHeight } from '../src/density.js';

// --- the control that sets the window --------------------------------------

const EXTENT = { min: 1415, max: 2026 };

test('the control clamps the window to the data and never crosses its ends', () => {
  assert.deepEqual(windowPatch(1500, 1600, EXTENT), { from: 1500, to: 1600 });
  // Past either end of the data is the end of the data: the band never leaves
  // the scale it is drawn on, which is the rule the band's own drag follows.
  assert.deepEqual(windowPatch(1000, 3000, EXTENT), { from: 1415, to: 2026 });
  // Written backwards is not garbage to drop: it is two ends the wrong way
  // round, and the reader meant the span between them (state.js says so of
  // `?from=` and `?to=`, and this is the same rule at the other door).
  assert.deepEqual(windowPatch(1600, 1500, EXTENT), { from: 1500, to: 1600 });
  // One year wide is a window, not a mistake.
  assert.deepEqual(windowPatch(1755, 1755, EXTENT), { from: 1755, to: 1755 });
});

test('the control refuses what is not a year rather than guessing one', () => {
  assert.equal(windowPatch(Number.NaN, 1600, EXTENT), null);
  assert.equal(windowPatch(1500, null, EXTENT), null);
  // There is no year zero in historians' numbering (util/dates.js).
  assert.equal(windowPatch(0, 1600, EXTENT), null);
  assert.equal(windowPatch(1500.5, 1600, EXTENT), null);
  assert.equal(windowPatch(1500, 1600, null), null);
});

test('a window before the era keeps historians’ numbering on both sides', () => {
  const deep = { min: -999, max: 1000 };
  // -1000 astronomical is 1001 BCE; the control writes years the URL carries.
  assert.deepEqual(windowPatch(-500, -100, deep), { from: -500, to: -100 });
  assert.deepEqual(windowPatch(-5000, 5000, deep), { from: -1000, to: 1000 });
});

// --- the density hint ------------------------------------------------------

test('the hint is a column per century of the data, wherever the window is', () => {
  const counts = new Map([[1400, 3], [1500, 40], [1600, 8], [1700, 0], [1800, 1], [1900, 120], [2000, 12]]);
  const extent = { min: 1415, max: 2026 };
  const wide = densityColumns(counts, extent, { from: 1415, to: 2026 });
  const narrow = densityColumns(counts, extent, { from: 1900, to: 1999 });
  // The lanes stay on the whole extent of the data whatever the window is
  // (timeline.js's head comment, and the reason it is there); the hint beside
  // the control says the same thing, so narrowing moves the marking and never
  // the columns.
  assert.deepEqual(wide.map((c) => c.century), narrow.map((c) => c.century));
  assert.deepEqual(wide.map((c) => c.height), narrow.map((c) => c.height));
  assert.ok(wide.every((c) => c.inside), 'the whole span holds every century');
  assert.deepEqual(narrow.filter((c) => c.inside).map((c) => c.century), [1900]);
});

test('a column’s height is the strip’s own scale and not a second one', () => {
  const counts = new Map([[1500, 1], [1600, 64], [1700, 4096]]);
  const columns = densityColumns(counts, { min: 1500, max: 1799 }, { from: 1500, to: 1799 });
  for (const column of columns) {
    assert.equal(column.height, columnHeight(counts.get(column.century), { min: 1, max: DENSITY.height }));
  }
  // Absolute and logarithmic, so two hints can be compared with each other:
  // a century with one event is the shortest column there is and a century
  // with four thousand does not make it shorter.
  assert.ok(columns[0].height < columns[1].height);
  assert.ok(columns[1].height <= columns[2].height);
});

test('the hint stays inside its own box, and says nothing when there is nothing', () => {
  const counts = new Map([[1400, 3], [1900, 120]]);
  const extent = { min: 1415, max: 2026 };
  for (const column of densityColumns(counts, extent, { from: 1415, to: 2026 })) {
    assert.ok(column.x >= 0 && column.x + column.width <= DENSITY.width + 0.001,
      `column ${column.century} at ${column.x}+${column.width} is outside ${DENSITY.width}`);
    assert.ok(column.height > 0 && column.height <= DENSITY.height);
  }
  assert.deepEqual(densityColumns(new Map(), extent, { from: 1415, to: 2026 }), []);
  assert.deepEqual(densityColumns(counts, null, null), []);
});

// The strip that stands for everything past the margin. Two promises: the
// columns are where the events are, and how tall one is depends on how many
// events it holds and on nothing else — so two rows of the same picture can
// be read against each other.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { densityPath, columnHeight } from '../src/density.js';

// The path as the rectangles it draws: [x, top, width, height].
function rects(d) {
  const out = [];
  for (const [, x, top, w, h] of d.matchAll(/M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h-?[\d.]+Z/g)) {
    out.push([Number(x), Number(top), Number(w), Number(h)]);
  }
  return out;
}

test('nothing beyond the margin is no path at all', () => {
  assert.equal(densityPath([], { floor: 40 }), '');
});

test('one event is the tick it was before, to the pixel', () => {
  const d = densityPath([100], { floor: 40, unit: 2, min: 3 });
  assert.deepEqual(rects(d), [[100, 37, 2, 3]]);
});

test('events on one column are one column, taller for the count', () => {
  const one = rects(densityPath([100], { floor: 40 }));
  const two = rects(densityPath([100, 100.5, 101], { floor: 40 }));
  assert.equal(two.length, 1, 'three events a pixel apart are one column');
  assert.equal(two[0][0], 100);
  assert.ok(two[0][3] > one[0][3], 'and it is taller than one event alone');
  // The floor does not move: the columns grow upward from the lane's floor.
  assert.equal(one[0][1] + one[0][3], 40);
  assert.equal(two[0][1] + two[0][3], 40);
});

test('the height is absolute, so two rows can be compared', () => {
  assert.equal(columnHeight(1), 3);
  assert.ok(columnHeight(8) > columnHeight(2));
  assert.ok(columnHeight(64) >= columnHeight(8));
  assert.equal(columnHeight(64), 9, 'it saturates rather than growing for ever');
  assert.equal(columnHeight(64000), 9);
  // A busy row does not make a quiet one's single event look busy: the same
  // count is the same height wherever it is.
  const quiet = rects(densityPath([10], { floor: 40 }));
  const busy = rects(densityPath([10, 200, 200, 200, 200, 200, 200, 200, 200], { floor: 40 }));
  assert.equal(busy[0][3], quiet[0][3]);
  assert.ok(busy[1][3] > busy[0][3]);
});

test('the columns come out in order, so two renders of the same events match', () => {
  const xs = [300, 12, 99, 12, 500];
  const d = densityPath(xs, { floor: 20 });
  assert.deepEqual(rects(d).map((r) => r[0]), [12, 98, 300, 500]);
  assert.equal(densityPath([...xs].reverse(), { floor: 20 }), d, 'input order does not matter');
});

test('a column is snapped to the grid, not rounded to the nearest one', () => {
  // 98 and 99 are both in the column that starts at 98, two pixels wide.
  assert.deepEqual(rects(densityPath([98, 99], { floor: 10, unit: 2 })).map((r) => r[0]), [98]);
  assert.deepEqual(rects(densityPath([99, 100], { floor: 10, unit: 2 })).map((r) => r[0]), [98, 100]);
});

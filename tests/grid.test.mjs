// The grid the base map is cut on. Twenty-four cells have to tile the world
// with no gap and no overlap, or a reader either sees a seam of missing
// coastline or fetches the same shore twice; and `cellsFor` has to answer the
// wrapped box M39a's `?bbox=` can produce, or panning past the antimeridian
// loses the map.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GRID, WORLD, allCells, cellBounds, cellKey, cellOf, cellsFor, parseCellKey,
} from '../src/map/grid.js';

// Deterministic, so a failure is reproducible: the same thousand points every
// run, spread over the globe by a multiplier with no common factor with 360.
function seededPoints(n) {
  const out = [];
  let a = 12345;
  for (let i = 0; i < n; i += 1) {
    a = (a * 1103515245 + 12345) % 2147483648;
    const lon = -180 + (a / 2147483648) * 360;
    a = (a * 1103515245 + 12345) % 2147483648;
    const lat = -90 + (a / 2147483648) * 180;
    out.push([lon, lat]);
  }
  return out;
}

test('the grid is 6 by 4 and its keys carry no sign', () => {
  assert.deepEqual({ ...GRID }, { lon: 60, lat: 45, columns: 6, rows: 4 });
  const keys = allCells();
  assert.equal(keys.length, 24);
  assert.equal(keys[0], 'x0y0');
  assert.equal(keys[keys.length - 1], 'x5y3');
  // No sign and nothing to escape: the key is a file name and a URL segment.
  for (const key of keys) assert.match(key, /^x\dy\d$/, `${key} is a plain key`);
  assert.equal(new Set(keys).size, 24, 'no key twice');
});

test('the 24 cells tile the world with no gap and no overlap', () => {
  let area = 0;
  const seen = new Set();
  for (const key of allCells()) {
    const [w, s, e, n] = cellBounds(key);
    assert.ok(w >= WORLD[0] && e <= WORLD[2] && s >= WORLD[1] && n <= WORLD[3], `${key} is inside the world`);
    assert.equal(e - w, GRID.lon);
    assert.equal(n - s, GRID.lat);
    assert.ok(!seen.has(`${w},${s}`), `${key} does not repeat a corner`);
    seen.add(`${w},${s}`);
    area += (e - w) * (n - s);
  }
  assert.equal(area, 360 * 180, 'the cells come to the whole world');
});

test('a point on a boundary lands in exactly one cell', () => {
  // The internal boundaries: the cell east and north of the line owns it.
  assert.equal(cellOf(-120, 0), 'x1y2');
  assert.equal(cellOf(-120.0001, 0), 'x0y2');
  assert.equal(cellOf(0, 45), 'x3y3');
  assert.equal(cellOf(0, 44.9999), 'x3y2');
  // The outer edges belong to the last cell: 180°E is not a cell of its own.
  assert.equal(cellOf(180, 90), 'x5y3');
  assert.equal(cellOf(-180, -90), 'x0y0');
});

test('cellBounds(cellOf(p)) contains p, for a thousand seeded points', () => {
  for (const [lon, lat] of seededPoints(1000)) {
    const key = cellOf(lon, lat);
    const box = cellBounds(key);
    assert.ok(box, `${key} is on the grid`);
    const [w, s, e, n] = box;
    assert.ok(lon >= w && lon <= e && lat >= s && lat <= n, `${lon},${lat} is inside ${key} = ${box}`);
  }
});

test('cellsFor(WORLD) is all 24 cells', () => {
  assert.deepEqual(cellsFor(WORLD), allCells());
});

test('cellsFor takes the cells a box overlaps, and not the one it only touches', () => {
  // A box exactly one cell wide, on the cell's own edges.
  assert.deepEqual(cellsFor([-60, 0, 0, 45]), ['x2y2']);
  // A degree past it in each direction is four cells.
  assert.deepEqual(cellsFor([-61, -1, 1, 46]), ['x1y1', 'x1y2', 'x1y3', 'x2y1', 'x2y2', 'x2y3', 'x3y1', 'x3y2', 'x3y3']);
  // A point box is the cell the point is in.
  assert.deepEqual(cellsFor([-30, 40, -30, 40]), [cellOf(-30, 40)]);
});

test('cellsFor wraps a box whose west is east of its east', () => {
  // A reader panned past the antimeridian: 150°E to 150°W, the far side of
  // the world from Greenwich, which is two spans and not an empty one.
  const keys = cellsFor([150, -45, -150, 45]);
  assert.deepEqual(keys, ['x0y1', 'x0y2', 'x5y1', 'x5y2']);
  // The cells on both sides of the seam are in it.
  assert.ok(keys.includes('x5y2'), 'the column that ends at 180°E');
  assert.ok(keys.includes('x0y2'), 'the column that starts at -180°');
});

test('a key that is not on the grid has no bounds', () => {
  assert.equal(cellBounds('x6y0'), null);
  assert.equal(cellBounds('x0y4'), null);
  assert.equal(cellBounds('nonsense'), null);
  assert.equal(parseCellKey('x9y9'), null);
  assert.deepEqual(parseCellKey('x2y2'), { i: 2, j: 2 });
  assert.equal(cellKey(2, 2), 'x2y2');
  // Column and row are as good as a key, for a caller that has them.
  assert.deepEqual(cellBounds(2, 2), cellBounds('x2y2'));
});

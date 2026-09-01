import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointInRing, pointInGeometry, distanceToGeometry, createRegionDeriver } from '../src/util/geo.js';
import { fixtures } from './helpers.mjs';

const square = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];

test('point in ring, polygon with hole, multipolygon', () => {
  assert.equal(pointInRing([5, 5], square), true);
  assert.equal(pointInRing([15, 5], square), false);
  const hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
  assert.equal(pointInGeometry([5, 5], { type: 'Polygon', coordinates: [square, hole] }), false);
  assert.equal(pointInGeometry([1, 1], { type: 'Polygon', coordinates: [square, hole] }), true);
  assert.equal(pointInGeometry([5, 5], { type: 'MultiPolygon', coordinates: [[square]] }), true);
  assert.equal(pointInGeometry([5, 5], { type: 'Point', coordinates: [5, 5] }), false);
});

test('distance to geometry is zero on the boundary and grows outside', () => {
  const g = { type: 'Polygon', coordinates: [square] };
  assert.equal(distanceToGeometry([10, 5], g), 0);
  assert.ok(Math.abs(distanceToGeometry([0, 12], g) - 2) < 1e-9);
});

test('region derivation: inside, nearest within tolerance, nothing beyond', async () => {
  const { polygons } = await fixtures();
  const derive = createRegionDeriver(polygons);
  assert.deepEqual(derive({ lon: -30, lat: 40 }), { region: 'fixture-lane-1', method: 'inside', distance: 0 });
  const near = derive({ lon: -9, lat: 30 });
  assert.equal(near.region, 'fixture-lane-1');
  assert.equal(near.method, 'nearest');
  assert.ok(near.distance > 0 && near.distance <= 1);
  assert.equal(derive({ lon: 100, lat: -60 }), null);
  assert.equal(derive(null), null);
  assert.equal(createRegionDeriver(null)({ lon: 0, lat: 0 }), null);
});

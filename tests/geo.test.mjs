import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pointInRing, pointInGeometry, distanceToGeometry, createRegionDeriver, bbox, regionBounds,
} from '../src/util/geo.js';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readRegionPolygons } from '../tools/lib/read.mjs';
import { fixtures, FIXTURE_DATA, ROOT } from './helpers.mjs';

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

// --- the box of a region --------------------------------------------------
//
// One box per region, derived from the polygons at load. The placeless events
// answer "am I in view" with it (util/viewport.js), and it is derived rather
// than stored so that `data/index/` does not have to change for it.

test('a geometry\'s box is its outer rings, and a geometry with no ring has none', () => {
  assert.deepEqual(bbox({ type: 'Polygon', coordinates: [square] }), [0, 0, 10, 10]);
  // A hole cannot widen the box, and a multipolygon is the union of its parts.
  const hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
  assert.deepEqual(bbox({ type: 'Polygon', coordinates: [square, hole] }), [0, 0, 10, 10]);
  assert.deepEqual(
    bbox({ type: 'MultiPolygon', coordinates: [[square], [[[20, -5], [30, -5], [30, 5], [20, -5]]]] }),
    [0, -5, 30, 10],
  );
  assert.equal(bbox({ type: 'Polygon', coordinates: [] }), null);
  assert.equal(bbox({ type: 'Point', coordinates: [0, 0] }), null);
  assert.equal(bbox(null), null);
});

test('the fixture regions come back one box each', async () => {
  const { polygons } = await fixtures();
  const boxes = regionBounds(polygons);
  assert.deepEqual([...boxes.keys()].sort(), ['fixture-lane-1', 'fixture-lane-2', 'fixture-lane-3']);
  assert.deepEqual(boxes.get('fixture-lane-1'), [-40, 20, -10, 50]);
  assert.deepEqual(boxes.get('fixture-lane-3'), [10, -20, 40, 50], 'a multipolygon among them');
  // Two features naming the same region are one box between them.
  const merged = regionBounds({
    features: [
      { properties: { region: 'r' }, geometry: { type: 'Polygon', coordinates: [square] } },
      { properties: { region: 'r' }, geometry: { type: 'Polygon', coordinates: [[[20, 20], [30, 20], [30, 30], [20, 20]]] } },
    ],
  });
  assert.deepEqual(merged.get('r'), [0, 0, 30, 30]);
  // And anything that is not a region is not one.
  assert.equal(regionBounds({ features: [{ properties: {}, geometry: { type: 'Polygon', coordinates: [square] } }] }).size, 0);
  assert.equal(regionBounds(null).size, 0);
});

// D2: the boxes are in the manifest since I1 and the polygons are not fetched
// at first paint. The build writes them and this is the other half of the
// claim — that what the manifest carries is `regionBounds` over the very file
// the atlas used to reduce on every page load, to the rounding.
for (const [label, dataDir] of [['the fixtures', FIXTURE_DATA], ['the repository', path.join(ROOT, 'data')]]) {
  test(`the manifest's boxes are regionBounds over the polygons, over ${label}`, async () => {
    const manifest = JSON.parse(await readFile(path.join(dataDir, 'index', 'manifest.json'), 'utf8'));
    const polygons = await readRegionPolygons(dataDir);
    const wanted = regionBounds(polygons);
    assert.ok(wanted.size > 0, `${label} has lane polygons`);
    assert.deepEqual(Object.keys(manifest.regionBoxes).sort(), [...wanted.keys()].sort());
    const round = (n) => Math.round(n * 1e6) / 1e6;
    for (const [id, box] of wanted) {
      assert.deepEqual(manifest.regionBoxes[id], box.map(round), id);
    }
  });
}

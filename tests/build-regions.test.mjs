import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildLanes, buildLand, CONTINENT_TO_LANE } from '../tools/build-regions.mjs';
import { createRegionDeriver } from '../src/util/geo.js';
import { ROOT } from './helpers.mjs';

const square = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
const country = (name, continent, geometry) => ({ type: 'Feature', properties: { NAME: name, CONTINENT: continent }, geometry });

const synthetic = {
  type: 'FeatureCollection',
  features: [
    country('Fixture country B', 'Europe', { type: 'Polygon', coordinates: square(0, 0, 1, 1) }),
    country('Fixture country A', 'Europe', { type: 'MultiPolygon', coordinates: [square(2, 2, 3, 3), square(4, 4, 5, 5)] }),
    country('Fixture country C', 'North America', { type: 'Polygon', coordinates: square(-10, 0, -9, 1) }),
    country('Fixture country D', 'South America', { type: 'Polygon', coordinates: square(-10, -5, -9, -4) }),
    country('Fixture country E', 'Antarctica', { type: 'Polygon', coordinates: square(0, -80, 1, -79) }),
  ],
};
const lanes = [
  { id: 'americas', label: 'Americas', order: 2 },
  { id: 'europe', label: 'Europe', order: 1 },
];

test('lanes are unions of member countries by continent, in lane order, members sorted', () => {
  const { collection, skipped } = buildLanes(synthetic, lanes);
  assert.equal(collection.features.length, 2);
  assert.equal(collection.features[0].properties.region, 'europe');
  assert.deepEqual(collection.features[0].properties.countries, ['Fixture country A', 'Fixture country B']);
  assert.equal(collection.features[0].geometry.type, 'MultiPolygon');
  assert.equal(collection.features[0].geometry.coordinates.length, 3);
  assert.deepEqual(collection.features[1].properties.countries, ['Fixture country C', 'Fixture country D']);
  assert.deepEqual(skipped, ['Fixture country E (Antarctica)']);
});

test('land keeps geometry and drops properties', () => {
  const land = buildLand({ type: 'FeatureCollection', features: [country('x', 'y', { type: 'Polygon', coordinates: square(0, 0, 1, 1) })] });
  assert.deepEqual(land.features[0].properties, {});
  assert.equal(land.features[0].geometry.type, 'Polygon');
});

test('every v1 lane has a continent mapping', async () => {
  const regions = JSON.parse(await readFile(path.join(ROOT, 'data', 'regions.json'), 'utf8'));
  const mapped = new Set(Object.values(CONTINENT_TO_LANE));
  for (const lane of regions) assert.ok(mapped.has(lane.id), lane.id);
});

test('the committed lane polygons put well-known coordinates on the expected lanes', async (t) => {
  const file = path.join(ROOT, 'data', 'geo', 'regions.json');
  if (!existsSync(file)) {
    t.skip('data/geo/regions.json not generated');
    return;
  }
  const derive = createRegionDeriver(JSON.parse(await readFile(file, 'utf8')));
  // Coordinates only; nothing historical is claimed here.
  const cases = [
    [[-9.14, 38.71], 'europe'],
    [[2.35, 48.85], 'europe'],
    [[-6, 32], 'africa'],
    [[20, 5], 'africa'],
    [[100, 30], 'asia'],
    [[77.2, 28.6], 'asia'],
    [[-60, -10], 'americas'],
    [[-99, 19.4], 'americas'],
    [[135, -25], 'oceania'],
  ];
  for (const [[lon, lat], lane] of cases) {
    const d = derive({ lon, lat });
    assert.ok(d, `${lon},${lat} derived nothing`);
    assert.equal(d.region, lane, `${lon},${lat} → ${d.region} (${d.method})`);
  }
  // Mid-ocean: no lane within tolerance.
  assert.equal(derive({ lon: -30, lat: 30 }), null);
  // A point in the Strait of Gibraltar is outside every 110m polygon and
  // within reach of two lanes: it derives by nearest, which is why `region`
  // on the record exists as an override. The lane it lands on is not
  // asserted; only that it is a nearest-lane guess.
  assert.equal(derive({ lon: -5.32, lat: 35.89 }).method, 'nearest');
});

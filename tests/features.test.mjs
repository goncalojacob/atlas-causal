// The property table and the zoom table the base map's import reads Natural
// Earth through. Pure, so all of it runs on objects written here.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LAYERS, PROPERTIES, Z_BY_NE_ZOOM, Z_VISIBLE_BY, kept, layer, lineLength,
  polygonArea, readFeature, surveyProperties, surveyShape, zFor, zOf,
} from '../tools/import/features.mjs';

const square = (x, y, size) => ({
  type: 'Polygon',
  coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]],
});

test('the zoom table is monotone and everything is visible by k = 16', () => {
  for (let i = 1; i < Z_BY_NE_ZOOM.length; i += 1) {
    assert.ok(Z_BY_NE_ZOOM[i] >= Z_BY_NE_ZOOM[i - 1], `row ${i} is not below row ${i - 1}`);
  }
  assert.equal(Math.max(...Z_BY_NE_ZOOM), Z_VISIBLE_BY);
  assert.equal(Z_VISIBLE_BY, 16);
  // Natural Earth's own range, half steps and all, and everything past it.
  for (const zoom of [0, 0.5, 1.5, 5, 6.5, 6.7, 7.1, 9, 10, 12, 100]) {
    const z = zOf(zoom);
    assert.ok(z >= 1 && z <= Z_VISIBLE_BY, `NE zoom ${zoom} → k ${z} is on the map`);
  }
  assert.equal(zOf(0), 1, 'what Natural Earth draws at the world is drawn at the world');
  assert.equal(zOf(100), Z_VISIBLE_BY, 'and the 0,0 marker\'s absurd zoom is still on the map');
  assert.equal(zOf(null), Z_VISIBLE_BY);
  assert.equal(zOf(undefined), Z_VISIBLE_BY);
});

test('z comes from min_zoom where there is one, and the scale rank where there is not', () => {
  const table = PROPERTIES.coast;
  const geometry = square(0, 0, 1);
  assert.equal(zFor(table, { min_zoom: 0, scalerank: 6 }, geometry), zOf(0), 'min_zoom wins');
  assert.equal(zFor(table, { min_zoom: null, scalerank: 6 }, geometry), zOf(6), 'the rank is the fallback before the rule');
  assert.equal(zFor(table, { min_zoom: 6.5, scalerank: 7 }, geometry), zOf(7), 'a half step rounds');
});

test('z comes from the fallback rule where a feature has neither', () => {
  // The one ne_10m_land feature with 2,773 polygons and every property null.
  const table = PROPERTIES.coast;
  const big = zFor(table, { min_zoom: null, scalerank: null }, square(0, 0, 20));
  const middling = zFor(table, { min_zoom: null, scalerank: null }, square(0, 0, 2));
  const tiny = zFor(table, { min_zoom: null, scalerank: null }, square(0, 0, 0.02));
  assert.ok(big < middling && middling < tiny, `${big} < ${middling} < ${tiny}: bigger is drawn sooner`);
  assert.ok(tiny <= Z_VISIBLE_BY, 'and the smallest island is still on the map by k = 16');
});

test('the fallbacks measure what they say they measure', () => {
  assert.equal(polygonArea(square(0, 0, 3)), 9);
  // A MultiPolygon is as visible as its largest island, not as the sum: an
  // archipelago of specks is not a continent.
  const archipelago = { type: 'MultiPolygon', coordinates: [square(0, 0, 1).coordinates, square(10, 0, 3).coordinates] };
  assert.equal(polygonArea(archipelago), 9);
  assert.equal(lineLength({ type: 'LineString', coordinates: [[0, 0], [3, 0], [3, 4]] }), 7);
});

test('a feature the layer does not want is not one of its features', () => {
  // coast: a deny-list. Natural Earth ships a `Null island` marker at 0,0.
  assert.equal(kept(PROPERTIES.coast, { featurecla: 'Land' }), true);
  assert.equal(kept(PROPERTIES.coast, { featurecla: 'Null island' }), false);
  assert.equal(kept(PROPERTIES.coast, { featurecla: null }), true, 'the unclassed feature is land too');
  // physical: an allow-list, because the file holds 295 islands and 37
  // coasts that would draw the coastline a third time.
  assert.equal(kept(PROPERTIES.physical, { FEATURECLA: 'Desert' }), true);
  assert.equal(kept(PROPERTIES.physical, { FEATURECLA: 'Island' }), false);
  assert.equal(kept(PROPERTIES.physical, { FEATURECLA: 'Dragons-be-here' }), false);
  assert.equal(kept(PROPERTIES.physical, {}), false, 'no class at all is not on the allow-list');
});

test('a feature missing the name its table names is dropped and reported', () => {
  const geometry = square(0, 0, 1);
  const named = readFeature('lakes', { properties: { name: 'Lake Chad', scalerank: 3 }, geometry });
  assert.equal(named.name, 'Lake Chad');
  assert.equal(named.dropped, undefined);
  const nameless = readFeature('lakes', { properties: { scalerank: 3 }, geometry });
  assert.equal(nameless.dropped, 'no name', 'said out loud, not written with undefined in it');
  assert.equal(nameless.name, undefined);
  assert.equal(readFeature('lakes', { properties: { name: 'x' } }).dropped, 'no geometry');
  // coast names no name property at all, so a feature with no name is fine.
  assert.equal(readFeature('coast', { properties: { featurecla: 'Land', min_zoom: 0 }, geometry }).dropped, undefined);
});

test('a name is carried through exactly as the file has it', () => {
  // Escaping is esc()'s job in the browser. An import that escaped would put
  // &amp; in a file and the browser would then show it.
  const geometry = square(0, 0, 1);
  const raw = 'Saint John\'s & "the other one" <Ilha>';
  const read = readFeature('lakes', { properties: { name: raw, scalerank: 3 }, geometry });
  assert.equal(read.name, raw);
});

test('nameEn is written only where it differs from the name', () => {
  const geometry = square(0, 0, 1);
  const same = readFeature('lakes', { properties: { name: 'Genfersee', name_en: 'Genfersee', scalerank: 3 }, geometry });
  assert.equal(same.nameEn, undefined);
  const differs = readFeature('lakes', { properties: { name: 'Genfersee', name_en: 'Lake Geneva', scalerank: 3 }, geometry });
  assert.equal(differs.nameEn, 'Lake Geneva');
});

test('the layer table names one layer in M36a, and coast is lines with no world file', () => {
  assert.deepEqual(LAYERS.map((l) => l.id), ['coast']);
  const coast = layer('coast');
  assert.equal(coast.geometry, 'line', 'a cut ring is never stroked as a ring');
  assert.equal(coast.world, null, 'its far level is manifest.land');
  assert.equal(layer('rivers'), null);
});

test('the survey counts the keys a file actually has, and says nothing about the ones it has not', () => {
  const collection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { featurecla: 'Land', scalerank: 0, min_zoom: null }, geometry: square(0, 0, 1) },
      { type: 'Feature', properties: { featurecla: 'Land', scalerank: 6 }, geometry: square(3, 0, 1) },
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [10, 20] } },
    ],
  };
  const rows = surveyProperties(collection);
  assert.deepEqual(rows.map((r) => r.key), ['featurecla', 'min_zoom', 'scalerank'], 'sorted, so two runs print one page');
  assert.equal(rows.find((r) => r.key === 'min_zoom').present, 0, 'a key that is null everywhere is present nowhere');
  assert.deepEqual(rows.find((r) => r.key === 'scalerank').samples, [0, 6]);
  const shape = surveyShape(collection);
  assert.equal(shape.features, 3);
  assert.deepEqual(shape.types, ['Point', 'Polygon']);
  assert.equal(shape.points, 11, 'five points a ring, and one for the point');
  assert.deepEqual(shape.box, [0, 0, 10, 20], 'the point is in the box too');
});

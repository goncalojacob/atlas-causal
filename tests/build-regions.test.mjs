import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  buildLanes, buildLand, CONTINENT_TO_LANE, FILES, SOURCE_SHA256, VENDOR_110M,
  seamReport, chooseSeam, excludedAs, SEAM_CANDIDATES,
} from '../tools/build-regions.mjs';
import { readSourceJson } from '../tools/import/source.mjs';
import { crossesMeridian } from '../tools/import/geometry.mjs';
import { SEAM } from '../src/map/projection.js';
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

// --- where the world is cut -----------------------------------------------

test('the seam report counts what each candidate meridian cuts, and sets aside what none can miss', () => {
  const land = {
    type: 'FeatureCollection',
    features: [
      // Across the seam of 150E and of nothing else.
      country('across -30', '', { type: 'Polygon', coordinates: square(-35, 0, -25, 10) }),
      // Across every candidate seam, and Antarctica's box.
      country('antarctic', '', { type: 'Polygon', coordinates: square(-180, -85, 180, -65) }),
      // Across the seam of 150E too, but inside the Azores' box: set aside.
      country('azores', '', { type: 'Polygon', coordinates: square(-31, 37, -25, 39) }),
      country('far east', '', { type: 'Polygon', coordinates: square(100, 0, 120, 20) }),
    ],
  };
  const rows = seamReport(land, { type: 'FeatureCollection', features: land.features });
  assert.deepEqual(rows.map((r) => r.meridian), [...SEAM_CANDIDATES]);
  assert.deepEqual(rows.map((r) => r.seam), [-40, -35, -30, -25, -20, -15, -10]);
  const at = (meridian) => rows.find((r) => r.meridian === meridian);

  assert.equal(at(150).polygons, 1, 'the one shape across -30 that is nobody\'s island');
  assert.equal(at(150).area, 100);
  assert.deepEqual(at(150).names, ['across -30']);
  // Both the Antarctic ring and the Azores are cut at -30, and neither is
  // counted: they are reported on their own line instead.
  assert.deepEqual(at(150).setAside, ['Antarctica', 'the Azores']);
  assert.equal(at(145).polygons, 0);
  assert.deepEqual(at(145).setAside, ['Antarctica']);

  // Clearance is to the nearest land the seam does *not* cut, set aside or
  // not: -20 is five degrees from the eastern edge of both Atlantic shapes.
  assert.equal(at(160).clearance, 5);
  assert.equal(at(145).clearance, 0, 'a seam that runs along an edge clears nothing');

  // Fewest cut, then least area, then the seam that clears land by furthest.
  assert.equal(chooseSeam([at(150), at(140)]).meridian, 140, 'fewest cut comes first');
  assert.equal(chooseSeam([at(145), at(140)]).meridian, 140, 'and a tie at none is broken by the clearance');
});

test('a polygon is set aside only when it sits wholly inside a named box', () => {
  // Western Sahara is in the Atlantic and is not an Atlantic island.
  assert.equal(excludedAs([-17.1, 21, -8.7, 27.7]), null);
  assert.equal(excludedAs([-24.33, 63.5, -13.61, 66.53]), 'Iceland', 'and not Greenland, whose box contains it');
  assert.equal(excludedAs([-73.3, 60, -12.2, 83.6]), 'Greenland');
  assert.equal(excludedAs([-180, -90, 180, -63.3]), 'Antarctica');
  assert.equal(excludedAs([-31.3, 36.9, -25, 39.7]), 'the Azores');
});

// The measurement the seam was chosen by, against the coastline itself. It is
// in STATUS.md and in ARCHITECTURE.md as a table; this is the same run of the
// same tool, so the two cannot drift apart without a test saying so.
test('the committed sources choose 150E', async (t) => {
  const source = path.join(ROOT, ...VENDOR_110M.split('/'));
  if (!existsSync(path.join(source, `${FILES.land}.gz`))) {
    t.skip('the vendored Natural Earth 110m is not here');
    return;
  }
  const read = async (name) => (await readSourceJson(path.join(source, `${name}.gz`), SOURCE_SHA256[name])).json;
  const rows = seamReport(await read(FILES.land), await read(FILES.countries));
  assert.deepEqual(rows.filter((r) => r.polygons === 0).map((r) => r.meridian), [150, 155, 160],
    'three candidates cut no continent; the clearance is what parts them');
  const chosen = chooseSeam(rows);
  assert.equal(chosen.meridian, 150);
  assert.equal(chosen.seam, -30);
  assert.equal(chosen.polygons, 0);
  assert.ok(chosen.clearance > 4.7 && chosen.clearance < 4.8, `${chosen.clearance}`);
  assert.deepEqual(chosen.setAside, ['Antarctica', 'Greenland'], 'and it is the only zero-cut seam that leaves Iceland whole');
});

// M39a: the cut is the whole point of the seam, so the committed files have to
// carry it. Nothing under data/geo/ may cross 30°W — one ring across it is one
// shape drawn as a smear across the whole picture.
test('no committed geometry crosses the seam', async () => {
  const files = [
    path.join(ROOT, 'data', 'geo', 'land-present.json'),
    path.join(ROOT, 'data', 'geo', 'regions.json'),
    ...(await readdir(path.join(ROOT, 'data', 'geo', 'presences')))
      .filter((name) => name.endsWith('.json'))
      .map((name) => path.join(ROOT, 'data', 'geo', 'presences', name)),
  ];
  assert.ok(files.length >= 4);
  for (const file of files) {
    if (!existsSync(file)) continue;
    const collection = JSON.parse(await readFile(file, 'utf8'));
    const across = collection.features
      .filter((f) => f.geometry && crossesMeridian(f.geometry, SEAM))
      .map((f) => f.id ?? f.properties?.region ?? f.properties?.presence ?? '?');
    assert.deepEqual(across, [], `${path.basename(file)} has ${across.length} feature(s) across ${SEAM}`);
  }
});

// And the cut must not move a single event to another lane. It adds vertices
// at one longitude and takes none away, so point-in-polygon answers the same
// everywhere but exactly on the seam — asserted here against the records
// rather than argued for in a comment.
test('the recut lane polygons put every place on the lane they were on', async () => {
  const file = path.join(ROOT, 'data', 'geo', 'regions.json');
  const dir = path.join(ROOT, 'data', 'places');
  if (!existsSync(file) || !existsSync(dir)) return;
  const derive = createRegionDeriver(JSON.parse(await readFile(file, 'utf8')));
  // The lane polygons as Natural Earth publishes them, uncut: the same build
  // with the seam put where nothing is, which is the honest control.
  const source = path.join(ROOT, ...VENDOR_110M.split('/'));
  if (!existsSync(path.join(source, `${FILES.countries}.gz`))) return;
  const countries = (await readSourceJson(path.join(source, `${FILES.countries}.gz`), SOURCE_SHA256[FILES.countries])).json;
  const lanes = JSON.parse(await readFile(path.join(ROOT, 'data', 'regions.json'), 'utf8'));
  const uncut = createRegionDeriver(buildLanes(countries, lanes, { seam: -180 }).collection);

  let places = 0;
  for (const name of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
    const record = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
    if (!record.where) continue;
    places += 1;
    const a = uncut(record.where);
    const b = derive(record.where);
    assert.equal(b?.region ?? null, a?.region ?? null, `${record.id} changed lane`);
    assert.equal(b?.method ?? null, a?.method ?? null, `${record.id} changed how it was derived`);
  }
  assert.ok(places >= 20, `${places} placed records were checked`);
});

// The base map's import. Offline, on the fixture Natural Earth files under
// tests/fixtures/naturalearth/, written into a temporary directory and
// removed again, as tests/bench-harness.test.mjs does.
//
// The three things a run cannot recover from are here: that the plan is a
// pure function of its input, so the budget can be printed before a byte is
// written; that a second run rewrites every file byte for byte, so a
// regenerated base map is a diff of what actually changed; and that a source
// whose sha256 differs stops the tool under --check rather than being
// imported quietly.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import {
  BASE_DIR, GEO_CEILING, LAND_FILE, coastLines, coastPolygons, main, planImport,
} from '../tools/import/naturalearth.mjs';
import { ELEVATION_SOURCE } from '../tools/import/features.mjs';
import { BAND_EDGES, GRID as ELEVATION_GRID } from '../tools/import/elevation.mjs';
import { clipLine } from '../tools/import/geometry.mjs';
import { allCells, cellBounds } from '../src/map/grid.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'naturalearth');
// The fixture dataset, for its data/imports/naturalearth-places.json and its
// data/places/: the cities layer is filtered by the one and linked by the
// other, and a run pointed at the real data/ would answer about the real
// corpus rather than about these five towns.
const FIXTURE_DATA = path.join(ROOT, 'tests', 'fixtures', 'data');

async function sources(dir = FIXTURES) {
  const out = {};
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.geojson')) continue;
    out[name] = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
  }
  return out;
}

async function temporary(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-ne-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await filesUnder(file)).map((n) => `${entry.name}/${n}`));
    else out.push(entry.name);
  }
  return out.sort();
}

// The fixture elevation grid, and it is **made here rather than committed**:
// the format has no header, so a grid has to be the full 2160 × 1080 int16
// whatever is in it, and four and a half megabytes of synthetic ground does
// not belong in the repository. Written once into a temporary directory and
// removed with it.
//
// One stepped cone at 20° N, 30° W — inside the cell x2y2 the other fixtures
// are in — with a step for every one of the five bands, so that a band is
// something this file can make assertions about. Everything else is 1,000 m
// below the sea and therefore in no band at all, which is the other half of
// what the bands are: below sea level is not one (M45b §2.2).
const ELEVATION_DIR = mkdtempSync(path.join(tmpdir(), 'atlas-elev-'));
after(() => rm(ELEVATION_DIR, { recursive: true, force: true }));

function writeFixtureGrid() {
  const { columns, rows } = ELEVATION_GRID;
  const grid = new Int16Array(columns * rows).fill(-1000);
  // The grid's own frame: row 0 at 90° N running south, column 0 at 0° E
  // running east (tools/import/elevation.mjs).
  const at = (lat, lon) => Math.round((90 - lat) * 6) * columns
    + (Math.round((((lon % 360) + 360) % 360) * 6) % columns);
  // Radii in cells, narrowest first, so the first one a point is inside is the
  // height it gets: each band is then a ring around the next one up.
  const steps = [[3, 3000], [6, 1500], [12, 750], [18, 350], [24, 100]];
  for (let dy = -24; dy <= 24; dy += 1) {
    for (let dx = -24; dx <= 24; dx += 1) {
      const d = Math.hypot(dy, dx);
      const step = steps.find(([radius]) => d <= radius);
      if (!step) continue;
      grid[at(20 + dy / 6, -30 + dx / 6)] = step[1];
    }
  }
  writeFileSync(path.join(ELEVATION_DIR, `${ELEVATION_SOURCE}.gz`), gzipSync(Buffer.from(grid.buffer)));
  return ELEVATION_DIR;
}

const ELEVATION = ['--elevation', writeFixtureGrid()];

const quiet = async (fn) => {
  const log = console.log;
  const error = console.error;
  const said = [];
  console.log = (...args) => said.push(args.join(' '));
  console.error = (...args) => said.push(args.join(' '));
  try {
    return { code: await fn(), said: said.join('\n') };
  } finally {
    console.log = log;
    console.error = error;
  }
};

test('the plan is a pure function of the input', async () => {
  const input = await sources();
  const one = planImport(input);
  const two = planImport(input);
  assert.deepEqual(one, two, 'two plans over one input are the same plan');
  assert.deepEqual(input, await sources(), 'and the input was not written on');
});

test('every layer is written at both levels, and a cell with nothing in it is not', async (t) => {
  const dir = await temporary(t);
  const { code } = await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  assert.equal(code, 0);
  const written = await filesUnder(dir);
  assert.deepEqual(written, [
    LAND_FILE,
    // M45b's bands, cut out of the fixture grid: one cone at 20° N, 30° W, so
    // the world file and the one cell it falls in and no other.
    'base/relief-world.json', 'base/relief/x2y2.json',
    'base/coast/x2y2.json', 'base/coast/x2y3.json',
    'base/rivers-world.json', 'base/rivers/x2y2.json',
    'base/lakes-world.json', 'base/lakes/x2y2.json',
    'base/physical-world.json', 'base/physical/x2y2.json',
    'base/mountains-world.json', 'base/mountains/x2y2.json',
    'base/cities-world.json', 'base/cities/x2y2.json',
  ].sort());
  // The fixtures are all in one cell but the coast, and the twenty-two the
  // grid has left over are not on disk: nothing is drawn that has no data,
  // and an empty ocean cell is not worth a file and a request.
  assert.equal(existsSync(path.join(dir, BASE_DIR, 'coast', 'x0y0.json')), false);
  assert.equal(existsSync(path.join(dir, BASE_DIR, 'rivers', 'x0y0.json')), false);
  assert.equal(existsSync(path.join(dir, BASE_DIR, 'lakes', 'x5y1.json')), false);
});

test('the four layers M36b added carry what M37 and M38 need of them', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const read = async (...names) => JSON.parse(await readFile(path.join(dir, ...names), 'utf8'));

  // Rivers are lines, clipped to the cell, and carry the name M38 labels
  // them by. The fixture file has three and none is dropped for being
  // nameless — that rule is the cities' alone.
  const rivers = await read(BASE_DIR, 'rivers', 'x2y2.json');
  assert.equal(rivers.features.length, 3);
  for (const feature of rivers.features) {
    assert.ok(['LineString', 'MultiLineString'].includes(feature.geometry.type));
    assert.equal(typeof feature.properties.z, 'number');
  }
  assert.ok(rivers.features.some((f) => f.properties.name === 'Fixture River'));
  // No `ne_id` in that file, so no river carries an id it does not have.
  assert.equal(rivers.features.every((f) => f.properties.id === undefined), true);

  // Lakes are whole polygons, never clipped, each with the id M37 draws it
  // once by however many cells brought it.
  const lakes = await read(BASE_DIR, 'lakes', 'x2y2.json');
  assert.equal(lakes.features.length, 1);
  assert.equal(lakes.features[0].geometry.type, 'Polygon');
  assert.equal(lakes.features[0].properties.id, '1159100001');
  assert.equal(lakes.features[0].properties.name, 'Fixture Lake');

  // The physical regions keep amendment A5's allow-list: the Desert is one of
  // ours and the Island is the coastline a third time.
  const physical = await read(BASE_DIR, 'physical', 'x2y2.json');
  assert.deepEqual(physical.features.map((f) => f.properties.name), ['Fixture Desert']);
  assert.equal(physical.features[0].properties.id, '1159100003');

  // Peaks are an array of small objects and not a FeatureCollection: a
  // Feature around a point is about a third scaffolding (deviation 517).
  const peaks = await read(BASE_DIR, 'mountains', 'x2y2.json');
  assert.ok(Array.isArray(peaks));
  assert.deepEqual(peaks, [{
    elevation: 1934, id: '1159100007', lat: 27.5, lon: -28.5, name: 'Fixture Peak', z: 6, zl: 7,
  }]);

  // And the far level of each is one file for the whole world, in the same
  // shape as its cells.
  assert.equal((await read(BASE_DIR, 'rivers-world.json')).type, 'FeatureCollection');
  assert.equal((await read(BASE_DIR, 'lakes-world.json')).features.length, 1);
  assert.deepEqual(await read(BASE_DIR, 'mountains-world.json'), peaks);
});

test('the population filter keeps the cities over 100 000, and the one the atlas names', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const cities = JSON.parse(await readFile(path.join(dir, BASE_DIR, 'cities', 'x2y2.json'), 'utf8'));
  // Five populated places in the fixture file. Four are over a hundred
  // thousand; the fifth, Fixture Town at 9,400, is in the base map only
  // because tests/fixtures/data/imports/naturalearth-places.json names it.
  assert.deepEqual(cities.map((c) => c.name), [
    'Fixture City', 'Fixture Port', 'Fixture Villa', 'Fixture Borough', 'Fixture Town',
  ]);
  const town = cities.find((c) => c.name === 'Fixture Town');
  assert.equal(town.pop, 9400);
  assert.equal(town.place, 'fixture-place-a', 'the link the browser can never fetch from data/imports/');
  // A city no record names carries no `place` key at all, rather than a null.
  assert.equal(Object.hasOwn(cities.find((c) => c.name === 'Fixture Villa'), 'place'), false);

  // Amendment A6's fields, and nothing else: no elevation on a city and no
  // scaffolding around a point.
  assert.ok(Array.isArray(cities));
  assert.deepEqual(Object.keys(cities[0]).sort(), ['id', 'lat', 'lon', 'name', 'pop', 'wikidata', 'z', 'zl']);
  assert.equal(cities.every((c) => c.elevation === undefined), true);

  // The far level has a floor of its own, in people, because a point has no
  // extent to simplify: Fixture Borough at 130,000 is under it and is in its
  // cell alone. The town the atlas names is never under it, whatever its
  // population — which is the whole of what the mapping is for.
  const world = JSON.parse(await readFile(path.join(dir, BASE_DIR, 'cities-world.json'), 'utf8'));
  assert.deepEqual(world.map((c) => c.name), ['Fixture City', 'Fixture Port', 'Fixture Villa', 'Fixture Town']);
});

test('a peak carries its label zoom and nothing else the cities carry', async (t) => {
  // `carry` is per layer: `wikidata` is on a city by amendment A6 and on no
  // peak by deviation 615, and the fixture file gives the peak one. M38 adds
  // `zl` to the row, because a peak's name is drawn at its own label zoom like
  // every other, and nothing else moved with it.
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const peaks = JSON.parse(await readFile(path.join(dir, BASE_DIR, 'mountains-world.json'), 'utf8'));
  assert.deepEqual(peaks, [{
    elevation: 1934, id: '1159100007', lat: 27.5, lon: -28.5, name: 'Fixture Peak', z: 6, zl: 7,
  }]);
});

// M38, test 3. `zl` is the zoom a name appears at and every feature has one:
// Natural Earth's own label rank through the one frozen table where the file
// records one, and `z + 1` — one rung after the dot — where it does not. The
// dot is never later than its name and a nameless feature never carries a
// label zoom at all, because there is no label for it to be the zoom of.
test('every feature carries a label zoom, from the rank or from z + 1', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const read = async (...names) => JSON.parse(await readFile(path.join(dir, ...names), 'utf8'));

  // The three files that rank their labels: `min_label` on the rivers and the
  // lakes, `MIN_LABEL` on the physical regions.
  const named = (collection) => collection.features.filter((f) => f.properties.name !== undefined);
  for (const layer of ['rivers', 'lakes', 'physical']) {
    for (const feature of named(await read(BASE_DIR, `${layer}-world.json`))) {
      const { z, zl, name } = feature.properties;
      assert.equal(typeof zl, 'number', `${layer}: ${name} has a label zoom`);
      assert.ok(zl >= z, `${layer}: ${name} is a dot before it is a name (z ${z}, zl ${zl})`);
    }
  }
  // The peaks rank nothing, so every one of them is `z + 1`.
  for (const peak of (await read(BASE_DIR, 'mountains-world.json')).filter((p) => p.name)) {
    assert.equal(peak.zl, peak.z + 1, `${peak.name} is named one rung after its dot`);
  }
  // And a feature the file never named carries none: the coastline, which has
  // no name column at all, and the nameless rivers and lakes beside it.
  const coast = await read(BASE_DIR, 'coast', 'x2y2.json');
  assert.equal(coast.features.every((f) => f.properties.zl === undefined), true);
  for (const layer of ['rivers', 'lakes']) {
    const collection = await read(BASE_DIR, `${layer}-world.json`);
    for (const feature of collection.features) {
      if (feature.properties.name !== undefined) continue;
      assert.equal(feature.properties.zl, undefined, `a nameless ${layer} feature carries no label zoom`);
    }
  }
});

test('a lake reaching two cells is the same lake in both, and is never clipped', async () => {
  // Amendment A2: a fill cut at a cell edge is a shore that does not exist,
  // so the polygon layers arrive whole in every cell their bbox overlaps and
  // M37 draws each once by its id.
  const input = await sources();
  const wide = {
    type: 'Feature',
    properties: {
      featurecla: 'Lake', scalerank: 2, min_zoom: 1, name: 'Fixture Sea', ne_id: 1159100099,
    },
    // -65 to -55 crosses the x1/x2 boundary at -60.
    geometry: { type: 'Polygon', coordinates: [[[-65, 10], [-55, 10], [-55, 20], [-65, 20], [-65, 10]]] },
  };
  const lakes = 'ne_10m_lakes.geojson';
  const plan = planImport({ ...input, [lakes]: { type: 'FeatureCollection', features: [...input[lakes].features, wide] } });
  const cells = plan.files.filter((entry) => entry.file.startsWith('base/lakes/'));
  const inCell = (key) => JSON.parse(cells.find((entry) => entry.file.endsWith(`${key}.json`)).text)
    .features.find((feature) => feature.properties.id === '1159100099');
  const west = inCell('x1y2');
  const east = inCell('x2y2');
  assert.ok(west && east, 'both cells its bbox overlaps have it');
  assert.deepEqual(west, east, 'the same feature, whole, not two halves');
  assert.deepEqual(west.geometry.coordinates[0][0], [-65, 10], 'nothing was cut at -60');
});

test('the far level keeps its name and its shape, and the near level is lines', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const land = JSON.parse(await readFile(path.join(dir, LAND_FILE), 'utf8'));
  assert.equal(land.type, 'FeatureCollection');
  for (const feature of land.features) {
    assert.ok(['Polygon', 'MultiPolygon'].includes(feature.geometry.type), 'the far coastline is still polygons');
    assert.deepEqual(feature.properties, {}, 'and land.js still reads nothing off it');
  }
  const cell = JSON.parse(await readFile(path.join(dir, BASE_DIR, 'coast', 'x2y2.json'), 'utf8'));
  for (const feature of cell.features) {
    assert.ok(['LineString', 'MultiLineString'].includes(feature.geometry.type), 'a cut edge is never part of a stroked ring');
    assert.equal(typeof feature.properties.z, 'number', 'every feature says what zoom it is worth drawing from');
  }
  const zs = cell.features.map((f) => f.properties.z);
  assert.deepEqual(zs, [...zs].sort((a, b) => a - b), 'sorted by z, so two builds write one file');
});

test('the Null island marker Natural Earth ships at 0,0 is drawn nowhere', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  assert.equal(existsSync(path.join(dir, BASE_DIR, 'coast', 'x3y2.json')), false, 'the cell east of Greenwich holds nothing');
  const land = await readFile(path.join(dir, LAND_FILE), 'utf8');
  assert.equal(land.includes('0.05'), false, 'and the marker is not in the far coastline either');
});

test('the cells cut the same coastline the world has, and no more', async () => {
  // Review finding 1's own test: every cell is cut out of one simplified
  // geometry, so the cells' line lengths come to the world's. A cell that
  // disagreed would be a shore that moves as the reader pans.
  const polygons = coastPolygons(await sources());
  const { byZ } = coastLines(polygons, { tolerance: 0.005 });
  const length = (line) => line.reduce((n, p, i) => (i === 0 ? 0 : n + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1])), 0);
  let world = 0;
  for (const lines of byZ.values()) for (const line of lines) world += length(line);
  let cells = 0;
  for (const key of allCells()) {
    const box = cellBounds(key);
    for (const [, lines] of byZ) {
      for (const line of lines) {
        for (const part of clipLine(line, box)) cells += length(part);
      }
    }
  }
  assert.ok(Math.abs(world - cells) < 1e-6, `the cells come to ${cells} and the world to ${world}`);
});

test('a second run rewrites every file byte for byte', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const first = new Map();
  for (const name of await filesUnder(dir)) first.set(name, await readFile(path.join(dir, ...name.split('/')), 'utf8'));
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  const second = new Map();
  for (const name of await filesUnder(dir)) second.set(name, await readFile(path.join(dir, ...name.split('/')), 'utf8'));
  assert.deepEqual([...second.keys()], [...first.keys()]);
  for (const [name, text] of first) assert.equal(second.get(name), text, `${name} is the same file`);
});

test('a cell that stops holding anything is removed, not left behind', async (t) => {
  const dir = await temporary(t);
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  // A cell from a run against other data: the manifest would not name it and
  // the directory and the manifest would then disagree about what the map has.
  await writeFile(path.join(dir, BASE_DIR, 'coast', 'x0y0.json'), '{"type":"FeatureCollection","features":[]}\n', 'utf8');
  await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  assert.equal(existsSync(path.join(dir, BASE_DIR, 'coast', 'x0y0.json')), false);
});

test('--check fails loudly on a source whose sha256 differs, and writes nothing', async (t) => {
  const dir = await temporary(t);
  const { code, said } = await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION, '--check']));
  assert.equal(code, 1);
  assert.match(said, /ne_10m_land\.geojson has sha256 [0-9a-f]{64}, not the [0-9a-f]{64}/);
  assert.match(said, /Nothing was written/);
  assert.deepEqual(await filesUnder(dir), [], 'not one file');
});

test('a missing source is a stop, and never a download', async (t) => {
  const dir = await temporary(t);
  const empty = await temporary(t);
  const { code, said } = await quiet(() => main(['--source', empty, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  assert.equal(code, 1);
  assert.match(said, /ne_10m_land\.geojson is not in/);
  assert.match(said, /committed, not downloaded/);
  assert.deepEqual(await filesUnder(dir), []);
});

test('--survey prints the keys a file actually has, and writes nothing', async (t) => {
  const dir = await temporary(t);
  const { code, said } = await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION, '--survey']));
  assert.equal(code, 0);
  assert.match(said, /## ne_10m_land\.geojson/);
  assert.match(said, /featurecla/);
  assert.match(said, /## ne_10m_populated_places\.geojson/, 'every committed file, not only the ones this run writes from');
  assert.deepEqual(await filesUnder(dir), []);
});

test('--budget prints the tolerance, the points kept and the points dropped', async (t) => {
  const dir = await temporary(t);
  const { code, said } = await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION, '--budget']));
  assert.equal(code, 0);
  assert.match(said, /tolerance.*points kept.*points dropped/);
  assert.match(said, /coast\s+far/);
  assert.match(said, /coast\s+near/);
  assert.match(said, /base map .* of the .* ceiling/);
  assert.match(said, /data\/geo .* of the .* ceiling/);
});

test('a level that cannot fit its cap is a stop, and says so', async () => {
  // The pure half, where the caps are an argument: the ladder is walked to
  // its coarsest rung and the level is still over, which is a problem the
  // plan carries and not a silent trim.
  const plan = planImport(await sources(), { caps: { coast: { far: 10, near: 10 } } });
  assert.equal(plan.problems.length, 2);
  assert.match(plan.problems[0], /the far level is \d+ bytes at the coarsest tolerance on the ladder, over its 10-byte cap/);
  assert.match(plan.problems[1], /the near level is \d+ bytes/);
});

test('a run that would cross a ceiling exits non-zero and writes nothing', async (t) => {
  const dir = await temporary(t);
  // data/geo/ is already at the ceiling before this run starts. The tool
  // measures what is there, adds what it would write, and refuses.
  await mkdir(path.join(dir, 'presences'), { recursive: true });
  await writeFile(path.join(dir, 'presences', 'ballast.json'), 'x'.repeat(GEO_CEILING + 1), 'utf8');
  const before = await filesUnder(dir);
  const { code, said } = await quiet(() => main(['--source', FIXTURES, '--data', FIXTURE_DATA, '--out', dir, ...ELEVATION]));
  assert.equal(code, 1);
  assert.match(said, /data\/geo\/ would be .*, over the .* ceiling/);
  assert.match(said, /Nothing was written/);
  assert.deepEqual(await filesUnder(dir), before, 'the directory is as it was');
});

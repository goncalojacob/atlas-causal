// M45b: the elevation bands.
//
// The half `node --test` can hold without a browser — what the grid says, what
// the bands are, what the import wrote and what it refuses to write. The
// pictures are `tests/m45b-browser.test.mjs` and `docs/screens/m45b-*.png`.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **Nothing here pins a byte count.** What is asserted is that the committed
// files are inside the ceilings the brief sets and that the numbers in
// STATUS.md are the numbers on disk — never a number that the next tolerance
// would make false. The one number that is pinned is the five band edges,
// which are frozen on purpose and which this file exists to freeze.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir, rm, stat, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

import {
  BAND_EDGES, GRID, GRID_BYTES, bandOf, bandGeometry, contour, readGrid, reliefCollection,
} from '../tools/import/elevation.mjs';
import { ELEVATION_SOURCE, layer } from '../tools/import/features.mjs';
import {
  ELEVATION_SHA256, VENDOR_ELEVATION, loadElevation, main, ownCeilings,
} from '../tools/import/naturalearth.mjs';
import { LAYERS, DEFAULT_LAYERS, defaultState, formatState, parseState } from '../src/state.js';
import { ROOT } from './helpers.mjs';

const VENDOR = path.join(ROOT, ...VENDOR_ELEVATION.split('/'));
const DATA_GEO = path.join(ROOT, 'data', 'geo');
const RELIEF_DIR = path.join(DATA_GEO, 'base', 'relief');

const manifest = JSON.parse(await readFile(path.join(ROOT, 'data', 'index', 'manifest.json'), 'utf8'));
const relief = (manifest.base?.layers ?? []).find((l) => l.id === 'relief') ?? null;

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

// ─── 1. the bands are frozen ───────────────────────────────────────────────
//
// The brief's first test. The edges were fixed before any tint was chosen, so
// that nobody tunes the bands to make a picture; this is what makes moving one
// a deliberate act rather than a tweak.

test('the five band edges are the brief\'s, in the module and in the manifest', () => {
  assert.deepEqual([...BAND_EDGES], [0, 200, 500, 1000, 2000]);
  assert.ok(relief, 'the manifest carries a relief layer');
  assert.deepEqual(relief.bands, [0, 200, 500, 1000, 2000],
    'the manifest says what the tints mean, and it says what the contouring used');
  // Below sea level is not a band: the lowest edge is 0 and a depression is a
  // `physical` feature, drawn as a hollow by M45a.
  assert.equal(bandOf(-1), -1);
  assert.equal(bandOf(-416), -1, 'the Dead Sea is in no band');
  assert.equal(bandOf(0), 0);
  assert.equal(bandOf(199), 0);
  assert.equal(bandOf(200), 1);
  assert.equal(bandOf(8848), 4, 'and the top band has no ceiling');
});

// ─── 2. the grid, as the file says it is ───────────────────────────────────

test('the committed grid is the one this import was written against', async () => {
  const { digest, collection, problem } = await loadElevation(VENDOR);
  assert.equal(problem, null, 'the sha256 of the decompressed bytes is the one in vendor/SHA256SUMS');
  assert.equal(digest, ELEVATION_SHA256);
  assert.equal(collection.features.length, BAND_EDGES.length, 'one feature per band');
});

test('the grid is read as node registration, which is what vendor/README.md was checked with', async () => {
  const bytes = gunzipSync(await readFile(path.join(VENDOR, `${ELEVATION_SOURCE}.gz`)));
  assert.equal(bytes.length, GRID_BYTES);
  const grid = readGrid(bytes);
  // Through the padded frame the contouring works in: column 1 is at 180° W,
  // row 1 at 90° N, one cell is 10 arc-minutes.
  const at = (lon, lat) => grid.at(Math.round((90 - lat) * 6) + 1, Math.round((lon + 180) * 6) + 1);
  // `vendor/README.md`'s own spot checks, which is what says the half-cell
  // reading is not the one the file was written with.
  assert.equal(at(88, 33), 5143, 'the Tibetan plateau');
  assert.equal(at(-68, -16), 2362, 'the Andes at 16° S');
  assert.equal(at(142, 11), -6792, 'the Mariana Trench');
  assert.equal(at(180, 0), -5228, 'the mid-Pacific');
  // The two copies of the antimeridian are the same meridian and carry the
  // same ground, which is what keeps a band from stopping short of it.
  assert.equal(at(180, 0), at(-180, 0));
});

test('a grid that is not the committed one is refused under --check', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-elev-wrong-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  // The right shape and the wrong ground: an ocean planet.
  await writeFile(path.join(dir, `${ELEVATION_SOURCE}.gz`),
    gzipSync(Buffer.from(new Int16Array(GRID.columns * GRID.rows).fill(-1000).buffer)));
  const { problem, collection } = await loadElevation(dir);
  assert.ok(problem?.includes('sha256'), `the reader says which: ${problem}`);
  assert.ok(collection, 'and still hands back what it read, for the caller to refuse');

  const out = await mkdtemp(path.join(tmpdir(), 'atlas-elev-out-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  const run = await quiet(() => main([
    '--source', path.join(ROOT, 'tests', 'fixtures', 'naturalearth'),
    '--data', path.join(ROOT, 'tests', 'fixtures', 'data'),
    '--out', out, '--elevation', dir, '--check',
  ]));
  assert.equal(run.code, 1, '--check refuses to write anything');
  assert.match(run.said, /Nothing was written/);
  assert.deepEqual(existsSync(path.join(out, 'base', 'relief')), false);
});

test('a missing grid stops the run, and nothing downloads one', async (t) => {
  const empty = await mkdtemp(path.join(tmpdir(), 'atlas-elev-none-'));
  t.after(() => rm(empty, { recursive: true, force: true }));
  const { problem, collection } = await loadElevation(empty);
  assert.equal(collection, null);
  assert.match(problem, /is not in/);
  // And there is no `fetch` anywhere in the two modules that read it: the grid
  // is committed, and a run that could reach the network is a run that could
  // import something nobody committed (M45b §2.1).
  for (const file of ['tools/import/elevation.mjs', 'tools/import/naturalearth.mjs']) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    assert.ok(!/\bfetch\s*\(/.test(source), `${file} makes no request`);
  }
});

// ─── 3. what a band is ─────────────────────────────────────────────────────

test('a contour closes, and a band is its own edge plus the next one up', () => {
  // A field with one plateau in it: a small grid would be a different
  // function, so this is the real shape with one bump in it.
  const grid = readGrid(Buffer.from(syntheticGrid().buffer));
  const rings = contour(grid, 200);
  assert.ok(rings.length > 0, 'the plateau has an outline');
  for (const ring of rings) {
    assert.ok(ring.length >= 4, 'a ring is at least a triangle and its closing repeat');
    assert.deepEqual(ring[0], ring[ring.length - 1], 'and it closes');
  }
  // The band between two edges is drawn even-odd: its own rings and the rings
  // of the edge above, each as a polygon of its own, so the higher ground is a
  // hole rather than a second fill over the first.
  const above = contour(grid, 1000);
  const band = bandGeometry(rings, above);
  assert.equal(band.type, 'MultiPolygon');
  assert.equal(band.coordinates.length, rings.length + above.length);
  for (const polygon of band.coordinates) {
    assert.equal(polygon.length, 1, 'one ring per polygon: the hole is the fill rule, not the nesting');
  }
  // And the top band, which has no edge above it.
  assert.equal(bandGeometry(above, null).coordinates.length, above.length);
});

test('the collection is one feature per band, lowest first, and says nothing about the past', () => {
  const collection = reliefCollection(readGrid(Buffer.from(syntheticGrid().buffer)));
  assert.equal(collection.features.length, BAND_EDGES.length);
  collection.features.forEach((feature, i) => {
    assert.equal(feature.properties.band, i);
    assert.equal(feature.properties.from, BAND_EDGES[i]);
    assert.equal(feature.properties.to, BAND_EDGES[i + 1] ?? null);
    // Nothing else: a band has no name, no id, no date and no source. Elevation
    // is geography, and this milestone writes no historical claim.
    assert.deepEqual(Object.keys(feature.properties).sort(), ['band', 'from', 'min_zoom', 'to']);
  });
});

// One plateau at 20° N, 30° W, stepped through every band, on the real grid's
// shape — the format has no header, so there is no smaller grid to have.
function syntheticGrid() {
  const grid = new Int16Array(GRID.columns * GRID.rows).fill(-1000);
  const at = (lat, lon) => Math.round((90 - lat) * 6) * GRID.columns
    + (Math.round((((lon % 360) + 360) % 360) * 6) % GRID.columns);
  const steps = [[3, 3000], [6, 1500], [12, 750], [18, 350], [24, 100]];
  for (let dy = -24; dy <= 24; dy += 1) {
    for (let dx = -24; dx <= 24; dx += 1) {
      const step = steps.find(([radius]) => Math.hypot(dy, dx) <= radius);
      if (step) grid[at(20 + dy / 6, -30 + dx / 6)] = step[1];
    }
  }
  return grid;
}

// ─── 4. the layer, as the rest of the atlas sees it ────────────────────────

test('relief is a base layer like any other, with a ceiling of its own', () => {
  const row = layer('relief');
  assert.equal(row.geometry, 'polygon');
  assert.equal(row.minZoom, 1, 'the ground is drawn at every zoom the map has');
  assert.equal(row.clip, true, 'a band is one feature for the world, so a cell holds its own piece');
  assert.equal(row.ceiling, 6 * 1024 * 1024, "M45b §2.5's 6 MB, and the owner has not moved it");
  // It is first in the table, which is the order the manifest lists it in and
  // the order the map hangs the groups in: under everything.
  assert.equal(manifest.base.layers[0].id, 'relief');
  // And it is the only layer counted against a ceiling of its own.
  assert.deepEqual(ownCeilings().map((r) => r.id), ['relief']);
});

test('relief is off by default, and in the link when it is on', () => {
  assert.ok(LAYERS.includes('relief'), 'it is a member, so every ?layers= list can name it');
  assert.ok(!DEFAULT_LAYERS.includes('relief'), 'and it is not on at rest');
  assert.deepEqual(defaultState().layers, [...DEFAULT_LAYERS]);
  // At rest the link says nothing about the layers at all.
  assert.equal(formatState(defaultState()).includes('layers='), false);
  // Switched on, it is in the link — which is the whole of "a link is the
  // picture its sender saw".
  const on = { ...defaultState(), layers: [...LAYERS] };
  assert.ok(formatState(on).includes('relief'));
  // And it comes back off the other end.
  assert.ok(parseState(formatState(on)).layers.includes('relief'));
  assert.ok(!parseState('?layers=land,territories,events').layers.includes('relief'),
    'a link naming a subset means these and nothing else');
});

// ─── 5. what is on disk, measured and not typed ────────────────────────────

test('the committed bands are inside their own ceiling and inside data/geo/', async () => {
  const cells = (await readdir(RELIEF_DIR)).filter((n) => n.endsWith('.json'));
  assert.ok(cells.length > 0, 'the cells are committed');
  let own = (await stat(path.join(DATA_GEO, 'base', 'relief-world.json'))).size;
  for (const name of cells) own += (await stat(path.join(RELIEF_DIR, name))).size;
  assert.ok(own <= layer('relief').ceiling,
    `the bands are ${(own / 1024 / 1024).toFixed(2)} MB, over their own ceiling`);
  // The base map's own 8 MB is **without** them, which is what "outside the
  // base map's 8 MB" means: they are not counted twice and not counted there.
  const base = await directoryBytes(path.join(DATA_GEO, 'base'));
  assert.ok(base - own <= 8 * 1024 * 1024, 'and the base map is still inside its 8 MB without them');
  assert.ok(await directoryBytes(DATA_GEO) <= 24 * 1024 * 1024, 'and data/geo/ inside its 24 MB');
});

test('the budget table in STATUS.md is the bytes on disk, rounded and not typed', async () => {
  const status = await readFile(path.join(ROOT, 'STATUS.md'), 'utf8');
  const cells = (await readdir(RELIEF_DIR)).filter((n) => n.endsWith('.json'));
  let own = (await stat(path.join(DATA_GEO, 'base', 'relief-world.json'))).size;
  for (const name of cells) own += (await stat(path.join(RELIEF_DIR, name))).size;
  // What STATUS.md says the bands come to, read back out of it. The number is
  // in the document because a reader needs it; it is checked here because a
  // number in a document that nothing checks is a number that goes stale.
  const said = status.match(/the bands come to ([\d.]+) MB of their own 6 MB/);
  assert.ok(said, "STATUS.md says what the bands come to");
  assert.equal(Number(said[1]).toFixed(2), (own / 1024 / 1024).toFixed(2),
    'and it is the total of the files on disk');
});

test('every cell the manifest names is on disk, with the bytes it claims', async () => {
  for (const cell of relief.cells) {
    const file = path.join(ROOT, 'data', ...cell.file.split('/'));
    assert.ok(existsSync(file), `${cell.file} is named by the manifest and is not there`);
    assert.equal((await stat(file)).size, cell.bytes, `${cell.file}: the manifest counted it`);
  }
  assert.ok(existsSync(path.join(ROOT, 'data', ...relief.world.split('/'))), 'and the far file');
});

async function directoryBytes(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    total += entry.isDirectory() ? await directoryBytes(file) : (await stat(file)).size;
  }
  return total;
}

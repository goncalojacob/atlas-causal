#!/usr/bin/env node
// Natural Earth 10 m → the base map's data. Offline, zero dependencies,
// idempotent: the same bytes on a second run over the same inputs.
//
//   node tools/import/naturalearth.mjs --source vendor/natural-earth/10m \
//        [--data <dir>] [--out <dir>] [--budget] [--survey] [--check] [--base-only]
//
// This tool draws nothing. It turns the committed 10 m GeoJSON into the
// sharded, simplified, quantised geometry M37 will read: one file for the
// whole world per layer at the **far** level, which is what a reader sees
// before a cell arrives, and one file per grid cell at the **near** level,
// fetched as the viewport enters it.
//
// **There is no network here, ever.** No fetch, no curl, no "if the file is
// missing, get it": a missing or altered input is a stop, and the run says
// which file (brief §0). The sources are committed under vendor/, gzipped,
// and read through tools/import/source.mjs, which gunzips them and hashes the
// **decompressed** bytes — the file as it was downloaded, which is what
// vendor/SHA256SUMS records and what --check verifies (M36 review, A0).
//
// `coast` is the layer with a shape of its own and it is built here. Its far
// level is data/geo/land-present.json — the same name, the same shape and the
// same manifest key the 110 m coastline had, because src/map/layers/land.js
// is not touched by this run and loadAtlas already fetches it at first paint.
// Its near level is data/geo/base/coast/<cell>.json, and it is **lines**: a
// polygon clipped to a cell is filled and stroked, and .land's cobalt stroke
// would then draw a straight line across a continent at every cell border
// (M36 review, F1/A2).
//
// The other four — `rivers`, `lakes`, `physical` and `mountains`, added by
// M36b — are all one shape and are built by tools/import/layers.mjs, which is
// what M36c's cities will be built by too.

import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { canonical } from '../build-index.mjs';
import { readRecords } from '../lib/read.mjs';
import { readSource } from './source.mjs';
import { clipToBox, splitAtMeridian } from './geometry.mjs';
import { keepRing, simplifyArc, simplifyLine } from './simplify.mjs';
import { GRID, allCells, cellBounds } from './grid.mjs';
import {
  BASE_SOURCE, BASE_VERSION, LAYERS, PROPERTIES, kept, layerSources, surveyProperties,
  surveyShape, zFor,
} from './features.mjs';
import {
  cellValues, readLayer, sourcePoints, takeLayer, valuePoints, worldValue,
} from './layers.mjs';
import {
  CITIES_SOURCE, PLACES_DOC, PLACES_FILE, handEntries, matchPlaces, placesDocument, placesFile,
} from './places.mjs';
import { SEAM } from '../../src/map/projection.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
export const VENDOR_10M = 'vendor/natural-earth/10m';

// --- what was imported, exactly ------------------------------------------

// The two the manifest's `base` block carries, kept in features.mjs so that
// tools/lib/read.mjs can read them without importing this file.
export const SOURCE_ID = BASE_SOURCE;
export const NATURAL_EARTH_VERSION = BASE_VERSION;
export const SOURCE_BASE = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_VERSION}/geojson/`;

// sha256 of each file **decompressed**, taken from vendor/SHA256SUMS, which
// is what the owner's assistant recorded when it downloaded them. --check
// refuses to write on a mismatch; without it the tool warns, loudly, and
// carries on, exactly as build-regions.mjs and cshapes.mjs do.
export const SOURCE_SHA256 = Object.freeze({
  'ne_10m_land.geojson': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416',
  'ne_10m_minor_islands.geojson': '8c933ca7a4760256bdc46408355706e39764b0fa01c160c28888b90b4faec29f',
  'ne_10m_rivers_lake_centerlines.geojson': 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a',
  'ne_10m_lakes.geojson': '2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9',
  'ne_10m_geography_regions_polys.geojson': 'b7b26e50ea917d3696aec87f932def2bf5f890f5770e441d59c162c6f4c92a77',
  'ne_10m_geography_regions_elevation_points.geojson': 'f98a16867867146ec4146d6d4b18c823eeedb2825947de666116cf9a4e3f43cb',
  'ne_10m_populated_places.geojson': '9b8e3de09048ef00dfc70357dbb9fa324493f214b5e0ae4daf1aa79a8d10116b',
});

// Three decimals is about 110 m on the ground, which is finer than any
// tolerance below and is what the CShapes shards are already written at.
export const DECIMALS = 3;

// A ring that simplification left as a sliver is a line and not an island.
//
// The far level needs a second, much larger floor, and it is what actually
// decides whether the coastline fits its 200 KB: the polygon *count* is the
// floor under the bytes, because a ring can never be fewer than four points
// however coarse the tolerance, and the 10 m land is 6,837 polygons. At
// 0.007 square degrees — about 85 km² — 1,471 of them survive, which is what
// the ladder can then fit at 0.4°, and it is chosen to be the smallest floor
// that leaves the ladder room: Malta (0.026), Bahrain (0.06), Madeira, Santa
// Maria and Graciosa in the Azores, Santiago in Cape Verde, Barbados and
// Bermuda are all above it, and what it drops is smaller than about 85 km² —
// Corvo, at 17, and the Maldives' outer atolls among them. That is the price
// of a whole world in 200 KB, and STATUS.md says so rather than the run
// pretending 10 m costs nothing.
export const MIN_AREA = 1e-6;
export const FAR_MIN_AREA = 0.007;

// The ladder a level's tolerance is stepped up. "Near = full detail" cannot
// fit the caps — at three decimals a full-detail near coast is about 7.1 MB
// against a cap of 2,600 KB (M36 review, F3) — so the tolerance of each level
// is **whatever its cap forces**, found by walking this ladder from the
// level's own start until the bytes fit, and printed by --budget beside the
// points kept and the points dropped. Nothing is silently trimmed.
export const TOLERANCES = Object.freeze([
  0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.075,
  0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1,
]);
export const NEAR_START = 0.005;
// The far level starts further up the ladder rather than walking eleven
// rungs it can never fit at: the whole world in 200 KB is a tenth of what
// even 0.05° comes to.
export const FAR_START = 0.05;

// Bytes. Per layer and per level (brief §5), raw and not gzipped — Pages
// serves these gzipped and a reader downloads about a third, but the cap is
// about what is in the repository and what the deploy artifact carries.
export const CAPS = Object.freeze({
  coast: Object.freeze({ far: 200 * 1024, near: 2600 * 1024 }),
  rivers: Object.freeze({ far: 200 * 1024, near: 1200 * 1024 }),
  lakes: Object.freeze({ far: 150 * 1024, near: 700 * 1024 }),
  physical: Object.freeze({ far: 250 * 1024, near: 750 * 1024 }),
  mountains: Object.freeze({ far: 100 * 1024, near: 350 * 1024 }),
});

// What the far level of each layer drops for being too small to see at the
// world, in the unit the layer is measured in: square degrees for a polygon
// layer, degrees of length for a line one. Zero is no floor.
//
// It is the same argument `FAR_MIN_AREA` is for the coastline (deviation
// 605), and it is what actually decides whether a layer fits its far cap: a
// Feature is about ninety bytes of scaffolding before a coordinate and a ring
// can never be fewer than four points, so the feature *count* is the floor
// under the bytes and no tolerance alone gets beneath it. Each is the smallest
// round number that leaves the tolerance ladder room, and what each one drops
// is in STATUS.md and in data/geo/LICENSE rather than left for a reader to
// discover by not finding a lake.
//
// Nothing is floored at the near level: a cell is where the small things are,
// and a reader who has fetched one has asked for them.
// Measured, at the tolerance each one then fits at:
//
//   rivers   1.9 degrees of length   978 of 1,455 at 0.4 degrees, 196.5 KB
//   lakes    0.05 square degrees     434 of 1,355 at 0.15,        134.8 KB
//   physical none                    543 of 544   at 0.25,        237.2 KB
//   mountains none                   711 of 711, and no tolerance
//
// The rivers' floor is 1.9 and not the rounder 2 for one reason, and it is
// this atlas's: the **Tejo** is 1.912 degrees long and 2 would drop it from
// the world view. An atlas of Portuguese expansion whose far map has no river
// at Lisbon is wrong in a way no byte count excuses. It costs 3.5 KB of the
// 200 and 0.4 degrees is the coastline's own far tolerance, so it costs
// nothing else.
export const FAR_FLOORS = Object.freeze({
  rivers: 1.9,
  lakes: 0.05,
  physical: 0,
  mountains: 0,
});

// The two ceilings the tool refuses to cross (M36 review, A9). The base map
// is data/geo/base/ alone; the second is everything under data/geo/, which is
// what deploy.yml copies into the artifact and so what a reader and the free
// hosting actually see.
export const BASE_CEILING = 8 * 1024 * 1024;
export const GEO_CEILING = 24 * 1024 * 1024;

export const BASE_DIR = 'base';
export const LAND_FILE = 'land-present.json';

// Compact, not indented, keys sorted: what build-regions.mjs and cshapes.mjs
// write their geometry with. Coordinate arrays are three times the size when
// pretty-printed and nobody reads them in a diff.
export function serializeGeo(value) {
  return `${JSON.stringify(canonical(value))}\n`;
}

const bytesOf = (text) => Buffer.byteLength(text, 'utf8');

// --- the coast, read once ------------------------------------------------

const polygonsOf = (geometry) => (geometry?.type === 'Polygon' ? [geometry.coordinates]
  : geometry?.type === 'MultiPolygon' ? geometry.coordinates : []);

// Every polygon of the coast sources, each with the `z` it is drawn from and
// whether the far level wants it. One pass, in file order and then feature
// order and then polygon order, so the plan is the same list every run.
//
// `z` is computed **per polygon** and not per feature, because one feature of
// ne_10m_land carries 2,773 polygons and no scale rank at all: the fallback
// rule measures the polygon in front of it, so a speck is not drawn at the
// world because the continent in the same feature is.
export function coastPolygons(sources) {
  const table = PROPERTIES.coast;
  const out = [];
  let group = 0;
  for (const source of layerSources('coast')) {
    const collection = sources[source.file];
    if (!collection) continue;
    for (const feature of collection.features ?? []) {
      group += 1;
      if (!kept(table, feature?.properties ?? {})) continue;
      for (const rings of polygonsOf(feature.geometry)) {
        const geometry = { type: 'Polygon', coordinates: rings };
        out.push({ rings, group, z: zFor(table, feature.properties ?? {}, geometry), far: source.far });
      }
    }
  }
  return out;
}

// Which files a layer reads, and which of them the far level draws from: the
// layer table's own, re-exported here because this is where a reader of the
// import looks for it.
export { layerSources };

// --- the far level: data/geo/land-present.json ---------------------------
//
// It keeps its name, its shape and its manifest key: a FeatureCollection of
// polygon features, `readLandFiles` still finds it by the land-<epoch>.json
// pattern, and src/map/layers/land.js is untouched by this run. What changes
// is the contents — 10 m instead of 110 m, which puts back the small islands
// 110 m drops.
export function buildFar(polygons, { tolerance, decimals = DECIMALS, minArea = FAR_MIN_AREA, seam = SEAM }) {
  // Grouped back into the source features they came from, because that is the
  // shape land-present.json has always had — and because a Feature per
  // polygon would cost fifty bytes of scaffolding apiece, which over the
  // twelve hundred polygons that survive is a third of the whole cap.
  const groups = new Map();
  let dropped = 0;
  for (const polygon of polygons) {
    if (!polygon.far) continue;
    const outer = keepRing(simplifyArc(polygon.rings[0] ?? [], { tolerance, decimals }), minArea);
    if (!outer) {
      dropped += 1;
      continue;
    }
    const rings = [outer];
    for (const hole of polygon.rings.slice(1)) {
      const ring = keepRing(simplifyArc(hole, { tolerance, decimals }), minArea);
      if (ring) rings.push(ring);
    }
    if (!groups.has(polygon.group)) groups.set(polygon.group, []);
    groups.get(polygon.group).push(rings);
  }
  // Cut at the seam, so that nothing the map draws crosses the one meridian
  // that is the left edge of the picture and the right edge at once.
  const features = [];
  for (const [, kept3] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const geometry = kept3.length === 1
      ? { type: 'Polygon', coordinates: kept3[0] }
      : { type: 'MultiPolygon', coordinates: kept3 };
    const cut = splitAtMeridian(geometry, seam, { minArea: MIN_AREA });
    if (cut) features.push({ type: 'Feature', properties: {}, geometry: cut });
  }
  return { collection: { type: 'FeatureCollection', features }, dropped };
}

// --- the near level: one file per non-empty cell -------------------------

// The world's coastline as lines, simplified once and cut at the seam once,
// before any cell sees it. Simplifying before clipping is what makes the
// union of the cells equal to the world: every cell is cut out of the same
// geometry, so no two cells disagree about where the shore is and no point
// exists in one that does not exist in the other.
export function coastLines(polygons, { tolerance, decimals = DECIMALS, seam = SEAM }) {
  const byZ = new Map();
  let before = 0;
  let after = 0;
  for (const polygon of polygons) {
    for (const ring of polygon.rings) {
      before += ring.length;
      // The ring is taken down as an open line, its closing repeat and all:
      // an island wholly inside a cell is a closed shore, not a shore with a
      // gap in it, and the repeat is what closes the stroke.
      const taken = simplifyLine(ring, { tolerance, decimals });
      if (taken.length < 2) continue;
      const cut = splitAtMeridian({ type: 'LineString', coordinates: taken }, seam);
      if (!cut) continue;
      const lines = cut.type === 'LineString' ? [cut.coordinates] : cut.coordinates;
      if (!byZ.has(polygon.z)) byZ.set(polygon.z, []);
      for (const line of lines) {
        if (line.length < 2) continue;
        byZ.get(polygon.z).push(line);
        after += line.length;
      }
    }
  }
  return { byZ: new Map([...byZ.entries()].sort((a, b) => a[0] - b[0])), points: after, dropped: Math.max(before - after, 0) };
}

// One cell's file, or null when nothing of the layer is in it. **A cell with
// nothing in it is not written and is not in the manifest**: nothing is drawn
// that has no data, and an empty ocean cell is not worth a file and a request
// (deviation 519).
export function cellCollection(byZ, box) {
  const features = [];
  for (const [z, lines] of byZ) {
    const clipped = [];
    for (const line of lines) {
      const piece = clipToBox({ type: 'LineString', coordinates: line }, box);
      if (!piece) continue;
      if (piece.type === 'LineString') clipped.push(piece.coordinates);
      else for (const part of piece.coordinates) clipped.push(part);
    }
    if (clipped.length === 0) continue;
    features.push({
      type: 'Feature',
      properties: { z },
      geometry: clipped.length === 1
        ? { type: 'LineString', coordinates: clipped[0] }
        : { type: 'MultiLineString', coordinates: clipped },
    });
  }
  return features.length ? { type: 'FeatureCollection', features } : null;
}

function countLinePoints(collection) {
  let n = 0;
  for (const feature of collection.features) {
    const lines = feature.geometry.type === 'LineString' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const line of lines) n += line.length;
  }
  return n;
}

// --- stepping the tolerance until the cap holds --------------------------

// The first rung of the ladder at or above `start` whose output fits `cap`,
// with what it cost. `build(tolerance)` returns { bytes, ... }. Returns null
// when the whole ladder is over the cap, which is a stop and not a trim.
export function fitToCap(build, { cap, start, ladder = TOLERANCES }) {
  const rungs = ladder.filter((t) => t >= start);
  let last = null;
  for (const tolerance of rungs) {
    const attempt = { tolerance, ...build(tolerance) };
    last = attempt;
    if (attempt.bytes <= cap) return attempt;
  }
  return { ...last, over: true };
}

// --- one layer that is not the coast -------------------------------------

// The four layers M36b added and the cities M36c will add are all one shape:
// a file of Features (or of small objects, for a point layer) at the far
// level, and the same features again per cell at the near level, each
// carrying the `z` it is drawn from and, where the file gives one, the `id`
// M37 draws it once by. The coastline is the exception and keeps its own two
// functions above: its far level is `land-present.json`, which has a shape of
// its own to keep, and its near level is one feature per `z` because the
// shore has no identity to carry.
//
// → { files, rows, problems }, all three of them the plan's own lists.
export function planLayer(layer, sources, {
  seam = SEAM, caps = CAPS, ladder = TOLERANCES, decimals = DECIMALS,
  nearStart = NEAR_START, farStart = FAR_START, floors = FAR_FLOORS,
} = {}) {
  const files = [];
  const rows = [];
  const problems = [];
  const { features, dropped } = readLayer(layer.id, sources);
  const cap = caps[layer.id] ?? { far: Infinity, near: Infinity };
  const source = sourcePoints(features);
  const floor = floors[layer.id] ?? 0;
  const points = layer.geometry === 'point';
  const lost = dropped.length ? `, ${dropped.length} dropped for no name` : '';

  // The far level: one file for the whole world, which is what a reader sees
  // before a cell arrives.
  const buildFar = (tolerance) => {
    const built = takeLayer(layer, features, {
      tolerance, decimals, minArea: MIN_AREA, seam, floor, splitArea: MIN_AREA,
    });
    const text = serializeGeo(worldValue(layer, built.taken));
    return { bytes: bytesOf(text), text, points: built.points, features: built.taken.length, belowFloor: built.belowFloor };
  };
  // A point has no tolerance: there is nothing along it to take off, and a
  // printed "0.05°" would be a number the file does not depend on.
  const far = points
    ? { tolerance: null, ...buildFar(0) }
    : fitToCap(buildFar, { cap: cap.far, start: farStart, ladder });
  if (far.bytes > cap.far) {
    problems.push(`${layer.id}: the far level is ${far.bytes} bytes at the coarsest tolerance on the ladder, over its ${cap.far}-byte cap`);
  }
  files.push({ file: layer.world.slice('geo/'.length), text: far.text, bytes: far.bytes });
  rows.push({
    layer: layer.id,
    level: 'far',
    file: layer.world,
    tolerance: far.tolerance,
    cap: cap.far,
    bytes: far.bytes,
    kept: far.points,
    dropped: Math.max(source - far.points, 0),
    note: `${far.features} of ${features.length} features, ${far.belowFloor} under ${floor}${lost}`,
  });

  // The near level: one file per non-empty cell, all of them under one cap,
  // because a tolerance is a property of the layer and not of a cell.
  const buildNear = (tolerance) => {
    const built = takeLayer(layer, features, {
      tolerance, decimals, minArea: MIN_AREA, seam, floor: 0, splitArea: MIN_AREA,
    });
    const cells = [];
    let bytes = 0;
    let kept = 0;
    for (const { key, value } of cellValues(layer, built.taken)) {
      const text = serializeGeo(value);
      const size = bytesOf(text);
      bytes += size;
      kept += valuePoints(layer, value);
      cells.push({ key, file: `${BASE_DIR}/${layer.dir}/${key}.json`, text, bytes: size });
    }
    return { bytes, cells, points: kept, worldPoints: built.points, features: built.taken.length };
  };
  const near = points
    ? { tolerance: null, ...buildNear(0) }
    : fitToCap(buildNear, { cap: cap.near, start: nearStart, ladder });
  if (near.bytes > cap.near) {
    problems.push(`${layer.id}: the near level is ${near.bytes} bytes at the coarsest tolerance on the ladder, over its ${cap.near}-byte cap`);
  }
  for (const cell of near.cells) files.push({ file: cell.file, text: cell.text, bytes: cell.bytes });
  rows.push({
    layer: layer.id,
    level: 'near',
    file: `${BASE_DIR}/${layer.dir}/`,
    tolerance: near.tolerance,
    cap: cap.near,
    bytes: near.bytes,
    kept: near.points,
    dropped: Math.max(source - near.worldPoints, 0),
    note: `${near.cells.length} of ${GRID.columns * GRID.rows} cells${layer.clip ? '' : ', whole features by bbox'}`,
    cells: near.cells.map(({ key, file, bytes }) => ({ key, file, bytes })),
  });

  return { files, rows, problems };
}

// --- the plan ------------------------------------------------------------

// The whole import, computed and not written: a pure function of the parsed
// sources. Nothing here touches the disk, so a test can hold two plans over
// the same input against each other and a run can print the budget before it
// has written a byte.
//
// → { files: [{ file, text, bytes }], layers: [budget rows], problems: [] }
export function planImport(sources, {
  seam = SEAM, caps = CAPS, ladder = TOLERANCES, decimals = DECIMALS,
  nearStart = NEAR_START, farStart = FAR_START, minArea = FAR_MIN_AREA,
  floors = FAR_FLOORS,
} = {}) {
  const files = [];
  const layers = [];
  const problems = [];

  for (const layer of LAYERS) {
    if (layer.id !== 'coast') {
      const built = planLayer(layer, sources, { seam, caps, ladder, decimals, nearStart, farStart, floors });
      files.push(...built.files);
      layers.push(...built.rows);
      problems.push(...built.problems);
      continue;
    }
    const polygons = coastPolygons(sources);
    const cap = caps[layer.id] ?? { far: Infinity, near: Infinity };

    // The far level.
    const far = fitToCap((tolerance) => {
      const built = buildFar(polygons, { tolerance, decimals, minArea, seam });
      const text = serializeGeo(built.collection);
      let points = 0;
      for (const feature of built.collection.features) {
        for (const rings of polygonsOf(feature.geometry)) for (const ring of rings) points += ring.length;
      }
      let count = 0;
      for (const feature of built.collection.features) count += polygonsOf(feature.geometry).length;
      return { bytes: bytesOf(text), text, points, polygons: count, droppedPolygons: built.dropped };
    }, { cap: cap.far, start: farStart, ladder });
    const sourcePoints = polygons.filter((p) => p.far).reduce((n, p) => n + p.rings.reduce((m, r) => m + r.length, 0), 0);
    if (far.over) problems.push(`${layer.id}: the far level is ${far.bytes} bytes at the coarsest tolerance on the ladder, over its ${cap.far}-byte cap`);
    files.push({ file: LAND_FILE, text: far.text, bytes: far.bytes });
    layers.push({
      layer: layer.id,
      level: 'far',
      file: LAND_FILE,
      tolerance: far.tolerance,
      cap: cap.far,
      bytes: far.bytes,
      kept: far.points,
      dropped: Math.max(sourcePoints - far.points, 0),
      note: `${far.polygons} polygons, ${far.droppedPolygons} under ${minArea} square degrees`,
    });

    // The near level: one file per non-empty cell, all of them under one cap,
    // because a tolerance is a property of the layer and not of a cell —
    // a coarser Pacific and a finer Atlantic would be two coastlines.
    const near = fitToCap((tolerance) => {
      const { byZ, points, dropped } = coastLines(polygons, { tolerance, decimals, seam });
      const cells = [];
      let bytes = 0;
      let cellPoints = 0;
      for (const key of allCells()) {
        const collection = cellCollection(byZ, cellBounds(key));
        if (!collection) continue;
        const text = serializeGeo(collection);
        const size = bytesOf(text);
        bytes += size;
        cellPoints += countLinePoints(collection);
        cells.push({ key, file: `${BASE_DIR}/${layer.dir}/${key}.json`, text, bytes: size });
      }
      return { bytes, cells, points: cellPoints, worldPoints: points, dropped };
    }, { cap: cap.near, start: nearStart, ladder });
    if (near.over) problems.push(`${layer.id}: the near level is ${near.bytes} bytes at the coarsest tolerance on the ladder, over its ${cap.near}-byte cap`);
    for (const cell of near.cells) files.push({ file: cell.file, text: cell.text, bytes: cell.bytes });
    const nearSource = polygons.reduce((n, p) => n + p.rings.reduce((m, r) => m + r.length, 0), 0);
    layers.push({
      layer: layer.id,
      level: 'near',
      file: `${BASE_DIR}/${layer.dir}/`,
      tolerance: near.tolerance,
      cap: cap.near,
      bytes: near.bytes,
      kept: near.points,
      dropped: Math.max(nearSource - near.worldPoints, 0),
      note: `${near.cells.length} of ${GRID.columns * GRID.rows} cells`,
      cells: near.cells.map(({ key, file, bytes }) => ({ key, file, bytes })),
    });
  }

  return { files, layers, problems };
}

// --- reading the sources -------------------------------------------------

// One file from the source directory, gzipped or not, with what there is to
// say about it. The gzipped name is preferred where both are there, so the
// repository's own copy is what a run reads.
export async function loadSource(dir, name) {
  const plain = path.join(dir, name);
  const file = existsSync(plain) ? plain : `${plain}.gz`;
  if (!existsSync(file)) return { name, json: null, problem: `${name} is not in ${dir}` };
  const { bytes, digest } = await readSource(file);
  const expected = SOURCE_SHA256[name] ?? null;
  const problem = expected && digest !== expected
    ? `${name} has sha256 ${digest}, not the ${expected} this import was written against`
    : null;
  return { name, file, json: JSON.parse(bytes.toString('utf8')), digest, raw: bytes.length, problem };
}

// Every file the layers this tool writes actually need.
export function sourceNames() {
  const names = [];
  for (const layer of LAYERS) {
    for (const source of layerSources(layer.id)) if (!names.includes(source.file)) names.push(source.file);
  }
  return names;
}

// --- writing -------------------------------------------------------------

async function writePlan(geoDir, plan) {
  const written = [];
  for (const entry of plan.files) {
    const file = path.join(geoDir, ...entry.file.split('/'));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, entry.text, 'utf8');
    written.push(entry.file);
  }
  // A cell that used to hold something and no longer does is removed, or the
  // directory would keep a file the manifest does not name and the two would
  // disagree about what the map has.
  const planned = new Set(plan.files.map((entry) => entry.file));
  for (const layer of LAYERS) {
    const dir = path.join(geoDir, BASE_DIR, layer.dir);
    if (!existsSync(dir)) continue;
    for (const name of (await readdir(dir)).sort()) {
      if (!name.endsWith('.json')) continue;
      const relative = `${BASE_DIR}/${layer.dir}/${name}`;
      if (!planned.has(relative)) await unlink(path.join(dir, name));
    }
  }
  // And a far level whose layer is no longer written, for the same reason.
  const base = path.join(geoDir, BASE_DIR);
  if (existsSync(base)) {
    for (const name of (await readdir(base)).sort()) {
      if (!name.endsWith('-world.json')) continue;
      if (!planned.has(`${BASE_DIR}/${name}`)) await unlink(path.join(base, name));
    }
  }
  return written;
}

async function directoryBytes(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    total += entry.isDirectory() ? await directoryBytes(file) : (await stat(file)).size;
  }
  return total;
}

// --- the printers --------------------------------------------------------

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
// A point layer has no tolerance: there is nothing along a point to take off,
// and a number here would be one the file does not depend on.
const degrees = (t) => (t === null || t === undefined ? '—' : `${t}°`);

function printBudget(plan, { geoBytes, baseBytes }) {
  console.log('layer      level  tolerance        bytes          cap  points kept  points dropped  what');
  for (const row of plan.layers) {
    console.log([
      row.layer.padEnd(10),
      row.level.padEnd(6),
      degrees(row.tolerance).padStart(9),
      kb(row.bytes).padStart(13),
      kb(row.cap).padStart(13),
      String(row.kept).padStart(13),
      String(row.dropped).padStart(16),
      `  ${row.note}`,
    ].join(''));
  }
  console.log('');
  console.log(`base map  ${kb(baseBytes)} of the ${kb(BASE_CEILING)} ceiling`);
  console.log(`data/geo  ${kb(geoBytes)} of the ${kb(GEO_CEILING)} ceiling`);
}

function printSurvey(loaded) {
  for (const source of loaded) {
    if (!source.json) {
      console.log(`## ${source.name} — ${source.problem}`);
      continue;
    }
    const shape = surveyShape(source.json);
    console.log(`## ${source.name}`);
    console.log(`   ${shape.features} features, ${shape.types.join('/')}, ${shape.points} points, box ${shape.box?.join(' ') ?? '—'}`);
    console.log(`   sha256 ${source.digest}, ${source.raw} bytes decompressed`);
    for (const row of surveyProperties(source.json)) {
      const samples = row.samples.map((value) => JSON.stringify(value)).join(', ');
      console.log(`   ${row.key.padEnd(22)} ${String(row.present).padStart(7)}  ${samples}`);
    }
    console.log('');
  }
}

// --- which city is which place -------------------------------------------

// `--places`: the matching half of M36c, which writes
// data/imports/naturalearth-places.json and docs/naturalearth-places.md and
// no geometry at all. It is a mode of its own and not part of an import run
// for one reason: **the file is authored, not generated**. The matcher can
// prove two kinds of entry and no more, and everything else is for a person
// to decide; an import that rewrote the file every time it ran would delete
// that person's work the next night.
//
// So a run of this keeps every entry the matcher did not itself produce, and
// an ordinary import run only *reads* the committed file.
export async function writePlaces(dataDir, cities, { root = ROOT, existing = null } = {}) {
  const { entries: records } = await readRecords(dataDir);
  const places = records.filter((entry) => entry.kind === 'place').map((entry) => entry.record);
  const { entries, matched, unresolved } = matchPlaces(cities?.features ?? [], places);
  const hand = handEntries(existing, entries);
  const file = placesFile({ ...entries, ...hand }, { source: SOURCE_ID });
  const document = placesDocument({ matched, unresolved, hand, cities: (cities?.features ?? []).length });
  const filePath = path.join(dataDir, ...PLACES_FILE.split('/'));
  await mkdir(path.dirname(filePath), { recursive: true });
  // Two spaces and a trailing newline: a person reads and edits this one, so
  // it is written the way data/imports/cshapes-actors.json is and not the way
  // the geometry is.
  await writeFile(filePath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  await writeFile(path.join(root, ...PLACES_DOC.split('/')), document, 'utf8');
  return { file, document, matched, unresolved, hand };
}

// The committed mapping, as the import reads it: ne_id → place id. An empty
// map where the file is not there, which is what a dataset with no places of
// its own has, and never a stop: a city over the population floor is kept
// either way and only the atlas's own small places depend on this.
export async function readPlaces(dataDir) {
  const file = path.join(dataDir, ...PLACES_FILE.split('/'));
  if (!existsSync(file)) return new Map();
  const map = JSON.parse(await readFile(file, 'utf8'));
  const out = new Map();
  for (const [id, entry] of Object.entries(map?.entries ?? {})) {
    if (typeof entry?.place === 'string') out.set(String(id), entry.place);
  }
  return out;
}

// --- the command line ----------------------------------------------------

export async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let sourceDir = path.join(ROOT, ...VENDOR_10M.split('/'));
  let outDir = null;
  let check = false;
  let budget = false;
  let survey = false;
  // The far coastline is data/geo/land-present.json, which the fixtures do
  // not have one of — they borrow the real one under ?fixtures=1 — so writing
  // the fixture base map is this run without its far level. It is also what a
  // rerun that only wants the cells back asks for.
  let baseOnly = false;
  // The matching half, which writes data/imports/naturalearth-places.json and
  // docs/naturalearth-places.md and no geometry: a mode of its own because
  // that file is authored and an import run must never overwrite what a
  // person decided in it.
  let places = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--source') sourceDir = path.resolve(argv[++i]);
    else if (argv[i] === '--out') outDir = path.resolve(argv[++i]);
    else if (argv[i] === '--check') check = true;
    else if (argv[i] === '--budget') budget = true;
    else if (argv[i] === '--survey') survey = true;
    else if (argv[i] === '--base-only') baseOnly = true;
    else if (argv[i] === '--places') places = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const geoDir = outDir ?? path.join(dataDir, 'geo');

  // --survey reads every file in the directory and not only the ones this
  // run writes from: the table in features.mjs is read off all seven, and
  // M36b and M36c read it off the same page.
  const names = survey
    ? (await readdir(sourceDir)).sort().filter((n) => n.endsWith('.geojson') || n.endsWith('.geojson.gz')).map((n) => n.replace(/\.gz$/, ''))
    : places ? [CITIES_SOURCE] : sourceNames();
  const loaded = [];
  for (const name of names) loaded.push(await loadSource(sourceDir, name));

  const missing = loaded.filter((source) => !source.json);
  if (missing.length) {
    for (const source of missing) console.error(`error: ${source.problem}`);
    console.error('The sources are committed, not downloaded: see vendor/README.md. Nothing was written.');
    return 1;
  }
  for (const source of loaded) {
    if (!source.problem) continue;
    if (check) {
      console.error(`error: ${source.problem}`);
      console.error('Nothing was written.');
      return 1;
    }
    console.error(`warning: ${source.problem}`);
  }

  if (survey) {
    printSurvey(loaded);
    return 0;
  }

  if (places) {
    const existing = existsSync(path.join(dataDir, ...PLACES_FILE.split('/')))
      ? JSON.parse(await readFile(path.join(dataDir, ...PLACES_FILE.split('/')), 'utf8'))
      : null;
    const done = await writePlaces(dataDir, loaded[0].json, { existing });
    const how = (kind) => done.matched.filter((m) => m.how === kind).length;
    console.log(`${done.matched.length + done.unresolved.length} place record(s): ${how('wikidata')} matched on wikidata, ${how('name')} on the name, ${done.unresolved.length} left for a person, ${Object.keys(done.hand).length} entry(ies) already written by hand.`);
    console.log(`${PLACES_FILE} and ${PLACES_DOC} written. A match is never guessed: what is left is in the document.`);
    return 0;
  }

  const sources = Object.fromEntries(loaded.map((source) => [source.name, source.json]));
  const whole = planImport(sources);
  const plan = baseOnly
    ? { ...whole, files: whole.files.filter((entry) => entry.file.startsWith(`${BASE_DIR}/`)) }
    : whole;

  // What the plan would come to on disk: the files it writes, plus everything
  // under data/geo/ it does not touch.
  const planned = new Set(plan.files.map((entry) => entry.file));
  const existing = await directoryBytes(geoDir);
  let replaced = 0;
  for (const file of planned) {
    const full = path.join(geoDir, ...file.split('/'));
    if (existsSync(full)) replaced += (await stat(full)).size;
  }
  const written = plan.files.reduce((n, entry) => n + entry.bytes, 0);
  const baseBytes = plan.files.filter((entry) => entry.file.startsWith(`${BASE_DIR}/`)).reduce((n, entry) => n + entry.bytes, 0);
  const geoBytes = existing - replaced + written;

  if (budget) printBudget(plan, { geoBytes, baseBytes });

  const stops = [...plan.problems];
  if (baseBytes > BASE_CEILING) stops.push(`the base map would be ${kb(baseBytes)}, over the ${kb(BASE_CEILING)} ceiling`);
  if (geoBytes > GEO_CEILING) stops.push(`data/geo/ would be ${kb(geoBytes)}, over the ${kb(GEO_CEILING)} ceiling`);
  if (stops.length) {
    for (const stop of stops) console.error(`error: ${stop}`);
    console.error('Nothing was written.');
    return 1;
  }

  const files = await writePlan(geoDir, plan);
  if (!budget) {
    for (const row of plan.layers) {
      console.log(`${row.layer} ${row.level}: ${kb(row.bytes)} of ${kb(row.cap)} at ${degrees(row.tolerance)}, ${row.kept} points kept, ${row.dropped} dropped — ${row.note}`);
    }
  }
  console.log(`${files.length} file(s) written under ${geoDir}. Remember to run node tools/build-index.mjs (the manifest lists every cell).`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

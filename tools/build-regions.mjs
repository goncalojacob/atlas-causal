#!/usr/bin/env node
// Natural Earth 1:110m → data/geo/land-present.json and data/geo/regions.json.
// Run once and commit; rerun only to change lanes or bump Natural Earth.
//
//   node tools/build-regions.mjs [--source <dir>] [--data <dir>] [--check]
//
// Downloads the public-domain GeoJSON published in the upstream repository
// at a pinned tag (no shapefile conversion needed), or reads the two files
// from --source. Lane polygons are unions of the member countries by the
// CONTINENT attribute — a MultiPolygon of the members, nothing dissolved,
// which is enough for point-in-polygon. Coordinates are kept as published.
//
// A run has no network, so --source is how it is really run, and the two
// files live in the repository gzipped: vendor/natural-earth/110m/. A source
// directory that holds `<name>.gz` is read through gunzipSync and the sha256
// of the *decompressed* bytes is checked against SOURCE_SHA256 below, which
// is what vendor/SHA256SUMS records — the file as it was downloaded (review
// of the map block, finding 2). --check refuses to write on a mismatch;
// without it the tool warns, loudly, and carries on. --source therefore
// defaults to that directory and --network is how the download is asked for.
//
// Known consequences of the CONTINENT attribute, to be overridden per record
// with `region` when they matter: Russia is Europe in its entirety; Turkey,
// Cyprus and the Caucasus are Asia; Greenland is North America (americas).
// Antarctica and "Seven seas (open ocean)" have no lane.

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonical } from './build-index.mjs';
import { readRegions } from './lib/read.mjs';
import { readSourceJson } from './import/source.mjs';
import { ringBbox, splitAtMeridian } from './import/geometry.mjs';
import { ringArea } from '../src/util/simplify.js';
import { SEAM } from '../src/map/projection.js';

// Compact, not indented: coordinate arrays are three times the size when
// pretty-printed and nobody reads them in a diff. Keys still sorted.
function serializeGeo(value) {
  return `${JSON.stringify(canonical(value))}\n`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DATA = path.join(ROOT, 'data');

export const NATURAL_EARTH_VERSION = 'v5.1.2';
const BASE = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_VERSION}/geojson/`;
export const FILES = Object.freeze({
  countries: 'ne_110m_admin_0_countries.geojson',
  land: 'ne_110m_land.geojson',
});

// sha256 of each file as published at that tag, decompressed; the same
// numbers as vendor/SHA256SUMS, which is where they were taken from.
export const SOURCE_SHA256 = Object.freeze({
  'ne_110m_admin_0_countries.geojson': '6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f',
  'ne_110m_land.geojson': '9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9',
});

export const VENDOR_110M = 'vendor/natural-earth/110m';

// --- where to cut the world ------------------------------------------------
//
// The map is centred on a meridian and wraps longitudes into [-180, 180)
// around it, so the meridian half a world away is the left edge of the
// picture and the right edge at once: the *seam*. Every outline is cut there
// (tools/import/geometry.mjs), and a seam through a continent is a continent
// drawn in two pieces at opposite sides of the map for ever. Which meridian
// is therefore a measurement and not a preference, and `--seam-report` is
// the measurement: what each candidate cuts, over the coastline itself.
//
// The owner asked for the world centred on Asia (5 September 2026), which is
// this range; the brief fixes the step.
export const SEAM_CANDIDATES = Object.freeze([140, 145, 150, 155, 160, 165, 170]);

// What the choice is not about: the brief sets aside Greenland, Iceland, the
// Atlantic islands and Antarctica, because every candidate seam runs through
// the North Atlantic and the Southern Ocean and no choice within the range
// avoids them. Each is a box, and a polygon counts as one of them only when
// it sits *wholly* inside it, so the rule names a place and not a size:
// Africa reaches into the Atlantic and out the other side and is never an
// Atlantic island, and Western Sahara is not one either.
//
// "The Atlantic islands" is written out as the archipelagos it means, one
// tight box each, and the list is read in order — Iceland before Greenland,
// whose own box would otherwise contain it.
export const SEAM_EXCLUDED = Object.freeze([
  Object.freeze({ name: 'the Azores', box: [-32, 36, -24, 40] }),
  Object.freeze({ name: 'Madeira', box: [-18, 32, -16, 34] }),
  Object.freeze({ name: 'the Canaries', box: [-19, 27, -13, 30] }),
  Object.freeze({ name: 'Cape Verde', box: [-26, 14, -22, 18] }),
  Object.freeze({ name: 'the South Atlantic islands', box: [-16, -41, -5, -7] }),
  Object.freeze({ name: 'Iceland', box: [-25.5, 62, -13, 68] }),
  Object.freeze({ name: 'Greenland', box: [-75, 58, -10, 85] }),
  Object.freeze({ name: 'Antarctica', box: [-180, -90, 180, -60] }),
]);

const inside = ([w, s, e, n], box) => w >= box[0] && e <= box[2] && s >= box[1] && n <= box[3];

// Which of the four a polygon is, or null when it is none of them.
export function excludedAs(bbox) {
  return SEAM_EXCLUDED.find((entry) => inside(bbox, entry.box))?.name ?? null;
}

// Square degrees. Not a real area — the atlas is equirectangular and a degree
// of longitude is not a degree of anything at 70° north — but the question is
// "which candidate cuts less", and both sides of that comparison are wrong in
// the same direction.
function polygonArea(polygon) {
  return polygon.reduce((total, ring, i) => total + (i === 0 ? 1 : -1) * Math.abs(ringArea(ring)), 0);
}

// One row per candidate central meridian: what its seam cuts, and how close
// it comes to land it does not cut. `named` is the countries file, for the
// names — the land file has no properties at all and "polygon 41 of 127" is
// not something the owner can weigh.
export function seamReport(land, named, { candidates = SEAM_CANDIDATES } = {}) {
  const polygons = [];
  for (const f of land.features) {
    for (const polygon of polygonsOf(f.geometry)) polygons.push({ bbox: ringBbox(polygon[0] ?? []), area: polygonArea(polygon) });
  }
  const places = [];
  for (const f of named?.features ?? []) {
    const name = f.properties.NAME ?? f.properties.ADMIN ?? '?';
    for (const polygon of polygonsOf(f.geometry)) places.push({ name, bbox: ringBbox(polygon[0] ?? []) });
  }
  return candidates.map((meridian) => {
    const seam = meridian - 180;
    const cut = polygons.filter((p) => !excludedAs(p.bbox) && p.bbox[0] < seam && p.bbox[2] > seam);
    const setAside = polygons.filter((p) => excludedAs(p.bbox) && p.bbox[0] < seam && p.bbox[2] > seam);
    // How far the seam is from the nearest land it does not cut, the
    // excluded ones included: a seam that misses Iceland by a degree is not
    // the same choice as one that misses it by twelve.
    let clearance = Infinity;
    for (const p of polygons) {
      if (p.bbox[0] < seam && p.bbox[2] > seam) continue;
      // Zero where the seam runs along an edge of it, and never less.
      const d = Math.max(p.bbox[0] - seam, seam - p.bbox[2], 0);
      if (d < clearance) clearance = d;
    }
    return {
      meridian,
      seam,
      polygons: cut.length,
      area: cut.reduce((n, p) => n + p.area, 0),
      names: [...new Set(places.filter((p) => p.bbox[0] < seam && p.bbox[2] > seam && !excludedAs(p.bbox)).map((p) => p.name))].sort(),
      setAside: [...new Set(setAside.map((p) => excludedAs(p.bbox)))].sort(),
      clearance,
    };
  });
}

// The candidate that cuts least: fewest polygons, then least area, then the
// one whose seam comes least close to the land it misses — because a tie at
// nothing cut is a real tie, and the seam that clears land by furthest is the
// one a later, more detailed coastline is least likely to break.
export function chooseSeam(rows) {
  return [...rows].sort((a, b) => a.polygons - b.polygons || a.area - b.area || b.clearance - a.clearance)[0];
}

// Natural Earth CONTINENT → lane id in data/regions.json.
export const CONTINENT_TO_LANE = Object.freeze({
  Europe: 'europe',
  Africa: 'africa',
  Asia: 'asia',
  'North America': 'americas',
  'South America': 'americas',
  Oceania: 'oceania',
});

// One source file, from a directory or from the network, with whatever there
// is to say about it. The gzipped name is preferred where both are there, so
// the repository's own copy is what a run reads.
// → { json, problem }
async function load(name, sourceDir) {
  if (sourceDir) {
    const plain = path.join(sourceDir, name);
    const file = existsSync(plain) ? plain : `${plain}.gz`;
    const { json, problem } = await readSourceJson(file, SOURCE_SHA256[name] ?? null);
    return { json, problem };
  }
  const response = await fetch(BASE + name);
  if (!response.ok) throw new Error(`download failed: ${BASE}${name} → ${response.status}`);
  return { json: await response.json(), problem: null };
}

function polygonsOf(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

// The coastline, cut at the seam so that nothing it draws crosses the one
// meridian that is both edges of the picture (tools/import/geometry.mjs).
// A feature the seam misses comes back as it was, byte for byte.
export function buildLand(land, { seam = SEAM } = {}) {
  return {
    type: 'FeatureCollection',
    features: land.features
      .map((f) => ({ type: 'Feature', properties: {}, geometry: splitAtMeridian(f.geometry, seam) }))
      .filter((f) => f.geometry),
  };
}

// lanes: data/regions.json. Returns the FeatureCollection and the countries
// that fell into no lane, for the log.
export function buildLanes(countries, lanes, { seam = SEAM } = {}) {
  const members = new Map(lanes.map((l) => [l.id, []]));
  const skipped = [];
  for (const f of countries.features) {
    const lane = CONTINENT_TO_LANE[f.properties.CONTINENT];
    const name = f.properties.NAME ?? f.properties.ADMIN ?? '?';
    if (!lane || !members.has(lane)) {
      skipped.push(`${name} (${f.properties.CONTINENT})`);
      continue;
    }
    // Cut at the seam like the coastline, because the wash a regional event
    // draws is projected too. The cut adds points at one longitude and takes
    // none away, so the point-in-polygon answer — which lane a place is on —
    // is the same for every point but the ones exactly on the seam.
    const cut = splitAtMeridian(f.geometry, seam);
    members.get(lane).push({ name, polygons: cut ? polygonsOf(cut) : [] });
  }
  const features = [...lanes]
    .sort((a, b) => a.order - b.order)
    .map((lane) => {
      const list = members.get(lane.id).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      return {
        type: 'Feature',
        properties: { region: lane.id, countries: list.map((m) => m.name) },
        geometry: { type: 'MultiPolygon', coordinates: list.flatMap((m) => m.polygons) },
      };
    });
  return { collection: { type: 'FeatureCollection', features }, skipped };
}

function printSeamReport(rows) {
  const chosen = chooseSeam(rows);
  console.log('central meridian  seam    polygons cut  land area cut  clearance  what is cut');
  for (const row of rows) {
    const names = row.names.length ? row.names.join(', ') : '—';
    console.log([
      `${String(row.meridian).padStart(13)}E`,
      `${row.seam}`.padStart(6),
      String(row.polygons).padStart(13),
      `${row.area.toFixed(1)}`.padStart(14),
      `${row.clearance.toFixed(2)}°`.padStart(10),
      `  ${names}`,
    ].join(''));
  }
  console.log(`\n${SEAM_EXCLUDED.map((e) => e.name).join(', ')} are set aside: no candidate avoids them.`);
  for (const row of rows) {
    if (row.setAside.length) console.log(`  ${row.seam}: ${row.setAside.join(', ')}`);
  }
  console.log(`\nleast cut: central meridian ${chosen.meridian}E, seam ${chosen.seam}`);
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let sourceDir = path.join(ROOT, ...VENDOR_110M.split('/'));
  let check = false;
  let report = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--source') sourceDir = path.resolve(argv[++i]);
    else if (argv[i] === '--network') sourceDir = null;
    else if (argv[i] === '--check') check = true;
    else if (argv[i] === '--seam-report') report = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const loaded = [await load(FILES.countries, sourceDir), await load(FILES.land, sourceDir)];
  for (const { problem } of loaded) {
    if (!problem) continue;
    if (check) {
      console.error(`error: ${problem}`);
      return 1;
    }
    console.error(`warning: ${problem}`);
  }
  const [{ json: countries }, { json: land }] = loaded;
  if (report) {
    printSeamReport(seamReport(land, countries));
    return 0;
  }
  const lanes = await readRegions(dataDir);
  if (lanes.length === 0) {
    console.error(`no lanes in ${path.join(dataDir, 'regions.json')}`);
    return 1;
  }
  const { collection, skipped } = buildLanes(countries, lanes);
  const geoDir = path.join(dataDir, 'geo');
  await mkdir(geoDir, { recursive: true });
  await writeFile(path.join(geoDir, 'land-present.json'), serializeGeo(buildLand(land)), 'utf8');
  await writeFile(path.join(geoDir, 'regions.json'), serializeGeo(collection), 'utf8');
  for (const f of collection.features) {
    console.log(`${f.properties.region}: ${f.properties.countries.length} countries, ${f.geometry.coordinates.length} polygons`);
  }
  if (skipped.length) console.log(`no lane: ${skipped.join(', ')}`);
  console.log(`land: ${land.features.length} polygons. Remember to run node tools/build-index.mjs (the manifest lists land files).`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

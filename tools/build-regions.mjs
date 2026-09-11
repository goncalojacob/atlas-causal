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

export function buildLand(land) {
  return {
    type: 'FeatureCollection',
    features: land.features.map((f) => ({ type: 'Feature', properties: {}, geometry: f.geometry })),
  };
}

// lanes: data/regions.json. Returns the FeatureCollection and the countries
// that fell into no lane, for the log.
export function buildLanes(countries, lanes) {
  const members = new Map(lanes.map((l) => [l.id, []]));
  const skipped = [];
  for (const f of countries.features) {
    const lane = CONTINENT_TO_LANE[f.properties.CONTINENT];
    const name = f.properties.NAME ?? f.properties.ADMIN ?? '?';
    if (!lane || !members.has(lane)) {
      skipped.push(`${name} (${f.properties.CONTINENT})`);
      continue;
    }
    members.get(lane).push({ name, polygons: polygonsOf(f.geometry) });
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

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let sourceDir = path.join(ROOT, ...VENDOR_110M.split('/'));
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--source') sourceDir = path.resolve(argv[++i]);
    else if (argv[i] === '--network') sourceDir = null;
    else if (argv[i] === '--check') check = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const lanes = await readRegions(dataDir);
  if (lanes.length === 0) {
    console.error(`no lanes in ${path.join(dataDir, 'regions.json')}`);
    return 1;
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

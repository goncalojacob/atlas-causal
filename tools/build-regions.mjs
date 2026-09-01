#!/usr/bin/env node
// Natural Earth 1:110m → data/geo/land-present.json and data/geo/regions.json.
// Run once and commit; rerun only to change lanes or bump Natural Earth.
//
//   node tools/build-regions.mjs [--source <dir>] [--data <dir>]
//
// Downloads the public-domain GeoJSON published in the upstream repository
// at a pinned tag (no shapefile conversion needed), or reads the two files
// from --source. Lane polygons are unions of the member countries by the
// CONTINENT attribute — a MultiPolygon of the members, nothing dissolved,
// which is enough for point-in-polygon. Coordinates are kept as published.
//
// Known consequences of the CONTINENT attribute, to be overridden per record
// with `region` when they matter: Russia is Europe in its entirety; Turkey,
// Cyprus and the Caucasus are Asia; Greenland is North America (americas).
// Antarctica and "Seven seas (open ocean)" have no lane.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonical } from './build-index.mjs';
import { readRegions } from './lib/read.mjs';

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

// Natural Earth CONTINENT → lane id in data/regions.json.
export const CONTINENT_TO_LANE = Object.freeze({
  Europe: 'europe',
  Africa: 'africa',
  Asia: 'asia',
  'North America': 'americas',
  'South America': 'americas',
  Oceania: 'oceania',
});

async function load(name, sourceDir) {
  if (sourceDir) return JSON.parse(await readFile(path.join(sourceDir, name), 'utf8'));
  const response = await fetch(BASE + name);
  if (!response.ok) throw new Error(`download failed: ${BASE}${name} → ${response.status}`);
  return response.json();
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
  let sourceDir = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--source') sourceDir = path.resolve(argv[++i]);
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
  const countries = await load(FILES.countries, sourceDir);
  const land = await load(FILES.land, sourceDir);
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

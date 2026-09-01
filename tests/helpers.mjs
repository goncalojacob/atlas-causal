// Shared test helpers. Zero dependencies; node --test.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSchemaFiles, readRecords, readRegions, readRegionPolygons } from '../tools/lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCHEMA_DIR = path.join(ROOT, 'schema');
export const FIXTURE_DATA = path.join(ROOT, 'tests', 'fixtures', 'data');

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let schemaCache = null;
export async function schemas() {
  if (!schemaCache) schemaCache = await readSchemaFiles(SCHEMA_DIR);
  return clone(schemaCache);
}

// The synthetic fixture dataset: every record, the lane list and the lane
// polygons. Fresh copies each call, so tests may mutate freely.
export async function fixtures() {
  const { entries, problems } = await readRecords(FIXTURE_DATA);
  if (problems.length) throw new Error(`fixture problems: ${JSON.stringify(problems)}`);
  const records = entries.map((e) => e.record);
  const regions = await readRegions(FIXTURE_DATA);
  const polygons = await readRegionPolygons(FIXTURE_DATA);
  const byId = Object.fromEntries(records.map((r) => [r.id, r]));
  return { records, regions, polygons, byId, entries };
}

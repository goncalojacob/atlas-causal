// The schema files the *browser* needs, listed. The site never scans
// directories (principle 1) and has no build step, so it cannot discover
// schema/ the way tools/lib/read.mjs does in Node: the list has to be written
// down here. tests/schemas.test.mjs asserts it is exactly what is on disk
// minus TOOL_SIDE, so a new schema file that nobody accounts for fails CI
// rather than the form.

// Schemas of things the form never builds and the atlas never loads, checked
// by tools/validate.mjs only. v1/import-map.json describes data/imports/:
// how a source's entities become actors. It is not a record — no envelope, no
// kind — and fetching it in the browser would only make the page slower.
export const TOOL_SIDE = Object.freeze([
  'v1/import-map.json',
]);

export const SCHEMA_FILES = Object.freeze([
  'common/confidence.json',
  'common/interval.json',
  'common/place.json',
  'common/provenance.json',
  'v1/actor.json',
  'v1/bundle.json',
  'v1/edge.json',
  'v1/event.json',
  'v1/place.json',
  'v1/presence.json',
  'v1/region.json',
  'v1/source.json',
]);

async function defaultFetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

// → { 'common/interval.json': {...}, ... }, the shape createValidator wants.
export async function loadSchemas({ root = 'schema/', fetchJson = defaultFetchJson } = {}) {
  const loaded = await Promise.all(SCHEMA_FILES.map((file) => fetchJson(`${root}${file}`)));
  return Object.fromEntries(SCHEMA_FILES.map((file, i) => [file, loaded[i]]));
}

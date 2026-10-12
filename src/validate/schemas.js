// The schema files the *browser* needs, listed. The site never scans
// directories (principle 1) and has no build step, so it cannot discover
// schema/ the way tools/lib/read.mjs does in Node: the list has to be written
// down here. tests/schemas.test.mjs asserts it is exactly what is on disk
// minus TOOL_SIDE, so a new schema file that nobody accounts for fails CI
// rather than the form.

// Schemas of things the form never builds and the atlas never loads, checked
// by tools/validate.mjs only. Six of them describe data/imports/ — how a
// source's entities become actors, which items an import is pointed at, where
// a cut-off run stopped, which Natural Earth city a place record is, and,
// since M90, what the planner queued and what a writer did with it — and the
// seventh describes the Wikipedia leads cached under tools/import/cache/,
// which are not even in data/. None is a record and fetching any of them in
// the browser would only make the page slower; data/imports/ is not in the
// deploy artifact at all, so there is nothing there to validate.
//
// The two of M90 are under `import/` rather than `v1/`: a queue is nobody's
// record and carries no provenance envelope, so it is not a version of the
// record schemas and does not belong beside them.
export const TOOL_SIDE = Object.freeze([
  'import/queue-log.json',
  'import/queue.json',
  'v1/import-map.json',
  'v1/import-places.json',
  'v1/import-seeds.json',
  'v1/import-state.json',
  'v1/wikipedia-lead.json',
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
  'v1/narrative.json',
  'v1/office.json',
  'v1/place.json',
  'v1/presence.json',
  'v1/region.json',
  'v1/relation.json',
  'v1/source.json',
  'v1/tenure.json',
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

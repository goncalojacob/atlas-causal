// The Historical Basemaps import, against a synthetic snapshot set small
// enough to reason about by hand: three snapshots, one polity renamed between
// two of them, one polygon the source names nobody for, one name the mapping
// file cuts in two. Nothing here touches the thirteen vendored files — those
// are checked by their sha256 when the tool runs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  planImport, simplifyFeatures, snapshots, shardFile, sourceFileName, dateOf, actorFor,
  nameOf, ownsShard, slug, runImport, reportMarkdown, sourceRecord,
  IMPORT_AUTHOR, ORIGIN_TOOL, LICENSE, SOURCE_ID, SOURCE_YEARS, CSHAPES_FROM, MAP_FILE,
} from '../tools/import/basemaps.mjs';
import { crossesMeridian } from '../tools/import/geometry.mjs';
import { SEAM } from '../src/map/projection.js';
import { isDraft } from '../src/origin.js';

// A closed square, counter-clockwise, big enough to survive MIN_AREA.
const square = (x, y, size = 8) => [[
  [x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y],
]];

const feature = (name, geometry, extra = {}) => ({
  type: 'Feature',
  properties: { NAME: name, SUBJECTO: null, BORDERPRECISION: 1, ...extra },
  geometry,
});

const collection = (features) => ({ type: 'FeatureCollection', features });

function synthetic() {
  return {
    1500: collection([
      feature('Westland', { type: 'Polygon', coordinates: square(0, 0) }),
      feature('Eastland', { type: 'Polygon', coordinates: square(20, 0) }),
      // Ground the source draws and attributes to nobody.
      feature(null, { type: 'Polygon', coordinates: square(40, 0) }),
    ]),
    1600: collection([
      feature('Westland', { type: 'Polygon', coordinates: square(0, 0) }),
      // The same polity under a second spelling, plus a second polygon: one
      // presence, a MultiPolygon, and not two presences.
      feature('Éastland', { type: 'Polygon', coordinates: square(20, 0) }),
      feature('Eastland', { type: 'Polygon', coordinates: square(20, 12) }),
    ]),
    1700: collection([
      feature('Westland', { type: 'Polygon', coordinates: square(0, 0) }),
    ]),
  };
}

const YEARS = [1500, 1600, 1700];
const CUT = snapshots(YEARS, { until: 1885 }).kept;

function loaded(map = {}) {
  const raw = synthetic();
  return CUT.map((snapshot) => ({ ...snapshot, features: simplifyFeatures(raw[snapshot.year]) }));
}

// --- the snapshot table ----------------------------------------------------

test('a snapshot holds until the next one, and the last until CShapes begins', () => {
  const { kept, until } = { ...snapshots(YEARS, { until: 1885 }), until: 1885 };
  assert.deepEqual(kept, [
    { year: 1500, until: 1599 },
    { year: 1600, until: 1699 },
    { year: 1700, until },
  ]);
});

test('every snapshot CShapes covers is dropped, and the rule is in the table', () => {
  const { kept, dropped } = snapshots();
  // The real list: nothing kept reaches 1886, nothing dropped falls short of it.
  assert.ok(kept.every((s) => s.until < CSHAPES_FROM), 'a kept snapshot runs into CShapes');
  assert.ok(dropped.every((y) => y >= CSHAPES_FROM), 'a dropped snapshot is before CShapes');
  assert.deepEqual(dropped, SOURCE_YEARS.filter((y) => y >= CSHAPES_FROM));
  // The last one the source has before CShapes is 1880, and it stops at 1885
  // rather than running on to 1899 where the next snapshot is.
  assert.deepEqual(kept[kept.length - 1], { year: 1880, until: 1885 });
  // And the coverage has no hole in it: each one begins where the last ended.
  for (let i = 1; i < kept.length; i += 1) assert.equal(kept[i].year, kept[i - 1].until + 1);
});

test('a shard is named for the years it covers, and only its own are swept', () => {
  assert.equal(shardFile({ year: 1500, until: 1599 }), 'geo/presences/1500-1599.json');
  assert.equal(sourceFileName(1500), 'world_1500.geojson.gz');
  const kept = snapshots().kept;
  assert.equal(ownsShard('1400-1491.json', kept), true);
  assert.equal(ownsShard('1880-1885.json', kept), true);
  // CShapes' five live in the same directory and are not this import's to
  // delete (deviation 721).
  assert.equal(ownsShard('1886-1913.json', kept), false);
  assert.equal(ownsShard('1975-2019.json', kept), false);
});

// --- names, folding and the mapping file -----------------------------------

test('a polygon the source names nobody for is not a presence', () => {
  assert.equal(nameOf({ NAME: 'Westland' }), 'Westland');
  assert.equal(nameOf({ NAME: null }), null);
  assert.equal(nameOf({ NAME: '   ' }), null);
  assert.equal(nameOf({}), null);
  const plan = planImport(loaded(), { created: '2026-09-16' });
  assert.equal(plan.unnamed.get(1500), 1);
  assert.equal(plan.unnamed.get(1600), 0);
  assert.ok(!plan.presences.some((p) => p.actor === ''), 'a nameless polygon became a presence');
});

test('two spellings fold onto one actor, one presence, and the fold is reported', () => {
  const plan = planImport(loaded(), { created: '2026-09-16' });
  const at1600 = plan.presences.filter((p) => p.when.start === 1600);
  assert.deepEqual(at1600.map((p) => p.id).sort(), ['eastland-1600', 'westland-1600']);
  const east = at1600.find((p) => p.id === 'eastland-1600');
  // Two polygons under two spellings in one year: one presence, multipart.
  assert.equal(east.geometry.key, 'eastland');
  const shard = plan.shardFiles.get('geo/presences/1600-1699.json');
  const drawn = shard.features.find((f) => f.id === 'eastland');
  assert.equal(drawn.geometry.type, 'MultiPolygon');
  assert.equal(drawn.geometry.coordinates.length, 2);
  // And it is reported, because folding a string is not a decision anybody made.
  assert.deepEqual(plan.report, [{ actor: 'eastland', names: ['Eastland', 'Éastland'] }]);
  assert.match(reportMarkdown(plan.report, { generated: '2026-09-16' }), /`eastland` \| "Eastland" · "Éastland"/);
});

test('the mapping file decides an actor, and a split cuts a name in two', () => {
  const map = {
    Westland: {
      actor: 'west-colony',
      names: ['Westland under somebody'],
      splits: [{ from: '1700-01-01', actor: 'westland' }],
    },
  };
  assert.deepEqual(actorFor('Westland', map.Westland, dateOf(1500)), { actor: 'west-colony', names: ['Westland under somebody'], mapped: true });
  assert.deepEqual(actorFor('Westland', map.Westland, dateOf(1700)), { actor: 'westland', names: null, mapped: true });
  // A name with no entry is the name folded, and says so.
  assert.deepEqual(actorFor('Eastland', null, dateOf(1500)), { actor: 'eastland', names: null, mapped: false });

  const plan = planImport(loaded(), { created: '2026-09-16', map });
  assert.deepEqual(
    plan.presences.filter((p) => p.actor.startsWith('west')).map((p) => p.id),
    ['west-colony-1500', 'west-colony-1600', 'westland-1700'],
  );
  // The names the file gives beat the source's own on the actor it created.
  const colony = plan.actors.find((a) => a.id === 'west-colony');
  assert.deepEqual(colony.names, ['Westland under somebody']);
  assert.match(colony.summary, /the names on this record are the ones data\/imports\/basemaps-actors\.json gives it/);
  // A fold the mapping file already speaks to is not reported again.
  assert.deepEqual(plan.report.map((r) => r.actor), ['eastland']);
});

test('an actor the atlas already has is reused and never rewritten', () => {
  const plan = planImport(loaded(), { created: '2026-09-16', existingActors: new Set(['westland']) });
  assert.equal(plan.actors.some((a) => a.id === 'westland'), false);
  // Its presences are still written, and still point at it.
  assert.ok(plan.presences.some((p) => p.actor === 'westland'));
  assert.ok(plan.notes.some((n) => /data\/actors\/westland\.json/.test(n)));
});

// --- what a presence says --------------------------------------------------

test('a snapshot becomes a presence that is probable, sourced and undated finer than a year', () => {
  const plan = planImport(loaded(), { created: '2026-09-16' });
  const west = plan.presences.find((p) => p.id === 'westland-1500');
  assert.equal(west.kind, 'presence');
  assert.equal(west.license, LICENSE);
  assert.deepEqual(west.origin, { tool: ORIGIN_TOOL });
  assert.deepEqual(west.authors, [IMPORT_AUTHOR]);
  assert.ok(isDraft(west));
  // The claim this import is allowed to make, and the word the schema has for
  // it: the border was drawn for 1500 and is assumed until 1599.
  assert.equal(west.confidence, 'probable');
  assert.deepEqual(west.when, { start: 1500, end: 1599, date: '1500-01-01' });
  // One shard, because a snapshot is exactly one period.
  assert.deepEqual(west.geometry, { files: ['geo/presences/1500-1599.json'], key: 'westland' });
  assert.deepEqual(west.sources, [{ source: SOURCE_ID, locator: 'world_1500.geojson, "Westland"' }]);
  // Never a state, and never somebody's dependency: the source says neither.
  assert.equal(west.presenceType, 'polity');
  assert.equal(west.dependencyOf, null);
  assert.equal(west.dependencyKind, null);
  assert.equal(west.capital, null);
});

test('an actor says which snapshots drew it and refuses to say more', () => {
  const plan = planImport(loaded(), { created: '2026-09-16' });
  const west = plan.actors.find((a) => a.id === 'westland');
  assert.equal(west.actorType, 'polity');
  assert.deepEqual(west.names, ['Westland']);
  assert.equal(west.license, LICENSE);
  assert.deepEqual(west.review, { status: 'draft', flags: ['imported-facts'] });
  // The interval is the span of the snapshots and says so in the summary, so
  // that nobody reads it as the polity's life.
  assert.deepEqual(west.when, { start: 1500, end: 1885 });
  assert.match(west.summary, /the snapshots for 1500, 1600 and 1700/);
  assert.match(west.summary, /not a claim about when this polity began or ended/);
  assert.match(west.summary, /asserts nothing the dataset does not/);
  // An actor drawn by one snapshot says so in the singular.
  const east = plan.actors.find((a) => a.id === 'eastland');
  assert.match(east.summary, /the snapshots for 1500 and 1600/);
  assert.deepEqual(east.when, { start: 1500, end: 1699 });
});

// --- the shard -------------------------------------------------------------

test('a shard carries no arcs, because GeoJSON has no topology to take them from', () => {
  const plan = planImport(loaded(), { created: '2026-09-16' });
  for (const [, shard] of plan.shardFiles) {
    assert.equal(shard.type, 'FeatureCollection');
    assert.deepEqual(shard.arcs, []);
    for (const f of shard.features) {
      // No `borders` at all, and not an empty list: the map strokes what a
      // shard names and this one names nothing.
      assert.deepEqual(Object.keys(f.properties).sort(), ['presence']);
    }
  }
});

test('a shard holds one feature per presence, keyed by the actor and in order', () => {
  const plan = planImport(loaded(), { created: '2026-09-16' });
  const shard = plan.shardFiles.get('geo/presences/1500-1599.json');
  assert.deepEqual(shard.features.map((f) => f.id), ['eastland', 'westland']);
  assert.deepEqual(shard.features.map((f) => f.properties.presence), ['eastland-1500', 'westland-1500']);
  for (const presence of plan.presences) {
    const file = presence.geometry.files[0];
    assert.ok(plan.shardFiles.get(file).features.some((f) => f.id === presence.geometry.key), presence.id);
  }
});

// --- simplification and the seam -------------------------------------------

test('an outline is quantized, pruned and cut at the meridian the map is cut at', () => {
  const across = collection([feature('Acrossland', {
    type: 'Polygon',
    coordinates: [[[-40.123456, 0], [-20.7654321, 0], [-20.7654321, 9], [-40.123456, 9], [-40.123456, 0]]],
  })]);
  assert.equal(crossesMeridian(across.features[0].geometry, SEAM), true);
  const [out] = simplifyFeatures(across);
  assert.equal(crossesMeridian(out.geometry, SEAM), false);
  for (const ring of out.geometry.coordinates.flat()) {
    for (const [x, y] of ring) {
      // Three decimals, except at the seam itself: the cut runs after the
      // quantization and puts its own vertices a millionth of a degree either
      // side of it, exactly as the CShapes import's cut does.
      const atSeam = Math.abs(Math.abs(x - SEAM) - 1e-6) < 1e-9;
      assert.ok(atSeam || Math.round(x * 1000) / 1000 === x, `${x} is neither quantized nor at the seam`);
      assert.equal(Math.round(y * 1000) / 1000, y);
    }
  }
});

test('a polygon too small to draw is dropped rather than drawn as a line', () => {
  const tiny = collection([feature('Speckland', { type: 'Polygon', coordinates: square(0, 0, 0.0003) })]);
  const [out] = simplifyFeatures(tiny);
  assert.equal(out.geometry, null);
  const plan = planImport([{ year: 1500, until: 1599, features: [out] }], { created: '2026-09-16' });
  assert.deepEqual(plan.presences, []);
  assert.deepEqual(plan.actors, []);
});

// --- the source record -----------------------------------------------------

test('the source record is this project s own writing and is licensed as such', () => {
  const source = sourceRecord({ created: '2026-09-16' });
  assert.equal(source.kind, 'source');
  assert.equal(source.type, 'dataset');
  // The record *about* the dataset is CC BY-SA even though the dataset is not.
  assert.equal(source.license, 'CC-BY-SA-4.0');
  assert.deepEqual(source.origin, { tool: ORIGIN_TOOL });
  assert.match(source.url, /aourednik\/historical-basemaps/);
  assert.ok(source.creators.length > 0);
});

// --- on disk ---------------------------------------------------------------

// The real snapshot table names thirteen files, so the sandbox writes thirteen:
// the three interesting ones above, and a bare Westland square for the rest, so
// that a full run — sweep included — has something to read for every period.
const KEPT = snapshots().kept;
const shardOf = (year) => shardFile(KEPT.find((s) => s.year === year)).split('/').pop();

async function sandbox() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-basemaps-'));
  const source = path.join(dir, 'source');
  const data = path.join(dir, 'data');
  await mkdir(source, { recursive: true });
  await mkdir(path.join(data, 'geo', 'presences'), { recursive: true });
  await mkdir(path.join(data, 'sources'), { recursive: true });
  const raw = synthetic();
  const plain = collection([feature('Westland', { type: 'Polygon', coordinates: square(0, 0) })]);
  for (const { year } of KEPT) {
    const body = raw[year] ?? plain;
    await writeFile(path.join(source, sourceFileName(year)), gzipSync(Buffer.from(JSON.stringify(body), 'utf8')));
  }
  return { dir, source, data };
}

test('a run writes its records and its shards, and a second run writes the same bytes', async () => {
  const { source, data } = await sandbox();
  const first = await runImport(source, data, { today: '2026-09-16' });
  assert.deepEqual(first.failed, []);
  assert.ok(first.written.length > 0);
  const before = await readFile(path.join(data, 'presences', 'westland-1500.json'), 'utf8');
  const shardBefore = await readFile(path.join(data, 'geo', 'presences', shardOf(1500)), 'utf8');

  const second = await runImport(source, data, { today: '2026-09-30' });
  assert.deepEqual(second.failed, []);
  // Idempotent, `created` included: a record the import owns keeps the day it
  // was first written, so running the tool twice changes nothing.
  assert.equal(await readFile(path.join(data, 'presences', 'westland-1500.json'), 'utf8'), before);
  assert.equal(await readFile(path.join(data, 'geo', 'presences', shardOf(1500)), 'utf8'), shardBefore);
});

test('a run refuses to overwrite a record it did not write', async () => {
  const { source, data } = await sandbox();
  await mkdir(path.join(data, 'actors'), { recursive: true });
  await writeFile(path.join(data, 'actors', 'westland.json'), JSON.stringify({
    schema: 1, id: 'westland', kind: 'actor', status: 'active', license: 'CC-BY-SA-4.0',
    authors: [{ name: 'A Person', github: null }],
  }, null, 2));
  const result = await runImport(source, data, { today: '2026-09-16' });
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0], /was not written by this import/);
  assert.match(result.failed[0], /basemaps-actors\.json/);
  // And nothing was written: a refusal is a refusal for the whole run.
  assert.deepEqual(result.written, []);
});

test('a signed record is reported and left exactly as it is', async () => {
  const { source, data } = await sandbox();
  const first = await runImport(source, data, { today: '2026-09-16' });
  assert.deepEqual(first.failed, []);
  const file = path.join(data, 'presences', 'westland-1500.json');
  const signed = JSON.parse(await readFile(file, 'utf8'));
  signed.review = { status: 'reviewed', signedBy: [{ name: 'A Reviewer', github: null, on: '2026-09-20' }] };
  signed.confidence = 'consensus';
  await writeFile(file, `${JSON.stringify(signed, null, 2)}\n`, 'utf8');

  const second = await runImport(source, data, { today: '2026-09-21' });
  assert.deepEqual(second.failed, []);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), signed);
  assert.ok(second.notes.some((n) => /westland-1500\.json has been reviewed and signed/.test(n)));
});

test('the sweep never touches a shard this import does not own', async () => {
  const { source, data } = await sandbox();
  const theirs = path.join(data, 'geo', 'presences', '1886-1913.json');
  await writeFile(theirs, '{"type":"FeatureCollection","arcs":[],"features":[]}', 'utf8');
  const result = await runImport(source, data, { today: '2026-09-16' });
  assert.deepEqual(result.failed, []);
  assert.equal((await readdir(path.join(data, 'geo', 'presences'))).includes('1886-1913.json'), true);
  assert.deepEqual(result.removed.filter((f) => f.includes('1886-1913')), []);
});

test('a run refuses an id that belongs to a record of another kind', async () => {
  const { source, data } = await sandbox();
  // An id is unique across the whole atlas and not per directory (rule 2), so
  // a polity whose folded name is somebody's place is a mapping decision and
  // not a merge. The real case is "Boe" in 1492, a polity in Brazil, against
  // data/places/boe.json, which is Boé in Guinea-Bissau (deviation 722).
  await mkdir(path.join(data, 'places'), { recursive: true });
  await writeFile(path.join(data, 'places', 'westland.json'), JSON.stringify({
    schema: 1, id: 'westland', kind: 'place', status: 'active', license: 'CC-BY-SA-4.0',
  }, null, 2));
  const result = await runImport(source, data, { today: '2026-09-16' });
  assert.ok(result.failed.some((p) => /would take the id of the place "westland"/.test(p)), result.failed.join(' | '));
  assert.ok(result.failed.some((p) => /basemaps-actors\.json/.test(p)));
  assert.deepEqual(result.written, []);
});

test('--check refuses a source file that is not the one the import was written against', async () => {
  const { source, data } = await sandbox();
  const result = await runImport(source, data, { today: '2026-09-16', check: true });
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0], /has sha256 .*, not the .* this import was written against/);
  assert.deepEqual(result.written, []);
});

test('--only refuses a year the snapshot table does not keep', async () => {
  const { source, data } = await sandbox();
  const result = await runImport(source, data, { today: '2026-09-16', only: [1914] });
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0], /--only names 1914/);
});

test('a folded name is a slug of the source s own string', () => {
  assert.equal(slug('Ottoman Empire'), 'ottoman-empire');
  assert.equal(slug('Māori'), 'maori');
  assert.equal(slug("Kwakwaka'wakw"), 'kwakwaka-wakw');
  assert.equal(slug('Austria Hungary'), 'austria-hungary');
});

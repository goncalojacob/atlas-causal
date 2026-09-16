#!/usr/bin/env node
// Historical Basemaps → actors, presences and geometry shards for the
// territories before 1886. Offline, zero dependencies, idempotent: it rewrites
// exactly the files it owns and refuses to touch a record whose `origin` does
// not name it.
//
//   node tools/import/basemaps.mjs --source <dir> [--data <dir>] [--check]
//                                  [--geometry-only] [--only <years>] [--report]
//
// The second territory import, and the reason there is a second one: CShapes
// begins in 1886 and this atlas begins in 1415. Where the two overlap CShapes
// wins and the snapshot is dropped — see `snapshots()` — so this tool owns
// 1400 to 1885 and nothing after it.
//
// Which actor a polity's territory belongs to is not decided here: it is
// data/imports/basemaps-actors.json, and --report lists the names that
// probably want an entry in it.
//
// The dataset is GPL-3.0, which data/LICENSE (CC BY-SA 4.0) cannot absorb, so
// everything this tool writes says so in its own `license` field and the
// geometry lives under data/geo/LICENSE's Historical Basemaps paragraph.
// Nothing here is merged into a record somebody wrote. Why a GPL source was
// taken at all, and which files it binds, is STATUS.md → M43a.
//
// The source is a repository on GitHub and the sandbox reaches GitHub, but the
// copies this tool reads are committed under vendor/historical-basemaps/,
// gzipped, for the reason every other geometry import reads a vendored file: a
// run that downloads is a run nobody can repeat, and --check has something to
// check against.
//   https://github.com/aourednik/historical-basemaps — geojson/world_<year>.geojson

import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { simplifyArc, pruneGeometry } from './simplify.mjs';
import { splitAtMeridian } from './geometry.mjs';
import { readSourceJson, sha256 } from './source.mjs';
import { SEAM } from '../../src/map/projection.js';
import { identityOnDisk, mergeIdentity } from './identity.mjs';
import { isReviewed, writtenBy, REVIEW_STATUS } from '../../src/origin.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
export const DEFAULT_SOURCE = path.join(ROOT, 'vendor', 'historical-basemaps');

// --- what was imported, exactly ------------------------------------------

export const SOURCE_ID = 'historical-basemaps';
export const SOURCE_HOME = 'https://github.com/aourednik/historical-basemaps';
export const SOURCE_COMMIT = 'da7a4b735ecef70aebdc9c73e409d8a2500d50f3';

export const IMPORT_AUTHOR = Object.freeze({ name: 'Historical Basemaps import (tools/import/basemaps.mjs)', github: null });
// Which writer this is, in the envelope's own vocabulary. `authors` is
// attribution; `origin` is what the import, rule 12 and the review queue read.
export const ORIGIN_TOOL = 'basemaps';
export const LICENSE = 'GPL-3.0-only';
// What a reviewer is being told to look at: a record no person has read,
// written out of somebody else's database.
export const IMPORTED_FLAG = 'imported-facts';

// Simplification: the same three numbers the CShapes import uses, because the
// map draws the two over one coastline and a border at one detail beside a
// border at another would read as a mistake in the drawing.
export const TOLERANCE = 0.1;
export const DECIMALS = 3;
export const MIN_AREA = 1e-6;

// The year CShapes begins. Every snapshot from here on is dropped: two sources
// drawing the same year would be two answers to one question, and the brief
// settles it — CShapes wins wherever they overlap.
export const CSHAPES_FROM = 1886;

// Every snapshot the source has from 1400 on, in order. The ones at or after
// CSHAPES_FROM are listed and then dropped by `snapshots()`, so the rule is
// visible here rather than implied by which files somebody vendored.
export const SOURCE_YEARS = Object.freeze([
  1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1878, 1880,
  1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
]);

// The sha256 of each vendored file **decompressed** — the file as it was
// downloaded — taken from vendor/SHA256SUMS, which is where data/geo/LICENSE
// prints them too. --check verifies them and refuses to write on a mismatch.
export const SOURCE_FILE_SHA256 = Object.freeze({
  1400: 'c6b0efcb42d9520a1a724f981373296e84ea2c0a0527de7a06f8f9e2465eb6ec',
  1492: 'b0e6b0f299fc7b191fd427547c83dec9808087d390304a37a32bc0357e97c1b8',
  1500: 'd01ffc9b80629787f13d2b1c2f881f005bc0164433548e30f5c058ddee0bfc7b',
  1530: '984005809f085285a48318600e3a198274eb4679f5360ebfaead29da496e9f5b',
  1600: '7285c07eeedfda9048de5354ea1744d327b07614085e9696c5802bb54c86849c',
  1650: 'e691a3b5bab4ca7a0629daffaf8cd31731ee76ad390b19dffc1c267b139de4e2',
  1700: 'eb73d6b00e98205fb2082de050c35e4d698224b17849628d82584610186b88a4',
  1715: 'fdf5097dd21c30c9d7bfb1d5c2c2a11a5a39c397e6910116d7173580619f5b5a',
  1783: '7cfa92418a8628dffa41e386394b86fb6f93310e449d8261990f6903160c1060',
  1800: '51fcb6b1f1c361956a3fc24a9c646844ff88754842aa113780428fb4abcd5f2c',
  1815: 'fb654f734583f550904cfa45f361e395c1a488c4960050da2632cb2ac7d1cd1e',
  1878: 'e792520cd24cfb77b117d41533a59b0a5b82fc53a291fff1549ddc73e7f9a8b2',
  1880: '4751e30d881d60d31479f5d016ff4d9c1df47e9bb18efaa3a5086601f68f76dc',
});

// Which actor a polity's territory belongs to is data, not code:
// data/imports/basemaps-actors.json. Keyed by the source's own NAME, verbatim,
// because the source numbers nothing — there is no Gleditsch–Ward code here to
// survive a rename, and inventing one would put the mapping decision in code.
// The file declares `"keys": "name"` and tools/validate.mjs checks it as such.
export const MAP_FILE = 'imports/basemaps-actors.json';
export const REPORT_FILE = 'docs/basemaps-entities.md';

// --- pure helpers ---------------------------------------------------------

export function slug(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The snapshots to import, and what each one covers. A snapshot at year Y
// holds until the day before the next one — that is the whole of what a
// snapshot set can say — and the last one before CShapes holds until 1885.
//
// → { kept: [{ year, until }], dropped: [year] }. `dropped` is not a failure:
// it is the overlap rule applied, and the caller prints it.
export function snapshots(years = SOURCE_YEARS, { until = CSHAPES_FROM - 1 } = {}) {
  const ordered = [...years].sort((a, b) => a - b);
  const kept = [];
  const dropped = [];
  for (const [i, year] of ordered.entries()) {
    if (year >= until + 1) { dropped.push(year); continue; }
    const next = ordered[i + 1];
    kept.push({ year, until: next === undefined ? until : Math.min(next - 1, until) });
  }
  return { kept, dropped };
}

export const shardFile = (snapshot) => `geo/presences/${snapshot.year}-${snapshot.until}.json`;
export const sourceFileName = (year) => `world_${year}.geojson.gz`;

// The date a snapshot's features are held to, for a mapping entry's `splits`.
// The source dates nothing finer than a year, so the first day of it is the
// only date there is; a split is compared against this and against nothing
// else, which is why the file's dates are always the first of January.
export const dateOf = (year) => `${String(year).padStart(4, '0')}-01-01`;

// Which actor a name belongs to at a date: the entry's own actor, then the
// last split the date has reached. Pure, and the only place a mapping entry is
// read — `splits` is the same mechanism cshapes-actors.json has, cutting one
// source entity into more than one actor over its life.
export function actorFor(name, entry, date) {
  if (!entry) return { actor: slug(name), names: null, mapped: false };
  let chosen = { actor: entry.actor, names: entry.names ?? null };
  for (const split of entry.splits ?? []) {
    if (date >= split.from) chosen = { actor: split.actor, names: split.names ?? null };
  }
  return { ...chosen, mapped: true };
}

function record(id, kind, fields, { created }) {
  return {
    schema: 1,
    id,
    kind,
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ ...IMPORT_AUTHOR }],
    license: LICENSE,
    created,
    revised: null,
    // Written by the creator and by nothing else: this is what says the record
    // is the import's to rewrite, what lets rule 12 put a GPL licence on it,
    // and what a re-run reads to know its own records from somebody's.
    origin: { tool: ORIGIN_TOOL },
    review: { status: REVIEW_STATUS.draft },
    ...fields,
  };
}

export function sourceRecord({ created }) {
  return {
    schema: 1,
    id: SOURCE_ID,
    kind: 'source',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ ...IMPORT_AUTHOR }],
    // The record *about* the dataset is this project's own writing and is
    // licensed like every other record; the geometry it describes is not.
    license: 'CC-BY-SA-4.0',
    created,
    revised: null,
    origin: { tool: ORIGIN_TOOL },
    review: { status: REVIEW_STATUS.draft },
    type: 'dataset',
    creators: ['André Ourednik', 'the historical-basemaps contributors'],
    title: 'Historical Basemaps: historical boundaries of world countries and cultural regions',
    year: 2026,
    publisher: null,
    isbn: null,
    doi: null,
    url: SOURCE_HOME,
    accessed: '2026-09-16',
    repository: SOURCE_HOME,
    reference: null,
  };
}

// One actor summary, assembled from the dataset's own fields and saying so.
// Nothing here is a historical claim: it is which snapshots draw the name and
// what the dataset calls it, which is all an import is allowed to know. In
// particular the years are the years the *snapshots* cover and are never the
// polity's life — the source draws 1600 and 1650 and says nothing about 1625.
function actorSummary(sourceNames, years, until, renamed) {
  const drawn = years.length === 1
    ? `the snapshot for ${years[0]}`
    : `the snapshots for ${years.slice(0, -1).join(', ')} and ${years[years.length - 1]}`;
  const called = renamed
    ? ` The source calls it ${sourceNames.map((n) => `"${n}"`).join(', then ')}; the names on this record are the ones data/${MAP_FILE} gives it.`
    : sourceNames.length > 1
      ? ` The source spells it ${sourceNames.map((n) => `"${n}"`).join(', then ')}.`
      : '';
  return `A polity the Historical Basemaps dataset draws in ${drawn}. That dataset is a set of world border snapshots from antiquity to the twentieth century; it is its authors' work in progress and asks to be checked against other sources before use.${called} The interval on this record is the span those snapshots cover, ${years[0]} to ${until}, and not a claim about when this polity began or ended: a snapshot says where a border was drawn for one year, and the years between two of them are assumed. This record was written by the import from those fields and asserts nothing the dataset does not.`;
}

// The name a feature carries, or null where it carries none. 2,213 of the
// source's 8,327 polygons from 1400 on have `NAME: null`: ground the dataset
// draws and attributes to nobody. A presence says *who* held ground, so a
// polygon with no holder cannot become one; they are counted and dropped.
export const nameOf = (properties) => {
  const name = properties?.NAME;
  const text = name === null || name === undefined ? '' : String(name).trim();
  return text === '' ? null : text;
};

// The whole plan, from decoded snapshots to the exact set of files to write.
// Pure, so the tests can hand it a synthetic collection: `snapshots` is
// [{ year, until, features: [{ properties, geometry }] }], already simplified.
export function planImport(loaded, { created, map = {}, existingActors = new Set() } = {}) {
  const problems = [];
  const notes = [];
  const unnamed = new Map();
  // actor id → what is known about it across every snapshot it appears in.
  const actorsById = new Map();
  const presences = [];
  const shardFiles = new Map();
  // name → actor id, so a report can say which names were folded together.
  const nameToActor = new Map();

  for (const snapshot of loaded) {
    const date = dateOf(snapshot.year);
    // Resolved actor id → the outline pieces and names gathered for it in this
    // one snapshot. Grouped by *actor* and not by name, because two spellings
    // the mapping file (or the slug) sends to one actor are one polity holding
    // one piece of ground in one year, and two presences would say it twice.
    const held = new Map();
    let dropped = 0;
    for (const feature of snapshot.features) {
      const name = nameOf(feature.properties);
      if (name === null) { dropped += 1; continue; }
      if (!feature.geometry) continue;
      const entry = map[name] ?? null;
      const { actor, names: given, mapped } = actorFor(name, entry, date);
      if (!actor) {
        problems.push(`${snapshot.year}: "${name}" resolves to no actor id; give it an entry in data/${MAP_FILE}`);
        continue;
      }
      if (!held.has(actor)) held.set(actor, { actor, names: [], given, mapped, polygons: [] });
      const group = held.get(actor);
      if (!group.names.includes(name)) group.names.push(name);
      if (given && !group.given) group.given = given;
      for (const polygon of polygonsOf(feature.geometry)) group.polygons.push(polygon);
      if (!nameToActor.has(name)) nameToActor.set(name, actor);
    }
    unnamed.set(snapshot.year, dropped);

    const members = [];
    for (const actor of [...held.keys()].sort()) {
      const group = held.get(actor);
      const geometry = group.polygons.length === 1
        ? { type: 'Polygon', coordinates: group.polygons[0] }
        : { type: 'MultiPolygon', coordinates: group.polygons };
      const presenceId = `${actor}-${snapshot.year}`;
      const file = shardFile(snapshot);
      members.push({ key: actor, presence: presenceId, geometry });

      presences.push(record(presenceId, 'presence', {
        sources: [{ source: SOURCE_ID, locator: `world_${snapshot.year}.geojson, ${group.names.map((n) => `"${n}"`).join(', ')}` }],
        actor,
        // Never `state`. The source holds kingdoms, empires, confederations
        // and peoples under one field and labels none of them, so the one
        // honest answer for all of it is the word that claims least; calling
        // the Shuar a state, or the Ottoman Empire a culture, would be this
        // import deciding something its source does not say.
        presenceType: 'polity',
        // The source gives one undifferentiated SUBJECTO — "the colonial power
        // exercising authority… the name of the region otherwise" — and this
        // model asks which of colony, protectorate, mandate or occupation it
        // was. The source does not say, and the field is used loosely enough
        // that reading it as `colony` throughout would put "colony of the
        // Ottoman Empire" on the Crimean Khanate. So no dependency is written
        // at all; STATUS.md says how many features that leaves unsaid.
        dependencyOf: null,
        dependencyKind: null,
        when: { start: snapshot.year, end: snapshot.until, date },
        geometry: { files: [file], key: actor },
        capital: null,
        // A border drawn for one year and assumed until the next is a claim
        // and not a record, and `probable` is the word this schema has for
        // that. Every outline from this source carries it; the map hatches it
        // and about.html says why.
        confidence: 'probable',
      }, { created }));

      const known = actorsById.get(actor) ?? { actor, names: [], given: null, years: [], until: snapshot.until, mapped: group.mapped };
      for (const name of group.names) if (!known.names.includes(name)) known.names.push(name);
      if (group.given && !known.given) known.given = group.given;
      known.years.push(snapshot.year);
      known.until = snapshot.until;
      known.mapped = known.mapped || group.mapped;
      actorsById.set(actor, known);
    }

    members.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    shardFiles.set(shardFile(snapshot), {
      type: 'FeatureCollection',
      // Empty, and it is the honest empty. A shard's `arcs` are the inland
      // borders its territories share, and CShapes can name them because its
      // source is a topology: two neighbours walk one arc. GeoJSON has no
      // topology — a shared border is two independent rings — and two copies
      // of one boundary, simplified separately from different start points and
      // opposite windings, do not come out as the same line. Stroking them
      // would draw a border beside the border, which is the doubled-line fault
      // M39a and M39b were spent removing. So these territories are filled and
      // hatched and nothing of theirs is stroked.
      arcs: [],
      features: members.map((m) => ({
        type: 'Feature',
        id: m.key,
        properties: { presence: m.presence },
        geometry: m.geometry,
      })),
    });
  }

  // The actors, once each, out of everything the snapshots said about them.
  const actors = [];
  for (const id of [...actorsById.keys()].sort()) {
    const known = actorsById.get(id);
    // An actor the atlas already has a record for keeps that record: the
    // import reuses it and never rewrites somebody else's work.
    if (existingActors.has(id)) {
      notes.push(`note: ${known.names[0]} is data/actors/${id}.json, which the import reuses and does not rewrite`);
      continue;
    }
    const names = known.given ?? known.names;
    actors.push(record(id, 'actor', {
      sources: [{ source: SOURCE_ID, locator: `NAME ${known.names.map((n) => `"${n}"`).join(', ')}` }],
      // `polity` for the same reason `presenceType` is: the source does not
      // separate a state from a people and this import will not either.
      actorType: 'polity',
      names,
      summary: actorSummary(known.names, known.years, known.until, known.given !== null),
      when: { start: known.years[0], end: known.until },
      review: { status: REVIEW_STATUS.draft, flags: [IMPORTED_FLAG] },
    }, { created }));
  }

  // Two of the source's own names that came out as one actor. Not an error and
  // often right — "Maori" and "Māori" are one people spelled twice — but it is
  // a merge, and a merge this tool made by folding a string is a merge nobody
  // decided. Reported, so that whoever reads the file next can put it in
  // data/imports/basemaps-actors.json and make it a decision.
  const folded = new Map();
  for (const [name, actor] of nameToActor) {
    if (!folded.has(actor)) folded.set(actor, []);
    folded.get(actor).push(name);
  }
  const report = [...folded.entries()]
    .filter(([, names]) => names.length > 1 && !map[names[0]])
    .map(([actor, names]) => ({ actor, names: [...names].sort() }))
    .sort((a, b) => (a.actor < b.actor ? -1 : 1));

  return { source: sourceRecord({ created }), actors, presences, shardFiles, problems, notes, report, unnamed };
}

// A geometry's polygons, whatever shape it arrived in.
function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

// The report as a page: the names this import folded onto one actor by folding
// their spelling. Generated; the sentence at the top says so.
export function reportMarkdown(report, { generated, mapFile = MAP_FILE } = {}) {
  const rows = report.map((r) => `| \`${r.actor}\` | ${r.names.map((n) => `"${n}"`).join(' · ')} |`);
  return `# Historical Basemaps names that were folded together

Generated by \`node tools/import/basemaps.mjs --source <dir> --report\` on
${generated}. Do not edit it by hand: edit \`data/${mapFile}\` and run the
import again.

The source names its polities and numbers nothing, so an actor id is the name
folded — lowercased, unaccented, punctuation dropped. That folding sometimes
puts two of the source's own spellings on one actor. It is usually right and it
is never a decision this tool is entitled to make, so the ${report.length} below are listed
rather than assumed: giving either name an entry in \`data/${mapFile}\` turns the
fold into a mapping somebody signed, and giving them different actors undoes it.

| Actor now | The source's spellings |
|---|---|
${rows.join('\n')}
`;
}

// --- reading and writing --------------------------------------------------

export { sha256 };

// One snapshot's features, simplified and cut at the projection's seam.
//
// Every ring is taken down at the import's tolerance — or a sixth of its own
// extent, whichever is less, which is what keeps a small island a shape — and
// quantized to three decimals. Then the outline is cut at 30 degrees west,
// because the map wraps longitudes around a central meridian and an outline
// left lying across the meridian half a world away is drawn as a smear from
// one side of the picture to the other.
//
// Unlike the CShapes import there is no arc pass before this one: there are no
// arcs. See the `arcs: []` comment in planImport.
export function simplifyFeatures(collection, { tolerance = TOLERANCE, decimals = DECIMALS, minArea = MIN_AREA, seam = SEAM } = {}) {
  const out = [];
  for (const feature of collection.features ?? []) {
    const polygons = polygonsOf(feature.geometry);
    if (polygons.length === 0) { out.push({ properties: feature.properties, geometry: null }); continue; }
    const taken = polygons.map((polygon) => polygon.map((ring) => simplifyArc(ring, { tolerance, decimals })));
    const pruned = pruneGeometry(
      taken.length === 1 ? { type: 'Polygon', coordinates: taken[0] } : { type: 'MultiPolygon', coordinates: taken },
      { minArea },
    );
    const geometry = pruned ? pruneGeometry(splitAtMeridian(pruned, seam), { minArea }) : null;
    out.push({ properties: feature.properties, geometry });
  }
  return out;
}

const ownedBy = (json) => writtenBy(json, ORIGIN_TOOL);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

// Everything the import owns under a directory, everything it does not, and
// the records it made that a person has since signed. The third set is the
// point: a re-run rebuilds a record from the dataset and keeps only what
// `identityOnDisk` carries forward, so rewriting a signed record would erase
// the signature, the reviewer's corrections and their name.
async function survey(dir) {
  const owned = new Map();
  const foreign = new Map();
  const signed = new Map();
  if (!existsSync(dir)) return { owned, foreign, signed };
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const json = await readJson(path.join(dir, name));
    if (!ownedBy(json)) foreign.set(name, json);
    else if (isReviewed(json)) signed.set(name, json);
    else owned.set(name, json);
  }
  return { owned, foreign, signed };
}

const asText = (value) => `${JSON.stringify(value, null, 2)}\n`;
// Geometry is written the way the rest of data/geo/ is: compact, keys sorted,
// no indentation (STATUS.md, deviation 9).
const asCompact = (value) => JSON.stringify(sortKeys(value));

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
    return out;
  }
  return value;
}

// The mapping is data (see MAP_FILE). A missing file is not an error — every
// actor is then the source's own name, folded — but a broken one is.
async function readMap(dataDir) {
  const mapPath = path.join(dataDir, ...MAP_FILE.split('/'));
  if (!existsSync(mapPath)) {
    return { map: {}, note: `note: no data/${MAP_FILE}; every actor is the source's own name, folded` };
  }
  const loaded = await readJson(mapPath);
  if (loaded === null) return { map: {}, failed: `data/${MAP_FILE} is not valid JSON` };
  return { map: loaded.entries ?? {} };
}

// Which files this import owns under data/geo/presences/, and no others. The
// directory holds two imports since M43a and a sweep that deleted everything
// it did not produce would delete the other one's shards (deviation 721).
export const ownsShard = (name, kept = snapshots().kept) =>
  kept.some((snapshot) => shardFile(snapshot).endsWith(`/${name}`));

export async function runImport(sourceDir = DEFAULT_SOURCE, dataDir = DEFAULT_DATA, {
  today = new Date().toISOString().slice(0, 10), check = false, geometryOnly = false, only = null,
} = {}) {
  const notes = [];
  const { kept, dropped } = snapshots();
  if (dropped.length) {
    notes.push(`note: ${dropped.length} snapshot(s) at or after ${CSHAPES_FROM} dropped, CShapes covers them: ${dropped.join(', ')}`);
  }
  // `--only` is for a run that has already landed some periods and is
  // continuing: it narrows what is read and written and nothing else, so the
  // shards it does not name are left exactly as they are on disk.
  const wanted = only === null ? kept : kept.filter((s) => only.includes(s.year));
  if (only !== null) {
    const missing = only.filter((y) => !kept.some((s) => s.year === y));
    if (missing.length) return { failed: [`--only names ${missing.join(', ')}, which no kept snapshot has`], notes, written: [], removed: [] };
  }

  const loaded = [];
  let digests = {};
  for (const snapshot of wanted) {
    const file = path.join(sourceDir, sourceFileName(snapshot.year));
    if (!existsSync(file)) return { failed: [`no such source file: ${file}`], notes, written: [], removed: [] };
    const { json, digest, problem } = await readSourceJson(file, SOURCE_FILE_SHA256[snapshot.year] ?? null);
    if (problem) {
      if (check) return { failed: [problem], notes, written: [], removed: [] };
      notes.push(`warning: ${problem}`);
    }
    digests[snapshot.year] = digest;
    loaded.push({ ...snapshot, features: simplifyFeatures(json) });
  }

  const actorsDir = path.join(dataDir, 'actors');
  const presencesDir = path.join(dataDir, 'presences');
  const geoDir = path.join(dataDir, 'geo', 'presences');
  const actorSurvey = await survey(actorsDir);
  const presenceSurvey = await survey(presencesDir);
  const sourceOnDisk = await readJson(path.join(dataDir, 'sources', `${SOURCE_ID}.json`));

  const { map, note: mapNote, failed: mapFailed } = await readMap(dataDir);
  if (mapFailed) return { failed: [mapFailed], notes, written: [], removed: [] };
  if (mapNote) notes.push(mapNote);
  // An actor the mapping file names and somebody has already written is reused
  // untouched. A record the file does *not* name and that the import does not
  // own is never adopted, however well the folded name matches: an accidental
  // collision between a polity's name and somebody's record is a mapping
  // decision, and `claim` below stops the import until it is made.
  const named = new Set();
  for (const entry of Object.values(map)) {
    named.add(entry.actor);
    for (const split of entry.splits ?? []) named.add(split.actor);
  }
  const existingActors = new Set([...actorSurvey.foreign.keys()]
    .map((name) => name.slice(0, -'.json'.length))
    .filter((id) => named.has(id)));

  const plan = planImport(loaded, { created: today, map, existingActors });
  const failed = [...plan.problems];
  notes.push(...plan.notes);

  const writes = [];
  const claim = (dir, dirName, surveyed, records) => {
    for (const rec of records) {
      const file = `${rec.id}.json`;
      if (surveyed.foreign.has(file)) {
        failed.push(`data/${dirName}/${file} was not written by this import; give ${rec.id} an entry in data/${MAP_FILE} or rename it rather than overwriting somebody's record`);
        continue;
      }
      if (surveyed.signed.has(file)) {
        notes.push(`note: data/${dirName}/${file} has been reviewed and signed; the import will not rewrite it`);
        continue;
      }
      const previous = surveyed.owned.get(file);
      const created = surveyed.owned.get(file)?.created ?? today;
      const { record: merged } = mergeIdentity({ ...rec, created }, identityOnDisk(previous));
      writes.push({ file: path.join(dir, file), text: asText(merged) });
    }
  };
  if (!geometryOnly) {
    claim(actorsDir, 'actors', actorSurvey, plan.actors);
    claim(presencesDir, 'presences', presenceSurvey, plan.presences);

    const sourceCreated = ownedBy(sourceOnDisk) ? sourceOnDisk.created : sourceOnDisk ? null : today;
    if (sourceCreated === null) {
      failed.push(`data/sources/${SOURCE_ID}.json was not written by this import; the tool will not overwrite it`);
    } else if (isReviewed(sourceOnDisk)) {
      notes.push(`note: data/sources/${SOURCE_ID}.json has been reviewed and signed; the import will not rewrite it`);
    } else {
      writes.push({ file: path.join(dataDir, 'sources', `${SOURCE_ID}.json`), text: asText({ ...plan.source, created: sourceCreated }) });
    }
  }
  for (const [file, collection] of plan.shardFiles) {
    writes.push({ file: path.join(dataDir, ...file.split('/')), text: asCompact(collection) });
  }

  if (failed.length) return { failed, notes, written: [], removed: [] };

  for (const dir of [actorsDir, presencesDir, geoDir, path.join(dataDir, 'sources')]) await mkdir(dir, { recursive: true });
  const intended = new Set(writes.map((w) => w.file));
  const removed = [];
  // Files this import owns and no longer produces: a polity that left the
  // dataset, or a name the mapping file now sends elsewhere. Only on a full
  // run: `--only` says nothing about the periods it did not read.
  if (!geometryOnly && only === null) {
    for (const [dir, surveyed] of [[actorsDir, actorSurvey], [presencesDir, presenceSurvey]]) {
      for (const name of surveyed.owned.keys()) {
        const file = path.join(dir, name);
        if (!intended.has(file)) {
          await unlink(file);
          removed.push(path.relative(dataDir, file));
        }
      }
    }
  }
  if (only === null && existsSync(geoDir)) {
    for (const name of await readdir(geoDir)) {
      const file = path.join(geoDir, name);
      // `ownsShard` and not "everything I did not write": CShapes' five shards
      // live in this directory too.
      if (name.endsWith('.json') && ownsShard(name, kept) && !intended.has(file)) {
        await unlink(file);
        removed.push(path.relative(dataDir, file));
      }
    }
  }
  const written = [];
  for (const { file, text } of writes) {
    await writeFile(file, text, 'utf8');
    written.push(path.relative(dataDir, file));
  }
  return { failed: [], notes, written, removed, plan, digests, kept: wanted };
}

async function main(argv) {
  let source = DEFAULT_SOURCE;
  let dataDir = DEFAULT_DATA;
  let reportFile = null;
  let check = false;
  let geometryOnly = false;
  let only = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--source') source = path.resolve(argv[++i]);
    else if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--check') check = true;
    else if (argv[i] === '--geometry-only') geometryOnly = true;
    else if (argv[i] === '--only') only = argv[++i].split(',').map((y) => Number(y.trim()));
    else if (argv[i] === '--report') reportFile = path.join(ROOT, ...REPORT_FILE.split('/'));
    else if (argv[i] === '--report-to') reportFile = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const result = await runImport(source, dataDir, { check, geometryOnly, only });
  for (const note of result.notes) console.error(note);
  if (result.failed.length) {
    for (const problem of result.failed) console.error(`error: ${problem}`);
    return 1;
  }
  console.log(`imported Historical Basemaps at ${SOURCE_COMMIT.slice(0, 8)}: ${result.plan.actors.length} actors, ${result.plan.presences.length} presences, ${result.plan.shardFiles.size} shards`);
  for (const [file, collection] of result.plan.shardFiles) {
    const bytes = Buffer.byteLength(asCompact(collection));
    console.log(`  ${file}  ${collection.features.length} outlines  ${bytes.toLocaleString('en-US')} bytes`);
  }
  for (const [year, dropped] of result.plan.unnamed) {
    if (dropped) console.log(`  ${year}: ${dropped} polygon(s) the source names nobody for, dropped`);
  }
  console.log(`${result.written.length} file(s) written, ${result.removed.length} removed`);
  console.log(`${result.plan.report.length} name(s) folded onto an actor another name already had`);
  if (reportFile) {
    await mkdir(path.dirname(reportFile), { recursive: true });
    await writeFile(reportFile, reportMarkdown(result.plan.report, { generated: new Date().toISOString().slice(0, 10) }), 'utf8');
    console.log(`report written to ${path.relative(ROOT, reportFile)}`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

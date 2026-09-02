#!/usr/bin/env node
// CShapes 2.0 → actors, presences and geometry shards. Offline, zero
// dependencies, idempotent: it rewrites exactly the files it owns and
// refuses to touch a record whose authors do not name it.
//
//   node tools/import/cshapes.mjs --source <cshapes_2_gw.topojson> [--data <dir>] [--check]
//
// The dataset is CC BY-NC-SA 4.0, which data/LICENSE (CC BY-SA 4.0) cannot
// absorb, so everything this tool writes says so in its own `license` field
// and the geometry lives in its own directory under data/geo/LICENSE's
// CShapes paragraph. Nothing here is merged into a record somebody wrote.
//
// The ETH site that publishes CShapes is not reachable from every network;
// the CRAN package ships the same file and its GitHub mirror is:
//   git clone --depth 1 https://github.com/cran/cshapes
//   xz -dc cshapes/inst/extdata/cshapes_2_gw.topojson.xz > cshapes_2_gw.topojson
// SOURCE_FILE_SHA256 below is what that produces; --check verifies it and
// the tool warns, loudly, when the file it was given is a different one.

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decodeCollection } from './topojson.mjs';
import { simplifyArc, pruneGeometry } from './simplify.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');

// --- what was imported, exactly ------------------------------------------

export const SOURCE_ID = 'cshapes-2-0';
export const OBJECT_NAME = 'cshapes_2_gw';
export const SOURCE_FILE_SHA256 = '9f73468bb56aae6a6b22bb5e56bf5f3e013b9ee17c641aba37db97bcb5c1c3bc';
export const SOURCE_MIRROR = 'https://github.com/cran/cshapes/blob/master/inst/extdata/cshapes_2_gw.topojson.xz';
export const SOURCE_HOME = 'https://icr.ethz.ch/data/cshapes/';
export const PACKAGE_VERSION = '2.0';
// The last date the dataset covers. A feature that runs to it has not ended;
// it is where the data stops, which is a different thing, so those presences
// are left open rather than closed at 2019.
export const DATA_END = '2019-12-31';

export const IMPORT_AUTHOR = Object.freeze({ name: 'CShapes 2.0 import (tools/import/cshapes.mjs)', github: null });
export const LICENSE = 'CC-BY-NC-SA-4.0';

// Simplification: comparable in detail to the Natural Earth 110 m coastlines
// already under data/geo/, which is what the map draws these over. The
// busiest single year of the world comes to about 700 KB and no shard much
// exceeds a megabyte. MIN_AREA only has to be small enough to say "this ring
// is a line, not an island"; simplify.mjs keeps small islands by simplifying
// every arc at its own scale, which is what actually decides the size here.
export const TOLERANCE = 0.1;
export const DECIMALS = 3;
export const MIN_AREA = 1e-6;

// Period shards. A presence is written into every shard its interval
// touches, so the site loads exactly one file for the year on the slider.
// Five and not the four the brief suggested: 1914–1945 in one piece came to
// 1.4 MB, and the interwar years are where the entities are smallest and
// most numerous. Cutting further does not help — the 1914–1922 shard is
// large because the entities in it are large and span the whole window.
export const SHARDS = Object.freeze([
  Object.freeze({ from: 1886, to: 1913 }),
  Object.freeze({ from: 1914, to: 1932 }),
  Object.freeze({ from: 1933, to: 1945 }),
  Object.freeze({ from: 1946, to: 1974 }),
  Object.freeze({ from: 1975, to: 2019 }),
]);

// CShapes entities that the test dataset already has an actor for. Keyed by
// Gleditsch–Ward code, so a country renamed in the data still lands on the
// right record. Portugal is deliberately absent: 235 becomes a `portugal`
// state actor, never one of the regime actors (first-portuguese-republic,
// estado-novo, third-portuguese-republic), which are regimes *of* a state
// and not the state itself.
export const ACTOR_MAP = Object.freeze({
  750: 'republic-of-india',
  850: 'indonesia',
});

// Two `owner` codes in the file name no entity in it, and both are
// international administrations rather than states: 0 is the League of
// Nations over the Free City of Danzig (1919–1938) and 1 is the United
// Nations over West New Guinea (1962–1963). Their presences keep how they
// were held and get no sovereign on this map, which is the truth; inventing
// an actor for either would be inventing a state.
export const INTERNATIONAL_OWNERS = new Set(['0', '1']);

// CShapes `status` → how the territory was held. `independent` and the two
// `N/A` features (Morocco, 1904–1912) carry no dependency: N/A is read as
// independent, and said so in STATUS.md rather than guessed at.
export const DEPENDENCY_KIND = Object.freeze({
  colony: 'colony',
  protectorate: 'protectorate',
  mandate: 'mandate',
  occupied: 'occupied',
  independent: null,
  'N/A': null,
});

// --- pure helpers ---------------------------------------------------------

export function slug(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function yearOf(date) {
  return Number(String(date).slice(0, 4));
}

export function shardsTouched(start, end, shards = SHARDS) {
  const last = end ?? shards[shards.length - 1].to;
  return shards.filter((s) => s.from <= last && start <= s.to);
}

export function shardFile(shard) {
  return `geo/presences/${shard.from}-${shard.to}.json`;
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
    type: 'dataset',
    creators: [
      'Guy Schvitz',
      'Luc Girardin',
      'Seraina Rüegger',
      'Nils B. Weidmann',
      'Lars-Erik Cederman',
      'Kristian Skrede Gleditsch',
    ],
    title: 'Mapping the International System, 1886-2019: The CShapes 2.0 Dataset',
    year: 2022,
    publisher: 'Journal of Conflict Resolution',
    isbn: null,
    doi: '10.1177/00220027211013563',
    url: SOURCE_HOME,
    accessed: null,
    repository: null,
    reference: null,
  };
}

// One actor summary, assembled from the dataset's own fields and saying so.
// Nothing here is a historical claim: it is a count of rows and the dates on
// them, which is all an import is allowed to know.
function actorSummary(code, names, periods, capital) {
  const span = periods.end === null ? `from ${periods.start} to where the dataset stops, in 2019` : `from ${periods.start} to ${periods.end}`;
  const called = names.length > 1 ? ` It is called ${names.map((n) => `"${n}"`).join(', then ')} over that time.` : '';
  const seat = capital ? ` Its last capital in the dataset is ${capital.label}.` : '';
  return `Entity ${code} in the Gleditsch–Ward state list, as mapped by CShapes 2.0, a dataset of the borders and capitals of states and dependencies between 1886 and 2019. The dataset gives it ${periods.count} period${periods.count === 1 ? '' : 's'} of territorial validity, ${span}.${called}${seat} This record was written by the import from those fields and asserts nothing the dataset does not.`;
}

// The whole plan, from decoded features to the exact set of files to write.
// Pure, so the tests can hand it a synthetic collection: `features` is
// [{ properties, geometry }] as topojson.mjs returns, already simplified.
export function planImport(features, { created, shards = SHARDS, actorMap = ACTOR_MAP } = {}) {
  const problems = [];
  const byCode = new Map();
  for (const feature of features) {
    const p = feature.properties;
    const code = p.gwcode;
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code).push(feature);
  }
  for (const list of byCode.values()) {
    list.sort((a, b) => (a.properties.start < b.properties.start ? -1 : a.properties.start > b.properties.start ? 1 : a.properties.fid - b.properties.fid));
  }

  // Ids first, so a presence can name its sovereign's actor.
  const actorIds = new Map();
  const claimed = new Map();
  for (const code of [...byCode.keys()].sort((a, b) => a - b)) {
    const list = byCode.get(code);
    const id = actorMap[code] ?? slug(list[list.length - 1].properties.country_name);
    if (claimed.has(id)) problems.push(`two CShapes entities want the actor id "${id}": ${claimed.get(id)} and ${code}. Add one of them to ACTOR_MAP.`);
    claimed.set(id, code);
    actorIds.set(code, id);
  }

  const actors = [];
  const presences = [];
  const shardMembers = new Map(shards.map((s) => [shardFile(s), []]));
  const mapped = new Set(Object.values(actorMap));

  for (const code of [...byCode.keys()].sort((a, b) => a - b)) {
    const list = byCode.get(code);
    const id = actorIds.get(code);
    const last = list[list.length - 1].properties;
    const start = yearOf(list[0].properties.start);
    const open = list.some((f) => f.properties.end === DATA_END);
    const end = open ? null : Math.max(...list.map((f) => yearOf(f.properties.end)));
    const names = [...new Set(list.map((f) => f.properties.country_name))];
    const capital = last.capname
      ? { lon: last.caplong, lat: last.caplat, precision: 'city', label: last.capname }
      : null;

    // An entity the dataset already has a record for keeps that record: the
    // import reuses it and never rewrites somebody else's work.
    if (!mapped.has(id)) {
      actors.push(record(id, 'actor', {
        sources: [{ source: SOURCE_ID, locator: `gwcode ${code}` }],
        actorType: 'polity',
        names,
        summary: actorSummary(code, names, { start, end, count: list.length }, capital),
        when: { start, end },
        where: capital,
      }, { created }));
    }

    const used = new Set();
    for (const feature of list) {
      const p = feature.properties;
      if (!feature.geometry) {
        problems.push(`feature ${p.fid} (${p.country_name}, ${p.start}) has no polygon left after simplification`);
        continue;
      }
      const from = yearOf(p.start);
      const closes = p.end !== DATA_END;
      const to = closes ? yearOf(p.end) : null;
      // Two features of one entity starting in the same year get a letter;
      // the id stays a slug either way.
      let presenceId = `${id}-${from}`;
      for (let n = 1; used.has(presenceId); n += 1) presenceId = `${id}-${from}-${String.fromCharCode(98 + n - 1)}`;
      used.add(presenceId);

      const ownerCode = Number(p.owner);
      const dependent = Number.isInteger(ownerCode) && ownerCode !== code;
      const dependencyOf = dependent ? actorIds.get(ownerCode) ?? null : null;
      if (!Object.hasOwn(DEPENDENCY_KIND, p.status)) problems.push(`feature ${p.fid} has an unknown status "${p.status}"`);
      // The status is the reliable half. An owner code that names no entity
      // in the file is an international administration — the League of
      // Nations over Danzig, the United Nations over West New Guinea — so
      // the presence keeps how it was held and has no sovereign on this map.
      if (dependent && !dependencyOf && !INTERNATIONAL_OWNERS.has(p.owner)) {
        problems.push(`feature ${p.fid} (${p.country_name}) is owned by ${p.owner}, which is in no CShapes entity`);
      }
      const kind = dependent ? DEPENDENCY_KIND[p.status] ?? 'occupied' : null;
      if (dependent && DEPENDENCY_KIND[p.status] === null) {
        problems.push(`feature ${p.fid} (${p.country_name}) is owned by ${p.owner} but its status is "${p.status}"`);
      }

      const touched = shardsTouched(from, to, shards);
      const key = String(p.fid);
      for (const shard of touched) shardMembers.get(shardFile(shard)).push({ key, presence: presenceId, geometry: feature.geometry });

      const when = { start: from, end: to, date: p.start };
      if (closes) when.endDate = p.end;
      presences.push(record(presenceId, 'presence', {
        sources: [{ source: SOURCE_ID, locator: `fid ${p.fid}` }],
        actor: id,
        presenceType: 'state',
        dependencyOf,
        dependencyKind: kind,
        when,
        geometry: { files: touched.map(shardFile), key },
        capital: p.capname ? { lon: p.caplong, lat: p.caplat, precision: 'city', label: p.capname } : null,
        confidence: 'consensus',
      }, { created }));
    }
  }

  // "CShapes has exactly one feature per entity per interval": asserted, not
  // assumed. Two features of one entity may share the year a border moved in
  // — the model has no finer bound — but not a whole year of overlap.
  const byActor = new Map();
  for (const p of presences) {
    if (!byActor.has(p.actor)) byActor.set(p.actor, []);
    byActor.get(p.actor).push(p);
  }
  for (const list of byActor.values()) {
    const sorted = [...list].sort((a, b) => a.when.start - b.when.start);
    for (let i = 1; i < sorted.length; i += 1) {
      const previous = sorted[i - 1];
      const end = previous.when.end ?? Infinity;
      if (end > sorted[i].when.start) {
        problems.push(`"${previous.id}" (to ${previous.when.end}) and "${sorted[i].id}" (from ${sorted[i].when.start}) overlap by more than the year a border moved in`);
      }
    }
  }

  const shardFiles = new Map();
  for (const [file, members] of shardMembers) {
    members.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    shardFiles.set(file, {
      type: 'FeatureCollection',
      features: members.map((m) => ({ type: 'Feature', id: m.key, properties: { presence: m.presence }, geometry: m.geometry })),
    });
  }

  return { source: sourceRecord({ created }), actors, presences, shardFiles, problems };
}

// --- reading and writing --------------------------------------------------

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// Arcs are simplified before any polygon is decoded, so a border two
// countries share stays one line and they still meet along it.
export function simplifyTopology(topology, { tolerance = TOLERANCE, decimals = DECIMALS, minArea = MIN_AREA } = {}) {
  const simplified = { ...topology, arcs: topology.arcs.map((arc) => simplifyArc(arc, { tolerance, decimals })) };
  return decodeCollection(simplified, OBJECT_NAME)
    .map((f) => ({ properties: f.properties, geometry: pruneGeometry(f.geometry, { minArea }) }));
}

const ownedBy = (json) => Array.isArray(json?.authors) && json.authors.some((a) => a?.name === IMPORT_AUTHOR.name);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

// Everything the import owns under a directory, and everything it does not.
async function survey(dir) {
  const owned = new Map();
  const foreign = new Map();
  if (!existsSync(dir)) return { owned, foreign };
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const json = await readJson(path.join(dir, name));
    (ownedBy(json) ? owned : foreign).set(name, json);
  }
  return { owned, foreign };
}

const asText = (value) => `${JSON.stringify(value, null, 2)}\n`;
// Geometry is written the way the rest of data/geo/ is: compact, keys
// sorted, no indentation. Pretty-printing coordinates triples the size for
// no reader (STATUS.md, deviation 9).
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

export async function runImport(sourceFile, dataDir = DEFAULT_DATA, { today = new Date().toISOString().slice(0, 10), check = false } = {}) {
  const buffer = await readFile(sourceFile);
  const digest = sha256(buffer);
  const notes = [];
  if (digest !== SOURCE_FILE_SHA256) {
    const message = `the file at ${sourceFile} has sha256 ${digest}, not the ${SOURCE_FILE_SHA256} this import was written against`;
    if (check) return { failed: [message], notes, written: [], removed: [] };
    notes.push(`warning: ${message}`);
  }
  const topology = JSON.parse(buffer.toString('utf8'));
  const features = simplifyTopology(topology);

  // Idempotence: a record the import already owns keeps the date it was
  // first written, so running the tool twice changes nothing.
  const actorsDir = path.join(dataDir, 'actors');
  const presencesDir = path.join(dataDir, 'presences');
  const geoDir = path.join(dataDir, 'geo', 'presences');
  const actorSurvey = await survey(actorsDir);
  const presenceSurvey = await survey(presencesDir);
  const sourceOnDisk = await readJson(path.join(dataDir, 'sources', `${SOURCE_ID}.json`));
  const createdOf = (dir, id, fallback) => dir.owned.get(`${id}.json`)?.created ?? fallback;

  const plan = planImport(features, { created: today });
  const failed = [...plan.problems];

  // A record the import does not own is never overwritten, and a slug that
  // collides with somebody's record is a mapping decision, not a merge.
  const writes = [];
  const claim = (dir, dirName, surveyed, records) => {
    for (const rec of records) {
      const file = `${rec.id}.json`;
      if (surveyed.foreign.has(file)) {
        failed.push(`data/${dirName}/${file} was not written by the import; add ${rec.id} to ACTOR_MAP or rename it rather than overwriting somebody's record`);
        continue;
      }
      const created = createdOf(surveyed, rec.id, today);
      writes.push({ file: path.join(dir, file), text: asText({ ...rec, created }) });
    }
  };
  claim(actorsDir, 'actors', actorSurvey, plan.actors);
  claim(presencesDir, 'presences', presenceSurvey, plan.presences);

  const sourceCreated = ownedBy(sourceOnDisk) ? sourceOnDisk.created : sourceOnDisk ? null : today;
  if (sourceCreated === null) {
    failed.push(`data/sources/${SOURCE_ID}.json was not written by the import; the tool will not overwrite it`);
  } else {
    writes.push({ file: path.join(dataDir, 'sources', `${SOURCE_ID}.json`), text: asText({ ...plan.source, created: sourceCreated }) });
  }
  for (const [file, collection] of plan.shardFiles) {
    writes.push({ file: path.join(dataDir, ...file.split('/')), text: asCompact(collection) });
  }

  if (failed.length) return { failed, notes, written: [], removed: [] };

  for (const dir of [actorsDir, presencesDir, geoDir, path.join(dataDir, 'sources')]) await mkdir(dir, { recursive: true });
  const wanted = new Set(writes.map((w) => w.file));
  const removed = [];
  // Files the import owns and no longer produces: an entity that left the
  // dataset, or a shard cut that changed.
  for (const [dir, surveyed] of [[actorsDir, actorSurvey], [presencesDir, presenceSurvey]]) {
    for (const name of surveyed.owned.keys()) {
      const file = path.join(dir, name);
      if (!wanted.has(file)) {
        await unlink(file);
        removed.push(path.relative(dataDir, file));
      }
    }
  }
  if (existsSync(geoDir)) {
    for (const name of await readdir(geoDir)) {
      const file = path.join(geoDir, name);
      if (name.endsWith('.json') && !wanted.has(file)) {
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
  return { failed: [], notes, written, removed, plan, digest };
}

async function main(argv) {
  let source = null;
  let dataDir = DEFAULT_DATA;
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--source') source = path.resolve(argv[++i]);
    else if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--check') check = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  if (!source) {
    console.error('usage: node tools/import/cshapes.mjs --source <cshapes_2_gw.topojson> [--data <dir>] [--check]');
    console.error(`the file is inst/extdata/cshapes_2_gw.topojson.xz in the CRAN package, decompressed; sha256 ${SOURCE_FILE_SHA256}`);
    return 2;
  }
  const result = await runImport(source, dataDir, { check });
  for (const note of result.notes) console.error(note);
  if (result.failed.length) {
    for (const problem of result.failed) console.error(`error: ${problem}`);
    return 1;
  }
  const counts = {
    actors: result.plan.actors.length,
    presences: result.plan.presences.length,
    shards: result.plan.shardFiles.size,
  };
  console.log(`imported CShapes ${PACKAGE_VERSION} (sha256 ${result.digest.slice(0, 12)}…): ${counts.actors} actors, ${counts.presences} presences, ${counts.shards} shards`);
  console.log(`${result.written.length} file(s) written, ${result.removed.length} removed`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

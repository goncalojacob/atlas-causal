#!/usr/bin/env node
// CShapes 2.0 → actors, presences, geometry shards and the successions the
// split table states. Offline, zero dependencies, idempotent: it rewrites
// exactly the files it owns and refuses to touch a record whose authors do
// not name it.
//
//   node tools/import/cshapes.mjs --source <cshapes_2_gw.topojson[.gz]> [--data <dir>] [--check] [--geometry-only] [--report]
//   node tools/import/cshapes.mjs --relations [--data <dir>]
//
// --relations is the one pass that needs no topology: which entity code is
// two actors over its life is data/imports/cshapes-actors.json, and the cut
// it records is a `succeeded` relation between the two (docs/index2-plan.md,
// D12). The full import runs it too, so a re-import cannot leave the
// successions behind.
//
// Which actor a code's territory belongs to is not decided here: it is
// data/imports/cshapes-actors.json, and --report lists the codes that
// probably want an entry in it.
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
// The copy in this repository is vendor/cshapes/cshapes_2_gw.topojson.gz —
// a run has no network — and a --source ending in .gz is decompressed before
// it is hashed, so that sha256 is of the file as it was downloaded.

import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decodeCollection } from './topojson.mjs';
import { simplifyArc, pruneGeometry } from './simplify.mjs';
import { splitAtMeridian } from './geometry.mjs';
import { readSourceJson, sha256 } from './source.mjs';
import { SEAM } from '../../src/map/projection.js';
import { identityOnDisk, mergeIdentity } from './identity.mjs';
import { isReviewed, writtenBy, REVIEW_STATUS } from '../../src/origin.js';

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
// Which writer this is, in the envelope's own vocabulary. `authors` is
// attribution; `origin` is what the import, the licence rule and the review
// queue read.
export const ORIGIN_TOOL = 'cshapes';
export const LICENSE = 'CC-BY-NC-SA-4.0';
// What a reviewer is being told to look at: a record no person has read,
// written out of somebody else's database. The same flag the Wikidata
// import's records carry, because it means the same thing.
export const IMPORTED_FLAG = 'imported-facts';
// The relation a split states, and the only type this import writes.
export const RELATION_TYPE = 'succeeded';

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

// Which actor a CShapes entity's territory belongs to is data, not code:
// data/imports/cshapes-actors.json, keyed by Gleditsch–Ward code so a country
// renamed in the data still lands on the right record, validated by
// tools/validate.mjs, and correctable by anyone through a pull request. A code
// absent from the file gets an actor derived from its own name, and --report
// lists the ones that probably want an entry. Portugal is deliberately
// absent: 235 becomes a `portugal` state actor, never one of the regime
// actors (first-portuguese-republic, estado-novo, third-portuguese-republic),
// which are regimes *of* a state and not the state itself.
export const MAP_FILE = 'imports/cshapes-actors.json';
export const REPORT_FILE = 'docs/cshapes-entities.md';

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

// ISO dates are fixed-width, so string order is date order; only the day
// after a date needs real arithmetic.
export function dayAfter(date) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// A code's features cut into segments by the entry's splits: the first
// belongs to the entry's own actor, and each split starts a new one. Pure, so
// the tests can hand it a list of properties.
//
// A split date has to be a boundary the source itself draws — the day after
// some feature's end — because anything else would put a presence on one side
// of a date whose outline was drawn for the other. The dates the source gives
// are the only ones it can be held to.
export function segmentsFor(code, list, entry, problems = []) {
  const fallback = slug(list[list.length - 1].properties.country_name);
  const cuts = entry?.splits ?? [];
  const boundaries = list.slice(0, -1).map((f) => dayAfter(f.properties.end));
  for (const split of cuts) {
    if (boundaries.includes(split.from)) continue;
    const near = boundaries.length ? boundaries.join(', ') : 'none — the code has a single feature';
    problems.push(`entity ${code}: ${split.from} is not a boundary CShapes draws for it; the boundaries are ${near}`);
  }
  const segments = [
    { actor: entry?.actor ?? fallback, names: entry?.names ?? null, from: null, features: [] },
    ...cuts.map((split) => ({ actor: split.actor, names: split.names ?? null, from: split.from, features: [] })),
  ];
  for (const feature of list) {
    // The last segment whose date the feature has reached.
    let chosen = segments[0];
    for (const segment of segments) if (segment.from !== null && feature.properties.start >= segment.from) chosen = segment;
    chosen.features.push(feature);
  }
  for (const segment of segments) {
    if (segment.features.length === 0) problems.push(`entity ${code}: the segment for "${segment.actor}" has no feature in it`);
  }
  return segments.filter((s) => s.features.length > 0);
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
    // Written by the creator, and by nothing else: this is what says the
    // record is the import's to rewrite, what lets rule 12 open the NC hole
    // for it, and what a re-run reads to know its own records apart from
    // somebody's (health review A, findings 22 and 24).
    origin: { tool: ORIGIN_TOOL },
    // And nobody has read it. The import wrote no `review` at all, so every
    // territory it created was neither draft nor reviewed and the dashboard
    // never listed one (health review of 6 September, R10).
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
function actorSummary(code, sourceNames, periods, capital, split = null, renamed = false) {
  const span = periods.end === null ? `from ${periods.start} to where the dataset stops, in 2019` : `from ${periods.start} to ${periods.end}`;
  // Only the source's own names go in this sentence. When the mapping file
  // names the actor instead, saying "it is called" would put words in the
  // dataset's mouth: CShapes calls entity 750 "India" throughout.
  const called = renamed
    ? ` The source calls it ${sourceNames.map((n) => `"${n}"`).join(', then ')}; the names on this record are the ones data/${MAP_FILE} gives it.`
    : sourceNames.length > 1 ? ` It is called ${sourceNames.map((n) => `"${n}"`).join(', then ')} over that time.` : '';
  const seat = capital ? ` Its last capital in the dataset is ${capital.label}.` : '';
  // A code the mapping file cuts in two is two records here, and each says so
  // rather than claiming the whole code.
  const cut = split
    ? ` The code is mapped onto more than one actor (data/imports/cshapes-actors.json); this record holds the ${split.of === 1 ? 'periods before the first cut' : `periods from ${split.from}`}.`
    : '';
  return `Entity ${code} in the Gleditsch–Ward state list, as mapped by CShapes 2.0, a dataset of the borders and capitals of states and dependencies between 1886 and 2019. The dataset gives it ${periods.count} period${periods.count === 1 ? '' : 's'} of territorial validity, ${span}.${called}${seat}${cut} This record was written by the import from those fields and asserts nothing the dataset does not.`;
}

// Whether a feature is somebody else's ground, by the field that says so.
const isDependent = (p, code) => Number.isInteger(Number(p.owner)) && Number(p.owner) !== code;

// The whole plan, from decoded features to the exact set of files to write.
// Pure, so the tests can hand it a synthetic collection: `features` is
// [{ properties, geometry }] as topojson.mjs returns, already simplified.
export function planImport(features, { created, shards = SHARDS, map = {}, existingActors = new Set() } = {}) {
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
  const codes = [...byCode.keys()].sort((a, b) => a - b);
  const entryOf = (code) => map[String(code)] ?? null;

  // Segments first, so a presence can name the actor its sovereign was at the
  // date it was held — a code split in two has a different sovereign record
  // on either side of the cut.
  const segmentsByCode = new Map();
  const claimed = new Map();
  for (const code of codes) {
    const segments = segmentsFor(code, byCode.get(code), entryOf(code), problems);
    segmentsByCode.set(code, segments);
    for (const segment of segments) {
      if (claimed.has(segment.actor)) {
        problems.push(`two CShapes segments want the actor id "${segment.actor}": ${claimed.get(segment.actor)} and ${code}. Give one of them an entry in ${MAP_FILE}.`);
      }
      claimed.set(segment.actor, code);
    }
  }
  // Who held a code at a given date, as an actor id. The last segment whose
  // date the feature has reached; null when the code is not in the file.
  const actorAt = (code, date) => {
    const segments = segmentsByCode.get(code);
    if (!segments) return null;
    let chosen = segments[0];
    for (const segment of segments) if (segment.from !== null && date >= segment.from) chosen = segment;
    return chosen?.actor ?? null;
  };

  // Codes that carry both a dependency and an independent state under one id
  // and have no cut in the mapping file: the list the owner splits from, in
  // batches, by editing that file. Reported, never guessed at.
  const report = [];
  for (const code of codes) {
    const list = byCode.get(code);
    if ((entryOf(code)?.splits ?? []).length) continue;
    const held = list.filter((f) => isDependent(f.properties, code));
    const own = list.filter((f) => !isDependent(f.properties, code));
    if (!held.length || !own.length) continue;
    report.push({
      code,
      actor: segmentsByCode.get(code)[0].actor,
      name: list[list.length - 1].properties.country_name,
      periods: list.length,
      dependent: held.length,
      independent: own.length,
      // The date the source first shows it holding its own ground, which is
      // where a split would go.
      firstIndependent: own[0].properties.start,
      lastDependent: held[held.length - 1].properties.end,
      status: [...new Set(held.map((f) => f.properties.status))].sort(),
    });
  }

  const actors = [];
  const presences = [];
  const shardMembers = new Map(shards.map((s) => [shardFile(s), []]));

  for (const code of codes) {
    const segments = segmentsByCode.get(code);
    for (const [index, segment] of segments.entries()) {
      const list = segment.features;
      const id = segment.actor;
      const last = list[list.length - 1].properties;
      const start = yearOf(list[0].properties.start);
      const open = list.some((f) => f.properties.end === DATA_END);
      const end = open ? null : Math.max(...list.map((f) => yearOf(f.properties.end)));
      // The mapping file may name the actor better than the source does:
      // CShapes calls entity 750 "India" from 1886, colony and republic alike.
      const sourceNames = [...new Set(list.map((f) => f.properties.country_name))];
      const names = segment.names ?? sourceNames;
      const capital = last.capname
        ? { lon: last.caplong, lat: last.caplat, precision: 'city', label: last.capname }
        : null;

      // An actor the atlas already has a record for keeps that record: the
      // import reuses it and never rewrites somebody else's work.
      if (!existingActors.has(id)) {
        actors.push(record(id, 'actor', {
          sources: [{ source: SOURCE_ID, locator: `gwcode ${code}` }],
          actorType: 'polity',
          names,
          summary: actorSummary(code, sourceNames, { start, end, count: list.length }, capital,
            segments.length > 1 ? { of: index + 1, from: segment.from } : null,
            segment.names !== null),
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
        const dependent = isDependent(p, code);
        const dependencyOf = dependent ? actorAt(ownerCode, p.start) : null;
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

  return { source: sourceRecord({ created }), actors, presences, shardFiles, problems, report };
}

// --- the successions the split table states -------------------------------
//
// `entries.<code>.actor` is the colony and `entries.<code>.splits[].actor` the
// state after it, with `from` the day the source draws the cut. That is a
// `succeeded` relation and nothing else — the same pair of ids, the same
// date, already decided by whoever wrote the entry — and 79 of them were
// latent in the file while `?actor=angola` opened on an empty card (health
// review B, finding 28; docs/index2-plan.md D12).
//
// Nothing here is a historical claim of this run's: the pair is the mapping
// file's, the date is the source's, and the note is the entry's own, copied
// verbatim because it is where the table says a cut is doubtful — Cuba's
// says the split date is earlier than the state's first independent date,
// and a reviewer must see that beside the relation it produced
// (docs/index2/i8-brief.md, A2). Pure, like planImport.
export const relationId = (from, to) => `${from}--${to}--${RELATION_TYPE}`;

export function planRelations(map = {}, { created } = {}) {
  const relations = [];
  const problems = [];
  // Numeric where the codes are numbers, so the report reads in the order the
  // file does; the writes themselves are one file each and order-free.
  const codes = Object.keys(map).sort((a, b) => (Number(a) - Number(b)) || (a < b ? -1 : a > b ? 1 : 0));
  for (const code of codes) {
    const entry = map[code];
    for (const split of entry?.splits ?? []) {
      const from = entry.actor;
      const to = split.actor;
      if (typeof from !== 'string' || typeof to !== 'string' || !from || !to) {
        problems.push(`entity ${code}: a split with no actor id on one side cannot become a relation`);
        continue;
      }
      if (from === to) {
        problems.push(`entity ${code}: the split names "${from}" on both sides; a succession runs between two different actors`);
        continue;
      }
      const year = yearOf(split.from);
      if (!Number.isInteger(year) || year === 0) {
        problems.push(`entity ${code}: "${split.from}" is not a date a year can be read off`);
        continue;
      }
      relations.push(record(relationId(from, to), 'relation', {
        // Drafted, and flagged as somebody else's facts: review.html is
        // where a person reads it, and may retract it and write a CC BY-SA
        // relation from another source instead.
        review: { status: REVIEW_STATUS.draft, flags: [IMPORTED_FLAG] },
        sources: [{ source: SOURCE_ID, locator: `gwcode ${code}` }],
        from,
        to,
        type: RELATION_TYPE,
        // A succession is a moment: one year at both bounds, with the day
        // the source draws the cut beside it (i8-brief, A1).
        when: { start: year, end: year, date: split.from },
        ...(typeof entry.note === 'string' && entry.note.trim() !== '' ? { note: entry.note } : {}),
      }, { created }));
    }
  }
  return { relations, problems };
}

// The report as a page, so the owner can work down it in batches: every code
// the source gives both as somebody's dependency and as its own state, that
// the mapping file does not yet cut. It is generated; the sentence at the top
// says so, and nothing in it is written by hand.
export function reportMarkdown(report, { generated, mapFile = MAP_FILE } = {}) {
  const rows = [...report].sort((a, b) => a.code - b.code).map((r) => `| ${r.code} | \`${r.actor}\` | ${r.name} | ${r.periods} | ${r.dependent} (${r.status.join(', ')}) | ${r.firstIndependent} | ${r.lastDependent} |`);
  return `# CShapes entities that could be split

Generated by \`node tools/import/cshapes.mjs --source <file> --report\` on
${generated}. Do not edit it by hand: edit \`data/${mapFile}\` and run the
import again.

CShapes gives some entities under one Gleditsch–Ward code for their whole
life, dependency and independent state alike. This atlas can hold such a code
as one actor or as two, and the mapping file decides which: a \`splits\` entry
cuts the code's outlines by date into different actors. The ${report.length} codes below
are the ones that file does **not** yet cut and that the source shows in both
conditions — the list to work down, in batches, by editing it. Nothing here is
a recommendation: which of them are two things and which are one is a
historical judgement, and the import does not make it.

"First independent" is the date the source first gives the code its own
ground, and is the boundary a split would use; a split date must be a
boundary CShapes itself draws or the import refuses it.

| Code | Actor now | Name in the source | Periods | Held by another | First independent | Last held |
|---|---|---|---|---|---|---|
${rows.join('\n')}
`;
}

// --- reading and writing --------------------------------------------------

export { sha256 };

// Arcs are simplified before any polygon is decoded, so a border two
// countries share stays one line and they still meet along it.
//
// Then every outline is cut at the projection's seam (geometry.mjs), because
// the map wraps longitudes around a central meridian and an outline left
// lying across the meridian half a world away from it is drawn as a smear
// from one side of the picture to the other. The cut runs after the decode
// and not on the arcs: two countries that share a border across the seam are
// cut at the same longitude by the same arithmetic, so they still meet along
// it, and an arc does not know which side of a polygon it is on.
export function simplifyTopology(topology, { tolerance = TOLERANCE, decimals = DECIMALS, minArea = MIN_AREA, seam = SEAM } = {}) {
  const simplified = { ...topology, arcs: topology.arcs.map((arc) => simplifyArc(arc, { tolerance, decimals })) };
  return decodeCollection(simplified, OBJECT_NAME)
    .map((f) => ({
      properties: f.properties,
      geometry: pruneGeometry(splitAtMeridian(pruneGeometry(f.geometry, { minArea }), seam), { minArea }),
    }));
}

// The import's own records, by what created them rather than by a name in
// `authors` (health review A, finding 22). A record it does not own it never
// overwrites — and a record it *does* own but that somebody has since read
// and signed it does not overwrite either, because a re-run drops every field
// outside ENRICHABLE and a signature is not one of them (review of the health
// plan, finding 4).
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
// the signature, the reviewer's corrections and their name — which is exactly
// what an automated writer must never do (plan decision 2). It reports and
// leaves the file alone instead.
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

// The mapping is data (see MAP_FILE). A missing file is not an error — the
// import then derives every actor from the source's own names — but a broken
// one is, because carrying on would silently write the wrong actors.
// → { map, note, failed }: exactly one of `note` and `failed` where there is
// anything to say.
async function readMap(dataDir) {
  const mapPath = path.join(dataDir, ...MAP_FILE.split('/'));
  if (!existsSync(mapPath)) {
    return { map: {}, note: `note: no data/${MAP_FILE}; every actor is derived from the source's own names` };
  }
  const loaded = await readJson(mapPath);
  if (loaded === null) return { map: {}, failed: `data/${MAP_FILE} is not valid JSON` };
  return { map: loaded.entries ?? {} };
}

// The successions to write, less the ones already on disk. This pass only
// ever *creates*: a relation whose id exists is reported and left alone
// whatever its standing — hand-written, imported, signed or retracted —
// because the id is derived from the pair and the type, so a file under that
// name is already somebody's answer to the same question. That is
// identity.mjs's rule applied to a record rather than to a field, and it is
// what makes a second pass write nothing.
export async function relationWrites(dataDir, map, { today, notes = [], problems = [] } = {}) {
  const dir = path.join(dataDir, 'relations');
  const plan = planRelations(map, { created: today });
  problems.push(...plan.problems);
  const existing = existsSync(dir)
    ? new Set((await readdir(dir)).filter((name) => name.endsWith('.json')))
    : new Set();
  const writes = [];
  for (const rec of plan.relations) {
    const file = `${rec.id}.json`;
    if (existing.has(file)) {
      notes.push(`note: data/relations/${file} already exists; the import reports it and leaves it alone`);
      continue;
    }
    writes.push({ file: path.join(dir, file), text: asText(rec) });
  }
  return writes;
}

// --relations: the successions on their own, with no topology to decode. The
// split table is the whole input, so this runs where the 7.6 MB source file
// is not — which is every sandbox but the one the geometry was imported in.
export async function runRelations(dataDir = DEFAULT_DATA, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const notes = [];
  const problems = [];
  const { map, note, failed: broken } = await readMap(dataDir);
  if (broken) return { failed: [broken], notes, written: [] };
  if (note) notes.push(note);
  const writes = await relationWrites(dataDir, map, { today, notes, problems });
  if (problems.length) return { failed: problems, notes, written: [] };
  if (writes.length) await mkdir(path.join(dataDir, 'relations'), { recursive: true });
  const written = [];
  for (const { file, text } of writes) {
    await writeFile(file, text, 'utf8');
    written.push(path.relative(dataDir, file));
  }
  return { failed: [], notes, written };
}

// `geometryOnly` writes the shards and nothing else: the outlines are cut at
// the projection's seam and every record the import owns is left exactly as
// it is on disk. It is how M39a recut the borders without editing a record,
// and it is what `data/geo/LICENSE` names as the way to regenerate them.
// The plan is still built in full and its problems are still reported — a
// geometry pass that hides a broken mapping file would be worse than none.
export async function runImport(sourceFile, dataDir = DEFAULT_DATA, { today = new Date().toISOString().slice(0, 10), check = false, geometryOnly = false } = {}) {
  // A `--source` ending in `.gz` is decompressed and the sha256 is of the
  // decompressed bytes, so SOURCE_FILE_SHA256 and the hash data/geo/LICENSE
  // records are the file as it was downloaded either way (review of the map
  // block, finding 2; the brief's A1). The file in the repository is
  // vendor/cshapes/cshapes_2_gw.topojson.gz.
  const { json: topology, digest, problem } = await readSourceJson(sourceFile, SOURCE_FILE_SHA256);
  const notes = [];
  if (problem) {
    if (check) return { failed: [problem], notes, written: [], removed: [] };
    notes.push(`warning: ${problem}`);
  }
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

  const { map, note: mapNote, failed: mapFailed } = await readMap(dataDir);
  if (mapFailed) return { failed: [mapFailed], notes, written: [], removed: [] };
  if (mapNote) notes.push(mapNote);
  // An actor the mapping file names and somebody has already written is
  // reused untouched; one the file names that nobody has written yet is
  // created here, like any other. A record the file does *not* name and that
  // the import does not own is never adopted, however well the slug matches:
  // an accidental collision between a country's name and somebody's record is
  // a mapping decision, and `claim` below stops the whole import until it is
  // made (STATUS.md, deviation 45).
  const named = new Set();
  for (const entry of Object.values(map)) {
    named.add(entry.actor);
    for (const split of entry.splits ?? []) named.add(split.actor);
  }
  const existingActors = new Set([...actorSurvey.foreign.keys()]
    .map((name) => name.slice(0, -'.json'.length))
    .filter((id) => named.has(id)));

  const plan = planImport(features, { created: today, map, existingActors });
  const failed = [...plan.problems];

  // A record the import does not own is never overwritten, and a slug that
  // collides with somebody's record is a mapping decision, not a merge.
  const writes = [];
  const claim = (dir, dirName, surveyed, records) => {
    for (const rec of records) {
      const file = `${rec.id}.json`;
      if (surveyed.foreign.has(file)) {
        failed.push(`data/${dirName}/${file} was not written by the import; give ${rec.id} an entry in data/${MAP_FILE} or rename it rather than overwriting somebody's record`);
        continue;
      }
      // Signed: the import made it, a person has since read it, and from
      // that moment it is theirs. Skipped and reported, not failed — a
      // review that has begun should not stop the other 1039 territories
      // from being brought up to date.
      if (surveyed.signed.has(file)) {
        notes.push(`note: data/${dirName}/${file} has been reviewed and signed; the import will not rewrite it`);
        continue;
      }
      const previous = surveyed.owned.get(file);
      const created = createdOf(surveyed, rec.id, today);
      // A Wikidata id somebody added between two runs of this import is not
      // this import's to throw away, any more than `created` is: an actor it
      // owns keeps the identity fields it already carries.
      const { record } = mergeIdentity({ ...rec, created }, identityOnDisk(previous));
      writes.push({ file: path.join(dir, file), text: asText(record) });
    }
  };
  if (!geometryOnly) {
    claim(actorsDir, 'actors', actorSurvey, plan.actors);
    claim(presencesDir, 'presences', presenceSurvey, plan.presences);
    // The successions the same mapping file states, so that a re-import cannot
    // leave them behind. They are not `claim`ed: a relation is never rewritten,
    // only created (see relationWrites).
    writes.push(...await relationWrites(dataDir, map, { today, notes, problems: failed }));

    const sourceCreated = ownedBy(sourceOnDisk) ? sourceOnDisk.created : sourceOnDisk ? null : today;
    if (sourceCreated === null) {
      failed.push(`data/sources/${SOURCE_ID}.json was not written by the import; the tool will not overwrite it`);
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

  for (const dir of [actorsDir, presencesDir, geoDir, path.join(dataDir, 'sources'), path.join(dataDir, 'relations')]) await mkdir(dir, { recursive: true });
  const wanted = new Set(writes.map((w) => w.file));
  const removed = [];
  // Files the import owns and no longer produces: an entity that left the
  // dataset, or a shard cut that changed.
  for (const [dir, surveyed] of geometryOnly ? [] : [[actorsDir, actorSurvey], [presencesDir, presenceSurvey]]) {
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
  let reportFile = null;
  let check = false;
  let geometryOnly = false;
  let relationsOnly = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--source') source = path.resolve(argv[++i]);
    else if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--check') check = true;
    else if (argv[i] === '--geometry-only') geometryOnly = true;
    else if (argv[i] === '--relations') relationsOnly = true;
    else if (argv[i] === '--report') reportFile = path.join(ROOT, ...REPORT_FILE.split('/'));
    else if (argv[i] === '--report-to') reportFile = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  if (relationsOnly) {
    const result = await runRelations(dataDir);
    for (const note of result.notes) console.error(note);
    if (result.failed.length) {
      for (const problem of result.failed) console.error(`error: ${problem}`);
      return 1;
    }
    console.log(`${result.written.length} succession(s) written from data/${MAP_FILE}`);
    return 0;
  }
  if (!source) {
    console.error('usage: node tools/import/cshapes.mjs --source <cshapes_2_gw.topojson[.gz]> [--data <dir>] [--check] [--geometry-only] [--report | --report-to <file>]');
    console.error('       node tools/import/cshapes.mjs --relations [--data <dir>]');
    console.error('the file in this repository is vendor/cshapes/cshapes_2_gw.topojson.gz');
    console.error(`it is inst/extdata/cshapes_2_gw.topojson.xz in the CRAN package, decompressed; sha256 ${SOURCE_FILE_SHA256}`);
    return 2;
  }
  const result = await runImport(source, dataDir, { check, geometryOnly });
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
  // Every code the source gives both as a dependency and as its own state
  // that the mapping file does not cut: what the owner splits from next.
  for (const row of result.plan.report) {
    console.log(`could be split: ${row.code} ${row.actor} (${row.name}) — independent from ${row.firstIndependent}, held by another until ${row.lastDependent}`);
  }
  console.log(`${result.plan.report.length} entit${result.plan.report.length === 1 ? 'y' : 'ies'} could be split`);
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

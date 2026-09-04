#!/usr/bin/env node
// Wikidata → identifiers on the records this atlas already has, and records
// for the items somebody has asked for. Zero dependencies.
//
//   node tools/import/wikidata.mjs --reconcile   [--data <dir>] [--batch 25] [--budget 400]
//   node tools/import/wikidata.mjs --import      [--data <dir>] [--batch 25] [--budget 400]
//   node tools/import/wikidata.mjs --candidates  [--to docs/m18-candidates.md]
//
// This sandbox has no network and neither does the site: the one place this
// tool runs for real is .github/workflows/import-wikidata.yml, on a runner,
// on a branch called import/…. Everything here is therefore written around an
// injectable fetch layer (`fetchJson`), and node --test runs it against the
// recorded responses under tests/fixtures/wikidata/.
//
// Three things this tool will not do, because they are the reason the atlas
// exists rather than a way of filling it:
//
//   1. It never writes an edge. A causal link is an argument and a person
//      makes it; nothing in Wikidata's shape is one.
//   2. It is additive per field. On a record that already exists it writes
//      `wikidata`, `wikipedia` and `sitelinks` only where they are absent,
//      never modifies a non-empty value of any field, and never touches
//      summary, title, when, place, actors or sources. Enrichment adds no
//      `authors` entry either: putting the import's name on somebody's
//      record because it added an identifier would be claiming their work.
//   3. It guesses at nothing. Which Wikidata class means an event of this
//      atlas, and which means a person rather than an institution, is an
//      editorial decision and lives in data/imports/wikidata-seeds.json →
//      `classes`. An item whose classes are not in that file is listed in
//      the report with its labels, for somebody to decide, and no record is
//      created for it.
//
// What it reads per item: labels and descriptions (en, pt), P31, the date
// properties, P625, P276/P17/P131, P710, sitelinks, and the Wikipedia lead
// section through the REST summary endpoint. Leads are cached under
// tools/import/cache/wikipedia/, which is not data/, is never published
// (deploy.yml removes it before the Pages upload) and is checked against
// schema/v1/wikipedia-lead.json like everything else.

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRegionDeriver } from '../../src/util/geo.js';
import { IMPORT_AUTHORS } from '../../src/validate/rules.js';
import { mergeIdentity } from './identity.mjs';
import { readRecords, readRegionPolygons } from '../lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');

// --- what this import is ---------------------------------------------------

// Wikimedia asks every automated reader to say who it is and where to
// complain. A tool that does not is one they are right to block.
export const USER_AGENT = 'atlas-causal import (+https://github.com/goncalojacob/atlas-causal)';

export const SOURCE_ID = 'wikidata';
// One source record per edition, because the English and the Portuguese
// Wikipedia are not translations of each other and citing "Wikipedia" would
// hide which of them was read.
export const WIKIPEDIA_SOURCE = Object.freeze({ en: 'wikipedia-en', pt: 'wikipedia-pt' });
export const LANGUAGES = Object.freeze(['en', 'pt']);

export const IMPORT_AUTHOR = Object.freeze({ name: 'Wikidata import (tools/import/wikidata.mjs)', github: null });
export const IMPORTED_FLAG = 'imported-facts';
export const LICENSE = 'CC-BY-SA-4.0';

export const SEEDS_FILE = 'imports/wikidata-seeds.json';
export const STATE_FILE = 'imports/wikidata-state.json';
export const LEAD_CACHE = path.join('tools', 'import', 'cache', 'wikipedia');
export const CANDIDATES_FILE = path.join('docs', 'wikidata-candidates.md');
// Where --reconcile leaves everything it would not decide. A person reads it
// and either matches the record by hand or extends the class table; the tool
// never resolves an ambiguity by picking the first candidate.
export const AMBIGUOUS_FILE = path.join('docs', 'm17-ambiguous.md');
// How many of the search's answers the list shows per record. Three is what
// somebody can read down a page of; the rest are counted, not printed.
export const AMBIGUOUS_SHOWN = 3;

export const API = 'https://www.wikidata.org/w/api.php';
export const SPARQL = 'https://query.wikidata.org/sparql';

// The properties read, named here so the header comment and the code cannot
// drift apart. Nothing else is looked at: an import that reads everything is
// an import nobody can review.
export const PROPERTIES = Object.freeze({
  instanceOf: 'P31',
  start: 'P580',
  end: 'P582',
  pointInTime: 'P585',
  inception: 'P571',
  dissolved: 'P576',
  born: 'P569',
  died: 'P570',
  coordinate: 'P625',
  location: 'P276',
  country: 'P17',
  administrative: 'P131',
  participant: 'P710',
});

// Batches of 25: the size wbgetentities takes for anonymous callers, and
// small enough that a job cut off mid-run has lost at most 25 items of work.
export const BATCH = 25;
// Serial requests, one a second, and `maxlag` on top so that a replication
// lag on their side slows us rather than being ignored. Neither is required
// of us; both are what a good guest does.
export const DELAY_MS = 1000;
export const MAXLAG = 5;
export const RETRIES = 4;
export const BACKOFF_MS = 2000;
// A ceiling the tool refuses to cross, printed as it goes. A runaway loop on
// somebody else's servers is the failure mode that gets a project blocked,
// and it is better to stop halfway with a cursor than to keep going.
export const CALL_BUDGET = 400;

export const MODES = Object.freeze(['reconcile', 'import', 'candidates']);

// Sitelinks that are not language editions of Wikipedia. `sitelinks` is
// meant to be "how many language editions have an article", so Commons,
// Wikispecies and the rest are not counted; the suffix is what separates a
// language edition from a sister project.
export const SITE = /^([a-z0-9_]+)wiki$/;
export const NOT_A_LANGUAGE = Object.freeze(new Set(['commonswiki', 'specieswiki', 'metawiki', 'wikidatawiki', 'sourceswiki', 'mediawikiwiki', 'incubatorwiki', 'outreachwiki', 'foundationwiki']));

// --- URLs ------------------------------------------------------------------

export function entitiesUrl(qids, { api = API, languages = LANGUAGES } = {}) {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: qids.join('|'),
    props: 'labels|descriptions|aliases|claims|sitelinks',
    languages: languages.join('|'),
    format: 'json',
    formatversion: '2',
    maxlag: String(MAXLAG),
  });
  return `${api}?${params}`;
}

export function searchUrl(term, { api = API, language = 'en', limit = 10 } = {}) {
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: term,
    language,
    uselang: language,
    type: 'item',
    limit: String(limit),
    format: 'json',
    formatversion: '2',
    maxlag: String(MAXLAG),
  });
  return `${api}?${params}`;
}

export function sparqlUrl(query, { endpoint = SPARQL } = {}) {
  return `${endpoint}?${new URLSearchParams({ query, format: 'json' })}`;
}

// The REST summary endpoint rather than the parse API: it returns the lead
// as plain text and the revision it came from, which is exactly the envelope
// the cache stores and nothing more.
export function summaryUrl(lang, title) {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(String(title).replace(/ /g, '_'))}`;
}

export function articleUrl(lang, title) {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g, '_'))}`;
}

export function historyUrl(lang, title) {
  return `https://${lang}.wikipedia.org/w/index.php?${new URLSearchParams({ title: String(title).replace(/ /g, '_'), action: 'history' })}`;
}

// --- the fetch layer -------------------------------------------------------

// Thrown by the default fetcher so that the retry policy can see the status
// without parsing a message. Tests throw it too.
export class HttpError extends Error {
  constructor(status, url) {
    super(`${url}: ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class BudgetError extends Error {
  constructor(budget) {
    super(`the call budget of ${budget} requests is spent; the cursor is written, run again to continue`);
    this.name = 'BudgetError';
  }
}

// 429 is being asked to slow down and 503 is being told to come back later.
// Both are worth waiting for; a 404 is not, and neither is a 400 — retrying
// a request they have already refused to answer is just noise on their side.
export function isRetryable(error) {
  if (error?.name === 'BudgetError') return false;
  if (error?.status === 429 || error?.status === 503) return true;
  return error?.code === 'maxlag';
}

export function backoffMs(attempt, base = BACKOFF_MS) {
  return base * 2 ** attempt;
}

export const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

async function defaultFetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new HttpError(response.status, url);
  return response.json();
}

// Serial, delayed, budgeted, retrying. Everything that talks to somebody
// else's server goes through this one function, so the manners of this import
// are in one place and can be read in one sitting.
export function createFetcher({
  fetchJson = defaultFetchJson,
  delay = sleep,
  delayMs = DELAY_MS,
  budget = CALL_BUDGET,
  retries = RETRIES,
  onCall = null,
} = {}) {
  let calls = 0;
  let first = true;
  return {
    get calls() { return calls; },
    get budget() { return budget; },
    get spent() { return calls >= budget; },
    async get(url) {
      for (let attempt = 0; ; attempt += 1) {
        if (calls >= budget) throw new BudgetError(budget);
        if (!first) await delay(delayMs);
        first = false;
        calls += 1;
        if (onCall) onCall(calls, url);
        try {
          const body = await fetchJson(url, { headers: { 'user-agent': USER_AGENT, accept: 'application/json' } });
          // The API answers a maxlag refusal with HTTP 200 and an error in
          // the body, so it has to be turned back into something retryable.
          if (body?.error?.code === 'maxlag') {
            const error = new Error(body.error.info ?? 'maxlag');
            error.code = 'maxlag';
            throw error;
          }
          if (body?.error) throw new Error(`${url}: ${body.error.info ?? body.error.code}`);
          return body;
        } catch (e) {
          if (attempt >= retries || !isRetryable(e)) throw e;
          await delay(backoffMs(attempt));
        }
      }
    },
  };
}

// --- reading an entity -----------------------------------------------------

const statements = (entity, property) => (entity?.claims?.[property] ?? []).filter((s) => s?.mainsnak?.snaktype === 'value');

export function claimIds(entity, property) {
  return statements(entity, property)
    .map((s) => s.mainsnak.datavalue?.value?.id)
    .filter((id) => typeof id === 'string');
}

// Wikidata times are "+1974-04-25T00:00:00Z" with a precision: 11 is a day,
// 10 a month, 9 a year, and anything coarser is a century or worse, which
// this atlas has no interval for and drops rather than rounding.
export function parseTime(value) {
  const time = value?.time;
  const precision = value?.precision;
  if (typeof time !== 'string' || !Number.isInteger(precision) || precision < 9) return null;
  const m = /^([+-])(\d{4,16})-(\d{2})-(\d{2})T/.exec(time);
  if (!m) return null;
  const year = Number(m[2]) * (m[1] === '-' ? -1 : 1);
  if (!Number.isInteger(year) || year === 0) return null;
  const yyyy = `${m[1] === '-' ? '-' : ''}${m[2].replace(/^0+(?=\d{4})/, '')}`;
  if (precision === 9) return { year, date: null };
  if (precision === 10) return { year, date: `${yyyy}-${m[3]}` };
  return { year, date: `${yyyy}-${m[3]}-${m[4]}` };
}

export function claimTimes(entity, property) {
  return statements(entity, property).map((s) => parseTime(s.mainsnak.datavalue?.value)).filter(Boolean);
}

export function claimPoint(entity, property = PROPERTIES.coordinate) {
  for (const s of statements(entity, property)) {
    const value = s.mainsnak.datavalue?.value;
    if (typeof value?.longitude === 'number' && typeof value?.latitude === 'number') {
      return { lon: value.longitude, lat: value.latitude };
    }
  }
  return null;
}

export function labelOf(entity, lang) {
  const value = entity?.labels?.[lang];
  const text = typeof value === 'string' ? value : value?.value;
  return typeof text === 'string' && text.trim() !== '' ? text : null;
}

export function descriptionOf(entity, lang) {
  const value = entity?.descriptions?.[lang];
  const text = typeof value === 'string' ? value : value?.value;
  return typeof text === 'string' && text.trim() !== '' ? text : null;
}

export function aliasesOf(entity, lang) {
  return (entity?.aliases?.[lang] ?? [])
    .map((a) => (typeof a === 'string' ? a : a?.value))
    .filter((a) => typeof a === 'string' && a.trim() !== '');
}

// The article titles this atlas keeps: one per language it shows, and only
// those. Storing every edition's title would be storing a copy of the item.
export function articleTitles(entity, languages = LANGUAGES) {
  const titles = {};
  for (const lang of languages) {
    const link = entity?.sitelinks?.[`${lang}wiki`];
    const title = typeof link === 'string' ? link : link?.title;
    if (typeof title === 'string' && title.trim() !== '') titles[lang] = title;
  }
  return titles;
}

export function countLanguageEditions(entity) {
  return Object.keys(entity?.sitelinks ?? {}).filter((site) => SITE.test(site) && !NOT_A_LANGUAGE.has(site)).length;
}

// Everything the import looks at, in one flat shape, so that everything
// downstream is pure and testable without a fixture entity in hand.
export function readEntity(entity) {
  const qid = entity?.id;
  return {
    qid,
    labels: Object.fromEntries(LANGUAGES.map((l) => [l, labelOf(entity, l)])),
    descriptions: Object.fromEntries(LANGUAGES.map((l) => [l, descriptionOf(entity, l)])),
    aliases: Object.fromEntries(LANGUAGES.map((l) => [l, aliasesOf(entity, l)])),
    classes: claimIds(entity, PROPERTIES.instanceOf),
    times: {
      start: claimTimes(entity, PROPERTIES.start),
      end: claimTimes(entity, PROPERTIES.end),
      pointInTime: claimTimes(entity, PROPERTIES.pointInTime),
      inception: claimTimes(entity, PROPERTIES.inception),
      dissolved: claimTimes(entity, PROPERTIES.dissolved),
      born: claimTimes(entity, PROPERTIES.born),
      died: claimTimes(entity, PROPERTIES.died),
    },
    point: claimPoint(entity),
    location: claimIds(entity, PROPERTIES.location),
    country: claimIds(entity, PROPERTIES.country),
    administrative: claimIds(entity, PROPERTIES.administrative),
    participants: claimIds(entity, PROPERTIES.participant),
    titles: articleTitles(entity),
    sitelinks: countLanguageEditions(entity),
  };
}

// --- what an item is -------------------------------------------------------

// Only what the seeds file says. An item of several classes is fine as long
// as they agree; one whose classes disagree is exactly the case a person
// should look at, so it is refused and listed rather than resolved by
// picking the first.
export function classify(read, classes = {}) {
  const known = read.classes.map((qid) => [qid, classes[qid]]).filter(([, entry]) => entry);
  if (!known.length) {
    return { kind: null, reason: read.classes.length
      ? `none of its classes (${read.classes.join(', ')}) is in data/${SEEDS_FILE} → classes`
      : 'it has no P31 at all, so nothing says what kind of thing it is' };
  }
  const kinds = [...new Set(known.map(([, e]) => e.kind))];
  if (kinds.length > 1) {
    return { kind: null, reason: `its classes disagree: ${known.map(([q, e]) => `${q} → ${e.kind}`).join(', ')}` };
  }
  const kind = kinds[0];
  if (kind !== 'actor') return { kind, actorType: null, via: known.map(([q]) => q) };
  const types = [...new Set(known.map(([, e]) => e.actorType).filter(Boolean))];
  if (types.length !== 1) {
    return { kind: null, reason: types.length ? `its actor classes disagree about actorType: ${types.join(', ')}` : 'its actor classes say no actorType' };
  }
  return { kind, actorType: types[0], via: known.map(([q]) => q) };
}

// The interval an item's own date properties give, by kind. An event with a
// point in time is a year with a date on it; an actor is born and dies or is
// founded and dissolved. `end: null` means ongoing, and an item with no
// usable date at all has no interval, which is a refusal rather than a guess.
export function intervalFor(kind, times) {
  const first = (list) => (list.length ? list[0] : null);
  const pick = kind === 'actor'
    ? { from: first(times.born) ?? first(times.inception) ?? first(times.start), to: first(times.died) ?? first(times.dissolved) ?? first(times.end) }
    : { from: first(times.pointInTime) ?? first(times.start) ?? first(times.inception), to: first(times.end) ?? first(times.pointInTime) ?? first(times.dissolved) };
  if (!pick.from) return null;
  const when = { start: pick.from.year, end: pick.to ? pick.to.year : null };
  if (pick.from.date) when.date = pick.from.date;
  if (pick.to?.date && pick.to !== pick.from) when.endDate = pick.to.date;
  // The calendar is display-only and only the year drives anything; saying
  // Gregorian for a date after the reform and nothing before it is the same
  // default the rest of the atlas uses, so it is left off rather than
  // asserted here.
  return when;
}

// --- ids and names ---------------------------------------------------------

export function slug(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
}

// Diacritic-insensitive, case-insensitive, whitespace-normalised: the form
// two names are compared in, and never the form either is stored in.
export function foldName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// An id nothing else has yet. A collision is not an error — two items may
// honestly be called the same thing — but silently reusing an id would merge
// two records into one, so the second carries the item id and is obvious.
export function idFor(read, taken) {
  const base = slug(read.labels.en ?? read.labels.pt ?? read.qid);
  if (base && !taken.has(base)) return base;
  const withQid = `${base ? `${base}-` : ''}${read.qid.toLowerCase()}`;
  return withQid;
}

export function namesFor(read) {
  const names = [];
  for (const lang of LANGUAGES) {
    const label = read.labels[lang];
    if (label && !names.some((n) => foldName(n) === foldName(label))) names.push(label);
  }
  for (const [lang, title] of Object.entries(read.titles)) {
    if (!LANGUAGES.includes(lang)) continue;
    if (!names.some((n) => foldName(n) === foldName(title))) names.push(title);
  }
  return names;
}

// --- the records ------------------------------------------------------------

export function identityOf(read) {
  const identity = { wikidata: read.qid, sitelinks: read.sitelinks };
  if (Object.keys(read.titles).length) identity.wikipedia = { ...read.titles };
  return identity;
}

// The one sentence an imported record is allowed to say about the world:
// which item it is and what that item's own description says. It is not the
// atlas's account of anything, it says so, and review.html is where somebody
// replaces it with one.
export function importedSummary(read) {
  const described = read.descriptions.en ?? read.descriptions.pt;
  const said = described
    ? ` The item's own description reads "${described}".`
    : ' The item carries no description in English or Portuguese.';
  return `Wikidata item ${read.qid}, imported by tools/import/wikidata.mjs.${said} `
    + 'Everything here is copied from the item\'s own fields and nothing in it is this atlas\'s account of the thing: '
    + 'that is still to be written, and review.html is where somebody writes it.';
}

function envelope(id, kind, created, fields) {
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
    // Facts nobody has checked, marked as such. Sign clears the flag; until
    // then the queue counts the record and the dashboard shows why.
    review: { flags: [IMPORTED_FLAG] },
    ...fields,
  };
}

export function placeRecord(read, { id, created, region = null }) {
  const label = read.labels.en ?? read.labels.pt ?? read.qid;
  return envelope(id, 'place', created, {
    ...identityOf(read),
    sources: [{ source: SOURCE_ID, locator: read.qid }],
    names: namesFor(read),
    where: { lon: read.point.lon, lat: read.point.lat, precision: 'point', label },
    region,
    summary: importedSummary(read),
  });
}

export function actorRecord(read, { id, created, actorType, when }) {
  return envelope(id, 'actor', created, {
    ...identityOf(read),
    sources: [{ source: SOURCE_ID, locator: read.qid }],
    actorType,
    names: namesFor(read),
    summary: importedSummary(read),
    when,
    where: null,
  });
}

export function eventRecord(read, { id, created, when, place, region = null }) {
  return envelope(id, 'event', created, {
    ...identityOf(read),
    sources: [{ source: SOURCE_ID, locator: read.qid }],
    title: read.labels.en ?? read.labels.pt ?? read.qid,
    summary: importedSummary(read),
    when,
    place,
    region,
    // P710 names participants, and who took part is not the same question as
    // what they did in it: `role` is the argument and a person writes it.
    actors: [],
  });
}

export function leadRecord({ qid, lang, title, revid, fetched, text }) {
  return {
    qid,
    lang,
    title,
    revid,
    fetched,
    license: 'CC-BY-SA-4.0',
    url: articleUrl(lang, title),
    historyUrl: historyUrl(lang, title),
    text,
  };
}

// Every automated writer this repository has, in one list, so that "a record
// somebody wrote" is a question with one answer. IMPORT_AUTHORS is the
// validator's own list — the licence exception — and this import's author is
// the other name on it.
export const AUTOMATED_AUTHORS = Object.freeze([...IMPORT_AUTHORS, IMPORT_AUTHOR.name]);

export const handWritten = (record) => !(record?.authors ?? []).some((a) => AUTOMATED_AUTHORS.includes(a?.name));

// --- the additive rule ------------------------------------------------------

// The rule itself is in identity.mjs, because cshapes.mjs obeys it too; it is
// re-exported here so that the tool's whole surface is one import.
export { ENRICHABLE, mergeIdentity, identityOnDisk } from './identity.mjs';

// --- matching (used in earnest by M17) --------------------------------------

// "Certain" is defined, not felt: one exact diacritic-insensitive name match,
// a class consistent with the record's own kind and actorType, dates within a
// year, and exactly one candidate left standing. Anything else is ambiguous
// and goes on a list for a person.
export const DATE_TOLERANCE = 1;

const startYear = (when) => (Number.isInteger(when?.start) ? when.start : when?.start?.min ?? null);

export function nameMatches(record, read) {
  const ours = new Set([
    ...(record?.names ?? []),
    ...(record?.title ? [record.title] : []),
  ].map(foldName));
  const theirs = [
    ...Object.values(read.labels).filter(Boolean),
    ...Object.values(read.aliases).flat(),
  ].map(foldName);
  return theirs.some((name) => name !== '' && ours.has(name));
}

export function datesMatch(record, read, kind, tolerance = DATE_TOLERANCE) {
  const mine = startYear(record?.when);
  if (mine === null) return true;
  const when = intervalFor(kind, read.times);
  if (!when) return false;
  return Math.abs(when.start - mine) <= tolerance;
}

// → { certain, candidates, why }. `candidates` is what survived; certain
// means exactly one did.
export function matchesFor(record, reads, classes) {
  const surviving = [];
  const rejected = [];
  for (const read of reads) {
    const classified = classify(read, classes);
    if (classified.kind !== record.kind) {
      rejected.push(`${read.qid}: ${classified.kind ? `it is a ${classified.kind} here, not a ${record.kind}` : classified.reason}`);
      continue;
    }
    if (record.kind === 'actor' && classified.actorType !== record.actorType) {
      rejected.push(`${read.qid}: its classes make it a ${classified.actorType}, not a ${record.actorType}`);
      continue;
    }
    if (!nameMatches(record, read)) {
      rejected.push(`${read.qid}: no name of the record matches a label or alias of the item`);
      continue;
    }
    if (!datesMatch(record, read, record.kind)) {
      rejected.push(`${read.qid}: its dates are more than ${DATE_TOLERANCE} year from the record's`);
      continue;
    }
    surviving.push(read);
  }
  return { certain: surviving.length === 1 ? surviving[0] : null, candidates: surviving, rejected };
}

// --- lanes ------------------------------------------------------------------

// Nothing may leave build-index.mjs unable to run, so a place is created only
// when a lane can be reached for it: derived from its own point the way the
// index derives it, else taken from the point of the country the item names,
// else refused. The tool uses the same deriveRegion the index uses rather
// than a second implementation of it.
export function laneFor(point, { deriveRegion, countryPoints = [] } = {}) {
  if (!deriveRegion) return { region: null, how: 'no polygons loaded' };
  if (deriveRegion(point)) return { region: null, how: 'derived from its own point' };
  for (const country of countryPoints) {
    const derived = deriveRegion(country.point);
    if (derived) return { region: derived.region, how: `from ${country.qid}, the country the item names`, override: true };
  }
  return { region: null, how: null };
}

// --- disk -------------------------------------------------------------------

const asText = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

export async function readSeeds(dataDir = DEFAULT_DATA) {
  const file = path.join(dataDir, ...SEEDS_FILE.split('/'));
  const seeds = existsSync(file) ? await readJson(file) : null;
  if (seeds === null) return null;
  return { items: [], queries: [], classes: {}, reconcile: false, ...seeds };
}

export function emptyState() {
  return { schema: 1, kind: 'import-state', source: SOURCE_ID, runs: {} };
}

export async function readState(dataDir = DEFAULT_DATA) {
  const file = path.join(dataDir, ...STATE_FILE.split('/'));
  return (existsSync(file) ? await readJson(file) : null) ?? emptyState();
}

export async function writeState(dataDir, state) {
  const file = path.join(dataDir, ...STATE_FILE.split('/'));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, asText(state), 'utf8');
}

// What this batch should walk: what a cut-off run left pending, or a fresh
// list of everything the seeds name that the cursor has not dealt with.
export function nextBatch(state, mode, wanted, size = BATCH) {
  const run = state.runs?.[mode] ?? { updated: null, pending: [], done: [] };
  const done = new Set(run.done ?? []);
  const pending = (run.pending ?? []).length ? run.pending.filter((id) => !done.has(id)) : wanted.filter((id) => !done.has(id));
  return { batch: pending.slice(0, size), pending, done: [...done] };
}

export function advance(state, mode, { batch, pending, done, today }) {
  const remaining = pending.filter((id) => !batch.includes(id));
  return {
    ...state,
    runs: {
      ...state.runs,
      [mode]: { updated: today, pending: remaining, done: [...done, ...batch] },
    },
  };
}

async function existingRecords(dataDir) {
  const { entries, problems } = await readRecords(dataDir);
  if (problems.length) throw new Error(problems.map((p) => `${p.file}: ${p.message}`).join('\n'));
  return entries;
}

// Which items the atlas already knows about, per kind, so an import never
// creates a second record for one it has.
export function itemIndex(entries) {
  const byItem = new Map();
  for (const { record } of entries) {
    if (typeof record?.wikidata !== 'string') continue;
    byItem.set(`${record.kind}:${record.wikidata}`, record.id);
  }
  return byItem;
}

async function writeRecord(dataDir, dir, record) {
  const file = path.join(dataDir, dir, `${record.id}.json`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, asText(record), 'utf8');
  return `${dir}/${record.id}.json`;
}

// wbgetentities answers an item that does not exist with `missing: ""`, and
// an empty string is falsy: the presence of the key is the answer, not its
// value.
export const isMissing = (entity) => !entity || Object.hasOwn(entity, 'missing');

export async function fetchEntities(fetcher, qids) {
  if (!qids.length) return {};
  const body = await fetcher.get(entitiesUrl(qids));
  return body?.entities ?? {};
}

// The lead of each article the item links to, cached by item and language.
// A lead already on disk is not fetched again: the cache is what makes a
// second run of a drafting milestone cost nothing.
export async function fetchLeads(fetcher, read, { cacheDir, today, force = false }) {
  const written = [];
  for (const [lang, title] of Object.entries(read.titles)) {
    const file = path.join(cacheDir, `${read.qid}.${lang}.json`);
    if (!force && existsSync(file)) continue;
    let body;
    try {
      body = await fetcher.get(summaryUrl(lang, title));
    } catch (e) {
      if (e?.name === 'BudgetError') throw e;
      written.push({ lang, error: e.message });
      continue;
    }
    const text = typeof body?.extract === 'string' ? body.extract.trim() : '';
    if (text === '') continue;
    const lead = leadRecord({
      qid: read.qid,
      lang,
      title: typeof body?.title === 'string' ? body.title : title,
      revid: Number.isInteger(body?.revision) ? body.revision : Number(body?.revision) || 0,
      fetched: today,
      text,
    });
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, asText(lead), 'utf8');
    written.push({ lang, file: path.basename(file) });
  }
  return written;
}

// --- the modes --------------------------------------------------------------

// Everything the run did, in the shape the report prints and the tests read.
function emptyReport() {
  return { created: [], enriched: [], refused: [], unclassified: new Map(), ambiguous: [], leads: [], calls: 0, batch: [], remaining: 0 };
}

function refuse(report, qid, why) {
  report.refused.push({ qid, why });
}

// --import: create records for the items the seeds name and that the atlas
// does not have, and fill identity fields in on the ones it does.
export async function runImportMode(dataDir, { fetcher, today, batchSize = BATCH, cacheDir, deriveRegion = null } = {}) {
  const report = emptyReport();
  const seeds = await readSeeds(dataDir);
  if (!seeds) return { report, failed: [`no data/${SEEDS_FILE}: there is nothing to import`] };
  const state = await readState(dataDir);
  const { batch, pending, done } = nextBatch(state, 'import', seeds.items, batchSize);
  report.batch = batch;
  report.remaining = Math.max(pending.length - batch.length, 0);
  if (!batch.length) return { report, failed: [], state };

  const entries = await existingRecords(dataDir);
  const byItem = itemIndex(entries);
  const taken = new Set(entries.map((e) => e.record?.id).filter(Boolean));
  const entities = await fetchEntities(fetcher, batch);
  const written = [];

  // The countries the batch names, fetched together, so a place whose own
  // point reaches no lane can still be given one.
  const countries = [...new Set(Object.values(entities).filter((e) => !isMissing(e))
    .flatMap((e) => claimIds(e, PROPERTIES.country).concat(claimIds(e, PROPERTIES.administrative))))]
    .filter((qid) => !Object.hasOwn(entities, qid));
  const countryEntities = countries.length ? await fetchEntities(fetcher, countries.slice(0, batchSize)) : {};
  const pointOf = (qid) => {
    const entity = entities[qid] ?? countryEntities[qid];
    const point = entity ? claimPoint(entity) : null;
    return point ? { qid, point } : null;
  };

  // Classified first, then walked places before actors before events, so an
  // event can point at a place the same batch created rather than being
  // refused for a record that is about to exist. Order within a kind stays
  // the seeds file's, so the report reads in the order somebody wrote.
  const work = [];
  for (const qid of batch) {
    const entity = entities[qid];
    if (isMissing(entity)) {
      refuse(report, qid, 'no such item; the seeds file names something Wikidata does not have');
      continue;
    }
    const read = readEntity(entity);
    const classified = classify(read, seeds.classes);
    if (!classified.kind) {
      for (const cls of read.classes) {
        if (seeds.classes[cls]) continue;
        if (!report.unclassified.has(cls)) report.unclassified.set(cls, { qid: cls, items: [] });
        report.unclassified.get(cls).items.push(qid);
      }
      refuse(report, qid, classified.reason);
      continue;
    }
    work.push({ qid, read, classified });
  }
  const ORDER = { place: 0, actor: 1, event: 2 };
  work.sort((a, b) => ORDER[a.classified.kind] - ORDER[b.classified.kind]);

  for (const { qid, read, classified } of work) {
    const existing = byItem.get(`${classified.kind}:${qid}`);
    if (existing) {
      const entry = entries.find((e) => e.record.id === existing);
      const { record, added } = mergeIdentity(entry.record, identityOf(read));
      if (added.length) {
        written.push(await writeRecord(dataDir, path.dirname(entry.file), record));
        report.enriched.push({ id: existing, qid, added });
      }
      report.leads.push(...(await fetchLeads(fetcher, read, { cacheDir, today })).map((l) => ({ qid, ...l })));
      continue;
    }

    const id = idFor(read, taken);
    if (classified.kind === 'place') {
      if (!read.point) {
        refuse(report, qid, 'a place with no coordinate is a word, not a place');
        continue;
      }
      const lane = laneFor(read.point, { deriveRegion, countryPoints: read.country.concat(read.administrative).map(pointOf).filter(Boolean) });
      if (lane.how === null) {
        refuse(report, qid, 'no lane can be reached from its point or from the country it names; the index could not place it');
        continue;
      }
      const record = placeRecord(read, { id, created: today, region: lane.region });
      written.push(await writeRecord(dataDir, 'places', record));
      taken.add(id);
      byItem.set(`place:${qid}`, id);
      report.created.push({ id, qid, kind: 'place', lane: lane.how });
    } else if (classified.kind === 'actor') {
      const when = intervalFor('actor', read.times);
      if (!when) {
        refuse(report, qid, 'no date the atlas can use: an actor needs at least a start');
        continue;
      }
      const record = actorRecord(read, { id, created: today, actorType: classified.actorType, when });
      written.push(await writeRecord(dataDir, 'actors', record));
      taken.add(id);
      report.created.push({ id, qid, kind: 'actor' });
    } else {
      const when = intervalFor('event', read.times);
      if (!when) {
        refuse(report, qid, 'no date the atlas can use: an event with no year has nowhere on the timeline');
        continue;
      }
      // An event points at a place record; creating one for it here would be
      // creating a record nobody asked for, so an event whose location is not
      // already a place of this atlas is placeless and takes a lane instead.
      const place = read.location.map((qid2) => byItem.get(`place:${qid2}`)).find(Boolean) ?? null;
      let region = null;
      if (!place) {
        // Its own point if it has one, else the point of whatever it says it
        // happened at or in — a lane is a coarse enough thing that a
        // location's or a country's point answers it honestly.
        const elsewhere = read.location.concat(read.administrative, read.country).map(pointOf).filter(Boolean);
        const point = read.point ?? elsewhere[0]?.point ?? null;
        const lane = point ? laneFor(point, { deriveRegion, countryPoints: elsewhere }) : { how: null };
        // Placeless: the region is not an override but the only thing the
        // timeline has to go on, so it is written even where the point would
        // have derived it.
        region = lane.how === null ? null : lane.region ?? deriveRegion?.(point)?.region ?? null;
        if (!region) {
          refuse(report, qid, 'no place record for its location and no lane reachable from its point; a placeless event must carry a region');
          continue;
        }
      }
      const record = eventRecord(read, { id, created: today, when, place, region });
      written.push(await writeRecord(dataDir, 'events', record));
      taken.add(id);
      report.created.push({ id, qid, kind: 'event', place });
    }
    report.leads.push(...(await fetchLeads(fetcher, read, { cacheDir, today })).map((l) => ({ qid, ...l })));
  }

  report.calls = fetcher.calls;
  const next = advance(state, 'import', { batch, pending, done, today });
  await writeState(dataDir, next);
  return { report, failed: [], written, state: next };
}

// --reconcile: match the records already here against items, and write the
// identity fields onto the certain matches. Nothing else is touched.
export async function runReconcileMode(dataDir, { fetcher, today, batchSize = BATCH, cacheDir, kinds = ['event', 'actor', 'place'] } = {}) {
  const report = emptyReport();
  const seeds = await readSeeds(dataDir);
  if (!seeds) return { report, failed: [`no data/${SEEDS_FILE}: there is nothing to reconcile against`] };
  if (!seeds.reconcile) return { report, failed: [`data/${SEEDS_FILE} sets reconcile: false; matching writes identifiers onto records somebody wrote, so it is off unless the file says otherwise`] };

  const entries = await existingRecords(dataDir);
  // Records that are ours to match: hand-written, no identifier yet. A record
  // an import wrote is not — the Wikidata import's own records already carry
  // the item they came from, and the CShapes polities are out of this pass by
  // decision 23 of docs/review-2026-09-04-plan.md: 250 territories matched by
  // name against a search nobody has read is exactly the bulk guess this
  // milestone is meant to avoid.
  const wanted = entries
    .filter((e) => kinds.includes(e.record?.kind))
    .filter((e) => typeof e.record?.wikidata !== 'string')
    .filter((e) => handWritten(e.record))
    .map((e) => e.record.id);

  const state = await readState(dataDir);
  const { batch, pending, done } = nextBatch(state, 'reconcile', wanted, batchSize);
  report.batch = batch;
  report.remaining = Math.max(pending.length - batch.length, 0);
  if (!batch.length) return { report, failed: [], state };

  const byId = new Map(entries.map((e) => [e.record.id, e]));
  const written = [];
  for (const id of batch) {
    const entry = byId.get(id);
    if (!entry) continue;
    const record = entry.record;
    const kind = record.kind;
    const term = (record.names ?? [])[0] ?? record.title;
    if (!term) {
      report.ambiguous.push({ id, kind, why: 'the record has no name to search for' });
      continue;
    }
    const found = await fetcher.get(searchUrl(term));
    const qids = (found?.search ?? []).map((s) => s.id).filter(Boolean);
    if (!qids.length) {
      report.ambiguous.push({ id, kind, term, why: `nothing on Wikidata is called "${term}"` });
      continue;
    }
    const entities = await fetchEntities(fetcher, qids.slice(0, batchSize));
    const reads = Object.values(entities).filter((e) => !isMissing(e)).map(readEntity);
    const { certain, candidates, rejected } = matchesFor(record, reads, seeds.classes);
    if (!certain) {
      report.ambiguous.push({
        id,
        kind,
        term,
        when: record.when ?? null,
        candidates: candidates.map((c) => c.qid),
        considered: considered(reads, rejected, { kind }),
        searched: reads.length,
        rejected,
      });
      continue;
    }
    const merged = mergeIdentity(record, identityOf(certain));
    if (merged.added.length) {
      written.push(await writeRecord(dataDir, path.dirname(entry.file), merged.record));
      report.enriched.push({ id, qid: certain.qid, added: merged.added });
    }
    report.leads.push(...(await fetchLeads(fetcher, certain, { cacheDir, today })).map((l) => ({ qid: certain.qid, ...l })));
  }

  report.calls = fetcher.calls;
  const next = advance(state, 'reconcile', { batch, pending, done, today });
  await writeState(dataDir, next);
  return { report, failed: [], written, state: next };
}

// The few candidates a person is shown for a record the tool would not
// decide: what they were called, when they were, what classes they carry and
// why each was thrown out. Everything needed to say "this one" without
// opening Wikidata, and the link for when that is not enough.
export function considered(reads, rejected = [], { kind = null, shown = AMBIGUOUS_SHOWN } = {}) {
  const why = new Map(rejected.map((line) => {
    const at = String(line).indexOf(': ');
    return at === -1 ? [String(line), String(line)] : [String(line).slice(0, at), String(line).slice(at + 2)];
  }));
  return reads.slice(0, shown).map((read) => ({
    qid: read.qid,
    label: read.labels.en ?? read.labels.pt ?? null,
    description: read.descriptions.en ?? read.descriptions.pt ?? null,
    when: kind ? intervalFor(kind, read.times) : null,
    classes: read.classes,
    why: why.get(read.qid) ?? 'nothing rejected it — and neither did anything single it out',
  }));
}

const years = (when) => {
  if (!when || !Number.isInteger(when.start)) return 'no date';
  if (when.end === null || when.end === undefined) return `${when.start}–`;
  return when.start === when.end ? `${when.start}` : `${when.start}–${when.end}`;
};

function ambiguousSection(row) {
  const lines = [`## ${row.id}`, ''];
  const dated = row.when ? ` · ${years(row.when)}` : '';
  lines.push(`\`${row.kind ?? 'record'}\`${dated} · searched for **${row.term ?? '(nothing to search for)'}**`);
  lines.push('');
  if (row.why) {
    lines.push(`${row.why}.`);
  } else {
    lines.push(row.candidates?.length
      ? `${row.candidates.length} items passed every test, so no single one of them is certain.`
      : `${row.searched ?? 0} item(s) were read and each failed a test.`);
    lines.push('');
    for (const c of row.considered ?? []) {
      const label = c.label ?? '(no label)';
      const description = c.description ? ` — ${c.description}` : '';
      const classes = c.classes?.length ? c.classes.join(', ') : 'no P31';
      lines.push(`- [\`${c.qid}\`](https://www.wikidata.org/wiki/${c.qid}) **${label}**${description} — ${years(c.when)} — ${classes}`);
      lines.push(`  - ${c.why}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

// Sections keyed by record id, so that the file survives being written once
// per batch: the Action runs the tool again for every 25 records, and a page
// that replaced itself each time would end up holding the last batch alone.
function parseSections(text) {
  return String(text ?? '').split(/^## /m).slice(1).map((part) => {
    const id = part.split('\n', 1)[0].trim();
    return [id, `## ${part.replace(/\s+$/, '')}\n`];
  });
}

export function ambiguousMarkdown(rows, { generated, previous = '', seedsFile = SEEDS_FILE } = {}) {
  const sections = new Map(parseSections(previous));
  for (const row of rows) sections.set(row.id, ambiguousSection(row));
  const ids = [...sections.keys()].sort();
  return `# Wikidata reconcile — what the import would not decide

Written by \`node tools/import/wikidata.mjs --reconcile\`, last on ${generated},
one section per hand-written record the pass could not match **with
certainty**: an exact diacritic-insensitive name match, a class consistent
with the record's kind, dates within a year, and exactly one candidate left.
Most records are here and that is the design — a mechanical match is the only
kind an import is allowed to make, and everything else is somebody's judgement.

Nothing here has been written onto any record. Two things can be done with a
section: match it by hand (put the item id in the record's \`wikidata\`, and a
later pass fills the rest in), or, where the reason given is a class nobody
has decided about, add that class to \`data/${seedsFile}\` → \`classes\` and run
the pass again. The list is regenerated per batch and keyed by record id, so
an id appears once however many times the tool has run.

${ids.map((id) => sections.get(id)).join('\n')}`;
}

// --candidates: run the seeds' queries and write a list. Nothing under data/
// is created or changed — the whole point is that a person ticks the rows
// first (docs/review-2026-09-04-plan.md, finding 14).
export async function runCandidatesMode(dataDir, { fetcher, today, limitPerQuery = 200 } = {}) {
  const report = { ...emptyReport(), rows: [] };
  const seeds = await readSeeds(dataDir);
  if (!seeds) return { report, failed: [`no data/${SEEDS_FILE}: there are no queries to run`] };
  const entries = await existingRecords(dataDir);
  const known = new Set([...itemIndex(entries).keys()].map((key) => key.split(':')[1]));

  for (const query of seeds.queries) {
    let body;
    try {
      body = await fetcher.get(sparqlUrl(query.sparql));
    } catch (e) {
      if (e?.name === 'BudgetError') throw e;
      report.refused.push({ qid: query.name, why: e.message });
      continue;
    }
    const bindings = body?.results?.bindings ?? [];
    for (const binding of bindings.slice(0, limitPerQuery)) {
      const uri = binding?.item?.value ?? '';
      const qid = /\/(Q[1-9][0-9]*)$/.exec(uri)?.[1];
      if (!qid) continue;
      report.rows.push({
        query: query.name,
        qid,
        label: binding?.itemLabel?.value ?? null,
        description: binding?.itemDescription?.value ?? null,
        known: known.has(qid),
      });
    }
  }
  report.calls = fetcher.calls;
  report.today = today;
  return { report, failed: [] };
}

// The candidate list as a page with a box on every row: what M18 hands the
// owner. Generated; the sentence at the top says so.
export function candidatesMarkdown(rows, { generated, seedsFile = SEEDS_FILE } = {}) {
  const byQuery = new Map();
  for (const row of rows) {
    if (!byQuery.has(row.query)) byQuery.set(row.query, []);
    byQuery.get(row.query).push(row);
  }
  const sections = [...byQuery.entries()].map(([name, list]) => {
    const lines = list.map((r) => {
      const label = r.label ?? '(no label)';
      const note = r.known ? ' — **already in the atlas**' : '';
      const description = r.description ? ` — ${r.description}` : '';
      return `- [ ] [\`${r.qid}\`](https://www.wikidata.org/wiki/${r.qid}) ${label}${description}${note}`;
    });
    return `## ${name}\n\n${lines.length ? lines.join('\n') : '_nothing returned_'}\n`;
  });
  return `# Wikidata candidates

Generated by \`node tools/import/wikidata.mjs --candidates\` on ${generated}.
Do not edit the rows by hand except to tick them: tick what belongs in this
atlas, and the import walks the ticked ones and nothing else. Untick is the
default, and a row nobody ticks is a record that is never created.

The queries are in \`data/${seedsFile}\`; changing what is proposed is an edit
to that file and another run, never an edit here.

${sections.join('\n')}`;
}

// --- the report -------------------------------------------------------------

export function reportLines(report, mode) {
  const lines = [];
  lines.push(`${mode}: ${report.batch.length} item(s) this batch, ${report.remaining} left after it, ${report.calls} call(s) spent`);
  for (const c of report.created) lines.push(`created ${c.kind} ${c.id} from ${c.qid}${c.lane ? ` (lane ${c.lane})` : ''}`);
  for (const e of report.enriched) lines.push(`enriched ${e.id} from ${e.qid}: ${e.added.join(', ')}`);
  for (const r of report.refused) lines.push(`refused ${r.qid}: ${r.why}`);
  for (const a of report.ambiguous) lines.push(`ambiguous ${a.id}: ${a.candidates?.length ? `${a.candidates.length} candidates (${a.candidates.join(', ')})` : a.why}`);
  for (const [qid, entry] of report.unclassified ?? []) {
    lines.push(`unclassified class ${qid}: add it to data/${SEEDS_FILE} → classes or the ${entry.items.length} item(s) in it stay refused`);
  }
  const leads = report.leads.filter((l) => l.file).length;
  if (leads) lines.push(`${leads} Wikipedia lead(s) cached under ${LEAD_CACHE}`);
  lines.push(`${report.created.length} created, ${report.enriched.length} enriched, ${report.refused.length} refused, ${report.ambiguous.length} ambiguous`);
  return lines;
}

// --- CLI --------------------------------------------------------------------

async function main(argv) {
  let mode = null;
  let dataDir = DEFAULT_DATA;
  let batchSize = BATCH;
  let budget = CALL_BUDGET;
  let to = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--') && MODES.includes(arg.slice(2))) {
      if (mode) {
        console.error('one mode at a time: --reconcile, --import or --candidates');
        return 2;
      }
      mode = arg.slice(2);
    } else if (arg === '--data') dataDir = path.resolve(argv[++i]);
    else if (arg === '--batch') batchSize = Number(argv[++i]);
    else if (arg === '--budget') budget = Number(argv[++i]);
    else if (arg === '--to') to = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${arg}`);
      return 2;
    }
  }
  if (!mode) {
    console.error('usage: node tools/import/wikidata.mjs --reconcile|--import|--candidates [--data <dir>] [--batch 25] [--budget 400] [--to <file>]');
    return 2;
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || !Number.isInteger(budget) || budget < 1) {
    console.error('--batch and --budget take positive integers');
    return 2;
  }

  const today = new Date().toISOString().slice(0, 10);
  const cacheDir = path.join(ROOT, LEAD_CACHE);
  const polygons = await readRegionPolygons(dataDir);
  const deriveRegion = polygons ? createRegionDeriver(polygons) : null;
  const fetcher = createFetcher({ budget });

  let result;
  try {
    if (mode === 'import') result = await runImportMode(dataDir, { fetcher, today, batchSize, cacheDir, deriveRegion });
    else if (mode === 'reconcile') result = await runReconcileMode(dataDir, { fetcher, today, batchSize, cacheDir });
    else result = await runCandidatesMode(dataDir, { fetcher, today });
  } catch (e) {
    console.error(`error: ${e.message}`);
    return 1;
  }
  for (const problem of result.failed) console.error(`error: ${problem}`);
  if (result.failed.length) return 1;
  if (mode === 'candidates') {
    const file = to ?? path.join(ROOT, CANDIDATES_FILE);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, candidatesMarkdown(result.report.rows, { generated: today }), 'utf8');
    console.log(`${result.report.rows.length} candidate(s) written to ${path.relative(ROOT, file)}; nothing under data/ was touched`);
    return 0;
  }
  if (mode === 'reconcile') {
    const file = to ?? path.join(ROOT, AMBIGUOUS_FILE);
    const previous = existsSync(file) ? await readFile(file, 'utf8') : '';
    if (result.report.ambiguous.length || previous) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, ambiguousMarkdown(result.report.ambiguous, { generated: today, previous }), 'utf8');
      console.log(`${result.report.ambiguous.length} record(s) left for a person in ${path.relative(ROOT, file)}`);
    }
  }
  for (const line of reportLines(result.report, mode)) console.log(line);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

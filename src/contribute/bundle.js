// The pure half of the contribution form: the field list the form is built
// from, assembly of a bundle out of plain field values, the duplicate search
// that runs before a new event is allowed, and validation of the bundle
// against the loaded topology. No DOM, no fetch — form.js is the other half,
// and everything here is under test.
//
// A bundle is the unit of contribution and the storage format at once
// (principle 5): what this file builds is what the Action writes to
// data/<kind>s/<id>.json, unchanged.

import { validate } from '../validate/core.js';
import { EDGE_TYPES } from '../validate/rules.js';

export const CONFIDENCE = Object.freeze(['consensus', 'probable', 'disputed']);
export const SOURCE_TYPES = Object.freeze(['book', 'chapter', 'article', 'thesis', 'primary', 'dataset', 'web']);
export const PRECISION = Object.freeze(['point', 'city', 'region']);

// Field descriptors. `path` is the JSON pointer the validator reports for
// that field, which is how an error finds its way back to the input that
// caused it. `optionsFrom` is filled at render time from the topology.
export const FIELDS = Object.freeze({
  event: Object.freeze([
    { key: 'title', label: 'Title', input: 'text', path: '/title', required: true },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens; it becomes the file name and the permanent URL' },
    { key: 'summary', label: 'Summary', input: 'textarea', path: '/summary', required: true, hint: 'written by you, in your own words' },
    { key: 'start', label: 'Start year', input: 'text', path: '/when/start', required: true, hint: 'an integer year, negative for BCE, no year 0; a range as 1400..1450' },
    { key: 'end', label: 'End year', input: 'text', path: '/when/end', hint: 'blank means the same year as the start; write "ongoing" for an interval with no end' },
    { key: 'date', label: 'Exact date', input: 'text', path: '/when/date', hint: 'display only, exactly as the source gives it: YYYY-MM-DD or YYYY-MM' },
    { key: 'calendar', label: 'Calendar', input: 'select', options: ['', 'julian', 'gregorian'], path: '/when/calendar', hint: 'of the exact date; Julian before 1582, Gregorian after, unless the source says otherwise' },
    { key: 'label', label: 'Place', input: 'text', path: '/where/label', hint: 'leave the three place fields blank for a long process with no honest point' },
    { key: 'lon', label: 'Longitude', input: 'text', path: '/where/lon', hint: 'WGS84, east positive' },
    { key: 'lat', label: 'Latitude', input: 'text', path: '/where/lat', hint: 'WGS84, north positive' },
    { key: 'precision', label: 'Precision', input: 'select', options: PRECISION, path: '/where/precision' },
    { key: 'region', label: 'Timeline lane', input: 'select', optionsFrom: 'regions', path: '/region', hint: 'derived from the place; set it only when the derivation would be wrong, and always when there is no place' },
  ]),
  edge: Object.freeze([
    { key: 'from', label: 'From', input: 'select', optionsFrom: 'events', path: '/from', required: true },
    { key: 'to', label: 'To', input: 'select', optionsFrom: 'events', path: '/to', required: true },
    { key: 'type', label: 'Type', input: 'select', options: ['', ...EDGE_TYPES], path: '/type', required: true, hint: 'the right one of five, not the nearest one' },
    { key: 'confidence', label: 'Confidence', input: 'select', options: ['', ...CONFIDENCE], path: '/confidence', required: true, hint: 'defined by evidence, not by how strongly you feel: consensus needs two sources by different authors' },
    { key: 'explanation', label: 'Explanation', input: 'textarea', path: '/explanation', required: true, hint: 'the argument for the link, written by you: why this, and not coincidence' },
    { key: 'disputeText', label: 'The dispute', input: 'textarea', path: '/dispute/text', when: (v) => v.confidence === 'disputed', hint: 'who disagrees about this link, and why; the reader sees the disagreement rather than a side' },
  ]),
  source: Object.freeze([
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'author, year, keyword: russell-2000-henry' },
    { key: 'type', label: 'Type', input: 'select', options: SOURCE_TYPES, path: '/type', required: true },
    { key: 'creators', label: 'Authors of the work', input: 'text', path: '/creators', required: true, hint: 'as printed, separated by semicolons' },
    { key: 'title', label: 'Title', input: 'text', path: '/title', required: true },
    { key: 'year', label: 'Year', input: 'text', path: '/year' },
    { key: 'publisher', label: 'Publisher', input: 'text', path: '/publisher' },
    { key: 'isbn', label: 'ISBN', input: 'text', path: '/isbn', hint: '10 or 13 digits, no hyphens' },
    { key: 'doi', label: 'DOI', input: 'text', path: '/doi', hint: '10.xxxx/…' },
    { key: 'url', label: 'URL', input: 'text', path: '/url', hint: 'http(s); for a web source, preferably an archive URL' },
    { key: 'accessed', label: 'Accessed', input: 'text', path: '/accessed', hint: 'YYYY-MM-DD; required for a web source' },
    { key: 'repository', label: 'Repository', input: 'text', path: '/repository', hint: 'for a primary source: the archive holding the document' },
    { key: 'reference', label: 'Reference', input: 'text', path: '/reference', hint: 'for a primary source: the shelfmark' },
  ]),
});

// Which citation lists a kind carries. Sources cite nothing (rule 6 exempts
// them); a dispute's dissenting citations are kept apart from the
// supporting ones so the panel can show which is which.
export const CITATION_LISTS = Object.freeze({
  event: [{ key: 'citations', label: 'Sources', path: '/sources' }],
  edge: [
    { key: 'citations', label: 'Supporting sources', path: '/sources' },
    { key: 'disputeCitations', label: 'Dissenting sources', path: '/dispute/sources', when: (v) => v.confidence === 'disputed' },
  ],
  source: [],
});

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value);
}

function orNull(value) {
  const t = trimmed(value);
  return t === '' ? null : t;
}

export function emptyValues(kind) {
  const values = {};
  for (const field of FIELDS[kind]) values[field.key] = field.options && field.options[0] !== '' ? field.options[0] : '';
  for (const list of CITATION_LISTS[kind]) values[list.key] = [];
  return values;
}

// "Conquest of Ceuta" → "conquest-of-ceuta". A suggestion only: the id is
// permanent, so the contributor sees it and can change it.
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/, '');
}

// An exact year, or a range written 1400..1450. Anything else comes back as
// the string the contributor typed: the schema then reports the problem at
// the right path, instead of this function inventing a year.
export function parseBound(text) {
  const t = trimmed(text);
  if (t === '') return '';
  const range = /^(-?\d+)\s*\.\.\s*(-?\d+)$/.exec(t);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  if (/^-?\d+$/.test(t)) return Number(t);
  return t;
}

function parseEnd(text, start) {
  const t = trimmed(text);
  if (t === '') return start;
  if (/^(ongoing|open|null)$/i.test(t)) return null;
  return parseBound(t);
}

function parseNumber(text) {
  const t = trimmed(text);
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : t;
}

function citationsOf(list) {
  return (Array.isArray(list) ? list : [])
    .filter((c) => trimmed(c?.source) !== '')
    .map((c) => ({ source: trimmed(c.source), locator: orNull(c.locator) }));
}

// The envelope. `authors` carries the name the contributor gave and no
// handle: the Action sets github from the issue opener, because a handle
// typed into a form is not attribution (docs/review-2026-09-01.md,
// finding 9). `created` is likewise re-set by the Action.
function envelope(kind, id, { author = '', today = '1970-01-01' } = {}) {
  return {
    schema: 1,
    id,
    kind,
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: trimmed(author), github: null }],
    license: 'CC-BY-SA-4.0',
    created: today,
    revised: null,
  };
}

export function buildRecord(kind, values, context = {}) {
  const v = values ?? {};
  if (kind === 'event') {
    const start = parseBound(v.start);
    const when = { start, end: parseEnd(v.end, start) };
    if (trimmed(v.date) !== '') when.date = trimmed(v.date);
    if (trimmed(v.calendar) !== '') when.calendar = trimmed(v.calendar);
    const hasPlace = [v.lon, v.lat, v.label].some((x) => trimmed(x) !== '');
    return {
      ...envelope('event', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      title: trimmed(v.title),
      summary: trimmed(v.summary),
      when,
      where: hasPlace
        ? { lon: parseNumber(v.lon), lat: parseNumber(v.lat), precision: trimmed(v.precision) || 'city', label: trimmed(v.label) }
        : null,
      region: orNull(v.region),
      actors: [],
    };
  }

  if (kind === 'edge') {
    const from = trimmed(v.from);
    const to = trimmed(v.to);
    const type = trimmed(v.type);
    const record = {
      ...envelope('edge', `${from}--${to}--${type}`, context),
      sources: citationsOf(v.citations),
      from,
      to,
      type,
      confidence: trimmed(v.confidence),
      explanation: trimmed(v.explanation),
    };
    if (record.confidence === 'disputed') {
      record.dispute = { text: trimmed(v.disputeText), sources: citationsOf(v.disputeCitations) };
    }
    return record;
  }

  if (kind === 'source') {
    const year = parseNumber(v.year);
    return {
      ...envelope('source', trimmed(v.id), context),
      type: trimmed(v.type) || 'book',
      creators: trimmed(v.creators).split(';').map((s) => s.trim()).filter(Boolean),
      title: trimmed(v.title),
      year: typeof year === 'number' && !Number.isInteger(year) ? trimmed(v.year) : year,
      publisher: orNull(v.publisher),
      isbn: orNull(v.isbn),
      doi: orNull(v.doi),
      url: orNull(v.url),
      accessed: orNull(v.accessed),
      repository: orNull(v.repository),
      reference: orNull(v.reference),
    };
  }

  throw new Error(`kind must be event, edge or source, not "${kind}"`);
}

// entries: [{ kind, values }] in the order the contributor added them.
export function buildBundle(entries, context = {}) {
  return { schema: 1, records: (entries ?? []).map((e) => buildRecord(e.kind, e.values, context)) };
}

// --- duplicate search ------------------------------------------------------
// Transliteration makes duplicate slugs a certainty (finding 5), so the form
// searches titles, ids and former ids before allowing a new event. Cheap and
// deterministic on purpose: this is a prompt to look, not a decision.

const STOPWORDS = new Set(['the', 'of', 'a', 'an', 'and', 'in', 'on', 'at', 'to', 'for', 'by']);

export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function words(text) {
  return normalizeText(text).split(' ').filter((w) => w !== '' && !STOPWORDS.has(w));
}

export function similarity(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === '' || nb === '') return 0;
  if (na === nb) return 1;
  const A = new Set(words(a));
  const B = new Set(words(b));
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  const union = A.size + B.size - shared;
  const jaccard = union === 0 ? 0 : shared / union;
  if (na.includes(nb) || nb.includes(na)) return Math.max(jaccard, 0.8);
  return jaccard;
}

// candidates: [{ id, title, aliases }] — the topology's events and the ones
// already in the bundle.
export function findSimilar(title, candidates, { limit = 5, threshold = 0.34 } = {}) {
  const found = [];
  for (const c of candidates ?? []) {
    let score = 0;
    let matched = null;
    for (const name of [c.title, c.id, ...(c.aliases ?? [])]) {
      const s = similarity(title, name);
      if (s > score) {
        score = s;
        matched = name;
      }
    }
    if (score >= threshold) found.push({ id: c.id, title: c.title ?? c.id, matched, score });
  }
  return found
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit);
}

// --- validation ------------------------------------------------------------

// The bundle envelope. Not checked against v1/bundle.json: its `records` is
// a oneOf over the three record schemas, so one wrong field in an event
// reports "0 of 3 alternatives matched" instead of the field. core.validate
// picks the schema by `kind` and reports the real path, which is what the
// form needs to put the message next to the input.
export function checkBundleShape(bundle) {
  if (!isObject(bundle)) return [{ path: '', message: 'a bundle is a JSON object' }];
  const problems = [];
  if (bundle.schema !== 1) problems.push({ path: '/schema', message: 'a bundle declares "schema": 1' });
  if (!Array.isArray(bundle.records)) {
    problems.push({ path: '/records', message: 'records must be an array of records' });
  } else if (bundle.records.length === 0) {
    problems.push({ path: '/records', message: 'a bundle contains at least one record' });
  }
  for (const key of Object.keys(bundle)) {
    if (key !== 'schema' && key !== 'records') problems.push({ path: `/${key}`, message: `unknown property "${key}"` });
  }
  return problems;
}

// Runs the same validate() the CLI runs, against the topology the site
// loaded, so references, arrow of time, consensus and dispute all fire in
// the browser and the Action rejects nothing the form called fine.
export function validateBundle(bundle, topology, schemas) {
  const shape = checkBundleShape(bundle);
  if (shape.length) {
    return {
      errors: shape.map((p) => ({ level: 'error', rule: 1, id: null, kind: 'bundle', path: p.path, message: p.message })),
      warnings: [],
      ok: false,
    };
  }
  const { errors, warnings } = validate(bundle.records, topology, schemas);
  return { errors, warnings, ok: errors.length === 0 && everythingCited(bundle) };
}

// Rule 6 says the same thing, but the submit control hangs on it, so it is
// asserted here rather than inferred from an empty error list.
export function everythingCited(bundle) {
  return (bundle?.records ?? [])
    .filter((r) => r.kind === 'event' || r.kind === 'edge')
    .every((r) => Array.isArray(r.sources) && r.sources.length > 0);
}

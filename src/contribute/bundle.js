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
import { ACTOR_TYPES, EDGE_TYPES, RELATION_TYPES } from '../validate/rules.js';

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
    { key: 'endDate', label: 'Exact end date', input: 'text', path: '/when/endDate', hint: 'only for something that ran between two known days, in the same shape and calendar as the exact date' },
    { key: 'place', label: 'Place', input: 'select', optionsFrom: 'places', path: '/place', hint: 'a place record, chosen by name; add one below if it is not there yet. Leave it empty for a long process with no honest point' },
    { key: 'region', label: 'Timeline lane', input: 'select', optionsFrom: 'regions', path: '/region', hint: 'derived from the place; set it only when the derivation would be wrong, and always when there is no place' },
  ]),
  place: Object.freeze([
    { key: 'names', label: 'Names', input: 'text', path: '/names', required: true, hint: 'the display name first, then variants and other-language forms, separated by semicolons: Lisbon; Lisboa' },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens; it becomes the file name and the permanent URL' },
    { key: 'lon', label: 'Longitude', input: 'text', path: '/where/lon', required: true, hint: 'WGS84, east positive' },
    { key: 'lat', label: 'Latitude', input: 'text', path: '/where/lat', required: true, hint: 'WGS84, north positive' },
    { key: 'precision', label: 'Precision', input: 'select', options: PRECISION, path: '/where/precision' },
    { key: 'region', label: 'Timeline lane', input: 'select', optionsFrom: 'regions', path: '/region', hint: 'derived from the coordinates; set it only when the derivation would be wrong' },
    { key: 'summary', label: 'Summary', input: 'textarea', path: '/summary', hint: 'optional, and written by you when it is there' },
  ]),
  edge: Object.freeze([
    { key: 'from', label: 'From', input: 'select', optionsFrom: 'events', path: '/from', required: true },
    { key: 'to', label: 'To', input: 'select', optionsFrom: 'events', path: '/to', required: true },
    { key: 'type', label: 'Type', input: 'select', options: ['', ...EDGE_TYPES], path: '/type', required: true, hint: 'the right one of five, not the nearest one' },
    { key: 'confidence', label: 'Confidence', input: 'select', options: ['', ...CONFIDENCE], path: '/confidence', required: true, hint: 'defined by evidence, not by how strongly you feel: consensus needs two sources by different authors' },
    { key: 'explanation', label: 'Explanation', input: 'textarea', path: '/explanation', required: true, hint: 'the argument for the link, written by you: why this, and not coincidence' },
    { key: 'disputeText', label: 'The dispute', input: 'textarea', path: '/dispute/text', when: (v) => v.confidence === 'disputed', hint: 'who disagrees about this link, and why; the reader sees the disagreement rather than a side' },
  ]),
  actor: Object.freeze([
    { key: 'names', label: 'Names', input: 'text', path: '/names', required: true, hint: 'the display name first, then variants, former names and acronyms, separated by semicolons' },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens; it becomes the file name and the permanent URL' },
    { key: 'actorType', label: 'Type', input: 'select', options: ['', ...ACTOR_TYPES], path: '/actorType', required: true, hint: 'a person, a polity, an institution, or a people' },
    { key: 'summary', label: 'Summary', input: 'textarea', path: '/summary', required: true, hint: 'written by you, in your own words' },
    { key: 'start', label: 'Start year', input: 'text', path: '/when/start', required: true, hint: 'birth for a person, founding for the rest; a range as 1400..1450' },
    { key: 'end', label: 'End year', input: 'text', path: '/when/end', hint: 'death or dissolution; write "ongoing" for someone still alive or a body still standing' },
    { key: 'label', label: 'Seat or birthplace', input: 'text', path: '/where/label', hint: 'optional: leave the three place fields blank rather than invent a point' },
    { key: 'lon', label: 'Longitude', input: 'text', path: '/where/lon', hint: 'WGS84, east positive' },
    { key: 'lat', label: 'Latitude', input: 'text', path: '/where/lat', hint: 'WGS84, north positive' },
    { key: 'precision', label: 'Precision', input: 'select', options: PRECISION, path: '/where/precision' },
  ]),
  relation: Object.freeze([
    { key: 'from', label: 'From', input: 'select', optionsFrom: 'actors', path: '/from', required: true, hint: 'the regime, the body, the person: the end the type is written from' },
    { key: 'to', label: 'To', input: 'select', optionsFrom: 'actors', path: '/to', required: true },
    { key: 'type', label: 'Type', input: 'select', options: ['', ...RELATION_TYPES], path: '/type', required: true, hint: 'regime-of a state, succeeded by, member-of a body, part-of a body, led it, allied-with it' },
    { key: 'start', label: 'Start year', input: 'text', path: '/when/start', required: true, hint: 'the year the relation began; a range as 1400..1450' },
    { key: 'end', label: 'End year', input: 'text', path: '/when/end', hint: 'blank means the same year as the start; write "ongoing" for one that still holds' },
    { key: 'date', label: 'Exact date', input: 'text', path: '/when/date', hint: 'display only, for a relation that began on a known day: YYYY-MM-DD or YYYY-MM' },
    { key: 'note', label: 'Note', input: 'text', path: '/note', hint: 'optional, short, and written by you: what the type and the dates cannot say' },
  ]),
  narrative: Object.freeze([
    { key: 'title', label: 'Title', input: 'text', path: '/title', required: true },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens; it becomes the file name and the permanent URL' },
    { key: 'summary', label: 'Summary', input: 'textarea', path: '/summary', required: true, hint: 'what your account claims, in your own words — enough for a reader choosing between two accounts of the same period' },
    { key: 'windowFrom', label: 'Opens in', input: 'text', path: '/window/from', hint: 'optional: the year the atlas opens on when the narrative is opened' },
    { key: 'windowTo', label: 'Closes in', input: 'text', path: '/window/to', hint: 'optional; leave both blank to open on whatever the reader was looking at' },
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
  actor: [{ key: 'citations', label: 'Sources', path: '/sources' }],
  // A relation is an assertion about two actors, so it cites like an edge.
  relation: [{ key: 'citations', label: 'Sources', path: '/sources' }],
  // A narrative cites what it rests on beyond the records it walks.
  narrative: [{ key: 'citations', label: 'Sources', path: '/sources' }],
  // A place is a geographic fact, not an argument: rule 6 exempts it, and the
  // form says so rather than asking for a citation nobody has.
  place: [],
});

// The actors of an event, each with the role it played in it. One list, on
// one kind, but the same shape as a citation list: a repeatable row of a
// reference and a bit of text.
export const ACTOR_LISTS = Object.freeze({
  event: [{ key: 'actors', label: 'Actors', path: '/actors' }],
  edge: [],
  source: [],
  actor: [],
  relation: [],
  place: [],
  narrative: [],
});

// The steps of a narrative: the same repeatable shape again — a reference and
// a bit of text — except that the reference is to an event *or* a link, and
// the text is the narrator's own paragraph rather than a role. Order is the
// order of the rows, which is the order of the walk.
export const STEP_LISTS = Object.freeze({
  narrative: [{ key: 'steps', label: 'Steps', path: '/steps' }],
  event: [],
  edge: [],
  source: [],
  actor: [],
  relation: [],
  place: [],
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
  for (const list of ACTOR_LISTS[kind]) values[list.key] = [];
  for (const list of STEP_LISTS[kind]) values[list.key] = [];
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

// A row with no actor chosen is a row the contributor has not filled in
// yet, not an error: it is dropped. A blank role is kept, so the schema
// reports it at /actors/<i>/role and the form puts the message on the row.
function actorsOf(list) {
  return (Array.isArray(list) ? list : [])
    .filter((a) => trimmed(a?.actor) !== '')
    .map((a) => ({ actor: trimmed(a.actor), role: trimmed(a.role) }));
}

// A row with nothing chosen is a row the contributor has not filled in yet,
// as an actor row is; a chosen record with no text is kept, so rule 20
// reports it at /steps/<i>/text and the form puts the message on the row.
function stepsOf(list) {
  return (Array.isArray(list) ? list : [])
    .filter((s) => trimmed(s?.ref) !== '')
    .map((s) => ({ ref: trimmed(s.ref), text: trimmed(s.text) }));
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
    if (trimmed(v.endDate) !== '') when.endDate = trimmed(v.endDate);
    return {
      ...envelope('event', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      title: trimmed(v.title),
      summary: trimmed(v.summary),
      when,
      place: orNull(v.place),
      region: orNull(v.region),
      actors: actorsOf(v.actors),
    };
  }

  if (kind === 'place') {
    const names = trimmed(v.names).split(';').map((s) => s.trim()).filter(Boolean);
    return {
      ...envelope('place', trimmed(v.id), context),
      sources: [],
      names,
      // The label of the point is the display name: two fields for one thing
      // would only let them disagree.
      where: { lon: parseNumber(v.lon), lat: parseNumber(v.lat), precision: trimmed(v.precision) || 'city', label: names[0] ?? '' },
      region: orNull(v.region),
      summary: orNull(v.summary),
    };
  }

  if (kind === 'actor') {
    const start = parseBound(v.start);
    const hasPlace = [v.lon, v.lat, v.label].some((x) => trimmed(x) !== '');
    return {
      ...envelope('actor', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      actorType: trimmed(v.actorType),
      names: trimmed(v.names).split(';').map((s) => s.trim()).filter(Boolean),
      summary: trimmed(v.summary),
      when: { start, end: parseEnd(v.end, start) },
      where: hasPlace
        ? { lon: parseNumber(v.lon), lat: parseNumber(v.lat), precision: trimmed(v.precision) || 'city', label: trimmed(v.label) }
        : null,
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

  if (kind === 'relation') {
    const from = trimmed(v.from);
    const to = trimmed(v.to);
    const type = trimmed(v.type);
    const start = parseBound(v.start);
    const when = { start, end: parseEnd(v.end, start) };
    if (trimmed(v.date) !== '') when.date = trimmed(v.date);
    return {
      ...envelope('relation', `${from}--${to}--${type}`, context),
      sources: citationsOf(v.citations),
      from,
      to,
      type,
      when,
      note: orNull(v.note),
    };
  }

  if (kind === 'narrative') {
    const from = parseBound(v.windowFrom);
    const to = parseBound(v.windowTo);
    const record = {
      ...envelope('narrative', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      title: trimmed(v.title),
      summary: trimmed(v.summary),
      steps: stepsOf(v.steps),
    };
    // Half a window is not a window: either both years are there or the
    // narrative opens on whatever the reader was already looking at.
    if (from !== '' || to !== '') record.window = { from, to };
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

  throw new Error(`kind must be event, edge, source, actor, place, relation or narrative, not "${kind}"`);
}

// entries: [{ kind, values }] in the order the contributor added them.
export function buildBundle(entries, context = {}) {
  return { schema: 1, records: (entries ?? []).map((e) => buildRecord(e.kind, e.values, context)) };
}

// --- reading a record back into the form -----------------------------------
// buildRecord runs one way, from what somebody typed to a record. The review
// dashboard needs the other way: an existing record shown in the same inputs,
// edited, and written back. Everything below is the inverse, and
// tests/bundle.test.mjs asserts on every record in data/ that the two
// compose to the identity — byte for byte, so that opening a record in the
// dashboard and saving it unchanged does not touch the file.

function boundText(bound) {
  if (bound === null || bound === undefined) return '';
  if (typeof bound === 'number') return String(bound);
  if (isObject(bound) && typeof bound.min === 'number' && typeof bound.max === 'number') return `${bound.min}..${bound.max}`;
  return String(bound);
}

// An end equal to the start is what a blank end field means, and a null end
// is "ongoing": the shorthands the form offers are the shorthands it reads.
function endText(end, start) {
  if (end === null || end === undefined) return 'ongoing';
  if (JSON.stringify(end) === JSON.stringify(start)) return '';
  return boundText(end);
}

function numberText(value) {
  return value === null || value === undefined ? '' : String(value);
}

function citationValues(list) {
  return (Array.isArray(list) ? list : []).map((c) => ({ source: c?.source ?? '', locator: c?.locator ?? '' }));
}

export function valuesFromRecord(kind, record) {
  const r = record ?? {};
  const values = emptyValues(kind);
  if (CITATION_LISTS[kind].some((l) => l.key === 'citations')) values.citations = citationValues(r.sources);

  if (kind === 'event') {
    const when = isObject(r.when) ? r.when : {};
    return {
      ...values,
      id: r.id ?? '',
      title: r.title ?? '',
      summary: r.summary ?? '',
      start: boundText(when.start),
      end: endText(when.end, when.start),
      date: when.date ?? '',
      calendar: when.calendar ?? '',
      endDate: when.endDate ?? '',
      place: r.place ?? '',
      region: r.region ?? '',
      actors: (Array.isArray(r.actors) ? r.actors : []).map((a) => ({ actor: a?.actor ?? '', role: a?.role ?? '' })),
    };
  }

  if (kind === 'place') {
    const where = isObject(r.where) ? r.where : {};
    return {
      ...values,
      id: r.id ?? '',
      names: (r.names ?? []).join('; '),
      lon: numberText(where.lon),
      lat: numberText(where.lat),
      precision: where.precision ?? '',
      region: r.region ?? '',
      summary: r.summary ?? '',
    };
  }

  if (kind === 'actor') {
    const when = isObject(r.when) ? r.when : {};
    const where = isObject(r.where) ? r.where : {};
    return {
      ...values,
      id: r.id ?? '',
      names: (r.names ?? []).join('; '),
      actorType: r.actorType ?? '',
      summary: r.summary ?? '',
      start: boundText(when.start),
      end: endText(when.end, when.start),
      label: where.label ?? '',
      lon: numberText(where.lon),
      lat: numberText(where.lat),
      precision: where.precision ?? '',
    };
  }

  if (kind === 'edge') {
    const dispute = isObject(r.dispute) ? r.dispute : null;
    return {
      ...values,
      id: r.id ?? '',
      from: r.from ?? '',
      to: r.to ?? '',
      type: r.type ?? '',
      confidence: r.confidence ?? '',
      explanation: r.explanation ?? '',
      disputeText: dispute?.text ?? '',
      disputeCitations: citationValues(dispute?.sources),
    };
  }

  if (kind === 'relation') {
    const when = isObject(r.when) ? r.when : {};
    return {
      ...values,
      id: r.id ?? '',
      from: r.from ?? '',
      to: r.to ?? '',
      type: r.type ?? '',
      start: boundText(when.start),
      end: endText(when.end, when.start),
      date: when.date ?? '',
      note: r.note ?? '',
    };
  }

  if (kind === 'narrative') {
    const window = isObject(r.window) ? r.window : {};
    return {
      ...values,
      id: r.id ?? '',
      title: r.title ?? '',
      summary: r.summary ?? '',
      windowFrom: boundText(window.from),
      windowTo: boundText(window.to),
      steps: (Array.isArray(r.steps) ? r.steps : []).map((s) => ({ ref: s?.ref ?? '', text: s?.text ?? '' })),
    };
  }

  if (kind === 'source') {
    return {
      ...values,
      id: r.id ?? '',
      type: r.type ?? '',
      creators: (r.creators ?? []).join('; '),
      title: r.title ?? '',
      year: numberText(r.year),
      publisher: r.publisher ?? '',
      isbn: r.isbn ?? '',
      doi: r.doi ?? '',
      url: r.url ?? '',
      accessed: r.accessed ?? '',
      repository: r.repository ?? '',
      reference: r.reference ?? '',
    };
  }

  throw new Error(`kind must be event, edge, source, actor, place, relation or narrative, not "${kind}"`);
}

// The envelope is not the editor's to write. `created`, `aliases`,
// `supersededBy` and `authors` carry the record's history, `status` is
// Retract's to change and `revised` Sign's, and the id is immutable once
// merged — everything that points at this record points at that string.
// `review` is on the list for the same reason: it says what still wants
// checking, and only signing the record answers it.
const ENVELOPE_KEYS = Object.freeze(['schema', 'id', 'kind', 'status', 'supersededBy', 'aliases', 'authors', 'license', 'created', 'revised', 'review']);

// Rebuild `built` in the key order of `original`, recursively, so that a save
// that changed nothing produces the same bytes. Keys the original does not
// have go last, in the order buildRecord wrote them.
function orderLike(built, original) {
  if (!isObject(built) || !isObject(original)) return built;
  const out = {};
  for (const key of Object.keys(original)) {
    if (Object.hasOwn(built, key)) out[key] = orderLike(built[key], original[key]);
  }
  for (const key of Object.keys(built)) {
    if (!Object.hasOwn(out, key)) out[key] = built[key];
  }
  return out;
}

// The original record with the edited fields replaced: the body from the form
// values, the envelope from what was already on disk.
export function applyValues(kind, record, values) {
  const built = buildRecord(kind, values, {});
  for (const key of ENVELOPE_KEYS) {
    if (Object.hasOwn(record ?? {}, key)) built[key] = record[key];
  }
  // A place's point carries a label, which buildRecord sets from the display
  // name because two fields for one thing would only let them disagree. An
  // existing label that merely differs in case is still the record's own, so
  // it is kept until the names themselves are edited.
  if (kind === 'place' && isObject(record?.where) && isObject(built.where)
    && (record.names ?? []).join(' ') === built.names.join(' ')) {
    built.where.label = record.where.label;
  }
  // An edge that is not disputed has no dispute block, which the form leaves
  // out and tools/new-record.mjs writes as an explicit null. Both are valid,
  // and a review is not the place to churn one into the other.
  if (kind === 'edge' && !Object.hasOwn(built, 'dispute') && record?.dispute === null) {
    built.dispute = null;
  }
  return orderLike(built, record ?? {});
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
    .filter((r) => r.kind === 'event' || r.kind === 'edge' || r.kind === 'actor' || r.kind === 'relation')
    .every((r) => Array.isArray(r.sources) && r.sources.length > 0);
}

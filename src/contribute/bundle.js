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
import { createValidator } from '../validate/schema.js';
import { ACTOR_TYPES, EDGE_TYPES, RELATION_TYPES, buildUniverse } from '../validate/rules.js';
import { OFFICE_CATEGORY_IDS as OFFICE_CATEGORIES } from '../vocab.js';
import { CONTAINER_KINDS } from '../citation.js';
import { KIND, CONTRIBUTED_KINDS, listsOf } from '../kinds.js';
import { articleTitles } from '../wikipedia.js';

export const CONFIDENCE = Object.freeze(['consensus', 'probable', 'disputed']);
export const SOURCE_TYPES = Object.freeze(['book', 'chapter', 'article', 'thesis', 'primary', 'dataset', 'web']);
export const PRECISION = Object.freeze(['point', 'city', 'region']);

// The Wikidata item id out of whatever was pasted: the id on its own, or a
// Wikidata URL in the shapes the site hands out. A *Wikipedia* article URL
// carries no item id — a title is not an item — so it comes back exactly as
// typed and the schema reports it at /wikidata, rather than this function
// guessing a Q-number from a title. Guessing an identifier is how two
// records end up claiming one item.
export function wikidataFrom(text) {
  const t = typeof text === 'string' ? text.trim() : '';
  if (t === '') return '';
  const url = /^https?:\/\/(?:www\.)?wikidata\.org\/(?:wiki|entity)\/(?:Special:EntityPage\/)?(Q[1-9][0-9]*)(?:[#?/].*)?$/i.exec(t);
  if (url) return url[1].toUpperCase();
  return /^[Qq][1-9][0-9]*$/.test(t) ? t.toUpperCase() : t;
}

// The one identity field a person may write. `wikipedia` and `sitelinks` are
// the import's — a title and a count are read off Wikidata, not typed — so
// they never appear in a form and are carried through a save untouched
// (IDENTITY_KEYS, below).
const WIKIDATA_FIELD = Object.freeze({
  key: 'wikidata',
  label: 'Wikidata item',
  input: 'text',
  path: '/wikidata',
  identity: true,
  derive: wikidataFrom,
  hint: 'optional: paste the item\'s Wikidata URL and the Q-number is taken from it. An identifier, never a source — the argument stays in the record',
});

// The long form, on the three kinds that have an entry page. It is the one
// textarea with a preview beside it: the subset is small but it is a syntax,
// and a contributor who cannot see what a citation mark did will guess.
const BODY_FIELD = Object.freeze({
  key: 'body',
  label: 'Full entry',
  input: 'textarea',
  path: '/body',
  body: true,
  hint: 'optional, and the long form of this record: paragraphs, ## and ### headings, *emphasis*, - lists, > quotations, [text](event:some-id) into the atlas, [text](https://…) out of it, and [^source-id p. 12] for a work this record already cites. No HTML, no images',
});

// Field descriptors. `path` is the JSON pointer the validator reports for
// that field, which is how an error finds its way back to the input that
// caused it. `optionsFrom` is filled at render time from the topology.
// `identity` marks a field the review dashboard shows read-only: what a
// record is catalogued as elsewhere is not corrected by editing this atlas.
const DESCRIPTORS = Object.freeze({
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
    BODY_FIELD,
    WIKIDATA_FIELD,
  ]),
  place: Object.freeze([
    { key: 'names', label: 'Names', input: 'text', path: '/names', required: true, hint: 'the display name first, then variants and other-language forms, separated by semicolons: Lisbon; Lisboa' },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens; it becomes the file name and the permanent URL' },
    { key: 'lon', label: 'Longitude', input: 'text', path: '/where/lon', required: true, hint: 'WGS84, east positive' },
    { key: 'lat', label: 'Latitude', input: 'text', path: '/where/lat', required: true, hint: 'WGS84, north positive' },
    { key: 'precision', label: 'Precision', input: 'select', options: PRECISION, path: '/where/precision' },
    { key: 'region', label: 'Timeline lane', input: 'select', optionsFrom: 'regions', path: '/region', hint: 'derived from the coordinates; set it only when the derivation would be wrong' },
    { key: 'summary', label: 'Summary', input: 'textarea', path: '/summary', hint: 'optional, and written by you when it is there' },
    BODY_FIELD,
    WIKIDATA_FIELD,
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
    BODY_FIELD,
    WIKIDATA_FIELD,
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
  office: Object.freeze([
    { key: 'title', label: 'Title', input: 'text', path: '/title', required: true, hint: 'what the post is called, as its own actor calls it: King of Portugal, Prime Minister, Secretary-General' },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens; it becomes the file name and the permanent URL' },
    { key: 'of', label: 'Of', input: 'select', optionsFrom: 'actors', path: '/of', required: true, hint: 'the actor whose office this is: the state, the party, the body' },
    { key: 'category', label: 'Category', input: 'select', options: ['', ...OFFICE_CATEGORIES], path: '/category', required: true, hint: 'what kind of post it is; it also decides which kind of actor may stand at "Of"' },
    { key: 'start', label: 'Start year', input: 'text', path: '/when/start', hint: 'the year the office itself was created; leave both years blank rather than guess one' },
    { key: 'end', label: 'End year', input: 'text', path: '/when/end', hint: 'blank means the same year as the start; write "ongoing" for a post that still exists' },
    { key: 'summary', label: 'Summary', input: 'textarea', path: '/summary', hint: 'optional, and written by you when it is there' },
    WIKIDATA_FIELD,
  ]),
  tenure: Object.freeze([
    { key: 'person', label: 'Person', input: 'select', optionsFrom: 'actors', path: '/person', required: true, hint: 'who held it; an actor of type person' },
    { key: 'office', label: 'Office', input: 'select', optionsFrom: 'offices', path: '/office', required: true, hint: 'the post they held; add one above if it is not there yet' },
    { key: 'id', label: 'Id', input: 'text', path: '/id', required: true, hint: 'lowercase words joined by hyphens, and one person may hold one office more than once: soares-prime-minister-1976' },
    { key: 'start', label: 'Start year', input: 'text', path: '/when/start', required: true, hint: 'the year they took it; a range as 1400..1450' },
    { key: 'end', label: 'End year', input: 'text', path: '/when/end', hint: 'blank means the same year as the start; write "ongoing" for somebody still in post' },
    { key: 'startedBy', label: 'Started by', input: 'select', optionsFrom: 'events', path: '/startedBy', hint: 'optional: the election, the coup or the succession that began it' },
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
    // The containing work. Five fields and one rule: leave the title empty
    // and no container is written at all, which is what every source record
    // written before these fields existed looks like.
    { key: 'containerTitle', label: 'In', input: 'text', path: '/container/title', hint: 'the journal, the edited volume, the series or the site this work is inside; leave empty for a work that stands alone' },
    { key: 'containerKind', label: 'And it is a', input: 'select', options: ['', ...CONTAINER_KINDS], path: '/container/kind', hint: 'required once you have named one: a chapter in an edited volume and an article in a journal are not cited alike' },
    { key: 'volume', label: 'Volume', input: 'text', path: '/container/volume', hint: 'of the containing work; also the number in a series' },
    { key: 'issue', label: 'Issue', input: 'text', path: '/container/issue' },
    { key: 'pages', label: 'Pages', input: 'text', path: '/container/pages', hint: 'as printed: 45-67' },
    { key: 'publisher', label: 'Publisher', input: 'text', path: '/publisher' },
    { key: 'isbn', label: 'ISBN', input: 'text', path: '/isbn', hint: '10 or 13 digits, no hyphens' },
    { key: 'doi', label: 'DOI', input: 'text', path: '/doi', hint: '10.xxxx/…' },
    { key: 'url', label: 'URL', input: 'text', path: '/url', hint: 'http(s); for a web source, preferably an archive URL' },
    { key: 'accessed', label: 'Accessed', input: 'text', path: '/accessed', hint: 'YYYY-MM-DD; required for a web source' },
    { key: 'repository', label: 'Repository', input: 'text', path: '/repository', hint: 'for a primary source: the archive holding the document' },
    { key: 'reference', label: 'Reference', input: 'text', path: '/reference', hint: 'for a primary source: the shelfmark' },
  ]),
});

// The form's fields for each kind, in the order the registry names them.
// The descriptors above carry the label, the hint and the JSON pointer an
// error is reported at; `kinds.js` carries the list of names, so a field
// added to a kind is added in one place and appears here or fails loudly.
// Ordering by the registry rather than by the literal above is what makes
// the registry load-bearing: a name it does not know is not drawn, and a
// name it knows and the descriptors do not is a crash on load rather than a
// field that quietly went missing from the form.
function fieldsFromRegistry() {
  const built = {};
  // The kinds a person writes, and only those: a presence carries geometry
  // and arrives through tools/import/, so the form has no fields for one and
  // `Object.hasOwn(FIELDS, kind)` is how a caller asks whether this kind is
  // the form's business at all.
  for (const kind of CONTRIBUTED_KINDS) {
    const byKey = new Map((DESCRIPTORS[kind] ?? []).map((f) => [f.key, f]));
    const names = KIND[kind].fields;
    for (const key of byKey.keys()) {
      if (!names.includes(key)) throw new Error(`src/kinds.js: ${kind} has no field "${key}"`);
    }
    built[kind] = Object.freeze(names.map((key) => {
      const field = byKey.get(key);
      if (!field) throw new Error(`src/contribute/bundle.js: ${kind} has no descriptor for field "${key}"`);
      return field;
    }));
  }
  return Object.freeze(built);
}

export const FIELDS = fieldsFromRegistry();

// What a caller is told when it hands one of these functions a kind the form
// does not build. Written from the registry, so a ninth kind is named in the
// message the day it has fields rather than the day somebody remembers.
function unknownKind(kind) {
  const known = CONTRIBUTED_KINDS;
  const list = `${known.slice(0, -1).join(', ')} or ${known[known.length - 1]}`;
  return `kind must be ${list}, not ${JSON.stringify(kind)}`;
}

// Which citation lists a kind carries, which actor lists, which step lists:
// all three from the registry, where a kind's whole entry is written at once.
// Sources cite nothing (rule 6 exempts them, as it exempts a place); a
// dispute's dissenting citations are kept apart from the supporting ones so
// the panel can show which is which; and the actors of an event and the steps
// of a narrative are the same repeatable shape as a citation row.
export const CITATION_LISTS = listsOf('citations');
export const ACTOR_LISTS = listsOf('actors');
export const STEP_LISTS = listsOf('steps');

// --- ordered lists ---------------------------------------------------------
// A narrative's steps are the one list whose order is part of what it says:
// the walk is the order of the rows, and a step in the wrong place is a
// different argument. Moving one is therefore an operation on the list and
// not a matter of dragging a row about, and it is here, pure, so that
// node --test holds it without a form.

// Can the item at `at` move by `delta`? False off either end and false for a
// list of one, which is what disables the buttons at the top and the bottom
// rather than each caller working it out again.
export function canMove(list, at, delta) {
  if (!Array.isArray(list)) return false;
  if (!Number.isInteger(at) || at < 0 || at >= list.length) return false;
  const to = at + delta;
  return Number.isInteger(to) && to >= 0 && to < list.length && to !== at;
}

// The list with one item moved, as a new array. A move that cannot be made
// returns the list's own items unchanged, so a caller never has to guard the
// ends: the buttons are disabled there and the keyboard simply does nothing.
export function moveItem(list, at, delta) {
  const items = Array.isArray(list) ? [...list] : [];
  if (!canMove(items, at, delta)) return items;
  const [moved] = items.splice(at, 1);
  items.splice(at + delta, 0, moved);
  return items;
}

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

// The identity a record claims, on the kinds that may claim one. Only
// `wikidata` is ever typed: `wikipedia` and `sitelinks` are the import's and
// reach a saved record through IDENTITY_KEYS, never through a form. An empty
// field writes no key at all, so a record without an identity looks exactly
// as it did before these fields existed.
function withIdentity(record, values) {
  const item = wikidataFrom(values.wikidata);
  if (item !== '') record.wikidata = item;
  return record;
}

// The full entry, on the three kinds that have a page. An empty field writes
// no key at all — for the same reason an absent identity writes none — so a
// record whose long form nobody has written looks exactly as it did before
// the field existed, and a save that changed nothing changes no bytes.
function withBody(record, values) {
  const body = trimmed(values.body);
  if (body !== '') record.body = body;
  return record;
}

// The containing work, on a source. Written only when the contributor named
// one — an empty title writes no key at all, so a record that stands alone
// looks exactly as it did before these fields existed and a save that changed
// nothing changes no bytes. A title with no kind is written as it stands, so
// the schema reports it at /container/kind and the form puts the message on
// that field, rather than this function guessing which of the four it is.
function withContainer(record, values) {
  const named = ['containerTitle', 'containerKind', 'volume', 'issue', 'pages']
    .some((key) => trimmed(values[key]) !== '');
  if (!named) return record;
  const container = { title: trimmed(values.containerTitle), kind: trimmed(values.containerKind) };
  for (const [key, from] of [['volume', 'volume'], ['issue', 'issue'], ['pages', 'pages']]) {
    const value = orNull(values[from]);
    if (value !== null) container[key] = value;
  }
  record.container = container;
  return record;
}

export function buildRecord(kind, values, context = {}) {
  const v = values ?? {};
  if (kind === 'event') {
    const start = parseBound(v.start);
    const when = { start, end: parseEnd(v.end, start) };
    if (trimmed(v.date) !== '') when.date = trimmed(v.date);
    if (trimmed(v.calendar) !== '') when.calendar = trimmed(v.calendar);
    if (trimmed(v.endDate) !== '') when.endDate = trimmed(v.endDate);
    return withBody(withIdentity({
      ...envelope('event', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      title: trimmed(v.title),
      summary: trimmed(v.summary),
      when,
      place: orNull(v.place),
      region: orNull(v.region),
      actors: actorsOf(v.actors),
    }, v), v);
  }

  if (kind === 'place') {
    const names = trimmed(v.names).split(';').map((s) => s.trim()).filter(Boolean);
    return withBody(withIdentity({
      ...envelope('place', trimmed(v.id), context),
      sources: [],
      names,
      // The label of the point is the display name: two fields for one thing
      // would only let them disagree.
      where: { lon: parseNumber(v.lon), lat: parseNumber(v.lat), precision: trimmed(v.precision) || 'city', label: names[0] ?? '' },
      region: orNull(v.region),
      summary: orNull(v.summary),
    }, v), v);
  }

  if (kind === 'actor') {
    const start = parseBound(v.start);
    const hasPlace = [v.lon, v.lat, v.label].some((x) => trimmed(x) !== '');
    return withBody(withIdentity({
      ...envelope('actor', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      actorType: trimmed(v.actorType),
      names: trimmed(v.names).split(';').map((s) => s.trim()).filter(Boolean),
      summary: trimmed(v.summary),
      when: { start, end: parseEnd(v.end, start) },
      where: hasPlace
        ? { lon: parseNumber(v.lon), lat: parseNumber(v.lat), precision: trimmed(v.precision) || 'city', label: trimmed(v.label) }
        : null,
    }, v), v);
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

  if (kind === 'office') {
    const start = parseBound(v.start);
    return withIdentity({
      ...envelope('office', trimmed(v.id), context),
      // An office does not cite: rule 6 exempts it as it exempts a place,
      // and the list is written empty rather than left out.
      sources: [],
      of: trimmed(v.of),
      title: trimmed(v.title),
      category: trimmed(v.category),
      // Both years blank is an office the atlas dates not at all, which is
      // what the three Portuguese ones are (A13) — not a start of nothing.
      when: start === '' ? null : { start, end: parseEnd(v.end, start) },
      summary: orNull(v.summary),
    }, v);
  }

  if (kind === 'tenure') {
    const start = parseBound(v.start);
    return {
      ...envelope('tenure', trimmed(v.id), context),
      sources: citationsOf(v.citations),
      person: trimmed(v.person),
      office: trimmed(v.office),
      when: { start, end: parseEnd(v.end, start) },
      startedBy: orNull(v.startedBy),
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
    return withContainer({
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
    }, v);
  }

  throw new Error(`${unknownKind(kind)}`);
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
  // The item id as it is on the record: the field accepts a URL, and what
  // comes back out of it is what was stored, so a save that changed nothing
  // writes the same bytes.
  if (FIELDS[kind].some((f) => f.key === 'wikidata')) values.wikidata = r.wikidata ?? '';
  // The long form as it is on the record, so that opening an entry in the
  // dashboard and saving it unchanged writes the same bytes.
  if (FIELDS[kind].some((f) => f.key === 'body')) values.body = r.body ?? '';

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

  if (kind === 'office') {
    const dated = isObject(r.when);
    const when = dated ? r.when : {};
    return {
      ...values,
      id: r.id ?? '',
      title: r.title ?? '',
      of: r.of ?? '',
      category: r.category ?? '',
      start: boundText(when.start),
      // An undated office puts nothing in either field: `endText` reads an
      // absent end as "ongoing", which would be a claim this record does not
      // make and would not come back out as `when: null`.
      end: dated ? endText(when.end, when.start) : '',
      summary: r.summary ?? '',
    };
  }

  if (kind === 'tenure') {
    const when = isObject(r.when) ? r.when : {};
    return {
      ...values,
      id: r.id ?? '',
      person: r.person ?? '',
      office: r.office ?? '',
      start: boundText(when.start),
      end: endText(when.end, when.start),
      startedBy: r.startedBy ?? '',
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
    const container = isObject(r.container) ? r.container : {};
    return {
      ...values,
      id: r.id ?? '',
      type: r.type ?? '',
      creators: (r.creators ?? []).join('; '),
      title: r.title ?? '',
      year: numberText(r.year),
      containerTitle: container.title ?? '',
      containerKind: container.kind ?? '',
      volume: container.volume ?? '',
      issue: container.issue ?? '',
      pages: container.pages ?? '',
      publisher: r.publisher ?? '',
      isbn: r.isbn ?? '',
      doi: r.doi ?? '',
      url: r.url ?? '',
      accessed: r.accessed ?? '',
      repository: r.repository ?? '',
      reference: r.reference ?? '',
    };
  }

  throw new Error(`${unknownKind(kind)}`);
}

// The envelope is not the editor's to write. `created`, `aliases`,
// `supersededBy` and `authors` carry the record's history, `status` is
// Retract's to change and `revised` Sign's, and the id is immutable once
// merged — everything that points at this record points at that string.
// `review` is on the list for the same reason: it says what still wants
// checking, and only signing the record answers it. `origin` is the writer
// that created the record, which no later edit can change, and `retraction`
// is the record's own history, which nothing deletes — an editor that could
// drop either would be the hole this allowlist exists to close.
const ENVELOPE_KEYS = Object.freeze(['schema', 'id', 'kind', 'status', 'supersededBy', 'aliases', 'authors', 'license', 'created', 'revised', 'review', 'origin', 'retraction']);

// The identity fields no form writes. They are read off Wikidata by the
// import, so a save through the contribution form or the review dashboard
// carries them across untouched rather than dropping them — a field the
// editor cannot see is a field the editor must not delete. `wikidata` is not
// here: it is a field of its own, and buildRecord writes what was typed.
const IDENTITY_KEYS = Object.freeze(['wikipedia', 'sitelinks']);

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
  for (const key of [...ENVELOPE_KEYS, ...IDENTITY_KEYS]) {
    if (Object.hasOwn(record ?? {}, key)) built[key] = record[key];
  }
  // A place's point carries a label, which buildRecord sets from the display
  // name because two fields for one thing would only let them disagree. An
  // existing label that merely differs in case is still the record's own, so
  // it is kept until the names themselves are edited.
  if (kind === 'place' && isObject(record?.where) && isObject(built.where)
    && (record.names ?? []).join('\u001f') === built.names.join('\u001f')) {
    built.where.label = record.where.label;
  }
  // An edge that is not disputed has no dispute block, which the form leaves
  // out and tools/new-record.mjs writes as an explicit null. Both are valid,
  // and a review is not the place to churn one into the other.
  if (kind === 'edge' && !Object.hasOwn(built, 'dispute') && record?.dispute === null) {
    built.dispute = null;
  }
  // An entry nobody has written is an absent key, and an explicit null says
  // the same thing: whichever the record on disk has is what it keeps until
  // somebody actually writes the entry. A source that stands alone is the
  // same case: absent and null both mean no containing work.
  if (!Object.hasOwn(built, 'body') && record?.body === null) built.body = null;
  if (kind === 'source' && !Object.hasOwn(built, 'container') && record?.container === null) {
    built.container = null;
  }
  return orderLike(built, record ?? {});
}

// --- duplicate search ------------------------------------------------------
// Transliteration makes duplicate slugs a certainty (finding 5), so the form
// searches before allowing a new record. Cheap and deterministic on purpose:
// this is a prompt to look, not a decision.
//
// It used to search events, and events only: a second Lisbon, a second
// Salazar or a second edition of one book was not looked for at all, and the
// one field that settles the question — the Wikidata item both records claim
// — was not compared (health review A, finding 10; B, finding 6). Every kind
// is compared now, over every name it can be known by, and an identifier two
// records share is reported as certainty rather than as resemblance.

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


// A name with the two things comparing it needs, computed once. The scan is
// over every name of every record of one kind — twenty thousand of them —
// and normalising both sides again for each pair is most of what that used
// to cost.
function readied(name) {
  const text = normalizeText(name);
  return { name, text, words: new Set(text.split(' ').filter((w) => w !== '' && !STOPWORDS.has(w))) };
}

function scoreOf(a, b) {
  if (a.text === '' || b.text === '') return 0;
  if (a.text === b.text) return 1;
  let shared = 0;
  for (const w of a.words) if (b.words.has(w)) shared += 1;
  const union = a.words.size + b.words.size - shared;
  const jaccard = union === 0 ? 0 : shared / union;
  // A name inside another name: "Melaka" and "Capture of Melaka" are worth
  // looking at even where the word counts say otherwise.
  if (a.text.includes(b.text) || b.text.includes(a.text)) return Math.max(jaccard, 0.8);
  return jaccard;
}

export function similarity(a, b) {
  return scoreOf(readied(a), readied(b));
}

// The identifiers that decide the question rather than raise it. Two records
// claiming one Wikidata item are two records for one thing, whatever they are
// called; the same goes for an ISBN and for a DOI, which is how the same
// edition of one book gets entered twice. Folded so that "10.5555/X" and
// "10.5555/x" are one DOI and a hyphenated ISBN is the ISBN.
function identifiersOf(record) {
  const out = [];
  const text = (v) => (typeof v === 'string' ? v.trim() : '');
  if (text(record.wikidata)) out.push({ what: 'Wikidata item', value: text(record.wikidata).toUpperCase() });
  if (text(record.isbn)) out.push({ what: 'ISBN', value: text(record.isbn).replace(/[^0-9Xx]/g, '').toUpperCase() });
  if (text(record.doi)) out.push({ what: 'DOI', value: text(record.doi).toLowerCase() });
  return out;
}

// Everything one record can be recognised by: its title or its names, its
// former ids, the titles the encyclopedia gives it, its own id, and its
// identifiers. Built from a record — the atlas's, or one the form has just
// assembled out of what is in the inputs — so both sides of a comparison are
// read the same way.
export function comparableOf(record) {
  const r = record ?? {};
  const names = [];
  const push = (value) => {
    if (typeof value === 'string' && value.trim() !== '' && !names.includes(value)) names.push(value);
  };
  push(r.title);
  for (const n of Array.isArray(r.names) ? r.names : []) push(n);
  for (const t of articleTitles(r)) push(t);
  // The former ids, so typing the id a record used to have finds the record
  // that owns it.
  for (const a of Array.isArray(r.aliases) ? r.aliases : []) push(a);
  const id = typeof r.id === 'string' ? r.id : '';
  return {
    id,
    kind: r.kind ?? null,
    label: names[0] ?? id,
    terms: names.map(readied),
    // The id, kept apart from the names. A name typed here is compared
    // against the ids in the atlas as well, because a record's title and its
    // slug drift — the 25 April revolution is filed under
    // `carnation-revolution-1974` and titled "25 April", and somebody typing
    // "Carnation Revolution" has to be told it is already here. Two *ids* are
    // never compared with each other: every id is a slug of the title beside
    // it, so that comparison is the titles again with the spaces taken out,
    // and it says "similar" about half the atlas.
    against: id === '' ? names.map(readied) : [...names.map(readied), readied(id)],
    identifiers: identifiersOf(r),
  };
}

// The atlas's records as comparables, by kind and built once: a form that
// rebuilt this per keystroke would be doing the whole corpus's normalising
// again for every letter. `local` — the records in the bundle being written
// — is not in here, because it changes with every keystroke and is three
// records long.
export function comparableIndex(topology = {}) {
  const byKind = new Map();
  const add = (kind, list) => {
    const rows = [];
    for (const record of list ?? []) {
      if (record?.status && record.status !== 'active') continue;
      rows.push(comparableOf({ ...record, kind }));
    }
    byKind.set(kind, rows);
  };
  add('event', topology.events);
  add('actor', topology.actors);
  add('place', topology.places);
  add('source', topology.sources);
  // An office is compared and a tenure is not: an office has a title
  // somebody could file twice, and a tenure's identity is its person, its
  // office and its years, which NO_DUPLICATES is for.
  add('office', topology.offices);
  add('narrative', topology.narratives);
  return byKind;
}

// The near-matches for one record, most certain first. An edge and a
// relation are not compared: their identity is their two ends and their type,
// and rule 2 already refuses a second one under the same id.
export const NO_DUPLICATES = Object.freeze(['edge', 'relation', 'tenure']);

export function findDuplicates(subject, candidates, { limit = 5, threshold = 0.34 } = {}) {
  if (!subject || NO_DUPLICATES.includes(subject.kind)) return [];
  const found = [];
  for (const c of candidates ?? []) {
    // **The one duplicate that is certain.** A record whose id is already in
    // the atlas is not a near-match to be scored, it is that record: rule 2
    // reads the bundle as a replacement of it. This was the one hit the
    // search skipped — typing "Lisbon" as a new place listed Belém and Parque
    // das Nações and not Lisbon itself, and the report then said the bundle
    // validated (health review of 6 September, R20). It is reported first,
    // and `replaces` is what says the form must not call it a near-match.
    if (c.id === subject.id) {
      found.push({
        id: c.id, kind: c.kind, label: c.label, matched: c.label, why: 'the same id', score: 1, certain: true, replaces: true,
      });
      continue;
    }
    const same = subject.identifiers.find((i) => c.identifiers.some((j) => j.what === i.what && j.value === i.value));
    if (same) {
      found.push({ id: c.id, kind: c.kind, label: c.label, matched: same.value, why: `the same ${same.what}`, score: 1, certain: true });
      continue;
    }
    let score = 0;
    let matched = null;
    for (const mine of subject.terms) {
      for (const theirs of c.against) {
        const s = scoreOf(mine, theirs);
        if (s > score) {
          score = s;
          matched = theirs.name;
        }
      }
    }
    if (score >= threshold) {
      found.push({ id: c.id, kind: c.kind, label: c.label, matched, why: 'a similar name', score, certain: false });
    }
  }
  return found
    .sort((a, b) => Number(Boolean(b.replaces)) - Number(Boolean(a.replaces))
      || Number(b.certain) - Number(a.certain)
      || b.score - a.score
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
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
//
// `reuse` is the two things that depend on the atlas and not on what is
// being typed — the indexed universe and the compiled schema set. They used
// to be rebuilt on every keystroke, which was 166 ms per key at twenty
// thousand records (health review B, finding 27); `preparedFor` below builds
// them once and the callers hold on to the result.
export function validateBundle(bundle, topology, schemas, reuse = null) {
  const shape = checkBundleShape(bundle);
  if (shape.length) {
    return {
      errors: shape.map((p) => ({ level: 'error', rule: 1, id: null, kind: 'bundle', path: p.path, message: p.message })),
      warnings: [],
      ok: false,
    };
  }
  const { errors, warnings } = validate(bundle.records, topology, schemas, reuse ?? {});
  return { errors, warnings, ok: errors.length === 0 && everythingCited(bundle) };
}

// What validateBundle can be handed instead of building it again, and what
// the duplicate search reads. Built once per page, from the atlas the page
// loaded; all three are pure and none depends on the record under edit.
export function preparedFor(topology, schemas) {
  return {
    universe: buildUniverse(topology),
    validator: createValidator(schemas),
    comparables: comparableIndex(topology),
  };
}

// Rule 6 says the same thing, but the submit control hangs on it, so it is
// asserted here rather than inferred from an empty error list.
export function everythingCited(bundle) {
  return (bundle?.records ?? [])
    .filter((r) => ['event', 'edge', 'actor', 'relation', 'tenure'].includes(r.kind))
    .every((r) => Array.isArray(r.sources) && r.sources.length > 0);
}

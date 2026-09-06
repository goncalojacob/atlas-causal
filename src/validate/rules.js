// Cross-record invariants 2–15 from ARCHITECTURE.md, plus the three
// warnings. Pure: takes the records under validation and a topology object
// (the same shape build-index.mjs emits), so the browser form can run it
// against the loaded index. Rule 1 (schema) lives in core.js; rule 16
// (index freshness) in tools/validate.mjs, because it needs the disk.
//
// Records under validation may override topology entries with the same id
// (a correction), so the "universe" is topology ∪ records with records
// winning. Errors are only reported on records under validation; topology
// entries were validated when they were merged.

import { isValidYear, astronomicalBounds, defaultCalendar } from '../util/dates.js';
import { bodyCitations, bodyLinks } from '../markdown.js';
import {
  EDGE_ID, EDGE_TYPE_IDS, RELATION_ID, RELATION_TYPE_IDS,
  RELATION_ENDPOINTS, ACYCLIC_RELATION_TYPES,
} from '../vocab.js';
import { kindsWhere, licensesOf } from '../kinds.js';
import { NC_ORIGINS, REVIEW_STATUS, mayBeNonCommercial, originTool } from '../origin.js';

// An interval as two astronomical bounds for overlap tests: an open end
// (`end: null`, ongoing) reaches forward without limit.
function span(when) {
  if (!isObject(when)) return null;
  try {
    const start = astronomicalBounds(when.start);
    return { from: start.min, to: when.end === null || when.end === undefined ? Infinity : astronomicalBounds(when.end).max };
  } catch {
    return null;
  }
}

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const CONFIDENCE_ORDER = Object.freeze(['consensus', 'probable', 'disputed']);
export const ACTOR_TYPES = Object.freeze(['person', 'polity', 'institution', 'people']);
// The vocabularies and the two id patterns come from src/vocab.js, and the
// kinds' licences and fields from src/kinds.js. They were written out here
// and copied into `state.js`, `lanes.js`, `graph.js` and two panel cards
// until H2; the names below are kept because the rules and their tests are
// the oldest readers of them, but there is one definition now.
export const EDGE_TYPES = EDGE_TYPE_IDS;
export const RELATION_TYPES = RELATION_TYPE_IDS;
export { EDGE_ID, RELATION_ID, RELATION_ENDPOINTS, ACYCLIC_RELATION_TYPES };
// The identity a record may claim on Wikidata, and the kinds that may claim
// one: a Wikidata item is about a thing in the world, which an event, an
// actor and a place are, and an edge and a narrative are not — those are
// arguments about things, and nobody else's database has an item for them.
export const IDENTITY_KINDS = kindsWhere('identity');
// The kinds a full entry can be written about, which are the same three and
// for the same reason: a page is about a thing in the world. An edge and a
// narrative are already prose about records, and their prose is the record.
export const BODY_KINDS = kindsWhere('body');
export const WIKIDATA_ID = /^Q[1-9][0-9]*$/;
// A Wikipedia language edition as Wikipedia itself writes it: "en", "pt",
// "pt-br", "zh-hans". It is checked because it becomes a hostname.
export const WIKIPEDIA_LANG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;
// The source records that *are* Wikipedia. An edge may not call itself
// consensus resting on these alone (rule 22): an encyclopedia reports what
// the scholarship says, so an argument that cites nothing else has not shown
// the scholarship. Adding an edition adds a line here, exactly as adding an
// import adds one to NC_ORIGINS in src/origin.js; nothing else can quietly
// become an authority.
export const WIKIPEDIA_SOURCES = Object.freeze(['wikipedia-en', 'wikipedia-pt']);
// The names the three automated writers signed with before `origin` existed.
// Nothing decides a licence, a review status or an import's ownership by
// reading them any more — src/origin.js does all three. They survive here for
// rule 29 alone, which asks a creator whether it wrote `origin`, and the day
// the last of them leaves `authors` this list leaves with them.
export const WRITER_NAMES = Object.freeze([
  'CShapes 2.0 import (tools/import/cshapes.mjs)',
  'Wikidata import (tools/import/wikidata.mjs)',
  'Claude (assistant draft, unreviewed)',
]);
export const PRESENCE_TYPES = Object.freeze(['state', 'polity', 'sphere-of-influence', 'archaeological-culture']);
export const DEPENDENCY_KINDS = Object.freeze(['colony', 'protectorate', 'mandate', 'occupied']);
// Which licences each kind may carry, from the registry — an actor and a
// presence may be NC-SA because an import wrote them, and everything a person
// writes is CC BY-SA like the rest of data/.
export const ALLOWED_LICENSES = licensesOf();

// The kinds a narrative step's ref may name (vocab.js). Two shapes and five
// kinds: a three-part id is an edge or a relation, and the two vocabularies
// are kept apart here for the same reason vocab.js builds the two patterns
// separately — anything that turns a ref into a path has to know which kind it
// is holding. A bare slug is an event, an actor or a presence, and the shape
// cannot say which: only the atlas can, so this returns all three and the
// caller looks each up in order. An event first, because that is what almost
// every step is.
//
// Since H7 a walk may name an actor, a relation or a presence, so that a step
// can say "and this is the body that did it" without inventing an event for
// it (health review B, finding 18). A source and a place are still not kinds a
// walk names: a narrative cites its books in `sources` like every other
// record, and a place is where an event was, not a step of an argument.
export function refKinds(ref) {
  if (typeof ref !== 'string') return [];
  if (EDGE_ID.test(ref)) return ['edge'];
  if (RELATION_ID.test(ref)) return ['relation'];
  return SLUG.test(ref) ? ['event', 'actor', 'presence'] : [];
}

// The record a step names, and which kind it turned out to be; null when the
// ref names nothing in the universe. `lookup` is the rules' own resolver.
export function walkedRef(ref, lookup) {
  for (const kind of refKinds(ref)) {
    const entry = lookup(ref, kind);
    if (entry) return { kind, entry };
  }
  return null;
}

// A narrative is a walk, not a label: two steps is the fewest that can say
// "this, and then that".
export const MIN_NARRATIVE_STEPS = 2;

// Former id → the id that stands for it now, over a universe of
// Map<id, { kind, entry }>. Built once and passed to resolveId, because
// resolving is asked once per reference and rebuilding this per call would be
// quadratic in the atlas. Rule 2 keeps aliases unique across every id and
// every other alias, so the first owner wins and there is never a second.
export function aliasIndex(universe) {
  const index = new Map();
  for (const [id, u] of universe) {
    for (const alias of u?.entry?.aliases ?? []) if (!index.has(alias)) index.set(alias, id);
  }
  return index;
}

// A merged record may stand for another that stands for a third; twenty hops
// is far past anything real and stops a cycle the rules have not caught yet.
const MAX_RESOLVE_HOPS = 20;

// The one answer to "which record does this id name now", written once so that
// a plain reference, a narrative step and a `review.citations` key cannot
// disagree about it (health review A, finding 20: renaming a record broke
// every narrative that walked it and every verification flag keyed by the old
// id, and the validator reported it as a dangling reference instead of
// resolving it). It is `resolve()` in src/data.js, over the validator's
// universe rather than the loaded atlas: the alias hop first, then merges.
//
// `merges: false` stops at the alias. The rules that ask what a reference
// *names* — the arrow of time, the DAG, the retraction cascade — mean the
// record written there and not the one it was later merged into; following
// the merge would move the arrow of time onto another event's dates without
// anyone saying so.
export function resolveId(id, universe, { aliases = aliasIndex(universe), merges = true } = {}) {
  if (typeof id !== 'string') return null;
  const via = [];
  let current = aliases.get(id) ?? id;
  if (current !== id) via.push({ id, reason: 'alias' });
  for (let hops = 0; hops < MAX_RESOLVE_HOPS; hops += 1) {
    const found = universe.get(current);
    if (!found) return null;
    const entry = found.entry ?? {};
    if (merges && entry.status === 'merged' && typeof entry.supersededBy === 'string' && entry.supersededBy !== current) {
      via.push({ id: current, reason: 'merged' });
      current = entry.supersededBy;
      continue;
    }
    return { id: current, kind: found.kind, entry: found.entry, own: found.own === true, via };
  }
  return null;
}

// Roles are free text until there is a reason for a closed vocabulary, so
// "Leader", "leader " and "leader" are one role: this is the form they are
// compared and counted in. The record keeps what the contributor wrote.
export function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}
// "Non-trivial" text for explanation and dispute: an argument, not a label.
export const MIN_TEXT_LENGTH = 40;
export const HTTP_URL = /^https?:\/\/\S+$/;

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function nonTrivial(text) {
  return typeof text === 'string' && text.trim().length >= MIN_TEXT_LENGTH;
}

// "Peter Russell", "RUSSELL, Peter" and "Peter  Russell" are one author.
function nameKey(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .sort()
    .join(' ');
}

function citations(record) {
  const list = [];
  for (const c of record.sources ?? []) list.push(c.source);
  if (isObject(record.dispute)) for (const c of record.dispute.sources ?? []) list.push(c.source);
  return list;
}

// The distinct sources a record rests on, supporting and dissenting alike:
// what a reviewer has to open and check, and therefore what the per-citation
// verification flags are keyed by. A book cited twice in one record is one
// book to go and read.
export function citedSources(record) {
  return [...new Set(citations(record ?? {}).filter((id) => typeof id === 'string'))];
}

// ─── The universe, indexed ──────────────────────────────────────────────────
//
// Everything the rules ask of the atlas *around* the records under
// validation, read as lookups rather than scanned. Two findings meet here.
// Rule 11's inactive-record checks were a scan of every active edge per
// tombstone and of the whole universe per retracted actor or place, and 40 %
// of this dataset is already tombstones, which made them quadratic in the
// thing that grows fastest (health review B, finding 4). And the browser's
// form rebuilt all of this on every keystroke (finding 27; review A, finding
// 11), which is why the indexes can be built once for a topology and handed
// back in:
//
//     const universe = buildUniverse(topology);
//     validate(bundle.records, topology, schemas, { universe });
//
// Nothing here decides anything: every index is a different way of reaching
// the same entries, and the rules below are the only readers.

const EMPTY = Object.freeze([]);

function pushInto(map, key, value) {
  if (typeof key !== 'string') return;
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

// The indexes over one ordered list of rows ({ kind, entry, own }). Built
// twice per call — once for the topology, once for the records under
// validation — and the readers merge the two, so a record that shadows a
// topology entry is looked at in its own place rather than in the entry's.
//
// A row is pushed at most once per key it can be reached by, because that is
// what the rules used to report: an event naming one actor under two roles
// is one referrer, not two.
function indexEntries(rows) {
  const activeEdges = [];
  const edgesByEndpoint = new Map();
  const actorReferrers = new Map();
  const placeReferrers = new Map();
  const presencesByOutline = new Map();
  const relationsByType = new Map();
  const claimants = new Map();
  const creatorKeys = new Map();
  const aliases = new Map();
  const aliasOwners = new Map();
  for (const row of rows) {
    const { kind, entry } = row;
    for (const alias of entry.aliases ?? []) {
      if (!aliases.has(alias)) aliases.set(alias, entry.id);
      pushInto(aliasOwners, alias, entry.id);
    }
    // Rule 21 asks about every record that claims an item, tombstones
    // included: a retracted duplicate still holds the item it was created
    // for. Rule 9 asks about a source whatever its status, because rule 11
    // is what reports citing a retracted one.
    if (typeof entry.wikidata === 'string') pushInto(claimants, `${kind} ${entry.wikidata}`, entry.id);
    if (kind === 'source') creatorKeys.set(entry.id, new Set((entry.creators ?? []).map(nameKey).filter(Boolean)));
    if (entry.status !== 'active') continue;
    if (kind === 'edge') {
      activeEdges.push(entry);
      pushInto(edgesByEndpoint, entry.from, entry);
      if (entry.to !== entry.from) pushInto(edgesByEndpoint, entry.to, entry);
    } else if (kind === 'event') {
      const seen = new Set();
      for (const a of entry.actors ?? []) {
        if (typeof a?.actor !== 'string' || seen.has(a.actor)) continue;
        seen.add(a.actor);
        pushInto(actorReferrers, a.actor, row);
      }
      pushInto(placeReferrers, entry.place, row);
    } else if (kind === 'presence') {
      pushInto(actorReferrers, entry.actor, row);
      if (entry.dependencyOf !== entry.actor) pushInto(actorReferrers, entry.dependencyOf, row);
      // Rule 17 asks whether one actor holds the same outline twice over
      // overlapping years, so the pair it compares is (actor, outline) and
      // nothing else has to be looked at.
      pushInto(presencesByOutline, `${entry.actor}\u001f${String(entry.geometry?.key)}`, entry);
    } else if (kind === 'relation') {
      pushInto(actorReferrers, entry.from, row);
      if (entry.to !== entry.from) pushInto(actorReferrers, entry.to, row);
      pushInto(relationsByType, entry.type, entry);
    }
  }
  return { activeEdges, edgesByEndpoint, actorReferrers, placeReferrers, presencesByOutline, relationsByType, claimants, creatorKeys, aliases, aliasOwners };
}

// The topology's entries as one ordered list, id → row, with `add` left open
// so the records under validation can be laid over it in place.
function collectRows(topology) {
  const entries = new Map();
  const rows = [];
  const add = (kind, entry, own = false) => {
    const seen = entries.get(entry.id);
    // A later entry under an id already taken replaces it where it stands,
    // which is what setting it on a Map used to do: the row keeps its
    // position and the order the errors come out in does not move.
    if (seen) {
      seen.kind = kind;
      seen.entry = entry;
      seen.own = own;
      return;
    }
    const row = { kind, entry, own };
    entries.set(entry.id, row);
    rows.push(row);
  };
  for (const e of topology.events ?? []) add('event', e);
  for (const e of topology.edges ?? []) add('edge', e);
  for (const s of topology.sources ?? []) add('source', s);
  for (const a of topology.actors ?? []) add('actor', a);
  for (const p of topology.presences ?? []) add('presence', p);
  for (const p of topology.places ?? []) add('place', p);
  for (const r of topology.relations ?? []) add('relation', r);
  for (const n of topology.narratives ?? []) add('narrative', n);
  return { entries, rows, add };
}

// The topology as the rules read it: the rows, the indexes and the lane ids.
// Pure and reusable — hand the same object back to checkRules for as long as
// the topology it came from has not changed.
export function buildUniverse(topology = {}) {
  const { entries, rows } = collectRows(topology);
  return {
    topology,
    entries,
    regionIds: new Set((topology.regions ?? []).map((r) => r.id)),
    ...indexEntries(rows),
  };
}

// The empty half, for the caller that has no prebuilt universe: the topology
// and the records are then indexed together as one list, which is one pass
// rather than two and is what the CLI does, where every topology entry is
// under validation anyway.
const NO_UNIVERSE = Object.freeze({
  entries: new Map(),
  aliases: new Map(),
  aliasOwners: new Map(),
  activeEdges: null,
  edgesByEndpoint: new Map(),
  actorReferrers: new Map(),
  placeReferrers: new Map(),
  presencesByOutline: new Map(),
  relationsByType: new Map(),
  claimants: new Map(),
  creatorKeys: new Map(),
});

export function checkRules(records, topology = {}, { universe: prebuilt = null } = {}) {
  const errors = [];
  const warnings = [];
  const error = (rule, record, path, message) => {
    errors.push({ level: 'error', rule, id: record?.id ?? null, kind: record?.kind ?? null, path, message });
  };
  const warning = (code, record, message) => {
    warnings.push({ level: 'warning', rule: code, id: record?.id ?? null, kind: record?.kind ?? null, path: '', message });
  };

  // --- the universe -------------------------------------------------------
  // A prebuilt universe is the topology's half already indexed, which is what
  // a page validating against one atlas over and over hands back in. Without
  // one there is nothing to reuse, so the topology and the records are laid
  // out as a single list and indexed together — one pass, in the topology's
  // own order.
  const base = prebuilt && prebuilt.topology === topology ? prebuilt : NO_UNIVERSE;
  const scratch = base === NO_UNIVERSE ? collectRows(topology) : null;
  const ownEntries = scratch ? scratch.entries : new Map();
  const ownRows = scratch ? scratch.rows : [];

  const ownIds = new Set();
  for (const r of records) {
    if (ownIds.has(r.id)) {
      error(2, r, '/id', `duplicate id "${r.id}" among the records under validation`);
      continue;
    }
    ownIds.add(r.id);
    if (scratch) scratch.add(r.kind, r, true);
    else {
      const row = { kind: r.kind, entry: r, own: true };
      ownEntries.set(r.id, row);
      ownRows.push(row);
    }
  }
  const ours = indexEntries(ownRows);
  const universe = {
    get: (id) => ownEntries.get(id) ?? base.entries.get(id),
    has: (id) => ownEntries.has(id) || base.entries.has(id),
  };
  const own = records.filter((r) => ownEntries.get(r.id)?.entry === r);
  const regionIds = base.regionIds ?? new Set((topology.regions ?? []).map((r) => r.id));

  // A topology row whose id is under validation is not the atlas any more:
  // the record under validation is. So every merged list drops those rows
  // and appends the records' own, which is the one order this rewrite
  // changed — a referrer that is itself under validation is now looked at
  // after the topology's rather than in its place. It changes which of two
  // messages about one record comes first and never which are reported.
  const shadowing = ownIds.size > 0;
  const merge = (theirs, mine, idOf) => {
    if (!theirs) return mine ?? EMPTY;
    const kept = shadowing ? theirs.filter((x) => !ownIds.has(idOf(x))) : theirs;
    return mine ? kept.concat(mine) : kept;
  };
  const entryId = (x) => x.id;
  const rowId = (x) => x.entry.id;
  const edgesTouching = (id) => merge(base.edgesByEndpoint.get(id), ours.edgesByEndpoint.get(id), entryId);
  const actorReferrers = (id) => merge(base.actorReferrers.get(id), ours.actorReferrers.get(id), rowId);
  const placeReferrers = (id) => merge(base.placeReferrers.get(id), ours.placeReferrers.get(id), rowId);
  const aliasOwnersOf = (alias) => merge(base.aliasOwners.get(alias), ours.aliasOwners.get(alias), (id) => id);
  const activeEdges = merge(base.activeEdges, ours.activeEdges, entryId);

  // Every reference in the atlas resolves through the same helper, so a
  // record renamed yesterday is still found by the id written against it
  // last year. Merges are not followed here: see resolveId. A record under
  // validation owns its aliases outright; rule 2 is what stops two records
  // claiming one, so the preference only ever decides an invalid case.
  const aliases = {
    get(alias) {
      const mine = ours.aliases.get(alias);
      if (mine !== undefined) return mine;
      const theirs = base.aliases.get(alias);
      return theirs !== undefined && !ownIds.has(theirs) ? theirs : undefined;
    },
  };
  const lookup = (id, kind) => {
    const u = resolveId(id, universe, { aliases, merges: false });
    return u && u.kind === kind ? u.entry : null;
  };
  // What a reader's `resolve()` would open — the alias hop and then the
  // merges — as a bare id, for comparing two references to the same thing.
  const standsFor = (id) => resolveId(id, universe, { aliases })?.id ?? id;
  // A book's authors, folded, once per source rather than once per edge that
  // cites it: rule 9 compares the sets of every consensus edge, and one book
  // carries a thousand of those citations in this dataset.
  const creatorKeysOf = (source) => ours.creatorKeys.get(source.id)
    ?? base.creatorKeys.get(source.id)
    ?? new Set((source.creators ?? []).map(nameKey).filter(Boolean));

  // --- rule 2: ids and aliases --------------------------------------------
  for (const r of own) {
    if (r.kind === 'edge' || r.kind === 'relation') {
      const m = (r.kind === 'edge' ? EDGE_ID : RELATION_ID).exec(r.id);
      if (!m) error(2, r, '/id', `${r.kind} id must have the shape from--to--type`);
      else if (m[1] !== r.from || m[2] !== r.to || m[3] !== r.type) {
        error(2, r, '/id', `${r.kind} id must be derived from its fields: expected "${r.from}--${r.to}--${r.type}"`);
      }
    } else if (!SLUG.test(r.id)) {
      error(2, r, '/id', 'id must be a slug: lowercase letters, digits and single hyphens');
    }
    const others = aliasOwnersOf(r.id).filter((id) => id !== r.id);
    if (others.length) {
      error(2, r, '/id', `id "${r.id}" is already an alias of ${others.join(', ')}`);
    }
    (r.aliases ?? []).forEach((alias, i) => {
      if (alias === r.id) error(2, r, `/aliases/${i}`, 'an alias cannot equal the record\'s own id');
      if (universe.has(alias)) error(2, r, `/aliases/${i}`, `alias "${alias}" is the id of another record`);
      const owners = aliasOwnersOf(alias).filter((id) => id !== r.id);
      if (owners.length) error(2, r, `/aliases/${i}`, `alias "${alias}" is also an alias of ${owners.join(', ')}`);
      if ((r.aliases ?? []).indexOf(alias) !== i) error(2, r, `/aliases/${i}`, `alias "${alias}" repeated`);
    });
  }

  // --- rule 3: references resolve -----------------------------------------
  for (const r of own) {
    if (r.kind === 'edge') {
      if (!lookup(r.from, 'event')) error(3, r, '/from', `"${r.from}" is not an event`);
      if (!lookup(r.to, 'event')) error(3, r, '/to', `"${r.to}" is not an event`);
    }
    (r.sources ?? []).forEach((c, i) => {
      if (!lookup(c.source, 'source')) error(3, r, `/sources/${i}/source`, `"${c.source}" is not a source record`);
    });
    if (isObject(r.dispute)) {
      (r.dispute.sources ?? []).forEach((c, i) => {
        if (!lookup(c.source, 'source')) error(3, r, `/dispute/sources/${i}/source`, `"${c.source}" is not a source record`);
      });
    }
    // A per-citation verification flag is keyed by the source it is about, so
    // a key naming something this record does not cite says nothing about
    // this record — usually a citation that was edited away and left its
    // flag behind, which would then count as checked for ever.
    if (isObject(r.review?.citations)) {
      // Both sides through the same resolution: a flag keyed by a source's
      // former id is about the source the record cites today, and the day
      // somebody renames a book is not the day a hundred checked citations
      // become errors.
      const cited = new Set(citedSources(r).map(standsFor));
      for (const key of Object.keys(r.review.citations)) {
        if (!cited.has(standsFor(key))) error(3, r, `/review/citations/${key}`, `"${key}" is not a source this record cites`);
      }
    }
    if (r.supersededBy !== null && r.supersededBy !== undefined) {
      if (r.supersededBy === r.id) error(3, r, '/supersededBy', 'a record cannot supersede itself');
      else if (!lookup(r.supersededBy, r.kind)) error(3, r, '/supersededBy', `"${r.supersededBy}" is not a ${r.kind}`);
    }
    if ((r.kind === 'event' || r.kind === 'place') && typeof r.region === 'string' && !regionIds.has(r.region)) {
      error(3, r, '/region', `"${r.region}" is not in regions.json`);
    }
    if (r.kind === 'event' && typeof r.place === 'string' && !lookup(r.place, 'place')) {
      error(3, r, '/place', `"${r.place}" is not a place record`);
    }
    if (r.kind === 'relation') {
      if (!lookup(r.from, 'actor')) error(3, r, '/from', `"${r.from}" is not an actor record`);
      if (!lookup(r.to, 'actor')) error(3, r, '/to', `"${r.to}" is not an actor record`);
    }
    if (r.kind === 'narrative') {
      (Array.isArray(r.steps) ? r.steps : []).forEach((step, i) => {
        if (!walkedRef(step?.ref, lookup)) {
          error(3, r, `/steps/${i}/ref`, `"${step?.ref}" is not an event, a link, an actor, a relation or a presence`);
        }
      });
    }
    if (r.kind === 'presence') {
      if (!lookup(r.actor, 'actor')) error(3, r, '/actor', `"${r.actor}" is not an actor record`);
      if (r.dependencyOf !== null && r.dependencyOf !== undefined && !lookup(r.dependencyOf, 'actor')) {
        error(3, r, '/dependencyOf', `"${r.dependencyOf}" is not an actor record`);
      }
    }
  }

  // --- rule 15: years (checked before 4 and 5, which assume sane bounds) --
  const saneWhen = new Set();
  const checkBound = (r, path, bound) => {
    const b = Number.isInteger(bound) ? { min: bound, max: bound } : bound;
    if (!isObject(b) || !isValidYear(b.min) || !isValidYear(b.max)) {
      error(15, r, path, 'years must be non-zero integers (no year 0)');
      return null;
    }
    const a = astronomicalBounds(b);
    if (a.min > a.max) {
      error(15, r, path, 'min must not be after max');
      return null;
    }
    return a;
  };
  for (const r of own) {
    // An actor's interval is birth–death or founding–dissolution and a
    // presence's is how long the outline held; the same arithmetic, the same
    // no-year-zero rule.
    if ((r.kind === 'event' || r.kind === 'actor' || r.kind === 'presence' || r.kind === 'relation') && isObject(r.when)) {
      const start = checkBound(r, '/when/start', r.when.start);
      const end = r.when.end === null ? null : checkBound(r, '/when/end', r.when.end);
      if (start && end && (end.min < start.min || end.max < start.max)) {
        error(15, r, '/when/end', 'end must not be before start');
      } else if (start && (end || r.when.end === null)) {
        saneWhen.add(r.id);
      }
    }
    if (r.kind === 'source' && r.year !== null && r.year !== undefined && !isValidYear(r.year)) {
      error(15, r, '/year', 'year must be a non-zero integer');
    }
  }
  const readWhen = (id) => {
    const e = lookup(id, 'event');
    if (!e || !isObject(e.when)) return null;
    // Through the alias, like the lookup above: a reference by a former id
    // asks about the record that owns the alias, and its own years.
    if (universe.get(e.id)?.own && !saneWhen.has(e.id)) return null;
    try {
      return {
        start: astronomicalBounds(e.when.start),
        end: e.when.end === null ? null : astronomicalBounds(e.when.end),
        date: typeof e.when.date === 'string' ? e.when.date : null,
        calendar: e.when.calendar ?? null,
      };
    } catch {
      return null;
    }
  };
  // Memoised on the id as written: an event at one end of ten edges is
  // resolved and its bounds converted once, not ten times.
  const whenCache = new Map();
  const whenOf = (id) => {
    if (whenCache.has(id)) return whenCache.get(id);
    const answer = readWhen(id);
    whenCache.set(id, answer);
    return answer;
  };

  // --- rule 4: arrow of time ----------------------------------------------
  for (const r of own) {
    if (r.kind !== 'edge') continue;
    const from = whenOf(r.from);
    const to = whenOf(r.to);
    if (!from || !to) continue;
    if (from.start.min > to.start.max) {
      error(4, r, '', `arrow of time: "${r.from}" cannot start after "${r.to}"`);
      continue;
    }
    if (from.start.max > to.start.min) {
      warning('strict-arrow', r, `"${r.from}" may start after "${r.to}": the intervals overlap (lenient bound passes)`);
    }
    // Same exact year at both ends: the day decides, when both records give
    // one in the same calendar.
    const sameYear = from.start.min === from.start.max && to.start.min === to.start.max && from.start.min === to.start.min;
    if (sameYear && from.date && to.date) {
      const fromEvent = lookup(r.from, 'event');
      const toEvent = lookup(r.to, 'event');
      const calFrom = from.calendar ?? defaultCalendar(Number.isInteger(fromEvent.when.start) ? fromEvent.when.start : fromEvent.when.start.min);
      const calTo = to.calendar ?? defaultCalendar(Number.isInteger(toEvent.when.start) ? toEvent.when.start : toEvent.when.start.min);
      if (calFrom === calTo && from.date > to.date) {
        error(4, r, '', `arrow of time: "${r.from}" (${from.date}) is dated after "${r.to}" (${to.date}) in the same year`);
      }
    }
  }

  // --- rule 5: the active graph is a DAG ----------------------------------
  //
  // Two ways to ask it, and which one is right depends on who is asking.
  //
  // The CLI validates the whole atlas: every edge is under validation, there
  // is nothing established to lean on, and the sweep below is the answer.
  //
  // A page validating one record against an atlas it has already loaded is a
  // different question. That atlas passed rule 5 on the commit that wrote it
  // — the validator gates every one — so it is a DAG, and a bundle can only
  // close a cycle through an edge the bundle itself adds. Retracting an edge
  // removes one and can close nothing. So each new active edge is asked one
  // question, from its own end: is `from` already reachable from `to`? At
  // twenty thousand events the sweep walked every active edge on every
  // keystroke (health review B, finding 27); this walks what the new edge
  // can actually reach, which in a graph of arguments is a handful of nodes.
  //
  // What it gives up is telling a page about a cycle that was already in the
  // atlas before the contributor typed anything. That is not the page's
  // question, and the commit that would have introduced one never passed.
  if (base !== NO_UNIVERSE) {
    const reaches = (start, goal) => {
      const seen = new Set([start]);
      const stack = [start];
      const path = new Map([[start, null]]);
      while (stack.length) {
        const node = stack.pop();
        for (const e of edgesTouching(node)) {
          if (e.from !== node) continue;
          const next = e.to;
          if (seen.has(next)) continue;
          seen.add(next);
          path.set(next, node);
          if (next === goal) {
            const walked = [];
            for (let at = goal; at !== null && at !== undefined; at = path.get(at)) walked.push(at);
            return walked;
          }
          stack.push(next);
        }
      }
      return null;
    };
    for (const e of ours.activeEdges ?? EMPTY) {
      if (!lookup(e.from, 'event') || !lookup(e.to, 'event')) continue;
      const through = e.from === e.to ? [e.from] : reaches(e.to, e.from);
      if (through) {
        error(5, e, '', `the edge graph has a cycle through: ${[...new Set(through)].sort().join(', ')}`);
      }
    }
  } else {
    const nodes = new Set();
    const out = new Map();
    const indegree = new Map();
    for (const e of activeEdges) {
      const a = lookup(e.from, 'event');
      const b = lookup(e.to, 'event');
      if (!a || !b) continue;
      nodes.add(e.from);
      nodes.add(e.to);
      if (!out.has(e.from)) out.set(e.from, []);
      out.get(e.from).push(e.to);
      indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
    }
    const queue = [...nodes].filter((n) => !indegree.get(n));
    const seen = new Set();
    while (queue.length) {
      const n = queue.pop();
      seen.add(n);
      for (const m of out.get(n) ?? []) {
        indegree.set(m, indegree.get(m) - 1);
        if (indegree.get(m) === 0) queue.push(m);
      }
    }
    const stuck = [...nodes].filter((n) => !seen.has(n)).sort();
    if (stuck.length) {
      const culprit = activeEdges.find((e) => universe.get(e.id)?.own && stuck.includes(e.from) && stuck.includes(e.to)) ?? null;
      error(5, culprit, '', `the edge graph has a cycle through: ${stuck.join(', ')}`);
    }
  }

  // --- rules 6, 7, 8, 9, 14: per-record content ---------------------------
  for (const r of own) {
    if (['event', 'edge', 'actor', 'presence', 'relation', 'narrative'].includes(r.kind)) {
      if (!Array.isArray(r.sources) || r.sources.length === 0) {
        error(6, r, '/sources', `every ${r.kind} cites at least one source`);
      }
    }
    if (r.kind === 'edge') {
      if (!nonTrivial(r.explanation)) {
        error(7, r, '/explanation', `explanation must be a real argument (at least ${MIN_TEXT_LENGTH} characters)`);
      }
      const hasDispute = isObject(r.dispute);
      if (r.confidence === 'disputed') {
        if (!hasDispute) error(8, r, '/dispute', 'a disputed edge must carry dispute { text, sources }');
        else {
          if (!nonTrivial(r.dispute.text)) error(8, r, '/dispute/text', `dispute.text must say who disagrees and why (at least ${MIN_TEXT_LENGTH} characters)`);
          if (!Array.isArray(r.dispute.sources) || r.dispute.sources.length === 0) {
            error(8, r, '/dispute/sources', 'a dispute cites the dissenting sources');
          }
        }
      } else if (hasDispute) {
        error(8, r, '/dispute', `an edge with a dispute block must be marked disputed, not ${r.confidence}`);
      }
      if (r.confidence === 'consensus') {
        const cited = (r.sources ?? []).map((c) => lookup(c.source, 'source')).filter(Boolean);
        const keys = cited.map(creatorKeysOf);
        let independent = false;
        for (let i = 0; i < keys.length && !independent; i += 1) {
          for (let j = i + 1; j < keys.length; j += 1) {
            if (keys[i].size && keys[j].size && [...keys[i]].every((k) => !keys[j].has(k))) {
              independent = true;
              break;
            }
          }
        }
        if (!independent) {
          error(9, r, '/sources', 'consensus requires at least two cited sources by different authors');
        }
      }
    }
    // Rule 14: an event's actors resolve, each with a role saying what it
    // did in this event. The same actor may appear twice in one event only
    // under different roles — "deposed" and "signatory" are two facts;
    // "leader" twice is a duplicate.
    if (r.kind === 'event') {
      const listed = new Set();
      (Array.isArray(r.actors) ? r.actors : []).forEach((a, i) => {
        if (!lookup(a.actor, 'actor')) error(14, r, `/actors/${i}/actor`, `"${a.actor}" is not an actor record`);
        const role = normalizeRole(a.role);
        if (role === '') error(14, r, `/actors/${i}/role`, 'a role says what the actor did in this event');
        // U+001F, the unit separator, and written as an escape: a literal
        // NUL byte here made the whole file binary to grep, which reads it
        // as nothing at all. Any character that cannot occur in an id or a
        // role would do; this is the one that means "these are two fields".
        const key = `${a.actor}\u001f${role}`;
        if (listed.has(key)) error(14, r, `/actors/${i}`, `"${a.actor}" is already listed in this event as "${role}"`);
        listed.add(key);
      });
    }
    if (r.kind === 'actor') {
      // minItems is outside the schema subset, so the non-empty name list
      // is checked here (STATUS.md, deviation 22).
      const names = Array.isArray(r.names) ? r.names.filter((n) => typeof n === 'string' && n.trim() !== '') : [];
      if (names.length === 0) error(14, r, '/names', 'an actor has at least one name; the first is the display name');
      names.forEach((name, i) => {
        if (names.indexOf(name) !== i) error(14, r, `/names/${i}`, `name "${name}" repeated`);
      });
    }
  }

  // --- rule 10: place and region ------------------------------------------
  for (const r of own) {
    // A note about a lane, with no lane on the record, is a sentence about
    // the derivation — and the derivation is the index's and not the
    // record's. `regionNote` says why *this* record overrides it, so it
    // stands or falls with the override (health review A, finding 23a).
    if (typeof r.regionNote === 'string' && typeof r.region !== 'string') {
      error(10, r, '/regionNote', 'a note about the lane belongs beside a lane this record sets; the derived one needs no note');
    }
    // An event has no coordinates of its own any more: it names a place and
    // the place holds the point. What is left to check on an event is that a
    // placeless one says which lane it belongs to — an actor needs no lane,
    // being reached through its events and never put on the timeline alone.
    if (r.kind === 'event') {
      if (typeof r.place !== 'string' && typeof r.region !== 'string') {
        error(10, r, '/region', 'region is required when the event has no place');
      }
      continue;
    }
    if (!['actor', 'presence', 'place'].includes(r.kind)) continue;
    // A presence's point is its capital; it has no `where` of its own,
    // because the outline says where it was.
    const field = r.kind === 'presence' ? 'capital' : 'where';
    const where = isObject(r[field]) ? r[field] : null;
    if (where) {
      if (typeof where.lon !== 'number' || where.lon < -180 || where.lon > 180) error(10, r, `/${field}/lon`, 'longitude must be within [-180, 180]');
      if (typeof where.lat !== 'number' || where.lat < -90 || where.lat > 90) error(10, r, `/${field}/lat`, 'latitude must be within [-90, 90]');
    }
  }

  // --- rule 11: status ----------------------------------------------------
  for (const r of own) {
    if (r.status === 'merged' && (r.supersededBy === null || r.supersededBy === undefined)) {
      error(11, r, '/supersededBy', 'a merged record names the record that supersedes it');
    }
    if (r.status === 'active' && r.supersededBy !== null && r.supersededBy !== undefined) {
      error(11, r, '/supersededBy', 'an active record is not superseded');
    }
    // The three lookups that used to be scans. Every one of them asked "what
    // still points at this tombstone", once per tombstone, over the whole
    // atlas — which is quadratic in the share of the dataset that is
    // retracted, and that share is 40 % (health review B, finding 4).
    if (r.kind === 'event' && r.status !== 'active') {
      for (const e of edgesTouching(r.id)) {
        error(11, r, '', `${r.status} event still has an active edge: ${e.id}`);
      }
    }
    if (r.kind === 'actor' && r.status !== 'active') {
      for (const u of actorReferrers(r.id)) {
        error(11, r, '', `${r.status} actor is still referenced by the active ${u.kind} "${u.entry.id}"`);
      }
    }
    if (r.kind === 'place' && r.status !== 'active') {
      for (const u of placeReferrers(r.id)) {
        error(11, r, '', `${r.status} place is still referenced by the active event "${u.entry.id}"`);
      }
    }
    if (r.kind === 'event' && r.status === 'active' && typeof r.place === 'string') {
      const place = lookup(r.place, 'place');
      if (place && place.status !== 'active') error(11, r, '/place', `an active event cannot reference the ${place.status} place "${place.id}"`);
    }
    if (r.kind === 'relation' && r.status === 'active') {
      for (const end of ['from', 'to']) {
        const actor = lookup(r[end], 'actor');
        if (actor && actor.status !== 'active') error(11, r, `/${end}`, `an active relation cannot reference the ${actor.status} actor "${actor.id}"`);
      }
    }
    if (r.kind === 'presence' && r.status === 'active') {
      for (const field of ['actor', 'dependencyOf']) {
        const actor = lookup(r[field], 'actor');
        if (actor && actor.status !== 'active') error(11, r, `/${field}`, `an active presence cannot reference the ${actor.status} actor "${actor.id}"`);
      }
    }
    if (r.kind === 'event' && r.status === 'active') {
      (r.actors ?? []).forEach((a, i) => {
        const actor = lookup(a?.actor, 'actor');
        if (actor && actor.status !== 'active') error(11, r, `/actors/${i}/actor`, `an active event cannot reference the ${actor.status} actor "${actor.id}"`);
      });
    }
    if (r.kind === 'edge' && r.status === 'active') {
      for (const end of ['from', 'to']) {
        const ev = lookup(r[end], 'event');
        if (ev && ev.status !== 'active') error(11, r, `/${end}`, `an active edge cannot reference the ${ev.status} event "${ev.id}"`);
      }
    }
    // A narrative that walks a retracted record would be a reader sent to a
    // tombstone in the middle of an argument. Retract the narrative too, or
    // rewrite the step.
    if (r.kind === 'narrative' && r.status === 'active') {
      (Array.isArray(r.steps) ? r.steps : []).forEach((step, i) => {
        const found = walkedRef(step?.ref, lookup);
        if (found && found.entry.status !== 'active') {
          error(11, r, `/steps/${i}/ref`, `an active narrative cannot walk the ${found.entry.status} ${found.kind} "${found.entry.id}"`);
        }
      });
    }
    if (r.status === 'active') {
      citations(r).forEach((id) => {
        const s = lookup(id, 'source');
        if (s && s.status !== 'active') error(11, r, '', `an active record cannot cite the ${s.status} source "${id}"`);
      });
    }
  }

  // --- rule 12: licence per directory, authors ----------------------------
  for (const r of own) {
    const allowed = ALLOWED_LICENSES[r.kind] ?? [];
    if (!allowed.includes(r.license)) {
      error(12, r, '/license', `records under data/${r.kind}s/ must be licensed ${allowed.join(' or ')}`);
    }
    // data/actors/ is a CC BY-SA directory with one hole in it, and the hole
    // is exactly the actors an import creates for geometry it does not own.
    if (r.kind === 'actor' && r.license === 'CC-BY-NC-SA-4.0' && !mayBeNonCommercial(r)) {
      error(12, r, '/license', `an actor may be ${r.license} only when an import wrote it: origin.tool must be ${NC_ORIGINS.join(' or ')}`);
    }
    if (!Array.isArray(r.authors) || r.authors.length === 0) {
      error(12, r, '/authors', 'authors must name at least one contributor');
    }
  }

  // --- rule 13: source identifiers ----------------------------------------
  for (const r of own) {
    if (r.kind !== 'source') continue;
    const has = (k) => typeof r[k] === 'string' && r[k].length > 0;
    if (!Array.isArray(r.creators) || r.creators.length === 0) {
      error(13, r, '/creators', 'a source names the authors of the work');
    }
    if (has('url') && !HTTP_URL.test(r.url)) error(13, r, '/url', 'url must be http(s)');
    switch (r.type) {
      case 'primary':
        if (!has('repository') || !has('reference')) {
          error(13, r, '', 'a primary source needs repository and reference');
        }
        break;
      case 'web':
        if (!has('url')) error(13, r, '/url', 'a web source needs a url, preferably an archive URL');
        if (!has('accessed')) error(13, r, '/accessed', 'a web source records the date it was accessed');
        break;
      default:
        if (!has('isbn') && !has('doi') && !has('url')) {
          error(13, r, '', `a ${r.type} needs at least one resolvable identifier: isbn, doi or url`);
        }
    }
  }

  // --- rule 17: presences -------------------------------------------------
  // Everything a presence must be internally, plus the one thing only the
  // set of them can say: an actor cannot hold two outlines of the same
  // territory at once. Overlapping intervals with *different* geometry are
  // allowed — a year is the finest bound the model has, so a border that
  // moved in August leaves two presences sharing that year, and that is the
  // truth rather than a mistake. Whether the files named actually exist is a
  // disk question, and lives in tools/validate.mjs.
  for (const r of own) {
    if (r.kind !== 'presence') continue;
    // The other direction does not hold, and deliberately: Danzig was a
    // mandate under the League of Nations and West New Guinea a protectorate
    // under the United Nations, so the kind is known and the sovereign is
    // not a state. dependencyKind says how a territory was held;
    // dependencyOf says by whom, when that is a state on this map.
    if (r.dependencyOf !== null && r.dependencyKind === null) {
      error(17, r, '/dependencyKind', 'a dependency says how it was held: colony, protectorate, mandate or occupied');
    }
    if (r.dependencyOf === r.actor) {
      error(17, r, '/dependencyOf', 'a presence cannot be a dependency of its own actor');
    }
    if (!Array.isArray(r.geometry?.files) || r.geometry.files.length === 0) {
      error(17, r, '/geometry/files', 'a presence names at least one file holding its outline');
    }
  }
  {
    // Grouped by (actor, outline) rather than by actor alone: the pair this
    // rule is about is two presences that put *the same* outline on one
    // actor, so every other pair was compared and thrown away. Only the
    // groups a record under validation is in are looked at, because the
    // error is reported on the record under validation and nowhere else.
    for (const [key, mine] of ours.presencesByOutline) {
      const list = merge(base.presencesByOutline.get(key), mine, entryId);
      const spans = list.map((p) => span(p.when));
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i];
          const b = list[j];
          const own = ownIds.has(a.id) ? a : ownIds.has(b.id) ? b : null;
          if (!own) continue;
          const sa = spans[i];
          const sb = spans[j];
          if (!sa || !sb || sa.to < sb.from || sb.to < sa.from) continue;
          error(17, own, '/when', `"${a.id}" and "${b.id}" put the same outline on "${a.actor}" over overlapping years`);
        }
      }
    }
  }

  // --- rule 18: places, and an event's other names ------------------------
  // The little a place has to hold together. Its point is required by the
  // schema and checked by rule 10; its lane is derived from that point, so a
  // place needs no region of its own. What is left is the name list, for the
  // same reason an actor's is a rule and not a keyword (deviation 22).
  //
  // An event's list is optional where a place's is required — the title is
  // already its display name and this is what else the thing is called
  // (health review B, finding 17: the atlas could not be searched for its
  // most famous event by its common name) — but a list that is there is held
  // to the same shape, because "twice the same name" is not a shape a schema
  // can refuse and a duplicate would be a second hit for one record.
  for (const r of own) {
    const optional = r.kind === 'event';
    if (r.kind !== 'place' && !(optional && r.names !== undefined)) continue;
    const names = Array.isArray(r.names) ? r.names.filter((n) => typeof n === 'string' && n.trim() !== '') : [];
    if (names.length === 0 && !optional) error(18, r, '/names', 'a place has at least one name; the first is the display name');
    if (names.length === 0 && optional) error(18, r, '/names', 'an event with no other names carries no list, rather than an empty one');
    names.forEach((name, i) => {
      if (names.indexOf(name) !== i) error(18, r, `/names/${i}`, `name "${name}" repeated`);
    });
    if (optional && names.some((n) => n === r.title)) {
      error(18, r, '/names', 'the title is already the display name; this list is what else the event is called');
    }
  }

  // --- rule 19: relations between actors ----------------------------------
  // What holds a relation together: two different actors, of the kinds the
  // type allows, and — for the two types that describe a line of succession —
  // no cycle. Whether the actors exist at all is rule 3 and whether the years
  // are years is rule 15; this is everything left that only the pair can say.
  for (const r of own) {
    if (r.kind !== 'relation') continue;
    if (r.from === r.to) {
      error(19, r, '/to', 'a relation runs between two different actors');
      continue;
    }
    const ends = RELATION_ENDPOINTS[r.type];
    if (!ends) continue;
    const from = lookup(r.from, 'actor');
    const to = lookup(r.to, 'actor');
    if (from && !ends.from.includes(from.actorType)) {
      error(19, r, '/from', `a ${from.actorType} cannot be the "${r.type}" end of this relation: ${ends.from.join(' or ')} only`);
    }
    if (to && !ends.to.includes(to.actorType)) {
      error(19, r, '/to', `a "${r.type}" relation points at ${ends.to.join(' or ')}, not at a ${to.actorType}`);
    }
    // A succession is between two of a kind: a colony is succeeded by the
    // state that followed it, never by the ministry that administered it.
    if (ends.sameKind && from && to && from.actorType !== to.actorType) {
      error(19, r, '/to', `a succession runs between two actors of the same kind: "${r.from}" is a ${from.actorType} and "${r.to}" a ${to.actorType}`);
    }
  }
  // Acyclicity, per type: regime-of on its own and succeeded on its own.
  // Both describe a line — a regime of a state, a state after a state — and a
  // line that closes on itself is a mistake in the data rather than an
  // unusual arrangement.
  for (const type of ACYCLIC_RELATION_TYPES) {
    const out = new Map();
    const nodes = new Set();
    const indegree = new Map();
    for (const entry of merge(base.relationsByType.get(type), ours.relationsByType.get(type), entryId)) {
      const { from, to } = entry;
      nodes.add(from);
      nodes.add(to);
      if (!out.has(from)) out.set(from, []);
      out.get(from).push(to);
      indegree.set(to, (indegree.get(to) ?? 0) + 1);
    }
    const queue = [...nodes].filter((n) => !indegree.get(n));
    const seen = new Set();
    while (queue.length) {
      const n = queue.pop();
      seen.add(n);
      for (const m of out.get(n) ?? []) {
        indegree.set(m, indegree.get(m) - 1);
        if (indegree.get(m) === 0) queue.push(m);
      }
    }
    const stuck = [...nodes].filter((n) => !seen.has(n)).sort();
    if (stuck.length) {
      const culprit = own.find((r) => r.kind === 'relation' && r.type === type && r.status === 'active'
        && stuck.includes(r.from) && stuck.includes(r.to)) ?? null;
      error(19, culprit, '', `"${type}" closes on itself through: ${stuck.join(', ')}`);
    }
  }

  // --- rule 20: narratives ------------------------------------------------
  // What only the whole walk can say. Whether the refs exist is rule 3 and
  // whether they are still active is rule 11; this is the shape of the
  // argument itself — long enough to be a walk, with prose at every step.
  for (const r of own) {
    if (r.kind !== 'narrative') continue;
    const steps = Array.isArray(r.steps) ? r.steps : [];
    if (steps.length < MIN_NARRATIVE_STEPS) {
      error(20, r, '/steps', `a narrative walks at least ${MIN_NARRATIVE_STEPS} records; this one has ${steps.length}`);
    }
    if (!nonTrivial(r.summary)) {
      error(20, r, '/summary', `summary must say what the narrative claims (at least ${MIN_TEXT_LENGTH} characters)`);
    }
    steps.forEach((step, i) => {
      if (!nonTrivial(step?.text)) {
        error(20, r, `/steps/${i}/text`, `a step says why it follows (at least ${MIN_TEXT_LENGTH} characters)`);
      }
      // The same record twice running is a step that does not step.
      if (i > 0 && step?.ref === steps[i - 1]?.ref) {
        error(20, r, `/steps/${i}/ref`, `"${step.ref}" is already the step before this one`);
      }
    });
    if (isObject(r.window)) {
      const from = checkBound(r, '/window/from', r.window.from);
      const to = checkBound(r, '/window/to', r.window.to);
      if (from && to && from.min > to.max) error(20, r, '/window', 'the window opens after it closes');
    }
  }

  // --- rule 21: the identity a record claims ------------------------------
  // Three optional fields that say which item in Wikidata this record is
  // about. They are identifiers and not evidence: what the atlas asserts is
  // in the record, and this only says where the same thing is catalogued
  // elsewhere, so that an import can find a record again and a reader can go
  // and read the article. Two records of one kind claiming one item is the
  // mistake worth catching — it means one of them is a duplicate.
  {
    const claimantsOf = (key) => merge(base.claimants.get(key), ours.claimants.get(key), (id) => id);
    for (const r of own) {
      const hasItem = typeof r.wikidata === 'string';
      if ((hasItem || isObject(r.wikipedia) || isObject(r.sitelinks)) && !IDENTITY_KINDS.includes(r.kind)) {
        error(21, r, '/wikidata', `a ${r.kind} has no Wikidata item: only ${IDENTITY_KINDS.join(', ')} records do`);
        continue;
      }
      if (hasItem) {
        const others = claimantsOf(`${r.kind} ${r.wikidata}`).filter((id) => id !== r.id).sort();
        if (others.length) {
          error(21, r, '/wikidata', `"${r.wikidata}" is already the Wikidata item of the ${r.kind} ${others.join(', ')}`);
        }
      }
      if (isObject(r.wikipedia)) {
        // A title with no item behind it is a guess about which article is
        // meant, and the link on the card would be that guess made public.
        if (!hasItem) error(21, r, '/wikipedia', 'a Wikipedia title is written beside the Wikidata item it belongs to, never on its own');
        for (const lang of Object.keys(r.wikipedia)) {
          // The code becomes a hostname on the card, so it is checked here
          // rather than trusted there.
          if (!WIKIPEDIA_LANG.test(lang)) error(21, r, `/wikipedia/${lang}`, `"${lang}" is not a language edition code`);
        }
      }
    }
  }

  // --- rule 22: an argument does not rest on an encyclopedia alone --------
  // `consensus` says the link is accepted by the scholarship. An
  // encyclopedia reports scholarship rather than being it, so an edge whose
  // every supporting citation is a Wikipedia record has not shown that the
  // scholarship agrees — only that somebody summarised it. Deliberately not
  // folded into rule 9: that rule asks whether two authors are independent,
  // and this one asks what kind of thing was cited, which stays true however
  // many editions are named.
  for (const r of own) {
    if (r.kind !== 'edge' || r.confidence !== 'consensus') continue;
    const cited = (r.sources ?? []).map((c) => c?.source).filter((id) => typeof id === 'string');
    if (cited.length && cited.every((id) => WIKIPEDIA_SOURCES.includes(id))) {
      error(22, r, '/sources', 'consensus cannot rest on Wikipedia alone: cite the scholarship the article rests on, or mark the link probable');
    }
  }

  // --- rule 23: what a full entry may say ---------------------------------
  // A body is prose with two kinds of reference in it, and neither can be
  // checked by a schema. A citation mark stands for a work the record rests
  // on, so it must name one the record actually cites: a mark pointing at a
  // book nowhere in `sources` is a footnote to nothing, and the reader would
  // have no way to reach the work. A link by id must resolve to a record of
  // the kind it names, for the reason rule 3 exists — a link that goes
  // nowhere is worse than no link, because it looks like a way through.
  for (const r of own) {
    if (!BODY_KINDS.includes(r.kind) || typeof r.body !== 'string' || r.body === '') continue;
    const cited = new Set(citedSources(r));
    const seen = new Set();
    for (const { source } of bodyCitations(r.body)) {
      if (cited.has(source) || seen.has(source)) continue;
      seen.add(source);
      error(23, r, '/body', `the entry cites "${source}", which is not among this record's sources`);
    }
    const missing = new Set();
    for (const { kind, id } of bodyLinks(r.body)) {
      const key = `${kind}:${id}`;
      if (lookup(id, kind) || missing.has(key)) continue;
      missing.add(key);
      error(23, r, '/body', `the entry links to "${id}", which is not ${kind === 'event' || kind === 'actor' ? 'an' : 'a'} ${kind} record`);
    }
  }

  // --- rules 27, 28, 29: the envelope's conditional requirements -----------
  // Three fields whose meaning is a relation between fields, which no schema
  // can state: a schema says a key is well formed, not that it belongs on
  // this record.
  for (const r of own) {
    // 27. A tombstone says why it is one, and nothing else carries a
    // retraction. The reason is the record's own history — Sign and Retract
    // never delete it, which is the whole reason it left `review.note`
    // (health review B, finding 16) — so a retraction with no record and a
    // record with no retraction are both a history that has gone missing.
    const retracted = r.status === 'retracted';
    const hasRetraction = isObject(r.retraction);
    if (retracted && !hasRetraction) {
      error(27, r, '/retraction', 'a retracted record says when it was withdrawn and why');
    }
    if (!retracted && r.retraction !== undefined) {
      error(27, r, '/retraction', `only a retracted record carries a retraction; this one is ${r.status}`);
    }

    // 28. `reviewed` is a claim that a person read this record, and a claim
    // with nobody behind it is the thing the review dashboard exists to
    // stop. `draft` needs nothing: it says only that nobody has.
    if (isObject(r.review) && r.review.status === REVIEW_STATUS.reviewed) {
      if (!Array.isArray(r.review.signedBy) || r.review.signedBy.length === 0) {
        error(28, r, '/review/signedBy', 'a reviewed record names who signed it');
      }
    }

    // 29. `origin` answers "who wrote this record", not "who has touched
    // it": it is written once, by whatever created the record, and an
    // enrichment pass that fills in a field on somebody else's record never
    // sets it (tools/import/identity.mjs). The validator cannot see history,
    // so what it checks is the half that shows in one record — a record an
    // automated writer made carries one. Without it such a record falls
    // silently out of the review queue and out of rule 12's licence hole,
    // which is exactly the failure the move off author names was for.
    //
    // WRITER_NAMES is the only place left in the project where those author
    // strings decide anything, and it decides nothing about the record: it
    // asks a creator whether it wrote `origin`. It goes when the last of
    // those names does.
    if (originTool(r) === null && (r.authors ?? []).some((a) => WRITER_NAMES.includes(a?.name))) {
      error(29, r, '/origin', 'a record an automated writer created says so in origin, so that nothing has to read authors to find out');
    }
  }

  // --- warnings: degree zero, no citers -----------------------------------
  const cited = new Set();
  for (const r of own) {
    if (r.status === 'active') citations(r).forEach((id) => cited.add(id));
  }
  for (const r of own) {
    if (r.kind === 'event' && r.status === 'active' && edgesTouching(r.id).length === 0) {
      warning('degree-zero', r, 'event has no edges');
    }
    if (r.kind === 'source' && r.status === 'active' && !cited.has(r.id)) {
      warning('no-citers', r, 'source is cited by nothing under validation');
    }
  }

  // An actor nothing references is the actor equivalent of degree zero, and
  // an event outside an actor's life is a warning rather than an error:
  // posthumous events are real, and so are institutions acting through
  // their successors. What counts as a reference is the same set rule 11
  // asks about above — an active event that names it, an active presence
  // whose ground it held or held over, an active relation at either end —
  // so it is the same index and not a second walk of the universe. A place
  // nothing happened at is the place equivalent, and the same again.
  for (const r of own) {
    if (r.kind === 'place' && r.status === 'active' && placeReferrers(r.id).length === 0) {
      warning('place-unused', r, 'place is referenced by no event');
    }
    if (r.kind === 'actor' && r.status === 'active' && actorReferrers(r.id).length === 0) {
      warning('actor-unused', r, 'actor is referenced by no event and no relation, and holds no territory');
    }
    // A relation whose years fall entirely outside an actor's own is a
    // warning for the same reason an event outside them is: a party's
    // founding date and the year somebody joined it come from two records,
    // and either may be the one that is wrong.
    if (r.kind === 'relation' && r.status === 'active') {
      const relationSpan = span(r.when);
      for (const end of ['from', 'to']) {
        const actor = lookup(r[end], 'actor');
        const actorSpan = actor ? span(actor.when) : null;
        if (!relationSpan || !actorSpan) continue;
        if (relationSpan.to < actorSpan.from || relationSpan.from > actorSpan.to) {
          warning('relation-outside-actor-when', r, `the relation falls entirely outside "${actor.id}"'s dates`);
        }
      }
    }
    // A presence outside its actor's life is a warning for the same reason
    // an event outside it is: the dates come from two sources and either may
    // be the one that is wrong.
    if (r.kind === 'presence' && r.status === 'active') {
      const actor = lookup(r.actor, 'actor');
      const presenceSpan = span(r.when);
      const actorSpan = actor ? span(actor.when) : null;
      if (presenceSpan && actorSpan && (presenceSpan.to < actorSpan.from || presenceSpan.from > actorSpan.to)) {
        warning('presence-outside-actor-when', r, `the presence falls entirely outside "${actor.id}"'s dates`);
      }
    }
    if (r.kind !== 'event' || r.status !== 'active') continue;
    const eventSpan = span(r.when);
    if (!eventSpan) continue;
    for (const a of r.actors ?? []) {
      const actor = lookup(a?.actor, 'actor');
      const actorSpan = actor ? span(actor.when) : null;
      if (!actorSpan) continue;
      if (eventSpan.to < actorSpan.from || eventSpan.from > actorSpan.to) {
        warning('actor-outside-when', r, `the event falls entirely outside "${actor.id}"'s dates`);
      }
    }
  }

  return { errors, warnings };
}

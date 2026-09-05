// validate(records, topology, schemas) → { errors, warnings }. Pure: runs in
// Node (tools/validate.mjs) and in the browser (the contribution form,
// later). Rule 1 is here — every record against its kind's v1 schema —
// and rules 2–15 are in rules.js. Records that fail their schema are kept
// out of the rules pass: the rules assume the shapes the schema guarantees.

import { createValidator } from './schema.js';
import { checkRules, normalizeRole } from './rules.js';
import { KINDS } from '../kinds.js';
import { edgeId } from '../vocab.js';

export { KINDS, edgeId };
export const SCHEMA_VERSION = 1;

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function validate(records, topology, schemas) {
  const errors = [];
  const warnings = [];
  const validator = createValidator(schemas);
  if (validator.schemaErrors.length) {
    for (const e of validator.schemaErrors) {
      errors.push({ level: 'error', rule: 1, id: null, kind: 'schema', path: e.schema, message: e.message });
    }
    return { errors, warnings };
  }

  const push = (rule, id, kind, list) => {
    for (const e of list) {
      errors.push({ level: 'error', rule, id, kind, path: e.path, message: e.message, alternatives: e.alternatives });
    }
  };

  (topology?.regions ?? []).forEach((region, i) => {
    const id = isObject(region) && typeof region.id === 'string' ? region.id : `regions[${i}]`;
    push(1, id, 'region', validator.validate('v1/region.json', region));
  });
  const regionIds = (topology?.regions ?? []).map((r) => r?.id);
  regionIds.forEach((id, i) => {
    if (regionIds.indexOf(id) !== i) errors.push({ level: 'error', rule: 2, id, kind: 'region', path: '/id', message: `duplicate region id "${id}"` });
  });

  const passing = [];
  records.forEach((record, i) => {
    const label = isObject(record) && typeof record.id === 'string' ? record.id : `records[${i}]`;
    if (!isObject(record)) {
      errors.push({ level: 'error', rule: 1, id: label, kind: null, path: '', message: 'a record is a JSON object' });
      return;
    }
    // Up to SCHEMA_VERSION rather than exactly it: an older record is one the
    // migration chain in migrate.js can still read, and refusing it would
    // make every fork's records invalid the day this repository bumps the
    // number (health review A, finding 25). A *newer* one is a record written
    // by a version of the atlas this one does not know, and there is nothing
    // honest to do with it but say so.
    if (!Number.isInteger(record.schema) || record.schema < 1 || record.schema > SCHEMA_VERSION) {
      errors.push({ level: 'error', rule: 1, id: label, kind: record.kind ?? null, path: '/schema', message: `unsupported schema version ${JSON.stringify(record.schema)}; this validator knows up to ${SCHEMA_VERSION}` });
      return;
    }
    if (!KINDS.includes(record.kind)) {
      errors.push({ level: 'error', rule: 1, id: label, kind: record.kind ?? null, path: '/kind', message: `unknown kind ${JSON.stringify(record.kind)}` });
      return;
    }
    const schemaErrors = validator.validate(`v1/${record.kind}.json`, record);
    if (schemaErrors.length) {
      push(1, label, record.kind, schemaErrors);
      return;
    }
    passing.push(record);
  });

  const rules = checkRules(passing, topology ?? {});
  errors.push(...rules.errors);
  warnings.push(...rules.warnings);
  return { errors, warnings };
}

// Code-unit comparison, never localeCompare: the index must be byte-identical
// on every machine (docs/review-2026-09-01.md, finding 15).
export function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// The set of roles in use, normalised, sorted by code unit. Emitted in the
// manifest so a closed vocabulary can be decided later from what people
// actually wrote (m4-brief).
export function rolesInUse(events) {
  const roles = new Set();
  for (const e of events ?? []) {
    for (const a of e.actors ?? []) {
      const role = normalizeRole(a?.role);
      if (role) roles.add(role);
    }
  }
  return [...roles].sort();
}

// How much of the graph an event carries: active edges in and out, plus the
// actors it names. Mechanical on purpose — it is how many arguments and
// people the record already holds, not how important anyone thinks the
// event was. The map uses it to choose which mark represents a cluster and
// which clusters earn a label; an editorial `prominence` field may override
// it later (ARCHITECTURE.md, extension points).
export function eventWeights(events, edges) {
  const weights = new Map(events.map((e) => [e.id, 0]));
  for (const edge of edges) {
    if (edge.status !== 'active') continue;
    for (const end of [edge.from, edge.to]) {
      if (weights.has(end)) weights.set(end, weights.get(end) + 1);
    }
  }
  for (const event of events) {
    weights.set(event.id, weights.get(event.id) + (event.actors ?? []).length);
  }
  return weights;
}

// Who cites what, the other way round: Map<source id, [{ kind, id, locator,
// dissent }]>. A source is shared by reference — fifty records citing one
// book cite one file — and that direction is the one nothing could answer
// without reading every record in the atlas, which is exactly what the index
// exists to prevent. `dissent` marks a citation that comes from an edge's
// `dispute.sources`: a book that argues against a link is never listed as
// evidence for it.
//
// Only active records cite: a tombstone still resolves its own URL but it is
// not part of the graph, and counting it would make the bibliography's
// numbers disagree with what the atlas draws.
export function citationsBySource(records) {
  const out = new Map();
  const add = (sourceId, entry) => {
    if (!out.has(sourceId)) out.set(sourceId, []);
    out.get(sourceId).push(entry);
  };
  // A citation may name a source by an id the source used to have. The list
  // is keyed by the id the source answers to now, so a rename does not empty
  // the bibliography entry and the counts on the cards — which is where
  // citationsOf in src/data.js reads them from (health review A, finding 20).
  const standsFor = new Map();
  for (const r of records) {
    if (!isObject(r)) continue;
    for (const alias of r.aliases ?? []) if (!standsFor.has(alias)) standsFor.set(alias, r.id);
  }
  const now = (id) => standsFor.get(id) ?? id;
  for (const r of records) {
    if (!isObject(r) || r.status !== 'active' || r.kind === 'source') continue;
    for (const c of r.sources ?? []) {
      if (typeof c?.source === 'string') add(now(c.source), { kind: r.kind, id: r.id, locator: c.locator ?? null, dissent: false });
    }
    if (isObject(r.dispute)) {
      for (const c of r.dispute.sources ?? []) {
        if (typeof c?.source === 'string') add(now(c.source), { kind: r.kind, id: r.id, locator: c.locator ?? null, dissent: true });
      }
    }
  }
  for (const list of out.values()) {
    list.sort((a, b) => (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0)
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      || (a.dissent === b.dissent ? 0 : a.dissent ? 1 : -1)
      || (String(a.locator) < String(b.locator) ? -1 : String(a.locator) > String(b.locator) ? 1 : 0));
  }
  return out;
}

// How many citations a record *makes*, read off the other direction. Two
// counts have shared one name until now: this one, which three cards print
// beside a record, and the number of records that cite a source, which the
// bibliography prints. In the index they are `citesCount` on the record and
// `citationCount` on the source (h3a-brief, A8).
export function citesCountByRecord(sources) {
  const counts = new Map();
  for (const source of sources ?? []) {
    for (const citation of source.citations ?? []) {
      const key = `${citation.kind}:${citation.id}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

// The other direction, as files: one per source that anything cites, in id
// order. `cshapes-2-0` alone holds 1,041 of the 1,933 citations — about
// 150 KB — and no page needs a citer list until a reader opens that one
// source, which is why the rows leave the index every page loads whole
// (h3a-brief, A7). A source nothing cites gets no file: its `citationCount`
// is in the sources index, so a card knows there is nothing to fetch.
export function citerFiles(sources) {
  return (sources ?? [])
    .filter((source) => (source.citations ?? []).length > 0)
    .map((source) => ({ id: source.id, citations: source.citations }));
}

// The identity a record claims, for the topology. `wikidata` is carried
// because rule 21's uniqueness has to hold against the whole atlas and not
// only against the bundle in hand, and `wikipedia` because the card offers
// the link without fetching the record. `sitelinks` stays out: nothing drawn
// reads it, and putting a number nobody uses in the index every reader
// downloads would be paying for it twice.
function identityOf(record) {
  const out = {};
  if (typeof record.wikidata === 'string') out.wikidata = record.wikidata;
  if (isObject(record.wikipedia)) out.wikipedia = record.wikipedia;
  return out;
}

// Where a record sits and which lane that puts it in: the override on the
// record wins, then the polygon the point falls in, then the nearest lane
// within tolerance.
function laneOf(record, where, deriveRegion) {
  const override = typeof record.region === 'string' ? record.region : null;
  if (override) return { region: override, regionMethod: 'override' };
  if (isObject(where) && deriveRegion) {
    const derived = deriveRegion(where);
    if (derived) return { region: derived.region, regionMethod: derived.method };
  }
  return { region: null, regionMethod: null };
}

// The topology object: what build-index.mjs writes and what the rules read.
// Text fields stay out; the site fetches record files for them. An event's
// coordinates are its place's, and its `region` is its own override, then the
// place's lane (the place's own override or what deriveRegion says of its
// point). An actor's `summary` and `where` stay out for the same reason: the
// panel fetches the record when the card is opened.
export function buildTopology(records, regions, { deriveRegion } = {}) {
  const events = [];
  const edges = [];
  const sources = [];
  const actors = [];
  const presences = [];
  const places = [];
  const relations = [];
  const narratives = [];
  // Places first: an event's lane is derived from the place it names, so the
  // places have to be resolved before any event is.
  const placeById = new Map();
  for (const r of records) {
    if (r.kind !== 'place') continue;
    const entry = {
      id: r.id,
      name: (r.names ?? [])[0] ?? r.id,
      names: r.names ?? [],
      where: isObject(r.where) ? r.where : null,
      ...laneOf(r, r.where, deriveRegion),
      ...identityOf(r),
      status: r.status,
      supersededBy: r.supersededBy ?? null,
      aliases: r.aliases ?? [],
    };
    places.push(entry);
    if (!placeById.has(entry.id)) placeById.set(entry.id, entry);
  }
  for (const r of records) {
    if (r.kind === 'event') {
      const place = typeof r.place === 'string' ? placeById.get(r.place) ?? null : null;
      let { region, regionMethod } = laneOf(r, null, deriveRegion);
      if (!region && place) {
        region = place.region;
        regionMethod = place.regionMethod;
      }
      events.push({
        id: r.id,
        title: r.title,
        when: r.when,
        place: typeof r.place === 'string' ? r.place : null,
        region,
        regionMethod,
        ...identityOf(r),
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
        actors: (Array.isArray(r.actors) ? r.actors : []).map((a) => ({ actor: a.actor, role: a.role })),
      });
    } else if (r.kind === 'edge') {
      edges.push({
        id: r.id,
        from: r.from,
        to: r.to,
        type: r.type,
        confidence: r.confidence,
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    } else if (r.kind === 'source') {
      // The record whole — it is small, it is all citation, and the panel
      // shows every field of it. `citations` is added below, once every
      // record has been seen.
      sources.push({ ...r });
    } else if (r.kind === 'actor') {
      actors.push({
        id: r.id,
        actorType: r.actorType,
        name: (r.names ?? [])[0] ?? r.id,
        names: r.names ?? [],
        when: r.when,
        ...identityOf(r),
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    } else if (r.kind === 'relation') {
      // The whole record but its envelope's text: a relation has no card of
      // its own, so an actor's card draws every relation it stands in without
      // fetching one record each. `note` is short by schema and comes with
      // it for the same reason a presence's `capital` does (deviation 43).
      relations.push({
        id: r.id,
        from: r.from,
        to: r.to,
        type: r.type,
        when: r.when,
        note: typeof r.note === 'string' ? r.note : null,
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    } else if (r.kind === 'narrative') {
      // Everything the list of narratives and the walk itself need, and not a
      // word of the steps: the titles, the summary and the authors are what a
      // reader chooses between, the refs are what the map and the graph
      // follow, and the prose of a step is fetched when that step is read.
      narratives.push({
        id: r.id,
        title: r.title,
        summary: r.summary,
        authors: r.authors ?? [],
        window: isObject(r.window) ? r.window : null,
        steps: (Array.isArray(r.steps) ? r.steps : []).map((step) => ({ ref: step.ref })),
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    } else if (r.kind === 'presence') {
      // Everything the panel and the map need except the coordinates: an
      // actor's territory over time is a list the card can draw without
      // fetching a single outline, and the outlines themselves are fetched
      // one shard at a time, by year.
      presences.push({
        id: r.id,
        actor: r.actor,
        presenceType: r.presenceType,
        dependencyOf: r.dependencyOf ?? null,
        dependencyKind: r.dependencyKind ?? null,
        when: r.when,
        geometry: r.geometry,
        capital: isObject(r.capital) ? r.capital : null,
        confidence: r.confidence,
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    }
  }
  const weights = eventWeights(events, edges);
  for (const event of events) event.weight = weights.get(event.id);
  // Every source carries its own citers and how many there are, so a source
  // card and a bibliography are both one fetch of the sources index and no
  // more. The count is written out beside the list rather than left to
  // length: the bibliography is the one page that reads it.
  const citations = citationsBySource(records);
  for (const source of sources) {
    source.citations = citations.get(source.id) ?? [];
    source.citationCount = source.citations.length;
  }
  events.sort(byId);
  edges.sort(byId);
  sources.sort(byId);
  actors.sort(byId);
  presences.sort(byId);
  places.sort(byId);
  relations.sort(byId);
  narratives.sort(byId);
  return {
    events,
    edges,
    sources,
    actors,
    presences,
    places,
    relations,
    narratives,
    regions: [...(regions ?? [])].sort((a, b) => a.order - b.order || byId(a, b)),
  };
}

// ─── The spine ──────────────────────────────────────────────────────────────
//
// A projection of the topology, not a second reading of the records: what
// every page needs of every record whole, with the two fields nothing draws
// (`regionMethod`, `presenceType`) and the citer rows left out. The topology
// is emitted unchanged beside it; H3b is where the pages move over.
//
// `when` is carried verbatim, never reduced to a pair of years: fourteen
// readers want the object — `whenOf` in rules.js reads `when.date` and
// `when.calendar`, rule 4 reads the raw start bound, and lanes.js draws an
// open-ended bar from `max === null`. Astronomical years are for arithmetic
// and are never stored in place of the record's own numbering, which is why
// there is no `start`/`end` pair here (h3a-brief, A1).

// A tombstone still resolves its own URL and still reaches a card — 175
// retracted events do — but it is not part of the graph, so it carries what
// the card's head and meta line are built from and nothing else (A10). The
// label is kept whatever its kind calls it: a merged actor with no name
// would give the panel nothing to say it was merged *from* (deviation 215).
const TOMBSTONE_KEYS = new Set(['id', 'kind', 'status', 'supersededBy', 'aliases', 'wikidata', 'title', 'name', 'names', 'when', 'place', 'region']);

function spineEntry(entry) {
  if (entry.status === 'active') return entry;
  return Object.fromEntries(Object.entries(entry).filter(([key]) => TOMBSTONE_KEYS.has(key)));
}

// What every record carries, whatever its kind. `aliases` and `supersededBy`
// are the merge hop `resolve()` walks, so they are here even when empty.
function envelopeOf(record, kind) {
  const out = { id: record.id, kind, status: record.status, supersededBy: record.supersededBy ?? null, aliases: record.aliases ?? [] };
  if (typeof record.wikidata === 'string') out.wikidata = record.wikidata;
  if (isObject(record.wikipedia)) out.wikipedia = record.wikipedia;
  return out;
}

// An edge id is `from--to--type` on every one of them, so the tuple carries
// no id and the loader synthesises it. Five elements, not four: `status` is
// what keeps a retracted argument out of consequences, convergence and the
// shortest path (A2). An edge that carries an alias or a merge hop cannot be
// said in five slots and is written whole instead; the loader takes either.
// `edgeId` itself is in `vocab.js`, beside the pattern it is the inverse of.
function edgeInSpine(edge) {
  const named = edge.id === edgeId(edge);
  if (named && !edge.supersededBy && (edge.aliases ?? []).length === 0) {
    return [edge.from, edge.to, edge.type, edge.confidence, edge.status];
  }
  const out = {
    from: edge.from, to: edge.to, type: edge.type, confidence: edge.confidence,
    status: edge.status, supersededBy: edge.supersededBy ?? null, aliases: edge.aliases ?? [],
  };
  if (!named) out.id = edge.id;
  return out;
}

export function buildSpine(topology) {
  const cites = citesCountByRecord(topology.sources);
  const citesCount = (kind, id) => cites.get(`${kind}:${id}`) ?? 0;
  return {
    schema: 1,
    events: (topology.events ?? []).map((e) => spineEntry({
      ...envelopeOf(e, 'event'),
      title: e.title,
      when: e.when,
      place: e.place,
      region: e.region,
      weight: e.weight,
      actors: e.actors ?? [],
      citesCount: citesCount('event', e.id),
    })),
    edges: (topology.edges ?? []).map(edgeInSpine),
    actors: (topology.actors ?? []).map((a) => spineEntry({
      ...envelopeOf(a, 'actor'),
      name: a.name,
      names: a.names ?? [],
      actorType: a.actorType,
      when: a.when,
      citesCount: citesCount('actor', a.id),
    })),
    places: (topology.places ?? []).map((p) => spineEntry({
      ...envelopeOf(p, 'place'),
      name: p.name,
      names: p.names ?? [],
      where: p.where,
      region: p.region,
      citesCount: citesCount('place', p.id),
    })),
    // Only the key of the outline: the shard that holds it is chosen by year
    // from the manifest, and `geometry.files` is read nowhere.
    presences: (topology.presences ?? []).map((p) => spineEntry({
      ...envelopeOf(p, 'presence'),
      actor: p.actor,
      when: p.when,
      geometry: { key: p.geometry?.key ?? null },
      dependencyOf: p.dependencyOf ?? null,
      dependencyKind: p.dependencyKind ?? null,
      capital: p.capital ?? null,
      confidence: p.confidence,
    })),
    relations: (topology.relations ?? []).map((r) => spineEntry({
      ...envelopeOf(r, 'relation'),
      from: r.from,
      to: r.to,
      type: r.type,
      when: r.when,
      note: r.note ?? null,
    })),
    narratives: (topology.narratives ?? []).map((n) => spineEntry({
      ...envelopeOf(n, 'narrative'),
      title: n.title,
      summary: n.summary,
      authors: n.authors ?? [],
      window: n.window ?? null,
      steps: n.steps ?? [],
    })),
  };
}

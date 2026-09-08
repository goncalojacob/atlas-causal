// Reads the manifest, loads the core whole, fetches record text on demand,
// resolves aliases and supersededBy, builds adjacency — of events to events
// through edges, and of actors to the events they appear in. Knows nothing
// about how things are drawn.
//
// The **core** is always loaded whole because consequences, ancestors and
// convergence need the whole graph; a window would make convergence return
// a subset and present it as complete (ARCHITECTURE.md). It is the graph and
// what a mark, a bar and a lane need, and it is the only graph file there is
// since I4b: the whole-corpus spine the index used to write is now the core
// plus the attribute shards, which arrive a century at a time behind the
// picture and which nothing waits for (docs/index2-plan.md, D4).
//
// `createAtlas` below assembles the atlas out of the lists a graph file expands
// into — the shape `buildTopology` builds in memory — and
// `createAtlasFromCore` is the expansion in front of it. `createAtlasFromSpine`
// is still here for the build and the tests: the build assembles the
// prerendered pages from `buildSpine(topology)` in memory, which is what makes
// their byte-identity a check on the whole projection (i4-brief, A5).

import { buildAdjacency } from './graph.js';
import { narrativeEventIds } from './narrative.js';
import { extent as intervalExtent } from './util/dates.js';
import { attributePeriod, attributeShardKey, periodOfEdge } from './explanations.js';
// The index's column tables, read backwards here and forwards by the build.
import {
  ATTRIBUTE_COLUMNS, CORE_COLUMNS, PRESENCE_KINDS, SPINE_KINDS,
  applyAttributes, boundsOf, decodeSpineFile, fillFallbacks, stripAttributes,
} from './spine.js';

async function defaultFetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

// ─── The index's generation ────────────────────────────────────────────────
//
// `data/index/` is a projection of `data/`, not a second copy of it, so a
// change to its shape is a rebuild and never a migration (docs/index2-plan.md,
// D6). What the number is for is the half-applied deploy: a manifest from one
// generation beside a page from another would otherwise be read as though it
// were the shape the page expects, silently and wrongly. It goes up by one in
// every run that changes the index's shape — 5 since I4b, which stopped writing
// the whole-corpus file altogether, so a build from before it names a
// `files.spine` no page here reads and a page from before it would find no such
// key; 4 was I3, which wrote the core and the attribute shards beside it; 3 was
// I2, which made every record a positional row over a shared id table, and 2
// was I1, which took the presences out of the spine and put the region boxes in
// the manifest.
//
// The graph file carries the same number rather than one of its own: two
// numbers for one artifact is two things to forget to bump.
export const INDEX_GENERATION = 5;
// A single set, because a deploy may serve one generation while the last is
// still in a cache; today it holds one number and it is the place to add the
// second when that becomes true.
export const KNOWN_GENERATIONS = Object.freeze(new Set([INDEX_GENERATION]));

// Called by the loaders and by nothing else (index2 review, finding 17):
// `createAtlas` is handed manifests by hand all over the test suite, and a
// guard there would refuse them for saying nothing about a file layout they
// do not use. A loader has just fetched the manifest and is about to read the
// files it names, which is exactly where the number means something.
export function assertGeneration(manifest) {
  const found = manifest?.schema;
  if (KNOWN_GENERATIONS.has(found)) return manifest;
  throw new Error(`data/index/ is generation ${found === undefined ? 'unstated' : String(found)}; this build reads ${[...KNOWN_GENERATIONS].join(', ')}. Rebuild it: node tools/build-index.mjs`);
}

// Pure assembly from already-loaded pieces; loadAtlas() does the fetching.
export function createAtlas({
  manifest, topology, sources, land = null, palette = null, regionBoxes = null, regionShapes = null,
  dataRoot = 'data/', fetchJson = defaultFetchJson, citers: seededCiters = null,
  presences: seededPresences = null,
  // Since I3, and only for an atlas built from the core: whether a record's
  // attribute shard has landed, and what `record()` must wait for before it can
  // ask for a record file with the `?v=` the shard carries (i3-brief, A2 and
  // A3). An atlas from the spine has every attribute in hand the moment it
  // exists, which is what the defaults say.
  attributesLoaded = () => true,
  beforeRecord = null,
}) {
  const events = new Map(topology.events.map((e) => [e.id, e]));
  const edges = new Map(topology.edges.map((e) => [e.id, e]));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const actors = new Map((topology.actors ?? []).map((a) => [a.id, a]));
  const places = new Map((topology.places ?? []).map((p) => [p.id, p]));
  const narratives = new Map((topology.narratives ?? []).map((n) => [n.id, n]));
  const offices = new Map((topology.offices ?? []).map((o) => [o.id, o]));
  // An office is a kind with an address — `?office=` opens one — so it is in
  // the list `resolve()` and `record()` walk. A tenure is not addressed on
  // its own and is here for the same reason a relation is not: it is read on
  // the card of the office it is a turn at.
  const kinds = [['event', events], ['edge', edges], ['source', sourceMap], ['actor', actors], ['place', places], ['office', offices], ['narrative', narratives]];

  const aliases = new Map();
  for (const [kind, map] of kinds) {
    for (const record of map.values()) {
      for (const alias of record.aliases ?? []) aliases.set(alias, { id: record.id, kind });
    }
  }

  // How many citations a record makes: read off the record, never counted
  // here. It used to be a pass over the citer rows the sources index carried,
  // and since H3b those rows are not in that index — one file per source in
  // the citer directory, fetched when a card actually needs the list (A7).
  // Both the spine and the topology write the number at build time under the
  // name `citesCount` (A8). Only events, actors and places carry it — they
  // are the three kinds a card prints it beside — and a tombstone carries
  // none, which is 0 either way: a retracted record cites nothing.
  //
  // Filled by `reindexRecords` below rather than here, because since I3 the
  // number may arrive after the atlas does: it is one of the attributes, and an
  // atlas built from the core reads 0 until the record's shard lands.
  const cites = new Map();
  function fillCites() {
    cites.clear();
    for (const [kind, map] of kinds) {
      for (const record of map.values()) {
        if (typeof record.citesCount === 'number') cites.set(`${kind}:${record.id}`, record.citesCount);
      }
    }
  }
  const citationCount = (kind, id) => cites.get(`${kind}:${id}`) ?? 0;

  // The other direction, one source at a time: which records cite this book.
  // Not in the atlas at load — 1,933 rows of which a reader looks at the ones
  // under one source — so the card asks for the file and draws it when it
  // arrives. `citersOf` is the synchronous half, for a caller that cannot
  // wait: the rows if they are in hand, null if they are not, and the empty
  // list without a request for a source nothing cites, which has no file
  // (deviation 217). Same cache discipline as loadGeometry: one request in
  // flight per source, and a rejection is not an answer.
  // `citers` may be seeded with rows already in hand — a test that has read
  // the directory off disk, and nothing else so far.
  const citers = new Map(seededCiters ?? []);
  const citersLoading = new Map();
  const citersOf = (id) => {
    if (citers.has(id)) return citers.get(id);
    return (sourceMap.get(id)?.citationCount ?? 0) === 0 ? [] : null;
  };
  function loadCiters(id) {
    const known = citersOf(id);
    if (known) return Promise.resolve(known);
    if (!citersLoading.has(id)) {
      const dir = manifest?.files?.citers;
      const pending = (dir
        ? fetchJson(`${dataRoot}${dir}/${encodeURIComponent(id)}.json`)
        : Promise.reject(new Error('the manifest names no citer directory')))
        .then((file) => {
          const rows = file.citations ?? [];
          citers.set(id, rows);
          return rows;
        })
        .catch((error) => {
          if (citersLoading.get(id) === pending) citersLoading.delete(id);
          throw error;
        });
      citersLoading.set(id, pending);
    }
    return citersLoading.get(id);
  }

  // --- the links' arguments, in bulk ---------------------------------------
  //
  // One `<details>` at a time is the right shape for a reader opening one
  // "Why" and the wrong one for anything that reads a path: `record('edge',
  // id)` per step (health review B, finding 18). The index shards the
  // explanations by period (explanations.js); this asks for the shards a set
  // of edges falls in — a handful of requests however long the path — and
  // answers with a map of the ones it was asked about.
  //
  // Same cache discipline as loadGeometry and the citers: one request in
  // flight per file, and a rejection is not an answer. `explanationOf` is the
  // synchronous half, for a caller that cannot wait: the text if it is in
  // hand, null if it is not. Nothing on the page is drawn out of this, so
  // nothing ever waits for it.
  const explanationShardList = manifest?.explanationShards ?? [];
  const explanations = new Map();
  const explanationFiles = new Map();
  const explanationOf = (id) => explanations.get(id) ?? null;
  const shardForEdge = (id) => {
    const edge = edges.get(id);
    const period = edge ? periodOfEdge(edge, events) : null;
    if (!period) return null;
    return explanationShardList.find((s) => s.from === period.from && s.to === period.to) ?? null;
  };
  function loadExplanationFile(file) {
    if (!explanationFiles.has(file)) {
      const pending = fetchJson(`${dataRoot}${file}`).then((shard) => {
        for (const [id, text] of Object.entries(shard.explanations ?? {})) explanations.set(id, text);
        return shard;
      }).catch((error) => {
        if (explanationFiles.get(file) === pending) explanationFiles.delete(file);
        throw error;
      });
      explanationFiles.set(file, pending);
    }
    return explanationFiles.get(file);
  }
  function loadExplanations(edgeIds) {
    const files = new Set();
    for (const id of edgeIds) {
      if (explanations.has(id)) continue;
      const shard = shardForEdge(id);
      if (shard) files.add(shard.file);
    }
    // A shard that will not load leaves its edges without a text rather than
    // taking the answer down with it: the caller gets what arrived, and the
    // card's own `record('edge', id)` is still there behind every "Why".
    return Promise.all([...files].map((file) => loadExplanationFile(file).catch(() => null)))
      .then(() => {
        const found = new Map();
        for (const id of edgeIds) if (explanations.has(id)) found.set(id, explanations.get(id));
        return found;
      });
  }

  const find = (id) => {
    for (const [kind, map] of kinds) if (map.has(id)) return { id, kind, record: map.get(id) };
    return null;
  };

  // Old URLs keep working: a former id (alias) or a merged record resolves
  // to the record that stands for it now. `via` lists the hops so the
  // panel can say "x was merged into y".
  function resolve(id) {
    const via = [];
    let current = aliases.has(id) ? aliases.get(id).id : id;
    if (current !== id) via.push({ id, reason: 'alias' });
    for (let hops = 0; hops < 20; hops += 1) {
      const found = find(current);
      if (!found) return null;
      if (found.record.status === 'merged' && found.record.supersededBy) {
        via.push({ id: current, reason: 'merged' });
        current = found.record.supersededBy;
        continue;
      }
      return { ...found, via };
    }
    return null;
  }

  const activeEvents = topology.events.filter((e) => e.status === 'active');
  let extent = null;
  for (const e of activeEvents) {
    const x = intervalExtent(e.when);
    const max = x.max ?? x.min;
    if (!extent) extent = { min: x.min, max };
    else {
      extent.min = Math.min(extent.min, x.min);
      extent.max = Math.max(extent.max, max);
    }
  }

  // The cache holds answers, and a rejection is not one. Keeping it would
  // make one dropped request on a train the answer for the rest of the
  // session: the card would say "Could not load the record text" and never
  // ask again, however many times the reader opened the record. So the entry
  // goes when the promise rejects, and the next attempt really is one.
  //
  // `?v=<revised>` since H3b: the day the record file was last written, off
  // the index the page is already holding. A record file is served under its
  // own name and has to be, because `entry.html?id=` is the address and a
  // hashed name would break it — so the query string is what tells a cache
  // that this is a different file from the one it kept. A record the index
  // has no `revised` for is asked for without one, which is what it was
  // before: the parameter is a hint to the cache and never part of the
  // address (ARCHITECTURE.md, "Index and manifest").
  // Since I3 `revised` is one of the attributes, so an atlas built from the
  // core waits for the record's own shard — one request, cached, never a
  // second — before it asks for the file. Without that a card opened in a
  // century that had not landed would fetch the record with no `?v=` at all and
  // could draw a stale copy for the rest of the session (index2 review, finding
  // 3). An atlas from the spine has no `beforeRecord` and is exactly what it
  // was: no promise between the click and the request.
  const byKind = new Map(kinds);
  const cache = new Map();
  function fetchRecord(kind, id) {
    const revised = byKind.get(kind)?.get(id)?.revised ?? null;
    const version = typeof revised === 'string' ? `?v=${encodeURIComponent(revised)}` : '';
    return fetchJson(`${dataRoot}${kind}s/${encodeURIComponent(id)}.json${version}`);
  }
  function record(kind, id) {
    const key = `${kind}/${id}`;
    if (!cache.has(key)) {
      const pending = (beforeRecord === null
        ? fetchRecord(kind, id)
        // A shard that will not load leaves the record without its `?v=` rather
        // than taking the card down with it: the same "a rejection is not an
        // answer" every deferred load here follows.
        : Promise.resolve(beforeRecord(kind, id)).catch(() => null).then(() => fetchRecord(kind, id))
      ).catch((error) => {
        // Only if it is still this attempt's: a later one may have replaced it.
        if (cache.get(key) === pending) cache.delete(key);
        throw error;
      });
      cache.set(key, pending);
    }
    return cache.get(key);
  }

  // The other direction of an event's `actors`: which events an actor
  // appears in, chronologically, with the role each time. Only active
  // events, and only actors that resolve — a dangling reference is the
  // validator's business, not the panel's.
  // The note beside the role travels with the row: it is on the line and not
  // on the actor, so "as prime minister" belongs to this appearance and to no
  // other. The spine carries it (M30a-3), so showing it costs no fetch.
  //
  // The role and the note are attributes since I3 and may arrive after the
  // atlas does, so the rows are built by `reindexRecords` and built again when
  // a shard lands: a row that kept the role it was given at load would say
  // "no role" for the rest of the session.
  const eventsByActor = new Map();
  function fillEventsByActor() {
    eventsByActor.clear();
    for (const event of activeEvents) {
      for (const { actor, role, note } of event.actors ?? []) {
        if (!actors.has(actor)) continue;
        if (!eventsByActor.has(actor)) eventsByActor.set(actor, []);
        eventsByActor.get(actor).push({ event, role, note: typeof note === 'string' ? note : null });
      }
    }
    for (const list of eventsByActor.values()) {
      list.sort((a, b) => intervalExtent(a.event.when).min - intervalExtent(b.event.when).min
        || (a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0));
    }
  }

  // --- relations between actors ------------------------------------------
  // An edge runs between events; a relation runs between actors, and it is
  // read from either end. One list per actor, each entry saying which way the
  // relation points from where you are standing, so the card can head a group
  // with "Regime of" or with "Regimes" from the same record.
  const activeRelations = (topology.relations ?? []).filter((r) => r.status === 'active');
  const relations = new Map(activeRelations.map((r) => [r.id, r]));
  const relationsByActor = new Map();
  const noteRelation = (actorId, entry) => {
    if (!actors.has(actorId)) return;
    if (!relationsByActor.has(actorId)) relationsByActor.set(actorId, []);
    relationsByActor.get(actorId).push(entry);
  };
  function fillRelationsByActor() {
    relationsByActor.clear();
    for (const relation of activeRelations) {
      noteRelation(relation.from, { relation, direction: 'out', other: relation.to });
      noteRelation(relation.to, { relation, direction: 'in', other: relation.from });
    }
    for (const list of relationsByActor.values()) {
      list.sort((a, b) => intervalExtent(a.relation.when).min - intervalExtent(b.relation.when).min
        || (a.relation.id < b.relation.id ? -1 : a.relation.id > b.relation.id ? 1 : 0));
    }
  }

  // --- offices and tenures ------------------------------------------------
  // An office belongs to an actor and is held by people one after another;
  // the tenures are the strip drawn under it. Grouped here rather than in a
  // card so that the office's own card, the actor's card and the office
  // strips on it all read one list. Sorted by start then id, so a strip
  // is drawn in the order it happened.
  const activeTenures = (topology.tenures ?? []).filter((t) => t.status === 'active');
  const tenures = new Map(activeTenures.map((t) => [t.id, t]));
  const tenuresByOffice = new Map();
  function fillTenuresByOffice() {
    tenuresByOffice.clear();
    for (const tenure of activeTenures) {
      if (!offices.has(tenure.office)) continue;
      if (!tenuresByOffice.has(tenure.office)) tenuresByOffice.set(tenure.office, []);
      tenuresByOffice.get(tenure.office).push(tenure);
    }
    for (const list of tenuresByOffice.values()) {
      list.sort((a, b) => intervalExtent(a.when).min - intervalExtent(b.when).min
        || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    }
  }

  // Which offices belong to an actor, in title order: the actor's card draws
  // one tenure strip per office and has no other way to find them, since an
  // office points at its actor and not the other way round.
  //
  // Sorted by the office's title, which is an attribute since I3: the order is
  // right once the shard has landed and is by id — the fallback title — before
  // that, which is why this is filled again when one does.
  const officesByActor = new Map();
  function fillOfficesByActor() {
    officesByActor.clear();
    for (const office of offices.values()) {
      if (office.status !== 'active' || !actors.has(office.of)) continue;
      if (!officesByActor.has(office.of)) officesByActor.set(office.of, []);
      officesByActor.get(office.of).push(office);
    }
    for (const list of officesByActor.values()) {
      list.sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
        || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    }
  }

  // --- events inside events ------------------------------------------------
  // The other direction of an event's `parent`: which events are inside this
  // one, in the order they happened. `parent` is a display fact and never an
  // argument (CLAUDE.md), so this is deliberately not in the adjacency —
  // consequences, ancestors, convergence and the horizon never see it.
  const childrenOf = new Map();
  function fillChildrenOf() {
    childrenOf.clear();
    for (const event of activeEvents) {
      const parent = typeof event.parent === 'string' ? event.parent : null;
      if (!parent || !events.has(parent)) continue;
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push(event.id);
    }
    for (const list of childrenOf.values()) {
      list.sort((a, b) => intervalExtent(events.get(a).when).min - intervalExtent(events.get(b).when).min
        || (a < b ? -1 : a > b ? 1 : 0));
    }
  }

  // --- narratives ---------------------------------------------------------
  // The other direction of a narrative's steps: which narratives pass through
  // a record, so an event's card and a link's argument can say what they are
  // part of. An event counts as walked when a step names it and when a step
  // names an edge that touches it — a narrative that crosses an event through
  // its links is passing through the event, whatever the step happens to name.
  //
  // The steps and the title are attributes since I3, so an atlas from the core
  // knows a narrative exists and nothing about where it goes until the shard
  // lands: "Part of" is empty rather than wrong, and this is filled again with
  // every shard.
  const activeNarratives = [];
  const narrativesByRef = new Map();
  const noteNarrative = (ref, narrative) => {
    if (!narrativesByRef.has(ref)) narrativesByRef.set(ref, []);
    if (!narrativesByRef.get(ref).includes(narrative)) narrativesByRef.get(ref).push(narrative);
  };
  function fillNarratives() {
    activeNarratives.length = 0;
    narrativesByRef.clear();
    activeNarratives.push(...[...narratives.values()].filter((n) => n.status === 'active')
      .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
    for (const narrative of activeNarratives) {
      for (const id of narrativeEventIds({ events, edges }, narrative)) noteNarrative(id, narrative);
      // And the ref itself, for every kind that is not an event: a link, and
      // since H7 an actor, a relation or a presence. "Part of" is drawn on the
      // card of whatever a walk names, and an actor whose card said nothing
      // about the narrative that walks it would be the atlas hiding its own
      // arguments from the record they are about.
      for (const step of narrative.steps ?? []) {
        if (typeof step?.ref === 'string' && !events.has(step.ref)) noteNarrative(step.ref, narrative);
      }
    }
  }

  // --- places ------------------------------------------------------------
  // An event points at a place and the place holds the point, so everything
  // that draws asks for the point here rather than reading a field off the
  // event: the coordinates have one home and cannot disagree with themselves.
  const placeOf = (event) => (event && typeof event.place === 'string' ? places.get(event.place) ?? null : null);
  const pointOf = (event) => placeOf(event)?.where ?? null;

  // The other direction: which events happened at a place, chronologically.
  // Only active events, and only places that resolve.
  const eventsByPlace = new Map();
  function fillEventsByPlace() {
    eventsByPlace.clear();
    for (const event of activeEvents) {
      if (!places.has(event.place)) continue;
      if (!eventsByPlace.has(event.place)) eventsByPlace.set(event.place, []);
      eventsByPlace.get(event.place).push(event);
    }
    for (const list of eventsByPlace.values()) {
      list.sort((a, b) => intervalExtent(a.when).min - intervalExtent(b.when).min
        || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    }
  }

  // Every join over the records, in one place and in one order. Called once at
  // assembly, and again by the core's loader whenever an attribute shard lands
  // or the LRU drops one: three of the joins are sorted or keyed by something
  // the shards carry — an actor line's role, an office's title, a narrative's
  // steps — and a list built before the shard arrived would be a list the
  // reader never sees corrected (docs/index2-plan.md, D4).
  //
  // It is the same discipline `indexPresences` follows for the presence file:
  // the collections are filled in place, never replaced, because a card or a
  // layer holds the Map itself.
  function reindexRecords() {
    fillCites();
    fillEventsByActor();
    fillRelationsByActor();
    fillTenuresByOffice();
    fillOfficesByActor();
    fillChildrenOf();
    fillNarratives();
    fillEventsByPlace();
  }
  reindexRecords();

  // --- territories -------------------------------------------------------
  // The presence metadata carries every presence without its coordinates, so
  // an actor's territory over time is a list the panel can draw without
  // fetching an outline. The outlines themselves are sharded by period and
  // fetched one shard at a time, by year: moving the band inside a period
  // costs nothing, and crossing into another one costs a single request that
  // is then cached.
  //
  // Since I1 the metadata is not in the spine either: it was 49.2 % of it on
  // the real data and nothing draws it until the territory layer does
  // (docs/index2-plan.md, D1). So the atlas answers emptily about territory
  // until `loadPresences()` lands — `presencesAt` gives [], the two indexes
  // are empty — exactly as `loadedGeometry` answers null until an outline
  // does, and the layer and the actor card ask for it the way the source card
  // asks for its citers.
  //
  // `presenceShards`, `presenceCoverage` and `territoryYear` are deliberately
  // NOT behind that load: they are read off the manifest, so the far end of
  // the window cannot move under the reader while a file is in flight.
  //
  // The three collections are filled in place rather than replaced: a card or
  // a layer holds `atlas.presencesByActor` itself, and swapping the Map would
  // leave it reading the empty one for ever.
  const byStart = (a, b) => intervalExtent(a.when).min - intervalExtent(b.when).min
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  let activePresences = [];
  let boundaries = [];
  const presences = new Map();
  const presencesByActor = new Map();
  const dependenciesOf = new Map();
  const standingIn = new Map();

  function indexPresences(list) {
    activePresences = (list ?? []).filter((p) => p.status === 'active');
    presences.clear();
    presencesByActor.clear();
    dependenciesOf.clear();
    standingIn.clear();
    for (const presence of activePresences) {
      presences.set(presence.id, presence);
      if (!presencesByActor.has(presence.actor)) presencesByActor.set(presence.actor, []);
      presencesByActor.get(presence.actor).push(presence);
      if (presence.dependencyOf) {
        if (!dependenciesOf.has(presence.dependencyOf)) dependenciesOf.set(presence.dependencyOf, []);
        dependenciesOf.get(presence.dependencyOf).push(presence);
      }
    }
    for (const each of presencesByActor.values()) each.sort(byStart);
    for (const each of dependenciesOf.values()) each.sort(byStart);
    boundaries = [...new Set(activePresences.flatMap((presence) => {
      const { min, max } = intervalExtent(presence.when);
      return max === null ? [min] : [min, max + 1];
    }))].sort((a, b) => a - b);
  }

  // A caller that already has them hands them over — the build has every
  // record in memory, and a test reads the file off disk — and then nothing
  // is ever fetched. A caller handing over a whole topology has them in it,
  // which is what `buildTopology`'s own output is and what the rules read;
  // the spine has not carried them since I1, so an atlas from the spine has
  // neither and asks for the file.
  const seeded = seededPresences ?? topology.presences ?? null;
  let havePresences = seeded !== null;
  if (havePresences) indexPresences(seeded);

  let presencesPending = null;
  // The synchronous half, for a render that cannot wait: whether the answers
  // above are the real ones yet. A layer needs it to tell "no territory" from
  // "no territory yet", the way `loadedGeometry` tells it for an outline.
  const presencesLoaded = () => havePresences;
  // Same cache discipline as loadGeometry and the citers: one request in
  // flight, and a rejection is not an answer. A manifest that names no
  // presence file has none to name — the build writes neither the file nor
  // the key for a dataset with no presences — so that is an empty answer and
  // not a failure.
  function loadPresences() {
    if (havePresences) return Promise.resolve([...presences.values()]);
    if (!presencesPending) {
      const file = manifest?.files?.presences;
      const pending = (file ? fetchJson(`${dataRoot}${file}`) : Promise.resolve({ presences: [] }))
        .then((loaded) => {
          indexPresences(presencesFromIndex(loaded));
          havePresences = true;
          return [...presences.values()];
        })
        .catch((error) => {
          if (presencesPending === pending) presencesPending = null;
          throw error;
        });
      presencesPending = pending;
    }
    return presencesPending;
  }

  const presenceShards = manifest.presenceShards ?? [];
  // The years the outlines actually cover. Past the far end there is nothing
  // to draw — CShapes stops in 2019 — and drawing nothing would say the world
  // had no borders, so the last shard's year is held instead and the
  // interface says which year it is showing. Everything that answers "who
  // held this ground" goes through the same clamp so the map, the actor card
  // and the band's marker cannot disagree.
  const presenceCoverage = presenceShards.length
    ? { from: presenceShards[0].from, to: presenceShards[presenceShards.length - 1].to }
    : null;
  const territoryYear = (year) => (year === null || presenceCoverage === null ? year : Math.min(year, presenceCoverage.to));
  const shardForYear = (year) => presenceShards.find((s) => year >= s.from && year <= s.to) ?? null;

  // Which of the eight hues an actor's territory is drawn in. Generated
  // offline by tools/build-palette.mjs from the borders themselves, so it is
  // a property of the map and not of the polity; null for an actor the
  // palette has not been rebuilt for, and for every dataset that has no
  // palette at all.
  const hues = new Map(Object.entries(palette?.actors ?? {}));
  const hueOfActor = (id) => (hues.has(id) ? hues.get(id) : null);

  const geometry = new Map();
  const geometryLoading = new Map();
  // Synchronous: what is already in hand, so a render never waits.
  const loadedGeometry = (file) => geometry.get(file) ?? null;
  function loadGeometry(file) {
    if (geometry.has(file)) return Promise.resolve(geometry.get(file));
    if (!geometryLoading.has(file)) {
      // As with a record: a shard that failed is not a shard that is loading,
      // and holding the rejection would leave the territories blank until the
      // page was reloaded.
      const pending = fetchJson(`${dataRoot}${file}`).then((collection) => {
        const byKey = new Map((collection.features ?? []).map((f) => [String(f.id), f.geometry]));
        geometry.set(file, byKey);
        return byKey;
      }).catch((error) => {
        if (geometryLoading.get(file) === pending) geometryLoading.delete(file);
        throw error;
      });
      geometryLoading.set(file, pending);
    }
    return geometryLoading.get(file);
  }

  // Who held territory in a given year. One presence per actor: two of an
  // actor's presences can share the year a border moved in, because a year
  // is the finest bound the model has, and the later one is the one to draw.
  function standingAt(year) {
    const chosen = new Map();
    for (const presence of activePresences) {
      const { min, max } = intervalExtent(presence.when);
      if (year < min || (max !== null && year > max)) continue;
      const standing = chosen.get(presence.actor);
      if (!standing || intervalExtent(standing.when).min < min) chosen.set(presence.actor, presence);
    }
    return [...chosen.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  // --- the interval index ------------------------------------------------
  //
  // That scan ran over every presence on every render — 710 of them, once per
  // tick of the timeline's band (health review B, finding 24). What changes
  // from one year to the next is not a presence but the *set* of them, and
  // the set can only change in a year some interval begins in or the year
  // after one ends in. Those years are the boundaries below; between two of
  // them every year has the same answer, so the answer is worked out once and
  // kept. A query is then a binary search over the boundaries.
  //
  // It is an index over the intervals and not a bucket per year on purpose:
  // a presence may have no end at all, and a year domain with an open end has
  // no last bucket.
  //
  // `boundaries` and `standingIn` are built by `indexPresences` above, when
  // the file lands: before that there are no intervals to index, and the
  // binary search below answers −1 for every year, which is [].

  // The last boundary at or below the year, or −1 for a year before the first
  // border on the map.
  function segmentOf(year) {
    let low = 0;
    let high = boundaries.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (boundaries[mid] <= year) {
        found = mid;
        low = mid + 1;
      } else high = mid - 1;
    }
    return found;
  }

  function presencesAt(requested) {
    const year = territoryYear(requested);
    // A caller with no window at all has asked about no year, and there are
    // no borders in no year. The scan this replaced answered the same way.
    const segment = year === null ? -1 : segmentOf(year);
    if (segment < 0) return [];
    if (!standingIn.has(segment)) standingIn.set(segment, standingAt(boundaries[segment]));
    // A copy, because the caller before this had one of its own to sort.
    return [...standingIn.get(segment)];
  }

  // --- the lane polygons, on demand ---------------------------------------
  //
  // 221 KB that `index.html` used to fetch before it drew anything, to answer
  // one question — is a placeless event's region inside the viewport — which
  // `regionBounds` reduces to four numbers per region. Since I1 those four
  // numbers are in the manifest and the file is not at first paint at all
  // (docs/index2-plan.md, D2).
  //
  // The polygons themselves are still the only thing that can draw a lane as
  // a shape, which is what M30b-2's wash over a `regional` event is, so they
  // stay reachable: one request, cached, a rejection dropped, asked for by
  // the wash when a large event is actually in the window (index2 review,
  // finding 6). `regionShapes` is the synchronous half — the collection if it
  // is in hand, null if it is not.
  let shapes = regionShapes ?? null;
  let shapesPending = null;
  function loadRegionPolygons() {
    if (shapes) return Promise.resolve(shapes);
    if (!shapesPending) {
      const pending = fetchJson(`${dataRoot}geo/regions.json`).then((collection) => {
        shapes = collection;
        return collection;
      }).catch((error) => {
        if (shapesPending === pending) shapesPending = null;
        throw error;
      });
      shapesPending = pending;
    }
    return shapesPending;
  }

  return {
    manifest,
    regions: [...manifest.regions].sort((a, b) => a.order - b.order),
    // One box per region, for the events with no place: four numbers each,
    // read off the manifest since I1 rather than derived at load from 221 KB
    // of polygons (util/geo.js, build-index.mjs). Empty for a dataset whose
    // manifest names none, which is what a dataset with no polygons already
    // got — those events then stay out of a box rather than taking the atlas
    // down with them.
    regionBoxes: regionBoxes ?? new Map(),
    // And the polygons themselves, for the wash a regional event is drawn as
    // (large.js, map/layers/regions.js). Null until something asks.
    get regionShapes() { return shapes; },
    loadRegionPolygons,
    presences,
    presencesLoaded,
    loadPresences,
    presencesByActor,
    dependenciesOf,
    presenceShards,
    presenceCoverage,
    hueOfActor,
    territoryYear,
    shardForYear,
    loadedGeometry,
    loadGeometry,
    presencesAt,
    events,
    edges,
    sources: sourceMap,
    citersOf,
    loadCiters,
    citationCount,
    explanationShards: explanationShardList,
    explanationOf,
    loadExplanations,
    actors,
    places,
    eventsByPlace,
    placeOf,
    pointOf,
    eventsByActor,
    relations,
    relationsByActor,
    offices,
    officesByActor,
    tenures,
    tenuresByOffice,
    childrenOf,
    narratives,
    activeNarratives,
    narrativesByRef,
    aliases,
    adjacency: buildAdjacency(topology.events, topology.edges),
    activeEvents,
    extent,
    land,
    resolve,
    record,
    // Whether a record's own attributes are in hand — true always on an atlas
    // from the spine, and what tells "no title" from "no title yet" on one from
    // the core. A card, an entry page and a search result row draw nothing
    // until it is true; the three views draw the mark, the bar and the node
    // without waiting (index2 review, finding 21).
    attributesLoaded,
    // The joins over the records again, for the loader that fills them in when
    // a shard lands. Nothing but `createAtlasFromCore` calls it.
    reindexRecords,
  };
}

// ─── The whole-corpus projection ────────────────────────────────────────────
//
// The same atlas out of the projection `buildSpine` takes of the topology
// (ARCHITECTURE.md, "The core, the attribute shards, the search shard and the
// citers"). Nothing above changes: it is expanded back into the shape
// createAtlas reads and handed the same sources index, so `graph.js`,
// `horizon.js`, `lens.js` and the views cannot tell which file the atlas was
// built from. That is the whole point — H3b and I4 moved the pages over one at
// a time, and a page that behaved differently would have made either migration
// a rewrite instead of a switch.
//
// **No page reads this since I4b and no file holds it.** It stays because the
// build assembles the prerendered pages out of it, which is what makes their
// byte-identity a check on the whole projection rather than on half of it
// (i4-brief, A5), and because `CORE_COLUMNS ∪ ATTRIBUTE_COLUMNS =
// SPINE_COLUMNS` is asserted against it.
//
// The spine differs from the topology in exactly three ways: an edge is a
// tuple, `regionMethod` and `presenceType` are gone because nothing draws
// them, and a record says how many citations it makes on itself.
//
// Since I2 every kind is that tuple: a positional row over the file's own id
// table, with the closed vocabularies as integers. `edgeFromSpine` folded into
// the one decoder with the other eight — the "an object when the id is not
// derived" case it existed for is now the row's last slot, which is `null` on
// every edge whose id is `from--to--type` (docs/index2-plan.md, D3).

function topologyFromSpine(spine) {
  // No `presences`: they are their own file since I1 and reach the atlas
  // through `loadPresences()`, not through the graph file.
  return decodeSpineFile(spine, SPINE_KINDS);
}

// The same decoder over the file the presences moved to in I1, which carries
// an id table and a vocabulary of its own because it is fetched on its own.
export function presencesFromIndex(file) {
  return decodeSpineFile(file, PRESENCE_KINDS).presences;
}

// Sources stay where they are: they are not in the spine, and `atlas.sources`
// is the sources index exactly as it is today (A3). `presences` likewise
// since I1, and it is optional: a caller with the list already in hand — the
// build, a test reading the file off disk — passes it and nothing is fetched.
export function createAtlasFromSpine({ spine, ...rest }) {
  return createAtlas({ ...rest, topology: topologyFromSpine(spine) });
}

// The spine expanded back into the shape a topology reader takes: the
// dashboard and the narratives page want the lists, not an atlas.
export { topologyFromSpine as expandSpine };

// ─── The core and the attribute shards (I3) ────────────────────────────────
//
// The same atlas out of the two files the spine splits into: the **core**,
// which every page will load whole because the whole-graph guarantee and every
// mark, bar and lane depend on it, and the **attribute shards**, one per
// century, fetched for the window and never waited for
// (docs/index2-plan.md, D4).
//
// Nothing on the site calls any of this yet. I3 emits the files and measures
// them; I4 moves the pages over, one per commit, and only if the bytes say the
// split pays (D5). What is here is the loader those commits will use, held to
// one assertion by `tests/core-loader.test.mjs`: the core plus every shard is
// the atlas the spine builds, record for record.
//
// A record with no shard in hand reads as the core plus the fallbacks — a
// title that is the id, `citesCount` 0, `names` [], and `when` the core's own
// astronomical bounds. **The three views may draw that and a card may not**:
// `attributesLoaded(id)` is what decides, and a card, an entry page or a search
// row shows the "loading" line the source card shows for its citers until it is
// true (index2 review, finding 21).

// Four shards nothing is holding on to. A session that scrubs across six
// centuries would otherwise end with the whole corpus in memory, which is the
// heap ceiling the byte budget rests on (index2-plan, section 6 risk 3) — and
// four rather than one because the pictures are windowed and a window straddles
// two centuries often and three sometimes.
//
// It counts **unpinned** shards only. A shard an open card, an entry page or a
// lens needs is pinned while it is on screen and is never evicted: those
// readers are per-entity and not windowed, so an actor whose events span five
// centuries would otherwise be drawn incomplete for ever — the fifth shard
// evicting the first, the redraw asking for the first again (index2 review,
// finding 9; h3a-brief, A4).
export const ATTRIBUTE_SHARD_CAP = 4;

// One attribute shard's rows into the records they are about, in place: a card,
// a lens or a layer holds the record object itself, and replacing it would
// leave every one of them reading the version it was handed
// (spine.js, `applyAttributes`). `byKey` is `<kind>:<id>` over the core's own
// records, which is the only thing the two callers below share.
function fillFromShard(byKey, file) {
  const partials = decodeSpineFile(file, SPINE_KINDS, ATTRIBUTE_COLUMNS);
  for (const kind of SPINE_KINDS) {
    for (const partial of partials[`${kind}s`] ?? []) {
      const record = byKey.get(`${kind}:${partial.id}`);
      if (record) applyAttributes(record, partial);
    }
  }
}

// `expandSpine` for the two files the spine split into. The dashboard wants the
// lists and not an atlas — nothing on it is drawn on a map, every rule that runs
// in the browser runs against these arrays, and `atlas.relations` and
// `atlas.tenures` are the *active* ones, which is not the universe a reviewer
// is reading. So it decodes the core here and fills it from the shards as they
// land (i4-brief, A2 and A6).
//
// Until a shard lands its records read as the core plus the fallbacks, exactly
// as they do in an atlas; there is no cap and nothing is evicted, because a
// page that holds the whole corpus by definition has nothing to choose between.
export function expandCore(core) {
  const topology = decodeSpineFile(core, SPINE_KINDS, CORE_COLUMNS);
  const eventsById = new Map(topology.events.map((e) => [e.id, e]));
  const byKey = new Map();
  // Which shard each record's attributes are in, by the one table the build
  // files them with (index2-plan, A8). The core carries every field that table
  // reads, which is what lets a caller say what to fetch before a single shard
  // has landed — `narratives.html` asks for the ones its walks cross and for
  // nothing else.
  const shardOfId = new Map();
  for (const kind of SPINE_KINDS) {
    for (const record of topology[`${kind}s`] ?? []) {
      byKey.set(`${kind}:${record.id}`, record);
      fillFallbacks(record, boundsOf(record));
      if (!shardOfId.has(record.id)) {
        shardOfId.set(record.id, attributeShardKey(attributePeriod(kind, record, eventsById)));
      }
    }
  }
  return {
    topology,
    fill: (file) => fillFromShard(byKey, file),
    shardKeyOf: (id) => shardOfId.get(id) ?? null,
  };
}

export function createAtlasFromCore({ core, attributes = [], manifest, ...rest }) {
  const { dataRoot = 'data/', fetchJson = defaultFetchJson } = rest;
  const topology = decodeSpineFile(core, SPINE_KINDS, CORE_COLUMNS);
  const eventsById = new Map(topology.events.map((e) => [e.id, e]));

  // What the core said about each record's dates, kept beside the atlas so that
  // dropping a shard cannot lose them: two numbers a record, against the whole
  // of `when`, which is what the cap exists to stop holding.
  const bounds = new Map();
  const byKey = new Map();
  const shardOfRecord = new Map();
  const shardOfId = new Map();
  const recordsByShard = new Map();
  for (const kind of SPINE_KINDS) {
    for (const record of topology[`${kind}s`] ?? []) {
      const key = `${kind}:${record.id}`;
      bounds.set(key, boundsOf(record));
      byKey.set(key, record);
      fillFallbacks(record, bounds.get(key));
      // Which shard the record's attributes are in, by the same table the build
      // files them with — an event by the year it begins in, an edge by the
      // year its cause begins in, a place in the one shard of places
      // (index2-plan, A8). The core carries every field that table reads, which
      // is what lets the loader answer before a single shard has landed.
      const shard = attributeShardKey(attributePeriod(kind, record, eventsById));
      shardOfRecord.set(key, shard);
      if (!shardOfId.has(record.id)) shardOfId.set(record.id, shard);
      if (!recordsByShard.has(shard)) recordsByShard.set(shard, []);
      recordsByShard.get(shard).push(record);
    }
  }

  const shards = manifest?.attributeShards ?? [];
  const shardByKey = new Map(shards.map((shard) => [shard.key, shard]));
  const loaded = new Map();
  const order = [];
  const pins = new Map();
  const inFlight = new Map();

  // How many times the set of shards in hand has changed, arrivals and
  // evictions alike. It is what the three views and the panel put in their
  // render keys (render-key.js, I4a): a shard landing is a change to the
  // picture that the state cannot see, so a key that could not see it would
  // skip exactly the redraw that puts the titles on.
  //
  // A *count* of the shards held would not do, which is the one place this
  // differs from the map's `shardsIn` for territories: `applyShard` loads and
  // then evicts, so a fifth shard arriving where four are held leaves the count
  // at four while every record in the dropped one has just lost its title.
  // Counting the changes cannot say four twice about two different atlases.
  let arrived = 0;
  const keyOf = (shard) => (typeof shard === 'string' ? shard : shard?.key ?? null);
  const attributesLoaded = (id) => loaded.has(shardOfId.get(id) ?? null);
  const touch = (key) => {
    const at = order.indexOf(key);
    if (at !== -1) order.splice(at, 1);
    order.push(key);
  };

  function evictIfOver() {
    let dropped = false;
    for (const key of [...order]) {
      if (order.filter((k) => (pins.get(k) ?? 0) === 0).length <= ATTRIBUTE_SHARD_CAP) break;
      if ((pins.get(key) ?? 0) > 0) continue;
      for (const record of recordsByShard.get(key) ?? []) {
        stripAttributes(record, bounds.get(`${record.kind ?? 'edge'}:${record.id}`));
      }
      loaded.delete(key);
      order.splice(order.indexOf(key), 1);
      arrived += 1;
      dropped = true;
    }
    return dropped;
  }

  // One shard's rows into the records they are about. The joins are built again
  // after it, because three of them are sorted or keyed by something a shard
  // carries (createAtlas's `reindexRecords`).
  function applyShard(key, file) {
    fillFromShard(byKey, file);
    loaded.set(key, file);
    touch(key);
    arrived += 1;
    evictIfOver();
    atlas.reindexRecords();
  }

  // Same cache discipline as `loadGeometry`, the citers and the explanations:
  // one request in flight per shard, and a rejection is dropped rather than
  // kept as the answer, so the next ask really is a new attempt.
  function loadAttributes(shard) {
    const key = keyOf(shard);
    const entry = shardByKey.get(key);
    if (loaded.has(key)) {
      touch(key);
      return Promise.resolve(loaded.get(key));
    }
    if (!entry) return Promise.resolve(null);
    if (!inFlight.has(key)) {
      const pending = fetchJson(`${dataRoot}${entry.file}`)
        .then((file) => {
          inFlight.delete(key);
          applyShard(key, file);
          return file;
        })
        .catch((error) => {
          if (inFlight.get(key) === pending) inFlight.delete(key);
          throw error;
        });
      inFlight.set(key, pending);
    }
    return inFlight.get(key);
  }

  // The two shards that answer no year — the places, and the records whose
  // interval is null or will not parse — are needed whatever the window is, so
  // they come with the first century asked for.
  const always = shards.filter((shard) => shard.from === null);
  const centuryFor = (year) => shards.filter((shard) => shard.from !== null && year >= shard.from && year <= shard.to);
  const attributesFor = (year) => (year === null || year === undefined ? [...always]
    : [...centuryFor(year), ...always]);
  const attributeShardsIn = (window) => {
    if (!window) return [...always];
    const from = window.from ?? window.min ?? null;
    const to = window.to ?? window.max ?? from;
    if (from === null) return [...always];
    return [...shards.filter((shard) => shard.from !== null && shard.from <= to && shard.to >= from), ...always];
  };

  // A shard an open card, an entry page or a lens needs, held outside the cap
  // until whatever needed it says so: the release is the return value, so a
  // caller that forgets to release is a caller that never got the pin.
  function pinAttributes(wanted) {
    const keys = (Array.isArray(wanted) ? wanted : [wanted]).map(keyOf).filter((key) => key !== null);
    for (const key of keys) pins.set(key, (pins.get(key) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      for (const key of keys) {
        const held = (pins.get(key) ?? 0) - 1;
        if (held > 0) pins.set(key, held);
        else pins.delete(key);
      }
      if (evictIfOver()) atlas.reindexRecords();
    };
  }

  const atlas = createAtlas({
    ...rest,
    manifest,
    topology,
    attributesLoaded,
    // What `record()` waits for: the shard that carries this record's
    // `revised`, so the file is asked for with the `?v=` the index says and
    // never without one (index2 review, finding 3).
    beforeRecord: (kind, id) => loadAttributes(shardOfRecord.get(`${kind}:${id}`) ?? null),
  });
  // Which shards a set of records' attributes are filed in, deduplicated and in
  // the manifest's own order. A card, an entry page and a lens are per-entity
  // and not windowed — an actor's events may span five centuries — so what they
  // ask for and pin is this and not a window (index2 review, finding 9).
  const attributeShardsOf = (ids) => {
    const wanted = new Set();
    for (const id of ids) {
      const key = shardOfId.get(id);
      if (key !== undefined) wanted.add(key);
    }
    return shards.filter((shard) => wanted.has(shard.key));
  };

  Object.assign(atlas, {
    attributeShards: shards,
    attributesFor,
    attributeShardsIn,
    attributeShardsOf,
    loadAttributes,
    pinAttributes,
    // Which shards are in hand, for a test and for the panel's key in I4.
    loadedAttributeShards: () => [...order],
    // And how many times that set has changed, for the render keys (I4a).
    attributeShardsArrived: () => arrived,
  });
  // A caller that already has shards in hand — the build, a test reading them
  // off disk — hands them over as `{ key, file }` and nothing is fetched. They
  // are pinned: a caller that passed a shard did not ask for it to be dropped
  // again, and this is how "the core plus every shard" is asserted.
  for (const { key, file } of attributes) {
    applyShard(key, file);
    pins.set(key, (pins.get(key) ?? 0) + 1);
  }
  return atlas;
}

// The core is named by the manifest under a content hash and served
// `immutable`, exactly as the spine is, and the manifest itself is read
// `no-store` every time: same discipline, same cache, one file over.
const coreCache = new Map();
export async function loadCore({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const manifest = assertGeneration(await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' }));
  const url = `${dataRoot}${manifest.files.core}`;
  if (!coreCache.has(url)) {
    const pending = fetchJson(url).catch((error) => {
      if (coreCache.get(url) === pending) coreCache.delete(url);
      throw error;
    });
    coreCache.set(url, pending);
  }
  return { manifest, core: await coreCache.get(url) };
}

// The sources index alone: the manifest names it, and it carries every
// source with its citers and their count. The bibliography page needs
// nothing else — not the topology, not the coastlines — and this is why the
// counts are in the index rather than computed from records at render.
export async function loadSources({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const manifest = assertGeneration(await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' }));
  const index = await fetchJson(`${dataRoot}${manifest.files.sources}`);
  return { manifest, sources: index.sources ?? [] };
}

// The narratives and the records they walk. narratives.html cannot do what
// the bibliography does and read one small index: a narrative's period is the
// years of the events its steps arrive at, and a step may name a link rather
// than an event, so both are needed. Since I4b that is the core, which carries
// every edge's ends and every event's year bounds, plus **the shards the walks
// cross** — the titles the cards print and the narratives' own summaries are
// attributes and are in no core row (i4-brief, section 1.5).
//
// Which is a handful of shards and never the corpus: an account is a walk
// through a period, and its steps are in the centuries that period covers. And
// nothing that is only drawn is fetched — no coastlines, no territories, no
// palette, and no sources index either, since this page lists no books.
//
// It is awaited rather than drawn behind, unlike the atlas: this is one list
// written once and the cards are the titles, so there is no picture to put on
// screen first (index2 review, finding 21 — a card draws out of a shard that
// has landed or it says it is loading).
export async function loadNarratives({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const { manifest, core } = await loadCore({ dataRoot, fetchJson });
  const { topology, fill, shardKeyOf } = expandCore(core);
  const events = new Map(topology.events.map((e) => [e.id, e]));
  const edges = new Map(topology.edges.map((e) => [e.id, e]));

  // Every narrative, and every record its steps reach — a step naming a link
  // is at the far end of it, which is the event `periodOf` reads (list.js).
  const wanted = new Set();
  for (const narrative of topology.narratives) {
    wanted.add(shardKeyOf(narrative.id));
    for (const step of narrative.steps ?? []) {
      wanted.add(shardKeyOf(step.ref));
      const edge = edges.get(step.ref);
      if (edge) wanted.add(shardKeyOf(edge.to));
    }
  }
  const shards = (manifest.attributeShards ?? []).filter((shard) => wanted.has(shard.key));
  await Promise.all(shards.map((shard) => fetchJson(`${dataRoot}${shard.file}`).then(fill)));

  return { manifest, narratives: topology.narratives, events, edges };
}

// The search box's whole index, folded at build time rather than on every
// page load (h3a-brief, A9). Not part of the atlas: it is fetched beside one
// and never waited for, because nothing is drawn out of it and a reader has
// not typed three letters by the time it lands.
export async function loadSearchShard({ dataRoot = 'data/', manifest, fetchJson = defaultFetchJson }) {
  const index = await fetchJson(`${dataRoot}${manifest.files.search}`);
  return index.entries ?? [];
}

// landFile overrides the manifest's land list; the fixture manifest has
// none, and the site still wants coastlines under the synthetic marks.
// `false` loads no coastlines at all: the contribution form needs the
// records and nothing that is only drawn.
//
// The graph comes from the **core** and from nowhere else since I4b, and what
// the core does not carry — the titles, the roles, the names, the counts —
// arrives behind it a century at a time and is never waited for
// (docs/index2-plan.md, D4). The `from` flag that chose between the core and
// the spine existed only while the pages moved over one at a time, as H3b's
// did before it, and it went with the file it named — the way `regions: false`
// went with the polygons in I1, and for the same reason: there is nothing left
// for either of them to turn off.
export async function loadAtlas({
  dataRoot = 'data/', landFile = null, fetchJson = defaultFetchJson,
} = {}) {
  const manifest = assertGeneration(await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' }));
  const [core, sourcesIndex] = await Promise.all([
    fetchJson(`${dataRoot}${manifest.files.core}`),
    fetchJson(`${dataRoot}${manifest.files.sources}`),
  ]);
  const landPath = landFile === false ? null : landFile ?? (manifest.land?.[0] ? `${dataRoot}${manifest.land[0].file}` : null);
  const land = landPath ? await fetchJson(landPath) : null;
  // The palette is tiny — one number per actor — and the map wants it on the
  // first frame it draws territories in, so it comes with the core rather
  // than with the shard whose outlines it colours.
  const palette = manifest.palette ? await fetchJson(`${dataRoot}${manifest.palette}`) : null;
  // The box of each region, for the events with no place: a placeless event
  // answers "am I in view" with its region, so the boxes have to be in hand
  // before the first frame. Until I1 that meant fetching 221 KB of polygons
  // and reducing them to four numbers each on every page load; the build has
  // the polygons in hand for `deriveRegion` and writes the boxes into the
  // manifest instead (docs/index2-plan.md, D2). A manifest with none gives an
  // empty Map, which is what a dataset with no polygons already gave.
  //
  // The polygons themselves are `atlas.loadRegionPolygons()` now, fetched by
  // the wash a `regional` event is drawn as and by nothing at first paint.
  const pieces = {
    manifest,
    sources: sourcesIndex.sources,
    land,
    palette,
    regionBoxes: new Map(Object.entries(manifest.regionBoxes ?? {})),
    dataRoot,
    fetchJson,
  };
  return createAtlasFromCore({ ...pieces, core });
}

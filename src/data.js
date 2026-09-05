// Reads the manifest, loads the spine whole, fetches record text on demand,
// resolves aliases and supersededBy, builds adjacency — of events to events
// through edges, and of actors to the events they appear in. Knows nothing
// about how things are drawn.
//
// The spine is always loaded whole because consequences, ancestors and
// convergence need the whole graph; a window would make convergence return
// a subset and present it as complete (ARCHITECTURE.md).
//
// The spine is the only graph file there is since H3c. `createAtlas` below
// assembles the atlas out of the lists the spine expands into — the shape
// `buildTopology` builds in memory and the index used to write out whole —
// and `createAtlasFromSpine` is the expansion in front of it.

import { buildAdjacency } from './graph.js';
import { narrativeEventIds } from './narrative.js';
import { extent as intervalExtent } from './util/dates.js';
import { regionBounds } from './util/geo.js';
import { edgeId } from './vocab.js';

async function defaultFetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

// Pure assembly from already-loaded pieces; loadAtlas() does the fetching.
export function createAtlas({
  manifest, topology, sources, land = null, palette = null, regionBoxes = null,
  dataRoot = 'data/', fetchJson = defaultFetchJson, citers: seededCiters = null,
}) {
  const events = new Map(topology.events.map((e) => [e.id, e]));
  const edges = new Map(topology.edges.map((e) => [e.id, e]));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const actors = new Map((topology.actors ?? []).map((a) => [a.id, a]));
  const places = new Map((topology.places ?? []).map((p) => [p.id, p]));
  const narratives = new Map((topology.narratives ?? []).map((n) => [n.id, n]));
  const kinds = [['event', events], ['edge', edges], ['source', sourceMap], ['actor', actors], ['place', places], ['narrative', narratives]];

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
  const cites = new Map();
  for (const [kind, map] of kinds) {
    for (const record of map.values()) {
      if (typeof record.citesCount === 'number') cites.set(`${kind}:${record.id}`, record.citesCount);
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
  const byKind = new Map(kinds);
  const cache = new Map();
  function record(kind, id) {
    const key = `${kind}/${id}`;
    if (!cache.has(key)) {
      const revised = byKind.get(kind)?.get(id)?.revised ?? null;
      const version = typeof revised === 'string' ? `?v=${encodeURIComponent(revised)}` : '';
      const pending = fetchJson(`${dataRoot}${kind}s/${encodeURIComponent(id)}.json${version}`).catch((error) => {
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
  const eventsByActor = new Map();
  for (const event of activeEvents) {
    for (const { actor, role } of event.actors ?? []) {
      if (!actors.has(actor)) continue;
      if (!eventsByActor.has(actor)) eventsByActor.set(actor, []);
      eventsByActor.get(actor).push({ event, role });
    }
  }
  for (const list of eventsByActor.values()) {
    list.sort((a, b) => intervalExtent(a.event.when).min - intervalExtent(b.event.when).min
      || (a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0));
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
  for (const relation of activeRelations) {
    noteRelation(relation.from, { relation, direction: 'out', other: relation.to });
    noteRelation(relation.to, { relation, direction: 'in', other: relation.from });
  }
  for (const list of relationsByActor.values()) {
    list.sort((a, b) => intervalExtent(a.relation.when).min - intervalExtent(b.relation.when).min
      || (a.relation.id < b.relation.id ? -1 : a.relation.id > b.relation.id ? 1 : 0));
  }

  // --- narratives ---------------------------------------------------------
  // The other direction of a narrative's steps: which narratives pass through
  // a record, so an event's card and a link's argument can say what they are
  // part of. An event counts as walked when a step names it and when a step
  // names an edge that touches it — a narrative that crosses an event through
  // its links is passing through the event, whatever the step happens to name.
  const activeNarratives = [...narratives.values()].filter((n) => n.status === 'active')
    .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const narrativesByRef = new Map();
  const noteNarrative = (ref, narrative) => {
    if (!narrativesByRef.has(ref)) narrativesByRef.set(ref, []);
    if (!narrativesByRef.get(ref).includes(narrative)) narrativesByRef.get(ref).push(narrative);
  };
  for (const narrative of activeNarratives) {
    for (const id of narrativeEventIds({ events, edges }, narrative)) noteNarrative(id, narrative);
    for (const step of narrative.steps ?? []) {
      if (edges.has(step.ref)) noteNarrative(step.ref, narrative);
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
  for (const event of activeEvents) {
    if (!places.has(event.place)) continue;
    if (!eventsByPlace.has(event.place)) eventsByPlace.set(event.place, []);
    eventsByPlace.get(event.place).push(event);
  }
  for (const list of eventsByPlace.values()) {
    list.sort((a, b) => intervalExtent(a.when).min - intervalExtent(b.when).min
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  // --- territories -------------------------------------------------------
  // The topology carries every presence without its coordinates, so an
  // actor's territory over time is a list the panel can draw at once. The
  // outlines themselves are sharded by period and fetched one shard at a
  // time, by year: moving the band inside a period costs nothing, and
  // crossing into another one costs a single request that is then cached.
  const activePresences = (topology.presences ?? []).filter((p) => p.status === 'active');
  const presences = new Map(activePresences.map((p) => [p.id, p]));
  const presencesByActor = new Map();
  const dependenciesOf = new Map();
  for (const presence of activePresences) {
    if (!presencesByActor.has(presence.actor)) presencesByActor.set(presence.actor, []);
    presencesByActor.get(presence.actor).push(presence);
    if (presence.dependencyOf) {
      if (!dependenciesOf.has(presence.dependencyOf)) dependenciesOf.set(presence.dependencyOf, []);
      dependenciesOf.get(presence.dependencyOf).push(presence);
    }
  }
  const byStart = (a, b) => intervalExtent(a.when).min - intervalExtent(b.when).min
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  for (const list of presencesByActor.values()) list.sort(byStart);
  for (const list of dependenciesOf.values()) list.sort(byStart);

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
  function presencesAt(requested) {
    const year = territoryYear(requested);
    const chosen = new Map();
    for (const presence of activePresences) {
      const { min, max } = intervalExtent(presence.when);
      if (year < min || (max !== null && year > max)) continue;
      const standing = chosen.get(presence.actor);
      if (!standing || intervalExtent(standing.when).min < min) chosen.set(presence.actor, presence);
    }
    return [...chosen.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  return {
    manifest,
    regions: [...manifest.regions].sort((a, b) => a.order - b.order),
    // One box per region, for the events with no place: derived from
    // `data/geo/regions.json` at load and never from the index (util/geo.js).
    // Empty when the file did not arrive, which puts those events back where
    // they were rather than taking the atlas down with it.
    regionBoxes: regionBoxes ?? new Map(),
    presences,
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
    actors,
    places,
    eventsByPlace,
    placeOf,
    pointOf,
    eventsByActor,
    relations,
    relationsByActor,
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
  };
}

// ─── The spine ─────────────────────────────────────────────────────────────
//
// The same atlas out of the projection the index emits beside the topology
// (ARCHITECTURE.md, "The spine, the search shard and the citers"). Nothing
// above changes: the spine is expanded back into the shape createAtlas reads
// and hands it the same sources index, so `graph.js`, `horizon.js`,
// `lens.js` and the views cannot tell which file the atlas was built from.
// That is the whole point — H3b moves the pages over one at a time, and a
// page that behaved differently on the spine would make that migration a
// rewrite instead of a switch.
//
// The spine differs from the topology in exactly three ways: an edge is a
// tuple, `regionMethod` and `presenceType` are gone because nothing draws
// them, and a record says how many citations it makes on itself.

// Six slots when the id is `from--to--type` and the edge carries neither an
// alias nor a merge hop; the whole object when it is not, because those two
// feed the alias map and `resolve()`'s merge hop and cannot be said in six
// slots. The loader takes either (h3a-brief, A2). The sixth is `revised`,
// which is what the edge's own file is asked for with.
function edgeFromSpine(entry) {
  if (!Array.isArray(entry)) return { ...entry, id: entry.id ?? edgeId(entry) };
  const [from, to, type, confidence, status, revised = null] = entry;
  return {
    id: edgeId({ from, to, type }), from, to, type, confidence, status, revised,
    supersededBy: null, aliases: [],
  };
}

function topologyFromSpine(spine) {
  return {
    events: spine.events ?? [],
    edges: (spine.edges ?? []).map(edgeFromSpine),
    actors: spine.actors ?? [],
    places: spine.places ?? [],
    presences: spine.presences ?? [],
    relations: spine.relations ?? [],
    narratives: spine.narratives ?? [],
  };
}

// Sources stay where they are: they are not in the spine, and `atlas.sources`
// is the sources index exactly as it is today (A3).
export function createAtlasFromSpine({ spine, ...rest }) {
  return createAtlas({ ...rest, topology: topologyFromSpine(spine) });
}

// The spine expanded back into the shape a topology reader takes: the
// dashboard and the narratives page want the lists, not an atlas.
export { topologyFromSpine as expandSpine };

// The spine is named by the manifest under a content hash and served
// `immutable`, so it is fetched once and kept — while the manifest itself is
// read `no-store` every time, which is how a new build is noticed at all.
// Same discipline as loadGeometry: one request in flight per file, and a
// rejection is not an answer, so the entry goes when the promise rejects and
// the next call really is a new attempt rather than a cached failure.
const spineCache = new Map();
export async function loadSpine({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const manifest = await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' });
  const url = `${dataRoot}${manifest.files.spine}`;
  if (!spineCache.has(url)) {
    const pending = fetchJson(url).catch((error) => {
      // Only if it is still this attempt's: a later one may have replaced it.
      if (spineCache.get(url) === pending) spineCache.delete(url);
      throw error;
    });
    spineCache.set(url, pending);
  }
  return { manifest, spine: await spineCache.get(url) };
}

// The sources index alone: the manifest names it, and it carries every
// source with its citers and their count. The bibliography page needs
// nothing else — not the topology, not the coastlines — and this is why the
// counts are in the index rather than computed from records at render.
export async function loadSources({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const manifest = await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' });
  const index = await fetchJson(`${dataRoot}${manifest.files.sources}`);
  return { manifest, sources: index.sources ?? [] };
}

// The narratives and the records they walk. narratives.html cannot do what
// the bibliography does and read one small index: a narrative's period is the
// years of the events its steps arrive at, and a step may name a link rather
// than an event, so both are needed. Since H3b that is the spine, which
// carries every step's title and every edge's ends — and nothing that is only
// drawn: no coastlines, no territories, no palette, and no sources index
// either, since this page lists no books.
export async function loadNarratives({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const { manifest, spine } = await loadSpine({ dataRoot, fetchJson });
  const expanded = topologyFromSpine(spine);
  return {
    manifest,
    narratives: expanded.narratives,
    events: new Map(expanded.events.map((e) => [e.id, e])),
    edges: new Map(expanded.edges.map((e) => [e.id, e])),
  };
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
// The graph comes from the spine and from nowhere else since H3c. The flag
// that chose between the two files existed only while the pages moved over
// one at a time (H3b), and it went with the file it named.
export async function loadAtlas({
  dataRoot = 'data/', landFile = null, regions = true, fetchJson = defaultFetchJson,
} = {}) {
  const manifest = await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' });
  const [spine, sourcesIndex] = await Promise.all([
    fetchJson(`${dataRoot}${manifest.files.spine}`),
    fetchJson(`${dataRoot}${manifest.files.sources}`),
  ]);
  const landPath = landFile === false ? null : landFile ?? (manifest.land?.[0] ? `${dataRoot}${manifest.land[0].file}` : null);
  const land = landPath ? await fetchJson(landPath) : null;
  // The palette is tiny — one number per actor — and the map wants it on the
  // first frame it draws territories in, so it comes with the spine rather
  // than with the shard whose outlines it colours.
  const palette = manifest.palette ? await fetchJson(`${dataRoot}${manifest.palette}`) : null;
  // The lane polygons, for the box of each region. A placeless event answers
  // "am I in view" with its region, so the boxes have to be in hand before the
  // first frame; a dataset without the file simply has none, and the events
  // with no place stay out of a box as they were.
  //
  // `regions: false` for a page with no viewport to be in or out of — the
  // entry page and the contribution form — because the polygons are a couple
  // of hundred kilobytes and only the map ever asks the question. Reduced to
  // one box per region the moment it arrives; the polygons are not kept.
  const regionBoxes = regions
    ? await fetchJson(`${dataRoot}geo/regions.json`)
      .then((collection) => regionBounds(collection))
      .catch(() => new Map())
    : new Map();
  return createAtlasFromSpine({
    manifest, spine, sources: sourcesIndex.sources, land, palette, regionBoxes, dataRoot, fetchJson,
  });
}

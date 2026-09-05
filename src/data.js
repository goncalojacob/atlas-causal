// Reads the manifest, loads the topology whole, fetches record text on
// demand, resolves aliases and supersededBy, builds adjacency — of events
// to events through edges, and of actors to the events they appear in.
// Knows nothing about how things are drawn.
//
// The topology is always loaded whole because consequences, ancestors and
// convergence need the whole graph; a window would make convergence return
// a subset and present it as complete (ARCHITECTURE.md).

import { buildAdjacency } from './graph.js';
import { narrativeEventIds } from './narrative.js';
import { extent as intervalExtent } from './util/dates.js';

async function defaultFetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

// Pure assembly from already-loaded pieces; loadAtlas() does the fetching.
export function createAtlas({ manifest, topology, sources, land = null, palette = null, dataRoot = 'data/', fetchJson = defaultFetchJson }) {
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

  // The bibliography read backwards: which sources cite a given record. The
  // sources index already carries every citation from the other end (M10), so
  // this costs one pass and no request — which is why a card can say how many
  // sources a record has *before* fetching the record's own text.
  const citationsOf = new Map();
  for (const source of sourceMap.values()) {
    for (const citation of source.citations ?? []) {
      const key = `${citation.kind}:${citation.id}`;
      if (!citationsOf.has(key)) citationsOf.set(key, []);
      citationsOf.get(key).push({ ...citation, source: source.id });
    }
  }
  const citationCount = (kind, id) => (citationsOf.get(`${kind}:${id}`) ?? []).length;

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

  const cache = new Map();
  function record(kind, id) {
    const key = `${kind}/${id}`;
    if (!cache.has(key)) cache.set(key, fetchJson(`${dataRoot}${kind}s/${encodeURIComponent(id)}.json`));
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
      geometryLoading.set(file, fetchJson(`${dataRoot}${file}`).then((collection) => {
        const byKey = new Map((collection.features ?? []).map((f) => [String(f.id), f.geometry]));
        geometry.set(file, byKey);
        return byKey;
      }));
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
    citationsOf,
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
// years of the events its steps arrive at, and those are in the topology.
// So the topology, and nothing that is only drawn — no coastlines, no
// territories, no palette, and no sources index either, since this page lists
// no books.
export async function loadNarratives({ dataRoot = 'data/', fetchJson = defaultFetchJson } = {}) {
  const manifest = await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' });
  const topology = await fetchJson(`${dataRoot}${manifest.files.topology}`);
  return {
    manifest,
    narratives: topology.narratives ?? [],
    events: new Map((topology.events ?? []).map((e) => [e.id, e])),
    edges: new Map((topology.edges ?? []).map((e) => [e.id, e])),
  };
}

// landFile overrides the manifest's land list; the fixture manifest has
// none, and the site still wants coastlines under the synthetic marks.
// `false` loads no coastlines at all: the contribution form needs the
// topology and nothing that is only drawn.
export async function loadAtlas({ dataRoot = 'data/', landFile = null, fetchJson = defaultFetchJson } = {}) {
  const manifest = await fetchJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' });
  const [topology, sourcesIndex] = await Promise.all([
    fetchJson(`${dataRoot}${manifest.files.topology}`),
    fetchJson(`${dataRoot}${manifest.files.sources}`),
  ]);
  const landPath = landFile === false ? null : landFile ?? (manifest.land?.[0] ? `${dataRoot}${manifest.land[0].file}` : null);
  const land = landPath ? await fetchJson(landPath) : null;
  // The palette is tiny — one number per actor — and the map wants it on the
  // first frame it draws territories in, so it comes with the topology rather
  // than with the shard whose outlines it colours.
  const palette = manifest.palette ? await fetchJson(`${dataRoot}${manifest.palette}`) : null;
  return createAtlas({ manifest, topology, sources: sourcesIndex.sources, land, palette, dataRoot, fetchJson });
}

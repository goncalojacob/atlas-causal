// Reads the manifest, loads the topology whole, fetches record text on
// demand, resolves aliases and supersededBy, builds adjacency — of events
// to events through edges, and of actors to the events they appear in.
// Knows nothing about how things are drawn.
//
// The topology is always loaded whole because consequences, ancestors and
// convergence need the whole graph; a window would make convergence return
// a subset and present it as complete (ARCHITECTURE.md).

import { buildAdjacency } from './graph.js';
import { extent as intervalExtent } from './util/dates.js';

async function defaultFetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

// Pure assembly from already-loaded pieces; loadAtlas() does the fetching.
export function createAtlas({ manifest, topology, sources, land = null, dataRoot = 'data/', fetchJson = defaultFetchJson }) {
  const events = new Map(topology.events.map((e) => [e.id, e]));
  const edges = new Map(topology.edges.map((e) => [e.id, e]));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const actors = new Map((topology.actors ?? []).map((a) => [a.id, a]));
  const places = new Map((topology.places ?? []).map((p) => [p.id, p]));
  const kinds = [['event', events], ['edge', edges], ['source', sourceMap], ['actor', actors], ['place', places]];

  const aliases = new Map();
  for (const [kind, map] of kinds) {
    for (const record of map.values()) {
      for (const alias of record.aliases ?? []) aliases.set(alias, { id: record.id, kind });
    }
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
    territoryYear,
    shardForYear,
    loadedGeometry,
    loadGeometry,
    presencesAt,
    events,
    edges,
    sources: sourceMap,
    actors,
    places,
    eventsByPlace,
    placeOf,
    pointOf,
    eventsByActor,
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
  return createAtlas({ manifest, topology, sources: sourcesIndex.sources, land, dataRoot, fetchJson });
}

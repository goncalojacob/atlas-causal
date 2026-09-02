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
  const kinds = [['event', events], ['edge', edges], ['source', sourceMap], ['actor', actors]];

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

  return {
    manifest,
    regions: [...manifest.regions].sort((a, b) => a.order - b.order),
    events,
    edges,
    sources: sourceMap,
    actors,
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

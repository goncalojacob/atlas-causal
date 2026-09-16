// Which polities an event happened inside, once, at build time.
//
// The actor lens matched `event.actors` and nothing else, so selecting
// Portugal found the eight events that name Portugal and missed the sixty
// that happened in Lisbon (M48 §2). The atlas has held 6,686 dated presence
// polygons since M43a and every place carries coordinates, and none of it was
// consulted; this is the file that consults it.
//
// **Containment is geometry and not a claim.** An event whose place sits
// inside a polygon the dataset draws is a fact about two records, and writing
// it down is reading rather than deciding — which is why this may be computed
// at all under the rule that forbids generated historical claims (CLAUDE.md).
// Nothing here decides who held anywhere: the presences say that, with their
// own confidence and their own licence, and this only asks whether a point is
// inside one of them.
//
// **At build time, never at render time.** Point-in-polygon against thousands
// of dated presences while a reader waits is not a thing to do:
// `tools/build-index.mjs` runs this once and writes the answer into
// `grounds-<hash>.json`, which the browser fetches when a lens actually asks
// (data.js, `loadGrounds`).
//
// Pure: records and a way of getting at an outline in, a map of ids out.
// Nothing here reads a file or knows the DOM.

import { bounds } from './util/dates.js';
import { bbox, pointInGeometry } from './util/geo.js';

// The year a containment is asked about: where the event begins. An event is
// an interval and a presence is an interval, and the honest join between two
// of them could be overlap — but "the actor held this ground at the event's
// date" is what the brief asks and what a reader means, and a war that runs
// for thirteen years is not thirteen years of evidence that its ground
// changed hands. The earliest the start could have been, because that is the
// same bound `extent` reads and the arrow of time is checked on.
export function yearOf(event) {
  return bounds(event.when.start).min;
}

// A presence's own interval, in historians' years. `end: null` reaches the
// present, as it does everywhere else in the atlas.
function span(when) {
  return { min: bounds(when.start).min, max: when.end === null ? null : bounds(when.end).max };
}

const covers = (when, year) => {
  const { min, max } = span(when);
  return year >= min && (max === null || year <= max);
};

// Where an event is, or null: the place's point. An event whose place has no
// coordinates has no ground, and that is not an error — rule 1 of the lens
// (the `actors` list) still applies to it and always did.
function pointOf(event, places) {
  const place = event.place ? places.get(event.place) ?? null : null;
  const where = place?.where ?? null;
  if (!where || typeof where.lon !== 'number' || typeof where.lat !== 'number') return null;
  return [where.lon, where.lat];
}

// Every event's polities, as a Map<eventId, string[]> of sorted actor ids,
// with no entry at all for an event that is inside nothing.
//
// `geometryOf(presence)` hands back the outline or null: the outlines are
// sharded by period and live outside the records, because imported geometry
// carries its own licence and is never merged into one (schema/v1/presence).
//
// Two things keep this from being 10^8 comparisons at ten thousand events.
// The answer is a fact about a **point and a year**, so it is worked out once
// per (place, year) and not once per event — 92 placed events in this corpus
// are 40-odd questions — and a presence whose box does not contain the point
// is skipped before its rings are walked.
export function buildGrounds(events, places, presences, geometryOf) {
  const standing = [];
  for (const presence of presences) {
    if (presence.status !== 'active') continue;
    const geometry = geometryOf(presence);
    if (!geometry) continue;
    standing.push({ presence, geometry, box: bbox(geometry) });
  }

  const answered = new Map();
  const at = (point, year) => {
    const ids = new Set();
    for (const { presence, geometry, box } of standing) {
      if (!covers(presence.when, year)) continue;
      if (box && (point[0] < box[0] || point[0] > box[2] || point[1] < box[1] || point[1] > box[3])) continue;
      if (!pointInGeometry(point, geometry)) continue;
      ids.add(presence.actor);
      // **A dependency's ground is its sovereign's too**, which is what makes
      // Angola under Portugal reachable by selecting Portugal without anyone
      // listing colonies by hand. One hop and not a chain: `dependencyOf` is
      // what the source says about this territory, and walking it further
      // would be inferring a relation the record does not state.
      if (presence.dependencyOf) ids.add(presence.dependencyOf);
    }
    return [...ids].sort();
  };

  const grounds = new Map();
  for (const event of events) {
    if (event.status !== 'active') continue;
    const point = pointOf(event, places);
    if (!point) continue;
    const year = yearOf(event);
    const key = `${event.place}|${year}`;
    if (!answered.has(key)) answered.set(key, at(point, year));
    const ids = answered.get(key);
    if (ids.length) grounds.set(event.id, ids);
  }
  return grounds;
}

// ─── the file ──────────────────────────────────────────────────────────────
//
// An id table and integers into it, for the reason every other index file has
// one: an actor holding ground under forty events would otherwise be its own
// id forty times, and this file grows with the corpus. Sorted by id
// throughout, so two builds of one dataset write one file.

export function encodeGrounds(grounds) {
  const actors = [...new Set([...grounds.values()].flat())].sort();
  const at = new Map(actors.map((id, i) => [id, i]));
  const events = {};
  for (const id of [...grounds.keys()].sort()) {
    events[id] = grounds.get(id).map((actor) => at.get(actor));
  }
  return { schema: 1, actors, events };
}

// The other direction, for the loader: event id → actor ids. A file from a
// build that knew nothing about grounds — or none at all — is an empty map
// and not an error, exactly as an absent `presences` key is (data.js).
export function decodeGrounds(file) {
  const actors = file?.actors ?? [];
  const out = new Map();
  for (const [id, list] of Object.entries(file?.events ?? {})) {
    const named = (list ?? []).map((i) => actors[i]).filter((a) => typeof a === 'string');
    if (named.length) out.set(id, named);
  }
  return out;
}

// What the lens asks: which events this actor holds the ground of. Inverted
// once when the file lands rather than scanned per selection, because the
// question is asked per focus and per render.
export function byActor(grounds) {
  const out = new Map();
  for (const [event, actors] of grounds) {
    for (const actor of actors) {
      if (!out.has(actor)) out.set(actor, new Set());
      out.get(actor).add(event);
    }
  }
  return out;
}

// What "in view" means, once, purely. The timeline asks it of every event it
// is about to draw, and it must be the same question the map answers when it
// writes the box — otherwise a mark on the map would have no bar under it.
//
// A box is `[west, south, east, north]` in degrees, as the URL carries it.
// Null is the world: no box, no filtering, which is what the pin restores.
//
// An event has no coordinates of its own — its place holds the point — so the
// places are passed in rather than reached for.
//
// An event with no place answers with its region instead. Fifty-one of the
// atlas's active events are long processes with no honest point, and they
// used to leave the lanes the moment the map was touched — "86 of 137 events
// in view" for the whole world (health review B, finding 15). A region's
// bounding box is a coarse answer and deliberately a generous one: it is
// better to leave a process listed while looking somewhere it barely reaches
// than to hide it while looking straight at it. The boxes come from
// `data/geo/regions.json`, derived at load (util/geo.js); an event with
// neither a place nor a known region still cannot answer, and is not in view.

export function containsPoint(bbox, point) {
  if (!bbox) return true;
  if (!point || !Number.isFinite(point.lon) || !Number.isFinite(point.lat)) return false;
  const [west, south, east, north] = bbox;
  if (point.lat < south || point.lat > north) return false;
  // A box that crosses the antimeridian has its west end east of its east
  // end. The projection does not wrap and the state clamps to the world, so
  // this is a guard rather than a case — but a wrapped box read out of a
  // hand-written URL should still mean the strip it names.
  return west <= east
    ? point.lon >= west && point.lon <= east
    : point.lon >= west || point.lon <= east;
}

// `places` is anything with a .get — the atlas's Map of place records — or a
// plain object of them, so a test need not build a topology to ask.
export function pointOfEvent(event, places) {
  const id = typeof event?.place === 'string' ? event.place : null;
  if (id === null || !places) return null;
  const place = typeof places.get === 'function' ? places.get(id) : places[id];
  return place?.where ?? null;
}

// Do two boxes share any ground? `bbox` is the viewport's and may be written
// wrapped, as containsPoint's is; a region's box comes from polygons and is
// never inside out.
export function boxesOverlap(bbox, box) {
  if (!bbox) return true;
  if (!Array.isArray(box) || box.length !== 4 || box.some((v) => !Number.isFinite(v))) return false;
  const [west, south, east, north] = bbox;
  const [w, s, e, n] = box;
  if (n < south || s > north) return false;
  return west <= east
    ? w <= east && e >= west
    : w <= east || e >= west;
}

// `regions` is a Map of region id → box, or anything with a .get, or a plain
// object of them; null when the caller has none, which is the old behaviour.
export function regionBoxOf(event, regions) {
  const id = typeof event?.region === 'string' ? event.region : null;
  if (id === null || !regions) return null;
  return (typeof regions.get === 'function' ? regions.get(id) : regions[id]) ?? null;
}

export function inView(event, bbox, places, regions = null) {
  if (!bbox) return true;
  const point = pointOfEvent(event, places);
  if (point) return containsPoint(bbox, point);
  return boxesOverlap(bbox, regionBoxOf(event, regions));
}

// The events the lanes draw while the map is looking at a box: what is
// inside it, plus whatever the reader is holding. `keep` is the selected
// event and the steps of the walked chain — a chain that runs off the edge of
// the screen is still a chain, and a timeline that dropped its middle would
// be telling the reader they had not walked it.
export function eventsInView(events, bbox, places, { keep = null, regions = null } = {}) {
  if (!bbox) return events;
  return events.filter((event) => inView(event, bbox, places, regions) || Boolean(keep?.has(event.id)));
}

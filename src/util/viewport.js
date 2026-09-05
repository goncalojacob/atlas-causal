// What "in view" means, once, purely. The timeline asks it of every event it
// is about to draw, and it must be the same question the map answers when it
// writes the box — otherwise a mark on the map would have no bar under it.
//
// A box is `[west, south, east, north]` in degrees, as the URL carries it.
// Null is the world: no box, no filtering, which is what the pin restores.
//
// An event has no coordinates of its own — its place holds the point — so the
// places are passed in rather than reached for. An event whose place is
// missing is *not* in view: the box is a question about where something is,
// and a record that does not say where cannot answer it.

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

export function inView(event, bbox, places) {
  if (!bbox) return true;
  return containsPoint(bbox, pointOfEvent(event, places));
}

// The events the lanes draw while the map is looking at a box: what is
// inside it, plus whatever the reader is holding. `keep` is the selected
// event and the steps of the walked chain — a chain that runs off the edge of
// the screen is still a chain, and a timeline that dropped its middle would
// be telling the reader they had not walked it.
export function eventsInView(events, bbox, places, { keep = null } = {}) {
  if (!bbox) return events;
  return events.filter((event) => inView(event, bbox, places) || Boolean(keep?.has(event.id)));
}

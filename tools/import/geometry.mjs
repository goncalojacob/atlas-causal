// Cutting geometry at a rectangle, and at the meridian the picture is cut at.
// Pure: no fs, no network, no dependencies, like topojson.mjs beside it.
//
// Why it exists. The map projects longitudes relative to a central meridian
// and wraps them into [-180, 180) around it (src/map/projection.js), so the
// meridian half a world away — the *seam* — is the left edge of the picture
// and the right edge at the same time. A polygon that crosses the seam has
// points at both edges and is drawn as a smear right across the map. The
// geometry under data/geo/ is therefore cut at the seam once, here, when it
// is imported, and nothing the map draws crosses it.
//
// The same cut is what a cell of a sharded base map needs (review of the map
// block, finding 1): a rectangle is a rectangle whether it is half a world or
// a quarter of a degree, and `splitAtMeridian` is this function over the two
// halves of the world rather than an algorithm of its own.
//
// Sutherland–Hodgman, per ring, against the four edges of the box in turn.
// It is the right algorithm here because the window is a rectangle and so
// convex, because it keeps a ring's winding — which is what tells an outer
// ring from a hole — and because it is sixty lines and no dependency. Its
// known weakness is the degenerate edge it leaves along the box where a ring
// leaves and comes back: that edge is invisible in a filled shape, and it is
// what keeps a hole attached to the outer ring it was punched in.

import { ringArea } from './simplify.mjs';

// How far west of the seam the western half is cut. The seam belongs to the
// eastern half, where it is the left edge of the picture; a point of the
// western half left exactly on it would be projected to that same left edge
// and drag the shape across the whole map. A millionth of a degree is a
// tenth of a millimetre on the ground and 3e-9 of an SVG unit at k = 1 —
// far below anything a screen can show at the deepest zoom the map allows —
// and it is the whole width of the gap between the two halves, which lies at
// the two opposite edges of the picture and is never seen as a gap at all.
export const SEAM_GAP = 1e-6;

const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// A ring as a list of distinct vertices: GeoJSON repeats the first point at
// the end and the clipper must not treat that repeat as an edge of its own.
function openRing(ring) {
  const last = ring.length - 1;
  return ring.length > 1 && same(ring[0], ring[last]) ? ring.slice(0, last) : [...ring];
}

function closeRing(ring) {
  return ring.length && !same(ring[0], ring[ring.length - 1]) ? [...ring, [ring[0][0], ring[0][1]]] : ring;
}

// Where a–b crosses the vertical line x = v, and the horizontal line y = v.
// One end is inside and the other outside whenever these are called, so the
// denominator is never zero; the guard is there so a caller that breaks that
// rule gets a point rather than a NaN.
const atX = (a, b, v) => (a[0] === b[0] ? [v, a[1]] : [v, a[1] + ((v - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]);
const atY = (a, b, v) => (a[1] === b[1] ? [a[0], v] : [a[0] + ((v - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), v]);

function edgesOf([w, s, e, n]) {
  return [
    { inside: (p) => p[0] >= w, cut: (a, b) => atX(a, b, w) },
    { inside: (p) => p[0] <= e, cut: (a, b) => atX(a, b, e) },
    { inside: (p) => p[1] >= s, cut: (a, b) => atY(a, b, s) },
    { inside: (p) => p[1] <= n, cut: (a, b) => atY(a, b, n) },
  ];
}

// One Sutherland–Hodgman pass: the ring kept on the inside of one edge.
function clipAgainst(ring, { inside, cut }) {
  const out = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[(i + ring.length - 1) % ring.length];
    const b = ring[i];
    const bIn = inside(b);
    if (inside(a)) {
      if (bIn) out.push(b);
      else out.push(cut(a, b));
    } else if (bIn) {
      out.push(cut(a, b), b);
    }
  }
  return out;
}

// A vertex that lies exactly on an edge is emitted by the pass that crosses
// there and again by the vertex itself; a shape has no use for the repeat.
function dedupe(points) {
  const out = [];
  for (const p of points) {
    if (out.length === 0 || !same(out[out.length - 1], p)) out.push(p);
  }
  while (out.length > 1 && same(out[0], out[out.length - 1])) out.pop();
  return out;
}

export function ringBbox(ring) {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [x, y] of ring) {
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  return [w, s, e, n];
}

// The box of a whole geometry, or null when it has no coordinates at all.
export function geometryBbox(geometry) {
  const rings = ringsOf(geometry);
  if (rings.length === 0) return null;
  const boxes = rings.map(ringBbox);
  return [
    Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])),
    Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3])),
  ];
}

// Every ring or line a geometry is made of, whatever its type: what a caller
// asking "where are its points?" means, and what the two bbox helpers walk.
export function ringsOf(geometry) {
  switch (geometry?.type) {
    case 'Polygon': return geometry.coordinates;
    case 'MultiPolygon': return geometry.coordinates.flat();
    case 'LineString': return [geometry.coordinates];
    case 'MultiLineString': return geometry.coordinates;
    default: return [];
  }
}

const within = (box, [w, s, e, n]) => w >= box[0] && e <= box[2] && s >= box[1] && n <= box[3];
const apart = (box, [w, s, e, n]) => w > box[2] || e < box[0] || s > box[3] || n < box[1];

// One ring clipped to the box, closed, or null when nothing worth drawing is
// left. A ring reduced to fewer than three distinct vertices, or to an area
// of `minArea` or less, is a line and not an island, and is dropped — which
// is `keepRing`'s rule in simplify.js, applied to the same kind of leftover.
export function clipRing(ring, box, { minArea = 0 } = {}) {
  let points = openRing(ring);
  for (const edge of edgesOf(box)) {
    points = clipAgainst(points, edge);
    if (points.length === 0) return null;
  }
  points = dedupe(points);
  if (points.length < 3) return null;
  const closed = closeRing(points);
  return Math.abs(ringArea(closed)) > minArea ? closed : null;
}

// Liang–Barsky: the piece of the segment a–b inside the box, as the two
// parameters along it, or null when none of it is.
function clipSegment(a, b, [w, s, e, n]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - w, e - a[0], a[1] - s, n - a[1]];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [t0, t1];
}

const lerp = (a, b, t) => (t === 0 ? [a[0], a[1]] : t === 1 ? [b[0], b[1]] : [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);

// A line cut into the runs of it that are inside the box. A line that leaves
// and comes back is two lines: joining them would draw a shore, a river or a
// border where the source has none.
export function clipLine(line, box) {
  const parts = [];
  let current = null;
  for (let i = 0; i + 1 < line.length; i += 1) {
    const a = line[i];
    const b = line[i + 1];
    const piece = clipSegment(a, b, box);
    if (!piece) {
      current = null;
      continue;
    }
    const [t0, t1] = piece;
    const start = lerp(a, b, t0);
    const end = lerp(a, b, t1);
    if (!current || !same(current[current.length - 1], start)) {
      current = [start];
      parts.push(current);
    }
    if (!same(current[current.length - 1], end)) current.push(end);
    // It left the box here, so whatever comes back is a line of its own.
    if (t1 < 1) current = null;
  }
  return parts.filter((part) => part.length >= 2);
}

const polygonsOf = (geometry) => (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates);
const linesOf = (geometry) => (geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates);

const asPolygons = (kept) => (kept.length === 0 ? null
  : kept.length === 1 ? { type: 'Polygon', coordinates: kept[0] }
    : { type: 'MultiPolygon', coordinates: kept });

const asLines = (kept) => (kept.length === 0 ? null
  : kept.length === 1 ? { type: 'LineString', coordinates: kept[0] }
    : { type: 'MultiLineString', coordinates: kept });

// A geometry clipped to `[west, south, east, north]`, or null when none of it
// is inside. Holes are clipped with their outer ring and kept; a polygon
// whose outer ring is gone is gone, holes and all, exactly as `pruneGeometry`
// has it.
//
// A geometry wholly inside the box is returned as it was given — the same
// arrays, not a copy — because that is the common case by far and because it
// is what makes a file recut at a seam that misses it come out byte for byte
// the same.
export function clipToBox(geometry, box, { minArea = 0 } = {}) {
  const bbox = geometryBbox(geometry);
  if (!bbox) return null;
  if (apart(box, bbox)) return null;
  if (within(box, bbox)) return geometry;
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    const kept = [];
    for (const polygon of polygonsOf(geometry)) {
      const outer = clipRing(polygon[0] ?? [], box, { minArea });
      if (!outer) continue;
      const rings = [outer];
      for (const hole of polygon.slice(1)) {
        const ring = clipRing(hole, box, { minArea });
        if (ring) rings.push(ring);
      }
      kept.push(rings);
    }
    return asPolygons(kept);
  }
  if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
    return asLines(linesOf(geometry).flatMap((line) => clipLine(line, box)));
  }
  return null;
}

function merge(east, west) {
  if (!east) return west;
  if (!west) return east;
  if (east.type === 'Polygon' || east.type === 'MultiPolygon') {
    return asPolygons([...polygonsOf(east), ...polygonsOf(west)]);
  }
  return asLines([...linesOf(east), ...linesOf(west)]);
}

// The geometry cut at one meridian, so that no piece of it crosses that
// meridian: two clips, over the two halves of the world the meridian makes.
//
// The seam itself goes to the eastern half, where the projection puts it at
// the left edge of the picture; the western half stops `gap` short of it, at
// the right edge. The two halves are at opposite edges of the picture and
// never meet, so the gap between them is not a gap anybody can see.
export function splitAtMeridian(geometry, lon, { gap = SEAM_GAP, minArea = 0 } = {}) {
  const east = clipToBox(geometry, [lon, -90, 180, 90], { minArea });
  const west = lon - gap <= -180 ? null : clipToBox(geometry, [-180, -90, lon - gap, 90], { minArea });
  return merge(east, west);
}

// Does any part of this geometry cross the meridian? What the seam report
// counts, and what `splitAtMeridian` has to have made false afterwards.
export function crossesMeridian(geometry, lon) {
  for (const ring of ringsOf(geometry)) {
    const [w, , e] = ringBbox(ring);
    if (w < lon && e > lon) return true;
  }
  return false;
}

// Making a world's worth of coastline small enough to serve without a build
// step: Douglas–Peucker, then quantization, then throwing away what is left
// of a ring that had nothing to say. Pure, no dependencies.
//
// It is read twice. `tools/import/simplify.mjs` re-exports it for the CShapes
// import, which simplifies the topology's *arcs* once and writes the shards;
// and `map/layers/presences.js` calls `simplifyGeometry` below on the outlines
// it has in hand, at a tolerance chosen by how far the reader has zoomed —
// a world map does not need a border drawn to a tenth of a degree, and 181
// outlines at full detail were being turned into path strings on every change
// of year (health review B, finding 24). One implementation, because two
// would drift and the second would be the one nobody tested.
//
// The import's pass runs before any polygon is decoded, so a border two
// countries share stays one line and they still meet along it afterwards. The
// map's runs after, on rings, where the shared border is already two copies
// of the same points — and the same tolerance takes the same points off both,
// so they still meet. Everything here is planar arithmetic on degrees:
// at world scale and this tolerance the difference from a spherical measure
// is far below the tolerance itself, and a map that is one pixel out is not
// what this project can get wrong.

// Perpendicular distance from p to the segment a–b, in degrees.
export function segmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

// Iterative, so a 40,000-point arc cannot blow the stack.
export function douglasPeucker(points, tolerance) {
  if (points.length <= 2 || tolerance <= 0) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let farthest = -1;
    let worst = tolerance;
    for (let i = first + 1; i < last; i += 1) {
      const d = segmentDistance(points[i], points[first], points[last]);
      if (d > worst) {
        worst = d;
        farthest = i;
      }
    }
    if (farthest === -1) continue;
    keep[farthest] = 1;
    stack.push([first, farthest], [farthest, last]);
  }
  return points.filter((_, i) => keep[i]);
}

export function round(value, decimals) {
  const factor = 10 ** decimals;
  // +0 so a rounded −0 is written as 0 and the output stays byte-stable.
  return Math.round(value * factor) / factor + 0;
}

// Quantize and drop the points that quantization made duplicates of their
// neighbour. The first and last points survive whatever happens, because an
// arc's endpoints are what its neighbours join onto.
export function quantize(points, decimals) {
  const out = [];
  for (const [x, y] of points) {
    const p = [round(x, decimals), round(y, decimals)];
    const previous = out[out.length - 1];
    if (previous && previous[0] === p[0] && previous[1] === p[1]) continue;
    out.push(p);
  }
  if (points.length > 1 && out.length === 1) {
    const [x, y] = points[points.length - 1];
    out.push([round(x, decimals), round(y, decimals)]);
  }
  return out;
}

// How much smaller than the thing being simplified the tolerance has to
// stay. Without this, one tolerance for the whole world deletes the small
// countries: Malta is about a fifth of a degree across, so a 0.1° band
// flattens its coastline into a line and Malta stops existing. An arc is
// therefore simplified at its own scale — the tolerance, or a sixth of the
// arc's own extent, whichever is less, so the smallest island still keeps
// enough segments to read as a shape. It costs about a third more bytes
// across the world and it is the difference between Malta, Bahrain and the
// Maldives being on the map and not being on it at all.
export const MIN_DETAIL = 6;

export function arcExtent(arc) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of arc) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return arc.length ? Math.max(maxX - minX, maxY - minY) : 0;
}

export function simplifyArc(arc, { tolerance, decimals }) {
  const scaled = Math.min(tolerance, arcExtent(arc) / MIN_DETAIL);
  return quantize(douglasPeucker(arc, scaled), decimals);
}

// Twice the signed area, which is all the caller needs: sign for winding,
// magnitude for "did this ring survive at all".
export function ringArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    sum += (ring[j][0] * ring[i][1]) - (ring[i][0] * ring[j][1]);
  }
  return sum / 2;
}

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, [first[0], first[1]]];
}

// A ring that simplification reduced to a sliver is dropped rather than
// drawn: four points is the least a closed ring can have, and a ring whose
// area rounds to nothing is a line, not an island.
export function keepRing(ring, minArea) {
  const closed = closeRing(ring);
  return closed.length >= 4 && Math.abs(ringArea(closed)) >= minArea ? closed : null;
}

// Rings are already simplified (they were built from simplified arcs); this
// only decides what is worth keeping. A polygon whose outer ring went is
// gone, holes and all; a geometry with no polygons left returns null.
export function pruneGeometry(geometry, { minArea = 0 } = {}) {
  if (!geometry) return null;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  const kept = [];
  for (const polygon of polygons) {
    const outer = keepRing(polygon[0] ?? [], minArea);
    if (!outer) continue;
    const rings = [outer];
    for (const hole of polygon.slice(1)) {
      const ring = keepRing(hole, minArea);
      if (ring) rings.push(ring);
    }
    kept.push(rings);
  }
  if (kept.length === 0) return null;
  return kept.length === 1
    ? { type: 'Polygon', coordinates: kept[0] }
    : { type: 'MultiPolygon', coordinates: kept };
}

// A whole geometry simplified where it stands: every ring taken down at the
// given tolerance and the geometry then pruned of what that left as a sliver.
// This is the map's entry point, not the import's — the import simplifies
// arcs, which is a better place to do it, and this is for a caller that has
// only the decoded polygons.
//
// Each ring is held to MIN_DETAIL of its own extent, exactly as `simplifyArc`
// holds an arc: without it one tolerance for the whole world deletes the small
// countries. A tolerance of zero is no simplification and returns the geometry
// it was given, unchanged and uncopied.
export function simplifyGeometry(geometry, { tolerance, minArea = 0 } = {}) {
  if (!geometry || !(tolerance > 0)) return geometry;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  if (polygons.length === 0) return geometry;
  const taken = polygons.map((polygon) => polygon.map((ring) => {
    const scaled = Math.min(tolerance, arcExtent(ring) / MIN_DETAIL);
    return douglasPeucker(ring, scaled);
  }));
  return pruneGeometry(
    taken.length === 1 ? { type: 'Polygon', coordinates: taken[0] } : { type: 'MultiPolygon', coordinates: taken },
    { minArea },
  );
}

export function countPoints(geometry) {
  if (!geometry) return 0;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.reduce((total, polygon) => total + polygon.reduce((n, ring) => n + ring.length, 0), 0);
}

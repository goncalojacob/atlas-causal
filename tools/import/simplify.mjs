// Making a world's worth of coastline small enough to serve without a build
// step: Douglas–Peucker, then quantization, then throwing away what is left
// of a ring that had nothing to say. Pure, no dependencies.
//
// Simplification runs on the topology's *arcs*, before any polygon is
// decoded, so a border two countries share stays one line and they still
// meet along it afterwards. Everything here is planar arithmetic on degrees:
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

export function simplifyArc(arc, { tolerance, decimals }) {
  return quantize(douglasPeucker(arc, tolerance), decimals);
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

export function countPoints(geometry) {
  if (!geometry) return 0;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.reduce((total, polygon) => total + polygon.reduce((n, ring) => n + ring.length, 0), 0);
}

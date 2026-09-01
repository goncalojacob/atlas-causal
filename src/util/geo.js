// Planar geometry over GeoJSON in WGS84 degrees, enough to put an event on a
// timeline lane. Pure; used by build-index.mjs and by the validator CLI.
//
// Region derivation: a point inside a lane polygon belongs to that lane. A
// point outside every polygon but within NEAREST_TOLERANCE degrees of one
// takes the nearest lane, because the 110m coastline is coarse and a port
// city often sits a few kilometres "at sea". Beyond the tolerance there is
// no honest answer and the record must set `region` itself.

export const NEAREST_TOLERANCE = 3;

// Ray casting on one ring. Points exactly on an edge count as inside, which
// is fine for lanes: the override exists for the ambiguous cases.
export function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

// GeoJSON Polygon coordinates: [outer, hole, hole, ...].
export function pointInPolygon(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

export function pointInGeometry(point, geometry) {
  if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((p) => pointInPolygon(point, p));
  return false;
}

// Distance in "degrees" from a point to a segment, with longitude scaled by
// cos(latitude) so that east–west distances are not exaggerated at high
// latitudes. Good enough to pick a nearest lane; not for navigation.
function segmentDistance([x, y], [x1, y1], [x2, y2]) {
  const k = Math.cos((y * Math.PI) / 180);
  const ax = (x1 - x) * k;
  const ay = y1 - y;
  const bx = (x2 - x1) * k;
  const by = y2 - y1;
  const len2 = bx * bx + by * by;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * bx + ay * by) / len2));
  const dx = ax + t * bx;
  const dy = ay + t * by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceToGeometry(point, geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let best = Infinity;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
        const d = segmentDistance(point, ring[j], ring[i]);
        if (d < best) best = d;
      }
    }
  }
  return best;
}

function bbox(geometry) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      if (x < box[0]) box[0] = x;
      if (y < box[1]) box[1] = y;
      if (x > box[2]) box[2] = x;
      if (y > box[3]) box[3] = y;
    }
  }
  return box;
}

// polygons: a GeoJSON FeatureCollection whose features carry
// properties.region. Returns a function where → { region, method, distance }
// or null when nothing is within tolerance.
export function createRegionDeriver(polygons, { tolerance = NEAREST_TOLERANCE } = {}) {
  const lanes = (polygons?.features ?? [])
    .filter((f) => f.geometry && f.properties && typeof f.properties.region === 'string')
    .map((f) => ({ region: f.properties.region, geometry: f.geometry, box: bbox(f.geometry) }));

  return function deriveRegion(where) {
    if (!where || typeof where.lon !== 'number' || typeof where.lat !== 'number') return null;
    const point = [where.lon, where.lat];
    for (const lane of lanes) {
      const [minX, minY, maxX, maxY] = lane.box;
      if (point[0] < minX || point[0] > maxX || point[1] < minY || point[1] > maxY) continue;
      if (pointInGeometry(point, lane.geometry)) return { region: lane.region, method: 'inside', distance: 0 };
    }
    let best = null;
    for (const lane of lanes) {
      const distance = distanceToGeometry(point, lane.geometry);
      if (best === null || distance < best.distance) best = { region: lane.region, method: 'nearest', distance };
    }
    if (best && best.distance <= tolerance) return best;
    return null;
  };
}

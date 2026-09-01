// lon/lat ⇄ SVG coordinates. The only file a projection change touches.
//
// Equirectangular (plate carrée): x is proportional to longitude, y to
// latitude, around a chosen centre. Chosen because it is exactly
// invertible (clicks map back to lon/lat with no iteration), needs no
// clipping, and draws Natural Earth polygons as straight segments without
// splitting at the antimeridian. Its distortion at high latitudes is
// accepted for now; a Robinson-style approximation can replace this file
// later without touching any layer, as long as project() and unproject()
// keep their contract.

// scale is pixels per degree of longitude. center is [lon, lat].
export function createProjection({ width, height, center = [0, 0], scale = width / 360 }) {
  const [lon0, lat0] = center;
  return {
    width,
    height,
    center,
    scale,
    project([lon, lat]) {
      return [width / 2 + (lon - lon0) * scale, height / 2 - (lat - lat0) * scale];
    },
    unproject([x, y]) {
      return [lon0 + (x - width / 2) / scale, lat0 - (y - height / 2) / scale];
    },
  };
}

// A projection whose view contains the bounds [[minLon, minLat], [maxLon,
// maxLat]] with a margin (fraction of the box) on every side.
export function fitBounds(bounds, { width, height, margin = 0.1 }) {
  const [[minLon, minLat], [maxLon, maxLat]] = bounds;
  const spanLon = Math.max(maxLon - minLon, 1e-6) * (1 + 2 * margin);
  const spanLat = Math.max(maxLat - minLat, 1e-6) * (1 + 2 * margin);
  const scale = Math.min(width / spanLon, height / spanLat);
  return createProjection({ width, height, center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2], scale });
}

export const WORLD = Object.freeze([[-180, -90], [180, 90]]);

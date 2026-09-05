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

// --- the viewport, both ways ----------------------------------------------
//
// The map pans and zooms with a transform over the projected plane, and the
// timeline asks its question in degrees. These two turn one into the other,
// and they live here because the conversion is the projection's own: a
// Robinson-style replacement would have to bring its own pair, and nothing
// outside this file would notice.

// The part of the world under a transform, as `[west, south, east, north]`,
// for an arbitrary rectangle of the coordinate space the transform is applied
// in — which is the SVG's own units, not its nominal box.
//
// The distinction is the whole point. An `<svg>` with a `viewBox` and no
// `preserveAspectRatio` of its own is letterboxed inside the box CSS gives
// it: at a map area wider than the viewBox's ratio the reader sees SVG units
// well to the left of 0 and well to the right of `width`, and a box computed
// from (0,0)–(width,height) describes the middle of the picture and calls it
// the picture (health review A, finding 4). The map measures the rectangle it
// really occupies through `getScreenCTM` and passes it here.
export function viewBboxIn(projection, { x = 0, y = 0, k = 1 } = {}, { x0, y0, x1, y1 }) {
  const [west, north] = projection.unproject([(x0 - x) / k, (y0 - y) / k]);
  const [east, south] = projection.unproject([(x1 - x) / k, (y1 - y) / k]);
  return [west, south, east, north];
}

// The nominal box, which is what a caller with no element to measure — a
// test, a projection question with no DOM behind it — is asking about.
export function viewBbox(projection, transform, { width, height }) {
  return viewBboxIn(projection, transform, { x0: 0, y0: 0, x1: width, y1: height });
}

// The transform that brings a box on screen, whole and centred. The zoom is
// clamped by the caller's own limits, so a box smaller than the deepest zoom
// is shown at that zoom around its middle rather than refused.
export function bboxTransform(projection, bbox, { width, height, minZoom = 1, maxZoom = Infinity }) {
  const [west, south, east, north] = bbox;
  const [x0, y0] = projection.project([west, north]);
  const [x1, y1] = projection.project([east, south]);
  const spanX = Math.max(Math.abs(x1 - x0), 1e-9);
  const spanY = Math.max(Math.abs(y1 - y0), 1e-9);
  const k = Math.min(maxZoom, Math.max(minZoom, Math.min(width / spanX, height / spanY)));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { k, x: width / 2 - cx * k, y: height / 2 - cy * k };
}

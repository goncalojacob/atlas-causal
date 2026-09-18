// lon/lat ⇄ SVG coordinates. The only file a projection change touches.
//
// Equirectangular (plate carrée): x is proportional to longitude, y to
// latitude, around a chosen centre. Chosen because it is exactly
// invertible (clicks map back to lon/lat with no iteration), needs no
// clipping, and draws Natural Earth polygons as straight segments. Its
// distortion at high latitudes is accepted for now; a Robinson-style
// approximation can replace this file later without touching any layer, as
// long as project() and unproject() keep their contract.

// The meridian in the middle of the picture. The owner asked for the world
// centred on Asia (5 September 2026) and 150°E is what the measurement chose:
// `node tools/build-regions.mjs --seam-report` counts what each candidate
// from 140°E to 170°E would cut, and 150°E cuts nothing — the table is in
// STATUS.md and ARCHITECTURE.md.
export const CENTRAL_MERIDIAN = 150;

// And the meridian half a world away from it, which is the left edge of the
// picture and the right edge at the same time. Every geometry file under
// data/geo/ is cut here when it is imported (tools/import/geometry.mjs),
// because an outline lying across the seam has points at both edges and is
// drawn as a smear from one side of the map to the other.
export const SEAM = CENTRAL_MERIDIAN - 180;

// The world is 360 degrees wide and the picture is WORLD_WIDTH units wide, so
// **k = 1 is the whole world**. That is a contract and not an observation:
// every zoom threshold in the data is a number of these k, and until this
// milestone the map fitted itself to the extent of the events instead, which
// made `k` mean something different on every dataset (review of the map
// block, finding 4).
export const WORLD_WIDTH = 960;

// A longitude shifted by `center` and wrapped into [-180, 180): where it is
// relative to the middle of the picture. The seam, at center ± 180, comes
// back as -180 — the left edge — and `splitAtMeridian` is written to that
// convention: it gives the seam itself to the eastern half and stops the
// western half a hair short of it.
export function relativeLon(lon, center = CENTRAL_MERIDIAN) {
  return ((((lon - center + 180) % 360) + 360) % 360) - 180;
}

// And back: an offset from the centre to a real longitude in [-180, 180).
export function absoluteLon(offset, center = CENTRAL_MERIDIAN) {
  return ((((offset + center + 180) % 360) + 360) % 360) - 180;
}

// The width of a box in degrees, going east from `west` to `east` — so a box
// whose west end is east of its east end is the strip that crosses ±180,
// which after this milestone is an ordinary part of the picture and not its
// edge. Two ends at the same longitude are the whole world: a box of no width
// is not a box at all and `normalizeBbox` has already refused it.
export function lonSpan(west, east) {
  const span = (((east - west) % 360) + 360) % 360;
  return span === 0 ? 360 : span;
}

// scale is pixels per degree of longitude. center is [lon, lat].
export function createProjection({ width, height, center = [CENTRAL_MERIDIAN, 0], scale = width / 360 }) {
  const [lon0, lat0] = center;
  return {
    width,
    height,
    center,
    scale,
    project([lon, lat]) {
      return [width / 2 + relativeLon(lon, lon0) * scale, height / 2 - (lat - lat0) * scale];
    },
    unproject([x, y]) {
      return [absoluteLon((x - width / 2) / scale, lon0), lat0 - (y - height / 2) / scale];
    },
  };
}

// The whole world in `width` units, centred on the meridian above: the
// projection the map is built on, and the one k = 1 is defined by.
export function worldProjection({ width = WORLD_WIDTH, height = WORLD_WIDTH * 0.5625, center = CENTRAL_MERIDIAN } = {}) {
  return createProjection({ width, height, center: [center, 0], scale: width / 360 });
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
//
// `west` may come back east of `east`: the strip crosses ±180, which is an
// ordinary meridian of this picture now and not its edge. What cannot come
// back is a strip wider than the world — the reader is then looking at every
// longitude there is, and the honest answer to "which part of the world" is
// all of it, which `normalizeBbox` turns into no box at all.
export function viewBboxIn(projection, { x = 0, y = 0, k = 1 } = {}, { x0, y0, x1, y1 }) {
  const [, north] = projection.unproject([(x0 - x) / k, (y0 - y) / k]);
  const [, south] = projection.unproject([(x1 - x) / k, (y1 - y) / k]);
  if ((x1 - x0) / k / projection.scale >= 360) return [-180, south, 180, north];
  const [west] = projection.unproject([(x0 - x) / k, 0]);
  const [east] = projection.unproject([(x1 - x) / k, 0]);
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
//
// A box that crosses the **seam** is the one thing no transform can show: the
// picture is cut there, so its two halves are at the two opposite edges and a
// strip spanning them is two strips. The whole world is shown instead, which
// is where both halves are visible. It is also what an old link naming the
// whole world asks for, and the two arrive here as the same case.
export function bboxTransform(projection, bbox, { width, height, minZoom = 1, maxZoom = Infinity }) {
  const [west, south, east, north] = bbox;
  const [x0, y0] = projection.project([west, north]);
  const [x1, y1] = projection.project([east, south]);
  const whole = x1 <= x0;
  const spanX = whole ? 360 * projection.scale : x1 - x0;
  const spanY = Math.max(Math.abs(y1 - y0), 1e-9);
  const k = Math.min(maxZoom, Math.max(minZoom, Math.min(width / spanX, height / spanY)));
  const cx = whole ? projection.width / 2 : (x0 + x1) / 2;
  // Squarely, north and south as well: the world at k = 1 is shorter than the
  // picture, so centring it on the box's own latitudes would push a pole off
  // the bottom for no gain — the latitudes asked for are on screen either way.
  const cy = whole ? projection.height / 2 : (y0 + y1) / 2;
  return { k, x: width / 2 - cx * k, y: height / 2 - cy * k };
}

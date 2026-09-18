// How one Natural Earth layer becomes a world file and a file per cell.
// Pure: no fs, no network, no knowledge of a command line. `naturalearth.mjs`
// reads this; this reads only `features.mjs` and the two pure geometry halves.
//
// M36a wrote the coastline, whose two levels are special enough to have their
// own pair of functions over there: its far level is `land-present.json`,
// which keeps the shape it has always had, and its near level is one feature
// per `z` because the shore has no identity to carry. M36b's four layers do
// have one — a lake is a lake, a desert is a desert, a peak is a peak — so
// they are built here, one Feature per source feature, and this file is what
// M36c's cities will be built by too.
//
// **What a cell holds is decided per layer** (M36 review, F1 and amendment
// A2), and the three answers are all here:
//
//   - `rivers` are **lines clipped to the cell**. A river is a stroke and a
//     stroke cut at a cell edge is still the same stroke; the two halves join
//     where the reader cannot see the join.
//   - `lakes` and `physical` are **whole features, assigned to every cell
//     their bbox overlaps and never clipped**, each carrying its Natural
//     Earth id so that M37 draws it once however many cells brought it. They
//     are filled *and* stroked, and a clipped ring's cut edge would be a
//     dashed hairline along a cell border — a shore, or a mountain range,
//     that does not exist.
//   - `mountains` are **points, by cell**: a point is in one cell and there
//     is nothing to cut.
//
// A cut edge is never part of a stroked ring. That one sentence is what the
// three answers are between them.

import { clipToBox, geometryBbox, splitAtMeridian } from './geometry.mjs';
import { keepRing, round, simplifyArc, simplifyLine } from './simplify.mjs';
import { allCells, cellBounds, cellOf } from './grid.mjs';
import {
  PROPERTIES, keptCity, layer, layerSources, lineLength, polygonArea, readFeature,
} from './features.mjs';

// --- the shapes a geometry comes in --------------------------------------

const polygonsOf = (g) => (g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : []);
const linesOf = (g) => (g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : []);

const asPolygons = (kept) => (kept.length === 0 ? null
  : kept.length === 1 ? { type: 'Polygon', coordinates: kept[0] }
    : { type: 'MultiPolygon', coordinates: kept });

const asLines = (kept) => (kept.length === 0 ? null
  : kept.length === 1 ? { type: 'LineString', coordinates: kept[0] }
    : { type: 'MultiLineString', coordinates: kept });

export function countPoints(geometry) {
  let n = 0;
  for (const rings of polygonsOf(geometry)) for (const ring of rings) n += ring.length;
  for (const line of linesOf(geometry)) n += line.length;
  return n;
}

// The measure a far-level floor is read against: a polygon by the area of its
// largest ring, a line by its length. Both are `features.mjs`'s, so the floor
// and the fallback `z` rule answer in the same unit.
export function measureOf(geometry) {
  return geometry?.type === 'LineString' || geometry?.type === 'MultiLineString'
    ? lineLength(geometry) : polygonArea(geometry);
}

// --- reading a layer's features ------------------------------------------

// Every feature of a layer, in file order and then feature order, as this
// atlas's fields. A feature the layer does not want is not counted; one whose
// table requires a name and has none is **dropped and reported**, never
// written with `undefined` in it.
//
// `places` is data/imports/naturalearth-places.json as a map, and it does two
// things for the one layer that has a `filter` — the cities (M36c). It is the
// second half of brief §3's rule, "**plus** every populated place a
// data/places/ record names, whatever its population", so a city under the
// hundred thousand survives when the atlas names it. And it puts `place` on
// the city, because data/imports/ is not in the deploy artifact and the
// browser can never read it (M36 review, F9): the link has to travel in the
// data or it does not travel at all.
//
// The filter is a filter and not a floor: `filtered` is how many the layer's
// own rule left out, at **both** levels and not only the far one, because
// "the cities over 100 000" is what this layer *is* and not what fits.
export function readLayer(id, sources, { places = new Map() } = {}) {
  const features = [];
  const dropped = [];
  let filtered = 0;
  const filter = layer(id)?.filter ?? null;
  for (const source of layerSources(id)) {
    const collection = sources[source.file];
    if (!collection) continue;
    for (const feature of collection.features ?? []) {
      const read = readFeature(id, feature);
      if (read === null) continue;
      if (read.dropped) {
        dropped.push(read.dropped);
        continue;
      }
      if (filter === 'population') {
        if (!keptCity(read, places)) {
          filtered += 1;
          continue;
        }
        const place = read.id === undefined ? undefined : places.get(read.id);
        if (place !== undefined) read.place = place;
      }
      features.push(read);
    }
  }
  return { features, dropped, filtered };
}

// --- one feature, taken down ---------------------------------------------

// A geometry simplified where it stands and then cut at the seam, or null
// when nothing worth drawing is left. Rings are held to a sixth of their own
// extent by `simplifyArc`, which is what keeps a small lake a shape and not a
// line; a line is held the same way by `simplifyLine`.
//
// The seam cut is not the cell cut. Everything under `data/geo/` has been cut
// at the meridian the map is cut at since M39a, because a shape that crosses
// it is drawn as a smear right across the picture; "never clipped" in
// amendment A2 is about the twenty-four cells and not about the seam.
export function takeDown(geometry, { tolerance, decimals, minArea = 0, seam, splitArea = 0 }) {
  let taken = null;
  if (geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') {
    const kept = [];
    for (const polygon of polygonsOf(geometry)) {
      const outer = keepRing(simplifyArc(polygon[0] ?? [], { tolerance, decimals }), minArea);
      if (!outer) continue;
      const rings = [outer];
      for (const hole of polygon.slice(1)) {
        const ring = keepRing(simplifyArc(hole, { tolerance, decimals }), minArea);
        if (ring) rings.push(ring);
      }
      kept.push(rings);
    }
    taken = asPolygons(kept);
  } else if (geometry?.type === 'LineString' || geometry?.type === 'MultiLineString') {
    const kept = [];
    for (const line of linesOf(geometry)) {
      const one = simplifyLine(line, { tolerance, decimals });
      if (one.length >= 2) kept.push(one);
    }
    taken = asLines(kept);
  }
  if (!taken) return null;
  return splitAtMeridian(taken, seam, { minArea: splitArea });
}

// One point, quantised to the same three decimals the geometry is: about
// 110 m, which is finer than a peak's position is known to.
// Every field is written only where the source gives one, so nothing carries
// `undefined` and nothing carries a number this atlas invented. A city's are
// amendment A6's: `id`, `name`, `nameEn` (only where it differs), `lon`,
// `lat`, `pop`, `z`, `zl`, `wikidata`, `place`. A peak's are what M36b wrote
// and are unchanged — no `pop` and no `wikidata` on one, by deviation 615.
export function pointOf(read, { decimals, carry = [] }) {
  const [lon, lat] = read.geometry?.coordinates ?? [];
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  const out = { lat: round(lat, decimals), lon: round(lon, decimals), z: read.z };
  if (read.id !== undefined) out.id = read.id;
  if (read.name !== undefined) out.name = read.name;
  if (read.nameEn !== undefined) out.nameEn = read.nameEn;
  if (read.elevation !== undefined) out.elevation = read.elevation;
  // And whatever else the layer's own row says it carries — `carry` on the
  // LAYERS row, so that adding a field to one point layer cannot add it to
  // another. The cities carry amendment A6's four; the peaks carry M38's `zl`
  // and nothing more, `wikidata` still read and not written there by deviation
  // 615.
  //
  // `zl` travels beside the name for the same reason it does in `featureOf`: a
  // peak the file did not name — 67 of the 711 — cannot be labelled at any
  // zoom, and a label zoom for a label that will never exist is bytes.
  for (const field of carry) {
    if (read[field] === undefined) continue;
    if (field === 'zl' && out.name === undefined) continue;
    out[field] = read[field];
  }
  return out;
}

// A Feature as the base map writes one. `z` is what M37 draws it from and
// `id` is what M37 draws it **once** by, where the file gives one: a lake
// whose bbox reaches four cells arrives four times and is one lake.
//
// `wikidata` is read by the import and is not written here: nothing in the
// browser follows it, M36c matches its cities against the source file and not
// against ours, and 614 lakes' worth of `"wikidata":"Q…"` is bytes out of a
// cap that decides how much coastline the reader gets.
// `zl` is M38's label zoom and travels beside the name, because it is only
// ever a question about the name: a feature the file gave none — every one of
// the 2,773 coast polygons, 610 of the 1,355 lakes, 88 of the 1,455 rivers —
// can never be labelled at any zoom, and an integer saying when to draw a
// label that does not exist is bytes out of the cap that decides how much
// coastline the reader gets. `readFeature` writes one for every feature all
// the same: what a nameless feature's label zoom *would* be is still the
// import's answer and not a hole in it.
// `kind` is M45a's family for the one layer that has families, and it travels
// for the reason `place` travels on a city: what a feature *is* decides how it
// is drawn, the browser never reads the Natural Earth file, and a stylesheet
// switching on `FEATURECLA` would be the allow-list copied into another
// language. It is absent on the 237 of 544 in the default family, which is
// what a feature with no `kind` draws as anyway.
export function featureOf(read, geometry) {
  const properties = { z: read.z };
  if (read.id !== undefined) properties.id = read.id;
  if (read.kind !== undefined) properties.kind = read.kind;
  if (read.name !== undefined) properties.name = read.name;
  if (read.nameEn !== undefined) properties.nameEn = read.nameEn;
  if (read.name !== undefined && read.zl !== undefined) properties.zl = read.zl;
  return { type: 'Feature', properties, geometry };
}

// --- the layer, taken down once ------------------------------------------

// Every feature simplified once, at this tolerance, before any cell sees it.
// Simplifying before clipping is what makes the union of the cells equal to
// the world: every cell is cut out of the same geometry, so no two cells
// disagree about where a shore or a river is.
//
// `floor` is the far level's, and it is what actually decides whether a layer
// fits its cap: a ring can never be fewer than four points and a Feature is
// about ninety bytes of scaffolding before a coordinate, so the *count* is the
// floor under the bytes and no tolerance alone can get under it (deviation
// 605, for the coastline). At the near level it is zero and nothing is
// dropped for being small.
export function takeLayer(layer, features, {
  tolerance, decimals, minArea = 0, seam, floor = 0, splitArea = 0,
}) {
  const taken = [];
  let points = 0;
  let belowFloor = 0;
  for (const read of features) {
    if (layer.geometry === 'point') {
      // A point has no extent, so a far-level floor on a point layer is read
      // off the number the layer is ranked by — a city's population — and
      // never off its geometry. The peaks have no floor and are unaffected.
      //
      // A city a place record names is **never** under it, whatever its size:
      // it is why the mapping exists, Panaji is 65,586 and the atlas has a
      // record for it, and the far level is the only place a reader sees
      // before a cell arrives. Twenty-six records cost almost nothing and the
      // rule the brief gives — "plus every populated place a data/places/
      // record names, whatever its population" — would mean very little if
      // the world file then dropped them for being small.
      if (floor > 0 && read.place === undefined && !(Number(read.pop) >= floor)) {
        belowFloor += 1;
        continue;
      }
      const point = pointOf(read, { decimals, carry: layer.carry ?? [] });
      if (!point) continue;
      taken.push({ read, point, key: cellOf(point.lon, point.lat) });
      points += 1;
      continue;
    }
    if (floor > 0 && measureOf(read.geometry) < floor) {
      belowFloor += 1;
      continue;
    }
    const geometry = takeDown(read.geometry, { tolerance, decimals, minArea, seam, splitArea });
    if (!geometry) continue;
    points += countPoints(geometry);
    taken.push({ read, geometry, bbox: geometryBbox(geometry) });
  }
  return { taken, points, belowFloor };
}

// --- the two levels -------------------------------------------------------

// The far level: one file for the whole world, which is what a reader sees
// before a cell arrives. A point layer is an array of small objects and not a
// FeatureCollection — a `Feature` around a peak is about a third scaffolding
// and none of the points is ever drawn as a shape (deviation 517).
export function worldValue(layer, taken) {
  if (layer.geometry === 'point') return taken.map((entry) => entry.point);
  return { type: 'FeatureCollection', features: taken.map((entry) => featureOf(entry.read, entry.geometry)) };
}

const overlaps = (b, box) => !(b[0] > box[2] || b[2] < box[0] || b[1] > box[3] || b[3] < box[1]);

// One cell's contents, or null when nothing of the layer is in it. **A cell
// with nothing in it is not written and is not in the manifest** (deviation
// 519): nothing is drawn that has no data, and an empty ocean cell is not
// worth a file and a request.
export function cellValue(layer, taken, key) {
  if (layer.geometry === 'point') {
    const points = taken.filter((entry) => entry.key === key).map((entry) => entry.point);
    return points.length ? points : null;
  }
  const box = cellBounds(key);
  const features = [];
  for (const entry of taken) {
    if (!entry.bbox || !overlaps(entry.bbox, box)) continue;
    if (layer.clip) {
      const piece = clipToBox(entry.geometry, box);
      if (!piece) continue;
      features.push(featureOf(entry.read, piece));
      continue;
    }
    features.push(featureOf(entry.read, entry.geometry));
  }
  return features.length ? { type: 'FeatureCollection', features } : null;
}

// Every non-empty cell of the layer, in key order, with what each holds.
export function cellValues(layer, taken) {
  const cells = [];
  for (const key of allCells()) {
    const value = cellValue(layer, taken, key);
    if (value) cells.push({ key, value });
  }
  return cells;
}

// How many points a cell's file holds, whichever of the two shapes it is in.
export function valuePoints(layer, value) {
  if (layer.geometry === 'point') return value.length;
  let n = 0;
  for (const feature of value.features) n += countPoints(feature.geometry);
  return n;
}

// Every point of a layer's sources, before anything was taken off: the number
// the budget's "points dropped" column is read against.
export function sourcePoints(features) {
  let n = 0;
  for (const read of features) {
    n += read.geometry?.type === 'Point' ? 1 : countPoints(read.geometry);
  }
  return n;
}

// The property table a layer is read through, for a caller that has only its
// id. Here rather than a second import of features.mjs at the call site.
export const tableOf = (id) => PROPERTIES[id] ?? null;

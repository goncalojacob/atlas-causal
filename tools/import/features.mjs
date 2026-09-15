// Natural Earth's properties → this atlas's fields, and the one table that
// turns Natural Earth's idea of zoom into ours. Pure: nothing here reads the
// disk, opens a socket or knows what a cell is.
//
// **No property name in this file was guessed.** Every one was read off the
// committed file it is used on, with `naturalearth.mjs --survey`, on
// 15 September 2026 against vendor/natural-earth/10m at the sha256 that
// vendor/SHA256SUMS records; the table the run chose is in STATUS.md
// (deviation 520). The comment on each row names the file its keys came from,
// because the 10 m files do not agree with one another on case: the physical
// regions and the populated places shout their keys and the land, the lakes,
// the rivers and the elevation points whisper them.

import { ringArea } from './simplify.mjs';
import { geometryBbox, ringsOf } from './geometry.mjs';

// --- the zoom table ------------------------------------------------------
//
// Natural Earth's `min_zoom` is a web-Mercator tile zoom. Ours is `k`, the
// multiplier over a 960-unit world where `k = 1` is the whole world
// (src/map/projection.js since M39a), and the two are not the same unit:
// NE zoom ≈ log2(k) + 1.9, so a literal conversion puts 2,059 of the 3,085
// cities over 100 000 at k ≥ 32 and most of the base map never appears at all
// (M36 review, F4).
//
// So the conversion is a table and not a formula, and the table is gentler
// than the formula on purpose: it is **monotone** — a feature Natural Earth
// draws earlier is never drawn later here — and **everything it can return is
// visible by k = 16**, which is well inside the k = 40 the map allows. What
// that buys is a map that fills in as the reader goes down rather than one
// that stays empty until the last step and then arrives all at once.
//
// Amendment A4 of the M36 review: this is the one frozen table, `minZoom` in
// the manifest is in the same unit, and M38's `zl` will be too.
export const Z_BY_NE_ZOOM = Object.freeze([1, 1, 1, 2, 3, 4, 6, 8, 12, 16]);

// Everything is on the map by this `k`. Named because STATUS.md records it
// and because a table that stopped being true of it would be a table that
// hides part of the world at every zoom the atlas has.
export const Z_VISIBLE_BY = 16;

// Natural Earth's zoom → ours. Half steps (6.5, 6.7, 7.1 all occur) round to
// the nearest whole one; anything past the end of the table is the last row,
// which is what "everything visible by k = 16" means.
export function zOf(neZoom) {
  if (!Number.isFinite(neZoom)) return Z_VISIBLE_BY;
  const i = Math.min(Math.max(Math.round(neZoom), 0), Z_BY_NE_ZOOM.length - 1);
  return Z_BY_NE_ZOOM[i];
}

// --- the fallbacks, where a file gives no rank ---------------------------
//
// One feature of ne_10m_land carries 2,773 polygons and no `featurecla`, no
// `scalerank` and no `min_zoom` at all, so a rule of our own is not optional
// (brief §1). Each fallback answers in Natural Earth's own unit and goes
// through the table above, so there is still one conversion and not four.

// Square degrees. Not an area — the atlas is equirectangular — but the
// question is "is this big enough to draw at this zoom", and every answer is
// wrong in the same direction.
export const AREA_TO_NE_ZOOM = Object.freeze([
  Object.freeze({ at: 100, zoom: 0 }),
  Object.freeze({ at: 10, zoom: 2 }),
  Object.freeze({ at: 1, zoom: 4 }),
  Object.freeze({ at: 0.1, zoom: 5 }),
  Object.freeze({ at: 0.01, zoom: 6 }),
  Object.freeze({ at: 0.001, zoom: 7 }),
]);

export const LENGTH_TO_NE_ZOOM = Object.freeze([
  Object.freeze({ at: 40, zoom: 1 }),
  Object.freeze({ at: 10, zoom: 3 }),
  Object.freeze({ at: 3, zoom: 5 }),
  Object.freeze({ at: 1, zoom: 6 }),
  Object.freeze({ at: 0.3, zoom: 7 }),
]);

export const POPULATION_TO_NE_ZOOM = Object.freeze([
  Object.freeze({ at: 5e6, zoom: 1 }),
  Object.freeze({ at: 1e6, zoom: 3 }),
  Object.freeze({ at: 500e3, zoom: 4 }),
  Object.freeze({ at: 200e3, zoom: 5 }),
  Object.freeze({ at: 100e3, zoom: 6 }),
]);

// The first row a measure reaches, or one past the end of the ladder. The
// ladders are in descending order of `at`, so this is monotone: a bigger
// thing is never given a later zoom than a smaller one.
function ladder(rows, measure) {
  for (const row of rows) {
    if (measure >= row.at) return row.zoom;
  }
  return rows[rows.length - 1].zoom + 1;
}

// The largest ring of a polygon geometry, in square degrees: a MultiPolygon
// of an archipelago is as visible as its biggest island, not as the sum.
export function polygonArea(geometry) {
  let largest = 0;
  for (const ring of ringsOf(geometry)) {
    const area = Math.abs(ringArea(ring));
    if (area > largest) largest = area;
  }
  return largest;
}

// Degrees along the line, summed. Planar, for the same reason.
export function lineLength(geometry) {
  let total = 0;
  for (const line of ringsOf(geometry)) {
    for (let i = 1; i < line.length; i += 1) total += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  }
  return total;
}

export const neZoomByArea = (area) => ladder(AREA_TO_NE_ZOOM, area);
export const neZoomByLength = (length) => ladder(LENGTH_TO_NE_ZOOM, length);
export const neZoomByPopulation = (population) => ladder(POPULATION_TO_NE_ZOOM, population);

// --- the property tables -------------------------------------------------
//
// One per layer. `name`, `nameEn`, `scaleRank`, `minZoom`, `population`,
// `elevation`, `wikidata` and `id` are the property each field is read off;
// null where the file has no such column. `class` is the property that says
// what kind of thing a feature is and `drop` / `keep` are what is done with
// it: `drop` is a deny-list and `keep` an allow-list, and a layer has at most
// one of them.
//
// `fallback` is the rule for a feature with neither a scale rank nor a
// min_zoom, which is not a hypothetical: see `coast`.

export const PROPERTIES = Object.freeze({
  // ne_10m_land.geojson — three keys in the whole file: featurecla,
  // scalerank, min_zoom. Nine of its eleven features are `Land`, one is the
  // 0,0 marker Natural Earth ships as `Null island`, and one carries 2,773
  // polygons with every property null. ne_10m_minor_islands.geojson has the
  // same three keys and one class, `Minor island`.
  coast: Object.freeze({
    class: 'featurecla',
    drop: Object.freeze(['Null island']),
    name: null,
    nameEn: null,
    scaleRank: 'scalerank',
    minZoom: 'min_zoom',
    population: null,
    elevation: null,
    wikidata: null,
    id: null,
    fallback: 'area',
  }),
  // ne_10m_rivers_lake_centerlines.geojson — ten keys, all lower case.
  rivers: Object.freeze({
    class: 'featurecla',
    drop: null,
    name: 'name',
    nameEn: 'name_en',
    scaleRank: 'scalerank',
    minZoom: 'min_zoom',
    population: null,
    elevation: null,
    wikidata: null,
    id: 'ne_id',
    fallback: 'length',
  }),
  // ne_10m_lakes.geojson — lower case, and it does carry wikidataid and ne_id.
  lakes: Object.freeze({
    class: 'featurecla',
    drop: null,
    name: 'name',
    nameEn: 'name_en',
    scaleRank: 'scalerank',
    minZoom: 'min_zoom',
    population: null,
    elevation: null,
    wikidata: 'wikidataid',
    id: 'ne_id',
    fallback: 'area',
  }),
  // ne_10m_geography_regions_polys.geojson — upper case. The allow-list is
  // amendment A5's: without it the layer draws the coast a third time, since
  // 295 Island, 160 Island group, 37 Coast, 7 Continent, 3 Lake and one
  // Dragons-be-here are in the same file as the deserts and the ranges.
  physical: Object.freeze({
    class: 'FEATURECLA',
    keep: Object.freeze([
      'Range/mtn', 'Desert', 'Plateau', 'Plain', 'Pen/cape', 'Peninsula', 'Basin',
      'Depression', 'Valley', 'Lowland', 'Delta', 'Isthmus', 'Foothills', 'Tundra',
      'Wetlands', 'Gorge', 'Geoarea',
    ]),
    name: 'NAME',
    nameEn: null,
    scaleRank: 'SCALERANK',
    minZoom: null,
    population: null,
    elevation: null,
    wikidata: 'WIKIDATAID',
    id: 'NE_ID',
    fallback: 'area',
  }),
  // ne_10m_geography_regions_elevation_points.geojson — lower case, and all
  // 711 of its features carry `elevation` (M36 review, A5), so there is no
  // "the file gives no height" path and nothing invents one.
  mountains: Object.freeze({
    class: 'featurecla',
    drop: null,
    name: 'name',
    nameEn: 'name_en',
    scaleRank: 'scalerank',
    minZoom: 'min_zoom',
    population: null,
    elevation: 'elevation',
    wikidata: 'wikidataid',
    id: 'ne_id',
    fallback: null,
  }),
  // ne_10m_populated_places.geojson — 137 keys per city, upper case, of which
  // these ten are read and the other 127 are not. POP_MAX and not POP_MIN:
  // the metropolitan figure is what "over 100 000" is about.
  cities: Object.freeze({
    class: 'FEATURECLA',
    drop: null,
    name: 'NAME',
    nameEn: 'NAME_EN',
    scaleRank: 'SCALERANK',
    minZoom: 'MIN_ZOOM',
    population: 'POP_MAX',
    elevation: null,
    wikidata: 'WIKIDATAID',
    id: 'NE_ID',
    fallback: 'population',
  }),
});

// --- the layers this import writes ---------------------------------------
//
// `id` is the manifest's and the directory's; `geometry` is the shape the
// **near** level is in and is what M37 dispatches on; `world` is the far
// level's file under data/, or null where the layer has none.
//
// `coast` has no `world` of its own because its far level **is**
// `manifest.land`, which loadAtlas already fetches at first paint; a second
// copy under base/ would be the same coastline twice (deviation 518). And its
// near level is `line` and not `polygon`: a polygon clipped to a cell is
// filled *and* stroked, and .land's cobalt stroke would then draw a straight
// line across a continent at every cell border (M36 review, F1 and A2).
export const LAYERS = Object.freeze([
  Object.freeze({
    id: 'coast',
    geometry: 'line',
    minZoom: 1,
    dir: 'coast',
    world: null,
    landFile: 'geo/land-present.json',
    sources: Object.freeze(['ne_10m_land.geojson', 'ne_10m_minor_islands.geojson']),
  }),
]);

export const LAYER_IDS = Object.freeze(LAYERS.map((layer) => layer.id));

export function layer(id) {
  return LAYERS.find((entry) => entry.id === id) ?? null;
}

// --- reading one feature -------------------------------------------------

const value = (properties, key) => (key === null || key === undefined ? null : properties?.[key] ?? null);

// Is this feature one of the layer's at all? An allow-list where the table
// has one, a deny-list where it has one, and everything otherwise.
export function kept(table, properties) {
  const kind = value(properties, table.class);
  if (table.keep) return kind !== null && table.keep.includes(kind);
  if (table.drop) return !table.drop.includes(kind);
  return true;
}

// The `z` of one feature: Natural Earth's own zoom where the file has one,
// its scale rank where it has that instead, and the layer's fallback rule
// over the geometry where it has neither. Always a number, because a feature
// written with `z: undefined` is a feature M37 draws at every zoom.
export function zFor(table, properties, geometry) {
  const minZoom = value(properties, table.minZoom);
  if (Number.isFinite(minZoom)) return zOf(minZoom);
  const rank = value(properties, table.scaleRank);
  if (Number.isFinite(rank)) return zOf(rank);
  switch (table.fallback) {
    case 'area': return zOf(neZoomByArea(polygonArea(geometry)));
    case 'length': return zOf(neZoomByLength(lineLength(geometry)));
    case 'population': return zOf(neZoomByPopulation(Number(value(properties, table.population)) || 0));
    default: return Z_VISIBLE_BY;
  }
}

// One Natural Earth feature as this atlas's fields, or null when the layer
// does not want it. A feature with no geometry, or one whose table names it a
// name and the feature has none, is **dropped and reported** rather than
// written with `undefined` in it: a label reading "undefined" on the map is
// worse than no label (brief, test 3).
//
// Names are carried through exactly as the file has them. Escaping is
// `esc()`'s job in the browser and not the import's — an import that escaped
// would put `&amp;` in a file and the browser would show it.
export function readFeature(layerId, feature) {
  const table = PROPERTIES[layerId];
  if (!table) return null;
  const properties = feature?.properties ?? {};
  if (!feature?.geometry) return { dropped: 'no geometry' };
  if (!kept(table, properties)) return null;
  const name = value(properties, table.name);
  if (table.name && (typeof name !== 'string' || name === '')) return { dropped: 'no name' };
  const out = { z: zFor(table, properties, feature.geometry), geometry: feature.geometry };
  if (name !== null) out.name = name;
  const nameEn = value(properties, table.nameEn);
  // Only where it differs: `NAME_EN` equals `NAME` for most of the world and
  // a second copy of the same string is bytes for nothing (A6).
  if (typeof nameEn === 'string' && nameEn !== '' && nameEn !== name) out.nameEn = nameEn;
  const id = value(properties, table.id);
  if (id !== null) out.id = String(id);
  const wikidata = value(properties, table.wikidata);
  if (typeof wikidata === 'string' && wikidata !== '') out.wikidata = wikidata;
  const elevation = value(properties, table.elevation);
  if (Number.isFinite(elevation)) out.elevation = elevation;
  const population = value(properties, table.population);
  if (Number.isFinite(population)) out.pop = population;
  return out;
}

// --- the survey ----------------------------------------------------------

// Which property keys a collection actually has, with how many features carry
// one and a value or two, so the table above is read off the file rather than
// assumed. Pure, and sorted, so two runs print the same page.
export function surveyProperties(collection, { samples = 2 } = {}) {
  const rows = new Map();
  for (const feature of collection?.features ?? []) {
    for (const [key, raw] of Object.entries(feature?.properties ?? {})) {
      if (!rows.has(key)) rows.set(key, { key, present: 0, samples: [] });
      const row = rows.get(key);
      if (raw === null || raw === undefined || raw === '') continue;
      row.present += 1;
      if (row.samples.length < samples && !row.samples.includes(raw)) row.samples.push(raw);
    }
  }
  return [...rows.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

// What a survey says about the file as a whole: how many features, which
// geometry types, how many points, and the box they are in. `geometryBbox`
// knows rings and lines and not points — three of the seven files are point
// files, so the point is answered here rather than by widening M39's clipper.
export function surveyShape(collection) {
  const features = collection?.features ?? [];
  const types = new Set();
  let points = 0;
  let box = null;
  const widen = (b) => {
    box = box === null ? [...b]
      : [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])];
  };
  for (const feature of features) {
    const geometry = feature?.geometry;
    if (geometry?.type) types.add(geometry.type);
    if (geometry?.type === 'Point') {
      const [lon, lat] = geometry.coordinates ?? [];
      points += 1;
      if (Number.isFinite(lon) && Number.isFinite(lat)) widen([lon, lat, lon, lat]);
      continue;
    }
    for (const ring of ringsOf(geometry)) points += ring.length;
    const b = geometryBbox(geometry);
    if (b) widen(b);
  }
  return { features: features.length, types: [...types].sort(), points, box };
}

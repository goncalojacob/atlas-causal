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
// The five band edges, which are M45b's and are frozen there beside the grid
// they are cut out of. Named here so that the layer table and the manifest
// carry the same five numbers the contouring used.
import { BAND_EDGES } from './elevation.mjs';

export { BAND_EDGES };

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

// --- what kind of ground a physical region is ----------------------------
//
// `ne_10m_geography_regions_polys` carries seventeen classes this atlas keeps
// and M36b drew all seventeen the same way: one dashed hairline, so a desert
// and a mountain range were the same mark. **The families are the brief's**
// (M45a, §1.1) and they are decided here rather than in CSS, because a
// stylesheet that switched on `FEATURECLA` would be a second copy of the
// allow-list above, in another language, free to fall out of step with it.
//
//   relief   Range/mtn, Foothills          — ground that rises
//   cover    Desert, Tundra, Wetlands      — ground of a kind, at any height
//   hollow   Basin, Depression, Valley     — ground that dips
//   outline  everything else               — what all seventeen looked like
//
// Four families and not seventeen for the reason the whole milestone exists:
// the ground is what the territories moved around and never the subject, and
// seventeen marks on one map would be a legend nobody asked for.
export const PHYSICAL_FAMILIES = Object.freeze({
  'Range/mtn': 'relief',
  Foothills: 'relief',
  Desert: 'cover',
  Tundra: 'cover',
  Wetlands: 'cover',
  Basin: 'hollow',
  Depression: 'hollow',
  Valley: 'hollow',
});

// The family a class this table does not name falls to, which is what the
// plateaus, the plains, the capes, the peninsulas, the lowlands, the deltas,
// the isthmuses, the gorges and the geoareas are — and what an unknown
// `FEATURECLA` is, rather than a throw. It is the mark M36b gave all of them.
export const PHYSICAL_DEFAULT_FAMILY = 'outline';

// Every family that exists, the default included. The browser holds the same
// closed list (src/map/layers/base.js): a `kind` is written into a class
// attribute, data from `data/` is untrusted input, and neither end trusts the
// other to have filtered it.
export const PHYSICAL_KINDS = Object.freeze([
  ...new Set([...Object.values(PHYSICAL_FAMILIES), PHYSICAL_DEFAULT_FAMILY]),
].sort());

// The family of one feature, through its layer's table. Always a string: a
// class the table does not name is the default family and never an error,
// which is what keeps a Natural Earth release that adds a class from stopping
// an import.
export function familyOf(table, properties) {
  if (!table?.families) return null;
  const kind = value(properties, table.class);
  return table.families[kind] ?? table.defaultFamily ?? PHYSICAL_DEFAULT_FAMILY;
}

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
//
// `nameRequired` says what to do with a feature the file gave no name: drop
// it and say so, or write it without one. It is true for the cities alone. A
// nameless city is a dot the map can never explain and Natural Earth has
// none; a nameless lake is 610 of the 1,355 in the file and a nameless river
// 88 of the 1,455, and the brief keeps **every** lake and every centreline
// (§3). Either way nothing is ever written with `undefined` in it, which is
// the rule test 3 is about.

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
  // ne_10m_rivers_lake_centerlines.geojson — ten keys, all lower case, and
  // the one file of the seven with neither `ne_id` nor `wikidataid`: a river
  // has no stable id to carry and M36b keys it by nothing.
  rivers: Object.freeze({
    class: 'featurecla',
    drop: null,
    name: 'name',
    nameEn: 'name_en',
    scaleRank: 'scalerank',
    minZoom: 'min_zoom',
    label: 'min_label',
    population: null,
    elevation: null,
    wikidata: null,
    id: null,
    nameRequired: false,
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
    label: 'min_label',
    population: null,
    elevation: null,
    wikidata: 'wikidataid',
    id: 'ne_id',
    nameRequired: false,
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
    // The one table with families: the class that decides whether a feature
    // is kept at all also decides how it is drawn (M45a, §1.1).
    families: PHYSICAL_FAMILIES,
    defaultFamily: PHYSICAL_DEFAULT_FAMILY,
    name: 'NAME',
    nameEn: null,
    scaleRank: 'SCALERANK',
    minZoom: null,
    label: 'MIN_LABEL',
    population: null,
    elevation: null,
    wikidata: 'WIKIDATAID',
    id: 'NE_ID',
    nameRequired: false,
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
    nameRequired: false,
    fallback: null,
  }),
  // The bands, from `tools/import/elevation.mjs` and not from a download.
  // The only table here whose keys were **written** rather than surveyed off a
  // committed file, because the collection is built in this repository; it
  // goes through this table all the same, so that there is one path from a
  // source to a cell and not two.
  //
  // `min_zoom` is 0 on all five, which this table's own ladder turns into
  // `z = 1`: relief is ground and is drawn at every zoom the map has, the way
  // the coastline is. There is no name, no id and no rank: a band is not a
  // thing with a name, and an id would be dedupe-by-id across the cells a band
  // is clipped into, which would draw one cell of it and drop the rest.
  relief: Object.freeze({
    class: null,
    drop: null,
    name: null,
    nameEn: null,
    scaleRank: null,
    minZoom: 'min_zoom',
    band: 'band',
    population: null,
    elevation: null,
    wikidata: null,
    id: null,
    nameRequired: false,
    fallback: null,
  }),
  // ne_10m_populated_places.geojson — 137 keys per city, upper case, of which
  // these ten are read and the other 127 are not. POP_MAX and not POP_MIN:
  // the metropolitan figure is what "over 100 000" is about, and all 7,342
  // carry one.
  //
  // `label` is LABELRANK and **not** MIN_LABEL: the rivers, the lakes and the
  // physical regions have a `min_label` and this file has none — the survey of
  // 15 September is what says so — so M38's `zl` goes through the same table
  // `z` does, from the rank Natural Earth ranks its labels by (deviation 624).
  // 7,341 of the 7,342 carry it; the one that does not falls to `z + 1` with
  // the peaks and the coast, which have no rank of any kind.
  cities: Object.freeze({
    class: 'FEATURECLA',
    drop: null,
    name: 'NAME',
    nameEn: 'NAME_EN',
    scaleRank: 'SCALERANK',
    minZoom: 'MIN_ZOOM',
    label: 'LABELRANK',
    population: 'POP_MAX',
    elevation: null,
    wikidata: 'WIKIDATAID',
    id: 'NE_ID',
    nameRequired: true,
    fallback: 'population',
  }),
});

// The population filter of brief §3: over a hundred thousand, **plus every
// populated place a data/places/ record names, whatever its population**
// (`data/imports/naturalearth-places.json` decides the second half). Strictly
// over and not at: 3,085 of the 7,342 are over it and four more are exactly
// on it, and "over 100 000" is what the brief says.
//
// A city with no population figure is kept only where a place record names
// it, which on this file is no city at all — POP_MAX is on all 7,342.
export const CITY_POPULATION = 100000;

// Whether this atlas draws a city, given the mapping. `read` is one feature
// as readFeature returned it.
export function keptCity(read, places = new Map(), { minimum = CITY_POPULATION } = {}) {
  if (read?.id !== undefined && places.has(read.id)) return true;
  return Number.isFinite(read?.pop) && read.pop > minimum;
}

// --- the layers this import writes ---------------------------------------
//
// What the manifest's `base` block says it was built from. Here and not in
// naturalearth.mjs because tools/lib/read.mjs needs them to build the block
// and naturalearth.mjs reads build-index.mjs, which reads read.mjs: this file
// imports nothing but the two pure halves of the geometry, so nothing that
// reads it can end up in a cycle.
// The one committed file a city is read off, named once: `--places` reads it
// before it has a layer to ask for it, and the `cities` row below reads the
// same constant. It is here and not in places.mjs because features.mjs
// imports nothing but the two pure geometry halves, and places.mjs reads the
// property table off this file — the other way round would be a cycle.
export const CITIES_SOURCE = 'ne_10m_populated_places.geojson';

// And the one source that is not a Natural Earth download: the committed
// elevation grid M45b cuts the bands out of. It is named here for the same
// reason the cities' file is — the layer row below reads it, and the import
// has to know which of its sources is not GeoJSON before it opens any of them.
export const ELEVATION_SOURCE = 'etopo5-10min.i2';

export const BASE_SOURCE = 'natural-earth-10m';
export const BASE_VERSION = 'v5.1.2';
export const BASE_GEO_DIR = 'geo/base';
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
// `clip` is amendment A2's answer for the layer: true where a cell holds the
// piece of the feature inside it, false where it holds the whole feature and
// M37 deduplicates by `id`. A lake and a mountain range are filled *and*
// stroked, and a clipped ring's cut edge would be a dashed hairline along a
// cell border — a shore that does not exist. A river and the coast are
// strokes already, and a stroke cut at a cell edge is the same stroke.
//
// `sources` is which committed file the layer reads and whether the **far**
// level draws from it: the minor islands are near-level only, being 2,795
// polygons at Natural Earth's own zoom 6.5 — nothing a reader can see at the
// world — and the far coastline has 200 KB for the whole planet.
export const LAYERS = Object.freeze([
  // The bands, first in the table because they are first on the page: relief
  // is the ground everything else is drawn on, and M45b's §2.4 gives it the
  // bottom of the pile and the only fill across open land. `bands` is what
  // puts the five frozen edges in the manifest, so a reader — and a test —
  // can see what the tints mean without opening the import.
  //
  // `clip: true`, which no other polygon layer here is: a band is one feature
  // for the whole world, so a cell that held whole features by bbox would hold
  // every band in full. The cut edge that rule exists to avoid is a cut edge
  // that gets **stroked**, and the bands are fill and no stroke at all
  // (src/style.css) — which is also why they carry no `id` to be drawn once
  // by: every cell holds its own piece, and the pieces abut.
  //
  // `ceiling` is M45b §2.5's: 6 MB of its own, inside `data/geo/`'s 24 MB and
  // **outside** the base map's 8 MB, which would otherwise have 2.11 MB free.
  // A layer with a ceiling of its own is counted against it and against
  // nothing else, and the import refuses to write over it.
  Object.freeze({
    id: 'relief',
    geometry: 'polygon',
    minZoom: 1,
    dir: 'relief',
    clip: true,
    bands: BAND_EDGES,
    ceiling: 6 * 1024 * 1024,
    // The far level's ring floor, in square degrees, and it is the coastline's
    // argument (deviation 605) for a layer whose five features are the whole
    // world: the far-level *feature* floor can never drop anything here, so
    // what decides whether the bands fit 400 KB is the number of **rings** —
    // eleven thousand of them, four points and thirty bytes of brackets each
    // at any tolerance at all. 0.2 square degrees is about 0.45° on a side,
    // which is 1.2 SVG units at k = 1 and cannot be seen; what it leaves is
    // 400 KB at 0.4°, the very tolerance the far coastline is drawn at.
    // Nothing is floored at the near level, where the ridge under a frontier
    // has to be a ridge.
    farMinArea: 0.2,
    world: 'geo/base/relief-world.json',
    sources: Object.freeze([Object.freeze({ file: ELEVATION_SOURCE, far: true })]),
  }),
  Object.freeze({
    id: 'coast',
    geometry: 'line',
    minZoom: 1,
    dir: 'coast',
    clip: true,
    world: null,
    landFile: 'geo/land-present.json',
    sources: Object.freeze([
      Object.freeze({ file: 'ne_10m_land.geojson', far: true }),
      Object.freeze({ file: 'ne_10m_minor_islands.geojson', far: false }),
    ]),
  }),
  Object.freeze({
    id: 'rivers',
    geometry: 'line',
    minZoom: 1,
    dir: 'rivers',
    clip: true,
    world: 'geo/base/rivers-world.json',
    sources: Object.freeze([Object.freeze({ file: 'ne_10m_rivers_lake_centerlines.geojson', far: true })]),
  }),
  Object.freeze({
    id: 'lakes',
    geometry: 'polygon',
    minZoom: 1,
    dir: 'lakes',
    clip: false,
    world: 'geo/base/lakes-world.json',
    sources: Object.freeze([Object.freeze({ file: 'ne_10m_lakes.geojson', far: true })]),
  }),
  Object.freeze({
    id: 'physical',
    geometry: 'polygon',
    minZoom: 1,
    dir: 'physical',
    clip: false,
    world: 'geo/base/physical-world.json',
    sources: Object.freeze([Object.freeze({ file: 'ne_10m_geography_regions_polys.geojson', far: true })]),
  }),
  Object.freeze({
    id: 'mountains',
    geometry: 'point',
    minZoom: 1,
    dir: 'mountains',
    clip: false,
    // A peak's name is drawn at its own label zoom like every other, so it
    // carries one and nothing else beyond what M36b wrote: `wikidata` is still
    // read and not written here (deviation 615).
    carry: Object.freeze(['zl']),
    world: 'geo/base/mountains-world.json',
    sources: Object.freeze([Object.freeze({ file: 'ne_10m_geography_regions_elevation_points.geojson', far: true })]),
  }),
  // The one layer that is filtered rather than simplified (M36c). Which
  // cities are in it is brief §3's two rules and not a tolerance: over a
  // hundred thousand, plus every populated place a place record names. The
  // second half is `data/imports/naturalearth-places.json`, which also puts
  // `place` on the city — the browser never fetches data/imports/ (M36
  // review, F9), so the link has to travel in the data.
  Object.freeze({
    id: 'cities',
    geometry: 'point',
    minZoom: 1,
    dir: 'cities',
    clip: false,
    filter: 'population',
    // Amendment A6's fields, beyond the id, the name and the point every
    // point layer writes. On this row and not in pointOf, so that a field
    // added to the cities cannot appear on the peaks.
    carry: Object.freeze(['pop', 'zl', 'wikidata', 'place']),
    world: 'geo/base/cities-world.json',
    sources: Object.freeze([Object.freeze({ file: CITIES_SOURCE, far: true })]),
  }),
]);

// Which files a layer reads, and which of them the far level draws from.
export function layerSources(id) {
  return layer(id)?.sources ?? [];
}

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
  const named = typeof name === 'string' && name !== '';
  if (table.name && table.nameRequired && !named) return { dropped: 'no name' };
  const out = { z: zFor(table, properties, feature.geometry), geometry: feature.geometry };
  if (named) out.name = name;
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
  // M38's label zoom, in `k` like `z` and through the same frozen table
  // (amendment A4, and M38's A2). Never earlier than the dot itself: a name
  // on the map before the mark it names would be a label pointing at nothing,
  // and Natural Earth's two ranks do not promise to agree.
  //
  // **Every feature has one**, because M38's placer has to decide about every
  // feature and "no zl" would be a feature whose name appears at no zoom at
  // all. Where the file ranks its labels the rank decides; where it does not —
  // the peaks, the coast, and the one populated place of 7,342 with no
  // LABELRANK — it is `z + 1`, one rung of the reader's own descent after the
  // dot. That is a rule and not an invented rank: it says "after the mark",
  // which is the only thing this atlas actually knows.
  const label = value(properties, table.label);
  out.zl = Number.isFinite(label) ? Math.max(zOf(label), out.z) : out.z + 1;
  // M45a's family, for the one layer that has families. Written **only where
  // it is not the default**, which is the rule `nameEn` and `zl` are already
  // written by: the default family is what a feature with no `kind` draws as
  // at the other end, so the key would say what its absence already says.
  // 307 of the 544 carry one and 237 do not, and the run that added it moved
  // the base map by 6.5 KB of 5.93 MB.
  const family = familyOf(table, properties);
  if (family !== null && family !== (table.defaultFamily ?? PHYSICAL_DEFAULT_FAMILY)) out.kind = family;
  // M45b's band, for the one layer that has bands. An integer and nothing
  // else: which of the five heights this polygon is between is what decides
  // its tint, and the tint is in `src/style.css` where every colour is.
  const band = value(properties, table.band);
  if (Number.isInteger(band)) out.band = band;
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

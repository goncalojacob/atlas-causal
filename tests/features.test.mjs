// The property table and the zoom table the base map's import reads Natural
// Earth through. Pure, so all of it runs on objects written here.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CITY_POPULATION, LAYERS, PHYSICAL_DEFAULT_FAMILY, PHYSICAL_FAMILIES, PHYSICAL_KINDS,
  PROPERTIES, Z_BY_NE_ZOOM, Z_VISIBLE_BY, familyOf, kept, keptCity, layer,
  lineLength, polygonArea, readFeature, surveyProperties, surveyShape, zFor, zOf,
} from '../tools/import/features.mjs';

const square = (x, y, size) => ({
  type: 'Polygon',
  coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]],
});

test('the zoom table is monotone and everything is visible by k = 16', () => {
  for (let i = 1; i < Z_BY_NE_ZOOM.length; i += 1) {
    assert.ok(Z_BY_NE_ZOOM[i] >= Z_BY_NE_ZOOM[i - 1], `row ${i} is not below row ${i - 1}`);
  }
  assert.equal(Math.max(...Z_BY_NE_ZOOM), Z_VISIBLE_BY);
  assert.equal(Z_VISIBLE_BY, 16);
  // Natural Earth's own range, half steps and all, and everything past it.
  for (const zoom of [0, 0.5, 1.5, 5, 6.5, 6.7, 7.1, 9, 10, 12, 100]) {
    const z = zOf(zoom);
    assert.ok(z >= 1 && z <= Z_VISIBLE_BY, `NE zoom ${zoom} → k ${z} is on the map`);
  }
  assert.equal(zOf(0), 1, 'what Natural Earth draws at the world is drawn at the world');
  assert.equal(zOf(100), Z_VISIBLE_BY, 'and the 0,0 marker\'s absurd zoom is still on the map');
  assert.equal(zOf(null), Z_VISIBLE_BY);
  assert.equal(zOf(undefined), Z_VISIBLE_BY);
});

test('z comes from min_zoom where there is one, and the scale rank where there is not', () => {
  const table = PROPERTIES.coast;
  const geometry = square(0, 0, 1);
  assert.equal(zFor(table, { min_zoom: 0, scalerank: 6 }, geometry), zOf(0), 'min_zoom wins');
  assert.equal(zFor(table, { min_zoom: null, scalerank: 6 }, geometry), zOf(6), 'the rank is the fallback before the rule');
  assert.equal(zFor(table, { min_zoom: 6.5, scalerank: 7 }, geometry), zOf(7), 'a half step rounds');
});

test('z comes from the fallback rule where a feature has neither', () => {
  // The one ne_10m_land feature with 2,773 polygons and every property null.
  const table = PROPERTIES.coast;
  const big = zFor(table, { min_zoom: null, scalerank: null }, square(0, 0, 20));
  const middling = zFor(table, { min_zoom: null, scalerank: null }, square(0, 0, 2));
  const tiny = zFor(table, { min_zoom: null, scalerank: null }, square(0, 0, 0.02));
  assert.ok(big < middling && middling < tiny, `${big} < ${middling} < ${tiny}: bigger is drawn sooner`);
  assert.ok(tiny <= Z_VISIBLE_BY, 'and the smallest island is still on the map by k = 16');
});

test('the fallbacks measure what they say they measure', () => {
  assert.equal(polygonArea(square(0, 0, 3)), 9);
  // A MultiPolygon is as visible as its largest island, not as the sum: an
  // archipelago of specks is not a continent.
  const archipelago = { type: 'MultiPolygon', coordinates: [square(0, 0, 1).coordinates, square(10, 0, 3).coordinates] };
  assert.equal(polygonArea(archipelago), 9);
  assert.equal(lineLength({ type: 'LineString', coordinates: [[0, 0], [3, 0], [3, 4]] }), 7);
});

test('a feature the layer does not want is not one of its features', () => {
  // coast: a deny-list. Natural Earth ships a `Null island` marker at 0,0.
  assert.equal(kept(PROPERTIES.coast, { featurecla: 'Land' }), true);
  assert.equal(kept(PROPERTIES.coast, { featurecla: 'Null island' }), false);
  assert.equal(kept(PROPERTIES.coast, { featurecla: null }), true, 'the unclassed feature is land too');
  // physical: an allow-list, because the file holds 295 islands and 37
  // coasts that would draw the coastline a third time.
  assert.equal(kept(PROPERTIES.physical, { FEATURECLA: 'Desert' }), true);
  assert.equal(kept(PROPERTIES.physical, { FEATURECLA: 'Island' }), false);
  assert.equal(kept(PROPERTIES.physical, { FEATURECLA: 'Dragons-be-here' }), false);
  assert.equal(kept(PROPERTIES.physical, {}), false, 'no class at all is not on the allow-list');
});

test('a feature is never written with undefined in it, whatever its file left out', () => {
  const geometry = square(0, 0, 1);
  const named = readFeature('lakes', { properties: { name: 'Lake Chad', scalerank: 3 }, geometry });
  assert.equal(named.name, 'Lake Chad');
  assert.equal(named.dropped, undefined);
  // A nameless lake is written without a name and not with `undefined` in it.
  // 610 of the 1,355 lakes in the file have no name, and 88 of the 1,455
  // rivers; the brief keeps every lake and every centreline, and a lake that
  // exists is worth drawing whether or not anybody has named it.
  const nameless = readFeature('lakes', { properties: { scalerank: 3 }, geometry });
  assert.equal(nameless.dropped, undefined, 'kept');
  assert.equal(Object.hasOwn(nameless, 'name'), false, 'and with no name key at all');
  // A city is the one layer whose name is required: a dot the map can never
  // explain is worse than no dot, and Natural Earth has no nameless city.
  const town = readFeature('cities', { properties: { NAME: 'Lisboa', SCALERANK: 3 }, geometry: { type: 'Point', coordinates: [-9.1, 38.7] } });
  assert.equal(town.name, 'Lisboa');
  const anonymous = readFeature('cities', { properties: { SCALERANK: 3 }, geometry: { type: 'Point', coordinates: [0, 0] } });
  assert.equal(anonymous.dropped, 'no name', 'said out loud, not written with undefined in it');
  assert.equal(anonymous.name, undefined);
  assert.equal(readFeature('lakes', { properties: { name: 'x' } }).dropped, 'no geometry');
  // coast names no name property at all, so a feature with no name is fine.
  assert.equal(readFeature('coast', { properties: { featurecla: 'Land', min_zoom: 0 }, geometry }).dropped, undefined);
});

test('a name is carried through exactly as the file has it', () => {
  // Escaping is esc()'s job in the browser. An import that escaped would put
  // &amp; in a file and the browser would then show it.
  const geometry = square(0, 0, 1);
  const raw = 'Saint John\'s & "the other one" <Ilha>';
  const read = readFeature('lakes', { properties: { name: raw, scalerank: 3 }, geometry });
  assert.equal(read.name, raw);
});

test('nameEn is written only where it differs from the name', () => {
  const geometry = square(0, 0, 1);
  const same = readFeature('lakes', { properties: { name: 'Genfersee', name_en: 'Genfersee', scalerank: 3 }, geometry });
  assert.equal(same.nameEn, undefined);
  const differs = readFeature('lakes', { properties: { name: 'Genfersee', name_en: 'Lake Geneva', scalerank: 3 }, geometry });
  assert.equal(differs.nameEn, 'Lake Geneva');
});

test('the layer table names the six layers of M36 and M45b\'s bands, and coast is lines with no world file', () => {
  // `relief` is first because it is first on the page: the bands are the
  // ground everything else is drawn on (M45b §2.4), and the manifest's order
  // is the order the map hangs the groups in.
  assert.deepEqual(LAYERS.map((l) => l.id), ['relief', 'coast', 'rivers', 'lakes', 'physical', 'mountains', 'cities']);
  const coast = layer('coast');
  assert.equal(coast.geometry, 'line', 'a cut ring is never stroked as a ring');
  assert.equal(coast.world, null, 'its far level is manifest.land');
});

test('the cities are the one layer that is filtered rather than simplified', () => {
  // Brief §3: over a hundred thousand, plus every populated place a place
  // record names, whatever its population. There is no tolerance on a point.
  const cities = layer('cities');
  assert.equal(cities.geometry, 'point');
  assert.equal(cities.filter, 'population');
  assert.equal(CITY_POPULATION, 100000);
  const read = (pop, id) => ({ id, pop });
  assert.equal(keptCity(read(100001, '1')), true);
  assert.equal(keptCity(read(100000, '1')), false, 'over a hundred thousand, not at it');
  assert.equal(keptCity(read(9400, '1')), false);
  // The second half of the rule, and the only thing that saves a small town.
  assert.equal(keptCity(read(9400, '1'), new Map([['1', 'alvor']])), true);
  // A city with no population figure is kept only where a record names it.
  assert.equal(keptCity({ id: '2' }), false);
  assert.equal(keptCity({ id: '2' }, new Map([['2', 'boe']])), true);
  // And it carries amendment A6's fields, which the peaks do not: a field
  // added to one point layer must not appear on the other.
  assert.deepEqual([...cities.carry], ['pop', 'zl', 'wikidata', 'place']);
  // The peaks carry M38's label zoom and nothing else of the cities': a field
  // added to one point layer must not appear on the other.
  assert.deepEqual([...layer('mountains').carry], ['zl']);
});

test('a city\'s label zoom comes from LABELRANK and is never earlier than its dot', () => {
  // The populated places are the one file of the seven with no `min_label`
  // (the survey of 15 September), so M38's `zl` goes through the same frozen
  // table `z` does, from the rank Natural Earth ranks its labels by.
  assert.equal(PROPERTIES.cities.label, 'LABELRANK');
  // And the three that do rank their labels are read off `min_label`, in the
  // case each file writes its keys in.
  assert.equal(PROPERTIES.rivers.label, 'min_label');
  assert.equal(PROPERTIES.lakes.label, 'min_label');
  assert.equal(PROPERTIES.physical.label, 'MIN_LABEL');
  // Nothing ranks the peaks or the coastline, so neither table names a column.
  assert.equal(PROPERTIES.mountains.label, undefined);
  assert.equal(PROPERTIES.coast.label, undefined);
  const point = { type: 'Point', coordinates: [-9.1, 38.7] };
  const city = readFeature('cities', {
    properties: { NAME: 'Lisbon', MIN_ZOOM: 3, LABELRANK: 6, POP_MAX: 2812000, NE_ID: 1, WIKIDATAID: 'Q597' },
    geometry: point,
  });
  assert.equal(city.z, 2);
  assert.equal(city.zl, 6, 'the label rank, through the one table');
  // A label before the mark it names would point at nothing.
  const early = readFeature('cities', {
    properties: { NAME: 'Somewhere', MIN_ZOOM: 8, LABELRANK: 0, POP_MAX: 200000, NE_ID: 2 },
    geometry: point,
  });
  assert.equal(early.zl, early.z);
  // And where the file gives no rank it is `z + 1`, one rung of the reader's
  // own descent after the dot (M38, amendment A2). Not a rank invented for a
  // feature Natural Earth did not rank: a rule that says "after the mark",
  // which is the only thing this atlas knows about it.
  const none = readFeature('cities', {
    properties: { NAME: 'Nowhere', MIN_ZOOM: 5, POP_MAX: 200000, NE_ID: 3 },
    geometry: point,
  });
  assert.equal(none.zl, none.z + 1);
  // Every layer, and not the cities alone: a peak ranks nothing and a lake
  // ranks its labels, and both come out with a number.
  const lake = readFeature('lakes', {
    properties: { name: 'Fixture Lake', scalerank: 2, min_zoom: 1, min_label: 5 },
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  });
  assert.equal(lake.zl, 4, 'the lake\'s own min_label, through the one table');
  const peak = readFeature('mountains', {
    properties: { name: 'Fixture Peak', scalerank: 6, elevation: 1934 },
    geometry: point,
  });
  assert.equal(peak.zl, peak.z + 1);
});

test('what a cell holds is decided per layer, and no cut edge is ever stroked', () => {
  // Amendment A2. A stroke cut at a cell edge is the same stroke, so the two
  // line layers are clipped; a fill is not, so the two polygon layers arrive
  // whole and carry the id M37 draws each of them once by.
  assert.equal(layer('coast').clip, true);
  assert.equal(layer('rivers').clip, true);
  assert.equal(layer('lakes').clip, false);
  assert.equal(layer('physical').clip, false);
  assert.equal(PROPERTIES.lakes.id, 'ne_id');
  assert.equal(PROPERTIES.physical.id, 'NE_ID');
  // The rivers are the one file of the seven with no stable id at all, so a
  // river is keyed by nothing — which is why it is the layer that is clipped.
  assert.equal(PROPERTIES.rivers.id, null);
  assert.equal(layer('mountains').geometry, 'point', 'a point is in one cell and there is nothing to cut');
});

// --- M45a: the family a physical region is drawn in -------------------------
//
// Brief test 3. The families are the brief's and this is what holds them: a
// family read off a class the table does not name, or a class this atlas does
// not keep, is the default family and never a throw — a Natural Earth release
// that adds a class must not stop an import.

test('a physical region\'s family is read off the frozen allow-list', () => {
  const table = PROPERTIES.physical;
  // Every class the layer keeps has a family, and it is one of the four.
  for (const kind of table.keep) {
    const family = familyOf(table, { FEATURECLA: kind });
    assert.ok(PHYSICAL_KINDS.includes(family), `${kind} → ${family} is a family`);
  }
  // The brief's three named families, class by class, so that moving one is a
  // change somebody has to make here as well.
  assert.equal(familyOf(table, { FEATURECLA: 'Range/mtn' }), 'relief');
  assert.equal(familyOf(table, { FEATURECLA: 'Foothills' }), 'relief');
  assert.equal(familyOf(table, { FEATURECLA: 'Desert' }), 'cover');
  assert.equal(familyOf(table, { FEATURECLA: 'Tundra' }), 'cover');
  assert.equal(familyOf(table, { FEATURECLA: 'Wetlands' }), 'cover');
  assert.equal(familyOf(table, { FEATURECLA: 'Basin' }), 'hollow');
  assert.equal(familyOf(table, { FEATURECLA: 'Depression' }), 'hollow');
  assert.equal(familyOf(table, { FEATURECLA: 'Valley' }), 'hollow');
  // And the rest keep what all seventeen looked like before M45a.
  for (const kind of ['Plateau', 'Plain', 'Pen/cape', 'Peninsula', 'Lowland', 'Delta', 'Isthmus', 'Gorge', 'Geoarea']) {
    assert.equal(familyOf(table, { FEATURECLA: kind }), PHYSICAL_DEFAULT_FAMILY, kind);
  }
  assert.deepEqual(PHYSICAL_KINDS, ['cover', 'hollow', 'outline', 'relief']);
  // The families are a subset of the allow-list: a family on a class the
  // layer does not keep would be a rule nothing can ever read.
  for (const kind of Object.keys(PHYSICAL_FAMILIES)) {
    assert.ok(table.keep.includes(kind), `${kind} is a class this layer keeps`);
  }
});

test('an unknown FEATURECLA takes the default family rather than throwing', () => {
  const table = PROPERTIES.physical;
  for (const properties of [{ FEATURECLA: 'Ice shelf' }, { FEATURECLA: '' }, { FEATURECLA: null }, {}]) {
    assert.equal(familyOf(table, properties), PHYSICAL_DEFAULT_FAMILY, JSON.stringify(properties));
  }
  // And a layer with no families at all answers null, so nothing else in the
  // import grows a `kind` by accident.
  for (const id of ['coast', 'rivers', 'lakes', 'mountains', 'cities']) {
    assert.equal(familyOf(PROPERTIES[id], { featurecla: 'Lake', FEATURECLA: 'Admin-0 capital' }), null, id);
  }
});

test('kind is written on a physical feature and only where it is not the default', () => {
  const geometry = square(0, 0, 1);
  const range = readFeature('physical', { properties: { FEATURECLA: 'Range/mtn', NAME: 'Serra da Estrela', SCALERANK: 5 }, geometry });
  assert.equal(range.kind, 'relief');
  const plateau = readFeature('physical', { properties: { FEATURECLA: 'Plateau', NAME: 'Meseta', SCALERANK: 5 }, geometry });
  assert.equal('kind' in plateau, false, 'the default family is the absence of the key');
  // A lake is not a physical region and never carries one.
  const lake = readFeature('lakes', { properties: { featurecla: 'Lake', name: 'Alqueva', scalerank: 5 }, geometry });
  assert.equal('kind' in lake, false);
});

test('every layer but the coast has a far level of its own, under data/geo/base/', () => {
  // `coast` is the exception: its far level is `manifest.land`, which
  // loadAtlas already fetches at first paint (deviation 518).
  for (const entry of LAYERS) {
    if (entry.id === 'coast') continue;
    assert.equal(entry.world, `geo/base/${entry.dir}-world.json`, entry.id);
    assert.equal(entry.minZoom, 1, `${entry.id}'s layer threshold is in k, like every z`);
    assert.equal(entry.sources.length, 1, `${entry.id} reads one committed file`);
  }
});

test('the survey counts the keys a file actually has, and says nothing about the ones it has not', () => {
  const collection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { featurecla: 'Land', scalerank: 0, min_zoom: null }, geometry: square(0, 0, 1) },
      { type: 'Feature', properties: { featurecla: 'Land', scalerank: 6 }, geometry: square(3, 0, 1) },
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [10, 20] } },
    ],
  };
  const rows = surveyProperties(collection);
  assert.deepEqual(rows.map((r) => r.key), ['featurecla', 'min_zoom', 'scalerank'], 'sorted, so two runs print one page');
  assert.equal(rows.find((r) => r.key === 'min_zoom').present, 0, 'a key that is null everywhere is present nowhere');
  assert.deepEqual(rows.find((r) => r.key === 'scalerank').samples, [0, 6]);
  const shape = surveyShape(collection);
  assert.equal(shape.features, 3);
  assert.deepEqual(shape.types, ['Point', 'Polygon']);
  assert.equal(shape.points, 11, 'five points a ring, and one for the point');
  assert.deepEqual(shape.box, [0, 0, 10, 20], 'the point is in the box too');
});

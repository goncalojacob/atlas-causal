// What a thing on this map is called, and in what year. The placer decides
// where a name fits (tests/labels.test.mjs); this is about which name it is.
//
// All of it is pure, so all of it is Node: `src/map/names.js` touches no DOM at
// all, and the layer is held to its promises against the dozen-line document
// `tests/base-layer.test.mjs` uses for the same reason.
//
// **No real place carries `historicalNames`** — 0 of the 26 under `data/places/`
// — so the dated path is proven here, on fixtures, and nothing on the real map
// is dated until somebody writes one (M38 brief, amendment A1). Writing one is
// a person's job and never this suite's: a city's former name is a historical
// claim, and `CLAUDE.md` says where those may come from.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ATLAS_PLACE_WEIGHT, TITLE_SEPARATOR, datedName, faceName, placeCandidates, titleLine,
} from '../src/map/names.js';
import { createBaseLayer, labelPointOf } from '../src/map/layers/base.js';
import { createProjection } from '../src/map/projection.js';
import { svgTitle } from '../src/util/dom.js';

// The same document as `tests/base-layer.test.mjs`: enough of an element for
// `svg()`, `svgTitle()` and `replaceChildren()`, and nothing laid out.
function fakeElement(tag) {
  const el = {
    tagName: tag,
    attrs: new Map(),
    childNodes: [],
    textContent: '',
    setAttribute(name, value) { el.attrs.set(name, String(value)); },
    getAttribute(name) { return el.attrs.has(name) ? el.attrs.get(name) : null; },
    appendChild(child) { el.childNodes.push(child); return child; },
    replaceChildren(...children) { el.childNodes = children; },
  };
  return el;
}

globalThis.document = {
  createElementNS: (_ns, tag) => fakeElement(tag),
  createElement: (tag) => fakeElement(tag),
};

const projection = createProjection({ width: 360, height: 180, center: [0, 0], scale: 1 });
const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

// A place that changed its name once, which is the case the field exists for.
// A fixture and not a record: nothing under `data/` says this.
const RENAMED = Object.freeze([
  { name: 'Lourenço Marques', from: 1895, to: 1976 },
  { name: 'Maputo', from: 1976, to: null },
]);

// --- which name is on the face ---------------------------------------------

test('the dated name when the window\'s far end is inside its interval', () => {
  assert.equal(datedName(RENAMED, 1900), 'Lourenço Marques');
  assert.equal(datedName(RENAMED, 1975), 'Lourenço Marques');
  assert.equal(faceName({ name: 'Maputo', historicalNames: RENAMED, year: 1950 }), 'Lourenço Marques');
});

test('the modern name when the far end is in no interval at all', () => {
  // Before 1895 this place has no name in the record, and the atlas does not
  // invent one because the year suggests it: it falls back to what Natural
  // Earth calls the city today and says nothing about 1600.
  assert.equal(datedName(RENAMED, 1600), null);
  assert.equal(faceName({ name: 'Maputo', historicalNames: RENAMED, year: 1600 }), 'Maputo');
});

test('the modern name when the place has no historicalNames at all', () => {
  assert.equal(faceName({ name: 'Lisbon', historicalNames: null, year: 1580 }), 'Lisbon');
  assert.equal(faceName({ name: 'Lisbon', historicalNames: [], year: 1580 }), 'Lisbon');
  // And with no year to ask about — a window that resolves to nothing — the
  // modern name too.
  assert.equal(faceName({ name: 'Lisbon', historicalNames: RENAMED, year: null }), 'Lisbon');
});

test('an interval with to: null is still current, and after its from it is the name', () => {
  // `to: null` means "still called that", so a year after `from` is inside it.
  // On a record whose open entry is the modern name — which is the ordinary
  // case, because the last thing a place was renamed to is what it is called —
  // that is the modern name on the face, which is what the brief asks for.
  assert.equal(datedName(RENAMED, 2026), 'Maputo');
  assert.equal(faceName({ name: 'Maputo', historicalNames: RENAMED, year: 2026 }), 'Maputo');
  // And where the record's open entry spells it differently from the source's,
  // the record wins: it is the one a person wrote.
  const spelt = [{ name: 'Maputo, Moçambique', from: 1976, to: null }];
  assert.equal(faceName({ name: 'Maputo', historicalNames: spelt, year: 2026 }), 'Maputo, Moçambique');
});

test('`from` counts and `to` does not, so two intervals that touch never overlap', () => {
  // 1976 is Maputo's first year and not Lourenço Marques's last: that is how a
  // person writes a rename, and it is why the two entries never both match.
  assert.equal(datedName(RENAMED, 1976), 'Maputo');
  assert.equal(datedName(RENAMED, 1895), 'Lourenço Marques');
  assert.equal(datedName(RENAMED, 1894), null);
});

test('an open start is open, and a BCE year is read in the numbering arithmetic allows', () => {
  const early = [{ name: 'Olisipo', from: null, to: 1147 }];
  assert.equal(datedName(early, -50 + 1), 'Olisipo');
  // Historians' years on the record, astronomical years in the question: -1 BCE
  // is astronomical 0, so an interval opening at -100 contains it.
  const ancient = [{ name: 'Gadir', from: -1100, to: -206 }];
  assert.equal(datedName(ancient, -1099), 'Gadir');
  assert.equal(datedName(ancient, -205), null);
});

test('an entry that is not an entry is dropped without a word', () => {
  // `data/` is untrusted input here as everywhere else: a list that is not a
  // list, an entry with no name, a year that is not a year.
  assert.equal(datedName('not a list', 1500), null);
  assert.equal(datedName([{ from: 1400, to: 1500 }], 1450), null);
  assert.equal(datedName([{ name: 'X', from: 'soon', to: null }], 1450), 'X');
  assert.equal(datedName(RENAMED, Number.NaN), null);
});

// --- and what the title says ------------------------------------------------

test('the title lists the modern name, the English name where it differs, and every dated name with its years', () => {
  const line = titleLine({ name: 'Maputo', nameEn: 'Maputo City', historicalNames: RENAMED });
  assert.deepEqual(line.split(TITLE_SEPARATOR), [
    'Maputo', 'Maputo City', 'Lourenço Marques, 1895–1976', 'Maputo, from 1976',
  ]);
  // An English name that is the same string is not said twice, and neither is
  // a dated entry that repeats the modern name with no years to add.
  assert.equal(titleLine({ name: 'Lisbon', nameEn: 'Lisbon' }), 'Lisbon');
  assert.equal(titleLine({ name: 'Lisbon', historicalNames: [{ name: 'Lisbon', from: null, to: null }] }), 'Lisbon');
});

test('a one-ended interval reads as one-ended, and an undated name is just a name', () => {
  assert.equal(titleLine({ name: 'X', historicalNames: [{ name: 'A', from: null, to: 1300 }] }),
    `X${TITLE_SEPARATOR}A, until 1300`);
  assert.equal(titleLine({ name: 'X', historicalNames: [{ name: 'B', from: 1300, to: null }] }),
    `X${TITLE_SEPARATOR}B, from 1300`);
  assert.equal(titleLine({ name: 'X', historicalNames: [{ name: 'C', from: null, to: null }] }),
    `X${TITLE_SEPARATOR}C`);
  assert.equal(titleLine({ name: 'X', historicalNames: [{ name: 'D', from: -44, to: -27 }] }),
    `X${TITLE_SEPARATOR}D, 44 BCE–27 BCE`);
  assert.equal(titleLine({}), null);
});

test('a name with < and & in it reaches the page as text and never as markup', () => {
  // Nothing here escapes anything, and that is the point: the line goes into
  // the DOM through `textContent` (`svgTitle`), which cannot open a tag. The
  // day it went in by concatenation instead, `esc()` would be the rule — which
  // is what `svgTitle` exists to make unnecessary (util/dom.js).
  const nasty = 'S<script>ão & Co';
  const line = titleLine({ name: nasty, historicalNames: [{ name: '<b>&amp;</b>', from: 1500, to: 1600 }] });
  assert.equal(line, `${nasty}${TITLE_SEPARATOR}<b>&amp;</b>, 1500–1600`);
  const el = svgTitle(line);
  assert.equal(el.tagName, 'title');
  assert.equal(el.textContent, line, 'verbatim, and as one text node');
  assert.equal(el.childNodes.length, 0, 'nothing was parsed into an element');
});

// --- a place record with no Natural Earth city ------------------------------

const place = (id, extra = {}) => ({
  id, kind: 'place', status: 'active', name: id, where: { lon: 0, lat: 0 }, ...extra,
});

test('a place record with no Natural Earth match still becomes a candidate', () => {
  // Thirteen of the twenty-six are in this state and it is the normal case:
  // `belem` is a parish, `tete-district` a district and
  // `near-villanueva-del-fresno` a battlefield, and a world gazetteer holds
  // none of the three (docs/naturalearth-places.md).
  const places = [place('belem', { name: 'Belém, Lisbon', where: { lon: -9.2, lat: 38.7 } })];
  const [candidate] = placeCandidates(places, { priority: 1 });
  assert.equal(candidate.id, 'belem');
  assert.equal(candidate.text, 'Belém, Lisbon');
  assert.equal(candidate.title, 'Belém, Lisbon');
  assert.equal(candidate.priority, 1);
  assert.deepEqual([candidate.x, candidate.y], [-9.2, 38.7], 'at the record\'s own point');
});

test('a place whose city the map has in hand is left to the city', () => {
  const places = [place('lisbon'), place('belem')];
  const got = placeCandidates(places, { drawn: new Set(['lisbon']) });
  assert.deepEqual(got.map((c) => c.id), ['belem'], 'two names on one point is the mistake this avoids');
});

test('a place whose name has not arrived is not written, and neither is a tombstone', () => {
  const places = [place('belem'), place('gone', { status: 'retracted' }), place('nowhere', { where: null })];
  const got = placeCandidates(places, { nameOf: (p) => (p.id === 'belem' ? null : p.name) });
  assert.deepEqual(got.map((c) => c.id), [], 'a name still loading is not a word to write across a country');
});

test('an atlas place outranks a Natural Earth city, and among themselves the busier one leads', () => {
  const got = placeCandidates([place('a'), place('b')], {
    weightOf: (p) => ATLAS_PLACE_WEIGHT + (p.id === 'a' ? 3 : 37),
  });
  const byId = new Map(got.map((c) => [c.id, c]));
  // Above any population Natural Earth records — the largest is Tokyo's 37
  // million — so the limit of twenty-four is spent on this atlas's own places
  // before a city it merely knows about.
  assert.ok(byId.get('b').weight > byId.get('a').weight);
  assert.ok(byId.get('a').weight > 37_000_000);
  assert.equal(byId.get('a').weight, ATLAS_PLACE_WEIGHT + 3);
  // And with nothing said about it, a place of this atlas still outweighs
  // every city: the constant is the default and not an extra.
  assert.equal(placeCandidates([place('c')])[0].weight, ATLAS_PLACE_WEIGHT);
});

test('a place record carrying dated names is labelled by the year on the band', () => {
  const places = [place('maputo', { name: 'Maputo', historicalNames: RENAMED })];
  assert.equal(placeCandidates(places, { year: 1950 })[0].text, 'Lourenço Marques');
  assert.equal(placeCandidates(places, { year: 1600 })[0].text, 'Maputo');
  assert.equal(placeCandidates(places, { year: 1950 })[0].title,
    `Maputo${TITLE_SEPARATOR}Lourenço Marques, 1895–1976${TITLE_SEPARATOR}Maputo, from 1976`);
});

// --- where a name is written, for a thing that is not a point ---------------

test('a river is named at the middle of its longest line, and a lake at its centroid', () => {
  const river = {
    geometry: {
      type: 'MultiLineString',
      coordinates: [[[0, 0], [1, 0]], [[10, 0], [12, 0], [14, 0]]],
    },
  };
  // The longer of the two, and a vertex of it rather than a point in the air.
  assert.deepEqual(labelPointOf(river), [12, 0]);

  const square = { geometry: { type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] } };
  assert.deepEqual(labelPointOf(square), [2, 2]);

  // A multi-polygon is named on its largest part: a lake with an island is
  // named on the lake, and an archipelago on its biggest island.
  const two = {
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        [[[10, 10], [14, 10], [14, 14], [10, 14], [10, 10]]],
      ],
    },
  };
  assert.deepEqual(labelPointOf(two), [12, 12]);

  // A point is its own anchor, and something with neither is nowhere.
  assert.deepEqual(labelPointOf({ lon: -9, lat: 38 }), [-9, 38]);
  assert.equal(labelPointOf({ geometry: { type: 'GeometryCollection' } }), null);
  assert.equal(labelPointOf(null), null);
});

// --- the layer, end to end --------------------------------------------------

function cityLayer(features) {
  const group = fakeElement('g');
  const held = new Map([['cities-world.json', features]]);
  return createBaseLayer(group, projection, {
    id: 'cities',
    geometry: 'point',
    minZoom: 1,
    world: 'cities-world.json',
    cells: [],
    load: (file) => Promise.resolve(held.get(file)),
    loaded: (file) => held.get(file) ?? null,
    defer: (fn) => fn(),
  });
}

test('a city carries the dated name of the place record it is, and all of them in its title', async () => {
  const layer = cityLayer([
    { id: '1', lon: 0, lat: 0, name: 'Maputo', nameEn: 'Maputo City', pop: 1_000_000, z: 1, zl: 1, place: 'maputo' },
  ]);
  layer.render({ k: 8, view: [-180, -90, 180, 90] });
  await settle();
  layer.render({ k: 8, view: [-180, -90, 180, 90] });

  const places = new Map([['maputo', { id: 'maputo', historicalNames: RENAMED }]]);
  const placeOf = (id) => places.get(id) ?? null;
  const [then] = layer.labelCandidates({ priority: 1, placeOf, year: 1950 });
  assert.equal(then.text, 'Lourenço Marques', 'the name it had in the year on the band');
  assert.equal(then.title,
    `Maputo${TITLE_SEPARATOR}Maputo City${TITLE_SEPARATOR}Lourenço Marques, 1895–1976${TITLE_SEPARATOR}Maputo, from 1976`);

  const [now] = layer.labelCandidates({ priority: 1, placeOf, year: 2026 });
  assert.equal(now.text, 'Maputo', 'and the name it has now, at a window that ends now');

  // With no place record behind it — which is every city on the real map
  // today — the face is Natural Earth's own name and the title is the two it
  // gives, and no year changes either.
  const [plain] = layer.labelCandidates({ priority: 1, placeOf: () => null, year: 1950 });
  assert.equal(plain.text, 'Maputo');
  assert.equal(plain.title, `Maputo${TITLE_SEPARATOR}Maputo City`);
});

test('the layer reports the places its files hold, drawn or not', async () => {
  const layer = cityLayer([
    { id: '1', lon: 0, lat: 0, name: 'Braga', pop: 800_000, z: 12, zl: 12, place: 'braga' },
    { id: '2', lon: 1, lat: 1, name: 'Nowhere', pop: 1, z: 1, zl: 1 },
  ]);
  layer.render({ k: 8, view: [-180, -90, 180, 90] });
  await settle();
  const drawn = layer.render({ k: 8, view: [-180, -90, 180, 90] });
  // Braga's `z` is 12, so at k = 8 its dot is not drawn — and it is still a
  // place Natural Earth has a city for, so the map must not name it from the
  // record instead. The question this answers is "does the source have it?",
  // not "can you see it?".
  assert.equal(drawn.drawn, 1, 'only the one the zoom lets through is drawn');
  assert.deepEqual([...layer.placeIds()], ['braga']);
  assert.deepEqual(layer.labelCandidates({ priority: 1 }).map((c) => c.text), ['Nowhere']);
});

test('a physical feature is a candidate at its own geometry, spaced, and said only once', async () => {
  const group = fakeElement('g');
  const held = new Map([['rivers-world.json', {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 'a', name: 'Tejo', zl: 4 }, geometry: { type: 'LineString', coordinates: [[0, 0], [2, 0], [4, 0]] } },
      { type: 'Feature', properties: { id: 'b', name: 'Tejo', zl: 5 }, geometry: { type: 'LineString', coordinates: [[6, 0], [8, 0]] } },
    ],
  }]]);
  const layer = createBaseLayer(group, projection, {
    id: 'rivers',
    geometry: 'line',
    minZoom: 1,
    world: 'rivers-world.json',
    cells: [],
    load: (file) => Promise.resolve(held.get(file)),
    loaded: (file) => held.get(file) ?? null,
    defer: (fn) => fn(),
  });
  layer.render({ k: 8, view: [-180, -90, 180, 90] });
  await settle();
  layer.render({ k: 8, view: [-180, -90, 180, 90] });

  const got = layer.labelCandidates({ priority: 2 });
  assert.deepEqual(got.map((c) => c.text), ['Tejo', 'Tejo'], 'both segments offer the name');
  // Natural Earth cuts a river into segments with ids of their own, so the two
  // carry the same `once` key and the placer writes the name once.
  assert.equal(new Set(got.map((c) => c.once)).size, 1);
  assert.equal(got[0].once, 'rivers|Tejo');
  // A line has no dot to stand clear of, so the anchor is the label point
  // itself: the middle of the line and not the centre of its bounding box.
  assert.deepEqual([got[0].x, got[0].y], projection.project([2, 0]));
  // And the weight is the label zoom turned round: written early means big.
  assert.ok(got[0].weight > got[1].weight);
  assert.equal(got[0].weight, -4);
});

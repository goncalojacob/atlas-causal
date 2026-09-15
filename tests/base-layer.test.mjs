// The base map's one layer module, against a fake group and a synthetic
// manifest layer. Everything here is about what it draws and what it asks the
// network for, and neither needs a browser: `util/dom.js` builds its elements
// through `document.createElementNS`, so a document of a dozen lines is enough
// to hold it to its promises in Node.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createBaseLayer, baseSignature, bboxOf } from '../src/map/layers/base.js';
import { createProjection } from '../src/map/projection.js';

// --- the smallest document that will do -------------------------------------
//
// Enough of an element for `svg()`, `svgTitle()` and `group.replaceChildren()`:
// attributes, children, a tag name and text. Nothing lays anything out and
// nothing is painted; what the tests read back is what the layer put there.
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

// A loader that answers out of a table and counts what was asked for. A file
// the table does not name rejects, which is the "a cell that will not load"
// case; `fail` makes a named file reject however many times it is asked.
function loader(table, { fail = new Set() } = {}) {
  const held = new Map();
  const asked = [];
  return {
    asked,
    held,
    // Held only once the promise has settled, as `data.js` holds it: a render
    // that runs while the file is still in the air must see nothing in hand.
    load(file) {
      asked.push(file);
      if (fail.has(file) || !(file in table)) return Promise.reject(new Error(`no ${file}`));
      return Promise.resolve(table[file]).then((data) => { held.set(file, data); return data; });
    },
    loaded: (file) => held.get(file) ?? null,
  };
}

const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const lineFeature = (z, coords) => ({
  type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { z },
});
const polygonFeature = (id, z, ring) => ({
  type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id, z },
});

// x2y2 is [-60, 0, 60 wide, 45 tall] — the cell Portugal is in — and the boxes
// below are inside it, so `cellsFor` names that cell and no other.
const CELL_BOX = [-50, 5, -40, 15];
// A view wider than the near span (`NEAR_SPAN`, two cells), for the tests that
// mean "the far file and no cells". The gate is the span and no longer the
// zoom (deviation 633), and a box and a `k` are coupled in the running map by
// the size of the pane: ten degrees of longitude on screen *is* a deep zoom.
// A test that pairs a one-cell box with k = 1 is describing a pane that cannot
// exist, so these say what they mean with the box instead.
const WIDE_BOX = [-180, -60, 120, 60];
const RIVERS = {
  'geo/base/rivers-world.json': {
    type: 'FeatureCollection',
    features: [
      lineFeature(1, [[-170, -80], [-160, -80]]),
      lineFeature(12, [[-150, -70], [-140, -70]]),
    ],
  },
  'geo/base/rivers/x2y2.json': {
    type: 'FeatureCollection',
    features: [lineFeature(1, [[-45, 8], [-44, 9], [-43, 10]])],
  },
};

const riversLayer = (group, io, extra = {}) => createBaseLayer(group, projection, {
  id: 'rivers',
  geometry: 'line',
  minZoom: 4,
  world: 'geo/base/rivers-world.json',
  cells: [{ key: 'x2y2', file: 'geo/base/rivers/x2y2.json', bytes: 1 }],
  nearSpan: 120,
  load: io.load,
  loaded: io.loaded,
  ...extra,
});

test('below its minZoom a layer draws nothing and asks for nothing', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const layer = riversLayer(group, io);

  const result = layer.render({ k: 1, view: [-180, -90, 180, 90] });
  await settle();
  assert.deepEqual(io.asked, [], 'a layer below its zoom costs no request');
  assert.equal(group.childNodes.length, 0);
  assert.equal(result.drawn, 0);
  assert.equal(result.complete, false);
});

test('above it the far file is asked for once and drawn when it lands', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const layer = riversLayer(group, io);

  layer.render({ k: 4, view: WIDE_BOX });
  layer.render({ k: 4, view: WIDE_BOX });
  await settle();
  assert.deepEqual(io.asked, ['geo/base/rivers-world.json'], 'asked once, not once per render');
  // Nothing was cleared while it was on its way, and nothing was drawn either.
  assert.equal(group.childNodes.length, 0);

  const result = layer.render({ k: 4, view: WIDE_BOX });
  // The far file holds two rivers and one of them is a `z` of 12: at k = 4 the
  // data itself says it is not worth drawing yet.
  assert.equal(group.childNodes.length, 1, 'the river the zoom is worth');
  assert.equal(result.drawn, 1);
  assert.match(group.childNodes[0].getAttribute('d'), /^M/);
  assert.equal(group.childNodes[0].tagName, 'path');
  assert.equal(group.childNodes[0].getAttribute('d').includes('Z'), false, 'a line has two ends');
});

test('a feature whose z is above k is drawn when k reaches it, and not before', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const layer = riversLayer(group, io);
  layer.render({ k: 4, view: WIDE_BOX });
  await settle();
  layer.render({ k: 4, view: WIDE_BOX });
  assert.equal(group.childNodes.length, 1);
  layer.render({ k: 12, view: WIDE_BOX });
  assert.equal(group.childNodes.length, 2, 'the z = 12 river is in at k = 12');
});

test('an equal signature rebuilds nothing: the same nodes come back', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const layer = riversLayer(group, io);
  layer.render({ k: 4, view: WIDE_BOX });
  await settle();
  layer.render({ k: 4, view: WIDE_BOX });
  const first = group.childNodes[0];
  assert.ok(first);
  // A pan inside the same cell at the same bucket: the box moves and nothing
  // about what is drawn does.
  layer.render({ k: 4, view: [-48, 6, -42, 14] });
  assert.equal(group.childNodes[0], first, 'the same element node');
  assert.equal(group.childNodes.length, 1);
});

test('a rejected fetch is not remembered and the next render asks again', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS, { fail: new Set(['geo/base/rivers-world.json']) });
  const layer = riversLayer(group, io);
  layer.render({ k: 4, view: WIDE_BOX });
  await settle();
  assert.equal(io.asked.length, 1);
  layer.render({ k: 4, view: WIDE_BOX });
  await settle();
  assert.equal(io.asked.length, 2, 'asked again');
  // And nothing was said about it: a missing river is absent, not wrong.
  assert.equal(group.childNodes.length, 0);
});

test('inside the near span the cells of the view are asked for, and the far file is dropped where they cover', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const layer = riversLayer(group, io);
  layer.render({ k: 8, view: CELL_BOX });
  await settle();
  assert.deepEqual(io.asked.sort(), ['geo/base/rivers-world.json', 'geo/base/rivers/x2y2.json']);

  const result = layer.render({ k: 8, view: CELL_BOX });
  assert.equal(result.complete, true, 'every cell of the view is in hand');
  assert.deepEqual(result.cells, ['x2y2']);
  // The far file's two rivers are in x0y0 and x1y0, which are not in hand, so
  // neither is dropped — but one of them is a `z` of 12 and this is k = 8. So
  // one far river and the cell's own.
  assert.equal(group.childNodes.length, 2);
});

test('a point layer draws circles and a polygon layer draws paths', async () => {
  const points = {
    'geo/base/cities-world.json': [
      { id: 'a', lon: -45, lat: 8, name: 'Somewhere', z: 1 },
    ],
  };
  const group = fakeElement('g');
  const io = loader(points);
  const cities = createBaseLayer(group, projection, {
    id: 'cities', geometry: 'point', minZoom: 1, world: 'geo/base/cities-world.json', cells: [],
    nearSpan: 120, load: io.load, loaded: io.loaded,
  });
  cities.render({ k: 1, view: CELL_BOX });
  await settle();
  cities.render({ k: 1, view: CELL_BOX });
  assert.equal(group.childNodes.length, 1);
  const circle = group.childNodes[0];
  assert.equal(circle.tagName, 'circle');
  assert.equal(circle.getAttribute('r'), '2.000', 'a 2-unit dot at k = 1');
  assert.equal(circle.childNodes[0].tagName, 'title');
  assert.equal(circle.childNodes[0].textContent, 'Somewhere');
  // The dot is a mark on the page, so it shrinks with the zoom — over the node
  // that is already there, without rebuilding it.
  cities.render({ k: 4, view: CELL_BOX });
  assert.equal(group.childNodes[0], circle, 'the same node');
  assert.equal(circle.getAttribute('r'), '0.500');

  const lakes = {
    'geo/base/lakes-world.json': {
      type: 'FeatureCollection',
      features: [polygonFeature('l1', 1, [[-46, 7], [-44, 7], [-44, 9], [-46, 7]])],
    },
  };
  const lakeGroup = fakeElement('g');
  const lakeIo = loader(lakes);
  const layer = createBaseLayer(lakeGroup, projection, {
    id: 'lakes', geometry: 'polygon', minZoom: 1, world: 'geo/base/lakes-world.json', cells: [],
    nearSpan: 120, load: lakeIo.load, loaded: lakeIo.loaded,
  });
  layer.render({ k: 1, view: CELL_BOX });
  await settle();
  layer.render({ k: 1, view: CELL_BOX });
  assert.equal(lakeGroup.childNodes.length, 1);
  assert.equal(lakeGroup.childNodes[0].tagName, 'path');
  assert.ok(lakeGroup.childNodes[0].getAttribute('d').endsWith('Z'), 'a ring is closed');
  assert.equal(lakeGroup.childNodes[0].getAttribute('fill-rule'), 'evenodd');
});

test('a feature that arrives in more than one cell is drawn once, by its id', async () => {
  // The same lake written whole into both cells its box overlaps (A1).
  const lake = polygonFeature('shared', 1, [[-2, 7], [2, 7], [2, 9], [-2, 7]]);
  const table = {
    'geo/base/lakes/x2y2.json': { type: 'FeatureCollection', features: [lake] },
    'geo/base/lakes/x3y2.json': { type: 'FeatureCollection', features: [lake] },
  };
  const group = fakeElement('g');
  const io = loader(table);
  const layer = createBaseLayer(group, projection, {
    id: 'lakes',
    geometry: 'polygon',
    minZoom: 1,
    world: null,
    cells: [
      { key: 'x2y2', file: 'geo/base/lakes/x2y2.json', bytes: 1 },
      { key: 'x3y2', file: 'geo/base/lakes/x3y2.json', bytes: 1 },
    ],
    nearSpan: 120,
    load: io.load,
    loaded: io.loaded,
  });
  // A box straddling the two cells.
  const across = [-5, 5, 5, 15];
  layer.render({ k: 8, view: across });
  await settle();
  const result = layer.render({ k: 8, view: across });
  assert.deepEqual(result.cells, ['x2y2', 'x3y2']);
  assert.equal(group.childNodes.length, 1, 'one lake, not two');
});

test('a layer with no cells and no world file draws nothing and throws nothing', async () => {
  const group = fakeElement('g');
  const io = loader({});
  const layer = createBaseLayer(group, projection, {
    id: 'rivers', geometry: 'line', minZoom: 1, world: null, cells: [],
    nearSpan: 120, load: io.load, loaded: io.loaded,
  });
  const result = layer.render({ k: 8, view: CELL_BOX });
  await settle();
  assert.deepEqual(io.asked, []);
  assert.equal(group.childNodes.length, 0);
  assert.equal(result.drawn, 0);
  // Every cell of the view is "in hand" — the manifest names no file for any of
  // them, so there is nothing to wait for.
  assert.equal(result.complete, true);
});

test('a layer switched off empties its group and asks for nothing', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const layer = riversLayer(group, io);
  layer.render({ k: 8, view: CELL_BOX });
  await settle();
  layer.render({ k: 8, view: CELL_BOX });
  assert.ok(group.childNodes.length > 0);
  const before = io.asked.length;
  const result = layer.render({ k: 8, view: CELL_BOX, on: false });
  await settle();
  assert.equal(group.childNodes.length, 0, 'the group is emptied');
  assert.equal(io.asked.length, before, 'and nothing is asked for');
  assert.equal(result.complete, false);
  // Back on, and drawn out of what is already in hand: no second request.
  layer.render({ k: 8, view: CELL_BOX });
  await settle();
  assert.equal(io.asked.length, before, 'from cache');
  assert.ok(group.childNodes.length > 0);
});

test('the first fetch is deferred and the ones after it are not', async () => {
  const group = fakeElement('g');
  const io = loader(RIVERS);
  const deferred = [];
  const layer = riversLayer(group, io, { defer: (fn) => { deferred.push(fn); } });
  layer.render({ k: 8, view: CELL_BOX });
  await settle();
  // Held: the first request has not gone out at all until the frame it was put
  // behind comes round.
  assert.equal(io.asked.length, 0);
  assert.equal(deferred.length, 1);
  deferred[0]();
  await settle();
  assert.ok(io.asked.length >= 1);
  layer.render({ k: 8, view: CELL_BOX });
  await settle();
  assert.equal(deferred.length, 1, 'only the first');
});

test('the signature is the four things that decide the picture', () => {
  const same = { on: true, drawable: true, bucket: '0.2:3', files: ['b.json', 'a.json'] };
  assert.equal(baseSignature(same), baseSignature({ ...same, files: ['a.json', 'b.json'] }),
    'the order the files came in is not part of it');
  assert.notEqual(baseSignature(same), baseSignature({ ...same, on: false }));
  assert.notEqual(baseSignature(same), baseSignature({ ...same, drawable: false }));
  assert.notEqual(baseSignature(same), baseSignature({ ...same, bucket: '0.2:4' }));
  assert.notEqual(baseSignature(same), baseSignature({ ...same, files: ['a.json'] }));
});

test('bboxOf takes a box off a point, a line and a polygon alike', () => {
  assert.deepEqual(bboxOf({ lon: -9, lat: 38 }), [-9, 38, -9, 38]);
  assert.deepEqual(bboxOf(lineFeature(1, [[-10, 0], [0, 10], [-5, -5]])), [-10, -5, 0, 10]);
  assert.deepEqual(bboxOf(polygonFeature('p', 1, [[0, 0], [2, 0], [2, 3], [0, 0]])), [0, 0, 2, 3]);
  assert.equal(bboxOf({ type: 'Feature', geometry: null }), null);
  assert.equal(bboxOf(null), null);
});

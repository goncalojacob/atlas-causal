// The graph view's arrangement has to be predictable in three ways: the
// same records give the same picture, the order the records arrive in
// changes nothing, and the barycentre pass never leaves the drawing more
// tangled than the plain order it started from.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { layoutGraph, BAND_HEIGHT, AXIS_HEIGHT } from '../src/graph-view/layout.js';
import { lanesFor } from '../src/lanes.js';
import { ROOT } from './helpers.mjs';

const REGIONS = [
  { id: 'europe', label: 'Europe', order: 1 },
  { id: 'africa', label: 'Africa', order: 2 },
  { id: 'asia', label: 'Asia', order: 3 },
];

// The bands are lanes now (M14), and the lanes come from the one file that
// decides what a lane is — here, the region grouping, which is what the
// graph view drew before there was a choice.
const regionLanes = (events, regions = REGIONS) => lanesFor('region', { activeEvents: events, regions });

const event = (id, region, year, weight = 1) => ({
  id, region, weight, status: 'active', title: id, when: { start: year, end: year },
});
const edge = (from, to, type = 'caused', confidence = 'consensus') => ({
  id: `${from}--${to}--${type}`, from, to, type, confidence, status: 'active',
});

// Two chains whose ids interleave, so that leaving each year in id order
// crosses them; one edge out of the band, which no vertical order inside a
// band can undo; and an event nothing links to.
function sample() {
  return {
    events: [
      event('alpha-one', 'europe', 1900), event('zulu-one', 'europe', 1900),
      event('alpha-two', 'europe', 1910), event('zulu-two', 'europe', 1910),
      event('alpha-three', 'europe', 1920), event('zulu-three', 'europe', 1920),
      event('far', 'africa', 1915), event('lonely', 'asia', 1905),
    ],
    edges: [
      edge('alpha-one', 'zulu-two'), edge('zulu-one', 'alpha-two'),
      edge('zulu-two', 'alpha-three'), edge('alpha-two', 'zulu-three'),
      edge('alpha-one', 'far', 'enabled'),
    ],
    extent: { min: 1900, max: 1920 },
  };
}

// The sample with its lanes, as the view assembles them.
function laid(overrides = {}) {
  const s = { ...sample(), ...overrides };
  return { ...s, lanes: regionLanes(s.events) };
}

const shape = (l) => JSON.stringify({
  bands: l.bands,
  nodes: l.nodes.map(({ id, x, y, lane, year, weight }) => ({ id, x, y, lane, year, weight })),
  edges: l.edges.map(({ id, x1, y1, x2, y2 }) => ({ id, x1, y1, x2, y2 })),
});

// A deterministic shuffle: no randomness in a test that has to be able to
// fail for a reason.
function shuffled(list, step) {
  const out = [];
  for (let i = 0; i < list.length; i += 1) out.push(list[(i * step) % list.length]);
  return out;
}

test('the same records give the same picture, twice and shuffled', () => {
  const first = layoutGraph(laid());
  assert.equal(shape(layoutGraph(laid())), shape(first));
  const s = sample();
  const mixed = layoutGraph(laid({ events: shuffled(s.events, 3), edges: shuffled(s.edges, 3) }));
  assert.equal(shape(mixed), shape(first));
});

test('every node sits inside the band of its lane', () => {
  const l = layoutGraph(laid());
  assert.equal(l.nodes.length, 8);
  const bands = Object.fromEntries(l.bands.map((b) => [b.id, b]));
  assert.equal(l.bands.length, 3);
  assert.equal(l.height, AXIS_HEIGHT + 3 * BAND_HEIGHT);
  for (const node of l.nodes) {
    const band = bands[node.lane];
    assert.ok(node.y > band.y0 && node.y < band.y1, `${node.id} is inside ${node.lane}`);
  }
});

// No grouping is the default, and the default drops the bands: one field
// the height the five regions had, and no label painted over the picture.
test('with no lanes there are no bands, and the field is the whole height', () => {
  const l = layoutGraph({ ...sample(), lanes: [] });
  assert.equal(l.bands.length, 1);
  assert.equal(l.bands[0].hidden, true);
  assert.equal(l.bands[0].id, null);
  assert.equal(l.bands[0].label, '');
  assert.equal(l.height, AXIS_HEIGHT + 5 * BAND_HEIGHT);
  assert.equal(l.nodes.length, 8);
  for (const node of l.nodes) {
    assert.equal(node.lane, null);
    assert.ok(node.y > AXIS_HEIGHT && node.y < l.height);
  }
  // Freed from the bands, the barycentre can untangle what the bands forced
  // apart: the edge out of Africa is no longer a crossing nothing can help.
  assert.equal(l.crossings, 0);
});

test('bands give up height rather than making a picture four screens tall', () => {
  const events = [];
  const regions = [];
  for (let i = 0; i < 12; i += 1) {
    regions.push({ id: `r${i}`, label: `R${i}`, order: i });
    events.push(event(`e${i}`, `r${i}`, 1900 + i));
  }
  const l = layoutGraph({ events, edges: [], lanes: regionLanes(events, regions), extent: { min: 1900, max: 1911 } });
  assert.equal(l.bands.length, 12);
  assert.ok(l.height < AXIS_HEIGHT + 12 * BAND_HEIGHT, 'twelve bands are not twelve regions tall');
  for (const node of l.nodes) {
    const band = l.bands.find((b) => b.id === node.lane);
    assert.ok(node.y > band.y0 && node.y < band.y1, node.id);
  }
});

test('x is the year, on the whole extent and in order', () => {
  const l = layoutGraph(laid());
  const byIdX = Object.fromEntries(l.nodes.map((n) => [n.id, n.x]));
  assert.equal(byIdX['alpha-one'], byIdX['zulu-one'], 'the same year is the same x');
  assert.ok(byIdX['alpha-one'] < byIdX.lonely, '1900 is left of 1905');
  assert.ok(byIdX.lonely < byIdX.far, '1905 is left of 1915');
  assert.ok(byIdX.far < byIdX['alpha-three'], '1915 is left of 1920');
});

test('nodes of the same year and lane are spread apart', () => {
  const l = layoutGraph(laid());
  const y = Object.fromEntries(l.nodes.map((n) => [n.id, n.y]));
  for (const [a, b] of [['alpha-one', 'zulu-one'], ['alpha-two', 'zulu-two'], ['alpha-three', 'zulu-three']]) {
    assert.ok(Math.abs(y[a] - y[b]) > 8, `${a} and ${b} do not sit on each other`);
  }
});

test('the barycentre pass never crosses more edges than the plain order', () => {
  const l = layoutGraph(laid());
  assert.ok(l.crossings < l.naiveCrossings, `${l.crossings} is not fewer than ${l.naiveCrossings}`);
  // Three crossings become one: the two chains are untangled, and what is
  // left is the edge that leaves the band, which no ordering inside a band
  // can help.
  assert.equal(l.naiveCrossings, 3);
  assert.equal(l.crossings, 1);
});

// The real dataset, through the same index the browser reads.
async function topology() {
  const dir = path.join(ROOT, 'data', 'index');
  const file = (await readdir(dir)).find((n) => n.startsWith('topology-'));
  return JSON.parse(await readFile(path.join(dir, file), 'utf8'));
}

test('the whole atlas lays out: every event placed, every edge drawn', async () => {
  const t = await topology();
  const regions = JSON.parse(await readFile(path.join(ROOT, 'data', 'regions.json'), 'utf8'));
  const events = t.events.filter((e) => e.status === 'active');
  const ids = new Set(events.map((e) => e.id));
  const edges = t.edges.filter((e) => e.status === 'active' && ids.has(e.from) && ids.has(e.to));
  const starts = events.map((e) => e.when.start);
  const lanes = regionLanes(events, [...regions].sort((a, b) => a.order - b.order));
  const l = layoutGraph({
    events, edges, lanes, extent: { min: Math.min(...starts), max: Math.max(...starts) },
  });
  assert.equal(l.nodes.length, events.length);
  assert.equal(l.edges.length, edges.length);
  assert.ok(l.crossings <= l.naiveCrossings);
  const bands = Object.fromEntries(l.bands.map((b) => [b.id, b]));
  for (const node of l.nodes) {
    assert.ok(node.y > bands[node.lane].y0 && node.y < bands[node.lane].y1, node.id);
  }
  assert.equal(shape(layoutGraph({
    events, edges, lanes, extent: { min: Math.min(...starts), max: Math.max(...starts) },
  })), shape(l));
  // And the same atlas with no grouping at all: every event still placed.
  const bandless = layoutGraph({
    events, edges, lanes: [], extent: { min: Math.min(...starts), max: Math.max(...starts) },
  });
  assert.equal(bandless.nodes.length, events.length);
  assert.equal(bandless.edges.length, edges.length);
  assert.equal(bandless.bands.length, 1);
  assert.ok(bandless.crossings <= bandless.naiveCrossings);
});

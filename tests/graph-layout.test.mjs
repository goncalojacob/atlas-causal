// The graph view's arrangement has to be predictable in three ways: the
// same records give the same picture, the order the records arrive in
// changes nothing, and the barycentre pass never leaves the drawing more
// tangled than the plain order it started from.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { layoutGraph, BAND_HEIGHT, AXIS_HEIGHT } from '../src/graph-view/layout.js';
import { ROOT } from './helpers.mjs';

const REGIONS = [
  { id: 'europe', label: 'Europe', order: 1 },
  { id: 'africa', label: 'Africa', order: 2 },
  { id: 'asia', label: 'Asia', order: 3 },
];

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
    regions: REGIONS,
    extent: { min: 1900, max: 1920 },
  };
}

const shape = (l) => JSON.stringify({
  bands: l.bands,
  nodes: l.nodes.map(({ id, x, y, region, year, weight }) => ({ id, x, y, region, year, weight })),
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
  const first = layoutGraph(sample());
  assert.equal(shape(layoutGraph(sample())), shape(first));
  const s = sample();
  const mixed = layoutGraph({ ...s, events: shuffled(s.events, 3), edges: shuffled(s.edges, 3) });
  assert.equal(shape(mixed), shape(first));
});

test('every node sits inside the band of its region', () => {
  const l = layoutGraph(sample());
  assert.equal(l.nodes.length, 8);
  const bands = Object.fromEntries(l.bands.map((b) => [b.id, b]));
  assert.equal(l.bands.length, 3);
  assert.equal(l.height, AXIS_HEIGHT + 3 * BAND_HEIGHT);
  for (const node of l.nodes) {
    const band = bands[node.region];
    assert.ok(node.y > band.y0 && node.y < band.y1, `${node.id} is inside ${node.region}`);
  }
});

test('x is the year, on the whole extent and in order', () => {
  const l = layoutGraph(sample());
  const byIdX = Object.fromEntries(l.nodes.map((n) => [n.id, n.x]));
  assert.equal(byIdX['alpha-one'], byIdX['zulu-one'], 'the same year is the same x');
  assert.ok(byIdX['alpha-one'] < byIdX.lonely, '1900 is left of 1905');
  assert.ok(byIdX.lonely < byIdX.far, '1905 is left of 1915');
  assert.ok(byIdX.far < byIdX['alpha-three'], '1915 is left of 1920');
});

test('nodes of the same year and region are spread apart', () => {
  const l = layoutGraph(sample());
  const y = Object.fromEntries(l.nodes.map((n) => [n.id, n.y]));
  for (const [a, b] of [['alpha-one', 'zulu-one'], ['alpha-two', 'zulu-two'], ['alpha-three', 'zulu-three']]) {
    assert.ok(Math.abs(y[a] - y[b]) > 8, `${a} and ${b} do not sit on each other`);
  }
});

test('the barycentre pass never crosses more edges than the plain order', () => {
  const l = layoutGraph(sample());
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
  const l = layoutGraph({
    events, edges, regions: [...regions].sort((a, b) => a.order - b.order),
    extent: { min: Math.min(...starts), max: Math.max(...starts) },
  });
  assert.equal(l.nodes.length, events.length);
  assert.equal(l.edges.length, edges.length);
  assert.ok(l.crossings <= l.naiveCrossings);
  const bands = Object.fromEntries(l.bands.map((b) => [b.id, b]));
  for (const node of l.nodes) {
    assert.ok(node.y > bands[node.region].y0 && node.y < bands[node.region].y1, node.id);
  }
  assert.equal(shape(layoutGraph({
    events, edges, regions: [...regions].sort((a, b) => a.order - b.order),
    extent: { min: Math.min(...starts), max: Math.max(...starts) },
  })), shape(l));
});

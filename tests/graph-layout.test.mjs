// The graph view's arrangement has to be predictable in three ways: the
// same records give the same picture, the order the records arrive in
// changes nothing, and the barycentre pass never leaves the drawing more
// tangled than the plain order it started from.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  layoutGraph, stackLayout, BAND_HEIGHT, AXIS_HEIGHT, STACK_DISTANCE, MAX_ZOOM,
} from '../src/graph-view/layout.js';
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

// --- the level of detail (M25) -----------------------------------------
//
// The arrangement above never moves; what changes with the zoom is which of
// its nodes are drawn as one. These check that the merging is deterministic,
// that it stays inside a band, that it comes apart on the way in, and that
// what the reader is working with is never inside a stack.

// The sample above is eight events over twenty years, which at 36 units to
// the year is a picture with nothing near anything. This is the same idea
// crowded: a century of extent, so a year is about eight units wide, and
// three consecutive years of one band close enough to be drawn as one.
function crowd() {
  const events = [
    event('e-1900', 'europe', 1900), event('e-1901', 'europe', 1901, 3), event('e-1902', 'europe', 1902),
    event('e-1950', 'europe', 1950), event('e-2000', 'europe', 2000),
    event('a-1900', 'africa', 1900), event('a-1902', 'africa', 1902), event('a-1960', 'africa', 1960),
  ];
  return {
    events,
    edges: [edge('e-1901', 'e-1950'), edge('a-1900', 'a-1960')],
    lanes: regionLanes(events),
    extent: { min: 1900, max: 2000 },
  };
}

const stackShape = (s) => JSON.stringify({
  nodes: s.nodes.map(({ key, x, y, lane, count, weight, coincident, splittable, alone, years }) => ({
    key, x, y, lane, count, weight, coincident, splittable, alone, years,
    members: s.nodes.find((n) => n.key === key).members.map((m) => m.id),
  })),
  edges: s.edges.map(({ key, from, to, count, type, disputed, x1, y1, x2, y2 }) => ({
    key, from, to, count, type, disputed, x1, y1, x2, y2,
  })),
});

test('stacks are deterministic, twice and shuffled', () => {
  const first = stackLayout(layoutGraph(crowd()), { k: 1 });
  assert.ok(first.nodes.some((n) => n.count > 1), 'the crowded sample does merge something');
  assert.equal(stackShape(stackLayout(layoutGraph(crowd()), { k: 1 })), stackShape(first));
  const c = crowd();
  const mixed = stackLayout(
    layoutGraph({ ...c, events: shuffled(c.events, 3), edges: shuffled(c.edges, 1) }), { k: 1 },
  );
  assert.equal(stackShape(mixed), stackShape(first));
});

test('every node is in exactly one stack and the badges add up to the events', () => {
  const l = layoutGraph(crowd());
  for (const k of [1, 1.5, 2, 4, MAX_ZOOM]) {
    const s = stackLayout(l, { k });
    const ids = s.nodes.flatMap((n) => n.members.map((m) => m.id));
    assert.equal(new Set(ids).size, ids.length, `k=${k}: no node in two stacks`);
    assert.equal(ids.length, l.nodes.length, `k=${k}: no node left out`);
    assert.equal(s.nodes.reduce((n, c) => n + c.count, 0), l.nodes.length, `k=${k}: the badges sum to the total`);
    // A stack stands where its representative stands, which is a node's own
    // place: zooming changes which marks are drawn, never where one is.
    for (const stack of s.nodes) {
      assert.equal(stack.x, stack.representative.x);
      assert.equal(stack.y, stack.representative.y);
      assert.ok(stack.members.some((m) => m.id === stack.representative.id));
    }
  }
});

test('a stack never straddles two bands', () => {
  const l = layoutGraph(crowd());
  // A merge distance wider than the whole picture: everything that may merge,
  // does. What is left is one stack per band, because a lane is a claim about
  // where a group of events belongs and a mark astride two would not be true.
  const s = stackLayout(l, { k: 1, distance: 4000 });
  assert.equal(s.nodes.length, 2);
  assert.deepEqual(s.nodes.map((n) => n.count).sort((a, b) => a - b), [3, 5]);
  for (const stack of s.nodes) assert.equal(new Set(stack.members.map((m) => m.lane)).size, 1);
  // With no grouping there is one band, and then it is one mark.
  const bandless = stackLayout(layoutGraph({ ...crowd(), lanes: [] }), { k: 1, distance: 4000 });
  assert.equal(bandless.nodes.length, 1);
  assert.equal(bandless.nodes[0].count, 8);
  assert.equal(bandless.edges.length, 0, 'both links are inside it');
});

test('zooming in splits stacks, and the deepest zoom draws every event', () => {
  const l = layoutGraph(crowd());
  const counts = [1, 1.5, 2, 4, MAX_ZOOM].map((k) => stackLayout(l, { k }).nodes.length);
  for (let i = 1; i < counts.length; i += 1) {
    assert.ok(counts[i] >= counts[i - 1], `${counts}: zooming in never draws fewer nodes`);
  }
  assert.ok(counts[0] < l.nodes.length, 'zoomed out, some nodes are merged');
  assert.equal(counts[counts.length - 1], l.nodes.length, 'at the deepest zoom every event is its own node');
  // Nothing in this sample is closer than the epsilon, so every stack in it
  // promises a zoom that would part it — and everything merged into one is
  // within D of the node the mark is drawn on.
  for (const stack of stackLayout(l, { k: 1 }).nodes) {
    if (stack.count === 1) continue;
    assert.equal(stack.splittable, true);
    assert.ok(stack.coreZoom > 1, `${stack.key} says where to zoom to`);
    for (const member of stack.members) {
      assert.ok(Math.hypot(member.x - stack.x, member.y - stack.y) <= STACK_DISTANCE, member.id);
    }
  }
});

test('what the reader is working with is never inside a stack', () => {
  const l = layoutGraph(crowd());
  const merged = stackLayout(l, { k: 1 }).nodes.find((n) => n.count > 1);
  assert.ok(merged, 'the sample does merge something at k = 1');
  const held = merged.members[merged.members.length - 1].id;
  const s = stackLayout(l, { k: 1, alone: new Set([held]) });
  const its = s.nodes.find((n) => n.members.some((m) => m.id === held));
  assert.equal(its.count, 1, `${held} keeps a node of its own`);
  assert.equal(its.alone, true);
  assert.equal(s.nodes.reduce((n, c) => n + c.count, 0), l.nodes.length, 'and nothing else is lost');
  // Held out one at a time, every node in the picture can be reached.
  for (const node of l.nodes) {
    const one = stackLayout(l, { k: 1, alone: new Set([node.id]) });
    assert.ok(one.nodes.some((n) => n.key === node.id && n.count === 1), node.id);
  }
});

test('links between two stacks are one line, counted, and keep a dispute', () => {
  // Two pairs of events, near enough to merge, with three links across.
  const events = [
    event('a-one', 'europe', 1900), event('a-two', 'europe', 1900, 2),
    event('b-one', 'europe', 1901), event('b-two', 'europe', 1901, 2),
  ];
  const edges = [
    edge('a-one', 'b-one'), edge('a-two', 'b-two', 'enabled', 'disputed'), edge('a-one', 'b-two'),
    // A link inside one of the two stacks: nothing to draw it between.
    edge('a-one', 'a-two', 'inspired'),
  ];
  const l = layoutGraph({ events, edges, lanes: regionLanes(events), extent: { min: 1900, max: 1901 } });
  const s = stackLayout(l, { k: 1, distance: 4000 });
  assert.equal(s.nodes.length, 1, 'a merge distance that big is one stack');
  assert.equal(s.edges.length, 0, 'and every link is inside it');
  // Held apart by year instead: two stacks, one line between them.
  const wide = stackLayout(l, { k: 1, distance: 30 });
  assert.equal(wide.nodes.length, 2);
  assert.equal(wide.edges.length, 1);
  const [line] = wide.edges;
  assert.equal(line.count, 3, 'three links, one line');
  assert.equal(line.type, 'caused', 'the commonest of the three');
  assert.equal(line.disputed, true, 'one disputed member is enough');
  const from = wide.nodes.find((n) => n.key === line.from);
  const to = wide.nodes.find((n) => n.key === line.to);
  assert.deepEqual([line.x1, line.y1, line.x2, line.y2], [from.x, from.y, to.x, to.y]);
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

test('the whole atlas at the default zoom: fewer nodes than events, and they add up', async () => {
  const t = await topology();
  const regions = JSON.parse(await readFile(path.join(ROOT, 'data', 'regions.json'), 'utf8'));
  const events = t.events.filter((e) => e.status === 'active');
  const ids = new Set(events.map((e) => e.id));
  const edges = t.edges.filter((e) => e.status === 'active' && ids.has(e.from) && ids.has(e.to));
  const starts = events.map((e) => e.when.start);
  const dataExtent = { min: Math.min(...starts), max: Math.max(...starts) };
  const lanes = regionLanes(events, [...regions].sort((a, b) => a.order - b.order));
  // No grouping is the default the atlas opens on; the regions are the
  // arrangement that crowds a band, and both have to come apart on the way in.
  for (const [what, groups] of [['bandless', []], ['regions', lanes]]) {
    const l = layoutGraph({ events, edges, lanes: groups, extent: dataExtent });
    const s = stackLayout(l, { k: 1 });
    assert.ok(s.nodes.length < l.nodes.length, `${what}: the default zoom merges something`);
    assert.equal(s.nodes.reduce((n, c) => n + c.count, 0), events.length, `${what}: the badges sum to the events`);
    assert.ok(s.edges.length <= l.edges.length, `${what}: no line is invented`);
    assert.equal(stackLayout(l, { k: MAX_ZOOM }).nodes.length, events.length, `${what}: the deepest zoom draws them all`);
    assert.equal(stackShape(stackLayout(l, { k: 1 })), stackShape(s), `${what}: the same twice`);
  }
});

// What the brief was written for: three hundred events and five hundred
// links, which is a hairball at one node each. The atlas holds a hundred and
// thirty-four, where the merging is real but modest; this says what the same
// rule does at the density it exists for.
test('at the density the level of detail is for, most of the picture merges', () => {
  const regions = [];
  const events = [];
  for (let i = 0; i < 6; i += 1) regions.push({ id: `r${i}`, label: `R${i}`, order: i });
  for (let i = 0; i < 300; i += 1) {
    events.push(event(`e${String(i).padStart(3, '0')}`, `r${i % 6}`, 1900 + (i % 60), (i % 7) + 1));
  }
  const edges = [];
  for (let i = 0; i < 500; i += 1) {
    const from = events[(i * 7) % 300];
    const to = events[(i * 13 + 1) % 300];
    if (from.id !== to.id) edges.push(edge(from.id, to.id));
  }
  const byPair = new Map(edges.map((e) => [e.id, e]));
  const l = layoutGraph({
    events, edges: [...byPair.values()], lanes: regionLanes(events, regions), extent: { min: 1900, max: 1959 },
  });
  const s = stackLayout(l, { k: 1 });
  assert.equal(s.nodes.reduce((n, c) => n + c.count, 0), 300);
  assert.ok(s.nodes.length < 300 * 0.55, `${s.nodes.length} of 300 nodes at the default zoom`);
  assert.ok(s.edges.length < l.edges.length * 0.8, `${s.edges.length} of ${l.edges.length} lines`);
  assert.ok(s.edges.filter((e) => e.count > 1).length > 50, 'and the lines that merged carry a count');
  assert.ok(stackLayout(l, { k: 2 }).nodes.length > s.nodes.length, 'and it comes apart on the way in');
  assert.equal(stackLayout(l, { k: MAX_ZOOM }).nodes.length, 300);
});

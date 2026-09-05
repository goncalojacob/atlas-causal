// The arrangement on a thread of its own: what crosses, what comes back, and
// what happens when there is no thread.
//
// `node --test` cannot start a browser Worker, and a piece of arithmetic that
// only runs in a browser is a piece of arithmetic nothing checks. So the two
// halves are separated: the message is a pair of pure functions, held here to
// a round trip that changes nothing; the runner is given a stand-in thread
// that answers with the very code the real one runs, so the job bookkeeping,
// the fallback and the failure path are all exercised without one.
//
// Everything below is synthetic. Nothing here is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutGraph } from '../src/graph-view/layout.js';
import { packInput, unpackInput, packLayout, unpackLayout } from '../src/graph-view/layout-message.js';
import { arrangeMessage } from '../src/graph-view/layout-worker.js';
import { createLayoutRunner, OFFLOAD_ABOVE } from '../src/graph-view/layout-runner.js';
import { lanesFor } from '../src/lanes.js';

const REGIONS = [
  { id: 'europe', label: 'Europe', order: 1 },
  { id: 'africa', label: 'Africa', order: 2 },
];

const event = (id, region, year, weight = 1) => ({
  id,
  region,
  weight,
  status: 'active',
  title: `A synthetic event, ${id}`,
  summary: 'Long prose that has no business crossing to a thread that only places dots.',
  when: { start: year, end: year },
});
const edge = (from, to, type = 'caused') => ({
  id: `${from}--${to}--${type}`, from, to, type, confidence: 'consensus', status: 'active',
});

// Enough events to be worth a thread, in two bands, with a year before the
// era among them: `toAstronomical` moves those by one and must not do it
// twice (util/dates.js), which is the trap the message is written around.
function graph(count = OFFLOAD_ABOVE + 40) {
  // There is no year 0, so the count steps over it (util/dates.js).
  const yearAt = (i) => (i < 5 ? i - 5 : i - 4);
  const events = [];
  for (let i = 0; i < count; i += 1) {
    events.push(event(`e${String(i).padStart(4, '0')}`, i % 2 === 0 ? 'europe' : 'africa', yearAt(i), (i % 5) + 1));
  }
  // One event whose year is not certain, so the `{ min, max }` bound travels.
  events[3] = { ...events[3], when: { start: { min: -3, max: 4 }, end: 7 } };
  const edges = [];
  for (let i = 0; i + 3 < count; i += 3) edges.push(edge(events[i].id, events[i + 3].id));
  const starts = [1, count - 5];
  return {
    events,
    edges,
    lanes: lanesFor('region', { activeEvents: events, regions: REGIONS }),
    extent: { min: Math.min(...starts), max: Math.max(...starts) },
  };
}

const records = (g) => ({
  events: new Map(g.events.map((e) => [e.id, e])),
  edges: new Map(g.edges.map((e) => [e.id, e])),
});

// Everything the drawing reads off a layout, in one string.
const shape = (l) => JSON.stringify({
  width: l.width,
  height: l.height,
  bands: l.bands,
  crossings: l.crossings,
  naiveCrossings: l.naiveCrossings,
  domain: l.scale.domain,
  range: l.scale.range,
  nodes: l.nodes.map(({ id, x, y, lane, year, weight, event: e }) => ({ id, x, y, lane, year, weight, title: e.title })),
  edges: l.edges.map(({ id, from, to, x1, y1, x2, y2, edge: e }) => ({ id, from, to, x1, y1, x2, y2, type: e.type })),
});

test('the round trip through a message changes nothing about the picture', () => {
  const g = graph(120);
  const here = layoutGraph(g);
  // Through JSON, which is stricter than a structured clone: anything that
  // is a function, a Set or a Map on the way out would not survive it.
  const there = unpackLayout(JSON.parse(JSON.stringify(arrangeMessage(JSON.parse(JSON.stringify(packInput(g)))))), records(g));
  assert.equal(shape(there), shape(here));
});

test('only ids, years, weights and lanes cross', () => {
  const g = graph(20);
  const message = packInput(g);
  assert.deepEqual(Object.keys(message.events).sort(), ['end', 'id', 'lane', 'start', 'weight']);
  assert.deepEqual(Object.keys(message.edges).sort(), ['from', 'id', 'to']);
  // No prose, no records, no member sets: a lane is its id and its label, and
  // which events are in it is one integer each.
  assert.deepEqual(Object.keys(message.lanes[0]).sort(), ['id', 'label']);
  assert.doesNotMatch(JSON.stringify(message), /no business crossing/);
  assert.equal(message.events.lane.length, g.events.length);
  // And the bounds are the record's own, not their astronomical reading.
  assert.deepEqual(message.events.start[3], { min: -3, max: 4 });
});

test('an event that no lane claims still lands in the picture', () => {
  const g = graph(20);
  const orphan = { ...event('orphan', 'atlantis', 12), region: 'atlantis' };
  const input = { ...g, events: [...g.events, orphan] };
  const message = packInput(input);
  assert.equal(message.events.lane[message.events.id.indexOf('orphan')], -1);
  const back = unpackInput(message);
  assert.equal(back.events.length, input.events.length);
  assert.equal(layoutGraph(back).nodes.length, input.events.length);
});

// A stand-in for the thread: it runs the real handler on the message it is
// posted, on a later turn, exactly as a Worker would.
function fakeThread({ fail = false, throwOn = null } = {}) {
  const thread = {
    posted: [],
    onmessage: null,
    onerror: null,
    postMessage(data) {
      this.posted.push(data);
      queueMicrotask(() => {
        if (throwOn && this.posted.length === throwOn) {
          this.onerror(new Error('the thread went away'));
          return;
        }
        if (fail) this.onmessage({ data: { job: data.job, error: 'no' } });
        else this.onmessage({ data: { job: data.job, layout: arrangeMessage(data.input) } });
      });
    },
  };
  return thread;
}

test('a small arrangement is made here and now, with no thread at all', () => {
  const g = graph(20);
  let started = 0;
  const runner = createLayoutRunner({
    records: records(g),
    worker: () => { started += 1; return fakeThread(); },
  });
  assert.equal(runner.offloads(20), false, 'twenty events are not worth a thread');
  let got = null;
  runner.run(g, (l) => { got = l; });
  assert.ok(got, 'the layout is there before run() returns');
  assert.equal(shape(got), shape(layoutGraph(g)));
  assert.equal(started, 0, 'and no thread was ever started');
});

test('with no Worker to be had, everything is made here', () => {
  const g = graph(OFFLOAD_ABOVE + 10);
  const runner = createLayoutRunner({ records: records(g), worker: () => null });
  assert.equal(runner.offloads(g.events.length), false);
  let got = null;
  runner.run(g, (l) => { got = l; });
  assert.equal(shape(got), shape(layoutGraph(g)));
});

test('a large one goes away and comes back the same', async () => {
  const g = graph(OFFLOAD_ABOVE + 10);
  const thread = fakeThread();
  const runner = createLayoutRunner({ records: records(g), worker: () => thread });
  assert.equal(runner.offloads(g.events.length), true);
  let got = null;
  runner.run(g, (l) => { got = l; });
  assert.equal(got, null, 'not on this turn');
  await new Promise((resolve) => { queueMicrotask(resolve); });
  await new Promise((resolve) => { queueMicrotask(resolve); });
  assert.ok(got, 'and on a later one');
  assert.equal(shape(got), shape(layoutGraph(g)));
  assert.equal(thread.posted.length, 1);
});

test('a thread that answers with an error is answered here instead', async () => {
  const g = graph(OFFLOAD_ABOVE + 10);
  const runner = createLayoutRunner({ records: records(g), worker: () => fakeThread({ fail: true }) });
  let got = null;
  runner.run(g, (l) => { got = l; });
  await new Promise((resolve) => { queueMicrotask(resolve); });
  await new Promise((resolve) => { queueMicrotask(resolve); });
  assert.equal(shape(got), shape(layoutGraph(g)), 'the reader gets a picture either way');
});

test('a thread that goes away owes nothing: the layout is made here', async () => {
  const g = graph(OFFLOAD_ABOVE + 10);
  const runner = createLayoutRunner({ records: records(g), worker: () => fakeThread({ throwOn: 1 }) });
  let got = null;
  runner.run(g, (l) => { got = l; });
  await new Promise((resolve) => { queueMicrotask(resolve); });
  await new Promise((resolve) => { queueMicrotask(resolve); });
  assert.equal(shape(got), shape(layoutGraph(g)));
  // And the next arrangement does not wait for a thread that is gone.
  let after = null;
  runner.run(g, (l) => { after = l; });
  assert.ok(after, 'made here, on this turn');
});

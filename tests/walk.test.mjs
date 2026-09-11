// The walk the atlas assembles. Pure: an atlas, a target and a state in, an
// ordered list of edge ids and a provenance out.
//
// The thing these checks are actually holding is that the producer adds no
// traversal of its own. What it hands a reader must be the path
// `shortestPaths`/`pathTo` gives for the same pair — the chain they would have
// clicked out themselves — and never a walk of its own devising (plan
// decision 6).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walkTo, walkStarts, walkContext } from '../src/walk.js';
import { shortestPaths, pathTo, subgraph } from '../src/graph.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

const DAY = Date.UTC(2026, 8, 8, 14, 30);
const A = 'fixture-event-a';
const E = 'fixture-event-e';
const O = 'fixture-event-o';
const T = 'fixture-event-t';

test('the walk to a target is the path shortestPaths already gives for the pair', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const walk = walkTo(atlas, T, { selected: A }, { now: DAY });
  const byHand = pathTo(shortestPaths(atlas.adjacency, A), T).map((edge) => edge.id);
  assert.deepEqual([...walk.steps], byHand);
  assert.equal(walk.from, A);
  assert.equal(walk.target, T);
  assert.equal(walk.reason, null);
  // The events along it, in order, so that what surrounds the walk can be
  // asked for without walking it again.
  assert.deepEqual([...walk.events], [A, 'fixture-event-b', 'fixture-event-d', T]);
});

// Two starts and one target: the cheapest path wins — confidence before type,
// then the shortest — and the choice is between paths that already exist, not
// a second traversal.
test('of several starts the walk is the one that costs least', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const state = { chain: [`${O}--${E}--enabled`], selected: E };
  assert.deepEqual(walkStarts(atlas, state), [O, E]);
  const walk = walkTo(atlas, T, state, { now: DAY });
  assert.equal(walk.from, E, 'the walk from O is the walk from E with a step in front of it');
  assert.deepEqual([...walk.steps], pathTo(shortestPaths(atlas.adjacency, E), T).map((e) => e.id));
});

// A lens is not a start: `?focus=` says which events exist for the views, not
// where an argument begins.
test('the lens is not a start and neither is a tombstone', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  assert.deepEqual(walkStarts(atlas, { focus: `event:${A}` }), []);
  assert.deepEqual(walkStarts(atlas, { selected: 'fixture-event-m' }), [], 'merged');
  assert.deepEqual(walkStarts(atlas, { selected: 'nothing-by-that-name' }), []);
});

test('a target with no path answers with no steps and says why', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const none = walkTo(atlas, A, { selected: T }, { now: DAY });
  assert.deepEqual([...none.steps], []);
  assert.equal(none.from, null);
  assert.equal(none.reason, 'no-path');
  assert.equal(walkTo(atlas, T, {}, { now: DAY }).reason, 'no-start');
  assert.equal(walkTo(atlas, T, { selected: T }, { now: DAY }).reason, 'arrived');
  assert.equal(walkTo(atlas, 'fixture-event-m', { selected: A }, { now: DAY }).reason, 'no-target');
  assert.equal(walkTo(atlas, null, { selected: A }, { now: DAY }).reason, 'no-target');
  // Still a provenance: the card has to say who was asked even when the
  // answer is that there is no path.
  assert.equal(none.provenance.by, 'atlas');
  assert.deepEqual([...none.provenance.steps], []);
});

test('the provenance carries who put it together, the question and the day', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const walk = walkTo(atlas, T, { selected: A }, { now: DAY });
  assert.deepEqual({ ...walk.provenance, steps: [...walk.provenance.steps] }, {
    by: 'atlas',
    question: 'Why Fixture event T?',
    on: '2026-09-08',
    steps: [...walk.steps],
  });
  // The reader's own question, where they asked one.
  const asked = walkTo(atlas, T, { selected: A }, { now: DAY, question: 'why fixture t' });
  assert.equal(asked.provenance.question, 'why fixture t');
  // A day and not an hour: the line owes the reader when this was assembled,
  // not a stamp precise enough to tell one session from another.
  assert.match(walk.provenance.on, /^\d{4}-\d{2}-\d{2}$/);
});

test('two calls with the same arguments answer the same walk', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const once = walkTo(atlas, T, { selected: A }, { now: DAY });
  const again = walkTo(atlas, T, { selected: A }, { now: DAY + 60 * 1000 });
  assert.deepEqual(once, again);
});

// The rule this run exists to keep (plan decision 7): a generated walk is not
// a record. It carries no envelope, so nothing about it could be written into
// `data/` even by accident, and it is frozen, so nothing edits one into it.
test('a walk is not a record', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const walk = walkTo(atlas, T, { selected: A }, { now: DAY });
  for (const field of ['kind', 'id', 'origin', 'sources', 'summary', 'review']) {
    assert.ok(!(field in walk), `a walk carries no ${field}`);
  }
  assert.equal(walk.provenance.by, 'atlas', 'and its provenance is not an origin.tool');
  assert.ok(Object.isFrozen(walk) && Object.isFrozen(walk.provenance));
});

// What surrounds the walk is `subgraph`'s answer over the events along it, and
// not a set assembled a second way: the Why mode lays that out by depth.
test('the walk asks subgraph for what surrounds it', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const walk = walkTo(atlas, T, { selected: A }, { now: DAY });
  const around = walkContext(atlas, walk, 1);
  assert.deepEqual(around, subgraph(atlas, [...walk.events], 1));
  assert.deepEqual(walkContext(atlas, walkTo(atlas, T, {}, { now: DAY })).events, []);
});

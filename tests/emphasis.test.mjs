// What the reader is working with, on the synthetic fixtures.
//
// The map, the timeline and the graph each built this set by hand and each
// built it slightly differently (health review A, finding 27). These are the
// assertions that hold it to one shape: what each part contains, that the
// lens applies to all of it, and that the union the three views draw from is
// the union of the parts and not something a fourth view has to reassemble.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../src/state.js';
import { workingSet, heldSet } from '../src/emphasis.js';
import { SHOWN } from '../src/horizon.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

const fixtureAtlas = () => atlasOf(FIXTURE_DATA);

const A = 'fixture-event-a';
const B = 'fixture-event-b';
const D = 'fixture-event-d';
const T = 'fixture-event-t';
const A_TO_B = 'fixture-event-a--fixture-event-b--caused';
const B_TO_D = 'fixture-event-b--fixture-event-d--enabled';
const sorted = (set) => [...set].sort();

test('nothing is open, so nothing is held', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, defaultState());
  assert.deepEqual(sorted(w.selected), []);
  assert.deepEqual(sorted(w.path), []);
  assert.deepEqual(sorted(w.consequences), []);
  assert.deepEqual(sorted(w.converging), []);
  assert.equal(w.actor, null);
  assert.equal(w.narrative, null);
  assert.equal(w.reachable.size, 0);
  assert.equal(w.lens, null);
  assert.equal(heldSet(w).size, 0);
});

test('a selection carries its own consequences', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, { ...defaultState(), selected: A });
  assert.deepEqual(sorted(w.selected), [A]);
  assert.deepEqual(sorted(w.path), [], 'nothing has been walked yet');
  // Both ends of every outgoing link: A enabled A2 and caused B.
  assert.deepEqual(sorted(w.consequences), [A, 'fixture-event-a2', B]);
  // Nothing else feeds A, so there are no other branches to show.
  assert.deepEqual(sorted(w.converging), []);
  assert.deepEqual(sorted(heldSet(w)), [A, 'fixture-event-a2', B]);
});

test('a walked chain is the ends of its links, and the head is on the path', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, { ...defaultState(), selected: D, chain: [A_TO_B, B_TO_D] });
  assert.deepEqual(sorted(w.path), [A, B, D]);
  assert.deepEqual(sorted(w.selected), [D]);
  // D caused T, so T and D are the consequence link's two ends.
  assert.deepEqual(sorted(w.consequences), [D, T]);
  assert.ok(heldSet(w).has(A), 'the first step of the walk is still held');
});

test('the other branches are the convergence query\'s, and the walk is excluded', async () => {
  const atlas = await fixtureAtlas();
  // T is fed by C, D, E, F and G; walking D→T should leave the other four.
  const w = workingSet(atlas, { ...defaultState(), selected: T, chain: [A_TO_B, B_TO_D, 'fixture-event-d--fixture-event-t--caused'] });
  assert.ok(w.converging.size > 0, 'T has other ancestors');
  assert.ok(!w.converging.has(D), 'the walked branch is not an other branch');
  for (const id of w.converging) assert.ok(atlas.events.has(id), id);
  // Every part of the working set is in the union, and the union is nothing
  // more than the parts.
  const held = heldSet(w);
  for (const set of [w.selected, w.path, w.consequences, w.converging]) {
    for (const id of set) assert.ok(held.has(id), id);
  }
  assert.equal(held.size, new Set([...w.selected, ...w.path, ...w.consequences, ...w.converging]).size);
});

test('an open actor and an open narrative are held too', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, { ...defaultState(), actor: 'fixture-actor-one' });
  assert.deepEqual(sorted(w.actor), [A, B]);
  assert.deepEqual(sorted(heldSet(w)), [A, B]);

  const n = workingSet(atlas, { ...defaultState(), narrative: 'fixture-narrative-one', step: 0 });
  assert.ok(n.narrative && n.narrative.size > 1, 'the whole walk, not only the step reached');
  for (const id of n.narrative) assert.ok(heldSet(n).has(id), id);
});

test('the horizon is reachable and not held: a mark of its own is not what it asks for', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, { ...defaultState(), selected: A, horizon: 3000 });
  assert.ok(w.reachable.size > 0, 'A leads somewhere by the year 3000');
  for (const [, depth] of w.reachable) assert.ok(Number.isInteger(depth) && depth >= 0);
  const held = heldSet(w);
  const kept = heldSet(w, { reachable: true });
  for (const id of w.reachable.keys()) assert.ok(kept.has(id), id);
  assert.ok(kept.size >= held.size);
});

test('the lens removes from every part of it, not only from the marks', async () => {
  const atlas = await fixtureAtlas();
  // Actor one is in A and B; a lens on actor two is in B and T, so A must
  // leave the walked path even though the reader is standing on it.
  const state = {
    ...defaultState(), focus: 'actor:fixture-actor-two', selected: B, chain: [A_TO_B], horizon: 3000,
  };
  const w = workingSet(atlas, state);
  assert.ok(w.lens instanceof Set);
  assert.ok(!w.lens.has(A), 'the lens does not keep A');
  for (const set of [w.selected, w.path, w.consequences, w.converging]) {
    for (const id of set) assert.ok(w.lens.has(id), `${id} is drawn but the lens says it is not there`);
  }
  for (const id of w.reachable.keys()) assert.ok(w.lens.has(id), id);
  assert.ok(!heldSet(w).has(A));
  // And an actor's emphasis is filtered the same way.
  const withActor = workingSet(atlas, { ...state, actor: 'fixture-actor-one' });
  assert.deepEqual(sorted(withActor.actor), [B], 'A is outside the lens');
});

test('a lens with nothing else open is what the graph draws one node at a time', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, { ...defaultState(), focus: 'actor:fixture-actor-one' });
  assert.deepEqual(sorted(w.lens), [A, B]);
  // The map and the timeline filter their own event lists, so the lens is
  // not part of what they hold; the graph asks for it by name.
  assert.equal(heldSet(w).size, 0);
  assert.deepEqual(sorted(heldSet(w, { lens: true })), [A, B]);
});

// --- what H4c changed: one working set per state change, and a capped hold

test('the three views share one answer, and a new state is a new one', async () => {
  const atlas = await fixtureAtlas();
  const state = { ...defaultState(), selected: A, chain: [A_TO_B] };
  // The store hands every subscriber the same object; asking again with it
  // must not walk the graph again.
  assert.equal(workingSet(atlas, state), workingSet(atlas, state));
  // A state that says the same thing in a different object is a different
  // state as far as this is concerned: the store replaces rather than
  // mutates, so a fresh object means something changed.
  const again = { ...state };
  assert.notEqual(workingSet(atlas, again), workingSet(atlas, state));
  assert.deepEqual(sorted(workingSet(atlas, again).path), sorted(workingSet(atlas, state).path));
  // A second atlas is a second answer, even given the same state object.
  const other = await fixtureAtlas();
  assert.notEqual(workingSet(other, state), workingSet(atlas, state));
  assert.deepEqual(sorted(workingSet(other, state).selected), sorted(workingSet(atlas, state).selected));
});

test('what is held out of the stacks stops at what the panel lists', async () => {
  const atlas = await fixtureAtlas();
  const state = { ...defaultState(), selected: A, horizon: 3000 };
  const w = workingSet(atlas, state);
  assert.ok(w.reachable.size > 0, 'the fixtures reach somewhere');
  const held = heldSet(w, { reachable: true });
  // Every reachable event of the fixtures fits under the cap, so all of them
  // are held: the cap is a ceiling and not a filter.
  for (const id of w.reachable.keys()) assert.ok(held.has(id), id);
  // The cap itself, on a reachable set longer than it. The order is the
  // panel's — depth, then year, then id — so the first SHOWN of the Map are
  // the rows a reader can actually aim at.
  const many = new Map(Array.from({ length: SHOWN + 25 }, (_, i) => [`far-${String(i).padStart(3, '0')}`, 1]));
  const capped = heldSet({ ...w, reachable: many, selected: new Set(), path: new Set(), consequences: new Set(), converging: new Set(), actor: null, narrative: null }, { reachable: true });
  assert.equal(capped.size, SHOWN);
  assert.ok(capped.has('far-000'));
  assert.ok(!capped.has(`far-${String(SHOWN).padStart(3, '0')}`), 'past the cap it may be stacked');
});

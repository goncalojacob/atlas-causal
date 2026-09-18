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
import { isMain } from '../src/lens.js';
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
  // Actor one is in A and B; a lens on actor two is in B and T. A is one hop
  // from B, so it is in the dimmed ring and not in the focus set — and an
  // event that is in neither leaves the walked path even though the reader is
  // standing on the chain that reaches it.
  const state = {
    ...defaultState(), focus: 'actor:fixture-actor-two', selected: B, chain: [A_TO_B], horizon: 3000,
  };
  const w = workingSet(atlas, state);
  assert.ok(w.lens instanceof Set);
  assert.ok(!w.lensFocus.has(A), 'A is not what was asked for');
  assert.ok(w.lensNear.has(A), 'it is one hop from B, so it is drawn dimmed');
  assert.ok(w.lens.has(A), 'and therefore drawn at all');
  // Nothing outside the lens is drawn by any part of the working set.
  for (const set of [w.selected, w.path, w.consequences, w.converging]) {
    for (const id of set) assert.ok(w.lens.has(id), `${id} is drawn but the lens says it is not there`);
  }
  for (const id of w.reachable.keys()) assert.ok(w.lens.has(id), id);
  // Something the lens really does remove: an event that is neither in the
  // set nor one hop from it.
  const outside = atlas.activeEvents.map((e) => e.id).find((id) => !w.lens.has(id));
  assert.ok(outside, 'the fixtures are wider than this neighbourhood');
  assert.ok(!heldSet(w).has(outside));
  // And an actor's emphasis is filtered the same way.
  const withActor = workingSet(atlas, { ...state, actor: 'fixture-actor-one' });
  for (const id of withActor.actor) assert.ok(w.lens.has(id), id);
});

test('a lens with nothing else open is what the graph draws one node at a time', async () => {
  const atlas = await fixtureAtlas();
  const w = workingSet(atlas, { ...defaultState(), focus: 'actor:fixture-actor-one' });
  // A and B are the actor's own; a2 and d are one hop out and drawn dimmed.
  assert.deepEqual(sorted(w.lensFocus), [A, B]);
  assert.deepEqual(sorted(w.lens), [A, 'fixture-event-a2', B, 'fixture-event-d'].sort());
  assert.deepEqual(sorted(w.lensNear), ['fixture-event-a2', 'fixture-event-d']);
  // The map and the timeline filter their own event lists, so the lens is
  // not part of what they hold; the graph asks for it by name.
  assert.equal(heldSet(w).size, 0);
  assert.deepEqual(sorted(heldSet(w, { lens: true })), sorted(w.lens));
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

// R8, the correction of 6 September. A lens the reader set is a question and
// its answer may be narrow; the lens they got for opening a card is not, and
// what they have just clicked is associated with it by definition.
test('an implicit lens never removes the selection, the walk or the consequences', async () => {
  const atlas = await fixtureAtlas();
  const O = 'fixture-event-o';
  const E = 'fixture-event-e';
  const C = 'fixture-event-c';
  // Actor two is at B and T; O and E are outside both its events and the ring
  // around them, and the reader has walked O → E and is standing on E.
  const state = {
    ...defaultState(), actor: 'fixture-actor-two', selected: E, chain: [`${O}--${E}--enabled`],
  };
  const w = workingSet(atlas, state);
  // Since M65 the event they chose is itself the lens — the actor's card is
  // open behind it and the picture is the event they clicked — so E is the
  // focus rather than something the focus had to be stopped from removing.
  assert.ok(w.lensFocus.has(E), 'the open event is what the lens is of');
  assert.deepEqual(sorted(w.selected), [E], 'and is drawn');
  assert.deepEqual(sorted(w.path), [E, O], 'with both ends of the step walked to it');
  assert.deepEqual(sorted(w.consequences), [C, E], 'and where it leads');
  for (const id of [O, E, C]) assert.ok(w.lens.has(id), `${id} is what the reader is looking at`);
  // The lens is still a lens: what the choice does not reach is gone, and the
  // walk the reader made to get here is not gone with it.
  assert.ok(!w.lens.has('fixture-event-a2'), 'an event nothing here reaches is still removed');

  // The same walk under a focus the reader typed: their question, their
  // narrow answer.
  const asked = workingSet(atlas, { ...state, focus: 'actor:fixture-actor-two' });
  assert.equal(asked.selected.size, 0);
  assert.equal(asked.path.size, 0);
});

test('an actor with no events at all leaves the atlas whole', async () => {
  const atlas = await fixtureAtlas();
  // Most of the atlas's actors are polities imported with their borders and
  // no event yet; opening one drew a blank map and a blank timeline.
  //
  // "No events" is a smaller set than it was: since M48 an actor's events are
  // the events on its ground as well as the events that name it, and
  // `fixture-polity-three` — which named none — holds the ground under
  // `fixture-event-b` and is a lens now. Polity four is the case this rule is
  // still about: borders, and nothing that happened inside them.
  assert.deepEqual(atlas.eventsByActor.get('fixture-polity-four') ?? [], []);
  assert.equal(atlas.eventsOnGroundOf('fixture-polity-four'), null, 'and nothing on its ground');
  const w = workingSet(atlas, { ...defaultState(), actor: 'fixture-polity-four' });
  assert.equal(w.lens, null, 'no lens, so every view draws everything');
  assert.deepEqual(sorted(w.actor), [], 'and there is nothing to emphasise');

  // The other one is the correction itself: a polity imported with its borders
  // and named by no event is no longer an empty atlas.
  const ground = workingSet(atlas, { ...defaultState(), actor: 'fixture-polity-three' });
  assert.ok(ground.lens?.has('fixture-event-b'), 'the event inside its territory is its own');
});

// --- the category filter, written once, where the lens is -------------------
//
// The map alone would have been three-quarters of a filter: the timeline would
// have gone on drawing the bars and the corner would have gone on counting the
// events the reader had just taken away (review of the map block, F6). It is
// one removal here, and `working.shown` is what the three views draw from.
//
// The fixtures carry `treaty` on A, `disaster` on C and G, `war` on E and F,
// and nothing on the other seven.
const CATEGORY_OF = {
  'fixture-event-a': 'treaty',
  'fixture-event-c': 'disaster',
  'fixture-event-e': 'war',
  'fixture-event-f': 'war',
  'fixture-event-g': 'disaster',
};

test('with every category on, the only narrowing left is the resting rule', async () => {
  const atlas = await fixtureAtlas();
  // The bare `events` token is the default and means every category *and* the
  // events that have none. Since M65 `shown` is a set all the same, because
  // there is always a picture and at rest it is the main events: H and T are
  // parts of F and are drawn when a reader opens F.
  const w = workingSet(atlas, defaultState());
  assert.ok(w.shown instanceof Set);
  for (const event of atlas.activeEvents) {
    assert.equal(w.shown.has(event.id), isMain(atlas, event), `${event.id} is drawn at rest iff it is main`);
  }
  assert.ok(!w.shown.has('fixture-event-h') && !w.shown.has('fixture-event-t'), 'and the two parts of F are not');
});

test('a category token removes the events of every other category, and no uncategorised one', async () => {
  const atlas = await fixtureAtlas();
  const state = { ...defaultState(), layers: ['land', 'territories', 'events:war'] };
  const w = workingSet(atlas, state);
  assert.ok(w.shown instanceof Set);
  for (const event of atlas.activeEvents) {
    // Inside the resting picture, which is what a category toggle narrows
    // (M65): a part of another event is not drawn at rest and no token of any
    // category puts it back.
    if (!isMain(atlas, event)) continue;
    const category = CATEGORY_OF[event.id] ?? null;
    const drawn = w.shown.has(event.id);
    if (category === null) assert.equal(drawn, true, `${event.id} has no category and is removed by no token`);
    else assert.equal(drawn, category === 'war', `${event.id} is ${category}`);
  }
  // Two tokens are two categories, and the uncategorised are still there.
  const two = workingSet(atlas, { ...defaultState(), layers: ['events:war', 'events:treaty'] });
  assert.ok(two.shown.has('fixture-event-a'));
  assert.ok(two.shown.has('fixture-event-e'));
  assert.ok(!two.shown.has('fixture-event-c'));
  assert.ok(two.shown.has('fixture-event-d'), 'no category, no token, still drawn');
});

test('the category filter applies to every part of the working set, as the lens does', async () => {
  const atlas = await fixtureAtlas();
  // A is a treaty and B has no category: walking A → B with only `war` on
  // takes the treaty out of the path, exactly as a lens would.
  const w = workingSet(atlas, {
    ...defaultState(), selected: B, chain: [A_TO_B], horizon: 3000, layers: ['events:war'],
  });
  assert.ok(!w.path.has(A), 'a treaty is not on the path while treaties are off');
  for (const set of [w.selected, w.path, w.consequences, w.converging]) {
    for (const id of set) assert.ok(w.shown.has(id), `${id} is drawn but its category is off`);
  }
  for (const id of w.reachable.keys()) assert.ok(w.shown.has(id), id);
  const withActor = workingSet(atlas, {
    ...defaultState(), actor: 'fixture-actor-one', layers: ['events:war'],
  });
  for (const id of withActor.actor) assert.ok(withActor.shown.has(id), id);
});

test('the lens and the categories compose, and the lens itself is not narrowed by them', async () => {
  const atlas = await fixtureAtlas();
  const state = { ...defaultState(), focus: 'actor:fixture-actor-one', layers: ['events:war'] };
  const w = workingSet(atlas, state);
  // `lens` stays the reader's own question — what the graph draws one event to
  // a node — and `shown` is that question narrowed by the toggles.
  assert.ok(w.lens.has(A), 'A is in the lens: it is the actor\'s own event');
  assert.ok(!w.shown.has(A), 'and off the picture, because treaties are off');
  for (const id of w.shown) assert.ok(w.lens.has(id), `${id} is outside the lens`);
});

test('a token naming no category narrows to the uncategorised, and does not throw', async () => {
  const atlas = await fixtureAtlas();
  // `state.js` checks a token's shape and never its name — which categories
  // exist is deliberately not in that file — so a name nobody recognises gets
  // here and is simply a category no record has.
  const w = workingSet(atlas, { ...defaultState(), layers: ['events:not-a-category'] });
  assert.ok(w.shown instanceof Set);
  for (const id of Object.keys(CATEGORY_OF)) assert.ok(!w.shown.has(id), id);
  assert.ok(w.shown.has('fixture-event-d'), 'the events with no category are still drawn');
});

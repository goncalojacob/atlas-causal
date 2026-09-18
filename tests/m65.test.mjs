// Choosing an event is a filter, not a highlight (M65).
//
// Two rules, and the whole of this suite is about them being one answer and
// not three:
//
//   * **at rest every view draws only the main events** — an event with no
//     parent, or whose parent is not an active event here;
//   * **choosing an event hides everything unrelated** — what stays is the
//     event, its children, what it is part of, and one hop along an edge in
//     either direction.
//
// Both are asked of `emphasis.js`'s `shown`, which is the one set the map,
// the timeline, the graph and the masthead's count all filter by. That is why
// "the three views agree" is asserted here rather than three times: a view
// that drew from anything else would be the second filtering path this
// milestone exists to prevent, and `tests/m65-browser.test.mjs` is where the
// pictures themselves are held to it.
//
// Nothing here pins a count. The corpus moves every week and an assertion
// about 242 would be a assertion about the day it was written.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { workingSet } from '../src/emphasis.js';
import {
  lensView, restingSet, isMain, parentsOf, eventsOfFocus, activeFoci,
} from '../src/lens.js';
import { buildAdjacency } from '../src/graph.js';
import { defaultState } from '../src/state.js';
import { atlasOf, ROOT } from './helpers.mjs';

const dataDir = path.join(ROOT, 'data');

const sorted = (ids) => [...ids].sort();
const at = (patch) => ({ ...defaultState(), ...patch });

// ─── a corpus with a hierarchy in it ───────────────────────────────────────
//
// `war` holds two battles; one battle caused the treaty and the treaty caused
// something two hops out. `lonely` has neither children nor edges, and
// `elsewhere` is what every choice has to take away.
const event = (id, { parent = null, when = { start: 1500, end: 1500 } } = {}) => {
  const record = { id, title: id, status: 'active', when, place: null, region: 'europe', weight: 0, actors: [] };
  if (parent) record.parent = parent;
  return record;
};

const edge = (from, to) => [`${from}--${to}--caused`, {
  id: `${from}--${to}--caused`, from, to, type: 'caused', confidence: 'consensus', status: 'active',
}];

function topology() {
  const events = [
    event('war'),
    event('battle-a', { parent: 'war' }),
    event('battle-b', { parent: 'war' }),
    event('treaty'),
    event('far'),
    event('lonely'),
    event('elsewhere'),
  ];
  const edges = new Map([edge('battle-a', 'treaty'), edge('treaty', 'far')]);
  const byId = new Map(events.map((e) => [e.id, e]));
  const childrenOf = new Map([['war', ['battle-a', 'battle-b']]]);
  return {
    activeEvents: events,
    events: byId,
    edges,
    childrenOf,
    adjacency: buildAdjacency(events, [...edges.values()]),
    actors: new Map(),
    places: new Map(),
    sources: new Map(),
    narratives: new Map(),
    relations: new Map(),
    regions: [{ id: 'europe', label: 'Europe' }],
    eventsByActor: new Map(),
    resolve: () => null,
  };
}

// What every view draws, from the one place that decides it.
const drawn = (t, state) => workingSet(t, state).shown;

// ─── 1. at rest, only the main events ──────────────────────────────────────

test('at rest the shared source draws the main events and no other', () => {
  const t = topology();
  assert.deepEqual(sorted(drawn(t, at({}))), ['elsewhere', 'far', 'lonely', 'treaty', 'war']);
});

test('at rest the resting picture is exactly the events with no active parent', async () => {
  const atlas = await atlasOf(dataDir);
  const shown = drawn(atlas, at({}));
  // A property of what is drawn, not a list: every drawn event is main, and
  // every main event is drawn. The corpus may double and this still holds.
  for (const id of shown) {
    assert.ok(isMain(atlas, atlas.events.get(id)), `${id} is drawn at rest and has a parent`);
  }
  for (const record of atlas.activeEvents) {
    assert.equal(shown.has(record.id), isMain(atlas, record), `${record.id} is drawn at rest iff it is main`);
  }
  // And it is genuinely smaller than the corpus: a hierarchy that filed
  // nothing would make every assertion above vacuous.
  assert.ok(shown.size < atlas.activeEvents.length, 'the resting picture is a cut of the corpus');
});

test('a child of a retracted or absent parent is main, because it hangs nowhere', () => {
  const t = topology();
  t.events.get('battle-a').parent = 'never-written';
  assert.ok(isMain(t, t.events.get('battle-a')));
  t.events.get('battle-b').parent = 'war';
  t.events.get('war').status = 'retracted';
  assert.ok(isMain(t, t.events.get('battle-b')));
});

// ─── 2. choosing an event narrows ──────────────────────────────────────────

test('choosing a parent keeps it, its children and one hop, and nothing else', () => {
  const t = topology();
  // `war`, its two battles, and the treaty one hop out of a battle. Not
  // `far`, which is two hops; not `lonely`; not `elsewhere`.
  assert.deepEqual(sorted(drawn(t, at({ selected: 'war' }))), ['battle-a', 'battle-b', 'treaty', 'war']);
});

test('choosing a child keeps what it is part of, so the reader can see the regime', () => {
  const t = topology();
  assert.deepEqual(sorted(drawn(t, at({ selected: 'battle-a' }))), ['battle-a', 'treaty', 'war']);
  // The parent is related and not chosen, which is what dimmed has always
  // meant: it is in `near`, never in `set`.
  const view = lensView(t, at({ selected: 'battle-a' }));
  assert.ok(view.set.has('battle-a') && !view.set.has('war'));
  assert.ok(view.near.has('war') && view.near.has('treaty'));
});

test('the whole chain of parents stays, not the first one', () => {
  const t = topology();
  t.events.set('campaign', event('campaign', { parent: 'war' }));
  t.activeEvents.push(t.events.get('campaign'));
  t.events.get('battle-a').parent = 'campaign';
  t.childrenOf = new Map([['war', ['campaign', 'battle-b']], ['campaign', ['battle-a']]]);
  assert.deepEqual(sorted(parentsOf(t, new Set(['battle-a']))), ['campaign', 'war']);
});

test('a main event with neither children nor edges shows only itself', () => {
  const t = topology();
  assert.deepEqual(sorted(drawn(t, at({ selected: 'lonely' }))), ['lonely']);
});

test('choosing narrows on the real corpus too, and never to nothing', async () => {
  const atlas = await atlasOf(dataDir);
  const resting = drawn(atlas, at({}));
  // A parent from the hierarchy M62 wrote, whichever one it is today.
  const parent = atlas.activeEvents.find((e) => (atlas.childrenOf.get(e.id) ?? []).length > 0);
  assert.ok(parent, 'the corpus has a hierarchy to narrow inside');
  const chosen = drawn(atlas, at({ selected: parent.id }));
  assert.ok(chosen.has(parent.id), 'the chosen event is drawn');
  assert.ok(chosen.size < resting.size, 'choosing takes events away');
  for (const child of atlas.childrenOf.get(parent.id)) {
    assert.ok(chosen.has(child), `${child} is part of what was chosen`);
  }
  // Every event still drawn is one of the four reasons, and there is no fifth.
  const reachable = new Set([parent.id]);
  for (const id of eventsOfFocus({ kind: 'event', id: parent.id }, atlas)) reachable.add(id);
  for (const id of parentsOf(atlas, reachable)) reachable.add(id);
  for (const id of [...reachable]) {
    for (const direction of ['out', 'in']) {
      for (const e of atlas.adjacency[direction].get(id) ?? []) reachable.add(direction === 'out' ? e.to : e.from);
    }
  }
  for (const id of chosen) assert.ok(reachable.has(id), `${id} is drawn and is not related to the choice`);
});

// ─── 3. clearing restores the resting picture ──────────────────────────────

test('clearing the selection restores exactly the resting picture', async () => {
  const atlas = await atlasOf(dataDir);
  const before = drawn(atlas, at({}));
  drawn(atlas, at({ selected: atlas.activeEvents[0].id }));
  const after = drawn(atlas, at({}));
  assert.deepEqual(sorted(after), sorted(before));
});

// ─── 4. one source, so the views cannot disagree ───────────────────────────

test('the lens is what narrows, so every view that reads it narrows with it', () => {
  const t = topology();
  const state = at({ selected: 'battle-a' });
  // `workingSet().shown` is the lens narrowed by the category toggles, and it
  // is the only thing the three views filter their event list by. Asserting
  // the two are the same set here is asserting that no view can pick up a
  // different rule without this failing.
  assert.deepEqual(sorted(drawn(t, state)), sorted(lensView(t, state).shown));
  const resting = at({});
  assert.deepEqual(sorted(drawn(t, resting)), sorted(restingSet(t, resting)));
  assert.equal(lensView(t, resting), null, 'at rest there is no lens: the resting rule is not one');
});

// ─── 5. what the choice must not take away ─────────────────────────────────

test('a territorial selection is not an event selection (M54)', async () => {
  const atlas = await atlasOf(dataDir);
  // An actor whose lens reaches events through its ground as well as its own
  // lines. Opening it is a lens on the territory and stays one.
  const actor = [...atlas.actors.keys()].find((id) => (eventsOfFocus({ kind: 'actor', id }, atlas)?.size ?? 0) > 3);
  assert.ok(actor, 'the corpus has a territorial actor to open');
  const foci = activeFoci(atlas, at({ actor }));
  assert.deepEqual(foci, [{ kind: 'actor', id: actor }], 'an open actor is still its own lens');
  const shown = drawn(atlas, at({ actor }));
  for (const id of eventsOfFocus({ kind: 'actor', id: actor }, atlas)) {
    assert.ok(shown.has(id), `${id} is on the actor's ground and was taken away`);
  }
});

test('the walked chain survives the choice, however far out it ran', () => {
  const t = topology();
  const state = at({ selected: 'far', chain: ['battle-a--treaty--caused', 'treaty--far--caused'] });
  const shown = drawn(t, state);
  for (const id of ['battle-a', 'treaty', 'far']) {
    assert.ok(shown.has(id), `${id} is a step of the walk and must be drawn`);
  }
});

test('an open narrative is still the lens, and the step inside it does not narrow it', () => {
  const t = topology();
  t.narratives = new Map([['walk', {
    id: 'walk', title: 'A walk', status: 'active',
    steps: [{ ref: 'lonely' }, { ref: 'elsewhere' }],
  }]]);
  t.resolve = (id) => (t.narratives.has(id) ? { id, kind: 'narrative', record: t.narratives.get(id) } : null);
  const state = at({ narrative: 'walk', step: 0, selected: 'lonely' });
  assert.deepEqual(activeFoci(t, state), [{ kind: 'narrative', id: 'walk' }]);
  assert.ok(drawn(t, state).has('elsewhere'), 'a later step of the walk is not hidden by the step being read');
});

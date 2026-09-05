// The graph view's arrangement key: what it has to notice, and what it is
// allowed not to. A key that misses a change leaves the nodes where the last
// arrangement put them, which is worse than a key that is too coarse — the
// picture then says something about the data that is no longer true.
//
// The two things it used to miss are review finding 14's: the narrative lens
// and lane membership.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrangementKey, arrangementOf } from '../src/graph-view/arrangement.js';
import { lanesFor } from '../src/lanes.js';
import { defaultState } from '../src/state.js';

// Two actors and eleven events. Ten belong to one actor each; the eleventh
// belongs to both, which is what makes its lane a question the window
// answers — the heaviest of an event's actors is counted inside the band.
const event = (id, year, actors) => ({
  id,
  title: id,
  when: { start: year, end: year },
  region: 'europe',
  place: null,
  status: 'active',
  actors: actors.map((actor) => ({ actor, role: 'party' })),
});

const EVENTS = [
  ...[1900, 1901, 1902, 1903, 1904].map((y, i) => event(`early-${i}`, y, ['alfa'])),
  ...[1950, 1951, 1952, 1953].map((y, i) => event(`late-${i}`, y, ['beta'])),
  event('shared', 1910, ['alfa', 'beta']),
];

const ATLAS = {
  activeEvents: EVENTS,
  extent: { min: 1900, max: 1960 },
  actors: new Map([['alfa', { id: 'alfa', name: 'Alfa' }], ['beta', { id: 'beta', name: 'Beta' }]]),
  places: new Map(),
  regions: [{ id: 'europe', label: 'Europe', order: 1 }],
  edges: new Map(),
  sources: new Map(),
};

const state = (patch) => ({ ...defaultState(), ...patch });

// The reader's own lane list, so the six automatic lanes cannot reorder
// themselves and hide what is being tested behind a change of the ids.
const NAMED = { group: 'actor', lanes: ['alfa', 'beta'] };

test('the same lanes in the same order can still hold different events', () => {
  const whole = state({ ...NAMED });
  const late = state({ ...NAMED, from: 1905 });

  const a = arrangementOf(ATLAS, whole);
  const b = arrangementOf(ATLAS, late);

  // The premise: the lanes are the same two, in the same order, both times.
  assert.deepEqual(a.lanes.map((l) => l.id), ['alfa', 'beta']);
  assert.deepEqual(b.lanes.map((l) => l.id), ['alfa', 'beta']);

  // And the event both actors are in changes bands, because Alfa is the
  // heavier of the two over the whole span and the lighter after 1905.
  const laneOf = (arrangement, id) => arrangement.lanes.find((l) => l.members.has(id))?.id;
  assert.equal(laneOf(a, 'shared'), 'alfa');
  assert.equal(laneOf(b, 'shared'), 'beta');

  assert.notEqual(a.key, b.key, 'so the arrangement has to be laid out again');
});

test('a lens suspended by a narrative is a different arrangement', () => {
  const lensed = state({ focus: 'actor:alfa' });
  const reading = state({ focus: 'actor:alfa', narrative: 'a-walk', step: 0 });

  const a = arrangementOf(ATLAS, lensed);
  const b = arrangementOf(ATLAS, reading);
  assert.equal(a.events.length, 6, 'the lens keeps Alfa’s six');
  assert.equal(b.events.length, EVENTS.length, 'reading a narrative suspends it');
  assert.notEqual(a.key, b.key);
});

test('what the key is allowed not to notice', () => {
  const before = state({ ...NAMED, selected: 'shared' });
  const after = state({
    ...NAMED, selected: 'early-0', chain: [], bbox: [-10, 36, -6, 42], view: 'graph', horizon: 1955,
  });
  assert.equal(arrangementOf(ATLAS, before).key, arrangementOf(ATLAS, after).key,
    'selecting, walking and panning never move a node');
});

// The key is a function of the arrangement it is given, so it can be held to
// the two rules directly and not only through the atlas above.
test('the key reads membership rather than the lane ids, and the applied lens', () => {
  const s = state({ group: 'actor', lanes: ['alfa', 'beta'] });
  const lanes = lanesFor('actor', ATLAS, { from: 1900, to: 1960 }, null, ['alfa', 'beta']);
  const moved = lanes.map((lane) => ({ ...lane, members: new Set(lane.members) }));
  moved[0].members.delete('shared');
  moved[1].members.add('shared');
  assert.deepEqual(moved.map((l) => l.id), lanes.map((l) => l.id), 'the same lanes');
  assert.notEqual(arrangementKey(s, EVENTS, lanes, null), arrangementKey(s, EVENTS, moved, null));

  // A focus that is on but not applied reads as no focus, because that is
  // what the arrangement was built with.
  assert.equal(
    arrangementKey(state({ focus: 'actor:alfa' }), EVENTS, [], null),
    arrangementKey(state({ focus: null }), EVENTS, [], null),
  );
});

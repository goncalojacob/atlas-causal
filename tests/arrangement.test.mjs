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
import { buildAdjacency } from '../src/graph.js';
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

// Two walks, because since M48 reading one is itself a lens (lens.js) and two
// readings with no `?focus=` between them write the same parameter — nothing —
// while drawing two different sets of events.
const NARRATIVES = new Map([
  ['a-walk', { id: 'a-walk', title: 'A walk', status: 'active', steps: [{ ref: 'early-0' }, { ref: 'early-1' }] }],
  ['b-walk', { id: 'b-walk', title: 'B walk', status: 'active', steps: [{ ref: 'late-0' }] }],
]);

const ATLAS = {
  activeEvents: EVENTS,
  extent: { min: 1900, max: 1960 },
  actors: new Map([['alfa', { id: 'alfa', name: 'Alfa' }], ['beta', { id: 'beta', name: 'Beta' }]]),
  places: new Map(),
  regions: [{ id: 'europe', label: 'Europe', order: 1 }],
  edges: new Map(),
  sources: new Map(),
  events: new Map(EVENTS.map((e) => [e.id, e])),
  narratives: NARRATIVES,
  resolve: (id) => (NARRATIVES.has(id) ? { id, kind: 'narrative', record: NARRATIVES.get(id) } : null),
};

// `degree: 0` unless a test says otherwise: these are about the key and the
// band, and this atlas has no edges at all, so M48's degree floor would empty
// every arrangement here for a reason none of them is about. The floor has
// tests of its own at the foot of the file, over an atlas that has some.
const state = (patch) => ({ ...defaultState(), degree: 0, ...patch });

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

// Review finding 14 was a key made of `state.focus` while the lens applied was
// something else. M48 gives the atlas a second way of being in that position:
// a narrative sets the lens and writes no parameter at all, so two walks —
// and a walk against no walk — are three arrangements that the parameter
// cannot tell apart.
test('reading a narrative is a lens, and two walks are two arrangements', () => {
  const none = arrangementOf(ATLAS, state({}));
  const a = arrangementOf(ATLAS, state({ narrative: 'a-walk', step: 0 }));
  const b = arrangementOf(ATLAS, state({ narrative: 'b-walk', step: 0 }));

  assert.equal(none.events.length, EVENTS.length, 'no lens, no narrowing');
  assert.equal(a.events.length, 2, 'the walk and its ring, which is empty here');
  assert.equal(b.events.length, 1);
  assert.notEqual(a.key, none.key);
  assert.notEqual(a.key, b.key, 'two walks write the same parameter and draw different pictures');
});

test('an explicit lens while reading is the one that is applied', () => {
  const lensed = state({ focus: 'actor:alfa' });
  const reading = state({ focus: 'actor:alfa', narrative: 'a-walk', step: 0 });

  const a = arrangementOf(ATLAS, lensed);
  const b = arrangementOf(ATLAS, reading);
  assert.equal(a.events.length, 6, 'the lens keeps Alfa’s six');
  assert.equal(b.events.length, 6, 'and the reader’s own focus still wins while reading');
  assert.equal(a.key, b.key);
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

// --- the window is what is laid out (H4b) -------------------------------
//
// Until H4b the whole corpus was laid out and the window only decided which
// of the coordinates were drawn, which meant paying for thirty thousand
// events to look at a decade. The band and one period either side is now the
// arrangement itself, and the band is therefore part of its key.

test('the arrangement is the band and one period either side, and no more', () => {
  // The whole extent: everything, as before.
  assert.equal(arrangementOf(ATLAS, state({})).events.length, EVENTS.length);
  // A band ending in 1900 reaches 1950 with the margin, and stops there.
  const narrow = arrangementOf(ATLAS, state({ to: 1900 }));
  assert.deepEqual(
    narrow.events.map((e) => e.id).sort(),
    ['early-0', 'early-1', 'early-2', 'early-3', 'early-4', 'late-0', 'shared'],
  );
  assert.notEqual(narrow.key, arrangementOf(ATLAS, state({})).key, 'moving the band moves the nodes');
});

test('what the reader is holding beyond the margin is laid out anyway', () => {
  const narrow = state({ to: 1900, selected: 'late-3' });
  const dropped = arrangementOf(ATLAS, narrow);
  assert.ok(!dropped.events.some((e) => e.id === 'late-3'), 'nothing is holding it yet');
  const held = arrangementOf(ATLAS, narrow, new Set(['late-3']));
  assert.ok(held.events.some((e) => e.id === 'late-3'), 'a chain that ran off the band is still a chain');
  assert.notEqual(held.key, dropped.key);
});

// The holding only enters the key when something held is outside the band.
// Otherwise selecting an event would move every node in the picture, which
// is what the test above about panning and walking says it must not.
test('holding something inside the band is not part of the key', () => {
  const a = arrangementOf(ATLAS, state({ selected: 'early-0' }), new Set(['early-0']));
  const b = arrangementOf(ATLAS, state({ selected: 'shared', actor: 'beta' }), new Set(['shared', 'late-0']));
  assert.equal(a.key, b.key);

  // And when it is outside, two different holdings are two different keys.
  const narrow = { to: 1900 };
  const one = arrangementOf(ATLAS, state({ ...narrow, selected: 'late-3' }), new Set(['late-3']));
  const two = arrangementOf(ATLAS, state({ ...narrow, selected: 'late-2' }), new Set(['late-2']));
  assert.notEqual(one.key, two.key);
});

// ─── what the graph draws (M48 §3) ─────────────────────────────────────────
//
// 103 of the 250 active events have one edge or none and eight carry seven or
// more. The graph draws what organises other events; everything else is still
// on the map, still on the timeline, still reachable by walking, by searching
// and by focusing — which is what makes this a filter and not a deletion.

// A hub with three links, a pair with one each, and a leaf with none.
const LINKED = [
  event('hub', 1900, ['alfa']),
  event('spoke-one', 1901, ['alfa']),
  event('spoke-two', 1902, ['alfa']),
  event('spoke-three', 1903, ['alfa']),
  event('leaf', 1904, ['beta']),
  { ...event('part', 1905, ['beta']), parent: 'hub' },
];
const LINKS = [
  { id: 'hub--spoke-one--caused', from: 'hub', to: 'spoke-one', type: 'caused', confidence: 'consensus', status: 'active' },
  { id: 'hub--spoke-two--caused', from: 'hub', to: 'spoke-two', type: 'caused', confidence: 'consensus', status: 'active' },
  { id: 'hub--spoke-three--caused', from: 'hub', to: 'spoke-three', type: 'caused', confidence: 'consensus', status: 'active' },
  { id: 'spoke-one--spoke-two--caused', from: 'spoke-one', to: 'spoke-two', type: 'caused', confidence: 'consensus', status: 'active' },
];
const LINKED_ATLAS = {
  ...ATLAS,
  activeEvents: LINKED,
  events: new Map(LINKED.map((e) => [e.id, e])),
  edges: new Map(LINKS.map((e) => [e.id, e])),
  adjacency: buildAdjacency(LINKED, LINKS),
};

const drawn = (patch, held = null) => arrangementOf(LINKED_ATLAS, state(patch), held).events.map((e) => e.id).sort();

test('the degree floor draws what organises and leaves the rest out', () => {
  assert.deepEqual(drawn({ degree: 0 }), ['hub', 'leaf', 'part', 'spoke-one', 'spoke-three', 'spoke-two']);
  // One link or more drops the two with none.
  assert.deepEqual(drawn({ degree: 1 }), ['hub', 'spoke-one', 'spoke-three', 'spoke-two']);
  // Two or more keeps the hub and the one spoke that joins two others.
  assert.deepEqual(drawn({ degree: 2 }), ['hub', 'spoke-one', 'spoke-two']);
  assert.deepEqual(drawn({ degree: 3 }), ['hub']);
});

test('top level only leaves out an event that is part of another', () => {
  assert.deepEqual(drawn({ degree: 0, tops: true }), ['hub', 'leaf', 'spoke-one', 'spoke-three', 'spoke-two']);
});

test('a filter never takes away what the reader is holding', () => {
  // Walking to a hidden event brings it into the picture: that is the whole
  // difference between a filter and a deletion.
  assert.deepEqual(drawn({ degree: 3 }, new Set(['leaf'])), ['hub', 'leaf']);
  assert.deepEqual(drawn({ degree: 0, tops: true }, new Set(['part'])).includes('part'), true);
});

test('neither filter applies inside a lens', () => {
  // `shown` is what the view draws at all, handed in by the graph from
  // emphasis.js. With one, the reader has already said what they want.
  const lensed = arrangementOf(LINKED_ATLAS, state({ degree: 3, focus: 'actor:beta' }),
    null, new Set(['leaf', 'part']));
  assert.deepEqual(lensed.events.map((e) => e.id).sort(), ['leaf', 'part']);
});

test('the key notices the filters, and only where they are applied', () => {
  const at = (patch) => arrangementOf(LINKED_ATLAS, state(patch), null).key;
  assert.notEqual(at({ degree: 2 }), at({ degree: 3 }), 'two floors are two pictures');
  assert.notEqual(at({ degree: 2 }), at({ degree: 2, tops: true }));
  // Inside a lens they are off, so two states that differ only in them draw
  // the same picture and must not be laid out twice.
  const lensKey = (patch) => arrangementOf(LINKED_ATLAS, state({ focus: 'actor:beta', ...patch }),
    null, new Set(['leaf', 'part'])).key;
  assert.equal(lensKey({ degree: 2 }), lensKey({ degree: 3, tops: true }));
});

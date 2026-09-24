// M87 — what breaks at 3,000 events, without a browser. The sections of
// docs/m87-brief.md whose subject is a pure answer: the lens's cache, the
// validator's reading of a cached lead, and the import tool's place reuse.
//
// Nothing here pins a count: what is asserted is that a second question costs
// nothing the first did not, which is a fact about the code and not about the
// size of the corpus that day.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lensView, activeFoci } from '../src/lens.js';

// An atlas the size of a test, with one thing added: `activeEvents` counts how
// many times it was read. `eventsOfFocus` walks that list — and builds a Set of
// every id from it — for an actor, a place, a region, a source and a narrative
// alike, so a count of these reads is a count of the scans (review B10).
//
// `attributeShardsArrived` is what says the atlas can tell when it has changed,
// and therefore what the memo is allowed to key on; the two `…Loaded` answers
// are the other half of that stamp.
function countingAtlas({ arrived = 1, grounds = true } = {}) {
  const events = [
    { id: 'a', status: 'active', when: { start: 1970, end: 1970 }, place: 'lisbon', region: 'europe', actors: [{ actor: 'salazar', role: 'leader' }] },
    { id: 'b', status: 'active', when: { start: 1971, end: 1971 }, place: 'lisbon', region: 'europe', actors: [] },
    { id: 'c', status: 'active', when: { start: 1972, end: 1972 }, place: 'porto', region: 'europe', actors: [{ actor: 'salazar', role: 'leader' }] },
  ];
  const state = { scans: 0 };
  return {
    state,
    atlas: {
      get activeEvents() { state.scans += 1; return events; },
      events: new Map(events.map((e) => [e.id, e])),
      edges: new Map(),
      sources: new Map(),
      narratives: new Map(),
      relations: new Map(),
      actors: new Map([['salazar', { id: 'salazar', name: 'Salazar' }]]),
      places: new Map([['lisbon', { id: 'lisbon', name: 'Lisbon' }], ['porto', { id: 'porto', name: 'Porto' }]]),
      regions: [{ id: 'europe', label: 'Europe' }],
      childrenOf: new Map(),
      resolve: (id) => {
        if (id === 'salazar') return { id, kind: 'actor', record: { id, name: 'Salazar' } };
        if (id === 'lisbon' || id === 'porto') return { id, kind: 'place', record: { id } };
        const found = events.find((e) => e.id === id);
        return found ? { id, kind: 'event', record: found } : null;
      },
      attributeShardsArrived: () => arrived,
      groundsLoaded: () => grounds,
      territoriesLoaded: () => grounds,
    },
  };
}

// §7 (B10). `lensView` built the stamp its own cache is keyed on out of
// `activeFoci`, which for an actor or a place walks every active event before
// the cache is ever asked — about ten times per state change, and on every move
// of a band drag. The answer is looked up first now.
test('§7: the second lensView for the same state does not scan the corpus again', () => {
  const { atlas, state: counted } = countingAtlas();
  const state = { focus: null, actor: 'salazar', selected: null };

  const first = lensView(atlas, state);
  assert.ok(first, 'an actor with events is a lens');
  const afterFirst = counted.scans;
  assert.ok(afterFirst > 0, 'the first answer cost a scan');

  const second = lensView(atlas, state);
  assert.equal(second, first, 'and it is the same answer');
  assert.equal(counted.scans, afterFirst, 'the second cost none');

  // And the callers that ask `activeFoci` directly — main.js, the chips, the
  // masthead's count — are answered out of the same cache.
  activeFoci(atlas, state);
  activeFoci(atlas, state);
  assert.equal(counted.scans, afterFirst, 'nor do the other callers of activeFoci');
});

// The cache may never be the reason an answer goes stale: an actor's lens is
// the `actors` list alone until the grounds file lands, and a narrative's walk
// is empty until its century does. Both are outside the state, so both are in
// the stamp.
test('§7: a file landing is a new answer, and a different state is its own', () => {
  const early = countingAtlas({ arrived: 1, grounds: false });
  const state = { focus: null, actor: 'salazar', selected: null };
  lensView(early.atlas, state);
  const afterFirst = early.state.scans;
  lensView(early.atlas, state);
  assert.equal(early.state.scans, afterFirst, 'the same atlas and the same state: one answer');

  // The same state object, an atlas that has changed under it.
  let arrived = 1;
  const moving = countingAtlas();
  moving.atlas.attributeShardsArrived = () => arrived;
  lensView(moving.atlas, state);
  const before = moving.state.scans;
  arrived = 2;
  lensView(moving.atlas, state);
  assert.ok(moving.state.scans > before, 'a shard landing is asked again');

  // A different state is a different question, whatever the atlas has.
  const other = { focus: null, actor: null, place: 'lisbon', selected: null };
  const was = moving.state.scans;
  lensView(moving.atlas, other);
  assert.ok(moving.state.scans > was, 'and a state nobody has asked about is worked out');
});

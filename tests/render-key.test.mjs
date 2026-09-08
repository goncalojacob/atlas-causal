// The render key, and the margin the views draw beyond the band. Both are
// pure, and both are promises a view cannot make on its own: a key that
// misses a field leaves a stale picture, and a margin that is not symmetric
// would draw further one way than the other.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderKey, stateKey, shardsArrived } from '../src/render-key.js';
import { MARGIN_YEARS, withMargin, resolveWindow, overlaps } from '../src/util/window.js';
import { createState } from '../src/state.js';

// A store with no window and no URL behind it: `createState` is what the
// pages build, so the key is tested against the state's own shape rather
// than against a hand-written object that could drift from it.
const store = () => createState({}, { window: null });

test('two states that say the same thing key the same, whatever order they were written in', () => {
  const a = { selected: 'x', chain: ['e1', 'e2'], from: null, layers: ['land', 'events'] };
  const b = { layers: ['land', 'events'], from: null, chain: ['e1', 'e2'], selected: 'x' };
  assert.equal(stateKey(a), stateKey(b));
});

test('every field of the state is in the key', () => {
  const base = store().get();
  const key = stateKey(base);
  for (const name of Object.keys(base)) {
    assert.ok(key.includes(`${name}=`), `${name} is not in the key`);
  }
});

// The point of the whole thing: a field a view does not obviously read still
// changes the key, because the alternative is a picture that is quietly out
// of date. Every scalar field, one at a time.
test('changing any one field changes the key', () => {
  const base = store().get();
  const changed = {
    from: 1900, to: 1950, view: 'graph', focus: 'actor:x', focusAll: true, group: 'actor', lanes: ['a'],
    selected: 'e', source: 's', place: 'p', actor: 'a', office: 'o', chain: ['c'], horizon: 1970,
    layers: ['events'], narrative: 'n', step: 3, walk: 'w', bbox: [0, 1, 2, 3],
  };
  for (const [name, value] of Object.entries(changed)) {
    assert.notEqual(stateKey({ ...base, [name]: value }), stateKey(base), name);
  }
  // Nothing in the state was left out of the table above, or the loop proved
  // less than it looks like it proves.
  assert.deepEqual(Object.keys(base).sort(), Object.keys(changed).sort());
});

test("a view's own parts are in the key beside the state", () => {
  const s = store().get();
  assert.equal(renderKey(s, 1, 2, 3), renderKey(s, 1, 2, 3));
  assert.notEqual(renderKey(s, 1, 2, 3), renderKey(s, 1, 2, 4));
  assert.notEqual(renderKey(s, 1, 2, 3), stateKey(s));
});

// I4a: since the pages read the core, a title arrives after the picture does,
// and a shard landing is a change no field of the state can see. So it is one
// integer in every one of the four keys, read in one place so the map, the
// timeline, the graph and the panel cannot come to disagree about it.
test('an atlas with no shards to speak of keys the same for ever', () => {
  const s = store().get();
  // What an atlas built from the spine gives: it has every attribute in hand
  // from the moment it exists and never changes underneath a view.
  assert.equal(shardsArrived({ events: new Map() }), 0);
  assert.equal(shardsArrived(null), 0);
  assert.equal(renderKey(s, shardsArrived(null)), renderKey(s, shardsArrived(undefined)));
});

test('a shard arriving changes the key, and nothing else about the state does', () => {
  const s = store().get();
  let arrived = 0;
  const atlas = { attributeShardsArrived: () => arrived };
  const key = () => renderKey(s, shardsArrived(atlas));
  const before = key();
  assert.equal(key(), before, 'nothing happened, nothing to draw again');
  arrived += 1;
  const after = key();
  assert.notEqual(after, before, 'a shard landed and the view has to draw again');
  // And an eviction is an arrival for this purpose: the records in the shard
  // that was dropped have just lost their titles, which is as much a change to
  // the picture as gaining them was. A count of the shards *held* would say
  // "four" before and after a fifth arriving over a full cap, and the view
  // would skip exactly the redraw that took the labels off.
  arrived += 1;
  assert.notEqual(key(), after, 'a shard was dropped and the view has to draw again');
});

test('the margin is one period each side, and null stays null', () => {
  assert.deepEqual(withMargin({ from: 1960, to: 1975 }), { from: 1960 - MARGIN_YEARS, to: 1975 + MARGIN_YEARS });
  assert.equal(withMargin(null), null);
  assert.deepEqual(withMargin({ from: 0, to: 0 }, 10), { from: -10, to: 10 });
});

// What the views actually ask of it: an event just outside the band is
// drawn, one a period further out is not, and the margin never narrows the
// window.
test('the margin widens what a view draws and never narrows it', () => {
  const window = resolveWindow({ from: 2000, to: 2025 }, { min: 1899, max: 2025 });
  const margin = withMargin(window);
  const at = (year) => ({ start: year, end: year });
  assert.ok(overlaps(at(2010), window) && overlaps(at(2010), margin), 'inside the band');
  assert.ok(!overlaps(at(1980), window) && overlaps(at(1980), margin), 'inside the margin');
  assert.ok(!overlaps(at(1930), margin), 'past the margin');
});

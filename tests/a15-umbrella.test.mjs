// A15(11) — the number "chains throughout the globe and time" is.
//
// An edge between two parts of one war is that war's internal structure; an
// edge between two events with no umbrella in common is the thing the owner
// asked for. The 25 September review found the second number reported for no
// batch at all, so it is now `tools/m42-pool.mjs`'s own output — a command's
// answer and not a scratch script's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossesUmbrella, measure } from '../tools/m42-pool.mjs';

const parentsFor = (event) => (Array.isArray(event.parent) ? event.parent : event.parent ? [event.parent] : []);

test('two parts of one umbrella do not cross it', () => {
  const byId = new Map([
    ['a', { id: 'a', parent: 'war' }],
    ['b', { id: 'b', parent: 'war' }],
    ['c', { id: 'c', parent: 'other-war' }],
    ['top', { id: 'top' }],
  ]);
  assert.equal(crossesUmbrella({ from: 'a', to: 'b' }, byId, parentsFor), false);
  assert.equal(crossesUmbrella({ from: 'a', to: 'c' }, byId, parentsFor), true);
  // A main event is part of nothing, so it shares no umbrella with anything.
  assert.equal(crossesUmbrella({ from: 'top', to: 'a' }, byId, parentsFor), true);
  assert.equal(crossesUmbrella({ from: 'top', to: 'top' }, byId, parentsFor), true);
  // One shared umbrella out of several is enough not to cross.
  const several = new Map([
    ['x', { id: 'x', parent: ['war', 'century'] }],
    ['y', { id: 'y', parent: ['other-war', 'century'] }],
  ]);
  assert.equal(crossesUmbrella({ from: 'x', to: 'y' }, several, parentsFor), false);
  // An end the atlas does not hold is not a chain between two things.
  assert.equal(crossesUmbrella({ from: 'a', to: 'nowhere' }, byId, parentsFor), false);
});

test('the two halves partition the edges between active events', () => {
  const events = [
    { id: 'war', status: 'active' },
    { id: 'a', status: 'active', parent: 'war' },
    { id: 'b', status: 'active', parent: 'war' },
    { id: 'far', status: 'active' },
    { id: 'gone', status: 'retracted' },
  ];
  const edges = [
    { id: 'a--b', status: 'active', from: 'a', to: 'b' },
    { id: 'a--far', status: 'active', from: 'a', to: 'far' },
    { id: 'war--far', status: 'active', from: 'war', to: 'far' },
    { id: 'a--gone', status: 'active', from: 'a', to: 'gone' },
    { id: 'b--far', status: 'retracted', from: 'b', to: 'far' },
  ];
  const out = measure(events, edges);
  assert.equal(out.linksBetweenActive, 3);
  assert.equal(out.crossingAnUmbrella, 2);
  assert.equal(out.insideOneUmbrella, 1);
  assert.equal(out.crossingAnUmbrella + out.insideOneUmbrella, out.linksBetweenActive);
});

test('a retracted parent is not an umbrella', () => {
  // `isMain` in the same file reads active parents only, and so does this.
  const events = [
    { id: 'dead', status: 'retracted' },
    { id: 'a', status: 'active', parent: 'dead' },
    { id: 'b', status: 'active', parent: 'dead' },
  ];
  const edges = [{ id: 'a--b', status: 'active', from: 'a', to: 'b' }];
  const out = measure(events, edges);
  assert.equal(out.main, 2, 'both are main, because their parent is retracted');
  assert.equal(out.crossingAnUmbrella, 1);
});

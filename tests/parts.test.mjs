// Which events the three views draw a ring around (m30c-brief, §1). A ring
// says "there is more inside", so what it is drawn around is decided in one
// pure function and the map, the timeline and the graph only draw the answer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isParent } from '../src/parts.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

test('an event with at least one active part is a parent, and a leaf is not', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const f = atlas.events.get('fixture-event-f');
  assert.deepEqual(atlas.childrenOf.get(f.id), ['fixture-event-t', 'fixture-event-h']);
  assert.equal(isParent(atlas, f), true);
  for (const id of ['fixture-event-t', 'fixture-event-h', 'fixture-event-b']) {
    assert.equal(isParent(atlas, atlas.events.get(id)), false, `${id} holds nothing`);
  }
});

// `childrenOf` is built from the active events alone (data.js), so a part that
// has been withdrawn cannot leave a ring behind it on a record with nothing
// inside; and a parent that has itself been withdrawn is not something to send
// a reader inside, whatever its parts still say.
test('a withdrawn record is never a parent, in either direction', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const f = atlas.events.get('fixture-event-f');
  for (const status of ['retracted', 'merged']) {
    assert.equal(isParent({ ...atlas, events: atlas.events }, { ...f, status }), false, status);
  }
  const empty = { childrenOf: new Map() };
  assert.equal(isParent(empty, f), false, 'nothing inside it any more');
});

// The three views ask this before they have anything to ask it about: a card
// with no record open, a layer rendering an atlas built from the core alone.
test('no event, and an atlas with no parts at all, are answered and not thrown at', () => {
  assert.equal(isParent({ childrenOf: new Map() }, null), false);
  assert.equal(isParent({}, { id: 'x', status: 'active' }), false);
});

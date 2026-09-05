// The walked chain against the status of its steps. `atlas.edges` holds every
// edge the topology carries, tombstones included, so a link somebody was sent
// last year can name a step the project has since withdrawn.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chainEdges, retractedSteps, walkPatch, walkOrSelect } from '../src/chain.js';

const edge = (id, status = 'active') => [id, { id, status, from: `${id}-from`, to: `${id}-to` }];
const atlas = {
  edges: new Map([edge('a--b--caused'), edge('b--c--enabled', 'retracted'), edge('c--d--caused')]),
};

test('a walk is resolved to the steps that still stand', () => {
  assert.deepEqual(chainEdges(atlas, []).map((e) => e.id), []);
  assert.deepEqual(chainEdges(atlas, ['a--b--caused']).map((e) => e.id), ['a--b--caused']);
  assert.deepEqual(chainEdges(atlas, ['a--b--caused', 'c--d--caused']).map((e) => e.id),
    ['a--b--caused', 'c--d--caused']);
});

// Cut, not filtered: the steps after a withdrawn one were reached through it,
// so a walk with a hole in its middle is not the walk that was shared.
test('a retracted step cuts the walk there rather than being lifted out of it', () => {
  const shared = ['a--b--caused', 'b--c--enabled', 'c--d--caused'];
  assert.deepEqual(chainEdges(atlas, shared).map((e) => e.id), ['a--b--caused']);
  assert.equal(retractedSteps(atlas, shared), 2, 'the step itself and the one that followed it');
  assert.deepEqual(chainEdges(atlas, ['b--c--enabled']).map((e) => e.id), []);
  assert.equal(retractedSteps(atlas, ['b--c--enabled']), 1);
});

// state.js checks the shape of a chain step and never whether it names
// anything, so a link with a typo in it has always simply had nothing to draw.
// Calling that a retraction would be a claim the atlas cannot support.
test('a step that names no edge at all is not a retraction', () => {
  const typo = ['a--b--caused', 'x--y--caused'];
  assert.deepEqual(chainEdges(atlas, typo).map((e) => e.id), ['a--b--caused']);
  assert.equal(retractedSteps(atlas, typo), 0);
  assert.equal(retractedSteps(atlas, ['a--b--caused']), 0, 'nothing was dropped');
});

// --- one click, three pictures ---------------------------------------------
//
// A click on a mark that is a consequence of the event already open follows
// that link. The graph did it and the map and the timeline threw the walk
// away, while the map had just drawn the line the reader was following
// (health review B, finding 10).

const walkable = {
  adjacency: {
    out: new Map([
      ['revolution', [{ id: 'revolution--alvor--caused', to: 'alvor' }, { id: 'revolution--elections--caused', to: 'elections' }]],
      ['alvor', [{ id: 'alvor--war--caused', to: 'war' }]],
    ]),
  },
};

test('a consequence of what is open is a step; anything else starts afresh', () => {
  assert.deepEqual(
    walkPatch(walkable, { selected: 'revolution', chain: [] }, 'alvor'),
    { selected: 'alvor', chain: ['revolution--alvor--caused'] },
  );
  // And the next one goes on the end of the walk so far.
  assert.deepEqual(
    walkPatch(walkable, { selected: 'alvor', chain: ['revolution--alvor--caused'] }, 'war'),
    { selected: 'war', chain: ['revolution--alvor--caused', 'alvor--war--caused'] },
  );
  // An event that does not follow from what is open is a fresh start, walk
  // and all: the chain is one argument and this is not part of it.
  assert.deepEqual(
    walkPatch(walkable, { selected: 'revolution', chain: ['x'] }, 'goa'),
    { selected: 'goa', chain: [] },
  );
  // Nothing open, and a cause rather than a consequence: also a fresh start.
  assert.deepEqual(walkPatch(walkable, { selected: null, chain: [] }, 'alvor'), { selected: 'alvor', chain: [] });
  assert.deepEqual(walkPatch(walkable, { selected: 'alvor', chain: [] }, 'revolution'), { selected: 'revolution', chain: [] });
  // A state with no chain at all is a state with an empty one.
  assert.deepEqual(walkPatch(walkable, { selected: 'revolution' }, 'alvor'),
    { selected: 'alvor', chain: ['revolution--alvor--caused'] });
});

test('walkOrSelect is that rule, applied to the store', () => {
  const patches = [];
  const store = { get: () => ({ selected: 'revolution', chain: [] }), set: (p) => patches.push(p) };
  walkOrSelect(store, walkable, 'elections');
  assert.deepEqual(patches, [{ selected: 'elections', chain: ['revolution--elections--caused'] }]);
});

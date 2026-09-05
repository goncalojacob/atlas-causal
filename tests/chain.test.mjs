// The walked chain against the status of its steps. `atlas.edges` holds every
// edge the topology carries, tombstones included, so a link somebody was sent
// last year can name a step the project has since withdrawn.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chainEdges, retractedSteps } from '../src/chain.js';

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

// The lens removes rather than dims, so what it keeps has to be exactly
// right: an event wrongly dropped is an event the reader cannot know is
// missing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lensFor, lensSet, shownEvents, parseFocus, lensLabel } from '../src/lens.js';

const event = (id, { actors = [], place = null, when = { start: 1970, end: 1970 } } = {}) => ({
  id, title: id, status: 'active', when, place, region: 'europe', weight: 0,
  actors: actors.map((a) => (typeof a === 'string' ? { actor: a, role: 'leader' } : a)),
});

// Four events, two edges, one source cited from both ends of one edge.
function topology() {
  const events = [
    event('a', { actors: ['salazar'], place: 'lisbon' }),
    event('b', { actors: ['salazar', 'pide'], place: 'porto' }),
    event('c', { actors: ['pide'], place: 'lisbon' }),
    event('d', { actors: [], place: null }),
  ];
  const edges = new Map([
    ['a--b--caused', { id: 'a--b--caused', from: 'a', to: 'b', type: 'caused', status: 'active' }],
    ['c--d--enabled', { id: 'c--d--enabled', from: 'c', to: 'd', type: 'enabled', status: 'retracted' }],
  ]);
  const sources = new Map([
    ['book', {
      id: 'book',
      title: 'A Book',
      citations: [
        { kind: 'event', id: 'c', locator: 'p. 1' },
        { kind: 'edge', id: 'a--b--caused', locator: 'p. 2' },
        { kind: 'actor', id: 'salazar' },
      ],
    }],
    ['dead', {
      id: 'dead',
      title: 'Cited only by a retracted edge',
      citations: [{ kind: 'edge', id: 'c--d--enabled' }],
    }],
  ]);
  return {
    activeEvents: events,
    events: new Map(events.map((e) => [e.id, e])),
    edges,
    sources,
    actors: new Map([['salazar', { id: 'salazar', name: 'Salazar' }], ['pide', { id: 'pide', name: 'PIDE' }]]),
    places: new Map([['lisbon', { id: 'lisbon', name: 'Lisbon' }], ['porto', { id: 'porto', name: 'Porto' }]]),
  };
}

test('no focus is not the same as an empty lens', () => {
  const t = topology();
  assert.equal(lensFor(null, t), null);
  assert.equal(lensFor('', t), null);
  assert.equal(lensFor('actor:', t), null);
  assert.equal(lensFor('narrative:x', t), null, 'only three kinds have a lens');
  assert.equal(lensFor('actor:NOT A SLUG', t), null);
  const empty = lensFor('actor:nobody', t);
  assert.ok(empty instanceof Set);
  assert.equal(empty.size, 0, 'a focus that matches nothing draws nothing');
});

test('parseFocus reads the three kinds and refuses everything else', () => {
  assert.deepEqual(parseFocus('actor:salazar'), { kind: 'actor', id: 'salazar' });
  assert.deepEqual(parseFocus('place:santa-comba-dao'), { kind: 'place', id: 'santa-comba-dao' });
  assert.deepEqual(parseFocus('source:russell-2000-henry'), { kind: 'source', id: 'russell-2000-henry' });
  for (const bad of ['actor', 'actor:', ':x', 'edge:a--b--caused', 'actor:Salazar', 'actor:x y', 42, null]) {
    assert.equal(parseFocus(bad), null, String(bad));
  }
});

test('an actor lens keeps the events that name it, once each', () => {
  const ids = lensFor('actor:salazar', topology());
  assert.deepEqual([...ids].sort(), ['a', 'b']);
  // An actor named twice in one event under two roles is still one event.
  const t = topology();
  t.activeEvents[0].actors = [{ actor: 'salazar', role: 'leader' }, { actor: 'salazar', role: 'signatory' }];
  assert.deepEqual([...lensFor('actor:salazar', t)].sort(), ['a', 'b']);
});

test('a place lens is the events that happened there', () => {
  assert.deepEqual([...lensFor('place:lisbon', topology())].sort(), ['a', 'c']);
  assert.deepEqual([...lensFor('place:porto', topology())].sort(), ['b']);
});

test('a source lens is what cites it, and both ends of an edge that does', () => {
  // 'c' cites it itself; the edge a→b cites it, so both a and b are in.
  assert.deepEqual([...lensFor('source:book', topology())].sort(), ['a', 'b', 'c']);
});

test('a source lens ignores citations that are not events or edges', () => {
  const t = topology();
  t.sources.get('book').citations = [{ kind: 'actor', id: 'salazar' }, { kind: 'place', id: 'lisbon' }];
  assert.equal(lensFor('source:book', t).size, 0);
});

test('a source lens never revives a tombstone', () => {
  const t = topology();
  // The one citing edge is retracted, so it drags neither of its ends in.
  assert.equal(lensFor('source:dead', t).size, 0);
  // Nor does a citation naming an event that is not among the active ones.
  t.sources.get('book').citations = [{ kind: 'event', id: 'gone' }];
  assert.equal(lensFor('source:book', t).size, 0);
});

test('reading a narrative suspends the lens', () => {
  const t = topology();
  assert.equal(lensSet(t, { focus: 'actor:salazar', narrative: null }).size, 2);
  assert.equal(lensSet(t, { focus: 'actor:salazar', narrative: 'how-it-ended' }), null);
});

test('shownEvents keeps the atlas order and the whole list without a lens', () => {
  const t = topology();
  assert.deepEqual(shownEvents(t, { focus: null }).map((e) => e.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(shownEvents(t, { focus: 'actor:pide' }).map((e) => e.id), ['b', 'c']);
});

test('the lens is labelled by the record it names, or by its id', () => {
  const t = topology();
  assert.deepEqual(lensLabel(t, 'actor:salazar'), { kind: 'actor', id: 'salazar', name: 'Salazar' });
  assert.deepEqual(lensLabel(t, 'place:lisbon'), { kind: 'place', id: 'lisbon', name: 'Lisbon' });
  assert.deepEqual(lensLabel(t, 'source:book'), { kind: 'source', id: 'book', name: 'A Book' });
  assert.deepEqual(lensLabel(t, 'actor:gone'), { kind: 'actor', id: 'gone', name: 'gone' });
  assert.equal(lensLabel(t, 'rubbish'), null);
});

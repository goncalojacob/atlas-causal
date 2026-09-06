// The lens removes rather than dims, so what it keeps has to be exactly
// right: an event wrongly dropped is an event the reader cannot know is
// missing. Since H7 it takes any number of foci of any of six kinds, and
// keeps two sets rather than one — what was asked for, and the one hop of
// neighbours around it that is drawn faintly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lensFor, eventsOfFocus, focusSet, ringOf, lensView, lensSet, lensNear, shownEvents,
  parseFocus, parseFoci, formatFoci, lensLabel, lensLabels, activeFoci,
  withFocus, onlyFocus, withoutFocus, FOCUS_NONE,
} from '../src/lens.js';
import { defaultState } from '../src/state.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

const event = (id, { actors = [], place = null, region = 'europe', when = { start: 1970, end: 1970 } } = {}) => ({
  id, title: id, status: 'active', when, place, region, weight: 0,
  actors: actors.map((a) => (typeof a === 'string' ? { actor: a, role: 'leader' } : a)),
});

// Five events, two edges, one source cited from both ends of one edge, one
// narrative walking two of them.
function topology() {
  const events = [
    event('a', { actors: ['salazar'], place: 'lisbon' }),
    event('b', { actors: ['salazar', 'pide'], place: 'porto' }),
    event('c', { actors: ['pide'], place: 'lisbon' }),
    event('d', { actors: [], place: null, region: 'africa' }),
  ];
  const edges = new Map([
    ['a--b--caused', { id: 'a--b--caused', from: 'a', to: 'b', type: 'caused', confidence: 'consensus', status: 'active' }],
    ['c--d--enabled', { id: 'c--d--enabled', from: 'c', to: 'd', type: 'enabled', confidence: 'probable', status: 'retracted' }],
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
  const narratives = new Map([
    ['how-it-ended', {
      id: 'how-it-ended', title: 'How it ended', status: 'active',
      steps: [{ ref: 'c' }, { ref: 'a--b--caused' }],
    }],
  ]);
  return {
    activeEvents: events,
    events: new Map(events.map((e) => [e.id, e])),
    edges,
    sources,
    narratives,
    relations: new Map(),
    actors: new Map([['salazar', { id: 'salazar', name: 'Salazar' }], ['pide', { id: 'pide', name: 'PIDE' }]]),
    places: new Map([['lisbon', { id: 'lisbon', name: 'Lisbon' }], ['porto', { id: 'porto', name: 'Porto' }]]),
    regions: [{ id: 'europe', label: 'Europe' }, { id: 'africa', label: 'Africa' }],
    // No `resolve` by default: only the implicit one-focus lens asks for one,
    // and `withResolve` below is the topology that answers it.
    resolve: () => null,
  };
}

// A topology whose `resolve` answers for actors and places, which is what the
// implicit one-focus lens asks.
function withResolve(t) {
  t.resolve = (id) => {
    if (t.actors.has(id)) return { id, kind: 'actor', record: t.actors.get(id) };
    if (t.places.has(id)) return { id, kind: 'place', record: t.places.get(id) };
    if (t.events.has(id)) return { id, kind: 'event', record: t.events.get(id) };
    return null;
  };
  return t;
}

const sorted = (set) => [...set].sort();

test('no focus is not the same as an empty lens', () => {
  const t = topology();
  assert.equal(eventsOfFocus(null, t), null);
  assert.equal(eventsOfFocus('', t), null);
  assert.equal(eventsOfFocus('actor:', t), null);
  assert.equal(eventsOfFocus('edge:a--b--caused', t), null, 'an edge has no lens');
  assert.equal(eventsOfFocus('actor:NOT A SLUG', t), null);
  const empty = eventsOfFocus('actor:nobody', t);
  assert.ok(empty instanceof Set);
  assert.equal(empty.size, 0, 'a focus that matches nothing draws nothing');
  assert.equal(lensView(t, { focus: null }), null, 'no lens at all');
  assert.equal(lensSet(t, { focus: null }), null);
  assert.equal(lensNear(t, { focus: null }).size, 0);
});

test('parseFocus reads the six kinds and refuses everything else', () => {
  assert.deepEqual(parseFocus('actor:salazar'), { kind: 'actor', id: 'salazar' });
  assert.deepEqual(parseFocus('place:santa-comba-dao'), { kind: 'place', id: 'santa-comba-dao' });
  assert.deepEqual(parseFocus('source:russell-2000-henry'), { kind: 'source', id: 'russell-2000-henry' });
  assert.deepEqual(parseFocus('event:carnation-revolution-1974'), { kind: 'event', id: 'carnation-revolution-1974' });
  assert.deepEqual(parseFocus('region:africa'), { kind: 'region', id: 'africa' });
  assert.deepEqual(parseFocus('narrative:how-it-ended'), { kind: 'narrative', id: 'how-it-ended' });
  for (const bad of ['actor', 'actor:', ':x', 'edge:a--b--caused', 'actor:Salazar', 'actor:x y', 42, null]) {
    assert.equal(parseFocus(bad), null, String(bad));
  }
});

test('the parameter is a list, and one bad entry does not take the rest away', () => {
  assert.deepEqual(parseFoci('actor:salazar,place:lisbon'), [
    { kind: 'actor', id: 'salazar' }, { kind: 'place', id: 'lisbon' },
  ]);
  // The reader's own order, duplicates dropped: adding a focus twice adds it
  // once.
  assert.deepEqual(formatFoci(parseFoci('place:lisbon,actor:salazar,place:lisbon')), 'place:lisbon,actor:salazar');
  assert.deepEqual(formatFoci(parseFoci('actor:salazar,rubbish,place:lisbon')), 'actor:salazar,place:lisbon');
  assert.deepEqual(parseFoci(FOCUS_NONE), [], 'the reader turned the lens off');
  assert.deepEqual(parseFoci(''), []);
  assert.deepEqual(parseFoci(null), []);
});

test('an actor lens keeps the events that name it, once each', () => {
  assert.deepEqual(sorted(eventsOfFocus('actor:salazar', topology())), ['a', 'b']);
  // An actor named twice in one event under two roles is still one event.
  const t = topology();
  t.activeEvents[0].actors = [{ actor: 'salazar', role: 'leader' }, { actor: 'salazar', role: 'signatory' }];
  assert.deepEqual(sorted(eventsOfFocus('actor:salazar', t)), ['a', 'b']);
});

test('a place lens is the events that happened there', () => {
  assert.deepEqual(sorted(eventsOfFocus('place:lisbon', topology())), ['a', 'c']);
  assert.deepEqual(sorted(eventsOfFocus('place:porto', topology())), ['b']);
});

test('a region lens is the events the timeline would draw in that lane', () => {
  assert.deepEqual(sorted(eventsOfFocus('region:europe', topology())), ['a', 'b', 'c']);
  assert.deepEqual(sorted(eventsOfFocus('region:africa', topology())), ['d']);
  assert.equal(eventsOfFocus('region:atlantis', topology()).size, 0);
});

test('an event lens is that event, and the neighbourhood is the ring around it', () => {
  const t = topology();
  assert.deepEqual(sorted(eventsOfFocus('event:a', t)), ['a']);
  // A tombstone is not an event a lens keeps.
  t.events.get('a').status = 'merged';
  assert.equal(eventsOfFocus('event:a', t).size, 0);
  assert.equal(eventsOfFocus('event:nothing', topology()).size, 0);
});

// M30b-2, A6: `event:` narrows to the subtree. A leaf is still one event —
// which is every event in `data/` today — and a parent is itself and
// everything inside it, however deep.
test('an event lens on a parent is the whole subtree, and stops on a cycle', () => {
  const t = topology();
  t.childrenOf = new Map([['a', ['b', 'c']], ['c', ['d']]]);
  assert.deepEqual(sorted(eventsOfFocus('event:a', t)), ['a', 'b', 'c', 'd']);
  // From inside the tree: the parts of that part, and never back up.
  assert.deepEqual(sorted(eventsOfFocus('event:c', t)), ['c', 'd']);
  assert.deepEqual(sorted(eventsOfFocus('event:b', t)), ['b'], 'a leaf is one event');

  // A tombstone among the parts is not an event a lens keeps.
  t.events.get('b').status = 'merged';
  assert.deepEqual(sorted(eventsOfFocus('event:a', t)), ['a', 'c', 'd']);

  // Rule 24 refuses a cycle; a lens draws whatever is in the file, and a
  // visited set is what makes bad data narrow the atlas rather than hang it.
  const ring = topology();
  ring.childrenOf = new Map([['a', ['c']], ['c', ['a']]]);
  assert.deepEqual(sorted(eventsOfFocus('event:a', ring)), ['a', 'c']);
});

test('the subtree lens reads `parent` and never the adjacency', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  // fixture-event-f holds fixture-event-t and fixture-event-h.
  assert.deepEqual(
    sorted(eventsOfFocus('event:fixture-event-f', atlas)),
    ['fixture-event-f', 'fixture-event-h', 'fixture-event-t'],
  );
  // What the focus set keeps is the subtree; the ring around it is the atlas's
  // own edges, exactly as it is for every other focus — being part of
  // something is not a link (CLAUDE.md).
  const view = lensView(atlas, { ...defaultState(), focus: 'event:fixture-event-f' });
  assert.deepEqual(sorted(view.set), ['fixture-event-f', 'fixture-event-h', 'fixture-event-t']);
  for (const id of view.near) assert.ok(!view.set.has(id));
  assert.ok(view.near.has('fixture-event-d'), 'd → t is an edge into the subtree');
});

test('a narrative lens is the walk, and only the events still active', () => {
  const t = topology();
  // Step `c` is an event; step `a--b--caused` is a link, which walks both ends.
  assert.deepEqual(sorted(eventsOfFocus('narrative:how-it-ended', t)), ['a', 'b', 'c']);
  t.narratives.get('how-it-ended').status = 'retracted';
  assert.equal(eventsOfFocus('narrative:how-it-ended', t).size, 0);
  assert.equal(eventsOfFocus('narrative:nothing', topology()).size, 0);
});

test('a source lens is what cites it, and both ends of an edge that does', () => {
  // 'c' cites it itself; the edge a→b cites it, so both a and b are in.
  assert.deepEqual(sorted(eventsOfFocus('source:book', topology())), ['a', 'b', 'c']);
  // The one-focus form is still there for a caller holding one string.
  assert.deepEqual(sorted(lensFor('source:book', topology())), ['a', 'b', 'c']);
});

test('a source lens ignores citations that are not events or edges', () => {
  const t = topology();
  t.sources.get('book').citations = [{ kind: 'actor', id: 'salazar' }, { kind: 'place', id: 'lisbon' }];
  assert.equal(eventsOfFocus('source:book', t).size, 0);
});

test('a source lens never revives a tombstone', () => {
  const t = topology();
  // The one citing edge is retracted, so it drags neither of its ends in.
  assert.equal(eventsOfFocus('source:dead', t).size, 0);
  // Nor does a citation naming an event that is not among the active ones.
  t.sources.get('book').citations = [{ kind: 'event', id: 'gone' }];
  assert.equal(eventsOfFocus('source:book', t).size, 0);
});

// ─── any number of foci ────────────────────────────────────────────────────

test('the focus set is the union of the foci, and their intersection on request', () => {
  const t = topology();
  const foci = parseFoci('actor:salazar,place:lisbon');
  assert.deepEqual(sorted(focusSet(foci, t)), ['a', 'b', 'c'], 'any of these');
  assert.deepEqual(sorted(focusSet(foci, t, { all: true })), ['a'], 'all of these');
  // The intersection of one focus is that focus.
  assert.deepEqual(sorted(focusSet(parseFoci('place:porto'), t, { all: true })), ['b']);
  // Two foci that share nothing intersect to nothing, which is a lens that
  // draws nothing and says so — not a lens that is off.
  assert.equal(focusSet(parseFoci('place:porto,region:africa'), t, { all: true }).size, 0);
  assert.equal(focusSet([], t).size, 0);
});

test('the ring is one hop out, in both directions, and never the set itself', () => {
  const t = topology();
  assert.deepEqual(sorted(ringOf(t, new Set(['a']))), ['b'], 'a consequence');
  assert.deepEqual(sorted(ringOf(t, new Set(['b']))), ['a'], 'and a cause');
  assert.deepEqual(sorted(ringOf(t, new Set(['a', 'b']))), [], 'both ends in the set is no ring');
  // The retracted edge c→d is not a hop.
  assert.deepEqual(sorted(ringOf(t, new Set(['c']))), []);
  assert.equal(ringOf(t, new Set()).size, 0);
});

test('a view draws the focus set and its ring, and nothing else', () => {
  const t = topology();
  const view = lensView(t, { focus: 'place:porto' });
  assert.deepEqual(sorted(view.set), ['b']);
  assert.deepEqual(sorted(view.near), ['a'], 'what led to it, drawn faintly');
  assert.deepEqual(sorted(view.shown), ['a', 'b']);
  assert.deepEqual(sorted(lensSet(t, { focus: 'place:porto' })), ['a', 'b']);
  assert.deepEqual(sorted(lensNear(t, { focus: 'place:porto' })), ['a']);
  // `d` is in neither, so it is drawn nowhere.
  assert.equal(view.shown.has('d'), false);
});

test('the answer is computed once per state, and again when the citers land', () => {
  const t = topology();
  const state = { focus: 'source:book' };
  let rows = null;
  t.citersOf = () => rows;
  const first = lensView(t, state);
  assert.equal(lensView(t, state), first, 'one answer per state');
  // The citer file lands; nothing in the state changed, and the answer must.
  rows = [{ kind: 'event', id: 'd' }];
  const second = lensView(t, state);
  assert.notEqual(second, first);
  assert.deepEqual(sorted(second.set), ['d']);
});

test('reading a narrative suspends the lens', () => {
  const t = topology();
  // Salazar's two events are a and b, and the one live edge runs between
  // them, so the ring is empty and the lens draws exactly the two.
  assert.equal(lensSet(t, { focus: 'actor:salazar', narrative: null }).size, 2);
  assert.equal(lensSet(t, { focus: 'actor:salazar', narrative: 'how-it-ended' }), null);
});

test('shownEvents keeps the atlas order and the whole list without a lens', () => {
  const t = topology();
  assert.deepEqual(shownEvents(t, { focus: null }).map((e) => e.id), ['a', 'b', 'c', 'd']);
  // pide is in b and c; b's ring adds a, and c has no live edge.
  assert.deepEqual(shownEvents(t, { focus: 'actor:pide' }).map((e) => e.id), ['a', 'b', 'c']);
});

// ─── the lens an open card is ──────────────────────────────────────────────

test('an open actor or place with no lens is a lens of one, until the reader says no', () => {
  const t = withResolve(topology());
  assert.deepEqual(activeFoci(t, { actor: 'salazar' }), [{ kind: 'actor', id: 'salazar' }]);
  assert.deepEqual(sorted(lensView(t, { actor: 'salazar' }).set), ['a', 'b']);
  // A place before an actor, which is the precedence the panel shows cards in.
  assert.deepEqual(activeFoci(t, { actor: 'salazar', place: 'porto' }), [{ kind: 'place', id: 'porto' }]);
  // An explicit lens wins over both.
  assert.deepEqual(activeFoci(t, { actor: 'salazar', focus: 'region:africa' }), [{ kind: 'region', id: 'africa' }]);
  // And `none` is the reader saying no to it while keeping the card open.
  assert.deepEqual(activeFoci(t, { actor: 'salazar', focus: FOCUS_NONE }), []);
  assert.equal(lensView(t, { actor: 'salazar', focus: FOCUS_NONE }), null);
  // A selected event does not take it away: the reader walking from a place's
  // list is still inside that place's neighbourhood.
  assert.deepEqual(activeFoci(t, { place: 'lisbon', selected: 'a' }), [{ kind: 'place', id: 'lisbon' }]);
  // An id that names nothing, or names something that is not an actor.
  assert.deepEqual(activeFoci(t, { actor: 'nobody' }), []);
  assert.deepEqual(activeFoci(t, { place: 'salazar' }), []);
});

// ─── writing the parameter ─────────────────────────────────────────────────

test('the four things a control does to the list', () => {
  assert.equal(withFocus('actor:salazar', 'place', 'lisbon'), 'actor:salazar,place:lisbon');
  assert.equal(withFocus(null, 'place', 'lisbon'), 'place:lisbon');
  assert.equal(withFocus(FOCUS_NONE, 'place', 'lisbon'), 'place:lisbon', 'adding to `none` starts a list');
  assert.equal(withFocus('place:lisbon', 'place', 'lisbon'), 'place:lisbon', 'twice is once');
  assert.equal(onlyFocus('place', 'lisbon'), 'place:lisbon');
  assert.equal(withoutFocus('actor:salazar,place:lisbon', 'actor', 'salazar'), 'place:lisbon');
  // The last chip removed leaves `none`: an empty parameter would put the
  // implicit lens back on the card the reader still has open.
  assert.equal(withoutFocus('place:lisbon', 'place', 'lisbon'), FOCUS_NONE);
  assert.equal(withoutFocus('place:lisbon', 'actor', 'nobody'), 'place:lisbon');
});

test('a focus is labelled by the record it names, or by its id', () => {
  const t = topology();
  assert.deepEqual(lensLabel(t, 'actor:salazar'), { kind: 'actor', id: 'salazar', focus: 'actor:salazar', name: 'Salazar' });
  assert.deepEqual(lensLabel(t, 'place:lisbon'), { kind: 'place', id: 'lisbon', focus: 'place:lisbon', name: 'Lisbon' });
  assert.deepEqual(lensLabel(t, 'source:book'), { kind: 'source', id: 'book', focus: 'source:book', name: 'A Book' });
  assert.deepEqual(lensLabel(t, 'event:a'), { kind: 'event', id: 'a', focus: 'event:a', name: 'a' });
  assert.deepEqual(lensLabel(t, 'region:africa'), { kind: 'region', id: 'africa', focus: 'region:africa', name: 'Africa' });
  assert.deepEqual(lensLabel(t, 'narrative:how-it-ended'), {
    kind: 'narrative', id: 'how-it-ended', focus: 'narrative:how-it-ended', name: 'How it ended',
  });
  assert.deepEqual(lensLabel(t, 'actor:gone'), { kind: 'actor', id: 'gone', focus: 'actor:gone', name: 'gone' });
  assert.equal(lensLabel(t, 'rubbish'), null);
  // One chip per focus, in the reader's own order.
  assert.deepEqual(
    lensLabels(t, { focus: 'place:lisbon,actor:salazar' }).map((l) => l.focus),
    ['place:lisbon', 'actor:salazar'],
  );
  assert.deepEqual(lensLabels(t, { focus: null }), []);
});

// R8, the two halves of the correction of 6 September. The lens nobody asked
// for may not empty the atlas, and it may not take away what the reader has
// just clicked.

test('an actor or a place with no events is not an implicit lens', () => {
  const t = withResolve(topology());
  t.actors.set('unknown-party', { id: 'unknown-party', name: 'A party with no events' });
  t.places.set('nowhere', { id: 'nowhere', name: 'Nowhere' });
  // 350 of the atlas's 412 actors are polities imported with their borders
  // and no event yet: a lens on one drew a blank map and a blank timeline.
  assert.deepEqual(activeFoci(t, { actor: 'unknown-party' }), []);
  assert.equal(lensView(t, { actor: 'unknown-party' }), null, 'the atlas stays whole');
  assert.deepEqual(activeFoci(t, { place: 'nowhere' }), []);
  assert.equal(lensView(t, { place: 'nowhere' }), null);
  // A place with no events does not hand the lens to the actor behind it
  // either: the reader has a place open, and nothing is narrowed.
  assert.deepEqual(activeFoci(t, { place: 'nowhere', actor: 'salazar' }), []);
  // A focus the reader typed is a question, and its answer may be empty.
  const asked = lensView(t, { focus: 'actor:unknown-party' });
  assert.ok(asked, 'an explicit focus is still a lens');
  assert.equal(asked.set.size, 0, 'and it draws nothing, which is the answer');
  assert.equal(asked.implicit, false);
});

test('an implicit lens keeps the selection, the walked chain and the consequences', () => {
  const t = withResolve(topology());
  // `pide` is at b and c; a is outside its lens and outside the ring of it
  // only if nothing joins them — a--b--caused puts a in the ring, so the
  // event held out here is d, which the retracted edge does not reach.
  const state = { actor: 'pide', selected: 'd', chain: ['a--b--caused'] };
  const view = lensView(t, state);
  assert.equal(view.implicit, true);
  assert.ok(!view.set.has('d') && !view.near.has('d'), 'the open event is outside the focus and its ring');
  assert.ok(view.shown.has('d'), 'and is drawn all the same');
  assert.ok(view.shown.has('a') && view.shown.has('b'), 'and so are both ends of every walked step');
  // An explicit lens is a question the reader asked, and keeps its own narrow
  // answer: `?focus=` is how they say "only this".
  const asked = lensView(t, { ...state, focus: 'actor:pide' });
  assert.equal(asked.implicit, false);
  assert.ok(!asked.shown.has('d'), 'an explicit lens still removes it');
});

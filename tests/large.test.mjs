// Which events are large, and which parents get a bracket (m30b-brief, A8 and
// A9). Both are pure functions over the atlas, so both are decided here and
// the views only draw the answer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { largeEvent, largeEventsIn, bracketsIn } from '../src/large.js';
import { lanesFor } from '../src/lanes.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

const event = (id, { region = 'europe', scope = undefined, parent = null, year = 1900 } = {}) => ({
  id, title: id, status: 'active', region, parent, weight: 1, place: null,
  when: { start: year, end: year },
  ...(scope === undefined ? {} : { scope }),
});

// An atlas reduced to what these two functions ask of it: the events by id and
// the parts of each.
function atlasOfEvents(events) {
  const childrenOf = new Map();
  for (const e of events) {
    if (!e.parent) continue;
    if (!childrenOf.has(e.parent)) childrenOf.set(e.parent, []);
    childrenOf.get(e.parent).push(e.id);
  }
  return { events: new Map(events.map((e) => [e.id, e])), childrenOf, activeEvents: events };
}

test('an event is large when it says so, or when its parts cross region lanes', () => {
  const spread = [
    event('war'), event('one', { parent: 'war', region: 'europe' }), event('two', { parent: 'war', region: 'africa' }),
  ];
  const atlas = atlasOfEvents(spread);
  assert.deepEqual(largeEvent(atlas, atlas.events.get('war')), { scope: 'regional', reason: 'parts', region: 'europe' });
  assert.equal(largeEvent(atlas, atlas.events.get('one')), null, 'a part is not large for being one');

  // The same three events with both parts in one lane: nothing is large.
  const together = atlasOfEvents([
    event('war'), event('one', { parent: 'war' }), event('two', { parent: 'war' }),
  ]);
  assert.equal(largeEvent(together, together.events.get('war')), null);

  // A part with no region at all is in no lane, so it cannot make its parent
  // span two (M30a, A15).
  const lopsided = atlasOfEvents([
    event('war'), event('one', { parent: 'war' }), event('two', { parent: 'war', region: null }),
  ]);
  assert.equal(largeEvent(lopsided, lopsided.events.get('war')), null);
});

test('`scope` is a written field and says which of the two the views draw', () => {
  const atlas = atlasOfEvents([
    event('flu', { scope: 'worldwide' }), event('treaty', { scope: 'regional' }), event('plain'),
  ]);
  assert.deepEqual(largeEvent(atlas, atlas.events.get('flu')), { scope: 'worldwide', reason: 'scope', region: 'europe' });
  assert.deepEqual(largeEvent(atlas, atlas.events.get('treaty')), { scope: 'regional', reason: 'scope', region: 'europe' });
  assert.equal(largeEvent(atlas, atlas.events.get('plain')), null);
  // A tombstone is not drawn at all, large or otherwise.
  atlas.events.get('flu').status = 'merged';
  assert.equal(largeEvent(atlas, atlas.events.get('flu')), null);
});

test('largeEventsIn answers about what a view is drawing, in that order', () => {
  const atlas = atlasOfEvents([event('a'), event('flu', { scope: 'worldwide' }), event('b')]);
  const shown = [...atlas.events.values()];
  assert.deepEqual(largeEventsIn(shown, atlas).map((l) => l.event.id), ['flu']);
  // What the lens or the viewport has already taken away is not a band over a
  // picture it is not in.
  assert.deepEqual(largeEventsIn(shown.filter((e) => e.id !== 'flu'), atlas), []);
});

// --- the bracket ----------------------------------------------------------

const REGIONS = [
  { id: 'europe', label: 'Europe', order: 1 },
  { id: 'africa', label: 'Africa', order: 2 },
];
const laneList = (events) => lanesFor('region', { activeEvents: events, regions: REGIONS });

test('a parent whose parts share a lane gets a bracket over them', () => {
  const events = [event('war'), event('one', { parent: 'war', year: 1901 }), event('two', { parent: 'war', year: 1902 })];
  const atlas = atlasOfEvents(events);
  const brackets = bracketsIn(events, laneList(events), atlas);
  assert.equal(brackets.length, 1);
  assert.equal(brackets[0].event.id, 'war');
  assert.equal(brackets[0].lane.id, 'europe');
  assert.deepEqual(brackets[0].parts.map((p) => p.id), ['one', 'two']);
});

test('a parent that is large gets the band and never a bracket as well', () => {
  const crossing = [event('war'), event('one', { parent: 'war' }), event('two', { parent: 'war', region: 'africa' })];
  assert.deepEqual(bracketsIn(crossing, laneList(crossing), atlasOfEvents(crossing)), []);

  // And one that is large only because a person wrote `scope`: its parts are
  // in one lane, and it still gets the band rather than two marks saying one
  // thing.
  const written = [event('war', { scope: 'regional' }), event('one', { parent: 'war' }), event('two', { parent: 'war' })];
  assert.deepEqual(bracketsIn(written, laneList(written), atlasOfEvents(written)), []);
});

test('no lanes, no bracket, and no bracket over a part the view is not drawing', () => {
  const events = [event('war'), event('one', { parent: 'war' }), event('two', { parent: 'war' })];
  const atlas = atlasOfEvents(events);
  // With no grouping the rows are packed and there is no vertical room.
  assert.deepEqual(bracketsIn(events, [], atlas), []);
  // A parent whose parts are all outside the picture brackets nothing.
  const alone = events.filter((e) => e.id === 'war');
  assert.deepEqual(bracketsIn(alone, laneList(events), atlas), []);
  // One part drawn is one part to span.
  const half = events.filter((e) => e.id !== 'two');
  assert.deepEqual(bracketsIn(half, laneList(events), atlas).map((b) => b.parts.length), [1]);
});

test('on the fixtures the one parent there is is large, and gets no bracket', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const parent = atlas.events.get('fixture-event-f');
  // Written `scope: regional`, and its two parts are in two lanes: large twice
  // over, which is the case the band exists for.
  assert.deepEqual(largeEvent(atlas, parent), { scope: 'regional', reason: 'scope', region: 'fixture-lane-3' });
  const lanes = lanesFor('region', atlas, null, null, []);
  assert.deepEqual(bracketsIn(atlas.activeEvents, lanes, atlas), []);
});

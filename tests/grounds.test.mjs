// The ground under an event: which polities held the place it happened in, on
// the date it happened (M48 §2, src/grounds.js).
//
// The join itself is held to literals — two squares on a map, four events —
// because what it has to get right is a rule and not a fact about this corpus:
// a point inside a territory, a point inside a *dependency's* territory, a
// point outside, and a place with no coordinates at all. The corpus is then
// asked whether the rule reached it: an event in Lisbon that names nobody is
// Portugal's, and an actor with no ground and no events is still not a lens.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildGrounds, byActor, decodeGrounds, encodeGrounds } from '../src/grounds.js';
import { eventsOfFocus } from '../src/lens.js';
import { atlasOf, ROOT } from './helpers.mjs';

const square = (x0, y0, x1, y1) => ({
  type: 'Polygon',
  coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
});

// Two polities: one holding the west from 1400 with no end, one holding the
// east as its dependency between 1500 and 1550.
const PRESENCES = [
  {
    id: 'west-1400',
    status: 'active',
    actor: 'west',
    dependencyOf: null,
    when: { start: 1400, end: null },
    geometry: { files: ['geo/presences/a.json'], key: 'west' },
  },
  {
    id: 'east-1500',
    status: 'active',
    actor: 'east',
    dependencyOf: 'west',
    when: { start: 1500, end: 1550 },
    geometry: { files: ['geo/presences/a.json'], key: 'east' },
  },
  {
    id: 'gone-1500',
    status: 'retracted',
    actor: 'nobody',
    dependencyOf: null,
    when: { start: 1500, end: null },
    geometry: { files: ['geo/presences/a.json'], key: 'nobody' },
  },
];

const OUTLINES = new Map([
  ['west', square(0, 0, 10, 10)],
  ['east', square(20, 0, 30, 10)],
  ['nobody', square(0, 0, 30, 10)],
]);

const PLACES = new Map([
  ['inside', { id: 'inside', where: { lon: 5, lat: 5 } }],
  ['dependency', { id: 'dependency', where: { lon: 25, lat: 5 } }],
  ['outside', { id: 'outside', where: { lon: 100, lat: 5 } }],
  ['unplaced', { id: 'unplaced', where: null }],
]);

const event = (id, place, year, extra = {}) => ({
  id, status: 'active', place, when: { start: year, end: year }, actors: [], ...extra,
});

const EVENTS = [
  event('in-the-west', 'inside', 1520),
  event('in-the-dependency', 'dependency', 1520),
  event('far-away', 'outside', 1520),
  event('nowhere', 'unplaced', 1520),
  // The same ground, before either polity was there.
  event('too-early', 'inside', 1300),
  // And after the dependency gave it up.
  event('too-late', 'dependency', 1600),
  event('withdrawn', 'inside', 1520, { status: 'retracted' }),
];

const grounds = () => buildGrounds(EVENTS, PLACES, PRESENCES,
  (presence) => OUTLINES.get(presence.geometry.key) ?? null);

test('an event inside a polity’s dated territory is on its ground', () => {
  assert.deepEqual(grounds().get('in-the-west'), ['west']);
});

test('a dependency’s ground is its sovereign’s too', () => {
  // The whole of what makes Angola under Portugal reachable by selecting
  // Portugal without anybody listing colonies by hand.
  assert.deepEqual(grounds().get('in-the-dependency'), ['east', 'west']);
});

test('an event outside every territory has no ground, and neither has one with no point', () => {
  const found = grounds();
  assert.equal(found.has('far-away'), false);
  assert.equal(found.has('nowhere'), false, 'a place with no coordinates is not an error');
});

test('the date is the event’s own, and a territory it was not held in does not count', () => {
  const found = grounds();
  assert.equal(found.has('too-early'), false, 'before the polity was there');
  assert.equal(found.has('too-late'), false, 'after the dependency gave it up');
});

test('a retracted event and a retracted presence are both left out', () => {
  const found = grounds();
  assert.equal(found.has('withdrawn'), false);
  for (const actors of found.values()) assert.ok(!actors.includes('nobody'), 'a withdrawn presence holds nothing');
});

test('the file is an id table, and reading it back gives what was written', () => {
  const found = grounds();
  const file = encodeGrounds(found);
  assert.deepEqual(file.actors, [...file.actors].sort(), 'sorted, so two builds write one file');
  assert.deepEqual(Object.keys(file.events), [...Object.keys(file.events)].sort());
  assert.deepEqual([...decodeGrounds(file)].sort(), [...found].sort());
  // A file from a build that knew nothing about grounds is empty, not an error.
  assert.equal(decodeGrounds(null).size, 0);
  assert.equal(decodeGrounds({ schema: 1 }).size, 0);
});

test('the other direction is the one the lens asks', () => {
  const inverted = byActor(grounds());
  assert.deepEqual([...inverted.get('west')].sort(), ['in-the-dependency', 'in-the-west']);
  assert.deepEqual([...inverted.get('east')], ['in-the-dependency']);
});

// And the rule, reaching the corpus. Not a count: the number of events on
// Portuguese ground is a fact about this dataset's territory and the next
// import moves it (M48, test 6).
test('an actor’s lens is what names it and what is on its ground', async () => {
  const atlas = await atlasOf(path.join(ROOT, 'data'));
  const lens = eventsOfFocus('actor:portugal', atlas);
  const named = new Set((atlas.eventsByActor.get('portugal') ?? []).map((a) => a.event.id));
  for (const id of named) assert.ok(lens.has(id), `${id} names Portugal and is not in its lens`);

  const onGround = [...lens].filter((id) => atlas.groundOf(id).includes('portugal'));
  assert.ok(onGround.length > 0, 'the atlas has events on Portuguese ground');
  const unnamed = onGround.filter((id) => !named.has(id));
  assert.ok(unnamed.length > 0, 'and some of them do not name Portugal at all');
  // Which is the owner's own case: an event in Lisbon that the lens missed.
  assert.ok(unnamed.some((id) => atlas.events.get(id)?.place === 'lisbon'),
    'selecting Portugal finds the events in Lisbon');

  // Every event the lens keeps is there for one of the two reasons and not
  // for some third one.
  for (const id of lens) {
    assert.ok(named.has(id) || atlas.groundOf(id).includes('portugal'),
      `${id} is in Portugal's lens for neither reason`);
  }
});

test('an atlas whose grounds have not landed is the lens as it was', async () => {
  const atlas = await atlasOf(path.join(ROOT, 'data'), { grounds: null });
  assert.equal(atlas.groundsLoaded(), false, 'nothing has asked for the file');
  const lens = eventsOfFocus('actor:portugal', atlas);
  const named = new Set((atlas.eventsByActor.get('portugal') ?? []).map((a) => a.event.id));
  assert.deepEqual([...lens].sort(), [...named].sort(),
    'a frame of the old picture, never a wrong one');
});

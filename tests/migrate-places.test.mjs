// The one-time migration from `where` on an event to a `place` record it
// points at. Everything here is synthetic; the tool itself is kept in the
// repository so a contributor can see how the real data was moved.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planPlaces, placeIdFor, placeRecord, migrateEvent } from '../tools/migrate-places.mjs';
import { createValidator } from '../src/validate/schema.js';
import { schemas } from './helpers.mjs';

const AUTHORS = [{ name: 'Fixture Author', github: 'fixture-author' }];

function event(id, where, over = {}) {
  return {
    schema: 1,
    id,
    kind: 'event',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: AUTHORS,
    license: 'CC-BY-SA-4.0',
    created: '2026-01-01',
    revised: null,
    sources: [{ source: 'fixture-source-1', locator: null }],
    title: `Fixture ${id}`,
    summary: 'A synthetic event, written for a test.',
    when: { start: 1300, end: 1300 },
    where,
    region: null,
    actors: [],
    ...over,
  };
}

const LISBON = { lon: -9.14, lat: 38.72, precision: 'city', label: 'Fixture city' };
const OTHER = { lon: 1, lat: 2, precision: 'region', label: 'Fixture region, near somewhere' };

test('an id is the slug of the label\'s first comma-separated segment', () => {
  assert.equal(placeIdFor('Lajes, Terceira'), 'lajes');
  assert.equal(placeIdFor('Flanders, near Laventie'), 'flanders');
  assert.equal(placeIdFor('Parque das Nações, Lisbon'), 'parque-das-nacoes');
  assert.equal(placeIdFor('Lisbon'), 'lisbon');
  assert.equal(placeIdFor(''), '');
});

test('events on the same point become one place, and each points at it', () => {
  const events = [
    event('fixture-event-one', { ...LISBON }),
    event('fixture-event-two', { ...LISBON }),
    event('fixture-event-three', { ...OTHER }),
    event('fixture-event-four', null),
  ];
  const { places, assignment, collisions, skipped } = planPlaces(events);
  assert.deepEqual(places.map((p) => p.id), ['fixture-city', 'fixture-region']);
  assert.deepEqual(places[0].events, ['fixture-event-one', 'fixture-event-two']);
  assert.deepEqual(assignment.get('fixture-event-one'), 'fixture-city');
  assert.deepEqual(assignment.get('fixture-event-two'), 'fixture-city');
  assert.deepEqual(assignment.get('fixture-event-three'), 'fixture-region');
  // A process with no honest point keeps its lane and points at no place.
  assert.equal(assignment.get('fixture-event-four'), null);
  assert.deepEqual(collisions, []);
  assert.deepEqual(skipped, []);

  // A point that differs at all is a different place: the migration groups,
  // it never decides that two coordinates mean the same town.
  const apart = planPlaces([event('fixture-event-one', { ...LISBON }), event('fixture-event-two', { ...LISBON, lat: 38.73 })]);
  assert.equal(apart.places.length, 2);
});

test('a place carries the whole label as its name and the authors it came from', async () => {
  const { places } = planPlaces([event('fixture-event-one', { ...OTHER })]);
  const record = placeRecord(places[0], { today: '2026-09-03' });
  assert.equal(record.id, 'fixture-region');
  assert.deepEqual(record.names, ['Fixture region, near somewhere'], 'the id is lossy; the label is not lost');
  assert.deepEqual(record.where, OTHER);
  assert.deepEqual(record.authors, AUTHORS, 'a place drafted out of drafted events carries the same marker');
  assert.deepEqual(record.sources, []);
  assert.equal(record.created, '2026-09-03');
  assert.deepEqual(createValidator(await schemas()).validate('v1/place.json', record), []);
});

test('an id already taken is numbered rather than overwritten', () => {
  const { places, collisions } = planPlaces(
    [event('fixture-event-one', { ...LISBON })],
    { existing: new Set(['fixture-city']) },
  );
  assert.equal(places[0].id, 'fixture-city-2');
  assert.deepEqual(collisions, [{ base: 'fixture-city', label: 'Fixture city' }]);

  // Two different labels that slug the same way inside one run.
  const both = planPlaces([
    event('fixture-event-one', { ...LISBON, label: 'Fixture city' }),
    event('fixture-event-two', { ...LISBON, lat: 10, label: 'Fixture city, upriver' }),
  ]);
  assert.deepEqual(both.places.map((p) => p.id), ['fixture-city', 'fixture-city-2']);
});

test('the migration is idempotent: an event that already has a place is left alone', () => {
  const migrated = migrateEvent(event('fixture-event-one', { ...LISBON }), 'fixture-city');
  assert.equal(Object.hasOwn(migrated, 'where'), false);
  assert.equal(migrated.place, 'fixture-city');
  // `place` sits exactly where `where` was, so the file still reads in the
  // order every other record does.
  assert.deepEqual(Object.keys(migrated), Object.keys(event('x', null)).map((k) => (k === 'where' ? 'place' : k)));

  const again = planPlaces([migrated, event('fixture-event-two', { ...OTHER })]);
  assert.deepEqual(again.skipped, ['fixture-event-one']);
  assert.deepEqual(again.places.map((p) => p.id), ['fixture-region']);
  assert.equal(again.assignment.has('fixture-event-one'), false, 'a migrated event is not rewritten twice');
});

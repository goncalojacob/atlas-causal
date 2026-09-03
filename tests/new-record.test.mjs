import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaffold, scaffoldAll } from '../tools/new-record.mjs';
import { createValidator } from '../src/validate/schema.js';
import { schemas } from './helpers.mjs';

const opts = { author: 'Fixture Author', github: 'fixture-author', source: ['fixture-source-1'] };

test('scaffolded records have the envelope and pass their schema; the text is left empty for a person', async () => {
  const v = createValidator(await schemas());
  const event = scaffold('event', ['fixture-scaffold'], { ...opts, title: 'Fixture', start: '1300', place: 'fixture-place-one' });
  assert.equal(event.kind, 'event');
  assert.equal(event.place, 'fixture-place-one');
  assert.equal(event.summary, '');
  assert.deepEqual(event.when, { start: 1300, end: 1300 });
  assert.deepEqual(event.authors, [{ name: 'Fixture Author', github: 'fixture-author' }]);
  assert.match(event.created, /^\d{4}-\d{2}-\d{2}$/);
  // Only summary (minLength 1) fails the schema: the person fills it in.
  assert.deepEqual(v.validate('v1/event.json', event).map((e) => e.path), ['/summary']);

  const edge = scaffold('edge', ['fixture-event-a', 'fixture-event-b', 'caused'], { ...opts, confidence: 'disputed' });
  assert.equal(edge.id, 'fixture-event-a--fixture-event-b--caused');
  assert.deepEqual(edge.dispute, { text: '', sources: [] });
  assert.equal(edge.explanation, '');

  const source = scaffold('source', ['fixture-scaffold-source'], { ...opts, type: 'article', title: 'Fixture', creators: 'A One; B Two', doi: '10.0000/x' });
  assert.deepEqual(source.creators, ['A One', 'B Two']);
  assert.deepEqual(v.validate('v1/source.json', source), []);

  const actor = scaffold('actor', ['fixture-scaffold-actor'], { ...opts, type: 'institution', names: 'Fixture Body; FB', start: '1900', end: 'null' });
  assert.deepEqual(actor.names, ['Fixture Body', 'FB']);
  assert.deepEqual(actor.when, { start: 1900, end: null });
  assert.equal(actor.where, null);
  assert.deepEqual(v.validate('v1/actor.json', actor).map((e) => e.path), ['/summary']);

  const relation = scaffold('relation', ['salazar', 'estado-novo', 'led'], { ...opts, start: '1932', end: '1968', note: 'as President of the Council' });
  assert.equal(relation.id, 'salazar--estado-novo--led');
  assert.deepEqual(relation.when, { start: 1932, end: 1968 });
  assert.equal(relation.note, 'as President of the Council');
  // A relation is complete as scaffolded: its argument is the two ids, the
  // type and the source, and there is no text a person still has to write.
  assert.deepEqual(v.validate('v1/relation.json', relation), []);
  assert.equal(scaffold('relation', ['a', 'b', 'member-of'], { ...opts, start: '1970', end: 'null' }).when.end, null);

  // A place is complete as scaffolded: it cites nothing and has no text a
  // person still has to write.
  const place = scaffold('place', ['fixture-scaffold-place'], {
    ...opts, source: [], names: 'Fixture Place; Fixtura', lon: '1', lat: '2', region: 'fixture-lane-1',
  });
  assert.deepEqual(place.names, ['Fixture Place', 'Fixtura']);
  assert.deepEqual(place.where, { lon: 1, lat: 2, precision: 'city', label: 'Fixture Place' });
  assert.equal(place.region, 'fixture-lane-1');
  assert.deepEqual(v.validate('v1/place.json', place), []);
});

test('one command writes an event and the place it happens at', () => {
  const records = scaffoldAll('event', ['fixture-scaffold-two'], {
    ...opts, title: 'Fixture', start: '1300', 'new-place': 'fixture-ceuta', label: 'Ceuta', lon: '-5.319', lat: '35.889',
  });
  // The place first: it is written before the event that points at it.
  assert.deepEqual(records.map((r) => [r.kind, r.id]), [['place', 'fixture-ceuta'], ['event', 'fixture-scaffold-two']]);
  assert.equal(records[1].place, 'fixture-ceuta');
  assert.deepEqual(records[0].names, ['Ceuta']);
  assert.equal(records[0].where.lon, -5.319);
  // Without --new-place it is one record, as every other kind is.
  assert.equal(scaffoldAll('event', ['fixture-scaffold-three'], { ...opts, start: '1300' }).length, 1);
});

test('scaffold refuses bad input', () => {
  assert.throws(() => scaffold('event', ['Bad Id'], { ...opts, start: '1' }), /slug/);
  assert.throws(() => scaffold('event', ['fixture-x'], opts), /--start/);
  assert.throws(() => scaffold('edge', ['a', 'b', 'made'], opts), /type must be one of/);
  assert.throws(() => scaffold('actor', ['x'], { ...opts, type: 'deity' }), /--type must be one of/);
  assert.throws(() => scaffold('actor', ['x'], opts), /--start/);
  assert.throws(() => scaffold('presence', ['x'], opts), /kind must be/);
  assert.throws(() => scaffold('relation', ['a', 'b', 'friend-of'], { ...opts, start: '1' }), /type must be one of/);
  assert.throws(() => scaffold('relation', ['a', 'b'], { ...opts, start: '1' }), /<from> <to> <type>/);
  assert.throws(() => scaffold('relation', ['a', 'b', 'led'], opts), /--start/);
  assert.throws(() => scaffold('place', ['x'], opts), /--lon and --lat/);
  assert.throws(() => scaffold('place', ['Bad Id'], { ...opts, lon: '1', lat: '2' }), /slug/);
  assert.throws(() => scaffold('event', ['fixture-x'], { ...opts, start: '1', place: 'Not A Slug' }), /--place/);
});

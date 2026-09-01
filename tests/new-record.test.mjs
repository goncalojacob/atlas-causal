import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaffold } from '../tools/new-record.mjs';
import { createValidator } from '../src/validate/schema.js';
import { schemas } from './helpers.mjs';

const opts = { author: 'Fixture Author', github: 'fixture-author', source: ['fixture-source-1'] };

test('scaffolded records have the envelope and pass their schema; the text is left empty for a person', async () => {
  const v = createValidator(await schemas());
  const event = scaffold('event', ['fixture-scaffold'], { ...opts, title: 'Fixture', start: '1300', lon: '1', lat: '2', label: 'Fixture' });
  assert.equal(event.kind, 'event');
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
});

test('scaffold refuses bad input', () => {
  assert.throws(() => scaffold('event', ['Bad Id'], { ...opts, start: '1' }), /slug/);
  assert.throws(() => scaffold('event', ['fixture-x'], opts), /--start/);
  assert.throws(() => scaffold('edge', ['a', 'b', 'made'], opts), /type must be one of/);
  assert.throws(() => scaffold('presence', ['x'], opts), /kind must be/);
});

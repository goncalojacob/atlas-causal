import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaffold, scaffoldAll } from '../tools/new-record.mjs';
import { createValidator } from '../src/validate/schema.js';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { schemas, FIXTURE_DATA } from './helpers.mjs';
import { isDraft, isReviewed } from '../src/origin.js';
import { buildIndex } from '../tools/build-index.mjs';

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

  const narrative = scaffold('narrative', ['fixture-scaffold-walk'], {
    ...opts, title: 'A fixture walk', step: ['fixture-event-a', 'fixture-event-a--fixture-event-b--caused'], from: '1200', to: '1260',
  });
  assert.deepEqual(narrative.steps, [
    { ref: 'fixture-event-a', text: '' },
    { ref: 'fixture-event-a--fixture-event-b--caused', text: '' },
  ]);
  assert.deepEqual(narrative.window, { from: 1200, to: 1260 });
  // The whole of a narrative is its prose, so the scaffold leaves the summary
  // and every step blank for a person to write.
  assert.deepEqual(v.validate('v1/narrative.json', narrative).map((e) => e.path), ['/summary', '/steps/0/text', '/steps/1/text']);

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
  assert.throws(() => scaffold('narrative', ['x'], { ...opts, step: ['fixture-event-a'] }), /at least two --step/);
  assert.throws(() => scaffold('narrative', ['Bad Id'], { ...opts, step: ['a', 'b'] }), /slug/);
  assert.throws(() => scaffold('place', ['x'], opts), /--lon and --lat/);
  assert.throws(() => scaffold('place', ['Bad Id'], { ...opts, lon: '1', lat: '2' }), /slug/);
  assert.throws(() => scaffold('event', ['fixture-x'], { ...opts, start: '1', place: 'Not A Slug' }), /--place/);
});

// R10: a scaffolded record and an imported one both reach review.html.
// Nothing wrote `review.status`, so `isDraft` said no to every record the
// tools created and the dashboard's "nothing left" was a claim about a corpus
// it had never seen. The queue is built from the drafts, so what is asserted
// here is that the record is in the file the dashboard reads.
test('a scaffolded record and an imported one are both in the review queue', async () => {
  for (const [kind, positional, extra] of [
    ['event', ['fixture-scaffold-queue'], { title: 'Fixture', start: '1300' }],
    ['edge', ['fixture-event-a', 'fixture-event-b', 'caused'], {}],
    ['actor', ['fixture-scaffold-queued-actor'], { type: 'person', names: 'A Person', start: '1900' }],
    ['place', ['fixture-scaffold-queued-place'], { lon: '0', lat: '0', names: 'Nowhere' }],
  ]) {
    const record = scaffold(kind, positional, { ...opts, ...extra });
    assert.deepEqual(record.review, { status: 'draft' }, `${kind} is a draft`);
    assert.ok(isDraft(record), `${kind} is in the queue`);
    assert.equal(isReviewed(record), false);
  }

  // And through the index the dashboard actually fetches. (The two imports
  // are held to the same thing by their own tests, over their own records.)
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-queue-'));
  try {
    await cp(FIXTURE_DATA, dir, { recursive: true });
    const scaffolded = scaffold('event', ['fixture-scaffold-queue'], { ...opts, title: 'Fixture', start: '1300', place: 'fixture-place-a' });
    scaffolded.summary = 'A synthetic record, written to prove that a scaffold reaches the queue.';
    scaffolded.region = null;
    await writeFile(path.join(dir, 'events', 'fixture-scaffold-queue.json'), `${JSON.stringify(scaffolded, null, 2)}\n`, 'utf8');
    const built = await buildIndex(dir);
    const manifest = JSON.parse(built.files['manifest.json']);
    const review = JSON.parse(built.files[path.basename(manifest.files.review)]);
    assert.equal(review.drafts, 1, 'the one record the tools wrote is the one in the queue');
    const shard = review.kinds.find((k) => k.kind === 'event');
    const rows = JSON.parse(built.files[path.basename(shard.file)]);
    assert.ok(rows.records.some((r) => r.id === 'fixture-scaffold-queue'), 'and the dashboard can see it');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

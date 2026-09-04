// The pure half of the review dashboard: the queue, signing, retracting and
// where a save goes. Nothing here reaches the DOM or the network.
//
// Every record built in this file is synthetic. Nothing under tests/ is a
// historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  DRAFT_AUTHOR, KIND_ORDER, NO_IDENTIFIER, isDraft, countDrafts, labelOf, warningsById, flagsOf,
  buildQueue, groupByKind, flagCounts, filterQueue, progressOf, digestOf,
} from '../src/review/queue.js';
import {
  normalizeReviewer, reviewerProblems, signRecord, retractRecord, retractionPlan, bundleOf,
} from '../src/review/sign.js';
import { endpointFor, putBundle, saveBundle } from '../src/review/save.js';
import { claim, messageOf, choicesFrom } from '../src/review/editor.js';
import { buildTopology, validate } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { readRecords } from '../tools/lib/read.mjs';
import { schemas, fixtures, ROOT } from './helpers.mjs';

const DRAFT = Object.freeze([{ name: DRAFT_AUTHOR, github: null }]);

function draft(over) {
  return { schema: 1, kind: 'event', id: 'fixture-draft', status: 'active', authors: DRAFT, ...over };
}

test('a draft is an author entry, and nothing else', () => {
  assert.ok(isDraft(draft()));
  assert.ok(!isDraft(draft({ authors: [{ name: 'A Reviewer', github: 'reviewer' }] })));
  assert.ok(!isDraft({ authors: [] }));
  assert.ok(!isDraft(undefined));
  assert.equal(countDrafts([draft(), draft({ id: 'b' }), { authors: [] }]), 2);
});

test('a record is named in the list by the thing it is', () => {
  assert.equal(labelOf(draft({ title: 'A fixture event' })), 'A fixture event');
  assert.equal(labelOf({ kind: 'actor', id: 'x', names: ['A Fixture Party', 'AFP'] }), 'A Fixture Party');
  assert.equal(labelOf({ kind: 'edge', from: 'a', to: 'b', type: 'caused' }), 'a — caused → b');
  assert.equal(labelOf({ kind: 'place', id: 'x', names: [] }), 'x');
});

test('the queue carries the validator\'s own warnings, in kind order', () => {
  const records = [
    draft({ kind: 'edge', id: 'a--b--caused', from: 'a', to: 'b', type: 'caused' }),
    draft({ kind: 'event', id: 'fixture-event-lonely', title: 'Lonely' }),
    draft({ kind: 'source', id: 'fixture-source-thin', title: 'Thin', isbn: null, doi: null }),
    { kind: 'event', id: 'fixture-event-signed', title: 'Signed', status: 'active', authors: [{ name: 'A Reviewer', github: null }] },
  ];
  const warnings = [
    { rule: 'degree-zero', id: 'fixture-event-lonely', message: 'event has no edges' },
    { rule: 'degree-zero', id: 'fixture-event-lonely', message: 'repeated: counted once' },
  ];
  const queue = buildQueue(records, { warnings });
  assert.deepEqual(queue.map((q) => q.id), ['fixture-source-thin', 'fixture-event-lonely', 'a--b--caused'],
    'sources before events before edges, and the signed record is gone');
  assert.deepEqual(queue[0].flags, [NO_IDENTIFIER]);
  assert.deepEqual(queue[1].flags, ['degree-zero']);
  assert.deepEqual(queue[2].flags, []);

  assert.deepEqual(groupByKind(queue).map((g) => [g.kind, g.count]), [['source', 1], ['event', 1], ['edge', 1]]);
  assert.deepEqual(flagCounts(queue), [{ flag: 'degree-zero', count: 1 }, { flag: NO_IDENTIFIER, count: 1 }]);

  assert.deepEqual(filterQueue(queue, { kind: 'event' }).map((q) => q.id), ['fixture-event-lonely']);
  assert.deepEqual(filterQueue(queue, { flag: NO_IDENTIFIER }).map((q) => q.id), ['fixture-source-thin']);
  assert.deepEqual(filterQueue(queue, { text: 'LONELY' }).map((q) => q.id), ['fixture-event-lonely']);
  assert.deepEqual(filterQueue(queue, {}).length, 3);

  const progress = progressOf(records);
  assert.deepEqual(progress, { total: 4, remaining: 3, reviewed: 1, byKind: [{ kind: 'source', count: 1 }, { kind: 'event', count: 1 }, { kind: 'edge', count: 1 }] });

  // The dashboard holds only the drafts — the digests in data/index/ — so the
  // number of records there are is told to it rather than counted.
  assert.deepEqual(progressOf(records.filter(isDraft), { total: 4 }), progress);
});

test('a digest carries what the queue reads and no prose', () => {
  const record = draft({ id: 'fixture-event-digest', title: 'A title', summary: 'Prose the list never shows.', when: { start: 1500 } });
  const digest = digestOf(record);
  assert.deepEqual(Object.keys(digest).sort(), ['authors', 'id', 'kind', 'status', 'title']);
  assert.deepEqual(buildQueue([digest]), buildQueue([record]));
});

test('a record may ask for itself to be looked at', () => {
  const byId = warningsById([{ rule: 'degree-zero', id: 'fixture-draft' }]);
  assert.deepEqual(flagsOf(draft({ review: { flags: ['date'], note: 'the month is a guess' } }), byId), ['date', 'degree-zero']);
  assert.equal(buildQueue([draft({ review: { flags: [], note: 'look here' } })])[0].note, 'look here');
});

test('every kind the queue orders is a kind the form can edit', async () => {
  const { FIELDS } = await import('../src/contribute/bundle.js');
  for (const kind of KIND_ORDER) assert.ok(Object.hasOwn(FIELDS, kind), kind);
});

// --- signing ---------------------------------------------------------------

test('signing replaces the draft marker with the person who read it', () => {
  const record = draft({ revised: null, review: { flags: ['date'], note: 'check it' } });
  const signed = signRecord(record, { name: 'A Reviewer', github: '@reviewer' }, { today: '2026-09-04' });
  assert.deepEqual(signed.authors, [{ name: 'A Reviewer', github: 'reviewer' }]);
  assert.equal(signed.revised, '2026-09-04');
  assert.equal(Object.hasOwn(signed, 'review'), false, 'what was flagged has been looked at');
  assert.deepEqual(record.authors, DRAFT, 'the original is untouched');

  // Signing twice does not list the reviewer twice.
  assert.deepEqual(signRecord(signed, { name: 'A Reviewer', github: 'reviewer' }, { today: '2026-09-05' }).authors, signed.authors);

  // A co-author who is not the draft marker stays.
  const shared = draft({ authors: [{ name: 'Someone Else', github: null }, ...DRAFT] });
  assert.deepEqual(signRecord(shared, { name: 'A Reviewer', github: null }, { today: '2026-09-04' }).authors,
    [{ name: 'Someone Else', github: null }, { name: 'A Reviewer', github: null }]);
});

test('a reviewer needs a name, and a handle that is one', () => {
  assert.deepEqual(normalizeReviewer({ name: '  A Reviewer  ', github: '@reviewer' }), { name: 'A Reviewer', github: 'reviewer' });
  assert.deepEqual(normalizeReviewer({ name: 'A', github: '' }), { name: 'A', github: null });
  assert.deepEqual(reviewerProblems({ name: '', github: '' }), ['a reviewer signs with a name']);
  assert.deepEqual(reviewerProblems({ name: 'A', github: 'not a login' }), ['that is not a GitHub login']);
  assert.deepEqual(reviewerProblems({ name: 'A', github: 'reviewer' }), []);
  assert.deepEqual(reviewerProblems({ name: 'A', github: '' }), []);
});

test('retracting an event carries its edges and the narratives that walk them', async () => {
  const { records, regions, polygons } = await fixtures();
  const topology = buildTopology(records, regions, { deriveRegion: createRegionDeriver(polygons) });
  const event = topology.events.find((e) => topology.edges.some((x) => x.status === 'active' && (x.from === e.id || x.to === e.id)));
  const plan = retractionPlan({ kind: 'event', id: event.id }, topology);
  assert.deepEqual(plan.blockers, []);
  assert.ok(plan.retract.length > 0, 'an event with edges takes them with it');
  for (const item of plan.retract) assert.ok(item.kind === 'edge' || item.kind === 'narrative');
  assert.ok(!plan.retract.some((i) => i.id === event.id), 'the record itself is not in its own cascade');

  const retracted = retractRecord({ kind: 'event', id: 'x', status: 'active', revised: null }, { today: '2026-09-04' });
  assert.equal(retracted.status, 'retracted');
  assert.equal(retracted.revised, '2026-09-04');
});

test('retracting an actor or a place is blocked, not cascaded', async () => {
  const { records, regions, polygons } = await fixtures();
  const topology = buildTopology(records, regions, { deriveRegion: createRegionDeriver(polygons) });
  const actorId = topology.events.flatMap((e) => (e.actors ?? []).map((a) => a.actor))[0];
  if (actorId) {
    const plan = retractionPlan({ kind: 'actor', id: actorId }, topology);
    assert.deepEqual(plan.retract, []);
    assert.ok(plan.blockers.length > 0, 'the events naming it would have to be rewritten first');
  }
  const placeId = topology.events.map((e) => e.place).find(Boolean);
  if (placeId) {
    const plan = retractionPlan({ kind: 'place', id: placeId }, topology);
    assert.ok(plan.blockers.every((b) => b.kind === 'event'));
  }
});

test('a retraction that carries its edges validates as a bundle', async () => {
  const { records, regions, polygons } = await fixtures();
  const all = await schemas();
  const topology = buildTopology(records, regions, { deriveRegion: createRegionDeriver(polygons) });
  const byId = new Map(records.map((r) => [r.id, r]));
  const event = records.find((r) => r.kind === 'event' && r.status === 'active'
    && topology.edges.some((x) => x.status === 'active' && (x.from === r.id || x.to === r.id)));
  const plan = retractionPlan(event, topology);
  const bundle = bundleOf([
    retractRecord(event, { today: '2026-09-04' }),
    ...plan.retract.map((i) => retractRecord(byId.get(i.id), { today: '2026-09-04' })),
  ]);
  const { errors } = validate(bundle.records, topology, all);
  assert.deepEqual(errors, [], JSON.stringify(errors));

  // The same retraction without the cascade is exactly what rule 11 forbids.
  const alone = validate([retractRecord(event, { today: '2026-09-04' })], topology, all);
  assert.ok(alone.errors.some((e) => e.rule === 11), 'an active edge to a retracted event is rule 11');
});

// --- where a save goes -----------------------------------------------------

function response({ status = 200, json = null, type = 'application/json; charset=utf-8' }) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => type },
    json: async () => {
      if (json === null) throw new Error('not JSON');
      return json;
    },
  };
}

test('a save goes to the server when there is one', async () => {
  const seen = [];
  const doFetch = async (url, init) => {
    seen.push({ url, method: init.method, type: init.headers['content-type'] });
    return response({ json: { ok: true, written: [{ path: 'data/events/x.json' }], warnings: [] } });
  };
  const out = await saveBundle({ schema: 1, records: [] }, { kind: 'event', id: 'fixture-event-a' }, { fetch: doFetch });
  assert.equal(out.mode, 'saved');
  assert.deepEqual(seen, [{ url: '/__records/event/fixture-event-a', method: 'PUT', type: 'application/json' }]);
  assert.equal(endpointFor('edge', 'a--b--caused'), '/__records/edge/a--b--caused');
});

test('a server that refuses says why, and is not mistaken for no server', async () => {
  const doFetch = async () => response({ status: 422, json: { ok: false, message: '1 problem(s)', errors: [{ rule: 6, message: 'no sources' }] } });
  const out = await saveBundle({ schema: 1, records: [] }, { kind: 'event', id: 'x' }, { fetch: doFetch });
  assert.equal(out.mode, 'refused');
  assert.equal(out.ok, false);
  assert.equal(out.errors.length, 1);
});

test('with no write endpoint the save becomes a correction bundle', async () => {
  const submitted = [];
  const submit = async (bundle, options) => {
    submitted.push({ bundle, template: options.template });
    return { copied: true, prefilled: true, url: 'https://example.invalid/issues/new' };
  };
  // python3 -m http.server answers a PUT with 501 and an HTML page.
  const doFetch = async () => response({ status: 501, type: 'text/html', json: null });
  const out = await saveBundle({ schema: 1, records: [{ id: 'x' }] }, { kind: 'event', id: 'x' }, { fetch: doFetch, submit });
  assert.equal(out.mode, 'bundle');
  assert.equal(out.copied, true);
  assert.equal(submitted[0].template, 'correction.yml');

  // And when the fetch cannot even be made — the published site.
  const thrown = async () => { throw new Error('failed to fetch'); };
  const offline = await saveBundle({ schema: 1, records: [] }, { kind: 'event', id: 'x' }, { fetch: thrown, submit });
  assert.equal(offline.mode, 'bundle');
  assert.equal(await putBundle({}, { kind: 'event', id: 'x' }, { fetch: thrown }).then((r) => r.available), false);
});

// --- against the real dataset ----------------------------------------------

test('the queue is every draft in data/, and the validator counts the same', async () => {
  const { entries, problems } = await readRecords(path.join(ROOT, 'data'));
  assert.deepEqual(problems, []);
  const records = entries.map((e) => e.record);
  const queue = buildQueue(records);
  assert.equal(queue.length, countDrafts(records));
  assert.ok(queue.length > 0, 'the exception in CLAUDE.md is not retired yet');
  // Nothing imported is ever in the queue: an import is not a draft.
  assert.ok(!queue.some((q) => q.kind === 'presence'));
  for (const item of queue) assert.ok(KIND_ORDER.includes(item.kind), item.kind);
});

// --- the editor's pure parts -----------------------------------------------
// createEditor needs a DOM and is exercised by hand; these three decide what
// it shows and what it offers, and they do not.

test('an error finds the input that caused it, or the record', () => {
  const view = (field) => ({ field, input: { value: '' }, wrap: {}, error: {} });
  const fields = new Map([
    ['/where/lon', view({ key: 'lon', required: true })],
    ['/sources', view({ key: 'citations' })],
    ['/title', view({ key: 'title', required: false })],
  ]);
  assert.equal(claim(fields, '/where/lon'), fields.get('/where/lon'));
  // A citation's error belongs to the list it is in…
  assert.equal(claim(fields, '/sources/0/source'), fields.get('/sources'));
  // …an error on a subtree to the first field inside it…
  assert.equal(claim(fields, '/where'), fields.get('/where/lon'));
  // …and one nothing claims is the record's, not silently dropped.
  assert.equal(claim(fields, '/actors/0/actor'), null);
  assert.equal(claim(fields, ''), null);

  assert.equal(messageOf({ message: 'x' }, fields.get('/where/lon')), 'required',
    'a blank required field says so rather than repeating the schema');
  assert.equal(messageOf({ message: 'x' }, fields.get('/title')), 'x');
  const oneOf = {
    path: '/when',
    message: '0 of 2 alternatives matched',
    alternatives: [[{ path: '/when', message: 'not this one' }], [{ path: '/when/start', message: 'a year is an integer' }]],
  };
  assert.equal(messageOf(oneOf, fields.get('/title')), 'a year is an integer');
});

test('the editor offers what is active in the atlas, and says when a reference is not', () => {
  const topology = {
    events: [
      { id: 'b-event', title: 'Second', status: 'active' },
      { id: 'a-event', title: 'First', status: 'active' },
      { id: 'gone', title: 'Retracted', status: 'retracted' },
    ],
    edges: [{ id: 'a-event--b-event--caused', from: 'a-event', to: 'b-event', type: 'caused', status: 'active' }],
    sources: [{ id: 'a-source', title: 'A work', status: 'active' }],
    actors: [{ id: 'an-actor', name: 'Somebody', actorType: 'person', status: 'active' }],
    places: [{ id: 'a-place', name: 'Somewhere', status: 'active' }],
    regions: [{ id: 'europe', label: 'Europe' }],
  };
  const options = choicesFrom(topology);
  assert.deepEqual(options('events').map((o) => o.value), ['', 'a-event', 'b-event'], 'by name, and a null choice first');
  assert.ok(!options('events').some((o) => o.value === 'gone'), 'a retracted record is not offered');
  assert.deepEqual(options('records').map((o) => o.label).slice(-1), ['First — caused → Second']);
  assert.deepEqual(options('places').map((o) => o.value), ['', 'a-place']);
  assert.deepEqual(options('regions').map((o) => o.value), ['', 'europe']);
  assert.deepEqual(options('actors').map((o) => o.label), ['— choose an actor —', 'Somebody — person']);
  assert.deepEqual(options('nothing'), []);
});

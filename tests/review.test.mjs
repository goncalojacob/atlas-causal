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
  normalizeReviewer, reviewerProblems, signRecord, retractRecord, retractionPlan, bundleOf, carriedReason,
} from '../src/review/sign.js';
import { endpointFor, putBundle, saveBundle } from '../src/review/save.js';
import { claim, messageOf, regionChoices } from '../src/review/editor.js';
import { pickerIndex } from '../src/contribute/picker.js';
import { search } from '../src/search.js';
import { buildTopology, validate } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { readRecords } from '../tools/lib/read.mjs';
import { schemas, fixtures, ROOT } from './helpers.mjs';

const DRAFT = Object.freeze([{ name: DRAFT_AUTHOR, github: null }]);

// The marker is still on `authors`, because that is attribution and Sign
// still replaces it; what makes the record a draft is `review.status`.
function draft(over) {
  const { review, ...rest } = over ?? {};
  return {
    schema: 1, kind: 'event', id: 'fixture-draft', status: 'active', authors: DRAFT,
    ...rest,
    review: { status: 'draft', ...review },
  };
}

test('a draft is a review status, and not a name in authors', () => {
  assert.ok(isDraft(draft()));
  // The marker gone and the status still there: the record is what the
  // status says, not what the author list says (health review A, finding 8).
  assert.ok(isDraft(draft({ authors: [{ name: 'A Reviewer', github: 'reviewer' }] })));
  // The marker there and no status: an author name decides nothing now.
  assert.ok(!isDraft({ authors: DRAFT }));
  assert.ok(!isDraft({ authors: [] }));
  assert.ok(!isDraft(undefined));
  assert.ok(!isDraft({ review: { status: 'reviewed' } }));
  assert.equal(countDrafts([draft(), draft({ id: 'b' }), { authors: DRAFT }]), 2);
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
  assert.deepEqual(Object.keys(digest).sort(), ['authors', 'id', 'kind', 'review', 'status', 'title']);
  assert.deepEqual(buildQueue([digest]), buildQueue([record]));
});

test('the queue says which records have a full entry, and the digest says it without the prose', () => {
  const withEntry = draft({ id: 'fixture-event-entry', title: 'A title', body: '## A section\n\nA long text nobody wants in an index.' });
  const without = draft({ id: 'fixture-event-plain', title: 'A title' });
  assert.equal(buildQueue([withEntry])[0].body, true);
  assert.equal(buildQueue([without])[0].body, false);
  // The digest carries the answer and not the entry, and the queue built from
  // it says the same thing as the queue built from the record.
  const digest = digestOf(withEntry);
  assert.equal(digest.entry, true);
  assert.equal(JSON.stringify(digest).includes('A long text'), false);
  assert.deepEqual(buildQueue([digest]), buildQueue([withEntry]));
  assert.equal(Object.hasOwn(digestOf(without), 'entry'), false);
  // Whitespace is not an entry.
  assert.equal(buildQueue([draft({ id: 'fixture-event-blank', body: '   \n ' })])[0].body, false);
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
  // The flags and the note are gone: what was asked for has been looked at.
  // The status and the signature are what is left, and they say the record
  // has been read rather than leaving an absent block to mean it (rule 28).
  assert.deepEqual(signed.review, {
    status: 'reviewed',
    signedBy: [{ name: 'A Reviewer', github: 'reviewer', on: '2026-09-04' }],
  });
  assert.deepEqual(record.authors, DRAFT, 'the original is untouched');
  assert.deepEqual(record.review, { status: 'draft', flags: ['date'], note: 'check it' });

  // Signing twice does not list the reviewer twice, in either list.
  const again = signRecord(signed, { name: 'A Reviewer', github: 'reviewer' }, { today: '2026-09-05' });
  assert.deepEqual(again.authors, signed.authors);
  assert.deepEqual(again.review.signedBy, signed.review.signedBy);
  // A second person who reads it is added, not substituted: a record can be
  // read by more than one.
  const twice = signRecord(signed, { name: 'Another Reviewer', github: null }, { today: '2026-09-06' });
  assert.deepEqual(twice.review.signedBy.map((s) => s.name), ['A Reviewer', 'Another Reviewer']);

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

  const reason = 'A synthetic withdrawal, written in a test and about nothing.';
  const retracted = retractRecord({ kind: 'event', id: 'x', status: 'active', revised: null }, { today: '2026-09-04', reason });
  assert.equal(retracted.status, 'retracted');
  assert.equal(retracted.revised, '2026-09-04');
  assert.deepEqual(retracted.retraction, { on: '2026-09-04', reason });
  // A retraction is an argument, so there is no writing one without it.
  assert.throws(() => retractRecord({ kind: 'event', id: 'x' }, { today: '2026-09-04' }), /says why/);
  assert.throws(() => retractRecord({ kind: 'event', id: 'x' }, { today: '2026-09-04', reason: '   ' }), /says why/);
  // The cascade's records carry the fact that they follow, not an argument
  // nobody made about them.
  assert.match(carriedReason('x'), /^Retracted with x: /);
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
  const reason = 'A synthetic withdrawal, written in a test and about nothing.';
  const bundle = bundleOf([
    retractRecord(event, { today: '2026-09-04', reason }),
    ...plan.retract.map((i) => retractRecord(byId.get(i.id), { today: '2026-09-04', reason: carriedReason(event.id) })),
  ]);
  const { errors } = validate(bundle.records, topology, all);
  assert.deepEqual(errors, [], JSON.stringify(errors));

  // The same retraction without the cascade is exactly what rule 11 forbids.
  const alone = validate([retractRecord(event, { today: '2026-09-04', reason })], topology, all);
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
      { id: 'b-event', title: 'Second', status: 'active', place: 'a-place', when: { start: 1911, end: 1911 } },
      { id: 'a-event', title: 'First', status: 'active', when: { start: 1910, end: 1910 } },
      { id: 'gone', title: 'Retracted second', status: 'retracted' },
    ],
    edges: [{ id: 'a-event--b-event--caused', from: 'a-event', to: 'b-event', type: 'caused', status: 'active' }],
    sources: [{ id: 'a-source', title: 'A work', status: 'active' }],
    actors: [{ id: 'an-actor', name: 'Somebody', actorType: 'person', status: 'active' }],
    places: [{ id: 'a-place', name: 'Somewhere', names: ['Somewhere'], status: 'active' }],
    regions: [{ id: 'europe', label: 'Europe' }],
  };
  const index = pickerIndex({ topology });
  const found = (name, query) => search(index.entriesOf(name), query).groups.flatMap((g) => g.items).map((i) => i.id);

  assert.deepEqual(found('events', 'second'), ['b-event'], 'a retracted record is not offered');
  assert.deepEqual(found('places', 'somewhere'), ['a-place']);
  assert.deepEqual(found('actors', 'somebody'), ['an-actor']);
  assert.deepEqual(found('sources', 'a work'), ['a-source']);
  // A step points at an event or at the link between two, and a link is
  // found by the events it runs between.
  assert.deepEqual(found('records', 'first'), ['a-event', 'a-event--b-event--caused']);
  assert.equal(index.find('records', 'a-event--b-event--caused').label, 'First — caused → Second');

  // What is shown beside a hit: the years, the place, and how much of the
  // atlas already hangs on the record.
  assert.deepEqual(index.describe(index.find('events', 'b-event')), { when: '1911', place: 'Somewhere', degree: 1 });
  // And what the record is already linked to, which is the other half of
  // knowing whether it is the one meant.
  assert.deepEqual(index.linksOf('event', 'b-event'), [{ way: 'in', type: 'caused', other: 'First' }]);
  assert.deepEqual(index.linksOf('actor', 'an-actor'), []);

  // A reference to something the atlas no longer has is not quietly swapped
  // for something else: it is not found, and the picker says so.
  assert.equal(index.find('events', 'gone'), null);

  // The lanes are the one reference field that stays a `<select>`.
  assert.deepEqual(regionChoices(topology).map((o) => o.value), ['', 'europe']);
});

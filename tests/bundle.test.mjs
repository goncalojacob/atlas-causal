// The pure half of the contribution form. Everything here is synthetic:
// fixture-* ids, invented titles, no historical claim anywhere.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELDS, CITATION_LISTS, ACTOR_LISTS, STEP_LISTS, emptyValues, slugify, parseBound, buildRecord, buildBundle,
  comparableOf, comparableIndex, findDuplicates, similarity, checkBundleShape, validateBundle, everythingCited,
  valuesFromRecord, applyValues, wikidataFrom, canMove, moveItem,
} from '../src/contribute/bundle.js';
import { buildTopology } from '../src/validate/core.js';
import { createValidator } from '../src/validate/schema.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readRecords } from '../tools/lib/read.mjs';
import { schemas, fixtures, ROOT } from './helpers.mjs';

const CONTEXT = { author: 'Fixture Contributor', today: '2026-09-01' };

async function topologyOf() {
  const { records, regions, polygons } = await fixtures();
  return buildTopology(records, regions, { deriveRegion: createRegionDeriver(polygons) });
}

// No place: the lane is set by hand, which is what a timeline-only event
// does. The bundles below that want a place add one and point at it.
const eventValues = {
  ...emptyValues('event'),
  id: 'fixture-event-new',
  title: 'Fixture event new',
  summary: 'A synthetic event added by the form in a test. It is not history.',
  start: '1300',
  region: 'fixture-lane-1',
  citations: [{ source: 'fixture-source-1', locator: 'p. 1' }],
};

const placeValues = {
  ...emptyValues('place'),
  id: 'fixture-place-new',
  names: 'Fixture place new; Fixtura Nova',
  lon: '1.5',
  lat: '2.5',
  precision: 'city',
};

test('every field path is a property the kind schema knows', async () => {
  const all = await schemas();
  for (const [kind, fields] of Object.entries(FIELDS)) {
    const properties = all[`v1/${kind}.json`].properties;
    for (const field of fields) {
      const head = field.path.split('/')[1];
      assert.ok(Object.hasOwn(properties, head), `${kind}.${field.key} → /${head} is not in v1/${kind}.json`);
    }
    for (const list of [...CITATION_LISTS[kind], ...ACTOR_LISTS[kind], ...STEP_LISTS[kind]]) {
      assert.ok(Object.hasOwn(properties, list.path.split('/')[1]), `${kind} list ${list.key}`);
    }
  }
});

test('slugify, parseBound and the end-year shorthand', () => {
  assert.equal(slugify('Fixture Event: the Second!'), 'fixture-event-the-second');
  assert.equal(slugify('Ceütä  Fixture'), 'ceuta-fixture');
  assert.equal(slugify('  '), '');

  assert.equal(parseBound('1415'), 1415);
  assert.equal(parseBound(' -44 '), -44);
  assert.deepEqual(parseBound('-9600..-9000'), { min: -9600, max: -9000 });
  // Not a year: it comes back as typed, so the schema reports the path.
  assert.equal(parseBound('fifteenth century'), 'fifteenth century');
  assert.equal(parseBound(''), '');

  const same = buildRecord('event', { ...eventValues, start: '1300', end: '' }, CONTEXT);
  assert.deepEqual(same.when, { start: 1300, end: 1300 });
  const ongoing = buildRecord('event', { ...eventValues, end: 'ongoing' }, CONTEXT);
  assert.equal(ongoing.when.end, null);
  const ranged = buildRecord('event', { ...eventValues, start: '1300..1310', end: '1320' }, CONTEXT);
  assert.deepEqual(ranged.when, { start: { min: 1300, max: 1310 }, end: 1320 });
});

test('a built record carries the envelope and passes its schema', async () => {
  const v = createValidator(await schemas());

  const event = buildRecord('event', { ...eventValues, date: '1300-05-06', calendar: 'julian' }, CONTEXT);
  assert.deepEqual(event.authors, [{ name: 'Fixture Contributor', github: null }]);
  assert.equal(event.license, 'CC-BY-SA-4.0');
  assert.equal(event.created, '2026-09-01');
  assert.deepEqual(event.actors, []);
  // No place at all is legal: a long process is timeline-only, and then the
  // lane is the record's own.
  assert.equal(event.place, null);
  assert.equal(event.region, 'fixture-lane-1');
  assert.deepEqual(v.validate('v1/event.json', event), []);

  const placed = buildRecord('event', { ...eventValues, place: 'fixture-place-new', region: '' }, CONTEXT);
  assert.equal(placed.place, 'fixture-place-new');
  assert.deepEqual(v.validate('v1/event.json', placed), []);

  // A place cites nothing and carries its display name into the point's
  // label, so the two can never disagree.
  const place = buildRecord('place', placeValues, CONTEXT);
  assert.deepEqual(place.names, ['Fixture place new', 'Fixtura Nova']);
  assert.deepEqual(place.where, { lon: 1.5, lat: 2.5, precision: 'city', label: 'Fixture place new' });
  assert.deepEqual(place.sources, []);
  assert.equal(place.summary, null);
  assert.deepEqual(v.validate('v1/place.json', place), []);

  const edge = buildRecord('edge', {
    ...emptyValues('edge'),
    from: 'fixture-event-a',
    to: 'fixture-event-b',
    type: 'caused',
    confidence: 'probable',
    explanation: 'A synthetic argument long enough to count as an argument.',
    citations: [{ source: 'fixture-source-1', locator: '' }],
  }, CONTEXT);
  assert.equal(edge.id, 'fixture-event-a--fixture-event-b--caused');
  assert.equal(Object.hasOwn(edge, 'dispute'), false);
  assert.deepEqual(edge.sources, [{ source: 'fixture-source-1', locator: null }]);
  assert.deepEqual(v.validate('v1/edge.json', edge), []);

  const disputed = buildRecord('edge', {
    ...emptyValues('edge'),
    from: 'fixture-event-a',
    to: 'fixture-event-b',
    type: 'caused',
    confidence: 'disputed',
    explanation: 'A synthetic argument long enough to count as an argument.',
    disputeText: 'Synthetic dissent, also long enough to be a real sentence.',
    citations: [{ source: 'fixture-source-1' }],
    disputeCitations: [{ source: 'fixture-source-2' }],
  }, CONTEXT);
  assert.deepEqual(disputed.dispute.sources, [{ source: 'fixture-source-2', locator: null }]);
  assert.deepEqual(v.validate('v1/edge.json', disputed), []);

  const source = buildRecord('source', {
    ...emptyValues('source'),
    id: 'fixture-source-new',
    type: 'article',
    creators: 'One Fixture; Two Fixture ',
    title: 'A synthetic article',
    year: '2026',
    doi: '10.0000/fixture',
  }, CONTEXT);
  assert.deepEqual(source.creators, ['One Fixture', 'Two Fixture']);
  assert.equal(source.year, 2026);
  assert.equal(source.publisher, null);
  assert.deepEqual(v.validate('v1/source.json', source), []);

  const relation = buildRecord('relation', {
    ...emptyValues('relation'),
    from: 'fixture-actor-one',
    to: 'fixture-polity-three',
    type: 'member-of',
    start: '1200',
    end: '',
    note: '  ',
    citations: [{ source: 'fixture-source-1' }],
  }, CONTEXT);
  assert.equal(relation.id, 'fixture-actor-one--fixture-polity-three--member-of');
  // A blank end is the year it began, as everywhere else in the form; a blank
  // note is no note rather than an empty one.
  assert.deepEqual(relation.when, { start: 1200, end: 1200 });
  assert.equal(relation.note, null);
  assert.deepEqual(v.validate('v1/relation.json', relation), []);
  const ongoing = buildRecord('relation', {
    ...emptyValues('relation'), from: 'a', to: 'b', type: 'led', start: '1970', end: 'ongoing', citations: [{ source: 'fixture-source-1' }],
  }, CONTEXT);
  assert.deepEqual(ongoing.when, { start: 1970, end: null });

  const office = buildRecord('office', {
    ...emptyValues('office'),
    id: 'synthetic-office',
    of: 'fixture-polity-three',
    title: 'A Synthetic Post',
    category: 'head-of-state',
    start: '',
    end: '',
    summary: ' ',
  }, CONTEXT);
  // Both years blank is an office the atlas dates not at all — `when: null`,
  // never a start of nothing — and an office cites nothing at all (A13).
  assert.equal(office.when, null);
  assert.deepEqual(office.sources, []);
  assert.equal(office.summary, null);
  assert.deepEqual(v.validate('v1/office.json', office), []);
  const dated = buildRecord('office', {
    ...emptyValues('office'), id: 'synthetic-office', of: 'a', title: 'T', category: 'other', start: '1834', end: 'ongoing',
  }, CONTEXT);
  assert.deepEqual(dated.when, { start: 1834, end: null });

  const tenure = buildRecord('tenure', {
    ...emptyValues('tenure'),
    id: 'synthetic-tenure',
    person: 'fixture-actor-one',
    office: 'synthetic-office',
    start: '1200',
    end: '',
    startedBy: '',
    note: 'Held it through the two majorities.',
    citations: [{ source: 'fixture-source-1' }],
  }, CONTEXT);
  // A free slug and not from--to--type: one person may hold one office three
  // times (plan review, finding 1).
  assert.equal(tenure.id, 'synthetic-tenure');
  assert.deepEqual(tenure.when, { start: 1200, end: 1200 });
  assert.equal(tenure.startedBy, null);
  assert.equal(tenure.note, 'Held it through the two majorities.');
  assert.deepEqual(v.validate('v1/tenure.json', tenure), []);
  // And back to the form's own fields, which is the pair the review editor
  // opens a record in.
  assert.equal(valuesFromRecord('tenure', tenure).note, 'Held it through the two majorities.');

  assert.throws(() => buildRecord('presence', {}, CONTEXT), /kind must be/);
});

test('validateBundle runs the cross-record rules against the topology', async () => {
  const topology = await topologyOf();
  const all = await schemas();

  const good = buildBundle([
    { kind: 'source', values: { ...emptyValues('source'), id: 'fixture-source-new', type: 'book', creators: 'One Fixture', title: 'A synthetic book', isbn: '9780000000001' } },
    { kind: 'place', values: placeValues },
    // The place is in this same bundle: a reference resolves inside it.
    { kind: 'event', values: { ...eventValues, place: 'fixture-place-new', region: '' } },
    {
      kind: 'edge',
      values: {
        ...emptyValues('edge'),
        from: 'fixture-event-a',
        to: 'fixture-event-new',
        type: 'caused',
        confidence: 'probable',
        explanation: 'A synthetic argument long enough to count as an argument.',
        citations: [{ source: 'fixture-source-new' }],
      },
    },
  ], CONTEXT);
  const result = validateBundle(good, topology, all);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);

  // References resolve inside the bundle or in the topology, and nowhere else.
  const dangling = buildBundle([{ kind: 'event', values: { ...eventValues, citations: [{ source: 'fixture-source-absent' }] } }], CONTEXT);
  const danglingResult = validateBundle(dangling, topology, all);
  assert.equal(danglingResult.ok, false);
  assert.ok(danglingResult.errors.some((e) => e.rule === 3 && e.path === '/sources/0/source'));

  // Arrow of time fires in the browser, not only in CI.
  const backwards = buildBundle([{
    kind: 'edge',
    values: {
      ...emptyValues('edge'),
      from: 'fixture-event-t',
      to: 'fixture-event-a',
      type: 'caused',
      confidence: 'probable',
      explanation: 'A synthetic argument long enough to count as an argument.',
      citations: [{ source: 'fixture-source-1' }],
    },
  }], CONTEXT);
  assert.ok(validateBundle(backwards, topology, all).errors.some((e) => e.rule === 4));

  // No sources, no submit.
  const uncited = buildBundle([{ kind: 'event', values: { ...eventValues, citations: [] } }], CONTEXT);
  assert.equal(everythingCited(uncited), false);
  const uncitedResult = validateBundle(uncited, topology, all);
  assert.equal(uncitedResult.ok, false);
  assert.ok(uncitedResult.errors.some((e) => e.rule === 6));
});

test('checkBundleShape rejects anything that is not a bundle', () => {
  assert.deepEqual(checkBundleShape({ schema: 1, records: [{}] }), []);
  assert.ok(checkBundleShape(null).length);
  assert.ok(checkBundleShape([]).length);
  assert.ok(checkBundleShape({ schema: 2, records: [] }).some((p) => p.path === '/schema'));
  assert.ok(checkBundleShape({ schema: 1, records: [] }).some((p) => p.path === '/records'));
  assert.ok(checkBundleShape({ schema: 1 }).some((p) => p.path === '/records'));
  assert.ok(checkBundleShape({ schema: 1, records: [{}], extra: 1 }).some((p) => p.path === '/extra'));
});

test('the duplicate search finds near-matches before a new event is allowed', () => {
  const candidates = [
    { id: 'fixture-event-a', kind: 'event', title: 'Fixture event A', aliases: ['fixture-event-alpha'] },
    { id: 'fixture-event-b', kind: 'event', title: 'Fixture event B', aliases: [] },
    { id: 'fixture-event-melaka', kind: 'event', title: 'Fixture capture of Melaka', aliases: [] },
  ].map(comparableOf);
  const asked = (title) => findDuplicates(comparableOf({ id: 'new-one', kind: 'event', title }), candidates);

  assert.equal(asked('Fixture capture of Malacca')[0].id, 'fixture-event-melaka');
  assert.equal(asked('Fixture event A')[0].score, 1);
  assert.equal(asked('fixture event alpha')[0].id, 'fixture-event-a');
  assert.deepEqual(asked('Something entirely unrelated here'), []);
  assert.deepEqual(asked(''), []);
  assert.equal(
    findDuplicates(comparableOf({ id: 'new-one', kind: 'event', title: 'Fixture event' }), candidates, { limit: 1 }).length,
    1,
  );
  // R20: the id the atlas already has is the one duplicate that is certain,
  // and it was the only one the search skipped — so a stranger's new place
  // named "Lisbon" was filed as a replacement of Lisbon with nothing said.
  // It is reported, first, and marked as what it is.
  const own = findDuplicates(candidates[0], candidates);
  assert.equal(own[0].id, candidates[0].id, 'the record under that id is named');
  assert.equal(own[0].replaces, true);
  assert.equal(own[0].certain, true);
  assert.equal(own[0].why, 'the same id');
  // And it outranks a mere resemblance, whatever the resemblance scores.
  const both = findDuplicates(
    comparableOf({ id: 'fixture-event-b', kind: 'event', title: 'Fixture event A' }),
    candidates,
  );
  assert.equal(both[0].id, 'fixture-event-b');
  assert.equal(both[0].replaces, true);
  assert.ok(both.some((hit) => hit.id === 'fixture-event-a' && !hit.replaces), 'the near-match is still offered');

  assert.equal(similarity('Fixture Event A', 'fixture  event   a'), 1);
  assert.equal(similarity('', 'anything'), 0);
});

test('the duplicate search covers every kind, and an identifier settles it', () => {
  const index = comparableIndex({
    events: [{ id: 'fixture-event-a', title: 'Fixture event A', status: 'active' }],
    places: [
      { id: 'fixture-place-lisbon', names: ['Lisbon', 'Lisboa'], status: 'active' },
      { id: 'fixture-place-gone', names: ['Lisbon'], status: 'retracted' },
    ],
    actors: [{ id: 'fixture-actor-pide', names: ['PIDE', 'DGS'], wikidata: 'Q100', status: 'active' }],
    sources: [{ id: 'fixture-source-1', title: 'A fixture book', isbn: '9780000000001', doi: null, status: 'active' }],
  });

  // A place typed under its other name: an actor, a place and a source were
  // not compared at all before H6a (health review A, finding 10).
  const lisboa = findDuplicates(comparableOf({ id: 'lisboa', kind: 'place', names: ['Lisboa'] }), index.get('place'));
  assert.equal(lisboa.length, 1, 'the retracted namesake is not offered');
  assert.equal(lisboa[0].id, 'fixture-place-lisbon');
  assert.equal(lisboa[0].label, 'Lisbon');

  const dgs = findDuplicates(comparableOf({ id: 'dgs', kind: 'actor', names: ['DGS'] }), index.get('actor'));
  assert.equal(dgs[0].id, 'fixture-actor-pide');

  // The Wikidata item is certainty, not resemblance: nothing in the name
  // suggests the two are one, and the identifier says they are.
  const item = findDuplicates(
    comparableOf({ id: 'secret-police', kind: 'actor', names: ['Something else entirely'], wikidata: 'q100' }),
    index.get('actor'),
  );
  assert.equal(item[0].id, 'fixture-actor-pide');
  assert.equal(item[0].certain, true);
  assert.equal(item[0].why, 'the same Wikidata item');

  // The same book under another title, caught by its ISBN, hyphens and all.
  const book = findDuplicates(
    comparableOf({ id: 'other-2000-book', kind: 'source', title: 'Quite another title', isbn: '978-0-00-000000-1' }),
    index.get('source'),
  );
  assert.equal(book[0].id, 'fixture-source-1');
  assert.equal(book[0].why, 'the same ISBN');

  // An edge is its two ends and its type; there is nothing to compare.
  assert.deepEqual(findDuplicates(comparableOf({ id: 'a--b--caused', kind: 'edge' }), index.get('event')), []);
});

test('the form builds an actor, and puts actors with roles on an event', async () => {
  const topology = await topologyOf();
  const all = await schemas();
  const actor = buildRecord('actor', {
    ...emptyValues('actor'),
    id: 'fixture-actor-new',
    names: 'Fixture Body; FB; Corpo Fixture',
    actorType: 'institution',
    summary: 'A synthetic actor added by the form in a test. It never existed.',
    start: '1900',
    end: 'ongoing',
    citations: [{ source: 'fixture-source-1', locator: null }],
  }, CONTEXT);
  assert.deepEqual(actor.names, ['Fixture Body', 'FB', 'Corpo Fixture']);
  assert.deepEqual(actor.when, { start: 1900, end: null });
  assert.equal(actor.where, null);
  assert.deepEqual(createValidator(all).validate('v1/actor.json', actor), []);
  // An actor without a source is not submittable, as rule 6 now says.
  assert.equal(everythingCited({ records: [{ ...actor, sources: [] }] }), false);

  const event = buildRecord('event', {
    ...eventValues,
    actors: [
      { actor: 'fixture-actor-one', role: ' Leader ' },
      { actor: '', role: 'dropped: no actor chosen' },
    ],
  }, CONTEXT);
  assert.deepEqual(event.actors, [{ actor: 'fixture-actor-one', role: 'Leader' }]);

  const ok = validateBundle({ schema: 1, records: [event] }, topology, all);
  assert.deepEqual(ok.errors, [], JSON.stringify(ok.errors));

  // A role left blank reports at the row, not at the record.
  const blank = buildRecord('event', { ...eventValues, actors: [{ actor: 'fixture-actor-one', role: '' }] }, CONTEXT);
  const bad = validateBundle({ schema: 1, records: [blank] }, topology, all);
  assert.equal(bad.errors[0].path, '/actors/0/role');
});

// A narrative is the one kind whose repeatable rows carry prose rather than a
// word, and the one whose window is two years or none.
test('the form builds a narrative out of rows, and a half window is no window', async () => {
  const topology = await topologyOf();
  const all = await schemas();
  const values = {
    ...emptyValues('narrative'),
    id: 'fixture-narrative-form',
    title: 'A narrative built by the form',
    summary: 'A synthetic account added by the form in a test. It claims nothing about the world.',
    citations: [{ source: 'fixture-source-1', locator: null }],
    steps: [
      { ref: 'fixture-event-a', text: 'The first step of a walk, written at length enough to be an argument.' },
      { ref: 'fixture-event-a--fixture-event-b--caused', text: 'The second step, which follows the first through a link of the atlas.' },
      { ref: '', text: 'dropped: no record chosen' },
    ],
  };
  const record = buildRecord('narrative', values, CONTEXT);
  assert.equal(record.steps.length, 2);
  assert.equal(record.steps[1].ref, 'fixture-event-a--fixture-event-b--caused');
  assert.equal(record.window, undefined, 'both years blank: no window at all');
  assert.deepEqual(createValidator(all).validate('v1/narrative.json', record), []);
  const ok = validateBundle({ schema: 1, records: [record] }, topology, all);
  assert.deepEqual(ok.errors, [], JSON.stringify(ok.errors));

  const windowed = buildRecord('narrative', { ...values, windowFrom: '1200', windowTo: '1260' }, CONTEXT);
  assert.deepEqual(windowed.window, { from: 1200, to: 1260 });

  // A step with a record and no text reports at the row, not at the record.
  const thin = buildRecord('narrative', {
    ...values,
    steps: [values.steps[0], { ref: 'fixture-event-b', text: '' }],
  }, CONTEXT);
  const bad = validateBundle({ schema: 1, records: [thin] }, topology, all);
  assert.deepEqual(bad.errors.map((e) => e.path), ['/steps/1/text']);
});

// --- reading a record back into the form -----------------------------------
// The dashboard of M13 opens records that already exist. valuesFromRecord and
// applyValues have to compose to the identity or a review that changed one
// summary would rewrite half the file: this asserts it on the fixtures and on
// every record in data/, bytes included.

test('valuesFromRecord and applyValues round-trip the fixture records', async () => {
  const { records } = await fixtures();
  for (const record of records) {
    if (!Object.hasOwn(FIELDS, record.kind)) continue;
    const back = applyValues(record.kind, record, valuesFromRecord(record.kind, record));
    assert.deepEqual(back, record, `${record.kind} ${record.id}`);
  }
});

test('an unedited save of a record in data/ is byte identical', async () => {
  const { entries, problems } = await readRecords(path.join(ROOT, 'data'));
  assert.deepEqual(problems, []);
  let seen = 0;
  for (const { kind, file, record } of entries) {
    if (!Object.hasOwn(FIELDS, kind)) continue;
    const text = await readFile(path.join(ROOT, 'data', file), 'utf8');
    const back = applyValues(kind, record, valuesFromRecord(kind, record));
    assert.equal(`${JSON.stringify(back, null, 2)}\n`, text, `data/${file}`);
    seen += 1;
  }
  assert.ok(seen > 0, 'no records read from data/');
});

test('an edit replaces the field and leaves the envelope alone', async () => {
  const { byId } = await fixtures();
  const record = byId['fixture-event-a'];
  const values = valuesFromRecord('event', record);
  values.summary = 'A different synthetic summary, written in a test.';
  const back = applyValues('event', record, values);
  assert.equal(back.summary, values.summary);
  assert.equal(back.title, record.title);
  assert.deepEqual(back.authors, record.authors);
  assert.equal(back.created, record.created);
  assert.equal(back.revised, record.revised);
  assert.deepEqual(back.aliases, record.aliases);
  assert.equal(back.supersededBy, record.supersededBy);
  // The id is immutable once merged: everything that points here points at it.
  const renamed = applyValues('event', record, { ...values, id: 'fixture-event-renamed' });
  assert.equal(renamed.id, record.id);
});

// The identity fields are added here before any record carries them, so that
// the day the import writes one, a save through the dashboard or the form
// does not quietly drop it (docs/review-2026-09-04-plan.md, finding 5).
test('a record carrying every identity field round-trips byte identical', async () => {
  const { byId } = await fixtures();
  for (const kind of ['event', 'actor', 'place']) {
    const base = Object.values(byId).find((r) => r.kind === kind);
    assert.ok(base, `a fixture ${kind}`);
    const record = {
      ...base,
      wikidata: 'Q11',
      wikipedia: { en: `Fixture article for ${base.id}`, 'pt-br': 'Artigo de fixture' },
      sitelinks: 3,
      review: {
        flags: ['date'],
        note: 'a synthetic note',
        citations: Object.fromEntries((base.sources ?? []).map((c) => [c.source, { verified: { by: 'A Reviewer', on: '2026-09-04' } }])),
      },
    };
    const back = applyValues(kind, record, valuesFromRecord(kind, record));
    assert.deepEqual(back, record, kind);
    assert.equal(JSON.stringify(back, null, 2), JSON.stringify(record, null, 2), `${kind}, byte for byte`);
  }
});

test('the wikidata field takes the item out of a pasted URL, and guesses nothing', () => {
  assert.equal(wikidataFrom('https://www.wikidata.org/wiki/Q186496'), 'Q186496');
  assert.equal(wikidataFrom('http://wikidata.org/entity/Q42'), 'Q42');
  assert.equal(wikidataFrom('https://www.wikidata.org/wiki/Special:EntityPage/Q42'), 'Q42');
  assert.equal(wikidataFrom('  q42  '), 'Q42');
  assert.equal(wikidataFrom('Q42'), 'Q42');
  assert.equal(wikidataFrom(''), '');
  assert.equal(wikidataFrom(null), '');
  // A Wikipedia article URL carries a title and no item: it comes back as
  // typed, and the schema reports it, rather than a Q-number being invented.
  assert.equal(wikidataFrom('https://en.wikipedia.org/wiki/Lisbon'), 'https://en.wikipedia.org/wiki/Lisbon');
  assert.equal(wikidataFrom('https://evil.example.com/wiki/Q42'), 'https://evil.example.com/wiki/Q42');

  const record = buildRecord('event', { ...eventValues, wikidata: 'https://www.wikidata.org/wiki/Q7' }, CONTEXT);
  assert.equal(record.wikidata, 'Q7');
  // A blank field writes no key at all: a record with no identity looks
  // exactly as it did before these fields existed.
  assert.equal(Object.hasOwn(buildRecord('event', eventValues, CONTEXT), 'wikidata'), false);
});

// What the draft asks to have looked at is the envelope's, not the editor's:
// correcting a summary does not answer the question the flag asks, and only
// Sign takes it off (src/review/sign.js).
test('an edit keeps the review block a draft carries', async () => {
  const { byId } = await fixtures();
  const record = { ...byId['fixture-event-a'], review: { flags: ['date'], note: 'the day is a guess' } };
  const back = applyValues('event', record, { ...valuesFromRecord('event', record), summary: 'Edited in a test.' });
  assert.deepEqual(back.review, record.review);
});

test('the full entry is a field on the three kinds that have a page, and an empty one writes no key', async () => {
  for (const kind of ['event', 'actor', 'place']) {
    assert.ok(FIELDS[kind].some((f) => f.key === 'body' && f.input === 'textarea'), kind);
  }
  for (const kind of ['edge', 'relation', 'narrative', 'source']) {
    assert.equal(FIELDS[kind].some((f) => f.key === 'body'), false, kind);
  }
  const values = { ...emptyValues('place'), id: 'fixture-place-new', names: 'Fixture place NEW', lon: '1', lat: '2' };
  assert.equal(Object.hasOwn(buildRecord('place', values, CONTEXT), 'body'), false);
  assert.equal(Object.hasOwn(buildRecord('place', { ...values, body: '   ' }, CONTEXT), 'body'), false);
  const written = buildRecord('place', { ...values, body: '## A heading\n\nAnd a paragraph.' }, CONTEXT);
  assert.equal(written.body, '## A heading\n\nAnd a paragraph.');
  // And back out again, unchanged.
  assert.equal(valuesFromRecord('place', written).body, written.body);
  assert.equal(valuesFromRecord('place', buildRecord('place', values, CONTEXT)).body, '');
});

test('a step moves up and down the list, and the ends have nowhere to go', () => {
  const steps = [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }];
  const ids = (list) => list.map((s) => s.ref).join('');

  assert.equal(ids(moveItem(steps, 1, -1)), 'bac');
  assert.equal(ids(moveItem(steps, 1, 1)), 'acb');
  assert.equal(ids(moveItem(steps, 0, 1)), 'bac');
  assert.equal(ids(moveItem(steps, 2, -1)), 'acb');
  // The list it was given is not touched: the caller decides when to write.
  assert.equal(ids(steps), 'abc');

  // Off either end, and off the list altogether: the items come back in the
  // order they were in, so no caller has to guard the ends.
  assert.equal(ids(moveItem(steps, 0, -1)), 'abc');
  assert.equal(ids(moveItem(steps, 2, 1)), 'abc');
  assert.equal(ids(moveItem(steps, 7, -1)), 'abc');
  assert.equal(ids(moveItem(steps, -1, 1)), 'abc');
  assert.deepEqual(moveItem(undefined, 0, 1), []);
  // A move of more than one place is the same operation.
  assert.equal(ids(moveItem(steps, 0, 2)), 'bca');

  assert.equal(canMove(steps, 0, -1), false, 'the first has nothing above it');
  assert.equal(canMove(steps, 0, 1), true);
  assert.equal(canMove(steps, 2, 1), false, 'the last has nothing below it');
  assert.equal(canMove(steps, 2, -1), true);
  assert.equal(canMove([{ ref: 'only' }], 0, 1), false, 'a list of one moves nowhere');
  assert.equal(canMove(steps, 0, 0), false);
  assert.equal(canMove([], 0, 1), false);
});

test('moving a step is what the narrative says, in the order the rows are in', async () => {
  const { byId } = await fixtures();
  const narrative = byId['fixture-narrative-one'];
  const values = valuesFromRecord('narrative', narrative);
  assert.ok(values.steps.length >= 2, 'the fixture narrative has steps to move');

  const before = values.steps.map((s) => s.ref);
  values.steps.splice(0, values.steps.length, ...moveItem(values.steps, 0, 1));
  const moved = buildRecord('narrative', values, CONTEXT);
  assert.deepEqual(moved.steps.map((s) => s.ref), [before[1], before[0], ...before.slice(2)]);
  // The texts travel with the refs they belong to; a move is a reordering and
  // never a rewrite.
  assert.deepEqual(
    moved.steps.map((s) => s.text),
    [narrative.steps[1].text, narrative.steps[0].text, ...narrative.steps.slice(2).map((s) => s.text)],
  );

  // And back where it was: byte for byte the record on disk.
  values.steps.splice(0, values.steps.length, ...moveItem(values.steps, 1, -1));
  assert.deepEqual(applyValues('narrative', narrative, values), narrative);
});

test('a source names the work it is inside, and no container is written when it is not', async () => {
  // The five fields the form and the review editor both get, since both are
  // built from FIELDS.
  const keys = FIELDS.source.map((f) => f.key);
  for (const key of ['containerTitle', 'containerKind', 'volume', 'issue', 'pages']) {
    assert.ok(keys.includes(key), key);
  }
  assert.deepEqual(
    FIELDS.source.find((f) => f.key === 'containerKind').options,
    ['', 'journal', 'edited-volume', 'series', 'website'],
  );

  const base = { ...emptyValues('source'), id: 'fixture-source-new', type: 'article', creators: 'A. Author', title: 'A paper' };
  // Nothing named: no key at all, so a work that stands alone looks exactly
  // as it did before the field existed.
  assert.equal(Object.hasOwn(buildRecord('source', base, CONTEXT), 'container'), false);
  assert.equal(Object.hasOwn(buildRecord('source', { ...base, containerTitle: '  ' }, CONTEXT), 'container'), false);

  const article = buildRecord('source', {
    ...base, containerTitle: 'Journal of Portuguese History', containerKind: 'journal',
    volume: '12', issue: '3', pages: '45-67',
  }, CONTEXT);
  assert.deepEqual(article.container, {
    title: 'Journal of Portuguese History', kind: 'journal', volume: '12', issue: '3', pages: '45-67',
  });
  // The three optional parts are absent rather than null when nobody typed
  // them, so a record carries only what it says.
  const chapter = buildRecord('source', {
    ...base, type: 'chapter', containerTitle: 'The Cambridge History of Portugal', containerKind: 'edited-volume',
  }, CONTEXT);
  assert.deepEqual(chapter.container, { title: 'The Cambridge History of Portugal', kind: 'edited-volume' });

  // A named container with no kind is written as it stands, so the schema
  // reports it at /container/kind and the form puts the message on the field
  // rather than this guessing which of the four it is.
  const guessed = buildRecord('source', { ...base, containerTitle: 'Somewhere' }, CONTEXT);
  assert.equal(guessed.container.kind, '');
  const v = createValidator(await schemas());
  assert.deepEqual(v.validate('v1/source.json', article), []);
  assert.deepEqual(v.validate('v1/source.json', chapter), []);
  const problems = v.validate('v1/source.json', guessed);
  assert.ok(problems.some((p) => p.path.startsWith('/container')), JSON.stringify(problems));

  // And out through the form's fields again, unchanged.
  assert.deepEqual(valuesFromRecord('source', article), { ...base, id: article.id, ...{
    containerTitle: 'Journal of Portuguese History', containerKind: 'journal', volume: '12', issue: '3', pages: '45-67',
  } });
  assert.deepEqual(applyValues('source', article, valuesFromRecord('source', article)), article);
});

test('an entry survives a save through the dashboard, and an absent one stays absent', async () => {
  const { byId } = await fixtures();
  const withEntry = byId['fixture-event-a'];
  assert.equal(typeof withEntry.body, 'string');
  assert.deepEqual(applyValues('event', withEntry, valuesFromRecord('event', withEntry)), withEntry);
  const without = byId['fixture-event-b'];
  assert.equal(Object.hasOwn(applyValues('event', without, valuesFromRecord('event', without)), 'body'), false);
  // An explicit null is what tools/new-record.mjs may write; a save keeps it
  // rather than churning it into an absent key.
  const explicit = { ...without, body: null };
  assert.equal(applyValues('event', explicit, valuesFromRecord('event', explicit)).body, null);
});

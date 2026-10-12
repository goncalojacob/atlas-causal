// M90 §1 — the queue and the log: the shape, and the rules a shape cannot
// make.
//
// The queue is what the planner decides and the writers apply, so every rule
// that can be checked here is a rule a writer on a smaller model does not have
// to know. The malformed shapes below are the brief's own list, one assertion
// each; `checkQueue` holds the rest — the id that is not unique, the lane that
// is not a lane, the writer that does not take it, the item with no edge, the
// edge that is not the item's own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createValidator } from '../src/validate/schema.js';
import { WIKIPEDIA_SOURCES as RULES_WIKIPEDIA_SOURCES } from '../src/validate/rules.js';
import {
  QUEUE_KIND, LOG_KIND, QUEUE_SCHEMA, LOG_SCHEMA,
  WRITERS, WRITER_LANES, writerFor, REFUSALS, STATUSES, EDGE_TYPES,
  WIKIPEDIA_SOURCES, locatorFor, subjectOf, isImport,
  checkQueue, checkQueueLog, queueState, appliedIds, itemsFor,
  emptyQueue, emptyLog, ITEM_ID,
} from '../tools/queue/queue.mjs';
import { IMPORT_SCHEMAS } from '../tools/validate.mjs';
import { TOOL_SIDE } from '../src/validate/schemas.js';
import { schemas } from './helpers.mjs';

const QUOTE = 'The Tunisian campaign was a series of battles that took place in Tunisia and ended with an Allied victory.';
const EXPLANATION = `The article names the campaign as what the landings made possible: "${QUOTE}" — the edge reads that sentence and nothing more.`;

// An `over` of `{ qid: undefined }` means "without a qid": the key is dropped
// rather than set to undefined, because a file read off disk cannot carry an
// undefined and a test that validates one is not testing the shape on disk.
const without = (object) => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined));

const edge = (over = {}) => without({
  from: 'Q1234567',
  to: 'western-desert-campaign',
  type: 'reacted-to',
  confidence: 'probable',
  article: 'Tunisian campaign',
  revision: 1370437482,
  quote: QUOTE,
  explanation: EXPLANATION,
  ...over,
});

const item = (over = {}) => without({
  id: '2026-10-13-africa-003',
  planned: '2026-10-13T03:12Z',
  lane: 'africa',
  writer: 'A',
  qid: 'Q1234567',
  title: 'Tunisian campaign',
  parents: ['north-african-campaign'],
  edges: [edge()],
  why: 'Africa trails, and the item is a P361 child of a held umbrella.',
  ...over,
});

const queue = (items) => ({ ...emptyQueue(), items });

const REGIONS = [
  { id: 'europe', label: 'Europe', order: 1 },
  { id: 'africa', label: 'Africa', order: 2 },
  { id: 'asia', label: 'Asia', order: 3 },
  { id: 'americas', label: 'Americas', order: 4 },
  { id: 'oceania', label: 'Oceania', order: 5 },
];

let validator = null;
const validate = async (schema, value) => {
  if (!validator) validator = createValidator(await schemas());
  return validator.validate(schema, value);
};

test('the two schemas are on disk, listed as tool-side, and compile', async () => {
  const files = await schemas();
  assert.ok(Object.hasOwn(files, QUEUE_SCHEMA), 'the queue schema is read by readSchemaFiles');
  assert.ok(Object.hasOwn(files, LOG_SCHEMA));
  // The browser never fetches either: a queue is not a record and
  // data/imports/ is not in the deploy artifact at all.
  assert.ok(TOOL_SIDE.includes(QUEUE_SCHEMA));
  assert.ok(TOOL_SIDE.includes(LOG_SCHEMA));
  assert.deepEqual(createValidator(files).schemaErrors, []);
  // And tools/validate.mjs holds the files on disk to them, by kind: a kind it
  // does not know is an error and not a file nobody checks.
  assert.equal(IMPORT_SCHEMAS[QUEUE_KIND], QUEUE_SCHEMA);
  assert.equal(IMPORT_SCHEMAS[LOG_KIND], LOG_SCHEMA);
});

test('a well-formed queue validates', async () => {
  assert.deepEqual(await validate(QUEUE_SCHEMA, queue([item()])), []);
  assert.deepEqual(checkQueue('imports/queue.json', queue([item()]), { regions: REGIONS }), []);
  // An empty queue is a day with nothing to do and not a malformed file.
  assert.deepEqual(await validate(QUEUE_SCHEMA, emptyQueue()), []);
});

test('the schema rejects each malformed shape the brief names', async () => {
  const bad = async (over, what) => {
    const errors = await validate(QUEUE_SCHEMA, queue([item(over)]));
    assert.ok(errors.length > 0, `${what} should not validate`);
    return errors;
  };
  // `id` of the form <date>-<lane>-<nnn>.
  await bad({ id: 'africa-003' }, 'an id with no date');
  await bad({ id: '2026-10-13-africa-3' }, 'an id whose serial is not three digits');
  await bad({ id: '2026-10-13-Africa-003' }, 'an id with a capital in the lane');
  // `lane` a slug (membership is data/regions.json's, below).
  await bad({ lane: 'Africa' }, 'a lane that is not a slug');
  // `writer` one of the two.
  await bad({ writer: 'C' }, 'a writer nobody fires');
  await bad({ writer: 'a' }, 'a writer in the wrong case');
  // `qid` of the source's own shape.
  await bad({ qid: '1234567' }, 'a qid with no Q');
  await bad({ qid: 'Q0' }, 'a qid of zero');
  // `parents` a list of record ids.
  await bad({ parents: ['North African Campaign'] }, 'a parent that is not a record id');
  await bad({ parents: 'north-african-campaign' }, 'a parent list that is not a list');
  // `why` at least 20 characters.
  await bad({ why: 'Africa trails.' }, 'a why of fourteen characters');
  // The edge's own fields.
  await bad({ edges: [edge({ type: 'led-to' })] }, 'a sixth edge type');
  await bad({ edges: [edge({ confidence: 'disputed' })] }, 'a disputed edge from a queue');
  await bad({ edges: [edge({ revision: '1370437482' })] }, 'a revision that is a string');
  await bad({ edges: [edge({ revision: 1370437482.5 })] }, 'a revision that is not an integer');
  await bad({ edges: [edge({ quote: 'The campaign ended in victory.' })] }, 'a quote of thirty characters');
  await bad({ edges: [edge({ explanation: 'It follows from the article.' })] }, 'an explanation of twenty-eight characters');
  await bad({ edges: [edge({ from: 'Western Desert Campaign' })] }, 'an end that is neither a record id nor a qid');
  await bad({ edges: [{ ...edge(), extra: 1 }] }, 'an edge with a field the schema does not declare');
  await bad({ edges: [without({ ...edge(), quote: undefined })] }, 'an edge with no quote');
  // The item envelope.
  await bad({ planned: '2026-10-13 03:12' }, 'a planned time that is not an instant');
  await bad({ planned: '2026-10-13T03:12+01:00' }, 'a planned time that is not UTC');
  await bad({ title: '' }, 'an empty title');
  await bad({ note: 'something' }, 'an item field the schema does not declare');
  // And the file around them.
  for (const file of [{ ...emptyQueue(), kind: 'import-seeds' }, { kind: QUEUE_KIND, items: [] }, { schema: 2, kind: QUEUE_KIND, items: [] }, { ...emptyQueue(), items: {} }]) {
    assert.ok((await validate(QUEUE_SCHEMA, file)).length > 0, `${JSON.stringify(file)} should not validate`);
  }
});

test('checkQueue says what the shape cannot', () => {
  const check = (items) => checkQueue('imports/queue.json', queue(items), { regions: REGIONS })
    .map((p) => `${p.path} ${p.message}`);
  // An id twice: a log holds ids, so two items of one id can never both be done.
  assert.match(check([item(), item()]).join('\n'), /is the id of another item/);
  // The id names its own lane.
  assert.match(check([item({ lane: 'asia', id: '2026-10-13-africa-003', writer: 'A' })]).join('\n'), /names the lane "africa"/);
  // A lane outside data/regions.json.
  assert.match(check([item({ lane: 'atlantis', id: '2026-10-13-atlantis-003' })]).join('\n'), /not a lane in data\/regions.json/);
  // A lane no writer takes.
  assert.match(check([item({ lane: 'oceania', id: '2026-10-13-oceania-003', writer: 'A' })]).join('\n'), /no writer takes the lane "oceania"/);
  // The wrong writer for the lane.
  assert.match(check([item({ writer: 'B' })]).join('\n'), /is writer A's, not B's/);
  // The bar: an item with no edge does not earn its place.
  assert.match(check([item({ edges: [] })]).join('\n'), /does not earn its place/);
  // An edge between two records already here says nothing about this item.
  assert.match(check([item({ edges: [edge({ from: 'operation-torch' })] })]).join('\n'), /neither end is the item's own qid/);
  assert.match(check([item({ edges: [edge({ from: 'Q1234567', to: 'Q1234567' })] })]).join('\n'), /from a record to itself/);
  // The quote has to be in the explanation, because the explanation is what a
  // reader sees (rules card 9).
  assert.match(check([item({ edges: [edge({ explanation: 'The edge follows from the article and is the honest reading of it, at that revision.' })] })]).join('\n'),
    /does not carry the quote/);
  // Neither a qid nor an existing record, or both.
  assert.match(check([item({ qid: undefined })]).join('\n'), /names neither a qid/);
  assert.match(check([item({ existing: 'tunisian-campaign' })]).join('\n'), /never both/);
  assert.match(check([item({ parents: ['north-african-campaign', 'north-african-campaign'] })]).join('\n'), /is listed twice/);
  // With no regions file the lane is not checked against anything, which is
  // the silence the rest of the validator keeps about an absent vocabulary.
  assert.deepEqual(
    checkQueue('imports/queue.json', queue([item({ lane: 'atlantis', id: '2026-10-13-atlantis-003' })]), { regions: null })
      .filter((p) => /not a lane/.test(p.message)),
    [],
  );
});

test('an item that changes a record it already holds needs no qid and may need no edge', async () => {
  const filing = item({
    qid: undefined,
    existing: 'tunisian-campaign',
    edges: [],
    parents: ['north-african-campaign'],
  });
  assert.deepEqual(await validate(QUEUE_SCHEMA, queue([filing])), []);
  assert.deepEqual(checkQueue('imports/queue.json', queue([filing]), { regions: REGIONS }), []);
  assert.equal(subjectOf(filing), 'tunisian-campaign');
  assert.equal(isImport(filing), false);
  // It still asks for something: neither a parent nor an edge is nothing.
  assert.match(
    checkQueue('imports/queue.json', queue([item({ qid: undefined, existing: 'tunisian-campaign', edges: [], parents: [] })]), { regions: REGIONS })
      .map((p) => p.message).join('\n'),
    /asks for nothing/,
  );
  assert.match(
    checkQueue('imports/queue.json', queue([item({ qid: undefined, existing: 'tunisian-campaign', edges: [], parents: ['tunisian-campaign'] })]), { regions: REGIONS })
      .map((p) => p.message).join('\n'),
    /cannot be part of itself/,
  );
});

test('the writer mapping is the partition of A10 and A11(b)', () => {
  assert.deepEqual(WRITERS, ['A', 'B']);
  assert.equal(writerFor('africa'), 'A');
  assert.equal(writerFor('asia'), 'A');
  assert.equal(writerFor('europe'), 'A');
  assert.equal(writerFor('americas'), 'B');
  // Oceania is in data/regions.json and in neither writer's list: no routine
  // takes it, and the queue says so rather than queueing for nobody.
  assert.equal(writerFor('oceania'), null);
  assert.equal(writerFor('atlantis'), null);
  // No lane belongs to both, and every lane either writer claims is a lane of
  // data/regions.json — derived from the fixture list, never pinned.
  const lanes = new Set(REGIONS.map((r) => r.id));
  const claimed = [...WRITER_LANES.A, ...WRITER_LANES.B];
  assert.equal(new Set(claimed).size, claimed.length, 'no lane is claimed twice');
  for (const lane of claimed) assert.ok(lanes.has(lane), `${lane} is a lane of data/regions.json`);
});

test('the five types and the two Wikipedia sources are the ones the rest of the atlas knows', () => {
  // The edge schema's own enum, read off the file rather than retyped.
  assert.deepEqual([...EDGE_TYPES].sort(), ['caused', 'enabled', 'inspired', 'precondition-of', 'reacted-to']);
  assert.deepEqual([...WIKIPEDIA_SOURCES], [...RULES_WIKIPEDIA_SOURCES]);
  assert.equal(locatorFor({ article: 'Tunisian campaign', revision: 1370437482 }),
    '"Tunisian campaign", revision 1370437482');
});

// --- the log ---------------------------------------------------------------

const logEntry = (over = {}) => without({
  id: '2026-10-13-africa-003',
  writer: 'A',
  fired: '2026-10-13T04:20Z',
  status: 'written',
  written: { event: 'tunisian-campaign', edges: ['tunisian-campaign--western-desert-campaign--reacted-to'], place: 'tunisia' },
  refusals: [],
  ...over,
});

const log = (entries) => ({ ...emptyLog(), entries });

test('a well-formed log validates, and the schema rejects what a log cannot say', async () => {
  assert.deepEqual(await validate(LOG_SCHEMA, log([logEntry()])), []);
  assert.deepEqual(await validate(LOG_SCHEMA, emptyLog()), []);
  const bad = async (over, what) => {
    assert.ok((await validate(LOG_SCHEMA, log([logEntry(over)]))).length > 0, `${what} should not validate`);
  };
  await bad({ status: 'done' }, 'a fifth status');
  await bad({ writer: 'C' }, 'a writer nobody fires');
  await bad({ id: 'africa-003' }, 'an id that is not a queue item id');
  await bad({ fired: '2026-10-13' }, 'a fire time that is not an instant');
  await bad({ written: { event: 'tunisian-campaign' } }, 'a written block with no edge list');
  await bad({ written: { event: 'tunisian-campaign', edges: ['tunisian-campaign--western-desert-campaign--led-to'] } }, 'an edge id of a sixth type');
  await bad({ refusals: [{ edge: 0, reason: 'because', detail: 'no' }] }, 'a refusal code outside the list');
  await bad({ refusals: [{ edge: 0, reason: 'chronology' }] }, 'a refusal with no detail');
  await bad({ refusals: [{ edge: -1, reason: 'chronology', detail: 'x' }] }, 'a refusal naming edge −1');
  await bad({ extra: 1 }, 'an entry field the schema does not declare');
  assert.ok((await validate(LOG_SCHEMA, { ...emptyLog(), kind: QUEUE_KIND })).length > 0, 'a log that says it is a queue');
});

test('checkQueueLog holds the status to what reached disk', () => {
  const check = (entries) => checkQueueLog('imports/queue-log.json', log(entries)).map((p) => p.message).join('\n');
  assert.equal(check([logEntry()]), '');
  assert.match(check([logEntry(), logEntry()]), /was already answered/);
  assert.match(check([logEntry({ refusals: [{ edge: 1, reason: 'chronology', detail: 'no cause' }] })]),
    /partial or refused, never written/);
  assert.match(check([logEntry({ status: 'partial' })]), /partial says some of it was refused/);
  assert.match(check([logEntry({ status: 'refused' })]), /a refused item writes no event/);
  assert.equal(check([logEntry({ status: 'skipped', written: { event: null, edges: [], place: null } })]), '');
  assert.match(check([logEntry({ status: 'refused', written: { event: null, edges: [], place: null } })]),
    /a refused item says why/);
  assert.match(check([logEntry({ written: { event: null, edges: [], place: null } })]),
    /nothing was written, so the status is not written/);
});

test('the queue state is derived from the queue and the logs and nothing else', () => {
  const items = [
    item(),
    item({ id: '2026-10-13-africa-004', edges: [edge({ to: 'operation-torch' })] }),
    item({ id: '2026-10-13-americas-001', lane: 'americas', writer: 'B' }),
  ];
  const logs = [
    log([logEntry({ status: 'partial', refusals: [{ edge: 1, reason: 'chronology', detail: 'no cause stated' }] })]),
    log([logEntry({ id: '2026-10-13-americas-001', writer: 'B', status: 'skipped', written: { event: null, edges: [], place: null } })]),
  ];
  assert.deepEqual(appliedIds(logs), new Set(['2026-10-13-africa-003', '2026-10-13-americas-001']));
  const state = queueState(queue(items), logs);
  // Derived: one of A's two is answered, and B's only item is.
  assert.equal(state.queued.A, items.filter((i) => i.writer === 'A').length - 1);
  assert.equal(state.queued.B, 0);
  assert.equal(state.byWriter.A.partial, 1);
  assert.equal(state.byWriter.B.skipped, 1);
  assert.deepEqual(state.refusals, { chronology: 1 });
  assert.equal(state.applied, 2);
  // Every status and every refusal code has a counter, so a code that appears
  // for the first time is counted and not dropped.
  for (const writer of WRITERS) assert.deepEqual(Object.keys(state.byWriter[writer]).sort(), [...STATUSES].sort());
  assert.deepEqual([...REFUSALS].sort(), ['already-held', 'arrow-of-time', 'chronology', 'confidence',
    'endpoint-missing', 'parent', 'parent-to-child', 'quote-not-found', 'type']);
});

test('a writer takes its own items, in order, minus what is answered or held elsewhere', () => {
  const items = [
    item(),
    item({ id: '2026-10-13-americas-001', lane: 'americas', writer: 'B' }),
    item({ id: '2026-10-13-asia-001', lane: 'asia', qid: 'Q7654321', edges: [edge({ from: 'Q7654321' })] }),
    item({ id: '2026-10-13-europe-001', lane: 'europe', qid: 'Q9999999', edges: [edge({ from: 'Q9999999' })] }),
  ];
  const mine = itemsFor(queue(items), 'A');
  assert.deepEqual(mine.map((i) => i.id), items.filter((i) => i.writer === 'A').map((i) => i.id));
  // A log answers the first.
  assert.deepEqual(
    itemsFor(queue(items), 'A', { logs: [log([logEntry()])] }).map((i) => i.id),
    mine.slice(1).map((i) => i.id),
  );
  // The other branch holds the second, by its qid.
  assert.deepEqual(
    itemsFor(queue(items), 'A', { held: ['Q7654321'] }).map((i) => i.id),
    mine.filter((i) => i.qid !== 'Q7654321').map((i) => i.id),
  );
  // --max is a ceiling and the order is the queue's own.
  assert.deepEqual(itemsFor(queue(items), 'A', { max: 2 }).map((i) => i.id), mine.slice(0, 2).map((i) => i.id));
  assert.deepEqual(itemsFor(queue(items), 'B').map((i) => i.id), ['2026-10-13-americas-001']);
  assert.deepEqual(itemsFor(emptyQueue(), 'A'), []);
  assert.deepEqual(ITEM_ID.exec('2026-10-13-africa-003').slice(1), ['2026-10-13', 'africa', '003']);
});

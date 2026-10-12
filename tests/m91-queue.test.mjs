// M91 — the queue and the log after the owner's 13 October change: an event
// of significance is imported whether or not an edge can be written today.
//
// The owner, 13 October 2026: "Just add all events that are relevant and
// connect them when you can." The bar of rules card 7 — an item earns its
// place by its own edge — is withdrawn at the queue: an item may carry no
// edge, and an edge, when it is there, is held to everything it was held to
// before. The planner says why an item ranks where it does in `rank`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createValidator } from '../src/validate/schema.js';
import {
  QUEUE_SCHEMA, LOG_SCHEMA, checkQueue, checkQueueLog, emptyQueue, emptyLog,
} from '../tools/queue/queue.mjs';
import { schemas } from './helpers.mjs';

const QUOTE = 'The Tunisian campaign was a series of battles that took place in Tunisia and ended with an Allied victory.';
const EXPLANATION = `The article names the campaign as what the landings made possible: "${QUOTE}" — the edge reads that sentence and nothing more.`;

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
  parents: [],
  edges: [],
  why: 'An event of significance since 1500 the atlas does not hold yet.',
  ...over,
});

const queue = (items) => ({ ...emptyQueue(), items });

const REGIONS = [
  { id: 'europe' }, { id: 'africa' }, { id: 'asia' }, { id: 'americas' }, { id: 'oceania' },
];

let validator = null;
const validate = async (schema, value) => {
  if (!validator) validator = createValidator(await schemas());
  return validator.validate(schema, value);
};

test('an import item with no edge is valid: the bar of rules card 7 is withdrawn at the queue', async () => {
  const bare = item();
  assert.deepEqual(await validate(QUEUE_SCHEMA, queue([bare])), []);
  assert.deepEqual(checkQueue('imports/queue.json', queue([bare]), { regions: REGIONS }), []);
  // No parents either: an event is imported before anybody knows where it
  // files, and is filed when somebody does.
  const noParents = without({ ...item(), parents: undefined });
  assert.deepEqual(await validate(QUEUE_SCHEMA, queue([noParents])), []);
  assert.deepEqual(checkQueue('imports/queue.json', queue([noParents]), { regions: REGIONS }), []);
});

test('an edge, when an item carries one, is held to everything it was held to before', async () => {
  const bad = async (over, what) => {
    assert.ok((await validate(QUEUE_SCHEMA, queue([item({ edges: [edge(over)] })]))).length > 0, `${what} should not validate`);
  };
  await bad({ quote: undefined }, 'an edge with no quote');
  await bad({ revision: undefined }, 'an edge with no revision');
  await bad({ type: undefined }, 'an edge with no type');
  await bad({ explanation: undefined }, 'an edge with no explanation');
  const check = (items) => checkQueue('imports/queue.json', queue(items), { regions: REGIONS }).map((p) => p.message).join('\n');
  // One end is still the item's own.
  assert.match(check([item({ edges: [edge({ from: 'operation-torch' })] })]), /neither end is the item's own qid/);
  // An `existing` item that asks for nothing still asks for nothing.
  assert.match(check([item({ qid: undefined, existing: 'tunisian-campaign', edges: [], parents: [] })]), /asks for nothing/);
});

test('rank is optional, a string of one to forty characters, and why stays required', async () => {
  for (const rank of ['vital-3', 'vital-4', 'vital-5', 'list', 'child-of:north-african-campaign']) {
    assert.deepEqual(await validate(QUEUE_SCHEMA, queue([item({ rank })])), [], rank);
  }
  assert.ok((await validate(QUEUE_SCHEMA, queue([item({ rank: '' })]))).length > 0, 'an empty rank');
  assert.ok((await validate(QUEUE_SCHEMA, queue([item({ rank: 'x'.repeat(41) })]))).length > 0, 'a rank of 41 characters');
  assert.deepEqual(await validate(QUEUE_SCHEMA, queue([item({ rank: 'x'.repeat(40) })])), [], 'a rank of 40 characters');
  assert.ok((await validate(QUEUE_SCHEMA, queue([item({ rank: 3 })]))).length > 0, 'a rank that is a number');
  assert.ok((await validate(QUEUE_SCHEMA, queue([item({ why: undefined })]))).length > 0, 'an item with no why');
});

const entry = (over = {}) => without({
  id: '2026-10-13-africa-003',
  writer: 'A',
  fired: '2026-10-13T04:20Z',
  status: 'written',
  written: { event: 'tunisian-campaign', edges: [], place: 'tunisia' },
  refusals: [],
  ...over,
});

test('a log entry written with no edge is well formed, with or without the refusals it met', async () => {
  const log = (entries) => ({ ...emptyLog(), entries });
  const check = (entries) => checkQueueLog('imports/queue-log.json', log(entries)).map((p) => p.message).join('\n');
  const bare = entry();
  const refused = entry({ refusals: [{ edge: 0, reason: 'chronology', detail: 'the sentence states an order and no cause' }] });
  assert.deepEqual(await validate(LOG_SCHEMA, log([bare])), []);
  assert.deepEqual(await validate(LOG_SCHEMA, log([refused])), []);
  assert.equal(check([bare]), '');
  assert.equal(check([refused]), '');
  // `partial` keeps its meaning: some edges written, some refused. An entry
  // that wrote edges and met a refusal is partial and never written.
  assert.match(check([entry({ written: { event: 'tunisian-campaign', edges: ['tunisian-campaign--western-desert-campaign--reacted-to'], place: null }, refusals: refused.refusals })]),
    /partial or refused, never written/);
});

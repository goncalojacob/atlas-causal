// M91 — the writer after the owner's 13 October change.
//
// "Right now the priority is to add most events of historical significance
// since around 1500, even if for now there is no parent or child for it."
// So an item is imported whether or not an edge stands, and edges are still
// written only where the article's sentence is verified. What did not change
// is everything that keeps a duplicate or a placeholder out: the skip by
// Wikidata id, now also by title; `summary-missing`; the network exit; the
// validator as a hard stop. And "held by the other branch" means held there
// and not here (change 6, writer A's fire of 13 October, 23:20Z).
//
// No network: the stub answers off disk, as in tests/m90-apply.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parentsOf } from '../src/parts.js';
import { main, EXIT } from '../tools/queue/apply.mjs';
import { emptyQueue } from '../tools/queue/queue.mjs';
import { ROOT, FIXTURE_DATA } from './helpers.mjs';

const STUB = path.join(ROOT, 'tests', 'fixtures', 'queue');
const QID = 'Q9200001';
const SIEGE = 'Q9200003';
const EVENT = 'fixture-campaign-z';
const PLACE = 'fixture-place-z';
const REVISION = 1370437482;
const SIEGE_REVISION = 1370437500;
const FORCED = "The garrison's surrender in 1986-1987 was forced by the campaign's second advance along the eastern road.";
const SIEGE_CHRONOLOGY = 'Following the Fixture event, 1900, the besiegers dug in and the town was quiet for a whole month.';
const because = (quote) => `The article says it in one sentence: "${quote}" — and the edge reads that sentence and nothing more.`;

const item = (over = {}) => ({
  id: '2026-10-13-africa-001',
  planned: '2026-10-13T03:12Z',
  lane: 'africa',
  writer: 'A',
  qid: QID,
  title: 'Fixture campaign Z',
  parents: [],
  edges: [],
  why: 'An event of significance since 1500 that the atlas does not hold yet.',
  ...over,
});

async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-m91-'));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  await mkdir(path.join(data, 'imports'), { recursive: true });
  for (const id of ['wikidata', 'wikipedia-en']) {
    await cp(path.join(ROOT, 'data', 'sources', `${id}.json`), path.join(data, 'sources', `${id}.json`));
  }
  await writeFile(path.join(data, 'imports', 'wikidata-seeds.json'), `${JSON.stringify({
    schema: 1, kind: 'import-seeds', source: 'wikidata', items: [], queries: [],
    classes: { Q9200009: { kind: 'event' }, Q9200010: { kind: 'place', precision: 'city' } },
    reconcile: false,
  }, null, 2)}\n`, 'utf8');
  return { dir, data, cache: path.join(dir, 'cache'), queue: path.join(dir, 'queue.json') };
}

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

async function fire(bed, items, over = []) {
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items }, null, 2)}\n`, 'utf8');
  const code = await main([
    '--queue', bed.queue, '--writer', 'A', '--data', bed.data,
    '--cache', bed.cache, '--fetcher', `stub:${STUB}`, ...over,
  ]);
  const log = path.join(bed.data, 'imports', 'queue-log.json');
  return { code, log: existsSync(log) ? await readJson(log) : null };
}

// A record of the fixture corpus copied under a new id and title, with no
// `wikidata` id: one of the 132 active events of the live corpus the skip by
// id cannot see.
async function plant(bed, id, over) {
  const record = await readJson(path.join(bed.data, 'events', 'fixture-event-deep-1969.json'));
  await writeFile(path.join(bed.data, 'events', `${id}.json`), `${JSON.stringify({ ...record, id, ...over }, null, 2)}\n`, 'utf8');
}

// --- change 2 --------------------------------------------------------------

test('an item with no edge is imported: written, with its record and its place, and no edge', async () => {
  const bed = await scratch();
  const edgesBefore = (await readdir(path.join(bed.data, 'edges'))).sort();
  const { code, log } = await fire(bed, [item({ parents: ['fixture-event-g'] })]);
  assert.equal(code, EXIT.ok);
  const [entry] = log.entries;
  assert.equal(entry.status, 'written');
  assert.equal(entry.written.event, EVENT);
  assert.equal(entry.written.place, PLACE);
  assert.deepEqual(entry.written.edges, []);
  assert.deepEqual(entry.refusals, []);
  const event = await readJson(path.join(bed.data, 'events', `${EVENT}.json`));
  assert.equal(event.wikidata, QID);
  assert.equal(event.place, PLACE);
  assert.deepEqual(parentsOf(event), ['fixture-event-g'], 'filed under the parent that holds its date');
  assert.ok(existsSync(path.join(bed.data, 'places', `${PLACE}.json`)));
  assert.deepEqual((await readdir(path.join(bed.data, 'edges'))).sort(), edgesBefore, 'no edge was written');
  // The log is one the schema and the log's own checks accept.
  assert.equal(await main(['--check', path.join(bed.data, 'imports', 'queue-log.json')]), EXIT.ok);
  await rm(bed.dir, { recursive: true, force: true });
});

test('an item every edge of which fails is still written, with the refusals logged', async () => {
  const bed = await scratch();
  const { code, log } = await fire(bed, [
    // Refused before the import: the sentence states an order and no cause.
    item({
      id: '2026-10-13-africa-002', qid: SIEGE, title: 'Fixture siege Z',
      edges: [{
        from: 'fixture-event-deep-1900', to: SIEGE, type: 'caused', confidence: 'probable',
        article: 'Fixture siege Z', revision: SIEGE_REVISION, quote: SIEGE_CHRONOLOGY, explanation: because(SIEGE_CHRONOLOGY),
      }],
    }),
    // Refused after the import, at the last fence: the cause starts after
    // its effect, which only the record's own dates can say.
    item({
      edges: [{
        from: QID, to: 'fixture-event-a', type: 'caused', confidence: 'probable',
        article: 'Fixture campaign Z', revision: REVISION, quote: FORCED, explanation: because(FORCED),
      }],
    }),
  ]);
  assert.equal(code, EXIT.ok);
  const [siege, campaign] = log.entries;
  for (const [entry, reason] of [[siege, 'chronology'], [campaign, 'arrow-of-time']]) {
    assert.equal(entry.status, 'written', entry.id);
    assert.ok(entry.written.event, `${entry.id} wrote its event`);
    assert.deepEqual(entry.written.edges, []);
    assert.deepEqual(entry.refusals.map((r) => [r.edge, r.reason]), [[0, reason]]);
    assert.ok(existsSync(path.join(bed.data, 'events', `${entry.written.event}.json`)), `${entry.written.event} is on disk`);
  }
  assert.equal(campaign.written.event, EVENT);
  // The two items share the fixture's place, which the first created; the
  // record that fell at the last fence keeps it all the same.
  assert.equal((await readJson(path.join(bed.data, 'events', `${EVENT}.json`))).place, PLACE);
  assert.ok(existsSync(path.join(bed.data, 'places', `${PLACE}.json`)), 'the place stays with the record');
  assert.equal(await main(['--check', path.join(bed.data, 'imports', 'queue-log.json')]), EXIT.ok);
  await rm(bed.dir, { recursive: true, force: true });
});

test('a lead that could not be read still rolls the record back, with no edge as with one', async () => {
  const bed = await scratch();
  const stub = path.join(bed.dir, 'stub');
  await cp(STUB, stub, { recursive: true });
  await rm(path.join(stub, 'summary', 'Fixture campaign Z.json'));
  const before = (await readdir(path.join(bed.data, 'events'))).sort();
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item()] }, null, 2)}\n`, 'utf8');
  assert.equal(await main(['--queue', bed.queue, '--writer', 'A', '--data', bed.data, '--cache', bed.cache, '--fetcher', `stub:${stub}`]), EXIT.ok);
  const [entry] = (await readJson(path.join(bed.data, 'imports', 'queue-log.json'))).entries;
  assert.equal(entry.status, 'refused');
  assert.deepEqual(entry.refusals.map((r) => r.reason), ['summary-missing']);
  assert.equal(entry.written.event, null);
  assert.deepEqual((await readdir(path.join(bed.data, 'events'))).sort(), before);
  await rm(bed.dir, { recursive: true, force: true });
});

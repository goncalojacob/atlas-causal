// M90 §2 — the writer's tool, end to end on the fixture corpus.
//
// The whole point of the milestone is that a writer decides nothing, so what
// has to be tested is every refusal: the quote that is not in the revision it
// names, the sentence that states an order and no cause, the sentence that
// states a cause and names a third event, the edge between an umbrella and its
// own child, the sixth type, the end that is not a record, the `consensus`
// that rests on Wikipedia alone, the umbrella that will not hold the date, the
// cause that starts after its effect, and the edge that is already here. And
// the four statuses: written, partial, refused, skipped.
//
// No network: `--fetcher stub:tests/fixtures/queue` answers off disk, so the
// tool is run as the routine runs it, through `main()`, including the index
// and the validator it finishes with.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DRAFT_AUTHOR } from '../src/review/queue.js';
import { parentsOf } from '../src/parts.js';
import {
  main, applyQueue, EXIT, NETWORK_REFUSED, REFUSE_FILE, RUN, EDGE_FLAGS,
  plainText, parseUrl, stubFetcher, articleText, edgeRecord, spanOf, parentVerdict,
  isNetworkRefusal, isMissingRevision, fireCitations,
} from '../tools/queue/apply.mjs';
import { report as cacheReport } from '../tools/cache-evidence.mjs';
import { HttpError, BudgetError } from '../tools/import/wikidata.mjs';
import {
  emptyQueue, verdictForEdge, writeVerdictFor, normaliseQuote, quoteFound, locatorFor,
} from '../tools/queue/queue.mjs';
import { ROOT, FIXTURE_DATA } from './helpers.mjs';

const STUB = path.join(ROOT, 'tests', 'fixtures', 'queue');
const QID = 'Q9200001';
const SIEGE = 'Q9200003';
const EVENT = 'fixture-campaign-z';
const PLACE = 'fixture-place-z';
const REVISION = 1370437482;
const SIEGE_REVISION = 1370437500;

// The four sentences the fixture article carries, by what each is for.
const CAUSED = 'The campaign was caused by the Fixture event, 1969, which had left the eastern road unheld for a year.';
// Straight quotes, a plain hyphen and no soft hyphen: what a planner types,
// against an article that carries the curly, the en dash and the soft hyphen.
const FORCED = "The garrison's surrender in 1986-1987 was forced by the campaign's second advance along the eastern road.";
const CHRONOLOGY = 'Following the Fixture event, 1900, the garrison withdrew and the roads were repaired at leisure.';
const THIRD = 'The second advance was enabled by the Fixture event, 1969 and by the Fixture event, 1900 together, which this article names in one breath.';
const SIEGE_CHRONOLOGY = 'Following the Fixture event, 1900, the besiegers dug in and the town was quiet for a whole month.';

const because = (quote) => `The article says it in one sentence: "${quote}" — and the edge reads that sentence and nothing more.`;

const edge = (over = {}) => ({
  from: 'fixture-event-deep-1969',
  to: QID,
  type: 'caused',
  confidence: 'probable',
  article: 'Fixture campaign Z',
  revision: REVISION,
  quote: CAUSED,
  explanation: because(CAUSED),
  ...over,
});

const item = (over = {}) => ({
  id: '2026-10-13-africa-001',
  planned: '2026-10-13T03:12Z',
  lane: 'africa',
  writer: 'A',
  qid: QID,
  title: 'Fixture campaign Z',
  parents: [],
  edges: [edge()],
  why: 'Africa trails, and the article carries a sentence that names a held event.',
  ...over,
});

// A scratch corpus: the fixture atlas, plus the two source records the import
// and the edges cite, plus a seeds file with the class table the fixtures are
// read through. The class table is the editorial decision that in a real run
// lives in data/imports/wikidata-seeds.json.
async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-m90-'));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  await mkdir(path.join(data, 'imports'), { recursive: true });
  for (const id of ['wikidata', 'wikipedia-en']) {
    await cp(path.join(ROOT, 'data', 'sources', `${id}.json`), path.join(data, 'sources', `${id}.json`));
  }
  await writeFile(path.join(data, 'imports', 'wikidata-seeds.json'), `${JSON.stringify({
    schema: 1,
    kind: 'import-seeds',
    source: 'wikidata',
    items: [],
    queries: [],
    classes: {
      Q9200009: { kind: 'event' },
      Q9200010: { kind: 'place', precision: 'city' },
    },
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

// --- the written case ------------------------------------------------------

test('an item whose edges verify is imported, filed, and written with its edges', async () => {
  const bed = await scratch();
  const { code, log } = await fire(bed, [item({
    // fixture-event-g runs from 1270 with no end, so it holds a 1986 start:
    // an umbrella this corpus has that the date can actually be inside.
    parents: ['fixture-event-g'],
    edges: [
      edge(),
      edge({ from: 'fixture-event-deep-1900', type: 'enabled', quote: FORCED, explanation: because(FORCED) }),
    ],
  })]);
  assert.equal(code, EXIT.ok);
  assert.equal(log.entries.length, 1);
  const [entry] = log.entries;
  assert.equal(entry.status, 'written');
  assert.deepEqual(entry.refusals, []);
  assert.equal(entry.written.event, EVENT);
  assert.equal(entry.written.place, PLACE);
  assert.deepEqual(entry.written.edges, [
    `fixture-event-deep-1969--${EVENT}--caused`,
    `fixture-event-deep-1900--${EVENT}--enabled`,
  ]);
  assert.equal(entry.writer, 'A');
  assert.match(entry.fired, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/);

  // The record the import wrote, with the queue's umbrella on it.
  const event = await readJson(path.join(bed.data, 'events', `${EVENT}.json`));
  assert.equal(event.wikidata, QID);
  assert.deepEqual(parentsOf(event), ['fixture-event-g']);
  assert.equal(event.place, PLACE);
  assert.equal(event.review.status, 'draft');
  // The place too, which the import created from the item's own P276.
  const place = await readJson(path.join(bed.data, 'places', `${PLACE}.json`));
  // The point is the item's own and the lane is derived from it at index
  // time, so the record carries no override — which is what the Wikidata
  // import has always written and what a later change to the polygons moves.
  assert.deepEqual(place.where, { lon: -30, lat: 30, precision: 'city', label: 'Fixture place Z' });
  assert.equal(place.region, null);
  assert.equal(place.regionNote, null);

  // The edges: the envelope of the curation fires', the locator in M72's form,
  // and the quote in the explanation where a reader meets it.
  const written = await readJson(path.join(bed.data, 'edges', `fixture-event-deep-1969--${EVENT}--caused.json`));
  assert.equal(written.kind, 'edge');
  assert.equal(written.status, 'active');
  assert.equal(written.confidence, 'probable');
  assert.equal(written.dispute, null);
  assert.deepEqual(written.authors, [{ name: DRAFT_AUTHOR, github: null }]);
  assert.deepEqual(written.origin, { tool: 'assistant', run: RUN('A') });
  assert.equal(written.review.status, 'draft');
  assert.deepEqual(written.review.flags, [...EDGE_FLAGS]);
  assert.deepEqual(written.sources, [{ source: 'wikipedia-en', locator: `"Fixture campaign Z", revision ${REVISION}` }]);
  assert.ok(written.explanation.includes(CAUSED));
  assert.equal(written.license, 'CC-BY-SA-4.0');
  // The keys are in the schema's own order, so a record this tool writes and
  // one the form writes read the same way in a diff.
  const edgeSchema = await readJson(path.join(ROOT, 'schema', 'v1', 'edge.json'));
  const order = Object.keys(edgeSchema.properties).filter((k) => k in written);
  assert.deepEqual(Object.keys(written), order);

  // The seeds file carries the item now, and the cursor has walked it.
  const seeds = await readJson(path.join(bed.data, 'imports', 'wikidata-seeds.json'));
  assert.deepEqual(seeds.items, [QID]);
  // The index was rebuilt and the validator ran clean inside the tool: a
  // non-zero exit above would have said otherwise, and the manifest is here.
  assert.ok(existsSync(path.join(bed.data, 'index', 'manifest.json')));
  await rm(bed.dir, { recursive: true, force: true });
});

// --- partial, and every refusal code --------------------------------------

test('an item part of whose edges fail is partial, and every refusal is named by code', async () => {
  const bed = await scratch();
  const { code, log } = await fire(bed, [item({
    // Two umbrellas: one that holds the date and one that cannot.
    parents: ['fixture-event-g', 'fixture-event-deep-1415'],
    edges: [
      edge(),                                                                              // 0 written
      edge({ quote: 'The campaign was decided by a storm this article never mentions at all.', explanation: because('The campaign was decided by a storm this article never mentions at all.') }), // 1 quote-not-found
      edge({ from: 'fixture-event-deep-1900', type: 'enabled', quote: CHRONOLOGY, explanation: because(CHRONOLOGY) }), // 2 chronology, first half
      edge({ type: 'inspired', quote: THIRD, explanation: because(THIRD) }),                // 3 chronology, second half
      edge({ to: 'fixture-event-nowhere', from: QID, type: 'reacted-to' }),                 // 4 endpoint-missing
      // An edge from the item's own umbrella: refused as parent-to-child until
      // 13 October 2026, when the owner removed A14's rule; written since.
      edge({ from: 'fixture-event-g', type: 'precondition-of', quote: FORCED, explanation: because(FORCED) }), // 5 written (parent to child)
      edge({ from: 'fixture-event-deep-1822', confidence: 'consensus', type: 'enabled' }),  // 6 confidence
      { ...edge({ from: 'fixture-event-deep-1755' }), type: 'led-to' },                     // 7 type
    ],
  })]);
  assert.equal(code, EXIT.ok);
  const [entry] = log.entries;
  assert.equal(entry.status, 'partial');
  assert.deepEqual(entry.written.edges, [`fixture-event-deep-1969--${EVENT}--caused`, `fixture-event-g--${EVENT}--precondition-of`]);
  const by = new Map(entry.refusals.filter((r) => r.edge !== null).map((r) => [r.edge, r]));
  assert.equal(by.get(1).reason, 'quote-not-found');
  assert.match(by.get(1).detail, new RegExp(String(REVISION)));
  assert.equal(by.get(2).reason, 'chronology');
  assert.equal(by.get(3).reason, 'chronology');
  assert.match(by.get(3).detail, /fixture-event-deep-1900/, 'the second half names the third event');
  assert.equal(by.get(4).reason, 'endpoint-missing');
  assert.equal(by.has(5), false, 'the parent-to-child rule was removed by the owner on 13 October 2026');
  assert.equal(by.get(6).reason, 'confidence');
  assert.equal(by.get(7).reason, 'type');
  // And the umbrella that will not hold the date, which is not about an edge.
  const parent = entry.refusals.find((r) => r.reason === 'parent');
  assert.equal(parent.edge, null);
  assert.match(parent.detail, /fixture-event-deep-1415/);
  // The one that holds is on the record; the one that does not is not.
  const event = await readJson(path.join(bed.data, 'events', `${EVENT}.json`));
  assert.deepEqual(parentsOf(event), ['fixture-event-g']);
  // Nothing was written for a refused edge.
  const edges = await readdir(path.join(bed.data, 'edges'));
  assert.ok(!edges.some((name) => name.includes('fixture-event-nowhere')));
  assert.ok(!edges.some((name) => name.includes('led-to')));
  await rm(bed.dir, { recursive: true, force: true });
});

test('an item no edge of which survives is refused, and nothing is imported', async () => {
  const bed = await scratch();
  const before = await readdir(path.join(bed.data, 'events'));
  const { code, log } = await fire(bed, [item({
    id: '2026-10-13-africa-002',
    qid: SIEGE,
    title: 'Fixture siege Z',
    edges: [
      {
        from: 'fixture-event-deep-1900',
        to: SIEGE,
        type: 'caused',
        confidence: 'probable',
        article: 'Fixture siege Z',
        revision: SIEGE_REVISION,
        quote: SIEGE_CHRONOLOGY,
        explanation: because(SIEGE_CHRONOLOGY),
      },
    ],
  })]);
  assert.equal(code, EXIT.ok);
  const [entry] = log.entries;
  assert.equal(entry.status, 'refused');
  assert.equal(entry.written.event, null);
  assert.deepEqual(entry.written.edges, []);
  assert.deepEqual(entry.refusals.map((r) => r.reason), ['chronology']);
  // The bar: a record that earns no edge is not imported at all.
  assert.deepEqual((await readdir(path.join(bed.data, 'events'))).sort(), before.sort());
  assert.ok(!existsSync(path.join(bed.data, 'imports', 'wikidata-state.json')),
    'the import was never asked, so there is no cursor');
  await rm(bed.dir, { recursive: true, force: true });
});

test('an item whose every edge falls at the last fence gives the record back', async () => {
  const bed = await scratch();
  const before = {
    events: (await readdir(path.join(bed.data, 'events'))).sort(),
    places: (await readdir(path.join(bed.data, 'places'))).sort(),
  };
  // The arrow of time and the edge already here can only be asked once the
  // record exists, so this item is imported and then earns nothing: a record
  // that earns no edge is not imported at all (rules card 7), and what it
  // wrote comes back off disk.
  const { code, log } = await fire(bed, [item({
    edges: [edge({ from: QID, to: 'fixture-event-a', type: 'caused', quote: FORCED, explanation: because(FORCED) })],
  })]);
  assert.equal(code, EXIT.ok);
  const [entry] = log.entries;
  assert.equal(entry.status, 'refused');
  assert.deepEqual(entry.refusals.map((r) => r.reason), ['arrow-of-time']);
  assert.equal(entry.written.event, null);
  assert.equal(entry.written.place, null);
  assert.match(entry.note, /off disk again/);
  assert.deepEqual((await readdir(path.join(bed.data, 'events'))).sort(), before.events);
  assert.deepEqual((await readdir(path.join(bed.data, 'places'))).sort(), before.places);
  await rm(bed.dir, { recursive: true, force: true });
});

test('an item the atlas already holds is skipped, on this branch and on the other', async () => {
  const bed = await scratch();
  // First fire writes it.
  await fire(bed, [item({ edges: [edge()] })]);
  // Second fire, same item under a new id: the corpus now carries the qid.
  const { code, log } = await fire(bed, [item({ id: '2026-10-13-africa-009' })]);
  assert.equal(code, EXIT.ok);
  const entry = log.entries.at(-1);
  assert.equal(entry.status, 'skipped');
  assert.match(entry.note, new RegExp(`${QID} is already the event "${EVENT}"`));
  assert.deepEqual(entry.written.edges, []);

  // And the other branch's: --held is the list the routine extracts from it.
  const held = path.join(bed.dir, 'held.txt');
  await writeFile(held, `${SIEGE}\nsomething-else\n`, 'utf8');
  const third = await fire(bed, [item({ id: '2026-10-13-africa-010', qid: SIEGE, title: 'Fixture siege Z', edges: [{
    from: 'fixture-event-deep-1969',
    to: SIEGE,
    type: 'caused',
    confidence: 'probable',
    article: 'Fixture siege Z',
    revision: SIEGE_REVISION,
    quote: 'The siege was caused by the Fixture event, 1969, which had emptied the garrison of its own cavalry.',
    explanation: because('The siege was caused by the Fixture event, 1969, which had emptied the garrison of its own cavalry.'),
  }] })], ['--held', held]);
  assert.equal(third.code, EXIT.ok);
  const last = third.log.entries.at(-1);
  assert.equal(last.status, 'skipped');
  assert.match(last.note, /held by the other branch/);
  await rm(bed.dir, { recursive: true, force: true });
});

test('an item whose lead could not be read is refused summary-missing, and nothing of it stays on disk', async () => {
  const bed = await scratch();
  // The stub with the campaign's lead taken away: the import swallows a lead
  // it cannot fetch and writes the placeholder summary, which rules card 2
  // says a record never carries.
  const stub = path.join(bed.dir, 'stub');
  await cp(STUB, stub, { recursive: true });
  await rm(path.join(stub, 'summary', 'Fixture campaign Z.json'));
  const before = {
    events: (await readdir(path.join(bed.data, 'events'))).sort(),
    places: (await readdir(path.join(bed.data, 'places'))).sort(),
  };
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item({ parents: ['fixture-event-g'] })] }, null, 2)}\n`, 'utf8');
  const code = await main([
    '--queue', bed.queue, '--writer', 'A', '--data', bed.data,
    '--cache', bed.cache, '--fetcher', `stub:${stub}`,
  ]);
  assert.equal(code, EXIT.ok);
  const log = await readJson(path.join(bed.data, 'imports', 'queue-log.json'));
  const [entry] = log.entries;
  assert.equal(entry.status, 'refused');
  assert.deepEqual(entry.refusals.map((r) => r.reason), ['summary-missing']);
  assert.match(entry.note, /placeholder/);
  assert.equal(entry.written.event, null);
  assert.equal(entry.written.place, null);
  assert.deepEqual(entry.written.edges, []);
  assert.deepEqual((await readdir(path.join(bed.data, 'events'))).sort(), before.events);
  assert.deepEqual((await readdir(path.join(bed.data, 'places'))).sort(), before.places);
  assert.ok(!(await readdir(path.join(bed.data, 'edges'))).some((name) => name.includes(EVENT)));
  // The log it wrote is one the schema and the log's own checks accept.
  assert.equal(await main(['--check', path.join(bed.data, 'imports', 'queue-log.json')]), EXIT.ok);
  await rm(bed.dir, { recursive: true, force: true });
});

test('the recache is scoped to the fire\'s own citations', async () => {
  const bed = await scratch();
  const run = async (items) => {
    await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items }, null, 2)}\n`, 'utf8');
    return applyQueue({
      dataDir: bed.data, queueFile: bed.queue, writer: 'A', cacheDir: bed.cache,
      fetcher: stubFetcher(STUB), offline: true,
    });
  };
  const SIEGE_CAUSED = 'The siege was caused by the Fixture event, 1969, which had emptied the garrison of its own cavalry.';
  // Two fires: the campaign first, then the siege. The second fire's recache
  // must ask about the siege's citations and not the campaign's.
  const first = await run([item()]);
  assert.equal(first.exit, EXIT.ok);
  const second = await run([item({
    id: '2026-10-13-africa-020', qid: SIEGE, title: 'Fixture siege Z',
    edges: [edge({ to: SIEGE, article: 'Fixture siege Z', revision: SIEGE_REVISION, quote: SIEGE_CAUSED, explanation: because(SIEGE_CAUSED) })],
  })]);
  assert.equal(second.exit, EXIT.ok);
  assert.equal(second.entries[0].status, 'written');
  const ids = fireCitations(second.entries);
  assert.deepEqual(ids.sort(), [second.entries[0].written.event, ...second.entries[0].written.edges].sort());

  // What the fire's own records cite on Wikipedia, read off disk.
  let own = 0;
  for (const id of ids) {
    const dir = id.includes('--') ? 'edges' : 'events';
    const record = await readJson(path.join(bed.data, dir, `${id}.json`));
    own += record.sources.filter((s) => s.source === 'wikipedia-en').length;
  }
  assert.ok(own > 0);
  const scoped = await cacheReport({ dataDir: bed.data, cacheDir: bed.cache, only: new Set(ids) });
  const whole = await cacheReport({ dataDir: bed.data, cacheDir: bed.cache });
  assert.equal(scoped.gaps.references, own);
  assert.ok(whole.gaps.references > own, 'the unscoped report reaches the first fire\'s citations too');
  assert.deepEqual([...scoped.cited.keys()], ['Fixture siege Z']);
  // And the fire itself asked the scoped question: offline, the report half.
  assert.match(second.recache, new RegExp(`citations on active records: ${own}\\b`));
  await rm(bed.dir, { recursive: true, force: true });
});

test('held items are logged skipped and do not take a --max slot', async () => {
  const bed = await scratch();
  const held = path.join(bed.dir, 'held.txt');
  // Five the other branch holds, four by qid and one an existing record's id,
  // all ahead of the one item this fire can write.
  const theirs = [1, 2, 3, 4].map((n) => item({ id: `2026-10-13-africa-10${n}`, qid: `Q930000${n}` }));
  const existing = Object.fromEntries(Object.entries(item({
    id: '2026-10-13-africa-105', existing: 'fixture-event-t', parents: ['fixture-event-g'], edges: [],
  })).filter(([k]) => k !== 'qid'));
  await writeFile(held, `${theirs.map((t) => t.qid).join('\n')}\nfixture-event-t\n`, 'utf8');
  const { code, log } = await fire(bed, [...theirs, existing, item()], ['--held', held, '--max', '5']);
  assert.equal(code, EXIT.ok);
  const by = new Map(log.entries.map((e) => [e.id, e]));
  for (const t of [...theirs, existing]) {
    assert.equal(by.get(t.id)?.status, 'skipped', t.id);
    assert.match(by.get(t.id).note, /held by the other branch/);
  }
  assert.equal(by.get(item().id)?.status, 'written', 'the writable item behind five held ones is written');
  assert.ok(existsSync(path.join(bed.data, 'events', `${EVENT}.json`)));
  // The held existing record was not touched.
  const event = await readJson(path.join(bed.data, 'events', 'fixture-event-t.json'));
  assert.deepEqual(parentsOf(event), ['fixture-event-f']);
  await rm(bed.dir, { recursive: true, force: true });
});

test('an existing item may not file a parent that sits inside it, nor write the reverse of an active edge', async () => {
  const bed = await scratch();
  const { code, log } = await fire(bed, [
    // fixture-event-t is already part of fixture-event-f: filing f under t
    // would close a loop of part-of.
    {
      id: '2026-10-13-africa-030', planned: '2026-10-13T03:12Z', lane: 'africa', writer: 'A',
      existing: 'fixture-event-f', parents: ['fixture-event-t'], edges: [],
      why: 'Sunday pass: an umbrella for a record that came out with none.',
    },
    // fixture-event-deep-1900--fixture-event-deep-1969--enabled is active, so
    // the edge back the other way would make a two-step loop.
    {
      id: '2026-10-13-africa-031', planned: '2026-10-13T03:12Z', lane: 'africa', writer: 'A',
      existing: 'fixture-event-deep-1900', parents: [],
      edges: [edge({ from: 'fixture-event-deep-1969', to: 'fixture-event-deep-1900' })],
      why: 'Sunday pass: an edge for a record that has the article to carry it.',
    },
  ]);
  assert.equal(code, EXIT.ok);
  const by = new Map(log.entries.map((e) => [e.id, e]));
  const filing = by.get('2026-10-13-africa-030');
  assert.deepEqual(filing.refusals.map((r) => r.reason), ['parent-cycle']);
  assert.match(filing.refusals[0].detail, /fixture-event-t/);
  const f = await readJson(path.join(bed.data, 'events', 'fixture-event-f.json'));
  assert.deepEqual(parentsOf(f), [], 'the loop was not written');
  const back = by.get('2026-10-13-africa-031');
  assert.deepEqual(back.refusals.map((r) => r.reason), ['edge-cycle']);
  assert.match(back.refusals[0].detail, /fixture-event-deep-1900--fixture-event-deep-1969/);
  assert.ok(!existsSync(path.join(bed.data, 'edges', 'fixture-event-deep-1969--fixture-event-deep-1900--caused.json')));
  await rm(bed.dir, { recursive: true, force: true });
});

// --- the item that changes a record already here ---------------------------

test('an item with no qid files a parent onto a record the atlas holds, keeping the ones it has', async () => {
  const bed = await scratch();
  const { code, log } = await fire(bed, [item({
    id: '2026-10-13-africa-003',
    qid: undefined,
    existing: 'fixture-event-t',
    parents: ['fixture-event-g'],
    edges: [],
  })].map((one) => Object.fromEntries(Object.entries(one).filter(([, v]) => v !== undefined))));
  assert.equal(code, EXIT.ok);
  const [entry] = log.entries;
  assert.equal(entry.status, 'written');
  assert.equal(entry.written.event, 'fixture-event-t');
  const event = await readJson(path.join(bed.data, 'events', 'fixture-event-t.json'));
  assert.deepEqual(parentsOf(event), ['fixture-event-f', 'fixture-event-g'],
    'the umbrella it had is kept and the queue\'s is added');
  await rm(bed.dir, { recursive: true, force: true });
});

// --- the network -----------------------------------------------------------

test('when no request leaves the sandbox the tool writes nothing and exits with its own code', async () => {
  const bed = await scratch();
  const dead = await mkdtemp(path.join(tmpdir(), 'atlas-m90-dead-'));
  await writeFile(path.join(dead, REFUSE_FILE), '', 'utf8');
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item()] }, null, 2)}\n`, 'utf8');
  const code = await main([
    '--queue', bed.queue, '--writer', 'A', '--data', bed.data,
    '--cache', bed.cache, '--fetcher', `stub:${dead}`,
  ]);
  assert.equal(code, EXIT.network);
  assert.equal(NETWORK_REFUSED, 'network-refused');
  assert.ok(!existsSync(path.join(bed.data, 'imports', 'queue-log.json')), 'no log entry either');
  assert.ok(!existsSync(path.join(bed.data, 'events', `${EVENT}.json`)));
  assert.ok(!existsSync(path.join(bed.data, 'imports', 'wikidata-state.json')));
  await rm(bed.dir, { recursive: true, force: true });
  await rm(dead, { recursive: true, force: true });
});

// The stub, with the revision fetch answered the way a real failure answers
// it. Node's own fetch rejects a request that never left with a plain
// `TypeError: fetch failed`, whose `code` is undefined; a 403 is a refusal
// too. Neither is the revision not being there, so neither may become
// `quote-not-found` and a committed log.
function failingRevisions(fail) {
  const stub = stubFetcher(STUB);
  return {
    get calls() { return stub.calls; },
    get budget() { return stub.budget; },
    get spent() { return stub.spent; },
    async get(url) {
      if (new URL(url).searchParams.get('action') === 'parse') throw fail(url);
      return stub.get(url);
    },
  };
}

for (const [name, fail] of [
  ['a plain TypeError: fetch failed', () => new TypeError('fetch failed')],
  ['an HTTP 403', (url) => new HttpError(403, url)],
]) {
  test(`a revision fetch that fails with ${name} is the network exit, not quote-not-found`, async () => {
    const bed = await scratch();
    await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item()] }, null, 2)}\n`, 'utf8');
    const result = await applyQueue({
      dataDir: bed.data, queueFile: bed.queue, writer: 'A', cacheDir: bed.cache,
      fetcher: failingRevisions(fail), offline: true,
    });
    assert.equal(result.exit, EXIT.network);
    assert.match(result.problems[0], new RegExp(`^${NETWORK_REFUSED}:`));
    assert.deepEqual(result.entries, []);
    assert.ok(!existsSync(path.join(bed.data, 'imports', 'queue-log.json')), 'no log entry, so nothing to commit');
    assert.ok(!existsSync(path.join(bed.data, 'events', `${EVENT}.json`)));
    await rm(bed.dir, { recursive: true, force: true });
  });
}

test('a refusal inside the import puts the seeds and the cursor back and says the tree must be discarded', async () => {
  const bed = await scratch();
  const seedsFile = path.join(bed.data, 'imports', 'wikidata-seeds.json');
  const stateFile = path.join(bed.data, 'imports', 'wikidata-state.json');
  const seedsBefore = await readFile(seedsFile, 'utf8');
  // The quotes verify, and the network goes away between the verification and
  // the import: the first write to the import files has happened by then.
  const stub = stubFetcher(STUB);
  const fetcher = {
    get calls() { return stub.calls; },
    get budget() { return stub.budget; },
    get spent() { return stub.spent; },
    async get(url) {
      if (url.includes('wbgetentities')) throw new TypeError('fetch failed');
      return stub.get(url);
    },
  };
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item()] }, null, 2)}\n`, 'utf8');
  const result = await applyQueue({
    dataDir: bed.data, queueFile: bed.queue, writer: 'A', cacheDir: bed.cache, fetcher, offline: true,
  });
  assert.equal(result.exit, EXIT.network);
  assert.match(result.problems[0], new RegExp(`^${NETWORK_REFUSED}: the working tree may hold this fire's earlier items and import-state changes; commit nothing, discard it`));
  assert.equal(await readFile(seedsFile, 'utf8'), seedsBefore, 'the seeds file is as it was before the item');
  assert.ok(!existsSync(stateFile), 'the cursor the item set is gone again, as it was before');
  assert.ok(!existsSync(path.join(bed.data, 'imports', 'queue-log.json')));
  await rm(bed.dir, { recursive: true, force: true });
});

test('only a 404 or the API\'s own nosuchrevid says the revision is not there', () => {
  const api = (code) => Object.assign(new Error(`x: ${code}`), { apiCode: code });
  assert.equal(isMissingRevision(new HttpError(404, 'x')), true);
  assert.equal(isMissingRevision(api('nosuchrevid')), true);
  assert.equal(isMissingRevision(api('badrevids')), true);
  for (const e of [
    new TypeError('fetch failed'),
    Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('getaddrinfo'), { code: 'ENOTFOUND' }) }),
    new HttpError(403, 'x'), new HttpError(429, 'x'), new HttpError(503, 'x'),
    new BudgetError(10),
    new Error('wrapped', { cause: new HttpError(404, 'x') }),
  ]) {
    assert.equal(isMissingRevision(e), false, `${e.name}: ${e.message}`);
  }
  assert.equal(isNetworkRefusal(new TypeError('fetch failed')), true);
  assert.equal(isNetworkRefusal(new HttpError(403, 'x')), true);
  assert.equal(isNetworkRefusal(new BudgetError(10)), true);
  assert.equal(isNetworkRefusal(new Error('x', { cause: new Error('socket') })), true);
  assert.equal(isNetworkRefusal(new HttpError(404, 'x')), false);
});

test('a queue with no item for this writer stops and says so', async () => {
  const bed = await scratch();
  const { code, log } = await fire(bed, [item({ lane: 'americas', writer: 'B', id: '2026-10-13-americas-001' })]);
  assert.equal(code, EXIT.ok);
  assert.equal(log, null, 'nothing was taken, so there is no log to write');
  await rm(bed.dir, { recursive: true, force: true });
});

// --- --check ---------------------------------------------------------------

test('--check holds a queue to its schema and to the rules a schema cannot make', async () => {
  const bed = await scratch();
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item()] }, null, 2)}\n`, 'utf8');
  assert.equal(await main(['--check', bed.queue]), EXIT.ok);
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item({ writer: 'B' })] }, null, 2)}\n`, 'utf8');
  assert.equal(await main(['--check', bed.queue]), EXIT.hardStop);
  await writeFile(bed.queue, `${JSON.stringify({ ...emptyQueue(), items: [item({ why: 'short' })] }, null, 2)}\n`, 'utf8');
  assert.equal(await main(['--check', bed.queue]), EXIT.hardStop);
  // Usage is its own exit, so a routine can tell a mistyped flag from a red queue.
  assert.equal(await main(['--queue', bed.queue, '--writer', 'C']), EXIT.usage);
  assert.equal(await main(['--writer', 'A']), EXIT.usage);
  assert.equal(await main(['--queue', bed.queue, '--writer', 'A', '--fetcher', 'live']), EXIT.usage);
  await rm(bed.dir, { recursive: true, force: true });
});

// --- the pure halves ------------------------------------------------------

test('the revision is asked for by oldid, and its text is the prose and not the furniture', async () => {
  const url = parseUrl(REVISION);
  const params = new URL(url).searchParams;
  assert.equal(params.get('action'), 'parse');
  assert.equal(params.get('oldid'), String(REVISION));
  assert.equal(params.get('prop'), 'text');
  assert.equal(params.get('formatversion'), '2');
  assert.match(url, /^https:\/\/en\.wikipedia\.org\/w\/api\.php\?/);

  // The reference markers go, because a sentence quoted from the page has no
  // "[2]" in the middle of it; a table nobody quotes goes with them.
  const text = plainText('<p>One,<sup class="reference">[2]</sup> two.</p><table><tr><td>three</td></tr></table>');
  assert.match(text, /One, two\./);
  assert.ok(!text.includes('three'));
  assert.ok(!text.includes('[2]'));
  // Entities and block ends: two sentences either side of a paragraph break
  // must not run into one word.
  assert.equal(plainText('<p>a&amp;b</p><p>c</p>').trim(), 'a&b\nc');
  assert.equal(plainText('<p>&#8217;&ndash;&shy;</p>').trim(), '’–­');

  const fetched = await articleText(stubFetcher(STUB), REVISION);
  assert.ok(quoteFound(CAUSED, fetched));
  assert.ok(quoteFound(FORCED, fetched), 'curly quotes, the en dash and the soft hyphen are not differences');
  // A revision the stub has nothing for is an answer and not a refusal.
  await assert.rejects(() => articleText(stubFetcher(STUB), 1), (e) => e.status === 404);
});

test('the quote fold takes out everything but the words', () => {
  const article = 'The treaty—signed in 1986–87—ended the “war” of the gar­rison’s own making.';
  const typed = 'The treaty-signed in 1986-87-ended the "war" of the garrison\'s own making.';
  assert.ok(quoteFound(typed, article));
  // A line break in the middle of a sentence is whitespace and nothing else.
  assert.ok(quoteFound('one two three', 'one\n  two\tthree'));
  assert.equal(normaliseQuote('  a  b­ c  '), 'a b c');
  // And an empty quote is never found, whatever the text says.
  assert.equal(quoteFound('', 'anything at all'), false);
  assert.equal(quoteFound('   ', 'anything at all'), false);
});

test('the two verdicts a record must exist for: the arrow of time and the edge already here', () => {
  const when = { 'a': { start: 1200, end: 1200, date: '1200-03-01' }, 'b': { start: 1100, end: 1100 }, 'c': { start: 1200, end: 1200, date: '1200-06-01' } };
  const whenOf = (id) => when[id] ?? null;
  const caused = { type: 'caused' };
  assert.equal(writeVerdictFor(caused, { from: 'b', to: 'a', whenOf }).ok, true);
  const back = writeVerdictFor(caused, { from: 'a', to: 'b', whenOf });
  assert.equal(back.reason, 'arrow-of-time');
  assert.match(back.detail, /cannot start after/);
  // The same single year at both ends: the day decides.
  assert.equal(writeVerdictFor(caused, { from: 'a', to: 'c', whenOf }).ok, true);
  assert.equal(writeVerdictFor(caused, { from: 'c', to: 'a', whenOf }).reason, 'arrow-of-time');
  // An edge already here is never rewritten, whatever else is true of it.
  const held = writeVerdictFor(caused, { from: 'b', to: 'a', whenOf, ids: new Set(['b--a--caused']) });
  assert.equal(held.reason, 'already-held');
  assert.match(held.detail, /never rewrites one/);
  // With no dates on either side there is nothing to compare and nothing to say.
  assert.equal(writeVerdictFor(caused, { from: 'x', to: 'y' }).ok, true);
  // The reverse of an active edge is a loop of two, whatever the dates say.
  const active = new Set(['y>x']);
  const reverse = (from, to) => active.has(`${to}>${from}`);
  assert.equal(writeVerdictFor(caused, { from: 'x', to: 'y', reverse }).reason, 'edge-cycle');
  assert.equal(writeVerdictFor(caused, { from: 'y', to: 'x', reverse }).ok, true);
});

test('a parent is an active event whose span holds the start, and nothing else', () => {
  const byId = new Map([
    ['war', { id: 'war', kind: 'event', status: 'active', when: { start: 1270, end: null } }],
    ['gone', { id: 'gone', kind: 'event', status: 'retracted', when: { start: 1200, end: 2000 } }],
    ['short', { id: 'short', kind: 'event', status: 'active', when: { start: 1400, end: 1410 } }],
    ['town', { id: 'town', kind: 'place', status: 'active' }],
  ]);
  const child = { when: { start: 1986, end: 1987 } };
  assert.equal(parentVerdict('war', child, byId).ok, true);
  assert.match(parentVerdict('gone', child, byId).detail, /retracted/);
  assert.match(parentVerdict('short', child, byId).detail, /does not contain the event's start/);
  assert.match(parentVerdict('town', child, byId).detail, /is not an event record/);
  assert.match(parentVerdict('nobody', child, byId).detail, /is not an event record/);
  // A parent that is already inside the record is a loop of part-of.
  const inside = new Map([...byId, ['camp', { id: 'camp', kind: 'event', status: 'active', when: { start: 1980, end: 1990 }, parent: 'war' }]]);
  const loop = parentVerdict('camp', { id: 'war', when: { start: 1985, end: 1986 } }, inside);
  assert.equal(loop.reason, 'parent-cycle');
  // An open end reaches forward for ever, which is what lets one umbrella
  // hold a child nobody has dated the end of.
  assert.deepEqual(spanOf({ start: 1270, end: null }), { from: 1270, to: Infinity });
  assert.equal(spanOf(null), null);
});

test('an edge record is built once, and the locator is M72\'s own form', () => {
  const built = edgeRecord(edge({ sources: [{ source: 'fixture-source-1', locator: 'p. 12' }] }), {
    from: 'one', to: 'two', writer: 'B', created: '2026-10-13',
  });
  assert.equal(built.id, 'one--two--caused');
  assert.equal(built.origin.run, 'm90-writer-B');
  assert.deepEqual(built.sources, [
    { source: 'wikipedia-en', locator: locatorFor({ article: 'Fixture campaign Z', revision: REVISION }) },
    { source: 'fixture-source-1', locator: 'p. 12' },
  ]);
  // A consensus edge is refused where the citations cannot carry it, and
  // allowed where the scholarship is named and this atlas holds it.
  const sources = new Set(['fixture-source-1']);
  const base = { subject: QID, activeEvents: new Set(['fixture-event-deep-1969']), sourceIds: sources };
  assert.equal(verdictForEdge(edge({ confidence: 'consensus' }), base).reason, 'confidence');
  assert.equal(verdictForEdge(edge({ confidence: 'consensus', sources: [{ source: 'nobody-s-book' }] }), base).reason, 'confidence');
  assert.equal(verdictForEdge(edge({ confidence: 'consensus', sources: [{ source: 'fixture-source-1' }] }), base).ok, true);
  assert.equal(verdictForEdge(edge({ confidence: 'probable' }), base).ok, true);
});

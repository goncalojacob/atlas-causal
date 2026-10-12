// M90 §4 — the state tool: what a planner reads before it decides.
//
// Every count here is derived from the records the test hands it, never
// pinned: the fixture corpus grows and the live corpus grows every day, and a
// test that wrote the numbers down would be a test that fails for being right.
// What it asserts is that the tool's answer is the same answer the records
// give when they are counted another way.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parentsOf } from '../src/parts.js';
import { readRecords } from '../tools/lib/read.mjs';
import { measure } from '../tools/m42-pool.mjs';
import {
  state, lines, trimmed, MAX_LINES, THIN, laneTable, thinUmbrellas,
  disputesIn, headingsIn, readPlans, main,
} from '../tools/queue/state.mjs';
import { emptyQueue, emptyLog, WRITERS, STATUSES } from '../tools/queue/queue.mjs';
import { ROOT, FIXTURE_DATA } from './helpers.mjs';

const item = (over = {}) => ({
  id: '2026-10-13-africa-001',
  planned: '2026-10-13T03:12Z',
  lane: 'africa',
  writer: 'A',
  qid: 'Q9200001',
  title: 'Fixture campaign Z',
  parents: [],
  edges: [{
    from: 'fixture-event-deep-1969',
    to: 'Q9200001',
    type: 'caused',
    confidence: 'probable',
    article: 'Fixture campaign Z',
    revision: 1370437482,
    quote: 'The campaign was caused by the Fixture event, 1969, which had left the eastern road unheld for a year.',
    explanation: 'The article says it in one sentence, and the edge reads that sentence and nothing more: "The campaign was caused by the Fixture event, 1969, which had left the eastern road unheld for a year."',
  }],
  why: 'Africa trails, and the article carries a sentence that names a held event.',
  ...over,
});

const entry = (over = {}) => ({
  id: '2026-10-13-africa-001',
  writer: 'A',
  fired: '2026-10-13T04:20Z',
  status: 'written',
  written: { event: 'fixture-campaign-z', edges: ['fixture-event-deep-1969--fixture-campaign-z--caused'], place: null },
  refusals: [],
  ...over,
});

async function bed({ items = [], entries = [], plans = {} } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-m90-state-'));
  const queue = path.join(dir, 'queue.json');
  const log = path.join(dir, 'queue-log.json');
  const plansDir = path.join(dir, 'plans');
  await writeFile(queue, `${JSON.stringify({ ...emptyQueue(), items }, null, 2)}\n`, 'utf8');
  await writeFile(log, `${JSON.stringify({ ...emptyLog(), entries }, null, 2)}\n`, 'utf8');
  await mkdir(plansDir, { recursive: true });
  for (const [name, text] of Object.entries(plans)) await writeFile(path.join(plansDir, name), text, 'utf8');
  return { dir, queue, log, plansDir };
}

test('the corpus counts are the ones the pool file carried, measured and not retyped', async () => {
  const where = await bed();
  const out = await state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  // The same arithmetic, asked of the same records the other way round.
  const { entries } = await readRecords(FIXTURE_DATA);
  const records = entries.map((e) => e.record);
  const expected = measure(records.filter((r) => r.kind === 'event'), records.filter((r) => r.kind === 'edge'));
  assert.equal(out.corpus.active, expected.active);
  assert.equal(out.corpus.main, expected.main);
  assert.equal(out.corpus.filed, expected.filed);
  assert.equal(out.corpus.activeEdges, expected.activeEdges);
  assert.equal(out.corpus.components, expected.components);
  assert.equal(out.corpus.largestComponent, expected.largestComponent);
  assert.equal(out.corpus.noEdge, expected.noEdge);
  assert.equal(out.corpus.crossingAnUmbrella, expected.crossingAnUmbrella);
  // The one count `measure` does not carry, derived here the same way.
  assert.equal(out.corpus.noPlace, records
    .filter((r) => r.kind === 'event' && r.status === 'active' && typeof r.place !== 'string').length);
  // main plus filed is every active event, which is the identity A3 asks for.
  assert.equal(out.corpus.main + out.corpus.filed, out.corpus.active);
  assert.equal(typeof out.corpus.errors, 'number');
  assert.equal(typeof out.corpus.warnings, 'number');
  await rm(where.dir, { recursive: true, force: true });
});

test('the lane table counts each active event once, in the lane the timeline draws it in', async () => {
  const where = await bed();
  const out = await state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  const totals = out.lanes.reduce((n, lane) => n + lane.active, 0);
  assert.equal(totals, out.corpus.active, 'every active event is in exactly one lane row');
  assert.equal(out.lanes.reduce((n, lane) => n + lane.main, 0), out.corpus.main);
  // And each lane's centuries add up to the lane, unless an event is undated
  // — which the fixture corpus's are not.
  for (const lane of out.lanes) {
    const byCentury = lane.centuries.reduce((n, cell) => n + cell.active, 0);
    assert.ok(byCentury <= lane.active, `${lane.lane}: a century cell counts no event twice`);
  }
  // The rows are biggest first, which is what "the lanes that trail" is read off.
  const sizes = out.lanes.map((l) => l.active);
  assert.deepEqual(sizes, [...sizes].sort((a, b) => b - a));

  // The table itself is pure, so it can be asked of rows a test writes.
  assert.deepEqual(laneTable([
    { lane: 'africa', century: 1900, main: true },
    { lane: 'africa', century: 1900, main: false },
    { lane: 'asia', century: 1800, main: true },
    { lane: null, century: null, main: true },
  ]), [
    { lane: 'africa', active: 2, main: 1, centuries: [{ century: 1900, active: 2, main: 1 }] },
    { lane: 'asia', active: 1, main: 1, centuries: [{ century: 1800, active: 1, main: 1 }] },
    { lane: 'none', active: 1, main: 1, centuries: [] },
  ]);
});

test('an umbrella with fewer than three children is one the planner is shown', async () => {
  const event = (id, parent) => ({ kind: 'event', id, status: 'active', title: id, ...(parent ? { parent } : {}) });
  const records = [
    event('war'), event('a', 'war'), event('b', 'war'), event('c', 'war'),
    event('campaign'), event('d', 'campaign'),
    event('theatre'), event('e', ['theatre', 'war']), event('f', 'theatre'),
    { kind: 'event', id: 'gone', status: 'retracted', title: 'gone' },
    event('g', 'gone'),
  ];
  const thin = thinUmbrellas(records);
  assert.deepEqual(thin.map((t) => [t.id, t.children]), [['campaign', 1], ['theatre', 2]]);
  // `war` has four and is not shown; a retracted umbrella is not an umbrella.
  assert.ok(!thin.some((t) => t.id === 'war'));
  assert.ok(!thin.some((t) => t.id === 'gone'));
  assert.equal(THIN, 3);
  // The threshold is the argument, so a caller may ask a different question.
  assert.deepEqual(thinUmbrellas(records, { limit: 2 }).map((t) => t.id), ['campaign']);
  // And the fixture corpus's own, counted the other way round.
  const { entries } = await readRecords(FIXTURE_DATA);
  const fixture = entries.map((e) => e.record);
  const active = new Set(fixture.filter((r) => r.kind === 'event' && r.status === 'active').map((r) => r.id));
  const counted = new Map();
  for (const r of fixture.filter((x) => x.kind === 'event' && x.status === 'active')) {
    for (const id of new Set(parentsOf(r))) if (active.has(id)) counted.set(id, (counted.get(id) ?? 0) + 1);
  }
  assert.deepEqual(
    thinUmbrellas(fixture).map((t) => t.id).sort(),
    [...counted].filter(([, n]) => n < THIN).map(([id]) => id).sort(),
  );
});

test('the queue state is the queue against the logs, per writer and by code', async () => {
  const items = [
    item(),
    item({ id: '2026-10-13-africa-002' }),
    item({ id: '2026-10-13-americas-001', lane: 'americas', writer: 'B' }),
  ];
  const entries = [
    entry({ status: 'partial', refusals: [{ edge: 0, reason: 'chronology', detail: 'no cause stated' }] }),
    entry({ id: '2026-10-13-americas-001', writer: 'B', status: 'refused', written: { event: null, edges: [], place: null }, refusals: [{ edge: 0, reason: 'quote-not-found', detail: 'not in that revision' }] }),
  ];
  const where = await bed({ items, entries });
  const out = await state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  // Derived: of A's two items a log answers one, and B's only item is answered.
  assert.equal(out.waiting.A, items.filter((i) => i.writer === 'A').length - 1);
  assert.equal(out.waiting.B, 0);
  assert.equal(out.queue.byWriter.A.partial, 1);
  assert.equal(out.queue.byWriter.B.refused, 1);
  assert.deepEqual(out.queue.refusals, { chronology: 1, 'quote-not-found': 1 });
  for (const writer of WRITERS) {
    assert.deepEqual(Object.keys(out.queue.byWriter[writer]).sort(), [...STATUSES].sort());
  }
  await rm(where.dir, { recursive: true, force: true });
});

test('a dispute in a plan note is open until the edge it names says so', async () => {
  const { entries } = await readRecords(FIXTURE_DATA);
  const edges = entries.map((e) => e.record).filter((r) => r.kind === 'edge');
  const probable = edges.find((e) => e.confidence !== 'disputed');
  const note = [
    '# 13 October',
    '',
    '## What trailed',
    '',
    'Africa, as yesterday.',
    '',
    '## Disputed',
    '',
    `- \`${probable.id}\` — the article at revision 1370437482 says the other way round.`,
    '- `nobody--nothing--caused` — an edge this atlas does not hold.',
    '',
    '## For the assistant',
    '',
    'Apply the mark on m0.',
  ].join('\n');
  const where = await bed({ plans: { '2026-10-13.md': note } });
  const out = await state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  assert.deepEqual(out.disputes.map((d) => d.edge).sort(), [probable.id, 'nobody--nothing--caused'].sort());
  assert.match(out.disputes.find((d) => d.edge === probable.id).why, new RegExp(`still ${probable.confidence}`));
  assert.match(out.disputes.find((d) => d.edge === 'nobody--nothing--caused').why, /no edge of that id/);
  assert.deepEqual(out.plans, [{ file: '2026-10-13.md', headings: ['What trailed', 'Disputed', 'For the assistant'] }]);

  // The two readers are pure: only the `## Disputed` section counts, and a
  // heading after it closes it.
  assert.deepEqual(disputesIn(note), [probable.id, 'nobody--nothing--caused']);
  assert.deepEqual(disputesIn('## Disputed\n\n## Other\n\na--b--caused\n'), []);
  assert.deepEqual(disputesIn('## What trailed\n\na--b--caused\n'), []);
  assert.deepEqual(headingsIn('# one\n## two\n### three\n## four\n'), ['two', 'four']);
  // Three notes at most, newest first, because the file names are the days.
  const many = await bed({ plans: Object.fromEntries(
    ['2026-10-10.md', '2026-10-11.md', '2026-10-12.md', '2026-10-13.md'].map((n) => [n, `## ${n}\n`]),
  ) });
  assert.deepEqual((await readPlans(many.plansDir)).map((p) => p.file),
    ['2026-10-13.md', '2026-10-12.md', '2026-10-11.md']);
  assert.deepEqual(await readPlans(path.join(many.dir, 'nothing-here')), []);
  await rm(where.dir, { recursive: true, force: true });
  await rm(many.dir, { recursive: true, force: true });
});

test('the print is under eighty lines, and says what it left out when it is not', async () => {
  const where = await bed({ items: [item()] });
  const out = await state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  const printed = trimmed(lines(out));
  assert.ok(printed.length <= MAX_LINES, `${printed.length} lines`);
  assert.equal(MAX_LINES, 80);
  const text = printed.join('\n');
  assert.match(text, /^active \d+ — main \d+, filed \d+/);
  assert.match(text, /per lane \(A10\)/);
  assert.match(text, /queue: A \d+ waiting, B \d+ waiting/);
  assert.match(text, new RegExp(`umbrellas with fewer than ${THIN} children`));
  assert.match(text, /disputes still open: \d+/);
  // The no-place row says what it counts: a `place` that is not a string, and
  // not the pool files' "no place with a point" (review of 12 October, 8).
  assert.match(text, new RegExp(`active events whose place is not a string ${out.corpus.noPlace}\\b`));
  // A longer answer is cut and says so rather than running past the rule.
  const long = trimmed(Array.from({ length: 200 }, (_, i) => `line ${i}`));
  assert.equal(long.length, MAX_LINES);
  assert.match(long.at(-1), /121 line\(s\) not shown; --json for all of it/);
  await rm(where.dir, { recursive: true, force: true });
});

test('--json is the same answer, and an unknown flag is a usage exit', async () => {
  const where = await bed({ items: [item()] });
  const out = await state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  // The object is JSON all the way down: a planner's script reads it.
  assert.deepEqual(JSON.parse(JSON.stringify(out)), out);
  assert.equal(await main(['--data', FIXTURE_DATA, '--queue', where.queue, '--logs', where.log, '--plans', where.plansDir, '--json']), 0);
  assert.equal(await main(['--nonsense']), 2);
  await rm(where.dir, { recursive: true, force: true });
});

// --- over the live corpus --------------------------------------------------

test('state.mjs runs clean over data/ and its active count is the corpus\'s own', async () => {
  const where = await bed();
  const out = await state({ queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });
  // The validator's own verdict, which is the invariant every commit holds:
  // a red corpus is the thing a planner must not plan on top of.
  assert.equal(out.corpus.errors, 0, 'data/ validates');
  // And the count, derived from the files rather than written down.
  const events = (await readdir(path.join(ROOT, 'data', 'events'))).filter((n) => n.endsWith('.json'));
  let active = 0;
  for (const name of events) {
    const record = JSON.parse(await readFile(path.join(ROOT, 'data', 'events', name), 'utf8'));
    if (record.status === 'active') active += 1;
  }
  assert.equal(out.corpus.active, active);
  assert.equal(out.corpus.main + out.corpus.filed, active);
  assert.ok(trimmed(lines(out)).length <= MAX_LINES);
  await rm(where.dir, { recursive: true, force: true });
});

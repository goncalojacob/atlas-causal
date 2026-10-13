// M91 — what the planner reads now that it imports events whether or not an
// edge can be written today: the events with no edge per lane, the queue by
// the planner's own `rank`, and how many active events start before the
// owner's floor ("since around 1500"). Every expectation is derived from the
// fixture, never pinned.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readRecords } from '../tools/lib/read.mjs';
import { astronomicalBounds } from '../src/util/dates.js';
import { state, lines, trimmed, laneTable, FLOOR, MAX_LINES } from '../tools/queue/state.mjs';
import { emptyQueue, emptyLog, queueState, UNRANKED } from '../tools/queue/queue.mjs';
import { FIXTURE_DATA } from './helpers.mjs';

const item = (over = {}) => ({
  id: '2026-10-13-africa-001',
  planned: '2026-10-13T03:12Z',
  lane: 'africa',
  writer: 'A',
  qid: 'Q9200001',
  title: 'Fixture campaign Z',
  parents: [],
  edges: [],
  why: 'An event of significance since 1500 the atlas does not hold yet.',
  ...over,
});

async function bed(items = [], entries = []) {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-m91-state-'));
  const queue = path.join(dir, 'queue.json');
  const log = path.join(dir, 'queue-log.json');
  await writeFile(queue, JSON.stringify({ ...emptyQueue(), items }), 'utf8');
  await writeFile(log, JSON.stringify({ ...emptyLog(), entries }), 'utf8');
  return { dir, queue, log, plansDir: path.join(dir, 'plans') };
}

const ask = (where) => state({ dataDir: FIXTURE_DATA, queueFile: where.queue, logFiles: [where.log], plansDir: where.plansDir });

test('active events with no edge are split per lane, and the split adds up to the total', async () => {
  const where = await bed();
  const out = await ask(where);
  assert.equal(out.lanes.reduce((n, lane) => n + lane.noEdge, 0), out.corpus.noEdge);
  for (const lane of out.lanes) assert.ok(lane.noEdge <= lane.active, lane.lane);
  // The table itself, asked of rows a test writes.
  const table = laneTable([
    { lane: 'africa', century: 1900, main: true, edge: false },
    { lane: 'africa', century: 1900, main: false, edge: true },
    { lane: 'asia', century: 1800, main: true, edge: false },
  ]);
  assert.deepEqual(table.map((l) => [l.lane, l.noEdge]), [['africa', 1], ['asia', 1]]);
  // And the print carries it.
  const text = lines(out).join('\n');
  for (const lane of out.lanes) assert.match(text, new RegExp(`${lane.lane}\\s+${lane.active} / ${lane.main}, no edge ${lane.noEdge}`));
  await rm(where.dir, { recursive: true, force: true });
});

test('the queued items are counted by rank, answered ones left out', async () => {
  const items = [
    item({ rank: 'vital-3' }),
    item({ id: '2026-10-13-africa-002', rank: 'vital-3' }),
    item({ id: '2026-10-13-africa-003', rank: 'child-of:fixture-event-g' }),
    item({ id: '2026-10-13-africa-004' }),
    item({ id: '2026-10-13-americas-001', lane: 'americas', writer: 'B', rank: 'vital-4' }),
  ];
  const entries = [{
    id: '2026-10-13-africa-002', writer: 'A', fired: '2026-10-13T04:20Z', status: 'written',
    written: { event: 'fixture-campaign-z', edges: [], place: null }, refusals: [],
  }];
  const where = await bed(items, entries);
  const out = await ask(where);
  const answered = new Set(entries.map((e) => e.id));
  const expected = {};
  for (const one of items.filter((i) => !answered.has(i.id))) {
    const rank = one.rank ?? UNRANKED;
    expected[rank] = (expected[rank] ?? 0) + 1;
  }
  assert.deepEqual(out.queue.byRank, expected);
  assert.deepEqual(queueState({ items }, []).byRank['vital-3'], items.filter((i) => i.rank === 'vital-3').length);
  const text = lines(out).join('\n');
  assert.match(text, /queued by rank: /);
  for (const [rank, n] of Object.entries(expected)) assert.ok(text.includes(`${rank} ${n}`), rank);
  assert.ok(trimmed(lines(out)).length <= MAX_LINES);
  await rm(where.dir, { recursive: true, force: true });
});

test('the active events that start before 1500 are counted, from the records', async () => {
  const where = await bed();
  const out = await ask(where);
  const { entries } = await readRecords(FIXTURE_DATA);
  const expected = entries.map((e) => e.record)
    .filter((r) => r.kind === 'event' && r.status === 'active')
    .filter((r) => { try { return astronomicalBounds(r.when.start).min < FLOOR; } catch { return false; } }).length;
  assert.equal(FLOOR, 1500);
  assert.ok(expected > 0, 'the fixture reaches before 1500, so the count is asked of something');
  assert.equal(out.corpus.beforeFloor, expected);
  assert.match(lines(out).join('\n'), new RegExp(`active events starting before ${FLOOR} ${expected}\\b`));
  await rm(where.dir, { recursive: true, force: true });
});

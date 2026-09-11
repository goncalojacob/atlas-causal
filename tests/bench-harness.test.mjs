// The benchmark harness, held to the two things a harness must not do:
// run when it is imported, and write a corpus somewhere nobody asked for.
//
// `tests/bench/run.mjs` executed every case at module top level, so
// `import { syntheticEvents } from './run.mjs'` ran the whole suite — a
// minute and a half and 1.25 GB — as a side effect of an import; and
// `syntheticDataDir` wrote 62 657 files into `os.tmpdir()` with no option
// and nothing to remove them (health review of 6 September, R4).
//
// Nothing here measures anything: a benchmark inside `node --test` is a
// suite that can never fail, which is what run.mjs's own header refuses.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  syntheticEvents, syntheticEdges, parseArgs, NEEDS_DATASET,
  CASE_NAMES, NOTCH, viewportAt, benchGraphNotch,
} from './bench/run.mjs';
import { syntheticDataDir } from './bench/dataset.mjs';
import { zoomBucket } from '../src/cluster.js';

test('importing the harness runs no case', () => {
  // The import at the top of this file is the assertion: a suite that ran on
  // import would have printed a minute and a half of rows before this line.
  // What is checked here is that the generators came with it, which is what
  // an importer wants from the file.
  const events = syntheticEvents(50);
  assert.equal(events.length, 50);
  assert.ok(syntheticEdges(events).length > 0);
});

test('a link may be capped to what is near it, which is what the layout case asks for', () => {
  const events = syntheticEvents(2000, { seed: 20260905 })
    .map((event, i) => ({ ...event, when: { start: 1800 + (i % 200), end: 1800 + (i % 200) } }));
  const byYear = [...events].sort((a, b) => a.when.start - b.when.start || (a.id < b.id ? -1 : 1));
  const at = new Map(byYear.map((e, i) => [e.id, i]));
  const near = syntheticEdges(events, { perEvent: 2, reach: 250 });
  for (const edge of near) {
    const ahead = at.get(edge.to) - at.get(edge.from);
    assert.ok(ahead > 0, 'every link points forward in time');
    assert.ok(ahead <= 250, `a capped link reached ${ahead} events ahead`);
  }
  // And without the cap it reaches the far end, which is what the query cases
  // want: a large downstream from an early event.
  const far = syntheticEdges(events, { perEvent: 2 });
  assert.ok(far.some((edge) => at.get(edge.to) - at.get(edge.from) > 250));
});

test('the synthetic atlas is written where the caller says, and nowhere by default', async (t) => {
  await assert.rejects(() => syntheticDataDir(4), /needs `under`/);
  await assert.rejects(() => syntheticDataDir(4, { under: '' }), /needs `under`/);

  const under = await mkdtemp(path.join(tmpdir(), 'atlas-bench-test-'));
  t.after(() => rm(under, { recursive: true, force: true }));
  const dir = await syntheticDataDir(40, { under });
  assert.equal(path.dirname(dir), under, 'the corpus is under the directory it was given');
  assert.ok((await readdir(path.join(dir, 'events'))).length > 0, 'and there are records in it');
  // Generated once per (count, share, seed): the second call is the same
  // directory and writes nothing, which is why the case can be re-run.
  assert.equal(await syntheticDataDir(40, { under }), dir);
});

// I6's case, and the arithmetic it exists to print. The review of the index
// plan (finding 11) did not believe that the graph's notch was a missing
// `zoomBucket`, on the grounds that a notch is x1.16 and a bucket x1.044; the
// two constants live in different files, and this is what says so.
test('a wheel notch never lands in the bucket it left, at any zoom the graph allows', () => {
  assert.equal(NOTCH, Math.exp(-(-100) * 0.0015), "the wheel handler's own factor");
  for (let k = 0.25; k < 40; k *= 1.037) {
    assert.notEqual(zoomBucket(k), zoomBucket(k * NOTCH),
      `k=${k} and one notch in share a bucket, so bucketing would make the notch a cache hit`);
  }
  // Which is not to say the bucket is worthless: the way back lands a hair off
  // the zoom it left, and a hair is inside a bucket.
  const k = 3;
  assert.equal(zoomBucket(k), zoomBucket(k * 1.001));
});

test("the graph's notch case is registered, runs and prints", (t) => {
  assert.ok(CASE_NAMES.includes('graph-notch'), 'the case is in the table');
  assert.ok(!NEEDS_DATASET.has('graph-notch'), 'and it writes nothing to disk');

  // The viewport the case culls against: the whole arrangement at k = 1, and
  // a quarter of its width at k = 4. `graph-view.js`'s own `view()`.
  const laid = { width: 1000, height: 400 };
  const whole = viewportAt(laid, 1);
  // `+ 0` because a pan of nothing divided by a zoom of one is -0.
  assert.deepEqual([whole.x0 + 0, whole.x1], [0, 1000]);
  const close = viewportAt(laid, 4);
  assert.equal(Math.round(close.x1 - close.x0), 250);
  assert.ok(close.x0 > 0 && close.x1 < 1000, 'and it is inside the arrangement');

  // Three hundred events rather than twenty thousand: what is asserted is
  // that the case runs and prints rows, not what a row says. Timing a
  // benchmark inside `node --test` is what this file's header refuses.
  const lines = [];
  const log = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  t.after(() => { console.log = log; });
  benchGraphNotch(null, { events: 300 });
  console.log = log;
  assert.match(lines[0], /one wheel notch on the whole window/);
  assert.ok(lines.some((l) => /stackLayout on the whole window, k=1/.test(l)), 'it prints the stacking rows');
  assert.ok(lines.some((l) => /notches in, zoomBucket\(k\)/.test(l)), 'and both columns of the sweep');
  assert.ok(lines.some((l) => /ten in and ten out, raw k/.test(l)));
  for (const line of lines.slice(1)) assert.match(line, /\d+(\.\d+)? ms/, `every row carries a number: ${line}`);
});

test('the cases that need a corpus on disk are the ones that ask for --dataset', () => {
  // `rules` is not among them: it builds its records in memory and writes
  // nothing, so it runs with no flag like every other case.
  assert.deepEqual([...NEEDS_DATASET].sort(), ['build-index', 'validate']);
  assert.deepEqual(parseArgs([]), { names: [], dataset: process.env.ATLAS_BENCH_DATASET || null });
  assert.deepEqual(parseArgs(['cluster', 'layout']).names, ['cluster', 'layout']);
  assert.deepEqual(parseArgs(['--dataset', '/scratch', 'rules']), { names: ['rules'], dataset: '/scratch' });
  assert.deepEqual(parseArgs(['rules', '--dataset', '/scratch']), { names: ['rules'], dataset: '/scratch' });
});

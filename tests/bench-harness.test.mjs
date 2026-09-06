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
import { syntheticEvents, syntheticEdges, parseArgs, NEEDS_DATASET } from './bench/run.mjs';
import { syntheticDataDir } from './bench/dataset.mjs';

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

test('the cases that need a corpus on disk are the ones that ask for --dataset', () => {
  // `rules` is not among them: it builds its records in memory and writes
  // nothing, so it runs with no flag like every other case.
  assert.deepEqual([...NEEDS_DATASET].sort(), ['build-index', 'validate']);
  assert.deepEqual(parseArgs([]), { names: [], dataset: process.env.ATLAS_BENCH_DATASET || null });
  assert.deepEqual(parseArgs(['cluster', 'layout']).names, ['cluster', 'layout']);
  assert.deepEqual(parseArgs(['--dataset', '/scratch', 'rules']), { names: ['rules'], dataset: '/scratch' });
  assert.deepEqual(parseArgs(['rules', '--dataset', '/scratch']), { names: ['rules'], dataset: '/scratch' });
});

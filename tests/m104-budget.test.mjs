// M104 — `apply.mjs --budget`. A run that verifies many edges fetches a
// revision for each, and the import's default of 400 requests ends a large run
// with a BudgetError (exit 3, discard everything). The flag raises the limit.
// No network: `main` is given a fetcher factory that records what it was asked.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { main, EXIT } from '../tools/queue/apply.mjs';
import { emptyQueue } from '../tools/queue/queue.mjs';
import { FIXTURE_DATA } from './helpers.mjs';

async function run(args) {
  const dir = await mkdtemp(path.join(tmpdir(), 'oc-m104-budget-'));
  try {
    const queue = path.join(dir, 'queue.json');
    await writeFile(queue, JSON.stringify(emptyQueue()), 'utf8');
    const asked = [];
    const code = await main(['--queue', queue, '--writer', 'A', '--data', FIXTURE_DATA, '--log', path.join(dir, 'log.json'), ...args], {
      makeFetcher: (options) => { asked.push(options); return { calls: 0, get: async () => { throw new Error('no network'); } }; },
    });
    return { code, asked };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('--budget is handed to the fetcher', async () => {
  const { code, asked } = await run(['--budget', '1500']);
  assert.equal(code, EXIT.ok);
  assert.deepEqual(asked, [{ budget: 1500 }]);
});

test('without the flag the fetcher keeps its own default', async () => {
  const { asked } = await run([]);
  assert.deepEqual(asked, [{}]);
});

test('--budget takes a positive integer', async () => {
  for (const bad of ['0', '-3', 'many', '2.5']) {
    const { code, asked } = await run(['--budget', bad]);
    assert.equal(code, EXIT.usage, bad);
    assert.deepEqual(asked, []);
  }
});

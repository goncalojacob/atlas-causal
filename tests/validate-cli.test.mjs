import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, cp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';

// How many records and regions the fixture corpus holds, counted rather than
// written out: both numbers moved when M43b stretched the fixtures to 2025 and
// will move again with the next record. What these tests are about is that the
// tools count what is on disk and report it, not what the count happens to be.
const corpus = await fixtures();
const RECORDS = corpus.records.length;
const REGIONS = corpus.regions.length;
const countOf = (kind) => corpus.records.filter((r) => r.kind === kind).length;

function cli(tool, ...args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', tool), ...args], { encoding: 'utf8', cwd: ROOT });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

test('validate.mjs passes on the fixtures and prints the warnings', () => {
  const r = cli('validate.mjs', '--data', FIXTURE_DATA, '--index');
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /warning \[degree-zero\] events\/fixture-event-h\.json/);
  // The summary counts what is on disk, and the warnings are the unread
  // records plus the three intended ones (tests/rules.test.mjs). Read out of
  // the output rather than written down: every one of these numbers moved when
  // M43b stretched the fixtures to 2025, and what the test is about is that the
  // tool counts the corpus it was pointed at.
  const summary = r.out.match(/(\d+) records, (\d+) regions: 0 error\(s\), (\d+) warning\(s\)/);
  assert.ok(summary, r.out);
  assert.equal(Number(summary[1]), RECORDS, 'it counted the records on disk');
  assert.equal(Number(summary[2]), REGIONS, 'and the regions');
  // And the terminal is not asked to scroll through all of them: a rule past
  // the cap prints its first twenty and then says how many more there are.
  const more = r.out.match(/warning \[unread\]: and (\d+) more like the 20 above/);
  assert.ok(more, r.out);
  assert.equal(Number(summary[3]), Number(more[1]) + 20 + 3, 'the unread records and the three intended warnings');
  assert.equal((r.out.match(/warning \[unread\] /g) ?? []).length, 20);
});

test('validate.mjs passes on the repository data', () => {
  const r = cli('validate.mjs', '--index');
  assert.equal(r.status, 0, r.err);
});

test('validate.mjs fails when a file name does not match its id', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-cli-'));
  try {
    await cp(FIXTURE_DATA, dir, { recursive: true });
    await rename(path.join(dir, 'events', 'fixture-event-a.json'), path.join(dir, 'events', 'fixture-event-renamed.json'));
    const r = cli('validate.mjs', '--data', dir);
    assert.equal(r.status, 1);
    assert.match(r.err, /error \[rule 2\] events\/fixture-event-renamed\.json \/id: id "fixture-event-a" does not equal the file name/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('validate.mjs rejects unknown arguments and missing directories', () => {
  assert.equal(cli('validate.mjs', '--nope').status, 2);
  assert.equal(cli('validate.mjs', '--data', '/nonexistent/atlas').status, 2);
});

test('build-index.mjs writes an index that validate.mjs --index accepts', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-cli-'));
  try {
    await cp(FIXTURE_DATA, dir, { recursive: true });
    await rm(path.join(dir, 'index'), { recursive: true, force: true });
    assert.equal(cli('validate.mjs', '--data', dir, '--index').status, 1);
    const b = cli('build-index.mjs', '--data', dir);
    assert.equal(b.status, 0, b.err);
    assert.match(b.out, new RegExp([
      `${countOf('event')} events`, `${countOf('edge')} edges`, `${countOf('actor')} actors`,
      `${countOf('relation')} relations`, `${countOf('office')} offices`, `${countOf('tenure')} tenures`,
      `${countOf('narrative')} narratives`, `${countOf('place')} places`,
      `${countOf('presence')} presences`, `${countOf('source')} sources`,
    ].join(', ')));
    assert.equal(cli('validate.mjs', '--data', dir, '--index').status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

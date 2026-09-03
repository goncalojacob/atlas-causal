import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, cp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

function cli(tool, ...args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', tool), ...args], { encoding: 'utf8', cwd: ROOT });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

test('validate.mjs passes on the fixtures and prints the warnings', () => {
  const r = cli('validate.mjs', '--data', FIXTURE_DATA, '--index');
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /warning \[degree-zero\] events\/fixture-event-h\.json/);
  assert.match(r.out, /48 records, 3 regions: 0 error\(s\), 3 warning\(s\)/);
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
    assert.match(b.out, /12 events, 10 edges, 4 actors, 3 relations, 1 narratives, 11 places, 3 presences, 4 sources/);
    assert.equal(cli('validate.mjs', '--data', dir, '--index').status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

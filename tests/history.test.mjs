// The per-record history, and the one clone it must refuse to read.
//
// `recordHistories` derives a record's versions from the commits that touched
// its file. A shallow clone answers `git log` with whatever it happens to
// hold and nothing in the answer says it is short, so a `--depth 1` checkout
// produced exactly one version for every record and a file that claimed
// `from: "git"` about it. The deploy checked out one commit deep and
// committed those histories over the full ones, and `compareIndex` exempted
// `history/` from rule 16 so that nothing said a word (health review of
// 6 September, R1).
//
// What is built here is a real repository with a real shallow clone of it:
// the failure was in what git says about itself, and a stub of git would have
// been a test of the stub.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { recordHistories, isShallow, HISTORY_DIR } from '../tools/lib/history.mjs';
import { compareIndex } from '../tools/build-index.mjs';
import { ROOT } from './helpers.mjs';

const git = (cwd, ...args) => execFileSync('git', args, {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
  env: {
    ...process.env,
    GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.org',
    GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.org',
  },
});

const RECORD = {
  schema: 1,
  id: 'fixture-history-event',
  kind: 'event',
  status: 'active',
  supersededBy: null,
  aliases: [],
  authors: [{ name: 'Fixture Author', github: null }],
  license: 'CC-BY-SA-4.0',
  created: '2026-01-01',
  revised: null,
  sources: [],
  title: 'A record written three times',
  summary: 'Synthetic. It describes nothing that happened.',
  when: { start: 1200, end: 1200 },
  place: null,
  region: null,
  actors: [],
};

// A repository whose one record was written, then revised twice: three
// commits, and therefore three versions where the history can see them.
async function repository(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-history-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const repo = path.join(dir, 'repo');
  const dataDir = path.join(repo, 'data');
  await mkdir(path.join(dataDir, 'events'), { recursive: true });
  git(dir, 'init', '-q', '-b', 'main', 'repo');

  const file = path.join(dataDir, 'events', `${RECORD.id}.json`);
  for (const [n, revised] of [[1, null], [2, '2026-02-01'], [3, '2026-03-01']]) {
    const record = { ...RECORD, revised, summary: `${RECORD.summary} Written ${n} times.` };
    await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', `record, revision ${n}`);
  }
  return { dir, repo, dataDir, record: JSON.parse(await readFile(file, 'utf8')) };
}

test('a full clone reads the record\'s versions out of the commits', async (t) => {
  const { dataDir, record } = await repository(t);
  const { from, histories } = await recordHistories([record], { dataDir });
  assert.equal(from, 'git');
  assert.equal(histories.length, 1);
  assert.equal(histories[0].from, 'git');
  assert.ok(histories[0].versions.length > 1, `three commits, ${histories[0].versions.length} version(s)`);
});

test('a shallow clone falls back to revised, and says so', async (t) => {
  const { dir, repo, record } = await repository(t);
  const shallowRepo = path.join(dir, 'shallow');
  git(dir, 'clone', '-q', '--depth', '1', `file://${repo}`, 'shallow');
  const shallowData = path.join(shallowRepo, 'data');

  assert.equal(await isShallow(shallowRepo), true, 'git says the clone is shallow');
  assert.equal(await isShallow(repo), false, 'and that the original is not');

  const { from, histories } = await recordHistories([record], { dataDir: shallowData });
  // Not `git` with one version in it, which is what it used to say: the
  // fallback is named in the file, so a reader can tell a record written once
  // from a clone that cannot see the other two commits.
  assert.equal(from, 'revised');
  assert.equal(histories[0].from, 'revised');

  // And the shallow answer is not the full one, which is the whole reason it
  // may not be committed over it: what the deploy did every time it ran.
  const full = await recordHistories([record], { dataDir: path.join(repo, 'data') });
  assert.notDeepEqual(histories[0].versions, full.histories[0].versions);
});

test('rule 16 compares the histories byte for byte, like every other index file', () => {
  const name = `${HISTORY_DIR}/fixture-history-event.json`;
  const built = { files: { 'manifest.json': '{}', [name]: '{"versions":[1,2,3]}' } };
  // The exemption that stood here until 6 September let this through, and
  // with it every degraded history the shallow deploy committed.
  assert.deepEqual(
    compareIndex({ 'manifest.json': '{}', [name]: '{"versions":[1]}' }, built),
    [`differs ${name}`],
  );
  assert.deepEqual(compareIndex({ 'manifest.json': '{}' }, built), [`missing ${name}`]);
  assert.deepEqual(compareIndex({ 'manifest.json': '{}', [name]: '{"versions":[1,2,3]}' }, built), []);
});

test('the deploy checks out the whole history', async () => {
  const yaml = await readFile(path.join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8');
  const checkout = yaml.slice(yaml.indexOf('actions/checkout@'));
  assert.match(checkout.slice(0, 200), /with:\s*\n\s*fetch-depth: 0/, 'deploy.yml checks out at fetch-depth 0');
});

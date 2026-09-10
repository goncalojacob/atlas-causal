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
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { recordHistories, historyShards, isShallow } from '../tools/lib/history.mjs';
import { buildIndex, compareIndex, writeIndex, readIndex } from '../tools/build-index.mjs';
import { buildTopology } from '../src/validate/core.js';
import { attributePeriod, attributeShardKey, historyShardName } from '../src/explanations.js';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';

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

// I7 amendment A1, index2 review finding 13. `git log --diff-filter=AM` drops
// the rename commit as an `R`, and the walk asks only about the path the
// record is at now, so without the former names a renamed record reads in the
// dashboard as one written once and never touched. `tools/lib/history.mjs`
// merges the states under every alias's former path (`44adf37`), and
// `tests/migrate-ids.test.mjs` holds that through the rename *tool*. This
// holds it at `recordHistories` itself, with a bare `git mv` and an alias
// written by hand: the merge is the thing under test, not the tool that
// happens to be the only caller today.
test('a renamed record still lists the versions from before the rename', async (t) => {
  const { repo, dataDir, record } = await repository(t);
  const before = await recordHistories([record], { dataDir });
  assert.equal(before.from, 'git');
  assert.equal(before.histories[0].versions.length, 3, 'three commits, three versions');

  const renamed = {
    ...record,
    id: 'fixture-history-renamed',
    aliases: [record.id],
    revised: '2026-04-01',
  };
  const events = path.join(dataDir, 'events');
  git(repo, 'mv', path.join(events, `${record.id}.json`), path.join(events, `${renamed.id}.json`));
  await writeFile(path.join(events, `${renamed.id}.json`), `${JSON.stringify(renamed, null, 2)}\n`, 'utf8');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'the rename');

  const { from, histories } = await recordHistories([renamed], { dataDir });
  // Not `revised`: the fallback would be the record's own two dates, which is
  // exactly the degraded answer this merge exists to prevent.
  assert.equal(from, 'git');
  assert.equal(histories[0].from, 'git');
  const [history] = histories;
  assert.equal(history.id, renamed.id);
  assert.equal(history.versions.length, 4, JSON.stringify(history.versions));
  // The three from before the rename are the same three, unchanged, and the
  // fourth is the rename itself.
  assert.deepEqual(history.versions.slice(0, 3), before.histories[0].versions);
  assert.equal(history.versions[0].first, true);
  // `revised` is the version's own date and never one of its changed fields.
  assert.deepEqual(history.versions[3].fields, ['aliases', 'id']);

  // And the control: the alias is what finds them. Asked about the same
  // record with an empty `aliases`, the walk sees only the path it is at now
  // — the one rename commit, and the handed-in record itself, which no longer
  // matches that commit because the alias was taken out of it. Two versions
  // where there are four, and none of the three from before the rename: the
  // record reading as one barely touched, which is finding 13's symptom.
  const withoutAlias = await recordHistories([{ ...renamed, aliases: [] }], { dataDir });
  assert.equal(withoutAlias.histories[0].versions.length, 2,
    JSON.stringify(withoutAlias.histories[0].versions));
});

test('rule 16 compares the histories byte for byte, like every other index file', () => {
  const name = historyShardName('event', '1200-1299', 'abcdef012345');
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

// ─── The shards (I5) ───────────────────────────────────────────────────────
//
// One file per kind and century where there was one per record: 1,027 files
// and 4.1 MB on the real data, 62,446 at 10^4, all of them committed and
// shipped (index2-plan, D8). What the shard has to hold is exactly what the
// per-record file held, filed by exactly the table the attribute shards use.

async function fixtureShards() {
  const { records, regions } = await fixtures();
  const topology = buildTopology(records, regions);
  const wanted = records.filter((r) => r.kind !== 'presence');
  const { histories } = await recordHistories(wanted, { dataDir: FIXTURE_DATA });
  const events = new Map(topology.events.map((e) => [e.id, e]));
  return { records: wanted, histories, events, shards: historyShards(histories, wanted, events) };
}

test('a record read out of its shard is the history the per-record file carried', async () => {
  const { histories, shards } = await fixtureShards();
  const found = new Map();
  for (const shard of shards) {
    for (const [id, entry] of Object.entries(shard.file.records)) found.set(`${shard.kind}:${id}`, entry);
  }
  assert.ok(histories.length > 0);
  for (const history of histories) {
    // The same object, minus the `id` and the `kind` every file repeated: the
    // dashboard is handed this and `src/review/history.js` is unchanged.
    assert.deepEqual(found.get(`${history.kind}:${history.id}`), { from: history.from, versions: history.versions },
      `${history.kind}:${history.id}`);
  }
  assert.equal(found.size, histories.length, 'every history is in a shard and none is in two');
});

test('a record is in exactly one shard, chosen by its own filing key', async () => {
  const { records, events, shards } = await fixtureShards();
  const seen = new Map();
  for (const shard of shards) {
    for (const id of Object.keys(shard.file.records)) {
      const key = `${shard.kind}:${id}`;
      assert.ok(!seen.has(key), `${key} is in two shards`);
      seen.set(key, `${shard.kind}/${shard.key}`);
    }
  }
  for (const record of records) {
    const key = attributeShardKey(attributePeriod(record.kind, record, events));
    assert.equal(seen.get(`${record.kind}:${record.id}`), `${record.kind}/${key}`, record.id);
  }
  // The three answers that are not a century, which is the half of the table
  // the histories added: a place and a source by their kind, and a record with
  // no year at all — an office with `when: null` — in the `null` shard.
  const of = (kind, id) => seen.get(`${kind}:${id}`);
  for (const place of records.filter((r) => r.kind === 'place')) assert.equal(of('place', place.id), 'place/place');
  for (const source of records.filter((r) => r.kind === 'source')) assert.equal(of('source', source.id), 'source/source');
  const dateless = records.filter((r) => r.kind === 'office' && r.when === null);
  assert.ok(dateless.length > 0, 'the fixtures carry an office with no interval');
  for (const office of dateless) assert.equal(of('office', office.id), 'office/null');
  // And an event is in the century it begins in, which is the other half.
  for (const event of records.filter((r) => r.kind === 'event' && r.when)) {
    assert.match(of('event', event.id) ?? '', /^event\/-?\d+--?\d+$/, event.id);
  }
});

test('the shards are in kind order and then year order, and their ids are sorted inside', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(built.files['manifest.json']);
  const shards = manifest.historyShards;
  assert.ok(shards.length > 1);
  const kinds = shards.map((s) => s.kind);
  assert.deepEqual([...new Set(kinds)].length, new Set(kinds).size);
  // Every shard of one kind is contiguous, and within it the centuries run
  // forwards with the key that answers no year last.
  for (const kind of new Set(kinds)) {
    const first = kinds.indexOf(kind);
    assert.deepEqual(kinds.slice(first, first + kinds.filter((k) => k === kind).length), kinds.filter((k) => k === kind));
    const years = shards.filter((s) => s.kind === kind && s.from !== null).map((s) => s.from);
    assert.deepEqual(years, [...years].sort((a, b) => a - b), kind);
  }
  for (const shard of shards) {
    const file = JSON.parse(built.files[path.basename(shard.file)]);
    const ids = Object.keys(file.records);
    assert.deepEqual(ids, [...ids].sort(), `${shard.kind} ${shard.key}`);
  }
});

// The invariant H9 restored, on the new shape: a shallow clone still says
// `revised` rather than inventing a corpus in which nothing has been revised,
// and two builds of one shallow clone still agree to the byte — which is what
// rule 16 compares now that the exemption is gone (i5-brief, section 4).
test('a shallow clone builds shards that say revised and are byte-identical twice', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-history-index-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const repo = path.join(dir, 'repo');
  await mkdir(repo, { recursive: true });
  git(dir, 'init', '-q', '-b', 'main', 'repo');
  await cp(FIXTURE_DATA, path.join(repo, 'data'), { recursive: true });
  await rm(path.join(repo, 'data', 'index'), { recursive: true, force: true });
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'the fixtures');

  git(dir, 'clone', '-q', '--depth', '1', `file://${repo}`, 'shallow');
  const shallowData = path.join(dir, 'shallow', 'data');
  assert.equal(await isShallow(path.join(dir, 'shallow')), true);

  const first = await buildIndex(shallowData);
  const second = await buildIndex(shallowData);
  const manifest = JSON.parse(first.files['manifest.json']);
  const names = manifest.historyShards.map((s) => path.basename(s.file));
  assert.ok(names.length > 0);
  for (const name of names) assert.equal(first.files[name], second.files[name], name);
  // Every record's history says where it came from, and on a shallow clone
  // that is the record's own dates and never `git`.
  for (const name of names) {
    for (const entry of Object.values(JSON.parse(first.files[name]).records)) {
      assert.equal(entry.from, 'revised', name);
    }
  }
  // And rule 16 has nothing to complain about, histories included.
  await writeIndex(shallowData, first);
  assert.deepEqual(compareIndex(await readIndex(shallowData), second), []);
});

test('the deploy checks out the whole history', async () => {
  const yaml = await readFile(path.join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8');
  const checkout = yaml.slice(yaml.indexOf('actions/checkout@'));
  assert.match(checkout.slice(0, 200), /with:\s*\n\s*fetch-depth: 0/, 'deploy.yml checks out at fetch-depth 0');
});

// The writer: the migration chain applied to a tree on disk.
//
// Every test here works on a scratch copy of the fixture dataset, never on
// the repository's own files. What is being proved is that the pair 2/3
// really is reversible *through the writer* — up on disk, down on disk, the
// bytes back where they started — because that is the safety net under every
// migration after it, and the day it matters will be the day it is trusted
// without being checked.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LATEST } from '../src/validate/migrate.js';
import { apply, planMigration, recordAt, serialize } from '../tools/migrate/apply.mjs';
import { readRecords } from '../tools/lib/read.mjs';
import { FIXTURE_DATA } from './helpers.mjs';

// Every record file in a data directory, keyed by its path, as bytes.
async function treeOf(dataDir) {
  const out = new Map();
  for (const sub of await readdir(dataDir, { withFileTypes: true })) {
    if (!sub.isDirectory() || sub.name === 'index' || sub.name === 'geo') continue;
    for (const name of await readdir(path.join(dataDir, sub.name))) {
      if (!name.endsWith('.json')) continue;
      out.set(`${sub.name}/${name}`, await readFile(path.join(dataDir, sub.name, name), 'utf8'));
    }
  }
  return out;
}

// A scratch copy of the fixtures with a `review` block on one record, so that
// migration 2 has something to do: no fixture carries one, and a migration
// tested only against records it does not touch is not tested at all.
async function scratch(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-migrate-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const dataDir = path.join(dir, 'data');
  await cp(FIXTURE_DATA, dataDir, { recursive: true });

  const file = path.join(dataDir, 'events', 'fixture-event-a.json');
  const record = JSON.parse(await readFile(file, 'utf8'));
  record.review = { flags: ['date'], note: 'A synthetic flag, so that migration 2 has a record to act on.' };
  await writeFile(file, serialize(record), 'utf8');

  return { dataDir, before: await treeOf(dataDir) };
}

test('the chain applied to a tree: 2 writes, 3 takes it back, the bytes are equal', async (t) => {
  const { dataDir, before } = await scratch(t);

  const up = await apply(dataDir, { to: 2 });
  assert.deepEqual(up.errors, []);
  // Migration 2 has the one record with a `review` block; migration 4 taken
  // back off has the three that carry `sitelinks`, which it reshaped, and the
  // two tombstones, whose reasons go back into the notes they were read out
  // of. The `led` relation is the second of those since M30a-2 re-filed it,
  // which is what its retraction opening with the sentence migration 4 knows
  // how to read is for.
  assert.deepEqual(up.changes.map((c) => c.file).sort(), [
    'actors/fixture-actor-one.json',
    'edges/fixture-event-e--fixture-event-t--inspired.json',
    'events/fixture-event-a.json',
    'places/fixture-place-a.json',
    'relations/fixture-actor-one--fixture-actor-two--led.json',
  ]);
  assert.equal(up.written, 5);
  const at2 = JSON.parse(await readFile(path.join(dataDir, 'events', 'fixture-event-a.json'), 'utf8'));
  assert.deepEqual(at2.review.citations, {});
  assert.equal(at2.sitelinks, 2, 'a tree at step 2 carries the shape step 4 replaced');

  const down = await apply(dataDir, { to: LATEST });
  assert.deepEqual(down.errors, []);
  assert.equal(down.written, 5);
  assert.deepEqual([...(await treeOf(dataDir)).entries()], [...before.entries()]);
});

test('applying it twice writes nothing the second time', async (t) => {
  const { dataDir } = await scratch(t);
  await apply(dataDir, { to: 2 });
  const again = await apply(dataDir, { to: 2 });
  assert.deepEqual(again.changes, []);
  assert.equal(again.written, 0);
});

test('a dry run says what would change and changes nothing', async (t) => {
  const { dataDir, before } = await scratch(t);
  const result = await apply(dataDir, { to: 2, dryRun: true });
  assert.equal(result.changes.length, 5);
  assert.equal(result.written, 0);
  assert.deepEqual([...(await treeOf(dataDir)).entries()], [...before.entries()]);
});

test('nothing is written when the migrated tree does not validate', async (t) => {
  const { dataDir, before } = await scratch(t);
  // A dangling reference the chain cannot be blamed for, to prove the gate is
  // the whole validator over the whole tree and not a per-record shape check.
  const file = path.join(dataDir, 'events', 'fixture-event-a.json');
  const record = JSON.parse(await readFile(file, 'utf8'));
  record.place = 'fixture-place-that-is-not-there';
  await writeFile(file, serialize(record), 'utf8');
  const baseline = await treeOf(dataDir);

  const result = await apply(dataDir, { to: 2 });
  assert.ok(result.errors.some((e) => e.rule === 3));
  assert.equal(result.written, 0);
  assert.deepEqual([...(await treeOf(dataDir)).entries()], [...baseline.entries()]);
  assert.notDeepEqual([...baseline.entries()], [...before.entries()]);
});

test('a version outside the chain is refused rather than guessed at', async (t) => {
  const { dataDir } = await scratch(t);
  await assert.rejects(() => apply(dataDir, { to: 0 }), /between 1 and/);
  await assert.rejects(() => apply(dataDir, { to: LATEST + 1 }), /between 1 and/);
});

test('recordAt converges from either side of the version asked for', () => {
  const at3 = { schema: 1, id: 'x', kind: 'event', status: 'active', supersededBy: null, aliases: [], revised: null, review: { flags: [] } };
  const at2 = { ...at3, review: { flags: [], citations: {} } };
  // Behind it, at it, and past it — one answer.
  assert.deepEqual(recordAt(at3, 2), at2);
  assert.deepEqual(recordAt(at2, 2), at2);
  assert.deepEqual(recordAt(at2, 3), at3);
  assert.deepEqual(recordAt(at3, 3), at3);
});

test('planMigration reads the bytes as they are, and readRecords does not', async (t) => {
  const { dataDir } = await scratch(t);
  await apply(dataDir, { to: 2 });
  // On disk the record is at 2 — and every tool that goes through read.mjs
  // sees it at the end of the chain regardless, which is the whole point of
  // applying it on read as well as on disk.
  const { entries } = await readRecords(dataDir);
  const read = entries.find((e) => e.record.id === 'fixture-event-a').record;
  assert.equal(Object.hasOwn(read.review, 'citations'), false);
  const { entries: raw } = await readRecords(dataDir, { migrate: false });
  const onDisk = raw.find((e) => e.record.id === 'fixture-event-a').record;
  assert.deepEqual(onDisk.review.citations, {});
  // And what the writer would do next is nothing, because it is already there.
  assert.deepEqual((await planMigration(dataDir, { to: 2 })).changes, []);
});

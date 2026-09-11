// The local server's store: the save queue, the atlas kept in memory
// between saves, and the index rebuilt behind the answer (H4d, health
// review B, finding 32; review of the health plan, finding 27).
//
// The one that matters is the first: two saves that arrive together used to
// interleave their writeIndex, and the loser's files were deleted by the
// winner's clean-up.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStore } from '../tools/lib/store.mjs';
import { createServer, saveBundle, STATUS_PATH } from '../tools/serve.mjs';
import { checkBundle } from '../tools/bundle-to-files.mjs';
import { readRecords } from '../tools/lib/read.mjs';
import { buildIndex } from '../tools/build-index.mjs';
import { valuesFromRecord, applyValues } from '../src/contribute/bundle.js';
import { ROOT, FIXTURE_DATA } from './helpers.mjs';
import { expandSpine } from '../src/data.js';

async function scratch() {
  const root = await mkdtemp(path.join(tmpdir(), 'atlas-store-'));
  await cp(FIXTURE_DATA, path.join(root, 'data'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<!doctype html><title>fixture</title>\n', 'utf8');
  return { root, dataDir: path.join(root, 'data'), schemaDir: path.join(ROOT, 'schema') };
}

async function activeEvents(dataDir) {
  const { entries } = await readRecords(dataDir);
  return entries.map((e) => e.record).filter((r) => r.kind === 'event' && r.status === 'active');
}

function edited(record, summary) {
  const values = valuesFromRecord('event', record);
  values.summary = summary;
  return applyValues('event', record, values);
}

const bundleOf = (record) => ({ schema: 1, records: [record] });

test('two saves that arrive together are applied one after the other', async () => {
  const options = await scratch();
  const store = createStore(options);
  const [first, second] = await activeEvents(options.dataDir);

  const a = bundleOf(edited(first, 'The first save, written by a test of the queue.'));
  const b = bundleOf(edited(second, 'The second save, written by a test of the queue.'));
  // Started together, without awaiting the first: this is the case that used
  // to interleave.
  const [one, two] = await Promise.all([
    store.save(checkBundle(a), a),
    store.save(checkBundle(b), b),
  ]);
  assert.deepEqual(one.written.map((w) => w.id), [first.id]);
  assert.deepEqual(two.written.map((w) => w.id), [second.id]);

  await store.settled();
  const onDisk = await activeEvents(options.dataDir);
  const byId = new Map(onDisk.map((r) => [r.id, r]));
  assert.match(byId.get(first.id).summary, /first save/, 'neither save overwrote the other');
  assert.match(byId.get(second.id).summary, /second save/);

  // And the index on disk is a fresh build of what is on disk: one rebuild
  // covering both saves, not one of them lost to the other's clean-up.
  const built = await buildIndex(options.dataDir);
  const written = new Set(await readdir(path.join(options.dataDir, 'index')));
  for (const name of Object.keys(built.files)) {
    const [head] = name.split('/');
    assert.ok(written.has(head), `${name} is missing from the index the store wrote`);
  }
  for (const [name, text] of Object.entries(built.files)) {
    assert.equal(await readFile(path.join(options.dataDir, 'index', ...name.split('/')), 'utf8'), text, name);
  }
});

test('the second save is judged against an atlas that already has the first in it', async () => {
  const options = await scratch();
  const store = createStore(options);
  const [event] = await activeEvents(options.dataDir);

  // A new event, and then an edge that points at it. The edge resolves only
  // if the event the save before it wrote is already in the topology the
  // rules read, which is what "patched synchronously" has to mean.
  const { entries } = await readRecords(options.dataDir);
  const template = entries.map((e) => e.record).find((r) => r.kind === 'edge' && r.status === 'active' && r.from === event.id);
  assert.ok(template, 'the fixture has an active edge out of this event');
  const newcomer = { ...event, id: 'store-test-newcomer', aliases: [], wikidata: undefined, wikipedia: undefined, sitelinks: undefined, body: undefined };
  for (const key of ['wikidata', 'wikipedia', 'sitelinks', 'body']) delete newcomer[key];
  const edge = { ...template, id: `store-test-newcomer--${template.to}--${template.type}`, from: 'store-test-newcomer' };

  const first = bundleOf(newcomer);
  const second = bundleOf(edge);
  // Both started before either has finished: nothing is awaited in between.
  const one = store.save(checkBundle(first), first);
  const two = store.save(checkBundle(second), second);
  assert.deepEqual((await one).written.map((w) => w.id), ['store-test-newcomer']);
  assert.deepEqual((await two).written.map((w) => w.id), [edge.id]);

  // And the other way round is refused, which is what says the first test
  // was not passing by accident: an edge out of an event nobody has written.
  const orphan = bundleOf({ ...edge, id: `store-test-orphan--${template.to}--${template.type}`, from: 'store-test-orphan' });
  await assert.rejects(store.save(checkBundle(orphan), orphan), (e) => e.status === 422 && /is not an event/.test(JSON.stringify(e.detail.errors)));
  await store.settled();
});

test('a refused save does not stop the next one', async () => {
  const options = await scratch();
  const store = createStore(options);
  const [event] = await activeEvents(options.dataDir);
  const broken = bundleOf({ ...event, summary: '' });
  await assert.rejects(store.save(checkBundle(broken), broken), (e) => e.status === 422);
  const good = bundleOf(edited(event, 'A save that came after a refusal and went through.'));
  const done = await store.save(checkBundle(good), good);
  assert.deepEqual(done.written.map((w) => w.id), [event.id]);
  await store.settled();
});

test('saveBundle without a store still waits for the index', async () => {
  const options = await scratch();
  const [event] = await activeEvents(options.dataDir);
  const saved = await saveBundle(bundleOf(edited(event, 'A save through the one-shot path.')), options);
  assert.deepEqual(saved.written.map((w) => w.id), [event.id]);
  assert.ok(saved.index.includes('manifest.json'), 'the index it waited for');
});

test('the server answers a save before the index, and /__status says so', async () => {
  const options = await scratch();
  const server = createServer({ ...options, port: 0 });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  server.close();
  await new Promise((resolve) => server.once('close', resolve));
  const real = createServer({ ...options, port });
  await new Promise((resolve) => real.listen(port, '127.0.0.1', resolve));
  const base = `http://localhost:${port}`;
  try {
    const quiet = await (await fetch(`${base}${STATUS_PATH}`)).json();
    assert.equal(quiet.ok, true);
    assert.equal(quiet.saves.pending, 0);

    const [event] = await activeEvents(options.dataDir);
    const response = await fetch(`${base}/__records/event/${event.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(bundleOf(edited(event, 'A save answered before the index was rebuilt.'))),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.index.state, 'rebuilding', 'the answer says the index is not written yet');
    // The record itself is already on disk: that is what "after the write"
    // means, and it is why the answer can be given this early.
    const saved = JSON.parse(await readFile(path.join(options.dataDir, 'events', `${event.id}.json`), 'utf8'));
    assert.match(saved.summary, /answered before the index/);

    await real.store.settled();
    const after = await (await fetch(`${base}${STATUS_PATH}`)).json();
    assert.equal(after.index.state, 'fresh');
    assert.equal(after.saves.pending, 0);
    assert.ok(after.records > 0, 'the store says how much it is holding');

    const wrongMethod = await fetch(`${base}${STATUS_PATH}`, { method: 'PUT' });
    assert.equal(wrongMethod.status, 405);
  } finally {
    real.close();
    await new Promise((resolve) => real.once('close', resolve));
  }
});

// R13: the store was the only writer that knew it was writing. A hand edit,
// `git checkout`, `new-record.mjs` or `migrate/apply.mjs` while the server
// runs changed `data/` behind it, and the next save was validated against
// records that no longer existed — then the background rebuild wrote an index
// built from memory over the newer files. `reload()` existed and nothing
// reached it.
test('a change made to data/ behind the store is read before the next save', async () => {
  const options = await scratch();
  const store = createStore(options);
  await store.load();
  assert.equal(await store.stale(), false, 'nothing has touched it yet');

  // Somebody else writes a record: a new event, which the store has never
  // seen, and an edit to one it holds.
  const [first] = await activeEvents(options.dataDir);
  const outside = { ...first, id: 'fixture-event-behind-the-store', title: 'Written behind the store' };
  await writeFile(
    path.join(options.dataDir, 'events', `${outside.id}.json`),
    `${JSON.stringify(outside, null, 2)}\n`,
    'utf8',
  );
  assert.equal(await store.stale(), true, 'the disk no longer looks the way it did');

  // The save that follows is judged against the disk, not against the copy:
  // an edge to the new event resolves, where the stale copy would have called
  // it a dangling reference.
  const edge = {
    ...JSON.parse(await readFile(path.join(options.dataDir, 'edges', 'fixture-event-a--fixture-event-b--caused.json'), 'utf8')),
    id: `${first.id}--${outside.id}--caused`,
    from: first.id,
    to: outside.id,
  };
  const bundle = bundleOf(edge);
  const saved = await store.save(checkBundle(bundle), bundle);
  assert.deepEqual(saved.written.map((w) => w.id), [edge.id]);
  assert.equal(await store.stale(), false, 'and the store is level with the disk again');

  // The rebuild that follows is a build of what is on disk, the record
  // somebody else wrote included — not of the copy the store was holding.
  await store.settled();
  const built = await buildIndex(options.dataDir);
  // Read off the whole-corpus projection, which the build assembles in memory
  // for the prerendered pages and no longer writes out (I4b).
  assert.ok(expandSpine(JSON.parse(built.spineText)).events.some((e) => e.id === outside.id), 'the index carries the record written behind the store');
  const written = new Set(await readdir(path.join(options.dataDir, 'index')));
  for (const name of Object.keys(built.files)) {
    if (name.includes('/')) continue;
    assert.ok(written.has(name), `${name} is on disk`);
  }
});

test('the stamp sees a file removed, and a file put back as an older copy', async () => {
  const options = await scratch();
  const store = createStore(options);
  await store.load();
  const file = path.join(options.dataDir, 'places', 'fixture-place-m.json');
  const bytes = await readFile(file, 'utf8');

  await rm(file);
  assert.equal(await store.stale(), true, 'a record deleted is a change');

  // Restored byte for byte, but not to the mtime it had: `git checkout` does
  // exactly this, and a stamp of the newest mtime alone would have missed it.
  await writeFile(file, bytes, 'utf8');
  assert.equal(await store.stale(), true);
  // `load()` hands back the copy it is holding, which is the point of it;
  // `reload()` is the one that goes to the disk.
  await store.reload();
  assert.equal(await store.stale(), false);
});

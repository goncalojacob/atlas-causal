import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, writeFile, readdir, readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { canonical, serialize, compact, buildIndex, writeIndex, readIndex, compareIndex } from '../tools/build-index.mjs';
import { runValidation } from '../tools/validate.mjs';
import { buildTopology, eventWeights } from '../src/validate/core.js';
import { checkRules } from '../src/validate/rules.js';
import { buildQueue, inQueue, DIGEST_KEYS } from '../src/review/queue.js';
import { readRecords, readRegions } from '../tools/lib/read.mjs';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';

async function tempCopyOfFixtures() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-index-'));
  await cp(FIXTURE_DATA, dir, { recursive: true });
  return dir;
}

// R5: the spine is parsed whole by every page on every device, and about a
// third of it was indentation. gzip hides that over the wire; JSON.parse does
// not. The two files nobody reads with their eyes are written compact; every
// file somebody does read stays indented.
test('the spine and the search shard are compact, and everything else is not', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    const built = await buildIndex(dir);
    const manifest = JSON.parse(built.files['manifest.json']);
    for (const key of ['spine', 'search']) {
      const name = path.basename(manifest.files[key]);
      const text = built.files[name];
      assert.equal(text.split('\n').length, 2, `${key} is one line and a newline`);
      // Compact is not the same as unordered: the hash in the file's own name
      // is a function of the bytes, so two builds of one dataset have to
      // agree on the key order.
      assert.equal(text, compact(JSON.parse(text)), `${key} is canonical`);
    }
    for (const name of ['manifest.json', path.basename(manifest.files.review)]) {
      assert.match(built.files[name], /\n {2}"/, `${name} is still readable`);
    }
    const history = Object.keys(built.files).find((n) => n.startsWith('history/'));
    assert.match(built.files[history], /\n {2}"/, 'a history is read in a terminal and stays indented');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('compact is canonical and ends with a newline, like serialize without the spaces', () => {
  assert.equal(compact({ b: 1, a: { z: [{ y: 1, x: 2 }], 'é': 3, Z: 4 } }),
    '{"a":{"Z":4,"z":[{"x":2,"y":1}],"é":3},"b":1}\n');
  assert.equal(compact({ a: 1 }).replace(/\s/g, ''), serialize({ a: 1 }).replace(/\s/g, ''),
    'the same value, the same bytes but for the whitespace');
});

test('canonical sorts keys recursively by code unit and serialize ends with a newline', () => {
  const text = serialize({ b: 1, a: { z: [{ y: 1, x: 2 }], 'é': 3, Z: 4 } });
  assert.equal(text, '{\n  "a": {\n    "Z": 4,\n    "z": [\n      {\n        "x": 2,\n        "y": 1\n      }\n    ],\n    "é": 3\n  },\n  "b": 1\n}\n');
  assert.deepEqual(Object.keys(canonical({ b: 1, a: 2, B: 3 })), ['B', 'a', 'b']);
});

test('building twice from the same data is byte-identical', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  assert.deepEqual(first.files, second.files);
  assert.deepEqual(Object.keys(first.files).sort(), Object.keys(second.files).sort());
});

// The whole index, not only the fixtures': the deploy asserts that main's
// committed data/index/ equals a fresh build, so every file the build names
// has to come out the same twice — the citer directory's name included,
// which is a hash over the concatenation of its files' bytes.
test('two builds of the repository name and write exactly the same files', async () => {
  const first = await buildIndex(path.join(ROOT, 'data'));
  const second = await buildIndex(path.join(ROOT, 'data'));
  assert.deepEqual(Object.keys(first.files).sort(), Object.keys(second.files).sort());
  for (const [name, text] of Object.entries(first.files)) assert.equal(text, second.files[name], name);
  const manifest = JSON.parse(first.files['manifest.json']);
  for (const key of ['spine', 'search', 'sources', 'review']) {
    assert.match(manifest.files[key], new RegExp(`^index/${key}-[0-9a-f]{12}\\.json$`), key);
    assert.ok(Object.hasOwn(first.files, path.basename(manifest.files[key])), key);
  }
  assert.match(manifest.files.citers, /^index\/citers-[0-9a-f]{12}$/);
  // The queue's shards are named in the summary and not in the manifest,
  // which is fetched no-store on every page load and would otherwise carry a
  // line per kind for a page most readers never open.
  assert.equal(manifest.files.history, 'index/history');
  const summary = JSON.parse(first.files[path.basename(manifest.files.review)]);
  for (const { kind, file } of summary.kinds) {
    assert.match(file, new RegExp(`^index/review-${kind}-[0-9a-f]{12}\\.json$`));
    assert.ok(Object.hasOwn(first.files, path.basename(file)), file);
  }
});

test('key order and file order in the source records do not change the bytes', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    const events = path.join(dir, 'events');
    for (const name of await readdir(events)) {
      const record = JSON.parse(await readFile(path.join(events, name), 'utf8'));
      const shuffled = Object.fromEntries(Object.entries(record).reverse());
      await writeFile(path.join(events, name), JSON.stringify(shuffled));
    }
    // Without git on either side: a temporary copy is in no repository, so
    // its histories would fall back to the records' own dates while the
    // fixtures' come out of this one's commits. What this test is about is
    // the record bytes.
    const shuffledBuild = await buildIndex(dir, { git: false });
    const reference = await buildIndex(FIXTURE_DATA, { git: false });
    assert.deepEqual(shuffledBuild.files, reference.files);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('manifest names the hashed files, counts, lanes and land', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(built.files['manifest.json']);
  assert.equal(manifest.schema, 1);
  assert.deepEqual(manifest.counts, { events: 12, edges: 10, sources: 4, actors: 4, presences: 3, places: 11, relations: 3, offices: 2, tenures: 4, narratives: 1, regions: 3 });
  assert.match(manifest.files.spine, /^index\/spine-[0-9a-f]{12}\.json$/);
  assert.match(manifest.files.sources, /^index\/sources-[0-9a-f]{12}\.json$/);
  assert.ok(Object.hasOwn(built.files, path.basename(manifest.files.spine)));
  assert.equal(manifest.regions[0].id, 'fixture-lane-1');
  assert.deepEqual(manifest.land, []);
  // The lane an event is drawn in and how it was arrived at: derived here and
  // carried into the spine, except `regionMethod`, which nothing draws and
  // which the projection drops (h3a-brief, A3). So the lane is read off the
  // file and the method off the build.
  const spine = JSON.parse(built.files[path.basename(manifest.files.spine)]);
  const byId = Object.fromEntries(spine.events.map((e) => [e.id, e]));
  const builtBy = Object.fromEntries(built.topology.events.map((e) => [e.id, e]));
  assert.equal(byId['fixture-event-a'].region, 'fixture-lane-1');
  assert.equal(builtBy['fixture-event-m'].regionMethod, 'nearest');
  assert.equal(builtBy['fixture-event-o'].regionMethod, 'override');
  assert.equal(Object.hasOwn(byId['fixture-event-a'], 'summary'), false, 'text stays out of the index');
  assert.deepEqual(built.unresolved, []);
});

// The two vocabularies that live in data reach the browser through the
// manifest, and the fixtures are the other half of the same claim: a dataset
// with no roles.json and no categories.json carries no key at all, which is
// what "absent means no check" is made of (amendment A8). The fixtures have
// neither file on purpose, so this pair of assertions is the whole contract.
test('the manifest carries the roles and the categories a dataset allows, and nothing where it has none', async () => {
  const fixture = JSON.parse((await buildIndex(FIXTURE_DATA)).files['manifest.json']);
  assert.equal(Object.hasOwn(fixture, 'rolesAllowed'), false);
  assert.equal(Object.hasOwn(fixture, 'categoriesAllowed'), false);

  const real = JSON.parse((await buildIndex(path.join(ROOT, 'data'))).files['manifest.json']);
  assert.deepEqual(real.rolesAllowed, JSON.parse(await readFile(path.join(ROOT, 'data', 'roles.json'), 'utf8')));
  assert.deepEqual(real.categoriesAllowed, JSON.parse(await readFile(path.join(ROOT, 'data', 'categories.json'), 'utf8')));
  // `roles` is the other list and stays what it was: the strings people
  // actually wrote, which is the evidence for the vocabulary rather than the
  // vocabulary itself.
  assert.notDeepEqual(real.roles, real.rolesAllowed.map((r) => r.id));
});

// The dashboard's queue is this file: the browser has no way to read a
// thousand record files, and the spine drops `authors`.
test('the review index lists the drafts, the count and the warnings', async () => {
  const built = await buildIndex(path.join(ROOT, 'data'));
  const manifest = JSON.parse(built.files['manifest.json']);
  assert.match(manifest.files.review, /^index\/review-[0-9a-f]{12}\.json$/);
  const summary = JSON.parse(built.files[path.basename(manifest.files.review)]);
  const { entries } = await readRecords(path.join(ROOT, 'data'));
  const records = entries.map((e) => e.record);
  const regions = await readRegions(path.join(ROOT, 'data'));
  // A withdrawn record is in no queue, whatever its review block says
  // (queue.js, inQueue): the twelve `led` tombstones would otherwise stand in
  // the list behind the twelve tenures that replaced them.
  const drafts = records.filter(inQueue);
  // The number the page reports is the validator's own, not a second count.
  assert.equal(summary.drafts, drafts.length);
  assert.equal(summary.total, records.filter((r) => r.kind !== 'presence').length);
  assert.equal(summary.kinds.reduce((sum, k) => sum + k.count, 0), drafts.length);

  // One file per kind, and between them every draft exactly once: the page
  // fetches the kind it is showing and not eleven megabytes of the rest
  // (health review B, finding 7).
  const shards = summary.kinds.map((k) => JSON.parse(built.files[path.basename(k.file)]));
  const digests = shards.flatMap((shard) => shard.records);
  assert.deepEqual(digests.map((r) => r.id).sort(), drafts.map((r) => r.id).sort());
  for (const [i, shard] of shards.entries()) {
    assert.equal(shard.kind, summary.kinds[i].kind);
    assert.equal(shard.records.length, summary.kinds[i].count);
    assert.ok(shard.records.every((r) => r.kind === shard.kind), `${shard.kind} shard holds only its own kind`);
  }

  // A shard carries the warnings about its own drafts: what the list puts on
  // a row, and nothing about records nobody is waiting on.
  const rules = checkRules(records, buildTopology(records, regions));
  const draftIds = new Set(drafts.map((r) => r.id));
  assert.deepEqual(
    shards.flatMap((s) => s.warnings).map((w) => w.id).sort(),
    rules.warnings.filter((w) => draftIds.has(w.id)).map((w) => w.id).sort(),
  );

  // A digest carries what the list reads and nothing else: no prose, no
  // sources, no geometry — those arrive when a record is opened.
  for (const digest of digests) {
    assert.ok(DIGEST_KEYS.includes('kind'));
    for (const key of Object.keys(digest)) assert.ok(DIGEST_KEYS.includes(key), `${digest.id} carries ${key}`);
  }
  assert.deepEqual(buildQueue(digests, { warnings: shards.flatMap((s) => s.warnings) }).length, drafts.length);

  // And one history file per reviewable record, which is what the dashboard
  // fetches when it opens one.
  const histories = Object.keys(built.files).filter((name) => name.startsWith('history/'));
  assert.deepEqual(
    histories.map((name) => name.slice('history/'.length, -'.json'.length)).sort(),
    records.filter((r) => r.kind !== 'presence').map((r) => r.id).sort(),
  );
});

test('weight counts active edges in and out plus the actors named', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const byId = Object.fromEntries(topology.events.map((e) => [e.id, e]));
  for (const event of topology.events) {
    const degree = topology.edges.filter((e) => e.status === 'active' && (e.from === event.id || e.to === event.id)).length;
    assert.equal(event.weight, degree + (event.actors ?? []).length, event.id);
    assert.ok(Number.isInteger(event.weight) && event.weight >= 0);
  }
  // An event nothing links to and nobody appears in weighs nothing.
  assert.equal(byId['fixture-event-h'].weight, 0);
  // fixture-event-e has one active edge each way and a retracted third: a
  // retracted edge never adds to either end.
  assert.equal(byId['fixture-event-e'].weight, 2);
  const weights = eventWeights(topology.events, topology.edges.filter((e) => e.status === 'active'));
  for (const event of topology.events) assert.equal(weights.get(event.id), event.weight, `${event.id}: inactive edges are not counted`);
});

test('weight is in the built index and does not change between builds', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const name = path.basename(JSON.parse(first.files['manifest.json']).files.spine);
  // A tombstone carries no weight in the spine: it is drawn nowhere, and the
  // tombstone list is the five fields a card still needs (h3a-brief, A10).
  const events = JSON.parse(first.files[name]).events.filter((e) => e.status === 'active');
  assert.ok(events.every((e) => Number.isInteger(e.weight)), 'every active event in the index carries a weight');
  assert.ok(events.some((e) => e.weight > 0));
  assert.equal(first.files[name], second.files[name]);
});

test('writeIndex removes stale hashed files and the result is fresh', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    await mkdir(path.join(dir, 'index'), { recursive: true });
    await writeFile(path.join(dir, 'index', 'spine-deadbeef0000.json'), '{}\n');
    await mkdir(path.join(dir, 'index', 'citers-deadbeef0000'), { recursive: true });
    await writeFile(path.join(dir, 'index', 'citers-deadbeef0000', 'fixture-source-a.json'), '[]\n');
    const built = await buildIndex(dir);
    await writeIndex(dir, built);
    // Keyed by the path relative to data/index/, so a citer file is named
    // here exactly as it is in the build: `citers-<hash>/<source-id>.json`.
    assert.deepEqual(Object.keys(await readIndex(dir)).sort(), Object.keys(built.files).sort());
    assert.ok(Object.keys(built.files).some((name) => /^citers-[0-9a-f]{12}\/.+\.json$/.test(name)));
    assert.deepEqual(await readdir(path.join(dir, 'index', 'citers-deadbeef0000')).catch(() => null), null, 'the stale directory is gone');
    assert.deepEqual(compareIndex(await readIndex(dir), built), []);
    await writeFile(path.join(dir, 'index', 'manifest.json'), '{}\n');
    assert.deepEqual(compareIndex(await readIndex(dir), built), ['differs manifest.json']);
    const check = await runValidation(dir, { index: true });
    assert.ok(check.errors.some((e) => e.rule === 16));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// The citers are a directory, so writeIndex has to create one, prune inside
// it, and take away a whole directory the build no longer names — none of
// which the flat index ever asked of it (h3a-brief, A6).
test('writeIndex creates, prunes and removes a hashed directory', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-nested-'));
  try {
    const built = { files: { 'manifest.json': '{}\n', 'citers-aaaaaaaaaaaa/one.json': '[1]\n', 'citers-aaaaaaaaaaaa/two.json': '[2]\n' } };
    await writeIndex(dir, built);
    assert.deepEqual(await readIndex(dir), built.files);
    assert.deepEqual(compareIndex(await readIndex(dir), built), []);

    // A file inside the named directory that the build does not name.
    await writeFile(path.join(dir, 'index', 'citers-aaaaaaaaaaaa', 'gone.json'), '[]\n');
    assert.deepEqual(compareIndex(await readIndex(dir), built), ['stale citers-aaaaaaaaaaaa/gone.json']);
    await writeIndex(dir, built);
    assert.deepEqual(compareIndex(await readIndex(dir), built), []);

    // And a whole directory from an earlier build, which is what a changed
    // citation makes: the hash is over the directory, so the name changes.
    const older = { files: { ...built.files } };
    delete older.files['citers-aaaaaaaaaaaa/one.json'];
    delete older.files['citers-aaaaaaaaaaaa/two.json'];
    older.files['citers-bbbbbbbbbbbb/one.json'] = '[3]\n';
    await writeIndex(dir, older);
    assert.deepEqual(await readIndex(dir), older.files);
    assert.deepEqual((await readdir(path.join(dir, 'index'))).sort(), ['citers-bbbbbbbbbbbb', 'manifest.json']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the committed fixture index is fresh', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  assert.deepEqual(compareIndex(await readIndex(FIXTURE_DATA), built), []);
});

test('an empty dataset builds a manifest with zero records and validates', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-empty-'));
  try {
    await writeFile(path.join(dir, 'regions.json'), '[]\n');
    const built = await buildIndex(dir);
    assert.deepEqual(JSON.parse(built.files['manifest.json']).counts, { events: 0, edges: 0, sources: 0, actors: 0, presences: 0, places: 0, relations: 0, offices: 0, tenures: 0, narratives: 0, regions: 0 });
    await writeIndex(dir, built);
    const result = await runValidation(dir, { index: true });
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the repository data/ validates and its index is fresh', async () => {
  const result = await runValidation(path.join(ROOT, 'data'), { index: true });
  assert.deepEqual(result.errors, [], JSON.stringify(result.errors, null, 1));
});

test('a point with no lane in reach blocks the index', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    // The lane is derived from the place now, so both overrides have to go
    // before the point is genuinely out of reach of every lane polygon.
    for (const [sub, id] of [['events', 'fixture-event-o'], ['places', 'fixture-place-o']]) {
      const file = path.join(dir, sub, `${id}.json`);
      const record = JSON.parse(await readFile(file, 'utf8'));
      record.region = null;
      await writeFile(file, JSON.stringify(record));
    }
    const built = await buildIndex(dir);
    assert.deepEqual(built.unresolved.map((e) => e.id), ['fixture-event-o']);
    const result = await runValidation(dir);
    assert.ok(result.errors.some((e) => e.rule === 10 && e.id === 'fixture-event-o'));
    assert.ok(result.errors.some((e) => e.rule === 10 && e.id === 'fixture-place-o'), 'the place is where the lane could not be found');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

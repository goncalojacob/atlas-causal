import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, writeFile, readdir, readFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  canonical, serialize, compact, buildIndex, writeIndex, readIndex, compareIndex, indexReport,
} from '../tools/build-index.mjs';
import { runValidation } from '../tools/validate.mjs';
import { buildTopology, eventWeights } from '../src/validate/core.js';
import { checkRules } from '../src/validate/rules.js';
import { expandSpine } from '../src/data.js';
import { buildQueue, inQueue, DIGEST_KEYS } from '../src/review/queue.js';
import { readRecords, readRegions, readRoles, readCategories } from '../tools/lib/read.mjs';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';

async function tempCopyOfFixtures() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-index-'));
  await cp(FIXTURE_DATA, dir, { recursive: true });
  return dir;
}

// R5: the graph file is parsed whole by every page on every device, and about
// a third of it was indentation. gzip hides that over the wire; JSON.parse does
// not. The files nobody reads with their eyes are written compact; every file
// somebody does read stays indented. `core` since I4b, which is what the whole
// corpus file became; the attribute shards are held to the same line below.
test('the core and the search shard are compact, and everything else is not', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    const built = await buildIndex(dir);
    const manifest = JSON.parse(built.files['manifest.json']);
    for (const key of ['core', 'search']) {
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
    const history = Object.keys(built.files).find((n) => n.startsWith('history-'));
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
  for (const key of ['core', 'search', 'sources', 'review']) {
    assert.match(manifest.files[key], new RegExp(`^index/${key}-[0-9a-f]{12}\\.json$`), key);
    assert.ok(Object.hasOwn(first.files, path.basename(manifest.files[key])), key);
  }
  assert.match(manifest.files.citers, /^index\/citers-[0-9a-f]{12}$/);
  // The histories are hashed files named in the manifest since I5, where they
  // were a directory of one file per record under `files.history` — the last
  // unhashed thing in an index served `immutable` (owner question 5).
  assert.equal(Object.hasOwn(manifest.files, 'history'), false);
  assert.equal(Object.keys(first.files).filter((name) => name.startsWith('history/')).length, 0);
  for (const shard of manifest.historyShards) {
    assert.match(shard.file, /^index\/history-[a-z]+-(?:-?\d+--?\d+|null|[a-z]+)-[0-9a-f]{12}\.json$/);
    assert.ok(Object.hasOwn(first.files, path.basename(shard.file)), shard.file);
  }
  // The queue's shards are named in the summary and not in the manifest,
  // which is fetched no-store on every page load and would otherwise carry a
  // line per kind for a page most readers never open.
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
  // 6 since I5: the generation goes up by one in every run that changes the
  // index's shape (index2-plan, D6).
  assert.equal(manifest.schema, 6);
  // `counts.presences` stays where it is: a count is not a file, and it is
  // what the manifest says about a dataset whether or not the file exists.
  assert.deepEqual(manifest.counts, { events: 12, edges: 10, sources: 4, actors: 4, presences: 3, places: 11, relations: 3, offices: 2, tenures: 4, narratives: 1, regions: 3 });
  // The whole-corpus file is not named and not written since I4b: the graph is
  // the core, and what the core drops is in the attribute shards.
  assert.equal(Object.hasOwn(manifest.files, 'spine'), false);
  assert.equal(Object.keys(built.files).filter((name) => name.startsWith('spine-')).length, 0);
  assert.match(manifest.files.core, /^index\/core-[0-9a-f]{12}\.json$/);
  assert.match(manifest.files.sources, /^index\/sources-[0-9a-f]{12}\.json$/);
  assert.match(manifest.files.presences, /^index\/presences-[0-9a-f]{12}\.json$/);
  assert.ok(Object.hasOwn(built.files, path.basename(manifest.files.core)));
  assert.ok(Object.hasOwn(built.files, path.basename(manifest.files.presences)));
  assert.equal(manifest.regions[0].id, 'fixture-lane-1');
  assert.deepEqual(manifest.land, []);
  // The four numbers per lane that replaced the 221 KB of polygons at first
  // paint (index2-plan, D2). Six decimals, so two builds agree to the byte.
  assert.deepEqual(Object.keys(manifest.regionBoxes).sort(), ['fixture-lane-1', 'fixture-lane-2', 'fixture-lane-3']);
  for (const box of Object.values(manifest.regionBoxes)) {
    assert.equal(box.length, 4);
    assert.ok(box.every((n) => Number.isFinite(n) && Math.round(n * 1e6) === n * 1e6), box.join(','));
    assert.ok(box[0] <= box[2] && box[1] <= box[3]);
  }
  // The lane an event is drawn in and how it was arrived at: derived here and
  // carried into the projection, except `regionMethod`, which nothing draws and
  // which the projection drops (h3a-brief, A3). So the lane is read off the
  // projection and the method off the build.
  // Read through the one decoder since I2: the file is positional rows over an
  // id table, and a test that read its slots by hand would be a second decoder.
  // `spineText` since I4b: the whole-corpus projection is built in memory for
  // the prerendered pages and no longer written out (A5).
  const spine = expandSpine(JSON.parse(built.spineText));
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
  // `roles` is the other list and stays what it was: the roles actually in
  // use. Until M32b-1 that was 163 free-text strings and this said so; since
  // the re-filing it is a *subset* of the vocabulary — 29 of the 31, in the
  // order they are used rather than the order the owner wrote them — so the
  // two lists are still not the same list, for a different reason than they
  // used to be. The assertion is the same assertion (amendment A12).
  assert.notDeepEqual(real.roles, real.rolesAllowed.map((r) => r.id));
  const vocabulary = new Set(real.rolesAllowed.map((r) => r.id));
  assert.deepEqual(real.roles.filter((role) => !vocabulary.has(role)), []);
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
  // Against the same topology the build used, vocabularies and all: without
  // them `category-unknown` and rule 25 would not fire here and the shards
  // would be compared against a shorter list than the one they were written
  // from.
  const rules = checkRules(records, buildTopology(records, regions, {
    roles: await readRoles(path.join(ROOT, 'data')),
    categories: await readCategories(path.join(ROOT, 'data')),
  }));
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

  // And every reviewable record's history, in the shards of its kind and
  // century: what the dashboard fetches when it opens one. One file per record
  // until I5, which is 1,027 of them on this data and 62,446 at 10^4 (D8).
  const shardsOfHistory = manifest.historyShards.map((s) => JSON.parse(built.files[path.basename(s.file)]));
  assert.deepEqual(
    shardsOfHistory.flatMap((shard) => Object.keys(shard.records)).sort(),
    records.filter((r) => r.kind !== 'presence').map((r) => r.id).sort(),
  );
  for (const [i, shard] of shardsOfHistory.entries()) {
    assert.equal(shard.kind, manifest.historyShards[i].kind);
    assert.equal(shard.from, manifest.historyShards[i].from);
    assert.equal(shard.to, manifest.historyShards[i].to);
  }
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
  const name = path.basename(JSON.parse(first.files['manifest.json']).files.core);
  // A tombstone carries no weight in the projection: it is drawn nowhere, and
  // the tombstone list is the five fields a card still needs (h3a-brief, A10).
  const events = expandSpine(JSON.parse(first.spineText)).events.filter((e) => e.status === 'active');
  assert.ok(events.every((e) => Number.isInteger(e.weight)), 'every active event in the index carries a weight');
  assert.ok(events.some((e) => e.weight > 0));
  // `weight` is a core column, so the file every page loads is the one that
  // has to come out the same twice.
  assert.equal(first.files[name], second.files[name]);
});

// ─── The core and the attribute shards (I3) ────────────────────────────────

test('the manifest names the core and the attribute shards, and both are written', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(built.files['manifest.json']);
  assert.equal(manifest.schema, 6);
  assert.match(manifest.files.core, /^index\/core-[0-9a-f]{12}\.json$/);
  assert.ok(Object.hasOwn(built.files, path.basename(manifest.files.core)));
  // The centuries in year order, then the two that answer no year: the places,
  // which have none, and the records whose interval is null (index2-plan, A8).
  const shards = manifest.attributeShards;
  assert.ok(shards.length > 2);
  for (const shard of shards) {
    assert.match(shard.file, /^index\/attributes-(?:-?\d+--?\d+|place|null)-[0-9a-f]{12}\.json$/);
    assert.ok(Object.hasOwn(built.files, path.basename(shard.file)), shard.file);
    // `key` is the middle of the file's own name: the loader matches a
    // record's filing key against it, and the two shards that answer no year
    // would otherwise be told apart by nothing.
    assert.equal(path.basename(shard.file), `attributes-${shard.key}-${path.basename(shard.file).slice(-17, -5)}.json`);
  }
  const years = shards.filter((s) => s.from !== null);
  assert.deepEqual(years.map((s) => s.from), [...years.map((s) => s.from)].sort((a, b) => a - b));
  assert.deepEqual(shards.slice(years.length).map((s) => s.key), ['null', 'place']);
  // Both are compact, for the reason the spine is: nobody reads a row of
  // integers with their eyes and every device that fetches one parses it whole.
  for (const name of [path.basename(manifest.files.core), path.basename(shards[0].file)]) {
    assert.equal(built.files[name].split('\n').length, 2, `${name} is one line and a newline`);
  }
  // And the switch is complete: every page reads the core, and the whole-corpus
  // file is neither named nor written (i4-brief, section 3).
  assert.equal(Object.hasOwn(manifest.files, 'spine'), false);
  assert.equal(Object.keys(built.files).filter((name) => name.startsWith('spine-')).length, 0);
});

test('the core and the shards do not change between builds', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(first.files['manifest.json']);
  const names = [path.basename(manifest.files.core), ...manifest.attributeShards.map((s) => path.basename(s.file))];
  assert.deepEqual(manifest.attributeShards, JSON.parse(second.files['manifest.json']).attributeShards);
  for (const name of names) assert.equal(first.files[name], second.files[name], name);
});

// A6: what the run is measured by. The totals are the files' own bytes, so a
// number written into STATUS.md is a number the build could print again.
test('the printed report totals are the bytes of the files it names', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(built.files['manifest.json']);
  const report = indexReport(built);
  const bytesOf = (file) => Buffer.byteLength(built.files[path.basename(file)], 'utf8');
  assert.equal(report.core.bytes, bytesOf(manifest.files.core));
  assert.equal(report.shards.length, manifest.attributeShards.length);
  assert.deepEqual(report.shards.map((s) => s.key), manifest.attributeShards.map((s) => s.key));
  const wanted = bytesOf(manifest.files.core)
    + manifest.attributeShards.reduce((n, s) => n + bytesOf(s.file), 0);
  assert.equal(report.totals.bytes, wanted);
  assert.ok(report.totals.gzip > 0 && report.totals.gzip < report.totals.bytes);
  // The search shard beside them: the other whole-corpus file every index.html
  // parses, so the next decision is taken against a number (index2-plan, A3).
  assert.equal(report.search.bytes, bytesOf(manifest.files.search));
  // And the projection the core is being compared with, which is built in
  // memory and not written since I4b: the report reads it off `spineText`.
  assert.equal(report.spine.bytes, Buffer.byteLength(built.spineText, 'utf8'));
});

// A4: the pattern that decides which files `readIndex` reads and `writeIndex`
// prunes. A file it does not match is a file a stale build leaves behind for
// ever, served `immutable` under a hash that no longer describes it.
test('every hashed file the build names matches the pattern, and a record could not', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    const built = await buildIndex(dir);
    await writeIndex(dir, built);
    const written = Object.keys(await readIndex(dir));
    for (const name of Object.keys(built.files)) assert.ok(written.includes(name), `${name} was not read back`);
    const HASHED = /^(?:(?:spine|search|sources|review|presences|core)-(?:[a-z]+-)?|(?:explanations|attributes)-(?:-?\d+--?\d+|null|[a-z]+)-|history-[a-z]+-(?:-?\d+--?\d+|null|[a-z]+)-)[0-9a-f]{12}\.json$/;
    for (const name of written.filter((n) => n !== 'manifest.json' && !n.includes('/'))) {
      assert.ok(HASHED.test(name), name);
    }
    // And nothing a record could be called: the index and the records share no
    // directory, but the pruning is by name and a name that matched both would
    // be the one mistake that cannot be undone.
    for (const name of ['carnation-revolution-1974.json', 'core-values.json', 'attributes-1900-1999.json',
      'spine.json', 'presences-of-portugal.json', 'attributes-place-not-a-hash.json',
      'history-of-portugal.json', 'history-event-1900-1999.json']) {
      assert.equal(HASHED.test(name), false, name);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeIndex removes stale hashed files and the result is fresh', async () => {
  const dir = await tempCopyOfFixtures();
  try {
    await mkdir(path.join(dir, 'index'), { recursive: true });
    // The whole-corpus file a build from before I4b left behind. It is not
    // written any more and `spine-` is still in `HASHED` for exactly this:
    // a rebuild is what removes it, and until it does it is served `immutable`
    // under a hash that describes a shape nothing here reads.
    await writeFile(path.join(dir, 'index', 'spine-deadbeef0000.json'), '{}\n');
    // A presence file from an earlier build: hashed and `immutable` like the
    // rest, so a name the fresh build does not write has to go (I1).
    await writeFile(path.join(dir, 'index', 'presences-deadbeef0000.json'), '{}\n');
    // And the two I3 added: a core and an attribute shard from an earlier
    // build, hashed and `immutable` like the rest.
    await writeFile(path.join(dir, 'index', 'core-deadbeef0000.json'), '{}\n');
    await writeFile(path.join(dir, 'index', 'attributes-1400-1499-deadbeef0000.json'), '{}\n');
    // And a history shard from an earlier build, hashed like the rest since I5:
    // it is what a record revised since then makes, because the hash is over
    // the shard's whole content and every version in it.
    await writeFile(path.join(dir, 'index', 'history-event-1400-1499-deadbeef0000.json'), '{}\n');
    await mkdir(path.join(dir, 'index', 'citers-deadbeef0000'), { recursive: true });
    await writeFile(path.join(dir, 'index', 'citers-deadbeef0000', 'fixture-source-a.json'), '[]\n');
    const built = await buildIndex(dir);
    await writeIndex(dir, built);
    // Keyed by the path relative to data/index/, so a citer file is named
    // here exactly as it is in the build: `citers-<hash>/<source-id>.json`.
    assert.deepEqual(Object.keys(await readIndex(dir)).sort(), Object.keys(built.files).sort());
    assert.ok(Object.keys(built.files).some((name) => /^citers-[0-9a-f]{12}\/.+\.json$/.test(name)));
    assert.deepEqual(
      Object.keys(await readIndex(dir)).filter((n) => n.startsWith('presences-')),
      [path.basename(JSON.parse(built.files['manifest.json']).files.presences)],
      'the stale presence file is gone and the fresh one is there',
    );
    assert.deepEqual(
      Object.keys(await readIndex(dir)).filter((n) => n.startsWith('spine-')),
      [],
      'the whole-corpus file a build from before I4b left is gone, and no new one is written',
    );
    assert.deepEqual(
      Object.keys(await readIndex(dir)).filter((n) => n.startsWith('core-')),
      [path.basename(JSON.parse(built.files['manifest.json']).files.core)],
      'the stale core is gone and the fresh one is there',
    );
    assert.deepEqual(
      Object.keys(await readIndex(dir)).filter((n) => n.startsWith('attributes-')).sort(),
      JSON.parse(built.files['manifest.json']).attributeShards.map((s) => path.basename(s.file)).sort(),
      'the stale shard is gone and every fresh one is there',
    );
    assert.deepEqual(
      Object.keys(await readIndex(dir)).filter((n) => n.startsWith('history-')).sort(),
      JSON.parse(built.files['manifest.json']).historyShards.map((s) => path.basename(s.file)).sort(),
      'the stale history shard is gone and every fresh one is there',
    );
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
    const manifest = JSON.parse(built.files['manifest.json']);
    assert.deepEqual(manifest.counts, { events: 0, edges: 0, sources: 0, actors: 0, presences: 0, places: 0, relations: 0, offices: 0, tenures: 0, narratives: 0, regions: 0 });
    // No presences: no file and no key, because absent is what says there are
    // none — the way an absent `rolesAllowed` says "no check" (M30a, A8). The
    // count above stays, because a count is not a file.
    assert.equal(Object.hasOwn(manifest.files, 'presences'), false);
    assert.deepEqual(Object.keys(built.files).filter((n) => n.startsWith('presences-')), []);
    // And no polygons: no boxes, which gives the atlas the empty map it had.
    assert.equal(Object.hasOwn(manifest, 'regionBoxes'), false);
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

// The loader reading the core and the attribute shards, which since I4b is the
// only graph loader there is: `docs/index2-plan.md` D5 said the split was to be
// emitted and measured before it was spent, and this is what said it could be
// spent at all.
//
// The claim is one sentence: **the core plus every shard is the atlas the
// spine builds**. Not "deep-equals an atlas" — an atlas is an object of Maps
// and closures, and `assert.deepEqual` on two of them compares function
// identity (index2 review, finding 19) — so it is the surface, then every Map
// key in order and every record by value, then the extent, the lanes, the
// adjacency and the five graph queries on every active event.
//
// Beside that: what an atlas from the core **alone** answers, which is the
// picture without the labels; the LRU that keeps a session that has read six
// centuries from holding six centuries; and the one thing `record()` waits for.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAtlasFromCore, createAtlasFromSpine, loadCore, ATTRIBUTE_SHARD_CAP } from '../src/data.js';
import { buildAttributeShards, buildCore, buildSpine } from '../src/validate/core.js';
import { ancestors, consequences, convergence, reachableBy, shortestPaths } from '../src/graph.js';
import { FIXTURE_DATA, ROOT, presencesOnDisk, topologyOf } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');
const DATASETS = [['the fixtures', FIXTURE_DATA], ['the repository', DATA]];

const read = async (dir, rel) => JSON.parse(await readFile(path.join(dir, rel), 'utf8'));
const refuse = () => Promise.reject(new Error('this atlas fetches nothing'));

// The surface A11 named for the spine, plus the two halves I3 adds — whether a
// record's attributes are in hand, and the way to ask for them.
const SURFACE = [
  'activeEvents', 'events', 'edges', 'adjacency', 'actors', 'places', 'sources',
  'relations', 'relationsByActor', 'narratives', 'activeNarratives', 'narrativesByRef',
  'eventsByActor', 'eventsByPlace', 'placeOf', 'pointOf', 'citationCount', 'resolve',
  'record', 'regions', 'extent', 'land', 'presences', 'presencesByActor',
  'dependenciesOf', 'presencesAt', 'presenceCoverage', 'territoryYear',
  'shardForYear', 'loadedGeometry', 'loadGeometry', 'hueOfActor',
  'presencesLoaded', 'loadPresences',
  'attributesLoaded', 'loadAttributes', 'attributesFor', 'attributeShardsIn', 'pinAttributes',
  // I4a: which shards a set of records is filed in, for the readers that are
  // per-entity and not windowed, and how many times the set in hand has
  // changed, for the four render keys.
  'attributeShardsOf', 'attributeShardsArrived',
];

// The two atlases: one from the spine, one from the core with as many shards
// in hand as the caller asks for. Both are handed the same sources index and
// the same presences, because neither is what this run split.
async function atlases(dir, { shards = 'every' } = {}) {
  const topology = await topologyOf(dir);
  const manifest = await read(dir, 'index/manifest.json');
  const sources = (await read(dir, manifest.files.sources)).sources;
  const presences = await presencesOnDisk(dir);
  const attributes = buildAttributeShards(topology).map(({ key, file }) => ({ key, file }));
  const pieces = { manifest, sources, presences, fetchJson: refuse };
  return {
    topology,
    fromSpine: createAtlasFromSpine({ ...pieces, spine: buildSpine(topology) }),
    fromCore: createAtlasFromCore({
      ...pieces,
      core: buildCore(topology),
      attributes: shards === 'every' ? attributes : [],
    }),
  };
}

const MAPS = ['events', 'edges', 'actors', 'places', 'relations', 'offices', 'tenures', 'narratives'];

for (const [label, dir] of DATASETS) {
  test(`the atlas from the core has every member a reader asks for, over ${label}`, async () => {
    const { fromCore, fromSpine } = await atlases(dir);
    for (const member of SURFACE) {
      assert.ok(member in fromCore, `missing ${member}`);
      if (member in fromSpine) assert.equal(typeof fromCore[member], typeof fromSpine[member], member);
    }
  });

  // The whole of the run's claim, record by record: what the two files say
  // together is what the one file said.
  test(`the core plus every shard is the atlas the spine builds, over ${label}`, async () => {
    const { fromCore, fromSpine } = await atlases(dir);
    let compared = 0;
    for (const map of MAPS) {
      assert.deepEqual([...fromCore[map].keys()], [...fromSpine[map].keys()], `${map}: the same ids in the same order`);
      for (const [id, want] of fromSpine[map]) {
        assert.deepEqual(fromCore[map].get(id), want, `${map}: ${id}`);
        compared += 1;
      }
    }
    assert.ok(compared > 0);
    assert.deepEqual(fromCore.extent, fromSpine.extent);
    assert.deepEqual(fromCore.regions, fromSpine.regions);
    assert.deepEqual([...fromCore.adjacency.edges.keys()].sort(), [...fromSpine.adjacency.edges.keys()].sort());
    assert.deepEqual(fromCore.activeEvents.map((e) => e.id), fromSpine.activeEvents.map((e) => e.id));
    assert.deepEqual(fromCore.activeNarratives.map((n) => n.id), fromSpine.activeNarratives.map((n) => n.id));
  });

  // The joins are what the unwindowed readers walk — an actor's events with
  // the role each time, an office's holders, what a narrative passes through —
  // and three of them are keyed or sorted by something a shard carries.
  test(`every join over the records says the same on both, over ${label}`, async () => {
    const { fromCore, fromSpine } = await atlases(dir);
    const rows = (atlas) => [...atlas.eventsByActor].map(([id, list]) => [id, list.map((r) => [r.event.id, r.role ?? null, r.note])]);
    assert.deepEqual(rows(fromCore), rows(fromSpine), 'eventsByActor, with the role and the note');
    const byPlace = (atlas) => [...atlas.eventsByPlace].map(([id, list]) => [id, list.map((e) => e.id)]);
    assert.deepEqual(byPlace(fromCore), byPlace(fromSpine));
    const offices = (atlas) => [...atlas.officesByActor].map(([id, list]) => [id, list.map((o) => o.id)]);
    assert.deepEqual(offices(fromCore), offices(fromSpine), 'officesByActor, in title order');
    const strips = (atlas) => [...atlas.tenuresByOffice].map(([id, list]) => [id, list.map((t) => t.id)]);
    assert.deepEqual(strips(fromCore), strips(fromSpine));
    const walks = (atlas) => [...atlas.narrativesByRef].map(([ref, list]) => [ref, list.map((n) => n.id)]).sort();
    assert.deepEqual(walks(fromCore), walks(fromSpine), 'narrativesByRef, out of the steps');
    const children = (atlas) => [...atlas.childrenOf].map(([id, list]) => [id, [...list]]).sort();
    assert.deepEqual(children(fromCore), children(fromSpine));
    const cites = (atlas) => fromSpine.activeEvents.map((e) => atlas.citationCount('event', e.id));
    assert.deepEqual(cites(fromCore), cites(fromSpine));
  });

  // What a reader gets before a single shard has landed: the whole graph, the
  // whole picture, and no labels. This is the argument of the split — the
  // convergence query is answered off the core alone.
  test(`the core alone answers every graph query, over ${label}`, async () => {
    const { fromCore, fromSpine } = await atlases(dir, { shards: 'none' });
    const ids = (rows) => rows.map((row) => (row.event ? row.event.id : row.id ?? row));
    let asked = 0;
    for (const event of fromSpine.activeEvents) {
      const id = event.id;
      assert.deepEqual(ids(consequences(fromCore.adjacency, id)), ids(consequences(fromSpine.adjacency, id)), id);
      assert.deepEqual([...ancestors(fromCore.adjacency, id)].sort(), [...ancestors(fromSpine.adjacency, id)].sort(), id);
      assert.deepEqual(
        convergence(fromCore.adjacency, id).map((row) => row.event.id),
        convergence(fromSpine.adjacency, id).map((row) => row.event.id),
        id,
      );
      assert.deepEqual([...shortestPaths(fromCore.adjacency, id).keys()].sort(), [...shortestPaths(fromSpine.adjacency, id).keys()].sort(), id);
      assert.deepEqual(
        reachableBy(fromCore.adjacency, id, 3).map((row) => row.event.id),
        reachableBy(fromSpine.adjacency, id, 3).map((row) => row.event.id),
        id,
      );
      asked += 1;
    }
    assert.ok(asked > 0);
  });

  // And what it does not answer. A mark, a bar and a node are drawn from the
  // core; a title is the id until the shard lands, and `attributesLoaded` is
  // what a card asks before it draws anything at all (index2 review, finding
  // 21).
  test(`a title is the id and nothing more until the shard lands, over ${label}`, async () => {
    const { fromCore, fromSpine } = await atlases(dir, { shards: 'none' });
    for (const event of fromCore.activeEvents) {
      assert.equal(event.title, event.id, event.id);
      assert.equal(event.citesCount, 0, event.id);
      assert.equal(fromCore.attributesLoaded(event.id), false, event.id);
      // The years are the core's own and are the numbers every scale uses, so
      // the picture is where it would have been.
      const wanted = fromSpine.events.get(event.id).when;
      assert.equal(intervalMin(event.when), intervalMin(wanted), event.id);
    }
    for (const actor of fromCore.actors.values()) assert.deepEqual(actor.names, []);
    // The atlas from the spine has every attribute the moment it exists, which
    // is what the default says.
    assert.equal(fromSpine.attributesLoaded('anything at all'), true);
  });
}

// The astronomical year an interval begins in: the one number the core keeps
// of a date, and the one the scales use.
function intervalMin(when) {
  const bound = when?.start;
  const value = bound === null || bound === undefined ? null : (typeof bound === 'object' ? bound.min : bound);
  return value === null ? null : (value < 0 ? value + 1 : value);
}

// ─── One shard at a time ───────────────────────────────────────────────────

// A file of no rows: the bookkeeping is what is under test here, not the
// merging, and six centuries of the fixtures do not exist to be fetched.
const EMPTY = { schema: 4, ids: [], vocab: {}, columns: {} };

async function loadingAtlas(shardCount, { fail = new Set() } = {}) {
  const topology = await topologyOf(FIXTURE_DATA);
  const shards = Array.from({ length: shardCount }, (unused, i) => ({
    key: `${1000 + i * 100}-${1099 + i * 100}`,
    file: `index/attributes-${1000 + i * 100}-${1099 + i * 100}-00000000000${i}.json`,
    from: 1000 + i * 100,
    to: 1099 + i * 100,
  }));
  const calls = [];
  const atlas = createAtlasFromCore({
    manifest: { schema: 4, regions: [], files: {}, attributeShards: shards },
    core: buildCore(topology),
    sources: [],
    dataRoot: 'nowhere/',
    fetchJson: async (url) => {
      calls.push(url);
      if (fail.has(url)) throw new Error('the train went into a tunnel');
      return EMPTY;
    },
  });
  return { atlas, shards, calls };
}

test('four shards are held and the fifth drops the first, which is then a new request', async () => {
  const { atlas, shards, calls } = await loadingAtlas(6);
  assert.equal(ATTRIBUTE_SHARD_CAP, 4);
  for (const shard of shards.slice(0, 4)) await atlas.loadAttributes(shard);
  assert.deepEqual(atlas.loadedAttributeShards(), shards.slice(0, 4).map((s) => s.key));
  assert.equal(calls.length, 4);

  // A shard already in hand is not asked for again.
  await atlas.loadAttributes(shards[0]);
  assert.equal(calls.length, 4);

  // The fifth evicts the least recently used, which is the second: asking for
  // the first again moved it to the end.
  await atlas.loadAttributes(shards[4]);
  assert.deepEqual(atlas.loadedAttributeShards(), [shards[2], shards[3], shards[0], shards[4]].map((s) => s.key));
  assert.equal(calls.length, 5);

  // And the one that was dropped really was dropped: asking for it is a
  // request and not a cache hit.
  await atlas.loadAttributes(shards[1]);
  assert.equal(calls.length, 6);
  assert.equal(atlas.loadedAttributeShards().length, 4);
});

// A5: a shard an open card, an entry page or a lens needs is pinned while it is
// on screen and never evicted, because those readers are per-entity and not
// windowed — an actor whose events span five centuries would otherwise be drawn
// incomplete for ever (index2 review, finding 9).
test('five pinned shards are all held, and the cap is over the rest', async () => {
  const { atlas, shards, calls } = await loadingAtlas(6);
  const release = atlas.pinAttributes(shards.slice(0, 5));
  for (const shard of shards.slice(0, 5)) await atlas.loadAttributes(shard);
  assert.equal(atlas.loadedAttributeShards().length, 5, 'a pin is not a cap');
  await atlas.loadAttributes(shards[5]);
  assert.equal(atlas.loadedAttributeShards().length, 6, 'the sixth is the only unpinned one');
  release();
  // Released, the five are ordinary again and the cap applies to all six.
  await atlas.loadAttributes(shards[0]);
  assert.equal(atlas.loadedAttributeShards().length, 4);
  assert.ok(calls.length >= 6);
});

test('a shard that failed to arrive is not the answer for the rest of the session', async () => {
  const first = await loadingAtlas(6, { fail: new Set(['nowhere/index/attributes-1000-1099-000000000000.json']) });
  await assert.rejects(first.atlas.loadAttributes(first.shards[0]), /tunnel/);
  assert.equal(first.atlas.loadedAttributeShards().length, 0);
  const second = await loadingAtlas(6);
  await second.atlas.loadAttributes(second.shards[0]);
  assert.deepEqual(second.atlas.loadedAttributeShards(), [second.shards[0].key]);
});

// Which shards a year and a window need, off the manifest's own list. The two
// that answer no year — the places and the records whose interval is null —
// come with the first century whatever the window is.
test('a year and a window name the shards they need', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const shards = [
    { key: '1100-1199', file: 'index/attributes-1100-1199-000000000000.json', from: 1100, to: 1199 },
    { key: '1200-1299', file: 'index/attributes-1200-1299-000000000000.json', from: 1200, to: 1299 },
    { key: 'null', file: 'index/attributes-null-000000000000.json', from: null, to: null },
    { key: 'place', file: 'index/attributes-place-000000000000.json', from: null, to: null },
  ];
  const atlas = createAtlasFromCore({
    manifest: { schema: 4, regions: [], files: {}, attributeShards: shards },
    core: buildCore(topology),
    sources: [],
    fetchJson: refuse,
  });
  assert.deepEqual(atlas.attributesFor(1150).map((s) => s.key), ['1100-1199', 'null', 'place']);
  assert.deepEqual(atlas.attributesFor(1450).map((s) => s.key), ['null', 'place']);
  assert.deepEqual(atlas.attributeShardsIn({ from: 1150, to: 1250 }).map((s) => s.key), ['1100-1199', '1200-1299', 'null', 'place']);
  assert.deepEqual(atlas.attributeShardsIn(null).map((s) => s.key), ['null', 'place']);
});

// ─── `record()` and the `?v=` (index2 review, finding 3) ───────────────────

test('a record asked for before its shard is still fetched with ?v=<revised>', async () => {
  const manifest = await read(FIXTURE_DATA, 'index/manifest.json');
  const calls = [];
  const fetchJson = async (url) => {
    calls.push(url);
    const rel = url.replace(/^tests\/fixtures\/data\//, '').split('?')[0];
    return read(FIXTURE_DATA, rel);
  };
  const { manifest: loaded, core } = await loadCore({ dataRoot: 'tests/fixtures/data/', fetchJson });
  // The graph file's own number is the manifest's, from I1 on: one generation
  // per artifact rather than two to forget to bump (data.js, D6).
  assert.equal(loaded.schema, 5);
  assert.equal(core.schema, 5);
  assert.match(calls[1], /^tests\/fixtures\/data\/index\/core-[0-9a-f]{12}\.json$/);

  const atlas = createAtlasFromCore({
    manifest,
    core,
    sources: [],
    dataRoot: 'tests/fixtures/data/',
    fetchJson,
  });
  const before = calls.length;
  assert.equal(atlas.attributesLoaded('fixture-event-a'), false);
  const record = await atlas.record('event', 'fixture-event-a');
  assert.equal(record.id, 'fixture-event-a');
  // The shard first — one request, and the record's own file after it, with
  // the day the index says it was last written.
  assert.match(calls[before], /^tests\/fixtures\/data\/index\/attributes-\d+-\d+-[0-9a-f]{12}\.json$/);
  assert.match(calls.at(-1), /^tests\/fixtures\/data\/events\/fixture-event-a\.json\?v=\d{4}-\d{2}-\d{2}$/);
  assert.equal(atlas.attributesLoaded('fixture-event-a'), true);
  // And the shard that landed on the way is the record's own, so the card that
  // asked has its title too.
  assert.equal(atlas.events.get('fixture-event-a').title.startsWith('Fixture'), true);
});

// I4a: the integer the four render keys carry. It counts changes to the set of
// shards in hand and not the size of it, because `applyShard` loads and then
// evicts: a fifth shard arriving over a full cap leaves the size at four while
// every record in the shard it dropped has just lost its title, and a view
// keyed on the size would skip exactly that redraw.
test('the arrival count moves on a shard landing and on a shard being dropped', async () => {
  const { atlas, shards } = await loadingAtlas(6);
  assert.equal(atlas.attributeShardsArrived(), 0);
  for (const shard of shards.slice(0, 4)) await atlas.loadAttributes(shard);
  assert.equal(atlas.attributeShardsArrived(), 4);
  assert.equal(atlas.loadedAttributeShards().length, 4);

  // A shard already in hand is not an arrival.
  await atlas.loadAttributes(shards[0]);
  assert.equal(atlas.attributeShardsArrived(), 4);

  // The fifth over a full cap: one arrival and one eviction, and the count of
  // shards held has not moved at all.
  await atlas.loadAttributes(shards[4]);
  assert.equal(atlas.loadedAttributeShards().length, 4, 'the same number are held');
  assert.equal(atlas.attributeShardsArrived(), 6, 'and two things happened to them');
});

// The shards a set of records is filed in, which is what a card, an entry page
// and a lens ask for: those readers are per-entity and not windowed
// (index2 review, finding 9).
test('the shards of a set of records are the manifest entries, deduplicated and in order', async () => {
  const { fromCore } = await atlases(FIXTURE_DATA);
  const every = fromCore.attributeShardsOf(fromCore.activeEvents.map((e) => e.id));
  assert.ok(every.length > 0, 'the fixtures span at least one century');
  assert.deepEqual(every, fromCore.attributeShards.filter((s) => every.includes(s)), 'the manifest order');
  assert.equal(new Set(every.map((s) => s.key)).size, every.length, 'no shard twice');

  // One record asks for one shard, and it is the one `attributesLoaded` reads.
  const one = fromCore.activeEvents[0];
  const its = fromCore.attributeShardsOf([one.id]);
  assert.equal(its.length, 1, `${one.id} is filed once`);
  assert.ok(every.some((s) => s.key === its[0].key));

  // An id the atlas has never heard of is filed nowhere and asks for nothing.
  assert.deepEqual(fromCore.attributeShardsOf(['no-such-record']), []);
});

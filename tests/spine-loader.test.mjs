// The safety net the whole index cycle is held to (docs/index2-plan.md,
// section 1, "Robust"): an atlas built from **the files this repository has
// committed** against an atlas built from `buildTopology`'s own output, which
// is what says the projection drops nothing a reader wants. Every run in the
// cycle keeps this test and none of them edits it to pass.
//
// `topology` here is not a file: it is what `buildTopology` builds in memory
// out of the records. What is on disk since I4b is the core and the attribute
// shards, and `atlasOf` reads all of them (helpers.mjs) — so this is the
// committed index against the records, where `core-loader.test.mjs` is the
// two halves against their own definition, built in memory.
//
// The surface A11 named is that file's list now, asserted there on the same
// atlas this one builds: one hand-written list of names and not two.
//
// Beside all that: the edge tuple expanded back, the fetching discipline, and
// the two readers that do not go through an atlas at all, search and
// `retractionPlan`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { buildSearchIndex, search, flatten } from '../src/search.js';
import { retractionPlan } from '../src/review/sign.js';
import { edgeId } from '../src/vocab.js';
import { atlasFromTopology, atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');
const DATASETS = [['the fixtures', FIXTURE_DATA], ['the repository', DATA]];

const read = async (dir, rel) => JSON.parse(await readFile(path.join(dir, rel), 'utf8'));

// A fetchJson over a directory, counting what it was asked for, so the
// caching can be observed rather than assumed.
// The query string goes before the path is read, as a server drops it: a
// record is asked for as `<id>.json?v=<revised>` since H3b, and the `?v=` is
// a hint to the cache rather than part of the file's name (data.js).
function reader(dir, calls) {
  return async (url) => {
    calls.push(url);
    return read(dir, url.split('?')[0].replace(/^[a-z/-]*?(?=index\/|geo\/|events\/)/, ''));
  };
}

for (const [label, dir] of DATASETS) {
  test(`the same records, the same ids, the same order, over ${label}`, async () => {
    const fromIndex = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    for (const map of ['events', 'edges', 'actors', 'places', 'presences', 'relations', 'narratives', 'sources']) {
      assert.deepEqual([...fromIndex[map].keys()], [...topology[map].keys()], map);
    }
    assert.deepEqual(fromIndex.activeEvents.map((e) => e.id), topology.activeEvents.map((e) => e.id));
    assert.deepEqual(fromIndex.extent, topology.extent);
    assert.deepEqual(fromIndex.regions, topology.regions);
    assert.deepEqual(fromIndex.activeNarratives.map((n) => n.id), topology.activeNarratives.map((n) => n.id));
  });

  // The five slots become an object again, and the id is synthesised from the
  // three parts `EDGE_ID` matches. An edge that carries an alias or a merge
  // hop is written whole in the spine and keeps the id it was given (A2).
  test(`every edge comes back with its id, its type, its confidence and its status, over ${label}`, async () => {
    const fromIndex = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    assert.ok(topology.edges.size > 0);
    for (const [id, edge] of topology.edges) {
      const got = fromIndex.edges.get(id);
      assert.ok(got, `${id}: not in the index`);
      assert.deepEqual(
        [got.id, got.from, got.to, got.type, got.confidence, got.status],
        [edge.id, edge.from, edge.to, edge.type, edge.confidence, edge.status],
      );
      assert.equal(got.id, edge.id === edgeId(edge) ? edgeId(got) : edge.id);
    }
  });

  // What keeps a retracted argument out of consequences and convergence: the
  // fifth slot. The fixtures hold one on purpose.
  test(`a retracted edge resolves and is not walkable, over ${label}`, async () => {
    const fromIndex = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    const retracted = [...topology.edges.values()].filter((e) => e.status !== 'active');
    for (const edge of retracted) {
      assert.equal(fromIndex.edges.get(edge.id).status, edge.status);
      assert.equal((fromIndex.adjacency.out.get(edge.from) ?? []).some((e) => e.id === edge.id), false, edge.id);
    }
    assert.deepEqual(
      [...fromIndex.adjacency.edges.keys()].sort(),
      [...topology.adjacency.edges.keys()].sort(),
    );
  });

  // An old link still opens: `aliases` and `supersededBy` are in the spine on
  // every record, empty or not, because they are the hops `resolve()` walks.
  test(`resolve answers the same for every id, alias and tombstone, over ${label}`, async () => {
    const fromIndex = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    const shape = (found) => (found ? [found.kind, found.record.id, found.via] : null);
    const ids = new Set();
    for (const map of ['events', 'edges', 'actors', 'places', 'narratives']) {
      for (const [id, record] of topology[map]) {
        ids.add(id);
        for (const alias of record.aliases ?? []) ids.add(alias);
      }
    }
    let hops = 0;
    for (const id of ids) {
      assert.deepEqual(shape(fromIndex.resolve(id)), shape(topology.resolve(id)), id);
      if ((topology.resolve(id)?.via ?? []).length) hops += 1;
    }
    assert.equal(fromIndex.resolve('no-such-record-anywhere'), null);
    assert.ok(hops > 0, 'the dataset has at least one alias or merged record to follow');
  });

  // A8: the same number, counted out of the sources index on one path and
  // read off the record on the other. A tombstone cites nothing, which is
  // zero either way.
  test(`citationCount says the same on both paths, over ${label}`, async () => {
    const fromIndex = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    let counted = 0;
    for (const [kind, map] of [['event', 'events'], ['actor', 'actors'], ['place', 'places']]) {
      for (const id of topology[map].keys()) {
        const wanted = topology.citationCount(kind, id);
        assert.equal(fromIndex.citationCount(kind, id), wanted, `${kind}:${id}`);
        if (wanted > 0) counted += 1;
      }
    }
    assert.ok(counted > 0, 'nothing in this dataset cites anything');
  });

  // A9, the loader's half: the shard test proves the *file* answers as the
  // topology does; this proves the *atlas* does, which is what the search box
  // is actually handed (search-box.js builds its index off the atlas).
  test(`the search box answers the same off either atlas, over ${label}`, async () => {
    const fromIndex = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    const indexOf = (atlas) => buildSearchIndex({
      events: atlas.activeEvents,
      actors: [...atlas.actors.values()],
      places: [...atlas.places.values()],
      sources: [...atlas.sources.values()],
    });
    const shape = (result) => ({
      total: result.total,
      groups: result.groups.map((g) => g.kind),
      items: flatten(result).map((item) => [item.kind, item.id, item.rank, item.matched]),
    });
    const queries = dir === FIXTURE_DATA
      ? ['fix', 'event a', 'place', 'source 3', 'polity', 'fixture-event-a', 'zzzz']
      : ['sal', 'carn', 'lisb', 'oliveira', 'angola', 'carnation-revolution', 'zzzz'];
    const fromDisk = indexOf(fromIndex);
    const fromTopology = indexOf(topology);
    assert.deepEqual(fromDisk, fromTopology, 'the entries themselves, terms and all');
    let answered = 0;
    for (const query of queries) {
      const got = search(fromDisk, query);
      assert.deepEqual(shape(got), shape(search(fromTopology, query)), `"${query}"`);
      if (got.total > 0) answered += 1;
    }
    assert.ok(answered >= 3, `only ${answered} of the queries found anything`);
  });
}

// ─── retractionPlan off a pre-fetched citers map ───────────────────────────

// A7: the dashboard fetches one citer file for the source in hand, and the
// plan answers off that file alone — it reads `kind` and `id` and nothing
// else. Since H3b that file is the only place the rows are.
test('retractionPlan reads a pre-fetched citers map, in either shape', async () => {
  const manifest = await read(DATA, 'index/manifest.json');
  const sources = (await read(DATA, manifest.files.sources)).sources;
  const cited = sources.filter((s) => s.citationCount > 0);
  assert.ok(cited.length > 3);
  for (const source of cited) {
    const file = await read(DATA, `${manifest.files.citers}/${source.id}.json`);
    // The map a dashboard would hold: this source's rows and no others.
    const asMap = retractionPlan({ kind: 'source', id: source.id }, { citers: new Map([[source.id, file.citations]]) });
    const asObject = retractionPlan({ kind: 'source', id: source.id }, { citers: { [source.id]: file.citations } });
    assert.deepEqual(asMap, asObject, source.id);
    assert.equal(asMap.blockers.length, source.citationCount, source.id);
  }
});

// A source whose file was never fetched is not a source with no citers: an
// empty map answers empty, and so does the sources index now that the rows
// have left it. Both are why review/main.js fetches the file first and
// refuses to retract at all when that fetch fails.
test('a citers map that was never filled answers empty, index and all', async () => {
  const manifest = await read(DATA, 'index/manifest.json');
  const sources = (await read(DATA, manifest.files.sources)).sources;
  const busiest = [...sources].sort((a, b) => b.citationCount - a.citationCount)[0];
  assert.ok(busiest.citationCount > 100, 'one source carries most of the citations');
  assert.deepEqual(retractionPlan({ kind: 'source', id: busiest.id }, { citers: new Map() }), { retract: [], blockers: [] });
  assert.deepEqual(retractionPlan({ kind: 'source', id: busiest.id }, { sources }).blockers, []);
});

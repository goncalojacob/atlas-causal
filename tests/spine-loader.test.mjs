// The loader reading the spine: loadSpine() and createAtlasFromSpine(), from
// the second half of H3a (docs/health/h3a-brief.md, A0). Every page reads it
// since H3b and there is no other graph file since H3c.
//
// `topology` here is not a file: it is what `buildTopology` builds in memory
// out of the records, which is what `buildSpine` projects and what the rules
// read. Asserting the atlas built from the projection against the atlas built
// from what was projected is what says the projection drops nothing a reader
// wants — the seven card, page and query suites made the same point by
// running twice while both files existed (A12), and they run once now.
//
// Beside that: the surface A11 names, the edge tuple expanded back, the
// fetching discipline, and the two readers that do not go through an atlas at
// all, search and `retractionPlan`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAtlasFromSpine, loadSpine } from '../src/data.js';
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

// ─── The surface ───────────────────────────────────────────────────────────

// A11, from an audit of every reader under `src/`: what `graph.js`,
// `horizon.js`, `lens.js` and the views ask an atlas for. Written out because
// this is the one place the promise is a list of names rather than a
// behaviour — the behaviour is the seven parameterised suites.
const SURFACE = [
  'activeEvents', 'events', 'edges', 'adjacency', 'actors', 'places', 'sources',
  'relations', 'relationsByActor', 'narratives', 'activeNarratives', 'narrativesByRef',
  'eventsByActor', 'eventsByPlace', 'placeOf', 'pointOf', 'citationCount', 'resolve',
  'record', 'regions', 'extent', 'land', 'presences', 'presencesByActor',
  'dependenciesOf', 'presencesAt', 'presenceCoverage', 'territoryYear',
  'shardForYear', 'loadedGeometry', 'loadGeometry', 'hueOfActor',
  // I1: the presences are their own file, so the atlas has the two halves
  // every deferred load here has — the answer if it is in hand, and the way
  // to ask for it.
  'presencesLoaded', 'loadPresences',
];

for (const [label, dir] of DATASETS) {
  test(`the atlas built from the spine has every member a reader asks for, over ${label}`, async () => {
    const spine = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    for (const member of SURFACE) {
      assert.ok(member in spine, `missing ${member}`);
      assert.equal(typeof spine[member], typeof topology[member], member);
    }
  });

  test(`the same records, the same ids, the same order, over ${label}`, async () => {
    const spine = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    for (const map of ['events', 'edges', 'actors', 'places', 'presences', 'relations', 'narratives', 'sources']) {
      assert.deepEqual([...spine[map].keys()], [...topology[map].keys()], map);
    }
    assert.deepEqual(spine.activeEvents.map((e) => e.id), topology.activeEvents.map((e) => e.id));
    assert.deepEqual(spine.extent, topology.extent);
    assert.deepEqual(spine.regions, topology.regions);
    assert.deepEqual(spine.activeNarratives.map((n) => n.id), topology.activeNarratives.map((n) => n.id));
  });

  // The five slots become an object again, and the id is synthesised from the
  // three parts `EDGE_ID` matches. An edge that carries an alias or a merge
  // hop is written whole in the spine and keeps the id it was given (A2).
  test(`every edge comes back with its id, its type, its confidence and its status, over ${label}`, async () => {
    const spine = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    assert.ok(topology.edges.size > 0);
    for (const [id, edge] of topology.edges) {
      const got = spine.edges.get(id);
      assert.ok(got, `${id}: not in the spine`);
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
    const spine = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    const retracted = [...topology.edges.values()].filter((e) => e.status !== 'active');
    for (const edge of retracted) {
      assert.equal(spine.edges.get(edge.id).status, edge.status);
      assert.equal((spine.adjacency.out.get(edge.from) ?? []).some((e) => e.id === edge.id), false, edge.id);
    }
    assert.deepEqual(
      [...spine.adjacency.edges.keys()].sort(),
      [...topology.adjacency.edges.keys()].sort(),
    );
  });

  // An old link still opens: `aliases` and `supersededBy` are in the spine on
  // every record, empty or not, because they are the hops `resolve()` walks.
  test(`resolve answers the same for every id, alias and tombstone, over ${label}`, async () => {
    const spine = await atlasOf(dir);
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
      assert.deepEqual(shape(spine.resolve(id)), shape(topology.resolve(id)), id);
      if ((topology.resolve(id)?.via ?? []).length) hops += 1;
    }
    assert.equal(spine.resolve('no-such-record-anywhere'), null);
    assert.ok(hops > 0, 'the dataset has at least one alias or merged record to follow');
  });

  // A8: the same number, counted out of the sources index on one path and
  // read off the record on the other. A tombstone cites nothing, which is
  // zero either way.
  test(`citationCount says the same on both paths, over ${label}`, async () => {
    const spine = await atlasOf(dir);
    const topology = await atlasFromTopology(dir);
    let counted = 0;
    for (const [kind, map] of [['event', 'events'], ['actor', 'actors'], ['place', 'places']]) {
      for (const id of topology[map].keys()) {
        const wanted = topology.citationCount(kind, id);
        assert.equal(spine.citationCount(kind, id), wanted, `${kind}:${id}`);
        if (wanted > 0) counted += 1;
      }
    }
    assert.ok(counted > 0, 'nothing in this dataset cites anything');
  });

  // A9, the loader's half: the shard test proves the *file* answers as the
  // topology does; this proves the *atlas* does, which is what the search box
  // is actually handed (search-box.js builds its index off the atlas).
  test(`the search box answers the same off either atlas, over ${label}`, async () => {
    const spine = await atlasOf(dir);
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
    const fromSpine = indexOf(spine);
    const fromTopology = indexOf(topology);
    assert.deepEqual(fromSpine, fromTopology, 'the entries themselves, terms and all');
    let answered = 0;
    for (const query of queries) {
      const got = search(fromSpine, query);
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

// ─── loadSpine ─────────────────────────────────────────────────────────────

test('loadSpine reads the manifest every time and the spine once', async () => {
  const calls = [];
  const options = { dataRoot: 'tests/fixtures/data/', fetchJson: reader(FIXTURE_DATA, calls) };
  const first = await loadSpine(options);
  assert.equal(calls[0], 'tests/fixtures/data/index/manifest.json');
  assert.match(calls[1], /^tests\/fixtures\/data\/index\/spine-[0-9a-f]{12}\.json$/);
  // The graph file's own number is the manifest's, from I1 on: one generation
  // per artifact rather than two to forget to bump (data.js, D6).
  assert.equal(first.spine.schema, 3);
  assert.equal(first.spine.events.length, 12);

  const before = calls.length;
  const second = await loadSpine(options);
  // The manifest again — it is read `no-store`, which is how a new build is
  // noticed — and the spine not: it is named by its own hash and immutable.
  assert.deepEqual(calls.slice(before), ['tests/fixtures/data/index/manifest.json']);
  assert.equal(second.spine, first.spine, 'the same object, not a second parse');
});

test('a spine that failed to arrive is not the answer for the rest of the session', async () => {
  const spine = 'index/spine-000000000000.json';
  let fail = true;
  const fetchJson = async (url) => {
    if (url.endsWith('manifest.json')) return { schema: 3, files: { spine } };
    if (fail) throw new Error('the train went into a tunnel');
    return { schema: 3, events: [], edges: [] };
  };
  await assert.rejects(loadSpine({ dataRoot: 'nowhere/', fetchJson }), /tunnel/);
  fail = false;
  // The next attempt really is one, rather than the cached rejection.
  const { spine: loaded } = await loadSpine({ dataRoot: 'nowhere/', fetchJson });
  assert.deepEqual(loaded.events, []);
});

test('createAtlasFromSpine takes the pieces loadSpine hands it', async () => {
  const calls = [];
  const { manifest, spine } = await loadSpine({ dataRoot: 'tests/fixtures/data/', fetchJson: reader(FIXTURE_DATA, calls) });
  const sources = await read(FIXTURE_DATA, manifest.files.sources);
  const atlas = createAtlasFromSpine({
    manifest,
    spine,
    sources: sources.sources,
    dataRoot: 'tests/fixtures/data/',
    fetchJson: reader(FIXTURE_DATA, calls),
  });
  assert.equal(atlas.events.size, 12);
  assert.equal(atlas.activeEvents.length, 11);
  assert.equal(atlas.sources.size, 4);
  assert.deepEqual(atlas.extent, { min: 1200, max: 1300 });
  // Record text is still fetched on demand and is not in any index file —
  // asked for with the day the record was last written, which the spine
  // carries for exactly this (H3b).
  const record = await atlas.record('event', 'fixture-event-a');
  assert.equal(record.summary.startsWith('Synthetic record'), true);
  assert.match(calls.at(-1), /^tests\/fixtures\/data\/events\/fixture-event-a\.json\?v=\d{4}-\d{2}-\d{2}$/);
});

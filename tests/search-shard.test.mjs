// The search shard: what the search box scans, folded at build time instead
// of on every page load (docs/health/h3a-brief.md, A9). The promise is not
// that it holds the same *terms* as the box builds today — that would pass
// with the ranking broken — but that it answers the same queries with the
// same list, in the same order.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildSearchIndex, search, flatten } from '../src/search.js';
import { buildIndex } from '../tools/build-index.mjs';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');

async function shardAndTopology(dataDir) {
  const built = await buildIndex(dataDir);
  const manifest = JSON.parse(built.files['manifest.json']);
  const shard = JSON.parse(built.files[path.basename(manifest.files.search)]);
  return { built, manifest, shard, topology: built.topology };
}

// What a reader sees, reduced to what can be compared: the groups in their
// order, the items in theirs, and the rank each match was given.
const shape = (result) => ({
  query: result.query,
  total: result.total,
  groups: result.groups.map((g) => g.kind),
  items: flatten(result).map((item) => [item.kind, item.id, item.rank, item.matched]),
});

// A prefix, a word inside a name, a substring, a creator's surname, an id
// with its hyphens, and two that find nothing — the last because an empty
// answer compared against an empty answer proves nothing on its own.
const QUERIES = {
  fixtures: ['fix', 'event a', 'place', 'source 3', 'polity', 'fixture-event-a', 'zzzz'],
  repository: ['sal', 'carn', 'lisb', 'oliveira', 'angola', 'carnation-revolution', 'q', 'zzzz'],
};

for (const [label, dir, queries] of [['the fixtures', FIXTURE_DATA, QUERIES.fixtures], ['the repository', DATA, QUERIES.repository]]) {
  test(`the shard answers as the topology does over ${label}`, async () => {
    const { shard, topology } = await shardAndTopology(dir);
    const fromTopology = buildSearchIndex(topology);
    let answered = 0;
    for (const query of queries) {
      const wanted = search(fromTopology, query);
      const got = search(shard.entries, query);
      assert.deepEqual(shape(got), shape(wanted), `"${query}"`);
      if (got.total > 0) answered += 1;
    }
    assert.ok(answered >= 3, `only ${answered} of the queries found anything`);
  });

  test(`the shard holds every active record the box searches over ${label}`, async () => {
    const { shard, topology } = await shardAndTopology(dir);
    const expected = buildSearchIndex(topology);
    assert.equal(shard.entries.length, expected.length);
    assert.deepEqual(shard.entries.map((e) => `${e.kind}:${e.id}`), expected.map((e) => `${e.kind}:${e.id}`));
    for (const [i, entry] of shard.entries.entries()) {
      // A9: the label, the detail line, the ranking weight, the interval the
      // result prints, the folded terms — and the variants, which are what
      // makes "PIDE" and "DGS" one row on the screen.
      assert.equal(entry.status, 'active');
      assert.deepEqual(entry.terms, expected[i].terms);
      assert.equal(entry.label, expected[i].label);
      assert.equal(entry.detail, expected[i].detail);
      assert.equal(entry.weight, expected[i].weight);
      assert.deepEqual(entry.when, expected[i].when);
      assert.deepEqual(entry.variants ?? null, expected[i].variants ?? null);
      assert.ok(entry.terms.every((t) => t === t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()), `${entry.id}: folded`);
    }
    // Nothing retracted is findable: a tombstone resolves its own URL and is
    // not offered as an answer.
    const tombstones = new Set(topology.events.filter((e) => e.status !== 'active').map((e) => e.id));
    assert.ok(shard.entries.every((e) => !tombstones.has(e.id)));
  });
}

test('the search shard is named in the manifest and stable between builds', async () => {
  const first = await shardAndTopology(FIXTURE_DATA);
  const second = await shardAndTopology(FIXTURE_DATA);
  assert.match(first.manifest.files.search, /^index\/search-[0-9a-f]{12}\.json$/);
  const name = path.basename(first.manifest.files.search);
  assert.equal(first.built.files[name], second.built.files[name]);
});

// A9: findSimilar, which the contribution form runs against every candidate,
// keeps its three inputs — and all three are in the spine, so the form does
// not need the shard as well.
test('what findSimilar reads is in the spine, not only in the shard', async () => {
  const { built, manifest } = await shardAndTopology(DATA);
  const spine = JSON.parse(built.files[path.basename(manifest.files.spine)]);
  for (const event of spine.events) {
    assert.ok(Object.hasOwn(event, 'title') && Object.hasOwn(event, 'id') && Object.hasOwn(event, 'aliases'), event.id);
  }
});

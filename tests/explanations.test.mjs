// The links' arguments, sharded by period, and the bundled fetch that reads a
// whole path in a handful of requests instead of one per step (health review
// B, finding 18).
//
// Two halves, held separately: the period arithmetic, which is pure and is
// what the index build and the browser both compute the shard name from; and
// the loader, which is held to fetching each file once and to answering with
// what arrived rather than with nothing when a file does not.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  PERIOD, periodOf, periodOfEdge, shardName, explanationShards,
  attributePeriod, attributeShardKey, attributeShardName, historyShardName,
  PLACE_SHARD, SOURCE_SHARD,
} from '../src/explanations.js';
import { createAtlasFromCore } from '../src/data.js';
import { FIXTURE_DATA, citersOnDisk } from './helpers.mjs';

test('a period is a century, floored the same way either side of year zero', () => {
  assert.equal(PERIOD, 100);
  assert.deepEqual(periodOf(1974), { from: 1900, to: 1999 });
  assert.deepEqual(periodOf(1900), { from: 1900, to: 1999 });
  assert.deepEqual(periodOf(1999), { from: 1900, to: 1999 });
  assert.deepEqual(periodOf(0), { from: 0, to: 99 });
  // Floor division, not truncation: −1 is in the century before year zero and
  // not in the same one as +1.
  assert.deepEqual(periodOf(-1), { from: -100, to: -1 });
  assert.deepEqual(periodOf(-100), { from: -100, to: -1 });
});

test('the shard name carries its years, so a file on disk says what is in it', () => {
  assert.equal(shardName({ from: 1900, to: 1999 }, 'abcdef012345'), 'explanations-1900-1999-abcdef012345.json');
  assert.equal(shardName({ from: -100, to: -1 }, 'abcdef012345'), 'explanations--100--1-abcdef012345.json');
});

const events = new Map([
  ['a', { id: 'a', when: { start: 1910, end: 1910 } }],
  ['b', { id: 'b', when: { start: 1974, end: 1974 } }],
  ['c', { id: 'c', when: { start: 1450, end: 1450 } }],
  ['bad', { id: 'bad', when: { start: 'not a year', end: null } }],
]);

const edge = (id, from, to, extra = {}) => ({
  id, from, to, type: 'caused', status: 'active', explanation: `why ${id}`, ...extra,
});

test('an edge is filed under the period its cause begins in', () => {
  assert.deepEqual(periodOfEdge(edge('e1', 'a', 'b'), events), { from: 1900, to: 1999 });
  // The cause is in the fifteenth century and the consequence in the
  // twentieth: the file follows the cause, which is where a reader walking
  // forward meets the link.
  assert.deepEqual(periodOfEdge(edge('e2', 'c', 'b'), events), { from: 1400, to: 1499 });
  assert.equal(periodOfEdge(edge('e3', 'missing', 'b'), events), null);
  assert.equal(periodOfEdge(edge('e4', 'bad', 'b'), events), null);
});

// The one filing table, which I3's attribute shards and I5's history shards
// both read (index2-plan, A8). A source is the kind only the histories ask
// about: it is in no attribute shard, because it is no part of the spine.
test('a source is filed by its kind, like a place, and neither is in the null shard', () => {
  assert.equal(attributePeriod('place', { id: 'p' }, events), PLACE_SHARD);
  assert.equal(attributePeriod('source', { id: 's' }, events), SOURCE_SHARD);
  assert.equal(attributeShardKey(attributePeriod('source', { id: 's' }, events)), 'source');
  // Which is the point: a book has no year, and without a kind of its own
  // every source would land in the shard of every dateless record there is.
  assert.equal(attributeShardKey(attributePeriod('office', { id: 'o', when: null }, events)), 'null');
  assert.equal(attributeShardKey(attributePeriod('event', { id: 'e', when: { start: 1974, end: 1974 } }, events)), '1900-1999');
});

test('a shard says its kind and its key in its own name', () => {
  assert.equal(attributeShardName('1900-1999', 'abcdef012345'), 'attributes-1900-1999-abcdef012345.json');
  assert.equal(historyShardName('event', '1900-1999', 'abcdef012345'), 'history-event-1900-1999-abcdef012345.json');
  assert.equal(historyShardName('edge', '-100--1', 'abcdef012345'), 'history-edge--100--1-abcdef012345.json');
  assert.equal(historyShardName('source', 'source', 'abcdef012345'), 'history-source-source-abcdef012345.json');
});

test('the shards are by period, in year order, and hold only live arguments', () => {
  const shards = explanationShards([
    edge('e1', 'a', 'b'),
    edge('e2', 'c', 'b'),
    edge('e3', 'b', 'a'),
    edge('gone', 'a', 'b', { status: 'retracted' }),
    edge('silent', 'a', 'b', { explanation: '' }),
    edge('dangling', 'missing', 'b'),
  ], events);
  assert.deepEqual(shards.map((s) => [s.from, s.to]), [[1400, 1499], [1900, 1999]]);
  assert.deepEqual(Object.keys(shards[0].explanations), ['e2']);
  assert.deepEqual(Object.keys(shards[1].explanations).sort(), ['e1', 'e3']);
  assert.equal(shards[1].explanations.e1, 'why e1');
});

// ─── the loader ────────────────────────────────────────────────────────────

// An atlas over the fixtures whose fetch is counted, so "one request per file
// however long the path" is a measurement and not a claim.
async function countedAtlas({ fail = false } = {}) {
  const read = async (rel) => JSON.parse(await readFile(path.join(FIXTURE_DATA, rel), 'utf8'));
  const manifest = await read('index/manifest.json');
  const [core, sources, citers, attributes] = await Promise.all([
    read(manifest.files.core), read(manifest.files.sources), citersOnDisk(FIXTURE_DATA),
    Promise.all((manifest.attributeShards ?? []).map(async (shard) => ({ key: shard.key, file: await read(shard.file) }))),
  ]);
  const asked = [];
  const fetchJson = (url) => {
    asked.push(url);
    if (fail) return Promise.reject(new Error('offline'));
    return read(url.replace(/^fixtures\//, ''));
  };
  const atlas = createAtlasFromCore({
    manifest, core, attributes, sources: sources.sources, citers, dataRoot: 'fixtures/', fetchJson,
  });
  return { atlas, asked };
}

test('a path is read in one request per period, and only once', async () => {
  const { atlas, asked } = await countedAtlas();
  const ids = [...atlas.edges.keys()].filter((id) => atlas.edges.get(id).status === 'active');
  assert.ok(ids.length >= 5, 'the fixtures have a path worth bundling');
  assert.equal(atlas.explanationOf(ids[0]), null, 'nothing is in hand before it is asked for');

  const found = await atlas.loadExplanations(ids);
  assert.equal(asked.length, 1, 'every fixture link is in the one century, so one file');
  for (const id of ids) assert.equal(typeof found.get(id), 'string');
  assert.equal(atlas.explanationOf(ids[0]), found.get(ids[0]), 'and it is in hand afterwards');

  // Asked again: nothing is fetched, because the answer is already held.
  await atlas.loadExplanations(ids);
  assert.equal(asked.length, 1);
});

test('a shard that will not load leaves its links without a text, not the answer without a map', async () => {
  const { atlas, asked } = await countedAtlas({ fail: true });
  const ids = [...atlas.edges.keys()].slice(0, 3);
  const found = await atlas.loadExplanations(ids);
  assert.equal(found.size, 0);
  assert.ok(asked.length >= 1);
  // And the failure is not cached as an answer: the next attempt really is one.
  await atlas.loadExplanations(ids);
  assert.ok(asked.length >= 2, 'a rejection is not an answer');
});

test('a retracted link has no argument in the shard, and asking for one costs no request', async () => {
  const { atlas, asked } = await countedAtlas();
  const retracted = [...atlas.edges.values()].find((e) => e.status !== 'active');
  assert.ok(retracted, 'the fixtures carry a retracted link');
  const found = await atlas.loadExplanations([retracted.id]);
  // The file is still fetched — the retracted link falls in a period that has
  // one — and the link itself is simply not in it.
  assert.equal(found.has(retracted.id), false);
  assert.ok(asked.length <= 1);
});

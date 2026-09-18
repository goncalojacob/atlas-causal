// M58 — a long event's bar must not say "still loading" for ever.
//
// M50 found the defect and was rightly forbidden to fix it: an attribute row
// was written into the shard of its record's **start** century, and a view
// fetches the shards its **window** covers. A record long enough to reach into
// the window from an earlier century is drawn — correctly, it is in the window
// — with its name in a file nobody asked for, and its bar reads "still
// loading" for ever (STATUS.md, deviation 779).
//
// `docs/m58-shards.md` is the measurement of the two answers and the argument
// for the one taken: **the row goes in every shard its span touches**. It costs
// 6 KB gzipped on the window the atlas opens on and not one extra request; the
// other answer costs 33 KB and a fourth fetch on every window there is.
//
// This file is written before the build it judges (deviations 711 and 717), so
// on the commit that introduces it every test below fails.
//
// **Nothing here names a record.** The case is named by property — *a record
// whose start century differs from the window's* — because the two M50 walked
// into are two of 1,279, and a suite that listed them would go on passing the
// day the corpus grows a third.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createAtlasFromCore } from '../src/data.js';
import { buildAttributeShards, buildCore } from '../src/validate/core.js';
import { attributeShardKey, attributeSpan, periodsTouched } from '../src/explanations.js';
import { decodeSpineFile, SPINE_KINDS, ATTRIBUTE_COLUMNS } from '../src/spine.js';
import { labelOf, LOADING_LABEL } from '../src/attributes.js';
import { FIXTURE_DATA, ROOT, topologyOf } from './helpers.mjs';

const DATASETS = [['the fixtures', FIXTURE_DATA], ['the repository data', path.join(ROOT, 'data')]];
const refuse = () => Promise.reject(new Error('this atlas fetches nothing'));

// The shards the build just made, served out of memory: the loader fetches by
// the manifest's own file name, so a test that wants one shard and not another
// asks for it exactly as the atlas does.
function serve(built) {
  const byName = new Map(built.map((shard) => [`attributes-${shard.key}.json`, shard.file]));
  return async (url) => {
    const name = url.split('?')[0].split('/').pop();
    const file = byName.get(name);
    if (!file) throw new Error(`no such shard: ${url}`);
    return file;
  };
}

// The centuries the index has, off the shards the build made, and the ids each
// one carries — which is the only thing these tests read out of a shard.
function shardsOf(topology) {
  const built = buildAttributeShards(topology);
  const centuries = built.filter((shard) => shard.from !== null).map(({ from, to }) => ({ from, to }));
  const idsIn = new Map(built.map((shard) => {
    const rows = decodeSpineFile(shard.file, SPINE_KINDS, ATTRIBUTE_COLUMNS);
    const ids = new Set();
    for (const kind of SPINE_KINDS) for (const row of rows[`${kind}s`] ?? []) ids.add(`${kind}:${row.id}`);
    return [shard.key, ids];
  }));
  const manifest = {
    schema: 4,
    regions: [],
    files: {},
    attributeShards: built.map(({ key, from, to }) => ({ key, from, to, file: `index/attributes-${key}.json` })),
  };
  return { built, centuries, idsIn, manifest };
}

// Every record the build could file, with the span that decides where it goes.
function spanned(topology) {
  const events = new Map((topology.events ?? []).map((e) => [e.id, e]));
  const out = [];
  for (const kind of SPINE_KINDS) {
    for (const record of topology[`${kind}s`] ?? []) {
      const span = attributeSpan(kind, record, events);
      if (span !== null) out.push({ kind, record, span });
    }
  }
  return out;
}

for (const [label, dir] of DATASETS) {
  // The fix itself, stated as the property it is: a row is in every century its
  // record's interval touches. An interval with no end touches every century
  // after it began, because that is how `overlaps()` already draws it.
  test(`a row is in every shard its span touches, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const { centuries, idsIn } = shardsOf(topology);
    let reaching = 0;
    for (const { kind, record, span } of spanned(topology)) {
      const touched = periodsTouched(span, centuries);
      if (touched.length > 1) reaching += 1;
      for (const period of touched) {
        const key = attributeShardKey(period);
        assert.ok(idsIn.get(key)?.has(`${kind}:${record.id}`),
          `${kind} ${record.id} runs through ${key} and its row is not in it`);
      }
    }
    // And the fault was real in this dataset: had nothing reached out of its
    // own century, the assertions above would hold on the old build too.
    assert.ok(reaching > 0, 'no record in this dataset reaches past its own century');
  });

  // The other half of the same rule, from the window's side: whatever a view
  // draws in a window, its name is in a shard that window asked for.
  test(`every record a window draws has its name in a shard that window fetches, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const { centuries, idsIn, manifest } = shardsOf(topology);
    const atlas = createAtlasFromCore({ manifest, core: buildCore(topology), sources: [], fetchJson: refuse });
    for (const century of centuries) {
      const window = { from: century.from, to: century.to };
      const asked = new Set(atlas.attributeShardsIn(window).map((shard) => shard.key));
      for (const { kind, record, span } of spanned(topology)) {
        // In the window on the same reading `overlaps()` takes: begun by the
        // far end, and not ended before the near one.
        const ends = span.max === null || span.max === undefined ? Infinity : span.max;
        if (!(span.min <= window.to && ends >= window.from)) continue;
        const has = periodsTouched(span, centuries)
          .some((period) => asked.has(attributeShardKey(period)) && idsIn.get(attributeShardKey(period))?.has(`${kind}:${record.id}`));
        assert.ok(has, `${kind} ${record.id} is drawn in ${window.from}–${window.to} and its name is in no shard that window fetches`);
      }
    }
  });
}

// The bar itself. Not "a shard is on disk" but "the atlas hands the view a
// name": `labelOf` is what the three views print, and `LOADING_LABEL` is what a
// control with no name yet has to say to a screen reader.
test("an event whose start century differs from the window's is drawn with its name", async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const { built, centuries, manifest } = shardsOf(topology);
  const fileOf = new Map(built.map(({ key, file }) => [key, file]));
  const events = new Map((topology.events ?? []).map((e) => [e.id, e]));

  // The case, found by property: a century, and an active event that reaches
  // into it from an earlier one. Never an id.
  let found = null;
  for (const century of centuries) {
    for (const event of topology.events ?? []) {
      if (event.status !== 'active') continue;
      const span = attributeSpan('event', event, events);
      if (span === null) continue;
      const ends = span.max === null || span.max === undefined ? Infinity : span.max;
      if (!(span.min <= century.to && ends >= century.from)) continue;
      const begins = periodsTouched({ min: span.min, max: span.min }, centuries)[0];
      if (begins && begins.from < century.from) { found = { century, event }; break; }
    }
    if (found) break;
  }
  assert.ok(found, 'the fixtures hold an event whose start century differs from a window it is drawn in');

  const atlas = createAtlasFromCore({ manifest, core: buildCore(topology), sources: [], fetchJson: serve(built) });
  const record = atlas.events.get(found.event.id);
  assert.equal(labelOf(atlas, record), null, 'a bar has no name before any shard lands');

  // Only what the window asks for — which is the whole point: the shard the
  // event *begins* in is never fetched here.
  const window = { from: found.century.from, to: found.century.to };
  const asked = atlas.attributeShardsIn(window);
  assert.ok(!asked.some((shard) => shard.key === attributeShardKey(
    periodsTouched({ min: attributeSpan('event', found.event, events).min, max: attributeSpan('event', found.event, events).min }, centuries)[0],
  )), 'this window covers the century the event begins in, and the case is not the one M50 found');
  atlas.pinAttributes(asked);
  await Promise.all(asked.map((shard) => atlas.loadAttributes(shard)));

  const name = labelOf(atlas, record);
  assert.notEqual(name, null, 'the bar is still waiting for a shard this window never asks for');
  assert.notEqual(name, LOADING_LABEL);
  assert.notEqual(name, record.id, 'a slug drawn where a title goes');
  assert.ok(typeof name === 'string' && name !== '');
});

// What the answer was not allowed to cost. A window asks for the shards whose
// own century it covers and the two that answer no year — and never one that
// merely reaches into it, which is what the second answer would have added.
test('a window fetches the shards its own centuries cover, and no others', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const { centuries, manifest } = shardsOf(topology);
  const atlas = createAtlasFromCore({ manifest, core: buildCore(topology), sources: [], fetchJson: refuse });
  const noYear = manifest.attributeShards.filter((shard) => shard.from === null).map((shard) => shard.key);
  for (const century of centuries) {
    const window = { from: century.from, to: century.to };
    const asked = atlas.attributeShardsIn(window).map((shard) => shard.key);
    const expected = [
      ...centuries.filter((c) => c.from <= window.to && c.to >= window.from).map((c) => attributeShardKey(c)),
      ...noYear,
    ];
    assert.deepEqual(asked, expected, `the window ${window.from}–${window.to} asks for something it does not cover`);
  }
});

// And the cap. A record filed in four centuries is carried by four files, so
// dropping one of them is not the record losing its name — it keeps it while
// any shard that carries it is still in hand.
test('a record filed in several shards keeps its name while any of them is held', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const { built, centuries, manifest } = shardsOf(topology);
  const fileOf = new Map(built.map(({ key, file }) => [key, file]));
  const events = new Map((topology.events ?? []).map((e) => [e.id, e]));

  let wanted = null;
  for (const event of topology.events ?? []) {
    if (event.status !== 'active') continue;
    const touched = periodsTouched(attributeSpan('event', event, events), centuries);
    if (touched.length > 1) { wanted = { event, touched }; break; }
  }
  assert.ok(wanted, 'the fixtures hold an event filed in more than one century');

  const atlas = createAtlasFromCore({ manifest, core: buildCore(topology), sources: [], fetchJson: serve(built) });
  const record = atlas.events.get(wanted.event.id);
  const keys = wanted.touched.map((period) => attributeShardKey(period));
  await Promise.all(keys.map((key) => atlas.loadAttributes(key)));
  assert.notEqual(labelOf(atlas, record), null, 'the shards landed and the record has no name');

  // Every other shard, unpinned, until the cap has evicted what it is going to.
  for (const shard of manifest.attributeShards) {
    if (keys.includes(shard.key)) continue;
    await atlas.loadAttributes(shard);
  }
  const held = new Set(atlas.loadedAttributeShards());
  if (keys.some((key) => held.has(key))) {
    assert.notEqual(labelOf(atlas, record), null,
      'a shard that still carries this record is in hand and the record was stripped anyway');
  }
});

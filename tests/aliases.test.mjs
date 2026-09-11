// A record may be renamed: the old id goes in `aliases` and everything
// written against it keeps working. Health review A, finding 20 found three
// places where it did not — a plain reference, a narrative step and a
// `review.citations` key — and this file is the check that they now do, plus
// the helper they all go through.
//
// Every rename here is made in memory over the fixture dataset, so the
// fixtures on disk stay the passing case for every other test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { aliasIndex, resolveId } from '../src/validate/rules.js';
import { validate, buildTopology, citationsBySource } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { loadAtlas } from '../src/data.js';
import { resolveRef, narrativeSteps, narrativeEventIds } from '../src/narrative.js';
import { fixtures, schemas, FIXTURE_DATA } from './helpers.mjs';

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const rule3 = (result) => result.errors.filter((e) => e.rule === 3);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

// A universe of the shape checkRules builds: id → { kind, entry }.
function universeOf(entries) {
  return new Map(entries.map((e) => [e.entry.id, e]));
}

test('resolveId is resolve(): the alias first, then the merges', () => {
  const universe = universeOf([
    { kind: 'event', entry: { id: 'now', status: 'active', aliases: ['then'] } },
    { kind: 'event', entry: { id: 'gone', status: 'merged', supersededBy: 'now', aliases: ['long-gone'] } },
  ]);
  const aliases = aliasIndex(universe);
  assert.deepEqual([...aliases.entries()].sort(), [['long-gone', 'gone'], ['then', 'now']]);

  assert.equal(resolveId('now', universe).id, 'now');
  assert.equal(resolveId('then', universe).id, 'now');
  assert.equal(resolveId('then', universe).via[0].reason, 'alias');
  // A merged record stands for the one it was merged into, and a former id of
  // the merged record reaches it through both hops.
  assert.equal(resolveId('gone', universe).id, 'now');
  assert.equal(resolveId('long-gone', universe).id, 'now');
  assert.deepEqual(resolveId('long-gone', universe).via.map((v) => v.reason), ['alias', 'merged']);
  // The rules that ask what a reference names stop at the alias.
  assert.equal(resolveId('gone', universe, { merges: false }).id, 'gone');
  assert.equal(resolveId('long-gone', universe, { merges: false }).id, 'gone');

  assert.equal(resolveId('nowhere', universe), null);
  assert.equal(resolveId(null, universe), null);
  assert.equal(resolveId(undefined, universe), null);
});

test('resolveId does not loop on a merge that closes on itself', () => {
  const universe = universeOf([
    { kind: 'event', entry: { id: 'a', status: 'merged', supersededBy: 'b', aliases: [] } },
    { kind: 'event', entry: { id: 'b', status: 'merged', supersededBy: 'a', aliases: [] } },
  ]);
  assert.equal(resolveId('a', universe), null);
});

test('rule 3: a reference by a former id resolves', async () => {
  // The place is renamed and the event still names the old id, which is the
  // state of the world in the commit that does the rename.
  const rename = (fx) => {
    fx.byId['fixture-place-a'].id = 'fixture-place-a-renamed';
    fx.byId['fixture-place-a'].aliases = ['fixture-place-a'];
  };
  const r = await run(rename);
  assert.equal(rule3(r).length, 0, messages(r));
  // And a reference to nothing is still a reference to nothing.
  const broken = await run((fx) => { fx.byId['fixture-event-a'].place = 'fixture-place-zz'; });
  assert.equal(rule3(broken).filter((e) => e.path === '/place').length, 1);
});

test('rule 3: a narrative step by a former id resolves', async () => {
  const r = await run((fx) => {
    fx.byId['fixture-narrative-one'].steps[0].ref = 'fixture-event-b-old';
  });
  assert.equal(rule3(r).length, 0, messages(r));
  const broken = await run((fx) => {
    fx.byId['fixture-narrative-one'].steps[0].ref = 'fixture-event-never';
  });
  assert.equal(broken.errors.filter((e) => e.rule === 3 && e.path === '/steps/0/ref').length, 1);
});

test('rule 3: a citation check keyed by a source\'s former id resolves', async () => {
  const r = await run((fx) => {
    fx.byId['fixture-source-1'].aliases = ['fixture-source-one'];
    fx.byId['fixture-event-a'].review = {
      flags: [],
      citations: { 'fixture-source-one': { verified: { by: 'A Reviewer', on: '2026-09-05' } } },
    };
  });
  assert.equal(rule3(r).length, 0, messages(r));
  // A key naming a source the record does not cite is still the error it was:
  // that is a flag left behind by a citation somebody edited away.
  const stale = await run((fx) => {
    fx.byId['fixture-event-a'].review = {
      flags: [],
      citations: { 'fixture-source-3': { verified: null } },
    };
  });
  assert.equal(rule3(stale).filter((e) => e.path.startsWith('/review/citations/')).length, 1);
});

test('a citation by a source\'s former id is filed under the id the source answers to now', async () => {
  const { records, byId } = await fixtures();
  byId['fixture-source-1'].aliases = ['fixture-source-one'];
  byId['fixture-event-a'].sources[0].source = 'fixture-source-one';
  const citers = citationsBySource(records);
  assert.equal(citers.has('fixture-source-one'), false);
  assert.ok(citers.get('fixture-source-1').some((c) => c.id === 'fixture-event-a'));
});

test('a narrative step by a former id opens the record it is about', async () => {
  const fetchJson = async (url) => JSON.parse(await readFile(path.join(FIXTURE_DATA, '..', '..', '..', url.split('?')[0]), 'utf8'));
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });

  const step = resolveRef(atlas, 'fixture-event-b-old');
  assert.equal(step.kind, 'event');
  assert.equal(step.event.id, 'fixture-event-b');
  // The ref stays what the narrative wrote; what it stands for is the record.
  assert.equal(step.ref, 'fixture-event-b-old');
  assert.equal(resolveRef(atlas, 'fixture-event-never').kind, null);

  const narrative = { steps: [{ ref: 'fixture-event-b-old' }, { ref: 'fixture-event-a' }] };
  assert.deepEqual(narrativeSteps(atlas, narrative).map((s) => s.event.id), ['fixture-event-b', 'fixture-event-a']);
  assert.deepEqual([...narrativeEventIds(atlas, narrative)].sort(), ['fixture-event-a', 'fixture-event-b']);
});

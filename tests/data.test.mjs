import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createAtlas, loadAtlas } from '../src/data.js';
import { FIXTURE_DATA, atlasOf } from './helpers.mjs';

// A fetchJson over the fixture directory, so loadAtlas runs without a
// browser and the on-demand record fetch can be observed. The query string
// is dropped before the path is read, as every server does with one: since
// H3b a record is asked for as `<id>.json?v=<revised>`, and the `?v=` is a
// hint to the cache and not part of the file's name (data.js).
const onDisk = (url) => path.join(FIXTURE_DATA, '..', '..', '..', url.split('?')[0]);
const calls = [];
async function fetchJson(url) {
  calls.push(url);
  return JSON.parse(await readFile(onDisk(url), 'utf8'));
}

test('loadAtlas reads the manifest, both indexes, and record text on demand', async () => {
  calls.length = 0;
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.equal(calls[0], 'tests/fixtures/data/index/manifest.json');
  assert.equal(atlas.events.size, 12);
  assert.equal(atlas.activeEvents.length, 11);
  assert.equal(atlas.sources.size, 4);
  assert.equal(atlas.land, null, 'fixture manifest lists no land');
  assert.deepEqual(atlas.extent, { min: 1200, max: 1300 });
  assert.deepEqual(atlas.regions.map((r) => r.id), ['fixture-lane-1', 'fixture-lane-2', 'fixture-lane-3']);

  const before = calls.length;
  const record = await atlas.record('event', 'fixture-event-a');
  assert.equal(record.summary.startsWith('Synthetic record'), true);
  await atlas.record('event', 'fixture-event-a');
  assert.equal(calls.length, before + 1, 'cached');
  assert.match(calls[before], /^tests\/fixtures\/data\/events\/fixture-event-a\.json\?v=\d{4}-\d{2}-\d{2}$/);
});

test('resolve follows aliases and merged tombstones', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.equal(atlas.resolve('fixture-event-b').record.id, 'fixture-event-b');
  const alias = atlas.resolve('fixture-event-b-old');
  assert.equal(alias.record.id, 'fixture-event-b');
  assert.deepEqual(alias.via, [{ id: 'fixture-event-b-old', reason: 'alias' }]);
  const merged = atlas.resolve('fixture-event-m');
  assert.equal(merged.record.id, 'fixture-event-b');
  assert.deepEqual(merged.via, [{ id: 'fixture-event-m', reason: 'merged' }]);
  assert.equal(atlas.resolve('fixture-source-1').kind, 'source');
  assert.equal(atlas.resolve('fixture-actor-one').kind, 'actor');
  assert.equal(atlas.resolve('nothing-here'), null);
});

test('actors resolve and carry the events they appear in, chronologically', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.equal(atlas.actors.size, 4);
  assert.equal(atlas.actors.get('fixture-actor-one').name, 'Fixture Actor One');
  assert.deepEqual(
    atlas.eventsByActor.get('fixture-actor-one').map((a) => [a.event.id, a.role]),
    [['fixture-event-a', 'leader'], ['fixture-event-b', 'signatory']],
  );
  assert.deepEqual(
    atlas.eventsByActor.get('fixture-actor-two').map((a) => a.event.id),
    ['fixture-event-b', 'fixture-event-t'],
  );
  assert.equal(atlas.events.get('fixture-event-a').actors[0].actor, 'fixture-actor-one');
});

test('relations are adjacency by actor, read from both ends', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  // Two of the three are still standing: M30a-2 re-filed the pair's `led`
  // record as a tenure and adjacency is active relations only.
  assert.equal(atlas.relations.size, 2);
  // The person's end.
  assert.deepEqual(
    atlas.relationsByActor.get('fixture-actor-one').map((r) => [r.relation.type, r.direction, r.other]),
    [['member-of', 'out', 'fixture-actor-two']],
  );
  // The body's end: the same record, pointing the other way.
  assert.deepEqual(
    atlas.relationsByActor.get('fixture-actor-two').map((r) => [r.relation.type, r.direction, r.other]),
    [['member-of', 'in', 'fixture-actor-one']],
  );
  assert.deepEqual(
    atlas.relationsByActor.get('fixture-polity-three').map((r) => [r.relation.type, r.direction, r.other]),
    [['regime-of', 'in', 'fixture-polity-four']],
  );
  // An actor in no relation is absent rather than empty, like eventsByActor.
  assert.equal(atlas.relationsByActor.has('fixture-nobody'), false);
});

test('createAtlas copes with an empty dataset', () => {
  const atlas = createAtlas({
    manifest: { schema: 1, regions: [], land: [], files: {} },
    topology: { events: [], edges: [] },
    sources: [],
  });
  assert.equal(atlas.extent, null);
  assert.deepEqual(atlas.activeEvents, []);
  assert.equal(atlas.resolve('x'), null);
});

test('the window\'s far end is clamped to the years the outlines cover', async () => {
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  assert.deepEqual(atlas.presenceCoverage, { from: 1100, to: 1299 });
  assert.equal(atlas.territoryYear(1250), 1250, 'inside the coverage, the year asked for');
  assert.equal(atlas.territoryYear(1400), 1299, 'past it, the last year there is');
  assert.equal(atlas.territoryYear(1000), 1000, 'before it, unchanged — and nothing is drawn');
  assert.equal(atlas.territoryYear(null), null);
  // presencesAt clamps the same way, so the map, the actor card and the
  // band's marker cannot end up disagreeing about which year is drawn.
  assert.deepEqual(atlas.presencesAt(1400).map((p) => p.id), atlas.presencesAt(1299).map((p) => p.id));
  assert.deepEqual(atlas.presencesAt(1000), []);
  assert.deepEqual(atlas.presencesAt(1250).map((p) => p.id), ['fixture-polity-four-1200', 'fixture-polity-three-1100']);
});

test('an atlas with no outlines at all has no coverage and clamps nothing', () => {
  const atlas = createAtlas({
    manifest: { schema: 1, regions: [], land: [], files: {} },
    topology: { events: [], edges: [] },
    sources: [],
  });
  assert.equal(atlas.presenceCoverage, null);
  assert.equal(atlas.territoryYear(1400), 1400);
});

// A cache holds answers, and a rejection is not one. One dropped request used
// to be the answer for the rest of the session: the card said "Could not load
// the record text" and never asked again, however often the record was opened.
test('a record that failed to load is fetched again the next time it is asked for', async () => {
  const asked = [];
  let fail = true;
  const flaky = async (url) => {
    asked.push(url);
    if (fail && url.includes('fixture-event-a.json')) throw new Error('offline');
    return JSON.parse(await readFile(onDisk(url), 'utf8'));
  };
  const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson: flaky });

  await assert.rejects(atlas.record('event', 'fixture-event-a'), /offline/);
  const after = asked.length;
  await assert.rejects(atlas.record('event', 'fixture-event-a'), /offline/,
    'still failing, and still trying');
  assert.equal(asked.length, after + 1, 'the rejection was not kept');

  fail = false;
  const record = await atlas.record('event', 'fixture-event-a');
  assert.equal(record.id, 'fixture-event-a', 'the connection came back and so did the record');
  // And once it has arrived it is cached, as it always was.
  const settled = asked.length;
  await atlas.record('event', 'fixture-event-a');
  assert.equal(asked.length, settled);
});

test('a shard of outlines that failed to load is fetched again too', async () => {
  const asked = [];
  let fail = true;
  const atlas = createAtlas({
    manifest: { schema: 1, regions: [], land: [], files: {} },
    topology: { events: [], edges: [] },
    sources: [],
    fetchJson: async (url) => {
      asked.push(url);
      if (fail) throw new Error('offline');
      return { features: [{ id: 'k', geometry: { type: 'Point', coordinates: [0, 0] } }] };
    },
  });

  await assert.rejects(atlas.loadGeometry('geo/shard.json'), /offline/);
  await assert.rejects(atlas.loadGeometry('geo/shard.json'), /offline/);
  assert.equal(asked.length, 2, 'the rejected shard was not kept as the one that is loading');

  fail = false;
  const outlines = await atlas.loadGeometry('geo/shard.json');
  assert.equal(outlines.get('k').type, 'Point');
  await atlas.loadGeometry('geo/shard.json');
  assert.equal(asked.length, 3, 'and the shard that arrived is held');
  assert.equal(atlas.loadedGeometry('geo/shard.json').size, 1);
});

// --- the three joins M30b draws from -------------------------------------
//
// Each is the other direction of a field one record carries: an office points
// at its actor, a child at its parent, an actor line at its role. Built once
// in createAtlas, from the spine, so that no card costs a fetch to ask.

test('officesByActor is the other direction of an office\'s `of`, in title order', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  assert.deepEqual(
    (atlas.officesByActor.get('fixture-polity-three') ?? []).map((o) => o.id),
    ['fixture-office-one'],
  );
  assert.deepEqual(
    (atlas.officesByActor.get('fixture-actor-two') ?? []).map((o) => o.id),
    ['leadership-of-fixture-actor-two'],
  );
  assert.equal(atlas.officesByActor.get('fixture-actor-one'), undefined, 'holding an office is not owning one');
});

test('childrenOf lists an event\'s parts by start year, and never enters the adjacency', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  // fixture-event-t is 1280 and fixture-event-h is 1290; both are inside
  // fixture-event-f.
  assert.deepEqual(atlas.childrenOf.get('fixture-event-f'), ['fixture-event-t', 'fixture-event-h']);
  assert.equal(atlas.childrenOf.get('fixture-event-h'), undefined);
  // `parent` is a display fact: the graph is what the edges say and nothing
  // more (CLAUDE.md).
  const out = atlas.adjacency.out.get('fixture-event-f') ?? [];
  assert.equal(out.some((e) => e.to === 'fixture-event-t' && !atlas.edges.has(e.id)), false);
  assert.equal((atlas.adjacency.in.get('fixture-event-t') ?? []).every((e) => atlas.edges.has(e.id)), true);
});

test('an actor\'s appearances carry the note beside the role', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const rows = atlas.eventsByActor.get('fixture-actor-two') ?? [];
  assert.ok(rows.length > 1);
  const noted = rows.filter((r) => r.note !== null);
  assert.deepEqual(noted.map((r) => [r.event.id, r.role, r.note]),
    [['fixture-event-t', 'signatory', 'signed it for the synthetic party']]);
  assert.equal(rows.every((r) => 'note' in r), true, 'and a line without one says null');
});

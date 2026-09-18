// What a card holds while it is on screen, and what a view may print.
//
// Both are the same question asked twice: since I4 the pages read the core and
// the titles, roles and names arrive a century at a time behind the picture.
// The three views may draw a bar, a mark and a node before the century lands
// and label them when it does; a card may not draw out of a fallback at all
// (index2 review, finding 21). And a card is per-entity and not windowed — an
// actor's events may span five centuries — so what it holds is a list of
// records and never a window (finding 9).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordsOnScreen, shardsOnScreen, labelOf, LOADING_LABEL } from '../src/attributes.js';
import { createAtlasFromCore, createAtlasFromSpine } from '../src/data.js';
import { buildAttributeShards, buildCore, buildSpine } from '../src/validate/core.js';
import { FIXTURE_DATA, topologyOf } from './helpers.mjs';

const refuse = () => Promise.reject(new Error('this atlas fetches nothing'));

async function atlases({ shards = 'every' } = {}) {
  const topology = await topologyOf(FIXTURE_DATA);
  const built = buildAttributeShards(topology);
  const manifest = {
    schema: 4,
    regions: [],
    files: {},
    attributeShards: built.map(({ key, from, to, name }) => ({ file: `index/${name}`, key, from, to })),
  };
  const pieces = { manifest, sources: [], fetchJson: refuse };
  return {
    topology,
    fromSpine: createAtlasFromSpine({ ...pieces, spine: buildSpine(topology) }),
    fromCore: createAtlasFromCore({
      ...pieces,
      core: buildCore(topology),
      attributes: shards === 'every' ? built.map(({ key, file }) => ({ key, file })) : [],
    }),
  };
}

test("an event's card holds itself, its place, its actors and the events one link away", async () => {
  const { fromCore } = await atlases();
  const event = fromCore.activeEvents.find((e) => (fromCore.adjacency.out.get(e.id) ?? []).length > 0);
  assert.ok(event, 'the fixtures have an event with a consequence');
  const ids = recordsOnScreen(fromCore, 'event', event.id);
  assert.ok(ids.has(event.id), 'the record itself');
  for (const { actor } of event.actors ?? []) assert.ok(ids.has(actor), `the actor ${actor}`);
  if (event.place) assert.ok(ids.has(event.place), 'the place');
  for (const edge of fromCore.adjacency.out.get(event.id) ?? []) {
    assert.ok(ids.has(edge.id), `the link ${edge.id}`);
    assert.ok(ids.has(edge.to), `the event at the far end, ${edge.to}`);
  }
});

test("an actor's card holds every century its own lists reach", async () => {
  const { fromCore } = await atlases();
  const [actor, rows] = [...fromCore.eventsByActor].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  assert.ok(actor, 'the fixtures have an actor with events');
  const ids = recordsOnScreen(fromCore, 'actor', actor);
  for (const row of rows) assert.ok(ids.has(row.event.id), `the event ${row.event.id}`);
  // Which is the whole point of holding records and not a window: the shards
  // this asks for are the ones those events are filed in, however far apart
  // in time they are.
  const wanted = shardsOnScreen(fromCore, 'actor', actor);
  const filed = fromCore.attributeShardsOf(rows.map((r) => r.event.id));
  for (const shard of filed) assert.ok(wanted.some((s) => s.key === shard.key), `the shard ${shard.key}`);
});

test('a source asks for no shard, and neither does a record the atlas cannot resolve', async () => {
  const { fromCore } = await atlases();
  assert.deepEqual(shardsOnScreen(fromCore, 'source', 'cshapes-2-0'), []);
  assert.deepEqual(shardsOnScreen(fromCore, 'event', 'no-such-event'), []);
});

test('an atlas from the spine shards nothing and asks for nothing', async () => {
  const { fromSpine } = await atlases();
  const event = fromSpine.activeEvents[0];
  assert.deepEqual(shardsOnScreen(fromSpine, 'event', event.id), []);
});

// The rule the three views follow. The core's fallback for a missing title is
// the record's id, which is right for a sort and wrong for anything a reader
// reads: a slug drawn where a title goes is a derived string presented as the
// name of the thing (i4-brief, "no fallback text that could be mistaken for
// data").
test('a record with no shard yet has no name, and has one when the shard lands', async () => {
  const bare = (await atlases({ shards: 'none' })).fromCore;
  const whole = (await atlases()).fromCore;
  const id = whole.activeEvents[0].id;

  const before = bare.events.get(id);
  assert.equal(before.title, id, "the core's own fallback is the id");
  assert.equal(labelOf(bare, before), null, 'and no view may print it');

  const after = whole.events.get(id);
  assert.notEqual(after.title, id, 'the shard carries a real title');
  assert.equal(labelOf(whole, after), after.title);
  assert.equal(labelOf(whole, null), null, 'and nothing is not a record');
});

test('what a control with no name yet says is the interface, not the data', async () => {
  const bare = (await atlases({ shards: 'none' })).fromCore;
  assert.equal(typeof LOADING_LABEL, 'string');
  assert.ok(LOADING_LABEL.length > 0, 'a button nobody can name is a button nobody can find');
  for (const event of bare.activeEvents) {
    assert.notEqual(LOADING_LABEL, event.id, 'and it is never a record id');
  }
});

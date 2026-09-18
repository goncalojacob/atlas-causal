// First contact: what the card says, and when it is shown.
//
// The one thing this card must never do is make a historical claim. Every
// title, name and count in it is read off records that are already in the
// atlas, and the only prose in it is about the interface (CLAUDE.md: no
// AI-generated historical claims). That is asserted here rather than trusted.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  introHtml, heaviest, hasSeen, markSeen, opensOnNothing, HEAVIEST, STORAGE_KEY, SEEN,
} from '../src/intro.js';
import { defaultState } from '../src/state.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

const atlas = await atlasOf(path.join(ROOT, 'data'));

test('the heaviest events are the ones with the atlas downstream of them', () => {
  const list = heaviest(atlas);
  assert.equal(list.length, HEAVIEST);
  for (let i = 1; i < list.length; i += 1) {
    assert.ok((list[i - 1].weight ?? 0) >= (list[i].weight ?? 0), 'heaviest first');
  }
  for (const event of list) {
    assert.equal(event.status, 'active', 'a tombstone is not an invitation');
    assert.ok((event.weight ?? 0) > 0, 'and neither is an event nothing hangs on');
  }
  // Ties broken by id, so the card is the same card twice running.
  assert.deepEqual(heaviest(atlas).map((e) => e.id), list.map((e) => e.id));
  assert.equal(heaviest(atlas, 2).length, 2);
});

test('the card quotes the records and claims nothing of its own', () => {
  const html = introHtml(atlas);
  // Every title it offers is a record's own title, and every id it names is a
  // record that is in the atlas.
  const ids = [...html.matchAll(/data-intro="(event|narrative)" data-id="([a-z0-9-]+)"/g)];
  assert.ok(ids.length > 0, 'the card offers a way in');
  for (const [, kind, id] of ids) {
    const record = kind === 'event' ? atlas.events.get(id) : atlas.narratives.get(id);
    assert.ok(record, `${kind} ${id} is a record`);
    assert.equal(record.status, 'active');
    assert.ok(html.includes(record.title), `${id} is named by its own title`);
  }
  // The counts are the atlas's own.
  assert.match(html, new RegExp(`${atlas.activeEvents.length} events`));
  assert.match(html, new RegExp(`${atlas.actors.size} actors`));
  assert.match(html, new RegExp(`${atlas.sources.size} sources`));
  // And there is a walkthrough that is about the interface.
  assert.match(html, /Follow the consequences/);
  assert.match(html, /Other branches/);
});

test('the card is escaped like every other thing built out of a record', () => {
  const nasty = {
    ...atlas,
    activeEvents: [{
      id: 'x', title: '<img src=x onerror=alert(1)>', status: 'active', weight: 9, when: { start: 1900, end: 1900 },
    }],
    activeNarratives: [{
      id: 'n', title: '</h2><script>alert(1)</script>', status: 'active',
      authors: [{ name: '"><script>alert(2)</script>' }], steps: [{ ref: 'x' }, { ref: 'x' }],
    }],
  };
  const html = introHtml(nasty);
  assert.doesNotMatch(html, /<script/, 'no tag a record wrote reaches the DOM as a tag');
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, 'it is there, as text');
  assert.match(html, /&quot;&gt;&lt;script&gt;/, 'and so is the author line');
});

test('a dataset with no narratives and no weights still opens on something', async () => {
  const fixtures = await atlasOf(FIXTURE_DATA);
  const html = introHtml({ ...fixtures, activeNarratives: [] });
  assert.doesNotMatch(html, /Start here/);
  assert.match(html, /Follow the consequences/, 'the walkthrough stands on its own');
  const bare = introHtml({
    activeEvents: [], activeNarratives: [], edges: new Map(), actors: new Map(), sources: new Map(),
  });
  assert.match(bare, /Follow the consequences/);
  assert.doesNotMatch(bare, /What most of it hangs on/, 'nothing is offered that is not there');
});

test('a link to a record is not a first visit', () => {
  assert.equal(opensOnNothing(defaultState()), true);
  for (const patch of [
    { selected: 'x' }, { source: 'x' }, { place: 'x' }, { actor: 'x' },
    { narrative: 'x' }, { focus: 'actor:x' }, { chain: ['a--b--caused'] },
    { from: 1900 }, { to: 1900 }, { bbox: [-10, 36, -6, 42] },
  ]) {
    assert.equal(opensOnNothing({ ...defaultState(), ...patch }), false, Object.keys(patch)[0]);
  }
  // A view or a grouping is how the atlas is drawn and not what is open: a
  // reader arriving on the graph with nothing in it is still a first visit.
  assert.equal(opensOnNothing({ ...defaultState(), view: 'graph', group: 'region' }), true);
});

test('what is remembered, and what a browser with storage turned off does', () => {
  const store = new Map();
  const storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  };
  assert.equal(hasSeen(storage), false);
  assert.equal(markSeen(storage), true);
  assert.equal(store.get(STORAGE_KEY), SEEN);
  assert.equal(hasSeen(storage), true);

  // Storage that throws is a reader who sees the card again, which is the
  // safer failure: an introduction twice beats a reader who never sees it.
  const refuses = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(hasSeen(refuses), false);
  assert.equal(markSeen(refuses), false);
  assert.equal(hasSeen(null), false);
});

// M89 — what a reader met on the third review. The pure half.
//
// One test per section of `docs/m89-brief.md` whose property can be asserted
// without a browser; the rest are in `tests/m89-browser.test.mjs`. Nothing here
// pins a count or a pixel: the corpus grows by about a hundred records a day on
// two other branches, so every expectation is derived from the corpus the test
// runs on (brief, "Must not").
//
// Written before the behaviour it judges (deviations 711 and 717).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAtlasFromCore } from '../src/data.js';
import { buildAttributeShards, buildCore } from '../src/validate/core.js';
import { atlasOf, presencesOnDisk, topologyOf, ROOT } from './helpers.mjs';
import { LOADING_LABEL } from '../src/attributes.js';
import { esc } from '../src/util/esc.js';
import { introHtml, heaviest, centuryOf, score, HEAVIEST } from '../src/intro.js';
import { createShardWatch } from '../src/shard-watch.js';
import { frameOn, markNodes, wantedSets } from '../src/map/camera.js';
import { worldProjection } from '../src/map/projection.js';
import { partsReach, partsReachSentence } from '../src/panel/event.js';
import { isParent, parentsOf } from '../src/parts.js';
import { eventsOfFocus } from '../src/lens.js';

const DATA = path.join(ROOT, 'data');
const atlas = await atlasOf(DATA);

// The same atlas as the browser has in its first frame: the core, and not one
// attribute shard. A title is the record's id there (spine.js's fallback), which
// is the whole of what section 1 is about.
const refuse = () => Promise.reject(new Error('this atlas fetches nothing'));
async function coreOnly(dir) {
  const topology = await topologyOf(dir);
  const manifest = JSON.parse(await readFile(path.join(dir, 'index', 'manifest.json'), 'utf8'));
  const sources = JSON.parse(await readFile(path.join(dir, manifest.files.sources), 'utf8')).sources;
  return createAtlasFromCore({
    manifest, sources, presences: await presencesOnDisk(dir), fetchJson: refuse,
    core: buildCore(topology), attributes: [],
  });
}
const firstFrame = await coreOnly(DATA);

// ─── 1. nothing prints an id where a title goes (A1) ───────────────────────

test('§1: the front card says it is loading rather than printing a slug', async () => {
  const html = introHtml(firstFrame);
  const offered = [...html.matchAll(/data-intro="(?:event|narrative)" data-id="([a-z0-9-]+)"[^>]*>([^<]*)</g)];
  assert.ok(offered.length > 0, 'the card offers a way in');
  for (const [, id, text] of offered) {
    assert.equal(text.trim(), LOADING_LABEL,
      `${id} is named "${text.trim()}" before its century has landed`);
  }
  // The ids are still there — they are what the button opens — and they are
  // never the button's own text.
  assert.ok(html.includes('data-id='), 'the way in still names the record it opens');
});

test('§1: and prints the titles once the shards are in, with no loading label left', () => {
  const html = introHtml(atlas);
  const offered = [...html.matchAll(/data-intro="(event|narrative)" data-id="([a-z0-9-]+)"[^>]*>([^<]*)</g)];
  assert.ok(offered.length > 0, 'the card offers a way in');
  for (const [, kind, id, text] of offered) {
    const record = kind === 'event' ? atlas.events.get(id) : atlas.narratives.get(id);
    assert.ok(record, `${kind} ${id} is a record`);
    assert.equal(text.trim(), esc(record.title).trim(), `${id} is named by its own title`);
    assert.notEqual(text.trim(), id, 'and never by its id');
  }
  assert.ok(!html.includes(LOADING_LABEL), 'and nothing on it is still loading');
});

test('§1: the steps of an account are not counted before its shard lands', async () => {
  const html = introHtml(firstFrame);
  assert.doesNotMatch(html, /\b0 steps\b/, 'a walk whose steps have not arrived does not report none');
  if ((atlas.activeNarratives ?? []).length > 0) {
    assert.match(introHtml(atlas), /\d+ steps/, 'and reports them once they have');
  }
});

// ─── 4. what most of it hangs on, picked with a rule (A4) ──────────────────

test('§4: the six are the heaviest by subtree and by degree together', () => {
  const list = heaviest(atlas);
  assert.equal(list.length, HEAVIEST);
  for (const event of list) {
    assert.equal(event.status, 'active', 'a tombstone is not an invitation');
    assert.ok(score(event) > 0, 'and neither is an event nothing hangs on');
  }
  // The same card twice running.
  assert.deepEqual(heaviest(atlas).map((e) => e.id), list.map((e) => e.id));
});

test('§4: the six spread across the lanes and no century repeats', () => {
  const list = heaviest(atlas);
  const scoring = atlas.activeEvents.filter((e) => score(e) > 0);
  // The lanes: as many distinct ones as there are lanes to have, six places on
  // the card and five lanes in the atlas being what makes that not six.
  const lanes = list.map((e) => e.region ?? null);
  const lanesInCorpus = new Set(scoring.map((e) => e.region ?? null));
  assert.ok(new Set(lanes).size >= Math.min(HEAVIEST, lanesInCorpus.size, 4),
    `the six sit in ${new Set(lanes).size} lanes: ${lanes.join(', ')}`);
  // The centuries: never twice, while the corpus has six centuries to offer.
  const centuries = list.map((e) => centuryOf(e));
  assert.ok(centuries.every((c) => Number.isFinite(c)), 'every one of the six is dated');
  const centuriesInCorpus = new Set(scoring.map(centuryOf));
  if (centuriesInCorpus.size >= HEAVIEST) {
    assert.equal(new Set(centuries).size, centuries.length,
      `two of the six share a century: ${centuries.join(', ')}`);
  }
  // And the rule is worth having: the list is not the one century the fire
  // reached into last.
  assert.ok(new Set(centuries).size > 1, 'the six are not all of one century');
});

// And the ranking the six are the top of: the score is the module's own, so the
// test and the card cannot come to disagree about what "heaviest" means.
test('§4: the six are the best six the two rules allow, and the rule is a preference', () => {
  const list = heaviest(atlas);
  const scores = list.map(score);
  assert.ok(scores.every((s) => s > 0));
  // Nothing outside the six outscores the first of them: the spread reorders
  // the list, it does not lower it to the floor.
  const best = Math.max(...atlas.activeEvents.map(score));
  assert.equal(scores[0], best, 'the heaviest event of all is offered first');
  // A corpus with no spread to have still gets a full list.
  const oneLane = {
    activeEvents: atlas.activeEvents.filter((e) => e.region === list[0].region
      && centuryOf(e) === centuryOf(list[0])),
  };
  if (oneLane.activeEvents.filter((e) => score(e) > 0).length >= HEAVIEST) {
    assert.equal(heaviest(oneLane).length, HEAVIEST,
      'one lane and one century still fill the list, by score');
  }
});

// ─── 1. the watch itself (A1) ───────────────────────────────────────────────

test('§1: the watch draws when the count has moved and not otherwise', () => {
  let count = 3;
  let drawn = 0;
  const fake = { attributeShardsArrived: () => count };
  const watch = createShardWatch(fake, () => { drawn += 1; });
  assert.equal(watch.check(), false, 'nothing has landed since the caller drew itself');
  assert.equal(drawn, 0);
  count += 1;
  assert.equal(watch.check(), true, 'a landing');
  assert.equal(drawn, 1);
  assert.equal(watch.check(), false, 'and the same landing twice is once');
  assert.equal(drawn, 1);
  // A caller that has just drawn itself for its own reasons is up to date.
  count += 1;
  watch.drawn();
  assert.equal(watch.check(), false);
  assert.equal(drawn, 1);
  // An atlas with no shards to wait for — one built from the spine, or the plain
  // objects the tests hand this — never moves and is never redrawn.
  const spine = createShardWatch({}, () => { drawn += 1; });
  assert.equal(spine.check(), false);
  assert.equal(drawn, 1);
});

test('§1: a state change is a nudge, and the tab coming back is a redraw', () => {
  let count = 0;
  let drawn = 0;
  const fake = { attributeShardsArrived: () => count };
  const listeners = new Map();
  const doc = {
    hidden: true,
    addEventListener: (name, fn) => listeners.set(name, fn),
  };
  const subscribers = [];
  const state = { subscribe: (fn) => subscribers.push(fn) };
  createShardWatch(fake, () => { drawn += 1; }, { state, doc });

  assert.equal(subscribers.length, 1, 'it subscribes once and not once per draw');
  subscribers[0]();
  assert.equal(drawn, 0, 'a state change with nothing landed draws nothing');
  count += 1;
  subscribers[0]();
  assert.equal(drawn, 1, 'and one with a century landed draws');

  // The tab coming back draws whatever the count says, because the count is
  // itself moved by a frame that a hidden tab does not get (data.js).
  const wake = listeners.get('visibilitychange');
  assert.ok(typeof wake === 'function', 'it listens for the tab coming back');
  wake();
  assert.equal(drawn, 1, 'a document that is still hidden is not drawn into');
  doc.hidden = false;
  wake();
  assert.equal(drawn, 2);
  wake();
  assert.equal(drawn, 3, 'and again, because the count could not be asked');
});

// ─── 2. the camera frames what the reader asked for (A2) ────────────────────

test('§2: the map frames a lens on its marks, widest first', () => {
  const projection = worldProjection({ width: 960, height: 540 });
  const box = { x0: 0, y0: 0, x1: 960, y1: 540 };
  // A lens of one event: the widest set is the ring and the narrowest the event,
  // and both have to be framed on rather than left where the projection put them.
  const event = atlas.activeEvents.find((e) => atlas.pointOf(e));
  assert.ok(event, 'the corpus has an event with a place');
  const working = { lens: true, shown: new Set([event.id]), lensFocus: new Set([event.id]) };
  const wanted = wantedSets(working);
  assert.ok(wanted.length > 0, 'a lens offers a set to frame');
  const nodes = markNodes(atlas, new Set([event.id]), projection);
  assert.equal(nodes.length, 1, 'the mark is a node');
  const at = frameOn(nodes, wanted, box, { min: 1, max: 4, pad: 12 });
  assert.ok(at, 'a lens with a mark in it is framed');
  // The mark is inside the rectangle, with the padding to spare, and the camera
  // is three numbers and no more.
  assert.deepEqual(Object.keys(at).sort(), ['k', 'x', 'y']);
  const on = { x: at.x + nodes[0].x * at.k, y: at.y + nodes[0].y * at.k };
  assert.ok(on.x > box.x0 && on.x < box.x1, `the mark is across the pane at ${on.x}`);
  assert.ok(on.y > box.y0 && on.y < box.y1, `the mark is down the pane at ${on.y}`);
});

test('§2: at rest there is nothing to frame, and a lens with no mark is not framed', () => {
  const projection = worldProjection({ width: 960, height: 540 });
  const box = { x0: 0, y0: 0, x1: 960, y1: 540 };
  assert.equal(wantedSets({ lens: null, shown: new Set(['a']) }), null,
    'the resting picture is the whole world and the camera does not move for it');
  assert.equal(wantedSets(null), null);
  // A lens of events the atlas has no place for: they are in the corner's count
  // and on the timeline, and there is no mark to put on the screen.
  const placeless = atlas.activeEvents.filter((e) => !atlas.pointOf(e)).slice(0, 3);
  if (placeless.length > 0) {
    const ids = new Set(placeless.map((e) => e.id));
    assert.equal(markNodes(atlas, ids, projection).length, 0);
    assert.equal(frameOn([], [ids], box, { min: 1, max: 4, pad: 12 }), null);
  }
});

test('§2: a lens wider than the pane is framed as far out as the map goes', () => {
  const projection = worldProjection({ width: 960, height: 540 });
  const box = { x0: 0, y0: 0, x1: 960, y1: 540 };
  // Every event with a place: the box they stand in is the world, so the frame
  // is the floor and not a zoom out below it.
  const ids = new Set(atlas.activeEvents.filter((e) => atlas.pointOf(e)).map((e) => e.id));
  assert.ok(ids.size > 1);
  const at = frameOn(markNodes(atlas, ids, projection), [ids], box, { min: 1, max: 4, pad: 12 });
  assert.ok(at, 'the whole corpus is still a frame');
  assert.equal(at.k, 1, 'and it is the floor: the world, and the reader pans for the rest');
});

// ─── 3. an umbrella's card says what its parts link to (A3) ─────────────────

test('§3: every umbrella with no link of its own says what its parts reach', () => {
  // The umbrellas, derived: a main event with children and no outgoing edge.
  // Twelve of the 240 on the corpus the review read, and whichever they are on
  // the corpus this runs against.
  const umbrellas = atlas.activeEvents.filter((event) => parentsOf(event).length === 0
    && isParent(atlas, event)
    && (atlas.adjacency.out.get(event.id) ?? []).length === 0);
  assert.ok(umbrellas.length > 0, 'the corpus has an umbrella with no link of its own');
  for (const event of umbrellas) {
    const reach = partsReach(atlas, event);
    // The count of what is inside is the lens's own answer, which is what the
    // line above the section prints.
    const inside = eventsOfFocus({ kind: 'event', id: event.id }, atlas);
    assert.equal(reach.parts, inside.size - 1, `${event.id}: the parts are the lens's parts`);
    // And what they reach is computed here, off the same records.
    const wanted = new Set();
    for (const id of inside) {
      if (id === event.id) continue;
      for (const edge of atlas.adjacency.out.get(id) ?? []) {
        if (!inside.has(edge.to)) wanted.add(edge.to);
      }
    }
    assert.deepEqual([...reach.reached.keys()].sort(), [...wanted].sort(), `${event.id}: what the parts link to`);
    const events = (n) => `${n} ${n === 1 ? 'event' : 'events'}`;
    assert.equal(partsReachSentence(reach),
      `The ${events(reach.parts)} inside it ${reach.parts === 1 ? 'links' : 'link'} to ${events(wanted.size)}.`);
    // Nothing inside the umbrella is counted as somewhere else to go.
    for (const id of reach.reached.keys()) assert.ok(!inside.has(id), `${event.id}: ${id} is not inside it`);
  }
});

test('§3: and an event with no parts and no links still says so', () => {
  const leaf = atlas.activeEvents.find((event) => !isParent(atlas, event)
    && (atlas.adjacency.out.get(event.id) ?? []).length === 0);
  if (!leaf) return;
  const reach = partsReach(atlas, leaf);
  assert.equal(reach.parts, 0, 'nothing is inside it');
  assert.equal(reach.reached.size, 0, 'and there is nothing to reach');
});

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
import { placeLabels } from '../src/map/labels.js';
import { buildSearchIndex, covers, search, yearOf } from '../src/search.js';
import { groupLabel } from '../src/search-box.js';
import { extent } from '../src/util/dates.js';
import {
  categoriesShown, categoryCounts, categoryCountText, pluralLabel,
} from '../src/categories.js';
import { lensLabels, lensView, restingSet } from '../src/lens.js';
import { lensCountText } from '../src/lens-chips.js';
import { bandHandles, YEAR_INK } from '../src/window-band.js';
import { createTimelineScale } from '../src/timeline-scale.js';
import { eventCardHtml, partsReach, partsReachSentence } from '../src/panel/event.js';
import { defaultState } from '../src/state.js';

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

// The search index the box scans, built from the atlas exactly as the page
// builds it where the shard has not landed (search-box.js, `fromAtlas`).
const entries = buildSearchIndex({
  events: atlas.activeEvents,
  actors: [...atlas.actors.values()],
  places: [...atlas.places.values()],
  sources: [...atlas.sources.values()],
  offices: [...atlas.offices.values()],
});

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

// ─── 6. the placer's own two halves (A6) ────────────────────────────────────

test('§6: a candidate marked first is placed ahead of heavier ones', () => {
  // Three names that cannot all fit: the heaviest two would take the room, and
  // the light one marked `first` takes it instead. This is the floor of one per
  // lane said as the placer sees it — which lane a mark is in is the events
  // layer's business, and the order is this file's.
  const at = (id, weight, first) => ({
    id, text: 'a name', x: 0, y: 0, priority: 0, weight, first,
  });
  const order = (candidates) => placeLabels(candidates, { limits: { 0: 1 } }).map((l) => l.id);
  assert.deepEqual(order([at('heavy', 100, false), at('light', 1, true)]), ['light'],
    'the marked one is offered before the heavy one');
  assert.deepEqual(order([at('heavy', 100, false), at('light', 1, false)]), ['heavy'],
    'and without the mark the weight decides, as it always did');
  // Among the marked ones the weight still decides.
  assert.deepEqual(order([at('a', 1, true), at('b', 2, true)]), ['b']);
});

test('§6: a box the caller gives is the box the placer uses, and occupied ground is never won', () => {
  const box = (x0, x1) => ({ x0, x1, y0: 0, y1: 10 });
  const one = {
    id: 'one', text: 'x', x: 0, y: 5, priority: 0, weight: 1, box: box(0, 50),
  };
  assert.deepEqual(placeLabels([one], { limits: { 0: 9 } }).map((l) => l.box), [box(0, 50)],
    'the box is the one it was handed and not one made from the text');
  assert.deepEqual(placeLabels([one], { limits: { 0: 9 }, occupied: [box(40, 60)] }), [],
    'and ground already taken is never won');
  assert.deepEqual(placeLabels([one], { limits: { 0: 9 }, occupied: [box(60, 80)] }).length, 1,
    'ground it does not reach is not in the way');
  // And both edges of the view, since a label may be written leftwards from
  // what it names (the timeline's, M89 §5).
  const left = { ...one, box: box(-10, 20) };
  assert.deepEqual(placeLabels([left], { limits: { 0: 9 }, view: { x0: 0, y0: 0, x1: 100, y1: 10 } }), [],
    'a name that would run off the left edge is not written');
});

// ─── 7. a year in the search box finds the events of that year (A7) ─────────

test('§7: four digits find every event whose span covers that year, capped', () => {
  // A year the corpus actually has events in, derived rather than written: the
  // start year of the most eventful decade the atlas covers would do, and the
  // first one with more than a handful is enough.
  const years = new Map();
  for (const event of atlas.activeEvents) {
    const year = extent(event.when).min;
    if (!Number.isFinite(year)) continue;
    years.set(year, (years.get(year) ?? 0) + 1);
  }
  const year = [...years.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  const limit = 8;
  const result = search(entries, String(year), { limit });
  const group = result.groups.find((g) => g.kind === 'year');
  assert.ok(group, `a query of "${year}" has a group of its own`);
  assert.equal(group.year, year, 'and it says which year it is');

  // Every active event whose span covers it, computed here, capped and in the
  // group's own order.
  const wanted = atlas.activeEvents.filter((event) => covers(event.when, year));
  assert.ok(wanted.length > 0, 'the corpus has events in that year');
  assert.equal(group.items.length, Math.min(limit, wanted.length));
  const byWeight = [...wanted].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)
    || extent(a.when).min - extent(b.when).min
    || (a.id < b.id ? -1 : 1));
  assert.deepEqual(group.items.map((item) => item.id),
    byWeight.slice(0, limit).map((event) => event.id),
    'the heaviest of the year, in the year group\'s own order');
  assert.equal(groupLabel(group), `Events in ${year}`);
});

test('§7: and a query that is not four digits asks the old question only', () => {
  for (const query of ['18', '18570', '1857-1860', 'lisbon', '']) {
    assert.equal(yearOf(query), null, `"${query}" is not a year`);
    assert.ok(!search(entries, query).groups.some((g) => g.kind === 'year'),
      `"${query}" opens no year group`);
  }
  // A year the corpus has nothing in opens no group either: an empty heading is
  // the box saying it found something when it did not.
  const empty = atlas.extent.min - 100;
  assert.equal(search(entries, String(empty).padStart(4, '0')).groups.filter((g) => g.kind === 'year').length, 0);
});

// ─── 8. the category control says what it kept (A8) ─────────────────────────

test('§8: the sentence names what a chosen category kept and what stayed drawn', () => {
  // The category the corpus has most of, and the picture one switch leaves:
  // both derived. `restingSet` is what the views draw at rest (lens.js), which
  // is what `bandEvents` narrows and the control counts over.
  const shownCategories = categoriesShown(atlas.manifest);
  assert.ok(shownCategories.length > 0, 'the corpus uses categories');
  const chosen = [...shownCategories].sort((a, b) => b.count - a.count)[0];

  const resting = restingSet(atlas, defaultState());
  const drawn = atlas.activeEvents.filter((e) => resting.has(e.id));
  const kept = drawn.filter((e) => e.category === chosen.id).length;
  const none = drawn.filter((e) => !e.category).length;

  const counted = categoryCounts(drawn, [chosen]);
  assert.equal(counted.kept.length, 1);
  assert.equal(counted.kept[0].count, kept, `${chosen.id} in the resting picture`);
  assert.equal(counted.uncategorised, none, 'and the ones with no category at all');

  const text = categoryCountText(counted);
  if (kept > 0 && none > 0) {
    assert.equal(text,
      `${kept} ${pluralLabel(chosen.label)}, and ${none} events without a category still drawn`);
  }
  // The sentence names both numbers, whichever they are.
  if (kept > 0) assert.match(text, new RegExp(`\\b${kept}\\b`));
  if (none > 0) assert.match(text, new RegExp(`\\b${none}\\b`));
});

test('§8: and says nothing where there is nothing to explain', () => {
  assert.equal(categoryCountText({ kept: [], uncategorised: 0 }), '');
  assert.equal(categoryCountText({ kept: [{ id: 'war', label: 'War', count: 0 }], uncategorised: 0 }), '');
  // One category and nothing uncategorised: the clause that would say "0" is
  // not written, because it is the one that would be inventing a fact.
  assert.equal(categoryCountText({ kept: [{ id: 'war', label: 'War', count: 3 }], uncategorised: 0 }),
    '3 wars drawn');
  assert.equal(categoryCountText({ kept: [], uncategorised: 1 }),
    '1 event without a category still drawn');
  // Two, three and the plural rule, in the interface's own English.
  assert.equal(categoryCountText({
    kept: [{ id: 'war', label: 'War', count: 3 }, { id: 'treaty', label: 'Treaty', count: 2 }],
    uncategorised: 7,
  }), '3 wars and 2 treaties, and 7 events without a category still drawn');
  assert.equal(pluralLabel('Economy'), 'economies');
  assert.equal(pluralLabel('Election'), 'elections');
});

// ─── 9. the essay stops contradicting the about page (A9) ──────────────────

test('§9: neither page claims a language model wrote nothing, a test dataset, or a first slice', async () => {
  for (const page of ['essay.html', 'review.html']) {
    const text = await readFile(path.join(ROOT, page), 'utf8');
    for (const said of ['language model', 'test dataset', 'first slice']) {
      assert.ok(!text.toLowerCase().includes(said), `${page} still says "${said}"`);
    }
  }
});

test('§9: and the essay says who makes it and where the review state is, as the about page does', async () => {
  const essay = await readFile(path.join(ROOT, 'essay.html'), 'utf8');
  const about = await readFile(path.join(ROOT, 'about.html'), 'utf8');
  for (const said of ['with an assistant', '?review=1']) {
    assert.ok(essay.includes(said), `the essay does not say "${said}"`);
    assert.ok(about.includes(said), `the about page does not say "${said}"`);
  }
  // And the span it opens on is the corpus's own, which is what the front card
  // and the masthead say (intro.js, WHAT_IT_IS).
  assert.ok(essay.includes(`${atlas.extent.min} to `), `the essay says the atlas begins at ${atlas.extent.min}`);
});

// ─── 10. the actor lens's chip says what it is showing (A10) ────────────────

test('§10: the chip counts the events a focus names and the ones drawn around them', () => {
  // The actor with the most events, derived: the lens with most to explain.
  const actor = [...atlas.actors.values()]
    .map((a) => [a.id, (atlas.eventsByActor.get(a.id) ?? []).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0];
  assert.ok(actor, 'the corpus has an actor with events');
  const state = { ...defaultState(), focus: `actor:${actor}` };
  const view = lensView(atlas, state);
  assert.ok(view, 'it is a lens');

  // The two numbers, computed here out of the same two sets the three views
  // draw from (emphasis.js takes `shown` from this very view).
  const own = view.set.size;
  const around = view.shown.size - own;
  assert.ok(own > 0, 'the lens names events');
  assert.equal(lensCountText(atlas, state, lensLabels(atlas, state)),
    around > 0
      ? `${own} ${own === 1 ? 'event' : 'events'}, and ${around} around ${own === 1 ? 'it' : 'them'}`
      : `${own} ${own === 1 ? 'event' : 'events'}`);
  // And it is news: the picture is bigger than the actor's own events, which
  // is the whole of what A10 found.
  assert.ok(around > 0, `the lens on ${actor} draws ${view.shown.size} for ${own} of its own`);
});

test('§10: and says nothing where the numbers would not be about the picture', () => {
  assert.equal(lensCountText(atlas, defaultState(), []), '', 'no lens, no sentence');
  // Two foci share one ring, so neither chip can carry the picture's numbers;
  // the masthead's own count is what says what is in view (window-control.js).
  const two = [...atlas.actors.values()]
    .filter((a) => (atlas.eventsByActor.get(a.id) ?? []).length > 0).slice(0, 2).map((a) => a.id);
  if (two.length === 2) {
    const state = { ...defaultState(), focus: `actor:${two[0]},actor:${two[1]}` };
    assert.equal(lensCountText(atlas, state, lensLabels(atlas, state)), '');
  }
});

// ─── 11. the edges (A11) ────────────────────────────────────────────────────

test('§11: the band\'s two years are anchored inside the drawing at every width', () => {
  // A scale over the corpus's own extent, and the band at the extent, which is
  // where the two handles stand at the two edges of the drawing — the case the
  // review saw clipped at every width it looked at.
  const domain = [atlas.extent.min - 1, atlas.extent.max + 1];
  for (const width of [1280, 960, 390, 200]) {
    const scale = createTimelineScale({
      domain, range: [0, width], counts: null, extent: atlas.extent,
    });
    const labels = [];
    const into = { take: (_, attrs, text) => labels.push({ ...attrs, ...text }) };
    const handles = { take: () => {} };
    bandHandles(handles, into, { from: atlas.extent.min, to: atlas.extent.max }, {
      scale, extent: atlas.extent, top: 0, height: 10, labelY: 8, width,
    });
    assert.equal(labels.length, 2, `${width}: both years are written`);
    for (const label of labels) {
      // The box the anchor and the alignment give it, in the drawing's own
      // units: the ink is the module's estimate of the stylesheet and the test
      // asks it rather than writing a second one.
      const ink = YEAR_INK;
      const x0 = label['text-anchor'] === 'end' ? label.x - ink
        : label['text-anchor'] === 'middle' ? label.x - ink / 2 : label.x;
      assert.ok(x0 >= 0, `${width}: "${label.text}" begins at ${x0}`);
      assert.ok(x0 + ink <= width, `${width}: "${label.text}" ends at ${x0 + ink} of ${width}`);
    }
  }
});

test('§11: a window of one year is still one label, and still inside the pane', () => {
  const domain = [atlas.extent.min - 1, atlas.extent.max + 1];
  const width = 390;
  const scale = createTimelineScale({ domain, range: [0, width], counts: null, extent: atlas.extent });
  const labels = [];
  bandHandles({ take: () => {} }, { take: (_, attrs, text) => labels.push({ ...attrs, ...text }) },
    { from: atlas.extent.max, to: atlas.extent.max },
    { scale, extent: atlas.extent, top: 0, height: 10, labelY: 8, width });
  assert.equal(labels.length, 1, 'one year, one label');
  assert.equal(labels[0]['text-anchor'], 'middle');
  assert.ok(labels[0].x - YEAR_INK / 2 >= 0 && labels[0].x + YEAR_INK / 2 <= width);
});

test('§11: an event with no place says "no single place", and nothing beside a lane', () => {
  const placeless = atlas.activeEvents.filter((e) => !atlas.pointOf(e));
  assert.ok(placeless.length > 0, 'the corpus has an event with no place');
  const withLane = placeless.find((e) => e.region);
  const withoutLane = placeless.find((e) => !e.region);
  const ctx = {
    atlas,
    laneLabel: (region) => region ?? '—',
    categoryLabel: (id) => (id ? `${id[0].toUpperCase()}${id.slice(1)}` : null),
    lanes: () => [],
    startYear: (event) => extent(event.when).min,
    eventLink: (event) => `<button type="button" class="link" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    entryLink: () => '',
    discussLink: () => '',
    wikipediaHtml: () => '',
    historyHtml: () => '',
    lensControl: () => '',
    partOfHtml: () => '',
    highlightedActor: () => null,
  };
  if (withLane) {
    const html = eventCardHtml(ctx, { event: withLane, found: { via: [] }, state: defaultState() });
    assert.ok(!html.includes('no single place'), 'the lane already says where it was');
    assert.ok(!html.includes('timeline only'), 'and the builder\'s phrase is gone');
  }
  if (withoutLane) {
    const html = eventCardHtml(ctx, { event: withoutLane, found: { via: [] }, state: defaultState() });
    assert.ok(html.includes('no single place'), 'and with no lane either it is said');
  }
});

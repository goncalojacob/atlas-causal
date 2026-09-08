// The parts of the territories layer that are decidable without a DOM: what
// a presence says when hovered, what classes it is drawn with, and the
// data.js side that chooses which presences a year shows and which shard
// their outlines are in.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  presenceTitle, presenceClasses, hueActorOf, createPresencesLayer, detailFor,
} from '../src/map/layers/presences.js';
import { loadAtlas } from '../src/data.js';
import { extent as intervalExtent } from '../src/util/dates.js';
import { countPoints, simplifyGeometry } from '../src/util/simplify.js';
import { ROOT } from './helpers.mjs';

const fetchJson = async (url) => JSON.parse(await readFile(path.join(ROOT, url.split('?')[0]), 'utf8'));
// The presence metadata is its own file since I1 and the atlas answers
// emptily until it lands, so the cases below that are about *which* presences
// a year shows ask for it first. That it is asked for at all, and that the
// layer redraws when it arrives, is held further down.
const atlas = async () => {
  const a = await loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
  await a.loadPresences();
  return a;
};
const nameOf = (id) => ({ 'fixture-polity-three': 'Fixture Polity Three', 'fixture-polity-four': 'Fixture Polity Four' })[id] ?? null;

test('a presence says who, how long, and whose', () => {
  const own = { actor: 'fixture-polity-three', dependencyOf: null, dependencyKind: null, when: { start: 1100, end: null }, confidence: 'consensus' };
  assert.equal(presenceTitle(own, { nameOf }), 'Fixture Polity Three · 1100 – ongoing');
  const colony = { actor: 'fixture-polity-four', dependencyOf: 'fixture-polity-three', dependencyKind: 'colony', when: { start: 1120, end: 1199 }, confidence: 'probable' };
  assert.equal(presenceTitle(colony, { nameOf }), 'Fixture Polity Four — colony of Fixture Polity Three · 1120 – 1199');
  // Danzig's case: held as a mandate by something that is not a state here.
  const mandate = { ...colony, dependencyOf: null, dependencyKind: 'mandate', confidence: 'disputed' };
  assert.match(presenceTitle(mandate, { nameOf }), /mandate of an administration that is not a state on this map · 1120 – 1199 · disputed$/);
  // An actor the topology has lost still names itself rather than nothing.
  assert.match(presenceTitle({ ...own, actor: 'gone' }, { nameOf }), /^gone /);
});

test('classes separate its own ground from somebody\'s, and mark the selection', () => {
  const own = { actor: 'a', dependencyOf: null, confidence: 'consensus', id: 'a-1' };
  const colony = { actor: 'b', dependencyOf: 'a', confidence: 'consensus', id: 'b-1' };
  const none = { actorId: null, dependencyIds: new Set() };
  assert.equal(presenceClasses(own, none), 'presence sovereign unhued');
  assert.equal(presenceClasses(colony, none), 'presence dependency unhued');
  assert.equal(presenceClasses({ ...own, confidence: 'disputed' }, none), 'presence sovereign unhued disputed');
  // Selecting an actor fills its own ground and the ground it held.
  const selected = { actorId: 'a', dependencyIds: new Set(['b-1']) };
  assert.equal(presenceClasses(own, selected), 'presence sovereign unhued of-actor');
  assert.equal(presenceClasses(colony, selected), 'presence dependency unhued of-actor');
  assert.equal(presenceClasses(colony, { actorId: 'c', dependencyIds: new Set() }), 'presence dependency unhued');
});

test('a dependency is drawn in its owner\'s hue, not its own', () => {
  const own = { actor: 'a', dependencyOf: null, confidence: 'consensus', id: 'a-1' };
  const colony = { actor: 'b', dependencyOf: 'a', confidence: 'consensus', id: 'b-1' };
  // Danzig's case: held by nobody who is an actor here. It was already drawn
  // as its own ground, and it keeps its own hue to match.
  const mandate = { actor: 'b', dependencyOf: null, dependencyKind: 'mandate', confidence: 'consensus', id: 'b-2' };
  const hueOf = (id) => ({ a: 3, b: 6 })[id] ?? null;
  const ctx = { actorId: null, dependencyIds: new Set(), hueOf };
  assert.equal(hueActorOf(colony), 'a');
  assert.equal(hueActorOf(mandate), 'b');
  assert.equal(presenceClasses(own, ctx), 'presence sovereign hue-3');
  assert.equal(presenceClasses(colony, ctx), 'presence dependency hue-3', "the owner's hue");
  assert.equal(presenceClasses(mandate, ctx), 'presence sovereign hue-6');
  // An actor the palette has never been rebuilt for keeps the old wash.
  assert.equal(presenceClasses({ ...own, actor: 'z' }, ctx), 'presence sovereign unhued');
});

test('the palette reaches the atlas as one hue per actor', async () => {
  const a = await atlas();
  assert.equal(a.hueOfActor('fixture-polity-three'), 0);
  assert.equal(a.hueOfActor('nobody'), null, 'an actor with no territory has no hue');
});

test('data.js loads a shard by year and caches it', async () => {
  const a = await atlas();
  assert.deepEqual(a.presenceShards.map((s) => `${s.from}-${s.to}`), ['1100-1199', '1200-1299']);
  assert.equal(a.shardForYear(1150).file, 'geo/presences/1100-1199.json');
  assert.equal(a.shardForYear(1250).file, 'geo/presences/1200-1299.json');
  assert.equal(a.shardForYear(900), null, 'a year the shards do not cover draws nothing');

  assert.equal(a.loadedGeometry('geo/presences/1100-1199.json'), null, 'nothing is fetched until a year needs it');
  const outlines = await a.loadGeometry('geo/presences/1100-1199.json');
  assert.deepEqual([...outlines.keys()].sort(), ['f1', 'f2']);
  assert.equal(outlines.get('f1').type, 'Polygon');
  assert.equal(a.loadedGeometry('geo/presences/1100-1199.json'), outlines, 'and once fetched it is in hand');
  assert.equal(await a.loadGeometry('geo/presences/1100-1199.json'), outlines);
});

test('a year shows one presence per actor: the one that started last', async () => {
  const a = await atlas();
  assert.deepEqual(a.presencesAt(1150).map((p) => p.id), ['fixture-polity-four-1120', 'fixture-polity-three-1100']);
  assert.deepEqual(a.presencesAt(1250).map((p) => p.id), ['fixture-polity-four-1200', 'fixture-polity-three-1100']);
  assert.deepEqual(a.presencesAt(1110).map((p) => p.id), ['fixture-polity-three-1100'], 'before the colony existed');
  assert.deepEqual(a.presencesAt(1280).map((p) => p.id), ['fixture-polity-three-1100'], 'after it ended');
  // The year a border moved in is in both intervals; the later one is drawn.
  const clash = { ...a.presences.get('fixture-polity-four-1200'), when: { start: 1199, end: 1260 } };
  a.presencesByActor.get('fixture-polity-four')[1] = clash;
  assert.equal(a.presencesAt(1199).filter((p) => p.actor === 'fixture-polity-four').length, 1);
});

test('an actor\'s territory, and what it held, are in the topology already', async () => {
  const a = await atlas();
  assert.deepEqual(a.presencesByActor.get('fixture-polity-four').map((p) => p.id),
    ['fixture-polity-four-1120', 'fixture-polity-four-1200'], 'chronological');
  assert.deepEqual(a.dependenciesOf.get('fixture-polity-three').map((p) => p.id),
    ['fixture-polity-four-1120', 'fixture-polity-four-1200']);
  assert.equal(a.dependenciesOf.get('fixture-polity-four'), undefined, 'it held nothing');
});

// A shard that will not load leaves the year before it on the screen, which
// is usually the same picture and therefore says nothing at all. The layer
// swallowed the rejection; now it reports it, once, and takes it back when a
// shard finally arrives.
test('a shard that will not load is said once, and unsaid when one arrives', async () => {
  // No DOM in node --test, and the failing path never draws: the group is
  // only listened to and emptied.
  const group = { addEventListener() {}, replaceChildren() {}, appendChild() {} };
  const said = [];
  let fail = true;
  const loaded = new Map();
  const stub = {
    actors: new Map(),
    hueOfActor: () => null,
    territoryYear: (y) => y,
    shardForYear: () => ({ file: 'geo/presences/1100-1199.json', from: 1100, to: 1199 }),
    loadedGeometry: (file) => loaded.get(file) ?? null,
    loadGeometry: async (file) => {
      if (fail) throw new Error('offline');
      loaded.set(file, new Map());
      return loaded.get(file);
    },
    presencesAt: () => [],
    dependenciesOf: new Map(),
  };
  const layer = createPresencesLayer(group, { project: () => [0, 0] }, {
    atlas: stub, onSelect: () => {}, onFailed: (failed) => said.push(failed),
  });
  const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  layer.render({ year: 1150 });
  await settle();
  assert.deepEqual(said, [true]);

  // A second failure is the same failure: the reader is told once.
  layer.render({ year: 1150 });
  await settle();
  assert.deepEqual(said, [true], 'said once');
  assert.equal(layer.render({ year: 1150 }).failed, true);

  fail = false;
  layer.render({ year: 1150 });
  await settle();
  assert.deepEqual(said, [true, false], 'and taken back when the shard arrives');
});

// I1: the metadata that says who held which outline is not in the spine any
// more, so the layer asks for it where it already asks for the outlines and
// redraws when it lands. Until then it draws nothing rather than drawing the
// coastline with no borders on it and calling that a map of 1150.
// The drawing itself is a DOM and is asserted in the browser
// (tests/map-browser.test.mjs); what is held here is the request and what the
// layer reports about it.
test('the layer asks for the presence file and draws when it arrives', async () => {
  const group = { addEventListener() {}, replaceChildren() {}, appendChild() {} };
  const asked = [];
  const a = await loadAtlas({
    dataRoot: 'tests/fixtures/data/',
    fetchJson: (url) => { asked.push(url); return fetchJson(url); },
  });
  const before = asked.length;
  let redrawn = 0;
  const layer = createPresencesLayer(group, { project: ([lon, lat]) => [lon, lat] }, {
    atlas: a, onSelect: () => {}, onFailed: () => {}, defer: (fn) => fn(),
  });
  const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  const first = layer.render({ year: 1150, onReady: () => { redrawn += 1; } });
  assert.deepEqual(first, { drawn: 0, pending: true, failed: false }, 'nothing yet, and it says so');
  // Polled rather than counted in macrotasks: the fetch here is a read off
  // disk, and how many turns of the loop that takes is not this test's claim.
  for (let i = 0; i < 200 && redrawn === 0; i += 1) await settle();
  assert.equal(redrawn, 1, 'and it asked to be drawn again');
  const fetched = asked.slice(before);
  assert.equal(fetched.filter((url) => /\/index\/presences-[0-9a-f]{12}\.json$/.test(url)).length, 1,
    `asked for the presence file once: ${fetched.join(' · ')}`);

  // And the atlas has them, which is what the next render draws.
  assert.equal(a.presencesLoaded(), true);
  assert.deepEqual(a.presencesAt(1150).map((p) => p.id),
    ['fixture-polity-four-1120', 'fixture-polity-three-1100']);
});

// --- the interval index ----------------------------------------------------
//
// H4a put an interval index under `presencesAt`, which was a scan of every
// presence on every render (health review B, finding 24). The scan it
// replaced is kept here and the two are held to the same answer, year by
// year, over both datasets — including the years either side of every
// boundary, which is where an index built wrong goes wrong.

function scanPresencesAt(presences, year) {
  const chosen = new Map();
  for (const presence of presences) {
    const { min, max } = intervalExtent(presence.when);
    if (year < min || (max !== null && year > max)) continue;
    const standing = chosen.get(presence.actor);
    if (!standing || intervalExtent(standing.when).min < min) chosen.set(presence.actor, presence);
  }
  return [...chosen.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map((p) => p.id);
}

// Every year the answer can change in, and the years either side of it.
function yearsWorthAsking(presences) {
  const years = new Set();
  for (const presence of presences) {
    const { min, max } = intervalExtent(presence.when);
    for (const year of [min, max]) {
      if (year === null) continue;
      for (const d of [-1, 0, 1]) years.add(year + d);
    }
  }
  return [...years].sort((a, b) => a - b);
}

test('the index answers what the scan answered, on every year that can differ', async () => {
  for (const [what, dataRoot] of [['the fixtures', 'tests/fixtures/data/'], ['the atlas', 'data/']]) {
    const a = await loadAtlas({ dataRoot, fetchJson });
    await a.loadPresences();
    const all = [...a.presences.values()];
    assert.ok(all.length > 0, `${what} has presences`);
    const years = yearsWorthAsking(all);
    assert.ok(years.length > 4, `${what}: ${years.length} years worth asking about`);
    for (const year of years) {
      // The clamp is the atlas's, and both sides of the comparison get it.
      const clamped = a.territoryYear(year);
      assert.deepEqual(a.presencesAt(year).map((p) => p.id), scanPresencesAt(all, clamped),
        `${what}, ${year}`);
    }
    // And a year the index has never been asked about before, twice: the
    // answer is kept between calls and it is not the same array, so a caller
    // that sorts what it was given does not sort what the next one gets.
    const [first, second] = [a.presencesAt(years[3]), a.presencesAt(years[3])];
    assert.deepEqual(first, second);
    assert.notEqual(first, second, 'a caller gets its own array');
  }
});

// --- how much border detail is worth drawing -------------------------------

test('the detail a zoom is worth goes down as the reader goes in, never up', () => {
  const ladder = [1, 1.9, 2, 4, 7.9, 8, 20, 40].map((k) => detailFor(k).tolerance);
  for (let i = 1; i < ladder.length; i += 1) {
    assert.ok(ladder[i] <= ladder[i - 1], `k rung ${i}: ${ladder[i]} is not coarser than ${ladder[i - 1]}`);
  }
  assert.equal(detailFor(40).tolerance, 0, 'and at the deepest zoom the shard is drawn as it was written');
  assert.ok(detailFor(1).tolerance > 0, 'while the whole world is not');
});

test('simplifying an outline takes points off it and leaves it an outline', () => {
  // A ring with a great deal to say about very little: a hundred steps around
  // a circle two degrees across.
  const ring = [];
  for (let i = 0; i <= 100; i += 1) {
    const angle = (2 * Math.PI * i) / 100;
    ring.push([Math.cos(angle), Math.sin(angle)]);
  }
  const geometry = { type: 'Polygon', coordinates: [ring] };
  const taken = simplifyGeometry(geometry, { tolerance: detailFor(1).tolerance });
  assert.ok(countPoints(taken) < countPoints(geometry), `${countPoints(taken)} of ${countPoints(geometry)} points`);
  assert.ok(countPoints(taken) >= 4, 'and it is still a ring');
  assert.equal(simplifyGeometry(geometry, { tolerance: 0 }), geometry, 'no tolerance is no simplification');
  assert.equal(simplifyGeometry(null, { tolerance: 1 }), null);
});

// --- the first shard -------------------------------------------------------
//
// The borders are 880 KB nobody has asked for, and the first render fetched
// them ahead of the coastlines being painted (health review B, finding 24).

test('the first shard waits for the land, and the second does not', async () => {
  const group = { addEventListener() {}, replaceChildren() {}, appendChild() {} };
  const asked = [];
  const waiting = [];
  const loaded = new Map();
  const stub = {
    actors: new Map(),
    hueOfActor: () => null,
    territoryYear: (y) => y,
    shardForYear: (y) => ({ file: `geo/presences/${y}.json`, from: y, to: y }),
    loadedGeometry: (file) => loaded.get(file) ?? null,
    loadGeometry: async (file) => {
      asked.push(file);
      loaded.set(file, new Map());
      return loaded.get(file);
    },
    presencesAt: () => [],
    dependenciesOf: new Map(),
  };
  const layer = createPresencesLayer(group, { project: () => [0, 0] }, {
    atlas: stub, onSelect: () => {}, defer: (fn) => waiting.push(fn),
  });
  const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  assert.deepEqual(layer.render({ year: 1150 }), { drawn: 0, pending: true, failed: false });
  await settle();
  assert.deepEqual(asked, [], 'nothing was fetched inside the render');
  assert.equal(waiting.length, 1, 'it was handed to the caller to schedule');
  waiting.pop()();
  await settle();
  assert.deepEqual(asked, ['geo/presences/1150.json']);

  // The second shard is a reader who is already looking at borders and
  // waiting for the next ones: it goes at once.
  layer.render({ year: 1250 });
  await settle();
  assert.deepEqual(asked, ['geo/presences/1150.json', 'geo/presences/1250.json']);
  assert.deepEqual(waiting, []);
});

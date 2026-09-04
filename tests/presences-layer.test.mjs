// The parts of the territories layer that are decidable without a DOM: what
// a presence says when hovered, what classes it is drawn with, and the
// data.js side that chooses which presences a year shows and which shard
// their outlines are in.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { presenceTitle, presenceClasses, hueActorOf } from '../src/map/layers/presences.js';
import { loadAtlas } from '../src/data.js';
import { ROOT } from './helpers.mjs';

const fetchJson = async (url) => JSON.parse(await readFile(path.join(ROOT, url.split('?')[0]), 'utf8'));
const atlas = () => loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
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

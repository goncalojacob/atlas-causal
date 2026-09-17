// A territory shows everything that happened on it (M54).
//
// The owner, having selected Brazil and been given three twentieth-century
// events where four centuries belonged: *"when I select a territory I can see
// all events that are related to that territory independent of the timespan I
// select"*. A reader who clicks a territory has clicked a **polygon**, and the
// events that belong to it are the events whose place lies inside that
// polygon, at any date.
//
// So this is M48's join with the date test taken out, and the two are not the
// same question: `grounds` answers *what did this polity do*, which is a
// question about a polity at a time, and this answers *what happened here*,
// which is a question about ground. Both have readers and both are built.
//
// The join is held to literals — two squares, a handful of events — because
// what it has to get right is a rule and not a fact about this corpus. The
// corpus is then asked whether the rule reached the case that was reported.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildGrounds, buildTerritories, byActor } from '../src/grounds.js';
import { activeFoci, eventsOfFocus, dimmedOfFocus, lensView } from '../src/lens.js';
import { defaultState } from '../src/state.js';
import { atlasOf, ROOT } from './helpers.mjs';

const square = (x0, y0, x1, y1) => ({
  type: 'Polygon',
  coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
});

// One polity that grew: the west from 1400 to 1500, and the west *and the
// middle* from 1500 on. A territory that grew must not be punished for
// growing, which is what the union of its presences is for.
const PRESENCES = [
  {
    id: 'west-1400',
    status: 'active',
    actor: 'west',
    dependencyOf: null,
    when: { start: 1400, end: 1500 },
    geometry: { files: ['geo/presences/a.json'], key: 'west' },
  },
  {
    id: 'west-1500',
    status: 'active',
    actor: 'west',
    dependencyOf: null,
    when: { start: 1500, end: null },
    geometry: { files: ['geo/presences/a.json'], key: 'wider' },
  },
  {
    id: 'east-1500',
    status: 'active',
    actor: 'east',
    dependencyOf: 'west',
    when: { start: 1500, end: 1550 },
    geometry: { files: ['geo/presences/a.json'], key: 'east' },
  },
  {
    id: 'gone-1500',
    status: 'retracted',
    actor: 'nobody',
    dependencyOf: null,
    when: { start: 1500, end: null },
    geometry: { files: ['geo/presences/a.json'], key: 'nobody' },
  },
];

const OUTLINES = new Map([
  ['west', square(0, 0, 10, 10)],
  ['wider', square(0, 0, 18, 10)],
  ['east', square(20, 0, 30, 10)],
  ['nobody', square(0, 0, 30, 10)],
]);

const PLACES = new Map([
  ['inside', { id: 'inside', where: { lon: 5, lat: 5 } }],
  ['grown-into', { id: 'grown-into', where: { lon: 15, lat: 5 } }],
  ['dependency', { id: 'dependency', where: { lon: 25, lat: 5 } }],
  ['outside', { id: 'outside', where: { lon: 100, lat: 5 } }],
  ['unplaced', { id: 'unplaced', where: null }],
]);

const event = (id, place, year, extra = {}) => ({
  id, status: 'active', place, when: { start: year, end: year }, actors: [], ...extra,
});

const EVENTS = [
  event('in-the-west', 'inside', 1450),
  // Three hundred years before anybody was there, which is the whole of what
  // this milestone is about.
  event('long-before', 'inside', 1100),
  // On ground the polity only later grew into, and before it did.
  event('before-it-grew', 'grown-into', 1450),
  event('in-the-dependency', 'dependency', 1520),
  event('after-the-dependency', 'dependency', 1900),
  event('far-away', 'outside', 1450),
  event('nowhere', 'unplaced', 1450),
  event('withdrawn', 'inside', 1450, { status: 'retracted' }),
];

const territories = () => buildTerritories(EVENTS, PLACES, PRESENCES,
  (presence) => OUTLINES.get(presence.geometry.key) ?? null);

test('a point inside the outline is on that territory whatever the date', () => {
  const found = territories();
  assert.deepEqual(found.get('in-the-west'), ['west']);
  assert.deepEqual(found.get('long-before'), ['west'], 'three centuries before the polity existed');
});

test('the union of the presences, so a territory that grew is not punished for growing', () => {
  // `grown-into` is outside the 1400 outline and inside the 1500 one, and the
  // event is dated 1450: neither presence covers it on its own terms.
  assert.deepEqual(territories().get('before-it-grew'), ['west']);
  assert.equal(buildGrounds(EVENTS, PLACES, PRESENCES,
    (p) => OUTLINES.get(p.geometry.key) ?? null).has('before-it-grew'), false,
  'which is exactly what the dated pass says about it');
});

test('a dependency’s ground is its sovereign’s here too, and at any date', () => {
  const found = territories();
  assert.deepEqual(found.get('in-the-dependency'), ['east', 'west']);
  assert.deepEqual(found.get('after-the-dependency'), ['east', 'west'],
    'centuries after the dependency gave it up');
});

test('outside every outline, or with no point at all, is still nothing', () => {
  const found = territories();
  assert.equal(found.has('far-away'), false);
  assert.equal(found.has('nowhere'), false, 'a place with no coordinates is not an error');
});

test('a retracted event and a retracted presence are both left out', () => {
  const found = territories();
  assert.equal(found.has('withdrawn'), false);
  for (const actors of found.values()) assert.ok(!actors.includes('nobody'), 'a withdrawn presence holds nothing');
});

test('everything the dated pass finds, the territorial pass finds too', () => {
  const dated = buildGrounds(EVENTS, PLACES, PRESENCES, (p) => OUTLINES.get(p.geometry.key) ?? null);
  const all = territories();
  for (const [id, actors] of dated) {
    for (const actor of actors) {
      assert.ok((all.get(id) ?? []).includes(actor), `${id} is on ${actor}'s dated ground and not on its territory`);
    }
  }
});

test('the other direction is the one the lens asks', () => {
  const inverted = byActor(territories());
  assert.deepEqual([...inverted.get('east')].sort(), ['after-the-dependency', 'in-the-dependency']);
  assert.ok([...inverted.get('west')].includes('long-before'));
});

// ─── the lens, over a topology written by hand ────────────────────────────
//
// What is found and what is *emphasised* are two questions. Dates decide the
// second one alone: the actor's own span gives the full drawing, and
// everything else on its ground is dimmed, which is what M48's one-hop
// neighbours already are. No new token and no new type size — dimmed already
// means "related, not chosen".

const lensEvent = (id, when, actors = []) => ({
  id, title: id, status: 'active', when, place: null, region: 'europe', weight: 0,
  actors: actors.map((actor) => ({ actor, role: 'leader' })),
});

// A polity of the twentieth century standing on ground four centuries old:
// Brazil's case, as small as it goes.
function polity() {
  const events = [
    lensEvent('its-own', { start: 1950, end: 1950 }, ['late']),
    lensEvent('on-its-ground-now', { start: 1960, end: 1960 }),
    lensEvent('long-before-it', { start: 1500, end: 1500 }),
    lensEvent('elsewhere', { start: 1500, end: 1500 }),
  ];
  const inside = new Map([['late', new Set(['on-its-ground-now', 'long-before-it', 'its-own'])]]);
  return {
    activeEvents: events,
    events: new Map(events.map((e) => [e.id, e])),
    edges: new Map(),
    sources: new Map(),
    narratives: new Map(),
    actors: new Map([['late', { id: 'late', name: 'Late', when: { start: 1886, end: null } }]]),
    places: new Map(),
    adjacency: { in: new Map(), out: new Map() },
    eventsInsideTerritoryOf: (id) => inside.get(id) ?? null,
    resolve: (id) => (id === 'late' ? { id, kind: 'actor', record: { id } } : null),
  };
}

const sorted = (set) => [...set].sort();

test('a lens on a polity keeps what is on its ground, at any date', () => {
  const found = eventsOfFocus('actor:late', polity());
  assert.deepEqual(sorted(found), ['its-own', 'long-before-it', 'on-its-ground-now']);
  assert.equal(found.has('elsewhere'), false, 'and nothing that is not on it');
});

test('what the polity itself did is drawn in full; the rest of its ground is dimmed', () => {
  const t = polity();
  const dimmed = dimmedOfFocus('actor:late', t);
  assert.deepEqual(sorted(dimmed), ['long-before-it'], 'four centuries before the polity, so related and not chosen');
  const view = lensView(t, { ...defaultState(), focus: 'actor:late' });
  assert.deepEqual(sorted(view.set), ['its-own', 'on-its-ground-now']);
  assert.ok(view.near.has('long-before-it'), 'it is dimmed rather than removed');
  assert.ok(view.shown.has('long-before-it'), 'and it is still drawn');
});

test('an atlas with no territories file is the lens as it was', () => {
  const t = polity();
  t.eventsInsideTerritoryOf = () => null;
  assert.deepEqual(sorted(eventsOfFocus('actor:late', t)), ['its-own'],
    'a frame of the old picture, never a wrong one');
  assert.equal(dimmedOfFocus('actor:late', t).size, 0);
});

test('only an actor has a territory: no other kind of focus dims anything', () => {
  const t = polity();
  for (const focus of ['place:lisbon', 'event:its-own', 'region:europe', 'source:book', 'narrative:x']) {
    assert.equal(dimmedOfFocus(focus, t).size, 0, focus);
  }
});

// ─── and the case the owner reported ──────────────────────────────────────
//
// No count is pinned. How many events stand on Brazilian ground is a fact
// about this corpus's places and this dataset's outlines, and the next import
// moves it; what is asserted is that the ground is what finds them.

test('selecting Brazil reaches the landfall of 1500, dimmed', async () => {
  const atlas = await atlasOf(path.join(ROOT, 'data'));
  const lens = eventsOfFocus('actor:brazil', atlas);
  assert.ok(lens.has('portuguese-landfall-in-brazil-1500'),
    'the event the owner went looking for and did not find');
  const dimmed = dimmedOfFocus('actor:brazil', atlas);
  assert.ok(dimmed.has('portuguese-landfall-in-brazil-1500'),
    'four centuries before the polity: related, not chosen');

  // The rest of the Brazilian chain that stands on Brazilian ground — every
  // one of them centuries before the CShapes record begins in 1886.
  for (const id of ['indigenous-depopulation-of-coastal-brazil', 'dutch-brazil-1630-1654',
    'the-brazilian-gold-cycle', 'independence-of-brazil-1822']) {
    assert.ok(lens.has(id), `${id} is on Brazilian ground and outside Brazil's lens`);
  }

  // And what the lens had before this milestone is still in it, in full.
  const named = new Set((atlas.eventsByActor.get('brazil') ?? []).map((a) => a.event.id));
  const onGround = [...lens].filter((id) => atlas.groundOf(id).includes('brazil'));
  for (const id of [...named, ...onGround]) {
    assert.ok(lens.has(id), `${id} was in Brazil's lens before M54`);
    assert.equal(dimmed.has(id), false, `${id} is what Brazil itself did and must stay full`);
  }
  assert.ok(onGround.length > 0, 'the dated pass still answers for Brazil');
});

test('every event a territorial lens keeps is inside that territory or names it', async () => {
  const atlas = await atlasOf(path.join(ROOT, 'data'));
  for (const actor of ['brazil', 'portugal']) {
    const lens = eventsOfFocus(`actor:${actor}`, atlas);
    const named = new Set((atlas.eventsByActor.get(actor) ?? []).map((a) => a.event.id));
    for (const id of lens) {
      assert.ok(named.has(id) || atlas.groundOf(id).includes(actor) || atlas.territoryOf(id).includes(actor),
        `${id} is in ${actor}'s lens for none of the three reasons`);
    }
  }
});

test('a lens on an actor that holds no ground and names no event is still not a lens', async () => {
  const atlas = await atlasOf(path.join(ROOT, 'data'));
  const empty = [...atlas.actors.keys()].find((id) => (atlas.eventsByActor.get(id) ?? []).length === 0
    && !atlas.eventsInsideTerritoryOf(id));
  assert.ok(empty, 'the corpus has an actor with neither');
  assert.equal(eventsOfFocus(`actor:${empty}`, atlas).size, 0);
  assert.deepEqual(activeFoci(atlas, { ...defaultState(), actor: empty }), [],
    'and opening its card does not empty the atlas');
});

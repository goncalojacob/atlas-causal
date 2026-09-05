// The map's viewport: what "in view" means for one event, and the two
// conversions between the pan/zoom transform and the box the URL carries.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  inView, containsPoint, pointOfEvent, eventsInView, boxesOverlap, regionBoxOf,
} from '../src/util/viewport.js';
import {
  createProjection, fitBounds, viewBbox, viewBboxIn, bboxTransform, WORLD,
} from '../src/map/projection.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAtlas } from '../src/data.js';
import { ROOT } from './helpers.mjs';

const places = new Map([
  ['lisbon', { id: 'lisbon', where: { lon: -9.14, lat: 38.72 } }],
  ['goa', { id: 'goa', where: { lon: 73.83, lat: 15.5 } }],
  ['nowhere', { id: 'nowhere' }],
]);
const event = (id, place) => ({ id, place });
const PORTUGAL = [-10, 36, -6, 43];

test('an event is in view when its place is inside the box', () => {
  assert.equal(inView(event('a', 'lisbon'), PORTUGAL, places), true);
  assert.equal(inView(event('b', 'goa'), PORTUGAL, places), false);
  // No box is the world, whatever the event is.
  assert.equal(inView(event('b', 'goa'), null, places), true);
});

test('an event that does not say where is not in view', () => {
  assert.equal(inView(event('c', null), PORTUGAL, places), false);
  assert.equal(inView(event('d', 'atlantis'), PORTUGAL, places), false, 'a place the atlas has lost');
  assert.equal(inView(event('e', 'nowhere'), PORTUGAL, places), false, 'a place with no point');
  // But with no box there is nothing to be outside of.
  assert.equal(inView(event('c', null), null, places), true);
});

// --- an event with no place answers with its region -----------------------

const REGIONS = new Map([['europe', [-11, 35, 40, 71]], ['asia', [26, -11, 146, 55]]]);
const process = (id, region) => ({ id, place: null, region });

test('two boxes overlap when they share ground, edges included', () => {
  assert.equal(boxesOverlap(PORTUGAL, [-8, 38, 20, 50]), true);
  assert.equal(boxesOverlap(PORTUGAL, [-6, 43, 20, 50]), true, 'touching at a corner is sharing it');
  assert.equal(boxesOverlap(PORTUGAL, [0, 38, 20, 50]), false, 'east of it');
  assert.equal(boxesOverlap(PORTUGAL, [-9, 10, -7, 20]), false, 'south of it');
  // No box is the world; anything that is not a box is nowhere.
  assert.equal(boxesOverlap(null, [0, 0, 1, 1]), true);
  assert.equal(boxesOverlap(PORTUGAL, null), false);
  assert.equal(boxesOverlap(PORTUGAL, [0, 0, 1]), false);
  // A viewport written wrapped means the strip it names, as containsPoint does.
  assert.equal(boxesOverlap([170, -10, -170, 10], [175, -5, 179, 5]), true);
  assert.equal(boxesOverlap([170, -10, -170, 10], [-179, -5, -175, 5]), true);
  assert.equal(boxesOverlap([170, -10, -170, 10], [0, -5, 10, 5]), false);
});

test('an event with no place is in view when its region\'s box is', () => {
  assert.equal(inView(process('a', 'europe'), PORTUGAL, places, REGIONS), true);
  assert.equal(inView(process('b', 'asia'), PORTUGAL, places, REGIONS), false);
  // With no boxes in hand it is the old answer: a record that does not say
  // where cannot answer the question.
  assert.equal(inView(process('a', 'europe'), PORTUGAL, places), false);
  assert.equal(inView(process('c', 'atlantis'), PORTUGAL, places, REGIONS), false, 'a region with no box');
  assert.equal(inView(process('d', null), PORTUGAL, places, REGIONS), false, 'and no region at all');
  // A place always wins: the point is the finer answer of the two.
  assert.equal(inView({ id: 'e', place: 'goa', region: 'europe' }, PORTUGAL, places, REGIONS), false);
  // The boxes may be a plain object, as the places may.
  assert.equal(inView(process('a', 'europe'), PORTUGAL, places, { europe: [-11, 35, 40, 71] }), true);
  assert.equal(regionBoxOf(process('a', 'europe'), null), null);
});

test('the places may be a plain object as well as a Map', () => {
  assert.deepEqual(pointOfEvent(event('a', 'lisbon'), { lisbon: { where: { lon: 1, lat: 2 } } }), { lon: 1, lat: 2 });
  assert.equal(pointOfEvent(event('a', 'lisbon'), null), null);
});

test('the edges of the box are inside it, and a wrapped box is the strip it names', () => {
  assert.equal(containsPoint(PORTUGAL, { lon: -10, lat: 36 }), true);
  assert.equal(containsPoint(PORTUGAL, { lon: -6, lat: 43 }), true);
  assert.equal(containsPoint(PORTUGAL, { lon: -10.01, lat: 40 }), false);
  assert.equal(containsPoint(PORTUGAL, { lon: -8, lat: 43.01 }), false);
  assert.equal(containsPoint([170, -10, -170, 10], { lon: 179, lat: 0 }), true);
  assert.equal(containsPoint([170, -10, -170, 10], { lon: -179, lat: 0 }), true);
  assert.equal(containsPoint([170, -10, -170, 10], { lon: 0, lat: 0 }), false);
  assert.equal(containsPoint(PORTUGAL, null), false);
  assert.equal(containsPoint(PORTUGAL, { lon: 'west', lat: 40 }), false);
});

// --- the transform, through the projection --------------------------------

const SIZE = { width: 960, height: 540 };
const { width: WIDTH, height: HEIGHT } = SIZE;

test('at rest the box is what the projection was fitted to', () => {
  const projection = createProjection({ ...SIZE, center: [0, 0], scale: 960 / 360 });
  const [west, south, east, north] = viewBbox(projection, { x: 0, y: 0, k: 1 }, SIZE);
  assert.equal(Math.round(west), -180);
  assert.equal(Math.round(east), 180);
  assert.equal(Math.round(north), 101, 'taller than the world, which is what an equirectangular world 960 wide is');
  assert.equal(Math.round(south), -101);
});

test('zooming in narrows the box around the same centre', () => {
  const projection = createProjection({ ...SIZE, center: [0, 0], scale: 960 / 360 });
  const wide = viewBbox(projection, { x: 0, y: 0, k: 1 }, SIZE);
  const close = viewBbox(projection, { x: 0, y: 0, k: 4 }, SIZE);
  assert.ok(close[2] - close[0] < (wide[2] - wide[0]) / 3.9);
  // The transform scales about the origin, so the top-left corner of the
  // screen is looking at the same place at any zoom; it is zoomTo that moves
  // the centre.
  assert.equal(close[0], wide[0]);
  assert.equal(close[3], wide[3]);
  // Panning right shows what is to the west of it.
  const panned = viewBbox(projection, { x: 100, y: 0, k: 1 }, SIZE);
  assert.ok(panned[0] < wide[0] && panned[2] < wide[2]);
});

// A pane wider than 960 × 540's ratio letterboxes the SVG: the reader sees
// units to the left of 0 and to the right of 960, and the box computed from
// the nominal rectangle describes the middle of the picture and calls it the
// picture (health review A, finding 4). These are the numbers of that
// example — a 959 × 368 map area, whose visible SVG x runs −220 … 1180.
test('the box is the rectangle the pane really shows, not the nominal one', () => {
  const projection = createProjection({ ...SIZE, center: [0, 0], scale: 960 / 360 });
  const transform = { x: 0, y: 0, k: 1 };
  // Fitted to the height, so 368 px of pane carry 540 units and 959 px carry
  // 959 × 540 / 368 = 1407 of them, centred on the nominal box.
  const shownWidth = (959 * HEIGHT) / 368;
  const box = { x0: (WIDTH - shownWidth) / 2, y0: 0, x1: (WIDTH + shownWidth) / 2, y1: HEIGHT };
  assert.ok(box.x0 < -200 && box.x1 > 1150, 'a third of the picture is outside the nominal box');

  const nominal = viewBbox(projection, transform, SIZE);
  const real = viewBboxIn(projection, transform, box);
  assert.ok(real[0] < nominal[0] && real[2] > nominal[2], 'wider east and west');
  assert.equal(real[1], nominal[1], 'and the same north and south, which is what fitting the height means');
  assert.equal(real[3], nominal[3]);
  // The width in degrees is the width of the strip the reader is looking at.
  assert.ok(Math.abs((real[2] - real[0]) - (shownWidth / projection.scale)) < 1e-9);

  // The nominal box is the same question asked of the rectangle 0 … 960.
  assert.deepEqual(viewBboxIn(projection, transform, { x0: 0, y0: 0, x1: WIDTH, y1: HEIGHT }), nominal);
});

test('a box and the transform that shows it are each other\'s inverse', () => {
  const projection = fitBounds(WORLD, { ...SIZE, margin: 0 });
  const transform = bboxTransform(projection, PORTUGAL, { ...SIZE, minZoom: 1, maxZoom: 40 });
  const shown = viewBbox(projection, transform, SIZE);
  // Whole: the screen is wider than Portugal is tall, so the box that comes
  // back contains the one asked for and shares a centre with it.
  assert.ok(shown[0] <= PORTUGAL[0] + 1e-9 && shown[2] >= PORTUGAL[2] - 1e-9, 'east and west are inside');
  assert.ok(shown[1] <= PORTUGAL[1] + 1e-9 && shown[3] >= PORTUGAL[3] - 1e-9, 'north and south are inside');
  assert.ok(Math.abs((shown[0] + shown[2]) / 2 - (PORTUGAL[0] + PORTUGAL[2]) / 2) < 1e-9);
  assert.ok(Math.abs((shown[1] + shown[3]) / 2 - (PORTUGAL[1] + PORTUGAL[3]) / 2) < 1e-9);
  // And the tight dimension is the one that fits exactly.
  assert.ok(Math.abs((shown[3] - shown[1]) - (PORTUGAL[3] - PORTUGAL[1])) < 1e-9);
});

test('the zoom of a fit is clamped, and a tiny box is shown around its middle', () => {
  const projection = fitBounds(WORLD, { ...SIZE, margin: 0 });
  const tiny = bboxTransform(projection, [-9.15, 38.71, -9.13, 38.73], { ...SIZE, minZoom: 1, maxZoom: 8 });
  assert.equal(tiny.k, 8);
  const shown = viewBbox(projection, tiny, SIZE);
  assert.ok(Math.abs((shown[0] + shown[2]) / 2 - -9.14) < 1e-9);
  assert.ok(Math.abs((shown[1] + shown[3]) / 2 - 38.72) < 1e-9);
  // And a box larger than the world does not zoom out past the minimum.
  assert.equal(bboxTransform(projection, [-180, -90, 180, 90], { ...SIZE, minZoom: 1, maxZoom: 8 }).k, 1);
});

// --- the lanes under a box, on the real dataset ---------------------------
//
// The one assertion that is worth making against `data/` and not a fixture:
// the timeline's filter must agree, event for event, with what the place
// records themselves say, and a count computed here from the files is an
// independent second opinion rather than a restatement of the filter.

test('a box over Portugal draws exactly the events placed in Portugal', async () => {
  const fetchJson = async (url) => JSON.parse(await readFile(path.join(ROOT, url.split('?')[0]), 'utf8'));
  const atlas = await loadAtlas({ dataRoot: 'data/', fetchJson });
  const box = [-10, 36, -6, 43];

  const expected = atlas.activeEvents
    .filter((event) => {
      const where = atlas.places.get(event.place)?.where;
      return where && where.lon >= -10 && where.lon <= -6 && where.lat >= 36 && where.lat <= 43;
    })
    .map((e) => e.id).sort();
  const drawn = eventsInView(atlas.activeEvents, box, atlas.places).map((e) => e.id).sort();

  assert.ok(expected.length > 0, 'the atlas has events in Portugal to draw');
  assert.ok(expected.length < atlas.activeEvents.length, 'and events elsewhere, which the box leaves out');
  assert.equal(drawn.length, expected.length);
  assert.deepEqual(drawn, expected);

  // And what the reader is holding survives the box wherever it happened.
  const outside = atlas.activeEvents.find((e) => !expected.includes(e.id));
  const kept = eventsInView(atlas.activeEvents, box, atlas.places, { keep: new Set([outside.id]) });
  assert.equal(kept.length, expected.length + 1);
  assert.ok(kept.some((e) => e.id === outside.id));
});

// The other half of the same assertion, on `data/`: the fifty-one active
// events with no place used to leave the lanes the moment the map was
// touched, and the box over Portugal is the case the reader meets first.
test('the placeless events answer with the region boxes the atlas loaded', async () => {
  const fetchJson = async (url) => JSON.parse(await readFile(path.join(ROOT, url.split('?')[0]), 'utf8'));
  const atlas = await loadAtlas({ dataRoot: 'data/', fetchJson });
  const box = [-10, 36, -6, 43];

  assert.deepEqual([...atlas.regionBoxes.keys()].sort(), ['africa', 'americas', 'asia', 'europe', 'oceania']);
  const placeless = atlas.activeEvents.filter((e) => !atlas.pointOf(e));
  assert.ok(placeless.length > 0, 'the atlas has events with no place');
  assert.ok(placeless.every((e) => atlas.regionBoxes.has(e.region)), 'and every one of them names a region');

  const drawn = eventsInView(atlas.activeEvents, box, atlas.places, { regions: atlas.regionBoxes });
  const withoutRegions = eventsInView(atlas.activeEvents, box, atlas.places);
  assert.ok(drawn.length > withoutRegions.length, 'the boxes bring the placeless events back');
  const european = placeless.filter((e) => e.region === 'europe');
  assert.ok(european.length > 0);
  for (const event of european) {
    assert.ok(drawn.some((e) => e.id === event.id), `${event.id} is in view over Portugal`);
  }
  // And a box far from a region does not draw its processes: nothing here is
  // in view of every box.
  const pacific = eventsInView(atlas.activeEvents, [-150, -30, -120, -10], atlas.places, { regions: atlas.regionBoxes });
  assert.ok(pacific.length < drawn.length);
});

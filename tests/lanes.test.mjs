// The lanes are one rule read by two pictures, so this file holds it to the
// four things the interface promises: the cap, the order, the catch-all, and
// that an event is drawn once and in a lane the card can explain.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lanesFor, laneOf, laneExplain, availableLanes, packRows, rowLanes, barBox,
  GROUPS, LANE_CAP, OTHER_ID,
} from '../src/lanes.js';
import { createLinearScale } from '../src/timeline-scale.js';

const event = (id, { actors = [], place = null, region = 'europe', start = 1970, end = null } = {}) => ({
  id,
  title: id,
  status: 'active',
  when: { start, end: end === null ? start : end },
  place,
  region,
  weight: 0,
  actors: actors.map((a) => ({ actor: a, role: 'leader' })),
});

// Salazar is in four events, PIDE in two of them and one of its own, the
// church in one. One event names nobody and happens nowhere.
function topology() {
  const events = [
    event('e0', { actors: ['salazar'], place: 'lisbon', start: 1930 }),
    event('e1', { actors: ['salazar'], place: 'lisbon', start: 1933 }),
    event('e2', { actors: ['salazar', 'pide'], place: 'lisbon', start: 1945 }),
    event('e3', { actors: ['salazar', 'pide', 'church'], place: 'porto', start: 1958 }),
    event('e4', { actors: ['pide'], place: 'porto', start: 1961, region: 'africa' }),
    event('e5', { actors: [], place: null, region: 'africa', start: 1974 }),
  ];
  const actor = (id, name) => [id, { id, name, status: 'active' }];
  const place = (id, name) => [id, { id, name, status: 'active' }];
  return {
    activeEvents: events,
    actors: new Map([actor('salazar', 'Salazar'), actor('pide', 'PIDE'), actor('church', 'Church')]),
    places: new Map([place('lisbon', 'Lisbon'), place('porto', 'Porto')]),
    regions: [{ id: 'europe', label: 'Europe', order: 1 }, { id: 'africa', label: 'Africa', order: 2 }],
  };
}

const idsOf = (lanes) => lanes.map((l) => l.id);
const membersOf = (lanes) => Object.fromEntries(lanes.map((l) => [l.id, [...l.members].sort()]));

test('the four groupings are the four groupings', () => {
  assert.deepEqual([...GROUPS], ['none', 'actor', 'place', 'region']);
  assert.equal(lanesFor('none', topology()).length, 0, 'no grouping means no named lanes');
  assert.equal(lanesFor('rubbish', topology()).length, 0);
});

test('every shown event is in exactly one lane, in every grouping', () => {
  const t = topology();
  for (const group of ['actor', 'place', 'region']) {
    const lanes = lanesFor(group, t);
    const ids = lanes.flatMap((l) => [...l.members]);
    assert.equal(new Set(ids).size, ids.length, `${group}: no event in two lanes`);
    // `region` has no catch-all, and e5 has a region like everything else.
    assert.equal(ids.length, t.activeEvents.length, `${group}: nothing is dropped`);
    for (const e of t.activeEvents) assert.ok(laneOf(e, lanes), `${group}: ${e.id} has a lane`);
  }
});

test('lanes are ordered by how many events fall in them', () => {
  const lanes = lanesFor('actor', topology());
  assert.deepEqual(idsOf(lanes), ['salazar', 'pide', 'church', OTHER_ID]);
  assert.deepEqual(availableLanes('actor', topology()).map((a) => [a.id, a.count]), [
    ['salazar', 4], ['pide', 3], ['church', 1],
  ]);
});

test('an event with several actors is drawn in the heaviest of them', () => {
  const lanes = lanesFor('actor', topology());
  assert.deepEqual(membersOf(lanes), {
    salazar: ['e0', 'e1', 'e2', 'e3'],
    pide: ['e4'],
    church: [],
    other: ['e5'],
  });
  // The rule, as the card states it.
  const t = topology();
  const explained = laneExplain(t.activeEvents[3], lanes, 'actor', t);
  assert.equal(explained.lane.id, 'salazar');
  assert.equal(explained.reason, 'heaviest of its actors');
  assert.deepEqual(explained.others.map((o) => o.label), ['PIDE', 'Church']);
});

test('an event none of whose actors has a lane goes to Other, and says why', () => {
  const t = topology();
  const lanes = lanesFor('actor', t, null, null, ['church']);
  assert.deepEqual(idsOf(lanes), ['church', OTHER_ID]);
  assert.deepEqual(membersOf(lanes).church, ['e3']);
  assert.deepEqual(membersOf(lanes).other, ['e0', 'e1', 'e2', 'e4', 'e5']);
  assert.equal(laneExplain(t.activeEvents[0], lanes, 'actor', t).reason, 'none of its actors has a lane');
  assert.equal(laneExplain(t.activeEvents[5], lanes, 'actor', t).reason, 'it names no actor');
});

test('an explicit list is taken in the order it was given, and dropped ids are dropped', () => {
  const t = topology();
  const lanes = lanesFor('actor', t, null, null, ['pide', 'salazar', 'nobody', 'pide']);
  assert.deepEqual(idsOf(lanes), ['pide', 'salazar', OTHER_ID]);
  // Order is the reader's; which lane an event lands in is still the weight.
  assert.deepEqual(membersOf(lanes).salazar, ['e0', 'e1', 'e2', 'e3']);
  assert.deepEqual(membersOf(lanes).pide, ['e4']);
});

test('there is no Other lane when nothing falls outside', () => {
  const t = topology();
  const lanes = lanesFor('place', t, null, null, ['lisbon', 'porto']);
  assert.deepEqual(idsOf(lanes), ['lisbon', 'porto', OTHER_ID], 'e5 has no place');
  const shown = new Set(['e1', 'e2']);
  assert.deepEqual(idsOf(lanesFor('place', t, null, shown, ['lisbon'])), ['lisbon'], 'both are in Lisbon');
});

test('a place lane is the place, and a placeless event says so', () => {
  const t = topology();
  const lanes = lanesFor('place', t);
  assert.deepEqual(idsOf(lanes), ['lisbon', 'porto', OTHER_ID]);
  assert.equal(laneExplain(t.activeEvents[0], lanes, 'place', t).reason, 'its place');
  assert.equal(laneExplain(t.activeEvents[5], lanes, 'place', t).reason, 'it has no place');
});

test('the region grouping is the lane list, in its own order, with no Other', () => {
  const t = topology();
  const lanes = lanesFor('region', t);
  assert.deepEqual(idsOf(lanes), ['europe', 'africa']);
  assert.deepEqual(membersOf(lanes), { europe: ['e0', 'e1', 'e2', 'e3'], africa: ['e4', 'e5'] });
  assert.equal(laneExplain(t.activeEvents[0], lanes, 'region', t).reason, 'its region');
});

test('the automatic list is capped at six, plus Other', () => {
  const events = [];
  const actors = new Map();
  for (let i = 0; i < 20; i += 1) {
    const id = `a${String(i).padStart(2, '0')}`;
    actors.set(id, { id, name: `Actor ${i}` });
    // Actor i is in (20 - i) events, so the order is a00 first.
    for (let n = 0; n < 20 - i; n += 1) events.push(event(`${id}-${n}`, { actors: [id], start: 1900 + n }));
  }
  const t = { activeEvents: events, actors, places: new Map(), regions: [] };
  const lanes = lanesFor('actor', t);
  assert.equal(lanes.length, LANE_CAP + 1);
  assert.deepEqual(idsOf(lanes).slice(0, 3), ['a00', 'a01', 'a02']);
  assert.equal(lanes[LANE_CAP].id, OTHER_ID);
  assert.equal(lanes[LANE_CAP].members.size, events.filter((e) => Number(e.id.slice(1, 3)) >= LANE_CAP).length);
});

test('the window decides which lanes there are and never which events are in them', () => {
  const t = topology();
  // 1958–1974 counts PIDE twice and Salazar once, so PIDE leads.
  const window = { from: 1958, to: 1974 };
  assert.deepEqual(availableLanes('actor', t, window).map((a) => a.id), ['pide', 'church', 'salazar']);
  const lanes = lanesFor('actor', t, window, null, ['pide']);
  // e0, e1 and e2 are outside the window and still have somewhere to be
  // drawn: e2 names PIDE, so it is in PIDE's lane though it was not counted
  // into it.
  assert.deepEqual(membersOf(lanes).other, ['e0', 'e1', 'e5']);
  assert.deepEqual(membersOf(lanes).pide, ['e2', 'e3', 'e4']);
  assert.equal(lanes[0].count, 2, 'the count is of the window; the members are not');
});

test('the lens narrows what the lanes are built from', () => {
  const t = topology();
  const lens = new Set(['e4', 'e5']);
  const lanes = lanesFor('actor', t, null, lens);
  assert.deepEqual(idsOf(lanes), ['pide', OTHER_ID]);
  assert.deepEqual(membersOf(lanes), { pide: ['e4'], other: ['e5'] });
  assert.deepEqual(availableLanes('actor', t, null, lens).map((a) => a.id), ['pide']);
});

// --- packing -------------------------------------------------------------

const scale = createLinearScale({ domain: [1900, 2000], range: [0, 1000] });

test('a bar is at least legible, and an ongoing one runs to the open end', () => {
  const box = barBox(event('x', { start: 1950 }), scale, { minBar: 6 });
  assert.equal(box.width, 6);
  assert.equal(box.x, scale.x(1950) - 3, 'a thin bar is centred on its year');
  const long = barBox({ ...event('y'), when: { start: 1900, end: 1950 } }, scale, {});
  assert.equal(long.width, 500);
  const ongoing = barBox({ ...event('z'), when: { start: 1950, end: null } }, scale, { openEnd: 2000 });
  assert.equal(ongoing.ongoing, true);
  assert.equal(ongoing.width, 500);
});

test('packing leaves no two bars overlapping in a row', () => {
  const events = [];
  for (let i = 0; i < 40; i += 1) events.push(event(`e${i}`, { start: 1950 + (i % 8) }));
  const { rows, count } = packRows(events, scale, 1000, { gap: 4 });
  assert.ok(count > 1, 'forty events on eight years cannot be one row');
  const byRow = new Map();
  for (const [id, row] of rows) {
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row).push(barBox(events.find((e) => e.id === id), scale, {}));
  }
  for (const [row, boxes] of byRow) {
    boxes.sort((a, b) => a.x - b.x);
    for (let i = 1; i < boxes.length; i += 1) {
      assert.ok(boxes[i].x >= boxes[i - 1].x + boxes[i - 1].width, `row ${row}: bar ${i} overlaps the one before`);
    }
  }
});

test('packing is the same twice running and does not depend on the input order', () => {
  const events = [];
  for (let i = 0; i < 30; i += 1) events.push(event(`e${String(i).padStart(2, '0')}`, { start: 1900 + (i % 5) * 3 }));
  const once = packRows(events, scale, 1000);
  const again = packRows(events, scale, 1000);
  const shuffled = packRows([...events].reverse(), scale, 1000);
  assert.deepEqual([...once.rows.entries()].sort(), [...again.rows.entries()].sort());
  assert.deepEqual([...once.rows.entries()].sort(), [...shuffled.rows.entries()].sort());
  assert.equal(once.count, shuffled.count);
});

test('affinity keeps what belongs together in one row where it can', () => {
  // Two pairs, named so that a plain first fit splits each pair across the
  // two rows the overlap forces.
  const events = [
    event('a1', { place: 'lisbon', start: 1900 }),
    event('b1', { place: 'porto', start: 1900 }),
    event('a2', { place: 'porto', start: 1950 }),
    event('b2', { place: 'lisbon', start: 1950 }),
  ];
  const plain = packRows(events, scale, 1000);
  assert.equal(plain.count, 2);
  assert.notEqual(plain.rows.get('a1'), plain.rows.get('b2'), 'Lisbon is split without affinity');
  const grouped = packRows(events, scale, 1000, { affinity: (e) => e.place });
  assert.equal(grouped.count, 2, 'affinity is a preference among rows that fit, never a new row');
  assert.equal(grouped.rows.get('a1'), grouped.rows.get('b2'), 'Lisbon in one row');
  assert.equal(grouped.rows.get('b1'), grouped.rows.get('a2'), 'Porto in the other');
});

test('past the cap the rows are shared and stacking takes over', () => {
  const events = [];
  for (let i = 0; i < 12; i += 1) events.push(event(`e${i}`, { start: 1950 }));
  const { count, rows } = packRows(events, scale, 1000, { maxRows: 3 });
  assert.equal(count, 3);
  assert.equal(new Set(rows.values()).size, 3);
  assert.equal(rows.size, 12, 'nothing is dropped');
});

test('the packing reads as lanes, unlabelled', () => {
  const events = [event('a', { start: 1950 }), event('b', { start: 1950 }), event('c', { start: 1990 })];
  const lanes = rowLanes(events, scale, 1000);
  assert.equal(lanes.length, 2);
  assert.deepEqual(lanes.map((l) => l.label), ['', '']);
  assert.deepEqual(lanes.map((l) => l.id), ['row-0', 'row-1']);
  const all = lanes.flatMap((l) => [...l.members]).sort();
  assert.deepEqual(all, ['a', 'b', 'c']);
  assert.equal(laneOf({ id: 'c' }, lanes).id, 'row-0', 'c is far enough from a to share its row');
});

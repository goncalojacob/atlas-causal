// The packing is one rule read by two pictures, so this file holds it to what
// the interface promises: that no two bars overlap in a row, that the same
// events pack the same way twice running whatever order they arrive in, and
// that what belongs together lands together where a row has the room.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  laneOf, packRows, rowLanes, barBox,
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

// **The named lanes went in M77.** Fourteen tests stood here: the four
// groupings, the cap of six, the "Other" catch-all, the order, the reader's
// own list, what the window and the lens decided about which lanes there
// were, and what the event card said about the lane it had picked. The owner
// asked for the grouping to go and it went, with `lanesFor`, `availableLanes`
// and `laneExplain`. What `lanes.js` is now is the packing below and
// `barBox`, which is what the default always used.

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

// --- the sweep against the scan it replaced -------------------------------

// The first fit as it was written before H4c: every row looked at, for every
// event. It is kept here, and the sweep is held to it bar for bar, because
// the packing's promise is a *picture* — which row each bar is in — and a
// faster way of finding the row is only worth having if it finds the same
// one. Removing the affinity's preference, or letting the cap pick a row
// other than the emptiest, fails this.
function scanRows(events, scale_, width, {
  gap = 4, minBar = 6, openEnd = null, affinity = null, maxRows = Infinity,
} = {}) {
  const byIdent = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const items = events
    .map((e) => ({ id: e.id, event: e, ...barBox(e, scale_, { width, openEnd, minBar }) }))
    .sort((a, b) => a.x - b.x || byIdent(a.id, b.id));
  const rows = [];
  const assigned = new Map();
  for (const item of items) {
    const key = affinity ? affinity(item.event) : null;
    let first = -1;
    let preferred = -1;
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].end + gap > item.x) continue;
      if (first < 0) first = i;
      if (key !== null && preferred < 0 && rows[i].keys.has(key)) preferred = i;
    }
    let index = preferred >= 0 ? preferred : first;
    if (index < 0) {
      if (rows.length < maxRows) {
        rows.push({ end: -Infinity, keys: new Set() });
        index = rows.length - 1;
      } else {
        index = rows.reduce((best, row, i) => (row.end < rows[best].end ? i : best), 0);
      }
    }
    rows[index].end = Math.max(rows[index].end, item.x + item.width);
    if (key !== null) rows[index].keys.add(key);
    assigned.set(item.id, index);
  }
  return { rows: assigned, count: Math.max(rows.length, 1) };
}

// Mulberry32, as the bench harness uses: the same corpus on every machine.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('the sweep packs exactly what the scan packed', () => {
  const places = ['lisbon', 'porto', 'goa', 'luanda', 'bahia', null];
  for (const seed of [1415, 1498, 1580, 20260905]) {
    const random = seeded(seed);
    const events = [];
    for (let i = 0; i < 900; i += 1) {
      const start = 1400 + Math.floor(random() * 180);
      // A mix of instants and long processes, so bars of every width meet in
      // one row and the gap decides more than the year does.
      const long = random() < 0.25;
      events.push(event(`e${String(i).padStart(4, '0')}`, {
        start,
        end: long ? start + Math.ceil(random() * 40) : start,
        place: places[Math.floor(random() * places.length)],
      }));
    }
    const affinity = (e) => e.place;
    // Both caps: unbounded, where the rows are many and the sweep is worth
    // having, and twenty, where the emptiest row has to be picked.
    for (const maxRows of [Infinity, 20, 3]) {
      for (const withAffinity of [false, true]) {
        const options = { gap: 4, maxRows, affinity: withAffinity ? affinity : null };
        const swept = packRows(events, scale, 1000, options);
        const scanned = scanRows(events, scale, 1000, options);
        const where = `seed ${seed}, maxRows ${maxRows}, affinity ${withAffinity}`;
        assert.equal(swept.count, scanned.count, `${where}: the same number of rows`);
        assert.deepEqual(
          [...swept.rows.entries()].sort(),
          [...scanned.rows.entries()].sort(),
          `${where}: every bar in the row the scan gave it`,
        );
      }
    }
  }
});

test('the sweep still leaves no two bars overlapping, at a thousand events', () => {
  const random = seeded(1572);
  const events = [];
  for (let i = 0; i < 1000; i += 1) {
    const start = 1400 + Math.floor(random() * 400);
    events.push(event(`e${String(i).padStart(4, '0')}`, { start, end: start + Math.floor(random() * 6) }));
  }
  const { rows, count } = packRows(events, scale, 1000, { gap: 4 });
  assert.ok(count > 1);
  const boxes = new Map(events.map((e) => [e.id, barBox(e, scale, {})]));
  const byRow = new Map();
  for (const [id, r] of rows) {
    if (!byRow.has(r)) byRow.set(r, []);
    byRow.get(r).push(boxes.get(id));
  }
  for (const [r, list] of byRow) {
    list.sort((a, b) => a.x - b.x);
    for (let i = 1; i < list.length; i += 1) {
      assert.ok(list[i].x >= list[i - 1].x + list[i - 1].width + 4, `row ${r}: bar ${i} overlaps`);
    }
  }
});

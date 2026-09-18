import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLinearScale, createCenturyScale, createTimelineScale } from '../src/timeline-scale.js';

test('x and invert are inverses over the range', () => {
  const s = createLinearScale({ domain: [1400, 1600], range: [50, 850] });
  assert.equal(s.x(1400), 50);
  assert.equal(s.x(1600), 850);
  assert.equal(s.x(1500), 450);
  assert.equal(s.invert(450), 1500);
  assert.equal(s.invert(s.x(1415)), 1415);
});

test('ticks are round years with BCE labels through fromAstronomical', () => {
  const s = createLinearScale({ domain: [-99, 101], range: [0, 800] });
  const ticks = s.ticks(4);
  assert.deepEqual(ticks.map((t) => t.value), [-50, 0, 50, 100]);
  assert.deepEqual(ticks.map((t) => t.label), ['51 BCE', '1 BCE', '50', '100']);
  const fine = createLinearScale({ domain: [1415, 1580], range: [0, 800] }).ticks(8);
  assert.deepEqual(fine.map((t) => t.value), [1425, 1450, 1475, 1500, 1525, 1550, 1575]);
});

test('a degenerate domain does not divide by zero', () => {
  const s = createLinearScale({ domain: [1415, 1415], range: [0, 800] });
  assert.equal(s.x(1415), 0);
  assert.equal(s.invert(400), 1415);
  assert.deepEqual(s.ticks().map((t) => t.label), ['1415']);
});

// --- M43b: the century-bucketed scale ---------------------------------------
//
// Over 1415–2025 a linear scale gives the years nobody wrote about the same
// width as the years everybody did. The bucketed one shares the width out
// century by century, by the length of the century and the logarithm of how
// many events it holds, so an empty century is still a column and a crowded
// one does not take the drawing.

// A corpus like the atlas after M42, and the padded domain the timeline builds
// around it (timeline.js, PADDING).
const DEEP = new Map([[1400, 40], [1500, 120], [1600, 90], [1700, 80], [1800, 300], [1900, 4000], [2000, 900]]);
const EXTENT = { min: 1415, max: 2025 };
const PAD = (EXTENT.max - EXTENT.min) * 0.04;
const DOMAIN = [EXTENT.min - PAD - 1, EXTENT.max + PAD + 1];
const RANGE = [120, 1428];

const deep = () => createCenturyScale({ domain: DOMAIN, range: RANGE, counts: DEEP });

test('the bucketed scale is piecewise linear, and it is exactly invertible', () => {
  const s = deep();
  assert.equal(s.x(DOMAIN[0]), RANGE[0], 'the domain starts at the range');
  assert.equal(s.x(DOMAIN[1]), RANGE[1], 'and ends at it');
  for (const year of [1415, 1500, 1580, 1650, 1755, 1822, 1900, 1969, 2025]) {
    assert.ok(Math.abs(s.invert(s.x(year)) - year) < 1e-9, `${year} survives the round trip`);
  }
  // Strictly increasing: the arrow of time is the one thing this scale may not
  // break, and `barBox` reads both ends of an interval through it.
  let last = -Infinity;
  for (let year = Math.ceil(DOMAIN[0]); year <= Math.floor(DOMAIN[1]); year += 1) {
    const x = s.x(year);
    assert.ok(x > last, `${year} is to the right of ${year - 1}`);
    last = x;
  }
});

test('every century is a column, and the crowded one is wider than the empty one', () => {
  const s = deep();
  const width = (from) => {
    const b = s.buckets.find((each) => each.from === from);
    return b.x1 - b.x0;
  };
  // An empty century has a width: this is the floor, and it is the whole
  // reason six sparse centuries are not one hairline.
  const sparse = createCenturyScale({
    domain: [1150, 2050], range: RANGE, counts: new Map([[1200, 11], [1900, 2]]),
  });
  for (const bucket of sparse.buckets) {
    assert.ok(bucket.x1 - bucket.x0 > 20, `${bucket.from} is a column, not a hairline (${bucket.x1 - bucket.x0})`);
  }
  // And the crowded century is the widest, without taking the drawing: a
  // hundred times the events is a few times the width and no more.
  const busiest = width(1900);
  const quietest = width(1500);
  assert.ok(busiest > quietest, `the busy century is wider (${busiest} against ${quietest})`);
  assert.ok(busiest < quietest * 3, `and not by a hundred times (${busiest / quietest})`);
  // The columns add up to the range and leave nothing over.
  const total = s.buckets.reduce((sum, b) => sum + (b.x1 - b.x0), 0);
  assert.ok(Math.abs(total - (RANGE[1] - RANGE[0])) < 1e-6);
});

test('the ticks are the century boundaries, subdivided where a bucket has room', () => {
  const s = deep();
  const values = s.ticks(14).map((t) => t.value);
  for (const century of [1500, 1600, 1700, 1800, 1900, 2000]) {
    assert.ok(values.includes(century), `${century} is on the axis`);
  }
  // Inside the domain and nowhere else, in order, and never the same year
  // twice where two buckets meet.
  assert.deepEqual(values, [...values].sort((a, b) => a - b));
  assert.equal(new Set(values).size, values.length);
  assert.ok(values.every((v) => v >= DOMAIN[0] && v <= DOMAIN[1]));
  // No two labels closer than one label's width: the whole point of asking for
  // `count` of them.
  const minPx = (RANGE[1] - RANGE[0]) / 14;
  const xs = values.map((v) => s.x(v));
  for (let i = 1; i < xs.length; i += 1) {
    assert.ok(xs[i] - xs[i - 1] > minPx * 0.5,
      `${values[i - 1]} and ${values[i]} are ${Math.round(xs[i] - xs[i - 1])} px apart`);
  }
  // And the labels go through the same numbering every other year does.
  assert.equal(s.ticks(14).find((t) => t.value === 1900).label, '1900');
});

test('createTimelineScale buckets only past the threshold', () => {
  // `data/` today: a century and a half, and the linear scale it has always
  // had. Asserted as a behaviour and not as a class name: two years the same
  // distance apart are the same distance apart on the drawing.
  const modern = createTimelineScale({
    domain: [1890, 2030],
    range: RANGE,
    counts: new Map([[1800, 5], [1900, 191], [2000, 54]]),
    extent: { min: 1894, max: 2026 },
  });
  assert.ok(Math.abs((modern.x(1990) - modern.x(1980)) - (modern.x(1920) - modern.x(1910))) < 1e-9,
    'a decade is a decade wherever it falls');
  // And the deep corpus, where it is not.
  const bucketed = createTimelineScale({ domain: DOMAIN, range: RANGE, counts: DEEP, extent: EXTENT });
  assert.ok((bucketed.x(1990) - bucketed.x(1980)) > (bucketed.x(1520) - bucketed.x(1510)),
    'the crowded century gives a decade more room than the quiet one');
  // No counts at all — a caller with no corpus to ask — is the linear scale.
  const bare = createTimelineScale({ domain: DOMAIN, range: RANGE });
  assert.ok(Math.abs((bare.x(1990) - bare.x(1980)) - (bare.x(1520) - bare.x(1510))) < 1e-9);
});

test('a narrow axis keeps labels along its length, not one at each end', () => {
  // The phone. Eight centuries in 258 px is eight columns of about thirty, so
  // most of the boundaries cannot be labelled — and the ones that can must be
  // spread along the axis. A run of narrow columns each taking the label from
  // the one before it would leave the first century and the last and nothing
  // in between, which reads as a two-century corpus.
  const s = createCenturyScale({
    domain: [1166, 2059],
    range: [120, 378],
    counts: new Map([[1200, 11], [1400, 2], [1500, 1], [1600, 1], [1700, 1], [1800, 1], [1900, 2], [2000, 1]]),
  });
  const ticks = s.ticks(4);
  assert.ok(ticks.length >= 4, `several labels survive (${ticks.map((t) => t.label).join(' ')})`);
  const xs = ticks.map((t) => s.x(t.value));
  for (let i = 1; i < xs.length; i += 1) {
    assert.ok(xs[i] - xs[i - 1] >= 30, `"${ticks[i - 1].label}" and "${ticks[i].label}" have room`);
  }
  assert.ok(xs[xs.length - 1] > 300, `and they reach along the axis (${Math.round(xs[xs.length - 1])} of 378)`);
  // Every one of them is a century, because at this width nothing finer fits.
  assert.ok(ticks.every((t) => t.value % 100 === 0), ticks.map((t) => t.label).join(' '));
});

test('a bucketed scale with a degenerate domain does not divide by zero', () => {
  const s = createCenturyScale({ domain: [1415, 1415], range: RANGE, counts: DEEP });
  assert.equal(s.x(1415), RANGE[0]);
  assert.equal(s.invert(400), 1415);
  assert.deepEqual(s.ticks().map((t) => t.label), ['1415']);
});

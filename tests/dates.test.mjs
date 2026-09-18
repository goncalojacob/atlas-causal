import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toAstronomical, fromAstronomical, bounds, astronomicalBounds, compareYears,
  defaultCalendar, formatYear, formatBound, formatInterval, extent, isValidYear,
} from '../src/util/dates.js';

test('historians numbering has no year 0', () => {
  assert.equal(toAstronomical(1), 1);
  assert.equal(toAstronomical(-1), 0);
  assert.equal(toAstronomical(-44), -43);
  assert.equal(toAstronomical(1415), 1415);
  assert.throws(() => toAstronomical(0), RangeError);
  assert.throws(() => toAstronomical(1.5), RangeError);
  assert.throws(() => toAstronomical('1415'), RangeError);
  assert.equal(isValidYear(0), false);
});

test('round trip through astronomical years', () => {
  for (const y of [-9600, -1000, -1, 1, 33, 1582, 2026]) {
    assert.equal(fromAstronomical(toAstronomical(y)), y);
  }
  assert.equal(fromAstronomical(0), -1);
});

test('1 BCE is one year before 1 CE, not two', () => {
  assert.equal(compareYears(1, -1), 1);
  assert.equal(compareYears(-1, -2), 1);
  assert.equal(compareYears(1415, 1415), 0);
});

test('bounds normalise and reject nonsense', () => {
  assert.deepEqual(bounds(1415), { min: 1415, max: 1415 });
  assert.deepEqual(bounds({ min: -9600, max: -9000 }), { min: -9600, max: -9000 });
  assert.deepEqual(astronomicalBounds({ min: -9600, max: -9000 }), { min: -9599, max: -8999 });
  assert.throws(() => bounds({ min: 1 }), TypeError);
  assert.throws(() => bounds('1415'), TypeError);
  assert.throws(() => bounds(null), TypeError);
});

test('calendar defaults to Julian before 1582', () => {
  assert.equal(defaultCalendar(1581), 'julian');
  assert.equal(defaultCalendar(1582), 'gregorian');
  assert.equal(defaultCalendar(-44), 'julian');
});

test('formatting', () => {
  assert.equal(formatYear(1415), '1415');
  assert.equal(formatYear(-44), '44 BCE');
  assert.equal(formatBound({ min: -9600, max: -9000 }), '9600–9000 BCE');
  assert.equal(formatBound({ min: -50, max: 20 }), '50 BCE–20');
  assert.equal(formatInterval({ start: 1415, end: 1415 }), '1415');
  assert.equal(formatInterval({ start: 1415, end: 1580 }), '1415 – 1580');
  assert.equal(formatInterval({ start: 1500, end: null }), '1500 – ongoing');
  assert.equal(
    formatInterval({ start: { min: -9600, max: -9000 }, end: { min: -8500, max: -8000 } }),
    '9600–9000 BCE – 8500–8000 BCE',
  );
});

test('extent for scales', () => {
  assert.deepEqual(extent({ start: 1415, end: null }), { min: 1415, max: null });
  assert.deepEqual(extent({ start: { min: -10, max: -5 }, end: 5 }), { min: -9, max: 5 });
});

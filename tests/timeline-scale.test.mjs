import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLinearScale } from '../src/timeline-scale.js';

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

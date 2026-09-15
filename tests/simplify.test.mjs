// `simplifyLine`, which the base map's import writes its lines through.
//
// It existed for the map (M39b strokes a territory's inland borders and
// simplifies them by zoom so the stroke keeps lying along the edge of the
// fill), and M36 gives it the `decimals` the import needs: a line written to
// a file is quantized exactly as a ring is, or the near coastline carries
// seventeen digits of a float nobody can see (M36 review, A7).

import test from 'node:test';
import assert from 'node:assert/strict';

import { MIN_DETAIL, arcExtent, simplifyLine } from '../src/util/simplify.js';

test('simplifyLine drops the points a tolerance makes redundant', () => {
  // A straight line with a wobble in the middle: the wobble is what a
  // tolerance either keeps or does not.
  const line = [[0, 0], [1, 0.001], [2, 0], [3, 0.5], [4, 0], [5, 0]];
  const coarse = simplifyLine(line, { tolerance: 0.1 });
  assert.ok(coarse.length < line.length, 'something went');
  assert.deepEqual(coarse[0], [0, 0], 'the first point stays');
  assert.deepEqual(coarse[coarse.length - 1], [5, 0], 'and the last');
  assert.ok(coarse.some(([x]) => x === 3), 'the half-degree spike survives 0.1');
  assert.ok(!coarse.some(([x]) => x === 1), 'the thousandth-degree wobble does not');
});

test('simplifyLine holds a line to a sixth of its own extent', () => {
  // The MIN_DETAIL rule, which is what keeps a small island from becoming a
  // line: a tolerance far larger than the shape cannot flatten it.
  const small = [[0, 0], [0.05, 0.06], [0.1, 0], [0.15, 0.06], [0.2, 0]];
  assert.ok(arcExtent(small) / MIN_DETAIL < 0.05, 'the line is small enough for the rule to bite');
  const taken = simplifyLine(small, { tolerance: 10 });
  assert.ok(taken.length > 2, 'a tolerance of ten degrees does not flatten a fifth of a degree');
});

test('simplifyLine quantizes only when the caller asks for decimals', () => {
  const line = [[1.23456789, -2.3456789], [5.4321, 6.54321]];
  assert.deepEqual(simplifyLine(line, { tolerance: 0 }), line, 'no decimals, no rounding');
  assert.deepEqual(simplifyLine(line, { tolerance: 0, decimals: 3 }), [[1.235, -2.346], [5.432, 6.543]]);
});

test('simplifyLine keeps two points when quantization collapses the line', () => {
  // Three points that round onto one another. A line of one point is not a
  // line, and `quantize` is what puts the last one back.
  const line = [[0.0001, 0.0001], [0.0002, 0.0002], [0.0003, 0.0003]];
  const taken = simplifyLine(line, { tolerance: 0, decimals: 2 });
  assert.equal(taken.length, 2);
  assert.deepEqual(taken, [[0, 0], [0, 0]]);
});

test('simplifyLine with no tolerance at all returns the line it was given', () => {
  const line = [[0, 0], [1, 1], [2, 2]];
  assert.equal(simplifyLine(line, {}), line, 'the same array, uncopied');
  assert.equal(simplifyLine(line), line);
});

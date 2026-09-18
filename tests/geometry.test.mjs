// The clipper the seam is cut with, and the seam cut itself.
//
// Everything here is exact arithmetic on small shapes: the point of the tests
// is that a ring keeps its winding, that a hole survives its outer ring, that
// a sliver is dropped rather than drawn, that a line becomes the runs of it
// inside the box, and that cutting the world in two neither loses area nor
// leaves anything across the cut.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clipToBox, clipRing, clipLine, splitAtMeridian, crossesMeridian, geometryBbox, SEAM_GAP,
} from '../tools/import/geometry.mjs';
import { ringArea } from '../src/util/simplify.js';

// A closed ring, counter-clockwise, from a box.
const boxRing = ([w, s, e, n]) => [[w, s], [e, s], [e, n], [w, n], [w, s]];
const polygon = (...rings) => ({ type: 'Polygon', coordinates: rings });
const area = (geometry) => {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.reduce((total, rings) => total
    + rings.reduce((sum, ring, i) => sum + (i === 0 ? 1 : -1) * Math.abs(ringArea(ring)), 0), 0);
};
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

test('a shape wholly inside the box comes back as it was, and one outside is gone', () => {
  const inside = polygon(boxRing([1, 1, 2, 2]));
  assert.equal(clipToBox(inside, [0, 0, 10, 10]), inside, 'the same object: nothing was cut');
  assert.equal(clipToBox(polygon(boxRing([20, 20, 30, 30])), [0, 0, 10, 10]), null);
  // Touching the edge from outside is still outside.
  assert.equal(clipToBox(polygon(boxRing([10, 0, 20, 10])), [0, 0, 10, 10]), null);
});

test('a ring across an edge is cut to the box and keeps its area', () => {
  const clipped = clipToBox(polygon(boxRing([-5, 0, 5, 10])), [0, 0, 10, 10]);
  assert.equal(clipped.type, 'Polygon');
  close(area(clipped), 50);
  for (const [x] of clipped.coordinates[0]) assert.ok(x >= 0, `${x} is west of the box`);
});

test('winding survives the cut, outer ring and hole alike', () => {
  const outer = boxRing([-5, -5, 5, 5]);
  const hole = [...boxRing([-2, -2, 2, 2])].reverse();
  assert.ok(ringArea(outer) > 0 && ringArea(hole) < 0, 'the fixture is wound the way GeoJSON asks');
  const clipped = clipToBox(polygon(outer, hole), [-4, -4, 4, 4]);
  assert.equal(clipped.coordinates.length, 2, 'the hole is still there');
  assert.ok(ringArea(clipped.coordinates[0]) > 0, 'the outer ring is still counter-clockwise');
  assert.ok(ringArea(clipped.coordinates[1]) < 0, 'and the hole is still clockwise');
  close(area(clipped), 64 - 16);
});

test('a hole the box does not reach is dropped and its outer ring is not', () => {
  const kept = clipToBox(polygon(boxRing([0, 0, 10, 10]), [...boxRing([7, 7, 9, 9])].reverse()), [0, 0, 5, 5]);
  assert.equal(kept.coordinates.length, 1);
  close(area(kept), 25);
});

test('a ring the box leaves as a sliver is dropped, not drawn', () => {
  // A triangle that meets the box along one edge only: nothing of it has area
  // inside, and a ring with no area is a line.
  assert.equal(clipRing([[0, 0], [-4, 4], [-4, -4], [0, 0]], [0, -10, 10, 10]), null);
  // And a polygon whose outer ring goes takes its holes with it.
  assert.equal(clipToBox(polygon([[0, 0], [-4, 4], [-4, -4], [0, 0]], boxRing([-3, -1, -2, 1])), [0, -10, 10, 10]), null);
});

test('a line is cut into the runs of it inside the box', () => {
  // In, out, in again: two lines and not one, because joining them would draw
  // a river through ground the source leaves empty.
  const parts = clipLine([[-5, 5], [5, 5], [15, 5], [25, 5]], [0, 0, 10, 10]);
  assert.equal(parts.length, 1, 'one run: it leaves the box once and does not come back');
  assert.deepEqual(parts[0], [[0, 5], [5, 5], [10, 5]]);

  const twice = clipLine([[1, 5], [20, 5], [20, 1], [1, 1]], [0, 0, 10, 10]);
  assert.equal(twice.length, 2);
  assert.deepEqual(twice[0], [[1, 5], [10, 5]]);
  assert.deepEqual(twice[1], [[10, 1], [1, 1]]);

  assert.equal(clipToBox({ type: 'LineString', coordinates: [[20, 20], [30, 30]] }, [0, 0, 10, 10]), null);
  const multi = clipToBox({ type: 'LineString', coordinates: [[1, 5], [20, 5], [20, 1], [1, 1]] }, [0, 0, 10, 10]);
  assert.equal(multi.type, 'MultiLineString');
  assert.equal(multi.coordinates.length, 2);
});

// --- the seam -------------------------------------------------------------

test('a shape the meridian does not touch is not cut at all', () => {
  const east = polygon(boxRing([100, 0, 120, 20]));
  assert.equal(splitAtMeridian(east, -30), east);
  const west = polygon(boxRing([-100, 0, -80, 20]));
  assert.equal(splitAtMeridian(west, -30), west);
});

test('a shape across the meridian becomes two, one each side of it', () => {
  const across = polygon(boxRing([-40, 0, -20, 20]));
  assert.ok(crossesMeridian(across, -30));
  const split = splitAtMeridian(across, -30);
  assert.equal(split.type, 'MultiPolygon');
  assert.equal(split.coordinates.length, 2);
  assert.ok(!crossesMeridian(split, -30), 'nothing is left across the seam');
  // Area is conserved but for the gap the western half is held back by.
  close(area(split), 400 - SEAM_GAP * 20, 1e-6);

  const [w, , e] = geometryBbox(split);
  close(w, -40);
  close(e, -20);
  // The seam belongs to the eastern half; the western half stops short of it.
  const easts = split.coordinates.filter((rings) => rings[0].some(([x]) => x === -30));
  assert.equal(easts.length, 1, 'exactly one half sits on the seam itself');
  const wests = split.coordinates.filter((rings) => rings[0].some(([x]) => x === -30 - SEAM_GAP));
  assert.equal(wests.length, 1, 'and the other stops a gap short of it');
});

test('a hole across the meridian is cut with its outer ring', () => {
  const across = polygon(boxRing([-40, -10, -20, 10]), [...boxRing([-35, -5, -25, 5])].reverse());
  const split = splitAtMeridian(across, -30);
  assert.equal(split.coordinates.length, 2, 'two polygons');
  for (const rings of split.coordinates) {
    assert.equal(rings.length, 2, 'each half keeps its share of the hole');
    assert.ok(ringArea(rings[0]) > 0 && ringArea(rings[1]) < 0, 'wound as it was');
  }
  close(area(split), (20 * 20) - (10 * 10) - (SEAM_GAP * 10), 1e-6);
});

test('a line across the meridian is cut at it', () => {
  const split = splitAtMeridian({ type: 'LineString', coordinates: [[-40, 0], [-20, 0]] }, -30);
  assert.equal(split.type, 'MultiLineString');
  assert.deepEqual(split.coordinates.sort((a, b) => a[0][0] - b[0][0]), [
    [[-40, 0], [-30 - SEAM_GAP, 0]],
    [[-30, 0], [-20, 0]],
  ]);
});

test('the whole world split at a meridian keeps every polygon and loses no area', () => {
  const world = {
    type: 'MultiPolygon',
    coordinates: [boxRing([-170, -80, -40, 80]), boxRing([-35, -10, 60, 40]), boxRing([80, 0, 170, 70])].map((r) => [r]),
  };
  const before = area(world);
  const split = splitAtMeridian(world, -30);
  assert.ok(!crossesMeridian(split, -30));
  close(area(split), before - SEAM_GAP * 50, 1e-6);
  assert.equal(split.coordinates.length, 4, 'the one shape the meridian runs through became two');
});

test('a meridian at the edge of the world leaves the world whole', () => {
  const world = polygon(boxRing([-180, -80, 180, 80]));
  assert.equal(splitAtMeridian(world, -180), world, 'there is no western half to cut');
});

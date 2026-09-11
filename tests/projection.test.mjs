import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProjection, fitBounds, worldProjection, relativeLon, absoluteLon, lonSpan,
  WORLD, CENTRAL_MERIDIAN, SEAM, WORLD_WIDTH,
} from '../src/map/projection.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

// Everything below is asked of both centres: the one the projection had for
// its first thirty-eight milestones, and the one M39a chose. A projection
// that works only at zero is a projection nobody moved.
const CENTRES = [0, CENTRAL_MERIDIAN];

test('the seam is half a world from the centre', () => {
  assert.equal(CENTRAL_MERIDIAN, 150);
  assert.equal(SEAM, -30);
  assert.equal(WORLD_WIDTH, 960);
  assert.equal(relativeLon(SEAM, CENTRAL_MERIDIAN), -180, 'the seam is the left edge of the picture');
  assert.equal(relativeLon(CENTRAL_MERIDIAN, CENTRAL_MERIDIAN), 0);
});

test('a longitude shifted and wrapped, and unshifted again', () => {
  for (const centre of CENTRES) {
    for (const lon of [-180, -179.9, -30, 0, 0.01, 90, 150, 179.9]) {
      const offset = relativeLon(lon, centre);
      assert.ok(offset >= -180 && offset < 180, `${lon} at ${centre} → ${offset}`);
      close(absoluteLon(offset, centre), lon);
    }
    // The two ends of the world are one meridian, and it is written as -180.
    assert.equal(relativeLon(180, centre), relativeLon(-180, centre));
    assert.equal(absoluteLon(relativeLon(180, centre), centre), -180);
  }
});

test('project and unproject round trip', () => {
  for (const centre of CENTRES) {
    const p = createProjection({ width: 960, height: 480, center: [centre + 10, 20], scale: 4 });
    for (const point of [[0, 0], [-9.14, 38.71], [179.9, -89.9], [-180, 90], [10, 20], [SEAM, 0]]) {
      const [x, y] = p.project(point);
      const [lon, lat] = p.unproject([x, y]);
      close(lon, point[0]);
      close(lat, point[1]);
    }
  }
});

test('the centre lands in the middle and north is up', () => {
  for (const centre of CENTRES) {
    const p = createProjection({ width: 960, height: 480, center: [centre, 20], scale: 4 });
    assert.deepEqual(p.project([centre, 20]), [480, 240]);
    const [, yNorth] = p.project([centre, 30]);
    const [, ySouth] = p.project([centre, 10]);
    assert.ok(yNorth < 240 && ySouth > 240);
    const [xEast] = p.project([absoluteLon(10, centre), 20]);
    assert.equal(xEast, 520);
    const [xWest] = p.project([absoluteLon(-10, centre), 20]);
    assert.equal(xWest, 440);
  }
});

test('the world is 960 units wide at k = 1, whichever meridian is in the middle', () => {
  for (const centre of CENTRES) {
    const p = worldProjection({ width: 960, height: 540, center: centre });
    assert.equal(p.scale, 960 / 360);
    assert.deepEqual(p.project([centre, 0]), [480, 270]);
    // The seam of that centre is the left edge, and the meridian a hair east
    // of it is the right.
    const seam = ((centre + 180 + 180) % 360) - 180;
    close(p.project([seam, 0])[0], 0);
    close(p.project([absoluteLon(179.999, centre), 0])[0], 959.997333333);
    // 180 degrees of latitude in 480 of the 540 units: the world is shorter
    // than the picture and is not stretched to fill it.
    close(p.project([centre, 90])[1], 30);
    close(p.project([centre, -90])[1], 510);
  }
});

test('fitBounds contains the box with a margin and the world fits by default', () => {
  const p = fitBounds([[-40, -20], [40, 50]], { width: 800, height: 600, margin: 0.1 });
  for (const corner of [[-40, -20], [40, 50], [-40, 50], [40, -20]]) {
    const [x, y] = p.project(corner);
    assert.ok(x >= 0 && x <= 800 && y >= 0 && y <= 600, `${corner} → ${x},${y}`);
  }
  const world = fitBounds(WORLD, { width: 720, height: 360, margin: 0 });
  assert.deepEqual(world.project([-180, 90]), [0, 0]);
  // ±180 is one meridian and it is the left edge; the right edge is what lies
  // a hair short of it going east.
  close(world.project([179.999, -90])[0], 719.998);
  close(world.project([179.999, -90])[1], 360);
});

test('a span is measured going east, so a box may cross the antimeridian', () => {
  assert.equal(lonSpan(-10, 10), 20);
  assert.equal(lonSpan(170, -170), 20, 'east from 170 to -170 is twenty degrees');
  assert.equal(lonSpan(-170, 170), 340, 'and the other way round is the rest of the world');
  assert.equal(lonSpan(-180, 180), 360, 'two ends on one meridian is the whole world');
  assert.equal(lonSpan(0, 0), 360);
});

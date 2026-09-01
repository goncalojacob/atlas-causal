import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProjection, fitBounds, WORLD } from '../src/map/projection.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

test('project and unproject round trip', () => {
  const p = createProjection({ width: 960, height: 480, center: [10, 20], scale: 4 });
  for (const point of [[0, 0], [-9.14, 38.71], [179.9, -89.9], [-180, 90], [10, 20]]) {
    const [x, y] = p.project(point);
    const [lon, lat] = p.unproject([x, y]);
    close(lon, point[0]);
    close(lat, point[1]);
  }
});

test('the centre lands in the middle and north is up', () => {
  const p = createProjection({ width: 960, height: 480, center: [10, 20], scale: 4 });
  assert.deepEqual(p.project([10, 20]), [480, 240]);
  const [, yNorth] = p.project([10, 30]);
  const [, ySouth] = p.project([10, 10]);
  assert.ok(yNorth < 240 && ySouth > 240);
  const [xEast] = p.project([20, 20]);
  assert.equal(xEast, 520);
});

test('fitBounds contains the box with a margin and the world fits by default', () => {
  const p = fitBounds([[-40, -20], [40, 50]], { width: 800, height: 600, margin: 0.1 });
  for (const corner of [[-40, -20], [40, 50], [-40, 50], [40, -20]]) {
    const [x, y] = p.project(corner);
    assert.ok(x >= 0 && x <= 800 && y >= 0 && y <= 600, `${corner} → ${x},${y}`);
  }
  const world = fitBounds(WORLD, { width: 720, height: 360, margin: 0 });
  assert.deepEqual(world.project([-180, 90]), [0, 0]);
  assert.deepEqual(world.project([180, -90]), [720, 360]);
});

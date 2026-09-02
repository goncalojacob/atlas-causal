// The map's level of detail rests on this module being predictable: the
// same points and the same zoom must give the same clusters, with the same
// representative, or a mark would jump between renders.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clusterPoints, spreadPositions, byWeightThenId,
  MERGE_DISTANCE, COINCIDENT_EPSILON, DEEPEST_ZOOM, SPREAD_RADIUS, SPREAD_GAP,
} from '../src/map/cluster.js';

const point = (id, x, y, weight = 0) => ({ id, x, y, weight });

// A stack of events on one city, plus two neighbours a few units away.
function sample() {
  return [
    point('lisbon-a', 100, 100, 5),
    point('lisbon-b', 100, 100, 9),
    point('lisbon-c', 100, 100, 2),
    point('alvor', 108, 104, 3),
    point('braga', 100, 114, 1),
    point('luanda', 400, 300, 4),
  ];
}

const idsOf = (cluster) => cluster.members.map((m) => m.id);
const byKey = (clusters) => Object.fromEntries(clusters.map((c) => [c.key, c]));

test('every point lands in exactly one cluster', () => {
  for (const k of [1, 2, 4, 10, 40]) {
    const clusters = clusterPoints(sample(), { k });
    const ids = clusters.flatMap(idsOf);
    assert.equal(ids.length, sample().length, `k=${k}`);
    assert.equal(new Set(ids).size, ids.length, `k=${k}: no point in two clusters`);
    for (const c of clusters) assert.equal(c.count, c.members.length);
  }
});

test('the heaviest member represents the cluster, ties broken by id', () => {
  const clusters = clusterPoints(sample(), { k: 1 });
  const lisbon = clusters.find((c) => idsOf(c).includes('lisbon-b'));
  assert.equal(lisbon.key, 'lisbon-b');
  assert.equal(lisbon.representative.id, 'lisbon-b');
  assert.equal(lisbon.x, 100);
  assert.equal(lisbon.y, 100);
  const tied = clusterPoints([point('zulu', 0, 0, 3), point('alpha', 0, 0, 3)], { k: 1 });
  assert.equal(tied[0].key, 'alpha');
  assert.deepEqual([...[point('b', 0, 0, 1), point('a', 0, 0, 1)]].sort(byWeightThenId).map((p) => p.id), ['a', 'b']);
});

test('the cluster weighs what its members weigh together', () => {
  const clusters = byKey(clusterPoints(sample(), { k: 1 }));
  // At k = 1 everything Portuguese in the sample is inside D of Lisbon.
  assert.equal(clusters['lisbon-b'].weight, 5 + 9 + 2 + 3 + 1);
  assert.equal(clusters.luanda.weight, 4);
});

test('marks closer than D merge at k = 1 and split as k grows', () => {
  const pair = [point('near-a', 0, 0, 2), point('near-b', MERGE_DISTANCE - 1, 0, 1)];
  assert.equal(clusterPoints(pair, { k: 1 }).length, 1, 'closer than D: one cluster');
  assert.equal(clusterPoints(pair, { k: 4 }).length, 2, 'zoomed in: two clusters');
  const apart = [point('far-a', 0, 0, 2), point('far-b', MERGE_DISTANCE + 1, 0, 1)];
  assert.equal(clusterPoints(apart, { k: 1 }).length, 2, 'further than D: never merged');

  // The neighbours of the sample separate from Lisbon on the way in, which
  // is the whole promise of "zooming shows more".
  const counts = [1, 2, 4].map((k) => clusterPoints(sample(), { k }).length);
  assert.deepEqual(counts, [2, 4, 4]);
  const zoomed = byKey(clusterPoints(sample(), { k: 4 }));
  assert.deepEqual(idsOf(zoomed['lisbon-b']).sort(), ['lisbon-a', 'lisbon-b', 'lisbon-c']);
  assert.ok(zoomed.alvor && zoomed.braga, 'the neighbours are their own clusters now');
});

test('coincident members are recognised and never counted as splittable', () => {
  const stack = [point('one', 5, 5, 1), point('two', 5, 5, 2), point('three', 5 + COINCIDENT_EPSILON / 2, 5, 0)];
  for (const k of [1, 40]) {
    const [cluster] = clusterPoints(stack, { k });
    assert.equal(cluster.count, 3, `k=${k}`);
    assert.equal(cluster.coincident, true, `k=${k}: no zoom separates these`);
    assert.equal(cluster.splittable, false, `k=${k}`);
  }
  const [spread] = clusterPoints([point('one', 0, 0, 1), point('two', 3, 0, 0)], { k: 1 });
  assert.equal(spread.coincident, false);
  assert.equal(spread.splittable, true);
  const [alone] = clusterPoints([point('only', 0, 0, 1)], { k: 1 });
  assert.equal(alone.coincident, true, 'one point is trivially coincident with itself');
  assert.equal(alone.splittable, false, 'but a cluster of one is never split or spread');
});

test('coincident means no zoom the map allows could separate them', () => {
  // The epsilon is the merge threshold at the deepest zoom: exactly the
  // distance below which zooming to the limit still leaves two marks merged.
  assert.equal(COINCIDENT_EPSILON, MERGE_DISTANCE / DEEPEST_ZOOM);
  const hair = COINCIDENT_EPSILON * 0.9;
  const stack = [point('core', 0, 0, 2), point('almost', hair, 0, 1)];
  const [atLimit] = clusterPoints(stack, { k: DEEPEST_ZOOM });
  assert.equal(atLimit.count, 2, 'the deepest zoom does not part them');
  assert.equal(atLimit.coincident, true);
  // A hair further and the deepest zoom does part them, so they are not.
  const parted = clusterPoints([point('core', 0, 0, 2), point('almost', COINCIDENT_EPSILON * 1.1, 0, 1)], { k: DEEPEST_ZOOM });
  assert.equal(parted.length, 2);
});

test('coreZoom is the zoom at which only the inseparable members are left', () => {
  // A stack of three on one point, a neighbour at 6 and another at 10.
  const points = [
    point('stack-a', 0, 0, 9), point('stack-b', 0, 0, 4), point('stack-c', 0, 0, 1),
    point('near', 6, 0, 2), point('far', 10, 0, 3),
  ];
  const [cluster] = clusterPoints(points, { k: 1 });
  assert.equal(cluster.count, 5);
  assert.equal(cluster.splittable, true);
  // The nearest member that can leave is `near`, at 6: past D/6 it is gone,
  // and so is everything further out.
  assert.ok(cluster.coreZoom > MERGE_DISTANCE / 6 && cluster.coreZoom < (MERGE_DISTANCE / 6) * 1.1);
  const core = clusterPoints(points, { k: cluster.coreZoom });
  const stack = core.find((c) => c.key === 'stack-a');
  assert.deepEqual(stack.members.map((m) => m.id).sort(), ['stack-a', 'stack-b', 'stack-c']);
  assert.equal(stack.coincident, true, 'one click on the blob reaches a cluster that can be spread');
  assert.equal(stack.coreZoom, null, 'and it has nothing left to shed');
  assert.equal(clusterPoints([point('only', 0, 0, 1)], { k: 1 })[0].coreZoom, null);
});

test('the result does not depend on the order the points arrive in', () => {
  const forward = clusterPoints(sample(), { k: 1 });
  const backward = clusterPoints(sample().reverse(), { k: 1 });
  const shuffled = clusterPoints([3, 0, 5, 1, 4, 2].map((i) => sample()[i]), { k: 1 });
  const shape = (clusters) => clusters.map((c) => [c.key, idsOf(c).slice().sort(), c.coincident]);
  assert.deepEqual(shape(backward), shape(forward));
  assert.deepEqual(shape(shuffled), shape(forward));
  assert.deepEqual(clusterPoints([], { k: 1 }), []);
});

test('clusters come back in the order their representatives were seeded', () => {
  const clusters = clusterPoints(sample(), { k: 40 });
  const seeds = clusters.map((c) => c.representative.weight);
  assert.deepEqual(seeds, [...seeds].sort((a, b) => b - a));
  // The sum of a cluster is not the same ranking, so a caller choosing what
  // to label sorts by `weight` itself rather than trusting this order.
  assert.deepEqual(clusters.map((c) => c.key), ['lisbon-b', 'luanda', 'alvor', 'braga']);
});

test('the centre is the mean of the members, the mark is on the representative', () => {
  const [cluster] = clusterPoints([point('a', 0, 0, 2), point('b', 10, 0, 1)], { k: 1 });
  assert.deepEqual(cluster.centre, { x: 5, y: 0 });
  assert.equal(cluster.x, 0);
  assert.equal(cluster.y, 0);
});

test('a spread gives every member its own place, far enough apart to click', () => {
  assert.deepEqual(spreadPositions(0), []);
  for (const count of [1, 2, 11, 12, 13, 37, 60]) {
    const positions = spreadPositions(count);
    assert.equal(positions.length, count, `${count} members`);
    for (const p of positions) {
      const r = Math.hypot(p.x, p.y);
      assert.ok(r >= SPREAD_RADIUS - 1e-9, `${count}: no member sits on the hub`);
      assert.equal(Number.isFinite(p.x) && Number.isFinite(p.y), true);
    }
    // Nearest neighbours on the same ring keep at least a mark's room.
    for (const ring of new Set(positions.map((p) => p.ring))) {
      const onRing = positions.filter((p) => p.ring === ring);
      if (onRing.length < 2) continue;
      const nearest = Math.min(...onRing.flatMap((a, i) => onRing.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y))));
      assert.ok(nearest >= SPREAD_GAP * 0.75, `${count}: members on ring ${ring} are ${nearest.toFixed(1)} apart`);
    }
  }
  assert.equal(new Set(spreadPositions(12).map((p) => p.ring)).size, 1, 'a dozen still fit on one ring');
  const many = spreadPositions(37);
  assert.ok(new Set(many.map((p) => p.ring)).size > 1, 'beyond a ringful it spirals outward');
  // No ring is left holding a single mark while an inner one is crowded.
  for (const ring of new Set(many.map((p) => p.ring))) {
    assert.ok(many.filter((p) => p.ring === ring).length > 1, `ring ${ring} has more than one member`);
  }
  assert.equal(spreadPositions(4, { radius: 10, gap: 1 })[0].x.toFixed(6), '0.000000');
});

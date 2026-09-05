// The map's level of detail rests on this module being predictable: the
// same points and the same zoom must give the same clusters, with the same
// representative, or a mark would jump between renders.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clusterPoints, spreadPositions, byWeightThenId, mergeEdges,
  MERGE_DISTANCE, COINCIDENT_EPSILON, DEEPEST_ZOOM, SPREAD_RADIUS, SPREAD_GAP, SPLIT_MARGIN,
  zoomBucket, ZOOM_BUCKETS_PER_OCTAVE,
} from '../src/cluster.js';

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

// What the reader is working with is never swallowed by a stack. Every view
// promises it; since M25 the promise is kept in one place.
test('a point held out of the grouping keeps a mark of its own', () => {
  const clusters = clusterPoints(sample(), { k: 1, alone: new Set(['lisbon-a', 'braga']) });
  const byId_ = byKey(clusters);
  assert.deepEqual(idsOf(byId_['lisbon-a']), ['lisbon-a']);
  assert.equal(byId_['lisbon-a'].count, 1);
  assert.equal(byId_['lisbon-a'].alone, true);
  assert.deepEqual(idsOf(byId_.braga), ['braga']);
  // And it is not gathered into anybody else's cluster either: Lisbon is
  // now b and c only, with alvor still in reach of it.
  assert.deepEqual(idsOf(byId_['lisbon-b']).sort(), ['alvor', 'lisbon-b', 'lisbon-c']);
  assert.equal(byId_['lisbon-b'].alone, false);
  // Every point is still in exactly one cluster, and the counts still add up.
  const ids = clusters.flatMap(idsOf);
  assert.equal(ids.length, sample().length);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(clusters.reduce((n, c) => n + c.count, 0), sample().length);
  // A solitary point is shaped exactly like a lone one, so nothing drawing
  // it has to ask which it is.
  const solo = byId_.braga;
  assert.equal(solo.coincident, true);
  assert.equal(solo.splittable, false);
  assert.equal(solo.coreZoom, null);
  // Holding everything out is a picture with no stacks at all.
  const none = clusterPoints(sample(), { k: 1, alone: new Set(sample().map((p) => p.id)) });
  assert.equal(none.length, sample().length);
  assert.deepEqual(none.map((c) => c.count), none.map(() => 1));
  // The default is unchanged: no set means no exceptions.
  assert.deepEqual(clusterPoints(sample(), { k: 1 }).map((c) => c.alone), [false, false]);
});

test('holding points out does not depend on the order they arrive in', () => {
  const alone = new Set(['lisbon-a', 'braga']);
  const shape = (list) => clusterPoints(list, { k: 1, alone })
    .map((c) => [c.key, idsOf(c).slice().sort(), c.alone]);
  assert.deepEqual(shape(sample().reverse()), shape(sample()));
  assert.deepEqual(shape([3, 0, 5, 1, 4, 2].map((i) => sample()[i])), shape(sample()));
});

// Once the points have merged, the links between them have to merge too.
const link = (id, from, to, type = 'caused', confidence = 'consensus') => ({ id, from, to, type, confidence });

test('links between two stacks merge into one, counted', () => {
  const clusterOf = new Map([['a1', 'A'], ['a2', 'A'], ['b1', 'B'], ['b2', 'B'], ['c1', 'C']]);
  const merged = mergeEdges([
    link('e3', 'a1', 'b1'), link('e1', 'a2', 'b2', 'enabled'), link('e2', 'a1', 'b2'),
    link('e4', 'a1', 'c1', 'inspired'),
  ], clusterOf);
  assert.deepEqual(merged.map((m) => m.key), ['A|B', 'A|C']);
  const ab = merged[0];
  assert.equal(ab.count, 3);
  assert.deepEqual(ab.members.map((m) => m.id), ['e1', 'e2', 'e3'], 'members come back in id order');
  assert.equal(ab.type, 'caused', 'the commonest type of the three');
  assert.equal(ab.disputed, false);
  assert.equal(merged[1].count, 1);
  assert.equal(merged[1].type, 'inspired');
});

test('a merged link is disputed if any single member is', () => {
  const clusterOf = new Map([['a1', 'A'], ['a2', 'A'], ['b1', 'B']]);
  const [merged] = mergeEdges([
    link('e1', 'a1', 'b1'), link('e2', 'a2', 'b1', 'caused', 'disputed'),
  ], clusterOf);
  assert.equal(merged.count, 2);
  assert.equal(merged.disputed, true, 'one dispute is enough: the bundle is not settled');
});

test('a link inside one stack is not drawn, and direction is kept', () => {
  const clusterOf = new Map([['a1', 'A'], ['a2', 'A'], ['b1', 'B']]);
  assert.deepEqual(mergeEdges([link('e1', 'a1', 'a2')], clusterOf), []);
  const both = mergeEdges([link('e1', 'a1', 'b1'), link('e2', 'b1', 'a2')], clusterOf);
  assert.deepEqual(both.map((m) => m.key), ['A|B', 'B|A'], 'A→B and B→A are two links, not one');
  // An end nobody knows is dropped rather than drawn from nowhere.
  assert.deepEqual(mergeEdges([link('e1', 'a1', 'ghost')], clusterOf), []);
  assert.deepEqual(mergeEdges([], clusterOf), []);
});

test('merging links does not depend on the order they arrive in', () => {
  const clusterOf = new Map([['a1', 'A'], ['a2', 'A'], ['b1', 'B'], ['b2', 'B']]);
  const links = [
    link('e1', 'a1', 'b1', 'enabled'), link('e2', 'a2', 'b2', 'caused'),
    link('e3', 'a1', 'b2', 'enabled'), link('e4', 'a2', 'b1', 'caused'),
  ];
  const shape = (list) => JSON.stringify(mergeEdges(list, clusterOf));
  assert.equal(shape([...links].reverse()), shape(links));
  assert.equal(shape([2, 0, 3, 1].map((i) => links[i])), shape(links));
  // Two types tied two-all: the type's own name breaks it, so the picture
  // does not depend on which link happened to be read first.
  assert.equal(mergeEdges(links, clusterOf)[0].type, 'caused');
});

// --- the zoom buckets ------------------------------------------------------
//
// What the map groups at is the bucket below the zoom it draws at, so a wheel
// that moves the zoom by a percent does not group fourteen thousand points
// again. Rounding down is the safe direction and the tests say so.

test('a zoom bucket is never above the zoom it stands for, and never far below', () => {
  for (const k of [1, 1.0001, 1.4, 2, 3.7, 8, 17.5, DEEPEST_ZOOM]) {
    const bucket = zoomBucket(k);
    assert.ok(bucket <= k, `k=${k}: the bucket (${bucket}) is not above the zoom`);
    assert.ok(bucket > k / (2 ** (1 / ZOOM_BUCKETS_PER_OCTAVE)),
      `k=${k}: the bucket (${bucket}) is within one bucket of it`);
  }
  assert.equal(zoomBucket(1), 1, 'the zoom the map opens at is its own bucket');
  assert.equal(zoomBucket(2), 2, 'and so is every octave of it');
  assert.equal(zoomBucket(4), 4);
  // The same bucket twice is what the cache is for.
  assert.equal(zoomBucket(1.01), zoomBucket(1.02));
  assert.ok(zoomBucket(1.0) < zoomBucket(1.2), 'and a real move is a different one');
});

test('a bucket groups a hair more than the zoom does, never a hair less', () => {
  // Two points a shade further apart than D at k = 2: at that zoom they are
  // two clusters, and the bucket below it must not be the zoom that says so
  // before it is true. Rounding up is what this forbids.
  const gap = MERGE_DISTANCE / 2;
  for (const k of [1.03, 1.9, 2.5, 6.1, 31]) {
    const pair = [point('a', 0, 0, 2), point('b', (MERGE_DISTANCE / k) * 1.001, 0, 1)];
    const atBucket = clusterPoints(pair, { k: zoomBucket(k) }).length;
    const atZoom = clusterPoints(pair, { k }).length;
    assert.ok(atBucket <= atZoom, `k=${k}: the bucket does not split what the zoom keeps whole`);
  }
  assert.equal(clusterPoints([point('a', 0, 0, 2), point('b', gap, 0, 1)], { k: zoomBucket(1.5) }).length, 1);
  // A zoom that is not a number to round comes back as it is, so whatever the
  // caller meant by it still happens.
  for (const odd of [0, -1, NaN, Infinity]) assert.ok(Object.is(zoomBucket(odd), odd), String(odd));
});

test('a bucket is not what a click on a splittable cluster is answered at', () => {
  // `coreZoom` is the zoom at which everything that can leave a cluster has
  // left, with SPLIT_MARGIN of room past it. The map takes the reader to
  // exactly that zoom and groups at exactly it (`exactZoom` in map.js), and
  // this is why: at buckets any coarser, the zoom the click asked for would
  // round to one that does not part the stack, and the click would move the
  // map and change nothing.
  const points = [
    point('stack-a', 0, 0, 9), point('stack-b', 0, 0, 4), point('stack-c', 0, 0, 1),
    point('near', 6, 0, 2),
  ];
  const [blob] = clusterPoints(points, { k: 1 });
  assert.equal(blob.count, 4);
  assert.ok(clusterPoints(points, { k: blob.coreZoom }).length > 1, 'at the zoom it names, it parts');
  const perOctave = (k) => 2 ** Math.floor(Math.log2(k));
  assert.equal(clusterPoints(points, { k: perOctave(blob.coreZoom) }).length, 1,
    'and at a coarse enough bucket below it, it does not');
  // As the two constants stand the buckets are finer than the margin, so
  // today the rounding would happen to survive it. That is an accident of two
  // numbers chosen for different reasons, and it is not what the map rests
  // on; it is written down here so that changing either is a decision.
  assert.ok(2 ** (1 / ZOOM_BUCKETS_PER_OCTAVE) < SPLIT_MARGIN,
    `a bucket (${(2 ** (1 / ZOOM_BUCKETS_PER_OCTAVE)).toFixed(4)}) is finer than the split margin (${SPLIT_MARGIN})`);
});

// --- the grid against the pass it replaced ---------------------------------
//
// H4a put a uniform grid under `clusterPoints`. The rule did not change and
// neither did the answer, and this is what says so: the implementation the
// grid replaced, kept here verbatim, held to the same output over thousands
// of points at every zoom the map allows.
//
// Verbatim matters. The moment this is rewritten to share anything with
// `src/cluster.js` beyond the constants it is no longer a second opinion, and
// the four conditions the grid rests on — cells wider than the threshold, one
// globally sorted seed walk, the members re-sorted before they are reduced,
// the exact predicate on every candidate — would each be free to rot.

function greedyClusterPoints(points, {
  k = 1, distance = MERGE_DISTANCE, epsilon = COINCIDENT_EPSILON, alone = null,
} = {}) {
  const distanceSquared = (a, b) => ((a.x - b.x) ** 2) + ((a.y - b.y) ** 2);
  const threshold = distance / Math.max(k, Number.EPSILON);
  const withinCluster = threshold * threshold;
  const withinEpsilon = epsilon * epsilon;
  const solitary = alone ?? new Set();
  const seeds = [...points].sort(byWeightThenId);
  const taken = new Set();
  const clusters = [];
  for (const seed of seeds) {
    if (taken.has(seed.id)) continue;
    taken.add(seed.id);
    const solo = solitary.has(seed.id);
    const members = [seed];
    if (!solo) {
      for (const other of seeds) {
        if (taken.has(other.id) || solitary.has(other.id)) continue;
        if (distanceSquared(seed, other) <= withinCluster) {
          taken.add(other.id);
          members.push(other);
        }
      }
    }
    const coincident = members.every((m) => distanceSquared(seed, m) <= withinEpsilon);
    const separable = members.filter((m) => distanceSquared(seed, m) > withinEpsilon);
    const nearestSeparable = separable.length
      ? Math.sqrt(Math.min(...separable.map((m) => distanceSquared(seed, m))))
      : null;
    clusters.push({
      key: seed.id,
      representative: seed,
      members,
      count: members.length,
      x: seed.x,
      y: seed.y,
      centre: {
        x: members.reduce((sum, m) => sum + m.x, 0) / members.length,
        y: members.reduce((sum, m) => sum + m.y, 0) / members.length,
      },
      coincident,
      alone: solo,
      splittable: members.length > 1 && !coincident,
      coreZoom: nearestSeparable === null ? null : (distance / nearestSeparable) * SPLIT_MARGIN,
      weight: members.reduce((sum, m) => sum + (m.weight ?? 0), 0),
    });
  }
  return clusters;
}

// A seeded world, so a failure can be reproduced. Mulberry32, as in
// tests/bench/run.mjs: what is wanted here is the same points twice, not
// statistical quality.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Points on a field the size of the projected world, most of them sharing a
// place with another: a uniform cloud would never build the stacks the two
// implementations have to agree about.
function crowd(count, seed) {
  const random = seeded(seed);
  const places = [];
  for (let i = 0; i < Math.max(1, Math.round(count / 8)); i += 1) {
    places.push([random() * 960, random() * 540]);
  }
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const [px, py] = places[Math.floor(random() ** 2 * places.length)];
    // A little jitter on some of them, so the field has coincident stacks,
    // separable stacks and lone points all at once.
    const jitter = random() < 0.4 ? (random() - 0.5) * 30 : 0;
    points.push({
      id: `p${String(i).padStart(5, '0')}`, x: px + jitter, y: py + jitter * 0.5, weight: (i * 7) % 11,
    });
  }
  return points;
}

// Everything the map and the timeline read off a cluster, in the order the
// members are in: member order is what decides `centre`'s last bits and what
// the panel lists.
const fully = (clusters) => clusters.map((c) => ({
  key: c.key,
  members: c.members.map((m) => m.id),
  count: c.count,
  x: c.x,
  y: c.y,
  centre: c.centre,
  coincident: c.coincident,
  alone: c.alone,
  splittable: c.splittable,
  coreZoom: c.coreZoom,
  weight: c.weight,
}));

test('the grid gives the greedy pass its own answer, members and centres included', () => {
  for (const [count, seed] of [[3000, 415], [5000, 1580]]) {
    const points = crowd(count, seed);
    for (const k of [1, 2, 8, 17.5, DEEPEST_ZOOM]) {
      assert.deepEqual(fully(clusterPoints(points, { k })), fully(greedyClusterPoints(points, { k })),
        `${count} points at k=${k}`);
    }
  }
});

test('and it agrees with it about points held out, and about a lane', () => {
  const points = crowd(3000, 1415);
  // What the reader is working with: a scattering of ids across the field,
  // some of them in stacks and some of them alone already.
  const alone = new Set(points.filter((_, i) => i % 37 === 0).map((p) => p.id));
  for (const k of [1, 4, DEEPEST_ZOOM]) {
    assert.deepEqual(fully(clusterPoints(points, { k, alone })), fully(greedyClusterPoints(points, { k, alone })),
      `held out at k=${k}`);
  }
  // The timeline's call: one dimension, its own distance, and no epsilon at
  // all, which is the case where every member is separable.
  const lane = points.map((p) => ({ ...p, y: 0 }));
  for (const options of [{ k: 1, distance: 11, epsilon: 0 }, { k: 3, distance: 40, epsilon: 0 }]) {
    assert.deepEqual(fully(clusterPoints(lane, options)), fully(greedyClusterPoints(lane, options)),
      `a lane at ${JSON.stringify(options)}`);
  }
});

test('the two agree on the edges of the rule as well as the middle', () => {
  // A point exactly on the threshold, which is the case the `<=` decides and
  // the one a grid cell's boundary could lose.
  const onIt = [
    point('a', 0, 0, 3), point('b', MERGE_DISTANCE, 0, 2), point('c', 0, MERGE_DISTANCE, 1),
    point('d', MERGE_DISTANCE * Math.SQRT1_2, MERGE_DISTANCE * Math.SQRT1_2, 0),
  ];
  // A row of points one threshold apart, so every cell boundary in the grid
  // has a point sitting on it.
  const row = [];
  for (let i = 0; i < 400; i += 1) row.push(point(`r${String(i).padStart(3, '0')}`, i * MERGE_DISTANCE, 0, i % 5));
  // Negative coordinates: the map's projected space runs either side of zero
  // and `Math.floor` of a negative quotient is where an index scheme goes
  // wrong.
  const across = [];
  for (let i = -60; i < 60; i += 1) across.push(point(`n${i + 60}`, i * 5.5, -i * 3.25, (i + 60) % 7));
  for (const [what, list] of [['on the threshold', onIt], ['a row of thresholds', row], ['across zero', across]]) {
    for (const k of [1, 1.0001, 8, DEEPEST_ZOOM]) {
      assert.deepEqual(fully(clusterPoints(list, { k })), fully(greedyClusterPoints(list, { k })), `${what} at k=${k}`);
    }
  }
  // And the degenerate calls, where there is no threshold to divide space by.
  for (const options of [{ k: 1, distance: 0 }, { k: Number.EPSILON }, { k: 1, distance: Infinity }]) {
    assert.deepEqual(fully(clusterPoints(sample(), options)), fully(greedyClusterPoints(sample(), options)),
      JSON.stringify(options));
  }
});

// The timeline uses the same function in one dimension: a lane is the same
// problem with y held at zero and no zoom to split anything.
test('one dimension: bars whose middles are close merge, and the heaviest represents', () => {
  const bar = (id, x, weight) => ({ id, x, y: 0, weight });
  const clusters = clusterPoints(
    [bar('a', 100, 1), bar('b', 105, 9), bar('c', 108, 2), bar('d', 300, 1)],
    { k: 1, distance: 11, epsilon: 0 },
  );
  assert.equal(clusters.length, 2);
  assert.equal(clusters[0].representative.id, 'b', 'the heaviest seeds and represents');
  assert.deepEqual(clusters[0].members.map((m) => m.id).sort(), ['a', 'b', 'c']);
  assert.deepEqual(clusters[1].members.map((m) => m.id), ['d']);
  // Narrowing the window takes members out of the lane, and what is left
  // stands on its own: this is how a stack splits when the scale cannot move.
  const fewer = clusterPoints([bar('b', 105, 9), bar('d', 300, 1)], { k: 1, distance: 11, epsilon: 0 });
  assert.deepEqual(fewer.map((c) => c.count), [1, 1]);
});

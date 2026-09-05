// The benchmark harness: what the hot paths cost, on synthetic data big
// enough that the cost is visible.
//
// It is not a test and it is not named like one. `node --test` matches
// `*.test.mjs` and would run this as a suite that can never fail, which is
// worse than not running it at all (review of the health plan, finding 26).
// Nothing here asserts; it prints.
//
//   node tests/bench/run.mjs           every case
//   node tests/bench/run.mjs cluster   one of them, by name
//
// Its output goes to stdout and nowhere else. A committed benchmark result
// is a number that was true on somebody else's machine, and the number worth
// writing in STATUS.md is the ratio between two runs of this file on the
// same one — before a change and after it.
//
// The data is generated from a seed, so the two runs measure the same points.

import { clusterPoints, DEEPEST_ZOOM } from '../../src/cluster.js';
import { inView } from '../../src/map/layers/events.js';
import { fitBounds, WORLD } from '../../src/map/projection.js';

// --- the generator ---------------------------------------------------------

// Mulberry32: thirty-two bits of state and four lines of arithmetic. The
// point is not statistical quality but that the same seed gives the same
// world twice, on any machine, so two runs are comparable.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Synthetic events shaped like the atlas rather than like a uniform cloud:
// an event happens at a place, several events share a place, and some events
// are processes with no place at all. `graph-layout.test.mjs` builds its
// three hundred out of index arithmetic over a handful of regions; this
// scales that idea up and puts the places on a map.
//
// `placed` is the fraction that have a place — 0.7, which is what the health
// review measured on its 20 000-event dataset (14 000 placed points).
// `perPlace` is how many events share one on average; the atlas's real
// figure is worse than this in Lisbon and better everywhere else.
export function syntheticEvents(count, { seed = 20260905, placed = 0.7, perPlace = 8 } = {}) {
  const random = seeded(seed);
  const placeCount = Math.max(1, Math.round((count * placed) / perPlace));
  const places = [];
  for (let i = 0; i < placeCount; i += 1) {
    places.push({ lon: random() * 360 - 180, lat: random() * 130 - 60 });
  }
  const events = [];
  for (let i = 0; i < count; i += 1) {
    // A place is drawn with a square bias, so a few of them carry a stack and
    // most carry one or two: a uniform draw would make every point the same
    // depth and hide exactly the case the clustering exists for.
    const where = random() < placed ? places[Math.floor(random() ** 2 * placeCount)] : null;
    events.push({
      id: `e${String(i).padStart(6, '0')}`,
      weight: (i % 7) + 1,
      when: { start: 1400 + (i % 600), end: 1400 + (i % 600) },
      place: where,
    });
  }
  return events;
}

// The points the map clusters: an event's place projected, which is what
// `events.js` assembles before it calls `clusterPoints`.
export function pointsOf(events, projection) {
  const points = [];
  for (const event of events) {
    if (!event.place) continue;
    const [x, y] = projection.project([event.place.lon, event.place.lat]);
    points.push({ id: event.id, x, y, weight: event.weight, event });
  }
  return points;
}

// --- timing ----------------------------------------------------------------

// Repeat until a second has gone by, at most five times and at least once, so
// a case that takes a minute is measured once and a case that takes a
// millisecond is not measured through the clock's own noise. The best run is
// reported: it is the one with the least of everything else on the machine
// in it.
function measure(fn, { budget = 1000, most = 5 } = {}) {
  const runs = [];
  let spent = 0;
  while (runs.length < most && (runs.length === 0 || spent < budget)) {
    const started = performance.now();
    fn();
    const took = performance.now() - started;
    runs.push(took);
    spent += took;
  }
  return { best: Math.min(...runs), runs: runs.length };
}

const ms = (value) => (value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2));

function row(label, result, note = '') {
  console.log(`  ${label.padEnd(40)} ${ms(result.best).padStart(9)} ms  ${`(${result.runs} run${result.runs === 1 ? '' : 's'})`.padEnd(9)} ${note}`);
}

// --- the cases -------------------------------------------------------------

const projection = () => fitBounds(WORLD, { width: 960, height: 540, margin: 0 });

// What the health review measured: the clustering alone, at the two sizes it
// reported and the three zooms. 14 000 placed points is a 20 000-event
// dataset; 70 000 is a 100 000-event one.
function benchCluster() {
  console.log('clusterPoints — the grouping alone, by point count and zoom');
  for (const points of [14000, 70000]) {
    const events = syntheticEvents(Math.round(points / 0.7), { seed: 4151580 });
    const list = pointsOf(events, projection());
    for (const k of [1, 8, DEEPEST_ZOOM]) {
      const result = measure(() => clusterPoints(list, { k }));
      const clusters = clusterPoints(list, { k }).length;
      row(`${list.length} points, k=${k}`, result, `→ ${clusters} clusters`);
    }
  }
}

// One notch of the wheel at 20 000 events: the whole of what the map
// recomputes when the zoom changes and nothing else has — the points
// projected, grouped, and culled to the rectangle on screen. The drawing
// itself is a DOM cost and is not measurable here; what is culled away is,
// and it is printed as the count that no longer reaches the DOM.
function benchNotch() {
  console.log('the map at 20 000 events — one wheel notch, without the DOM');
  const events = syntheticEvents(20000, { seed: 20000905 });
  const p = projection();
  // A viewport a third of the world across, which is about what a reader
  // looking at the Atlantic has on screen.
  const view = { x0: 200, y0: 100, x1: 520, y1: 340 };
  for (const k of [1, 4, 16]) {
    let drawn = 0;
    const result = measure(() => {
      const list = pointsOf(events, p);
      const clusters = clusterPoints(list, { k });
      drawn = clusters.filter((c) => inView(c.x, c.y, view, 0)).length;
    });
    const total = clusterPoints(pointsOf(events, p), { k }).length;
    row(`k=${k}`, result, `→ ${total} clusters, ${drawn} in view`);
  }
}

const CASES = { cluster: benchCluster, notch: benchNotch };

const wanted = process.argv.slice(2);
const chosen = wanted.length ? wanted : Object.keys(CASES);
for (const name of chosen) {
  const run = CASES[name];
  if (!run) {
    console.error(`no such case: ${name} (have: ${Object.keys(CASES).join(', ')})`);
    process.exitCode = 1;
    continue;
  }
  run();
  console.log('');
}

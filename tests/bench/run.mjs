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
import { onScreen } from '../../src/map/layers/events.js';
import { fitBounds, WORLD } from '../../src/map/projection.js';
import { rowLanes, laneOf, barBox } from '../../src/lanes.js';
import { createLinearScale } from '../../src/timeline-scale.js';
import { overlaps, withMargin } from '../../src/util/window.js';
import { buildAdjacency, reachableBy, convergence } from '../../src/graph.js';
import { horizonSet, horizonResults, SHOWN } from '../../src/horizon.js';
import { buildSearchIndex, search } from '../../src/search.js';

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
    const at = random() < placed ? Math.floor(random() ** 2 * placeCount) : -1;
    const where = at < 0 ? null : places[at];
    events.push({
      id: `e${String(i).padStart(6, '0')}`,
      title: `Event ${i} of the synthetic corpus`,
      status: 'active',
      weight: (i % 7) + 1,
      when: { start: 1400 + (i % 600), end: 1400 + (i % 600) },
      place: where,
      // The place as an id as well as a point: the map projects the point and
      // the timeline groups by the id, and they are the same place.
      placeId: at < 0 ? null : `p${String(at).padStart(5, '0')}`,
    });
  }
  return events;
}

// A causal graph over those events, shaped like the atlas's: every edge
// points forward in time, most events have one or two consequences, and a
// few carry many — which is what makes one node's downstream large enough
// for the horizon to cost anything.
export function syntheticEdges(events, { seed = 15801415, perEvent = 1.5 } = {}) {
  const random = seeded(seed);
  const byYear = [...events].sort((a, b) => a.when.start - b.when.start
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const types = ['causou', 'permitiu', 'reagiu-a', 'precondicao-de', 'inspirou'];
  const confidences = ['consensus', 'probable', 'disputed'];
  const edges = [];
  for (let i = 0; i < byYear.length; i += 1) {
    // A square bias again: the head of the list is where the branching is,
    // so the reachable set from an early event is most of the corpus and
    // from a late one is nothing.
    const many = Math.floor(perEvent * 2 * random() ** 0.5) + (random() < perEvent % 1 ? 1 : 0);
    for (let n = 0; n < many; n += 1) {
      // Forward only, and mostly nearby: an event leads to what came soon
      // after it far more often than to something four centuries later.
      const ahead = 1 + Math.floor(random() ** 3 * (byYear.length - i - 1));
      const to = byYear[i + ahead];
      if (!to) continue;
      const from = byYear[i];
      const type = types[Math.floor(random() * types.length)];
      edges.push({
        id: `${from.id}--${to.id}--${type}`,
        from: from.id,
        to: to.id,
        type,
        confidence: confidences[Math.floor(random() * confidences.length)],
        status: 'active',
      });
    }
  }
  // Ids are unique: the same pair under the same type twice is one edge.
  const seen = new Set();
  return edges.filter((e) => !seen.has(e.id) && (seen.add(e.id), true));
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
      drawn = clusters.filter((c) => onScreen(c.x, c.y, view, 0)).length;
    });
    const total = clusterPoints(pointsOf(events, p), { k }).length;
    row(`k=${k}`, result, `→ ${total} clusters, ${drawn} in view`);
  }
}

// Who held ground in a year, over the atlas's own 710 presences. Both sides
// are measured in the same run on the same machine: the scan H4a replaced,
// written out here, and the interval index that replaced it. The layer asks
// this once per render, so what the numbers describe is a tick of the
// timeline's band.
function benchPresences(atlas) {
  console.log(`presencesAt — ${atlas.presences.size} presences, a sweep of the years the outlines cover`);
  const { from, to } = atlas.presenceCoverage ?? { from: 1886, to: 2019 };
  const years = [];
  for (let year = from; year <= to; year += 1) years.push(year);
  const all = [...atlas.presences.values()];

  // The scan, as it was before H4a: every presence looked at, every year.
  const scanAt = (year) => {
    const chosen = new Map();
    for (const presence of all) {
      const start = presence.when.start;
      const end = presence.when.end ?? null;
      if (year < start || (end !== null && year > end)) continue;
      const standing = chosen.get(presence.actor);
      if (!standing || standing.when.start < start) chosen.set(presence.actor, presence);
    }
    return [...chosen.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  };

  row('the scan, over every year once', measure(() => {
    for (const year of years) scanAt(year);
  }), `→ ${years.length} years`);
  // The index warm, which is what a reader dragging the band back and forth
  // over a century they have already seen is asking of it.
  for (const year of years) atlas.presencesAt(year);
  row('the index, over every year once', measure(() => {
    for (const year of years) atlas.presencesAt(year);
  }), `→ ${years.length} years`);
}

// The timeline at 20 000 events: what one move of the band recomputes, with
// the DOM left out because Node has none. Three spans, because the cost is
// not in the corpus but in what falls inside the band and its margin — a
// twenty-year window is a reader who has narrowed right down, six hundred is
// the default window, which is everything.
//
// `count` beside each row is what the browser would then have to draw: the
// bars inside the neighbourhood, and the ticks beyond it. The second number
// is the one the density strip is for.
function benchTimeline() {
  console.log('the timeline at 20 000 events — one move of the band, without the DOM');
  const events = syntheticEvents(20000, { seed: 20000905 });
  const width = 1400;
  const min = 1400;
  const max = 1999;
  const pad = (max - min) * 0.04;
  const scale = createLinearScale({ domain: [min - pad - 1, max + pad + 1], range: [120, width - 12] });
  const options = { openEnd: max + pad + 1, gap: 4, maxRows: 20 };
  for (const span of [20, 100, 600]) {
    const from = 1700;
    const window = { from, to: from + span };
    const margin = withMargin(window);
    const near = events.filter((e) => overlaps(e.when, margin));
    const far = events.length - near.length;
    const affinity = (event) => event.placeId ?? null;
    row(`packing, a ${span}-year band`, measure(() => {
      rowLanes(near, scale, width, { ...options, affinity });
    }), `→ ${near.length} bars, ${far} beyond`);

    const lanes = rowLanes(near, scale, width, { ...options, affinity });
    const byLane = new Map(lanes.map((lane) => [lane.id, []]));
    for (const event of near) {
      const lane = laneOf(event, lanes);
      if (lane) byLane.get(lane.id).push(event);
    }
    row(`stacking, a ${span}-year band`, measure(() => {
      for (const [, list] of byLane) {
        clusterPoints(list.map((event) => {
          const box = barBox(event, scale, { openEnd: options.openEnd });
          return { id: event.id, x: box.x + box.width / 2, y: 0, weight: event.weight ?? 0 };
        }), { k: 1, distance: 11, epsilon: 0 });
      }
    }), `→ ${lanes.length} rows`);

    // The whole of it, which is what the wheel notch costs: the events
    // filtered to the neighbourhood, packed into rows, filed into them and
    // stacked. The brief asks for this under 100 ms.
    row(`the notch, a ${span}-year band`, measure(() => {
      const inside = events.filter((e) => overlaps(e.when, margin));
      const rows_ = rowLanes(inside, scale, width, { ...options, affinity });
      const lists = new Map(rows_.map((lane) => [lane.id, []]));
      for (const event of inside) {
        const lane = laneOf(event, rows_);
        if (lane) lists.get(lane.id).push(event);
      }
      for (const [, list] of lists) {
        clusterPoints(list.map((event) => {
          const box = barBox(event, scale, { openEnd: options.openEnd });
          return { id: event.id, x: box.x + box.width / 2, y: 0, weight: event.weight ?? 0 };
        }), { k: 1, distance: 11, epsilon: 0 });
      }
    }), '');
  }
}

// The two traversals the views ask for on every state change: what an event
// led to by a year, and what else fed the event that is open. Both are
// answered once per view today — the map, the timeline and the graph — and
// the panel asks for a fourth and a fifth (health review A, finding 12).
//
// The heaviest node is chosen the way a reader chooses one: the earliest
// event, which is the one with the whole corpus downstream of it.
function benchQueries() {
  console.log('the queries at 20 000 events — what one state change asks of the graph');
  const events = syntheticEvents(20000, { seed: 20000905 });
  const edges = syntheticEdges(events);
  const adjacency = buildAdjacency(events, edges);
  const heaviest = [...events].sort((a, b) => a.when.start - b.when.start
    || (a.id < b.id ? -1 : 1))[0];
  const horizon = 1999;
  const reachable = reachableBy(adjacency, heaviest.id, horizon);
  row('reachableBy, the heaviest node', measure(() => {
    reachableBy(adjacency, heaviest.id, horizon);
  }), `→ ${reachable.length} events, ${edges.length} edges`);
  const converging = convergence(adjacency, events[events.length - 1].id, []);
  row('convergence, a late node', measure(() => {
    convergence(adjacency, events[events.length - 1].id, []);
  }), `→ ${converging.length} branches`);
  // What one state change costs when each asker walks the graph itself: the
  // map, the timeline and the graph view for the working set, and the panel
  // for the list it draws.
  row('one state change, four askers', measure(() => {
    for (let i = 0; i < 3; i += 1) {
      reachableBy(adjacency, heaviest.id, horizon);
      convergence(adjacency, heaviest.id, []);
    }
    reachableBy(adjacency, heaviest.id, horizon);
  }), '');
  // And what it costs through the two files the views actually go through,
  // which is where H4c put the answers. The same four asks; the graph is
  // walked once. The panel then reads the paths of the forty rows it lists,
  // which is what `pathTo` being lazy leaves to pay for.
  const fake = {
    adjacency,
    events: adjacency.events,
    extent: { min: 1400, max: 1999 },
  };
  // A state change that opens a different record, or moves the horizon year:
  // one walk, then three answers from the cache, then the panel's forty
  // paths. Five years past the end of the data, so every one of them is the
  // same answer and the cache — which holds four — has dropped each by the
  // time it comes round again.
  let n = 0;
  row('a new selection, memoised', measure(() => {
    const asked = { selected: heaviest.id, horizon: 1999 + (n % 5), from: null, to: null };
    n += 1;
    for (let i = 0; i < 3; i += 1) {
      horizonSet(fake, asked);
      convergence(adjacency, heaviest.id, []);
    }
    let read = 0;
    for (const found of horizonResults(fake, asked).slice(0, SHOWN)) {
      if (found.disputed || found.first) read += found.edges.length;
    }
    if (read < 0) throw new Error('unreachable');
  }), '→ walked once, read forty');
  const state = { selected: heaviest.id, horizon: 1999, from: null, to: null };
  row('the same selection, memoised', measure(() => {
    for (let i = 0; i < 3; i += 1) {
      horizonSet(fake, state);
      convergence(adjacency, heaviest.id, []);
    }
    // The panel's forty rows, whose paths are what the lazy `pathTo` still
    // owes. Counted so the reads cannot be optimised away.
    let read = 0;
    for (const found of horizonResults(fake, state).slice(0, SHOWN)) {
      if (found.disputed || found.first) read += found.edges.length;
    }
    if (read < 0) throw new Error('unreachable');
  }), '→ answered once, then read');
}

// The search scan, per keystroke, on the main thread. The threshold the
// brief names is 50 ms at 20 000 events: past it the scan goes to a thread
// of its own, and under it a Worker would cost more than it saves.
function benchSearch() {
  console.log('search — one keystroke, over a corpus of 20 000 events');
  const events = syntheticEvents(20000, { seed: 20000905 });
  // The shard is not events alone: an actor, a place and a source are each an
  // entry, and an actor's variants are terms of their own. The proportions
  // are this dataset's, scaled — one place per eight placed events, an actor
  // per thirty events, a source per ten.
  const places = [...new Set(events.map((e) => e.placeId).filter(Boolean))]
    .map((id, i) => ({ id, name: `Place ${i}`, names: [`Place ${i}`, `Praça ${i}`], status: 'active' }));
  const actors = Array.from({ length: Math.round(events.length / 30) }, (_, i) => ({
    id: `a${i}`, name: `Actor ${i}`, names: [`Actor ${i}`, `A${i}`], actorType: 'state', status: 'active',
  }));
  const sources = Array.from({ length: Math.round(events.length / 10) }, (_, i) => ({
    id: `s${i}`, title: `A source about the ${i}th thing`, creators: [`Author ${i}`], year: 1900, status: 'active',
  }));
  const entries = buildSearchIndex({ events, actors, places, sources });
  for (const query of ['e', 'ev', 'event 1', 'zzz']) {
    row(`the scan, "${query}"`, measure(() => {
      search(entries, query, { limit: 8 });
    }), `→ ${search(entries, query, { limit: 8 }).total} matches of ${entries.length}`);
  }
}

const CASES = {
  cluster: benchCluster,
  notch: benchNotch,
  presences: benchPresences,
  timeline: benchTimeline,
  queries: benchQueries,
  search: benchSearch,
};

// The atlas off disk, for the cases that measure the real dataset rather than
// a generated one. Built once, and only when a chosen case wants it.
async function realAtlas() {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const { loadAtlas } = await import('../../src/data.js');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  return loadAtlas({
    dataRoot: 'data/',
    fetchJson: async (url) => JSON.parse(await readFile(path.join(root, url.split('?')[0]), 'utf8')),
  });
}
const NEEDS_ATLAS = new Set(['presences']);

const wanted = process.argv.slice(2);
const chosen = wanted.length ? wanted : Object.keys(CASES);
const atlas = chosen.some((name) => NEEDS_ATLAS.has(name)) ? await realAtlas() : null;
for (const name of chosen) {
  const run = CASES[name];
  if (!run) {
    console.error(`no such case: ${name} (have: ${Object.keys(CASES).join(', ')})`);
    process.exitCode = 1;
    continue;
  }
  run(atlas);
  console.log('');
}

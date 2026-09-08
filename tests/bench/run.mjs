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

import { pathToFileURL } from 'node:url';
import { clusterPoints, DEEPEST_ZOOM } from '../../src/cluster.js';
import { onScreen } from '../../src/map/layers/events.js';
import { fitBounds, WORLD } from '../../src/map/projection.js';
import { rowLanes, laneOf, barBox } from '../../src/lanes.js';
import { createLinearScale } from '../../src/timeline-scale.js';
import { overlaps, withMargin } from '../../src/util/window.js';
import { buildAdjacency, reachableBy, convergence } from '../../src/graph.js';
import { layoutGraph, stackLayout } from '../../src/graph-view/layout.js';
import { horizonSet, horizonResults, SHOWN } from '../../src/horizon.js';
import { buildSearchIndex, search } from '../../src/search.js';
import { pickerIndex } from '../../src/contribute/picker.js';
import { buildQueue, filterQueue, sortQueue, flagCounts, toolCounts, degreesOf } from '../../src/review/queue.js';
import { windowOf } from '../../src/review/list.js';

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
// `reach` caps how far ahead a link may go, in events. The default reaches
// anywhere later, which is what the queries want — a large downstream from an
// early event. The graph's arrangement wants the other shape: a picture whose
// links are local, which is what H4b measured against (deviation 240,
// "mostly-nearby links forward in time"), and what `benchLayout` asks for.
export function syntheticEdges(events, { seed = 15801415, perEvent = 1.5, reach = Infinity } = {}) {
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
      const far = Math.max(1, Math.min(reach, byYear.length - i - 1));
      const ahead = 1 + Math.floor(random() ** 3 * far);
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
async function benchPresences(atlas) {
  // The presence metadata is its own file since I1 and the atlas answers
  // emptily until it lands (data.js, D1). `realAtlas()` fetches off disk, so
  // this is the same list it always measured, one read later.
  await atlas.loadPresences();
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

// The reference picker's keystroke, minus the drawing: the scan over one
// kind's entries and the year, place and degree looked up for the eight rows
// that come back. What this replaced was a `<select>` of every record in the
// atlas, refilled per keystroke — 41,036 options and 1.16 s per key at this
// size (health review B, finding 6). The drawing is the other half and is
// measured where it happens, in tests/contribute-browser.test.mjs, which
// holds the whole keystroke under 100 ms in a real browser.
function benchPicker() {
  console.log('the reference picker — one keystroke, over 20 000 events');
  const events = syntheticEvents(20000, { seed: 20000905 });
  const places = [...new Set(events.map((e) => e.placeId).filter(Boolean))]
    .map((id, i) => ({ id, name: `Place ${i}`, names: [`Place ${i}`], status: 'active' }));
  // One and a half edges per event, which is this dataset's own density: the
  // degree beside a hit is counted off them.
  const edges = syntheticEdges(events).map((e) => ({ ...e, status: 'active' }));
  const index = pickerIndex({ topology: { events, edges, places, actors: [], sources: [] } });
  // The first keystroke pays for the grouping and the degree table; the ones
  // after it are what a contributor spends most of their typing on. Both are
  // reported, because the first is the one a form is judged by.
  const cold = pickerIndex({ topology: { events, edges, places, actors: [], sources: [] } });
  const scan = (idx, query) => {
    const rows = search(idx.entriesOf('events'), query, { limit: 8 }).groups.flatMap((g) => g.items);
    for (const row of rows) idx.describe(row);
    return rows.length;
  };
  const first = performance.now();
  const found = scan(cold, 'e');
  row('the first keystroke, indexes cold', { best: performance.now() - first, runs: 1 }, `→ ${found} rows`);
  for (const query of ['e', 'ev', 'event 1']) {
    row(`the scan and the rows, "${query}"`, measure(() => scan(index, query)), `→ ${search(index.entriesOf('events'), query, { limit: 8 }).total} matches`);
  }
}


// The review dashboard's list at twenty thousand drafts: what it costs to
// build the model once, and what a keystroke in the search box costs after
// that. The brief's thresholds are 500 ms and 50 ms.
//
// What is not here is the drawing, which is the half that used to be all of
// the cost: every row of the queue was in the DOM and every one of them was
// rebuilt per key — 30,543 rows and 461 ms (health review B, finding 7).
// Only the rows in the window are made now, and how many that is comes out
// of `windowOf` below; the drawing itself is measured in a real browser, in
// tests/review-browser.test.mjs.
function benchList() {
  console.log('the review list — 20 000 drafts, the model and one keystroke');
  const events = syntheticEvents(20000, { seed: 20000905 });
  const edges = syntheticEdges(events);
  const degrees = degreesOf({ events, edges, sources: [], actors: [], places: [], relations: [], narratives: [], presences: [] });
  // The digests as the index writes them: a draft envelope, the fields the
  // list reads, and the degree counted off the atlas.
  const flags = ['imported-facts', 'contributed', 'no-identifier'];
  const tools = ['wikidata', 'cshapes', 'form', null];
  const digests = events.map((event, i) => ({
    kind: 'event',
    id: event.id,
    title: event.title,
    status: 'active',
    created: `2026-0${(i % 9) + 1}-01`,
    revised: `2026-0${(i % 9) + 1}-0${(i % 8) + 1}`,
    degree: degrees.get(`event:${event.id}`) ?? 0,
    ...(i % 3 === 0 ? { origin: { tool: tools[i % 4], on: '2026-09-01' } } : {}),
    review: {
      status: 'draft',
      ...(i % 5 === 0 ? { flags: [flags[i % 3]] } : {}),
      ...(i % 97 === 0 ? { claimedBy: { name: 'A Reviewer', github: null, on: '2026-09-05' } } : {}),
    },
  }));
  // One warning per twentieth record, which is about the share the validator
  // reports on the real dataset.
  const warnings = digests.filter((_, i) => i % 20 === 0)
    .map((d) => ({ id: d.id, kind: 'event', rule: 'degree-zero', message: 'event has no edges' }));

  let queue = [];
  row('the model, from the shard', measure(() => {
    queue = buildQueue(digests, { warnings });
  }), `→ ${digests.length} digests`);
  row('the chips: flags and writers', measure(() => {
    flagCounts(queue);
    toolCounts(queue);
  }), '');
  // What the pane draws at rest: the filtered, ordered model and the window
  // of rows the DOM has to hold.
  const view = { scrollTop: 0, viewport: 540, rowHeight: 54 };
  let shown = 0;
  row('first paint: order and window', measure(() => {
    const rows_ = sortQueue(filterQueue(queue, {}), 'kind');
    shown = windowOf({ ...view, count: rows_.length }).last;
  }), `→ ${shown} rows in the DOM, of ${queue.length}`);

  // A keystroke: the model is filtered again, ordered again, and one
  // screenful is made. Four letters, because the first narrows least.
  for (const [text, key] of [['e', 'kind'], ['ev', 'flags'], ['event 1', 'degree'], ['event 1234', 'age']]) {
    let count = 0;
    row(`a keystroke, "${text}" by ${key}`, measure(() => {
      const rows_ = sortQueue(filterQueue(queue, { text }), key);
      count = rows_.length;
      windowOf({ ...view, count });
    }), `→ ${count} match`);
  }
  // And the two filters a chip sets, which do not go through the text scan.
  row('a flag chip', measure(() => {
    const rows_ = sortQueue(filterQueue(queue, { flag: 'contributed' }), 'flags');
    windowOf({ ...view, count: rows_.length });
  }), `→ ${filterQueue(queue, { flag: 'contributed' }).length} match`);
  row('a writer chip', measure(() => {
    const rows_ = sortQueue(filterQueue(queue, { tool: 'wikidata' }), 'degree');
    windowOf({ ...view, count: rows_.length });
  }), `→ ${filterQueue(queue, { tool: 'wikidata' }).length} match`);
}

// The graph's own arrangement, at the three sizes H4b reported. It measured
// 109.8 → 45.5 ms on the atlas, 6.6 s → 0.65 s at 5 000 edges and 412.6 s →
// 4.5 s at 30 000, and the crossing counts on both sides of the sweep — 130
// of 201, 135 577 of 211 414, 563 335 of 768 548 — which are what say the
// prune is a prune and not a second metric. None of it could be reproduced
// from the repository: H4b measured with a scratch script left outside the
// tree (deviation 240) and there was no `layout` case (health review of
// 6 September, R4).
//
// The graph it measured against is described there and rebuilt here: events
// spread over two centuries, two edges each, pointing forward and mostly
// nearby — two hundred and fifty events ahead at the furthest. The crossing
// counts come out within a tenth of H4b's at both sizes, which is what makes a
// later run comparable; the milliseconds are this machine's, and no two
// machines agree on those.
function layoutCorpus(events, { edges: wanted, seed = 20260905 } = {}) {
  const FROM = 1800;
  const CENTURIES = 200;
  const list = syntheticEvents(events, { seed })
    .map((event, i) => ({ ...event, when: { start: FROM + (i % CENTURIES), end: FROM + (i % CENTURIES) } }));
  return {
    events: list,
    edges: syntheticEdges(list, { perEvent: 2, reach: 250 }).slice(0, wanted),
    lanes: [],
    extent: { min: FROM, max: FROM + CENTURIES - 1 },
  };
}

function benchLayout(atlas) {
  console.log('layoutGraph — the arrangement (H4b: 45.5 ms at 161 edges, 0.65 s at 5 000, 4.5 s at 30 000)');

  // The atlas itself, through the spine, which is the 161-edge row.
  if (atlas) {
    const events = atlas.activeEvents;
    const edges = [...atlas.edges.values()].filter((e) => e.status === 'active');
    const input = {
      events, edges, lanes: [], extent: atlas.extent,
    };
    const laid = layoutGraph(input);
    row(`the atlas (${events.length} events, ${edges.length} edges)`, measure(() => layoutGraph(input)),
      `→ ${laid.crossings} of ${laid.naiveCrossings} crossings`);
  }

  for (const [events, edges] of [[2500, 5000], [15000, 30000]]) {
    const input = layoutCorpus(events, { edges });
    const laid = layoutGraph(input);
    row(`${input.edges.length} edges over ${events} events`,
      measure(() => layoutGraph(input), { budget: 2000, most: 3 }),
      `→ ${laid.crossings} of ${laid.naiveCrossings} crossings`);
  }

  // And the band the reader is actually looking at, which is what H4b's
  // restriction was for: twenty years of the same corpus, not the whole of it.
  const whole = layoutCorpus(20000, { edges: 40000 });
  const from = whole.extent.min + Math.round((whole.extent.max - whole.extent.min) / 2);
  const band = whole.events.filter((e) => e.when.start >= from && e.when.start <= from + 20);
  const inBand = new Set(band.map((e) => e.id));
  const bandEdges = whole.edges.filter((e) => inBand.has(e.from) && inBand.has(e.to));
  const banded = { ...whole, events: band, edges: bandEdges };
  row(`a twenty-year band of ${whole.events.length} events`, measure(() => layoutGraph(banded), { budget: 2000, most: 3 }),
    `→ ${band.length} events, ${bandEdges.length} edges`);

  // The stacking on top of it, which is what the view redraws on every zoom.
  const laidBand = layoutGraph(banded);
  for (const k of [1, 4]) {
    const stacked = stackLayout(laidBand, { k });
    row(`stackLayout on that band, k=${k}`, measure(() => stackLayout(laidBand, { k })),
      `→ ${stacked.nodes.length} marks for ${band.length} events`);
  }
}

// --- the tools -------------------------------------------------------------
//
// The three the health review timed and H4d is about: the cross-record rules
// alone, the index build, and the validator with --index, which used to do
// the whole job twice. The set is the seeded 20 000 events with 40 %
// tombstones (tests/bench/dataset.mjs) — the share that makes rule 11's
// inactive-record checks quadratic in the real data.
const TOOL_EVENTS = Number(process.env.BENCH_EVENTS ?? 20000);

// Same shape as measure(), for a case whose body has to await.
async function measureAsync(fn, { budget = 4000, most = 3 } = {}) {
  const runs = [];
  let spent = 0;
  while (runs.length < most && (runs.length === 0 || spent < budget)) {
    const started = performance.now();
    await fn();
    const took = performance.now() - started;
    runs.push(took);
    spent += took;
  }
  // The first run as well as the best: the palette is memoised on the hash of
  // its inputs, so a second build in one process is free and a cold one — the
  // deploy job, every time — is not. Reporting only the best would report the
  // number nobody gets.
  return { best: Math.min(...runs), runs: runs.length, first: runs[0] };
}

async function benchRules() {
  const { syntheticRecords } = await import('./dataset.mjs');
  const { buildTopology } = await import('../../src/validate/core.js');
  const { checkRules } = await import('../../src/validate/rules.js');
  const { readFile } = await import('node:fs/promises');
  const { ROOT } = await import('./dataset.mjs');
  const pathMod = await import('node:path');
  const regions = JSON.parse(await readFile(pathMod.join(ROOT, 'data', 'regions.json'), 'utf8'));

  console.log('checkRules — the cross-record rules alone, in memory');
  let atlas = null;
  for (const share of [0, 0.4]) {
    const records = syntheticRecords(TOOL_EVENTS, { tombstones: share });
    // Built once and outside the measurement: the topology is what the
    // rules are handed, not part of what they cost.
    const topology = buildTopology(records, regions);
    const result = measure(() => checkRules(records, topology), { budget: 2000, most: 3 });
    const { errors, warnings } = checkRules(records, topology);
    row(`${TOOL_EVENTS} events, ${Math.round(share * 100)} % tombstones`, result, `→ ${errors.length} errors, ${warnings.length} warnings`);
    if (share === 0.4) atlas = { records, topology };
  }
  // What the contribution form and the review editor do on every keystroke:
  // one record judged against the whole atlas. The universe is prebuilt
  // because a page builds it once (health review B, finding 27); the row
  // above it is the same call without one, which is what a page used to pay.
  const { buildUniverse } = await import('../../src/validate/rules.js');
  const one = [atlas.records.find((r) => r.kind === 'edge')];
  row('one record, universe built per call', measure(() => checkRules(one, atlas.topology)));
  const universe = buildUniverse(atlas.topology);
  row('one record, universe prebuilt', measure(() => checkRules(one, atlas.topology, { universe })));
}

async function benchBuildIndex(atlas, { dataset } = {}) {
  const { syntheticDataDir } = await import('./dataset.mjs');
  const { buildIndex } = await import('../../tools/build-index.mjs');
  const dir = await syntheticDataDir(TOOL_EVENTS, { under: dataset });
  console.log(`build-index — ${TOOL_EVENTS} events with 40 % tombstones, off disk (${dir})`);
  const built = await buildIndex(dir);
  row('the whole index, in memory', await measureAsync(() => buildIndex(dir)), `→ ${Object.keys(built.files).length} files`);
}

async function benchValidateIndex(atlas, { dataset } = {}) {
  const { syntheticDataDir } = await import('./dataset.mjs');
  const { runValidation, ROOT: TOOLS_ROOT } = await import('../../tools/validate.mjs');
  const pathMod = await import('node:path');
  const dir = await syntheticDataDir(TOOL_EVENTS, { under: dataset });
  console.log(`validate --index — the job deploy.yml runs on every push and serve.mjs used to run on every Save`);
  const cold = (result) => `→ first run ${ms(result.first)} ms`;
  const plain = await measureAsync(() => runValidation(dir));
  row(`${TOOL_EVENTS} events, no --index`, plain, cold(plain));
  const indexed = await measureAsync(() => runValidation(dir, { index: true }));
  row(`${TOOL_EVENTS} events, --index`, indexed, cold(indexed));
  const real = pathMod.join(TOOLS_ROOT, 'data');
  const { counts } = await runValidation(real);
  const onReal = await measureAsync(() => runValidation(real, { index: true }));
  row(`the real dataset (${counts.records} records), --index`, onReal, cold(onReal));
}

const CASES = {
  cluster: benchCluster,
  layout: benchLayout,
  notch: benchNotch,
  presences: benchPresences,
  timeline: benchTimeline,
  queries: benchQueries,
  search: benchSearch,
  picker: benchPicker,
  list: benchList,

  rules: benchRules,
  'build-index': benchBuildIndex,
  validate: benchValidateIndex,
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
const NEEDS_ATLAS = new Set(['presences', 'layout']);

// The two cases that measure the tools over a tree want one on disk — 62 657
// files
// at 20 000 events — and where it is written is the caller's to say:
// `--dataset <dir>`, or `ATLAS_BENCH_DATASET`. It used to be `os.tmpdir()`
// with no option and nothing to remove it (health review of 6 September, R4).
// Without one those cases say so and are skipped; the rest need no disk.
export const NEEDS_DATASET = new Set(['build-index', 'validate']);

export function parseArgs(argv) {
  const names = [];
  let dataset = process.env.ATLAS_BENCH_DATASET || null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dataset') { dataset = argv[i + 1] ?? null; i += 1; continue; }
    names.push(argv[i]);
  }
  return { names, dataset };
}

export async function main(argv = []) {
  const { names, dataset } = parseArgs(argv);
  const chosen = names.length ? names : Object.keys(CASES);
  const atlas = chosen.some((name) => NEEDS_ATLAS.has(name)) ? await realAtlas() : null;
  let status = 0;
  for (const name of chosen) {
    const run = CASES[name];
    if (!run) {
      console.error(`no such case: ${name} (have: ${Object.keys(CASES).join(', ')})`);
      status = 1;
      continue;
    }
    if (NEEDS_DATASET.has(name) && !dataset) {
      console.log(`${name} — skipped: it writes a synthetic atlas to disk. Say where:`);
      console.log('  node tests/bench/run.mjs --dataset /some/scratch/dir');
      console.log('');
      continue;
    }
    await run(atlas, { dataset });
    console.log('');
  }
  return status;
}

// Importing this file runs nothing. It used to run every case at module top
// level, so `import { syntheticEvents } from './run.mjs'` cost a minute and a
// half and 1.25 GB as a side effect (health review of 6 September, R4).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

// M83, the half that needs no browser: the graph under a lens made readable.
//
// The owner, 22 September, with `docs/screens/owner-2026-09-22-graph-ww2.png`
// and World War II opened on the graph after M81: *"It's better but still a bit
// weird."* Four things (`docs/m83-brief.md`, amendment A1), and the three of
// them that are arithmetic are held here:
//
//   A1-1  a ring node whose own date falls outside the axis the lens is laid
//         out on is not drawn at all — it had nowhere honest to stand;
//   A1-2  a node stands where its **date** puts it and not where its year
//         does, so the parts of a six-year war spread along the axis instead
//         of stacking in seven columns;
//   A1-3  a column is resolved around the barycentres of its nodes rather than
//         spread from one edge of the field to the other, so a chain reads
//         left to right and no row of marks caps the picture.
//
// A1-4 is the key over the drawing and lives in `tests/m83-browser.test.mjs`
// with the rest of what only a browser can answer.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **No test here pins a count or a pixel.** Every assertion is the property —
// nothing outside the axis, more distinct positions than there are years, no
// two marks on one row at the edge — and never a number the next import would
// make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { arrangementOf } from '../src/graph-view/arrangement.js';
import {
  layoutGraph, timeAxis, stackLayout, MIN_ZOOM,
} from '../src/graph-view/layout.js';
import { workingSet } from '../src/emphasis.js';
import { lensView } from '../src/lens.js';
import { defaultState } from '../src/state.js';
import { centuryCounts } from '../src/util/window.js';
import { extent, startPoint } from '../src/util/dates.js';
import { parentsOf } from '../src/parts.js';
import { atlasOf, ROOT } from './helpers.mjs';

const atlas = await atlasOf(path.join(ROOT, 'data'));
const at = (patch = {}) => ({ ...defaultState(), ...patch });

// The picture the owner sent, and the one every assertion below is about. If
// the corpus ever loses it these tests have nothing to say and say so, rather
// than passing on an empty set.
const WAR = 'world-war-ii';

// The arrangement the graph would lay out for a state, and the layout it would
// make of it — the same two calls `graph-view.js` makes, with the same inputs,
// so that what is asserted here is what is drawn there.
function laidOut(state) {
  const { events, lanes, lens } = arrangementOf(atlas, state, null, workingSet(atlas, state).shown);
  const ids = new Set(events.map((e) => e.id));
  const axis = timeAxis(events, lens);
  return {
    axis,
    lens,
    layout: layoutGraph({
      events,
      edges: [...atlas.edges.values()].filter((e) => e.status === 'active' && ids.has(e.from) && ids.has(e.to)),
      lanes,
      extent: axis?.extent ?? atlas.extent,
      counts: centuryCounts(axis?.events ?? atlas.activeEvents),
    }),
  };
}

const war = () => at({ selected: WAR });

test('the corpus still holds the war this milestone is about', () => {
  const event = atlas.events.get(WAR);
  assert.ok(event && event.status === 'active', `${WAR} is in the atlas`);
  assert.ok(atlas.activeEvents.filter((e) => parentsOf(e).includes(WAR)).length > 3,
    'and it has parts inside it');
});

// --- A1-1: the ring stands where its own date puts it, or it is not drawn ---

test('A1-1: a ring node whose date falls outside the lens axis is not laid out', () => {
  const state = war();
  const view = lensView(atlas, state);
  assert.ok(view, 'the war opened is a lens');
  const { layout, axis } = laidOut(state);
  assert.ok(axis, 'the lens has an axis of its own');
  const outside = layout.nodes.filter((node) => !view.kept.has(node.id)
    && (node.year < axis.extent.min || node.year > axis.extent.max));
  assert.deepEqual(outside.map((n) => n.id), [],
    'no node the lens merely reaches stands off the axis it was laid out on');
});

test('A1-1: the ring the axis does hold is still drawn, so the lens keeps its context', () => {
  const state = war();
  const view = lensView(atlas, state);
  const { layout, axis } = laidOut(state);
  const ring = layout.nodes.filter((node) => !view.kept.has(node.id));
  assert.ok(ring.length > 0, 'the neighbours inside the war years are in the picture');
  for (const node of ring) {
    assert.ok(node.year >= axis.extent.min && node.year <= axis.extent.max,
      `${node.id} stands inside the axis`);
    assert.ok(view.near.has(node.id), `${node.id} is the lens's ring and is drawn faint`);
  }
});

test('A1-1: nothing is taken from the resting picture, which has no lens to be outside of', () => {
  const resting = laidOut(at({}));
  const { events } = arrangementOf(atlas, at({}), null, workingSet(atlas, at({})).shown);
  assert.equal(resting.layout.nodes.length, events.length,
    'every event the arrangement holds has a node at rest');
});

// --- A1-2: the axis is the date, not the year ------------------------------

test('A1-2: startPoint reads the day inside the year the record gives one for', () => {
  assert.equal(startPoint({ start: 1940, end: 1940 }), 1940, 'no date is the year itself');
  const early = startPoint({ start: 1940, end: 1940, date: '1940-01-01' });
  const late = startPoint({ start: 1940, end: 1940, date: '1940-12-31' });
  assert.ok(early < late, 'January stands before December');
  assert.ok(early >= 1940 && late < 1941, 'and both stand inside their own year');
});

test('A1-2: a date the year does not agree with is not read', () => {
  // `date` is the record's own display of its start; where it names another
  // year it is not the point this node stands at and the year stands instead.
  assert.equal(startPoint({ start: 1940, end: 1945, date: '1939-09-01' }), 1940);
});

test('A1-2: the war\'s parts do not stack in one column per year', () => {
  const { layout } = laidOut(war());
  const years = new Set(layout.nodes.map((n) => n.year));
  const columns = new Set(layout.nodes.map((n) => Math.round(n.x * 100)));
  assert.ok(years.size > 1, 'the war runs over several years');
  assert.ok(columns.size > years.size,
    `the parts stand on more positions (${columns.size}) than there are years (${years.size})`);
});

test('A1-2: two events of one year that happened on different days stand apart', () => {
  const { layout } = laidOut(war());
  const byYear = new Map();
  for (const node of layout.nodes) {
    if (!byYear.has(node.year)) byYear.set(node.year, []);
    byYear.get(node.year).push(node);
  }
  // The year with the most parts in it, which is the column the owner
  // photographed (`docs/screens/owner-2026-09-22-graph-column.png`).
  const [, crowd] = [...byYear].sort((a, b) => b[1].length - a[1].length)[0];
  assert.ok(crowd.length > 2, 'there is a crowded year to look at');
  const dated = crowd.filter((n) => startPoint(n.event.when) !== extent(n.event.when).min);
  assert.ok(dated.length > 1, 'and more than one of them carries a day');
  assert.ok(new Set(dated.map((n) => n.x)).size > 1,
    'events of the same year with different days do not share an x');
});

// --- A1-3: the vertical order is the barycentre, not the whole field --------

test('A1-3: no row of marks is pinned to the edge of the field', () => {
  const { layout } = laidOut(war());
  const band = layout.bands[0];
  // The extreme lines a node may be placed on, as the layout itself reports
  // them. A column spread evenly over the field put its first node on the top
  // line and its last on the bottom one whatever they wanted, so every column
  // of four or more left one mark on each — which is the row of hollow circles
  // the owner photographed. One node happening to want the edge is a node; a
  // row of them is the fault.
  const ys = layout.nodes.map((n) => n.y);
  const onTop = ys.filter((y) => Math.abs(y - band.top) < 0.5).length;
  const onBottom = ys.filter((y) => Math.abs(y - band.bottom) < 0.5).length;
  assert.ok(onTop <= 1, `at most one node stands on the top line, not ${onTop}`);
  assert.ok(onBottom <= 1, `at most one node stands on the bottom line, not ${onBottom}`);
});

test('A1-3: a node with one neighbour is drawn near it, not flung to the edge', () => {
  const { layout } = laidOut(war());
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const band = layout.bands[0];
  const height = band.y1 - band.y0;
  const spans = [];
  for (const line of layout.edges) {
    const from = byId.get(line.from);
    const to = byId.get(line.to);
    if (from && to) spans.push(Math.abs(from.y - to.y));
  }
  assert.ok(spans.length > 3, 'there are links to measure');
  const median = spans.sort((a, b) => a - b)[Math.floor(spans.length / 2)];
  assert.ok(median < height / 2,
    `the middling link crosses less than half the field (${median.toFixed(1)} of ${height})`);
});

test('A1-3: the arrangement is still the same every time it is asked for', () => {
  const one = laidOut(war()).layout;
  const other = laidOut(war()).layout;
  assert.deepEqual(one.nodes.map((n) => [n.id, n.x, n.y]), other.nodes.map((n) => [n.id, n.x, n.y]));
});

test('A1-3: and it is still never worse than doing nothing', () => {
  const { layout } = laidOut(war());
  assert.ok(layout.crossings <= layout.naiveCrossings,
    `${layout.crossings} crossings against the naive ${layout.naiveCrossings}`);
});

// --- what the packed column did not take away ------------------------------

test('the resting arrangement still merges lines at the zoom the graph floors at', () => {
  // A1-3 packs a column around its nodes' barycentres instead of dealing them
  // out over the field, which makes the picture compact — and a compact picture
  // is one the clusterer has work to do in. `tests/graph-browser` used to hold
  // this against a rendered page, which is a page at whatever zoom the camera
  // chose; the claim is about the arrangement, so it is made of the
  // arrangement, at `MIN_ZOOM`, which is as far out as the graph ever draws.
  const { layout } = laidOut(at({}));
  const stacked = stackLayout(layout, { k: MIN_ZOOM });
  assert.ok(stacked.nodes.length < layout.nodes.length,
    'the resting picture stacks marks that cannot be told apart');
  assert.ok(stacked.edges.some((line) => line.count > 1),
    'and merges the links between two stacks into one line');
});

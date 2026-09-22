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
import { layoutGraph, timeAxis } from '../src/graph-view/layout.js';
import { workingSet } from '../src/emphasis.js';
import { lensView } from '../src/lens.js';
import { defaultState } from '../src/state.js';
import { centuryCounts } from '../src/util/window.js';
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

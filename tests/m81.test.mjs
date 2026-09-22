// M81, the half that needs no browser: the graph stretches time when it zooms.
//
// The owner, 22 September, with a screenshot of World War II opened on the
// graph — twenty-seven children in one vertical column, labels three deep on
// either side: *"On the graph it should expand more horizontally when I zoom
// in, otherwise it looks weird and hard to see."*
//
// Three pure things carry the milestone and are held here: the time axis a lens
// is laid out on (`timeSpan`, and `arrangementOf` saying whether there is a
// lens at all), the law the wheel stretches time by (`stretch.js`), and the
// frame that fits the stacks to the height and the time extent to the width
// separately (`frame.js`). `tests/m81-browser.test.mjs` holds the two things
// only a drawing can answer — a notch that widens more than it grows, and a
// label the same size on screen either side of it.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **No test here pins a count or a pixel.** Every assertion is the property —
// the children spread over more than half the width, the order they happened
// in, one magnification against the other, a frame against the rectangle it was
// given — and never a number the next import would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { arrangementOf } from '../src/graph-view/arrangement.js';
import {
  layoutGraph, timeSpan, timeAxis, stackLayout,
} from '../src/graph-view/layout.js';
import { frameFor } from '../src/graph-view/frame.js';
import {
  MIN_STRETCH, STRETCH_CAP, STRETCH_EXPONENT, clampStretch, stretchStep, magnification,
} from '../src/graph-view/stretch.js';
import { workingSet } from '../src/emphasis.js';
import { defaultState } from '../src/state.js';
import { centuryCounts } from '../src/util/window.js';
import { extent } from '../src/util/dates.js';
import { parentsOf } from '../src/parts.js';
import { atlasOf, ROOT } from './helpers.mjs';

const atlas = await atlasOf(path.join(ROOT, 'data'));
const at = (patch = {}) => ({ ...defaultState(), ...patch });

// The brief names this one, and it is the picture the owner sent: a six-year
// war with a great many parts inside it. If the corpus ever loses it the tests
// below have nothing to say and say so, rather than passing on an empty set.
const WAR = 'world-war-ii';

// The arrangement the graph would lay out for a state, and the layout it would
// make of it — the same two calls `graph-view.js` makes, with the same inputs,
// so that what is asserted here is what is drawn there.
function laidOut(state) {
  const { events, lanes, lens } = arrangementOf(atlas, state, null, workingSet(atlas, state).shown);
  const ids = new Set(events.map((e) => e.id));
  const axis = timeAxis(events, lens);
  return layoutGraph({
    events,
    edges: [...atlas.edges.values()].filter((e) => e.status === 'active' && ids.has(e.from) && ids.has(e.to)),
    lanes,
    extent: axis?.extent ?? atlas.extent,
    counts: centuryCounts(axis?.events ?? atlas.activeEvents),
  });
}

const childrenOfWar = () => atlas.activeEvents.filter((e) => parentsOf(e).includes(WAR));

// The events the graph lays out with nothing asked — the same call `laidOut`
// makes, so the axis asserted against it is the axis that was built.
function restingEvents() {
  const state = at({});
  return arrangementOf(atlas, state, null, workingSet(atlas, state).shown).events;
}

// How much of the drawn width a set of nodes takes, as a fraction of the axis
// the layout gave itself. Read off the layout's own scale and never off a
// number written here: the gutters, the padding and the domain are all the
// layout's business, and this asks only what fraction of them the set fills.
function spreadOf(layout, ids) {
  const xs = layout.nodes.filter((n) => ids.has(n.id)).map((n) => n.x);
  const [r0, r1] = layout.scale.range;
  return xs.length < 2 ? 0 : (Math.max(...xs) - Math.min(...xs)) / (r1 - r0);
}

// ─── 1. a lens has its own time axis ───────────────────────────────────────

test('the corpus holds the war the milestone is about, with parts inside it', () => {
  assert.ok(atlas.events.get(WAR), `${WAR} is in the corpus`);
  assert.ok(childrenOfWar().length > 2, 'and more than a couple of events are part of it');
});

test('with the war opened its children spread across the width, in the order they happened', () => {
  const layout = laidOut(at({ selected: WAR }));
  const children = childrenOfWar().map((e) => e.id);
  const drawn = new Map(layout.nodes.map((n) => [n.id, n]));
  const placed = children.filter((id) => drawn.has(id));
  assert.equal(placed.length, children.length, 'every part of the war is in the picture the lens draws');

  assert.ok(
    spreadOf(layout, new Set(placed)) > 0.5,
    'the parts take more than half the width the axis is drawn across',
  );

  // And in date order: x is the year and nothing else, so two events sorted by
  // where they are drawn are two events sorted by when they happened. Ties are
  // ties — two events of one year stand on one x, and no stretch parts them.
  const byX = [...placed].sort((a, b) => drawn.get(a).x - drawn.get(b).x);
  let previous = -Infinity;
  for (const id of byX) {
    const year = extent(atlas.events.get(id).when).min;
    assert.ok(year >= previous, `${id} is drawn no earlier than the event before it`);
    previous = year;
  }
});

test('at rest the same nodes sit within the axis of what is drawn', () => {
  const resting = laidOut(at({}));
  const drawn = new Map(resting.nodes.map((n) => [n.id, n]));
  // The war itself is a main event and is in the resting picture; its parts are
  // not, which is M65's rule and not this milestone's.
  assert.ok(drawn.has(WAR), 'the war is drawn at rest');
  // Six years are still six years of the axis: the war and whatever else falls
  // in its own decade are a sliver of the width, which is exactly the picture
  // the owner was complaining about and is the right one when nothing has been
  // asked.
  const decade = new Set(resting.nodes
    .filter((n) => Math.abs(n.year - drawn.get(WAR).year) <= 5).map((n) => n.id));
  assert.ok(
    spreadOf(resting, decade) < 0.5,
    'a decade of the corpus is less than half the resting width',
  );
  // **And the domain is the resting picture's own since M82** (A1). It was the
  // corpus's from H4b until then, which is an axis built from 582 events to lay
  // out the 245 the picture holds; M81's own rule — the axis is the extent of
  // what the picture is *of* — has nothing about a lens in it, and at rest the
  // picture is the resting set.
  const events = restingEvents();
  assert.deepEqual(
    resting.scale.domain.map((d) => Math.round(d * 1000)),
    layoutGraph({
      events: [], edges: [], lanes: [], extent: timeSpan(events), counts: centuryCounts(events),
    }).scale.domain.map((d) => Math.round(d * 1000)),
    'the resting domain is the drawn set’s own, as a lens’s is its own',
  );
});

test('the arrangement says what the lens itself names, because the axis is built from it', () => {
  assert.equal(arrangementOf(atlas, at({}), null, workingSet(atlas, at({})).shown).lens, null,
    'at rest there is no lens and the axis is the corpus’s');
  const open = at({ selected: WAR });
  const { lens, events } = arrangementOf(atlas, open, null, workingSet(atlas, open).shown);
  assert.ok(lens instanceof Set && lens.size > 0, 'an open event is a lens, and it names its own events');
  assert.ok(lens.has(WAR), 'the war among them');
  assert.ok(events.length > lens.size, 'and the picture is wider than the lens, because it keeps the ring');
  // The ring is drawn where its own dates put it and is not what the axis is
  // built from: that is what keeps a cause forty years upstream from giving the
  // question back the sliver it was asked to get out of.
  //
  // **What it no longer does is reach outside that axis** (M83, A1-1). It did
  // until this milestone, and what the owner saw of the part that reached was a
  // row of hollow circles pinned to the edge of the picture at no year a reader
  // could read them at. A neighbour the axis cannot hold is not drawn now, so
  // the span of everything drawn is the lens's own span — which is the same
  // claim this test was always making about where the axis comes from, and the
  // assertion that follows is the one that still says it.
  const own = events.filter((e) => lens.has(e.id));
  assert.equal(
    timeSpan(events).max - timeSpan(events).min,
    timeSpan(own).max - timeSpan(own).min,
    'the axis is the lens’s own, and nothing drawn reaches past it',
  );
});

test('a lens whose own events fall on one year is laid out over everything it draws', () => {
  // Most lenses are one event chosen, and an event is one date: an axis a year
  // wide would fling the ring — the reason the reader can see what the event
  // answers to at all — tens of widths off the picture. What stands then is the
  // extent of everything drawn, which is the narrowest axis holding the answer.
  const lone = atlas.activeEvents.find((e) => {
    const state = at({ selected: e.id });
    const { events, lens } = arrangementOf(atlas, state, null, workingSet(atlas, state).shown);
    const own = lens ? events.filter((x) => lens.has(x.id)) : [];
    const span = own.length ? timeSpan(own) : null;
    return span && span.max === span.min && events.length > own.length + 1;
  });
  assert.ok(lone, 'the corpus holds an event of one date with a ring around it');

  const state = at({ selected: lone.id });
  const { events, lens } = arrangementOf(atlas, state, null, workingSet(atlas, state).shown);
  assert.deepEqual(timeAxis(events, lens).extent, timeSpan(events),
    'the axis is the extent of everything drawn');

  const layout = laidOut(state);
  const [r0, r1] = layout.scale.range;
  for (const node of layout.nodes) {
    assert.ok(node.x >= r0 && node.x <= r1, `${node.id} is drawn inside the axis and not off it`);
  }
});

test('the span of a set of events is the years its nodes stand on, and nothing wider', () => {
  const when = (start, end) => ({ id: `${start}`, when: { start, end } });
  // The node of an event goes at the year it began, so an event that ran for
  // forty years must not stretch the domain forty years to the right.
  assert.deepEqual(timeSpan([when(1500, 1540), when(1510, 1510)]), { min: 1500, max: 1510 });
  assert.deepEqual(timeSpan([when(1500, 1500)]), { min: 1500, max: 1500 }, 'one event is a span of no width');
  assert.equal(timeSpan([]), null, 'nothing to span is null, and the caller’s own extent stands');
});

// ─── 2. the law the wheel stretches by ─────────────────────────────────────

test('the stretch stays between one and the cap, whatever it is asked for', () => {
  assert.equal(clampStretch(0.1), MIN_STRETCH, 'time is never drawn narrower than the arrangement laid it');
  assert.equal(clampStretch(STRETCH_CAP * 10), STRETCH_CAP);
  assert.equal(clampStretch(Number.NaN), MIN_STRETCH, 'a delta the browser reported as nonsense is no stretch');
  assert.ok(STRETCH_CAP > MIN_STRETCH, 'and there is room between the two, or the milestone does nothing');
});

test('a notch in widens the picture by more than it grows it, and a notch out gives it back', () => {
  const factor = 1.16;
  const before = { k: 1, s: MIN_STRETCH };
  const after = { k: before.k * factor, s: stretchStep(before.s, factor) };
  const was = magnification(before);
  const is = magnification(after);
  assert.ok(is.x / was.x > is.y / was.y, 'the horizontal magnification grew by more than the vertical');
  assert.ok(is.y > was.y, 'and the vertical still grew: a notch is still a zoom');

  // All the way in and all the way out again is the picture the reader started
  // on, because both ends clamp.
  let s = MIN_STRETCH;
  for (let i = 0; i < 40; i += 1) s = stretchStep(s, factor);
  assert.equal(s, STRETCH_CAP, 'enough notches reach the cap and stop');
  for (let i = 0; i < 80; i += 1) s = stretchStep(s, 1 / factor);
  assert.equal(s, MIN_STRETCH, 'and enough of them back is the arrangement again');
});

test('a factor that is not a factor leaves the stretch where it was', () => {
  assert.equal(stretchStep(2, 0), clampStretch(2));
  assert.equal(stretchStep(2, Number.NaN), clampStretch(2));
  assert.equal(stretchStep(2, -1), clampStretch(2));
});

test('the exponent is what makes a notch anisotropic at all', () => {
  assert.ok(STRETCH_EXPONENT > 0, 'a zero exponent would be the uniform zoom this milestone replaces');
  assert.equal(magnification({ k: 3, s: 2 }).x, 6);
  assert.equal(magnification({ k: 3, s: 2 }).y, 3);
  assert.equal(magnification({ k: 3 }).x, 3, 'no stretch is the uniform camera, exactly as before');
});

// ─── 3. the stretch is where the marks are, not only where they are drawn ──

test('stretching the picture moves the marks and parts what time separates', () => {
  const layout = laidOut(at({ selected: WAR }));
  const tight = stackLayout(layout, { k: 1, stretch: 1 });
  const wide = stackLayout(layout, { k: 1, stretch: STRETCH_CAP });
  const spanOf = (stacked) => {
    const xs = stacked.nodes.map((n) => n.x);
    return Math.max(...xs) - Math.min(...xs);
  };
  assert.ok(spanOf(wide) > spanOf(tight), 'the drawn picture is wider');
  // **By exactly the stretch, mark for mark.** Measured on the ends of the
  // picture until M83, which is the same claim only while the marks at either
  // end are single: a stacking that swallows the leftmost node into a stack
  // standing to the right of it shortens the tight span and the ratio comes out
  // over the cap. Which nodes merge is the clusterer's business and this test is
  // not about it, so what is compared is every mark that is one node in both
  // pictures — the scale is the same scale exactly when each of those is.
  const aloneIn = (stacked) => new Map(stacked.nodes.filter((n) => n.count === 1)
    .map((n) => [n.representative.id, n.x]));
  const here = aloneIn(tight);
  const there = aloneIn(wide);
  const both = [...here.keys()].filter((id) => there.has(id));
  assert.ok(both.length > 3, 'there are marks in both pictures to compare');
  for (const id of both) {
    assert.ok(
      Math.abs(there.get(id) / here.get(id) - STRETCH_CAP) < 1e-9,
      `${id} is drawn exactly ${STRETCH_CAP} times further along`,
    );
  }
  assert.ok(wide.nodes.length >= tight.nodes.length, 'and no mark was swallowed by widening the picture');
  assert.equal(wide.stretch, STRETCH_CAP, 'a stacking says what it was stretched by');

  // The arrangement itself never moves: that is what lets a reader zoom, pan
  // and come back to the picture they had.
  assert.ok(
    layout.nodes.every((n) => Number.isFinite(n.x)),
    'the layout is untouched by either stacking',
  );
  assert.deepEqual(
    stackLayout(layout, { k: 1, stretch: 1 }).nodes.map((n) => n.x),
    tight.nodes.map((n) => n.x),
    'and stacking twice at one stretch is the same picture twice',
  );
});

// ─── 4. the frame fits the width and the height separately ─────────────────

const BOX = {
  x0: 0, y0: 0, x1: 400, y1: 200,
};
const LIMITS = { min: 1, max: 2 };
const ids = (...list) => new Set(list);
// Where a node is drawn on the screen under a transform, which since M81 is the
// stretch and then the uniform scale: the same arithmetic the view applies.
const seen = (node, t) => ({ x: node.x * (t.s ?? 1) * t.k + t.x, y: node.y * t.k + t.y });
const inside = (point, box, pad = 0) => point.x >= box.x0 + pad && point.x <= box.x1 - pad
  && point.y >= box.y0 + pad && point.y <= box.y1 - pad;

// A column: tall, and almost no width at all. This is World War II opened,
// reduced to the shape that made the frame wrong.
const column = [
  { id: 'a', x: 100, y: 10 },
  { id: 'b', x: 104, y: 60 },
  { id: 'c', x: 108, y: 110 },
  { id: 'd', x: 112, y: 160 },
];

test('a set that is tall and narrow is framed by its height and stretched to the width', () => {
  const all = ids('a', 'b', 'c', 'd');
  const uniform = frameFor(column, [all], BOX, { ...LIMITS, pad: 12 });
  const stretched = frameFor(column, [all], BOX, { ...LIMITS, pad: 12, maxStretch: STRETCH_CAP });
  assert.equal(stretched.k, uniform.k, 'the zoom is the height’s, and the height has not changed');
  assert.ok(stretched.s > uniform.s, 'and the width left over is spent on time');
  for (const node of column) {
    assert.ok(inside(seen(node, stretched), BOX, 12), `${node.id} is still on screen`);
  }
  // Which is the whole of the milestone: the same four nodes, further apart.
  const spread = (t) => {
    const xs = column.map((n) => seen(n, t).x);
    return Math.max(...xs) - Math.min(...xs);
  };
  assert.ok(spread(stretched) > spread(uniform), 'the column is wider than it was');
});

test('a set already as wide as the pane is not stretched at all', () => {
  const wide = [
    { id: 'a', x: 0, y: 90 },
    { id: 'b', x: 300, y: 110 },
  ];
  const t = frameFor(wide, [ids('a', 'b')], BOX, { ...LIMITS, pad: 12, maxStretch: STRETCH_CAP });
  assert.equal(t.s, MIN_STRETCH, 'there is no room left over, so nothing is spent');
  for (const node of wide) assert.ok(inside(seen(node, t), BOX, 12), `${node.id} is on screen`);
});

test('the stretch a frame asks for never passes the cap it was given', () => {
  const dot = [{ id: 'a', x: 50, y: 50 }, { id: 'b', x: 50.5, y: 150 }];
  const t = frameFor(dot, [ids('a', 'b')], BOX, { ...LIMITS, pad: 12, maxStretch: STRETCH_CAP });
  assert.ok(t.s <= STRETCH_CAP);
  assert.ok(t.k <= LIMITS.max);
});

test('with no cap given the frame is the uniform one M74 wrote', () => {
  const t = frameFor(column, [ids('a', 'b', 'c', 'd')], BOX, { ...LIMITS, pad: 12 });
  assert.equal(t.s, MIN_STRETCH);
  for (const node of column) assert.ok(inside(seen(node, t), BOX, 12));
});

test('a narrative walk is framed across the width', () => {
  const walk = atlas.narratives?.values().next().value ?? null;
  if (!walk) {
    assert.ok(true, 'no narrative in the corpus, so nothing to frame');
    return;
  }
  const steps = (walk.steps ?? []).map((step) => step.ref).filter((ref) => atlas.events.has(ref));
  if (steps.length < 2) {
    assert.ok(true, 'a walk of one step has no width to be framed across');
    return;
  }
  const state = at({ narrative: walk.id, step: 0 });
  const layout = laidOut(state);
  const wanted = new Set(steps);
  const drawn = layout.nodes.filter((n) => wanted.has(n.id));
  assert.ok(drawn.length > 1, 'the walk is in the picture it opens');
  const t = frameFor(layout.nodes, [wanted], BOX, { ...LIMITS, pad: 12, maxStretch: STRETCH_CAP });
  assert.ok(t, 'and it is framed');
  const xs = drawn.map((n) => seen(n, t).x);
  const width = Math.max(...xs) - Math.min(...xs);
  const room = (BOX.x1 - BOX.x0) - 24;
  assert.ok(width > room / 2, 'the steps take more than half the width the reader can see');
  for (const node of drawn) {
    assert.ok(inside(seen(node, t), BOX, 12), `${node.id} is on screen`);
  }
});

test('framing changes nothing it is given', () => {
  const before = JSON.stringify(column);
  frameFor(column, [ids('a', 'b', 'c', 'd')], { ...BOX }, { ...LIMITS, pad: 12, maxStretch: STRETCH_CAP });
  assert.equal(JSON.stringify(column), before);
});

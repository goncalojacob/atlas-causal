// M77's pure half: which marks on the graph are named and where each name
// goes (src/graph-view/labels.js), and the room a bar's title asks the
// timeline's packing for (src/lanes.js).
//
// Nothing here pins a count or a pixel. What is asserted is the rule — a name
// is drawn whole or not at all, a lens is named before anything else and in
// its own order, and a title never lands on its neighbour's — against
// geometry the test builds itself.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  placeOne, placeLabels, naming, lineHeight, movedAway, LENS_ROWS_AWAY,
} from '../src/graph-view/labels.js';
import { boxWidth, SLICE, halfLine } from '../src/graph-view/label-fit.js';
import { packRows, barBox } from '../src/lanes.js';
import { createLinearScale } from '../src/timeline-scale.js';

const VIEW = {
  x0: 0, y0: 0, x1: 600, y1: 400,
};
const AT = (x, y, key = `${x}:${y}`, weight = 0, id = key) => ({
  x, y, key, weight, representative: { id, weight },
});
const OPTIONS = { k: 1, gap: 9, view: VIEW };

// --- a name is drawn whole or not at all -----------------------------------

test('a name that fits is drawn entire, and never with an ellipsis', () => {
  const name = 'The carnation revolution';
  const found = placeOne(name, AT(100, 100), OPTIONS);
  assert.ok(found, 'there is room for it');
  assert.equal(found.text, name, 'the whole of it');
  assert.ok(!found.text.includes('…'));
});

test('a name with nowhere to go is not drawn at all, and is never cut', () => {
  // A mark hard against the right edge of the pane, with a name far wider
  // than the pane itself: there is no side and no line it fits on.
  const enormous = 'x'.repeat(4000);
  assert.equal(placeOne(enormous, AT(300, 200), { ...OPTIONS, capped: false }), null);
  // And the caller therefore has nothing to draw, rather than six letters.
  const placed = placeLabels([{ node: AT(300, 200), name: enormous }], { ...OPTIONS, capped: false });
  assert.deepEqual(placed, []);
});

test('the slice caps a label at rest and never inside a lens', () => {
  // A name wider than the share of the picture a label was allowed at the
  // world view (M61's `SLICE`). Room is not the question: the pane is empty.
  const long = 'y'.repeat(Math.ceil(SLICE / boxWidth(1, 1)) + 20);
  assert.ok(boxWidth(long.length, 1) > SLICE, 'wider than the slice');
  assert.equal(placeOne(long, AT(20, 200), { ...OPTIONS, capped: true }), null,
    'at rest a picture of everything keeps its air');
  const inside = placeOne(long, AT(20, 200), { ...OPTIONS, capped: false });
  assert.ok(inside, 'inside a lens the reader has asked, and is answered');
  assert.equal(inside.text, long, 'in full');
});

// --- where a name goes -----------------------------------------------------

test('a label takes its own line first, and a free one when its own is taken', () => {
  const a = AT(100, 200, 'a');
  // A second mark on the same line, close enough that the first label is in
  // the way on both sides.
  const b = AT(140, 200, 'b');
  const placed = placeLabels([
    { node: a, name: 'The first of two names' },
    { node: b, name: 'The second of two names' },
  ], { ...OPTIONS, rows: LENS_ROWS_AWAY, capped: false });
  assert.equal(placed.length, 2, 'both are drawn');
  for (const p of placed) assert.ok(!p.text.includes('…'), `${p.text} is whole`);
  // Two names that cannot both be written on the one line they share: at
  // least one of them goes to another, and whichever did is tied back to its
  // mark by the leader the drawing puts under it.
  const moved = placed.filter((p, i) => movedAway([a, b][i], p.rect, 1));
  assert.ok(moved.length >= 1, 'a label was written on another line');
  for (const [i, p] of placed.entries()) {
    // Whichever line it went to is a whole number of lines away, so labels
    // that moved are on lines and not scattered.
    const away = Math.abs(p.rect.y - [a, b][i].y) / lineHeight(1);
    assert.ok(Math.abs(away - Math.round(away)) < 1e-9, `a whole line away (${away})`);
  }
});

test('two labels never land on each other', () => {
  // Twelve marks along one line, tight enough that the room on that line is
  // nothing like enough for twelve names.
  const nodes = Array.from({ length: 12 }, (_, i) => AT(40 + i * 12, 200, `n${i}`));
  const placed = placeLabels(
    nodes.map((node, i) => ({ node, name: `A name of some length, number ${i}` })),
    { ...OPTIONS, rows: LENS_ROWS_AWAY, capped: false },
  );
  assert.ok(placed.length > 1, 'several are drawn');
  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i].rect;
      const b = placed[j].rect;
      const hits = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
      assert.equal(hits, false, `${placed[i].text} and ${placed[j].text} overlap`);
    }
  }
});

test('a label stays inside the rectangle the reader can see', () => {
  const placed = placeLabels([
    { node: AT(10, 20, 'left'), name: 'A name at the left edge' },
    { node: AT(590, 380, 'right'), name: 'A name at the right edge' },
  ], { ...OPTIONS, rows: LENS_ROWS_AWAY, capped: false });
  for (const p of placed) {
    assert.ok(p.rect.x0 >= VIEW.x0 && p.rect.x1 <= VIEW.x1, `${p.text} is inside the pane`);
    assert.ok(p.rect.y0 >= VIEW.y0 && p.rect.y1 <= VIEW.y1, `${p.text} is inside the pane`);
  }
});

test('a line of text is taller than the text in it', () => {
  for (const k of [0.5, 1, 2, 8]) {
    assert.ok(lineHeight(k) > halfLine(k) * 2, `two labels on neighbouring lines are clear at k=${k}`);
  }
});

// --- which marks are named -------------------------------------------------

test('at rest the heaviest marks on screen are named, and no more than the limit', () => {
  const nodes = [AT(0, 0, 'a', 1), AT(10, 0, 'b', 5), AT(20, 0, 'c', 3)];
  assert.deepEqual(naming(nodes, { limit: 2 }).map((n) => n.key), ['b', 'c']);
  assert.deepEqual(naming(nodes, { all: true }).map((n) => n.key), ['b', 'c', 'a']);
});

test('with a lens on, the lens is what is named and nothing else', () => {
  const nodes = [AT(0, 0, 'a', 1, 'alfa'), AT(10, 0, 'b', 9, 'beta'), AT(20, 0, 'c', 3, 'gamma')];
  const focus = new Set(['alfa', 'gamma']);
  const named = naming(nodes, { focus, limit: 1 });
  assert.deepEqual(named.map((n) => n.key).sort(), ['a', 'c'],
    'the ring is not named, however much it weighs');
  assert.equal(named.some((n) => n.key === 'b'), false);
});

test('a walk is named in the narrator\'s order, first step first', () => {
  const nodes = [AT(0, 0, 'a', 1, 'alfa'), AT(10, 0, 'b', 9, 'beta'), AT(20, 0, 'c', 3, 'gamma')];
  const focus = new Set(['alfa', 'beta', 'gamma']);
  assert.deepEqual(
    naming(nodes, { focus, order: ['gamma', 'alfa', 'beta'] }).map((n) => n.key),
    ['c', 'a', 'b'],
    'reading order, not weight order',
  );
  // With no order given it falls back to weight, which is what a lens that is
  // not a walk gets.
  assert.deepEqual(naming(nodes, { focus }).map((n) => n.key), ['b', 'c', 'a']);
});

// --- the timeline reserves the room a title needs --------------------------

test('the packing leaves room for a title beside every bar', () => {
  const scale = createLinearScale({ domain: [1900, 2000], range: [0, 1000] });
  const events = Array.from({ length: 12 }, (_, i) => ({
    id: `e${i}`,
    status: 'active',
    when: { start: 1900 + i, end: 1900 + i },
    title: `An event of the year ${1900 + i}`,
  }));
  const room = 120;
  const packed = packRows(events, scale, 1000, { gap: 4, extra: () => room });
  const byRow = new Map();
  for (const [id, row] of packed.rows) {
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row).push(id);
  }
  for (const [row, ids] of byRow) {
    const boxes = ids
      .map((id) => barBox(events.find((e) => e.id === id), scale, { openEnd: 2000 }))
      .sort((a, b) => a.x - b.x);
    for (let i = 1; i < boxes.length; i += 1) {
      assert.ok(boxes[i].x >= boxes[i - 1].x + boxes[i - 1].width + room,
        `row ${row}: the title of the bar at ${boxes[i - 1].x} reaches the bar at ${boxes[i].x}`);
    }
  }
  // And the same events with no room asked for pack into fewer rows, which is
  // what the room costs and why it has to be asked for.
  const tight = packRows(events, scale, 1000, { gap: 4 });
  assert.ok(tight.count < packed.count, `${tight.count} rows without the titles, ${packed.count} with`);
});

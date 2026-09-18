// What a graph label is cut to, on its own. The arithmetic is pure — the
// room, the slice and the side — so everything M61 is about can be asserted
// here, and the browser suite is left with the three questions only a browser
// can answer: the full name where there is room, nothing overlapping, and the
// size on screen holding still.
//
// Nothing here pins a character count or a count of labels. What is asserted
// is the shape of the rule: more room is more of the name, the same room at a
// closer zoom is more of the name, and a label stops where the next one
// starts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LABEL_CHARS, LABEL_SIZE, MIN_CHARS, SLICE, boxWidth, charWidth, charsFor, fitLabel, fitOn, labelBox,
  roomOn, shorten,
} from '../src/graph-view/label-fit.js';

// The pane the labels are placed in, wide enough that only what is put in it
// competes for room.
const BOX = { x0: 0, y0: 0, x1: 2000, y1: 1000 };
const GAP = 9.5;
const at = (x, y) => ({ x, y });
// A name longer than any room these tests give it, so that what comes back is
// always the cut and never the end of the name.
const LONG = 'The depopulation of indigenous peoples on the coast of Brazil';

test('the cut follows the room: more room is more of the name', () => {
  const near = fitOn(LONG, at(100, 100), true, { k: 1, gap: GAP, box: { ...BOX, x1: 200 } });
  const far = fitOn(LONG, at(100, 100), true, { k: 1, gap: GAP, box: { ...BOX, x1: 400 } });
  assert.ok(near.text.length < far.text.length, `${near.text.length} in the narrow pane, ${far.text.length} in the wide one`);
  // And both of them are cut, so the comparison is about the room and not
  // about one of them having run out of name.
  for (const fitted of [near, far]) assert.match(fitted.text, /…$/);
});

test('the same room at a closer zoom is more of the name', () => {
  const box = { ...BOX, x1: 400 };
  const world = fitOn(LONG, at(100, 100), true, { k: 1, gap: GAP, box });
  const closer = fitOn(LONG, at(100, 100), true, { k: 4, gap: GAP, box });
  assert.ok(closer.text.length > world.text.length, `${world.text.length} at the world view, ${closer.text.length} zoomed in`);
});

test('where the name fits, the whole name is drawn and there is no ellipsis', () => {
  const name = 'Independence of Angola';
  // Zoomed in, with the pane to itself: the room is the whole of it.
  const fitted = fitOn(name, at(100, 100), true, { k: 8, gap: GAP, box: BOX });
  assert.equal(fitted.text, name);
  assert.doesNotMatch(fitted.text, /…/);
});

test('a label never takes more of the picture than it did at the world view', () => {
  // A node alone in a pane with no edge near it: the room is enormous and the
  // slice is what answers.
  const alone = at(100, 100);
  for (const k of [1, 2, 4, 8]) {
    const room = roomOn(alone, true, { k, gap: GAP, box: { x0: 0, y0: 0, x1: 100000, y1: 1000 } });
    const chars = charsFor(room, k);
    assert.equal(chars, charsFor(Infinity, k), `at k = ${k} the slice is what binds and not the pane`);
    // Which is the same width of the picture at every zoom, and more
    // characters the further in the reader is.
    assert.ok(boxWidth(chars, k) <= SLICE + 1e-9, `${boxWidth(chars, k)} of ${SLICE}`);
    assert.ok(boxWidth(chars + 1, k) > SLICE, 'and one more character would not fit in it');
  }
  // At the world view the slice is the cut it replaces, exactly.
  assert.equal(charsFor(Infinity, 1), LABEL_CHARS);
  const world = charsFor(Infinity, 1);
  assert.ok(charsFor(Infinity, 4) > world, 'and the closer zoom gets more of them');
});

test('at the world view the cut is never longer than the one it replaces', () => {
  // The old rule, which was a constant: whatever the room, k = 1 can never
  // buy more of the picture than the slice, and the slice is that constant.
  for (const room of [10, 100, 1000, 100000, Infinity]) {
    assert.ok(charsFor(room, 1) <= LABEL_CHARS, `room ${room}`);
  }
});

test('a label stops where the next one starts, on either side', () => {
  const placed = [labelBox(at(400, 100), 20, true, 1, GAP)];
  const right = fitOn(LONG, at(100, 100), true, { k: 1, gap: GAP, box: BOX, placed });
  assert.ok(right, 'there is room to the left of what is already there');
  assert.ok(right.rect.x1 <= placed[0].x0 + 1e-9, `${right.rect.x1} stops before ${placed[0].x0}`);

  // And the same from the other side: a label written leftwards stops where
  // the one already placed ends.
  const behind = [labelBox(at(100, 100), 20, true, 1, GAP)];
  const left = fitOn(LONG, at(400, 100), false, { k: 1, gap: GAP, box: BOX, placed: behind });
  assert.ok(left, 'and room to the right of it');
  assert.ok(left.rect.x0 >= behind[0].x1 - 1e-9, `${left.rect.x0} starts after ${behind[0].x1}`);
});

test('a label in another line of text is not in the way', () => {
  const node = at(100, 100);
  const beside = labelBox(at(120, 100), 30, true, 1, GAP);
  const below = labelBox(at(120, 300), 30, true, 1, GAP);
  assert.ok(roomOn(node, true, { k: 1, gap: GAP, box: BOX, placed: [below] })
    > roomOn(node, true, { k: 1, gap: GAP, box: BOX, placed: [beside] }),
    'the one in the same line is what shortens the label');
  assert.equal(
    roomOn(node, true, { k: 1, gap: GAP, box: BOX, placed: [below] }),
    roomOn(node, true, { k: 1, gap: GAP, box: BOX, placed: [] }),
    'and the one below costs it nothing at all',
  );
});

test('a side with no room is no label on that side, and the other side answers', () => {
  const node = at(100, 100);
  // Something already placed across the very point the text would start at.
  const placed = [labelBox(at(100, 100), 40, true, 1, GAP)];
  assert.equal(fitOn(LONG, node, true, { k: 1, gap: GAP, box: BOX, placed }), null);
  const chosen = fitLabel(LONG, node, { k: 1, gap: GAP, box: BOX, placed });
  assert.ok(chosen, 'the left is free and is where it goes');
  assert.equal(chosen.right, false);
});

test('neither side with room is no label at all', () => {
  const node = at(100, 100);
  // One label already in this line on each side, both of them closer to the
  // mark than the text of a label could start.
  const placed = [
    { x0: 105, x1: 400, y0: 95, y1: 105 },
    { x0: -400, x1: 95, y0: 95, y1: 105 },
  ];
  assert.equal(fitLabel(LONG, node, { k: 1, gap: GAP, box: BOX, placed }), null);
});

test('the right is where a label goes unless the left shows more of the name', () => {
  const node = at(1000, 100);
  // Nothing in the way: the right, as it always was.
  assert.equal(fitLabel(LONG, node, { k: 1, gap: GAP, box: BOX }).right, true);
  // The right cramped and the left open: the reader gets more of the name.
  const cramped = [labelBox(at(1000 + 12 * charWidth(1), 100), 40, true, 1, GAP)];
  const flipped = fitLabel(LONG, node, { k: 1, gap: GAP, box: BOX, placed: cramped });
  assert.equal(flipped.right, false);
  assert.ok(flipped.text.length > fitOn(LONG, node, true, { k: 1, gap: GAP, box: BOX, placed: cramped }).text.length);
});

test('a label stops before a mark that is going to be named, so that mark keeps its own name', () => {
  const node = at(100, 100);
  // Close enough that the long name would have run straight over its mark.
  const neighbour = at(250, 100);
  const alone = fitOn(LONG, node, true, { k: 1, gap: GAP, box: BOX });
  const beside = fitOn(LONG, node, true, { k: 1, gap: GAP, box: BOX, named: [node, neighbour] });
  assert.ok(beside.text.length < alone.text.length, 'the long name gives way');
  // And what it gives way to is the room the neighbour writes from: its own
  // label, placed after this one, still has a side to be written on.
  const placed = [beside.rect];
  const theirs = fitOn('Independence of Angola', neighbour, true, { k: 1, gap: GAP, box: BOX, placed, named: [node, neighbour] });
  assert.ok(theirs, 'the neighbour is named too');
  assert.equal(theirs.text, 'Independence of Angola');
});

test('the pane edge is room, and a label written at it is not one that runs off it', () => {
  const box = { x0: 0, y0: 0, x1: 300, y1: 1000 };
  const fitted = fitOn(LONG, at(200, 100), true, { k: 1, gap: GAP, box });
  assert.ok(fitted.rect.x1 <= box.x1 + 1e-9, `${fitted.rect.x1} inside ${box.x1}`);
});

test('the box is made of the text that is drawn, not of the room it was given', () => {
  const name = 'World War I';
  const fitted = fitOn(name, at(100, 100), true, { k: 1, gap: GAP, box: BOX });
  assert.equal(fitted.text, name);
  assert.ok(Math.abs((fitted.rect.x1 - fitted.rect.x0) - boxWidth(name.length, 1)) < 1e-9);
  // And the box is wider than the letters are said to be, never narrower:
  // the slack is what keeps a name of capitals off the next one.
  assert.ok(fitted.rect.x1 - fitted.rect.x0 > name.length * charWidth(1));
});

test('the line the room is measured in is the height of the text on screen', () => {
  // Two nodes a fixed distance apart vertically: at a close enough zoom they
  // are no longer in the same line of text, because the text is smaller in
  // the picture's units, and the room stops being shared.
  const node = at(100, 100);
  const beside = (k) => [labelBox(at(120, 100 + LABEL_SIZE), 30, true, k, GAP)];
  assert.ok(roomOn(node, true, { k: 1, gap: GAP, box: BOX, placed: beside(1) })
    < roomOn(node, true, { k: 8, gap: GAP, box: BOX, placed: beside(8) }));
});

test('shorten counts the ellipsis, and leaves a name that fits alone', () => {
  assert.equal(shorten('Treaty of Rome', 20), 'Treaty of Rome');
  const cut = shorten('Treaty of Rome', 8);
  // Never longer than it was allowed, and shorter when the letter it would
  // have ended on was a space.
  assert.ok(cut.length <= 8, cut);
  assert.match(cut, /…$/);
});

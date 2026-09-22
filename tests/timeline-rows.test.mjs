// How tall a row of the timeline is, which since I6 is a question about the
// pane and not a constant.
//
// **And how many there are is no longer a question at all** (M77). It was:
// twenty packed rows at the 14 px floor plus the axis want 338 px, the pane a
// 900 px window leaves is 269, and the drawing took as many rows as it could
// fit and stacked the rest behind `+n` badges (`lanesThatFit`, index2 plan
// D10). The owner asked for every bar to carry its title, so there is no
// ceiling to compute: the rows are as many as the titles need and the pane
// scrolls. `lanesThatFit` went with the ceiling, and the two kinds of row —
// a packed one and a named lane — are one kind now, because there are no
// named lanes.
//
// The drawing itself is asserted in a real browser, where a pane has a
// height: tests/timeline-browser.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { laneHeightFor, ROW_LIMITS } from '../src/timeline.js';

const { AXIS_HEIGHT, ROW_HEIGHT, LANE_MAX } = ROW_LIMITS;

// One kind of row, with the height it would settle for and the floor it may
// be squeezed to. They are the same number since M77: a row carries a title,
// and a title is not something the timeline may squeeze away.
const ROW = { natural: ROW_HEIGHT, minimum: ROW_HEIGHT };

// M60 gave the timeline a whole view and its rows were still sized for the
// strip it used to be: twenty of them at 22 px under a 795 px pane, and a band
// of empty ground under the bottom one. The rule grows them into the room now,
// and stops at a cap so that three rows in a tall window are three rows and
// not three stripes (docs/m66-rows.md).
test('a row grows into the room going spare, as far as the cap', () => {
  assert.ok(LANE_MAX > ROW.natural, 'the cap is above what a row settles for');

  // Room going spare: the row takes it rather than leaving it under the
  // bottom one, and stops at the cap.
  const roomy = AXIS_HEIGHT + 20 * (LANE_MAX + 10);
  assert.equal(laneHeightFor(roomy, 20, ROW), LANE_MAX, 'a row stops at the cap');

  // Room for more than it would settle for and less than the cap: all of it.
  const between = (ROW.natural + LANE_MAX) / 2;
  assert.equal(laneHeightFor(AXIS_HEIGHT + 10 * between, 10, ROW), between,
    'a row takes the room where the room is under the cap');

  // A pane that has measured nothing is not a pane with no room in it.
  for (const nothing of [0, null, undefined, -50, AXIS_HEIGHT]) {
    assert.equal(laneHeightFor(nothing, 10, ROW), ROW.natural, `${nothing} is not a measurement`);
  }
  assert.equal(laneHeightFor(1000, 0, ROW), ROW.natural, 'nor is a drawing with no rows in it');
});

// The rule the titles need, and the one M77 changed: a row never goes below
// the height a title is legible in, however many rows there are. Where they do
// not fit the drawing is taller than its pane and the pane scrolls — a title
// never disappears to make room.
test('a row never shrinks below the height a title needs', () => {
  for (let rows = 1; rows <= 200; rows += 1) {
    for (const pane of [0, 120, 269, 480, 795, 900, 1400]) {
      const height = laneHeightFor(pane, rows, ROW);
      assert.ok(height >= ROW_HEIGHT, `${rows} rows in ${pane} px: ${height}`);
      assert.ok(height <= Math.max(LANE_MAX, ROW_HEIGHT), `${rows} rows in ${pane} px: ${height}`);
    }
  }
});

// How many lanes the timeline draws, which since I6 is a question about the
// pane and not a constant.
//
// Twenty packed rows at the 14 px floor plus the axis want 338 px; the pane a
// 900 px window leaves is 269. The drawing overflowed it, the bottom row was
// under the fold, and a window made shorter could not change a height that
// was already at the floor — which is why the owner's own "the timeline fits
// its pane" passed at fifteen rows and failed at the cap (index2 plan, D10;
// docs/index2/i6-brief.md §2). The rule is one exported function and this is
// what holds it; what `lanesFor` does with the cap it is handed is in
// tests/lanes.test.mjs, beside the rest of the lane rules.
//
// The drawing itself is asserted in a real browser, where a pane has a
// height: tests/timeline-browser.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lanesThatFit, laneHeightFor, ROW_LIMITS } from '../src/timeline.js';
import { LANE_CAP } from '../src/lanes.js';

const {
  AXIS_HEIGHT, MIN_ROW_HEIGHT, MIN_LANE_HEIGHT, MAX_ROWS, ROW_HEIGHT, LANE_HEIGHT, LANE_MAX,
} = ROW_LIMITS;

// The two kinds of row, each with the height it would settle for and the floor
// it may be squeezed to: a packed row carries no label, a named lane does.
const KINDS = [
  { what: 'a packed row', natural: ROW_HEIGHT, minimum: MIN_ROW_HEIGHT },
  { what: 'a named lane', natural: LANE_HEIGHT, minimum: MIN_LANE_HEIGHT },
];

test('the row count is what the pane holds at the floor, capped by the ceiling', () => {
  // The plan's own example, which is the pane a 900 px window leaves.
  assert.equal(lanesThatFit(269, MIN_ROW_HEIGHT, MAX_ROWS), 15, '269 px holds fifteen rows, not twenty');
  // Room for more than the ceiling: the ceiling is what it is for.
  assert.equal(lanesThatFit(AXIS_HEIGHT + MAX_ROWS * MIN_ROW_HEIGHT * 2, MIN_ROW_HEIGHT, MAX_ROWS), MAX_ROWS);
  // Exactly the room for the ceiling, and a pixel less.
  assert.equal(lanesThatFit(AXIS_HEIGHT + MAX_ROWS * MIN_ROW_HEIGHT, MIN_ROW_HEIGHT, MAX_ROWS), MAX_ROWS);
  assert.equal(lanesThatFit(AXIS_HEIGHT + MAX_ROWS * MIN_ROW_HEIGHT - 1, MIN_ROW_HEIGHT, MAX_ROWS), MAX_ROWS - 1);
  // A pane with no room for even one row still gets one: a timeline with no
  // lanes at all is not an honest answer to a short window, and the drawing
  // is never shorter than its pane anyway.
  assert.equal(lanesThatFit(AXIS_HEIGHT + 1, MIN_ROW_HEIGHT, MAX_ROWS), 1);
  assert.equal(lanesThatFit(AXIS_HEIGHT, MIN_ROW_HEIGHT, MAX_ROWS), MAX_ROWS, 'no room measured is no cap');
  // A pane that has not been laid out has measured nothing, and nothing is
  // capped: what this file did before the rule existed.
  for (const nothing of [0, null, undefined, -50]) {
    assert.equal(lanesThatFit(nothing, MIN_ROW_HEIGHT, MAX_ROWS), MAX_ROWS, `${nothing} is not a measurement`);
  }
});

test('every lane the rule allows fits under the axis at its own floor', () => {
  // The property the drawing rests on: `rows * floor <= room`, so the lanes
  // laid into `room / rows` are never squeezed below the floor and the
  // drawing is never taller than the pane. Both floors, over every pane
  // height from nothing to a tall window.
  for (const [floor, ceiling] of [[MIN_ROW_HEIGHT, MAX_ROWS], [MIN_LANE_HEIGHT, LANE_CAP]]) {
    for (let pane = 0; pane <= 900; pane += 1) {
      const rows = lanesThatFit(pane, floor, ceiling);
      const room = Math.max(0, pane - AXIS_HEIGHT);
      assert.ok(rows >= 1 && rows <= ceiling, `pane ${pane}: ${rows} lanes`);
      if (room >= floor) {
        assert.ok(rows * floor <= room, `pane ${pane}: ${rows} lanes of ${floor} in ${room}`);
        // And the height the drawing takes is the pane's, not more — the rule
        // itself, and not a second copy of it written out here.
        const kind = floor === MIN_ROW_HEIGHT ? KINDS[0] : KINDS[1];
        const laneHeight = laneHeightFor(pane, rows, kind);
        assert.ok(AXIS_HEIGHT + rows * laneHeight <= pane + 1e-9, `pane ${pane}: the drawing fits`);
        // Since M66 it is also the pane's and not less, unless the cap is what
        // stopped it: room left under the bottom row is room the rows could
        // have had.
        assert.ok(laneHeight === LANE_MAX || AXIS_HEIGHT + rows * laneHeight >= pane - 1e-9,
          `pane ${pane}: ${rows} rows of ${laneHeight} leave ${pane - AXIS_HEIGHT - rows * laneHeight} px unused`);
      }
    }
  }
});

// M60 gave the timeline a whole view and its rows were still sized for the
// strip it used to be: twenty of them at 22 px under a 795 px pane, and a band
// of empty ground under the bottom one. The rule grows them into the room now,
// and stops at a cap so that three lanes in a tall window are three lanes and
// not three stripes (docs/m66-rows.md).
test('a row grows into the room going spare, as far as the cap', () => {
  for (const kind of KINDS) {
    assert.ok(LANE_MAX > kind.natural, `the cap is above what ${kind.what} settles for`);

    // Room going spare: the row takes it rather than leaving it under the
    // bottom one, and stops at the cap.
    const roomy = AXIS_HEIGHT + MAX_ROWS * (LANE_MAX + 10);
    assert.equal(laneHeightFor(roomy, MAX_ROWS, kind), LANE_MAX, `${kind.what} stops at the cap`);

    // Room for more than it would settle for and less than the cap: all of it.
    const between = (kind.natural + LANE_MAX) / 2;
    assert.equal(laneHeightFor(AXIS_HEIGHT + 10 * between, 10, kind), between,
      `${kind.what} takes the room where the room is under the cap`);

    // Less room than it would settle for: squeezed, to its own floor and no
    // further. Past that the drawing is taller than the pane and the pane
    // scrolls, which is the rule I6 wrote and this milestone does not touch.
    assert.equal(laneHeightFor(AXIS_HEIGHT + 10 * (kind.minimum + 1), 10, kind), kind.minimum + 1,
      `${kind.what} shrinks to fit`);
    assert.equal(laneHeightFor(AXIS_HEIGHT + 10, 10, kind), kind.minimum,
      `${kind.what} stops at its floor`);

    // A pane that has measured nothing is not a pane with no room in it.
    for (const nothing of [0, null, undefined, -50, AXIS_HEIGHT]) {
      assert.equal(laneHeightFor(nothing, 10, kind), kind.natural, `${nothing} is not a measurement`);
    }
    assert.equal(laneHeightFor(1000, 0, kind), kind.natural, 'nor is a drawing with no rows in it');
  }
});

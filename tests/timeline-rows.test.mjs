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
import { lanesThatFit, ROW_LIMITS } from '../src/timeline.js';
import { LANE_CAP } from '../src/lanes.js';

const { AXIS_HEIGHT, MIN_ROW_HEIGHT, MIN_LANE_HEIGHT, MAX_ROWS } = ROW_LIMITS;

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
        // And the height the drawing takes is the pane's, not more.
        const laneHeight = Math.max(floor, Math.min(floor * 2, room / rows));
        assert.ok(AXIS_HEIGHT + rows * laneHeight <= pane + 1e-9, `pane ${pane}: the drawing fits`);
      }
    }
  }
});

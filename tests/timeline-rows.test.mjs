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
import { laneHeightFor, ROW_LIMITS, lanesFor } from '../src/timeline.js';
import { packRows } from '../src/lanes.js';

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

// --- the lanes are packed once per drawing ---------------------------------
//
// **One pack and not two** (M88 §9, the third review, finding B9). The cap was
// learned by packing once without it and then packing again with it — two
// sweeps over the whole corpus on every move of the band — and the second pack
// threw the title room away, which is a second reason titles collide past the
// cap. The cap is arithmetic about the pane and is known before any packing;
// `packRows` reports whether it bound.
//
// `lanesFor` is the seam: pure, and the drawing hands it the real packer.
test('the lanes are packed once, with the cap and the title room together', () => {
  const asked = [];
  const pack = (events, scale, width, options) => {
    asked.push(options);
    return { lanes: [], capped: false };
  };
  const packing = { gap: 4, openEnd: 2000, affinity: () => null };
  const titleRoom = { extra: () => 10, before: () => 0 };

  lanesFor([], () => 0, 1000, { packing, titleRoom, paneHeight: 800, pack });
  assert.equal(asked.length, 1, 'one pack per drawing');
  const [options] = asked;
  // Everything the drawing asked for, in one call: the packing's own rules,
  // the room each title needs, and the cap.
  assert.equal(options.gap, packing.gap);
  assert.equal(typeof options.extra, 'function', 'the title room is not dropped');
  assert.equal(typeof options.before, 'function');
  assert.ok(Number.isFinite(options.maxRows), 'and the cap is in the same call');
  // The cap is what the pane holds at the floor a row may not go below.
  assert.equal(options.maxRows, Math.max(1, Math.floor((800 - AXIS_HEIGHT) / ROW_HEIGHT)));

  // A pane that has measured nothing has no cap at all, which is M77's picture.
  asked.length = 0;
  lanesFor([], () => 0, 1000, { packing, titleRoom, paneHeight: 0, pack });
  assert.equal(asked[0].maxRows, Infinity);
});

// And the flag that replaced the second pack: a bar that had to share a row is
// what "past the cap" means, and it is what the drawing reads to decide
// whether a title is written wherever it fits or wherever it was packed.
test('packRows says whether the cap bound', () => {
  // Three bars that overlap each other, so each wants a row of its own.
  const events = [0, 1, 2].map((i) => ({ id: `e${i}`, when: { start: 1900, end: 1910 }, weight: i }));
  const scale = { x: (year) => (year - 1900) * 10 };
  const wide = packRows(events, scale, 1000, { openEnd: 1910 });
  assert.equal(wide.capped, false, 'with rows to spare nothing shares one');
  assert.equal(wide.count, events.length);

  const tight = packRows(events, scale, 1000, { openEnd: 1910, maxRows: 1 });
  assert.equal(tight.capped, true, 'with one row to give, the cap bound');
  assert.equal(tight.count, 1);
});

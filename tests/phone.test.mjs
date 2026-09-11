// The phone layout's decisions, without a DOM: what raises the sheet, and
// what a drag of its grip ends as. The arrangement itself is CSS and is
// checked in a real browser at a real phone size (tests/phone-browser).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHONE_WIDTH, PHONE_QUERY, DRAG_THRESHOLD, hasOpening, raisesSheet, afterDrag } from '../src/phone.js';

test('the breakpoint is one number and the query is written from it', () => {
  assert.equal(PHONE_WIDTH, 720);
  assert.equal(PHONE_QUERY, '(max-width: 720px)');
});

test('a card is open when any of the five openings is set', () => {
  assert.equal(hasOpening({}), false);
  assert.equal(hasOpening({ selected: null, actor: null }), false);
  assert.equal(hasOpening({ selected: 'carnation-revolution-1974' }), true);
  assert.equal(hasOpening({ source: 'maxwell-1995' }), true);
  assert.equal(hasOpening({ place: 'lisbon' }), true);
  assert.equal(hasOpening({ actor: 'portugal' }), true);
  assert.equal(hasOpening({ narrative: 'how-the-war-ended-the-regime' }), true);
  // A step with no narrative is not a card: it is a position inside one.
  assert.equal(hasOpening({ step: 3 }), false);
});

test('the sheet comes up when what is open changes to something', () => {
  assert.equal(raisesSheet({ selected: null }, { selected: 'a' }), true);
  assert.equal(raisesSheet({ selected: 'a' }, { selected: 'b' }), true);
  assert.equal(raisesSheet({ selected: 'a', actor: null }, { selected: null, actor: 'portugal' }), true);
  // Opening a narrative is opening something, so the sheet comes up once.
  assert.equal(raisesSheet({ narrative: null, step: 0 }, { narrative: 'n', step: 0 }), true);
});

// A step is not an opening on its own: it is a position inside the narrative
// that is already open, and the narrative's own text says the map, the graph
// and the timeline follow it. Raising the sheet at every arrow key covered
// the three pictures the reader was being told to watch (health review A,
// finding 32); from the first step on, the grip is the one control.
test('and not for a step inside the narrative already open', () => {
  assert.equal(raisesSheet({ narrative: 'n', step: 0 }, { narrative: 'n', step: 1 }), false);
  assert.equal(raisesSheet({ narrative: 'n', step: 4 }, { narrative: 'n', step: 3 }), false);
  // The selection, the walk and the window are derived from the step, so they
  // move with it; none of that is a new thing to open.
  assert.equal(raisesSheet(
    { narrative: 'n', step: 0, selected: 'a' },
    { narrative: 'n', step: 1, selected: 'b' },
  ), false);
  // Leaving one narrative for another is opening something.
  assert.equal(raisesSheet({ narrative: 'n', step: 3 }, { narrative: 'm', step: 0 }), true);
});

test('and stays where it is for everything that is not an opening', () => {
  // Closing the card: nothing to raise the sheet over.
  assert.equal(raisesSheet({ selected: 'a' }, { selected: null }), false);
  assert.equal(raisesSheet({}, {}), false);
  // Panning, zooming, the band, the layers, the grouping, the lens: the
  // reader is moving the picture and the panel must not jump over it.
  assert.equal(raisesSheet(
    { selected: 'a', from: 1900, bbox: null, group: 'none' },
    { selected: 'a', from: 1950, bbox: [1, 2, 3, 4], group: 'region' },
  ), false);
});

test('a drag of the grip decides by where it went, and a tap toggles', () => {
  // Open, dragged well down: closed.
  assert.equal(afterDrag(DRAG_THRESHOLD + 10, true), false);
  // Open, nudged down and let go: back up.
  assert.equal(afterDrag(20, true), true);
  // Down, dragged up: open.
  assert.equal(afterDrag(-(DRAG_THRESHOLD + 10), false), true);
  assert.equal(afterDrag(-20, false), false);
  // A press that never moved is a tap, and a tap toggles either way.
  assert.equal(afterDrag(0, false), true);
  assert.equal(afterDrag(0, true), false);
  assert.equal(afterDrag(3, true), false);
  // Dragging the wrong way never opens what is already open, or the reverse.
  assert.equal(afterDrag(-200, true), true);
  assert.equal(afterDrag(200, false), false);
});

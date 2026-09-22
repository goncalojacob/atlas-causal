// M74: where the camera starts, without a browser.
//
// `frame.js` is the whole of the milestone's arithmetic — the bounds of a set
// of nodes, and the transform that puts those bounds inside the rectangle the
// reader can see. It is pure, it knows nothing about a lens and nothing about
// the DOM, and that is what makes it testable here: the browser half
// (`tests/m74-browser.test.mjs`, and the graph's share of
// `tests/lens-browser.test.mjs`) asks whether the picture on the screen is the
// one this file computed.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **No test here pins a count** and none pins a pixel: every assertion is the
// property — the wanted nodes are inside the box, the zoom is between the
// limits, the widest set that fits is the one framed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boundsOf, frameFor } from '../src/graph-view/frame.js';

// A field 1000 × 500, and a pane that shows 400 × 200 of it: small enough
// that a set of nodes can be larger than what is on screen, which is the case
// the last two tests are about.
const BOX = {
  x0: 0, y0: 0, x1: 400, y1: 200,
};
const LIMITS = { min: 1, max: 2 };

const nodes = [
  { id: 'a', x: 10, y: 10 },
  { id: 'b', x: 120, y: 60 },
  { id: 'c', x: 180, y: 90 },
  { id: 'd', x: 900, y: 480 },
];
const ids = (...list) => new Set(list);

// Where a node is drawn on the screen, under a transform: the same arithmetic
// the viewport applies (`translate(x y) scale(k)`), written here so that the
// assertion is "the reader can see it" and not "the numbers are the ones I
// expected".
const at = (node, t) => ({ x: node.x * t.k + t.x, y: node.y * t.k + t.y });
const inside = (point, box, pad = 0) => point.x >= box.x0 + pad && point.x <= box.x1 - pad
  && point.y >= box.y0 + pad && point.y <= box.y1 - pad;

test('the bounds of a set of nodes are the bounds of the ones it names', () => {
  const bounds = boundsOf(nodes, ids('a', 'c'));
  assert.deepEqual(bounds, {
    x0: 10, y0: 10, x1: 180, y1: 90,
  });
  // An id the arrangement does not hold is not an error and not a point at
  // the origin: the lens is a set of records and the layout covers the band,
  // so a step outside the band is simply not one of the nodes to frame.
  assert.deepEqual(boundsOf(nodes, ids('a', 'c', 'nowhere')), bounds);
  assert.equal(boundsOf(nodes, ids('nowhere')), null, 'nothing to frame is null and not an empty box');
  assert.equal(boundsOf([], ids('a')), null);
  // One node has bounds of no size, which is a point and not a mistake.
  assert.deepEqual(boundsOf(nodes, ids('b')), {
    x0: 120, y0: 60, x1: 120, y1: 60,
  });
});

test('the frame puts every node of the wanted set inside the rectangle on screen', () => {
  const wanted = ids('a', 'b', 'c');
  const t = frameFor(nodes, [wanted], BOX, { ...LIMITS, pad: 12 });
  assert.ok(t, 'a set with nodes in the arrangement can be framed');
  for (const node of nodes.filter((n) => wanted.has(n.id))) {
    assert.ok(inside(at(node, t), BOX, 12), `${node.id} is on screen at ${JSON.stringify(at(node, t))}`);
  }
  // And centred on what was asked for, which is what makes it a frame of that
  // set rather than a zoom that happens to contain it.
  const bounds = boundsOf(nodes, wanted);
  const centre = at({ x: (bounds.x0 + bounds.x1) / 2, y: (bounds.y0 + bounds.y1) / 2 }, t);
  assert.ok(Math.abs(centre.x - (BOX.x0 + BOX.x1) / 2) < 1e-9);
  assert.ok(Math.abs(centre.y - (BOX.y0 + BOX.y1) / 2) < 1e-9);
});

test('the zoom stays between the limits, whatever the set asks for', () => {
  // A set of one asks for an infinite zoom and is given the cap: the reader
  // who opened one event is not thrown to the bottom of the well.
  const one = frameFor(nodes, [ids('b')], BOX, { ...LIMITS, pad: 12 });
  assert.equal(one.k, LIMITS.max);
  // A set larger than the screen asks for less than the floor and is given
  // the floor: the graph does not zoom out past the picture it has.
  const all = frameFor(nodes, [ids('a', 'd')], BOX, { ...LIMITS, pad: 12 });
  assert.equal(all.k, LIMITS.min);
});

test('the widest set that fits is the one framed, and the narrowest is the fallback', () => {
  const lens = ids('a', 'b', 'c', 'd');
  const focus = ids('a', 'b');
  const t = frameFor(nodes, [lens, focus], BOX, { ...LIMITS, pad: 12 });
  // The lens is far too wide for this pane, so the focus is what the camera
  // is put on — and it is on screen, which is the promise.
  for (const node of nodes.filter((n) => focus.has(n.id))) {
    assert.ok(inside(at(node, t), BOX, 12), `${node.id} is on screen`);
  }
  assert.ok(t.k > LIMITS.min, 'and the fallback is a frame and not the floor');

  // Where the wider set does fit, it is the one framed: an event chosen with
  // its ring is drawn with its ring, not alone.
  const near = ids('a', 'b', 'c');
  const wider = frameFor(nodes, [near, ids('b')], BOX, { ...LIMITS, pad: 12 });
  for (const node of nodes.filter((n) => near.has(n.id))) {
    assert.ok(inside(at(node, wider), BOX, 12), `${node.id} is on screen`);
  }
});

test('there is no frame where there is nothing to frame, and none where there is no room', () => {
  assert.equal(frameFor(nodes, [ids('nowhere')], BOX, { ...LIMITS, pad: 12 }), null);
  assert.equal(frameFor(nodes, [], BOX, { ...LIMITS, pad: 12 }), null);
  // A pane collapsed to nothing, or one narrower than the padding asks for:
  // there is no rectangle to put anything inside, and a frame computed from
  // it would be a division by zero dressed as an answer.
  assert.equal(frameFor(nodes, [ids('a', 'b')], { x0: 0, y0: 0, x1: 0, y1: 0 }, { ...LIMITS, pad: 12 }), null);
  assert.equal(frameFor(nodes, [ids('a', 'b')], BOX, { ...LIMITS, pad: 400 }), null);
});

test('framing changes nothing it is given', () => {
  const before = JSON.stringify(nodes);
  const box = { ...BOX };
  frameFor(nodes, [ids('a', 'b', 'c')], box, { ...LIMITS, pad: 12 });
  assert.equal(JSON.stringify(nodes), before, 'the arrangement is read and never moved');
  assert.deepEqual(box, BOX);
});

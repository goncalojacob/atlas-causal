// A drag of the band is one redraw per frame (M88 §9, the third review,
// finding B9).
//
// A pointer reports sixty to a hundred and twenty moves a second, and every
// one of them used to set the window. A set is a synchronous notification, and
// a notification is the map, the two bands, the timeline's whole packing, the
// masthead's count and the panel — so a drag across the band was a few hundred
// full redraws at 1,257 events, for the one picture the reader ends on.
//
// Pure: the gestures are bound to a stub element, the clock is a fake
// `requestAnimationFrame`, and what is counted is the number of times the
// store was written and what the last write said. Nothing about the store's
// own contract changes — `state.set` is synchronous and notifies
// synchronously; what is deferred is when this control calls it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindWindowGestures } from '../src/window-band.js';

// Just enough element for the gestures: listeners, a rectangle, and the
// pointer capture calls, which throw on a stub and are already guarded.
function stubElement() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatch(type, event) {
      for (const fn of listeners.get(type) ?? []) fn(event);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 40, right: 1000, bottom: 40 }),
    setPointerCapture() { throw new Error('no such pointer'); },
    releasePointerCapture() { throw new Error('already released'); },
  };
}

// A pointer event as the handlers read it: a target that answers `closest`,
// a client x, and a pointer id.
const pointer = (x, { handle = null } = {}) => ({
  clientX: x,
  pointerId: 1,
  target: { closest: (selector) => (selector === '[data-window]' && handle ? handle : null) },
  preventDefault() {},
});

const HANDLE = { getAttribute: (name) => (name === 'data-window' ? 'from' : null), focus() {} };

// Years to pixels over a thousand-pixel band across two centuries: the same
// shape `timeline-scale.js` gives, reduced to what the gestures ask of it.
const EXTENT = { min: 1800, max: 2000 };
const scale = () => ({
  invert: (x) => EXTENT.min + (x / 1000) * (EXTENT.max - EXTENT.min),
});

function bind() {
  const root = stubElement();
  const writes = [];
  const state = {
    get: () => ({ from: 1800, to: 2000 }),
    set: (patch) => { writes.push(patch); },
  };
  bindWindowGestures(root, {
    atlas: { extent: EXTENT },
    state,
    scale,
    viewWidth: () => 1000,
  });
  return { root, writes };
}

// The fake clock: callbacks are held until the test runs them, which is what
// makes "one write per frame" a thing a test can see rather than a duration.
function fakeFrames() {
  const booked = [];
  const original = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => { booked.push(fn); return booked.length; };
  return {
    booked,
    run() {
      const all = booked.splice(0, booked.length);
      for (const fn of all) fn();
    },
    restore() {
      if (original === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = original;
    },
  };
}

test('ten moves of a handle are one write, and it says where the last move was', (t) => {
  const frames = fakeFrames();
  t.after(() => frames.restore());
  const { root, writes } = bind();

  root.dispatch('pointerdown', pointer(500, { handle: HANDLE }));
  for (let i = 0; i < 10; i += 1) root.dispatch('pointermove', pointer(500 + i * 10));
  assert.equal(writes.length, 0, 'nothing is written until the frame comes');
  assert.equal(frames.booked.length, 1, 'and one frame is booked, not ten');

  frames.run();
  assert.equal(writes.length, 1, 'one write for the ten moves');
  // The last move's year and not the first: a drag is a position, not a
  // sequence. Derived from the scale this test bound, never written down.
  const last = Math.round(scale().invert(590));
  assert.equal(writes[0].from, last, `the window starts where the pointer ended (${last})`);
});

test('letting go writes what the last move asked for, whatever the frames did', (t) => {
  const frames = fakeFrames();
  t.after(() => frames.restore());
  const { root, writes } = bind();

  root.dispatch('pointerdown', pointer(500, { handle: HANDLE }));
  root.dispatch('pointermove', pointer(700));
  assert.equal(writes.length, 0);
  // No frame ever runs: the reader lets go first, which is the case a booked
  // write would have lost.
  root.dispatch('pointerup', pointer(700));
  assert.equal(writes.length, 1, 'the window the reader let go on is written');
  assert.equal(writes[0].from, Math.round(scale().invert(700)));

  // And the flush is not a second write on the next frame.
  frames.run();
  assert.equal(writes.length, 1);
});

test('a gesture that is not a drag is answered at once', (t) => {
  const frames = fakeFrames();
  t.after(() => frames.restore());
  const { root, writes } = bind();

  // The wheel: one gesture, one answer, and no frame in between. It is not a
  // drag, so nothing about it is coalesced.
  root.dispatch('wheel', { ...pointer(500), deltaY: -120 });
  assert.equal(writes.length, 1, 'the wheel is written straight through');
  assert.equal(frames.booked.length, 0, 'and books no frame');

  // And the double-click that snaps to a decade, likewise.
  root.dispatch('dblclick', { ...pointer(500), target: { closest: () => null } });
  assert.equal(writes.length, 2);
});

test('with no animation frames at all the writes go straight through', (t) => {
  const original = globalThis.requestAnimationFrame;
  delete globalThis.requestAnimationFrame;
  t.after(() => {
    if (original === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = original;
  });
  const { root, writes } = bind();
  root.dispatch('pointerdown', pointer(500, { handle: HANDLE }));
  root.dispatch('pointermove', pointer(600));
  assert.equal(writes.length, 1, 'a page with no frames is a page that still answers');
});

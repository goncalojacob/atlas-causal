// The size of the panel: what it is allowed to be, how it is remembered, and
// the one property that is the whole of the layout's side of it.
//
// There used to be two of each. The timeline was a strip along the bottom of
// the map with an edge of its own; M60 made it a view, so there is no strip
// to resize and no height to remember (m60-brief §3).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, MIN_PANEL, MIN_MAIN,
  clampPanel, readSizes, writeSizes, applySizes, createPanes,
} from '../src/panes.js';

function fakeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    seen: store,
  };
}

// The layout's side: one custom property, and removing it is the default.
function fakeLayout() {
  const props = new Map();
  return {
    props,
    style: {
      setProperty: (k, v) => props.set(k, v),
      removeProperty: (k) => props.delete(k),
    },
  };
}

test('a pane never gets so small there is nothing left of it', () => {
  assert.equal(clampPanel(500, 1200), 500);
  assert.equal(clampPanel(10, 1200), MIN_PANEL, 'the panel keeps a line of prose');
  assert.equal(clampPanel(1190, 1200), 1200 - MIN_MAIN, 'and the map keeps a continent');
  assert.equal(clampPanel(500.4, 1200), 500, 'whole pixels');
  // A window narrower than both minimums together: the panel's own minimum
  // wins, because a panel that is not there cannot be dragged back.
  assert.equal(clampPanel(400, 300), MIN_PANEL);
});

test('the size is remembered, and anything that is not a size is not', () => {
  assert.deepEqual(readSizes(fakeStorage()), { panel: null });
  assert.deepEqual(readSizes(null), { panel: null }, 'a browser with no storage still opens');
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: 'not json' })), { panel: null });
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: '{"panel":420}' })), { panel: 420 });
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: '{"panel":"wide"}' })), { panel: null });
  // A preference written by a version that had the strip still opens the
  // atlas, and its height is read into nothing.
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: '{"panel":420,"timeline":260}' })), { panel: 420 });

  const storage = fakeStorage();
  assert.equal(writeSizes(storage, { panel: 420 }), true);
  assert.deepEqual(readSizes(storage), { panel: 420 });
  // Storage that throws — a browser with it turned off — resizes and forgets.
  const refuses = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
  assert.equal(writeSizes(refuses, { panel: 420 }), false);
  assert.deepEqual(readSizes(refuses), { panel: null });
});

test('a size is one custom property, and a default is its absence', () => {
  const layout = fakeLayout();
  applySizes(layout, { panel: 420 });
  assert.equal(layout.props.get('--panel-width'), '420px');
  // One property and no second: the strip's height is not written any more,
  // and nothing in the stylesheet reads it.
  assert.deepEqual([...layout.props.keys()], ['--panel-width']);

  applySizes(layout, { panel: null });
  assert.equal(layout.props.has('--panel-width'), false);
});

// --- and none of it below the phone width ---------------------------------
//
// There is no pane to size there: the view takes the screen and the panel is a
// sheet whose grip says how much of it it takes (phone.js). The preference
// used to be ignored only because the phone's media query happens not to name
// the property (health review A, finding 32).

function fakeHandle() {
  const attrs = new Map();
  const listeners = new Map();
  return {
    attrs,
    setAttribute: (k, v) => attrs.set(k, v),
    addEventListener: (type, fn) => listeners.set(type, fn),
    fire: (type, event) => listeners.get(type)?.(event),
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    getBoundingClientRect: () => ({ width: 6, height: 6 }),
  };
}

function fakeMedia(matches) {
  let onChange = null;
  return {
    get matches() { return matches; },
    addEventListener: (_type, fn) => { onChange = fn; },
    to: (next) => { matches = next; onChange?.(); },
  };
}

test('at phone width the stored size is not applied and the edge leaves the tab order', () => {
  const layout = { ...fakeLayout(), getBoundingClientRect: () => ({ width: 390, height: 844, right: 390, bottom: 844 }) };
  const storage = fakeStorage({ [STORAGE_KEY]: '{"panel":420}' });
  const panelHandle = fakeHandle();
  const media = fakeMedia(true);
  const resized = [];

  const panes = createPanes(layout, {
    panelHandle, storage, media, onResize: (s) => resized.push(s),
  });

  assert.equal(layout.props.size, 0, 'nothing of the desktop layout is written');
  assert.equal(panelHandle.attrs.get('tabindex'), '-1');
  assert.equal(panelHandle.attrs.get('aria-hidden'), 'true');

  // A drag or an arrow key on the edge does nothing at all here.
  panelHandle.fire('keydown', { key: 'ArrowLeft', preventDefault: () => {} });
  panelHandle.fire('dblclick', {});
  assert.equal(layout.props.size, 0);
  assert.deepEqual(resized, []);
  // And the preference itself is untouched: it was chosen for another width.
  assert.deepEqual(readSizes(storage), { panel: 420 });
  assert.deepEqual(panes.get(), { panel: 420 });

  // Leaving the phone width gives it back whole.
  media.to(false);
  assert.equal(layout.props.get('--panel-width'), '420px');
  assert.equal(panelHandle.attrs.get('tabindex'), '0');
  assert.equal(panelHandle.attrs.get('aria-hidden'), 'false');
  assert.equal(resized.length, 1, 'and the views are told to measure themselves again');
});

test('on a desktop the edge works as it did', () => {
  const layout = { ...fakeLayout(), getBoundingClientRect: () => ({ width: 1280, height: 800, right: 1280, bottom: 800 }) };
  const storage = fakeStorage();
  const panelHandle = fakeHandle();
  const panes = createPanes(layout, { panelHandle, storage, media: fakeMedia(false) });

  assert.equal(panelHandle.attrs.get('tabindex'), '0');
  panes.set({ panel: 500 });
  assert.equal(layout.props.get('--panel-width'), '500px');
  assert.deepEqual(readSizes(storage), { panel: 500 });
});

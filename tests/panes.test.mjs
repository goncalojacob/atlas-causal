// The sizes of the three panes: what a size is allowed to be, how it is
// remembered, and the two properties that are the whole of the layout's
// side of it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, MIN_PANEL, MIN_MAIN, MIN_TIMELINE, MAX_TIMELINE_SHARE,
  clampPanel, clampTimeline, readSizes, writeSizes, applySizes,
} from '../src/panes.js';

function fakeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    seen: store,
  };
}

// The layout's side: two custom properties, and removing them is the default.
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

test('the timeline may take most of the window and never all of it', () => {
  assert.equal(clampTimeline(300, 900), 300);
  assert.equal(clampTimeline(5, 900), MIN_TIMELINE);
  assert.equal(clampTimeline(880, 900), Math.round(900 * MAX_TIMELINE_SHARE));
  assert.ok(clampTimeline(10_000, 900) < 900, 'the map is never pushed off the screen');
});

test('sizes are remembered, and anything that is not a size is not', () => {
  assert.deepEqual(readSizes(fakeStorage()), { panel: null, timeline: null });
  assert.deepEqual(readSizes(null), { panel: null, timeline: null }, 'a browser with no storage still opens');
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: 'not json' })), { panel: null, timeline: null });
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: '{"panel":420,"timeline":260}' })), { panel: 420, timeline: 260 });
  assert.deepEqual(readSizes(fakeStorage({ [STORAGE_KEY]: '{"panel":"wide","timeline":-3}' })), { panel: null, timeline: null });

  const storage = fakeStorage();
  assert.equal(writeSizes(storage, { panel: 420, timeline: null }), true);
  assert.deepEqual(readSizes(storage), { panel: 420, timeline: null });
  // Storage that throws — a browser with it turned off — resizes and forgets.
  const refuses = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
  assert.equal(writeSizes(refuses, { panel: 420 }), false);
  assert.deepEqual(readSizes(refuses), { panel: null, timeline: null });
});

test('a size is two custom properties, and a default is their absence', () => {
  const layout = fakeLayout();
  applySizes(layout, { panel: 420, timeline: 260 });
  assert.equal(layout.props.get('--panel-width'), '420px');
  assert.equal(layout.props.get('--timeline-height'), '260px');
  // The stylesheet caps the timeline so packed rows cannot push the map off
  // the screen; a reader who has dragged the edge has said otherwise.
  assert.equal(layout.props.get('--timeline-max'), 'none');

  applySizes(layout, { panel: null, timeline: null });
  assert.equal(layout.props.has('--panel-width'), false);
  assert.equal(layout.props.has('--timeline-height'), false);
  assert.equal(layout.props.has('--timeline-max'), false, 'and the cap comes back with it');
});

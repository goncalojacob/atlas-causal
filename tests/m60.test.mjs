// M60: the timeline becomes a view, and the window gets a control in the
// masthead. The pure half of it — what the state carries and what the page is
// built out of — so that `node --test` holds it without a browser. The
// control's own two answers are in `tests/window-control.test.mjs`; the driven
// half is `tests/m60-browser.test.mjs`.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **Nothing here pins a count of events** (the brief asks for that
// explicitly, and it is the right ask: a count is a fact about one afternoon
// and a test holding one turns every later import into a false failure). What
// is asserted is the shape of the answer — a column per century over the
// whole extent, a window clamped to the data, a view in the URL.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VIEWS } from '../src/vocab.js';
import { defaultState, parseState, formatState } from '../src/state.js';
import { applySizes, readSizes } from '../src/panes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(path.join(ROOT, file), 'utf8');

// --- the third view --------------------------------------------------------

test('the timeline is one of the views the atlas draws the same state in', () => {
  assert.deepEqual([...VIEWS], ['map', 'graph', 'timeline']);
});

test('the view is in the URL, and the window survives being read back', () => {
  const opened = parseState('?view=timeline&from=1500&to=1600');
  assert.equal(opened.view, 'timeline');
  assert.equal(opened.from, 1500);
  assert.equal(opened.to, 1600);
  // And out again, unchanged: a link opens on the picture its sender saw.
  const url = formatState(opened);
  assert.match(url, /view=timeline/);
  assert.match(url, /from=1500/);
  assert.match(url, /to=1600/);
  // The default still writes nothing, so a link says what the reader changed.
  assert.equal(formatState({ ...defaultState(), view: 'map' }), '');
});

test('a view nobody recognises falls back to the map, as every other field does', () => {
  assert.equal(parseState('?view=lanes').view, 'map');
});

// --- what the strip left behind --------------------------------------------

test('there is one edge between panes now, and it is the panel’s', async () => {
  const html = await read('index.html');
  assert.ok(!html.includes('split-timeline'),
    'the timeline’s resize handle is gone: there is no strip under the map to resize');
  assert.ok(html.includes('id="split-panel"'), 'the panel still has its edge');
  // And nothing writes the length that handle used to set.
  const written = [];
  applySizes({ style: {
    setProperty: (name, value) => written.push([name, value]),
    removeProperty: (name) => written.push([name, null]),
  } }, { panel: 320 });
  assert.deepEqual(written, [['--panel-width', '320px']]);
  const css = await read('src/style.css');
  assert.ok(!css.includes('--timeline-height'), 'the stylesheet no longer names the strip’s height');
  assert.ok(!css.includes('split-timeline'), 'nor the edge that set it');
});

test('a size stored by a reader who had the strip still opens the atlas', () => {
  const sizes = readSizes({ getItem: () => JSON.stringify({ panel: 300, timeline: 260 }) });
  assert.equal(sizes.panel, 300);
  assert.equal(sizes.timeline, undefined, 'the strip’s size is not read back into anything');
});

// --- the masthead ----------------------------------------------------------

test('the masthead carries the three views and the window control', async () => {
  const html = await read('index.html');
  for (const view of VIEWS) {
    assert.ok(html.includes(`data-view="${view}"`), `the masthead offers ${view}`);
  }
  assert.ok(html.includes('id="window-control"'), 'and the control that sets the window');
  // Built rather than written here, for the reason the layer control and the
  // graph filters are: one file decides what a control writes into the URL.
  assert.ok(/<div class="window-control" id="window-control"[^>]*>\s*<\/div>/.test(html),
    'the control is empty in the page and filled by its module');
});

test('the layout has no row for a strip any more', async () => {
  const css = await read('src/style.css');
  const layout = css.slice(css.indexOf('.layout {'), css.indexOf('.map-area'));
  assert.ok(!/"timeline/.test(layout), `the grid still names a timeline row: ${layout}`);
  // The timeline takes the view's own slot, as the graph does.
  assert.match(css, /\.timeline-area\s*{[^}]*grid-area:\s*map/);
});

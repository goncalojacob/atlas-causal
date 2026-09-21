// M74: what the graph opens on, in a real browser.
//
// The graph draws what falls inside the rectangle the reader can see and
// nothing else (I6's cull), so where the camera starts decides what a reader
// sees of their own question. `tests/m74.test.mjs` holds the arithmetic of the
// frame without a DOM; `tests/lens-browser.test.mjs` holds the case the
// milestone was found in — a narrative's walk, every step on screen, on all
// three views. What is left, and what is here, is the pair of promises either
// side of that:
//
//   * **the resting picture.** With no lens on, the camera fits what is drawn.
//     It was the *window's* until M76 — the whole of the data at no zoom at
//     all, a narrow band opening on the band (deviation 54) — and the owner,
//     21 September: *"I think the graph can always show all dates, then one
//     can zoom in and out and pan to look at different times."* So two
//     different windows now open on one picture, and every node of it is on
//     the screen. Asserted as the property and never as a pixel: the numbers
//     below are read off the page and compared with each other;
//   * **a lens larger than the pane still frames what fits.** An event chosen
//     with a ring too wide to draw whole is framed on the event, with as much
//     of its ring as the pane reaches — and the picture says nothing false
//     about the rest;
//   * **and a pane that changes size is framed again**, because the rectangle
//     a frame was computed against is measured once and kept.
//
// Written before the behaviour it judges (deviations 711 and 717), and no test
// here pins a count.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  withBrowser, open, waitFor, watchErrors, errorsOn, skip,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { lensView } from '../src/lens.js';
import { openingState } from '../src/narrative-mode.js';
import { defaultState } from '../src/state.js';

const dataDir = path.join(ROOT, 'data');
const WALK = 'how-the-colonial-war-ended-the-regime';

// The panel is built first, and the graph the first time it is asked for
// (M60): the map's own SVG is what says the page is up.
const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const NODES = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length > 0;";

// The camera, read off the page: the viewport's own transform and the pane it
// is drawn in, in the coordinates of the screen. The window band that used to
// be read beside them went with M76 — the graph draws every date now — so
// `band` is asked for only to assert that there is none.
const CAMERA = `
  const svg = document.querySelector('svg.graph');
  const written = svg.querySelector('g.viewport').getAttribute('transform');
  const t = /translate\\((-?[\\d.]+) (-?[\\d.]+)\\) scale\\(([\\d.]+)\\)/.exec(written || 'translate(0 0) scale(1)');
  const pane = svg.getBoundingClientRect();
  const band = svg.querySelector('rect.window-band');
  const on = band ? band.getBoundingClientRect() : null;
  return {
    written, k: Number(t[3]), x: Number(t[1]), y: Number(t[2]),
    pane: { centre: pane.left + pane.width / 2, width: pane.width },
    band: on ? { centre: on.left + on.width / 2, width: on.width } : null,
  };`;

// Every node the graph has drawn, with whether the reader can see the whole of
// it: the mark's own box against the box of the picture, as M61 asserted the
// labels and as the lens test asserts the walk.
const MARKS = `
  const svg = document.querySelector('svg.graph');
  const pane = svg.getBoundingClientRect();
  return [...svg.querySelectorAll('.layer-nodes circle.node')].map((el) => {
    const box = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-id'),
      stack: el.classList.contains('stack'),
      near: el.classList.contains('lens-near'),
      seen: box.left >= pane.left && box.right <= pane.right
        && box.top >= pane.top && box.bottom <= pane.bottom,
    };
  });`;

test('at rest the graph opens on everything it draws, whatever the window says', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);

    // The whole of the data, and a band of eleven years inside it. Before M76
    // these were two different cameras — the first untouched at k = 1, the
    // second zoomed on to the band with the rest faded or gone. They are one
    // camera now, because the picture is the same picture.
    await open(page, url('?view=graph&from=1492&to=2026'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const whole = await page.eval(CAMERA);
    const wholeMarks = await page.eval(MARKS);
    assert.equal(whole.band, null, 'there is no window band across the picture');

    await open(page, url('?view=graph&from=1900&to=1910'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const narrow = await page.eval(CAMERA);
    assert.equal(narrow.band, null, 'and none on a narrow window either');
    assert.equal(narrow.written, whole.written,
      `a narrow band opens on the same camera as a wide one (${narrow.written} against ${whole.written})`);

    // And what that camera is: every node the graph drew, on the screen. The
    // reader zooms and pans from there, which is what the owner asked for.
    for (const mark of wholeMarks) {
      assert.ok(mark.seen, `${mark.id ?? 'a stack'} is on the screen at rest`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('an event chosen with a ring wider than the pane is framed on the event, and says nothing false', { skip }, async () => {
  // A revolution with one event in its focus and a ring of neighbours spread
  // over half a century and every lane there is: the widest set the frame is
  // offered cannot be drawn whole, and what it falls back to is the event.
  const chosen = 'carnation-revolution-1974';
  const atlas = await atlasOf(dataDir);
  const view = lensView(atlas, { ...defaultState(), selected: chosen });
  assert.ok(view, 'a chosen event is a lens of one');
  assert.ok(view.near.size > view.set.size, 'with a ring wider than what was chosen');

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?view=graph&selected=${chosen}`), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await waitFor(
      page,
      `return Boolean(document.querySelector('#graph svg.graph circle.node[data-id="${chosen}"]'));`,
      'the chosen event to be drawn',
    );

    const marks = await page.eval(MARKS);
    const one = marks.find((m) => m.id === chosen);
    assert.ok(one, 'the event the reader chose is in the picture');
    assert.ok(one.seen, 'and on the screen, which is the whole of the promise');

    // What fits: the ring is why the frame was offered the wider set first, so
    // some of it is on the screen beside the event. How much is the layout's
    // business and nobody pins it.
    assert.ok(marks.some((m) => m.near && m.seen), 'and the ring around it is drawn where it reaches');

    // And nothing false: the lens removes rather than dims, so every mark on
    // the picture is one the lens kept. A frame that had zoomed out past the
    // graph's own floor to make the ring fit would be drawing the atlas and
    // calling it the neighbourhood.
    for (const mark of marks) {
      if (!mark.id || mark.stack) continue;
      assert.ok(view.shown.has(mark.id), `the graph drew ${mark.id}, which the lens does not keep`);
    }
    const camera = await page.eval(CAMERA);
    assert.ok(camera.k >= 1, `the graph does not zoom out past its own picture: ${camera.k}`);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

// The rectangle a frame is computed against is measured, kept, and thrown away
// when the pane changes size (I6): asking the browser for it inside a wheel
// notch is a forced layout of the whole picture. A frame therefore has to be
// able to go stale, and this is the test that says what happens when it does.
//
// It is here because the walk passed in an 800 × 600 window and failed in a
// 1440 × 900 one, for a reason that has nothing to do with either size: the
// first drawing of the view lands before the pane has settled — the masthead
// wraps and the panel takes its remembered width — and a walk framed to the
// pane of that first instant lost its outermost steps when the pane shrank
// under it. One size is not a test of a frame; two are.
const TRANSFORM = "return document.querySelector('svg.graph g.viewport').getAttribute('transform') || '';";

test('a pane that changes size frames the walk again, and no step falls off it', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  const view = lensView(atlas, openingState(atlas, { ...defaultState(), narrative: WALK, step: 0 }));
  const steps = [...view.set];
  assert.ok(steps.length > 1, 'a walk with more than one step to lose');

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?narrative=${WALK}&view=graph`), ready);
    await waitFor(
      page,
      `return ${JSON.stringify(steps)}.every((id) => document.querySelector('#graph svg.graph circle.node[data-id="' + id + '"]'));`,
      'the graph to draw every step of the walk',
    );
    const tall = await page.eval(MARKS);
    for (const id of steps) {
      assert.ok(tall.find((m) => m.id === id)?.seen, `${id} is on the screen in the pane the page opened in`);
    }

    const before = await page.eval(TRANSFORM);
    await page.send('Emulation.setDeviceMetricsOverride', {
      mobile: false, width: 1100, height: 620, deviceScaleFactor: 1,
    });
    await waitFor(page, 'return innerHeight === 620 && innerWidth === 1100;', 'the window to be smaller');
    await waitFor(page, `return ${TRANSFORM.slice('return '.length, -1)} !== ${JSON.stringify(before)};`,
      'the graph to be framed again for the pane it is now in');

    const short = await page.eval(MARKS);
    for (const id of steps) {
      assert.ok(short.find((m) => m.id === id)?.seen, `${id} is still on the screen in the smaller pane`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: { width: 1440, height: 900, deviceScaleFactor: 1 } });
});

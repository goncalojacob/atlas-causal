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
//   * **the resting picture is unchanged.** With no lens on, the camera is the
//     window's, exactly as it has been since deviation 54 — the whole of the
//     data opens at no zoom at all, a narrow band opens on the band. Asserted
//     as the property and never as a pixel: the numbers below are read off the
//     page and compared with each other;
//   * **a lens larger than the pane still frames what fits.** An event chosen
//     with a ring too wide to draw whole is framed on the event, with as much
//     of its ring as the pane reaches — and the picture says nothing false
//     about the rest.
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
import { defaultState } from '../src/state.js';

const dataDir = path.join(ROOT, 'data');

// The panel is built first, and the graph the first time it is asked for
// (M60): the map's own SVG is what says the page is up.
const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const NODES = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length > 0;";

// The camera, read off the page: the viewport's own transform, and the two
// rectangles — the picture's and the window band's — in the coordinates of the
// screen. No attribute at all until something moves the camera, which is the
// picture at rest and is itself one of the answers below.
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

test('at rest the graph opens on the window, as it did before there was a frame', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);

    // A window that is most of the data is not worth zooming to: the right
    // first view of the whole graph is the whole graph, and the camera is not
    // touched at all — there is no transform on the viewport to read.
    await open(page, url('?view=graph&from=1492&to=2026'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const whole = await page.eval(CAMERA);
    assert.equal(whole.written, null, 'nothing has moved the camera, so the viewport carries no transform');
    assert.equal(whole.k, 1);

    // And the other half of the same rule, which is what the atlas's own
    // opening window asks for: a reader arriving on a band should not have to
    // hunt for it, so the first drawing zooms to the band and puts it in the
    // middle of the pane. The band on the screen is what says where the camera
    // is, and it is compared with the pane and never with a number somebody
    // typed.
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const opening = await page.eval(CAMERA);
    assert.ok(opening.k > whole.k, `a band narrower than the data zooms in: ${opening.k} against ${whole.k}`);
    assert.ok(opening.band, 'and the window is a band across the picture');
    assert.ok(
      Math.abs(opening.band.centre - opening.pane.centre) < 1,
      `the band is in the middle of the pane: ${opening.band.centre} against ${opening.pane.centre}`,
    );
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

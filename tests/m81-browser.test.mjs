// M81 on a real page: the graph stretches time when it zooms.
//
// `tests/m81.test.mjs` holds the arithmetic — the axis a lens is laid out on,
// the law the wheel stretches by, the frame that fits the stacks to the height
// and the time extent to the width. What needs a browser is the pair of things
// only a drawing can answer:
//
//   * **a notch in widens the picture by more than it grows it.** Measured on
//     the marks themselves, in the coordinates of the screen, over the marks
//     that are drawn on both sides of the gesture: a ratio against a ratio, and
//     never a pixel;
//   * **and the marks and the labels keep their size while it does** (M61), and
//     no name is cut to fit (M77). The whole reason the stretch is in the
//     picture's coordinates rather than in the SVG's transform is that a
//     transform scaled unevenly would draw a mark as an ellipse and set a label
//     in a condensed face; this is the test that says it does not.
//
// And the third, which the owner sent the screenshot of: World War II opened
// reads as a row of its parts across the pane, not a column in a sliver of it.
//
// Written before the behaviour it judges (deviations 711 and 717). Nothing here
// pins a count, a size or a position: every number asserted is read off the
// page twice and compared with itself.
//
// Headless Chromium over its own DevTools protocol, as the rest of the browser
// suite: no Puppeteer, no Playwright, no npm. A machine with no browser skips.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  withBrowser, open, waitFor, watchErrors, errorsOn, skip,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { parentsOf } from '../src/parts.js';

const dataDir = path.join(ROOT, 'data');
const WAR = 'world-war-ii';
const WALK = 'how-the-colonial-war-ended-the-regime';

// The panel is built first and the graph the first time it is asked for (M60):
// the map's own SVG is what says the page is up.
const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const NODES = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length > 0;";

// Every mark that stands for one event, where it is on the screen and how big
// it is drawn there. Stacks carry `data-stack` and not `data-id`, so what comes
// back is the marks that can be matched by name across a gesture.
const MARKS = `
  const svg = document.querySelector('svg.graph');
  return [...svg.querySelectorAll('.layer-nodes circle.node[data-id]')].map((el) => {
    const b = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-id'),
      x: b.left + b.width / 2,
      y: b.top + b.height / 2,
      size: Math.round(b.width * 100) / 100,
    };
  });`;

// Every label, its text and the box it actually occupies on the screen.
const LABELS = `
  const svg = document.querySelector('svg.graph');
  return [...svg.querySelectorAll('text.node-label')].map((el) => {
    const b = el.getBoundingClientRect();
    return {
      text: el.textContent,
      height: Math.round(b.height * 100) / 100,
      width: Math.round(b.width * 100) / 100,
    };
  });`;

// The marks of an open narrative's walk, which carry a class of their own.
const STEPS = `
  const svg = document.querySelector('svg.graph');
  return [...svg.querySelectorAll('.layer-nodes circle.node.of-narrative')].map((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });`;

// The pane the picture is drawn in, in the same coordinates the marks are.
const PANE = `
  const r = document.querySelector('svg.graph').getBoundingClientRect();
  return { left: r.left, right: r.right, width: r.width, height: r.height };`;

// One notch of the wheel over a point of the page. The same event the reader's
// own wheel sends, with the delta a notch carries.
const notch = (x, y) => `
  document.querySelector('svg.graph').dispatchEvent(new WheelEvent('wheel', {
    bubbles: true, cancelable: true, deltaY: -120, clientX: ${Math.round(x)}, clientY: ${Math.round(y)},
  }));
  return true;`;

// The width and the height a set of marks takes on the screen, over the marks
// that are in both readings: what the picture did to the *same* events, so that
// a mark culled at the edge or a stack come apart cannot be read as a spread.
function spans(before, after) {
  const was = new Map(before.map((m) => [m.id, m]));
  const both = after.filter((m) => was.has(m.id)).map((m) => ({ now: m, then: was.get(m.id) }));
  const range = (list, pick, when) => {
    const values = list.map((pair) => pair[when][pick]);
    return values.length < 2 ? 0 : Math.max(...values) - Math.min(...values);
  };
  return {
    marks: both.length,
    x: { then: range(both, 'x', 'then'), now: range(both, 'x', 'now') },
    y: { then: range(both, 'y', 'then'), now: range(both, 'y', 'now') },
  };
}

test('one notch of the wheel widens time by more than it grows the picture', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');

    const pane = await page.eval(PANE);
    const before = await page.eval(MARKS);
    assert.ok(before.length > 2, 'there are marks to measure');

    await page.eval(notch(pane.left + pane.width / 2, pane.height / 2));
    const after = await page.eval(MARKS);

    const moved = spans(before, after);
    assert.ok(moved.marks > 2, 'and more than two of them survived the notch to be compared');
    assert.ok(moved.x.then > 0 && moved.y.then > 0, 'the picture had width and height to begin with');

    const across = moved.x.now / moved.x.then;
    const down = moved.y.now / moved.y.then;
    assert.ok(down > 1, `a notch in is still a zoom: the picture grew by ${down.toFixed(3)}`);
    assert.ok(
      across > down,
      `and time widened by more than that: ${across.toFixed(3)} across against ${down.toFixed(3)} down`,
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('a mark and a label are the same size on screen before and after a stretch', { skip }, async () => {
  // A reader's window and not the 800 x 600 default: the picture is scaled to its
  // pane, and in a 474-pixel pane a name is five pixels tall and is not drawn at
  // all since M87 §9. What this test measures is a name, so it needs one.
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?view=graph&selected=${WAR}`), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await waitFor(page, 'return document.querySelector("svg.graph text.node-label") !== null;',
      'the graph to name something');

    const pane = await page.eval(PANE);
    const marksBefore = await page.eval(MARKS);
    const labelsBefore = await page.eval(LABELS);

    await page.eval(notch(pane.left + pane.width / 2, pane.height / 2));
    const marksAfter = await page.eval(MARKS);
    const labelsAfter = await page.eval(LABELS);

    // A mark is a circle at every stretch, and the same circle: the stretch is
    // in the picture's coordinates and never in the transform, so nothing here
    // is scaled unevenly. Half a pixel of tolerance, because the browser
    // rounds a box it hands back.
    const sizeBefore = new Map(marksBefore.map((m) => [m.id, m.size]));
    let compared = 0;
    for (const mark of marksAfter) {
      if (!sizeBefore.has(mark.id)) continue;
      compared += 1;
      assert.ok(
        Math.abs(mark.size - sizeBefore.get(mark.id)) <= 0.5,
        `${mark.id} is drawn ${mark.size} across after the notch and was ${sizeBefore.get(mark.id)}`,
      );
    }
    assert.ok(compared > 1, 'more than one mark was on both sides of the gesture');

    // And so is a name. The same text, the same ink: this is M61's rule, and
    // the stretch is the new way it could have been broken.
    const wasNamed = new Map(labelsBefore.map((l) => [l.text, l]));
    let names = 0;
    for (const label of labelsAfter) {
      if (!wasNamed.has(label.text)) continue;
      names += 1;
      assert.ok(
        Math.abs(label.height - wasNamed.get(label.text).height) <= 0.5,
        `“${label.text}” is ${label.height} tall and was ${wasNamed.get(label.text).height}`,
      );
      assert.ok(
        Math.abs(label.width - wasNamed.get(label.text).width) <= 1,
        `“${label.text}” is ${label.width} wide and was ${wasNamed.get(label.text).width}`,
      );
    }
    assert.ok(names > 0, 'at least one name was drawn on both sides of the gesture');

    // Whole or not at all (M77): a stretched picture must not start cutting
    // names to fit the room it has just made.
    for (const label of [...labelsBefore, ...labelsAfter]) {
      assert.doesNotMatch(label.text, /…$/, `“${label.text}” is cut`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: { width: 1280, height: 900, deviceScaleFactor: 1 } });
});

test('World War II opened reads as a row of its parts across the pane', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  const children = atlas.activeEvents.filter((e) => parentsOf(e).includes(WAR)).map((e) => e.id);
  assert.ok(children.length > 2, 'the war has parts, or there is nothing to spread');

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?view=graph&selected=${WAR}`), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await waitFor(
      page,
      `return Boolean(document.querySelector('#graph svg.graph circle.node[data-id="${WAR}"]'));`,
      'the war itself to be drawn',
    );

    const pane = await page.eval(PANE);
    const marks = await page.eval(MARKS);
    const inside = new Set(children);
    const drawn = marks.filter((m) => inside.has(m.id));
    assert.ok(drawn.length > 2, 'more than two of the parts are on the screen');

    const xs = drawn.map((m) => m.x);
    const width = Math.max(...xs) - Math.min(...xs);
    assert.ok(
      width > pane.width / 2,
      `the parts take more than half the pane: ${Math.round(width)} of ${Math.round(pane.width)}`,
    );
    // And a row and not a column: the twenty-seven children stood on one x
    // before this milestone, which is what the owner sent the screenshot of.
    const columns = new Set(xs.map((x) => Math.round(x)));
    assert.ok(columns.size > 2, `they stand on ${columns.size} different dates and not on one`);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('a narrative walk is framed across the width', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  const walk = atlas.narratives?.get(WALK);
  assert.ok(walk, `${WALK} is in the corpus`);

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?narrative=${WALK}&view=graph`), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await waitFor(
      page,
      "return document.querySelectorAll('#graph svg.graph circle.node.of-narrative').length > 1;",
      'the walk to be drawn',
    );

    const pane = await page.eval(PANE);
    const steps = await page.eval(STEPS);
    assert.ok(steps.length > 1, 'more than one step is drawn');

    const xs = steps.map((s) => s.x);
    const width = Math.max(...xs) - Math.min(...xs);
    assert.ok(
      width > pane.width / 2,
      `the walk takes more than half the pane: ${Math.round(width)} of ${Math.round(pane.width)}`,
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

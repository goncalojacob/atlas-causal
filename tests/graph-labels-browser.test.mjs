// What the graph's labels do on a real page, at real zooms. The arithmetic of
// the cut is held by `tests/label-fit.test.mjs`, which needs no browser; what
// needs one is the three things only a drawing can answer — whether a name
// zoomed in on is drawn whole, whether two of them ever land on each other,
// and whether the text holds its size on screen while the picture grows.
//
// M61, tests 1 to 4. Nothing here pins a count of labels or a number of
// characters: what is asserted is a name against its own record's name, and a
// rectangle against its neighbour's.
//
// Headless Chromium over its own DevTools protocol, as the rest of the browser
// suite: no Puppeteer, no Playwright, no npm. A machine with no browser skips.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, seenIntro, waitFor, watchErrors, errorsOn, skip } from './browser.mjs';
import { LABEL_CHARS } from '../src/graph-view/label-fit.js';

const VIEW = '?view=graph&from=1900&to=1999';
const DRAWN = 'return document.querySelector("svg.graph text.node-label") !== null;';

// The zoom in force, read off the viewport's own transform — there is no
// attribute at all until the first gesture, and the picture is then at rest.
const SCALE = `
  const t = document.querySelector('svg.graph .viewport').getAttribute('transform') || 'scale(1)';
  const m = /scale\\(([\\d.]+)\\)/.exec(t);
  return m ? Number(m[1]) : 1;`;

// Back to the whole picture: the same gesture the reader has, and what the
// view calls the world view.
const WORLD = `
  document.querySelector('svg.graph').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  return true;`;

// Every label on the page: its text, the rectangle it actually occupies on
// the screen, and the size it is actually drawn at.
const LABELS = `
  const svg = document.querySelector('svg.graph');
  return [...svg.querySelectorAll('text.node-label')].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent,
      size: Number(el.getAttribute('font-size')),
      height: Math.round(r.height * 100) / 100,
      x0: r.left, x1: r.right, y0: r.top, y1: r.bottom,
    };
  });`;

const overlapping = (labels) => {
  const pairs = [];
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      const a = labels[i];
      const b = labels[j];
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) pairs.push([a.text, b.text]);
    }
  }
  return pairs;
};

// One notch of the wheel over a point of the page, repeated until the picture
// is as far in as the caller asked for. The pointer stays on the same mark, so
// what the zoom opens is the room around *that* node.
async function zoomOnto(page, { x, y }, target) {
  for (let i = 0; i < 80; i += 1) {
    if (await page.eval(SCALE) >= target) break;
    await page.eval(`
      document.querySelector('svg.graph').dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true, deltaY: -120, clientX: ${Math.round(x)}, clientY: ${Math.round(y)},
      }));
      return true;`);
  }
  return page.eval(SCALE);
}

// The mark on screen whose name is longest, with where it is and what it is
// called. The name is the mark's own title, which carries the whole of it
// however the label was cut.
const LONGEST = `
  const svg = document.querySelector('svg.graph');
  let best = null;
  for (const mark of svg.querySelectorAll('circle.node[data-id]')) {
    const title = mark.querySelector('title');
    const name = (title ? title.textContent : '').split(' — ')[0];
    const r = mark.getBoundingClientRect();
    if (!name || r.width === 0) continue;
    if (!best || name.length > best.name.length) {
      best = { id: mark.getAttribute('data-id'), name, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
  }
  return best;`;

test('a node with room round it is named in full, with nothing left off', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(VIEW), DRAWN);
    await page.eval(WORLD);
    await waitFor(page, DRAWN, 'the world view to be drawn');

    const longest = await page.eval(LONGEST);
    assert.ok(longest, 'there is a named mark on screen');
    // The fault this milestone is about: at the world view that name does not
    // fit the picture and is cut. If the corpus ever stops having a name that
    // long, this is the line that says so rather than a test that passes for
    // the wrong reason.
    assert.ok(longest.name.length > LABEL_CHARS,
      `${longest.name} is longer than a label used to be allowed to be`);

    // Zoomed in on that very mark, the room round it is the room the zoom
    // opened, and the whole name is drawn in it.
    //
    // **Opened first, since M65.** How long a label may be is the room to the
    // next one at the world view (label-fit.js), and choosing an event is what
    // gives a node room: the resting picture is the 242 main events and this
    // one sits close enough to its neighbours there that no zoom buys it the
    // whole of a 59-character name. A reader who wants to read a node opens it,
    // and what this test is about — a node with room round it is named in full,
    // with nothing left off — is unchanged.
    await open(page, url(`${VIEW}&selected=${longest.id}`), DRAWN);
    await page.eval(WORLD);
    await waitFor(page, DRAWN, 'the world view of the chosen event');
    const at = await page.eval(`
      const el = document.querySelector('svg.graph circle.node[data-id="${longest.id}"]');
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`);
    const k = await zoomOnto(page, at, 6);
    assert.ok(k >= 6, `the wheel went in (k = ${k})`);
    await waitFor(
      page,
      `return [...document.querySelectorAll('svg.graph text.node-label')]
        .some((el) => el.textContent === ${JSON.stringify(longest.name)});`,
      `${longest.id} to be named in full`,
    );
    const labels = await page.eval(LABELS);
    const whole = labels.find((l) => l.text === longest.name);
    assert.ok(whole, `${longest.name} is drawn`);
    assert.doesNotMatch(whole.text, /…/, 'and it carries no ellipsis');
    assert.deepEqual(overlapping(labels), [], 'nothing on the close view is drawn over anything else');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('at the world view a label is no longer than it was, and none is drawn over another', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(VIEW), DRAWN);
    await page.eval(WORLD);
    await waitFor(page, DRAWN, 'the world view to be drawn');
    assert.equal(await page.eval(SCALE), 1, 'which is the whole picture');

    const labels = await page.eval(LABELS);
    assert.ok(labels.length > 0, 'the world view names something');
    for (const label of labels) {
      // The cut that was there before this milestone was a constant, and at
      // the world view it is still what binds: the picture is no busier than
      // it was.
      assert.ok(label.text.length <= LABEL_CHARS, `${label.text} is no longer than the cut it replaces`);
    }
    assert.deepEqual(overlapping(labels), [], 'and no two of them touch');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('a label is the same size on screen however far the picture is zoomed', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(VIEW), DRAWN);
    await page.eval(WORLD);
    await waitFor(page, DRAWN, 'the world view to be drawn');
    const longest = await page.eval(LONGEST);

    const sizes = [];
    for (const target of [1, 3, 6]) {
      await page.eval(WORLD);
      const k = await zoomOnto(page, longest, target);
      const labels = await page.eval(LABELS);
      assert.ok(labels.length > 0, `something is named at k = ${k}`);
      const heights = [...new Set(labels.map((l) => l.height))];
      assert.equal(heights.length, 1, `one size on screen at k = ${k}: ${heights.join(', ')}`);
      // And in the drawing it is that size divided by the zoom, which is what
      // makes the two the same thing: the text does not grow with the picture.
      const drawn = [...new Set(labels.map((l) => Math.round(l.size * k * 1000) / 1000))];
      assert.equal(drawn.length, 1, `one size in the DOM at k = ${k}: ${drawn.join(', ')}`);
      sizes.push({ k, height: heights[0], drawn: drawn[0] });
      assert.deepEqual(overlapping(labels), [], `nothing overlaps at k = ${k}`);
    }
    assert.ok(sizes[2].k > sizes[0].k, 'the three zooms are three different pictures');
    for (const size of sizes.slice(1)) {
      assert.ok(Math.abs(size.height - sizes[0].height) < 0.5,
        `the same height on screen at every zoom: ${JSON.stringify(sizes)}`);
      assert.ok(Math.abs(size.drawn - sizes[0].drawn) < 0.01,
        `and the same size once the zoom is taken back out: ${JSON.stringify(sizes)}`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

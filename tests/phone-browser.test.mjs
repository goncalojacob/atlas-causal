// The phone layout in a real browser at a real phone size: 390 × 844, touch,
// three device pixels to the CSS pixel. What the brief asks for is that a
// mark can be tapped and the sheet appears, which is a gesture and a media
// query at once and cannot be checked without one.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, waitFor, tap, seenIntro, skip,
} from './browser.mjs';

// An iPhone 12 in portrait, which is about the middle of what a phone is.
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3 };

// Every one of these is a reader who has been here before: the introduction
// covers the view on a first visit with nothing open, and what is under test
// here is the sheet.
const phone = (fn) => withBrowser(async (page, url) => {
  await seenIntro(page);
  return fn(page, url);
}, { device: PHONE, touch: true });

// Where the sheet actually is on the screen, and how much of it is showing.
// Read from the layout rather than from the class, so a broken transform is
// a failure and not a passing test about a class name.
const SHEET = `const sheet = document.getElementById("sheet");
  const box = sheet.getBoundingClientRect();
  return {
    open: sheet.classList.contains("open"),
    peek: sheet.classList.contains("peek"),
    expanded: document.getElementById("sheet-grip").getAttribute("aria-expanded"),
    top: Math.round(box.top),
    showing: Math.round(Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)),
    height: Math.round(box.height),
    gripHeight: Math.round(document.getElementById("sheet-grip").getBoundingClientRect().height),
  };`;

// The sheet slides, so nothing about where it is may be read while it is
// still moving. These are the two places it comes to rest, in geometry
// rather than in class names: a transform that never arrives is a failure.
const AT_REST_DOWN = `const b = document.getElementById("sheet").getBoundingClientRect();
  const grip = document.getElementById("sheet-grip").getBoundingClientRect().height;
  return Math.round(b.top) === Math.round(innerHeight - grip);`;
const AT_REST_UP = `const b = document.getElementById("sheet").getBoundingClientRect();
  return Math.round(b.top) === Math.round(innerHeight - b.height);`;

test('at 390 × 844 the atlas stacks and the panel is a sheet down to its grip', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');

    assert.equal(await page.eval('return document.body.classList.contains("phone");'), true);
    const layout = await page.eval(`const l = document.querySelector(".layout");
      const map = document.getElementById("map").getBoundingClientRect();
      const timeline = document.querySelector(".timeline-area").getBoundingClientRect();
      return {
        columns: getComputedStyle(l).gridTemplateColumns.split(" ").length,
        splits: [...document.querySelectorAll(".split")].map((s) => getComputedStyle(s).display),
        mapAbove: Math.round(map.bottom) <= Math.round(timeline.top),
        timelineHeight: Math.round(timeline.height),
        wider: document.documentElement.scrollWidth <= 390,
      };`);
    assert.equal(layout.columns, 1, 'one column');
    assert.deepEqual(layout.splits, ['none', 'none'], 'the draggable edges of M24 are gone');
    assert.equal(layout.mapAbove, true, 'the view on top, the timeline under it');
    assert.ok(layout.timelineHeight > 100 && layout.timelineHeight < 180, `a fixed strip, got ${layout.timelineHeight}`);
    assert.equal(layout.wider, true, 'nothing sticks out sideways');

    // Nothing open: the sheet is down, and only its grip is over the atlas.
    await waitFor(page, AT_REST_DOWN, 'the sheet to rest on its grip');
    const at = await page.eval(SHEET);
    assert.equal(at.peek, true);
    assert.equal(at.expanded, 'false');
    assert.equal(at.showing, at.gripHeight, 'exactly the grip is showing');
    assert.ok(at.gripHeight >= 40, `the grip is a hit target, got ${at.gripHeight}`);
  });
});

test('a mark can be tapped and the sheet comes up with its card', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark:not(.cluster)"));');
    await waitFor(page, AT_REST_DOWN, 'the sheet to rest on its grip');

    // A finger, on the middle of a mark that stands for one event.
    const point = await page.eval(`const mark = document.querySelector(".map .mark:not(.cluster)");
      const box = mark.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2, id: mark.dataset.id };`);
    assert.ok(point.id, 'the mark stands for one event');
    await tap(page, point.x, point.y);

    await waitFor(page, 'return Boolean(document.querySelector(".panel .event-head h2"));', 'the card');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), point.id);

    await waitFor(page, AT_REST_UP, 'the sheet to come up');
    const at = await page.eval(SHEET);
    assert.equal(at.open, true, 'the sheet came up');
    assert.equal(at.expanded, 'true');
    assert.equal(at.top, 844 - at.height, 'and is against the bottom edge, whole');
    assert.ok(at.showing > 300, `most of the screen is the card, got ${at.showing}`);
  });
});

test('the grip pushes the sheet back down, and brings it up again', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-a'), 'return Boolean(document.querySelector(".panel .event-head h2"));');
    // Arriving on a link that names a record opens with the card up.
    await waitFor(page, AT_REST_UP, 'the sheet to be up on arrival');

    const grip = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip.x, grip.y);
    await waitFor(page, AT_REST_DOWN, 'the sheet to go down');
    const down = await page.eval(SHEET);
    assert.equal(down.showing, down.gripHeight);
    // Pushing it down is not a change of what the atlas is showing.
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), 'fixture-event-a');

    const grip2 = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip2.x, grip2.y);
    await waitFor(page, AT_REST_UP, 'the sheet to come up again');
  });
});

test('the search is full width and the toggles are behind one Options button', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');

    const before = await page.eval(`return {
      search: Math.round(document.querySelector(".search-input").getBoundingClientRect().width),
      button: getComputedStyle(document.getElementById("options-button")).display,
      buttonHeight: Math.round(document.getElementById("options-button").getBoundingClientRect().height),
      layers: getComputedStyle(document.querySelector(".bar .layers")).display,
      grouping: getComputedStyle(document.querySelector(".bar .grouping")).display,
      views: Math.round(document.querySelector('[data-view="map"]').getBoundingClientRect().height),
    };`);
    assert.ok(before.search > 300, `the search takes the line, got ${before.search}`);
    assert.notEqual(before.button, 'none', 'the Options button is there');
    assert.ok(before.buttonHeight >= 40, `Options is a hit target, got ${before.buttonHeight}`);
    assert.ok(before.views >= 40, `Map/Graph are hit targets, got ${before.views}`);
    assert.equal(before.layers, 'none', 'the layer switches are folded away');
    assert.equal(before.grouping, 'none', 'and so is the grouping');

    await page.eval('document.getElementById("options-button").click(); return true;');
    const after = await page.eval(`return {
      expanded: document.getElementById("options-button").getAttribute("aria-expanded"),
      layers: getComputedStyle(document.querySelector(".bar .layers")).display,
      grouping: getComputedStyle(document.querySelector(".bar .grouping")).display,
      box: Math.round(document.querySelector(".bar .layers label").getBoundingClientRect().height),
    };`);
    assert.equal(after.expanded, 'true');
    assert.notEqual(after.layers, 'none', 'and they come back on the button');
    assert.notEqual(after.grouping, 'none');
    assert.ok(after.box >= 40, `a layer switch is a hit target, got ${after.box}`);
  });
});

test('the graph pans by touch, and the timeline still scrolls under a finger', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1&view=graph'), 'return Boolean(document.querySelector(".graph .node"));');
    // The sheet is over the middle of the screen until it has finished going
    // down, and a finger there would land on the panel and not the picture.
    await waitFor(page, AT_REST_DOWN, 'the sheet to rest on its grip');
    // touch-action decides whether the browser takes the gesture before the
    // view sees it: none on the graph is what makes a one-finger drag a pan.
    assert.equal(await page.eval('return getComputedStyle(document.querySelector(".graph")).touchAction;'), 'none');
    assert.equal(await page.eval('return getComputedStyle(document.querySelector(".timeline")).touchAction;'), 'pan-y');

    // Set before the drag: the attribute is written only when the view moves,
    // so "it changed" has to be measured against something that exists.
    await page.eval('document.querySelector(".graph .viewport").setAttribute("transform", "none"); return true;');
    const before = 'none';
    const from = await page.eval(`const box = document.querySelector(".graph").getBoundingClientRect();
      return { x: Math.round(box.left + box.width / 2), y: Math.round(box.top + box.height / 2) };`);
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
    // Several steps, not one: a finger that jumps is not a drag, and the
    // browser has a slop distance before it calls a touch a movement at all.
    for (let step = 1; step <= 6; step += 1) {
      await page.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: from.x - 10 * step, y: from.y - 4 * step }],
      });
    }
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await waitFor(
      page,
      `return document.querySelector(".graph .viewport").getAttribute("transform") !== ${JSON.stringify(before)};`,
      'the graph to pan under the finger',
    );
  });
});

// Reading a narrative on a phone. The card's own text says the map, the graph
// and the timeline follow the step — so the sheet must not cover them at
// every arrow key, which is what it did (health review A, finding 32). The
// grip is the control: once the reader has pushed the sheet down, it stays
// down until they ask for it.
test('stepping through a narrative leaves the sheet where the reader put it', { skip }, async () => {
  await phone(async (page, url) => {
    await open(
      page,
      url('?fixtures=1&narrative=fixture-narrative-one'),
      'return Boolean(document.querySelector(".panel .narrative-head"));',
    );
    // Opening the narrative is opening something, so it comes up once.
    await waitFor(page, AT_REST_UP, 'the sheet to be up on arrival');

    const grip = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip.x, grip.y);
    await waitFor(page, AT_REST_DOWN, 'the sheet to go down');

    // Three steps forward and one back, from the keyboard as the card says.
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft']) {
      const step = await page.eval('return new URLSearchParams(location.search).get("step") ?? "0";');
      await page.eval(`document.body.dispatchEvent(new KeyboardEvent('keydown', {
        key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }));
        return true;`);
      await waitFor(
        page,
        `return (new URLSearchParams(location.search).get("step") ?? "0") !== ${JSON.stringify(step)};`,
        `the step to move on ${key}`,
      );
      assert.equal(await page.eval(AT_REST_DOWN), true, `the sheet stayed down through ${key}`);
    }
    // The reader really did walk, and the map really did follow.
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("step");'), '2');
    assert.ok(await page.eval('return document.querySelectorAll("#map .mark.of-narrative").length > 0;'));

    // And the grip still brings it back.
    const grip2 = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip2.x, grip2.y);
    await waitFor(page, AT_REST_UP, 'the sheet to come up again');
  });
});

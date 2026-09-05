// The map's arithmetic in a real browser, where the SVG is really
// letterboxed. None of this can be checked without a layout: the whole
// defect is that the element's box and its viewBox have different shapes,
// and in a test with no CSS they have the same one.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

// Wide and short, so the map area is far wider than 960 × 540's ratio and
// the picture spills well outside the nominal box on both sides.
const WIDE = { width: 1400, height: 620, deviceScaleFactor: 1 };

const wide = (fn) => withBrowser(fn, { device: WIDE });

const READY = 'return Boolean(document.querySelector(".map .mark"));';

// A real pan: press near the right edge on empty ground, move across the
// pane, let go. Dispatched as pointer events because the handlers under test
// are the map's own.
const panBy = (dx) => `
  const root = document.querySelector('#map svg.map');
  const box = root.getBoundingClientRect();
  const x = box.right - 8;
  const y = box.top + 8;
  const at = (cx, type) => root.dispatchEvent(new PointerEvent(type, {
    bubbles: true, clientX: cx, clientY: y, pointerId: 1,
  }));
  at(x, 'pointerdown');
  for (let i = 1; i <= 10; i += 1) at(x + (${dx} * i) / 10, 'pointermove');
  at(x + ${dx}, 'pointerup');
  return true;`;

// The pane the map is drawn in must not change size while a pan is being
// measured, or the picture moves for two reasons at once. A reader who has
// dragged the timeline's edge has said exactly this (panes.js).
const FREEZE_TIMELINE = `
  const layout = document.querySelector('.layout');
  layout.style.setProperty('--timeline-height', '160px');
  return true;`;

// Every mark the reader can see, with where it is on the screen and where it
// is in the SVG's own units — which is how "outside the nominal box" is said
// in a way a test can check.
const VISIBLE_MARKS = `
  const root = document.querySelector('#map svg.map');
  const pane = root.getBoundingClientRect();
  const inverse = root.getScreenCTM().inverse();
  const out = [];
  for (const el of root.querySelectorAll('circle.mark[data-id]')) {
    const b = el.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    if (cx < pane.left || cx > pane.right || cy < pane.top || cy > pane.bottom) continue;
    const p = new DOMPoint(cx, cy).matrixTransform(inverse);
    out.push({ id: el.getAttribute('data-id'), cx, cy, svgX: p.x, svgY: p.y });
  }
  return out;`;

test('the map is letterboxed, and a mark out in the letterbox has a bar under it', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await page.eval(FREEZE_TIMELINE);

    // The premise: the pane really is wider than the viewBox's ratio, so the
    // visible SVG units run past 0 and 960 on either side.
    const shown = await page.eval(`
      const root = document.querySelector('#map svg.map');
      const box = root.getBoundingClientRect();
      const inverse = root.getScreenCTM().inverse();
      const a = new DOMPoint(box.left, box.top).matrixTransform(inverse);
      const b = new DOMPoint(box.right, box.bottom).matrixTransform(inverse);
      return { x0: a.x, x1: b.x, ratio: box.width / box.height };`);
    assert.ok(shown.ratio > 1.9, `the map area is wide (${shown.ratio.toFixed(2)})`);
    assert.ok(shown.x0 < -40, `the picture starts left of the viewBox (${Math.round(shown.x0)})`);
    assert.ok(shown.x1 > 1000, `and ends right of it (${Math.round(shown.x1)})`);

    // Move the picture sideways, so that marks land in the strip the nominal
    // box does not cover, and wait for the box to settle into the URL.
    await page.eval(panBy(-300));
    await waitFor(page, 'return new URLSearchParams(location.search).has("bbox");', 'the box to be published');

    const marks = await page.eval(VISIBLE_MARKS);
    assert.ok(marks.length >= 3, `marks are on screen (${marks.length})`);
    const outside = marks.filter((m) => m.svgX < 0 || m.svgX > 960);
    assert.ok(outside.length > 0, 'and some of them are out in the letterbox');

    // viewport.js's promise: a mark the reader can see has a bar under it.
    // The fixtures are eleven placed events spread across the world, so no
    // two of them stack on the timeline and every one drawn is its own rect.
    const bars = await page.eval(`return [...document.querySelectorAll('#timeline rect.bar[data-id]')]
      .map((el) => el.getAttribute('data-id'));`);
    const missing = marks.map((m) => m.id).filter((id) => !bars.includes(id));
    assert.deepEqual(missing, [], 'every mark on screen has a bar under it');
  });
});

test('a click on a mark out in the letterbox selects it, and a pan follows the cursor', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await page.eval(FREEZE_TIMELINE);
    await page.eval(panBy(-300));
    await waitFor(page, 'return new URLSearchParams(location.search).has("bbox");', 'the box to be published');

    const marks = await page.eval(VISIBLE_MARKS);
    const target = marks.filter((m) => m.svgX < 0).sort((a, b) => a.cx - b.cx)[0];
    assert.ok(target, 'a mark is showing in the left-hand letterbox');

    // A press and a release on the same point, through the real pointer path.
    await page.eval(`
      const el = document.querySelector('#map circle.mark[data-id="${target.id}"]');
      const at = (type) => el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, clientX: ${target.cx}, clientY: ${target.cy}, pointerId: 2,
      }));
      at('pointerdown');
      at('pointerup');
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: ${target.cx}, clientY: ${target.cy} }));
      return true;`);
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get("selected") === ${JSON.stringify(target.id)};`,
      'the mark under the cursor to be selected',
    );

    // And the picture moves at the speed of the hand: scaling by the bounding
    // rectangle instead moved it at about two thirds (health review A,
    // finding 4).
    const centreOf = `const b = document.querySelector('#map circle.mark[data-id="${target.id}"]')
      .getBoundingClientRect(); return b.left + b.width / 2;`;
    const before = await page.eval(centreOf);
    await page.eval(panBy(120));
    const after = await page.eval(centreOf);
    assert.ok(
      Math.abs((after - before) - 120) <= 2,
      `the mark moved with the cursor (${Math.round(after - before)} of 120)`,
    );
  });
});

// --- the world is not a box, and a placeless event answers with its region --

const TIMELINE = `return {
  search: location.search,
  filtered: !document.querySelector('.timeline-note').hidden,
  note: document.querySelector('.timeline-note span').textContent,
  bars: [...document.querySelectorAll('#timeline rect.bar[data-id]')]
    .map((el) => el.getAttribute('data-id')).sort(),
};`;

// The eleven active fixture events. Ten of them have a place; fixture-event-f
// is the long process with none, in fixture-lane-3, whose polygon covers
// 10 … 40 east.
const ACTIVE = [
  'fixture-event-a', 'fixture-event-a2', 'fixture-event-b', 'fixture-event-c',
  'fixture-event-d', 'fixture-event-e', 'fixture-event-f', 'fixture-event-g',
  'fixture-event-h', 'fixture-event-o', 'fixture-event-t',
];

test('the whole world is no box at all, and the lanes carry every active event', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1&bbox=-180,-90,180,90'), READY);
    const shown = await page.eval(TIMELINE);
    assert.equal(shown.search, '?fixtures=1', 'the world box does not survive being read');
    assert.equal(shown.filtered, false, 'so the lanes are not filtered and the pin is not offered');
    assert.deepEqual(shown.bars, ACTIVE);
  });
});

test('an event with no place is in view when its region\'s box is', { skip }, async () => {
  await wide(async (page, url) => {
    // A box inside fixture-lane-3, which is where the placeless event is.
    await open(page, url('?fixtures=1&bbox=15,0,35,40'), READY);
    let shown = await page.eval(TIMELINE);
    assert.equal(shown.filtered, true);
    assert.equal(shown.note, '3 of 11 events in view');
    assert.ok(shown.bars.includes('fixture-event-f'), 'the placeless process is in the lanes');

    // And a box in fixture-lane-1, which is not.
    await open(page, url('?fixtures=1&bbox=-40,20,-10,50'), READY);
    shown = await page.eval(TIMELINE);
    assert.equal(shown.note, '5 of 11 events in view');
    assert.ok(!shown.bars.includes('fixture-event-f'), 'and out of them when the map is elsewhere');
  });
});

// --- one click, three pictures --------------------------------------------

// A click through the real path: the layers listen for `click` and find the
// mark under the pointer, so the event has to reach the element itself.
const clickOn = (selector) => `
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('nothing at ' + ${JSON.stringify(selector)});
  const b = el.getBoundingClientRect();
  const at = { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...at, pointerId: 3 }));
  el.dispatchEvent(new PointerEvent('pointerup', { ...at, pointerId: 3 }));
  el.dispatchEvent(new MouseEvent('click', at));
  return true;`;

const CHAIN = 'return new URLSearchParams(location.search).get("chain");';

// The map drew the consequence line and then refused to follow it: the same
// click walked the chain in the graph and threw it away here (health review
// B, finding 10).
test('a click on a consequence walks the chain on the map and on the timeline', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-a'), READY);

    await page.eval(clickOn('#map circle.mark[data-id="fixture-event-b"]'));
    await waitFor(page, CHAIN, 'the map click to append a step');
    assert.equal(await page.eval(CHAIN), 'fixture-event-a--fixture-event-b--caused');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), 'fixture-event-b');

    // And on again from the timeline, which followed the map's old rule.
    await page.eval(clickOn('#timeline rect.bar[data-id="fixture-event-d"]'));
    await waitFor(
      page,
      'return (new URLSearchParams(location.search).get("chain") ?? "").split(",").length === 2;',
      'the timeline click to append the next step',
    );
    assert.equal(
      await page.eval(CHAIN),
      'fixture-event-a--fixture-event-b--caused,fixture-event-b--fixture-event-d--enabled',
    );

    // A mark that does not follow from what is open starts afresh, walk and
    // all: the chain is one argument and this is not part of it.
    await page.eval(clickOn('#map circle.mark[data-id="fixture-event-g"]'));
    await waitFor(page, 'return new URLSearchParams(location.search).get("selected") === "fixture-event-g";', 'a fresh start');
    assert.equal(await page.eval(CHAIN), null);
  });
});

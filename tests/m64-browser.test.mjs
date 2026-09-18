// M64 in a real browser: the toggle on the map, the band it opens, and the map
// answering a drag as it happens.
//
// The owner, 18 September: *"There should be a toggle on the map so I can
// choose the dates instead of a selector."* What needs a browser is everything
// about that sentence: that a first visit is the picture M60 left, that the
// strip is a strip and not the strip again, that pulling an end moves the map
// **while the pointer is still down**, and that the control is remembered for
// the reader and never carried by the link.
//
// `tests/m64.test.mjs` holds the rest without a DOM — one band and not two, one
// source for where the events are, one clamp for typing and dragging.
//
// Written before the behaviour it judges (deviations 711 and 717). **No test
// here pins a count**: what is asserted is the property — the pane the map
// keeps, the window surviving a toggle, a drag changing the picture — and never
// a number a later import would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';

const MAP_READY = 'return Boolean(document.querySelector(".map .mark"));';
const LANES_READY = 'return document.querySelectorAll(".timeline-area svg rect.lane").length > 0;';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };

// The band as the reader can see it: whether the toggle is there, whether it
// says it is open, and whether the strip exists in the document at all.
// **Closed is gone and not hidden** — a drawing that is still there is still
// redrawn on every nudge of the window.
const BAND = `
  const toggle = document.querySelector('.map-band-toggle');
  const strip = document.getElementById('map-band-strip');
  return {
    toggle: Boolean(toggle),
    expanded: toggle ? toggle.getAttribute('aria-expanded') : null,
    strip: Boolean(strip),
    handles: strip ? strip.querySelectorAll('[data-window]').length : 0,
    profile: strip ? strip.querySelectorAll('path.stub').length : 0,
    valuetext: strip ? (strip.querySelector('[data-window="band"]')?.getAttribute('aria-valuetext') ?? null) : null,
  };`;

// The window as the reader can read it, from the control that is on every view,
// and as the URL carries it.
const WINDOW = `return {
  from: document.querySelector('#window-control [data-window="from"]').value,
  to: document.querySelector('#window-control [data-window="to"]').value,
  urlFrom: new URLSearchParams(location.search).get('from'),
  urlTo: new URLSearchParams(location.search).get('to'),
};`;

// A pane against the layout that holds it. Rounded, because a grid's rows are
// fractions of a pixel and this is a question about a layout.
const PANE = (selector) => `
  const pane = document.querySelector('${selector}');
  const layout = document.querySelector('.layout');
  const box = pane.getBoundingClientRect();
  const whole = layout.getBoundingClientRect();
  return {
    height: Math.round(box.height),
    layoutHeight: Math.round(whole.height),
    toBottom: Math.round(whole.bottom - box.bottom),
  };`;

const MARKS = 'return [...document.querySelectorAll("#map svg .mark[data-id]")].map((el) => el.dataset.id);';

const press = 'document.querySelector(".map-band-toggle").click(); return true;';

// 1. A first visit has no band and the map has the whole layout.
test('a first visit has no band, and the map is the whole layout as M60 left it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(''), MAP_READY);
    const band = await page.eval(BAND);
    assert.equal(band.toggle, true, 'there is a toggle on the map');
    assert.equal(band.expanded, 'false', 'and it says it is closed');
    assert.equal(band.strip, false, 'nothing of the band is in the document until it is asked for');

    const pane = await page.eval(PANE('.map-area'));
    assert.equal(pane.toBottom, 0, 'the map reaches the bottom of the layout');
    assert.equal(pane.height, pane.layoutHeight, 'and it is the whole of it');
    // The property M60 measured, not a pixel count: the strip used to leave the
    // map about 70 % and a first visit must still be 100 %.
    assert.ok(pane.height > pane.layoutHeight * 0.7,
      `the map is not back to the 70 % the strip left it (${pane.height} of ${pane.layoutHeight})`);
  }, { device: DESK });
});

// 2. Opening and closing does not change the window.
test('opening and closing the band leaves the window exactly where it was', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1500&to=1600'), MAP_READY);
    const before = await page.eval(WINDOW);
    assert.deepEqual([before.urlFrom, before.urlTo], ['1500', '1600']);

    await page.eval(press);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band to open');
    const opened = await page.eval(BAND);
    assert.equal(opened.expanded, 'true');
    assert.equal(opened.handles, 3, 'the band and its two handles, as on the timeline');
    assert.deepEqual(await page.eval(WINDOW), before, 'opening it moved nothing');

    await page.eval(press);
    await waitFor(page, 'return !document.getElementById("map-band-strip");', 'the band to close');
    assert.equal((await page.eval(BAND)).expanded, 'false');
    assert.deepEqual(await page.eval(WINDOW), before, 'and closing it moved nothing either');
  }, { device: DESK });
});

// 3. Dragging an end changes `from`/`to` and the map answers during the drag.
test('pulling an end of the band moves the map while the pointer is still down', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // The whole extent, so there is room to sweep and something to sweep away.
    await open(page, url('?from=1415&to=2025'), MAP_READY);
    await page.eval(press);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band to open');

    const before = { window: await page.eval(WINDOW), marks: await page.eval(MARKS) };
    assert.ok(before.marks.length > 0, 'the map is drawing something to begin with');

    // The pointer goes down on the far handle and moves, and **nothing comes
    // up**: what is asserted below is what a reader sees mid-gesture. A drag
    // through real pointer events, not a call to `setWindow`.
    const grab = `
      const strip = document.getElementById('map-band-strip');
      const handle = strip.querySelector('.window-handle.to');
      const box = handle.getBoundingClientRect();
      const strips = strip.getBoundingClientRect();
      const at = { bubbles: true, cancelable: true, pointerId: 11 };
      handle.dispatchEvent(new PointerEvent('pointerdown', {
        ...at, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
      strip.dispatchEvent(new PointerEvent('pointermove', {
        ...at, clientX: Math.round(strips.left + 40), clientY: box.top + box.height / 2 }));
      return true;`;
    await page.eval(grab);

    const during = { window: await page.eval(WINDOW), marks: await page.eval(MARKS) };
    assert.notDeepEqual(during.window.to, before.window.to,
      `the far end moved as the pointer did (${before.window.from}–${before.window.to} → ${during.window.from}–${during.window.to})`);
    assert.ok(Number(during.window.to) < Number(before.window.to), 'and it moved the way the pointer went');
    // The map has answered already — not on the way up.
    assert.notDeepEqual(during.marks, before.marks,
      'the map is drawing a different picture with the pointer still down');
    assert.ok(during.marks.length < before.marks.length,
      `and a narrower one (${during.marks.length} of ${before.marks.length})`);

    const release = `
      const strip = document.getElementById('map-band-strip');
      const strips = strip.getBoundingClientRect();
      strip.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true, cancelable: true, pointerId: 11,
        clientX: Math.round(strips.left + 40), clientY: Math.round(strips.top + strips.height / 2) }));
      return true;`;
    await page.eval(release);
    // And the window the drag chose is the one the URL carries, so the picture
    // a reader swept to is the picture they can send.
    await waitFor(page, `return new URLSearchParams(location.search).get('to') === '${during.window.to}';`,
      'the dragged window in the URL');
    assert.deepEqual(await page.eval(WINDOW), {
      ...during.window, urlFrom: during.window.from, urlTo: during.window.to,
    });
  }, { device: DESK });
});

// 4. The band on the map and the timeline view agree about the window.
test('the band on the map and the band on the timeline say the same window', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1500&to=1600'), MAP_READY);
    await page.eval(press);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band to open');
    const onMap = (await page.eval(BAND)).valuetext;
    assert.match(onMap, /^1500 to 1600$/);

    await page.eval('document.querySelector(\'[data-view="timeline"]\').click(); return true;');
    await waitFor(page, LANES_READY, 'the lanes');
    const onLanes = await page.eval(`return document.querySelector('.timeline-area [data-window="band"]')
      .getAttribute('aria-valuetext');`);
    assert.equal(onLanes, onMap, 'one window, said the same way by both drawings');

    // And what each is drawn over is the same set, asserted from the shared
    // source rather than by comparing two drawings: `tests/m64.test.mjs` holds
    // `bandEvents` to `emphasis.js`'s `shown`, and both bands are drawn from it.
    // What is checked here is that the strip drew its profile at all.
    await page.eval('document.querySelector(\'[data-view="map"]\').click(); return true;');
    await waitFor(page, 'return !document.getElementById("map").hidden;', 'the map back');
    assert.equal((await page.eval(BAND)).profile, 1, 'the strip says where the events are');
  }, { device: DESK });
});

// 5. A reload remembers the toggle, and a link does not carry it.
test('the toggle is remembered for the reader and never carried by the link', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1700&to=1800'), MAP_READY);
    await page.eval(press);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band to open');
    const href = await page.eval('return location.href;');
    assert.ok(!/band/.test(href), `the URL says nothing about the control: ${href}`);

    // The same reader, the same browser: the band is where they left it.
    await open(page, href, MAP_READY);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band remembered');
    assert.equal((await page.eval(BAND)).expanded, 'true');
    assert.deepEqual((await page.eval(WINDOW)), {
      from: '1700', to: '1800', urlFrom: '1700', urlTo: '1800',
    }, 'and the window is the window the link carries');

    // Somebody else, opening the same link: the window is theirs, the control
    // is not. A link is the picture its sender saw, not how they had arranged
    // their screen.
    await page.eval('try { localStorage.removeItem("atlas-causal.band"); } catch {} return true;');
    await open(page, href, MAP_READY);
    const fresh = await page.eval(BAND);
    assert.equal(fresh.strip, false, 'the link did not bring the control with it');
    assert.equal(fresh.expanded, 'false');
    assert.deepEqual((await page.eval(WINDOW)).urlTo, '1800', 'but it did bring the window');
  }, { device: DESK });
});

// 6. Open, it is a slim strip the reader dismisses — not the strip again.
test('open, the band is a strip over the map and the map keeps the whole pane', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(''), MAP_READY);
    const closed = await page.eval(PANE('.map-area'));
    await page.eval(press);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band to open');

    const opened = await page.eval(PANE('.map-area'));
    assert.deepEqual(opened, closed, 'opening the band took nothing from the map pane');
    assert.equal(opened.height, opened.layoutHeight, 'which is still the whole layout');

    const strip = await page.eval(`
      const box = document.getElementById('map-band-strip').getBoundingClientRect();
      const pane = document.querySelector('.map-area').getBoundingClientRect();
      return { height: Math.round(box.height), pane: Math.round(pane.height), width: Math.round(box.width) };`);
    // The brief's own bound, as a property: it does not take a third of the
    // pane. The number it actually takes is the drawing's business.
    assert.ok(strip.height < strip.pane / 3,
      `the band is a slim strip and not a third of the pane (${strip.height} of ${strip.pane})`);
    assert.ok(strip.height > 0 && strip.width > 0, 'and it is drawn');

    // And it goes away again with the same button that brought it: it does not
    // come back by itself.
    await page.eval(press);
    await waitFor(page, 'return !document.getElementById("map-band-strip");', 'the band dismissed');
    assert.deepEqual(await page.eval(PANE('.map-area')), closed);
  }, { device: DESK });
});

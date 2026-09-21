// M75 in a real browser: the band on the map, from first paint, every visit.
//
// The owner, 21 September: *"still don't like the way years are selected when
// looking at the map, should be more intuitive"* — and: **"The dates
// two-handled band should not be hidden."**
//
// What needs a browser is everything about that sentence: that a reader who
// has pressed nothing and stored nothing arrives with the band already on
// screen, that the map pane is still the whole layout under it (M60's gain,
// which an overlay keeps and a grid row would not), that pulling an end still
// moves the map **while the pointer is still down** (M64's own test), and that
// a phone gets the band too rather than a button.
//
// `tests/m75.test.mjs` holds the rest without a DOM — no toggle anywhere, no
// stored preference, one band, and the masthead's hint answering its own
// question.
//
// Written before the behaviour it judges (deviations 711 and 717). **No test
// here pins a count or a pixel**: what is asserted is the property — the band
// present, the pane the layout's own height, the picture changing under a
// pointer that has not come up — and never a number a later import or a later
// stylesheet would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';

const MAP_READY = 'return Boolean(document.querySelector(".map .mark"));';
const LANES_READY = 'return document.querySelectorAll(".timeline-area svg rect.lane").length > 0;';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1 };

// The band as the reader can see it. There is no toggle to ask about any more,
// so what is asked is whether the strip is in the document, whether it is
// drawn, and whether it carries the window's own slider.
const BAND = `
  const strip = document.getElementById('map-band-strip');
  const box = strip ? strip.getBoundingClientRect() : null;
  return {
    strip: Boolean(strip),
    toggle: Boolean(document.querySelector('.map-band-toggle')),
    dates: [...document.querySelectorAll('button')].filter((b) => /^\\s*dates\\s*$/i.test(b.textContent)).length,
    handles: strip ? strip.querySelectorAll('[data-window]').length : 0,
    profile: strip ? strip.querySelectorAll('path.stub').length : 0,
    valuetext: strip ? (strip.querySelector('[data-window="band"]')?.getAttribute('aria-valuetext') ?? null) : null,
    height: box ? Math.round(box.height) : 0,
    width: box ? Math.round(box.width) : 0,
  };`;

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

// 1. A first visit has the band, with nothing pressed and nothing stored.
test('a first visit to the map has the band on screen, with no button pressed', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // Nothing of M64's preference: not "closed", not "open" — absent, which is
    // what a reader who has never been here has.
    await open(page, url(''), MAP_READY);
    await page.eval('try { localStorage.removeItem("atlas-causal.band"); } catch {} return true;');
    await open(page, url(''), MAP_READY);

    const band = await page.eval(BAND);
    assert.equal(band.strip, true, 'the band is in the document before anybody asks for it');
    assert.equal(band.toggle, false, 'and there is no toggle that could have opened it');
    assert.equal(band.dates, 0, 'nor any other button reading `dates`');
    assert.equal(band.handles, 3, 'the band and its two handles, as on the timeline');
    assert.equal(band.profile, 1, 'with the profile under them saying where the events are');
    assert.match(band.valuetext, /^-?\d+ to -?\d+$/, 'and it says what window it is showing');
    assert.ok(band.height > 0 && band.width > 0, 'and it is drawn and not a zero-sized element');
  }, { device: DESK });
});

// 2. The map pane is still the layout's own height, with the band present.
test('with the band present the map pane is still the whole layout, as M60 left it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1900&to=1999'), MAP_READY);
    assert.equal((await page.eval(BAND)).strip, true, 'the band is there to take room if it were going to');

    const pane = await page.eval(PANE('.map-area'));
    assert.equal(pane.toBottom, 0, 'the map reaches the bottom of the layout');
    assert.equal(pane.height, pane.layoutHeight, 'and it is the whole of it');
    // The property M60 measured, not a pixel count: the old strip left the map
    // about 70 % and this must still be 100 %.
    assert.ok(pane.height > pane.layoutHeight * 0.7,
      `the map is not back to the 70 % the strip left it (${pane.height} of ${pane.layoutHeight})`);

    // And the band over it is a slim strip and not a third of the pane. The
    // bound is the brief's; the number it actually takes is the drawing's.
    const band = await page.eval(BAND);
    assert.ok(band.height < pane.height / 3,
      `the band is a slim strip and not a third of the pane (${band.height} of ${pane.height})`);
  }, { device: DESK });
});

// 3. M64's drag, unchanged but for the press that is no longer needed.
test('pulling an end of the band moves the map while the pointer is still down', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // The whole extent, so there is room to sweep and something to sweep away.
    await open(page, url('?from=1415&to=2025'), MAP_READY);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band');

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

// 4. The masthead still types the same window, and the timeline still has its
//    own band. The two halves of "nothing else changed".
test('the masthead fields still set the window, and the timeline still draws its own band', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1500&to=1600'), MAP_READY);
    const onMap = (await page.eval(BAND)).valuetext;
    assert.equal(onMap, '1500 to 1600', 'the band says the window the link carried');

    // Typed, not dragged: the other half of the pair, writing the same fields.
    await page.eval(`
      const field = document.querySelector('#window-control [data-window="to"]');
      field.value = '1550';
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;`);
    await waitFor(page, "return new URLSearchParams(location.search).get('to') === '1550';",
      'the typed window in the URL');
    assert.equal((await page.eval(BAND)).valuetext, '1500 to 1550',
      'and the band on the map followed the number that was typed');

    // The timeline is untouched: it has the band as a view of its own.
    await page.eval('document.querySelector(\'[data-view="timeline"]\').click(); return true;');
    await waitFor(page, LANES_READY, 'the lanes');
    const onLanes = await page.eval(`return document.querySelector('.timeline-area [data-window="band"]')
      .getAttribute('aria-valuetext');`);
    assert.equal(onLanes, '1500 to 1550', 'one window, said the same way by both drawings');

    // And coming back to the map finds the band where it was left: it is not a
    // mode, so there is nothing to re-enter.
    await page.eval('document.querySelector(\'[data-view="map"]\').click(); return true;');
    await waitFor(page, 'return !document.getElementById("map").hidden;', 'the map back');
    const back = await page.eval(BAND);
    assert.equal(back.strip, true);
    assert.equal(back.valuetext, '1500 to 1550');
  }, { device: DESK });
});

// 5. A link somebody else opens, and a reload: the band is there either way,
//    because there is nothing to remember and nothing to carry.
test('the band is there for every reader of a link, and the link still carries only the window', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1700&to=1800'), MAP_READY);
    const href = await page.eval('return location.href;');
    assert.ok(!/band/.test(href), `the URL says nothing about a control: ${href}`);
    assert.equal((await page.eval(BAND)).strip, true);

    // Somebody else, with a browser that has never been here and a storage key
    // an M64 reader may have left behind saying "closed". Neither decides
    // anything any more.
    await page.eval('try { localStorage.setItem("atlas-causal.band", "closed"); } catch {} return true;');
    await open(page, href, MAP_READY);
    const fresh = await page.eval(BAND);
    assert.equal(fresh.strip, true, 'a value stored by M64 is read into nothing');
    assert.equal(fresh.valuetext, '1700 to 1800', 'and the window is the window the link carries');
  }, { device: DESK });
});

// 6. On a phone the band is not hidden either.
test('on a phone the band is on screen too, and the view still keeps its pane', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1900&to=1999'), MAP_READY);

    const band = await page.eval(BAND);
    assert.equal(band.strip, true, 'the band is on the phone from first paint');
    assert.equal(band.toggle, false, 'and it was not put behind a button again');
    assert.equal(band.handles, 3, 'with both ends to take hold of');
    assert.ok(band.width > 0 && band.height > 0, 'and it is drawn');

    const pane = await page.eval(PANE('.map-area'));
    assert.equal(pane.height, pane.layoutHeight, 'the view is still the layout’s own height');
    // Slim against the screen it is on, which is the phone's own version of
    // the bound the desktop test asserts.
    assert.ok(band.height < pane.height / 4,
      `the band leaves the map the screen (${band.height} of ${pane.height})`);
  }, { device: PHONE, touch: true });
});

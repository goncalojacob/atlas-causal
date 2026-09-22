// M60 in a real browser: the timeline as the third view, the window control
// in the masthead, and the height the map gets back.
//
// The owner, 18 September: "I don't think the bottom timeline on the map is
// still necessary, I think something to choose the timeline is enough". The
// strip is gone from under the map; the timeline is not — it is the only
// picture that shows where history is dense, and a control cannot replace
// that (m60-brief §1).
//
// Written before the behaviour it judges (deviations 711 and 717). **No test
// here pins a count of events**: what is asserted is the property — the pane
// the timeline is given, the window surviving a change of view, the map
// reaching the bottom of the layout — and never a number that a later import
// would make false.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';

const MAP_READY = 'return Boolean(document.querySelector(".map .mark"));';
const LANES_READY = 'return document.querySelectorAll(".timeline-area svg rect.lane").length > 0;';

// Which picture is on screen, from the panes themselves rather than from the
// buttons: a pressed button that showed nothing would pass a test written the
// other way round.
const SHOWN = `return {
  map: !document.getElementById('map').hidden,
  graph: !document.getElementById('graph').hidden,
  timeline: !document.getElementById('timeline').hidden,
  pressed: [...document.querySelectorAll('[data-view]')]
    .filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.view),
  view: new URLSearchParams(location.search).get('view'),
};`;

// The window as the reader can read it. It was the two ends of the masthead's
// control until M76 removed them — the owner, 21 September: *"Picking up the
// dates exactly is unnecessary"* — so it is now what the link carries, which
// is what these tests were ever really asking about: the window survives a
// change of view, and a reload opens on it. The picture that says it is the
// band, and `tests/m76-browser.test.mjs` is where the band is driven.
const WINDOW = `return {
  urlFrom: new URLSearchParams(location.search).get('from'),
  urlTo: new URLSearchParams(location.search).get('to'),
};`;

// A pane against the layout that holds it: how much of it this pane has, and
// whether it reaches the bottom edge. Rounded, because a grid's rows are
// fractions of a pixel and this is a question about a layout and not about a
// pixel.
const PANE = (selector) => `
  const pane = document.querySelector('${selector}');
  const layout = document.querySelector('.layout');
  const box = pane.getBoundingClientRect();
  const whole = layout.getBoundingClientRect();
  return {
    height: Math.round(box.height),
    layoutHeight: Math.round(whole.height),
    toBottom: Math.round(whole.bottom - box.bottom),
    hidden: pane.hidden,
  };`;

// 1. Choosing Timeline gives the timeline the pane, with its lanes and its
//    bars as they are today. It said *and its clusters* until M77, when the
//    stacks and their `+n` badges went and every bar took its title instead.
test('choosing Timeline gives it the whole pane, with the lanes and the titles it always drew', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?view=timeline'), LANES_READY);
    const drawing = await page.eval(`
      const svg = document.querySelector('.timeline-area svg.timeline');
      return {
        lanes: svg.querySelectorAll('rect.lane').length,
        bars: svg.querySelectorAll('rect.bar[data-id]').length,
        stacks: svg.querySelectorAll('rect.bar.stack').length,
        badges: svg.querySelectorAll('text.cluster-count').length,
        handles: svg.querySelectorAll('[data-window]').length,
        ticks: svg.querySelectorAll('text.tick-label').length,
      };`);
    assert.ok(drawing.lanes > 0, 'the lanes');
    assert.ok(drawing.bars > 0, 'the bars');
    assert.equal(drawing.stacks, 0, 'and no stack: every bar is its own bar since M77');
    assert.equal(drawing.badges, 0, 'and no +n');
    assert.equal(drawing.handles, 3, 'the band and its two handles');
    assert.ok(drawing.ticks > 0, 'and the axis');

    const pane = await page.eval(PANE('.timeline-area'));
    assert.equal(pane.hidden, false);
    assert.equal(pane.toBottom, 0, 'the timeline reaches the bottom of the layout');
    assert.equal(pane.height, pane.layoutHeight, 'it is given the whole pane and not a strip of it');
    const shown = await page.eval(SHOWN);
    assert.deepEqual(shown, {
      map: false, graph: false, timeline: true, pressed: ['timeline'], view: 'timeline',
    });
  });
});

// 2. Switching between the three views leaves the window unchanged, and the
//    view is in the URL.
test('the three views switch, the view is in the URL, and the window does not move', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1500&to=1600'), MAP_READY);
    const before = await page.eval(WINDOW);
    assert.deepEqual([before.urlFrom, before.urlTo], ['1500', '1600']);

    const press = (view) => `document.querySelector('[data-view="${view}"]').click(); return true;`;
    // The address bar is written on the next animation frame rather than in
    // the click itself — a forty-frame drag of the band would otherwise be
    // forty history calls, which is Safari's limit in two seconds (state.js,
    // `write`). So the frame is waited for instead of assumed. Reading the URL
    // straight after the click raced that frame and lost about one run in
    // four, always as `the URL says graph` with the view before it still
    // there; nothing about what is asserted changes (M63, docs/m63-load.md).
    const frame = 'return new Promise((resolve) => { requestAnimationFrame(() => resolve(true)); });';
    for (const view of ['graph', 'timeline', 'map', 'timeline', 'graph']) {
      await page.eval(press(view));
      await page.eval(frame);
      const shown = await page.eval(SHOWN);
      assert.deepEqual(shown.pressed, [view], `${view} is the view that is pressed`);
      assert.equal(shown[view], true, `${view} has the pane`);
      assert.equal(shown.view, view === 'map' ? null : view,
        `the URL says ${view} (the default writes nothing)`);
      assert.deepEqual(await page.eval(WINDOW), before, `the window is untouched by ${view}`);
    }
  });
});

// 3. A link sets `from` and `to`, a reload restores them, and the pictures are
//     drawn on them. The half of this that used to type into the masthead's
//     two fields went with the fields (M76); sweeping the band is M76's own
//     test, and this is still the rule underneath both — the window is state
//     and not a preference.
test('a link sets the window, a reload opens on it again, and the timeline draws it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1700&to=1800'), MAP_READY);
    assert.deepEqual(await page.eval(WINDOW), { urlFrom: '1700', urlTo: '1800' });

    // The same link again, from cold: what it carries is what the atlas opens
    // on, which is the whole of why the window is state.
    await open(page, url('?from=1700&to=1800'), MAP_READY);
    assert.deepEqual(await page.eval(WINDOW), { urlFrom: '1700', urlTo: '1800' });
    // And the band on the map is at those years, so the control a reader
    // actually has says what the link says.
    assert.equal(
      await page.eval(`return document.querySelector('#map-band-strip [data-window="band"]').getAttribute('aria-valuetext');`),
      '1700 to 1800',
    );
    // And it is the window the pictures are drawn on: the band the timeline
    // draws is at the same years.
    await page.eval('document.querySelector(\'[data-view="timeline"]\').click(); return true;');
    await waitFor(page, LANES_READY, 'the lanes');
    const band = await page.eval(`const el = document.querySelector('.timeline-area [data-window="band"]');
      return { from: el.getAttribute('aria-valuetext') };`);
    assert.match(band.from, /^1700 to 1800$/);
  });
});

// 4. The map pane is taller than it was with the strip present — the
//    property, not a pixel count.
test('the map has the whole layout’s height now, and so does the graph', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(''), MAP_READY);
    const map = await page.eval(PANE('.map-area'));
    assert.equal(map.hidden, false);
    assert.equal(map.toBottom, 0, 'the map reaches the bottom of the layout: there is no strip under it');
    assert.equal(map.height, map.layoutHeight, 'and it is the whole of the pane');
    // Which is taller than it was: the strip took a row of its own, and the
    // row was `var(--timeline-height, 30vh)`. The property is that the map
    // pane is the layout, so the assertion is the difference the strip made
    // rather than a number of pixels.
    assert.ok(map.height > map.layoutHeight * 0.7,
      `the map is more than the 70 % the 30vh strip left it (${map.height} of ${map.layoutHeight})`);
    assert.equal(await page.eval('return document.getElementById("timeline").hidden;'), true,
      'and the timeline is not drawn beside it');

    await page.eval('document.querySelector(\'[data-view="graph"]\').click(); return true;');
    await waitFor(page, 'return Boolean(document.querySelector(".graph svg, .graph-area svg"));', 'the graph');
    const graph = await page.eval(PANE('.graph-area'));
    assert.equal(graph.toBottom, 0, 'the graph too reaches the bottom');
    assert.equal(graph.height, graph.layoutHeight);
  });
});

// 5. The count of what the map is looking at lives where a reader still sees
//    it, on
//    every view rather than on the strip that is gone. No count is pinned:
//    what is asserted is that the sentence is there, that it counts the
//    smaller number of the two, and that the pin gives the world back.
test('the count of what the map is looking at is in the masthead, on every view', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?bbox=-12,36,-4,45'), MAP_READY);
    const READ = `const note = document.querySelector('#window-control .window-view');
      return {
        hidden: note.hidden,
        text: (note.querySelector('.window-count')?.textContent ?? '').trim(),
        pin: Boolean(note.querySelector('.pin')),
      };`;
    await waitFor(page, `const note = document.querySelector('#window-control .window-view');
      return !note.hidden && /in view/.test(note.textContent);`, 'the count in the masthead');
    const seen = await page.eval(READ);
    // Since M80 the sentence says what it counts: the main events at rest, of
    // the active corpus. Still no count pinned — what is asserted is the shape
    // of the sentence and that the smaller of the two numbers is the picture.
    assert.match(seen.text, /^\d+ main events? of \d+ in view$/);
    const [shown, whole] = seen.text.match(/^(\d+) main events? of (\d+)/).slice(1).map(Number);
    assert.ok(shown <= whole, `${shown} of ${whole}`);
    assert.ok(seen.pin, 'and the pin that gives the world back');

    // On the timeline too, where the strip used to say it.
    await page.eval('document.querySelector(\'[data-view="timeline"]\').click(); return true;');
    await waitFor(page, LANES_READY, 'the lanes');
    assert.equal((await page.eval(READ)).hidden, false, 'the count is still there on the timeline');

    await page.eval('document.querySelector(\'#window-control .pin\').click(); return true;');
    await waitFor(page, 'return !/bbox=/.test(location.search);', 'the world back');
    assert.equal((await page.eval(READ)).hidden, true, 'and it says nothing about a map looking at everything');
  });
});

// 6. The density hint that stood beside the control was removed by M76, with
//     the two fields and for the same sentence: the band over the map draws
//     the profile now, over the selection and at its own scale, and two
//     profiles on one row — one of which never narrows — is the fault M76's
//     first section is about. Nothing replaces this test here;
//     `tests/m76.test.mjs` asserts the hint is gone and `tests/m76-browser`
//     asserts what the band draws instead.

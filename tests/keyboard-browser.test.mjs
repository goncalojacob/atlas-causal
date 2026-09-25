// The map's marks and the timeline's bars from the keyboard alone.
//
// Nothing in either pane could be reached that way: a <circle> and a <rect>
// are not buttons and there are no buttons to be had inside an <svg>, so the
// only focusable things in the two panes were the export button, the pin and
// the band's three handles — five, measured (health review B, finding 11).
//
// Driven, because focus, Tab order and key handling are the browser's and
// cannot be checked against a rendered string.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, waitFor, skip, manifestOf, settledShards,
} from './browser.mjs';

const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });
const READY = 'return Boolean(document.querySelector(".map .mark"));';

// Press a key on whatever has the focus, as the browser would.
const press = (key, options = '{}') => `
  const el = document.activeElement;
  const init = { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true, ...${options} };
  el.dispatchEvent(new KeyboardEvent('keydown', init));
  return true;`;

const FOCUSED = `const el = document.activeElement;
  return el ? {
    tag: el.tagName,
    id: el.getAttribute('data-id'),
    key: el.getAttribute('data-id') ?? 'cluster:' + el.getAttribute('data-cluster'),
    lane: el.getAttribute('data-lane'),
    role: el.getAttribute('role'),
    label: el.getAttribute('aria-label'),
    tabindex: el.getAttribute('tabindex'),
  } : null;`;

test('every mark on the map is a control with a name, and Enter opens it', { skip }, async () => {
  await desk(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);

    const marks = await page.eval(`return [...document.querySelectorAll('#map > svg.map circle.mark')].map((el) => ({
      id: el.getAttribute('data-id'),
      cluster: el.getAttribute('data-cluster'),
      tabindex: el.getAttribute('tabindex'),
      role: el.getAttribute('role'),
      label: el.getAttribute('aria-label'),
    }));`);
    assert.ok(marks.length > 0);
    for (const mark of marks) {
      assert.equal(mark.tabindex, '0', 'every mark is in the tab order');
      assert.equal(mark.role, 'button');
      assert.ok(mark.label && mark.label.length > 0, 'and says what it is');
    }
    // The hit circle behind each mark is not a second tab stop.
    const hits = await page.eval(`return [...document.querySelectorAll('#map circle.hit')]
      .filter((el) => el.hasAttribute('tabindex')).length;`);
    assert.equal(hits, 0);

    // Focus one and press Enter: the record opens, and the focus survives the
    // redraw that follows.
    await page.eval(`document.querySelector('#map circle.mark[data-id="fixture-event-b"]').focus(); return true;`);
    await page.eval(press('Enter'));
    await waitFor(
      page,
      'return new URLSearchParams(location.search).get("selected") === "fixture-event-b";',
      'Enter to open the record',
    );
    assert.equal((await page.eval(FOCUSED)).id, 'fixture-event-b', 'the mark keeps the focus');

    // And Space does what Enter does.
    await page.eval(`document.querySelector('#map circle.mark[data-id="fixture-event-d"]').focus(); return true;`);
    await page.eval(press(' '));
    await waitFor(
      page,
      'return new URLSearchParams(location.search).get("selected") === "fixture-event-d";',
      'Space to open the record',
    );
  });
});

test('the lanes are one tab stop each, and the arrows walk along a lane', { skip }, async () => {
  await desk(async (page, url) => {
    // Grouped by region, so the lanes are named and there are several of them,
    // and on the timeline's own view since M60.
    await open(page, url('?fixtures=1&group=region&view=timeline'),
      'return document.querySelectorAll("#timeline [data-bar]").length > 0;');
    // **Every century first.** Since M77 the rows are packed so that no two
    // titles overlap, and a title arrives with its century (attributes.js), so
    // a shard landing repacks the lanes — a bar that was in `row-0` is in
    // `row-1` on the next frame. Reading the lanes on one frame and their
    // order on another was a race the test happened to win while the atlas
    // opened on one century (M85, A4) and loses now that it opens on all of
    // them. Waiting is how the fact is read where it holds; the assertions are
    // unchanged.
    await waitFor(page, `return document.querySelectorAll('#timeline rect.bar[data-id]').length > 0
      && [...document.querySelectorAll('#timeline .layer-barLabels text')].length > 0;`, 'the titles');
    // **And then every shard the manifest names, and a settle across a frame**
    // (M87 §3, review B6). The wait above is satisfied by the *first* century to
    // land, and the atlas opens on all of them: a later shard arriving between
    // the read below and the arrow presses repacks the lanes under the order this
    // test then walks, which is how the check went red on run 1565 with `End`
    // landing on `fixture-event-deep-1969` where `order` said 2025.
    //
    // What stood here was "the lane, x and id of every bar the same on two polls
    // 50 ms apart", which is 50 ms of stillness — and any two shard landings
    // more than 50 ms apart satisfy it, which on a loaded runner they routinely
    // are. So the wait is now the thing itself: every attribute shard the fixture
    // manifest lists has arrived (`settledShards`, which fails saying how far the
    // page got), and then the packing is the same across an animation frame
    // *inside the page* rather than across two polls of the protocol. The
    // assertions below are unchanged.
    await settledShards(page, await manifestOf({ fixtures: true }));
    const packing = `return [...document.querySelectorAll('#timeline [data-bar]')]
      .map((el) => el.getAttribute('data-lane') + '@' + el.getAttribute('x') + '#'
        + (el.getAttribute('data-id') ?? 'cluster:' + el.getAttribute('data-cluster')))
      .sort().join('|');`;
    await waitFor(page, `const read = () => { ${packing} };
      return new Promise((resolve) => {
        const was = read();
        requestAnimationFrame(() => setTimeout(() => resolve(was === read()), 0));
      });`, 'the lanes to stop repacking across a frame');
    const settled = await page.eval(packing);

    // Both in one evaluation, off one frame, for the same reason.
    const seen = await page.eval(`const out = {};
      for (const el of document.querySelectorAll('#timeline [data-bar]')) {
        const lane = el.getAttribute('data-lane');
        out[lane] = out[lane] ?? [];
        out[lane].push(el);
      }
      const lanes = {};
      for (const lane of Object.keys(out)) {
        out[lane].sort((a, b) => Number(a.getAttribute('x')) - Number(b.getAttribute('x')));
        lanes[lane] = out[lane].map((el) => ({
          tabindex: el.getAttribute('tabindex'),
          key: el.getAttribute('data-id') ?? 'cluster:' + el.getAttribute('data-cluster'),
        }));
      }
      return lanes;`);
    const names = Object.keys(seen);
    assert.ok(names.length > 1, `more than one lane has bars (${names.join(', ')})`);
    for (const lane of names) {
      const reachable = seen[lane].filter((bar) => bar.tabindex === '0');
      assert.equal(reachable.length, 1, `lane ${lane} is one tab stop, not ${seen[lane].length}`);
    }

    // Along the lane with the arrows, in the order the bars are drawn in.
    const busiest = names.map((lane) => ({ lane, n: seen[lane].length })).sort((a, b) => b.n - a.n)[0];
    assert.ok(busiest.n > 1, 'a lane with somewhere to walk to');
    const order = seen[busiest.lane].map((bar) => bar.key);
    // The order the arrows are about to walk is the settled one and not a
    // frame the test happened to catch. Said as an assertion rather than left
    // to the wait: a shard that lands anyway should be reported as what it is,
    // not as an arrow key that went to the wrong bar.
    assert.equal(await page.eval(packing), settled, 'the lanes did not repack while the order was read');

    await page.eval(`document.querySelector('#timeline [data-bar][tabindex="0"][data-lane=' + JSON.stringify(${JSON.stringify(busiest.lane)}) + ']').focus(); return true;`);
    assert.equal((await page.eval(FOCUSED)).lane, busiest.lane);
    await page.eval(press('ArrowRight'));
    let now = await page.eval(FOCUSED);
    assert.equal(now.key, order[1], 'the arrow moves to the next bar in the lane');
    assert.equal(now.role, 'button');
    assert.equal(now.tabindex, '0', 'and the tab stop moves with it');
    await page.eval(press('ArrowLeft'));
    assert.equal((await page.eval(FOCUSED)).key, order[0]);
    await page.eval(press('End'));
    assert.equal((await page.eval(FOCUSED)).key, order[order.length - 1]);
    await page.eval(press('Home'));
    assert.equal((await page.eval(FOCUSED)).key, order[0]);

    // Enter on a focused bar opens the record, and the focus is given back to
    // the bar that stands for it after the lanes have been drawn again.
    const single = await page.eval(`const el = [...document.querySelectorAll('#timeline [data-bar][data-id]')][0];
      el.focus();
      return el.getAttribute('data-id');`);
    await page.eval(press('Enter'));
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get("selected") === ${JSON.stringify(single)};`,
      'Enter to open the record from the timeline',
    );
    assert.equal((await page.eval(FOCUSED)).id, single, 'the bar keeps the focus');
  });
});

// --- the three pictures are groups, not images ------------------------------
//
// **`role="img"` on a picture made of controls** (M88 §6, the third review,
// finding B6). The map's root and the graph's carried it; the timeline's has
// been `role="group"` since M60. An `img` is a leaf: the marks inside it are
// buttons with names, and the announcement of the pane was one label with
// everything under it thrown away — so the keyboard could walk into a picture
// a screen reader had just described as a single image. One word each, and
// the name each root already carries stays exactly as it was.
test('the three view roots are groups with names, and none of them is an image', { skip }, async () => {
  await desk(async (page, url) => {
    // The graph and the timeline are built when the reader first asks for
    // them (main.js), so each is visited rather than looked for in a pane
    // that has never been opened.
    for (const [name, selector, at, ready] of [
      ['map', '#map svg.map', '', READY],
      ['graph', '#graph svg.graph', '?view=graph', 'return Boolean(document.querySelector("#graph circle.node"));'],
      ['timeline', '#timeline svg.timeline', '?view=timeline', 'return Boolean(document.querySelector("#timeline [data-bar]"));'],
    ]) {
      // eslint-disable-next-line no-await-in-loop
      await open(page, url(at), ready);
      // eslint-disable-next-line no-await-in-loop
      const root = await page.eval(`
        const el = document.querySelector(${JSON.stringify(selector)});
        return el ? { role: el.getAttribute('role'), label: el.getAttribute('aria-label') } : null;`);
      assert.ok(root, `the ${name}'s root is in the document`);
      assert.equal(root.role, 'group', `the ${name} is a group and not an image`);
      assert.ok(root.label && root.label.trim().length > 0, `the ${name} says what it is`);
    }
  });
});

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
import { withBrowser, open, waitFor, named, skip } from './browser.mjs';

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
    //
    // **The wait has to be `named()` and not a count of labels.** This waited
    // for one label to exist, which the first century satisfies at once while
    // every later one is still `still loading` — and M78 measured that exact
    // wait and wrote `named()` to replace it (`docs/m78-flakes.md` §3: "a
    // count of labels is the same number on either side of a shard landing").
    // It stayed here because the test was green until the atlas began opening
    // on every century, and then it went red on the runner twice running with
    // `End` reaching `fixture-event-deep-1969` where the order read a frame
    // earlier said `fixture-event-deep-2025`: the packing had moved under it.
    // `named()` is true only when no bar is still loading, so every shard the
    // drawn bars need has landed and the packing is the one the walk walks.
    await waitFor(page, named('#timeline rect.bar[data-id]'), 'every bar to carry its own name');

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

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
import { withBrowser, open, waitFor, skip } from './browser.mjs';

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

    const marks = await page.eval(`return [...document.querySelectorAll('#map circle.mark')].map((el) => ({
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
    // Grouped by region, so the lanes are named and there are several of them.
    await open(page, url('?fixtures=1&group=region'), READY);

    const lanes = await page.eval(`const out = {};
      for (const el of document.querySelectorAll('#timeline [data-bar]')) {
        const lane = el.getAttribute('data-lane');
        out[lane] = out[lane] ?? [];
        out[lane].push(el.getAttribute('tabindex'));
      }
      return out;`);
    const names = Object.keys(lanes);
    assert.ok(names.length > 1, `more than one lane has bars (${names.join(', ')})`);
    for (const lane of names) {
      const reachable = lanes[lane].filter((t) => t === '0');
      assert.equal(reachable.length, 1, `lane ${lane} is one tab stop, not ${lanes[lane].length}`);
    }

    // Along the lane with the arrows, in the order the bars are drawn in.
    const busiest = names.map((lane) => ({ lane, n: lanes[lane].length })).sort((a, b) => b.n - a.n)[0];
    assert.ok(busiest.n > 1, 'a lane with somewhere to walk to');
    const order = await page.eval(`return [...document.querySelectorAll('#timeline [data-bar]')]
      .filter((el) => el.getAttribute('data-lane') === ${JSON.stringify(busiest.lane)})
      .sort((a, b) => Number(a.getAttribute('x')) - Number(b.getAttribute('x')))
      .map((el) => el.getAttribute('data-id') ?? 'cluster:' + el.getAttribute('data-cluster'));`);

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

// The introduction in a real browser: that a reader who opens the atlas with
// nothing selected sees it, that it goes when they dismiss it and stays gone,
// that the "?" brings it back, and that it never covers a link somebody was
// sent (health review A, finding 17; H7 item 1).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';

// Nothing here is a first-card wait: with nothing open there is no panel
// (H1c), so what says the atlas arrived is the timeline.
const ready = 'return Boolean(document.querySelector(".timeline-area svg"));';
const visible = 'return document.getElementById("intro").hidden === false;';
const gone = 'return document.getElementById("intro").hidden === true;';

test('opening the atlas with nothing selected shows the introduction', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(''), ready);
    await waitFor(page, visible, 'the introduction');

    // It quotes the atlas rather than describing it: the counts are the
    // atlas's own, and every way in names a record.
    const text = await page.eval('return document.querySelector(".intro-card").textContent.replace(/\\s+/g, " ");');
    assert.match(text, /\d+ events · \d+ links/);
    assert.match(text, /Follow the consequences/);
    const ways = await page.eval(`return [...document.querySelectorAll('.intro-card [data-intro="event"], .intro-card [data-intro="narrative"]')]
      .map((el) => [el.dataset.intro, el.dataset.id]);`);
    assert.ok(ways.length > 0, 'the card offers a way in');

    // "Start here" opens the first narrative at its first step, and the card
    // goes with the click.
    const narrative = ways.find(([kind]) => kind === 'narrative');
    assert.ok(narrative, 'there is a walk to start on');
    await page.eval(`document.querySelector('.intro-card [data-intro="narrative"][data-id="${narrative[1]}"]').click(); return true;`);
    await waitFor(page, gone, 'the introduction to go');
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('narrative') === '${narrative[1]}'
        && new URLSearchParams(location.search).get('step') === '0';`,
      'the walk to open at its first step',
    );
  });
});

test('dismissing it is remembered, and the "?" brings it back', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(''), ready);
    await waitFor(page, visible, 'the introduction');
    await page.eval('document.querySelector(\'.intro-card .intro-close\').click(); return true;');
    await waitFor(page, gone, 'it to go');

    // A reload is the same reader: it stays gone.
    await open(page, url(''), ready);
    assert.equal(await page.eval(gone), true, 'dismissed once is dismissed');

    // And the "?" is the way back, so dismissing it is never a door closing.
    await page.eval('document.getElementById("intro-button").click(); return true;');
    await waitFor(page, visible, 'the introduction to come back');
    assert.equal(await page.eval('return document.getElementById("intro-button").getAttribute("aria-expanded");'), 'true');
    // Escape closes it, as it closes every other overlay here.
    await page.eval('document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return true;');
    await waitFor(page, gone, 'Escape to close it');
  });
});

test('a link to a record opens on the record, not on an introduction', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    assert.equal(await page.eval(gone), true, 'a link somebody was sent is not a first visit');
    assert.equal(
      await page.eval('return document.querySelector(".panel .event-head h2")?.textContent ?? null;'),
      '25 April',
    );
  });
});

test('a dismissed introduction does not swallow the clicks on the map behind it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // The overlay is `position: fixed; inset: 0`, and its own `display: flex`
    // beats the browser's `[hidden]` rule: without the rule that turns it off
    // it stays over the whole page and eats every click on the view.
    await seenIntro(page);
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark:not(.cluster)"));');
    const covering = await page.eval(`const el = document.getElementById('intro');
      return getComputedStyle(el).display !== 'none';`);
    assert.equal(covering, false, 'a hidden overlay is not drawn');
    const point = await page.eval(`const mark = document.querySelector('.map .mark:not(.cluster)');
      const box = mark.getBoundingClientRect();
      const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return at === mark || mark.contains(at) || at?.closest('.map') !== null;`);
    assert.equal(point, true, 'the mark is what is under the pointer');
  });
});

// narratives.html in a real browser: that it loads from the index, that the
// cards are grouped, and that a title opens the account at its first step
// with the atlas following. The markup is a pure function held in
// tests/narratives-page.test.mjs; what needs a browser is the page.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

const READY = 'return document.querySelectorAll(".narrative-card").length > 0;';

// This read the page when the dataset held one narrative. M57 wrote a second
// and it is a wide one — `who-was-buying` runs 1530 to 2023, so the page lists
// it under six centuries, which is the page's own rule about an account that
// crosses more than one applied to an account that crosses six. The cards are
// found by title rather than by position, so the next narrative to land moves
// nothing here.
test('the page lists each narrative in the dataset, under the centuries it crosses', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('narratives.html'), READY);
    const page1 = await page.eval(`return {
      periods: [...document.querySelectorAll(".narrative-period h2")].map((h) => h.firstChild.textContent.trim()),
      cards: [...document.querySelectorAll(".narrative-card")].map((c) => ({
        title: c.querySelector("h3 a").textContent,
        href: c.querySelector("h3 a").getAttribute("href"),
        meta: c.querySelector(".narrative-meta").textContent.replace(/\\s+/g, " ").trim(),
        summary: c.querySelector(".narrative-summary").textContent.slice(0, 30),
      })),
      wider: document.documentElement.scrollWidth <= innerWidth,
    };`);
    assert.deepEqual(page1.periods, [
      'The 16th century', 'The 17th century', 'The 18th century',
      'The 19th century', 'The 20th century', 'The 21st century',
    ]);

    const colonial = page1.cards.find((c) => c.title === 'How the colonial war ended the regime');
    assert.ok(colonial, 'the colonial war narrative is on the page');
    assert.equal(colonial.href, 'index.html?narrative=how-the-colonial-war-ended-the-regime&step=0');
    // Narrator, period covered, number of steps — the card's own line.
    // The page is prerendered by the build, which runs with the review flag
    // off, so an account is published under the atlas's own byline (M82, A2).
    // The record still names its authors and `?review=1` still prints them.
    assert.match(colonial.meta, /Atlas causal · 1961–1975 · 12 steps/);
    assert.match(colonial.summary, /^A walk from the first shots/);

    const buying = page1.cards.filter((c) => c.title === 'Who was buying');
    assert.equal(buying.length, 6, 'a card under each century it crosses');
    assert.equal(buying[0].href, 'index.html?narrative=who-was-buying&step=0');
    assert.match(buying[0].meta, /Atlas causal · 1530–2023 · 28 steps/);

    assert.equal(page1.wider, true, 'nothing sticks out sideways');

    // The way back into the atlas and on to the bibliography.
    assert.deepEqual(
      await page.eval('return [...document.querySelectorAll(".bar a")].map((a) => a.getAttribute("href"));'),
      ['index.html', 'sources.html', 'about.html'],
    );
  });
});

test('a card opens the narrative at its first step, and the atlas follows', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('narratives.html'), READY);
    // By name, not by position: the first card on the page is the earliest
    // century's, and since M57 that is a different narrative from this one.
    await page.eval('document.querySelector(\'.narrative-card h3 a[href$="narrative=how-the-colonial-war-ended-the-regime&step=0"]\').click(); return true;');
    await waitFor(page, 'return Boolean(document.querySelector(".panel .narrative-head h2"));', 'the narrative card');

    const at = await page.eval(`const params = new URLSearchParams(location.search);
      return {
        narrative: params.get("narrative"),
        step: params.get("step"),
        selected: params.get("selected"),
        title: document.querySelector(".panel .narrative-head h2").textContent,
        which: document.querySelector(".panel .narrative-head .count").textContent,
        back: document.querySelector(".panel .narrative-head .entry-link a")?.getAttribute("href"),
      };`);
    assert.equal(at.narrative, 'how-the-colonial-war-ended-the-regime');
    assert.equal(at.step, '0');
    assert.equal(at.title, 'How the colonial war ended the regime');
    assert.equal(at.which, 'step 1 of 12', 'step 0 in the URL is step one to the reader');
    // Reading is a mode: the selection is derived from the step and is not
    // written to the link (M12).
    assert.equal(at.selected, null);
    // And the card leads back to the list it came from.
    assert.equal(at.back, 'narratives.html');
  });
});

test('the atlas header, the bibliography and about all lead to the list', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(''), 'return document.querySelectorAll(".panel .intro, .panel .card-section").length > 0;');
    assert.equal(
      await page.eval('return document.querySelector(\'.masthead-links a[href="narratives.html"]\')?.textContent;'),
      'narratives',
      'next to sources and about in the atlas\'s own header',
    );
    assert.deepEqual(
      await page.eval('return [...document.querySelectorAll(".masthead-links a")].map((a) => a.getAttribute("href"));'),
      ['narratives.html', 'sources.html', 'about.html'],
    );

    for (const from of ['sources.html', 'about.html']) {
      await open(page, url(from), 'return document.querySelectorAll(".bar a").length > 0;');
      assert.ok(
        await page.eval('return Boolean(document.querySelector(\'.bar a[href="narratives.html"]\'));'),
        `${from} links to the list`,
      );
    }
  });
});

test('the synthetic set puts one account under both centuries it crosses', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Not READY: since H8 the page is prerendered from the real records, so a
    // `.narrative-card` is on screen before any script has run and would say
    // the page is ready when it is showing the wrong dataset. The badge is
    // the synthetic set's own signal and is raised by the same render.
    await open(page, url('narratives.html?fixtures=1'), 'return !document.getElementById("fixtures-badge").hidden;');
    const seen = await page.eval(`return {
      badge: document.getElementById("fixtures-badge").hidden,
      periods: [...document.querySelectorAll(".narrative-period h2")].map((h) => h.firstChild.textContent.trim()),
      titles: [...document.querySelectorAll(".narrative-card h3 a")].map((a) => a.textContent),
      note: document.querySelector(".bib-summary").textContent.replace(/\\s+/g, " ").trim(),
    };`);
    assert.equal(seen.badge, false, 'the synthetic set says so');
    assert.deepEqual(seen.periods, ['The 12th century', 'The 13th century']);
    assert.deepEqual(seen.titles, ['A synthetic walk from A to T', 'A synthetic walk from A to T']);
    assert.match(seen.note, /1 narrative, arranged by the centuries they cross, an account that crosses two listed under both\./);
  });
});

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

test('the page lists the one narrative in the dataset, under the century it crosses', { skip }, async () => {
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
    assert.deepEqual(page1.periods, ['The 20th century']);
    assert.equal(page1.cards.length, 1);
    assert.equal(page1.cards[0].title, 'How the colonial war ended the regime');
    assert.equal(page1.cards[0].href, 'index.html?narrative=how-the-colonial-war-ended-the-regime&step=0');
    // Narrator, period covered, number of steps — the card's own line.
    assert.match(page1.cards[0].meta, /Claude \(assistant draft, unreviewed\) · 1961–1975 · 12 steps/);
    assert.match(page1.cards[0].summary, /^A walk from the first shots/);
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
    await page.eval('document.querySelector(".narrative-card h3 a").click(); return true;');
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
    await open(page, url('narratives.html?fixtures=1'), READY);
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

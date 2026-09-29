// M89 — what a reader met on the third review, in a real browser. The sections
// of `docs/m89-brief.md` whose subject is the page itself.
//
// Nothing here pins a count or a pixel: every expectation is derived from the
// page it runs against — the corpus's own shard list, the pane's own box, an
// actor chosen out of the records — and the corpus grows by about a hundred
// records a day on two other branches (brief, "Must not").
//
// Written before the behaviour it judges (deviations 711 and 717).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  withBrowser, open, seenIntro, waitFor, until, skip, manifestOf, settledShards,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { LOADING_LABEL } from '../src/attributes.js';

const DESK = { width: 1280, height: 800, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1 };

const MAP_READY = 'return Boolean(document.querySelector("#map svg.map"));';
const CARD_READY = 'return Boolean(document.querySelector(".intro-card"));';

const atlas = await atlasOf(path.join(ROOT, 'data'));

// An actor with events, chosen out of the corpus rather than written down: a
// chip is what names one, and a name is what section 1 is about. The most
// eventful one, so the lens is never empty whatever the day's imports did.
const ACTOR = [...atlas.actors.values()]
  .map((a) => [a.id, (atlas.eventsByActor.get(a.id) ?? []).length])
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? null;

// ─── 1. no id where a title goes, and the card redraws off the atlas (A1) ───

// Every place on the front page that names a record, with the id it names
// beside the text it printed: the intro's ways in, and the masthead's chips.
const NAMES = `
  const rows = [];
  for (const el of document.querySelectorAll('.intro-card [data-intro="event"], .intro-card [data-intro="narrative"]')) {
    rows.push({ where: 'intro', id: el.dataset.id, text: (el.textContent || '').trim() });
  }
  for (const badge of document.querySelectorAll('.lens-chips .lens-badge')) {
    const drop = badge.querySelector('.lens-drop');
    rows.push({
      where: 'chip',
      id: ((drop && drop.dataset.focus) || '').split(':').slice(1).join(':'),
      text: ((badge.querySelector('.lens-name') || {}).textContent || '').trim(),
    });
  }
  return rows;`;
const NAMED = `${NAMES.slice(0, -('return rows;'.length))}
  return rows.length > 0 && rows.every((row) => row.text && row.text !== row.id && row.text !== ${JSON.stringify(LOADING_LABEL)});`;

// The card's ways into an *event*, which are the rows whose shard is a century:
// a narrative has no dates and is filed in the `null` shard, which the page asks
// for in a frame of its own (main.js), so it is not a row a test with no frames
// can expect a name for.
const EVENT_NAMES = `
  return [...document.querySelectorAll('.intro-card [data-intro="event"]')]
    .map((el) => ({ id: el.dataset.id, text: (el.textContent || '').trim() }));`;
const EVENTS_NAMED = `${EVENT_NAMES.replace('return [', 'const rows = [').replace(/;$/, ';')}
  return rows.length > 0 && rows.every((row) => row.text && row.text !== row.id && row.text !== ${JSON.stringify(LOADING_LABEL)});`;

function assertNamed(rows, where, what) {
  assert.ok(rows.length > 0, `${where}: ${what} names a record`);
  for (const row of rows) {
    assert.notEqual(row.text, row.id, `${where}: the ${row.where} prints the id "${row.id}" where a title goes`);
    assert.notEqual(row.text, LOADING_LABEL, `${where}: the ${row.where} for ${row.id} is still loading`);
    assert.ok(row.text.length > 0, `${where}: the ${row.where} for ${row.id} has no name at all`);
  }
}

test('§1: with every shard in, nothing on the front page prints a slug or a loading label', { skip }, async () => {
  const manifest = await manifestOf();
  assert.ok(ACTOR, 'the corpus has an actor with events');
  await withBrowser(async (page, url) => {
    // The card itself: a first visit, so the "seen" flag is not set, and
    // nothing in the URL — a lens of any kind is a picture somebody chose and
    // the card does not cover one (intro.js, `opensOnNothing`).
    await open(page, url(''), MAP_READY);
    await waitFor(page, 'return document.getElementById("intro").hidden === false;', 'the introduction');
    await settledShards(page, manifest);
    await until(page, NAMED);
    assertNamed(await page.eval(NAMES), 'the card at rest', 'the card');

    // And the chips, which is the same shape in the masthead: the reviewer's
    // `lens-japan-graph.png` had every node named and the chip reading
    // "ACTOR loading…".
    await seenIntro(page);
    await open(page, url(`?focus=actor:${ACTOR}`), MAP_READY);
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length > 0;', 'the chip');
    await settledShards(page, manifest);
    await until(page, NAMED);
    assertNamed(await page.eval(NAMES), 'the chip at rest', 'the chip');
  }, { device: DESK });
});

// And the frame that is never run. An animation frame is not served while the
// document is hidden, so the one callback the card used to be redrawn from does
// not happen at all in a background tab: a reader who opened the atlas in a
// second tab and came back to it met the slugs (A1). The frame is taken away
// outright here, which is that case and every other way one can be lost.
const LOSE_FRAMES = `
  window.__frames = [];
  window.requestAnimationFrame = function (fn) { window.__frames.push(fn); return window.__frames.length; };
  Object.defineProperty(document, 'hidden', { get: () => window.__hidden === true });
  Object.defineProperty(document, 'visibilityState', { get: () => (window.__hidden ? 'hidden' : 'visible') });
  window.__hidden = true;
`;

// How many attribute shards have arrived, and a wait for the number to stop
// moving. `settledShards` waits for every shard the build wrote, which is the
// right wait everywhere else; with no frames served it is the wrong one, because
// the centuries outside the window are asked for *in* a frame (main.js). So what
// is waited for here is the page asking for nothing more.
const SHARDS_IN = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;';
async function settledAsks(page, { every = 100, still = 4, tries = 150 } = {}) {
  let last = -1;
  let steady = 0;
  for (let i = 0; i < tries; i += 1) {
    const now = await page.eval(SHARDS_IN);
    steady = now === last && now > 0 ? steady + 1 : 0;
    if (steady >= still) return now;
    last = now;
    await new Promise((resolve) => { setTimeout(resolve, every); });
  }
  assert.fail(`the page was still fetching attribute shards after ${Math.round(tries * every / 1000)} s`);
  return 0;
}

test('§1: a landing whose frame is never run is drawn when the tab comes back', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: LOSE_FRAMES });
    await open(page, url(''), CARD_READY);
    await waitFor(page, 'return document.getElementById("intro").hidden === false;', 'the introduction');
    await settledAsks(page);
    assert.ok(await page.eval('return window.__frames.length > 0;'), 'a frame was asked for and never served');
    // Which is the state the review found: the centuries are in and the card is
    // not. It says it is loading rather than printing a slug — that is section
    // 1's other half, and it is true on either side of what follows.
    const before = await page.eval(EVENT_NAMES);
    assert.ok(before.length > 0, 'the card offers events to open');
    assert.ok(before.every((row) => row.text === LOADING_LABEL),
      `the card was redrawn without a frame: ${JSON.stringify(before)}`);
    for (const row of before) assert.notEqual(row.text, row.id, 'and never a slug, even then');

    // The tab comes back. Nothing else happens: no click, no state change, no
    // second landing, and still not one frame served.
    await page.eval('window.__hidden = false; document.dispatchEvent(new Event("visibilitychange")); return true;');
    await until(page, EVENTS_NAMED);
    const after = await page.eval(EVENT_NAMES);
    assertNamed(after.map((row) => ({ ...row, where: 'intro' })), 'after the tab came back', 'the card');
    for (const row of after) {
      const record = atlas.events.get(row.id);
      assert.ok(record, `${row.id} is a record`);
      assert.equal(row.text, record.title.trim(), `${row.id} is named by its own title`);
    }
  }, { device: DESK });
});

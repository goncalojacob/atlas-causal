// M87 — what breaks at 3,000 events, in a browser. The sections of
// docs/m87-brief.md whose subject is the page itself: first paint's redraws,
// the timeline's height, the lens's cache, and the phone's picture.
//
// Nothing here pins a count or a pixel. Every expectation is derived from the
// corpus the test runs on — the manifest's own shard list, the pane's own
// height — because the corpus grows by about a hundred records a day and a
// number typed here would be a number that goes wrong on its own (brief,
// "Must not").

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, seenIntro, waitFor, skip, manifestOf, settledShards,
} from './browser.mjs';

const DESK = { width: 1280, height: 800, deviceScaleFactor: 1 };

// The map is drawn out of `map.render`, and every render asks the element for
// its own matrix before it asks anything else (`visibleBox` in src/map/map.js).
// So a count of the *turns of the loop* in which the map measured itself is a
// count of the times the picture was made again: the three or four calls one
// drawing makes are one turn, and the microtask that clears the flag cannot run
// until that drawing has finished.
//
// Installed by the test and not by the atlas: nothing under src/ knows this
// exists, and the page behaves exactly as it does for a reader.
const COUNT_DRAWS = `
  window.__draws = 0;
  let inTurn = false;
  const proto = SVGGraphicsElement.prototype;
  const original = proto.getScreenCTM;
  proto.getScreenCTM = function () {
    if (this.classList && this.classList.contains('map') && !inTurn) {
      inTurn = true;
      window.__draws += 1;
      Promise.resolve().then(() => { inTurn = false; });
    }
    return original.apply(this, arguments);
  };
`;

const SHARDS_IN = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;';
const MARKS = 'return document.querySelectorAll("#map .mark").length > 0;';

// §1 (B4). The atlas opens on the whole span, so `attributeShardsIn` returns
// every shard the build wrote: twelve files today, one more with every century
// the corpus grows into. Each of them used to run `remeasure()` — the map, the
// timeline, the graph, the band, the masthead — and `reindexRecords()` before
// it. The landings are coalesced per animation frame now, as the base map's
// own arrivals have been since H4a, so a first paint is a few drawings and not
// one per file.
test('§1: first paint draws the map fewer times than there are attribute shards', { skip }, async () => {
  const manifest = await manifestOf();
  const shards = (manifest.attributeShards ?? []).length;
  assert.ok(shards > 1, 'the corpus is sharded, or this test has nothing to say');
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: COUNT_DRAWS });
    await open(page, url(''), MARKS);
    await waitFor(page, `${SHARDS_IN.slice(0, -1)} >= ${shards};`, `${shards} attribute shards`);
    // And one settle across a frame, so the last batch's own drawing is
    // counted: the coalescing this is about is what defers it.
    await page.eval('return new Promise((resolve) => requestAnimationFrame(() => setTimeout(() => resolve(true), 0)));');
    const draws = await page.eval('return window.__draws;');
    assert.ok(draws < shards,
      `the map was drawn ${draws} times while ${shards} attribute shards landed; one drawing per file is what §1 removes`);
  }, { device: DESK });
});

// §2 (B5). `rowLanes` packed one row per title and no cap, so the resting
// timeline at the whole span was a 2,500-pixel page at 1280 px and a 3,000-pixel
// one at 960 — a reader saw the first thirty rows and a scrollbar, and every
// drag of the band repacked all of it. It is capped at what the pane holds now.
// Nothing is pinned: the pane measures itself and the drawing is compared with
// the pane it was laid out into, whatever the corpus is that day.
const TIMELINE_HEIGHT = `
  const pane = document.querySelector('.timeline-area');
  const svg = pane && pane.querySelector('svg.timeline');
  if (!svg) return null;
  return { pane: pane.clientHeight, drawing: Number(svg.getAttribute('height')) };`;

test('§2: the resting timeline is no taller than its pane', { skip }, async () => {
  const manifest = await manifestOf();
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    for (const [where, query] of [['the whole span', '?view=timeline'], ['a century', '?view=timeline&from=1900&to=1999']]) {
      await open(page, url(query), 'return document.querySelectorAll("#timeline .bar").length > 0;');
      await settledShards(page, manifest);
      await page.eval('return new Promise((resolve) => requestAnimationFrame(() => setTimeout(() => resolve(true), 0)));');
      const { pane, drawing } = await page.eval(TIMELINE_HEIGHT);
      assert.ok(pane > 0, `${where}: the pane measured itself`);
      assert.ok(drawing <= pane,
        `${where}: the drawing is ${drawing} px in a pane of ${pane} px`);
    }
  }, { device: DESK });
});

// §5 (B8). 154 browser tests open the live corpus, whose first paint grows with
// it, and the three private "settled" loops each polled a resource count forty
// times and then returned *whether or not anything had settled* — so on a slow
// run the assertions after them ran against a page still arriving and failed
// with a sentence about lanes or profiles rather than about time. The one wait
// they share now fails, and says how far the page got. No browser is needed to
// hold it to that: what is asserted is the sentence, and a page is two lines.
test('§5: the shard wait fails saying how far the page got', async () => {
  const page = { eval: async () => 3 };
  await assert.rejects(
    () => settledShards(page, { attributeShards: [1, 2, 3, 4, 5] }, { tries: 2, every: 1 }),
    /\b3 of 5 attribute shards arrived$/,
    'the failure names what arrived and what was wanted',
  );
  // And a manifest that shards nothing is nothing to wait for.
  await settledShards({ eval: async () => 0 }, { attributeShards: [] }, { tries: 1, every: 1 });
});

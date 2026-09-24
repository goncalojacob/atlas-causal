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
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBrowser, open, seenIntro, waitFor, until, skip } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESK = { width: 1280, height: 800, deviceScaleFactor: 1 };

const manifestOf = async (root = 'data') => JSON.parse(
  await readFile(path.join(ROOT, root, 'index/manifest.json'), 'utf8'),
);

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

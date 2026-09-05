// The pages on the spine (H3b): what each one actually fetches.
//
// The promise of the whole milestone is one sentence — no page loads the old
// topology any more — and it is a promise about requests, not about code, so
// it is asserted against the requests a real browser made. `performance`'s
// resource timeline is the browser's own record of them; a page that fell
// back to the topology for one card would be caught here and nowhere else.
//
// PAGES grows by one line per commit of H3b, and each line lands with the
// page it names. A page is listed here only once it is fully working on the
// spine.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

// What says the atlas has finished loading. Not the panel's first card: with
// nothing open there is no card, and the empty panel is the page's own
// resting state (main.js).
const ATLAS_READY = 'return document.querySelectorAll(".map .mark, .timeline .bar").length > 0;';

// query, what says the page has finished loading its data.
const PAGES = [
  ['index.html', ATLAS_READY],
  ['entry.html?id=carnation-revolution-1974', 'return document.querySelectorAll(".entry-body").length > 0;'],
];

// Everything the page asked the network for, as the browser recorded it.
const REQUESTS = 'return performance.getEntriesByType("resource").map((e) => e.name);';

for (const [query, ready] of PAGES) {
  test(`${query} loads the spine and never the topology`, { skip }, async () => {
    await withBrowser(async (page, url) => {
      await open(page, url(query), ready);
      // The index files are hashed and immutable, so a name is enough to tell
      // them apart: `topology-` cannot appear in a spine's name or a record's.
      const requests = await page.eval(REQUESTS);
      const named = (part) => requests.filter((name) => name.includes(`/index/${part}`));
      assert.deepEqual(named('topology-'), [], `${query} asked for the topology`);
      assert.equal(named('spine-').length, 1, `${query} asked for the spine once`);
    });
  });
}

test('the atlas draws its three views out of the spine', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html'), ATLAS_READY);
    const drawn = await page.eval(`return {
      marks: document.querySelectorAll(".map .mark").length,
      bars: document.querySelectorAll(".timeline .bar").length,
      lanes: document.querySelectorAll(".timeline .lane").length,
      title: document.querySelector(".panel h2")?.textContent ?? "",
    };`);
    assert.ok(drawn.marks > 10, `${drawn.marks} marks`);
    assert.ok(drawn.bars > 10, `${drawn.bars} bars`);
    assert.ok(drawn.lanes > 0, `${drawn.lanes} lanes`);

    // The graph is built on the first click of the toggle, out of the same
    // atlas, and it is the view that would notice a missing edge first.
    await page.eval('return document.querySelector(\'[data-view="graph"]\').click();');
    await waitFor(page, 'return document.querySelectorAll(".graph .node").length > 0;', 'nodes in the graph');
    const nodes = await page.eval('return document.querySelectorAll(".graph .node").length;');
    assert.ok(nodes > 10, `${nodes} nodes`);
  });
});

// The search box answers off the shard the build folded, which arrives after
// the first frame: what is asserted is that it answers at all, and with the
// records the atlas holds.
test('the search box answers off the search shard', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html'), ATLAS_READY);
    await waitFor(page, 'return performance.getEntriesByType("resource").some((e) => e.name.includes("/index/search-"));', 'the search shard');
    await page.eval(`const input = document.querySelector('#search input[type="search"]');
      input.value = 'lisb';
      input.dispatchEvent(new Event('input'));
      return true;`);
    await waitFor(page, 'return document.querySelectorAll("#search [role=\\"option\\"]").length > 0;', 'search results');
    const labels = await page.eval('return [...document.querySelectorAll("#search .search-label")].map((e) => e.textContent);');
    assert.ok(labels.some((l) => /Lisb/i.test(l)), labels.join(' · '));
  });
});

// The margin, and the stub past it: the timeline still says the dataset
// carries on outside the band, which is what keeps the window from being a
// silent deletion (review finding 28).
test('a narrow window leaves stubs on the timeline and nothing on the map', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?from=2000&to=2025'), ATLAS_READY);
    const drawn = await page.eval(`return {
      stubs: document.querySelectorAll(".timeline .bar.stub").length,
      bars: document.querySelectorAll(".timeline .bar:not(.stub)").length,
      marks: document.querySelectorAll(".map .mark").length,
    };`);
    assert.ok(drawn.stubs > 0, 'the events past the margin are still shown as stubs');
    assert.ok(drawn.bars > 0, 'the events in the window and its margin are bars');
    assert.ok(drawn.marks > 0, 'the window has marks on the map');
  });
});

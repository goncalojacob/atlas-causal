// The pages on the spine (H3b): what each one actually fetches.
//
// It is a promise about requests, not about code, so it is asserted against
// the requests a real browser made. `performance`'s resource timeline is the
// browser's own record of them: a page that quietly fetched the whole graph
// twice, or one that fetched it to list books, would be caught here and
// nowhere else. Until H3c it also caught a page falling back to the old
// graph file, which does not exist to fall back to any more.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

// What says the atlas has finished loading. Not the panel's first card: with
// nothing open there is no card, and the empty panel is the page's own
// resting state (main.js).
const ATLAS_READY = 'return document.querySelectorAll(".map .mark, .timeline .bar").length > 0;';

// query, what says the page has finished loading its data, and how many
// times the page should ask for the spine. One for every page that needs the
// graph at all; none for the bibliography, which has read the sources index
// alone since M10 and needs nothing else — a page that started fetching
// 791 KB to list books would be caught by the zero.
//
// **narratives.html joined it at zero in H8.** Listing the accounts needed
// the whole graph, because a narrative's period is the years of the records
// it walks; the list is now written into the file by the build, and the
// script leaves it alone. The cards are on screen before the first request.
const PAGES = [
  ['index.html', ATLAS_READY, 1],
  ['entry.html?id=carnation-revolution-1974', 'return document.querySelectorAll(".entry-body").length > 0;', 1],
  ['narratives.html', 'return document.querySelectorAll(".narrative-card").length > 0;', 0],
  ['sources.html', 'return document.querySelectorAll(".bib-entry").length > 0;', 0],
  ['contribute.html', 'return document.querySelectorAll(".add-row button").length > 0;', 1],
  ['review.html', 'return document.querySelectorAll(".queue-list .queue-item, .queue-list button").length > 0;', 1],
];

// Everything the page asked the network for, as the browser recorded it.
const REQUESTS = 'return performance.getEntriesByType("resource").map((e) => e.name);';

for (const [query, ready, spines] of PAGES) {
  test(`${query} asks for the spine exactly ${spines} time(s)`, { skip }, async () => {
    await withBrowser(async (page, url) => {
      await open(page, url(query), ready);
      // The index files are hashed and immutable, so a name is enough to tell
      // them apart: `spine-` cannot appear in a record's.
      const requests = await page.eval(REQUESTS);
      const named = (part) => requests.filter((name) => name.includes(`/index/${part}`));
      assert.equal(named('spine-').length, spines, `${query} asked for the spine ${named('spine-').length} times`);
      // I1: 221 KB of lane polygons left every page. The four numbers per
      // lane that answered the viewport question are in the manifest, and the
      // shapes themselves are fetched only by the wash a `regional` event is
      // drawn as (index2-plan, D2) — which no default window here holds.
      assert.equal(
        requests.filter((name) => name.includes('geo/regions.json')).length, 0,
        `${query} fetched the lane polygons: ${requests.join(' · ')}`,
      );
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

// I1: 261 KB of presence metadata left the graph file for one of its own,
// fetched by the territory layer — which is to say after the picture is
// drawn and not before it.
test('index.html draws before the presence file arrives, and draws it when it does', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // ATLAS_READY is a mark or a bar on the screen — the picture the reader
    // came for. The presence file has not necessarily even been asked for at
    // that point, which is the whole claim; what is asserted below is that
    // when it does arrive it arrived second, and that it draws.
    await open(page, url('index.html'), ATLAS_READY);
    await waitFor(page, 'return document.querySelectorAll(".layer-presences .presence").length > 0;', 'territories drawn');
    const order = await page.eval(`return performance.getEntriesByType("resource")
      .filter((e) => /\\/index\\/(spine|presences)-/.test(e.name))
      .sort((a, b) => a.startTime - b.startTime)
      .map((e) => (e.name.includes("/index/spine-") ? "spine" : "presences"));`);
    assert.deepEqual(order, ['spine', 'presences'], `the order they were asked for: ${order.join(' → ')}`);
  });
});

// A4: the polygons are still the only thing that can draw a lane as a shape,
// so the wash a `regional` event is drawn as asks for them — and only then.
// The fixtures hold one such event, from 1260 to 1300.
test('a window holding a regional event fetches the polygons, and one that does not never asks', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?fixtures=1&from=1000&to=1150'), ATLAS_READY);
    const quiet = await page.eval(REQUESTS);
    assert.equal(quiet.filter((name) => name.includes('geo/regions.json')).length, 0, quiet.join(' · '));

    await open(page, url('index.html?fixtures=1&from=1260&to=1300'), ATLAS_READY);
    await waitFor(page, 'return document.querySelectorAll(".layer-regions .region-wash").length > 0;', 'a lane washed');
    const asked = await page.eval(REQUESTS);
    assert.equal(asked.filter((name) => name.includes('geo/regions.json')).length, 1, asked.join(' · '));
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
      rects: document.querySelectorAll("rect.bar.stub").length,
      lanes: document.querySelectorAll(".timeline .lane").length,
      bars: document.querySelectorAll(".timeline .bar:not(.stub)").length,
      marks: document.querySelectorAll(".map .mark").length,
    };`);
    assert.ok(drawn.stubs > 0, 'the events past the margin are still shown as stubs');
    assert.ok(drawn.bars > 0, 'the events in the window and its margin are bars');
    assert.ok(drawn.marks > 0, 'the window has marks on the map');
    // Since H4c the stub is one path per row and never one rect per event:
    // the count is bounded by the lanes, however large the dataset gets.
    assert.equal(drawn.rects, 0, 'no stub is a rect of its own any more');
    assert.ok(drawn.stubs <= drawn.lanes, `${drawn.stubs} strips for ${drawn.lanes} lanes`);
  });
});

// The contribution form, on the spine and on the repository's own records:
// the pickers are filled from it, the duplicate search finds a title that is
// already there, and `checkRules` runs against the whole universe. All three
// are what the form would lose first if a field had been dropped from the
// projection.
test('the form fills its pickers, finds a duplicate and validates, off the spine', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('contribute.html'), 'return document.querySelectorAll(".add-row button").length > 0;');
    // The place picker, typed into: the rows come off the search shard and
    // what stands beside each one — the kind, and how many events happened
    // there — comes off the spine. The `<select>` of every place this
    // replaced is health review B, finding 6.
    const filled = await page.eval(`const add = [...document.querySelectorAll(".add-row button")].find((b) => b.textContent === "Add event");
      add.click();
      const card = document.querySelector("section.entry.event");
      const box = card.querySelector(".field-place .picker input");
      box.value = "lis";
      box.dispatchEvent(new Event("input", { bubbles: true }));
      return {
        rows: [...card.querySelectorAll(".field-place .picker-option")].map((li) => li.textContent.replace(/\\s+/g, " ").trim()),
        regions: card.querySelectorAll(".field-region select option").length,
      };`);
    assert.ok(filled.rows.length > 0, 'the place picker answers off the shard');
    assert.ok(filled.rows.some((t) => /Lisbon/.test(t)), filled.rows.join(' · '));
    assert.ok(filled.rows.every((t) => /place/.test(t) && /links?$/.test(t)), filled.rows.join(' · '));
    assert.ok(filled.regions > 1, `${filled.regions} regions offered`);

    // A title that is already in the atlas, typed into a new event: the form
    // must say so before anything is filed. `aliases` and `title` are what
    // the duplicate search reads, and both are in the spine (h3a-brief, A9).
    await page.eval(`const title = document.querySelector("section.entry.event .field-title input");
      title.value = "Carnation Revolution";
      title.dispatchEvent(new Event("input", { bubbles: true }));
      return true;`);
    await waitFor(page, 'return document.querySelectorAll("section.entry.event .similar li").length > 0;', 'the duplicate warning');
    const similar = await page.eval('return [...document.querySelectorAll("section.entry.event .similar li")].map((li) => li.textContent);');
    assert.ok(similar.some((t) => /carnation/i.test(t)), similar.join(' · '));

    // And the rules, which are the reason the whole file is loaded: an event
    // with no date fails rule 4 in the browser exactly as it does in the CLI.
    const problems = await page.eval('return [...document.querySelectorAll(".entry-errors li")].map((e) => e.textContent).join(" ");');
    assert.ok(problems.length > 0, 'a half-written event has something wrong with it');
  });
});

// The source card's citers, which are not in any index a page loads whole
// since H3b: opening a source costs one request for its own file, and the
// card says it is loading until that file lands.
test('the source card fetches its own citer file and draws the rows', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?source=cshapes-2-0'), 'return document.querySelectorAll(".panel .citers").length > 0;');
    await waitFor(page, 'return document.querySelectorAll(".panel .citers .actor-row").length > 0;', 'the citer rows');
    const card = await page.eval(`return {
      rows: document.querySelectorAll(".panel .citers .actor-row").length,
      count: Number((document.querySelector(".panel .citers .count") || {}).textContent || 0),
      more: (document.querySelector('.panel [data-action="all-citers"]') || {}).textContent || "",
      fetched: performance.getEntriesByType("resource").filter((e) => e.name.includes("/citers-")).length,
    };`);
    assert.equal(card.fetched, 1, 'one citer file, for the source that is open');
    assert.ok(card.count > 1000, `the card says ${card.count} citers`);
    // A7: the first 200 rows, and the rest one button away.
    assert.equal(card.rows, 200);
    assert.match(card.more, /Show the remaining \d+/);
    await page.eval('return document.querySelector(\'.panel [data-action="all-citers"]\').click();');
    await waitFor(page, 'return document.querySelectorAll(".panel .citers .actor-row").length > 200;', 'the rest of the rows');
  });
});

// A record file is served under its own name — `entry.html?id=` is the
// address and a hashed name would break it — so `?v=<revised>` is what tells
// a cache that a corrected record is a different file from the one it kept.
test('a record is fetched with the day it was last revised', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?selected=carnation-revolution-1974'), 'return document.querySelectorAll(".panel .card-section").length > 0;');
    await waitFor(page, 'return performance.getEntriesByType("resource").some((e) => e.name.includes("/events/carnation-revolution-1974.json"));', 'the record');
    const asked = await page.eval(`return performance.getEntriesByType("resource")
      .map((e) => e.name).filter((n) => n.includes("/data/events/") || n.includes("/data/edges/"));`);
    assert.ok(asked.length > 0, 'the card fetched its record');
    for (const name of asked) {
      assert.match(name, /\.json\?v=\d{4}-\d{2}-\d{2}$/, name);
    }
  });
});

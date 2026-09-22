// The pages and the graph file each one reads (H3b, and I4a's switch to the
// core): what each one actually fetches.
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
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  withBrowser, open, waitFor, until, named as allNamed, skip,
} from './browser.mjs';
import { LOADING_LABEL } from '../src/attributes.js';
import { ROOT } from './helpers.mjs';

// How many attribute shards this build has, read off the manifest on disk
// rather than fetched from inside the page: a fetch of the page's own would
// land in `performance`'s resource timeline, which is the thing every
// assertion here is made against.
async function shardCount() {
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'data', 'index', 'manifest.json'), 'utf8'));
  return (manifest.attributeShards ?? []).length;
}

// What says the atlas has finished loading. Not the panel's first card: with
// nothing open there is no card, and the empty panel is the page's own
// resting state (main.js).
const ATLAS_READY = 'return document.querySelectorAll(".map .mark, .timeline .bar").length > 0;';
// And what says the lanes have been drawn, for the tests that are about them:
// since M60 the timeline is a view of its own and a link asks for it (main.js).
const BARS_READY = 'return document.querySelectorAll(".timeline .bar").length > 0;';
// And what says the graph has drawn its nodes: the third view, built the first
// time it is asked for, as the timeline is.
const GRAPH_READY = 'return document.querySelectorAll("svg.graph circle.node[data-id]").length > 0;';

// query, what says the page has finished loading its data, which graph file
// the page reads and how many times it asks for it. One for every page that
// needs the graph at all; none for the bibliography, which has read the sources
// index alone since M10 and needs nothing else — a page that started fetching
// 791 KB to list books would be caught by the zero.
//
// **narratives.html joined it at zero in H8.** Listing the accounts needed
// the whole graph, because a narrative's period is the years of the records
// it walks; the list is now written into the file by the build, and the
// script leaves it alone. The cards are on screen before the first request.
//
// **`core` since I4a**, for the pages that have moved: the whole-corpus file
// they parsed is now the core, which is the graph and what a mark, a bar and a
// lane need, with the titles and the roles arriving a century at a time behind
// it (docs/index2-plan.md, D4). Every page has moved as of I4b, so `spine` is
// here only as the file none of them may ask for — and it is not written any
// more either.
//
// `contribute.html` and `review.html` are whole-universe readers and fetch
// every attribute shard behind their draw (A2), which is a different promise
// from this one and is asserted on its own below. What their rows say is what
// every other row says: the core once, and never the file the core replaced.
const PAGES = [
  ['index.html', ATLAS_READY, 'core', 1],
  ['entry.html?id=carnation-revolution-1974', 'return document.querySelectorAll(".entry-body").length > 0;', 'core', 1],
  ['narratives.html', 'return document.querySelectorAll(".narrative-card").length > 0;', 'core', 0],
  ['sources.html', 'return document.querySelectorAll(".bib-entry").length > 0;', 'core', 0],
  ['contribute.html', 'return document.querySelectorAll(".add-row button").length > 0;', 'core', 1],
  ['review.html', 'return document.querySelectorAll(".queue-list .queue-item, .queue-list button").length > 0;', 'core', 1],
];

// Everything the page asked the network for, as the browser recorded it.
const REQUESTS = 'return performance.getEntriesByType("resource").map((e) => e.name);';

for (const [query, ready, graph, times] of PAGES) {
  test(`${query} asks for the ${graph} exactly ${times} time(s)`, { skip }, async () => {
    await withBrowser(async (page, url) => {
      await open(page, url(query), ready);
      // The index files are hashed and immutable, so a name is enough to tell
      // them apart: `core-` and `spine-` cannot appear in a record's.
      const requests = await page.eval(REQUESTS);
      const named = (part) => requests.filter((name) => name.includes(`/index/${part}`));
      assert.equal(named(`${graph}-`).length, times, `${query} asked for the ${graph} ${named(`${graph}-`).length} times`);
      // And never the other one: a page that read both would be paying for the
      // split twice over, and a page falling back to the file it left would be
      // caught here and nowhere else.
      const other = graph === 'core' ? 'spine' : 'core';
      assert.equal(named(`${other}-`).length, 0, `${query} also asked for the ${other}`);
      // I1: 221 KB of lane polygons left every page. The four numbers per
      // lane that answered the viewport question are in the manifest, and the
      // shapes themselves are fetched only by the wash a `regional` event is
      // drawn as (index2-plan, D2; src/map/layers/regions.js asks the first
      // time there is actually a wash to fill).
      //
      // This read as a flat zero until M62, and could, because **nothing in
      // the corpus was large**: no record carried `scope`, and no parent had
      // parts in more than one lane because there were hardly any parents.
      // The Estado Novo has parts in Europe, Africa and the Americas, so
      // `large.js` calls it regional on the parts alone and the map draws its
      // wash — 221 KB of shapes on a window that holds one. The rule is what
      // is asserted now instead of the corpus, in both directions: a page that
      // asked for the shapes has a wash to show for it, and a page that drew
      // no wash never asked. What the wash costs is STATUS.md's to report and
      // the owner's to decide.
      //
      // Both halves of that rule are read in **one** evaluation, and the
      // reason is M63 (docs/m63-load.md): the shapes are asked for at about
      // the instant the page becomes ready, so `requests` — taken above — and
      // a count of washes taken a round trip later are two different moments,
      // and a page whose fetch landed between them reads as one that drew a
      // wash it never asked for. It is the same rule, sampled where it is
      // true: a wash cannot be on screen before the file it is filled from.
      const wash = await page.eval(`return {
        asked: performance.getEntriesByType('resource').filter((e) => e.name.includes('geo/regions.json')).length,
        washes: document.querySelectorAll('.region-wash').length,
      };`);
      assert.ok(wash.asked <= 1, `${query} asked for the lane polygons ${wash.asked} times: ${requests.join(' · ')}`);
      if (wash.asked === 1) {
        await waitFor(page, 'return document.querySelectorAll(".region-wash").length > 0;', `${query} to draw the wash it fetched the lane polygons for`);
      } else {
        assert.equal(
          wash.washes, 0,
          `${query} drew a wash without ever asking for the shapes`,
        );
      }
      // M36 wrote the base map and M37a draws it. Not one byte of it is
      // fetched **before the first picture**: the far file of a layer the
      // world view reaches goes out behind the same `defer` the territories
      // use — a frame, then a task — and a cell is asked for when the
      // viewport enters it and never before. The only coastline at first
      // paint is still `land-present.json`, which is what `manifest.land`
      // names and what loadAtlas has always fetched (M36 review, A10; M37
      // §5 — this test holds request names and start times, not byte counts,
      // and the measured bytes are in STATUS.md).
      //
      // The browser records when each request began, so this is the
      // assertion the brief asks for and not a proxy for it.
      const base = await page.eval(`
        const paint = performance.getEntriesByType('paint')
          .find((e) => e.name === 'first-contentful-paint');
        const entries = performance.getEntriesByType('resource')
          .filter((e) => e.name.includes('geo/base/'));
        return {
          painted: paint ? paint.startTime : null,
          early: paint ? entries.filter((e) => e.startTime < paint.startTime).map((e) => e.name) : [],
          cells: entries.map((e) => e.name).filter((n) => /geo\\/base\\/[a-z]+\\//.test(n)),
        };`);
      assert.ok(base.painted !== null, `${query} never reported a first contentful paint`);
      assert.deepEqual(base.early, [], `${query} fetched part of the base map before its first picture`);
      // And no cell at all, on any page: at the world view the box is every
      // cell there is, and the near level is not asked for until NEAR_ZOOM
      // (map.js). A page with no map asks for none of it either way.
      assert.deepEqual(base.cells, [], `${query} fetched a base map cell at the world view`);
      // M45b's bands are the one base layer that is **off by default**, so on
      // a page nobody has asked for them they cost nothing at all — not a
      // cell, and not the far file either, which every other layer the world
      // view reaches does fetch behind the `defer`. 5 MB of ground the reader
      // did not ask for is the whole reason `LAYERS` and `DEFAULT_LAYERS` are
      // two lists (deviation 979), and this is where that is worth a byte
      // count rather than an intention: relief is why first paint did not get
      // slower in a milestone that put five megabytes into `data/geo/`.
      //
      // Named rather than left to the `geo/base/` assertions above, which are
      // about *when* a request happened: this one is about there being none.
      const relief = await page.eval(`
        return performance.getEntriesByType('resource')
          .map((e) => e.name).filter((n) => n.includes('geo/base/relief'));`);
      assert.deepEqual(relief, [], `${query} fetched the elevation bands, which nobody switched on`);
    });
  });
}

// The attribute shards, which are the other half of what the switch means: the
// atlas asks for the ones its window needs, and an entry for the centuries its
// own lists span — one shard per century and never the corpus (i4-brief, A3).
// An entry is the unwindowed reader: an actor's events are every century it was
// in, and a cap that dropped one would draw that actor incomplete for ever
// (index2 review, finding 9).
test('entry.html asks for the core and the centuries its lists span, and no more', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('entry.html?id=carnation-revolution-1974'), 'return document.querySelectorAll(".entry-body").length > 0;');
    const shards = await page.eval(SHARDS);
    assert.ok(shards.length > 0, 'the century the record is filed in was asked for');
    assert.equal(new Set(shards).size, shards.length, `a shard twice: ${shards.join(' · ')}`);
    // One record's lists are narrower than the corpus, which is the file this
    // run split: an entry that asked for every century would have moved the
    // whole-corpus parse rather than removed it.
    const every = await shardCount();
    assert.ok(shards.length < every, `${shards.length} of ${every} shards for one record`);
    // And the head is the record's own name, never the id the core falls back
    // to (index2 review, finding 21) — nor the tab's name, which a reader with
    // eleven tabs open is reading them by.
    const head = await page.eval(`return {
      h1: document.querySelector(".entry-head h1")?.textContent ?? "",
      tab: document.title,
    };`);
    assert.ok(head.h1.length > 0, 'the entry has a head');
    assert.notEqual(head.h1, 'carnation-revolution-1974', 'never the id where the name goes');
    assert.ok(!head.tab.startsWith('carnation-revolution-1974'), `the tab is named ${head.tab}`);
  });
});

const SHARDS = 'return performance.getEntriesByType("resource").map((e) => e.name).filter((n) => n.includes("/index/attributes-"));';

// The shards, and the promise the whole split rests on: the picture is on
// screen before the last century has landed, and every bar is named once they
// have. Asserted on the elements and the text and never on a wall-clock
// duration (R3's lesson) — the first assertion is made the moment the bars
// exist, which is before the shards the second one waits for.
//
// A bar with no name yet carries no label and no title element at all: the
// core's fallback is the record's id, and a slug drawn where a title goes
// would be a derived string presented as the name of the thing (attributes.js).
test('the atlas draws its bars before the last century lands, and names them when it has', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?view=timeline'), BARS_READY);
    const every = await shardCount();
    const landed = () => page.eval('return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;');
    assert.ok(every > 1, `${every} attribute shards to arrive`);

    // The picture, before the corpus. Whatever has landed by now, it is not the
    // whole of it, and there are bars on the screen either way.
    const drawn = await page.eval('return document.querySelectorAll(".timeline .bar").length;');
    assert.ok(drawn > 10, `${drawn} bars drawn`);

    await waitFor(page, `return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length >= ${every};`, 'every attribute shard');
    assert.ok(await landed() >= every, 'the shards all arrived');

    // And then the names, on **every** bar the timeline is holding. The <title>
    // is the bar's own tooltip and `aria-label` is what a screen reader calls
    // it; neither may be a record id.
    //
    // Until M58 this exempted the bars M50 found: an attribute row lived in the
    // shard of its event's *start* century, a view fetches the shards its window
    // covers, and an event long enough to reach into the window from an earlier
    // century was drawn with its name in a file nobody asked for. Since M58 a
    // row is in every shard its span touches (docs/m58-shards.md), so there is
    // nothing left to exempt and the exemption is gone.
    await waitFor(page, `return [...document.querySelectorAll(".timeline .bar:not(.stub)")]
      .every((b) => (b.querySelector("title")?.textContent ?? "") !== "" && (b.querySelector("title").textContent !== "still loading"));`, 'every bar named');
    const named = await page.eval(`return [...document.querySelectorAll(".timeline .bar:not(.stub)")].map((b) => ({
      title: b.querySelector("title")?.textContent ?? "",
      label: b.getAttribute("aria-label") ?? "",
      id: b.getAttribute("data-id") ?? "",
    }));`);
    assert.ok(named.length > 10, `${named.length} bars`);
    for (const bar of named) {
      assert.notEqual(bar.title, '', 'a bar with no tooltip at all');
      assert.notEqual(bar.title, 'still loading', `${bar.id} is still waiting after every shard landed`);
      // The one that would go unnoticed: a title that is the record's id.
      if (bar.id) assert.ok(!bar.title.startsWith(bar.id), `${bar.id} is labelled with its own id`);
      assert.equal(bar.label === '' , false, 'a control nobody can name');
    }
  });
});

// And the same promise on the view that is not windowed. Since M76 the graph
// draws every date whatever the band says (owner, 21 September), while the
// shards held on screen were still the band's: the rest were fetched unpinned,
// the cap of four evicted the oldest of them, and every record carried only by
// an evicted shard lost its title. Three marks of eighty-seven on the URL below
// were drawn and never named — the same three every round, ten seconds after
// the last shard had landed — which is a reader looking at a picture the atlas
// has the names for and will not say (M78, docs/m78-flakes.md).
//
// A band narrow enough to pin two centuries and a graph that draws six is the
// whole of the case, so the window here is deliberate and not decoration.
test('the graph names every mark it draws, however narrow the band', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?view=graph&from=1900&to=1999'), GRAPH_READY);
    const every = await shardCount();
    await waitFor(page, `return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length >= ${every};`, 'every attribute shard');
    // The assertion, waited for as itself: `until`, so a mark that never gets
    // its name is reported below with its id and not as a timeout.
    await until(page, allNamed('svg.graph circle.node[data-id]'));

    const marks = await page.eval(`return [...document.querySelectorAll('svg.graph circle.node[data-id]')].map((m) => ({
      id: m.getAttribute('data-id'),
      title: m.querySelector('title')?.textContent ?? '',
    }));`);
    assert.ok(marks.length > 10, `${marks.length} marks on the graph`);
    const unnamed = marks.filter((m) => m.title === '' || m.title.startsWith(LOADING_LABEL));
    assert.deepEqual(unnamed.map((m) => m.id), [],
      'a mark the graph drew and the atlas will not name');
  });
});

test('the atlas draws its three views out of the core', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html'), ATLAS_READY);
    const marks = await page.eval('return document.querySelectorAll(".map .mark").length;');
    assert.ok(marks > 10, `${marks} marks`);

    // The timeline is the second of the three and is built on the first click
    // of its button, out of the same atlas (M60).
    await page.eval('return document.querySelector(\'[data-view="timeline"]\').click();');
    await waitFor(page, BARS_READY, 'bars in the lanes');
    const drawn = await page.eval(`return {
      bars: document.querySelectorAll(".timeline .bar").length,
      lanes: document.querySelectorAll(".timeline .lane").length,
    };`);
    assert.ok(drawn.bars > 10, `${drawn.bars} bars`);
    assert.ok(drawn.lanes > 0, `${drawn.lanes} lanes`);

    // The graph is the third, out of the same atlas again, and it is the view
    // that would notice a missing edge first.
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
      .filter((e) => /\\/index\\/(core|presences)-/.test(e.name))
      .sort((a, b) => a.startTime - b.startTime)
      .map((e) => (e.name.includes("/index/core-") ? "core" : "presences"));`);
    assert.deepEqual(order, ['core', 'presences'], `the order they were asked for: ${order.join(' → ')}`);
  });
});

// M48 §2: which polities an event happened inside is a file of its own, and it
// is not part of first paint. A page nobody has selected a polity in never
// asks for it at all, which is what keeps the widened actor lens free: the
// join is 83 rows on this corpus and would be one more whole-corpus parse on
// every page load if it were in the core.
test('the grounds are asked for by a lens on an actor and by nothing else', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html'), ATLAS_READY);
    const quiet = await page.eval(REQUESTS);
    assert.equal(quiet.filter((name) => name.includes('/index/grounds-')).length, 0,
      'nothing on the page has asked which ground an event is on');

    // And an open actor is a lens on itself (lens.js), so opening one is what
    // asks. Waited for: it is fetched behind the picture, never in front.
    await open(page, url('index.html?actor=portugal&from=1800&to=2030'), ATLAS_READY);
    await waitFor(
      page,
      "return performance.getEntriesByType('resource').map((e) => e.name)"
        + ".filter((name) => name.includes('/index/grounds-')).length === 1;",
      'the grounds file to be asked for once',
    );
  });
});

// M54: and the territorial join beside it — every event inside the union of a
// polity's outlines, at any date — is a second file under the same discipline.
// First paint costs what it did: it is fetched when a lens first asks, and
// until it lands the lens is what it was, a frame of the old picture.
test('the territories are asked for by a lens on an actor and by nothing else', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html'), ATLAS_READY);
    const quiet = await page.eval(REQUESTS);
    assert.equal(quiet.filter((name) => name.includes('/index/territories-')).length, 0,
      'nothing on the page has asked what stands on whose ground');

    await open(page, url('index.html?actor=portugal&from=1800&to=2030'), ATLAS_READY);
    await waitFor(
      page,
      "return performance.getEntriesByType('resource').map((e) => e.name)"
        + ".filter((name) => name.includes('/index/territories-')).length === 1;",
      'the territories file to be asked for once',
    );
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
    // **The shard is asked for when the box is touched** (M83, A13): 762 KB on
    // every visit for a reader who may never type is the largest single thing
    // the page fetches. So the wait for it comes after the typing, not before;
    // until it lands the box answers out of the atlas, which is the same
    // fallback a failed fetch has always had.
    await page.eval(`const input = document.querySelector('#search input[type="search"]');
      input.focus();
      input.value = 'lisb';
      input.dispatchEvent(new Event('input'));
      return true;`);
    await waitFor(page, 'return performance.getEntriesByType("resource").some((e) => e.name.includes("/index/search-"));', 'the search shard');
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
    await open(page, url('index.html?from=2000&to=2025&view=timeline'), BARS_READY);
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

// The contribution form, on the core plus every attribute shard and on the
// repository's own records: the pickers are filled from it, the duplicate
// search finds a title that is already there, and `checkRules` runs against the
// whole universe. All three are what the form would lose first if a field had
// been dropped from the projection — or, since I4b, if a shard had been left
// out of the corpus it holds (A2).
//
// The verdict on the page is what says the corpus is in: until then the report
// says it is still loading and nothing has been judged (form.js).
test('the form fills its pickers, finds a duplicate and validates, off the core and every shard', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('contribute.html'), 'return Boolean(document.querySelector(".contrib .report .summary"));');
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


// A2: `contribute.html` is a whole-universe reader — rule 21 asks whether a
// `wikidata` id is unique across the atlas, `findSimilar` reads every title —
// so it holds the whole corpus and not a window of it. What it may not do is
// wait for it: the form is on the page first, and the shards and the search
// shard arrive behind it.
//
// The 2.0 MB the brief holds this page to is the second half of the same
// promise: at 10^4 the search shard alone is 2.75 MB, so a page that awaited it
// could not meet the line however small the core became.
test('contribute.html draws on the core alone and then fetches every attribute shard', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('contribute.html'), 'return document.querySelectorAll(".add-row button").length > 0;');
    await drawsThenHoldsTheCorpus(page);
  });
});

// The dashboard is the same reader for the same reason — rule 17, the referrer
// warnings and rule 21 are all over the whole atlas — and it draws its queue
// out of the review shards, which carry their own digests and wait for none of
// this (i4-brief, section 1.4 and A2, A6).
test('review.html draws on the core alone and then fetches every attribute shard', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('review.html'), 'return document.querySelectorAll(".queue-item").length > 0;');
    await drawsThenHoldsTheCorpus(page);
  });
});

// What both writer pages promise, which is the same promise twice: the core
// once and never the spine before anything is drawn, then every attribute
// shard exactly once, then the search shard.
async function drawsThenHoldsTheCorpus(page) {
  const drawn = await page.eval(REQUESTS);
  const index = (part) => drawn.filter((name) => name.includes(`/index/${part}`)).length;
  assert.equal(index('core-'), 1, 'the core, once');
  assert.equal(index('spine-'), 0, 'and never the file it replaced');

  const every = await shardCount();
  await waitFor(page, `return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length >= ${every};`, 'every attribute shard');
  const after = await page.eval(SHARDS);
  assert.equal(new Set(after).size, every, `${new Set(after).size} of ${every} shards, once each`);
  assert.equal(after.length, every, `a shard asked for twice: ${after.join(' · ')}`);
  // And the search shard, which the pickers read and which the page does not
  // wait for either.
  await waitFor(page, 'return performance.getEntriesByType("resource").some((e) => e.name.includes("/index/search-"));', 'the search shard');
}

// narratives.html asked for the whole graph to list the accounts, and since H8
// it asks for nothing at all: the cards are written into the file by the build.
// The synthetic set is not prerendered, and what it fetches is the shape of the
// promise — the core, and the shards its walks cross, and never the corpus
// (i4-brief, section 1.5).
test('narratives.html fetches nothing until the fixtures are asked for, and then the shards its walks cross', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('narratives.html'), 'return document.querySelectorAll(".narrative-card").length > 0;');
    const quiet = await page.eval(REQUESTS);
    assert.equal(quiet.filter((name) => name.includes('/index/')).length, 0, `the prerendered page fetched ${quiet.join(' · ')}`);

    await open(page, url('narratives.html?fixtures=1'), 'return !document.getElementById("fixtures-badge").hidden;');
    const asked = await page.eval(REQUESTS);
    const index = (part) => asked.filter((name) => name.includes(`/index/${part}`)).length;
    assert.equal(index('core-'), 1, 'the core, once');
    assert.equal(index('spine-'), 0, 'and never the file it replaced');
    const shards = asked.filter((name) => name.includes('/index/attributes-'));
    assert.ok(shards.length > 0, 'the shard the one synthetic walk is filed in');
    const fixtureShards = JSON.parse(await readFile(path.join(ROOT, 'tests', 'fixtures', 'data', 'index', 'manifest.json'), 'utf8')).attributeShards ?? [];
    assert.ok(shards.length < fixtureShards.length, `${shards.length} of ${fixtureShards.length} shards for one account`);
  });
});

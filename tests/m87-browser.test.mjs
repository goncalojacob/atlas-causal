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
// The phone the brief names and the frame page drives (M86, review A finding 5).
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1 };

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

// §8 (B11), the first of the three. `createGraphView` renders inside its own
// constructor, and `showView` then forced the picture again because the pane it
// was built for had been hidden a moment earlier — so a link naming `?view=graph`
// laid the whole arrangement out twice before a reader saw anything. The hook
// counts the draws of the first synchronous turn, which is where both of them
// were; a shard landing draws again in a turn of its own and is not counted.
const COUNT_GRAPH_DRAWS = `
  window.__graphDraws = 0;
  window.__firstTurn = null;
  const original = Element.prototype.replaceChildren;
  Element.prototype.replaceChildren = function (...children) {
    if (this.classList && this.classList.contains('layer-nodes')) {
      window.__graphDraws += 1;
      if (window.__firstTurn === null) {
        window.__firstTurn = 0;
        queueMicrotask(() => { window.__firstTurn = window.__graphDraws; });
      }
    }
    return original.apply(this, children);
  };
`;

test('§8: a link naming the graph draws it once, not twice', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: COUNT_GRAPH_DRAWS });
    await open(page, url('?fixtures=1&view=graph'), 'return document.querySelectorAll("#graph circle.node").length > 0;');
    await waitFor(page, 'return window.__firstTurn !== null && window.__firstTurn > 0;', 'the graph to draw');
    assert.equal(await page.eval('return window.__firstTurn;'), 1,
      'the graph was laid out twice before anything was on the screen');
  }, { device: DESK });
});

// §8, the second. The map draws the link the reader has opened as a madder line
// between its two marks (M83, B7); the timeline had no notion of `edge` at all,
// so the two bars it draws for the same two events looked like any other. They
// carry the same word the map's line does now, and the key says so.
test('§8: the timeline marks the two ends of the link the reader has opened', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // The fixtures' own first active edge, read off the page rather than typed.
    await open(page, url('?fixtures=1&view=timeline'), 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;');
    const edge = await page.eval(`return (async () => {
      const { loadAtlas } = await import('/src/data.js');
      const atlas = await loadAtlas({ dataRoot: 'tests/fixtures/data/', landFile: false });
      const found = [...atlas.edges.values()].find((e) => e.status === 'active'
        && atlas.events.get(e.from)?.status === 'active' && atlas.events.get(e.to)?.status === 'active');
      return found ? { id: found.id, from: found.from, to: found.to } : null;
    })();`);
    assert.ok(edge, 'the fixtures have an active link between two active events');

    await open(page, url(`?fixtures=1&view=timeline&edge=${edge.id}`), 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;');
    await waitFor(page, 'return document.querySelectorAll("#timeline rect.chosen[data-id]").length > 0;', 'the link\'s two ends');
    const marked = await page.eval(`return [...document.querySelectorAll('#timeline rect.chosen[data-id]')]
      .map((el) => el.getAttribute('data-id')).sort();`);
    assert.deepEqual(marked, [edge.from, edge.to].sort(), 'both ends and nothing else');

    // And the key names the shape, as it names every other one.
    const key = await page.eval(`
      const row = document.querySelector('#timeline .view-key rect.bar.chosen');
      const bar = document.querySelector('#timeline svg.timeline rect.bar.chosen[data-id]');
      if (!row || !bar) return null;
      const read = (el) => { const s = getComputedStyle(el); return { stroke: s.stroke, width: s.strokeWidth }; };
      const dd = row.closest('dt')?.nextElementSibling;
      return { row: read(row), bar: read(bar), label: dd ? dd.textContent : null };`);
    assert.ok(key, 'the key carries the row, and the picture a bar to compare it with');
    assert.equal(key.row.stroke, key.bar.stroke, 'inked as the picture inks it');
    assert.ok(key.label && key.label.length > 0, 'and it says what it means');
  }, { device: DESK });
});

// §9 (review A finding 5). On a phone the map was a 220-pixel band with 3-pixel
// marks and empty ground beneath it: the `<svg>` carries a 960 x 540 viewBox and
// no `preserveAspectRatio`, so it is letterboxed, and fitted to a 390-pixel pane's
// *width* the world can never be taller than 56 % of it. Under the phone
// breakpoint it is fitted to the pane's height instead — the poles are cropped,
// which is what a reader loses, and they lose a strip of ice for a picture twice
// the size. Nothing is pinned: the drawing is compared with the pane it is in.
const MAP_FIT = `
  const pane = document.querySelector('.map-area');
  const svg = document.querySelector('#map svg.map');
  const ctm = svg.getScreenCTM();
  const box = svg.viewBox.baseVal;
  return {
    pane: { width: pane.clientWidth, height: pane.clientHeight },
    drawn: { width: Math.abs(ctm.a) * box.width, height: Math.abs(ctm.d) * box.height },
    fit: svg.getAttribute('preserveAspectRatio'),
  };`;

test('§9: on a phone the map fills the pane, and on a desktop it still fits inside it', { skip }, async () => {
  for (const [where, device, covers] of [['a phone', PHONE, true], ['a desktop', DESK, false]]) {
    // eslint-disable-next-line no-await-in-loop
    await withBrowser(async (page, url) => {
      await seenIntro(page);
      await open(page, url(''), 'return document.querySelectorAll("#map .mark").length > 0;');
      const seen = await page.eval(MAP_FIT);
      assert.ok(seen.pane.height > 0, `${where}: the pane measured itself`);
      if (covers) {
        assert.ok(seen.drawn.height >= seen.pane.height - 1,
          `${where}: the world is ${Math.round(seen.drawn.height)} px in a pane of ${seen.pane.height} px`);
      } else {
        assert.ok(seen.drawn.height <= seen.pane.height + 1,
          `${where}: nothing is cropped (${Math.round(seen.drawn.height)} px in ${seen.pane.height} px)`);
        assert.ok(seen.drawn.width <= seen.pane.width + 1, `${where}: nor sideways`);
      }
    }, { device });
  }
});

// And the graph's names, which were about 4 px tall on a phone — the picture is
// scaled to the pane and the text is scaled with it, so a name nobody can read is
// ink over the marks it is naming.
//
// **Rewritten in M88 §1** (the third review, finding B1). M87 answered the
// four-pixel name by *dropping* every name under eight, keeping only what the
// reader had open and the one hop around it — and at rest a phone has nothing
// open, so the picture the review met was an unnamed strip a quarter of the
// screen high. The answer now is the one the map already gives: the drawing
// fills the pane, and a name too small at the picture's own size is written at
// the floor's size instead, so fewer of them fit and every one drawn can be
// read. What this asserts is that pair, against the pane it is in: nothing is
// pinned, and "at least one name" is the part M87's picture could not do.
const GRAPH_LABEL_SIZES = `
  return [...document.querySelectorAll('#graph svg.graph text.node-label')].map((el) => ({
    text: el.textContent,
    px: parseFloat(getComputedStyle(el).fontSize) * Math.abs(el.getScreenCTM().a),
    selected: el.classList.contains('selected'),
  }));`;

// The same measurement `MAP_FIT` makes, of the graph's own root and pane.
const GRAPH_FIT = `
  const pane = document.querySelector('#graph');
  const svg = document.querySelector('#graph svg.graph');
  const ctm = svg.getScreenCTM();
  const box = svg.viewBox.baseVal;
  return {
    pane: { width: pane.clientWidth, height: pane.clientHeight },
    drawn: { width: Math.abs(ctm.a) * box.width, height: Math.abs(ctm.d) * box.height },
  };`;

test('§9: on a phone the graph fills the pane and every name it draws is legible', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?view=graph'), 'return document.querySelectorAll("#graph circle.node").length > 0;');
    await settledShards(page);
    await page.eval('return new Promise((resolve) => requestAnimationFrame(() => setTimeout(() => resolve(true), 0)));');

    // The drawing is the pane's picture and not a strip across the top of it.
    // Half, because that is the failure — a quarter of the screen — and not a
    // number about this layout: the map's own test asks for the whole height,
    // and the graph's camera pads what it frames.
    const fit = await page.eval(GRAPH_FIT);
    assert.ok(fit.pane.height > 0, 'the pane measured itself');
    assert.ok(fit.drawn.height > fit.pane.height / 2,
      `the graph is ${Math.round(fit.drawn.height)} px in a pane of ${fit.pane.height} px`);

    // At rest, with nothing open: names, and none of them too small to read.
    const rest = await page.eval(GRAPH_LABEL_SIZES);
    assert.ok(rest.length > 0, 'the picture at rest names something');
    const tiny = rest.filter((label) => label.px < 8 - 0.01);
    assert.deepEqual(tiny.map((l) => `${l.text} at ${l.px.toFixed(1)}px`), [],
      'a name under 8 px on screen is ink over the mark it names');

    // And what the reader has open is named too, as it always was.
    const id = await page.eval(`return (document.querySelector('#graph circle.node[data-id]') || {}).getAttribute
      ? document.querySelector('#graph circle.node[data-id]').getAttribute('data-id') : null;`);
    assert.ok(id, 'there is a mark to open');
    await open(page, url(`?view=graph&selected=${id}`), 'return document.querySelectorAll("#graph circle.node").length > 0;');
    await settledShards(page);
    await waitFor(page, "return document.querySelectorAll('#graph text.node-label').length > 0;",
      'the open event to be named');
    const opened = await page.eval(GRAPH_LABEL_SIZES);
    assert.deepEqual(opened.filter((l) => l.px < 8 - 0.01).map((l) => l.text), [],
      'and nothing under the floor with a record open either');
  }, { device: PHONE });
});

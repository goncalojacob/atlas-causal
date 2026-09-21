// The timeline against the pane it is drawn in.
//
// The row it sits in used to be `auto`, so the pane grew with however many
// rows the packing had made and was then capped at 45vh — which meant that in
// a short window the drawing was taller than the pane, the bottom row was cut
// off, and nothing laid it out again when the window changed (owner,
// 5 September). None of that can be seen without a real layout.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, until, skip } from './browser.mjs';
import { ROW_LIMITS } from '../src/timeline.js';
import { GLYPH_BOX } from '../src/map/glyphs.js';

// The timeline is the third view since M60, so every URL here names it: the
// map is what a link with no `?view=` opens on, and the lanes are drawn when
// the reader asks for them (main.js). What says the drawing arrived is a lane.
const READY = 'return Boolean(document.querySelector(".timeline-area svg rect.lane"));';
// The link a reader follows to the timeline, with whatever else the test needs.
const on = (query = '') => `?view=timeline${query ? `&${query}` : ''}`;

// Where the drawing is, against the pane that holds it. Client coordinates
// for the parts that must not leave the screen, the SVG's own units for the
// parts that must not leave the drawing.
const FIT = `
  const pane = document.querySelector('.timeline-area');
  const svg = document.querySelector('#timeline svg.timeline');
  const box = pane.getBoundingClientRect();
  const lanes = [...svg.querySelectorAll('rect.lane')];
  const bars = [...svg.querySelectorAll('rect.bar')];
  const bottom = (el) => Number(el.getAttribute('y')) + Number(el.getAttribute('height'));
  const band = svg.querySelector('[data-window="band"]');
  return {
    lanes: lanes.length,
    laneHeight: lanes.length ? Number(lanes[0].getAttribute('height')) : 0,
    lastLane: lanes.length ? Number(lanes[lanes.length - 1].getAttribute('height')) : 0,
    bars: bars.length,
    svgHeight: Number(svg.getAttribute('height')),
    lowestLane: lanes.length ? Math.max(...lanes.map(bottom)) : 0,
    lowestBar: bars.length ? Math.max(...bars.map(bottom)) : 0,
    bandBottom: band ? bottom(band) : 0,
    bandTop: band ? Number(band.getAttribute('y')) : 0,
    paneHeight: pane.clientHeight,
    scrollHeight: pane.scrollHeight,
    paneBottom: Math.round(box.bottom),
    windowHeight: innerHeight,
  };`;

// No bar is waiting for its name: every bar whose title is a name has that name
// drawn as a label. A bar whose century has not landed carries the interface
// saying it is still loading, which is in no label, so it counts as unnamed
// here. The wait a test about what the drawing *does next* owes itself, since
// a shard landing is a hundred and fifty labels drawn (M78).
const BARS_NAMED = `
  const svg = document.querySelector('#timeline svg.timeline');
  if (!svg) return false;
  const bars = [...svg.querySelectorAll('rect.bar[data-id], .layer-held rect[data-id]')];
  if (bars.length < 1) return false;
  const drawn = new Set([...svg.querySelectorAll('text.bar-label')].map((l) => l.textContent));
  return bars.every((b) => {
    const t = b.querySelector('title');
    const name = t ? t.textContent.split(' \\u2014 ')[0] : null;
    return !name || drawn.has(name);
  });`;

// The rows have been laid out for the pane they are in *now*, and the height
// they were laid out at is what the caller says. `fits`'s own first assertion
// — the pane holds the drawing and nothing else — said as a predicate: a
// layout measured against a pane that has since changed fails it, which is
// what tells the settled drawing from the one the observer wrote on its way
// there.
const LAID_OUT_FOR_ITS_PANE = (height) => `
  const svg = document.querySelector('#timeline svg.timeline');
  const pane = document.querySelector('.timeline-area');
  if (!svg || !pane) return false;
  const drawn = Number(svg.getAttribute('height'));
  return drawn ${height} && pane.scrollHeight === drawn;`;

// The drawing, read once it is the drawing of the pane it is in. `READY` is a
// lane existing, which is as true of the first layout as of the settled one:
// the masthead wraps and a scrollbar comes and goes, so the timeline is laid
// out twice on an ordinary visit and `fits`'s own first assertion — the pane
// holds the drawing and nothing else — is false in between. Measured on a page
// nobody had resized: one run in six read `a 1400 px window: 1295 !== 1276`
// (M78, docs/m78-flakes.md). So the wait is that assertion, and `fits` still
// makes it: a drawing that never settles is reported by the assertion, with
// both numbers, and not as a timeout.
const SETTLED = `
  const pane = document.querySelector('.timeline-area');
  const svg = document.querySelector('#timeline svg.timeline');
  if (!pane || !svg) return false;
  return pane.scrollHeight === Number(svg.getAttribute('height'));`;

const fitOf = async (page) => {
  await until(page, SETTLED);
  return page.eval(FIT);
};

// The same assertions wherever the pane's height comes from.
function fits(fit, where) {
  assert.equal(fit.scrollHeight, fit.svgHeight, `${where}: the pane holds the drawing and nothing else`);
  assert.ok(fit.lowestLane <= fit.svgHeight, `${where}: no lane below the drawing`);
  assert.ok(fit.lowestBar <= fit.svgHeight, `${where}: no bar below the drawing (${fit.lowestBar} of ${fit.svgHeight})`);
  assert.ok(fit.svgHeight >= fit.paneHeight, `${where}: the drawing is at least the pane's height`);
  assert.ok(fit.paneBottom <= fit.windowHeight, `${where}: and the pane is on the screen`);
  // The band runs the whole drawing, so its handles are grabbable wherever
  // the reader has scrolled the lanes to.
  assert.equal(fit.bandBottom, fit.svgHeight, `${where}: the band reaches the bottom`);
  assert.ok(fit.bandTop < 40, `${where}: and starts at the top, where it is always in view`);
}

test('at a window 500 px tall every lane is inside the timeline pane', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on()), READY);
    const fit = await fitOf(page);
    assert.equal(fit.windowHeight, 500);
    assert.ok(fit.lanes > 1 && fit.bars > 0, `the atlas drew something (${fit.lanes} lanes, ${fit.bars} bars)`);
    fits(fit, 'a 500 px window');
  }, { device: { width: 1280, height: 500, deviceScaleFactor: 1 } });
});

test('when the rows have the room they take it, and the pane does not scroll', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Eleven fixture events pack into a handful of rows, which fit.
    await open(page, url(on('fixtures=1')), READY);
    const fit = await fitOf(page);
    fits(fit, 'the fixtures at 500 px');
    assert.equal(fit.svgHeight, fit.paneHeight, 'the drawing is exactly the pane');
    assert.ok(fit.lowestBar <= fit.paneHeight, 'so the bottom row is on screen without scrolling');
  }, { device: { width: 1280, height: 500, deviceScaleFactor: 1 } });
});

// *A named grouping takes the lanes its pane holds* stood here, about a lane
// keeping room for its own label and being squeezed less far than a packed
// row. The named lanes went with the grouping in M77 and there is one kind of
// row left.

// Failing from the world merge of 8 September 2026 until I6: with the world's
// events the rows overflowed the pane at the 14 px floor, so a shorter window
// could not change the svg's height — both were the same overflowing drawing.
//
// **Turned round in M77.** The row *count* no longer comes from the pane at
// all: every bar carries its title, the rows are as many as that takes, and a
// short pane scrolls. What the pane still decides is how tall a row is, and
// that is what this asks — on the fixtures, which are few enough that the rows
// have room to grow into and the drawing is the pane.
test('the rows are laid out again when the window changes height', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on('fixtures=1')), READY);
    const tall = await fitOf(page);
    fits(tall, 'a 900 px window');
    assert.equal(tall.svgHeight, tall.paneHeight, 'the drawing is exactly the pane');

    await page.send('Emulation.setDeviceMetricsOverride', {
      mobile: false, width: 1280, height: 400, deviceScaleFactor: 1,
    });
    await waitFor(page, 'return innerHeight === 400;', 'the window to be short');
    await waitFor(
      page,
      `return document.querySelector('.timeline-area').clientHeight !== ${tall.paneHeight};`,
      'the pane to be re-measured',
    );
    // The observer answers a change of height, not only of width — and it
    // answers twice. Measured here (docs/m78-flakes.md): one resize lays the
    // rows out at 280 against a pane that is already 295, and again at 295
    // two milliseconds later. The wait was "the height is not the tall one",
    // which the first of those satisfies, and `fits` then read a drawing laid
    // out for a pane the timeline is no longer in: `295 !== 280`, one browser
    // pass in five here.
    //
    // What it waits for now is the first thing `fits` asserts — the pane holds
    // the drawing and nothing else — beside the height having moved at all. An
    // intermediate layout fails that conjunction by construction, because the
    // pane it was measured against is gone.
    await until(page, LAID_OUT_FOR_ITS_PANE(`!== ${tall.svgHeight}`));

    const short = await fitOf(page);
    fits(short, 'after the window was made short');
    assert.equal(short.lanes, tall.lanes, 'the same rows: the count is what the titles need');
    assert.ok(short.laneHeight < tall.laneHeight,
      `shorter rows in a shorter pane (${short.laneHeight} of ${tall.laneHeight})`);
    assert.equal(short.svgHeight, short.paneHeight, 'the drawing is exactly the pane');

    // And back again: nothing is one-way.
    await page.send('Emulation.setDeviceMetricsOverride', {
      mobile: false, width: 1280, height: 900, deviceScaleFactor: 1,
    });
    await until(page, LAID_OUT_FOR_ITS_PANE(`=== ${tall.svgHeight}`));
    const back = await fitOf(page);
    fits(back, 'back at 900 px');
    assert.equal(back.laneHeight, tall.laneHeight, 'and the height the taller pane gave is back');
  }, { device: { width: 1280, height: 900, deviceScaleFactor: 1 } });
});

// The note above the lanes — "N of N events in view" and the pin — used to be
// the one part of this pane that was not the drawing, and its height was the
// drawing's to lose. It is in the masthead since M60, where a reader on the
// map can see it too (window-control.js; `tests/m60-browser.test.mjs` holds
// what it says). So the pane is the drawing and nothing else, with a box in
// force as without one.
test('the pane is the drawing, with a box in force as without one', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on()), READY);
    fits(await fitOf(page), 'with no box');
    assert.equal(await page.eval('return document.querySelectorAll(".timeline-area p").length;'), 0,
      'nothing above the lanes but the lanes');

    await open(page, url(on('bbox=-10,36,-6,43')), READY);
    const fit = await fitOf(page);
    fits(fit, 'with a box');
    assert.equal(fit.scrollHeight, fit.svgHeight, 'the pane holds the drawing and nothing else');
    assert.ok(fit.lowestBar <= fit.svgHeight);
    // And the count is where the reader can see it, on this view too.
    assert.equal(await page.eval('return document.querySelector("#window-control .window-view").hidden;'), false);
  }, { device: { width: 1280, height: 700, deviceScaleFactor: 1 } });
});

// --- the nodes are kept, not built again -----------------------------------
//
// The timeline emptied its whole <svg> and built it back on every state
// change, so a click on a bar cost the browser every lane, every tick, every
// bar and the band all over again (health review B, finding 23). Since H4c
// each kind of element has a layer of its own and the layer hands its
// children back to the next render; only the numbers on them change.
//
// This cannot be seen without a real layout and a real MutationObserver,
// which is why it is here and not in the pure suite.
test('a state change updates the bars in place and does not rebuild them', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // With a record already open, so that the click under test is a state
    // change and nothing else. Opening the *first* record also brings the
    // panel back — there is none while nothing is open (H1c) — and the pane
    // the lanes are laid out into loses a third of its width, which is a
    // relayout and not the thing this test is about. It was invisible while
    // the timeline was a full-width strip under the panel; since M60 it is in
    // the view's own column and the panel takes width from it.
    // **`focus=none`**, which is the reader turning the implicit lens off
    // (lens.js). Since M65 choosing an event is a filter, so clicking a second
    // bar draws a different set of events and the picture *is* rebuilt — as it
    // should be. What this test is about is the other case, which is still the
    // common one: a state change over a picture that is not narrowing.
    await open(page, url(on('selected=carnation-revolution-1974&focus=none')), READY);
    // And after the titles have landed. Every bar carries one since M77 and a
    // title arrives with its century (attributes.js): an observer installed
    // before the shard lands watches the shard arrive, which is a hundred and
    // fifty labels drawn and is not the click this test is about.
    // The proxy was the count of labels being the same on two polls 50 ms
    // apart, which is the same number on either side of a shard landing and is
    // stable for the whole of the gap between the bars being drawn and the last
    // century arriving. An observer installed inside that gap watches the
    // shards arrive, which is the hundred and fifty labels this test would then
    // count as a rebuild. What it waits for is what it needs: no bar whose
    // title is not drawn as a label, so there is no label left to come.
    await until(page, BARS_NAMED);
    // Every element the timeline has drawn, watched for children coming and
    // going. `subtree` so the layers themselves are covered.
    // Elements only. A bar that now stands for a different event still has
    // its own <title>, and the text inside that title is replaced — a text
    // node coming and going is the label changing, not the drawing being
    // rebuilt, and it is the element that costs layout.
    await page.eval(`
      window.__added = 0;
      window.__removed = 0;
      new MutationObserver((records) => {
        for (const r of records) {
          for (const n of r.addedNodes) if (n.nodeType === 1) window.__added += 1;
          for (const n of r.removedNodes) if (n.nodeType === 1) window.__removed += 1;
        }
      }).observe(document.querySelector('#timeline svg.timeline'), { childList: true, subtree: true });
      return true;`);
    const before = await page.eval("return document.querySelectorAll('#timeline svg.timeline *').length;");

    const first = await page.eval(`
      const el = [...document.querySelectorAll('#timeline rect.bar[data-id]')]
        .find((b) => !b.classList.contains('selected'));
      return { id: el.getAttribute('data-id'), before: el.getAttribute('class') };`);
    // Selecting a bar changes the class of that bar and of everything the
    // selection emphasises, and nothing else about the picture.
    await page.eval(`
      document.querySelector('#timeline rect.bar[data-id="${first.id}"]').dispatchEvent(
        new MouseEvent('click', { bubbles: true }));
      return true;`);
    await waitFor(
      page,
      `return document.querySelector('#timeline rect.bar[data-id="${first.id}"]')?.classList.contains('selected')
        || Boolean(document.querySelector('#timeline .layer-held rect[data-id="${first.id}"]'));`,
      'the bar the click opened to be drawn as what the reader is holding',
    );
    const churn = await page.eval('return { added: window.__added, removed: window.__removed };');
    const after = await page.eval("return document.querySelectorAll('#timeline svg.timeline *').length;");
    // A handful: the bar that was opened leaves the packed rows for the layer
    // of what the reader is holding, and takes a title and a label with it.
    // Before H4c every element in the drawing was removed and made again on
    // every state change, which on this dataset is some hundreds and at
    // twenty thousand events is tens of thousands.
    // The bound was ten until M47 wrote the first `parent` into `data/` and the
    // bars layer gained five ring rects, then twelve; M50 put 35 more events on
    // the timeline and it went to thirteen of 540. Raising it by one per
    // milestone is a bound that means nothing, so it is a **share of the
    // drawing** now: a state change may touch five per cent of the elements,
    // which is the order of magnitude the test is about — a bar and its labels,
    // not the picture. Before H4c every element was removed and made again,
    // which on this dataset is some hundreds and at twenty thousand events is
    // tens of thousands.
    const handful = Math.max(12, Math.round(before * 0.05));
    assert.ok(before > 100, `the atlas drew something (${before} elements)`);
    assert.ok(churn.removed < handful, `the drawing was not rebuilt (${churn.removed} of ${before} elements removed)`);
    assert.ok(churn.added < handful, `nor built again (${churn.added} of ${before} elements added)`);
    assert.ok(Math.abs(after - before) < 10, `and it is the same drawing (${before} to ${after})`);

    // And the layers are still the only children of the <svg>: nothing was
    // appended to the root behind their backs.
    const shape = await page.eval(`
      const svg = document.querySelector('#timeline svg.timeline');
      return {
        children: [...svg.children].map((el) => el.getAttribute('class')),
        strays: [...svg.children].filter((el) => el.tagName !== 'g' && el.tagName !== 'defs').length,
      };`);
    // A <defs> is not a stray: whichever view is built first puts the twelve
    // symbols in the document, and on this page that is the map (glyphs.js).
    // What this asserts is that nothing was appended to the root behind the
    // layers' backs.
    assert.equal(shape.strays, 0, shape.children.join(' · '));
    assert.ok(shape.children.includes('layer layer-bars'));
  }, { device: { width: 1280, height: 900, deviceScaleFactor: 1 } });
});

// --- a large event, and a parent over its parts -----------------------------
//
// A8 and A9. `data/` holds no `scope` and no `parent` yet, so this is on the
// fixtures, where `fixture-event-f` is written `scope: regional` and holds two
// events that fall in two lanes — large twice over, which is the case the band
// exists for.
test('a large event is a band the height of the drawing, under the bars and with no handle', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Opened on the large event itself, which is the only way to be sure of a
    // bar to compare the band against: two of the fixtures' events fall on the
    // same year in that lane and are drawn as one stack otherwise.
    await open(page, url(on('fixtures=1&group=region&selected=fixture-event-f')), READY);
    await waitFor(page, 'return document.querySelectorAll("#timeline .layer-bands rect").length > 0;', 'the band');
    // And the band's own label, which is the event's name and arrives with its
    // century (attributes.js). The wait above is "a band rect exists", which is
    // true of a band drawn before the fixtures' titles are in: one run in
    // twenty-four read `and says which event it is: '' !== 'Fixture event F'`.
    // So it waits for the thing the assertion below reads.
    await until(page, `
      const label = document.querySelector('#timeline .layer-bandLabels text.large-band-label');
      return Boolean(label && label.textContent);`);

    const band = await page.eval(`
      const svg = document.querySelector('#timeline svg.timeline');
      const el = svg.querySelector('.layer-bands rect.large-band');
      const bar = svg.querySelector('rect[data-id="fixture-event-f"]');
      const label = svg.querySelector('.layer-bandLabels text.large-band-label');
      const layers = [...svg.children].map((g) => g.getAttribute('class'));
      return {
        x: Number(el.getAttribute('x')),
        y: Number(el.getAttribute('y')),
        width: Number(el.getAttribute('width')),
        height: Number(el.getAttribute('height')),
        svgHeight: Number(svg.getAttribute('height')),
        handles: el.hasAttribute('data-window'),
        bands: svg.querySelectorAll('.layer-bands rect').length,
        barX: bar ? Number(bar.getAttribute('x')) : null,
        label: label ? label.textContent : null,
        labelY: label ? Number(label.getAttribute('y')) : null,
        order: layers.indexOf('layer layer-bands') < layers.indexOf('layer layer-bars'),
      };`);
    assert.equal(band.bands, 1, 'one band, for the one large event on the fixtures');
    assert.equal(band.handles, false, 'a large event is not something to drag');
    // From the top of the lanes to the bottom of the drawing: the whole
    // timeline, which is what makes it the ground rather than a bar.
    assert.equal(band.y + band.height, band.svgHeight, 'it reaches the bottom');
    assert.ok(band.y < 60 && band.y > 0, `it starts under the axis (${band.y})`);
    assert.equal(band.label, 'Fixture event F', 'and says which event it is');
    assert.ok(band.labelY < 40, 'on the axis, above the lanes');
    assert.ok(band.order, 'and under the bars');
    // The bar is still there. The band is not a control — no title, no click,
    // no place in the roving tab order — so taking the bar away would leave
    // the record unreachable on this view and unreachable from the keyboard.
    assert.equal(band.barX, band.x, 'the bar is still drawn, at the same years');
  }, { device: { width: 1280, height: 700, deviceScaleFactor: 1 } });
});

// *No bracket where the parts cross lanes* stood here. The bracket went with
// the named lanes in M77; the ring below is what says a parent is one, on all
// three views and at every size.

// --- a parent looks like one, wherever the bracket is not --------------------
//
// M30c, §1: the bracket of A9 was drawn only where the parts shared a named
// lane, so under the default — which since M77 is the only arrangement there
// is — nothing said a parent was one. The ring is what says it, on every view
// and at every size. `fixture-event-f` is the one parent either corpus
// carries.
const RING_AROUND = (id) => `
  const svg = document.querySelector('#timeline svg.timeline');
  const bar = svg.querySelector('rect[data-id="${id}"]');
  if (!bar) return { bar: null };
  const box = (el) => ({
    x: Number(el.getAttribute('x')), y: Number(el.getAttribute('y')),
    width: Number(el.getAttribute('width')), height: Number(el.getAttribute('height')),
  });
  const b = box(bar);
  const rings = [...svg.querySelectorAll('rect.ring')];
  const ring = rings.find((el) => Math.abs(box(el).x - (b.x - 2)) < 0.01) ?? null;
  const style = ring ? getComputedStyle(ring) : null;
  return {
    bar: b,
    bars: svg.querySelectorAll('rect.bar').length,
    rings: rings.length,
    layer: ring ? ring.parentNode.getAttribute('class') : null,
    ring: ring === null ? null : {
      ...box(ring),
      classes: ring.getAttribute('class'),
      id: ring.getAttribute('data-id'),
      tabindex: ring.getAttribute('tabindex'),
      title: ring.querySelector('title') ? ring.querySelector('title').textContent : null,
      fill: style.fill,
      events: style.pointerEvents,
      stroke: Number(ring.getAttribute('stroke-width')),
    },
  };`;

test('a parent\'s bar is ringed in the packed rows and when it is held', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // In the packed rows, where the card's "Part of" line used to be the only
    // word on it.
    await open(page, url(on('fixtures=1')), READY);
    const packed = await page.eval(RING_AROUND('fixture-event-f'));
    assert.ok(packed.bar, 'the parent has a bar of its own in the packed rows');
    assert.equal(packed.rings, 1, 'one ring, for the one parent on the fixtures');
    assert.ok(packed.ring, 'and it is around that bar');
    assert.equal(packed.ring.y, packed.bar.y - 2, 'two pixels outside it on every side');
    assert.equal(packed.ring.width, packed.bar.width + 4);
    assert.equal(packed.ring.height, packed.bar.height + 4);
    assert.equal(packed.ring.fill, 'none', 'an outline and not a second bar');
    assert.equal(packed.ring.id, null, 'it names no record');
    assert.equal(packed.ring.tabindex, null, 'and is not in the tab order');
    assert.equal(packed.ring.title, null, 'nor does it offer a tooltip of its own');
    assert.equal(packed.ring.events, 'none', 'the bar under it takes every click');
    assert.ok(packed.ring.stroke > 0 && packed.ring.stroke < 1, `thinner than the bar: ${packed.ring.stroke}`);
    assert.equal(packed.layer, 'layer layer-rings', 'drawn through a pool of its own (M77)');

    // A leaf is drawn exactly as it was — read here, in the resting picture,
    // because since M65 the choice below narrows the bars to what it reaches
    // and B is not one of them.
    const leaf = await page.eval(RING_AROUND('fixture-event-b'));
    assert.ok(leaf.bar, 'the leaf has a bar');
    assert.equal(leaf.ring, null, 'and nothing around it');

    // And when the reader is holding it, which is the layer their own records
    // are drawn in — above their neighbours, ring and all.
    await open(page, url(on('fixtures=1&selected=fixture-event-f')), READY);
    const banded = await page.eval(RING_AROUND('fixture-event-f'));
    assert.ok(banded.ring, 'the ring is drawn on what the reader is holding too');
    assert.equal(banded.layer, 'layer layer-heldRings', 'in the layer that sits with its bar');
    assert.match(banded.ring.classes, /\bselected\b/, 'and it carries the emphasis its bar carries');
    assert.doesNotMatch(banded.ring.classes, /\bbar\b/, 'a ring is an outline, not a record');
  }, { device: { width: 1280, height: 700, deviceScaleFactor: 1 } });
});

// --- the symbol at the left of a bar ---------------------------------------
//
// The same twelve symbols the map draws, by id out of the one `<defs>` the
// document holds, and the same threshold argument: a bar shorter or thinner
// than the glyph carries none, because a symbol drawn at three pixels is a
// smudge and a smudge says something false about how much the atlas knows
// (glyphs-brief, §3). The fixtures' `fixture-event-f` runs 1260–1300 and is
// the wide bar; the categorised instants are the narrow ones.
// On the fixtures, whose eleven events pack into a handful of rows and leave
// the pane room to grow them to their cap. On the repository's own corpus the
// titles ask for more rows than any pane holds, every row is at its 22 px
// floor and the bar inside it is 8 px — below the threshold on every bar there
// is, which is deviation 585 read through M77's rows.
test('a bar wide enough carries its category, and one below the threshold does not', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on('fixtures=1')), READY);
    await waitFor(page, 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;', 'the bars');
    const seen = await page.eval(`
      const at = (id) => {
        const bar = document.querySelector('#timeline rect.bar[data-id="' + id + '"]')
          ?? document.querySelector('#timeline .layer-held rect[data-id="' + id + '"]');
        if (!bar) return null;
        const x = Number(bar.getAttribute('x'));
        const y = Number(bar.getAttribute('y'));
        const w = Number(bar.getAttribute('width'));
        const h = Number(bar.getAttribute('height'));
        const glyph = [...document.querySelectorAll('#timeline use.glyph')].find((g) => {
          const gy = Number(g.getAttribute('y')) + Number(g.getAttribute('height')) / 2;
          const gx = Number(g.getAttribute('x'));
          return Math.abs(gy - (y + h / 2)) < 0.01 && gx >= x - 1 && gx < x + w;
        }) ?? null;
        return { width: w, height: h, glyph: glyph && { href: glyph.getAttribute('href'), classes: glyph.getAttribute('class'), events: getComputedStyle(glyph).pointerEvents } };
      };
      return {
        wide: at('fixture-event-g'),
        narrow: at('fixture-event-c'),
        glyphs: document.querySelectorAll('#timeline use.glyph').length,
        // Which bar each symbol sits on, so the promise can be read off the
        // drawing rather than counted: since M65 the resting picture is the
        // main events, and how many of them are wide enough is a fact about
        // the fixtures and not about the threshold.
        carrying: [...document.querySelectorAll('#timeline use.glyph')].map((g) => {
          const gy = Number(g.getAttribute('y')) + Number(g.getAttribute('height')) / 2;
          const gx = Number(g.getAttribute('x'));
          const bar = [...document.querySelectorAll('#timeline rect[data-id]')].find((b) => {
            const y = Number(b.getAttribute('y'));
            const h = Number(b.getAttribute('height'));
            const x = Number(b.getAttribute('x'));
            const w = Number(b.getAttribute('width'));
            return Math.abs(gy - (y + h / 2)) < 0.01 && gx >= x - 1 && gx < x + w;
          }) ?? null;
          return bar && {
            id: bar.getAttribute('data-id'),
            width: Number(bar.getAttribute('width')),
            height: Number(bar.getAttribute('height')),
          };
        }),
        symbols: document.querySelectorAll('#glyph-defs symbol').length,
        onStacks: [...document.querySelectorAll('#timeline rect.bar.stack')].length,
      };`);
    assert.equal(seen.symbols, 12, 'the same twelve, from the one <defs> in the document');
    assert.ok(seen.wide, 'the wide bar is drawn');
    assert.ok(seen.wide.width >= 10, `wide enough to carry one (${seen.wide.width})`);
    assert.ok(seen.wide.height >= 10, `and tall enough (${seen.wide.height})`);
    assert.ok(seen.wide.glyph, 'and it carries it');
    assert.equal(seen.wide.glyph.href, '#glyph-disaster');
    assert.match(seen.wide.glyph.classes, /\bglyph\b/);
    assert.doesNotMatch(seen.wide.glyph.classes, /\bbar\b/, 'a symbol is not a record');
    assert.equal(seen.wide.glyph.events, 'none', 'the bar under it takes the click');
    // And the narrow one does not: it is an instant, a few pixels wide, and a
    // symbol drawn across it would be wider than the event it belongs to.
    assert.ok(seen.narrow, 'the narrow bar is drawn all the same');
    assert.ok(seen.narrow.width < 10, `below the threshold (${seen.narrow.width})`);
    assert.equal(seen.narrow.glyph, null, 'and carries no symbol');
    // Every symbol on the page sits on a bar that is over the threshold, and
    // no bar under it carries one. That is the whole of the rule, and it does
    // not pin how many of the fixtures happen to qualify.
    assert.ok(seen.glyphs > 0, 'some bar on the fixtures is wide enough');
    for (const bar of seen.carrying) {
      assert.ok(bar, 'every symbol sits on a bar');
      assert.ok(bar.width >= 10 && bar.height >= 10, `${bar.id} is ${bar.width} x ${bar.height}`);
    }

    // The bar is what is left of the row once the air round it is taken off,
    // so the threshold is a question about the row's height. At the floor —
    // which since M77 is where the repository's own corpus always is, because
    // the titles ask for more rows than the pane holds — the bar is under the
    // symbol and none is drawn. The rule is the same one either way: the
    // symbol follows the bar's size.
    const PACKED = `return {
      heights: [...new Set([...document.querySelectorAll('#timeline rect.bar[data-id]')].map((b) => Number(b.getAttribute('height'))))],
      glyphs: [...document.querySelectorAll('#timeline use.glyph')].length,
    };`;
    await open(page, url(on('from=1900&to=1999')), READY);
    await waitFor(page, 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;', 'the packed rows');
    const squeezed = await page.eval(PACKED);
    for (const height of squeezed.heights) {
      assert.ok(height < GLYPH_BOX, `a squeezed row leaves the bar under the symbol (${height})`);
    }
    assert.equal(squeezed.glyphs, 0, 'so none is drawn');

    // And with the room to grow, the rows clear it and the same rule puts a
    // symbol on every bar that is also wide enough, and on no other.
    await open(page, url(on('fixtures=1')), READY);
    await waitFor(page, 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;', 'the fixtures\' rows');
    const roomy = await page.eval(PACKED);
    for (const height of roomy.heights) {
      assert.ok(height > Math.max(...squeezed.heights), `a row with room leaves more of it to the bar (${height})`);
    }
  }, { device: { width: 1280, height: 900, deviceScaleFactor: 1 } });
});

// --- M43b: the whole extent, over five centuries ----------------------------
//
// The fixtures run from the thirteenth century to the twenty-first, and the
// timeline's scale shares the width out century by century rather than year by
// year (timeline-scale.js). None of what follows can be seen without a layout:
// it is all about where things land in pixels at a real width.
//
// Nothing here pins a year of the corpus. The extent is the data's own and
// moves whenever a fixture record is added, so every assertion below is about
// the drawing covering what the data covers.

// The axis, the band and the strip, in the SVG's own units, plus the two ends
// the atlas says it holds — read off the band's ARIA, which is where the
// timeline writes them (timeline.js, `bandShade`).
const EXTENT = `
  const svg = document.querySelector('#timeline svg.timeline');
  const band = svg.querySelector('[data-window="band"]');
  const ticks = [...svg.querySelectorAll('.layer-tickLabels text')]
    .map((t) => ({ label: t.textContent, x: Number(t.getAttribute('x')) }))
    .sort((a, b) => a.x - b.x);
  const strips = [...svg.querySelectorAll('.layer-strips path')].map((p) => p.getAttribute('d'));
  const bars = [...svg.querySelectorAll('rect.bar[data-id]')]
    .map((el) => ({ id: el.getAttribute('data-id'), x: Number(el.getAttribute('x')), width: Number(el.getAttribute('width')) }));
  return {
    width: Number(svg.getAttribute('width')),
    min: Number(band.getAttribute('aria-valuemin')),
    max: Number(band.getAttribute('aria-valuemax')),
    from: Number(band.getAttribute('aria-valuenow')),
    valuetext: band.getAttribute('aria-valuetext'),
    bandX: Number(band.getAttribute('x')),
    bandWidth: Number(band.getAttribute('width')),
    ticks,
    strips,
    bars,
    handles: [...svg.querySelectorAll('.window-handle')].map((h) => ({
      kind: h.getAttribute('data-window'), x: Number(h.getAttribute('x')), year: Number(h.getAttribute('aria-valuenow')),
    })),
  };`;

test('the whole extent is on the axis at 1440 px, a labelled column per century', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on('fixtures=1')), READY);
    const seen = await page.eval(EXTENT);
    // The corpus really does run over several centuries, or this test is
    // about nothing.
    assert.ok(seen.max - seen.min > 200, `the fixtures span centuries (${seen.min}–${seen.max})`);

    // A tick for the first century of the data and one for the last, and one
    // for every hundred years in between: no century of the corpus is drawn
    // so narrow that it cannot be labelled.
    const centuries = [];
    for (let c = Math.ceil(seen.min / 100) * 100; c <= seen.max; c += 100) centuries.push(String(c));
    const labels = seen.ticks.map((t) => t.label);
    for (const century of centuries) {
      assert.ok(labels.includes(century), `${century} is on the axis: ${labels.join(' ')}`);
    }
    // In order left to right, and no two labels on top of one another. Eleven
    // pixels of type, so a gap under about 30 px is two labels touching.
    for (let i = 1; i < seen.ticks.length; i += 1) {
      assert.ok(seen.ticks[i].x - seen.ticks[i - 1].x > 24,
        `"${seen.ticks[i - 1].label}" and "${seen.ticks[i].label}" are ${
          Math.round(seen.ticks[i].x - seen.ticks[i - 1].x)} px apart`);
    }
  }, { device: { width: 1440, height: 900, deviceScaleFactor: 1 } });
});

test('the band opens on a century, and drags from the first year of the data to the last', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on('fixtures=1')), READY);
    const opened = await page.eval(EXTENT);
    // Not the whole extent: the atlas opens on the century that holds most of
    // the corpus (util/window.js, `opensOn`). Which century that is depends on
    // the fixtures and is not pinned here; that it is *not* everything is the
    // behaviour M43b changed.
    const [from, to] = opened.valuetext.split(' to ').map(Number);
    assert.ok(to - from < (opened.max - opened.min) / 2,
      `the band opens on part of the data, not all of it (${opened.valuetext} of ${opened.min}–${opened.max})`);
    assert.ok(opened.bandWidth > 40, `and it is wide enough to take hold of (${opened.bandWidth} px)`);

    // The two handles are where their years are, and the far one is to the
    // right of the near one.
    const near = opened.handles.find((h) => h.kind === 'from');
    const far = opened.handles.find((h) => h.kind === 'to');
    assert.equal(near.year, from);
    assert.equal(far.year, to);
    assert.ok(far.x > near.x);

    // And now the band is dragged the whole way: the near handle to the first
    // year of the data and the far one to the last. Through the real pointer
    // events, so this is the drag a reader makes and not a call to `setWindow`.
    const drag = (kind, clientX) => `
      const svg = document.querySelector('#timeline svg.timeline');
      const handle = svg.querySelector('.window-handle.${kind}');
      const box = handle.getBoundingClientRect();
      const at = { bubbles: true, cancelable: true, pointerId: 7 };
      handle.dispatchEvent(new PointerEvent('pointerdown', {
        ...at, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
      svg.dispatchEvent(new PointerEvent('pointermove', { ...at, clientX: ${clientX}, clientY: box.top + box.height / 2 }));
      svg.dispatchEvent(new PointerEvent('pointerup', { ...at, clientX: ${clientX}, clientY: box.top + box.height / 2 }));
      return true;`;
    const svgBox = await page.eval(`
      const b = document.querySelector('#timeline svg.timeline').getBoundingClientRect();
      return { left: b.left, right: b.right };`);
    // Well past each end: the band is clamped to the data and never leaves it.
    await page.eval(drag('to', Math.round(svgBox.right + 400)));
    await page.eval(drag('from', Math.round(svgBox.left - 400)));
    await waitFor(
      page,
      `return document.querySelector('#timeline [data-window="band"]').getAttribute('aria-valuenow') === '${opened.min}';`,
      'the band to reach the first year of the data',
    );
    const whole = await page.eval(EXTENT);
    const [wideFrom, wideTo] = whole.valuetext.split(' to ').map(Number);
    assert.equal(wideFrom, whole.min, 'the near end is the first year of the data');
    assert.equal(wideTo, whole.max, 'and the far end is the last');
    // The band now covers the drawing, less the lane labels' gutter and the
    // margin the scale leaves around the data at each end (timeline.js,
    // PADDING): dragged to both ends it is nearly the whole axis.
    const axis = whole.width - 120;
    assert.ok(whole.bandWidth > axis * 0.8,
      `the band covers the axis (${Math.round(whole.bandWidth)} of ${Math.round(axis)})`);
    assert.ok(whole.bandX >= 120, `and starts at the lanes, not over their labels (${whole.bandX})`);
  }, { device: { width: 1440, height: 900, deviceScaleFactor: 1 } });
});

test('the wheel zooms on the year under the pointer, in the compressed part as in the busy one', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Opened on the whole extent, so there is a compressed part to put the
    // pointer over.
    const seen = await (async () => {
      await open(page, url(on('fixtures=1')), READY);
      return page.eval(EXTENT);
    })();
    await open(page, url(on(`fixtures=1&from=${seen.min}&to=${seen.max}`)), READY);
    const wheelAt = (x) => `
      const svg = document.querySelector('#timeline svg.timeline');
      const box = svg.getBoundingClientRect();
      svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true,
        deltaY: -240, clientX: ${x}, clientY: box.top + box.height - 10 }));
      return true;`;
    const box = await page.eval(`
      const b = document.querySelector('#timeline svg.timeline').getBoundingClientRect();
      return { left: b.left, width: b.width };`);
    // A quarter of the way along, which on this corpus is a century nobody
    // wrote about — the part a linear scale would have squeezed to nothing.
    const at = Math.round(box.left + box.width * 0.35);
    const yearUnder = await page.eval(`
      const svg = document.querySelector('#timeline svg.timeline');
      const b = svg.getBoundingClientRect();
      return { x: (${at} - b.left) / b.width };`);
    const before = await page.eval(EXTENT);
    const [beforeFrom, beforeTo] = before.valuetext.split(' to ').map(Number);
    await page.eval(wheelAt(at));
    await waitFor(
      page,
      `return document.querySelector('#timeline [data-window="band"]').getAttribute('aria-valuetext') !== ${JSON.stringify(before.valuetext)};`,
      'the wheel to narrow the band',
    );
    const after = await page.eval(EXTENT);
    const [afterFrom, afterTo] = after.valuetext.split(' to ').map(Number);
    assert.ok(afterTo - afterFrom < beforeTo - beforeFrom, 'the band narrowed');
    // And it narrowed around the pointer: the year that was under it is still
    // inside the band, and roughly where it was along it.
    const target = beforeFrom + (beforeTo - beforeFrom) * yearUnder.x;
    assert.ok(afterFrom <= target && target <= afterTo,
      `the year under the pointer is still in the band (${afterFrom}–${afterTo}, wanted ${Math.round(target)})`);
    assert.ok(yearUnder.x > 0 && yearUnder.x < 1);
  }, { device: { width: 1440, height: 900, deviceScaleFactor: 1 } });
});

test('past the margin the corpus is a density strip, and it covers the compressed part', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(on('fixtures=1')), READY);
    const seen = await page.eval(EXTENT);
    // The events the band does not reach are still said to be there — that is
    // what the strip is for (density.js) — and on this corpus there are some.
    assert.ok(seen.strips.length > 0, 'the rest of the corpus is drawn as a strip');
    // Its columns are spread over the drawing and not heaped at one edge: the
    // compressed centuries each have a width of their own, which is the whole
    // argument for the bucketed scale.
    const columns = seen.strips.flatMap((d) => [...d.matchAll(/M([\d.]+) /g)].map((m) => Number(m[1])));
    assert.ok(columns.length > 1, `the strip has columns (${columns.length})`);
    const spread = Math.max(...columns) - Math.min(...columns);
    assert.ok(spread > seen.width * 0.25,
      `and they run across the drawing (${Math.round(spread)} px of ${seen.width})`);
    // Every bar the timeline drew is inside the drawing, strip and all.
    for (const bar of seen.bars) {
      assert.ok(bar.x >= 0 && bar.x + bar.width <= seen.width + 1,
        `${bar.id} is inside the drawing (${bar.x}…${bar.x + bar.width} of ${seen.width})`);
    }
  }, { device: { width: 1440, height: 900, deviceScaleFactor: 1 } });
});

// M66. The rows were still sized for the strip the timeline was before M60
// gave it the whole view: twenty of them at 22 px under a 795 px pane, with
// 304 px of empty ground below the bottom one drawn as one enormous last lane.
// It read as a drawing that had stopped early. The rows grow into the room
// now, as far as a cap (docs/m66-rows.md), and what this asserts is the
// property and not either number: nothing is left under the bottom row that a
// row could have had.
test('on a tall pane the rows take the room, and nothing is left under the bottom one', { skip }, async () => {
  const { ROW_HEIGHT, LANE_MAX } = ROW_LIMITS;
  await withBrowser(async (page, url) => {
    // On the fixtures, which pack into a handful of rows and leave room to
    // grow into. Since M77 the repository's own corpus never does: every bar
    // carries its title, that takes more rows than a pane holds, and the rows
    // are at their floor with the pane scrolling — which is the test below.
    await open(page, url(on('fixtures=1')), READY);
    const fit = await fitOf(page);
    fits(fit, 'a 900 px window');
    assert.ok(fit.lanes > 1 && fit.bars > 0, `the atlas drew something (${fit.lanes} lanes, ${fit.bars} bars)`);
    // The rows are taller than the height they would have settled for, which
    // is the whole of the change.
    assert.ok(fit.laneHeight > ROW_HEIGHT,
      `a row takes more than the strip's height (${fit.laneHeight} of ${ROW_HEIGHT})`);
    assert.ok(fit.laneHeight <= LANE_MAX, `and never more than the cap (${fit.laneHeight})`);
    // And nothing is left under the bottom row that a row could have had: the
    // last lane is a lane like the others and not the leftover strip it used
    // to be. Unless the cap is what stopped the rows, which is the case this
    // pane and these eleven events are in — room going spare above the cap is
    // room a row may not have, or a tall window would draw stripes. The same
    // disjunction the pure rule is held to (tests/timeline-rows.test.mjs).
    if (fit.laneHeight < LANE_MAX) {
      assert.ok(fit.lastLane <= fit.laneHeight + 1,
        `no band of empty ground under the bottom row (${fit.lastLane} against ${fit.laneHeight})`);
    }
  }, { device: { width: 1440, height: 900, deviceScaleFactor: 1 } });
});

// Taller still, and the cap is what stops the rows rather than the room: a
// timeline of stripes would be no better a drawing than one that stopped
// early. The pane is the drawing either way — the last lane carries the
// remainder, as it has since the lanes were laid into a measured pane.
test('on a very tall pane the rows stop at their cap', { skip }, async () => {
  const { LANE_MAX } = ROW_LIMITS;
  await withBrowser(async (page, url) => {
    await open(page, url(on('fixtures=1')), READY);
    const fit = await fitOf(page);
    fits(fit, 'a 1400 px window');
    assert.equal(fit.laneHeight, LANE_MAX, `the rows are at the cap (${fit.laneHeight})`);
  }, { device: { width: 1440, height: 1400, deviceScaleFactor: 1 } });
});

// And the other end, which is the ordinary case on the repository's own corpus
// since M77: every bar carries its title, the packing needs more rows than the
// pane holds, and rather than squeeze a row below the height a title is
// legible in — or pack the overflow away behind a count, which is what the
// owner asked to have removed — the drawing is taller than its pane and the
// pane scrolls. No count is pinned: what is asserted is the floor, the
// overflow and the scroll.
test('when the titles need more rows than the pane holds, the floor holds and the pane scrolls', { skip }, async () => {
  const { ROW_HEIGHT } = ROW_LIMITS;
  await withBrowser(async (page, url) => {
    await open(page, url(on('from=1900&to=1999')), READY);
    // How many rows the titles need is the whole question here, so the wait is
    // that they are all in — not that one label has been drawn, which is true
    // while the rest of the centuries are still arriving and the rows are still
    // being counted.
    await until(page, BARS_NAMED);
    const fit = await fitOf(page);
    assert.equal(fit.laneHeight, ROW_HEIGHT, `at the floor and no further (${fit.laneHeight})`);
    assert.ok(fit.svgHeight > fit.paneHeight,
      `the drawing is taller than the pane (${fit.svgHeight} of ${fit.paneHeight})`);
    assert.equal(fit.scrollHeight, fit.svgHeight, 'so the pane scrolls it rather than cutting it off');
  }, { device: { width: 1280, height: 700, deviceScaleFactor: 1 } });
});

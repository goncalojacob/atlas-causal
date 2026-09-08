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
import { withBrowser, open, waitFor, skip } from './browser.mjs';

const READY = 'return Boolean(document.querySelector(".map .mark"));';

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
    await open(page, url(''), READY);
    const fit = await page.eval(FIT);
    assert.equal(fit.windowHeight, 500);
    assert.ok(fit.lanes > 1 && fit.bars > 0, `the atlas drew something (${fit.lanes} lanes, ${fit.bars} bars)`);
    fits(fit, 'a 500 px window');
  }, { device: { width: 1280, height: 500, deviceScaleFactor: 1 } });
});

test('when the rows have the room they take it, and the pane does not scroll', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Eleven fixture events pack into a handful of rows, which fit.
    await open(page, url('?fixtures=1'), READY);
    const fit = await page.eval(FIT);
    fits(fit, 'the fixtures at 500 px');
    assert.equal(fit.svgHeight, fit.paneHeight, 'the drawing is exactly the pane');
    assert.ok(fit.lowestBar <= fit.paneHeight, 'so the bottom row is on screen without scrolling');
  }, { device: { width: 1280, height: 500, deviceScaleFactor: 1 } });
});

// Known failing since the world merge of 8 September 2026: with the world's
// events the rows overflow the pane at the 14 px floor, so a shorter window
// cannot change the svg's height. I6 derives the row cap from the pane and
// takes this todo off (docs/index2/i6-brief.md).
test('the lanes are laid out again when the window changes height', { skip, todo: 'until I6 caps the rows by the pane' }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(''), READY);
    const tall = await page.eval(FIT);
    fits(tall, 'a 900 px window');

    await page.send('Emulation.setDeviceMetricsOverride', {
      mobile: false, width: 1280, height: 460, deviceScaleFactor: 1,
    });
    await waitFor(page, 'return innerHeight === 460;', 'the window to be short');
    await waitFor(
      page,
      `return document.querySelector('.timeline-area').clientHeight !== ${tall.paneHeight};`,
      'the pane to be re-measured',
    );
    // The observer answers a change of height, not only of width.
    await waitFor(
      page,
      `return Number(document.querySelector('#timeline svg.timeline').getAttribute('height')) !== ${tall.svgHeight};`,
      'the lanes to be laid out again',
    );

    const short = await page.eval(FIT);
    fits(short, 'after the window was made short');
    assert.equal(short.lanes, tall.lanes, 'the same lanes');
    assert.ok(short.laneHeight < tall.laneHeight, 'squeezed into what is left');

    // And back again: nothing is one-way.
    await page.send('Emulation.setDeviceMetricsOverride', {
      mobile: false, width: 1280, height: 900, deviceScaleFactor: 1,
    });
    await waitFor(
      page,
      `return Number(document.querySelector('#timeline svg.timeline').getAttribute('height')) === ${tall.svgHeight};`,
      'the lanes to come back',
    );
    fits(await page.eval(FIT), 'back at 900 px');
  }, { device: { width: 1280, height: 900, deviceScaleFactor: 1 } });
});

// The note is inside the pane and above the drawing, so its height is the
// drawing's to lose — and while it was hidden it kept its 29 pixels and its
// pin anyway, because `display: flex` beats the UA rule for [hidden].
test('the note takes no room while the timeline is showing the whole world', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(''), READY);
    const quiet = await page.eval(`const note = document.querySelector('.timeline-note');
      return { hidden: note.hidden, height: Math.round(note.getBoundingClientRect().height) };`);
    assert.equal(quiet.hidden, true);
    assert.equal(quiet.height, 0, 'a hidden note is not a 29-pixel strip with a button in it');
    fits(await page.eval(FIT), 'with no box');

    // With a box it is back, and the drawing gives way to it.
    await open(page, url('?bbox=-10,36,-6,43'), READY);
    const loud = await page.eval(`const note = document.querySelector('.timeline-note');
      return { hidden: note.hidden, height: Math.round(note.getBoundingClientRect().height) };`);
    assert.equal(loud.hidden, false);
    assert.ok(loud.height > 10, 'the note is showing');
    const fit = await page.eval(FIT);
    assert.equal(fit.scrollHeight, fit.svgHeight + loud.height, 'and the pane holds the note and the drawing');
    assert.ok(fit.lowestBar <= fit.svgHeight);
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
    await open(page, url(''), READY);
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
      const el = document.querySelector('#timeline rect.bar[data-id]');
      return { id: el.getAttribute('data-id'), before: el.getAttribute('class') };`);
    // Selecting a bar changes the class of that bar and of everything the
    // selection emphasises, and nothing else about the picture.
    await page.eval(`
      document.querySelector('#timeline rect.bar[data-id="${first.id}"]').dispatchEvent(
        new MouseEvent('click', { bubbles: true }));
      return true;`);
    await waitFor(
      page,
      `return document.querySelector('#timeline rect.bar[data-id="${first.id}"]')?.classList.contains('selected');`,
      'the bar to be drawn as selected',
    );
    const churn = await page.eval('return { added: window.__added, removed: window.__removed };');
    const after = await page.eval("return document.querySelectorAll('#timeline svg.timeline *').length;");
    // A handful: the bar that was opened leaves the packed rows for the layer
    // of what the reader is holding, and takes a title and a label with it.
    // Before H4c every element in the drawing was removed and made again on
    // every state change, which on this dataset is some hundreds and at
    // twenty thousand events is tens of thousands.
    assert.ok(before > 100, `the atlas drew something (${before} elements)`);
    assert.ok(churn.removed < 10, `the drawing was not rebuilt (${churn.removed} of ${before} elements removed)`);
    assert.ok(churn.added < 10, `nor built again (${churn.added} elements added)`);
    assert.ok(Math.abs(after - before) < 10, `and it is the same drawing (${before} to ${after})`);

    // And the layers are still the only children of the <svg>: nothing was
    // appended to the root behind their backs.
    const shape = await page.eval(`
      const svg = document.querySelector('#timeline svg.timeline');
      return {
        children: [...svg.children].map((el) => el.getAttribute('class')),
        strays: [...svg.children].filter((el) => el.tagName !== 'g').length,
      };`);
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
    await open(page, url('?fixtures=1&group=region&selected=fixture-event-f'), READY);
    await waitFor(page, 'return document.querySelectorAll("#timeline .layer-bands rect").length > 0;', 'the band');

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

test('no bracket where the parts cross lanes, and none at all with no grouping', { skip }, async () => {
  await withBrowser(async (page, url) => {
    const brackets = 'return document.querySelectorAll("#timeline .layer-brackets line").length;';
    await open(page, url('?fixtures=1&group=region'), READY);
    assert.equal(await page.eval(brackets), 0, 'the fixtures\' one parent is a large event, and has the band');
    await open(page, url('?fixtures=1'), READY);
    assert.equal(await page.eval(brackets), 0, 'and with no grouping there are no lanes to draw one on');
  }, { device: { width: 1280, height: 700, deviceScaleFactor: 1 } });
});

// --- a parent looks like one, wherever the bracket is not --------------------
//
// M30c, §1: the bracket of A9 is drawn only where the parts share a lane and
// the lanes are named, so under `group: none` — the default — and over a
// parent whose parts cross lanes, nothing said a parent was one. The ring is
// what a reader sees where the bracket is not, and it is drawn under every
// grouping. `fixture-event-f` is the one parent either corpus carries; its
// parts fall in two lanes, so it never has a bracket at all.
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

test('a parent\'s bar is ringed under no grouping and under the region lanes', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // With no grouping at all, where there is no vertical room for a bracket
    // and the card's "Part of" line used to be the only word on it.
    await open(page, url('?fixtures=1'), READY);
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
    assert.equal(packed.layer, 'layer layer-bars', 'drawn through the bars\' own pool');

    // And in the region lanes, where this parent's parts cross lanes and it is
    // drawn as a band rather than a bracket. Selected, because that is the
    // only way to be sure of a bar of its own there (the band test above), and
    // it exercises the layer the reader's own records are drawn in.
    await open(page, url('?fixtures=1&group=region&selected=fixture-event-f'), READY);
    const banded = await page.eval(RING_AROUND('fixture-event-f'));
    assert.ok(banded.ring, 'the ring is drawn under a grouping too');
    assert.equal(banded.layer, 'layer layer-held', 'in the layer its bar is in');
    assert.match(banded.ring.classes, /\bselected\b/, 'and it carries the emphasis its bar carries');
    assert.doesNotMatch(banded.ring.classes, /\bbar\b/, 'a ring is an outline, not a record');

    // A leaf is drawn exactly as it was.
    const leaf = await page.eval(RING_AROUND('fixture-event-b'));
    assert.ok(leaf.bar, 'the leaf has a bar');
    assert.equal(leaf.ring, null, 'and nothing around it');
  }, { device: { width: 1280, height: 700, deviceScaleFactor: 1 } });
});

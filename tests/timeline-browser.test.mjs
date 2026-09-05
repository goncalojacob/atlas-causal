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

test('the lanes are laid out again when the window changes height', { skip }, async () => {
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

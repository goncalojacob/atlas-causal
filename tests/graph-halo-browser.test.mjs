// The halo behind a graph label, read off the picture itself.
//
// A label holds its size on screen at any zoom (M61, and the map's rule
// before it). The halo behind it is a stroke on the same text, and a stroke
// inside the group the zoom scales grows with the picture: the paper band
// round the letters swelled as the reader went in, and eventually began
// eating the letters it exists to hold apart from what is behind them (M66).
//
// Neither thing this file asserts can be read off the DOM. An SVG text's
// bounding box does not include its stroke — which is why M61 could measure
// the letters and say nothing about the halo — and a computed `stroke-width`
// is what was asked for and not what was painted. So the assertions here are
// about pixels: Chromium's own screenshot of a clip round each label, decoded
// by tests/png.mjs, classified against the tokens in src/style.css.
//
// `--disable-lcd-text` is not a convenience. Subpixel-antialiased text carries
// a blue fringe down the right-hand side of every stem, and a blue fringe is
// indistinguishable from the cobalt line the halo is holding off. Grayscale
// antialiasing is what these two tests can read; it changes how the text is
// rasterised in this one browser and nothing about what the page draws.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { withBrowser, open, seenIntro, waitFor, watchErrors, errorsOn, skip } from './browser.mjs';
import { shoot } from './png.mjs';
import { ROOT } from './helpers.mjs';
import { fromHex, distance, tokensOf } from '../tools/lib/colour.mjs';

const tokens = tokensOf(await readFile(path.join(ROOT, 'src', 'style.css'), 'utf8'));
const token = (name) => {
  const value = tokens.get(name);
  assert.ok(value, `style.css defines ${name}`);
  return fromHex(value);
};
const PAPER = token('--paper');
const INK = token('--ink');
const MADDER = token('--madder');
const COBALT = token('--cobalt');

// How close a pixel has to be to a token to be called it, in OKLab. Paper's
// is the tighter of the two because the ground it is drawn on is 0.026 away
// and nothing between the two may be counted as either; 0.09 is comfortably
// under the 0.179 between ink and cobalt, so no antialiased letter is ever
// read as a line or the other way about.
const NEAR_PAPER = 0.015;
const NEAR = 0.09;
const isPaper = (p) => distance(p, PAPER) < NEAR_PAPER;
// The two colours a label's letters are drawn in: ink, and madder for the
// event the reader has open.
const isLetter = (p) => distance(p, INK) < NEAR || distance(p, MADDER) < NEAR;
const isLine = (p) => distance(p, COBALT) < NEAR;
const rgb = (p) => p.map((v) => v / 255);

// Device pixels to the CSS pixel in every shot here: the band this is about
// is a pixel and a half wide when it is right, and a band measured in whole
// screen pixels is measured to two thirds of itself.
const SHOT = 4;
// Enough room round a label to hold the halo at any zoom, and the ground
// beyond it.
const PAD = 30;

const VIEW = '?view=graph&from=1900&to=1999';
const DRAWN = 'return document.querySelector("svg.graph text.node-label") !== null;';
const LCD_OFF = ['--disable-lcd-text'];

// The zoom in force, off the viewport's own transform, as M61 reads it.
const SCALE = `
  const t = document.querySelector('svg.graph .viewport').getAttribute('transform') || 'scale(1)';
  const m = /scale\\(([\\d.]+)\\)/.exec(t);
  return m ? Number(m[1]) : 1;`;
const WORLD = `
  document.querySelector('svg.graph').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  return true;`;
const BOXES = `
  return [...document.querySelectorAll('svg.graph text.node-label')].map((el) => {
    const r = el.getBoundingClientRect();
    return { text: el.textContent, x: r.left, y: r.top, w: r.width, h: r.height };
  });`;

async function zoomOnto(page, { x, y }, target) {
  for (let i = 0; i < 80; i += 1) {
    if (await page.eval(SCALE) >= target) break;
    await page.eval(`
      document.querySelector('svg.graph').dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true, deltaY: -120, clientX: ${Math.round(x)}, clientY: ${Math.round(y)},
      }));
      return true;`);
  }
  return page.eval(SCALE);
}

// The paper band above the letters of one label, in CSS pixels: for every
// column of the shot that has a letter in it, how far the paper runs above
// the topmost pixel of that letter. That is half the stroke — the half drawn
// outside the glyph — and it is what a reader sees swell.
async function bandsAbove(page, box) {
  const img = await shoot(page, {
    x: box.x - PAD, y: box.y - PAD, width: box.w + 2 * PAD, height: box.h + 2 * PAD, scale: SHOT,
  });
  const bands = [];
  for (let x = 0; x < img.width; x += 1) {
    let top = -1;
    for (let y = 0; y < img.height; y += 1) {
      if (isLetter(rgb(img.at(x, y)))) { top = y; break; }
    }
    if (top <= 0) continue;
    let run = 0;
    for (let y = top - 1; y >= 0 && isPaper(rgb(img.at(x, y))); y -= 1) run += 1;
    if (run > 0) bands.push(run / SHOT);
  }
  return bands;
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// The whole picture's halo at this zoom: every label pooled, because the
// halo is one rule and not one label's, and a median over all of them cannot
// be moved by a node that happens to sit above one word.
async function haloAt(page) {
  const boxes = await page.eval(BOXES);
  assert.ok(boxes.length > 0, 'the picture names something');
  const bands = [];
  for (const box of boxes) bands.push(...await bandsAbove(page, box));
  assert.ok(bands.length > 20, `the letters were found (${bands.length} columns)`);
  return median(bands);
}

test('the halo behind a label is the same width on screen at every zoom', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(VIEW), DRAWN);

    const measured = [];
    for (const target of [1, 3, 6]) {
      await page.eval(WORLD);
      await waitFor(page, DRAWN, `the picture at k = ${target}`);
      // Zoomed onto a label rather than onto the middle of the pane. The
      // middle is a point in a rectangle and says nothing about where the
      // picture names anything: M42 wrote twenty-seven edges and thirteen
      // records into the corpus, the layout moved, and at k = 6 the centre of
      // this window held no label at all, so a test about the *width of a
      // halo* timed out waiting for a name. What the halo is measured over is
      // every label the picture draws (`haloAt` pools them), so the zoom only
      // has to land somewhere the picture still names something.
      const onto = await page.eval(`
        const el = document.querySelector('svg.graph text.node-label');
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`);
      const k = await zoomOnto(page, onto, target);
      await waitFor(page, DRAWN, `something named at k = ${target}`);
      measured.push({ k, band: await haloAt(page) });
    }

    const [world, ...closer] = measured;
    assert.ok(world.band > 0, `there is a halo at all (${JSON.stringify(measured)})`);
    assert.ok(measured[2].k > measured[0].k * 3, `the three zooms are three pictures (${JSON.stringify(measured)})`);
    // The property, and the whole of this milestone: a band the same width on
    // screen wherever the reader has taken the picture. A pixel of slack for
    // where a glyph's own edge falls between two device pixels, which is well
    // under the sixfold growth this replaces.
    for (const at of closer) {
      assert.ok(Math.abs(at.band - world.band) <= 1,
        `the halo holds its width on screen: ${JSON.stringify(measured)}`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: { width: 1280, height: 800, deviceScaleFactor: 1 }, args: LCD_OFF });
});

test('a label over a line and a label over a mark both keep paper between the letters and it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(VIEW), DRAWN);
    await page.eval(WORLD);
    await waitFor(page, DRAWN, 'the world view');

    // What is behind each label, asked of the drawing rather than of the
    // pixels: an edge whose own path passes through the label's rectangle,
    // and a mark whose circle does. Both are read in screen coordinates, so
    // the zoom is already in them.
    const behind = await page.eval(`
      const svg = document.querySelector('svg.graph');
      const inside = (r, p) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
      const onScreen = (el, p) => {
        const m = el.getScreenCTM();
        return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
      };
      const out = [];
      for (const el of svg.querySelectorAll('text.node-label')) {
        const r = el.getBoundingClientRect();
        let edge = false;
        let mark = false;
        for (const path of svg.querySelectorAll('path.edge, line.edge')) {
          if (path.getTotalLength === undefined) continue;
          const length = path.getTotalLength();
          if (!(length > 0)) continue;
          for (let i = 0; i <= 60 && !edge; i += 1) {
            if (inside(r, onScreen(path, path.getPointAtLength((length * i) / 60)))) edge = true;
          }
          if (edge) break;
        }
        for (const circle of svg.querySelectorAll('circle.node')) {
          const c = circle.getBoundingClientRect();
          if (c.width === 0) continue;
          if (c.left <= r.right && r.left <= c.right && c.top <= r.bottom && r.top <= c.bottom) { mark = true; break; }
        }
        out.push({
          text: el.textContent, edge, mark,
          x: r.left, y: r.top, w: r.width, h: r.height,
        });
      }
      return out;`);

    const overLine = behind.find((b) => b.edge);
    const overMark = behind.find((b) => b.mark);
    assert.ok(overLine, 'a label is drawn over a line');
    assert.ok(overMark, 'a label is drawn over a mark');

    for (const [what, box] of [['a line', overLine], ['a mark', overMark]]) {
      const img = await shoot(page, {
        x: box.x - 4, y: box.y - 4, width: box.w + 8, height: box.h + 8, scale: SHOT,
      });
      let letters = 0;
      let lines = 0;
      const touching = [];
      for (let y = 0; y < img.height; y += 1) {
        for (let x = 0; x < img.width; x += 1) {
          const p = rgb(img.at(x, y));
          if (isLine(p)) lines += 1;
          if (!isLetter(p)) continue;
          letters += 1;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
            if (isLine(rgb(img.at(nx, ny)))) touching.push(`${x},${y}`);
          }
        }
      }
      // The case is a real one — there is something cobalt inside the label's
      // own rectangle — and the letters are drawn in it.
      assert.ok(lines > 0, `${box.text} really is drawn over ${what}`);
      assert.ok(letters > 0, `${box.text} has letters to read`);
      // And the halo is doing its job: not one pixel of a letter has the line
      // against it. Take the halo away and this is where the two meet.
      assert.deepEqual(touching.slice(0, 8), [],
        `${box.text} over ${what}: ${touching.length} letter pixels with the line against them`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: { width: 1280, height: 800, deviceScaleFactor: 1 }, args: LCD_OFF });
});

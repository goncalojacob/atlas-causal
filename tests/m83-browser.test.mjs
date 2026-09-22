// M83, the half only a drawing can answer: World War II opened on the graph,
// and the key over it.
//
// `tests/m83.test.mjs` holds the arithmetic — nothing off the axis, a node on
// its own date, no row of marks pinned to the edge of the field. What is left
// here is what the browser has to lay out before anybody can say it:
//
//   A1-3  the lens's own links are the ones in ink and the ring's are faint,
//         which is M77's rule for a walk applied to every lens;
//   A1-4  the key is one button on every width, and the picture under its
//         corner is not covered until the reader asks for it.
//
// Written before the behaviour it judges (deviations 711 and 717), and nothing
// here pins a count or a pixel: every assertion is a comparison between two
// things the same page drew.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  withBrowser, open, skip, waitFor, watchErrors, errorsOn, seenIntro,
} from './browser.mjs';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1, mobile: true };

const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const NODES = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length > 0;";
const WAR = '?view=graph&selected=world-war-ii';

// Every line the graph drew, with the ink the browser actually gave it and
// whether it is one of the ring's.
const LINES = `
  const svg = document.querySelector('svg.graph');
  return [...svg.querySelectorAll('line.edge')].map((el) => ({
    faint: el.classList.contains('lens-near'),
    opacity: Number(getComputedStyle(el).opacity),
  }));`;

const KEY = `
  const box = document.querySelector('#graph .graph-key');
  if (!box) return null;
  const button = box.querySelector('.graph-key-toggle');
  const body = box.querySelector('.graph-key-body');
  const shown = (el) => (el ? el.getBoundingClientRect().height > 0 : false);
  const picture = document.querySelector('svg.graph').getBoundingClientRect();
  return {
    button: shown(button),
    body: shown(body),
    share: (box.getBoundingClientRect().width * box.getBoundingClientRect().height)
      / (picture.width * picture.height),
  };`;

const press = "document.querySelector('#graph .graph-key .graph-key-toggle').click(); return true;";

test('A1-3: with the war opened, the lens\'s links are in ink and the ring\'s are faint', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const lines = await page.eval(LINES);
    assert.ok(lines.length > 3, 'there are lines to read');
    const own = lines.filter((l) => !l.faint);
    const ring = lines.filter((l) => l.faint);
    assert.ok(own.length > 0, 'the lens has links of its own');
    assert.ok(ring.length > 0, 'and the ring around it has some');
    // M77's rule, and it is a comparison and not a number: whatever the
    // stylesheet spends, what the reader asked about is inked over what it
    // merely reaches.
    assert.ok(
      Math.max(...ring.map((l) => l.opacity)) < Math.min(...own.map((l) => l.opacity)),
      'every one of the ring\'s lines is fainter than every one of the lens\'s',
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('A1-4: the key is one button on a desktop, and opens behind it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const folded = await page.eval(KEY);
    assert.ok(folded, 'the graph has a key');
    assert.equal(folded.button, true, 'there is one button');
    assert.equal(folded.body, false, 'and the key is behind it');
    const opened = await (async () => { await page.eval(press); return page.eval(KEY); })();
    assert.equal(opened.body, true, 'pressing it opens the key');
    assert.ok(opened.share > folded.share,
      'the open key covers more of the picture than the folded one, which is why it folds');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('A1-4: and the same one button on a phone', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const folded = await page.eval(KEY);
    assert.equal(folded.button, true, 'the button is there');
    assert.equal(folded.body, false, 'and the key is behind it');
  }, { device: PHONE });
});

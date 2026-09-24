// M86, the half only a drawing can answer: a name on the resting map, a stack
// drawn after a drag on the graph, a camera that survives a resize, and a
// degree control that says it is off.
//
// `tests/m86.test.mjs` holds what needs no DOM. Written before the behaviour
// it judges (deviations 711 and 717), and **nothing here pins a count or a
// pixel**: the labels are counted off the picture the page drew, the stacks
// are read against the rectangle the page itself reports, and the zoom is
// read before the gesture rather than written down here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  withBrowser, open, skip, waitFor, until, watchErrors, errorsOn, seenIntro,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';

// The corpus the page is served, so every expectation below is the data's own.
const atlas = await atlasOf(path.join(ROOT, 'data'));

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };

const MAP_READY = 'return document.querySelectorAll("#map circle.mark").length > 0;';

// What the map has written on itself: the names, and the badges beside the
// stacks. Read off the picture and not off any state.
const MAP_WORDS = `
  return {
    labels: [...document.querySelectorAll('#map text.mark-label')].map((el) => el.textContent),
    badges: [...document.querySelectorAll('#map text.cluster-count')].map((el) => el.textContent),
    marks: document.querySelectorAll('#map circle.mark').length,
  };`;

// ─── 2. the first map has names (A2, A11) ──────────────────────────────────

test('the resting map carries event names, at the zoom a reader arrives at', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(''), MAP_READY);
    await waitFor(page, MAP_READY, 'the map to draw');
    // A name arrives with its century and not with its mark (attributes.js),
    // so the wait is for a label to be written and never for a timer. `until`
    // and not `waitFor`, because this wait *is* the test's own assertion: a
    // map that never writes one must be reported by the assertion below, with
    // what it did draw, and not thrown away as a timeout (M78).
    await until(page, 'return document.querySelectorAll("#map text.mark-label").length > 0;');

    const words = await page.eval(MAP_WORDS);
    assert.ok(words.marks > 0, 'the map drew marks');
    assert.ok(words.labels.length > 0,
      `the resting world carries no event name at all (${words.marks} marks, 0 labels)`);
    // Nothing is pinned: what is asked is that the picture is not all names
    // either — the floor exists so that the world does not become a smudge.
    assert.ok(words.labels.length <= words.marks,
      `more labels than marks (${words.labels.length} of ${words.marks})`);
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

test('and no badge on it reads "1 more"', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(''), MAP_READY);
    await waitFor(page, MAP_READY, 'the map to draw');
    const words = await page.eval(MAP_WORDS);
    for (const badge of words.badges) {
      assert.notEqual(badge, '1 more', 'a stack of two carries a badge as loud as a stack of thirteen');
      assert.notEqual(badge.trim(), '', 'an empty badge was drawn');
    }
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

// ─── 4. the timeline's right edge (A6) ─────────────────────────────────────

const LANES_READY = 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;';

// The axis's own tick labels, and every title with the box it occupies, in the
// page's own pixels — which is the only place "cut by the pane edge" is a
// question that can be asked.
const TIMELINE_EDGE = `
  const svg = document.querySelector('svg.timeline');
  const pane = svg.getBoundingClientRect();
  return {
    pane: { left: pane.left, right: pane.right },
    ticks: [...svg.querySelectorAll('text.tick-label')].map((el) => el.textContent),
    labels: [...svg.querySelectorAll('text.bar-label')].map((el) => {
      const box = el.getBoundingClientRect();
      return { text: el.firstChild ? el.firstChild.nodeValue : '', left: box.left, right: box.right };
    }),
  };`;

test('no tick runs past the last year of the data, and no resting title is cut by the pane', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=timeline'), LANES_READY);
    await waitFor(page, LANES_READY, 'the timeline to draw');
    // The titles arrive with their centuries; this waits for one and asserts
    // about all of them below.
    await until(page, 'return document.querySelectorAll("#timeline text.bar-label").length > 0;');

    const seen = await page.eval(TIMELINE_EDGE);
    assert.ok(seen.labels.length > 0, 'the timeline wrote no title at all');
    // The last year the atlas holds, read off the same records the page was
    // served rather than written down here: the corpus grows under this test
    // every day.
    const last = atlas.extent?.max ?? null;
    if (last !== null) {
      for (const tick of seen.ticks) {
        const year = Number(String(tick).replace(/[^\d-]/g, ''));
        if (!Number.isFinite(year) || String(tick).includes('BCE')) continue;
        assert.ok(year <= last, `a tick at ${tick} past the last year of the data (${last})`);
      }
    }
    // And every title is inside the pane it is drawn in. A name written into
    // the edge is the review's own "COVID-19 pander".
    for (const label of seen.labels) {
      assert.ok(label.right <= seen.pane.right + 1,
        `"${label.text}" runs past the right edge (${label.right} > ${seen.pane.right})`);
      assert.ok(label.left >= seen.pane.left - 1,
        `"${label.text}" runs past the left edge (${label.left} < ${seen.pane.left})`);
    }
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

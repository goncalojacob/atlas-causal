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

import {
  withBrowser, open, skip, waitFor, until, watchErrors, errorsOn, seenIntro,
} from './browser.mjs';

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

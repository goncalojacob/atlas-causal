// M85, the half only a drawing can answer: the first picture is the whole
// span (A4), and no stack on it carries a bare "+46".
//
// `tests/m85.test.mjs` holds what needs no DOM — that the resting window is
// the corpus's own extent, and the words a stack says about itself. What is
// here is the thing the review actually saw: a reader who arrives at the atlas
// and types nothing is looking at six centuries and not at one.
//
// Written before the behaviour it judges (deviations 711 and 717). Nothing
// here pins a count or a pixel: the centuries are read off the corpus the page
// was served, and the badges are matched by shape.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  withBrowser, open, skip, waitFor, watchErrors, errorsOn, seenIntro,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { centuryOf } from '../src/util/window.js';
import { extent } from '../src/util/dates.js';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };

// **The repository's own corpus and not the fixtures.** The fixtures put every
// event outside the thirteenth century in no place at all, so the map could
// never draw a second century of them however the window opened — which is a
// fact about the fixtures and not about the atlas. What the review saw was
// `data/`, and that is what this asks.
const atlas = await atlasOf(path.join(ROOT, 'data'));

// Which century an id the page drew belongs to, asked of the same records the
// page was served. A cluster's key is its representative's id, so a stack
// counts as the century of the mark that stands for it.
function centuryOfId(id) {
  const event = atlas.events.get(id);
  return event ? centuryOf(extent(event.when).min) : null;
}

// Every mark, bar and node the three views draw, by the id each carries.
const DRAWN = `
  const ids = (selector, attribute) => [...document.querySelectorAll(selector)]
    .map((el) => el.getAttribute(attribute)).filter(Boolean);
  return {
    map: [...ids('#map circle.mark[data-id]', 'data-id'),
          ...ids('#map circle.mark.cluster[data-cluster]', 'data-cluster')],
    timeline: ids('#timeline rect.bar[data-id]', 'data-id'),
    graph: [...ids('#graph circle.node[data-id]', 'data-id'),
            ...ids('#graph circle.node.stack[data-stack]', 'data-stack')],
    badges: [...document.querySelectorAll('text.cluster-count')].map((el) => el.textContent),
  };`;

const MAP_READY = 'return document.querySelectorAll("#map circle.mark").length > 0;';
const LANES_READY = 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;';
const GRAPH_READY = 'return document.querySelectorAll("#graph circle.node").length > 0;';

async function centuriesOn(page, url, view, ready, key) {
  await open(page, url(view), ready);
  await waitFor(page, ready, `${key} to draw`);
  const drawn = await page.eval(DRAWN);
  const centuries = new Set(drawn[key].map(centuryOfId).filter((c) => c !== null));
  return { centuries, badges: drawn.badges };
}

test('a reader who types nothing sees the whole span, on all three views', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // The spread of the corpus itself, so the expectation is the data's and not
    // a number written here: a test that asked for "more than one century" of a
    // corpus inside one century would be asking for the impossible, and one
    // that asked for six would break on the next import.
    const whole = new Set([...atlas.activeEvents]
      .map((e) => centuryOf(extent(e.when).min)));
    assert.ok(whole.size > 1, `the corpus spans ${whole.size} century/centuries`);

    for (const [view, ready, key] of [
      ['', MAP_READY, 'map'],
      ['?view=timeline', LANES_READY, 'timeline'],
      ['?view=graph', GRAPH_READY, 'graph'],
    ]) {
      const { centuries, badges } = await centuriesOn(page, url, view, ready, key);
      assert.ok(centuries.size > 1,
        `${key} draws ${centuries.size} century/centuries at rest: ${[...centuries].join(', ')}`);
      // And nothing on it is a bare "+46", which reads as a typo (A4).
      for (const badge of badges) {
        assert.doesNotMatch(badge.trim(), /^\+\d+$/, `a stack is labelled "${badge}"`);
      }
    }
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

// ─── 2. the graph's control speaks the reader's language (A12) ─────────────

test('nothing on the graph’s control says “links or more”', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=graph'), GRAPH_READY);
    const seen = await page.eval(`
      const group = document.querySelector('.graph-filters');
      if (!group) return null;
      const select = group.querySelector('[data-filter="degree"]');
      return {
        text: group.textContent.replace(/\\s+/g, ' ').trim(),
        options: [...select.options].map((o) => o.textContent),
        shown: group.getBoundingClientRect().height > 0,
      };`);
    // Or there is no control at all, which is the other answer the brief allows.
    if (seen === null) return;
    assert.equal(seen.shown, true, 'the control is on the graph');
    assert.ok(!seen.text.includes('links or more'), `the control reads "${seen.text}"`);
    for (const option of seen.options) {
      assert.ok(!option.includes('links or more'), `an option reads "${option}"`);
      assert.match(option, /^Show /, `"${option}" is a sentence about the picture`);
    }
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

// ─── 4. two labels (A15) ───────────────────────────────────────────────────

test('“borders as of” is on the map and never in the timeline’s masthead', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);

    await open(page, url(''), MAP_READY);
    await waitFor(page, 'return Boolean(document.querySelector("#map .map-corner .map-borders"));',
      'the borders line on the map');
    const onMap = await page.eval('return document.querySelector("#map .map-corner .map-borders").textContent;');
    assert.match(onMap, /borders/, `the map says "${onMap}"`);

    await open(page, url('?view=timeline'), LANES_READY);
    const timeline = await page.eval(`
      return {
        pane: document.querySelector('#timeline').textContent,
        borders: document.querySelectorAll('#timeline .window-marker').length,
      };`);
    assert.equal(timeline.borders, 0, 'the timeline draws no borders line');
    assert.ok(!timeline.pane.includes('borders as of'), 'and says nothing about borders');
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

test('the export button on both pictures says what the file is', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    for (const [view, ready] of [['', MAP_READY], ['?view=graph', GRAPH_READY]]) {
      await open(page, url(view), ready);
      const seen = await page.eval(`
        const button = document.querySelector('.view-export');
        return button ? { text: button.textContent.trim(), title: button.title } : null;`);
      assert.ok(seen, `${view || 'the map'} carries the control`);
      assert.equal(seen.text, 'Export as SVG', 'it names the file it hands over');
      assert.match(seen.title, /SVG file/, 'and its title still says the rest');
    }
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

// ─── 5. the about page is one screen (A16) ─────────────────────────────────

test('the about page fits a screen and the essay under it opens', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url('about.html'), 'return Boolean(document.querySelector(".page .prose h2"));');
    const about = await page.eval(`
      const link = [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === 'essay.html');
      return {
        headings: [...document.querySelectorAll('.prose h2')].map((h) => h.textContent),
        link: Boolean(link),
        // What a reader scrolls past to reach the foot, in screens.
        screens: document.documentElement.scrollHeight / innerHeight,
      };`);
    assert.ok(about.headings.length >= 4, `the page says what it is (${about.headings.join(' · ')})`);
    assert.equal(about.link, true, 'and links to the essay');
    // "One screen" is the claim the brief makes; three is the slack a browser's
    // own type size and a narrow measure are allowed, and the essay it replaces
    // was thirty.
    assert.ok(about.screens < 3, `the about page is ${about.screens.toFixed(1)} screens`);

    await open(page, url('essay.html'), 'return Boolean(document.querySelector(".page .prose h2"));');
    const essay = await page.eval(`
      const back = [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === 'about.html');
      return {
        headings: document.querySelectorAll('.prose h2, .prose h3').length,
        back: Boolean(back),
        screens: document.documentElement.scrollHeight / innerHeight,
      };`);
    assert.ok(essay.headings > about.headings.length, 'the essay is the essay');
    assert.equal(essay.back, true, 'and it links back');
    assert.ok(essay.screens > about.screens, 'and it is the longer of the two');
    assert.deepEqual(await errorsOn(page), []);
  }, { device: DESK });
});

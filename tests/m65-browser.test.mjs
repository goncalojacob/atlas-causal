// The two rules of M65 in a real browser, on all three views.
//
// `tests/m65.test.mjs` holds the rules themselves, without a DOM. What needs a
// browser is whether the pictures obey them: whether the map, the graph and
// the timeline rest on the main events alone and narrow together when an event
// is chosen. What each view is expected to draw is computed here by the very
// module the page uses (`emphasis.js`), over an atlas built from the same
// index the page fetches — the assertion is "the picture is the filter", not a
// second implementation of the filter written in test code.
//
// Nothing here pins a count: what is asserted is that every id drawn is one
// the shared source allows, and that the ones the choice is about are there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { withBrowser, open, waitFor, skip } from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { workingSet } from '../src/emphasis.js';
import { isMain } from '../src/lens.js';
import { defaultState } from '../src/state.js';

const dataDir = path.join(ROOT, 'data');

// Wide enough that the views draw the filter rather than the packing: a stack
// carries no id, so a picture short of room answers with fewer ids than it
// drew events (lens-browser.test.mjs says the same thing at more length).
const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };

// `selector` is what carries an id and so what can be checked against the
// model; `drawn` is everything the view put on the screen, clusters included.
// The two are not the same measure and narrowing has to be read off the
// second: a stack carries no id, so as the corpus grows the id-carrying marks
// are a smaller and smaller part of the picture. Measured on 21 September, at
// the whole extent, the map draws 17 marks of which 4 carry an id, and the
// lens of one event draws 4 marks all of which do — the map narrowed by a
// factor of four and the id count did not move at all (M42, deviation 976).
const VIEWS = {
  map: { selector: '#map svg .mark[data-id]', drawn: '#map svg .mark', url: '' },
  graph: { selector: '#graph svg.graph circle.node[data-id]', drawn: '#graph svg.graph circle.node', url: '&view=graph' },
  timeline: { selector: '.timeline-area svg rect.bar[data-id]', drawn: '.timeline-area svg rect.bar', url: '&view=timeline' },
};

const ready = 'return Boolean(document.querySelector("#map svg.map"));';

const DRAWN = (selector) => `return [...document.querySelectorAll('${selector}')]
  .map((el) => el.dataset.id).filter(Boolean);`;

// An event with no place is on the timeline and the graph and never on the
// map; the map is not asked to draw it.
const placeless = (ids) => new Set([...ids].filter((id) => {
  const file = path.join(dataDir, 'events', `${id}.json`);
  return !fs.existsSync(file) || !JSON.parse(fs.readFileSync(file, 'utf8')).place;
}));

test('at rest every view draws main events and nothing else', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  const shown = workingSet(atlas, defaultState()).shown;
  assert.ok(shown.size > 0, 'the resting picture is not empty');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?${extra.slice(1)}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw something`);
      const ids = await page.eval(DRAWN(selector));
      assert.ok(ids.length > 0, `${name} drew nothing`);
      for (const id of ids) {
        const record = atlas.events.get(id);
        assert.ok(record, `${name} drew ${id}, which is not an event`);
        assert.ok(isMain(atlas, record), `${name} drew ${id} at rest, and it has a parent`);
        assert.ok(shown.has(id), `${name} drew ${id}, which is outside the resting picture`);
      }
    }
  }, { device: DESK });
});

// A child of the hierarchy M62 wrote, with a link and a place, so that the
// parent rule is exercised and not only the edges and so that the map has
// somewhere to draw it. Whichever one the corpus carries today.
const ATLAS = await atlasOf(dataDir);
const CHOSEN = ATLAS.activeEvents.find((e) => !isMain(ATLAS, e) && e.place
  && (ATLAS.adjacency.out.get(e.id)?.length ?? 0) + (ATLAS.adjacency.in.get(e.id)?.length ?? 0) > 0);
// The whole extent, so that what a view leaves out is the filter's doing and
// never the band's: the atlas opens on one century of five (util/window.js).
const WHOLE = `from=${ATLAS.extent.min}&to=${ATLAS.extent.max}`;

test('choosing an event narrows all three views to it, its parts, its parent and one hop', { skip }, async () => {
  const atlas = ATLAS;
  const child = CHOSEN;
  assert.ok(child, 'the corpus has a child event with a link and a place to choose');
  const state = { ...defaultState(), selected: child.id };
  const view = workingSet(atlas, state);
  const shown = view.shown;
  const resting = workingSet(atlas, defaultState()).shown;
  assert.ok(shown.size < resting.size, 'the choice is a narrowing');
  const unplaced = placeless(shown);

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?${WHOLE}&selected=${child.id}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw something`);
      const ids = await page.eval(DRAWN(selector));
      assert.ok(ids.length > 0, `${name} drew nothing`);
      // Nothing unrelated survived the choice, in any of the three.
      for (const id of ids) assert.ok(shown.has(id), `${name} drew ${id}, which the choice hides`);
      // And the event and what it is part of are both in the picture: a
      // reader who walked down into a regime can see the regime.
      for (const id of [child.id, child.parent]) {
        if (name === 'map' && unplaced.has(id)) continue;
        assert.ok(ids.includes(id), `${name} left out ${id}`);
      }
    }
  }, { device: DESK });
});

test('clearing the selection gives the resting picture back, in every view', { skip }, async () => {
  assert.ok(CHOSEN, 'the corpus has an event to choose');

  await withBrowser(async (page, url) => {
    const lens = workingSet(ATLAS, { ...defaultState(), from: ATLAS.extent.min, to: ATLAS.extent.max, selected: CHOSEN.id }).shown;
    for (const [name, { selector, drawn, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?${WHOLE}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw something`);
      const before = (await page.eval(DRAWN(selector))).sort();
      const restingMarks = await page.eval(`return document.querySelectorAll('${drawn}').length;`);

      await open(page, url(`?${WHOLE}&selected=${CHOSEN.id}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw the choice`);
      const during = await page.eval(DRAWN(selector));
      const chosenMarks = await page.eval(`return document.querySelectorAll('${drawn}').length;`);
      // Narrowing, read off everything the view drew rather than off the ids,
      // for the reason VIEWS gives.
      assert.ok(chosenMarks < restingMarks,
        `${name} did not narrow on the choice: ${restingMarks} drawn at rest, ${chosenMarks} on the lens`);
      // And what it drew is the lens and nothing else, which is the half the
      // count could never say.
      for (const id of during) assert.ok(lens.has(id), `${name} drew ${id}, which is outside the lens`);

      // The way back that already exists: an address with no selection in it.
      await open(page, url(`?${WHOLE}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw again`);
      const after = (await page.eval(DRAWN(selector))).sort();
      assert.deepEqual(after, before, `${name} did not come back to the resting picture`);
    }
  }, { device: DESK });
});

// M82 — the first screen, on a real page.
//
// What needs a browser is what only a drawing can answer: what the graph at
// rest actually names, where the timeline's headings land, whether a key is on
// the picture, and how much of a phone the picture gets. The arithmetic and the
// markup are in `tests/m82.test.mjs`.
//
// Written before the behaviour it judges (deviations 711 and 717). Nothing here
// pins a count or a pixel: every number asserted is read off the page and
// compared with another reading of the same page.
//
// Headless Chromium over its own DevTools protocol, as the rest of the browser
// suite: no Puppeteer, no Playwright, no npm. A machine with no browser skips.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn, skip,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { parentsOf } from '../src/parts.js';

const atlas = await atlasOf(path.join(ROOT, 'data'));

// Wide enough that the views draw records rather than stacks of them, and the
// phone the frame page and `tests/phone-browser.test.mjs` both drive.
const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1 };

const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const NODES = "return document.querySelectorAll('#graph svg.graph circle.node').length > 0;";
const BARS = "return document.querySelectorAll('#timeline svg.timeline rect.bar').length > 0;";

// Every mark the graph drew that stands for one record, and every name it
// wrote. A stack carries no `data-id`; it is a count and not a record.
const GRAPH = `
  const svg = document.querySelector('svg.graph');
  return {
    marks: [...svg.querySelectorAll('.layer-nodes circle.node[data-id]')].map((el) => el.getAttribute('data-id')),
    labels: [...svg.querySelectorAll('text.node-label')].map((el) => el.textContent),
  };`;

// 3 — A1. What the graph draws at rest, and what it calls it.
test('A1: at rest every mark on the graph is a main event, and every name on it is whole', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    // A mark is drawn before its century has landed and named when it does
    // (attributes.js), so the names are waited for and not the marks.
    await waitFor(page, "return document.querySelectorAll('#graph svg.graph text.node-label').length > 0;",
      'the graph to name its marks');

    const drawn = await page.eval(GRAPH);
    assert.ok(drawn.marks.length > 2, 'the graph has marks on it');

    // Rest means rest: nothing in the picture is part of something else, and
    // no second rule has taken a main event away — the count is read off the
    // page and compared with the atlas, never with a number written here.
    for (const id of drawn.marks) {
      const event = atlas.events.get(id);
      assert.ok(event, `${id} is a record`);
      assert.equal(parentsOf(event).length, 0, `${id} is part of nothing, so it belongs to the resting picture`);
    }

    // And a name is whole or it is not drawn: every label on the page is some
    // record's own title, letter for letter, and none of them is an ellipsis.
    const titles = new Set(atlas.activeEvents.map((e) => e.title).filter(Boolean));
    assert.ok(drawn.labels.length > 0, 'the resting graph names its marks');
    for (const text of drawn.labels) {
      assert.doesNotMatch(text, /…/, `"${text}" is cut`);
      assert.ok(titles.has(text), `"${text}" is a record's whole title`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// And the key, which covered half the picture at 390 px.
test('A1: the graph\'s key is one button on a phone and the whole key on a desktop', { skip }, async () => {
  const KEY = `
    const box = document.querySelector('.graph-key');
    if (!box) return null;
    const button = box.querySelector('.graph-key-toggle');
    const body = box.querySelector('.graph-key-body');
    const shown = (el) => el ? el.getBoundingClientRect().height > 0 : false;
    return {
      button: shown(button),
      body: shown(body),
      share: box.getBoundingClientRect().height
        / document.querySelector('svg.graph').getBoundingClientRect().height,
    };`;
  const press = "document.querySelector('.graph-key .graph-key-toggle').click(); return true;";

  await withBrowser(async (page, url) => {
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const desk = await page.eval(KEY);
    assert.equal(desk.button, false, 'a desktop has nothing to press');
    assert.equal(desk.body, true, 'and the whole key');
  }, { device: DESK });

  await withBrowser(async (page, url) => {
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const folded = await page.eval(KEY);
    assert.equal(folded.button, true, 'a phone has a button');
    assert.equal(folded.body, false, 'and the key folded behind it');
    assert.ok(folded.share < 0.25, `the folded key is a corner of the picture, not ${Math.round(folded.share * 100)}% of it`);

    await page.eval(press);
    const opened = await page.eval(KEY);
    assert.equal(opened.body, true, 'pressing it opens the key');
  }, { device: PHONE });
});

// 5 — A6. The timeline's headings collide and its axis is drawn twice.
//
// Two properties, read off the boxes the browser actually laid out: **no two
// of the four kinds of heading above the lanes touch**, and **no year is
// written twice** — the band's two years and the axis's ticks are one axis
// now, not two rows of the same numbers.
test('A6: nothing above the timeline\'s lanes is drawn over anything else', { skip }, async () => {
  const HEADINGS = `
    const svg = document.querySelector('#timeline svg.timeline');
    const box = (el, kind) => {
      const b = el.getBoundingClientRect();
      return { kind, text: el.textContent, x0: b.left, x1: b.right, y0: b.top, y1: b.bottom };
    };
    return [
      ...[...svg.querySelectorAll('.layer-tickLabels text')].map((el) => box(el, 'tick')),
      ...[...svg.querySelectorAll('.layer-handleLabels text.window-year')].map((el) => box(el, 'band year')),
      ...[...svg.querySelectorAll('.layer-handleLabels text.window-marker')].map((el) => box(el, 'borders')),
      ...[...svg.querySelectorAll('.layer-bandLabels text.large-band-label')].map((el) => box(el, 'umbrella')),
    ];`;

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // A window with more than one umbrella in it, which is the case the
    // reviewer photographed: "World War I" and "The Estado Novo" on one row.
    await open(page, url('?view=timeline&from=1900&to=1999'), ready);
    await waitFor(page, BARS, 'the timeline to draw its bars');
    await waitFor(page, "return document.querySelectorAll('#timeline .layer-tickLabels text').length > 0;",
      'the axis to be drawn');

    const headings = await page.eval(HEADINGS);
    assert.ok(headings.length > 2, 'there are headings above the lanes to compare');

    const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    const touching = [];
    for (let i = 0; i < headings.length; i += 1) {
      for (let j = i + 1; j < headings.length; j += 1) {
        if (overlaps(headings[i], headings[j])) {
          touching.push(`${headings[i].kind} "${headings[i].text}" over ${headings[j].kind} "${headings[j].text}"`);
        }
      }
    }
    assert.deepEqual(touching, [], touching.join('; '));

    // And no name above the lanes is cut: whole or not written, as M77 has it
    // for a bar's title.
    for (const heading of headings) {
      assert.doesNotMatch(heading.text, /…/, `${heading.kind} "${heading.text}" is cut`);
    }

    // One axis: no year is written twice above the lanes.
    const years = headings.filter((h) => h.kind === 'tick' || h.kind === 'band year').map((h) => h.text);
    assert.deepEqual([...new Set(years)].length, years.length, `a year is written twice: ${years.join(' ')}`);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// 6 — A10. No card offers a way out to a page that does not exist.
test('A10: a record with no full entry offers no link to one', { skip }, async () => {
  const LINKS = `
    return [...document.querySelectorAll('.panel .entry-link')].map((el) => ({
      html: el.innerHTML.trim(),
      href: el.querySelector('a') ? el.querySelector('a').getAttribute('href') : null,
    }));`;

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // One of each kind that can carry an entry, and none of them does today.
    for (const [kind, param] of [['event', 'selected'], ['place', 'place'], ['actor', 'actor']]) {
      const record = kind === 'event'
        ? atlas.activeEvents.find((e) => e.place)
        : [...(kind === 'place' ? atlas.places : atlas.actors).values()][0];
      assert.ok(record, `the corpus has a ${kind} to open`);
      const id = kind === 'event' ? record.id : (record.id ?? record);
      // eslint-disable-next-line no-await-in-loop
      await open(page, url(`?${param}=${encodeURIComponent(id)}`), ready);
      // eslint-disable-next-line no-await-in-loop
      await waitFor(page, "return Boolean(document.querySelector('.panel .standing, .panel .head-links'));",
        `the ${kind} card`);
      // The record's own file is what says whether there is an entry, so the
      // wait is for the thing that arrives with it.
      // eslint-disable-next-line no-await-in-loop
      await waitFor(page, "return !document.querySelector('.panel [data-slot=\"entry-link\"]');",
        `the ${kind} card to settle its entry link`);
      // eslint-disable-next-line no-await-in-loop
      const links = await page.eval(LINKS);
      // No record in `data/` carries a body today, so what the card must show
      // is nothing at all — not an empty paragraph and not a link to a page
      // that says there is no entry. The day a record does carry one, the
      // branch below is what holds.
      // eslint-disable-next-line no-await-in-loop
      const body = await page.eval(`
        return fetch('data/${kind}s/${encodeURIComponent(id)}.json')
          .then((r) => r.json()).then((r) => typeof r.body === 'string' && r.body.trim() !== '');`);
      if (body) {
        assert.equal(links.length, 1, `a ${kind} with an entry offers one link to it`);
        assert.ok(links[0].href, 'and it is a link');
      } else {
        assert.deepEqual(links, [], `a ${kind} with no entry offers nothing: ${JSON.stringify(links)}`);
      }
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

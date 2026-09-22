// M84 in a real browser: the cross in the corner of every card.
//
// `tests/m84.test.mjs` holds what a string can answer — that every card
// carries one close control and what the control writes. Three things need a
// browser and are here:
//
//   1. the cross really is in the card's top right corner, which is a question
//      about boxes the stylesheet lays out and not about markup;
//   2. it really closes the card it is on, for every kind of card, the
//      narrative's included — that one is written straight into the container
//      and has no string to assert.
//
// Written before the behaviour it judges (deviations 711 and 717). **Nothing
// here pins a count and nothing here pins a pixel**: every assertion is a
// comparison between two things the same page drew.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn, skip,
} from './browser.mjs';

// Wide enough that the views draw records rather than stacks of them: a stack
// carries no id (tests/m65-browser.test.mjs says this at length).
const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });

// The synthetic graph and its whole extent, with no degree floor, so that what
// a picture leaves out is never the band's doing or the filter's.
const WHOLE = 'fixtures=1&degree=0&from=1200&to=2025';
const ready = 'return Boolean(document.querySelector("#map svg.map"));';

// `fixture-event-f` is the one event in the fixtures with parts — t and h are
// inside it — so opening it puts a card on the screen with something under it
// to close back to, and its own head is the one the cross has to sit in.
const PARENT = 'fixture-event-f';

// Every card the panel can show, by the parameter that opens it and the head
// that says it is the one on screen.
const KINDS = {
  event: { query: `selected=${PARENT}`, head: '.event-head' },
  edge: { query: 'edge=fixture-event-a--fixture-event-b--caused', head: '.edge-card-head' },
  source: { query: 'source=fixture-source-1', head: '.source-head' },
  place: { query: 'place=fixture-place-a', head: '.place-head' },
  actor: { query: 'actor=fixture-actor-one', head: '.actor-head' },
  office: { query: 'office=fixture-office-one', head: '.office-head' },
  narrative: { query: 'narrative=fixture-narrative-one', head: '.narrative-head' },
};

// The cross, the card's own title and the panel that holds them, as three
// boxes on the page.
const CROSS = (head) => `
  const panel = document.querySelector('.panel');
  const crosses = [...panel.querySelectorAll('[data-action="close-card"]')];
  const title = panel.querySelector('${head} h2');
  if (crosses.length !== 1 || !title) return { count: crosses.length, titled: Boolean(title) };
  const el = crosses[0];
  const box = el.getBoundingClientRect();
  const heading = title.getBoundingClientRect();
  const card = panel.getBoundingClientRect();
  return {
    count: 1,
    titled: true,
    tag: el.tagName,
    name: el.getAttribute('aria-label'),
    focusable: el.tabIndex >= 0,
    box: { top: box.top, right: box.right, width: box.width, height: box.height },
    heading: { top: heading.top, right: heading.right },
    card: { top: card.top, right: card.right, left: card.left },
    // No "close" left anywhere in the card's own words.
    words: panel.textContent.replace(/\\s+/g, ' '),
  };`;

const CLOSE = 'document.querySelector(\'.panel [data-action="close-card"]\').click(); return true;';

test('every card closes with one cross in its top right corner', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    for (const [kind, { query, head }] of Object.entries(KINDS)) {
      await open(page, url(`?${WHOLE}&${query}`), ready);
      await waitFor(page, `return Boolean(document.querySelector('.panel ${head}'));`,
        `the ${kind} card to be drawn`);
      const seen = await page.eval(CROSS(head));
      assert.equal(seen.count, 1, `the ${kind} card has one and only one cross`);
      assert.equal(seen.tag, 'BUTTON', `the ${kind} card's cross is a button`);
      assert.equal(seen.name, 'Close', `the ${kind} card's cross is named Close`);
      assert.ok(seen.focusable, `the ${kind} card's cross can be reached from the keyboard`);
      // Top right, said as two comparisons between boxes the page laid out:
      // right of the card's own title, and no lower than it.
      assert.ok(seen.box.right > seen.heading.right,
        `the ${kind} card's cross is to the right of its title`);
      assert.ok(seen.box.top <= seen.heading.top,
        `the ${kind} card's cross is no lower than its title`);
      assert.ok(seen.box.right <= seen.card.right,
        `the ${kind} card's cross is inside the card`);
      assert.ok(seen.box.right - seen.card.left > (seen.card.right - seen.card.left) / 2,
        `the ${kind} card's cross is in the right half of the card`);
      // A touch target on a phone, which is 44 CSS pixels square (WCAG 2.5.5)
      // — a size and not a type size, and the one number in this file.
      assert.ok(seen.box.width >= 44 && seen.box.height >= 44,
        `the ${kind} card's cross is a touch target (${seen.box.width}x${seen.box.height})`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('and pressing it takes that card away', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    for (const [kind, { query, head }] of Object.entries(KINDS)) {
      await open(page, url(`?${WHOLE}&${query}`), ready);
      await waitFor(page, `return Boolean(document.querySelector('.panel ${head}'));`,
        `the ${kind} card to be drawn`);
      await page.eval(CLOSE);
      await waitFor(page, `return !document.querySelector('.panel ${head}');`,
        `the ${kind} card to close`);
      // And the address goes with it: a card closed on the screen and still in
      // the link would be a link back to the card.
      const parameter = query.split('=')[0];
      const left = await page.eval(
        `return new URLSearchParams(location.search).get(${JSON.stringify(parameter)});`,
      );
      assert.equal(left, null, `closing the ${kind} card takes ?${parameter}= out of the link`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('closing the card on top leaves the one under it open', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&place=fixture-place-a&selected=fixture-event-a`), ready);
    await waitFor(page, 'return Boolean(document.querySelector(\'.panel .event-head\'));',
      'the event card to be drawn');
    await page.eval(CLOSE);
    await waitFor(page, 'return Boolean(document.querySelector(\'.panel .place-head\'));',
      'the place under it to come back');
  });
});

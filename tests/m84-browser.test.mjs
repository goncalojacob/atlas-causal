// M84 in a real browser: the cross in the corner of every card, and the ring
// told apart from everything else on all three views.
//
// `tests/m84.test.mjs` holds what a string can answer — that every card
// carries one close control and what the control writes. Three things need a
// browser and are here:
//
//   1. the cross really is in the card's top right corner, which is a question
//      about boxes the stylesheet lays out and not about markup;
//   2. it really closes the card it is on, for every kind of card, the
//      narrative's included — that one is written straight into the container
//      and has no string to assert;
//   3. the one-hop ring is drawn in an ink of its own, at full opacity, and
//      the key on each view names it.
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

// And the event the ring is read around. `f` itself is placeless and so is
// never on the map (M9), and a comparison that could only be made on two of
// the three views would not be the assertion the brief asks for; `t` is inside
// `f`, is placed, and is touched by four events that are not — c, d, f and g —
// which is a ring on every picture.
const CHOSEN = 'fixture-event-t';

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

// --- the ring, told apart ---------------------------------------------------

const VIEWS = {
  map: { view: '', mark: '#map svg .mark[data-id]' },
  graph: { view: '&view=graph', mark: '#graph svg.graph circle.node[data-id]' },
  timeline: { view: '&view=timeline', mark: '.timeline-area svg rect.bar[data-id]' },
};

// Every mark the view drew, with the ink the browser actually gave it and
// which of the three things it is: what the reader chose, the ring around it,
// and everything else. A coarse mark is set aside: how precisely a record is
// placed is a second sentence with a row of its own in the key (M80), and the
// map draws it dashed and translucent whatever the reader is holding.
const INK = (selector) => `
  return [...document.querySelectorAll('${selector}')]
    .filter((el) => !el.classList.contains('coarse') && !el.classList.contains('cluster'))
    .map((el) => {
      const style = getComputedStyle(el);
      return {
        id: el.dataset.id,
        ring: el.classList.contains('lens-near'),
        chosen: el.classList.contains('selected'),
        fill: style.fill,
        stroke: style.stroke,
        opacity: Number(style.opacity),
      };
    });`;

// What a mark is inked with, for the comparisons below: the outline, which is
// the one thing every shape on a picture has. A fill is per shape — a one-day
// bar is filled harder than a span, a converged branch harder than a node —
// and the ring keeps those differences rather than flattening them, so it is
// the stroke that says "connected to what you opened" on all three views.
const ink = (m) => m.stroke;

test('the ring is inked apart from the chosen event and from a dimmed one', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    for (const [name, { view, mark }] of Object.entries(VIEWS)) {
      // First, how this view draws a mark nobody is holding: the picture at
      // rest, which is what the ring used to be a faded copy of and is the
      // "dimmed out" of the owner's sentence. Read off the same page rather
      // than written down here, so nothing in this file is a colour.
      await open(page, url(`?${WHOLE}${view}`), ready);
      await waitFor(page, `return document.querySelectorAll('${mark}').length > 0;`,
        `${name} to draw the atlas at rest`);
      const resting = await page.eval(INK(mark));
      assert.ok(resting.length > 0, `${name} drew something at rest`);
      const ordinary = ink(resting[0]);

      await open(page, url(`?${WHOLE}${view}&selected=${CHOSEN}`), ready);
      await waitFor(page, `return document.querySelectorAll('${mark}.lens-near').length > 0;`,
        `${name} to draw the ring`);
      const marks = await page.eval(INK(mark));
      const ring = marks.filter((m) => m.ring);
      const chosen = marks.filter((m) => m.chosen);
      assert.ok(ring.length > 0, `${name} drew a ring`);
      assert.ok(chosen.length > 0, `${name} drew the chosen event`);

      const one = ink(ring[0]);
      for (const m of ring) {
        assert.equal(ink(m), one, `${name} draws the whole ring in one ink`);
        // Full opacity: the ring was 0.22 and read as greyed out, which is
        // what the owner asked to be rid of.
        assert.equal(m.opacity, 1, `${name} draws ${m.id} at full opacity`);
      }
      assert.notEqual(one, ordinary,
        `${name} draws the ring apart from a mark nobody is holding`);
      for (const m of chosen) {
        assert.notEqual(ink(m), one, `${name} draws the ring apart from the chosen event`);
      }
      // And apart from whatever else the lens keeps in ink, where the picture
      // has any: the parts of the chosen event are drawn as the atlas's own
      // marks and must not be read as connections to it.
      for (const m of marks.filter((x) => !x.ring && !x.chosen)) {
        assert.notEqual(ink(m), one, `${name} draws the ring apart from what it keeps in ink`);
      }
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

// The key's own row for the ring, drawn with the very same class the picture
// draws the ring with, so the two cannot come apart.
const KEY = (view) => `
  const box = document.querySelector('${view} .graph-key');
  if (!box) return null;
  const button = box.querySelector('.graph-key-toggle');
  if (button && !box.classList.contains('open')) button.click();
  const rows = [...box.querySelectorAll('dd')].map((el) => el.textContent.trim());
  const shape = box.querySelector('.lens-near');
  return {
    rows,
    inked: shape ? getComputedStyle(shape).stroke : null,
  };`;

test('and the key on every view names it', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    const where = { map: '#map', graph: '#graph', timeline: '.timeline-area' };
    for (const [name, { view, mark }] of Object.entries(VIEWS)) {
      await open(page, url(`?${WHOLE}${view}&selected=${CHOSEN}`), ready);
      await waitFor(page, `return document.querySelectorAll('${mark}.lens-near').length > 0;`,
        `${name} to draw the ring`);
      const key = await page.eval(KEY(where[name]));
      assert.ok(key, `${name} has a key`);
      assert.ok(key.rows.some((row) => /connected/i.test(row)),
        `${name}'s key names the ring: ${JSON.stringify(key.rows)}`);
      // The row is the thing and not a picture of the thing: the same ink the
      // picture gave the ring.
      const marks = await page.eval(INK(mark));
      const ring = marks.find((m) => m.ring);
      assert.equal(key.inked, ink(ring), `${name}'s key row is inked as its ring is`);
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

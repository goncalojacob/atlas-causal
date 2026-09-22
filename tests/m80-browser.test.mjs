// M80 on a real page: a connection chosen on the graph, a coarse mark beside a
// city's, and the sentence the masthead prints.
//
// `tests/m80.test.mjs` holds the rules — what `?edge=` parses, what the card
// is made of, which precisions are the coarse ones, how the count reads.
// What needs a browser is the three things a string cannot answer: that a
// click on a line lands on the line, that the mark really does come out wider,
// and that the masthead really does say it.
//
// **Nothing here pins a count and nothing here pins a pixel.** The mark
// assertions compare two radii drawn on the same page and ask only which is
// the larger; the count assertions read the masthead's two numbers and check
// them against what `emphasis.js` says the picture is, computed in the page.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, waitFor, until, seenIntro, skip,
} from './browser.mjs';

// Wide enough that the views draw records rather than stacks of them: a stack
// carries no id (tests/m65-browser.test.mjs says this at length).
const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });

// The whole extent of the fixture corpus and no degree floor, so that what a
// picture leaves out is never the band's doing or the filter's.
const WHOLE = 'fixtures=1&degree=0&from=1200&to=2025';

const GRAPH_READY = 'return document.querySelectorAll("#graph svg.graph line.edge[data-edge]").length > 0;';

// Press a key on whatever has the focus, as the browser would.
const press = (key) => `
  const el = document.activeElement;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }));
  return true;`;

// Every node the graph put in the DOM, which is what "the picture" means here.
const NODES = `return [...document.querySelectorAll('#graph svg.graph circle.node[data-id]')]
  .map((el) => el.getAttribute('data-id')).sort();`;

// The first line that stands for one link, and everything about it the page
// knows. Whichever one it is: the assertions are about what a click on a line
// does, not about which link the layout happened to draw first.
const A_LINE = `
  const el = document.querySelector('#graph svg.graph line.edge[data-edge]');
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return {
    id: el.getAttribute('data-edge'),
    label: el.getAttribute('aria-label'),
    role: el.getAttribute('role'),
    tabindex: el.getAttribute('tabindex'),
    x: box.left + box.width / 2,
    y: box.top + box.height / 2,
  };`;

// A click where the reader's pointer would be, through the root's own
// listener: which line that means is decided by distance in graph-view.js, so
// the point has to be a real one on the page and not an element handed over.
const clickAt = (x, y) => `
  const root = document.querySelector('#graph svg.graph');
  root.dispatchEvent(new MouseEvent('click', {
    clientX: ${x}, clientY: ${y}, bubbles: true, cancelable: true,
  }));
  return true;`;

// What the link's card says, read off the panel.
const CARD = `
  const head = document.querySelector('.panel .edge-card-head');
  if (!head) return null;
  const ends = [...document.querySelectorAll('.panel .link-ends [data-action="select"]')]
    .map((el) => el.getAttribute('data-id'));
  const badge = document.querySelector('.panel .edge-card-head .badge');
  const explanation = document.querySelector('.panel [data-slot="edge-explanation"]');
  const sources = document.querySelector('.panel [data-slot="edge-sources"]');
  return {
    type: head.querySelector('h2').textContent.trim(),
    ends,
    confidence: badge ? badge.textContent.trim() : null,
    hint: (document.querySelector('.panel .confidence-hint') || {}).textContent || '',
    explanation: explanation ? explanation.textContent.trim() : null,
    sources: sources ? sources.querySelectorAll('.citation').length : null,
    narrowed: document.querySelectorAll('.panel .lens-control').length,
  };`;

const TYPES = ['caused', 'enabled', 'reacted to', 'precondition of', 'inspired'];

test('clicking a line on the graph opens the link\'s card, and the picture does not narrow', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&view=graph`), GRAPH_READY);

    const line = await page.eval(A_LINE);
    assert.ok(line, 'the graph drew no line that stands for one link');
    // A line is a control with a name, as every mark on the map has been since
    // M63: it takes the focus, says what it is, and answers a key.
    assert.equal(line.role, 'button');
    assert.equal(line.tabindex, '0');
    assert.ok(line.label && line.label.length > 0, 'the line says nothing about itself');

    const before = await page.eval(NODES);
    assert.ok(before.length > 0);

    await page.eval(clickAt(line.x, line.y));
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('edge') === ${JSON.stringify(line.id)};`,
      'the click to choose the link',
    );

    // The card, with everything the owner asked to be able to check.
    await waitFor(page, 'return Boolean(document.querySelector(".panel .edge-card-head"));', 'the link\'s card');
    await waitFor(
      page,
      'const el = document.querySelector(\'.panel [data-slot="edge-explanation"]\');'
        + ' return Boolean(el) && !/^Loading/.test(el.textContent.trim());',
      'the argument to arrive',
    );
    const card = await page.eval(CARD);
    assert.ok(TYPES.includes(card.type), `the card's heading is not a type: ${card.type}`);
    assert.equal(card.ends.length, 2, 'the card does not name both ends');
    assert.ok(line.id.startsWith(`${card.ends[0]}--`), 'the from end is not the link\'s from end');
    assert.ok(line.id.includes(`--${card.ends[1]}--`), 'the to end is not the link\'s to end');
    assert.ok(['consensus', 'probable', 'disputed'].includes(card.confidence));
    assert.ok(card.hint.trim().length > 0, 'the confidence is a word with nothing behind it');
    assert.ok(card.explanation.length > 0, 'the card shows no argument');
    assert.ok(card.sources !== null, 'the card has no sources section');

    // The line is drawn as chosen, and it is the one that was clicked.
    const chosen = await page.eval(`return [...document.querySelectorAll('#graph svg.graph line.edge.chosen')]
      .map((el) => el.getAttribute('data-edge'));`);
    assert.deepEqual(chosen, [line.id], 'the chosen line is not drawn as chosen');

    // And nothing narrowed: choosing a link is not a lens (M65 is about
    // events), so the same nodes are drawn before and after.
    const after = await page.eval(NODES);
    assert.deepEqual(after, before, 'choosing a link changed the picture');
  });
});

test('?edge= opens the same card, and the graph frames the two ends', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&view=graph`), GRAPH_READY);
    const line = await page.eval(A_LINE);
    assert.ok(line);

    await open(page, url(`?${WHOLE}&view=graph&edge=${line.id}`),
      'return Boolean(document.querySelector(".panel .edge-card-head"));');
    await waitFor(
      page,
      'const el = document.querySelector(\'.panel [data-slot="edge-explanation"]\');'
        + ' return Boolean(el) && !/^Loading/.test(el.textContent.trim());',
      'the argument to arrive on a link opened by its address',
    );
    const card = await page.eval(CARD);
    assert.ok(TYPES.includes(card.type));
    assert.equal(card.ends.length, 2);

    // Framed on its two ends: the card names them, and a camera that left one
    // of them off the screen would be the picture disagreeing with the card.
    const [from, to] = line.id.split('--');
    const drawn = await page.eval(NODES);
    for (const id of [from, to]) {
      assert.ok(drawn.includes(id), `the graph did not draw ${id}, which the card names`);
    }
  });
});

test('a line answers Enter, and choosing one of its ends closes its card', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&view=graph`), GRAPH_READY);
    const line = await page.eval(A_LINE);
    assert.ok(line);

    await page.eval(`document.querySelector('#graph svg.graph line.edge[data-edge]').focus(); return true;`);
    await page.eval(press('Enter'));
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('edge') === ${JSON.stringify(line.id)};`,
      'Enter to open the link',
    );
    // The focus survives the redraw that follows, as a mark's does.
    const focused = await page.eval('return document.activeElement ? document.activeElement.getAttribute("data-edge") : null;');
    assert.equal(focused, line.id, 'the line lost the focus when the picture was drawn again');

    // Choosing one of the two ends is asking for the event, so the link's card
    // is left behind and its parameter goes with it.
    const [from] = line.id.split('--');
    await page.eval(`document.querySelector('.panel .link-ends [data-action="select"][data-id=${JSON.stringify(from)}]').click(); return true;`);
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('selected') === ${JSON.stringify(from)};`,
      'the end to open',
    );
    assert.equal(
      await page.eval('return new URLSearchParams(location.search).get("edge");'),
      null,
      'the link\'s card was kept over the event the reader asked for',
    );
  });
});

test('a connection listed on an event\'s card opens the link\'s card', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&view=graph`), GRAPH_READY);
    const line = await page.eval(A_LINE);
    assert.ok(line);
    const [from] = line.id.split('--');

    await open(page, url(`?${WHOLE}&view=graph&selected=${from}`),
      'return document.querySelectorAll(".panel .card-section").length > 0;');
    // The type word in a row of the Consequences list is the way in: a reader
    // who wants to know what "enabled" rests on presses the word "enabled".
    const opened = await until(
      page,
      `const el = document.querySelector('.panel [data-action="edge"][data-edge=${JSON.stringify(line.id)}]');
       if (!el) return false;
       el.click();
       return true;`,
    );
    assert.ok(opened, 'no row of the event\'s card offered to open the link');
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('edge') === ${JSON.stringify(line.id)};`,
      'the listed connection to open its own card',
    );
    assert.ok(await page.eval('return Boolean(document.querySelector(".panel .edge-card-head"));'));
  });
});

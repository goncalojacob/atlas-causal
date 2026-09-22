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

// ── 2. marks by precision ──────────────────────────────────────────────────

// Every mark on the map, with the radius the layer gave it and whether it is
// drawn as coarse. The radius is read off the attribute rather than measured:
// it is divided by the zoom where it is written, so what comes back is
// comparable between two marks on the same page and is not a pixel.
const MARKS = `return [...document.querySelectorAll('#map svg.map circle.mark[data-id]')].map((el) => ({
  id: el.getAttribute('data-id'),
  r: Number(el.getAttribute('r')),
  coarse: el.classList.contains('coarse'),
  dash: getComputedStyle(el).strokeDasharray,
  fillOpacity: Number(getComputedStyle(el).fillOpacity),
}));`;

test('a coarse place is drawn wider and fainter than a city, and says so on the card', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}`), 'return document.querySelectorAll("#map svg.map circle.mark[data-id]").length > 0;');

    const marks = await page.eval(MARKS);
    assert.ok(marks.length > 0, 'the map drew no marks');
    const coarse = marks.filter((m) => m.coarse);
    const fine = marks.filter((m) => !m.coarse);
    assert.ok(coarse.length > 0, 'the fixture corpus drew no region or country mark');
    assert.ok(fine.length > 0, 'the fixture corpus drew no city mark');

    // Wider. Every coarse mark against every fine one drawn on the same page
    // at the same zoom, so the comparison is between two radii and not against
    // a number written into this file.
    const widestFine = Math.max(...fine.map((m) => m.r));
    for (const mark of coarse) {
      assert.ok(mark.r > widestFine, `${mark.id} is not drawn wider than a city's mark`);
    }
    // And fainter: a dashed, lighter ring over a fill that lets the ground
    // through, so nobody reads it as a pin dropped at an address.
    for (const mark of coarse) {
      assert.ok(mark.fillOpacity < 1, `${mark.id} is drawn as solid as a city's mark`);
      assert.ok(mark.dash && mark.dash !== 'none', `${mark.id} has no dashed ring`);
    }

    // Both of the coarse precisions, each asked for by name — a region and a
    // country are areas and the map says the same thing about both.
    //
    // Opened rather than looked for in the world view: the selected event
    // keeps its own mark wherever it is (layers/events.js), where an event
    // merely *in* the picture may be inside a stack at this zoom and a stack
    // carries no id. Which is a fact about grouping and not about precision,
    // and a test that waited for the grouping to fall a particular way would
    // be pinning the layout.
    for (const [id, what] of [['fixture-event-c', 'region'], ['fixture-event-a2', 'country']]) {
      await open(page, url(`?${WHOLE}&selected=${id}`),
        `return Boolean(document.querySelector('#map svg.map circle.mark[data-id="${id}"]'));`);
      const drawn = await page.eval(`const el = document.querySelector('#map svg.map circle.mark[data-id="${id}"]');
        return { coarse: el.classList.contains('coarse'), r: Number(el.getAttribute('r')) };`);
      assert.ok(drawn.coarse, `the ${what}-placed event is not drawn coarse`);
      assert.ok(drawn.r > widestFine, `the ${what}-placed event is not drawn wider than a city's mark`);
    }
  });
});

test('the card says how precisely a record is placed, in words', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    // The event whose place is a country: its card says what the coordinate
    // means rather than printing the vocabulary's own slug.
    await open(page, url(`?${WHOLE}&selected=fixture-event-a2`),
      'return document.querySelectorAll(".panel .card-section").length > 0;');
    const said = await page.eval('return (document.querySelector(".panel .event-head .where") || {}).textContent || "";');
    assert.doesNotMatch(said, /\(country\)/, 'the card printed the vocabulary\'s slug');
    assert.match(said, /state's own point/, 'the card does not say what the coordinate is');

    // And the place's own card, which is where the point itself is read.
    await open(page, url(`?${WHOLE}&place=fixture-place-c`),
      'return Boolean(document.querySelector(".panel .place-head"));');
    const place = await page.eval('return (document.querySelector(".panel .place-head .where") || {}).textContent || "";');
    assert.doesNotMatch(place, /\(region\)/);
    assert.match(place, /a region/);
  });
});

// ── 3. the masthead count ──────────────────────────────────────────────────

// The masthead's own sentence, and the two numbers in it read back out.
const COUNT = `
  const el = document.querySelector('.window-count');
  if (!el) return null;
  const text = el.textContent.trim();
  if (!text) return { text, hidden: true };
  const numbers = text.match(/\\d+/g) || [];
  return {
    text,
    hidden: Boolean(document.querySelector('.window-view').hidden),
    shown: Number(numbers[0]),
    whole: Number(numbers[1]),
    main: /\\bmain\\b/.test(text),
  };`;

// A pan, so the map is looking at part of the world and the count is drawn at
// all — that line has been about a gesture the reader made since M60, and is
// nothing until they make one.
const SOMEWHERE = 'bbox=-60,-40,60,60';

test('the masthead counts main events of the corpus at rest, and events of it under a lens', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&${SOMEWHERE}`),
      'return Boolean(document.querySelector(".window-count")) && document.querySelector(".window-count").textContent.trim() !== "";');

    const rest = await page.eval(COUNT);
    assert.ok(rest, 'the masthead has no count');
    assert.ok(rest.main, `at rest the count does not say what it counts: ${rest.text}`);
    assert.match(rest.text, /main events? of \d+ in view/);

    // The whole is the active corpus, computed in the page out of the atlas
    // rather than typed here, and the picture is smaller than it: what is part
    // of something else is inside it and drawn when the reader opens it (M65).
    assert.ok(rest.shown > 0);
    assert.ok(rest.whole >= rest.shown, `${rest.shown} shown of ${rest.whole}`);

    // Under a lens the word "main" goes: what a lens kept is not a set of main
    // events and must not be called one. The whole stays the corpus.
    await open(page, url(`?${WHOLE}&${SOMEWHERE}&focus=event:fixture-event-f`),
      'return Boolean(document.querySelector(".window-count")) && document.querySelector(".window-count").textContent.trim() !== "";');
    const lens = await page.eval(COUNT);
    assert.ok(!lens.main, `under a lens the count still says "main": ${lens.text}`);
    assert.match(lens.text, /^\d+ of \d+ events? in view$/);
    assert.equal(lens.whole, rest.whole, 'the whole changed when a lens was applied');
    assert.ok(lens.shown <= rest.whole);
  });
});

test('the pin and the standing line are what they were', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url(`?${WHOLE}&${SOMEWHERE}`),
      'return Boolean(document.querySelector(".window-count")) && document.querySelector(".window-count").textContent.trim() !== "";');
    // The standing line is said whether or not the map is looking at part of
    // the world, and it counts what a person has read — never a filter.
    assert.match(
      await page.eval('return (document.querySelector(".window-read") || {}).textContent || "";'),
      /\d+ of \d+/,
    );
    // And the pin gives the world back, which is the one thing on that row
    // that is a control.
    await page.eval('document.querySelector(".window-view .pin").click(); return true;');
    await waitFor(page, 'return new URLSearchParams(location.search).get("bbox") === null;', 'the world back');
    assert.ok(await page.eval('return document.querySelector(".window-view").hidden;'),
      'the count is still drawn with the whole world in view');
  });
});

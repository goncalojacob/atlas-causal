// An event filed under two umbrellas, in a real browser, on all three views.
//
// `tests/m79.test.mjs` holds the record side — the three shapes of `parent`
// and how the validator judges each. What needs a browser is the display half
// of the owner's question of 22 September: *"Can't we have many umbrellas for
// the same event?"* The answer has to be that **either umbrella opens on it**,
// and that it is still out of the resting picture, and that both are true of
// the map, the graph and the timeline alike — three pictures drawn by three
// modules out of one `childrenOf`.
//
// The fixture corpus is what is read: `fixture-event-h` is part of
// `fixture-event-f` and of `fixture-event-u`, and names them in that order, so
// "the second umbrella" is a thing the test can actually ask about.
//
// Nothing here pins a count. What is asserted is which ids are drawn.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';
import { fixtures } from './helpers.mjs';

// Wide enough that a view draws the filter rather than the packing: a cluster
// and a stack carry no id (tests/m65-browser.test.mjs says this at length).
const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };

// The whole extent of the fixture corpus, so that what a view leaves out is
// the umbrella's doing and never the band's. `degree=0` for the graph, which
// would otherwise drop an event with no links — and `fixture-event-u` has
// none, being an umbrella and not an argument.
const WHOLE = 'fixtures=1&degree=0&from=1200&to=2025';

const CHILD = 'fixture-event-h';
const FIRST = 'fixture-event-f';
const SECOND = 'fixture-event-u';

// An event with no place of its own is on the timeline and the graph and
// never as a mark on the map — a large event is a wash over its lane there
// (large.js) — so the map is not asked for it. Both umbrellas are such events
// and the child is not, which is exactly the shape that matters here: the
// assertion the milestone is about is the child, and it is on all three.
const PLACELESS = new Set((await fixtures()).records
  .filter((r) => r.kind === 'event' && !r.place)
  .map((r) => r.id));
const asked = (view, id) => !(view === 'map' && PLACELESS.has(id));

const VIEWS = {
  map: { selector: '#map svg .mark[data-id]', url: '' },
  graph: { selector: '#graph svg.graph circle.node[data-id]', url: '&view=graph' },
  timeline: { selector: '.timeline-area svg rect.bar[data-id]', url: '&view=timeline' },
};

const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const DRAWN = (selector) => `return [...document.querySelectorAll('${selector}')]
  .map((el) => el.dataset.id).filter(Boolean);`;

// One pass over the three views, answering with what each drew.
async function drawnOn(query) {
  const out = {};
  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?${query}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw something`);
      out[name] = await page.eval(DRAWN(selector));
    }
  }, { device: DESK });
  return out;
}

test('a child of two umbrellas is in neither picture at rest', { skip }, async () => {
  const drawn = await drawnOn(WHOLE);
  for (const [name, ids] of Object.entries(drawn)) {
    assert.ok(ids.length > 0, `${name} drew nothing`);
    // The resting picture is the main events: part of nothing the atlas is
    // drawing. One active umbrella is enough to take it out, and H has two.
    assert.ok(!ids.includes(CHILD), `${name} drew ${CHILD} at rest, and it is part of two events`);
    // Both umbrellas are themselves main, so both are drawn wherever they can be.
    for (const id of [FIRST, SECOND]) {
      if (asked(name, id)) assert.ok(ids.includes(id), `${name} left out ${id} at rest`);
    }
  }
});

test('opening the first umbrella shows the child, on all three views', { skip }, async () => {
  const drawn = await drawnOn(`${WHOLE}&selected=${FIRST}`);
  for (const [name, ids] of Object.entries(drawn)) {
    if (asked(name, FIRST)) assert.ok(ids.includes(FIRST), `${name} left out the umbrella it was opened on`);
    assert.ok(ids.includes(CHILD), `${name} opened ${FIRST} and left out the event inside it`);
  }
});

test('opening the second umbrella shows the same child, on all three views', { skip }, async () => {
  // The whole of the milestone in one assertion: `fixture-event-h` names
  // `fixture-event-u` *second*, and `childrenOf` is built from every parent
  // rather than the first, so U opens on H exactly as F does. A reading that
  // took the first id would draw an empty umbrella here.
  const drawn = await drawnOn(`${WHOLE}&selected=${SECOND}`);
  for (const [name, ids] of Object.entries(drawn)) {
    if (asked(name, SECOND)) assert.ok(ids.includes(SECOND), `${name} left out the umbrella it was opened on`);
    assert.ok(ids.includes(CHILD), `${name} opened ${SECOND} and left out the event inside it`);
  }
});

test('opening the child keeps both of its umbrellas in the picture', { skip }, async () => {
  // A lens never hides what its own events are part of (M65) — all of them
  // since M79, so a reader who walked down into the event can see either
  // umbrella it belongs to and click back out through whichever they came in
  // by. Dimmed, not chosen: what is asserted here is that both are drawn.
  const drawn = await drawnOn(`${WHOLE}&selected=${CHILD}`);
  for (const [name, ids] of Object.entries(drawn)) {
    assert.ok(ids.includes(CHILD), `${name} left out the event it was opened on`);
    if (asked(name, FIRST)) assert.ok(ids.includes(FIRST), `${name} left out ${FIRST}, which the event is part of`);
    if (asked(name, SECOND)) assert.ok(ids.includes(SECOND), `${name} left out ${SECOND}, which the event is also part of`);
  }
});

test('the card says "part of" each umbrella, in the order the record spells them', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(`?${WHOLE}&selected=${CHILD}`), ready);
    await waitFor(
      page,
      'return document.querySelectorAll("#panel .part-of-event").length > 0;',
      'the card to say what the event is part of',
    );
    const lines = await page.eval(`return [...document.querySelectorAll('#panel .part-of-event')]
      .map((p) => ({
        text: p.textContent.replace(/\\s+/g, ' ').trim(),
        id: p.querySelector('button[data-action="select"]')?.dataset.id ?? null,
      }));`);
    assert.equal(lines.length, 2, 'one line per umbrella');
    assert.deepEqual(lines.map((l) => l.id), [FIRST, SECOND], 'in the record\'s own order');
    for (const line of lines) assert.match(line.text, /^Part of /);
  }, { device: DESK });
});

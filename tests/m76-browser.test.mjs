// M76 in a real browser: the band follows the selection, and the graph shows
// every date.
//
// Three instructions from the owner on 21 September, after seeing M75 on the
// public site. Two of them are about a picture and can only be judged in front
// of one:
//
//   * *"If for example I select portugal, the map timeline I use to pick the
//     dates should show only those events"* — and the diagnosis that opens
//     `STATUS.md`'s M76 section was made here, on this page, and not from the
//     code: the profile **was** narrowing and the narrowing was spent on one
//     pixel of height, under a band whose ink was three quarters somebody
//     else's. So what is asserted is the band over the three ways into a
//     selection, and the busiest column reaching the band's own floor.
//   * *"I think the graph can always show all dates"* — an event a century
//     outside the window drawn exactly as one inside it, no shaded band, and
//     a camera at rest that has every drawn node on the screen.
//
// `tests/m76.test.mjs` holds the halves that need no DOM.
//
// Written before the behaviour it judges (deviations 711 and 717). **No test
// here pins a count or a pixel**: every assertion is a property — this set and
// not that one, this column at the floor, this node on the screen — and never
// a number a later import would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn, skip,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { lensView } from '../src/lens.js';
import { defaultState } from '../src/state.js';
import { centuryOf, centuryCounts } from '../src/util/window.js';
import { createTimelineScale } from '../src/timeline-scale.js';
import { STRIP } from '../src/map-band.js';

const dataDir = path.join(ROOT, 'data');

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1 };

const MAP_READY = 'return Boolean(document.querySelector(".map .mark"));';
const GRAPH_READY = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length > 0;";

// The band's profile as it is actually drawn: where each column stands, how
// tall it is, and the year the scale puts under it. The years come back so an
// assertion can be made about centuries rather than about pixels.
const PROFILE = `
  const strip = document.getElementById('map-band-strip');
  const path = strip && strip.querySelector('.layer-profile path');
  const d = path ? (path.getAttribute('d') || '') : '';
  const columns = [...d.matchAll(/M([-\\d.]+) ([-\\d.]+)h([-\\d.]+)v([\\d.]+)/g)].map((m) => ({
    x: Number(m[1]), height: Number(m[4]),
  }));
  return { drawn: Boolean(path), columns, body: 44 - 16 };`;

// The width the strip was actually drawn at, which is the one thing about the
// scale that only the browser knows.
const STRIP_WIDTH = `
  const strip = document.getElementById('map-band-strip');
  return Number(strip.getAttribute('width'));`;

// Which years those columns stand on. **The band's own scale and not a line
// through its two handles** (M83): the corpus is long and lopsided, so the
// scale buckets by century (timeline-scale.js) and is not linear at all — two
// points through it put a column of the 1500s in the 1700s, which is a test
// inventing a scale exactly as the comment here used to say it was avoiding.
// Rebuilt here from the atlas's own numbers and the strip's own width, which is
// the same call `map-band.js` makes, so nothing is invented and nothing is a
// second implementation.
function yearsAt(atlas, width, xs) {
  const domain = [atlas.extent.min - 1, atlas.extent.max + 1];
  const scale = createTimelineScale({
    domain,
    range: [STRIP.inset, width - STRIP.inset],
    counts: centuryCounts(atlas.activeEvents),
    extent: atlas.extent,
  });
  return xs.map((x) => Math.round(scale.invert(x)));
}

const params = 'return Object.fromEntries(new URLSearchParams(location.search));';

// The corpus's own answer about Portugal, computed in node and not in the
// page: which centuries the selection's own events fall in, and which
// centuries the atlas has that it does not. The second list is what test 1 is
// really about — a column there is a column of somebody else's events.
async function portugal() {
  const atlas = await atlasOf(dataDir);
  const view = lensView(atlas, { ...defaultState(), actor: 'portugal' });
  assert.ok(view, 'portugal is a lens on the repository’s own corpus');
  const own = new Set();
  for (const id of view.kept) {
    const when = atlas.events.get(id)?.when;
    if (when?.start != null) own.add(centuryOf(when.start));
  }
  const all = new Set();
  for (const event of atlas.activeEvents) {
    if (event.when?.start != null) all.add(centuryOf(event.when.start));
  }
  const empty = [...all].filter((c) => !own.has(c));
  assert.ok(own.size > 0, 'and it has events of its own');
  assert.ok(empty.length > 0, 'and the atlas has centuries it has none in, which is what the band must not draw');
  return {
    atlas, own: [...own].sort((a, b) => a - b), empty: empty.sort((a, b) => a - b), ring: view.near,
  };
}

// ─── 1. the band follows the selection, on all three ways in ───────────────

test('with Portugal selected every column of the band is Portugal’s, whichever way in', { skip }, async () => {
  const { own, empty, atlas } = await portugal();

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);

    // The band draws over the whole extent whatever the window is, so a
    // century left out of the profile is left out because nothing of the
    // selection falls in it and not because the band was narrowed.
    // **And it is read once it has stopped moving** (M83). A lens on an actor
    // has an input that lands after the state does — which events are on that
    // actor's ground is a file fetched when the lens is first set — so a
    // profile read the instant a path exists is as likely to be the resting
    // picture's as the selection's. It is the same discipline `named()` keeps
    // for a title that arrives with its century (docs/m78-flakes.md): read it
    // twice and believe it when it has not moved.
    const settled = async () => {
      let last = null;
      for (let tries = 0; tries < 40; tries += 1) {
        const now = await page.eval(`${PROFILE.slice(0, PROFILE.lastIndexOf('return'))}return d;`);
        if (now && now === last) return;
        last = now;
        await new Promise((resolve) => { setTimeout(resolve, 100); });
      }
    };
    const centuriesOfProfile = async () => {
      await settled();
      const profile = await page.eval(PROFILE);
      assert.equal(profile.drawn, true, 'the band has drawn a profile');
      assert.ok(profile.columns.length > 0, 'and it has columns');
      const width = await page.eval(STRIP_WIDTH);
      const years = yearsAt(atlas, width, profile.columns.map((c) => c.x));
      return new Set(years.map((y) => centuryOf(y)));
    };

    // (a) the link a reader is given.
    await open(page, url('?actor=portugal'), MAP_READY);
    await waitFor(page, 'return Boolean(document.querySelector("#map-band-strip .layer-profile path"));', 'the profile');
    const byLink = await centuriesOfProfile();
    for (const century of empty) {
      assert.ok(!byLink.has(century),
        `the band draws no column in ${century}, a century the selection has no event in`);
    }
    assert.ok(own.some((c) => byLink.has(c)), 'and it does draw the centuries the selection is in');

    // (b) the search box, which is how the owner most likely got there.
    await open(page, url(''), 'return document.querySelectorAll("#search-input").length > 0 && Boolean(document.querySelector("#map svg.map"));');
    await page.eval(`const box = document.getElementById("search-input");
      box.value = "Portugal"; box.dispatchEvent(new Event("input")); return true;`);
    await waitFor(page, `return Boolean(document.querySelector('[role="option"][data-id="portugal"]'));`,
      'the search list to offer Portugal');
    await page.eval(`document.querySelector('[role="option"][data-id="portugal"]')
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true })); return true;`);
    await waitFor(page, 'return new URLSearchParams(location.search).get("actor") === "portugal";',
      'the search box to open Portugal');
    await waitFor(page, 'return Boolean(document.querySelector("#map-band-strip .layer-profile path"));', 'the profile');
    const bySearch = await centuriesOfProfile();
    for (const century of empty) {
      assert.ok(!bySearch.has(century), `chosen from the search box, the band still draws nothing in ${century}`);
    }

    // (c) the territory itself: a polygon on the map, which is M54's own way in.
    await open(page, url(''), 'return Boolean(document.querySelector("#map .layer-presences path[data-actor]"));');
    await waitFor(page, `return Boolean(document.querySelector('#map .layer-presences [data-actor="portugal"]'));`,
      'Portugal’s ground to be drawn');
    await page.eval(`document.querySelector('#map .layer-presences [data-actor="portugal"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); return true;`);
    await waitFor(page, 'return new URLSearchParams(location.search).get("actor") === "portugal";',
      'the territory click to open Portugal');
    await waitFor(page, 'return Boolean(document.querySelector("#map-band-strip .layer-profile path"));', 'the profile');
    const byGround = await centuriesOfProfile();
    for (const century of empty) {
      assert.ok(!byGround.has(century), `clicked on its ground, the band still draws nothing in ${century}`);
    }

    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// The diagnosis, turned round. At the absolute scale the world drew a tallest
// column of 6 px and Portugal drew 5, inside a strip 44 deep: every profile
// was the same faint dusting and a reader could not see that the band had
// narrowed. At its own scale a profile with any density in it reaches the top
// of the band's body, and one with none — every column a single event — is the
// row of ticks it honestly is. What can no longer happen is the middle: a
// heap drawn three pixels tall because somewhere else in the corpus there is a
// bigger one.
test('a profile with density in it reaches the band’s full height, and one without is ticks', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    const tallestOf = async (query) => {
      await open(page, url(`index.html${query}`), MAP_READY);
      await waitFor(page, 'return Boolean(document.querySelector("#map-band-strip .layer-profile path"));', 'the profile');
      const profile = await page.eval(PROFILE);
      return { tallest: Math.max(...profile.columns.map((c) => c.height)), body: profile.body };
    };

    // Two sets that do have a busy column: the resting picture, and Portugal —
    // which is the selection the owner's sentence is about.
    for (const query of ['', '?actor=portugal']) {
      const { tallest, body } = await tallestOf(query);
      assert.equal(tallest, body,
        `the busiest column fills the band’s body on ${query || 'the resting picture'}`);
    }

    // And whatever the selection, the tallest column is one of the two honest
    // answers and never something between them.
    for (const query of ['', '?actor=portugal', '?actor=kingdom-of-portugal', '?actor=brazil']) {
      const { tallest, body } = await tallestOf(query);
      assert.ok(tallest === body || tallest === 3,
        `on ${query || 'the resting picture'} the tallest column is ${tallest}: neither the band’s body (${body}) nor a tick`);
    }
  }, { device: DESK });
});

// ─── 2. the exact-year fields are gone ─────────────────────────────────────

test('no field types a year any more, and a link still opens on its window', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?from=1900&to=1999'), MAP_READY);

    assert.equal(await page.eval('return document.querySelectorAll("input[data-window]").length;'), 0,
      'there is nothing in the document to type a year into');
    assert.equal(await page.eval('return document.querySelectorAll(".window-density").length;'), 0,
      'and no second profile on the masthead’s row');

    // The link still carries the window and the band still says it.
    assert.deepEqual(await page.eval(params), { from: '1900', to: '1999' });
    assert.equal(
      await page.eval(`return document.querySelector('#map-band-strip [data-window="band"]').getAttribute('aria-valuetext');`),
      '1900 to 1999',
      'the band opens on the window the link carried',
    );

    // And what the brief says to keep is kept.
    assert.equal(await page.eval('return document.querySelectorAll("#window-control .pin").length;'), 1);
    assert.equal(await page.eval('return document.querySelectorAll("#window-control .window-count").length;'), 1);
    // The standing line's *slot* is still there. What it says is M70's and is
    // off the demo since M82 (A2, demo.js), which `tests/m70-browser.test.mjs`
    // asserts with the flag on; what this test is about is that M76 took the
    // two year fields and the density hint and nothing else.
    assert.equal(await page.eval('return document.querySelectorAll("#window-control .window-read").length;'), 1,
      'the standing line still has its place on the row');

    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// M64's own test, kept where the control it is about now lives alone: the
// picture answers while the pointer is still down. It read the two number
// fields for the window before this milestone; it reads the band, which is
// what there is.
const BAND_WINDOW = `return {
  text: document.querySelector('#map-band-strip [data-window="band"]').getAttribute('aria-valuetext'),
  to: document.querySelector('#map-band-strip .window-handle.to').getAttribute('aria-valuenow'),
  urlTo: new URLSearchParams(location.search).get('to'),
};`;
const MARKS = "return [...document.querySelectorAll('#map .mark')].map((m) => m.getAttribute('data-id'));";

test('dragging a handle still moves the window, and the map still answers mid-gesture', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1415&to=2025'), MAP_READY);
    await waitFor(page, 'return Boolean(document.getElementById("map-band-strip"));', 'the band');

    const before = { window: await page.eval(BAND_WINDOW), marks: await page.eval(MARKS) };
    assert.ok(before.marks.length > 0, 'the map is drawing something to begin with');

    await page.eval(`
      const strip = document.getElementById('map-band-strip');
      const handle = strip.querySelector('.window-handle.to');
      const box = handle.getBoundingClientRect();
      const strips = strip.getBoundingClientRect();
      const at = { bubbles: true, cancelable: true, pointerId: 11 };
      handle.dispatchEvent(new PointerEvent('pointerdown', {
        ...at, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
      strip.dispatchEvent(new PointerEvent('pointermove', {
        ...at, clientX: Math.round(strips.left + 40), clientY: box.top + box.height / 2 }));
      return true;`);

    const during = { window: await page.eval(BAND_WINDOW), marks: await page.eval(MARKS) };
    assert.ok(Number(during.window.to) < Number(before.window.to),
      `the far end moved the way the pointer went (${before.window.text} → ${during.window.text})`);
    assert.notDeepEqual(during.marks, before.marks,
      'the map is drawing a different picture with the pointer still down');

    await page.eval(`
      const strip = document.getElementById('map-band-strip');
      const strips = strip.getBoundingClientRect();
      strip.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true, cancelable: true, pointerId: 11,
        clientX: Math.round(strips.left + 40), clientY: Math.round(strips.top + strips.height / 2) }));
      return true;`);
    await waitFor(page, `return new URLSearchParams(location.search).get('to') === '${during.window.to}';`,
      'the dragged window in the URL');
  }, { device: DESK });
});

test('on a phone there is no field either, and the band is still the control', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1900&to=1999'), MAP_READY);
    assert.equal(await page.eval('return document.querySelectorAll("input[data-window]").length;'), 0);
    assert.equal(await page.eval('return document.querySelectorAll("#map-band-strip .window-handle").length;'), 2,
      'both ends are there to take hold of with a thumb');
  }, { device: PHONE, touch: true });
});

// ─── 3. the graph shows every date ─────────────────────────────────────────

// Every node the graph drew, with whether the whole of it is on the screen.
// The same probe M74's suite uses, and for the same reason: the graph draws
// what falls inside the rectangle the reader can see, so "drawn" and "seen"
// are two different questions.
const NODES = `
  const svg = document.querySelector('svg.graph');
  const pane = svg.getBoundingClientRect();
  return [...svg.querySelectorAll('.layer-nodes circle.node')].map((el) => {
    const box = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-id'),
      faded: el.classList.contains('faded'),
      seen: box.left >= pane.left && box.right <= pane.right
        && box.top >= pane.top && box.bottom <= pane.bottom,
    };
  });`;

test('an event outside the window is drawn on the graph exactly as one inside it', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  // Two events a century apart, both in the resting picture, so one window can
  // hold one of them and leave the other far outside.
  const years = new Map(atlas.activeEvents.map((e) => [e.id, e.when?.start ?? null]));

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=graph&from=1900&to=1910'), GRAPH_READY);

    const nodes = await page.eval(NODES);
    assert.ok(nodes.length > 0, 'the graph drew something');
    const outside = nodes.filter((n) => {
      const year = years.get(n.id);
      return year !== null && year !== undefined && (year < 1900 || year > 1910);
    });
    assert.ok(outside.length > 0,
      'a window of eleven years leaves events outside it, and the graph draws them anyway');
    for (const node of nodes) {
      assert.equal(node.faded, false, `${node.id} is drawn in full, whatever the window says`);
    }
    assert.equal(await page.eval(`return document.querySelectorAll('svg.graph .window-band').length;`), 0,
      'and there is no shaded band across the picture');

    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('at rest the graph’s camera fits every node it has drawn', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // A narrow window: before this milestone the camera zoomed to it and
    // everything else was off the screen or faded away.
    await open(page, url('?view=graph&from=1974&to=1976'), GRAPH_READY);
    const nodes = await page.eval(NODES);
    assert.ok(nodes.length > 0, 'the graph drew something');
    for (const node of nodes) {
      assert.ok(node.seen, `${node.id} is on the screen at rest, and not framed away by a window`);
    }
  }, { device: DESK });
});

test('moving the window leaves the graph’s picture where it is', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?view=graph'), GRAPH_READY);
    const before = await page.eval(NODES);
    const camera = "return document.querySelector('svg.graph g.viewport').getAttribute('transform') || '';";
    const cameraBefore = await page.eval(camera);

    await page.eval(`history.replaceState(null, '', '?view=graph&from=1500&to=1520');
      window.dispatchEvent(new PopStateEvent('popstate')); return true;`);
    await waitFor(page, "return new URLSearchParams(location.search).get('from') === '1500';", 'the narrower window');

    const after = await page.eval(NODES);
    assert.deepEqual(after.map((n) => n.id).sort(), before.map((n) => n.id).sort(),
      'the same nodes, because the graph is not a picture of the window');
    assert.equal(await page.eval(camera), cameraBefore, 'and nothing moved the camera');
  }, { device: DESK });
});

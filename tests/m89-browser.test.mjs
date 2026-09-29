// M89 — what a reader met on the third review, in a real browser. The sections
// of `docs/m89-brief.md` whose subject is the page itself.
//
// Nothing here pins a count or a pixel: every expectation is derived from the
// page it runs against — the corpus's own shard list, the pane's own box, an
// actor chosen out of the records — and the corpus grows by about a hundred
// records a day on two other branches (brief, "Must not").
//
// Written before the behaviour it judges (deviations 711 and 717).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  withBrowser, open, seenIntro, waitFor, until, skip, manifestOf, settledShards,
} from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { LOADING_LABEL } from '../src/attributes.js';

const DESK = { width: 1280, height: 800, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1 };

const MAP_READY = 'return Boolean(document.querySelector("#map svg.map"));';
const CARD_READY = 'return Boolean(document.querySelector(".intro-card"));';

const atlas = await atlasOf(path.join(ROOT, 'data'));

// An actor with events, chosen out of the corpus rather than written down: a
// chip is what names one, and a name is what section 1 is about. The most
// eventful one, so the lens is never empty whatever the day's imports did.
const ACTOR = [...atlas.actors.values()]
  .map((a) => [a.id, (atlas.eventsByActor.get(a.id) ?? []).length])
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? null;

// ─── 1. no id where a title goes, and the card redraws off the atlas (A1) ───

// Every place on the front page that names a record, with the id it names
// beside the text it printed: the intro's ways in, and the masthead's chips.
const NAMES = `
  const rows = [];
  for (const el of document.querySelectorAll('.intro-card [data-intro="event"], .intro-card [data-intro="narrative"]')) {
    rows.push({ where: 'intro', id: el.dataset.id, text: (el.textContent || '').trim() });
  }
  for (const badge of document.querySelectorAll('.lens-chips .lens-badge')) {
    const drop = badge.querySelector('.lens-drop');
    rows.push({
      where: 'chip',
      id: ((drop && drop.dataset.focus) || '').split(':').slice(1).join(':'),
      text: ((badge.querySelector('.lens-name') || {}).textContent || '').trim(),
    });
  }
  return rows;`;
const NAMED = `${NAMES.slice(0, -('return rows;'.length))}
  return rows.length > 0 && rows.every((row) => row.text && row.text !== row.id && row.text !== ${JSON.stringify(LOADING_LABEL)});`;

// The card's ways into an *event*, which are the rows whose shard is a century:
// a narrative has no dates and is filed in the `null` shard, which the page asks
// for in a frame of its own (main.js), so it is not a row a test with no frames
// can expect a name for.
const EVENT_NAMES = `
  return [...document.querySelectorAll('.intro-card [data-intro="event"]')]
    .map((el) => ({ id: el.dataset.id, text: (el.textContent || '').trim() }));`;
const EVENTS_NAMED = `${EVENT_NAMES.replace('return [', 'const rows = [').replace(/;$/, ';')}
  return rows.length > 0 && rows.every((row) => row.text && row.text !== row.id && row.text !== ${JSON.stringify(LOADING_LABEL)});`;

function assertNamed(rows, where, what) {
  assert.ok(rows.length > 0, `${where}: ${what} names a record`);
  for (const row of rows) {
    assert.notEqual(row.text, row.id, `${where}: the ${row.where} prints the id "${row.id}" where a title goes`);
    assert.notEqual(row.text, LOADING_LABEL, `${where}: the ${row.where} for ${row.id} is still loading`);
    assert.ok(row.text.length > 0, `${where}: the ${row.where} for ${row.id} has no name at all`);
  }
}

test('§1: with every shard in, nothing on the front page prints a slug or a loading label', { skip }, async () => {
  const manifest = await manifestOf();
  assert.ok(ACTOR, 'the corpus has an actor with events');
  await withBrowser(async (page, url) => {
    // The card itself: a first visit, so the "seen" flag is not set, and
    // nothing in the URL — a lens of any kind is a picture somebody chose and
    // the card does not cover one (intro.js, `opensOnNothing`).
    await open(page, url(''), MAP_READY);
    await waitFor(page, 'return document.getElementById("intro").hidden === false;', 'the introduction');
    await settledShards(page, manifest);
    await until(page, NAMED);
    assertNamed(await page.eval(NAMES), 'the card at rest', 'the card');

    // And the chips, which is the same shape in the masthead: the reviewer's
    // `lens-japan-graph.png` had every node named and the chip reading
    // "ACTOR loading…".
    await seenIntro(page);
    await open(page, url(`?focus=actor:${ACTOR}`), MAP_READY);
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length > 0;', 'the chip');
    await settledShards(page, manifest);
    await until(page, NAMED);
    assertNamed(await page.eval(NAMES), 'the chip at rest', 'the chip');
  }, { device: DESK });
});

// And the frame that is never run. An animation frame is not served while the
// document is hidden, so the one callback the card used to be redrawn from does
// not happen at all in a background tab: a reader who opened the atlas in a
// second tab and came back to it met the slugs (A1). The frame is taken away
// outright here, which is that case and every other way one can be lost.
const LOSE_FRAMES = `
  window.__frames = [];
  window.requestAnimationFrame = function (fn) { window.__frames.push(fn); return window.__frames.length; };
  Object.defineProperty(document, 'hidden', { get: () => window.__hidden === true });
  Object.defineProperty(document, 'visibilityState', { get: () => (window.__hidden ? 'hidden' : 'visible') });
  window.__hidden = true;
`;

// How many attribute shards have arrived, and a wait for the number to stop
// moving. `settledShards` waits for every shard the build wrote, which is the
// right wait everywhere else; with no frames served it is the wrong one, because
// the centuries outside the window are asked for *in* a frame (main.js). So what
// is waited for here is the page asking for nothing more.
const SHARDS_IN = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;';
async function settledAsks(page, { every = 100, still = 4, tries = 150 } = {}) {
  let last = -1;
  let steady = 0;
  for (let i = 0; i < tries; i += 1) {
    const now = await page.eval(SHARDS_IN);
    steady = now === last && now > 0 ? steady + 1 : 0;
    if (steady >= still) return now;
    last = now;
    await new Promise((resolve) => { setTimeout(resolve, every); });
  }
  assert.fail(`the page was still fetching attribute shards after ${Math.round(tries * every / 1000)} s`);
  return 0;
}

test('§1: a landing whose frame is never run is drawn when the tab comes back', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: LOSE_FRAMES });
    await open(page, url(''), CARD_READY);
    await waitFor(page, 'return document.getElementById("intro").hidden === false;', 'the introduction');
    await settledAsks(page);
    assert.ok(await page.eval('return window.__frames.length > 0;'), 'a frame was asked for and never served');
    // Which is the state the review found: the centuries are in and the card is
    // not. It says it is loading rather than printing a slug — that is section
    // 1's other half, and it is true on either side of what follows.
    const before = await page.eval(EVENT_NAMES);
    assert.ok(before.length > 0, 'the card offers events to open');
    assert.ok(before.every((row) => row.text === LOADING_LABEL),
      `the card was redrawn without a frame: ${JSON.stringify(before)}`);
    for (const row of before) assert.notEqual(row.text, row.id, 'and never a slug, even then');

    // The tab comes back. Nothing else happens: no click, no state change, no
    // second landing, and still not one frame served.
    await page.eval('window.__hidden = false; document.dispatchEvent(new Event("visibilitychange")); return true;');
    await until(page, EVENTS_NAMED);
    const after = await page.eval(EVENT_NAMES);
    assertNamed(after.map((row) => ({ ...row, where: 'intro' })), 'after the tab came back', 'the card');
    for (const row of after) {
      const record = atlas.events.get(row.id);
      assert.ok(record, `${row.id} is a record`);
      assert.equal(row.text, record.title.trim(), `${row.id} is named by its own title`);
    }
  }, { device: DESK });
});

// ─── 2. the phone's first map, and a lens that frames its marks (A2) ────────

// A mark's own box against the box of the pane it is drawn in, read off the
// elements themselves: the map is one `<svg>` scaled to its pane, so a mark
// inside the pane's rectangle is a mark a reader can see.
const MARKS_IN_VIEW = `
  const svg = document.querySelector('#map svg.map');
  if (!svg) return null;
  const pane = svg.getBoundingClientRect();
  const rows = [];
  // A cluster is a mark too — two events at one point are drawn as one, and the
  // members are the panel's (map.js) — so it is counted with no id of its own.
  for (const mark of svg.querySelectorAll('.mark[data-id], .mark[data-cluster]')) {
    const box = mark.getBoundingClientRect();
    if (!box.width && !box.height) continue;
    rows.push({
      id: mark.getAttribute('data-id'),
      cluster: mark.getAttribute('data-cluster'),
      inside: box.left >= pane.left && box.right <= pane.right
        && box.top >= pane.top && box.bottom <= pane.bottom,
    });
  }
  return { pane: { width: pane.width, height: pane.height }, marks: rows };`;

// Which lane each drawn mark is in, from the records rather than from the page.
const laneOf = new Map(atlas.activeEvents.map((e) => [e.id, e.region ?? null]));

test('§2: the phone opens on the world, not on a third of it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(''), 'return document.querySelectorAll("#map .mark").length > 0;');
    await settledShards(page, await manifestOf());
    const read = await page.eval(MARKS_IN_VIEW);
    assert.ok(read && read.marks.length > 0, 'the map drew marks');
    // The claim: more than one lane's marks are on the screen. The reviewer's
    // phone showed Asia and Australia and nothing else, with Europe, Africa and
    // the Americas off it on either side. Which lanes, and how many, are the
    // corpus's own — nothing here is written down.
    const lanes = new Set(read.marks.filter((m) => m.inside).map((m) => laneOf.get(m.id) ?? null));
    lanes.delete(null);
    const inCorpus = new Set([...laneOf.values()].filter(Boolean));
    assert.ok(lanes.size > 1,
      `only ${[...lanes].join(', ') || 'no'} lane's marks are inside a ${Math.round(read.pane.width)}x${Math.round(read.pane.height)} pane`);
    assert.ok(lanes.size >= Math.min(3, inCorpus.size),
      `the phone's first map shows ${lanes.size} of the corpus's ${inCorpus.size} lanes: ${[...lanes].join(', ')}`);
  }, { device: PHONE });
});

// An actor whose events stand close together, chosen by measuring them rather
// than by naming one: a lens the camera has something to do for. The widest
// span of longitude its placed events cover, smallest first, and at least two of
// them so that the lens has a size at all.
const TIGHT = (() => {
  let best = null;
  for (const actor of atlas.actors.values()) {
    const points = (atlas.eventsByActor.get(actor.id) ?? [])
      .map((row) => atlas.pointOf(row.event)).filter(Boolean);
    // Two *distinct* points and no fewer: events at one point are drawn as one
    // cluster with no id, so an actor whose whole lens is one stack has nothing
    // to say about where the camera put which mark.
    const distinct = new Set(points.map((p) => `${p.lon},${p.lat}`));
    if (distinct.size < 2) continue;
    const lons = points.map((p) => p.lon);
    const lats = points.map((p) => p.lat);
    const span = Math.max(Math.max(...lons) - Math.min(...lons), Math.max(...lats) - Math.min(...lats));
    if (best === null || span < best.span || (span === best.span && actor.id < best.id)) {
      best = { id: actor.id, span, events: points.length };
    }
  }
  return best;
})();

// What the viewport was translated and scaled by: the camera itself, read off
// the element the map sets it on.
// A viewport with no transform attribute at all is the identity: the map sets one
// only once something has moved it, and the world at k = 1 is where it starts.
const CAMERA = `
  const g = document.querySelector('#map .viewport');
  if (!g) return null;
  const at = g.getAttribute('transform');
  if (!at) return { x: 0, y: 0, k: 1 };
  const m = /translate\\(([^ )]+) ([^ )]+)\\) scale\\(([^)]+)\\)/.exec(at);
  return m ? { x: Number(m[1]), y: Number(m[2]), k: Number(m[3]), at } : null;`;

test('§2: a lens on an actor frames the camera on its marks', { skip }, async () => {
  assert.ok(TIGHT, 'the corpus has an actor with two placed events');
  const wanted = new Set((atlas.eventsByActor.get(TIGHT.id) ?? [])
    .map((row) => row.event)
    .filter((event) => atlas.pointOf(event))
    .map((event) => event.id));
  assert.ok(wanted.size > 1, `${TIGHT.id} has placed events to frame`);
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // At rest first, so that what follows is a camera that moved and not one
    // that was always there.
    await open(page, url(''), 'return document.querySelectorAll("#map .mark").length > 0;');
    const resting = await page.eval(CAMERA);
    assert.ok(resting && resting.k === 1 && resting.x === 0 && resting.y === 0,
      `at rest the camera is the whole world, and it reads ${JSON.stringify(resting)}`);

    await open(page, url(`?focus=actor:${TIGHT.id}`), 'return document.querySelectorAll("#map .mark").length > 0;');
    await settledShards(page, await manifestOf());
    await until(page, `const c = (() => { ${CAMERA} })(); return Boolean(c) && c.k > 1;`);
    const camera = await page.eval(CAMERA);
    assert.ok(camera, `the map has a camera the test can read; it says ${JSON.stringify(camera)}`);
    assert.ok(camera.k > 1,
      `the lens on ${TIGHT.id} spans ${TIGHT.span.toFixed(1)} degrees and the camera stayed at the world (k = ${camera.k})`);

    const read = await page.eval(MARKS_IN_VIEW);
    assert.ok(read && read.marks.length > 0, 'the lens drew marks');
    const inside = read.marks.filter((m) => m.inside);
    assert.ok(inside.length > 0,
      `the lens on ${TIGHT.id} drew ${read.marks.length} marks and not one of them is in the pane`);
    // And one of them is the actor's own, where the camera left it a mark of its
    // own rather than a stack: a cluster is inside the pane and says nothing
    // about which event it holds.
    const named = inside.filter((m) => m.id);
    if (named.length > 0) {
      assert.ok(named.some((m) => wanted.has(m.id)),
        `none of the named marks in the pane is an event of ${TIGHT.id}: ${named.map((m) => m.id).slice(0, 6).join(', ')}`);
    }
  }, { device: PHONE });
});

// ─── 5. the resting timeline writes a name only where it fits (A5) ──────────

// Every drawn bar and every drawn title, as the boxes they actually occupy on
// the page. Read off `getBoundingClientRect`, so what is compared is what the
// browser laid out and not what this file thinks the layout should be.
const TIMELINE_BOXES = `
  const svg = document.querySelector('#timeline svg.timeline');
  if (!svg) return null;
  const pane = svg.getBoundingClientRect();
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
  };
  return {
    pane: { x0: pane.left, x1: pane.right, y0: pane.top, y1: pane.bottom },
    bars: [...svg.querySelectorAll('.bar[data-id]')].map((el) => ({ id: el.getAttribute('data-id'), ...box(el) })),
    labels: [...svg.querySelectorAll('text.bar-label')].map((el) => ({ text: el.textContent, ...box(el) })),
    // The umbrella names over the axis are laid out by a rule of their own
    // (M82, A6) and are held to the pane's edges by the same claim (M89 §5).
    bands: [...svg.querySelectorAll('text.large-band-label')].map((el) => ({ text: el.textContent, ...box(el) })),
  };`;

const overlaps = (a, b) => a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5
  && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;

test('§5: no title on the resting timeline is written over a bar or another title', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?view=timeline'), 'return document.querySelectorAll("#timeline .bar").length > 0;');
    await settledShards(page, await manifestOf());
    // A title arrives with its century, so the picture this is about is the one
    // after the names have landed.
    await until(page, 'return document.querySelectorAll("#timeline text.bar-label").length > 0;');
    const read = await page.eval(TIMELINE_BOXES);
    assert.ok(read, 'the timeline drew');
    assert.ok(read.bars.length > 0, 'it drew bars');
    assert.ok(read.labels.length > 0, 'and it wrote names');

    for (let i = 0; i < read.labels.length; i += 1) {
      for (let j = i + 1; j < read.labels.length; j += 1) {
        assert.ok(!overlaps(read.labels[i], read.labels[j]),
          `"${read.labels[i].text}" is written over "${read.labels[j].text}"`);
      }
      for (const bar of read.bars) {
        assert.ok(!overlaps(read.labels[i], bar),
          `"${read.labels[i].text}" is written across the bar of ${bar.id}`);
      }
    }
  }, { device: DESK });
});

test('§5: and no title is cut by either edge of the pane', { skip }, async () => {
  // Both widths: the phone is where a name is moved to the other side of its
  // own bar, and where it used to run off the edge it was moved to (M86 §4).
  for (const device of [DESK, PHONE]) {
    // eslint-disable-next-line no-await-in-loop
    await withBrowser(async (page, url) => {
      await seenIntro(page);
      await open(page, url('?view=timeline'), 'return document.querySelectorAll("#timeline .bar").length > 0;');
      await settledShards(page, await manifestOf());
      await until(page, 'return document.querySelectorAll("#timeline text.bar-label").length > 0;');
      const read = await page.eval(TIMELINE_BOXES);
      assert.ok(read && read.labels.length > 0, `${device.width}: names were written`);
      for (const label of [...read.labels, ...read.bands]) {
        assert.ok(label.x0 >= read.pane.x0 - 0.5 && label.x1 <= read.pane.x1 + 0.5,
          `${device.width}: "${label.text}" runs off the pane (${Math.round(label.x0 - read.pane.x0)} to ${Math.round(label.x1 - read.pane.x0)} of ${Math.round(read.pane.x1 - read.pane.x0)})`);
      }
    }, { device });
  }
});

// The map's arithmetic in a real browser, where the SVG is really
// letterboxed. None of this can be checked without a layout: the whole
// defect is that the element's box and its viewBox have different shapes,
// and in a test with no CSS they have the same one.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';
import { cellsFor } from '../src/map/grid.js';
import { parseBbox } from '../src/state.js';
import { fixtures } from './helpers.mjs';

// Wide and short, so the map area is far wider than 960 × 540's ratio and
// the picture spills well outside the nominal box on both sides.
const WIDE = { width: 1400, height: 620, deviceScaleFactor: 1 };

const wide = (fn) => withBrowser(fn, { device: WIDE });

// Waits until the attribute shards have stopped arriving: two readings of the
// page's own resource timeline the same, a beat apart. The count is not known
// here — it is a property of the build — and what a caller actually wants is
// "nothing more is coming", which this is (attributes.js, I4a).
async function settledShards(page) {
  const count = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;';
  let last = -1;
  for (let tries = 0; tries < 40; tries += 1) {
    const now = await page.eval(count);
    if (now > 0 && now === last) return;
    last = now;
    await new Promise((resolve) => { setTimeout(resolve, 100); });
  }
}

const READY = 'return Boolean(document.querySelector(".map .mark"));';
// The timeline is the third view since M60 and is drawn when it is chosen, so
// a test that reads the lanes asks for them the way a reader does: the button
// in the masthead, or `?view=timeline` in the link. The window, the box and
// the lens are the state and do not move when the view does (m60-brief §3).
const TO_TIMELINE = 'document.querySelector(\'[data-view="timeline"]\').click(); return true;';
const LANES = 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;';

// A real pan: press near the right edge on empty ground, move across the
// pane, let go. Dispatched as pointer events because the handlers under test
// are the map's own.
const panBy = (dx) => `
  const root = document.querySelector('#map svg.map');
  const box = root.getBoundingClientRect();
  const x = ${dx} < 0 ? box.right - 8 : box.left + 8;
  const y = box.top + 8;
  const at = (cx, type) => root.dispatchEvent(new PointerEvent(type, {
    bubbles: true, clientX: cx, clientY: y, pointerId: 1,
  }));
  at(x, 'pointerdown');
  for (let i = 1; i <= 10; i += 1) at(x + (${dx} * i) / 10, 'pointermove');
  at(x + ${dx}, 'pointerup');
  return true;`;

// One notch of the wheel over the middle of the pane. Since M39a, k = 1 is
// the whole world (projection.js), so a wide pane at rest shows every
// longitude there is and the map publishes no box at all — the absence of one
// *is* the world. A test about which strip of the world is on screen has to
// be somewhere there is a strip, so these zoom in first.
const zoomIn = (deltaY = -400) => `
  const root = document.querySelector('#map svg.map');
  const box = root.getBoundingClientRect();
  root.dispatchEvent(new WheelEvent('wheel', {
    bubbles: true, cancelable: true, deltaY: ${deltaY},
    clientX: box.left + box.width / 2, clientY: box.top + box.height / 2,
  }));
  return true;`;

// The map's pane used to have to be frozen before a pan was measured: the
// timeline was a strip under it whose height a reader could drag, so the
// picture could move for two reasons at once. Since M60 the map has the whole
// layout and nothing shares the row with it, so there is nothing to freeze.

// Every mark the reader can see, with where it is on the screen and where it
// is in the SVG's own units — which is how "outside the nominal box" is said
// in a way a test can check.
const VISIBLE_MARKS = `
  const root = document.querySelector('#map svg.map');
  const pane = root.getBoundingClientRect();
  const inverse = root.getScreenCTM().inverse();
  const out = [];
  for (const el of root.querySelectorAll('circle.mark[data-id]')) {
    const b = el.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    if (cx < pane.left || cx > pane.right || cy < pane.top || cy > pane.bottom) continue;
    const p = new DOMPoint(cx, cy).matrixTransform(inverse);
    out.push({ id: el.getAttribute('data-id'), cx, cy, svgX: p.x, svgY: p.y });
  }
  return out;`;

test('the map is letterboxed, and a mark out in the letterbox has a bar under it', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);

    // The premise: the pane really is wider than the viewBox's ratio, so the
    // visible SVG units run past 0 and 960 on either side.
    const shown = await page.eval(`
      const root = document.querySelector('#map svg.map');
      const box = root.getBoundingClientRect();
      const inverse = root.getScreenCTM().inverse();
      const a = new DOMPoint(box.left, box.top).matrixTransform(inverse);
      const b = new DOMPoint(box.right, box.bottom).matrixTransform(inverse);
      return { x0: a.x, x1: b.x, ratio: box.width / box.height };`);
    assert.ok(shown.ratio > 1.9, `the map area is wide (${shown.ratio.toFixed(2)})`);
    assert.ok(shown.x0 < -40, `the picture starts left of the viewBox (${Math.round(shown.x0)})`);
    assert.ok(shown.x1 > 1000, `and ends right of it (${Math.round(shown.x1)})`);

    // In one notch, then sideways, so that marks land in the strip the
    // nominal box does not cover — since M39a the fixture places are at the
    // far west of a world centred on 150E, so the pan that brings them into
    // the letterbox is the other way round from the one it was.
    await page.eval(zoomIn());
    await page.eval(panBy(150));
    await waitFor(page, 'return new URLSearchParams(location.search).has("bbox");', 'the box to be published');

    const marks = await page.eval(VISIBLE_MARKS);
    assert.ok(marks.length >= 3, `marks are on screen (${marks.length})`);
    const outside = marks.filter((m) => m.svgX < 0 || m.svgX > 960);
    assert.ok(outside.length > 0, 'and some of them are out in the letterbox');

    // viewport.js's promise: a mark the reader can see has a bar under it.
    // The fixtures are eleven placed events spread across the world, so no
    // two of them stack on the timeline and every one drawn is its own rect.
    // The box the map published is the state, so the lanes answer it on the
    // other view without the map being on screen at all.
    await page.eval(TO_TIMELINE);
    await waitFor(page, LANES, 'the lanes');
    const bars = await page.eval(`return [...document.querySelectorAll('#timeline rect.bar[data-id]')]
      .map((el) => el.getAttribute('data-id'));`);
    const missing = marks.map((m) => m.id).filter((id) => !bars.includes(id));
    assert.deepEqual(missing, [], 'every mark on screen has a bar under it');
  });
});

test('a click on a mark out in the letterbox selects it, and a pan follows the cursor', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await page.eval(zoomIn());
    await page.eval(panBy(150));
    await waitFor(page, 'return new URLSearchParams(location.search).has("bbox");', 'the box to be published');

    const marks = await page.eval(VISIBLE_MARKS);
    const target = marks.filter((m) => m.svgX < 0).sort((a, b) => a.cx - b.cx)[0];
    assert.ok(target, 'a mark is showing in the left-hand letterbox');

    // A press and a release on the same point, through the real pointer path.
    await page.eval(`
      const el = document.querySelector('#map circle.mark[data-id="${target.id}"]');
      const at = (type) => el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, clientX: ${target.cx}, clientY: ${target.cy}, pointerId: 2,
      }));
      at('pointerdown');
      at('pointerup');
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: ${target.cx}, clientY: ${target.cy} }));
      return true;`);
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get("selected") === ${JSON.stringify(target.id)};`,
      'the mark under the cursor to be selected',
    );

    // And the picture moves at the speed of the hand: scaling by the bounding
    // rectangle instead moved it at about two thirds (health review A,
    // finding 4).
    const centreOf = `const b = document.querySelector('#map circle.mark[data-id="${target.id}"]')
      .getBoundingClientRect(); return b.left + b.width / 2;`;
    const before = await page.eval(centreOf);
    await page.eval(panBy(120));
    const after = await page.eval(centreOf);
    assert.ok(
      Math.abs((after - before) - 120) <= 2,
      `the mark moved with the cursor (${Math.round(after - before)} of 120)`,
    );
  });
});

// --- the world is not a box, and a placeless event answers with its region --

// The count and the pin moved to the masthead with M60 — they were under the
// lanes, which are a view of their own now, and a reader on the map would
// never have seen them there again (window-control.js).
const TIMELINE = `return {
  search: location.search,
  filtered: !document.querySelector('#window-control .window-view').hidden,
  note: document.querySelector('#window-control .window-count').textContent,
  bars: [...document.querySelectorAll('#timeline rect.bar[data-id]')]
    .map((el) => el.getAttribute('data-id')).sort(),
};`;

// The active fixture events of the thirteenth century, which is what the
// atlas opens on with no window in the URL: the corpus reaches 2025 since
// M43b, and everything past the band's fifty-year margin is a tick in the
// density strip rather than a bar (util/window.js, `opensOn`). Ten of these
// have a place; fixture-event-f is the long process with none, in
// fixture-lane-3, whose polygon covers 10 … 40 east.
//
// Read off the fixture records rather than written out, so that the next
// person to add one does not have to find this list: what the test is about
// is that *every* active event of the opening century has a bar, not that
// there are eleven of them.
const all = await fixtures();
// **The resting picture and not every active event, since M65.** At rest every
// view draws the main events alone — an event that is part of another is drawn
// when a reader opens the one it belongs to — so a bar for a part is not a bar
// the lanes owe anybody.
const PARTED = new Set(all.records
  .filter((r) => r.kind === 'event' && r.status === 'active' && typeof r.parent === 'string')
  .map((r) => r.id));
const MAIN = (r) => r.kind === 'event' && r.status === 'active' && !PARTED.has(r.id);
const ACTIVE = all.records
  .filter((r) => MAIN(r) && (r.when.start?.min ?? r.when.start) < 1300)
  .map((r) => r.id)
  .sort();
// And how big the resting picture is altogether, which is the second number in
// the count in the masthead: "N of N events in view" counts against what the
// atlas is drawing and not against the whole corpus (M65).
const ACTIVE_TOTAL = all.records.filter(MAIN).length;
const inView = (n) => new RegExp(`^${n} of ${ACTIVE_TOTAL} events in view$`);

test('the whole world is no box at all, and the lanes carry every active event', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1&view=timeline&bbox=-180,-90,180,90'), LANES);
    const shown = await page.eval(TIMELINE);
    assert.equal(shown.search, '?fixtures=1&view=timeline', 'the world box does not survive being read');
    assert.equal(shown.filtered, false, 'so the lanes are not filtered and the pin is not offered');
    assert.deepEqual(shown.bars, ACTIVE);
  });
});

test('an event with no place is in view when its region\'s box is', { skip }, async () => {
  await wide(async (page, url) => {
    // A box inside fixture-lane-3, which is where the placeless event is.
    await open(page, url('?fixtures=1&view=timeline&bbox=15,0,35,40'), LANES);
    let shown = await page.eval(TIMELINE);
    assert.equal(shown.filtered, true);
    // The number in view is the box's own business and changes whenever a
    // fixture record is added; what this test is about is on the line below.
    assert.match(shown.note, inView('\\d+'));
    assert.ok(shown.bars.includes('fixture-event-f'), 'the placeless process is in the lanes');

    // And a box in fixture-lane-1, which is not.
    await open(page, url('?fixtures=1&view=timeline&bbox=-40,20,-10,50'), LANES);
    shown = await page.eval(TIMELINE);
    assert.match(shown.note, inView('\\d+'));
    assert.ok(!shown.bars.includes('fixture-event-f'), 'and out of them when the map is elsewhere');
  });
});

// --- one click, three pictures --------------------------------------------

// A click through the real path: the layers listen for `click` and find the
// mark under the pointer, so the event has to reach the element itself.
const clickOn = (selector) => `
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('nothing at ' + ${JSON.stringify(selector)});
  const b = el.getBoundingClientRect();
  const at = { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...at, pointerId: 3 }));
  el.dispatchEvent(new PointerEvent('pointerup', { ...at, pointerId: 3 }));
  el.dispatchEvent(new MouseEvent('click', at));
  return true;`;

const CHAIN = 'return new URLSearchParams(location.search).get("chain");';

// The map drew the consequence line and then refused to follow it: the same
// click walked the chain in the graph and threw it away here (health review
// B, finding 10).
// M39a. With 150E in the middle of the picture, +-180 is thirty degrees right
// of centre and a box across it is an ordinary view. The state used to sort
// the two longitudes, which turned this box into its complement — the other
// 340 degrees — and put nearly every event back in view. The fixture places
// run -35 to 25 east with one at 100, so the honest answer for the Pacific is
// that none of them is in it.
test('a box across the antimeridian is the strip it names, not its complement', { skip }, async () => {
  await wide(async (page, url) => {
    // Not the lanes: nothing of the fixtures is in the Pacific, so there is
    // no bar to wait for — which is the point. The count is the signal.
    const COUNTED = 'return (document.querySelector("#window-control .window-count")?.textContent ?? "").includes("in view");';
    await open(page, url('?fixtures=1&view=timeline&bbox=170,-20,-170,0'), COUNTED);
    const shown = await page.eval(TIMELINE);
    assert.match(shown.search, /bbox=170,-20,-170,0/, 'the box survives being read and written again');
    assert.equal(shown.filtered, true);
    assert.match(shown.note, inView('0'));
    assert.deepEqual(shown.bars, []);

    // And the same strip the other way round really is the rest of the world.
    await open(page, url('?fixtures=1&view=timeline&bbox=-170,-20,170,0'), LANES);
    const wideBox = await page.eval(TIMELINE);
    assert.ok(wideBox.bars.length > 0, 'the complement holds the fixtures');
  });
});

test('a click on a consequence walks the chain on the map and on the timeline', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-a'), READY);

    await page.eval(clickOn('#map circle.mark[data-id="fixture-event-b"]'));
    await waitFor(page, CHAIN, 'the map click to append a step');
    assert.equal(await page.eval(CHAIN), 'fixture-event-a--fixture-event-b--caused');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), 'fixture-event-b');

    // And on again from the timeline, which followed the map's old rule. It
    // is a view of its own since M60, so the reader goes to it; what they
    // were holding — the selection and the chain — goes with them.
    await page.eval(TO_TIMELINE);
    await waitFor(page, LANES, 'the lanes');
    await page.eval(clickOn('#timeline rect.bar[data-id="fixture-event-d"]'));
    await waitFor(
      page,
      'return (new URLSearchParams(location.search).get("chain") ?? "").split(",").length === 2;',
      'the timeline click to append the next step',
    );
    assert.equal(
      await page.eval(CHAIN),
      'fixture-event-a--fixture-event-b--caused,fixture-event-b--fixture-event-d--enabled',
    );

    // A mark that does not follow from what is open starts afresh, walk and
    // all: the chain is one argument and this is not part of it. The first
    // step of the walk, because since M65 the picture is narrowed to what the
    // open event reaches and G is no longer in it — and A, which the reader
    // walked from, is not a consequence of D either.
    await page.eval(clickOn('#map circle.mark[data-id="fixture-event-a"]'));
    await waitFor(page, 'return new URLSearchParams(location.search).get("selected") === "fixture-event-a";', 'a fresh start');
    assert.equal(await page.eval(CHAIN), null);
  });
});

// --- what reaches the DOM, and how often -----------------------------------
//
// H4a: the grouping covers every placed event in the window as it always did,
// and the *drawing* is culled to the rectangle on screen; and the zoom
// animation moves the transform without redrawing anything (health review A,
// finding 13; the health plan, decision 9).

// One notch of the wheel, over a point in the pane. deltaY is negative for
// a zoom in, and the map turns it into exp(-deltaY * 0.0015).
const wheelAt = (fx, fy, deltaY) => `
  const root = document.querySelector('#map svg.map');
  const box = root.getBoundingClientRect();
  root.dispatchEvent(new WheelEvent('wheel', {
    bubbles: true, cancelable: true, deltaY: ${deltaY},
    clientX: box.left + box.width * ${fx}, clientY: box.top + box.height * ${fy},
  }));
  return true;`;

// Every mark in the DOM, in the SVG's own units, beside the rectangle the
// pane really shows: the two together are what "culled to the viewport"
// means, and neither can be read off the other.
const MARKS_AND_BOX = `
  const root = document.querySelector('#map svg.map');
  const pane = root.getBoundingClientRect();
  const inverse = root.getScreenCTM().inverse();
  const corner = (x, y) => new DOMPoint(x, y).matrixTransform(inverse);
  const a = corner(pane.left, pane.top);
  const b = corner(pane.right, pane.bottom);
  const t = document.querySelector('#map .viewport').getAttribute('transform') ?? '';
  const [, tx, ty, k] = t.match(/translate\\(([-\\d.e]+) ([-\\d.e]+)\\) scale\\(([-\\d.e]+)\\)/) ?? [0, 0, 0, 1];
  const marks = [...root.querySelectorAll('circle[data-mark]')].map((el) => ({
    id: el.getAttribute('data-id'),
    x: (Number(el.getAttribute('cx')) * Number(k)) + Number(tx),
    y: (Number(el.getAttribute('cy')) * Number(k)) + Number(ty),
  }));
  return { marks, box: { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) }, k: Number(k) };`;

test('zoomed in, only the marks on screen are in the DOM', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);

    const before = await page.eval(MARKS_AND_BOX);
    assert.equal(before.k, 1, 'the map opens at k = 1');
    // Six and not eight since M65: the resting picture is the main events, and
    // the fixtures file two of theirs under F. What this test is about is that
    // the number falls when the reader zooms in, not what it starts at.
    assert.ok(before.marks.length >= 6, `the whole world is drawn to begin with (${before.marks.length})`);

    // In hard, over the left-hand third of the pane: the fixtures are spread
    // across the world, so most of them are now nowhere near the screen.
    await page.eval(wheelAt(0.3, 0.5, -1200));
    await waitFor(page, 'return new URLSearchParams(location.search).has("bbox");', 'the box to be published');

    const after = await page.eval(MARKS_AND_BOX);
    assert.ok(after.k > 5, `the wheel zoomed in (k = ${after.k.toFixed(1)})`);
    assert.ok(after.marks.length < before.marks.length,
      `fewer marks reach the DOM (${after.marks.length} of ${before.marks.length})`);
    // Everything still drawn is on screen, give or take a mark's own width:
    // DRAW_MARGIN is 20 SVG units at k = 1, so 20 / k here.
    const slack = 20 / after.k;
    const stray = after.marks.filter((m) => m.x < after.box.x0 - slack || m.x > after.box.x1 + slack
      || m.y < after.box.y0 - slack || m.y > after.box.y1 + slack);
    assert.deepEqual(stray.map((m) => m.id), [], 'nothing off screen is drawn');
    assert.ok(after.marks.length > 0, 'and something is still drawn');

    // Nothing was lost, only left undrawn: the whole world comes back when
    // the reader goes back out to it.
    await page.eval(`document.querySelector('#map svg.map').dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true })); return true;`);
    await waitFor(page, `return document.querySelectorAll('#map circle[data-mark]').length >= ${before.marks.length};`,
      'the marks to come back');
    const back = await page.eval(MARKS_AND_BOX);
    assert.equal(back.k, 1);
    assert.deepEqual(back.marks.map((m) => m.id).sort(), before.marks.map((m) => m.id).sort());
  });
});

// A click on a splittable cluster is answered with the zoom at which it comes
// apart, and that zoom is used as it was asked for rather than rounded down
// to a bucket (review of the health plan, finding 12; cluster.test.mjs says
// what a bucket would otherwise do to it). The fixtures have no two events
// close enough to stack, so this is asked of the real dataset, where Lisbon
// and its neighbours do.
const SPLITTABLE = `return Boolean(document.querySelector('#map circle.mark.cluster.splittable[data-cluster]'));`;

test('a click on a splittable cluster splits it, and the animation redraws once', { skip }, async () => {
  await wide(async (page, url) => {
    // Without the territories: a shard of borders arriving is a redraw of
    // its own, and what is being counted here is the animation's. Since I4a an
    // attribute shard landing is the same thing — it is what puts the names on
    // the marks — so the count starts once they are all in.
    await open(page, url('?layers=land,events'), SPLITTABLE);
    await settledShards(page);

    // Count the times the layer is emptied and drawn again. Before H4a the
    // 260 ms animation did it on every one of its frames.
    await page.eval(`
      window.__redraws = 0;
      new MutationObserver((records) => {
        for (const r of records) if (r.removedNodes.length) window.__redraws += 1;
      }).observe(document.querySelector('#map .layer-events'), { childList: true });
      return true;`);

    // The badge is the count of what is underneath, so it is what says the
    // stack came apart. A cluster does not always vanish when it splits: the
    // members no zoom can part stay on it, under the same key, because the
    // key is the representative's id.
    const badgeOf = (key) => `
      const el = document.querySelector('#map text.cluster-count[data-cluster="${key}"]');
      return el ? Number(el.textContent.slice(1)) : 0;`;
    const before = await page.eval(`
      const el = document.querySelector('#map circle.mark.cluster.splittable[data-cluster]');
      const key = el.getAttribute('data-cluster');
      const badge = document.querySelector('#map text.cluster-count[data-cluster="' + key + '"]');
      return { key, hidden: badge ? Number(badge.textContent.slice(1)) : 0 };`);
    assert.ok(before.hidden > 0, `the cluster says how many are under it (+${before.hidden})`);
    await page.eval(clickOn(`#map circle.mark.cluster.splittable[data-cluster="${before.key}"]`));

    // Past the animation and past the box settling behind it.
    await waitFor(page, 'return window.__redraws > 0;', 'the zoom to settle into a redraw');
    await new Promise((resolve) => { setTimeout(resolve, 900); });

    // A handful: the render the animation ends on, the one the settled box
    // asks for, the panel opening the cluster. Before H4a it was nineteen —
    // one per frame of the 260 ms animation, each grouping every point on the
    // map again — so what this is measuring is the difference between a few
    // discrete redraws and one per frame, and not the exact few.
    const redraws = await page.eval('return window.__redraws;');
    assert.ok(redraws <= 8, `the animation did not redraw per frame (${redraws} redraws)`);

    // And the cluster really came apart: the zoom it asked for was used as
    // it was rather than rounded down to a bucket below it.
    const hidden = await page.eval(badgeOf(before.key));
    assert.ok(hidden < before.hidden,
      `the stack came apart at the zoom it named (+${before.hidden} → +${hidden})`);
  });
});

// The territories are drawn at the detail the zoom is worth: 181 outlines at
// full precision were being turned into path strings on every change of year,
// and at the whole world most of those points land inside a pixel (health
// review B, finding 24). Asked of the real dataset, which is the one with
// borders in it.
const TERRITORY_DETAIL = `
  const paths = [...document.querySelectorAll('#map .layer-presences path.presence')];
  return {
    drawn: paths.length,
    points: paths.reduce((n, el) => n + (el.getAttribute('d').match(/[ML]/g) ?? []).length, 0),
  };`;

test('a border is drawn to the detail the zoom is worth, and no finer', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(''), 'return Boolean(document.querySelector("#map .layer-presences path"));');

    const world = await page.eval(TERRITORY_DETAIL);
    assert.ok(world.drawn > 10, `the world's borders are drawn (${world.drawn})`);

    // In past the second rung of the ladder, where the shard is drawn as it
    // was written.
    await page.eval(wheelAt(0.5, 0.5, -1600));
    await waitFor(page, `return document.querySelectorAll('#map .layer-presences path.presence').length > 0
      && [...document.querySelectorAll('#map .layer-presences path.presence')]
        .reduce((n, el) => n + el.getAttribute('d').length, 0) !== ${world.points};`, 'the borders to be redrawn');
    const close = await page.eval(TERRITORY_DETAIL);
    assert.ok(close.points > world.points,
      `zoomed in there is more of the border (${close.points} points against ${world.points})`);
    assert.ok(world.points < close.points * 0.9,
      `and the world is drawn with a good deal less of it (${world.points} of ${close.points})`);
  });
});

// M39b. The owner's screenshot of 5 September: zoomed in, every territory had
// two shorelines a few tenths of a degree apart, because CShapes' coast and
// Natural Earth's do not coincide and the map drew both. A territory is filled
// on its whole outline and stroked only along its inland borders now, so the
// shore on the picture is the one `land.js` draws and no other.
const TERRITORY_EDGES = `
  const layer = document.querySelector('#map .layer-presences');
  const nodes = [...layer.querySelectorAll('path')];
  const fills = nodes.filter((el) => el.classList.contains('presence'));
  const borders = nodes.filter((el) => el.classList.contains('presence-border'));
  const count = (el) => (el.getAttribute('d').match(/[ML]/g) ?? []).length;
  const style = (el) => getComputedStyle(el);
  return {
    fills: fills.length,
    borders: borders.length,
    fillStrokes: [...new Set(fills.map((el) => style(el).stroke))],
    borderFills: [...new Set(borders.map((el) => style(el).fill))],
    borderPointerEvents: [...new Set(borders.map((el) => style(el).pointerEvents))],
    borderStroked: borders.every((el) => style(el).stroke !== 'none'),
    closed: borders.filter((el) => el.getAttribute('d').includes('Z')).length,
    fillPoints: fills.reduce((n, el) => n + count(el), 0),
    borderPoints: borders.reduce((n, el) => n + count(el), 0),
    // Every border after every fill, so a neighbour's wash never tints the
    // line the two of them share.
    lastFill: nodes.findLastIndex((el) => el.classList.contains('presence')),
    firstBorder: nodes.findIndex((el) => el.classList.contains('presence-border')),
  };`;

test('a territory is stroked along its inland borders and nowhere else', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(''), 'return Boolean(document.querySelector("#map .layer-presences path"));');
    const seen = await page.eval(TERRITORY_EDGES);

    assert.ok(seen.fills > 10, `the world's territories are filled (${seen.fills})`);
    assert.ok(seen.borders > 10, `and bordered (${seen.borders})`);
    assert.deepEqual(seen.fillStrokes, ['none'], 'no fill carries a stroke of its own');
    assert.deepEqual(seen.borderFills, ['none'], 'and no border is filled');
    assert.equal(seen.borderStroked, true, 'every border is drawn in its territory\'s own line colour');
    assert.deepEqual(seen.borderPointerEvents, ['none'], 'a territory is picked up by its ground, not by its edge');
    assert.equal(seen.closed, 0, 'a border has two ends: no subpath is closed');
    assert.ok(seen.borders < seen.fills,
      `some territory has no inland border at all — an island (${seen.borders} of ${seen.fills})`);
    assert.ok(seen.borderPoints < seen.fillPoints / 2,
      `and the shore is the greater part of an outline, undrawn (${seen.borderPoints} of ${seen.fillPoints})`);
    assert.ok(seen.lastFill < seen.firstBorder, 'every border is over every wash');
  });
});

// --- what the map cannot draw as a mark ------------------------------------
//
// A8 and A10. Two of them: a regional event washes the polygons of its lane
// rather than standing on a point it does not have, and the corner counts the
// events of the window with no place at all.
test('the map counts the events of the window it has no place for', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?from=1960&to=1980'), READY);
    await waitFor(page, 'return Boolean(document.querySelector(".map-corner .map-unplaced"));', 'the corner');

    // The count is the atlas's own: active, kept by the lens, overlapping the
    // window, and with no place — the same three filters the marks obey, plus
    // the absence that keeps them off the map.
    const seen = await page.eval(`
      const text = document.querySelector('.map-corner .map-unplaced').textContent;
      return { text, corner: document.querySelector('.map-corner').hidden };`);
    assert.equal(seen.corner, false);
    assert.match(seen.text, /^\d+ events in this window have no place; they are on the timeline\.$/);
    const counted = Number(seen.text.match(/^(\d+)/)[1]);
    assert.ok(counted > 0, 'the atlas has placeless events in the sixties');

    // It is the corner opposite the failure note, and it is not that note.
    const where = await page.eval(`
      const pane = document.querySelector('.map-area').getBoundingClientRect();
      const box = document.querySelector('.map-corner').getBoundingClientRect();
      return { left: box.left - pane.left, bottom: pane.bottom - box.bottom };`);
    assert.ok(where.left < 40 && where.bottom < 40, `bottom-left (${where.left}, ${where.bottom})`);

    // A narrower window holds fewer of them, and a window with none prints
    // nothing at all rather than a zero.
    await open(page, url('?from=1974&to=1974'), READY);
    await waitFor(page, 'return true;', 'the map to settle');
    const narrow = await page.eval(`
      const el = document.querySelector('.map-corner .map-unplaced');
      return el ? Number(el.textContent.match(/^(\\d+)/)[1]) : 0;`);
    assert.ok(narrow < counted, `${narrow} in one year against ${counted} in twenty`);
  });
});

test('a regional event is a wash over its lane, and its parts are still their own marks', { skip }, async () => {
  await wide(async (page, url) => {
    // The fixtures' `fixture-event-f` is written `scope: regional` in
    // `fixture-lane-3`; `data/` has no `scope` on anything yet.
    await open(page, url('?fixtures=1'), READY);
    await waitFor(page, 'return document.querySelectorAll("#map .layer-regions path").length > 0;', 'the wash');
    const wash = await page.eval(`
      const el = document.querySelector('#map .layer-regions path.region-wash');
      const root = document.querySelector('#map svg.map');
      const layers = [...root.querySelector('.viewport').children].map((g) => g.getAttribute('class'));
      return {
        region: el.getAttribute('data-region'),
        title: el.querySelector('title').textContent,
        count: document.querySelectorAll('#map .layer-regions path').length,
        clickable: getComputedStyle(el).pointerEvents,
        under: layers.indexOf('layer layer-regions') < layers.indexOf('layer layer-events'),
        mark: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-t"]')),
      };`);
    assert.equal(wash.region, 'fixture-lane-3', 'the lane the event names');
    assert.equal(wash.title, 'Fixture event F');
    assert.equal(wash.count, 1, 'one wash for the one large event');
    assert.equal(wash.clickable, 'none', 'a wash covers marks and territories and takes no click');
    assert.ok(wash.under, 'and is drawn under them');
    assert.equal(wash.mark, false, 'and at rest the events inside it are inside it (M65)');

    // Opening the large event is what puts its parts on the map, and they are
    // marks of their own there — the wash is a drawing of the parent and never
    // a replacement for them.
    await open(page, url('?fixtures=1&selected=fixture-event-f'), READY);
    await waitFor(page, 'return document.querySelectorAll("#map .layer-regions path").length > 0;', 'the wash');
    const opened = await page.eval(`return {
      wash: document.querySelectorAll('#map .layer-regions path.region-wash').length,
      mark: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-t"]')),
    };`);
    assert.equal(opened.wash, 1, 'the wash is still drawn');
    assert.ok(opened.mark, 'an event inside a large one is a mark of its own once it is opened');
  });
});

// The coastline switch is gone and the coastlines are not (plan decision 14,
// M30b A11/A12). The control is generated, so what is asserted here is the
// generated thing: seven switches, none of them `land` and none of them
// `coast`, and a link that names no `land` still drawing it.
test('the coastlines have no switch and are always drawn', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    // Every box of the control that is not a category: the two plain rows and
    // the five inside the base-map group (layer-control.js). Neither of the two
    // names of a coastline is among them — `land` lost its switch in M30b, and
    // `coast` never had one, because the near shore is a level of detail of the
    // same line and not a layer a reader turns off (deviation 523).
    const control = await page.eval(`
      const boxes = [...document.querySelectorAll('.bar .layers input[data-layer]:not([data-category])')];
      return {
        ids: boxes.map((b) => b.dataset.layer),
        labels: boxes.map((b) => b.closest('label').textContent.trim()),
        land: document.querySelector('#map .layer-land').getBoundingClientRect().width > 0,
      };`);
    assert.deepEqual(control.ids,
      ['territories', 'events', 'rivers', 'lakes', 'physical', 'mountains', 'cities'],
      'no coastline switch, under either of its two names');
    assert.deepEqual(control.labels,
      ['territories', 'events', 'rivers', 'lakes', 'physical', 'mountains', 'cities']);
    assert.ok(control.land, 'the coastlines are drawn');

    // A link that turned them off before this milestone still parses, still
    // turns the territories off, and now draws the coastlines anyway.
    await open(page, url('?fixtures=1&layers=events'), READY);
    const after = await page.eval(`return {
      land: getComputedStyle(document.querySelector('#map .layer-land')).display,
      territories: getComputedStyle(document.querySelector('#map .layer-presences')).display,
      checked: [...document.querySelectorAll('.bar .layers input[data-layer]:not([data-category])')].map((b) => b.checked),
      categories: [...document.querySelectorAll('.bar .layers input[data-category]')].map((b) => b.checked),
    };`);
    assert.notEqual(after.land, 'none', 'the coastlines survive an old link that dropped them');
    assert.equal(after.territories, 'none', 'and the rest of the link is obeyed');
    // "these and nothing else": the events and no base layer (deviation 522).
    assert.deepEqual(after.checked, [false, true, false, false, false, false, false]);
    // The bare `events` means every category, so every category box is on: a
    // link shared before the toggles existed says the same thing it did.
    assert.deepEqual(after.categories, [true, true, true]);
  });
});

// --- a parent looks like one -----------------------------------------------
//
// M30c, §1: an event with parts is drawn with a second, thinner outline
// outside its mark, at every zoom and whatever the reader is doing. The one
// parent either corpus carries is `fixture-event-f`, and it has no place — it
// is the long process the map deliberately draws no dot for — so the drawing
// itself is exercised on a layer built here, over two synthetic events, in the
// real browser and through the real module. What the fixtures can say is the
// other half, and they say it on the page below: no leaf is ringed.
const SYNTHETIC_RING = `return (async () => {
  const [{ createEventsLayer }, { createProjection }] = await Promise.all([
    import('/src/map/layers/events.js'),
    import('/src/map/projection.js'),
  ]);
  const NS = 'http://www.w3.org/2000/svg';
  const root = document.createElementNS(NS, 'svg');
  root.setAttribute('class', 'map');
  const group = document.createElementNS(NS, 'g');
  root.appendChild(group);
  document.body.appendChild(root);
  const where = { parent: { lon: -9, lat: 38 }, leaf: { lon: 40, lat: -10 }, walked: { lon: 100, lat: 20 } };
  const events = ['parent', 'leaf', 'walked'].map((id) => ({
    id, title: id, status: 'active', weight: 1, place: id, when: { start: 1500, end: 1500 },
  }));
  const layer = createEventsLayer(group, createProjection({ width: 960, height: 480 }), {
    pointOf: (event) => where[event.id],
    onSelect: () => {},
    isParent: (event) => event.id !== 'leaf',
  });
  layer.render({
    events,
    selected: null,
    pathIds: new Set(['walked']),
    alone: new Set(['walked']),
    kept: new Set(['walked']),
    chainEdges: [],
    consequenceEdges: [],
    eventById: new Map(events.map((e) => [e.id, e])),
  });
  const read = (id) => {
    const mark = group.querySelector('circle.mark[data-id="' + id + '"]');
    const ring = [...group.querySelectorAll('circle.ring')].find((el) => (
      el.getAttribute('cx') === mark.getAttribute('cx') && el.getAttribute('cy') === mark.getAttribute('cy')
    )) ?? null;
    const style = ring ? getComputedStyle(ring) : null;
    return {
      radius: Number(mark.getAttribute('r')),
      ring: ring === null ? null : {
        sibling: ring.parentNode === mark.parentNode,
        radius: Number(ring.getAttribute('r')),
        classes: ring.getAttribute('class'),
        id: ring.getAttribute('data-id'),
        mark: ring.getAttribute('data-mark'),
        tabindex: ring.getAttribute('tabindex'),
        fill: style.fill,
        stroke: style.stroke,
        width: Number(ring.getAttribute('stroke-width')),
        events: style.pointerEvents,
      },
    };
  };
  const out = {
    parent: read('parent'),
    leaf: read('leaf'),
    walked: read('walked'),
    marks: group.querySelectorAll('circle.mark').length,
    rings: group.querySelectorAll('circle.ring').length,
    focusable: group.querySelectorAll('circle.ring[tabindex]').length,
  };
  root.remove();
  return out;
})();`;

test('a parent is drawn with a ring outside its mark, and a leaf is not', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    const drawn = await page.eval(SYNTHETIC_RING);

    assert.equal(drawn.leaf.ring, null, 'an event with no parts has no ring');
    assert.equal(drawn.marks, 3, 'three records, three marks');
    assert.equal(drawn.rings, 2, 'and a ring on each of the two parents');
    assert.equal(drawn.focusable, 0, 'a ring is not a control and takes no focus');

    const { ring, radius } = drawn.parent;
    assert.ok(ring, 'the parent has one');
    assert.ok(ring.sibling, 'beside the mark, in the same layer');
    assert.ok(ring.radius > radius, `outside it: ${ring.radius} around ${radius}`);
    assert.equal(ring.id, null, 'it names no record, so nothing opens it');
    assert.equal(ring.mark, null, 'and the keyboard path does not see it');
    assert.equal(ring.tabindex, null);
    assert.equal(ring.fill, 'none', 'an outline and not a disc');
    assert.equal(ring.events, 'none', 'the mark under it takes every click');
    assert.ok(ring.width > 0 && ring.width < 1.5, `thinner than the mark: ${ring.width}`);

    // The hierarchy of emphasis: the ring is the colour the mark itself has,
    // so a parent on the walked chain is a madder ring around a madder mark
    // and cobalt never overrules the accent.
    assert.match(drawn.walked.ring.classes, /\bon-path\b/);
    assert.doesNotMatch(drawn.walked.ring.classes, /\bmark\b/, 'a ring is an outline, not a record');
    assert.notEqual(drawn.walked.ring.stroke, drawn.parent.ring.stroke, 'the accent is not the cobalt');
  });
});

test('no event on the fixtures has parts and a place, so no mark on the map is ringed', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await settledShards(page);
    const seen = await page.eval(`return {
      rings: document.querySelectorAll('#map circle.ring').length,
      marks: document.querySelectorAll('#map circle.mark[data-id]').length,
    };`);
    assert.equal(seen.rings, 0, 'fixture-event-f is the one parent and it is placeless');
    assert.ok(seen.marks > 0, 'the marks are drawn all the same');
    // Where that parent *is* drawn it is ringed like any other, and the two
    // views that draw every event, placed or not, say so
    // (timeline-browser.test.mjs, graph-browser.test.mjs).
  });
});

// --- the symbol of a category, over the mark -------------------------------
//
// The whole of A2's bargain: the mark stays a `<circle>`, the symbol is a
// separate `<use>` that carries no identity, and an event with no category is
// drawn exactly as it was. None of it can be seen without a real layout and a
// real hit test — which is the half that matters, since the failure this
// guards against is a glyph swallowing the click that belongs to the mark.
//
// The fixtures carry three categorised events, three different categories, and
// nine with none (tests/fixtures/data/categories.json).
const GLYPHS = `
  const marks = [...document.querySelectorAll('#map circle.mark[data-id]')];
  const glyphs = [...document.querySelectorAll('#map use.glyph')];
  const of = (id) => {
    const mark = document.querySelector('#map circle.mark[data-id="' + id + '"]');
    if (!mark) return { mark: null, glyph: null };
    const glyph = [...document.querySelectorAll('#map use.glyph')].find((g) => {
      const cx = Number(g.getAttribute('x')) + Number(g.getAttribute('width')) / 2;
      const cy = Number(g.getAttribute('y')) + Number(g.getAttribute('height')) / 2;
      return Math.abs(cx - Number(mark.getAttribute('cx'))) < 0.01
        && Math.abs(cy - Number(mark.getAttribute('cy'))) < 0.01;
    }) ?? null;
    return {
      mark: mark ? { tag: mark.tagName, classes: mark.getAttribute('class'), label: mark.getAttribute('aria-label') } : null,
      glyph: glyph ? {
        href: glyph.getAttribute('href'),
        classes: glyph.getAttribute('class'),
        id: glyph.getAttribute('data-id'),
        markAttr: glyph.getAttribute('data-mark'),
        tabindex: glyph.getAttribute('tabindex'),
        events: getComputedStyle(glyph).pointerEvents,
        colour: getComputedStyle(glyph).color,
      } : null,
    };
  };
  return {
    marks: marks.length,
    glyphs: glyphs.length,
    symbols: document.querySelectorAll('#glyph-defs symbol').length,
    // fixture-event-a is a treaty and shares its point with a2, so at the
    // world it is inside a cluster and has no mark of its own: the cluster
    // case, asserted below.
    clustered: of('fixture-event-a'),
    disaster: of('fixture-event-c'),
    war: of('fixture-event-e'),
    ongoing: of('fixture-event-g'),
    none: of('fixture-event-d'),
  };`;

test('a categorised mark keeps its circle and gains a symbol, and one with no category does not', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await settledShards(page);
    const seen = await page.eval(GLYPHS);
    assert.equal(seen.symbols, 12, 'the twelve symbols are in the document once');
    assert.ok(seen.marks >= 4, `the marks are drawn (${seen.marks})`);

    for (const [category, row] of [['disaster', seen.disaster], ['war', seen.war], ['disaster', seen.ongoing]]) {
      assert.equal(row.mark.tag, 'circle', `${category}: the mark is still a circle`);
      assert.ok(row.glyph, `${category}: and carries its symbol`);
      assert.equal(row.glyph.href, `#glyph-${category}`);
      // Never a control. Every browser test that names circle.mark, circle.hit
      // or circle[data-mark] goes on finding exactly the marks (m30b A2).
      assert.equal(row.glyph.id, null, `${category}: a glyph names no record`);
      assert.equal(row.glyph.markAttr, null);
      assert.equal(row.glyph.tabindex, null);
      assert.equal(row.glyph.events, 'none', `${category}: the mark under it takes the click`);
      assert.match(row.glyph.classes, /\bglyph\b/);
      assert.doesNotMatch(row.glyph.classes, /\bmark\b/, 'a symbol is not a record');
    }

    // An event with no category keeps the plain circle it has today.
    assert.equal(seen.none.mark.tag, 'circle');
    assert.equal(seen.none.glyph, null, 'no category, no symbol');
    // A categorised event swallowed by a cluster carries none either: a count
    // is not a record, and a stack of four categories has no category.
    assert.equal(seen.clustered.mark, null, 'the treaty is inside a cluster at the world');
    assert.equal(seen.glyphs, 3, 'three categorised marks of their own, three symbols');

    // And the accessible name says what the symbol says, for a reader who
    // cannot see it.
    assert.match(seen.war.mark.label, / — War$/);
    assert.doesNotMatch(seen.none.mark.label, / — /);
  });
});

test('a click at the exact centre of a glyph selects the mark under it', { skip }, async () => {
  // A reader who has been here before: the introduction covers the view on a
  // first visit, and what is under test is which element the pointer finds.
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), READY);
    await settledShards(page);
    // The centre of the symbol in client coordinates, then whatever the
    // document says is at that point: if it is the `<use>`, the glyph has
    // taken a click that belongs to the mark.
    const hit = await page.eval(`
      const mark = document.querySelector('#map circle.mark[data-id="fixture-event-e"]');
      const box = mark.getBoundingClientRect();
      const x = Math.round(box.left + box.width / 2);
      const y = Math.round(box.top + box.height / 2);
      const el = document.elementFromPoint(x, y);
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
      return { tag: el.tagName, classes: el.getAttribute('class'), id: el.getAttribute('data-id') };`);
    assert.notEqual(hit.tag, 'use', 'the symbol is not what the pointer finds');
    assert.equal(hit.id, 'fixture-event-e');
    await waitFor(
      page,
      'return new URLSearchParams(location.search).get("selected") === "fixture-event-e";',
      'the mark under the symbol to be selected',
    );
  }, { device: WIDE });
});

test('walking the chain reddens a glyph with its mark', { skip }, async () => {
  await wide(async (page, url) => {
    // `fixture-event-e` is a war with a point of its own; `fixture-event-g` is
    // a disaster somewhere else, and stays plain.
    await open(page, url('?fixtures=1&selected=fixture-event-e'), READY);
    await settledShards(page);
    const drawn = await page.eval(`
      const mark = document.querySelector('#map circle.mark[data-id="fixture-event-e"]');
      const glyph = document.querySelector('#map use.glyph[href="#glyph-war"]');
      return {
        mark: mark.getAttribute('class'),
        glyph: glyph.getAttribute('class'),
        colour: getComputedStyle(glyph).color,
        plain: getComputedStyle(document.querySelector('#map use.glyph[href="#glyph-disaster"]')).color,
      };`);
    // The same classes but for the view's own word for a record — which is
    // exactly what ringClasses does for a parent's ring (parts.js).
    assert.match(drawn.mark, /\bselected\b/);
    assert.equal(drawn.glyph, drawn.mark.split(' ').filter((c) => c !== 'mark').join(' ').replace(/^/, 'glyph '));
    // And it is drawn in paper over the solid madder fill, where a mark that
    // is not emphasised carries a cobalt symbol on white.
    assert.notEqual(drawn.colour, drawn.plain, 'the symbol answers the fill of its own mark');
  });
});

test('a cluster has a badge and no glyph, and spreading it gives each member its own', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Zoomed all the way out the fixture marks in the Atlantic merge; a count
    // is not a record and a stack of three categories has no category.
    await open(page, url('?fixtures=1'), READY);
    await settledShards(page);
    const out = await page.eval(`return {
      clusters: document.querySelectorAll('#map circle.mark.cluster').length,
      onClusters: [...document.querySelectorAll('#map circle.mark.cluster')].some((c) => {
        const cx = Number(c.getAttribute('cx'));
        const cy = Number(c.getAttribute('cy'));
        return [...document.querySelectorAll('#map use.glyph')].some((g) => {
          const gx = Number(g.getAttribute('x')) + Number(g.getAttribute('width')) / 2;
          const gy = Number(g.getAttribute('y')) + Number(g.getAttribute('height')) / 2;
          return Math.abs(gx - cx) < 0.01 && Math.abs(gy - cy) < 0.01;
        });
      }),
    };`);
    if (out.clusters > 0) {
      assert.equal(out.onClusters, false, 'a count is not a record and takes no symbol');
    }
  }, { device: { width: 700, height: 520, deviceScaleFactor: 1 } });
});

// --- the category toggles, which are the legend -----------------------------
//
// §1's whole reason for moving `category` into the core: a toggle that hides
// marks has to hide them on the frame the reader clicks it. An attribute
// column arrives with its century, so the reader would see nothing happen and
// then, a moment later, marks disappear — the toggle lying about what it did.
// The assertion is therefore "no request went out in between", and it cannot
// be made anywhere but in a real browser.
test('turning a category off removes its marks on the same frame, and leaves the uncategorised drawn', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await settledShards(page);
    const before = await page.eval(`return {
      rows: document.querySelectorAll('.bar .layers .categories label').length,
      glyphs: document.querySelectorAll('#map use.glyph').length,
      marks: document.querySelectorAll('#map circle.mark[data-id]').length,
      war: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-e"]')),
      none: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-d"]')),
      requests: performance.getEntriesByType('resource').length,
    };`);
    assert.equal(before.rows, 3, 'one row per category in use, and no row for the other nine');
    assert.equal(before.war, true);
    assert.equal(before.none, true);

    // The click and the reading are one script: whatever the page did between
    // them, it did synchronously.
    const after = await page.eval(`
      const box = document.querySelector('.bar .layers input[data-category="war"]');
      box.checked = false;
      box.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        war: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-e"]')),
        disaster: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-c"]')),
        none: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-d"]')),
        glyphs: document.querySelectorAll('#map use.glyph').length,
        requests: performance.getEntriesByType('resource').length,
      };`);
    assert.equal(after.war, false, 'the war is gone on the frame the box was clicked');
    assert.equal(after.requests, before.requests, 'and nothing was fetched to do it');
    assert.equal(after.disaster, true, 'the other categories stay');
    assert.equal(after.none, true, 'and so do the events that have no category at all');
    assert.equal(after.glyphs, before.glyphs - 1);
    // What the reader did is in the link: the bare `events` is replaced by one
    // token per category still on (M30b, A11). The address bar is written on
    // the next animation frame, not in the click (state.js), which is the one
    // thing here that is not on the same frame — and it is not the picture.
    await waitFor(
      page,
      'return (new URLSearchParams(location.search).get("layers") ?? "").includes("events:");',
      'the layers to reach the link',
    );
    const layers = await page.eval('return new URLSearchParams(location.search).get("layers");');
    assert.match(layers, /events:disaster/);
    assert.match(layers, /events:treaty/);
    assert.doesNotMatch(layers, /events:war/);
  });
});

test('?layers=events:war opens on the wars, the uncategorised, and nothing else categorised', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1&layers=land,territories,events:war'), READY);
    await settledShards(page);
    const seen = await page.eval(`return {
      war: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-e"]')),
      treaty: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-a"]')),
      disaster: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-c"]')),
      none: Boolean(document.querySelector('#map circle.mark[data-id="fixture-event-d"]')),
      glyphs: document.querySelectorAll('#map use.glyph').length,
      boxes: [...document.querySelectorAll('.bar .layers input[data-category]')]
        .map((b) => [b.dataset.category, b.checked]),
      events: document.querySelector('.bar .layers input[data-layer="events"]').checked,
    };`);
    assert.equal(seen.war, true);
    assert.equal(seen.treaty, false, 'a category not named is off');
    assert.equal(seen.disaster, false);
    assert.equal(seen.none, true, 'and the events with no category are still drawn');
    assert.equal(seen.glyphs, 1, 'one categorised mark, one symbol');

    // The timeline narrows with it, from the same answer (emphasis.js) — on
    // the view it is drawn in since M60, and with the same link.
    await page.eval(TO_TIMELINE);
    await waitFor(page, LANES, 'the lanes');
    const lanes = await page.eval(`return {
      warBar: Boolean(document.querySelector('#timeline rect.bar[data-id="fixture-event-e"]')),
      treatyBar: Boolean(document.querySelector('#timeline rect.bar[data-id="fixture-event-a"]')),
    };`);
    assert.equal(lanes.warBar, true, 'the timeline draws the same answer');
    assert.equal(lanes.treatyBar, false);
    // The control says what the link says, and the events row is still on:
    // under A11 the bare token is gone while any `events:<id>` stands.
    assert.deepEqual(seen.boxes.sort(), [['disaster', false], ['treaty', false], ['war', true]]);
    assert.equal(seen.events, true);

    // And the link round-trips: turning the war back on writes the bare token
    // again, which is what "every category" is called.
    await page.eval(`
      for (const b of document.querySelectorAll('.bar .layers input[data-category]')) {
        if (!b.checked) { b.checked = true; b.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      return true;`);
    await waitFor(
      page,
      'return !(new URLSearchParams(location.search).get("layers") ?? "").includes("events:");',
      'the bare token to come back',
    );
    const back = await page.eval('return new URLSearchParams(location.search).get("layers");');
    assert.doesNotMatch(back ?? '', /events:/);
    assert.match(back ?? '', /\bevents\b/);
  });
});

// --- the base map ----------------------------------------------------------
//
// M37a. Six layers of Natural Earth under the territories and over the
// coastlines, appearing at the zooms the manifest names, fetched a cell at a
// time and never before the first picture. On the repository's own data and
// not the fixtures: the fixture base map is one cell of each layer, and what
// these are about is a real viewport over a real grid.

const BASE_ORDER = `
  const viewport = document.querySelector('#map .viewport');
  const classes = [...viewport.children].map((el) => el.getAttribute('class'));
  return {
    classes,
    land: classes.findIndex((c) => c.split(' ').includes('layer-land')),
    base: classes.findIndex((c) => c.split(' ').includes('layer-base')),
    presences: classes.findIndex((c) => c.split(' ').includes('layer-presences')),
    events: classes.findIndex((c) => c.split(' ').includes('layer-events')),
    groups: [...document.querySelectorAll('#map .layer-base > g')]
      .map((el) => el.getAttribute('class').replace('layer layer-base-', '')),
    pointerEvents: getComputedStyle(document.querySelector('#map .layer-base')).pointerEvents,
  };`;

// Every file of the base map the browser has actually asked for, split into
// the far level — one file for the whole world — and the cells.
const BASE_REQUESTS = `
  const names = performance.getEntriesByType('resource').map((e) => e.name)
    .filter((n) => n.includes('geo/base/'));
  const cell = /geo\\/base\\/([a-z]+)\\/(x\\dy\\d)\\.json/;
  return {
    world: names.filter((n) => /geo\\/base\\/[a-z]+-world\\.json/.test(n))
      .map((n) => n.replace(/^.*geo\\/base\\//, '')).sort(),
    cells: names.map((n) => cell.exec(n)).filter(Boolean).map((m) => m[1] + '/' + m[2]).sort(),
  };`;

const BASE_COUNTS = `
  const out = { total: 0, byLayer: {} };
  for (const g of document.querySelectorAll('#map .layer-base > g')) {
    const id = g.getAttribute('class').replace('layer layer-base-', '');
    out.byLayer[id] = g.children.length;
    out.total += g.children.length;
  }
  return out;`;

const K_NOW = `
  const t = document.querySelector('#map .viewport').getAttribute('transform') || '';
  const m = /scale\\(([-0-9.]+)\\)/.exec(t);
  return m ? Number(m[1]) : 1;`;

test('the base map is drawn under the territories and over the coastlines', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(''), 'return Boolean(document.querySelector("#map .layer-base > g"));');
    const seen = await page.eval(BASE_ORDER);
    assert.ok(seen.land >= 0 && seen.base >= 0 && seen.presences >= 0,
      `the three groups are there: ${seen.classes.join(' | ')}`);
    assert.ok(seen.land < seen.base, 'over the coastlines: a river inside the land is the point');
    assert.ok(seen.base < seen.presences, 'under the territories: a border is a claim, a river is the ground');
    assert.ok(seen.base < seen.events, 'and under the marks');
    // One group per layer of `manifest.base.layers`, in the manifest's order —
    // with the one exception M45a made: **the ground goes under the water.**
    // The physical regions have a tint since M45a and they are the only base
    // layer that fills open land, so drawn where the manifest names them, after
    // the lakes, a desert's wash would pass over the Nile.
    assert.deepEqual(seen.groups, ['physical', 'coast', 'rivers', 'lakes', 'mountains', 'cities']);
    // A river is not a control.
    assert.equal(seen.pointerEvents, 'none');
  });
});

test('at the whole world the base map fetches its far files and not one cell', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(''), 'return Boolean(document.querySelector("#map .layer-base > g"));');
    // The far files arrive a frame and a task after the first picture; wait
    // until something of the base map is actually drawn.
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base circle, #map .layer-base path").length > 0;',
      'the base map to be drawn');
    const asked = await page.eval(BASE_REQUESTS);
    assert.deepEqual(asked.cells, [], `a cell was fetched at the whole world: ${asked.cells.join(' · ')}`);
    // `coast` has no far file of its own — its far level is `land-present.json`,
    // which `land.js` has always drawn (M36a, deviation 601).
    assert.ok(!asked.world.some((n) => n.startsWith('coast')), 'and no far coastline of its own');
    assert.ok(asked.world.length > 0, `the far files are asked for: ${asked.world.join(' · ')}`);
    // And the coastline is still `land.js`'s: nothing near is in hand, so the
    // far stroke stays on.
    const near = await page.eval('return document.querySelector("#map .layer-land").classList.contains("near-coast");');
    assert.equal(near, false, 'the far coastline keeps its stroke until the near one covers the view');

    const drawn = await page.eval(BASE_COUNTS);
    assert.equal(drawn.byLayer.coast, 0, 'no near coastline at the world view');
    assert.ok(drawn.total > 0 && drawn.total < 600,
      `the world view is quiet: ${drawn.total} elements (${JSON.stringify(drawn.byLayer)})`);
  });
});

// The ceiling. At k = 8 over Portugal the DOM under `.layer-base` is the near
// cells of one viewport and the far features outside them that the zoom is
// worth — a few thousand elements, and nothing that grows with the corpus or
// with how long the reader has been panning. The number below is generous
// against what this measures today (about 2 500) and still an order of
// magnitude under "the whole base map", which is some 50 000 features.
const BASE_CEILING = 6000;

// The box that puts the map at k = 8 over Portugal: 45° of longitude in 960
// units and 25.32° of latitude in 540 (projection.js). East of −30°, which is
// the seam this picture is cut at — a box spanning it is two strips and
// `bboxTransform` answers it with the whole world, which is not a zoom.
const PORTUGAL_AT_8 = '?bbox=-28,25.34,17,50.66';

// Every layer but the territories, as a `?layers=` list: the base map on and
// nothing of the borders. `coast` is not in it because it is not a member of
// `LAYERS` at all and is always drawn (deviation 523).
const BASE_ON = 'land,events,rivers,lakes,physical,mountains,cities';

// And the same without the events, for a picture about the cities alone.
const CITIES_ON = 'land,rivers,lakes,physical,mountains,cities';

// Waits until the base map's files have stopped arriving: two readings of the
// page's own resource timeline the same, a beat apart, which is what
// `settledShards` does for the attribute shards. A test that asks "did the
// picture change for the reason I gave it?" has to start from a picture that
// was not still changing on its own — a cell that lands between two readings
// is thirty rivers more and no rebuild at all, and on a slow runner that is
// exactly what happens (this branch, run 641).
async function settledBase(page) {
  const count = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/geo/base/")).length;';
  let last = -1;
  for (let tries = 0; tries < 40; tries += 1) {
    const now = await page.eval(count);
    if (now > 0 && now === last) return;
    last = now;
    await new Promise((resolve) => { setTimeout(resolve, 100); });
  }
}

test('zoomed into Portugal the cells of the viewport are fetched and no others', { skip }, async () => {
  await wide(async (page, url) => {
    // What is being compared here is the cells fetched for a viewport against
    // the box that same viewport publishes. Nothing is panned, so nothing
    // needs the pane held still.
    await open(page, url(PORTUGAL_AT_8), 'return Boolean(document.querySelector("#map .layer-base > g"));');
    const k = await page.eval(K_NOW);
    assert.ok(k > 7.5 && k < 8.5, `the link opened at k = 8 (${k})`);

    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-coast path").length > 0;',
      'the near coastline');
    // Give the rest of the cells their moment: every one of them is a request
    // made in the same render as the first.
    await waitFor(page, `return (() => {
      const names = performance.getEntriesByType('resource').map((e) => e.name);
      return ['rivers', 'lakes', 'physical', 'mountains', 'cities']
        .every((id) => names.some((n) => n.includes('geo/base/' + id + '/')));
    })();`, 'a cell of every layer');

    const asked = await page.eval(BASE_REQUESTS);
    const keys = [...new Set(asked.cells.map((name) => name.split('/')[1]))];
    // x2y2 is the cell Lisbon is in; the viewport at this box reaches the two
    // rows and two columns around it and no further (grid.test.mjs).
    assert.ok(keys.includes('x2y2'), `the cell Portugal is in: ${keys.join(' ')}`);
    // The box in the link is what the reader asked to see; the box the layer
    // works from is the rectangle the pane really shows, which is wider —
    // letterboxing (projection.js). The map publishes that one as soon as the
    // layout settles, and a wheel of no depth moves nothing and makes sure it
    // has, so the two halves of this assertion are about the same rectangle.
    await page.eval(zoomIn(0));
    await waitFor(page, `return new URLSearchParams(location.search).get('bbox') !== ${
      JSON.stringify(PORTUGAL_AT_8.replace('?bbox=', ''))};`,
      'the box the pane really shows to be published');
    const published = parseBbox(new URLSearchParams(await page.eval('return location.search;')).get('bbox'));
    const allowed = new Set(cellsFor(published));
    for (const key of keys) assert.ok(allowed.has(key), `${key} is outside the viewport (${[...allowed].join(' ')})`);
    assert.ok(keys.length <= 6, `a handful of cells, not the grid: ${keys.join(' ')}`);

    const drawn = await page.eval(BASE_COUNTS);
    assert.ok(drawn.byLayer.coast > 0, 'the near coastline is drawn');
    assert.ok(drawn.total < BASE_CEILING,
      `the DOM under .layer-base stays bounded: ${drawn.total} elements (${JSON.stringify(drawn.byLayer)})`);
    // And the far coastline's stroke is off, because every cell of the view is
    // in hand and the near lines are the coastline now (A2).
    const near = await page.eval('return document.querySelector("#map .layer-land").classList.contains("near-coast");');
    assert.equal(near, true, 'the far coastline gives up its stroke');
  });
});

test('a pan does not rebuild the base map', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(PORTUGAL_AT_8),
      'return Boolean(document.querySelector("#map .layer-base-rivers path"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-rivers path").length > 0;', 'the rivers');
    // Every cell in hand first: a river that arrives during the pan is a river
    // that arrived, not a rebuild, and counting before the last one lands would
    // read the one as the other.
    await settledBase(page);
    await page.eval(`
      window.__first = document.querySelector('#map .layer-base-rivers path');
      window.__count = document.querySelector('#map .layer-base-rivers').children.length;
      return true;`);
    // A short pan: far enough to move the picture, not far enough to leave the
    // cells already in hand.
    await page.eval(panBy(-60));
    await waitFor(page, 'return new URLSearchParams(location.search).has("bbox");', 'the box to be published');
    const same = await page.eval(`
      const group = document.querySelector('#map .layer-base-rivers');
      return {
        count: group.children.length,
        was: window.__count,
        sameNode: group.firstElementChild === window.__first,
      };`);
    assert.equal(same.count, same.was, 'the same number of rivers');
    assert.equal(same.sameNode, true, 'and the very same first path node: nothing was rebuilt');
  });
});

test('a click on a river selects nothing and puts down what was held', { skip }, async () => {
  await wide(async (page, url) => {
    // A river is drawn over whatever ground it runs through, and it must never
    // take that ground's pointer: with the territories on, what the cursor
    // finds over a river is the territory, and clicking there still picks the
    // actor up. So the ground is taken away here — everything but the
    // territories — and then a click on a river is a click on the sea, which is
    // what puts down what the reader was holding (map.js). The base layers are
    // named one by one because a `?layers=` list is "these and nothing else",
    // and since M37b that sentence includes them (deviation 522).
    await open(page, url(`${PORTUGAL_AT_8}&layers=${BASE_ON}&selected=carnation-revolution-1974`),
      'return Boolean(document.querySelector("#map .layer-base > g"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-rivers path").length > 0;', 'the rivers');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'),
      'carnation-revolution-1974', 'something is held to begin with');

    // Nothing the base map draws carries an attribute any click handler reads:
    // `e.target.closest('[data-id], [data-cluster], [data-actor]')` must not
    // start matching a river, a lake or a city dot.
    const inert = await page.eval(`
      const nodes = [...document.querySelectorAll('#map .layer-base *')];
      return {
        count: nodes.length,
        marked: nodes.filter((el) => el.closest('[data-id], [data-cluster], [data-actor]')).length,
        focusable: nodes.filter((el) => el.hasAttribute('tabindex')).length,
        pointer: [...new Set(nodes.slice(0, 200).map((el) => getComputedStyle(el).pointerEvents))],
      };`);
    assert.ok(inert.count > 0, 'the base map is drawn');
    assert.equal(inert.marked, 0, 'no base feature is a control');
    assert.equal(inert.focusable, 0, 'and none is in the tab order');
    assert.deepEqual(inert.pointer, ['none'], 'and none takes a pointer');

    // A point that really is **on** a river — the middle of its own length,
    // not the middle of its bounding box.
    const at = await page.eval(`
      const pane = document.querySelector('#map svg.map').getBoundingClientRect();
      for (const path of document.querySelectorAll('#map .layer-base-rivers path')) {
        const length = path.getTotalLength();
        if (!length) continue;
        const ctm = path.getScreenCTM();
        if (!ctm) continue;
        const local = path.getPointAtLength(length / 2);
        const p = new DOMPoint(local.x, local.y).matrixTransform(ctm);
        if (p.x < pane.left + 4 || p.x > pane.right - 4 || p.y < pane.top + 4 || p.y > pane.bottom - 4) continue;
        const under = document.elementFromPoint(p.x, p.y);
        if (!under || under.closest('[data-id], [data-cluster], [data-actor]')) continue;
        return { x: p.x, y: p.y, under: under.getAttribute('class') || under.tagName };
      }
      return null;`);
    assert.ok(at, 'there is a river on screen with nothing of the marks over it');
    // What the cursor finds there is never the river itself.
    assert.ok(!String(at.under).includes('layer-base'), `the river takes no pointer (${at.under})`);

    await page.eval(`
      const opts = { bubbles: true, cancelable: true, clientX: ${at.x}, clientY: ${at.y} };
      const target = document.elementFromPoint(${at.x}, ${at.y});
      target.dispatchEvent(new PointerEvent('pointerdown', { ...opts, pointerId: 7 }));
      target.dispatchEvent(new PointerEvent('pointerup', { ...opts, pointerId: 7 }));
      target.dispatchEvent(new MouseEvent('click', opts));
      return true;`);
    await waitFor(page, 'return !new URLSearchParams(location.search).get("selected");',
      'the selection to be put down, exactly as a click on the sea puts it down');
  });
});

// --- the layer control, which is the legend ---------------------------------
//
// M37b. Two visible rows and two collapsed groups, and the five base layers
// inside the first of them. What a switch has to do is what the whole base map
// was built around: a layer that is off draws nothing **and asks for nothing**.

// Every group of the base map, with what it has drawn and whether its box is
// ticked. `coast` has no box at all — it is not a member of `LAYERS` and is
// always drawn (deviation 523).
const BASE_SWITCHES = `
  const control = document.querySelector('.bar .layers');
  const out = { rows: [], visible: [], summaries: [] };
  for (const el of control.children) {
    if (el.tagName === 'LABEL') out.visible.push(el.querySelector('input').dataset.layer);
    if (el.tagName === 'DETAILS') out.summaries.push(el.querySelector('summary').textContent.trim());
  }
  for (const g of document.querySelectorAll('#map .layer-base > g')) {
    const id = g.getAttribute('class').replace('layer layer-base-', '');
    const box = control.querySelector('input[data-layer="' + id + '"]');
    out.rows.push({ id, drawn: g.children.length, box: box ? box.checked : null });
  }
  return out;`;

const BASE_REQUEST_COUNT = `
  return performance.getEntriesByType('resource')
    .filter((e) => e.name.includes('geo/base/')).length;`;

test('turning rivers off empties its group and asks for nothing, and back on draws from cache', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(PORTUGAL_AT_8), 'return Boolean(document.querySelector("#map .layer-base-rivers path"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-rivers path").length > 0;', 'the rivers');
    // Every cell of every layer asked for, so that "no new request" below is
    // about the switch and not about a fetch that had not gone out yet.
    await waitFor(page, `return (() => {
      const names = performance.getEntriesByType('resource').map((e) => e.name);
      return ['rivers', 'lakes', 'physical', 'mountains', 'cities']
        .every((id) => names.some((n) => n.includes('geo/base/' + id + '/')));
    })();`, 'a cell of every layer');
    const before = await page.eval(BASE_REQUEST_COUNT);
    const drawn = await page.eval('return document.querySelector("#map .layer-base-rivers").children.length;');
    assert.ok(drawn > 0, `the rivers are drawn to begin with (${drawn})`);

    // Off: the box in the control, clicked as a reader clicks it.
    await page.eval('document.querySelector(\'.bar .layers input[data-layer="rivers"]\').click(); return true;');
    await waitFor(page, 'return document.querySelector("#map .layer-base-rivers").children.length === 0;',
      'the rivers to go');
    assert.equal(await page.eval(BASE_REQUEST_COUNT), before, 'an off layer asks for nothing');
    // And what the reader did is in the link, as everything else is.
    const layers = await page.eval('return new URLSearchParams(location.search).get("layers");');
    assert.ok(layers && !layers.split(',').includes('rivers'), `the link says so: ${layers}`);
    assert.ok(layers.split(',').includes('lakes'), 'and the other four are still on');

    // Nothing else moved: the four other base layers are where they were.
    const others = await page.eval(BASE_COUNTS);
    assert.ok(others.byLayer.lakes > 0 && others.byLayer.coast > 0,
      `the rest of the base map is untouched: ${JSON.stringify(others.byLayer)}`);

    // On again, and out of what is already in hand: not one more request.
    await page.eval('document.querySelector(\'.bar .layers input[data-layer="rivers"]\').click(); return true;');
    await waitFor(page, 'return document.querySelector("#map .layer-base-rivers").children.length > 0;',
      'the rivers to come back');
    assert.equal(await page.eval(BASE_REQUEST_COUNT), before, 'and they are drawn from cache');
    assert.equal(await page.eval('return document.querySelector("#map .layer-base-rivers").children.length;'), drawn,
      'the same picture as before it was switched off');
    // Everything on again is the default, and the default writes no link.
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("layers");'), null,
      'back to the default, and the link says nothing');
  });
});

// M45a. What the styling is actually for, over the repository's own data and
// not over a fixture: at Iberia the ground is drawn in more than one family,
// the peaks are drawn at more than one size, and neither of them is painted
// over the borders — the whole argument the owner made is that relief is what
// a frontier moved *around*, so it has to be underneath it.
test('the ground is drawn in its families, the peaks at their heights, and both under the borders', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(PORTUGAL_AT_8), 'return Boolean(document.querySelector("#map .layer-base-physical path"));');
    await settledBase(page);
    const seen = await page.eval(`
      const ground = [...document.querySelectorAll('#map .layer-base-physical path')];
      const peaks = [...document.querySelectorAll('#map .layer-base-mountains circle')];
      const groups = [...document.querySelectorAll('#map .layer-base > g')]
        .map((el) => el.getAttribute('class').replace('layer layer-base-', ''));
      return {
        drawn: ground.length,
        families: [...new Set(ground.map((el) => el.getAttribute('class')))].sort(),
        radii: [...new Set(peaks.map((el) => el.getAttribute('r')))].sort(),
        // What the relief family is actually painted with, read off the
        // stylesheet as the browser resolved it.
        relief: (() => {
          const el = ground.find((p) => p.getAttribute('class') === 'ground-relief');
          if (!el) return null;
          const style = getComputedStyle(el);
          return { fill: style.fill, fillOpacity: style.fillOpacity, dash: style.strokeDasharray };
        })(),
        physicalAt: groups.indexOf('physical'),
        riversAt: groups.indexOf('rivers'),
        lakesAt: groups.indexOf('lakes'),
      };`);
    assert.ok(seen.drawn > 0, `the physical layer is drawn (${seen.drawn})`);
    // More than one family on the screen is the whole of M45a's §1.1: before
    // it, all seventeen classes were the same dashed hairline.
    assert.ok(seen.families.length > 1,
      `Iberia shows more than one family of ground: ${JSON.stringify(seen.families)}`);
    assert.ok(seen.families.includes('ground-relief'),
      `the Iberian ranges are relief: ${JSON.stringify(seen.families)}`);
    // Every class on the map is one of the three the stylesheet draws, or
    // none at all — `data/` is untrusted input and this is a class attribute.
    for (const family of seen.families) {
      assert.ok(family === null || ['ground-relief', 'ground-cover', 'ground-hollow'].includes(family),
        `${family} is a family the stylesheet has`);
    }
    // A tint and not a wash: the territories are drawn at 0.62 of a hue and
    // the loudest ground on the map is under half that.
    assert.ok(Number(seen.relief.fillOpacity) > 0 && Number(seen.relief.fillOpacity) <= 0.5,
      `relief is a tint, not a wash: ${seen.relief.fillOpacity}`);
    assert.ok(seen.relief.dash === 'none' || seen.relief.dash === '',
      `a ridge has an edge: ${seen.relief.dash}`);
    // §1.2: a peak of 8,848 m and a hill of 400 m stopped being the same dot.
    assert.ok(seen.radii.length > 1, `the peaks are drawn at more than one size: ${JSON.stringify(seen.radii)}`);
    // And the ground is under the water, which is what the tint made necessary.
    assert.ok(seen.physicalAt < seen.riversAt && seen.physicalAt < seen.lakesAt,
      `the ground is painted before the rivers and the lakes: ${seen.physicalAt} / ${seen.riversAt} / ${seen.lakesAt}`);
  });
});

test('?layers=territories,events opens with the base map off and its boxes unticked', { skip }, async () => {
  await wide(async (page, url) => {
    // A link written before the base map existed. It says "these and nothing
    // else" and is read that way (deviation 522).
    await open(page, url(`${PORTUGAL_AT_8}&layers=territories,events`),
      'return Boolean(document.querySelector("#map .layer-base > g"));');
    // The near coastline is the one thing that still arrives, because it is not
    // a switch at all — so waiting for it is waiting for the base map to have
    // had its chance to fetch.
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-coast path").length > 0;',
      'the near coastline, which no link turns off');

    const seen = await page.eval(BASE_SWITCHES);
    assert.deepEqual(seen.visible, ['territories', 'events'], 'two visible rows');
    assert.deepEqual(seen.summaries, ['base map', 'events by category'], 'and two collapsed groups');
    const byId = Object.fromEntries(seen.rows.map((r) => [r.id, r]));
    assert.equal(byId.coast.box, null, 'the coastlines have no box: they are the ground (decision 14)');
    assert.ok(byId.coast.drawn > 0, 'and they are drawn whatever the link says');
    // The brief's "the boxes unchecked": five of them, one per member of
    // `LAYERS` the base map has, and every one of them empty and unticked.
    const switched = ['rivers', 'lakes', 'physical', 'mountains', 'cities'];
    assert.deepEqual(switched.map((id) => byId[id].box), [false, false, false, false, false]);
    assert.deepEqual(switched.map((id) => byId[id].drawn), [0, 0, 0, 0, 0]);

    // And an off layer costs nothing at all: not a far file, not a cell.
    const asked = await page.eval(BASE_REQUESTS);
    assert.deepEqual(asked.world, [], `no far file was fetched: ${asked.world.join(' · ')}`);
    assert.deepEqual(asked.cells.filter((n) => !n.startsWith('coast/')), [],
      `no cell of a switched-off layer: ${asked.cells.join(' · ')}`);

    // The two rows that are on are on.
    const on = await page.eval(`return {
      territories: document.querySelector('.bar .layers input[data-layer="territories"]').checked,
      events: document.querySelector('.bar .layers input[data-layer="events"]').checked,
    };`);
    assert.deepEqual(on, { territories: true, events: true });
  });
});

// --- M38a: the names ------------------------------------------------------
//
// Every label the map draws is in one group, placed by one placer
// (src/map/labels.js). What can be asserted without a browser is asserted in
// tests/labels.test.mjs; these are the four things that need a real layout —
// what is in the DOM at a zoom, what a `<title>` says, what a halo measures,
// and what a click at a label's centre reaches.

// Every label on screen, with its class, its text, its title, and the box it
// really occupies. Read off the one group, because if a label were ever drawn
// anywhere else this would be the test that stops saying anything.
const LABELS = `
  const out = [];
  for (const el of document.querySelectorAll('#map .layer-labels text')) {
    const box = el.getBoundingClientRect();
    out.push({
      cls: el.getAttribute('class'),
      // The first child alone: textContent would carry the title element's
      // copy of the name along with the name on the face.
      text: el.firstChild ? el.firstChild.nodeValue : '',
      title: el.querySelector('title')?.textContent ?? null,
      halo: Number(el.getAttribute('stroke-width')),
      size: Number(el.getAttribute('font-size')),
      x: box.left, y: box.top, w: box.width, h: box.height,
      cx: box.left + box.width / 2, cy: box.top + box.height / 2,
    });
  }
  return out;`;

test('at the whole world the map writes no name at all', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`?layers=${BASE_ON}`), READY);
    // Wait for the far files, so this is "the cities are here and unlabelled"
    // and not "the cities have not arrived".
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-cities circle").length > 0;',
      'the cities of the far level');
    const k = await page.eval(K_NOW);
    assert.ok(k < 2, `the world view (k = ${k})`);
    const labels = await page.eval(LABELS);
    assert.deepEqual(labels, [], `no name at the world: ${labels.map((l) => l.text).join(' · ')}`);
    // Natural Earth would write seventeen of them here — it ranks Tokyo and
    // New York for the world view — and this map writes none until k = 4.
    const cities = await page.eval('return document.querySelectorAll("#map .layer-base-cities circle").length;');
    assert.ok(cities > 10, `the dots are there all the same: ${cities}`);
  });
});

test('zoomed to Portugal, Lisbon is named once and its title carries its names', { skip }, async () => {
  await wide(async (page, url) => {
    // The events off, so this is about the cities: at Lisbon the events of
    // this atlas stand on the very point the city does, and the test below is
    // about which of the two gets the box.
    await open(page, url(`${PORTUGAL_AT_8}&layers=${CITIES_ON}`),
      'return Boolean(document.querySelector("#map .layer-base > g"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-labels .city-label").length > 0;',
      'the city labels');
    const labels = await page.eval(LABELS);
    const lisbon = labels.filter((l) => l.text === 'Lisbon');
    assert.equal(lisbon.length, 1, `Lisbon is named once: ${labels.map((l) => l.text).join(' · ')}`);
    assert.equal(lisbon[0].cls, 'city-label');
    // The face carries one name and the title carries them all. Natural Earth
    // gives this city no NAME_EN that differs from its NAME, so today the two
    // are the same string; M38b adds the dated names the place record holds.
    assert.equal(lisbon[0].title, 'Lisbon');
    // No two labels overlap, whatever kind they are: everything that did not
    // fit was skipped and nothing was nudged out of the way.
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i];
        const b = labels[j];
        const hit = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        assert.ok(!hit, `"${a.text}" and "${b.text}" overlap`);
      }
    }
    // And with the events off, no event is named: what is on the map is the
    // cities and the ground M38b put under them (`physical` and `mountains`
    // are in `CITIES_ON`). The assertion used to be that *every* label was a
    // city's, which held only because the pane was short enough that no
    // feature label had room; since M60 the map has the whole layout's height
    // and one does. What it is about — a name written for something the zoom
    // has not drawn — is the class it must not be.
    assert.equal(labels.some((l) => l.cls === 'mark-label'), false,
      `the events are off, so none of their names is written: ${labels.map((l) => `${l.text} (${l.cls})`).join(' · ')}`);
    assert.equal(labels.every((l) => l.cls === 'city-label' || l.cls === 'feature-label'), true,
      `the names are the cities' and the ground's: ${[...new Set(labels.map((l) => l.cls))].join(' ')}`);
  });
});

test('where an event and a city want the same box, the event has it', { skip }, async () => {
  await wide(async (page, url) => {
    // Thirty-seven of this atlas's events stand on Lisbon's own point, so the
    // two labels are the same box twice. With the events on, the event's is
    // the one drawn and the city's is skipped — never moved aside, because a
    // label that drifted would end up naming its neighbour.
    await open(page, url(`${PORTUGAL_AT_8}&layers=${BASE_ON}`),
      'return Boolean(document.querySelector("#map .layer-labels text"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-labels .city-label").length > 0;',
      'the city labels');
    const withEvents = await page.eval(LABELS);
    const kinds = new Set(withEvents.map((l) => l.cls));
    assert.ok(kinds.has('mark-label') && kinds.has('city-label'),
      `both kinds are on this picture: ${[...kinds].join(' ')}`);
    assert.equal(withEvents.some((l) => l.cls === 'city-label' && l.text === 'Lisbon'), false,
      'the city under the events is not named twice over them');
    // The proof that it was the competition and not the zoom: switch the
    // events off at the same box and the city has its name back.
    await open(page, url(`${PORTUGAL_AT_8}&layers=${CITIES_ON}`),
      'return Boolean(document.querySelector("#map .layer-labels .city-label"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-labels .city-label").length > 0;',
      'the city labels again');
    const without = await page.eval(LABELS);
    assert.equal(without.some((l) => l.cls === 'city-label' && l.text === 'Lisbon'), true,
      `with the events off, Lisbon is named: ${without.map((l) => l.text).join(' · ')}`);
    // An event's label is still `.mark-label`, found by the selector every
    // test written before this one uses; what changed is the group it hangs in
    // (deviation 527).
    assert.ok(withEvents.some((l) => l.cls === 'mark-label'), 'the events keep their class');
  });
});

test('a label is the same size on screen at every zoom, and its halo does not grow', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`${PORTUGAL_AT_8}&layers=${BASE_ON}`),
      'return Boolean(document.querySelector("#map .layer-labels text"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-labels text").length > 0;', 'the labels');
    const k = await page.eval(K_NOW);
    const at8 = await page.eval(LABELS);
    // The halo and the type size are written per label and divided by k, so
    // that both are the same number of screen pixels at every zoom. At k = 8
    // the attribute is an eighth of the 2 and the 11 it would be at k = 1 —
    // which is the whole reason they are attributes and not CSS.
    assert.ok(k > 7.5 && k < 8.5, `k = ${k}`);
    assert.ok(Math.abs(at8[0].halo - 2 / k) < 1e-6, `the halo at k = ${k} is ${at8[0].halo}`);
    assert.ok(Math.abs(at8[0].size - 11 / k) < 1e-6, `the size at k = ${k} is ${at8[0].size}`);
    // On screen, therefore, they measure the same at k = 8 as at k = 4: the
    // picture is scaled by k and the attributes are divided by it.
    const heights = at8.map((l) => l.h);
    await page.eval(zoomIn(400));
    await waitFor(page, `return ${JSON.stringify(k)} > (window.__k || 0) || true;`, 'the zoom to settle');
    const after = await page.eval(LABELS);
    const k2 = await page.eval(K_NOW);
    assert.ok(k2 < k, `the wheel zoomed out (${k} → ${k2})`);
    if (after.length > 0) {
      assert.ok(Math.abs(after[0].halo - 2 / k2) < 1e-6, `the halo follows the zoom (${after[0].halo} at k = ${k2})`);
      assert.ok(Math.abs(after[0].h - heights[0]) < 2,
        `and a label is the same height on screen: ${heights[0]} then ${after[0].h}`);
    }
  });
});

test('a click at a label\'s centre reaches the mark under it, and no label is in the tab order', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`${PORTUGAL_AT_8}&layers=${BASE_ON}`),
      'return Boolean(document.querySelector("#map .layer-labels text"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-labels .city-label").length > 0;',
      'the city labels');
    // No label is a control: no id to select by, nothing focusable, and the
    // whole group is transparent to the pointer.
    const shape = await page.eval(`
      const group = document.querySelector('#map .layer-labels');
      const labels = [...group.querySelectorAll('text')];
      return {
        pointerEvents: getComputedStyle(group).pointerEvents,
        withId: labels.filter((el) => el.hasAttribute('data-id') || el.hasAttribute('data-cluster')).length,
        focusable: labels.filter((el) => el.hasAttribute('tabindex')).length,
      };`);
    assert.equal(shape.pointerEvents, 'none');
    assert.equal(shape.withId, 0, 'no label carries an id');
    assert.equal(shape.focusable, 0, 'and none of them is in the tab order');

    // A click at the centre of a city's label lands on whatever is under it,
    // which over open ground is nothing: it selects nothing and it puts down
    // nothing that was not already down.
    const city = (await page.eval(LABELS)).find((l) => l.cls === 'city-label');
    assert.ok(city, 'a city label to aim at');
    const under = await page.eval(`
      const el = document.elementFromPoint(${city.cx}, ${city.cy});
      return { tag: el ? el.tagName : null, cls: el ? String(el.getAttribute('class') || '') : null };`);
    assert.ok(!String(under.cls).includes('label'), `the label takes no pointer (${under.tag} ${under.cls})`);

    // And an event's label over its own mark: the click reaches the mark and
    // opens the record, which is the thing a label must never get in the way
    // of. The mark is the one the label was placed beside, so aim at its own
    // centre — the label sits to the right of the hit circle and the pointer
    // has to pass through the label's box to get there at all.
    const opened = await page.eval(`
      const label = [...document.querySelectorAll('#map .layer-labels .mark-label')][0];
      if (!label) return null;
      const box = label.getBoundingClientRect();
      const el = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return el ? String(el.getAttribute('class') || el.tagName) : 'nothing';`);
    assert.ok(opened === null || !String(opened).includes('label'),
      `an event's label takes no pointer either (${opened})`);
  });
});

// M38b: the names of the ground, and the places this atlas names itself.

test('the rivers, the lakes, the regions and the peaks are named under the cities', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`${PORTUGAL_AT_8}&layers=${BASE_ON}`),
      'return Boolean(document.querySelector("#map .layer-labels text"));');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-labels .feature-label").length > 0;',
      'the physical features to be named');
    const labels = await page.eval(LABELS);
    const features = labels.filter((l) => l.cls === 'feature-label');
    const cities = labels.filter((l) => l.cls === 'city-label');
    // The limits are per priority, so neither kind can spend the other's: at
    // most eight names of the ground and at most twenty-four cities.
    assert.ok(features.length > 0 && features.length <= 8, `${features.length} feature labels`);
    assert.ok(cities.length > 0 && cities.length <= 24, `${cities.length} city labels`);

    // A physical feature is told from a city by its letterspacing and by
    // nothing else: the same size, the same soft ink. Nothing about a label's
    // size is in the stylesheet, so both of those are still attributes.
    const look = await page.eval(`
      const el = document.querySelector('#map .layer-labels .feature-label');
      const city = document.querySelector('#map .layer-labels .city-label');
      const cs = getComputedStyle(el);
      return {
        tracking: cs.letterSpacing,
        cityTracking: getComputedStyle(city).letterSpacing,
        fill: cs.fill,
        cityFill: getComputedStyle(city).fill,
        size: el.getAttribute('font-size'),
        citySize: city.getAttribute('font-size'),
        cssSize: cs.fontSize,
      };`);
    assert.notEqual(look.tracking, look.cityTracking, `the spacing is the difference (${look.tracking})`);
    assert.equal(look.fill, look.cityFill, 'and the ink is the same soft ink');
    assert.equal(look.size, look.citySize, 'and so is the size, which is one size for all three');

    // No two names overlap, whatever kind they are — the spaced ones included,
    // which is what the wider box estimate is for.
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i];
        const b = labels[j];
        const hit = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        assert.ok(!hit, `"${a.text}" and "${b.text}" overlap`);
      }
    }
    // And a river cut into segments is one river: no name of the ground is
    // written twice on one screen.
    const said = features.map((l) => l.text);
    assert.equal(new Set(said).size, said.length, `each named once: ${said.join(' · ')}`);

    // Nothing of this is a control either.
    const loose = await page.eval(`
      return [...document.querySelectorAll('#map .layer-labels .feature-label')]
        .filter((el) => el.hasAttribute('data-id') || el.hasAttribute('tabindex')).length;`);
    assert.equal(loose, 0);
  });
});

test('a place this atlas names and Natural Earth has no city for is on the map, from the record', { skip }, async () => {
  await wide(async (page, url) => {
    // Thirteen of the twenty-six place records have no Natural Earth city, and
    // that is the normal case: a parish, a district, a battlefield. They are
    // labelled from the record's own point and its own name, beside the cities
    // (docs/naturalearth-places.md).
    await open(page, url(`${PORTUGAL_AT_8}&layers=${CITIES_ON}`),
      'return Boolean(document.querySelector("#map .layer-labels .city-label"));');
    // The cities' own file first: until it lands the map holds no city at all,
    // and a record whose city is in it would be named from the record for a
    // frame. What is asserted below is the settled picture.
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-cities circle").length > 100;',
      'the cities of the near level');
    const said = new Set((await page.eval(LABELS)).map((l) => l.text));
    const ours = ['Alvor, Algarve', 'Belém, Lisbon', 'Central Portugal', 'Lajes, Terceira',
      'Pedrógão Grande', 'Parque das Nações, Lisbon', 'Flanders, near Laventie'];
    assert.ok(ours.some((name) => said.has(name)),
      `one of this atlas's own places is named: ${[...said].join(' · ')}`);

    // And a record that *has* a city is left to the city, whether or not the
    // dot is drawn yet: Braga's city is in the file the map holds and its `z`
    // keeps the dot off the screen at this zoom, so the map says nothing
    // rather than saying it twice over the zoom that brings the dot in.
    assert.equal(said.has('Braga'), false, 'a matched record is the city\'s to name');
  });
});

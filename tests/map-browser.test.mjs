// The map's arithmetic in a real browser, where the SVG is really
// letterboxed. None of this can be checked without a layout: the whole
// defect is that the element's box and its viewBox have different shapes,
// and in a test with no CSS they have the same one.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

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

// The pane the map is drawn in must not change size while a pan is being
// measured, or the picture moves for two reasons at once. A reader who has
// dragged the timeline's edge has said exactly this (panes.js).
const FREEZE_TIMELINE = `
  const layout = document.querySelector('.layout');
  layout.style.setProperty('--timeline-height', '160px');
  return true;`;

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
    await page.eval(FREEZE_TIMELINE);

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
    const bars = await page.eval(`return [...document.querySelectorAll('#timeline rect.bar[data-id]')]
      .map((el) => el.getAttribute('data-id'));`);
    const missing = marks.map((m) => m.id).filter((id) => !bars.includes(id));
    assert.deepEqual(missing, [], 'every mark on screen has a bar under it');
  });
});

test('a click on a mark out in the letterbox selects it, and a pan follows the cursor', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    await page.eval(FREEZE_TIMELINE);
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

const TIMELINE = `return {
  search: location.search,
  filtered: !document.querySelector('.timeline-note').hidden,
  note: document.querySelector('.timeline-note span').textContent,
  bars: [...document.querySelectorAll('#timeline rect.bar[data-id]')]
    .map((el) => el.getAttribute('data-id')).sort(),
};`;

// The eleven active fixture events. Ten of them have a place; fixture-event-f
// is the long process with none, in fixture-lane-3, whose polygon covers
// 10 … 40 east.
const ACTIVE = [
  'fixture-event-a', 'fixture-event-a2', 'fixture-event-b', 'fixture-event-c',
  'fixture-event-d', 'fixture-event-e', 'fixture-event-f', 'fixture-event-g',
  'fixture-event-h', 'fixture-event-o', 'fixture-event-t',
];

test('the whole world is no box at all, and the lanes carry every active event', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1&bbox=-180,-90,180,90'), READY);
    const shown = await page.eval(TIMELINE);
    assert.equal(shown.search, '?fixtures=1', 'the world box does not survive being read');
    assert.equal(shown.filtered, false, 'so the lanes are not filtered and the pin is not offered');
    assert.deepEqual(shown.bars, ACTIVE);
  });
});

test('an event with no place is in view when its region\'s box is', { skip }, async () => {
  await wide(async (page, url) => {
    // A box inside fixture-lane-3, which is where the placeless event is.
    await open(page, url('?fixtures=1&bbox=15,0,35,40'), READY);
    let shown = await page.eval(TIMELINE);
    assert.equal(shown.filtered, true);
    assert.equal(shown.note, '3 of 11 events in view');
    assert.ok(shown.bars.includes('fixture-event-f'), 'the placeless process is in the lanes');

    // And a box in fixture-lane-1, which is not.
    await open(page, url('?fixtures=1&bbox=-40,20,-10,50'), READY);
    shown = await page.eval(TIMELINE);
    assert.equal(shown.note, '5 of 11 events in view');
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
    // Not READY: no fixture mark is in the Pacific, so there is no mark to
    // wait for — which is the point. The note under the lanes is the signal.
    const COUNTED = 'return (document.querySelector(".timeline-note span")?.textContent ?? "").includes("in view");';
    await open(page, url('?fixtures=1&bbox=170,-20,-170,0'), COUNTED);
    const shown = await page.eval(TIMELINE);
    assert.match(shown.search, /bbox=170,-20,-170,0/, 'the box survives being read and written again');
    assert.equal(shown.filtered, true);
    assert.equal(shown.note, '0 of 11 events in view');
    assert.deepEqual(shown.bars, []);

    // And the same strip the other way round really is the rest of the world.
    await open(page, url('?fixtures=1&bbox=-170,-20,170,0'), READY);
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

    // And on again from the timeline, which followed the map's old rule.
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
    // all: the chain is one argument and this is not part of it.
    await page.eval(clickOn('#map circle.mark[data-id="fixture-event-g"]'));
    await waitFor(page, 'return new URLSearchParams(location.search).get("selected") === "fixture-event-g";', 'a fresh start');
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
    await page.eval(FREEZE_TIMELINE);

    const before = await page.eval(MARKS_AND_BOX);
    assert.equal(before.k, 1, 'the map opens at k = 1');
    assert.ok(before.marks.length >= 8, `the whole world is drawn to begin with (${before.marks.length})`);

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
    await page.eval(FREEZE_TIMELINE);
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
    await page.eval(FREEZE_TIMELINE);

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
    await page.eval(FREEZE_TIMELINE);
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
    assert.ok(wash.mark, 'an event inside a large one is still a mark of its own');
  });
});

// The coastline switch is gone and the coastlines are not (plan decision 14,
// M30b A11/A12). The control is generated, so what is asserted here is the
// generated thing: two switches, neither of them `land`, and a link that
// names no `land` still drawing it.
test('the coastlines have no switch and are always drawn', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?fixtures=1'), READY);
    const control = await page.eval(`
      const boxes = [...document.querySelectorAll('.bar .layers input[data-layer]')];
      return {
        ids: boxes.map((b) => b.dataset.layer),
        labels: boxes.map((b) => b.closest('label').textContent.trim()),
        land: document.querySelector('#map .layer-land').getBoundingClientRect().width > 0,
      };`);
    assert.deepEqual(control.ids, ['territories', 'events'], 'no coastline switch');
    assert.deepEqual(control.labels, ['territories', 'events']);
    assert.ok(control.land, 'the coastlines are drawn');

    // A link that turned them off before this milestone still parses, still
    // turns the territories off, and now draws the coastlines anyway.
    await open(page, url('?fixtures=1&layers=events'), READY);
    const after = await page.eval(`return {
      land: getComputedStyle(document.querySelector('#map .layer-land')).display,
      territories: getComputedStyle(document.querySelector('#map .layer-presences')).display,
      checked: [...document.querySelectorAll('.bar .layers input[data-layer]')].map((b) => b.checked),
    };`);
    assert.notEqual(after.land, 'none', 'the coastlines survive an old link that dropped them');
    assert.equal(after.territories, 'none', 'and the rest of the link is obeyed');
    assert.deepEqual(after.checked, [false, true]);
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

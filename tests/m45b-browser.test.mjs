// M45b in a real browser: what the bands cost, when they are asked for, and
// what they are drawn as.
//
// The brief's tests 4 and 5 (§ Tests). They are the promise M37a made for the
// other six layers, made again for the one layer that is off until a reader
// asks for it: at the whole world the far file and not one cell; zoomed in,
// the cells of the viewport and no others; and with a `?layers=` list that
// does not name it, nothing at all, at any zoom.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';
import { cellsFor } from '../src/map/grid.js';
import { parseBbox } from '../src/state.js';
import { LAYERS } from '../src/state.js';

const WIDE = { width: 1400, height: 620, deviceScaleFactor: 1 };
const wide = (fn) => withBrowser(fn, { device: WIDE });

// Every layer there is, named one by one: a `?layers=` list means "these and
// nothing else", and the bands are the one member the default leaves out.
const WITH_RELIEF = LAYERS.join(',');
// And the default, written out, which is the same list without `relief`.
const WITHOUT_RELIEF = LAYERS.filter((id) => id !== 'relief').join(',');

// The box that puts the map at k = 8 over Portugal, from map-browser.test.mjs:
// 45° of longitude in 960 units, east of the seam this picture is cut at.
const PORTUGAL_AT_8 = 'bbox=-28,25.34,17,50.66';

const DRAWN = 'return Boolean(document.querySelector("#map .layer-base > g"));';

// Every relief file the page has asked for, as the far one and the cells.
const RELIEF_REQUESTS = `
  const names = performance.getEntriesByType('resource').map((e) => e.name);
  return {
    world: names.filter((n) => n.includes('geo/base/relief-world.json')).length,
    cells: names.map((n) => /geo\\/base\\/relief\\/(x\\dy\\d)\\.json/.exec(n))
      .filter(Boolean).map((m) => m[1]).sort(),
  };`;

// Waits until the base map's files have stopped arriving, the way
// map-browser.test.mjs does: a cell that lands between two readings is a
// picture that was still changing on its own.
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

test('with the bands on, the whole world fetches the far file and not one cell', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`?layers=${WITH_RELIEF}`), DRAWN);
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-relief path").length > 0;',
      'the bands to be drawn');
    const asked = await page.eval(RELIEF_REQUESTS);
    assert.equal(asked.world, 1, 'the far file, once');
    assert.deepEqual(asked.cells, [], `a cell was fetched at the whole world: ${asked.cells.join(' · ')}`);
    // Five bands, five paths, and the class is what says which is which: the
    // tint is in the stylesheet and the index is in the data.
    const bands = await page.eval(`
      return [...document.querySelectorAll('#map .layer-base-relief path')]
        .map((p) => p.getAttribute('class')).sort();`);
    assert.deepEqual(bands, ['band-0', 'band-1', 'band-2', 'band-3', 'band-4']);
    // Fill and no stroke: a band cut at a cell border must never draw a line
    // along that border.
    const drawn = await page.eval(`
      const path = document.querySelector('#map .layer-base-relief path');
      const style = getComputedStyle(path);
      return { stroke: style.stroke, fill: style.fill, rule: path.getAttribute('fill-rule') };`);
    assert.equal(drawn.stroke, 'none');
    assert.notEqual(drawn.fill, 'none');
    assert.equal(drawn.rule, 'evenodd', 'the ground above a band is a hole in it');
  });
});

test('zoomed into Portugal the bands fetch the cells of the viewport and no others', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`?${PORTUGAL_AT_8}&layers=${WITH_RELIEF}`), DRAWN);
    await waitFor(page, `return performance.getEntriesByType('resource')
      .some((e) => /geo\\/base\\/relief\\/x\\dy\\d\\.json/.test(e.name));`, 'a cell of the bands');
    await settledBase(page);
    // The box the pane really shows, which is wider than the one in the link:
    // the SVG is letterboxed (projection.js), and the map publishes the real
    // rectangle once the layout settles.
    const published = parseBbox(new URLSearchParams(await page.eval('return location.search;')).get('bbox'));
    const allowed = new Set(cellsFor(published));
    const asked = await page.eval(RELIEF_REQUESTS);
    assert.ok(asked.cells.length > 0, 'the viewport is in cells that have bands in them');
    for (const key of asked.cells) {
      assert.ok(allowed.has(key), `${key} is not a cell of the viewport: ${[...allowed].join(' ')}`);
    }
    assert.ok(asked.cells.includes('x2y2'), `the cell Portugal is in: ${asked.cells.join(' ')}`);
  });
});

test('a ?layers= list that does not name the bands fetches none of them, at any zoom', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url(`?layers=${WITHOUT_RELIEF}`), DRAWN);
    await settledBase(page);
    let asked = await page.eval(RELIEF_REQUESTS);
    assert.equal(asked.world, 0, 'not the far file at the world view');
    assert.deepEqual(asked.cells, []);
    // And zoomed in, where every other layer is asking for its cells.
    await open(page, url(`?${PORTUGAL_AT_8}&layers=${WITHOUT_RELIEF}`), DRAWN);
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-coast path").length > 0;',
      'the near coastline');
    await settledBase(page);
    asked = await page.eval(RELIEF_REQUESTS);
    assert.equal(asked.world, 0, 'nor at k = 8');
    assert.deepEqual(asked.cells, [], `a cell of a layer nobody asked for: ${asked.cells.join(' · ')}`);
    // Which is what the default is, so a first visit costs nothing at all.
    const group = await page.eval('return document.querySelector("#map .layer-base-relief").children.length;');
    assert.equal(group, 0, 'the group is there and empty: a layer that is off draws nothing');
  });
});

// A real click on a mark: pointer down, pointer up, click, at the middle of
// its box, as map-browser.test.mjs does. The handlers under test are pointer
// handlers and a bare `click` is not what a reader sends.
const clickOn = (selector) => `
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('nothing at ' + ${JSON.stringify(selector)});
  const b = el.getBoundingClientRect();
  const at = { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...at, pointerId: 3 }));
  el.dispatchEvent(new PointerEvent('pointerup', { ...at, pointerId: 3 }));
  el.dispatchEvent(new MouseEvent('click', at));
  return true;`;

test('the bands are ground and not a lens: choosing an event does not hide them', { skip }, async () => {
  await wide(async (page, url) => {
    // The intro card sits over the view on a first visit, and a click meant
    // for a mark would land on it.
    await seenIntro(page);
    await open(page, url(`?layers=${WITH_RELIEF}`), DRAWN);
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-relief path").length > 0;', 'the bands');
    const before = await page.eval('return document.querySelectorAll("#map .layer-base-relief path").length;');
    // M65 made choosing an event a lens of one, which hides the rest of the
    // picture. The ground is not part of that picture — it is what the picture
    // is drawn on — so it does not move (M45b, amendment A3).
    await waitFor(page, 'return document.querySelectorAll("#map circle.mark[data-id]").length > 0;', 'the marks');
    await page.eval(clickOn('#map circle.mark[data-id]'));
    await waitFor(page, 'return new URLSearchParams(location.search).has("selected");', 'an event to be chosen');
    const after = await page.eval('return document.querySelectorAll("#map .layer-base-relief path").length;');
    assert.equal(after, before, 'the bands are drawn whatever the lens hides');
  });
});

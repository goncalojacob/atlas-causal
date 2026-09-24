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

// Waits until the base map's files have stopped arriving: a cell that lands
// between two readings is a picture that was still changing on its own.
//
// **It fails rather than returning quietly** (M87 §5, review B8). It polled a
// count forty times and then returned whether or not anything had settled, so on
// a slow run the assertions after it read a page that was still arriving and
// failed with a sentence about swatches rather than about time. And the settle is
// across an animation frame *inside the page* rather than across two polls of
// the protocol, which is the same correction §3 made to the lane walk.
const settledBase = (page) => waitFor(
  page,
  `const count = () => performance.getEntriesByType('resource').filter((e) => e.name.includes('/geo/base/')).length;
   const was = count();
   return new Promise((resolve) => requestAnimationFrame(() => setTimeout(
     () => resolve(was > 0 && was === count()), 0)));`,
  "the base map's files to stop arriving",
);

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

// §2.3's last clause, and the only one of its four the tests above do not
// reach: **a row in the layer control**. It is not written into `index.html`
// and it is not written here either — the control is built from
// `manifest.base.layers`, so `relief` has a row by existing — which is exactly
// why it is worth a test: a layer that arrives in the manifest by being on
// disk can leave it the same way, and the row would go with it silently.
//
// `?fixtures=1` cannot answer this. The fixture dataset has no bands, so its
// manifest has no `relief` layer and its control rightly has no row — which is
// what `map-browser.test.mjs`'s list of seven switches is asserting, and why
// that list is not this one.
test('the bands have a row in the layer control, and it writes the link', { skip }, async () => {
  await wide(async (page, url) => {
    await open(page, url('?from=1911&to=1911'), DRAWN);
    const row = await page.eval(`
      const box = document.querySelector('.bar .layers input[data-layer="relief"]');
      if (!box) return null;
      const label = box.closest('label');
      return {
        checked: box.checked,
        label: label.textContent.trim(),
        swatch: Boolean(label.querySelector('.swatch-relief')),
        inBaseGroup: Boolean(box.closest('#base-map')),
        first: [...document.querySelectorAll('#base-map input[data-layer]')][0].dataset.layer,
      };`);
    assert.ok(row, 'the layer control has a row for the bands');
    assert.equal(row.label, 'relief', 'labelled by its own id, as every base row is');
    assert.ok(row.swatch, 'with the swatch that says what the tint means');
    assert.ok(row.inBaseGroup, 'inside the collapsed base-map group and not beside the territories');
    assert.equal(row.first, 'relief', 'and first in it, which is the order the map draws in');
    assert.equal(row.checked, false, 'unticked, because the bands are off until a reader asks');

    // And the switch is the link. Ticking it writes `relief` into `?layers=`,
    // in `LAYERS` order and with every other layer carried over untouched —
    // which is the whole of `layersFrom` (M68) exercised on the one member the
    // default leaves out.
    await page.eval(`document.querySelector('.bar .layers input[data-layer="relief"]').click(); return true;`);
    await waitFor(page, 'return new URLSearchParams(location.search).has("layers");',
      'the bands switched on to reach the address bar');
    const written = await page.eval('return new URLSearchParams(location.search).get("layers").split(",");');
    assert.deepEqual(written, [...LAYERS], 'the default plus the bands is every layer there is, in LAYERS order');
    await waitFor(page, 'return document.querySelectorAll("#map .layer-base-relief path").length > 0;',
      'the bands to be drawn once the switch is ticked');
  });
});

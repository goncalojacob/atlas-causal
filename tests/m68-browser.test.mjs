// M68 in a real browser: the categories switched from the view the reader is
// actually on.
//
// Deviation 858 is the whole of it. The switches were in the map's legend, the
// legend is hidden on the graph, the timeline followed the graph's rule — and
// since M65 the categories narrow the resting picture on all three views. So a
// reader on the lanes was looking at a filtered picture with no way to see or
// change the filter. What needs a browser is that the control is *there* on
// every view, that a click on it moves the lanes, the graph and the map
// together, and that the legend and the masthead cannot show two different
// answers because there is only one place the switches are.
//
// `tests/m68.test.mjs` holds the rest without a DOM — one owner, two halves of
// the list, one set the three views draw.
//
// Written before the behaviour it judges (deviations 711 and 717). **No test
// here pins a count of events**: what is asserted is that a named event is
// drawn or is not, on each of the three pictures.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });

const MAP_READY = 'return Boolean(document.querySelector(".map .mark"));';
const LANES = 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 0;';
const NODES = 'return document.querySelectorAll("#graph .node[data-id]").length > 0;';

const to = (view) => `document.querySelector('[data-view="${view}"]').click(); return true;`;

// The control as a reader meets it: the group in the masthead, whether it is
// on screen at all, and the switches inside it.
const CONTROL = `
  const group = document.querySelector('.bar .categories-control');
  const box = group ? group.getBoundingClientRect() : null;
  return {
    there: Boolean(group),
    visible: Boolean(box) && box.width > 0 && box.height > 0,
    rows: group ? group.querySelectorAll('input[data-category]').length : 0,
    ticked: group ? [...group.querySelectorAll('input[data-category]')]
      .filter((b) => b.checked).map((b) => b.dataset.category).sort() : [],
    glyphs: group ? group.querySelectorAll('svg.glyph').length : 0,
    inLegend: document.querySelectorAll('.bar .layers input[data-category]').length,
  };`;

// One named event on each of the three pictures. The fixtures put a war
// (`fixture-event-e`), a treaty (`fixture-event-a`), a disaster
// (`fixture-event-c`) and one event with no category at all
// (`fixture-event-d`) on three points apart, which is what makes this
// readable at all.
const DRAWN = (id) => `return {
  mark: Boolean(document.querySelector('#map circle.mark[data-id="${id}"]')),
  bar: Boolean(document.querySelector('#timeline rect.bar[data-id="${id}"]')),
  node: Boolean(document.querySelector('#graph .node[data-id="${id}"]')),
};`;

const click = (category) => `
  const box = document.querySelector('.bar .categories-control input[data-category="${category}"]');
  box.checked = !box.checked;
  box.dispatchEvent(new Event('change', { bubbles: true }));
  return true;`;

// 1. The control is on every view, which is the milestone in one assertion.
test('the category switches are in the masthead on all three views, and no longer in the legend', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), MAP_READY);

    const onMap = await page.eval(CONTROL);
    assert.equal(onMap.there, true, 'the group is in the masthead');
    assert.equal(onMap.visible, true, 'and it is on screen on the map');
    assert.ok(onMap.rows > 0, 'with one switch per category in use');
    assert.equal(onMap.rows, onMap.glyphs, 'each carrying its own symbol, which is the legend for it');
    assert.equal(onMap.inLegend, 0, 'and the map’s legend keeps no second copy');

    await page.eval(to('timeline'));
    await waitFor(page, LANES, 'the lanes');
    const onLanes = await page.eval(CONTROL);
    assert.equal(onLanes.visible, true, 'still on screen on the timeline — which is deviation 858');
    assert.equal(onLanes.rows, onMap.rows, 'the same switches and not another set');

    await page.eval(to('graph'));
    await waitFor(page, NODES, 'the nodes');
    const onGraph = await page.eval(CONTROL);
    assert.equal(onGraph.visible, true, 'and on the graph');
    assert.equal(onGraph.rows, onMap.rows);

    // The legend is still the map's own, and still goes when the map does.
    const legend = await page.eval(`return {
      hidden: document.querySelector('.bar .layers').hidden,
      rows: document.querySelectorAll('.bar .layers input[data-layer]').length,
    };`);
    assert.equal(legend.hidden, true, 'the legend is hidden on the graph as it always was');
    assert.ok(legend.rows > 0, 'and still carries the map’s own layers');
  });
});

// 2. The brief's first test: switched off **from the timeline**, gone from all
//    three pictures.
test('a category switched off from the timeline leaves the lanes, the graph and the map together', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1&view=timeline'), LANES);

    const before = await page.eval(DRAWN('fixture-event-e'));
    assert.equal(before.bar, true, 'the war is in the lanes to begin with');

    await page.eval(click('war'));
    const lanes = await page.eval(DRAWN('fixture-event-e'));
    assert.equal(lanes.bar, false, 'and it is gone from the lanes on the frame it was clicked');
    // The events that keep their category, and the ones that never had one,
    // are still drawn: this is a narrowing and not a blanking.
    const kept = await page.eval(DRAWN('fixture-event-d'));
    assert.equal(kept.bar, true, 'an event with no category at all is untouched');

    // The other two views, drawn after the switch, draw the same answer —
    // which is `emphasis.js` deciding once for all three (M65) and is why this
    // milestone had only to move the control.
    await page.eval(to('graph'));
    await waitFor(page, NODES, 'the nodes');
    const onGraph = await page.eval(DRAWN('fixture-event-e'));
    assert.equal(onGraph.node, false, 'the graph does not draw it either');

    await page.eval(to('map'));
    await waitFor(page, MAP_READY, 'the marks');
    const onMap = await page.eval(DRAWN('fixture-event-e'));
    assert.equal(onMap.mark, false, 'and neither does the map');
    // A category left on, on a point of its own: `fixture-event-a` is drawn
    // inside a cluster at this zoom and the question here is not clustering.
    const stillThere = await page.eval(DRAWN('fixture-event-c'));
    assert.equal(stillThere.mark, true, 'while a category left on is still on the map');
  });
});

// 3. The legend and the masthead cannot disagree, seen rather than read off the
//    source: switching the map's own layers never moves a category switch, and
//    the events row follows the categories because it is the same list.
test('switching a map layer leaves the categories exactly as the reader left them', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), MAP_READY);

    await page.eval(click('war'));
    await waitFor(
      page,
      'return (new URLSearchParams(location.search).get("layers") ?? "").includes("events:");',
      'the categories to reach the link',
    );
    const chosen = await page.eval(CONTROL);
    assert.ok(!chosen.ticked.includes('war'), 'the war is switched off');

    // Now the legend, which is a different control in a different group.
    await page.eval('document.querySelector(\'.bar .layers input[data-layer="territories"]\').click(); return true;');
    await waitFor(
      page,
      'return !(new URLSearchParams(location.search).get("layers") ?? "").split(",").includes("territories");',
      'the territories to leave the link',
    );
    const after = await page.eval(CONTROL);
    assert.deepEqual(after.ticked, chosen.ticked,
      'and the categories are where the reader left them');
    const layers = await page.eval('return new URLSearchParams(location.search).get("layers");');
    assert.doesNotMatch(layers, /events:war\b/, 'the link still says the war is off');
    assert.doesNotMatch(layers, /(^|,)territories(,|$)/, 'and that the territories are off too');
  });
});

// 4. The state is in the URL as it is today, and a link carries it — opened on
//    the timeline, where before M68 there was nothing to read it with.
test('a link that names categories opens the lanes narrowed, with the switches saying so', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1&view=timeline&layers=land,territories,events:treaty'), LANES);

    const control = await page.eval(CONTROL);
    assert.deepEqual(control.ticked, ['treaty'], 'the switches say what the link says');
    assert.equal(control.visible, true, 'and the reader can see them without leaving the lanes');

    const treaty = await page.eval(DRAWN('fixture-event-a'));
    assert.equal(treaty.bar, true);
    const war = await page.eval(DRAWN('fixture-event-e'));
    assert.equal(war.bar, false, 'a category the link does not name is off');
    const none = await page.eval(DRAWN('fixture-event-d'));
    assert.equal(none.bar, true, 'and the events with no category are still drawn');

    // Switching the rest back on writes the bare token again, which is what
    // "every category" is called (M30b, A11) — from the timeline, which is the
    // thing that could not be done before.
    await page.eval(`
      for (const b of document.querySelectorAll('.bar .categories-control input[data-category]')) {
        if (!b.checked) { b.checked = true; b.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      return true;`);
    await waitFor(
      page,
      'return !(new URLSearchParams(location.search).get("layers") ?? "").includes("events:");',
      'the bare token to come back',
    );
    const back = await page.eval(DRAWN('fixture-event-e'));
    assert.equal(back.bar, true, 'the war is in the lanes again');
  });
});

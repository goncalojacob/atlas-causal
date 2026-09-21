// The phone layout in a real browser at a real phone size: 390 × 844, touch,
// three device pixels to the CSS pixel. What the brief asks for is that a
// mark can be tapped and the sheet appears, which is a gesture and a media
// query at once and cannot be checked without one.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, waitFor, tap, seenIntro, skip,
} from './browser.mjs';

// An iPhone 12 in portrait, which is about the middle of what a phone is.
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3 };

// Every one of these is a reader who has been here before: the introduction
// covers the view on a first visit with nothing open, and what is under test
// here is the sheet.
const phone = (fn) => withBrowser(async (page, url) => {
  await seenIntro(page);
  return fn(page, url);
}, { device: PHONE, touch: true });

// Where the sheet actually is on the screen, and how much of it is showing.
// Read from the layout rather than from the class, so a broken transform is
// a failure and not a passing test about a class name.
const SHEET = `const sheet = document.getElementById("sheet");
  const box = sheet.getBoundingClientRect();
  return {
    open: sheet.classList.contains("open"),
    peek: sheet.classList.contains("peek"),
    expanded: document.getElementById("sheet-grip").getAttribute("aria-expanded"),
    top: Math.round(box.top),
    showing: Math.round(Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)),
    height: Math.round(box.height),
    gripHeight: Math.round(document.getElementById("sheet-grip").getBoundingClientRect().height),
  };`;

// The sheet slides, so nothing about where it is may be read while it is
// still moving. These are the two places it comes to rest, in geometry
// rather than in class names: a transform that never arrives is a failure.
const AT_REST_DOWN = `const b = document.getElementById("sheet").getBoundingClientRect();
  const grip = document.getElementById("sheet-grip").getBoundingClientRect().height;
  return Math.round(b.top) === Math.round(innerHeight - grip);`;
const AT_REST_UP = `const b = document.getElementById("sheet").getBoundingClientRect();
  return Math.round(b.top) === Math.round(innerHeight - b.height);`;

test('at 390 × 844 the view takes the screen and the panel is a sheet down to its grip', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');

    assert.equal(await page.eval('return document.body.classList.contains("phone");'), true);
    const layout = await page.eval(`const l = document.querySelector(".layout");
      const map = document.getElementById("map").getBoundingClientRect();
      const whole = l.getBoundingClientRect();
      return {
        columns: getComputedStyle(l).gridTemplateColumns.split(" ").length,
        splits: [...document.querySelectorAll(".split")].map((s) => getComputedStyle(s).display),
        mapHeight: Math.round(map.height),
        // The layout keeps the grip's worth of screen clear at the bottom, so
        // nothing of the picture is permanently underneath it: what the view
        // has is the layout less that.
        layoutHeight: Math.round(whole.height)
          - Math.round(document.getElementById("sheet-grip").getBoundingClientRect().height),
        timelineShown: !document.getElementById("timeline").hidden,
        wider: document.documentElement.scrollWidth <= 390,
      };`);
    assert.equal(layout.columns, 1, 'one column');
    assert.deepEqual(layout.splits, ['none'], 'the draggable edge of M24 is gone');
    // Since M60 the timeline is a view rather than a strip under the map, so a
    // phone spends none of its screen on a picture the reader is not reading:
    // the map is the whole of the layout and the lanes are a tap away.
    assert.equal(layout.timelineShown, false, 'the timeline is not a strip under the view');
    assert.equal(layout.mapHeight, layout.layoutHeight, 'the view has the screen');
    assert.equal(layout.wider, true, 'nothing sticks out sideways');

    // Nothing open: the sheet is down, and only its grip is over the atlas.
    await waitFor(page, AT_REST_DOWN, 'the sheet to rest on its grip');
    const at = await page.eval(SHEET);
    assert.equal(at.peek, true);
    assert.equal(at.expanded, 'false');
    assert.equal(at.showing, at.gripHeight, 'exactly the grip is showing');
    assert.ok(at.gripHeight >= 40, `the grip is a hit target, got ${at.gripHeight}`);
  });
});

test('a mark can be tapped and the sheet comes up with its card', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark:not(.cluster)"));');
    await waitFor(page, AT_REST_DOWN, 'the sheet to rest on its grip');

    // A finger, on the middle of a mark that stands for one event.
    const point = await page.eval(`const mark = document.querySelector(".map .mark:not(.cluster)");
      const box = mark.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2, id: mark.dataset.id };`);
    assert.ok(point.id, 'the mark stands for one event');
    await tap(page, point.x, point.y);

    await waitFor(page, 'return Boolean(document.querySelector(".panel .event-head h2"));', 'the card');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), point.id);

    await waitFor(page, AT_REST_UP, 'the sheet to come up');
    const at = await page.eval(SHEET);
    assert.equal(at.open, true, 'the sheet came up');
    assert.equal(at.expanded, 'true');
    assert.equal(at.top, 844 - at.height, 'and is against the bottom edge, whole');
    assert.ok(at.showing > 300, `most of the screen is the card, got ${at.showing}`);
  });
});

test('the grip pushes the sheet back down, and brings it up again', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-a'), 'return Boolean(document.querySelector(".panel .event-head h2"));');
    // Arriving on a link that names a record opens with the card up.
    await waitFor(page, AT_REST_UP, 'the sheet to be up on arrival');

    const grip = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip.x, grip.y);
    await waitFor(page, AT_REST_DOWN, 'the sheet to go down');
    const down = await page.eval(SHEET);
    assert.equal(down.showing, down.gripHeight);
    // Pushing it down is not a change of what the atlas is showing.
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), 'fixture-event-a');

    const grip2 = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip2.x, grip2.y);
    await waitFor(page, AT_REST_UP, 'the sheet to come up again');
  });
});

test('the search is full width and the toggles are behind one Options button', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');

    const before = await page.eval(`return {
      search: Math.round(document.querySelector(".search-input").getBoundingClientRect().width),
      button: getComputedStyle(document.getElementById("options-button")).display,
      buttonHeight: Math.round(document.getElementById("options-button").getBoundingClientRect().height),
      layers: getComputedStyle(document.querySelector(".bar .layers")).display,
      grouping: getComputedStyle(document.querySelector(".bar .grouping")).display,
      views: Math.round(document.querySelector('[data-view="map"]').getBoundingClientRect().height),
    };`);
    assert.ok(before.search > 300, `the search takes the line, got ${before.search}`);
    assert.notEqual(before.button, 'none', 'the Options button is there');
    assert.ok(before.buttonHeight >= 40, `Options is a hit target, got ${before.buttonHeight}`);
    assert.ok(before.views >= 40, `Map/Graph are hit targets, got ${before.views}`);
    assert.equal(before.layers, 'none', 'the layer switches are folded away');
    assert.equal(before.grouping, 'none', 'and so is the grouping');

    await page.eval('document.getElementById("options-button").click(); return true;');
    const after = await page.eval(`return {
      expanded: document.getElementById("options-button").getAttribute("aria-expanded"),
      layers: getComputedStyle(document.querySelector(".bar .layers")).display,
      grouping: getComputedStyle(document.querySelector(".bar .grouping")).display,
      box: Math.round(document.querySelector(".bar .layers label").getBoundingClientRect().height),
    };`);
    assert.equal(after.expanded, 'true');
    assert.notEqual(after.layers, 'none', 'and they come back on the button');
    assert.notEqual(after.grouping, 'none');
    assert.ok(after.box >= 40, `a layer switch is a hit target, got ${after.box}`);
  });
});

test('the graph pans by touch', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1&view=graph'), 'return Boolean(document.querySelector(".graph .node"));');
    // The sheet is over the middle of the screen until it has finished going
    // down, and a finger there would land on the panel and not the picture.
    await waitFor(page, AT_REST_DOWN, 'the sheet to rest on its grip');
    // touch-action decides whether the browser takes the gesture before the
    // view sees it: none on the graph is what makes a one-finger drag a pan.
    assert.equal(await page.eval('return getComputedStyle(document.querySelector(".graph")).touchAction;'), 'none');

    // Set before the drag: the attribute is written only when the view moves,
    // so "it changed" has to be measured against something that exists.
    await page.eval('document.querySelector(".graph .viewport").setAttribute("transform", "none"); return true;');
    const before = 'none';
    const from = await page.eval(`const box = document.querySelector(".graph").getBoundingClientRect();
      return { x: Math.round(box.left + box.width / 2), y: Math.round(box.top + box.height / 2) };`);
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
    // Several steps, not one: a finger that jumps is not a drag, and the
    // browser has a slop distance before it calls a touch a movement at all.
    for (let step = 1; step <= 6; step += 1) {
      await page.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: from.x - 10 * step, y: from.y - 4 * step }],
      });
    }
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await waitFor(
      page,
      `return document.querySelector(".graph .viewport").getAttribute("transform") !== ${JSON.stringify(before)};`,
      'the graph to pan under the finger',
    );
  });
});

// Reading a narrative on a phone. The card's own text says the map, the graph
// and the timeline follow the step — so the sheet must not cover them at
// every arrow key, which is what it did (health review A, finding 32). The
// grip is the control: once the reader has pushed the sheet down, it stays
// down until they ask for it.
test('stepping through a narrative leaves the sheet where the reader put it', { skip }, async () => {
  await phone(async (page, url) => {
    await open(
      page,
      url('?fixtures=1&narrative=fixture-narrative-one'),
      'return Boolean(document.querySelector(".panel .narrative-head"));',
    );
    // Opening the narrative is opening something, so it comes up once.
    await waitFor(page, AT_REST_UP, 'the sheet to be up on arrival');

    const grip = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip.x, grip.y);
    await waitFor(page, AT_REST_DOWN, 'the sheet to go down');

    // Three steps forward and one back, from the keyboard as the card says.
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft']) {
      const step = await page.eval('return new URLSearchParams(location.search).get("step") ?? "0";');
      await page.eval(`document.body.dispatchEvent(new KeyboardEvent('keydown', {
        key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }));
        return true;`);
      await waitFor(
        page,
        `return (new URLSearchParams(location.search).get("step") ?? "0") !== ${JSON.stringify(step)};`,
        `the step to move on ${key}`,
      );
      assert.equal(await page.eval(AT_REST_DOWN), true, `the sheet stayed down through ${key}`);
    }
    // The reader really did walk, and the map really did follow.
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("step");'), '2');
    assert.ok(await page.eval('return document.querySelectorAll("#map .mark.of-narrative").length > 0;'));

    // And the grip still brings it back.
    const grip2 = await page.eval(`const box = document.getElementById("sheet-grip").getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };`);
    await tap(page, grip2.x, grip2.y);
    await waitFor(page, AT_REST_UP, 'the sheet to come up again');
  });
});

// A13 and the glyph brief's §4: the category toggles go inside a collapsed
// `<details>` so the drawer keeps one 40 px target instead of thirteen. Open,
// every row is a target of its own and carries its symbol — the switches are
// the legend for the categories and there is no other.
test('the category toggles are one collapsed target in the drawer, and open into rows with their glyphs', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');
    await page.eval('document.getElementById("options-button").click(); return true;');

    const shut = await page.eval(`
      // The categories' group by its own anchor: since M68 it is a control of
      // its own in the masthead and no longer the second <details> of the
      // legend (category-control.js).
      const details = document.querySelector('.bar .categories-control #events-by-category').closest('details');
      const summary = details.querySelector('summary');
      return {
        there: Boolean(details),
        open: details.open,
        summary: summary.textContent.trim(),
        height: Math.round(summary.getBoundingClientRect().height),
        // What the group costs the drawer while it is shut. Not the rows'
        // own boxes: Chrome skips painting a closed details through
        // content-visibility, and a skipped box still measures.
        group: Math.round(details.getBoundingClientRect().height),
      };`);
    assert.equal(shut.there, true);
    assert.equal(shut.open, false, 'collapsed, or the drawer is thirteen rows long');
    assert.equal(shut.summary, 'events by category');
    assert.ok(shut.height >= 40, `one hit target, got ${shut.height}`);
    assert.equal(shut.group, shut.height, 'the whole group is that one row while it is shut');

    const open_ = await page.eval(`
      const details = document.querySelector('.bar .categories-control #events-by-category').closest('details');
      details.open = true;
      const rows = [...details.querySelectorAll('label')];
      return {
        rows: rows.length,
        shortest: Math.min(...rows.map((l) => Math.round(l.getBoundingClientRect().height))),
        glyphs: details.querySelectorAll('svg.glyph use').length,
        hrefs: [...details.querySelectorAll('svg.glyph use')].map((u) => u.getAttribute('href')).sort(),
        onScreen: rows.every((l) => l.getBoundingClientRect().right <= innerWidth + 1),
      };`);
    assert.equal(open_.rows, 3, 'one row per category in use');
    assert.equal(open_.glyphs, 3, 'each carrying its own symbol');
    assert.deepEqual(open_.hrefs, ['#glyph-disaster', '#glyph-treaty', '#glyph-war']);
    assert.ok(open_.shortest >= 40, `every row is a hit target, shortest ${open_.shortest}`);
    assert.equal(open_.onScreen, true, 'and the panel is inside the screen, not floating off it');
  });
});

// M37b, and the whole reason the base layers are behind a `<details>` of their
// own: the control is nineteen controls now, and a drawer nineteen rows long is
// a drawer nobody scrolls to the bottom of. Two rows and one summary — three
// targets since the categories left for the masthead (M68) — and the rows are
// there when the reader asks for them.
test('the layer control is three targets in the drawer, and base map opens into five', { skip }, async () => {
  await phone(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');
    await page.eval('document.getElementById("options-button").click(); return true;');

    const shut = await page.eval(`
      const control = document.querySelector('.bar .layers');
      const touch = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--touch'));
      // What the drawer actually offers a thumb while everything is shut: the
      // plain rows and the summaries, in the order they are in.
      const targets = [...control.children].map((el) => el.tagName === 'DETAILS'
        ? { label: el.querySelector('summary').textContent.trim(), el: el.querySelector('summary') }
        : { label: el.querySelector('input').dataset.layer, el });
      return {
        touch,
        labels: targets.map((t) => t.label),
        shortest: Math.min(...targets.map((t) => Math.round(t.el.getBoundingClientRect().height))),
        // Nothing of either group is in the drawer's flow while it is shut.
        open: [...control.querySelectorAll('details')].map((d) => d.open),
        height: Math.round(control.getBoundingClientRect().height),
        onScreen: targets.every((t) => t.el.getBoundingClientRect().right <= innerWidth + 1),
      };`);
    // Three since M68: the categories are a target of the drawer still, but in
    // a control of their own beside it, because they narrow all three pictures
    // and not the map alone (deviation 858).
    assert.deepEqual(shut.labels, ['territories', 'events', 'base map'],
      'three targets: two rows and one collapsed group');
    assert.deepEqual(shut.open, [false], 'the group is collapsed');
    assert.ok(shut.touch >= 40, `--touch is a thumb, got ${shut.touch}`);
    assert.ok(shut.shortest >= shut.touch, `every one of the four is --touch tall, shortest ${shut.shortest}`);
    assert.equal(shut.onScreen, true, 'and none of them runs off the side');

    const opened = await page.eval(`
      const group = document.querySelector('.bar .layers #base-map');
      group.closest('details').open = true;
      const rows = [...group.querySelectorAll('label')];
      return {
        ids: rows.map((l) => l.querySelector('input').dataset.layer),
        labels: rows.map((l) => l.textContent.trim()),
        swatches: group.querySelectorAll('.swatch').length,
        // The swatch has to be visible to be a legend: a zero box says nothing.
        painted: rows.map((l) => {
          const s = l.querySelector('.swatch');
          const box = s.getBoundingClientRect();
          const style = getComputedStyle(s);
          return box.width > 0 && box.height >= 0
            && (style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.borderBottomWidth !== '0px'
              || style.borderTopWidth !== '0px');
        }),
        shortest: Math.min(...rows.map((l) => Math.round(l.getBoundingClientRect().height))),
        onScreen: rows.every((l) => l.getBoundingClientRect().right <= innerWidth + 1),
        // The panel flows in the drawer rather than floating over the sheet.
        position: getComputedStyle(group).position,
      };`);
    // Five, and not six: the coastlines have no row (plan decision 14).
    assert.deepEqual(opened.ids, ['rivers', 'lakes', 'physical', 'mountains', 'cities']);
    assert.deepEqual(opened.labels, ['rivers', 'lakes', 'physical', 'mountains', 'cities'],
      'each labelled by its layer id, from the manifest');
    assert.equal(opened.swatches, 5, 'each carrying its swatch: the control is the legend');
    assert.deepEqual(opened.painted, [true, true, true, true, true], 'and every swatch is drawn');
    assert.ok(opened.shortest >= 40, `every row is a hit target, shortest ${opened.shortest}`);
    assert.equal(opened.onScreen, true, 'and the rows are inside the screen');
    assert.equal(opened.position, 'static', 'the group flows in the drawer, not over the sheet');

    // And the drawer still scrolls: the masthead grew by two groups, and what
    // must not happen is a page that scrolls sideways or a drawer that cannot
    // reach its own bottom.
    const drawer = await page.eval(`
      const tools = document.getElementById('masthead-tools');
      return {
        wider: document.documentElement.scrollWidth <= 390,
        reachable: Math.round(tools.getBoundingClientRect().bottom) > 0,
        scrolls: document.documentElement.scrollHeight >= innerHeight
          || getComputedStyle(document.body).overflowY !== 'visible',
      };`);
    assert.equal(drawer.wider, true, 'nothing sticks out sideways with both groups open');
    assert.equal(drawer.reachable, true, 'the drawer is on the screen');
    assert.ok(drawer.scrolls, 'and the page can be scrolled to the bottom of it');
  });
});

// M43b. The timeline at phone width over a corpus of five centuries: 390 px
// less the lane gutter is not much axis to share out, and what must not happen
// is an axis whose labels sit on top of one another or a band too narrow to
// take hold of with a thumb.
test('the whole extent is legible on a phone, and the band is a thumb wide', { skip }, async () => {
  await phone(async (page, url) => {
    // On the timeline's own view, which on a phone is the whole screen: it is
    // chosen from the masthead since M60 rather than being a strip that is
    // always there. A finger still scrolls the lanes, which is what `pan-y`
    // on `.timeline` is for.
    await open(page, url('?fixtures=1&view=timeline'),
      'return Boolean(document.querySelector("#timeline svg.timeline rect.lane"));');
    assert.equal(await page.eval('return getComputedStyle(document.querySelector(".timeline")).touchAction;'), 'pan-y');
    const seen = await page.eval(`
      const svg = document.querySelector('#timeline svg.timeline');
      const band = svg.querySelector('[data-window="band"]');
      const ticks = [...svg.querySelectorAll('.layer-tickLabels text')]
        .map((t) => ({ label: t.textContent, x: Number(t.getAttribute('x')) }))
        .sort((a, b) => a.x - b.x);
      return {
        width: Number(svg.getAttribute('width')),
        min: Number(band.getAttribute('aria-valuemin')),
        max: Number(band.getAttribute('aria-valuemax')),
        valuetext: band.getAttribute('aria-valuetext'),
        bandWidth: Number(band.getAttribute('width')),
        handles: svg.querySelectorAll('.window-handle').length,
        ticks,
        bars: svg.querySelectorAll('rect.bar[data-id]').length,
        wider: document.documentElement.scrollWidth <= 390,
      };`);
    assert.ok(seen.max - seen.min > 200, `the fixtures span centuries (${seen.min}–${seen.max})`);
    assert.equal(seen.wider, true, 'nothing sticks out sideways');
    assert.ok(seen.bars > 0, 'and there are bars on it');
    // Some of the axis is labelled, and no two labels touch. Fewer of them
    // than at 1440 px, which is the drawing giving up detail rather than
    // overprinting: `ticks(count)` is asked for a count from the width.
    assert.ok(seen.ticks.length >= 3,
      `the axis is labelled along its length (${seen.ticks.map((t) => t.label).join(' ')})`);
    // Spread across the drawing and not heaped at the left: a run of narrow
    // columns handing its label along and leaving one at each end is what the
    // thinning must not do (timeline-scale.js, `ticks`).
    const rightmost = seen.ticks[seen.ticks.length - 1].x;
    assert.ok(rightmost > seen.width * 0.6,
      `the last label is out along the axis (${Math.round(rightmost)} of ${seen.width})`);
    for (let i = 1; i < seen.ticks.length; i += 1) {
      assert.ok(seen.ticks[i].x - seen.ticks[i - 1].x > 24,
        `"${seen.ticks[i - 1].label}" and "${seen.ticks[i].label}" are ${
          Math.round(seen.ticks[i].x - seen.ticks[i - 1].x)} px apart`);
    }
    // The band is still something a thumb can find, and both its handles are
    // drawn: the opening window is one century of several and would be a
    // hairline on a linear scale over the same corpus.
    assert.equal(seen.handles, 2);
    assert.ok(seen.bandWidth >= 40, `the band is a hit target (${Math.round(seen.bandWidth)} px)`);
    const [from, to] = seen.valuetext.split(' to ').map(Number);
    assert.ok(to - from < (seen.max - seen.min) / 2, 'and it opens on part of the data, not all of it');
  });
});

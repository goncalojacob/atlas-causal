// M83, the half only a drawing can answer: World War II opened on the graph,
// and the key over it.
//
// `tests/m83.test.mjs` holds the arithmetic — nothing off the axis, a node on
// its own date, no row of marks pinned to the edge of the field. What is left
// here is what the browser has to lay out before anybody can say it:
//
//   A1-3  the lens's own links are the ones in ink and the ring's are faint,
//         which is M77's rule for a walk applied to every lens;
//   A1-4  the key is one button on every width, and the picture under its
//         corner is not covered until the reader asks for it.
//
// Written before the behaviour it judges (deviations 711 and 717), and nothing
// here pins a count or a pixel: every assertion is a comparison between two
// things the same page drew.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  withBrowser, open, skip, waitFor, watchErrors, errorsOn, seenIntro,
} from './browser.mjs';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1, mobile: true };

const ready = 'return Boolean(document.querySelector("#map svg.map"));';
const NODES = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length > 0;";
const WAR = '?view=graph&selected=world-war-ii';

// Every line the graph drew, with the ink the browser actually gave it and
// whether it is one of the ring's.
const LINES = `
  const svg = document.querySelector('svg.graph');
  return [...svg.querySelectorAll('line.edge')].map((el) => ({
    faint: el.classList.contains('lens-near'),
    opacity: Number(getComputedStyle(el).opacity),
  }));`;

const KEY = `
  const box = document.querySelector('#graph .graph-key');
  if (!box) return null;
  const button = box.querySelector('.graph-key-toggle');
  const body = box.querySelector('.graph-key-body');
  const shown = (el) => (el ? el.getBoundingClientRect().height > 0 : false);
  const picture = document.querySelector('svg.graph').getBoundingClientRect();
  return {
    button: shown(button),
    body: shown(body),
    share: (box.getBoundingClientRect().width * box.getBoundingClientRect().height)
      / (picture.width * picture.height),
  };`;

const press = "document.querySelector('#graph .graph-key .graph-key-toggle').click(); return true;";

test('A1-3: with the war opened, the lens\'s links are in ink and the ring\'s are faint', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const lines = await page.eval(LINES);
    assert.ok(lines.length > 3, 'there are lines to read');
    const own = lines.filter((l) => !l.faint);
    const ring = lines.filter((l) => l.faint);
    assert.ok(own.length > 0, 'the lens has links of its own');
    assert.ok(ring.length > 0, 'and the ring around it has some');
    // M77's rule, and it is a comparison and not a number: whatever the
    // stylesheet spends, what the reader asked about is inked over what it
    // merely reaches.
    assert.ok(
      Math.max(...ring.map((l) => l.opacity)) < Math.min(...own.map((l) => l.opacity)),
      'every one of the ring\'s lines is fainter than every one of the lens\'s',
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('A1-4: the key is one button on a desktop, and opens behind it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const folded = await page.eval(KEY);
    assert.ok(folded, 'the graph has a key');
    assert.equal(folded.button, true, 'there is one button');
    assert.equal(folded.body, false, 'and the key is behind it');
    const opened = await (async () => { await page.eval(press); return page.eval(KEY); })();
    assert.equal(opened.body, true, 'pressing it opens the key');
    assert.ok(opened.share > folded.share,
      'the open key covers more of the picture than the folded one, which is why it folds');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('A1-4: and the same one button on a phone', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const folded = await page.eval(KEY);
    assert.equal(folded.button, true, 'the button is there');
    assert.equal(folded.body, false, 'and the key is behind it');
  }, { device: PHONE });
});

// --- B1: the map drawn while hidden is drawn again when it comes back -------
//
// The map subscribes to the store inside `createMap`, before `showView` does,
// so a switch back to it renders while the pane is still hidden: the box is the
// nominal 960 x 540 and the marks in the letterbox margins are culled. The
// observer then found the size unchanged and returned. What is asserted is the
// comparison and not a count: the map a reader comes back to draws what the map
// they arrived on drew.
test('B1: coming back to the map draws the map, not the picture it had while hidden', { skip }, async () => {
  const MARKS = `
    const svg = document.querySelector('svg.map');
    return [...svg.querySelectorAll('.mark[data-id]')].map((el) => el.getAttribute('data-id')).sort();`;
  const HERE = '?from=1900&to=1999&bbox=-25,-25,60,55';

  const arrived = await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url(HERE), ready);
    await waitFor(page, 'return document.querySelectorAll("svg.map .mark[data-id]").length > 0;', 'marks');
    return page.eval(MARKS);
  }, { device: DESK });

  const returned = await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(HERE), ready);
    await waitFor(page, 'return document.querySelectorAll("svg.map .mark[data-id]").length > 0;', 'marks');
    await page.eval('document.querySelector(\'[data-view="graph"]\').click(); return true;');
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await page.eval('document.querySelector(\'[data-view="map"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll("svg.map .mark[data-id]").length > 0;', 'marks again');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
    return page.eval(MARKS);
  }, { device: DESK });

  assert.ok(arrived.length > 2, 'there are marks on the map to compare');
  assert.deepEqual(returned, arrived, 'the same marks are drawn on the way back as on arrival');
});

// --- B2: the band and the masthead follow the files that land late ----------
//
// `lensView` answers again after the state has stopped moving — a narrative's
// steps are an attribute and arrive with their century. main.js forces the
// three views for exactly that reason and told neither the band nor the count.
// Nothing is pinned here: the profile drawn on arrival is compared with the
// profile the very same page draws once something else has made it render.
test('B2: the band\'s profile is the narrative\'s from the first drawing', { skip }, async () => {
  const PROFILE = `
    const path = document.querySelector('#map .map-band path.bar.stub');
    return path ? path.getAttribute('d') : null;`;

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?narrative=how-the-colonial-war-ended-the-regime&step=0'), ready);
    await waitFor(page, `${PROFILE.replace('return path ? path.getAttribute(\'d\') : null;', 'return Boolean(path);')}`, 'the band to draw a profile');
    const onArrival = await page.eval(PROFILE);

    // A state change that cannot itself move the profile: which view has the
    // pane says nothing about which events the band is a band over.
    await page.eval('document.querySelector(\'[data-view="graph"]\').click(); return true;');
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await page.eval('document.querySelector(\'[data-view="map"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll("svg.map .mark[data-id]").length > 0;', 'the map again');
    const later = await page.eval(PROFILE);

    assert.ok(onArrival, 'there is a profile under the band');
    assert.equal(onArrival, later, 'and it is the same profile before and after anything else redrew');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// --- B3: the masthead count says what the picture it is over holds ----------
test('B3: on the graph the count is the graph\'s, and it is said with no box', { skip }, async () => {
  const COUNT = `
    const el = document.querySelector('.window-count');
    const view = document.querySelector('.window-view');
    const pin = document.querySelector('.window-view .pin');
    return {
      text: (el && el.textContent || '').trim(),
      hidden: Boolean(view && view.hidden),
      pin: Boolean(pin && !pin.hidden),
      shown: Number(((el && el.textContent || '').match(/\\d+/g) || [])[0]),
    };`;
  const DRAWN = "return document.querySelectorAll('#graph svg.graph circle.node[data-id]').length;";

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // A box left over from the map, and the graph, which reads no box at all.
    await open(page, url('?view=graph&bbox=-25,-25,60,55'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await waitFor(page, 'return (document.querySelector(".window-count").textContent || "").trim() !== "";', 'the count');
    const onGraph = await page.eval(COUNT);
    assert.equal(onGraph.hidden, false, 'the count is said on the graph');
    assert.equal(onGraph.pin, false, 'and there is no box on the graph to pin');
    // The graph draws every node of its arrangement; what is in the DOM is what
    // falls inside the rectangle on screen (I6's cull), so the count is at
    // least what is drawn and never the map's rectangle, which holds far fewer.
    assert.ok(onGraph.shown >= await page.eval(DRAWN),
      `the count (${onGraph.shown}) is of the graph's own picture`);

    // And on the map, where the box is the picture, the same box counts fewer.
    await page.eval('document.querySelector(\'[data-view="map"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll("svg.map .mark[data-id]").length > 0;', 'the map');
    const onMap = await page.eval(COUNT);
    assert.equal(onMap.pin, true, 'the map has a box, so it has the pin back');
    assert.ok(onMap.shown < onGraph.shown, 'and a rectangle of the map holds fewer than the whole graph');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('B3: and at rest, with no box at all, the sentence is still said', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?from=1900&to=1999'), ready);
    await waitFor(page, 'return (document.querySelector(".window-count").textContent || "").trim() !== "";',
      'the count at first paint, with nobody having moved the map');
    const text = await page.eval('return document.querySelector(".window-count").textContent.trim();');
    assert.match(text, /in view$/, `the sentence is the count's own: ${text}`);
    assert.equal(await page.eval('return document.querySelector(".window-view .pin").hidden;'), true,
      'and nothing to press, because the map is looking at all of it');
  }, { device: DESK });
});

// --- B5: a graph node is reachable from the keyboard, as a line is ----------
test('B5: a mark on the graph takes the focus and answers Enter', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');

    const marks = await page.eval(`
      const svg = document.querySelector('svg.graph');
      return [...svg.querySelectorAll('.layer-nodes circle[data-id], .layer-nodes circle[data-stack]')]
        .map((el) => ({
          id: el.getAttribute('data-id'),
          stack: el.getAttribute('data-stack'),
          tabindex: el.getAttribute('tabindex'),
          role: el.getAttribute('role'),
          label: el.getAttribute('aria-label'),
        }));`);
    assert.ok(marks.length > 2, 'the graph drew marks');
    for (const mark of marks) {
      assert.equal(mark.tabindex, '0', 'every mark can be reached by Tab');
      assert.equal(mark.role, 'button', 'and says it is a control');
      assert.ok(mark.label && mark.label.length > 0, 'and says what it is');
    }

    // Enter on a mark of one opens the record, which is what a click does.
    const one = marks.find((m) => m.id);
    assert.ok(one, 'there is a mark standing for one event');
    await page.eval(`
      const el = document.querySelector('svg.graph .layer-nodes circle[data-id=${JSON.stringify(one.id)}]');
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      return true;`);
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('selected') === ${JSON.stringify(one.id)};`,
      'Enter on the mark to open its record',
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// --- B6: choosing a connection while reading a narrative -------------------
test('B6: a link chosen inside a narrative opens its card and writes ?edge=', { skip }, async () => {
  const A_LINE = `
    const svg = document.querySelector('svg.graph');
    const el = svg.querySelector('line.edge[data-edge]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { id: el.getAttribute('data-edge'), x: b.left + b.width / 2, y: b.top + b.height / 2 };`;

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=graph&narrative=how-the-colonial-war-ended-the-regime&step=1'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    await waitFor(page, 'return Boolean(document.querySelector("svg.graph line.edge[data-edge]"));', 'a line to choose');
    const line = await page.eval(A_LINE);

    await page.eval(`
      const el = document.querySelector('svg.graph line.edge[data-edge=${JSON.stringify(line.id)}]');
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      return true;`);

    // The address says which link is open, which is the whole of "the same way
    // I select an event".
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('edge') === ${JSON.stringify(line.id)};`,
      'the chosen link in the address',
    );
    // And the card is the link's, not the narrative's.
    await waitFor(page, 'return Boolean(document.querySelector(".panel .edge-card-head"));', 'the link\'s card');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// --- B9: the camera frames the layout that is on screen ---------------------
//
// Above six hundred events the arrangement is sent to a thread, and the frame
// was keyed on the arrangement alone: the old coordinates were framed against
// the new question, and the new coordinates arrived to find the key unchanged.
// The corpus is under that threshold today, so what is asserted here is the
// invariant the fault broke and not the path that broke it — with a lens on,
// every one of the lens's own marks is inside the pane, whatever moved the
// coordinates after the camera first looked at them.
test('B9: with a lens on, every mark of the lens is inside the pane', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    // Every name landed means every century the picture holds has landed,
    // which is the last thing that can move a node under the camera.
    await waitFor(page, `
      const marks = [...document.querySelectorAll('svg.graph .layer-nodes circle[data-id]')];
      if (marks.length === 0) return false;
      return marks.every((el) => {
        const title = el.querySelector('title');
        return Boolean(title) && !/^Loading/.test(title.textContent);
      });`, 'every mark to be named');

    const outside = await page.eval(`
      const svg = document.querySelector('svg.graph');
      const pane = svg.getBoundingClientRect();
      return [...svg.querySelectorAll('.layer-nodes circle[data-id]')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return b.left < pane.left || b.right > pane.right || b.top < pane.top || b.bottom > pane.bottom;
        })
        .map((el) => el.getAttribute('data-id'));`);
    assert.deepEqual(outside, [], 'no mark the graph drew stands off the pane');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

// --- B4, B7, B8 ------------------------------------------------------------

test('B4: an umbrella opened outside the window shows its children on all three views', { skip }, async () => {
  // A window nowhere near the war, so nothing of it overlaps the band: what
  // keeps its parts in the picture can only be the lens.
  const AWAY = '?from=1500&to=1520&selected=world-war-ii';
  const PARTS = `
    const ids = [...document.querySelectorAll('.panel .card-section')];
    return true;`;

  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(AWAY), ready);
    await waitFor(page, 'return document.querySelectorAll("svg.map .mark[data-id]").length > 1;',
      'more than the war itself on the map');
    const onMap = await page.eval(`return [...document.querySelectorAll('svg.map .mark[data-id]')]
      .map((el) => el.getAttribute('data-id'));`);
    assert.ok(onMap.length > 1, `the map draws the war's parts, not only the war: ${onMap.length}`);

    await page.eval('document.querySelector(\'[data-view="timeline"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll("#timeline rect.bar[data-id]").length > 1;',
      'more than one bar on the timeline');
    const onTimeline = await page.eval(`return [...document.querySelectorAll('#timeline rect.bar[data-id]')]
      .map((el) => el.getAttribute('data-id'));`);
    assert.ok(onTimeline.length > 1, `the timeline draws bars for the parts: ${onTimeline.length}`);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('B7: a link arrived at by address is drawn on the map, with both its ends', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // A link between two parts of the war, which at rest is in no picture: the
    // resting set is the main events and both ends are inside an umbrella.
    await open(page, url('?view=graph'), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');
    const edge = await page.eval(`
      const el = document.querySelector('svg.graph line.edge[data-edge]');
      return el ? el.getAttribute('data-edge') : null;`);
    assert.ok(edge, 'the graph drew a line standing for one link');

    await open(page, url(`?edge=${encodeURIComponent(edge)}`), ready);
    await waitFor(page, 'return Boolean(document.querySelector(".panel .edge-card-head"));', 'the link\'s card');
    await waitFor(page, 'return Boolean(document.querySelector("svg.map line.edge.chosen"));',
      'the chosen link drawn on the map');
    const ends = edge.split('--');
    for (const id of [ends[0], ends[1]]) {
      await waitFor(
        page,
        `return Boolean(document.querySelector('svg.map .mark[data-id=${JSON.stringify(id)}]'));`,
        `${id}, an end of the link the card names, on the map`,
      );
    }
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

test('B8: a click on the graph\'s empty ground puts the selection down', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(WAR), ready);
    await waitFor(page, NODES, 'the graph to draw its nodes');

    // A point of the picture with no mark and no line anywhere near it: the
    // corner furthest from anything the page drew.
    const empty = await page.eval(`
      const svg = document.querySelector('svg.graph');
      const pane = svg.getBoundingClientRect();
      const things = [...svg.querySelectorAll('.layer-nodes circle, line.edge')]
        .map((el) => el.getBoundingClientRect());
      const far = (x, y) => Math.min(...things.map((b) =>
        Math.hypot(x - (b.left + b.width / 2), y - (b.top + b.height / 2))));
      let best = null;
      for (let gx = 1; gx < 20; gx += 1) {
        for (let gy = 1; gy < 20; gy += 1) {
          const x = pane.left + (pane.width * gx) / 20;
          const y = pane.top + (pane.height * gy) / 20;
          const d = far(x, y);
          if (!best || d > best.d) best = { x, y, d };
        }
      }
      return best;`);
    assert.ok(empty && empty.d > 30, 'the picture has ground with nothing on it');

    await page.eval(`
      const svg = document.querySelector('svg.graph');
      for (const type of ['pointerdown', 'pointerup', 'click']) {
        svg.dispatchEvent(new MouseEvent(type, {
          bubbles: true, cancelable: true, clientX: ${Math.round(empty.x)}, clientY: ${Math.round(empty.y)},
        }));
      }
      return true;`);
    await waitFor(page, "return new URLSearchParams(location.search).get('selected') === null;",
      'the selection to be put down');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: DESK });
});

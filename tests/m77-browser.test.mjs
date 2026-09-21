// M77 on a real page: the graph under a narrative, the timeline's titles, and
// the grouping's absence.
//
// The brief's seven tests. Nothing here pins a count or a pixel: what is
// asserted is that every step of the walk is named in full, that nothing else
// is named until the pointer asks, that no title on the timeline is missing
// and no `+n` is drawn, that a bar with children opens and a click gives the
// picture back, and that a retired `?group=` opens the atlas and breaks
// nothing.
//
// Headless Chromium over its own DevTools protocol, as the rest of the browser
// suite: no Puppeteer, no Playwright, no npm. A machine with no browser skips.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withBrowser, open, seenIntro, waitFor, until, watchErrors, errorsOn, skip,
} from './browser.mjs';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });

// The narrative the owner's screenshot was taken on: twenty-eight steps, and
// the longest walk the atlas holds.
const WALK = 'who-was-buying';
const GRAPH_DRAWN = 'return document.querySelector("svg.graph circle.node") !== null;';
const BARS_DRAWN = 'return document.querySelectorAll("#timeline text.bar-label").length > 0;';

// Every label the graph has drawn, and every mark, with what each mark is
// called. The name is the mark's own title, which carries the whole of it
// however the label was placed.
const GRAPH = `
  const svg = document.querySelector('svg.graph');
  const nameOf = (mark) => {
    const t = mark.querySelector('title');
    return (t ? t.textContent : '').split(' \\u2014 ')[0];
  };
  const shown = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.02;
  };
  const labels = [...svg.querySelectorAll('text.node-label')].filter(shown);
  const marks = [...svg.querySelectorAll('circle.node[data-id]')];
  const walk = marks.filter((m) => m.classList.contains('of-narrative'));
  const drawn = new Set(labels.map((l) => l.textContent));
  return {
    labels: labels.map((l) => l.textContent),
    truncated: labels.filter((l) => (l.textContent || '').includes('\\u2026')).map((l) => l.textContent),
    walk: walk.map(nameOf),
    unnamedWalk: walk.map(nameOf).filter((n) => n && !drawn.has(n)),
    offWalkNamed: marks.filter((m) => !m.classList.contains('of-narrative') && drawn.has(nameOf(m)))
      .map(nameOf),
    notes: [...document.querySelectorAll('.graph-area p')]
      .filter((p) => !p.hidden).map((p) => p.textContent),
    legend: Boolean(document.querySelector('.graph-key')),
    exportable: Boolean(document.querySelector('.graph-area [data-export], .graph-area button')),
  };`;

// What the two tests below wait for, which is what they go on to assert:
// every step of the walk carries its own name and has it drawn as a label.
// `nameOf` and `drawn` are `GRAPH`'s own, said again as a predicate — a bar or
// a mark whose century has not landed carries the interface saying it is still
// loading, which is a name no label is ever drawn with (src/attributes.js).
const WALK_NAMED = `
  const svg = document.querySelector('svg.graph');
  if (!svg) return false;
  const walk = [...svg.querySelectorAll('circle.node.of-narrative')];
  if (walk.length < 2) return false;
  const drawn = new Set([...svg.querySelectorAll('text.node-label')].map((l) => l.textContent));
  return walk.every((m) => {
    const t = m.querySelector('title');
    const name = (t ? t.textContent : '').split(' \\u2014 ')[0];
    return Boolean(name) && drawn.has(name);
  });`;

// 1 and 2, on one page: the walk is named in full, and nothing else is named.
test('with a narrative open every step is named in full, and nothing is cut', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(`?view=graph&narrative=${WALK}`), GRAPH_DRAWN);
    await waitFor(page, 'return document.querySelectorAll("svg.graph circle.node.of-narrative").length > 0;', 'the walk to be drawn');
    // The walk's own names arrive with their century. The wait was the count of
    // the walk's marks being the same on two polls 50 ms apart — a count that
    // is the same number on either side of a shard landing, and that is settled
    // the moment the lens is built and long before it is named. What it waits
    // for now is the thing the next lines assert: every step carries its own
    // name, and that name is drawn as a label. `until` and not `waitFor`, so a
    // step that never gets one is reported by the assertion, which says which.
    await until(page, WALK_NAMED);

    const seen = await page.eval(GRAPH);
    assert.ok(seen.walk.length > 1, `the walk is drawn (${seen.walk.length} steps)`);
    assert.deepEqual(seen.unnamedWalk, [], 'every step of the walk carries its name');
    assert.deepEqual(seen.truncated, [], 'and no label on the page is cut');
    assert.deepEqual(await errorsOn(page), []);
  });
});

test('with a narrative open nothing outside the walk is named until it is hovered', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url(`?view=graph&narrative=${WALK}`), GRAPH_DRAWN);
    // The walk first, and not merely a label: a narrative's steps arrive with
    // their century, and until they do there is no lens — the picture is the
    // resting one, where the heaviest marks *are* named and this test would be
    // asking the wrong question of the right page.
    await waitFor(page, 'return document.querySelectorAll("svg.graph circle.node.of-narrative").length > 0;', 'the walk');
    await waitFor(page, 'return document.querySelectorAll("svg.graph text.node-label").length > 0;', 'the labels');

    const seen = await page.eval(GRAPH);
    assert.deepEqual(seen.offWalkNamed, [],
      'the neighbourhood is there to be found, not to be read');

    // And the pointer is how it is found: the name of a mark outside the walk
    // appears while the pointer is on it, and goes when it moves off.
    const hovered = await page.eval(`
      const svg = document.querySelector('svg.graph');
      const mark = [...svg.querySelectorAll('circle.node[data-id]')]
        .find((m) => !m.classList.contains('of-narrative'));
      if (!mark) return null;
      const box = mark.getBoundingClientRect();
      const at = (x, y) => svg.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true, clientX: x, clientY: y, pointerId: 1,
      }));
      at(box.left + box.width / 2, box.top + box.height / 2);
      const on = svg.querySelectorAll('.layer-hover text').length;
      const text = on ? svg.querySelector('.layer-hover text').textContent : null;
      svg.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerId: 1 }));
      const off = svg.querySelectorAll('.layer-hover text').length;
      const title = mark.querySelector('title');
      return { on, off, text, title: title ? title.textContent : null };`);
    assert.ok(hovered, 'there is a mark outside the walk to point at');
    assert.equal(hovered.on, 1, `the pointer names it (${hovered.title})`);
    assert.ok(hovered.title.startsWith(hovered.text), 'with the name the mark carries');
    assert.equal(hovered.off, 0, 'and moving off takes the name away');
    assert.ok(hovered.title, 'the mark carries the whole of its name either way');

    assert.deepEqual(await errorsOn(page), []);
  });
});

test('the graph carries no note about the map\'s viewport, and keeps its legend', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    // With a box in force, which is the state the note was drawn in and is
    // what the map publishes after any pan or zoom.
    await open(page, url('?view=graph&bbox=-60,-35,-30,10'), GRAPH_DRAWN);
    const seen = await page.eval(GRAPH);
    for (const note of seen.notes) {
      assert.doesNotMatch(note, /viewport/i, `a note about the viewport: ${note}`);
      assert.doesNotMatch(note, /looking at part of the world/i, `a note about the map: ${note}`);
    }
    assert.equal(seen.legend, true, 'the key to the lines stays');
    assert.equal(
      await page.eval('return [...document.querySelectorAll(".graph-area button")].some((b) => /export/i.test(b.textContent));'),
      true,
      'and so does Export this view',
    );
  });
});

// --- the timeline ----------------------------------------------------------

const TIMELINE = `
  const svg = document.querySelector('#timeline svg.timeline');
  const bars = [...svg.querySelectorAll('rect.bar[data-id], .layer-held rect[data-id]')];
  const labels = [...svg.querySelectorAll('text.bar-label')];
  const drawn = new Set(labels.map((l) => l.textContent));
  const nameOf = (bar) => {
    const t = bar.querySelector('title');
    return t ? t.textContent.split(' \\u2014 ')[0] : null;
  };
  return {
    bars: bars.map((b) => b.getAttribute('data-id')),
    unnamed: bars.filter((b) => { const n = nameOf(b); return n && !drawn.has(n); })
      .map((b) => b.getAttribute('data-id')),
    badges: svg.querySelectorAll('text.cluster-count').length,
    stacks: svg.querySelectorAll('rect.bar.stack').length,
    rings: svg.querySelectorAll('rect.ring').length,
  };`;

test('every bar on the resting timeline carries its title, and no +N is drawn', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=timeline'), BARS_DRAWN);
    await waitFor(page, `
      const n = document.querySelectorAll('#timeline text.bar-label').length;
      if (window.__n === n && n > 0) return true;
      window.__n = n;
      return false;`, 'the titles to settle');

    const seen = await page.eval(TIMELINE);
    assert.ok(seen.bars.length > 1, `the timeline drew bars (${seen.bars.length})`);
    assert.deepEqual(seen.unnamed, [], 'every bar carries its title');
    assert.equal(seen.badges, 0, 'no +N badge exists');
    assert.equal(seen.stacks, 0, 'and nothing is drawn as a stack');
    assert.deepEqual(await errorsOn(page), []);
  });
});

test('clicking a bar with children narrows the timeline to it and them, and one click returns', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // The fixtures, whose one parent is `fixture-event-f` with two children.
    await open(page, url('?view=timeline&fixtures=1'), BARS_DRAWN);
    const rest = await page.eval(TIMELINE);
    assert.ok(rest.rings > 0, 'the parent says it can be opened');
    assert.ok(rest.bars.includes('fixture-event-f'), 'and it is on the resting timeline');
    assert.ok(rest.bars.length > 3, `with the rest of the main events (${rest.bars.length})`);

    await page.eval(`
      document.querySelector('#timeline rect[data-id="fixture-event-f"]')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;`);
    await waitFor(page, 'return location.search.includes("selected=fixture-event-f");', 'the umbrella to open');
    await waitFor(page, `
      const n = document.querySelectorAll('#timeline rect[data-id]').length;
      if (window.__open === n && n > 0) return true;
      window.__open = n;
      return false;`, 'the narrowed picture');

    const opened = await page.eval(TIMELINE);
    assert.ok(opened.bars.length < rest.bars.length,
      `narrower than the resting picture (${opened.bars.length} of ${rest.bars.length})`);
    for (const id of ['fixture-event-f', 'fixture-event-h', 'fixture-event-t']) {
      assert.ok(opened.bars.includes(id), `${id} is drawn: the umbrella and what happened during it`);
    }
    assert.deepEqual(opened.unnamed, [], 'each of them titled');

    // And back in one click, on the empty ground under the bars.
    await page.eval(`
      const svg = document.querySelector('#timeline svg.timeline');
      const box = svg.getBoundingClientRect();
      svg.dispatchEvent(new MouseEvent('click', {
        bubbles: true, clientX: box.left + 6, clientY: box.bottom - 6,
      }));
      return true;`);
    await waitFor(page, 'return !location.search.includes("selected=");', 'the picture to come back');
    const back = await page.eval(TIMELINE);
    assert.equal(back.bars.length, rest.bars.length, 'the resting picture is back');
    assert.deepEqual(await errorsOn(page), []);
  });
});

// --- the grouping is gone --------------------------------------------------

test('there is no grouping control, and an old ?group= link opens the atlas', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?view=timeline&group=actor&lanes=salazar,pide'), BARS_DRAWN);

    const seen = await page.eval(`return {
      picker: document.querySelectorAll('[data-grouping], .grouping-button, .grouping-panel, .grouping-lane').length,
      grouping: document.querySelectorAll('.grouping, #grouping').length,
      chips: Boolean(document.querySelector('.lens-chips')),
      laneLabels: document.querySelectorAll('#timeline text.lane-label').length,
      rows: document.querySelectorAll('#timeline rect.lane').length,
      bars: document.querySelectorAll('#timeline rect[data-id]').length,
      search: location.search,
    };`);
    assert.equal(seen.picker, 0, 'no grouping control in the document');
    assert.equal(seen.grouping, 0, 'and nothing left standing where it was');
    assert.equal(seen.chips, true, 'the lens chips are not the grouping and stay');
    assert.equal(seen.laneLabels, 0, 'the rows are the default arrangement, unnamed');
    assert.ok(seen.rows > 0 && seen.bars > 0, 'and the timeline drew them');
    assert.doesNotMatch(seen.search, /group=/, 'the parameter is read into nothing');
    assert.doesNotMatch(seen.search, /lanes=/);
    assert.deepEqual(await errorsOn(page), [], 'and no error');
  });
});

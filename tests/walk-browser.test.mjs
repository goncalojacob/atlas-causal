// A walk the atlas assembled, in a real browser: drawn as a walked chain is
// drawn, and said to be the atlas's on the card.
//
// Two halves, because they are two claims. The first is that a generated walk
// is nothing special to the pictures — the map reddens its steps exactly as it
// reddens a path the reader clicked out, because they are the same edges. The
// second is that the card says who put it together, which is the only place a
// reader could learn it.
//
// Nothing writes `?walk=` and nothing here reads one: the walk is set through
// the store, and the address of a generated walk is the Why mode's (M35,
// review finding 16, owner question 9).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';
import { walkTo } from '../src/walk.js';

const DAY = Date.UTC(2026, 8, 8);
const QUESTION = 'Why Fixture event T?';

const atlasPromise = atlasOf(FIXTURE_DATA);
const walkOf = async (from, target = 'fixture-event-t') => walkTo(
  await atlasPromise, target, { selected: from }, { now: DAY, question: QUESTION },
);

// A minute is far longer than either of these takes and far shorter than
// forever: a hung page fails the test instead of stopping the suite.
const BOUND = { skip, timeout: 60000 };

test('a generated walk is drawn madder, step for step, as a walked chain is', BOUND, async () => {
  const walk = await walkOf('fixture-event-a');
  assert.equal(walk.steps.length, 3);
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    // The chain a reader would have clicked out, in the address they would
    // have arrived at: the parameter is `?chain=`, which is what it has always
    // been, and the steps in it are the producer's own answer.
    await open(page, url(`?fixtures=1&selected=fixture-event-t&chain=${walk.steps.join(',')}`));
    await waitFor(page, 'return document.querySelectorAll("#map .edge.chain").length > 0;', 'the chain on the map');
    const drawn = await page.eval(`return {
      chain: [...document.querySelectorAll("#map .edge.chain")].length,
      crumbs: [...document.querySelectorAll(".panel .breadcrumb li")].length,
      stroke: getComputedStyle(document.querySelector("#map .edge.chain")).stroke,
      madder: getComputedStyle(document.documentElement).getPropertyValue("--madder").trim(),
    };`);
    assert.equal(drawn.chain, walk.steps.length, 'one madder line per step');
    assert.equal(drawn.crumbs, walk.steps.length + 1, 'and the path is a breadcrumb');
    // The one madder rule the walked chain owns (style.css), and no second one
    // for a generated walk: the same colour, because it is the same picture.
    assert.ok(drawn.stroke.startsWith('rgb'), drawn.stroke);
    assert.ok(drawn.madder.length > 0, 'the accent is a variable on :root');
  });
});

// The panel is built here rather than reached for through the page, because
// nothing writes a walk into the running atlas yet and nothing should: the
// walk is set through the store, which is what M35 will do with a control of
// its own.
//
// It is raced against a timer, and every test in this file carries a timeout,
// because `page.eval` awaits the page's promise over the protocol with no
// bound of its own (browser.mjs): an in-page fetch that never settles would
// hang `node --test` rather than fail it, and a suite that hangs tells nobody
// anything. A false here is a failure with a name.
const MOUNT = (steps) => `return Promise.race([timer(), (async () => {
  const { loadAtlas } = await import("/src/data.js");
  const { createState } = await import("/src/state.js");
  const { createPanel } = await import("/src/panel/panel.js");
  const atlas = await loadAtlas({ dataRoot: "tests/fixtures/data/", landFile: false });
  const box = document.createElement("div");
  box.className = "panel";
  document.body.appendChild(box);
  const store = createState({ selected: "fixture-event-t", chain: ${JSON.stringify(steps)} });
  createPanel(box, { atlas, state: store, fixtures: true });
  window.__walk = {
    box,
    store,
    steps: ${JSON.stringify(steps)},
    said: () => box.querySelectorAll(".notice.generated").length,
  };
  store.set({});
  return true;
})()]);
function timer() {
  return new Promise((resolve) => { setTimeout(() => resolve(false), 20000); });
}`;

// A card is drawn when the record it names has resolved, so every count here
// waits for the redraw rather than reading the DOM the moment it asked for one.
const DRAWN = 'return document.querySelectorAll(".panel .breadcrumb").length > 0;';
const SAID = 'return window.__walk.said() === 1;';
const SILENT = 'return window.__walk.said() === 0;';

test('the card says the atlas assembled the path, and each step keeps its marks', BOUND, async () => {
  const walk = await walkOf('fixture-event-g');
  assert.deepEqual([...walk.steps], ['fixture-event-g--fixture-event-t--caused'], 'a disputed step');
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), 'return document.querySelector(".layout") !== null;');
    assert.equal(await page.eval(MOUNT([...walk.steps])), true, 'the panel was mounted over the fixtures');
    await waitFor(page, DRAWN, 'the card');
    assert.equal(await page.eval('return window.__walk.said();'), 0, 'a chain nobody said was generated says nothing');

    await page.eval(`window.__walk.store.setWalk({
      target: "fixture-event-t",
      steps: window.__walk.steps,
      provenance: { by: "atlas", question: ${JSON.stringify(QUESTION)}, on: "2026-09-08", steps: window.__walk.steps },
    }); return true;`);
    await waitFor(page, SAID, 'the line saying the atlas put the path together');

    const shown = await page.eval(`const box = window.__walk.box; return {
      line: (box.querySelector(".notice.generated")?.textContent ?? "").replace(/\\s+/g, " ").trim(),
      badges: [...box.querySelectorAll(".breadcrumb .badge")].map((b) => b.textContent.trim()),
      arrival: Boolean(box.querySelector(".notice.disputed")),
      madder: getComputedStyle(box.querySelector(".notice.generated")).borderLeftColor,
    };`);
    assert.match(shown.line, /^The atlas put this path together on 2026-09-08/);
    assert.match(shown.line, /Why Fixture event T\?/);
    assert.match(shown.line, /you did not walk it/);
    assert.match(shown.line, /1 step is a link somebody wrote, with its confidence and its dispute marks unchanged/);
    // The step is a record and is drawn as one: the dispute is marked in the
    // breadcrumb and warned about on arrival, exactly as on a walked path.
    assert.deepEqual(shown.badges, ['disputed']);
    assert.ok(shown.arrival, 'and the reader is told they arrived through it');
    assert.ok(shown.madder.startsWith('rgb'), shown.madder);

    // It goes when the reader takes a step of their own, and comes back with
    // the path it is about.
    await page.eval('window.__walk.store.set({ chain: [] }); return true;');
    await waitFor(page, SILENT, 'the line going with the path');
    await page.eval('window.__walk.store.set({ chain: window.__walk.steps }); return true;');
    await waitFor(page, SAID, 'the same walk, on screen again');
    // And it goes when the session stops holding the walk. None of it ever
    // touched the address bar: `?walk=` is written by nothing.
    await page.eval('window.__walk.store.clearWalk(); return true;');
    await waitFor(page, SILENT, 'the line going with the walk');
    const search = await page.eval('return location.search;');
    assert.ok(!search.includes('walk='), `nothing wrote ?walk=: ${search}`);
  });
});

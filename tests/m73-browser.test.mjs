// M73 in a real browser: how sure the atlas is, on the line itself.
//
// The half of the milestone that cannot be had from the stylesheet's text.
// What `tests/m73.test.mjs` can say is that one module decides what a
// confidence looks like and that the rules spend only vocabulary style.css
// already declares. What needs a page is whether three confidences actually
// come out as three different lines, and whether the graph's line and the
// map's line for **one record** are inked alike — which is the whole of the
// brief's "no two pictures can disagree about which link is the shaky one".
//
// The assertions are about computed style and never about a class: a line
// wearing `confidence-disputed` and drawn exactly like its neighbour would
// pass a class-name test and fail a reader. Locating an element by its class
// is how the element is found; what is asserted of it is what the browser
// resolved.
//
// Written before the rules they judge (deviations 711 and 717). No test here
// pins a count: the fixtures' edges are addressed by id and by confidence,
// never by how many of each there are.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, seenIntro, watchErrors, errorsOn, skip } from './browser.mjs';
import { CONFIDENCE_ORDER, CONFIDENCE_CLASS } from '../src/confidence.js';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });

const GRAPH_READY = 'return Boolean(document.querySelector(".graph .edge"));';
const MAP_CHAIN_READY = 'return Boolean(document.querySelector(".map .edge.chain"));';

// The fixtures hold all three confidences already, so this milestone writes
// no record to be able to see itself (m73-brief, §3). `t` is a part of `f`,
// so it is not in the picture at rest: opening it is what brings its own
// links — one of each confidence among them — into view.
const TARGET = 'fixture-event-t';
const DISPUTED = 'fixture-event-g--fixture-event-t--caused';
const CONSENSUS = 'fixture-event-a--fixture-event-b--caused';

// How solidly a line is inked, as the browser resolved it. `stroke-opacity`
// and not `opacity`, because the emphasis states own `opacity` and the two
// are meant to multiply rather than overwrite each other.
const inkOf = (selector) => `
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const s = getComputedStyle(el);
  return { ink: Number(s.strokeOpacity), dash: s.strokeDasharray, width: s.strokeWidth };`;

// One drawn edge per confidence, found by the class the module spells and
// reported by what the browser made of it.
const inkPerConfidence = (classes) => `
  const out = {};
  for (const [confidence, klass] of ${JSON.stringify(Object.entries(classes))}) {
    const el = document.querySelector('.graph .edge.' + klass);
    if (!el) { out[confidence] = null; continue; }
    const s = getComputedStyle(el);
    out[confidence] = { ink: Number(s.strokeOpacity), dash: s.strokeDasharray, width: s.strokeWidth };
  }
  return out;`;

test('three confidences are three visibly different lines on the graph', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?fixtures=1&view=graph&selected=${TARGET}`), GRAPH_READY);
    await seenIntro(page);
    const drawn = await page.eval(inkPerConfidence(CONFIDENCE_CLASS));
    for (const confidence of CONFIDENCE_ORDER) {
      assert.ok(drawn[confidence], `a ${confidence} link is drawn`);
    }
    const inks = CONFIDENCE_ORDER.map((c) => drawn[c].ink);
    assert.equal(new Set(inks).size, inks.length, 'three lines, not two wearing three names');
    for (let i = 1; i < inks.length; i += 1) {
      assert.ok(inks[i] < inks[i - 1], `${CONFIDENCE_ORDER[i]} is fainter than ${CONFIDENCE_ORDER[i - 1]}`);
      assert.ok(
        inks[i - 1] - inks[i] >= 0.2,
        `${CONFIDENCE_ORDER[i - 1]} and ${CONFIDENCE_ORDER[i]} are far enough apart to be told apart`,
      );
    }
    assert.deepEqual(await errorsOn(page), []);
  });
});

test('confidence takes none of the dash the type is told apart by', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    // The disputed link in the fixtures is a `caused` one, and `caused` is
    // the unbroken line. Before M73 a disputed edge was dashed whatever its
    // type, so this very link was drawn as something the type key calls
    // `enabled`; the dash is the type's again and the doubt is said in ink.
    await open(page, url(`?fixtures=1&view=graph&selected=${TARGET}&chain=${DISPUTED}`), GRAPH_READY);
    await seenIntro(page);
    const line = await page.eval(inkOf('.graph .edge.chain'));
    assert.ok(line, 'the walked step is drawn');
    assert.ok(
      line.dash === 'none' || line.dash === '',
      `a disputed \`caused\` link is still unbroken, not ${line.dash}`,
    );
    assert.deepEqual(await errorsOn(page), []);
  });
});

// The brief's second test: one record, both pictures, the same ink. Run over
// a disputed link and a consensus one, so that agreement is not two views
// happening to draw everything alike.
for (const [what, edge] of [['disputed', DISPUTED], ['consensus', CONSENSUS]]) {
  test(`the map's walk line and the graph's edge for one ${what} record agree`, { skip }, async () => {
    const query = `?fixtures=1&selected=${TARGET}&chain=${edge}`;
    const onMap = await desk(async (page, url) => {
      await watchErrors(page);
      await open(page, url(query), MAP_CHAIN_READY);
      await seenIntro(page);
      const line = await page.eval(inkOf('.map .edge.chain'));
      assert.deepEqual(await errorsOn(page), []);
      return line;
    });
    const onGraph = await desk(async (page, url) => {
      await watchErrors(page);
      await open(page, url(`${query}&view=graph`), GRAPH_READY);
      await seenIntro(page);
      const line = await page.eval(inkOf('.graph .edge.chain'));
      assert.deepEqual(await errorsOn(page), []);
      return line;
    });
    assert.ok(onMap, 'the map draws the walked step');
    assert.ok(onGraph, 'the graph draws the walked step');
    assert.equal(
      onGraph.ink, onMap.ink,
      'the same link is as sure on one picture as on the other',
    );
  });
}

test('the graph key says what the difference in ink means', { skip }, async () => {
  await desk(async (page, url) => {
    await watchErrors(page);
    await open(page, url('?fixtures=1&view=graph'), GRAPH_READY);
    await seenIntro(page);
    const key = await page.eval(`
      const row = [...document.querySelectorAll('.graph-key .edge-key dd')]
        .find((dd) => /how sure/i.test(dd.textContent));
      if (!row) return null;
      const samples = [...row.previousElementSibling.querySelectorAll('line')]
        .map((el) => Number(getComputedStyle(el).strokeOpacity));
      return { text: row.textContent, samples };`);
    assert.ok(key, 'the key has a line about how sure the atlas is');
    for (const confidence of CONFIDENCE_ORDER) {
      assert.match(key.text, new RegExp(confidence, 'i'), `the key names ${confidence}`);
    }
    // Drawn with the very classes the edges are drawn with, so the key cannot
    // come to disagree with the picture — the rule the type key already keeps.
    assert.equal(new Set(key.samples).size, CONFIDENCE_ORDER.length, 'and shows each of them');
    assert.deepEqual(await errorsOn(page), []);
  });
});

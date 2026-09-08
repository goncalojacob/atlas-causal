// The graph view's level of detail in a real browser. layout.js is held to
// the arithmetic by tests of its own, which is the part that can be checked
// without one; what needs a browser is whether the drawing actually carries
// it — whether the circles on the page are the stacks and not the events,
// whether the badges say how many are underneath, and whether the selection
// is on a mark of its own rather than inside one.
//
// Headless Chromium's own command line, with --dump-dom: no Puppeteer, no
// Playwright, no npm, which is the rule for this repository. A machine with
// no browser is not a broken repository, so these skip rather than fail —
// tools/screens.mjs takes the same view.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { createServer, HOST } from '../tools/serve.mjs';
import { findChrome } from '../tools/screens.mjs';
import { ROOT, corpusOf } from './helpers.mjs';
import { withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn } from './browser.mjs';
import { LOADING_LABEL } from '../src/attributes.js';

const chrome = findChrome();
const skip = chrome ? false : 'no headless browser found; set $CHROME to one';

function dumpDom(bin, url) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [
      '--headless', '--disable-gpu', '--no-sandbox',
      // The browser advances its own clock, so this is a budget and not a
      // sleep: enough for the topology, the land and two typefaces.
      '--virtual-time-budget=20000',
      '--dump-dom', url,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (c) => { out += c; });
    child.stderr.on('data', (c) => { err += c; });
    child.on('error', reject);
    child.on('close', (status) => (status === 0 ? resolve(out) : reject(new Error(`chrome exited ${status}\n${err}`))));
  });
}

// The port has to be known before the server is created, because it refuses
// a Host whose port is not its own: take an ephemeral one, give it back,
// start the real server on that number. As tests/entry-browser.test.mjs does.
async function withServer(fn) {
  const probe = createServer({ port: 0 });
  await new Promise((resolve) => probe.listen(0, HOST, resolve));
  const { port } = probe.address();
  probe.close();
  await new Promise((resolve) => probe.once('close', resolve));

  const server = createServer({ port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));
  try {
    return await fn((query) => `http://${HOST}:${port}/${query}`);
  } finally {
    server.close();
    await new Promise((resolve) => server.once('close', resolve));
  }
}

// The page carries three pictures and the timeline stacks its bars too, so
// everything below is counted inside the graph's own <svg> and nowhere else.
function graphOf(dom) {
  assert.doesNotMatch(dom, /Could not load the atlas/);
  const start = dom.indexOf('<svg class="graph" ');
  assert.ok(start > 0, 'the graph view is on the page');
  const end = dom.indexOf('</svg>', dom.indexOf('layer layer-labels', start));
  assert.ok(end > start, 'and it is closed');
  return dom.slice(start, end);
}

const count = (text, re) => (text.match(re) ?? []).length;
// The attributes come out in the order the drawing set them, which is not
// the order they are read in here: every pattern below looks past them.
const marks = (graph) => count(graph, /<circle[^>]*class="node[ "]/g);
const stacks = (graph) => count(graph, /<circle[^>]*class="node stack[ "]/g);
const badges = (graph) => [...graph.matchAll(/class="cluster-count[^"]*"[^>]*>\+(\d+)</g)].map((m) => Number(m[1]));

// How many events the graph would draw one node each for, straight from the
// index the browser reads: the number the marks and the badges have to add
// back up to.
async function activeEvents() {
  // Rows over an id table since I2, read back the way the browser reads them:
  // the core, and the attribute shards filled into it (I4b). `status` is a core
  // column, so the count is the core's own answer either way — reading the
  // whole of it is what keeps this helper honest about what the index holds.
  const corpus = await corpusOf(path.join(ROOT, 'data'));
  return corpus.events.filter((e) => e.status === 'active').length;
}

test('at the default zoom the graph draws stacks, and they add up to the events', { skip }, async () => {
  const events = await activeEvents();
  const dom = await withServer((url) => dumpDom(chrome, url('?view=graph')));
  const graph = graphOf(dom);
  const drawn = marks(graph);
  const hidden = badges(graph);
  assert.ok(drawn < events, `${drawn} marks for ${events} events`);
  assert.equal(stacks(graph), hidden.length, 'every stack carries a badge and nothing else does');
  assert.ok(hidden.length > 0, 'and there are stacks to carry one');
  // The promise the badges make: nothing has been dropped from the picture,
  // only folded into it.
  assert.equal(drawn + hidden.reduce((a, b) => a + b, 0), events);
  for (const n of hidden) assert.ok(n >= 1, 'a badge never says +0');
});

test('grouping into bands crowds the picture, and more of it merges', { skip }, async () => {
  const events = await activeEvents();
  const [plain, banded] = await withServer(async (url) => [
    graphOf(await dumpDom(chrome, url('?view=graph'))),
    graphOf(await dumpDom(chrome, url('?view=graph&group=region'))),
  ]);
  assert.ok(stacks(banded) > stacks(plain), `${stacks(banded)} stacks in bands, ${stacks(plain)} without`);
  for (const graph of [plain, banded]) {
    assert.equal(marks(graph) + badges(graph).reduce((a, b) => a + b, 0), events);
  }
});

test('a merged line carries its count and its type; a single one is unchanged', { skip }, async () => {
  const dom = await withServer((url) => dumpDom(chrome, url('?view=graph&group=region')));
  const graph = graphOf(dom);
  const merged = [...graph.matchAll(/<line[^>]*class="edge ([^"]*merged[^"]*)"[^>]*style="--merged-width: ([\d.]+)"/g)];
  assert.ok(merged.length > 0, 'the banded picture merges some lines');
  for (const [, cls, width] of merged) {
    assert.match(cls, /type-(caused|enabled|reacted-to|precondition-of|inspired)/, 'in one of the five types');
    assert.ok(Number(width) > 1.6, `a merged line is drawn heavier: ${width}`);
  }
  // A line carrying one link says nothing about a count and keeps the width
  // its type asks for.
  assert.ok(count(graph, /<line[^>]*class="edge /g) > merged.length);
  assert.doesNotMatch(graph.replace(/style="--merged-width: [\d.]+"/g, ''), /--merged-width/);
});

test('the selected event and its chain are never inside a stack', { skip }, async () => {
  const events = await activeEvents();
  const dom = await withServer((url) => dumpDom(chrome, url('?view=graph&selected=carnation-revolution-1974')));
  const graph = graphOf(dom);
  // Its own mark, drawn last so it is on top, and not a stack. It is on the
  // walked path as well as selected, so the class carries both.
  assert.match(graph, /<circle[^>]*class="node(?: [a-z-]+)* selected"/);
  assert.doesNotMatch(graph, /<circle[^>]*class="node stack[^"]*selected/);
  // Holding the selection and everything drawn at it out of the grouping
  // leaves fewer stacks than the same picture with nothing selected.
  const plain = graphOf(await withServer((url) => dumpDom(chrome, url('?view=graph'))));
  assert.ok(stacks(graph) < stacks(plain), `${stacks(graph)} stacks with a selection, ${stacks(plain)} without`);
  assert.equal(marks(graph) + badges(graph).reduce((a, b) => a + b, 0), events);
});

// R7: o grafo aberto numa janela estreita. `fitToWindow` só atribui
// `transform` quando a janela é uma fracção da extensão, de modo que a janela
// por omissão nunca lá chegava e nenhum teste via a excepção; um passo de
// narrativa e um `?from=&to=` partilhado chegam sempre. Estes dois abrem-no
// pelo caminho real — o browser conduzido, não `--dump-dom`, porque o que se
// afirma é que a consola ficou limpa.
const drawnGraph = 'return document.querySelectorAll("svg.graph .layer-nodes circle").length;';

test('a narrow window opens the graph without throwing', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?from=1970&to=1980&view=graph'), drawnGraph);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
    assert.ok(await page.eval(drawnGraph), 'and the graph has nodes on the page');
  });
});

test('a narrative step opens the graph without throwing', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?narrative=how-the-colonial-war-ended-the-regime&step=3&view=graph'), drawnGraph);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
    assert.ok(await page.eval(drawnGraph), 'and the graph has nodes on the page');
  });
});

// --- the semantic level of detail ------------------------------------------
//
// M30b-2, A7: below `COLLAPSE_ZOOM` an event's parts are drawn inside it, and
// at or above it they are drawn one node each. No event in `data/` is inside
// another yet, so this is on the fixtures, where `fixture-event-f` holds two.
const NODE = (id) => `return Boolean(document.querySelector('svg.graph circle.node[data-id="${id}"]'));`;

// The collapse itself is the core's: `parent` and `subtreeWeight` are core
// columns (spine.js, `CORE_BY_KIND`), so the ring, the badge and the weight
// are right on the first frame. What waits is the *name*, which arrives with
// the century (I4a) and puts the graph's node titles back on when it lands.
// So this waits for the title rather than for a duration — the assertions
// below are about the drawing, not about how fast a shard is fetched (R3).
const TITLED = (id) => `
  const el = document.querySelector('svg.graph circle.node[data-id="${id}"]');
  const title = el && el.querySelector('title');
  return Boolean(title) && title.textContent !== ${JSON.stringify(LOADING_LABEL)};`;

test('a parent holds its parts at the default zoom and gives them up when the reader zooms in', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url('?fixtures=1&view=graph'), drawnGraph);
    await waitFor(page, TITLED('fixture-event-f'), "the parent's century to land");

    const collapsed = await page.eval(`
      const el = document.querySelector('svg.graph circle.node[data-id="fixture-event-f"]');
      const badge = document.querySelector('svg.graph .cluster-count[data-collapsed="fixture-event-f"]');
      return {
        classes: el ? el.getAttribute('class') : null,
        badge: badge ? badge.textContent : null,
        title: el ? el.querySelector('title').textContent : null,
      };`);
    assert.match(collapsed.classes ?? '', /\bcollapsed\b/, 'the parent says it is holding something');
    assert.equal(collapsed.badge, '+2', 'and how many');
    // The count is counted; the weight is the subtree's, which the index
    // derived. A weight is not a count, so both are said and neither is
    // said twice.
    assert.match(collapsed.title, /2 parts drawn inside it, weight 6/);
    for (const id of ['fixture-event-t', 'fixture-event-h']) {
      assert.equal(await page.eval(NODE(id)), false, `${id} is inside its parent, not beside it`);
    }

    // One notch of the wheel past the threshold, on the graph itself: the
    // parts come back, where they always were.
    await page.eval(`
      const svg = document.querySelector('svg.graph');
      const box = svg.getBoundingClientRect();
      svg.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true, deltaY: -600,
        clientX: box.left + box.width / 2, clientY: box.top + box.height / 2,
      }));
      return true;`);
    await waitFor(page, NODE('fixture-event-t'), 'the parts to be drawn on their own');
    assert.equal(await page.eval(NODE('fixture-event-h')), true, 'both of them');
    const parent = await page.eval(`
      const el = document.querySelector('svg.graph circle.node[data-id="fixture-event-f"]');
      return el ? el.getAttribute('class') : null;`);
    assert.doesNotMatch(parent ?? '', /\bcollapsed\b/, 'and the parent is a node like any other');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

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

// M30c, §1: the collapse above is a *behaviour* — it happens below
// `COLLAPSE_ZOOM` and stops above it — and the ring is the *look*, which the
// parent keeps at every zoom. Before this the reader who had zoomed in far
// enough to see the parts was told nothing about the event holding them.
const RING = `
  const svg = document.querySelector('svg.graph');
  const node = svg.querySelector('circle.node[data-id="fixture-event-f"]');
  if (!node) return { node: null };
  const near = (a, b) => Math.abs(Number(a) - Number(b)) < 0.001;
  const ring = [...svg.querySelectorAll('circle.ring')].find((el) => (
    near(el.getAttribute('cx'), node.getAttribute('cx'))
      && near(el.getAttribute('cy'), node.getAttribute('cy'))
  )) ?? null;
  const style = ring ? getComputedStyle(ring) : null;
  return {
    node: { r: Number(node.getAttribute('r')), classes: node.getAttribute('class') },
    rings: svg.querySelectorAll('circle.ring').length,
    ring: ring === null ? null : {
      r: Number(ring.getAttribute('r')),
      classes: ring.getAttribute('class'),
      id: ring.getAttribute('data-id'),
      fill: style.fill,
      events: style.pointerEvents,
      stroke: Number(ring.getAttribute('stroke-width')),
      sibling: ring.parentNode === node.parentNode,
    },
  };`;

test('a parent keeps its ring at every zoom, collapsed or parted', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url('?fixtures=1&view=graph'), drawnGraph);
    await waitFor(page, TITLED('fixture-event-f'), "the parent's century to land");

    const held = await page.eval(RING);
    assert.match(held.node.classes, /\bcollapsed\b/, 'at this zoom the parts are inside it');
    assert.equal(held.rings, 1, 'one ring, for the one parent on the fixtures');
    assert.ok(held.ring, 'and the parent has it');
    assert.ok(held.ring.sibling, 'beside the node, in the same layer');
    assert.ok(held.ring.r > held.node.r, `outside it: ${held.ring.r} around ${held.node.r}`);
    assert.equal(held.ring.fill, 'none', 'an outline and not a disc');
    assert.equal(held.ring.id, null, 'it names no record, so a click still opens the node');
    assert.equal(held.ring.events, 'none');
    assert.doesNotMatch(held.ring.classes, /\bnode\b/, 'a ring is an outline, not a record');

    // One notch of the wheel past the threshold: the parts come out and the
    // parent stops being collapsed. The ring stays, because it is not about
    // the zoom — it is about the record having parts at all.
    await page.eval(`
      const svg = document.querySelector('svg.graph');
      const box = svg.getBoundingClientRect();
      svg.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true, deltaY: -600,
        clientX: box.left + box.width / 2, clientY: box.top + box.height / 2,
      }));
      return true;`);
    await waitFor(page, NODE('fixture-event-t'), 'the parts to be drawn on their own');
    const parted = await page.eval(RING);
    assert.doesNotMatch(parted.node.classes, /\bcollapsed\b/, 'nothing is folded into it now');
    assert.ok(parted.ring, 'and it is still ringed');
    assert.ok(parted.ring.r > parted.node.r);
    // The stroke is divided by the zoom, so the ring is as thin on the screen
    // at four times in as it is at one, like the labels' halo.
    assert.ok(parted.ring.stroke < held.ring.stroke, `${parted.ring.stroke} against ${held.ring.stroke}`);
    // And the parts themselves are leaves: a ring on a leaf would say there is
    // something inside it that is not there.
    assert.equal(parted.rings, 1, 'still the one ring');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

// --- the viewport cull, and ten notches of the wheel (I6) -------------------
//
// The graph drew every stack of the whole arrangement at every zoom, where
// the map has drawn only what is on screen since H4a: at 20,000 events that
// was 24,310 elements to build and lay out for a picture of which two thirds
// were off the screen, and it is where a wheel notch's time went (STATUS.md,
// "what the graph's notch actually costs"). What is asserted here is what is
// drawn and what is not — never how long it took, which is the bench's
// question and not a test's (R3).

// The rectangle the reader can see, in the graph's own coordinates, read off
// the page the way the view itself reads it: through the element's own
// matrix, because the SVG is letterboxed and the nominal viewBox is not what
// is on the screen. With every node in the drawing, and where it is.
const DRAWING = `
  const svg = document.querySelector('svg.graph');
  const rect = svg.getBoundingClientRect();
  const inverse = svg.getScreenCTM().inverse();
  const a = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
  const b = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);
  // No attribute at all until the first gesture: the picture is at rest.
  const t = /translate\\((-?[\\d.]+) (-?[\\d.]+)\\) scale\\(([\\d.]+)\\)/
    .exec(svg.querySelector('g.viewport').getAttribute('transform') || 'translate(0 0) scale(1)');
  const [tx, ty, k] = [Number(t[1]), Number(t[2]), Number(t[3])];
  const box = {
    x0: (Math.min(a.x, b.x) - tx) / k, x1: (Math.max(a.x, b.x) - tx) / k,
    y0: (Math.min(a.y, b.y) - ty) / k, y1: (Math.max(a.y, b.y) - ty) / k,
  };
  const nodes = [...svg.querySelectorAll('.layer-nodes circle.node')].map((n) => ({
    id: n.getAttribute('data-id'),
    stack: n.classList.contains('stack'),
    selected: n.classList.contains('selected'),
    x: Number(n.getAttribute('cx')), y: Number(n.getAttribute('cy')),
  }));
  return { box, k, nodes, lines: svg.querySelectorAll('.layer-edges line').length };`;

// One notch of the wheel over a point of the drawing, by the element's own
// matrix so the pointer lands where the caller means it to.
const NOTCH_AT = (id, notches = 1) => `
  const svg = document.querySelector('svg.graph');
  const at = svg.querySelector('circle.node[data-id="${id}"]').getBoundingClientRect();
  for (let i = 0; i < ${notches}; i += 1) {
    svg.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true, cancelable: true, deltaY: -100,
      clientX: at.x + at.width / 2, clientY: at.y + at.height / 2,
    }));
  }
  return true;`;

test('a mark outside the rectangle on screen is not drawn, and the selection is drawn wherever it is', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    // The leftmost event of the fixtures is the selected one, and the wheel
    // is turned over the rightmost: ten notches later the selection is a long
    // way off the left of the screen.
    await open(page, url('?fixtures=1&view=graph&selected=fixture-event-a'), drawnGraph);
    await waitFor(page, TITLED('fixture-event-g'), 'the fixtures to be named');
    const rest = await page.eval(DRAWING);
    assert.ok(rest.nodes.length > 4, `the whole picture is drawn at rest (${rest.nodes.length} marks)`);
    assert.ok(rest.nodes.some((n) => n.id === 'fixture-event-a' && n.selected), 'the selection is on a mark of its own');

    // Ten notches, which is the sweep the health review of 6 September timed.
    // The graph is drawn again after every one of them.
    for (let i = 0; i < 10; i += 1) {
      await page.eval(NOTCH_AT('fixture-event-g'));
      const drawn = await page.eval(DRAWING);
      assert.ok(drawn.nodes.length > 0, `notch ${i + 1} still draws a graph`);
      assert.ok(drawn.nodes.some((n) => n.id === 'fixture-event-a' && n.selected),
        `notch ${i + 1} keeps the selection drawn`);
    }

    const close = await page.eval(DRAWING);
    assert.ok(close.k > 4, `ten notches is a long way in (k = ${close.k})`);
    assert.ok(close.nodes.length < rest.nodes.length,
      `and fewer marks are drawn than at rest (${close.nodes.length} of ${rest.nodes.length})`);
    // Everything drawn is on the screen, but for the selection: a mark
    // outside the rectangle is a mark the reader cannot see, and building it
    // was a third of what a notch cost.
    const margin = 18 / close.k;
    const inside = (n) => n.x >= close.box.x0 - margin && n.x <= close.box.x1 + margin
      && n.y >= close.box.y0 - margin && n.y <= close.box.y1 + margin;
    for (const node of close.nodes) {
      if (node.selected) continue;
      assert.ok(inside(node), `${node.id ?? 'a stack'} at ${node.x},${node.y} is inside ${JSON.stringify(close.box)}`);
    }
    const selection = close.nodes.find((n) => n.selected);
    assert.ok(selection, 'the selection is still drawn');
    assert.equal(inside(selection), false, 'and it is off the screen, which is the point of the exemption');
    assert.equal(selection.stack, false, 'drawn alone, as the never-hide rule has it');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('a pane that changes size shows more of the picture, and the drawing follows it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url('?fixtures=1&view=graph'), drawnGraph);
    await waitFor(page, TITLED('fixture-event-g'), 'the fixtures to be named');
    // A few notches in, so that the rectangle on screen is narrower than the
    // arrangement and there is something outside it to draw.
    await page.eval(NOTCH_AT('fixture-event-g', 4));
    const narrow = await page.eval(DRAWING);
    assert.ok(narrow.k > 1.5, `zoomed in (k = ${narrow.k})`);

    // The rectangle is measured once and kept — asking the browser for it
    // inside a notch is a forced layout of the whole picture — so what makes
    // it stale has to say so. A wider window is exactly that.
    await page.send('Emulation.setDeviceMetricsOverride', {
      mobile: false, width: 1900, height: 900, deviceScaleFactor: 1,
    });
    await waitFor(page, 'return innerWidth === 1900;', 'the window to be wide');
    await waitFor(
      page,
      `return document.querySelectorAll('svg.graph .layer-nodes circle.node').length !== ${narrow.nodes.length};`,
      'the graph to be drawn again for the wider pane',
    );
    const wide = await page.eval(DRAWING);
    assert.ok(wide.box.x1 - wide.box.x0 > narrow.box.x1 - narrow.box.x0,
      `the rectangle grew (${wide.box.x1 - wide.box.x0} from ${narrow.box.x1 - narrow.box.x0})`);
    assert.ok(wide.nodes.length > narrow.nodes.length,
      `and more of the picture is drawn (${wide.nodes.length} of ${narrow.nodes.length})`);
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  }, { device: { width: 1280, height: 900, deviceScaleFactor: 1 } });
});

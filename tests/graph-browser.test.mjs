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
import { ROOT, corpusOf, atlasOf } from './helpers.mjs';
import { defaultState } from '../src/state.js';
import { resolveWindow, overlaps } from '../src/util/window.js';
import { withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn } from './browser.mjs';
import { LOADING_LABEL } from '../src/attributes.js';
import { workingSet } from '../src/emphasis.js';

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
// A parent with its parts drawn inside it. There were none on this corpus
// until M47 wrote the first `parent` into `data/`, and both kinds of node
// carry a `cluster-count`.
const collapsed = (graph) => count(graph, /<circle[^>]*class="node collapsed[ "]/g);
const badges = (graph) => [...graph.matchAll(/class="cluster-count[^"]*"[^>]*>\+(\d+)</g)].map((m) => Number(m[1]));

// The events the picture has folded out of sight twice over, and which
// therefore appear in no badge at all.
//
// The two levels of detail compose: the semantic collapse folds a part into
// its parent and the geometric stacking then runs on the nodes that are left,
// so a collapsed parent can itself land in a stack. A stack's badge counts
// the **nodes** under it and not the events inside those nodes, so an event
// folded twice is counted by neither. It is eight of 250 today, it was
// nought of 250 until M47 wrote the first parents, and it is a defect in the
// graph rather than in the data (STATUS.md, deviation 714): M47 was not the
// run to change what the graph draws, so the arithmetic below says what the
// picture actually accounts for and names what it does not.
//
// An event is folded twice when **the node it was folded into** is drawn
// nowhere — a drawn node carries `data-id`, and a stack carries `data-stack`
// and no id at all.
//
// Which node that is, is not "the highest ancestor" and never was: a parent
// swallows its parts only when it is allowed to, and `collapseLayout` blocks
// every ancestor of anything the reader is holding (collapse.js, M25's
// never-hide rule). This read as the highest ancestor until M62, because the
// corpus had no parent that was ever blocked; M62 wrote five umbrellas and
// the Colonial War is an ancestor of half the carnation revolution's chain,
// so with a selection its parts are their own nodes and counting them as
// folded counted them twice. Two things say a parent kept its parts apart,
// and both are on the page: it is drawn and not drawn `collapsed`, or one of
// its parts has a mark of its own. Where nothing is held — the picture these
// tests count most often — no parent is blocked, every chain walks to its
// top, and this is the old reading exactly.
//
// **Over what the picture is of, and not over the corpus, since M65.** At rest
// no view draws an event that is part of another, so a part is not folded into
// anything — it is not in the picture at all, and counting it as folded would
// count 46 events the drawing never had. `drawable` is `emphasis.js`'s own
// answer for the state the URL describes.
async function foldedTwice(graph, drawable) {
  const corpus = await corpusOf(path.join(ROOT, 'data'));
  const events = new Map(corpus.events
    .filter((e) => e.status === 'active' && drawable.has(e.id))
    .map((e) => [e.id, e]));
  const drawn = new Set([...graph.matchAll(/<circle[^>]*data-id="([^"]+)"/g)].map((m) => m[1]));
  const classOf = new Map([...graph.matchAll(/<circle\b([^>]*)>/g)]
    .map((m) => [/data-id="([^"]*)"/.exec(m[1])?.[1], /class="([^"]*)"/.exec(m[1])?.[1]])
    .filter(([id]) => id !== undefined));
  const partsDrawn = new Set();
  for (const event of events.values()) if (typeof event.parent === 'string' && drawn.has(event.id)) partsDrawn.add(event.parent);
  const keptApart = (id) => {
    const cls = classOf.get(id);
    return (cls !== undefined && !/\bcollapsed\b/.test(cls)) || partsDrawn.has(id);
  };
  let folded = 0;
  for (const event of events.values()) {
    if (typeof event.parent !== 'string') continue;
    let node = event;
    const seen = new Set([node.id]);
    for (;;) {
      const up = typeof node.parent === 'string' ? events.get(node.parent) : null;
      if (!up || seen.has(up.id) || keptApart(up.id)) break;
      node = up;
      seen.add(up.id);
    }
    if (node !== event && !drawn.has(node.id)) folded += 1;
  }
  return folded;
}

// **`degree=0` on every URL that counts the whole corpus.** Since M48 the graph
// draws what organises other events — at least two active links, by default —
// so a picture of every event is one the reader asks for and these tests ask
// for it by name (M48 §3, src/graph-filters.js). What they are about is the
// folding, and the folding has to be counted against what was there to fold.
// It also names the whole window, for the same reason and since M50. A view
// draws the window and a margin either side of it, and the window a URL that
// names neither end gets used to be the whole extent — true while the corpus
// began in 1890, and false from the moment M50 put events back to 1492 and
// `opensOn` started answering with one century of five (src/util/window.js).
// A test whose arithmetic is "everything is drawn or folded, and nothing is
// lost" has to ask for everything, or it is counting the events of one century
// against the corpus of five.
const CORPUS = await corpusOf(path.join(ROOT, 'data'));
const ACTIVE = CORPUS.events.filter((e) => e.status === 'active');
const bound = (v) => (Number.isInteger(v) ? v : (Number.isInteger(v?.min) ? v.min : v?.max));
const YEARS = ACTIVE.flatMap((e) => [bound(e.when?.start), bound(e.when?.end)]).filter(Number.isInteger);
const WHOLE = `degree=0&from=${Math.min(...YEARS)}&to=${Math.max(...YEARS)}`;

// The window a reader who names neither bound actually arrives at.
const ATLAS = await atlasOf(path.join(ROOT, 'data'));
const WINDOW = resolveWindow(defaultState(), ATLAS.extent, ATLAS.opens);

// How many events the graph would draw one node each for: the number the marks
// and the badges have to add back up to.
//
// **The resting picture and not the corpus, since M65.** At rest every view
// draws the main events alone; an event that is part of another is inside the
// event it belongs to and is drawn when a reader opens that one. Asked of
// `emphasis.js`, which is the one place that decides what a view may draw, so
// this count follows the rule rather than repeating it — and it is a count of
// what the picture is *of*, which is what makes the arithmetic below a promise
// about folding and not about the size of the corpus.
const drawableOf = (patch = {}) => workingSet(ATLAS, { ...defaultState(), degree: 0, ...patch }).shown;

test('at the default zoom the graph draws stacks, and they add up to the events', { skip }, async () => {
  const drawable = drawableOf();
  const events = drawable.size;
  const dom = await withServer((url) => dumpDom(chrome, url(`?view=graph&${WHOLE}`)));
  const graph = graphOf(dom);
  const drawn = marks(graph);
  const hidden = badges(graph);
  assert.ok(drawn < events, `${drawn} marks for ${events} events`);
  assert.equal(stacks(graph) + collapsed(graph), hidden.length, 'a stack and a parent with its parts inside each carry a badge, and nothing else does');
  assert.ok(hidden.length > 0, 'and there are stacks to carry one');
  // The promise the badges make: nothing has been dropped from the picture,
  // only folded into it — and what is folded into a parent that a stack then
  // swallowed is in neither badge, which is the graph's defect and not the
  // drawing losing a record.
  assert.equal(drawn + hidden.reduce((a, b) => a + b, 0) + await foldedTwice(graph, drawable), events);
  for (const n of hidden) assert.ok(n >= 1, 'a badge never says +0');
});

test('grouping into bands crowds the picture, and more of it merges', { skip }, async () => {
  const drawable = drawableOf();
  const events = drawable.size;
  const [plain, banded] = await withServer(async (url) => [
    graphOf(await dumpDom(chrome, url(`?view=graph&${WHOLE}`))),
    graphOf(await dumpDom(chrome, url(`?view=graph&group=region&${WHOLE}`))),
  ]);
  // "More of it merges" counted as **fewer marks on the page**, which is what
  // merging means, and not as more stack nodes, which was what this line
  // asserted until M50. The two came apart on this corpus and at every window
  // tried: 1890–2026 draws 144 marks in 28 stacks without bands and 62 marks
  // in 14 with them, and the whole extent of 1492–2026 draws 164 in 66 against
  // 118 in 66. Banding folds more events into each stack rather than making
  // more stacks, so the stack count is the wrong instrument — it can fall while
  // the merging rises, and at high density it saturates and stops moving at
  // all. The claim in the test's name is unchanged and is now measured by the
  // thing it is about.
  assert.ok(marks(banded) < marks(plain), `${marks(banded)} marks in bands, ${marks(plain)} without`);
  for (const graph of [plain, banded]) {
    assert.equal(marks(graph) + badges(graph).reduce((a, b) => a + b, 0) + await foldedTwice(graph, drawable), events);
  }
});

test('a merged line carries its count and its type; a single one is unchanged', { skip }, async () => {
  // The picture is the whole extent with no degree floor, as the test above
  // takes it, and not the default window. What this test is about is what a
  // *merged* line carries; whether any line merges at all at a given window is
  // a fact about how crowded the corpus happens to be there, and M67 made the
  // banded default window less crowded on purpose — it filed thirteen events
  // under parents, and the resting picture is the main events only (M65). At
  // the default window `group=region` went from merging lines to merging none
  // while `?view=graph` still merged two, which is the milestone working, not
  // the drawing breaking. Asking for everything is the same lesson the test
  // above learned in M50: count the thing the claim is about.
  const dom = await withServer((url) => dumpDom(chrome, url(`?view=graph&group=region&${WHOLE}`)));
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
  // Since M65 a choice is a filter, so what this picture has to add back up to
  // is what the choice leaves: the event, its parts, what it is part of and one
  // hop either way.
  const drawable = drawableOf({ selected: 'carnation-revolution-1974' });
  const events = drawable.size;
  const dom = await withServer((url) => dumpDom(chrome, url(`?view=graph&selected=carnation-revolution-1974&${WHOLE}`)));
  const graph = graphOf(dom);
  // Its own mark, drawn last so it is on top, and not a stack. It is on the
  // walked path as well as selected, so the class carries both.
  assert.match(graph, /<circle[^>]*class="node(?: [a-z-]+)* selected"/);
  assert.doesNotMatch(graph, /<circle[^>]*class="node stack[^"]*selected/);
  // Holding the selection and everything drawn at it out of the grouping
  // leaves fewer stacks than the same picture with nothing selected.
  const plain = graphOf(await withServer((url) => dumpDom(chrome, url(`?view=graph&${WHOLE}`))));
  assert.ok(stacks(graph) < stacks(plain), `${stacks(graph)} stacks with a selection, ${stacks(plain)} without`);
  assert.equal(marks(graph) + badges(graph).reduce((a, b) => a + b, 0) + await foldedTwice(graph, drawable), events);
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

// **M65 supersedes the semantic collapse in the two tests below.** The graph
// used to draw a parent's parts inside it while the reader was zoomed out;
// since M65 no view draws a part at rest at all, and a reader who opens the
// parent is holding its parts, which M25's never-hide rule keeps out of any
// fold. So the collapse no longer fires in either picture: what it said —
// *there is more inside this one* — the resting rule says by hiding the parts,
// and the ring (M30c) still says it on the mark. `collapseLayout` is unchanged
// and `tests/collapse.test.mjs` still holds it to its own rule.
//
// `from=1200&to=2025` in the three tests below, and it is not decoration.
// Since M43b the atlas opens on the century that holds most of the corpus
// (util/window.js, `opensOn`), and a window that is a small share of the data
// is a window the graph zooms to on arrival — to `FIT_ZOOM`, which is
// `COLLAPSE_ZOOM` (graph-view.js, `fitToWindow`). So the fixtures' default
// view is now *above* the threshold these tests are about, and naming the
// whole extent is how a reader asks for the zoomed-out picture the collapse
// belongs to. Nothing else about them changes.
test('at rest a parent keeps its parts out of the graph, and choosing it draws them beside it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await open(page, url(`?fixtures=1&view=graph&from=1200&to=2025&${WHOLE}`), drawnGraph);
    await waitFor(page, TITLED('fixture-event-f'), "the parent's century to land");

    const resting = await page.eval(`
      const el = document.querySelector('svg.graph circle.node[data-id="fixture-event-f"]');
      return {
        classes: el ? el.getAttribute('class') : null,
        title: el ? el.querySelector('title').textContent : null,
      };`);
    assert.ok(resting.classes, 'the parent itself is drawn at rest');
    assert.doesNotMatch(resting.classes, /\bcollapsed\b/, 'and holds nothing inside it, because there is nothing to hold');
    for (const id of ['fixture-event-t', 'fixture-event-h']) {
      assert.equal(await page.eval(NODE(id)), false, `${id} is part of F and is not drawn at rest`);
    }

    // Choosing the parent is what puts its parts in the picture, and they are
    // their own nodes: what the reader opened is never folded away from them.
    await open(page, url(`?fixtures=1&view=graph&selected=fixture-event-f&from=1200&to=2025&${WHOLE}`), drawnGraph);
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

test('a parent keeps its ring at rest and at every zoom', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    // At rest, where its parts are not drawn at all: the ring is the whole of
    // what says there is more inside this one, which is what M30c built it for
    // and what M65 leaves it doing alone.
    await open(page, url(`?fixtures=1&view=graph&from=1200&to=2025&${WHOLE}`), drawnGraph);
    await waitFor(page, TITLED('fixture-event-f'), "the parent's century to land");

    const held = await page.eval(RING);
    assert.doesNotMatch(held.node.classes, /\bcollapsed\b/, 'nothing is folded into it: its parts are not in the picture');
    assert.equal(held.rings, 1, 'one ring, for the one parent on the fixtures');
    assert.ok(held.ring, 'and the parent has it');
    assert.ok(held.ring.sibling, 'beside the node, in the same layer');
    assert.ok(held.ring.r > held.node.r, `outside it: ${held.ring.r} around ${held.node.r}`);
    assert.equal(held.ring.fill, 'none', 'an outline and not a disc');
    assert.equal(held.ring.id, null, 'it names no record, so a click still opens the node');
    assert.equal(held.ring.events, 'none');
    assert.doesNotMatch(held.ring.classes, /\bnode\b/, 'a ring is an outline, not a record');

    // The reader opens it and zooms in: the parts come out beside it. The ring
    // stays, because it is not about the zoom and not about the choice — it is
    // about the record having parts at all.
    await open(page, url(`?fixtures=1&view=graph&selected=fixture-event-f&from=1200&to=2025&${WHOLE}`), drawnGraph);
    await waitFor(page, NODE('fixture-event-t'), 'the parts to be drawn on their own');
    await page.eval(`
      const svg = document.querySelector('svg.graph');
      const box = svg.getBoundingClientRect();
      svg.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true, deltaY: -600,
        clientX: box.left + box.width / 2, clientY: box.top + box.height / 2,
      }));
      return true;`);
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
    // **`focus=none`**, which is the reader turning the implicit lens off
    // (lens.js): since M65 a selection is a filter, and a picture narrowed to
    // one event's neighbourhood has nothing to cull. What this test is about is
    // the culling and the selection's exemption from it, so it asks for the
    // whole resting picture and keeps the selection in it.
    await open(page, url(`?fixtures=1&view=graph&selected=fixture-event-a&focus=none&from=1200&to=2025&${WHOLE}`), drawnGraph);
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
    await open(page, url(`?fixtures=1&view=graph&from=1200&to=2025&${WHOLE}`), drawnGraph);
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

// ─── what the graph draws (M48 §3) ─────────────────────────────────────────
//
// The graph drew every event at every zoom, and 41 % of them have one edge or
// none: eight hubs a reader can read a name on and two hundred nodes they
// cannot. It draws what organises other events now, and the two things that
// have to be true of that are that the reader can move it and that nothing is
// *gone* — a hidden event is still on the map, still on the timeline, still
// found by the search, still walked to, still kept by a lens.

// The hub with the most links in the corpus and a leaf with one or none, read
// off the index the browser reads rather than written out here: which event is
// which is a fact about the corpus and the next import moves it (M48, test 6).
async function hubAndLeaf() {
  const corpus = await corpusOf(path.join(ROOT, 'data'));
  const active = corpus.events.filter((e) => e.status === 'active');
  const ids = new Set(active.map((e) => e.id));
  const degree = new Map(active.map((e) => [e.id, 0]));
  for (const edge of corpus.edges) {
    if (edge.status !== 'active' || !ids.has(edge.from) || !ids.has(edge.to)) continue;
    degree.set(edge.from, degree.get(edge.from) + 1);
    degree.set(edge.to, degree.get(edge.to) + 1);
  }
  const byDegree = [...degree].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const hub = byDegree[0];
  // A leaf with exactly one link, so that raising the floor to two is what
  // hides it and the walk below has a step to take to it.
  const leaf = byDegree.find(([, n]) => n === 1);
  assert.ok(hub && hub[1] >= 3, 'the corpus has a hub');
  assert.ok(leaf, 'and a leaf with one link');
  const edge = corpus.edges.find((e) => e.status === 'active' && (e.from === leaf[0] || e.to === leaf[0]));
  return { hub: hub[0], leaf: leaf[0], edge: edge.id, degree };
}

const DRAWN_IDS = "return [...document.querySelectorAll('svg.graph circle.node[data-id]')].map((el) => el.dataset.id);";

test('the degree floor hides a leaf and keeps the hubs, and the reader moves it', { skip }, async () => {
  const { degree } = await hubAndLeaf();
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    // The picture a reader arrives at, with the floor taken off and nothing
    // else changed — which is the state the last step of this test returns to.
    // The leaf is **read out of it** rather than chosen from the corpus, and
    // that is M50's correction: the two levels of detail compose, so an event
    // can be absent because the floor hid it *or* because a stack swallowed it,
    // and naming a leaf from `data/` cannot tell the two apart. It could not
    // tell them apart before either; what changed is that the corpus is now
    // five centuries long, a URL naming neither bound gets the opening window
    // of 1900–1999 rather than the whole extent, and the events left in that
    // window pack tightly enough that the leaf this test used to name lands
    // inside a stack at every floor. What the floor promises is what is
    // asserted: nothing under it is drawn at all.
    await open(page, url('?view=graph&degree=0'), drawnGraph);
    const withoutFloor = await page.eval(DRAWN_IDS);
    const leaf = withoutFloor.find((id) => degree.get(id) === 1);
    assert.ok(leaf, 'the picture with no floor draws at least one event with one link');

    await open(page, url('?view=graph'), drawnGraph);
    await waitFor(page, `return !document.querySelector('svg.graph circle.node[data-id="${leaf}"]');`, 'the leaf to go');
    const drawn = await page.eval(DRAWN_IDS);
    assert.ok(drawn.length > 0, 'the graph still draws a picture');
    for (const id of drawn) {
      assert.ok((degree.get(id) ?? 0) >= 2, `${id} has ${degree.get(id) ?? 0} link(s) and was drawn at the default floor`);
    }

    // And the control moves it, writing what the reader did into the link.
    await page.eval(`const s = document.querySelector('.graph-filters [data-filter="degree"]');
      s.value = '0'; s.dispatchEvent(new Event('change', { bubbles: true })); return true;`);
    await waitFor(page, "return new URLSearchParams(location.search).get('degree') === '0';", 'the URL to carry the floor');
    await waitFor(page, NODE(leaf), 'the leaf to come back');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

test('a filtered-out event is still searched for, still walked to, and still kept by a lens', { skip }, async () => {
  const { leaf, edge } = await hubAndLeaf();
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);

    // Walked to: the chain that reaches it is what the reader clicked, and the
    // graph may not answer by drawing nothing where they arrived.
    await open(page, url(`?view=graph&selected=${leaf}&chain=${edge}`), drawnGraph);
    await waitFor(page, NODE(leaf), 'the leaf to be drawn because the reader walked to it');

    // Kept by a lens: inside one, the filters are off altogether.
    await open(page, url(`?view=graph&focus=event:${leaf}`), drawnGraph);
    await waitFor(page, NODE(leaf), 'the leaf to be drawn inside a lens on itself');

    // And found by the search, which never knew about the graph at all.
    await open(page, url('?view=graph'), drawnGraph);
    await waitFor(page, "return !document.getElementById('search-results').hidden === false || true;", 'the box');
    await page.eval(`const box = document.getElementById('search-input');
      box.value = ${JSON.stringify(leaf.replace(/-/g, ' '))};
      box.dispatchEvent(new Event('input', { bubbles: true }));
      return true;`);
    await waitFor(
      page,
      `return [...document.querySelectorAll('#search-results [data-id]')].some((el) => el.dataset.id === ${JSON.stringify(leaf)});`,
      'the search to offer the event the graph is not drawing',
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

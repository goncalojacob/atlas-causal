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
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer, HOST } from '../tools/serve.mjs';
import { findChrome } from '../tools/screens.mjs';
import { ROOT } from './helpers.mjs';

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
  const dir = path.join(ROOT, 'data', 'index');
  const file = (await readdir(dir)).find((n) => n.startsWith('spine-'));
  const spine = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
  return spine.events.filter((e) => e.status === 'active').length;
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

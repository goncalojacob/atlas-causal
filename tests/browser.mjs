// A driven headless Chromium, over its DevTools protocol on Node's own
// WebSocket: no Puppeteer, no Playwright, no npm, which is the rule for this
// repository and not a preference. --dump-dom renders one URL and stops, so
// anything that needs a click, a key or a second page load is driven from
// here instead.
//
// A machine with no browser is not a broken repository: `skip` is a reason
// rather than false when none is found, and the tests that import it skip.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, HOST } from '../tools/serve.mjs';
import { findChrome } from '../tools/screens.mjs';
import { LOADING_LABEL } from '../src/attributes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const chrome = findChrome();
export const skip = chrome ? false : 'no headless browser found; set $CHROME to one';

// Neither of the two waits below may be unbounded. A promise that never
// settles while the browser is still open keeps the event loop alive, so node
// does not notice and simply sits there: the suite stops printing, the job is
// killed hours later, and nothing in the log says which test it was in
// (deviations 445, 543, 551). `bounded` races the wait against a clock and,
// when the clock wins, rejects with a sentence naming the wait and what was
// still open — a hang becomes a failure with a name.
//
// Both bounds are well under the `--test-timeout` the Actions run: the runner's
// own timeout would fire first otherwise, and its message says only that a test
// took too long, which is the thing these sentences exist to replace.
const HANDSHAKE_MS = 20_000;
const CLOSE_MS = 15_000;
// And the third, which was not bounded and is the one that matters most: a
// `Runtime.evaluate` whose reply never arrives. Every expression these tests
// send is a DOM read or a click and answers in milliseconds; a page that has
// stopped answering — a renderer that has gone, a socket the browser has given
// up on — left `send` pending for ever, and an `await` in a test body that
// never settles is a suite that stops printing with nothing in the log to say
// where. Thirty seconds is a hundredfold what an honest eval takes and well
// under the runner's own `--test-timeout`.
const EVAL_MS = 30_000;

async function bounded(promise, ms, what) {
  let timer = null;
  const alarm = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(what())), ms);
  });
  try {
    return await Promise.race([promise, alarm]);
  } finally {
    clearTimeout(timer);
  }
}

const READY_STATE = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// A port has to be known before anything is started: take an ephemeral one,
// give it back, use that number.
export async function freePort() {
  const probe = createServer({ port: 0 });
  await new Promise((resolve) => probe.listen(0, HOST, resolve));
  const { port } = probe.address();
  probe.close();
  await new Promise((resolve) => probe.once('close', resolve));
  return port;
}

// The smallest DevTools client that will do: send a command, await its reply,
// and wait for one event. Everything above is expressed in Runtime.evaluate,
// so nothing here needs to model the protocol beyond that.
export async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  // The first of the two: a handshake that neither opens nor errors. The
  // socket is left in CONNECTING and the promise never settles.
  await bounded(
    new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error(`cannot reach ${wsUrl}`)), { once: true });
    }),
    HANDSHAKE_MS,
    () => `the DevTools WebSocket handshake never finished: ${HANDSHAKE_MS / 1000} s waiting for ${wsUrl}, still ${READY_STATE[socket.readyState] ?? socket.readyState}`,
  ).catch((error) => {
    // Nothing else will close it, and an open socket is one more handle
    // holding the event loop up after the failure has been reported.
    socket.close();
    throw error;
  });
  let id = 0;
  const pending = new Map();
  const waiters = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const waiter = waiters.get(message.method);
    if (waiter) { waiters.delete(message.method); waiter(message.params); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return {
    send,
    once: (method) => new Promise((resolve) => waiters.set(method, resolve)),
    // The page's own value, brought back as JSON. A thrown expression is a
    // test failure with the page's message, not a silent undefined.
    async eval(expression) {
      const result = await bounded(
        send('Runtime.evaluate', {
          expression: `(() => { ${expression} })()`,
          returnByValue: true,
          awaitPromise: true,
        }),
        EVAL_MS,
        () => `the page never answered: ${EVAL_MS / 1000} s waiting for ${JSON.stringify(expression.slice(0, 200))}`,
      );
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'page threw');
      return result.result.value;
    },
    close: () => socket.close(),
  };
}

// The server, the browser and one page, torn down in that order however the
// body ends. `device`, when given, is an Emulation.setDeviceMetricsOverride
// payload — the viewport the page lays itself out in, and its pixel ratio —
// and `touch` adds a touchscreen to it.
//
// `mobile` stays false in that payload even for a phone. It is not a size:
// it turns on Chromium's whole mobile-viewport machinery, which rescales the
// layout viewport to something of its own choosing — 390 × 844 comes out
// 551 × 1191 — and what these tests need is the width the brief names, laid
// out under a finger. The touchscreen comes from setTouchEmulationEnabled,
// which is a separate thing and works either way.
//
// `args` are extra flags for the browser itself, for the one thing a suite may
// need that no other should have: see the note at the flag list below.
export async function withBrowser(fn, { device = null, touch = false, args = [] } = {}) {
  const port = await freePort();
  const server = createServer({ port });
  // What the close below is waiting on, when it waits: `server.close()` stops
  // the server accepting and then waits for the connections it already has,
  // and Chromium keeps its own alive. Held here so the failure can say how
  // many there were and where from, which is what nobody could see before.
  const connections = new Set();
  server.on('connection', (socket) => {
    connections.add(socket);
    socket.once('close', () => connections.delete(socket));
  });
  await new Promise((resolve) => server.listen(port, HOST, resolve));

  const debugPort = await freePort();
  const profile = await mkdtemp(path.join(tmpdir(), 'atlas-cdp-'));
  const child = spawn(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox',
    // The four flags that stop the browser slowing the page down under it.
    // A headless window can be taken for occluded or backgrounded, and a
    // backgrounded renderer has its timers throttled and its animation frames
    // stopped — and the atlas defers every replace-type write of the address
    // bar to an animation frame (state.js, `write`), so a frame that never
    // comes is a URL that never changes and a test that waits ten seconds for
    // it. That is what dropped *the count of what the map is looking at is in
    // the masthead* with `timed out waiting for the world back` on a pass with
    // one browser and nothing else running (M63, docs/m63-load.md).
    // The fourth is Chromium's own rate limit on a renderer that sends it too
    // many messages: a band drag is a great many history writes, and the
    // protection delays them rather than dropping them, which reads here as
    // the page going quiet. None of the four changes what the page does — only
    // what the browser does to it when it thinks nobody is looking.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    // And /dev/shm, which is 64 MB on a GitHub runner: a renderer that fills
    // it does not slow down, it dies, and a browser that died mid-test is the
    // launch failure the assertion below reports with nothing else to say.
    '--disable-dev-shm-usage',
    // The window is the device's own size before the page is ever loaded.
    // The override below alone is not enough: headless scales the emulated
    // viewport to the window it was given, and a phone inside an 800 × 600
    // window comes out neither 390 wide nor 844 tall.
    ...(device ? [`--window-size=${device.width},${device.height}`] : []),
    // What one suite needs of the browser and no other should carry: the halo
    // tests ask for `--disable-lcd-text`, because subpixel-antialiased text
    // puts a blue fringe down the right of every stem and a blue fringe cannot
    // be told from the cobalt line the halo is holding off (M66). A flag here
    // rather than in the list above, so a test that reads pixels does not
    // change how every other test's page is rasterised.
    ...args,
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  // Chromium's own words, kept for the assertion below. They were piped and
  // never read before, which both risked a full pipe blocking the child and
  // left every launch failure saying nothing but that it had failed; a
  // missing shared library or a profile it cannot write is in here.
  let said = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => { said = (said + chunk).slice(-2000); });
  }
  let exited = null;
  child.once('exit', (code, signal) => { exited = signal ? `signal ${signal}` : `code ${code}`; });

  // The endpoint is up when it answers; the browser takes a moment to bind.
  // A deadline and not a count of tries: the old loop slept only when the
  // fetch threw, so a Chromium that answered before it had made its first
  // page spent its hundred tries in a few milliseconds and failed a browser
  // that was seconds from ready. Sixty seconds because a cold shared runner
  // unpacking a browser for the first test in a file is slow and this failing
  // spuriously has cost three checks at thirty (deviations 551, 553) and, on
  // 22 September 2026, three more in one evening — two runs of pull request
  // #20 and one of `m42`, each on the first test of `compose-browser`, each
  // with Chromium alive and no page listed at the deadline, each green on the
  // next try; it is still under the job's `--test-timeout`, and a browser
  // that is genuinely absent still fails, just later and with a reason.
  let targets = null;
  const deadline = Date.now() + 60_000;
  while (!targets && Date.now() < deadline && exited === null) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const list = await response.json();
      targets = list.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (targets.length === 0) targets = null;
    } catch {
      targets = null;
    }
    if (!targets) await new Promise((resolve) => { setTimeout(resolve, 100); });
  }
  assert.ok(targets, `headless Chromium opened a debugging port${
    exited ? ` — it exited with ${exited}` : ''}${said ? `, saying: ${said.trim()}` : ''}`);

  const page = await connect(targets[0].webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  if (device) await page.send('Emulation.setDeviceMetricsOverride', { mobile: false, ...device });
  if (touch) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  // Not a `finally`: the teardown below can now fail, and a bound that fires
  // while a test is already failing must not be thrown over the failure it
  // would explain. The body's error is kept and rethrown after the teardown
  // has run in full, exactly as the `finally` ran it.
  let failure = null;
  let value;
  try {
    value = await fn(page, (query) => `http://${HOST}:${port}/${query}`);
  } catch (error) {
    failure = error;
  }
  page.close();
  child.kill();
  // The profile is still being written to until the browser is actually
  // gone, so the wait is not politeness: removing it first fails.
  await new Promise((resolve) => child.once('exit', resolve));
  server.close();
  // The second of the two.
  let stuck = null;
  await bounded(
    new Promise((resolve) => server.once('close', resolve)),
    CLOSE_MS,
    () => `the test server never closed: ${CLOSE_MS / 1000} s after server.close() with ${connections.size} connection(s) still open`
      + `${connections.size ? ` (${[...connections].map((s) => `${s.remoteAddress}:${s.remotePort}`).join(', ')})` : ''}`,
  ).catch((error) => {
    // Say it, then let go of them: the report is the point, and a server
    // still holding sockets keeps the runner alive after it.
    server.closeAllConnections();
    stuck = error;
  });
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(() => {});
  if (failure) {
    // Both went wrong: the test's own failure is what is reported, with the
    // teardown's sentence carried on the end of it rather than thrown away.
    if (stuck && failure instanceof Error) failure.message = `${failure.message}\n  (and ${stuck.message})`;
    throw failure;
  }
  if (stuck) throw stuck;
  return value;
}

// A reader who has been here before. The introduction covers the view on a
// first visit and with nothing open (src/intro.js), which is exactly the state
// most of these tests drive; this writes the same key the card writes when it
// is dismissed, before any page script runs, on this and every later
// navigation. A test that is *about* the introduction does not call it.
export async function seenIntro(page) {
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: "try { localStorage.setItem('atlas-causal.intro', 'seen'); } catch {}",
  });
}

// Poll the page until it says yes, and say whether it ever did. Everything in
// the atlas arrives after the load event — the topology, the land, a card's
// text — so nothing is ever asserted on the strength of a timer.
//
// `waitFor` is this with an assertion on the end, and it is the right one
// wherever the wait is a *precondition* of the test: a page that never becomes
// what the test is about has nothing to say and `timed out waiting for …` is
// the whole of the news. Where the wait is the test's **own assertion** — no
// bar unnamed, no step off the screen — `until` is the one to use and the
// assertion is left to run either way: a real defect is then reported by the
// assertion, with the ids it names, rather than as a timeout that throws them
// away (M78, docs/m78-flakes.md).
export async function until(page, expression, { tries = 200, every = 50 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    if (await page.eval(expression)) return true;
    await new Promise((resolve) => { setTimeout(resolve, every); });
  }
  return false;
}

export async function waitFor(page, expression, what, options = {}) {
  if (!await until(page, expression, options)) assert.fail(`timed out waiting for ${what}`);
}

// --- what a live-corpus test waits for --------------------------------------
//
// The manifest the page will read, off the disk the server is about to serve
// from. The shard count is a property of the build and grows with the corpus, so
// a test that waits for the shards reads it here and never writes a number
// (M87 §5, B8).
export async function manifestOf({ fixtures = false } = {}) {
  const root = fixtures ? 'tests/fixtures/data' : 'data';
  return JSON.parse(await readFile(path.join(ROOT, root, 'index', 'manifest.json'), 'utf8'));
}

// Every attribute shard the manifest names, arrived. The three private copies
// of this wait polled a resource count until it stopped moving and fell through
// **silently** after 4 s, so on a slow run the assertions after them ran
// against a page that was still arriving and failed with a sentence about lanes
// or profiles rather than about time. This one fails, and says how far the page
// got: "9 of 12 attribute shards arrived".
//
// The page asks for all of them at first paint at the whole span and for the
// window's at a narrower one, so a test that opens a window passes the shards it
// expects rather than the whole manifest.
export async function settledShards(page, manifest, { tries = 200, every = 50 } = {}) {
  const wanted = (manifest?.attributeShards ?? []).length;
  if (wanted === 0) return;
  const count = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;';
  let arrived = 0;
  for (let i = 0; i < tries; i += 1) {
    arrived = await page.eval(count);
    if (arrived >= wanted) return;
    await new Promise((resolve) => { setTimeout(resolve, every); });
  }
  assert.fail(`${arrived} of ${wanted} attribute shards arrived`);
}

// The wait every test about a name owes itself. A title arrives with its
// century and not with the picture (src/attributes.js): a bar, a mark and a
// node are drawn unlabelled and labelled when their shard lands, and until
// then the control says it is still loading. So a count of labels — or a count
// that has not moved in 50 ms — is the same number on either side of a shard
// landing, which is exactly what dropped `m77-browser` 95 three runs in five
// (docs/m78-flakes.md).
//
// `named(selector)` is true when every element the selector reaches carries
// its own name. Nothing is pinned: it counts no labels and asks for no
// particular number, only that none of them is still the interface saying it
// is loading.
export const named = (selector) => `
  const marks = [...document.querySelectorAll(${JSON.stringify(selector)})];
  if (marks.length === 0) return false;
  return marks.every((el) => {
    const title = el.querySelector('title');
    return Boolean(title) && title.textContent !== ''
      && !title.textContent.startsWith(${JSON.stringify(LOADING_LABEL)});
  });`;

// Navigate, then wait for the atlas: the panel's first card is what says the
// data arrived and the interface was built on it.
export async function open(page, url, ready = 'return document.querySelectorAll(".panel .card-section").length > 0;') {
  const loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url });
  await loaded;
  // The load event is not the first picture, and neither is a node being in
  // the DOM: a paint timing is recorded when the compositor has presented a
  // frame, a frame or two behind the elements a `ready` expression looks for.
  // So a test that reads `first-contentful-paint` on a page that is ready by
  // its own lights could find nothing recorded at all — which is how
  // `sources.html never reported a first contentful paint` dropped one run in
  // ten with the page perfectly well drawn (M63, docs/m63-load.md). A page is
  // open here when it has painted. Bounded like everything else in this file,
  // and a page that never paints still reaches the test, which has its own
  // assertion about that and a better sentence for it.
  for (let tries = 0; tries < 200; tries += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await page.eval('return performance.getEntriesByType("paint").some((e) => e.name === "first-contentful-paint");')) break;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  }
  for (let tries = 0; tries < 200; tries += 1) {
    if (await page.eval(ready)) return;
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  }
  // Not the panel: these open review.html and contribute.html too, and a
  // failure message that itself throws hides the failure it was reporting.
  const dom = await page.eval('return (document.body.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 400);');
  assert.fail(`the page never became ready. It says: ${dom}`);
}

// Guarda o que a página deitou para a consola de erro, para que um teste possa
// afirmar que não houve nenhum. Instalado no documento antes de qualquer
// script da página correr, e em cada navegação seguinte: um erro no arranque
// — que é onde os módulos do atlas se montam — acontece antes de qualquer
// `Runtime.evaluate` poder chegar a tempo.
export async function watchErrors(page) {
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__errors = [];
      window.addEventListener('error', (e) => {
        window.__errors.push(String((e.error && e.error.stack) || e.message));
      });
      window.addEventListener('unhandledrejection', (e) => {
        window.__errors.push(String((e.reason && e.reason.stack) || e.reason));
      });
      const original = console.error;
      console.error = (...args) => { window.__errors.push(args.map(String).join(' ')); original(...args); };
    `,
  });
}

export const errorsOn = (page) => page.eval('return window.__errors || [];');

// One finger, down and up on the same point: what a reader does to a mark.
// Chromium turns it into the pointer and click events the views listen for,
// so this exercises the real path and not a synthetic .click().
export async function tap(page, x, y) {
  const touchPoints = [{ x: Math.round(x), y: Math.round(y) }];
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

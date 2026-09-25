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
import { after } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { readFile, rm, stat } from 'node:fs/promises';
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

// --- one Chromium per file --------------------------------------------------
//
// A browser was launched for every test — 250 launches per CI run, each with a
// fresh profile, each waiting on `/json/list` and each paying the cold start
// that the 60-second deadline below exists to survive (review B7). One browser
// per file now, with a fresh `Target.createBrowserContext` per test: an
// incognito context is the same isolation a fresh profile gives — no cache, no
// storage, no cookies shared — and the launch is paid once instead of twenty
// times.
//
// It is per *file* rather than per process because `node --test` gives each file
// its own process, and the root `after` below is what closes it. Keyed by the
// browser's own flags and window size, because both are given on the command
// line and neither can be changed afterwards: a suite that asks for
// `--disable-lcd-text` or for a phone-sized window gets its own browser, which
// is one or two per file rather than one per test.
const launched = new Map();

// Where the browser is listening, from **its own words**. Chromium prints
// `DevTools listening on ws://…` to stderr the instant the port is up, and that
// line carries the endpoint; the old loop chose a port, hoped nothing else took
// it, and polled `/json/list` every 100 ms until a page appeared. `--port=0`
// and this line cannot race anything.
const ENDPOINT = /ws:\/\/[^\s]+/;

// **Every child this file has started, so the exit handler can kill them**
// (M88 §10, the third review, finding B10). The handler below could only reach
// a browser through the promise `launched` holds, and `process.on('exit')` may
// not await anything: a `.then` booked there never runs, so a file whose hooks
// never ran — a crash, a signal, a test that threw out of `before` — left a
// headless Chromium and its profile on the runner with nothing to reap them.
// A child added here the moment it is spawned, and removed when it is shut
// down, is a set the handler can walk synchronously.
//
// Module level: `node --test` runs each file in a process of its own, so this
// is this file's browsers and no others.
export const children = new Set();

export async function launch(args, device, { spawnChild = spawn } = {}) {
  // Synchronously, so that nothing at all happens between this function being
  // called and its child being in `children`: an `await` here is a turn of the
  // loop in which a signal could arrive and the exit handler run with the
  // browser already spawned and not yet reachable (M88 §10). It is one
  // directory in the temporary directory and the launch that follows it is
  // hundreds of milliseconds.
  const profile = mkdtempSync(path.join(tmpdir(), 'atlas-cdp-'));
  const child = spawnChild(chrome, [
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
    // The override per target is not enough on its own: headless scales the
    // emulated viewport to the window it was given, and a phone inside an
    // 800 × 600 window comes out neither 390 wide nor 844 tall. It is why the
    // browsers are keyed by this size as well as by the flags.
    ...(device ? [`--window-size=${device.width},${device.height}`] : []),
    // What one suite needs of the browser and no other should carry: the halo
    // tests ask for `--disable-lcd-text`, because subpixel-antialiased text
    // puts a blue fringe down the right of every stem and a blue fringe cannot
    // be told from the cobalt line the halo is holding off (M66). A flag here
    // rather than in the list above, so a test that reads pixels does not
    // change how every other test's page is rasterised.
    ...args,
    '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  // Before the first `await` below: a launch that never resolves — the browser
  // dies on its own port, the handshake times out — is exactly the case the
  // set exists for, and a child added after the wait would not be in it.
  children.add(child);

  // Chromium's own words, kept for the assertion below. They were piped and
  // never read before, which both risked a full pipe blocking the child and
  // left every launch failure saying nothing but that it had failed; a
  // missing shared library or a profile it cannot write is in here.
  const state = { child, profile, said: '', exited: null, browser: null, url: null };
  let announce = null;
  const listening = new Promise((resolve) => { announce = resolve; });
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      state.said = (state.said + chunk).slice(-2000);
      if (state.url) return;
      const found = ENDPOINT.exec(chunk);
      if (found) { state.url = found[0].trim(); announce(state.url); }
    });
  }
  child.once('exit', (code, signal) => {
    state.exited = signal ? `signal ${signal}` : `code ${code}`;
    announce(null);
  });

  // Sixty seconds because a cold shared runner unpacking a browser for the
  // first test in a file is slow and this failing spuriously has cost six
  // checks (deviations 551, 553, and three runs on 22 September 2026); it is
  // still under the job's `--test-timeout`, and a browser that is genuinely
  // absent still fails, just later and with a reason. One file pays it once.
  const url = await bounded(
    listening,
    60_000,
    () => `headless Chromium never said where it was listening: 60 s${
      state.exited ? ` — it exited with ${state.exited}` : ''}${state.said ? `, saying: ${state.said.trim()}` : ''}`,
  );
  assert.ok(url, `headless Chromium opened a debugging port${
    state.exited ? ` — it exited with ${state.exited}` : ''}${state.said ? `, saying: ${state.said.trim()}` : ''}`);
  state.browser = await connect(url);
  // The page endpoints are on the same host and port as the browser's own.
  state.origin = new URL(url).host;
  // Unreferenced, so the child process and its pipes are not by themselves what
  // holds node's event loop open. The `after` below is what closes the browser
  // under `node --test`, and `process.on('exit')` kills whatever is left, so
  // nothing of this is ever abandoned on the runner.
  child.unref?.();
  child.stdout?.unref?.();
  child.stderr?.unref?.();
  return state;
}

async function browserFor(args, device) {
  const key = JSON.stringify([args, device?.width ?? null, device?.height ?? null]);
  // A browser that died takes its key with it, so the next test in the file
  // launches a new one rather than failing on a socket nobody is holding.
  const held = launched.get(key);
  if (held && (await held).exited === null) return held;
  const fresh = launch(args, device);
  launched.set(key, fresh);
  return fresh;
}

async function shutDown(state) {
  state.browser?.close();
  children.delete(state.child);
  state.child.kill();
  // The profile is still being written to until the browser is actually
  // gone, so the wait is not politeness: removing it first fails.
  if (state.exited === null) await new Promise((resolve) => { state.child.once('exit', resolve); });
  await rm(state.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(() => {});
}

// The root hook of whichever file imported this: `node --test` runs each file in
// a process of its own, so this is the end of the file's browsers and of nothing
// else. A `process.on('exit')` kill as well, because a file whose hooks never
// run must not leave a Chromium behind on the runner.
after(async () => {
  const all = [...launched.values()];
  launched.clear();
  for (const pending of all) {
    await shutDown(await pending.catch(() => null) ?? { child: { kill: () => {}, once: (_, f) => f() }, profile: tmpdir(), exited: 'never started' });
  }
});
process.on('exit', () => {
  // Synchronous, which is the whole point (M88 §10). This used to reach the
  // browsers through `launched`, whose values are promises: the `.then` was
  // booked on a microtask queue that never runs again, so on an abnormal exit
  // nothing was killed at all.
  for (const child of children) {
    try { child.kill(); } catch { /* already gone */ }
  }
  children.clear();
});

// The server and one page in a browser context of its own, torn down in that
// order however the body ends. `device`, when given, is an
// Emulation.setDeviceMetricsOverride payload — the viewport the page lays itself
// out in, and its pixel ratio — and `touch` adds a touchscreen to it.
//
// `mobile` stays false in that payload even for a phone. It is not a size:
// it turns on Chromium's whole mobile-viewport machinery, which rescales the
// layout viewport to something of its own choosing — 390 × 844 comes out
// 551 × 1191 — and what these tests need is the width the brief names, laid
// out under a finger. The touchscreen comes from setTouchEmulationEnabled,
// which is a separate thing and works either way.
//
// `args` are extra flags for the browser itself, for the one thing a suite may
// need that no other should have: see the note at the flag list above.
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

  const browser = await browserFor(args, device);
  // A context per test, which is the isolation the fresh profile gave: an
  // incognito context shares no cache, no storage and no cookies with any
  // other, and a page in one cannot see what a page in another wrote.
  const { browserContextId } = await browser.browser.send('Target.createBrowserContext');
  const { targetId } = await browser.browser.send('Target.createTarget', {
    url: 'about:blank',
    browserContextId,
    ...(device ? { width: device.width, height: device.height } : {}),
  });
  // And the clipboard, which the default context granted for nothing. A page in
  // a context of its own is asked to be given permission, and with no interface
  // to ask in `navigator.clipboard.writeText` never settles at all — so the
  // composer, which awaits `copyText` before it opens the issue (submit.js),
  // waited for ever for a tab it had not yet asked for. Granted on the context,
  // so it is the same answer a reader's own browser gives inside a click.
  await browser.browser.send('Browser.grantPermissions', {
    browserContextId,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  }).catch(() => {});
  const page = await connect(`ws://${browser.origin}/devtools/page/${targetId}`);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  // And the page is the one in front. A browser that held one target per launch
  // gave that for nothing; with several contexts in one browser a page nobody
  // brought forward is a page the browser thinks is in the background, and the
  // Clipboard API refuses — or worse, waits — on a document that is not focused.
  // That is `copyText` in `submit.js`, which the composer awaits before it opens
  // the issue: two tests timed out waiting for a tab that was never going to be
  // asked for.
  await page.send('Page.bringToFront').catch(() => {});
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
  // The target and its context go; the browser stays for the next test in this
  // file. A browser that has died in the meantime is not something to report
  // over the body's own failure, so both are allowed to fail quietly.
  await browser.browser.send('Target.closeTarget', { targetId }).catch(() => {});
  await browser.browser.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
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
  const manifest = JSON.parse(await readFile(path.join(ROOT, root, 'index', 'manifest.json'), 'utf8'));
  // **And how much the shards weigh** (M88 §12, the third review, finding
  // B12). `settledShards` waited a fixed ten seconds for them, which was two
  // corpora ago: the wait is a fact about how much has to arrive, and the
  // amount grows with the records. Stated by the build rather than chosen,
  // and read here because this is where the manifest is opened. A shard the
  // build names and the disk has not is nothing to wait for and is counted as
  // nothing, which is also what the page will find.
  let bytes = 0;
  for (const shard of manifest.attributeShards ?? []) {
    // eslint-disable-next-line no-await-in-loop
    bytes += await stat(path.join(ROOT, root, shard.file)).then((s) => s.size, () => 0);
  }
  return { ...manifest, shardBytes: bytes };
}

// Which manifest the page in front of us is reading: `?fixtures=1` is the
// synthetic graph under tests/fixtures/data/ and everything else is the
// repository's own. Asked of the page rather than passed in, so a call site does
// not have to remember which corpus its own URL opened.
export async function manifestFor(page) {
  const fixtures = await page.eval('return new URLSearchParams(location.search).get("fixtures") === "1";');
  return manifestOf({ fixtures: Boolean(fixtures) });
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
// How long to wait for them, from the build and not from a number typed here.
// Ten seconds as the floor — a page has to be served, parsed and drawn before
// the first shard is even asked for — and a second for every 200 KB the
// manifest names, so the wait grows with the corpus exactly as the arrival
// does. A manifest that says nothing about its own weight gets the floor,
// which is what this waited before (M88 §12, review B finding 12).
export const BASE_SETTLE_MS = 10_000;
export const MS_PER_KB = 1000 / (200 * 1024);
export const settleBudget = (manifest) => BASE_SETTLE_MS
  + Math.round((manifest?.shardBytes ?? 0) * MS_PER_KB);

export async function settledShards(page, manifest = null, { tries = null, every = 50 } = {}) {
  const read = manifest ?? await manifestFor(page);
  const wanted = (read.attributeShards ?? []).length;
  if (wanted === 0) return;
  const budget = tries ?? Math.ceil(settleBudget(read) / every);
  const count = 'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).length;';
  let arrived = 0;
  for (let i = 0; i < budget; i += 1) {
    arrived = await page.eval(count);
    if (arrived >= wanted) return;
    await new Promise((resolve) => { setTimeout(resolve, every); });
  }
  assert.fail(`${arrived} of ${wanted} attribute shards arrived in ${Math.round(budget * every / 1000)} s`);
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

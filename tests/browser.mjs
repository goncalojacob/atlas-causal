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
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, HOST } from '../tools/serve.mjs';
import { findChrome } from '../tools/screens.mjs';

export const chrome = findChrome();
export const skip = chrome ? false : 'no headless browser found; set $CHROME to one';

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
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error(`cannot reach ${wsUrl}`)), { once: true });
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
      const result = await send('Runtime.evaluate', {
        expression: `(() => { ${expression} })()`,
        returnByValue: true,
        awaitPromise: true,
      });
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
export async function withBrowser(fn, { device = null, touch = false } = {}) {
  const port = await freePort();
  const server = createServer({ port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));

  const debugPort = await freePort();
  const profile = await mkdtemp(path.join(tmpdir(), 'atlas-cdp-'));
  const child = spawn(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox',
    // The window is the device's own size before the page is ever loaded.
    // The override below alone is not enough: headless scales the emulated
    // viewport to the window it was given, and a phone inside an 800 × 600
    // window comes out neither 390 wide nor 844 tall.
    ...(device ? [`--window-size=${device.width},${device.height}`] : []),
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  // The endpoint is up when it answers; the browser takes a moment to bind.
  let targets = null;
  for (let tries = 0; tries < 100 && !targets; tries += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const list = await response.json();
      targets = list.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (targets.length === 0) targets = null;
    } catch {
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }
  assert.ok(targets, 'headless Chromium opened a debugging port');

  const page = await connect(targets[0].webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  if (device) await page.send('Emulation.setDeviceMetricsOverride', { mobile: false, ...device });
  if (touch) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  try {
    return await fn(page, (query) => `http://${HOST}:${port}/${query}`);
  } finally {
    page.close();
    child.kill();
    // The profile is still being written to until the browser is actually
    // gone, so the wait is not politeness: removing it first fails.
    await new Promise((resolve) => child.once('exit', resolve));
    server.close();
    await new Promise((resolve) => server.once('close', resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(() => {});
  }
}

// Poll the page until it says yes. Everything in the atlas arrives after the
// load event — the topology, the land, a card's text — so nothing is ever
// asserted on the strength of a timer.
export async function waitFor(page, expression, what, { tries = 200, every = 50 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    if (await page.eval(expression)) return;
    await new Promise((resolve) => { setTimeout(resolve, every); });
  }
  assert.fail(`timed out waiting for ${what}`);
}

// Navigate, then wait for the atlas: the panel's first card is what says the
// data arrived and the interface was built on it.
export async function open(page, url, ready = 'return document.querySelectorAll(".panel .card-section").length > 0;') {
  const loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url });
  await loaded;
  for (let tries = 0; tries < 200; tries += 1) {
    if (await page.eval(ready)) return;
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  }
  // Not the panel: these open review.html and contribute.html too, and a
  // failure message that itself throws hides the failure it was reporting.
  const dom = await page.eval('return (document.body.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 400);');
  assert.fail(`the page never became ready. It says: ${dom}`);
}

// One finger, down and up on the same point: what a reader does to a mark.
// Chromium turns it into the pointer and click events the views listen for,
// so this exercises the real path and not a synthetic .click().
export async function tap(page, x, y) {
  const touchPoints = [{ x: Math.round(x), y: Math.round(y) }];
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

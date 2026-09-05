// The card in a real browser, driven rather than only dumped: opening a
// section, doing it from the keyboard, the choice surviving a reload, and the
// browser's own Back coming back to the event.
//
// None of that can be checked by --dump-dom, which renders one URL and stops.
// So this drives headless Chromium over its DevTools protocol, on Node's own
// WebSocket — no Puppeteer, no Playwright, no npm, which is the rule for this
// repository. A machine with no browser is not a broken repository, so these
// skip rather than fail, as tests/graph-browser.test.mjs does.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, HOST } from '../tools/serve.mjs';
import { findChrome } from '../tools/screens.mjs';

const chrome = findChrome();
const skip = chrome ? false : 'no headless browser found; set $CHROME to one';

// A port has to be known before anything is started: take an ephemeral one,
// give it back, use that number. As tests/graph-browser.test.mjs does.
async function freePort() {
  const probe = createServer({ port: 0 });
  await new Promise((resolve) => probe.listen(0, HOST, resolve));
  const { port } = probe.address();
  probe.close();
  await new Promise((resolve) => probe.once('close', resolve));
  return port;
}

// The smallest DevTools client that will do: send a command, await its reply,
// and wait for one event. Everything below is expressed in Runtime.evaluate,
// so nothing here needs to model the protocol beyond that.
async function connect(wsUrl) {
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

async function withBrowser(fn) {
  const port = await freePort();
  const server = createServer({ port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));

  const debugPort = await freePort();
  const profile = await mkdtemp(path.join(tmpdir(), 'atlas-cdp-'));
  const child = spawn(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox',
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

// Navigate, then wait for the atlas: the topology, the land and the panel all
// arrive after the load event, so the card is what is waited on.
async function open(page, url) {
  const loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url });
  await loaded;
  for (let tries = 0; tries < 200; tries += 1) {
    const ready = await page.eval('return document.querySelectorAll(".panel .card-section").length > 0;');
    if (ready) return;
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  }
  const dom = await page.eval('return document.getElementById("panel").textContent.slice(0, 400);');
  assert.fail(`the card never rendered. The panel says: ${dom}`);
}

// What the reader can see of the sections: which are there, and which is open.
const SECTIONS = `return [...document.querySelectorAll(".panel .card-section")].map((s) => ({
  key: s.dataset.section,
  label: s.querySelector(".section-label").textContent,
  count: s.querySelector(".count")?.textContent ?? null,
  open: s.querySelector(".section-toggle").getAttribute("aria-expanded") === "true",
  hidden: s.querySelector(".section-body").hidden,
}));`;

const openOne = (sections) => sections.filter((s) => s.open).map((s) => s.key);

test('an event card renders head, summary and the collapsed sections with their counts', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    const sections = await page.eval(SECTIONS);
    assert.deepEqual(sections.map((s) => s.key), ['consequences', 'causes', 'sources', 'part-of']);
    assert.deepEqual(
      sections.map((s) => [s.label, s.count]),
      [['Consequences', '9'], ['Causes', '7'], ['Sources', '2'], ['Part of', '1']],
    );
    // Fresh, with nothing walked and nothing remembered: consequences, and
    // every other section's body actually hidden.
    assert.deepEqual(openOne(sections), ['consequences']);
    assert.deepEqual(sections.filter((s) => !s.open).map((s) => s.hidden), [true, true, true]);

    // The head: the actors are chips, and the summary is its own text.
    const head = await page.eval(`return {
      chips: [...document.querySelectorAll(".event-head .chip")].map((c) => c.dataset.id),
      role: document.querySelector(".event-head .chip").title,
      summary: document.querySelector(".panel .summary p").textContent.slice(0, 40),
    };`);
    assert.equal(head.chips.length, 6);
    assert.match(head.role, /Armed Forces Movement — leader/);
    assert.match(head.summary, /^Units led by the Armed Forces Movement/);
  });
});

test('a section opens on a click and from the keyboard, one at a time', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));

    await page.eval('document.querySelector(\'[data-action="section"][data-section="causes"]\').click(); return true;');
    assert.deepEqual(openOne(await page.eval(SECTIONS)), ['causes']);

    // Enter and Space on a native button are a click; this asserts the header
    // really is one, which is where the card's keyboard access comes from.
    await page.eval(`const b = document.querySelector('[data-action="section"][data-section="sources"]');
      b.focus();
      for (const key of ["Enter", " "]) {
        b.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        b.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      }
      return document.activeElement === b;`);
    assert.equal(await page.eval('return document.activeElement.dataset.section;'), 'sources',
      'the header is focusable, which a div would not be');
    assert.equal(await page.eval('return document.querySelector(\'.card-section[data-section="sources"] .section-toggle\').tagName;'), 'BUTTON');

    // Clicking the open one closes it, and then nothing is open.
    await page.eval('document.querySelector(\'[data-action="section"][data-section="causes"]\').click(); return true;');
    assert.deepEqual(openOne(await page.eval(SECTIONS)), []);
  });
});

test('the choice survives a reload, and the arrival still overrides it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'[data-action="section"][data-section="causes"]\').click(); return true;');
    assert.equal(await page.eval('return localStorage.getItem("atlas-causal.card-section");'), 'causes');

    await open(page, url('?selected=carnation-revolution-1974'));
    assert.deepEqual(openOne(await page.eval(SECTIONS)), ['causes'], 'remembered across a reload');

    // Walking a chain is an instruction about what to read, and beats it.
    await open(page, url('?selected=alvor-agreement-1975&chain=carnation-revolution-1974--alvor-agreement-1975--caused'));
    assert.deepEqual(openOne(await page.eval(SECTIONS)), ['consequences']);
    const crumbs = await page.eval(`const nav = document.querySelector(".panel .breadcrumb");
      return nav && {
        steps: [...nav.querySelectorAll("li")].map((li) => li.textContent.replace(/\\s+/g, " ").trim()),
        links: [...nav.querySelectorAll("[data-action='chain-to']")].map((b) => b.dataset.step),
        current: nav.querySelector("[aria-current]") !== null,
      };`);
    assert.deepEqual(crumbs.links, ['0']);
    assert.equal(crumbs.current, true);
    assert.match(crumbs.steps.join(' | '), /25 April \| caused The Alvor Agreement/);
  });
});

test('following a consequence walks the chain and grows the breadcrumb', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'.card-section[data-section="consequences"] [data-action="follow"]\').click(); return true;');
    const after = await page.eval(`return {
      selected: new URLSearchParams(location.search).get("selected"),
      chain: new URLSearchParams(location.search).get("chain"),
      crumbs: [...document.querySelectorAll(".panel .breadcrumb li")].length,
    };`);
    assert.equal(after.selected, 'alvor-agreement-1975');
    assert.equal(after.chain, 'carnation-revolution-1974--alvor-agreement-1975--caused');
    assert.equal(after.crumbs, 2);
    // A walked chain has other branches; without one there is nothing to be
    // other than, and the section is not drawn at all.
    assert.ok((await page.eval(SECTIONS)).some((s) => s.key === 'branches'));
  });
});

test('opening an actor from an event, then Back, shows the event again', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'.event-head .chip[data-id="estado-novo"]\').click(); return true;');
    assert.equal(await page.eval('return document.querySelector(".panel .actor-head h2").textContent;'), 'Estado Novo');

    // The panel's own Back names what it returns to, and is history.back().
    const label = await page.eval('return document.querySelector(".panel .card-history .go-back").textContent.trim();');
    assert.equal(label, '← 25 April');
    await page.eval('document.querySelector(".panel .card-history .go-back").click(); return true;');
    for (let tries = 0; tries < 100; tries += 1) {
      if (await page.eval('return Boolean(document.querySelector(".panel .event-head h2"));')) break;
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
    assert.equal(await page.eval('return document.querySelector(".panel .event-head h2").textContent;'), '25 April');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("actor");'), null,
      'going back to the event closes the actor rather than leaving it open');

    // And the browser's own Back and Forward do exactly the same thing.
    await page.eval('history.forward(); return true;');
    for (let tries = 0; tries < 100; tries += 1) {
      if (await page.eval('return Boolean(document.querySelector(".panel .actor-head h2"));')) break;
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
    assert.equal(await page.eval('return document.querySelector(".panel .actor-head h2").textContent;'), 'Estado Novo');
    await page.eval('history.back(); return true;');
    for (let tries = 0; tries < 100; tries += 1) {
      if (await page.eval('return Boolean(document.querySelector(".panel .event-head h2"));')) break;
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
    assert.equal(await page.eval('return document.querySelector(".panel .event-head h2").textContent;'), '25 April');
  });
});

test('moving the view is not an opening: Back does not undo a pan', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    const before = await page.eval('return history.length;');
    await page.eval('document.querySelector(\'.panel [data-action="year"]\').click(); return true;');
    assert.equal(await page.eval('return history.length;'), before,
      'a change to the window replaced the entry rather than adding one');
    assert.match(await page.eval('return location.search;'), /to=1974/);
  });
});

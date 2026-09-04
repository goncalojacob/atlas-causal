// The entry page in a real browser. Everything else about it is checked as a
// string, which cannot say whether the module graph loads, whether the fetch
// of the record file arrives, or whether the markup the renderer wrote is the
// markup the browser parsed — and the last of those is the one that matters
// most, because the whole point of the subset is that nothing in a body
// becomes an element.
//
// Headless Chromium's own command line, with --dump-dom: no Puppeteer, no
// Playwright, no npm, which is the rule for this repository. A machine with
// no browser is not a broken repository, so these skip rather than fail —
// tools/screens.mjs takes the same view.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer, HOST } from '../tools/serve.mjs';
import { findChrome } from '../tools/screens.mjs';

const chrome = findChrome();
const skip = chrome ? false : 'no headless browser found; set $CHROME to one';

function dumpDom(bin, url) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [
      '--headless', '--disable-gpu', '--no-sandbox',
      // The browser advances its own clock, so this is a budget and not a
      // sleep: enough for the topology, the record file and two typefaces.
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

// The server refuses a Host whose port is not the one it was configured
// with, so the port has to be known before it is created: take an ephemeral
// one, give it back, and start the real server on that number. The same
// two-step tests/serve.test.mjs uses, and for the same reason.
async function withServer(fn) {
  const probe = createServer({ port: 0 });
  await new Promise((resolve) => probe.listen(0, HOST, resolve));
  const { port } = probe.address();
  probe.close();
  await new Promise((resolve) => probe.once('close', resolve));

  const server = createServer({ port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));
  try {
    return await fn((path) => `http://${HOST}:${port}/${path}`);
  } finally {
    server.close();
    await new Promise((resolve) => server.once('close', resolve));
  }
}

test('an entry with no body renders its metadata and the notice', { skip }, async () => {
  const dom = await withServer((url) => dumpDom(chrome, url('entry.html?id=carnation-revolution-1974')));
  // The atlas's own title for the record, which is "25 April" and not the
  // name Wikipedia files it under; the link out offers the other one.
  assert.match(dom, /<h1>25 April<\/h1>/);
  assert.match(dom, /<p class="entry-kind">event<\/p>/);
  assert.match(dom, /1974/, 'the dates are on the page');
  assert.match(dom, /class="entry-back"/);
  assert.match(dom, /entry-body empty/);
  assert.match(dom, /Nobody has written the long entry for this record yet/);
  assert.match(dom, /class="entry-sources"/, 'the record\'s own sources are listed all the same');
  assert.doesNotMatch(dom, /Could not load the entry/);
});

test('a body renders as headings, lists, record links and citation marks', { skip }, async () => {
  const dom = await withServer((url) => dumpDom(chrome, url('entry.html?id=fixture-event-a&fixtures=1')));
  assert.doesNotMatch(dom, /Could not load the entry/);
  // The table of contents and the headings it points at.
  assert.match(dom, /<nav class="entry-toc"/);
  assert.match(dom, /<h2 id="entry-what-the-fixture-is-for">What the fixture is for<\/h2>/);
  assert.match(dom, /<h3 id="entry-the-constructs">The constructs<\/h3>/);
  // A list, an emphasis, a quotation.
  assert.match(dom, /<li><em>emphasis<\/em> and <strong>strong emphasis<\/strong><\/li>/);
  assert.match(dom, /<blockquote>/);
  // Record links, resolved to entry pages of their own.
  assert.match(dom, /<a class="record-link place" href="entry\.html\?id=fixture-place-a&amp;fixtures=1"/);
  assert.match(dom, /<a class="record-link actor" href="entry\.html\?id=fixture-actor-one&amp;fixtures=1"/);
  // A citation mark, numbered, and the citation it aims at.
  assert.match(dom, /<a class="cite-mark" href="#entry-cite-fixture-source-1"/);
  assert.match(dom, /id="entry-cite-fixture-source-1"/);
  // And the one thing the whole subset exists for: the <b> in the fixture
  // body is text in the parsed document, not an element.
  assert.doesNotMatch(dom, /<b>this<\/b>/);
  assert.match(dom, /&lt;b&gt;this&lt;\/b&gt;/);
});

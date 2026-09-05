// The two ways out of what is on screen: the correction issue about one
// record, and the view as a file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  discussUrl, recordUrl, tokenNames, svgFile, exportName, sizeOf, collectTokens, exportSvg,
} from '../src/share.js';
import { REPOSITORY } from '../src/contribute/submit.js';

test('the discuss link opens the correction template, named for the record', () => {
  const url = discussUrl('event', 'carnation-revolution-1974', { url: 'https://example.test/index.html?selected=carnation-revolution-1974' });
  assert.ok(url.startsWith(`${REPOSITORY}/issues/new?`));
  const params = new URL(url).searchParams;
  assert.equal(params.get('template'), 'correction.yml');
  assert.equal(params.get('title'), 'Correction: carnation-revolution-1974');
  const notes = params.get('notes');
  assert.match(notes, /Record: `event\/carnation-revolution-1974`/);
  assert.match(notes, /Seen at: https:\/\/example\.test\/index\.html\?selected=carnation-revolution-1974/);
  assert.match(notes, /What is wrong with it/);
});

test('a record with nowhere to be seen still has an issue to open', () => {
  const notes = new URL(discussUrl('source', 'maxwell-1995')).searchParams.get('notes');
  assert.match(notes, /Record: `source\/maxwell-1995`/);
  assert.doesNotMatch(notes, /Seen at/);
});

test('a record\'s address is the page and the one parameter that opens it', () => {
  const base = 'https://example.test/index.html';
  assert.equal(recordUrl('event', 'carnation-revolution-1974', { base }), `${base}?selected=carnation-revolution-1974`);
  assert.equal(recordUrl('source', 'maxwell-1995', { base }), `${base}?source=maxwell-1995`);
  assert.equal(recordUrl('place', 'lisbon', { base }), `${base}?place=lisbon`);
  assert.equal(recordUrl('actor', 'salazar', { base }), `${base}?actor=salazar`);
  assert.equal(recordUrl('narrative', 'the-empire-unravels', { base }), `${base}?narrative=the-empire-unravels`);
  // An edge is walked, not opened, so it has no address of its own; nor has a
  // record with no id. Either way the page itself is still where it lives.
  assert.equal(recordUrl('edge', 'a--b--caused', { base }), base);
  assert.equal(recordUrl('event', null, { base }), base);
  assert.equal(recordUrl('event', 'x'), '?selected=x');
  assert.equal(recordUrl('edge', 'x'), null);
});

// The reader's own URL used to go into the issue whole, box, window, horizon
// and walked chain included (health review A, finding 33).
test('the issue carries the record\'s address, not the reader\'s', () => {
  const notes = new URL(discussUrl('event', 'carnation-revolution-1974', {
    url: recordUrl('event', 'carnation-revolution-1974', { base: 'https://example.test/index.html' }),
  })).searchParams.get('notes');
  assert.match(notes, /Seen at: https:\/\/example\.test\/index\.html\?selected=carnation-revolution-1974$/m);
  for (const leak of ['bbox', 'chain', 'horizon', 'from=', 'to=']) {
    assert.doesNotMatch(notes, new RegExp(leak), `${leak} does not travel`);
  }
});

// --- the view as a file ---------------------------------------------------

const CSS = ':root { --cobalt: #123456; --madder: #654321; }\n.map .land { fill: var(--land); }\n';

test('every token the stylesheet mentions is collected once, in order', () => {
  assert.deepEqual(tokenNames(CSS), ['--cobalt', '--land', '--madder']);
  assert.deepEqual(tokenNames(''), []);
  assert.deepEqual(tokenNames(null), []);
  const computed = { '--cobalt': ' #123456 ', '--madder': '#654321', '--land': '' };
  assert.deepEqual(collectTokens(CSS, { computed: (n) => computed[n] }), {
    '--cobalt': '#123456',
    '--madder': '#654321',
  }, 'a token the browser resolved to nothing is left out rather than written empty');
});

test('the file is a standalone SVG carrying the computed tokens first', () => {
  const text = svgFile({
    inner: '<g class="layer"><circle r="3"/></g>',
    viewBox: '0 0 960 540',
    width: 960,
    height: 540,
    className: 'map',
    css: CSS,
    tokens: { '--cobalt': '#123456' },
  });
  assert.match(text, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/);
  assert.match(text, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 960 540" width="960" height="540" class="map"/);
  assert.match(text, /:root \{\n {2}--cobalt: #123456;\n\}/);
  // The stylesheet comes with it: the classes on the marks are the drawing.
  assert.ok(text.indexOf('--cobalt: #123456') < text.indexOf('.map .land'), 'the computed tokens win over the stylesheet');
  assert.match(text, /<circle r="3"\/>/);
  assert.match(text, /<\/svg>\n$/);
});

test('the size comes off the viewBox, and a missing one is no size at all', () => {
  assert.deepEqual(sizeOf('0 0 960 540'), { width: 960, height: 540 });
  assert.deepEqual(sizeOf('  0   0 1200 800 '), { width: 1200, height: 800 });
  assert.deepEqual(sizeOf(''), { width: 0, height: 0 });
  assert.deepEqual(sizeOf(null), { width: 0, height: 0 });
  assert.deepEqual(sizeOf('0 0 wide tall'), { width: 0, height: 0 });
  assert.doesNotMatch(svgFile({ viewBox: '' }), /width=/);
});

test('the file is named for the view and the day it was taken', () => {
  assert.equal(exportName('map', { date: new Date('2026-09-05T22:10:00Z') }), 'atlas-causal-map-2026-09-05.svg');
  assert.equal(exportName('graph', { date: new Date('2026-01-01T00:00:00Z') }), 'atlas-causal-graph-2026-01-01.svg');
});

// The download itself, on a hand-made document: everything the browser does
// here is injected, so what is left untested is only the click.
test('exporting hands the browser a blob and a file name', async () => {
  const clicks = [];
  const revoked = [];
  const created = [];
  const link = { click: () => clicks.push(link.download), remove: () => {}, rel: '', href: '', download: '' };
  const doc = {
    documentElement: {},
    body: { appendChild: () => {} },
    createElement: () => link,
  };
  const win = {
    Blob: class { constructor(parts, options) { this.parts = parts; this.options = options; } },
    URL: {
      createObjectURL: (blob) => { created.push(blob); return 'blob:1'; },
      revokeObjectURL: (url) => revoked.push(url),
    },
    getComputedStyle: () => ({ getPropertyValue: (n) => ({ '--cobalt': '#123456' })[n] ?? '' }),
  };
  const root = {
    innerHTML: '<circle r="3"/>',
    getAttribute: (name) => ({ viewBox: '0 0 960 540', class: 'map' })[name] ?? null,
  };
  const name = await exportSvg(root, {
    view: 'map',
    name: 'atlas-causal-map-test.svg',
    fetch: async () => ({ ok: true, text: async () => CSS }),
    doc,
    win,
  });
  assert.equal(name, 'atlas-causal-map-test.svg');
  assert.deepEqual(clicks, ['atlas-causal-map-test.svg']);
  assert.equal(link.href, 'blob:1');
  assert.equal(created.length, 1);
  assert.equal(created[0].options.type, 'image/svg+xml');
  const text = created[0].parts[0];
  assert.match(text, /--cobalt: #123456/);
  assert.match(text, /<circle r="3"\/>/);
});

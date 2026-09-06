// The pages the build writes (H8): sources.html's list, narratives.html's
// cards and entry/<id>.html.
//
// The promise being kept here is a narrow one and worth stating: **what a
// reader gets before any script has run is what the script would have
// produced**. So the assertions are made against the committed files and
// against a build over the synthetic dataset, and never against a browser —
// the point is precisely that no browser is involved.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, readFile, rm, writeFile, mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  buildIndex, readSite, compareSite, writeSite, readTemplates, pageReport, TEMPLATES,
} from '../tools/build-index.mjs';
import { entryRecords, injectInto, entryPage, OPEN, CLOSE, ENTRY_DIR } from '../tools/lib/prerender.mjs';
import { bibliographyHtml } from '../src/sources/bibliography.js';
import { narrativesHtml } from '../src/narratives/list.js';
import { loadSources } from '../src/data.js';
import { ROOT, FIXTURE_DATA, fixtures as fixtureRecords } from './helpers.mjs';

const read = (...parts) => readFile(path.join(ROOT, ...parts), 'utf8');
const fromDisk = (dataRoot) => (rel) => readFile(path.join(dataRoot, rel), 'utf8').then(JSON.parse);

// A site to write into, so that nothing here touches the repository's own
// pages. The templates are the real ones: what is under test is the surgery
// on them, and a hand-written template would prove nothing about the file
// the build actually cuts.
async function scratchSite() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-site-'));
  for (const name of TEMPLATES) await writeFile(path.join(dir, name), await read(name), 'utf8');
  return dir;
}

test('the committed bibliography is the list bibliographyHtml produces, in the file', async () => {
  const { sources } = await loadSources({ dataRoot: '', fetchJson: fromDisk(path.join(ROOT, 'data')) });
  const html = await read('sources.html');
  const markup = html.slice(html.indexOf(OPEN) + OPEN.length, html.indexOf(CLOSE)).trim();
  assert.equal(markup, bibliographyHtml(sources).trim());
  // Not a loading message and not an empty div: the reader with no script
  // gets the books (health review A, finding 15).
  assert.ok(sources.length >= 20, `${sources.length} sources`);
  for (const source of sources) {
    assert.ok(html.includes(`index.html?source=${source.id}`), `${source.id} is not in the committed page`);
  }
  assert.doesNotMatch(markup, /Loading…/);
});

test('the committed narratives page carries every active account and its period', async () => {
  const html = await read('narratives.html');
  const markup = html.slice(html.indexOf(OPEN) + OPEN.length, html.indexOf(CLOSE)).trim();
  const built = await buildIndex();
  assert.equal(markup, built.pages['narratives.html'].slice(
    built.pages['narratives.html'].indexOf(OPEN) + OPEN.length,
    built.pages['narratives.html'].indexOf(CLOSE),
  ).trim());
  assert.match(markup, /class="narrative-card"/);
  assert.match(markup, /class="narrative-period"/);
  assert.doesNotMatch(markup, /Loading…/);
});

test('a generated slot says so, and the two pages carry exactly one region each', async () => {
  for (const [name, id] of [['sources.html', 'bibliography'], ['narratives.html', 'narratives']]) {
    const html = await read(name);
    assert.equal((html.match(new RegExp(OPEN, 'g')) ?? []).length, 1, `${name} has one open mark`);
    assert.equal((html.match(new RegExp(CLOSE.replace('/', '\\/'), 'g')) ?? []).length, 1, `${name} has one close mark`);
    // The attribute is what tells the bootstrap there is nothing to enhance.
    assert.match(html, new RegExp(`<div id="${id}" data-prerendered="1">`), name);
  }
  // entry.html is the address and is not itself prerendered: its slot is
  // empty and its script does all the work.
  const entry = await read('entry.html');
  assert.match(entry, /<div id="entry"><p class="muted">Loading…<\/p><\/div>/);
  assert.match(entry, /<!--prerender:head-->/);
});

test('injectInto replaces whatever is between the marks, and refuses a page with none', () => {
  const page = `<div>${OPEN}\nold\n${CLOSE}</div>`;
  assert.equal(injectInto(page, 'new'), `<div>${OPEN}\nnew\n${CLOSE}</div>`);
  assert.equal(injectInto(injectInto(page, 'new'), 'newer'), `<div>${OPEN}\nnewer\n${CLOSE}</div>`);
  assert.throws(() => injectInto('<div></div>', 'x'), /no <!--prerendered--\>/);
});

test('only a record with a body gets a page of its own', async () => {
  const { records } = await fixtureRecords();
  const chosen = entryRecords(records);
  assert.ok(chosen.length >= 1, 'the fixture dataset has a record with a full entry');
  for (const record of chosen) {
    assert.ok(['event', 'actor', 'place'].includes(record.kind), `${record.id} is a kind with a page`);
    assert.ok(record.body.trim() !== '');
  }
  // An edge or a source is read inside the atlas and never gets a file.
  assert.deepEqual(entryRecords(records.filter((r) => r.kind === 'edge')), []);
  // A body of whitespace is not a body.
  assert.deepEqual(entryRecords([{ kind: 'event', id: 'e', body: '   ' }]), []);
});

test('a prerendered entry is the whole entry, under a base, canonical to entry.html?id=', async () => {
  const site = await scratchSite();
  try {
    const built = await buildIndex(FIXTURE_DATA);
    await writeSite(site, built.pages);
    const names = Object.keys(built.pages).filter((n) => n.startsWith(`${ENTRY_DIR}/`));
    assert.ok(names.length >= 1, 'the fixture build wrote an entry page');
    const html = built.pages[names[0]];
    const id = path.basename(names[0], '.html');

    // The address stays entry.html?id=; this file says so itself.
    assert.match(html, new RegExp(`<link rel="canonical" href="entry\\.html\\?id=${id}">`));
    // One directory down, so every relative URL in the template resolves.
    assert.match(html, /<base href="\.\.\/">/);
    assert.match(html, /<link rel="stylesheet" href="src\/style\.css">/);
    assert.match(html, /<script type="module" src="src\/entry\/main\.js"><\/script>/);
    // The record's own name in the tab, not "Entry".
    assert.doesNotMatch(html, /<title>Entry — Atlas causal<\/title>/);
    assert.match(html, /<title>.+ — Atlas causal<\/title>/);
    // The entry itself, rendered: the long text, the sources, the way back.
    assert.match(html, /<section class="entry-body">/);
    assert.match(html, /class="entry-sources"/);
    assert.match(html, /href="index\.html\?selected=/);
    assert.doesNotMatch(html, /Loading…/);
    // And the marker the bootstrap reads to leave the page alone.
    assert.match(html, new RegExp(`<div id="entry" data-prerendered="1" data-id="${id}"`));

    // It is on disk where the URL says it is.
    assert.equal(await readFile(path.join(site, ENTRY_DIR, `${id}.html`), 'utf8'), html);
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('writeSite prunes an entry page the build no longer names', async () => {
  const site = await scratchSite();
  try {
    const built = await buildIndex(FIXTURE_DATA);
    await writeSite(site, built.pages);
    await writeFile(path.join(site, ENTRY_DIR, 'gone.html'), '<p>stale</p>', 'utf8');
    assert.deepEqual(compareSite(await readSite(site), built.pages), [`stale ${ENTRY_DIR}/gone.html`]);
    await writeSite(site, built.pages);
    assert.deepEqual(compareSite(await readSite(site), built.pages), []);
    assert.ok(!(await readdir(path.join(site, ENTRY_DIR))).includes('gone.html'));
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('a site with no entry pages at all is fresh, and the directory is not required', async () => {
  const site = await scratchSite();
  try {
    const built = await buildIndex();
    assert.deepEqual(Object.keys(built.pages).filter((n) => n.startsWith(`${ENTRY_DIR}/`)), [],
      'no record in data/ carries a body yet, so no entry page is written');
    await writeSite(site, built.pages);
    assert.deepEqual(compareSite(await readSite(site), built.pages), []);
    // An empty entry/ is removed rather than committed as an empty directory.
    await mkdir(path.join(site, ENTRY_DIR), { recursive: true });
    await writeSite(site, built.pages);
    assert.deepEqual((await readdir(site)).filter((n) => n === ENTRY_DIR), []);
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('the repository site is what the build produces', async () => {
  const built = await buildIndex();
  assert.deepEqual(compareSite(await readSite(ROOT), built.pages), []);
  // And a page changed by hand is caught, which is what rule 16 is for.
  const stale = { ...built.pages, 'sources.html': `${built.pages['sources.html']}<!-- edited -->` };
  assert.deepEqual(compareSite(await readSite(ROOT), stale), ['differs sources.html']);
});

test('building the pages twice from the same data is byte-identical', async () => {
  const a = await buildIndex(FIXTURE_DATA);
  const b = await buildIndex(FIXTURE_DATA);
  assert.deepEqual(Object.keys(a.pages), Object.keys(b.pages));
  for (const name of Object.keys(a.pages)) assert.equal(a.pages[name], b.pages[name], name);
});

test('the build reports the file count and the bytes', async () => {
  const built = await buildIndex();
  const report = pageReport(built.pages);
  assert.equal(report.files, Object.keys(built.pages).length);
  assert.ok(report.bytes > 1000, `${report.bytes} bytes`);
  assert.equal(report.bytes, report.rows.reduce((n, r) => n + r.bytes, 0));
  assert.equal(report.entries, report.rows.filter((r) => r.name.startsWith(`${ENTRY_DIR}/`)).length);
});

test('entryPage refuses a template that has lost one of its marks', async () => {
  const templates = await readTemplates();
  const record = { id: 'x', kind: 'event', title: 'X' };
  const args = { kind: 'event', record, markup: '<p>x</p>' };
  assert.ok(entryPage(templates['entry.html'], args).includes('<p>x</p>'));
  assert.throws(() => entryPage(templates['entry.html'].replace('<!--prerender:head-->', ''), args), /prerender:head/);
  assert.throws(() => entryPage(templates['entry.html'].replace(/<title>[^<]*<\/title>/, ''), args), /<title>/);
  assert.throws(() => entryPage(templates['entry.html'].replace(/<div id="entry"[\s\S]*?<\/div>/, ''), args), /<div id="entry">/);
});

test('a prerendered page loads only local modules and the stylesheet', async () => {
  const built = await buildIndex(FIXTURE_DATA);
  for (const [name, html] of Object.entries(built.pages)) {
    for (const [, tag, , url] of html.matchAll(/<(script|link|img|iframe|source)\b[^>]*\b(src|href)="([^"]*)"/g)) {
      if (url.startsWith('entry.html?')) continue; // the canonical link, an address and not a load
      assert.doesNotMatch(url, /^(https?:)?\/\//, `${name}: <${tag}> loads ${url}`);
    }
    for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]*)"/g)) {
      assert.match(src, /^src\/(?:[a-z-]+\/)?main\.js$/, `${name}: only a bootstrap module`);
    }
  }
});

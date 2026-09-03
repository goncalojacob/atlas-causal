// The source card, against the repository's own index: a citation opens a
// card, and that card lists every record that cites the source — as many
// rows as the index says citers, no fewer.
//
// There is no DOM in node --test, so the card is checked as the string it
// produces. That is the whole of the card: renderSourceCard only assigns it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAtlas } from '../src/data.js';
import { sourceCardHtml } from '../src/panel/source.js';
import { esc } from '../src/util/esc.js';
import { ROOT } from './helpers.mjs';

async function repositoryAtlas() {
  const dataDir = path.join(ROOT, 'data');
  const read = async (rel) => JSON.parse(await readFile(path.join(dataDir, rel), 'utf8'));
  const manifest = await read('index/manifest.json');
  const [topology, sources] = await Promise.all([read(manifest.files.topology), read(manifest.files.sources)]);
  return createAtlas({
    manifest,
    topology,
    sources: sources.sources,
    fetchJson: () => Promise.reject(new Error('the source card fetches nothing')),
  });
}

// The context panel.js hands every card, reduced to what this one uses.
function context(atlas) {
  return {
    atlas,
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
  };
}

const rowsIn = (html) => (html.match(/<li class="actor-row"/g) ?? []).length;

test('a source card lists exactly as many citers as the index counts', async () => {
  const atlas = await repositoryAtlas();
  const ctx = context(atlas);
  assert.ok(atlas.sources.size > 0);
  for (const source of atlas.sources.values()) {
    const html = sourceCardHtml(ctx, source);
    assert.equal(rowsIn(html), source.citationCount, `${source.id}: a citer the card could not draw`);
    assert.match(html, new RegExp(`What cites it <span class="count">${source.citationCount}</span>`));
  }
  // And the atlas really does have a source with a lot of them: the check
  // above would pass on an empty bibliography.
  const busiest = [...atlas.sources.values()].sort((a, b) => b.citationCount - a.citationCount)[0];
  assert.ok(busiest.citationCount >= 10, `the busiest source has ${busiest.citationCount} citers`);
});

test('every kind of citer becomes a way back into the atlas', async () => {
  const atlas = await repositoryAtlas();
  const ctx = context(atlas);
  const kinds = new Set();
  for (const source of atlas.sources.values()) {
    for (const c of source.citations) kinds.add(c.kind);
  }
  assert.ok(kinds.has('event') && kinds.has('edge') && kinds.has('actor'), [...kinds].join(', '));
  const withEdge = [...atlas.sources.values()].find((s) => s.citations.some((c) => c.kind === 'edge'));
  const html = sourceCardHtml(ctx, withEdge);
  assert.match(html, /data-action="follow-edge" data-edge="/, 'an edge citer walks its own step');
  const withActor = [...atlas.sources.values()].find((s) => s.citations.some((c) => c.kind === 'actor'));
  assert.match(sourceCardHtml(ctx, withActor), /data-action="actor" data-id="/);
  assert.match(html, /data-action="clear-source"/, 'and the card can be closed');
});

test('a dissenting citation is marked as one on the card', async () => {
  const atlas = await repositoryAtlas();
  const ctx = context(atlas);
  const dissented = [...atlas.sources.values()].find((s) => s.citations.some((c) => c.dissent));
  assert.ok(dissented, 'the dataset has at least one dispute');
  assert.match(sourceCardHtml(ctx, dissented), /<span class="badge disputed">dissenting<\/span>/);
});

test('nothing from a record reaches the card unescaped', async () => {
  const atlas = await repositoryAtlas();
  const ctx = context(atlas);
  const html = sourceCardHtml(ctx, {
    id: 'nasty',
    title: '<script>alert(1)</script>',
    creators: ['<img onerror="x">'],
    year: 1999,
    type: 'book',
    status: 'active',
    url: 'javascript:alert(1)',
    citations: [],
  });
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;script&gt;/);
  // A url that is not http(s) is shown as text and never as a link.
  assert.doesNotMatch(html, /href="javascript/);
  assert.match(html, /unsafe-url/);
});

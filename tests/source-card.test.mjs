// The source card, against the repository's own index: a citation opens a
// card, and that card lists every record that cites the source — as many
// rows as the index says citers, no fewer.
//
// There is no DOM in node --test, so the card is checked as the string it
// produces. That is the whole of the card: renderSourceCard only assigns it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { discussUrl } from '../src/share.js';
import { sourceCardHtml, CITER_LIMIT } from '../src/panel/source.js';
import { esc } from '../src/util/esc.js';
import { atlasOf, ROOT } from './helpers.mjs';

const dataDir = path.join(ROOT, 'data');

// The context panel.js hands every card, reduced to what this one uses.
function context(atlas) {
  return {
    atlas,
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    lensControl: (kind, id) => `<button type="button" class="link small lens-control" data-action="focus" data-focus="${esc(kind)}:${esc(id)}">show only these</button>`,
    discussLink: (kind, id) => `<p class="discuss"><a href="${esc(discussUrl(kind, id))}" rel="noopener" target="_blank">Discuss this record</a></p>`,
  };
}

const rowsIn = (html) => (html.match(/<li class="actor-row"/g) ?? []).length;

// `atlas.sources` is the sources index — sources are not in the spine — but
// the citers a row links back to are resolved through the atlas, which is
// built from the spine like every other.
//
// Since H3b the rows themselves are not in the sources index at all: they are
// one file per source, seeded into the atlas here (helpers.mjs) as the card
// would have fetched them, and read back through `atlas.citersOf`.
const atlas = await atlasOf(dataDir);
const ctx = context(atlas);

test('a source card lists exactly as many citers as the index counts', async () => {
  assert.ok(atlas.sources.size > 0);
  for (const source of atlas.sources.values()) {
    const html = sourceCardHtml(ctx, source);
    // Long lists are cut, and the card says how many it is holding back:
    // cshapes-2-0 alone cites 1,041 records (A7).
    const drawn = Math.min(source.citationCount, CITER_LIMIT);
    assert.equal(rowsIn(html), drawn, `${source.id}: a citer the card could not draw`);
    if (source.citationCount > CITER_LIMIT) {
      assert.match(html, new RegExp(`Show the remaining ${source.citationCount - CITER_LIMIT}`));
      assert.equal(rowsIn(sourceCardHtml(ctx, source, atlas.citersOf(source.id), { all: true })), source.citationCount);
    }
    // A source nothing cites yet — the Wikimedia records are written before
    // the import that will cite them — says so instead of counting to zero.
    if (source.citationCount === 0) assert.match(html, /Nothing in the atlas cites this source yet/);
    else assert.match(html, new RegExp(`What cites it <span class="count">${source.citationCount}</span>`));
  }
  // And the atlas really does have a source with a lot of them: the check
  // above would pass on an empty bibliography.
  const busiest = [...atlas.sources.values()].sort((a, b) => b.citationCount - a.citationCount)[0];
  assert.ok(busiest.citationCount >= 10, `the busiest source has ${busiest.citationCount} citers`);
});

test('every kind of citer becomes a way back into the atlas', async () => {
  const rowsOf = (source) => atlas.citersOf(source.id) ?? [];
  const kinds = new Set();
  for (const source of atlas.sources.values()) {
    for (const c of rowsOf(source)) kinds.add(c.kind);
  }
  assert.ok(kinds.has('event') && kinds.has('edge') && kinds.has('actor'), [...kinds].join(', '));
  const withEdge = [...atlas.sources.values()].find((s) => rowsOf(s).some((c) => c.kind === 'edge'));
  const html = sourceCardHtml(ctx, withEdge);
  assert.match(html, /data-action="follow-edge" data-edge="/, 'an edge citer walks its own step');
  const withActor = [...atlas.sources.values()].find((s) => rowsOf(s).some((c) => c.kind === 'actor'));
  assert.match(sourceCardHtml(ctx, withActor), /data-action="actor" data-id="/);
  assert.match(html, /data-action="clear-source"/, 'and the card can be closed');
});

test('a dissenting citation is marked as one on the card', async () => {
  const dissented = [...atlas.sources.values()].find((s) => (atlas.citersOf(s.id) ?? []).some((c) => c.dissent));
  assert.ok(dissented, 'the dataset has at least one dispute');
  assert.match(sourceCardHtml(ctx, dissented), /<span class="badge disputed">dissenting<\/span>/);
});

test('nothing from a record reaches the card unescaped', async () => {
  const html = sourceCardHtml(ctx, {
    id: 'nasty',
    title: '<script>alert(1)</script>',
    creators: ['<img onerror="x">'],
    year: 1999,
    type: 'book',
    status: 'active',
    url: 'javascript:alert(1)',
    citationCount: 0,
  }, []);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;script&gt;/);
  // A url that is not http(s) is shown as text and never as a link.
  assert.doesNotMatch(html, /href="javascript/);
  assert.match(html, /unsafe-url/);
});

test('the source card carries the lens control', async () => {
  const source = [...atlas.sources.values()][0];
  const html = sourceCardHtml(ctx, source);
  assert.match(html, new RegExp(`data-action="focus" data-focus="source:${source.id}"`));
});

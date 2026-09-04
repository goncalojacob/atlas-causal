// The actor card's relations section: the same record read from both ends,
// grouped by type, and nothing from a record reaching the markup unescaped.
//
// There is no DOM in node --test, so the card is checked as the string it
// produces — renderActorCard only assigns it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAtlas } from '../src/data.js';
import { actorCardHtml } from '../src/panel/actor.js';
import { articleFor } from '../src/wikipedia.js';
import { esc } from '../src/util/esc.js';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

async function fixtureAtlas() {
  const read = async (rel) => JSON.parse(await readFile(path.join(FIXTURE_DATA, rel), 'utf8'));
  const manifest = await read('index/manifest.json');
  const [topology, sources] = await Promise.all([read(manifest.files.topology), read(manifest.files.sources)]);
  return createAtlas({
    manifest,
    topology,
    sources: sources.sources,
    fetchJson: () => Promise.reject(new Error('the card fetches its text separately')),
  });
}

// The context panel.js hands every card, reduced to what this one uses.
function context(atlas) {
  return {
    atlas,
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    laneLabel: (region) => region ?? '',
    lensControl: (kind, id) => `<button type="button" class="link small lens-control" data-action="focus" data-focus="${kind}:${id}">show only these</button>`,
    entryLink: (kind, id) => `<p class="entry-link"><a href="entry.html?id=${esc(id)}">Read the full entry →</a></p>`,
    wikipediaHtml: (record) => {
      const article = articleFor(record, ['pt']);
      return article ? `<p class="wikipedia"><a href="${esc(article.href)}" rel="noopener" target="_blank">Read more on Wikipedia</a></p>` : '';
    },
  };
}

const headings = (html) => [...html.matchAll(/<h3>([^<]*)<\/h3>/g)].map((m) => m[1]);

test('a relation is headed one way on one card and the other way on the other', async () => {
  const atlas = await fixtureAtlas();
  const ctx = context(atlas);
  const regime = actorCardHtml(ctx, atlas.actors.get('fixture-polity-four'));
  assert.deepEqual(headings(regime), ['Regime of']);
  assert.match(regime, /data-action="actor" data-id="fixture-polity-three"/);
  const state = actorCardHtml(ctx, atlas.actors.get('fixture-polity-three'));
  assert.deepEqual(headings(state), ['Regimes']);
  assert.match(state, /data-action="actor" data-id="fixture-polity-four"/);
  assert.match(state, /<span class="when">1120 – 1260<\/span>/);
  // The note the record carries is drawn with it, and comes from the topology
  // rather than from a fetch.
  assert.match(state, /Synthetic: a regime of a synthetic state\./);
});

test('two relations between the same pair are two groups, in a fixed order', async () => {
  const atlas = await fixtureAtlas();
  const ctx = context(atlas);
  assert.deepEqual(headings(actorCardHtml(ctx, atlas.actors.get('fixture-actor-one'))), ['Member of', 'Led']);
  assert.deepEqual(headings(actorCardHtml(ctx, atlas.actors.get('fixture-actor-two'))), ['Members', 'Led by']);
  assert.match(actorCardHtml(ctx, atlas.actors.get('fixture-actor-one')), /<h2>Relations <span class="count">2<\/span><\/h2>/);
});

test('an actor in no relation has no relations section at all', async () => {
  const atlas = await fixtureAtlas();
  const ctx = context(atlas);
  const html = actorCardHtml(ctx, { ...atlas.actors.get('fixture-actor-one'), id: 'fixture-nobody' });
  assert.doesNotMatch(html, /class="relations"/);
});

test('the atlas\'s own cards: Portugal\'s four regimes and what Salazar led', async () => {
  const dataDir = path.join(ROOT, 'data');
  const read = async (rel) => JSON.parse(await readFile(path.join(dataDir, rel), 'utf8'));
  const manifest = await read('index/manifest.json');
  const [topology, sources] = await Promise.all([read(manifest.files.topology), read(manifest.files.sources)]);
  const atlas = createAtlas({ manifest, topology, sources: sources.sources, fetchJson: () => Promise.reject(new Error('the card fetches its text separately')) });
  const ctx = context(atlas);

  const portugal = actorCardHtml(ctx, atlas.actors.get('portugal'));
  assert.deepEqual(headings(portugal), ['Regimes']);
  assert.match(portugal, /<h2>Relations <span class="count">4<\/span><\/h2>/);
  for (const regime of ['first-portuguese-republic', 'military-dictatorship', 'estado-novo', 'third-portuguese-republic']) {
    assert.match(portugal, new RegExp(`data-action="actor" data-id="${regime}"`), regime);
  }

  const salazar = actorCardHtml(ctx, atlas.actors.get('salazar'));
  assert.deepEqual(headings(salazar), ['Led']);
  assert.match(salazar, /data-action="actor" data-id="estado-novo"/);
  assert.match(salazar, /1932 – 1968/);

  // The regime's own card is where all six directions meet.
  assert.deepEqual(
    headings(actorCardHtml(ctx, atlas.actors.get('estado-novo'))),
    ['Regime of', 'Parts of it', 'Led by', 'Allied with'],
  );
  // Both successions are drawn from the colony's end and the state's.
  assert.deepEqual(headings(actorCardHtml(ctx, atlas.actors.get('british-india'))), ['Succeeded by']);
  assert.deepEqual(headings(actorCardHtml(ctx, atlas.actors.get('indonesia'))), ['Successor of']);
});

test('nothing from a relation reaches the card unescaped', async () => {
  const atlas = await fixtureAtlas();
  const nasty = { id: 'x--y--led', from: 'x', to: '<img onerror="a">', type: 'led', when: { start: 1200, end: 1200 }, note: '<script>alert(1)</script>', status: 'active' };
  const ctx = context({
    ...atlas,
    actors: new Map([['x', { id: 'x', name: 'X', actorType: 'person', names: ['X'], when: { start: 1100, end: 1200 }, status: 'active' }]]),
    relationsByActor: new Map([['x', [{ relation: nasty, direction: 'out', other: nasty.to }]]]),
  });
  const html = actorCardHtml(ctx, ctx.atlas.actors.get('x'));
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;script&gt;/);
});

// The lens is offered where the record is read: an actor's card is the way
// into "show only these events" and out of it again.
test('the actor card carries the lens control', async () => {
  const atlas = await fixtureAtlas();
  const html = actorCardHtml(context(atlas), atlas.actors.get('fixture-actor-one'));
  assert.match(html, /data-action="focus" data-focus="actor:fixture-actor-one"/);
});

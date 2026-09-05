// The place card, as the string it produces: a head, and collapsible
// sections with counts, the same arrangement the event and actor cards have
// since M26. A place opens on its own history, having no consequences to
// fall back to.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAtlas } from '../src/data.js';
import { placeCardHtml } from '../src/panel/place.js';
import { esc } from '../src/util/esc.js';
import { bounds } from '../src/util/dates.js';
import { ROOT } from './helpers.mjs';

const dataDir = path.join(ROOT, 'data');
const read = async (rel) => JSON.parse(await readFile(path.join(dataDir, rel), 'utf8'));
const manifest = await read('index/manifest.json');
const [topology, sources] = await Promise.all([read(manifest.files.topology), read(manifest.files.sources)]);
const atlas = createAtlas({
  manifest, topology, sources: sources.sources,
  fetchJson: () => Promise.reject(new Error('the card fetches its text separately')),
});

const ctx = {
  atlas,
  historyHtml: () => '',
  laneLabel: (region) => region ?? '',
  startYear: (event) => bounds(event.when.start).min,
  lensControl: (kind, id) => `<button type="button" class="link small lens-control" data-action="focus" data-focus="${kind}:${id}">show only these</button>`,
  entryLink: (kind, id) => `<p class="entry-link"><a href="entry.html?id=${esc(id)}">Read the full entry →</a></p>`,
  discussLink: () => '<p class="discuss"><a href="#">Discuss this record</a></p>',
  wikipediaHtml: () => '',
};
const state = (patch = {}) => ({ from: null, to: null, source: null, ...patch });
const keys = (html) => [...html.matchAll(/<section class="card-section(?: open)?" data-section="([a-z-]+)">/g)].map((m) => m[1]);
const count = (html, key) => html
  .match(new RegExp(`data-section="${key}"[\\s\\S]*?<span class="count[^"]*">([^<]*)</span>`))?.[1] ?? null;

test('the place card is sections with counts, opening on what happened there', () => {
  const html = placeCardHtml(ctx, atlas.places.get('lisbon'), state());
  assert.deepEqual(keys(html), ['events', 'actors', 'sources']);
  assert.match(html, /<section class="card-section open" data-section="events">/);
  assert.equal(count(html, 'events'), String((atlas.eventsByPlace.get('lisbon') ?? []).length));
  // A place is a geographic fact and is exempt from "every node cites a
  // source" (M9), so a zero here is the record being right, not missing.
  assert.equal(count(html, 'sources'), String(atlas.citationCount('place', 'lisbon')));
  assert.match(html, /A place is a geographic fact and need cite nothing\./);
});

test('a place reached from a source card opens its sources; otherwise the choice stands', () => {
  const place = atlas.places.get('lisbon');
  const fromSource = placeCardHtml(ctx, place, state({ source: 'maxwell-1995-making-of-portuguese-democracy' }));
  assert.match(fromSource, /<section class="card-section open" data-section="sources">/);
  const remembered = placeCardHtml(ctx, place, state(), { remembered: 'actors' });
  assert.match(remembered, /<section class="card-section open" data-section="actors">/);
});

test('nothing a place carries reaches the card unescaped', () => {
  const nasty = {
    id: 'x', name: '<img onerror="a">', names: ['<img onerror="a">', '<b>also</b>'],
    where: { lon: 1, lat: 2, precision: 'city' }, region: 'europe', status: 'active',
  };
  const html = placeCardHtml({ ...ctx, atlas: { ...atlas, eventsByPlace: new Map() } }, nasty, state());
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /<b>also<\/b>/);
  assert.match(html, /&lt;img onerror=/);
});

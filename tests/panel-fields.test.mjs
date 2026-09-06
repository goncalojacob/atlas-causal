// A14: three fields M30a wrote and nothing read — a place's dated names, the
// note beside an actor's role, and an event with no lane at all.
//
// Each is checked on the card that draws it, as the string it produces: there
// is no DOM in node --test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { historicalNamesHtml } from '../src/panel/place.js';
import { actorCardHtml } from '../src/panel/actor.js';
import { eventCardHtml } from '../src/panel/event.js';
import { esc } from '../src/util/esc.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

function context(atlas) {
  return {
    atlas,
    historyHtml: () => '',
    partOfHtml: () => '',
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    laneLabel: (region) => atlas.regions.find((r) => r.id === region)?.label ?? region ?? '—',
    lensControl: () => '',
    lanes: () => [],
    startYear: (event) => event.when.start,
    entryLink: () => '',
    discussLink: () => '',
    wikipediaHtml: () => '',
    highlightedActor: () => null,
    walkWasCut: () => false,
  };
}

const atlas = await atlasOf(FIXTURE_DATA);
const ctx = context(atlas);
const state = {
  chain: [], group: 'none', horizon: null, from: null, to: null, source: null, actor: null,
};

// --- a place's dated names -----------------------------------------------

test('a dated name is drawn with the years it held, and an undated one without', () => {
  const html = historicalNamesHtml([
    { name: 'Lourenço Marques', from: 1895, to: 1976 },
    { name: 'Maputo', from: 1976, to: null },
    { name: 'Before that', from: null, to: 1895 },
    { name: 'Nobody dated this', from: null, to: null },
  ]);
  assert.match(html, /Lourenço Marques<\/span> <span class="when">1895 – 1976<\/span>/);
  assert.match(html, /Maputo<\/span> <span class="when">from 1976<\/span>/);
  assert.match(html, /Before that<\/span> <span class="when">until 1895<\/span>/);
  // A record that does not date a name is not dated by the card.
  assert.match(html, /<span class="row-what">Nobody dated this<\/span> <\/li>/);
});

test('a place with no dated names draws nothing at all', () => {
  assert.equal(historicalNamesHtml(undefined), '');
  assert.equal(historicalNamesHtml([]), '');
  assert.equal(historicalNamesHtml('not a list'), '');
});

test('a dated name reaches the DOM escaped', () => {
  const html = historicalNamesHtml([{ name: '<script>alert(1)</script>', from: null, to: null }]);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

// --- the note beside a role ----------------------------------------------

test('an actor\'s appearances show the note beside the role', () => {
  // fixture-event-t names fixture-actor-two as signatory, with a note.
  const html = actorCardHtml(ctx, atlas.actors.get('fixture-actor-two'), { state });
  assert.match(html, /<span class="role">signatory<\/span>\s*<span class="row-note muted">signed it for the synthetic party<\/span>/);
  // A line with no note draws no empty element.
  const plain = actorCardHtml(ctx, atlas.actors.get('fixture-actor-one'), { state });
  assert.doesNotMatch(plain, /class="row-note"/);
});

test('an event\'s chip carries the note after the role, where the room is', () => {
  const event = atlas.events.get('fixture-event-t');
  const html = eventCardHtml(ctx, { event, found: { via: [] }, state });
  assert.match(html, /title="[^"]*signatory, signed it for the synthetic party[^"]*"/);
  // The chip's own text is still the name and the bare role: a note is a
  // sentence and a chip is a name.
  assert.match(html, /<span class="role"> · signatory<\/span>/);
});

// --- an event with no lane -----------------------------------------------

test('an event with no region says "no lane" rather than an em dash', () => {
  const event = atlas.events.get('fixture-event-a');
  const placed = eventCardHtml(ctx, { event, found: { via: [] }, state });
  assert.match(placed, /<span class="lane">[^<]+<\/span>/);
  assert.doesNotMatch(placed, /<span class="lane">no lane<\/span>/);

  // `region` is optional everywhere since M30a-3, and an event with neither a
  // place nor a region is drawn in no lane — which the card now says instead
  // of printing the dash `laneLabel` returns for nothing at all.
  const nowhere = { ...event, region: null, place: null };
  const html = eventCardHtml(ctx, { event: nowhere, found: { via: [] }, state });
  assert.match(html, /<span class="lane">no lane<\/span>/);
  assert.doesNotMatch(html, /<span class="lane">—<\/span>/);
});

// --- an event inside an event --------------------------------------------
//
// `parent` is a display fact and never an argument: the card says what the
// event is part of and lists what is inside it, and nothing about the
// consequences, the causes or the convergence changes for either.

test('a child says what it is part of, and a parent lists its parts in order', () => {
  // fixture-event-t (1280) and fixture-event-h (1290) are both inside
  // fixture-event-f.
  const child = eventCardHtml(ctx, { event: atlas.events.get('fixture-event-h'), found: { via: [] }, state });
  assert.match(child, /<p class="part-of-event">Part of\s*<button[^>]*data-action="select" data-id="fixture-event-f"/);
  assert.doesNotMatch(child, /data-section="parts"/, 'a leaf has no parts');

  const parent = eventCardHtml(ctx, { event: atlas.events.get('fixture-event-f'), found: { via: [] }, state });
  assert.doesNotMatch(parent, /class="part-of-event"/, 'the parent is inside nothing');
  const parts = parent.match(/data-section="parts"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.deepEqual(
    [...parts.matchAll(/data-action="select" data-id="([^"]+)"/g)].map((m) => m[1]),
    ['fixture-event-t', 'fixture-event-h'],
  );
});

test('being part of something changes no consequence and no cause', () => {
  const parent = atlas.events.get('fixture-event-f');
  // The parts are not consequences: what the card counts under Consequences
  // is what the edges say, and `parent` is not an edge.
  const out = (atlas.adjacency.out.get('fixture-event-f') ?? []).filter((e) => atlas.edges.get(e.id)?.status === 'active');
  const html = eventCardHtml(ctx, { event: parent, found: { via: [] }, state });
  const consequences = html.match(/data-section="consequences"[\s\S]*?<span class="count[^"]*">([^<]*)</)?.[1];
  assert.equal(consequences, String(out.length));
  assert.notEqual(atlas.childrenOf.get('fixture-event-f').length, 0);
});

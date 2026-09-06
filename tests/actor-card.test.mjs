// The actor card's relations section: the same record read from both ends,
// grouped by type, and nothing from a record reaching the markup unescaped.
//
// There is no DOM in node --test, so the card is checked as the string it
// produces — renderActorCard only assigns it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { discussUrl } from '../src/share.js';
import { actorCardHtml } from '../src/panel/actor.js';
import { articleFor } from '../src/wikipedia.js';
import { esc } from '../src/util/esc.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

// The context panel.js hands every card, reduced to what this one uses.
function context(atlas) {
  return {
    atlas,
    historyHtml: () => '',
    partOfHtml: () => '<ul class="narrative-rows"></ul>',
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    laneLabel: (region) => region ?? '',
    lensControl: (kind, id) => `<button type="button" class="link small lens-control" data-action="focus" data-focus="${kind}:${id}">show only these</button>`,
    entryLink: (kind, id) => `<p class="entry-link"><a href="entry.html?id=${esc(id)}">Read the full entry →</a></p>`,
    discussLink: (kind, id) => `<p class="discuss"><a href="${esc(discussUrl(kind, id))}" rel="noopener" target="_blank">Discuss this record</a></p>`,
    wikipediaHtml: (record) => {
      const article = articleFor(record, ['pt']);
      return article ? `<p class="wikipedia"><a href="${esc(article.href)}" rel="noopener" target="_blank">Read more on Wikipedia</a></p>` : '';
    },
  };
}

// The relation groups, by their headings. Since M26 the card's own headings
// are the collapsible section heads (sections.js), so this reads the <h3>s of
// the relations section alone — the territory section writes its own.
const relationsBlock = (html) => html.match(/<section class="card-section(?: open)?" data-section="relations">[\s\S]*?<\/section>/)?.[0] ?? '';
const headings = (html) => [...relationsBlock(html).matchAll(/<h3>([^<]*)<\/h3>/g)].map((m) => m[1]);
// A section's header, as the reader sees it: its label and its count.
const count = (html, key) => html
  .match(new RegExp(`data-section="${key}"[\\s\\S]*?<span class="count[^"]*">([^<]*)</span>`))?.[1] ?? null;

// `atlas` here is the fixtures; the one test that reads the repository's own
// cards builds its own, the same way. Both come out of the spine, which is
// the only graph file there is since H3c — until then these ran twice, once
// over each (A12).
const atlas = await atlasOf(FIXTURE_DATA);

test('a relation is headed one way on one card and the other way on the other', async () => {
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
  const ctx = context(atlas);
  assert.deepEqual(headings(actorCardHtml(ctx, atlas.actors.get('fixture-actor-one'))), ['Member of', 'Led']);
  assert.deepEqual(headings(actorCardHtml(ctx, atlas.actors.get('fixture-actor-two'))), ['Members', 'Led by']);
  assert.equal(count(actorCardHtml(ctx, atlas.actors.get('fixture-actor-one')), 'relations'), '2');
});

test('an actor in no relation has no relations section at all', async () => {
  const ctx = context(atlas);
  const html = actorCardHtml(ctx, { ...atlas.actors.get('fixture-actor-one'), id: 'fixture-nobody' });
  assert.doesNotMatch(html, /data-section="relations"/);
});

test("the atlas's own cards: Portugal's four regimes and what Salazar led", async () => {
  const atlas = await atlasOf(path.join(ROOT, 'data'));
  const ctx = context(atlas);

  const portugal = actorCardHtml(ctx, atlas.actors.get('portugal'));
  // Since M29 the state's card carries its memberships of international
  // bodies beside its regimes. They are `allied-with` and not `member-of`
  // because rule 19 reserves `member-of` for a person at the `from` end.
  assert.deepEqual(headings(portugal), ['Regimes', 'Allied with']);
  assert.equal(count(portugal, 'relations'), '14');
  for (const regime of ['first-portuguese-republic', 'military-dictatorship', 'estado-novo', 'third-portuguese-republic']) {
    assert.match(portugal, new RegExp(`data-action="actor" data-id="${regime}"`), regime);
  }
  // The memberships are listed oldest first, which is what makes the section
  // readable as a sequence rather than a set.
  const memberships = ['league-of-nations', 'oeec', 'efta', 'imf', 'oecd',
    'council-of-europe', 'european-union', 'schengen-area', 'cplp', 'eurozone'];
  const positions = memberships.map((id) => portugal.indexOf(`data-id="${id}"`));
  for (const [i, at] of positions.entries()) assert.notEqual(at, -1, memberships[i]);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'memberships in date order');

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
  const html = actorCardHtml(context(atlas), atlas.actors.get('fixture-actor-one'));
  assert.match(html, /data-action="focus" data-focus="actor:fixture-actor-one"/);
});

// M26: the card is a head and collapsible sections with counts, the same
// arrangement the event card has. An actor has no consequences to fall back
// to, so it opens on its own history.
test('the actor card is sections with counts, opening on where it appears', async () => {
  const ctx = context(atlas);
  const html = actorCardHtml(ctx, atlas.actors.get('fixture-polity-three'));
  const keys = [...html.matchAll(/<section class="card-section(?: open)?" data-section="([a-z-]+)">/g)].map((m) => m[1]);
  assert.deepEqual(keys, ['appearances', 'relations', 'territory', 'sources']);
  assert.match(html, /<section class="card-section open" data-section="appearances">/);
  assert.equal(count(html, 'appearances'), String((atlas.eventsByActor.get('fixture-polity-three') ?? []).length));
  assert.equal(count(html, 'sources'), String(atlas.citationCount('actor', 'fixture-polity-three')));
  // The reader's own choice stands where the arrival says nothing.
  const remembered = actorCardHtml(ctx, atlas.actors.get('fixture-polity-three'), { remembered: 'relations' });
  assert.match(remembered, /<section class="card-section open" data-section="relations">/);
});

// ─── before and after, along `succeeded` ───────────────────────────────────
//
// The M27 splits made seventy-seven pairs like Angola: a state from 1975 and
// the colony before it, with the same name in the search box and every event
// filed under the colony, so the state's card opened with no appearances at
// all (health review B, finding 28). A synthetic pair rather than a fixture
// record: what is under test is the card, and the fixtures carry no
// succession — the repository's own do, and the browser test opens one.
function pair({ eventsBefore = 2, eventsAfter = 0 } = {}) {
  const event = (id, year) => ({ id, title: id, when: { start: year, end: year }, region: 'europe', status: 'active' });
  const before = Array.from({ length: eventsBefore }, (_, i) => event(`before-${i}`, 1960 + i));
  const after = Array.from({ length: eventsAfter }, (_, i) => event(`after-${i}`, 1980 + i));
  const relation = {
    id: 'colony--state--succeeded', type: 'succeeded', from: 'colony', to: 'state',
    when: { start: 1975, end: 1975 }, status: 'active', note: null,
  };
  return {
    actors: new Map([
      ['colony', { id: 'colony', name: 'The colony', actorType: 'polity', when: { start: 1886, end: 1975 }, names: ['The colony'], status: 'active' }],
      ['state', { id: 'state', name: 'The state', actorType: 'polity', when: { start: 1975, end: null }, names: ['The state'], status: 'active' }],
    ]),
    eventsByActor: new Map([
      ['colony', before.map((e) => ({ event: e, role: 'party' }))],
      ['state', after.map((e) => ({ event: e, role: 'party' }))],
    ]),
    relationsByActor: new Map([
      ['colony', [{ relation, direction: 'out', other: 'state' }]],
      ['state', [{ relation, direction: 'in', other: 'colony' }]],
    ]),
    presencesByActor: new Map(),
    dependenciesOf: new Map(),
    narrativesByRef: new Map(),
    citationCount: () => 0,
    record: () => new Promise(() => {}),
  };
}

const sectionOf = (html, key) => html
  .match(new RegExp(`<section class="card-section(?: open)?" data-section="${key}">[\\s\\S]*?</section>`))?.[0] ?? '';

test('an actor with no events of its own opens on what came before it', () => {
  const atlas_ = pair();
  const ctx = context(atlas_);
  const html = actorCardHtml(ctx, atlas_.actors.get('state'));
  assert.equal(count(html, 'appearances'), '0', 'the state itself records nothing');
  assert.equal(count(html, 'succession'), '2', 'and its predecessor records two');
  // The section the card opens on is the one with something in it.
  assert.match(html, /<section class="card-section open" data-section="succession">/);
  const block = sectionOf(html, 'succession');
  assert.match(block, /<h3>Before /);
  assert.doesNotMatch(block, /<h3>After /, 'nothing succeeded it');
  assert.match(block, /data-action="actor" data-id="colony"/, 'and the predecessor is a way in');
  for (const id of ['before-0', 'before-1']) {
    assert.match(block, new RegExp(`data-action="select" data-id="${id}"`), `${id} is listed`);
  }
});

test('the actor that holds the events says what came after it, and opens on its own', () => {
  const atlas_ = pair({ eventsAfter: 1 });
  const html = actorCardHtml(context(atlas_), atlas_.actors.get('colony'));
  assert.equal(count(html, 'appearances'), '2');
  assert.equal(count(html, 'succession'), '1', 'the successor records one');
  assert.match(html, /<section class="card-section open" data-section="appearances">/);
  const block = sectionOf(html, 'succession');
  assert.match(block, /<h3>After /);
  assert.doesNotMatch(block, /<h3>Before /, 'nothing preceded it');
  assert.match(block, /data-action="select" data-id="after-0"/);
});

test('an actor that succeeds nothing has no such section at all', () => {
  const ctx = context(atlas);
  const html = actorCardHtml(ctx, atlas.actors.get('fixture-actor-one'));
  assert.equal(sectionOf(html, 'succession'), '', 'nothing is said about a succession there is not');
});

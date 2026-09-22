// M84, the half a string can answer: one cross closes every card, and the act
// behind it.
//
// The owner, 22 September, on a source's card whose heading line read
// *"Norrie MacQueen · 1997 · BOOK · close · Focus on this"*: *"Here you can
// see the 'close' button. Instead it should be a simple cross on the top right
// corner."*
//
// What a browser has to answer — that the cross really is in the card's top
// right corner, and that the ring really is inked apart from the rest — is in
// `tests/m84-browser.test.mjs`. What is here is the markup every card produces
// and the patch the control writes, neither of which needs a DOM.
//
// Written before the behaviour it judges (deviations 711 and 717). Nothing
// here pins a count or a pixel.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { closes, closeControlHtml, CLOSE_LABEL, CARD_ORDER } from '../src/panel/close.js';
import { eventCardHtml } from '../src/panel/event.js';
import { edgeCardHtml } from '../src/panel/edge.js';
import { sourceCardHtml } from '../src/panel/source.js';
import { placeCardHtml } from '../src/panel/place.js';
import { actorCardHtml } from '../src/panel/actor.js';
import { officeCardHtml } from '../src/panel/office.js';
import { esc } from '../src/util/esc.js';
import { bounds } from '../src/util/dates.js';
import { atlasOf, FIXTURE_DATA } from './helpers.mjs';

// The context panel.js hands every card, wide enough for all six of them. The
// cross is not in it: it is the same markup on every card, so it comes from
// its own module and not from a helper each card could be handed a different
// version of.
function context(atlas) {
  return {
    atlas,
    laneLabel: (region) => region ?? '—',
    categoryLabel: (id) => (id ? `${id[0].toUpperCase()}${id.slice(1)}` : null),
    lanes: () => [],
    startYear: (event) => bounds(event.when.start).min,
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    entryLink: (kind, id) => `<p class="entry-link"><a href="entry.html?id=${esc(id)}">Read the full entry →</a></p>`,
    discussLink: () => '<p class="discuss"><a href="#">Discuss this record</a></p>',
    wikipediaHtml: () => '',
    historyHtml: () => '',
    lensControl: (kind, id) => `<button type="button" class="link small lens-control" data-action="focus" data-kind="${esc(kind)}" data-id="${esc(id)}">Focus on this</button>`,
    partOfHtml: () => '<ul class="narrative-rows"></ul>',
    citationsHtml: () => '',
    highlightedActor: () => null,
  };
}

const state = (patch = {}) => ({
  chain: [], horizon: null, from: null, to: null,
  selected: null, actor: null, source: null, place: null, office: null,
  edge: null, narrative: null, ...patch,
});

const atlas = await atlasOf(FIXTURE_DATA);
const ctx = context(atlas);

// Every card the panel builds out of a string, by the name the reader would
// use for it. The narrative's card is written straight into the container by
// `renderNarrativeCard`, so it is asserted in the browser suite beside the
// others rather than here.
const CARDS = {
  event: () => eventCardHtml(ctx, {
    event: atlas.events.get('fixture-event-a'), found: { via: [] }, state: state(),
  }),
  edge: () => edgeCardHtml(ctx, {
    edge: atlas.edges.get('fixture-event-a--fixture-event-b--caused'), state: state(),
  }),
  source: () => sourceCardHtml(ctx, atlas.sources.get('fixture-source-1'), []),
  place: () => placeCardHtml(ctx, atlas.places.get('fixture-place-a'), state()),
  actor: () => actorCardHtml(ctx, atlas.actors.get('fixture-actor-one'), { state: state() }),
  office: () => officeCardHtml(ctx, atlas.offices.get('fixture-office-one')),
};

const crosses = (html) => [...html.matchAll(/data-action="close-card"/g)].length;

test('every card carries exactly one close control, and it is a button named Close', () => {
  for (const [kind, build] of Object.entries(CARDS)) {
    const html = build();
    assert.equal(crosses(html), 1, `the ${kind} card has one and only one way out`);
    const button = html.match(/<button[^>]*data-action="close-card"[^>]*>/)?.[0] ?? '';
    assert.match(button, /type="button"/, `the ${kind} card's cross is a button`);
    assert.match(button, new RegExp(`aria-label="${CLOSE_LABEL}"`), `the ${kind} card's cross is named ${CLOSE_LABEL}`);
  }
});

test('and no card says "close" in its heading line any more', () => {
  for (const [kind, build] of Object.entries(CARDS)) {
    const html = build();
    assert.doesNotMatch(html, />close</, `the ${kind} card has no "close" text link`);
    // The actor card said it in its own words — "stop highlighting" — in the
    // same line of metadata the owner pointed at, and that is the line the
    // way out has left.
    assert.doesNotMatch(html, />stop highlighting</, `the ${kind} card has no second way out`);
  }
});

test('"Focus on this" and the rest of the heading line stay where they are', () => {
  for (const kind of ['event', 'source', 'place', 'actor']) {
    assert.match(CARDS[kind](), /data-action="focus"/, `the ${kind} card still offers the lens`);
  }
});

test('the cross is the same markup wherever it is drawn', () => {
  const one = closeControlHtml();
  assert.match(one, /class="card-close"/);
  // The character and not an image or a word: a cross drawn in the type the
  // card is already set in, which is what "no new hex value, token or type
  // size" leaves.
  assert.match(one, /×/);
  // The glyph itself is decoration; the name is on the button.
  assert.match(one, /aria-hidden="true"/);
});

test('what a cross takes away is the card the panel is showing', () => {
  // The panel's own precedence, top first (panel.js, render).
  assert.deepEqual(CARD_ORDER,
    ['narrative', 'edge', 'selected', 'source', 'office', 'place', 'actor']);
  assert.equal(closes(state()), null, 'with no card open there is nothing to close');
  assert.deepEqual(closes(state({ actor: 'fixture-actor-one' })), { actor: null });
  assert.deepEqual(closes(state({ place: 'fixture-place-a' })), { place: null });
  assert.deepEqual(closes(state({ source: 'fixture-source-1' })), { source: null });
  assert.deepEqual(closes(state({ office: 'fixture-office-one' })), { office: null });
  assert.deepEqual(closes(state({ narrative: 'fixture-narrative-one' })), { narrative: null });
});

test('closing the card on top leaves the card under it open', () => {
  // A reader who opened an event out of a place's list and closes the event
  // is back at the place, which is where they were.
  assert.deepEqual(
    closes(state({ place: 'fixture-place-a', selected: 'fixture-event-a' })),
    { selected: null, chain: [] },
  );
  // And a link is ahead of every other card (M80), so it is the first thing a
  // cross takes.
  assert.deepEqual(
    closes(state({ selected: 'fixture-event-a', edge: 'fixture-event-a--fixture-event-b--caused' })),
    { edge: null },
  );
});

test('the walk goes with the event it ends at', () => {
  // A chain is the path *into* the record being read; a path with nothing at
  // the end of it is not a path the reader could go on following.
  assert.deepEqual(
    closes(state({ selected: 'fixture-event-b', chain: ['fixture-event-a--fixture-event-b--caused'] })),
    { selected: null, chain: [] },
  );
});

// M80, the half that needs no browser: a connection is a record that can be
// chosen and read, a place says how precisely it is placed, and the masthead's
// count says what it is counting.
//
// The owner, 22 September, three sentences: *"In the graph I should be able to
// select a connection the same way I select an event, so I can check its
// sources, description, etc."*; *"I still only see 252 events"*; and, over an
// empty map, that the children of an imported event should be drawn where they
// have a place.
//
// `tests/m80-browser.test.mjs` holds what only a real page can answer — the
// click on a line, the mark that comes out wider, the sentence in the
// masthead. This file holds the rules underneath them, and **nothing here pins
// a count**: every number asserted is computed from the same corpus twice, by
// two different routes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createState, defaultState, formatState, parseState } from '../src/state.js';
import { edgeCardHtml } from '../src/panel/edge.js';
import { distanceToSegment } from '../src/graph-view/graph-view.js';
import { workingSet } from '../src/emphasis.js';
import { esc } from '../src/util/esc.js';
import { bounds } from '../src/util/dates.js';
import { PRECISIONS, PRECISION_IDS, PRECISION_LABEL, isCoarse } from '../src/vocab.js';
import { atlasOf, FIXTURE_DATA, ROOT, schemas } from './helpers.mjs';

const atlas = await atlasOf(path.join(ROOT, 'data'));
const fixtures = await atlasOf(FIXTURE_DATA);

// The context panel.js hands every card, reduced to what the link's card uses.
function context(which) {
  return {
    atlas: which,
    startYear: (event) => bounds(event.when.start).min,
    historyHtml: () => '',
    discussLink: (kind, id) => `<p class="discuss"><a href="#${esc(kind)}/${esc(id)}">Discuss this record</a></p>`,
    partOfHtml: () => '<ul class="narrative-rows"></ul>',
    citationsHtml: (citations) => `<ul class="citations">${(citations ?? []).map(() => '<li class="citation"></li>').join('')}</ul>`,
    isCurrent: () => true,
  };
}

const state = (patch = {}) => ({ ...defaultState(), ...patch });

// One active link out of the repository's own corpus, whichever it is: the
// assertions below are about what a card and a URL do with a link, not about
// which link it happens to be.
const anEdge = [...atlas.edges.values()].find((e) => e.status === 'active'
  && atlas.events.has(e.from) && atlas.events.has(e.to));

// ── 1. a connection is selectable ──────────────────────────────────────────

test('?edge= is the link\'s own address, and it takes an edge id and nothing else', () => {
  const id = anEdge.id;
  assert.equal(parseState(`?edge=${id}`).edge, id);
  assert.equal(formatState(state({ edge: id })), `?edge=${id}`);
  // A relation has the same three-part shape and is not a step of a causal
  // path: it links two actors and has no card of its own.
  assert.equal(parseState('?edge=portugal--nato--member-of').edge, null);
  // Nor a bare slug, which is what every other opening takes.
  assert.equal(parseState('?edge=carnation-revolution-1974').edge, null);
  assert.equal(parseState('?edge=../secret').edge, null);
  // And the default writes nothing, as every other field's does.
  assert.equal(formatState(defaultState()), '');
});

test('opening any other card leaves the link\'s card behind, and asking for a link wins', () => {
  const store = createState({ edge: anEdge.id });
  store.set({ selected: anEdge.to, chain: [] });
  assert.equal(store.get().edge, null, 'choosing an event kept the link\'s card');

  for (const patch of [{ place: 'lisbon' }, { actor: 'salazar' }, { source: 's' }, { narrative: 'n' }]) {
    const one = createState({ edge: anEdge.id });
    one.set(patch);
    assert.equal(one.get().edge, null, `${Object.keys(patch)[0]} kept the link's card`);
  }

  // A patch that names the link itself is the reader asking for it, and wins
  // however many other openings travel with it.
  const asked = createState({ edge: 'a--b--caused' });
  asked.set({ selected: 'e', edge: anEdge.id });
  assert.equal(asked.get().edge, anEdge.id);

  // And a patch that opens nothing leaves it alone: a pan, a wheel notch, a
  // band drag are not another card.
  const panned = createState({ edge: anEdge.id });
  panned.set({ bbox: [0, 1, 2, 3] });
  assert.equal(panned.get().edge, anEdge.id);
});

test('the link\'s card carries its type, both ends, the confidence and what it means', () => {
  const html = edgeCardHtml(context(atlas), { edge: anEdge, state: state() });
  const from = atlas.events.get(anEdge.from);
  const to = atlas.events.get(anEdge.to);
  // The type in the card's own words (M28's vocabulary), never the raw id
  // where one has a word of its own.
  assert.match(html, /<h2>(caused|enabled|reacted to|precondition of|inspired)<\/h2>/);
  // Both ends, each the plain event control every other list uses.
  assert.match(html, new RegExp(`data-action="select" data-id="${esc(from.id)}"`));
  assert.match(html, new RegExp(`data-action="select" data-id="${esc(to.id)}"`));
  assert.ok(html.includes(esc(from.title)) && html.includes(esc(to.title)));
  // The confidence, and the sentence that says what it means — written out and
  // not only on the badge's title, because nobody hovers a card they opened to
  // read.
  assert.match(html, new RegExp(`<span class="badge ${anEdge.confidence}"`));
  assert.match(html, /<span class="confidence-hint">[^<]+<\/span>/);
  // Where the sources and the argument land once the record does. Neither is
  // in the core, so neither is on the card before the file is.
  assert.match(html, /data-slot="edge-sources"/);
  assert.match(html, /data-slot="edge-explanation"/);
  // And the way to disagree with it, which every card in the atlas carries.
  assert.match(html, new RegExp(`#edge/${esc(anEdge.id)}`));
});

test('a disputed link\'s card has the dispute as a section of its own, and a settled one has none', () => {
  const disputed = [...atlas.edges.values()].find((e) => e.status === 'active' && e.confidence === 'disputed')
    ?? [...fixtures.edges.values()].find((e) => e.confidence === 'disputed');
  const settled = [...atlas.edges.values()].find((e) => e.status === 'active' && e.confidence !== 'disputed');
  const which = atlas.edges.has(disputed?.id ?? '') ? atlas : fixtures;
  if (disputed) {
    const html = edgeCardHtml(context(which), { edge: disputed, state: state() });
    assert.match(html, /data-section="dispute"/);
    assert.match(html, /data-slot="edge-dispute"/);
  }
  const html = edgeCardHtml(context(atlas), { edge: settled, state: state() });
  assert.doesNotMatch(html, /data-section="dispute"/);
});

test('choosing a link narrows nothing: the picture is the same with it and without', () => {
  for (const which of [atlas, fixtures]) {
    const edge = [...which.edges.values()].find((e) => e.status === 'active');
    // At rest, and inside a lens of one on an event, which is what a reader
    // most often has open when they reach for a line.
    for (const base of [state(), state({ selected: edge.from })]) {
      const before = workingSet(which, base);
      const after = workingSet(which, { ...base, edge: edge.id });
      assert.deepEqual([...after.shown].sort(), [...before.shown].sort(),
        'choosing a link changed what the views draw');
      assert.equal(after.lensFocus === null, before.lensFocus === null,
        'choosing a link turned a lens on or off');
    }
  }
});

test('which line a click means is decided by distance to the segment, and the ends are its ends', () => {
  // On the line, beside it, and past either end — the projection is clamped,
  // so a click well beyond the arrowhead is measured to the arrowhead.
  assert.equal(distanceToSegment(5, 0, 0, 0, 10, 0), 0);
  assert.equal(distanceToSegment(5, 3, 0, 0, 10, 0), 3);
  assert.equal(distanceToSegment(-4, 0, 0, 0, 10, 0), 4);
  assert.equal(distanceToSegment(13, 4, 0, 0, 10, 0), 5);
  // A segment of no length is a point, and the distance to it is the distance
  // to that point rather than a division by zero.
  assert.equal(distanceToSegment(3, 4, 0, 0, 0, 0), 5);
});

// ── 2. marks by precision ──────────────────────────────────────────────────

test('`country` joins the precisions, in the vocabulary and in the schema', async () => {
  assert.deepEqual([...PRECISION_IDS], ['point', 'city', 'region', 'country']);
  // Each has a word a card can print: a slug shown where a phrase goes is the
  // atlas presenting a derived string as what it knows.
  for (const id of PRECISION_IDS) {
    assert.equal(typeof PRECISION_LABEL[id], 'string');
    assert.ok(PRECISION_LABEL[id].length > 0, id);
    assert.notEqual(PRECISION_LABEL[id], id);
  }
  // The schema's enum is the one remaining copy — a JSON Schema cannot import
  // JavaScript — and it is held to this list, as every other closed
  // vocabulary is (tests/registry.test.mjs).
  const enumerated = (await schemas())['common/place.json'].properties.precision.enum;
  assert.deepEqual([...enumerated].sort(), [...PRECISION_IDS].sort());
});

test('a region and a country are the coarse two, and a point and a city are not', () => {
  assert.deepEqual(PRECISIONS.filter((p) => p.coarse).map((p) => p.id), ['region', 'country']);
  assert.equal(isCoarse('region'), true);
  assert.equal(isCoarse('country'), true);
  assert.equal(isCoarse('city'), false);
  assert.equal(isCoarse('point'), false);
  // A record from somewhere the validator has not been is not coarse: a mark
  // wider than its neighbours is a claim, and an unknown word makes none.
  assert.equal(isCoarse(undefined), false);
  assert.equal(isCoarse('exactish'), false);
});

test('a place\'s precision is in the core, where the first frame can read it', async () => {
  // Not in the attribute shard with its label. A mark's *shape* is drawn on
  // the frame the map first paints, and an attribute column arrives with its
  // century: a mark that was a city and became a country a moment later would
  // be the map correcting itself in front of the reader, which is the fault
  // `category` was moved into the core to stop (glyphs-brief, §1).
  const { CORE_COLUMNS, ATTRIBUTE_COLUMNS } = await import('../src/spine.js');
  const keysOf = (table) => table.place.columns.find((c) => c.name === 'where')?.keys ?? [];
  assert.ok(keysOf(CORE_COLUMNS).includes('precision'), 'the core does not carry a place\'s precision');
  assert.ok(!keysOf(ATTRIBUTE_COLUMNS).includes('precision'), 'the shard carries it too');
  // And the atlas a reader has before any shard lands reads it off a place.
  for (const place of atlas.places.values()) {
    assert.ok(PRECISION_IDS.includes(place.where.precision), `${place.id}: ${place.where.precision}`);
  }
});

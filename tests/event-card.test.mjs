// The event card, reorganised: a head with the actors as chips, a summary,
// and one collapsible section per question with the count in its header.
//
// There is no DOM in node --test, so the card is checked as the string it
// produces — renderEventCard only assigns it and then fills two slots. The
// numbers are asserted against the atlas's own topology, so a card that
// stopped counting what is actually there would fail here and not only look
// wrong in a browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { eventCardHtml } from '../src/panel/event.js';
import { esc } from '../src/util/esc.js';
import { bounds } from '../src/util/dates.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

// The context panel.js hands every card, reduced to what this one uses.
function context(atlas) {
  return {
    atlas,
    laneLabel: (region) => region ?? '—',
    lanes: () => [],
    startYear: (event) => bounds(event.when.start).min,
    eventLink: (event) => `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>`,
    entryLink: (kind, id) => `<p class="entry-link"><a href="entry.html?id=${esc(id)}">Read the full entry →</a></p>`,
    discussLink: () => '<p class="discuss"><a href="#">Discuss this record</a></p>',
    wikipediaHtml: () => '<p class="wikipedia"><a href="#">Read more on Wikipedia</a></p>',
    historyHtml: () => '',
    partOfHtml: () => '<ul class="narrative-rows"></ul>',
    highlightedActor: (state) => (state.actor ? atlas.actors.get(state.actor) ?? null : null),
  };
}

const state = (patch = {}) => ({
  chain: [], group: 'none', horizon: null, from: null, to: null,
  actor: null, source: null, ...patch,
});
const found = { via: [] };

// The header of one section: what it is called and what its count says.
function section(html, key) {
  const re = new RegExp(`<section class="card-section( open)?" data-section="${key}">[\\s\\S]*?</section>`);
  const match = html.match(re);
  if (!match) return null;
  const block = match[0];
  const count = block.match(/<span class="count[^"]*">([^<]*)<\/span>/);
  return {
    open: Boolean(match[1]) && / aria-expanded="true"/.test(block),
    count: count ? count[1] : null,
    hidden: / hidden>/.test(block),
    block,
  };
}
const keys = (html) => [...html.matchAll(/<section class="card-section(?: open)?" data-section="([a-z-]+)">/g)].map((m) => m[1]);

// Both datasets: only the fixtures hold a retracted edge, only the repository
// a merged event. Both out of the spine, which is the only graph file there
// is since H3c — until then this suite ran once over each (A12).
const atlas = await atlasOf(path.join(ROOT, 'data'));
const fixtures = await atlasOf(FIXTURE_DATA);
const carnation = atlas.events.get('carnation-revolution-1974');

test('the head carries the actors as chips, with the role in the title attribute', () => {
  const html = eventCardHtml(context(atlas), { event: carnation, found, state: state() });
  const chips = [...html.matchAll(/<button type="button" class="chip[^"]*" data-action="actor" data-id="([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(chips, [
    'armed-forces-movement', 'otelo-saraiva-de-carvalho', 'marcelo-caetano',
    'estado-novo', 'antonio-de-spinola', 'third-portuguese-republic',
  ]);
  assert.match(html, /title="Armed Forces Movement — leader \(institution\)"/);
  assert.match(html, /<span class="role"> · leader<\/span>/);
  // The head is the head: the title, one line of meta, the chips, and the
  // quiet links out. Nothing that used to be a section of its own is left
  // loose above the summary.
  assert.match(html, /<div class="head-links"><p class="entry-link">/);
  assert.doesNotMatch(html, /Who is in it <span class="count">/);
});

// The done-when of this milestone, in numbers: the counts come from the
// topology and the sources index, at the moment the card is drawn, with
// nothing fetched.
test('the sections count what the spine and the sources index actually hold', () => {
  const html = eventCardHtml(context(atlas), { event: carnation, found, state: state() });
  assert.deepEqual(keys(html), ['consequences', 'causes', 'sources', 'part-of']);
  assert.equal(section(html, 'consequences').count, '9');
  assert.equal(section(html, 'causes').count, '7');
  assert.equal(section(html, 'sources').count, '2');
  // The same numbers, straight from the data this card was given.
  const active = (list) => list.length;
  assert.equal(active(atlas.adjacency.out.get(carnation.id)), 9);
  assert.equal(active(atlas.adjacency.in.get(carnation.id)), 7);
  assert.equal(atlas.citationCount('event', carnation.id), 2);
});

test('other branches is there only while a path is being walked', () => {
  const plain = eventCardHtml(context(atlas), { event: carnation, found, state: state() });
  assert.equal(section(plain, 'branches'), null);
  assert.equal(section(plain, 'followed'), null);

  const alvor = atlas.events.get('alvor-agreement-1975');
  const chain = ['carnation-revolution-1974--alvor-agreement-1975--caused'];
  const walked = eventCardHtml(context(atlas), { event: alvor, found, state: state({ chain }) });
  assert.deepEqual(keys(walked), ['followed', 'consequences', 'causes', 'branches', 'sources', 'part-of']);
  assert.ok(Number(section(walked, 'branches').count.split(',')[0]) > 0);
});

test('a disputed link is counted in the header of the closed section it is in', () => {
  // The fixtures carry one on purpose; the atlas's own disputes move.
  const [id, disputed] = (() => {
    for (const event of fixtures.activeEvents) {
      const out = fixtures.adjacency.out.get(event.id) ?? [];
      const n = out.filter((e) => e.confidence === 'disputed').length;
      if (n > 0) return [event.id, n];
    }
    return [null, 0];
  })();
  assert.ok(id, 'the fixtures have an event with a disputed consequence');
  const html = eventCardHtml(context(fixtures), { event: fixtures.events.get(id), found, state: state() });
  const head = section(html, 'consequences');
  assert.match(head.count, new RegExp(`, ${disputed} disputed$`));
  assert.match(head.block, /<span class="count disputed">/);
});

test('walking a chain opens Consequences and draws the path as a breadcrumb', () => {
  const alvor = atlas.events.get('alvor-agreement-1975');
  const chain = ['carnation-revolution-1974--alvor-agreement-1975--caused'];
  const html = eventCardHtml(context(atlas), { event: alvor, found, state: state({ chain }), remembered: 'sources' });
  assert.equal(section(html, 'consequences').open, true);
  assert.equal(section(html, 'sources').open, false);
  assert.equal(section(html, 'sources').hidden, true);

  const crumbs = html.match(/<nav class="breadcrumb"[\s\S]*?<\/nav>/)[0];
  assert.match(crumbs, /aria-label="The path you walked"/);
  assert.match(crumbs, /data-action="chain-to" data-step="0">25 April<\/button>/);
  assert.match(crumbs, /<li aria-current="true">/);
  assert.match(crumbs, /<span class="current">The Alvor Agreement<\/span>/);
  // The current step is where the reader is, not a link to it.
  assert.doesNotMatch(crumbs, /data-step="1"/);
});

test('arriving from a source card opens Sources; otherwise the remembered choice stands', () => {
  const ctx = context(atlas);
  const fromSource = eventCardHtml(ctx, { event: carnation, found, state: state({ source: 'maxwell-1995-making-of-portuguese-democracy' }) });
  assert.equal(section(fromSource, 'sources').open, true);

  const remembered = eventCardHtml(ctx, { event: carnation, found, state: state(), remembered: 'causes' });
  assert.equal(section(remembered, 'causes').open, true);
  assert.equal(section(remembered, 'consequences').open, false);

  const fresh = eventCardHtml(ctx, { event: carnation, found, state: state() });
  assert.equal(section(fresh, 'consequences').open, true);
});

test('the disputed notice opens the section that holds the argument', () => {
  const disputed = [...atlas.edges.values()].find((e) => e.confidence === 'disputed' && e.status === 'active');
  assert.ok(disputed, 'the atlas records at least one disputed link');
  const html = eventCardHtml(context(atlas), {
    event: atlas.events.get(disputed.to), found, state: state({ chain: [disputed.id] }),
  });
  assert.match(html, /<p class="notice disputed">/);
  assert.match(html, /data-action="section" data-section="followed">Read the dispute<\/button>/);
  // One link needs no count; that it is disputed is what the header has to
  // say, closed or not.
  assert.equal(section(html, 'followed').count, '1 disputed');
  assert.match(section(html, 'followed').block, /<span class="count disputed">1 disputed<\/span>/);
});

// A link somebody was sent can name a step the project has since withdrawn.
// main.js cuts the walk there and tells the panel; the card is where the
// reader is told, because a path quietly shorter than the one that was shared
// is a different argument.
test('a walk cut short by a retracted step says so on the card', () => {
  const carnation = atlas.events.get('carnation-revolution-1974');
  const quiet = eventCardHtml(context(atlas), { event: carnation, found, state: state() });
  assert.equal(/has been <strong>retracted<\/strong>/.test(quiet), false, 'nothing to say by default');

  const cut = eventCardHtml({ ...context(atlas), walkWasCut: () => true },
    { event: carnation, found, state: state() });
  assert.match(cut, /<p class="notice status">A step of the link you followed has been <strong>retracted<\/strong>\./);
  assert.match(cut, /drawn as far as that step/);
});

test('nothing a record carries reaches the card unescaped', () => {
  const nasty = {
    id: 'x', title: '<img onerror="a">', when: { start: 1200, end: 1200 }, region: '<b>r</b>',
    status: 'active', actors: [], place: null,
  };
  const ctx = context({
    ...fixtures,
    events: new Map([['x', nasty]]),
    actors: new Map(),
    adjacency: { out: new Map(), in: new Map(), events: new Map([['x', nasty]]), edges: new Map() },
    narrativesByRef: new Map(),
    citationCount: () => 0,
    placeOf: () => null,
    pointOf: () => null,
  });
  const html = eventCardHtml(ctx, { event: nasty, found, state: state() });
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /<b>r<\/b>/);
  assert.match(html, /&lt;img onerror=/);
});

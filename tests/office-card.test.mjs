// The office card: the actor it belongs to, its category, every turn at it in
// the order they happened, and the line saying why it cites nothing.
//
// There is no DOM in node --test, so the card is checked as the string it
// produces — renderOfficeCard only assigns it and fetches the summary.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { officeCardHtml } from '../src/panel/office.js';
import { discussUrl } from '../src/share.js';
import { esc } from '../src/util/esc.js';
import path from 'node:path';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

// The context panel.js hands every card, reduced to what this one uses.
function context(atlas) {
  return {
    atlas,
    historyHtml: () => '',
    wikipediaHtml: () => '',
    discussLink: (kind, id) => `<p class="discuss"><a href="${esc(discussUrl(kind, id))}">Discuss this record</a></p>`,
  };
}

const rows = (html) => [...html.matchAll(/<li class="actor-row tenure-row" data-tenure="([^"]*)"/g)].map((m) => m[1]);
// The head's own line, so that a `when` in a tenure row below is not read as
// the office's own interval.
const meta = (html) => html.match(/<p class="meta">[\s\S]*?<\/p>/)?.[0] ?? '';
const count = (html, key) => html
  .match(new RegExp(`data-section="${key}"[\\s\\S]*?<span class="count[^"]*">([^<]*)</span>`))?.[1] ?? null;

const atlas = await atlasOf(FIXTURE_DATA);

test('an office names its actor, its category and every turn at it, in start order', () => {
  const html = officeCardHtml(context(atlas), atlas.offices.get('fixture-office-one'));
  assert.match(html, /<h2>Fixture Crown<\/h2>/);
  assert.match(html, /data-action="actor" data-id="fixture-polity-three"/);
  assert.match(html, /<span class="office-category">Head of state<\/span>/);
  // 1200-1210, 1208-1220, 1230-1238: they overlap, which is legal, and the
  // order is the order they began in.
  assert.deepEqual(rows(html), ['fixture-tenure-one', 'fixture-tenure-two', 'fixture-tenure-three']);
  assert.equal(count(html, 'holders'), '3');
  assert.match(html, /<span class="when">1200 – 1210<\/span>/);
});

test('a row opens the holder, and the event that began the turn where one is named', () => {
  const html = officeCardHtml(context(atlas), atlas.offices.get('fixture-office-one'));
  // A tenure has no card of its own, so the person is what a row opens.
  assert.match(html, /data-action="actor" data-id="fixture-actor-one"/);
  assert.doesNotMatch(html, /data-id="fixture-tenure-one"/, 'a tenure is not an address');
  // fixture-tenure-one names fixture-event-a; the other two name nothing and
  // say nothing rather than saying "unknown".
  assert.equal((html.match(/began with/g) ?? []).length, 1);
  assert.match(html, /data-action="select" data-id="fixture-event-a"/);
});

test('the card closes on its own control and says why it cites nothing', () => {
  const html = officeCardHtml(context(atlas), atlas.offices.get('fixture-office-one'));
  assert.match(html, /data-action="clear-office"/);
  assert.doesNotMatch(html, /data-section="sources"/, 'an office has no Sources section');
  assert.match(html, /An office says that the post exists and nothing more/);
});

test('an office with no interval is drawn with no dates at all', () => {
  const office = atlas.offices.get('leadership-of-fixture-actor-two');
  assert.equal(office.when, null);
  const html = officeCardHtml(context(atlas), office);
  assert.doesNotMatch(meta(html), /<span class="when">/);
  assert.doesNotMatch(html, /unknown/i);
  // Its one tenure is still there, with its own years.
  assert.deepEqual(rows(html), ['fixture-actor-one-fixture-actor-two-1210']);
});

test('an office nobody has held yet says so instead of showing an empty list', () => {
  const empty = { ...atlas.offices.get('fixture-office-one'), id: 'fixture-office-nobody' };
  const html = officeCardHtml(context(atlas), empty);
  assert.equal(count(html, 'holders'), '0');
  assert.match(html, /No turn at this post is recorded yet\./);
});

test('nothing from a record reaches the markup unescaped', () => {
  const nasty = {
    ...atlas.offices.get('fixture-office-one'),
    title: '<script>alert(1)</script>',
    category: '"><img src=x>',
  };
  const html = officeCardHtml(context(atlas), nasty);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img src=x>/);
  assert.match(html, /&lt;script&gt;/);
});

test("the atlas's own card: the prime ministership of Portugal, and its two holders", async () => {
  const own = await atlasOf(path.join(ROOT, 'data'));
  const html = officeCardHtml(context(own), own.offices.get('prime-minister-of-portugal'));
  assert.match(html, /<h2>Prime Minister of Portugal<\/h2>/);
  assert.match(html, /<span class="office-category">Head of government<\/span>/);
  assert.deepEqual(rows(html), ['salazar-prime-minister-1932', 'marcelo-caetano-prime-minister-1968']);
  assert.match(html, /data-action="actor" data-id="portugal"/);
});

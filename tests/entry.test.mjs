// The full entry page. No DOM in node --test, so the page is checked as the
// string it produces — main.js only assigns it — and against the same
// synthetic fixture dataset everything else here uses.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  entryHtml, elsewhereHtml, notFoundHtml, createLinks, displayName, ENTRY_KINDS,
} from '../src/entry/entry.js';
import { ATLAS_BUILDS, FIXTURE_DATA, fixtures as fixtureRecords } from './helpers.mjs';

// Every test twice: the page is handed an atlas and cannot tell whether it
// was built from the topology or from the spine (A12). The two tests that
// build no atlas at all are above the loop.
const pageWith = (atlas) => async function page(id, kind, options = {}) {
  const { byId } = await fixtureRecords();
  const record = options.record ?? byId[id];
  return entryHtml(atlas, {
    kind,
    record,
    topologyEntry: atlas.resolve(id)?.record ?? null,
    found: atlas.resolve(id),
    ...options,
  });
};

test('a record that has no entry page of its own is a way through, not a dead end', () => {
  const links = createLinks();
  const edge = elsewhereHtml('edge', 'a--b--caused', links);
  assert.match(edge, /a link between events/);
  assert.match(edge, /href="index.html\?selected=a--b--caused"/);
  assert.match(elsewhereHtml('source', 'russell-2000-henry', links), /href="index.html\?source=russell-2000-henry"/);
  assert.match(notFoundHtml('nothing-by-that-name'), /No record with id <code>nothing-by-that-name<\/code>/);
});

test('the three kinds with a page are the three kinds that may carry a body', () => {
  assert.deepEqual([...ENTRY_KINDS], ['event', 'actor', 'place']);
  const links = createLinks();
  for (const kind of ENTRY_KINDS) assert.match(links.entry(kind, 'x'), /^entry\.html\?id=x$/);
  assert.equal(links.entry('edge', 'a--b--caused'), 'index.html?selected=a--b--caused');
  assert.equal(links.entry('source', 's'), 'index.html?source=s');
  assert.equal(displayName({ title: 'A title' }), 'A title');
  assert.equal(displayName({ names: ['A name', 'another'] }), 'A name');
  assert.equal(displayName({ id: 'only-an-id' }), 'only-an-id');
});

for (const [label, buildAtlas] of ATLAS_BUILDS) {
  const page = pageWith(await buildAtlas(FIXTURE_DATA));

  test(`an event entry carries the head, the summary, the actors and the way back, over ${label}`, async () => {
    const html = await page('fixture-event-a', 'event');
    assert.match(html, /<p class="entry-kind">event<\/p>/);
    assert.match(html, /<h1>Fixture event A<\/h1>/);
    assert.match(html, /entry.html\?id=fixture-place-a/, 'the place is a link to its own entry');
    assert.match(html, /<section class="entry-summary">/);
    assert.match(html, /class="chip" href="entry.html\?id=fixture-actor-one"/);
    assert.match(html, /href="index.html\?selected=fixture-event-a"/, 'the way back to the atlas');
    assert.match(html, /Read more on Wikipedia/);
  });

  test(`a body renders with a table of contents, record links and numbered marks, over ${label}`, async () => {
    const html = await page('fixture-event-a', 'event');
    assert.match(html, /<nav class="entry-toc"/);
    assert.match(html, /<a href="#entry-what-the-fixture-is-for">What the fixture is for<\/a>/);
    assert.match(html, /<h2 id="entry-what-the-fixture-is-for">/);
    assert.match(html, /<h3 id="entry-the-constructs">/);
    assert.match(html, /<ul><li><em>emphasis<\/em> and <strong>strong emphasis<\/strong><\/li>/);
    assert.match(html, /<blockquote><p>A block quotation/);
    assert.match(html, /<a class="record-link actor" href="entry.html\?id=fixture-actor-one">/);
    assert.match(html, /<a class="record-link event" href="entry.html\?id=fixture-event-b">/);
    assert.match(html, /<a href="https:\/\/example.org\/fixture" rel="noopener" target="_blank">/);
    // The mark, numbered, aiming at the citation of the same id below it.
    assert.match(html, /<a class="cite-mark" href="#entry-cite-fixture-source-1"[^>]*><sup>\[1, p\. 12\]<\/sup><\/a>/);
    assert.match(html, /<li class="citation" id="entry-cite-fixture-source-1">/);
    assert.match(html, /<span class="cite-number">\[1\]<\/span>/);
    // And the raw HTML in the fixture body did not survive as markup.
    assert.doesNotMatch(html, /<b>this<\/b>/);
    assert.match(html, /&lt;b&gt;this&lt;\/b&gt;/);
  });

  test(`a record with no entry says so and invites one, over ${label}`, async () => {
    const html = await page('fixture-event-b', 'event');
    assert.match(html, /<section class="entry-body empty">/);
    assert.match(html, /Nobody has written the long entry for this record yet/);
    assert.match(html, /contribute.html/);
    assert.doesNotMatch(html, /class="entry-toc"/);
  });

  test(`an actor entry lists relations and appearances; a place entry lists what happened there, over ${label}`, async () => {
    const actor = await page('fixture-actor-one', 'actor');
    assert.match(actor, /<section class="entry-relations">/);
    assert.match(actor, /<section class="entry-events">/);
    assert.match(actor, /Where it appears/);
    const place = await page('fixture-place-a', 'place');
    assert.match(place, /What happened here/);
    assert.match(place, /entry.html\?id=fixture-event-a/);
    // A place cites nothing, and the page says why rather than showing a gap.
    assert.match(place, /A place is a geographic fact/);
  });

  test(`the fixture flag is carried through every link the page writes, over ${label}`, async () => {
    const html = await page('fixture-event-a', 'event', { links: createLinks({ fixtures: true }) });
    // "&" is escaped in an attribute, as it must be; the browser reads it back.
    assert.match(html, /entry.html\?id=fixture-actor-one&amp;fixtures=1/);
    assert.match(html, /index.html\?selected=fixture-event-a&amp;fixtures=1/);
    for (const [, href] of html.matchAll(/href="((?:entry|index)\.html\?[^"]*)"/g)) {
      assert.match(href, /fixtures=1/, href);
    }
  });

  test(`nothing from a record reaches the page unescaped, over ${label}`, async () => {
    const { byId, records } = await fixtureRecords();
    const record = JSON.parse(JSON.stringify(byId['fixture-event-a']));
    const attack = '"><script>alert(1)</script>';
    record.title = attack;
    record.summary = attack;
    record.body = `## ${attack}\n\nA paragraph ${attack} and [a link](event:fixture-event-b).`;
    const html = await page('fixture-event-a', 'event', { record });
    assert.doesNotMatch(html, /<script/);
    assert.match(html, /&lt;script&gt;/);
    assert.ok(records.length > 0);
  });

  test(`a tombstone entry still resolves and says what it is, over ${label}`, async () => {
    const { byId } = await fixtureRecords();
    const record = { ...byId['fixture-event-a'], status: 'retracted' };
    const html = await page('fixture-event-a', 'event', { record });
    assert.match(html, /<p class="notice status">This record is <strong>retracted<\/strong>/);
  });
}

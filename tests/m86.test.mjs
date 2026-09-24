// M86 — what a funder meets first: the second review's reader and display
// findings, in the half that needs no DOM.
//
// `tests/m86-browser.test.mjs` holds what only a drawing can answer: a name on
// the resting map, a stack inside the rectangle after a drag, a camera that
// survives a resize, and a degree control that says it is off.
//
// Written before the behaviour it judges (deviations 711 and 717). **Nothing
// here pins a count or a pixel**: every expectation about the corpus is
// derived from the corpus the test is run on, which is 22 September's lesson —
// M83's merged-lines test was true at 581 events and false at 668.

import { test } from 'node:test';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

import { readSummary, isImportedSummary, PROVENANCE_SENTENCES } from '../src/summary.js';
import { summaryHtml, creditHtml } from '../src/panel/summary.js';
import { setReview } from '../src/demo.js';
import { revisionUrl, itemUrl } from '../src/wikipedia.js';
import { placeLabels, PRIORITY, LABEL_ZOOM } from '../src/map/labels.js';
import { stackBadge, stackTitle } from '../src/cluster.js';
import { identifiers } from '../src/citation.js';
import { PRECISIONS } from '../src/vocab.js';
import { ROOT } from './helpers.mjs';

const read = (file) => fs.readFile(path.join(ROOT, file), 'utf8');

// Every record of every kind that carries prose a card prints. Read off disk
// and not out of the index, because the index carries no summary: what the
// review saw is the file.
async function summariesOf(kind) {
  const dir = path.join(ROOT, 'data', kind);
  const files = await fs.readdir(dir);
  const out = [];
  for (const file of files) {
    const record = JSON.parse(await read(path.join('data', kind, file)));
    if (record.status && record.status !== 'active') continue;
    if (typeof record.summary === 'string' && record.summary !== '') out.push([file, record.summary]);
  }
  return out;
}

const KINDS = ['events', 'actors', 'places'];
const CORPUS = new Map();
for (const kind of KINDS) CORPUS.set(kind, await summariesOf(kind));

// ─── 1. the provenance paragraph leaves the card body (A1) ──────────────────
//
// The importer's two sentences say, in the record, that nobody has read it and
// where `review.html` is. `src/demo.js` takes that message out of the chrome
// and cannot reach a record; this is where it is taken off the card.

// What must not be on a published card, by the words the review quoted.
const FORBIDDEN = ['review.html', 'nobody has read'];

test('the corpus really does carry the importer’s provenance, so the test has something to prove', () => {
  let carrying = 0;
  for (const kind of KINDS) {
    for (const [, summary] of CORPUS.get(kind)) {
      if (PROVENANCE_SENTENCES.some((s) => summary.includes(s))) carrying += 1;
    }
  }
  assert.ok(carrying > 0, `${carrying} records carry the importer's provenance sentences`);
});

test('with the flag off, no card’s body says review.html or that nobody has read the record', () => {
  setReview(false);
  try {
    for (const kind of KINDS) {
      for (const [file, summary] of CORPUS.get(kind)) {
        const html = summaryHtml(summary);
        for (const words of FORBIDDEN) {
          assert.ok(!html.includes(words), `${kind}/${file}: the card body still says "${words}"`);
        }
      }
    }
  } finally {
    setReview(null);
  }
});

test('with ?review=1 on, the provenance is on the card, for every record that has it', () => {
  setReview(true);
  try {
    for (const kind of KINDS) {
      for (const [file, summary] of CORPUS.get(kind)) {
        if (!PROVENANCE_SENTENCES.some((s) => summary.includes(s))) continue;
        const html = summaryHtml(summary);
        assert.ok(html.includes('review.html'),
          `${kind}/${file}: a maintainer cannot see the provenance any more`);
      }
    }
  } finally {
    setReview(null);
  }
});

test('and what is left is the source’s own words, with one credit line', () => {
  setReview(false);
  try {
    for (const kind of KINDS) {
      for (const [file, summary] of CORPUS.get(kind)) {
        const { body, credit } = readSummary(summary);
        const framing = ['opens: "', 'imported by tools/import/wikidata.mjs'];
        for (const words of framing) {
          assert.ok(!body.includes(words), `${kind}/${file}: the body still carries the framing "${words}"`);
        }
        // A record the import wrote out of an article gives its revision, and
        // the credit is a link to that revision and not to the article.
        if (credit?.article) {
          assert.match(String(credit.revision), /^\d+$/, `${kind}/${file}: a credit with no revision`);
          const html = creditHtml(credit);
          assert.ok(html.includes(revisionUrl('en', credit.revision)),
            `${kind}/${file}: the credit does not link the revision`);
        } else if (credit?.wikidata) {
          assert.ok(creditHtml(credit).includes(itemUrl(credit.wikidata)),
            `${kind}/${file}: the credit does not link the item`);
        }
        // Every record that had a body keeps one, unless the item the import
        // read carried no description at all — then there is nothing to print
        // and the credit stands alone.
        if (!isImportedSummary(summary)) {
          assert.equal(body, summary, `${kind}/${file}: a summary nobody imported was rewritten`);
        }
      }
    }
  } finally {
    setReview(null);
  }
});

test('a summary a person wrote is not touched, and neither is an empty one', () => {
  const mine = 'Vasco da Gama reached Calicut in May 1498, which is what this record says.';
  assert.deepEqual(readSummary(mine), { body: mine, credit: null, provenance: '' });
  assert.deepEqual(readSummary(''), { body: '', credit: null, provenance: '' });
  assert.deepEqual(readSummary(null), { body: '', credit: null, provenance: '' });
  assert.equal(isImportedSummary(mine), false);
});

test('the lead survives the quotation marks inside it', () => {
  const summary = 'The English Wikipedia article "Scramble for Africa", at revision 1373841219, '
    + 'opens: "The Scramble was driven through the era of "New Imperialism". Belgium and France '
    + `were the contending powers." ${PROVENANCE_SENTENCES[0]} Wikidata item Q179848, imported by `
    + `tools/import/wikidata.mjs. The item's own description reads "colonisation of Africa". `
    + `${PROVENANCE_SENTENCES[1]}`;
  const { body, credit, provenance } = readSummary(summary);
  assert.ok(body.startsWith('The Scramble was driven'), body);
  assert.ok(body.includes('"New Imperialism"'), 'the quotation inside the lead is kept');
  assert.ok(body.endsWith('the contending powers.'), body);
  assert.equal(credit.article, 'Scramble for Africa');
  assert.equal(credit.revision, '1373841219');
  assert.equal(credit.wikidata, 'Q179848');
  for (const words of FORBIDDEN) assert.ok(!body.includes(words), words);
  for (const sentence of PROVENANCE_SENTENCES) assert.ok(provenance.includes(sentence), sentence);
});

test('an item with no description leaves the credit standing alone', () => {
  const summary = 'Wikidata item Q5793222, imported by tools/import/wikidata.mjs. '
    + `The item carries no description in English or Portuguese. ${PROVENANCE_SENTENCES[1]}`;
  const { body, credit } = readSummary(summary);
  assert.equal(body, '');
  assert.equal(credit.wikidata, 'Q5793222');
  assert.equal(credit.article, null);
  assert.ok(creditHtml(credit).includes('Q5793222'));
});

// ─── 2. the first map has names (A2, A11) ──────────────────────────────────

test('at rest the placer writes the heaviest event names and never more than its floor', () => {
  // Sixty marks, as the review counted on `m85-first-screen.png`, spread far
  // enough apart that no box can hit another: what is being asked is the
  // limit and not the box arithmetic.
  const candidates = Array.from({ length: 60 }, (_, i) => ({
    id: `e${String(i).padStart(3, '0')}`,
    text: `Event ${i}`,
    x: (i % 10) * 90,
    y: Math.floor(i / 10) * 90,
    priority: PRIORITY.events,
    weight: i,
  }));
  const limit = 10;
  const placed = placeLabels(candidates, { k: 1, limits: { [PRIORITY.events]: limit } });
  assert.equal(placed.length, limit, 'ten and not sixty');
  // The heaviest, because that is what the brief asks for and what the placer's
  // own order already says.
  const heaviest = [...candidates].sort((a, b) => b.weight - a.weight).slice(0, limit).map((c) => c.id);
  assert.deepEqual([...placed.map((p) => p.id)].sort(), heaviest.sort());
});

test('and the floor for an event name is not the whole-world one', async () => {
  const map = await read('src/map/map.js');
  assert.ok(/EVENT_LABEL_ZOOM/.test(map), 'map.js has a floor of its own for event names');
  assert.ok(LABEL_ZOOM > 1, 'the other layers keep theirs');
});

test('a stack of two carries no badge, and a stack of three does', () => {
  assert.equal(stackBadge(2), '');
  assert.equal(stackBadge(1), '');
  assert.equal(stackBadge(0), '');
  assert.equal(stackBadge(3), '2 more');
  // The title still says it, because the title is where a reader asks.
  assert.ok(stackTitle('Carnation Revolution', 2).includes('1 more event'));
});

// ─── 3. the about page’s paragraph (A4) ────────────────────────────────────

test('about.html no longer says the site is not public yet, and no longer contradicts itself', async () => {
  const about = await read('about.html');
  for (const words of ['before this site is public', 'test dataset', 'nobody has reviewed']) {
    assert.ok(!about.includes(words), `about.html still says "${words}"`);
  }
  // And it says what the repository says of itself: drafted from the two
  // sources, cited, and read by a person whose progress is on the page under
  // the flag.
  for (const words of ['Wikipedia', 'Wikidata', '?review=1']) {
    assert.ok(about.includes(words), `about.html does not say "${words}"`);
  }
});

// ─── 5. three card polish items (A8, A9, A10) ──────────────────────────────

test('a source’s url is labelled with its host and keeps the url in the title', () => {
  const found = identifiers({ url: 'https://search.worldcat.org/search?q=The%20Decolonization' });
  const entry = found.find((i) => i.kind === 'url');
  assert.equal(entry.label, 'search.worldcat.org');
  assert.equal(entry.title, 'https://search.worldcat.org/search?q=The%20Decolonization');
  // A url with no host to read — a mailto, a relative path — keeps the url as
  // its label rather than showing nothing.
  const odd = identifiers({ url: 'not a url at all' }).find((i) => i.kind === 'url');
  assert.equal(odd.label, 'not a url at all');
});

test('the card head omits the default calendar and keeps a stated one', async () => {
  const card = await read('src/panel/event.js');
  assert.ok(/defaultCalendar/.test(card), 'the card still knows what the default is');
  assert.ok(/calendar !== |calendar ===/.test(card), 'and compares against it');
});

test('the four precisions still say which of them are areas and not points', () => {
  const coarse = PRECISIONS.filter((p) => p.coarse).map((p) => p.id);
  assert.deepEqual(coarse, ['region', 'country']);
});

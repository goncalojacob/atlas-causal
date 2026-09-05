// The card's collapsible sections: which one opens, what the header says,
// and what a browser with no storage does about it.
//
// The toggling needs a DOM and is checked in a real browser
// (tests/panel-browser.test.mjs); everything decided here is pure.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  openSection, countLabel, sectionHtml, readOpenSection, writeOpenSection, STORAGE_KEY, NONE,
} from '../src/panel/sections.js';

const KEYS = ['followed', 'consequences', 'causes', 'branches', 'sources', 'part-of'];

// A localStorage that is one object, and one that throws at every turn — a
// private window, or a browser told to block site data.
function storage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    read: () => Object.fromEntries(map),
  };
}
const hostile = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };

test('the arrival decides before the remembered choice does', () => {
  // Walking a chain is a question about what happens next.
  assert.equal(openSection(KEYS, { chain: ['a--b--caused'], remembered: 'sources' }), 'consequences');
  // Arriving from a source's card is a question about what it rests on.
  assert.equal(openSection(KEYS, { source: 'maxwell-1995', remembered: 'causes' }), 'sources');
  // A chain beats a source: the reader walked here after opening the source.
  assert.equal(openSection(KEYS, { chain: ['a--b--caused'], source: 'maxwell-1995' }), 'consequences');
});

test('with nothing to say about the arrival, the reader\'s own choice stands', () => {
  assert.equal(openSection(KEYS, { remembered: 'causes' }), 'causes');
  assert.equal(openSection(KEYS, { remembered: null }), 'consequences');
  // Everything closed is a choice, and is not the same as never having made
  // one — which is the whole reason NONE is stored rather than the key removed.
  assert.equal(openSection(KEYS, { remembered: NONE }), null);
});

test('a remembered section this card does not have falls back rather than opening nothing', () => {
  assert.equal(openSection(['sources', 'part-of'], { remembered: 'consequences' }), 'sources');
  assert.equal(openSection(['relations', 'territory'], { remembered: 'branches' }), 'relations');
  assert.equal(openSection([], { remembered: 'sources' }), null);
});

test('the count says how many, and how many are disputed', () => {
  assert.equal(countLabel(9), '9');
  assert.equal(countLabel(0), '0');
  assert.equal(countLabel(3, 1), '3, 1 disputed');
  // A section of one thing counts nothing — and still says so when that one
  // thing is disputed.
  assert.equal(countLabel(null), '');
  assert.equal(countLabel(null, 1), '1 disputed');
  assert.match(sectionHtml({ key: 'followed', label: 'The link you followed', count: null, disputed: 1 }),
    /<span class="count disputed">1 disputed<\/span>/);
  assert.doesNotMatch(sectionHtml({ key: 'followed', label: 'The link you followed', count: null }), /class="count/);
  const html = sectionHtml({ key: 'consequences', label: 'Consequences', count: 3, disputed: 1, open: false });
  assert.match(html, /<span class="count disputed">3, 1 disputed<\/span>/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, / hidden>/);
});

test('an open section is expanded, controlled and labelled by its own header', () => {
  const html = sectionHtml({ key: 'causes', label: 'Causes', count: 7, open: true, body: '<ul></ul>' });
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /aria-controls="card-section-causes"/);
  assert.match(html, /id="card-section-causes" role="region" aria-labelledby="card-section-causes-head"/);
  assert.doesNotMatch(html, / hidden>/);
});

test('nothing a label or a key carries reaches the markup unescaped', () => {
  const html = sectionHtml({ key: 'sources', label: '<script>alert(1)</script>', count: 1, open: true });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('the choice is remembered per reader, and a stored value from elsewhere is refused', () => {
  const store = storage();
  assert.equal(readOpenSection(store), null);
  assert.equal(writeOpenSection(store, 'causes'), true);
  assert.equal(store.read()[STORAGE_KEY], 'causes');
  assert.equal(readOpenSection(store), 'causes');
  assert.equal(readOpenSection(storage({ [STORAGE_KEY]: NONE })), NONE);
  // Anything that is not one of our keys is read as "never chose".
  assert.equal(readOpenSection(storage({ [STORAGE_KEY]: '.card-section' })), null);
  assert.equal(readOpenSection(storage({ [STORAGE_KEY]: '{"a":1}' })), null);
});

test('a browser with storage turned off still reads cards; it just forgets', () => {
  assert.equal(readOpenSection(hostile), null);
  assert.equal(writeOpenSection(hostile, 'causes'), false);
  assert.equal(readOpenSection(undefined), null);
  assert.equal(writeOpenSection(undefined, 'causes'), true);
});

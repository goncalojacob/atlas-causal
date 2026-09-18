// Which article a card offers, and the URL it builds. Everything here is
// synthetic; the titles are invented and resolve to nothing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleFor, articleUrl, articleTitles, preferredLanguages, DEFAULT_LANGUAGE } from '../src/wikipedia.js';

const record = { id: 'fixture-event-a', wikidata: 'Q11', wikipedia: { en: 'Fixture article A', pt: 'Artigo de fixture A' } };

test('a title becomes a Wikipedia URL, and a language code that is not one becomes nothing', () => {
  assert.equal(articleUrl('pt', 'Artigo de fixture A'), 'https://pt.wikipedia.org/wiki/Artigo_de_fixture_A');
  assert.equal(articleUrl('zh-hans', 'A'), 'https://zh-hans.wikipedia.org/wiki/A');
  // A slash or a colon in a title is part of the title, not part of the path.
  assert.equal(articleUrl('en', 'A/B: a fixture'), 'https://en.wikipedia.org/wiki/A%2FB%3A_a_fixture');
  // The language becomes a hostname, so anything that is not a code is refused
  // rather than escaped into one.
  assert.equal(articleUrl('evil.example.com', 'A'), null);
  assert.equal(articleUrl('en.wikipedia.org@evil', 'A'), null);
  assert.equal(articleUrl('', 'A'), null);
  assert.equal(articleUrl('en', '  '), null);
});

test('the reader\'s language first, then English, then whatever there is', () => {
  assert.equal(articleFor(record, ['pt-PT', 'en']).lang, 'pt');
  assert.equal(articleFor(record, ['en-GB']).lang, 'en');
  // Nothing the reader asked for: English, which is the largest edition and
  // not a claim about whose history this is.
  assert.equal(articleFor(record, ['de', 'fr']).lang, DEFAULT_LANGUAGE);
  // Not even English: the first the record lists, so an article in a language
  // nobody asked for still beats no article.
  const onlyGalician = { wikipedia: { gl: 'Artigo de fixture' } };
  assert.deepEqual(articleFor(onlyGalician, ['de']), {
    lang: 'gl', title: 'Artigo de fixture', href: 'https://gl.wikipedia.org/wiki/Artigo_de_fixture',
  });
});

test('a record with no titles offers nothing', () => {
  assert.equal(articleFor({ wikidata: 'Q11' }, ['en']), null);
  assert.equal(articleFor({}, ['en']), null);
  assert.equal(articleFor(null, ['en']), null);
  assert.equal(articleFor({ wikipedia: [] }, ['en']), null);
  // A language key that is not a code is skipped rather than linked: rule 21
  // refuses it in the data, and the card refuses it again here.
  assert.equal(articleFor({ wikipedia: { 'evil.example.com': 'A' } }, ['en']), null);
});

test('the preference list keeps the variety and adds the language it belongs to', () => {
  assert.deepEqual(preferredLanguages(['pt-BR', 'en_GB', '', null]), ['pt-br', 'pt', 'en-gb', 'en']);
  assert.deepEqual(preferredLanguages(), []);
});

test('the titles join the search as names, and nothing else does', () => {
  assert.deepEqual(articleTitles(record).sort(), ['Artigo de fixture A', 'Fixture article A']);
  assert.deepEqual(articleTitles({ wikipedia: { en: '  ' } }), []);
  assert.deepEqual(articleTitles({}), []);
});

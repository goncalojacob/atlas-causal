// Finding a record by name: the pure half. The box itself (keys, ARIA, the
// list) needs a DOM and is exercised in the browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, rank, buildSearchIndex, search, flatten } from '../src/search.js';

const EVENTS = [
  { id: 'salazar-falls-1968', title: 'Marcelo Caetano succeeds Salazar', when: { start: 1968, end: 1968 }, weight: 4, status: 'active' },
  { id: 'carnation-revolution-1974', title: '25 April', when: { start: 1974, end: 1974 }, weight: 9, status: 'active' },
  { id: 'angola-independence-1975', title: 'Independence of Angola', when: { start: 1975, end: 1975 }, weight: 3, status: 'active' },
  { id: 'cabral-1973', title: 'Assassination of Amílcar Cabral', when: { start: 1973, end: 1973 }, weight: 2, status: 'active' },
  { id: 'retracted-one', title: 'Salazar and the tides', when: { start: 1930, end: 1930 }, weight: 0, status: 'retracted' },
];
const ACTORS = [
  { id: 'salazar', name: 'António de Oliveira Salazar', names: ['António de Oliveira Salazar', 'Salazar'], actorType: 'person', when: { start: 1889, end: 1970 }, status: 'active' },
  { id: 'angola', name: 'Angola', names: ['Angola'], actorType: 'polity', when: { start: 1886, end: null }, status: 'active' },
  { id: 'pvde-pide-dgs', name: 'PIDE', names: ['PIDE', 'Polícia Internacional e de Defesa do Estado', 'DGS'], actorType: 'institution', when: { start: 1945, end: 1974 }, status: 'active' },
  { id: 'gone', name: 'Gone', names: ['Gone'], actorType: 'polity', when: { start: 1900, end: 1901 }, status: 'merged' },
];
const PLACES = [
  { id: 'lisbon', name: 'Lisbon', names: ['Lisbon', 'Lisboa'], where: { lon: -9.14, lat: 38.72, precision: 'city', label: 'Lisbon' }, status: 'active' },
  { id: 'luanda', name: 'Luanda', names: ['Luanda'], where: { lon: 13.23, lat: -8.84, precision: 'city', label: 'Luanda' }, status: 'active' },
  { id: 'nowhere', name: 'Nowhere', names: ['Nowhere'], where: { lon: 0, lat: 0, precision: 'city', label: 'Nowhere' }, status: 'retracted' },
];
const SOURCES = [
  { id: 'maxwell-1995', title: 'The Making of Portuguese Democracy', creators: ['Kenneth Maxwell'], year: 1995, type: 'book', status: 'active' },
  { id: 'telo-2007', title: 'História Contemporânea de Portugal', creators: ['António José Telo'], year: 2007, type: 'book', status: 'active' },
  { id: 'withdrawn', title: 'Salazar, a Life', creators: ['Nobody'], year: 1800, type: 'book', status: 'retracted' },
];
const index = buildSearchIndex({ events: EVENTS, actors: ACTORS, places: PLACES, sources: SOURCES });

test('folding drops case and diacritics', () => {
  assert.equal(fold('Amílcar Cabral'), 'amilcar cabral');
  assert.equal(fold('  PIDE '), 'pide');
  assert.equal(fold('Polícia Internacional'), 'policia internacional');
});

test('a prefix beats a word start beats a substring', () => {
  assert.equal(rank('salazar', 'sal'), 0);
  assert.equal(rank('marcelo caetano succeeds salazar', 'sal'), 1);
  assert.equal(rank('salazar', 'ala'), 2, 'inside a word is still a match, just a worse one');
  assert.equal(rank('angola', 'zz'), null);
  assert.equal(rank('india (british)', 'brit'), 1, 'a bracket opens a word');
});

test('the index holds active records only, with their variants', () => {
  assert.equal(index.filter((e) => e.kind === 'event').length, 4, 'the retracted event is not searchable');
  assert.equal(index.filter((e) => e.kind === 'actor').length, 3, 'nor the merged actor');
  const pide = index.find((e) => e.id === 'pvde-pide-dgs');
  assert.deepEqual(pide.terms, ['pide', 'policia internacional e de defesa do estado', 'dgs']);
  assert.equal(pide.label, 'PIDE');
});

test('a place is found by any of its names, and only while it is active', () => {
  assert.equal(index.filter((e) => e.kind === 'place').length, 2, 'the retracted place is not searchable');
  const hits = flatten(search(index, 'lisboa'));
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'place');
  assert.equal(hits[0].id, 'lisbon');
  assert.equal(hits[0].label, 'Lisbon', 'the display name, whichever variant matched');
  // A place has no dates, and sorting must not fall over on that.
  assert.equal(hits[0].when, null);
  assert.equal(flatten(search(index, 'luand'))[0].id, 'luanda');
});

test('a source is found by its title or by whoever wrote it', () => {
  assert.equal(index.filter((e) => e.kind === 'source').length, 2, 'the retracted source is not searchable');
  const byTitle = flatten(search(index, 'making of portuguese'));
  assert.equal(byTitle[0].kind, 'source');
  assert.equal(byTitle[0].id, 'maxwell-1995');
  assert.equal(byTitle[0].detail, 'Kenneth Maxwell, 1995');
  const byAuthor = flatten(search(index, 'maxwell'));
  assert.equal(byAuthor[0].id, 'maxwell-1995');
  // Diacritics are optional here too: nobody types the â of Contemporânea.
  assert.equal(flatten(search(index, 'historia contemporanea'))[0].id, 'telo-2007');
});

test('"sal" puts Salazar the actor first, above the events that mention him', () => {
  const result = search(index, 'sal');
  const first = flatten(result)[0];
  assert.equal(first.kind, 'actor');
  assert.equal(first.id, 'salazar');
  assert.equal(result.groups[0].kind, 'actor', 'the group with the best match comes first');
  assert.equal(result.groups[1].kind, 'event');
  assert.deepEqual(result.groups[1].items.map((i) => i.id), ['salazar-falls-1968']);
});

test('a name and its events come back together', () => {
  const result = search(index, 'angola');
  assert.deepEqual(flatten(result).map((i) => `${i.kind}:${i.id}`), ['actor:angola', 'event:angola-independence-1975']);
  assert.equal(result.total, 2);
});

test('an acronym and a full name find the same record', () => {
  assert.equal(flatten(search(index, 'dgs'))[0].id, 'pvde-pide-dgs');
  assert.equal(flatten(search(index, 'policia'))[0].id, 'pvde-pide-dgs');
  assert.equal(flatten(search(index, 'Polícia'))[0].id, 'pvde-pide-dgs');
});

test('diacritics are optional in either direction', () => {
  assert.equal(flatten(search(index, 'amilcar'))[0].id, 'cabral-1973');
  assert.equal(flatten(search(index, 'Amílcar'))[0].id, 'cabral-1973');
});

test('an empty query returns nothing, and the limit is over the whole result', () => {
  assert.deepEqual(search(index, '   '), { groups: [], total: 0, query: '' });
  const many = search(index, 'a', { limit: 3 });
  assert.equal(flatten(many).length, 3);
  assert.ok(many.total > 3, 'the count is of everything, not of what is shown');
});

test('the order is stable: rank, then the shorter name, then weight, then id', () => {
  const twice = [search(index, 'a'), search(index, 'a')];
  assert.deepEqual(flatten(twice[0]).map((i) => i.id), flatten(twice[1]).map((i) => i.id));
});

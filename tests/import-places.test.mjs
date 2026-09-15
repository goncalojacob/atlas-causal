// Which Natural Earth city a place record is, and — much more of this file —
// which it is not. The matcher's whole job is to refuse: it writes an entry
// on two signals and lists everything else for a person, because a dot
// labelled with the wrong city is a mistake nobody reading the map can see.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NEAR_DEGREES, cityIdentity, degreesApart, fold, handEntries, matchPlaces, placesFile,
} from '../tools/import/places.mjs';

const city = (id, name, { en = null, wikidata = null, lon = 0, lat = 0, pop = 100 } = {}) => ({
  type: 'Feature',
  properties: {
    NE_ID: id, NAME: name, NAME_EN: en, WIKIDATAID: wikidata, POP_MAX: pop, SCALERANK: 5, FEATURECLA: 'Populated place',
  },
  geometry: { type: 'Point', coordinates: [lon, lat] },
});

const place = (id, names, { wikidata = null, lon = 0, lat = 0 } = {}) => ({
  id, kind: 'place', names, wikidata, where: { lon, lat },
});

test('a name folds by case and accent and by nothing else', () => {
  assert.equal(fold('São Tomé'), 'sao tome');
  assert.equal(fold('  LISBOA '), 'lisboa');
  assert.equal(fold('Lisboa'), fold('Lisbôa'));
  // Not a stemmer and not a transliteration: two different names stay two.
  assert.notEqual(fold('Belém, Lisbon'), fold('Belém'));
  assert.notEqual(fold('Porto'), fold('Oporto'));
});

test('the antimeridian is two degrees wide and not three hundred and sixty', () => {
  assert.equal(degreesApart({ lon: 179, lat: 0 }, { lon: -179, lat: 0 }), 2);
  assert.equal(degreesApart({ lon: -30, lat: 40 }, { lon: -30, lat: 41 }), 1);
  assert.equal(degreesApart(null, { lon: 0, lat: 0 }), Infinity);
});

test('wikidata is the first signal and the strongest', () => {
  const features = [
    city(1, 'Lisbon', { wikidata: 'Q597', lon: -9.13, lat: 38.72 }),
    city(2, 'Porto', { wikidata: 'Q36433', lon: -8.62, lat: 41.15 }),
  ];
  // The name on the record is not the name in the file, and it does not
  // matter: the Q-id is an identity and a name is not.
  const { entries, matched, unresolved } = matchPlaces(features, [
    place('lisbon', ['Lisboa'], { wikidata: 'Q597', lon: -9.14, lat: 38.72 }),
  ]);
  assert.deepEqual(entries, { 1: { place: 'lisbon' } });
  assert.equal(matched[0].how, 'wikidata');
  assert.deepEqual(unresolved, []);
});

test('a name matches only where exactly one city survives it', () => {
  const features = [
    city(1, 'Springfield', { lon: -89.65, lat: 39.78 }),
    city(2, 'Springfield', { lon: -72.58, lat: 42.10 }),
    city(3, 'Braga', { lon: -8.42, lat: 41.55 }),
  ];
  const { entries, matched, unresolved } = matchPlaces(features, [
    place('braga', ['Braga'], { lon: -8.42, lat: 41.55 }),
    place('springfield', ['Springfield'], { lon: -89.65, lat: 39.78 }),
  ]);
  assert.deepEqual(entries, { 3: { place: 'braga' } });
  assert.equal(matched.length, 1);
  assert.equal(matched[0].how, 'name');
  // Two candidates is not a tie to break. It is a question for a person, and
  // both of them are in the list so that the person has them in front of her.
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].place, 'springfield');
  assert.match(unresolved[0].reason, /2 cities fold to that name/);
  assert.deepEqual(unresolved[0].candidates.map((c) => c.id), ['1', '2']);
});

test('a name match far from the record\'s own point is refused, not taken', () => {
  // This atlas's own case, and the reason the guard exists: `belem` is Belém
  // in Lisbon and Natural Earth's only Belém is the one in Pará.
  const features = [city(9, 'Belém', { lon: -48.48, lat: -1.45 })];
  const { entries, unresolved } = matchPlaces(features, [
    place('belem', ['Belém'], { lon: -9.2, lat: 38.7 }),
  ]);
  assert.deepEqual(entries, {}, 'nothing is matched by being the only one of its name');
  assert.match(unresolved[0].reason, /° away, over the 1° a name alone is trusted within/);
  assert.equal(unresolved[0].candidates.length, 1, 'and the candidate is named, so a person can accept it in one line');
});

test('a record with no point is not matched on a name alone', () => {
  const features = [city(9, 'Alvor', { lon: -8.59, lat: 37.13 })];
  const { entries, unresolved } = matchPlaces(features, [{ id: 'alvor', names: ['Alvor'], where: {} }]);
  assert.deepEqual(entries, {});
  assert.match(unresolved[0].reason, /somewhere this record gives no point for/);
});

test('a wikidata match is kept however far apart the two points are', () => {
  // A disagreement about where a city is does not make it another city: the
  // record's point may be the fort and Natural Earth's the modern centre.
  const features = [city(1, 'Macau', { wikidata: 'Q14773', lon: 113.55, lat: 22.19 })];
  const { entries } = matchPlaces(features, [
    place('macau', ['Macau'], { wikidata: 'Q14773', lon: 113.54, lat: 22.2 }),
  ], { near: 0 });
  assert.deepEqual(entries, { 1: { place: 'macau' } });
});

test('one wikidata on two cities is a question and not a match', () => {
  const features = [
    city(1, 'Rome', { wikidata: 'Q220', lon: 12.5, lat: 41.9 }),
    city(2, 'Roma', { wikidata: 'Q220', lon: 12.5, lat: 41.9 }),
  ];
  const { entries, unresolved } = matchPlaces(features, [place('rome', ['Rome'], { wikidata: 'Q220', lon: 12.5, lat: 41.9 })]);
  assert.deepEqual(entries, {});
  assert.match(unresolved[0].reason, /Q220 is on 2 Natural Earth cities/);
});

test('one city is never two places', () => {
  const features = [city(1, 'Lisbon', { lon: -9.13, lat: 38.72 })];
  const { entries, unresolved } = matchPlaces(features, [
    place('lisboa', ['Lisbon'], { lon: -9.14, lat: 38.72 }),
    place('lisbon', ['Lisbon'], { lon: -9.14, lat: 38.72 }),
  ]);
  // The first in id order keeps it; the second is listed, because which of
  // the two it is belongs to whoever knows the place.
  assert.deepEqual(entries, { 1: { place: 'lisboa' } });
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].place, 'lisbon');
  assert.match(unresolved[0].reason, /already "lisboa"/);
});

test('a place record with no city at all is listed and is not an error', () => {
  const { entries, matched, unresolved } = matchPlaces([city(1, 'Lisbon')], [place('boe', ['Boé'], { lon: -14.2, lat: 11.75 })]);
  assert.deepEqual(entries, {});
  assert.deepEqual(matched, []);
  assert.match(unresolved[0].reason, /no city of that name and no wikidata match/);
});

test('the match is a pure function and answers in place-id order', () => {
  const features = [city(1, 'Aaa', { lon: 0, lat: 0 }), city(2, 'Bbb', { lon: 1, lat: 1 })];
  const records = [place('zulu', ['Bbb'], { lon: 1, lat: 1 }), place('alpha', ['Aaa'], { lon: 0, lat: 0 })];
  const one = matchPlaces(features, records);
  const two = matchPlaces(features, records);
  assert.deepEqual(one, two);
  assert.deepEqual(one.matched.map((m) => m.place), ['alpha', 'zulu']);
  assert.deepEqual(features[0].properties.NE_ID, 1, 'and the input was not written on');
});

test('a feature with no id is no candidate, and a city reads through the table', () => {
  assert.equal(cityIdentity({ properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } }), null);
  const read = cityIdentity(city(7, 'Lisboa', { en: 'Lisbon', wikidata: 'Q597', lon: -9.1, lat: 38.7, pop: 2812000 }));
  assert.deepEqual(read, {
    id: '7', name: 'Lisboa', nameEn: 'Lisbon', wikidata: 'Q597', pop: 2812000, lon: -9.1, lat: 38.7,
  });
});

test('an entry a person wrote by hand survives the next run', () => {
  const computed = { 1: { place: 'lisbon' } };
  const existing = { entries: { 1: { place: 'lisbon' }, 99: { place: 'alvor', note: 'resolved by hand' } } };
  assert.deepEqual(handEntries(existing, computed), { 99: { place: 'alvor', note: 'resolved by hand' } });
  assert.deepEqual(handEntries(null, computed), {});
});

test('the file is written in numeric id order, so two runs write one file', () => {
  const file = placesFile({ 1159151529: { place: 'berlin' }, 90: { place: 'alvor' }, 1000: { place: 'porto' } }, { source: 'natural-earth-10m' });
  assert.deepEqual(Object.keys(file.entries), ['90', '1000', '1159151529']);
  assert.equal(file.kind, 'import-places');
  assert.equal(file.schema, 1);
  assert.equal(file.source, 'natural-earth-10m');
});

test('the guard is a degree, and it is named rather than spelled twice', () => {
  assert.equal(NEAR_DEGREES, 1);
});

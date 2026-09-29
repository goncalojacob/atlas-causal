// A15(6) — a country is a place only when it was there.
//
// `P17` is the last and loosest step of A9's chain: it says which state the
// item is filed under *today*. A14 (2)'s lane guard catches a country in the
// wrong lane; nothing caught a country in the right lane that did not exist
// yet, and the 25 September review found 23 pre-1800 events standing on a
// modern state's point.
//
// Three refusals and no fourth, each a fact on the item.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countryRefusal, COUNTRY_DISTANCE_KM } from '../tools/import/wikidata.mjs';
import { haversineKm } from '../src/util/geo.js';

const MADRID = { lon: -3.70, lat: 40.42 };
const MEXICO_CITY = { lon: -99.13, lat: 19.43 };
const STRASBOURG = { lon: 7.75, lat: 48.58 };
const PARIS = { lon: 2.35, lat: 48.86 };

test('a great-circle distance, and the threshold it is measured against', () => {
  // Lisbon to Paris, which every atlas puts at about 1,450 km.
  assert.ok(Math.abs(haversineKm({ lon: -9.14, lat: 38.72 }, PARIS) - 1453) < 5);
  assert.equal(haversineKm(PARIS, PARIS), 0);
  assert.equal(haversineKm(null, PARIS), null);
  assert.equal(haversineKm({ lon: 'x', lat: 1 }, PARIS), null);
  // The pair form, because a point comes out of a place record both ways.
  assert.equal(Math.round(haversineKm([2.35, 48.86], PARIS)), 0);
  assert.equal(COUNTRY_DISTANCE_KM, 1000);
});

test('a country that did not exist yet is not the place', () => {
  assert.match(
    countryRefusal({ when: { start: 1494, end: 1495 }, country: { point: { lon: 12.5, lat: 42.8 }, inception: 1946 } }),
    /inception \(1946\) is after the event ended \(1495\)/,
  );
  // And one dissolved before it began.
  assert.match(
    countryRefusal({ when: { start: 1979, end: 1979 }, country: { point: { lon: 105, lat: 21 }, dissolution: 1976 } }),
    /dissolved \(1976\) before the event began \(1979\)/,
  );
  // A country whose life contains the event is fine.
  assert.equal(
    countryRefusal({ when: { start: 1979, end: 1979 }, country: { point: { lon: 105, lat: 21 }, inception: 1945, dissolution: 1990 } }),
    null,
  );
  // An event with no end is compared on its start alone.
  assert.equal(
    countryRefusal({ when: { start: 1960, end: null }, country: { point: PARIS, inception: 1958 } }),
    null,
  );
});

test('an item naming several countries names no one country', () => {
  const nine = countryRefusal({
    when: { start: 1929, end: 1939 },
    country: { point: { lon: 69, lat: 34 } },
    countryCount: 9,
  });
  assert.match(nine, /names 9 countries/);
  // One is one.
  assert.equal(countryRefusal({ when: { start: 1929, end: 1939 }, country: { point: PARIS }, countryCount: 1 }), null);
});

test('a country nowhere near the event is not where it happened', () => {
  // Madrid for a war in Mexico.
  assert.match(
    countryRefusal({ when: { start: 1810, end: 1821 }, country: { point: MADRID }, chainPoints: [MEXICO_CITY] }),
    /km from the nearest point on the event's own chain/,
  );
  // Paris for a battle in Alsace: 400 km, and kept.
  assert.equal(
    countryRefusal({ when: { start: 1944, end: 1944 }, country: { point: PARIS }, chainPoints: [STRASBOURG] }),
    null,
  );
  // The nearest point on the chain is what counts, not the first.
  assert.equal(
    countryRefusal({ when: { start: 1944, end: 1944 }, country: { point: PARIS }, chainPoints: [MEXICO_CITY, STRASBOURG] }),
    null,
  );
  // A chain with no point at all measures nothing and refuses nothing: the
  // distance test cannot speak about an event whose chain is placeless.
  assert.equal(countryRefusal({ when: { start: 1810, end: 1821 }, country: { point: MADRID }, chainPoints: [] }), null);
});

test('the order of the three is the order of what is cheapest to be sure of', () => {
  // A country that did not exist is refused for that and not for its distance,
  // because the reason is logged and the reason should be the true one.
  const why = countryRefusal({
    when: { start: 1494, end: 1495 },
    country: { point: { lon: 12.5, lat: 42.8 }, inception: 1946 },
    countryCount: 3,
    chainPoints: [MEXICO_CITY],
  });
  assert.match(why, /inception/);
  assert.equal(countryRefusal({ when: { start: 1900, end: 1900 }, country: null }), 'the item names no country with a point');
});

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
import { countryRefusal, COUNTRY_DISTANCE_KM, countryGateApplies, chainPointsOf, refusedPlaces, pointOfPlace } from '../tools/import/wikidata.mjs';
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

// --- deviation 1476: which candidates the gate runs on ---------------------

test('the gate runs on a country however the chain reached it', () => {
  // What it always did: `P17` named it.
  assert.equal(countryGateApplies({ qid: 'Q258', countries: new Set(['Q258']) }), true);
  // Deviation 1476: `P276` named it, and its own class says it is a country.
  // This is the case the gate was written for and walked straight past.
  assert.equal(countryGateApplies({ qid: 'Q1033', countries: new Set(), precision: 'country' }), true);
  // A city is a city whichever property reached it.
  assert.equal(countryGateApplies({ qid: 'Q90', countries: new Set(), precision: 'city' }), false);
  // A class the table gives no precision says nothing, so the gate stays off:
  // refusing on silence would refuse every fort and every battlefield.
  assert.equal(countryGateApplies({ qid: 'Q90', countries: new Set(), precision: null }), false);
  // A list is as good as a set, because a caller has one or the other.
  assert.equal(countryGateApplies({ qid: 'Q29', countries: ['Q29'] }), true);
  assert.equal(countryGateApplies({ qid: 'Q29', countries: [] }), false);
  assert.equal(countryGateApplies({}), false);
});

// --- deviation 1477: the chain the distance is measured against -------------

test("the chain is the event's own parents and children, not the item's", () => {
  const points = new Map([
    ['cairo', { lon: 31.24, lat: 30.04 }],
    ['suez', { lon: 32.53, lat: 29.97 }],
  ]);
  const pointOf = (id) => points.get(id) ?? null;
  assert.deepEqual(
    chainPointsOf([{ place: 'cairo' }, { place: 'suez' }], pointOf),
    [{ lon: 31.24, lat: 30.04 }, { lon: 32.53, lat: 29.97 }],
  );
  // A placeless parent contributes nothing, and neither does one whose place
  // the atlas does not hold: the test measures what is there.
  assert.deepEqual(chainPointsOf([{ place: null }, { place: 'nowhere' }, { place: 'cairo' }], pointOf),
    [{ lon: 31.24, lat: 30.04 }]);
  // Empty is a real answer and not a failure: an event whose whole chain is
  // placeless is one this half of the gate cannot speak about.
  assert.deepEqual(chainPointsOf([], pointOf), []);
  assert.deepEqual(chainPointsOf(null, pointOf), []);

  // And the reason 1477 matters, in three assertions. A container the item is
  // filed inside — its `P276` or `P131` — sits in the very country being
  // tested, so its point is under 1,000 km from that country's centroid by
  // construction and the third refusal can never fire. Toledo for Spain:
  const toledo = { lon: -4.03, lat: 39.86 };
  const when = { start: 1810, end: 1821 };
  assert.equal(countryRefusal({ when, country: { point: MADRID }, chainPoints: [toledo] }), null,
    'a container inside the country always passes it, which is why containers are not anchors');
  // The event's own point is the opposite case and the strongest anchor there
  // is: it is what refuses Madrid for a war in Mexico.
  assert.match(countryRefusal({ when, country: { point: MADRID }, chainPoints: [MEXICO_CITY] }),
    /km from the nearest point/);
  // And a container among the anchors takes the refusal away again, which is
  // the whole of the defect: the minimum is what the gate measures.
  assert.equal(countryRefusal({ when, country: { point: MADRID }, chainPoints: [MEXICO_CITY, toledo] }), null);
});

// --- the refusals already on disk ------------------------------------------

test("a record's own note says what A15(6) has already refused for it", () => {
  const record = {
    place: null,
    review: { note: "A15(6): the place was german-east-africa-q153963, from the item's P17, and it is refused because the country's point is 1056 km from the nearest point on the event's own chain. The lane is unchanged." },
  };
  assert.deepEqual([...refusedPlaces(record)], ['german-east-africa-q153963']);

  // A gate that passed refused nothing.
  assert.equal(refusedPlaces({ review: { note: "A15(6)'s gate passes: inception 1960, one country, the chain's own point." } }).size, 0);
  assert.equal(refusedPlaces({}).size, 0);
  assert.equal(refusedPlaces({ review: { note: null } }).size, 0);

  // The 1952 Egyptian revolution: refused as the item's P17 country in one
  // sentence, placed there through its P276 in the next. The place the record
  // carries is a fact and never a candidate, so the note does not take it away.
  const egypt = {
    place: 'kingdom-of-egypt',
    review: { note: "A15(6): the place was kingdom-of-egypt, from the item's P17, and it is refused because the item names 2 countries, so it names no one country. The lane is unchanged. A9: placed at kingdom-of-egypt from the item's P276, a polity whose own dates cover this event; the earlier refusal was of the P17 country." },
  };
  assert.equal(refusedPlaces(egypt).size, 0);

  // Two refusals on one record are two.
  const two = { review: { note: "A15(6): the place was spain-q29, from the item's P17, and it is refused because the country's inception (1715) is after the event ended (1641). A15(6): the place was france-q142, from the item's P17, and it is refused because the item names 3 countries, so it names no one country." } };
  assert.deepEqual([...refusedPlaces(two)].sort(), ['france-q142', 'spain-q29']);
});

test('where a place record this atlas holds stands', () => {
  const entries = [
    { record: { id: 'cairo', kind: 'place', where: { lon: 31.24, lat: 30.04, precision: 'city' } } },
    { record: { id: 'cairo', kind: 'event' } },
    { record: { id: 'nowhere', kind: 'place' } },
  ];
  assert.deepEqual(pointOfPlace(entries, 'cairo'), { lon: 31.24, lat: 30.04 });
  // A place with no point, an id nothing holds, and no entries at all.
  assert.equal(pointOfPlace(entries, 'nowhere'), null);
  assert.equal(pointOfPlace(entries, 'lisbon'), null);
  assert.equal(pointOfPlace(null, 'cairo'), null);
});

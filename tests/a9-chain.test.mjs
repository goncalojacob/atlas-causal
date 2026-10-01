// A9's chain, walked by the import's own function and by nothing else.
//
// A11(a) makes the curation fire place every event the atlas holds, and the
// chain it must walk is the chain `--import` walks: the item's own `P625`
// first (A12(2)), then `P276`, `P131` and `P17`, with A15(6)'s gate at every
// step (deviation 1476), A14(2)'s lane guard, the reuse rule, and the record's
// own recorded refusals as an oracle (A15(6)'s note).
//
// The 30 September fire wrote that chain a second time in a script and the
// copy was weaker than the rule: it handed A15(6)'s distance test the item's
// own points rather than the event's, so a country 6,962 km away passed a gate
// that had already refused it (deviation 1477). The answer is not a better
// copy. It is that there is one chain, exported, and this file is what holds
// it exported.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  eventPlace, readEntity, placeChain, PLACE_REFUSED_FLAG, placeRefused, refusedPlaces,
} from '../tools/import/wikidata.mjs';

// The smallest entity the reader accepts: an id, and the claims a step needs.
function entity(id, { point = null, country = [], location = [], instanceOf = [], inception = null, label = id } = {}) {
  const claims = {};
  const snak = (value) => ({ mainsnak: { snaktype: 'value', datavalue: { value } } });
  if (point) claims.P625 = [snak({ longitude: point.lon, latitude: point.lat })];
  const ids = (prop, list) => {
    if (!list.length) return;
    claims[prop] = list.map((q) => snak({ id: q }));
  };
  ids('P17', country);
  ids('P276', location);
  ids('P31', instanceOf);
  if (inception) {
    claims.P571 = [snak({ time: `+${String(inception).padStart(4, '0')}-01-01T00:00:00Z`, precision: 9 })];
  }
  return { id, labels: { en: { language: 'en', value: label } }, descriptions: {}, aliases: {}, sitelinks: {}, claims };
}

const CLASSES = { Q515: { kind: 'place', precision: 'city' }, Q6256: { kind: 'place', precision: 'country' } };

function harness(entities, { entries = [], lane = { how: 'point', region: 'europe' }, deriveRegion = () => ({ region: 'europe' }) } = {}) {
  const report = {
    created: [], reused: [], offCountry: [], offLane: [], offClass: [], ownPoint: [],
  };
  const written = [];
  return {
    report,
    written,
    opts: {
      dataDir: null,
      entries,
      entityOf: (qid) => entities[qid] ?? null,
      byItem: new Map(),
      taken: new Set(),
      written,
      report,
      deriveRegion,
      classes: CLASSES,
      today: '2026-10-01',
      lane,
    },
  };
}

test('the chain is the import\'s own function, exported', () => {
  assert.equal(typeof eventPlace, 'function');
  // And the order is still A12(2)'s: the item's own point, then P276, then
  // P131, then P17.
  const read = readEntity(entity('Q1', { location: ['Q2'], country: ['Q3'] }));
  assert.deepEqual(placeChain(read), ['Q1', 'Q2', 'Q3']);
});

test('a place the atlas already holds at that item is reused, and the chain stops there', async () => {
  const read = readEntity(entity('Q1', { location: ['Q2'] }));
  const h = harness({ Q2: entity('Q2', { point: { lon: 2.35, lat: 48.86 }, instanceOf: ['Q515'] }) }, {
    entries: [{ record: { kind: 'place', id: 'paris', where: { lon: 2.35, lat: 48.86 } } }],
  });
  h.opts.byItem.set('place:Q2', 'paris');
  const found = await eventPlace(read, h.opts);
  assert.deepEqual(found, { place: 'paris', flagged: false });
  assert.equal(h.written.length, 0);
});

test('A15(6)\'s gate runs at P276 and not only at P17 (deviation 1476)', async () => {
  // The country stands in `P276`, which is where the 30 September fire's copy
  // let eighteen placements through: a state founded in 1958 is not the place
  // of a revolution of 1789 whichever property named it.
  const read = readEntity(entity('Q1', { location: ['Q142'] }));
  const h = harness({
    Q142: entity('Q142', { point: { lon: 2.35, lat: 48.86 }, instanceOf: ['Q6256'], inception: 1958, label: 'France' }),
  });
  const found = await eventPlace(read, { ...h.opts, when: { start: 1789, end: 1799 } });
  assert.equal(found.place, null);
  assert.equal(h.report.offCountry.length, 1);
  assert.equal(h.report.offCountry[0].qid, 'Q142');
  assert.match(h.report.offCountry[0].why, /inception \(1958\) is after the event ended \(1799\)/);
});

test('a refusal the record already carries is a refusal, without a fetch', async () => {
  const read = readEntity(entity('Q1', { location: ['Q414'] }));
  const h = harness({ Q414: entity('Q414', { point: { lon: -58.4, lat: -34.6 }, instanceOf: ['Q6256'] }) }, {
    entries: [{ record: { kind: 'place', id: 'argentina', where: { lon: -58.4, lat: -34.6 } } }],
  });
  h.opts.byItem.set('place:Q414', 'argentina');
  const found = await eventPlace(read, { ...h.opts, refused: new Set(['argentina']) });
  assert.equal(found.place, null);
  assert.match(h.report.offCountry[0].why, /already refuses argentina under A15\(6\)/);
});

test('A14(2)\'s lane guard refuses a place in another lane', async () => {
  const read = readEntity(entity('Q1', { location: ['Q2'] }));
  const h = harness({ Q2: entity('Q2', { point: { lon: 2.35, lat: 48.86 }, instanceOf: ['Q515'] }) }, {
    lane: { how: 'point', region: 'asia' },
    deriveRegion: () => ({ region: 'europe' }),
  });
  const found = await eventPlace(read, h.opts);
  assert.equal(found.place, null);
  assert.equal(h.report.offLane.length, 1);
  assert.equal(h.report.offLane[0].eventLane, 'asia');
  assert.equal(h.report.offLane[0].placeLane, 'europe');
});

test('the item\'s own point reuses and never writes, and is reported for a person', async () => {
  // An event whose only located thing is itself: the place a person has to
  // write, and only once the rest of the chain has failed (deviation 1325).
  const read = readEntity(entity('Q1', { point: { lon: 1.4, lat: 18.9 } }));
  const h = harness({ Q1: entity('Q1', { point: { lon: 1.4, lat: 18.9 } }) });
  const found = await eventPlace(read, h.opts);
  assert.equal(found.place, null);
  assert.equal(h.written.length, 0);
  assert.deepEqual(h.report.ownPoint, [{ qid: 'Q1', point: { lon: 1.4, lat: 18.9 } }]);
});

test('an item whose class is not a place of this atlas is refused and listed', async () => {
  const read = readEntity(entity('Q1', { location: ['Q9'] }));
  const h = harness({ Q9: entity('Q9', { point: { lon: 2.35, lat: 48.86 }, instanceOf: ['Q99999'] }) });
  const found = await eventPlace(read, h.opts);
  assert.equal(found.place, null);
  assert.equal(h.report.offClass.length, 1);
  assert.equal(h.report.offClass[0].qid, 'Q9');
});

// A11(a)'s own flag: an event that takes no place at all.
//
// Five records refuse every candidate and say so in prose — *"a war on two
// seas has no one point"*, *"the place is cleared and the Africa lane kept"*.
// `refusedPlaces()` cannot read a sentence, so three curation fires in a row
// re-derived those refusals from the network and took the placements back by
// hand. The flag is the half of the judgement a pass can ask about; the note
// beside it is still the whole of the argument.
test('a record flagged place-refused is one no pass goes looking for a place for', () => {
  assert.equal(PLACE_REFUSED_FLAG, 'place-refused');
  assert.equal(placeRefused({ review: { flags: ['imported-facts', PLACE_REFUSED_FLAG] } }), true);
  assert.equal(placeRefused({ review: { flags: ['imported-facts'] } }), false);
  assert.equal(placeRefused({ review: {} }), false);
  assert.equal(placeRefused(null), false);
});

test('the flag says nothing about a refusal of one candidate, which is refusedPlaces\'s shape', () => {
  // `1952-egyptian-revolution` refuses the modern state through `P17` and is
  // still placed through `P276`: a candidate refused is not an event refused,
  // and the two answers must not be able to be confused for one another.
  const oneCandidate = {
    place: null,
    review: { flags: [], note: 'A15(6): the place was italy-q38, from the item\'s P17, and it is refused because the country\'s inception (1946) is after the event ended (1495).' },
  };
  assert.deepEqual([...refusedPlaces(oneCandidate)], ['italy-q38']);
  assert.equal(placeRefused(oneCandidate), false);
});

// A15(6)'s gate and the 124 countries it could not see.
//
// The gate asks whether the candidate is a country, and it asked the item's
// own class. `france-q142` is a place record of this atlas at `country`
// precision, and the class table reads `Q142`'s `P31` as an **actor**, so
// `classify()` returns no precision and the gate did not run. The 1 October
// fire's places pass put the Italian War of 1551–1559 in France on exactly
// that hole. 124 of the 797 place records are countries.
//
// The record's own `where.precision` is this atlas's answer about what the
// thing is, so it is what the gate is given.
test('a held place record at country precision is a country, whatever the class table says', async () => {
  const read = readEntity(entity('Q1', { location: ['Q142'] }));
  // The item classifies as an actor — no precision at all — exactly as Q142 does.
  const h = harness({ Q142: entity('Q142', { point: { lon: 2, lat: 47 }, instanceOf: ['Q3624078'], inception: 1958, label: 'France' }) }, {
    entries: [{ record: { kind: 'place', id: 'france-q142', where: { lon: 2, lat: 47, precision: 'country' } } }],
  });
  h.opts.byItem.set('place:Q142', 'france-q142');
  const found = await eventPlace(read, { ...h.opts, when: { start: 1551, end: 1559 } });
  assert.equal(found.place, null);
  assert.equal(h.report.offCountry.length, 1);
  assert.match(h.report.offCountry[0].why, /inception \(1958\) is after the event ended \(1559\)/);
});

test('and a held place that is not a country is reached as before', async () => {
  const read = readEntity(entity('Q1', { location: ['Q90'] }));
  const h = harness({ Q90: entity('Q90', { point: { lon: 2.35, lat: 48.86 }, instanceOf: ['Q515'] }) }, {
    entries: [{ record: { kind: 'place', id: 'paris', where: { lon: 2.35, lat: 48.86, precision: 'city' } } }],
  });
  h.opts.byItem.set('place:Q90', 'paris');
  const found = await eventPlace(read, { ...h.opts, when: { start: 1789, end: 1799 } });
  assert.equal(found.place, 'paris');
  assert.equal(h.report.offCountry.length, 0);
});

// The office and tenure kinds: what the topology and the spine carry, rule
// 26 — the category's endpoints table, the person, the office, the overlap —
// and the reach of rules 3, 6, 11, 12 and 15 into both. Every case builds its
// own synthetic record over the fixture actors, so the office and the three
// tenures the fixtures carry are never the thing under test; what those four
// are for is that the whole pipeline — the index, the spine, the search
// shard, the review digests — is exercised against a corpus that has them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, buildTopology, buildSpine } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { OFFICE_ENDPOINTS } from '../src/validate/rules.js';
import { buildSearchIndex } from '../src/search.js';
import { fixtures, schemas } from './helpers.mjs';

const AUTHORS = [{ name: 'Fixture Author', github: 'fixture-author' }];

function envelope(id, kind) {
  return {
    schema: 1,
    id,
    kind,
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: AUTHORS,
    license: 'CC-BY-SA-4.0',
    created: '2026-01-01',
    revised: null,
  };
}

function office(id, overrides = {}) {
  return {
    ...envelope(id, 'office'),
    sources: [],
    of: 'fixture-polity-three',
    title: 'A Synthetic Post',
    category: 'head-of-state',
    when: { start: 1150, end: null },
    summary: null,
    ...overrides,
  };
}

function tenure(id, overrides = {}) {
  return {
    ...envelope(id, 'tenure'),
    sources: [{ source: 'fixture-source-1', locator: null }],
    person: 'fixture-actor-one',
    office: 'fixture-office-one',
    when: { start: 1200, end: 1210 },
    startedBy: null,
    ...overrides,
  };
}

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const rulesHit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

test('the fixtures carry an office and three tenures, one pair of them overlapping', async () => {
  const r = await run();
  assert.equal(r.errors.length, 0, messages(r));
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  assert.deepEqual(topology.offices.map((o) => o.id), ['fixture-office-one']);
  assert.deepEqual(
    topology.tenures.map((t) => t.id),
    ['fixture-tenure-one', 'fixture-tenure-three', 'fixture-tenure-two'],
  );
  // Two of the three run over the same years. A regency is not a mistake and
  // a year is the finest bound this model has, so nothing reports it (plan
  // decision 2).
  const byId = Object.fromEntries(topology.tenures.map((t) => [t.id, t]));
  assert.deepEqual(byId['fixture-tenure-one'].when, { start: 1200, end: 1210 });
  assert.deepEqual(byId['fixture-tenure-two'].when, { start: 1208, end: 1220 });
  assert.equal(byId['fixture-tenure-one'].startedBy, 'fixture-event-a');
});

test('an office reaches the topology and the spine whole, and a tenure with it', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const [record] = topology.offices;
  assert.deepEqual(record, {
    id: 'fixture-office-one',
    of: 'fixture-polity-three',
    title: 'Fixture Crown',
    category: 'head-of-state',
    revised: '2026-01-01',
    when: { start: 1150, end: null },
    status: 'active',
    supersededBy: null,
    aliases: [],
  });
  // The prose stays out, as it does for every other kind: a card fetches it.
  assert.equal(Object.hasOwn(record, 'summary'), false);
  const spine = buildSpine(topology);
  assert.equal(spine.offices.length, 1);
  assert.equal(spine.offices[0].kind, 'office');
  assert.equal(spine.tenures.length, 3);
  assert.equal(spine.tenures[0].kind, 'tenure');
  assert.equal(spine.tenures[0].person, 'fixture-actor-one');
});

// A7, item 4: a reader types "prime minister"; nobody types the name of a
// tenure, because a tenure has none.
test('an office is in the search shard and a tenure is not', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const entries = buildSearchIndex(topology);
  const found = entries.filter((e) => e.kind === 'office');
  assert.deepEqual(found.map((e) => e.id), ['fixture-office-one']);
  assert.equal(found[0].label, 'Fixture Crown');
  assert.equal(found[0].detail, 'head-of-state');
  assert.equal(entries.some((e) => e.kind === 'tenure'), false);
});

// --- rule 26 ---------------------------------------------------------------

test('rule 26: an office belongs to an actor the category allows', async () => {
  // The table itself, so that the cases below are checked against what the
  // rule reads rather than against a second copy of it.
  assert.deepEqual(OFFICE_ENDPOINTS['head-of-state'], ['polity']);
  assert.deepEqual(OFFICE_ENDPOINTS['party-leadership'], ['polity', 'institution']);

  let r = await run((fx) => fx.records.push(office('synthetic-office')));
  assert.equal(rulesHit(r, 26).length, 0, messages(r));

  // A crown of an institution: the shape of the record cannot say this is
  // wrong, which is what the rule is for.
  r = await run((fx) => fx.records.push(office('synthetic-office', { of: 'fixture-actor-two' })));
  assert.equal(rulesHit(r, 26).length, 1, messages(r));
  assert.match(rulesHit(r, 26)[0].message, /"head-of-state" office belongs to polity/);
  assert.equal(rulesHit(r, 26)[0].path, '/of');

  // The same institution under a category that allows one.
  r = await run((fx) => fx.records.push(office('synthetic-office', { of: 'fixture-actor-two', category: 'party-leadership' })));
  assert.equal(rulesHit(r, 26).length, 0, messages(r));

  // And an `of` that names nothing at all.
  r = await run((fx) => fx.records.push(office('synthetic-office', { of: 'no-such-actor' })));
  assert.equal(rulesHit(r, 26).length, 1);
  assert.match(rulesHit(r, 26)[0].message, /is not an actor record/);
});

test('rule 26: a tenure is held by a person, at an office', async () => {
  let r = await run((fx) => fx.records.push(tenure('synthetic-tenure')));
  assert.equal(rulesHit(r, 26).length, 0, messages(r));

  // A party does not hold a presidency.
  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { person: 'fixture-polity-three' })));
  assert.equal(rulesHit(r, 26).length, 1, messages(r));
  assert.match(rulesHit(r, 26)[0].message, /held by a person, not by a polity/);
  assert.equal(rulesHit(r, 26)[0].path, '/person');

  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { person: 'nobody' })));
  assert.match(rulesHit(r, 26)[0].message, /is not an actor record/);

  // The office end: an actor is not an office, and neither is nothing.
  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { office: 'fixture-polity-three' })));
  assert.equal(rulesHit(r, 26).length, 1, messages(r));
  assert.match(rulesHit(r, 26)[0].message, /is not an office record/);
  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { office: 'no-such-office' })));
  assert.equal(rulesHit(r, 26).length, 1);
});

test('rule 26: a tenure runs while its office exists, and an undated office claims nothing', async () => {
  // The fixture office runs 1150 onwards, so a tenure before it is an error
  // and one inside it is not.
  let r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { when: { start: 1100, end: 1120 } })));
  assert.equal(rulesHit(r, 26).length, 1, messages(r));
  assert.match(rulesHit(r, 26)[0].message, /does not cover these years/);
  assert.equal(rulesHit(r, 26)[0].path, '/when');

  // Touching at one year is overlapping: a year is the finest bound.
  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { when: { start: 1100, end: 1150 } })));
  assert.equal(rulesHit(r, 26).length, 0, messages(r));

  // An office with no interval asserts nothing about when it began, so there
  // is nothing for a tenure to fall outside of (amendment A13).
  r = await run((fx) => {
    fx.byId['fixture-office-one'].when = null;
    fx.records.push(tenure('synthetic-tenure', { when: { start: 1100, end: 1120 } }));
  });
  assert.equal(rulesHit(r, 26).length, 0, messages(r));
});

// --- the rules the two kinds join -----------------------------------------

test('rule 6: a tenure cites and an office does not', async () => {
  let r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { sources: [] })));
  assert.equal(rulesHit(r, 6).length, 1, messages(r));
  assert.match(rulesHit(r, 6)[0].message, /every tenure cites at least one source/);
  // An office is a fact about how an actor is arranged, not an argument.
  r = await run((fx) => fx.records.push(office('synthetic-office', { sources: [] })));
  assert.equal(rulesHit(r, 6).length, 0, messages(r));
});

test('rule 15: both intervals are years, and an office may have none', async () => {
  let r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { when: { start: 1210, end: 1200 } })));
  assert.equal(rulesHit(r, 15).length, 1, messages(r));
  r = await run((fx) => fx.records.push(office('synthetic-office', { when: { start: 0, end: null } })));
  assert.equal(rulesHit(r, 15).length, 1, messages(r));
  assert.match(rulesHit(r, 15)[0].message, /no year 0/);
  r = await run((fx) => fx.records.push(office('synthetic-office', { when: null })));
  assert.equal(rulesHit(r, 15).length, 0, messages(r));
});

test('rules 3 and 11: the event a tenure was started by', async () => {
  let r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { startedBy: 'fixture-event-b' })));
  assert.equal(r.errors.length, 0, messages(r));
  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { startedBy: 'no-such-event' })));
  assert.equal(rulesHit(r, 3).length, 1, messages(r));
  assert.match(rulesHit(r, 3)[0].message, /is not an event record/);
  // A tombstone is not a reason a government changed.
  r = await run((fx) => {
    fx.byId['fixture-event-b'].status = 'retracted';
    fx.byId['fixture-event-b'].retraction = { on: '2026-09-06', reason: 'Synthetic: withdrawn in a test.' };
    fx.records.push(tenure('synthetic-tenure', { startedBy: 'fixture-event-b' }));
  });
  assert.ok(rulesHit(r, 11).some((e) => e.id === 'synthetic-tenure' && /started by the retracted event/.test(e.message)), messages(r));
});

test('rule 11: an active tenure is not a turn at a retracted office, and its actors are held', async () => {
  let r = await run((fx) => {
    fx.byId['fixture-office-one'].status = 'retracted';
    fx.byId['fixture-office-one'].retraction = { on: '2026-09-06', reason: 'Synthetic: withdrawn in a test.' };
  });
  assert.equal(rulesHit(r, 11).length, 3, messages(r));
  for (const e of rulesHit(r, 11)) assert.match(e.message, /turn at the retracted office/);

  // A7, item 2: a tenure puts its person into the actor referrers, so
  // retracting an actor somebody's tenures still name is reported — and, the
  // other way round, an actor who is in the atlas only because they held an
  // office is never `actor-unused`.
  r = await run((fx) => {
    fx.byId['fixture-actor-one'].status = 'retracted';
    fx.byId['fixture-actor-one'].retraction = { on: '2026-09-06', reason: 'Synthetic: withdrawn in a test.' };
  });
  assert.ok(rulesHit(r, 11).some((e) => e.id === 'fixture-actor-one' && /active tenure "fixture-tenure-one"/.test(e.message)), messages(r));
  r = await run((fx) => {
    fx.byId['fixture-polity-three'].status = 'retracted';
    fx.byId['fixture-polity-three'].retraction = { on: '2026-09-06', reason: 'Synthetic: withdrawn in a test.' };
  });
  assert.ok(rulesHit(r, 11).some((e) => e.id === 'fixture-polity-three' && /active office "fixture-office-one"/.test(e.message)), messages(r));
});

test('rule 12: both kinds are CC BY-SA and nothing else', async () => {
  const r = await run((fx) => {
    fx.records.push(office('synthetic-office', { license: 'CC-BY-NC-SA-4.0' }));
    fx.records.push(tenure('synthetic-tenure', { license: 'CC-BY-NC-SA-4.0' }));
  });
  assert.equal(rulesHit(r, 12).length, 2, messages(r));
});

test('rule 21: an office may claim a Wikidata item and a tenure may not', async () => {
  let r = await run((fx) => fx.records.push(office('synthetic-office', { wikidata: 'Q4242' })));
  assert.equal(r.errors.length, 0, messages(r));
  // Two offices for one item is one office written twice.
  r = await run((fx) => {
    fx.records.push(office('synthetic-office', { wikidata: 'Q4242' }));
    fx.records.push(office('another-office', { wikidata: 'Q4242' }));
  });
  assert.equal(rulesHit(r, 21).length, 2, messages(r));
  // A tenure has no `wikidata` property at all, so the schema is what refuses
  // it and rule 21 never sees the record.
  r = await run((fx) => fx.records.push(tenure('synthetic-tenure', { wikidata: 'Q4242' })));
  assert.equal(rulesHit(r, 1).length, 1, messages(r));
});

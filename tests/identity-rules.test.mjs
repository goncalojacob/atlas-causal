// Rules 21 and 22, and the citation-flag half of rule 3. Everything here is
// synthetic: fixture-* ids, invented titles, Q-numbers chosen because they
// are short. No historical claim anywhere.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRules, citedSources, WIKIPEDIA_SOURCES } from '../src/validate/rules.js';
import { validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas, clone } from './helpers.mjs';

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const rulesHit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

// --- the schema accepts them ------------------------------------------------

test('the schemas accept the three identity fields on an event, an actor and a place', async () => {
  const r = await run((fx) => {
    fx.byId['fixture-event-a'].wikidata = 'Q11';
    fx.byId['fixture-event-a'].wikipedia = { en: 'Fixture article A', 'pt-br': 'Artigo de fixture A' };
    fx.byId['fixture-event-a'].sitelinks = { count: 0, on: '2026-09-05' };
    fx.byId['fixture-actor-one'].wikidata = 'Q12';
    fx.byId['fixture-actor-one'].sitelinks = { count: 7, on: '2026-09-05' };
    fx.byId['fixture-place-a'].wikidata = 'Q13';
    fx.byId['fixture-place-a'].wikipedia = { pt: 'Lugar de fixture A' };
  });
  assert.equal(r.errors.length, 0, messages(r));
});

test('the schema refuses a malformed item id, a non-string title and a negative count', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a'].wikidata = 'Q0'; });
  assert.equal(rulesHit(r, 1)[0].path, '/wikidata');
  r = await run((fx) => { fx.byId['fixture-event-a'].wikidata = 'https://www.wikidata.org/wiki/Q42'; });
  assert.equal(rulesHit(r, 1)[0].path, '/wikidata');
  r = await run((fx) => {
    fx.byId['fixture-event-a'].wikidata = 'Q11';
    fx.byId['fixture-event-a'].wikipedia = { en: 42 };
  });
  assert.equal(rulesHit(r, 1)[0].path, '/wikipedia/en');
  r = await run((fx) => { fx.byId['fixture-event-a'].sitelinks = { count: -1, on: '2026-09-05' }; });
  assert.equal(rulesHit(r, 1)[0].path, '/sitelinks/count');
  r = await run((fx) => { fx.byId['fixture-event-a'].sitelinks = { count: 1.5, on: '2026-09-05' }; });
  assert.equal(rulesHit(r, 1)[0].path, '/sitelinks/count');
  // A count with no date is the shape the migration took away: it says a
  // third party's number is a fact of this record's own (finding 23b).
  r = await run((fx) => { fx.byId['fixture-event-a'].sitelinks = 3; });
  assert.equal(rulesHit(r, 1)[0].path, '/sitelinks');
  // An edge is an argument about things, not a thing: it has no item, and
  // the schema says so before rule 21 has to.
  r = await run((fx) => { fx.byId['fixture-event-a--fixture-event-b--caused'].wikidata = 'Q11'; });
  assert.equal(rulesHit(r, 1)[0].path, '/wikidata');
});

// --- rule 21 ---------------------------------------------------------------

test('rule 21: one item, one record of a kind', async () => {
  const r = await run((fx) => {
    fx.byId['fixture-event-a'].wikidata = 'Q11';
    fx.byId['fixture-event-b'].wikidata = 'Q11';
  });
  const hits = rulesHit(r, 21);
  assert.equal(hits.length, 2, messages(r));
  assert.equal(hits[0].path, '/wikidata');
  assert.match(hits[0].message, /already the Wikidata item of the event/);
});

test('rule 21: two kinds may claim the same item, because they are two things', async () => {
  // A polity and the place it is named after are different records and the
  // atlas does not decide that they are the same thing.
  const r = await run((fx) => {
    fx.byId['fixture-actor-one'].wikidata = 'Q11';
    fx.byId['fixture-place-a'].wikidata = 'Q11';
  });
  assert.equal(rulesHit(r, 21).length, 0, messages(r));
});

test('rule 21: a Wikipedia title without an item is refused', async () => {
  const r = await run((fx) => {
    delete fx.byId['fixture-event-a'].wikidata;
    fx.byId['fixture-event-a'].wikipedia = { en: 'Fixture article A' };
  });
  const hits = rulesHit(r, 21);
  assert.equal(hits.length, 1, messages(r));
  assert.equal(hits[0].path, '/wikipedia');
  assert.match(hits[0].message, /beside the Wikidata item/);
});

test('rule 21: a language key that is not a language code is refused', async () => {
  const r = await run((fx) => {
    fx.byId['fixture-event-a'].wikidata = 'Q11';
    fx.byId['fixture-event-a'].wikipedia = { 'evil.example.com': 'Fixture article A' };
  });
  assert.equal(rulesHit(r, 21)[0].path, '/wikipedia/evil.example.com');
});

test('rule 21: a kind that has no identity is caught even when the schema is bypassed', () => {
  const r = checkRules([{
    id: 'fixture-source-x', kind: 'source', status: 'active', license: 'CC-BY-SA-4.0',
    authors: [{ name: 'Fixture Author', github: null }], type: 'web', creators: ['Somebody'],
    title: 'A fixture source', url: 'https://example.org/', accessed: '2026-01-01', wikidata: 'Q11',
  }], {});
  assert.match(r.errors.find((e) => e.rule === 21).message, /only event, actor, place/);
});

test('rule 21: uniqueness is judged against the whole atlas, not only the bundle', async () => {
  const fx = await fixtures();
  fx.byId['fixture-event-a'].wikidata = 'Q11';
  const topology = buildTopology(fx.records, fx.regions);
  const newcomer = { ...clone(fx.byId['fixture-event-h']), id: 'fixture-event-new', title: 'Fixture event NEW', wikidata: 'Q11' };
  const r = checkRules([newcomer], topology);
  assert.match(r.errors.find((e) => e.rule === 21).message, /already the Wikidata item/);
});

// --- rule 22 ---------------------------------------------------------------

// The two Wikipedia records the atlas cites are written by one body of
// editors, so rule 9 refuses this pair as well. Rule 22 is asserted on its
// own terms: a single Wikipedia citation that rule 9 never sees.
test('rule 22: consensus cannot rest on Wikipedia alone', async () => {
  const r = await run((fx) => {
    for (const id of WIKIPEDIA_SOURCES) {
      fx.records.push({
        ...clone(fx.byId['fixture-source-1']), id, type: 'web', creators: ['Wikipedia contributors'],
        title: `Fixture stand-in for ${id}`, url: 'https://example.org/', accessed: '2026-09-04',
      });
    }
    const edge = fx.byId['fixture-event-a--fixture-event-b--caused'];
    edge.confidence = 'consensus';
    edge.sources = WIKIPEDIA_SOURCES.map((source) => ({ source, locator: null }));
  });
  const hits = rulesHit(r, 22);
  assert.equal(hits.length, 1, messages(r));
  assert.equal(hits[0].path, '/sources');
  assert.match(hits[0].message, /cannot rest on Wikipedia alone/);
});

test('rule 22: one other source is enough, and probable is never touched', async () => {
  const seed = (fx) => {
    for (const id of WIKIPEDIA_SOURCES) {
      fx.records.push({
        ...clone(fx.byId['fixture-source-1']), id, type: 'web', creators: ['Wikipedia contributors'],
        title: `Fixture stand-in for ${id}`, url: 'https://example.org/', accessed: '2026-09-04',
      });
    }
    return fx.byId['fixture-event-a--fixture-event-b--caused'];
  };
  let r = await run((fx) => {
    const edge = seed(fx);
    edge.confidence = 'consensus';
    edge.sources = [{ source: 'wikipedia-en', locator: null }, { source: 'fixture-source-2', locator: null }];
  });
  assert.equal(rulesHit(r, 22).length, 0, messages(r));
  r = await run((fx) => {
    const edge = seed(fx);
    edge.confidence = 'probable';
    edge.sources = [{ source: 'wikipedia-en', locator: null }];
  });
  assert.equal(rulesHit(r, 22).length, 0, messages(r));
});

// --- rule 3: the keys of the citation flags --------------------------------

test('citedSources is the distinct sources a record rests on, dissent included', async () => {
  const { byId } = await fixtures();
  const disputed = Object.values(byId).find((r) => r.kind === 'edge' && r.confidence === 'disputed');
  assert.ok(disputed, 'the fixtures have a disputed edge');
  const cited = citedSources(disputed);
  assert.deepEqual([...new Set(cited)], cited, 'no source is counted twice');
  for (const c of [...disputed.sources, ...disputed.dispute.sources]) assert.ok(cited.includes(c.source));
  assert.deepEqual(citedSources({}), []);
});

test('rule 3: a verification flag names a source the record actually cites', async () => {
  let r = await run((fx) => {
    const event = fx.byId['fixture-event-a'];
    event.review = { flags: [], citations: { [event.sources[0].source]: { verified: { by: 'A Reviewer', on: '2026-09-04' } } } };
  });
  assert.equal(r.errors.length, 0, messages(r));
  r = await run((fx) => {
    fx.byId['fixture-event-a'].review = { flags: [], citations: { 'fixture-source-4': { verified: null } } };
  });
  const hits = rulesHit(r, 3);
  assert.equal(hits.length, 1, messages(r));
  assert.equal(hits[0].path, '/review/citations/fixture-source-4');
});

test('the schema holds the shape of a verification', async () => {
  let r = await run((fx) => {
    const event = fx.byId['fixture-event-a'];
    event.review = { flags: [], citations: { [event.sources[0].source]: { verified: { by: 'A Reviewer' } } } };
  });
  assert.equal(rulesHit(r, 1).length, 1, messages(r));
  r = await run((fx) => {
    const event = fx.byId['fixture-event-a'];
    event.review = { flags: [], citations: { [event.sources[0].source]: { verified: { by: 'A Reviewer', on: 'yesterday' } } } };
  });
  assert.equal(rulesHit(r, 1).length, 1, messages(r));
  r = await run((fx) => {
    const event = fx.byId['fixture-event-a'];
    event.review = { flags: [], citations: { [event.sources[0].source]: { checked: true } } };
  });
  assert.ok(rulesHit(r, 1).length >= 1, messages(r));
});

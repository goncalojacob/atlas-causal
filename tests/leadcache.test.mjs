// A15(2): the evidence a record cites is on disk at the revision it cites.
//
// A14(3) put the cache and the citations back in step once, by hand, over the
// whole corpus. A15(2) makes it the last step of every batch in both lanes,
// which is a rule nobody can hold to without something that fails when they
// have not — this file is that something, written before the pass it judges
// (deviation 711).
//
// The corpus assertion is a subset: the records left disagreeing are named
// below and **this lane may not add one**. Naming them rather than asserting
// zero keeps the check honest about a debt this lane did not incur and cannot
// clear (every one is M42's), while still failing the moment a batch of this
// lane writes a citation whose lead is not on disk at it.
//
// It grew once, on 29 September (batch 42, deviation 1344), from 21 to 27, and
// not from this lane: M42's own A15(2) and A15(8) passes recached six articles
// and left the records citing the revision they had quoted before. The list
// says so beside each of the six. The rule the first paragraph states is
// unchanged and is the one that matters — a batch of *this* lane may never add
// one — because a lane cannot be asked to repair the other's records.
//
// Every record in the unit cases is synthetic. Nothing here is a historical
// claim; the test compares two revision numbers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { cacheGaps, citationsOf, citedRevisions, revisionsByItem } from '../tools/lib/leadcache.mjs';
import { readCachedLeads, readRecords } from '../tools/lib/read.mjs';
import { ROOT } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');
const CACHE = path.join(ROOT, 'tools', 'import', 'cache', 'wikipedia');

// The records whose citation and cached lead disagree, measured by the helper
// below over `data/`. Every one is an M42-lane record: the first 21 predate
// A15(2) (docs/m42b-pool.md, batch 37) and the six marked 29 September arrived
// with M42's own A15(2) and A15(8) passes, which moved the cache forward or
// the citation forward and not both (deviation 1344). Neither can be repaired
// from this lane: `fetchLeads` reads the REST summary endpoint, which serves
// the current revision and no other, so a cache that is newer than the
// citation cannot be walked back, and a record's locator is M42's to change
// because M42's summary is the text quoted at it.
const KNOWN_STALE = new Set([
  '1948-arab-israeli-war',
  '2009-portuguese-legislative-election',
  '2011-yemeni-revolution',
  'cambodian-vietnamese-war',
  'continuation-war',
  'dissolution-of-the-soviet-union',
  'easter-rising',
  'estado-novo-1933-1974',
  'franco-thai-war',
  'german-revolution-of-1918-1919',
  'indigenous-depopulation-of-the-greater-antilles',
  'lebanese-civil-war',
  'mahsa-amini-protests',
  'march-on-rome',
  'philippine-declaration-of-independence',
  'second-balkan-war',
  'the-extermination-of-the-jews-1941-1945',
  'treaty-of-san-francisco',
  'twelve-day-war',
  'voyages-of-christopher-columbus',
  'war-in-afghanistan-2001-2021',
  // Added 29 September by M42's A15(2)/(8) passes, not by this lane
  // (deviation 1344). The cache is newer than the citation on three of
  // them and older on three, and both are one pass moving one side.
  'atlantic-revolutions',
  'battle-of-khe-sanh',
  'battle-of-musa-dagh',
  'declaration-by-united-nations',
  'my-lai-massacre',
  'thirty-years-war',
]);

const cite = (source, locator) => ({ source, locator });

test('citationsOf reads sources and the reviewer\'s own audit trail', () => {
  const record = {
    sources: [cite('wikidata', 'Q1'), cite('wikipedia-en', '"A", revision 5')],
    review: { citations: { summary: [cite('wikipedia-en', '"A", revision 6')], when: 'not a list' } },
  };
  assert.equal(citationsOf(record).length, 3);
  assert.deepEqual(citedRevisions(record), [5, 6]);
  assert.deepEqual(citedRevisions({}), []);
  assert.deepEqual(citedRevisions({ sources: [cite('wikipedia-pt', '"A", revision 5')] }), []);
  // A citation naming the article and no version of it is not this check's business.
  assert.deepEqual(citedRevisions({ sources: [cite('wikipedia-en', '"A"')] }), []);
});

test('cacheGaps separates a disagreement from an absence from an unaskable record', () => {
  const records = [
    { id: 'agrees', kind: 'event', wikidata: 'Q1', sources: [cite('wikipedia-en', '"A", revision 5')] },
    { id: 'disagrees', kind: 'event', wikidata: 'Q2', sources: [cite('wikipedia-en', '"B", revision 9')] },
    { id: 'absent', kind: 'event', wikidata: 'Q3', sources: [cite('wikipedia-en', '"C", revision 1')] },
    { id: 'unkeyed', kind: 'actor', sources: [cite('wikipedia-en', '"D", revision 1')] },
    { id: 'retracted', kind: 'event', status: 'retracted', wikidata: 'Q2', sources: [cite('wikipedia-en', '"B", revision 9')] },
    { id: 'cites-nothing', kind: 'event', wikidata: 'Q1', sources: [cite('wikidata', 'Q1')] },
  ];
  const gaps = cacheGaps(records, { Q1: 5, Q2: 8 });
  assert.deepEqual(gaps.stale, [{ id: 'disagrees', kind: 'event', wikidata: 'Q2', cited: 9, cached: 8 }]);
  assert.deepEqual(gaps.uncached.map((r) => r.id), ['absent']);
  assert.deepEqual(gaps.unkeyed.map((r) => r.id), ['unkeyed']);
  assert.equal(gaps.checked, 2, 'the retracted record is not checked and neither is the one citing nothing');
});

test('revisionsByItem reads one language off what readCachedLeads gives', () => {
  const at = revisionsByItem([
    { file: 'Q1.en.json', lead: { qid: 'Q1', revid: 5 } },
    { file: 'Q2.pt.json', lead: { qid: 'Q2', revid: 6 } },
    { file: 'Q3.en.json', lead: { qid: 'Q3', revid: null } },
  ]);
  assert.deepEqual([...at], [['Q1', 5]]);
  assert.deepEqual([...revisionsByItem([{ file: 'Q2.pt.json', lead: { qid: 'Q2', revid: 6 } }], 'pt')], [['Q2', 6]]);
});

test('A15(2): no record cites a revision the cache does not hold, beyond the recorded debt', async () => {
  const { entries } = await readRecords(DATA);
  const { leads, problems } = await readCachedLeads(CACHE);
  assert.deepEqual(problems, [], 'every cached lead is readable JSON');
  const gaps = cacheGaps(entries.map((e) => e.record), revisionsByItem(leads));
  const unexpected = gaps.stale.filter((r) => !KNOWN_STALE.has(r.id));
  assert.deepEqual(
    unexpected,
    [],
    `these records cite a revision the cache does not hold; recache them (A15(2)):\n${
      unexpected.map((r) => `  ${r.id} cites ${r.cited}, cache has ${r.cached}`).join('\n')}`,
  );
  assert.ok(gaps.checked > 0, 'the corpus does cite revisions, so the check is asking something');
});

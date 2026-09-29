// A15(2) — the evidence a citation names is on disk at the revision it names.
//
// The 24 September review's finding 5 was that the curation fires cited
// revisions the cache did not hold; A14(3) closed 512 of them and A15(2) makes
// the check the last step of every batch, with this test in front of it (711).
//
// It is two things. The first is the arithmetic of a locator and of the
// cache's one-lead-per-article shape, on fixtures. The second is the corpus
// itself: every `wikipedia-en` citation on an active record names a revision
// `tools/import/cache/wikipedia/` holds, unless the same article is cited at
// another revision by more citations — which the cache cannot hold beside it,
// and which A14(3)'s rule settles rather than leaves to the last writer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  parseLocator, parseLocators, bestRevision, citedArticles, cachedRevisions,
  groupsByItem, cacheGaps,
} from '../tools/import/citations.mjs';
import { readFile } from 'node:fs/promises';
import { readRecords, readCachedLeads } from '../tools/lib/read.mjs';
import { ROOT } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');
const CACHE = path.join(ROOT, 'tools', 'import', 'cache', 'wikipedia');
const TITLES = path.join(ROOT, 'tools', 'import', 'cache', 'titles.json');

test('a locator gives its article and its revision, quotes in the name and all', () => {
  assert.deepEqual(parseLocator('"Thirty Years\' War", revision 1376343040'),
    { title: "Thirty Years' War", revid: 1376343040 });
  // The sentence the argument rests on follows the revision on most of them.
  assert.deepEqual(parseLocator('"Battle of Gao", revision 1370441289, lead: "between 26 and 28 June 2012"'),
    { title: 'Battle of Gao', revid: 1370441289 });
  // An article whose own name carries quotation marks: the title is greedy up
  // to the last `", revision `, so the inner pair stays in the title.
  assert.deepEqual(parseLocator('""False positives" scandal", revision 1375273347'),
    { title: '"False positives" scandal', revid: 1375273347 });
  assert.equal(parseLocator('Q720498'), null);
  assert.equal(parseLocator('"", revision 12'), null);
  assert.equal(parseLocator(null), null);
});

test('a locator may name two articles, and a quoted sentence is not a second one', () => {
  assert.deepEqual(
    parseLocators('"Battle of Corunna", revision 1370437705, § Prelude; "Battle of Vimeiro", revision 1370437710'),
    [{ title: 'Battle of Corunna', revid: 1370437705 }, { title: 'Battle of Vimeiro', revid: 1370437710 }],
  );
  // `; and "` is the other way the corpus writes it.
  assert.equal(parseLocators('"A", revision 1, § lead; and "B", revision 2').length, 2);
  // A semicolon inside the sentence a citation quotes names nothing.
  assert.deepEqual(parseLocators('"A", revision 1: "one thing; another thing"'),
    [{ title: 'A', revid: 1 }]);
  assert.deepEqual(parseLocators('Q720498'), []);
});

test('two titles of one item are one group, because Wikipedia renames articles', () => {
  const cited = new Map([
    ['Battle of Khe Sanh', new Map([[10, 1]])],
    ['Siege of Khe Sanh', new Map([[20, 1]])],
    ['Something else', new Map([[30, 1]])],
  ]);
  const titles = {
    'Battle of Khe Sanh': { qid: 'Q247253', canonical: 'Siege of Khe Sanh', redirect: true },
    'Siege of Khe Sanh': { qid: 'Q247253', canonical: 'Siege of Khe Sanh', redirect: false },
  };
  const groups = groupsByItem(cited, titles);
  assert.equal(groups.size, 2);
  const khe = groups.get('Q247253');
  assert.deepEqual([...khe.counts.entries()].sort((a, b) => a[0] - b[0]), [[10, 1], [20, 1]]);
  // Without the table the two titles are two groups, which is the fallback and
  // not the answer.
  assert.equal(groupsByItem(cited, {}).size, 3);
});

test('the revision the cache should hold is the most cited, ties to the later', () => {
  assert.equal(bestRevision(new Map([[10, 1], [20, 3]])), 20);
  assert.equal(bestRevision(new Map([[30, 3], [20, 3]])), 30);
  assert.equal(bestRevision(new Map([[30, 1], [40, 1], [20, 2]])), 20);
  assert.equal(bestRevision(new Map()), null);
  assert.equal(bestRevision(null), null);
});

test('only active records and only wikipedia-en citations are counted', () => {
  const records = [
    { id: 'a', kind: 'event', status: 'active', sources: [{ source: 'wikipedia-en', locator: '"A", revision 1' }] },
    { id: 'b', kind: 'event', status: 'retracted', sources: [{ source: 'wikipedia-en', locator: '"B", revision 2' }] },
    { id: 'c', kind: 'edge', status: 'active', sources: [{ source: 'wikidata', locator: 'Q1' }, { source: 'wikipedia-pt', locator: '"C", revision 3' }] },
    { id: 'd', kind: 'event', status: 'active', sources: [{ source: 'wikipedia-en', locator: '"A", revision 1' }] },
    { id: 'e', kind: 'event', status: 'active', sources: [{ source: 'wikipedia-en', locator: 'no revision here' }] },
  ];
  const { byTitle, malformed } = citedArticles(records);
  assert.deepEqual([...byTitle.keys()], ['A']);
  assert.equal(byTitle.get('A').get(1), 2);
  assert.deepEqual(malformed.map((m) => m.id), ['e']);
});

test('a second revision of one article is unholdable, not missing', () => {
  const records = [
    { id: 'a', kind: 'event', status: 'active', sources: [{ source: 'wikipedia-en', locator: '"A", revision 20' }] },
    { id: 'b', kind: 'edge', status: 'active', sources: [{ source: 'wikipedia-en', locator: '"A", revision 20' }] },
    { id: 'c', kind: 'edge', status: 'active', sources: [{ source: 'wikipedia-en', locator: '"A", revision 10' }] },
    { id: 'd', kind: 'event', status: 'active', sources: [{ source: 'wikipedia-en', locator: '"B", revision 7' }] },
  ];
  const leads = [{ lead: { qid: 'Q1', lang: 'en', title: 'A', revid: 20 } }];
  const gaps = cacheGaps(records, leads);
  assert.equal(gaps.references, 4);
  assert.equal(gaps.onDisk, 2);
  assert.deepEqual(gaps.missing.map((m) => [m.title, m.revid]), [['B', 7]]);
  assert.deepEqual(gaps.unholdable.map((m) => [m.title, m.revid]), [['A', 10]]);
  // Hold the other one instead and the two swap places: the rule is what
  // decides which is the fault, not which was written last.
  const other = cacheGaps(records, [{ lead: { qid: 'Q1', lang: 'en', title: 'A', revid: 10 } }]);
  assert.deepEqual(other.missing.map((m) => m.revid).sort((x, y) => x - y), [7, 20]);
});

test('a Portuguese lead is not English evidence', () => {
  const { revisions } = cachedRevisions([
    { lead: { qid: 'Q1', lang: 'pt', title: 'A', revid: 5 } },
    { lead: { qid: 'Q1', lang: 'en', title: 'A', revid: 6 } },
  ]);
  assert.deepEqual([...revisions], [6]);
});

// ─── the corpus ────────────────────────────────────────────────────────────
//
// The one that fails when a fire cites text it did not leave on disk.

test('every wikipedia-en citation on an active record is on disk at the revision it cites', async () => {
  const { entries } = await readRecords(DATA);
  const { leads } = await readCachedLeads(CACHE);
  assert.ok(entries.length > 1000, 'the records were not read');
  assert.ok(leads.length > 1000, 'the cached leads were not read');
  const titles = JSON.parse(await readFile(TITLES, 'utf8')).titles;
  const gaps = cacheGaps(entries.map((e) => ({ kind: e.kind, ...e.record })), leads, { titles });
  assert.ok(gaps.references > 1000, 'no wikipedia-en citation was read');

  assert.deepEqual(gaps.malformed, [],
    'a wikipedia-en locator that names no article and revision');

  const said = gaps.missing.map((m) => `"${m.title}" revision ${m.revid} (${m.cites} citation(s)`
    + `${m.held.length ? `, the cache holds ${m.held.join(', ')}` : ', the cache has never seen it'})`);
  assert.deepEqual(said, [],
    `${gaps.missing.length} article(s) cited at a revision the cache does not hold:\n  ${said.join('\n  ')}`);

  // Not a threshold: every reference is either on disk or one the cache cannot
  // hold beside a more-cited revision of the same article.
  assert.equal(gaps.onDisk + gaps.unholdable.reduce((n, u) => n + u.cites, 0), gaps.references);
});

test('every cited article is in the title table, and names a page that exists', async () => {
  const { entries } = await readRecords(DATA);
  const titles = JSON.parse(await readFile(TITLES, 'utf8')).titles;
  const { byTitle } = citedArticles(entries.map((e) => ({ kind: e.kind, ...e.record })));

  const unresolved = [...byTitle.keys()].filter((t) => !titles[t]);
  assert.deepEqual(unresolved, [],
    `${unresolved.length} cited article(s) the title table does not name; re-run the table`);

  // A locator naming a title Wikipedia has no page for is evidence nobody can
  // follow from what the record says, whatever is on disk under the revision.
  const nowhere = [...byTitle.keys()].filter((t) => titles[t]?.missing);
  assert.deepEqual(nowhere, [], `${nowhere.length} cited article(s) Wikipedia has no page for`);
});

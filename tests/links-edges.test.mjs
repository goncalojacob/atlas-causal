// M105 — tools/links/edges.mjs, which offers causal links between held events.
//
// No network: the fetchers are stubs and the articles are small pieces of HTML
// written here. What is tested is the reading of an article, the order of the
// funnel and the shape of the queue; the writer's own rules (the quote, the
// third event, the arrow of time) are tested with the writer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createWikipediaFetcher, fetchArticle, resolveTitles, linkTitle, paragraphs, splitSentences, sentencesOf,
  directionsFor, reaches, chooseSubjects, buildCandidates, wikidataPairs, buildQueue, explanationFor,
  usedSerials, CLAUSES, pinnedRevision, leadRevisionOf, parsePageUrl, claimsUrl, USER_AGENT,
} from '../tools/links/edges.mjs';
import { checkQueue } from '../tools/queue/queue.mjs';

const ev = (id, q, start, end, over = {}) => ({
  kind: 'event', status: 'active', id, title: id.toUpperCase().replace(/-/g, ' '), wikidata: q,
  when: { start, end }, place: null, actors: [], wikipedia: { en: id.toUpperCase() }, ...over,
});

const war = ev('war', 'Q1', 1914, 1918, { title: 'Great War', sitelinks: { count: 300 } });
const treaty = ev('treaty', 'Q2', 1919, 1919, { title: 'Peace Treaty', sitelinks: { count: 100 } });
const revolt = ev('revolt', 'Q3', 1916, 1916, { title: 'Spring Revolt', sitelinks: { count: 50 } });
const famine = ev('famine', 'Q4', 1917, 1918, { title: 'Winter Famine' });
const earlier = ev('earlier', 'Q5', 1900, 1900, { title: 'Old Quarrel' });
const nowikipedia = ev('nowp', 'Q6', 1910, 1910, { wikipedia: {} });
const events = [war, treaty, revolt, famine, earlier, nowikipedia];
const byId = new Map(events.map((r) => [r.id, r]));
const laneOf = new Map(events.map((r) => [r.id, 'europe']));
const atlas = { events, byId, laneOf, edges: [] };

const link = (title, text = title) => `<a href="/wiki/${title.replace(/ /g, '_')}" title="${title}">${text}</a>`;
const qids = new Map([['Peace Treaty', 'Q2'], ['Spring Revolt', 'Q3'], ['Winter Famine', 'Q4'], ['Old Quarrel', 'Q5'], ['Nowhere', null]]);

const page = `<div class="mw-heading mw-heading2"><h2 id="Lead">Overview</h2></div>
<p>The Great War was a long conflict in Europe.<sup class="reference"><a href="#cite_note-1">[1]</a></sup> The ${link('Spring Revolt')} in 1916 led to a general strike across the country and a change of command.</p>
<table><tr><td><p>The Peace Treaty is only in a table.</p></td></tr></table>
<h2><span id="Aftermath">Aftermath</span></h2>
<p>After the ${link('Winter Famine')}, the crowds went home and the capital was calm again for a time. The war ended with the ${link('Peace Treaty')}, which led to new borders in the east and the end of two empires.[citation needed] The war led to the ${link('Peace Treaty')} and the ${link('Winter Famine')} in the same year, as a result of the blockade.</p>
<p>Mr. Smith, born in 1880, said that the ${link('Old Quarrel')} had caused the war in the minds of many in the country. The File ${link('File:Map.png')} and ${link('Nowhere')} are not held. The ${link('Peace Treaty')} followed the war, and ended it formally on a summer day in the palace.</p>`;

test('a link title is an article, not a file, an anchor or a red link', () => {
  assert.equal(linkTitle('href="/wiki/Battle_of_Y%C3%A9" title="x"'), 'Battle of Yé');
  assert.equal(linkTitle('href="/wiki/War#Causes"'), 'War');
  assert.equal(linkTitle('href="/wiki/File:Map.png"'), null);
  assert.equal(linkTitle('href="#cite_note-1"'), null);
  assert.equal(linkTitle('href="/w/index.php?title=X&redlink=1" class="new"'), null);
});

test('paragraphs carry their heading and links, tables are cut, reference marks are gone', () => {
  const ps = paragraphs(page);
  assert.equal(ps.length, 3);
  assert.equal(ps[0].heading, 'Overview');
  assert.equal(ps[1].heading, 'Aftermath');
  assert.ok(!ps[0].text.includes('[1]'));
  assert.ok(!ps.some((p) => p.text.includes('only in a table')));
  const l = ps[0].links[0];
  assert.equal(l.title, 'Spring Revolt');
  assert.equal(ps[0].text.slice(l.start, l.end), 'Spring Revolt');
});

test('sentences split on full stops but not on abbreviations or initials', () => {
  const text = 'Mr. Smith met Dr. J. R. Jones in St. Louis. The U.S. army left. It was over!';
  const parts = splitSentences(text).map(([s, e]) => text.slice(s, e));
  assert.deepEqual(parts, ['Mr. Smith met Dr. J. R. Jones in St. Louis.', 'The U.S. army left.', 'It was over!']);
});

test('each sentence knows the titles it links', () => {
  const s = sentencesOf(page);
  const revoltSentence = s.find((x) => x.sentence.startsWith('The Spring Revolt'));
  assert.deepEqual(revoltSentence.titles, ['Spring Revolt']);
});

test('the arrow of time gives one direction, or two where the starts are alike', () => {
  const whenOf = (id) => byId.get(id).when;
  assert.deepEqual(directionsFor('revolt', 'war', whenOf), [['war', 'revolt']]);
  assert.deepEqual(directionsFor('treaty', 'war', whenOf), [['war', 'treaty']]);
  const same = ev('same', 'Q9', 1916, 1916);
  const both = directionsFor('same', 'revolt', (id) => (id === 'same' ? same.when : byId.get(id).when));
  assert.equal(both.length, 2);
});

test('reachability finds a path and respects direction', () => {
  const g = new Map([['a', ['b']], ['b', ['c']]]);
  assert.ok(reaches(g, 'a', 'c'));
  assert.ok(!reaches(g, 'c', 'a'));
});

test('subjects are the biggest by sitelinks and need an article and a Wikidata id', () => {
  assert.deepEqual(chooseSubjects(events, 2).map((r) => r.id), ['war', 'treaty']);
  assert.ok(!chooseSubjects(events, 10).some((r) => r.id === 'nowp'));
});

const article = { owner: 'war', title: 'Great War', revision: 777, html: page };

test('the funnel: linking, quote, third event, chronology, arrow, dedupe, cycle', () => {
  const { candidates, funnel, counts } = buildCandidates({ articles: [article], qidOfTitle: qids, atlas });
  // Sentences linking a held event other than the subject: Revolt, Famine (After...), Treaty (+ [citation needed]),
  // Treaty+Famine, Old Quarrel, Treaty (followed).
  assert.equal(funnel.linkingHeld, 6);
  assert.equal(counts.citationNeeded, 1);
  assert.equal(counts.quoteNotFound, 0);
  // The sentence linking two other events falls at the third-event step.
  assert.equal(funnel.quoteFound, 5);
  assert.equal(funnel.afterThirdEvent, funnel.quoteFound - 1);
  // "After the Winter Famine, the crowds ..." opens on the order of events and states no cause.
  assert.equal(counts.chronology, 1);
  // The old quarrel starts before the war: the cause runs from it, so it is kept, forwards.
  const quarrel = candidates.find((c) => c.other === 'earlier');
  assert.deepEqual([quarrel.from, quarrel.to], ['earlier', 'war']);
  assert.ok(quarrel.marker);
  const revoltCandidate = candidates.find((c) => c.other === 'revolt');
  assert.deepEqual([revoltCandidate.from, revoltCandidate.to], ['war', 'revolt']);
  assert.equal(revoltCandidate.section, 'Overview');
  assert.equal(revoltCandidate.revision, 777);
  assert.equal(revoltCandidate.article, 'Great War');
  assert.ok(candidates.every((c) => c.quote.length >= 40));
  assert.ok(!candidates.some((c) => c.quote.includes('citation needed')));
  assert.equal(funnel.afterCycle, candidates.length);
  assert.equal(funnel.withMarker + funnel.withoutMarker, candidates.length);
  assert.equal(new Set(candidates.map((c) => c.key)).size, candidates.length);
});

test('a pair an active edge of any type joins is dropped, and a longer cycle is refused', () => {
  const held = { kind: 'edge', status: 'active', from: 'revolt', to: 'war', type: 'enabled' };
  const a = buildCandidates({ articles: [article], qidOfTitle: qids, atlas: { ...atlas, edges: [held] } });
  assert.ok(!a.candidates.some((c) => c.other === 'revolt'));
  assert.equal(a.counts.pairDedupe, 1);
  // treaty -> earlier -> ... : war -> treaty is a cycle if treaty already leads to war.
  const chain = [
    { kind: 'edge', status: 'active', from: 'treaty', to: 'famine', type: 'caused' },
    { kind: 'edge', status: 'active', from: 'famine', to: 'war', type: 'caused' },
  ];
  const b = buildCandidates({ articles: [article], qidOfTitle: qids, atlas: { ...atlas, edges: chain } });
  assert.ok(!b.candidates.some((c) => c.from === 'war' && c.to === 'treaty'));
  assert.ok(b.counts.cycle >= 1);
});

test('a sentence that names a third event by its title is refused as the writer would', () => {
  const html = `<p>The Great War, which led to the ${link('Spring Revolt')} after the Peace Treaty was signed in the city.</p>`;
  const { candidates, counts } = buildCandidates({ articles: [{ ...article, html }], qidOfTitle: qids, atlas });
  assert.equal(candidates.length, 0);
  assert.equal(counts.thirdEvent, 1);
});

test('a sentence the writer would not find is counted and dropped', () => {
  // A table inside a table: `plainText` cuts only as far as the first closing tag and leaves the rest,
  // while the reader of paragraphs keeps the paragraph whole.
  const nested = `<table><tr><td><table><tr><td>x</td></tr></table><p>The Great War led to the ${link('Spring Revolt')} in the spring of 1916 across the country.</p></td></tr></table>`;
  const result = buildCandidates({ articles: [{ ...article, html: nested }], qidOfTitle: qids, atlas });
  assert.equal(result.counts.linkingHeld, result.counts.quoteNotFound + result.funnel.quoteFound);
});

test('Wikidata statements tag a pair and say which way the cause runs', () => {
  const links = new Map([
    ['Q1', [{ property: 'P1542', value: 'Q3' }, { property: 'P828', value: 'Q5' }]],
    ['Q2', [{ property: 'P1478', value: 'Q1' }, { property: 'P828', value: 'Q99' }]],
  ]);
  const tags = wikidataPairs(links, events);
  const all = [...tags.values()].flat().map((t) => `${t.property}:${t.from}>${t.to}`).sort();
  assert.deepEqual(all, ['P1478:war>treaty', 'P1542:war>revolt', 'P828:earlier>war']);
  const { candidates } = buildCandidates({ articles: [article], qidOfTitle: qids, atlas, wikidataTags: tags });
  assert.deepEqual(candidates.find((c) => c.other === 'revolt').wikidata, ['P1542']);
  assert.deepEqual(candidates.find((c) => c.other === 'earlier').wikidata, ['P828']);
});

test('an article read for another event only keeps sentences about that event', () => {
  const only = new Set(['revolt']);
  const { candidates } = buildCandidates({ articles: [{ ...article, only }], qidOfTitle: qids, atlas });
  assert.deepEqual(candidates.map((c) => c.other), ['revolt']);
});

test('the queue: one item for each subject, the template explanation, ids past the used ones', () => {
  const { candidates } = buildCandidates({ articles: [article], qidOfTitle: qids, atlas });
  const revoltC = candidates.find((c) => c.other === 'revolt');
  const quarrelC = candidates.find((c) => c.other === 'earlier');
  const judgments = {
    [revoltC.key]: { accept: true, type: 'caused' },
    [quarrelC.key]: { accept: true, type: 'enabled' },
    nothing: { accept: false },
  };
  const used = usedSerials([{ items: [{ id: '2026-11-02-europe-004' }, { id: '2026-11-02-asia-009' }] }, { entries: [{ id: '2026-11-02-europe-007' }] }]);
  const { queue, skipped } = buildQueue({ candidates, judgments, atlas, date: '2026-11-02', planned: '2026-11-02T20:00Z', used });
  assert.equal(queue.items.length, 1);
  const item = queue.items[0];
  assert.equal(item.id, '2026-11-02-europe-008');
  assert.equal(item.existing, 'war');
  assert.equal(item.edges.length, 2);
  assert.ok(item.edges.every((e) => e.confidence === 'probable'));
  assert.equal(item.edges[0].explanation, explanationFor(revoltC, { from: 'Great War', to: 'Spring Revolt', type: 'caused' }));
  assert.ok(item.edges[0].explanation.startsWith('The English Wikipedia article "Great War" (revision 777) says: "'));
  assert.ok(item.edges[0].explanation.endsWith('The edge reads that sentence as: Great War caused Spring Revolt, and nothing more.'));
  assert.equal(skipped.unjudged, candidates.length - 2);
  assert.deepEqual(checkQueue('q.json', queue, { regions: null }), []);
});

test('two accepted sentences for one pair give one edge; a tie can be turned round', () => {
  const same = ev('same', 'Q9', 1916, 1916, { title: 'Same Year' });
  const local = { ...atlas, events: [...events, same], byId: new Map([...byId, ['same', same]]), laneOf: new Map([...laneOf, ['same', 'europe']]) };
  const c = {
    key: 'k1', subject: 'revolt', other: 'same', from: 'revolt', to: 'same', tie: true,
    article: 'REVOLT', revision: 5, quote: 'x'.repeat(50),
  };
  const twin = { ...c, key: 'k2' };
  const { queue, skipped } = buildQueue({
    candidates: [c, twin], judgments: { k1: { accept: true, type: 'caused', reverse: true }, k2: { accept: true, type: 'caused' } },
    atlas: local, date: '2026-11-03', planned: '2026-11-03T08:00Z',
  });
  assert.equal(queue.items[0].edges.length, 1);
  assert.deepEqual([queue.items[0].edges[0].from, queue.items[0].edges[0].to], ['same', 'revolt']);
  assert.equal(skipped.samePair, 1);
});

test('more than 999 items for a lane and day is an error', () => {
  const c = { key: 'k', subject: 'war', other: 'revolt', from: 'war', to: 'revolt', tie: false, article: 'a', revision: 1, quote: 'x'.repeat(50) };
  assert.throws(() => buildQueue({
    candidates: [c], judgments: { k: { accept: true, type: 'caused' } }, atlas, date: '2026-11-02', planned: 'p',
    used: new Map([['2026-11-02-europe', 999]]),
  }), /999/);
});

// --- the fetchers ------------------------------------------------------------

const response = (status, body, headers = {}) => ({
  ok: status < 400, status, json: async () => body, headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});

test('Wikipedia is asked a second apart with the atlas User-Agent, and a 429 is waited out', async () => {
  const waits = [];
  const seen = [];
  let n = 0;
  const fetcher = createWikipediaFetcher({
    fetchImpl: async (url, options) => {
      seen.push(options.headers['user-agent']);
      n += 1;
      return n === 1 ? response(429, {}, { 'retry-after': '7' }) : response(200, { ok: true });
    },
    delay: async (ms) => { waits.push(ms); },
    budget: 5,
  });
  assert.deepEqual(await fetcher.get('u'), { ok: true });
  assert.ok(waits.includes(7000), 'Retry-After obeyed');
  assert.ok(seen.every((h) => h === USER_AGENT));
  await fetcher.get('v');
  assert.ok(waits.includes(1000), 'one second between requests');
});

test('the budget is a limit', async () => {
  const fetcher = createWikipediaFetcher({ fetchImpl: async () => response(200, {}), delay: async () => {}, budget: 1 });
  await fetcher.get('a');
  await assert.rejects(() => fetcher.get('b'), /budget/);
});

test('an article and a batch of titles are asked once and kept by revision', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'oc-m105-test-'));
  try {
    const urls = [];
    const fetcher = {
      get: async (url) => {
        urls.push(url);
        if (url.includes('action=parse')) return { parse: { title: 'Great War', revid: 4242, text: { '*': '<p>Hello there.</p>' }, wikitext: { '*': 'Hello' } } };
        return {
          query: {
            normalized: [{ from: 'spring revolt', to: 'Spring Revolt' }],
            redirects: [{ from: 'Old Name', to: 'Peace Treaty' }],
            pages: [{ title: 'Spring Revolt', pageprops: { wikibase_item: 'Q3' } }, { title: 'Peace Treaty', pageprops: { wikibase_item: 'Q2' } }, { title: 'Bare', missing: true }],
          },
        };
      },
    };
    const a = await fetchArticle('Great War', { fetcher, cacheDir: dir });
    assert.deepEqual([a.title, a.revision, a.html], ['Great War', 4242, '<p>Hello there.</p>']);
    await fetchArticle('Great War', { fetcher, cacheDir: dir });
    assert.equal(urls.length, 1);
    assert.ok(parsePageUrl('Great War').includes('redirects=1') && parsePageUrl('Great War').includes('prop=text%7Cwikitext%7Crevid'));
    const q = await resolveTitles(['spring revolt', 'Old Name', 'Bare'], { fetcher, cacheDir: dir });
    assert.deepEqual([...q], [['spring revolt', 'Q3'], ['Old Name', 'Q2'], ['Bare', null]]);
    await resolveTitles(['spring revolt', 'Old Name', 'Bare'], { fetcher, cacheDir: dir });
    assert.equal(urls.length, 2, 'the second batch came from the cache');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Wikidata is never asked with a maxlag above five', () => {
  assert.ok(claimsUrl(['Q1', 'Q2']).includes('maxlag=5'));
});

test('each type closes in plain English, the earlier record first', () => {
  const said = Object.fromEntries(Object.keys(CLAUSES).map((t) => [t, CLAUSES[t]('A', 'B')]));
  assert.deepEqual(said, {
    caused: 'A caused B', enabled: 'A made B possible', 'reacted-to': 'B was a response to A',
    'precondition-of': 'A was a precondition of B', inspired: 'A inspired B',
  });
});

const cites = (...revs) => ({ sources: revs.map((n) => ({ source: 'wikipedia-en', locator: `"X", revision ${n}` })) });

test('a record that cites a revision is read at that revision', () => {
  assert.equal(pinnedRevision(cites(100)), 100);
  assert.equal(pinnedRevision(cites(100, 300, 200)), 300, 'the latest of several');
  assert.equal(pinnedRevision(cites(100, 300), 100), 100, 'the cached lead\'s, when it is one of them');
  assert.equal(pinnedRevision({ sources: [{ source: 'wikidata', locator: 'Q1' }] }), null);
  assert.equal(pinnedRevision({}), null);
});

test('the cached lead says which revision it is of', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'oc-m105-test-'));
  try {
    await mkdir(path.join(dir, 'data'));
    await mkdir(path.join(dir, 'tools', 'import', 'cache', 'wikipedia'), { recursive: true });
    await writeFile(path.join(dir, 'tools', 'import', 'cache', 'wikipedia', 'Q3.en.json'), JSON.stringify({ revid: '555' }));
    assert.equal(await leadRevisionOf(revolt, path.join(dir, 'data')), 555);
    assert.equal(await leadRevisionOf(war, path.join(dir, 'data')), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('an article asked for by oldid is that revision, kept by number, and a different answer is refused', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'oc-m105-test-'));
  try {
    const urls = [];
    const answer = (revid) => async (url) => {
      urls.push(url);
      return { parse: { title: 'Great War', revid, text: { '*': '<p>Old text.</p>' }, wikitext: { '*': 'Old' } } };
    };
    const got = await fetchArticle('Great War', { fetcher: { get: answer(900) }, cacheDir: dir, oldid: 900 });
    assert.deepEqual([got.title, got.revision, got.html], ['Great War', 900, '<p>Old text.</p>']);
    assert.ok(urls[0].includes('oldid=900') && !urls[0].includes('page='));
    const again = await fetchArticle('Great War', { fetcher: { get: answer(900) }, cacheDir: dir, oldid: 900 });
    assert.equal(again.revision, 900);
    assert.equal(urls.length, 1, 'kept by revision');
    await assert.rejects(() => fetchArticle('Great War', { fetcher: { get: answer(901) }, cacheDir: dir, oldid: 800 }), /asked for revision 800/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

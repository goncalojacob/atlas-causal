// The Wikidata import, against the recorded-shape fixtures under
// tests/fixtures/wikidata/. Nothing here touches the network: the fetch layer
// is injected, and tests/fixtures/wikidata/README.md says why the items in it
// are invented ones.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createValidator } from '../src/validate/schema.js';
import { FIELDS, applyValues, valuesFromRecord } from '../src/contribute/bundle.js';
import {
  createFetcher, HttpError, BudgetError, isRetryable, backoffMs,
  entitiesUrl, entityDataUrl, fetchEntities, isMissing,
  searchUrl, summaryUrl, sparqlUrl, articleUrl, historyUrl,
  readEntity, parseTime, claimPoint, countLanguageEditions, articleTitles,
  classify, intervalFor, endUnstated, END_UNSTATED_FLAG, slug, foldName, idFor, titleFor, NOT_ENGLISH_FLAG, namesFor, identityOf,
  mergeIdentity, ENRICHABLE, matchesFor, nameMatches, datesMatch, laneFor, laneNote,
  seededLane, SEEDED_LANE,
  placeRecord, actorRecord, eventRecord, leadRecord, importedSummary,
  nextBatch, advance, emptyState, itemIndex, candidatesMarkdown, ambiguousMarkdown, reportLines, appendReport,
  runImportMode, runReconcileMode, runCandidatesMode, otherNames, mergeNames,
  IMPORT_AUTHOR, IMPORTED_FLAG, USER_AGENT, SOURCE_ID, MAXLAG, BATCH,
} from '../tools/import/wikidata.mjs';
import { schemas, ROOT } from './helpers.mjs';
import { isDraft } from '../src/origin.js';
import { PRECISIONS } from '../src/vocab.js';

const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'wikidata');
const load = async (name) => JSON.parse(await readFile(path.join(FIXTURES, name), 'utf8'));

// The classes table the fixtures are read through: the editorial decision
// that in a real run lives in data/imports/wikidata-seeds.json.
const CLASSES = {
  Q9100001: { kind: 'event' },
  Q9100002: { kind: 'actor', actorType: 'person' },
  Q9100003: { kind: 'place' },
  Q9100004: { kind: 'actor', actorType: 'polity' },
};

// One lane, a square around (0,0)–(20,20), so "inside" and "too far" are
// things a test can state rather than depend on the real coastlines for.
const deriveRegion = (where) => {
  if (!where) return null;
  const inside = where.lon >= 0 && where.lon <= 20 && where.lat >= 0 && where.lat <= 20;
  return inside ? { region: 'testland', method: 'inside', distance: 0 } : null;
};

async function entities() {
  return (await load('entities.json')).entities;
}

async function read(qid) {
  return readEntity((await entities())[qid]);
}

// A fetcher over the fixtures: it answers by looking at the URL, the way the
// real one answers by making the request.
async function fixtureFetcher(options = {}) {
  const all = await entities();
  const search = await load('search.json');
  const summary = await load('summary-en.json');
  const sparql = await load('sparql.json');
  const asked = [];
  const fetchJson = async (url, init) => {
    asked.push({ url, init });
    if (options.before) {
      const forced = options.before(url, asked.length);
      if (forced) throw forced;
    }
    if (url.includes('wbgetentities')) {
      const ids = new URL(url).searchParams.get('ids').split('|');
      return { entities: Object.fromEntries(ids.map((id) => [id, all[id] ?? { id, missing: '' }])) };
    }
    if (url.includes('wbsearchentities')) return search;
    if (url.includes('/api/rest_v1/page/summary/')) return summary;
    if (url.includes('sparql')) return sparql;
    throw new HttpError(404, url);
  };
  return { asked, fetcher: createFetcher({ fetchJson, delay: async () => {}, ...options.fetcher }) };
}

// --- the fetch layer -------------------------------------------------------

test('every request says who it is, asks for both languages and sends maxlag', async () => {
  const { asked, fetcher } = await fixtureFetcher();
  await fetcher.get(entitiesUrl(['Q9000001']));
  assert.equal(asked[0].init.headers['user-agent'], USER_AGENT);
  const params = new URL(asked[0].url).searchParams;
  assert.equal(params.get('maxlag'), String(MAXLAG));
  assert.equal(params.get('languages'), 'en|pt');
  assert.equal(params.get('formatversion'), '2');
  assert.match(searchUrl('x'), /wbsearchentities/);
  assert.equal(summaryUrl('pt', 'Um artigo'), 'https://pt.wikipedia.org/api/rest_v1/page/summary/Um_artigo');
  assert.equal(articleUrl('en', 'A/B'), 'https://en.wikipedia.org/wiki/A%2FB');
  assert.match(historyUrl('en', 'A B'), /title=A_B&action=history/);
  assert.match(sparqlUrl('SELECT'), /query=SELECT&format=json/);
});

test('requests are serial, delayed, and counted against a budget', async () => {
  const delays = [];
  const { fetcher } = await fixtureFetcher({
    fetcher: { budget: 2, delay: async (ms) => { delays.push(ms); }, delayMs: 1000 },
  });
  await fetcher.get(entitiesUrl(['Q9000001']));
  await fetcher.get(entitiesUrl(['Q9000002']));
  assert.deepEqual(delays, [1000], 'the first call waits for nothing; every one after it waits');
  assert.equal(fetcher.calls, 2);
  assert.equal(fetcher.spent, true);
  await assert.rejects(() => fetcher.get(entitiesUrl(['Q9000003'])), BudgetError);
});

test('429, 503 and a maxlag body are retried with backoff; a 404 is not', async () => {
  assert.equal(isRetryable(new HttpError(429, 'x')), true);
  assert.equal(isRetryable(new HttpError(503, 'x')), true);
  assert.equal(isRetryable(new HttpError(404, 'x')), false);
  assert.equal(isRetryable(new BudgetError(1)), false);
  assert.deepEqual([0, 1, 2].map((n) => backoffMs(n, 100)), [100, 200, 400]);

  let calls = 0;
  const { fetcher } = await fixtureFetcher({
    before: (url, n) => { calls = n; return n <= 2 ? new HttpError(503, url) : null; },
  });
  const body = await fetcher.get(entitiesUrl(['Q9000001']));
  assert.equal(calls, 3, 'two refusals, then the answer');
  assert.ok(body.entities.Q9000001);

  // A body that says maxlag is a refusal with a 200 on it.
  const lagging = createFetcher({
    fetchJson: async () => ({ error: { code: 'maxlag', info: 'Waiting for a replica' } }),
    delay: async () => {},
    retries: 1,
  });
  await assert.rejects(() => lagging.get('x'), /Waiting for a replica/);

  const gone = createFetcher({ fetchJson: async (url) => { throw new HttpError(404, url); }, delay: async () => {} });
  await assert.rejects(() => gone.get('x'), /404/);
  assert.equal(gone.calls, 1, 'a 404 is not retried');
});

test('a batch the rate limiter refuses is asked again one item at a time', async () => {
  // `wbgetentities` is the one endpoint this sandbox is blocked on, and the
  // block does not lift for a run (deviation 1013, and again on 22 September).
  // Special:EntityData answers the same entity JSON one item at a time, so a
  // refused batch costs one call per item rather than ending the run.
  assert.equal(entityDataUrl('Q9000001'), 'https://www.wikidata.org/wiki/Special:EntityData/Q9000001.json');

  const asked = [];
  const all = JSON.parse(await readFile(path.join(FIXTURES, 'entities.json'), 'utf8'));
  const fetcher = createFetcher({
    delay: async () => {},
    retries: 0,
    fetchJson: async (url) => {
      asked.push(url);
      if (url.includes('wbgetentities')) throw new HttpError(429, url);
      const qid = /Special:EntityData\/(Q\d+)\.json$/.exec(url)?.[1];
      if (!qid) throw new HttpError(404, url);
      if (!all[qid]) throw new HttpError(404, url);
      return { entities: { [qid]: all[qid] } };
    },
  });

  const entities = await fetchEntities(fetcher, ['Q9000001', 'Q9000002']);
  assert.equal(asked.length, 3, 'the refused batch, then one call per item');
  assert.ok(asked[0].includes('wbgetentities'));
  assert.equal(entities.Q9000001?.id, 'Q9000001');
  assert.equal(entities.Q9000002?.id, 'Q9000002');

  // An item Special:EntityData does not have answers 404, which is the same
  // "no such item" that wbgetentities says with `missing`.
  const missing = await fetchEntities(fetcher, ['Q9999999']);
  assert.equal(isMissing(missing.Q9999999), true);
});

test('a batch the action API refuses for replication lag is asked again the same way', async () => {
  // `maxlag` is a refusal of the action API and of nothing else: the API
  // answers it with HTTP 200 and an error in the body, and it can stand for
  // hours. Special:EntityData takes no `maxlag` and keeps answering through
  // it, so the lag costs one call per item rather than the run.
  const asked = [];
  const all = JSON.parse(await readFile(path.join(FIXTURES, 'entities.json'), 'utf8'));
  const fetcher = createFetcher({
    delay: async () => {},
    retries: 1,
    fetchJson: async (url) => {
      asked.push(url);
      if (url.includes('wbgetentities')) {
        return { error: { code: 'maxlag', info: 'Waiting for wdqs1014: 94.75 seconds lagged.' } };
      }
      const qid = /Special:EntityData\/(Q\d+)\.json$/.exec(url)?.[1];
      if (!qid || !all[qid]) throw new HttpError(404, url);
      return { entities: { [qid]: all[qid] } };
    },
  });

  const entities = await fetchEntities(fetcher, ['Q9000001', 'Q9000002']);
  // The batch is retried once for the lag — it does lift — and only then
  // carried to the other endpoint, so nothing here shortens the backoff.
  assert.equal(asked.filter((u) => u.includes('wbgetentities')).length, 2);
  assert.equal(entities.Q9000001?.id, 'Q9000001');
  assert.equal(entities.Q9000002?.id, 'Q9000002');
});

// --- reading an item -------------------------------------------------------

test('an item is read down to the fields the import uses and no others', async () => {
  const item = await read('Q9000001');
  assert.equal(item.qid, 'Q9000001');
  assert.deepEqual(item.labels, { en: 'Northfield Rising', pt: 'Levantamento de Northfield' });
  assert.deepEqual(item.aliases.en, ['Rising of Northfield']);
  assert.deepEqual(item.classes, ['Q9100001']);
  assert.deepEqual(item.times.pointInTime, [{ year: 1974, date: '1974-04-25' }]);
  assert.deepEqual(item.location, ['Q9000003']);
  assert.deepEqual(item.participants, ['Q9000002']);
  assert.deepEqual(item.titles, { en: 'Northfield Rising', pt: 'Levantamento de Northfield' });
  // Three language editions; Commons is not one of them.
  assert.equal(item.sitelinks, 3);
});

test('a date is read at its own precision and a coarse one is dropped', () => {
  assert.deepEqual(parseTime({ time: '+1974-04-25T00:00:00Z', precision: 11 }), { year: 1974, date: '1974-04-25' });
  assert.deepEqual(parseTime({ time: '+1974-04-00T00:00:00Z', precision: 10 }), { year: 1974, date: '1974-04' });
  assert.deepEqual(parseTime({ time: '+1974-00-00T00:00:00Z', precision: 9 }), { year: 1974, date: null });
  assert.deepEqual(parseTime({ time: '-0044-03-15T00:00:00Z', precision: 11 }), { year: -44, date: '-0044-03-15' });
  // A century is not a year and the atlas has no interval for it.
  assert.equal(parseTime({ time: '+1900-00-00T00:00:00Z', precision: 7 }), null);
  assert.equal(parseTime({ time: '+0000-00-00T00:00:00Z', precision: 9 }), null, 'there is no year zero');
  assert.equal(parseTime(undefined), null);
});

test('a coordinate and a sitelink count are read, or honestly absent', async () => {
  const all = await entities();
  assert.deepEqual(claimPoint(all.Q9000003), { lon: 10, lat: 10 });
  assert.equal(claimPoint(all.Q9000004), null);
  assert.equal(countLanguageEditions(all.Q9000002), 1);
  assert.equal(countLanguageEditions(all.Q9000004), 0);
  assert.deepEqual(articleTitles(all.Q9000002), { en: 'Ada Northfield' });
});

// --- what an item is -------------------------------------------------------

test('an item is classified only by what the seeds file says', async () => {
  // An event class with no `category` column classifies to no category, which
  // is what makes the import write none (amendment A17).
  assert.deepEqual(classify(await read('Q9000001'), CLASSES), { kind: 'event', actorType: null, category: null, via: ['Q9100001'] });
  assert.equal(classify(await read('Q9000001'), { Q9100001: { kind: 'event', category: 'revolution' } }).category, 'revolution');
  // Two event classes that name two categories: the item is still an event
  // and a person decides what kind of one.
  assert.equal(classify({ classes: ['Q9100001', 'Q9100006'] }, {
    Q9100001: { kind: 'event', category: 'revolution' },
    Q9100006: { kind: 'event', category: 'war' },
  }).category, null);
  assert.deepEqual(classify(await read('Q9000002'), CLASSES), { kind: 'actor', actorType: 'person', via: ['Q9100002'] });
  assert.equal(classify(await read('Q9000003'), CLASSES).kind, 'place');

  // A class nobody has decided about: refused, and the reason names the file.
  const unknown = classify(await read('Q9000004'), CLASSES);
  assert.equal(unknown.kind, null);
  assert.match(unknown.reason, /Q9100009.*wikidata-seeds\.json/s);
  // An empty table refuses everything, which is the state the file ships in.
  assert.equal(classify(await read('Q9000001'), {}).kind, null);
  // Classes that disagree are a person's problem, not a coin toss.
  const conflicted = classify({ classes: ['Q9100001', 'Q9100003'] }, CLASSES);
  assert.equal(conflicted.kind, null);
  assert.match(conflicted.reason, /disagree/);
  // An actor class with no actorType creates nothing.
  assert.equal(classify({ classes: ['Q9100005'] }, { Q9100005: { kind: 'actor' } }).kind, null);
});

test('an interval comes from the properties that belong to the kind', async () => {
  assert.deepEqual(intervalFor('event', (await read('Q9000001')).times), { start: 1974, end: 1974, date: '1974-04-25' });
  // An actor is years alone, even when Wikidata knows the day: the contribute
  // form has no exact date for an actor, so a record carrying one stops
  // surviving its own save (bundle.test.mjs, byte identical).
  assert.deepEqual(intervalFor('actor', (await read('Q9000002')).times), { start: 1900, end: 1970 });
  assert.deepEqual(intervalFor('actor', (await read('Q9000006')).times), { start: 1822, end: null });
  // No usable date at all is a refusal, never a made-up year.
  assert.equal(intervalFor('event', (await read('Q9000007')).times), null);
});

// Deviation 1015: Q49101, the Suez Crisis, carries P580 29 October 1956, P582
// 7 November 1956 and a stray P585 of March 1957, and the old preference for
// the point in time imported `start: 1957, end: 1956` — an interval that runs
// backwards, which only rule 15 caught. A12 (3) is the fix: where an item
// states a span, the span is the interval and the point in time is not read at
// either end. P585 still answers on its own, which is what dates a one-day
// event.
test('a stated span beats a point in time at both ends (A12, deviation 1015)', async () => {
  const both = (await read('Q9000012')).times;
  assert.deepEqual(intervalFor('event', both),
    { start: 1956, end: 1956, date: '1956-10-29', endDate: '1956-11-07' });
  // The old rule is what this asserts against: neither end may come from 1957.
  assert.notEqual(intervalFor('event', both).start, 1957);
  assert.notEqual(intervalFor('event', both).end, 1957);
  // An item with a point in time and no span is unchanged: it is the whole
  // interval, which is how a one-day event is dated.
  assert.deepEqual(intervalFor('event', (await read('Q9000001')).times),
    { start: 1974, end: 1974, date: '1974-04-25' });
});

// Deviation 1222: Q1421412, the Spanish Constitution of 1812, carries no P580,
// no P582 and no P585, and the import refused it twice — but it carries P577,
// a publication date, which for a constitution, a treaty text or a decree is
// the day the thing came into the world. Reading it last, behind the span and
// behind the point in time, dates a document the atlas could not hold before
// and moves no interval that was already answered.
test('a publication date dates a document nothing else dates (deviation 1222)', async () => {
  const charter = (await read('Q9000015')).times;
  assert.deepEqual(intervalFor('event', charter), { start: 1812, end: 1812 });
  // Its own end, so nothing is left unstated and no flag is owed.
  assert.equal(endUnstated('event', charter), false);
  // It is read last: an item that states a span or a point in time is untouched.
  assert.deepEqual(intervalFor('event', (await read('Q9000012')).times),
    { start: 1956, end: 1956, date: '1956-10-29', endDate: '1956-11-07' });
  assert.deepEqual(intervalFor('event', (await read('Q9000001')).times),
    { start: 1974, end: 1974, date: '1974-04-25' });
  // And an item with no date of any kind is still a refusal.
  assert.equal(intervalFor('event', (await read('Q9000007')).times), null);
});

// A12 (3), the other half: an item that states a start and no P582 says
// nothing about an end, and `end: null` in this atlas means "as far as the
// data goes" rather than "still going on". The record carries the difference
// as a flag so that a reviewer reads the article instead of trusting a null.
test('a start with no stated end is flagged rather than read as ongoing (A12)', async () => {
  const open = (await read('Q9000013')).times;
  assert.deepEqual(intervalFor('event', open), { start: 1991, end: null, date: '1991-06-25' });
  assert.equal(endUnstated('event', open), true);
  // A span with both ends states one, and so does a bare point in time.
  assert.equal(endUnstated('event', (await read('Q9000012')).times), false);
  assert.equal(endUnstated('event', (await read('Q9000001')).times), false);
  // An actor dated from its founding and still alive is not this case: an
  // open-ended polity is what `end: null` is for, and rule 19 and the
  // territories depend on it.
  assert.equal(endUnstated('actor', (await read('Q9000006')).times), false);

  const record = eventRecord(await read('Q9000013'), {
    id: 'northfield-insurgency', created: '2026-09-22',
    when: intervalFor('event', open), place: null, endUnstated: true,
  });
  assert.ok(record.review.flags.includes(END_UNSTATED_FLAG),
    'the flag is on the record, which is where a reviewer sees it');
  assert.ok(record.review.flags.includes(IMPORTED_FLAG), 'and it is beside the import flag, not instead of it');
  assert.equal(record.when.end, null);
});

// --- names, ids, identity ---------------------------------------------------

test('names and ids are derived without inventing either', async () => {
  assert.equal(slug('Revolução dos Cravos'), 'revolucao-dos-cravos');
  assert.equal(foldName(' Revolução  dos Cravos '), 'revolucao dos cravos');
  const item = await read('Q9000001');
  assert.deepEqual(namesFor(item), ['Northfield Rising', 'Levantamento de Northfield']);
  assert.equal(idFor(item, new Set()), 'northfield-rising');
  // A taken id is not quietly reused: two records would become one.
  assert.equal(idFor(item, new Set(['northfield-rising'])), 'northfield-rising-q9000001');
  // The count carries the day it was read: it is a snapshot of somebody
  // else's database, not a fact about the thing (health review A, 23b).
  assert.deepEqual(identityOf(item, '2026-09-05'), {
    wikidata: 'Q9000001',
    sitelinks: { count: 3, on: '2026-09-05' },
    wikipedia: { en: 'Northfield Rising', pt: 'Levantamento de Northfield' },
  });
  // An item with no article carries no `wikipedia` at all rather than {}.
  assert.deepEqual(identityOf(await read('Q9000004'), '2026-09-05'), { wikidata: 'Q9000004', sitelinks: { count: 0, on: '2026-09-05' } });
});

// The English name an item has may be its label or may be its article title,
// and until M46 only the label was looked at: Q60433, the refugee convention,
// was filed under a Portuguese id while the same run wrote
// `wikipedia.en: "Convention Relating to the Status of Refugees"` onto the
// record it had just made. Q9000010 is that shape and Q9000011 is the other —
// no English name of either kind, which is the nine Madeira and Azores
// elections and is not something an import may translate its way out of.
test('an English article title is a name, and is taken before the Portuguese label', async () => {
  const both = await read('Q9000001');
  assert.deepEqual(titleFor(both), { title: 'Northfield Rising', english: true });

  const sitelinkOnly = await read('Q9000010');
  assert.equal(sitelinkOnly.labels.en, null, 'the item has no English label at all');
  assert.deepEqual(titleFor(sitelinkOnly), { title: 'Invented Convention of Northfield', english: true });
  assert.equal(idFor(sitelinkOnly, new Set()), 'invented-convention-of-northfield',
    'the id comes off the same chain, which is where the Portuguese ids came from');

  const neither = await read('Q9000011');
  assert.deepEqual(titleFor(neither), { title: 'Eleição regional inventada de 1976', english: false });
  assert.equal(idFor(neither, new Set()), 'eleicao-regional-inventada-de-1976');

  // Nothing to be called at all is not English either, and the item id is
  // still what a record with no name falls back to.
  assert.deepEqual(titleFor({ qid: 'Q9000404', labels: {}, titles: {} }), { title: 'Q9000404', english: false });
  // A Portuguese article and no Portuguese label is the same case one language
  // over: a title the item carries beats the bare identifier.
  assert.deepEqual(titleFor({ qid: 'Q9000404', labels: {}, titles: { pt: 'Um artigo' } }), { title: 'Um artigo', english: false });
});

// A12 (5). A Wikidata label is the shortest name the item can be called; a
// Wikipedia article title is the name that had to tell this thing from the
// others of the same name, so it carries the disambiguator. Three records here
// were all titled "Afghan Civil War" and two "Treaty of London", and a reader
// choosing between them on a card had nothing to choose by. The article title
// is the name, and the label is only what is left when there is no article.
test('the article title is the name, disambiguator and all (A12)', async () => {
  const disambiguated = await read('Q9000014');
  assert.equal(disambiguated.labels.en, 'Northfield Civil War', 'the label drops the years');
  assert.deepEqual(titleFor(disambiguated),
    { title: 'Northfield Civil War (1989–1992)', english: true });
  // The id comes off the same chain, so two wars of one name no longer collide
  // into a name and a bare item id.
  assert.equal(idFor(disambiguated, new Set()), 'northfield-civil-war-1989-1992');
  // Where the two agree nothing moves, which is every other record here.
  assert.deepEqual(titleFor(await read('Q9000001')), { title: 'Northfield Rising', english: true });
  // A Portuguese article and an English label: the English label is still the
  // English name, and the article title of another language is not one.
  assert.deepEqual(titleFor({ qid: 'Q9000405', labels: { en: 'A name' }, titles: { pt: 'Um artigo' } }),
    { title: 'A name', english: true });
});

test('a record with no English name of any kind is imported flagged, never translated', async () => {
  const { dir, cacheDir } = await scratch({ items: ['Q9000010', 'Q9000011'] });
  const { fetcher } = await fixtureFetcher();
  const { report, failed } = await runImportMode(dir, { fetcher, today: '2026-09-15', cacheDir, deriveRegion });
  assert.deepEqual(failed, []);
  assert.deepEqual(report.refused, [], 'both are dated and both reach the lane from their own point');

  const convention = await readJson(path.join(dir, 'events', 'invented-convention-of-northfield.json'));
  assert.equal(convention.title, 'Invented Convention of Northfield');
  assert.equal(convention.wikipedia.en, 'Invented Convention of Northfield',
    'the title and the sitelink are the same string, which is the bug: it was there and unread');
  assert.deepEqual(convention.review.flags, [IMPORTED_FLAG], 'an English name is an English name, label or title');

  const election = await readJson(path.join(dir, 'events', 'eleicao-regional-inventada-de-1976.json'));
  assert.equal(election.title, 'Eleição regional inventada de 1976',
    'the Portuguese name is copied as it stands; translating it would be this run naming something');
  assert.deepEqual(election.review.flags, [IMPORTED_FLAG, NOT_ENGLISH_FLAG]);
  assert.ok(isDraft(election), 'and it is a draft, so the queue shows it with the flag on it');
});

// --- the additive rule ------------------------------------------------------

test('enrichment fills gaps, changes nothing, and signs nothing', async () => {
  const item = await read('Q9000001');
  const person = { name: 'A Person', github: null };
  const record = {
    schema: 1, id: 'x', kind: 'event', status: 'active', supersededBy: null, aliases: [],
    authors: [person], license: 'CC-BY-SA-4.0', created: '2026-01-01', revised: null,
    sources: [{ source: 's', locator: null }], title: 'X', summary: 'Somebody wrote this.',
    when: { start: 1974, end: 1974 }, place: 'p', region: null, actors: [],
  };

  const first = mergeIdentity(record, identityOf(item));
  assert.deepEqual(first.added.sort(), [...ENRICHABLE].sort());
  assert.equal(first.record.wikidata, 'Q9000001');
  assert.deepEqual(first.record.authors, [person], 'the import does not put its name on somebody\'s record');
  for (const key of ['title', 'summary', 'when', 'place', 'sources', 'actors']) {
    assert.deepEqual(first.record[key], record[key], `${key} is untouched`);
  }
  // Written where the schema lists them, so the diff is the fields alone.
  assert.deepEqual(Object.keys(first.record).slice(0, 12), [
    'schema', 'id', 'kind', 'status', 'supersededBy', 'aliases', 'authors',
    'license', 'created', 'revised', 'wikidata', 'wikipedia',
  ]);

  // A non-empty value is never modified, whatever the item says.
  const held = { ...record, wikidata: 'Q1', sitelinks: 99 };
  const second = mergeIdentity(held, identityOf(item));
  assert.equal(second.record.wikidata, 'Q1');
  assert.equal(second.record.sitelinks, 99);
  assert.deepEqual(second.added, ['wikipedia']);
  assert.deepEqual(second.kept.sort(), ['sitelinks', 'wikidata']);

  // Nothing to add is the same object back, so a caller writes no file.
  const full = mergeIdentity(first.record, identityOf(item));
  assert.deepEqual(full.added, []);
  assert.equal(full.record, first.record);
  // sitelinks: 0 is a value, not a gap.
  const zero = mergeIdentity({ ...record, sitelinks: 0 }, { sitelinks: 7 });
  assert.deepEqual(zero.added, []);
});

// --- matching ---------------------------------------------------------------

test('a match is certain only when all four tests pass and one candidate is left', async () => {
  const all = await entities();
  const reads = ['Q9000001', 'Q9000004'].map((q) => readEntity(all[q]));
  const record = { id: 'northfield-rising', kind: 'event', title: 'Northfield Rising', when: { start: 1974, end: 1974 } };

  const { certain, candidates, rejected } = matchesFor(record, reads, CLASSES);
  assert.equal(certain.qid, 'Q9000001');
  assert.equal(candidates.length, 1);
  assert.match(rejected.join('\n'), /Q9000004/);

  // Diacritics do not decide it; a different name does.
  assert.equal(nameMatches({ names: ['Levantamento de Northfield'] }, reads[0]), true);
  assert.equal(nameMatches({ names: ['Something Else'] }, reads[0]), false);
  // An alias counts, because a former name is a name.
  assert.equal(nameMatches({ names: ['Rising of Northfield'] }, reads[0]), true);
  // A year out is inside the tolerance; a decade is not.
  assert.equal(datesMatch({ when: { start: 1975 } }, reads[0], 'event'), true);
  assert.equal(datesMatch({ when: { start: 1984 } }, reads[0], 'event'), false);
  // Two survivors is ambiguity, and ambiguity is never written.
  const twins = matchesFor(record, [reads[0], { ...reads[0], qid: 'Q9000009' }], CLASSES);
  assert.equal(twins.certain, null);
  assert.equal(twins.candidates.length, 2);
  // A record of the wrong kind never matches, however well the name does.
  assert.equal(matchesFor({ ...record, kind: 'place' }, reads, CLASSES).certain, null);
});

// --- lanes ------------------------------------------------------------------

test('a lane comes from the point, then from the country, then not at all', async () => {
  const near = laneFor({ lon: 10, lat: 10 }, { deriveRegion });
  assert.deepEqual([near.region, near.how], [null, 'derived from its own point']);

  const far = { lon: -140, lat: -60 };
  assert.equal(laneFor(far, { deriveRegion }).how, null, 'no country, no lane, refused');
  const viaCountry = laneFor(far, { deriveRegion, countryPoints: [{ qid: 'Q9000006', point: { lon: 12, lat: 12 } }] });
  assert.equal(viaCountry.region, 'testland');
  // The note follows the lane: no lane, nothing to explain.
  assert.equal(laneNote(laneFor(far, { deriveRegion })), null);
  assert.match(laneNote(viaCountry), /reaches no lane polygon/);
  assert.match(laneNote(viaCountry, { placeless: true }), /points at no place record/);
  assert.match(viaCountry.how, /Q9000006/);
});

// A12 (2), the half that never reached the tool: `placeRecord()` wrote
// `precision: 'point'` for everything, so a department, a captaincy and a
// historical region — areas, which PRECISIONS calls coarse and the map draws
// wider and fainter — all arrived as points on the ground. Which precision a
// class carries is the same editorial decision as which kind it is, so it
// lives beside it in the class table rather than in a branch here.
test('a place takes its precision from the class table (A12)', async () => {
  const table = {
    Q9100003: { kind: 'place' },
    Q9100007: { kind: 'place', precision: 'region' },
  };
  assert.equal(classify({ classes: ['Q9100003'] }, table).precision, null,
    'a class that says nothing about precision says nothing');
  assert.equal(classify({ classes: ['Q9100007'] }, table).precision, 'region');
  const item = await read('Q9000003');
  const point = placeRecord(item, { id: 'northfield', created: '2026-09-04' });
  assert.equal(point.where.precision, 'point', 'and the default is the point it always was');
  const area = placeRecord(item, { id: 'northfield-region', created: '2026-09-04', precision: 'region' });
  assert.equal(area.where.precision, 'region');
  assert.ok(PRECISIONS.find((p) => p.id === 'region').coarse,
    'which is one of the two the map draws as an area');
});

// --- the records ------------------------------------------------------------

test('a created record validates, cites the item and says it is unchecked', async () => {
  const v = createValidator(await schemas());
  const item = await read('Q9000001');
  const place = placeRecord(await read('Q9000003'), { id: 'northfield', created: '2026-09-04' });
  const actor = actorRecord(await read('Q9000002'), { id: 'ada-northfield', created: '2026-09-04', actorType: 'person', when: { start: 1900, end: 1970 } });
  const event = eventRecord(item, { id: 'northfield-rising', created: '2026-09-04', when: { start: 1974, end: 1974 }, place: 'northfield' });

  for (const [name, record, schema] of [['place', place, 'v1/place.json'], ['actor', actor, 'v1/actor.json'], ['event', event, 'v1/event.json']]) {
    assert.deepEqual(v.validate(schema, record), [], `${name} record`);
    assert.deepEqual(record.authors, [IMPORT_AUTHOR]);
    // `status: draft` and not the flag alone: `isDraft` reads the status, so
    // a record with only a flag was in no queue at all (R10).
    assert.deepEqual(record.review, { status: 'draft', flags: [IMPORTED_FLAG] });
    assert.ok(isDraft(record), `${name} record is in the review queue`);
    // Everything rule 6 asks to cite, cites the item it was read from. A place
    // is not on that list — it is a geographic fact rather than an argument —
    // and the place form has no citation field, so an imported place cites
    // nothing and keeps its provenance in `wikidata` like every other record.
    const cited = name === 'place' ? [] : [{ source: SOURCE_ID, locator: record.wikidata }];
    assert.deepEqual(record.sources, cited);
  }
  assert.deepEqual(event.actors, [], 'who took part is not what they did, and the import does not write roles');
  assert.equal(place.where.label, 'Northfield');
  // The summary quotes the item and disclaims itself; it is not an account.
  assert.match(importedSummary(item), /Wikidata item Q9000001/);
  assert.match(importedSummary(item), /an invented uprising/);
  assert.match(importedSummary(item), /still to be written/);
  assert.match(importedSummary(await read('Q9000007')), /no description in English or Portuguese/);

  const lead = leadRecord({ qid: 'Q9000001', lang: 'en', title: 'Northfield Rising', revid: 5, fetched: '2026-09-04', text: 'A sentence.' });
  assert.deepEqual(v.validate('v1/wikipedia-lead.json', lead), []);
  assert.match(lead.historyUrl, /action=history/);
});

// --- the cursor -------------------------------------------------------------

test('the cursor walks in batches and a resumed run does not redo the finished part', () => {
  const wanted = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
  const first = nextBatch(emptyState(), 'import', wanted, 2);
  assert.deepEqual(first.batch, ['Q1', 'Q2']);
  const after = advance(emptyState(), 'import', { ...first, today: '2026-09-04' });
  assert.deepEqual(after.runs.import, { updated: '2026-09-04', pending: ['Q3', 'Q4', 'Q5'], done: ['Q1', 'Q2'], refused: [] });

  const second = nextBatch(after, 'import', wanted, 2);
  assert.deepEqual(second.batch, ['Q3', 'Q4']);
  const end = advance(advance(after, 'import', { ...second, today: '2026-09-04' }), 'import', {
    ...nextBatch(advance(after, 'import', { ...second, today: '2026-09-04' }), 'import', wanted, 2), today: '2026-09-04',
  });
  assert.deepEqual(end.runs.import.pending, []);
  assert.deepEqual(nextBatch(end, 'import', wanted, 2).batch, [], 'a finished walk asks for nothing');
  // Two modes keep two places.
  assert.deepEqual(Object.keys(advance(after, 'reconcile', { batch: ['x'], pending: ['x'], done: [], today: '2026-09-04' }).runs).sort(), ['import', 'reconcile']);
  assert.equal(BATCH, 25);
});

// Deviation 1231. A refusal was written into `done` beside the completions,
// so the thing that would answer it — a class added to the table, a lane
// added to the seeds file — changed nothing, because the cursor had passed.
// A refusal is not a completion: it is carried apart and re-offered, and the
// state file says which ones they are so a person can see what keeps failing.
test('a refusal is not a completion: it is carried apart and offered again', () => {
  const wanted = ['Q1', 'Q2', 'Q3'];
  const first = nextBatch(emptyState(), 'import', wanted, 2);
  assert.deepEqual(first.batch, ['Q1', 'Q2']);
  const after = advance(emptyState(), 'import', { ...first, today: '2026-09-04', refused: ['Q2'] });
  assert.deepEqual(after.runs.import.done, ['Q1'], 'only what was settled');
  assert.deepEqual(after.runs.import.refused, ['Q2']);

  // The next run offers the refusal first: whoever edited the seeds file to
  // answer it should not have to wait for the rest of the walk.
  const second = nextBatch(after, 'import', wanted, 2);
  assert.deepEqual(second.batch, ['Q2', 'Q3']);

  // Answered, it leaves the list and joins the others.
  const end = advance(after, 'import', { ...second, today: '2026-09-05', refused: [] });
  assert.deepEqual(end.runs.import.done, ['Q1', 'Q2', 'Q3']);
  assert.deepEqual(end.runs.import.refused, []);
  assert.deepEqual(nextBatch(end, 'import', wanted, 2).batch, [], 'and then the walk is finished');

  // Refused again, it stays where it was and nothing is lost.
  const stuck = advance(after, 'import', { ...second, today: '2026-09-05', refused: ['Q2'] });
  assert.deepEqual(stuck.runs.import.done, ['Q1', 'Q3']);
  assert.deepEqual(stuck.runs.import.refused, ['Q2']);

  // A state file written before this existed has no `refused` key and still
  // walks: the absent list is an empty one.
  const old = { schema: 1, kind: 'import-state', source: 'wikidata', runs: { import: { updated: '2026-09-01', pending: ['Q3'], done: ['Q1', 'Q2'] } } };
  assert.deepEqual(nextBatch(old, 'import', wanted, 2).batch, ['Q3']);
});

// --- on disk ----------------------------------------------------------------

async function scratch(seedsOver = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-wikidata-'));
  for (const sub of ['events', 'actors', 'places', 'sources', 'imports']) await mkdir(path.join(dir, sub), { recursive: true });
  await writeFile(path.join(dir, 'imports', 'wikidata-seeds.json'), JSON.stringify({
    schema: 1, kind: 'import-seeds', source: 'wikidata',
    items: ['Q9000001', 'Q9000002', 'Q9000003', 'Q9000004', 'Q9000005', 'Q9000007', 'Q9000008'],
    queries: [], classes: CLASSES, reconcile: true, ...seedsOver,
  }, null, 2), 'utf8');
  const cacheDir = path.join(dir, 'cache');
  return { dir, cacheDir };
}

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

test('--import creates what it can, refuses the rest, and leaves a cursor', async () => {
  const { dir, cacheDir } = await scratch();
  const { fetcher } = await fixtureFetcher();
  const { report, failed } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  assert.deepEqual(failed, []);

  const created = Object.fromEntries(report.created.map((c) => [c.qid, c]));
  assert.deepEqual(Object.keys(created).sort(), ['Q9000001', 'Q9000002', 'Q9000003', 'Q9000005']);
  assert.equal(created.Q9000001.kind, 'event');
  assert.equal(created.Q9000003.kind, 'place');
  assert.match(created.Q9000005.lane, /Q9000006/, 'the far place takes the country\'s lane');

  const refused = Object.fromEntries(report.refused.map((r) => [r.qid, r.why]));
  assert.match(refused.Q9000004, /Q9100009/, 'an unclassified item is refused and the class is named');
  assert.match(refused.Q9000007, /no date/);
  assert.match(refused.Q9000008, /no such item/);
  assert.ok(report.unclassified.has('Q9100009'));

  // Places are walked before events, so the event points at the place record
  // the same batch created rather than being refused for one about to exist.
  const event = await readJson(path.join(dir, 'events', 'northfield-rising.json'));
  assert.equal(event.place, 'northfield');
  assert.equal(event.region, null, 'a placed event takes its lane from the place, at index time');
  const place = await readJson(path.join(dir, 'places', 'far-rock.json'));
  assert.equal(place.region, 'testland');
  // A lane a tool gave says so on the record: a later change to the polygons
  // moves the derived lanes and not this one, and nothing in the file said
  // which it was holding (health review A, finding 23a).
  assert.match(place.regionNote, /^Lane written by the Wikidata import \(from Q9000006, the country the item names\): its own point reaches no lane polygon\.$/);
  const northfield = await readJson(path.join(dir, 'places', 'northfield.json'));
  assert.equal(northfield.region, null, 'a lane the index can derive is not overridden');
  assert.equal(northfield.regionNote, null, 'and a derived lane needs no note');

  // The lead cache: one file per item and language, named for both.
  assert.deepEqual((await readdir(path.join(cacheDir))).sort().slice(0, 2), ['Q9000001.en.json', 'Q9000001.pt.json']);
  const lead = await readJson(path.join(cacheDir, 'Q9000001.en.json'));
  assert.equal(lead.revid, 1234567890);
  assert.equal(lead.license, 'CC-BY-SA-4.0');

  const state = await readJson(path.join(dir, 'imports', 'wikidata-state.json'));
  assert.equal(state.kind, 'import-state');
  assert.deepEqual(state.runs.import.pending, []);
  // Five settled and two carried (deviation 1231): the unclassified item and
  // the undated one each name something under data/ that a person can change,
  // so they are not "done". Q9000008 is missing from Wikidata, which no edit
  // here can answer, so it is settled with the rest.
  assert.deepEqual(state.runs.import.done.sort(),
    ['Q9000001', 'Q9000002', 'Q9000003', 'Q9000005', 'Q9000008']);
  assert.deepEqual(state.runs.import.refused.sort(), ['Q9000004', 'Q9000007']);

  // Run it again: the walk is finished, so the only thing left to ask about
  // is the pair somebody could still answer, and it is asked about again.
  const { fetcher: second } = await fixtureFetcher();
  const again = await runImportMode(dir, { fetcher: second, today: '2026-09-05', cacheDir, deriveRegion });
  assert.deepEqual(again.report.batch, ['Q9000004', 'Q9000007']);
  assert.deepEqual(again.report.created, [], 'and nothing has changed, so both are refused again');
  assert.deepEqual((await readJson(path.join(dir, 'imports', 'wikidata-state.json'))).runs.import.refused.sort(),
    ['Q9000004', 'Q9000007']);
});

// bundle.test.mjs holds this over data/, but only after a record is already
// in the tree — which, for an import, means after the Action has walked a
// batch, and a mismatch there costs a whole run rather than a test. The same
// check over what the import itself writes is the one that fails on a laptop.
// It has caught three: an actor carrying an exact date the actor form has no
// field for, a place carrying the wikidata citation that rule 6 exempts
// places from, and — when `world` was merged into `m0` — the lane note the
// form has nowhere to put, which is the one thing below it is allowed to
// lose.
test('every record --import writes survives an unedited save through the form', async () => {
  const { dir, cacheDir } = await scratch();
  const { fetcher } = await fixtureFetcher();
  await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });

  let seen = 0;
  for (const sub of ['events', 'actors', 'places']) {
    for (const name of await readdir(path.join(dir, sub))) {
      const text = await readFile(path.join(dir, sub, name), 'utf8');
      const record = JSON.parse(text);
      if (!Object.hasOwn(FIELDS, record.kind)) continue;
      const back = applyValues(record.kind, record, valuesFromRecord(record.kind, record));
      // No exemption any more. `regionNote` — why the import chose the lane it
      // chose — still has no field on the event or the place form, and it is
      // not something the import can fix by writing less, because the note is
      // the record saying who decided its lane; it is carried across untouched
      // by `KEPT_KEYS` in `src/contribute/bundle.js`, where `historicalNames`
      // already sat. The gap was named here while it bit nothing in `data/`,
      // and M44a is the import that put a record carrying one there.
      const dropped = Object.keys(record).filter((key) => !Object.hasOwn(back, key));
      assert.deepEqual(dropped, [], `${sub}/${name}: the form dropped a field the import wrote`);
      assert.equal(`${JSON.stringify(back, null, 2)}\n`, text, `${sub}/${name}`);
      seen += 1;
    }
  }
  assert.ok(seen > 0, 'the import wrote nothing to round-trip');
});

// M44-0, the answer to deviation 447: an event with no place record, no
// coordinate of its own and nothing to borrow one from is refused, and the
// only thing that can rescue it is a lane somebody wrote in the seeds file.
// Q9000009 is that case — dated, classed as an event, and over no ground.
test('a placeless event with no point takes the lane the seeds file names for it', async () => {
  const { dir, cacheDir } = await scratch({ items: ['Q9000009'] });
  const { fetcher } = await fixtureFetcher();
  const refused = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  assert.deepEqual(refused.report.created, [], 'without a lane it is still refused');
  assert.match(refused.report.refused[0].why, /no lane named for it in the seeds file/);

  // The same item, the same fixtures, one line of data different.
  const { dir: named, cacheDir: cache2 } = await scratch({ items: ['Q9000009'], lanes: { Q9000009: 'testland' } });
  const { fetcher: second } = await fixtureFetcher();
  const { report } = await runImportMode(named, { fetcher: second, today: '2026-09-04', cacheDir: cache2, deriveRegion });
  assert.deepEqual(report.refused, []);
  assert.deepEqual(report.created.map((c) => [c.qid, c.kind, c.place]), [['Q9000009', 'event', null]]);

  const event = await readJson(path.join(named, 'events', 'wide-northfield-war.json'));
  assert.equal(event.region, 'testland');
  assert.equal(event.place, null);
  // The record says a person decided this, not a coordinate: a later change
  // to the polygons moves the derived lanes and must not move this one.
  assert.equal(event.regionNote,
    'Lane written by the Wikidata import (named for this item in data/imports/wikidata-seeds.json): this event points at no place record, so the timeline has nothing else to go on.');
  assert.deepEqual(createValidator(await schemas()).validate('v1/event.json', event), []);

  // A lane for an item the table does not name changes nothing, and neither
  // does an empty entry: the table answers for one item at a time.
  assert.equal(seededLane({ Q9000009: 'testland' }, 'Q9000001'), null);
  assert.equal(seededLane({ Q9000009: '' }, 'Q9000009'), null);
  assert.equal(seededLane(undefined, 'Q9000009'), null);
  assert.deepEqual(seededLane({ Q9000009: 'testland' }, 'Q9000009'), { region: 'testland', how: SEEDED_LANE });
});

// The measurement comes first: a lane written by hand never overrides one a
// coordinate gives, so an item that can be placed is placed the same way it
// was before the table existed.
test('a lane in the seeds file does not override a lane a point reaches', async () => {
  const { dir, cacheDir } = await scratch({ items: ['Q9000001', 'Q9000003'], lanes: { Q9000001: 'elsewhere', Q9000003: 'elsewhere' } });
  const { fetcher } = await fixtureFetcher();
  await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  const event = await readJson(path.join(dir, 'events', 'northfield-rising.json'));
  assert.equal(event.place, 'northfield', 'it points at a place record, so no lane is written at all');
  assert.equal(event.region, null);
  assert.equal(event.regionNote, null);
  const place = await readJson(path.join(dir, 'places', 'northfield.json'));
  assert.equal(place.region, null, 'a place is placed by its own coordinate and the table is not read for it');
});

// Deviation 1230, as a test. A9's order is location, then administrative
// territory, then country — but the batch only ever fetched the last two, so
// `pointOf` could not answer for the town an event names by P276 and the
// first point it found was the country's. Q9000016 is that shape exactly: its
// town is at (5,5) and the state it is in is at (-140,-60), which are two
// different lanes, and the town is not in the batch. The lane a reader sees
// has to be the town's.
test('an event takes the lane of the location it names, not of the country it is in', async () => {
  // Two lanes, so "the wrong one" is a thing this test can state rather than
  // the absence of one: the square the rest of this file uses, and a far one.
  const twoLanes = (where) => {
    if (!where) return null;
    if (where.lon >= 0 && where.lon <= 20 && where.lat >= 0 && where.lat <= 20) {
      return { region: 'testland', method: 'inside', distance: 0 };
    }
    if (where.lon >= -160 && where.lon <= -120 && where.lat >= -80 && where.lat <= -40) {
      return { region: 'farland', method: 'inside', distance: 0 };
    }
    return null;
  };

  const { dir, cacheDir } = await scratch({ items: ['Q9000016'] });
  const { fetcher } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion: twoLanes });
  assert.deepEqual(report.refused, []);
  assert.deepEqual(report.created.map((c) => [c.qid, c.kind]), [['Q9000016', 'event']]);

  const event = await readJson(path.join(dir, 'events', 'southfield-skirmish.json'));
  assert.equal(event.region, 'testland', 'the town it names is in testland; the state it is in is not');
  assert.equal(event.place, null, 'the atlas holds no place record for that town, so it is still placeless');
  assert.deepEqual(createValidator(await schemas()).validate('v1/event.json', event), []);
});

// The same fault one step further out: the extra items a batch names were
// fetched with a single call capped at the batch size, so past that cap they
// were silently not there to read and every event after it fell through to
// whatever came first. A batch of one event that names two located things,
// fetched one at a time, still reaches the town.
test('the located items a batch names are all fetched, however small the batch', async () => {
  const twoLanes = (where) => (where && where.lon >= 0 && where.lon <= 20 && where.lat >= 0 && where.lat <= 20
    ? { region: 'testland', method: 'inside', distance: 0 }
    : null);
  const { dir, cacheDir } = await scratch({ items: ['Q9000016'] });
  const { fetcher } = await fixtureFetcher();
  await runImportMode(dir, { fetcher, today: '2026-09-04', batchSize: 1, cacheDir, deriveRegion: twoLanes });
  const event = await readJson(path.join(dir, 'events', 'southfield-skirmish.json'));
  assert.equal(event.region, 'testland', 'the second located item is past a batch size of one and still read');
});

test('--import stops at the batch size and the next run continues', async () => {
  const { dir, cacheDir } = await scratch();
  const { fetcher } = await fixtureFetcher();
  const first = await runImportMode(dir, { fetcher, today: '2026-09-04', batchSize: 2, cacheDir, deriveRegion });
  assert.deepEqual(first.report.batch, ['Q9000001', 'Q9000002']);
  assert.equal(first.report.remaining, 5);

  const { fetcher: next } = await fixtureFetcher();
  const second = await runImportMode(dir, { fetcher: next, today: '2026-09-04', batchSize: 2, cacheDir, deriveRegion });
  assert.deepEqual(second.report.batch, ['Q9000003', 'Q9000004']);
  const state = await readJson(path.join(dir, 'imports', 'wikidata-state.json'));
  assert.deepEqual(state.runs.import.done, ['Q9000001', 'Q9000002', 'Q9000003']);
  assert.deepEqual(state.runs.import.refused, ['Q9000004'], 'the class table has no row for it, so it is asked about again');
});

test('--import enriches a record that already carries the item, and writes nothing else', async () => {
  const { dir, cacheDir } = await scratch({ items: ['Q9000001'] });
  const person = { name: 'A Person', github: null };
  const before = {
    schema: 1, id: 'the-rising', kind: 'event', status: 'active', supersededBy: null, aliases: [],
    authors: [person], license: 'CC-BY-SA-4.0', created: '2026-01-01', revised: null,
    wikidata: 'Q9000001', sources: [{ source: 's', locator: null }],
    title: 'The Rising', summary: 'A person wrote this.', when: { start: 1974, end: 1974 },
    place: null, region: 'testland', actors: [],
  };
  await writeFile(path.join(dir, 'events', 'the-rising.json'), JSON.stringify(before, null, 2), 'utf8');

  const { fetcher } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  assert.deepEqual(report.created, [], 'the atlas already has this item; a second record would be a duplicate');
  assert.deepEqual(report.enriched, [{ id: 'the-rising', qid: 'Q9000001', added: ['wikipedia', 'sitelinks'] }]);

  const after = await readJson(path.join(dir, 'events', 'the-rising.json'));
  assert.equal(after.summary, before.summary);
  assert.equal(after.title, before.title);
  assert.deepEqual(after.authors, [person]);
  assert.deepEqual(after.sitelinks, { count: 3, on: '2026-09-04' });
  assert.deepEqual(await readdir(path.join(dir, 'events')), ['the-rising.json']);
});

// The additive rule stops at a signature. Filling an identifier in on a
// record a person has read and signed would change what they vouched for
// without their knowing, so the pass reports the record and writes nothing
// (plan decision 2; review of the health plan, finding 4).
test('--import leaves a signed record alone and says which one', async () => {
  const { dir, cacheDir } = await scratch({ items: ['Q9000001'] });
  const reviewer = { name: 'A Reviewer', github: 'reviewer' };
  const before = {
    schema: 1, id: 'the-rising', kind: 'event', status: 'active', supersededBy: null, aliases: [],
    authors: [reviewer], license: 'CC-BY-SA-4.0', created: '2026-01-01', revised: '2026-09-05',
    review: { status: 'reviewed', signedBy: [{ ...reviewer, on: '2026-09-05' }] },
    wikidata: 'Q9000001', sources: [{ source: 's', locator: null }],
    title: 'The Rising', summary: 'A person wrote this.', when: { start: 1974, end: 1974 },
    place: null, region: 'testland', actors: [],
  };
  const text = `${JSON.stringify(before, null, 2)}\n`;
  await writeFile(path.join(dir, 'events', 'the-rising.json'), text, 'utf8');

  const { fetcher } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  assert.deepEqual(report.enriched, []);
  assert.deepEqual(report.created, [], 'and no second record for an item the atlas already has');
  assert.deepEqual(report.signed, [{ id: 'the-rising', qid: 'Q9000001' }]);
  assert.equal(await readFile(path.join(dir, 'events', 'the-rising.json'), 'utf8'), text, 'byte for byte');
  assert.match(reportLines(report, 'import').join('\n'), /left alone the-rising: reviewed and signed/);
});

test('--import enriches a record whose item the class table cannot type', async () => {
  // Q9000004's class is in no table, so an item of that class can never be
  // turned into a record. It can still be an identifier somebody wrote by
  // hand, and then the record says what kind of thing it is.
  const { dir, cacheDir } = await scratch({ items: ['Q9000004'] });
  const before = {
    schema: 1, id: 'the-institute', kind: 'actor', status: 'active', supersededBy: null, aliases: [],
    authors: [{ name: 'A Person', github: null }], license: 'CC-BY-SA-4.0', created: '2026-01-01',
    revised: null, wikidata: 'Q9000004', sources: [{ source: 's', locator: null }],
    actorType: 'institution', names: ['The Institute'], summary: 'A person wrote this.',
    when: { start: 1974, end: null }, where: null,
  };
  await writeFile(path.join(dir, 'actors', 'the-institute.json'), JSON.stringify(before, null, 2), 'utf8');

  const { fetcher } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  assert.deepEqual(report.created, []);
  assert.deepEqual(report.refused, [], 'the class table is not asked about an item a record already carries');
  assert.equal(report.enriched.length, 1);
  assert.equal(report.enriched[0].id, 'the-institute');
  const after = await readJson(path.join(dir, 'actors', 'the-institute.json'));
  assert.equal(after.wikidata, 'Q9000004');
  assert.deepEqual(after.names, before.names);
});

test('--reconcile writes the certain match only, and lists the rest', async () => {
  const { dir, cacheDir } = await scratch();
  const record = {
    schema: 1, id: 'northfield-rising', kind: 'event', status: 'active', supersededBy: null, aliases: [],
    authors: [{ name: 'A Person', github: null }], license: 'CC-BY-SA-4.0', created: '2026-01-01', revised: null,
    sources: [{ source: 's', locator: null }], title: 'Northfield Rising', summary: 'A person wrote this.',
    when: { start: 1974, end: 1974 }, place: null, region: 'testland', actors: [],
  };
  const other = { ...record, id: 'unrelated', title: 'Nothing By That Name', names: undefined };
  await writeFile(path.join(dir, 'events', 'northfield-rising.json'), JSON.stringify(record, null, 2), 'utf8');
  await writeFile(path.join(dir, 'events', 'unrelated.json'), JSON.stringify(other, null, 2), 'utf8');

  const { fetcher } = await fixtureFetcher();
  const { report, failed } = await runReconcileMode(dir, { fetcher, today: '2026-09-04', cacheDir });
  assert.deepEqual(failed, []);
  assert.deepEqual(report.enriched, [{ id: 'northfield-rising', qid: 'Q9000001', added: ['wikidata', 'wikipedia', 'sitelinks'] }]);
  assert.equal(report.ambiguous.length, 1);
  assert.equal(report.ambiguous[0].id, 'unrelated');

  const written = await readJson(path.join(dir, 'events', 'northfield-rising.json'));
  assert.equal(written.wikidata, 'Q9000001');
  assert.equal(written.summary, record.summary);
  assert.equal((await readJson(path.join(dir, 'events', 'unrelated.json'))).wikidata, undefined);
});

test('--reconcile leaves the records an import wrote alone', async () => {
  const { dir, cacheDir } = await scratch();
  const imported = {
    schema: 1, id: 'northland', kind: 'actor', status: 'active', supersededBy: null, aliases: [],
    authors: [{ name: 'CShapes 2.0 import (tools/import/cshapes.mjs)', github: null }],
    license: 'CC-BY-NC-SA-4.0', created: '2026-01-01', revised: null,
    sources: [{ source: 'cshapes', locator: null }], actorType: 'polity', names: ['Northland'],
    summary: 'A territory the import wrote.', when: { start: 1974, end: 1974 }, where: null,
  };
  await writeFile(path.join(dir, 'actors', 'northland.json'), JSON.stringify(imported, null, 2), 'utf8');

  const { fetcher } = await fixtureFetcher();
  const { report } = await runReconcileMode(dir, { fetcher, today: '2026-09-04', cacheDir });
  assert.deepEqual(report.batch, [], 'decision 23: the imported polities are not matched in this pass');
  assert.equal(fetcher.calls, 0, 'and nothing is asked of Wikidata on their behalf');
});

test('what the pass would not decide is a page a person can act on', async () => {
  const { dir, cacheDir } = await scratch();
  const record = {
    schema: 1, id: 'unmatched', kind: 'event', status: 'active', supersededBy: null, aliases: [],
    authors: [{ name: 'A Person', github: null }], license: 'CC-BY-SA-4.0', created: '2026-01-01', revised: null,
    sources: [{ source: 's', locator: null }], title: 'Nothing By That Name', summary: 'A person wrote this.',
    when: { start: 1974, end: 1974 }, place: null, region: 'testland', actors: [],
  };
  await writeFile(path.join(dir, 'events', 'unmatched.json'), JSON.stringify(record, null, 2), 'utf8');

  const { fetcher } = await fixtureFetcher();
  const { report } = await runReconcileMode(dir, { fetcher, today: '2026-09-04', cacheDir });
  const row = report.ambiguous.find((a) => a.id === 'unmatched');
  assert.ok(row.considered.length > 0 && row.considered.length <= 3, 'the top three, no more');
  assert.ok(row.considered.every((c) => c.why), 'every candidate says why it was not the one');

  const page = ambiguousMarkdown(report.ambiguous, { generated: '2026-09-04' });
  assert.match(page, /^## unmatched$/m);
  assert.match(page, /- \[`Q9000001`\]\(https:\/\/www\.wikidata\.org\/wiki\/Q9000001\)/);
  assert.match(page, /1974/, 'the dates are on the page, so a person need not open the item');

  // Written once per batch: the second batch keeps the first batch's sections.
  const merged = ambiguousMarkdown([{ id: 'later', kind: 'place', term: 'Elsewhere', why: 'nothing on Wikidata is called "Elsewhere"' }], { generated: '2026-09-04', previous: page });
  assert.match(merged, /^## unmatched$/m);
  assert.match(merged, /^## later$/m);
  assert.equal(merged.match(/^## /gm).length, 2, 'one section per record, however many runs wrote it');
});

test('--reconcile refuses to run when the seeds file has not allowed it', async () => {
  const { dir, cacheDir } = await scratch({ reconcile: false });
  const { fetcher } = await fixtureFetcher();
  const { failed } = await runReconcileMode(dir, { fetcher, today: '2026-09-04', cacheDir });
  assert.match(failed.join(''), /reconcile: false/);
});

test('--candidates writes a list and touches nothing under data/', async () => {
  const { dir } = await scratch({
    queries: [{ name: 'northfield', period: '1970s', sparql: 'SELECT ?item WHERE { }' }],
    items: [],
  });
  const beforeEvents = await readdir(path.join(dir, 'events'));
  const { fetcher } = await fixtureFetcher();
  const { report } = await runCandidatesMode(dir, { fetcher, today: '2026-09-04' });
  assert.deepEqual(report.rows.map((r) => r.qid), ['Q9000001', 'Q9000007']);
  assert.deepEqual(await readdir(path.join(dir, 'events')), beforeEvents);
  assert.equal(await readdir(path.join(dir, 'imports')).then((f) => f.includes('wikidata-state.json')), false);

  // Cada coluna que o dono precisa de ver está na linha, e não no item.
  const [first, second] = report.rows;
  assert.deepEqual(
    { period: first.period, label: first.label, labelPt: first.labelPt, date: first.date, type: first.type, sitelinks: first.sitelinks },
    { period: '1970s', label: 'Northfield Rising', labelPt: 'Levantamento de Northfield', date: '1974-04-25', type: 'invented uprising', sitelinks: 12 },
  );
  assert.deepEqual([second.labelPt, second.date, second.type, second.sitelinks], [null, null, null, null]);

  const page = candidatesMarkdown(report.rows, { generated: '2026-09-04' });
  assert.match(page, /^## 1970s — 2 candidate\(s\), 0 already in the atlas$/m);
  assert.match(page, /^### northfield — 2$/m);
  assert.match(page, /^\| keep \| item \| label \(en\) \| label \(pt\) \| date \| type \| sitelinks \| in the atlas \|$/m);
  assert.match(page, /\| \[ \] \| \[`Q9000001`\]\(https:\/\/www\.wikidata\.org\/wiki\/Q9000001\) \| Northfield Rising \| Levantamento de Northfield \| 1974-04-25 \| invented uprising \| 12 \| — \|/);
  assert.match(page, /Undated Assembly \\\| Second Session/, 'a bar in a label does not become a column');
  assert.match(page, /Put an `x` between/);
});

test('the candidate list is grouped by period, counted, and lists an item once', async () => {
  const { dir } = await scratch({
    queries: [
      { name: 'coups', period: '1970s', sparql: 'SELECT ?item WHERE { }' },
      { name: 'battles', period: '1970s', sparql: 'SELECT ?item WHERE { }' },
    ],
    items: [],
  });
  const { fetcher } = await fixtureFetcher();
  const { report } = await runCandidatesMode(dir, { fetcher, today: '2026-09-04' });
  assert.deepEqual(report.rows.map((r) => `${r.query}:${r.qid}`), ['coups:Q9000001', 'coups:Q9000007'],
    'the second query returns the same items and adds nothing');

  const page = candidatesMarkdown([
    { query: 'coups', period: '1970s', qid: 'Q1', label: 'A', known: true },
    { query: 'coups', period: '1970s', qid: 'Q2', label: 'B', known: false },
    { query: 'elections', period: '1980s', qid: 'Q3', label: 'C', known: false },
    { query: 'stray', period: null, qid: 'Q4', label: 'D', known: false },
  ], { generated: '2026-09-04' });
  assert.match(page, /^## 1970s — 2 candidate\(s\), 1 already in the atlas$/m);
  assert.match(page, /^## 1980s — 1 candidate\(s\), 0 already in the atlas$/m);
  assert.match(page, /^## no period — 1 candidate\(s\), 0 already in the atlas$/m);
  assert.match(page, /4 candidate\(s\) over 3 period\(s\), of which 1 already/);
  assert.doesNotMatch(page, /did not answer/, 'a run where every query answered says nothing about failures');
  assert.match(page, /\| \[`Q1`\]\(https:\/\/www\.wikidata\.org\/wiki\/Q1\) \| A \| — \| — \| — \| — \| yes \|/,
    'a record the atlas already has says so');
});

test('a query the service refuses is named on the page, not silently missing', async () => {
  const { dir } = await scratch({
    queries: [
      { name: 'answers', period: '1970s', sparql: 'SELECT ?item WHERE { }' },
      { name: 'times-out', period: '1970s', sparql: 'SELECT ?item WHERE { }' },
    ],
    items: [],
  });
  const { fetcher } = await fixtureFetcher({ before: (url, n) => (n === 2 ? new HttpError(500, url) : null), fetcher: { retries: 1 } });
  const { report } = await runCandidatesMode(dir, { fetcher, today: '2026-09-04' });
  assert.deepEqual(report.refused.map((r) => r.qid), ['times-out']);

  const page = candidatesMarkdown(report.rows, { generated: '2026-09-04', refused: report.refused });
  assert.match(page, /^## Queries the service did not answer$/m);
  assert.match(page, /^- `times-out`: 500$/m, 'the query is named and the URL is not repeated');
  assert.match(page, /that period's count is\s+short by that much/);
});

test('the report says what happened, including what it would not decide', async () => {
  const { dir, cacheDir } = await scratch();
  const { fetcher } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  const text = reportLines(report, 'import').join('\n');
  assert.match(text, /^import: 7 item\(s\) this batch, 0 left after it, \d+ call\(s\) spent$/m);
  assert.match(text, /created event northfield-rising from Q9000001/);
  assert.match(text, /refused Q9000004/);
  assert.match(text, /unclassified class Q9100009/);
  assert.match(text, /4 created, 0 enriched, 0 named, 0 left alone, 3 refused, 0 ambiguous/);
});

test('itemIndex finds the records that already carry an item, per kind', () => {
  const entries = [
    { record: { id: 'a', kind: 'event', wikidata: 'Q1' } },
    { record: { id: 'b', kind: 'place', wikidata: 'Q1' } },
    { record: { id: 'c', kind: 'event' } },
  ];
  const index = itemIndex(entries);
  assert.equal(index.get('event:Q1'), 'a');
  assert.equal(index.get('place:Q1'), 'b');
  assert.equal(index.size, 2);
});

test('the report can be appended to a file, batch after batch', async () => {
  // One process per batch, so the file a person reads is the concatenation of
  // them all — and it exists because the run that pushed the branch cannot
  // read the Action's log.
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-report-'));
  const file = path.join(dir, 'nested', 'import-report.md');
  await appendReport(file, ['import: batch 1', 'created event a from Q1']);
  await appendReport(file, ['import: batch 2', 'refused Q2: because']);
  assert.deepEqual((await readFile(file, 'utf8')).trim().split('\n'), [
    'import: batch 1', 'created event a from Q1', 'import: batch 2', 'refused Q2: because',
  ]);
});

// --- the other names, onto a record the import did not create --------------
//
// I8, owner question 3: "carnation" found nothing because no event carried
// `names` — H7 taught the search shard to fold them and left the field empty
// on all 421 events (docs/index2-plan.md, D12). `names` is a claim about what
// a thing is called rather than an identifier, so the owner allowed it under
// three conditions and no more: absent only, `draft` only, and flagged.

const DRAFT = {
  schema: 1, id: 'the-rising', kind: 'event', status: 'active', supersededBy: null, aliases: [],
  authors: [{ name: 'A Person', github: null }], license: 'CC-BY-SA-4.0', created: '2026-01-01', revised: null,
  review: { status: 'draft', flags: ['date'] },
  wikidata: 'Q9000001', sources: [{ source: 's', locator: null }],
  title: 'The Rising', summary: 'A person wrote this.', when: { start: 1974, end: 1974 },
  place: null, region: 'testland', actors: [],
};

async function afterImport(record) {
  const { dir, cacheDir } = await scratch({ items: ['Q9000001'] });
  await writeFile(path.join(dir, 'events', 'the-rising.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  const { fetcher } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  return { report, after: await readJson(path.join(dir, 'events', 'the-rising.json')) };
}

test('the item\'s labels and aliases become an event\'s other names, flagged', async () => {
  const { report, after } = await afterImport(DRAFT);
  // Labels *and* aliases, one language at a time in the order LANGUAGES names
  // them — the label of a language before its own aliases — and the alias is
  // the point: it is the name a reader types for a record filed under
  // something else.
  assert.deepEqual(after.names, ['Northfield Rising', 'Rising of Northfield', 'Levantamento de Northfield']);
  assert.deepEqual(report.named, [{ id: 'the-rising', qid: 'Q9000001', names: after.names }]);
  assert.match(reportLines(report, 'import').join('\n'), /named the-rising from Q9000001: Northfield Rising, /);

  // Where the schema lists it: after the title, before the summary, so the
  // diff is the field and not a reshuffle.
  const keys = Object.keys(after);
  assert.equal(keys[keys.indexOf('title') + 1], 'names');
  assert.equal(keys[keys.indexOf('names') + 1], 'summary');

  // The reviewer is told where they came from and can take them off.
  assert.deepEqual(after.review.flags, ['date', 'imported-names']);
  assert.equal(after.review.status, 'draft');

  // And nothing else moved: not the title, not the text, not the dates, not
  // the sources, and nobody was added to `authors` for having done it.
  for (const key of ['title', 'summary', 'when', 'place', 'region', 'actors', 'sources', 'authors', 'created', 'license', 'id']) {
    assert.deepEqual(after[key], DRAFT[key], key);
  }
});

test('an event that already says what it is called keeps every name it has', async () => {
  const mine = { ...DRAFT, names: ['What we call it'] };
  const { report, after } = await afterImport(mine);
  assert.deepEqual(after.names, ['What we call it'], 'never added to, never reordered');
  assert.deepEqual(report.named, []);
  assert.deepEqual(after.review.flags, ['date'], 'and no flag about names it did not write');
});

test('nothing is written onto a record nobody has claimed either way', async () => {
  // No `review.status` at all: the record is in no queue, so a name written
  // onto it is a name nobody would be shown and asked about.
  const { review, ...unclaimed } = DRAFT;
  const { report, after } = await afterImport(unclaimed);
  assert.equal(Object.hasOwn(after, 'names'), false);
  assert.deepEqual(report.named, []);
  assert.equal(Object.hasOwn(after, 'review'), false);
  assert.ok(review.status === 'draft');
});

test('nothing is written onto a record somebody has signed', async () => {
  const reviewer = { name: 'A Reviewer', github: 'reviewer' };
  const signed = { ...DRAFT, review: { status: 'reviewed', signedBy: [{ ...reviewer, on: '2026-09-05' }] } };
  const { report, after } = await afterImport(signed);
  assert.equal(Object.hasOwn(after, 'names'), false);
  assert.deepEqual(report.named, []);
  assert.deepEqual(report.signed, [{ id: 'the-rising', qid: 'Q9000001' }]);
  assert.deepEqual(after.review.signedBy, signed.review.signedBy);
});

test('the same pass again writes nothing: the names are there and are not added to', async () => {
  const { dir, cacheDir } = await scratch({ items: ['Q9000001'] });
  await writeFile(path.join(dir, 'events', 'the-rising.json'), `${JSON.stringify(DRAFT, null, 2)}\n`, 'utf8');
  const { fetcher } = await fixtureFetcher();
  await runImportMode(dir, { fetcher, today: '2026-09-04', cacheDir, deriveRegion });
  const once = await readFile(path.join(dir, 'events', 'the-rising.json'), 'utf8');
  const { fetcher: again } = await fixtureFetcher();
  const { report } = await runImportMode(dir, { fetcher: again, today: '2026-09-06', cacheDir, deriveRegion });
  assert.deepEqual(report.named, []);
  assert.equal(await readFile(path.join(dir, 'events', 'the-rising.json'), 'utf8'), once, 'byte for byte');
});

test('the names are the item\'s, folded against the title and each other', () => {
  const read = {
    labels: { en: 'The Rising', pt: 'O Levantamento' },
    aliases: { en: ['the rising', 'Rising of Northfield'], pt: ['O Levantamento'] },
  };
  // The title in another case is the title, and rule 18 refuses it in the
  // list; a name repeated in two languages is one name.
  assert.deepEqual(otherNames(read, 'The Rising'), ['Rising of Northfield', 'O Levantamento']);
  // Diacritics are not a difference either, which is how src/search.js
  // compares them.
  assert.deepEqual(otherNames({ labels: { en: 'Revolucao' }, aliases: {} }, 'Revolução'), []);
  // An item with nothing to add gives an empty list, and the caller writes no
  // key: rule 18 refuses an empty one.
  assert.deepEqual(otherNames({ labels: {}, aliases: {} }, 'A title'), []);
  assert.equal(mergeNames({ review: { status: 'draft' } }, []).added, false);
});

// The other pass that writes onto a record the import did not create: the
// same rule, because it is one rule and not two (identity.mjs).
test('--reconcile writes the names onto the record it matched, under the same rule', async () => {
  const { dir, cacheDir } = await scratch({ items: [] });
  await writeFile(path.join(dir, 'events', 'the-rising.json'),
    `${JSON.stringify({ ...DRAFT, wikidata: undefined, names: undefined, title: 'Northfield Rising' }, null, 2)}\n`, 'utf8');
  const { fetcher } = await fixtureFetcher();
  const { report } = await runReconcileMode(dir, { fetcher, today: '2026-09-04', cacheDir, kinds: ['event'] });
  const after = await readJson(path.join(dir, 'events', 'the-rising.json'));
  assert.deepEqual(report.named.map((n) => n.id), ['the-rising']);
  assert.deepEqual(after.names, ['Rising of Northfield', 'Levantamento de Northfield'], 'less the title itself');
  assert.ok(after.review.flags.includes('imported-names'));
  assert.equal(after.wikidata, 'Q9000001', 'and the identifier the pass was for');
});

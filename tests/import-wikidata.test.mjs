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
  entitiesUrl, searchUrl, summaryUrl, sparqlUrl, articleUrl, historyUrl,
  readEntity, parseTime, claimPoint, countLanguageEditions, articleTitles,
  classify, intervalFor, slug, foldName, idFor, namesFor, identityOf,
  mergeIdentity, ENRICHABLE, matchesFor, nameMatches, datesMatch, laneFor, laneNote,
  placeRecord, actorRecord, eventRecord, leadRecord, importedSummary,
  nextBatch, advance, emptyState, itemIndex, candidatesMarkdown, ambiguousMarkdown, reportLines, appendReport,
  runImportMode, runReconcileMode, runCandidatesMode, otherNames, mergeNames,
  IMPORT_AUTHOR, IMPORTED_FLAG, USER_AGENT, SOURCE_ID, MAXLAG, BATCH,
} from '../tools/import/wikidata.mjs';
import { schemas, ROOT } from './helpers.mjs';
import { isDraft } from '../src/origin.js';

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
  assert.deepEqual(after.runs.import, { updated: '2026-09-04', pending: ['Q3', 'Q4', 'Q5'], done: ['Q1', 'Q2'] });

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
  assert.equal(state.runs.import.done.length, 7);

  // Run it again: the cursor says everything is done, so nothing is fetched.
  const { fetcher: second } = await fixtureFetcher();
  const again = await runImportMode(dir, { fetcher: second, today: '2026-09-05', cacheDir, deriveRegion });
  assert.deepEqual(again.report.batch, []);
  assert.equal(second.calls, 0);
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
      // One exemption, named rather than hidden: `regionNote` — why the
      // import chose the lane it chose — has no field on the event or the
      // place form, so a save drops it. That is a gap in
      // `KEPT_KEYS` in `src/contribute/bundle.js`, where `historicalNames`
      // already sits, and not something the import can fix by writing less:
      // the note is the record saying who decided its lane. It bites nothing
      // in `data/` yet, because no import has written a record there since
      // the field was added. Nothing else may be dropped, and this asserts
      // that nothing else is.
      const dropped = Object.keys(record).filter((key) => !Object.hasOwn(back, key));
      assert.deepEqual(dropped, dropped.length ? ['regionNote'] : [], `${sub}/${name}: the form dropped more than the lane note`);
      const kept = { ...record };
      delete kept.regionNote;
      const expected = dropped.length ? `${JSON.stringify(kept, null, 2)}\n` : text;
      assert.equal(`${JSON.stringify(back, null, 2)}\n`, expected, `${sub}/${name}`);
      seen += 1;
    }
  }
  assert.ok(seen > 0, 'the import wrote nothing to round-trip');
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
  assert.deepEqual(state.runs.import.done, ['Q9000001', 'Q9000002', 'Q9000003', 'Q9000004']);
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

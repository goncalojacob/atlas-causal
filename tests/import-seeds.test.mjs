// The files under data/imports/ that are not maps: the seeds an import is
// pointed at and the cursor a cut-off run leaves behind. Both are checked by
// tools/validate.mjs alone, and which schema each is held to comes from its
// own `kind` field rather than from its name.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createValidator } from '../src/validate/schema.js';
import { checkImportSeeds, seedsAreEmpty, IMPORT_SCHEMAS, runValidation } from '../tools/validate.mjs';
import { readImportMaps, readCategories, readRegions, DEFAULT_IMPORT_KIND } from '../tools/lib/read.mjs';
import { ROOT, schemas } from './helpers.mjs';

const SEEDS = 'v1/import-seeds.json';
const STATE = 'v1/import-state.json';
const LEAD = 'v1/wikipedia-lead.json';

async function validator() {
  return createValidator(await schemas());
}

const seeds = (over = {}) => ({ schema: 1, kind: 'import-seeds', source: 'wikidata', items: ['Q1'], ...over });

test('the seeds schema takes items, queries and nothing else', async () => {
  const v = await validator();
  assert.deepEqual(v.validate(SEEDS, seeds()), []);
  assert.deepEqual(v.validate(SEEDS, seeds({
    items: [],
    queries: [{ name: 'elections-1890-1899', sparql: 'SELECT ?item WHERE { }', note: 'why' }],
    reconcile: true,
  })), []);

  // A file that does not say what it is cannot be dispatched on.
  assert.equal(v.validate(SEEDS, { schema: 1, source: 'wikidata' }).length, 1);
  // Identifiers of the source, not free text: "carnation-revolution" is an id
  // of this atlas and would fetch nothing.
  assert.match(v.validate(SEEDS, seeds({ items: ['carnation-revolution'] }))[0].message, /\^Q\[1-9\]/);
  assert.match(v.validate(SEEDS, seeds({ items: ['Q0'] }))[0].message, /\^Q\[1-9\]/);
  // A query has to be named and has to say something.
  assert.equal(v.validate(SEEDS, seeds({ queries: [{ name: 'x' }] })).length, 1);
  assert.equal(v.validate(SEEDS, seeds({ queries: [{ name: 'Not A Slug', sparql: 'SELECT' }] })).length, 1);
  assert.equal(v.validate(SEEDS, seeds({ queries: [{ name: 'x', sparql: '' }] })).length, 1);
  // The list of properties is closed, so a typo is loud.
  assert.equal(v.validate(SEEDS, seeds({ item: ['Q1'] })).length, 1);
});

test('duplicates in a seeds file are caught by the checks a shape cannot make', async () => {
  assert.deepEqual(checkImportSeeds('imports/x.json', seeds()), []);
  const twice = checkImportSeeds('imports/x.json', seeds({ items: ['Q1', 'Q2', 'Q1'] }));
  assert.equal(twice.length, 1);
  assert.match(twice[0].message, /Q1 is listed twice/);
  assert.equal(twice[0].path, '/items/2');

  const named = checkImportSeeds('imports/x.json', seeds({
    queries: [{ name: 'a', sparql: 'x' }, { name: 'a', sparql: 'y' }],
  }));
  assert.equal(named.length, 1);
  assert.match(named[0].message, /names two queries/);

  // Empty is a warning's business, not an error's.
  assert.deepEqual(checkImportSeeds('imports/x.json', seeds({ items: [] })), []);
  assert.equal(seedsAreEmpty(seeds({ items: [] })), true);
  assert.equal(seedsAreEmpty(seeds()), false);
});

// The class table's `category` column (amendment A17): what a shape cannot
// say — that it belongs to an event class and that it names a category the
// atlas has.
test('a class says which category its events become, or says nothing', async () => {
  const v = await validator();
  const categories = await readCategories(path.join(ROOT, 'data'));
  const withClass = (entry) => seeds({ classes: { Q1: entry } });
  const check = (entry) => checkImportSeeds('imports/x.json', withClass(entry), { categories });

  assert.deepEqual(v.validate(SEEDS, withClass({ kind: 'event', category: 'war' })), []);
  assert.deepEqual(check({ kind: 'event', category: 'war' }), []);
  // A class with no category is the ordinary case and the import writes none.
  assert.deepEqual(check({ kind: 'event' }), []);

  const outside = check({ kind: 'event', category: 'not-a-category' });
  assert.equal(outside.length, 1);
  assert.match(outside[0].message, /is not a category in data\/categories\.json/);
  assert.equal(outside[0].path, '/classes/Q1');

  const misplaced = check({ kind: 'place', category: 'war' });
  assert.equal(misplaced.length, 1);
  assert.match(misplaced[0].message, /category means nothing on a place class/);

  // The schema holds the spelling; the file holds the list.
  assert.equal(v.validate(SEEDS, withClass({ kind: 'event', category: 'Not A Slug' })).length, 1);
  // And with no vocabulary at all, a category is not checked against one —
  // the same rule the two warnings follow (amendment A8).
  assert.deepEqual(checkImportSeeds('imports/x.json', withClass({ kind: 'event', category: 'not-a-category' })), []);
});

// The lane table (M44-0): the answer to deviation 447, where an event with no
// place and no reachable point can be given a lane by a person rather than
// refused. What a shape cannot say is that the key is an item and that the
// value is a lane this atlas actually has.
test('a lane table names items and lanes this atlas has, or is an error', async () => {
  const v = await validator();
  const regions = await readRegions(path.join(ROOT, 'data'));
  const withLanes = (lanes) => seeds({ lanes });
  const check = (lanes) => checkImportSeeds('imports/x.json', withLanes(lanes), { regions });

  assert.deepEqual(v.validate(SEEDS, withLanes({ Q8683: 'europe' })), []);
  assert.deepEqual(check({ Q8683: 'europe' }), []);
  // No table at all is the ordinary case: nothing is placed by hand.
  assert.deepEqual(check(undefined), []);
  assert.deepEqual(checkImportSeeds('imports/x.json', seeds(), { regions }), []);

  const outside = check({ Q8683: 'antarctica' });
  assert.equal(outside.length, 1);
  assert.match(outside[0].message, /is not a lane in data\/regions\.json/);
  assert.equal(outside[0].path, '/lanes/Q8683');

  const notAnItem = check({ 'cold-war': 'europe' });
  assert.equal(notAnItem.length, 1);
  assert.match(notAnItem[0].message, /is not an item of the source/);

  // The schema holds the spelling of the lane; the file holds the list.
  assert.equal(v.validate(SEEDS, withLanes({ Q8683: 'Not A Slug' })).length, 1);
  assert.equal(v.validate(SEEDS, withLanes({ Q8683: 3 })).length, 1);
  // And with no vocabulary, a lane is not checked against one — the rule the
  // class table's category already follows (amendment A8).
  assert.deepEqual(checkImportSeeds('imports/x.json', withLanes({ Q8683: 'antarctica' })), []);
});

test('the state schema holds one cursor per mode', async () => {
  const v = await validator();
  const state = { schema: 1, kind: 'import-state', source: 'wikidata', runs: {} };
  assert.deepEqual(v.validate(STATE, state), []);
  assert.deepEqual(v.validate(STATE, {
    ...state,
    runs: { import: { updated: '2026-09-04', pending: ['Q2'], done: ['Q1'] } },
  }), []);
  // A cursor that does not say when it was written cannot be judged stale.
  assert.equal(v.validate(STATE, { ...state, runs: { import: { pending: [], done: [] } } }).length, 1);
  assert.equal(v.validate(STATE, { ...state, runs: { import: { updated: 'yesterday', pending: [], done: [] } } }).length, 1);
});

test('the lead envelope keeps the text with the revision it came from', async () => {
  const v = await validator();
  const lead = {
    qid: 'Q1', lang: 'pt', title: 'Um artigo', revid: 12345, fetched: '2026-09-04',
    license: 'CC-BY-SA-4.0', url: 'https://pt.wikipedia.org/wiki/Um_artigo',
    historyUrl: 'https://pt.wikipedia.org/w/index.php?title=Um_artigo&action=history',
    text: 'Uma frase.',
  };
  assert.deepEqual(v.validate(LEAD, lead), []);
  // The licence is not negotiable and the revision is not optional.
  assert.equal(v.validate(LEAD, { ...lead, license: 'CC0-1.0' }).length, 1);
  const { revid, ...without } = lead;
  assert.equal(v.validate(LEAD, without).length, 1);
  assert.equal(v.validate(LEAD, { ...lead, historyUrl: undefined }).length, 1);
});

test('read.mjs dispatches on kind, and a file without one is still a map', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-imports-'));
  await mkdir(path.join(dir, 'imports'), { recursive: true });
  const write = (name, value) => writeFile(path.join(dir, 'imports', name), JSON.stringify(value), 'utf8');
  await write('legacy.json', { schema: 1, source: 'cshapes-2-0', entries: {} });
  await write('seeds.json', seeds());
  const { maps, problems } = await readImportMaps(dir);
  assert.deepEqual(problems, []);
  assert.deepEqual(maps.map((m) => [m.name, m.kind]), [['legacy', DEFAULT_IMPORT_KIND], ['seeds', 'import-seeds']]);
  assert.ok(Object.hasOwn(IMPORT_SCHEMAS, DEFAULT_IMPORT_KIND) && Object.hasOwn(IMPORT_SCHEMAS, 'import-seeds'));
});

test('the validator rejects a file under imports/ whose kind nothing checks', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-imports-'));
  await mkdir(path.join(dir, 'imports'), { recursive: true });
  await writeFile(path.join(dir, 'imports', 'odd.json'),
    JSON.stringify({ schema: 1, kind: 'something-else', source: 'wikidata' }), 'utf8');
  const { errors } = await runValidation(dir);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].path, '/kind');
  assert.match(errors[0].message, /is not a kind of file data\/imports\/ holds/);
});

test('an empty seeds file warns and never fails the run', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-imports-'));
  await mkdir(path.join(dir, 'imports'), { recursive: true });
  await writeFile(path.join(dir, 'imports', 'wikidata-seeds.json'),
    JSON.stringify(seeds({ items: [], queries: [] })), 'utf8');
  const { errors, warnings } = await runValidation(dir);
  assert.deepEqual(errors, []);
  assert.equal(warnings.filter((w) => /nothing to fetch/.test(w.message)).length, 1);
});

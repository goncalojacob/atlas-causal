// The one-off tool that gives an imported event the `category` its Wikidata
// class carries in the seeds file, read off the event's own title.
//
// The tests that matter are the four refusals: it never writes `other`, it
// never overwrites a category a record already carries, it never touches a
// record somebody signed, and — the one this run turns on — it never reads a
// title a person wrote, however cleanly the table would match it (amendment
// A5). Everything here works on a scratch copy of the fixture dataset, which
// carries neither an imports directory nor a `data/categories.json`, so the
// tool's fallbacks are exercised rather than assumed.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  IMPORT_TOOL, NEVER_WRITTEN, buildTable, categoryFor, classify, labelPattern, withCategory,
} from '../tools/migrate/categories.mjs';
import { checkRules } from '../src/validate/rules.js';
import { buildTopology } from '../src/validate/core.js';
import { readCategories, readRecords, readRegions } from '../tools/lib/read.mjs';
import { createRegionDeriver } from '../src/util/geo.js';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

const run = promisify(execFile);
const TOOL = path.join(ROOT, 'tools', 'migrate', 'categories.mjs');
const TODAY = '2026-09-06';

const read = async (data, rel) => JSON.parse(await readFile(path.join(data, rel), 'utf8'));
const writeJson = (data, rel, value) => writeFile(path.join(data, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

// A synthetic class table, in the shape data/imports/wikidata-seeds.json has.
// `battle` is longer than `war` and both are `war`; `legislative election` is
// longer than `election` and both are `election`; `assembly` is the class the
// owner filed as `other`, which the tool must never write.
const SEED_CLASSES = {
  Q900001: { kind: 'event', category: 'war', label: 'war' },
  Q900002: { kind: 'event', category: 'war', label: 'battle' },
  Q900003: { kind: 'event', category: 'election', label: 'election' },
  Q900004: { kind: 'event', category: 'law', label: 'legislative election' },
  Q900005: { kind: 'event', category: NEVER_WRITTEN, label: 'assembly' },
  Q900006: { kind: 'event', label: 'gathering' },
  Q900007: { kind: 'actor', actorType: 'person', label: 'election' },
};

const seedsFile = (classes) => ({
  schema: 1, kind: 'import-seeds', source: 'wikidata', classes,
});

// A scratch copy of the fixtures with a seeds file in it, and `mutate`
// applied. The fixtures have no `data/imports/` of their own: an import table
// is not part of what a fork of this atlas must carry.
async function scratch(mutate = async () => {}, classes = SEED_CLASSES) {
  const dir = await mkdtemp(path.join(tmpdir(), 'categories-migrate-'));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  await mkdir(path.join(data, 'imports'), { recursive: true });
  await writeJson(data, 'imports/wikidata-seeds.json', seedsFile(classes));
  await mutate({
    data,
    event: async (id, change) => {
      const rel = path.join('events', `${id}.json`);
      const record = await read(data, rel);
      change(record);
      await writeJson(data, rel, record);
    },
  });
  return { dir, data };
}

// The repository's own table, which the tool reads and this file only reads
// about: the assertions below are about its shape, never about which category
// a class was given, which is the owner's decision under M30a amendment A17.
test('the class table is the seeds file, longest label first and never `other`', async () => {
  const seeds = JSON.parse(await readFile(path.join(ROOT, 'data', 'imports', 'wikidata-seeds.json'), 'utf8'));
  const { rows, problems } = buildTable(seeds.classes);
  assert.deepEqual(problems, [], 'no label carries two categories');

  // Only event classes that carry a category, and never `other`.
  for (const row of rows) {
    assert.equal(seeds.classes[row.id].kind, 'event');
    assert.notEqual(row.category, NEVER_WRITTEN);
  }
  const expected = Object.values(seeds.classes)
    .filter((c) => c.kind === 'event' && typeof c.category === 'string' && c.category !== NEVER_WRITTEN).length;
  assert.equal(rows.length, expected);

  // Longest first, which is the whole of the precedence rule.
  for (let i = 1; i < rows.length; i += 1) {
    assert.ok(rows[i - 1].label.length >= rows[i].label.length, `${rows[i - 1].label} before ${rows[i].label}`);
  }

  // Every category it can write is one of the owner's twelve.
  const allowed = new Set((await readCategories(path.join(ROOT, 'data'))).map((c) => c.id));
  for (const row of rows) assert.ok(allowed.has(row.category), row.category);
});

test('the longest label wins, so a legislative election is not an election', () => {
  const { rows } = buildTable(SEED_CLASSES);
  assert.equal(categoryFor('A legislative election of the fixtures', rows).category, 'law');
  assert.equal(categoryFor('A presidential election of the fixtures', rows).category, 'election');
  // `battle` before `war` is the same rule seen from the other side; both are
  // `war` here, so what it proves is that the longer label is reached at all.
  assert.equal(categoryFor('The battle of the fixtures', rows).label, 'battle');
});

test('the match is on a whole word, with an optional plural, and folds case', () => {
  assert.ok(labelPattern('war').test('A war of the fixtures'));
  assert.ok(labelPattern('war').test('A WAR of the fixtures'));
  assert.ok(labelPattern('election').test('The fixture elections'));
  assert.ok(labelPattern('wildfire').test('The fixture wildfires'));
  // The two that a plain substring match gets wrong, which is why the
  // boundaries are there (amendment A4).
  assert.equal(labelPattern('war').test('The siege of Warsaw'), false);
  assert.equal(labelPattern('law').test('A fixture outlaw'), false);
  assert.equal(labelPattern('election').test('A fixture reelection'), false);
  // A boundary that `\b` would get wrong: `\b` is ASCII-only, so a label
  // ending in an accented letter would have its boundary inverted.
  assert.ok(labelPattern("coup d'état").test("The coup d'état of the fixtures"));
  assert.equal(labelPattern("coup d'état").test("The coup d'étatiste of the fixtures"), false);
});

test('a class the owner has not filed reaches nothing, and `other` is never written', () => {
  const { rows } = buildTable(SEED_CLASSES);
  assert.equal(categoryFor('The fixture assembly', rows), null, '`other` is a person\'s judgement');
  assert.equal(categoryFor('The fixture gathering', rows), null, 'a class with no category writes none');
  // An actor class is not an event class, whatever its label says.
  assert.deepEqual(rows.filter((r) => r.id === 'Q900007'), []);
});

test('two classes may share a label, and two categories for one label are refused', () => {
  const agreeing = buildTable({
    Q1: { kind: 'event', category: 'disaster', label: 'earthquake' },
    Q2: { kind: 'event', category: 'disaster', label: 'earthquake' },
  });
  assert.deepEqual(agreeing.problems, []);
  assert.equal(agreeing.rows.length, 2);

  const disagreeing = buildTable({
    Q1: { kind: 'event', category: 'disaster', label: 'earthquake' },
    Q2: { kind: 'event', category: 'war', label: 'earthquake' },
  });
  assert.equal(disagreeing.problems.length, 1);
  assert.match(disagreeing.problems[0], /"earthquake" is disaster on Q1 and war on Q2/);
});

test('only an imported title is read, and a hand-written one becomes a suggestion', () => {
  const { rows } = buildTable(SEED_CLASSES);
  const imported = { id: 'x', title: 'The fixture war', origin: { tool: IMPORT_TOOL } };
  assert.deepEqual(classify(imported, rows), { action: 'written', row: rows.find((r) => r.label === 'war') });

  // Amendment A5: the same title, composed rather than copied, is left alone
  // and reported. This is the case the run exists to get right.
  const drafted = { id: 'x', title: 'The fixture war', origin: { tool: 'assistant' } };
  assert.equal(classify(drafted, rows).action, 'suggested');
  assert.equal(classify({ id: 'x', title: 'The fixture war' }, rows).action, 'suggested');
});

test('a category a record already carries is never overwritten', () => {
  const { rows } = buildTable(SEED_CLASSES);
  const record = { id: 'x', title: 'The fixture war', origin: { tool: IMPORT_TOOL }, category: 'culture' };
  assert.deepEqual(classify(record, rows), { action: 'kept' });
  // `null` is what an untouched record says and is not a category.
  assert.equal(classify({ ...record, category: null }, rows).action, 'written');
});

test('a reviewed record is left for a person', () => {
  const { rows } = buildTable(SEED_CLASSES);
  const record = {
    id: 'x', title: 'The fixture war', origin: { tool: IMPORT_TOOL }, review: { status: 'reviewed' },
  };
  assert.deepEqual(classify(record, rows), { action: 'reviewed' });
});

test('the category is written where the schema puts it, before the actors', () => {
  const record = { id: 'x', title: 't', place: 'p', region: null, actors: [{ actor: 'a', role: 'leader' }] };
  assert.deepEqual(Object.keys(withCategory(record, 'war')), ['id', 'title', 'place', 'region', 'category', 'actors']);
  // A record with no actor line still gets one, at the end.
  assert.deepEqual(Object.keys(withCategory({ id: 'x', title: 't' }, 'war')), ['id', 'title', 'category']);
});

test('the tool run over a scratch copy of the fixtures leaves a corpus that still validates', async () => {
  const { dir, data } = await scratch(async ({ event }) => {
    await event('fixture-event-a', (r) => { r.origin = { tool: IMPORT_TOOL }; r.title = 'The fixture war'; });
    await event('fixture-event-b', (r) => { r.origin = { tool: IMPORT_TOOL }; r.title = 'The fixture legislative elections'; });
    // Hand-written: the table reaches it and the tool must not write it.
    await event('fixture-event-c', (r) => { r.title = 'The fixture battle'; });
    // Imported, signed, and reached: A9 outranks the match.
    await event('fixture-event-d', (r) => {
      r.origin = { tool: IMPORT_TOOL };
      r.title = 'The fixture election';
      r.review = { status: 'reviewed', signedBy: [{ name: 'A reviewer', github: null, on: '2026-09-06' }] };
    });
  });
  try {
    const { stdout } = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]);
    assert.match(stdout, /2 given a category \(1 law, 1 war\)/);
    assert.match(stdout, /left {4}fixture-event-c \(active\): the table would say war, via "battle"/);
    assert.match(stdout, /left {4}fixture-event-d \(reviewed/);

    const a = await read(data, 'events/fixture-event-a.json');
    assert.equal(a.category, 'war');
    assert.equal(a.revised, TODAY);
    const keys = Object.keys(a);
    assert.equal(keys[keys.indexOf('actors') - 1], 'category', 'the category sits before the actors');
    assert.equal((await read(data, 'events/fixture-event-b.json')).category, 'law');
    // The two the tool refused kept everything, `revised` included.
    const c = await read(data, 'events/fixture-event-c.json');
    assert.equal(Object.hasOwn(c, 'category'), false);
    assert.notEqual(c.revised, TODAY);
    const d = await read(data, 'events/fixture-event-d.json');
    assert.equal(Object.hasOwn(d, 'category'), false);
    assert.notEqual(d.revised, TODAY);

    const { entries, problems } = await readRecords(data);
    assert.deepEqual(problems, []);
    const records = entries.map((e) => e.record);
    const topology = buildTopology(records, await readRegions(data), { deriveRegion: createRegionDeriver([]) });
    const { errors, warnings } = checkRules(records, topology);
    assert.deepEqual(errors, []);
    // The fixtures carry no data/categories.json, and an absent vocabulary is
    // not an empty one: a category the tool just wrote is not `category-unknown`
    // (M30a amendment A8).
    assert.deepEqual(warnings.filter((w) => w.rule === 'category-unknown'), []);

    // Idempotent: a second run finds both categories in place and writes
    // nothing, `revised` included.
    // `fixture-event-f` carries a category of its own and is one of the three.
    assert.equal((await read(data, 'events/fixture-event-f.json')).category, 'war');
    const again = await run(process.execPath, [TOOL, '--data', data, '--today', '2026-09-07']);
    assert.match(again.stdout, /0 given a category \(none\), 3 already had one/);
    assert.deepEqual(await read(data, 'events/fixture-event-a.json'), a);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a category the vocabulary does not have is refused rather than written', async () => {
  const { dir, data } = await scratch(
    async ({ data: root, event }) => {
      await writeJson(root, 'categories.json', [{ id: 'war', label: 'War', description: 'Only one.' }]);
      await event('fixture-event-a', (r) => { r.origin = { tool: IMPORT_TOOL }; r.title = 'The fixture election'; });
    },
    { Q900003: { kind: 'event', category: 'election', label: 'election' } },
  );
  try {
    const failed = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]).then(
      () => null,
      (error) => error,
    );
    assert.ok(failed, 'the tool exits non-zero rather than writing a category nobody approved');
    assert.match(failed.stderr, /"election", which is not in data\/categories\.json/);
    assert.equal(Object.hasOwn(await read(data, 'events/fixture-event-a.json'), 'category'), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('--dry-run says what it would do and writes nothing', async () => {
  const { dir, data } = await scratch(async ({ event }) => {
    await event('fixture-event-a', (r) => { r.origin = { tool: IMPORT_TOOL }; r.title = 'The fixture war'; });
  });
  try {
    const before = await read(data, 'events/fixture-event-a.json');
    const { stdout } = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY, '--dry-run']);
    assert.match(stdout, /1 given a category \(1 war\).*\(dry run: nothing written\)/);
    assert.deepEqual(await read(data, 'events/fixture-event-a.json'), before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a dataset with no class table writes nothing and says so', async () => {
  const { dir, data } = await scratch(async ({ data: root }) => {
    await rm(path.join(root, 'imports'), { recursive: true, force: true });
  });
  try {
    const { stdout } = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]);
    assert.match(stdout, /0 seed file\(s\), 0 class label\(s\)/);
    assert.match(stdout, /0 given a category \(none\)/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, cp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';
import { unwrittenFields, unwrittenFieldMessage, readModules } from '../tools/validate.mjs';
import { readRecords, readSchemaFiles } from '../tools/lib/read.mjs';

// How many records and regions the fixture corpus holds, counted rather than
// written out: both numbers moved when M43b stretched the fixtures to 2025 and
// will move again with the next record. What these tests are about is that the
// tools count what is on disk and report it, not what the count happens to be.
const corpus = await fixtures();
const RECORDS = corpus.records.length;
const REGIONS = corpus.regions.length;
const countOf = (kind) => corpus.records.filter((r) => r.kind === kind).length;

function cli(tool, ...args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', tool), ...args], { encoding: 'utf8', cwd: ROOT });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

test('validate.mjs passes on the fixtures and prints the warnings', () => {
  const r = cli('validate.mjs', '--data', FIXTURE_DATA, '--index');
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /warning \[degree-zero\] events\/fixture-event-h\.json/);
  // The summary counts what is on disk, and the warnings are the unread
  // records plus the three intended ones (tests/rules.test.mjs). Read out of
  // the output rather than written down: every one of these numbers moved when
  // M43b stretched the fixtures to 2025, and what the test is about is that the
  // tool counts the corpus it was pointed at.
  const summary = r.out.match(/(\d+) records, (\d+) regions: 0 error\(s\), (\d+) warning\(s\)/);
  assert.ok(summary, r.out);
  assert.equal(Number(summary[1]), RECORDS, 'it counted the records on disk');
  assert.equal(Number(summary[2]), REGIONS, 'and the regions');
  // And the terminal is not asked to scroll through all of them: a rule past
  // the cap prints its first twenty and then says how many more there are.
  const more = r.out.match(/warning \[unread\]: and (\d+) more like the 20 above/);
  assert.ok(more, r.out);
  // Plus one line per field the fixtures declare, src/ reads and no fixture
  // record writes — counted from the output for the same reason the records
  // are: the fixtures gain a field the day a schema does.
  const unwritten = (r.out.match(/warning \[unwritten-field\] /g) ?? []).length;
  assert.ok(unwritten > 0, 'the fixtures set no review and no origin, and the check says so');
  assert.equal(Number(summary[3]), Number(more[1]) + 20 + 3 + unwritten, 'the unread records, the three intended warnings and the unwritten fields');
  assert.equal((r.out.match(/warning \[unread\] /g) ?? []).length, 20);
});

test('validate.mjs passes on the repository data', () => {
  const r = cli('validate.mjs', '--index');
  assert.equal(r.status, 0, r.err);
});

test('validate.mjs fails when a file name does not match its id', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-cli-'));
  try {
    await cp(FIXTURE_DATA, dir, { recursive: true });
    await rename(path.join(dir, 'events', 'fixture-event-a.json'), path.join(dir, 'events', 'fixture-event-renamed.json'));
    const r = cli('validate.mjs', '--data', dir);
    assert.equal(r.status, 1);
    assert.match(r.err, /error \[rule 2\] events\/fixture-event-renamed\.json \/id: id "fixture-event-a" does not equal the file name/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('validate.mjs rejects unknown arguments and missing directories', () => {
  assert.equal(cli('validate.mjs', '--nope').status, 2);
  assert.equal(cli('validate.mjs', '--data', '/nonexistent/atlas').status, 2);
});

test('build-index.mjs writes an index that validate.mjs --index accepts', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-cli-'));
  try {
    await cp(FIXTURE_DATA, dir, { recursive: true });
    await rm(path.join(dir, 'index'), { recursive: true, force: true });
    assert.equal(cli('validate.mjs', '--data', dir, '--index').status, 1);
    const b = cli('build-index.mjs', '--data', dir);
    assert.equal(b.status, 0, b.err);
    assert.match(b.out, new RegExp([
      `${countOf('event')} events`, `${countOf('edge')} edges`, `${countOf('actor')} actors`,
      `${countOf('relation')} relations`, `${countOf('office')} offices`, `${countOf('tenure')} tenures`,
      `${countOf('narrative')} narratives`, `${countOf('place')} places`,
      `${countOf('presence')} presences`, `${countOf('source')} sources`,
    ].join(', ')));
    assert.equal(cli('validate.mjs', '--data', dir, '--index').status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// --- the field with a reader and no writer -------------------------------
//
// `parent` had a rule, a `childrenOf`, a ring on three views and two fixtures
// carrying it, and not one record under `data/` — for five milestones, with
// every test green (M47). These are the two halves of the check that would
// have said so: the schemas supply the fields, the records say which are
// written, and `src/` says which are read.

test('unwrittenFields names a field src/ reads and no record writes', () => {
  const schemas = {
    'v1/event.json': { properties: { id: {}, title: {}, parent: {}, scope: {} } },
    'v1/place.json': { properties: { id: {}, historicalNames: {} } },
  };
  const entries = [
    { kind: 'event', record: { id: 'a', title: 'A', parent: 'b', scope: null } },
    { kind: 'place', record: { id: 'p', historicalNames: [] } },
  ];
  const modules = new Map([
    ['src/parts.js', 'export const isParent = (a, e) => a.childrenOf.get(e.id);'],
    ['src/large.js', "if (event.scope === 'worldwide') return null;"],
    ['src/map/names.js', 'export function faceName({ historicalNames = null }) {}'],
  ]);
  const found = unwrittenFields(schemas, entries, modules);
  // `scope` is null and `historicalNames` is empty, so neither is written;
  // `parent` and `title` are, and `id` is written by both kinds.
  assert.deepEqual(found.map((f) => f.field), ['historicalNames', 'scope']);
  assert.deepEqual(found[0], { field: 'historicalNames', kinds: ['place'], readers: ['src/map/names.js'] });
  assert.deepEqual(found[1].readers, ['src/large.js']);
  assert.equal(
    unwrittenFieldMessage(found[1]),
    '"scope" is declared by event and read in src/large.js, and no record sets it',
  );
});

test('unwrittenFields is silent about a field nothing reads, and about a kind with no records', () => {
  const schemas = {
    'v1/event.json': { properties: { id: {}, nobodyReadsThis: {} } },
    'v1/narrative.json': { properties: { id: {}, steps: {} } },
  };
  const entries = [{ kind: 'event', record: { id: 'a' } }];
  const modules = new Map([['src/data.js', 'const steps = narrative.steps;']]);
  // `nobodyReadsThis` has no reader, so it is a field waiting for a use and
  // not a use waiting for a field; `steps` is declared by a kind this
  // directory holds no record of, which is no evidence about the field.
  assert.deepEqual(unwrittenFields(schemas, entries, modules), []);
});

test('the check finds parent again the moment the last record drops it', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-cli-'));
  try {
    await cp(FIXTURE_DATA, dir, { recursive: true });
    const { entries } = await readRecords(dir);
    const modules = await readModules(path.join(ROOT, 'src'));
    const schemas = await readSchemaFiles(path.join(ROOT, 'schema'));
    const named = (list) => list.map((f) => f.field);
    assert.ok(entries.some((e) => typeof e.record?.parent === 'string'), 'the fixtures carry a parent');
    assert.ok(!named(unwrittenFields(schemas, entries, modules)).includes('parent'));
    const without = entries.map((e) => ({ ...e, record: { ...e.record, parent: undefined } }));
    assert.ok(named(unwrittenFields(schemas, without, modules)).includes('parent'), 'and the check says so when they do not');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// The one-off tool that re-files every actor line's free-text role onto the
// 31 ids of `data/roles.json`, keeping the old phrase beside it as a `note`.
//
// The first test is the important one: the table in the tool is the table in
// `docs/roles-mapping.md`, which is the document the owner approved on
// 5 September and the only authority for the mapping. Everything else here
// works on a scratch copy of the fixture dataset, never on the repository's
// own files, and proves the four things the tool must not do — guess at a
// role nobody mapped, overwrite a note a person wrote, re-file a record
// somebody signed, or do anything at all on a second run.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { MAPPING, TABLE, TARGETS, refileLine, refileRecord } from '../tools/migrate/roles.mjs';
import { checkRules, normalizeRole } from '../src/validate/rules.js';
import { buildTopology } from '../src/validate/core.js';
import { readRecords, readRegions, readRoles } from '../tools/lib/read.mjs';
import { createRegionDeriver } from '../src/util/geo.js';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

const run = promisify(execFile);
const TOOL = path.join(ROOT, 'tools', 'migrate', 'roles.mjs');
const TODAY = '2026-09-06';

const read = async (data, rel) => JSON.parse(await readFile(path.join(data, rel), 'utf8'));
const writeRecord = (data, rel, record) => writeFile(path.join(data, rel), `${JSON.stringify(record, null, 2)}\n`, 'utf8');

// A scratch copy of the fixtures, with `mutate` applied to the events named.
// The fixtures carry no `data/roles.json`, which is the case that matters:
// an absent vocabulary is not an empty one, and the tool falls back to the
// ids its own table can produce.
async function scratch(mutate = async () => {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'roles-migrate-'));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  await mutate({
    data,
    event: async (id, change) => {
      const rel = path.join('events', `${id}.json`);
      const record = await read(data, rel);
      change(record);
      await writeRecord(data, rel, record);
    },
  });
  return { dir, data };
}

// `docs/roles-mapping.md`, parsed the way the document is written: a header
// row, a separator, and 163 rows of five cells. `Becomes` and `Example event`
// are backtick-wrapped and `Role in use` and `Note kept` are bare.
async function approvedRows() {
  const text = await readFile(path.join(ROOT, 'docs', 'roles-mapping.md'), 'utf8');
  const pipes = text.split('\n').filter((line) => line.trim().startsWith('|'));
  assert.equal(pipes.length, 165, 'a header, a separator and the data rows');
  return pipes.slice(2).map((line) => {
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 5, line);
    return cells;
  });
}

test('the tool\'s table is docs/roles-mapping.md, row for row', async () => {
  const rows = await approvedRows();
  // Three columns and not five. `Example event` is prose for a reader, and
  // `Count` is stale — it sums to 340 against 349 actor lines and five of its
  // rows disagree with the corpus — so pinning the tool to it would pin the
  // tool to an arithmetic error (amendment A6).
  assert.deepEqual(
    MAPPING.map(([use, becomes, note]) => [use, becomes, note]),
    rows.map(([use, , becomes, note]) => [use, becomes.replaceAll('`', ''), note === '—' ? null : note]),
  );
  assert.equal(MAPPING.length, 163);
  assert.equal(TABLE.size, 163, 'no two rows fold to one key');
  assert.equal(MAPPING.filter(([, , note]) => note === null).length, 31, 'the em-dash rows');

  // Every target is a role the owner's list actually has, and the two it does
  // not reach are the two the document says are there for events that do not
  // exist yet.
  const vocabulary = (await readRoles(path.join(ROOT, 'data'))).map((role) => role.id);
  for (const id of TARGETS) assert.ok(vocabulary.includes(id), id);
  assert.deepEqual(vocabulary.filter((id) => !TARGETS.includes(id)), ['minister', 'institution']);
});

test('a mapped line takes the id and keeps its own phrase, character for character', () => {
  const known = new Set(TARGETS);
  const line = { actor: 'fixture-actor-one', role: 'came first and led the government' };
  assert.deepEqual(refileLine(line, known), {
    action: 'refiled', role: 'head-of-government', note: 'came first and led the government',
  });

  // Amendment A1: the lookup folds case, the note does not. Twelve of the
  // corpus's strings differ from their folded form by capitalisation alone,
  // and the note is the record's own string and never the folded key.
  const capitals = { actor: 'fixture-actor-one', role: 'Won 106 of 163 Seats in the Chamber' };
  const outcome = refileLine(capitals, known);
  assert.equal(outcome.role, 'party');
  assert.equal(outcome.note, 'Won 106 of 163 Seats in the Chamber');
  assert.notEqual(outcome.note, normalizeRole(capitals.role));
});

test('an em-dash row writes no note key at all, and never an empty one', () => {
  const known = new Set(TARGETS);
  const record = { actors: [{ actor: 'fixture-actor-two', role: 'founded' }] };
  const outcome = refileRecord(record, known);
  assert.deepEqual(outcome.refiled, ['founded']);
  assert.deepEqual(outcome.noted, []);
  assert.deepEqual(record.actors, [{ actor: 'fixture-actor-two', role: 'founder' }]);
  assert.equal(Object.hasOwn(record.actors[0], 'note'), false);
});

test('a role already in the vocabulary is left alone, which is what makes the tool idempotent', () => {
  const known = new Set(TARGETS);
  assert.deepEqual(refileLine({ actor: 'a', role: 'leader' }, known), { action: 'kept' });
  // `head-of-government` is an id and is not one of the 163 phrases, so
  // without this check a second run would refuse the corpus the first wrote.
  assert.equal(TABLE.has('head-of-government'), false);
  assert.deepEqual(refileLine({ actor: 'a', role: 'head-of-government' }, known), { action: 'kept' });
});

test('a note somebody wrote is never overwritten, and the line is reported', () => {
  const known = new Set(TARGETS);
  const record = { actors: [{ actor: 'a', role: 'prime minister', note: 'said by a person' }] };
  const before = structuredClone(record);
  const outcome = refileRecord(record, known);
  assert.deepEqual(record, before, 'the line is left alone entirely, role and all');
  assert.deepEqual(outcome.skipped, ['prime minister']);
  assert.equal(outcome.changed, false);
});

test('a role with no row is refused and not guessed at', async () => {
  const known = new Set(TARGETS);
  const record = { actors: [{ actor: 'a', role: 'a role nobody approved' }] };
  const outcome = refileRecord(record, known);
  assert.deepEqual(outcome.unmapped, ['a role nobody approved']);
  assert.deepEqual(record.actors, [{ actor: 'a', role: 'a role nobody approved' }]);

  const { dir, data } = await scratch(async ({ event }) => {
    await event('fixture-event-a', (r) => { r.actors = [{ actor: 'fixture-actor-one', role: 'a role nobody approved' }]; });
  });
  try {
    const failed = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]).then(
      () => null,
      (error) => error,
    );
    assert.ok(failed, 'the tool exits non-zero rather than inventing a target');
    assert.match(failed.stderr, /"a role nobody approved".*no row in docs\/roles-mapping\.md/);
    assert.deepEqual((await read(data, 'events/fixture-event-a.json')).actors,
      [{ actor: 'fixture-actor-one', role: 'a role nobody approved' }]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a reviewed record is left for a person, and said so', async () => {
  const { dir, data } = await scratch(async ({ event }) => {
    await event('fixture-event-b', (r) => {
      r.review = { status: 'reviewed', signedBy: [{ name: 'A reviewer', github: null, on: '2026-09-06' }] };
    });
  });
  try {
    const { stdout } = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]);
    assert.match(stdout, /kept {4}fixture-event-b \(reviewed/);
    // A signature was given against what the record said, so nothing in it
    // moved — not the role, not `revised` (amendment A9).
    const record = await read(data, 'events/fixture-event-b.json');
    assert.equal(record.actors[0].role, 'founded');
    assert.equal(record.revised, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the tool run over a scratch copy of the fixtures leaves a corpus that still validates', async () => {
  const { dir, data } = await scratch();
  try {
    const first = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]);
    assert.match(first.stdout, /1 re-filed in 1 file\(s\), 0 of them with a note kept/);

    // `founded` became `founder` and took the day of the run with it; the two
    // lines that already read as ids did not move, and neither did their file.
    const b = await read(data, 'events/fixture-event-b.json');
    assert.deepEqual(b.actors, [
      { actor: 'fixture-actor-two', role: 'founder' },
      { actor: 'fixture-actor-one', role: 'signatory' },
    ]);
    assert.equal(b.revised, TODAY);
    const a = await read(data, 'events/fixture-event-a.json');
    assert.deepEqual(a.actors, [{ actor: 'fixture-actor-one', role: 'leader' }]);
    assert.notEqual(a.revised, TODAY);
    // The note the fixtures already carry is still the one a person wrote.
    assert.equal((await read(data, 'events/fixture-event-t.json')).actors[0].note,
      'signed it for the synthetic party');

    const { entries, problems } = await readRecords(data);
    assert.deepEqual(problems, []);
    const records = entries.map((e) => e.record);
    const topology = buildTopology(records, await readRegions(data), { deriveRegion: createRegionDeriver([]) });
    assert.deepEqual(checkRules(records, topology).errors, []);

    // Idempotent: a second run finds every role in the vocabulary and writes
    // nothing, `revised` included.
    const again = await run(process.execPath, [TOOL, '--data', data, '--today', '2026-09-07']);
    assert.match(again.stdout, /0 re-filed in 0 file\(s\)/);
    assert.deepEqual(await read(data, 'events/fixture-event-b.json'), b);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('--dry-run says what it would do and writes nothing', async () => {
  const { dir, data } = await scratch();
  try {
    const before = await read(data, 'events/fixture-event-b.json');
    const { stdout } = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY, '--dry-run']);
    assert.match(stdout, /1 re-filed in 1 file\(s\).*\(dry run: nothing written\)/);
    assert.deepEqual(await read(data, 'events/fixture-event-b.json'), before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

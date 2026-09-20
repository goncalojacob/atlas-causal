// The one-off tool that gives a record an import created before its import
// said `draft` the standing that is true of it: nobody has read it.
//
// The tests that matter are the refusals and the one invariant. It never
// touches a record that already has a status or a signature, never touches one
// that is not active, never writes `reviewed`, and never touches a record with
// no `origin.tool` — and, the invariant this whole run turns on, it changes
// nothing a record claims: `review` is the only key it writes.
//
// The question `classify` asks is the question `src/validate/rules.js` asks in
// its `unread` warning, and the first case here holds the two together: a
// record the tool would backfill is exactly a record the validator calls
// unread, over the fixture corpus and not over a hand-made list.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  BACKFILLED_STATUS, BACKFILL_FLAG, classify, hasStanding, importFlag, withStanding,
} from '../tools/migrate/backfill-standing.mjs';
import { checkRules } from '../src/validate/rules.js';
import { buildTopology } from '../src/validate/core.js';
import { readRecords, readRegions } from '../tools/lib/read.mjs';
import { createRegionDeriver } from '../src/util/geo.js';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

const run = promisify(execFile);
const TOOL = path.join(ROOT, 'tools', 'migrate', 'backfill-standing.mjs');
const TODAY = '2026-09-20';

const read = async (data, rel) => JSON.parse(await readFile(path.join(data, rel), 'utf8'));
const writeJson = (data, rel, value) => writeFile(path.join(data, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

// An actor in the shape the CShapes import writes one, minus the `review` block
// it did not write at the time.
const imported = (over = {}) => ({
  schema: 1,
  id: 'fixture-standing-actor',
  kind: 'actor',
  status: 'active',
  supersededBy: null,
  aliases: [],
  authors: [{ name: 'CShapes 2.0 import (tools/import/cshapes.mjs)', github: null }],
  license: 'CC-BY-NC-SA-4.0',
  created: '2026-09-02',
  revised: null,
  origin: { tool: 'cshapes' },
  sources: [{ source: 'fixture-source-1', locator: 'gwcode 999' }],
  actorType: 'polity',
  names: ['A polity of the fixtures'],
  when: { start: 1900, end: 1901 },
  ...over,
});

// A scratch copy of the fixtures with `mutate` applied.
async function scratch(mutate = async () => {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'backfill-standing-'));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  await mutate({ data });
  return { dir, data };
}

test('the tool backfills exactly the records the validator calls unread', async () => {
  const data = FIXTURE_DATA;
  const { entries, problems } = await readRecords(data);
  assert.deepEqual(problems, []);
  const records = entries.map((e) => e.record);
  const topology = buildTopology(records, await readRegions(data), { deriveRegion: createRegionDeriver([]) });
  const { warnings } = checkRules(records, topology);
  const unread = new Set(warnings.filter((w) => w.rule === 'unread').map((w) => w.id));
  assert.ok(unread.size > 0, 'the fixtures are a corpus nobody has read');

  // `hasStanding` is the predicate behind both, so it answers for every record
  // the same way the warning does — and `classify` then refuses the fixtures
  // for a second reason, which is the case below.
  for (const record of records) {
    const warned = unread.has(record.id);
    if (record.status !== 'active') {
      assert.equal(warned, false, `${record.id} is not active, so no reviewer waits on it`);
      continue;
    }
    assert.equal(hasStanding(record), !warned, record.id);
  }
});

test('a record with no origin.tool is left alone: there is no import to name', () => {
  // The fixtures write no `origin` at all, which is what a record a person
  // wrote looks like. Whether one of those is a draft is a different question
  // from this one, and not this tool's to answer.
  assert.equal(classify({ status: 'active' }).action, 'no-origin');
  assert.equal(classify({ status: 'active', origin: {} }).action, 'no-origin');
  assert.equal(classify({ status: 'active', origin: { tool: '' } }).action, 'no-origin');
  assert.equal(classify(imported()).action, 'backfill');
  assert.equal(classify(imported()).tool, 'cshapes');
});

test('standing already given, however it was given, is never overwritten', () => {
  assert.equal(classify(imported({ review: { status: 'draft' } })).action, 'kept');
  assert.equal(classify(imported({ review: { status: 'reviewed', signedBy: [{ name: 'A Reviewer', github: null, on: '2026-09-10' }] } })).action, 'kept');
  // A signature with no status is standing too: the record has been read.
  assert.equal(classify(imported({ review: { signedBy: [{ name: 'A Reviewer', github: null, on: '2026-09-10' }] } })).action, 'kept');
  // A block with neither is not: flags and a note say what to look at, not
  // whether anybody has looked.
  assert.equal(classify(imported({ review: { flags: ['date'], note: 'the interval came from the dataset' } })).action, 'backfill');
});

test('a record that is not active is left alone', () => {
  for (const status of ['retracted', 'merged']) {
    assert.equal(classify(imported({ status })).action, 'inactive');
  }
});

test('the only key it writes is review, and the status it writes is draft', () => {
  const before = imported();
  const after = withStanding(before, 'cshapes');
  assert.equal(after.review.status, BACKFILLED_STATUS);
  assert.equal(BACKFILLED_STATUS, 'draft', 'signing is a person\'s act and this tool never does it');

  // Standing, not content: every other key is the value it was, and the record
  // it was given was not mutated.
  const strip = (r) => { const { review, ...rest } = r; return rest; };
  assert.deepEqual(strip(after), strip(before));
  assert.equal(before.review, undefined);
});

test('the two flags say who wrote the record and that the status came later', () => {
  const after = withStanding(imported(), 'cshapes');
  assert.deepEqual(after.review.flags, [BACKFILL_FLAG, 'imported-by-cshapes']);
  // The schema's own pattern for a flag, so a second import needs no edit.
  const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  for (const tool of ['cshapes', 'basemaps', 'wikidata', 'assistant']) {
    const flag = importFlag(tool);
    assert.match(flag, pattern);
    assert.ok(flag.length <= 40, flag);
  }
});

test('a review block that is already there keeps everything it held', () => {
  const before = imported({ review: { flags: ['date', BACKFILL_FLAG], note: 'the interval came from the dataset' } });
  const after = withStanding(before, 'cshapes');
  assert.equal(after.review.status, 'draft');
  assert.equal(after.review.note, 'the interval came from the dataset');
  // The flag it already carried is not written twice, and its own flags stay.
  assert.deepEqual(after.review.flags, ['date', BACKFILL_FLAG, 'imported-by-cshapes']);
  // And applying it twice is applying it once.
  assert.deepEqual(withStanding(after, 'cshapes'), after);
});

// Where provenance.json declares it and where the corpus keeps it: after
// `origin`, not at the end of the file and not before `origin`, which is what
// ordering by schema/v1/<kind>.json would have produced.
test('review lands after origin and not at the end of the file', () => {
  const keys = Object.keys(withStanding(imported(), 'cshapes'));
  assert.equal(keys[keys.indexOf('origin') + 1], 'review');
  assert.ok(keys.indexOf('review') < keys.indexOf('sources'), keys.join(','));
  assert.equal(keys.at(-1), 'when', 'nothing was moved to the end');
});

test('the tool run over a corpus writes the standing, the date and nothing else', async () => {
  const { dir, data } = await scratch(async ({ data: d }) => {
    await writeJson(d, 'actors/fixture-standing-actor.json', imported());
    // One that already has standing, and one that is out of the corpus: both
    // must come back byte-identical.
    await writeJson(d, 'actors/fixture-standing-signed.json', imported({
      id: 'fixture-standing-signed',
      review: { status: 'reviewed', signedBy: [{ name: 'A Reviewer', github: null, on: '2026-09-10' }] },
    }));
    await writeJson(d, 'actors/fixture-standing-gone.json', imported({
      id: 'fixture-standing-gone',
      status: 'retracted',
      retraction: { on: '2026-09-10', reason: 'Withdrawn by the fixtures.' },
    }));
  });
  try {
    const signedBefore = await read(data, 'actors/fixture-standing-signed.json');
    const goneBefore = await read(data, 'actors/fixture-standing-gone.json');

    const r = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]);
    assert.match(r.stdout, /1 given standing \(1 cshapes; 1 actor\)/);
    // Every fixture record has no origin, so every one of them is left.
    assert.match(r.stdout, /no origin\.tool, so there is no import to name/);

    const after = await read(data, 'actors/fixture-standing-actor.json');
    assert.deepEqual(after.review, { status: 'draft', flags: [BACKFILL_FLAG, 'imported-by-cshapes'] });
    assert.equal(after.revised, TODAY);
    assert.deepEqual(await read(data, 'actors/fixture-standing-signed.json'), signedBefore);
    assert.deepEqual(await read(data, 'actors/fixture-standing-gone.json'), goneBefore);

    // The corpus still validates, and the record it wrote is no longer unread.
    const { entries, problems } = await readRecords(data);
    assert.deepEqual(problems, []);
    const records = entries.map((e) => e.record);
    const topology = buildTopology(records, await readRegions(data), { deriveRegion: createRegionDeriver([]) });
    const { errors, warnings } = checkRules(records, topology);
    assert.deepEqual(errors, []);
    assert.ok(!warnings.some((w) => w.rule === 'unread' && w.id === 'fixture-standing-actor'));

    // Idempotent: a second run finds it in place and writes nothing, the date
    // included.
    const again = await run(process.execPath, [TOOL, '--data', data, '--today', '2026-09-21']);
    assert.match(again.stdout, /0 given standing \(none; none\)/);
    assert.deepEqual(await read(data, 'actors/fixture-standing-actor.json'), after);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// The one-off tool that re-files the `led` relations as tenures.
//
// Every test here works on a scratch copy of the fixture dataset, never on
// the repository's own files (amendment A1). What is being proved is that the
// move carries a record across without changing it: the person, the years,
// the sources, the note, the whole review block and `origin` come out the
// other side the same, the office asserts nothing that was not already
// written, and the relation it came from becomes a tombstone that still says
// what it claimed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  planTenures, officeFor, officeIdFor, tenureIdFor,
  PARTY_OFFICE_TITLE, DEFAULT_PARTY_OFFICE_TITLE, OFFICE_OF_REGIME,
} from '../tools/migrate/led-to-tenures.mjs';
import { checkRules } from '../src/validate/rules.js';
import { buildTopology } from '../src/validate/core.js';
import { createValidator } from '../src/validate/schema.js';
import { readRecords, readRegions } from '../tools/lib/read.mjs';
import { createRegionDeriver } from '../src/util/geo.js';
import { schemas, FIXTURE_DATA, ROOT } from './helpers.mjs';

const run = promisify(execFile);
const TOOL = path.join(ROOT, 'tools', 'migrate', 'led-to-tenures.mjs');
const TODAY = '2026-09-06';

// A copy of the fixture dataset as it stood before the tool was run over it:
// the pair's `led` relation active again, and the office and tenure it became
// taken back out. The tool has already been run over the fixtures in the
// repository — that is what put an office and a tenure there — so a scratch
// copy alone would have nothing left to do, and the case being proved here is
// what it does to a corpus that still has a `led` record in it.
const RE_FILED_OFFICE = 'offices/leadership-of-fixture-actor-two.json';
const RE_FILED_TENURE = 'tenures/fixture-actor-one-fixture-actor-two-1210.json';
const FIXTURE_LED = 'relations/fixture-actor-one--fixture-actor-two--led.json';

async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), 'led-to-tenures-'));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  await rm(path.join(data, RE_FILED_OFFICE));
  await rm(path.join(data, RE_FILED_TENURE));
  const led = await read(data, FIXTURE_LED);
  delete led.retraction;
  await writeFile(path.join(data, FIXTURE_LED),
    `${JSON.stringify({ ...led, status: 'active', revised: null }, null, 2)}\n`, 'utf8');
  return { dir, data };
}

const read = async (data, rel) => JSON.parse(await readFile(path.join(data, rel), 'utf8'));

// A relation shaped like the twelve, so a case can be written without
// reaching for one of them.
function relation(over, { from = 'alvaro-cunhal', to = 'pcp', type = 'led' } = {}) {
  return {
    schema: 1,
    id: `${from}--${to}--${type}`,
    kind: 'relation',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: 'Claude (assistant draft, unreviewed)', github: null }],
    license: 'CC-BY-SA-4.0',
    created: '2026-09-03',
    revised: null,
    origin: { tool: 'assistant' },
    review: { status: 'draft', flags: ['date'], note: 'Neither has been read in a source.' },
    sources: [{ source: 'fixture-source-1', locator: null }],
    from,
    to,
    type,
    when: { start: 1961, end: 1992 },
    note: 'Secretary-general.',
    ...over,
  };
}

test('a leadership of a body becomes an office of that body and one turn at it', () => {
  const plan = planTenures([relation({})], { today: TODAY });

  assert.equal(plan.offices.length, 1);
  const [office] = plan.offices;
  assert.equal(office.id, 'leadership-of-pcp');
  assert.equal(office.of, 'pcp');
  assert.equal(office.category, 'party-leadership');
  // A4: the title comes from the notes the relations already carry, and
  // "Leader" only where they give none.
  assert.equal(office.title, 'Secretary-General');
  assert.equal(PARTY_OFFICE_TITLE.frelimo, 'President');
  assert.equal(planTenures([relation({}, { to: 'psd' })], { today: TODAY }).offices[0].title, DEFAULT_PARTY_OFFICE_TITLE);
  // A13: an office says the post exists and what it is called, and nothing
  // about when it began. Rule 6 exempts it from citing.
  assert.equal(office.when, null);
  assert.deepEqual(office.sources, []);

  assert.equal(plan.tenures.length, 1);
  const [tenure] = plan.tenures;
  assert.equal(tenure.id, 'alvaro-cunhal-pcp-1961');
  assert.equal(tenure.person, 'alvaro-cunhal');
  assert.equal(tenure.office, 'leadership-of-pcp');
  assert.equal(tenure.startedBy, null);
});

test('every field the brief names is carried over unchanged', () => {
  const source = relation({});
  const [tenure] = planTenures([source], { today: TODAY }).tenures;

  assert.deepEqual(tenure.when, source.when);
  assert.deepEqual(tenure.sources, source.sources);
  assert.deepEqual(tenure.authors, source.authors);
  assert.deepEqual(tenure.origin, source.origin);
  assert.equal(tenure.note, source.note);
  assert.equal(tenure.license, source.license);
  // The whole review block, `date` flag and all: the twelve are in the queue
  // because of those flags and changing kind must not take them out of it.
  assert.deepEqual(tenure.review, source.review);
  // `created` is the day the claim was written; `revised` is the day it was
  // re-filed, because that is what happened to the file.
  assert.equal(tenure.created, '2026-09-03');
  assert.equal(tenure.revised, TODAY);
  // And it is a copy: editing the tenure cannot reach back into the relation.
  tenure.review.flags.push('mutated');
  assert.deepEqual(source.review.flags, ['date']);
});

test('leading a regime is a turn at an office the atlas already has', () => {
  const salazar = relation({ when: { start: 1932, end: 1968 } }, { from: 'salazar', to: 'estado-novo' });
  const plan = planTenures([salazar], { today: TODAY });
  // No office is written: `prime-minister-of-portugal` is M30a-1's record and
  // the Estado Novo's two leaderships are turns at it.
  assert.deepEqual(plan.offices, []);
  assert.equal(plan.tenures[0].office, OFFICE_OF_REGIME['estado-novo']);
  assert.equal(plan.tenures[0].id, 'salazar-prime-minister-1932');
  assert.equal(officeFor(salazar).create, false);
  assert.equal(officeFor(relation({}, { to: 'pcp' })).id, officeIdFor('pcp'));
});

test('the relation becomes a tombstone that names the tenure and keeps its claim', () => {
  const source = relation({});
  const { tombstones } = planTenures([source], { today: TODAY });
  assert.equal(tombstones.length, 1);
  const { record } = tombstones[0];

  assert.equal(record.status, 'retracted');
  assert.equal(record.supersededBy, null, 'A3: no merge hop — there is no relation to resolve to');
  assert.equal(record.retraction.on, TODAY);
  assert.match(record.retraction.reason, /alvaro-cunhal-pcp-1961/);
  // What it claimed is still in the file: a tombstone is a withdrawal, not a
  // deletion, so an old link resolves and says why it went.
  assert.equal(record.type, 'led');
  assert.deepEqual(record.when, source.when);
  // The review block moved to the tenure; leaving a copy here would put one
  // claim in the queue twice.
  assert.equal(record.review, undefined);
});

test('six offices and twelve tenures out of the twelve records, and one office per party', () => {
  const led = [
    ['alvaro-cunhal', 'pcp'], ['amilcar-cabral', 'paigc'], ['andre-ventura', 'chega'],
    ['antonio-costa', 'partido-socialista'], ['mario-soares', 'partido-socialista'],
    ['cavaco-silva', 'psd'], ['luis-montenegro', 'psd'], ['marcelo-rebelo-de-sousa', 'psd'],
    ['pedro-passos-coelho', 'psd'], ['eduardo-mondlane', 'frelimo'],
    ['salazar', 'estado-novo'], ['marcelo-caetano', 'estado-novo'],
  ].map(([from, to], i) => relation({ when: { start: 1900 + i, end: 1990 + i } }, { from, to }));

  const plan = planTenures(led, { today: TODAY });
  assert.equal(plan.tenures.length, 12);
  assert.equal(plan.tombstones.length, 12);
  assert.deepEqual(plan.offices.map((o) => o.id), [
    'leadership-of-chega', 'leadership-of-frelimo', 'leadership-of-paigc',
    'leadership-of-partido-socialista', 'leadership-of-pcp', 'leadership-of-psd',
  ]);
  // Two people at one party is one office, and the two Estado Novo records
  // make no office at all.
  assert.equal(plan.tenures.filter((t) => t.office === 'leadership-of-psd').length, 4);
  assert.equal(plan.tenures.filter((t) => t.office === 'prime-minister-of-portugal').length, 2);
});

test('a relation that is not an active led is left alone, and an id already taken is refused', () => {
  const other = relation({}, { type: 'member-of' });
  const done = relation({ status: 'retracted' });
  const plan = planTenures([other, done], { today: TODAY });
  assert.deepEqual(plan.tenures, []);
  assert.deepEqual(plan.tombstones, []);
  assert.deepEqual(plan.skipped, [done.id]);

  const taken = planTenures([relation({})], { today: TODAY, existingTenures: new Set(['alvaro-cunhal-pcp-1961']) });
  assert.deepEqual(taken.tenures, []);
  assert.deepEqual(taken.collisions, [{ id: 'alvaro-cunhal-pcp-1961', relation: 'alvaro-cunhal--pcp--led' }]);
  assert.equal(tenureIdFor(relation({}), 'pcp'), 'alvaro-cunhal-pcp-1961');
});

test('the tool run over a scratch copy of the fixtures leaves a corpus that still validates', async () => {
  const { dir, data } = await scratch();
  try {
    const first = await run(process.execPath, [TOOL, '--data', data, '--today', TODAY]);
    assert.match(first.stdout, /1 office\(s\), 1 tenure\(s\), 1 tombstone\(s\)/);

    const office = await read(data, RE_FILED_OFFICE);
    const tenure = await read(data, RE_FILED_TENURE);
    const tomb = await read(data, FIXTURE_LED);
    assert.equal(office.of, 'fixture-actor-two');
    assert.equal(tenure.person, 'fixture-actor-one');
    assert.equal(tenure.office, office.id);
    assert.equal(tomb.status, 'retracted');

    // Both new records pass their own schema, and the whole corpus passes the
    // cross-record rules with nothing left dangling.
    const v = createValidator(await schemas());
    assert.deepEqual(v.validate('v1/office.json', office), []);
    assert.deepEqual(v.validate('v1/tenure.json', tenure), []);
    assert.deepEqual(v.validate('v1/relation.json', tomb), []);

    const { entries, problems } = await readRecords(data);
    assert.deepEqual(problems, []);
    const records = entries.map((e) => e.record);
    const topology = buildTopology(records, await readRegions(data), { deriveRegion: createRegionDeriver([]) });
    assert.deepEqual(checkRules(records, topology).errors, []);

    // Idempotent: a second run finds the work done and writes nothing.
    const again = await run(process.execPath, [TOOL, '--data', data, '--today', '2026-09-07']);
    assert.match(again.stdout, /0 office\(s\), 0 tenure\(s\), 0 tombstone\(s\), 1 already re-filed/);
    assert.deepEqual(await read(data, RE_FILED_TENURE), tenure);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

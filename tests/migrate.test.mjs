// The migration chain as a chain: the shape of it, that every `up` is
// idempotent, that a `down` really is the inverse of its `up`, and that the
// whole of it leaves this repository's records exactly as they are.
//
// The chain is the answer to health review A's finding 25 — `schema: 1` with
// no migration path — so what is tested here is the machinery and not any one
// of today's three steps: a fourth is expected to reuse all of it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LATEST, MIGRATIONS, migrateRecord, migrateRecords, migrationAt, rollbackRecord,
} from '../src/validate/migrate.js';
import { SCHEMA_VERSION, validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas, clone } from './helpers.mjs';

const json = (value) => JSON.stringify(value, null, 2);

test('the chain is numbered from one, in order, with no gaps', () => {
  assert.ok(MIGRATIONS.length > 0);
  MIGRATIONS.forEach((migration, i) => {
    assert.equal(migration.version, i + 1, `migration ${i} is numbered ${migration.version}`);
    assert.match(migration.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(typeof migration.up, 'function');
    assert.ok(migration.down === null || typeof migration.down === 'function');
  });
  assert.equal(LATEST, MIGRATIONS.length);
  assert.equal(migrationAt(LATEST).version, LATEST);
  assert.equal(migrationAt(LATEST + 1), null);
});

test('a migration number is not a schema version', () => {
  // They are counted separately on purpose: three steps of the chain have
  // been applied and no record's `schema` has moved.
  assert.equal(SCHEMA_VERSION, 1);
  assert.ok(LATEST >= 1);
});

test('every up is idempotent and leaves the record it was given alone', async () => {
  const { records } = await fixtures();
  for (const migration of MIGRATIONS) {
    for (const record of records) {
      const before = json(record);
      const once = migration.up(clone(record));
      const twice = migration.up(clone(once));
      assert.equal(json(twice), json(once), `${migration.name} is not idempotent on ${record.id}`);
      assert.equal(json(record), before, `${migration.name} mutated ${record.id} in place`);
    }
  }
});

test('every down undoes its own up', async () => {
  const { records } = await fixtures();
  for (const migration of MIGRATIONS) {
    if (!migration.down) continue;
    for (const record of records) {
      const there = migration.up(clone(record));
      const back = migration.down(clone(there));
      assert.equal(json(back), json(record), `${migration.name} does not come back on ${record.id}`);
    }
  }
});

test('migration 1 fills an envelope key a record is missing, and touches nothing else', () => {
  const bare = { schema: 1, id: 'x', kind: 'event', status: 'active', authors: [], sources: [] };
  const filled = migrateRecord(bare, { to: 1 });
  assert.deepEqual(filled.aliases, []);
  assert.equal(filled.supersededBy, null);
  assert.equal(filled.revised, null);
  const complete = { ...bare, supersededBy: 'y', aliases: ['old'], revised: '2026-01-01' };
  assert.equal(migrateRecord(complete, { to: 1 }), complete, 'a complete record is returned unchanged');
});

// The envelope keys migration 1 fills in, so that the steps after it can be
// looked at on their own.
const ENVELOPE = { schema: 1, kind: 'event', status: 'active', supersededBy: null, aliases: [], revised: null };

test('migration 2 is the box for the citation checks, and 3 takes it back off', () => {
  const record = { ...ENVELOPE, id: 'x', review: { flags: ['unreviewed'] } };
  const two = migrateRecord(record, { to: 2 });
  assert.deepEqual(two.review, { flags: ['unreviewed'], citations: {} });
  assert.deepEqual(migrateRecord(record, { to: 3 }), record);
  // A record with checks in it is nobody's business but the reviewer's.
  const checked = { ...record, review: { flags: [], citations: { 'source-a': { verified: null } } } };
  assert.deepEqual(migrateRecord(checked), checked);
  // A record with no `review` at all is left alone by both.
  const plain = { ...ENVELOPE, id: 'y' };
  assert.equal(migrateRecord(plain, { to: 2 }), plain);
});

test('rollbackRecord walks back down the chain and refuses to go past a step that cannot', () => {
  const record = { ...ENVELOPE, id: 'x', review: { flags: [] } };
  const two = migrateRecord(record, { to: 2 });
  assert.deepEqual(rollbackRecord(two, { from: 2, to: 1 }), record);
  assert.throws(() => rollbackRecord(record, { to: 0 }), /cannot be undone/);
  assert.throws(() => rollbackRecord(record, {}), /needs the version/);
});

test('the whole chain changes no record in the fixture dataset, and the result still validates', async () => {
  const fx = await fixtures();
  const before = fx.records.map(json);
  const after = migrateRecords(clone(fx.records)).map(json);
  assert.deepEqual(after, before);

  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  const result = validate(fx.records, topology, await schemas());
  assert.equal(result.errors.length, 0, result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n'));
});

test('the validator reads an older schema and refuses a newer one', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  const run = async () => validate(fx.records, topology, await schemas());

  fx.byId['fixture-event-a'].schema = SCHEMA_VERSION + 1;
  let r = await run();
  assert.match(r.errors.find((e) => e.path === '/schema').message, /knows up to/);

  fx.byId['fixture-event-a'].schema = 0;
  r = await run();
  assert.equal(r.errors.filter((e) => e.path === '/schema').length, 1);

  fx.byId['fixture-event-a'].schema = '1';
  r = await run();
  assert.equal(r.errors.filter((e) => e.path === '/schema').length, 1);
});

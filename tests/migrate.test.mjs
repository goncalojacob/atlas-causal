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

// `down` inverts `up`, which is a statement about a record at the step
// *before* the migration — not about one already past it. The fixtures come
// back through `read.mjs` at the end of the chain, so each record is first
// rolled back to the step its migration expects; a step that reshapes a
// field, as 4 does, is otherwise asked to undo something it never did.
test('every down undoes its own up', async () => {
  const { records } = await fixtures();
  for (const migration of MIGRATIONS) {
    if (!migration.down) continue;
    for (const record of records) {
      const at = rollbackRecord(clone(record), { to: migration.version - 1 });
      const there = migration.up(clone(at));
      const back = migration.down(clone(there));
      assert.equal(json(back), json(at), `${migration.name} does not come back on ${record.id}`);
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

// --- migration 4: the envelope H5b adds ------------------------------------
// Every value here is read off the record: nothing in this step is written by
// hand and nothing in it is a claim about the world. The strings are the ones
// the repository actually wrote before `origin` existed.

const DRAFT = { name: 'Claude (assistant draft, unreviewed)', github: null };
const CSHAPES = { name: 'CShapes 2.0 import (tools/import/cshapes.mjs)', github: null };
const WIKIDATA = { name: 'Wikidata import (tools/import/wikidata.mjs)', github: null };
const at4 = (record) => migrateRecord(record, { from: 3, to: 4 });

test('migration 4: origin is the writer that created the record, and nobody else', () => {
  const base = { ...ENVELOPE, id: 'x', created: '2026-09-04' };
  assert.deepEqual(at4({ ...base, authors: [CSHAPES] }).origin, { tool: 'cshapes' });
  assert.deepEqual(at4({ ...base, authors: [DRAFT] }).origin, { tool: 'assistant' });
  // The import created it; the assistant drafted a summary onto it later. The
  // creator is the one that made the record, which is the first author.
  assert.deepEqual(at4({ ...base, authors: [WIKIDATA, DRAFT] }).origin, { tool: 'wikidata' });
  // A person wrote it: absent, not a tool nobody can name.
  assert.equal(Object.hasOwn(at4({ ...base, authors: [{ name: 'A Person', github: null }] }), 'origin'), false);
  // Written once. A record that already says who made it is not re-answered.
  const signed = { ...base, authors: [CSHAPES], origin: { tool: 'form', run: 'issue-12' } };
  assert.deepEqual(at4(signed).origin, { tool: 'form', run: 'issue-12' });
});

test('migration 4: the draft marker becomes review.status, and the queue is the same records', () => {
  const base = { ...ENVELOPE, id: 'x', created: '2026-09-04' };
  assert.deepEqual(at4({ ...base, authors: [DRAFT] }).review, { status: 'draft' });
  assert.deepEqual(at4({ ...base, authors: [DRAFT], review: { flags: ['date'] } }).review, { status: 'draft', flags: ['date'] });
  // No marker, no status: an imported record nobody drafted a word of is not
  // in the queue today and is not put into it by a migration.
  assert.equal(at4({ ...base, authors: [WIKIDATA], review: { flags: ['imported-facts'] } }).review.status, undefined);
  // A status already there is the record's own.
  const reviewed = { ...base, authors: [DRAFT], review: { status: 'reviewed', signedBy: [{ name: 'A Reviewer', github: null, on: '2026-09-05' }] } };
  assert.equal(at4(reviewed).review.status, 'reviewed');
});

test('migration 4: the retraction leaves the note and becomes the record\'s own history', () => {
  const base = {
    ...ENVELOPE, id: 'x', status: 'retracted', created: '2026-09-03', revised: '2026-09-04', authors: [DRAFT],
  };
  const whole = at4({ ...base, review: { flags: ['m21-retracted'], note: 'Retracted in M21: it could not be wired.' } });
  assert.deepEqual(whole.retraction, { on: '2026-09-04', reason: 'Retracted in M21: it could not be wired.' });
  assert.equal(Object.hasOwn(whole.review, 'note'), false, 'the retraction is not left in two places');
  assert.deepEqual(whole.review.flags, ['m21-retracted']);

  // A note that says something else *before* the retraction keeps that half:
  // a thing for a reviewer to look at is not history.
  const both = at4({ ...base, review: { flags: ['date'], note: 'No date here has been checked. Retracted by the owner on 2026-09-04: no consequence.' } });
  assert.deepEqual(both.retraction, { on: '2026-09-04', reason: 'Retracted by the owner on 2026-09-04: no consequence.' });
  assert.equal(both.review.note, 'No date here has been checked.');

  // An active record with a note about a past retraction is not a tombstone.
  const active = at4({ ...base, status: 'active', review: { note: 'Retracted in M21 and reinstated in M22.' } });
  assert.equal(Object.hasOwn(active, 'retraction'), false);
  assert.equal(active.review.note, 'Retracted in M21 and reinstated in M22.');
});

test('migration 4: sitelinks carries the day the count was read, and comes back a number', () => {
  const base = { ...ENVELOPE, id: 'x', created: '2026-09-03', revised: '2026-09-04', authors: [DRAFT] };
  assert.deepEqual(at4({ ...base, sitelinks: 7 }).sitelinks, { count: 7, on: '2026-09-04' });
  // Zero is a count, not a gap.
  assert.deepEqual(at4({ ...base, sitelinks: 0 }).sitelinks, { count: 0, on: '2026-09-04' });
  // Never revised: the day it was written is the day it was read.
  assert.deepEqual(at4({ ...base, revised: null, sitelinks: 2 }).sitelinks, { count: 2, on: '2026-09-03' });
  assert.equal(migrationAt(4).down({ ...base, sitelinks: { count: 7, on: '2026-09-04' } }).sitelinks, 7);
});

test('migration 4 refuses to take a signature back, because there is nowhere to put one', () => {
  const signed = {
    ...ENVELOPE, id: 'x', created: '2026-09-04', authors: [{ name: 'A Reviewer', github: null }],
    review: { status: 'reviewed', signedBy: [{ name: 'A Reviewer', github: null, on: '2026-09-05' }] },
  };
  assert.throws(() => migrationAt(4).down(signed), /signed record has no shape before it/);
  assert.throws(() => rollbackRecord(signed, { to: 3 }), /signed record has no shape before it/);
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

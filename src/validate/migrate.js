// The migration chain: how a record written against an older shape becomes
// one this version of the atlas can read.
//
// Pure and ordered, with no `fs` anywhere in it, because the same array has
// to run in three places — `tools/lib/read.mjs` before the validator and the
// index builder see a record, `tools/migrate/apply.mjs` when the tree itself
// is rewritten, and the browser, which loads records straight from `data/`
// (docs/review-2026-09-05-health-plan.md, finding 5: a migration applied on
// read and nowhere else wedges `validate --index`, the deploy and the import
// loop; one applied on disk and nowhere else leaves every fork's records
// unreadable the day after).
//
// A migration is `{ version, name, up(record), down(record) }`:
//
// - `version` is this step's number in the chain, and **not** the record's
//   `schema`. A record says which schema it is written against; a migration
//   says which step of the chain has been applied to the tree. Most
//   migrations — every one so far — are additive within one schema, so
//   SCHEMA_VERSION in core.js stays 1 and is bumped only by a migration that
//   makes a record genuinely unreadable by the validator before it.
// - `up` is idempotent. Nothing on disk records how far a record has been
//   migrated (a per-record chain marker would be a field the schema does not
//   have and a byte in every file), so the chain is simply applied whole,
//   every time, and every step has to survive being applied to a record that
//   has already had it.
// - `up` never mutates: it returns the record it was given when there is
//   nothing to do, and a new object when there is. It runs over every record
//   on every read, so the common case has to cost nothing.
// - `down` is the inverse, or null where a step cannot be undone. The writer
//   refuses to roll back past a step with no `down` rather than writing a
//   tree it cannot get back from.
//
// Adding one: append it here with the next version number, write its `up`,
// its `down` and a test, and — if it changes bytes on disk — run
// `node tools/migrate/apply.mjs` in the same commit, so the tree and the
// chain are never a commit apart.

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// The envelope keys that are required and whose absence means "nothing here"
// rather than "unknown": a record written before the envelope closed, or by a
// fork that never had them, is repaired instead of refused.
const ENVELOPE_DEFAULTS = Object.freeze({
  supersededBy: null,
  aliases: [],
  revised: null,
});

export const MIGRATIONS = Object.freeze([
  {
    version: 1,
    name: 'envelope-defaults',
    // Additive, and a no-op on every record in this repository: they all
    // carry the three keys already. It exists for records that do not — a
    // fork's, an older export, a contribution written by hand against the
    // documentation rather than the schema — and because the fields H5b adds
    // to the envelope ride on this step rather than on an empty chain.
    up(record) {
      if (!isObject(record)) return record;
      const missing = Object.keys(ENVELOPE_DEFAULTS).filter((key) => !Object.hasOwn(record, key));
      if (!missing.length) return record;
      const out = { ...record };
      for (const key of missing) {
        const value = ENVELOPE_DEFAULTS[key];
        out[key] = Array.isArray(value) ? [...value] : value;
      }
      return out;
    },
    // Removing a key that says "null" from a record that has to have it would
    // make the record invalid, so this step is where the chain stops going
    // backwards.
    down: null,
  },
  {
    version: 2,
    name: 'review-citations-explicit',
    // `review` carries the box the per-citation checks go in, empty when
    // nobody has checked anything, instead of leaving the reader of the file
    // to know that an absent key means the same as an empty one.
    //
    // Trivial and exactly reversible on purpose: it is what proves the chain
    // and the on-disk writer before anything that matters rides on them, and
    // migration 3 takes it straight back off, so the tree this run leaves
    // behind is byte for byte the tree it found.
    up(record) {
      if (!isObject(record) || !isObject(record.review) || isObject(record.review.citations)) return record;
      return { ...record, review: { ...record.review, citations: {} } };
    },
    down(record) {
      if (!isObject(record) || !isObject(record.review) || !isObject(record.review.citations)) return record;
      if (Object.keys(record.review.citations).length) return record;
      const review = { ...record.review };
      delete review.citations;
      return { ...record, review };
    },
  },
  {
    version: 3,
    name: 'review-citations-implicit',
    // Migration 2, undone: an empty `citations` says nothing an absent one
    // does not, and the shape the records were written in is the shape they
    // keep. Its `up` is 2's `down` and its `down` is 2's `up` — which is what
    // a reversible pair means, and what the test asserts rather than assumes.
    up(record) {
      return MIGRATIONS[1].down(record);
    },
    down(record) {
      return MIGRATIONS[1].up(record);
    },
  },
]);

// The chain's last step: what `read.mjs` migrates to and what the tree on
// disk is expected to be at.
export const LATEST = MIGRATIONS.length ? MIGRATIONS[MIGRATIONS.length - 1].version : 0;

export function migrationAt(version) {
  return MIGRATIONS.find((m) => m.version === version) ?? null;
}

// Every `up` from `from` (exclusive) to `to` (inclusive), in order. The
// default is the whole chain, because nothing records where a record is:
// `up` is idempotent and applying all of it is the only honest answer.
export function migrateRecord(record, { from = 0, to = LATEST } = {}) {
  let out = record;
  for (const migration of MIGRATIONS) {
    if (migration.version <= from || migration.version > to) continue;
    out = migration.up(out);
  }
  return out;
}

// Every `down` from the chain's end back to `to` (inclusive), in reverse. A
// step with no `down` stops it: better a refusal than a tree that cannot be
// brought back.
export function rollbackRecord(record, { from = LATEST, to } = {}) {
  if (!Number.isInteger(to)) throw new Error('rollbackRecord needs the version to roll back to');
  let out = record;
  for (let i = MIGRATIONS.length - 1; i >= 0; i -= 1) {
    const migration = MIGRATIONS[i];
    if (migration.version > from || migration.version <= to) continue;
    if (typeof migration.down !== 'function') {
      throw new Error(`migration ${migration.version} (${migration.name}) cannot be undone`);
    }
    out = migration.down(out);
  }
  return out;
}

// Applied to a list, keeping the order it was given in.
export function migrateRecords(records, options) {
  return (records ?? []).map((record) => migrateRecord(record, options));
}

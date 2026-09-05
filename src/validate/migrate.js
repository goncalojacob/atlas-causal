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

// The author strings the repository wrote before `origin` existed, and the
// writer each one stands for. Frozen literals on purpose: migration 4 is a
// statement about the records that were on disk on 5 September 2026, and it
// has to keep saying the same thing about them after the constants that
// produced these strings are gone — which is what moving the four predicates
// off author names is for.
const DRAFT_MARKER = 'Claude (assistant draft, unreviewed)';
const CREATOR_TOOL = Object.freeze({
  'CShapes 2.0 import (tools/import/cshapes.mjs)': 'cshapes',
  'Wikidata import (tools/import/wikidata.mjs)': 'wikidata',
  [DRAFT_MARKER]: 'assistant',
});

// M21 and M22 wrote every retraction reason as one sentence starting here.
const RETRACTION_TEXT = /Retracted (?:in M[0-9]|by )/;

// Where a key belongs in a record, so that a migration inserting one puts it
// where the schemas declare it. A key nobody has ranked sorts after all of
// them, which is every field past the envelope.
const KEY_ORDER = Object.freeze([
  'schema', 'id', 'kind', 'status', 'supersededBy', 'aliases', 'authors',
  'license', 'created', 'revised', 'origin', 'retraction', 'review',
]);

function rank(key) {
  const at = KEY_ORDER.indexOf(key);
  return at < 0 ? Infinity : at;
}

// A record with its envelope keys where the schemas declare them, and
// everything past the envelope in the order it was written. Exported because
// three writers need it and each had its own copy of the list: a migration
// inserting a key, Sign and Retract, and the Action that writes a
// contribution's records. A key with no rank sorts after all of them, and a
// key whose value is `undefined` is dropped rather than written as nothing.
export function inEnvelopeOrder(record) {
  return Object.fromEntries(Object.entries(record)
    .filter(([, value]) => value !== undefined)
    .sort((a, b) => rank(a[0]) - rank(b[0])));
}

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
  {
    version: 4,
    name: 'envelope-origin-status-retraction',
    // The envelope H5b adds, written onto the records that were here before
    // it: `origin` (who created this record), `review.status` (whether a
    // person has read it), `retraction` (why it is a tombstone) and
    // `sitelinks` as `{ count, on }` rather than a bare number.
    //
    // Nothing here is a historical claim and nothing here is written by hand:
    // every value is read off what the record already says. `origin` comes
    // from the writer named first in `authors`, which is the one that created
    // the record — the assistant's later `summary-drafted` pass appends
    // itself, so a record the Wikidata import made and the assistant then
    // drafted a summary for still has the import as its creator, which is
    // what `origin` means (health review A, findings 22 and 24). A record no
    // machine wrote gets no `origin` at all: absent means a person.
    //
    // The three author strings are literals here and not imports. A migration
    // is a statement about the past, and it has to keep saying the same thing
    // about these 1716 records on the day the code that wrote those strings
    // is gone — which is the whole point of moving the four predicates off
    // them.
    up(record) {
      if (!isObject(record)) return record;
      const additions = {};
      let review = record.review;

      if (!Object.hasOwn(record, 'origin')) {
        const tool = CREATOR_TOOL[(record.authors ?? [])[0]?.name];
        if (tool) additions.origin = { tool };
      }

      // "Unreviewed" was the draft marker anywhere in `authors`, so that is
      // exactly what becomes `review.status: draft`: the queue is the same
      // 485 records the day after this runs as the day before.
      if (isObject(review) ? !Object.hasOwn(review, 'status') : review === undefined) {
        if ((record.authors ?? []).some((a) => a?.name === DRAFT_MARKER)) {
          review = { status: 'draft', ...review };
        }
      }

      // The reason a record is a tombstone was written into `review.note` by
      // M21 and M22, where signing it would delete it (health review B,
      // finding 16). It moves to a field of its own, and what the note said
      // *besides* the retraction — one record has a sentence about an
      // unchecked date in front of it — stays a note, because that is a thing
      // for a reviewer to look at and not history.
      if (record.status === 'retracted' && !Object.hasOwn(record, 'retraction')
        && isObject(review) && typeof review.note === 'string') {
        const at = review.note.search(RETRACTION_TEXT);
        if (at >= 0) {
          const on = record.revised ?? record.created;
          if (typeof on === 'string') {
            additions.retraction = { on, reason: review.note.slice(at).trim() };
            const before = review.note.slice(0, at).trim();
            review = { ...review };
            if (before) review.note = before;
            else delete review.note;
          }
        }
      }

      // A count with no date beside it is a snapshot pretending to be a fact
      // (health review A, finding 23b). The date is the day the record was
      // last written, which is the run that read the count: the import writes
      // both together from here on.
      const sitelinks = typeof record.sitelinks === 'number'
        ? { count: record.sitelinks, on: record.revised ?? record.created }
        : null;
      const reshape = sitelinks && typeof sitelinks.on === 'string';

      // A block whose only content was the retraction says nothing now that
      // the retraction has a field of its own, and an empty one says nothing
      // an absent one does not — the same rule migration 3 applies to
      // `citations`, and what makes the pair with `down` exact.
      if (isObject(review) && !Object.keys(review).length) review = undefined;

      // A record that had no `review` block at all and has a status now needs
      // the key put in its place like any other addition.
      if (review !== record.review && review !== undefined && !Object.hasOwn(record, 'review')) additions.review = review;

      if (!Object.keys(additions).length && review === record.review && !reshape) return record;

      // Written in the envelope's own order — `origin` and `retraction`
      // between `revised` and `review`, where provenance.json declares them —
      // so a migrated file reads like one the form wrote and the diff is the
      // fields and not a reshuffle.
      const out = {};
      const pending = Object.entries(additions).sort((a, b) => rank(a[0]) - rank(b[0]));
      const flush = (limit) => {
        while (pending.length && rank(pending[0][0]) < limit) {
          const [key, value] = pending.shift();
          out[key] = value;
        }
      };
      for (const key of Object.keys(record)) {
        flush(rank(key));
        if (key === 'review') { if (review !== undefined) out.review = review; }
        else if (key === 'sitelinks' && reshape) out.sitelinks = sitelinks;
        else out[key] = record[key];
      }
      flush(Infinity);
      return out;
    },
    // The inverse of what `up` writes, and a refusal for what it does not.
    // `origin` comes back off `authors`, the retraction goes back into the
    // note it was taken from and the count loses the date it was read on,
    // which is `revised` and still on the record: the pair round-trips.
    //
    // A signature does not. `review.status: reviewed` and `review.signedBy`
    // have no shape at all before this step, so rolling a signed record back
    // would not restore an older tree — it would delete the one thing this
    // milestone exists to stop an automated writer from deleting. It refuses
    // instead, per record, rather than the whole step being marked
    // irreversible and taking `--to 2` down with it.
    down(record) {
      if (!isObject(record)) return record;
      const signed = isObject(record.review)
        && (record.review.status === 'reviewed' || record.review.signedBy !== undefined);
      if (signed) {
        throw new Error(`migration 4 cannot take back "${record.id}": a signed record has no shape before it`);
      }
      const hasOrigin = Object.hasOwn(record, 'origin');
      const hasRetraction = Object.hasOwn(record, 'retraction');
      const hasStatus = isObject(record.review) && Object.hasOwn(record.review, 'status');
      const unshape = isObject(record.sitelinks) && typeof record.sitelinks.count === 'number';
      if (!hasOrigin && !hasRetraction && !hasStatus && !unshape) return record;

      const out = { ...record };
      delete out.origin;
      delete out.retraction;
      if (unshape) out.sitelinks = record.sitelinks.count;
      if (hasStatus || hasRetraction) {
        const review = { ...record.review };
        delete review.status;
        if (hasRetraction) {
          const reason = record.retraction?.reason;
          // Back into the note it came from — and only if `up` would read it
          // out again, whole. `up` recognises the sentence M21 and M22 wrote
          // and dates the retraction from `revised`; a retraction written
          // since, in somebody's own words or on another day, has nowhere
          // before this step to be put, and a reason silently demoted to a
          // remark is the loss this field was created to prevent.
          const on = record.revised ?? record.created;
          if (typeof reason !== 'string' || !RETRACTION_TEXT.test(reason) || record.retraction?.on !== on) {
            throw new Error(`migration 4 cannot take back "${record.id}": its retraction would not be read out of a note again`);
          }
          review.note = review.note ? `${review.note} ${reason}` : reason;
        }
        // An empty block says nothing an absent one does not, and a record
        // whose only `review` was the status `up` gave it had none before.
        if (Object.keys(review).length) out.review = review;
        else delete out.review;
      }
      return out;
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

#!/usr/bin/env node
// One-time re-filing, kept so a contributor can see how it was done: the
// twelve `led` relations become tenures of an office, and the relation files
// they came from become retracted tombstones.
//
// It is a tool and not a step of the migration chain (amendment A1). A chain
// step is one record in, one record out, written back to the file it read and
// re-applied on every read for ever; this is a change of kind, of directory
// and of record count — twelve relations out, twelve tenures and six offices
// in — which no chain step can be. `src/validate/migrate.js` is untouched and
// no migration number is consumed.
//
// Nothing historical is added here. Every field of the tenure is a field of
// the relation it came from: the person is `from`, the years are `when`, the
// sources, the note, the whole `review` block and `origin` are carried across
// unchanged, and `created` is the day the relation was written. `revised` is
// the day of the run, because the record was re-filed on that day. The two
// tables below are the only judgements the tool makes, and both come from the
// brief: which office a leadership of the regime polity becomes (the head of
// government of the state, which already exists as a record), and what a
// party's own leadership is called (amendment A4, from the notes the twelve
// records already carry).
//
// Idempotent: a relation already retracted is left alone, and neither an
// office nor a tenure file that exists is overwritten, so a run cut off
// half-way finishes cleanly on the next one.
//
//   node tools/migrate/led-to-tenures.mjs [--data <dir>] [--today YYYY-MM-DD] [--dry-run]

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND_DIRS } from '../lib/read.mjs';
import { retractRecord } from '../../src/review/sign.js';
import { inEnvelopeOrder } from '../../src/validate/migrate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA = path.join(ROOT, 'data');

// Leading a regime is not a party leadership: the Estado Novo's two are turns
// at the head of government of Portugal, and that office is a record M30a-1
// already wrote. An actor not named here has its own office made for it.
export const OFFICE_OF_REGIME = Object.freeze({
  'estado-novo': 'prime-minister-of-portugal',
});

// What each party calls the post, from the notes on the relations themselves
// (amendment A4). A party not named here gets "Leader", which is what the
// atlas can say without reading a party's own statutes.
export const PARTY_OFFICE_TITLE = Object.freeze({
  pcp: 'Secretary-General',
  'partido-socialista': 'Secretary-General',
  paigc: 'Secretary-General',
  frelimo: 'President',
});

export const DEFAULT_PARTY_OFFICE_TITLE = 'Leader';

// A party's office is named for the party, so the twelve old links and the
// six new records read as the same six bodies.
export const officeIdFor = (actor) => `leadership-of-${actor}`;

// `salazar--estado-novo--led` → `salazar-prime-minister-1932`. A tenure's id
// is a free slug precisely so that one person may hold one office more than
// once (plan review, finding 1), and the year is what tells two turns apart.
export function tenureIdFor(relation, officeKey) {
  return `${relation.from}-${officeKey}-${relation.when?.start}`;
}

function officeSummaryOf(title, actor) {
  return `Asserts only that ${actor} has had this post and what it is called: no dates, no sources, and no claim about when it began. Written when the twelve "led" relations were re-filed as tenures (M30a-2); the title is the one the relations' own notes give it, and "${title}" is not a claim about the party's statutes.`;
}

// The office a relation's `to` end becomes a turn at, and the key its tenure
// id is built from. Two shapes and no third: a regime whose leadership is an
// office the atlas already has, or a body whose leadership becomes one.
export function officeFor(relation) {
  const existing = OFFICE_OF_REGIME[relation.to];
  if (existing) {
    // `prime-minister-of-portugal` → `prime-minister`: the state is already
    // said by the person and the years, and the id stays readable.
    const key = existing.replace(/-of-[a-z0-9-]+$/, '');
    return { id: existing, key, create: false };
  }
  return { id: officeIdFor(relation.to), key: relation.to, create: true };
}

function envelopeFrom(relation, { id, kind, today, sources = [] }) {
  const out = {
    schema: relation.schema ?? 1,
    id,
    kind,
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: (relation.authors ?? []).map((a) => ({ name: a.name, github: a.github ?? null })),
    license: relation.license ?? 'CC-BY-SA-4.0',
    created: relation.created ?? today,
    revised: today,
    sources,
  };
  // `origin` says who created the record and the tenure was created by
  // re-filing one the assistant drafted, so it is the relation's own answer
  // and not this tool's: nothing here wrote a word of history.
  if (relation.origin) out.origin = { ...relation.origin };
  return out;
}

// The office a body's leadership becomes. It asserts that the post exists and
// what it is called, and nothing else: `when: null`, no sources (rule 6
// exempts an office as it exempts a place), and the draft marker the
// relations carry, because nobody has read this either.
export function officeRecord(relation, { id, title, today }) {
  return inEnvelopeOrder({
    ...envelopeFrom(relation, { id, kind: 'office', today, sources: [] }),
    // Unlike the tenure, an office is a record that did not exist before
    // today: nothing was re-filed into it, so it is created now and has never
    // been revised. Only its authorship and its draft standing come from the
    // relations it was read off.
    created: today,
    revised: null,
    // The office inherits the standing of the records it was read off and
    // invents none: the twelve are drafts, so the six are, and nobody has
    // read this one either. A relation that records no standing gives the
    // office none — writing `draft` onto a corpus that has never claimed one
    // would put a status on it that migration 4 could not reconstruct after a
    // rollback, which is deviation 307's reason for the fixtures having none.
    review: relation.review ? { status: 'draft', note: officeSummaryOf(title, relation.to) } : undefined,
    of: relation.to,
    title,
    category: 'party-leadership',
    when: null,
    summary: null,
  });
}

// The tenure the relation becomes. Every field is the relation's own.
export function tenureRecord(relation, { id, office, today }) {
  return inEnvelopeOrder({
    ...envelopeFrom(relation, { id, kind: 'tenure', today, sources: relation.sources ?? [] }),
    // The whole block, `flags` and `note` and all: the twelve `date` flags
    // are the reason these records are in the review queue and they must not
    // leave it because the record changed kind (amendment A4).
    review: relation.review ? structuredClone(relation.review) : undefined,
    person: relation.from,
    office,
    when: relation.when,
    // No `led` relation names one; an election that began a tenure is M31's
    // to write, and guessing one here would be an invented claim.
    startedBy: null,
    note: typeof relation.note === 'string' ? relation.note : null,
  });
}

// It opens with the sentence migration 4 knows how to read back out of a
// note, and the retraction is dated the day the record was revised, because
// `down` refuses a reason it could not put back and the round trip under
// every migration is the one safety net there is (migrate.js, RETRACTION_TEXT).
export function tombstoneReason(relation, tenureId) {
  return `Retracted in M30a-2 and re-filed as the tenure "${tenureId}": who led a body is an office somebody held and not a link between two actors, because a relation's id is from--to--type and one person may lead one body more than once. The type "led" is deprecated and no active relation may take it; nothing this record claimed was changed in the move.`;
}

// The plan, worked out in memory: which offices to write, which tenures, and
// what each relation becomes. Pure, so a test can check it on a scratch copy
// of the fixtures without touching the repository's own data.
//
// `existing` is the ids already taken — a second run's, or the three offices
// M30a-1 wrote — so nothing collides with what is already on disk.
export function planTenures(relations, { today, existingOffices = new Set(), existingTenures = new Set() } = {}) {
  const ordered = [...relations].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const offices = new Map();
  const tenures = [];
  const tombstones = [];
  const skipped = [];
  const collisions = [];

  for (const relation of ordered) {
    if (relation.type !== 'led') continue;
    if (relation.status !== 'active') {
      skipped.push(relation.id);
      continue;
    }
    const office = officeFor(relation);
    if (office.create && !offices.has(office.id) && !existingOffices.has(office.id)) {
      const title = PARTY_OFFICE_TITLE[relation.to] ?? DEFAULT_PARTY_OFFICE_TITLE;
      offices.set(office.id, officeRecord(relation, { id: office.id, title, today }));
    }
    const id = tenureIdFor(relation, office.key);
    if (existingTenures.has(id) || tenures.some((t) => t.id === id)) {
      // Two turns begun in one year at one office cannot be told apart by the
      // id, and the tool will not invent a suffix for a person: it says so
      // and leaves both records alone.
      collisions.push({ id, relation: relation.id });
      continue;
    }
    tenures.push(tenureRecord(relation, { id, office: office.id, today }));
    tombstones.push({ id: relation.id, record: retractRecord(relation, { today, reason: tombstoneReason(relation, id) }), tenure: id });
  }

  return { offices: [...offices.values()].sort((a, b) => (a.id < b.id ? -1 : 1)), tenures, tombstones, skipped, collisions };
}

async function readKind(dataDir, kind) {
  const dir = path.join(dataDir, KIND_DIRS[kind]);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    out.push({ file: path.join(dir, name), record: JSON.parse(await readFile(path.join(dir, name), 'utf8')) });
  }
  return out;
}

const idsIn = async (dataDir, kind) => new Set((await readKind(dataDir, kind)).map((r) => r.record.id));

const write = (file, record) => writeFile(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let today = new Date().toISOString().slice(0, 10);
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--today') today = argv[++i];
    else if (argv[i] === '--dry-run') dryRun = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }

  const relations = await readKind(dataDir, 'relation');
  const byId = new Map(relations.map((r) => [r.record.id, r.file]));
  const plan = planTenures(relations.map((r) => r.record), {
    today,
    existingOffices: await idsIn(dataDir, 'office'),
    existingTenures: await idsIn(dataDir, 'tenure'),
  });

  for (const { id, relation } of plan.collisions) {
    console.error(`error: "${relation}" wants the tenure id "${id}", which is taken. Name it by hand and re-run.`);
  }
  if (plan.collisions.length) return 1;

  const officesDir = path.join(dataDir, KIND_DIRS.office);
  const tenuresDir = path.join(dataDir, KIND_DIRS.tenure);
  if (!dryRun && (plan.offices.length || plan.tenures.length)) {
    await mkdir(officesDir, { recursive: true });
    await mkdir(tenuresDir, { recursive: true });
  }

  for (const office of plan.offices) {
    const file = path.join(officesDir, `${office.id}.json`);
    if (existsSync(file)) {
      console.log(`kept    ${office.id} (already written)`);
      continue;
    }
    if (!dryRun) await write(file, office);
    console.log(`office  ${office.id.padEnd(34)} ${office.title} of ${office.of}`);
  }

  for (const tenure of plan.tenures) {
    const file = path.join(tenuresDir, `${tenure.id}.json`);
    if (existsSync(file)) {
      console.log(`kept    ${tenure.id} (already written)`);
      continue;
    }
    if (!dryRun) await write(file, tenure);
    console.log(`tenure  ${tenure.id.padEnd(34)} ${tenure.person} at ${tenure.office}, ${tenure.when?.start}–${tenure.when?.end ?? ''}`);
  }

  for (const { id, record, tenure } of plan.tombstones) {
    const file = byId.get(id);
    if (!file) continue;
    if (!dryRun) await write(file, record);
    console.log(`retract ${id.padEnd(46)} → ${tenure}`);
  }

  console.log(`${plan.offices.length} office(s), ${plan.tenures.length} tenure(s), ${plan.tombstones.length} tombstone(s), ${plan.skipped.length} already re-filed${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (plan.tenures.length) console.log('now run node tools/validate.mjs and node tools/build-index.mjs');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

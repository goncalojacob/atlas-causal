#!/usr/bin/env node
// One-time re-filing, kept so a contributor can see how it was done: every
// actor line's free-text role becomes one of the 31 ids of `data/roles.json`,
// and the phrase it used to be is kept beside it as the line's `note`.
//
//   { "actor": "cavaco-silva", "role": "came first and led the government" }
//   → { "actor": "cavaco-silva", "role": "head-of-government",
//       "note": "came first and led the government" }
//
// It is a tool and not a step of `src/validate/migrate.js`'s chain (brief §1).
// A chain step is re-applied on every read for ever, and a table of 163
// historical phrases written in September 2026 is not something a reader in
// 2030 should carry around in memory. `src/validate/migrate.js` is untouched
// and no migration number is consumed.
//
// Nothing historical is added. The mapping below decides two things about a
// line and no more — which of the 31 ids it takes, and whether the old phrase
// is kept — and both come from `docs/roles-mapping.md`, the table the owner
// approved on 5 September, which `tests/roles-migrate.test.mjs` holds this
// file to row for row. No summary, no date, no edge, no source and no
// `origin` is touched, and no author is added: re-filing a phrase is not
// authorship (tools/import/identity.mjs is the house rule).
//
// Idempotent: a role already in the vocabulary is left alone, so a run cut
// off half-way finishes cleanly on the next one.
//
//   node tools/migrate/roles.mjs [--data <dir>] [--today YYYY-MM-DD] [--dry-run]

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND_DIRS, readRoles } from '../lib/read.mjs';
import { normalizeRole } from '../../src/validate/rules.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA = path.join(ROOT, 'data');

// `docs/roles-mapping.md`'s three load-bearing columns, in its own order:
// [ Role in use, Becomes, Note kept ]. A `null` third cell is the document's
// em-dash — "the old role said nothing the new one does not" — and means no
// `note` key is written at all rather than an empty one.
//
// The `Count` column is deliberately absent: it is stale (five rows disagree
// with the corpus and it sums to 340 against 349 actor lines), and a count is
// not part of the mapping. The `Example event` column is prose for a reader.
//
// The third cell decides *whether* a note is kept and is never itself the note
// written: the note is the record's own `role` string, character for character
// (amendment A1), because the lookup folds case and twelve of the corpus's
// strings differ from their folded form by capitalisation alone.
export const MAPPING = Object.freeze([
  ["leader", "leader", null],
  ["prime minister", "head-of-government", null],
  ["opposition party", "opposition", null],
  ["target", "target", null],
  ["belligerent", "belligerent", null],
  ["government", "government", null],
  ["deposed", "deposed", null],
  ["signatory", "signatory", null],
  ["president", "head-of-state", "president"],
  ["governing party", "government", null],
  ["founded", "founder", null],
  ["author", "author", null],
  ["lender", "creditor", null],
  ["coalition party", "party", "coalition party"],
  ["lost office", "opposition", "lost office"],
  ["candidate", "candidate", null],
  ["withdrew", "opposition", "withdrew"],
  ["legislator", "author", "legislator"],
  ["elected", "elected", null],
  ["party leader", "leader", "party leader"],
  ["borrower", "debtor", null],
  ["the state holding the election", "government", "the state holding the election"],
  ["the state putting the question", "government", "the state putting the question"],
  ["victim", "victim", null],
  ["winner", "elected", null],
  ["the regime holding the election", "government", "the regime holding the election"],
  ["the regime filling its own presidency", "government", "the regime filling its own presidency"],
  ["president under whom it was held", "head-of-state", "president under whom it was held"],
  ["won a majority of the new assembly", "party", "won a majority of the new assembly"],
  ["the state creating the region", "government", "the state creating the region"],
  ["led the winning alliance", "leader", "led the winning alliance"],
  ["partner in the winning alliance", "party", "partner in the winning alliance"],
  ["re-elected", "head-of-state", "re-elected"],
  ["backed the losing candidate", "opposition", "backed the losing candidate"],
  ["came first and led the government", "head-of-government", "came first and led the government"],
  ["in opposition", "opposition", "in opposition"],
  ["junior partner", "party", "junior partner"],
  ["returned to the regional government without a majority", "head-of-government", "returned to the regional government without a majority"],
  ["commander", "commander", null],
  ["negotiator", "negotiator", null],
  ["created", "government", "created"],
  ["constituted", "government", "constituted"],
  ["resigned", "resigned", null],
  ["opponent", "belligerent", "opponent"],
  ["declared it", "government", "declared it"],
  ["admitting body", "member", "admitting body"],
  ["host", "host", null],
  ["supporting party", "party", "supporting party"],
  ["appointed", "appointed", null],
  ["signed as prime minister", "head-of-government", "signed as prime minister"],
  ["largest party, 62 seats", "party", "largest party, 62 seats"],
  ["king in whose name it was called", "head-of-state", "king in whose name it was called"],
  ["outgoing head of government", "head-of-government", "outgoing head of government"],
  ["won 229 of 234 seats", "party", "won 229 of 234 seats"],
  ["the regime being constituted", "government", "the regime being constituted"],
  ["elected first president", "head-of-state", "elected first president"],
  ["the regime whose office was filled", "government", "the regime whose office was filled"],
  ["won 106 of 163 seats in the Chamber", "party", "won 106 of 163 seats in the Chamber"],
  ["leader of the winning party", "leader", "leader of the winning party"],
  ["the regime restored by the May rising", "government", "the regime restored by the May rising"],
  ["won the largest share", "party", "won the largest share"],
  ["sole candidate, elected president", "head-of-state", "sole candidate, elected president"],
  ["the regime seeking a constitutional form", "government", "the regime seeking a constitutional form"],
  ["dissolved the Assembly and set the terms", "leader", "dissolved the Assembly and set the terms"],
  ["sole party, took all 120 seats", "party", "sole party, took all 120 seats"],
  ["opposition front, withdrew before the poll", "opposition", "opposition front, withdrew before the poll"],
  ["opposition candidate, withdrew", "opposition", "opposition candidate, withdrew"],
  ["re-elected unopposed for a fourth term", "head-of-state", "re-elected unopposed for a fourth term"],
  ["broke up the opposition campaign", "commander", "broke up the opposition campaign"],
  ["won the territorial government", "party", "won the territorial government"],
  ["re-elected for a second term", "head-of-state", "re-elected for a second term"],
  ["held every seat of the electing assembly", "government", "held every seat of the electing assembly"],
  ["called the election as his opening", "leader", "called the election as his opening"],
  ["took all 130 seats", "party", "took all 130 seats"],
  ["returned for a third term", "head-of-state", "returned for a third term"],
  ["as ANP, took all 150 seats", "party", "as ANP, took all 150 seats"],
  ["head of government", "head-of-government", null],
  ["stood clandestinely inside the CDE lists", "party", "stood clandestinely inside the CDE lists"],
  ["sole legal party and sole list", "party", "sole legal party and sole list"],
  ["the state being founded", "government", "the state being founded"],
  ["departing colonial power", "government", "departing colonial power"],
  ["the state constituting local power", "government", "the state constituting local power"],
  ["sole legal party", "party", "sole legal party"],
  ["junior partner in the Bloco Central", "party", "junior partner in the Bloco Central"],
  ["prime minister from June 1983", "head-of-government", "prime minister from June 1983"],
  ["came first and formed a minority government", "head-of-government", "came first and formed a minority government"],
  ["prime minister from November 1985", "head-of-government", "prime minister from November 1985"],
  ["the parliament being elected to", "government", "the parliament being elected to"],
  ["won a second absolute majority", "party", "won a second absolute majority"],
  ["won and formed a minority government", "head-of-government", "won and formed a minority government"],
  ["lost office after ten years", "opposition", "lost office after ten years"],
  ["the successor sovereign", "government", "the successor sovereign"],
  ["lost the main cities and the government", "head-of-government", "lost the main cities and the government"],
  ["won Lisbon and Porto", "party", "won Lisbon and Porto"],
  ["won its first absolute majority", "party", "won its first absolute majority"],
  ["called the referendum and legislated on the result", "leader", "called the referendum and legislated on the result"],
  ["returned without a majority", "party", "returned without a majority"],
  ["won and led the coalition government", "head-of-government", "won and led the coalition government"],
  ["chose a new secretary-general", "leader", "chose a new secretary-general"],
  ["held the primary", "government", "held the primary"],
  ["won it and took the leadership", "leader", "won it and took the leadership"],
  ["chose a new leader", "leader", "chose a new leader"],
  ["won the leadership", "leader", "won the leadership"],
  ["chose its leader and candidate for prime minister", "leader", "chose its leader and candidate for prime minister"],
  ["led the minority government that was censured", "head-of-government", "led the minority government that was censured"],
  ["removed", "government", "removed"],
  ["divided", "government", "divided"],
  ["claimed responsibility", "perpetrator", "claimed responsibility"],
  ["colonial administration responsible", "government", "colonial administration responsible"],
  ["defeated", "opposition", "defeated"],
  ["resolution authority", "leader", "resolution authority"],
  ["resolved", "government", "resolved"],
  ["executive chairman", "leader", "executive chairman"],
  ["nationalised it", "government", "nationalised it"],
  ["movement", "movement", null],
  ["alleged accomplice", "perpetrator", "alleged accomplice"],
  ["successor", "government", "successor"],
  ["replaced", "government", "replaced"],
  ["planner", "leader", "planner"],
  ["figurehead", "head-of-state", "figurehead"],
  ["organiser", "leader", "organiser"],
  ["superseded", "government", "superseded"],
  ["abolished", "government", "abolished"],
  ["perpetrator", "perpetrator", null],
  ["backer", "supporter", "backer"],
  ["administered", "government", "administered"],
  ["invader", "invader", null],
  ["acceded", "elected", "acceded"],
  ["applicant", "applicant", null],
  ["adopter", "government", "adopter"],
  ["patron", "supporter", "patron"],
  ["annexed it", "invader", "annexed it"],
  ["dispossessed", "government", "dispossessed"],
  ["led the campaign for a No vote", "leader", "led the campaign for a No vote"],
  ["occupying power", "occupier", null],
  ["negotiated and signed for Portugal", "signatory", "negotiated and signed for Portugal"],
  ["the regime whose foreign policy it set", "government", "the regime whose foreign policy it set"],
  ["founder", "founder", null],
  ["incumbent", "head-of-state", "incumbent"],
  ["opposition leader", "leader", "opposition leader"],
  ["outgoing party", "opposition", "outgoing party"],
  ["king, killed in the attack", "head-of-state", "king, killed in the attack"],
  ["heir apparent, killed in the attack", "victim", "heir apparent, killed in the attack"],
  ["younger son, succeeded to the throne", "elected", "younger son, succeeded to the throne"],
  ["head of the government the attack targeted", "head-of-government", "head of the government the attack targeted"],
  ["sheltered and armed the gunmen", "perpetrator", "sheltered and armed the gunmen"],
  ["outgoing president", "head-of-state", "outgoing president"],
  ["party of origin", "party", "party of origin"],
  ["invoked", "government", "invoked"],
  ["colonial power whose troops fired", "commander", "colonial power whose troops fired"],
  ["founding member", "founder", "founding member"],
  ["discredited", "opposition", "discredited"],
  ["excluded", "opposition", "excluded"],
  ["supporter", "supporter", null],
  ["proposed the regions", "leader", "proposed the regions"],
  ["campaigned against", "opposition", "campaigned against"],
  ["restored", "government", "restored"],
  ["beneficiary", "supporter", "beneficiary"],
  ["outgoing", "opposition", "outgoing"],
  ["acceding state", "member", "acceding state"],
  ["the Communities being joined", "government", "the Communities being joined"],
  ["admitted", "elected", "admitted"],
  ["head of state", "head-of-state", null],].map(Object.freeze));

// Folded once, as the validator folds a role (`normalizeRole`), because the
// corpus already holds strings that differ only in case.
export const TABLE = new Map(MAPPING.map(([use, becomes, note]) => [normalizeRole(use), { becomes, note }]));

// The ids the table can produce. It is the fallback vocabulary for a dataset
// with no `data/roles.json` — the fixtures are one — because "a role already
// in the list is left alone" needs a list, and an absent file must not mean
// an empty one (M30a, amendment A8).
export const TARGETS = Object.freeze([...new Set(MAPPING.map(([, becomes]) => becomes))].sort());

// What happens to one actor line. Pure, and the whole of the tool's judgement:
// a role already in the vocabulary is done, a line somebody has already
// written a note on is not this tool's to touch, and a role with no row is
// refused rather than guessed at (brief §5, item 1).
export function refileLine(line, known) {
  const role = typeof line?.role === 'string' ? line.role : '';
  if (known.has(role)) return { action: 'kept' };
  if (line?.note !== undefined) return { action: 'noted' };
  const row = TABLE.get(normalizeRole(role));
  if (!row) return { action: 'unmapped', role };
  // The note is the line's own string and never the folded key or the
  // document's column (amendment A1).
  return { action: 'refiled', role: row.becomes, note: row.note === null ? undefined : role };
}

// One record in, the same record out, mutated in place: an actor line keeps
// the key order it had and a new `note` follows the role, which is where the
// contribution form puts it too. Returns what changed, so the caller can
// report it without reading the record again.
export function refileRecord(record, known) {
  const lines = Array.isArray(record?.actors) ? record.actors : [];
  const refiled = [];
  const noted = [];
  const skipped = [];
  const unmapped = [];
  for (const line of lines) {
    const outcome = refileLine(line, known);
    if (outcome.action === 'unmapped') { unmapped.push(outcome.role); continue; }
    if (outcome.action === 'noted') { skipped.push(line.role); continue; }
    if (outcome.action === 'kept') continue;
    const was = line.role;
    line.role = outcome.role;
    if (outcome.note !== undefined) { line.note = outcome.note; noted.push(was); }
    refiled.push(was);
  }
  return { refiled, noted, skipped, unmapped, changed: refiled.length > 0 };
}

async function readEvents(dataDir) {
  const dir = path.join(dataDir, KIND_DIRS.event);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(dir, name);
    out.push({ file, record: JSON.parse(await readFile(file, 'utf8')) });
  }
  return out;
}

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

  // The dataset's own vocabulary where it has one; the table's targets where
  // it has none. Never an empty set: see TARGETS.
  const vocabulary = await readRoles(dataDir);
  const known = new Set(vocabulary ? vocabulary.map((row) => row.id) : TARGETS);

  const events = await readEvents(dataDir);
  const unmapped = new Map();
  const skipped = [];
  const reviewed = [];
  let files = 0;
  let refiled = 0;
  let noted = 0;
  let lines = 0;
  let inactive = 0;

  for (const { file, record } of events) {
    lines += Array.isArray(record.actors) ? record.actors.length : 0;
    // A signature was given against what the record said, and a `reviewed`
    // record is not this tool's to re-file (amendment A9). There are none
    // today; the run reports any there are and leaves them for a person.
    if (record.review?.status === 'reviewed') {
      if (Array.isArray(record.actors) && record.actors.length) reviewed.push(record.id);
      continue;
    }
    const outcome = refileRecord(record, known);
    for (const role of outcome.unmapped) unmapped.set(role, (unmapped.get(role) ?? 0) + 1);
    for (const role of outcome.skipped) skipped.push(`${record.id}: "${role}"`);
    if (!outcome.changed) continue;
    files += 1;
    refiled += outcome.refiled.length;
    noted += outcome.noted.length;
    if (record.status !== 'active') inactive += 1;
    // The record was re-filed today; nothing else about it changed.
    record.revised = today;
    if (!dryRun) await write(file, record);
    console.log(`${record.id.padEnd(56)} ${outcome.refiled.length} line(s), ${outcome.noted.length} note(s)`);
  }

  for (const [role, count] of [...unmapped].sort()) {
    console.error(`error: the role ${JSON.stringify(role)} (${count} line(s)) has no row in docs/roles-mapping.md. The owner decides where it goes; this tool does not guess.`);
  }
  for (const line of skipped) console.log(`kept    ${line} (the line already carries a note)`);
  for (const id of reviewed) console.log(`kept    ${id} (reviewed: a signature was given against what it says)`);

  console.log(`${events.length} event(s), ${lines} actor line(s): ${refiled} re-filed in ${files} file(s), ${noted} of them with a note kept; ${skipped.length} line(s) left for their note, ${reviewed.length} record(s) left as reviewed, ${inactive} inactive file(s) changed${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (unmapped.size) return 1;
  if (files && !dryRun) console.log('now run node tools/validate.mjs and node tools/build-index.mjs');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

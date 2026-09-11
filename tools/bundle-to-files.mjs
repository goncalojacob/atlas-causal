#!/usr/bin/env node
// The issue body → record files, for .github/workflows/contribution.yml.
//
// This is the one place in the project where text written by a stranger
// becomes a file path in a branch that a token can push, so it is written to
// be read (docs/review-2026-09-01.md, finding 8):
//
//   - every id is checked against the slug regex — the edge pattern for
//     edges, the relation pattern for relations — BEFORE any path is built,
//     so "../../.github/workflows/x.yml" is rejected as an id and never
//     reaches the filesystem;
//   - the only directories it can write to are the three record ones, and
//     the file name is path.basename of an id already proved to contain no
//     separator, with the resolved path checked against the directory again;
//   - the body arrives through an environment variable, never through
//     `run:` interpolation in the workflow.
//
// It writes records unchanged except for provenance: authors come from the
// issue opener, not from the form, and the dates come from the clock.
//
//   ISSUE_BODY=… ISSUE_AUTHOR=octocat node tools/bundle-to-files.mjs [--correction] [--data <dir>]

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SLUG, EDGE_ID, RELATION_ID } from '../src/validate/rules.js';
import { checkBundleShape } from '../src/contribute/bundle.js';
import { inEnvelopeOrder } from '../src/validate/migrate.js';
import { KIND_DIRS } from './lib/read.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DATA = path.join(ROOT, 'data');

// An issue body is at most 65,536 characters on GitHub; the cap here is
// generous and exists so that a pathological body is refused before it is
// parsed rather than after.
export const MAX_BODY = 256 * 1024;
export const MAX_RECORDS = 200;
export const MAX_ID = 260;

class BundleError extends Error {}

function fail(message) {
  throw new BundleError(message);
}

// Every balanced {...} in the text, outermost first, so the JSON can be
// found inside an issue-form body ("### The bundle\n\n{ … }") as well as
// inside a fenced block. Strings and escapes are respected: a brace inside
// an explanation does not end the object.
// The attempt cap keeps a body of nothing but opening braces from turning
// this scan quadratic.
export const MAX_CANDIDATES = 50;

function* balancedObjects(text) {
  let attempts = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '{') continue;
    attempts += 1;
    if (attempts > MAX_CANDIDATES) return;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let j = i; j < text.length; j += 1) {
      const c = text[j];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') inString = true;
      else if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) {
          yield text.slice(i, j + 1);
          i = j;
          break;
        }
      }
    }
  }
}

export function extractBundle(body) {
  if (typeof body !== 'string' || body.trim() === '') fail('the issue body is empty: nothing to write');
  if (body.length > MAX_BODY) fail(`the issue body is ${body.length} characters, over the ${MAX_BODY} cap`);

  const fenced = [...body.matchAll(/```[a-z]*\s*\n([\s\S]*?)```/g)].map((m) => m[1]);
  let lastError = null;
  for (const text of [...fenced, body]) {
    for (const candidate of balancedObjects(text)) {
      let parsed;
      try {
        parsed = JSON.parse(candidate);
      } catch (e) {
        lastError = e;
        continue;
      }
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) return parsed;
    }
  }
  fail(lastError
    ? `no bundle found in the issue body; the closest thing to JSON did not parse: ${lastError.message}`
    : 'no bundle found in the issue body: expected a JSON object with a "records" array');
  return null;
}

// A JSON document may carry an own "__proto__" key. Nothing here would
// assign it anywhere dangerous, but a record that contains one is not a
// record, and writing it back out would put it in the repository.
function forbiddenKey(value, at = '') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = forbiddenKey(value[i], `${at}/${i}`);
      if (found) return found;
    }
    return null;
  }
  if (value === null || typeof value !== 'object') return null;
  for (const key of Object.keys(value)) {
    if (key === '__proto__') return `${at}/__proto__`;
    const found = forbiddenKey(value[key], `${at}/${key}`);
    if (found) return found;
  }
  return null;
}

// Ids are checked here, before any path exists. Returns the records with the
// directory each one belongs to; throws on the first thing it cannot vouch
// for, listing everything wrong with the ids at once.
export function checkBundle(bundle) {
  const shape = checkBundleShape(bundle);
  if (shape.length) fail(shape.map((p) => `${p.path || 'bundle'}: ${p.message}`).join('; '));
  if (bundle.records.length > MAX_RECORDS) {
    fail(`${bundle.records.length} records in one bundle, over the ${MAX_RECORDS} cap`);
  }
  const found = forbiddenKey(bundle, 'bundle');
  if (found) fail(`the bundle contains a "__proto__" key at ${found}`);

  const problems = [];
  const seen = new Set();
  const checked = [];
  bundle.records.forEach((record, i) => {
    const where = `records[${i}]`;
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      problems.push(`${where} is not a JSON object`);
      return;
    }
    const dir = KIND_DIRS[record.kind];
    if (!dir) {
      problems.push(`${where}: unknown kind ${JSON.stringify(record.kind)}; expected ${Object.keys(KIND_DIRS).join(', ')}`);
      return;
    }
    const id = record.id;
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID) {
      problems.push(`${where}: id must be a string of 1 to ${MAX_ID} characters`);
      return;
    }
    // An edge id and a relation id have the same shape and different
    // vocabularies, and neither is a slug: the pattern is chosen by kind so
    // that an edge type can never stand in a relation's id or the reverse.
    const pattern = record.kind === 'edge' ? EDGE_ID : record.kind === 'relation' ? RELATION_ID : SLUG;
    if (!pattern.test(id)) {
      const shape = record.kind === 'edge' ? 'from--to--type edge id'
        : record.kind === 'relation' ? 'from--to--type relation id' : 'slug';
      problems.push(`${where}: id ${JSON.stringify(id)} is not a ${shape}`);
      return;
    }
    // The regexes above already forbid a separator, a dot and everything
    // else a path could be built out of; this is the assertion that says so
    // out loud, next to the only line that turns an id into a file name.
    if (path.basename(id) !== id || id.includes('/') || id.includes('\\') || id.startsWith('.')) {
      problems.push(`${where}: id ${JSON.stringify(id)} is not a bare file name`);
      return;
    }
    if (seen.has(id)) {
      problems.push(`${where}: id ${JSON.stringify(id)} appears twice in the bundle`);
      return;
    }
    seen.add(id);
    checked.push({ record, dir, id });
  });
  if (problems.length) fail(problems.join('; '));
  return checked;
}

function opener(login, name) {
  return { name: (typeof name === 'string' && name.trim()) || login, github: login };
}

// The flag every contributed record carries into the review queue. A
// maintainer filtering the dashboard by it sees exactly what arrived from
// outside and has not been read yet.
export const CONTRIBUTED = 'contributed';

// What a contribution's `review` block says. Three things, and each of them
// is a fact about how far the record has been read rather than a claim about
// the world: nobody has read it (`draft`, which is what puts it in the
// queue), it came from outside (`contributed`), and this is the issue it came
// from. Before H6a it said none of them — the merged record was
// indistinguishable from a maintainer's own, the queue never saw it, and the
// pull request was the whole audit trail (health review A, finding 30).
//
// What a person did to the record before is kept: the citations they ticked
// and the signatures they left are history, and history is not the Action's
// to delete. `status` going back to `draft` is what says the record has
// changed since and wants reading again.
export function reviewFor(record, { existing = null, issue = null } = {}) {
  const before = existing?.review;
  const kept = before !== null && typeof before === 'object' && !Array.isArray(before) ? before : {};
  const flags = [...new Set([...(Array.isArray(kept.flags) ? kept.flags : []), CONTRIBUTED])].sort();
  const review = { ...kept, status: 'draft', flags };
  review.note = issue === null ? kept.note ?? null : `issue #${issue}`;
  if (review.note === null) delete review.note;
  return review;
}

// Provenance is not the contributor's to assert (finding 9): the handle
// comes from the issue opener and the dates from the clock. A correction
// keeps the original authors and appends the person correcting it.
export function applyProvenance(record, { author, today, existing = null, issue = null }) {
  const incoming = Array.isArray(record.authors) ? record.authors : [];
  if (existing) {
    const previous = Array.isArray(existing.authors) ? existing.authors : [];
    record.authors = previous.some((a) => a?.github === author)
      ? previous
      : [...previous, opener(author, incoming[0]?.name)];
    record.created = typeof existing.created === 'string' ? existing.created : today;
    record.revised = today;
    // `origin` is written once, by whatever created the record (rule 29): a
    // correction is not the creation, so what the file already says stands.
    if (existing.origin !== undefined) record.origin = existing.origin;
    else delete record.origin;
  } else {
    record.authors = [opener(author, incoming[0]?.name)];
    record.created = today;
    record.revised = null;
    // Which writer made this record: the contribution pipeline, which is what
    // `form` names in the schema's own enum.
    record.origin = { tool: 'form' };
  }
  record.review = reviewFor(record, { existing, issue });
  return inEnvelopeOrder(record);
}

// Rule 11's cascade, offered instead of enforced.
//
// A stranger's correction that says "this event is wrong, retract it" used to
// bounce out of the Action with rule 11 errors about edges they never saw:
// an active edge to a retracted event is invalid, and nothing told them so or
// did anything about it (health review A, finding 29). `retractionPlan` is
// what the review dashboard runs before it retracts; this runs the same
// function over the same topology and writes the records the retraction
// carries with it — the edges into and out of the event, the narratives that
// walk them — each with the reason that says it followed rather than a
// second argument nobody made.
//
// What it cannot carry, it reports. An actor, a place or a source that other
// records point *at* would have to be rewritten rather than retracted, and
// rewriting somebody's record is not a cascade: those come back as blockers,
// the Action fails, and the plan is in the comment the failure leaves on the
// issue.
async function cascadeRetractions({ dataDir, retracted, today: on }) {
  if (retracted.length === 0) return { written: [], blockers: [] };
  const { readRecords, readRegions } = await import('./lib/read.mjs');
  const { buildTopology } = await import('../src/validate/core.js');
  const { retractionPlan, retractRecord, carriedReason } = await import('../src/review/sign.js');

  const { entries } = await readRecords(dataDir);
  const topology = buildTopology(entries.map((e) => e.record), await readRegions(dataDir));
  const fileOf = new Map(entries.map((e) => [e.record.id, path.join(dataDir, e.file)]));

  const written = [];
  const blockers = [];
  const done = new Set(retracted.map((r) => r.id));
  for (const record of retracted) {
    const plan = retractionPlan(record, topology);
    for (const blocker of plan.blockers) blockers.push({ ...blocker, because: record.id });
    for (const item of plan.retract) {
      if (done.has(item.id)) continue;
      done.add(item.id);
      const file = fileOf.get(item.id);
      if (!file) continue;
      const before = JSON.parse(await readFile(file, 'utf8'));
      if (before.status !== 'active') continue;
      const after = retractRecord(before, { today: on, reason: carriedReason(record.id) });
      await writeFile(file, `${JSON.stringify(after, null, 2)}\n`, 'utf8');
      written.push({ path: `data/${KIND_DIRS[item.kind]}/${item.id}.json`, kind: item.kind, id: item.id, carried: record.id });
    }
  }
  return { written, blockers };
}

export async function bundleToFiles(bundle, {
  dataDir = DEFAULT_DATA, author, today, correction = false, issue = null,
} = {}) {
  // GitHub's own rule: alphanumerics and single inner hyphens. Stricter
  // than the schema's pattern for `github` on purpose — this value reaches
  // a git author string in the workflow, and a login starting with a hyphen
  // would be read there as a flag.
  if (typeof author !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(author)) {
    fail(`the issue opener ${JSON.stringify(author)} is not a GitHub login`);
  }
  const checked = checkBundle(bundle);

  const planned = [];
  for (const { record, dir, id } of checked) {
    const directory = path.join(dataDir, dir);
    const file = path.join(directory, `${path.basename(id)}.json`);
    if (path.dirname(path.resolve(file)) !== path.resolve(directory)) {
      fail(`${id} would be written outside data/${dir}/`);
    }
    const exists = existsSync(file);
    if (exists && !correction) {
      fail(`data/${dir}/${id}.json already exists; file a correction (the correction label) to replace a record`);
    }
    planned.push({ record, dir, id, file, directory, exists });
  }

  const written = [];
  // The records this correction turns into tombstones, and were not already:
  // what the cascade is computed from, after the bundle itself is on disk.
  const retracted = [];
  for (const item of planned) {
    const existing = item.exists ? JSON.parse(await readFile(item.file, 'utf8')) : null;
    const record = applyProvenance(item.record, { author, today, existing, issue });
    await mkdir(item.directory, { recursive: true });
    await writeFile(item.file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    written.push({ path: `data/${item.dir}/${item.id}.json`, kind: record.kind, id: item.id, replaced: item.exists });
    if (correction && record.status === 'retracted' && existing?.status === 'active') retracted.push(record);
  }

  const cascade = correction
    ? await cascadeRetractions({ dataDir, retracted, today })
    : { written: [], blockers: [] };
  return { written, cascade };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let correction = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--correction') correction = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  try {
    const bundle = extractBundle(process.env.ISSUE_BODY ?? '');
    const issue = /^[0-9]{1,10}$/.test(process.env.ISSUE_NUMBER ?? '') ? Number(process.env.ISSUE_NUMBER) : null;
    const { written, cascade } = await bundleToFiles(bundle, {
      dataDir,
      author: process.env.ISSUE_AUTHOR ?? '',
      today: today(),
      correction,
      issue,
    });
    for (const item of written) console.log(`${item.replaced ? 'replaced' : 'wrote'} ${item.path}`);
    console.log(`${written.length} record(s) from the issue; now run node tools/validate.mjs`);
    // The plan, either way: what the retraction carried with it, and what it
    // could not. Both go to stdout, which the workflow tees into the pull
    // request body on success and into the issue comment on failure.
    for (const item of cascade.written) {
      console.log(`retracted ${item.path} — it stands on ${item.carried} (rule 11)`);
    }
    if (cascade.blockers.length) {
      console.error(`${cascade.blockers.length} record(s) point at something this correction retracts, and a retraction cannot carry them:`);
      for (const b of cascade.blockers) console.error(`  ${b.kind} ${b.id} ${b.why} ${b.because}`);
      fail('rewrite or retract those records in the same bundle, or leave the record active');
    }
    return 0;
  } catch (error) {
    console.error(error instanceof BundleError ? error.message : `${error.name}: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

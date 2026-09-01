#!/usr/bin/env node
// The issue body → record files, for .github/workflows/contribution.yml.
//
// This is the one place in the project where text written by a stranger
// becomes a file path in a branch that a token can push, so it is written to
// be read (docs/review-2026-09-01.md, finding 8):
//
//   - every id is checked against the slug regex — the edge pattern for
//     edges — BEFORE any path is built, so "../../.github/workflows/x.yml"
//     is rejected as an id and never reaches the filesystem;
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
import { SLUG, EDGE_ID } from '../src/validate/rules.js';
import { checkBundleShape } from '../src/contribute/bundle.js';
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
      problems.push(`${where}: unknown kind ${JSON.stringify(record.kind)}; expected event, edge or source`);
      return;
    }
    const id = record.id;
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID) {
      problems.push(`${where}: id must be a string of 1 to ${MAX_ID} characters`);
      return;
    }
    const pattern = record.kind === 'edge' ? EDGE_ID : SLUG;
    if (!pattern.test(id)) {
      problems.push(`${where}: id ${JSON.stringify(id)} is not a ${record.kind === 'edge' ? 'from--to--type edge id' : 'slug'}`);
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

// Provenance is not the contributor's to assert (finding 9): the handle
// comes from the issue opener and the dates from the clock. A correction
// keeps the original authors and appends the person correcting it.
export function applyProvenance(record, { author, today, existing = null }) {
  const incoming = Array.isArray(record.authors) ? record.authors : [];
  if (existing) {
    const previous = Array.isArray(existing.authors) ? existing.authors : [];
    record.authors = previous.some((a) => a?.github === author)
      ? previous
      : [...previous, opener(author, incoming[0]?.name)];
    record.created = typeof existing.created === 'string' ? existing.created : today;
    record.revised = today;
  } else {
    record.authors = [opener(author, incoming[0]?.name)];
    record.created = today;
    record.revised = null;
  }
  return record;
}

export async function bundleToFiles(bundle, { dataDir = DEFAULT_DATA, author, today, correction = false } = {}) {
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
  for (const item of planned) {
    const existing = item.exists ? JSON.parse(await readFile(item.file, 'utf8')) : null;
    applyProvenance(item.record, { author, today, existing });
    await mkdir(item.directory, { recursive: true });
    await writeFile(item.file, `${JSON.stringify(item.record, null, 2)}\n`, 'utf8');
    written.push({ path: `data/${item.dir}/${item.id}.json`, kind: item.record.kind, id: item.id, replaced: item.exists });
  }
  return written;
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
    const written = await bundleToFiles(bundle, {
      dataDir,
      author: process.env.ISSUE_AUTHOR ?? '',
      today: today(),
      correction,
    });
    for (const item of written) console.log(`${item.replaced ? 'replaced' : 'wrote'} ${item.path}`);
    console.log(`${written.length} record(s) from the issue; now run node tools/validate.mjs`);
    return 0;
  } catch (error) {
    console.error(error instanceof BundleError ? error.message : `${error.name}: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

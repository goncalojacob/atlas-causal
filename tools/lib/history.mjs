// A record's history: when it was written, what changed at each revision,
// and when each signature was added.
//
// The review dashboard had none (health review A, finding 31), so a reviewer
// opening a record could not see whether it had been touched since it was
// drafted, or by what. The obvious way — a `git log` endpoint on
// `tools/serve.mjs` — was refused there and here: that server's whole
// security argument is that it does one thing, and shelling out to git for a
// path a page names is a second thing. So the history is a static file per
// record, written by `build-index` where every record is already in hand, and
// the dashboard fetches one when a record is opened (review of the health
// plan, finding 19).
//
// **A version is identified by the record's own content, never by the commit
// that carried it.** No commit hash and no commit date is written. That is
// not squeamishness about git: `node tools/validate.mjs --index` asserts that
// the committed index is what a fresh build produces, and a build made
// before a change is committed must therefore agree with one made after. The
// content is the same on both sides of that commit; the commit metadata is
// not. So the version's date is the record's own `revised` at that version,
// and its identity is the set of fields that changed.
//
// git supplies the intermediate states and nothing else. Where it cannot —
// no repository, no git, a shallow clone, a record nothing has committed yet
// — the history falls back to what the record itself says: the day it was
// created and the day it was last revised, with the changed fields unknown.
//
// A shallow clone is refused outright rather than read for what it holds
// (`isShallow` below). It is the one case where git answers and the answer is
// wrong: every record looks as though it was written once and never touched,
// and the file says `from: 'git'` about it. The deploy checked out one commit
// deep until 6 September and committed those histories over the full ones.

import { spawn } from 'node:child_process';
import path from 'node:path';
import { KIND_DIRS } from '../../src/kinds.js';
import { versionsOf, versionsFromRevised } from '../../src/review/history.js';

export const HISTORY_DIR = 'history';

// --- git -------------------------------------------------------------------

function run(command, args, { cwd, input = null, limit = 64 * 1024 * 1024 } = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, stdio: ['pipe', 'pipe', 'ignore'] });
    } catch {
      resolve(null);
      return;
    }
    const chunks = [];
    let size = 0;
    let overflowed = false;
    child.on('error', () => resolve(null));
    child.stdout.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { overflowed = true; child.kill(); return; }
      chunks.push(chunk);
    });
    child.on('close', (code) => resolve(code === 0 && !overflowed ? Buffer.concat(chunks) : null));
    if (input !== null) child.stdin.end(input);
    else child.stdin.end();
  });
}

// The commits that added or changed a record file, newest first, as
// `[[sha, repo-relative path], …]`. Renames are not followed: a record that
// moved directory changed kind, which is a different record.
async function changedPaths(repo, dirs) {
  const out = await run('git', ['log', '--format=%H', '--name-only', '--diff-filter=AM', '--', ...dirs], { cwd: repo });
  if (out === null) return null;
  const pairs = [];
  let sha = null;
  for (const line of out.toString('utf8').split('\n')) {
    if (line === '') continue;
    if (/^[0-9a-f]{40}$/.test(line)) { sha = line; continue; }
    if (sha) pairs.push([sha, line]);
  }
  return pairs;
}

// One `git cat-file --batch` for every blob the histories need. Spawning one
// process per version is what makes the obvious implementation of this
// unusable; the requests go down one pipe and the answers come back in the
// order they were asked for.
async function readBlobs(repo, requests) {
  if (requests.length === 0) return new Map();
  const out = await run('git', ['cat-file', '--batch'], { cwd: repo, input: `${requests.join('\n')}\n` });
  if (out === null) return null;
  const found = new Map();
  let at = 0;
  for (const request of requests) {
    const nl = out.indexOf(0x0a, at);
    if (nl < 0) break;
    const header = out.toString('utf8', at, nl);
    at = nl + 1;
    const parts = header.split(' ');
    // "<oid> missing" — a path that did not exist in that commit, which the
    // --diff-filter above should have ruled out, and is skipped if it happens.
    if (parts.length < 3) continue;
    const size = Number(parts[2]);
    if (!Number.isFinite(size)) return null;
    const text = out.toString('utf8', at, at + size);
    at += size + 1;
    try {
      found.set(request, JSON.parse(text));
    } catch {
      // A record that was not valid JSON at that commit is a version with
      // nothing to say about it, not a failed build.
    }
  }
  return found;
}

// Is `dataDir` inside a git work tree, and which directory is its root?
async function repoOf(dataDir) {
  const out = await run('git', ['rev-parse', '--show-toplevel'], { cwd: dataDir });
  return out === null ? null : out.toString('utf8').trim() || null;
}

// A clone with a horizon rather than a history. `git log` answers on one of
// these — with whatever it happens to hold — so nothing about the answer says
// it is short: a `--depth 1` checkout produced one version for every record
// and a build that looked exactly like a good one (health review of
// 6 September, R1). Asked outright, git says so, and the histories fall back
// to `revised` for the whole tree rather than quietly inventing a corpus in
// which nothing has ever been revised.
export async function isShallow(repo) {
  const out = await run('git', ['rev-parse', '--is-shallow-repository'], { cwd: repo });
  return out === null ? true : out.toString('utf8').trim() === 'true';
}

// The history of every record handed in. → { from, histories }, where `from`
// is 'git' when the states came out of the repository and 'revised' when the
// records' own two dates are all there was.
//
// `records` carries `kind` and `id`; the file each lives in is derived the
// same way `bundle-to-files.mjs` derives it, from the registry.
export async function recordHistories(records, { dataDir, git = true } = {}) {
  const wanted = records.filter((r) => r?.id && KIND_DIRS[r?.kind]);
  const found = git ? await repoOf(dataDir) : null;
  // A shallow repository is not half a history, it is a different one, and
  // `from: 'git'` over it would be a claim this file cannot support.
  const repo = found && !(await isShallow(found)) ? found : null;
  const prefix = repo ? path.relative(repo, dataDir).split(path.sep).filter(Boolean) : [];
  const pathOf = (record) => [...prefix, KIND_DIRS[record.kind], `${record.id}.json`].join('/');
  let states = null;

  if (repo) {
    const byPath = new Set(wanted.map(pathOf));
    const dirs = [...new Set(wanted.map((r) => [...prefix, KIND_DIRS[r.kind]].join('/')))].sort();
    const pairs = await changedPaths(repo, dirs);
    if (pairs) {
      // Oldest first, which is the order a history reads in. `git log` gives
      // the reverse, and the pairs of one commit keep their order within it.
      const wantedPairs = pairs.filter(([, file]) => byPath.has(file)).reverse();
      const blobs = await readBlobs(repo, wantedPairs.map(([sha, file]) => `${sha}:${file}`));
      if (blobs) {
        states = new Map();
        for (const [sha, file] of wantedPairs) {
          const blob = blobs.get(`${sha}:${file}`);
          if (blob === undefined) continue;
          if (!states.has(file)) states.set(file, []);
          states.get(file).push(blob);
        }
      }
    }
  }

  const from = states ? 'git' : 'revised';
  const histories = wanted.map((record) => {
    const known = states?.get(pathOf(record));
    return {
      schema: 1,
      id: record.id,
      kind: record.kind,
      from: states && known ? 'git' : 'revised',
      versions: states && known ? versionsOf(known, record) : versionsFromRevised(record),
    };
  }).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { from, histories };
}

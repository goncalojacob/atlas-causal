// Which test files start a browser and which do not, so that the check can run
// the two kinds differently.
//
// The suite is two kinds of test in one directory: 129 files are pure — they
// read records, build an index, render into a string — and 18 launch a real
// headless Chromium. Run together at node's default concurrency the browser
// files land on the same cores as each other and as the pure ones, and what
// gives way is never an assertion but a `waitFor`: the page is still fetching
// when the wait runs out, and the test that drops is whichever was at that
// point in its file. That is deviations 826, 844 and 876, and the numbers are
// docs/m63-load.md. The browser suites therefore run one at a time and the
// pure ones stay parallel, which is 244s against the 379s of serialising
// everything.
//
// A file is a browser suite if it imports tests/browser.mjs — the driven
// browser — or calls findChrome, which is how the --dump-dom suites launch one
// of their own. Nothing is listed by hand: a browser suite written next month
// is in the serial pass the day it is written, and a list of names somebody
// has to remember to add to is exactly what this is not.
//
//   node tools/suites.mjs --browser   the suites that start a browser
//   node tools/suites.mjs --pure      the ones that do not
//
// One path per line on stdout, for `$(...)` in a workflow; the counts on
// stderr, so a job's log says what it ran and a pass that suddenly names
// fewer files is visible rather than quiet.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The same files `node --test` finds on its own, which is the whole point: a
// file neither pass names is a file the check silently stops running. So the
// walk is the repository rather than tests/, and it refuses nothing but the
// two directories node itself refuses.
async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else if (entry.name.endsWith('.test.mjs')) found.push(full);
  }
  return found;
}

const STARTS_A_BROWSER = /from '\.\/browser\.mjs'|findChrome/;

export async function suites() {
  const files = (await walk(ROOT)).sort();
  const browser = [];
  const pure = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    (STARTS_A_BROWSER.test(source) ? browser : pure).push(path.relative(ROOT, file));
  }
  return { browser, pure };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode !== '--browser' && mode !== '--pure') {
    process.stderr.write('usage: node tools/suites.mjs --browser | --pure\n');
    process.exit(2);
  }
  const { browser, pure } = await suites();
  // An empty pass would hand the runner no files at all, and `node --test`
  // with no files goes back to discovering them itself — the whole suite, at
  // the default concurrency, which is the arrangement this exists to end. It
  // would look green and be the old red check waiting to happen.
  if (browser.length === 0 || pure.length === 0) {
    process.stderr.write(`found ${browser.length} browser suite(s) and ${pure.length} pure: one of the two passes would be empty\n`);
    process.exit(1);
  }
  process.stderr.write(`${browser.length} browser suite(s), ${pure.length} pure, ${browser.length + pure.length} in all\n`);
  process.stdout.write(`${(mode === '--browser' ? browser : pure).join('\n')}\n`);
}

// The plumbing under .github/, checked without a YAML parser (zero
// dependencies). These are not style assertions: each one is a finding from
// docs/review-2026-09-01.md that would be invisible until the day it bit.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

const WORKFLOWS = path.join(ROOT, '.github', 'workflows');
const TEMPLATES = path.join(ROOT, '.github', 'ISSUE_TEMPLATE');

const read = (dir, name) => readFile(path.join(dir, name), 'utf8');

// Every line of every `run:` block, with the file and line it came from.
function runLines(text) {
  const lines = text.split('\n');
  const out = [];
  let indent = null;
  lines.forEach((line, i) => {
    if (indent !== null) {
      const width = line.length - line.trimStart().length;
      if (line.trim() === '' || width > indent) {
        out.push({ line, number: i + 1 });
        return;
      }
      indent = null;
    }
    const match = /^(\s*)(?:- )?run:\s*(.*)$/.exec(line);
    if (match) {
      if (match[2] && match[2] !== '|' && match[2] !== '>') out.push({ line: match[2], number: i + 1 });
      indent = match[1].length;
    }
  });
  return out;
}

test('no workflow interpolates anything into a shell command', async () => {
  // ${{ }} inside run: is shell injection the day an issue body reaches it,
  // with a token that can push (finding 8). Values arrive through env:.
  for (const name of await readdir(WORKFLOWS)) {
    const text = await read(WORKFLOWS, name);
    for (const { line, number } of runLines(text)) {
      assert.ok(!line.includes('${{'), `${name}:${number} interpolates into a shell command: ${line.trim()}`);
    }
  }
});

// Not a YAML parser — this repository ships none and will not — but the
// mistakes that actually get made in a workflow file are a tab, an odd
// indent, or a block scalar whose body is level with its key, and each of
// those is findable without one. A file that passes this and still does not
// parse fails on the runner, loudly, on a branch nobody has merged.
test('every workflow file is indented like YAML', async () => {
  for (const name of await readdir(WORKFLOWS)) {
    const lines = (await read(WORKFLOWS, name)).split('\n');
    let block = null;
    lines.forEach((line, i) => {
      const at = `${name}:${i + 1}`;
      assert.ok(!line.includes('\t'), `${at} has a tab in it`);
      if (line.trim() === '') return;
      const indent = line.length - line.trimStart().length;
      assert.equal(indent % 2, 0, `${at} is indented by ${indent}`);
      if (block !== null) {
        if (indent > block) return;
        block = null;
      }
      if (/^\s*(- )?[A-Za-z_][\w.-]*:\s*[|>][-+]?\s*$/.test(line)) {
        block = indent;
        const body = lines[i + 1] ?? '';
        assert.ok(body.length - body.trimStart().length > indent, `${at} opens a block whose body is not indented under it`);
        return;
      }
      // Outside a block, a line is a key, a list item, or a comment.
      assert.match(line.trim(), /^(#|- |[A-Za-z_'"][^:]*:|[A-Za-z_][\w.-]*:)/, `${at} is neither a key, a list item nor a comment`);
    });
  }
});

test('contribution.yml runs only on the maintainer label, with the scoped PAT', async () => {
  const text = await read(WORKFLOWS, 'contribution.yml');
  assert.match(text, /on:\s*\n\s*issues:\s*\n\s*types:\s*\[labeled\]/);
  assert.match(text, /if:\s*github\.event\.label\.name == 'accepted'/);
  assert.match(text, /secrets\.CONTRIBUTION_PAT/);
  // Absent secret: a clear message, not a mysterious 403 halfway through.
  assert.match(text, /if \[ -z "\$PAT" \]; then/);
  assert.match(text, /::error::The repository secret CONTRIBUTION_PAT is not set\./);
  // The checkout, the push and the PR all use the PAT: a PR opened with
  // GITHUB_TOKEN gets no CI at all (finding 2).
  assert.match(text, /token: \$\{\{ secrets\.CONTRIBUTION_PAT \}\}/);
  assert.match(text, /GH_TOKEN: \$\{\{ secrets\.CONTRIBUTION_PAT \}\}/);
  assert.match(text, /ISSUE_BODY: \$\{\{ github\.event\.issue\.body \}\}/);
  assert.match(text, /node tools\/bundle-to-files\.mjs --correction/);
  assert.match(text, /node tools\/validate\.mjs/);
  assert.match(text, /gh pr create/);
  assert.match(text, /branch, commit and push/i);
  assert.match(text, /if: failure\(\)/);
  // The catalogue lookup is a reading aid and never fails the run.
  assert.match(text, /continue-on-error: true/);
});

test('the index is built on main, and checked on a pull request that changes data/', async () => {
  const validate = await read(WORKFLOWS, 'validate.yml');
  assert.match(validate, /on:\s*\n\s*pull_request:/);
  // Never built and never committed here: that is deploy.yml's, on main, so
  // two open pull requests cannot conflict on the index.
  assert.doesNotMatch(validate, /build-index/);
  assert.doesNotMatch(validate, /git commit/);
  // But checked, when the records it is an index of have changed. The step is
  // conditional on that and on nothing else: a pull request that touches no
  // record has no index to be stale (review of the health plan, finding 16).
  assert.match(validate, /node tools\/validate\.mjs --index/);
  assert.match(validate, /if: steps\.data\.outputs\.touched == 'true'/);
  assert.match(validate, /git diff --name-only "\$BASE_SHA" "\$HEAD_SHA" -- data\//);
  // The base commit is only there to diff against with the full history.
  assert.match(validate, /fetch-depth: 0/);
  const deploy = await read(WORKFLOWS, 'deploy.yml');
  assert.match(deploy, /concurrency:\s*\n\s*group: deploy\s*\n\s*cancel-in-progress: false/);
  assert.match(deploy, /node tools\/build-index\.mjs/);
  assert.match(deploy, /node tools\/validate\.mjs --index/);
  // One job: build the index, commit it, upload that same checkout, deploy.
  // Two jobs would deploy a checkout that does not carry the index it built.
  const jobs = deploy.slice(deploy.indexOf('\njobs:'));
  assert.deepEqual(jobs.match(/^ {2}[a-z-]+:$/gm), ['  deploy:']);
});

test('the import Action runs only on import branches and never on m0', async () => {
  const text = await read(WORKFLOWS, 'import-wikidata.yml');
  // A dispatch would resolve on the default branch, which has no workflows
  // (docs/review-2026-09-04-plan.md, finding 1), so the trigger is the push.
  assert.match(text, /on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*- 'import\/\*\*'/);
  // The header explains why it is not a dispatch, so the check is on the
  // triggers rather than on the word appearing in the file at all.
  assert.doesNotMatch(text.slice(text.indexOf('\non:')), /workflow_dispatch/);
  // The branch names the mode; anything else stops the job rather than
  // guessing which of three things somebody meant.
  for (const mode of ['reconcile', 'candidates', 'run']) {
    assert.match(text, new RegExp(`import/${mode}-\\*\\)`), `${mode} is a branch prefix the job understands`);
  }
  assert.match(text, /does not name a mode/);
  // Nothing is pushed that has not validated, and a failure puts data/ back.
  // The index is rebuilt before the tree is checked, because the suite the
  // job runs checks the index against the tree: an import that wrote a record
  // and left data/index/ behind fails rule 16 on its own output.
  const order = ['wikidata.mjs', 'build-index.mjs', 'tools/validate.mjs --index', 'node --test', 'git commit', 'git push'];
  let at = -1;
  for (const step of order) {
    const next = text.indexOf(step, at + 1);
    assert.ok(next > at, `${step} comes after everything before it in the batch loop`);
    at = next;
  }
  assert.match(text, /git checkout -- data\//);
  assert.match(text, /timeout-minutes: 90/);
  // The branch it pushes to is the one it was triggered by, and never m0.
  assert.doesNotMatch(text, /push origin m0/);
  assert.match(text, /HEAD:\$BRANCH/);
  assert.match(text, /import: done/);
});

test('the site never carries the cached Wikipedia leads', async () => {
  const deploy = await read(WORKFLOWS, 'deploy.yml');
  const remove = deploy.indexOf('rm -rf tools/import/cache');
  const upload = deploy.indexOf('upload-pages-artifact');
  assert.ok(remove !== -1 && remove < upload, 'the cache is removed before the artifact is built');
});

test('both issue templates take a bundle and require the licence grant', async () => {
  const names = (await readdir(TEMPLATES)).sort();
  assert.deepEqual(names, ['config.yml', 'contribution.yml', 'correction.yml']);
  assert.match(await read(TEMPLATES, 'config.yml'), /blank_issues_enabled: false/);
  for (const name of ['contribution.yml', 'correction.yml']) {
    const text = await read(TEMPLATES, name);
    assert.match(text, /^ {4}id: bundle$/m, `${name} has one textarea called bundle`);
    assert.match(text, /labels: \["contribution"/, `${name} auto-applies a label that triggers nothing`);
    assert.match(text, /CC BY-SA 4\.0/, `${name} states the licence grant`);
    assert.match(text, /generated by a language model/, `${name} asks for the text to be the contributor's own`);
    // Three required checkboxes plus the required textarea.
    assert.ok((text.match(/required: true/g) ?? []).length >= 4, `${name} makes the grant required`);
    assert.doesNotMatch(text, /^\s*render:/m, `${name}: a rendered textarea cannot be trusted with URL prefill`);
  }
  assert.match(await read(TEMPLATES, 'correction.yml'), /labels: \["contribution", "correction"\]/);
});

test('the review checklist and CODEOWNERS still cover data and the plumbing', async () => {
  const template = await readFile(path.join(ROOT, '.github', 'PULL_REQUEST_TEMPLATE.md'), 'utf8');
  assert.match(template, /written by a person/);
  const owners = await readFile(path.join(ROOT, '.github', 'CODEOWNERS'), 'utf8');
  assert.match(owners, /^\/data\//m);
  assert.match(owners, /^\/\.github\//m);
});

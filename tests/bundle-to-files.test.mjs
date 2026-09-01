// The one place where a stranger's text becomes a file path. Half of these
// tests are the attacks: path traversal in an id, an unknown kind, an
// overwrite, a body that is not a bundle at all.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { extractBundle, checkBundle, applyProvenance, bundleToFiles, MAX_BODY } from '../tools/bundle-to-files.mjs';

const OPTIONS = { author: 'fixture-opener', today: '2026-09-02' };

function event(id, over = {}) {
  return {
    schema: 1,
    id,
    kind: 'event',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: 'Fixture Contributor', github: null }],
    license: 'CC-BY-SA-4.0',
    created: '1970-01-01',
    revised: null,
    sources: [{ source: 'fixture-source-1', locator: null }],
    title: 'Fixture event new',
    summary: 'A synthetic event, written for a test.',
    when: { start: 1300, end: 1300 },
    where: null,
    region: 'fixture-lane-1',
    actors: [],
    ...over,
  };
}

async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-bundle-'));
  for (const sub of ['events', 'edges', 'sources']) await mkdir(path.join(dir, sub), { recursive: true });
  return dir;
}

test('the bundle is found fenced, unfenced, or inside an issue-form body', () => {
  const bundle = { schema: 1, records: [event('fixture-event-new')] };
  const json = JSON.stringify(bundle, null, 2);
  assert.deepEqual(extractBundle(json), bundle);
  assert.deepEqual(extractBundle('```json\n' + json + '\n```'), bundle);
  assert.deepEqual(extractBundle('```\n' + json + '\n```'), bundle);
  assert.deepEqual(
    extractBundle(`### The bundle\n\n${json}\n\n### Licence and authorship\n\n- [X] I publish this under CC BY-SA 4.0.\n`),
    bundle,
  );
  // A brace inside a text field does not end the object.
  const braced = { schema: 1, records: [event('fixture-event-new', { summary: 'A synthetic summary with a } and a { in it.' })] };
  assert.deepEqual(extractBundle(`### The bundle\n\n${JSON.stringify(braced)}\n`), braced);
});

test('a body with no bundle in it is refused, not guessed at', () => {
  assert.throws(() => extractBundle(''), /empty/);
  assert.throws(() => extractBundle('   '), /empty/);
  assert.throws(() => extractBundle('Please add the conquest of somewhere, thanks!'), /no bundle found/);
  assert.throws(() => extractBundle('{ "records": [ '), /no bundle found/);
  assert.throws(() => extractBundle('```json\n{ "records": [1,2,} }\n```'), /did not parse/);
  assert.throws(() => extractBundle('{}'), /no bundle found/);
  assert.throws(() => extractBundle('x'.repeat(MAX_BODY + 1)), /over the/);
});

test('an id that is a path is rejected before any path is built', async () => {
  const dir = await scratch();
  const hostile = [
    '../../.github/workflows/deploy.yml',
    '../../../etc/passwd',
    'events/../../secret',
    '.hidden',
    'UPPER-CASE',
    'has space',
    'trailing-',
    'a/b',
    'a\\b',
    '',
    'x'.repeat(300),
  ];
  for (const id of hostile) {
    const bundle = { schema: 1, records: [event(id)] };
    assert.throws(() => checkBundle(bundle), /is not a|must be a string/, `id ${JSON.stringify(id)} must be refused`);
    await assert.rejects(bundleToFiles(bundle, { ...OPTIONS, dataDir: dir }), /is not a|must be a string/);
  }
  // An edge id must be from--to--type, not merely a slug.
  const edge = { schema: 1, records: [{ ...event('fixture-event-a--fixture-event-b--invented'), kind: 'edge' }] };
  assert.throws(() => checkBundle(edge), /from--to--type/);
  assert.throws(() => checkBundle({ schema: 1, records: [{ ...event('plain-slug'), kind: 'edge' }] }), /from--to--type/);
  assert.deepEqual(
    checkBundle({ schema: 1, records: [{ ...event('fixture-event-a--fixture-event-b--caused'), kind: 'edge' }] }).map((c) => c.dir),
    ['edges'],
  );
});

test('unknown kinds and malformed bundles are refused', () => {
  assert.throws(() => checkBundle({ schema: 1, records: [{ ...event('x'), kind: 'workflow' }] }), /unknown kind/);
  assert.throws(() => checkBundle({ schema: 1, records: [{ ...event('x'), kind: '../../tools' }] }), /unknown kind/);
  assert.throws(() => checkBundle({ schema: 1, records: [{ ...event('x'), kind: undefined }] }), /unknown kind/);
  assert.throws(() => checkBundle({ schema: 1, records: [null] }), /not a JSON object/);
  assert.throws(() => checkBundle({ schema: 2, records: [event('fixture-event-new')] }), /schema/);
  assert.throws(() => checkBundle({ schema: 1, records: [] }), /at least one record/);
  assert.throws(() => checkBundle({ schema: 1, records: [event('fixture-event-new'), event('fixture-event-new')] }), /twice/);
  assert.throws(() => checkBundle({ schema: 1, records: [event('fixture-event-new')], extra: true }), /unknown property/);
  assert.throws(() => checkBundle({ schema: 1, records: Array.from({ length: 201 }, (_, i) => event(`fixture-event-${i}`)) }), /over the/);
  assert.throws(() => checkBundle(JSON.parse('{"schema":1,"records":[{"__proto__":{"polluted":1},"kind":"event","id":"fixture-event-new"}]}')), /__proto__/);
});

test('records are written unchanged except for provenance', async () => {
  const dir = await scratch();
  const written = await bundleToFiles({ schema: 1, records: [event('fixture-event-new')] }, { ...OPTIONS, dataDir: dir });
  assert.deepEqual(written, [{ path: 'data/events/fixture-event-new.json', kind: 'event', id: 'fixture-event-new', replaced: false }]);

  const text = await readFile(path.join(dir, 'events', 'fixture-event-new.json'), 'utf8');
  assert.ok(text.endsWith('}\n'));
  const record = JSON.parse(text);
  assert.deepEqual(record.authors, [{ name: 'Fixture Contributor', github: 'fixture-opener' }]);
  assert.equal(record.created, '2026-09-02');
  assert.equal(record.revised, null);
  assert.equal(record.summary, 'A synthetic event, written for a test.');
  assert.equal(record.title, 'Fixture event new');

  // A contributor who gave no name is attributed by their handle.
  const dir2 = await scratch();
  await bundleToFiles({ schema: 1, records: [event('fixture-event-new', { authors: [] })] }, { ...OPTIONS, dataDir: dir2 });
  const second = JSON.parse(await readFile(path.join(dir2, 'events', 'fixture-event-new.json'), 'utf8'));
  assert.deepEqual(second.authors, [{ name: 'fixture-opener', github: 'fixture-opener' }]);
});

test('an existing file is never overwritten outside correction mode', async () => {
  const dir = await scratch();
  const file = path.join(dir, 'events', 'fixture-event-new.json');
  const bundle = () => ({ schema: 1, records: [event('fixture-event-new', { summary: 'A second synthetic summary.' })] });

  await bundleToFiles({ schema: 1, records: [event('fixture-event-new')] }, { ...OPTIONS, dataDir: dir });
  await assert.rejects(bundleToFiles(bundle(), { ...OPTIONS, dataDir: dir }), /already exists/);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).summary, 'A synthetic event, written for a test.');

  // Nothing at all is written when one record of the bundle collides.
  await assert.rejects(
    bundleToFiles({ schema: 1, records: [event('fixture-event-other'), event('fixture-event-new')] }, { ...OPTIONS, dataDir: dir }),
    /already exists/,
  );
  assert.equal(await readFile(path.join(dir, 'events', 'fixture-event-other.json'), 'utf8').then(() => 'written', () => 'absent'), 'absent');

  const written = await bundleToFiles(bundle(), { ...OPTIONS, dataDir: dir, correction: true, today: '2026-09-03' });
  assert.equal(written[0].replaced, true);
  const corrected = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(corrected.summary, 'A second synthetic summary.');
  assert.equal(corrected.created, '2026-09-02', 'a correction keeps the original creation date');
  assert.equal(corrected.revised, '2026-09-03');
  assert.deepEqual(corrected.authors, [
    { name: 'Fixture Contributor', github: 'fixture-opener' },
  ], 'the same person correcting their own record is not listed twice');

  // Someone else correcting it is appended, not substituted.
  const third = await bundleToFiles(bundle(), { dataDir: dir, author: 'fixture-other', today: '2026-09-04', correction: true });
  assert.equal(third[0].replaced, true);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).authors, [
    { name: 'Fixture Contributor', github: 'fixture-opener' },
    { name: 'Fixture Contributor', github: 'fixture-other' },
  ]);
});

test('the issue opener has to look like a GitHub login', async () => {
  const dir = await scratch();
  const bundle = { schema: 1, records: [event('fixture-event-new')] };
  for (const author of ['', undefined, 'not a login', 'a'.repeat(40), '--rm-rf', 'x;y']) {
    await assert.rejects(bundleToFiles(bundle, { ...OPTIONS, author, dataDir: dir }), /not a GitHub login/);
  }
});

test('applyProvenance is what sets authors, never the form', () => {
  const fresh = applyProvenance({ authors: [{ name: 'Typed Name', github: 'someone-else' }] }, { author: 'fixture-opener', today: '2026-09-02' });
  assert.deepEqual(fresh.authors, [{ name: 'Typed Name', github: 'fixture-opener' }]);
  assert.equal(fresh.created, '2026-09-02');
});

test('the CLI reads the body from the environment and reports what it wrote', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const dir = await scratch();
  const cli = new URL('../tools/bundle-to-files.mjs', import.meta.url).pathname;
  const body = `### The bundle\n\n${JSON.stringify({ schema: 1, records: [event('fixture-event-new')] })}\n`;

  const ok = await run(process.execPath, [cli, '--data', dir], { env: { ...process.env, ISSUE_BODY: body, ISSUE_AUTHOR: 'fixture-opener' } });
  assert.match(ok.stdout, /wrote data\/events\/fixture-event-new\.json/);

  await assert.rejects(
    run(process.execPath, [cli, '--data', dir], { env: { ...process.env, ISSUE_BODY: 'nothing here', ISSUE_AUTHOR: 'fixture-opener' } }),
    (e) => e.code === 1 && /no bundle found/.test(e.stderr),
  );
  await assert.rejects(
    run(process.execPath, [cli, '--data', dir], { env: { ...process.env, ISSUE_BODY: body, ISSUE_AUTHOR: 'fixture-opener' } }),
    (e) => e.code === 1 && /already exists/.test(e.stderr),
  );
  // Writes only where it is told to, even when the id looks like an escape.
  const hostile = JSON.stringify({ schema: 1, records: [event('../../.github/workflows/deploy.yml')] });
  await assert.rejects(
    run(process.execPath, [cli, '--data', dir], { env: { ...process.env, ISSUE_BODY: hostile, ISSUE_AUTHOR: 'fixture-opener' } }),
    (e) => e.code === 1 && /is not a slug/.test(e.stderr),
  );
  await assert.rejects(
    run(process.execPath, [cli, '--data', dir, '--wat'], { env: process.env }),
    (e) => e.code === 2,
  );
});

test('a bundle written to files passes the validator it will meet in CI', async () => {
  const { runValidation } = await import('../tools/validate.mjs');
  const { readFile: read } = await import('node:fs/promises');
  const dir = await scratch();
  const fixtureData = new URL('./fixtures/data/', import.meta.url).pathname;
  await writeFile(path.join(dir, 'regions.json'), await read(path.join(fixtureData, 'regions.json'), 'utf8'));
  for (const name of ['fixture-source-1']) {
    await writeFile(path.join(dir, 'sources', `${name}.json`), await read(path.join(fixtureData, 'sources', `${name}.json`), 'utf8'));
  }
  await bundleToFiles({ schema: 1, records: [event('fixture-event-new')] }, { ...OPTIONS, dataDir: dir });
  const result = await runValidation(dir);
  assert.deepEqual(result.errors, []);
});

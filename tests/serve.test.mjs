// The local development server. Half of these are the refusals: a foreign
// Origin, a Host that is not this machine, a traversal in a path, a kind
// that does not exist, a body that is not JSON, a record that does not
// validate. The other half is the one thing it exists to do — write a
// record and rebuild the index.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createServer, contentType, hostAllowed, originAllowed, isJson, resolveStatic, parseTarget, asBundle, saveBundle,
} from '../tools/serve.mjs';
import { valuesFromRecord, applyValues } from '../src/contribute/bundle.js';
import { readRecords } from '../tools/lib/read.mjs';
import { ROOT, FIXTURE_DATA } from './helpers.mjs';

// A copy of the fixture dataset, so a test that writes cannot touch the
// repository. The schema directory is the real one: schemas are read-only.
async function scratch() {
  const root = await mkdtemp(path.join(tmpdir(), 'atlas-serve-'));
  await cp(FIXTURE_DATA, path.join(root, 'data'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<!doctype html><title>fixture</title>\n', 'utf8');
  return { root, dataDir: path.join(root, 'data'), schemaDir: path.join(ROOT, 'schema') };
}

// The server on an ephemeral port, with the port it actually got: every
// guard below is written against that number.
async function started(options) {
  const server = createServer({ ...options, port: 0 });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  server.close();
  await new Promise((resolve) => server.once('close', resolve));

  const real = createServer({ ...options, port });
  await new Promise((resolve) => real.listen(port, '127.0.0.1', resolve));
  return {
    port,
    base: `http://localhost:${port}`,
    async stop() {
      real.close();
      await new Promise((resolve) => real.once('close', resolve));
    },
  };
}

function fixtureEvent(records) {
  return records.find((r) => r.kind === 'event' && r.status === 'active');
}

test('the host, origin and content-type guards, as strings', () => {
  assert.ok(hostAllowed('localhost:8000', 8000));
  assert.ok(hostAllowed('127.0.0.1:8000', 8000));
  assert.ok(!hostAllowed('localhost:8001', 8000), 'another port is another server');
  assert.ok(!hostAllowed('atlas.example:8000', 8000));
  assert.ok(!hostAllowed('localhost', 8000), 'no port at all');
  assert.ok(!hostAllowed(undefined, 8000));

  assert.ok(originAllowed(undefined, 8000), 'no Origin is our own page');
  assert.ok(originAllowed('http://localhost:8000', 8000));
  assert.ok(originAllowed('http://127.0.0.1:8000', 8000));
  assert.ok(!originAllowed('https://example.com', 8000));
  assert.ok(!originAllowed('http://localhost:8001', 8000));
  assert.ok(!originAllowed('null', 8000), 'a sandboxed page is not this page');

  assert.ok(isJson('application/json'));
  assert.ok(isJson('application/json; charset=utf-8'));
  assert.ok(!isJson('text/plain'));
  assert.ok(!isJson(undefined));
});

test('a static path never leaves the root, however it is written', () => {
  const root = path.resolve('/srv/atlas');
  assert.equal(resolveStatic(root, '/index.html'), path.join(root, 'index.html'));
  assert.equal(resolveStatic(root, '/src/./main.js'), path.join(root, 'src', 'main.js'));
  assert.equal(resolveStatic(root, '/'), root);
  assert.equal(resolveStatic(root, '/../etc/passwd'), null);
  assert.equal(resolveStatic(root, '/src/../../etc/passwd'), null);
  assert.equal(resolveStatic(root, '/%2e%2e/etc/passwd'), null, 'a traversal is decoded before it is judged');
  assert.equal(resolveStatic(root, '/src/%00.js'), null);
  assert.equal(resolveStatic(root, '/%zz'), null, 'an undecodable path is not a path');
  assert.equal(contentType('/x/review.html'), 'text/html; charset=utf-8');
  assert.equal(contentType('/x/bundle.js'), 'text/javascript; charset=utf-8');
  assert.equal(contentType('/x/thing.bin'), 'application/octet-stream');
});

test('the target of a write is judged before any path exists', () => {
  assert.deepEqual(parseTarget('/__records/event/fixture-event-a'), { kind: 'event', id: 'fixture-event-a' });
  assert.deepEqual(parseTarget('/__records/edge/a--b--caused'), { kind: 'edge', id: 'a--b--caused' });
  assert.equal(parseTarget('/__records/workflow/x'), null, 'not a kind');
  assert.equal(parseTarget('/__records/event/../../.github/workflows/x'), null);
  assert.equal(parseTarget('/__records/event/%2e%2e%2fx'), null);
  assert.equal(parseTarget('/__records/event/Not-A-Slug'), null);
  assert.equal(parseTarget('/__records/event/a--b--caused'), null, 'an edge id is not an event id');
  assert.equal(parseTarget('/__records/event'), null);
  assert.equal(parseTarget('/data/events/x.json'), null);
});

test('one record is a bundle of one', () => {
  const record = { schema: 1, kind: 'event', id: 'fixture-event-a' };
  assert.deepEqual(asBundle(record), { schema: 1, records: [record] });
  const bundle = { schema: 1, records: [record] };
  assert.equal(asBundle(bundle), bundle);
  assert.throws(() => asBundle('a string'), /record or a bundle/);
  assert.throws(() => asBundle(null), /record or a bundle/);
});

test('a save writes the record and rebuilds the index; an unedited one is byte identical', async () => {
  const options = await scratch();
  const { entries } = await readRecords(options.dataDir);
  const record = fixtureEvent(entries.map((e) => e.record));
  const file = path.join(options.dataDir, 'events', `${record.id}.json`);
  const before = await readFile(file, 'utf8');

  const unchanged = applyValues('event', record, valuesFromRecord('event', record));
  const first = await saveBundle({ schema: 1, records: [unchanged] }, options);
  assert.deepEqual(first.written, [{ path: `data/events/${record.id}.json`, kind: 'event', id: record.id }]);
  assert.equal(await readFile(file, 'utf8'), before, 'a save that changed nothing changed nothing');
  assert.ok((await readdir(path.join(options.dataDir, 'index'))).includes('manifest.json'));

  const values = valuesFromRecord('event', record);
  values.summary = 'An edited synthetic summary, written by a test of the review server.';
  await saveBundle({ schema: 1, records: [applyValues('event', record, values)] }, options);
  const after = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(after.summary, values.summary);
  assert.equal(after.created, record.created, 'the envelope is not the editor\'s to write');
  assert.deepEqual(after.authors, record.authors);

  const manifest = JSON.parse(await readFile(path.join(options.dataDir, 'index', 'manifest.json'), 'utf8'));
  assert.ok(manifest.counts.events > 0);
});

test('a record that does not validate is refused and nothing is written', async () => {
  const options = await scratch();
  const { entries } = await readRecords(options.dataDir);
  const record = fixtureEvent(entries.map((e) => e.record));
  const file = path.join(options.dataDir, 'events', `${record.id}.json`);
  const before = await readFile(file, 'utf8');

  const broken = { ...record, summary: '' };
  await assert.rejects(
    saveBundle({ schema: 1, records: [broken] }, options),
    (e) => e.status === 422 && Array.isArray(e.detail.errors) && e.detail.errors.length > 0,
  );
  assert.equal(await readFile(file, 'utf8'), before);

  // The URL names the record being saved: a bundle that does not contain it
  // is a mistake, not a save of something else.
  await assert.rejects(
    saveBundle({ schema: 1, records: [record] }, { ...options, target: { kind: 'event', id: 'fixture-event-elsewhere' } }),
    /contains no event/,
  );
});

test('the server answers only to localhost, and only PUT writes', async () => {
  const options = await scratch();
  const server = await started(options);
  try {
    const page = await fetch(`${server.base}/index.html`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(page.headers.get('access-control-allow-origin'), null, 'no CORS headers, ever');

    const missing = await fetch(`${server.base}/nothing-here.html`);
    assert.equal(missing.status, 404);

    const foreign = await fetch(`${server.base}/index.html`, { headers: { origin: 'https://example.com' } });
    assert.equal(foreign.status, 403);

    const byIp = await fetch(`http://127.0.0.1:${server.port}/index.html`);
    assert.equal(byIp.status, 200);

    // A Host that is not this machine: the request reached us, and is still
    // refused. fetch() will not send a wrong Host, so this one is raw.
    const raw = await new Promise((resolve, reject) => {
      import('node:net').then(({ connect }) => {
        const socket = connect(server.port, '127.0.0.1', () => {
          socket.write(`GET /index.html HTTP/1.1\r\nHost: atlas.example:${server.port}\r\nConnection: close\r\n\r\n`);
        });
        let text = '';
        socket.on('data', (c) => { text += c; });
        socket.on('end', () => resolve(text));
        socket.on('error', reject);
      }, reject);
    });
    assert.match(raw, /^HTTP\/1\.1 403/);

    const options405 = await fetch(`${server.base}/__records/event/fixture-event-a`, { method: 'OPTIONS' });
    assert.equal(options405.status, 405, 'no preflight is ever answered');

    const wrongType = await fetch(`${server.base}/__records/event/fixture-event-a`, {
      method: 'PUT',
      headers: { 'content-type': 'text/plain' },
      body: '{}',
    });
    assert.equal(wrongType.status, 415);

    const post = await fetch(`${server.base}/index.html`, { method: 'POST', body: 'x' });
    assert.equal(post.status, 405);
  } finally {
    await server.stop();
  }
});

test('a save over HTTP writes the file, and a foreign origin cannot', async () => {
  const options = await scratch();
  const server = await started(options);
  try {
    const { entries } = await readRecords(options.dataDir);
    const record = fixtureEvent(entries.map((e) => e.record));
    const values = valuesFromRecord('event', record);
    values.summary = 'A synthetic summary saved over the wire by a test.';
    const edited = applyValues('event', record, values);

    const refused = await fetch(`${server.base}/__records/event/${record.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://example.com' },
      body: JSON.stringify(edited),
    });
    assert.equal(refused.status, 403);

    const response = await fetch(`${server.base}/__records/event/${record.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schema: 1, records: [edited] }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.written.map((w) => w.path), [`data/events/${record.id}.json`]);

    const saved = JSON.parse(await readFile(path.join(options.dataDir, 'events', `${record.id}.json`), 'utf8'));
    assert.equal(saved.summary, values.summary);

    const unknown = await fetch(`${server.base}/__records/workflow/x`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(unknown.status, 404);

    const notJson = await fetch(`${server.base}/__records/event/${record.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    assert.equal(notJson.status, 400);
  } finally {
    await server.stop();
  }
});

#!/usr/bin/env node
// The local development server. It serves the repository exactly as
// `python3 -m http.server` does and adds one thing that server cannot have:
// a write endpoint, so review.html can save a record it has just edited.
//
//   node tools/serve.mjs [--port 8000] [--data <dir>] [--root <dir>]
//
// This is a tool for the maintainer's own machine and it never ships. The
// public site has no backend and must keep none (CLAUDE.md): open
// review.html under `python3 -m http.server` and every save becomes a
// correction bundle for the issue path instead.
//
// Because it writes files, it is written to be read:
//
//   - it binds 127.0.0.1, never 0.0.0.0, so nothing on the network can
//     reach it at all;
//   - it refuses any request whose Host is not localhost:<port> or
//     127.0.0.1:<port>, which is what stops a name that resolves to
//     127.0.0.1 from being used to reach it from a page elsewhere;
//   - it sends no CORS headers and answers no OPTIONS, so a page in
//     another tab cannot write here even by asking politely, and it
//     refuses any request that carries a foreign Origin outright;
//   - a write must be Content-Type: application/json;
//   - the kind and the id are checked against KIND_DIRS and the kind's id
//     pattern BEFORE any path is built, exactly as bundle-to-files.mjs does
//     it, so "../../.github/workflows/x.yml" is rejected as an id and never
//     reaches the filesystem;
//   - the bundle is validated as a unit against the records on disk, and
//     nothing is written unless it passes.

import { createServer as createHttpServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkBundle } from './bundle-to-files.mjs';
import { createStore, StoreError } from './lib/store.mjs';
import { KIND_DIRS } from './lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_PORT = 8000;
export const HOST = '127.0.0.1';
export const WRITE_PREFIX = '/__records/';
// Where the dashboard reads "the index is still rebuilding" from.
export const STATUS_PATH = '/__status';
// A bundle of two hundred records with prose in every one is still small.
export const MAX_BODY = 4 * 1024 * 1024;

const TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
});

export function contentType(file) {
  return TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
}

// Only the two names that mean this machine, and only on the port we are
// actually listening on. A Host header of anything else — including a domain
// that happens to resolve to 127.0.0.1 — is a request that did not mean to
// come here.
export function hostAllowed(host, port) {
  return host === `localhost:${port}` || host === `127.0.0.1:${port}`;
}

// No Origin at all is a same-origin navigation or a fetch from our own page,
// which is the normal case. An Origin that is not one of ours is another site
// asking us to write, and there is no such thing as an acceptable one.
export function originAllowed(origin, port) {
  if (origin === undefined || origin === null || origin === '') return true;
  return origin === `http://localhost:${port}` || origin === `http://127.0.0.1:${port}`;
}

export function isJson(header) {
  return typeof header === 'string' && header.split(';')[0].trim().toLowerCase() === 'application/json';
}

// URL path → a file inside root, or null. Percent-escapes are decoded first,
// so a traversal written as %2e%2e is the same string as one written plainly
// by the time it is judged; the resolved path is then checked against root
// again, because a check on the text is only as good as the assumption that
// nothing else can produce a separator.
export function resolveStatic(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const clean = decoded.split('/').filter((part) => part !== '' && part !== '.');
  if (clean.some((part) => part === '..')) return null;
  const file = path.resolve(root, ...clean);
  const within = path.resolve(root);
  if (file !== within && !file.startsWith(within + path.sep)) return null;
  return file;
}

// --- the write endpoint ----------------------------------------------------

// "/__records/event/conquest-of-ceuta" → { kind, id }, or null. The kind must
// be one this project writes and the id must pass its pattern; both are
// judged here, on strings, before anything builds a path out of either.
export function parseTarget(urlPath) {
  if (!urlPath.startsWith(WRITE_PREFIX)) return null;
  let rest;
  try {
    rest = decodeURIComponent(urlPath.slice(WRITE_PREFIX.length));
  } catch {
    return null;
  }
  const parts = rest.split('/');
  if (parts.length !== 2) return null;
  const [kind, id] = parts;
  if (!Object.hasOwn(KIND_DIRS, kind)) return null;
  // checkBundle owns the id patterns; a bundle of one whose record is exactly
  // this kind and id is the cheapest way to ask it about a bare pair.
  try {
    checkBundle({ schema: 1, records: [{ kind, id }] });
  } catch {
    return null;
  }
  return { kind, id };
}

// The store's error is this server's error: one class, so the handler at the
// bottom answers a refusal from either with the same status and body.
const SaveError = StoreError;

// A single record is a bundle of one (the brief's amendment): the dashboard
// sends a bundle so that retracting an event can retract its edges in the
// same validated save.
export function asBundle(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new SaveError(400, 'the body must be a record or a bundle');
  }
  if (Array.isArray(body.records)) return body;
  if (typeof body.kind === 'string') return { schema: 1, records: [body] };
  throw new SaveError(400, 'the body must be a record or a bundle');
}

// Validates the bundle against the atlas the store holds and, only if it
// passes, writes the record files. `store` is the server's, shared by every
// request so the records stay loaded between saves; without one this reads
// the atlas, saves, waits for data/index/ and throws the store away, which
// is what a caller with no server does and what this function always did.
export async function saveBundle(bundle, { dataDir, schemaDir, target = null, store = null, rebuild = null } = {}) {
  let checked;
  try {
    checked = checkBundle(bundle);
  } catch (e) {
    throw new SaveError(400, e.message);
  }
  const here = store ?? createStore({ dataDir, schemaDir });
  const saved = await here.save(checked, bundle, { target, ...(rebuild === null ? {} : { rebuild }) });
  if (store) return saved;
  return { ...saved, index: await here.settled() };
}

// --- the server ------------------------------------------------------------

function send(response, status, body, headers = {}) {
  response.writeHead(status, { 'cache-control': 'no-store', ...headers });
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, `${JSON.stringify(value, null, 2)}\n`, { 'content-type': 'application/json; charset=utf-8' });
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY) throw new SaveError(413, `the body is over the ${MAX_BODY} byte cap`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function serveStatic(request, response, root) {
  const urlPath = new URL(request.url, 'http://localhost').pathname;
  const resolved = resolveStatic(root, urlPath);
  if (!resolved) return send(response, 400, 'bad path\n', { 'content-type': 'text/plain; charset=utf-8' });
  let file = resolved;
  let info;
  try {
    info = await stat(file);
    if (info.isDirectory()) {
      file = path.join(file, 'index.html');
      info = await stat(file);
    }
  } catch {
    return send(response, 404, 'not found\n', { 'content-type': 'text/plain; charset=utf-8' });
  }
  const headers = { 'content-type': contentType(file), 'content-length': String(info.size) };
  if (request.method === 'HEAD') return send(response, 200, '', headers);
  response.writeHead(200, { 'cache-control': 'no-store', ...headers });
  createReadStream(file).pipe(response);
  return undefined;
}

export function createServer({ root = ROOT, dataDir = path.join(ROOT, 'data'), schemaDir = path.join(ROOT, 'schema'), port = DEFAULT_PORT } = {}) {
  // One store for the life of the server: the records and the topology stay
  // loaded between saves, and the queue inside it is what makes two saves
  // that arrive together happen one after the other.
  const store = createStore({ dataDir, schemaDir });
  const server = createHttpServer(async (request, response) => {
    try {
      if (!hostAllowed(request.headers.host, port)) {
        return send(response, 403, 'this server answers only to localhost\n', { 'content-type': 'text/plain; charset=utf-8' });
      }
      if (!originAllowed(request.headers.origin, port)) {
        return send(response, 403, 'foreign origin\n', { 'content-type': 'text/plain; charset=utf-8' });
      }
      const urlPath = new URL(request.url, 'http://localhost').pathname;

      // What the dashboard asks after a save, and while one is in flight:
      // the index is rebuilt behind the answer, so the page needs somewhere
      // to read "not yet" from (review of the health plan, finding 27).
      if (urlPath === STATUS_PATH) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          return send(response, 405, 'GET and HEAD only\n', { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
        }
        return sendJson(response, 200, store.status());
      }

      if (urlPath.startsWith(WRITE_PREFIX)) {
        // No OPTIONS handler and no CORS headers anywhere: a page on another
        // origin gets no preflight and no permission.
        if (request.method !== 'PUT') {
          return send(response, 405, 'the record endpoint takes PUT\n', { 'content-type': 'text/plain; charset=utf-8', allow: 'PUT' });
        }
        if (!isJson(request.headers['content-type'])) {
          return sendJson(response, 415, { ok: false, message: 'a save must be Content-Type: application/json' });
        }
        const target = parseTarget(urlPath);
        if (!target) return sendJson(response, 404, { ok: false, message: 'the path is /__records/<kind>/<id> with a known kind and a well-formed id' });
        const text = await readBody(request);
        let body;
        try {
          body = JSON.parse(text);
        } catch (e) {
          return sendJson(response, 400, { ok: false, message: `the body is not JSON: ${e.message}` });
        }
        // The answer goes back as soon as the record files are written; the
        // index is rebuilt after it, and `index` here says so rather than
        // listing files that do not exist yet.
        const saved = await saveBundle(asBundle(body), { dataDir, schemaDir, target, store });
        return sendJson(response, 200, { ok: true, ...saved, index: store.status().index });
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return send(response, 405, 'GET and HEAD only\n', { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
      }
      return await serveStatic(request, response, root);
    } catch (error) {
      if (error instanceof SaveError) {
        return sendJson(response, error.status, { ok: false, message: error.message, ...(error.detail ?? {}) });
      }
      return sendJson(response, 500, { ok: false, message: `${error.name}: ${error.message}` });
    }
  });
  // Reachable so that a test can wait for the index the server is writing
  // behind an answer it has already given.
  server.store = store;
  return server;
}

async function main(argv) {
  let port = DEFAULT_PORT;
  let root = ROOT;
  let dataDir = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--port') port = Number(argv[++i]);
    else if (argv[i] === '--root') root = path.resolve(argv[++i]);
    else if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('--port takes a port number');
    return 2;
  }
  const server = createServer({ root, dataDir: dataDir ?? path.join(root, 'data'), schemaDir: path.join(root, 'schema'), port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));
  console.log(`serving ${root} on http://localhost:${port}/ — records may be saved from http://localhost:${port}/review.html`);
  console.log('this server writes to data/ and binds 127.0.0.1 only; it is not the public site.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}

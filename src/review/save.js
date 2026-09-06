// Where a save goes. Two paths, and the page never has to be told which:
//
//   - `node tools/serve.mjs` is running, so PUT /__records/<kind>/<id>
//     writes the file and rebuilds the index;
//   - the page is on `python3 -m http.server` or on the published site,
//     where nothing can write, so the save becomes a correction bundle on
//     the clipboard and the correction issue opens with it.
//
// Which one it is, is discovered by trying: a server that cannot write
// answers a PUT with something that is not our JSON, and that is the whole
// test. Nothing is ever silently dropped — the bundle reaches the clipboard
// in both paths.

import { submitBundle, CORRECTION_TEMPLATE } from '../contribute/submit.js';

export const WRITE_PREFIX = '/__records/';
export const STATUS_PATH = '/__status';

// Where the page is, which is not the same question as whether it can write:
// `python3 -m http.server` on this machine is local and cannot write either.
// It is asked so that the published copy can say what it is. review.html is
// uploaded with the rest of the site — it is a page of this repository, and
// dropping it from the artifact would hide it rather than explain it — and on
// the public site it silently degrades to "copy a bundle", which is by design
// and was unlabelled (health review A, finding 35).
//
// Pure, and a string in: a hostname is all it takes, and a test needs no
// browser to try the cases that matter.
export function isLocalHost(hostname) {
  const name = String(hostname ?? '').toLowerCase().replace(/^\[|\]$/g, '');
  if (name === '') return true; // file://, which has no host at all
  if (name === 'localhost' || name.endsWith('.localhost')) return true;
  if (name === '::1') return true;
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(name);
}

export function endpointFor(kind, id) {
  return `${WRITE_PREFIX}${encodeURIComponent(kind)}/${encodeURIComponent(id)}`;
}

// → { available, ok, status, body } — `available` false means there is no
// write endpoint here at all, which is not an error, only the other path.
export async function putBundle(bundle, primary, { fetch: doFetch = globalThis.fetch } = {}) {
  let response;
  try {
    response = await doFetch(endpointFor(primary.kind, primary.id), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: `${JSON.stringify(bundle, null, 2)}\n`,
    });
  } catch (error) {
    return { available: false, ok: false, status: 0, body: { message: error.message } };
  }
  const type = response.headers?.get?.('content-type') ?? '';
  if (!type.includes('application/json')) {
    return { available: false, ok: false, status: response.status, body: { message: 'no write endpoint here' } };
  }
  let body = {};
  try {
    body = await response.json();
  } catch {
    return { available: false, ok: false, status: response.status, body: { message: 'the answer was not JSON' } };
  }
  return { available: true, ok: response.ok && body.ok !== false, status: response.status, body };
}

// What the server says about itself: `{ index: { state, since, message } }`,
// where state is 'rebuilding' while data/index/ is being written behind an
// answer already given. Unreachable is null and not an error — the page runs
// under `python3 -m http.server` too, where there is no such endpoint.
export async function readStatus({ fetch: doFetch = globalThis.fetch } = {}) {
  try {
    const response = await doFetch(STATUS_PATH, { headers: { accept: 'application/json' } });
    if (!(response.headers?.get?.('content-type') ?? '').includes('application/json')) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// The one call the dashboard makes. → { mode, ok, ... }:
//   mode 'saved'     the file was written; `indexing` says whether
//                    data/index/ was still being rebuilt when we were told
//   mode 'refused'   the server read it and the records do not validate
//   mode 'bundle'    there is no server; the bundle is on the clipboard
export async function saveBundle(bundle, primary, { fetch, submit = submitBundle, ...submitOptions } = {}) {
  const put = await putBundle(bundle, primary, { fetch });
  if (put.available) {
    return put.ok
      ? {
        mode: 'saved',
        ok: true,
        written: put.body.written ?? [],
        warnings: put.body.warnings ?? [],
        indexing: put.body.index?.state === 'rebuilding',
      }
      : { mode: 'refused', ok: false, message: put.body.message ?? `the server answered ${put.status}`, errors: put.body.errors ?? [] };
  }
  const outcome = await submit(bundle, { template: CORRECTION_TEMPLATE, ...submitOptions });
  return { mode: 'bundle', ok: true, ...outcome };
}

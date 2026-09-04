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

// The one call the dashboard makes. → { mode, ok, ... }:
//   mode 'saved'     the file was written and data/index/ rebuilt
//   mode 'refused'   the server read it and the records do not validate
//   mode 'bundle'    there is no server; the bundle is on the clipboard
export async function saveBundle(bundle, primary, { fetch, submit = submitBundle, ...submitOptions } = {}) {
  const put = await putBundle(bundle, primary, { fetch });
  if (put.available) {
    return put.ok
      ? { mode: 'saved', ok: true, written: put.body.written ?? [], warnings: put.body.warnings ?? [] }
      : { mode: 'refused', ok: false, message: put.body.message ?? `the server answered ${put.status}`, errors: put.body.errors ?? [] };
  }
  const outcome = await submit(bundle, { template: CORRECTION_TEMPLATE, ...submitOptions });
  return { mode: 'bundle', ok: true, ...outcome };
}

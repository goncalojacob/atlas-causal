// Reading a vendored source, and saying what was read.
//
// The sources the geometry imports run on are committed under `vendor/`, one
// gzip file each: about 16 MB in the repository instead of about 50, no
// dependency to decompress them (`node:zlib` is in Node), no build step, and
// no network in a run — which is the rule, not a convenience (the map block
// plan, §4). `vendor/` is inputs: never data, never served, never in
// `deploy.yml`'s allowlist.
//
// A hash is of the file **as it was downloaded**, decompressed. That is what
// `vendor/SHA256SUMS` records, what `data/geo/LICENSE` prints for CShapes,
// and what `SOURCE_FILE_SHA256` in cshapes.mjs has always been, so gzipping
// the file changed nothing a reader can check (review of the map block,
// finding 2). Both geometry imports read their sources through this one
// function, because two readers would drift and the second would be the one
// nobody tested.

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// The bytes of a source file, gunzipped when the name says it is gzipped,
// with the sha256 of those bytes. → { bytes, digest, compressed }
export async function readSource(file) {
  const raw = await readFile(file);
  const compressed = file.endsWith('.gz');
  const bytes = compressed ? gunzipSync(raw) : raw;
  return { bytes, digest: sha256(bytes), compressed };
}

// The same, parsed, with the digest checked against what the tool was written
// against. `expected` is null where a tool records no hash for that file.
// → { json, digest, problem }: `problem` is a sentence, and what the caller
// does with it — warn, or refuse under --check — is the caller's own rule.
export async function readSourceJson(file, expected = null) {
  const { bytes, digest } = await readSource(file);
  const problem = expected && digest !== expected
    ? `the file at ${file} has sha256 ${digest}, not the ${expected} this import was written against`
    : null;
  return { json: JSON.parse(bytes.toString('utf8')), digest, problem };
}

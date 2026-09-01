// The browser cannot scan schema/, so SCHEMA_FILES lists it by hand. This
// is the guard that keeps the list honest: a schema file added, renamed or
// removed without touching the list fails here, not in the form.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA_FILES, loadSchemas } from '../src/validate/schemas.js';
import { createValidator } from '../src/validate/schema.js';
import { schemas, SCHEMA_DIR } from './helpers.mjs';

test('SCHEMA_FILES is exactly what is in schema/', async () => {
  assert.deepEqual([...SCHEMA_FILES], Object.keys(await schemas()).sort());
});

test('loadSchemas fetches the listed files and the set validates', async () => {
  const asked = [];
  const files = await loadSchemas({
    root: 'schema/',
    fetchJson: async (url) => {
      asked.push(url);
      const { readFile } = await import('node:fs/promises');
      return JSON.parse(await readFile(`${SCHEMA_DIR}/${url.slice('schema/'.length)}`, 'utf8'));
    },
  });
  assert.deepEqual(asked, SCHEMA_FILES.map((f) => `schema/${f}`));
  assert.deepEqual(createValidator(files).schemaErrors, []);
});

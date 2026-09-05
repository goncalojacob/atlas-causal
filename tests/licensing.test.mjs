// The licence boundary, in a form a machine can read.
//
// `data/LICENSE` and `data/geo/LICENSE` are the licences and the reasoning,
// written for a person. `src/licensing.js` is the same boundary as a table,
// because a downstream reuser could not tell from a record which third party
// it derives from except by parsing an author's name, the index files carried
// no licence at all, and the site never said on an NC-licensed card that it
// was one (health review A, finding 24). Three statements of one fact is two
// chances to drift, so this file holds them together.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { LICENSES, licensingTable, attributionOf, attributionHtml } from '../src/licensing.js';
import { licensesOf } from '../src/kinds.js';
import { ALLOWED_LICENSES } from '../src/validate/rules.js';
import { ROOT, SCHEMA_DIR, fixtures } from './helpers.mjs';

test('every licence a record may declare is one the table knows how to attribute', async () => {
  const provenance = JSON.parse(await readFile(path.join(SCHEMA_DIR, 'common/provenance.json'), 'utf8'));
  // The enum is wider than any directory accepts — PD, CC0 and ODbL are
  // reserved for geometry that has not arrived (health review A, finding 24
  // notes the gap). What must hold is the other direction: every licence a
  // *directory* accepts is one this table can name an attribution for.
  for (const licences of Object.values(licensesOf())) {
    for (const id of licences) assert.ok(LICENSES[id], `${id} has no entry in LICENSES`);
    for (const id of licences) assert.ok(provenance.properties.license.enum.includes(id), `${id} is not in the schema's enum`);
  }
});

test('the table says of each record directory what rule 12 enforces', () => {
  const rows = licensingTable();
  for (const [kind, licences] of Object.entries(ALLOWED_LICENSES)) {
    assert.deepEqual(rows[`data/${kind}s/`].licenses, [...licences], kind);
  }
  // The generated trees have no `license` field of their own, so the table is
  // the only place their licence is written down at all.
  assert.deepEqual(rows['data/geo/presences/'].licenses, ['CC-BY-NC-SA-4.0']);
  assert.deepEqual(rows['data/geo/land-present.json'].licenses, ['PD']);
  // The index is honestly two answers: it projects NC actors and presences
  // into the same files as CC BY-SA records.
  assert.deepEqual(rows['data/index/'].licenses, ['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0']);
});

test('the attribution names the dataset data/geo/LICENSE names', async () => {
  const text = await readFile(path.join(ROOT, 'data', 'geo', 'LICENSE'), 'utf8');
  const nc = LICENSES['CC-BY-NC-SA-4.0'];
  for (const who of ['Schvitz', 'Girardin', 'Rüegger', 'Weidmann', 'Cederman', 'Gleditsch']) {
    assert.ok(nc.attribution.includes(who), `${who} is not in the attribution`);
    assert.ok(text.includes(who), `${who} is not in data/geo/LICENSE`);
  }
  assert.ok(text.includes(nc.source.replace('https://doi.org/', '')), 'the citation DOI');
});

test('a card says whose material it is, and only where that is not this atlas', async () => {
  assert.equal(attributionOf({ license: 'CC-BY-SA-4.0' }), null, 'the site says its own licence once');
  assert.equal(attributionHtml({ license: 'CC-BY-SA-4.0' }), '');
  assert.equal(attributionHtml({}), '');

  const html = attributionHtml({ license: 'CC-BY-NC-SA-4.0' });
  assert.match(html, /class="notice licence"/);
  assert.match(html, /CShapes 2\.0/);
  assert.match(html, /not under the licence of the rest of this atlas/);
  assert.match(html, /href="https:\/\/creativecommons\.org\/licenses\/by-nc-sa\/4\.0\/"/);
  assert.match(html, /href="https:\/\/doi\.org\/10\.1177\/00220027211013563"/);
});

test('the fixture actors an import wrote carry the line, and the rest do not', async () => {
  const { records } = await fixtures();
  for (const record of records) {
    const line = attributionHtml(record);
    if (record.license === 'CC-BY-NC-SA-4.0') assert.notEqual(line, '', record.id);
    else assert.equal(line, '', record.id);
  }
});

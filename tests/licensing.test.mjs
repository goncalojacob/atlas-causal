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
import { LICENSES, NON_COMMERCIAL, licensingTable, attributionOf, attributionHtml, attributionSource } from '../src/licensing.js';
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

// I8, owner question 4. `NC_ORIGINS` was keyed on `origin.tool` and this
// module was keyed on directories, and the two disagreed the moment a
// succession derived from the CShapes split table was written into
// `data/relations/`. The exception follows the origin: a record an import
// created carries its source's licence wherever it lives, and the three
// statements of that — the registry, `data/LICENSE` and the manifest's block —
// are held together here as they were before.
test('the NC exception follows the origin and not the directory', async () => {
  // Both directories that may hold such a record say so, and no other does.
  const nc = Object.entries(licensesOf())
    .filter(([, licences]) => licences.some((id) => NON_COMMERCIAL.includes(id)))
    .map(([kind]) => kind);
  assert.deepEqual(nc.sort(), ['actor', 'presence', 'relation']);
  assert.deepEqual([...NON_COMMERCIAL], ['CC-BY-NC-SA-4.0']);

  // Whichever of them it is in, it is the same record and the same line: the
  // module reads `license`, which rule 12 has already tied to `origin.tool`.
  for (const kind of nc) {
    const line = attributionHtml({ kind, license: 'CC-BY-NC-SA-4.0', origin: { tool: 'cshapes' } });
    assert.match(line, /CShapes 2\.0/, kind);
  }

  // And `data/LICENSE`'s prose says the same as the table: the two mixed
  // directories are named together, and the sentence keys on the origin.
  const text = await readFile(path.join(ROOT, 'data', 'LICENSE'), 'utf8');
  const head = text.slice(0, text.indexOf('Third-party material'));
  assert.match(head, /data\/actors\/ {2}data\/relations\//);
  assert.match(head, /it keys on `origin\.tool`, not on the directory/);
  // The manifest's block is `licensingTable()` itself, which the table test
  // above holds to `ALLOWED_LICENSES`; this is the row that changed.
  assert.deepEqual(licensingTable()['data/relations/'].licenses, ['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0']);
  assert.equal(licensingTable()['data/relations/'].attribution[0].license, 'CC-BY-NC-SA-4.0');
});

// A relation has no card and no entry page of its own: it is drawn on the
// cards and the pages of the two actors at its ends. So the line the licence
// asks for is said about whichever record on the page is somebody else's, and
// said once (I8, A3).
test('a page draws more than one record, and says the line once', () => {
  const actor = { id: 'a', license: 'CC-BY-SA-4.0' };
  const own = { id: 'b', license: 'CC-BY-NC-SA-4.0' };
  const succession = { id: 'a--b--succeeded', license: 'CC-BY-NC-SA-4.0' };
  assert.equal(attributionSource([actor]), null, 'nothing to say about the atlas\'s own work');
  assert.equal(attributionSource([]), null);
  assert.equal(attributionSource(null), null);
  // The relation is what makes the page carry somebody else's material.
  assert.equal(attributionSource([actor, succession]), succession);
  // The record itself comes first where it is one of them, so the line is
  // about what the reader is looking at rather than about a link in a list.
  assert.equal(attributionSource([own, succession]), own);
  // One line, not one per relation.
  assert.equal(attributionHtml(attributionSource([actor, succession, succession])).match(/class="notice licence"/g).length, 1);
});

test('the fixture actors an import wrote carry the line, and the rest do not', async () => {
  const { records } = await fixtures();
  for (const record of records) {
    const line = attributionHtml(record);
    if (record.license === 'CC-BY-NC-SA-4.0') assert.notEqual(line, '', record.id);
    else assert.equal(line, '', record.id);
  }
});

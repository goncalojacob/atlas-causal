// The catalogue lookup is a reading aid for the reviewer. No network here:
// the fetch is injected, and what is tested is which identifiers get looked
// up, where, and how the answer is reported.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourcesToCheck, catalogueUrl, titleFrom, lookup, formatReport } from '../tools/lookup-sources.mjs';

const source = (over) => ({
  schema: 1, kind: 'source', id: 'fixture-source-1', type: 'book',
  title: 'A synthetic book', doi: null, isbn: null, ...over,
});

test('only sources with a well-formed DOI or ISBN are looked up', () => {
  const bundle = {
    schema: 1,
    records: [
      source({ id: 'fixture-with-doi', doi: '10.0000/fixture' }),
      source({ id: 'fixture-with-isbn', isbn: '9780000000001' }),
      source({ id: 'fixture-with-neither', url: 'https://example.invalid/fixture' }),
      source({ id: 'fixture-with-junk', doi: 'not-a-doi', isbn: '12' }),
      { kind: 'event', id: 'fixture-event-a', title: 'Fixture event A' },
    ],
  };
  assert.deepEqual(sourcesToCheck(bundle).map((s) => s.id), ['fixture-with-doi', 'fixture-with-isbn']);
  assert.deepEqual(sourcesToCheck({ records: [] }), []);
  assert.deepEqual(sourcesToCheck(null), []);
});

test('each identifier goes to its own catalogue', () => {
  assert.deepEqual(catalogueUrl({ doi: '10.0000/fixture' }), { catalogue: 'Crossref', url: 'https://api.crossref.org/works/10.0000/fixture' });
  assert.deepEqual(catalogueUrl({ isbn: '9780000000001' }), { catalogue: 'Open Library', url: 'https://openlibrary.org/isbn/9780000000001.json' });
  // The DOI keeps its slash — it is a path — but nothing else survives raw.
  assert.equal(catalogueUrl({ doi: '10.0000/fixture with space' }).url, 'https://api.crossref.org/works/10.0000/fixture%20with%20space');

  assert.equal(titleFrom('Crossref', { message: { title: ['A synthetic article'] } }), 'A synthetic article');
  assert.equal(titleFrom('Crossref', { message: {} }), null);
  assert.equal(titleFrom('Open Library', { title: 'A synthetic book' }), 'A synthetic book');
  assert.equal(titleFrom('Open Library', {}), null);
});

test('a catalogue that cannot answer is reported, never guessed at', async () => {
  const failed = await lookup({ id: 'fixture-with-doi', title: 'A synthetic book', doi: '10.0000/fixture', isbn: null }, {
    fetchJson: async () => { throw new Error('HTTP 404'); },
  });
  assert.equal(failed.found, null);
  assert.equal(failed.error, 'HTTP 404');
  assert.match(formatReport([failed]), /could not answer: HTTP 404/);
});

test('the report puts the title found beside the title submitted', async () => {
  const results = [
    await lookup({ id: 'fixture-a', title: 'A synthetic book', doi: '10.0000/fixture', isbn: null }, { fetchJson: async () => ({ message: { title: ['A synthetic book'] } }) }),
    await lookup({ id: 'fixture-b', title: 'A synthetic book', isbn: '9780000000001', doi: null }, { fetchJson: async () => ({ title: 'Something else entirely' }) }),
  ];
  const report = formatReport(results);
  assert.match(report, /\| `fixture-a` \| DOI 10\.0000\/fixture \| A synthetic book \| A synthetic book \|/);
  assert.match(report, /⚠ Something else entirely/);
  assert.match(report, /does not resemble the one submitted/);
  // A pipe in a title does not break out of the table.
  const piped = formatReport([{ id: 'fixture-c', title: 'A | B', isbn: '9780000000001', doi: null, catalogue: 'Open Library', found: 'A | B', error: null }]);
  assert.equal(piped.split('\n').filter((l) => l.startsWith('|')).length, 3);
  assert.equal(formatReport([]), '');
});

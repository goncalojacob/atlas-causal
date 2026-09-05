// The bibliography half of M10: who cites what, written into the sources
// index, and the one place a source is turned into a citation.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { buildIndex } from '../tools/build-index.mjs';
import { buildTopology, citationsBySource } from '../src/validate/core.js';
import {
  citationText, containerText, identifiers, compareSources, groupCiters,
  CITER_ORDER, CONTAINER_KINDS,
} from '../src/citation.js';
import { bibliographyHtml } from '../src/sources/bibliography.js';
import { FIXTURE_DATA, ROOT, fixtures } from './helpers.mjs';

async function repositorySources() {
  const dir = path.join(ROOT, 'data', 'index');
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
  const index = JSON.parse(await readFile(path.join(ROOT, 'data', manifest.files.sources), 'utf8'));
  return index.sources;
}

test('citationsBySource turns every record round to face its sources', async () => {
  const fx = await fixtures();
  const citations = citationsBySource(fx.records);
  for (const record of fx.records) {
    if (record.status !== 'active' || record.kind === 'source') continue;
    for (const c of record.sources ?? []) {
      const list = citations.get(c.source) ?? [];
      assert.ok(
        list.some((x) => x.id === record.id && x.kind === record.kind && !x.dissent),
        `${record.id} cites ${c.source} and the index does not say so`,
      );
    }
  }
  // Nothing is invented: every citation the index holds is one a record made.
  const byId = fx.byId;
  for (const [sourceId, list] of citations) {
    for (const c of list) {
      const record = byId[c.id];
      assert.ok(record, `${c.id} is not a record`);
      const from = c.dissent ? record.dispute?.sources ?? [] : record.sources ?? [];
      assert.ok(from.some((x) => x.source === sourceId), `${c.id} does not cite ${sourceId}${c.dissent ? ' in dissent' : ''}`);
    }
  }
});

test('a dissenting citation is marked as one and a tombstone cites nothing', async () => {
  const records = [
    {
      schema: 1, kind: 'edge', id: 'a--b--caused', status: 'active',
      sources: [{ source: 'for-it', locator: 'p. 1' }],
      dispute: { text: 'x', sources: [{ source: 'against-it', locator: 'p. 2' }] },
    },
    { schema: 1, kind: 'event', id: 'gone', status: 'retracted', sources: [{ source: 'for-it', locator: null }] },
    { schema: 1, kind: 'source', id: 'for-it', status: 'active', sources: [] },
  ];
  const citations = citationsBySource(records);
  assert.deepEqual(citations.get('for-it'), [{ kind: 'edge', id: 'a--b--caused', locator: 'p. 1', dissent: false }]);
  assert.deepEqual(citations.get('against-it'), [{ kind: 'edge', id: 'a--b--caused', locator: 'p. 2', dissent: true }]);
});

test('every source in the built index carries its citers and their count', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const expected = citationsBySource(fx.records);
  for (const source of topology.sources) {
    assert.deepEqual(source.citations, expected.get(source.id) ?? [], source.id);
    assert.equal(source.citationCount, source.citations.length, source.id);
  }
  assert.ok(topology.sources.some((s) => s.citationCount > 0), 'the fixtures cite something');
  // Deterministic like everything else in the index.
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const name = path.basename(JSON.parse(first.files['manifest.json']).files.sources);
  assert.equal(first.files[name], second.files[name]);
});

test('the repository sources index agrees with the records that cite it', async () => {
  const sources = await repositorySources();
  assert.ok(sources.length > 0);
  for (const source of sources) {
    assert.ok(Array.isArray(source.citations), `${source.id} has no citers list`);
    assert.equal(source.citationCount, source.citations.length, source.id);
    for (const c of source.citations) assert.ok(CITER_ORDER.includes(c.kind), `${source.id} cited by unknown kind ${c.kind}`);
  }
  assert.ok(sources.some((s) => s.citationCount >= 2));
});

test('citationText and identifiers say what the record has and no more', () => {
  const book = {
    id: 'maxwell-1995', creators: ['Kenneth Maxwell'], year: 1995,
    title: 'The Making of Portuguese Democracy', publisher: 'Cambridge University Press',
    isbn: '9780521585965', doi: null, url: null,
  };
  assert.equal(citationText(book), 'Kenneth Maxwell (1995). The Making of Portuguese Democracy. Cambridge University Press.');
  assert.deepEqual(identifiers(book), [
    { kind: 'isbn', label: 'ISBN 9780521585965', href: 'https://openlibrary.org/isbn/9780521585965' },
  ]);
  const article = { id: 'a', creators: [], year: null, title: 'A paper', doi: '10.1177/00220027211013563', url: 'javascript:alert(1)' };
  const ids = identifiers(article);
  assert.equal(ids[0].href, 'https://doi.org/10.1177%2F00220027211013563');
  assert.equal(ids[1].href, null, 'a url that is not http(s) is never a link');
  assert.equal(citationText(article), 'A paper.');
  const archive = { id: 'b', creators: ['x'], title: 'A letter', repository: 'Torre do Tombo', reference: 'mç. 3' };
  assert.equal(citationText(archive), 'x. A letter. Torre do Tombo, mç. 3.');
  assert.deepEqual(identifiers(archive), [{ kind: 'repository', label: 'Torre do Tombo, mç. 3', href: null }]);
});

test('the four containing works, each in the form its kind is cited in', () => {
  assert.deepEqual([...CONTAINER_KINDS], ['journal', 'edited-volume', 'series', 'website']);

  // An article in a journal: the journal, the volume with the issue in
  // brackets, then the pages.
  assert.equal(
    containerText({ title: 'Journal of Portuguese History', kind: 'journal', volume: '12', issue: '3', pages: '45-67' }),
    'Journal of Portuguese History, 12(3), 45-67.',
  );
  // A chapter in an edited volume is a part of it, and only that kind says so.
  assert.equal(
    containerText({ title: 'The Cambridge History of Portugal', kind: 'edited-volume', pages: '45-67' }),
    'In The Cambridge History of Portugal, 45-67.',
  );
  // A number in a series; a page on a site.
  assert.equal(containerText({ title: 'Documentos Ultramarinos', kind: 'series', volume: '4' }), 'Documentos Ultramarinos, 4.');
  assert.equal(containerText({ title: 'Arquivo.pt', kind: 'website' }), 'Arquivo.pt.');
  // The parts that are missing are simply not said.
  assert.equal(containerText({ title: 'Análise Social', kind: 'journal', issue: '211' }), 'Análise Social, (211).');
  assert.equal(containerText({ title: 'Análise Social', kind: 'journal' }), 'Análise Social.');
  // No container, and no half of one: nothing at all.
  assert.equal(containerText(undefined), '');
  assert.equal(containerText(null), '');
  assert.equal(containerText({ kind: 'journal', volume: '12' }), '');
});

test('a container falls between this work\'s title and its publisher', () => {
  const chapter = {
    id: 'c', creators: ['Kenneth Maxwell'], year: 1995, title: 'The emergence of Portuguese democracy',
    container: { title: 'The Cambridge History of Portugal', kind: 'edited-volume', pages: '45-67' },
    publisher: 'Cambridge University Press',
  };
  assert.equal(
    citationText(chapter),
    'Kenneth Maxwell (1995). The emergence of Portuguese democracy. In The Cambridge History of Portugal, 45-67. Cambridge University Press.',
  );
  const article = {
    id: 'a', creators: ['A. Author'], year: 2002, title: 'A paper',
    container: { title: 'Journal of Portuguese History', kind: 'journal', volume: '12', issue: '3', pages: '45-67' },
    publisher: null,
  };
  assert.equal(citationText(article), 'A. Author (2002). A paper. Journal of Portuguese History, 12(3), 45-67.');
  // And a work that stands alone reads exactly as it did before the field
  // existed, which is what every source record in data/ is.
  const { container, ...alone } = article;
  assert.equal(citationText(alone), 'A. Author (2002). A paper.');
});

test('the fixture article carries a container and the bibliography prints it', async () => {
  const fx = await fixtures();
  const source = fx.byId['fixture-source-2'];
  assert.equal(source.container.kind, 'journal');
  assert.equal(
    citationText(source),
    'Fixture Author Two (2002). Fixture source 2. Fixture Journal of Nowhere, 12(3), 45-67.',
  );
  // Through the built index, which is what sources.html actually reads.
  const built = await buildIndex(FIXTURE_DATA);
  const indexed = built.topology.sources.find((s) => s.id === 'fixture-source-2');
  assert.deepEqual(indexed.container, source.container, 'the index carries it whole');
  assert.match(bibliographyHtml(built.topology.sources), /Fixture Journal of Nowhere, 12\(3\), 45-67\./);
});

test('a bibliography is ordered by creator, year, title, id', () => {
  const list = [
    { id: 'c', creators: ['Telo'], year: 2007, title: 'B' },
    { id: 'a', creators: ['Maxwell'], year: 1995, title: 'Z' },
    { id: 'b', creators: ['Maxwell'], year: 1995, title: 'A' },
    { id: 'd', creators: [], year: null, title: 'Anonymous' },
  ];
  assert.deepEqual([...list].sort(compareSources).map((s) => s.id), ['d', 'b', 'a', 'c']);
});

test('citers group in a fixed order and an unknown kind still shows', () => {
  const groups = groupCiters([
    { kind: 'place', id: 'lisbon', locator: null, dissent: false },
    { kind: 'event', id: 'e', locator: null, dissent: false },
    { kind: 'wonder', id: 'w', locator: null, dissent: false },
    { kind: 'edge', id: 'x--y--caused', locator: null, dissent: true },
  ]);
  assert.deepEqual(groups.map((g) => g.kind), ['event', 'edge', 'place', 'wonder']);
  assert.equal(groups[0].label, 'Events');
  assert.deepEqual(groupCiters([]), []);
});

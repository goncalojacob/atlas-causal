// sources.html lists every source with its citation count, generated from
// the sources index. No DOM in node --test, so the page's one job — turning
// the index into that list — is checked as the string it produces.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  bibliographyHtml, isBaseMapSource, BASE_MAP_HEADING, WORKS_HEADING,
} from '../src/sources/bibliography.js';
import { loadSources } from '../src/data.js';
import { ROOT } from './helpers.mjs';

// loadSources as the browser calls it, with reading a file for fetching one.
const fromDisk = (dataRoot) => (rel) => readFile(path.join(dataRoot, rel), 'utf8').then(JSON.parse);

test('the bibliography lists every source in the repository index, with its count', async () => {
  const dataRoot = path.join(ROOT, 'data');
  const { sources } = await loadSources({ dataRoot: '', fetchJson: fromDisk(dataRoot) });
  assert.ok(sources.length >= 20, `${sources.length} sources`);
  const html = bibliographyHtml(sources);
  for (const source of sources) {
    assert.ok(html.includes(`index.html?source=${source.id}`), `${source.id} is not in the bibliography`);
    assert.ok(html.includes(`>${source.citationCount} citation`), `${source.id}: no count for ${source.citationCount}`);
  }
  assert.equal((html.match(/class="bib-entry/g) ?? []).length, sources.length);
  // Two groups since M85 (A17): the works, and the base maps under a heading
  // of their own. Every source is in exactly one of them and the two counts
  // add back up to the whole, which is what the page promises.
  const maps = sources.filter(isBaseMapSource);
  const works = sources.filter((source) => !isBaseMapSource(source));
  assert.equal(maps.length + works.length, sources.length);
  const cites = (list) => list.reduce((n, source) => n + source.citationCount, 0);
  for (const list of [works, maps]) {
    if (list.length === 0) continue;
    assert.match(html, new RegExp(`carrying ${cites(list)} citations`));
  }
  assert.equal(cites(works) + cites(maps), sources.reduce((n, s) => n + s.citationCount, 0));
  assert.ok(html.includes(WORKS_HEADING) && html.includes(BASE_MAP_HEADING));
});

test('the list is ordered by creator and says what is not cited', () => {
  const html = bibliographyHtml([
    { id: 'telo', creators: ['Telo'], year: 2007, title: 'B', type: 'book', status: 'active', citationCount: 1 },
    { id: 'maxwell', creators: ['Maxwell'], year: 1995, title: 'A', type: 'book', status: 'active', citationCount: 12 },
    { id: 'orphan', creators: ['Nobody'], year: 1900, title: 'Cited by nothing', type: 'book', status: 'active', citationCount: 0 },
  ]);
  assert.ok(html.indexOf('?source=maxwell') < html.indexOf('?source=telo'));
  // No `origin` on any of the three, so none is a base map and the works are
  // the whole list.
  assert.match(html, /3 sources,\s+2 of them cited/);
  assert.match(html, />0 citations</);
  assert.match(html, />1 citation</, 'one citation is not "1 citations"');
});

test('an empty bibliography says so rather than drawing an empty list', () => {
  assert.match(bibliographyHtml([]), /no source record has been written yet/);
});

test('nothing from a source record reaches the page unescaped', () => {
  const html = bibliographyHtml([{
    id: 'nasty', creators: ['<img onerror="x">'], year: 1999, title: '<script>alert(1)</script>',
    type: 'book', status: 'retracted', url: 'javascript:alert(1)', citationCount: 0,
  }]);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /href="javascript/);
  assert.match(html, /class="bib-entry inactive"/);
  assert.match(html, /badge status/);
});

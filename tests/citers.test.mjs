// The citer directory: which records cite a given source, out of the index
// every page loads whole and into one file per source, fetched when a reader
// opens that source (docs/health/h3a-brief.md, A7). This run emits it; the
// source card and `retractionPlan` move over in H3b, so the rows are still
// in the sources index beside it (STATUS.md, deviation 216).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { citerFiles } from '../src/validate/core.js';
import { retractionPlan } from '../src/review/sign.js';
import { buildIndex } from '../tools/build-index.mjs';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');

async function indexOf(dataDir) {
  const built = await buildIndex(dataDir);
  const manifest = JSON.parse(built.files['manifest.json']);
  const dir = path.basename(manifest.files.citers);
  const files = Object.entries(built.files)
    .filter(([name]) => name.startsWith(`${dir}/`))
    .map(([name, text]) => [name.slice(dir.length + 1), JSON.parse(text)]);
  return { built, manifest, dir, files: new Map(files) };
}

for (const [label, dir] of [['the fixtures', FIXTURE_DATA], ['the repository', DATA]]) {
  test(`every source with a citer has a file, and no other, over ${label}`, async () => {
    const { built, manifest, files } = await indexOf(dir);
    const sources = JSON.parse(built.files[path.basename(manifest.files.sources)]).sources;
    const cited = sources.filter((s) => s.citationCount > 0);
    assert.ok(cited.length > 0);
    assert.deepEqual([...files.keys()].sort(), cited.map((s) => `${s.id}.json`).sort());
    for (const source of sources) {
      const file = files.get(`${source.id}.json`);
      if (!file) {
        // Nothing to fetch, and the count in the sources index says so.
        assert.equal(source.citationCount, 0, source.id);
        continue;
      }
      assert.equal(file.id, source.id);
      assert.equal(file.schema, 1);
      assert.equal(file.citations.length, source.citationCount);
      assert.deepEqual(file.citations, source.citations, `${source.id}: the same rows, in the same order`);
    }
  });

  test(`the citer directory is named once in the manifest over ${label}`, async () => {
    const { manifest, built } = await indexOf(dir);
    assert.match(manifest.files.citers, /^index\/citers-[0-9a-f]{12}$/);
    // One name, not one per source: manifest.json is fetched no-store on
    // every page load and 20k sources would be 200 KB of it.
    const named = Object.values(manifest.files).filter((v) => v.includes('citers'));
    assert.equal(named.length, 1);
    assert.ok(Object.keys(built.files).some((name) => name.startsWith(`${path.basename(manifest.files.citers)}/`)));
  });
}

// The hash is over the concatenation of the files' bytes in id order, so a
// changed citation renames the directory and the old one is never served
// under `immutable` with new contents.
test('the directory hash follows the rows it holds', async () => {
  const first = await indexOf(FIXTURE_DATA);
  const second = await indexOf(FIXTURE_DATA);
  assert.equal(first.dir, second.dir, 'two builds of the same data name the same directory');
  const sources = JSON.parse(first.built.files[path.basename(first.manifest.files.sources)]).sources;
  const changed = citerFiles(sources.map((s, i) => (i === 0 ? { ...s, citations: [...(s.citations ?? []), { kind: 'event', id: 'fixture-event-a', locator: 'p. 1', dissent: false }] } : s)));
  assert.notDeepEqual(changed, citerFiles(sources));
});

test('a source nothing cites is left out, and one with rows is not', async () => {
  const sources = [
    { id: 'b-cited', citations: [{ kind: 'event', id: 'e', locator: null, dissent: false }] },
    { id: 'a-uncited', citations: [] },
    { id: 'c-no-field' },
  ];
  assert.deepEqual(citerFiles(sources), [{ id: 'b-cited', citations: sources[0].citations }]);
  assert.deepEqual(citerFiles(), []);
});

// A7: the plan reads `citations[].kind` and `citations[].id` and nothing
// else, so the one file for the source in hand answers it as completely as
// the whole sources index does — which is what lets the rows leave the index
// when H3b moves the card over.
test('retractionPlan says the same off one citer file as off the whole index', async () => {
  const { built, manifest, files } = await indexOf(DATA);
  const sources = JSON.parse(built.files[path.basename(manifest.files.sources)]).sources;
  const cited = sources.filter((s) => s.citationCount > 0);
  assert.ok(cited.length > 3);
  for (const source of cited) {
    const whole = retractionPlan({ kind: 'source', id: source.id }, { sources });
    // The map a card would have fetched: this source's file and no other.
    const prefetched = files.get(`${source.id}.json`);
    const alone = retractionPlan({ kind: 'source', id: source.id }, {
      sources: [{ id: prefetched.id, status: 'active', citations: prefetched.citations }],
    });
    assert.deepEqual(alone, whole, source.id);
    assert.equal(alone.blockers.length, source.citationCount);
  }
});

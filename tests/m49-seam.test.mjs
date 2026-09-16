import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M49's two invariants at the 1885/1886 seam, where the Historical Basemaps
// import stops and CShapes begins. Neither year is a historical fact: 1885 is
// where the first import stopped extending its last snapshot and 1886 is where
// the second dataset opens. The milestone's job is to decide, for each actor
// there, whether the polity ended or only the dataset did — and until a date
// from Wikidata says which, the honest state is a seam that is *written down*
// rather than one that is quietly closed.
//
// So the first test asserts the correspondence the brief asked for and not a
// count: an actor may sit at the seam, but it may not sit there unlisted. A
// run that joins or splits a pair removes it from the seam and from the file
// together; a run that cannot answer leaves both. What this refuses is the
// third case — a record changed, or a pair forgotten, without the survey
// saying so.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SURVEY = 'docs/m49-actors.md';

const actorsDir = path.join(ROOT, 'data', 'actors');
const actors = [];
for (const file of await readdir(actorsDir)) {
  if (!file.endsWith('.json')) continue;
  actors.push(JSON.parse(await readFile(path.join(actorsDir, file), 'utf8')));
}
const survey = await readFile(path.join(ROOT, SURVEY), 'utf8');

// `id` in a table cell or in prose, always inside backticks, so that
// `congo-before-1886` is not counted as a mention of `congo`.
const mentions = (id) => survey.includes(`\`${id}\``);

const active = actors.filter((a) => a.status === 'active');
const seam = active.filter((a) => a.when?.end === 1885 || a.when?.start === 1886);

test(`every actor at the 1885/1886 seam is accounted for in ${SURVEY}`, () => {
  const unlisted = seam.filter((a) => !mentions(a.id)).map((a) => a.id).sort();
  assert.deepEqual(unlisted, [], unlisted.length
    ? `${unlisted.length} actor(s) sit at the seam and are named nowhere in ${SURVEY}: `
      + `${unlisted.slice(0, 10).join(', ')}${unlisted.length > 10 ? ', …' : ''}. `
      + 'Either the pair was joined or split and the survey was not told, or it was never surveyed. '
      + 'Both are the same mistake: the seam is only honest while it is written down.'
    : undefined);
});

// The second invariant is about what a split writes, and it holds vacuously
// until one does: a succession whose two actors overlap is not a succession,
// it is two records claiming the same ground at the same time. The 128
// `succeeded` relations the corpus already holds pass it, which is what makes
// it a guard on the new ones rather than a rewrite of the old.
const relationsDir = path.join(ROOT, 'data', 'relations');
const relations = [];
for (const file of await readdir(relationsDir)) {
  if (!file.endsWith('.json')) continue;
  relations.push(JSON.parse(await readFile(path.join(relationsDir, file), 'utf8')));
}
const byId = new Map(actors.map((a) => [a.id, a]));

test('a succession does not put its two actors alive at once', () => {
  const overlapping = [];
  for (const rel of relations) {
    if (rel.status !== 'active' || rel.type !== 'succeeded') continue;
    const from = byId.get(rel.from);
    const to = byId.get(rel.to);
    // A relation naming an actor that is not there is rule 11's business, not
    // this test's; it says nothing about a pair it cannot see.
    if (!from || !to) continue;
    const ended = from.when?.end;
    const began = to.when?.start;
    if (typeof ended !== 'number' || typeof began !== 'number') continue;
    if (began < ended) overlapping.push(`${rel.id}: ${rel.from} ends ${ended}, ${rel.to} begins ${began}`);
  }
  assert.deepEqual(overlapping.sort(), [],
    `${overlapping.length} succession(s) have a successor beginning before the predecessor ends`);
});

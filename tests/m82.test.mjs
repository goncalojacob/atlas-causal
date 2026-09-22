// M82 — the first screen. The pure half.
//
// Eight fixes, each from a numbered finding of `docs/review-2026-09-22.md`
// part A, and one test apiece asserting the *property* the fix is about
// rather than the shape it happens to have taken. Nothing here pins a count
// or a pixel: the corpus grows every day on two other branches, and a test
// that said "245" would be a test about yesterday.
//
// Written before the behaviour it judges (deviations 711 and 717).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { atlasOf, ROOT } from './helpers.mjs';
import { introHtml, WHAT_IT_IS } from '../src/intro.js';
import { MAIN_EVENT_HINT } from '../src/window-control.js';

const atlas = await atlasOf(path.join(ROOT, 'data'));
const indexHtml = await readFile(path.join(ROOT, 'index.html'), 'utf8');

// 1 — A3. The site says in plain words what it is, on the first screen and
// before anything is clicked, and the card says it in the same words.
//
// The two halves of the finding, and the third that came with it: the words a
// reader would have to be taught are gone from the card, and *main event* —
// which the count line uses — is explained once.
test('A3: the first screen says what the atlas is, in one sentence, in plain words', () => {
  // One sentence under the title, and the same sentence in the card.
  assert.ok(indexHtml.includes(WHAT_IT_IS), 'the masthead carries it under the title');
  assert.match(indexHtml, /<p class="tagline">[^<]*<\/p>/, 'as the tagline and not as a paragraph of prose');
  assert.ok(introHtml(atlas).includes(WHAT_IT_IS), 'and the intro card opens on it');

  // It is about the atlas and it names the corpus's own first year, so the
  // sentence cannot come apart from the data behind it.
  assert.ok(WHAT_IT_IS.includes(String(atlas.extent.min)), 'the year in it is the corpus’s own earliest');

  // None of the builder's words before the first click. `focus` is looked for
  // as a word of the prose, not as an attribute or a class.
  const card = introHtml(atlas);
  const prose = card.replace(/<[^>]*>/g, ' ');
  for (const word of ['walk', 'lens', 'chip', 'breadcrumb', 'other branches']) {
    assert.doesNotMatch(
      prose, new RegExp(`\\b${word}\\b`, 'i'),
      `"${word}" is the project's word for a thing, not the reader's`,
    );
  }
  assert.doesNotMatch(prose, /\bfocus(ing|es|ed)?\b/i, '"focus" likewise');

  // And what a main event is, said once where the word is used.
  assert.match(MAIN_EVENT_HINT, /not part of any larger event/);
});

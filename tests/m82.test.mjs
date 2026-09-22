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
import { standingHtml, standingSlot } from '../src/standing.js';
import {
  showsReview, setReview, bylineOf, ATLAS_BYLINE,
} from '../src/demo.js';
import { entryHtml } from '../src/entry/entry.js';
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

// 2 — A2. The review vocabulary is off the demo, behind one flag, and the
// records are untouched.
//
// The property, and not the wording: with the flag off nothing the atlas
// draws says a record is unread, a citation unchecked, or offers a door into
// review or contribution; with it on every one of them is back, word for
// word, out of the very same records. Asserted over the markup each card
// actually produces rather than by grepping the source.
test('A2: with the flag off nothing on a card is about reviewing, and with it on everything is', async () => {
  const record = {
    id: 'x', kind: 'event', status: 'active', title: 'x', review: { status: 'draft' },
  };
  const narrative = { id: 'n', authors: [{ name: 'Claude (assistant draft, unreviewed)' }], steps: [] };
  const entryRecord = {
    id: 'x', status: 'active', title: 'x', summary: 's', when: { start: 1900, end: 1900 }, actors: [],
  };

  setReview(false);
  assert.equal(standingHtml(record), '', 'no card says a record is unread');
  assert.equal(standingSlot(), '', 'and none of them keeps room for the line');
  assert.equal(bylineOf(narrative), ATLAS_BYLINE, 'an account is published under the atlas’s own name');
  assert.doesNotMatch(entryHtml(atlas, { kind: 'event', record: entryRecord }), /Edit this record/);

  setReview(true);
  assert.match(standingHtml(record), /Unread: no person has checked this record/);
  assert.notEqual(standingSlot(), '');
  assert.equal(bylineOf(narrative), 'Claude (assistant draft, unreviewed)', 'and the record still says what it says');
  assert.match(entryHtml(atlas, { kind: 'event', record: entryRecord }), /Edit this record/);
  setReview(null);

  // The flag is read off the URL and nowhere else, and it is off unless asked
  // for: a published page carries no query string.
  assert.equal(showsReview(''), false);
  assert.equal(showsReview('?from=1900'), false);
  assert.equal(showsReview('?review=1'), true);
  assert.equal(showsReview('?review'), true);
  assert.equal(showsReview('?review=0'), false);

  // Nothing under data/ moved: the two narratives are signed as they were.
  for (const n of atlas.activeNarratives ?? []) {
    assert.ok((n.authors ?? []).length > 0, `${n.id} still names its authors in the record`);
  }
});

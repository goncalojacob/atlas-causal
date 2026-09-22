// M85, the first review's remainder: the first picture is the whole span, the
// controls speak the reader's language, the public pages are one screen and a
// bibliography a reader can place, and two structural clean-ups.
//
// What a browser has to answer — that the first paint really does draw events
// from more than one century on each of the three views — is in
// `tests/m85-browser.test.mjs`. What is here needs no DOM.
//
// Written before the behaviour it judges (deviations 711 and 717). **Nothing
// here pins a count or a pixel**: every expectation about the corpus is
// derived from the corpus the test is run on, which is 22 September's lesson —
// M83's merged-lines test was true at 581 events and false at 668.

import { test } from 'node:test';
import path from 'node:path';
import assert from 'node:assert/strict';

import { defaultState } from '../src/state.js';
import { resolveWindow, centuryOf } from '../src/util/window.js';
import { extent } from '../src/util/dates.js';
import { workingSet } from '../src/emphasis.js';
import { stackTitle, stackBadge } from '../src/cluster.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

const atlas = await atlasOf(path.join(ROOT, 'data'));
const fixtures = await atlasOf(FIXTURE_DATA);
const CORPORA = [['data/', atlas], ['the fixtures', fixtures]];

// ─── 1. the first picture is the whole span (A4) ───────────────────────────
//
// `opensOn()` opened a crowded corpus on its densest century, so the resting
// map was 1900–1999: nothing of 1492–1899, and the first screen of an atlas
// about the world since 1492 said "Portugal in the 20th century". M65 is what
// makes the whole span cheap — at rest a view draws the main events alone.

test('at rest the window is the corpus’s own extent, and no century is chosen for the reader', () => {
  for (const [name, each] of CORPORA) {
    assert.ok(each.extent, `${name} has an extent`);
    assert.deepEqual(resolveWindow(defaultState(), each.extent),
      { from: each.extent.min, to: each.extent.max },
      `${name}: the resting window is the whole of the data`);
    assert.equal(each.opens, undefined,
      `${name}: nothing computes an opening window for the reader`);
  }
});

test('and the resting picture really does cross more than one century', () => {
  for (const [name, each] of CORPORA) {
    const centuries = new Set();
    for (const id of workingSet(each, defaultState()).shown) {
      const event = each.events.get(id);
      if (event) centuries.add(centuryOf(extent(event.when).min));
    }
    assert.ok(centuries.size > 1,
      `${name}: the main events at rest fall in ${centuries.size} century/centuries`);
  }
});

test('a stack says how many events it hides, in the words its own title uses', () => {
  assert.match(stackTitle('Carnation Revolution', 47), /— and 46 more events here$/);
  assert.match(stackTitle('One thing', 2), /— and 1 more event here$/, 'and in the singular');
  // A stack the graph draws adds the years it covers; the words are the same.
  assert.match(stackTitle('A thing', 3, { span: '1910–1911' }), /2 more events here, 1910–1911$/);

  // The badge beside the mark: the same count, in the same words, and never a
  // bare "+46", which a reader of the first screen reads as a typo (A4).
  for (const count of [2, 3, 47]) {
    const badge = stackBadge(count);
    assert.doesNotMatch(badge, /^\+\d+$/, `"${badge}" is a bare count behind a plus`);
    assert.match(badge, new RegExp(`^${count - 1} more$`), 'and it says how many are hidden');
    assert.ok(stackTitle('x', count).includes(badge), 'in the title’s own words');
  }
});

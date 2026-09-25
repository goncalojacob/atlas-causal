// M88 — what the third review found in the display. The pure half.
//
// One test per section whose property can be asserted without a browser; the
// rest are in the browser suites the brief names. Nothing here pins a count or
// a pixel: the corpus grows every day on two other branches, and every
// expectation is derived from the corpus the test runs on.
//
// Written before the behaviour it judges (deviations 711 and 717).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { atlasOf, ROOT } from './helpers.mjs';
import { defaultState } from '../src/state.js';
import { lensView } from '../src/lens.js';
import {
  DEGREE_OFF, DEGREE_OFF_ID, degreeOffText, degreeControlHtml,
} from '../src/graph-filters.js';

const atlas = await atlasOf(path.join(ROOT, 'data'));

// ─── 11. the degree control says why it is off, to everyone (B11) ───────────

test('the degree control carries its reason as text under a lens, and nothing at rest', () => {
  // The lens is derived, as `tests/m86.test.mjs` derives it: choosing an event
  // is a lens of one since H7/M65, and the floor is by rule off inside one.
  const [event] = [...atlas.activeEvents];
  assert.ok(event, 'the corpus has an active event to open');
  const open = { ...defaultState(), selected: event.id, degree: 2 };
  assert.ok(lensView(atlas, open), 'choosing an event is a lens');

  assert.equal(degreeOffText(atlas, open), DEGREE_OFF, 'under a lens it says why it is off');
  assert.equal(degreeOffText(atlas, defaultState()), '', 'and at rest it says nothing at all');
  // An atlas the control was given none of is not a lens either: the control
  // is built before the graph is, and a reason invented then would be wrong.
  assert.equal(degreeOffText(null, open), '');
});

test('the reason is named by the select, so it is read out with it', () => {
  const html = degreeControlHtml();
  assert.match(html, new RegExp(`aria-describedby="${DEGREE_OFF_ID}"`), 'the select names its description');
  assert.match(html, new RegExp(`<span id="${DEGREE_OFF_ID}" class="visually-hidden"></span>`), 'and the description is there to be named');
  // Visually hidden and not `hidden`: an element with `hidden` is not read out
  // at all, which would be the tooltip again by another name.
  assert.doesNotMatch(html, new RegExp(`id="${DEGREE_OFF_ID}"[^>]*\\shidden`), 'the reason is not hidden from the reader who needs it');
  // And the tooltip stays for the pointer: it is set on the element, not
  // written into the markup, so what is asserted here is only that the markup
  // does not carry a second copy of the sentence.
  assert.doesNotMatch(html, /Off while an event is open/, 'the sentence is written once, by the render');
});

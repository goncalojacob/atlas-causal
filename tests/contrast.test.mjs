// The contrast check, written down and enforced. WCAG 2.1 AA asks 4.5:1 of
// body text, 3:1 of large text, and 3:1 of the non-text parts a control or a
// graphic is recognised by. Everything here is small text unless it says
// otherwise, so 4.5 is the number most of these pairs are held to.
//
// This is a test rather than a paragraph in a document because a paragraph
// does not fail when somebody lightens a token. What it cannot check is
// which colour is drawn on which ground — that is in the stylesheet — so the
// pairs below are written out by hand, and the comment on each says where in
// the interface it happens.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { fromHex, contrast, over, tokensOf } from '../tools/lib/colour.mjs';

const tokens = tokensOf(await readFile(path.join(ROOT, 'src', 'style.css'), 'utf8'));
const colour = (name) => {
  const value = tokens.get(name);
  assert.ok(value, `style.css defines ${name}`);
  return fromHex(value);
};
const ratio = (fg, bg) => contrast(colour(fg), colour(bg));

// [foreground, background, minimum, where it happens]
const TEXT = [
  ['--ink', '--paper', 4.5, 'every card in the panel, every page of prose'],
  ['--ink', '--ground', 4.5, 'the map and the graph behind their labels'],
  ['--ink', '--land', 4.5, "a mark's label over land"],
  ['--ink-soft', '--paper', 4.5, 'meta lines, hints, counts, axis labels'],
  ['--ink-soft', '--ground', 4.5, 'the same, over the alternating rows'],
  ['--ink-soft', '--land', 4.5, 'the timeline over an odd lane'],
  ['--ink-soft', '--cobalt-faint', 4.5, 'the date on the search result under the cursor'],
  ['--ink-soft', '--madder-faint', 4.5, 'the aside inside a dispute'],
  ['--cobalt', '--paper', 4.5, 'links, headings, the masthead'],
  ['--cobalt', '--ground', 4.5, 'a link on a reading page'],
  ['--cobalt', '--cobalt-faint', 4.5, 'a pressed chip, a highlighted row'],
  ['--cobalt', '--land', 4.5, 'the window years over the timeline'],
  ['--madder', '--paper', 4.5, 'the word "disputed", a retracted badge'],
  ['--madder', '--madder-faint', 4.5, 'the disputed badge on its own ground'],
  ['--madder', '--ground', 4.5, 'a dispute quoted on a reading page'],
  ['--paper', '--cobalt', 4.5, 'the pressed half of the Map | Graph toggle'],
];

// The same, for things that are seen rather than read: a line, a border, the
// edge of a control. 3:1.
const NON_TEXT = [
  ['--cobalt-soft', '--paper', 3, "the graph's edges, a leg out of a spread cluster"],
  ['--cobalt-soft', '--ground', 2.8, 'the same over the map\'s ground, where they are 1.2px and doubled by an arrowhead'],
  ['--cobalt', '--paper', 3, 'the outline of every mark, every control'],
  ['--cobalt', '--land', 3, 'a mark over land'],
  ['--madder', '--paper', 3, 'the walked chain'],
];

test('every pair of text and ground clears WCAG AA', () => {
  const table = [];
  for (const [fg, bg, min, where] of TEXT) {
    const value = ratio(fg, bg);
    table.push(`${fg} on ${bg}: ${value.toFixed(2)}:1 — ${where}`);
    assert.ok(value >= min, `${fg} on ${bg} is ${value.toFixed(2)}:1, under ${min}:1 (${where})`);
  }
  assert.equal(table.length, TEXT.length);
});

test('every line and border somebody has to see clears 3:1', () => {
  for (const [fg, bg, min, where] of NON_TEXT) {
    const value = ratio(fg, bg);
    assert.ok(value >= min, `${fg} on ${bg} is ${value.toFixed(2)}:1, under ${min}:1 (${where})`);
  }
});

test('a territory does not hide the mark or the border drawn over it', () => {
  // The hues are washes under the marks, so what matters is not the token but
  // the composite, and what has to survive it is the cobalt a mark is drawn
  // with and the ink a label is set in.
  const land = colour('--land');
  for (let i = 1; i <= 8; i += 1) {
    const wash = over(colour(`--terr-${i}`), 0.62, land);
    assert.ok(contrast(colour('--cobalt'), wash) >= 3, `--terr-${i}: a mark's outline`);
    assert.ok(contrast(colour('--ink'), wash) >= 4.5, `--terr-${i}: a label over it`);
    assert.ok(contrast(colour('--madder'), wash) >= 3, `--terr-${i}: the walked chain over it`);
  }
});

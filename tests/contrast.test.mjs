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
import { fromHex, contrast, distance, over, tokensOf } from '../tools/lib/colour.mjs';
import { BAND_EDGES } from '../tools/import/elevation.mjs';

const css = await readFile(path.join(ROOT, 'src', 'style.css'), 'utf8');
const tokens = tokensOf(css);
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
  // The ring around whatever the reader has open, since M84. It is a mark's
  // whole outline on the map and the graph and a bar's on the timeline, so it
  // is held to what any other mark's outline is held to, on both grounds the
  // pictures give it.
  ['--terr-5-line', '--paper', 3, 'the ring around the event that is open'],
  ['--terr-5-line', '--land', 3, 'the same over land'],
  ['--terr-5-line', '--terr-5-tint', 3, "a ring bar's outline over its own fill, on the timeline"],
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

// ─── M45b: the elevation bands ─────────────────────────────────────────────
//
// The bands are the only layer with a fill across open land, so everything the
// atlas draws is drawn over them and the darkest one is the hardest ground on
// the map. The brief asks for it to be proved by screenshot (§2.4) — it is,
// under `docs/screens/m45b-*.png` — and a screenshot is not a test, so the
// same promise is held here in numbers.
//
// The opacities are **read off the stylesheet** rather than written out here:
// the tint a band is drawn in is one value and it lives at the rule, and a
// second copy in this file would be free to fall out of step with it.
const bandOpacities = () => [...css.matchAll(/\.band-(\d)\s*\{\s*fill-opacity:\s*([\d.]+)/g)]
  .map(([, band, alpha]) => [Number(band), Number(alpha)])
  .sort((a, b) => a[0] - b[0]);

test('the five bands are a ramp: one token, five opacities, lightest low', () => {
  const opacities = bandOpacities();
  assert.equal(opacities.length, BAND_EDGES.length, 'one tint per band and no more');
  assert.deepEqual(opacities.map(([band]) => band), BAND_EDGES.map((_, i) => i));
  for (let i = 1; i < opacities.length; i += 1) {
    assert.ok(opacities[i][1] > opacities[i - 1][1],
      `band ${i} is no darker than band ${i - 1}: lightest low is the whole ramp`);
  }
  // And the ramp is one token, so the ground is one colour said five times and
  // never a second palette (M45b, "no new hex value, no new token").
  const fills = [...css.matchAll(/\.map \.layer-base-relief path \{[^}]*fill:\s*var\((--[a-z-]+)\)/g)];
  assert.deepEqual(fills.map((m) => m[1]), ['--ink-soft']);
});

test('every band can be told from the one below it, and from bare land', () => {
  // 0.02 in OKLab is where a large flat field stops being tellable from its
  // neighbour — the number the eight territory hues were spread by — and five
  // steps that a reader cannot count are not five bands (M45b: "if five bands
  // cannot be told apart, use fewer and say so").
  const land = colour('--land');
  let previous = land;
  for (const [band, alpha] of bandOpacities()) {
    const wash = over(colour('--ink-soft'), alpha, land);
    assert.ok(distance(wash, previous) >= 0.02,
      `band ${band} is ${distance(wash, previous).toFixed(3)} in OKLab from the one under it`);
    previous = wash;
  }
});

test('the darkest band still leaves a mark, a label, the chain and a territory legible', () => {
  const land = colour('--land');
  const [, darkest] = bandOpacities().at(-1);
  const wash = over(colour('--ink-soft'), darkest, land);
  assert.ok(contrast(colour('--cobalt'), wash) >= 4.5, "an event mark's outline over the highest ground");
  assert.ok(contrast(colour('--ink'), wash) >= 4.5, 'its label over the same');
  assert.ok(contrast(colour('--madder'), wash) >= 3, 'the walked chain over it');
  assert.ok(contrast(colour('--ink-soft'), wash) >= 3, 'a peak, which is drawn in the same token');
  // And the territories, which are the thing the ground is under: a hue at
  // 0.62 over the darkest band is still a hue and not the band.
  for (let i = 1; i <= 8; i += 1) {
    const territory = over(colour(`--terr-${i}`), 0.62, wash);
    assert.ok(distance(territory, wash) >= 0.02,
      `--terr-${i} over the highest band is ${distance(territory, wash).toFixed(3)} in OKLab from it`);
  }
});

test('and nothing the atlas already promised is weakened by the ground under it', () => {
  // The hardest ground on the map is the highest band with a territory washed
  // over it, and that is where the three promises of the table above have to
  // go on holding: a mark at 3:1, its label at 4.5, the walked chain at 3.
  // The darkest band is set to the largest opacity that keeps all three
  // (src/style.css), and this is the assertion that fixes it there.
  const land = colour('--land');
  const [, darkest] = bandOpacities().at(-1);
  const wash = over(colour('--ink-soft'), darkest, land);
  for (let i = 1; i <= 8; i += 1) {
    const ground = over(colour(`--terr-${i}`), 0.62, wash);
    assert.ok(contrast(colour('--cobalt'), ground) >= 3, `--terr-${i} over the highest band: a mark's outline`);
    assert.ok(contrast(colour('--ink'), ground) >= 4.5, `--terr-${i} over the highest band: a label`);
    assert.ok(contrast(colour('--madder'), ground) >= 3, `--terr-${i} over the highest band: the walked chain`);
  }
});

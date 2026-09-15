// The twelve symbols, against the twelve categories.
//
// A glyph is a claim about a record — "this was a war" — so the first thing to
// hold is that the two lists are the same list: a category with no symbol would
// be an event drawn as if it had no category, and a symbol with no category
// would be a shape the atlas can never draw. Neither would fail anywhere else.
//
// The rest is what `glyphs-brief.md` §2 sets out and what the browser cannot
// check: the box, the absence of colour, and that the symbol and the ring agree
// about what a record is wearing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GLYPH_BOX, GLYPH_CATEGORIES, glyphAttributes, glyphClasses, glyphId, hasGlyph,
} from '../src/map/glyphs.js';
import { ringClasses } from '../src/parts.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULE = path.join(ROOT, 'src', 'map', 'glyphs.js');

const categoriesIn = async (file) => JSON.parse(await readFile(file, 'utf8')).map((c) => c.id);

test('every category has a symbol and every symbol has a category', async () => {
  const ids = await categoriesIn(path.join(ROOT, 'data', 'categories.json'));
  assert.equal(ids.length, 12);
  assert.deepEqual([...GLYPH_CATEGORIES].sort(), [...ids].sort());
  for (const id of ids) assert.ok(hasGlyph(id), `${id} has no symbol`);
});

// The fixtures draw the same symbols out of the same table, so a fixture
// category the module does not know would be a glyph the browser tests silently
// never see.
test('the fixture categories are categories the module knows', async () => {
  const ids = await categoriesIn(path.join(ROOT, 'tests', 'fixtures', 'data', 'categories.json'));
  assert.ok(ids.length >= 3, `three fixture categories at least, got ${ids.length}`);
  for (const id of ids) assert.ok(hasGlyph(id), `${id} has no symbol`);
});

// Ten units, the mark's own diameter (review of the map block, F14; the brief's
// amendment A1). Six was tried and struck: twelve line drawings are not
// tellable apart at six pixels, which is below the standard the brief sets
// itself.
test('the symbols are drawn in a 10 x 10 box, stroked and never filled', async () => {
  const text = await readFile(MODULE, 'utf8');
  assert.equal(GLYPH_BOX, 10);
  // `fill` appears once, in the shared stroke table, and says `none`.
  const fills = [...text.matchAll(/fill:\s*'([^']*)'/g)].map((m) => m[1]);
  assert.deepEqual(fills, ['none'], 'a symbol with a fill would be a blot at ten pixels');
  assert.match(text, /stroke:\s*'currentColor'/, 'the colour comes from the <use>, not from here');
  assert.match(text, /'vector-effect':\s*'non-scaling-stroke'/);
});

// The one thing `tests/site.test.mjs` cannot say for this file in particular:
// not merely "no hex under src/" but no colour at all. `currentColor` resolving
// against the `<use>` is what lets one symbol be cobalt over paper and paper
// over madder without a second copy of it.
test('the module names no colour of its own', async () => {
  const text = await readFile(MODULE, 'utf8');
  const code = text.split('\n').filter((line) => !line.trimStart().startsWith('//')).join('\n');
  assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(code, /\b(?:rgb|hsl)a?\s*\(/i);
  assert.doesNotMatch(code, /var\(\s*--/, 'a token here would be a colour this file chose');
});

// The same substitution, from the same function (parts.js, `overlayClasses`).
// Two copies of it are how the ring and the symbol come to disagree about what
// a record is wearing.
test('glyphClasses agrees with ringClasses on the same input', () => {
  const cases = [
    ['mark', 'mark'],
    ['mark on-path', 'mark'],
    ['mark faded lens-near in-horizon far', 'mark'],
    ['bar instant selected', 'bar'],
    ['bar of-actor on-path', 'bar'],
    ['', 'mark'],
  ];
  for (const [classes, base] of cases) {
    const glyph = glyphClasses(classes, base);
    const ring = ringClasses(classes, base);
    assert.equal(glyph.replace(/^glyph/, 'ring'), ring, classes);
    assert.ok(glyph.startsWith('glyph'), classes);
    assert.ok(!glyph.split(' ').includes(base), `${classes}: the symbol does not take "${base}"`);
  }
});

// A category nobody recognises is answered with nothing drawn, never with a
// question mark: a shape that means "the atlas does not know" would be a
// thirteenth glyph, and a reader would take it for a category.
test('an unknown category draws nothing and throws nothing', () => {
  for (const value of [null, undefined, '', 'not-a-category', 'War', 42, {}]) {
    assert.equal(hasGlyph(value), false, String(value));
  }
  assert.doesNotThrow(() => hasGlyph(null));
});

// Never a control: no `data-id`, no `data-mark`, no `tabindex`, and
// `pointer-events` on the element itself rather than only in the stylesheet
// (m30b-brief, A2). The click lands on the mark under it.
test('a glyph carries no identity and takes no pointer', () => {
  const attrs = glyphAttributes('war', { x: 100, y: 50, size: 10, classes: 'glyph on-path' });
  assert.equal(attrs.href, `#${glyphId('war')}`);
  assert.equal(attrs['pointer-events'], 'none');
  assert.equal(attrs.class, 'glyph on-path');
  // Centred on the point it was given: a symbol offset from its mark would land
  // where the cluster badge already is.
  assert.equal(attrs.x, 95);
  assert.equal(attrs.y, 45);
  assert.equal(attrs.width, 10);
  assert.equal(attrs.height, 10);
  for (const key of ['data-id', 'data-mark', 'data-cluster', 'tabindex', 'role', 'aria-label']) {
    assert.ok(!(key in attrs), `a glyph must not carry ${key}`);
  }
});

test('the module imports no DOM at the top level', async () => {
  // It is imported here, in Node, with no document in sight; `tests/site.test.mjs`
  // holds every module under src/ to the same thing, and this says why it
  // matters for this one: the symbols are built when a view asks, not at import.
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof hasGlyph, 'function');
});

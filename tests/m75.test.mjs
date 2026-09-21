// M75: the band is always on the map.
//
// The owner, 21 September, after M60 moved the window to the masthead and M64
// put the band back behind a button: *"still don't like the way years are
// selected when looking at the map, should be more intuitive"* — and, asked
// what shape the fix should take: **"The dates two-handled band should not be
// hidden."**
//
// So the control M64 built is kept whole and the mode around it is removed.
// This is the half `node --test` can hold without a browser: that there is no
// `dates` button left anywhere, that nothing about the band is remembered any
// more, that it is still the one band and still an overlay, and that the
// masthead's hint and the strip's profile are not two drawings of one
// question. The pictures are `tests/m75-browser.test.mjs`.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **Nothing here pins a count or a pixel.** What is asserted is the shape of
// the answer — one band, one overlay, no stored preference — and never a
// number that the next import or the next stylesheet would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { HANDLE_WIDTH, bandEvents } from '../src/window-band.js';
import { STRIP } from '../src/map-band.js';
import * as panes from '../src/panes.js';
import { workingSet } from '../src/emphasis.js';
import { defaultState, parseState, formatState } from '../src/state.js';
import { buildAdjacency } from '../src/graph.js';
import { ROOT } from './helpers.mjs';

const read = (file) => readFile(path.join(ROOT, file), 'utf8');
const at = (patch) => ({ ...defaultState(), ...patch });
const sorted = (ids) => [...ids].sort();

// The same corpus `tests/m64.test.mjs` and `tests/m65.test.mjs` use: a war with
// two parts inside it, a treaty one hop from a part, and something unrelated.
const event = (id, { parent = null, when = { start: 1500, end: 1500 } } = {}) => {
  const record = { id, title: id, status: 'active', when, place: null, region: 'europe', weight: 0, actors: [] };
  if (parent) record.parent = parent;
  return record;
};
const edge = (from, to) => [`${from}--${to}--caused`, {
  id: `${from}--${to}--caused`, from, to, type: 'caused', confidence: 'consensus', status: 'active',
}];

function topology() {
  const events = [
    event('war', { when: { start: 1500, end: 1520 } }),
    event('battle-a', { parent: 'war', when: { start: 1505, end: 1505 } }),
    event('battle-b', { parent: 'war', when: { start: 1510, end: 1510 } }),
    event('treaty', { when: { start: 1521, end: 1521 } }),
    event('elsewhere', { when: { start: 1600, end: 1600 } }),
  ];
  const edges = new Map([edge('battle-a', 'treaty')]);
  return {
    activeEvents: events,
    events: new Map(events.map((e) => [e.id, e])),
    edges,
    childrenOf: new Map([['war', ['battle-a', 'battle-b']]]),
    adjacency: buildAdjacency(events, [...edges.values()]),
    actors: new Map(),
    places: new Map(),
    sources: new Map(),
    narratives: new Map(),
    relations: new Map(),
    regions: [{ id: 'europe', label: 'Europe' }],
    eventsByActor: new Map(),
    extent: { min: 1500, max: 1600 },
    opens: null,
    resolve: () => null,
  };
}

// ─── 1. there is no `dates` control anywhere ───────────────────────────────
//
// The owner's sentence is about a control being hidden, so what is removed is
// the hiding and not the band. The assertion is structural, because a button
// that happened to be left in the document unclicked would still be the fault:
// the reader would meet it.

test('the map band builds no button at all: there is nothing left to press', async () => {
  const source = await read('src/map-band.js');
  assert.ok(!/map-band-toggle/.test(source),
    'the `dates` button is gone from the module that used to build it');
  assert.ok(!/html\('button'/.test(source),
    'and no button of any other name took its place');
  assert.ok(!/aria-expanded/.test(source),
    'nothing on the map says whether the band is open, because it is never closed');
});

test('the stylesheet has no rule for a control that no longer exists', async () => {
  const css = await read('src/style.css');
  assert.ok(!css.includes('.map-band-toggle'),
    'a rule for a removed element is a rule nobody can see is dead');
  // And the strip itself is still styled: what went is the button, not the band.
  assert.ok(css.includes('.window-strip'), 'the strip is still drawn');
});

// ─── 2. nothing about the band is remembered ───────────────────────────────
//
// Deviation 848's rule: a preference with nowhere left to apply is not read,
// and a value a reader's browser still holds from M64 is simply left where it
// is. The band is on every visit, so there is no state of it to store.

test('panes.js remembers the panel’s width and nothing about the band', async () => {
  assert.ok(!('BAND_KEY' in panes), 'the key is gone');
  assert.ok(!('readBandOpen' in panes), 'and so is the reader');
  assert.ok(!('writeBandOpen' in panes), 'and the writer');
  const source = await read('src/panes.js');
  assert.ok(!/atlas-causal\.band/.test(source),
    'the string itself is gone: a stored value from M64 is read into nothing');
  // The one thing it does remember is untouched.
  assert.equal(panes.STORAGE_KEY, 'atlas-causal.panes');
  assert.equal(typeof panes.readSizes, 'function');
});

test('the band asks storage for nothing: it does not import panes.js at all', async () => {
  const source = await read('src/map-band.js');
  assert.ok(!/from '\.\/panes\.js'/.test(source),
    'there is no preference to read, so there is nothing to read it from');
  assert.ok(!/localStorage/.test(source),
    'and nothing reaches around the import for it either');
});

test('the URL still says nothing about a control, because there is no control', () => {
  assert.ok(!('band' in defaultState()));
  const opened = parseState('?band=open&from=1500&to=1600');
  assert.ok(!('band' in opened), 'a link that names one names nothing');
  assert.equal(opened.from, 1500, 'but the window it carries is still read');
  assert.ok(!formatState(opened).includes('band'));
  assert.equal(formatState(defaultState()), '', 'and the default still writes nothing at all');
});

// ─── 3. it is still M64's band ─────────────────────────────────────────────
//
// The brief: "nothing is rebuilt". That there is **one** band, built in one
// module, with one set of gestures, is `tests/m64.test.mjs`'s own assertion and
// it still runs — this milestone did not touch what it is about, so there is no
// second copy of it here. What is asserted here is the one thing about it M75
// could have broken on its way to removing the button: what the band is drawn
// over.

test('and it is still drawn over what the atlas is showing, which is M65’s own set', () => {
  const t = topology();
  for (const state of [at({}), at({ selected: 'war' })]) {
    assert.deepEqual(
      sorted(bandEvents(t, state).map((e) => e.id)),
      sorted(workingSet(t, state).shown),
      'the profile is over `shown` and never the corpus',
    );
  }
});

// ─── 4. an overlay and not a row of the grid ───────────────────────────────
//
// M60's gain, which this milestone must keep: the map pane is the whole
// layout's height. The browser suite asserts it as a measured property; here
// it is asserted as the thing that makes it true.

test('the strip is still an overlay, so the map pane is still the whole layout', async () => {
  const css = await read('src/style.css');
  const block = css.slice(css.indexOf('.map-band {'), css.indexOf('.map-band > *'));
  assert.match(block, /position:\s*absolute/,
    'the band is over the map and not a row of the grid: that is what stops it becoming the strip again');
  const layout = css.slice(css.indexOf('.layout {'), css.indexOf('.map-area'));
  assert.match(layout, /grid-template-rows:\s*minmax\(0,\s*1fr\);/);
  assert.ok(!/"timeline/.test(layout), 'and still no row for a strip');
});

test('its geometry still leaves room for the two years above the band they label', () => {
  assert.ok(STRIP.marker > 0 && STRIP.marker < STRIP.height,
    'the years are written on their own row above the band');
  assert.ok(STRIP.inset >= HANDLE_WIDTH / 2,
    'a handle at either end of the data is drawn whole and not half off the edge');
});

// ─── 5. the masthead's hint, and the two fields ────────────────────────────
//
// M75 measured the hint against the strip's profile, found them two questions
// over two sets, and kept it against the brief's permission to remove it
// (deviation 1000). **M76 removed it, with the two number fields beside it**,
// and the measurement is why rather than in spite of it: the owner's next
// sentence was about the band not looking narrowed, and one of the three
// candidates the M76 brief lists is a corpus-wide profile sitting on the same
// row as the years, never narrowing, while the one below it does. The two
// tests that stood here are therefore not re-pointed at anything — the thing
// they were about is gone, and `tests/m76.test.mjs` asserts its absence.
//
// What M75 asserted that M76 did not touch is above: the band is still drawn
// over what the atlas is showing, it is still an overlay, and its geometry
// still leaves the two years their row.

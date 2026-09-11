// The territory palette: the eight hues themselves, and the tool that hands
// one of them to each actor.
//
// The colour half is a real test and not a snapshot of taste: it asserts that
// no two hues collapse into each other at the opacity they are drawn with,
// that none of them can be mistaken for the two colours that carry emphasis,
// and that the outlines are dark enough to be borders. The colouring half
// asserts the property the whole tool exists for — no two neighbours alike —
// and that the answer does not move when the input does not.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { fromHex, distance, over, contrast, tokensOf } from '../tools/lib/colour.mjs';
import { HUES, GRID, boundaryCells, buildAdjacency, colour, conflictsOf, hueActorOf, buildPalette, comparePalette, readPalette } from '../tools/build-palette.mjs';

const css = await readFile(path.join(ROOT, 'src', 'style.css'), 'utf8');
const tokens = tokensOf(css);
const token = (name) => {
  const value = tokens.get(name);
  assert.ok(value, `style.css defines ${name}`);
  return fromHex(value);
};
const hues = [...Array(HUES).keys()].map((i) => i + 1);
// The opacities the map draws these at; style.css is where they live and this
// is the one place that has to know them as numbers.
const FILL = 0.62;
const DEPENDENCY = 0.70;

const pairs = (list) => list.flatMap((a, i) => list.slice(i + 1).map((b) => [a, b, i]));

test('style.css defines eight hues, each with a tint and a line', () => {
  for (const i of hues) {
    for (const suffix of ['', '-tint', '-line']) assert.ok(tokens.has(`--terr-${i}${suffix}`), `--terr-${i}${suffix}`);
  }
  assert.ok(!tokens.has(`--terr-${HUES + 1}`), 'and no ninth, which no class would draw');
});

test('no two territory hues collapse into each other where they are drawn', () => {
  const land = token('--land');
  const fills = hues.map((i) => over(token(`--terr-${i}`), FILL, land));
  const tints = hues.map((i) => over(token(`--terr-${i}-tint`), DEPENDENCY, land));
  // 0.02 in OKLab is roughly where two large flat fields stop being tellable
  // apart, and a country is not a large flat field: Portugal is nine pixels
  // wide on a world map beside a Spain twelve times its size. The thresholds
  // here are what the alternating lightness bought — comfortably over twice
  // the just-noticeable difference — and they are asserted so that a later
  // hand cannot quietly give it back.
  for (const [a, b, i] of pairs(fills)) assert.ok(distance(a, b) > 0.05, `fills ${i} and ${fills.indexOf(b)}: ${distance(a, b)}`);
  for (const [a, b] of pairs(tints)) assert.ok(distance(a, b) > 0.04, `tints: ${distance(a, b)}`);
  // And each is visible against empty land at all.
  for (const fill of fills) assert.ok(distance(fill, land) > 0.06);
  for (const tint of tints) assert.ok(distance(tint, land) > 0.03);
});

test('no territory hue can be taken for the selection or for the walked path', () => {
  const land = token('--land');
  const cobalt = token('--cobalt');
  const madder = token('--madder');
  for (const i of hues) {
    const fill = over(token(`--terr-${i}`), FILL, land);
    assert.ok(distance(fill, cobalt) > 0.25, `--terr-${i} against cobalt`);
    assert.ok(distance(fill, madder) > 0.25, `--terr-${i} against madder`);
  }
});

test('every territory outline is dark enough to be a border', () => {
  const paper = token('--paper');
  for (const i of hues) {
    // 3:1 is WCAG AA for the non-text parts a thing is recognised by; these
    // clear the 4.5:1 asked of text as well.
    assert.ok(contrast(token(`--terr-${i}-line`), paper) >= 4.5, `--terr-${i}-line on paper`);
  }
});

// --- the tool -----------------------------------------------------------

// Four unit squares in a row, the first two touching, the third a whisker
// away, the fourth far off. Coordinates in degrees, so "a whisker" is one
// grid cell and "far off" is many.
const square = (x0, y0, side = 1) => ({
  type: 'Polygon',
  coordinates: [[[x0, y0], [x0 + side, y0], [x0 + side, y0 + side], [x0, y0 + side], [x0, y0]]],
});
const presence = (id, actor, key, extra = {}) => ({
  id, kind: 'presence', actor, status: 'active', dependencyOf: null,
  when: { start: 1900, end: null }, geometry: { files: ['geo/presences/1900-1999.json'], key }, ...extra,
});

test('boundaries land in the cells they pass through, corners included', () => {
  const cells = boundaryCells(square(0, 0, 1));
  // A degree square on a quarter-degree grid touches five cells a side — the
  // closing corner lands in the next one — and none of the interior.
  assert.equal(cells.size, 5 * 5 - (3 * 3), `${[...cells].sort()}`);
  assert.ok(cells.has(`0,0`) && cells.has(`${1 / GRID},${1 / GRID}`));
  // A segment longer than a cell is walked, not sampled at its ends only:
  // an outline simplified to two points still finds its neighbours.
  const long = boundaryCells({ type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 1], [0, 0]]] });
  assert.ok(long.has('20,0'), 'the middle of a ten-degree edge');
  assert.equal(boundaryCells({ type: 'Point', coordinates: [0, 0] }).size, 0);
});

test('adjacency is touching-or-nearly, per period, over the drawn hue', () => {
  const geometry = new Map([['geo/presences/1900-1999.json', new Map([
    ['a', square(0, 0)],
    ['b', square(1, 0)],
    ['c', square(2.2, 0)],
    ['d', square(40, 0)],
    // Held by a, so it is drawn in a's hue and is a's neighbour's neighbour.
    ['e', square(3.2, 0)],
  ])]]);
  const presences = [
    presence('p-a', 'a', 'a'), presence('p-b', 'b', 'b'), presence('p-c', 'c', 'c'),
    presence('p-d', 'd', 'd'), presence('p-e', 'e', 'e', { dependencyOf: 'a' }),
  ];
  const adjacency = buildAdjacency(presences, geometry);
  assert.deepEqual([...adjacency.get('a').keys()], ['b', 'c'], 'shares a border with b; c is a cell away, and e is itself');
  assert.deepEqual([...adjacency.get('d').keys()], [], 'forty degrees away is nobody\'s neighbour');
  assert.equal(adjacency.has('e'), false, 'a dependency holds no hue of its own');
  assert.equal(hueActorOf(presences[4]), 'a');
  assert.ok(adjacency.get('a').get('b') > 0, 'the weight is the length of the shared border');

  // Two polities on the same ground in different decades never met.
  const sequential = [presence('p-a', 'a', 'a'), presence('p-f', 'f', 'b', { when: { start: 1990, end: null } })];
  const later = buildAdjacency([{ ...sequential[0], when: { start: 1900, end: 1950 } }, sequential[1]], geometry);
  assert.deepEqual([...later.get('a').keys()], []);
});

test('no two neighbours share a hue, and an island still gets one', () => {
  // A ring of nine, each touching the next: more than eight around one cycle,
  // which is where a careless colouring runs out.
  const squares = new Map();
  const presences = [];
  for (let i = 0; i < 9; i += 1) {
    squares.set(`k${i}`, square(i, 0));
    presences.push(presence(`p-${i}`, `actor-${i}`, `k${i}`));
  }
  squares.set('island', square(80, 40));
  presences.push(presence('p-island', 'island', 'island'));
  const adjacency = buildAdjacency(presences, new Map([['geo/presences/1900-1999.json', squares]]));
  const { assigned, spilled } = colour(adjacency);
  assert.deepEqual(spilled, {}, 'a chain of nine fits in eight hues');
  assert.deepEqual(conflictsOf(adjacency, assigned), {});
  assert.ok(assigned.has('island'), 'an island with no neighbours is still coloured');
  for (const [id, weights] of adjacency) {
    for (const other of weights.keys()) assert.notEqual(assigned.get(id), assigned.get(other), `${id} and ${other}`);
  }
  // Every hue is in range, and the same input gives the same answer.
  for (const hue of assigned.values()) assert.ok(Number.isInteger(hue) && hue >= 0 && hue < HUES);
  assert.deepEqual([...colour(adjacency).assigned], [...assigned], 'deterministic');
});

test('when the hues run out the file says who is sharing', () => {
  // Ten mutual neighbours: eight hues cannot separate them and nothing can.
  const adjacency = new Map();
  const ids = [...Array(10).keys()].map((i) => `a${i}`);
  for (const id of ids) adjacency.set(id, new Map(ids.filter((o) => o !== id).map((o) => [o, 1])));
  const { assigned, spilled } = colour(adjacency);
  assert.ok(Object.keys(spilled).length >= 2, 'and it says so rather than pretending');
  for (const [id, others] of Object.entries(spilled)) {
    for (const other of others) assert.equal(assigned.get(id), assigned.get(other));
  }
});

test('data/geo/palette.json is what the tool produces', async () => {
  const built = await buildPalette(path.join(ROOT, 'data'));
  assert.deepEqual(comparePalette(await readPalette(path.join(ROOT, 'data')), built), [],
    'run node tools/build-palette.mjs');
  const palette = JSON.parse(built);
  assert.equal(palette.hues, HUES);
  assert.deepEqual(palette.spilled, {}, 'the atlas\'s own borders fit in eight hues');
  const values = Object.values(palette.actors);
  assert.ok(values.length > 100);
  for (const hue of values) assert.ok(Number.isInteger(hue) && hue >= 0 && hue < HUES);
  // Portugal and Spain share the longest border on this map; if the tool ever
  // gives them one hue, it has stopped working.
  assert.notEqual(palette.actors.portugal, palette.actors.spain);
});

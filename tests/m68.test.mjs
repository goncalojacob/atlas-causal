// M68: the categories can be switched from every view.
//
// Deviation 858 (M60) said it and did not fix it: the category toggles were
// inside the layer control, which is the map's legend and is hidden on the
// graph, so the timeline followed the graph's rule and never showed them. M65
// then made the categories narrow the resting picture on all three views, so a
// reader on the lanes or the graph was looking at a filtered picture with no
// way to see or change the filter.
//
// This is the half `node --test` can hold without a DOM: that the switches are
// built in **one** module and the legend keeps no second copy, that the two
// halves of a `?layers=` list are written by whoever owns each half and neither
// touches the other, and that the filter the three views read is the one the
// switches write. The pictures themselves are `tests/m68-browser.test.mjs`.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **Nothing here pins a count.** What is asserted is the shape of the answer —
// the same set, the same list, the same ownership — and never a number that the
// next import would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { layersFrom } from '../src/category-control.js';
import {
  categoriesChecked, categoriesOn, eventsOn, eventsTokens,
} from '../src/categories.js';
import { workingSet } from '../src/emphasis.js';
import { LAYERS, defaultState, parseState, formatState } from '../src/state.js';
import { buildAdjacency } from '../src/graph.js';
import { ROOT } from './helpers.mjs';

const read = (file) => readFile(path.join(ROOT, file), 'utf8');
const at = (patch) => ({ ...defaultState(), ...patch });
const sorted = (ids) => [...ids].sort();

// ─── a corpus with three categories and one event that has none ────────────
//
// The same shape `tests/m65.test.mjs` uses — a war with its two battles, so
// that the resting picture is the main events — with a category on each.
const event = (id, { category = null, parent = null, when = { start: 1500, end: 1500 } } = {}) => {
  const record = {
    id, title: id, status: 'active', when, place: null, region: 'europe', weight: 0, actors: [],
  };
  if (category) record.category = category;
  if (parent) record.parent = parent;
  return record;
};

function topology() {
  const events = [
    event('war', { category: 'war', when: { start: 1500, end: 1520 } }),
    event('battle-a', { category: 'war', parent: 'war', when: { start: 1505, end: 1505 } }),
    event('treaty', { category: 'treaty', when: { start: 1521, end: 1521 } }),
    event('quake', { category: 'disaster', when: { start: 1531, end: 1531 } }),
    event('plain', { when: { start: 1541, end: 1541 } }),
  ];
  return {
    activeEvents: events,
    events: new Map(events.map((e) => [e.id, e])),
    edges: new Map(),
    childrenOf: new Map([['war', ['battle-a']]]),
    adjacency: buildAdjacency(events, []),
    actors: new Map(),
    places: new Map(),
    sources: new Map(),
    narratives: new Map(),
    relations: new Map(),
    regions: [{ id: 'europe', label: 'Europe' }],
    eventsByActor: new Map(),
    extent: { min: 1500, max: 1541 },
    opens: null,
    resolve: () => null,
  };
}

const ALL = ['war', 'treaty', 'disaster'];

// ─── 1. one module owns the switches ───────────────────────────────────────
//
// The brief's second test, and it is structural for M64's reason: a legend
// that kept a second copy of the switches and happened to agree today would
// still be the fault. `data-category` is what makes an input a category
// switch — the map reads nothing by it, the state knows nothing of it — so the
// count of modules that write one is the count of owners.

test('the category switches are built in exactly one module, and the legend keeps no copy', async () => {
  const modules = ['src/layer-control.js', 'src/category-control.js', 'src/main.js', 'src/window-control.js'];
  const sources = new Map(await Promise.all(
    modules.map(async (file) => [file, await read(file)]),
  ));
  const builders = modules.filter((file) => sources.get(file).includes('data-category'));
  assert.deepEqual(builders, ['src/category-control.js'],
    `the switches are built in ${builders.length} module(s); they must be built in one`);

  const legend = sources.get('src/layer-control.js');
  assert.ok(!legend.includes('events-by-category'),
    'the legend no longer carries the group of category rows');
  assert.ok(!legend.includes('glyphId'),
    'nor a symbol beside a category, which is the row it no longer draws');
});

test('and the list a switch writes is assembled in that one module too', async () => {
  const legend = await read('src/layer-control.js');
  // The legend still writes `?layers=` — the territories and the base map are
  // its own — so the question is not whether it writes, but whether it decides
  // what the events half says. It asks.
  assert.match(legend, /from '\.\/category-control\.js'/,
    'the legend asks the module that owns the switches for the whole list');
  assert.ok(!legend.includes('eventsTokens'),
    'and does not assemble the events half itself');
});

test('the control is in the masthead, on every view, and its group is empty in the file', async () => {
  const html = await read('index.html');
  const group = html.match(/<div class="categories-control"[^>]*><\/div>/);
  assert.ok(group, 'index.html carries an empty group for the categories');
  // Inside `masthead-tools` and outside the layers group: the window, the
  // grouping and the count are the controls it stands with, and the legend is
  // the map's alone.
  const tools = html.slice(html.indexOf('id="masthead-tools"'), html.indexOf('class="masthead-links"'));
  assert.ok(tools.includes(group[0]), 'inside the masthead tools, beside the window');
  const layers = html.match(/<div class="layers"[^>]*><\/div>/);
  assert.ok(layers && html.indexOf(group[0]) < html.indexOf(layers[0]),
    'and before the layer switches, which swap with the graph filters and it does not');
  // Nothing in `main.js` hides it: unlike the legend and the graph filters, it
  // belongs to no one picture.
  const main = await read('src/main.js');
  assert.ok(!/categoriesGroup\.hidden|categories[A-Za-z]*\.hidden/.test(main),
    'and no view hides it');
});

// ─── 2. two halves, and neither writes the other ───────────────────────────

test('at rest the list is LAYERS itself, so the link stays empty', () => {
  const written = layersFrom({ on: new Set(LAYERS), categories: ALL, all: ALL });
  assert.deepEqual(written, [...LAYERS]);
  // Which is the whole point of writing it in LAYERS order: `formatState`
  // recognises the state at rest by comparing the two lists position by
  // position, and writes no `?layers=` at all.
  assert.equal(formatState(at({ layers: written })).includes('layers='), false);
});

test('a category switched off replaces the bare token and leaves every other layer where it is', () => {
  const on = new Set(LAYERS);
  const written = layersFrom({ on, categories: ['treaty', 'disaster'], all: ALL });
  assert.ok(!written.includes('events'), 'the bare token is gone');
  assert.deepEqual(written.filter((l) => l.startsWith('events:')), ['events:treaty', 'events:disaster']);
  // The map's own layers are untouched, and in the order they were in.
  const others = written.filter((l) => !l.startsWith('events'));
  assert.deepEqual(others, LAYERS.filter((l) => l !== 'events'));
});

test('a layer switched off leaves the categories exactly as they were', () => {
  const on = new Set(LAYERS.filter((l) => l !== 'territories'));
  const kept = ['treaty'];
  const written = layersFrom({ on, categories: kept, all: ALL });
  assert.ok(!written.includes('territories'), 'the territories are off');
  assert.deepEqual(written.filter((l) => l.startsWith('events:')), ['events:treaty'],
    'and the one category the reader had left on is still the one that is on');
  // The reverse, from the other control: switching a category writes the
  // territories back out exactly as they stood.
  const back = layersFrom({ on, categories: ['treaty', 'war'], all: ALL });
  assert.ok(!back.includes('territories'));
});

test('`land` always goes, because it has no switch and a missing name is a name switched off', () => {
  const written = layersFrom({ on: new Set(['events']), categories: ALL, all: ALL });
  assert.deepEqual(written, ['land', 'events']);
});

test('a corpus with no categories at all writes the bare token and nothing else', () => {
  const written = layersFrom({ on: new Set(LAYERS), categories: [], all: [] });
  assert.deepEqual(written, [...LAYERS]);
});

test('the events layer off writes no token, and the last category off is the same state', () => {
  const on = new Set(LAYERS.filter((l) => l !== 'events'));
  assert.deepEqual(layersFrom({ on, categories: ALL, all: ALL }), LAYERS.filter((l) => l !== 'events'));
  // And from the other side: every category off is "nothing of the events
  // layer", which is the state `?layers=` says by saying no name (deviation
  // 586). The two controls therefore cannot disagree about it.
  const none = layersFrom({ on: new Set(LAYERS), categories: [], all: ALL });
  assert.equal(eventsOn(none), false);
});

// ─── 3. what a switch shows is what the list says ──────────────────────────

test('categoriesChecked is the boxes the list ticks: all, some, or none', () => {
  assert.deepEqual(categoriesChecked(['land', 'events'], ALL), ALL, 'the bare token is every category');
  assert.deepEqual(categoriesChecked(['land', 'events:treaty'], ALL), ['treaty']);
  assert.deepEqual(categoriesChecked(['land'], ALL), [], 'the events layer off is no box ticked');
  // A name no category has is dropped by whoever reads it, as a lane id that
  // no longer exists is (categories.js).
  assert.deepEqual(categoriesChecked(['land', 'events:nonesuch'], ALL), []);
});

test('what the switches write and what they show are the same answer, round and round', () => {
  for (const kept of [ALL, ['war'], ['treaty', 'disaster'], []]) {
    const written = layersFrom({ on: new Set(LAYERS), categories: kept, all: ALL });
    assert.deepEqual(categoriesChecked(written, ALL), kept,
      `${kept.join(',') || 'nothing'} written and read back`);
  }
});

// ─── 4. the state is in the URL as it is today, and a link carries it ──────

test('a link carries the categories through the URL and back unchanged', () => {
  const written = layersFrom({ on: new Set(LAYERS), categories: ['war'], all: ALL });
  const url = formatState(at({ layers: written }));
  assert.match(url, /layers=/);
  const back = parseState(url).layers;
  assert.deepEqual(back, written, 'the link is the state and the state is the link');
  assert.deepEqual(categoriesChecked(back, ALL), ['war']);
  // And the filter reads the same list the switches wrote.
  assert.deepEqual(sorted(categoriesOn(back)), ['war']);
});

test('the tokens a switch writes are still `categories.js`’s, so nothing was forked to move the control', () => {
  const kept = ['treaty', 'disaster'];
  const written = layersFrom({ on: new Set(LAYERS), categories: kept, all: ALL });
  assert.deepEqual(
    written.filter((l) => l.startsWith('events')),
    eventsTokens({ on: kept, all: ALL }),
  );
});

// ─── 5. one source: the switch narrows what all three views draw ───────────
//
// The brief's first test, in the half that needs no browser: the lanes, the
// graph and the map all draw `workingSet(...).shown`, so a category switched
// off — wherever it was switched off from — is one removal and not three.

test('a category switched off is gone from the one set the three views draw', () => {
  const t = topology();
  const whole = workingSet(t, at({})).shown;
  // At rest that is the main events: the battle is inside the war.
  assert.deepEqual(sorted(whole), ['plain', 'quake', 'treaty', 'war']);

  const layers = layersFrom({ on: new Set(LAYERS), categories: ['treaty', 'disaster'], all: ALL });
  const narrowed = workingSet(t, at({ layers })).shown;
  assert.ok(!narrowed.has('war'), 'the war is gone');
  assert.ok(narrowed.has('treaty') && narrowed.has('quake'), 'the other categories stay');
  assert.ok(narrowed.has('plain'), 'and so do the events that carry no category at all');
});

test('the same switch written from any control is the same set, because it is the same list', () => {
  const t = topology();
  // What the masthead writes when the reader unticks the war.
  const fromMasthead = layersFrom({ on: new Set(LAYERS), categories: ['treaty', 'disaster'], all: ALL });
  // What the legend writes when it carries that state over untouched while the
  // reader switches the territories off.
  const fromLegend = layersFrom({
    on: new Set(LAYERS.filter((l) => l !== 'territories')),
    categories: categoriesChecked(fromMasthead, ALL),
    all: ALL,
  });
  assert.deepEqual(
    sorted(workingSet(t, at({ layers: fromMasthead })).shown),
    sorted(workingSet(t, at({ layers: fromLegend })).shown),
    'switching a layer never changes which events are drawn',
  );
});

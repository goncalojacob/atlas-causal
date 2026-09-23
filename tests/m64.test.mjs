// M64: the dates are chosen on the map, not typed.
//
// The owner, 18 September, after using what M60 built: *"There should be a
// toggle on the map so I can choose the dates instead of a selector."*
//
// This is the half of it `node --test` can hold without a browser: that there
// is **one** band and not two, that the band and the lanes and the masthead's
// count read **one** source for where the events are, and that the window is
// URL state.
//
// Two things M64 asserted are gone, because M75 removed what they were about:
// the toggle was a preference remembered in `panes.js`, and a first visit had
// the band closed. The owner, 21 September — *"The dates two-handled band
// should not be hidden"* — so there is no control to remember and no first
// visit without it. `tests/m75.test.mjs` asserts the absence, and the pictures
// that were `tests/m64-browser.test.mjs` are `tests/m75-browser.test.mjs`.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **Nothing here pins a count of events.** What is asserted is the shape of the
// answer — the same set, the same clamp, the same columns — and never a number
// that the next import would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  HANDLE_WIDTH, bandEvents, bandProfile, windowOf,
} from '../src/window-band.js';
import { STRIP } from '../src/map-band.js';
import { workingSet } from '../src/emphasis.js';
import { densityPath } from '../src/density.js';
import { barBox } from '../src/lanes.js';
import { createTimelineScale } from '../src/timeline-scale.js';
import { resolveWindow, centuryCounts, WHEEL_FACTOR, zoomWindow } from '../src/util/window.js';
import { defaultState, parseState, formatState } from '../src/state.js';
import { buildAdjacency } from '../src/graph.js';
import { atlasOf, ROOT } from './helpers.mjs';

const read = (file) => readFile(path.join(ROOT, file), 'utf8');
const dataDir = path.join(ROOT, 'data');
const at = (patch) => ({ ...defaultState(), ...patch });
const sorted = (ids) => [...ids].sort();

// ─── a corpus with a hierarchy and an edge in it ───────────────────────────
//
// The same shape `tests/m65.test.mjs` uses, because this suite's question is
// what the band draws while M65's filter is narrowing the picture.
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

// ─── 1. one band, not two ──────────────────────────────────────────────────
//
// The brief's sharpest instruction: "Do not write a second one — two bands that
// can disagree about the same window is a worse fault than the one being
// fixed." So the assertion is structural and not behavioural, because a second
// band that happened to agree today would still be the fault.

test('the band is built in exactly one module, and both drawings import it', async () => {
  const modules = ['src/timeline.js', 'src/map-band.js', 'src/window-band.js', 'src/window-control.js'];
  const sources = new Map(await Promise.all(
    modules.map(async (file) => [file, await read(file)]),
  ));
  // `aria-valuetext` is what makes an element the window's own slider: every
  // band element in the atlas carries one, and nothing else does.
  const builders = modules.filter((file) => sources.get(file).includes('aria-valuetext'));
  assert.deepEqual(builders, ['src/window-band.js'],
    `the band is built in ${builders.length} module(s); it must be built in one`);

  for (const file of ['src/timeline.js', 'src/map-band.js']) {
    assert.match(sources.get(file), /from '\.\/window-band\.js'/,
      `${file} draws its band from the shared module`);
    assert.ok(!sources.get(file).includes('window-handle'),
      `${file} does not build a handle of its own`);
  }
});

test('the gestures are shared too, and a wheel answers at one rate everywhere', async () => {
  for (const file of ['src/timeline.js', 'src/map-band.js']) {
    const source = await read(file);
    assert.match(source, /bindWindowGestures/, `${file} asks for the shared gestures`);
  }
  // And the module they share answers all of them.
  const shared = await read('src/window-band.js');
  for (const gesture of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'dblclick']) {
    assert.match(shared, new RegExp(`addEventListener\\('${gesture}'`), `the band answers ${gesture}`);
  }

  // **The rate a wheel answers at is held by one export and not by the absence
  // of a string** (M85, B14). This asked that `timeline.js` and `map-band.js`
  // contained no `addEventListener('wheel'` — brittle (a comment about the
  // wheel failed it), and blind to the copy that mattered: `graph-view.js` has
  // a wheel of its own with the same factor written out again, and nothing
  // scanned it. `WHEEL_FACTOR` is now the one number, in `util/window.js`
  // beside the band's own `zoomWindow`, and every picture that answers a wheel
  // imports it.
  for (const file of ['src/map/map.js', 'src/graph-view/graph-view.js']) {
    assert.match(await read(file), /WHEEL_FACTOR/,
      `${file} answers the wheel at the band's own rate`);
  }
  assert.equal(typeof WHEEL_FACTOR, 'number');
  const narrower = zoomWindow({ from: 1900, to: 2000 }, 1950, -100);
  assert.ok(narrower.to - narrower.from < 100, 'and the band itself zooms by it');
});

// ─── 2. one source for where the events are ────────────────────────────────

test('the band draws over what the atlas is showing, which is M65’s own set', () => {
  const t = topology();
  const state = at({});
  const shown = workingSet(t, state).shown;
  assert.deepEqual(sorted(bandEvents(t, state).map((e) => e.id)), sorted(shown));
  // At rest that is the main events and not the corpus: the two battles are
  // inside the war and the band says so.
  assert.deepEqual(sorted(bandEvents(t, state).map((e) => e.id)), ['elsewhere', 'treaty', 'war']);
});

test('a selection narrows the band’s events exactly as it narrows the views', () => {
  const t = topology();
  const chosen = at({ selected: 'war' });
  const shown = workingSet(t, chosen).shown;
  assert.deepEqual(sorted(bandEvents(t, chosen).map((e) => e.id)), sorted(shown));
  // The war, its two parts, and the treaty one hop from a part — and not
  // `elsewhere`, which is what "the band shows the window over whatever the
  // atlas is currently showing" means.
  assert.ok(!bandEvents(t, chosen).some((e) => e.id === 'elsewhere'),
    'an unrelated event is gone from the band as it is gone from the map');
  assert.ok(bandEvents(t, chosen).some((e) => e.id === 'battle-a'),
    'and a part of the chosen event is there');
});

// M64's rule, said the way M76 left it: the lanes and the masthead's count
// still ask `bandEvents` — what the views draw — and the map's band asks
// `profileEvents`, which is `bandEvents` narrowed to the selection's own half
// in the very same module. One answer about what a band is a band over, and it
// is still `window-band.js`'s; what M76 added is a second question asked of it
// (the owner, 21 September: *"should show only those events"*).
test('the lanes, the masthead’s count and the band all ask the one module', async () => {
  for (const file of ['src/timeline.js', 'src/window-control.js']) {
    assert.match(await read(file), /bandEvents\(/, `${file} asks bandEvents`);
  }
  const band = await read('src/map-band.js');
  assert.match(band, /profileEvents\(/, 'the map’s band asks for the selection’s own events');
  assert.match(band, /from '\.\/window-band\.js'/, 'and asks the same module for them');
  assert.match(await read('src/window-band.js'), /export function profileEvents/,
    'which is where the one answer lives');
});

test('over the repository’s own corpus the band is the shown set, whatever the state', async () => {
  const atlas = await atlasOf(dataDir);
  for (const state of [at({}), at({ from: 1500, to: 1600 }), at({ selected: [...atlas.events.keys()][0] })]) {
    const shown = workingSet(atlas, state).shown;
    const events = bandEvents(atlas, state);
    assert.equal(events.length, [...shown].filter((id) => atlas.events.get(id)?.status === 'active').length);
    for (const record of events) assert.ok(shown.has(record.id), `${record.id} is drawn and is not shown`);
  }
});

// ─── 3. where the events are is density.js's answer and no second one ──────

test('the band’s profile is density.js’s columns over the bars’ own x', () => {
  const t = topology();
  const scale = createTimelineScale({
    domain: [1499, 1601], range: [HANDLE_WIDTH, 400 - HANDLE_WIDTH],
    counts: centuryCounts(t.activeEvents), extent: t.extent,
  });
  const events = bandEvents(t, at({}));
  const xs = events.map((e) => barBox(e, scale, { openEnd: 1601 }).x);
  assert.equal(
    bandProfile(events, scale, { floor: STRIP.height, openEnd: 1601 }),
    densityPath(xs, { floor: STRIP.height }),
    'the profile is the strip’s own function, at the strip’s own scale',
  );
  // Nothing to draw is the empty string, so a caller leaves the path out
  // altogether rather than appending an empty one.
  assert.equal(bandProfile([], scale, { floor: STRIP.height, openEnd: 1601 }), '');
});

test('the band and the lanes resolve one window from one state', async () => {
  const atlas = await atlasOf(dataDir);
  for (const state of [at({}), at({ from: 1500, to: null }), at({ from: null, to: 1700 })]) {
    const resolved = resolveWindow(state, atlas.extent, atlas.opens);
    assert.deepEqual(resolveWindow(state, atlas.extent, atlas.opens), resolved,
      'resolveWindow is the one answer both drawings ask for');
    assert.ok(resolved.from <= resolved.to, 'and its ends are never crossed');
  }
});

// ─── 4. typing and dragging write the same two fields ──────────────────────

test('a window a drag asks for is clamped to the data and never crossed', () => {
  const extent = { min: 1415, max: 2025 };
  assert.deepEqual(windowOf(1500, 1600, extent), { from: 1500, to: 1600 });
  assert.deepEqual(windowOf(1600, 1500, extent), { from: 1500, to: 1600 }, 'the ends are put the right way round');
  assert.deepEqual(windowOf(-4000, 9000, extent), { from: 1415, to: 2025 }, 'and never leave the scale');
  assert.deepEqual(windowOf(1500.4, 1600.6, extent), { from: 1500, to: 1601 }, 'whole years');
  assert.equal(windowOf(1500, 1600, null), null, 'an atlas with no extent has no window');
});

// The other half of this pair — that typing a year and dragging to it mean the
// same window, through the same `windowOf` — went with the two number fields
// (M76; the owner, 21 September: *"Picking up the dates exactly is
// unnecessary"*). There is one way to set the window on the map now, so there
// is nothing left for it to agree with.

// ─── 5. the window is state and nothing else is ────────────────────────────

test('a link carries the window and never anything about a control', () => {
  assert.ok(!('band' in defaultState()), 'the state has no field for it');
  // A link that names it is a link that names nothing: the parameter is not
  // read, and formatting the state back does not invent one.
  const opened = parseState('?band=open&from=1500&to=1600');
  assert.ok(!('band' in opened));
  assert.equal(opened.from, 1500);
  const url = formatState(opened);
  assert.ok(!url.includes('band'), `the URL says nothing about the control: ${url}`);
  assert.equal(formatState(defaultState()), '', 'and the default still writes nothing at all');
});

// ─── 6. the strip is a strip ───────────────────────────────────────────────

test('the strip is drawn as an overlay, so the map pane is the layout either way', async () => {
  const css = await read('src/style.css');
  const block = css.slice(css.indexOf('.map-band {'), css.indexOf('.map-band > *'));
  assert.match(block, /position:\s*absolute/,
    'the band is over the map and not a row of the grid: that is what stops it becoming the strip again');
  // And the layout itself still has the one row M60 left it.
  const layout = css.slice(css.indexOf('.layout {'), css.indexOf('.map-area'));
  assert.match(layout, /grid-template-rows:\s*minmax\(0,\s*1fr\);/);
  assert.ok(!/"timeline/.test(layout), 'and no row for a strip');
});

test('its geometry leaves room for the two years above the band it labels', () => {
  assert.ok(STRIP.marker > 0 && STRIP.marker < STRIP.height,
    'the years are written on their own row above the band');
  assert.ok(STRIP.inset >= HANDLE_WIDTH / 2,
    'a handle at either end of the data is drawn whole and not half off the edge');
});

// M76: the band follows the selection, the fields go, the graph shows every date.
//
// Three instructions from the owner on 21 September, after seeing M75
// published. This is the half `node --test` can hold without a browser: what
// the band's profile is drawn *over* and at what scale, that nothing in the
// masthead types a year any more, and that the graph's arrangement has stopped
// asking what the window is. The pictures are `tests/m76-browser.test.mjs`.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **Nothing here pins a count or a pixel.** What is asserted is the property —
// the profile over the selection's own events, the tallest column reaching the
// band's own floor, no field anywhere, no window in the arrangement's key — and
// never a number that the next import or the next stylesheet would make false.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { bandEvents, bandProfile, profileEvents } from '../src/window-band.js';
import { STRIP } from '../src/map-band.js';
import { busiestColumn, densityPath, columnHeight } from '../src/density.js';
import { workingSet } from '../src/emphasis.js';
import { lensView } from '../src/lens.js';
import { arrangementOf } from '../src/graph-view/arrangement.js';
import { createTimelineScale } from '../src/timeline-scale.js';
import { centuryCounts } from '../src/util/window.js';
import { defaultState, parseState, formatState } from '../src/state.js';
import { buildAdjacency } from '../src/graph.js';
import { atlasOf, ROOT } from './helpers.mjs';

const read = (file) => readFile(path.join(ROOT, file), 'utf8');
const dataDir = path.join(ROOT, 'data');
const at = (patch) => ({ ...defaultState(), ...patch });
const sorted = (ids) => [...ids].sort();

// The same corpus M64, M65 and M75 are held to: a war with two parts inside
// it, a treaty one hop from a part, and something unrelated a century later.
// `elsewhere` is the one that matters here — it is what the ring around a
// selection does *not* reach, so a band that still draws it is a band over
// something other than what was chosen.
const event = (id, { parent = null, when = { start: 1500, end: 1500 }, actors = [] } = {}) => {
  const record = {
    id, title: id, status: 'active', when, place: null, region: 'europe', weight: 0, actors,
  };
  if (parent) record.parent = parent;
  return record;
};
const edge = (from, to) => [`${from}--${to}--caused`, {
  id: `${from}--${to}--caused`, from, to, type: 'caused', confidence: 'consensus', status: 'active',
}];

// `alfa` stands on two battles in the same year, so its own column holds more
// than one event: a profile whose busiest column holds exactly one has no
// density to draw and is the row of ticks it has always been, which is
// asserted below as the other half of the same rule.
function topology() {
  const belligerent = [{ actor: 'alfa', role: 'belligerent' }];
  const events = [
    event('war', { when: { start: 1500, end: 1520 } }),
    event('edict', { when: { start: 1500, end: 1500 } }),
    event('decree', { when: { start: 1500, end: 1500 } }),
    event('battle-a', { parent: 'war', when: { start: 1505, end: 1505 }, actors: belligerent }),
    event('battle-c', { parent: 'war', when: { start: 1505, end: 1505 }, actors: belligerent }),
    event('battle-b', { parent: 'war', when: { start: 1510, end: 1510 } }),
    event('treaty', { when: { start: 1521, end: 1521 } }),
    event('elsewhere', { when: { start: 1600, end: 1600 } }),
  ];
  const edges = new Map([edge('battle-a', 'treaty')]);
  const actors = new Map([['alfa', { id: 'alfa', name: 'Alfa', status: 'active', type: 'polity' }]]);
  const byId = new Map(events.map((e) => [e.id, e]));
  return {
    activeEvents: events,
    events: byId,
    edges,
    childrenOf: new Map([['war', ['battle-a', 'battle-c', 'battle-b']]]),
    adjacency: buildAdjacency(events, [...edges.values()]),
    actors,
    places: new Map(),
    sources: new Map(),
    narratives: new Map(),
    relations: new Map(),
    regions: [{ id: 'europe', label: 'Europe' }],
    eventsByActor: new Map([['alfa', [
      { event: byId.get('battle-a'), role: 'belligerent' },
      { event: byId.get('battle-c'), role: 'belligerent' },
    ]]]),
    extent: { min: 1500, max: 1600 },
    opens: null,
    resolve: (id) => (actors.has(id) ? { kind: 'actor', id } : null),
  };
}

// ─── 1. the profile is over the selection's own events ─────────────────────
//
// The owner: *"If for example I select portugal, the map timeline I use to
// pick the dates should show only those events."* The band was drawn over
// `shown`, which is the lens **and its one-hop ring** — on the repository's
// own corpus, 33 events for an actor that names 9. What the sentence asks for
// is the lens's own half, and that is what `profileEvents` answers.

test('with a lens on, the profile is over the lens’s own events and not its ring', () => {
  const t = topology();
  const state = at({ actor: 'alfa' });
  const view = lensView(t, state);
  assert.ok(view, 'an actor with events is a lens');
  assert.ok(view.near.size > 0, 'and it has a ring, which is what the band must not draw');

  assert.deepEqual(
    sorted(profileEvents(t, state).map((e) => e.id)),
    sorted(view.kept),
    'every column of the band is the selection’s own events and nothing else',
  );
  assert.ok(
    bandEvents(t, state).length > profileEvents(t, state).length,
    'the picture is wider than the profile, because the picture keeps the ring',
  );
});

test('choosing an event narrows the profile to that event and its parts (M65)', () => {
  const t = topology();
  const chosen = profileEvents(t, at({ selected: 'war' })).map((e) => e.id);
  assert.deepEqual(sorted(chosen), ['battle-a', 'battle-b', 'battle-c', 'war'],
    'the war and the battles inside it, and not the treaty one hop away');
});

test('with nothing chosen the profile is the resting picture, exactly as it was', () => {
  const t = topology();
  const rest = at({});
  assert.deepEqual(
    sorted(profileEvents(t, rest).map((e) => e.id)),
    sorted(bandEvents(t, rest).map((e) => e.id)),
    'no lens, no narrowing: M75’s own answer',
  );
  assert.deepEqual(sorted(bandEvents(t, rest).map((e) => e.id)), sorted(workingSet(t, rest).shown),
    'and `bandEvents` itself is untouched, so the masthead’s count still counts what is drawn');
});

test('a century the selection has no event in draws no column', () => {
  const t = topology();
  const counts = centuryCounts(t.activeEvents);
  const scale = createTimelineScale({
    domain: [1499, 1601], range: [STRIP.inset, 400 - STRIP.inset], counts, extent: t.extent,
  });
  const profileAt = (state) => bandProfile(profileEvents(t, state), scale, {
    floor: STRIP.height, openEnd: 1601, own: true, min: 3, max: STRIP.height - STRIP.marker,
  });
  // `elsewhere` is the atlas's only seventeenth-century event and no lens here
  // reaches it, so the far end of the scale must carry no ink at all.
  const far = scale.x(1600);
  const columns = (d) => [...d.matchAll(/M([-\d.]+) /g)].map((m) => Number(m[1]));
  assert.ok(columns(profileAt(at({}))).some((x) => x >= far - 4),
    'at rest the century `elsewhere` falls in has a column');
  assert.ok(!columns(profileAt(at({ actor: 'alfa' }))).some((x) => x >= far - 4),
    'and with the lens on it has none');
});

// ─── 2. and it is drawn at its own set's scale ─────────────────────────────
//
// The diagnosis, measured on the real page and written up in `STATUS.md`: the
// profile was drawn at `density.js`'s absolute scale, whose whole range is 3
// to 9 px inside a 44-unit strip, so the world's tallest column was 6 px and
// Portugal's was 5. One pixel between the atlas and one country.

test('the tallest column of a profile reaches the band’s own floor', () => {
  const t = topology();
  const counts = centuryCounts(t.activeEvents);
  const scale = createTimelineScale({
    domain: [1499, 1601], range: [STRIP.inset, 400 - STRIP.inset], counts, extent: t.extent,
  });
  const body = STRIP.height - STRIP.marker;
  const heights = (d) => [...d.matchAll(/M[-\d.]+ [-\d.]+h[-\d.]+v([\d.]+)/g)].map((m) => Number(m[1]));
  const tallestOf = (state) => Math.max(...heights(bandProfile(profileEvents(t, state), scale, {
    floor: STRIP.height, openEnd: 1601, own: true, min: 3, max: body,
  })));
  for (const state of [at({}), at({ selected: 'war' }), at({ actor: 'alfa' })]) {
    const tall = tallestOf(state);
    assert.equal(tall, body, 'the busiest column fills the band’s body, whatever set it is over');
    assert.ok(tall <= STRIP.height - STRIP.marker,
      'and never reaches the row the two years are written on');
  }
  // The other half of the same rule: a set whose busiest column holds one
  // event has no density to draw, and drawing it at full height would be the
  // band claiming a heap where there is a single record. It stays the tick it
  // has always been.
  assert.equal(tallestOf(at({ selected: 'treaty' })), 3,
    'one event on its own is still one tick and not a column to the ceiling');
});

test('its own scale is one option and not a second drawing', () => {
  // `saturatesAt` is what makes it the set's own scale, and the absolute scale
  // is simply the default: the timeline's per-lane stubs are rows compared
  // with each other and keep it.
  const xs = [0, 0, 0, 0, 10, 20];
  assert.equal(busiestColumn(xs, { unit: 2 }), 4, 'the busiest column is counted on the same grid it is drawn on');
  const own = densityPath(xs, { floor: 20, min: 3, max: 12, saturatesAt: 4 });
  const absolute = densityPath(xs, { floor: 20, min: 3, max: 12 });
  assert.notEqual(own, absolute, 'the two scales are two drawings of the same counts');
  assert.equal(columnHeight(4, { min: 3, max: 12, saturatesAt: 4 }), 12, 'the busiest reaches the cap');
  assert.equal(columnHeight(1, { min: 3, max: 12, saturatesAt: 4 }), 3, 'and one event is still the tick it was');
  // A set whose busiest column holds one event has no scale to be relative to;
  // the floor is the honest answer and not a division by zero.
  assert.ok(Number.isFinite(columnHeight(1, { min: 3, max: 12, saturatesAt: 1 })));
  assert.ok(Number.isFinite(columnHeight(1, { min: 3, max: 12, saturatesAt: 0 })));
});

test('over the repository’s own corpus the lens is narrower than the picture', async () => {
  const atlas = await atlasOf(dataDir);
  const state = at({ actor: 'portugal' });
  const view = lensView(atlas, state);
  assert.ok(view, 'Portugal is a lens');
  const profile = profileEvents(atlas, state);
  const band = bandEvents(atlas, state);
  assert.ok(profile.length > 0, 'and it has events of its own');
  assert.ok(band.length > profile.length,
    'the ring is in the picture and out of the profile, which is the whole of the fourth candidate');
  for (const e of profile) assert.ok(view.kept.has(e.id), `${e.id} is one of the selection’s own`);
});

// ─── 3. nothing in the masthead types a year ───────────────────────────────
//
// The owner: *"Picking up the dates exactly is unnecessary"* — *"This can be
// removed."* The band's double-click-to-decade and its arrow keys are how a
// precise year is still reached, and they are `window-band.js`'s, untouched.

test('the masthead has no field and no second profile left in it', async () => {
  const source = await read('src/window-control.js');
  assert.ok(!/data-window=/.test(source), 'no field to type a year into');
  assert.ok(!/<input/.test(source), 'and no input of any kind');
  assert.ok(!/window-density/.test(source), 'and no density hint beside the band’s own profile');
  // What the brief says to keep.
  assert.match(source, /window-count/, 'the count in view stays');
  assert.match(source, /class="pin"/, 'the pin that gives the world back stays');
  assert.match(source, /window-standing/, 'and the standing line stays');
});

test('the stylesheet has no rule for a field that no longer exists', async () => {
  const css = await read('src/style.css');
  for (const gone of ['.window-end', '.window-density', '.density-column']) {
    assert.ok(!css.includes(gone), `${gone} is styling nothing`);
  }
});

test('the URL is unchanged: a link still opens on its window', () => {
  const opened = parseState('?from=1900&to=1999');
  assert.equal(opened.from, 1900);
  assert.equal(opened.to, 1999);
  assert.match(formatState(opened), /from=1900/);
  assert.match(formatState(opened), /to=1999/);
  assert.equal(formatState(defaultState()), '', 'and the default still writes nothing at all');
});

test('the band keeps every gesture it had, because window-band.js is untouched', async () => {
  const source = await read('src/window-band.js');
  for (const gesture of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'dblclick']) {
    assert.match(source, new RegExp(`addEventListener\\('${gesture}'`),
      `${gesture} is still how the window is moved`);
  }
});

// ─── 4. the graph ignores the window ───────────────────────────────────────
//
// The owner: *"I think the graph can always show all dates, then one can zoom
// in and out and pan to look at different times."* The window is still state —
// the map and the timeline read it — and the graph stops asking.

test('the arrangement is every event of `shown`, whatever the window says', () => {
  const t = topology();
  const whole = arrangementOf(t, at({}));
  const narrow = arrangementOf(t, at({ from: 1500, to: 1510 }));
  assert.deepEqual(
    sorted(narrow.events.map((e) => e.id)),
    sorted(whole.events.map((e) => e.id)),
    'a band of ten years lays out what a band of a century does',
  );
  assert.equal(narrow.key, whole.key, 'and moving the band no longer moves a node');
});

test('the graph’s own source has no window band and no fade left in it', async () => {
  const source = await read('src/graph-view/graph-view.js');
  assert.ok(!/class: 'window-band'/.test(source), 'no shaded band across the picture');
  assert.ok(!/outside the window/.test(source), 'and no mark titled as outside one');
  assert.ok(!/fitToWindow/.test(source), 'and the camera at rest is not the window’s');
  const arrangement = await read('src/graph-view/arrangement.js');
  assert.ok(!/withMargin/.test(arrangement), 'the arrangement has stopped taking a margin round the band');
});

test('the window is still state, and the two views that read it still do', async () => {
  assert.equal(parseState('?from=1900&to=1999').from, 1900, 'the state carries it');
  for (const file of ['src/map-band.js', 'src/timeline.js']) {
    assert.match(await read(file), /resolveWindow/, `${file} still draws the window`);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseState, formatState, defaultState, createState } from '../src/state.js';
import { resolveWindow, overlaps, windowAt, decadeOf } from '../src/util/window.js';

test('parse and format round trip', () => {
  const state = {
    from: 1200,
    to: 1250,
    view: 'graph',
    selected: 'fixture-event-t',
    place: 'fixture-place-one',
    actor: 'fixture-actor-one',
    chain: ['fixture-event-a--fixture-event-b--caused', 'fixture-event-b--fixture-event-d--enabled'],
    layers: ['events'],
  };
  const search = formatState(state);
  assert.equal(search, '?from=1200&to=1250&view=graph&selected=fixture-event-t&place=fixture-place-one&actor=fixture-actor-one&chain=fixture-event-a--fixture-event-b--caused,fixture-event-b--fixture-event-d--enabled&layers=events');
  assert.deepEqual(parseState(search), state);
});

// The view is state, not a preference: the picture travels in the link.
test('the view travels in the URL, and only when it is not the map', () => {
  assert.equal(formatState({ ...defaultState(), view: 'map' }), '');
  assert.equal(formatState({ ...defaultState(), view: 'graph' }), '?view=graph');
  assert.equal(parseState('?view=graph').view, 'graph');
  assert.equal(parseState('?view=map').view, 'map');
  assert.equal(parseState('?view=hologram').view, 'map', 'an unknown view falls back to the map');
});

test('defaults produce an empty query and BCE years survive', () => {
  assert.equal(formatState(defaultState()), '');
  assert.equal(parseState('?to=-44').to, -44);
  assert.equal(formatState({ ...defaultState(), from: -44 }), '?from=-44');
  // Either end may stand alone: the other is the data's own bound.
  assert.deepEqual(parseState('?from=1960'), { ...defaultState(), from: 1960 });
  assert.deepEqual(parseState('?to=1975'), { ...defaultState(), to: 1975 });
});

test('a legacy ?year= is the far end, and an explicit ?to= beats it', () => {
  assert.deepEqual(parseState('?year=1975'), { ...defaultState(), from: null, to: 1975 });
  assert.equal(formatState(parseState('?year=1975')), '?to=1975');
  assert.equal(parseState('?year=1975&to=1980').to, 1980);
  assert.equal(parseState('?year=1975&from=1960').from, 1960);
});

test('a window written backwards is read as the span between its ends', () => {
  assert.deepEqual(parseState('?from=1975&to=1960'), { ...defaultState(), from: 1960, to: 1975 });
});

test('garbage falls back field by field; a bad chain step cuts the chain there', () => {
  const s = parseState('?to=soon&selected=<script>&chain=fixture-event-a--fixture-event-b--caused,nope,fixture-event-b--fixture-event-d--enabled&layers=events,lasers');
  assert.equal(s.to, null);
  assert.equal(s.selected, null);
  assert.equal(parseState('?actor=<script>').actor, null);
  assert.equal(parseState('?actor=fixture-actor-one').actor, 'fixture-actor-one');
  assert.equal(parseState('?place=../secret').place, null);
  assert.equal(parseState('?place=lisbon').place, 'lisbon');
  assert.deepEqual(s.chain, ['fixture-event-a--fixture-event-b--caused']);
  assert.deepEqual(s.layers, ['events']);
  assert.equal(parseState('?to=0').to, null);
  assert.equal(parseState('?from=0&to=1975').from, null);
});

test('fixtures=1 passes through a state write', () => {
  const out = formatState({ ...defaultState(), to: 1300 }, '?fixtures=1&to=9');
  assert.equal(out, '?fixtures=1&to=1300');
});

test('the store merges patches and notifies', () => {
  const store = createState({ to: 1200 });
  const seen = [];
  const off = store.subscribe((s) => seen.push(s.to));
  store.set({ to: 1210 });
  store.set({ selected: 'fixture-event-a' });
  off();
  store.set({ to: 1220 });
  assert.deepEqual(seen, [1210, 1210]);
  assert.deepEqual(store.get(), { from: null, to: 1220, view: 'map', selected: 'fixture-event-a', place: null, actor: null, chain: [], layers: ['land', 'territories', 'events'] });
});

// --- the window itself ----------------------------------------------------

const EXTENT = { min: 1910, max: 2011 };

test('a null bound is the data\'s own, and the ends never cross', () => {
  assert.deepEqual(resolveWindow(defaultState(), EXTENT), { from: 1910, to: 2011 });
  assert.deepEqual(resolveWindow({ from: 1960, to: null }, EXTENT), { from: 1960, to: 2011 });
  assert.deepEqual(resolveWindow({ from: null, to: 1975 }, EXTENT), { from: 1910, to: 1975 });
  assert.deepEqual(resolveWindow({ from: 1975, to: 1960 }, EXTENT), { from: 1960, to: 1975 });
  assert.equal(resolveWindow(defaultState(), null), null);
  // BCE: historians' -44 is astronomical -43.
  assert.deepEqual(resolveWindow({ from: -44, to: -1 }, EXTENT), { from: -43, to: 0 });
});

test('an interval is in the window when it overlaps it at all', () => {
  const window = { from: 1960, to: 1975 };
  assert.equal(overlaps({ start: 1961, end: 1961 }, window), true);
  assert.equal(overlaps({ start: 1959, end: 1959 }, window), false, 'over before it opened');
  assert.equal(overlaps({ start: 1976, end: 1976 }, window), false, 'not begun by the far end');
  assert.equal(overlaps({ start: 1930, end: 1965 }, window), true, 'begun before, still running');
  assert.equal(overlaps({ start: 1930, end: null }, window), true, 'ongoing is always still running');
  assert.equal(overlaps({ start: 1975, end: 1980 }, window), true, 'starts on the far end');
  assert.equal(overlaps({ start: 1955, end: 1960 }, window), true, 'ends on the near end');
  // The lenient bound at each end, as the arrow of time uses.
  assert.equal(overlaps({ start: { min: 1955, max: 1980 }, end: { min: 1955, max: 1980 } }, window), true);
  assert.equal(overlaps({ start: 1000, end: 1000 }, null), true, 'no window, everything');
});

test('"map at Y" takes the near end with it only when it was later', () => {
  assert.deepEqual(windowAt({ from: 1900, to: 2011 }, 1950), { from: 1900, to: 1950 });
  assert.deepEqual(windowAt({ from: 1960, to: 2011 }, 1950), { from: 1950, to: 1950 });
  assert.deepEqual(windowAt({ from: null, to: 2011 }, 1950), { from: null, to: 1950 });
});

test('a decade is the ten years around a year, floored', () => {
  assert.deepEqual(decadeOf(1975), { from: 1970, to: 1979 });
  assert.deepEqual(decadeOf(1970), { from: 1970, to: 1979 });
  assert.deepEqual(decadeOf(-5), { from: -10, to: -1 });
});

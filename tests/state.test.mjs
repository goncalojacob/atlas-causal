import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseState, formatState, defaultState, createState } from '../src/state.js';
import { resolveWindow, overlaps, windowAt, decadeOf } from '../src/util/window.js';

test('parse and format round trip', () => {
  const state = {
    from: 1200,
    to: 1250,
    view: 'graph',
    focus: null,
    group: 'none',
    lanes: [],
    selected: 'fixture-event-t',
    source: 'fixture-source-one',
    place: 'fixture-place-one',
    actor: 'fixture-actor-one',
    chain: ['fixture-event-a--fixture-event-b--caused', 'fixture-event-b--fixture-event-d--enabled'],
    horizon: 1240,
    layers: ['events'],
    narrative: null,
    step: 0,
  };
  const search = formatState(state);
  assert.equal(search, '?from=1200&to=1250&view=graph&selected=fixture-event-t&source=fixture-source-one&place=fixture-place-one&actor=fixture-actor-one&chain=fixture-event-a--fixture-event-b--caused,fixture-event-b--fixture-event-d--enabled&horizon=1240&layers=events');
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

test('a relation id is not a step of the walked chain', () => {
  // A relation id has an edge id's shape and links two actors, so the chain —
  // which is a list of edge ids (deviation 12) — refuses it by name rather
  // than by falling through a loose pattern.
  assert.deepEqual(parseState('?chain=estado-novo--portugal--regime-of').chain, []);
  assert.deepEqual(
    parseState('?chain=fixture-event-a--fixture-event-b--caused,salazar--estado-novo--led').chain,
    ['fixture-event-a--fixture-event-b--caused'],
  );
  // Nor is an invented type: the five are the five.
  assert.deepEqual(parseState('?chain=fixture-event-a--fixture-event-b--led-to').chain, []);
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
  assert.deepEqual(store.get(), {
    from: null, to: 1220, view: 'map', focus: null, group: 'none', lanes: [],
    selected: 'fixture-event-a', source: null,
    place: null, actor: null, chain: [], horizon: null, layers: ['land', 'territories', 'events'],
    narrative: null, step: 0,
  });
});

// A source is a card and a URL like a place or an actor, and the horizon is
// a year the reader chose — never the default, which is the window's own far
// end and would only make every link longer.
test('a source and a horizon travel in the URL; the default horizon does not', () => {
  assert.equal(parseState('?source=maxwell-1995').source, 'maxwell-1995');
  assert.equal(parseState('?source=../secret').source, null);
  assert.equal(formatState({ ...defaultState(), source: 'maxwell-1995' }), '?source=maxwell-1995');
  assert.equal(formatState({ ...defaultState(), horizon: null }), '');
  assert.equal(formatState({ ...defaultState(), horizon: 2011 }), '?horizon=2011');
  assert.equal(parseState('?horizon=2011').horizon, 2011);
  assert.equal(parseState('?horizon=-44').horizon, -44);
  assert.equal(parseState('?horizon=0').horizon, null, 'there is no year 0');
  assert.equal(parseState('?horizon=soon').horizon, null);
  assert.deepEqual(
    parseState('?selected=carnation-revolution-1974&horizon=2011'),
    { ...defaultState(), selected: 'carnation-revolution-1974', horizon: 2011 },
  );
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

// The lens and the grouping: how the atlas is drawn, not what is selected in
// it, and both in the link for the same reason the view is.
test('a lens travels in the URL, readably, and only in one of three kinds', () => {
  assert.equal(formatState({ ...defaultState(), focus: 'actor:salazar' }), '?focus=actor:salazar');
  assert.equal(parseState('?focus=actor:salazar').focus, 'actor:salazar');
  assert.equal(parseState('?focus=place:santa-comba-dao').focus, 'place:santa-comba-dao');
  assert.equal(parseState('?focus=source:russell-2000-henry').focus, 'source:russell-2000-henry');
  assert.equal(parseState('?focus=' + encodeURIComponent('actor:salazar')).focus, 'actor:salazar');
  for (const bad of ['event:x', 'actor:', 'actor', ':x', 'actor:../secret', 'actor:Salazar', 'narrative:x']) {
    assert.equal(parseState(`?focus=${encodeURIComponent(bad)}`).focus, null, bad);
  }
  assert.equal(formatState({ ...defaultState(), focus: null }), '');
});

test('the grouping travels in the URL, and only when it is not the default', () => {
  assert.equal(formatState({ ...defaultState(), group: 'none' }), '', 'no grouping is the default');
  assert.equal(formatState({ ...defaultState(), group: 'actor' }), '?group=actor');
  assert.equal(parseState('?group=place').group, 'place');
  assert.equal(parseState('?group=region').group, 'region');
  assert.equal(parseState('?group=continent').group, 'none', 'an unknown grouping falls back');
  assert.equal(parseState('').group, 'none');
});

test('an explicit lane list keeps the reader\'s order and needs a grouping', () => {
  assert.deepEqual(parseState('?group=actor&lanes=salazar,paigc').lanes, ['salazar', 'paigc']);
  assert.deepEqual(parseState('?lanes=paigc,salazar,paigc').lanes, ['paigc', 'salazar'], 'once each');
  assert.deepEqual(parseState('?lanes=../secret,salazar').lanes, ['salazar']);
  assert.deepEqual(parseState('').lanes, []);
  assert.equal(
    formatState({ ...defaultState(), group: 'actor', lanes: ['salazar', 'paigc'] }),
    '?group=actor&lanes=salazar,paigc',
  );
  assert.equal(
    formatState({ ...defaultState(), group: 'none', lanes: ['salazar'] }),
    '',
    'a lane list without a grouping is an instruction with no addressee',
  );
});

test('the whole of a lens and a grouping round-trips', () => {
  const url = '?from=1960&to=1975&view=graph&focus=actor:salazar&group=actor&lanes=salazar,pide';
  const parsed = parseState(url);
  assert.equal(formatState(parsed), url);
});

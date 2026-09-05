import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseState, formatState, defaultState, createState, parseBbox, formatBbox, pushes,
} from '../src/state.js';
import {
  resolveWindow, overlaps, windowAt, containsYear, decadeOf, zoomWindow,
} from '../src/util/window.js';

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
    bbox: null,
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
    narrative: null, step: 0, bbox: null,
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

// What the search box asks before it moves anything: a year the band already
// holds is not a reason to move the band. An open end holds everything on its
// side, which is what makes the empty URL — the whole span — move for nothing.
test('a window holds a year, with a null bound open at that end', () => {
  assert.equal(containsYear({ from: 1900, to: 2000 }, 1974), true);
  assert.equal(containsYear({ from: 1900, to: 2000 }, 1900), true, 'the near end is inside');
  assert.equal(containsYear({ from: 1900, to: 2000 }, 2000), true, 'the far end is inside');
  assert.equal(containsYear({ from: 1900, to: 2000 }, 1899), false);
  assert.equal(containsYear({ from: 1900, to: 2000 }, 2001), false);
  assert.equal(containsYear({ from: null, to: null }, 1500), true, 'the whole span holds every year');
  assert.equal(containsYear({ from: null, to: 1500 }, 1500), true);
  assert.equal(containsYear({ from: null, to: 1500 }, 1501), false);
  assert.equal(containsYear({ from: 1500, to: null }, 3000), true);
  assert.equal(containsYear({ from: -100, to: 100 }, -50), true, "historians' numbering orders the same way");
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

// The map's viewport, because the timeline reads it: a link sent from a
// corner of the world must open on that corner.
test('the bbox round-trips, rounded to two decimals', () => {
  assert.deepEqual(parseState('?bbox=-10,36,-6,43').bbox, [-10, 36, -6, 43]);
  assert.equal(formatState({ ...defaultState(), bbox: [-10, 36, -6, 43] }), '?bbox=-10,36,-6,43');
  assert.equal(formatBbox([-9.1372, 36.00049, -6.5, 43.499]), '-9.14,36,-6.5,43.5');
  assert.equal(formatState({ ...defaultState() }), '', 'no bbox is the world, and the world is the default');
  const url = '?from=1400&to=1500&bbox=-25.5,32,-6,43';
  assert.equal(formatState(parseState(url)), url);
});

test('a bbox that is not one is the world again', () => {
  assert.equal(parseState('?bbox=-10,36,-6').bbox, null, 'three numbers are not a box');
  assert.equal(parseState('?bbox=west,36,-6,43').bbox, null);
  assert.equal(parseState('?bbox=-10,36,-10,43').bbox, null, 'a box with no width is not a box');
  assert.equal(parseBbox('-10,43,-6,36')[1], 36, 'the ends the wrong way round are still a box');
  assert.deepEqual(parseBbox('-400,36,400,43'), [-180, 36, 180, 43], 'wider than the world is the world');
});

// The wheel over the timeline: the band narrows and widens around the year
// under the cursor, and the lanes never move (M6).
test('the wheel narrows the band around the year the cursor is over', () => {
  const window = { from: 1400, to: 1600 };
  const whole = { whole: 600 };
  const narrower = zoomWindow(window, 1500, -100, whole);
  assert.ok(narrower.to - narrower.from < 200, 'wheel up narrows');
  assert.equal((narrower.from + narrower.to) / 2, 1500, 'around the middle, when the cursor is at the middle');

  const wider = zoomWindow(window, 1500, 100, whole);
  assert.ok(wider.to - wider.from > 200, 'wheel down widens');

  // The cursor's year keeps its place in the band: a quarter of the way in
  // stays a quarter of the way in.
  const off = zoomWindow(window, 1450, -100, whole);
  const share = (1450 - off.from) / (off.to - off.from);
  assert.ok(Math.abs(share - 0.25) < 0.02, `the year under the cursor holds its place (${share})`);
});

test('the wheel never sticks at one year, and never passes the data', () => {
  const one = zoomWindow({ from: 1500, to: 1501 }, 1500, -100, { whole: 600 });
  assert.equal(one.to - one.from, 1, 'a one-year band cannot narrow further');
  const widened = zoomWindow({ from: 1500, to: 1501 }, 1500, 1, { whole: 600 });
  assert.equal(widened.to - widened.from, 2, 'but a rounding that would stick is nudged');
  const capped = zoomWindow({ from: 1400, to: 1600 }, 1500, 5000, { whole: 300 });
  assert.equal(capped.to - capped.from, 300, 'and it never widens past the data');
});

// --- Back and Forward -----------------------------------------------------

// A change of *what is open* is somewhere the reader can come back from, so
// it pushes a history entry; a change of the view only replaces the one
// there is, or dragging the time band would fill the Back button with a
// hundred frames of the same picture.

test('the push/replace rule, as a decision on the patch', () => {
  const before = { ...defaultState(), selected: 'a', actor: null, step: 0 };
  for (const patch of [{ selected: 'b' }, { actor: 'salazar' }, { place: 'lisbon' },
    { source: 'maxwell-1995' }, { narrative: 'n' }, { step: 2 },
    { selected: 'b', chain: ['a--b--caused'] }]) {
    assert.equal(pushes(patch, before), true, JSON.stringify(patch));
  }
  for (const patch of [{ to: 1500 }, { from: 1400, to: 1500 }, { view: 'graph' },
    { bbox: [1, 2, 3, 4] }, { group: 'region' }, { lanes: ['europe'] },
    { layers: ['land'] }, { focus: 'actor:salazar' }, { horizon: 1600 },
    { chain: [] }, {}]) {
    assert.equal(pushes(patch, before), false, JSON.stringify(patch));
  }
  // Setting a field to what it already holds is not an opening: a click on
  // the event already open must not add an entry to press Back twice out of.
  assert.equal(pushes({ selected: 'a' }, before), false);
  assert.equal(pushes({ step: 0 }, before), false);
});

// A window with just enough of one to hold a store: the two history calls
// counted, a location that follows what they wrote, and an animation frame
// that runs when the test says so. The frame is the unit the store coalesces
// replace-type writes into, so a fake without one would be a fake of the one
// thing being tested; `frame()` is the browser deciding to paint.
function fakeWindow(search = '') {
  const win = {
    location: { pathname: '/', search },
    listeners: {},
    pushed: [],
    replaced: [],
    frames: new Map(),
    nextFrame: 1,
    addEventListener(type, fn) { win.listeners[type] = fn; },
    requestAnimationFrame(fn) {
      const id = win.nextFrame;
      win.nextFrame += 1;
      win.frames.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) { win.frames.delete(id); },
    // Everything booked, in the order it was booked, once.
    frame() {
      const due = [...win.frames.values()];
      win.frames.clear();
      for (const fn of due) fn();
      return due.length;
    },
    history: {
      pushState(_s, _t, url) { win.pushed.push(url); win.location.search = url.slice(1); },
      replaceState(_s, _t, url) { win.replaced.push(url); win.location.search = url.slice(1); },
      // What the browser does on Back: restore the URL, then fire popstate.
      go(entries, to) { win.location.search = entries[to]; win.listeners.popstate(); },
    },
  };
  return win;
}

// The horizon is a question about one record. It used to outlive the record
// it was asked about: a year set on the war in Angola lit the downstream of
// every event clicked afterwards, and a click on the sea left `?horizon=` in
// a link that no longer had anything to be a horizon of.
test('the horizon is left behind when another record is opened', () => {
  const store = createState({ selected: 'fixture-event-a', horizon: 2000 });
  store.set({ selected: 'fixture-event-b', chain: [] });
  assert.equal(store.get().horizon, null);

  // Clicking empty ground clears the selection, which is a change of what is
  // open like any other.
  const sea = createState({ selected: 'fixture-event-a', horizon: 2000 });
  sea.set({ selected: null, chain: [] });
  assert.equal(sea.get().horizon, null);

  // Clicking the record already open is not opening another one, and neither
  // is a change of the view: the reader is still asking the same question.
  const same = createState({ selected: 'fixture-event-a', horizon: 2000 });
  same.set({ selected: 'fixture-event-a', chain: [] });
  same.set({ to: 1975 });
  same.set({ actor: 'salazar' });
  assert.equal(same.get().horizon, 2000);

  // A patch that names the horizon itself is the reader asking about the
  // record it opens, and wins: reading mode moves both at once.
  const asked = createState({ selected: 'fixture-event-a', horizon: 2000 });
  asked.set({ selected: 'fixture-event-b', horizon: 1990 });
  assert.equal(asked.get().horizon, 1990);
});

test('a horizon left behind leaves the URL as well as the state', () => {
  const win = fakeWindow();
  const store = createState({ selected: 'fixture-event-a', horizon: 2000 }, { window: win });
  store.set({ selected: 'fixture-event-b', chain: [] });
  assert.equal(win.location.search, '?selected=fixture-event-b');
});

test('opening a record pushes; moving the view replaces', () => {
  const win = fakeWindow();
  const store = createState({}, { window: win });
  store.set({ selected: 'carnation-revolution-1974' });
  store.set({ to: 1975 });
  store.set({ bbox: [-10, 36, -6, 42] });
  store.set({ actor: 'salazar' });
  assert.deepEqual(win.pushed, [
    '/?selected=carnation-revolution-1974',
    '/?to=1975&selected=carnation-revolution-1974&actor=salazar&bbox=-10,36,-6,42',
  ]);
  // The two moves of the view are one write, and it is the entry the push
  // leaves behind: the band and the box the reader had when they opened the
  // actor, which is what Back has to come back to.
  assert.deepEqual(win.replaced, ['/?to=1975&selected=carnation-revolution-1974&bbox=-10,36,-6,42']);
});

// One 40-step drag of the band used to be 40 `replaceState` calls and 40 full
// panel rebuilds; Safari refuses more than a hundred in thirty seconds and
// throws, and `write` runs before `notify`, so on Safari a two-second drag
// left the store updated and the views not told (A3).
test('replace-type writes are one per frame, and the frame writes what stands', () => {
  const win = fakeWindow();
  const store = createState({}, { window: win });
  for (let year = 1900; year < 1940; year += 1) store.set({ to: year });
  assert.deepEqual(win.replaced, [], 'nothing is written while the band is moving');
  assert.equal(store.get().to, 1939, 'and the store is up to date all along');

  assert.equal(win.frame(), 1, 'one frame was booked, not forty');
  assert.deepEqual(win.replaced, ['/?to=1939'], 'and it wrote the band the reader stopped at');

  // The next move books the next frame: coalescing is per frame, not once.
  store.set({ to: 1950 });
  win.frame();
  assert.deepEqual(win.replaced, ['/?to=1939', '/?to=1950']);
  assert.equal(win.frame(), 0, 'a frame with nothing owed writes nothing');
  assert.equal(win.replaced.length, 2);
});

// The contract the coalescing is not allowed to change: a set has been seen
// by the time it returns (review finding 23).
test('the store still notifies synchronously while a write is owed', () => {
  const win = fakeWindow();
  const store = createState({}, { window: win });
  const seen = [];
  store.subscribe((s) => seen.push(s.to));
  store.set({ to: 1500 });
  store.set({ to: 1600 });
  assert.deepEqual(seen, [1500, 1600]);
  assert.deepEqual(win.replaced, []);
});

// A browser that refuses the call is not a browser that loses the state.
test('a history call the browser refuses is not the end of the session', () => {
  const win = fakeWindow();
  win.history.replaceState = () => { throw new Error('SecurityError'); };
  const store = createState({}, { window: win });
  const seen = [];
  store.subscribe((s) => seen.push(s.to));
  store.set({ to: 1500 });
  win.frame();
  store.set({ to: 1600 });
  win.frame();
  assert.deepEqual(seen, [1500, 1600], 'the views were told both times');
  assert.equal(store.get().to, 1600);
});

test('the store names what Back returns to and what Forward goes on to', () => {
  const win = fakeWindow();
  const store = createState({}, { window: win });
  assert.deepEqual(store.trail(), { back: null, forward: null });

  store.set({ selected: 'carnation-revolution-1974' });
  assert.equal(store.trail().back.selected, null, 'back to the atlas with nothing open');
  assert.equal(store.trail().forward, null);

  store.set({ actor: 'salazar', selected: null });
  assert.equal(store.trail().back.selected, 'carnation-revolution-1974');
  assert.equal(store.trail().back.actor, null);

  // The browser's Back: the URL comes back, popstate fires, the store walks
  // its trail rather than guessing where it landed.
  const entries = ['', '?selected=carnation-revolution-1974', '?actor=salazar'];
  win.history.go(entries, 1);
  assert.equal(store.get().selected, 'carnation-revolution-1974');
  assert.equal(store.get().actor, null);
  assert.equal(store.trail().forward.actor, 'salazar');
  assert.equal(store.trail().back.selected, null);

  win.history.go(entries, 2);
  assert.equal(store.get().actor, 'salazar');
  assert.equal(store.trail().forward, null);
});

test('a change of view after going back does not lose the way forward', () => {
  const win = fakeWindow();
  const store = createState({}, { window: win });
  store.set({ selected: 'a' });
  store.set({ selected: 'b' });
  win.history.go(['', '?selected=a', '?selected=b'], 1);
  store.set({ to: 1500 });
  assert.equal(store.trail().forward.selected, 'b', 'panning is not a new opening');
  // Opening something else is, and replaces the future as the browser does.
  store.set({ selected: 'c' });
  assert.equal(store.trail().forward, null);
  assert.equal(store.trail().back.selected, 'a');
});

test('a URL that lands on neither neighbour starts the trail again', () => {
  const win = fakeWindow();
  const store = createState({}, { window: win });
  store.set({ selected: 'a' });
  win.location.search = '?selected=zzz';
  win.listeners.popstate();
  assert.deepEqual(store.trail(), { back: null, forward: null });
  assert.equal(store.get().selected, 'zzz');
});

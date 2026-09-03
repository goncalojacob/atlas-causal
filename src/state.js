// One state object, { from, to, selected, actor, chain, layers }, mirrored to
// the URL query string so every view is a shareable link. Knows nothing
// about SVG or data files. The pure parse/format pair is separate from the
// binding to window so it can be tested in Node.
//
// `from` and `to` are a window of time, not a moment: the map shows the
// events whose interval overlaps it and the territories of its far end.
// Either may be null, meaning "the bound of the data" — which bound that is
// only the views know, and this file stays free of data. A shared `?year=X`
// from before the window existed still opens: it is read as the far end,
// with the near end left at the data's own beginning.
//
// `selected` and `actor` are two dimensions of the same view, not
// alternatives: an actor stays highlighted on the map and the timeline
// while its events are read one after another, and `?actor=salazar` alone
// opens the actor's card.

import { isValidYear } from './util/dates.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EDGE_ID = /^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*--[a-z-]+$/;
export const LAYERS = Object.freeze(['land', 'territories', 'events']);
// Query parameters that are not state but must survive a state write.
const PASSTHROUGH = Object.freeze(['fixtures']);

export function defaultState() {
  return { from: null, to: null, selected: null, actor: null, chain: [], layers: [...LAYERS] };
}

// Garbage in the URL falls back to defaults field by field; a bad chain
// step drops the rest of the chain, since later steps depend on it.
export function parseState(search, defaults = defaultState()) {
  const params = new URLSearchParams(search);
  const state = { ...defaults, chain: [...defaults.chain], layers: [...defaults.layers] };
  const year = (key) => {
    const value = Number(params.get(key));
    return isValidYear(value) ? value : null;
  };
  // The legacy parameter first, so an explicit `to` in the same URL wins.
  if (params.has('year')) state.to = year('year');
  if (params.has('from')) state.from = year('from');
  if (params.has('to')) state.to = year('to');
  // A window written backwards is not garbage to drop, it is two ends the
  // wrong way round; the reader meant the span between them.
  if (state.from !== null && state.to !== null && state.from > state.to) {
    [state.from, state.to] = [state.to, state.from];
  }
  if (params.has('selected')) {
    const id = params.get('selected');
    if (SLUG.test(id)) state.selected = id;
  }
  if (params.has('actor')) {
    const id = params.get('actor');
    if (SLUG.test(id)) state.actor = id;
  }
  if (params.has('chain')) {
    const chain = [];
    for (const step of params.get('chain').split(',').filter(Boolean)) {
      if (!EDGE_ID.test(step)) break;
      chain.push(step);
    }
    state.chain = chain;
  }
  if (params.has('layers')) {
    state.layers = params.get('layers').split(',').filter((l) => LAYERS.includes(l));
  }
  return state;
}

export function formatState(state, search = '') {
  const params = new URLSearchParams();
  const previous = new URLSearchParams(search);
  for (const key of PASSTHROUGH) if (previous.has(key)) params.set(key, previous.get(key));
  if (state.from !== null) params.set('from', String(state.from));
  if (state.to !== null) params.set('to', String(state.to));
  if (state.selected) params.set('selected', state.selected);
  if (state.actor) params.set('actor', state.actor);
  if (state.chain.length) params.set('chain', state.chain.join(','));
  if (state.layers.length !== LAYERS.length || state.layers.some((l, i) => l !== LAYERS[i])) {
    params.set('layers', state.layers.join(','));
  }
  const text = params.toString().replace(/%2C/g, ',').replace(/%2D/g, '-');
  return text ? `?${text}` : '';
}

// The store. set() merges a patch, writes the URL (replaceState, so the
// back button is not spammed by slider drags) and notifies subscribers.
export function createState(initial, { window: win = null } = {}) {
  let state = { ...defaultState(), ...initial };
  const listeners = new Set();
  const notify = () => {
    for (const fn of listeners) fn(state);
  };
  const write = () => {
    if (!win) return;
    const url = `${win.location.pathname}${formatState(state, win.location.search)}`;
    win.history.replaceState(null, '', url);
  };
  // A URL written before the window existed, or with garbage in it, is
  // normalised once at load: ?year=1975 becomes ?to=1975 in the address bar,
  // so what the reader copies is what the atlas is actually showing.
  if (win && formatState(state, win.location.search) !== win.location.search) write();
  if (win) {
    win.addEventListener('popstate', () => {
      state = parseState(win.location.search, state);
      notify();
    });
  }
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      write();
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

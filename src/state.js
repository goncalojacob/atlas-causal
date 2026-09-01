// One state object, { year, selected, chain, layers }, mirrored to the URL
// query string so every view is a shareable link. Knows nothing about SVG
// or data files. The pure parse/format pair is separate from the binding
// to window so it can be tested in Node.

import { isValidYear } from './util/dates.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EDGE_ID = /^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*--[a-z-]+$/;
export const LAYERS = Object.freeze(['land', 'events']);
// Query parameters that are not state but must survive a state write.
const PASSTHROUGH = Object.freeze(['fixtures']);

export function defaultState() {
  return { year: null, selected: null, chain: [], layers: [...LAYERS] };
}

// Garbage in the URL falls back to defaults field by field; a bad chain
// step drops the rest of the chain, since later steps depend on it.
export function parseState(search, defaults = defaultState()) {
  const params = new URLSearchParams(search);
  const state = { ...defaults, chain: [...defaults.chain], layers: [...defaults.layers] };
  if (params.has('year')) {
    const year = Number(params.get('year'));
    if (isValidYear(year)) state.year = year;
  }
  if (params.has('selected')) {
    const id = params.get('selected');
    if (SLUG.test(id)) state.selected = id;
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
  if (state.year !== null) params.set('year', String(state.year));
  if (state.selected) params.set('selected', state.selected);
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

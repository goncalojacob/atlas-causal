// One state object, { from, to, view, selected, source, place, actor, chain,
// horizon, layers, narrative, step },
// mirrored to
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
// `view` is which drawing of the graph is on screen, the map or the graph
// view. It is state, not a preference: a link is meant to open on the
// picture the person who sent it was looking at.
//
// `selected`, `source`, `place` and `actor` are dimensions of the same view,
// not alternatives: an actor stays highlighted on the map and the timeline
// while its events are read one after another, and `?actor=salazar` alone
// opens the actor's card. Which card the panel shows is a precedence —
// `selected` over `source` over `place` over `actor` — so opening an event
// from a place's list does not throw the place away.
//
// `horizon` is the year of the question "what did this lead to by then?".
// Null means the window's far end, which is the default and is deliberately
// never written to the URL: only a year the reader chose is worth carrying
// in a link, and only a chosen year lights the reachable set in the views.
//
// `narrative` and `step` are a mode rather than another dimension: while a
// narrative is being read, the two of them are the whole of the URL, and the
// selection, the chain and the window are derived from the step (narrative.js)
// and deliberately not written. A link to a narrative is a link to a place in
// an argument, not a snapshot of somebody's screen.

import { isValidYear } from './util/dates.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// The chain is a list of edge ids (deviation 12), and an edge id names one of
// the five types. A relation id has the same three-part shape and a type from
// its own closed set: it links two actors and is not a step of a causal path,
// so it is refused here by name rather than by falling through a loose
// pattern. The two vocabularies are written out because this file stays free
// of the data and of the rules that read it.
const EDGE_ID = /^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*--(caused|enabled|reacted-to|precondition-of|inspired)$/;
const RELATION_ID = /^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*--(regime-of|succeeded|member-of|part-of|led|allied-with)$/;
export const LAYERS = Object.freeze(['land', 'territories', 'events']);
export const VIEWS = Object.freeze(['map', 'graph']);
// Query parameters that are not state but must survive a state write.
const PASSTHROUGH = Object.freeze(['fixtures']);

export function defaultState() {
  return {
    from: null, to: null, view: 'map', selected: null, source: null, place: null,
    actor: null, chain: [], horizon: null, layers: [...LAYERS], narrative: null, step: 0,
  };
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
  if (params.has('source')) {
    const id = params.get('source');
    if (SLUG.test(id)) state.source = id;
  }
  if (params.has('horizon')) state.horizon = year('horizon');
  if (params.has('place')) {
    const id = params.get('place');
    if (SLUG.test(id)) state.place = id;
  }
  if (params.has('actor')) {
    const id = params.get('actor');
    if (SLUG.test(id)) state.actor = id;
  }
  if (params.has('chain')) {
    const chain = [];
    for (const step of params.get('chain').split(',').filter(Boolean)) {
      if (RELATION_ID.test(step) || !EDGE_ID.test(step)) break;
      chain.push(step);
    }
    state.chain = chain;
  }
  if (params.has('narrative')) {
    const id = params.get('narrative');
    if (SLUG.test(id)) state.narrative = id;
  }
  // Clamped to the walk by narrative.js, which is the only thing that knows
  // how long the walk is; here it only has to be a step number.
  if (params.has('step')) {
    const step = Number(params.get('step'));
    state.step = Number.isInteger(step) && step >= 0 ? step : 0;
  }
  if (params.has('view') && VIEWS.includes(params.get('view'))) state.view = params.get('view');
  if (params.has('layers')) {
    state.layers = params.get('layers').split(',').filter((l) => LAYERS.includes(l));
  }
  return state;
}

export function formatState(state, search = '') {
  const params = new URLSearchParams();
  const previous = new URLSearchParams(search);
  for (const key of PASSTHROUGH) if (previous.has(key)) params.set(key, previous.get(key));
  // Reading mode: the narrative and the step are the state, and everything
  // derived from them stays out of the address bar.
  if (state.narrative) {
    params.set('narrative', state.narrative);
    params.set('step', String(state.step ?? 0));
    const reading = params.toString().replace(/%2C/g, ',').replace(/%2D/g, '-');
    return reading ? `?${reading}` : '';
  }
  if (state.from !== null) params.set('from', String(state.from));
  if (state.to !== null) params.set('to', String(state.to));
  if (state.view && state.view !== 'map') params.set('view', state.view);
  if (state.selected) params.set('selected', state.selected);
  if (state.source) params.set('source', state.source);
  if (state.place) params.set('place', state.place);
  if (state.actor) params.set('actor', state.actor);
  if (state.chain.length) params.set('chain', state.chain.join(','));
  if (state.horizon !== null && state.horizon !== undefined) params.set('horizon', String(state.horizon));
  if (state.layers.length !== LAYERS.length || state.layers.some((l, i) => l !== LAYERS[i])) {
    params.set('layers', state.layers.join(','));
  }
  const text = params.toString().replace(/%2C/g, ',').replace(/%2D/g, '-');
  return text ? `?${text}` : '';
}

// The store. set() merges a patch, writes the URL (replaceState, so the
// back button is not spammed by dragging the band) and notifies subscribers.
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

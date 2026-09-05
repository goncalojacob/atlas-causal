// One state object, { from, to, view, focus, group, lanes, selected, source,
// place, actor, chain, horizon, layers, narrative, step, bbox },
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
// `focus` is the lens — `actor:salazar`, `place:lisbon`, `source:<id>` — and
// it is not a selection: it says which events exist for the three views at
// all, where a selection says which of them the reader is holding. One
// removes, the other dims, and a state that ran them together could say
// neither.
//
// `group` is what the timeline's lanes and the graph's bands are — `none`,
// `actor`, `place`, `region` — and `lanes` is the reader's own ordered list
// of them, empty for the automatic six. Both are how the atlas is drawn
// rather than what is selected in it, and both are in the URL for the same
// reason `view` is: a link should open on the picture it was sent from.
//
// `horizon` is the year of the question "what did this lead to by then?".
// Null means the window's far end, which is the default and is deliberately
// never written to the URL: only a year the reader chose is worth carrying
// in a link, and only a chosen year lights the reachable set in the views.
//
// `bbox` is the part of the world the map is looking at, `[west, south,
// east, north]`. It is the one piece of the map's pan and zoom that is
// state, and it is state for one reason only: the timeline reads it, so that
// panning to the Indian Ocean narrows the lanes to the events there. Which
// means it has to be shareable, and a link that opened on the whole world
// after being sent from a corner of it would be a different picture.
//
// Null is the world — not "the map is at rest", but "the timeline is not
// filtered by the map at all", which is what the pin control restores.
//
// `narrative` and `step` are a mode rather than another dimension: while a
// narrative is being read, the two of them are the whole of the URL, and the
// selection, the chain and the window are derived from the step (narrative.js)
// and deliberately not written. A link to a narrative is a link to a place in
// an argument, not a snapshot of somebody's screen.
//
// Two kinds of change, and the browser's Back is the reason: a change of
// *what is open* — the event, the source, the place, the actor, the
// narrative, the step — pushes a history entry, and a change of the view
// only — pan, zoom, the window, the lanes, the layers, the lens — replaces
// the one there is. Otherwise dragging the time band would fill Back with a
// hundred frames of the same picture, and opening an actor from an event
// would leave no way back to the event but searching for it again.

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
// The three kinds a lens can be about, and the four groupings. Written out
// here rather than imported, because this file stays free of the data and of
// everything that reads it — as the two id patterns above are.
const FOCUS = /^(actor|place|source):[a-z0-9]+(-[a-z0-9]+)*$/;
export const GROUPS = Object.freeze(['none', 'actor', 'place', 'region']);
// Query parameters that are not state but must survive a state write.
const PASSTHROUGH = Object.freeze(['fixtures']);

export function defaultState() {
  return {
    from: null, to: null, view: 'map', focus: null, group: 'none', lanes: [],
    selected: null, source: null, place: null,
    actor: null, chain: [], horizon: null, layers: [...LAYERS], narrative: null, step: 0,
    bbox: null,
  };
}

// Two decimals is about a kilometre of longitude at these latitudes: finer
// than any place record is placed, and short enough that the parameter stays
// readable in a link somebody is about to paste into a message.
const round2 = (n) => Number(n.toFixed(2));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// `[west, south, east, north]`, or null for anything that is not four
// numbers or is inside out. A view wider than the world is clamped to the
// world rather than refused: the map lets the reader zoom out past the
// coastlines, and that view is still a view.
export function normalizeBbox(box) {
  const n = Array.isArray(box) ? box.map(Number) : [];
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return null;
  const west = clamp(Math.min(n[0], n[2]), -180, 180);
  const east = clamp(Math.max(n[0], n[2]), -180, 180);
  const south = clamp(Math.min(n[1], n[3]), -90, 90);
  const north = clamp(Math.max(n[1], n[3]), -90, 90);
  if (west === east || south === north) return null;
  return [round2(west), round2(south), round2(east), round2(north)];
}

export function parseBbox(text) {
  return normalizeBbox(String(text ?? '').split(','));
}

export function formatBbox(bbox) {
  return bbox.map(round2).join(',');
}

// Garbage in the URL falls back to defaults field by field; a bad chain
// step drops the rest of the chain, since later steps depend on it.
export function parseState(search, defaults = defaultState()) {
  const params = new URLSearchParams(search);
  const state = {
    ...defaults, chain: [...defaults.chain], layers: [...defaults.layers], lanes: [...defaults.lanes],
  };
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
  if (params.has('focus') && FOCUS.test(params.get('focus'))) state.focus = params.get('focus');
  if (params.has('group') && GROUPS.includes(params.get('group'))) state.group = params.get('group');
  // An explicit lane list is the reader's order, so duplicates are dropped
  // rather than sorted away; whether an id names a record at all is decided
  // by lanes.js, which has the data this file deliberately does not.
  if (params.has('lanes')) {
    const lanes = [];
    for (const id of params.get('lanes').split(',').filter(Boolean)) {
      if (SLUG.test(id) && !lanes.includes(id)) lanes.push(id);
    }
    state.lanes = lanes;
  }
  if (params.has('bbox')) state.bbox = parseBbox(params.get('bbox'));
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
    const reading = params.toString().replace(/%2C/g, ',').replace(/%2D/g, '-').replace(/%3A/g, ':');
    return reading ? `?${reading}` : '';
  }
  if (state.from !== null) params.set('from', String(state.from));
  if (state.to !== null) params.set('to', String(state.to));
  if (state.view && state.view !== 'map') params.set('view', state.view);
  if (state.focus) params.set('focus', state.focus);
  if (state.group && state.group !== 'none') params.set('group', state.group);
  // A lane list without a grouping to belong to would be an instruction with
  // no addressee, and `none` has no lanes to order.
  if (state.lanes?.length && state.group && state.group !== 'none') params.set('lanes', state.lanes.join(','));
  if (state.selected) params.set('selected', state.selected);
  if (state.source) params.set('source', state.source);
  if (state.place) params.set('place', state.place);
  if (state.actor) params.set('actor', state.actor);
  if (state.chain.length) params.set('chain', state.chain.join(','));
  if (state.bbox) params.set('bbox', formatBbox(state.bbox));
  if (state.horizon !== null && state.horizon !== undefined) params.set('horizon', String(state.horizon));
  if (state.layers.length !== LAYERS.length || state.layers.some((l, i) => l !== LAYERS[i])) {
    params.set('layers', state.layers.join(','));
  }
  const text = params.toString().replace(/%2C/g, ',').replace(/%2D/g, '-').replace(/%3A/g, ':');
  return text ? `?${text}` : '';
}

// What is *open*: the record the reader is holding, in whichever of the five
// slots holds it. A change to one of these is somewhere they can come back
// from, so it pushes a history entry; a change of the view only — pan, zoom,
// the window, the lanes, the layers, the lens — replaces the entry there is,
// so that dragging the band does not fill the Back button with a hundred
// frames of the same picture.
export const OPENINGS = Object.freeze(['selected', 'source', 'place', 'actor', 'narrative', 'step']);

// Pure, and on the patch: given what is being set and what stands now, does
// this change push or replace? Setting a field to the value it already has is
// not an opening — a click on the event already open must not add an entry
// the reader would then have to press Back twice to get out of.
export function pushes(patch, before = {}) {
  return OPENINGS.some((key) => key in patch && patch[key] !== before[key]);
}

const opening = (state) => Object.fromEntries(OPENINGS.map((key) => [key, state[key] ?? null]));
const sameOpening = (a, b) => OPENINGS.every((key) => a[key] === b[key]);
// Long enough that Back always has somewhere to go in a session's reading,
// short enough that the trail is not a second copy of the session.
const TRAIL = 50;

// The store. set() merges a patch, writes the URL — pushing when what is open
// changed, replacing otherwise — and notifies subscribers.
export function createState(initial, { window: win = null, restore = (s) => s } = {}) {
  let state = { ...defaultState(), ...initial };
  const listeners = new Set();
  const notify = () => {
    for (const fn of listeners) fn(state);
  };
  // The browser will not say what Back returns to, or whether Forward has
  // anywhere to go: there is no way to read its stack. So the store keeps its
  // own trail of the openings it pushed, and popstate walks it. A URL that
  // lands on neither neighbour — one pasted in, one from before this page
  // loaded — starts the trail again rather than guessing.
  let trail = [opening(state)];
  let at = 0;
  const write = (push) => {
    if (!win) return;
    const url = `${win.location.pathname}${formatState(state, win.location.search)}`;
    const here = `${win.location.pathname}${win.location.search}`;
    // A push to the URL already showing would be an entry that goes nowhere.
    if (push && url !== here) win.history.pushState(null, '', url);
    else win.history.replaceState(null, '', url);
  };
  // A URL written before the window existed, or with garbage in it, is
  // normalised once at load: ?year=1975 becomes ?to=1975 in the address bar,
  // so what the reader copies is what the atlas is actually showing.
  if (win && formatState(state, win.location.search) !== win.location.search) write(false);
  if (win) {
    win.addEventListener('popstate', () => {
      // On a popstate the URL is the whole truth about what is open: those
      // fields are taken from it and not inherited, or going back from an
      // actor's card to the event's would leave the actor open and Back
      // could only ever add. Everything else — the window, the lanes, the
      // layers — still falls back to what stands, because a URL that does
      // not name them is not asking for them to change. `restore` is where a
      // narrative's derived selection is put back (narrative-mode.js).
      const url = parseState(win.location.search);
      state = restore({ ...parseState(win.location.search, state), ...opening(url), chain: url.chain });
      const now = opening(state);
      if (at > 0 && sameOpening(trail[at - 1], now)) at -= 1;
      else if (at < trail.length - 1 && sameOpening(trail[at + 1], now)) at += 1;
      else { trail = [now]; at = 0; }
      notify();
    });
  }
  return {
    get: () => state,
    // What Back would return to and Forward go on to, as openings; null on
    // either side when there is nowhere to go. The panel names them.
    trail: () => ({
      back: at > 0 ? trail[at - 1] : null,
      forward: at < trail.length - 1 ? trail[at + 1] : null,
    }),
    set(patch) {
      const push = pushes(patch, state);
      state = { ...state, ...patch };
      write(push);
      if (push) {
        // Anything ahead of here was a future the reader has just replaced,
        // which is what the browser's own stack does with it too.
        trail = [...trail.slice(Math.max(0, at + 1 - TRAIL), at + 1), opening(state)];
        at = trail.length - 1;
      } else {
        trail[at] = opening(state);
      }
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// One state object, { from, to, view, focus, focusAll, degree, selected, edge,
// source, place, actor, office, chain, horizon, layers, narrative, step, walk,
// bbox }, mirrored to
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
// `selected`, `source`, `office`, `place` and `actor` are dimensions of the
// same view, not alternatives: an actor stays highlighted on the map and the
// timeline while its events are read one after another, and `?actor=salazar`
// alone opens the actor's card. Which card the panel shows is a precedence —
// `edge` over `selected` over `source` over `office` over `place` over
// `actor` — so opening an event from a place's list does not throw the place
// away, and an office opened from the card of the actor it belongs to is what
// is shown.
//
// `edge` is the sixth and the newest (M80). The owner, 22 September: *"In the
// graph I should be able to select a connection the same way I select an
// event, so I can check its sources, description, etc."* An edge is a record
// like any other — a type, two ends, a confidence, its sources and the
// argument itself — and until now nothing on the page opened one: it was
// walked and never read. `?edge=<id>` is its address, and it is an id of the
// edge vocabulary and never a slug, so a relation's id cannot stand in it.
//
// It is at the head of the precedence because it is the card the reader
// asked for last, and it is left behind by any other opening (`set` below):
// two cards are two cards, and a reader who clicks one of the link's two ends
// is asking for the event. **It is not a lens.** Nothing in `lens.js` reads
// it, so choosing a link narrows no picture — it highlights one line and
// names its ends, which is what the owner's sentence asks for.
//
// `focus` is the lens — a comma-separated list of `kind:id`, of any length and
// of any of the six kinds (`actor`, `place`, `source`, `event`, `region`,
// `narrative`), or the literal `none` — and it is not a selection: it says
// which events exist for the three views at all, where a selection says which
// of them the reader is holding. One removes, the other dims, and a state that
// ran them together could say neither. `focusAll` makes the set the
// intersection of the foci rather than their union.
//
// `none` is a value and not the absence of one, because the absence means
// something else since H7: an open actor or place with no `?focus=` is a lens
// on itself (lens.js), and `none` is how a reader says no to that while
// keeping the card open.
//
// `degree` is what the **graph** draws, and only the graph (M48 §3). 103 of the
// 250 active events have one edge or none and eight carry seven or more, so a
// picture of all of them is eight nodes a reader can read and two hundred they
// cannot: it is the least number of active links an event needs to be drawn. It
// is a filter and not a deletion — a hidden event is still reachable by walking
// to it, by searching for it and by focusing on it — and it does not apply
// inside a lens, because a reader who has focused has already said what they
// want to see.
//
// **`tops` is gone** (M83, B10). It was the other half of that pair — draw only
// events with no parent — and M65 took the lever by making the resting picture
// the top level everywhere: `organises` is applied to `shown`, which at rest is
// the main events, so `tops` differed from it only for an event whose sole
// parents are retracted or missing, which over the corpus of 22 September is
// none at all. Inside a lens it was off by rule. A switch, a parameter and a
// round trip through `formatState` that nothing a reader could see depended on.
// `?tops=1` in an old link is read into nothing, which is deviation 848's rule.
//
// In the URL and not in a preference, for the reason `view` is: a link is
// meant to open on the picture the person who sent it was looking at. A link
// shared before M48 names neither and opens on the default, which is a
// narrower graph than its sender saw and the same map and timeline.
//
// **`group` and `lanes` are gone** (M77). They were what the timeline's lanes
// and the graph's bands were — `none`, `actor`, `place`, `region` — and the
// reader's own ordered list of them. The owner, 21 September: *"Right now the
// grouping function is useless, let's simplify the platform and remove it."*
// A `?group=` or a `?lanes=` in a link shared before this is read into
// nothing and opens the default lanes, which is deviation 848's rule for
// every parameter this atlas has retired.
//
// `horizon` is the year of the question "what did this lead to by then?".
// Null means the window's far end, which is the default and is deliberately
// never written to the URL: only a year the reader chose is worth carrying
// in a link, and only a chosen year lights the reachable set in the views.
// It belongs to the record it was asked about, so opening another one clears
// it — a question asked of one event is not an answer about the next.
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
// narrative is being read, the two of them are very nearly the whole of the
// URL, and the selection, the chain and the window are derived from the step
// (narrative.js) and deliberately not written. A link to a narrative is a link
// to a place in an argument, not a snapshot of somebody's screen. `focus` is
// the exception since M48, because reading a narrative now *is* a lens and an
// explicit one is the reader overruling it; see `formatState`.
//
// Two kinds of change, and the browser's Back is the reason: a change of
// *what is open* — the event, the source, the place, the actor, the
// narrative, the step — pushes a history entry, and a change of the view
// only — pan, zoom, the window, the lanes, the layers, the lens — replaces
// the one there is. Otherwise dragging the time band would fill Back with a
// hundred frames of the same picture, and opening an actor from an event
// would leave no way back to the event but searching for it again.

import { isValidYear } from './util/dates.js';
// The chain is a list of edge ids (deviation 12), and an edge id names one of
// the five types. A relation id has the same three-part shape and a type from
// its own closed set: it links two actors and is not a step of a causal path,
// so it is refused here by name rather than by falling through a loose
// pattern.
//
// Both patterns, the lens's and the four groupings used to be written out
// here, "because this file stays free of the data". They were copies, and
// copies of a closed set drift (health review A, finding 28): `vocab.js` is
// as free of the data as this file is — it imports nothing at all — so
// importing it costs this file none of its independence.
import {
  EDGE_ID, RELATION_ID, FOCUS_PARAM, VIEWS,
} from './vocab.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// `land` is still one of them, and it is no longer a switch: the coastlines
// are always drawn (plan decision 14) and the checkbox is gone. The name stays
// a member so that every `?layers=` link ever shared still parses, and so that
// the default is the literal it always was.
//
// The six after it are the base map's, the ones the layer control switches
// (M37b, and `relief` since M45b). `coast` is deliberately **not** among them: the near coastline is the
// coastline, and a switch that turned off half of it at one zoom would be a
// switch for a level of detail and not for a layer (deviation 523).
//
// A link that named a subset before the base map existed —
// `?layers=territories,events` — now also turns the base map off. It says
// "these and nothing else" and is read that way; the alternative, treating a
// name an old link could not have carried as on, makes turning a base layer off
// impossible to express in the URL at all (deviation 522).
export const LAYERS = Object.freeze(['land', 'territories', 'events',
  'relief', 'rivers', 'lakes', 'physical', 'mountains', 'cities']);
// And what is on when the reader has said nothing. It is `LAYERS` without
// `relief` (M45b): the bands are 5 MB of ground and the only layer that fills
// across open land, and a map that opened with them on would be a relief map
// of the world with a history drawn on it rather than the other way round.
// Everything else is on, as it always was.
//
// Two lists and not one, so that the default still writes nothing into the
// address bar and `?layers=relief,…` is what a reader gets when they switch
// the bands on — which is what makes the picture they are looking at shareable
// (deviation 979).
export const DEFAULT_LAYERS = Object.freeze(LAYERS.filter((id) => id !== 'relief'));
// A category of events, off the closed list in `data/categories.json`:
// `events:war`. Which categories exist is deliberately not known here — this
// file holds none of the data — so a token is checked for shape only and a
// name nobody recognises is dropped by whatever reads it, exactly as a lane
// id is dropped by `lanes.js`. The bare `events` means every category.
const EVENTS_LAYER = /^events:[a-z0-9]+(-[a-z0-9]+)*$/;
export { VIEWS };
// Query parameters that are not state but must survive a state write.
// `review` joined it in M82: it says whether the page shows the review
// apparatus (demo.js), which is a fact about the page and not about what the
// atlas is drawing, and a maintainer who clicks an event should not find they
// have turned it off.
const PASSTHROUGH = Object.freeze(['fixtures', 'review']);

// What the degree control offers, and where it starts.
//
// It was **two** from M48 until M82, and the argument was good at the time:
// 103 of the 250 active events had one edge or none, a picture of all of them
// was eight nodes a reader could read and two hundred they could not, and a
// floor of two kept the 147 that organise something.
//
// **Zero since M82, because M65 made the argument twice.** What a view draws at
// rest is the *main events* — those that are part of nothing else — and that is
// already the answer to "do not draw the haze": the parts of a war are drawn
// when the reader opens the war. The degree floor on top of it was a second
// filter nobody had asked for, applied before the first click, and what it
// removed was not haze but ninety-one events that are nothing's parts and
// happen to have one link or none. The reviewer measured the difference on the
// live site — 154 nodes against 245 main — and could not tell from the picture
// which rule had taken the rest away.
//
// So **rest means rest**: with nothing asked, the graph draws the resting
// picture and no more and no less (`arrangementOf`, `organises`). The control
// is untouched and the reader still raises the floor from the masthead; it is
// a thing they reach for, not a thing applied to them.
export const DEGREE_CHOICES = Object.freeze([0, 1, 2, 3]);
export const DEGREE_DEFAULT = 0;

export function defaultState() {
  return {
    from: null, to: null, view: 'map', focus: null, focusAll: false,
    degree: DEGREE_DEFAULT,
    selected: null, source: null, place: null, edge: null,
    actor: null, office: null, chain: [], horizon: null, layers: [...DEFAULT_LAYERS], narrative: null, step: 0,
    walk: null,
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
//
// And the world itself is not a box. `?bbox=-180,-90,180,90` said "the map is
// looking at part of the world" about the whole of it: the lanes were
// filtered, the note appeared, and every event with no place fell out
// (health review B, finding 15). The absence of a box is what "the world"
// means here — it is what the timeline's pin restores — so the one rule lives
// in the one place a box is made, and a pan can no longer write it.
//
// **The two longitudes are not sorted.** A box runs east from `west` to
// `east`, so one whose west end is east of its east end is the strip that
// crosses ±180 — and since M39a that meridian is an ordinary part of the
// picture rather than its edge, so it is a strip the map really shows and a
// link really carries. `containsPoint` and `boxesOverlap` in util/viewport.js
// have always read a box that way; it was this function, sorting them, that
// turned every view of the Pacific into a view of everywhere else. The two
// latitudes are sorted, because nothing wraps in latitude.
//
// A longitude outside the world is still clamped rather than wrapped: a box
// wider than the world is what "the world" is written as in an old link, and
// wrapping it would turn it into a narrow strip nobody asked for.
export function normalizeBbox(box) {
  const n = Array.isArray(box) ? box.map(Number) : [];
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return null;
  const west = clamp(n[0], -180, 180);
  const east = clamp(n[2], -180, 180);
  const south = clamp(Math.min(n[1], n[3]), -90, 90);
  const north = clamp(Math.max(n[1], n[3]), -90, 90);
  // Two ends on the same meridian are either no width at all or the whole
  // world; both are the world, which is no box.
  if (west === east || south === north) return null;
  if (west === -180 && east === 180 && south === -90 && north === 90) return null;
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
    ...defaults, chain: [...defaults.chain], layers: [...defaults.layers],
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
  // The link's own address (M80). Checked against the edge vocabulary and not
  // against the slug every other opening uses: an edge id is `from--to--type`
  // and its third part comes from a closed list, so `?edge=` cannot be handed
  // a relation — which has the same three-part shape and is not a step of a
  // causal path (`chain` below refuses one for the same reason).
  if (params.has('edge')) {
    const id = params.get('edge');
    if (!RELATION_ID.test(id) && EDGE_ID.test(id)) state.edge = id;
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
  // An office record is a record like any other and was unreachable without
  // an address of its own (plan review, finding 29). It is a card and not a
  // lens: opening one says nothing about which events exist.
  if (params.has('office')) {
    const id = params.get('office');
    if (SLUG.test(id)) state.office = id;
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
  // Reserved, and parsed so that it survives a state write: a generated walk
  // that the reader has not saved, held for the session only and never
  // committed (plan decision 7, review finding 8). Nothing derives anything
  // from it yet — the Why mode (M35) is what will — and it is deliberately
  // *not* a directory under `data/`: a stitched path is itself a claim, and
  // an unsigned claim does not enter the corpus.
  if (params.has('walk')) {
    const id = params.get('walk');
    if (SLUG.test(id)) state.walk = id;
  }
  // A comma-separated list of `kind:id` since H7, or the literal `none`; one
  // focus is the same string it always was, so every link ever shared still
  // opens on the lens it named. `focusAll` turns the union into an
  // intersection — "all of these" rather than "any of these".
  if (params.has('focus') && FOCUS_PARAM.test(params.get('focus'))) state.focus = params.get('focus');
  state.focusAll = params.get('focusAll') === '1';
  // A floor outside the list the control offers is a link written by hand, and
  // it is honoured where it is a whole number of links: the control is a
  // convenience and the parameter is the state. Anything else falls back to the
  // default, field by field, as everything here does.
  // Digits and nothing else: `Number('')` is 0, and an empty parameter is a
  // link with a typo in it and not a reader asking for every event.
  if (/^\d+$/.test(params.get('degree') ?? '')) state.degree = Number(params.get('degree'));
  if (params.has('bbox')) state.bbox = parseBbox(params.get('bbox'));
  if (params.has('view') && VIEWS.includes(params.get('view'))) state.view = params.get('view');
  if (params.has('layers')) {
    state.layers = params.get('layers').split(',')
      .filter((l) => LAYERS.includes(l) || EVENTS_LAYER.test(l));
  }
  return state;
}

export function formatState(state, search = '') {
  const params = new URLSearchParams();
  const previous = new URLSearchParams(search);
  for (const key of PASSTHROUGH) if (previous.has(key)) params.set(key, previous.get(key));
  // Reading mode: the narrative and the step are the state, and everything
  // derived from them stays out of the address bar.
  //
  // `focus` is the one exception, and it is one because since M48 reading a
  // narrative is itself a lens (lens.js): an explicit `?focus=` while reading
  // is the reader overruling that, and `?focus=none` is the reader turning it
  // off. Neither is derived from the step — both outlive it — and a parameter
  // the next `set` silently dropped would be a lens on screen that no link
  // could carry and Back could not return to.
  if (state.narrative) {
    params.set('narrative', state.narrative);
    params.set('step', String(state.step ?? 0));
    if (state.walk) params.set('walk', state.walk);
    if (state.focus) params.set('focus', state.focus);
    if (state.focusAll && state.focus && state.focus !== 'none') params.set('focusAll', '1');
    const reading = params.toString().replace(/%2C/g, ',').replace(/%2D/g, '-').replace(/%3A/g, ':');
    return reading ? `?${reading}` : '';
  }
  if (state.from !== null) params.set('from', String(state.from));
  if (state.to !== null) params.set('to', String(state.to));
  if (state.view && state.view !== 'map') params.set('view', state.view);
  if (state.walk) params.set('walk', state.walk);
  if (state.focus) params.set('focus', state.focus);
  // Only beside a lens: "all of these" with no foci is an instruction with no
  // addressee, and it would sit in every link the reader ever copied.
  if (state.focusAll && state.focus && state.focus !== 'none') params.set('focusAll', '1');
  // The default writes nothing, so the link a reader copies says what they
  // changed and not what they left alone.
  if (Number.isInteger(state.degree) && state.degree !== DEGREE_DEFAULT) params.set('degree', String(state.degree));
  if (state.edge) params.set('edge', state.edge);
  if (state.selected) params.set('selected', state.selected);
  if (state.source) params.set('source', state.source);
  if (state.place) params.set('place', state.place);
  if (state.actor) params.set('actor', state.actor);
  if (state.office) params.set('office', state.office);
  if (state.chain.length) params.set('chain', state.chain.join(','));
  if (state.bbox) params.set('bbox', formatBbox(state.bbox));
  if (state.horizon !== null && state.horizon !== undefined) params.set('horizon', String(state.horizon));
  // The default is `DEFAULT_LAYERS` in order and writes nothing. Anything else
  // is written as it stands, category tokens included: turning one category
  // off replaces `events` with one `events:<id>` per category still on, so
  // what the reader did is always in the link they copy.
  if (state.layers.length !== DEFAULT_LAYERS.length || state.layers.some((l, i) => l !== DEFAULT_LAYERS[i])) {
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
export const OPENINGS = Object.freeze(['edge', 'selected', 'source', 'office', 'place', 'actor', 'narrative', 'step']);

// All of those but one are a *card*. `step` is not one on its own: it is a
// position inside a narrative, and the narrative beside it is the opening.
export const CARDS = Object.freeze(OPENINGS.filter((key) => key !== 'step'));

// Is a record open at all? The panel asks it to know whether it has anything
// to show, and the phone asks it to know whether to raise the sheet.
export function hasOpening(state = {}) {
  return CARDS.some((key) => state[key]);
}

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
  // The walk the atlas assembled, when one has been (walk.js). Beside the
  // state and never in it, for two reasons that pull the same way.
  //
  // It is not a *field* of the state: the state is what a URL says, every
  // field of it is written and parsed, and a walk is a small object of edge
  // ids and a provenance that no address bar should ever carry. And it is not
  // in `data/` either — a stitched path is a claim, and an unsigned claim does
  // not enter the corpus (plan decision 7, D13). Between the two there is
  // exactly one place left for it: the session, which is here.
  //
  // `state.walk` is a different thing and stays what it has always been: the
  // reserved `?walk=` parameter, parsed so it survives a state write, written
  // by nothing. The address of a generated walk is the Why mode's decision
  // (M35, `?why=`, whose inputs *are* the walk), and a URL that means nothing
  // in another session is a link the atlas would break.
  let generated = null;
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
  const writeNow = (push, snapshot = state) => {
    const url = `${win.location.pathname}${formatState(snapshot, win.location.search)}`;
    const here = `${win.location.pathname}${win.location.search}`;
    // A push to the URL already showing would be an entry that goes nowhere.
    // The try is for Safari, which refuses more than a hundred history calls
    // in thirty seconds and throws: the state stands either way, and a URL
    // one frame out of date is a smaller failure than a store that stopped
    // telling its views anything (A3).
    try {
      if (push && url !== here) win.history.pushState(null, '', url);
      else win.history.replaceState(null, '', url);
    } catch { /* the browser's own rate limit; the next write catches up */ }
  };

  // A replace-type write — a frame of a band drag, a wheel notch, a pan —
  // happens at most once per animation frame. A forty-step drag of the `to`
  // handle used to be forty `replaceState` calls, which is how Safari's limit
  // is reached in two seconds; the frame is also where the drag's last move
  // lands, so letting go leaves the address bar on the band the reader
  // stopped at.
  //
  // `notify` is deliberately not deferred with it. The store's contract is
  // that a `set` has been seen by the time it returns — the panel relies on
  // it, and every test of a view would otherwise become a timing test
  // (review finding 23).
  //
  // A window with no `requestAnimationFrame` writes immediately: the fallback
  // is for the fakes the tests build, since a browser always has one.
  const raf = typeof win?.requestAnimationFrame === 'function' ? win.requestAnimationFrame.bind(win) : null;
  const unraf = typeof win?.cancelAnimationFrame === 'function' ? win.cancelAnimationFrame.bind(win) : null;
  let frame = null;
  let owed = false;
  const drop = () => {
    if (frame !== null && unraf) unraf(frame);
    frame = null;
    owed = false;
  };
  const write = (push, before = null) => {
    if (!win) return;
    if (!push) {
      if (!raf) { writeNow(false); return; }
      owed = true;
      // A frame already booked writes whatever stands when it runs, which is
      // the whole point: the moves in between never reach the address bar.
      if (frame === null) {
        frame = raf(() => {
          frame = null;
          if (owed) { owed = false; writeNow(false); }
        });
      }
      return;
    }
    // A push with a frame still owed: the entry being left behind is the one
    // that write was for, so it is written first. Otherwise Back would return
    // to the picture from before the drag rather than the one the reader was
    // looking at when they opened something.
    if (owed && before) writeNow(false, before);
    drop();
    writeNow(true);
  };
  // A URL written before the window existed, or with garbage in it, is
  // normalised once at load: ?year=1975 becomes ?to=1975 in the address bar,
  // so what the reader copies is what the atlas is actually showing. At once,
  // not on a frame: it is not a move of the view and there is nothing for it
  // to be coalesced with.
  if (win && formatState(state, win.location.search) !== win.location.search) writeNow(false);
  if (win) {
    win.addEventListener('popstate', () => {
      // On a popstate the URL is the whole truth — not only about what is
      // open, but about the picture. It used to be parsed with the live state
      // as its defaults, so any field the entry did not name kept the value it
      // had: Back to an event opened before the band was narrowed left the
      // band narrow and the horizon field with it, Back to an entry made
      // before a lens was applied left the lens on, and `view` was not
      // restored at all, so the address bar stopped describing the screen
      // (B14, A6). Nothing is lost by taking the defaults instead: a push
      // writes every field that is not already its default.
      //
      // `restore` is where a narrative's derived selection, chain and window
      // are computed again (narrative-mode.js). The write afterwards
      // normalises the entry to what is now shown, so the next link the
      // reader copies is the picture they are looking at — the rule this
      // file opens with, which Back was the one thing breaking.
      //
      // The entry the reader has just left is gone; a write still owed for it
      // would land on the one they arrived at.
      drop();
      state = restore(parseState(win.location.search));
      const now = opening(state);
      if (at > 0 && sameOpening(trail[at - 1], now)) at -= 1;
      else if (at < trail.length - 1 && sameOpening(trail[at + 1], now)) at += 1;
      else { trail = [now]; at = 0; }
      writeNow(false);
      notify();
    });
  }
  return {
    get: () => state,
    // The generated walk this session is holding, or null. Read by the card,
    // which says on it that the atlas put this path together and the reader
    // did not (panel/event.js).
    walk: () => generated,
    // Setting one notifies, exactly as a state change does: nothing in the
    // state says a walk arrived, so the card would otherwise be drawn from a
    // key that cannot see it. The chain it draws is set separately and by
    // whoever asked for the walk — this does one thing.
    setWalk(walk) {
      generated = walk ?? null;
      notify();
    },
    clearWalk() {
      if (generated === null) return;
      generated = null;
      notify();
    },
    // What Back would return to and Forward go on to, as openings; null on
    // either side when there is nowhere to go. The panel names them.
    trail: () => ({
      back: at > 0 ? trail[at - 1] : null,
      forward: at < trail.length - 1 ? trail[at + 1] : null,
    }),
    set(patch) {
      const push = pushes(patch, state);
      // The horizon is a question asked about the record that is open — "what
      // did this lead to by 2000?" — so it belongs to that record and not to
      // the atlas. Opening a different one leaves the question behind:
      // otherwise a year asked about the war in Angola lights the downstream
      // of every event clicked afterwards, and clicking the sea clears the
      // selection but leaves `?horizon=2000` in the link. A patch that names
      // `horizon` itself is the reader asking again and wins.
      const leftBehind = 'selected' in patch && patch.selected !== state.selected && !('horizon' in patch);
      // And the link's card is left behind by any other card (M80), for the
      // same kind of reason: `?edge=` is a card about one link, and a reader
      // who clicks one of its two ends, or a place, or an actor, is asking for
      // that record instead. It is at the head of the panel's precedence, so a
      // patch that opened an event while a link was open would show the link's
      // card still and leave `?edge=` in every link the reader copied. A patch
      // that names `edge` itself is them asking for a link and wins — which is
      // what the graph's own click sends.
      const closedEdge = state.edge && !('edge' in patch)
        && OPENINGS.some((key) => key !== 'edge' && key in patch && patch[key] !== state[key]);
      const before = state;
      state = {
        ...state, ...patch, ...(leftBehind ? { horizon: null } : {}), ...(closedEdge ? { edge: null } : {}),
      };
      write(push, before);
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

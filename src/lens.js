// The lens: the events a set of records is involved in, everywhere at once.
//
// Filtering is not grouping and it is not selection. Selection dims — the
// events of the open actor are emphasised and the rest stay drawn, because
// the reader is still reading the whole map. A lens **removes**: with
// `?focus=actor:salazar` the map, the graph and the timeline hold Salazar's
// events, their direct neighbours drawn faintly, and nothing else. The two
// must read differently or neither means anything, which is why one fades and
// the other takes away.
//
// **Any number of foci, of any kind** (owner, 5 September: "we should be able
// to choose parent events, actors, timelines or others, or any number of these
// together, on the map, the graph or the timeline, and it should focus on the
// events associated with those, hiding what is in no way associated and
// showing direct connections dimmed"). `?focus=` is a comma-separated list of
// `kind:id`; the focus set is the union of what each focus keeps, and
// `&focusAll=1` makes it the intersection instead — "any of these" and "all of
// these" are different questions and a reader asking the second one is
// usually asking the harder one.
//
// Three sets come out and they are not the same set:
//
//   set    the events the foci name — drawn in full
//   near   their direct causes and consequences, one hop, in either
//          direction — drawn dimmed, because a neighbourhood with no edges
//          out of it looks like an atlas in which nothing else happened
//   shown  the two together, which is what a view draws at all
//
// Everything outside `shown` is hidden. The timeline may keep a density strip
// for it (review finding 28); the map and the graph draw nothing.
//
// Pure: the foci and the loaded topology in, sets of event ids out. Nothing
// here knows the DOM, and `lensView()` is the one place that asks the state.

// The pattern and the kinds are `vocab.js`'s, because `state.js` checks the
// same parameter against the same closed set and two definitions of one set
// drift (health review A, finding 28).
import { FOCUS, FOCUS_KINDS, FOCUS_NONE } from './vocab.js';
import { subgraph } from './graph.js';
import { narrativeEventIds, readingNarrative } from './narrative.js';

export { FOCUS_KINDS, FOCUS_NONE };

// "actor:salazar" → { kind: 'actor', id: 'salazar' }. Anything else is null,
// including a focus on a kind that has no lens; the URL is untrusted input
// like everything else that arrives from outside.
export function parseFocus(focus) {
  if (typeof focus !== 'string') return null;
  const m = FOCUS.exec(focus);
  return m ? { kind: m[1], id: m[2] } : null;
}

export function formatFocus(kind, id) {
  return `${kind}:${id}`;
}

// The whole parameter → a list. A malformed entry is dropped and the rest
// stand, the way `?layers=` and `?lanes=` already treat a list from outside:
// one typo in a shared link should not take the reader's whole lens away. The
// order is the reader's own and duplicates are dropped, so adding a focus
// twice is adding it once.
export function parseFoci(focus) {
  if (typeof focus !== 'string' || focus === '' || focus === FOCUS_NONE) return [];
  const seen = new Set();
  const foci = [];
  for (const part of focus.split(',')) {
    const parsed = parseFocus(part);
    if (!parsed || seen.has(part)) continue;
    seen.add(part);
    foci.push(parsed);
  }
  return foci;
}

export function formatFoci(foci) {
  return foci.map(({ kind, id }) => formatFocus(kind, id)).join(',');
}

// The events one focus keeps. `topology` is the atlas's own shape — active
// events, the edges by id, the sources index by id — so the browser passes
// the atlas and a test passes a handful of literals.
//
// A source's lens is built from that source's citer rows, including the
// dissenting ones: a book arguing *against* a link is still a book this link
// rests an argument on, and "show me everything this source touches" is the
// question the lens answers. Which citation is evidence and which is dissent
// is the source card's business, not the map's.
//
// Since H3b those rows are one file per source, fetched when a reader opens
// that source or asks for its lens (`atlas.citersOf`, `atlas.loadCiters`).
// Between the request and the answer the lens is empty rather than absent: an
// empty lens draws nothing and says so, where a null one would quietly draw
// the whole atlas and call it the source's. Whoever sets the focus is what
// asks for the file — `main.js` — and the views redraw when it lands.
//
// An `event:` focus is the event **and its parts**, all the way down: the
// brief calls it "a parent, its subtree; or any event, its neighbourhood", and
// the neighbourhood is the `near` ring every focus already gets. A leaf has no
// parts, so on the overwhelming majority of events this is the one-event lens
// it has always been; on a parent it is the answer to "show me only this war".
//
// Walked through `topology.childrenOf` — the other direction of `parent`,
// built once in `createAtlas` (data.js) — and never through the adjacency:
// `parent` is a display fact and not an argument (CLAUDE.md), so narrowing to
// a subtree changes which events are drawn and no consequence, cause or
// convergence. A visited set, because rule 24 refuses a cycle but a lens draws
// whatever is in the file: bad data should narrow the atlas, not hang it.
export function eventsOfFocus(focus, topology) {
  const parsed = typeof focus === 'string' ? parseFocus(focus) : focus;
  if (!parsed || !FOCUS_KINDS.includes(parsed.kind)) return null;
  const { kind, id } = parsed;
  const events = topology.activeEvents ?? [];
  const ids = new Set();
  // **An actor's events are the events on its ground, not only the ones that
  // name it** (M48 §2). Two rules, and the second is three: the actor is in
  // the event's `actors`, or the event's place is inside territory that actor
  // held at the event's date, or inside territory a *dependency* of it held
  // then. The last two are `grounds.js`, worked out against the presence
  // outlines at build time and read here as a lookup — selecting a polity must
  // not cost a point-in-polygon.
  //
  // The union and not a choice between them: an event can name Portugal and
  // happen in Lisbon, and an event in Lisbon that names nobody is still
  // Portugal's. An atlas whose grounds file has not landed answers null for
  // the second half and the lens is the first alone, which is what it was
  // before this milestone — a frame of the old picture, never a wrong one.
  if (kind === 'actor') {
    for (const event of events) {
      if ((event.actors ?? []).some((a) => a.actor === id)) ids.add(event.id);
    }
    const ground = topology.eventsOnGroundOf?.(id) ?? null;
    if (ground) {
      const active = new Set(events.map((e) => e.id));
      for (const event of ground) if (active.has(event)) ids.add(event);
    }
    return ids;
  }
  if (kind === 'place') {
    for (const event of events) if (event.place === id) ids.add(event.id);
    return ids;
  }
  if (kind === 'region') {
    for (const event of events) if (event.region === id) ids.add(event.id);
    return ids;
  }
  if (kind === 'event') {
    const event = topology.events?.get(id) ?? null;
    if (!event || event.status !== 'active') return ids;
    const queue = [event.id];
    while (queue.length) {
      const at = queue.pop();
      if (ids.has(at)) continue;
      ids.add(at);
      for (const child of topology.childrenOf?.get(at) ?? []) {
        // `childrenOf` is built from the active events alone, so this is a
        // guard for a topology written by hand in a test, not a case.
        if ((topology.events?.get(child)?.status ?? 'active') === 'active') queue.push(child);
      }
    }
    return ids;
  }
  if (kind === 'narrative') {
    const narrative = topology.narratives?.get(id) ?? null;
    if (!narrative || narrative.status !== 'active') return ids;
    const active = new Set(events.map((e) => e.id));
    for (const walked of narrativeEventIds(topology, narrative)) {
      if (active.has(walked)) ids.add(walked);
    }
    return ids;
  }
  // A source is cited by the event itself or by an edge at the event, and an
  // edge is at both of its ends.
  const active = new Set(events.map((e) => e.id));
  const source = topology.sources?.get(id) ?? null;
  const rows = topology.citersOf?.(id) ?? source?.citations ?? [];
  for (const citation of rows) {
    if (citation.kind === 'event') {
      if (active.has(citation.id)) ids.add(citation.id);
      continue;
    }
    if (citation.kind !== 'edge') continue;
    const edge = topology.edges?.get(citation.id);
    if (!edge || edge.status !== 'active') continue;
    if (active.has(edge.from)) ids.add(edge.from);
    if (active.has(edge.to)) ids.add(edge.to);
  }
  return ids;
}

// The one-focus form, kept because a caller that already holds one string
// should not have to build a list to ask about it: `search-box.js` asks what a
// source's own lens reaches, whatever lens is on.
export function lensFor(focus, topology) {
  return eventsOfFocus(focus, topology);
}

// The union of the foci, or their intersection when `all`. The intersection of
// nothing is nothing and not everything: with no foci there is no lens, and
// that is said by returning null above rather than by an empty set here.
export function focusSet(foci, topology, { all = false } = {}) {
  const sets = foci.map((focus) => eventsOfFocus(focus, topology)).filter(Boolean);
  if (sets.length === 0) return new Set();
  if (!all) {
    const union = new Set();
    for (const set of sets) for (const id of set) union.add(id);
    return union;
  }
  // From the smallest, because an intersection is at most as big as it and
  // this is walked once per focus otherwise.
  const [smallest, ...rest] = [...sets].sort((a, b) => a.size - b.size);
  const both = new Set();
  for (const id of smallest) if (rest.every((set) => set.has(id))) both.add(id);
  return both;
}

// The dimmed ring: everything one step out from the focus set, in either
// direction, minus the set itself. One depth of `subgraph` (graph.js), so
// that "what is next to this" has one answer in the atlas and not two.
export function ringOf(atlas, set) {
  const near = new Set();
  if (set.size === 0) return near;
  for (const event of subgraph(atlas, set, 1).events) {
    if (!set.has(event.id)) near.add(event.id);
  }
  return near;
}

// Which foci are on. The reader's own list, and — when they have not set one —
// the record whose card is open, as a lens of one.
//
// **Opening an actor or a place is opening its neighbourhood.** `?actor=angola`
// used to draw the whole atlas with nine marks emphasised in it, which is the
// answer to a question nobody asked: a reader who has opened Angola is reading
// about Angola. So with no `?focus=` at all, an open place or actor is the
// focus, until the reader adds another or clears it — and clearing it is what
// `?focus=none` is for, since an absent parameter is what asks for this lens.
//
// **Reading a narrative is a focus on that narrative.** It used to suspend the
// lens altogether, which is why a twelve-step argument was drawn over all 250
// events in the corpus and the card had to offer "Focus on this" so the reader
// could do by hand what the mode should have done. A walk is the most
// deliberate focus in the atlas — a person chose those events and put them in
// order — so it is one: the walk in full, its one hop of causes and
// consequences dimmed, and nothing else (M48 §1).
//
// Before the two cards below and after the explicit list: a reader reading a
// narrative has an event open at every step, and often a place or an actor
// behind it, and the walk is what they came for. `?focus=` they typed
// themselves still wins, and `?focus=none` still turns the whole thing off —
// while reading as everywhere else, since "no lens" is exactly what that word
// has always meant.
//
// A place before an actor, which is the precedence the panel already shows
// its cards in (state.js). A selected event does not take the lens away: the
// reader walking from a place's list is still inside that place's
// neighbourhood, and an atlas that opened up again on the first click would be
// flipping the picture under them.
// **An actor or a place with no events at all is not a lens.** 350 of the 412
// actors are polities imported with their borders and no event yet, and a lens
// on one of them drew a blank map and a blank timeline — the search's most
// common answer opened an empty atlas (health review of 6 September, R8). A
// focus the reader typed themselves still draws nothing and says so, which is
// what `?focus=` is for; this is only about the lens nobody asked for.
export function activeFoci(atlas, state) {
  if (state?.focus === FOCUS_NONE) return [];
  const explicit = parseFoci(state?.focus);
  if (explicit.length) return explicit;
  const narrative = readingNarrative(atlas, state);
  if (narrative) {
    const focus = { kind: 'narrative', id: narrative.id };
    // A walk whose steps are all actors, relations or presences passes through
    // no event at all, and a lens of nothing would hide the atlas to show a
    // card. The same rule the two cards below follow.
    return (eventsOfFocus(focus, atlas)?.size ?? 0) > 0 ? [focus] : [];
  }
  for (const [key, kind] of [['place', 'place'], ['actor', 'actor']]) {
    if (!state?.[key]) continue;
    const found = atlas.resolve?.(state[key]) ?? null;
    if (!found || found.kind !== kind) continue;
    const focus = { kind, id: found.id };
    return (eventsOfFocus(focus, atlas)?.size ?? 0) > 0 ? [focus] : [];
  }
  return [];
}

// Whether the lens on screen is one the reader set. An implicit lens keeps
// what the reader has just clicked (see `lensView`); an explicit one is a
// question they asked, and its answer is allowed to be narrow.
export function isImplicitLens(state) {
  return state?.focus !== FOCUS_NONE && parseFoci(state?.focus).length === 0;
}

// The events an implicit lens never removes: the open event, both ends of
// every walked step, and where the open event leads directly. Read straight
// from the atlas and the state, so that `lens.js` and `emphasis.js` cannot
// come to disagree about what is drawn.
export function keptRegardless(atlas, state) {
  const ids = new Set();
  if (state?.selected && atlas.events?.get(state.selected)?.status === 'active') {
    ids.add(state.selected);
    for (const edge of atlas.adjacency?.out.get(state.selected) ?? []) {
      ids.add(edge.from);
      ids.add(edge.to);
    }
  }
  for (const id of state?.chain ?? []) {
    const edge = atlas.edges?.get(id);
    if (!edge || edge.status !== 'active') break;
    ids.add(edge.from);
    ids.add(edge.to);
  }
  return ids;
}

// The lens the views apply, from the state:
// `{ foci, all, set, near, shown, implicit }`,
// or null for "no lens" — which is not the same as an empty set, since a focus
// that matches nothing draws nothing and says so.
//
// Reading a narrative *sets* the lens rather than suspending it (see
// `activeFoci`). It suspended it until M48, so that no step could vanish
// behind a lens the reader had left on; the walk being the lens answers that
// better than switching off did, because every step of it is in the focus set
// by construction and nothing can hide one.
//
// Answered once per state and not once per caller. `panel.js`, `grouping.js`,
// `arrangement.js`, `search-box.js` and `emphasis.js` all ask, several times
// each per render, and the ring is a walk of the graph. The store hands every
// subscriber the same state object and replaces it only in `set`, so that
// object is the key — weakly, so the state the reader has left takes its
// answer with it. The stamp beside it is for the one input that arrives *after*
// the state does: a source's citer rows are fetched when the focus asks for
// them (data.js), and an answer computed before they landed is not the answer.
const held = new WeakMap();

export function lensView(atlas, state) {
  const foci = activeFoci(atlas, state);
  if (foci.length === 0) return null;
  const all = Boolean(state?.focusAll);
  // A narrative's `steps` are an attribute and arrive with their century
  // (spine.js), so a walk is a second input that lands after the state does:
  // until it has, the narrative resolves and its walk is empty, which is the
  // atlas drawn whole for a frame rather than a lens on nothing. The count is
  // what says the shard came.
  // An actor's is the third: which events are on its ground is a file fetched
  // when a lens of that kind is first set (M48 §2, data.js), and the answer
  // before it lands is the `actors` list alone.
  const stamp = `${all}|${atlas.groundsLoaded?.() ? 1 : 0}|${foci.map((f) => {
    if (f.kind === 'source') return `${f.id}:${atlas.citersOf?.(f.id) ? 1 : 0}`;
    if (f.kind === 'narrative') return `${f.id}:${(atlas.narratives?.get(f.id)?.steps ?? []).length}`;
    return '';
  }).join(',')}`;
  const found = state ? held.get(state) : null;
  if (found && found.atlas === atlas && found.stamp === stamp) return found.value;
  const set = focusSet(foci, atlas, { all });
  const near = ringOf(atlas, set);
  const shown = new Set(set);
  for (const id of near) shown.add(id);
  // **What the reader has just clicked is associated by definition.** An
  // implicit lens is nobody's question, so it may not take away the event
  // whose card is open, the chain walked out of it, or where that event led:
  // two hops out of an actor and the selected event was in neither the focus
  // set nor the ring, and the card showed an event the pictures did not
  // (health review of 6 September, R8). An explicit `?focus=` is a question
  // and keeps its own narrow answer.
  const implicit = isImplicitLens(state);
  if (implicit) for (const id of keptRegardless(atlas, state)) shown.add(id);
  const value = {
    foci, all, set, near, shown, implicit,
  };
  if (state) held.set(state, { atlas, stamp, value });
  return value;
}

// What a view draws at all: the focus set and its dimmed ring. Null means "no
// lens", and the three views filter their event list by it exactly as they did
// when a lens was one record's events and nothing else.
export function lensSet(atlas, state) {
  return lensView(atlas, state)?.shown ?? null;
}

// The half of it that is drawn faintly. Empty rather than null when there is
// no lens: there is nothing to dim, and a caller asking "is this one dimmed"
// should not have to check twice.
export function lensNear(atlas, state) {
  return lensView(atlas, state)?.near ?? new Set();
}

// The events a view draws, in the order the atlas holds them.
export function shownEvents(atlas, state) {
  const lens = lensSet(atlas, state);
  return lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents;
}

// What the header calls one focus. The record's own name where it resolves,
// the bare id where it does not — a link to a record that has since been
// retracted still says what it was pointing at.
//
// Since I4 a record can resolve and still have no name yet: the core carries
// the ids and the shards carry the names, and the core's fallback for a missing
// name is the id itself. That is a third case and not the second — the record
// is there and this is a chip that has not been told what it is called — so it
// is `null` here and the header says it is loading rather than printing a slug
// a reader would take for a name (index2 review, finding 21). It becomes the
// name when the shard lands, which the header is redrawn for.
export function lensLabel(atlas, focus) {
  const parsed = typeof focus === 'string' ? parseFocus(focus) : focus;
  if (!parsed || !FOCUS_KINDS.includes(parsed.kind)) return null;
  const { kind, id } = parsed;
  const record = {
    actor: () => atlas.actors.get(id),
    place: () => atlas.places.get(id),
    source: () => atlas.sources.get(id),
    event: () => atlas.events.get(id),
    narrative: () => atlas.narratives?.get(id),
    // A region is not a record and is read off the manifest, so its label is
    // in hand from the first frame and there is nothing to wait for.
    region: () => atlas.regions?.find((r) => r.id === id),
  }[kind]?.();
  if (!record) return { kind, id, focus: formatFocus(kind, id), name: id };
  const named = record.name ?? record.title ?? record.label ?? id;
  // `?? true` for an atlas that has no shards to wait for: one built from the
  // spine, and the plain topology objects the tests hand this.
  const waiting = kind !== 'region' && kind !== 'source' && !(atlas.attributesLoaded?.(id) ?? true);
  return { kind, id, focus: formatFocus(kind, id), name: waiting ? null : named };
}

// One chip per focus, in the reader's own order. Empty when no lens is on.
export function lensLabels(atlas, state) {
  const view = lensView(atlas, state);
  if (!view) return [];
  return view.foci.map((focus) => lensLabel(atlas, focus)).filter(Boolean);
}

// ─── writing the parameter ─────────────────────────────────────────────────
//
// Four things a card or a chip does to the list, as pure functions over the
// parameter, so that every control writes it the same way and none of them
// has to know that it is a comma-separated string.
//
// `focus` may be `none`, which is a reader who turned the implicit lens off:
// adding to it starts a list rather than appending to the word.

// "Focus on this": add, keeping what is there. Already there is a no-op, so
// clicking twice is clicking once.
export function withFocus(focus, kind, id) {
  const one = formatFocus(kind, id);
  const foci = parseFoci(focus);
  if (foci.some((f) => formatFocus(f.kind, f.id) === one)) return formatFoci(foci);
  return formatFoci([...foci, { kind, id }]);
}

// A chip's ×. The last one removed leaves `none` and not an empty parameter:
// the reader has said what they want, and an absent parameter would put the
// implicit lens back on the card they still have open.
export function withoutFocus(focus, kind, id) {
  const one = formatFocus(kind, id);
  const rest = parseFoci(focus).filter((f) => formatFocus(f.kind, f.id) !== one);
  return rest.length ? formatFoci(rest) : FOCUS_NONE;
}

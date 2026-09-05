// The lens: only the events one record is involved in, everywhere at once.
//
// Filtering is not grouping and it is not selection. Selection dims — the
// events of the open actor are emphasised and the rest stay drawn, because
// the reader is still reading the whole map. A lens **removes**: with
// `?focus=actor:salazar` the map, the graph and the timeline hold Salazar's
// events and nothing else. The two must read differently or neither means
// anything, which is why one fades and the other takes away.
//
// Pure: a focus and the loaded topology in, a set of event ids out. Nothing
// here knows the DOM, and `lensSet()` is the one place that asks the state.

// The pattern and the three kinds are `vocab.js`'s, because `state.js` checks
// the same parameter against the same closed set and two definitions of one
// set drift (health review A, finding 28).
import { FOCUS, FOCUS_KINDS } from './vocab.js';

export { FOCUS_KINDS };

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

// The events a focus keeps. `topology` is the atlas's own shape — active
// events, the edges by id, the sources index by id — so the browser passes
// the atlas and a test passes three literals.
//
// A source's lens is built from the citations the index already carries
// (M10), including the dissenting ones: a book arguing *against* a link is
// still a book this link rests an argument on, and "show me everything this
// source touches" is the question the lens answers. Which citation is
// evidence and which is dissent is the source card's business, not the
// map's.
export function lensFor(focus, topology) {
  const parsed = parseFocus(focus);
  if (!parsed) return null;
  const { kind, id } = parsed;
  const events = topology.activeEvents ?? [];
  const ids = new Set();
  if (kind === 'actor') {
    for (const event of events) {
      if ((event.actors ?? []).some((a) => a.actor === id)) ids.add(event.id);
    }
    return ids;
  }
  if (kind === 'place') {
    for (const event of events) if (event.place === id) ids.add(event.id);
    return ids;
  }
  // A source is cited by the event itself or by an edge at the event, and an
  // edge is at both of its ends.
  const active = new Set(events.map((e) => e.id));
  const source = topology.sources?.get(id) ?? null;
  for (const citation of source?.citations ?? []) {
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

// The lens the views should apply, from the state. Null means "no lens", and
// is not the same as an empty set: a focus that matches nothing draws
// nothing, and says so.
//
// Reading a narrative suspends the lens. Reading is a mode and the walk is
// what the reader is looking at; a step that vanished because a lens was
// left on would be the atlas hiding the thing it was asked to show.
export function lensSet(atlas, state) {
  if (state.narrative) return null;
  return lensFor(state.focus, atlas);
}

// The events a view draws, in the order the atlas holds them.
export function shownEvents(atlas, state) {
  const lens = lensSet(atlas, state);
  return lens ? atlas.activeEvents.filter((e) => lens.has(e.id)) : atlas.activeEvents;
}

// What the header calls the lens. The record's own name where it resolves,
// the bare id where it does not — a link to a record that has since been
// retracted still says what it was pointing at.
export function lensLabel(atlas, focus) {
  const parsed = parseFocus(focus);
  if (!parsed) return null;
  const { kind, id } = parsed;
  if (kind === 'actor') return { kind, id, name: atlas.actors.get(id)?.name ?? id };
  if (kind === 'place') return { kind, id, name: atlas.places.get(id)?.name ?? id };
  return { kind, id, name: atlas.sources.get(id)?.title ?? id };
}

// Reading a narrative, as pure functions. `?narrative=<id>&step=<n>` is the
// whole of the state while a narrative is being read: which event is
// selected, which chain is drawn and where the window sits are *derived* from
// the step and never written to the URL, so a link to a narrative is a link
// to a place in an argument and not a snapshot of somebody's screen.
//
// Nothing here touches the DOM or the store. The mode that puts these
// answers into the state is narrative-mode.js; the card that draws them is
// panel/narrative.js.

import { bounds, toAstronomical } from './util/dates.js';

// What a step points at, resolved against the atlas rather than by pattern:
// the ids are the only authority on which is which, and a ref that resolves
// to nothing is drawn as a gap rather than crashing the walk.
//
// Through resolve() when the id is not one the atlas answers to directly, for
// the same reason readingNarrative does: a step written against a record's
// former id is still about that record, and a rename is allowed. A walk that
// broke the day somebody renamed one of the events in it would make renaming
// unusable (health review A, finding 20).
// Since H7 a step may also name an actor, a relation or a presence, so that a
// walk can say "and this is the body that did it" without inventing an event
// for it (health review B, finding 18). Those three carry no event of their
// own: `event` stays null, the views draw nothing new for the step, and the
// chain simply breaks there, which is what a step that is not a link already
// did. The record itself is on `record`, whatever the kind, so a card can draw
// it without knowing which of the five it is holding.
export function resolveRef(atlas, ref) {
  const gap = {
    ref, kind: null, event: null, edge: null, record: null,
  };
  if (typeof ref !== 'string') return gap;
  const edge = atlas.edges.get(ref);
  if (edge) return { ref, kind: 'edge', edge, event: atlas.events.get(edge.to) ?? null, record: edge };
  const event = atlas.events.get(ref);
  if (event) return { ref, kind: 'event', edge: null, event, record: event };
  const relation = atlas.relations?.get(ref) ?? null;
  if (relation) return { ...gap, kind: 'relation', record: relation };
  const actor = atlas.actors?.get(ref) ?? null;
  if (actor) return { ...gap, kind: 'actor', record: actor };
  const presence = atlas.presences?.get(ref) ?? null;
  if (presence) return { ...gap, kind: 'presence', record: presence };
  // Through resolve() last, so a step written against a record's former id is
  // still about that record and a rename stays possible (A20). It answers for
  // the kinds the atlas indexes by id; a relation and a presence are not among
  // them and are looked up above.
  const stood = atlas.resolve?.(ref) ?? null;
  if (stood?.kind === 'edge') return { ref, kind: 'edge', edge: stood.record, event: atlas.events.get(stood.record.to) ?? null, record: stood.record };
  if (stood?.kind === 'event') return { ref, kind: 'event', edge: null, event: stood.record, record: stood.record };
  if (stood?.kind === 'actor') return { ...gap, kind: 'actor', record: stood.record };
  return gap;
}

export function narrativeSteps(atlas, narrative) {
  return (narrative?.steps ?? []).map((step) => resolveRef(atlas, step.ref));
}

// A step index that is always inside the walk. An empty narrative has no
// step to be at, and 0 is the honest answer for it.
export function clampStep(narrative, index) {
  const last = Math.max(0, (narrative?.steps ?? []).length - 1);
  if (!Number.isInteger(index) || index < 0) return 0;
  return Math.min(index, last);
}

// The chain the views draw at a step: the longest contiguous run of edges
// ending here. A step that is an event, or an edge that does not start where
// the one before it ended, simply breaks the run — a narrative may jump, and
// a jump is not a causal path.
export function chainAt(atlas, narrative, index) {
  const steps = narrativeSteps(atlas, narrative);
  const chain = [];
  for (let i = index; i >= 0; i -= 1) {
    const step = steps[i];
    if (!step || step.kind !== 'edge') break;
    if (chain.length && chain[0].from !== step.edge.to) break;
    chain.unshift(step.edge);
  }
  return chain.map((edge) => edge.id);
}

// The window, widened to hold a year it does not already reach. A null bound
// is the data's own and already reaches everything, so it stays null.
function widen(window, from, to) {
  const inside = (bound, year) => bound === null || toAstronomical(bound) <= toAstronomical(year);
  return {
    from: inside(window.from, from) ? window.from : from,
    to: window.to === null || toAstronomical(window.to) >= toAstronomical(to) ? window.to : to,
  };
}

// The years an event covers, in historians' numbering: its start, and its end
// when it has one.
function eventSpan(event) {
  const start = bounds(event.when.start).min;
  return { from: start, to: event.when.end === null ? start : bounds(event.when.end).max };
}

// Everything the views need at one step of one narrative, given the window
// they are already looking at. The step is clamped, so a step number out of
// a shared link opens at the nearest end of the walk rather than at nothing.
export function stepState(atlas, narrative, index, window = { from: null, to: null }) {
  const step = clampStep(narrative, index);
  const resolved = narrativeSteps(atlas, narrative)[step] ?? null;
  const selected = resolved?.event?.id ?? null;
  const chain = chainAt(atlas, narrative, step);
  let slid = { from: window.from ?? null, to: window.to ?? null };
  if (resolved?.event) {
    const span = eventSpan(resolved.event);
    slid = widen(slid, span.from, span.to);
  }
  return { step, selected, chain, from: slid.from, to: slid.to };
}

// The window a narrative opens on: its own, when it declares one, otherwise
// the window that was already there.
export function openingWindow(narrative, window = { from: null, to: null }) {
  const own = narrative?.window ?? null;
  if (!own) return { from: window.from ?? null, to: window.to ?? null };
  return { from: own.from, to: own.to };
}

// Every event the whole walk passes through, so the views can show where the
// narrative is going and not only where the reader has got to.
export function narrativeEventIds(atlas, narrative) {
  const ids = new Set();
  for (const step of narrativeSteps(atlas, narrative)) {
    if (step.kind === 'edge') {
      ids.add(step.edge.from);
      ids.add(step.edge.to);
    } else if (step.event) {
      ids.add(step.event.id);
    }
  }
  return ids;
}

// The narrative being read, when the state names one that exists. Through
// resolve(), so a former id in a shared link still opens.
export function readingNarrative(atlas, state) {
  if (!state?.narrative) return null;
  const found = atlas.resolve(state.narrative);
  return found && found.kind === 'narrative' ? found.record : null;
}

// The set the views emphasise: empty unless a narrative is open, so nothing
// is lit that the reader has not asked for.
export function narrativeSet(atlas, state) {
  const narrative = readingNarrative(atlas, state);
  return narrative ? narrativeEventIds(atlas, narrative) : null;
}

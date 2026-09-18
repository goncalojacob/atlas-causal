// Reading mode, as a wrapper around the state store.
//
// While a narrative is open, `narrative` and `step` are authoritative and
// everything the views draw from — the selection, the chain, the window — is
// derived from them by narrative.js. This file is the only place that
// derivation is applied, so nothing else has to know that the state it is
// reading was computed rather than chosen.
//
// Entering remembers what it replaced, in memory and never in the URL;
// leaving puts it back. A reader who clicks a mark on the map instead of
// pressing "next" has left the narrative by doing something else, and keeps
// what they clicked rather than being pulled back to where they started.

import { openingWindow, readingNarrative, stepState } from './narrative.js';

// What reading mode takes over and therefore what it gives back.
const OWNED = Object.freeze(['selected', 'chain', 'from', 'to']);
// A patch touching any of these is the reader doing something else: the
// narrative closes and what they asked for stands.
const LEAVES = Object.freeze(['selected', 'chain', 'place', 'actor', 'source']);

const pick = (state, keys) => Object.fromEntries(keys.map((key) => [key, state[key]]));

// The derived half of the state at a step, given the window to slide from.
function derived(atlas, state, window) {
  const narrative = readingNarrative(atlas, state);
  if (!narrative) return null;
  return stepState(atlas, narrative, state.step, window);
}

// The state a URL that names a narrative opens on: the walk's own window,
// then the first step's. Used once, at load, before the views exist.
export function openingState(atlas, state) {
  const narrative = readingNarrative(atlas, state);
  if (!narrative) return state;
  return { ...state, ...stepState(atlas, narrative, state.step, openingWindow(narrative, state)) };
}

export function createReadingMode(store, atlas) {
  let remembered = null;

  function set(patch) {
    const current = store.get();
    const next = { ...current, ...patch };
    const moving = 'narrative' in patch || 'step' in patch;

    if (moving && next.narrative) {
      const narrative = readingNarrative(atlas, next);
      // A narrative that does not resolve is not a mode to be in: the id
      // stands in the URL and the panel says it found nothing.
      if (!narrative) return store.set(patch);
      const entering = !current.narrative;
      if (entering) remembered = pick(current, OWNED);
      // Entering, or moving to another narrative, opens on that narrative's
      // own window; stepping within one slides the window the reader has.
      const base = current.narrative === next.narrative ? next : openingWindow(narrative, next);
      return store.set({ ...patch, ...derived(atlas, next, base) });
    }

    if (moving && !next.narrative) {
      const restore = remembered ?? { selected: null, chain: [] };
      remembered = null;
      return store.set({ ...restore, ...patch, narrative: null, step: 0 });
    }

    if (current.narrative && LEAVES.some((key) => key in patch)) {
      remembered = null;
      return store.set({ ...patch, narrative: null, step: 0 });
    }

    return store.set(patch);
  }

  // The generated walk passes straight through: it is the session's and not
  // the narrative's, and reading mode owns `selected`, `chain`, `from` and
  // `to` and nothing else. Everything downstream is given this wrapper rather
  // than the store (main.js), so a walk it did not forward would be a walk the
  // card could not see.
  return {
    get: store.get,
    subscribe: store.subscribe,
    trail: store.trail,
    walk: store.walk,
    setWalk: store.setWalk,
    clearWalk: store.clearWalk,
    set,
  };
}

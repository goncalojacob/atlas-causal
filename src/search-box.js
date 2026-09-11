// The search box in the header: an input, a list under it, and the keys that
// make it usable without a mouse. The matching is search.js; this file only
// draws its results and turns a choice into a state change.
//
// Choosing an event that is outside the window widens the window to include
// it, the same way "map at 1911" in the panel does — otherwise the atlas
// would select a record and then not draw it. An event the window already
// holds moves nothing: the band is the reader's, and a search is a question
// about a record rather than an instruction to look elsewhere.
//
// A lens does not narrow the search. What is outside it is still found and
// still listed, and is marked as being outside: a reader who has asked for
// Salazar's events and then searches for something else has asked a
// question, and answering "nothing by that name" when the record is right
// there would be a lie the lens told on the atlas's behalf.

import { esc } from './util/esc.js';
import { buildSearchIndex, search, flatten } from './search.js';
import { formatInterval } from './util/dates.js';
import { containsYear, windowAt } from './util/window.js';
import { lensFor, lensSet } from './lens.js';
import { ENTRY_KINDS, createLinks } from './entry/entry.js';

const LIMIT = 8;

const KIND_LABEL = Object.freeze({
  event: 'Events', actor: 'Actors', place: 'Places', source: 'Sources', office: 'Offices',
});

// `shard` is the search index the build already folded (h3a-brief, A9),
// given as a promise: the box is wired at once and answers as soon as the
// file lands, because nothing on the page is drawn out of it. A shard that
// does not arrive is not a search box that never works — the same index is
// built from the atlas instead, which is what every page did before H3b.
export function createSearchBox(container, { atlas, state, fixtures = false, shard = null }) {
  const links = createLinks({ fixtures });
  const fromAtlas = () => buildSearchIndex({
    events: atlas.activeEvents,
    actors: [...atlas.actors.values()],
    places: [...atlas.places.values()],
    sources: [...atlas.sources.values()],
    offices: [...atlas.offices.values()],
  });
  // Null until the shard lands: an empty list would answer "nothing by that
  // name" about records that are right there, which is the one thing this box
  // must never say (search.js). A query typed before then is held and run the
  // moment the index exists.
  let entries = shard ? null : fromAtlas();
  const input = container.querySelector('input[type="search"]');
  const list = container.querySelector('[data-slot="results"]');
  const status = container.querySelector('[data-slot="count"]');
  if (!input || !list || !status) return { close: () => {} };

  let result = { groups: [], total: 0 };
  let items = [];
  let active = -1;

  // Whether a result reaches anything the lens keeps. An event is in it or
  // it is not; an actor, a place or a source is outside only when *none* of
  // the events it would open is shown, since opening it inside a lens is
  // still a useful thing to do.
  function outside(item) {
    const lens = lensSet(atlas, state.get());
    if (!lens) return false;
    if (item.kind === 'event') return !lens.has(item.id);
    if (item.kind === 'actor') {
      return !(atlas.eventsByActor.get(item.id) ?? []).some((a) => lens.has(a.event.id));
    }
    if (item.kind === 'place') {
      return !(atlas.eventsByPlace.get(item.id) ?? []).some((e) => lens.has(e.id));
    }
    // An office is left alone: a lens is about which events are drawn, and an
    // office is a post rather than a set of them. Marking it "outside the
    // lens" would be answering a question nobody asked of it.
    if (item.kind === 'office') return false;
    // A source's own lens, intersected with the one that is on: which of the
    // events this book touches are still drawn.
    const reached = lensFor(`source:${item.id}`, atlas);
    for (const id of reached ?? []) if (lens.has(id)) return false;
    return true;
  }

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    active = -1;
    status.textContent = '';
  };

  function draw() {
    items = flatten(result);
    if (items.length === 0) {
      list.innerHTML = result.query
        ? '<li class="search-empty" role="presentation">Nothing by that name.</li>'
        : '';
      list.hidden = !result.query;
      input.setAttribute('aria-expanded', String(Boolean(result.query)));
      status.textContent = result.query ? 'no matches' : '';
      active = -1;
      return;
    }
    let i = 0;
    const html = result.groups.map((group) => {
      const rows = group.items.map((item) => {
        const when = item.when ? formatInterval(item.when) : '';
        const also = item.variants?.length ? `<span class="muted">${esc(item.variants.slice(0, 2).join(' · '))}</span>` : '';
        const id = `search-option-${i}`;
        const out = outside(item);
        const row = `<li class="search-option${out ? ' outside-lens' : ''}" role="option" id="${id}" data-index="${i}" data-kind="${esc(item.kind)}" data-id="${esc(item.id)}" aria-selected="false">
          <span class="search-label">${esc(item.label)}</span>
          <span class="when">${esc(when)}</span>
          ${item.detail ? `<span class="muted">${esc(item.detail)}</span>` : ''}${also}
          ${out ? '<span class="badge outside">outside the lens</span>' : ''}
          ${ENTRY_KINDS.includes(item.kind) ? `<a class="search-entry" href="${esc(links.entry(item.kind, item.id))}" tabindex="-1" title="Read the full entry, on a page of its own">entry ↗</a>` : ''}
        </li>`;
        i += 1;
        return row;
      }).join('');
      return `<li class="search-group" role="presentation">${esc(KIND_LABEL[group.kind] ?? group.kind)}</li>${rows}`;
    }).join('');
    list.innerHTML = html;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = `${result.total} match${result.total === 1 ? '' : 'es'}`;
    setActive(0);
  }

  function setActive(index) {
    active = Math.max(0, Math.min(index, items.length - 1));
    for (const el of list.querySelectorAll('[role="option"]')) {
      const on = Number(el.dataset.index) === active;
      el.setAttribute('aria-selected', String(on));
      el.classList.toggle('active', on);
      if (on) {
        input.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView?.({ block: 'nearest' });
      }
    }
  }

  function choose(item) {
    if (!item) return;
    if (item.kind === 'actor') {
      state.set({ actor: item.id, selected: null, chain: [] });
    } else if (item.kind === 'place') {
      state.set({ place: item.id, selected: null, chain: [] });
    } else if (item.kind === 'source') {
      state.set({ source: item.id, selected: null, chain: [] });
    } else if (item.kind === 'office') {
      state.set({ office: item.id, selected: null, chain: [] });
    } else {
      // Widen to include it, then select — but only when it is not already
      // in the window. Widening unasked is how the first thing a reader does
      // used to end with 79 of 137 bars faded and the consequences they were
      // about to follow drawn as outside the window: choosing a record is not
      // asking for the band to move. "Map at Y" in the panel still moves it,
      // and `windowAt` is still that control.
      const event = atlas.events.get(item.id);
      const year = event ? bounds(event) : null;
      const now = state.get();
      const moved = year === null || containsYear(now, year) ? {} : windowAt(now, year);
      state.set({ ...moved, selected: item.id, chain: [] });
    }
    input.value = '';
    result = { groups: [], total: 0, query: '' };
    close();
    input.blur();
  }

  // The first year of an event's interval, in historians' numbering, which is
  // what the window is written in.
  function bounds(event) {
    const start = event.when?.start;
    if (Number.isInteger(start)) return start;
    if (Number.isInteger(start?.min)) return start.min;
    return null;
  }

  // The scan runs a moment after the last key rather than on every one of
  // them (health review A, finding 19). It is fast enough now that a reader
  // will not see the wait — a hundred and twenty milliseconds is under what
  // it takes to reach for the next letter — and what it buys is that a burst
  // of typing, a paste, or a held-down key is one scan and not eight. The
  // grace is the same as the one a blur already waits out, so the box has one
  // number and not two.
  const GRACE = 120;
  let pending = null;
  const cancel = () => {
    if (pending === null) return;
    clearTimeout(pending);
    pending = null;
  };
  const run = () => {
    cancel();
    if (entries === null) return;
    result = search(entries, input.value, { limit: LIMIT });
    draw();
  };
  const runSoon = () => {
    cancel();
    pending = setTimeout(run, GRACE);
  };
  input.addEventListener('input', runSoon);

  // The shard, when it arrives — or the atlas, if it never does. Either way
  // whatever is in the box is answered at once, so a reader who typed while
  // it was in the air is not left looking at nothing.
  if (shard) {
    shard.then(
      (list) => { entries = list.length ? list : fromAtlas(); },
      () => { entries = fromAtlas(); },
    ).then(() => { if (input.value) run(); });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancel();
      input.value = '';
      result = { groups: [], total: 0, query: '' };
      list.innerHTML = '';
      close();
      return;
    }
    // Enter is the reader saying they have finished typing, so the scan they
    // are waiting on happens now: without this, a reader who types and hits
    // Enter inside the grace would be pressing Enter on an empty list.
    if (e.key === 'Enter' && pending !== null) run();
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(items[active]);
    }
  });

  list.addEventListener('mousedown', (e) => {
    // mousedown, not click: the blur that a click would fire first closes the
    // list out from under it.
    // The one link in a row goes to a page of its own; everything else in it
    // chooses the record inside the atlas.
    if (e.target.closest('a')) return;
    const option = e.target.closest('[role="option"]');
    if (!option) return;
    e.preventDefault();
    choose(items[Number(option.dataset.index)]);
  });

  input.addEventListener('blur', () => {
    // A frame's grace, so a click on a result still lands. A scan the reader
    // has walked away from is dropped rather than drawn into a closed list.
    cancel();
    setTimeout(close, GRACE);
  });
  input.addEventListener('focus', () => {
    if (result.query && items.length) draw();
  });

  // "/" focuses the box from anywhere, unless the reader is already typing.
  const onKey = (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.isContentEditable) return;
    e.preventDefault();
    input.focus();
    input.select();
  };
  document.addEventListener('keydown', onKey);

  // `search` is for whatever drives the box from outside — a test, a link
  // that arrives with a query — and answers at once rather than waiting the
  // grace out: nothing is typing, so there is nothing to coalesce.
  return { close, search: (text) => { input.value = text; run(); } };
}

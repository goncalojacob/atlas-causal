// The search box in the header: an input, a list under it, and the keys that
// make it usable without a mouse. The matching is search.js; this file only
// draws its results and turns a choice into a state change.
//
// Choosing an event that is outside the window widens the window to include
// it, the same way "map at 1911" in the panel does — otherwise the atlas
// would select a record and then not draw it.

import { esc } from './util/esc.js';
import { buildSearchIndex, search, flatten } from './search.js';
import { formatInterval } from './util/dates.js';
import { windowAt } from './util/window.js';

const LIMIT = 8;

const KIND_LABEL = Object.freeze({ event: 'Events', actor: 'Actors', place: 'Places' });

export function createSearchBox(container, { atlas, state }) {
  const entries = buildSearchIndex({
    events: atlas.activeEvents,
    actors: [...atlas.actors.values()],
    places: [...atlas.places.values()],
  });
  const input = container.querySelector('input[type="search"]');
  const list = container.querySelector('[data-slot="results"]');
  const status = container.querySelector('[data-slot="count"]');
  if (!input || !list || !status) return { close: () => {} };

  let result = { groups: [], total: 0 };
  let items = [];
  let active = -1;

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
        const row = `<li class="search-option" role="option" id="${id}" data-index="${i}" data-kind="${esc(item.kind)}" data-id="${esc(item.id)}" aria-selected="false">
          <span class="search-label">${esc(item.label)}</span>
          <span class="when">${esc(when)}</span>
          ${item.detail ? `<span class="muted">${esc(item.detail)}</span>` : ''}${also}
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
    } else {
      // Widen to include it, then select: the same rule as every other "map
      // at Y" in the atlas.
      const event = atlas.events.get(item.id);
      const year = event ? bounds(event) : null;
      const moved = year === null ? {} : windowAt(state.get(), year);
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

  input.addEventListener('input', () => {
    result = search(entries, input.value, { limit: LIMIT });
    draw();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      result = { groups: [], total: 0, query: '' };
      list.innerHTML = '';
      close();
      return;
    }
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
    const option = e.target.closest('[role="option"]');
    if (!option) return;
    e.preventDefault();
    choose(items[Number(option.dataset.index)]);
  });

  input.addEventListener('blur', () => {
    // A frame's grace, so a click on a result still lands.
    setTimeout(close, 120);
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

  return { close, search: (text) => { input.value = text; input.dispatchEvent(new Event('input')); } };
}

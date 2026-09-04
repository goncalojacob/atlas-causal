// The grouping picker in the header, beside Map | Graph, and the badge that
// says which lens is on.
//
// Keyboard first, because it is a list that can be reordered and a mouse is
// the one way of reordering a list that a keyboard cannot imitate. Every
// control here is a real one — a `select`, checkboxes, buttons — so Tab,
// Space and Enter work without a line of code, and the two things that are
// not ordinary are handled: Escape closes the panel and returns the focus to
// the button that opened it, and ↑/↓ on a lane's row move that lane rather
// than the cursor, with the focus following the row it moved.
//
// What it writes is `group` and `lanes` in the state, nothing else. Choosing
// an actor or a place anywhere else in the atlas never changes the grouping:
// reading about Salazar is not the same as asking for a lane per actor, and
// an interface that guessed would take the picture away from the reader
// every time they clicked a name.

import { html } from './util/dom.js';
import { esc } from './util/esc.js';
import { availableLanes, LANE_CAP } from './lanes.js';
import { lensSet, lensLabel } from './lens.js';
import { resolveWindow } from './util/window.js';

const GROUP_LABEL = Object.freeze({
  none: 'no grouping',
  actor: 'one lane per actor',
  place: 'one lane per place',
  region: 'one lane per region',
});

const LENS_KIND = Object.freeze({ actor: 'actor', place: 'place', source: 'source' });

// Long lists get a box to search them; short ones do not need one and the
// box would be one more thing between the reader and the list.
const SEARCH_FROM = 8;

function fold(text) {
  return String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function createGrouping(container, { atlas, state }) {
  const button = html('button', { type: 'button', class: 'grouping-button', 'aria-expanded': 'false', 'aria-controls': 'grouping-panel' });
  const panel = html('div', { class: 'grouping-panel', id: 'grouping-panel', hidden: 'hidden', role: 'group', 'aria-label': 'Grouping' });
  const badge = html('span', { class: 'lens-badge', hidden: 'hidden' });
  container.append(button, panel, badge);

  let open = false;
  let filter = '';

  const setOpen = (value) => {
    open = value;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) draw();
  };

  button.addEventListener('click', () => setOpen(!open));

  // A click outside closes it, as a menu does; a click inside must not, or
  // every checkbox would close the panel it lives in.
  document.addEventListener('click', (e) => {
    if (!open || container.contains(e.target)) return;
    setOpen(false);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    setOpen(false);
    button.focus();
  });

  // The lanes the reader has chosen, in their order, followed by everything
  // else the window offers. Choosing is a checkbox; the order is the arrows.
  function rows(s) {
    const available = availableLanes(s.group, atlas, resolveWindow(s, atlas.extent), lensSet(atlas, s));
    const byId = new Map(available.map((a) => [a.id, a]));
    const chosen = s.lanes.filter((id) => byId.has(id));
    const rest = available.filter((a) => !chosen.includes(a.id));
    const list = [
      ...chosen.map((id) => ({ ...byId.get(id), on: true })),
      // Without an explicit list the automatic twelve are the ones ticked,
      // so opening the picker shows what is on screen rather than nothing.
      ...rest.map((a, i) => ({ ...a, on: chosen.length === 0 && i < LANE_CAP })),
    ];
    if (!filter) return list;
    const q = fold(filter);
    return list.filter((row) => fold(row.label).includes(q) || row.id.includes(q));
  }

  function draw() {
    const s = state.get();
    const groupable = s.group === 'actor' || s.group === 'place';
    const list = groupable ? rows(s) : [];
    const showSearch = groupable && (filter !== '' || list.length >= SEARCH_FROM);
    panel.innerHTML = `
      <label class="grouping-choice">Group by
        <select data-grouping>
          ${Object.entries(GROUP_LABEL).map(([id, label]) => `<option value="${esc(id)}"${id === s.group ? ' selected' : ''}>${esc(label)}</option>`).join('')}
        </select>
      </label>
      ${groupable ? `
        <p class="hint">The twelve with the most events in the window, unless you choose.
          An event is drawn in one lane only: the heaviest of its ${s.group === 'actor' ? 'actors' : 'places'} among these.</p>
        ${showSearch ? `<input type="search" class="grouping-search" data-lane-search placeholder="Filter lanes" value="${esc(filter)}" autocomplete="off" spellcheck="false" aria-label="Filter lanes">` : ''}
        <ul class="grouping-lanes" role="list">
          ${list.map((row, i) => `<li class="grouping-lane${row.on ? ' on' : ''}">
            <label><input type="checkbox" data-lane="${esc(row.id)}"${row.on ? ' checked' : ''}> ${esc(row.label)}</label>
            <span class="count">${row.count}</span>
            <button type="button" class="link small" data-move="up" data-lane="${esc(row.id)}"${i === 0 ? ' disabled' : ''} aria-label="Move ${esc(row.label)} up">↑</button>
            <button type="button" class="link small" data-move="down" data-lane="${esc(row.id)}"${i === list.length - 1 ? ' disabled' : ''} aria-label="Move ${esc(row.label)} down">↓</button>
          </li>`).join('')}
        </ul>
        ${list.length === 0 ? '<p class="muted">Nothing in this window to group by.</p>' : ''}
        <p class="actions"><button type="button" data-lanes-clear${s.lanes.length ? '' : ' disabled'}>Back to the automatic twelve</button></p>
      ` : '<p class="hint">Without a grouping the timeline packs the bars into rows and the graph drops its bands.</p>'}
    `;
    const search = panel.querySelector('[data-lane-search]');
    if (search && filter) {
      search.focus();
      search.setSelectionRange(filter.length, filter.length);
    }
  }

  // The explicit list the reader is editing. Empty means automatic, and the
  // first tick or the first move has to turn the automatic twelve into a
  // list before it can change it — otherwise unticking one of twelve
  // lanes nobody had chosen would silently choose the other eleven wrong.
  function currentList(s) {
    if (s.lanes.length) return s.lanes.filter(Boolean);
    return rows({ ...s, lanes: [] }).filter((row) => row.on).map((row) => row.id);
  }

  panel.addEventListener('change', (e) => {
    const s = state.get();
    const select = e.target.closest('[data-grouping]');
    if (select) {
      // A new grouping is a new vocabulary of lanes: an actor's list would
      // name nothing among places.
      filter = '';
      state.set({ group: select.value, lanes: [] });
      return;
    }
    const box = e.target.closest('[data-lane]');
    if (!box || box.type !== 'checkbox') return;
    const list = currentList(s);
    const next = box.checked
      ? (list.includes(box.dataset.lane) ? list : [...list, box.dataset.lane])
      : list.filter((id) => id !== box.dataset.lane);
    state.set({ lanes: next });
  });

  panel.addEventListener('input', (e) => {
    if (!e.target.closest('[data-lane-search]')) return;
    filter = e.target.value;
    draw();
  });

  panel.addEventListener('click', (e) => {
    const s = state.get();
    if (e.target.closest('[data-lanes-clear]')) {
      state.set({ lanes: [] });
      return;
    }
    const move = e.target.closest('[data-move]');
    if (!move) return;
    const list = currentList(s);
    const at = list.indexOf(move.dataset.lane);
    const to = at + (move.dataset.move === 'up' ? -1 : 1);
    if (at < 0 || to < 0 || to >= list.length) return;
    const next = [...list];
    [next[at], next[to]] = [next[to], next[at]];
    state.set({ lanes: next });
    // The focus follows the row it moved, or a reader holding ↑ would be
    // moving whatever happened to land under their finger next.
    queueMicrotask(() => panel.querySelector(`[data-move="${move.dataset.move}"][data-lane="${CSS.escape(move.dataset.lane)}"]`)?.focus());
  });

  // ↑ and ↓ on a lane's row move the lane. The buttons do the same thing and
  // are what a screen reader announces; this is for the hands already there.
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const row = e.target.closest?.('.grouping-lane');
    const box = row?.querySelector('[data-lane]');
    if (!row || !box || e.target.matches('[data-lane-search]')) return;
    e.preventDefault();
    row.querySelector(`[data-move="${e.key === 'ArrowUp' ? 'up' : 'down'}"]`)?.click();
  });

  function render(s) {
    const lens = lensLabel(atlas, s.focus);
    button.textContent = s.lanes.length && s.group !== 'none'
      ? `${GROUP_LABEL[s.group]} · ${s.lanes.length} chosen`
      : GROUP_LABEL[s.group] ?? GROUP_LABEL.none;
    button.setAttribute('title', 'What the timeline\'s lanes and the graph\'s bands are');
    // The badge is the header's account of the lens: what is on, and the way
    // out of it. A lens the reader cannot see they are inside would make the
    // atlas look like it had lost half its records.
    badge.hidden = !lens;
    badge.innerHTML = lens
      ? `<span class="lens-kind">${esc(LENS_KIND[lens.kind] ?? lens.kind)}</span>
         <span class="lens-name">${esc(lens.name)}</span>
         <button type="button" class="link small" data-action="clear-focus">show everything</button>`
      : '';
    if (open) draw();
  }

  // The badge's own button, since it is drawn here and not by the panel.
  container.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="clear-focus"]')) state.set({ focus: null });
  });

  state.subscribe(render);
  render(state.get());
  return { render, open: () => setOpen(true), close: () => setOpen(false) };
}

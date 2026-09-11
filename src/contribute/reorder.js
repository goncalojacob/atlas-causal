// Moving one row of an ordered list up or down, in the two places a
// narrative's steps are edited: the contribution form and the review
// dashboard's editor. The order of the steps is the walk, so this is an edit
// to the record and not a convenience.
//
// What moves is the row itself and not a redrawn list: the `<li>` is put
// before or after its neighbour and the array is reordered to match. A rebuilt
// list would throw away the selects, the textareas, whatever was half typed
// into one, and the focus — and the reader who pressed the button would lose
// the row they were working on. The arithmetic is `moveItem` in bundle.js,
// pure and tested there.

import { moveItem, canMove } from './bundle.js';
import { html } from '../util/dom.js';

// Alt and an arrow, so it works from inside the textarea a step's text is
// being typed into: the arrows alone are how you move the cursor through it.
export const MOVE_KEYS = Object.freeze({ ArrowUp: -1, ArrowDown: 1 });

export function moveKey(event) {
  if (!event?.altKey || event.ctrlKey || event.metaKey) return 0;
  return MOVE_KEYS[event.key] ?? 0;
}

// One row's up/down controls. `items()` returns the live array — the form and
// the editor each keep their own and neither hands out a reference that
// survives a removal — and `onMove` is what redraws whatever watches the
// order, which in both places is the preview of what will be written.
export function reorderControls({ rows, row, item, items, onMove = () => {}, what = 'step' }) {
  const up = html('button', { type: 'button', class: 'link small move-up', title: `move this ${what} up (Alt+↑)` }, '↑');
  const down = html('button', { type: 'button', class: 'link small move-down', title: `move this ${what} down (Alt+↓)` }, '↓');
  const controls = html('span', { class: 'row-move' });
  controls.append(up, down);

  const move = (delta) => {
    const list = items();
    const at = list.indexOf(item);
    if (!canMove(list, at, delta)) return false;
    // The array first, then the row, so the two say the same thing at every
    // point a listener could look.
    const ordered = moveItem(list, at, delta);
    list.splice(0, list.length, ...ordered);
    if (delta < 0) rows.insertBefore(row, row.previousElementSibling);
    else rows.insertBefore(row.nextElementSibling, row);
    refreshAll(rows, items);
    onMove(delta);
    return true;
  };

  up.addEventListener('click', () => { move(-1); up.focus(); });
  down.addEventListener('click', () => { move(1); down.focus(); });
  // From anywhere in the row, so a step being written can be moved without
  // reaching for the buttons.
  row.addEventListener('keydown', (e) => {
    const delta = moveKey(e);
    if (delta === 0) return;
    e.preventDefault();
    move(delta);
  });

  return controls;
}

// The ends of the list have nowhere to go, and the buttons there say so.
// Called after every move and after every add or remove, because both change
// which rows are the ends.
export function refreshAll(rows, items) {
  const list = items();
  const all = [...rows.children];
  all.forEach((row, at) => {
    const up = row.querySelector('.move-up');
    const down = row.querySelector('.move-down');
    if (up) up.disabled = !canMove(list, at, -1);
    if (down) down.disabled = !canMove(list, at, 1);
  });
}

// A list of any length, with only the rows that are on screen in the DOM.
//
// The review dashboard drew every row of the queue, and redrew every one of
// them on every keystroke in the search box and on every filter click: 30,543
// rows and 461 ms a key at twenty thousand drafts, five and a half seconds to
// first paint (health review B, finding 7). None of that work is seen — a
// queue pane shows about fifteen rows — and all of it is on the thread that
// has to answer the next keystroke.
//
// So the rows are made for the viewport and nothing else. The scroller is as
// tall as every row would be, one spacer holds that height, and the rows
// inside it are placed at their own offsets. Scrolling makes the rows that
// came into view and drops the ones that left; a keystroke re-filters the
// model and makes one screenful.
//
// Everything above the DOM is `windowOf`, which is arithmetic and is tested
// without a browser. The widget below it is deliberately thin: it holds the
// row model, the scroll position and nothing else, and it knows how to draw a
// row only because it is handed a function that does.

import { html } from '../util/dom.js';

// Rows above and below the viewport that are drawn anyway, so that a scroll
// of a few pixels does not have to build a row before it can show one. Six is
// about a third of a screenful here.
export const OVERSCAN = 6;

// Which rows a scroller of this height, scrolled this far, has to have. `last`
// is exclusive. Everything is clamped into the list, so a scrollTop past the
// end — which is what a browser reports for a moment after the model shrinks
// — asks for the last screenful rather than for nothing.
export function windowOf({ scrollTop = 0, viewport = 0, rowHeight = 1, count = 0, overscan = OVERSCAN } = {}) {
  if (!(count > 0) || !(rowHeight > 0)) return { first: 0, last: 0, height: 0 };
  const height = count * rowHeight;
  const top = Math.min(Math.max(0, scrollTop), Math.max(0, height - viewport));
  const first = Math.max(0, Math.floor(top / rowHeight) - overscan);
  const visible = Math.ceil((viewport || rowHeight) / rowHeight) + overscan * 2 + 1;
  return { first, last: Math.min(count, first + visible), height };
}

// `render(row, index)` returns the element for one row; it is called only for
// the rows in the window. `rowHeight` is in pixels and every row is exactly
// that tall — the arithmetic above is the whole reason the list is cheap, and
// it cannot survive rows that measure themselves.
export function createList({ rowHeight = 52, render, className = 'queue-list' } = {}) {
  const root = html('div', { class: className, tabindex: '-1' });
  const spacer = html('div', { class: 'vlist-spacer' });
  const rows = html('div', { class: 'vlist-rows' });
  spacer.appendChild(rows);
  root.appendChild(spacer);

  let model = [];
  let drawn = { first: 0, last: 0 };
  let empty = null;

  function paint({ force = false } = {}) {
    const view = windowOf({
      scrollTop: root.scrollTop,
      viewport: root.clientHeight,
      rowHeight,
      count: model.length,
    });
    spacer.style.height = `${view.height}px`;
    if (!force && view.first === drawn.first && view.last === drawn.last) return;
    drawn = { first: view.first, last: view.last };
    rows.textContent = '';
    for (let i = view.first; i < view.last; i += 1) {
      const el = render(model[i], i);
      if (!el) continue;
      el.style.position = 'absolute';
      el.style.top = `${i * rowHeight}px`;
      el.style.height = `${rowHeight}px`;
      el.style.left = '0';
      el.style.right = '0';
      rows.appendChild(el);
    }
  }

  root.addEventListener('scroll', () => paint());

  return {
    root,
    // The scroll position is kept when the same list is redrawn — a save that
    // rewrites one row must not throw the reviewer back to the top — and
    // reset when the model changes under a new filter, where the old offset
    // means nothing.
    setRows(next, { keepScroll = false } = {}) {
      model = next ?? [];
      if (!keepScroll) root.scrollTop = 0;
      if (empty) { empty.remove(); empty = null; }
      paint({ force: true });
    },
    // What to show instead of rows. Kept out of `render` because an empty
    // list is a sentence and not a row of nothing.
    setEmpty(node) {
      if (empty) empty.remove();
      empty = node ?? null;
      if (empty) root.appendChild(empty);
    },
    // Bring one row into view, by index: what j and k need when the row they
    // step onto is below the fold.
    scrollTo(index) {
      if (!(index >= 0) || index >= model.length) return;
      const top = index * rowHeight;
      const bottom = top + rowHeight;
      if (top < root.scrollTop) root.scrollTop = top;
      else if (bottom > root.scrollTop + root.clientHeight) root.scrollTop = bottom - root.clientHeight;
      paint();
    },
    // Redraw the rows on screen without touching the model: what marking a
    // different row as the open one needs.
    repaint() {
      paint({ force: true });
    },
    get length() {
      return model.length;
    },
    at(index) {
      return model[index] ?? null;
    },
    indexOf(id) {
      return model.findIndex((row) => row?.id === id);
    },
  };
}

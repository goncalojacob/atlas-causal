// One row of the review queue.
//
// Its own module because two things draw it and neither should own it: the
// dashboard, which puts a click on it, and the browser benchmark, which
// measures what a screenful of these costs to make. A row that only existed
// inside `main.js` could be measured only by a copy of itself, and a copy is
// not what is being measured.
//
// Every row is exactly the height the list gives it (src/review/list.js), so
// nothing here wraps: the label is one line, the marks under it are one line,
// and what does not fit is counted rather than shown. That is a real loss —
// the old rows listed every flag — and it is the price of a list that does
// not rebuild thirty thousand rows per keystroke.

import { html } from '../util/dom.js';
import { heldBy } from './claim.js';

// How many flags fit beside the id before they are counted instead.
export const FLAGS_SHOWN = 2;

export function queueRow(item, { current = false, today = null } = {}) {
  const button = html('button', {
    type: 'button',
    class: `queue-item${current ? ' current' : ''}`,
  });
  button.appendChild(html('span', { class: 'queue-label' }, item.label ?? item.id));
  const marks = html('span', { class: 'queue-marks' });
  marks.appendChild(html('span', { class: 'queue-id' }, item.id));
  for (const flag of (item.flags ?? []).slice(0, FLAGS_SHOWN)) marks.appendChild(html('span', { class: 'flag' }, flag));
  if ((item.flags ?? []).length > FLAGS_SHOWN) marks.appendChild(html('span', { class: 'flag' }, `+${item.flags.length - FLAGS_SHOWN}`));
  if (item.degree) marks.appendChild(html('span', { class: 'degree' }, `${item.degree} link${item.degree === 1 ? '' : 's'}`));
  if (item.unverified) marks.appendChild(html('span', { class: 'unverified' }, `${item.unverified} unchecked`));
  // Which records have a full entry written. Not a flag — nothing here is
  // wrong — but the one thing the queue can say about how much of a record
  // exists beyond the sentence on its card.
  if (item.body) marks.appendChild(html('span', { class: 'has-entry' }, 'full entry'));
  const held = heldBy(item.claim, today);
  if (held) marks.appendChild(html('span', { class: 'claimed' }, `${held.name} is reading this`));
  button.appendChild(marks);
  return button;
}

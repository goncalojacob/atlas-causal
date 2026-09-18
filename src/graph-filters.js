// What the graph draws: the degree floor and the top-level switch (M48 §3).
//
// Measured over the 250 active events on 16 September: 103 of them (41 %) have
// one edge or none, 17 have none at all, and 8 carry seven or more. The hubs
// are the nodes a reader can actually see and read a name on; the rest is
// haze. So the graph draws what organises other events by default, and this is
// where the reader moves that — the control belongs beside the picture and not
// in a file.
//
// Two filters and not two alternatives, and **neither is a deletion**: a
// hidden event is still reachable by walking to it, by searching for it, and
// by focusing on it, which is asserted in `tests/graph-browser.test.mjs`.
// Neither applies inside a lens either: a reader who has focused has already
// said what they want to see (arrangement.js).
//
// Beside the map's layer control rather than inside it, and shown only for the
// graph: the layer switches are the map's legend and the graph has no
// coastlines (main.js hides one for the other).

import { esc } from './util/esc.js';
import { DEGREE_CHOICES } from './state.js';

const LABEL = Object.freeze({
  0: 'every event',
  1: 'one link or more',
  2: 'two links or more',
  3: 'three links or more',
});

export function createGraphFilters(group, { state }) {
  if (!group) return { render: () => {} };

  const options = DEGREE_CHOICES
    .map((n) => `<option value="${n}">${esc(LABEL[n] ?? `${n} links or more`)}</option>`)
    .join('');
  group.innerHTML = `<label>draws <select data-filter="degree" aria-label="How many links an event needs to be drawn">${options}</select></label>`
    // A no-op today — ten of 250 events have a parent — and built anyway,
    // because M42 brings wars with their battles and it becomes the main lever
    // the moment hierarchy exists (M48 §3, and `STATUS.md` says so in words).
    + '<label><input type="checkbox" data-filter="tops"> top level only</label>';

  const degree = group.querySelector('[data-filter="degree"]');
  const tops = group.querySelector('[data-filter="tops"]');

  degree.addEventListener('change', () => state.set({ degree: Number(degree.value) }));
  tops.addEventListener('change', () => state.set({ tops: tops.checked }));

  const render = (s) => {
    degree.value = String(s.degree);
    tops.checked = Boolean(s.tops);
  };
  state.subscribe(render);
  render(state.get());
  return { render };
}

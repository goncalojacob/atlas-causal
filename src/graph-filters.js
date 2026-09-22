// What the graph draws: the degree floor (M48 §3).
//
// Measured over the 250 active events on 16 September: 103 of them (41 %) have
// one edge or none, 17 have none at all, and 8 carry seven or more. The hubs
// are the nodes a reader can actually see and read a name on; the rest is
// haze. So the graph draws what organises other events by default, and this is
// where the reader moves that — the control belongs beside the picture and not
// in a file.
//
// **It is not a deletion**: a hidden event is still reachable by walking to it,
// by searching for it, and by focusing on it, which is asserted in
// `tests/graph-browser.test.mjs`. It does not apply inside a lens either: a
// reader who has focused has already said what they want to see
// (arrangement.js).
//
// There was a second switch here, "top level only", until M83 (B10). M65 made
// the resting picture the top level everywhere, so it had nothing left to
// remove — 0 events over the corpus of 22 September, measured — and a control
// that does nothing a reader can see is worse than no control.
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
  group.innerHTML = `<label>draws <select data-filter="degree" aria-label="How many links an event needs to be drawn">${options}</select></label>`;

  const degree = group.querySelector('[data-filter="degree"]');

  degree.addEventListener('change', () => state.set({ degree: Number(degree.value) }));

  const render = (s) => {
    degree.value = String(s.degree);
  };
  state.subscribe(render);
  render(state.get());
  return { render };
}

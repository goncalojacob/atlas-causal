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
//
// **It says what it does, in a reader's words** (M85, A12). It read
// "draws [two links or more ▾]", and a reader does not know what "two links"
// filters — the review's own words. The control is kept rather than dropped
// because it is measurably live: over the corpus of 22 September the resting
// picture is 242 main events of 668 active, and the floor keeps 232 of them at
// one, 154 at two and 82 at three. It changes nothing at its default, which is
// zero since M82 and is the point of that milestone: rest means rest, and the
// floor is a thing a reader reaches for rather than a thing applied to them.
//
// Each option is the whole sentence rather than a word after a verb, because
// what a `<select>` shows when it is closed is one option and not the label
// beside it: closed, it has to read as a statement about the picture.

import { esc } from './util/esc.js';
import { DEGREE_CHOICES } from './state.js';
import { lensView } from './lens.js';

// "Connections" and not "links": a link is this atlas's word for an edge as a
// record — a small historiographical argument with sources — and the number a
// reader is choosing here is how connected a node is.
export const DEGREE_LABEL = Object.freeze({
  0: 'Show every event',
  1: 'Show events with at least 1 connection',
  2: 'Show events with at least 2 connections',
  3: 'Show events with at least 3 connections',
});

export const degreeLabel = (n) => DEGREE_LABEL[n] ?? `Show events with at least ${n} connections`;

// **And it says when it is off** (M86 §8, review B finding 3). The floor is by
// rule off inside a lens (M48 §3, arrangement.js), and since H7/M65 every
// selection *is* a lens: from the moment a reader clicks any node until they
// click the ground, this select changed the URL and nothing on the picture or
// in the count. A control that works sometimes, with nothing to say which
// time it is, is worse than no control.
//
// Disabled rather than hidden, so the reader who used it at rest can see it is
// still there and why; and in a reader's own words, without "lens", which is
// this atlas's word for the thing and not theirs.
export const DEGREE_OFF = 'Off while an event is open: what is drawn is that event and its parts';

// **And it says it to everybody** (M88 §11, the third review, finding B11).
// The sentence above was a `title` and a class on the group, which is a
// tooltip and a colour: a reader with a screen reader was handed a disabled
// select with no reason at all, and a reader who cannot hold a pointer still
// over a control was handed the same. It is a line of text now, visually
// hidden and named by `aria-describedby` on the select itself, so the reason
// is read out with the control it is about. The `title` stays, because it is
// what a pointer gets.
//
// Pure, so that what the control says can be asserted without a browser: the
// text is one function of the atlas and the state, and the markup is another.
export const degreeOffText = (atlas, s) => (atlas && lensView(atlas, s) ? DEGREE_OFF : '');

export const DEGREE_OFF_ID = 'degree-off';

export function degreeControlHtml() {
  const options = DEGREE_CHOICES
    .map((n) => `<option value="${n}">${esc(degreeLabel(n))}</option>`)
    .join('');
  return `<label><span class="visually-hidden">How many connections an event needs to be drawn</span>`
    + `<select data-filter="degree" aria-label="How many connections an event needs to be drawn"`
    + ` aria-describedby="${DEGREE_OFF_ID}">${options}</select></label>`
    + `<span id="${DEGREE_OFF_ID}" class="visually-hidden"></span>`;
}

export function createGraphFilters(group, { state, atlas = null }) {
  if (!group) return { render: () => {} };

  group.innerHTML = degreeControlHtml();

  const degree = group.querySelector('[data-filter="degree"]');
  const reason = group.querySelector(`#${DEGREE_OFF_ID}`);

  degree.addEventListener('change', () => state.set({ degree: Number(degree.value) }));

  const render = (s) => {
    degree.value = String(s.degree);
    // A lens of any kind, asked of the one module that decides what a lens is
    // (lens.js) rather than of `s.selected`, so the answer here and the answer
    // the arrangement acts on cannot come apart.
    const said = degreeOffText(atlas, s);
    const off = said !== '';
    degree.disabled = off;
    if (off) degree.setAttribute('title', DEGREE_OFF);
    else degree.removeAttribute('title');
    // Empty at rest rather than removed: an `aria-describedby` pointing at an
    // element that is not there is a description nobody can read, and a
    // control that is on has nothing to explain.
    if (reason) reason.textContent = said;
    group.classList.toggle('off', off);
  };
  state.subscribe(render);
  render(state.get());
  return { render };
}

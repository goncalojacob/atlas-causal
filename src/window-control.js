// What the map is looking at, and how much of it anybody has read.
//
// The owner, 18 September: *"I don't think the bottom timeline on the map is
// still necessary, I think something to choose the timeline is enough"*. M60
// answered that with two number fields in the masthead, and M64 and M75 put
// the two-handled band back over the map — first behind a button, then simply
// on it.
//
// The owner, 21 September, having used both: **"Picking up the dates exactly
// is unnecessary"** — **"This can be removed."** So the two fields go, and the
// density hint beside them goes with them. The band is the control now: it is
// on the map from first paint, a year is swept rather than typed, and a
// *precise* year is still reachable without a keyboard — double-click snaps to
// a decade and the arrow keys nudge an end by one (`window-band.js`, whose
// gestures this milestone did not touch).
//
// Why the hint went too, against M75's own deviation 1000. That measurement
// said the hint and the strip were two questions over two sets, and it was
// right at the time. M76 changed both halves of it: the strip's profile now
// follows the selection and is drawn at its own scale, so it has a shape a
// reader reads — and the hint sat on the same row saying the corpus, never
// narrowing, which is one of the three candidates the brief listed for *why
// the band does not look narrowed*. Two profiles on one row, one of which
// answers the click and one of which does not, is the fault and not the
// remedy. On the other two views it had no band to duplicate but no job
// either: the timeline draws its own band and its own per-lane density, and
// since M76 the graph ignores the window altogether.
//
// What is left is the two things that were never a control:
//
//   1. what the map is looking at, when it is looking at part of the world:
//      "N of N events in view", with the pin that gives the world back. That
//      line lived under the lanes until M60 and would have gone with them;
//   2. how much of what is on screen a person has actually read (M70).
//
// **`?from=` and `?to=` are unchanged.** A link still opens on its window;
// what is gone is a way of typing one, not the window.

import { resolveWindow } from './util/window.js';
import { workingSet, heldSet } from './emphasis.js';
import { bandEvents } from './window-band.js';
import { eventsInView } from './util/viewport.js';
import { readCount, readCountText } from './standing.js';

export function createWindowControl(group, { atlas, state }) {
  if (!group) return { render: () => {} };

  // Written here because nothing in it comes from `data/`: one sentence of the
  // interface's own words and one number this file computes.
  group.innerHTML = `
    <p class="window-view" hidden>
      <span class="window-count"></span>
      <button type="button" class="pin" title="Draw every event again, wherever the map is looking">show the world</button>
    </p>
    <p class="window-standing">
      <span class="window-read" title="How many of the events in view a person has read and signed. Nothing here changes what is drawn: a draft is drawn exactly as a signed record is."></span>
    </p>`;

  const view = group.querySelector('.window-view');
  const count = group.querySelector('.window-count');
  const read = group.querySelector('.window-read');
  const pin = group.querySelector('.pin');

  // The pin says something about the lanes and the marks, not about the map:
  // it stops the filtering and leaves the map where the reader put it, which
  // is what it did under the lanes (timeline.js).
  pin.addEventListener('click', () => state.set({ bbox: null }));

  // "N of N events in view", the one line the strip carried that is not a
  // picture. The same answer the lanes and the marks are drawn from, from the
  // same two files (emphasis.js, viewport.js) — and computed only while the
  // map is looking at part of the world, so a reader who has never moved the
  // map pays nothing for it, at first paint or after.
  //
  // It returns the events themselves and not only the two numbers, because
  // the standing line below counts over the very same array: "how many of
  // these have been read" and "how many of these are in view" asked of two
  // different sets would be two pictures of the corpus in one bar (M70).
  const countInView = (s) => {
    const working = workingSet(atlas, s);
    // The same function the lanes and the strip over the map draw from
    // (window-band.js): a count said against one picture of the corpus and a
    // band drawn over another would be two answers to one question.
    const inLens = bandEvents(atlas, s);
    // Only while the map is looking at part of the world: with no box every
    // event of the picture is in view, and the intersection would be a pass
    // over the places for an answer that is already in hand.
    if (!s.bbox) return { events: inLens, shown: inLens.length, whole: inLens.length };
    const held = heldSet(working, { reachable: true });
    const shown = eventsInView(inLens, s.bbox, atlas.places, { keep: held, regions: atlas.regionBoxes });
    return { events: shown, shown: shown.length, whole: inLens.length };
  };

  function render(s) {
    if (!atlas.extent) return;
    // Still resolved, and still here: nothing is drawn from it any more, but a
    // state with no window at all is a state this control has nothing to say
    // about, exactly as before.
    if (!resolveWindow(s, atlas.extent, atlas.opens)) return;
    view.hidden = !s.bbox;
    const n = countInView(s);
    if (s.bbox) {
      count.textContent = `${n.shown} of ${n.whole} ${n.whole === 1 ? 'event' : 'events'} in view`;
    }
    // **How much of what is on screen a person has actually read** (M70).
    // Beside the count above and counted over the very same events, from the
    // `reviewed` column the index carries — which is `standing.js`'s own
    // answer, written at build time, and the same function a card's line is
    // written by. The two cannot disagree because they are one predicate.
    //
    // It is said whether or not the map is looking at part of the world,
    // where the count above is not: "12 of 40 in view" is about a gesture the
    // reader made and is nothing until they make it, and "0 of 242 read" is
    // about the corpus and is true from the first frame. It is honesty and
    // never a filter — nothing here decides what is drawn.
    read.textContent = readCountText(readCount(n.events));
  }

  state.subscribe(render);
  render(state.get());
  return { render };
}

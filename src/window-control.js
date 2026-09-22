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

import { resolveWindow, overlaps } from './util/window.js';
import { workingSet, heldSet } from './emphasis.js';
import { bandEvents } from './window-band.js';
import { eventsInView } from './util/viewport.js';
import { readCount, readCountText } from './standing.js';
import { showingReview } from './demo.js';
import { arrangementOf } from './graph-view/arrangement.js';

// The one sentence the count is (M80), pure so that what it says can be held
// to without a browser.
//
// It reads two different ways because it counts two different things. **At
// rest** the picture is the main events — those that are part of nothing else,
// which is what a view draws when nothing has been asked (M65) — and the whole
// is the active corpus, so "252 main events of 581 in view" says both what is
// drawn and why it is fewer than the reader expected. **Under a lens** the
// picture is whatever the lens kept, which is not a set of main events and
// must not be called one: "17 of 581 events in view".
//
// Why it matters that it says which. The line read "252 of 252 events in view"
// and the owner read it as the atlas having 252 events. It had 581, and the
// number was right twice over — right about the picture and right about the
// picture again — which is the one way a true sentence can still mislead.
// The noun agrees with the number it belongs to, and the two readings put it
// in different places: "1 main event of 581" is a sentence about the one, and
// "1 of 581 events" is a sentence about the 581.
const plural = (n) => (n === 1 ? 'event' : 'events');

// And what a *main* event is, said once, where the word first appears (M82,
// A3). The reviewer: *"the count line assumes the reader knows what a main
// event is"*. It is a sentence about the picture and not about history, so it
// is the control's own title rather than a line of the atlas's text; the
// intro card says the same thing in its own words under "How to read it", for
// the reader who opens that instead.
//
// No escaping: it is written here, in the interface's own words, and nothing
// in it came out of `data/`.
export const MAIN_EVENT_HINT = 'A main event is one that is not part of any larger event. Open a war or a regime and what happened inside it appears.';

// And the one note beside it (M82, A5): how many of the events in the window
// the map has no point for at all. It sat on the map as a permanent paragraph
// in the bottom-left corner — *"96 events in this window have no place; they
// are on the timeline."* — on every visit, which reads as an apology for the
// dataset rather than as something about the picture. It is a fact about the
// window, so it is said where the other fact about the window is said, in as
// few words as it takes.
//
// Nothing at all when every event of the window is on the map, which is the
// answer A9's place pass is working towards.
export function unplacedText(unplaced) {
  if (!(unplaced > 0)) return '';
  return unplaced === 1
    ? '1 event in this window has no place on the map'
    : `${unplaced} events in this window have no place on the map`;
}

export function viewCountText({ shown, whole, resting }) {
  return resting
    ? `${shown} main ${plural(shown)} of ${whole} in view`
    : `${shown} of ${whole} ${plural(whole)} in view`;
}

export function createWindowControl(group, { atlas, state }) {
  if (!group) return { render: () => {} };

  // Written here because nothing in it comes from `data/`: one sentence of the
  // interface's own words and one number this file computes.
  group.innerHTML = `
    <p class="window-view" hidden>
      <span class="window-count" title="${MAIN_EVENT_HINT}"></span>
      <button type="button" class="pin" title="Draw every event again, wherever the map is looking">show the world</button>
    </p>
    <p class="window-standing">
      <span class="window-unplaced" title="An event with no place record has no point on the map. It is drawn on the timeline and in the graph, and it is in every count here."></span>
      <span class="window-read" title="How many of the events in view a person has read and signed. Nothing here changes what is drawn: a draft is drawn exactly as a signed record is."></span>
    </p>`;

  const view = group.querySelector('.window-view');
  const count = group.querySelector('.window-count');
  const read = group.querySelector('.window-read');
  const unplaced = group.querySelector('.window-unplaced');
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
    // **What the count is *of*** (M80). The owner, 22 September: *"I still
    // only see 252 events"*, over a masthead reading "252 of 252 events in
    // view" — where 252 was the resting picture of 581 and the line said the
    // same number twice and never once said which of the two it was. The whole
    // is the active corpus now, which is the number the reader is comparing
    // against in their head; the shown is the picture, as it always was.
    const whole = atlas.activeEvents.length;
    // At rest the picture is the **main events** — what is part of nothing
    // else, drawn when the reader opens what it is inside (M65) — and under a
    // lens it is whatever the lens kept. Two different things, so the sentence
    // says which (`viewCountText`). `lensFocus` is `emphasis.js`'s own answer
    // to "is a lens on", so the line and the picture cannot disagree.
    const resting = working.lensFocus === null;
    // **And which picture it is a count of** (M83, B3). It was `bandEvents`
    // narrowed by `s.bbox` whatever the view was, and the graph reads no `bbox`
    // at all (M76/M77) while applying a degree floor no other view applies. So
    // on `?view=graph` with a box left over from the map the line said "N main
    // events of 581 in view" about a rectangle of the *map*, while the graph
    // drew every main event organising two links and no box — two numbers about
    // two different pictures in one line, which is the fault M80 was written to
    // end. On the graph the count is therefore the arrangement's own, asked of
    // the same function the view asks (`arrangementOf`); on the map and the
    // timeline the box still decides, because there it is the picture.
    if (s.view === 'graph') {
      const events = arrangementOf(atlas, s, heldSet(working, { lens: true, reachable: true }), working.shown).events;
      return {
        events, shown: events.length, whole, resting,
      };
    }
    // Only while the map is looking at part of the world: with no box every
    // event of the picture is in view, and the intersection would be a pass
    // over the places for an answer that is already in hand.
    if (!s.bbox) {
      return {
        events: inLens, shown: inLens.length, whole, resting,
      };
    }
    const held = heldSet(working, { reachable: true });
    const shown = eventsInView(inLens, s.bbox, atlas.places, { keep: held, regions: atlas.regionBoxes });
    return {
      events: shown, shown: shown.length, whole, resting,
    };
  };

  // `options` is taken and not read: this control keeps no key — every render
  // recomputes the sentence from the state and the atlas — so being forced is
  // being rendered. It is in the signature because `main.js` forces the four
  // drawings that read `workingSet` with one call, and a control that threw
  // away the argument would be a control nobody could force (M83, B2).
  function render(s, options = {}) { // eslint-disable-line no-unused-vars
    if (!atlas.extent) return;
    // Still resolved, and since M82 read again: the note beside the count is
    // about the events *of the window* — which is what the map's corner said
    // before it moved here — and `bandEvents` is the picture and not the
    // window. A state with no window at all is a state this control has
    // nothing to say about, exactly as before.
    const timeWindow = resolveWindow(s, atlas.extent, atlas.opens);
    if (!timeWindow) return;
    // **The sentence is said with no box too** (M83, B3). It was shown only
    // once the reader had moved the map, so at first paint nobody was told that
    // the picture is 245 of 581 — which is the very sentence M80 wrote it for,
    // and the one the owner's *"I still only see 252 events"* was asking for.
    // The pin is the part that needs a box: *show the world* has nothing to
    // give back when the map is looking at all of it, and the graph has no box
    // to pin at all.
    const n = countInView(s);
    view.hidden = false;
    pin.hidden = !s.bbox || s.view === 'graph';
    count.textContent = viewCountText(n);
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
    // **Off the demo, behind one flag** (M82, A2). "0 of 245 read" is true,
    // and it is the second thing a funder reads on the first screen of a demo
    // whose review process the owner has deferred until there is funding. The
    // count is the same count and `?review=1` still prints it; what is gone is
    // the atlas announcing the state of its own queue to somebody who has not
    // asked (demo.js).
    read.textContent = showingReview() ? readCountText(readCount(n.events)) : '';
    // **And how many of them the map has no point for** (M82, A5). Counted over
    // the very same events the line above counts — active, kept by the lens,
    // overlapping the window — which is what the map's own corner counted
    // before this moved, so the number is the number it was. `pointOf` resolves
    // an event to the coordinates of the place it names (M9); an event that
    // names none is nowhere on the map and everywhere else.
    unplaced.textContent = unplacedText(
      n.events.filter((e) => overlaps(e.when, timeWindow) && !atlas.pointOf(e)).length,
    );
  }

  state.subscribe(render);
  render(state.get());
  return { render };
}

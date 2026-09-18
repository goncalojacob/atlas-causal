# Build brief — M64: the dates are chosen on the map, not typed

The owner, 18 September, after using what M60 built:

> **"There should be a toggle on the map so I can choose the dates instead of
> a selector."**

## 1. What M60 got right and what it lost

M60 was asked to stop the timeline permanently eating the bottom of the map,
and it did that correctly: the strip became a view of its own and the window
moved to two number fields in the masthead. **Nothing about that is being
undone.**

But **typing a year is precise and it is not how anyone explores.** The band
could be swept — you pulled an end and the map answered as you moved, and you
could see where the events were while you were choosing. A number field can do
neither: you must already know the year you want, and you find out what was
there only after you commit to it.

**So the band comes back to the map — on demand, and never again as furniture.**

## 2. What to build

**A toggle on the map that opens the band over it.** Closed, it costs nothing
and the map keeps the whole height M60 gave it. Open, the reader drags either
end and **the map follows as they drag**, not when they let go.

- **Reuse the band that exists.** `src/timeline.js` already draws it and the
  timeline view already has it. **Do not write a second one** — two bands that
  can disagree about the same window is a worse fault than the one being fixed.
- **It shows where the events are.** Whatever the band draws under itself comes
  from `src/density.js`, the same source the masthead hint and the timeline's
  own strip read, so no two pictures of one corpus can disagree.
- **The number fields stay.** Typing is for when you know the year; the band is
  for when you don't. Both write the same `from` and `to`.
- **Closed on a first visit**, and remembered after that the way the panel's
  width is (`src/panes.js`). **The window is URL state and the toggle is not**:
  a link opens on the picture its sender saw, not on whether they had a control
  open. If the run disagrees, it says so in `STATUS.md` rather than quietly
  choosing.

## 3. The thing this milestone must not become

**The strip again.** Open, the band takes a slim strip the reader dismisses —
it does not take a third of the pane, and it does not come back by itself.
**M60 measured the map pane going from about 70 % of the layout to 100 %; a
first visit must still be 100 %,** and the test asserts the property rather
than a pixel count.

## 4. What this run must not do

No new record and no historical claim. **No new hex value, token or type size.**
No change to `lanes.js` or `cluster.js`. **First paint must not get slower** —
the band is built the first time it is opened and not before; say what it costs
before and after. `validate --index` clean; tests before the behaviour they
judge (711, 717). Nothing merged into `main`; ignore `docs/drafts/`.

## 5. Tests

1. **A first visit has no band and the map has the whole layout.**
2. Opening and closing the toggle **does not change the window**.
3. Dragging an end changes `from`/`to` **and the map answers during the drag**.
4. The band on the map and the timeline view **agree about the window and about
   where the events are**, asserted from the shared source rather than by
   comparing two drawings.
5. A reload remembers the toggle; **a link does not carry it**.
6. No test pins a count.

## 6. Done when

The toggle opens and closes the band over the map; the map follows a drag; a
first visit is unchanged from M60; screenshots under `docs/screens/m64-*.png`
closed and open with every other picture restored; `STATUS.md` says what first
paint costs and what the band costs when first opened; tests green; `M64 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

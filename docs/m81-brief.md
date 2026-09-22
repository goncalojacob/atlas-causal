# Build brief — M81: the graph stretches time when it zooms

The owner, 22 September, with a screenshot of World War II opened on the
graph — twenty-seven children in one vertical column, labels three deep on
either side:

> **"On the graph it should expand more horizontally when I zoom in,
> otherwise it looks weird and hard to see."**

## 1. Why it looks like that

The graph's horizontal axis is time, laid out once over the whole extent of
what is drawn. A lens on a six-year war puts every child within a sliver of
that axis, so they stack vertically. The camera then zooms **uniformly** —
`frameFor` in `src/graph-view/frame.js` scales x and y by one `k`, clamped
to `FIT_ZOOM = 2` in `graph-view.js` — so a column zoomed in is a bigger
column, and the labels (M77, whole or not at all, on nearby free lines)
crowd it. The wheel does the same.

## 2. What changes

- **A lens has its own time axis.** With a lens on (an event opened, M65; a
  narrative walk, M74), the arrangement's time domain is **the lens's own
  extent** with a margin, not the corpus's, so the twenty-seven children of
  World War II spread across the width in the order they happened. At rest
  the domain is the whole extent, as now.
- **Zooming stretches time.** The wheel and the pinch scale the horizontal
  axis; the vertical spacing of stacks changes only as far as labels need to
  stay apart. Zooming into 1943 shows 1943 wide, not 1943 large. The camera
  frame (`frameFor`) fits the lens's time extent to the width and the stacks
  to the height, separately; `FIT_ZOOM` becomes a cap on the horizontal
  stretch, and the run says what cap is honest.
- **Marks and labels keep their size on screen** at every stretch (M61's
  rule), and a label is still whole or waits for the pointer (M77).
- **Panning** moves through time horizontally and through stacks vertically,
  as now.
- The lens, the walk framing, the category switches, confidence and the
  chosen edge (M80) are unchanged.

## 3. What this run must not do

No new record, no historical claim. No new hex value, token or type size.
`emphasis.js` unchanged. The map and the timeline unchanged. `validate
--index` clean; tests before behaviour (711, 717); no test pins a count or a
pixel. Nothing merged into `main`; ignore `docs/drafts/`. Lane A numbers
deviations on from M80.

## 4. Tests

1. With `world-war-ii` opened, the children's x positions span more than
   half the drawn width, in date order; at rest the same nodes sit within
   the corpus's axis.
2. One wheel notch in widens the horizontal spread of the nodes on screen
   more than the vertical.
3. A label is the same size on screen before and after a stretch; no label
   is truncated.
4. Opening a narrative walk frames its steps across the width.

## 5. Done when

World War II opened reads as a row of its battles in order, and zooming
into any year spreads it wider; screenshots `docs/screens/m81-*` before and
after, desktop and phone; `STATUS.md` section; `M81 done`.

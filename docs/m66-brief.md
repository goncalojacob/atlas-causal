# Build brief — M66: two the owner handed over

Neither of these is the owner's to spend time on, and both were put to them and
handed back. This milestone is small on purpose: **two changes, no new
behaviour, no new record.**

## 1. The halo stops growing with the zoom

`src/style.css:1032`:

```css
.graph .node-label { … paint-order: stroke; stroke: var(--paper); stroke-width: 3; }
```

The letters hold their size on screen at any zoom (M61, and the map's own rule
before it). **The halo behind them does not**, because it is a stroke inside
the group the zoom scales — so as the reader zooms in the outline swells around
letters that are not growing, and eventually starts eating them.

**The fix is one property, and the file already contains the answer**:
`.graph .node` at line 983 carries `vector-effect: non-scaling-stroke` for
exactly this reason. **Add the same to `.graph .node-label`.** Do not change
the 3 — the number is right at every zoom once the stroke stops scaling, and
changing it would trade one zoom's appearance for another's.

**No new hex value, token or type size**, and no change to the font.

## 2. The timeline's rows take the pane they now have

M60 gave the timeline a whole view. Its rows are still sized for the strip it
used to be — `MIN_LANE_HEIGHT = 22` and a `natural` height the lanes never grow
past — so on a tall window there is a band of empty ground under the bottom
row. It reads as a drawing that failed to finish.

**Let the rows grow into the room, to a cap.** The existing rule — never past
`natural`, shrink to a floor, scroll rather than go below it — stays in shape;
what changes is that `natural` is no longer the ceiling when there is room
going spare. **Choose the cap by measuring**, as M51 and M58 did: a row tall
enough to be easy to hit and not so tall that three lanes become three stripes.
Put the numbers in `STATUS.md` — the heights at 900 px and at 1400 px, before
and after, and at the twenty-lane worst case.

**The bars are drawn where they are drawn.** This is a height, not a re-layout:
no change to `lanes.js` or `cluster.js`, and the packing rule that never stacks
what the reader is working with is untouched.

## 3. What this run must not do

No new record and no historical claim. No new runtime dependency, build step,
map library or tiles. **No new hex value, token or type size.** **First paint
must not get slower.** `validate --index` clean; tests before the behaviour
they judge (711, 717). Nothing merged into `main`; ignore `docs/drafts/`.

## 4. Tests

1. **The halo is the same width on screen at every zoom** — read from the DOM,
   the way M61 asserted the font size, not assumed.
2. A label is still legible over an edge and over a node — the halo is doing
   its job, not merely present.
3. **On a tall pane the drawing reaches the bottom of it**, asserted as a
   property and not as a pixel count.
4. On a short pane the old floor still holds and the pane still scrolls.
5. No test pins a count or a height.

## 5. Done when

The halo holds its width on screen; the timeline fills the pane it was given;
`STATUS.md` carries the measured heights; screenshots under
`docs/screens/m66-*.png` — the graph zoomed in and the timeline on a tall
window — with every other picture restored; tests green; `M66 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

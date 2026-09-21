# Build brief — M74: the graph frames the walk it is asked to show

Found by M42, deviation 986, and it is the display lane's to fix.

## 1. What broke, and why it is not M42's fault

Reading a narrative is a lens (M48): the three views draw the walk, dim its
neighbours, and hide the rest (M65). On the map and the timeline that holds.
**On the graph it no longer does**: the graph opens zoomed in to a rectangle
(deviation 714's opening zoom) and draws only what falls inside it, and where
the layout puts the walk is a fact about the arrangement, not about the
reader's choice. M42's new edges moved the arrangement, and the colonial-war
narrative went from **15 nodes and 4 steps on screen to 7 nodes and no
step at all**. M42's fire measured it in a `before` worktree and excepted the
graph from the lens test rather than loosen it, and said so. That exception
is the debt this milestone pays.

## 2. What to build

**When the reader is reading a narrative, the graph frames the walk.** The
opening view fits the lens — every step on screen, with the room the layout
gives it — instead of the resting rectangle. The same rule applies to any
lens whose set is small enough to frame: an event chosen with its ring, an
actor with its neighbours. **The resting picture keeps deviation 714's
opening zoom**; only a lens changes what the graph opens on.

- **No change to the layout.** `layout*.js` decides where nodes go; this
  milestone decides where the camera starts. `lanes.js`, `cluster.js` and
  `emphasis.js` are untouched.
- **A step is on screen, not merely drawn** — asserted from bounding boxes
  against the pane, as M61 asserted the labels.
- **The URL carries no camera.** A link to a narrative opens on its walk
  because the walk is the lens, not because a zoom was written into it.

## 3. What this run must not do

No new record and no historical claim. **No new hex value, token or type
size.** **First paint must not get slower** — the resting picture is
unchanged and the fit runs only when a lens is on. `validate --index` clean;
tests before the behaviour they judge (711, 717). Nothing merged into
`main`; ignore `docs/drafts/`.

## 4. Tests

1. **The graph's exception in `tests/lens-browser.test.mjs` is removed** and
   the test passes on all three views: reading a narrative draws every step
   of the walk on the graph, on screen.
2. The resting graph opens where it opened before — the property, not a
   pixel.
3. An event chosen with a ring larger than the pane still frames what fits
   and says nothing false — no test pins a count.

## 5. Done when

The lens test holds all three views to the same rule with no exception;
`docs/screens/m74-*.png` shows the colonial-war walk framed on the graph;
`STATUS.md` says what first paint costs; tests green; `M74 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

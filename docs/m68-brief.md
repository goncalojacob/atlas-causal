# Build brief — M68: the categories can be switched from every view

Small on purpose: one control moves, no new behaviour.

## 1. The gap M60 left and M65 widened

Deviation 858 (M60): the category toggles live in the layer control, which is
the map's legend and is hidden on the graph, so the timeline followed the
graph's rule and does not show them. **A category turned off on the map is
still off in the lanes** — `emphasis.js` decides that for all three views —
**but it cannot be turned off *from* the lanes.**

M65 made this worse in a way nobody chose: the categories now narrow the
resting picture on every view, so a reader on the timeline or the graph is
looking at a filtered picture with no way to see or change the filter.

## 2. What to build

**The category switches become a masthead control, on every view, like the
window.** M48 put the graph filters and the layer switches in the masthead;
M60 put the window there; M64 put the count there. The categories join them.
**One control, one state**: switching a category off in the masthead is the
same act as switching it off in the map's legend today, and the legend does
not keep a second copy.

The map's legend keeps its role for the map's own layers — coastlines, relief,
territories — which are the map's and nobody else's.

## 3. What this run must not do

No new record and no historical claim. **No new hex value, token or type
size.** No change to `lanes.js`, `cluster.js` or `emphasis.js` — the filter is
right; only where it is switched from changes. **First paint must not get
slower.** `validate --index` clean; tests before the behaviour they judge
(711, 717). Nothing merged into `main`; ignore `docs/drafts/`.

## 4. Tests

1. Switching a category off from the timeline view **removes its events from
   the lanes, the graph and the map together**, asserted from the shared
   source.
2. The map's legend and the masthead **cannot disagree** — asserted
   structurally, as M64 did for the band: one module owns the switches.
3. The state is in the URL as it is today, and a link carries it.
4. No test pins a count.

## 5. Done when

The categories can be switched from all three views; the legend keeps only the
map's own layers; screenshots under `docs/screens/m68-*.png` of the control on
the timeline; `STATUS.md` says what first paint costs; tests green; `M68 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

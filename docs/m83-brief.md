# Build brief — M83: the display bugs the review found

From `docs/review-2026-09-22.md`, part B (the display code, 19 findings).
**Read part B whole.** Fix, in this order, each with its test first:

1. **B1 — the map drawn while hidden is drawn again when it comes back**:
   `last` cleared when the rect measures nothing, or a render forced after
   unhiding (`src/map/map.js` 853–870, `main.js` 196/296).
2. **B2 — the band's profile and the masthead counts follow late shards**:
   keep the two `render` return values, force-render them where the views
   are forced, add `shardsArrived` to the band's key.
3. **B3 — the masthead count is view-aware**: on the graph it counts the
   arrangement and ignores the map's box; the resting sentence is shown
   without a box.
4. **B5 — a graph node is reachable from the keyboard** as a line is (M63).
5. **B6 — choosing a connection while reading a narrative opens its card**
   and writes `?edge=`.
6. **B9 — above 600 events the graph frames the new layout**, not a stale
   one (the corpus is set to pass 600 this week).
7. **B4, B7, B8 — an umbrella opened outside the window shows its children
   on all three views; a chosen connection is visible on the map and the
   timeline and its ends are in the picture on arrival; a click on the
   graph's ground puts the selection down.**
8. **B10, B11, B12 — dead code**: "top level only" goes; the timeline's
   120 px gutter goes; the stale branches and comments B12 lists go.
9. **B15–B19** as time allows, each its own commit.

Then **part A's A13, the first paint**: the four sequential awaits in
`src/data.js` 1442–1452 run in parallel; the search shard loads on focus,
not at start; the densest century's attribute shard is keyed by decade past
a threshold the run measures and states.

## What this run must not do

No new record, no historical claim, nothing under `data/`. No new hex
value, token or type size. `emphasis.js`'s `shown` contract unchanged.
`validate --index` clean; tests before behaviour (711, 717); no test pins a
count or a pixel. Lane A numbers deviations on from M82. Nothing merged
into `main`; ignore `docs/drafts/`.

## Done when

Every fix above has its test and holds; first paint measured before and
after against M81's numbers; `STATUS.md` section naming each finding by its
review number; `M83 done`.

## Amendments after review

**A1 (22 September). The owner on M81, with a screenshot
(`docs/screens/owner-2026-09-22-graph-ww2.png`): "It's better but still a
bit weird."** World War II opened after M81: the parts are spread 1939 to
1945 across the width, which was the ask, and four things still read as
weird. Fix them here, before part B's list, because the owner is looking at
this picture:

1. **A row of hollow, unnamed circles along the top edge.** They are the
   lens's ring — the one-hop neighbours outside the lens — laid out with no
   stack position, so they sit at y = 0 in a line, and the same hollow
   circles cap every year column. A ring node is placed at its own date
   and a y of its own like any node, drawn faint, and never in a row at the
   edge; if it has no date inside the axis it is not drawn.
2. **Every part snaps to a year column.** Inside a six-year lens the events
   carry day precision (`when.date`), and the axis should use it: x from the
   date, not the year, so the parts spread along the axis instead of
   stacking in seven columns. The owner again, with
   `docs/screens/owner-2026-09-22-graph-column.png` (the 1940 column:
   Katyn, Britain, Franco-Thai, Continuation, Dunkirk on one vertical line):
   *"if you have several events on the same line it gets confusing. Even
   if these events happened in the same year, perhaps it was not on the same
   day so it should appear differently."* Two more things that picture
   shows: the **dashed vertical line down a column reads as a link** between
   the events on it — with the dates spread it goes, or becomes a faint
   year tick that cannot be mistaken for an edge; and **two labels can land
   on one row** ("Franco-Thai War" over "Continuation War") — M77's rule,
   whole or on a nearby free line, applies within a lens too.
3. **The vertical order is arbitrary and the edges fan across the picture**
   — Greco-Italian War and the Armistice at the bottom left sending long
   lines to the 20 July plot and Potsdam at the top right. Order the nodes
   within the lens by the barycentre of their neighbours (a layered
   ordering) so that a chain reads left to right without crossing the
   field, and draw a lens's edges with the same rule M77 gave a walk: the
   chosen chain in ink, the rest faint.
4. **The LINKS key covers the bottom-left of the picture** on the desktop
   too. It collapses to a button everywhere, or moves under the picture.

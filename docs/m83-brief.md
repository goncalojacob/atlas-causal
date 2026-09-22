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

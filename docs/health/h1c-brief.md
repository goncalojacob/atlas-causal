# Build brief — H1c: map maths, reach, and one walk

Health cycle. Read `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/health-plan-2026-09-05.md` (decision 8, milestone H1c),
`docs/health-review-2026-09-05-B.md` findings 10, 11, 15,
`docs/health-review-2026-09-05-A.md` findings 4, 32, 33, and
`docs/review-2026-09-05-health-plan.md` finding 11. Code only; `data/`
and `data/index/` untouched.

1. **Pointer maths through the real transform**: client → SVG via
   `getScreenCTM().inverse()` in the map as the graph view does;
   `viewBbox` from the unprojected corners of the visible rectangle, not
   the SVG's nominal box; a `bbox` write scheduled on `ResizeObserver`.
2. **No world box, and placeless events in view.** A pan never writes
   `bbox=-180,-90,180,90`. A placeless event is in view when its region's
   bounding box intersects the viewport; the region boxes are derived at
   load from `data/geo/regions.json` (already fetched), never from the
   manifest, so `data/index/` does not change.
3. **Discuss carries the record's URL only** (`?selected=<id>` or the
   opening), never the reader's `bbox`, window or chain.
4. **Marks and bars are keyboard-reachable**: `tabindex`, `role="button"`,
   `aria-label`, Enter and Space; a roving tabindex per timeline lane.
5. **The phone sheet and the panes agree**: below the phone width the
   pane sizes are ignored and the sheet's handle is the one control.
6. **One `walkOrSelect`** shared by map, timeline and graph: clicking a
   consequence of the open event walks the chain everywhere.
7. **The panel disappears when nothing is open** (owner, 5 September):
   with no `selected`, `source`, `place`, `actor` or `narrative`, the
   right-hand pane collapses to nothing and the view takes its width;
   it slides back in when something opens. The pane's remembered size
   applies only while it is shown. H7's intro card is therefore not in
   the panel: it is a dismissible card over the view on first visit.
8. **The timeline fits its pane** (owner, 5 September): its height is
   the pane's height, whatever the window or the dragged edge gives it;
   lanes and rows re-lay out on resize (`ResizeObserver`) so nothing is
   clipped at the bottom; past a minimum row height the lanes scroll
   inside the pane rather than overflow; the band's handles stay
   reachable.

Done when: browser tests for 1 (a click at a letterboxed corner selects
the mark under it), 2 (the whole-world view lists every active event on
the timeline), 6 (a map click on a consequence appends to `?chain=`), 7 (with nothing
open the panel's width is zero and the map fills it; opening an event
brings it back), 8 (at a window height of 500 px every lane's bottom row
is inside the timeline pane);
`node --test` and the validator green; deviations; the literal line
`H1c done`.

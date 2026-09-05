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

Done when: browser tests for 1 (a click at a letterboxed corner selects
the mark under it), 2 (the whole-world view lists every active event on
the timeline), 6 (a map click on a consequence appends to `?chain=`);
`node --test` and the validator green; deviations; the literal line
`H1c done`.

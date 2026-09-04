# Build brief — M24: the timeline follows the map, and five interface fixes

Written 4 September 2026, evening. Runs after M23. Read: `CLAUDE.md`,
`STATUS.md`, `ARCHITECTURE.md`, `docs/run-protocol.md`, `docs/m2-brief.md`,
`docs/map-brief.md`, `docs/m6-brief.md`, `docs/m14-brief.md`,
`docs/m19-brief.md`, then this file. No historical text.

## Part 1 — the timeline follows the map's viewport

When the map is panned or zoomed, the timeline shows only the events
whose place lies inside the visible area — the walked chain, the selected
event and the lens always kept — and says so with a small label ("events
in view"); a pin control returns the timeline to the world. The visible
area is carried in the URL as `?bbox=west,south,east,north` (rounded to
two decimals) so a view is shareable; loading a URL with a bbox fits the
map to it. It composes with the lens, the grouping and the band; the
graph view ignores it (it has no viewport of its own) and says so. Pure
function `inView(event, bbox, places)` tested; the map's transform → bbox
conversion tested through the projection.

## Part 2 — five fixes the owner asked for

1. **Layer toggles only in map view.** The coastlines, territories and
   events checkboxes are hidden while the graph is shown, and come back
   with the map.
2. **Zoom on the timeline as on the map.** The mouse wheel over the
   timeline narrows or widens the **band** around the cursor's year (the
   lanes stay on the full extent, as decided in M6); dragging on the
   timeline's empty ground slides the band; the same keyboard nudges as
   the handles. Pinch on touch if it is cheap.
3. **Six lanes, not twelve.** The automatic grouping shows the six with
   the most events in the window, plus "Other"; explicit `lanes` lists
   are unlimited as before.
4. **Click on empty ground deselects.** A click on the map or the
   timeline that hits no mark, cluster, bar, stack, territory or handle
   clears `selected` and `chain` (a click on a territory still selects
   its actor). A drag never deselects.
5. **"Discuss this record"** on every card: a link to a prefilled GitHub
   issue (title with the record id, body with the record's URL and a
   line asking what is wrong), and **"Export this view"** on the map and
   the graph: the current SVG serialised with the tokens inlined as
   computed colours, offered as a `.svg` download.

## Docs and done when

`ARCHITECTURE.md` (the bbox in the state, the six-lane default, the
deselect rule), `about.html`. Done when: `?bbox=-10,36,-6,43` fits the map
to Portugal and the timeline lists only the events placed there (assert
the count); the toggles vanish in graph view; the wheel over the timeline
changes `from`/`to` in the URL; `?group=actor` shows six lanes plus
Other; a click on the sea with an event selected clears the URL's
`selected`; the discuss link and the export exist on the cards and the
views; validator and tests green; `STATUS.md` with the literal line
`M24 done`; an "M24" section on PR #1.

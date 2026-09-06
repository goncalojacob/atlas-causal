# Build brief — M30b: the interface half

Runs after M30a on `m0`. Read what M30a read plus `docs/health/h7-brief.md`
(the multi-focus lens), `src/emphasis.js`, `src/panel/*`, `src/timeline.js`,
`src/graph-view/*`, `src/map/layers/events.js`, then this file. Code only.

1. **Office card and reach**: `?office=` opens a card (title, the actor
   it belongs to, category, the tenures in order with holders, dates and
   the event that started each); offices in search; the actor card of a
   state shows **one tenure strip per office**, holders as bars over
   time in the timeline's scale, clustered in one dimension with
   `cluster.js` past what fits, click to open the person; an Offices
   grouping is M33's.
2. **Parents**: the card says "Part of" with a link; a parent lists its
   parts in order; the timeline draws a parent as a bracket over its
   children; the graph collapses children into their parent when zoomed
   out — semantic collapse first, then M25's geometric stacks on the
   result, a collapsed parent expanding under the same never-hide rule as
   the selection, the badge summing `subtreeWeight`; the lens's `event:`
   focus narrows to a subtree, "Show only this" on a parent's card.
3. **Large events** (`scope`, or children across more than one lane): a
   band across the whole timeline and a wash over the map rather than a
   mark; the card says which it is.
4. **Categories as glyphs**: `src/map/glyphs.js`, one `<symbol>` per
   category in the azulejo line, coloured and emphasised exactly as marks
   are; the timeline bar carries the glyph at its left; a cluster keeps
   the plain mark with its count; the layer control lists **events by
   category**, one toggle each under "events", `?layers=` carrying them
   as `events:war`; the **coastline toggle removed** (coastlines always
   drawn).
5. **Unplaced count** in the map's corner for the window.
6. **Form and editor**: every new field and both kinds in the
   contribution form and the review editor, through the registry; the
   picker offers offices for a tenure and events for `startedBy` and
   `parent`.
7. `about.html`, `CONTRIBUTING.md`, `ARCHITECTURE.md`.

Done when: browser tests for the office card, the strip on
`?actor=portugal`, a parent's bracket and collapse on the fixtures, a
`scope: worldwide` band, one glyph per category, the category toggles in
the URL, and the form writing a tenure; validator and tests green; the
literal line `M30b done`.

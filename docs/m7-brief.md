# Build brief — M7: the graph view

Written 3 September 2026. Runs after M6 (`docs/m6-brief.md`) has landed on
`m0`. Read, completely and in this order: `CLAUDE.md`, `STATUS.md`,
`ARCHITECTURE.md` (revision 7 — you write revision 8), `CONTEXT.md`
(especially "the structure is a graph" and the convergence query),
`docs/m2-brief.md` (rules of engagement), `docs/map-brief.md`,
`docs/m6-brief.md`, then this file. Rules of engagement as in every brief
since `docs/m4-brief.md`; deviations numbered on from the last in
`STATUS.md`; no historical text at all in this run.

## What it is

A third view of the same graph: every event a node, every edge a line, so
the reader can see the whole web of consequences at once instead of one
chain at a time. It shares everything with the map — the panel, the
search, the time window, the URL, the selected event and actor, the walked
chain — and replaces the map in the same slot behind a **Map | Graph**
toggle in the header (`?view=graph`; default `map`).

## Layout — by time, not by physics

- **x is the year**, on the same scale the timeline uses for the current
  window, so left-to-right is chronology and the arrow of time is visible.
  No force simulation: it would put 1910 beside 2011 and lie about time.
- **y** is assigned to keep edges short and crossings few: a barycentre
  pass (a few sweeps, deterministic), inside faint horizontal **bands, one
  per region**, so continents stay legible. Nodes with the same year and
  region are spread vertically within the band.
- A pure `src/graph-view/layout.js` — input: the topology and the window;
  output: positions — with tests for determinism, band membership and a
  crossing count that does not get worse than the naive order.

## Drawing — `src/graph-view/graph-view.js`

- Nodes are the same marks as the map's (weight decides size only within
  a small range); hover names them; click selects (`?selected=`); the
  selected actor's events get the cobalt emphasis; the walked chain is
  madder; when the selected event has ancestors, the **convergence
  branches** (from `graph.js`) are highlighted as such — this view is
  where convergence becomes visible as a picture.
- Edges: a small arrowhead at the target; **the five types drawn
  distinctly** (line pattern or weight, from tokens — document the key in
  `about.html`); `disputed` dashed as everywhere; edges outside the window
  faded with their nodes.
- The window fades nodes and edges outside it rather than hiding them, so
  the whole graph is always there; the band on the timeline still drives
  it.
- Pan and zoom as the map has them. If you factor the map's transform
  handling into a shared `src/viewport.js`, keep both tests green and
  record it.
- Labels: the heaviest nodes on screen are labelled, as on the map; at
  sixty events label everything at zoom ≥ 2.
- Level of detail at thousands of nodes is **not** built; say in
  `ARCHITECTURE.md` that the graph view will need the map's clustering
  idea along the time axis when the data grows, and reserve it.

## Wiring

`index.html`: the toggle and the second container; `main.js` wires the
view from state; `state.js` carries `view`; `search` and the panel work in
both views; `?fixtures=1` works. `about.html`: a short paragraph on
reading the graph view and the edge-type key. `ARCHITECTURE.md` revision
8 with its dated note: the view in the tree and the module table, the
`view` state, the reserved level-of-detail line.

## Done when

`?view=graph` draws the sixty events left-to-right by year in five bands
with all 73 edges, types distinguishable, disputed dashed; clicking a node
selects it and the panel follows; walking a chain paints it madder in both
views; selecting 25 April shows its convergence branches highlighted;
narrowing the window fades the rest; search works from the graph view;
tests green; verified in headless Chromium; `STATUS.md` updated with a line
"M7 done"; an "M7" section on PR #1.

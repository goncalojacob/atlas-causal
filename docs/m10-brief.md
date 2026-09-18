# Build brief — M10: source pages, and "what did this lead to by year X"

Written 3 September 2026. Runs after M9. Read, in this order: `CLAUDE.md`,
`STATUS.md`, `ARCHITECTURE.md` (current revision; you write the next),
`CONTEXT.md` (the convergence query, and why it excludes only the walked
path), `docs/m2-brief.md`, `docs/m6-brief.md`, `docs/m7-brief.md`, then this
file. Rules of engagement as in every brief since `docs/m4-brief.md`; no
historical text at all.

## Part 1 — source pages

- **A source card** in the panel (`?source=<id>`): the full citation as
  the record has it, identifiers as links (DOI, ISBN as a WorldCat/Open
  Library link, URL), and **everything that cites it**, grouped by kind —
  events, edges (with whether the citation supports or dissents, from
  `sources` vs `dispute.sources`), actors, presences, narratives when they
  exist — each with its locator. Reached by clicking any citation
  anywhere in the panel; sources join the search.
- **A bibliography** section on `about.html` — or a `sources.html` if the
  list would swamp `about` — listing every source with its citation count,
  each a link into the atlas. Generated at render from the sources index,
  not hand-written.
- The topology (or the sources index) gains citation counts so the list
  needs no extra fetch.

## Part 2 — "what did this lead to by year X?"

On a selected event, a **horizon** control in the panel: a year (default
the window's end) and a list of every event reachable downstream whose
start is on or before that year, ordered by path length then year, with
the type and confidence of the first edge on the shortest path, disputed
paths marked. Choosing an event in the list walks the shortest path to it
as the chain (madder on map, graph and timeline) and shows convergence
for it as today. The map, graph view and timeline **highlight the whole
reachable set** while the horizon is open, faded by distance. Pure
functions in `graph.js` (reachable-within-year, shortest path by hops
with ties broken by year), tested; the panel only asks. URL: `?horizon=<year>`
alongside `selected`.

## Done when

Clicking a citation opens the source card with its citers; the
bibliography lists every source; on 25 April with horizon 2011 the panel
lists the downstream events and choosing one walks the chain; tests
green; `ARCHITECTURE.md`'s next revision; `STATUS.md` with the literal
line `M10 done`; an "M10" section on PR #1.

## Amendments after review (3 September, afternoon) — these override the body

- **Protocol.** Gate on `M8 done`; follow `docs/run-protocol.md`; `M10
  done` as its own line.
- **Card precedence** (from M9): `selected` > `source` > `place` > `actor`;
  choosing a source clears `selected` and `chain`, keeps `actor`.
- **`horizon`** is written to the URL only when set explicitly; the
  default (the window's `to`) is never written. Reachability uses
  `start.min ≤ horizon`, astronomical, via `extent()`.
- **Done when — numbers**: clicking a citation on any event opens
  `?source=<id>` whose card lists every citer (assert the count equals the
  sources index's citation count); on `?selected=carnation-revolution-1974&horizon=2011`
  the panel lists every downstream event (assert the count against
  `graph.js` in a test) and choosing `constitution-1976` sets a chain of
  the shortest path's edges.

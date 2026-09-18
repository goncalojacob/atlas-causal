# Build brief — M25: level of detail in the graph view

Written 4 September 2026, evening. Runs after M24, when the atlas holds
several hundred events. Read: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`
(the reserved line on the graph's level of detail), `docs/run-protocol.md`,
`docs/m2-brief.md`, `docs/map-brief.md` and `src/cluster.js` (the map's
clustering, reused by the timeline), `docs/m7-brief.md`, `docs/m14-brief.md`,
then this file. No historical text.

## What changes

The graph view draws every event as a node. At three hundred nodes and
five hundred edges it is a hairball at the default zoom. Apply the map's
idea along the time axis: nodes closer than a screen-constant distance —
in x (time) within a lane or band, and in y — merge into a **stack** drawn
as one node with a `+n` badge; edges between two stacks merge into one
line whose weight shows how many it carries and whose type shows the most
common one, with a dashed style if any member is disputed; as the reader
zooms in, stacks split; clicking a stack zooms to where it splits, or
lists its members in the panel when zooming cannot part them (same
coordinates). The selected event, the walked chain, the lens's events,
the horizon's reachable set and a narrative's steps are **never stacked**.
`src/cluster.js` gains what it needs (one shared module, tests extended);
the graph layout runs on the stacks' representatives so the picture stays
stable while zooming. Labels for the heaviest stacks, as the map does.

## Docs and done when

`ARCHITECTURE.md` (the reserved line becomes built). Done when: at the
default zoom the graph draws far fewer nodes than events (assert the
count against the layout's output) with badges summing to the total; one
wheel step in splits stacks; a merged edge carries its count and keeps
`disputed` if any member is; selecting an event never leaves it in a
stack; the layout test asserts determinism with stacks; validator and
tests green; `STATUS.md` with the literal line `M25 done`; an "M25"
section on PR #1.

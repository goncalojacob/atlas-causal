# Build brief — M19: the look — colour on the map, a styled interface

Written 4 September 2026 from the owner's request (`docs/BACKLOG.md`,
"Look"). Runs after M18. Read, in this order: `CLAUDE.md` (the visual
direction: azulejo — cold white ground, cobalt drawing, one madder accent
for the path being followed; every colour a token in `src/style.css`; no
runtime dependencies, so no web fonts from a CDN), `STATUS.md`,
`ARCHITECTURE.md`, `CONTEXT.md`, `docs/run-protocol.md` with its
amendments, `docs/m2-brief.md`, `docs/m5-brief.md` (why the territories
were drawn as cobalt outlines), `docs/map-brief.md`, `docs/m14-brief.md`,
then this file. Rules of engagement as always; no historical text.

## What changes, and what does not

The owner wants each country or territory to have its own colour and the
interface to carry more visual identity than blue lines on white. Two
things do not change: the **hierarchy of emphasis** — the selected actor
(cobalt) and the walked chain (madder) stay the loudest marks on screen,
so territory colour must sit under them — and the **token rule**: every
colour is a CSS variable in `src/style.css`, nothing else names a hex.

## Part 1 — colour on the map

- **A palette of eight muted hues** as tokens (`--terr-1` … `--terr-8`),
  chosen to read as one family with the azulejo cobalt and madder — low
  saturation, mid-light — plus a lighter tint of each for dependencies.
  Test the eight against each other and against cobalt/madder for
  distinguishability; write the reasoning in a comment.
- **Assignment is data, generated offline, deterministic**:
  `tools/build-palette.mjs` reads the presence shards, builds the
  adjacency of territories (polygons that share a border segment or come
  within a small distance) across all periods, and assigns each **actor**
  one hue such that no two neighbours in any period share it — a greedy
  graph colouring with a stable order (actor id), spilling to the closest
  available hue when eight is not enough for a region. Output
  `data/geo/palette.json` (`actor id → hue index`), committed, rebuilt by
  the tool, checked for freshness by `validate.mjs --index` like the
  index. A territory keeps its hue as the years pass because the hue
  belongs to the actor.
- **Rendering** (`layers/presences.js`): a state is filled with its hue at
  low opacity with a thin outline of the same hue darkened; a dependency
  with the owner's lighter tint and a dotted outline; `disputed` hatched
  as today. Hover: the hue at higher opacity. **Selected actor**: cobalt
  fill and cobalt outline, over everything; the walked chain's lines stay
  madder and on top. The `territories` toggle and the year clamp are
  unchanged. Land without a territory stays the land token.
- **Legend**: none by hue (hue means "distinct", not "which"); the hover
  and the card say which. Say this in `about.html`.

## Part 2 — the interface

A visual pass, not a rebuild. Keep the DOM and the modules; change
`style.css`, the header, and small markup where needed:

- **Typography**: a self-hosted open-licence typeface pair (files under
  `src/fonts/`, licence file beside them; a humanist serif for titles, a
  readable sans for text — pick and justify; SIL OFL or similar; no CDN),
  a type scale, tabular numerals on dates and counts, comfortable line
  length in the panel.
- **The header** as a real masthead: the name, the view toggle, the
  search, the grouping picker and the layer toggles arranged with
  intention; an azulejo touch — a thin tile-pattern rule or a corner
  motif drawn in SVG from tokens, once, not a wallpaper.
- **The panel**: card hierarchy by spacing and rules rather than boxes;
  citations, disputes and confidence as designed pieces (a dispute reads
  as a dispute at a glance); the actor card's relations and territory as
  compact tables.
- **Timeline and graph**: the five edge types get distinct, legible line
  patterns and a small key; packed rows and named lanes get a quiet
  alternating ground; stacks' badges and labels restyled with the type
  scale. The band and the handles as designed controls.
- **Marks**: event marks and clusters restyled coherently with the new
  palette; territory hues must not be confused with mark emphasis.
- **States**: hover, focus (visible, keyboard), selected, disabled;
  `prefers-reduced-motion` respected; contrast checked (WCAG AA for text
  and controls; document the check).
- **No dark mode** (CLAUDE.md); no new dependencies; the pages
  `contribute.html`, `about.html`, `sources.html`, `review.html` get the
  same tokens so nothing looks like a different site.

## Docs and tests

`ARCHITECTURE.md` next revision: `tools/build-palette.mjs`,
`data/geo/palette.json`, the emphasis hierarchy as a decision, the fonts
as assets; `CLAUDE.md`'s visual-direction line amended to name the
territory palette; `about.html` explains the colours; tests for the
palette tool (adjacency, no neighbour shares a hue, stability, freshness)
and the existing "no hex outside style.css" test still green.

## Done when

`?year=1911` shows the colonial world in eight muted hues with no two
neighbours alike and Portugal's territories recognisably one family;
`?year=1975` keeps each actor's hue; selecting Angola fills it cobalt over
its hue; the chain is madder on top; the header, panel, timeline and
graph read as one designed interface in headless Chromium screenshots
saved under `docs/screens/m19-*.png` and listed in `STATUS.md`; validator
and tests green; `STATUS.md` with the literal line `M19 done`; an "M19"
section on PR #1.

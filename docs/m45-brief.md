# Build brief — M45: the ground under the borders

M36 imported six layers of Natural Earth and M37 drew them, but the ground is
still nearly silent: a mountain range and a desert are the same dashed outline,
a peak of 8,848 m and a hill of 400 m are the same three-pixel dot, and nothing
on the map says why a frontier sits where it does. **The owner asked for a
topographical map and the argument is his: relief is how a reader understands
that a border follows a watershed, a ridge or a river, and that when it moves
it moves across something.** A line on an empty page is a line somebody drew; a
line on a ridge is a decision about the world.

This brief does that in two runs, cheapest first, because the second is the
expensive one and the first tells us whether it is needed in the form we think.

Read `CLAUDE.md` (the azulejo direction — **no new hex value**, type sizes from
the scale in `style.css` and nowhere else; the layout tree), `STATUS.md`,
`ARCHITECTURE.md`, `docs/run-protocol.md`, `docs/map-block-plan.md`,
`docs/m36-brief.md`, `docs/m37-brief.md` and `docs/m38-brief.md` **including
their amendments**, then `tools/import/naturalearth.mjs`,
`tools/import/features.mjs`, `tools/import/geometry.mjs` (`clipToBox`),
`src/map/grid.js`, `src/map/layers/base.js`, `src/map/labels.js`,
`src/style.css` (the `.map .layer-base-*` rules at ~628–631, the tokens),
`src/state.js` (`LAYERS`), `src/layer-control.js`, `vendor/README.md`,
`vendor/SHA256SUMS`, `tests/map-browser.test.mjs`, `tools/screens.mjs` — and
this file including its "Amendments after review" if one is present, which
override the body where they differ (run protocol §3).

## 0. What is already on disk, and what is not

`data/geo/base/` holds six layers cut on a 6 × 4 grid of 60° × 45° cells,
5.89 MB of an 8 MB ceiling, `data/geo/` 10.95 MB of 24 MB. Two of those six
already carry more than they show:

- **`physical`** — polygons from `ne_10m_geography_regions_polys` under M36's
  frozen `FEATURECLA` allow-list: `Range/mtn`, `Desert`, `Plateau`, `Plain`,
  `Pen/cape`, `Peninsula`, `Basin`, `Depression`, `Valley`, `Lowland`, `Delta`,
  `Isthmus`, `Foothills`, `Tundra`, `Wetlands`, `Gorge`, `Geoarea`. **Seventeen
  kinds of thing, drawn identically**: `fill: none; stroke: var(--line);
  stroke-width: 0.5; stroke-dasharray: 3 3`.
- **`mountains`** — 711 elevation points, **every one carrying a real
  `elevation` in metres** (M36b confirmed it; A5 struck the no-elevation
  fallback). Drawn as `circle { fill: var(--ink-soft) }`, one size for all.

What is **not** on disk is any elevation model. Natural Earth ships bathymetry
as vector depth bands and relief only as raster; there is no land hypsometry in
the vectors. M45b therefore needs a new committed source.

## 1. M45a — the ground made to read

**No new bytes under `data/`, no new source, no import re-run.** This run is
styling and one small import-side change, and it exists to answer a question by
looking: *does the ground, drawn properly, show you what a border is doing?*

1. **`physical` is drawn by what it is.** The seventeen classes become a small
   number of visual families, and the family is decided in `features.mjs` and
   written onto the feature as a `kind`, not guessed in CSS from the name.
   Ranges and foothills read as relief; deserts, tundra and wetlands read as
   ground cover; basins, depressions and valleys read as hollows; the rest keep
   today's outline. **The families are the brief's, the tints are the run's**,
   from existing tokens only: `--line`, `--ink-soft`, `--cobalt-faint`,
   `--cobalt-soft` and the paper. No new hex value, no new token.
2. **A peak is drawn at its height.** `mountains` circles take a radius from
   `elevation` through one frozen, monotone function in `features.mjs` beside
   the `z` table — not a linear scale, which makes Everest a blob and the Serra
   da Estrela invisible. The function, its domain and its range go into
   `STATUS.md`. The label a peak already carries is unchanged.
3. **The layer control gains nothing.** `physical` and `mountains` have rows
   already; this run changes how they draw, not what can be switched.

**Done when**: `docs/screens/m45-ground-iberia.png` and
`docs/screens/m45-ground-alps.png` exist, **both taken with `territories` on**,
because the whole question is whether ground and borders read together; the
families and the elevation function are in `STATUS.md`; `node
tools/validate.mjs --index` is byte-identical except where `features.mjs`
writes the new `kind` (which is an index rebuild, recorded); the literal line
`M45a done`.

## 2. M45b — the elevation bands

**Vector bands, not a hillshade.** A band has an edge, and an edge is what a
border can be seen to sit on; shading gives an impression and no edge. Bands
also stay inside every constraint the repository has: SVG, no tiles, no map
library, one import tool, the same cell grid, the same budget discipline.

1. **The source.** A public-domain global elevation grid, committed by the
   owner's assistant by hand under `vendor/elevation/` before this run starts,
   gzipped, with its URL, its pinned version, its sha256 of the decompressed
   bytes and its licence in `vendor/README.md` and `vendor/SHA256SUMS`, exactly
   as Natural Earth is. **The run does not download it**: a `fetch` in this
   tool is a bug, not a fallback, and if the file is missing or its hash
   differs the run stops and says which. The grid must be coarse enough that
   the gzipped source is **at most 8 MB**; relief at continental scale does not
   need 30 m posts, and a border follows a ridge at a resolution a reader can
   see.
2. **Five bands**, as polygons: **0–200 m, 200–500, 500–1000, 1000–2000, above
   2000**. Below sea level is not a band in this round — the Dead Sea and the
   Qattara depression are `physical` features and already drawn as hollows by
   M45a. The band edges are the brief's and are frozen before any tint is
   chosen, so that nobody tunes the bands to make a picture.
3. **A `relief` layer** in `tools/import/naturalearth.mjs`, written to
   `data/geo/base/relief/` on the same 6 × 4 grid with the same far file, the
   same `--budget` reporting of tolerance, points kept and points dropped, and
   the same manifest block. It is a base layer like any other: `minZoom`,
   cells, a row in the layer control, a member of `LAYERS`, `?layers=relief`.
4. **It draws underneath everything**, including the coastline, and it is the
   only layer allowed to carry a fill across open land. Five tints from the
   existing palette, lightest low; the darkest must still leave a territory
   fill, an event mark and a label legible over it, and the run proves that by
   screenshot rather than by assertion.
5. **The budget.** `relief` gets its own ceiling of **6 MB**, inside
   `data/geo/`'s 24 MB and **outside** the base map's 8 MB, which would
   otherwise have only 2.11 MB free. That is a new ceiling this brief invents
   and the owner may move it. If the bands will not fit at any sane tolerance,
   land what fits, say in `STATUS.md` which band was coarsened and to what, and
   do not raise the ceiling.

**Done when**: the import rewrites every file it owns byte for byte from the
committed source with no network; `data/geo/base/relief/` and its manifest
block exist; `relief` is in `LAYERS`, in the control and in `?layers=`; the
budget table is in `STATUS.md` with `du -sh data/geo` measured against both
ceilings; first paint is unchanged and `tests/spine-pages.test.mjs` still shows
no `geo/base/` request before the first contentful paint;
`docs/screens/m45-relief-iberia.png` and `docs/screens/m45-relief-alps.png`
exist with `territories` on; `ARCHITECTURE.md` names the layer; the literal
lines `M45b done` and then `M45 done`.

## What these runs must not do

- **No new hex value, no new token, no new type size.** A relief map that needs
  a new palette is a different atlas; this one has a palette.
- **No raster.** No hillshade, no tiles, no image under the map, at any
  resolution, for any reason.
- **No new runtime dependency and no build step.** The import is a committed
  Node script and its output is committed files, as every import here is.
- **No historical claim.** Nothing in this milestone writes about the past.
- **Nothing merged into `main`.** `docs/drafts/` is ignored.

## Tests

1. The band table is frozen: a unit test asserts the five edges and fails if
   anyone changes them without changing the test.
2. The elevation-to-radius function is monotone over its whole domain and
   bounded at both ends.
3. `physical`'s `kind` is written from the frozen allow-list and an unknown
   `FEATURECLA` takes the default family rather than throwing.
4. A browser test: at the whole world `relief` fetches its far file and not one
   cell; zoomed to Iberia it fetches the viewport's cells and no others — the
   same assertions M37a made for the other six, using `settledBase`.
5. A browser test: with `?layers=` naming a subset that excludes `relief`, no
   `geo/base/relief/` request is made at any zoom.
6. `tests/spine-pages.test.mjs` gains `relief` to its no-request-before-paint
   list.

## Deviations this brief takes, numbered on from 668

The last deviation on `m0` is 668. M45a numbers from 669 — **but `m44` has
already used 669 to 683**, so if `m44` is merged before this runs, number from
the last on the merged branch and say so in the first deviation.

## The two sub-runs

- **M45a — the ground made to read.** Styling and `features.mjs`'s `kind`; no
  new source; two screenshots with territories on. Done line `M45a done`.
- **M45b — the elevation bands.** The vendored grid, the `relief` layer, the
  control, the budget, two more screenshots. Done lines `M45b done` and then
  `M45 done`.

M45a is gated on `M38 done`, which is already written. **M45b is gated on
`M45a done` and on the owner having looked at M45a's two screenshots**, because
if the ground reads well enough at M45a then the bands may want different tints
— or, if it reads badly, the fault is not the data and 6 MB would not fix it.

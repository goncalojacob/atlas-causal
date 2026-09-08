# Build brief — M36: the base map's data

The atlas draws a world of 110 m coastlines and nothing else: no rivers, no
lakes, no mountains, no cities, and an event in Goa sits on a coastline
generalised to about eleven kilometres. This run draws nothing. It turns
committed Natural Earth 10 m files into the sharded, simplified, quantised
geometry M37 will read — one new directory, `data/geo/base/`, one new manifest
block, a printed byte budget, and a ceiling the tool refuses to cross. Runs on
`m0` after M39, in three gated sub-runs, from `docs/plan-2026-09-05.md`
decision 9 and `docs/review-2026-09-05-plan.md` findings 23, 24, 25 and 26;
the order and the gates are `docs/map-block-plan.md`.

Read `CLAUDE.md` (no map library, no tiles, no runtime dependency, no build
step; the layout tree, which `tests/site.test.mjs` holds every module under
`src/` and `tools/` to, by basename), `STATUS.md`, `ARCHITECTURE.md`
(revision 22: the `geo/` tree at ~841–846, the manifest line at ~848 and the
manifest prose at ~1681–1720, `### Reserved ○` at ~2125, `## Extension
points` at ~2446–2449, and `## Scale, for the record` at ~2511–2593, where
the coastline is the largest item at first paint and the base map is already
named as what replaces it), `docs/run-protocol.md`,
`docs/plan-2026-09-05.md`, `docs/review-2026-09-05-plan.md`,
`docs/BACKLOG.md` → "A real base map under the events",
`docs/m39-brief.md` (the seam; it has already run),
`docs/map-block-plan.md`, then `tools/build-regions.mjs`,
`tools/import/cshapes.mjs`, `tools/import/topojson.mjs`,
`tools/import/simplify.mjs`, `tools/import/identity.mjs`,
`tools/lib/read.mjs`, `tools/build-index.mjs`, `src/util/simplify.js`,
`src/licensing.js`, `src/map/projection.js`, `src/map/layers/land.js`,
`src/data.js` (`loadAtlas`, `assertGeneration`, `loadGeometry`),
`data/geo/LICENSE`, `tests/import-cshapes.test.mjs`,
`tests/build-index.test.mjs`, `tests/licensing.test.mjs`,
`tests/spine-pages.test.mjs` — and this file including its "Amendments after
review" if one is present, which override the body where they differ (run
protocol §3).

## 0. The gate, and the files that must already be in the repository

The gate line is the literal `M39 done` on `origin/m0`.
`docs/map-block-plan.md` says why M39 comes first: it fixes the central
meridian and writes `splitAtMeridian`, and geometry cut at the wrong seam
would have to be cut again.

**There is no network in a run.** Natural Earth is not downloaded here and
must not be: a `fetch` in this tool is a bug, not a fallback. The source
files are committed by the owner's assistant, by hand, before M36a starts,
under `vendor/natural-earth/10m/`, gzipped, with the exact commands, URLs and
checksums in `docs/map-block-plan.md` § "What the assistant does by hand".
The run's first act is to check they are there and that each decompresses to
the sha256 that plan records. **If one is missing or differs, the run stops
and says which**: it does not proceed on a substitute, it does not download,
and it does not lower the resolution to something it happens to have.

`vendor/` is a new top-level directory. It is **not** added to `deploy.yml`'s
allowlist — these are inputs, like the CShapes TopoJSON, and nothing under
`vendor/` is ever served. `vendor/README.md` names each file, its URL, its
pinned tag, its sha256 and its licence (Natural Earth: public domain, no
restrictions of any kind), and points at `data/geo/LICENSE` for what was
derived from it.

## 1. `tools/import/naturalearth.mjs`, and its two pure halves

```
node tools/import/naturalearth.mjs --source vendor/natural-earth/10m [--data <dir>] [--out <dir>] [--budget] [--survey] [--check]
```

Offline, zero dependencies, idempotent, in the shape `cshapes.mjs` already
has: pinned version and per-file sha256 as module constants, `--check`
verifying them, the whole import computed by a pure `planImport` and only
then written, the same bytes on a second run. Gzipped sources are read
through `node:zlib`'s `gunzipSync` — in Node, so no dependency and no build
step.

- **`tools/import/features.mjs` — pure.** Natural Earth's properties → this
  atlas's fields, one frozen table per layer: which property is the name,
  which the local name, which the scale rank, which the population, and
  which features are dropped. Nothing in it reads the disk.
  **The property names are not guessed.** `--survey` prints the property
  keys actually present in each committed file, with a value or two; M36a
  runs it first, the run writes the table it chose into `STATUS.md`, and
  `features.mjs` carries a comment saying which file each name was read off.
  Where a file has no scale rank and no `min_zoom`, the run says so and
  falls back to a rule of its own — area for a polygon, length for a line,
  population for a city — recorded in the same table.
- **`tools/import/grid.mjs`** — three lines re-exporting `src/map/grid.js`,
  exactly as `tools/import/simplify.mjs` re-exports `src/util/simplify.js`.
  One implementation of the grid, because two would drift and the second
  would be the one nobody tested.
- **`src/map/grid.js` — pure, new, read by both sides.** A fixed 60° × 45°
  grid: 6 columns × 4 rows, 24 cells. `cellKey(i, j)` is `x<i>y<j>`;
  `cellBounds(i, j)` is `[west, south, east, north]`; `cellOf(lon, lat)`;
  `cellsFor(bbox)` returns the keys a viewport box overlaps, wrapping
  correctly across the seam M39 chose. Keys are `x0y0`…`x5y3` and carry no
  sign, so no file name begins with a hyphen and no cell key needs escaping
  in a URL. It imports nothing and touches no DOM (`tests/site.test.mjs`
  imports every module under `src/` in Node).
  **The grid is not a tile scheme**: there is one grid at one resolution,
  and which cell a reader fetches is decided by the box on screen, never by
  the zoom.

## 2. What is written, and where

```
data/geo/land-present.json          the far coastline: rebuilt from 10 m, same name, same shape
data/geo/base/coast/x2y2.json       the near coastline, one file per non-empty cell
data/geo/base/rivers-world.json     the far river network
data/geo/base/rivers/x2y2.json      … and its cells
data/geo/base/lakes-world.json      data/geo/base/lakes/<cell>.json
data/geo/base/physical-world.json   data/geo/base/physical/<cell>.json
data/geo/base/mountains-world.json  data/geo/base/mountains/<cell>.json
data/geo/base/cities-world.json     data/geo/base/cities/<cell>.json
```

Six layers, two levels each. The **far** level is one file for the whole
world, simplified hard, and is what the reader sees before a cell arrives.
The **near** level is full detail, cut on the grid, fetched a cell at a time
as the viewport enters one. **A cell with nothing in it is not written and is
not in the manifest**: nothing is drawn that has no data, and an empty ocean
cell is not worth a file and a request.

- **The coastline replaces `data/geo/land-present.json` and keeps its name,
  its shape and its manifest key.** It stays a `FeatureCollection` of polygon
  features; `readLandFiles` still finds it by the `land-<epoch>.json`
  pattern; `manifest.land` keeps its `{ epoch, file, from, to }` shape;
  `loadAtlas` still fetches it before the first paint; and
  **`src/map/layers/land.js` is not touched in this run**. What changes is
  its contents: 10 m land, simplified to the far budget, which puts back the
  small islands 110 m drops — Malta, Bahrain, the Maldives, the smaller
  Azores — without costing much more than the 126 KB it costs today. The
  reserved `data/geo/land-<epoch>.json` line in `### Reserved ○` is not
  spent here: this is one more `present`, not a second epoch.
- Every file is written with `serializeGeo` — canonical key order, compact,
  one trailing newline — as `build-regions.mjs` and `cshapes.mjs` write
  theirs. Two runs over the same inputs produce byte-identical files, and a
  test asserts it.
- Coordinates are quantised and geometry simplified with `simplifyArc`,
  `simplifyGeometry` and `pruneGeometry` from `src/util/simplify.js`.
  Nothing new is written there: `MIN_DETAIL` is what keeps Malta from
  becoming a line, and one tolerance for the whole world would delete it.
- **Points are not polygons.** Cities, peaks and physical-region labels are
  arrays of small objects — `{ id, name, nameLocal, lon, lat, z, … }` — and
  not GeoJSON `Point` features: a `FeatureCollection` around four thousand
  cities is about a third scaffolding. The manifest's layer entry says which
  shape a layer is in (`"geometry": "polygon" | "line" | "point"`) and M37
  dispatches on that.
- **Per-feature zoom.** Every feature carries `z`, the zoom from which it is
  worth drawing, from Natural Earth's own scale rank where the file has one
  and from the fallback rule where it does not. Per-layer thresholds are in
  the manifest; per-feature thresholds are in the data. Neither is in code.

## 3. The layers, one by one

| layer | source file | what is kept |
|---|---|---|
| `coast` | `ne_10m_land.geojson`, `ne_10m_minor_islands.geojson` | every land polygon; minor islands only if the budget holds after everything else |
| `rivers` | `ne_10m_rivers_lake_centerlines.geojson` | every centreline; `z` from its scale rank |
| `lakes` | `ne_10m_lakes.geojson` | every lake polygon; `z` from its scale rank |
| `physical` | `ne_10m_geography_regions_polys.geojson` | deserts, plains, peninsulas, basins, and ranges as polygons |
| `mountains` | `ne_10m_geography_regions_elevation_points.geojson` | peaks as points with their elevation, where the file gives one |
| `cities` | `ne_10m_populated_places.geojson` | **population over 100 000**, plus every populated place a `data/places/` record names, whatever its population |

The population property is chosen from what the committed file actually has,
named in the table the run writes into `STATUS.md`; a place with no
population figure is kept only if a place record names it. If
`ne_10m_geography_regions_elevation_points.geojson` turns out not to carry
elevations, the run says so and `mountains` is the `Range/mtn` features of
the regions polys alone — it does not invent a height.

**"Plus every place the atlas names"** is decided by
`data/imports/naturalearth-places.json` (review finding 26), in the shape
`data/imports/cshapes-actors.json` already has: keyed by Natural Earth's own
`ne_id`, each entry `{ "place": "<place id>" }`. M36c writes it by matching
on `wikidata` first, then on an exact fold of the name **only where one
candidate survives**, and lists every place record it could not match and
every ambiguous candidate in `docs/naturalearth-places.md` for a person to
resolve. **A match is never guessed.** A place record with no Natural Earth
city is not an error: it gets no city feature, and M38 labels it from the
place record.

`data/imports/` holds more than one kind of file and `tools/lib/read.mjs`
dispatches on `kind`, so this is `kind: "import-places"` against a new
tool-side `schema/v1/import-places.json`, validated by `tools/validate.mjs`
as the other two are, and named in `CLAUDE.md`'s layout tree and in
`ARCHITECTURE.md`'s reserved list.

## 4. The manifest

`tools/build-index.mjs` gains one block, built by a `readBaseLayers` in
`tools/lib/read.mjs` that scans `data/geo/base/` the way `readPresenceShards`
scans `data/geo/presences/`. The builder never invents a file name and never
names a file that is not on disk.

```json
"base": {
  "source": "natural-earth-10m",
  "version": "v5.1.2",
  "grid": { "lon": 60, "lat": 45, "columns": 6, "rows": 4 },
  "layers": [
    { "id": "coast", "geometry": "polygon", "world": null, "minZoom": 1,
      "cells": [ { "key": "x2y2", "file": "geo/base/coast/x2y2.json", "bytes": 148213 } ] },
    { "id": "rivers", "geometry": "line", "world": "geo/base/rivers-world.json", "minZoom": 1,
      "cells": [ … ] }
  ]
}
```

- Paths are relative to `data/`, with the `geo/` prefix, exactly as `land`,
  `palette` and `presenceShards` already are.
- `coast` has `world: null` because its far level **is** `manifest.land`,
  where `loadAtlas` already fetches it; a second copy under `base` would be
  the same coastline twice.
- `bytes` on every cell, so M37 can decide without a HEAD request and so a
  reviewer reading `manifest.json` can see what the map costs without
  walking a directory.
- `layers` in a fixed order, `cells` sorted by key. `node tools/validate.mjs
  --index` compares the manifest byte for byte, so any non-determinism here
  fails the build.
- **A dataset with no `data/geo/base/` gets no `base` key at all** — not an
  empty one. Absent is what says "no base map", exactly as an absent
  `presences` key says there are none and an absent `categoriesAllowed`
  says "no check" (`ARCHITECTURE.md` ~1641–1644, ~1755–1758). A test asserts
  the absent case over a dataset built in a temporary directory.
- **`manifest.schema` goes from 6 to 7** in M36a, because the index gains a
  shape. `src/data.js`'s `assertGeneration` and every fixture manifest go
  with it in the same commit, and `ARCHITECTURE.md`'s two mentions of the
  generation are corrected to 7 while the run is there (they say 5 today,
  which is already a revision behind).

**The fixtures get a base map of their own.** `tests/fixtures/data/geo/` has
presence shards and lane polygons and borrows only the coastline
(`src/main.js` passes the real `land-present.json` under `?fixtures=1`).
M36a writes a hand-sized `tests/fixtures/data/geo/base/` — two cells, three
rivers, one lake, one physical region, one peak, four cities — so that M37's
browser tests draw a base map over the synthetic graph, and rebuilds
`tests/fixtures/data/index/` in the same commit
(`tests/build-index.test.mjs` pins it byte for byte).

## 5. The budget, and the ceiling

`--budget` prints the table below **before writing anything**, with the
measured column filled in, and the tool **exits non-zero without writing a
file** if `data/geo/` in total would exceed **15 MB** or `data/geo/base/`
would exceed **8 MB**. The budget is a per-layer, per-level cap (review
finding 24): a layer over its cap is simplified harder — the tolerance
raised a step and the table reprinted — before anything is dropped.

| layer | far, world | near, all cells | total |
|---|---|---|---|
| coast | 200 KB | 2,600 KB | 2,800 KB |
| rivers | 200 KB | 1,200 KB | 1,400 KB |
| lakes | 150 KB | 700 KB | 850 KB |
| physical | 250 KB | 750 KB | 1,000 KB |
| mountains | 100 KB | 350 KB | 450 KB |
| cities | 200 KB | 800 KB | 1,000 KB |
| **base map** | **1,100 KB** | **6,400 KB** | **7,500 KB** |

`data/geo/` today is 4.7 MB: presences 4,504 KB, `regions.json` 216 KB,
`land-present.json` 123 KB, `palette.json` 4 KB. 4.7 + 7.5 = **12.2 MB of
the 15 MB ceiling**, leaving 2.8 MB, which is what M43's territories before
1886 will have to fit in. The run prints both numbers and writes both into
`STATUS.md`.

**The order of sacrifice, when the budget is blown**, is decision 9's own and
is not re-argued here: peaks, then rivers, then lakes, then the smaller
cities, then the physical-region polygons. The coastline and the cities over
100 000 are never sacrificed. Whatever was sacrificed is printed, written
into `STATUS.md`, and is a numbered deviation — never a silent trim.

**First paint.** The only base map bytes before the first picture are
`land-present.json`, capped at 200 KB against the 123 KB it is today.
`index.html` fetches manifest + core + sources = 123,543 B, plus land and
palette = 253,552 B whole (`ARCHITECTURE.md` ~2517); after M36 that becomes
at most about 330 KB, which is still an order of magnitude under decision
9's "first view under 1 MB". `tests/spine-pages.test.mjs`, which holds what
each page fetches before it draws against a real browser's own record of its
requests, is updated with the measured number in the same commit, and so is
the table in `## Scale, for the record`.

## What this run must not do

- **No network.** No `fetch`, no `curl`, no download step, no "if the file is
  missing, get it". A missing input is a stop.
- **Nothing is drawn.** `src/map/map.js`, `src/map/layers/*.js`,
  `src/main.js`, `src/state.js`, `index.html` and `src/style.css` are not
  touched. The one new file under `src/` is `src/map/grid.js`, which is pure
  and which nothing in the browser imports until M37.
- **No new hex value, no new size**: nothing here has a colour or a length in
  pixels.
- **No map library, no tile server, no runtime dependency, no build step.**
  These are our own vector files, from our own origin, in our own
  projection, generated by a Node script and committed. `ARCHITECTURE.md`
  records that as the boundary of the "no map tiles" rule and not an
  exception to it (owner, 5 September) — and since ARCHITECTURE.md has no
  paragraph stating the rule at all, this run writes one.
- **Do not touch the presences.** `data/geo/presences/`, `palette.json` and
  `data/geo/regions.json` belong to another import under another licence.
  Nothing from Natural Earth is merged into a CC BY-NC-SA file and nothing
  from CShapes into a public-domain one.
- **Do not add `vendor/` to `deploy.yml`'s allowlist.** The artifact must not
  grow by a byte of source data.
- Do not write a record of any kind. The only files written under `data/`
  outside `data/geo/base/` are `data/geo/land-present.json`,
  `data/imports/naturalearth-places.json` and the regenerated index.

## Tests

All offline, on fixtures, no browser needed except where said.

1. **`tests/grid.test.mjs`** — the 24 cells tile the world with no gap and no
   overlap; a point on a boundary lands in exactly one cell; `cellsFor` over
   a box crossing the seam returns the cells on both sides;
   `cellsFor(WORLD)` returns all 24; `cellBounds(cellOf(p))` contains `p`
   for a thousand seeded points.
2. **`tests/import-naturalearth.test.mjs`** — over a new
   `tests/fixtures/naturalearth/`: six tiny GeoJSON files (a two-polygon
   land, three rivers, one lake, two physical regions, one peak, five
   populated places, one of them under 100 000 and named by a fixture place
   record), written into a temporary directory with `mkdtemp` and removed
   with `t.after`, as `tests/bench-harness.test.mjs` does. Asserted: the
   plan is a pure function of the input; every layer is written; a cell with
   nothing in it is not written; the population filter keeps four and drops
   the fifth; the small town survives because the import map names it; a
   second run rewrites every file byte for byte; `--check` fails loudly on a
   source whose sha256 differs and writes nothing.
3. **`tests/features.test.mjs`** — the property table: a feature missing the
   name property is dropped and reported, never written with `undefined`;
   `z` comes from the scale rank where there is one and from the fallback
   where there is not; a name is carried through unchanged, because escaping
   is `esc()`'s job in the browser and not the import's.
4. **The budget** — a synthetic input that blows the ceiling makes the tool
   exit non-zero and write nothing, asserted by counting the files on disk
   after the failed run.
5. **`tests/build-index.test.mjs`** — the `base` block present and correct
   for the fixtures, **absent** for a dataset with no `data/geo/base/`,
   cells sorted, `bytes` matching the files on disk; `manifest.schema` 7;
   `manifest.counts` unchanged; the exact manifest assertion updated; the
   committed fixture index fresh.
6. **`tests/licensing.test.mjs`** — a row for `data/geo/base/` in
   `src/licensing.js`, `PD`, attribution Natural Earth, matching the
   `licenses` block of the manifest and the table at the head of
   `data/geo/LICENSE`. `data/geo/base/` is **not** an NC directory and
   nothing may imply it is; Natural Earth asks to be named nowhere and the
   card and entry-page attribution line is unchanged.
7. **`tests/site.test.mjs`** passes unchanged — which means `grid.js`,
   `naturalearth.mjs`, `features.mjs` and `grid.mjs` are named in
   `CLAUDE.md`'s layout tree **in the commit that adds them**, no module
   under `src/` needs a DOM to import, and no hex value was added.
8. **`tests/spine-pages.test.mjs`** — the first-paint byte count updated to
   what was measured, in the same commit as the new coastline.
9. `node tools/validate.mjs --index` byte-identical at the end of every
   sub-run; `data/index/` and `tests/fixtures/data/index/` rebuilt in the
   same commit as anything that changes them.

## The three sub-runs

Each gated on the previous done line (run protocol §1), each a few hours.

- **M36a — the tool, the grid, the budget and the coastline.**
  `src/map/grid.js`, `tools/import/grid.mjs`,
  `tools/import/naturalearth.mjs`, `tools/import/features.mjs`; `--survey`
  run and its property table written into `STATUS.md`;
  `data/geo/land-present.json` rebuilt from 10 m inside its 200 KB cap;
  `data/geo/base/coast/`; the `base` manifest block with one layer in it;
  `manifest.schema` 7; the fixture Natural Earth files and the fixture base
  map; `--budget`, `--check`; `data/geo/LICENSE`, `src/licensing.js`,
  `vendor/README.md`; tests 1, 2 (coast only), 3, 4, 5, 6, 7, 8, 9. Done
  line `M36a done`.
- **M36b — rivers, lakes, physical regions, mountains.** Four layers, both
  levels, inside their caps; test 2 extended; the budget table printed and
  recorded. Done line `M36b done`.
- **M36c — cities.** The population filter; `data/imports/naturalearth-places.json`
  and `schema/v1/import-places.json`; wikidata-first matching, the unmatched
  and the ambiguous listed in `docs/naturalearth-places.md`; the point
  shape; the final budget table, `du -sh data/geo` measured, both numbers in
  `STATUS.md`; `ARCHITECTURE.md` revision 23. Done lines `M36c done` and
  then `M36 done`.

## Done when

- `node tools/import/naturalearth.mjs --source vendor/natural-earth/10m`
  runs with no network of any kind and rewrites every file it owns byte for
  byte on a second run.
- `data/geo/base/` holds six layers at two levels; every cell in the manifest
  is a file on disk and every file on disk is in the manifest.
- `data/geo/land-present.json` is 10 m, under 200 KB, and
  `src/map/layers/land.js` is unchanged.
- `du -sh data/geo` is **at most 15 MB** and `data/geo/base` at most 8 MB,
  and both numbers, the per-layer table and anything sacrificed are in
  `STATUS.md`.
- `data/imports/naturalearth-places.json` validates, names no place twice,
  and every unmatched place record is listed in `docs/naturalearth-places.md`.
- `data/geo/LICENSE` has its Natural Earth 10 m paragraph — the files, the
  pinned tag, the URLs, the sha256 of each decompressed source, what the
  import changed, and that it is public domain — and `src/licensing.js`, the
  manifest's `licenses` block and `data/LICENSE`'s table say it three times
  alike.
- `ARCHITECTURE.md` is revision 23 with `data/geo/base/`, the grid, the two
  levels, the `base` manifest block, runtime simplification by zoom (which
  it has never recorded), the "our own vector files, our own origin, our own
  projection" boundary of the no-tiles rule, and the corrected
  `manifest.schema`; `CLAUDE.md`'s layout tree names every new module.
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set; nothing under `data/` changed but the four things listed
  above and the regenerated index.
- `STATUS.md` carries this run's deviations, numbered on from the last, and
  the literal line `M36 done`.

## Deviations this brief takes, numbered on from 506

The run copies these into `STATUS.md` as its own, with what actually
happened, and numbers anything further from 521.

513. **Natural Earth is committed, not fetched by an Action.** Decision 9 and
     review finding 23 put the download in a GitHub Action on an `import/**`
     branch, as the Wikidata import is. That is a workflow for a fetch that
     happens once: the owner's assistant commits the files under
     `vendor/natural-earth/10m/` with their checksums and the tool reads
     them with `--source`, exactly as `cshapes.mjs` does. No workflow is
     added. A future Natural Earth release is committed the same way.
514. **The sources are committed gzipped and read through `node:zlib`.**
     About 20 MB of GeoJSON becomes about 5 MB in the repository, and
     `gunzipSync` is in Node — no dependency, no build step, and the same
     move `data/geo/LICENSE` already documents for CShapes and `xz`.
515. **The far level is one file for the whole world, not a zoom pyramid.**
     Decision 9 says "sharded by zoom level and region"; two levels and one
     grid is what that is worth here. A pyramid is a tile scheme with a
     different name, and review finding 25 accepted the boundary only
     because these are our own files from our own origin.
516. **The grid is fixed at 60° × 45°, not derived from the lanes.** The
     region boxes in the manifest overlap heavily — Europe's is −180…180 —
     so cells keyed by lane would over-fetch most of the world.
517. **Cities, peaks and physical-region labels are point arrays, not
     GeoJSON.** A `FeatureCollection` around a point is about a third
     scaffolding, and none of the three is ever drawn as a shape.
518. **`coast` has no `world` file of its own.** Its far level is
     `manifest.land`, already fetched at first paint.
519. **A cell with no geometry is not written**, so the manifest is the list
     of cells that exist and M37 asks for nothing else. Nothing is drawn
     that has no data.
520. **The Natural Earth property table is read off the committed files, not
     assumed.** No property name reaches `features.mjs` that the run has not
     seen in the file in front of it, and the table it chose is in
     `STATUS.md`.

Run protocol: `docs/run-protocol.md` in full — the gate, the claim, a push
after every commit, validator and tests green at every commit, and
`M36a done`, `M36b done`, `M36c done`, `M36 done` each as its own line under
`## Milestones landed`.

## Amendments after review

Written 8 September 2026 by an independent Fable reviewer of the map block, against `origin/briefs-map` and `origin/m0` at 81e5bf1, with the owner questions answered as recommended (the ceiling is the base map's, 8 MB, with 24 MB for all of `data/geo/`; M39 split in two; one name on the face and no "local" name; the glyph drawn at the mark's diameter); the owner may overrule. **These override the body where they differ** (run protocol §3). The full review is `docs/review-2026-09-08-map-block.md`.

A0. §0: the sources are read gzipped through `gunzipSync`; `--check`
hashes the decompressed bytes against the values `vendor/README.md`
records (§0 of the review), never the plan's estimates.
A1. §1: the grid's origin is -180° in data longitudes, independent of the
seam; `cellsFor` wraps a box whose west is east of its east.
A2. §2: a cell is built with `clipToBox` from M39 per layer: `coast` is the
coastline as **lines** (`geometry: "line"`, the ring segments inside the
cell) drawn over `manifest.land`'s fill; `rivers` are lines clipped to the
cell; `lakes` and `physical` are whole features assigned to every cell
their bbox overlaps and never clipped, carrying a stable `id` so M37 draws
each once; points by cell. A cut edge is never part of a stroked ring.
A3. §2: strike "full detail". The near tolerance of each layer is whatever
its cap forces, starting at 0.005° and stepped up; `--budget` prints per
layer the tolerance, points kept and points dropped; both numbers go into
`STATUS.md` and the "what the import changed" paragraph of
`data/geo/LICENSE`.
A4. §2: `z` (and M38's `zl`) are in `k` — one frozen, monotone table in
`features.mjs` from Natural Earth's `min_zoom`/`scalerank`, everything kept
visible by `k = 16`, recorded in `STATUS.md`; `minZoom` in the manifest is
in the same unit.
A5. §3: `physical` keeps a frozen allow-list of `FEATURECLA` — `Range/mtn`,
`Desert`, `Plateau`, `Plain`, `Pen/cape`, `Peninsula`, `Basin`,
`Depression`, `Valley`, `Lowland`, `Delta`, `Isthmus`, `Foothills`,
`Tundra`, `Wetlands`, `Gorge`, `Geoarea` — and drops `Island`, `Island
group`, `Coast`, `Continent`, `Lake` and `Dragons-be-here`; `mountains` is
the elevation points, all 711 of which carry `elevation`, and the
"no elevations" fallback is struck.
A6. §3: a city feature carries `place: "<id>"` where
`data/imports/naturalearth-places.json` names one, because
`data/imports/` is not in the artifact; the browser never fetches it. A
city's fields are `id` (`ne_id`), `name` (`NAME`), `nameEn` (`NAME_EN`,
only where it differs), `lon`, `lat`, `pop`, `z`, `zl`, `wikidata`, `place`.
A7. §1: `src/util/simplify.js` gains `simplifyLine(line, { tolerance,
decimals })` over `simplifyArc`, tested; the import uses it for rivers and
the coast lines.
A8. §4: `manifest.schema` is one more than the gate commit's; the fixture
base map covers the fixture places' box (lon -35…-9, lat 0…45) and its
`coast` cells are lines.
A9. §5: the ceilings `--budget` enforces are base map ≤ 8 MB and
`data/geo/` ≤ 24 MB; the "2.8 MB for M43" sentence is struck.
A10. Tests: `tests/spine-pages.test.mjs` holds request names, not bytes —
it gains "no `geo/base/` request on any page's first paint"; the measured
first-paint bytes go into `STATUS.md` and the Scale table only.
A11. Deviations are numbered on from the last in `STATUS.md` at the gate.

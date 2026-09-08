# Review of the map block plan and its four briefs

Read on 8 September 2026 against `origin/briefs-map` (plan, M36, M37, M38,
glyphs) and `origin/m0` at 81e5bf1 (I6 claimed twice, not done; last
deviation 506; `manifest.schema` 6; ARCHITECTURE.md revision 22, 2,904
lines). Nothing was edited or committed. Line numbers are `origin/m0`'s.

## 0. What was reproduced

- `du -sh data/geo` = **4.7M**: presences 4,504,038 B over five shards
  (774–1,114 KB each), `regions.json` 221,050, `land-present.json` 125,938,
  `palette.json` 4,071. The plan's table is right.
- `category`: **175 of 421** events — 151 `election`, 13 `disaster`, 6
  `death`, 5 `treaty`. Right. It is an attribute column today
  (`src/spine.js:308`), not a core one (`:269-278`). Right.
- First paint today: manifest 29,584 + core 63,223 + sources 33,681 =
  **126,488 B**, + land + palette = **256,497 B**. The plan's 123,543 /
  253,552 are one index run stale (the manifest now carries
  `officesByEvent` and `tenuresByOffice`). Close, but write the measured one.
- **The vendored sources are 2.5x the plan's estimates.** Measured under
  `scratchpad/vendor/`, raw then `gzip -9`:

  | file | raw | gz -9 | plan said (raw) |
  |---|---|---|---|
  | `ne_10m_land` | 10,157,965 | 3,570,577 | ~8 MB |
  | `ne_10m_minor_islands` | 1,320,514 | 304,148 | ~1.5 MB |
  | `ne_10m_rivers_lake_centerlines` | 7,307,743 | 2,270,558 | ~2.5 MB |
  | `ne_10m_lakes` | 5,043,554 | 1,564,433 | ~2.5 MB |
  | `ne_10m_geography_regions_polys` | 5,583,870 | 2,022,233 | ~1.5 MB |
  | `ne_10m_geography_regions_elevation_points` | 862,686 | 184,806 | ~0.06 MB |
  | `ne_10m_populated_places` | **19,359,003** | 2,751,441 | ~3.5 MB |
  | 110m countries + land | 976,886 | 260,672 | ~1.1 MB |
  | `cshapes_2_gw.topojson` (sha256 matches `SOURCE_FILE_SHA256`) | 7,621,704 | 2,842,191 (xz: 2,080,548) | — |
  | **total** | **58.2 MB** | **15.8 MB** | "~20 MB → ~5 MB" |

  `populated_places` carries 137 properties per city, which is where the
  16 MB went. Committed form: gzipped, as the plan says — `gunzipSync` is in
  Node and a gzipped blob is stored by git as-is, so the repository grows by
  15.8 MB once (13.7 MB if CShapes keeps its upstream `.xz`, but Node has
  no xz and `cshapes.mjs` reads a plain file, see F2). **This does not touch
  the 15 MB ceiling**: `vendor/` is not under `data/` and is not in
  `deploy.yml`'s allowlist (`.github/workflows/deploy.yml:96-107` copies
  named paths only), so the artifact does not grow by a byte. What it does
  touch is every clone, for ever (owner question 4: still "stay").
- Points in the 10m files, which is what the budget is really about:
  land **446,175** (11 features — one MultiPolygon per scalerank, up to
  2,773 polygons each, one hole in the whole file), rivers 256,387
  (1,455 MultiLineStrings, 1,367 named), lakes 162,852 (1,355), physical
  regions 192,270 (1,047), peaks 711 (all with `elevation`), cities 7,342
  of which **3,085 have `POP_MAX` > 100 000** and 7,192 carry `WIKIDATAID`.
- Properties the run would have surveyed: rivers `scalerank min_zoom
  min_label name name_en`; lakes and peaks the same in lower case plus
  `wikidataid ne_id` and 26 `name_<lang>`; regions polys `FEATURECLA NAME
  SCALERANK MIN_LABEL MAX_LABEL WIKIDATAID NE_ID`; cities `NAME NAMEPAR
  NAMEALT POP_MAX SCALERANK LABELRANK MIN_ZOOM WIKIDATAID NE_ID NAME_EN`.
  There is **no "local name" column** anywhere: `NAME` is the conventional
  name, `NAME_EN` the English one, and the rest are 26 fixed languages.

## 1. What is sound

- The order M39 → glyphs → M36 → M37 → M38 and the reason for it (the seam
  first, the control's halves built once). Gates and done lines match
  `docs/run-protocol.md`; `I9 done` is the literal I9 writes
  (`docs/index2/i9-brief.md:155`).
- Committing the sources instead of an Action (deviation 513): no network
  in a run is true, `build-regions.mjs` already takes `--source`, and
  `cshapes.mjs` already pins a sha256 and refuses on a mismatch (`:41,
  :554`).
- The grid as data, `cellsFor` from the viewport and not the zoom, one
  implementation re-exported to the tools as `simplify.mjs` is (516).
  `manifest.regionBoxes.europe` really is -180…180, so lane-keyed cells
  would be wrong.
- Point layers as arrays, `z` per feature in the data, `minZoom` per layer
  in the manifest, `bytes` per cell, an absent `base` key for "no base map".
- `coast` far level = `manifest.land`, and `land.js` untouched by M36.
- One layer module, `pointer-events: none`, nothing above the hierarchy,
  the swatch-and-glyph control as the only legend, a missing cell dropped
  quietly (the presences' note is for a *false* picture).
- One label placer, greedy skip-not-nudge, priorities 0/1/2, sizes and
  halos divided by `k` as `events.js:435-436` does; `.mark-label` kept.
- Glyphs as `<use>` beside a `<circle>` that stays the control (A2's three
  conditions); `currentColor`; no glyph on a cluster; the timeline glyph
  through `reuse` (`timeline.js:544`, `tests/timeline-browser.test.mjs:150-208`).
- `category` into the core: right call. A toggle must act on the frame it
  is clicked; the column is one small integer with `absent: OMIT`, so the
  trailing trim keeps it free on the 246 events without one — under 1 KB.
- Licensing: `src/licensing.js:51-55` and `data/geo/LICENSE` already
  separate PD from NC per path, and `tests/licensing.test.mjs:39-47` will
  hold a `data/geo/base/` row to the other two tables. Natural Earth is PD;
  CShapes stays in its directories. Sound as written.
- `vendor/` outside the allowlist, `tests/workflows.test.mjs:168-182` pinning
  the allowlist lines.

## 2. Findings, most serious first

**F1. Nothing cuts a polygon into a cell, and the briefs never say how.**
`ne_10m_land` is eleven features; assigning features to cells by bounding
box puts the Eurasian MultiPolygon into every cell it touches, so the near
coast is the world written 24 times and no cap holds. M39's
`splitAtMeridian` cuts at one meridian only. `src/util/simplify.js` has
no clipping and `tools/import/topojson.mjs` none. The same is true of the
physical-region polygons and the large lakes. A run reaching M36a would
have to invent rectangle clipping with holes and winding on its own, and
the cut edges then show: a polygon clipped to a cell is filled *and
stroked* (`src/style.css:567` gives `.land` a cobalt stroke), so every
cell border draws a straight cobalt line across a continent. Amendment:
M39 writes `clipToBox(geometry, [w, s, e, n])` in
`tools/import/geometry.mjs` — Sutherland–Hodgman per ring against the
four edges, holes kept, degenerate rings dropped, a line cut into the
segments inside the box — and `splitAtMeridian` becomes that function over
the two half-worlds; M36 decides per layer what a cell holds: **coast** —
the coastline as *lines* (the ring segments inside the cell, `geometry:
"line"`, stroke only) over the far polygon's fill, so no cut edge is ever
stroked; **rivers** — lines clipped to the cell; **lakes** and
**physical** — whole features by bbox overlap, never clipped, deduplicated
by `id` at draw time in M37, because a dashed hairline along a cell edge
would be a border that does not exist; **points** — by cell. Tests: the
clipped fixture land's cells have no ring crossing a cell edge, and the
union of the cells' line lengths equals the world's to 1e-6.

**F2. `cshapes.mjs` cannot read what the plan tells the assistant to
commit.** It reads a plain file and hashes those bytes
(`tools/import/cshapes.mjs:485, :554`); the plan commits
`vendor/cshapes/cshapes_2_gw.topojson.gz` and says M39 "re-runs the
import at the new seam". A run stops at the sha check or writes a second
reader. Amendment (M39, three lines): a `--source` ending in `.gz` is
`gunzipSync`'d and the sha256 is of the decompressed bytes, so
`SOURCE_FILE_SHA256` and `data/geo/LICENSE`'s recorded hash stay; the
Natural Earth tool does the same; `vendor/README.md` records raw and
gzipped sizes from §0 and not the plan's estimates.

**F3. "Near = full detail" cannot fit the caps.** At ~16 bytes per point
quantised to three decimals, full-detail near levels are about coast 7.1
MB, rivers 4.1 MB, lakes 2.6 MB, physical 3.1 MB against caps of 2,600 /
1,200 / 700 / 750 KB — 3 to 4x over on every polygon layer. The tool's
"raise the tolerance a step" will land inside the caps, but the owner is
being promised 10 m and will get roughly a quarter of its points, which is
about 50 m's detail plus the islands 110 m drops. Not a reason to change
the caps; a reason to say it. Amendment: strike "full detail"; the near
tolerance is whatever the cap forces, is printed per layer beside the
point counts kept and dropped, and is written into `STATUS.md` and
`data/geo/LICENSE`'s "what the import changed".

**F4. `z` and `minZoom` have no unit, and Natural Earth's is the wrong
one.** NE's `min_zoom` is web-Mercator tile zoom; the atlas's `k` is a
multiplier over a 960-unit world (`map.js:26-30`), so NE zoom ≈
log2(k) + 1.9, and `DEEPEST_ZOOM = 40` (`cluster.js:24`) is NE zoom 7.2.
Measured: 2,059 of the 3,085 cities over 100 000 have `MIN_ZOOM` ≥ 6,
641 rivers and 471 lakes are `min_zoom` 7 — mapped literally, most of the
base map never appears at the deepest zoom the map allows. Worse, today
`k = 1` is not the world at all: the projection is `fitBounds` over the
events' extent (`map.js:57`), so a threshold in `k` moves with the data.
M39 item 4 makes the initial view the world; nothing says `k = 1` is
*defined* as it. Amendment: M39's Done-when adds "k = 1 is the whole world
in 960 units, and that is the unit every zoom threshold in the data is
written in"; `features.mjs` carries one frozen, monotone table from
NE `scalerank`/`min_zoom` to `k` with everything kept visible by `k = 16`,
recorded in `STATUS.md`; `manifest.base.layers[].minZoom` is in `k`.

**F5. Rivers are lines and nothing here draws or simplifies a line.**
`geometryPath` handles Polygon/MultiPolygon only and closes every ring
with `Z` (`src/map/layers/land.js:8-20`); `simplifyGeometry` and
`pruneGeometry` likewise (`simplify.js:139-183`). M37 §1 says line
geometry "is `geometryPath`" — a run following it draws closed rivers, or
nothing. Amendment: M36 adds `simplifyLine` (over `simplifyArc`) to
`src/util/simplify.js`; M37 adds `linePath` beside `geometryPath` in
`land.js` (no `Z`), dispatched on the manifest's `geometry`; both tested.

**F6. The category filter is written nowhere.** `parseState` keeps
`events:<id>` (`state.js:105, :250`) and `formatState` writes the list
as it stands (`:292`), but no view reads a token: `emphasis.js`,
`layers/events.js`, `timeline.js`, `graph-view.js`, `lanes.js` never
mention it, and `main.js:202` writes the checked boxes as the list and
does not do A11's "replace `events` by one `events:<id>` per category
still on". The glyph brief says "`state.js` needs nothing" (true) and
names no module for the filter, so a run puts it in the map alone and the
timeline keeps drawing the bars. Amendment: the filter is one removal in
`workingSet` (`src/emphasis.js:70`), applied where the lens is, so the
three views and the corner count agree; `main.js`'s change handler writes
the A11 token set; `tests/emphasis.test.mjs` holds both.

**F7. Schema and deviation numbers are fixed where they must be
relative.** M36 says `manifest.schema` "goes from 6 to 7" and the glyph
run, which runs first, also bumps it; I6–I9 are still landing and may
bump it too. The plan fixes deviations 507–535 while `STATUS.md` is at 506
with four index runs still to write theirs. Amendment: every brief says
"one more than the gate commit's" and "numbered on from the last in
`STATUS.md` at the gate".

**F8. The first-paint test does not hold a byte count.**
`tests/spine-pages.test.mjs:65-90` asserts request *names* (no `spine-`,
no `geo/regions.json`), never bytes; "updated with the measured number" is
a false assumption. Amendment: the number goes in `STATUS.md` and the
Scale table; the test gains one line — no `geo/base/` request on any
page's first paint.

**F9. The browser cannot read `data/imports/`.** `deploy.yml:102` removes
it from the artifact, and M38 lists `data/imports/naturalearth-places.json`
among what the label layer reads. Amendment: M36c writes `place: "<id>"`
onto the city feature at import; nothing in `src/` fetches `data/imports/`.

**F10. The fixtures cannot carry the tests as written.**
`tests/fixtures/data/` has no `categories.json`, its manifest has no
`categoriesAllowed`, one fixture event has a category; the fixture places
sit in the Atlantic (lon -35…-9, lat 0…45, one at 100, -60), so a fixture
base map must cover that box and its `coast` cells will draw over the
*real* coastline `main.js:37` passes under `?fixtures=1`. Amendment: the
glyph run adds `tests/fixtures/data/categories.json` (three ids) and three
categorised events; M36a's fixture base map is placed over the fixture
places' box and its fixture `coast` is lines, per F1, so it reads as a
second coastline and not a second continent.

**F11. `historicalNames` has no data, and "local name" has no column.**
0 of 26 places carry `historicalNames`; M38 forbids new fields on records,
so the dated-name path runs on a fixture only — fine, but say so, and
"a city with a dated name … labelled by the year" in Done-when cannot be
shown on the real data. For "local": Natural Earth has `NAME` and
`NAME_EN` plus 26 fixed languages, and "the local language" per city is a
judgement the import must not make. Amendment: face = the dated name or
`NAME`; title = `NAME_EN` where it differs, then every dated name with its
years; no "local" until the i18n overlay decides a language. Owner
question 6 is answered this way.

**F12. The physical layer as briefed draws the coast a third time.**
`FEATURECLA` in the regions polys: 295 `Island`, 160 `Island group`, 37
`Coast`, 7 `Continent`, 3 `Lake`, 1 `Dragons-be-here`, against 222
`Range/mtn`, 58 `Desert`, 72 `Plateau`, 30 `Plain`, 57 `Pen/cape`…
Amendment: `features.mjs` keeps a frozen allow-list of classes and drops
the rest; `mountains` is the 711 elevation points (all carry
`elevation`) and the brief's "if it carries no elevations" fallback is
struck.

**F13. M37 hides part of one path.** "The far path underneath is hidden
for those cells" — `land.js:28` draws every land feature as **one**
`<path>`; nothing can hide a cell's share of it. With F1 the near coast is
a stroke over the far fill and nothing is hidden; what remains is the far
stroke under the near one, 0.2° coarse against 0.01° fine, visibly doubled
at `k = 8`. Amendment: `.layer-land` loses its stroke once every cell
`cellsFor(view)` names is in hand and gets it back when one is not; the
near stroke is the coastline from then on.

**F14. The glyph is drawn at six pixels and asked to read at ten.** The
mark is `r = 5 / k` (`events.js:33`), so a 6-unit glyph is 6 screen
pixels with a 1-pixel stroke; twelve line-art symbols are not tellable at
that size and the brief's own standard is ten. Amendment: the glyph's box
is the mark's diameter (10 units), stroke 1, the mark's fill its ground;
the owner judges the contact sheet (question 11) at that size, and a
larger `MARK_RADIUS` is the owner's to ask for.

**F15. M39 is one run doing five things, and F1 adds a sixth.** Seam
report, projection parameter, clipping, every geometry file recut, the
shared-arc border format and `about.html`. The border work is independent
of the seam and changes the shard format, which is its own review surface.
Amendment (owner): split into M39a — projection parameter, `clipToBox`,
`splitAtMeridian`, seam report, every file recut, wrapping `?bbox=`, `k = 1`
= the world — done line `M39a done`; and M39b — inland-only borders and
the arc list — `M39b done`, then `M39 done`. The glyph run's gate stays
`M39 done`.

**F16. Small things a run would trip on.** (a) `detailFor` is already
exported (`presences.js:47`): import it, do not "move" it. (b) The grid's
origin is -180 in data longitudes, not the seam, or a seam change moves
every cell; say so. (c) ARCHITECTURE.md line references in the briefs are
off by 30–40 lines (Scale is at 2472, Reserved at 2125, the tree at 805);
cite headings. (d) M37's "if the glyph run has not landed" contingency
invites building the details twice; the order is fixed, strike it. (e)
`about.html:327` says "there is no legend"; the new sentence must say "no
legend by colour". (f) `tests/map-browser.test.mjs:340, :508` open
`?layers=land,events` and `?layers=events` — after M37 both mean "no base
map", which is what the plan accepts (question 9); the tests still pass.
(g) The manifest's `bytes` are raw; Pages serves gzipped, so a reader
downloads about a third — say which the budget counts (raw).

**F17. The 2.8 MB "left for M43" is not enough for M43 as briefed.**
`docs/m43-brief.md` §M43a asks for a border snapshot at least every fifty
years from 1415, in presence shards under `data/geo/presences/`; CShapes'
shards run 775–1,114 KB per period, so ten snapshots are 5–9 MB, not 2.8.
Owner question 1 and 2 together: read decision 9 literally — 15 MB is the
**base map's** ceiling ("a per-layer, per-zoom output budget") and the
base map is held to 8 MB of it — and give `data/geo/` a total of its own,
recorded, with M43 budgeted in its brief. Recommended: base map ≤ 8 MB,
`data/geo/` total ≤ 24 MB, both printed by `--budget`.

## 3. Owner questions, one answer each

1. Ceiling: **the base map's** (F17), with a separate recorded total for
   `data/geo/`. 2. Base map stays at 8 MB; M43 gets its own line. 3. **M39
   first**, and M39 writes the clipper (F1), split in two (F15). 4. Sources
   stay, at 15.8 MB and not 5 (§0). 5. 200 KB coastline: yes. 6. One name
   on the face; `NAME_EN` in the title; **no "local"** (F11). 7. `category`
   into the core: yes. 8. Toggles for the categories in use: yes. 9. Old
   `?layers=` links read as "these only": accept. 10. Marine polys: not now.
   11. Glyphs judged after the run, drawn at ten units (F14). 12. This is
   that review; M36 and M37 need no second one if the amendments below are
   appended.

## 4. Verdict

**Proceed with amendments.** F1, F2, F4, F5 and F6 are the ones a run
alone could not recover from; F7–F13 are wrong assumptions that would cost
a run an afternoon each; F14, F15 and F17 need the owner. Against the seven
considerations: scale holds (cells by viewport, nothing at first paint,
`bytes` in the manifest); exploration and portability hold (data in JSON,
thresholds in data, no library); contributors are untouched; review is
easier once `--budget` prints tolerances and point counts (F3); robustness
is where the clipping (F1) and the unit (F4) were about to break it.

## Amendments after review

### map-block-plan.md

A0. §3's "the sources become ~5 MB" reads: the seven 10 m files are 49.6
MB raw and 12.7 MB gzipped, `populated_places` alone 19.4 MB raw; with the
110 m pair and CShapes the commit is **15.8 MB** gzipped. `vendor/README.md`
records the measured raw and gzipped size and sha256 of every file.
A1. §4: `tools/import/cshapes.mjs` and `tools/import/naturalearth.mjs`
accept a `--source` ending in `.gz`, decompress it with `gunzipSync`, and
hash the decompressed bytes, so every recorded sha256 is of the file as
downloaded.
A2. §2: M39 is two gated sub-runs — **M39a** (projection parameter,
`clipToBox`, `splitAtMeridian` as two clips, the seam report, every geometry
file recut, wrapping `?bbox=`, and the contract that `k = 1` is the whole
world in 960 units) and **M39b** (inland-only borders and the shard's arc
list); done lines `M39a done`, `M39b done`, `M39 done`.
A3. §3 and §5 question 1: the 15 MB ceiling is the base map's, held to 8
MB; `data/geo/` as a whole has a recorded total of 24 MB, printed by
`--budget` beside the base map's; M43 carries its own budget in its brief
and does not inherit "2.8 MB".
A4. §7: deviations are numbered on from the last in `STATUS.md` at each
run's gate, never from 507; every "manifest.schema n to n+1" in the briefs
reads "one more than the gate commit's".
A5. §5 question 6: one name on the face — the dated name where a place
record gives one for the year, else Natural Earth's `NAME` — and in the
title `NAME_EN` where it differs plus every dated name with its years;
there is no "local name" until the i18n overlay names a language.
A6. §6: `k = 1` is the whole world at 960 units and every zoom threshold in
the data (`z`, `zl`, `minZoom`) is written in `k`, converted from Natural
Earth's `min_zoom`/`scalerank` by one recorded table.

### m36-brief.md

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

### m37-brief.md

A0. §1: `"line"` geometry is drawn by a new `linePath` in `land.js` (no
`Z`), `"polygon"` by `geometryPath`, `"point"` by circles; `detailFor` is
imported from `presences.js`, where it is already exported, not moved.
A1. §1: a feature that arrives in more than one cell (lakes, physical) is
drawn once, keyed by `id`.
A2. §2: nothing is hidden per cell. The far coastline keeps its fill; its
stroke (`.layer-land path`) is switched off when every cell
`cellsFor(view)` names for `coast` is in hand and switched back on when one
is not, and the near `coast` lines are the coastline from then on.
A3. §3: strike item 4's contingency; the glyph run precedes this one by the
plan's order and the "events by category" details is found built.
A4. §4: `?layers=` semantics unchanged; the category filter itself is the
glyph run's, in `workingSet`, and this run does not touch it.
A5. `manifest.schema` and deviations as in the plan's A4; ARCHITECTURE.md
is cited by heading, not by line.
A6. `about.html`'s sentence reads "no legend by colour; the layer control
is the legend for everything else".

### m38-brief.md

A0. §3: the three kinds of name are two. Face: the dated name from
`historicalNames` for the window's far end, else `NAME`; title: `NAME_EN`
where it differs from `NAME`, then every dated name with its years. No
"local name" and no `NAME_<lang>` is read until the i18n overlay names a
language.
A1. §3: no real place carries `historicalNames` at the gate (0 of 26); the
dated path is proven on a fixture place and `STATUS.md` says so; nothing
on the real map is dated until somebody writes one.
A2. §2: `zl` is in `k` by M36's table (from `min_label`/`LABELRANK` where
the file has one, `z + 1` otherwise).
A3. The reading list drops `data/imports/naturalearth-places.json`; the
place id is on the city feature.
A4. Tests: `tests/spine-pages.test.mjs` asserts request names only.

### glyphs-brief.md

A0. §4: the filter is written in this run — one removal in `workingSet`
(`src/emphasis.js`), applied where the lens is, so the map, the timeline,
the graph and the corner count agree; `main.js`'s checkbox handler writes
A11's token set (`events` replaced by one `events:<id>` per category still
on); `tests/emphasis.test.mjs` holds the rule that an uncategorised event
is removed by no category token.
A1. §2: the glyph's box is the mark's diameter — 10 units at `k = 1`,
divided by `k` — stroke 1, the mark's fill its ground; six units is struck.
A2. Tests: `tests/fixtures/data/categories.json` is added with three ids
and three fixture events take one each; the fixture manifest then carries
`categoriesAllowed` and `categories`.
A3. `manifest.schema` is one more than the gate commit's; deviations are
numbered on from the last in `STATUS.md` at the gate.

# The map block — order, gates, budget and what the owner must decide

Five runs turn the atlas's map from a scatter of dots on a 110 m coastline
into a map: a Pacific-centred projection with borders that do not double the
shore (**M39**, already written), a symbol per category over the marks
(**glyphs**, deferred out of M30b), Natural Earth 10 m turned into sharded
vector files (**M36**), those files drawn with zoom thresholds under a layer
control that is the legend (**M37**), and every one of them named (**M38**).

Written 8 September 2026 from `docs/plan-2026-09-05.md` decisions 8, 9, 10,
13 and 14, `docs/review-2026-09-05-plan.md` findings 23–27,
`docs/m30b-brief.md` A2/A11/A12, `docs/m39-brief.md`, `docs/m43-brief.md` and
the code as it stands on `m0` after M30–M32b, the world merge and the index
cycle. The four new briefs are `docs/m36-brief.md`, `docs/m37-brief.md`,
`docs/m38-brief.md` and `docs/glyphs-brief.md`; `docs/m39-brief.md` is
integrated as written and is not rewritten here.

## 1. The order, and why it is not the plan's

The plan of 5 September lists M36 → M37 → M38 and puts the projection (M39)
and the glyphs somewhere after. **The order here is:**

> **M39 → glyphs → M36 → M37 → M38**

- **M39 first, because it decides where the world is cut.** M39 makes the
  central meridian a parameter, chooses the seam by measurement, writes
  `splitAtMeridian`, and **regenerates every geometry file in the
  repository** at that seam — `land-present.json`, the presence shards, the
  lane polygons, the palette. If M36 ran first it would write 7.5 MB of base
  map at meridian 0 and M39 would cut all of it again, and `naturalearth.mjs`
  would need its own seam-splitter written before `splitAtMeridian` existed.
  Running M39 first means the base map is cut once, at the final seam, by a
  function that is already there and already tested. M39 also settles the
  inland-only borders, so M37 draws its layers under territories whose look
  is final.
- **The glyphs second, because they are small, independent of every byte of
  geometry, and they own half of the layer control.** M30b A12 puts the
  category toggles inside a collapsed `<details>`, and M37 rebuilds the
  control around the base map's layers. Building the control twice is the
  only real cost of getting this wrong; the glyph run builds the "events by
  category" group and M37 adds "base map" beside it. The glyph run also
  needs nothing that does not already exist: M32b gave 175 events a
  category on 6 September.
- **Then M36 → M37 → M38 in the plan's own order**, each strictly gated: M37
  cannot draw a file M36 has not written, and M38 cannot label a dot M37
  does not draw.

**The fallback**, if the owner wants M36 first: it costs one full
regeneration of `data/geo/base/` inside M39 (the tool is offline and
idempotent, so it is one command and a large diff) and a seam-splitter
written twice. It does not cost correctness. The gate lines below would run
M36 → M37 → M38 → glyphs → M39 unchanged.

## 2. The runs, their gates and their done lines

| # | run | gate line on `origin/m0` | done line | scope in one line |
|---|---|---|---|---|
| 1 | **M39** | `I9 done` (the index cycle's last) | `M39 done` | the seam chosen by measurement, the projection parameterised, every geometry file recut, borders stroked on their inland arcs only |
| 2 | **glyphs** | `M39 done` | `glyphs done` | `category` into the core, twelve `<symbol>`s, a `<use class="glyph">` over each mark and at each bar's left, the category toggles that are the legend |
| 3a | **M36a** | `glyphs done` | `M36a done` | the import tool, `src/map/grid.js`, the budget printer, `land-present.json` rebuilt from 10 m, the `coast` cells, the `base` manifest block |
| 3b | **M36b** | `M36a done` | `M36b done` | rivers, lakes, physical regions, mountains — both levels, inside their caps |
| 3c | **M36c** | `M36b done` | `M36c done`, then `M36 done` | cities over 100 000 plus every place the atlas names; `data/imports/naturalearth-places.json` |
| 4a | **M37a** | `M36 done` | `M37a done` | `src/map/layers/base.js`: six layers under the territories, zoom thresholds from the manifest, cells by viewport |
| 4b | **M37b** | `M37a done` | `M37b done`, then `M37 done` | `LAYERS` widened, the control rebuilt from the manifest with two collapsed groups, the phone drawer, `?layers=` |
| 5a | **M38a** | `M37 done` | `M38a done` | `src/map/labels.js`, one label round in `map.js`, city labels by their modern names |
| 5b | **M38b** | `M38a done` | `M38b done`, then `M38 done` | dated names from `historicalNames`, local names in the title, physical-feature labels |

Every run follows `docs/run-protocol.md` in full: the gate polled from a
shell loop, the claim committed alone and pushed, a push after every commit,
validator and tests green at every commit, the done line as its own line
under `## Milestones landed`, and **stop** — never start the next run.

If the index cycle's last done line is not `I9 done` when this block starts,
M39's gate is whatever that line actually is; the shepherd's order is
39, glyphs, 36a, 36b, 36c, 37a, 37b, 38a, 38b, complete at `M38 done`.

## 3. The byte budget

Everything under `data/` is copied into the deploy artifact
(`deploy.yml`: `cp -r data/. _site/data/`, minus `data/imports/`), so the
ceiling is a promise about what a reader downloads and about what the free
hosting carries.

**The base map, per layer and per level** — `naturalearth.mjs --budget`
prints this before it writes anything and exits non-zero without writing if a
cap or a ceiling would be crossed:

| layer | far, one world file | near, all cells | total |
|---|---|---|---|
| coast | 200 KB (`land-present.json`) | 2,600 KB | 2,800 KB |
| rivers | 200 KB | 1,200 KB | 1,400 KB |
| lakes | 150 KB | 700 KB | 850 KB |
| physical | 250 KB | 750 KB | 1,000 KB |
| mountains | 100 KB | 350 KB | 450 KB |
| cities | 200 KB | 800 KB | 1,000 KB |
| **base map** | **1,100 KB** | **6,400 KB** | **7,500 KB** |

**`data/geo/` as a whole**, which is what the 15 MB ceiling is about:

| | today | after M36 |
|---|---|---|
| `presences/` (CShapes, five shards) | 4,504 KB | 4,504 KB |
| `regions.json` (lane polygons) | 216 KB | 216 KB |
| `land-present.json` | 123 KB | ≤ 200 KB |
| `palette.json` | 4 KB | 4 KB |
| `base/` | — | ≤ 7,300 KB |
| **total** | **4.7 MB** | **≤ 12.2 MB** |
| **headroom under the 15 MB ceiling** | 10.3 MB | **2.8 MB, which is M43's** |

**First paint is what actually matters to a reader**, and it barely moves:
`index.html` fetches manifest + core + sources = 123,543 B, plus land and
palette = 253,552 B whole today; after M36 that is at most about 330 KB. No
base map cell, no far file and no label is fetched before the first picture,
and `tests/spine-pages.test.mjs` holds it against a real browser's own record
of its requests. Decision 9's "first view under 1 MB" holds with room to
spare.

**The order of sacrifice when a cap is blown** is decision 9's own and is not
re-argued: peaks, then rivers, then lakes, then the smaller cities, then the
physical-region polygons. The coastline and the cities over 100 000 are never
sacrificed, and anything sacrificed is printed, recorded in `STATUS.md` and
numbered as a deviation.

## 4. What the owner's assistant must do by hand, before M39 and M36

**A run has no network.** Natural Earth cannot be downloaded by a run, and
neither can CShapes. Review finding 23 answered this with a GitHub Action on
an `import/**` branch, as the Wikidata import has; for a fetch that happens
once, that is a workflow to maintain for no gain. The files are committed
instead, by the owner's assistant, on a machine with a network, before the
runs start.

Everything goes under a new top-level `vendor/`, which is **inputs, never
data, never served**: it is not in `deploy.yml`'s allowlist and must never be
added to it.

### Before M39 — CShapes, because M39 re-runs its import at the new seam

```sh
mkdir -p vendor/cshapes
git clone --depth 1 https://github.com/cran/cshapes /tmp/cshapes
xz -dc /tmp/cshapes/inst/extdata/cshapes_2_gw.topojson.xz > /tmp/cshapes_2_gw.topojson
sha256sum /tmp/cshapes_2_gw.topojson   # must be 9f73468bb56aae6a6b22bb5e56bf5f3e013b9ee17c641aba37db97bcb5c1c3bc
gzip -9 -c /tmp/cshapes_2_gw.topojson > vendor/cshapes/cshapes_2_gw.topojson.gz
```

The sha256 above is `SOURCE_FILE_SHA256` in `tools/import/cshapes.mjs` and is
already recorded in `data/geo/LICENSE`. **If it differs, stop and tell the
owner**: it means the dataset changed under a pinned name and M39 must not
recut the borders on a file nobody has compared.

### Before M39 — Natural Earth 110 m, for the seam report

`tools/build-regions.mjs` downloads these today and takes `--source <dir>`
instead. Base URL for every file below:

`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/`

| file | target path | expected size (raw) |
|---|---|---|
| `ne_110m_admin_0_countries.geojson` | `vendor/natural-earth/110m/` | ~ 0.7 MB |
| `ne_110m_land.geojson` | `vendor/natural-earth/110m/` | ~ 0.4 MB |

### Before M36 — Natural Earth 10 m, the base map itself

Same base URL, same tag `v5.1.2` — the tag `tools/build-regions.mjs` already
pins as `NATURAL_EARTH_VERSION` and `data/geo/LICENSE` already names.

| file | target path | expected size (raw) | which layer |
|---|---|---|---|
| `ne_10m_land.geojson` | `vendor/natural-earth/10m/` | ~ 8 MB | coast |
| `ne_10m_minor_islands.geojson` | `vendor/natural-earth/10m/` | ~ 1.5 MB | coast (if the budget holds) |
| `ne_10m_rivers_lake_centerlines.geojson` | `vendor/natural-earth/10m/` | ~ 2.5 MB | rivers |
| `ne_10m_lakes.geojson` | `vendor/natural-earth/10m/` | ~ 2.5 MB | lakes |
| `ne_10m_geography_regions_polys.geojson` | `vendor/natural-earth/10m/` | ~ 1.5 MB | physical, and ranges |
| `ne_10m_geography_regions_elevation_points.geojson` | `vendor/natural-earth/10m/` | ~ 0.06 MB | mountains |
| `ne_10m_populated_places.geojson` | `vendor/natural-earth/10m/` | ~ 3.5 MB | cities |

**The sizes in these two tables are expected orders of magnitude and nothing
more.** The assistant records the true byte count and sha256 of every
decompressed file, and the briefs' `--check` verifies **those recorded
values** and never a number written here.

```sh
BASE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson
mkdir -p vendor/natural-earth/10m vendor/natural-earth/110m
cd vendor/natural-earth/10m
for f in ne_10m_land ne_10m_minor_islands ne_10m_rivers_lake_centerlines \
         ne_10m_lakes ne_10m_geography_regions_polys \
         ne_10m_geography_regions_elevation_points ne_10m_populated_places; do
  curl -fsSL "$BASE/$f.geojson" -o "$f.geojson"
done
sha256sum *.geojson > SHA256SUMS      # of the DECOMPRESSED files: that is what --check reads
wc -c *.geojson >> SIZES
gzip -9 *.geojson                      # ~20 MB of GeoJSON becomes ~5 MB in the repository
```

…and the same for `110m` with its two files. Then write
**`vendor/README.md`**: what each file is, the URL it came from, the pinned
tag, its sha256, its raw and gzipped size, its licence — Natural Earth is
**public domain**, "free of any licence restrictions in any way", and CShapes
is **CC BY-NC-SA 4.0** and stays isolated — and the two sentences that say
`vendor/` is inputs, is never served, and is never added to `deploy.yml`'s
allowlist. Commit it all in one commit on `m0` before M39 is claimed.

**Why gzipped.** The sources are read through `node:zlib`'s `gunzipSync`,
which is in Node: no dependency, no build step, about 5 MB in the repository
instead of about 20, and the same move `data/geo/LICENSE` already documents
for CShapes and `xz`.

## 5. Owner questions, with a recommended answer each

Each is followed unless the owner overrules; overruling any of them is a
small, named change to one brief.

1. **Is the 15 MB ceiling for the whole of `data/geo/`, or for the base map
   alone?** — *Recommended: the whole of `data/geo/`.* `deploy.yml` copies
   all of `data/` into the artifact, so the number a reader and the hosting
   see is the total. The base map is capped at 8 MB inside it, which leaves
   2.8 MB for M43's territories before 1886.
2. **Is 2.8 MB enough for M43, or should the base map be cut to 6 MB now?**
   — *Recommended: leave the base map at 8 MB.* M43 is a second import with
   its own budget and its own order of sacrifice, and cutting a map nobody
   has seen yet to protect a map nobody has designed yet is guessing twice.
3. **M39 first, or the plan's M36 first?** — *Recommended: M39 first*, for
   the argument in §1. The cost of the other order is one full regeneration
   of `data/geo/base/` and a seam-splitter written twice.
4. **Do the Natural Earth and CShapes sources stay in `vendor/` for ever, or
   are they removed once the base map is built?** — *Recommended: they
   stay.* About 5 MB gzipped, never served, and a base map nobody can
   regenerate is a base map nobody can correct — which is the whole argument
   `data/imports/cshapes-actors.json` is built on.
5. **The coastline at first paint: 200 KB, against the 123 KB it is today?**
   — *Recommended: 200 KB.* What 10 m buys at world scale is the small
   islands 110 m drops — Malta, Bahrain, the Maldives, the smaller Azores —
   and the Azores are why a place record needs a `region` override today.
6. **A city's label: one name on the map, or the modern and the local name
   together?** — *Recommended: one name on the face* — the dated name for
   the year on the band where a place record gives one, the modern name
   otherwise — with the modern, the local and every dated name in the
   hover. Two names on twenty-four labels is an unreadable map.
7. **Does `category` move from the attribute shards into the core?** —
   *Recommended: yes.* A category toggle must narrow the map on the frame it
   is clicked, and an attribute column arrives with its century. It is one
   small integer per categorised event.
8. **Do the category toggles list the categories in use, or all twelve?** —
   *Recommended: the ones in use.* Four of the twelve match a record today
   (151 `election`, 13 `disaster`, 6 `death`, 5 `treaty`); eight toggles that
   hide nothing are eight lies about what the atlas holds. The manifest
   gains `categories` beside `roles`, which already carries exactly that
   meaning against `rolesAllowed`.
9. **An old `?layers=` link will turn the new base layers off.** A link that
   named a subset before rivers existed reads as "these and nothing else". —
   *Recommended: accept it.* The alternative makes turning a base layer off
   inexpressible in the URL, nothing is published yet, and no such link is in
   circulation.
10. **Marine features — bays, seas, capes — in the physical layer?** —
    *Recommended: not in M36*, land only. The budget is tight, the atlas
    draws no marine event, and `ne_10m_geography_marine_polys` is another
    1.5 MB. It is a named follow-on, and for an atlas of maritime expansion
    it is a good one.
11. **The twelve glyphs.** The run draws them and the owner judges them by
    eye off `docs/screens/glyphs-legend.png` — which twelve shapes, and
    which to redraw. — *Recommended: judge after the run*, as
    `STATUS.md`'s "Next" item 5 already reserves the map's labels and merge
    distance for the owner. Redrawing one is one `<symbol>` and no test.
12. **Does an independent Opus review of these four briefs run before M36?**
    The plan asks for one ("M36 — base map data … Opus review of the
    brief"). — *Recommended: yes, of `docs/m36-brief.md` and
    `docs/m37-brief.md` together*, since the manifest block and the loading
    discipline are where a mistake is expensive. Each brief carries an
    "Amendments after review" hook, empty, which overrides its body where
    they differ.

## 6. What the whole block must not do

The hard constraints of `CLAUDE.md` are not re-argued by any of these runs
and none of them may be broken quietly:

- **No map library, no tile server, no API key, no runtime dependency, no
  build step.** These are our own vector files, from our own origin, in our
  own projection, generated by offline Node scripts and committed.
  `ARCHITECTURE.md` records that as the *boundary* of the "no map tiles"
  rule and not an exception to it (owner, 5 September) — and since
  `ARCHITECTURE.md` today states the rule nowhere at all, M36 writes the
  paragraph.
- **No network in a run**, ever, for any reason.
- **No new hex value and no new type size.** Every colour is a variable in
  `src/style.css`; every text size comes from the scale there.
- **Nothing above the emphasis hierarchy**: territory hue under the selected
  actor's cobalt under the walked chain's madder. Nothing the base map draws
  is clickable, focusable or in the tab order, and a click on a river,
  a lake, a city dot or a label behaves exactly as a click on the sea.
- **Nothing drawn that has no data.** A cell with no geometry is not written;
  a layer with no manifest entry is not drawn; a category with no record has
  no toggle; a city with no dated name is not given one because the year
  suggests it.
- **Every module named in `CLAUDE.md`'s layout tree, in the commit that adds
  it.** `tests/site.test.mjs` fails the run's own commit otherwise. The new
  modules across the block are `src/map/grid.js`, `src/map/layers/base.js`,
  `src/map/labels.js`, `src/map/glyphs.js`, `tools/import/naturalearth.mjs`,
  `tools/import/features.mjs` and `tools/import/grid.mjs`.
- **The licences stay apart.** Natural Earth is public domain and asks to be
  named nowhere; CShapes is CC BY-NC-SA 4.0 and stays in its own
  directories. Nothing derived from one is merged into the other, in either
  direction, and `data/geo/LICENSE`, `src/licensing.js` and the manifest's
  `licenses` block say the same thing three times.

## 7. Deviations this plan takes, numbered on from 506

Each brief carries its own block, numbered on from these: M36 takes 513–520,
M37 521–526, M38 527–531, the glyph run 532–535.

507. **The order is M39 → glyphs → M36 → M37 → M38**, not the plan of 5
     September's M36 → M37 → M38 with the projection and the glyphs after.
     The argument is §1: M39 decides where the world is cut and regenerates
     every geometry file, and the glyph run owns half the layer control M37
     rebuilds.
508. **`vendor/` is a new top-level directory** in a repository whose tree
     `ARCHITECTURE.md` enumerates. It is inputs — never data, never a
     record, never served, never in `deploy.yml`'s allowlist — and it gets
     one line in the tree saying exactly that.
509. **The 15 MB ceiling is read as covering the whole of `data/geo/`**, not
     the base map alone. Decision 9 says "15 MB ceiling on disk" of the base
     map's own layers; `deploy.yml` copies all of `data/` into the artifact,
     so the honest ceiling is the total, and the base map gets 8 MB of it.
510. **The glyph run is a milestone with no number**, its done line the
     literal `glyphs done`. It was deferred out of M30b rather than planned,
     and giving it M36's or M39's number would make the plan's own list
     wrong.
511. **`docs/map-brief.md` is superseded for everything the base map
     touches.** It is the map's first brief, 2 September, written against
     `ARCHITECTURE.md` revision 4; its clustering and level-of-detail
     arguments stand and its account of what the map draws does not.
512. **These four briefs were written without the Opus review the plan asks
     for.** They were written by an independent pass over the code, the plan
     and the two reviews; each carries an empty "Amendments after review"
     hook, and owner question 12 is whether that review runs before M36.

## Amendments after review

Written 8 September 2026 by an independent Fable reviewer of the map block, against `origin/briefs-map` and `origin/m0` at 81e5bf1, with the owner questions answered as recommended (the ceiling is the base map's, 8 MB, with 24 MB for all of `data/geo/`; M39 split in two; one name on the face and no "local" name; the glyph drawn at the mark's diameter); the owner may overrule. **These override the body where they differ** (run protocol §3). The full review is `docs/review-2026-09-08-map-block.md`.

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

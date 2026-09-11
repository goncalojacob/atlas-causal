# Build brief — I1: the presences out of the spine, the region boxes into the manifest

The first run of the second index cycle (`docs/index2-plan.md`, decisions D1
and D2). Two files leave the first paint: the 261 KB of presence metadata
that is 49.2 % of the spine on the real data, and the 221 KB of lane polygons
`index.html` fetches to compute four numbers per region. Nothing a reader
sees changes except that it appears sooner.

**Read**, in this order: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (§0 for the measurements, §2 D1/D2, §3, §4),
`docs/health-review-2026-09-06-result.md` §5.2.1, then
`src/validate/core.js` (`buildTopology`, `buildSpine`),
`tools/build-index.mjs`, `src/data.js` (`createAtlas`'s territory block,
`topologyFromSpine`, `loadAtlas`), `src/map/layers/presences.js`,
`src/panel/actor.js`, `src/util/geo.js` (`regionBounds`),
`tools/lib/read.mjs` (`readRegionPolygons`), and
`ARCHITECTURE.md` → "Index and manifest".

## The gate

Wait for the literal line `M30b done` on `origin/m0`, per run protocol §1.
Then claim `I1` under `## Milestones landed` as the protocol says.

## What this run must not do

- No new dependency, runtime or development. No build step beyond the
  committed output of a Node script already in `tools/`.
- No historical claim. Not a word of `summary`, `explanation`, `title`,
  `note` or `label` is written or changed.
- No record whose `review.status` is `reviewed` is touched. In fact **no
  record under `data/` is touched at all** except `data/index/`.
- No migration: `src/validate/migrate.js` gains nothing and
  `tools/migrate/apply.mjs` is not run.
- The fixtures' index is rebuilt with the repository's, in the same commit.
- `node tools/validate.mjs --index` byte-identical at the end;
  `node --test` green with `CHROME` set.

## 1. The presences leave the spine

`buildSpine` in `src/validate/core.js` stops emitting `presences`. A new
exported `buildPresenceIndex(topology)` returns `{ schema, presences }` with
exactly the entries `buildSpine` used to write — `actor`, `when`,
`geometry.key`, `dependencyOf`, `dependencyKind`, `capital`, `confidence`,
the envelope, `spineEntry` applied for tombstones — so the bytes that move
are the bytes that left.

`tools/build-index.mjs` writes it as `presences-<hash>.json`, names it in the
manifest as `files.presences`, and adds `presences` to the `HASHED` regex so
`readIndex`, `writeIndex` and `compareIndex` cover it. A dataset with no
presences writes **no file and no manifest key** — absent means "there are
none", the way an absent `rolesAllowed` means "no check" (M30a A8).

## 2. The atlas answers emptily until it lands

In `src/data.js`, everything the territory block builds — `presences`,
`presencesByActor`, `dependenciesOf`, the boundary list, `standingIn`,
`presencesAt` — moves behind a `loadPresences()` that follows the discipline
`loadGeometry`, `loadCiters` and `loadExplanations` already follow: one
request in flight, a rejection dropped rather than kept, the answer cached.
Before it lands:

- `presencesAt(year)` returns `[]`;
- `presencesByActor` and `dependenciesOf` are empty Maps;
- `presenceCoverage` and `territoryYear` are **unchanged**, because they are
  built from `manifest.presenceShards` and not from the records — the
  window's far end must not move while a file is in flight.

`topologyFromSpine` stops reading `spine.presences`; `createAtlasFromSpine`
takes an optional `presences` for a caller that already has them (the build
does). `atlas.loadPresences` joins the surface list.

`src/map/layers/presences.js` asks for `atlas.loadPresences()` where it
already asks for `atlas.loadGeometry(shard.file)` and redraws on arrival;
the layer's existing "territories could not be loaded" note covers a
rejection. `src/panel/actor.js:36-37` draws the territory section as the
source card draws its citers: a "loading" line, then the list, and nothing at
all where the actor has none.

## 3. The lane polygons leave the first paint

`tools/build-index.mjs` already reads `data/geo/regions.json` through
`readRegionPolygons` for `deriveRegion`. It now also runs `regionBounds` over
that collection and writes the result into the manifest as `regionBoxes`:
`{ <region id>: [minLon, minLat, maxLon, maxLat] }`, region ids in
`regions.json` order, numbers rounded to six decimals so the bytes are
stable. Five regions is about 200 bytes.

`loadAtlas` stops fetching `data/geo/regions.json` and builds `regionBoxes`
from the manifest instead. The `regions: false` parameter goes with the
fetch it controlled — `entry.html` and `contribute.html` passed it to avoid
221 KB that no longer exists — and its two call sites lose the argument.
A manifest with no `regionBoxes` gives an empty Map, which is what a dataset
with no polygons already got.

## 4. The version

`manifest.schema` becomes **2**. `src/data.js` gains one guard: a manifest
whose `schema` it does not know throws with the number it found and the
number it expected, rather than reading the file as though it were the old
shape. The known set is a single exported constant.

## Files this run touches

`src/validate/core.js` · `src/data.js` · `tools/build-index.mjs` ·
`src/map/layers/presences.js` · `src/panel/actor.js` · `src/main.js` and
`src/entry/main.js` / `src/contribute/main.js` (the `regions:` argument) ·
`CLAUDE.md` (the layout tree's `data/index/` lines) · `ARCHITECTURE.md`
("Index and manifest", the spine table, "Scale, for the record") ·
`data/index/` and `tests/fixtures/data/index/`, rebuilt.

**The hand tables**, each of which must be edited or the change is half
done: `HASHED` in `tools/build-index.mjs`; `manifestValue.files` and
`manifestValue.counts` in the same file; the `SURFACE` list in
`tests/spine-loader.test.mjs`; the manifest assertion in
`tests/build-index.test.mjs`; the spine's allowed-key table in
`tests/spine.test.mjs`; the `presences` case in `tests/bench/run.mjs`, which
reaches `atlas.presencesAt` through `realAtlas()` and must now await
`loadPresences()`.

## Tests

- `tests/spine.test.mjs`: the spine carries no `presences` key; the presence
  index carries every presence the topology has, with the same fields, in id
  order.
- `tests/spine-loader.test.mjs`, **unedited except for the `SURFACE` list**:
  an atlas from the index and an atlas from `buildTopology` are still the
  same atlas once the presences are loaded. This test is the proof that the
  reshape drops nothing and it is never edited to pass.
- `tests/data.test.mjs`: `presencesAt` answers `[]` before the file lands and
  the real answer after; `territoryYear` clamps identically before and after;
  a rejected presence fetch is retried on the next ask (the pattern
  `data.test.mjs` already asserts for a record and a geometry shard).
- `tests/build-index.test.mjs`: the manifest names `files.presences`,
  `regionBoxes` and `schema: 2`; a dataset with no presences writes neither
  the file nor the key; two builds are byte-identical;
  `writeIndex` removes a stale `presences-*.json`.
- `tests/geo.test.mjs`: the manifest's boxes equal `regionBounds` over the
  polygons, to the rounding.
- `tests/presences-layer.test.mjs` and `tests/actor-card.test.mjs`: the layer
  and the card ask for the file and draw when it arrives.
- `tests/spine-pages.test.mjs`: `index.html` no longer requests
  `geo/regions.json`; no page requests `presences-*.json` before the
  territory layer draws.
- `tests/prerender.test.mjs` and `--index`: `sources.html`,
  `narratives.html` and `entry/` are **byte-identical** to the committed
  files. If they are not, something was dropped.
- `tests/site.test.mjs`: `CLAUDE.md` names any module added.

## Done when

- `buildSpine` emits no presences and `presences-<hash>.json` exists, named
  in the manifest, with every presence in it.
- `index.html` fetches neither `geo/regions.json` nor the presence file
  before the territory layer draws, asserted in a browser test.
- The atlas's first-paint index bytes on the real data are **under 290 KB
  raw**, and the number is printed by the build and written into `STATUS.md`
  beside the old one.
- `presencesAt`, `presencesByActor`, `dependenciesOf` and the actor card's
  territory section behave as before once the file lands, and emptily before.
- `manifest.schema` is 2 and an unknown generation throws.
- `node tools/validate.mjs --index` byte-identical, with the prerendered
  pages unchanged; `node --test` green with `CHROME` set, the skipped count
  reported.
- `STATUS.md` records the run and the numbers, and carries the literal line:

`I1 done`

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

A0. **Gate and reading unchanged.** Check the gate commit for what M30b-2
did with `data/geo/regions.json` (m30b-brief A8, the regional wash) before
touching `loadAtlas`.

A1. **`tests/helpers.mjs` is a hand table.** `atlasOf` builds every test
atlas with `fetchJson: refuse`, so after this run `loadPresences()` rejects
in every card, lens and query suite and `tests/spine-loader.test.mjs:71`
fails on the run's own commit. `helpers.mjs` gains `presencesOnDisk(dataDir)`
beside `citersOnDisk` and `atlasOf` seeds the atlas with it, exactly as the
citers are seeded; `createAtlasFromSpine` takes the optional `presences` the
body already names. `spine-loader.test.mjs` itself is edited at `SURFACE`
only (which gains `loadPresences`).

A2. **The two writer pages fetch the presence file.** `src/review/main.js:87`
fetches the spine itself and hands `checkRules` a topology with
`presences: expanded.presences`; rule 17 and the referrer warnings
(`src/validate/rules.js:281-291`) read it. Both `review/main.js` and
`src/contribute/main.js` fetch `manifest.files.presences` when the manifest
names it, draw first, and rebuild the universe when it lands; a browser test
asserts the review editor warns exactly what the CLI warns on an imported
actor.

A3. **The generation guard lives in the loaders.** One exported
`assertGeneration(manifest)` in `src/data.js`, called by `loadAtlas`,
`loadSpine`, `loadSources`, `loadNarratives` and `src/review/main.js`, never
by `createAtlas` (tests hand it manifests by hand:
`tests/data.test.mjs:93`, `tests/spine-loader.test.mjs:242`). The fixture
manifest and every test manifest literal are bumped in the same commit.
From this run on the graph file's inner `schema` is the manifest's number,
so there is one number and not two.

A4. **The lane polygons stay reachable, on demand.** `atlas.loadRegionPolygons()`
- one request, cached, a rejection dropped - fetched only by whatever draws
a large event's wash (M30b-2) when one is in the window, and by nothing at
first paint. The browser test asserts no `geo/regions.json` request on the
default window, and one request on a window that holds a `regional` fixture
event if M30b-2 left one; if it left none, the second test is the unit test
of the loader.

A5. **The Done-when number, precisely.** The graph file alone (the spine
without presences) under 290 KB raw; the whole first paint - manifest,
spine, sources, land, palette - under 460 KB raw; both in `STATUS.md`
against 542.9 and 949.6. `manifestValue.counts.presences` stays: a count is
not a file.

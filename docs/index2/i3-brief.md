# Build brief — I3: the core and the attribute shards, emitted beside the spine

The third run of the second index cycle (`docs/index2-plan.md`, decisions D4
and D5). The index learns to write the split the whole cycle is for — a
**core** every page loads whole, and **attribute shards by century** fetched
for the window — and writes it **beside** the spine I2 built. Nothing
switches over: `loadAtlas` can read either, every page still reads the spine,
and the run ends by printing the bytes.

This is H3a's shape and for H3a's reason. The health cycle's own period
shards were cancelled because they were measured after they were built and
found to buy nothing; this run exists so that I4 is spent against a number
rather than against an argument.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (D4, D5, §3, §6 risks 1–4),
`docs/health/h3a-brief.md` and `docs/health-review-2026-09-06-result.md`
§1.3 item 1 and §5.2.1, then `src/validate/core.js`,
`src/data.js` (`createAtlas`, `topologyFromSpine`, `loadSpine`, `loadAtlas`,
`loadExplanations` — the never-wait discipline to copy),
`src/explanations.js` (the century boundaries and `shardName`),
`tools/build-index.mjs`, `src/emphasis.js`, `src/lanes.js`,
`src/graph-view/arrangement.js`, `src/util/window.js`.

## The gate

Wait for the literal line `I2 done` on `origin/m0`. Then claim `I3`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`.
- No historical claim; no record under `data/` touched except `data/index/`;
  no `reviewed` record touched; no migration consumed.
- **Nothing switches over.** Every page still reads the spine at the end of
  this run. `loadAtlas` gains a way to read the core and the shards and does
  not take it by default.
- **No field invented and none dropped.** The core and the shards together
  are exactly the spine, field for field. The test is that an atlas assembled
  from core + every shard equals an atlas assembled from the spine.
- The fixtures' index rebuilt with the repository's; `--index`
  byte-identical; `node --test` green with `CHROME` set.

## 1. Where the line falls

**The core** — loaded whole by every page, because the whole-graph guarantee
and every mark, bar and lane depend on it:

| Kind | Slots |
|---|---|
| every record | id, kind, status; the merges list (aliases and `supersededBy`) |
| event | year bounds (`start`, `end` as astronomical bounds — the numbers `overlaps` and the scales use), `place`, `region`, `weight`, `subtreeWeight`, `parent`, `actors[].actor` |
| edge | `from`, `to`, `type`, `confidence`, `status` |
| actor | `actorType`, year bounds |
| place | the point (`lon`, `lat`) and `region` |
| presence | (already its own file since I1) |
| relation, office, tenure, narrative | the two ids each joins and its year bounds |

**The attribute shards** — a file per century, fetched for the window, never
waited for:

`title`, `when` **verbatim** (the object, with `date`, `calendar` and the
record's own numbering — the core's bounds are for arithmetic and never
replace it), `revised`, `citesCount`, `wikidata`, `wikipedia`, `scope`,
`category`, each actor line's `role` and `note`, an actor's `name`/`names`,
a place's `name`/`names` and `where`'s `label` and `precision`, a relation's
and a tenure's `note`, an office's `title`, a narrative's `summary`,
`authors`, `window` and step refs.

A record is filed in the shard its **start year** falls in, on the same
century boundaries `src/explanations.js` already computes, so the two
sharding schemes cannot disagree; a record with no year at all goes in a
shard named `null` that is fetched with the first one. `shardName` and
`explanationShards` are the model and the naming; write the second pair
beside them or generalise the first, whichever leaves `explanations.js`
readable.

Why the joins are in the core and not the shards: `eventsByActor`,
`eventsByPlace`, the `actor:` and `place:` lenses and the actor card's list
are all **unwindowed**, and a join that arrived by century would answer half
a question. This is the rule I4 writes into `ARCHITECTURE.md`, and it is what
keeps the core honest rather than letting it grow.

## 2. What the build writes

`tools/build-index.mjs` gains, beside what it writes today:

- `core-<hash>.json` — schema, `ids`, `vocab`, `columns`, the lists above;
- `attributes-<from>-<to>-<hash>.json`, one per century;
- in the manifest, `files.core` and `attributeShards: [{ file, from, to }]`
  in year order, exactly as `explanationShards` is written;
- a printed report, on stdout, in the shape the page report already has: the
  core's bytes raw and gzipped, each shard's bytes, and the totals, for the
  dataset it was pointed at.

Both files go through `compact()`, `HASHED` learns both names, and
`writeIndex` prunes a stale shard. `manifest.schema` becomes **4**.

## 3. What the loader learns

`src/data.js` gains, without any page calling it yet:

- `loadCore({ dataRoot, fetchJson })` — the manifest and the core, cached the
  way `loadSpine` caches the spine;
- `loadAttributes(shard)` — one request in flight per shard, a rejection
  dropped rather than kept, the same discipline as `loadGeometry`,
  `loadCiters` and `loadExplanations`;
- `attributesFor(year)` / `attributeShardsIn(window)` — which shards a window
  needs, from the manifest's list;
- an **LRU over loaded shards with a stated cap of four**, so a session that
  scrubs across six centuries does not hold six centuries. The cap is one
  named constant with the reason beside it.
- `createAtlasFromCore({ core, attributes, presences, … })`, which assembles
  the same atlas `createAtlas` assembles, with an attribute absent standing
  for "not yet fetched": a title falls back to the id, `citesCount` to 0,
  `names` to `[]`, `when` to the core's bounds. **`atlas.attributesLoaded(id)`
  says which it is**, so a view can tell "no title" from "no title yet" and
  redraw rather than cache the fallback.

`loadAtlas` gains `{ from: 'spine' | 'core' }`, defaulting to `'spine'`.
Nothing passes `'core'` outside the tests in this run.

## Files this run touches

`src/validate/core.js` (`buildCore`, `buildAttributeShards` beside
`buildSpine`) · `src/data.js` · `tools/build-index.mjs` ·
`src/explanations.js` (the century boundaries shared, or a sibling that says
it is the same rule) · `ARCHITECTURE.md` (the index section gains the core
and the shards and the rule about joins) · `CLAUDE.md` (the `data/index/`
lines and any new module) · `data/index/` and `tests/fixtures/data/index/`,
rebuilt.

**The hand tables**: `SPINE_COLUMNS` gains `CORE_COLUMNS` and
`ATTRIBUTE_COLUMNS` beside it, and a test asserts that the union of the last
two is the first, per kind — that is the "nothing dropped, nothing invented"
check in the one place it can be made cheaply. Also `HASHED` and
`manifestValue.files` in `tools/build-index.mjs`, the `SURFACE` list in
`tests/spine-loader.test.mjs`, the manifest assertion in
`tests/build-index.test.mjs`.

## Tests

- `tests/spine.test.mjs`: for every kind, `CORE_COLUMNS ∪ ATTRIBUTE_COLUMNS =
  SPINE_COLUMNS`, with no overlap; a record is in exactly one shard, chosen
  by its start year; a record with no year is in the `null` shard.
- A new `tests/core-loader.test.mjs`: an atlas from the core plus **every**
  shard deep-equals an atlas from the spine, over the fixtures and over the
  repository — the same assertion `spine-loader.test.mjs` makes of the spine
  against `buildTopology`, and for the same reason. An atlas from the core
  alone answers the graph queries identically (`consequences`, `ancestors`,
  `convergence`, `reachableBy`, `shortestPaths`) and answers a title with the
  fallback and `attributesLoaded(id) === false`.
- The LRU: five shards fetched, four held, the fifth fetch of a dropped shard
  is a new request; a rejected shard fetch is retried on the next ask.
- `tests/build-index.test.mjs`: the manifest names `files.core` and
  `attributeShards`, `schema` is 4; two builds byte-identical; a stale shard
  is pruned; the printed report's totals equal the files' bytes.
- `tests/spine-pages.test.mjs`: **unchanged** — every page still fetches the
  spine and no page fetches the core. That is what "nothing switches" means.
- `tests/prerender.test.mjs` and `--index`: the prerendered pages
  byte-identical.

## The measurement, and the stop

The run ends by writing into `STATUS.md`, for both the repository's data and
the bench dataset built with `node tools/build-index.mjs --data <dir>`:

- the core's bytes raw and gzipped,
- each attribute shard's bytes,
- and the first-paint total the atlas would pay if it read the core.

**The threshold I4 is spent against** (`docs/index2-plan.md` §3): the core
must be **≤ 60 KB raw on the real data** and **≤ 2.0 MB raw / ≤ 320 KB
gzipped at 10⁴**. If it is not, this run does not go on to guess why: it
writes the numbers, says in one line that I4 should not run, and stops. The
cycle then ends at I2 with the corpus 5× lighter and the split unspent, which
is a better outcome than H3a's.

## Done when

- `core-<hash>.json` and the attribute shards are written, named in the
  manifest, pruned when stale, and byte-identical across two builds.
- An atlas from core + every shard equals an atlas from the spine, over both
  datasets, asserted.
- Every page still reads the spine and `tests/spine-pages.test.mjs` is
  unchanged.
- `manifest.schema` is 4.
- The bytes are printed by the build and written into `STATUS.md`, with a
  one-line verdict on whether the threshold is met.
- `node tools/validate.mjs --index` byte-identical, prerendered pages
  unchanged; `node --test` green with `CHROME` set.
- `STATUS.md` carries the literal line:

`I3 done`

# Build brief — H3a: the spine, built beside the old topology

Health cycle. Read `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md` (the index
and manifest section, "Scale, for the record"), `docs/run-protocol.md`,
`docs/health-plan-2026-09-05.md` (decision 1, milestones H3a–c),
`docs/health-review-2026-09-05-B.md` findings 1, 20, 21,
`docs/health-review-2026-09-05-A.md` findings 1, 26, and
`docs/review-2026-09-05-health-plan.md` findings 1, 2, 3, 18, 28(b), then
this file and its **Amendments after review** section if present. Code
only; `data/` records untouched; `data/index/` regenerated (this run owns
it — no other run may commit it while H3a runs).

## What the index becomes

`tools/build-index.mjs` emits, **in addition to** today's
`topology-<hash>.json` (nothing switches in this run):

| File | Read by | Carries |
|---|---|---|
| `spine-<hash>.json` | every page, whole | every record: `id`, `kind`, `status`, `aliases`, `wikidata`, `supersededBy`; events: `title`, `start`, `end` (astronomical), `place`, `region`, `weight`, `actors` (ids only), `citationCount`; actors: `name`, `actorType`, `when`; places: `name`, `where`, `region`; sources: `title`, `creators`, `year`, `kind`, `citationCount`; presences: `actor`, `when`, `geometry.key`, `dependencyOf`; relations: `from`, `to`, `type`, `when`; narratives: `title`, `authors`, `steps` (refs only); edges as `[from, to, type, confidence]`, the id synthesised as `from--to--type` on load |
| `shard-<period>-<hash>.json` | the atlas, entry, for the window | per event: `actors[].role`, `note`, `wikipedia`, `regionMethod`, `summary` (first sentence); per place: `capital`, `historicalNames` when they exist; per presence: `presenceType`, `confidence`, `capital` |
| `search-<hash>.json` | the search box, contribute, review | per record: id, kind, the folded search terms (title, names, aliases, Wikipedia titles, creators), years, place |
| `citers/<source-id>.json` | the source card, `retractionPlan` | the citing records and citation rows |
| `review-<hash>.json` | review.html | unchanged in this run |
| `sources-<hash>.json` | sources.html | bibliographic fields and `citationCount` only |

Tombstones (retracted, merged, superseded) keep `title`, `when`,
`wikidata`, `status`, `supersededBy`, `aliases` in the spine and nothing
else anywhere. The manifest lists every file with its hash and the
periods' bounds; `--index` byte-compares all of them. The periods: a
fixed table in the manifest chosen so that no shard exceeds ~250 KB on
this dataset (say, before 1800, 1800–1899, 1900–1949, 1950–1999, 2000 on),
and `tests/fixtures/data/` gains an event straddling a boundary.

## The loader

`src/data.js` gains `loadSpine()` and `loadShard(period)` beside
`loadAtlas()`, with the same cache and token discipline as `loadGeometry`,
and a `createAtlasFromSpine()` that yields the same `atlas` surface
(`activeEvents`, `edges`, `adjacency`, `resolve`, `eventsByActor`,
`citationCount`, …) so that `graph.js`, `horizon.js`, `lens.js` and the
views need no change. Nothing in this run calls it outside tests.

## Tests and docs

Round-trip tests: every field a card, a mark, a lane, a query or a rule
reads is reachable from spine + shard, asserted against the fixtures and
the real dataset; determinism; byte identity of the new files;
`retractionPlan` on a pre-fetched citers map; the search shard's terms
equal `search.js`'s today. `ARCHITECTURE.md`: the table above in the
index section, "Scale, for the record" rewritten with B's numbers and
the plan's decision 1. Sizes of every new file in `STATUS.md`.

Done when: the new files exist beside the old, `node tools/validate.mjs
--index` is byte-identical, every page still works unchanged, the tests
above pass, the literal line `H3a done`.

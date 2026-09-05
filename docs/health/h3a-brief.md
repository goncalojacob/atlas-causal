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

## Amendments after review

An independent Opus review of this brief on 5 September found the field
table wrong in nine places, the index's file machinery unchanged where it
must change, and the run too large for one sitting. These amendments
override the body where they differ (run protocol, §3).

**A0 — the run is split in two.** *H3a-1, the index emits the spine*: the
emitter, `citesCount`, the citer directory, the search shard, the file
machinery of A6, `node tools/validate.mjs --index` byte-identical, the
tests, `ARCHITECTURE.md` and `STATUS.md`. Done line `H3a-1 done`.
*H3a-2, the loader reads it*: `loadSpine()`, `createAtlasFromSpine()` and
the round-trip tests; nothing under `data/` changes and `data/index/` is
not rebuilt. Done line `H3a-2 done`. H3b waits for the second.

**A1 — an event's `when` is carried verbatim.** Not `start` and `end`.
`when` is an object: `{min,max}` bounds, `end: null` for ongoing, and
`date`, `endDate`, `calendar` for display. Fourteen readers need the
object, two of them validator rules that run in the browser —
`rules.js` `whenOf` (`when.date`, `when.calendar`) and rule 4 (the raw,
un-normalised `start` bound) — and the contribution form and the review
editor both run `checkRules` against a topology-shaped universe.
`lanes.js` draws an open-ended bar from `extent(when).max === null`.
Astronomical years are for arithmetic only and are never stored in place
of the record's own numbering: `formatYear` takes historians' years and
would print 1 BCE as "0". A pre-computed `x: [min, max|null]` in
astronomical years may sit *beside* `when`; never instead of it.

**A2 — an edge tuple is `[from, to, type, confidence, status]`.** Five
elements. `status` is read by `graph.js` (`buildAdjacency` skips inactive
edges, which is what keeps a retracted argument out of `consequences`,
`convergence` and `shortestPaths`), `lens.js`, `graph-view.js`,
`panel.js` (the intro's links count), `chain.js` and `rules.js`
(`activeEdges`); the fixtures already hold a retracted edge and
`build-index.test.mjs` pins the weight it must not contribute. An edge
that carries `aliases` or a `supersededBy` is written as a full object
instead, and the loader accepts either shape — those two feed
`createAtlas`'s alias map and `resolve()`'s merge hop, which is how an old
`?chain=` URL still opens. The synthesis of `from--to--type` is otherwise
sound: all 161 edge ids equal it exactly and no event id contains `--`.

**A3 — the corrected field table.** This replaces the table in the body.

*Every record in the spine*: `id`, `kind`, `status`, `aliases`,
`supersededBy`, `wikidata`.

| Kind | And |
|---|---|
| event | `title`, `when` (verbatim), `place`, `region`, `weight`, `actors` as `[{ actor, role }]` verbatim, `wikipedia`, `citesCount` |
| edge | the tuple of A2 |
| actor | `name`, `names`, `actorType`, `when`, `wikipedia`, `citesCount` |
| place | `name`, `names`, `where`, `region`, `wikipedia`, `citesCount` |
| presence | `actor`, `when`, `geometry.key`, `dependencyOf`, `dependencyKind`, `capital`, `confidence` |
| relation | `from`, `to`, `type`, `when`, `note` |
| narrative | `title`, `summary`, `authors`, `window`, `steps` (refs only) |

Sources are **not** in the spine. `atlas.sources` is the sources index
today and the source card fetches nothing; `citation.js` reads `type`,
`creators`, `year`, `title`, `container.{title,kind,volume,issue,pages}`,
`publisher`, `doi`, `isbn`, `url`, `repository`, `reference`, `accessed`
and `status`. `sources-<hash>.json` therefore keeps every bibliographic
field and `citationCount`, and loses only `citations`, which move to A7's
directory. The source's bibliographic type is `type`; `kind` is
`"source"` on every one of them.

Dropped from the index altogether, because nothing reads them:
`regionMethod` and `presenceType`. A first sentence of `summary` is not
written into any index file: every card fetches the record for its
summary, and derived prose in the index is the leak review A objected to.
If search wants summaries, they go in the search shard when H7 asks.

**A4 — no period shards in this run** (decision taken by the assistant on
the reviewer's evidence; the owner may overrule). The shards are the wrong
axis for the cards, which are per-entity and not windowed: `eventsByActor`
is built over every active event and the actor card prints the role beside
each; the actor card lists capitals across all periods; the map draws
presence `confidence` at the territory year, which is clamped to 2019; a
selected event is not clamped to the window. Measured on this dataset the
whole shard payload across all five periods is 288.6 KB — less than the
body's own 250 KB budget for one shard — so the split costs four cards and
buys nothing. The four small fields go into the spine (A3). Keep the
mechanism as a reserved line in `ARCHITECTURE.md` for a per-event field
that is genuinely large, and let H4c introduce it against a measurement.
Consequently: no `shard-<period>-<hash>.json`, no period table in the
manifest, and `tests/fixtures/data/` is **not** modified — see A5.

**A5 — the fixtures are not touched.** The fixture graph is twelve events
between 1200 and 1300; an event straddling 1800 would move `atlas.extent`
and with it every default window, the timeline scale, the graph layout and
`manifest.counts.events` (asserted exactly). If a boundary case is ever
needed it gets its own small dataset at `tests/fixtures/period/`, used by
the index tests only; `?fixtures=1` keeps pointing at `tests/fixtures/data/`.

**A6 — the file machinery changes, and the brief names it.** As it stands
`build-index.mjs`'s `HASHED` is `/^(topology|sources|review)-[0-9a-f]{12}\.json$/`
and `readIndex` reads nothing else, so `compareIndex` would report
`missing spine-<hash>.json` on every run: rule 16, exit 1, and with it
`deploy.yml`'s assert step, every batch of `import-wikidata.yml`, and two
index tests. This run therefore: widens `HASHED` to
`/^(spine|search|sources|review|topology)-[0-9a-f]{12}\.json$/`; makes
`readIndex` walk `data/index/` one level deep, including the citer
directory of A7, keyed by the path relative to `data/index/`; makes
`writeIndex` create any directory it needs and delete every file and
directory under `data/index/` that a fresh build does not name; extends
the `writeIndex` test to a nested name rather than relaxing its
`deepEqual`; leaves `manifest.counts` exactly as it is.

**A7 — the citers are one hashed directory, not 34 hashed files.**
`manifest.json` is fetched `no-store` on every page load; a file-per-source
entry with a hash each is 3 KB today and ~200 KB at 20k sources, and
unhashed names break the `immutable` convention. So:
`index/citers-<hash>/<source-id>.json`, where `<hash>` is over the
concatenation of every citer file's bytes in id order, named once in the
manifest as `files.citers`. The directory is immutable, `compareIndex`
compares all of it, and `writeIndex` removes any other `citers-*`
directory. `cshapes-2-0` alone holds 1,041 of the 1,933 citations, about
150 KB, so the source card renders the first 200 rows and offers the rest.
`retractionPlan` needs `citations[].kind` and `citations[].id` only.

**A8 — two counts, two names.** `citationCount` means two opposite things
today: `data.js` counts the citations a record *makes* (three card call
sites), while `core.js` counts the records that cite a *source*
(`bibliography.js`). In the spine the per-record number is **`citesCount`**,
on events, actors and places only. `citationCount` keeps its present
meaning and its present home on the source in `sources-<hash>.json`.

**A9 — what the search shard carries, and what its test asserts.** Per
entry: `id`, `kind`, `label`, `detail`, `terms` (folded), `weight`, `when`,
`status`. `buildSearchIndex` needs the label (event `title`, actor/place
`names[0]`, source `title`), the detail line (actor `actorType`; source
`creators`, `year`, `type`), `weight` for ranking, `when` for `startOf`
and for `formatInterval` in the results, and the variants from
`names.slice(1)`. The test asserts that the index built from the spine and
the search shard returns the **same ordered result list** as the index
built from the topology, for a fixed list of queries — `"sal"`, `"carn"`,
`"lisb"`, a source's creator surname and an event id prefix — not merely
the same term set. `findSimilar` keeps its inputs from the spine
(`title`, `id`, `aliases`).

**A10 — tombstones keep `place` and `region` too.** So: `title`, `when`,
`place`, `region`, `wikidata`, `status`, `supersededBy`, `aliases`. 175
events are retracted and reach a card with their own fields (`resolve`
hops *merged* silently), and the event card builds head and meta
unconditionally from `region`, the start year and `placeOf`. About 8 KB.

**A11 — the atlas surface `createAtlasFromSpine` must expose**, from an
audit of every reader under `src/`: `activeEvents`, `events`, `edges`,
`adjacency`, `actors`, `places`, `sources`, `relations`,
`relationsByActor`, `narratives`, `activeNarratives`, `narrativesByRef`,
`eventsByActor`, `eventsByPlace`, `placeOf`, `pointOf`, `citationCount`,
`resolve`, `record`, `regions`, `extent`, `land`, `presences`,
`presencesByActor`, `dependenciesOf`, `presencesAt`, `presenceCoverage`,
`territoryYear`, `shardForYear`, `loadedGeometry`, `loadGeometry`,
`hueOfActor`. Four members are used nowhere outside `data.js` and need not
be reproduced: `manifest`, `presenceShards`, `citationsOf`, `aliases`.
`loadAtlas`, `loadSources` and `loadNarratives` are unchanged in this run;
`loadNarratives` still reads the whole topology and H3b moves it.

**A12 — how the round trip is tested.** Not a hand-written field list,
which drifts. `tests/event-card.test.mjs`, `actor-card`, `place-card`,
`source-card`, `horizon`, `entry` and `graph` already build a real atlas
from `manifest.files.topology` and `.sources`, over both the fixtures and
the repository's own data. Parameterise them to run twice — once over
`createAtlas`, once over `createAtlasFromSpine` — and the equivalence is
proved by every assertion those suites already make. Add: determinism (two
builds byte-identical), byte identity of the new files through
`compareIndex`, `retractionPlan` on a pre-fetched citers map, and A9's
search test.

**A13 — the numbers go in `STATUS.md` as they are.** Measured on this
dataset: today's first-paint index is 906 KB (topology) + 329 KB (sources)
= 1,235 KB; the corrected spine is 522 KB and the sources index without
its citer rows is 30 KB, so 552 KB — a 682 KB saving on a 3.10 MB first
paint whose largest single item is an 880 KB presence geometry shard.
Gzipped, which is what Pages serves, the whole topology today is 66 KB, so
the saving over the wire is about 40 KB and about 20 ms of parse.
Projected on the 20k set from the measured per-record costs (417 B per
active event, 124 B per edge tuple, 267 B per actor) the spine is ~13 MB
against 33 MB measured today — a 2.5× improvement that still loads 13 MB
whole, so the wall moves from roughly 10k events to roughly 25k and does
not on its own reach the 20k target. Say that, rather than claiming a
saving the reader cannot feel. The next lever is that presences are
219 KB of the 522 KB spine — 42 % — and nothing needs them until the
territory layer draws; whether they leave the whole-corpus set for a
per-period presence index is deferred to H4a (assistant's decision; the
owner may overrule). `serialize()`'s two-space indent is left alone.

**A14 — done when.** For H3a-1: `spine-<hash>.json`, `search-<hash>.json`,
the citer directory and the amended `sources-<hash>.json` exist beside the
unchanged `topology-<hash>.json`; `node tools/build-index.mjs` twice is
byte-identical; `node tools/validate.mjs --index` is green and reports no
stale or missing file; `node --test` is green with no test edited to pass;
`ARCHITECTURE.md`'s index section carries A3's table and "Scale, for the
record" carries A13's numbers; `STATUS.md` carries the sizes; the literal
line `H3a-1 done`. For H3a-2: the parameterised suites of A12 pass over
both atlases; nothing under `data/` changed; the literal line
`H3a-2 done`.

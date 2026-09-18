# Closing review of the second index cycle

Written 9 September 2026 against `m0` at `3b8a9c2`, read-only, no network.
Reproduced here: `node tools/validate.mjs --index` (25.5 s, **0 errors,
1,056 warnings, 2,121 records, 829 drafts, 2,549 of 2,549 citations
unchecked**, and the index byte-identical to a fresh build);
`node tests/bench/run.mjs` (whole suite, ~2 min); the byte counts below,
`stat`ed on the working tree. This machine is roughly 5-30x slower than the
one `docs/index2-plan.md` section 0 was measured on (`clusterPoints` at 14k
points: 443 ms here against 15.3 ms there), so only **ratios** and **bytes**
are compared.

## 1. What the cycle set out to do, and what it delivered

The plan's object was the first consideration: `data/index/spine-*.json` was
a whole-corpus file every page parsed - 542.9 KB raw on the real data,
9.70 MB at 10^4 - and the whole-graph guarantee only needs
`[from, to, type, confidence, status]` plus a year and a status per event.
Ten gated runs (nine plus I4's split, plan A4) drew that line. Run by run,
against the plan's own thresholds:

| run | what it did | threshold | measured | met |
|---|---|---|---|---|
| I1 | presences out of the spine into `presences-<hash>.json`; `data/geo/regions.json` (221 KB) off first paint, replaced by `regionBoxes` in the manifest; `assertGeneration` in the loaders | graph file < 290 KB raw; first paint < 460 KB | 307.2 KB; 492.0 KB | **no** (dev. 420) |
| I2 | every record a positional row over the file's own id table, vocabularies as integers; `src/spine.js` and `SPINE_COLUMNS` | 175 KB raw real; 4.3 MB / 460 KB gz at 10^4 | graph file alone 158.9 KB, both files 293.3 KB; 3.65 MB / 429.1 KB | **partly** (dev. 426) |
| I3 | core and attribute shards emitted **beside** the spine, nothing switched; the measuring gate | core <= 60 KB real; <= 2.0 MB raw **and** <= 320 KB gz at 10^4 | 53,387 B (52.1 KB) / 14,767 gz; 2,016,667 B and **336,979 gz** | **no** on the gz row, by 2.9 % |
| I4a | `index.html`, `entry.html`, the three render keys, the panel, shard pinning | first-paint index bytes < 60 KB raw | **61.7 KB** (63,223 B) | **no**, by 2.8 % |
| I4b | `contribute.html`, `review.html`, `narratives.html`; the spine no longer written; `manifest.schema` 5 | the four pages < 2.0 MB of index at 10^4 | 2.17 / 2.22-2.67 / 2.17 / 2.17 MB, from 16.9-20.9 MB (6.0-9.6x) | **no**, by 3.3-8.3 % |
| I5 | histories sharded by kind and century | fewer files, same information | `data/index/` **1,390 -> 74 files**, 7.1 -> 2.4 MB on disk; histories 1,334 -> 18 files; `build-index` 32.8 -> 12.1 s (2.7x); 11.4 MB -> 0.55 MB at 10^4; **+63 KB on the real data** | yes |
| I6 | the graph's stacks per zoom bucket and culled to the viewport; the timeline's row cap from its pane | "ten notches under a second" (a `STATUS.md` number, never a test) | **6,088 -> 2,446 ms**; last notch 756 -> 164 ms; elements 24,310 -> 10,177 at k=4.5 | **no** (dev. 511), 2.5x better |
| I7 | `tools/migrate/ids.mjs`: a rename that leaves every old link working | the tool, its refusals, history after a rename | shipped; refuses a taken id, a tombstone, an import-owned record | yes |
| I8 | 77 `succeeded` relations from the CShapes split table; the Wikidata `names` fill; the NC exception follows the origin | records written by imports only | 77 written; `otherNames` + `imported-names` flag; `mayBeNonCommercial` keyed on `origin.tool` | yes |
| I9 | `src/walk.js`, the provenance beside the state, the line on the card; no `?walk=` written | M35's ground, no generated record | shipped; `?walk=` still parsed and written by nothing | yes |

**The first paint today**, `stat`ed (`src/data.js` `loadAtlas`: manifest
`no-store`, then core and sources in parallel, then land, then palette):
manifest 30,012 + core 69,553 + sources 33,681 + `land-present.json` 125,938
+ `palette.json` 4,071 = **263,255 B (257.1 KB) raw, 79,605 gzipped**,
against **949.6 KB** before the cycle - **3.6x less**, with the coastline
file M36-M38 replaces now the largest single item. Fetched beside and never
waited for: the search shard, **223,317 B raw / 45,088 gz** (171 KB at plan
time).

**The core is 69,553 B today against the 60 KB line and the 53,387 B I3
measured.** That is not drift in the encoding: the corpus grew inside and
after the cycle - 2,121 records now against the 1,737 section 0 measured
(events 329 -> 421, actors 412 -> 488, edges 161 -> 219, relations 43 -> 128,
tenures 12 -> 83), from I8's 77 successions, M31's tenures and M40/M42/M44's
imports. Per record the core is **32.8 B**, against 28.8 B at plan time; per
record the spine was 313 B. The 10.6x the plan claimed on the real data
holds; the absolute 60 KB line was written against a corpus that no longer
exists, which `STATUS.md` says at deviation 420 and again at I4a.

## 2. Regressions

**Nothing in the data or the picture regressed.** `--index` is byte-identical
to a fresh build, 0 errors, and the prerendered pages came out identical
through I1-I5 and I9 (plan D7, asserted per run). No record changed shape, no
migration was consumed. The four measured misses of section 1 are misses
against thresholds, not regressions.

The real ones, in order:

1. **CI on `m0` hangs, and it is not the index cycle's doing but it is the
   cycle's tests that will pay for it.** Deviation 551: run 567 sat 37
   minutes in `node --test`, a control re-run on `b7b7e443` (the
   `briefs-map` merge, `docs/` and ~15 MB of gzipped vendor data, no code)
   sat over 39. The last green check is `bd56b37`. The same suite here is
   **1,229 tests, 0 skipped, 124 s, browser tests included**. So it is a
   wait that never ends, not a failing test: deviation 445 - `connect()`
   awaits a WebSocket handshake with no bound and `withBrowser`'s
   `server.close()` waits on every connection Chromium leaves behind
   (`tests/browser.mjs`) - and `validate.yml` runs `node --test` with no
   `--test-timeout`, so a hang publishes no logs and says which test it is
   in. M44-0 declined to widen into it, correctly. **This is the single
   thing that should be fixed before the map block starts**: the projection
   and glyphs runs are view work with browser tests, and they will be pushed
   into a check that cannot go green and cannot say why.
2. **The manifest is 30,012 B, read `no-store` on every page load** - up from
   21,927 before the cycle - and it now carries `officesByEvent` (7,617 B),
   `tenuresByOffice` (3,290 B), `attributeShards`, `historyShards` (19
   entries), `presenceShards`, `regionBoxes`, `roles`, `rolesAllowed`,
   `categoriesAllowed` and `licenses`. Two of those are per-record joins, so
   the one file the cycle guaranteed would never be cached grows with the
   corpus. It is 11 % of first-paint bytes today and nothing bounds it.
3. **Three timing-dependent tests, all of them tests reading before a shard
   lands, and one genuine bug they exposed.** The pages draw before their
   titles arrive **by design** (plan D4, risk 2, owner question 6, answered
   yes), and that design is right: the never-wait discipline is what
   `loadGeometry`, `loadCiters` and `loadExplanations` already follow.
   - `review-browser.test.mjs` (dev. 487): the history block is drawn sooner
     now and the test read the summary in between; it waits for what it
     asserts. Test, not page.
   - `lens-browser.test.mjs` (dev. 488, 515): a chip whose century has not
     landed says "loading…"; the header is emptied and rewritten in one go,
     so a naive poll passes on zero chips. Now waited for **with a count**.
     Test, not page.
   - `panel-browser.test.mjs:806` is the one that was a page bug and is
     fixed: the office card printed `prime-minister-of-portugal` where the
     title goes, because all nine offices are in the `null` shard and the
     card drew the core's fallback. Review finding 21 predicted exactly this
     and I3 A3/I4 A4 answered it - **cards wait, views do not**.
   `waitFor` is bounded (200 tries x 50 ms); `page.eval` is not, which is
   deviation 543's fix for `walk-browser` alone and finding 1's general case.
   Verdict: **the cause is tests reading before a shard lands**, and the one
   page that drew when it should not have was caught and fixed inside the
   cycle.
4. **The histories are 63 KB bigger on the real data** (dev. 503) - a shard
   repeats the record id every entry where a per-record file had it in the
   name. On disk 5.3 MB -> 96 KB, and 11.4 MB -> 0.55 MB at 10^4; the small
   corpus pays for the right trade.
5. **`tests/spine-loader.test.mjs` lost its `SURFACE` list** (dev. 486) where
   I2 A3 said it would change at exactly one line; the list moved to
   `core-loader.test.mjs` and grew, and ten more test files were rewritten
   (dev. 485). Safe only because `projectV1` is a real oracle.
6. **The timeline's region grouping is still uncapped** (dev. 513): 5 lanes
   and 168 px in a 113 px pane.
7. **Element reuse across notches was dropped** after measuring (dev. 510),
   so I6 A2 is two thirds landed; the cull and the bucket carried the number.

## 3. What the plan review asked for and did not land

The review of 6 September carries 24 findings and some forty amendments.
**Every structural one landed and I checked each by name**: `attributePeriod`
(plan A8, I3 A1, I5 A1), used by `data.js`, `validate/core.js`,
`review/main.js` and `tools/lib/history.mjs`; `assertGeneration` in the
loaders only (I1 A3, f.17); `presencesOnDisk` in `tests/helpers.mjs` (I1 A1,
f.5); `loadRegionPolygons` asserted absent at first paint
(`spine-pages.test.mjs:87,218,223` - I1 A4); `projectV1` as the deletion
oracle (`spine.test.mjs:110` - I2 A2, f.7); an unlisted category still
round-tripping (`spine.test.mjs:423` - I2 A4, f.8); `HASHED` given as a regex
(`build-index.mjs:53` - I3 A4); the LRU counting **unpinned** shards with
`src/attributes.js` deciding the pins (I3 A5, f.9); "still loading the
corpus" on both writer pages (I4 A2, f.2); `shardsArrived` in all four render
keys (f.3); `expandCore` for `review.html` (I4 A6); the core carrying its own
`columns` and `vocab`; `IMPORT_TOOLS` refused by `tools/migrate/ids.mjs` (I7
A2, f.14); `otherNames` with `imported-names` (I8 A4); the NC exception on
`origin.tool` held by `tests/licensing.test.mjs` (I8 A3); no `?walk=` written
(I9 A1, f.16); and the search shard measured on both datasets and named in
`STATUS.md` and `ARCHITECTURE.md` (I3 A6).

What did not land, in order of weight:

1. **I3's gate was missed and the assistant let I4 proceed anyway.** Plan D5
   and section 5 item 3 say in as many words: "I4 proceeds only if the core is
   under the budget in section 3 on both datasets... the cycle ends at I2 with
   the numbers in `STATUS.md`". The core came in at 336,979 gzipped against
   <= 320 KB - a 2.9 % miss - and `STATUS.md` line 481 records a **decision by
   the assistant on 8 September, under the owner's standing instruction to
   keep the chain moving, that I4 proceeds**, with the owner free to overrule.
   The number is small and the judgement is defensible; the governance is not
   the plan's. It is written down where the owner can find it, which is the
   right handling of an overstep, but the owner has not answered it and the
   cycle is closed. **This is the one thing in the cycle that needs an owner's
   word rather than a corrective commit.**
2. **I7 A1's test does not exist.** The fix landed - `tools/lib/history.mjs`
   asks for `<kind dir>/<alias>.json` for every alias and merges those states
   (commit `44adf37`) - but the amendment asks for "a test on a scratch clone
   with two commits: the versions before the rename are still listed after
   it", and `44adf37` touches `tools/lib/history.mjs`, the manifest and one
   history shard and **no test file**. `tests/history.test.mjs` has the
   shallow-clone case and no rename case. Finding 13 is the one that would
   make a renamed record read in the dashboard as written yesterday, and it is
   now held by nothing.
3. **I6 A2's element reuse** was tried, measured and dropped (dev. 510) - a
   defensible outcome, recorded, but the amendment's third leg.
4. **The I3/I4a/I4b/I1/I2 byte lines** were each reported rather than met
   (dev. 420, 426, 480, and I4a's 2.8 %). Every one is documented with its
   arithmetic and its cause; none is hidden. But four thresholds out of six
   were missed, which says the plan's section 0 sketch under-modelled the
   core it was sizing (it omitted `parent`, `subtreeWeight` and the actor-id
   join lines - dev. 480 says so itself).
5. **Deviation 513**: the timeline's region grouping is uncapped, so D10's
   promise ("the drawing always fits") holds for two of the three groupings.
6. **The milestone sections are comments on PR #1, not its body** (dev. 483,
   498, 506, 517, 539, 540 - six runs). Not a review amendment, but the run
   protocol's step 4, declined six times for the same stated reason: the body
   is 170 KB on one line and the tool replaces the whole of it. The owner is
   asked in 517 to decide; nobody has.

## 4. The state against the seven considerations

**1. Tens or hundreds of thousands of nodes on a static host.** Much better,
and honestly bounded. First paint 257.1 KB from 949.6; the core is 32.8 B a
record; at 10^4 it is 2,016,667 B raw / 336,979 gz where the spine was
9,702,450 / 462,537. The cycle's own projection to 10^5 is ~10.1 MB raw /
~1.68 MB gz - **what the spine was at 2x10^4** - so this buys ~5x and 10^5 is
the edge, as review amendment A3 said. Two costs nothing else names: the
split **raises total bytes** (core + attributes 214,059 against a 162,695
spine on the real data, +32 %; 5.28 MB against 3.82 MB at 10^4, +38 %), so
the win is first paint and heap, not bandwidth; and the manifest, the one
file served `no-store`, is 30,012 B and carries two per-record joins. The
wall is no longer the index: `layoutGraph` is 21.7 s at 30,000 edges and
`checkRules` 658 ms at 20,000 here.

**2. Easy exploration for a curious reader.** Held, improved where I6 touched
it. The picture is unchanged; it arrives sooner and a label may follow, with
cards waiting for their own shard and views not - the right side of the line
to put the reader on. Ten wheel notches at 20,000 events: 6,088 -> 2,446 ms,
the tenth 756 -> 164 ms; my bench reproduces the bucket's asymmetry (ten in:
2,227 vs 2,182 ms, noise; ten in and out: 4,124 vs 2,321 ms, 1.78x, 9 of 19
hits). The timeline fits its pane at 15 rows in 269 px and 5 in 137, except
under the region grouping. Search is 1-2 ms a keystroke over 24,411 entries;
convergence, the query the whole-graph guarantee exists for, is 0.00 ms.

**3. Easy to add features and categories.** Distinctly better. What was nine
hand-written object literals in `buildSpine` is one table in `src/spine.js`
read three ways (`SPINE_COLUMNS`, and `CORE_COLUMNS`/`ATTRIBUTE_COLUMNS` as
one partition of it), with `src/kinds.js` for the kind and `src/references.js`
for every field an id may stand in - and `tests/registry.test.mjs` fails on
an id-shaped field the schemas have and that table does not. A tenth kind is
three rows. Categories and roles stay closed vocabularies **in data**
(`data/categories.json`, `data/roles.json`), read into the topology, the
manifest and the index's `vocab`, and a category no file lists still
round-trips (`spine.test.mjs:423`). Nothing in the cycle moved a vocabulary
into code.

**4. Contributors without coding, and finding the right node.** The page cost
fell 20.9 -> 2.17 MB at 10^4 (9.6x) and the picker reads the search shard,
not the corpus: 66.7 ms cold then 1.1-1.5 ms a keystroke over 20,000 events,
with kind, years, place and degree beside each name. The weakness is
structural and unfixed: `contribute.html` and `review.html` are
whole-universe readers, so they hold **every** attribute shard and say "still
loading the corpus" until they do (~12 MB at 10^5), and the search shard
behind them is 2.75 MB at 10^4 and ~27 MB projected at 10^5. It degrades
rather than breaks, and the plan named it.

**5. Straightforward review with good cataloguing.** The best-served
consideration. `data/index/` is 75 files and 2.5 MB where it was 1,390 and
7.1 MB; the histories are 18 shards instead of 1,334 files, filed by the same
`attributePeriod` key the attributes use, one file per kind and century; the
queue is a summary plus one shard per kind; the list windows to 23 rows in
the DOM of 20,000 at 2.58 ms; a renamed record keeps its versions, untested.
The queue is honest about what is left: **829 drafts and 2,549 of 2,549
citations unchecked**, printed at every validator run.

**6. Robust, without many bugs.** The code is: 0 errors, `--index`
byte-identical, the prerendered pages identical through the cycle,
`node --test` at 1,229 tests, 0 skipped, in 124 s in this sandbox, and no
record under `data/` changed shape so no migration could be got wrong. **The
process is not**: `m0` has not had a green check since `bd56b37`, and
deviation 551 proves by control that the hang predates M44-0 and lives in
`tests/browser.mjs`'s two unbounded waits plus a `node --test` with no
`--test-timeout`. Three timing races surfaced in the cycle and all three were
fixed by teaching the test to wait for what it asserts.

**7. Data portable if the spine is restructured.** The consideration the
cycle was designed around, and it holds. Not one record was rewritten; the
index is a projection and restructuring it is a rebuild. The core and every
attribute shard carry their own `ids`, `columns` and `vocab`, so a reuser
rebuilds objects with a loop and never reads `src/`; `manifest.schema` is 6
and `assertGeneration` refuses a generation it does not know rather than
misreading it. The century boundaries and the kind filing are build-time
choices in `attributePeriod`, changeable by a rebuild.

## 5. Open risks and the next cycle's candidates, ranked

1. **The check on `m0` cannot go green and cannot say why** (dev. 445, 543,
   551). Everything after it - the map block, M44a, any contribution - pushes
   into a blind Action. Fix: bound `connect()` and `withBrowser`'s
   `server.close()`, and add `--test-timeout` to `validate.yml`. Small, and
   the second half is an owner decision because it turns a hang into a red
   check.
2. **The two writer pages hold the whole corpus.** ~2.2 MB at 10^4, ~12 MB of
   shards plus ~27 MB of search index projected at 10^5. Candidate: a rules
   subset that runs on what is loaded, or a server-side check; either is a new
   decision.
3. **The search shard is the next whole-corpus file** (223 KB today, 2.75 MB
   at 10^4). Named in `STATUS.md` and `ARCHITECTURE.md` with its bytes on both
   datasets, as I3 A6 asked. Candidate: shard it, or fold it into the
   attribute shards.
4. **`layoutGraph` is the real scale wall**: 21.7 s at 30,000 edges here, and
   the Worker moves it off the main thread rather than removing it. The graph
   view is the one view with no windowing story.
5. **The manifest grows with the corpus and is never cached.** `officesByEvent`
   and `tenuresByOffice` are per-record joins in a `no-store` file.
6. **I3's missed gate is unanswered by the owner** (section 3, item 1).
7. **A renamed record's history is held by no test** (section 3, item 2).
8. **829 drafts, 2,549 unchecked citations, 1,040 records with no standing.**
   The exception of 2 September is retired one record at a time and nothing
   has retired any of it; this is data work, on the owner's own list.
9. **The timeline's region grouping still overflows** (dev. 513).
10. **The milestone record lives in PR comments** (dev. 517), six runs deep.

## 6. Verdict

**The cycle delivered what it was for.** The whole-corpus file is gone, the
first paint is 3.6x smaller, the review artifact is 18x fewer files, the
graph's notch is 2.5x cheaper, `data/` never changed, and every miss is
written down with its arithmetic. Four of six byte thresholds were missed by
0.8-8.3 % and one gate was passed by the assistant's own decision; none of
that is a reason to redo work.

**A corrective run is needed before the map block starts, and it is not about
the index.** It is about the check. M39a (the projection) and the glyphs run
are view work whose evidence is browser tests, and they would be pushed into
an Action that has not gone green since `bd56b37` and that publishes no logs
when it hangs. The run below fixes that and closes the two small holes the
cycle left behind it. Everything else on the list above is a candidate for a
third cycle, not a corrective run.

## Corrective run

**Gate.** Waits for the literal line `M44-0 done` in `STATUS.md` on `m0`
(already present). Runs on `m0`. Read `CLAUDE.md`, `STATUS.md` (deviations
445, 543, 551 and the I7 block), `docs/run-protocol.md`, then
`tests/browser.mjs`, `.github/workflows/validate.yml`, `tools/lib/history.mjs`
and `tests/history.test.mjs`. No record under `data/` is created or edited.
No historical claim is written. `data/index/` is not rebuilt.

**1. Bound the two waits in `tests/browser.mjs`.** `connect()` awaits a
WebSocket handshake with no bound; `withBrowser`'s `server.close()` waits for
every connection Chromium leaves behind. Give each a named timeout that
rejects with a sentence saying which wait it was and what was open, so a
hang becomes a failure with a name. Keep the existing per-test timeouts
deviation 543 added to `walk-browser`. Do not change what any test asserts.

**2. Give `node --test` a bound in the Action.** `.github/workflows/
validate.yml`'s Tests step runs `node --test` with no `--test-timeout`,
unlike `import-wikidata.yml`. Add `--test-timeout=120000`. **State plainly in
`STATUS.md` that this turns a hang into a red check rather than a green one,
that it is the owner's to overrule, and that item 1 is what should make it
never fire.** If `tests/workflows.test.mjs` pins the Tests step's command
line, update it in the same commit.

**3. Prove the hang is gone, or say what is left.** Run `node --test` whole
on `m0` and record the count and the wall time in `STATUS.md` against the
1,229 tests / 124 s measured on 9 September. Push and read the GitHub check;
if it is still not green, do not widen - record what the bounded run says the
hang is, by test name, which is the thing no run has been able to do so far.

**4. Give the renamed record's history the test amendment I7 A1 asked for.**
`tools/lib/history.mjs` merges the states under every alias's former path
(commit `44adf37`) and no test holds it. In `tests/history.test.mjs`, beside
the shallow-clone case, build a scratch repository: commit a record, commit a
change to it, `git mv` it to a new path and append the former id to
`aliases`, commit that, then assert `recordHistories` still lists the
versions from before the rename and that `from` is not `revised`.

**5. Cap the region grouping** (deviation 513) **only if it is one call.**
`lanesFor` already takes a `cap` option (dev. 514) and the region grouping
does not pass it. If passing it is a one-line change that leaves
`tests/timeline-browser.test.mjs` green, make it and record the before/after
row counts as the I6 table does. If it is not, leave it and say why in a
deviation.

**Not in this run.** The writer pages' whole-corpus load, the search shard,
`layoutGraph`, the manifest's size, the drafts backfill, and the PR-body
question - all of them are decisions or cycles, not corrections.

**Done when.** The two waits are bounded and named; `validate.yml` passes
`--test-timeout=120000` and `STATUS.md` says what that changes and that the
owner may overrule it; a full `node --test` count and wall time are recorded;
the rename-history test exists and passes; deviation 513 is fixed or
explained; `node tools/validate.mjs --index` is byte-identical without a
rebuild; every deviation from this brief is numbered on from 551 in
`STATUS.md`; and the last line of the `STATUS.md` commit body is the literal
line:

`Index cycle 2 corrective run done`

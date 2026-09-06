# Health cycle — closing review, 6 September 2026

Reviewer: the closing Fable reviewer of the health cycle. Repository
`/home/gjacob/atlas-causal`, branch `m0` at `1597412` (H8 done), read-only;
nothing under the repository was modified. Scratch scripts and generated data
live under the session scratchpad only. Yardstick: the owner's seven
considerations in `health-review-prompt.md`. Written incrementally; a section
appears as soon as it is done.

## 0. What was run

- `node --test` with `CHROME` set to the headless shell (Chrome for Testing 152): **921 tests, 920 pass, 1 fail, 0 skipped**, 47 s wall, 256 MB RSS. The failure is `tests/contribute-browser.test.mjs:60` "the picker answers a keystroke among 20 000 records in under 100 ms": the first keystroke took 174.1 ms (then 14.5, 6.9). A wall-clock assertion run while the bench and validator were running in parallel; see §3 R3 for why it is still a defect.
- `node tools/validate.mjs --index`: 1716 records, 5 regions, **0 errors, 3 warnings** (degree-zero `iberian-blackout-2025`, no-citers `uefa-2016-final`, place-unused `saint-denis`); 485 drafts (`review.status: draft`); 1928 of 1928 citations unchecked. 14.7 s wall under contention (the test suite was running); the bench's own warm figure for the same job is 1.61 s (first run 2.93 s).
- `node tests/bench/run.mjs`, every case, 1 m 30 s wall, 1.25 GB peak RSS. Note: the harness writes its 20k on-disk dataset to `os.tmpdir()` (`/tmp/atlas-bench-20000-40-20260905`), not to the scratchpad, and nothing in the harness names a place for it; 62 657 files land in `/tmp` on every run of the `build-index` case.
- Headless Chromium over `tools/serve.mjs` on a free port: real data, and the 20 000-event synthetic set built by the harness (§2).
- `git log --oneline 9d1b582..1597412`: 168 commits.

## 1. The seventy findings, one line each

Status is judged from the code at 1597412, not from STATUS.md. "Resolved" means the substance of the recommendation is in the tree with a test; "partly" means a named part is missing; "deferred" means the plan's decisions or its "Left out on purpose" section chose not to do it. Commit hashes are from `git log 9d1b582..1597412`.

### 1.1 Review A

| # | Finding | Status | Evidence | What remains |
|---|---|---|---|---|
| A1 | Whole topology loaded by every page | **partly** | H3a-1 068eacc/21d40b4/2a5f272, H3b 5f567d7…affe5d9, H3c 5bba48c. `loadAtlas` (`src/data.js:602-633`) fetches manifest + `spine-*.json` 837 KB (was 927) + `sources-*.json` 34 KB (was 337) + land + palette + **`geo/regions.json` 221 KB, new at first paint** (B15's region boxes). Period shards cancelled in the H3a amendment f76f061 | The whole-corpus file shrank 10 % on the real data (1.36× at 20k) and first paint gained 221 KB of polygons; titles, actors, `when`, presences ride whole; ~75 MB raw at 100k. The density split A1 and plan decision 1 named was not done |
| A2 | `layoutGraph` O(E²)×7 | resolved | H4b 0bece8b sweep-line crossings + early stop (`layout.js:236-322`), d147187 band-only layout keyed in `arrangement.js`, 2040581 a Worker above 600 events; `graph-layout`, `arrangement`, `layout-worker` tests; 38.7k edges 5.25 s (was 379 s at 30k) | The Worker was added against plan-review 14's condition; no bench case reproduces the number |
| A3 | Drag writes URL and rebuilds panel per move | resolved | 74d8083 `state.js:335-384` replace-writes coalesced to a frame, `try/catch` on `replaceState`; 23f179a `panel.js:443-470` render key; `panel-browser.test.mjs` | — |
| A4 | Map pointer maths assume the SVG fills its box | resolved | 6840e4d `map.js:130-150` `getScreenCTM`, `ResizeObserver` `:451`; `map-browser.test.mjs` | — |
| A5 | Cluster list wiped by the bbox write | resolved | 23f179a `panel.js:56-60,440-441,573-583` | — |
| A6 | Back restores openings, not the picture; reading-mode URL | **partly / deferred** | d964a8b `state.js:388-414` popstate from `defaultState()` + `writeNow(false)`; `state.test.mjs`. Reading-mode URL deferred by plan decision 9 / plan-review 22 | A narrative link copied from the graph opens on the map |
| A7 | Sign deletes citation checks | resolved | 1ff3515/0c0e41c `sign.js:46-51,74,92` keep `citations` on Sign and Retract; `citations-review.test.mjs` | — |
| A8 | "Unreviewed" = one author string | **partly, and re-broken** | 0c0e41c `origin.js:61` `isDraft = review.status === 'draft'`; contributions land `draft`+`contributed` (`bundle-to-files.mjs:211-218`). **But `tools/import/wikidata.mjs:508` still creates records with `review: { flags: ['imported-facts'] }` and no `status`**, and migration 004 (`migrate.js:189-193`) sets `draft` only from the old author-name marker: every record the next `import/…` branch creates is invisible to the queue — A8's exact failure, keyed on the new field. No test | One line in the import, and a rule that `flags` without `status` is an error |
| A9 | A ninth kind touches ~30 files | resolved | H2 3d99f4f `src/kinds.js`, f488f06 `src/vocab.js`, 3ddd4be; `registry.test.mjs`. Re-count: a kind = registry entry + schema + `schemas.js:22` + `provenance.json` enum + a `buildTopology` branch (`core.js:275-359`, an if-chain) + a card + `bundle.js`'s per-kind tables + `grouping.js:32` — 8 places, was ~30; an edge type 6 (was 10); a relation type 4 (was 6) | `'narrative'`/`'presence'` literals in 21 files, mostly legitimate per-kind logic |
| A10 | `<select>` pickers; duplicates for events only | resolved | H6a 2b5d72a `contribute/picker.js`; `findSimilar` over every kind + `wikidata`/ISBN/DOI; `contribute-browser.test.mjs` | The cold first keystroke (44–174 ms) fails the 100 ms test under load (§3 R3) |
| A11 | Validator superlinear; per-keystroke universe | resolved | H4d f8f43ea `rules.js:211-230` `buildUniverse`, patterns compiled once; af4c3bc prebuilt universe in form and editor; H6a 98a7280 incremental rule 5; 20k/40 % tombstones 308 ms (was 28.9 s) | — |
| A12 | Horizon/convergence recomputed per view | resolved | H4c 6311dd0 `util/memo.js`, `horizon.js:11`, `graph.js:336`, `emphasis.js:65`; same selection 2.8 ms | — |
| A13 | Clustering O(n²) per zoom frame | resolved | H4a b09e54b grid (`cluster.js:64-120`) tested against the greedy pass; 1279c4a once at rest per zoom bucket; 14k points 12–17 ms (was 94–591) | 70k points 110 ms per re-cluster at rest |
| A14 | Failed fetch cached for ever | resolved | ac75cc7 `data.js:215-221,361-372`; `data.test.mjs` | — |
| A15 | entry.html built by script from the whole atlas | resolved (variant) | H8 e80aaff `tools/lib/prerender.mjs`; `sources.html`/`narratives.html` filled at build; `entry/<id>.html` only for records with a `body` — none exist; `entry.html?id=` kept per plan-review 9 | `entry.html?id=` still loads the whole spine for one record |
| A16 | No way to hand a reader an unsaved path | deferred (reserved) | `state.js:103,200-206` parses `?walk=`; nothing consumes it; plan decision 7 | The plumbing M35 needs is not built |
| A17 | First contact unguided | resolved | H7 338e4a6 `src/intro.js`; `intro.test.mjs`, `intro-browser.test.mjs` | `prominence` still reserved |
| A18 | Timeline never scales its scale | deferred | "Left out on purpose", plan-review 19 (M6 stands); DOM half H4c cd63b2f | — |
| A19 | Search linear per keystroke | resolved | H4c 29fa5bb best-eight scan, 120 ms grace; the search shard; 1.9–2.4 ms | — |
| A20 | Aliases not resolved by rule 3 / steps / citation keys | resolved | H5a 63bf9e3 `rules.js:116-160,437,497-499`; `aliases.test.mjs` | Rename still by hand (A21) |
| A21 | Ids embed the vocabulary; nothing migrates a rename | deferred (decision 3), tool absent | `tools/migrate/` holds `apply.mjs` only; no `migrate-ids.mjs` | The "ship `migrate-ids`" half of the decision was not shipped; the ten `allied-with` re-typings wait |
| A22 | Review status / attribution / machine authorship in one field | resolved | H5b 1ff3515, 2cab4ad migration 004, 1f829f7 `src/origin.js`, rules 28/29; `IMPORT_AUTHORS` gone; `migrate*.test.mjs` | A8's gap |
| A23 | Import writes `region`; `sitelinks` undated | resolved (variant) | 7a33e6a `regionNote` (`wikidata.mjs:514-548`); `sitelinks` `{ count, on }` | `region` still written where the point would derive it, with the note |
| A24 | Licence boundary only in the validator | partly | eecb98b `src/licensing.js`, manifest `licenses`, attribution line on NC cards/entries; `licensing.test.mjs` | Enum still allows `PD`, `CC0-1.0`, `ODbL-1.0` (`provenance.json:57`) — owner's call, listed in ARCHITECTURE |
| A25 | `schema: 1` has no migration path | resolved | 1a43fe2/db95b1f `src/validate/migrate.js`, `tools/migrate/apply.mjs`, `read.mjs:72-89`, `core.js:58-65` | — |
| A26 | Sources index = bibliography + reverse index | resolved | 21d40b4 `citers-<hash>/`; sources 34 KB; `citationCount` in the spine | — |
| A27 | Working set computed three times | resolved | 3b58388 `src/emphasis.js`; `emphasis.test.mjs` | — |
| A28 | Vocabularies duplicated in `state.js` | resolved | f488f06 `state.js:88-90` imports `vocab.js` | — |
| A29 | Retraction cascade not offered by the Action | resolved | 2226324 `bundle-to-files.mjs:249-266` under `--correction` | — |
| A30 | Merged contribution invisible; lookup after the PR | resolved | `reviewFor` writes `draft`/`contributed`/`issue #n`; `contribution.yml:93,134`; `?open=` in `review-browser.test.mjs` | Never run end to end (`CONTRIBUTION_PAT`); and §3 R2 breaks it |
| A31 | No history, no diff on the dashboard | resolved (with §3 R1) | H6b 08d1369 `data/index/history/`, `review/history.js` `diffAgainst`; no `git log` endpoint | Histories exempt from the byte gate; degraded on a shallow deploy |
| A32 | Phone sheet on every step | resolved | 850654b `phone.js:39-46`; `phone-browser.test.mjs` | — |
| A33 | Discuss carries the full URL | resolved | 037d085 `share.js:20-22,83`; `share.test.mjs` | — |
| A34 | Two direct year comparisons | unchanged (no defect) | `state.js:162`, `window.js:87` | — |
| A35 | Deploy artifact is the repository | resolved | H8 de87af4 `deploy.yml:79-95`; `review.html:17-22` banner; `workflows.test.mjs` | — |

Review A tally: resolved 26 (three as variants), partly 5 (A1, A6, A8, A20→A21, A24), deferred 3 (A16, A18, A21), no defect 1.

### 1.2 Review B

| # | Finding | Status | Evidence | What remains |
|---|---|---|---|---|
| B1 | Topology whole; every view walks the whole set per change | **partly** | The spine (H3a–c) is the one graph file; views draw window + margin (`timeline.js:516-539`, `graph-view.js:542`); render keys per view; `emphasis.js` shared. Spine 837 KB vs topology 927 KB; period shards dropped in f76f061 | The "load whole" half is unchanged in substance: ~75–90 MB raw at 100k, parsed by every page; `createAtlas` builds every Map on load; `regions.json` (221 KB) added to first paint |
| B2 | `clusterPoints` O(n²) per frame | resolved | b09e54b grid, 1279c4a once at rest, on-screen only; 14k points 12–17 ms, 70k 110 ms | k=1 (whole world) improves least: the grid does not help when everything merges |
| B3 | Graph layout O(E²)×7 | **partly** | Sweep-line crossings + early stop; band-only layout; a Worker above 600 events (`layout-runner.js:23`). Harness generator: 6 345 edges 396 ms, 38 712 edges 5.25 s; on a denser long-range synthetic (the B fork's) 10k/21k still 19 s | Still superlinear (~×4 per doubling); the Worker is load-bearing, not optional; no bench case |
| B4 | Rule 11 quadratic in tombstones | resolved | f8f43ea `rules.js:211-230`; 308 ms at 20k/40 % (was 28.9 s) | — |
| B5 | `validate --index` does the job twice; serial reads | resolved | 3b44d93 `validate.mjs:280` hands `prepared` to `buildIndex`; batched reads; palette by digest; 15.4 s at 20k (was 93 s) | `build-index` now writes 62 657 files at 20k (§2.2) |
| B6 | `<select>`s of every record; duplicates events-only | resolved | 2b5d72a picker; `findDuplicates` every kind + identifiers; universe built once | Cold first keystroke fails the 100 ms test under load (§3 R3) |
| B7 | Dashboard at 10k drafts | **partly** | Virtual list (`review/list.js`, 23 rows in the DOM), digests per kind, four sort keys, edge with both ends, `claimedBy`, history per record, diff against the draft; Save answers before the rebuild (`tools/lib/store.mjs:46-147`) | Not incremental: the whole index (62k files at 20k) is rebuilt per save, in the background; histories from `git log` (§3 R1) |
| B8 | Choosing from search narrows the window | resolved | 8df1399 `search-box.js:143-152` widens only when the year is outside | — |
| B9 | Horizon leaks across selections | resolved | fa6d411 `state.js:427-436` `leftBehind` | — |
| B10 | Map/timeline click resets the chain | resolved | 3ee5d76 `src/chain.js:49-64` `walkOrSelect` in all three views | — |
| B11 | Nothing keyboard-reachable on map or timeline | resolved | c2fa174: bars roving tabindex per lane, marks `tabindex=0 role=button` | Every on-screen mark is a tab stop |
| B12 | Panel re-renders on every change | resolved | 23f179a render key; three browser tests (details survive a drag, cluster list survives the bbox) | — |
| B13 | Failed fetch cached for the session | resolved | ac75cc7 in `record`, `loadGeometry`, citers, explanations, spine; the map says "territories could not be loaded" | — |
| B14 | After Back the URL lies | resolved | d964a8b; browser test "Back comes back to the picture, and the URL says so" | Reading-mode URL unchanged by decision |
| B15 | `?bbox` drops placeless events; world box written | resolved | f61d158 `viewport.js:60-80` region box; never the world; d1034ee only the atlas page loads the polygons | +221 KB at first paint |
| B16 | Sign/Retract delete `review` whole | resolved | `retraction: { on, reason }` (schema, migration 004, rule 27); `reviewAfter` keeps `citations` | `review.note` is still cleared by Sign, now by design |
| B17 | Search cannot find "Carnation Revolution" | **partly** | 0202a1a rule 18 for event `names`; 9ea33b7 the shard folds `names` and the summary's first sentence | **No event carries `names`** (0 files) and the 25 April lead does not say "carnation": the case named still fails (deviation 294). Data work, or the import's label fill, which is not written either |
| B18 | No entry point for a question; one fetch per edge | **partly** | 7423d0d `subgraph()`, `explanations-<century>` shards + `loadExplanations`, steps may name actor/relation/presence, `?walk=` parsed; ranking as an ordering | Of six needs: condition endpoints (M30/M35) not done; **no `generated` marker** in the envelope (`origin.tool` is `cshapes|wikidata|assistant|form`); no `narrative.subgraph`; `?walk=` has no producer and no provenance line |
| B19 | A kind touches ~26 files; vocabularies duplicated | **partly** | `vocab.js` (`'inspired'` in 0 files outside it), `kinds.js`, tools on the registry, consistency tests | `'narrative'` literal in 19 files / 35 places, `'presence'` 24 places; `'allied-with'` hard-coded symmetric in `panel/actor.js:84` and `entry/entry.js:144`; the search shard (`search.js:67-122`) and the picker's `KINDS_OF` (`picker.js:33-42`) are hand tables per kind |
| B20 | Sources and review indexes grow and load whole | resolved | citers per source; sources 34 KB; digests per kind | — |
| B21 | Tombstones travel to every reader | resolved | 5bba48c: a tombstone keeps `id, kind, status, supersededBy, aliases, title, when, wikidata, place, region, revised` | 224 B per tombstone at 20k — plan-review 18's shape, not "four fields" |
| B22 | Horizon set ×4; reachable set held out of stacks | resolved | 6311dd0 `util/memo.js`; held-out capped at `SHOWN` | — |
| B23 | Timeline rebuilds its SVG; packs every event | resolved | dca39d6 sweep packing; cd63b2f `reuse` per layer, density strip; 5 elements per selection | Scale on the whole extent (deferred) |
| B24 | Territories: scan, re-projection, first-paint shard | resolved | 7401843 interval index (4.8 → 0.1 ms), cached paths, three detail rungs, first fetch deferred | "Deferred" is a `defer()` at first render, not an on-screen condition (§2.3 checks the bytes) |
| B25 | URL cannot express cluster, graph pan/zoom, edge alone, relation, presence, two narratives, multi-lens, why; chain unbounded | **partly / deferred** | Multi-focus `?focus=a:x,b:y&focusAll=1` (2f9f1bc); `?walk=` reserved; `?edge=` and a short chain dropped by decision 9 | Cluster, graph pan/zoom, edge alone, relation, presence, two narratives, `?why=`: none; chain length unchanged |
| B26 | Correction without a form; 6 KB prefill; GitHub for everything | **partly / deferred** | 2525e5f "Edit this record" → `contribute.html?edit=<kind>/<id>` prefilled | Correction is the whole record by design (`correction.yml`); `MAX_PREFILL` still 6 KB so one event + edge + source still says "paste"; relay/anonymous deferred; `CONTRIBUTING.md` still says closed |
| B27 | Universe rebuilt per keystroke; rule 5 global | resolved | af4c3bc; 98a7280 `rules.js:616-666` — two new edges closing a cycle between them are caught (`edgesTouching` merges the bundle's edges) | — |
| B28 | Angola's entry point empty | **partly** | 62a782b "Before and after" along `succeeded`, first when the actor has none; years beside actors in search | **No `succeeded` relation touches `angola`**: the case named still opens empty (deviation 295). One relation record, data not code |
| B29 | Mutable record URLs; artifact is the checkout | resolved | f981eb6 `?v=<revised>`; de87af4 allowlist | `revised` is a day: two edits on one day share a URL |
| B30 | Paths by hops; convergence unranked | resolved (as decided) | 3cc2ca0 `stepCost`/`rankByCost`/`convergenceByDepth`; `shortestPaths` unchanged by decision 6 | — |
| B31 | Generated vs authored is a string | **partly / deferred** | `origin: { tool, run? }` on every record; the four predicates on `origin.js`; rule 29 | `data/imported/` tree not adopted (no decision recorded); `docs/m21-retractions.md` duplicates `retraction.reason` |
| B32 | `serve.mjs` rebuilds inside the request | resolved | 814e08e `tools/lib/store.mjs` queue, background rebuild, `/__status`, dashboard polls | — |
| B33 | Roles: 163 free strings | deferred | "Left out": M32; no `data/roles.json`; `docs/roles-mapping.md` awaits the owner | — |
| B34 | Chain in a link not checked for status | resolved | 7b73280 `chain.js:30` `retractedSteps`; browser test | — |
| B35 | STATUS.md 3 278 lines | resolved | 6e21f4d: 197 lines; the account in `docs/history/` | — |

Review B tally: resolved 22, partly 10 (B1, B3, B7, B17, B18, B19, B25, B26, B28, B31), deferred 1 (B33), of which B25/B26/B31 are partly by decision.

### 1.3 Where STATUS.md's account outruns the code

1. **"The index splits" (H3).** The spine is 90 % of the topology's bytes on the real data and 74 % at 20k; plan decision 1's attribute shards were dropped in the H3a amendment and nothing records that the drop is final. `ARCHITECTURE.md` says the wall barely moved; STATUS.md's H3 headlines do not.
2. **"A later import that arrives unread is in the review queue" (H5b).** It is not: `wikidata.mjs:508` writes `flags` and no `status`; `isDraft` reads `status` only (A8).
3. **"Search finds an event by what else it is called" (H7)** — no event has `names`; "carnation" still finds nothing (B17). **"An actor with no events says where they are"** — no `succeeded` relation touches Angola (B28). Both are machinery with no data behind the case they were built for, and both are admitted only in deviations 294/295.
4. **"The ground the Why mode stands on" (H7).** No `generated` marker, no `narrative.subgraph`, `?walk=` with no producer (B18).
5. **"Three letters cost 48.5, 6.1 and 4.3 ms" (H6a).** 174 ms cold here, and the test that pins it failed (§3 R3).
6. **"No Worker unless a measured number demands it" (plan-review 14)** — `layout-worker.js` exists and is load-bearing (B3).
7. **"A history per record" (H6b)** is built from a shallow clone in the deploy and exempt from the byte gate (§3 R1).

## 2. Re-measured

### 2.1 The pure cores — `node tests/bench/run.mjs` against B's table

Two runs of the harness: run 1 overlapped the browser test suite (contended), run 2 was alone on the machine. B's figure is from its table (20k = 20 000 events / 30 000 edges; 100k = 70 000 placed points). "Today" is run 2 with run 1 in parentheses where it differs materially.

| Component | B measured (5 Sept) | Today (6 Sept, 1597412) | Ratio |
|---|---|---|---|
| `clusterPoints`, 14k points, k=1 / 8 / 40 | 94 / 471 / 591 ms | **16.5 / 12.2 / 13.1 ms** (69 / 61 / 53 contended) | 6–45× |
| `clusterPoints`, 70k points, k=1 / 8 / 40 | 0.94 s / 24 s / 65 s | **116 / 115 / 109 ms** | 8–600× |
| Map wheel notch at 20k, without the DOM (project + group + cull) | 324 ms in the page | 16 ms, 123–425 clusters reach the DOM | — |
| Timeline `packRows` + per-lane stacking at 20k | 51 + 43 ms | 4.1 + 4.2 ms (20-year band) … 9.5 + 7.6 ms (600-year) | 6–12× |
| Timeline notch at 20k, without the DOM | 2.1 s in the page | 7.2 / 10.7 / 21.7 ms (20 / 100 / 600-year band) | — |
| `reachableBy` heaviest node at 20k | 46 ms | 11.7 ms (4 761 events, 38 712 edges) | 4× |
| One state change, four askers of the horizon at 20k | 4 × 48 ms | 38.7 ms unmemoised; **13.9 ms new selection, 2.8 ms same selection** memoised | 14–70× |
| Search scan per keystroke at 20k | 5.7 ms | 1.9–2.4 ms | 2.5× |
| Reference picker per keystroke at 20k | 276 ms (1.16 s with an edge entry, 41k `<option>`s) | **0.9–1.1 ms warm; 44 ms cold** (142 ms cold contended) | 250× |
| Review list per keystroke at 20k drafts | 461 ms, 30 543 rows in the DOM | 3.4–7.9 ms, **23 rows in the DOM** | 60× |
| `checkRules` at 20k, 40 % tombstones | 28.9 s | **308 ms** (0 % tombstones: 0.6 s → 436 ms) | 94× |
| Form: validate one record per keystroke at 20k | 166 ms | 2.07 ms against a prebuilt universe (59 ms if built per call) | 80× |
| `layoutGraph` (my script over the harness generator) | 4 989 edges 8.7 s; 30 000 edges 379 s | 6 345 edges **396 ms**; 38 712 edges **5.25 s** | 22–70× |
| `stackLayout` at 20k, k=1 / k=8 | 2.7 s / 30.6 s per render | 2.5 s / 0.66 s — but only the window's events are laid out and the answer is memoised per key now | 1× / 46× |
| `build-index` at 20k | 26.3 s, 373 MB | 13.6 s (writes **62 657 files**, 62 446 of them `history/`) | 1.9× |
| `validate` at 20k / `validate --index` at 20k | 28.6 s / 93 s | 14.1 s / 15.4 s | 2× / 6× |
| `validate --index`, real dataset | 4.1 s | 1.61 s warm, 2.93 s cold (14.7 s wall in my contended run) | 2.5× |
| Peak RSS of the harness | — | 1.25 GB | — |

### 2.2 The index on disk at 20k (the harness's own dataset: 20 000 events of which 8 000 tombstones, 40 000 edges, 500 actors, 1 750 places, no presences)

| File | B measured (topology era) | Today |
|---|---|---|
| The whole-corpus graph file | topology 20.8 MB (1.3 MB gz) | **spine 15.3 MB raw, 506 KB gz**; ~9.7 MB of it is JSON, the rest is the pretty-printer's indentation |
| Sources index | 11.2 MB | 143 KB (citers moved to `citers-<hash>/`, 5.8 MB in 2 000 files, on demand) |
| Review index | 11.6 MB whole | a 66-byte summary plus one shard per kind |
| Search shard | — | 4.4 MB raw, 139 KB gz, fetched beside the spine |
| Explanations | — | 6 century files of ~630 KB each |
| **History** | — | **62 446 files, 11.6 MB, one per record, committed on `main` and shipped in the artifact** |
| Per record in the spine | ~420 B / event | 308 B per active event, **224 B per tombstone** (a tombstone still carries `title`, `when`, `place`, `region`, `revised`) |

So the file every page loads whole went from 20.8 MB to 15.3 MB raw at 20k: the spine is 1.36× smaller than the topology it replaced, not the 2.5× the plan projected, and `ARCHITECTURE.md` says so itself ("the wall this project actually runs into barely moved"). At 100 000 events the spine is still ~75 MB raw / ~2.5 MB gzipped, parsed whole on every page, on every device. That is the open item of the first consideration and it is not closed (§5).

Two defects in the harness itself, both small: `tests/bench/run.mjs` runs every case at import time (the `for (const name of chosen)` loop is top-level), so importing `syntheticEvents` from another script re-runs the whole suite — my layout script did exactly that; and `tests/bench/dataset.mjs:193` writes its 62 657-file dataset to `os.tmpdir()` with no flag to put it elsewhere, so a run leaves 276 MB in `/tmp` and there is no case for `layoutGraph` at all (H4b's numbers in STATUS.md came from a script that is not in the repository).

### 2.3 In the browser

Headless Chrome for Testing 152 over `tools/serve.mjs`, 1440×900, the real data and the harness's 20k set (12 000 active events, 8 000 tombstones, 40 000 edges, 500 actors, 1 750 places, no presences, no `review` blocks). B's figures are from its table.

| Measure | B (5 Sept), real / 20k | Today, real | Today, 20k |
|---|---|---|---|
| Bytes at first paint, `index.html` | 3.10 MB / 33 MB | **2.57 MB**, 74 requests (spine 837 KB, search shard 252 KB, `geo/regions.json` 221 KB, land 126 KB, fonts 528 KB, CSS 100 KB); no presence shard until the layer draws | **16.9 MB**, 73 requests (spine 15.3 MB) |
| Ready (navigate → timeline drawn) | ~0.5 s / 2.5 s | 414 ms | 1.12 s |
| JS heap after load | — / 45 MB | 10 MB | 30 MB |
| Drawn at the whole window | 137 marks / — | 14 marks (6 clusters), 137 bars | 325 marks (all clusters), 2 000 bars (all clusters), 0 single bars |
| Click a bar → card | ~15 ms / 704 ms | 34 ms dispatch, card at 2 ms | cluster bar 100 ms; a member from the list 75 ms |
| Click a mark → card | — | 30 ms | cluster mark 30 ms (31 members listed) |
| Wheel notch on the map / ten notches | ~10 ms / 324 ms; 14.6 s | 25 ms / 60 ms | **55 ms / 491 ms** |
| Wheel notch on the timeline / ten | ~15 ms / 2.1 s | 15 ms / 31 ms | 100 ms / 16 ms (the first notch pays for a re-pack) |
| Drag the `to` handle, 40 moves | 40 `replaceState`, 40 panel rebuilds | 40 `replaceState` (one per move, coalesced to a frame each — still 40 URL writes), **0 panel mutations**, `<details>` stays open | 3.17 s for the drag (79 ms per move), 0 panel mutations |
| 25 wheel notches on the timeline | 25 `replaceState` | **1** | 1 |
| Graph tab at the whole window | 24 ms layout / 379 s | 41 ms + 2 ms to nodes; 124 nodes, 10 stacks | 112 ms + **1.03 s** to nodes via the Worker ("Arranging the graph…" shown); 1 627 nodes, 1 605 stacks, 7 454 edges |
| Graph wheel notch / ten | — | 17 ms / 77 ms | **280 ms / 5.3 s** (whole window); 137 ms per notch on a 20-year band, 187 ms on a century |
| Back to the map from the graph | — | 19 ms | 687 ms |
| Search per keystroke | 0.2 ms / 5.7 ms | 0.1–0.3 ms | 0.1–0.4 ms |
| `entry.html` for one record | whole topology | 1.53 MB, 205 ms (the spine, 837 KB, for one record) | **16.1 MB**, 375 ms |
| `sources.html` / `narratives.html` | whole topology | 661 KB, 103 ms / 436 KB, 87 ms, **spine not fetched** (prerendered) | — |
| `contribute.html` ready | — / 276 ms per keystroke | 1.88 MB, 305 ms; picker keystrokes 5.4, 2.0, 1.9, 1.0 ms; a title keystroke with four entries 1 ms | **20.6 MB** (spine 15.3 + search shard 4.4), 724 ms, heap 73 MB; picker 31.7, 2.7, 2.0, 2.2 ms |
| `review.html` ready | ~0.5 s / 5.5 s, 30 543 rows | 2.52 MB, 274 ms, **21 rows in the DOM** of 485; a queue keystroke 2.2–2.7 ms; open a record 36 ms | 20.9 MB, heap 73 MB, **0 rows — "Nothing left: all 62446 records carry a person's name"** (the set has no `review` blocks; §3 R10) |
| Console errors | none | **one**: `ReferenceError: Cannot access 'transform' before initialization` in `graph-view.js:756` whenever the graph is first opened on a narrow window (§3 R7) | none in the runs driven |

Two things the numbers say that the run accounts do not. At 20k the graph view is the slow picture now — 280 ms per wheel notch and 5.3 s for ten on the whole window, against 55 ms on the map — because `stackLayout` runs per zoom bucket over the whole band and there are 1 605 stacks to draw; and every page but the two prerendered ones still pays the whole spine, so `entry.html` for one record is 16 MB at 20k and `contribute.html` is 20 MB. The first paint of the atlas is 1.2× lighter than B measured on the real data and 2× lighter at 20k; the plan's decision 1 promised 2.5× and B's table asked for ~40 bytes per edge.


## 3. Regressions the cycle introduced (my own checks; the fork's diff reading is folded in at §3.2)

### 3.1 Confirmed by experiment

**R1 — `deploy.yml` builds the per-record history on a shallow clone, so every deploy silently commits degraded histories to `main` and the public dashboard shows one version per record.** `tools/lib/history.mjs` (H6b, 08d1369) derives each record's versions from `git log --name-only --diff-filter=AM` and writes `from: "git"` and one version per commit. `deploy.yml` uses `actions/checkout@v4` at the default `fetch-depth: 1`; `validate.yml` uses `fetch-depth: 0`. I cloned the repository with `--depth 1` into the scratchpad and ran `node tools/build-index.mjs`: **all 1 006 history files differ** from the committed ones — each collapses to a single version where, say, `1890-portuguese-legislative-election.json` has three — and `validate --index --quiet` passes in the shallow clone. It passes because H6b *knew*: `compareIndex` (`tools/build-index.mjs:313-333`) exempts `history/` from the byte comparison "the deploy checks out one commit deep". So the invariant `validate --index` stands for ("data/index/ is byte-identical to a fresh build", rule 16) is now false by construction for 1 006 of 1 054 index files; the first push to `main` commits the one-version histories over the full ones (and every later deploy commits again, since the shallow build never equals what a full clone committed); the site's history section — H6b's headline feature — shows one version for every record; and the same one-line omission means the deploy's build is not reproducible from a full clone. Fix: `fetch-depth: 0` in `deploy.yml` (one line), and `recordHistories` refusing to answer `from: "git"` when `git rev-parse --is-shallow-repository` is true (so a shallow build falls back to `revised` explicitly and the exemption in `compareIndex` can go). **S.**

**R2 — `contribution.yml` rebuilds the prerendered pages but commits only `data/`, so every contribution that changes the bibliography fails the PR gate.** H8 (e80aaff) made `build-index.mjs` write `sources.html` and `narratives.html`, and `validate --index` compare them under rule 16 (`tools/validate.mjs:291-299`, `siteDir = ROOT` for the default data). `contribution.yml:74-79` runs `build-index` then `validate --index` in the same checkout (passes, the pages were just written), then `git add data` (`:106`) and pushes. The pull request carries the new records and the index but the base branch's `sources.html`; `validate.yml` runs `--index` on it (the PR touches `data/`) and rule 16 fails on `sources.html` for any bundle that adds a source, cites an existing one (the bibliography prints the citation count), or adds a narrative. The pipeline the owner is waiting on the `CONTRIBUTION_PAT` to test end to end is broken by the last run of the cycle. Fix: `git add data sources.html narratives.html entry` in `contribution.yml`, and the same in `docs/CONTRIBUTING.md`'s local instructions. **S.**

**R3 — the picker's wall-clock test fails under load.** `tests/contribute-browser.test.mjs:60` asserts the first keystroke among 20 000 records under 100 ms; it took 174 ms while the bench ran beside it (14.5 and 6.9 ms after). The test measures the cold cost (the by-kind grouping and the degree table built lazily on the first key, 44–142 ms in the bench) and holds it to a number that depends on the machine — exactly what `tests/bench/run.mjs`'s own header says a test must not do. Under the deploy's `node --test` on a shared runner this will be a flaky gate on `main`. Fix: assert the warm keystrokes only, or build the two tables at page load and assert on the first key with the tables warm. **S.**

**R4 — the bench harness runs at import and litters `/tmp`.** `tests/bench/run.mjs` executes every case at module top level, so `import { syntheticEvents } from '…/run.mjs'` runs the suite (1.5 min, 1.25 GB) as a side effect; `tests/bench/dataset.mjs:193` writes 62 657 files to `os.tmpdir()` with no option and nothing removes them. There is no `layout` case, so the H4b numbers in STATUS.md cannot be reproduced from the repository. **S.**

**R5 — the spine is pretty-printed.** At 20k the spine is 15.3 MB on disk of which ~5.6 MB is indentation; gzip hides it over the wire (506 KB) but `JSON.parse` does not, and the same file is parsed whole on every page on every device. `canonical()` in `build-index.mjs` can emit the spine, the search shard and the explanation shards compact and keep the record files readable. **S.**

**R6 — `tools/import/cache/` (517 Wikipedia leads) is committed** though `CLAUDE.md` says "never published"; it predates the cycle (not a regression) and the deploy allowlist keeps it off the site, but the repository is public. Not urgent.

### 3.2 Found by reading the diffs (the regression fork's list, each item re-checked by me where marked ✓)

**R7 ✓ — Opening the graph for the first time on a narrow window throws, so the graph tab is dead in narrative mode.** `src/graph-view/graph-view.js`: `arrange(state.get())` runs at line 303, `let transform = { x: 0, y: 0, k: 1 }` is declared at line 307, and `arrange` → `adopt` → `fitToWindow()` assigns `transform` when the window is narrower than `FIT_SHARE` of the extent. On the default window `fitToWindow` returns early, which is why every graph browser test passes; from a narrative step (which sets a narrow window), or from any shared link like `?from=1974&to=1976&view=graph`, the first `createGraphView` dies with `ReferenceError: Cannot access 'transform' before initialization` (the browser fork's console: `fitToWindow graph-view.js:756 ← adopt:270 ← arrange:286 ← createGraphView:303 ← showView main.js:154 ← narrative-mode.js:71`) and the graph pane stays hidden. Introduced by H4b d147187/2040581 (the `fitted` flag moved the fit into `adopt`). Fix: hoist the `let` above `arrange`, and a browser test that opens the graph from `?narrative=…&step=3`. **S, must fix.**

**R8 ✓ — Opening an actor or a place now empties the atlas, and walking two hops out of it hides the selected event.** H7 a000bb5/2f9f1bc: an open `?actor=`/`?place=` with no `?focus=` is a lens on itself (`lens.js:207 activeFoci`), and the three views draw only the lens plus its one-hop ring. Measured over the real data: `?actor=angola` → **0 marks, 0 bars** (the map and the timeline are blank; before H7 they drew the atlas with nothing emphasised); 350 of the 412 actors are CShapes polities with no events, so the search's most common answer now opens a blank atlas. And on the pure modules: `?actor=regenerator-party` → open its 1908 election → walk `republic-proclaimed-1910` → walk `1911-…-election` (two steps, both extended by `walkPatch`): the selected event is **not in the lens, not in `workingSet().selected`, and not in the ring**, and the chain's second edge is filtered out of `path` (`emphasis.js:83-94`); the card shows the event, the pictures do not. The owner asked for a lens that hides "what is in no way associated"; what a reader has just clicked is associated by definition. Fix: the implicit lens should keep `selected`, the chain and the consequences of the selected event unconditionally (`emphasis.js` lines 87-94 filter them by `kept`), and an actor with no events should not be a lens at all. **S–M, must fix.**

**R9 ✓ — The panel's render key omits the lens, so the card's own "Focus on this" control is stale.** `panel.js:455-462 keyOf` keys on openings, chain, horizon and window; the lens buttons (`panel.js:315-323`) are computed from `currentFocus(s)` at render. The browser fork: click "Focus on this" on 25 April → URL gains `focus=event:carnation-revolution-1974`, the header chip appears, and the button still reads "Focus on this" (it should read "stop focusing on this"). Nothing patches it in place as `updateWindow` patches the window bits. **S.**

**R10 ✓ — Records the imports create never reach the review queue, and a hand-written record is "reviewed" by default.** `tools/import/wikidata.mjs:508` writes `review: { flags: ['imported-facts'] }` with no `status`; `cshapes.mjs` writes no `review` at all; `tools/new-record.mjs` writes neither `review` nor `origin`. Since H5b `isDraft` is `review.status === 'draft'` (`origin.js:61`), `isReviewed` is `=== 'reviewed'`, and no rule asks anything of a record with neither. The browser fork's dashboard over the harness's 20k set — records with no `review` block — says **"Nothing left: all 62446 records carry a person's name"** with 0 rows, which is false for every one of them. The owner's own first 1415→ records, scaffolded by `new-record.mjs`, will bypass the dashboard the same way. Fix: `new-record.mjs` and both imports write `review.status: 'draft'`; rule 28 (or a new one) makes "neither status nor signature" a warning. **S, must fix before M31.**

**R11 — The timeline no longer lights the horizon's reachable set beyond the 50-year margin.** `timeline.js:531-535` holds out `heldSet(working)` without `{ reachable: true }` (only the map passes it, `emphasis.js:143-165`), so a reachable event past `MARGIN_YEARS` goes into the density strip with no `in-horizon` class and no click; `panel/horizon.js` still says "lit on the map, the graph and the timeline". Invisible on a 135-year dataset with a 50-year margin; wrong at 1415→. Not recorded as a deviation. **S.**

**R12 — A contribution PR now carries `data/index/` (2f2e2c8, 2226324).** `contribution.yml` runs `build-index` and `git add data`; `deploy.yml`'s header still says "PRs never carry it"; plan-review 11 said two branches that both commit the hashed index cannot merge. Every contribution branch will conflict on `manifest.json` with the next deploy's regenerate commit, and `tests/workflows.test.mjs` no longer asserts either way. Together with R2 (pages not committed) the pipeline needs one decision: either the PR carries index *and* pages, or neither and the gate skips `--index` for Action-opened PRs. **S, OWNER DECISION.**

**R13 — `tools/lib/store.mjs` keeps the atlas in memory with no invalidation.** A hand edit, `git checkout`, `new-record.mjs` or `migrate/apply.mjs` while `serve.mjs` runs is invisible to the next save, which validates against stale records and rebuilds `data/index/` from memory over the newer files on disk. `reload()` exists and nothing reaches it. A failed background rebuild is visible only on `/__status` after the PUT answered `ok: true`. **S:** watch `data/` (or re-read on each save's start, which is what it did before H4d and is 1.6 s on this dataset).

**R14 — Every on-screen map mark is a tab stop** (`layers/events.js appendMark`, `tabindex="0"`); the timeline got the roving index B11 asked for, the map did not. 14 stops today, 325 at 20k on the whole world. **S.**

**R15 — Claim/Release is a full record save** (`review/main.js paintClaim` PUTs the record, which is a rewrite plus a background rebuild locally and a correction issue on the public copy). **S.**

**R16 — Migration 004 stamps `origin` from the first author string on every read** (`migrate.js`, `read.mjs migrate: true`), so a new hand-written file whose first author is the assistant is silently `origin.tool: assistant`. Bites only files written from now on without `origin`. **S.**

**R17 — Presence outlines are simplified per polygon at k < 8** (`presences.js detailFor`, tolerance 0.2/0.05) without shared boundaries: slivers and overlaps along inland borders at the world zoom are possible. Not checked visually. **S–M, check by eye (the owner's item 5).**

**R18 — Text that contradicts the code:** the horizon hint says "best-supported first" for the whole list while `rankByCost` re-orders only the first `RANKED = 200`; `deploy.yml`'s header vs `contribution.yml` (R12); STATUS's H5b sentence vs `wikidata.mjs:508` (R10); `panel/horizon.js` vs `timeline.js` (R11); the intro card and the prerendered `narratives.html` print "Claude (assistant draft, unreviewed)" as the narrator on the public page — policy, but the owner should know it is there.

**R19 — Docs.** `CLAUDE.md`'s layout tree names none of the 14 modules this cycle added (`chain`, `density`, `explanations`, `intro`, `render-key`, `util/memo`, `contribute/picker`, `graph-view/arrangement`, `layout-message`, `layout-runner`, `layout-worker`, `review/claim`, `review/history`, `review/row`) nor 11 that predate it (`lens`, `lanes`, `grouping`, `panes`, `share`, `markdown`, `timeline-scale`, `util/viewport`, `entry/*`, `panel/sections`), nor `tools/lib/colour.mjs`, `history.mjs`, `store.mjs`; `ARCHITECTURE.md` misses `contribute/picker`, `explanations`, `intro`, `review/claim`, `review/history`, `util/dom`, `util/geo`, `tools/lib/history`, `tools/lib/store`, `tools/lookup-sources`. Twenty-five of ~90 modules unnamed in the file every session reads first. **S.**

**R20 — A new record under an existing record's name is filed as a correction of it, with no duplicate warning.** In the contribution form, typing "Lisbon" as a new place's name derives the id `lisbon`; the duplicate search skips the record that already has that id (it lists Belém and Parque das Nações and not Lisbon itself); rule 2 treats a bundle record whose id exists as a replacement; the report reads "The bundle validates against the records already in the atlas". The same for an actor named "Salazar" (no near-match at all), while "António Salazar" and "Lisboa" are caught. So the one duplicate that is certain — the same id — is the one the form does not name, and a stranger's "new place" becomes an overwrite of the atlas's most-cited place, one acknowledgement box away. New in H6a's `findDuplicates` (2b5d72a); B6 asked for the opposite. Fix: when a derived id exists, say "this id already exists — you are correcting that record" and switch the template, or refuse. **S, must fix.**

**R21 — Claim reads the reviewer's name at paint, not at click.** `review/main.js:561` captures `who` when the record is painted; a name typed into the box after opening always gets "put your name in the box below first"; only a name already in `localStorage` (`atlas.reviewer`) before the open works. **S.** Also `review.html?open=<kind>/<id>` (the shape `contribute.html?edit=` uses) silently opens the first record in the queue instead of saying the id is not known.

**Checked and not a regression** (the fork's list, spot-checked): the URL grammar (`?year=`, `?bbox=`, `?chain=`, `?lanes=`, `?group=`, one-focus `?focus=`) is unchanged and old links parse as before; replace-writes coalesce, `notify` stays synchronous, a push flushes the owed write; every cache evicts a rejected fetch; the memo caches are keyed on the adjacency object and weak; view render keys are the whole state; every new interpolation goes through `esc()`/`textContent`; rule 11 lookups match the scans; rule 5's incremental walk merges the bundle's own edges so two new edges closing a cycle are caught; the grid clustering and the sweep crossing count are deterministic and equivalent to what they replaced; the spine's tuple edges are read both ways; the deploy allowlist covers everything fetched at runtime; the prerender is idempotent and `--index` compares the pages; the tests went from 588 in 67 files to 921 in 98, and every removed assertion is a rewrite for a changed contract (the `<select>` tests, `isDraft` inverted deliberately, `signRecord` "no review" → "status/signedBy/citations kept"), except `workflows.test.mjs`'s "PRs never carry the index" (R12).

**Data.** 2 773 files changed under `data/`: 1 716 records and 1 057 index/geo files. A script diffed every record at both commits: **all 1 716 changed only in `origin`, `retraction`, `sitelinks` and `review.status`**; no `title`, `summary`, `when`, `place`, `actors`, `sources`, `explanation`, `confidence` or `status` changed; nothing added or removed; every old `review.note` equals the new note plus `retraction.reason` (0 characters lost). The cycle wrote no history.

## 4. The owner's five requests of 5 September, and the two walks

### 4.1 The five requests, checked in the browser

| Request | Verdict | Evidence |
|---|---|---|
| The panel hidden when nothing is open, the view taking its width | **PASS** | Fresh load: grid columns `1440px 0px 0px`, map 1 440 px wide, panel width 0; after a click: `958.8px 6px 475.2px`. The `hidden` attribute is not used (the panel collapses through the grid), which is fine. |
| The timeline fitting its pane | **PASS on the real data, FAIL at the lane cap** | Real: pane 269 px, SVG 269 px, `scrollHeight` 269, 15 lanes at 14.07 px. 20k with `group=actor` at the 20-lane cap: pane 269, SVG **338**, `scrollHeight` 338, `overflow-y: auto` — the lanes have a 14 px floor and 20 of them plus the axis do not fit, so the pane scrolls again. The M33 grouping by office will hit the same cap. |
| The generalised lens (any number of foci of any kind, union or intersection, dimmed ring) | **PASS as built; two defects** | `?focus=actor:antonio-de-oliveira-salazar,place:lisbon` → two chips, map 9 marks + 8 near, timeline 106 bars + 47 near, graph 106 nodes + 47 near — the three views agree; `&focusAll=1` → 4 marks, 23 bars; four kinds at once work; a chip's × removes one focus; an unknown id shows "actor nobody-here × show everything". Defects: the implicit lens on an open actor blanks the atlas for the 350 event-less actors and drops a selected event two hops out (§3 R8); the card's "Focus on this" button does not flip after the click (§3 R9). |
| The halo fix | **PASS** | After ten notches (k = 9.8): label `stroke-width` 0.306 user units, `font-size` 1.123, ratio 0.273 at every zoom, `stroke-width × k = 3 px`, `font-size × k = 11 px`, `paint-order: stroke`, white stroke. The halo is 3 px at every zoom, as fd6aa96 says. |
| Back | **PASS** | Map event → actor from its chip → graph → Back: URL `?selected=carnation-revolution-1974`, map shown, graph hidden, card "25 April", band 1899–2025; a second Back: `?bbox=…`, "Pick an event". 25 April → actor → band dragged to 1924–2025 → Back: URL `?selected=carnation-revolution-1974`, band back to 1899–2025, horizon field back to the default. In a narrative, Graph then Back keeps `?narrative=…&step=3` (decision 9) — but the graph never appeared (§3 R7). |

### 4.2 The newcomer's walk (B's item 2), re-walked

1. **First contact.** An introduction card over the whole-width map: "137 events · 161 links · 412 actors · 34 sources", **Start here** on the one narrative (opens `?narrative=…&step=0`, card "How the colonial war ended the regime" — works), six heaviest events by `weight` ("25 April 1974, Portugal joins the EEC 1986, Constitution of 1976, Coup of 28 May 1926, Legislative election of 2022, Beginning of the war in Angola 1961" — `weight` is degree plus actors, so the 2022 election is "what most of it hangs on"), a five-step walkthrough. Dismissed once it stays dismissed; "?" brings it back; a link to a record never shows it. What it prints as the narrator is `Claude (assistant draft, unreviewed)`. Changed for the better; the "heaviest" list is mechanical and says so (at 20k it is "Bench event 000042…47", six ties broken by id — `weight` needs a second key before the world arrives).
2. **Search "25 april" → choose.** URL `?selected=carnation-revolution-1974`, band unchanged 1899–2025, **0 faded bars, 0 faded consequences** (B: 79 of 137 faded). Fixed. "carnation" still finds nothing but a 1980 election whose summary sentence mentions it; "otelo" finds the actor then 25 April (through the lead); "why is angola poor" and "colonial war" find nothing useful. B17 stands until somebody writes `names`.
3. **Click a consequence's mark on the map** → `?selected=alvor-agreement-1975&chain=carnation-revolution-1974--alvor-agreement-1975--caused`, the chain drawn; the same from the timeline bar. Fixed (B10).
4. **Open a "Why", wheel on the map and on the timeline** → the `<details>` stays open, the URL gains `bbox`; a 40-move drag of the handle rebuilds the panel 0 times. Fixed (B12/A3). Still 40 `replaceState` calls per 40-move drag — one per frame is the design; Safari's 100-per-30-s limit is guarded by `try/catch`, not avoided.
5. **Horizon 2000 on the Angola war, then click the 1926 coup** → `?selected=coup-28-may-1926`, 0 marks lit, the horizon field back to the default. Fixed (B9).
6. **Click the Lisbon stack on the world map** → "67 events here — Lisbon", the list still there after the zoom settles and the bbox is written. Fixed (A5).
7. **`?actor=angola`** → the card says "polity · 1975 – ongoing", the CC BY-NC-SA line, the CShapes paragraph; **0 marks, 0 bars** — the atlas is gone from the pictures (§3 R8); no "Before and after" because no `succeeded` relation exists (B28). `?actor=angola-under-portugal`: also 0 marks 0 bars although the events name `mpla`, `estado-novo`, `salazar` — the Angola events are not filed under either Angola. Worse than before for this case: B saw an empty card over a full map; the newcomer now sees an empty card over an empty map.
8. **Keyboard.** 15 focusables in the map (every on-screen mark, `role=button`, labelled "25 April — and 66 more events here"), 19 in the timeline (one roving stop per lane), Enter on a bar opens its card, Enter on a cluster mark opens its list, → moves along the lane. Fixed (B11); the map has no roving index (§3 R14).
9. **A pan** → "137 of 137 events in view", the world is never written as a box. Fixed (B15).
10. **Retracted / merged / missing by URL** → the notices as before; a chain with a retracted step is cut with a notice (B34).
11. **The graph tab** from any window narrower than about half the extent — a narrative step, a shared `?from=1970&to=1980&view=graph`, or the band narrowed after the graph was opened — **throws and the graph stays hidden** (§3 R7). This is new, and it is the one thing on the walk that is broken outright.

### 4.3 The contributor's walk (B's item 3), re-walked

1. **`contribute.html`** loads in 305 ms and 1.88 MB (spine + search shard). Two entries by default (a source and an event); the only `<select>`s left are closed vocabularies (source type, container kind, calendar, region — 21 options in all).
2. **Add edge → the `from` picker.** Three letters cost 5.4, 2.0, 1.9 ms; a row reads "1980 Portuguese presidential election · event · 1980 · 1 link"; choosing it with the keyboard writes the id and lists the record's existing links ("this — reacted-to → The revision that abolishes the Council of the Revolution"). At 20k: 31.7 ms cold then 2–3 ms. This is what B6/A10 asked for.
3. **Duplicates.** "Lisboa" → Lisbon; "António Salazar" → Salazar; a pasted Wikidata URL → "the same Wikidata item", certain; the same source title → found; an event titled "Carnation Revolution" → "25 April (carnation-revolution-1974) — a similar name" (the alias catches it even though search does not). **But the record's own name is the trap** (§3 R20): "Lisbon" as a new place lists Belém and Parque das Nações and not Lisbon, "Salazar" as a new actor lists nothing, and the report says the bundle validates — because the derived id already exists and the bundle is read as a correction of it.
4. **The bundle.** Preview 2.9 KB; the report lists 18 problems for the empty entries, in schema language ("must match ^[a-z0-9]+…") rather than in the contributor's; submit disabled until they are fixed.
5. **"Edit this record"** on the 25 April card → `contribute.html?correction=1&edit=event/carnation-revolution-1974` opens prefilled (title, id, eight actor rows) with the correction template behind the button — fixed (B26). But the prefilled record is then held as a **near-match of "Fifty years of 25 April"** and the submit stays disabled with "Confirm the near-matches above first" until the acknowledgement is ticked; a correction of an existing record should not be asked whether it duplicates a different one. The prefill is 2.4 KB of the 6 KB cap, so one event fits; an event plus its edge and a new source will not, and the answer is still "paste".
6. **`review.html`** over a scratch copy of the data: 274 ms, 21 rows drawn of 485, the progress line by kind, chips by kind, flag and writer, four sort orders, a queue keystroke 2–3 ms; open a record 36 ms with **History — 2 versions** ("2026-09-02 origin, review; 2026-09-02 written"), Claim/Release with a reviewer name stored before the record was opened (writes `review.claimedBy` with a 7-day expiry, the queue row says who is reading it — a name typed after opening is not seen, §3 R21), a **diff against the draft** from the first keystroke ("1 field changed since the draft: review { status, signedBy, citations }"), an edge opened with both ends' summaries and standing, the citation warning ("1 citation on this record has not been checked… Signing is allowed"), Sign → `review.status: reviewed`, `signedBy`, the `citations` ticks kept, `authors` replaced by the signer, the index rebuilt behind the answer and `/__status` saying `fresh`; Retract with the reason prompted, the cascade named in a confirm and written with "Retracted with alvor-agreement-1975: … (rule 11)" on each edge and the narrative. Off localhost the banner says the page cannot write. This is the review pipeline B7/A7/A31 asked for, working.
7. **What the contributor still cannot do:** file anything without a GitHub account (deferred); have the Action's pull request pass its own gate (§3 R2, R12); see their record in the queue if it was scaffolded by `new-record.mjs` (§3 R10).

## 5. Verdict

**Not acceptable as it stands; acceptable after one short corrective run.** The cycle did most of what the plan said — 48 of the 70 findings are resolved in the code and the measured hot paths are 5–600× cheaper — but it left the tree with three defects a reader or the owner will hit on the first day (R7, R8, R10), broke the contribution pipeline's own gate (R2, R12) and the deploy's reproducibility (R1), and the one architectural change the first consideration turns on — the whole-corpus file every page parses — was narrowed to a rename. The owner's standing instruction says "if necessary repeat this cycle"; it is necessary, and the repeat is small: one run of one-line fixes, one owner decision, and then a second, longer cycle on the index that can run beside M30a–M35 but must land before M40–M43.

### 5.1 Must change before M30a starts (one run; everything S unless marked)

1. **R7** — hoist `let transform` above `arrange()` in `graph-view.js`; a browser test that opens the graph from `?from=1970&to=1980&view=graph` and from a narrative step. Without this the graph is dead on every narrow window and in every narrative.
2. **R8** — the implicit lens keeps `selected`, the chain and the selected event's consequences unconditionally, and an actor or place with no events is not a lens (show the atlas, emphasise nothing, say "no events name this actor; see Before and after"). **OWNER DECISION** on the second half: whether opening an actor should ever remove the rest of the atlas by default, or only dim it — the owner's words were "hiding what is in no way associated and showing direct connections dimmed", and 350 of 412 actors have nothing associated at all.
3. **R10** — `tools/new-record.mjs`, `wikidata.mjs` and `cshapes.mjs` write `review.status: 'draft'`; a validator warning on a record with neither `review.status` nor `signedBy`; a test that an import-created record `isDraft`. M31 drafts 130 tenures under the exception and every one of them must reach the queue.
4. **R1** — `fetch-depth: 0` in `deploy.yml`; `recordHistories` falls back to `revised` explicitly on a shallow clone; the `history/` exemption in `compareIndex` then goes and rule 16 means what it says again.
5. **R2 + R12** — `contribution.yml` commits the pages with the index, or the PR carries neither and the gate skips `--index` for Action-opened branches; `deploy.yml`'s header and `workflows.test.mjs` say which. **OWNER DECISION** (it is the merge-conflict question plan-review 11 raised). Then run one bundle end to end, which needs the `CONTRIBUTION_PAT` the owner has not set.
6. **R3** — the picker test asserts warm keystrokes, or warms the tables at load; **R4** — the harness guarded on `import.meta.url`, the dataset under a flag, a `layout` case.
7. **R20** — a derived id that already exists is named as such in the form and the bundle is filed as a correction of that record, not as "validates"; **R21** — Claim reads the name box at click.
8. **R9** — the panel patches its lens controls in place (or puts `focus` in its key); **R11** — the timeline passes `{ reachable: true }` to `heldSet` or the horizon card stops promising it; **R13** — `store.mjs` re-reads `data/` at the start of each save (1.6 s) or watches it.
9. **R19** — `CLAUDE.md`'s layout tree lists the 25 unnamed modules; it is the file every session reads first and it is a cycle behind.

### 5.2 A second cycle, beside M30a–M35 and before M40–M43

1. **The index by density (A1/B1, L, OWNER DECISION).** `ARCHITECTURE.md` still says "the spine stays whole" and measures that the wall barely moved. What convergence needs whole is `[from, to, type, confidence]` and a year per event — ~40 bytes per edge, ~30 per event; everything else the spine carries (titles, `when` objects, actors with roles, 47 % of it presences, relations, narratives) is read by a card, a mark or a lane and can come by period or by kind on demand, with the search shard already carrying labels for the picker. First step, free: emit the spine compact (R5: 15.3 → ~9.7 MB at 20k). Second: presences out of the spine into the period index they already have geometry shards for. Third: attributes by period. Until this is done `entry.html` costs the whole atlas per record, `contribute.html` and `review.html` cost 20 MB at 20k, and 100k is ~75 MB parsed on a phone — M42 ("imported world events at scale") cannot be built on it. **L**.
2. **The history directory (M).** One file per record, committed and shipped: 62 446 files at 20k, 11.6 MB, one `git log` walk per build. Shard the histories by kind and period like the review digests, or keep a single history file per kind and read the record's entry out of it; and decide whether git history belongs in a build artifact at all, given R1.
3. **The graph at scale (M).** 280 ms per wheel notch and 5.3 s for ten at 20k on the whole window: `stackLayout` per zoom bucket over 1 605 stacks. Memoise per bucket (the key exists), draw stacks only inside the viewport as the map does, and cap what a frame draws. And a `layout` bench case so the number is in the repository.
4. **The lane cap (S–M, OWNER DECISION).** Twenty lanes at a 14 px floor do not fit a 269 px pane; the request "the timeline fits its pane" holds for 15 lanes and fails at the cap M33's office grouping will reach. Either the floor gives, or the cap does, or the pane scrolls by design and the request is amended.
5. **A rename tool before `led` is retired (A21, M).** M30a re-types twelve relations by hand; H5a makes references resolve through aliases, which is the safety net, not the tool. `tools/migrate-ids.mjs` (rename, alias, rewrite every reference, validate) is the decision the plan took and did not ship.
6. **Data, not code, that the reader will notice (owner, under the exception's scope):** `names` on the events that have common names (B17 — "carnation" still finds nothing); `succeeded` relations for the 77 colony/state pairs (B28 — Angola still opens empty); `review.status` on any record written by hand from now on.
7. **The Why mode's missing ground (S, with M35):** a `generated` value for `origin.tool` or a `provenance` on the walk, a producer for `?walk=`, and the condition endpoints plan 11a named.
8. **Presence outlines at low zoom (S–M, by eye):** per-polygon simplification without shared borders (R17) — the owner's item 5 list should include "borders at the world zoom".

### 5.3 Can wait

R6 (the committed Wikipedia cache), R14 (a roving index on the map), R15 (claim as a full save), R16 (origin guessed on read), R18 (four sentences that contradict the code), A24's licence enum, B26's 6 KB prefill and the whole-record correction, B29's day-granular `?v=`, B31's `data/imported/` tree, the intro's narrator line, and the 40 `replaceState` calls a 40-move drag still makes.

### 5.4 Readiness by milestone, in one line each

- **M30a (offices, tenures, `led` retired, `parent`, `?why=`):** the registry makes a kind ~8 places instead of ~30 and an edge or relation type 4–6; still hand tables in `search.js:67-122`, `picker.js:33-42`, `bundle.js`'s field lists, `grouping.js:32` and the `buildTopology` if-chain — acceptable, and the brief should list those five. Blocked only by 5.1 (R10 for the drafts, the rename tool for `led`).
- **M30b/M31/M32:** on the queue and the exception — R10 first.
- **M33 (lanes, lenses):** on the lens — R8 first, and 5.2.4 for the cap.
- **M34:** history is built (H6b) — R1 first, or the public copy shows one version per record.
- **M35 (Why mode):** `subgraph`, the explanations shard, ranking as ordering and the multi-focus lens are the ground it needs; R7/R8 first since the graph and the lens are how it is read; 5.2.7 with it.
- **M36–M38 (base map):** `map.js` reads the box through the CTM and the presence layer caches paths per projection and tolerance, so the layers slot under it; first paint is 2.57 MB before any base map data, of which 221 KB is region polygons index.html loads only to answer "is a placeless event in view" — that is the first thing a base-map budget should reclaim.
- **M39 (projection):** `projection.js` is 85 lines and the only file with lon/lat maths (checked: `land.js`, `events.js`, `viewport.js` call `project()`; `map.js` holds 960×540 as constants); ready.
- **M40–M43 (the world at scale):** **not ready** — 5.2.1 and 5.2.2 first. Every number in §2 that grew with the corpus (the spine, the history files, `entry.html`, the graph's zoom) grows with the world.


# The second index cycle — plan, 6 September 2026

Written after the closing review of the health cycle
(`docs/health-review-2026-09-06-result.md`), whose §5.2 is the list this
cycle exists for, and against the owner's seven considerations. The health
cycle's verdict was that the project is acceptable **after one corrective
run** (H9, landed) and that "the one architectural change the first
consideration turns on — the whole-corpus file every page parses — was
narrowed to a rename". This plan is that change, plus the six smaller items
§5.2 lists beside it.

It runs **beside M30a–M35 and before M40–M43**, on `m0`, as nine gated runs
`I1`–`I9`. The briefs are in `docs/index2/`.

## 0. What was measured, and on what

Everything below was measured on this machine on 6 September 2026, on `m0`
at `c14a851` (M30b-1 claimed, M30a landed), with `node tests/bench/run.mjs`
and two scripts over the built index. The bench harness's own header is
right that a committed number is a number that was true on somebody else's
machine; what these are for is the **ratios** and the **byte counts**, and a
byte count is the same everywhere.

**The dataset today.** 1,737 records: 329 events (137 active), 161 edges,
412 actors, 26 places, 710 presences, 43 relations, 9 offices, 12 tenures,
1 narrative, 34 sources; 5 regions. `node tools/validate.mjs --index`: 0
errors, 1,157 warnings, 493 drafts, 1,928 of 1,928 citations unchecked,
1.61 s warm / 2.89 s cold.

**`data/index/` today.**

| File | Bytes |
|---|---|
| `manifest.json` | 21,927 |
| `spine-d561eda4427c.json` | 542,882 raw, 60,796 gzipped |
| `search-6da1bcb62212.json` | 171,186 |
| `sources-78108ff40e94.json` | 33,677 |
| `review-*.json`, 9 files | 374,673 |
| `explanations-*.json`, 3 files | 74,043 |
| `history/`, 1,027 files | 4.1 MB |

**Where the spine's bytes are**, on the real data — the number that decides
the first two runs:

| Kind | Bytes | Share | Per record |
|---|---|---|---|
| presences | 267,108 | 49.2 % | 376 B |
| events | 125,196 | 23.1 % | 381 B |
| actors | 106,557 | 19.6 % | 259 B |
| edges | 17,068 | 3.1 % | 106 B |
| relations | 11,918 | 2.2 % | 277 B |
| places | 7,763 | 1.4 % | 299 B |
| tenures, offices, narratives | 7,158 | 1.3 % | — |

**At 10⁴.** The bench harness's own dataset — 20,000 events of which 8,000
tombstones, 39,996 edges, 500 actors, 1,750 places, 200 sources, **no
presences** — built with `node tools/build-index.mjs --data …`:
spine **9,702,465 B raw / 499,744 gzipped**; search shard 2,753,125 /
133,386; sources 142,757; manifest 4,984; six explanation shards of ~630 KB;
62,657 files in all. Inside the spine: events 5,493,761 B (56.6 %), edges
3,622,232 (37.3 %), places 470,447, actors 115,901 — **307 B per active
event, 223 B per tombstone, 91 B per edge tuple**.

**What the hot paths cost** (`node tests/bench/run.mjs`, every case):
`clusterPoints` 15.3 ms at 14k points and 110 ms at 70k; `layoutGraph`
7.48 ms on the atlas, 435 ms at 5,000 edges, 4,493 ms at 30,000, 239 ms on a
twenty-year band of 20,000 events; `stackLayout` on that band 6.38 ms at
k=1 and 15.6 ms at k=4; a map wheel notch 12.1–12.4 ms; `presencesAt`
0.07 ms indexed against 2.39 ms scanned; a timeline notch 6.73 / 11.3 /
23.0 ms at three band widths; `reachableBy` 11.2 ms; four askers of the
horizon 40.7 ms unmemoised, 14.3 ms on a new selection and 3.34 ms on the
same one; a search keystroke 1.0–1.8 ms; the picker 49.7 ms cold then
1.3 ms; the review list 2.48 ms to first paint with 23 rows in the DOM;
`checkRules` 432 ms at 20k; `build-index` 13,420 ms at 20k; `validate`
14,409 ms and `--index` 15,875 ms at 20k.

**One spine entry per kind, today.** An active event carries `actors` (with
`role` and an optional `note`), `aliases`, `citesCount`, `id`, `kind`,
`place`, `region`, `revised`, `status`, `supersededBy`, `title`, `weight`,
`when` (the object verbatim), `wikidata`, `wikipedia`, and where the record
has them `parent`, `scope`, `category`, `subtreeWeight`. An edge is six
slots, `[from, to, type, confidence, status, revised]`. An actor carries
`actorType`, `name`, `names`, `when`, `citesCount` and the envelope; a place
`name`, `names`, `where`, `region`, `citesCount`; a presence `actor`,
`when`, `geometry.key`, `dependencyOf`, `dependencyKind`, `capital`,
`confidence`; a relation `from`, `to`, `type`, `when`, `note`; an office
`of`, `title`, `category`, `when`; a tenure `person`, `office`, `when`,
`startedBy`, `note`; a narrative `title`, `summary`, `authors`, `window` and
its steps' refs. A tombstone keeps only `TOMBSTONE_KEYS`.

**Four re-encodings, measured on both datasets**, to decide the shape rather
than argue about it:

| Encoding | Real, raw / gz | 10⁴, raw / gz |
|---|---|---|
| the spine as built today | 530.2 / 57.4 KB | 9,475.1 / 445.3 KB |
| the same, presences taken out | 269.4 / 35.0 KB | unchanged (no presences) |
| every record as a row over an id table, vocabularies as integers — **the core**: ids, merges, each event's years, status, place, region, weight and actor ids, each edge's ends, type, confidence and status, each actor's type and years, each place's point | **50.0 / 11.9 KB** | **1,810.6 / 296.9 KB** |
| the attributes the core drops — title, `when` verbatim, roles and notes, identity, `citesCount`, `revised`, `parent`/`scope`/`category`/`subtreeWeight`, names, `where` | 116.2 / 23.7 KB | 2,387.6 / 157.1 KB |

Per record in the core: **18.9 B per edge, 31.6 B per event, 21.0 B per id**
(25.3 B on the real corpus, whose ids are longer). The id table is the floor
and there is no getting under it: the browser has to hold every id to
resolve a `?selected=` and to write a link.

## 1. The goal, restated against the seven considerations

**Scale to tens or hundreds of thousands of nodes.** Convergence cannot be
answered from a window — that is why the graph is loaded whole, and it stays
whole. But "the graph" is `[from, to, type, confidence, status]` and a year
and a status per event, and that is 5.2× smaller than the file the atlas
loads whole today at 10⁴. Everything else in the spine is read by a card, a
label or a strip, and can arrive after the picture does. This cycle draws
that line and moves everything on the far side of it off the first paint.

**Easy exploration.** Nothing about the reader's picture changes except that
it appears sooner; the one visible consequence is that a bar or a mark may be
drawn a moment before its title is, and it is redrawn when the title lands —
the discipline `loadGeometry`, `loadCiters` and `loadExplanations` already
follow. Two things get better: the graph stops costing 280 ms a wheel notch
at 10⁴ (I6) and the timeline stops overflowing its pane at the cap (I6).

**Easy to add features and categories.** The index's shape becomes a table
in one place, not a hand-written projection per kind: `buildSpine` today is
nine hand-written object literals, and after I2 it is nine column lists over
one encoder. A tenth kind is a row in that table. Nothing in this cycle adds
a vocabulary; `data/roles.json` and `data/categories.json` stay the way a
category is added.

**Contributors without coding.** Untouched, and protected: `contribute.html`
costs 20 MB at 10⁴ today because it loads the whole spine for a picker that
reads the search shard. After I4 it takes the core and nothing else. I7
gives the project the one tool a contributor's mistake needs and nobody has:
a rename that leaves every old link working.

**Straightforward review.** `review.html` costs 20 MB at 10⁴ for the same
reason and is fixed the same way. I5 stops the history directory growing to
62,446 files, which is what a reviewer's "what changed since the draft"
rests on.

**Robust.** Not one record under `data/` changes shape in this cycle, so
there is no migration to get wrong; the index is generated and regenerated
whole in every run, and `node tools/validate.mjs --index` is the gate. The
proof that a reshape drops nothing is already written:
`tests/spine-loader.test.mjs` builds an atlas from the file and an atlas from
`buildTopology`'s own output and asserts they are the same atlas. Every run
below keeps that test and never edits it to pass.

**Data portable if the spine is restructured.** This is the consideration the
cycle is *designed around*: `data/` is the atlas and `data/index/` is a
projection of it. Restructuring the projection is a rebuild, not a
migration — no `src/validate/migrate.js` step, no `tools/migrate/apply.mjs`
run, no record rewritten. A reuser who takes `data/` gets everything; a
reuser who takes `data/index/` gets a file whose shape the manifest names and
whose version number says which shape it is.

## 2. Decisions, with the alternative rejected for each

**D1. The presences leave the spine for a file of their own.** They are
49.2 % of it on the real data, nothing draws them until the territory layer
does, and their outlines are already fetched a shard at a time by year.
`atlas.presencesAt` answers `[]` until the file lands, exactly as
`atlas.loadedGeometry` answers null until an outline lands, and the layer and
the actor card ask for it the way the source card asks for its citers.
*Rejected:* sharding the presences by the same periods as the geometry —
their metadata is 261 KB whole and an interval index over all of them is what
makes `presencesAt` 0.07 ms; splitting it would trade a measured 34× for
nothing. *Rejected:* leaving them in and calling the spine small enough,
which is what the health cycle did.

**D2. The lane polygons leave the first paint for four numbers in the
manifest.** `data/geo/regions.json` is 221 KB and `index.html` loads it to
answer one question — is a placeless event's region inside the viewport —
which `regionBounds` immediately reduces to one box per region. The build
already has the polygons in hand for `deriveRegion`; it writes the boxes into
the manifest and the page stops fetching the file. *Rejected:* keeping the
fetch and calling it deferred: the review measured it as first paint
(§2.3), and the M36–M38 base-map budget has to reclaim it anyway.

**D3. Every record in the index becomes a row over a shared id table, and the
closed vocabularies become integers.** Measured: 5.2× smaller raw at 10⁴ and
10.6× on the real data, with the id table 21–25 B per record and everything
else 19–32 B. gzip already hid most of this over the wire — the win is
`JSON.parse` and heap, which is where the wall is. The edge tuple has been a
positional row since H3a and is read both ways; this is that idea applied to
the other eight kinds. *Rejected:* a binary format (breaks "plain ES modules,
no build step" and makes the index unreadable in a diff). *Rejected:* leaving
the objects and relying on gzip: 445 KB over the wire at 10⁴ but 9.5 MB
parsed, on a phone, on every page.

**D4. The index splits into a core and attribute shards by period, and the
core is what every page loads whole.** The core is what the whole-graph
guarantee needs plus what a mark, a bar and a lane need: ids, the merge and
alias map, per event its status, its year bounds, its place, its region, its
weight and its actors' ids; per edge its ends, type, confidence and status;
per actor its type and years; per place its point. The attributes are
everything a card, a label or a strip reads: titles, `when` verbatim, roles
and their notes, identity fields, `citesCount`, `revised`, `parent`, `scope`,
`category`, `subtreeWeight`, names, `where`'s label and precision. They are
sharded by century, on the same boundaries `src/explanations.js` already
uses, fetched for the window and never waited for, and held under an LRU cap
so a session that has read six centuries does not hold six centuries.
*Rejected:* sharding by kind only — the events are 56.6 % of the file at 10⁴
and one file of them is the same problem with a different name. *Rejected:*
sharding the *core* by period, which is the thing convergence forbids.
*Rejected:* doing nothing here, on the grounds that H3a tried period shards
and cancelled them: H3a sharded a *supplementary* payload of 288.6 KB and
kept the whole spine; this splits the spine itself, and I3 measures it before
I4 spends it (see §5).

**D5. The whole-corpus file is not replaced until the split is measured.**
I3 emits the core and the attribute shards **beside** the spine and prints
the bytes; I4 moves the pages over one at a time and stops writing the spine.
That is H3a → H3b → H3c, the sequence that worked, and it means a run that
finds the split does not pay can stop without leaving the tree half-changed.
*Rejected:* one run that switches everything, which is what the health
review's own §1.3 item 1 is a complaint about.

**D6. There is no `data/` migration in this cycle, and the index carries a
version.** `manifest.schema` names the index's generation and goes up by one
in every run that changes the index's shape — 1 today, 2 after I1, 3 after
I2, 4 after I3, 5 after I4, 6 after I5 — and the core file carries the same
number. `src/data.js` refuses a generation it does not know, loudly, instead
of misreading it. *Rejected:* one bump at the end (a half-applied deploy
would read the wrong shape silently). *Rejected:* a migration chain step:
`src/validate/migrate.js` is for records, the index is generated, and putting
a generated file on the record chain would be the first thing to confuse the
two.

**D7. The prerendered pages must come out byte-identical through I1–I5.**
`tools/lib/prerender.mjs` reads `atlas.sources` and `atlas.resolve()` and
nothing else; if a reshape changes a page's bytes, the reshape dropped
something. Each run asserts it. *Rejected:* rebuilding the pages as a matter
of course, which would hide exactly the regression this catches.

**D8. The history index shards by kind and period.** 1,027 files and 4.1 MB
today, 62,446 files and 11.6 MB at 10⁴, all committed and all shipped. One
file per kind and century, named in the manifest, keyed by record id inside,
fetched when a reviewer opens a record — the shape the review digests and the
explanation shards already have. *Rejected:* one file per kind (10 MB to show
one record's history at 10⁵). *Rejected:* dropping the histories from the
artifact — M34 is the dashboard's history and the public copy is where a
reader sees it (**owner question 2**).

**D9. The graph's stacks are keyed and computed per zoom bucket, and drawn
inside the viewport.** `graph-view.js:559` keys its stacking on the raw `k`,
so every wheel notch is a cache miss and a re-cluster of the whole band;
`src/map/layers/events.js:256` has used `zoomBucket(k)` since H4a and pays
12 ms a notch where the graph pays 280. Same function, same exemption for the
click that opens a stack no zoom quite parts. *Rejected:* raising the layout
threshold or leaning harder on the Worker — the Worker is already
load-bearing against plan-review 14's condition and this removes work rather
than moving it.

**D10. The timeline's row cap is derived from the pane it has.** Twenty rows
at the 14 px floor plus the axis do not fit a 269 px pane, which is why the
owner's own "the timeline fits its pane" passes at 15 rows and fails at the
cap; `maxRows` becomes `clamp(floor((paneHeight − AXIS_HEIGHT) / floor), 1,
MAX_ROWS)` and `MAX_ROWS` becomes a ceiling instead of a promise. *Rejected:*
lowering the floor (a ten-pixel row is not a row) and *rejected:* letting the
pane scroll by design, which contradicts the request. **Owner question 1.**

**D11. `tools/migrate-ids.mjs` ships, and a former id keeps resolving through
`aliases`.** The rename is the half of plan decision 3 that was never
shipped, and the ten `allied-with` re-typings and every future correction of
a slug wait on it. The tool renames the file, appends the old id to
`aliases`, rewrites every reference in every record — including the derived
ids of every edge that touches a renamed event, each of which gets *its* old
id as an alias — rebuilds the index and validates. *Rejected:* relying on
`resolveId` alone, which is the safety net and not the tool. *Rejected:*
non-derived ids, which decision 3 already refused.

**D12. The two data gaps the reader notices are closed by the imports, not by
hand.** "Carnation" finds nothing because no event carries `names`; Angola
opens empty because no `succeeded` relation touches it. Both are data, and
this cycle is code — so the Wikidata import gains a `names` fill (additive,
absent-only, never on a `reviewed` record) and the CShapes split table gains
a derived `succeeded` relation per colony/state pair. Neither writes a
sentence a person did not write: an import quoting its source is the owner's
standing exception of 5 September, and every record carries
`origin: { tool }`, `review.status: "draft"` and `review.flags:
["imported-facts"]`. *Rejected:* the assistant drafting the names and the
relations, which is a historical claim and is refused by `CLAUDE.md`.
**Owner questions 3 and 4.**

**D13. The Why mode's ground is a producer and a provenance, and no generated
record.** Plan decision 7 stands: a generated walk never enters `data/`.
`?walk=` is parsed and reserved and has no producer; I9 writes the producer
as a pure module, gives the walk a provenance object the card prints, and
says in `CONTRIBUTING.md` and `ARCHITECTURE.md` what a condition endpoint is,
which is what plan decision 11a asks for. `?why=` itself stays M35's, as
M30a's amendment A14 decided. *Rejected:* a `generated` value in
`ORIGIN_TOOLS` — `origin` says who created a *record*, and a walk is not one.

## 3. The byte budget for the first paint

"First paint" is what `index.html` fetches before the timeline is drawn,
index and geometry only — fonts and CSS are the same either way and are
excluded so the numbers compare.

**Today, on the real data:** manifest 21.9 + spine 542.9 + sources 33.7 +
land 126.0 + palette 4.0 + `geo/regions.json` 221.1 = **949.6 KB raw**, with
the search shard's 171.2 KB fetched beside and never waited for.

**The budget this cycle is held to:**

| | index bytes at first paint | after |
|---|---|---|
| the real data (137 active events) | 542.9 KB raw / 60.8 gz | **≤ 60 KB raw / ≤ 15 KB gz** (measured achievable: 50.0 / 11.9) |
| 10⁴ events, 2 edges each | 9,702 KB raw / 488 gz | **≤ 2.0 MB raw / ≤ 320 KB gz** (measured achievable: 1,810.6 / 296.9) |
| 10⁵ events, 2 edges each | ~47 MB raw / ~2.4 MB gz (projected) | **≤ 11 MB raw / ≤ 1.8 MB gz** (projected: 3.2 MB ids + 3.2 MB events + 3.8 MB edges) |

Whole-page, real data, after D1 and D2: 22 (manifest, now carrying the region
boxes) + 50 (core) + 33.7 (sources) + 126.0 (land) + 4.0 (palette) =
**≈ 236 KB raw**, from 949.6 — 4.0× less, and the largest remaining item is
the coastline file the base map replaces.

What is *not* at first paint and must not become so: the attribute shards
(≈ 116 KB raw on the real data, ≈ 2.4 MB at 10⁴, one century at a time), the
presences (261 KB), the search shard, the citers, the explanations, the
review shards, the histories, the geometry.

At 10⁵ the attribute payload is ~12 MB raw over six century shards, ~2 MB
each. A reader who opens the atlas at the whole extent gets the core, the
picture, and then the shards in year order while the page is already
answering; the LRU keeps at most four in memory, which is the heap ceiling
the budget rests on. **Owner question 6.**

## 4. What stays byte-identical, what changes shape

| | I1 | I2 | I3 | I4 | I5 | I6 | I7 | I8 | I9 |
|---|---|---|---|---|---|---|---|---|---|
| records under `data/` | — | — | — | — | — | — | — | new relations | — |
| `src/validate/migrate.js` | — | — | — | — | — | — | — | — | — |
| `data/index/` | rebuilt | rebuilt | rebuilt | rebuilt | rebuilt | — | — (the tool rebuilds when a person runs it) | rebuilt | — |
| `tests/fixtures/data/index/` | rebuilt | rebuilt | rebuilt | rebuilt | rebuilt | — | — | rebuilt | — |
| the prerendered pages | identical | identical | identical | identical | identical | identical | identical | change | identical |
| `manifest.schema` | 2 | 3 | 4 | 5 | 6 | — | — | — | — |

No run in this cycle rewrites a record's fields, so **no migration is
consumed and `tools/migrate/apply.mjs` is not run**. I7's tool rewrites
records when the owner runs it, which is a tool being used and not a
migration. I8 adds records and therefore changes the prerendered pages'
counts, which is why it is late in the order.

## 5. The order of the runs, and why

1. **I1 — the presences out of the spine; the region boxes into the
   manifest.** First because it is the largest single saving on the real data
   (49.2 % of the spine and 221 KB of polygons), because it touches nothing
   the later runs reshape, and because it establishes the "the atlas answers
   emptily until the file lands" discipline that I4 depends on.
2. **I2 — every record a row over an id table.** Before the split, because
   the split's columns are easier to draw on rows than on objects, and
   because it is the change with the clearest test (`spine-loader.test.mjs`
   is untouched and must still pass).
3. **I3 — the core and the attribute shards emitted beside the spine.**
   Nothing switches. It prints the bytes, and **I4 proceeds only if the core
   is under the budget in §3 on both datasets**; if it is not, I3's own "Done
   when" says to stop and report, and the cycle ends at I2 with the numbers
   in `STATUS.md`.
4. **I4 — the pages switch over; the whole spine stops being written.** One
   page per commit — the atlas, `entry.html`, `contribute.html`,
   `review.html`, `narratives.html` — because that is what made H3b a switch
   rather than a rewrite.
5. **I5 — the history index sharded.** After the spine work rather than
   before, so that all the index-shape changes are contiguous and
   `manifest.schema` counts up once per run without interleaving.
6. **I6 — the graph's stacks per bucket and inside the viewport; the
   timeline's cap from its pane.** The first run that touches the views. It
   is independent of I1–I5 and could run in parallel on a side branch; it is
   sequenced after them so that no run has to rebase a rebuilt index.
7. **I7 — `tools/migrate-ids.mjs`.** A tool, no index change, and the
   precondition M31 and M32b have been waiting on.
8. **I8 — `succeeded` from the CShapes split table; the Wikidata `names`
   fill.** Late because it is the only run that writes records, and records
   move the prerendered pages, the counts and the review queue.
9. **I9 — the Why mode's ground.** Last, and small: it is M35's precondition
   and nothing in this cycle depends on it.

Each run waits for the previous run's literal done line, per
`docs/run-protocol.md` §1. I1 waits for `M30b done`.

## 6. The risks

1. **The split may not pay** — H3a tried period shards and cancelled them
   because the whole payload was 288.6 KB. It is a different split (the spine
   itself, not a supplement) and the measurement says 5.2× at 10⁴, but the
   guard is the same: I3 measures before I4 spends, with a stated threshold.
2. **A picture drawn before its titles land.** A bar or a mark appears
   untitled for one frame at the whole extent. Mitigated by the never-wait
   discipline plus a forced redraw when a shard arrives, and pinned by a
   browser test that asserts the title is there after the shard lands. If it
   reads badly by eye it is on the owner's list to overrule (§7, question 6).
3. **Heap.** Fetching every century shard puts the whole corpus back in
   memory. Mitigated by an LRU over shards with a stated cap and a test that
   the cap holds.
4. **The unwindowed readers.** `eventsByActor`, `eventsByPlace`, the `actor:`
   and `place:` lenses and the actor card's list are all unwindowed and are
   the reason the *joins* (an event's actors' ids, its place id) are in the
   **core** and not in the attributes. If any later feature needs a
   *attribute* unwindowed, it either moves to the core with a measured cost or
   it fetches. This is written into `ARCHITECTURE.md` by I4.
5. **Byte-identity of the prerendered pages.** A reshape that changes a page's
   bytes has dropped something; asserted in every run (D7).
6. **The id table's order** decides every integer in the index. It is
   defined once (kinds in registry order, records in id order within a kind,
   references appended in first-seen order) and pinned by the determinism
   test that already exists in `tests/build-index.test.mjs`.
7. **A rename cascading through derived edge ids** (I7): renaming one event
   renames every edge touching it, every `?chain=` link and every narrative
   step that walks one. The tool has to carry the cascade and give each
   renamed edge its own alias, and the test is an old URL and an old
   narrative step still resolving.
8. **The licence boundary** (I8): a relation derived from CShapes is
   NC-derived material in a CC BY-SA directory. Owner question 4; the run
   does not write a record until it is answered the way the plan recommends.
9. **Two agents on `m0`.** The run protocol's rule is unchanged: a rejected
   push means stop, never rebase.

## 7. Owner questions

Each has a recommended answer, which the briefs implement unless the owner
overrules.

1. **The lane cap.** Derive the timeline's row cap from the pane's height, so
   the drawing always fits and `MAX_ROWS = 20` is a ceiling; or lower the
   14 px floor; or let the pane scroll by design and amend the request.
   **Recommended: derive it from the pane.**
2. **Does git-derived history belong in the deployed artifact at all?** It is
   1,027 files today and 62,446 at 10⁴. **Recommended: yes, sharded by kind
   and century (D8)** — the public dashboard is where a reader sees what
   changed, and dropping it makes M34 local-only.
3. **May the Wikidata import write `names` onto a record it did not create?**
   `names` is a claim about what a thing is called, not an identifier.
   **Recommended: yes, on `draft` records only, never on a `reviewed` one,
   only where the field is absent, never replacing a name, with
   `imported-names` added to `review.flags` so the reviewer sees it** — the
   same shape as the imported summaries the owner allowed on 5 September.
4. **What licence covers a relation derived from the CShapes split table?**
   `NC_ORIGINS` is keyed on `origin.tool` but `src/licensing.js` maps
   *directories*. **Recommended: the NC exception follows the origin, not the
   directory** — any record with `origin.tool: "cshapes"` is CC BY-NC-SA
   wherever it lives, the card and the entry page say so as they already do
   for actors and presences, and `data/LICENSE`'s table says it in prose.
5. **Are the history shards hashed and named in the manifest, or unhashed by
   kind and century?** **Recommended: hashed and named**, like every other
   index file, so `immutable` still means something; the dashboard reads the
   manifest once and it already does.
6. **May a bar or a mark be drawn before its title arrives?** **Recommended:
   yes** — it is one frame at the whole extent, it is the discipline the
   territories, citers and explanations already follow, and the alternative
   is a blank page until every century has landed.

## 8. What this cycle does not do

The presence outlines' shared borders at low zoom (§5.2.8, the owner's item 5,
"by eye"); `?why=` and the Why mode itself (M35); the base map (M36–M38);
`review.note` and the smaller items §5.3 parks; the 1,040 records with no
standing (a data backfill, on the owner's "Next" list); and the timeline's
scale, which M6 decided and the health plan left out on purpose.

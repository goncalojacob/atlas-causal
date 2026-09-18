# Health review B — Atlas causal, branch m0, 2026-09-05

Reviewer B of two. Emphasis: performance at scale (measured, not guessed),
the reader's exploration mechanics, the contributor's path, the review
dashboard at volume. Read-only; nothing in the tree was modified. Every
number below was taken in this sandbox (WSL2, Node 22.23.1, headless
Chrome for Testing 152 driven over CDP through the repository's own
`tests/browser.mjs`) on commit fa4b3cc plus the uncommitted `docs/drafts/`.

## How the measurements were made

- Baseline: `node --test` — 588 tests, 563 pass, 25 skipped without a
  browser on `$PATH`; with `CHROME` set, **588/588 pass**, 18.3 s wall.
  `node tools/validate.mjs --index` — 1716 records, 0 errors, 3 warnings,
  4.1 s wall, 197 MB RSS; 485 draft records; 1928/1928 citations unchecked.
- Synthetic datasets modelled on `tests/fixtures/data/` (scratchpad
  `gen.mjs`): **20k** = 20,000 events, 30,000 edges, 6,667 actors, 1,000
  places, 2,000 sources, 1,333 relations, 10 narratives (61,010 records,
  49 MB on disk, half of them carrying the draft marker) and **100k** =
  100,000 / 150,000 / 33,333 / 5,000 / 10,000 / 6,667 / 50 (305,050
  records, 244 MB). Both point the real tools at a scratch `--data` dir and
  copy the real `regions.json` / `geo/`. 70 % of events are placed, a fifth
  of places share a point (Lisbon-style stacks), edges are mostly near in
  time with 30 % long-range, as the real graph is.
- Tools: `tools/validate.mjs`, `tools/build-index.mjs`, `validate --index`
  timed with `/usr/bin/time -v`.
- Pure functions timed in Node over the built index (scratchpad
  `bench.mjs`): `graph.js`, `horizon.js`, `cluster.js`, `lanes.js`,
  `graph-view/layout.js`, `search.js`, `contribute/bundle.js`,
  `review/queue.js`, `validate/core.js`.
- The real pages driven in headless Chrome over the 20k index
  (`scale-browser.mjs`, `tools/serve.mjs --root` on a scratch root that
  symlinks the repository and the synthetic `data/`), and the newcomer's walk
  over the real data (`walk.mjs`, `walk3.mjs`, `back.mjs`, `state-check.mjs`).

The dataset today: 329 events (137 active, 175 retracted, 17 merged; 51 of
the active ones have `place: null`; 0 have a `body`), 161 edges (97
probable, 52 consensus, 12 disputed; max degree 16, 49 events of degree 1),
412 actors (329 of them CShapes imports, 163 distinct roles in use), 26
places, 34 sources (1,933 citations, 1,041 of them from the CShapes source),
43 relations, 1 narrative of 12 steps, 710 presences. The atlas loads
**3.10 MB** at first paint: topology 927 KB, one presence shard 880 KB,
sources index 337 KB, land 126 KB, four woff2 files 528 KB, CSS 84 KB, ~35
ES modules — none of it compressed by `serve.mjs` (Pages would gzip).

---

## Findings, most serious first

### 1. The topology is loaded whole and every view walks the whole active set on every state change; this stops working between 10k and 20k events

**Where.** `src/data.js` (`loadAtlas`, `createAtlas`), `src/main.js`, every
`render()` in `src/map/map.js`, `src/map/layers/events.js`,
`src/timeline.js`, `src/graph-view/graph-view.js`, `src/panel/panel.js` —
all four subscribe to the store and rebuild from `atlas.activeEvents` on
each `state.set`. `ARCHITECTURE.md` → "Scale, for the record" reasons
about 5,000 events; "Tens of thousands of records" is a reserved line that
says "render only the visible window; topology stays whole".

**Measured.** 20k index in the real page: **33 MB** transferred, ready in
2.5 s, 45 MB JS heap, then **704 ms per click on a bar**, **324 ms per
wheel notch on the map, 14.6 s for ten notches**, **2.1 s per wheel notch
on the timeline**, 2.1 s to switch the grouping to actors, 2.4 s to set a
horizon year. Because the store notifies synchronously and each subscriber
redraws whole, every interaction is the sum of four full renders. At 100k:
topology 105 MB (6.6 MB gzipped), `JSON.parse` + `createAtlas` 3.0 s in
Node and **235 MB of heap** before anything is drawn — over what mobile
Safari tolerates for one tab.

**Why it matters.** The owner's first consideration. The design as written
holds to roughly 5k active events; the plan's base map (M36–M38) adds
megabytes to the same first paint.

**Recommendation.** Split the index into the part the graph queries need
whole and the part the views need only for what is drawn: (a) a small
**adjacency file** — event ids, years, region, weight, and edges as
`[from, to, type, confidence]` — which is what `consequences`, `ancestors`,
`convergence` and `shortestPaths` read and stays under ~40 bytes per edge;
(b) **titles, actors, places, wikipedia titles sharded by period** (the
window's bounds are already in the state) and fetched on demand;
(c) render only events overlapping the window ± a margin (the timeline
already fades what is outside — stop drawing it) and cull by the map
viewport before clustering. Notify subscribers on the next animation frame
and let each view skip a render whose inputs did not change. Effort **L**;
**OWNER DECISION** — it amends the "topology whole" principle in
`ARCHITECTURE.md`, though not the convergence guarantee, which only needs the
adjacency.

### 2. `clusterPoints` is O(n²) and runs on every map frame, including every frame of the zoom animation

**Where.** `src/cluster.js:73–95` (the comment says so: "O(n²) and honest
about it"); called from `layers/events.js:485` on every `render`, which
`map.js:158–171` calls per animation frame in `zoomTo`, per wheel notch and
per pan settle; the same function clusters each timeline lane
(`timeline.js:313`).

**Measured.** Real data (86 placed points): 0.7 ms. 20k (14k placed
points): **94 ms at k=1, 471 ms at k=8, 591 ms at k=40**. 100k (70k
points): **0.94 s at k=1, 24 s at k=8, 65 s at k=40** — the greedy
neighbour scan gets slower as the threshold shrinks because `taken` thins
out more slowly. The timeline's per-lane clustering: 43 ms at 20k, 645 ms
at 100k.

**Recommendation.** Bucket the points into a grid of cell size `D/k`
(or sort by x for the 1-D timeline case) and scan only the 3×3
neighbourhood; the result is identical by construction (same seeds, same
threshold) so the existing tests hold. Cluster once per (window, lens,
zoom bucket) and reuse across frames; cluster only what is in view. **S**
(grid) / **M** (caching).

### 3. The graph view's layout is O(E²) × 7 sweeps; opening the Graph tab at a few thousand edges freezes the page for seconds, at 30k edges for six minutes

**Where.** `src/graph-view/layout.js:216–224` (`countCrossings` compares
every pair of segments) called once for the naive order and once per sweep
(`SWEEPS = 6`); `stackLayout` (`layout.js:309`) runs `clusterPoints` per
lane on every render (`graph-view.js:352`), i.e. per wheel notch.

**Measured** (`layoutGraph`, no bands): 161 edges 24 ms; 331 edges 0.6 s;
1,252 edges 1.6 s; 4,989 edges **8.7 s**; 30,000 edges **379 s** (with
10.3 M crossings left of 25.7 M). `stackLayout` on the 20k picture: **2.7 s
at k=1, 30.6 s at k=8** — per render. At 150k edges the layout is hours.
`createGraphView` is built lazily (good) but synchronously on the click.

**Recommendation.** Count crossings per adjacent layer pair with a sweep
(O(E log E)) or on a sample; stop sweeping when the count stops falling;
memoise `stackLayout` per zoom bucket; move `layoutGraph` to a Worker with
a placeholder frame; and lay out only the events in the window (the graph
view "draws every event" by design — that design does not survive 20k).
**M**.

### 4. Rule 11's inactive-record checks are quadratic in the number of tombstones, and 53 % of this dataset is already tombstones

**Where.** `src/validate/rules.js:495–501` — for every non-active event,
loop over every active edge; `:502–515` — for every non-active actor, loop
over the whole universe; `:516–522` the same for places.

**Measured** (`checkRules` alone, in memory): 20k events with no
retractions 0.6 s; 20k with 40 % retracted **28.9 s**; 50k with 40 %
retracted **241 s**; at 100k with the current retraction share the rules
pass alone is on the order of half an hour. The synthetic datasets on disk
had no retractions, which is why `validate` at 100k took only 167 s.

**Recommendation.** Build once: `Map<eventId, activeEdges[]>`,
`Map<actorId, referrers[]>`, `Map<placeId, events[]>`, then rule 11 is a
lookup per record. Twenty lines. **S**.

### 5. `validate --index` does the whole job twice, and the record reader is serial

**Where.** `tools/validate.mjs:122–150` reads all records, builds the
topology and runs `validate`; then `:262` calls `buildIndex`, which
(`tools/build-index.mjs:49–87`) reads every record again, builds the
topology again and runs `checkRules` again for the review index; `:259`
also re-rasterises every presence shard (`buildPalette`). `tools/lib/read.mjs:47–56`
awaits each file in sequence.

**Measured.** 20k: `validate` 28.6 s, `build-index` 26.3 s, `validate
--index` **93 s** (575 MB RSS). 100k: `validate` 167 s, `build-index` 146 s
(1.27 GB RSS). This is the job `deploy.yml` runs on every push to `main`
and `serve.mjs` runs on every Save.

**Recommendation.** Have `runValidation` hand its records, topology and
warnings to `buildIndex`; read files with bounded concurrency
(`Promise.all` over batches of ~64); compare the palette by hash of its
inputs instead of rebuilding. **S**.

### 6. The contribution form and the review editor cannot find a node among thousands: `<select>`s of every record, rebuilt on every keystroke, with an O(E×V) label pass

**Where.** `src/contribute/form.js:130–217` builds option lists from the
whole topology and `refreshOptions()` refills **every** select on every
`input` event (`:307`); `recordChoices` (`:176–184`) does
`topology.events.find` per edge; `src/review/editor.js:51–83` (`choicesFrom`)
has the same `titleOf` per edge. `findSimilar` (`bundle.js:762`) and
`validateBundle` (`bundle.js:806` → `validate` → `checkRules`, which
rebuilds the whole universe) run per keystroke too.

**Measured** in the page at 20k: one keystroke in the title **276 ms**
with the two default entries (1,022 options); after "Add edge" — **1.58 s**
to add it and **1.16 s per keystroke** thereafter, 41,036 `<option>`
elements in the DOM. In Node: `findSimilar` 5 ms today → 149 ms (20k) →
745 ms (100k); `validate` of a one-record bundle 5 ms → 166 ms → 1.09 s.
The review editor at 20k: 7 selects, 23,015 options, 224 ms per keystroke.

As UX: a select of twenty thousand titles sorted alphabetically, with no
date, no place and no degree, is not a way to find "the 1911 election" among
nine elections; the duplicate search covers **events only** (an actor,
place or source typed twice is not caught — "Lisboa" beside "Lisbon",
"PIDE" beside "DGS", the same ISBN twice), and a contributor sees nothing of
what the target already connects to.

**Recommendation.** A reference picker built on `search.js` (already
diacritic-folded and ranked) showing kind, dates, place and degree, with
the target's existing in/out links on choice; duplicate checks for every
kind (names, `wikidata`, ISBN/DOI, coordinates within a few km); debounce
and validate only the changed record against a universe built once. **M**.

### 7. The review dashboard at 10,000 drafts: 30k DOM rows repainted per keystroke, the whole draft list downloaded, and every Save rebuilds the whole index

**Where.** `src/review/main.js:384–416` (`paintQueue` rebuilds every row on
every search keystroke and every filter click); `data/index/review-*.json`
carries a digest of **every** draft (`build-index.mjs:80–87`) — 265 KB
today, 11.6 MB at 20k, 16 MB at 100k; `tools/serve.mjs:151–200`
(`saveBundle`) re-reads every record, re-validates and runs `buildIndex` +
`writeIndex` on each PUT.

**Measured.** 20k: review.html ready in **5.5 s**, 30,543 queue rows, **461
ms per keystroke** in the queue search, 603 ms for `j`; a Save at 20k costs
the 28 s read+validate plus the 26 s build → about a minute per signature,
several minutes at 100k.

Cataloguing gaps at that volume: the queue is ordered by kind then id
only — no priority by degree, weight, flag count or age; no way to claim a
record or see who else is reviewing; no history of what a signature changed
(backlog); no diff between the draft and the reviewer's edit; edges are
reviewed as two `<select>` values and a textarea, without the two endpoint
summaries beside them; `Sign` deletes the `review` block whole (see 16).

**Recommendation.** Windowed (virtual) list; queue index sharded by kind and
paged; sort keys (flags, degree, kind, age); a "review edge in context"
view with both endpoints' summaries; incremental index update on save
(patch the topology entry and rewrite the three files) or a background
rebuild queue; optional claim/lock in `review.claimedBy`. **M**.

### 8. Choosing an event from search narrows the window to end at that event's year, so the consequences a newcomer is about to follow are hidden

**Where.** `src/util/window.js:56–58` (`windowAt` always sets `to: year`),
used by `src/search-box.js:133–136` with the comment "widen to include it".

**Measured** on the real data: search "25 april" → choose → URL becomes
`?to=1974&selected=carnation-revolution-1974`, the band reads "1899 to
1974", **79 of 137 bars faded**, and 8 of the 9 consequences are drawn as
faded "outside the window" marks. `windowAt({from:null,to:null}, 1500)`
returns `{to:1500, from:null}` in Node — a window that already contained
the year is narrowed.

**Why it matters.** It is the first thing a curious reader does, and it
puts the atlas in a state where following consequences means walking into
the greyed-out region; nothing tells them the band did it.

**Recommendation.** `windowAt` returns the window unchanged when the year is
already inside it; only the panel's explicit "map at Y" should move `to`.
**S**.

### 9. The horizon leaks across selections: a year asked about event A lights the downstream of every event selected afterwards

**Where.** `src/state.js` (nothing clears `horizon`), `src/horizon.js:39–42`
(`horizonIsOpen` needs only `selected` and `horizon`), the `select`,
`follow`, timeline and map click paths all set `selected` without touching
`horizon`.

**Measured.** Set horizon 2000 on "Beginning of the war in Angola", click
"Coup of 28 May" on the timeline → URL `?selected=coup-28-may-1926&horizon=2000`,
card says "What did this lead to by 2000? 53", **12 marks lit** the reader
never asked about. Clicking the sea clears the selection but leaves
`?horizon=2000` in the URL (`out2.json`, "click sea clears selection but
not horizon").

**Recommendation.** Treat the horizon as belonging to the selection: clear
it in the store whenever `selected` changes to a different id (one line in
`createState.set` or in `pushes`' neighbour). **S**.

### 10. Clicking a consequence's mark on the map or its bar on the timeline resets the chain; the same click in the graph walks it

**Where.** `src/map/map.js:70` (`onSelect: (id) => state.set({ selected: id,
chain: [] })`), `src/timeline.js:222`, versus `src/graph-view/graph-view.js:337–343`
(`select` extends the chain when the click lands on a consequence).

**Measured.** From `?selected=carnation-revolution-1974`: map click on the
Alvor mark → `?selected=alvor-agreement-1975` (chain gone); timeline bar →
same; graph node → `…&chain=carnation-revolution-1974--alvor-agreement-1975--caused`.
The map draws a consequence line to the mark and then refuses to follow it.

**Recommendation.** Move the graph's `select` rule into one function
(`walkOrSelect(state, atlas, id)`) used by all three views and the panel.
**S**.

### 11. No mark on the map and no bar on the timeline can be reached from the keyboard

**Where.** `src/map/layers/events.js` and `src/timeline.js` create `<circle>`
and `<rect>` with `data-id` and a `<title>` but no `tabindex`, `role` or
key handler; the only focusable things in the two panes are the export
button, the pin and the three band handles (measured: five focusable
elements). `STATUS.md` calls the cluster list "the keyboard path in", but
a keyboard user cannot open a cluster either.

**Recommendation.** `tabindex="0"`, `role="button"`, `aria-label` and
Enter/Space on marks, bars and stacks (the panel's buttons already work);
roving tabindex within a lane so Tab does not visit 20k rects. **S/M**.

### 12. The panel re-renders on every state change, so a wheel notch closes the explanation being read and a bbox write wipes a cluster's member list

**Where.** `src/panel/panel.js:427` (`state.subscribe(render)`),
`:372–419` rebuilds `container.innerHTML` unconditionally; the map writes
`bbox` 180 ms after any pan, wheel or `zoomTo` (`map.js:119–131`), which is
a state change; `showCluster` (`panel.js:422`) writes the list into the same
container.

**Measured.** Open a "Why" in Consequences, one wheel notch on the
timeline → `details.open` is **false**, scroll position and the horizon
field's focus are lost. Click the Lisbon cluster on the world map → the
list of members appears, the zoom animation ends, `bbox` is written, and the
panel reads **"Pick an event", 0 members** (walk3 step 19). The horizon
`<input>` is also re-created under the reader's fingers by the `change`
handler's own `state.set`.

**Recommendation.** Render only when the card's identity or inputs change
(compare `selected/source/place/actor/narrative/step/chain/horizon` before
rebuilding); make an open cluster a state field (`?spread=` or `?cluster=`)
or exempt the cluster view from view-only changes. **M**.

### 13. A failed record or geometry fetch is cached for the rest of the session

**Where.** `src/data.js:88–93` (`record()` caches the rejected promise),
`:222–232` (`loadGeometry` keeps the rejected promise in `geometryLoading`);
`src/map/layers/presences.js:714–716` swallows the rejection with no
message.

**Measured.** Block `events/carnation-revolution-1974.json`, select it,
unblock, select again → still "Could not load the record text."
(`out2.json`); in Node the second `record()` and `loadGeometry()` make no
new request. A flaky connection on the train leaves a territory shard
blank until reload, silently.

**Recommendation.** Delete the cache entry in a `.catch` (three lines
each) and let the presences layer show "territories could not be loaded"
once. **S**.

### 14. After the browser's Back, the address bar no longer describes the screen

**Where.** `src/state.js:285–300` — the popstate handler inherits `from`,
`to`, `horizon`, `bbox`, `group`, `lanes`, `focus` and `layers` from the
live state when the popped URL does not name them, and never calls
`write()`.

**Measured.** Open 25 April, open the Armed Forces Movement (push), narrow
the band to 1951–1959 (replace on the second entry), Back → URL
`?selected=carnation-revolution-1974`, band still **1951 to 1959**, horizon
field **1959**. Copying the link gives the recipient the whole century and
no horizon.

**Recommendation.** After `restore(...)`, call `write(false)` so the entry is
normalised to what is shown — or store the view fields in `history.state`
on every replace and read them back. **S**.

### 15. `?bbox` removes every placeless event from the timeline, and any pan writes a bbox

**Where.** `src/util/viewport.js:11–13, 47–52` (an event without a point
is not in view); `src/map/map.js:119–131` publishes a box after every pan,
wheel, double-click and cluster zoom.

**Measured.** With the whole world as the box: "**86 of 137 events in
view**" — the 51 active events with `place: null` (long processes,
timeline-only by design) vanish from the lanes the moment the map is
touched, and the whole-world box is written as `?bbox=-180,-90,180,90`
(`out2.json`). The plan makes `place` optional everywhere and adds
region-wide "large events", which makes this worse.

**Recommendation.** A placeless event is in view when its region's polygon
intersects the box (the polygons are already loaded for `deriveRegion`'s
sake at index time — ship a bbox per region in the manifest), and never
write a box that equals the world. **S**.

### 16. Signing or retracting deletes `review` whole, including the note that says why a record was retracted

**Where.** `src/review/sign.js:627` and `:633` (`delete signed.review`,
`delete out.review`); M21/M22 wrote the reason for 175 retractions into
`review.note` (STATUS.md: "Every retraction carries its reason on the
record in `review.note`"), and retracted drafts are still in the queue
(`isDraft` ignores status).

**Why it matters.** The record's own history is the owner's fourth
consideration; a reviewer who signs a tombstone erases the only reason in
the data for its being one, and a later reinstatement (plan decision 3)
has nothing to argue against.

**Recommendation.** Keep `note` (rename the block's semantics: `flags` and
`citations` are the reviewer's to clear, `note` is history) or move
retraction reasons to a dedicated `retraction: { on, reason }` field that
nothing deletes. **S**; **OWNER DECISION** (schema).

### 17. The search cannot find the atlas's most famous event by its common name, and finds nothing for a question

**Where.** `src/search.js:38–51` indexes an event's `title` and its
Wikipedia titles only; events have no `names`/aliases field (actors and
places do); `carnation-revolution-1974` has no `wikidata`
(docs/m20-ambiguous-resolved.md) so no article title reaches the index.

**Measured.** "carnation" → no matches; "revolution" → 4 matches, none of
them 25 April; "25 april" → found. "why is angola poor", "poor", "colonial
war" → nothing (walk.log).

**Recommendation.** Give events a `names` list like actors (schema +
rule 18's shape check), index it, and let the import fill it from
Wikidata labels/aliases; index the first sentence of the summary as a low-
rank term (the summaries are already in the record files — this needs a
small `search-<hash>.json`, which `ARCHITECTURE.md` reserves "when the scan
is slow"; a names field does not). **S/M**; **OWNER DECISION** (schema).

### 18. "Why is Angola poor" has no entry point, and an on-demand narrative writer would have to fetch one file per edge to read a path

**Where.** `?actor=angola` opens the CShapes state actor (1975–) with
**0 appearances** and a "Loading…" summary; the events name
`angola-under-portugal`; convergence is shown only after a chain is walked
(`panel/event.js:658`); the explanations live in `data/edges/<id>.json`
and are fetched one `<details>` at a time (`panel.js:184–194`); a
6-step horizon walk fetched **one** edge record (the last), and reading the
path means opening six "Why"s (walk3 step 21); `shortestPaths` ranks by
hops then year, never by confidence.

**What a narrative writer (M35, and the backlog's small model) needs from
the data and the queries that is missing today:**
- a `subgraph(atlas, ids, depth)` in `graph.js` returning events, edges,
  actors and relations around a target, and a bundled fetch for their
  explanations (an `explanations-<hash>.json` shard per period, or the
  explanation in the edge's topology entry — median 319 chars × 161 edges
  is 50 KB today, 48 MB at 150k edges, so sharded);
- confidence- and type-weighted path ranking (a `consensus caused` path
  should beat a `disputed inspired` one of the same length);
- endpoints that are conditions (plan 11a) so a question has a target;
- narrative steps that may cite an actor, a relation or a presence (the
  schema allows event and edge refs only, `rules.js:102–107`);
- a `generated` marker in the envelope (CONTEXT.md requires generated text
  to be marked; `authors[].name` is free text and nothing reads it);
- a way to keep the subgraph a narrative was built from
  (`narrative.subgraph: [ids]`), so a claim can be checked against records
  mechanically.

**Recommendation.** Build the query and the fetch shape before the mode:
`subgraph()` + explanations shard + `generated`/`subgraph` fields on
narrative, then M35's prose view reads the path from one request. **M/L**;
**OWNER DECISION** (schema, and whether generated walks ever enter
`data/narratives/`).

### 19. Adding a record kind touches ~26 files; edge and relation types are spelled out in regexes and label tables in nine and eleven places

**Where.** Kind lists: `schema/common/provenance.json`, `src/validate/core.js`
(`KINDS`), `src/validate/rules.js` (`ALLOWED_LICENSES`, `IDENTITY_KINDS`,
`BODY_KINDS`, rule 6's kind list, rule 15's), `src/validate/schemas.js`,
`schema/v1/bundle.json`, `src/data.js` (`kinds`), `src/contribute/bundle.js`
(`FIELDS`, `CITATION_LISTS`, `ACTOR_LISTS`, `STEP_LISTS`, `buildRecord`,
`valuesFromRecord`), `src/contribute/form.js` (`KIND_LABEL`, `KIND_HINT`,
`TITLE_KEY`), `src/review/queue.js` (`KIND_ORDER`), `src/entry/entry.js`
(`ENTRY_KINDS`, `ATLAS_PARAM`), `src/markdown.js` (`RECORD_LINK_KINDS`),
`src/citation.js` (`CITER_ORDER`), `src/lens.js`/`src/state.js` (`FOCUS`
regex, duplicated), `tools/lib/read.mjs` (`KIND_DIRS`), `tools/new-record.mjs`,
`tools/bundle-to-files.mjs`, `tools/serve.mjs`, `tools/import/wikidata.mjs`,
`data/LICENSE`, plus tests. Edge types: `rules.js` (`EDGE_TYPES`, `EDGE_ID`),
`state.js` (`EDGE_ID` duplicated), `graph.js` (`TYPE_ORDER`),
`graph-view.js` (`edgeKey` hard-codes the five), `panel/event.js`
(`TYPE_LABEL`), `schema/v1/edge.json`, `narrative.json`, `about.html`, the
PR template. Relation types: `rules.js` (`RELATION_TYPES`, `RELATION_ID`,
`RELATION_ENDPOINTS`, `ACYCLIC_RELATION_TYPES`), `state.js` (`RELATION_ID`
duplicated), `panel/actor.js` (`RELATION_LABEL`, `RELATION_ORDER`),
`schema/v1/relation.json`. `GROUPS` is duplicated in `state.js` and
`lanes.js`. The plan's review (finding 3) counted ~15; the count above is
what the grep finds.

**Why it matters.** The owner's third consideration; M30a adds two kinds
and the plan retires one relation type and adds a grouping. `state.js`
"stays free of the data" by copying the vocabularies, and the copies drift.

**Recommendation.** One `src/kinds.js` registry — kind → directory, schema
file, licences, label, hint, fields, card module, entry page?, identity? —
and one `src/vocab.js` for edge/relation types with labels, order and
endpoint rules, from which the two id regexes are built; `state.js` may
import a pure list without importing the data. Schema-side, `provenance.json`'s
`kind` enum could be dropped in favour of the per-kind `const`. **M**.

### 20. The sources index and the review index grow with the number of citations and drafts, and both are loaded whole

**Where.** `src/validate/core.js:123–147, 317–321` (every citation of every
record is written into every source's `citations`); `src/data.js:322–325`
loads the sources index at first paint of the atlas only to answer
`citationCount`; `build-index.mjs:80–87` writes a digest of every draft.

**Measured.** Sources index 337 KB today (1,933 citations), **11.2 MB at
20k, 56 MB at 100k**; review index 265 KB → 11.6 MB → 16 MB.

**Recommendation.** Put `citationCount` per record into the topology (it is
a number) and shard the citers per source (`index/citers/<source-id>.json`,
fetched by the source card and `sources.html` on demand); page the review
digests by kind. **M**.

### 21. Tombstones travel to every reader

**Where.** `buildTopology` (`core.js:209–229`) writes title, `when`,
`actors`, `place`, `region`, `wikipedia` for events of every status; 175
of 329 events are retracted and draw nothing; `buildAdjacency` filters them
again at load.

**Recommendation.** For a non-active record keep `id`, `status`,
`supersededBy`, `aliases` and nothing else in the topology (the card
fetches the file when a tombstone's URL is opened). At the current
retraction share this halves the events section. **S**.

### 22. The horizon set is recomputed by four subscribers on every state change, and the reachable set is put in every view's `alone`

**Where.** `horizonSet` is called in `map.js:296`, `timeline.js:383`,
`graph-view.js:281` and the panel's `horizonHtml` → four `shortestPaths`
runs per change; `graph-view.js:284–297` adds every reachable id to
`alone`, so with a horizon open nothing stacks.

**Measured.** `reachableBy` on the heaviest node: 0.4 ms today, 46 ms at
20k, **465 ms – 1.3 s at 100k** (56,557 reachable events); `horizonSet`
511 ms per view at 100k, × 4.

**Recommendation.** Memoise in `horizon.js` keyed on `(selected, horizon)`;
cap what is held out of stacks to the shown path plus the first `SHOWN`
results. **S**.

### 23. The timeline rebuilds its whole SVG on every change and packs every event

**Where.** `src/timeline.js:346–457` (`replaceChildren`, `measure()` reading
`clientWidth`, `rowLanes` over every shown event, per-lane clustering).

**Measured.** `packRows` 0.9 ms today, 51 ms at 20k, 349 ms at 100k;
per-lane clustering 0.8 → 43 → 645 ms; in the page, one wheel notch on the
timeline at 20k costs 2.1 s (all four subscribers).

**Recommendation.** Sort once, cluster in 1-D by a sorted sweep, keep the
`<rect>`s and update attributes, and render only the window ± margin. **M**.

### 24. Territories: 710 presences scanned per render, 181 paths re-projected on every signature change, and the first paint downloads an 880 KB shard before anyone asked for it

**Where.** `src/data.js:237–247` (`presencesAt` is a linear scan),
`src/map/layers/presences.js:729–745` (`geometryPath` per presence per
signature change — every year the far end moves across, every actor
selection), `loadAtlas` + the default window ending at 2025 → the
1975–2019 shard on first paint.

**Recommendation.** Interval-index presences by year; cache the projected
path string per (shard, key); simplify the shards at two or three tolerances
and pick by zoom (`tools/import/simplify.mjs` exists); defer the shard fetch
until the layer is on screen. **S/M**.

### 25. The URL state cannot express several things the reader can be looking at, and the chain grows without bound

**Where.** `src/state.js`. Not expressible: an open cluster/spread (the
map's `spread`, `map.js:92`), the graph's pan/zoom, a selected edge on its
own (only as the last step of a chain), a relation or a presence, a horizon
walk's answer list, two narratives side by side, a lens on more than one
actor, a "why" question (planned as `?why=`). `chain` carries full edge ids:
241 characters for three steps (walk.log), ~900 for a 12-step narrative
walk; `discussUrl` embeds it again in the issue URL.

**Recommendation.** `?edge=` for a link on its own; `?spread=` for an open
cluster; encode the chain as the event ids only (`a,b,c` — the edge
between two consecutive events is unique once the type is dropped, and the
type can be recovered from the adjacency; where two types exist between the
same pair, keep the suffix). **S/M**; **OWNER DECISION** (URL compatibility
— aliases could map old chains).

### 26. The contributor's path: correction without a form, a 6 KB prefill that no real bundle fits, and a GitHub account for everything

**Where.** `contribute.html?correction=1` only switches the issue template
(`src/contribute/main.js:552`); nothing loads an existing record into the
form (the review editor can, but `review.html` is unlinked and a maintainer's
page); `src/contribute/submit.js:444` caps the prefilled URL at 6 KB — a
summary is ~670 characters and an explanation ~320 in this dataset, so one
event plus one edge plus one source already exceeds it and the reader is
told to paste; "Discuss this record" and both templates need a GitHub login;
`CONTRIBUTING.md` says contributions are closed.

**Recommendation.** "Edit this record" on every card → the form prefilled
from the record file (the `valuesFromRecord` half already exists);
`correction.yml` accepts a diff of the fields changed rather than the whole
record (or the form produces it); the relay `submit.js` reserves as its only
target, so a bundle can be posted without a URL and without an account
(moderated the same way, by the `accepted` label). **M**; **OWNER
DECISION** (anonymous contributions).

### 27. The rules the browser's form runs rebuild the whole universe per keystroke, and rule 5's DAG check is global

**Where.** `src/validate/rules.js:175–203` builds `universe` from the whole
topology on every `checkRules`; rule 5 (`:367–396`) walks every active
edge; the form calls it per keystroke (`form.js:576`), the editor too
(`editor.js:387`).

**Measured.** 5 ms today, 166 ms at 20k, 1.09 s at 100k — per keystroke.

**Recommendation.** Build the universe once per topology and pass it in;
check rule 5 incrementally (does adding these edges close a cycle:
DFS from each new edge's `to` looking for its `from`). **S/M**.

### 28. Identity split between colony and state makes the natural entry point empty

**Where.** `data/actors/angola.json` (CShapes state, 1975–) vs
`angola-under-portugal`; the search lists both as "Angola"; the M27 splits
created 77 such pairs. `?actor=angola` shows 0 appearances and 1 presence
period.

**Recommendation.** On an actor card, show the events of its predecessors
and successors along `succeeded` relations ("before 1975, see Angola under
Portugal — 9 events"), and in the search show the years beside each actor
so the two are distinguishable. **S**.

### 29. Records are served from mutable URLs with no cache control, so a corrected record can read stale for hours

**Where.** `src/data.js:91` fetches `data/<kind>s/<id>.json` with the
browser's default heuristics; only the index files are hashed and the
manifest `no-store`; `deploy.yml` uploads the whole checkout (docs/screens,
tests/fixtures, tools, `docs/*.md` — 244 MB of records at 100k) to Pages.

**Recommendation.** Carry `revised` (or a short content hash) per record in
the topology and fetch `…/<id>.json?v=<hash>`; upload only `index.html`,
the five pages, `src/`, `data/` and `schema/`. **S**.

### 30. The graph's shortest path is by hops and the convergence list is unranked beyond type and confidence; at scale both become unreadable

**Where.** `src/graph.js:100–128` (`shortestPaths` breaks ties by the
predecessor's year), `:191–210` (`convergence` returns every ancestor off
the path — 44 rows for a 3-step walk today, thousands at 20k where the
heaviest node has 10,437 descendants).

**Recommendation.** Rank paths by a cost that reads confidence and type
(consensus < probable < disputed; caused < enabled < precondition-of …);
group convergence by depth with counts and show the first tier expanded.
**S/M**; **OWNER DECISION** (what "stronger branch" means editorially).

### 31. Generated versus authored is a licence string and an author name, not a boundary in the tree

**Where.** `data/presences/` (710) and 329 of `data/actors/` are written by
`tools/import/cshapes.mjs` and rewritten on every run; they sit beside
hand-written records and are told apart by `authors[].name ∈ IMPORT_AUTHORS`
and `license`; `data/index/`, `data/geo/palette.json`, `data/geo/regions.json`
are generated and committed; `docs/m21-retractions.md` duplicates
`review.note`.

**Why it matters.** The owner's sixth consideration: if the spine is
restructured, the question "which files are the source of truth" has to be
answered by grepping author names.

**Recommendation.** An `origin` field in the envelope (`authored | imported |
generated`) with the tool and its input hash for the last two, and — if the
owner agrees — a `data/imported/` tree so `git diff` after a re-run touches
one directory. **S**; **OWNER DECISION**.

### 32. `serve.mjs` rebuilds the index inside the request, holding the reviewer's tab for the duration

**Where.** `tools/serve.mjs:151–200` — read all records, validate, build,
write, then answer; one PUT at a time is not enforced, so two saves
interleave their `writeIndex`.

**Measured.** 4 s today (the whole `validate --index` cost), ~60 s at 20k.

**Recommendation.** Answer after the record files are written, rebuild the
index in a debounced background task, serialise saves through a queue,
and expose `/__status` for the page to show "index rebuilding". **S**.

### 33. Roles, the free vocabulary, are already 163 strings; the closed list is data, but rule 25 is planned as a warning that becomes an error in M32b

**Where.** `manifest.roles` (163 entries), `docs/roles-mapping.md` awaiting
the owner. Not a bug; a transfer risk: a role is the only thing on an actor
line, and the topology carries the raw string.

**Recommendation.** Ship `data/roles.json` with `label` and `description`
per role so the card can explain a chip, and make the mapping run
idempotent (it will be re-run). **S**; **OWNER DECISION** (the table).

### 34. The chain in a shared link is not checked for status

**Where.** `src/panel/event.js:599` and `src/map/map.js:279` use
`atlas.edges.get(id)` (any status); `chainEdges` and "The link you
followed" load and draw a retracted edge without a notice. No retracted
edge exists yet (all 161 are active), so this is latent; `resolve()`
already handles retracted events with a notice.

**Recommendation.** Filter the chain to active edges at parse time
(`main.js`, after the atlas loads) and say "a step of this link has been
retracted". **S**.

### 35. STATUS.md is 3,278 lines and is the first thing every session must read

**Where.** `STATUS.md`; `CLAUDE.md` says "Read STATUS.md first in every new
session". The position is under 25 milestone narratives; the "Phase"
section still says "M0 to M23 built".

**Recommendation.** A 100-line STATUS (position, counts, open questions,
next) and `docs/history/m<N>.md` for the rest. **S**.

---

## Sound as it is

Checked and would not change:

- `src/state.js` parse/format round-trips: BCE years, `?year=` legacy,
  reversed windows, garbage chains cut at the first bad step, relation ids
  refused in the chain, `bbox` clamped and inverted boxes rejected,
  passthrough of `fixtures`, `pushes()` on openings only. Twenty cases run in
  Node (`state-check.mjs`) all came back as documented.
- `src/util/dates.js`: one astronomical conversion, no year 0, `decadeOf`
  floors, `formatBound` for BCE ranges; the timeline, the window, the search
  and the narrative widen all go through it.
- The load token in `src/panel/panel.js`: delaying event A's record by 900 ms
  and clicking B 50 ms later left B's card intact (walk3 step 13). The
  presences layer's shard token does the same.
- Escaping: `esc()` on every interpolation I traced in the panel, the cards,
  the search list, the entry page, the graph's titles; `safeUrl` on every
  href; `src/markdown.js` refuses raw HTML, images, non-http schemes and
  unslugged ids and shows them as typed; `serve.mjs` binds loopback, checks
  Host and Origin, validates ids before building a path;
  `bundle-to-files.mjs` checks ids before paths and refuses `__proto__`;
  workflows pass untrusted text through `env:`.
- `buildAdjacency` filters non-active edges and endpoints defensively;
  `convergence` excludes only the walked path (the CONTEXT.md decision) and is
  0.1–0.3 ms at every size measured.
- `consequences`/`antecedents` are O(degree); `ancestors`/`descendants` BFS
  are ~100 ms at 100k on the heaviest node — fine on a click.
- `search.js`: 2 ms to build today, 125 ms at 100k; 0.2 → 25 ms per
  keystroke — the scan scales; the reserved search index is not needed for
  size, only for coverage (finding 17).
- The index build is deterministic (`canonical`, code-unit sorts) and
  `--index` byte-compares it; `weight` is derived, `region` is derived with
  its method recorded, `sitelinks` reaches nothing.
- The narrative mode: entering remembers the window, stepping slides it,
  clicking a mark leaves the mode and keeps the click; Back over steps works
  (out2, walk2).
- The history trail and the panel's named Back/Forward (walk.log step 8:
  two Backs returned to the two previous cards with their chains).
- `tools/serve.mjs`'s write path and the dashboard's two save modes
  (endpoint or correction bundle) — the fallback is discovered by trying
  and nothing is dropped.
- `tests/browser.mjs`: a CDP client on Node's own WebSocket, no npm; all 588
  tests pass with a browser present.
- The licence separation for CShapes (`IMPORT_AUTHORS`, rule 12) and the
  `identity.mjs` additive rule for imports.

---

## Performance at scale

Costs measured on this machine; "today" is the real dataset (137 active
events, 161 edges, 412 actors, 710 presences); 20k and 100k are the
synthetic sets described above. Browser figures are from the real pages in
headless Chrome over the 20k index; 100k browser figures are extrapolated
from the Node numbers and marked ~.

| Component | Today (1,716 records) | 20k events / 30k edges | 100k events / 150k edges | What would have to change |
|---|---|---|---|---|
| Index on disk (`data/index/`) | topology 927 KB, sources 337 KB, review 265 KB | 20.8 MB / 11.2 MB / 11.6 MB (gz 1.3 / 0.55 / 0.61 MB) | 105 MB / 56 MB / 16 MB (gz 6.6 / 3.0 / 0.83 MB) | Adjacency file separate from drawn attributes; attributes sharded by period; citers per source on demand; tombstones stripped; review digests paged (findings 1, 20, 21) |
| Bytes at first paint | 3.10 MB uncompressed (topology + shard + sources + fonts) | 33 MB uncompressed (~2.5 MB gz) | ~150 MB (~8 MB gz) | Load adjacency + the window's shard; defer sources and territories (1, 20, 24) |
| `JSON.parse` + `createAtlas` | 23 + 13 ms, +1 MB heap | 353 + 279 ms, +45 MB | 1.45 + 1.55 s, +235 MB | Shard; keep only ids/years/status in memory for the whole graph (1) |
| Page ready (navigate → first card) | ~0.5 s | 2.5 s | ~10 s, likely OOM on phones | (1) |
| `validate.mjs` | 4.1 s (with `--index`) | 28.6 s; **29 s more per 8k tombstones** (rule 11) | 167 s with no tombstones; ~30–40 min at today's 53 % retraction share | Index active edges/referrers once (4); concurrent reads (5) |
| `build-index.mjs` | ~2 s | 26.3 s, 373 MB RSS | 146 s, 1.27 GB RSS | Reuse the validator's pass; stream the write (5) |
| `validate --index` (deploy, every Save in `serve.mjs`) | 4.1 s | 93 s, 575 MB | ~6 min | Do the work once; incremental index on save (5, 32) |
| `consequences` / `convergence` | 0.0 / 0.1 ms | 0.0 / 0.1 ms | 0.0 / 0.3 ms | Nothing |
| `shortestPaths` / `reachableBy` (horizon) | 1.1 / 0.4 ms | 18 / 46 ms | 139 / 465–1,338 ms (56k reachable) | Memoise per (selected, horizon); rank and page the answer (22, 30) |
| `horizonSet` per view per change (× 4 views) | 0.4 ms | 48 ms | 511 ms | Compute once (22) |
| Map `clusterPoints` k=1 / k=8 / k=40 | 0.7 / 0.3 / 0.3 ms (86 pts) | 94 / 471 / 591 ms (14k pts) | 0.94 / 24 / 65 s (70k pts) | Grid index O(n); cluster only in-view points; cache per zoom bucket (2) |
| Map wheel notch in the page | ~10 ms | 324 ms (10 notches 14.6 s) | ~2–25 s | (1, 2, 22) |
| Click a bar in the page (four renders) | ~15 ms | 704 ms | ~5 s | Skip unchanged renders; render the window only (1, 12, 23) |
| Timeline `packRows` + per-lane clustering | 0.9 + 0.8 ms | 51 + 43 ms | 349 + 645 ms | Sorted 1-D sweep; window-only; keep DOM (23) |
| Timeline wheel notch in the page | ~15 ms | 2.1 s | ~15 s | (23, 1) |
| `lanesFor('actor')` / `availableLanes` per render | 0.6 / 0.9 ms | 36 / 14 ms | 359 / 165 ms | Precompute `eventsByActor` counts per window bucket (1) |
| Graph `layoutGraph` (once per arrangement) | 24 ms | **379 s** (8.7 s at 5k edges) | hours | Sweep-based crossing count, early stop, Worker, window-only (3) |
| Graph `stackLayout` per render k=1 / k=8 | 3.8 / 2.8 ms | 2.7 / 30.6 s | ~minutes | Grid clustering; memoise per zoom bucket (2, 3) |
| Search build / per keystroke | 2.1 / 0.2 ms | 29 / 5.7 ms | 125 / 25 ms | Nothing for speed; names on events for coverage (17) |
| Form `findSimilar` per keystroke | 4.9 ms | 149 ms | 745 ms | Debounce; prefix index on folded words (6) |
| Form `validate` one record per keystroke | 5.1 ms | 166 ms | 1.09 s | Universe built once; incremental rule 5 (27) |
| Form: rebuild every `<select>` per keystroke | ~5 ms | 276 ms; 1.16 s with an edge entry (41k options) | ~6 s | Reference picker; no full option lists (6) |
| Review page ready / rows / keystroke | ~0.5 s / 485 / ~5 ms | 5.5 s / 30,543 / 461 ms | ~15 s / ~30k+ / ~2 s | Virtual list; paged digests (7) |
| Review editor per keystroke (23k options at 20k) | ~5 ms | 224 ms | ~1.5 s | Picker; incremental validation (6, 27) |
| Save through `serve.mjs` | 4 s | ~60 s | ~6 min | Incremental index; background rebuild (32) |
| Sources index growth | 1,933 citations | 66,938 | 335,003 | Counts in topology; citers on demand (20) |
| `presencesAt` + path rebuild per signature change | 181 paths, ~20 ms | same (presences did not scale in the synthetic set) | world-scope: thousands of polygons per period | Interval index; cached paths; zoom-level simplification (24) |

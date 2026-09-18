# Health review A — Atlas causal, branch `m0`, 5 September 2026

Reviewer A of two. Emphasis: structure and extensibility, actual defects, data portability, the review and contribution pipeline. Read-only: nothing under the repository was modified (a `build-index` run confirmed the committed index is byte-identical; `git status` is clean).

What was run:

- `node --test`: 588 tests, 563 pass, 25 skipped (no browser on the machine). With a headless Chromium fetched into the scratchpad and `CHROME` set: **588/588 pass**, 0 skipped, 19 s.
- `node tools/validate.mjs --index`: 1716 records, 5 regions, 0 errors, 3 warnings; 485 records still carry the draft marker; 1928 of 1928 citations unchecked. 6.5 s with `--index` (the palette rebuild dominates), 1.4 s without; `build-index` 0.9 s.
- The site driven over CDP (`tests/browser.mjs` helpers, 1440×900): index.html (map, timeline, graph, panel, search, narrative mode, horizon, retracted/merged/missing ids, legacy `?year=`), entry.html, narratives.html, sources.html, about.html, review.html, contribute.html, both with `?fixtures=1`. **No page threw, no console error or warning on any page.** The measured defects below (findings 3–6) come from that session.
- Micro-benchmarks of the pure cores on a synthetic year-ordered DAG at 2 000 / 4 000, 5 000 / 10 000, 10 000 / 20 000 and 20 000 / 40 000 events / edges (figures in the findings and the table).

Data as it stands: 329 events (137 active, 175 retracted, 17 merged), 161 edges, 412 actors (357 from CShapes), 26 places, 43 relations, 1 narrative, 34 sources, 710 presences; 163 roles in use; no `body` written; no `review.citations` on any record. Topology index 927 KB (72 KB gzipped), sources index 337 KB (34 sources, 1 928 citations), review index 265 KB, largest presence shard 1.1 MB (322 KB gzipped), land 126 KB.

---

## Findings, most serious first

### 1. The whole topology is loaded by every page, and it is the scaling ceiling

**Where.** `src/data.js:320-333` (`loadAtlas`: manifest → topology whole → sources index whole → land → palette), `src/data.js:305-314` (narratives.html loads the whole topology to date one narrative), `src/entry/main.js:31` (entry.html loads the whole atlas for one record), `src/contribute/main.js:17`, `src/review/main.js:56-62`, `tools/build-index.mjs:61-70` (one `topology-<hash>.json` with events, edges, actors, presences, places, relations, narratives), `src/validate/core.js:318-321` (the sources index carries every citation of every record).

**Why it matters.** Today 927 KB / 72 KB gz is fine. The per-record cost in the index is ~420 B per event, ~240 B per edge, ~450 B per presence, ~100 B per citation. At 100 000 events, 300 000 edges and 200 000 citations the topology is ~110 MB raw (roughly 10 MB gzipped, 1–2 s to parse, several hundred MB of `Map`s in memory) and the sources index ~20 MB — on every page, including the bibliography-adjacent ones. ARCHITECTURE.md ("Scale, for the record") sizes for 5 000 events and says "topology stays whole"; the reasoning ("convergence needs the whole graph") holds for the *edge list*, not for titles, actor lists, presence intervals, narrative summaries or 1 928 citation rows. The Pages artifact also uploads the whole checkout (`deploy.yml`, `path: .`), so 100 000 record files go into every deploy.

**Recommendation.** Split the index by what each page needs and by density: a compact *spine* (event id, start/end astronomical year, place ref, region, weight, status; edges as `[from, to, type, confidence]` arrays or a CSR adjacency) that `graph.js` can walk whole; titles, actors-per-event and identity in a second file loaded after first paint; presences and relations as their own files (presences are already period-sharded for geometry — shard the records the same way); citations out of the sources index into per-source files fetched on demand (`citationCount` stays). Keep the hashed-immutable naming. Measure the byte budget per file in the build (`build-index` prints sizes). **L, OWNER DECISION** (it changes the index contract that five pages read).

### 2. `layoutGraph` is O(E²) per sweep — 3.1 s at 4 000 edges

**Where.** `src/graph-view/layout.js:216-224` (`countCrossings` compares every pair of segments), called once for the naive order and once per sweep (`SWEEPS = 6`, line 57) → seven O(E²) passes. `src/graph-view/graph-view.js:172-191` re-runs it whenever the arrangement key changes, and the key includes the lane ids (line 146), so with `group=actor` a drag of the window that changes the top six lanes re-lays the whole graph mid-drag.

**Why it matters.** Measured: 2 000 events / 4 000 edges → 3.2 s; **10 000 / 20 000 → 114 s** on this machine (the ratio is the expected 36×); the graph view is unreachable long before "tens of thousands". The M25 level-of-detail work made *drawing* cheap (`stackLayout` at 10 000 events: 0.6 s, itself a per-render cost worth caching); it did not touch this.

**Recommendation.** Drop the exact crossing count: either trust the barycentre sweeps (standard Sugiyama practice), or count crossings only between adjacent year-layers with an inversion count (O(E log E) per pair). Lay out only the events the view will draw (the lens/window subset) and keep the whole-graph arrangement cached per (events, lanes) key with a size cap. **M.**

### 3. A timeline drag writes the URL and rebuilds the panel on every pointer move

**Where.** `src/timeline.js:170-184` (`pointermove` → `setWindow` → `state.set`) and `:162-169` (wheel); `src/state.js:272-279` (`write` → `history.replaceState` on every `set`); `src/panel/panel.js:427` (`state.subscribe(render)`, `render` sets `container.innerHTML` unconditionally, lines 372-419); `src/map/map.js:324-327` and `src/graph-view/graph-view.js:617` do the same.

**Measured.** One 40-step drag of the `to` handle: **40 `history.replaceState` calls and 40 full `#panel` innerHTML rebuilds**; an open `<details>` ("Why") on the card was closed by the first move; the wheel over the timeline: 25 notches → 25 `replaceState` calls. Every rebuild also recomputes `convergence`, `antecedents`, `horizonResults` (a BFS with `pathTo` per reachable node, `src/graph.js:158-179`) and re-fetches nothing but re-parses everything.

**Why it matters.** (a) WebKit throws `SecurityError: Attempt to use history.replaceState() more than 100 times per 30 seconds`; `write()` has no guard, and it runs *before* `notify()`, so on Safari a two-second drag leaves the store updated and the views not told. (b) Reading is interrupted: the card the reader had open loses its expanded sections, the horizon input loses focus and the scroll position resets while they nudge the band. (c) At 10 000 events this is ten thousand `<rect>`s replaced per pointer move (`timeline.js:348`, `replaceChildren`). The map already solves the URL half with `BBOX_SETTLE` (`map.js:35`), so the pattern exists in the codebase.

**Recommendation.** In `state.js`, debounce URL writes for replace-type changes (one write per animation frame or on pointer-up), guarded by try/catch; in the panel, subscribe to *openings* only (`OPENINGS` already exists, line 241) and update the few window-dependent bits (the horizon year, the "map at" hints, the faded rows) in place; in the timeline and map, diff instead of `replaceChildren` (toggle classes on existing nodes while dragging). **S–M.**

### 4. The map's pointer maths and the published `bbox` assume the SVG fills its box; it is letterboxed

**Where.** `src/map/map.js:56` (`viewBox="0 0 960 540"`, no `preserveAspectRatio`), `:173-176` (`toSvg` scales by `rect.width/960`, `rect.height/540`), `:98-103` (`view()`), `:119-125` (`publishBbox` → `viewBbox(projection, transform, {width: 960, height: 540})`, `src/map/projection.js:382-386`); `src/style.css:513` (`.map { width:100%; height:100% }`). The graph view got this right (`graph-view.js:206-213` uses `getScreenCTM()` and says why).

**Measured** at 1440×900: the map area is 959×368 (aspect 2.60 against the viewBox's 1.78); the visible SVG x-range is **−223 … 1183**, i.e. 32 % of what the reader sees is outside the viewBox. Consequences: wheel zoom centres on the wrong point (a cursor at the left edge is taken as x=0, really −223); a pan moves the map at ~68 % of the cursor's speed; labels are placed by `view()`, which excludes the sides; and `?bbox=` (and therefore the timeline's "n of m events in view") describes only the middle 68 % of the picture — marks visible at the sides have no bar under them, which is exactly what `viewport.js` promises not to happen. Nothing republishes the box on resize either (`panes.js` → `onResize` → `map.render` only).

**Recommendation.** Convert client → SVG with `root.getScreenCTM().inverse()` as the graph view does; compute `view()` and `viewBbox` from the real visible rectangle (unproject the CTM-mapped corners of `getBoundingClientRect()`); schedule a `bbox` write on `ResizeObserver`. Alternatively set the viewBox from the container's aspect at build and on resize. **S.**

### 5. Clicking a splittable cluster on the map shows its list for ~200 ms, then the list is replaced

**Where.** `src/map/map.js:68-85` (`onCluster` → `panel.showCluster(cluster)` then `zoomTo`), `:158-171` (the animation ends with `scheduleBbox()`), `:119-125` (`publishBbox` → `state.set({ bbox })`), `src/panel/panel.js:427` (any `set` → `render` → `container.innerHTML = …`), `:422-425` (`showCluster` is outside the state).

**Measured.** Click on the 67-event Lisbon stack: panel reads "67 events here Lisbon…" at 30 ms and "Pick an event…" at 930 ms, after one `replaceState`. On the graph view the list survives (no bbox there), so the two pictures behave differently for the same gesture.

**Recommendation.** Either make the cluster list a state (`?cluster=<key>` is not shareable across zooms, so probably not) or have the panel ignore renders whose patch touched no opening while a cluster list is showing — the same "openings only" subscription as finding 3 fixes both. **S.**

### 6. Back restores the openings but not the picture; the URL and the screen disagree

**Where.** `src/state.js:285-300` (`popstate` parses the URL with the *current state as defaults*, then overrides only `OPENINGS` and `chain`), `:207-212` (`formatState` in reading mode writes only `narrative` and `step`).

**Measured.** Open an event on the map, open an actor from its chip, switch to the graph, press Back: URL `?selected=1908-…` (no `view`), screen: graph shown, map hidden. In a narrative, switch to the graph: the URL stays `?narrative=…&step=11` — a copied link opens on the map. The same inheritance applies to `focus`, `group`, `lanes`, `layers`, `bbox` and `from`/`to`: Back to an entry made before a lens was applied keeps the lens on, and the address bar is not rewritten afterwards, so the next copied link is not what is on screen. Within a narrative, Back reapplies `openingWindow` (`narrative-mode.js:33-37`, via `restore`) rather than the window the reader had slid to.

**Why it matters.** The project's own rule ("a link should open on the picture it was sent from", `state.js:34-36`) is broken by its own Back button, and the deliberate exception in the comment does not cover `view`, which is explicitly state.

**Recommendation.** On `popstate`, take the whole state from the URL with `defaultState()` as defaults (pushes already write every non-default field, so nothing is lost), then `write(false)` to normalise; in reading mode write `view`, `group`, `lanes` and `layers` beside `narrative`/`step` (they are how the picture is drawn, not what is derived from the step). **S, OWNER DECISION** on the reading-mode URL.

### 7. Signing a record deletes the citation checks the reviewer just made

**Where.** `src/review/sign.js:38-50` (`signRecord`: `delete signed.review` — flags, note *and* `citations`), `src/review/citations.js:44-62` (`unverified`/`countCitations` read `review.citations`), `tools/validate.mjs:278-283` (the "N of N not yet checked" count), `src/review/main.js:348-354` (Sign uses `editor.current()`, i.e. the ticks made a moment before).

**Why it matters.** The verification flag was built as the maintainer's per-citation audit trail ("a different act from signing — one book at a time, often on a different day", `citations.js:5-8`). The dashboard's own flow is tick → Sign, and Sign wipes the ticks: the validator's headline number can never fall through the dashboard, and a reviewer who checked three books has no record of it on the signed file. `review.citations` also cannot be written on an already-signed record without re-adding a `review` block whose absence the queue treats as "reviewed".

**Recommendation.** Decide what `review` means. Cleanest: keep `review.citations` across Sign and Retract (delete only `flags` and `note`), or move verification out of `review` onto the citation itself (`sources[i].verified: { by, on }`), which survives every edit and makes the flag portable. **S, OWNER DECISION.**

### 8. "Unreviewed" is defined as one author-name string, so the queue misses every other unsigned record

**Where.** `src/review/queue.js:14` (`DRAFT_AUTHOR = 'Claude (assistant draft, unreviewed)'`), `:24-26` (`isDraft`), `:100-120` (`buildQueue` filters on it), `tools/build-index.mjs:83` (the review index digests only `isDraft` records), `tools/import/wikidata.mjs:69,483-500` (records the import *creates* carry `IMPORT_AUTHOR` and `review.flags: ['imported-facts']`, "the queue counts the record" — it does not), `tools/bundle-to-files.mjs:196-211` (a community contribution lands with the opener as author and no `review` block at all).

**Why it matters.** Today every one of the 191 import-authored `imported-facts` records happens to be retracted, so no active record escapes; the next `import/run-…` branch creates active ones that never reach review.html, and every contribution accepted through the issue pipeline is invisible to the queue from the day it merges. Review status is being encoded in an *attribution* field, which is also a portability problem (finding 22).

**Recommendation.** Define the queue as records with no human signature: `authors` containing only machine names (a list beside `IMPORT_AUTHORS`) *or* a non-empty `review.flags`, and have the contribution pipeline write `review.flags: ['contributed']`. Better still, an explicit `review.status` (see 22). **S.**

### 9. A ninth record kind touches ~30 files; an edge type ~10; a relation type 6; a lens 5; a view 6 — and the plan adds two kinds next

**Counted, from the code as it stands.**

*A new record kind* (the plan's `office` and `tenure`): `schema/v1/<kind>.json`; `schema/common/provenance.json` (`kind` enum); `schema/v1/bundle.json` (`oneOf`); `src/validate/core.js:10` (`KINDS`) and `:181-341` (a `buildTopology` branch); `src/validate/schemas.js:22-37` (`SCHEMA_FILES`); `src/validate/rules.js:78-95` (`ALLOWED_LICENSES`), `:400` (rule 6's list), `:487-569` (rule 11's cascades), `:236-288` (rule 3's references), `IDENTITY_KINDS`/`BODY_KINDS` if it has a page; `tools/lib/read.mjs:9` (`KIND_DIRS`); `tools/build-index.mjs:61-70,92-101` (topology keys, manifest counts); `tools/new-record.mjs` (a scaffold branch); `src/data.js:28` (the `kinds` list, the Map, the adjacency it feeds); `src/contribute/bundle.js:64-197` (`FIELDS`, `CITATION_LISTS`, `ACTOR_LISTS`, `STEP_LISTS` — every one of the four maps needs an entry even when empty), `:371-493` (`buildRecord`), `:531-661` (`valuesFromRecord`), `:821-825` (`everythingCited`); `src/contribute/form.js:20-32` (`KIND_LABEL`, `KIND_HINT`), `:106` (the add buttons), `:130-198` (a choices function); `src/review/queue.js:18` (`KIND_ORDER`); `src/review/editor.js:51-83` (`choicesFrom`); `src/review/sign.js:66-113` (`retractionPlan`); `src/citation.js:11-23` (`CITER_LABEL`, `CITER_ORDER`); `src/entry/entry.js:24,28` (`ENTRY_KINDS`, `ATLAS_PARAM`); `src/markdown.js:22` (`RECORD_LINK_KINDS`); `src/state.js` (a parameter, `OPENINGS`, parse and format); `src/panel/panel.js:383-418` (the precedence) plus a card file; `src/panel/source.js:37-96` (`citerRow`); `src/search.js:38` and `src/search-box.js:24`; `src/lens.js` if it can be a lens; `data/LICENSE`; `CONTRIBUTING.md`; `ARCHITECTURE.md`; tests. That is about thirty places, in three languages of list (JSON enums, frozen arrays, `if (kind === …)` chains), and the plan review already found it (`docs/review-2026-09-05-plan.md`, finding 3) and answered with a checklist rather than a registry.

*A new edge type:* `schema/v1/edge.json` (enum and the id pattern), `schema/v1/narrative.json` (the ref pattern), `src/validate/rules.js:28-29`, `src/state.js:76` (a second copy of the regex), `src/graph.js:9` (`TYPE_ORDER`), `src/panel/event.js:19-25` (`TYPE_LABEL`), `src/graph-view/graph-view.js:106` (the key), `src/style.css` (`.type-*`), `about.html`, tests. *A relation type:* `schema/v1/relation.json` (enum and pattern), `rules.js:36-50` (three constants), `state.js:77`, `panel/actor.js:20-35` (label and order), `CONTRIBUTING.md`. *A lens value:* `state.js:83`, `lens.js:13,15,40-79`, `grouping.js:31`, the card's `lensControl`, `search-box.js:47-62`. *A view:* `state.js:79`, `main.js:78-95`, `index.html:27-30`, a module, `style.css`, `panel/cluster.js:15-17`.

**Why it matters.** The owner's third consideration is precisely this, and M30a is scheduled to add two kinds, retire a relation type and add a lens value. Every list above is a place a future contributor can forget; the duplicated regexes in `state.js` exist because "this file stays free of the data", but `rules.js` is as pure as `state.js` and could be imported.

**What a registry would look like.** One module, `src/kinds.js`, exporting a frozen table keyed by kind: `{ dir, schema, idPattern, licenses, cites: bool, lists: {citations, actors, steps}, fields, urlParam, card, citerLabel, order, entryPage: bool, identity: bool }`, consumed by `core.js`, `read.mjs`, `build-index.mjs`, `bundle.js`, `form.js`, `queue.js`, `citation.js`, `entry.js`, `panel.js`, `state.js` and `new-record.mjs` (the schema file list is derivable from it, so `schemas.js` goes). Beside it `src/vocab.js`: `EDGE_TYPES` as `[{ id, label, order, cssClass }]` and `RELATION_TYPES` as `[{ id, labelOut, labelIn, symmetric, endpoints }]`, with `EDGE_ID`/`RELATION_ID` *built* from them once; `state.js` imports the regexes. The JSON schemas' enums remain the one duplication, and `tests/schemas.test.mjs` can assert they equal the registry. Adding a kind then means: one schema file, one registry entry, one card module, one `buildTopology` projection function registered in the same entry. **M** for the registry, **L** if done together with the index split. **OWNER DECISION** on whether the registry is code (`src/kinds.js`) or data (`data/kinds.json`, which the plan's "roles are data" decision suggests).

### 10. Contributors cannot find a node among thousands: `<select>` pickers and a duplicate search for events only

**Where.** `src/contribute/form.js:200-213` (`fill` rebuilds a `<select>` with every active event/actor/place/source), `:347-351` (the actor picker is "the search the brief asks for"), `:130-198` (the choice lists are rebuilt on *every keystroke* via `refreshOptions()`, lines 215-217 and 307, and `recordChoices` does a linear `find` per edge, line 178: O(E·V)); `src/contribute/bundle.js:762-779` (`findSimilar` — events only), `form.js:507-541` (`candidates`/`paintSimilar`: `entry.kind !== 'event'` → skipped); `src/review/editor.js:51-83` (the same `<select>`s, with `titleOf` = linear `find` per edge on every `fill`).

**Why it matters.** The owner's fourth consideration calls this "the hard part". A `<select>` of 329 events is already a scroll; at 10 000 it is unusable and the per-keystroke rebuild is seconds. A second Lisbon, a second Salazar or a second edition of the same book is not caught at all: only event titles are compared, and `wikidata` — the one field that identifies a duplicate with certainty — is not used for it. The good pieces exist: `src/search.js` (folded, ranked, over titles, names, aliases, Wikipedia titles) and the search box's keyboard model.

**Recommendation.** A reference picker component built on `search.js` (typeahead over the kind's index, showing year/place/type beside each hit, arrow keys, "in this bundle" entries first) used for every reference field in the form and the editor; `findSimilar` for every kind, over `names`/`aliases`/`wikipedia` titles, plus an exact `wikidata` match reported as "this item already exists"; in the review editor the same component. **M.**

### 11. The validator has superlinear rules, and it runs on every keystroke in the browser

**Where.** `src/validate/rules.js:495-522` (rule 11: for each non-active event, scan *all* active edges; for each non-active actor/place, scan the whole universe), `:638-660` (rule 17: pairwise per actor), `:503-515`, `:876-893` (`referencedActors` over the universe — linear, fine), `src/validate/schema.js:253` (`new RegExp(pattern,'u')` compiled per value checked), `src/contribute/bundle.js:806-817` and `src/review/editor.js:385-400` (`validateBundle` → `validate(records, topology)` → `checkRules` rebuilds the universe Map from the *whole topology* on each keystroke), `tools/serve.mjs:160-216` (each PUT re-reads every record, validates, rebuilds and rewrites the whole index).

**Measured** (synthetic, all records active): 5 000 events / 10 000 edges → schema pass 637 ms, `checkRules` 136 ms; 20 000 / 40 000 → schema 2 371 ms, rules 585 ms. Linear so far, and the *schema* pass is four fifths of it (the per-value `new RegExp`). Extrapolated to 100 000 / 300 000: ~20 s in CI, which is acceptable. The quadratic rules were not exercised because the synthetic set has no retracted record: with the real dataset's ratio (192 of 329 events retracted or merged) rule 11 is retracted-events × active-edges, i.e. ~60 000 × 300 000 at scale, and rule 17 is pairwise per actor. Real data: 1.4 s for 1 716 records in CI; 14 ms per keystroke in the editor (measured) — acceptable today, seconds at 20 000 because the universe Map is rebuilt per keystroke.

**Recommendation.** Index once per `checkRules` call (edges by endpoint, events by actor and place, presences by actor, `nameKey` per source) and make rules 11 and 17 lookups; precompile schema patterns in `createValidator`; in the browser, validate the bundle's records against a *prebuilt* universe (build the Map once per page, pass it in) and debounce to ~150 ms; in `serve.mjs`, keep the loaded records in memory between saves and rebuild only the affected index files. **M.**

### 12. Horizon and convergence are recomputed by every view on every state change

**Where.** `src/horizon.js:39-42` (`horizonSet` → `reachableBy` → `shortestPaths` + `pathTo` per reachable node, `src/graph.js:100-179`), called independently from `map.js:296`, `timeline.js:383`, `graph-view.js:389`, and `panel/horizon.js:41` (`horizonResults`); `graph-view.js:370-375` and `panel/event.js:174` (`convergence` twice per change).

**Why it matters.** With a horizon open and 100 000 events downstream, one state change is four BFS walks plus 100 000 `pathTo` reconstructions (sum of path lengths, O(V·depth)), then `pathTo` again for the 40 rows shown. `queue.shift()` in `reach`/`convergence` is O(n) per pop on large queues.

**Recommendation.** Memoise in `horizon.js` keyed by (`adjacency`, `selected`, `horizonYear`) and in `graph.js` keyed by (`adjacency`, `target`, `path`); compute `pathTo` lazily; use an index-based queue. **S.**

### 13. Clustering is O(n²) per frame, and the zoom animation re-clusters sixteen times

**Where.** `src/cluster.js:73-95` (greedy double loop, "honest about it"), `src/map/layers/events.js:155-159` (called on every `render`), `src/map/map.js:158-171` (`zoomTo` calls `render` on every animation frame for 260 ms), `graph-view/layout.js:309-326` (`stackLayout` per lane per render).

**Measured.** 2 000 points: 24 ms; 10 000 points: 82 ms at k = 1 (the greedy pass skips taken points, so dense data is cheaper than the bound suggests); the worst case is quadratic and arrives at deep zoom, where few points merge. At 10 000 events one zoom animation is ~16 renders × (clustering + a full `replaceChildren` of 10 000 marks) — seconds of jank.

**Recommendation.** A uniform grid keyed by `distance/k` (the code comment already names the fix); during the zoom animation apply the transform only and cluster once at rest; cache the clustering per (event set, k bucket); draw only marks inside the visible rectangle. **S–M.**

### 14. A failed record fetch is cached for ever

**Where.** `src/data.js:88-93` (`record()` stores the promise; a rejected promise stays in `cache`), consumers `panel/event.js:277`, `panel/panel.js:190`, `entry/main.js:44`.

**Why it matters.** One dropped request on a phone leaves that event's summary, sources and every "Why" that names its edges showing "Could not load" for the rest of the session; reloading the panel does not retry.

**Recommendation.** `cache.delete(key)` on rejection (or cache only fulfilled values). **S.**

### 15. The full page is not a page: `entry.html` is built by script from the whole atlas

**Where.** `src/entry/main.js:31-53` (loads topology + sources index, then the record, then renders), `deploy.yml` (nothing prerendered).

**Why it matters.** The owner wants a public platform where "a curious person can easily explore": a record's page is what search engines index and what people share, and today it is an empty `<div>` until ~1.5 MB has downloaded and parsed; at scale (finding 1) it is tens of MB per page view. The index build already has every record in hand.

**Recommendation.** Prerender `entry/<id>.html` in `build-index.mjs` from the same `entryHtml()` (it is pure), with the script only enhancing; the same for `narratives.html` and `sources.html`. **M, OWNER DECISION** (it makes the build a build, though still a Node script and still no bundler).

### 16. There is no way to hand a reader a path that is not a saved narrative

**Where.** `src/narrative.js:111-115` (`readingNarrative` resolves only ids in the topology), `src/narrative-mode.js:42-72`, `src/state.js:207-212` (`?narrative=&step=` is the whole URL), `?chain=` (a list of edge ids, one step's edges only, no prose).

**Why it matters.** The owner's second consideration asks whether the mechanics survive an AI that "writes narratives on demand or guides a path" (BACKLOG "Research"). Reading mode is well designed for it — everything is derived from a narrative *object* — but the object must be a committed record. A generated walk that the reader has not saved can be carried only as `?chain=`, which drops the per-step text, the title and the provenance ("generated, from these records") that CONTEXT.md requires to be visible.

**Recommendation.** Let reading mode take a narrative from a second source: `?walk=<id>` resolved against a `data/walks/` (generated, marked, unsigned) directory or a fetched JSON, with `provenance: 'generated'` shown on the card; the derivation (`stepState`, `chainAt`) needs no change. Reserve the state field now. **S** for the plumbing, **OWNER DECISION** on the policy.

### 17. First contact gives a reader 137 marks and "Pick an event"

**Where.** `src/panel/panel.js:356-366` (`introHtml`), `index.html` header (narratives only as a link), `narratives.html` (one narrative).

**Why it matters.** The exploration mechanics past the first click are good (see "Sound as it is"), but the first click is unguided: nothing says which events are the spine, which walks exist, what the horizon is. The marks are all the same size; `weight` exists in the index and drives only cluster representatives and labels at zoom ≥ 4.

**Recommendation.** An intro card listing the narratives, the heaviest events by `weight` (or an editorial `prominence`, reserved in ARCHITECTURE.md), and one "try this: follow the consequences" walkthrough; a "start here" that opens a narrative at step 0. Editorial, so **S, OWNER DECISION**.

### 18. The timeline is the only view that never scales its scale

**Where.** `src/timeline.js:11-15` (lanes stay on the whole extent whatever the window), `:346-457` (every event drawn, one `<rect>` each, packed into ≤ 20 rows, the rest stacked by `clusterPoints` per lane), `lanes.js:215-249` (`packRows`, first-fit over all rows).

**Why it matters.** With five hundred years of data at 1 400 px, a decade is 28 px: everything past a few thousand events is one stack per row, the band is a sliver, and narrowing the window does not zoom the lanes (a deliberate M6 decision recorded in the file). At 100 000 events the DOM is 100 000 rects per render (see 3).

**Recommendation.** Draw only events overlapping the band's neighbourhood at full detail and the rest as a density strip per row (one `<path>`), and let the lanes zoom with the window past a threshold (the deep-time scale is already an injection point, `timeline-scale.js`). **M, OWNER DECISION** (reverses the M6 decision).

### 19. Search is a linear scan per keystroke with no index — fine to ~20 000 entries, then not

**Where.** `src/search.js:110-152` (every entry × every term, `indexOf`), `src/search-box.js:28-33` (built once at load from the topology), `:47-62` (`outside()` recomputes `lensFor` per result row).

**Measured.** 2 300 entries: 5 ms per query. Linear, so ~200 ms at 100 000, on the main thread, per keystroke.

**Recommendation.** Keep the scan but debounce and run it in a `Worker` at first; a prefix/trigram index built at load (or emitted by `build-index` as the reserved `search-<hash>.json`) when the scan crosses ~50 ms. **S–M.**

### 20. Retracted and merged records: mostly right, two edges

**Where.** `src/graph.js:26-47` (adjacency skips non-active edges and endpoints — correct), `src/data.js:76` (`activeEvents`), `src/panel/event.js:184` (a retracted event opened by URL shows a notice — measured), `src/data.js:59-74` (`resolve` follows `supersededBy` — measured, the merged election opens Delgado's candidacy with a notice). The edges: (a) `src/validate/rules.js:274-281` — a narrative step or a `review.citations` key does not resolve through `aliases`, so renaming a record (allowed, "former ids go in aliases") breaks every narrative that walks it and every verification flag keyed by the old source id, and the validator reports it as an error rather than resolving; (b) `src/search.js:38-60` excludes non-active records, but `src/lens.js:95-102` (`lensLabel`) and `src/panel/panel.js:308-316` (`openingLabel`) read retracted records by id and show their titles — harmless.

**Recommendation.** Make rule 3 and `narrativeSteps`/`citationsOf` resolve aliases the way `resolve()` does (one helper in `rules.js`), and have the migration that renames a record rewrite references in the same commit (`tools/migrate-places.mjs` is the pattern). **S.**

### 21. Ids embed the type vocabulary, and nothing migrates a rename

**Where.** `src/validate/rules.js:29,37` (`from--to--type` ids for edges and relations, checked by rule 2, lines 213-219), `data/edges/*.json` (161 files named by type), the plan (`docs/plan-2026-09-05.md`, decisions 2 and 12: retire `led`, re-type ten `allied-with` relations as `member-of`).

**Why it matters.** Re-typing a relation is a rename: a new file, the old one retracted-or-aliased, every `?chain=` link, narrative step, `review.citations` key and citation `id` in the sources index updated. The plan will do this by hand twelve times; the data model makes every future vocabulary change the same operation. The derived id buys "the same argument cannot be filed twice", which a uniqueness rule on (`from`, `to`, `type`) buys equally.

**Recommendation.** Either keep derived ids and ship `tools/migrate-ids.mjs` (rename + alias + rewrite every reference, validated), or make edge/relation ids opaque slugs and enforce uniqueness of the triple in rule 2 — the second is the more portable spine. **M, OWNER DECISION.**

### 22. Review status, attribution and machine authorship share one field

**Where.** `schema/common/provenance.json` (`authors[].name` free text, `review.flags` optional), `src/review/queue.js:14`, `src/validate/rules.js:117` (`IMPORT_AUTHORS` — licence exception keyed on an author *string*), `tools/import/wikidata.mjs:69`, `tools/import/cshapes.mjs` (the same), `docs` (the exception in CLAUDE.md is defined by the string).

**Why it matters (portability).** Whether a record is reviewed, who is legally the author for CC BY-SA attribution, and which automated process wrote it are three facts; today all three are inferred from `authors[].name` matching one of three literal strings. A restructuring that changes the string (a rename of the assistant, a second import, a translation overlay with its own reviewers) silently changes review status and licence validity. `IMPORT_AUTHORS` also means a human named exactly like the import string could relicense an actor.

**Recommendation.** Add to the envelope: `review.status: "draft" | "reviewed"` (or `signedBy: [{ name, github, on }]`), and `origin: { tool: "cshapes" | "wikidata" | "assistant" | "form", run?: … }` for machine writers; key `IMPORT_AUTHORS`, `isDraft` and the licence exception on those fields. Migrate once with a script (every draft today is identifiable by the string). **M, OWNER DECISION.**

### 23. Derived facts leak into records in two places; the rest of the asserted/derived split is clean

**Where.** `region` is written on events and places as an override and derived otherwise — clean (`core.js:165-173`, `regionMethod` says which). `weight`, `citationCount`, `citations`, `name` (first of `names`) and the region derivation live only in the index — clean. The two leaks: (a) `tools/import/wikidata.mjs:783-930` writes `region` on *every* placeless event it creates (line ~898, "written even where the point would have derived it"), so a later polygon change will not move those events; (b) `sitelinks` is a snapshot of a third-party count stored as a fact with no `fetched` date beside it (`provenance.json`, `identity.mjs`), while the same import dates its cached leads.

**Recommendation.** (a) Have the import set `region` only when derivation fails, and record `regionMethod`-style provenance on the record when it does (`region: …, regionNote: "set by import, no polygon"`); (b) either drop `sitelinks` (nothing reads it, by rule) or store it as `{ count, on }`. **S.**

### 24. Licence boundaries hold in the validator, not in the data model

**Where.** `src/validate/rules.js:571-586` (rule 12: per-directory licence, the NC exception keyed on `IMPORT_AUTHORS`), `data/LICENSE`, `data/geo/LICENSE`, `provenance.json` (`license` enum allows `PD`, `CC0-1.0`, `ODbL-1.0` that no directory accepts), `src/panel/actor.js`, `src/entry/entry.js` (an NC-licensed actor's `summary` is rendered on the same page as BY-SA text with no marker), `data/index/*` (the index mixes NC presence/actor projections with BY-SA records in one CC-unstated file).

**Why it matters.** The rule is enforced, and the reasoning in `data/geo/LICENSE` is right. What is missing for a restructuring is *per-record machine-readable attribution*: a downstream reuser of `data/` cannot tell from a record which third party it derives from except by parsing `authors[].name`; the index files carry no licence field at all; and the site never says on an actor card that its text is NC.

**Recommendation.** `data/LICENSE` and the index manifest should list, per directory/file, the licence and the attribution; NC-derived cards and entry pages should carry the attribution line the licence requires (one line in `actorCardHtml`); the enum should shrink to what rule 12 accepts or rule 12 should grow. **S.**

### 25. The `schema: 1` per record has no migration path and no dataset-level version

**Where.** `provenance.json` (`"schema": { "const": 1 }`), `src/validate/core.js:50-53` (any other value is an error), `tools/migrate-places.mjs` (the one migration, one-off), no `data/schema-version` or manifest `schema` beyond `1`.

**Why it matters.** Every restructuring of the spine (the plan's `office`, `tenure`, `parent`, `scope`, `historicalNames`, roles closing) is "additive" today, so `1` never changes — which means `schema` carries no information and a breaking change has nowhere to go. Bumping it to 2 on 100 000 files is a rewrite of every file in one commit, and every fork's records are invalid the next day.

**Recommendation.** Write the migration convention now while there is one migration: `tools/migrate/<n>-<name>.mjs`, idempotent, validated, with the target `schema` version; let the validator accept `schema ≤ SCHEMA_VERSION` and run the chain on read (in `read.mjs`) so old files validate until they are rewritten. **S.**

### 26. The sources index is the bibliography *and* the reverse citation index, and grows with the graph

**Where.** `src/validate/core.js:123-147,318-321`, `src/data.js:41-49` (`citationsOf` built from it), `src/panel/source.js` (citers from it), `sources.html` (one fetch, by design).

**Why it matters.** 34 sources are 337 KB because 1 928 citations ride along; every citation added anywhere changes the sources hash and invalidates the bibliography page's cache for all readers. Part of 1 but a distinct fix.

**Recommendation.** `sources-<hash>.json` with the bibliographic fields and `citationCount` only; `citers/<source-id>.json` on demand. **S.**

### 27. The graph view and the map compute "what the reader is working with" by hand, three times

**Where.** `src/map/layers/events.js:128-143`, `src/timeline.js:267-277`, `src/graph-view/graph-view.js:399-412` — the never-stacked/never-faded set is assembled differently in each (the graph adds `converging` and the lens set, the map adds `consequenceEdges` endpoints, the timeline uses `alone` for a different purpose).

**Why it matters.** M25's brief said "one place where 'a cluster never swallows the chain' is true" (`cluster.js:59-63`), and the three views still disagree about the set they pass in. A fourth view (the plan's "Why" mode) would be a fourth copy.

**Recommendation.** A pure `workingSet(atlas, state)` in `horizon.js`'s neighbour (`src/emphasis.js`): `{ selected, path, consequences, converging, actor, narrative, reachable, lens }` as ids, consumed by all three renders. **S.**

### 28. `lanes`, `focus`, `group` and `view` vocabularies are validated in `state.js` by regexes that duplicate `rules.js` and `lens.js`

**Where.** `src/state.js:76-84` versus `src/validate/rules.js:29,37`, `src/lens.js:13,15`, `src/lanes.js:25`.

**Why.** Two definitions of one closed set drift (the plan's `region:` and `event:` lens values touch both, decision 8). Part of finding 9; listed separately because it is the cheapest fix: import.

**Recommendation.** `state.js` imports `EDGE_ID`, `RELATION_ID`, `FOCUS_KINDS`, `GROUPS` from their owners (they are pure modules). **S.**

### 29. Rule 11's cascade for a retracted event is enforced but not offered: the dashboard retracts, the form and the Action do not

**Where.** `src/review/sign.js:66-113` (`retractionPlan`, dashboard only), `tools/bundle-to-files.mjs` (a correction bundle that sets `status: retracted` on an event without its edges fails validation in the Action with no hint), `.github/ISSUE_TEMPLATE/correction.yml`.

**Why.** A stranger's correction "this event is wrong, retract it" will bounce with rule 11 errors about edges they never saw.

**Recommendation.** Run `retractionPlan` in `bundle-to-files.mjs` under `--correction` and either add the cascade to the branch or report the plan in the failure comment. **S.**

### 30. The contribution pipeline validates after writing, on the whole dataset, and reviews in the PR only

**Where.** `.github/workflows/contribution.yml` (write → validate → tests → branch → PR; `git add data`), `tools/bundle-to-files.mjs:196-211` (`applyProvenance`, no `review` block), `CONTRIBUTING.md` "The review checklist — the part no tool does".

**Why it matters (yardstick 5).** Cataloguing: the merged record is indistinguishable from a maintainer's own; the queue never sees it (finding 8); the PR is the only audit trail, and PR review of a JSON diff is not the dashboard the owner built. Also `lookup-sources` runs after the PR is opened, so the identifier check arrives as a second comment.

**Recommendation.** Contributions land with `review.flags: ['contributed']` and `review.note: 'issue #n'`; the PR body links to `review.html?open=<id>` (a `?open=` parameter the dashboard does not have yet); the identifier check runs before the PR and goes into its body. **S.**

### 31. No history on the dashboard, no diff against the draft

**Where.** `src/review/main.js:257-296` (`openRecord` fetches the file, nothing else), BACKLOG ("A record's history on the review dashboard") and M34.

**Why.** Already known and scheduled; recorded here because the cataloguing yardstick names "history" and because the git-backed version needs `serve.mjs` to shell out, which is a new capability of a server whose whole security argument is that it does one thing. Prefer the static per-record history file from the index build over a `git log` endpoint. **M** (scheduled).

### 32. The phone sheet and the panes are preferences that ignore each other; one measured edge

**Where.** `src/phone.js`, `src/panes.js`, `src/style.css:422-472`.

**What.** All 19 browser-driven tests pass, including the phone ones. One edge from reading: `phone.js:104-108` raises the sheet on every `step` change, so reading a narrative on a phone brings the sheet up over the map at every arrow key, while the text says "the map, the graph and the timeline follow the step" — the reader cannot see them follow. **S, OWNER DECISION** (design).

### 33. `Discuss this record` carries the reader's full URL, `bbox` included, into a public issue

**Where.** `src/panel/panel.js:297-300`, `src/share.js:20-29`.

**Why.** Harmless today; when `localStorage`-backed preferences or a future `?reviewer=` ever reach the URL it becomes a leak. Also the correction template's `notes` field gets a URL that can exceed GitHub's limit once `?chain=` has fifteen steps (~1.5 KB, fine; the `MAX_PREFILL` logic in `submit.js` is not applied here). **S.**

### 34. `resolveWindow` and friends compare years correctly; two places compare historians' years directly

**Where.** `src/state.js:143` (`state.from > state.to`), `src/util/window.js:461` (`windowAt`: `state.from > year`). Both are order-preserving across the year-0 gap, so no defect — noted because `dates.js:1-5` promises "nothing else compares years directly" and a future `min/max` bound in the state would break the promise. **S.**

### 35. Deployment: the artifact is the repository

**Where.** `.github/workflows/deploy.yml` (`upload-pages-artifact` with `path: .`; only `tools/import/cache` removed).

**Why.** `tests/fixtures`, `docs/`, `tools/`, `data/imports/` (200 KB seeds), `.github/`, every `*.test.mjs` and `review.html` (a maintainer page that says it "can write") are published. Fine at 14 MB; the artifact grows with every screenshot and record; `review.html` on the public site silently degrades to "copy a bundle", which is by design but unlabelled.

**Recommendation.** An explicit allowlist for the artifact (html, `src/`, `schema/`, `data/` minus `imports/`), and a banner on `review.html` when it is not on localhost. **S.**

---

## Sound as it is

Checked and would not change:

- **`src/util/dates.js`** — the astronomical conversion, `bounds`, `extent`, `formatInterval` (BCE ranges), and the discipline of comparing through it; `timeline-scale.js` ticks across year 0; `narratives/list.js` `centuryOf`. BCE inputs (`?from=-9000`) round-trip and draw without error.
- **`src/state.js` parse/format** — field-by-field fallback, the legacy `?year=` (measured: `?year=1975` → `?to=1975`), backwards windows swapped, `layers=` empty meaning none, `bbox` rounded and clamped, `PASSTHROUGH` for `fixtures`, `pushes()` on the patch, the trail bounded at 50. Only the popstate inheritance (finding 6) is wrong.
- **The load token** (`panel.js:39,353,373-374,422-424`) — a late fetch never paints over a newer card; `showCluster` bumps it too.
- **Escaping** — every record string reaches `innerHTML` through `esc()`; attributes are set with `setAttribute`; `safeUrl` gates every href; `markdown.js` is a closed subset that refuses HTML, images and non-http schemes and *shows* what it refused; `share.js`'s exported SVG inlines only computed tokens. No unescaped interpolation found in the panel, grouping, search, entry, narratives, bibliography or preview.
- **`src/validate/schema.js`** — fails closed on unknown keywords, resolves `$ref` inside the set only, reports `oneOf` alternatives; `schemas.test.mjs` pins the browser list to the directory.
- **`tools/serve.mjs`** — loopback only, Host and Origin checked, no CORS, PUT only, `Content-Type` checked, kind and id validated before any path exists, resolved path re-checked, bundle validated against disk before a byte is written. `tools/bundle-to-files.mjs` — the same discipline on the Action side; balanced-brace extraction with an attempt cap; `__proto__` refused; the opener's login re-validated before it reaches `git --author`. `workflows.test.mjs` asserts no `${{ }}` in `run:`.
- **`tools/build-index.mjs`** — canonical key order, code-unit sort, content-hashed immutable files, uncached manifest, `--index` freshness in CI; the palette as a generated file with `spilled` written out rather than hidden.
- **The additive rule** (`tools/import/identity.mjs`) and its use by both imports; `cshapes-actors.json` as data, not code; per-source licence files.
- **`src/graph.js`** — `buildAdjacency` filters non-active edges and endpoints defensively; deterministic ordering everywhere; the convergence query excludes the walked path only (and the file says why).
- **`src/horizon.js` / `util/window.js`** — the horizon cuts the answer, not the walk; default horizon never written; the three bands.
- **Lens vs selection vs grouping** (`lens.js`, `lanes.js`, `grouping.js`) — removal, emphasis and arrangement kept distinct, one `lanesFor` for two pictures, the lane rule stated on the card.
- **Reading mode** (`narrative.js`, `narrative-mode.js`) — everything derived from the step, `LEAVES` semantics, step clamping (measured `step=99` → 11), `chainAt` breaking on a jump.
- **Retracted/merged handling** — tombstones resolve, notices are shown, no edges are walkable, rule 11 cascades are enforced, `retractionPlan` names blockers instead of cascading through actors and places.
- **`cluster.js`** — deterministic seed order, `alone`, coincident spread with largest-remainder rings, `mergeEdges` with disputed-wins.
- **`sections.js`, `panes.js`, `phone.js`** — every `localStorage` access wrapped; stored values validated before reaching a selector; preferences never in the URL.
- **Presences by year** (`data.js:237-247`, `layers/presences.js`) — one shard per period, a render token for late shards, signature-keyed DOM reuse, the clamp to coverage shared by map, card and marker.
- **The test suite** — 588 tests, the browser ones driven over raw CDP with no npm, the byte-identical form/editor round-trip over the whole dataset, the workflow linting.
- **The data model's separation of asserted and derived** (with the two exceptions in finding 23): `region`/`weight`/`citations`/`name` are index-only; `when.date` is display-only; places hold the point; identity fields are additive and import-written.

## Performance at scale

"Today" is the real dataset (137 active / 329 events, 161 edges, 710 presences) unless a synthetic figure is given; "100k" assumes 100 000 events, 300 000 edges, 20 000 actors, 50 000 presences, 200 000 citations. Timings are from this machine's Node 22; browser costs are estimates from the measured pure cores.

| Component | Cost today | Cost at 100k | What would change |
|---|---|---|---|
| Index download (`loadAtlas`) | 927 KB topology + 337 KB sources + 126 KB land + 1 shard ≈ 2.3 MB raw, ≈ 720 KB gz, 4 requests | ~110 MB topology + ~20 MB sources raw (≈ 12 MB gz); every page | Split spine / detail / per-kind / per-source (1, 26); prerender pages (15) |
| Topology parse + `createAtlas` Maps | < 50 ms | 1–3 s parse, 300+ MB heap, ~1 s of index building per page load | Same as above; build adjacency from a compact edge array |
| `buildAdjacency` | 8 ms at 2k/4k | ~0.5 s | Fine once the spine is compact |
| Map events layer (`clusterPoints` + DOM) | 24 ms at 2k points, 82 ms at 10k; ~5 ms real; rebuilt per state change and per zoom frame | quadratic worst case (deep zoom); 100k SVG nodes rebuilt per frame | Grid index; cluster at rest; draw only the viewport (13, 4) |
| Presences layer | 710-presence scan per render, DOM reused by signature | 50k-presence scan per render, ~1 MB shard per period | Interval index per shard; shard by region as well as period |
| Timeline render | full SVG rebuild per pointer move (40 per drag measured) | 100k rects per pointer move; `packRows` O(n·rows) | Debounce, diff, density strip, windowed drawing (3, 18) |
| Graph layout (`layoutGraph`) | 134 events: instant; **3.2 s at 2k/4k, 114 s at 10k/20k** | O(E²)×7: days | Drop exact crossing count; lay out the visible subset (2) |
| `stackLayout` (per render) | 64 ms at 2k, 591 ms at 10k | tens of seconds per render | Grid index; cache per k bucket (13) |
| `convergence` / `reachableBy` | 5 ms / 14 ms at 2k; 21 ms at 10k | ~0.5–2 s each, ×2–4 per change | Memoise (12) |
| Panel render (event card) | 1 innerHTML per state change incl. drags (40 per drag measured) | same, plus 12 above | Openings-only subscription (3, 5) |
| Search | 5 ms per keystroke at 2.3k entries | ~200 ms per keystroke, main thread | Worker, then a prefix index (19) |
| Contribution form / editor per keystroke | 14 ms measured; `<select>` rebuilds O(E·V) | seconds per keystroke; unusable pickers | Prebuilt universe, debounce, typeahead pickers (10, 11) |
| Validator (CI) | 1.4 s (1 716 records); 0.8 s at 5k/10k, 3.0 s at 20k/40k synthetic (schema pass = 80 %) | ~20 s if linear; rules 11 and 17 are O(retracted × edges) and O(presences² per actor) and were not exercised | Index per rule, precompiled patterns (11) |
| `build-index` | 0.9 s; `--index` check 6.5 s (palette rebuild) | reads 100k files; palette rasterises every shard | Incremental build keyed by file mtime/hash; palette only when geometry changed |
| `serve.mjs` save | re-reads all records, validates, rebuilds and rewrites the whole index per PUT (~2 s) | ~30 s+ per save | Keep records in memory; partial index rebuild (11) |
| Pages artifact | ~14 MB data + repo | 100k files, hundreds of MB; deploy time and the 1 GB soft cap | Allowlist; consider packing records per kind for the site while keeping one-file-per-record in git (35, 1) |
| entry.html / narratives.html | whole topology per page view | tens of MB per page view | Prerender (15) |

# Review of the second index cycle - `docs/index2-plan.md` and briefs I1-I9

Reviewer: an independent Fable reviewer, 6 September 2026. Read-only over
`/home/gjacob/atlas-causal`; the plan and briefs from `origin/briefs-index2`
at `ce81e35`, the code from `origin/m0` at `8f51af7` (M30b-1 in progress:
the office card, the tenure strip, the dated names and the note beside a role
have landed; `M30b-1 done` has not). Nothing under the repository was
modified. Written incrementally to the session scratchpad.

## 0. What was reproduced

- `ls -la data/index/` on the working tree (`c40fc8c`, the same index the
  plan measured): `spine-d561eda4427c.json` 542,882 B; `search-` 171,186;
  `sources-` 33,677; `manifest.json` 21,927; `review-*` ten files (a summary
  and nine kinds; the plan says nine), 374,673 B; three explanation shards;
  `citers-` 33 files; `history/` **1,027 files, 4.1 MB**. 1,077 files in
  all (the I5 brief's "1,054 it held before" is H3c's number).
- One `node -e` over the spine reproduces the plan's per-kind split **to the
  byte**: presences 267,108 (49.2 %), events 125,196 (23.1 %), actors 106,557
  (19.6 %), edges 17,068, relations 11,918, places 7,763, tenures 3,647,
  offices 1,840, narratives 1,671. gzip 59,978 here against the plan's
  60,796 (a different level; same file). 137 of 329 events active.
  `aliases` is empty on every entry; **17 entries carry `supersededBy`**
  (the I2 brief says none do - harmless, the merges list covers them).
- `tests/fixtures/data/index/history/` holds 51 files; the fixture manifest
  is `schema: 1` and names `index/history` unhashed.
- The wheel factor of the graph is `Math.exp(-e.deltaY * 0.0015)`
  (`graph-view.js:384`): a 100-unit notch is x1.16, which is 3.4 of the 16
  buckets an octave `zoomBucket` rounds to. This matters for I6 (finding 11).

## 1. Verdict in one paragraph

**Proceed, with the amendments below; no decision needs rethinking, but two
briefs need a correction before a run could finish them.** The plan is the
first honest treatment of the first consideration since H3: it measured four
encodings before choosing, it keeps the whole-graph guarantee, it changes no
record, and it gates the switch (I4) on a number I3 prints. D1, D2, D3, D4,
D5, D6, D7, D8, D11 and D13 are sound as decisions. What would stop a cloud
run cold: I2's own "Done when" asks for a byte count that only I3's core can
meet while forbidding the field drop that gets there (finding 1); I3/I4 put
the two whole-universe readers - the contribution form and the review
dashboard - on "the core and no shards" when rule 21, `findSimilar`, rule 17
and the referrer warnings read fields the core does not carry (finding 2);
`revised` moves to the shards while `record()` reads it to build `?v=`, and a
browser test asserts that query on every record fetch (finding 3); the
sharding key "start year" is undefined for edges, places, offices and
sources, in I3 and again in I5 (findings 4 and 10); and I1's presences
vanish from every card and query test on its own commit because
`tests/helpers.mjs` builds atlases with a fetch that refuses (finding 5).
None of these is a reason to change the shape; each is a sentence in a
brief. The one diagnosis I do not believe is I6's (finding 11), and the one
design I would not ship as written is I9's `?walk=<session id>` (finding 16).

## 2. Against the owner's seven considerations and the hard constraints

**Scale to 10^4-10^5 on a static host.** The plan draws the right line -
the whole-graph guarantee needs `[from, to, type, confidence, status]` and a
year per event, and nothing else needs to be whole *for the picture* - and
measures it: 50 KB / 1.8 MB raw for the core against 543 KB / 9.7 MB today.
Two things it should say plainly and does not. First, at 10^5 the core is
~10 MB raw by its own projection, which is what the spine is at 2x10^4
today - the cycle buys ~5x, and the next lever (a windowed graph with the
convergence set precomputed, or a typed-array encoding) is outside "plain
JSON, no build step" and would be a new decision. Second, the search shard
is a whole-corpus file every `index.html` load parses - 171 KB today,
2.75 MB at 10^4, ~27 MB at 10^5 - and the byte budget excludes it because
it is "never waited for". Heap does not care what was waited for. I3 should
print it beside the core and `STATUS.md` should name it as the next
whole-corpus file (amendment I3 A6). Neither changes the plan.

**Easy exploration.** Unchanged by design, and the never-wait discipline is
the right one. The risk the plan underrates is not a frame without titles but
the *unwindowed lists*: an actor's card and an actor's entry page list every
event the actor is in, with title and role, across every century (h3a-brief
A4 cancelled period shards for exactly this reason). With an LRU cap of
four, an actor spanning five centuries can never be drawn complete
(finding 9). Pinning what an open card needs fixes it.

**Easy to add features and categories.** I2 improves this: nine literals
become one column table and one decoder by name. Adding a kind is a registry
row plus a `SPINE_COLUMNS` row - and, after I3, a `CORE_COLUMNS` row, which
the brief should say. Adding a category is an edit to `data/categories.json`
*provided* the vocabulary tables in the file are allowed to come from data
(finding 8): the I2 brief says they never do and then lists `region`, which
does.

**Contributors without coding, and finding the right node.** The picker
already reads the search shard; that stays. What I4 breaks as written is
`findSimilar` (title and aliases, which `tests/search-shard.test.mjs:113`
pins to the spine) and rule 21 in the browser (finding 2). The fix keeps the
promise: the writer pages load the core first and every attribute shard
after, and say "still loading the corpus" until the rules can run whole.

**Straightforward review and cataloguing.** I5 is right and overdue; the
history key for edges is the one hole (finding 10). I7 is the tool the
review workflow has been missing since decision 3; its history-after-rename
gap (finding 13) would make a rename look, in the dashboard, like a record
written yesterday.

**Robust, few bugs.** The strongest part of the plan: no record changes,
`--index` gates every run, prerendered pages byte-identical through I5, one
generation number per run. The weak part is the tests it names as
"unedited": `spine-loader.test.mjs` is a surface test, not a deep-equality
test (it compares keys, order, `extent`, `resolve`, `citationCount` and a
search result), so "if this passes the encoding dropped nothing" is not
true; and its line 227 asserts `spine.schema === 1`, which I2 changes.
Finding 7 gives I2 a real oracle: the nine literals it deletes.

**Data portable if the spine is restructured.** Untouched, and the cycle is
built around it. The narrower question the owner asked - is a positional-row
index with integer vocabularies still portable - has a good answer *because
of* two sentences in the I2 brief: the file carries its own `columns` (slot
names per kind) and its own `vocab` (the string lists), so a reuser rebuilds
objects with a ten-line loop and never needs `src/`. That must survive into
the core file of I3 (it does: "schema, ids, vocab, columns, the lists") and
`ARCHITECTURE.md` should print the loop. What would close the door is a
vocabulary integer whose meaning lives only in `src/vocab.js` - finding 8 -
or a column whose name is not the record field's name.

**Hard constraints.** No runtime dependency, no build step beyond
`tools/`, no map library, no database. No generated historical claim: I8's
relations and names are imports quoting a source under the 5 September
exception with `origin`, `draft` and `imported-facts`; I9 writes no record.
The NC hole widens from a directory to an origin (I8) and the three places
it is stated are named. One licence point the brief should make explicit: a
`succeeded` relation's `when` is copied from the split table, which was
itself cut from CShapes' own entity dates - that is why it is NC-derived,
and the reviewer who later hand-writes the same fact from another source may
retract the draft and write a CC BY-SA one.

## 3. Findings, most serious first

Each: what breaks, where, and the amendment as a sentence. `OWNER` marks a
decision the owner should take, with my recommendation.

### 1. I2's "Done when" cannot be met by I2's own rules (I2)

I2 says "No field dropped" and then requires "the built spine on the real
data under 60 KB raw, and at 10^4 under 2.0 MB raw and 320 KB gzipped".
Those are the plan's numbers for **the core** (section 0, row 3: "the core: 50.0 /
11.9 KB"); the same rows with every field kept are the core *plus* the
attributes row, 50.0 + 116.2 = **166.2 KB** on the real data and 1,810.6 +
2,387.6 = **4.2 MB** at 10^4. A run that follows the brief fails its own
gate; a run that meets the gate has dropped fields and made I3 moot.
*Amendment:* I2's targets become <= 175 KB raw on the real data and <= 4.3 MB
raw / <= 460 KB gzipped at 10^4 - the sum of the plan's two measured rows -
and the 60 KB / 2.0 MB numbers are I3's and I4's alone.

### 2. The writer pages cannot run on "the core and no shards" (I3, I4)

`contribute.html` and `review.html` are whole-universe readers, which
plan-review finding 1 already said of the first spine. Concretely:
- rule 21 (`wikidata` unique across the atlas) reads `entry.wikidata` off
  every topology row (`src/validate/rules.js:270`, `claimants`); I3 puts
  `wikidata` in the attribute shards;
- `findSimilar` reads `title` and `aliases`, and
  `tests/search-shard.test.mjs:113` ("what findSimilar reads is in the spine,
  not only in the shard") pins that; the core has neither title;
- rules 17 and the `actor-unused` / referrer warnings read
  `topology.presences` (`rules.js:281-291, 341`); `src/review/main.js:87-116`
  builds its topology from `expandSpine(spine)` with `presences:
  expanded.presences`, and I1 takes them out of the spine without touching
  that file (see also finding 5);
- the rules that compare intervals of *other* records (`actor-outside-when`,
  `child-outside-parent`, rule 26's overlap) read `when` objects through
  `whenOf`, not year bounds.
So the review editor would warn on every keystroke about things the CLI does
not, and the form would file a duplicate as new.
*Amendment (I1):* `src/review/main.js` and `src/contribute/main.js` fetch
`manifest.files.presences` when the manifest names it and put the list on
the topology they hand to `checkRules`; the page draws first and the
universe is rebuilt when it lands.
*Amendment (I4):* the two writer pages load the core, draw, then fetch every
attribute shard in year order and hold them (exempt from the LRU cap);
`checkRules` and `findSimilar` run against the universe only once every
shard is in, and until then the form and the editor say "still loading the
corpus" beside the rule output rather than reporting on half of it. The
Done-when line "under 2.0 MB before they draw" stays true; the line "and no
shard" goes.

### 3. `revised` leaves the core and `?v=` breaks (I3, I4)

`record(kind, id)` reads `revised` off the index entry to ask for
`<id>.json?v=<revised>` (`src/data.js:218-220`); the atlas's own cache
correctness rests on it, and `tests/spine-pages.test.mjs:189-200` asserts the
query on every record fetch. I3 lists `revised` among the attributes. A card
opened from `?selected=<id>` in a century whose shard has not landed fetches
the record without `?v=` and may draw a stale copy for the rest of the
session.
*Amendment (I3):* `record()` awaits the record's own attribute shard (one
request, cached, never a second) before it fetches the file, so `?v=` is
always what the index says; the alternative - `revised` in the core at
~11 B a record - is rejected because the core is what every page parses and
a card is one record. A test: a record fetched before its shard is asked
for with `?v=`.

### 4. The sharding key is undefined for half the kinds (I3)

"A record is filed in the shard its start year falls in." An edge has no
`when` at all; a place has none; an office may carry `when: null` (all nine
do); a narrative has `window`; a source is not in the spine. As written,
every edge's `revised`, every place's `name`/`names`/`where`, and every
office go into the `null` shard "fetched with the first one" - at 10^4 that
is 470 KB of places and 40,000 edge rows in the file that is always fetched,
which is the split failing quietly. `src/explanations.js:52-55` already
answers the edge case (`periodOfEdge`: the century the *cause* begins in).
*Amendment:* a per-kind key table in the brief and in `CORE_COLUMNS`'s
module: event -> `when.start`; edge -> `periodOfEdge` (its `from` event's
start); actor, relation, tenure, presence -> `when.start`, null where `when`
is null; office -> `when.start`, null where `when` is null; narrative ->
`window.from`; **place -> a single per-kind shard `attributes-place-<hash>`**
(a place has no year and every event points at one); and a record whose key
is null goes in the `null` shard. The same table is I5's (finding 10), so
the two briefs cite one function, `attributePeriod(kind, record, events)`,
beside `periodOfEdge`.

### 5. I1's presences vanish from every atlas the tests build (I1)

`tests/helpers.mjs:63-68` `atlasOf(dir)` reads the spine and the sources
index off disk and passes `fetchJson: refuse`; every card suite, the lens
suite, `spine-loader.test.mjs` and the bench's `realAtlas()` go through it or
through `loadAtlas`. After I1, `atlas.loadPresences()` rejects in every one
of them, so `presencesByActor`, `dependenciesOf` and `presencesAt` are empty
for the whole suite - and `spine-loader.test.mjs:71` compares the
`presences` map's keys against the topology's and **fails on I1's own
commit**, which the brief forbids editing except for `SURFACE`.
*Amendment:* `tests/helpers.mjs` gains `presencesOnDisk(dataDir)` beside
`citersOnDisk` and `atlasOf` seeds them, exactly as the citers are seeded;
the brief names `tests/helpers.mjs` among the hand tables; the "unedited
except for `SURFACE`" clause stands for `spine-loader.test.mjs` itself.
`tests/bench/run.mjs`'s `presences` case awaits `atlas.loadPresences()`
through a `fetchJson` that reads disk (it already does at :712).

### 6. I1 removes a file M30b-2 is told is "already loaded at first paint" (I1, M30b)

`docs/m30b-brief.md` A8: a `regional` event "washes the polygons of its
`region` from `data/geo/regions.json`, which is already loaded at first
paint". Two things: `loadAtlas` today keeps only the boxes and discards the
polygons (`src/data.js:690-694`, "the polygons are not kept"), so M30b-2 has
to keep or re-fetch them either way; and I1's D2 stops the fetch. I1 gates
on `M30b done`, so whatever M30b-2 wrote is on `m0` when I1 starts.
*Amendment (I1):* the polygons become an on-demand load,
`atlas.loadRegionPolygons()`, one request, cached, a rejection dropped, asked
for by the wash layer only when a large event is in the window and by nothing
at first paint; the brief's browser test that `index.html` no longer requests
`geo/regions.json` is asserted on the default window, and a second test opens
a window holding a `regional` fixture event and asserts one request. D2 also
reverses health-plan decision 8 and plan-review finding 11 ("region boxes
derived at load from `data/geo/regions.json`"); the plan should say so and
why - finding 11's reason was that two branches rebuilding the hashed index
cannot merge, and H9's R2/R12 removed the index from every branch but `main`.

### 7. I2's safety net is not the test it is described as, and one line of it must change (I2)

`tests/spine-loader.test.mjs` compares map keys and order (:71-77), the
edge tuple's six fields (:83-96), `resolve` (:116-134), `citationCount`
(:139-151) and a search result (:156-183). It would pass if I2 dropped
`wikipedia`, a relation's `note`, a presence's `capital` or an actor line's
`note`. And :227 asserts `first.spine.schema === 1`, which I2's section 3 changes to
3 - the brief's "not edited" fails on the run's own commit. The round trip
the brief proposes - `topologyFromSpine(buildSpine(t))` deep-equals `t` - is
false today too: the topology carries `regionMethod`, `presenceType`, the
sources whole and their `citations`, and a tombstone is trimmed to
`TOMBSTONE_KEYS`.
*Amendment:* I2's first commit moves the nine object literals of
`buildSpine` (`src/validate/core.js:668-755`) into `tests/spine.test.mjs`
as the oracle `projectV1(topology)` - unchanged, tombstones through
`spineEntry` - and the round-trip test is `topologyFromSpine(buildSpine(t))`
deep-equals `projectV1(t)` per kind, over the fixtures and the repository.
`spine-loader.test.mjs` is edited at :227 only (the generation number) and
the brief says so.

### 8. Vocabularies "never from the data" - but `region` and `category` are data (I2)

I2 section 1: the vocab lists "come from `src/vocab.js` and `src/kinds.js` and never
from what the data happens to contain", and the same sentence lists
`region` ("the lane ids, from `regions.json`") and office `category` while
leaving out an event's `category`, which is `data/categories.json` and the
third consideration's own example. A value outside the list (a category the
validator only *warns* about) has nowhere to go.
*Amendment:* the file carries its own `vocab` and the decoder reads it, so
provenance of the list is a build-time matter: closed-in-code lists in
`vocab.js` order; data-defined lists (`region`, event `category`) in their
data file's order; any value met that is in no list is appended in
first-seen order (records are in id order, so the result is deterministic
and the existing determinism test holds). A test: a record carrying an
unknown category round-trips.

### 9. The unwindowed lists against an LRU cap of four (I3, I4)

`eventsByActor` and `eventsByPlace` are built over every active event with
the role and the note (`src/data.js:237-248`); the actor card, the place
card and `entryHtml` (`src/entry/entry.js` reads `atlas.eventsByActor`,
`eventsByPlace`, `relationsByActor`) print title and role per row. With
titles and roles in century shards and a cap of four, an actor whose events
span five centuries is drawn incomplete for ever: the fifth shard evicts the
first, the redraw asks for the first again. This is the reason h3a-brief A4
cancelled period shards, and the plan's risk 4 answers it only for the
*joins*.
*Amendment (I3):* the cap counts shards nothing holds; a shard an open card,
an entry page or a lens needs is pinned while it is on screen, and the
constant's comment says so. *Amendment (I4):* `entry.html` fetches the
shards of every century its lists span, not "the one shard that record's
year falls in"; the actor and place cards request the shards their lists
need and redraw as each lands. And I3 prints the search shard's bytes beside
the core's (section 2 above).

### 10. I5's history key has the same hole, and one false assumption (I5)

Histories are one per record for every kind but presence
(`tools/build-index.mjs:214-218`): 20,000 events, 39,996 edges, 500 actors,
1,750 places, 200 sources at 10^4. "Filed by the century its own start year
falls in": an edge has none, a place has none, a source has none. As
written, `history-edge-null-<hash>.json` holds two thirds of the corpus's
histories in one file a reviewer fetches to open one edge - the shape the
brief exists to remove.
*Amendment:* I5 files by the same `attributePeriod` table as I3 (finding 4),
with `source -> null` and `place -> per kind`; the brief's "under 100 files"
holds either way. Also: "the deploy allowlist ... must still name the
histories under their new names" is not so - `deploy.yml:97` copies
`data/.` whole and `tests/workflows.test.mjs:176-183` names no history line;
strike it, nothing to edit there.

### 11. I6's diagnosis of the graph's notch does not fit the numbers (I6)

The brief: the graph pays 280 ms a notch "because `graph-view.js:559` keys
its stacking on the raw `k`" where the map pays 12 ms on `zoomBucket(k)`.
But a wheel notch is x1.16 (`graph-view.js:384`) and a bucket is x1.044
(16 an octave), so consecutive notches never share a bucket; bucketing buys
the return trip and the trackpad's small deltas, nothing on the forward
sweep the review measured (ten notches, 5.3 s). The map's 12 ms is grid
clustering plus a **culled DOM**; the graph's cost is `stackLayout` over the
whole-window arrangement (12,000 nodes, `clusterPoints` per lane) *plus*
`replaceChildren` of 1,605 nodes and 7,454 lines. The bench case the brief
asks for - `stackLayout` on a twenty-year band, raw vs bucketed - measures
neither: the cache is in `graph-view.js`, not in `layout.js`, and the band is
not the window the review measured.
*Amendment:* the run measures first - `stackLayout` on the whole-window
arrangement at 10^4 in the bench, and in the browser the split between
stacking and DOM on one notch - and writes both in `STATUS.md`; it still
buckets (cheap, correct, and the exemption is stated), and the cull is the
change expected to move the number; `edgesGroup` keeps a line when either
end is on screen; the "ten notches under a second" target is a `STATUS.md`
number, never a test.

### 12. I6's line numbers and shared cache will have moved by the time it runs (I6)

M30b-2 (A7) inserts `collapse.js` "between `layoutGraph` and `stackLayout`,
sharing the existing `${laidFor}|${k}|${holdingKey(s)}` cache", and adds a
bracket and a band layer to `timeline.js` under `reuse`. I6 cites
`graph-view.js:77-99, :540-575, :559` and `timeline.js:554-600` from a tree
before that.
*Amendment:* the brief's line references are "as of `8f51af7`; find them by
name after M30b" and the stacking key includes whatever M30b-2 put in the
same cache; the timeline change must hand the new layers' children back
through `reuse` or `tests/timeline-browser.test.mjs:150-208` fails.

### 13. A renamed record loses its history (I7)

`tools/lib/history.mjs:70-81` runs `git log --name-only --diff-filter=AM`
with git's default rename detection, so the commit that renames
`old.json -> new.json` lists the file as `R` and is filtered out; the new
path's states begin at the next edit, `pathOf(record)` (:147) looks up the
new path only, and the record falls to `from: 'revised'` - in the dashboard
a rename reads as "written once, never touched". After I7 that is every
corrected id.
*Amendment (I7):* `recordHistories` also asks for `<kind dir>/<alias>.json`
for every alias of the record (an alias is a former id and the file it lived
under is derivable), merging those states before the current path's; a test
in `tests/migrate-ids.test.mjs` renames a fixture record on a scratch clone
with two commits and asserts the versions before the rename are still
listed.

### 14. Renaming an import-owned actor conflicts with the import (I7)

A CShapes actor's presences are `<actor>-<year>` and the actor id is a
value in `data/imports/cshapes-actors.json`; the brief rewrites the map's
values but not the presence ids, and the next `--import` re-derives both from
the map, writing `new-id-1937` beside a stale `old-id-1937` it still owns.
`CLAUDE.md` already says a territory is corrected in the map file and never
by hand.
*Amendment:* the tool refuses to rename a record whose `origin.tool` is in
`IMPORT_TOOLS` and prints the sentence from `CLAUDE.md` ("correcting a
territory is an edit to `data/imports/cshapes-actors.json` and a re-run"); a
Wikidata-created record is refused for the same reason (its id came from
`idFor`). A test per refusal. **OWNER** - recommended: refuse.

### 15. I8, four things to state and one to check (I8)

- The `when` shape is unstated: a succession is a moment, so `when: { start:
  <year>, end: <year>, date: "<split.from>" }` - the brief says "in the shape
  rule 15 wants" and a run would read rule 15 to find out; say it.
- The count is "check, do not assume": `grep -c '"splits"'` gives 79 entries
  with a `splits` key on `origin/m0`; the plan says 77.
- The Cuba entry's own note says the split date is "earlier than its first
  independent date" and that the occupation is "the state's own record": a
  relation dated 1898-12-10 is exactly the kind of claim the reviewer must
  see the note beside. The brief copies the note; make it the rule that the
  note is *always* copied when the entry has one, and that a reviewer may
  retract a draft relation and write a CC BY-SA one from another source.
- Rule 12's NC clause is `r.kind === 'actor'` (`src/validate/rules.js:926`)
  and `KIND.relation.licenses` is `['CC-BY-SA-4.0']` (`src/kinds.js:196`);
  both change, and `tests/licensing.test.mjs` holds `kinds.js`,
  `data/LICENSE` and the manifest together. `LICENSES['CC-BY-NC-SA-4.0']
  .attribution` is CShapes by name (`src/licensing.js:34`), which is right
  while `NC_ORIGINS` is one entry.
- Relations have no card: the actor card prints the attribution line once if
  any relation it draws is NC-licensed, and the entry page likewise.
- `namesFor(read)` (`tools/import/wikidata.mjs:460-470`) folds labels and
  article titles and **not the item's aliases**; the brief's "label and
  aliases" is a new helper, deduplicated with `foldName` against `title` and
  itself, and writing **no `names` key at all** when the list is empty (rule
  18 refuses an empty list). `LANGUAGES` is a constant in `wikidata.mjs:68`,
  not "the languages the seeds file names".

### 16. `?walk=<session id>` is a link that lies, and it pre-empts M35 (I9)

I9 section 1: the walk is "the session's", `?walk=<id>` names it "within the
session so a state write survives a redraw", and "a link copied into another
session finds no walk under that id and falls back to the selection". A URL
the atlas writes is a promise about what the reader saw; one that means
nothing elsewhere is the first such promise the project would break. And the
grammar of a generated walk's address is M35's decision (M30a A14 gave
`?why=` to M35; I9 says so itself). The producer is deterministic - the
brief's own test says two calls answer the same walk - so the honest address
is its *inputs*, which is what `?why=<id>` will be.
*Amendment:* I9 writes `src/walk.js` (pure), the provenance object, the
store's `setWalk(walk)` and the card's line, and the documents; **nothing
writes `?walk=`** and `state.js` keeps it parsed-and-reserved exactly as
today; the browser test sets a walk through the store. Also: `rankByCost` is
in `src/horizon.js:65`, not `graph.js`; and "229 events already carry
`place: null`" are placeless events, not conditions - `CONTRIBUTING.md`
should not conflate the two. **OWNER** - recommended: no URL parameter in I9.

### 17. The generation guard must live in the loaders, not in `createAtlas` (I1)

Tests hand `createAtlas`/`createAtlasFromSpine` hand-made manifests with
`schema: 1` (`tests/spine-loader.test.mjs:242`, `tests/data.test.mjs` "an
empty dataset", and others). A guard in `createAtlas` throws on all of them
after I1; a guard in `loadAtlas` only misses `review/main.js`, which fetches
the spine itself (:87).
*Amendment:* the guard is one exported `assertGeneration(manifest)` in
`src/data.js`, called by `loadAtlas`, `loadSpine`, `loadSources`,
`loadNarratives` and `src/review/main.js`, never by `createAtlas`; the
fixture manifest and every test literal that builds a manifest are bumped
in the same commit (`grep -rn "schema: 1, files" tests/` is the list).

### 18. "First-paint index bytes under 290 KB raw" is ambiguous and the honest reading fails (I1)

The spine without presences is 269.4 KB by the plan's own table (section 0, row 2);
manifest 21.9 (+0.2 for the boxes) and sources 33.7 make **325 KB** of index
at first paint. The plan's budget table counts the spine alone.
*Amendment:* "the graph file alone under 290 KB raw, and the whole first
paint - manifest, spine, sources, land and palette - under 460 KB raw, both
in `STATUS.md` against 542.9 and 949.6".

### 19. "An atlas deep-equals an atlas" cannot be asserted (I3, I4)

An atlas is an object of Maps and closures; `assert.deepEqual` on two of
them compares function identity and fails. `spine-loader.test.mjs` compares a
surface for this reason.
*Amendment:* `tests/core-loader.test.mjs` asserts the `SURFACE` list, then
for every Map in it the same keys in the same order and `deepEqual` of the
values record by record, then `extent`, `regions`, the adjacency's edge ids
and the five graph queries on every event - that is the deep test the spine
never had.

### 20. D7 misdescribes what the prerender reads, and I4 must say how the build assembles it (I4)

`tools/lib/prerender.mjs:92-117` reads `atlas.sources` and `atlas.resolve`
*and* hands `narrativesHtml` the expanded events and edges (titles, `when`)
and `entryHtml` the whole atlas (`eventsByActor`, `eventsByPlace`,
`relationsByActor`, `narrativesByRef`, `regions`). `tools/build-index.mjs
:294-309` builds that atlas with `createAtlasFromSpine` and `expandSpine`
over the spine text it has just produced.
*Amendment (I4):* when the spine file stops being written, the build keeps
assembling the prerender atlas from `buildSpine(topology)` in memory -
which is why `buildSpine` stays - so byte-identity of the pages remains a
check on the *definition* and I3's `CORE union ATTRIBUTE = SPINE` test carries it
to the files; D7's sentence is corrected in the plan.

### 21. Cards must not draw the core's fallbacks (I3, I4)

I3: "a title falls back to the id, `citesCount` to 0, `when` to the core's
bounds"; I4: "no fallback text that could be mistaken for data". A card that
prints "0 sources" or a year computed from an astronomical bound is the
second sentence broken by the first; the record's own numbering (`when.date`,
`calendar`, a BCE year) is in the shard.
*Amendment:* the three views draw from the core (a bar, a mark, a node, with
no label until the shard lands); a card, an entry page and the search box's
result rows draw only from a shard that has landed, and a card whose shard is
in flight shows the same "loading" line the source card shows for its
citers. `attributesLoaded(id)` is what decides.

### 22. `null` versus absent in a trimmed row (I2)

The spine writes `place: null`, `supersededBy: null`, `note: null` and omits
`parent`, `scope`, `category`, `subtreeWeight`, `wikidata`, `wikipedia`.
"Trailing `null`s trimmed" decodes both to the same thing unless the column
table says which; the oracle of finding 7 will catch it, but the run should
not discover the rule by failing.
*Amendment:* `SPINE_COLUMNS` carries, per slot, the value an absent slot
decodes to (`null` or "no key"), and the decoder applies it.

### 23. I4 is two runs (plan section 5, I4)

I4 moves five pages, adds shard-arrival to three view keys and the panel,
adds the LRU pinning of finding 9, teaches the writer pages to hold every
shard (finding 2), removes the spine, rewrites the index section and "Scale,
for the record", and measures four pages in a browser at 10^4. H3b moved
five pages in one run with none of the rest.
*Amendment:* I4a - `index.html` and `entry.html`, the render keys, the panel,
the pinning; done line `I4a done`. I4b - `contribute.html`, `review.html`,
`narratives.html`, the spine removed, `ARCHITECTURE.md`, the measurements;
`I4b done` then `I4 done`. `manifest.schema` goes to 5 in I4b.
**OWNER** - recommended: split.

### 24. Smaller corrections

- I1: `manifest.schema` becomes 2 but the spine's inner `schema` stays 1
  until I2 makes it 3; say from I1 on that the graph file's inner number is
  the manifest's, so there is one number.
- I1: `manifestValue.counts` lists `presences` today; it stays (a count is
  not a file), and the brief's hand-table line should say so rather than
  imply it moves.
- I2: "`aliases: []` and `supersededBy: null` are on all 1,703 spine
  entries" - 17 carry a `supersededBy`; the merges list carries them; the
  edge tuple written whole for an aliased edge (`edgeInSpine`) folds into the
  same list, which the brief says.
- I3: `HASHED` is one regex (`tools/build-index.mjs:44`); `core-`,
  `attributes-<from>-<to>-` (with a minus sign allowed, as `explanations-`)
  and `attributes-null-`/`attributes-place-` all have to match it and the
  brief should give the regex rather than "learns both names".
- I5: the two `HISTORY_DIR` special cases are in `readIndex` (:339) and
  `writeIndex` (:382), and `compareIndex` has none; correct.
- I6: `coreZoom` is a field on a cluster (`src/cluster.js:211`,
  `layout.js:413`), not an export; `tests/timeline.test.mjs` does not exist
  (`lanes.test.mjs` and `timeline-scale.test.mjs` do).
- I7: `tools/migrate/` already holds `led-to-tenures.mjs` beside `apply.mjs`
  (M30a-2), so "and nothing else" is stale; the new tool's natural home is
  `tools/migrate/ids.mjs` beside it, or `tools/migrate-ids.mjs` beside
  `migrate-places.mjs` - pick one and name it in `CLAUDE.md`.
- I8: `tests/validate-cli.test.mjs:20` asserts "54 records, 3 regions: 0
  error(s), 54 warning(s)" on the fixtures; the two fixture records move it
  and the brief says to restate rather than loosen - good.
- Plan section 0: "`review-*.json`, 9 files" is ten (the summary and nine kinds).
- Plan section 5 item 6: I6 "could run in parallel on a side branch" - the run
  protocol's section 1 says never work on another branch; strike the clause.

## 4. What is sound, and should not be touched by the amendments

- **D1 and the presence file.** The interval index (`data.js:461-492`) is
  what makes `presencesAt` 0.07 ms; keeping the file whole and the index
  built when it lands is right, and the manifest-driven `presenceCoverage`
  staying put means the window's far end never moves while a file is in
  flight. The brief says this precisely.
- **D3's shape.** Rows over an id table with the vocabularies in the file
  is the same idea as the edge tuple, which has been read both ways since
  H3a, and `columns` in the file is what keeps it portable. The order of the
  id table is stated once and pinned by a test that exists.
- **D4/D5's gate.** I3 emits beside and prints; I4 waits for a number. This
  is H3a -> H3b -> H3c, which worked, and it means a bad measurement ends the
  cycle at I2 with the tree whole.
- **D6.** One generation per run, in the manifest and the file; a chain step
  is refused for the right reason.
- **D7 as a gate** (with finding 20's correction of what it reads).
- **D8 and owner question 5.** Hashed shards, named in the manifest, by kind
  and period - with finding 10's key.
- **D10.** Deriving the row cap from the pane is the only answer that keeps
  the request "the timeline fits its pane" true; the explicit `lanes` list
  overflowing by design is correctly the one exception.
- **D11's cascade** and its terminating rule ("an id is only ever rewritten
  once"); the alias on every renamed edge; `revised` written and nothing
  else.
- **D12's refusal to draft by hand**, and the `draft`-only, absent-only,
  `imported-names` shape of the fill.
- **D13's refusal of a `generated` origin** - a walk is not a record.
- **The never-wait discipline** as the rule, `attributesLoaded(id)` as the
  way a view tells "no title" from "no title yet", and one integer (shards
  arrived) in every render key.
- **"Not one record under `data/` changes shape in this cycle."** True of
  I1-I7 and I9; I8 adds records and is late for that reason.

## 5. Owner questions, consolidated

The plan's six, then four the review adds. Each with the recommendation the
briefs should implement unless overruled.

1. The lane cap - **derive from the pane** (D10).
2. Git-derived history in the artifact - **yes, sharded** (D8).
3. Wikidata `names` on records it did not create - **yes, `draft` only,
   absent only, `imported-names` flagged**.
4. Licence of a relation derived from the split table - **the NC exception
   follows `origin.tool`**, stated in `kinds.js`, `data/LICENSE` and the
   manifest, and the relation's `note` carries the entry's own caveat.
5. History shards hashed - **yes**.
6. A bar or a mark before its title - **yes**; a card never (finding 21).
7. **I4 as two runs** - yes (finding 23).
8. **Titles: attribute shards, or the whole-corpus label file the search
   shard already is?** - this cycle, the shards, with the search shard's
   bytes printed beside the core so the next decision is against a number.
9. **`?walk=` in I9** - no; the producer, the provenance and the line, and
   the address is M35's (finding 16).
10. **Renaming an import-owned record** - refused by the tool; the map file
    and a re-run are the way (finding 14).

## 6. Verdict

**Proceed with the amendments.** Decisions D1-D13 stand. The amendments to
I2, I3 and I4 are corrections of what the briefs say a run must measure,
which pages read which fields, and which tests change - not of the shape.
I6 needs a measurement before its diagnosis is written into `STATUS.md`. I9
should not write a URL parameter. With those, a run on Opus working alone
from each brief has a "Done when" it can meet and a test list that is green
on its own commit.

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

### index2-plan.md

A0. **The measurements stand and were reproduced to the byte** (the
per-kind split of the spine; 1,027 history files; 1,077 index files;
`review-*` is ten files, not nine). Every brief keeps citing section 0.

A1. **D2 reverses health-plan decision 8 and plan-review finding 11**, which
put the region boxes at load rather than in the manifest because two
branches rebuilding the hashed index could not merge. H9's R2/R12 took the
index off every branch but `main`, so the reason is gone; the plan says so
in D2. The polygons themselves stay reachable on demand for M30b-2's
regional wash (I1 A4).

A2. **D7 corrected:** `tools/lib/prerender.mjs` reads `atlas.sources`,
`atlas.resolve`, the expanded events and edges (title, `when`) for
`narrativesHtml`, and the whole atlas for `entryHtml`. Byte-identity of the
pages therefore checks the whole projection, which is more than the plan
claimed and is why the build keeps assembling the prerender atlas from
`buildSpine(topology)` in memory after I4 (I4 A5).

A3. **section 3 says two things it left out.** At 10^5 the core is ~10 MB raw by
the plan's own projection - what the spine is at 2x10^4 today - so the
cycle buys ~5x and the lever after it is outside "plain JSON, no build step"
and is a new decision. And the search shard is a whole-corpus file every
`index.html` parses (171 KB today, 2.75 MB at 10^4); it is excluded from
the first-paint budget because it is never waited for, and I3 prints its
bytes beside the core's so the next decision is taken against a number.

A4. **section 5 is ten runs, not nine:** I4 splits into I4a (`index.html`,
`entry.html`, the render keys, the panel, the shard pinning) and I4b
(`contribute.html`, `review.html`, `narratives.html`, the spine removed,
`ARCHITECTURE.md`, the browser measurements). `manifest.schema` goes to 5 in
I4b. Owner question 7, answered: split.

A5. **section 5 item 6:** strike "could run in parallel on a side branch" - run
protocol section 1 forbids it. I6 runs after I5 on `m0`.

A6. **section 6 risk 4 is wider than the joins.** The unwindowed readers also
print titles and roles (the actor card, the place card, the entry pages),
so the shards an open card, entry or lens needs are pinned outside the LRU
cap (I3 A5) and `entry.html` fetches every century its lists span (I4 A3).

A7. **section 7 gains four questions**, answered as recommended: 7 - I4 as two
runs (yes); 8 - titles in the attribute shards this cycle, the search
shard measured beside the core (yes); 9 - no `?walk=` written in I9, the
address is M35's (yes); 10 - the rename tool refuses a record an import
created (yes).

A8. **The sharding key is one table, used three times:** `attributePeriod
(kind, record, events)` beside `periodOfEdge` in `src/explanations.js` -
event by `when.start`; edge by its `from` event's start (`periodOfEdge`);
actor, relation, tenure, presence by `when.start` (null where `when` is
null); office by `when.start` (null where null); narrative by
`window.from`; place by kind, one shard; source by kind, one shard (I5
only); a null key is the `null` shard. I3's attribute shards and I5's
history shards both file by it; the explanation shards already do for
edges.

### i1-brief.md

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

### i2-brief.md

A0. **Gate and reading unchanged**, plus I1's amendments.

A1. **The byte targets are the plan's two rows added together**, because
this run drops no field: the built spine on the real data under **175 KB
raw** and at 10^4 under **4.3 MB raw / 460 KB gzipped**. The 60 KB and
2.0 MB figures are I3's core and I4's gate, not this run's.

A2. **The nine literals become the oracle, not a deletion.** The first
commit moves the object literals of `buildSpine`
(`src/validate/core.js:668-755`) into `tests/spine.test.mjs` as
`projectV1(topology)`, unchanged, tombstones through `spineEntry`; the
round-trip test is `topologyFromSpine(buildSpine(t))` deep-equals
`projectV1(t)` per kind, over the fixtures and the repository. "Deep-equals
`t`" in the body is wrong: the topology carries `regionMethod`,
`presenceType`, the sources and their citations, and trims nothing.

A3. **`tests/spine-loader.test.mjs` is edited at one line**, `:227`, the
generation number; nothing else in it changes. It is a surface test (keys,
order, `extent`, `resolve`, `citationCount`, a search result) and A2 is the
deep one.

A4. **Vocabularies in the file, from three sources.** The decoder reads
`spine.vocab` and never a copy. At build time a closed-in-code list comes
from `src/vocab.js` / `src/kinds.js` in that order; a data-defined list
(`region` from `regions.json`, an event's `category` from
`categories.json`) in the data file's order; a value met in a record that is
in no list is appended in first-seen order, which is deterministic because
the records are in id order. An event's `category` is a vocabulary slot; a
test round-trips a record with a category the file does not list.

A5. **Absent and `null` are decided per slot.** `SPINE_COLUMNS` says for
every slot what a trimmed or `null` slot decodes to - `null` for `place`,
`supersededBy`, `note`, `startedBy`, `capital`, `dependencyOf`,
`dependencyKind`, `when` on an office; **no key** for `parent`, `scope`,
`category`, `subtreeWeight`, `wikidata`, `wikipedia` - so A2's oracle holds
without the run discovering the rule by failing.

A6. **Seventeen entries carry `supersededBy`** on the real data (the body
says none); the merges list carries them and the whole-object edge of
`edgeInSpine` folds into it, as the body says.

### i3-brief.md

A0. **Gate and reading unchanged**, plus plan A8 and I2's amendments.

A1. **The filing key is plan A8's table**, implemented once as
`attributePeriod(kind, record, events)` beside `periodOfEdge`; places are one
shard `attributes-place-<hash>.json`, offices with `when: null` and anything
else with a null key are the `null` shard. Without this every edge's
`revised` and every place go into the always-fetched shard.

A2. **`record()` waits for the record's own shard.** `src/data.js:218`
reads `revised` to build `?v=`; with `revised` in the shards, `record(kind,
id)` first awaits `loadAttributes` of the record's shard (one request,
cached), then fetches the file with `?v=`. A test: a record asked for
before its shard is still fetched with `?v=<revised>`.
`tests/spine-pages.test.mjs:189-200` must stay green through I4.

A3. **Cards draw nothing from a fallback.** `createAtlasFromCore`'s
fallbacks (title -> id, `citesCount` -> 0, `when` -> bounds) are for the three
views only; a card, an entry page and a search result row read a shard that
has landed or show the "loading" line the source card shows for citers.
`attributesLoaded(id)` decides, and the panel's key carries the shard
count (I4).

A4. **`HASHED` is given, not described:**
`/^(?:(?:spine|search|sources|review|presences|core)-(?:[a-z]+-)?|(?:explanations|attributes)-(?:-?\d+--?\d+|null|[a-z]+)-)[0-9a-f]{12}\.json$/`
or equivalent, with a test that every file the build names matches it and
nothing a record could be named does.

A5. **The LRU cap counts unpinned shards.** A shard an open card, an entry
page or a lens needs is pinned while it is on screen and never evicted; the
constant is four *unpinned* shards and the comment says why (h3a-brief A4:
the cards are per-entity and not windowed). The LRU test adds: five pinned
shards are all held.

A6. **The report prints the search shard too**, beside the core and the
attribute shards, and `STATUS.md` names it as the next whole-corpus file
with its bytes on both datasets.

A7. **The test is a surface plus per-record deep equality**, not
"deep-equals an atlas": `tests/core-loader.test.mjs` asserts the `SURFACE`
list, then for each Map the same keys in the same order and `deepEqual` of
every value, then `extent`, `regions`, the adjacency's edge ids, and
`consequences`, `ancestors`, `convergence`, `reachableBy` and
`shortestPaths` on every active event from the core alone against the
spine.

A8. **Writer pages are whole-universe readers** and this run writes that
into `ARCHITECTURE.md` beside the rule about joins: rule 21 (`wikidata`),
`findSimilar` (title, aliases; `tests/search-shard.test.mjs:113`), rules 17
and the referrer warnings (presences), and every rule comparing another
record's `when` read fields that are not in the core, so `contribute.html`
and `review.html` hold every attribute shard (I4b).

### i4-brief.md

A0. **Two runs.** I4a: `index.html`, `entry.html`, the three render keys,
the panel key, the pinning; done line `I4a done`. I4b, gated on it:
`contribute.html`, `review.html`, `narratives.html`, the spine no longer
written, `ARCHITECTURE.md`, the measurements at 10^4; done lines `I4b done`
then `I4 done`. `manifest.schema` becomes 5 in I4b.

A1. **The gate on I3's numbers is unchanged**, with I3 A1-A8 applied.

A2. **The writer pages hold every shard.** `contribute.html` and
`review.html` load the core, draw, then fetch every attribute shard in year
order and hold them pinned; `findSimilar` and `checkRules` run only once
every shard is in, and until then the form and the editor print "still
loading the corpus" beside the rule output rather than a verdict on half of
it. The Done-when line "under 2.0 MB of index before they draw" stands;
"and no shard" goes. The browser test asserts the form finds "Carnation
Revolution" as a duplicate and the editor warns what the CLI warns.

A3. **`entry.html` fetches the centuries its lists span.** `entryHtml` reads
`eventsByActor`, `eventsByPlace`, `relationsByActor` and `narrativesByRef`;
an actor's entry lists events across every century it was in. The page
draws with the core and redraws as each shard lands; the request count
asserted in the rewritten `tests/spine-pages.test.mjs` is "the core once, and
one shard per century the record's lists span".

A4. **Cards, not views, wait** (I3 A3): a card whose shard is in flight
shows the loading line; a bar, a mark and a node are drawn unlabelled and
labelled when the shard lands.

A5. **The build keeps assembling the prerender atlas from
`buildSpine(topology)` in memory** (`tools/build-index.mjs:294-309`), which
is why `buildSpine` stays; the pages therefore stay byte-identical by
construction and I3's `CORE union ATTRIBUTE = SPINE` test is what carries that
to the files. `createAtlasFromSpine` and `expandSpine` stay for the build
and the tests; `loadSpine` and `{ from: 'spine' }` go with the file.

A6. **`review/main.js` fetches the core itself**, as it fetches the spine
today (`:87`), through `assertGeneration`; it is not a `loadAtlas` caller.

### i5-brief.md

A0. **Gate and reading unchanged**, plus plan A8.

A1. **The filing key is plan A8's table** through the same
`attributePeriod`; edges by their `from` event's start (`periodOfEdge`),
places and sources one shard per kind, a null key the `null` shard. As
written every edge history - two thirds of the corpus at 10^4 - would land
in `history-edge-null-<hash>.json`.

A2. **Strike the deploy-allowlist line.** `deploy.yml:97` copies `data/.`
whole and `tests/workflows.test.mjs:176-183` names no history line; there
is nothing to edit and the run should not go looking.

A3. **The special cases are two, not three:** `HISTORY_DIR` in `readIndex`
(`build-index.mjs:339`) and `writeIndex` (`:382`); `compareIndex` has none.
"1,054 files" in the body is H3c's count; today's is 1,077.

### i6-brief.md

A0. **Line numbers are as of `8f51af7`.** M30b-2 puts `collapse.js`
between `layoutGraph` and `stackLayout` sharing the
`${laidFor}|${k}|${holdingKey(s)}` cache (m30b-brief A7) and adds bracket
and band layers to `timeline.js` under `reuse` (A9). Find the code by name;
the stacking key includes whatever M30b-2 put in that cache; the timeline's
new layers still hand their children back through `reuse` or
`tests/timeline-browser.test.mjs:150-208` fails.

A1. **Measure before diagnosing.** A wheel notch is x1.16
(`graph-view.js:384`) and a bucket x1.044, so bucketing makes no
consecutive notch a cache hit; the map's 12 ms is grid clustering plus a
culled DOM. The run's first commit adds to the bench `stackLayout` on the
**whole-window** arrangement at 10^4 (not the twenty-year band) and, in a
browser at 10^4, the split of one notch between stacking and
`replaceChildren`; both go in `STATUS.md` before anything is changed.

A2. **Bucket anyway, and cull.** The key becomes
`${laidFor}|${zoomBucket(k)}|${holdingKey(s)}` with the clicked-stack
exemption as the body says; the cull skips a stack's node element outside
the widened rectangle and keeps a line whenever either end is on screen;
node elements are reused across notches rather than rebuilt where the
existing `reuse` helper allows it. The target "ten notches under a second"
is a `STATUS.md` number and never a test assertion.

A3. **Names corrected:** `coreZoom` is a cluster field
(`src/cluster.js:211`, `layout.js:413`), not an export; `tests/timeline.test.mjs`
does not exist - the pure tests go in `tests/lanes.test.mjs` and a new
`tests/timeline-rows.test.mjs` if the row rule wants a file of its own,
named in `CLAUDE.md` if it is a module.

### i7-brief.md

A0. **Gate and reading unchanged.** `tools/migrate/` holds `apply.mjs` and
`led-to-tenures.mjs` (M30a-2); the new tool is `tools/migrate/ids.mjs`
beside them and `CLAUDE.md` names it there.

A1. **A renamed record keeps its history.** `tools/lib/history.mjs:70-81`
filters `--diff-filter=AM` under git's default rename detection, so the
rename commit is `R` and dropped, and `pathOf` (`:147`) looks up the new
path only: a renamed record falls to `from: 'revised'`. `recordHistories`
also asks for `<kind dir>/<alias>.json` for every alias of the record and
merges those states before the current path's. A test on a scratch clone
with two commits: the versions before the rename are still listed after it.

A2. **Import-owned records are refused.** A record whose `origin.tool` is in
`IMPORT_TOOLS` is not renamed; the tool prints that a territory or an
imported item is corrected in `data/imports/` and by a re-run (`CLAUDE.md`,
"Correcting a territory"). Reason: a CShapes actor's presences are
`<actor>-<year>` and the next `--import` re-derives both from the map. A
test per refusal.

A3. **`data/imports/wikidata-seeds.json` is on the rewrite list** with
`cshapes-actors.json`: its items may name atlas ids. Reading goes through
`tools/lib/read.mjs` (`readImportMaps`); writing back is the tool's, with
the same canonical serialisation the file has.

### i8-brief.md

A0. **Gate and reading unchanged.**

A1. **The relation's `when` is stated:** `{ start: <year of split.from>,
end: <the same year>, date: "<split.from>" }` - a succession is a moment -
checked against rule 15 before the first record is written. The count is
checked, not assumed: `origin/m0` has 79 entries carrying `splits`.

A2. **The entry's `note` is always copied** when there is one, verbatim,
because it is where the split table says a cut is doubtful (Cuba: the split
date is earlier than the state's independence). The reviewer may retract a
draft relation and write a CC BY-SA one from another source; the brief's
`STATUS.md` line says so.

A3. **The three places the licence changes:** `KIND.relation.licenses`
gains `'CC-BY-NC-SA-4.0'` (`src/kinds.js:196`); rule 12's clause `r.kind ===
'actor'` (`src/validate/rules.js:926`) becomes "any kind whose licences
include an NC licence, and only where `mayBeNonCommercial(r)`"; the table
at the head of `data/LICENSE`. `licensingTable()` follows the registry and
`tests/licensing.test.mjs` holds the three together. A relation has no
card: the actor card and the entry page print the attribution line once
when any relation they draw is NC-licensed.

A4. **The `names` fill is a new helper**, not `namesFor` (which folds labels
and article titles and not the item's aliases, `wikidata.mjs:460-470`):
labels and aliases in `LANGUAGES` (`wikidata.mjs:68`, a constant), folded
with `foldName`, deduplicated against `title` and each other, and **no
`names` key written when the list is empty** - rule 18 refuses an empty
list.

### i9-brief.md

A0. **Gate and reading unchanged**, with one name corrected: `rankByCost` is
`src/horizon.js:65`, not `graph.js`.

A1. **Nothing writes `?walk=`.** `state.js` keeps the parameter parsed and
reserved exactly as today; this run adds no session id, no URL write and no
consumer of the parameter. The producer (`src/walk.js`), the provenance
object, the store's `setWalk(walk)` / `clearWalk()`, the chain drawn madder
and the card's line are built and tested - the browser test sets a walk
through the store - and the address of a generated walk is M35's decision
(`?why=<id>`, whose inputs *are* the walk). A URL that means nothing in
another session is a link the atlas would break; the producer is
deterministic, so its address should be its inputs.

A2. **Conditions are not placeless events.** `CONTRIBUTING.md` says an
endpoint may be a condition - a process with no point and often no end -
and that it is written like any other event; it does not cite the 229
events with `place: null` as examples, because a placeless moment is not a
condition.

A3. **Done-when restated:** `src/walk.js` produces a walk from what
`graph.js` answers, with provenance beside it; a walk set through the store
is drawn as a chain and the card says the atlas assembled it; `?walk=`
still parses and formats as today and nothing writes it; the three
documents say what a condition endpoint is; `--index` byte-identical
without a rebuild; `STATUS.md` says M35 has the producer, the provenance
and the wording, and that the URL grammar is M35's; the literal lines
`I9 done` and `Index cycle 2 done`.

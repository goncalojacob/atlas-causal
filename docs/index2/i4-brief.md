# Build brief — I4: the pages read the core, and the spine stops being written

The fourth run of the second index cycle (`docs/index2-plan.md`, decisions D4
and D5). I3 built the core and the attribute shards beside the spine and
measured them; this run moves the five pages over, **one page per commit**,
and then stops writing the whole-corpus file. It is H3b and H3c in one run
because there are five pages and the switch is a parameter.

**This run does not start unless I3's numbers met the threshold in
`docs/index2-plan.md` §3** — the core under 60 KB raw on the real data and
under 2.0 MB raw / 320 KB gzipped at 10⁴. I3's `STATUS.md` entry says
whether they did. If it says they did not, do not run: say so in one line
and stop.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md`, `docs/index2/i3-brief.md` and I3's `STATUS.md` entry,
`docs/health/h3b-brief.md` (the page-at-a-time switch that worked), then
`src/data.js`, `src/main.js`, `src/entry/main.js`, `src/sources/main.js`,
`src/narratives/main.js`, `src/contribute/main.js`, `src/review/main.js`,
`src/panel/*`, `src/timeline.js`, `src/map/layers/events.js`,
`src/graph-view/graph-view.js`, `src/render-key.js`,
`tests/spine-pages.test.mjs`.

## The gate

Wait for the literal line `I3 done` on `origin/m0`. Then claim `I4`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`.
- No historical claim; no record under `data/` touched except `data/index/`;
  no `reviewed` record touched; no migration consumed.
- **No page waits for an attribute shard before it draws.** A view draws what
  the core gives it and redraws when a shard lands. A spinner over the atlas
  while a century is in flight is the failure this discipline exists to
  avoid.
- No fallback text that could be mistaken for data: an event with no title
  yet is drawn without a label, never as "Untitled" or as its id in a place a
  reader would read as a title. `atlas.attributesLoaded(id)` is how a view
  knows which it is.
- The fixtures' index rebuilt with the repository's; `--index`
  byte-identical; `node --test` green with `CHROME` set.

## 1. The order of the commits

One page per commit, each green on its own:

1. **`index.html`** — `src/main.js` loads the core, asks for the shards the
   resolved window needs, and redraws the three views when one lands. The
   window's own shards are requested at load; the rest are requested in year
   order **after** the first paint, so a reader at the whole extent gets the
   picture and then the titles.
2. **`entry.html`** — one record. It takes the core and the one shard that
   record's year falls in, and fetches the record file for its prose as it
   already does. This is the page the review measured at 16 MB at 10⁴.
3. **`contribute.html`** — the core and no shards: the picker reads the
   search shard, and the form validates against the universe the core gives
   it. It asks for a shard only when a picked record's card needs a title it
   does not have.
4. **`review.html`** — the core and no shards: the queue reads the review
   shards, which carry their own digests.
5. **`narratives.html`** — prerendered, and fetches nothing unless the
   fixtures are asked for; when they are, the core and the shards the walk
   crosses.

`sources.html` is untouched: it fetches no graph file at all and must keep
not fetching one.

## 2. Redrawing when a shard lands

The three views already skip a render whose key is unchanged
(`src/render-key.js`). A shard arriving is a change the state cannot see, so
each view's key gains **the number of attribute shards loaded** — the same
device the map already uses for territory shards ("the map's transform,
spread and count of territory shards arrived"). One integer, and the views
cannot disagree about it.

The panel is the same: `keyOf` in `src/panel/panel.js` gains the count. A
card that was drawn without a title redraws with it.

## 3. The spine stops being written

The last commit removes `buildSpine` from `tools/build-index.mjs`'s output
and `files.spine` from the manifest. `buildSpine` itself **stays** in
`src/validate/core.js`, as `buildTopology` stayed after H3c, because it is
what `CORE_COLUMNS ∪ ATTRIBUTE_COLUMNS = SPINE_COLUMNS` is asserted against
and it is the definition of what the split must add up to. `loadSpine` and
the `{ from: 'spine' }` parameter go with the file.

`manifest.schema` becomes **5**.

## 4. What `ARCHITECTURE.md` must say

The index section is rewritten, and three things go in that were not written
down before:

- the core/attribute line and **why the joins are in the core**: an event's
  actors' ids, its place and its region are read by `eventsByActor`,
  `eventsByPlace` and the two lenses, which are unwindowed, so a join that
  arrived by century would answer half a question;
- the never-wait discipline, named as the same one the geometry, the citers
  and the explanations follow, and the LRU cap with its number;
- **"Scale, for the record"**, which is stale: it quotes an 817.8 KB spine
  and the file has been 542.9 KB since H9. Replace the table with this
  cycle's measured numbers for both datasets, and the projection at 10⁵.

## Files this run touches

`src/data.js` · `src/main.js` · `src/entry/main.js` ·
`src/contribute/main.js` · `src/review/main.js` · `src/narratives/main.js` ·
`src/render-key.js` · `src/panel/panel.js` · `src/timeline.js` ·
`src/map/layers/events.js` · `src/graph-view/graph-view.js` ·
`tools/build-index.mjs` · `ARCHITECTURE.md` · `CLAUDE.md` ·
`data/index/` and `tests/fixtures/data/index/`, rebuilt.

**The hand tables**: `manifestValue.files` and `HASHED` in
`tools/build-index.mjs`; the key functions in `src/render-key.js` and
`src/panel/panel.js`; the `SURFACE` list in `tests/spine-loader.test.mjs`
(which becomes the core loader's); the per-page expectations in
`tests/spine-pages.test.mjs`.

## Tests

- `tests/spine-pages.test.mjs`, rewritten as the core's: against a real
  browser's own record of its requests, **which files each page asks for and
  how many times**. `index.html` asks for the core once and for the window's
  shards; `sources.html` asks for neither; `entry.html` asks for the core and
  one shard; `contribute.html` and `review.html` ask for the core and no
  shard. This test is the one that says the switch actually happened.
- A browser test: `index.html` at the whole extent draws its bars **before**
  the last shard lands, and every bar has its title once they have. Asserted
  on the presence of the elements and the text, never on a wall-clock
  duration (R3's lesson).
- A browser test: a shared `?selected=<id>` link where the id's century is
  not the first shard opens the card with the right title.
- `tests/core-loader.test.mjs` from I3, extended: an atlas from the core
  alone answers `consequences`, `ancestors`, `convergence`, `reachableBy` and
  `shortestPaths` exactly as an atlas from core + every shard does. The
  whole-graph guarantee is the thing the split must not touch.
- `tests/render-key.test.mjs` and `tests/panel-browser.test.mjs`: a shard
  arriving changes the key and redraws; nothing else does.
- `tests/build-index.test.mjs`: no `spine-*.json` is written and
  `files.spine` is gone; `writeIndex` removes the old file; `schema` is 5.
- `tests/prerender.test.mjs` and `--index`: the prerendered pages
  byte-identical to the committed files.

## Done when

- No `spine-*.json` in `data/index/` or `tests/fixtures/data/index/`, and no
  page asks for one.
- The atlas's first-paint index bytes, measured in the browser on the real
  data, are **under 60 KB raw**, and the whole first paint (index plus
  geometry, fonts and CSS excluded) is **under 300 KB raw**; both in
  `STATUS.md` against the 949.6 KB the cycle started from.
- At 10⁴, `index.html`, `entry.html`, `contribute.html` and `review.html`
  each fetch **under 2.0 MB** of index before they draw; the numbers in
  `STATUS.md` against the 16.9 / 16.1 / 20.6 / 20.9 MB the health review
  measured.
- The graph queries answer identically from the core alone.
- `manifest.schema` is 5; `ARCHITECTURE.md`'s index section and "Scale, for
  the record" are rewritten and true.
- `node tools/validate.mjs --index` byte-identical, prerendered pages
  unchanged; `node --test` green with `CHROME` set, the skipped count
  reported.
- `STATUS.md` carries the literal line:

`I4 done`

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

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

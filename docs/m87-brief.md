# M87 — what breaks at 3,000 events: the second review's structural findings

Lane A, on the branch `m87`, gated on `M86 done` on `m0`. Written 24
September 2026 by the assistant under the standing orders (§4: structural
improvements from the reviews are briefed and landed without asking).
Everything here is from `docs/review-2026-09-24.md`: part B's findings 4 to
11, part A's 5, and part C's 2, 9 and 15 where the fix is code. The corpus is
1,095 records and grows by about a hundred a day; each section names the
cost it removes. Nothing here changes what the atlas says about history.

## 1. First paint is one redraw per frame, not one per shard (B4)

`src/main.js` runs `remeasure()` and the panel, chips, intro and composer
refresh once per attribute shard as each lands — twelve files at the whole
span since M85, each a full redraw of every picture — and `applyShard` runs
`reindexRecords()` each time. Coalesce `shardLanded` per animation frame
exactly as `baseArrived` does in `src/map/map.js`, reindex once per batch,
and drop the redundant second request for every shard. Test: a page opened
at the whole span with N attribute shards runs `remeasure` fewer than N
times before the last shard lands (count through a hook the test installs,
never a wall clock).

## 2. The timeline's rows are capped to the pane (B5)

At the whole span `rowLanes` packs one row per title with no cap: 242 main
events make 112 rows at 1280 px, a 2,500-pixel page, and every band drag
repacks all of it. Cap the rows at what the pane holds (`maxRows` from the
pane height over `ROW_HEIGHT`, which `packRows` already honours), and past
the cap stop reserving label room and label what fits, as the graph does,
or stub the rest as the far strip already does. Test: the resting timeline's
height is at most the pane's, at the whole span and at a century.

## 3. The lane-walk test settles on the shards (B6)

`tests/keyboard-browser.test.mjs` waits for the bar signature to be equal
on two polls 50 ms apart, which any two shard landings further apart
satisfy. Wait first for every attribute shard the fixture manifest lists
(`performance` resource entries for `/index/attributes-`), then settle
across an animation frame inside the page. The assertion is unchanged.

## 4. One Chromium per file (B7)

`tests/browser.mjs` launches a fresh Chromium with a fresh profile for every
test: 250 launches per CI run, the cold-launch flake being their cost. One
browser per file at module level, `Target.createBrowserContext` and
`Target.createTarget` per test for the same isolation, the debugging port
read from the `DevTools listening on` line the harness already captures
instead of polling `/json/list`. The tests' behaviour is unchanged; the
suite's wall time is reported before and after in `STATUS.md`.

## 5. Waits that say what they waited for (B8)

154 browser tests open the live corpus under a fixed 10 s `until`, and
three private "settled" loops return silently after 4 s. One
`settledShards(page, manifest)` in `tests/browser.mjs`, keyed on the
manifest's shard count, that fails with "N of M arrived"; the bare loops
get a `waitFor` with a message. No test pins a count: the manifest is read
at run time.

## 6. The last source-grepping test (B9)

`tests/m82.test.mjs` reads `src/map/map.js` as text. Assert in a browser
test that the map's unplaced note is absent and the window control's
sentence is present, and drop the scan.

## 7. `lensView` consults its cache first (B10)

`src/lens.js` computes `activeFoci` and scans the active events before
looking the state up in its cache, about ten times per state change. Look
the state up first; compute on a miss; or memoise `eventsOfFocus` per
(atlas, focus, stamp). Test: the second call for the same state does no
scan (count through a hook).

## 8. Three small ones (B11)

The graph renders twice on `?view=graph` at first paint (set
`wasHidden[view] = false` when the view was just built). A chosen link has
no mark on the timeline while the map draws it (B7's timeline half): give
the two bars a `chosen` class and the key a line. The stale comment and the
redundant shard request in `src/main.js` go.

## 9. The phone's picture (A5)

On a phone the map is a 220 px band fitted to the pane's width and the
graph's labels are about 4 px. Under `max-width: 720px` fit the map to the
pane's height (cover, cropping the poles), and on the graph draw no label
under 8 px on screen except the selected node and its ring. Screenshots
`docs/screens/m87-map-phone.png` and `m87-graph-phone.png`.

## 10. The validator reads the lead's first sentence (C2)

Part C found fifteen records whose span contradicts the year range in the
first sentence of their own cached lead, which `span-vs-article-title`
cannot see because it reads titles only. Add `span-vs-lead-sentence`: a
warning where the cached lead's first sentence states a year range and the
record's `when` falls outside it, with the two spans in the message. It is a
warning, never a change to a record; A14 (1) is the pass that acts on it.

## 11. The import tool's place reuse (C9)

`placeRecord()` reuses a place by Wikidata item only, so `london-q84` was
written beside the hand-written `london` at the same point, and eight more
pairs share a point. Before writing a place, fold the name and check the
distance against existing places the way `tools/import/places.mjs` already
does for Natural Earth, and reuse the existing record. A tool change; the
records themselves are A14 (6)'s.

## 12. The refused-item log (C15)

`data/imports/wikidata-state.json` keeps no `refused` list and
`.github/workflows/import-wikidata.yml` truncates `docs/import-report.md`
on every run. Keep a `refused` map of item → reason in the state file,
appended never overwritten, and let the report accumulate a dated section
per run. No historical claim; the reasons are the tool's own.

## Must not

No record, no historical claim, nothing under `data/` except the state
file's new `refused` map. No new hex value, token or type size.
`emphasis.js`'s `shown` contract unchanged. `validate --index` clean; tests
before behaviour (711, 717); no test pins a count or a pixel, and a test
that reads the corpus derives its expectation from the corpus it runs on.
Lane A numbers deviations on from M86. Ignore `docs/drafts/`.

## Done when

Each of the twelve sections is done, or refused in `STATUS.md` with the
measurement that refused it; the suite's wall time before and after; the
two phone screenshots, every other picture `tools/screens.mjs` rewrites
restored; the check on `m87` green; the `STATUS.md` section; the section in
`docs/history/pr-sections.md`; `M87 done`.

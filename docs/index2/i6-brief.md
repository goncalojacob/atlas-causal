# Build brief — I6: the graph's stacks per zoom bucket, and a timeline that fits its pane

The sixth run of the second index cycle (`docs/index2-plan.md`, decisions D9
and D10; `docs/health-review-2026-09-06-result.md` §5.2.3 and §5.2.4). Two
measured defects in the views, neither of which touches the index.

The graph is the slow picture at 10⁴: **280 ms a wheel notch and 5.3 s for
ten** on the whole window, against 55 ms on the map, because
`graph-view.js:559` keys its stacking on the raw `k` and re-clusters the
whole band on every notch, while `src/map/layers/events.js:256` has rounded
to `zoomBucket(k)` since H4a. And the timeline overflows its pane at the row
cap: twenty rows at the 14 px floor plus the axis do not fit 269 px, which is
why the owner's own "the timeline fits its pane" passes at 15 rows and fails
at the cap M33's office grouping will reach.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (D9, D10, owner question 1),
`docs/health-review-2026-09-06-result.md` §2.3, §4.1 (the timeline row) and
§5.2.3–4, then `src/cluster.js` (`zoomBucket`, `ZOOM_BUCKETS_PER_OCTAVE`,
`coreZoom`), `src/map/layers/events.js` (the `exactZoom` exemption),
`src/graph-view/graph-view.js` (the caches at :77–99, the stacking at
:540–575), `src/graph-view/layout.js` (`stackLayout`, `STACK_DISTANCE`,
`MAX_ZOOM`), `src/timeline.js` (`MAX_ROWS`, `MIN_ROW_HEIGHT`,
`MIN_LANE_HEIGHT`, `AXIS_HEIGHT`, the layout block at :554–600),
`src/lanes.js` (`packRows`, `rowLanes`, `LANE_CAP`), `tests/bench/run.mjs`.

## The gate

Wait for the literal line `I5 done` on `origin/m0`. Then claim `I6`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`.
- No historical claim; **no record under `data/` touched at all**, index
  included — this run changes no bytes under `data/`.
- No `reviewed` record touched; no migration consumed.
- **No new colour and no new size.** `tests/site.test.mjs` forbids a hex
  value outside `:root` in the CSS and anywhere under `src/`.
- **No wall-clock assertion in a test.** The numbers go in the bench and in
  `STATUS.md`; a test asserts what is drawn and how many times something is
  called, never how many milliseconds it took (R3's lesson, and the bench's
  own header).
- The never-hide rule is unchanged: the selection, the walked chain, the open
  actor's events, a narrative's walk and the horizon's held set are drawn
  alone at every zoom (`alone` in `stackLayout`).
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set.

## 1. The graph's stacks, per bucket

In `src/graph-view/graph-view.js`:

- the stacking key becomes `` `${laidFor}|${zoomBucket(k)}|${holdingKey(s)}` ``
  and the `k` handed to `stackLayout` is the bucketed one, so two notches
  inside a bucket draw the same stacks and the second is a cache hit;
- the exemption the map already has comes with it: when the reader has
  clicked a stack that no zoom quite parts, the exact zoom is used, exactly as
  `exactZoom` does in `src/map/layers/events.js:256`, so `coreZoom` still
  parts what the reader asked to part;
- `STACK_CACHE` stays 12: with buckets, twelve entries is about two octaves
  of zoom rather than twelve arbitrary notches.

Then the drawing. The map culls to what is on screen (`onScreen` in
`src/map/layers/events.js`); the graph draws all 1,605 stacks at 10⁴. Add the
same cull: a stack whose x is outside the visible rectangle, widened by one
node radius, is not appended — and what the reader is holding is exempt at
every distance, as it is everywhere else. The rectangle is already in the
view's render key.

## 2. The timeline's cap, from the pane

In `src/timeline.js`, the row count stops being a constant and becomes what
the pane can hold:

```
rowsThatFit = clamp(floor((paneHeight - AXIS_HEIGHT) / MIN_ROW_HEIGHT), 1, MAX_ROWS)
```

passed to `rowLanes` as `maxRows`, and the same rule with `MIN_LANE_HEIGHT`
for a named grouping, clamped to `LANE_CAP` (or to the reader's own `lanes`
list, which is unlimited by design and is the one case that may still
overflow — a reader who names fifteen actors has said they want fifteen).
`MAX_ROWS = 20` becomes a ceiling instead of a promise, and the comment
beside it says so.

This is **owner question 1** and the recommended answer; the two rejected
alternatives — lowering the 14 px floor, or letting the pane scroll by
design — are named in `docs/index2-plan.md` D10 so the owner can overrule
with one commit.

`AXIS_HEIGHT` and the pane measurement are already in `resize()`; nothing new
is measured and no card measures anything (M30b A5's rule stands).

## 3. The bench case

`tests/bench/run.mjs` has a `layout` case since H9. Add to it, or beside it,
**the graph's wheel notch** — the thing the review measured at 280 ms and
this run is about: `stackLayout` over a band of the 20,000-event synthetic
set at a sequence of ten zooms, once with the raw `k` and once bucketed,
printing both and the ratio. A number in the repository is what
`STATUS.md`'s claim rests on, and there was none for this one.

## Files this run touches

`src/graph-view/graph-view.js` · `src/timeline.js` · `src/lanes.js` (only if
`rowLanes` needs the cap passed differently; `packRows` already takes
`maxRows`) · `tests/bench/run.mjs` · `ARCHITECTURE.md` (the graph's stacking
and the timeline's cap) · `CLAUDE.md` if a module is added (none is
expected).

**The hand tables**: `CASES` in `tests/bench/run.mjs`; `NEEDS_ATLAS` /
`NEEDS_DATASET` if the new case wants either; the constants block at the head
of `src/timeline.js`.

## Tests

- `tests/graph-layout.test.mjs` or a sibling, pure: two zooms inside one
  bucket produce the **same stack keys and the same members**; two zooms in
  different buckets do not; `coreZoom` still parts a clicked stack at the
  exact zoom; a held event is never inside a stack.
- `tests/graph-browser.test.mjs`: ten wheel notches on the whole window at
  the fixtures draw a graph each time and leave the held set alone; a stack
  outside the visible rectangle is not in the DOM and the selection is,
  wherever it is. No timing assertion.
- `tests/timeline.test.mjs` / `tests/lanes.test.mjs`: the row count for a
  given pane height is what fits, clamped to `MAX_ROWS`; the drawing's height
  never exceeds the pane at `group: none` or at a named grouping within
  `LANE_CAP`; an explicit `lanes` list longer than what fits still draws all
  of them.
- `tests/timeline-browser.test.mjs`: at the fixtures with `group=actor` the
  SVG's height equals the pane's and `scrollHeight` does not exceed it; and
  the existing assertion that a state change adds fewer than ten elements and
  removes ten still holds (the `reuse` discipline).
- `tests/bench-harness.test.mjs`: the new case runs and prints.

## Done when

- The graph's stacking is keyed and computed on `zoomBucket(k)`, with the
  clicked-stack exemption, and stacks outside the visible rectangle are not
  drawn.
- The bench prints the notch's cost bucketed and unbucketed at 10⁴ and the
  ratio is in `STATUS.md`; the target is **a wheel notch inside a bucket
  costing no more than a redraw**, and ten notches on the whole window at 10⁴
  costing less than a second against the 5.3 s the review measured.
- The timeline's drawing fits its pane at the cap, at `group: none` and at
  `group=actor`, asserted in the browser.
- No colour, no size, no hex outside `:root`; no wall-clock assertion added.
- `node tools/validate.mjs --index` byte-identical (nothing under `data/`
  changed); `node --test` green with `CHROME` set.
- `STATUS.md` carries the literal line:

`I6 done`

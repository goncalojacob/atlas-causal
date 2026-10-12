# Build brief: M88, the display findings of the third review

The third Fable review (`docs/review-2026-09-26.md`, 25 September) measured
the display code after M86 and M87. Its part B read `m0` at 12ecb81f, and its
part C had one display finding. The review found all eleven of the 24
September findings fixed. This brief lists what it found new, in the order a
funder meets it: a phone first, then the search box, then the machinery. Each
section names the finding it answers. The review's evidence is the
specification, and this brief does not repeat it.

## Conditions of the run

The run works on branch `m88`. It never pushes to `m0`, `m42`, `m42b` or
`main`. It starts once `M87 done` is on `origin/m0`. The 21 and 22 September
amendments in `docs/run-protocol.md` and `docs/assistant-standing-orders.md`
apply.

- Tests come before behaviour (711, 717).
- No test pins a count or a pixel of position.
- A test of a display property over the live corpus derives its expectation
  from the corpus.
- No new hex value, token or type size.
- No runtime dependency, build step, map library or database.
- Nothing under `data/` except the rebuilt search shard in §2, and no record.

Deviations take numbers from the last one in the branch's `STATUS.md`. A
section is done when its test is green on the branch's check. The run writes
`M88 done` on `STATUS.md` when all thirteen are done.

## 1. The graph on a phone fills the pane and every drawn name is legible (B1)

File: `src/graph-view/graph-view.js`.

- Under `PHONE`, the root `<svg>` takes the same `preserveAspectRatio` rule
  that `src/map/map.js` 113-119 applies. The other way is for `adopt` to set
  the viewBox's height from the pane's aspect. Either way the drawing fills
  the pane's height.
- In `drawLabels`, when `pixels < LABEL_MIN_PIXELS`, keep the names and write
  them at `LABEL_MIN_PIXELS / scale`. This size goes in the `font-size` and in
  the boxes that `placeLabels` measures through `labelBox`. Fewer names fit,
  and every one drawn is legible.

Tests. Rewrite `tests/m87-browser.test.mjs` 241-260. On `PHONE` at rest after
`settledShards`, the graph draws at least one `text.node-label`, every drawn label is
at least 8 px on screen, and the drawing's height is more than half the pane.
This is the shape of the map's test at 208-226. Add a new
`docs/screens/m88-graph-phone.png`.

## 2. Searching for the importer's words no longer matches every event (B2)

File: `src/search.js`, function `buildSearchIndex`. The `lead` is
`fold(firstSentence(readSummary(event.summary).body))` (`src/summary.js` 103,
the split from M86 §1). A `Set` removes duplicates from `terms`.

Test. A pure test in `tests/search.test.mjs` over the live corpus derives its
expectation from the corpus. For every active event where
`isImportedSummary` is true, the entry's `lead` equals that expression and
contains neither "wikipedia article" nor "at revision".
`search(entries, 'revision').total` is below the number of events whose
body's first sentence contains the word, a number the test computes.

Then run `node tools/build-index.mjs`. Only the search shard changes. The
commit says so, and no record moves.

## 3. A landing on `m0` runs the suite once (B3)

File: `.github/workflows/validate.yml`. The push pattern becomes
`branches: ['m[1-9]*']`. Lane branches keep their push check. On `m0` the
check is the pull request's, and the landing waits for that one.
`tests/workflows.test.mjs` asserts that the pattern does not match `m0` and
does match `m42` and `m88`.

Each job validates the records three times: the "Validate records" step and
the two pure tests that validate again. Reduce this to one if the tests can
read the step's result. If they cannot, leave it and say so.

## 4. The m53 test stops pinning the corpus's count (B4)

File: `tests/m53.test.mjs` 363-385. The test compares the four figures of the
last `**after M<n>**` row only when the row names the active count of its
measurement (`| **after M42, 1257 active** | ...`) and that count equals
`active.length`. In every other case it asserts the two rules (the start-rule
and overlap predicates, and the stated gap paragraph) and passes. The row in
`docs/m53-polities.md` gains the size.

Tests. With a fixture document whose row names a size the fixture corpus does
not have, the test passes. With a row naming the fixture's own size and a
wrong figure, it fails.

Add a one-file `tools/m53-retake.mjs` that writes the row from the corpus.
The records lanes and the landing script can then call it, and a person does
not have to.

## 5. A shard already in hand does not count as a landing (B5)

File: `src/main.js`, function `askFor`. It chains `shardLanded` only for
shards it does not hold yet (`atlas.loadedAttributeShards()`, `src/data.js`
1398).

Test. A pure test in the shape of `tests/data.test.mjs` counts the landing
callback with a hook over two `askFor` calls for the same shards. The count is
one.

`window-control.js` 201-215 keys its sentence on the picture, so `remeasure`
computes it once instead of four times.

## 6. The map and the graph are groups (B6)

Both roots take `role: 'group'` with their existing `aria-label`
(`graph-view.js` 311-315, `map.js` 104), as `timeline.js` 246 already does.

Test. In `tests/keyboard-browser.test.mjs`, none of the three view roots has
`role="img"`, and each has an accessible name.

## 7. The lens chips keep the keyboard's focus (B7)

File: `src/lens-chips.js`, function `render`.

- Skip the redraw when the labels and `focusAll` equal the last drawn.
- Otherwise remember the focused element's `data-action`/`data-focus` before
  the rewrite and focus its match after. After an `unfocus`, focus the next
  chip's remove button, and with no next chip, "Show everything".
  `graph-view.js` 857-869 does the same for lines.

Tests in `tests/lens-browser.test.mjs`. With two foci open, focus
`.lens-all` and press Enter: `aria-pressed` toggles and
`document.activeElement` is still `.lens-all`. Focus a `.lens-drop` and press
Enter: the focus is inside `#lens-chips`.

## 8. The panel is a region with one status line (B8)

File: `index.html` 123.

- Drop `aria-live` from `#panel`, and add `role="region"` and
  `aria-label="Details"`.
- Add one visually hidden `role="status"` element (the pattern at line 31).
  `src/panel/panel.js` writes to it once per opened record ("Opened:
  <title>").

Tests in `tests/panel-browser.test.mjs`. `#panel` has no `aria-live`. After a
record opens, the status names it.

## 9. A band drag is one redraw per frame and the timeline packs once (B9)

- In `src/window-band.js`, function `bindWindowGestures`, a drag books
  `setWindow` once per animation frame. It keeps the latest patch, uses one
  `requestAnimationFrame` and flushes at `pointerup`. The store's synchronous
  contract stays as it is.
- In `src/timeline.js` 747-754, compute `maxRows` first, then call `rowLanes`
  once with it and the title room together.

Pure tests. With a fake `requestAnimationFrame`, ten `pointermove` events
produce one `state.set` with the last move's year. In
`tests/timeline-rows.test.mjs`, a hook on `rowLanes` counts one call per draw
at the whole span.

## 10. The browser harness can kill what it launched (B10)

File: `tests/browser.mjs`. Keep a module-level `Set` of children. `launch`
adds each child right after `spawn`, and `shutDown` removes it. The `exit`
handler kills them synchronously.

Test. A pure test with a fake `spawn` (the shape of
`tests/bench-harness.test.mjs`) checks that the child is in the set before
the first `await` in `launch` resolves.

## 11. The degree control tells every reader why it is off (B11)

File: `src/graph-filters.js` 84-87. Add a visually hidden
`<span id="degree-off">` that carries `DEGREE_OFF` while a lens is on and is
empty at rest. The select names it in `aria-describedby`.

Test. A pure DOM test checks that with a lens on, the group's `textContent`
contains `DEGREE_OFF`, and at rest it does not.

## 12. The settle budget comes from the build, and the halo test measures two zooms (B12)

- In `tests/browser.mjs`, function `settledShards`, `tries` is a function of
  the manifest. `manifestOf` reads the size of the shard files the manifest
  names and adds one second per 200 KB to the ten. The wait grows with the
  corpus and pins nothing.
- `tests/graph-halo-browser.test.mjs` 134-174 measures only the world and
  zoom 6.

The batch note gives the lane's wall time before and after.

## 13. "reacted to" reads the right way round (part C's finding 3)

Files: `src/panel/edge.js` 102-105 and `src/vocab.js` 33. For `reacted-to`,
the card follows the record's convention (deviation 1420: `from` is what was
reacted to, and `to` is the reaction). It reads "answered by", or reverses
the arrow for this type only. The other types stay as they are.

Test. A pure test derives the expected reading from a `reacted-to` record's
own dates, where the later event is the reaction. The fire wrote two disputes
from the card's old reading. Both stay `disputed` for the owner.

## Noted and left for later

The review listed three items as "not findings":

1. `performance.setResourceTimingBufferSize(2000)` in the script that
   `watchErrors` injects.
2. `deltaMode` on Firefox ESR.
3. A `modulepreload` list derived from the import graph, worth doing once
   someone measures first paint on Pages.

Do the first if it is one line. Leave the other two.

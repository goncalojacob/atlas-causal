# Build brief — M88: what the third review found in the display

The third Fable review (`docs/review-2026-09-26.md`, 25 September, part B
over `m0` at 12ecb81f and part C's one display finding) measured the display
code after M86 and M87 and found all eleven of the 24 September findings
fixed. What it found new is below, in the order a funder meets it: a phone
first, then the search box, then the machinery. Every section names the
finding it answers; the review's evidence is the specification and this
brief does not repeat it.

**Branch `m88`, never `m0`, `m42`, `m42b` or `main`.** Gated on `M87 done`
on `origin/m0`. The 21 and 22 September amendments in `docs/run-protocol.md`
and `docs/assistant-standing-orders.md` apply. Tests before behaviour (711,
717); no test pins a count or a pixel of position; a test of a display
property over the live corpus derives its expectation from the corpus; no
new hex value, token or type size; no runtime dependency, build step, map
library or database; nothing under `data/` except the rebuilt search shard
in §2, and no record. Deviations are numbered from the last in the branch's
`STATUS.md`. Each section is done when its test is green on the branch's
check; `M88 done` goes on `STATUS.md` when all thirteen are.

## 1. The graph on a phone fills the pane and every drawn name is legible (B1)

`src/graph-view/graph-view.js`: the root `<svg>` takes under `PHONE` the same
`preserveAspectRatio` rule `src/map/map.js` 113-119 applies (or `adopt` sets
the viewBox's height from the pane's aspect), so the drawing fills the pane's
height; in `drawLabels`, when `pixels < LABEL_MIN_PIXELS` the names are not
dropped but written at `LABEL_MIN_PIXELS / scale` (in the `font-size` and in
the boxes `placeLabels` measures through `labelBox`), so fewer fit and every
one drawn is legible. `tests/m87-browser.test.mjs` 241-260 is rewritten: on
`PHONE` at rest after `settledShards`, at least one `text.node-label` is
drawn, every drawn label is at least 8 px on screen, and the drawing's height
is more than half the pane (the shape of the map's test at 208-226). A new
`docs/screens/m88-graph-phone.png`.

## 2. Searching for the importer's words no longer matches every event (B2)

`src/search.js` `buildSearchIndex`: the `lead` is `fold(firstSentence(readSummary(event.summary).body))`
(`src/summary.js` 103, M86 §1's split), and `terms` is deduplicated with a
`Set`. Pure test in `tests/search.test.mjs` over the live corpus, deriving
its expectation from it: for every active event where `isImportedSummary` is
true, the entry's `lead` equals that expression and contains neither
"wikipedia article" nor "at revision"; `search(entries, 'revision').total` is
below the number of events whose body's first sentence contains the word,
computed in the test. Then `node tools/build-index.mjs`: only the search
shard changes; the commit says so and no record moves.

## 3. A landing on `m0` runs the suite once (B3)

`.github/workflows/validate.yml`: the push pattern becomes
`branches: ['m[1-9]*']`, so lane branches keep their push check and `m0`'s
check is the pull request's, which is what the landing waits for.
`tests/workflows.test.mjs` asserts the pattern does not match `m0` and does
match `m42` and `m88`. The third validation per job (the "Validate records"
step beside the two pure tests that validate again) is reduced to one if the
tests can read the step's result; otherwise left and said so.

## 4. The m53 test stops pinning the corpus's count (B4)

`tests/m53.test.mjs` 363-385 compares the four figures of the last
`**after M<n>**` row only when the row names the active count it was
measured at (`| **after M42, 1257 active** | ...`) and that count equals
`active.length`; otherwise it asserts the two rules (the start-rule and
overlap predicates, the stated gap paragraph) and passes. `docs/m53-polities.md`'s
row gains the size. Test: with a fixture document whose row names a size the
fixture corpus does not have, the test passes; with a row naming the
fixture's own size and a wrong figure, it fails. A one-file
`tools/m53-retake.mjs` that writes the row from the corpus, so the records
lanes and the landing script can call it rather than a person.

## 5. A shard already in hand is not a landing (B5)

`src/main.js` `askFor`: `shardLanded` is chained only for shards not already
held (`atlas.loadedAttributeShards()`, `src/data.js` 1398). Pure test in the
shape of `tests/data.test.mjs`: a hook counting the landing callback over two
`askFor`s of the same shards counts one, not two. `window-control.js`
201-215 keys its sentence on the picture so `remeasure` does not recompute it
four times.

## 6. The map and the graph are groups, not images (B6)

`role: 'group'` with the existing `aria-label` on both roots
(`graph-view.js` 311-315, `map.js` 104), as `timeline.js` 246 already has.
`tests/keyboard-browser.test.mjs`: the three view roots have no `role="img"`
and each has an accessible name.

## 7. The lens chips keep the keyboard's focus (B7)

`src/lens-chips.js` `render`: skip when the labels and `focusAll` equal the
last drawn; otherwise remember the focused element's `data-action`/`data-focus`
before the rewrite and focus its match after (after an `unfocus`, the next
chip's remove button, then "Show everything"), as `graph-view.js` 857-869
does for lines. `tests/lens-browser.test.mjs`: with two foci open, focus
`.lens-all`, press Enter, `aria-pressed` toggled and `document.activeElement`
is still `.lens-all`; focus a `.lens-drop`, press Enter, focus is inside
`#lens-chips`.

## 8. The panel is a region with one status line, not a live region (B8)

`index.html` 123: `aria-live` dropped from `#panel`, `role="region"` and
`aria-label="Details"` added; one visually hidden `role="status"` element
(the pattern at line 31) that `src/panel/panel.js` writes once per opened
record ("Opened: <title>"). `tests/panel-browser.test.mjs`: `#panel` has no
`aria-live`; after opening a record the status names it.

## 9. A band drag is one redraw per frame and the timeline packs once (B9)

`src/window-band.js` `bindWindowGestures`: `setWindow` is booked per
animation frame during a drag (latest patch kept, one `requestAnimationFrame`,
flush at `pointerup`); the store's synchronous contract is untouched.
`src/timeline.js` 747-754: `maxRows` is computed first and `rowLanes` is
called once with it and the title room together. Pure tests: with a fake
`requestAnimationFrame`, ten `pointermove`s produce one `state.set` with the
last move's year; in `tests/timeline-rows.test.mjs` a hook on `rowLanes`
counts one call per draw at the whole span.

## 10. The browser harness can kill what it launched (B10)

`tests/browser.mjs`: a module-level `Set` of children, added right after
`spawn` in `launch` and removed in `shutDown`; the `exit` handler kills them
synchronously. Pure test with a fake `spawn` (the shape of
`tests/bench-harness.test.mjs`): the child is in the set before `launch`'s
first `await` resolves.

## 11. The degree control says why it is off, to everyone (B11)

`src/graph-filters.js` 84-87: a visually hidden `<span id="degree-off">`
carrying `DEGREE_OFF` while a lens is on, empty at rest, referenced by
`aria-describedby` on the select. Pure DOM test: with a lens on the group's
`textContent` contains `DEGREE_OFF`; at rest it does not.

## 12. The settle budget is read from the build, and the halo test measures two zooms (B12)

`tests/browser.mjs` `settledShards`: `tries` is a function of the manifest
(`manifestOf` stats the shard files it names; one second per 200 KB on top
of the ten), so the wait grows with the corpus and pins nothing.
`tests/graph-halo-browser.test.mjs` 134-174 measures the world and zoom 6
only. The lane's wall time before and after in the batch note.

## 13. "reacted to" reads the right way round (part C's finding 3)

`src/panel/edge.js` 102-105 and `src/vocab.js` 33: for `reacted-to` the card
reads the record's convention (deviation 1420: `from` is what was reacted
to, `to` the reaction), as "answered by" or with the arrow reversed for this
type only; the other types are unchanged. Pure test that derives the expected
reading from a `reacted-to` record's own dates (the later event is the
reaction). The two disputes the fire wrote from the card's reading stay
`disputed` for the owner.

## Noted, not asked

The review's "not findings": `performance.setResourceTimingBufferSize(2000)`
in `watchErrors`'s injected script; `deltaMode` on Firefox ESR; a
`modulepreload` list derived from the import graph, worth doing once first
paint on Pages is measured. Do the first if it is one line; leave the others.

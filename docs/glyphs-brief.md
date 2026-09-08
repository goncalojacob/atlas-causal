# Build brief — the glyphs: a symbol per category on the map and the timeline

`data/categories.json` has held twelve categories since M30a and M32b gave
175 of the 421 events one, and nothing on the page shows it. This is the run
M30b deferred: one small symbol per category over the mark, the same symbol
on the timeline's bar, an event with no category keeping the plain circle it
has today, and every category toggle carrying its own glyph — because the
layer control is the legend and there is no other. Runs on `m0`, one run,
after M39 and before M37 (see `docs/map-block-plan.md` for why: this run
builds the "events by category" half of the layer control, and M37 builds the
"base map" half beside it).

From `docs/plan-2026-09-05.md` decision 13, `docs/m30b-brief.md` item 4 and
amendments **A2**, **A11** and **A12** — A2 is the deferral and the three
conditions it set, and they are not re-argued here.

Read `CLAUDE.md` (the azulejo direction: every colour is a variable in
`src/style.css`, no new hex value, sizes from the type scale; the layout tree,
which `tests/site.test.mjs` holds every module to), `STATUS.md`,
`ARCHITECTURE.md` (`category` at ~1287–1289 — "The map draws a glyph per
category and the layer control toggles them"; the emphasis hierarchy at
~241–245; `layers` and `?layers=` at ~2147–2157), `docs/run-protocol.md`,
`docs/m30b-brief.md` A2, A11 and A12, `docs/m32b-brief.md` (what a category
means on a record and which titles were read to assign one),
`docs/map-block-plan.md`, then `data/categories.json`, `src/spine.js`
(`CORE_BY_KIND`, `ATTRIBUTES_BY_KIND`, `SPLIT_COLUMNS`),
`src/validate/core.js` (`buildCore`, `buildSpine`), `src/data.js`,
`src/parts.js` (`isParent`, `ringClasses` — the same problem one convention
over), `src/map/layers/events.js`, `src/timeline.js` (`reuse`),
`src/main.js` (`LAYER_ROWS`), `src/state.js` (`LAYERS`, `EVENTS_LAYER`),
`src/emphasis.js`, `src/panel/event.js`, `src/style.css` (`.map .mark` at
~615–663, `.bar .layers` at ~241, the phone media query at ~544–557),
`tests/map-browser.test.mjs`, `tests/timeline-browser.test.mjs`,
`tests/phone-browser.test.mjs` — and this file including its "Amendments
after review" if one is present, which override the body where they differ
(run protocol §3).

The gate line is the literal `M39 done` on `origin/m0`.

## 1. `category` moves into the core

A category toggle that hides marks must hide them **on the frame the reader
clicks it**. `category` is an attribute column today
(`ATTRIBUTES_BY_KIND.event` in `src/spine.js`), which means it arrives with
its century's shard: a reader who turns `war` off would see nothing happen,
and then, a moment later, marks disappear. That is the toggle lying about
what it did.

So the column moves: `col('category', 'vocab', { vocab: 'category', absent:
OMIT })` leaves `ATTRIBUTES_BY_KIND.event` and joins `CORE_BY_KIND.event`.
It is a vocabulary column — one small integer per event that has one, absent
where none — and 175 of 421 events carry one on today's data. `SPLIT_COLUMNS`
is untouched: `category` is in exactly one table before and after, and the
union test's "these and no others" is unchanged. `manifest.schema` goes up by
one, `src/data.js`'s `assertGeneration` with it, both indexes are rebuilt in
the same commit, and the run records the measured change in the core's size
in `STATUS.md` (it is expected to be under 1 KB; if it is not, say so).

**The glyph itself does not need this** — a glyph could arrive with the shard
as the label does. The toggle does. They move together because two rules
about when a category is known would be one rule too many.

## 2. `src/map/glyphs.js`

Pure but for the elements it builds, importable in Node with no DOM at the
top level (`tests/site.test.mjs` imports every module under `src/`).

- **One `<symbol>` per category**, twelve of them, in a `<defs>` block the
  map appends once at construction, ids `glyph-<category id>`. Each is a
  10 × 10 `viewBox`, **stroke only, no fill**, `stroke: currentColor`,
  `stroke-width: 1`, `vector-effect: non-scaling-stroke`, round caps and
  joins, drawn to read at ten screen pixels. `data/categories.json` is the
  list; a category with no symbol is a bug the module reports by drawing
  nothing, never by drawing a question mark.
- **A `<use class="glyph">` beside the mark, never replacing `circle.mark`.**
  A2's three conditions, in full: the mark stays a `<circle>`; the glyph
  carries **no** `data-id`, no `data-mark`, no `tabindex` and
  `pointer-events: none`, so every browser test naming `circle.mark`,
  `circle.hit` or `circle[data-mark]` still passes and the keyboard path is
  untouched; and an event with no category keeps the plain circle.
- **Where.** Centred on the mark, drawn immediately after it, 6 units square
  at `k = 1` and divided by `k` like every other size in `events.js`, inside
  the mark's 10-unit circle. Not offset: the badge already sits above and to
  the right of a cluster, and a glyph out there would be a second thing in
  the same place.
- **Colour, against the mark's own fill.** `.map .mark` is `fill:
  var(--paper)` with a cobalt stroke by default and takes a solid fill when
  it is emphasised, so the glyph is `color: var(--cobalt)` normally and
  `color: var(--paper)` wherever the fill is solid — `.on-path`,
  `.selected`, `.of-actor`. Five rules, existing tokens, **no new hex value
  and no new token**. `currentColor` in the symbol resolves against the
  `<use>`, which is why the symbols carry no colour of their own.
- **The glyph carries the mark's emphasis classes**, with the view's word for
  a record (`mark`) swapped for `glyph` — which is exactly what
  `ringClasses` does for M30c's parent ring. Generalise the one-line
  substitution `src/parts.js` already has and let `ringClasses` and
  `glyphClasses` both call it, rather than writing a second copy; a test
  asserts the two agree on the same input. So a glyph reddens with the
  walked chain, dims with the lens and fades outside the window exactly as
  its mark does, and every selector that counts records goes on counting
  records.
- **A cluster gets no glyph** and keeps the plain mark with its count (plan
  decision 13): a count is not a record, and a stack of four categories has
  no category. A spread's members are records again, and each gets its own.
- **The mark's accessible name gains the category's label.** `events.js`
  already sets `aria-label` from the title; it becomes "«title» —
  «category label»" where there is one, so a reader who cannot see the glyph
  is told the same thing. The event card's meta line shows the label too,
  through `data/categories.json`'s `label`, or the category is a field only
  the map can see.

## 3. The timeline's bar

`src/timeline.js` draws the same `<use class="glyph">` at the **left end of
the bar**, vertically centred, in the same colour rule against the bar's own
fill, and hands it back through **`reuse`** —
`tests/timeline-browser.test.mjs:150-208` asserts fewer than ten elements
added and ten removed on a state change, and a glyph that was appended fresh
each render would fail it.

A bar shorter or thinner than the glyph gets none: a symbol drawn at three
pixels is a smudge that says something false about how much the atlas knows.
The threshold is one named constant, the run **measures** the bar geometry at
the default window and at the whole extent and records in `STATUS.md` what
fraction of bars carry a glyph at each. A stack keeps its count and no glyph,
as a cluster does.

The graph view gets no glyphs in this run: nobody asked for them there, and a
node already carries a ring, a badge and a weight.

## 4. The category toggles, which are the legend

`src/main.js` builds the layer control from the manifest (M30b A12). This run
adds the fourth part of it:

```
<details><summary>events by category</summary>
  <label><input type="checkbox" data-layer="events:war" checked> <svg …><use href="#glyph-war"></use></svg> War</label>
  …
</details>
```

- **Collapsed**, so the phone drawer keeps one 40 px target instead of
  thirteen (`src/style.css` ~544–557,
  `tests/phone-browser.test.mjs:134-153`).
- **Built from the categories in use, not from `categoriesAllowed`.** Four
  of the twelve match a record today — 151 `election`, 13 `disaster`, 6
  `death`, 5 `treaty` — and eight toggles that hide nothing are eight lies
  about what the atlas holds. The manifest gains **`categories`**, the ids in
  use with a count each, beside the existing `roles`, which already means
  "in use" against `rolesAllowed`, "allowed". Absent or empty means the
  `<details>` is not drawn at all. **Nothing is drawn that has no data.**
- Every label and every id goes through `esc()`: `data/categories.json` is
  data from `data/` and data from `data/` is untrusted input.
- **Each toggle carries its glyph**, in the same `currentColor` and the same
  tokens, at the row's text size. That is the whole of the map's legend for
  categories, and `about.html` says so beside the paragraph that already
  explains why there is no legend by territory hue.
- **An event with no category is not hidden by any category toggle.** The
  bare `events` token means every category **and** the events that have
  none; turning one category off writes one `events:<id>` per category still
  on, exactly as M30b A11 specified, and the uncategorised stay drawn until
  `events` itself is switched off. A reader who wants only wars turns
  `events` off and nothing back on — which is not what they mean, so the
  card and `about.html` say plainly that a category filter narrows the
  events that have one.

`src/state.js` needs nothing: `EVENTS_LAYER` and `parseState` have accepted
`events:<slug>` since M30b-3. `formatState` already writes what the reader
did. `tests/state.test.mjs` should pass untouched, and if it does not, the
plumbing is not what A11 left behind and the run says so before changing it.

## What this run must not do

- **Never replace `circle.mark`.** Not with a `<path>`, not with a `<use>`,
  not "for the categories that have a glyph". A2 says why: the mark is the
  control, the hit circle, the keyboard target and the thing every browser
  test names.
- **No new hex value, no new token, no new type size.** The glyphs are
  `currentColor` and the five colour rules use tokens that already exist.
- **No glyph that reads as a control.** No ✓, no ✕, no ⓘ, no ⚠: a reader
  must never think a mark can be dismissed, confirmed or expanded by
  clicking the shape inside it.
- **No emoji, no icon font, no external asset.** Twelve inline `<symbol>`
  elements and nothing fetched.
- **No glyph above the emphasis hierarchy.** Territory hue under the
  selected actor's cobalt under the walked chain's madder; a glyph takes its
  mark's emphasis and adds none of its own.
- **No glyph on a cluster, a stack, a density stub or a graph node.**
- **No new category, no edit to `data/categories.json`, no record touched.**
  If a category's meaning is wrong, that is `docs/m32b-brief.md`'s owner
  question and not this run's.

## Tests

1. **`tests/glyphs.test.mjs`** (Node, pure) — every id in
   `data/categories.json` has a symbol and every symbol has a category;
   every symbol is a 10 × 10 viewBox with no `fill` other than `none` and no
   colour literal anywhere in the module; `glyphClasses` agrees with
   `ringClasses` on the same input; an unknown category returns nothing and
   throws nothing.
2. **`tests/spine.test.mjs`** — `category` in the core columns and not in
   the attribute columns; the union of the two tables unchanged;
   `SPLIT_COLUMNS` unchanged; a core record read before any shard has landed
   answers with its category.
3. **`tests/build-index.test.mjs`** — `manifest.schema` bumped;
   `manifest.categories` present with the ids in use and their counts,
   **absent** for a dataset in which no event has a category; the exact
   manifest assertion updated; both indexes rebuilt and fresh.
4. **`tests/map-browser.test.mjs`**, in the shape its existing tests have
   (`{ skip }`, `withBrowser`, `open(page, url('?fixtures=1'), READY)`,
   `page.eval` returning plain JSON, `waitFor` and never a timer):
   - an event with a category has a `circle.mark` **and** a `use.glyph`, and
     one with none has the circle alone;
   - the glyph has no `data-id`, is not focusable, and a click at its exact
     centre selects the mark under it;
   - walking the chain reddens the glyph with its mark (the classes agree);
   - a cluster has a badge and no glyph, and spreading it gives each member
     its own;
   - turning a category off removes exactly its marks **on the same frame**,
     with no shard fetched in between, and leaves the uncategorised drawn;
   - `?layers=events:war` opens with the wars drawn, every other
     **categorised** event hidden and the uncategorised still drawn, and the
     URL round-trips.
   The fixtures must carry at least three events with three different
   categories and one with none; `tests/fixtures/data/` and its index are
   updated in the same commit.
5. **`tests/timeline-browser.test.mjs`** — a bar wide enough carries its
   glyph; a bar below the threshold does not; a state change adds fewer than
   ten elements and removes ten (the existing assertion, still green, which
   is what proves the glyph went through `reuse`).
6. **`tests/phone-browser.test.mjs`** — under 720 px the options drawer
   shows the collapsed `<details>` as one target of at least `--touch`;
   opening it reveals one row per category in use, each with its glyph.
7. `tools/screens.mjs` gains `glyphs-legend` (the control open, which is the
   contact sheet the owner judges the twelve by eye from) and `glyphs-map`;
   both PNGs committed under `docs/screens/`.
8. `tests/site.test.mjs` green — `glyphs.js` in `CLAUDE.md`'s layout tree in
   the commit that adds it, no hex value under `src/`, importable without a
   DOM.
9. `node tools/validate.mjs --index` byte-identical; `node --test` green
   with `CHROME` set.

## The twelve symbols

Line art in the azulejo manner: geometric, one weight, no fill, legible at
ten pixels, and none of them a UI control. A starting shape each — the run
draws them, the owner judges them by eye off `docs/screens/glyphs-legend.png`
and says which to redraw, and redrawing one is one `<symbol>` and no test:

`war` two crossed blades · `treaty` two hands as two opposed brackets meeting
· `election` a ballot slot with a slip entering it · `revolution` an arrow
turning back on itself · `law` a balance beam on a stem · `founding` a
cornerstone: a square with a rising line · `disaster` a jagged bolt ·
`economy` a coin: a circle with a bar across it · `culture` an arch on two
piers · `science` a pair of dividers · `death` a horizontal rule under a
point · `other` a single short dash.

The owner's judgement is expected and is not a failure of the run: item 5 of
`STATUS.md`'s "Next" already lists the map's labels and merge distance among
the things only a person can settle, and these belong with them.

## Done when

- Every event with a category is drawn with its symbol over its mark on the
  map and at the left of its bar on the timeline; every event without one is
  drawn exactly as it is today.
- `circle.mark` is still a circle, still carries `data-mark`, still takes
  every click and every key, and every browser test that names it passes
  unchanged.
- A glyph reddens, dims and fades with its mark, and never above it.
- The layer control has an "events by category" `<details>`, collapsed, one
  row per category in use, each row carrying its glyph; `?layers=events:war`
  round-trips and narrows on the frame it is clicked.
- `category` is in the core, `manifest.schema` is bumped, both indexes are
  rebuilt, and the measured change in the core's size is in `STATUS.md`.
- Two screenshots under `docs/screens/glyphs-*.png`.
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set; `about.html`, `ARCHITECTURE.md` and `CLAUDE.md`'s layout tree
  updated.
- `STATUS.md` carries this run's deviations, numbered on from the last, and
  the literal line `glyphs done`.

## Deviations this brief takes, numbered on from 506

The run copies these into `STATUS.md` as its own and numbers anything
further from 536.

532. **`category` moves from the attribute shards into the core.** A toggle
     that narrows the map must narrow it on the frame it is clicked, and an
     attribute column arrives with its century. One small integer per
     categorised event, `SPLIT_COLUMNS` unchanged, `manifest.schema` bumped.
533. **The glyph sits centred on the mark, not offset from it.** A2 says
     "beside the mark" meaning "a separate element from the mark"; the badge
     already occupies the upper right of a cluster, and a second thing out
     there would collide with it.
534. **The glyph's colour is chosen against the mark's fill, in five rules.**
     The default mark is paper-filled with a cobalt stroke and an emphasised
     one takes a solid fill, so `--cobalt` normally and `--paper` on
     `.on-path`, `.selected` and `.of-actor`. Existing tokens only.
535. **The toggles list the categories in use, not the twelve allowed.**
     Four of the twelve match a record today; a toggle that hides nothing is
     a lie about what the atlas holds. The manifest gains `categories`
     beside `roles`, which already carries that meaning against
     `rolesAllowed`.

Run protocol: `docs/run-protocol.md` in full — the gate, the claim, a push
after every commit, validator and tests green at every commit, and the
literal line `glyphs done` as its own line under `## Milestones landed`.

## Amendments after review

Written 8 September 2026 by an independent Fable reviewer of the map block, against `origin/briefs-map` and `origin/m0` at 81e5bf1, with the owner questions answered as recommended (the ceiling is the base map's, 8 MB, with 24 MB for all of `data/geo/`; M39 split in two; one name on the face and no "local" name; the glyph drawn at the mark's diameter); the owner may overrule. **These override the body where they differ** (run protocol §3). The full review is `docs/review-2026-09-08-map-block.md`.

A0. §4: the filter is written in this run — one removal in `workingSet`
(`src/emphasis.js`), applied where the lens is, so the map, the timeline,
the graph and the corner count agree; `main.js`'s checkbox handler writes
A11's token set (`events` replaced by one `events:<id>` per category still
on); `tests/emphasis.test.mjs` holds the rule that an uncategorised event
is removed by no category token.
A1. §2: the glyph's box is the mark's diameter — 10 units at `k = 1`,
divided by `k` — stroke 1, the mark's fill its ground; six units is struck.
A2. Tests: `tests/fixtures/data/categories.json` is added with three ids
and three fixture events take one each; the fixture manifest then carries
`categoriesAllowed` and `categories`.
A3. `manifest.schema` is one more than the gate commit's; deviations are
numbered on from the last in `STATUS.md` at the gate.

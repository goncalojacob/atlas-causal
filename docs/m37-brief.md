# Build brief — M37: the base map drawn

M36 wrote six layers of Natural Earth geometry into `data/geo/base/` and
nothing reads them. This run draws them: one layer per kind, under the
territories and under the marks, appearing as the reader zooms in, each one
switchable from a layer control that is rebuilt out of the manifest and is
the map's only legend. Runs on `m0` after M36, in two gated sub-runs, from
`docs/plan-2026-09-05.md` decisions 9 and 14 and
`docs/m30b-brief.md` amendments A11 and A12.

Read `CLAUDE.md` (no map library, no tiles, no runtime dependency, no build
step; the azulejo direction — every colour is a variable in
`src/style.css` and no new hex value is added; the layout tree, which
`tests/site.test.mjs` holds every module to), `STATUS.md`,
`ARCHITECTURE.md` (revision 23 after M36: `data/geo/base/`, the `base`
manifest block, the layer order at ~2203, the emphasis hierarchy at
~241–245, `layers` and `?layers=` at ~2147–2157, `## Scale, for the record`
at ~2511–2593), `docs/run-protocol.md`, `docs/m36-brief.md` **including its
amendments**, `docs/m30b-brief.md` A11 and A12, `docs/plan-2026-09-05.md`
decisions 9 and 14, `docs/map-block-plan.md`, then `src/map/map.js`,
`src/map/grid.js`, `src/map/layers/land.js`, `layers/presences.js` (the
detail ladder, the signature, the deferred first fetch, the token, the
failure note), `layers/regions.js` (a layer that asks for its own data the
first time it needs it), `layers/events.js`, `src/data.js`
(`loadGeometry`, `loadedGeometry`, `loadRegionPolygons`), `src/render-key.js`,
`src/state.js` (`LAYERS`, `EVENTS_LAYER`, `parseState`, `formatState`),
`src/main.js` (`LAYER_ROWS`), `src/util/viewport.js`, `src/style.css`
(the tokens at `:root`, `.bar .layers`, the map block from ~567, the phone
media query at ~544–557), `index.html`, `tests/map-browser.test.mjs`,
`tests/phone-browser.test.mjs`, `tests/state.test.mjs`,
`tests/render-key.test.mjs`, `tests/spine-pages.test.mjs`,
`tools/screens.mjs` — and this file including its "Amendments after review"
if one is present, which override the body where they differ (run protocol
§3).

The gate line is the literal `M36 done` on `origin/m0`. Before writing
anything, check the gate commit for the four things this brief assumes M36
left behind: `manifest.base` with six layers and their cells,
`manifest.schema` 7, `src/map/grid.js` with `cellsFor`, and a fixture base
map under `tests/fixtures/data/geo/base/`. Write what is missing; do not
write again what is there.

## 1. `src/map/layers/base.js` — one module, six layers

One new layer module, not six: the six differ in a class name and a geometry
type, and six modules that each draw a path would be five copies of
`land.js`. Everything about a layer that is not code comes from the
manifest.

`createBaseLayer(group, projection, { id, geometry, minZoom, world, cells,
load, loaded, onReady })` returns `{ render({ k, view, on }) }`.

- **What it draws.** `geometry: "polygon"` and `"line"` are `geometryPath`
  from `land.js` — the one implementation, as `regions.js` already reuses
  it; `"point"` is a `<circle r={R / k}>` per feature, with a `<title>`
  giving the name, and nothing else. No labels: labels are M38's, and
  drawing them here would mean writing the placer twice.
- **When it draws.** A layer is drawn when it is on, and `k >= minZoom`
  (the manifest's), and then per feature when `k >= z` (the data's). Neither
  number is in code. A layer below its zoom draws nothing **and fetches
  nothing**: an off or too-far-out layer costs no request, which is the rule
  `map.js` already applies to the territories.
- **Far, then near.** Above `minZoom` the far file is asked for once and
  drawn. From `NEAR_ZOOM` — one named constant beside `MAX_ZOOM` in
  `map.js`, passed in — the layer additionally asks for the cells
  `cellsFor(viewBbox)` names, drops the far file's features inside a cell it
  has in hand, and draws the cell's. The far picture is never cleared while
  a cell is in flight: the coarse coastline is the right coastline, only
  less of it, and a blank flash would be worse than a frame of coarseness —
  which is what `presences.js` already argues about a shard.
- **A signature, as `presences.js` has one.** `${on}|${minZoom<=k}|${bucket(k)}|${cells in hand, sorted}`;
  equal signature, no rebuild. Moving the band, selecting an event or
  changing the grouping must not rebuild four thousand paths, and the zoom
  enters the signature through a bucket and not as a float.
- **Path strings are cached by `${projectionKey}|${file}|${tolerance}`**,
  exactly as `presences.js` caches its outlines, and simplified again by
  zoom with `simplifyGeometry` through the same three-rung ladder
  (`detailFor`). The ladder moves to a shared export rather than being
  copied: one file decides how much detail a zoom is worth.
- **A cell that will not load is dropped quietly.** No note in the corner:
  `.map-note` means "the picture is not the one you asked for", and a
  missing river says nothing false — it is simply absent. The request is not
  held on to, so the next pan into that cell asks again, which is
  `regions.js`'s rule and `data.js`'s.
- `pointer-events: none` on every base layer, and no `data-` attribute that
  any click handler reads. A river is not a control; `map.js`'s "a click on
  the sea puts down what the reader was holding" must go on working over a
  river, a lake and a city dot alike, and `e.target.closest('[data-id],
  [data-cluster], [data-actor]')` must not start matching a base feature.

`src/data.js` gains `loadBase(file)` and `loadedBase(file)` beside
`loadGeometry` and `loadedGeometry`, with the same cache discipline: one
request in flight per file, a rejection deleted rather than remembered, and
a synchronous reader so a render never waits. `manifest.base` absent means
no base map at all and no request of any kind — the atlas exposes
`atlas.baseLayers` as an empty array and every layer is silently off.

## 2. Where the layers go, and what they look like

In `map.js`, between `landGroup` and `presencesGroup`:

```
viewport.append(landGroup, baseGroup, presencesGroup, regionsGroup, eventsGroup);
```

with one `<g class="layer layer-base layer-base-<id>">` inside `baseGroup`
per layer of `manifest.base.layers`, in the manifest's order, built once at
construction. Under the territories, because a border is a claim and a river
is the ground it is drawn on; over the coastline, because a river inside the
land is the point. **The emphasis hierarchy is untouched**
(`ARCHITECTURE.md` ~241–245): territory hue under the selected actor's
cobalt under the walked chain's madder, and nothing this run adds goes above
any of the three. The base map is the quietest thing on the page.

Colours and weights are existing tokens only — **no new hex value and no new
token**:

| layer | fill | stroke | weight |
|---|---|---|---|
| coast (near) | `--land` | `--cobalt` | as `.land` today, `vector-effect: non-scaling-stroke` |
| rivers | none | `--cobalt-soft` | hairline, non-scaling |
| lakes | `--cobalt-faint` | `--cobalt-soft` | hairline |
| physical | none | `--line` | hairline, dashed |
| mountains | `--ink-soft` | none | a 1.5-unit dot ÷ k |
| cities | `--ink-soft` | `--paper` | a 2-unit dot ÷ k, haloed as the marks are |

Every size is divided by `k` where it is a mark on the page and left alone
where it is a stroke, which is the rule `events.js` and `presences.js`
already follow. Nothing here uses the type scale: there is no text in this
run.

**The near coastline replaces the far one where it lands.** `land.js` keeps
drawing `manifest.land` and is otherwise untouched; the `coast` base layer
draws over it in the cells it holds and the far path underneath is hidden
for those cells rather than deleted, so a cell that is dropped from cache
leaves a correct picture.

## 3. The layer control, rebuilt from the manifest

`src/main.js` builds the control today from a two-row literal. It becomes
four things, in this order, and every label and id goes through `esc()` —
`data/categories.json` and `manifest.base` are data from `data/`, and data
from `data/` is untrusted input:

1. `territories` — a checkbox, as today.
2. `events` — a checkbox, as today.
3. `<details><summary>base map</summary>` — one checkbox per layer of
   `manifest.base.layers`, in the manifest's order, labelled by the layer
   id, each with a small swatch drawn by a CSS class per layer so the
   control says what the colour on the map means. Collapsed.
4. `<details><summary>events by category</summary>` — **the glyph run's**
   (`docs/glyphs-brief.md` §4), which runs before this one and builds it,
   with `manifest.categories` and a glyph on every row. This run leaves it
   exactly as it found it and only makes room for it beside the base-map
   group. **If the glyph run has not landed at this gate**, M37b builds the
   `<details>` and `manifest.categories` under the glyph brief's §4 rules —
   the categories in use and not `categoriesAllowed`, collapsed, everything
   through `esc()` — and the glyph run later fills in the glyphs and nothing
   else.

Two visible rows and two collapsed groups: the phone drawer keeps four
targets and not nineteen (`src/style.css` ~544–557,
`tests/phone-browser.test.mjs:134-153`). Coastlines have no row — they are
the ground everything else is read against and are always drawn (plan
decision 14, already true since M30b-3).

**The control is the legend, and it is the only one.** There is no legend by
territory hue and there is not going to be one (`ARCHITECTURE.md` ~218–245);
the swatch beside a base layer and — after the glyph run — the glyph beside
a category are the whole of what the map explains about itself, and
`about.html` says so in prose.

## 4. `?layers=`, widened without breaking a link

`LAYERS` in `src/state.js` gains the five base ids after the three it has:

```js
export const LAYERS = Object.freeze(['land', 'territories', 'events',
  'rivers', 'lakes', 'physical', 'mountains', 'cities']);
```

- `land` stays a member with no checkbox, as M30b A11 left it; `coast` is
  **not** a member — the near coastline is the coastline, and a switch that
  turned off half of it at one zoom would be a switch for a level of detail.
- `defaultState()` is `[...LAYERS]`, so everything is on by default and
  `formatState` writes `?layers=` only when the reader has turned something
  off — which is what it does today. `tests/state.test.mjs`'s `defaultState`
  assertion is updated in the same commit.
- `parseState` needs no new shape: it already keeps any token in `LAYERS`
  and any token matching `events:<slug>`.
- **An old link that named a subset now also turns the base layers off.**
  `?layers=territories,events`, written before rivers existed, says "these
  and nothing else" and is read that way. The alternative — treating a
  layer absent from an old link as on — makes turning a base layer off
  impossible to express in the URL at all. Nothing is published yet and no
  such link is in circulation; deviation 522 records it.

`src/share.js` is untouched: `?layers=` is what the reader did to the view,
not a record's address, and a record's own link carries none of it.

## 5. Performance, and what must not regress

- At `k = 1` the base map costs **nothing**: every layer whose `minZoom` is
  above 1 fetches nothing, and the two that are not (`rivers`, `lakes`)
  fetch one far file each of at most 350 KB, after the first paint, behind
  the same `defer` the territories use — a frame, then a task.
- First paint is unchanged from M36: manifest, core, sources, land, palette.
  `tests/spine-pages.test.mjs` must show **no new request before the first
  picture**, and that is an assertion of this run and not a hope.
- At `k = 8` over Portugal the DOM must stay bounded: the near cells of one
  viewport, and nothing outside `cellsFor`. A browser test counts the
  elements under `.layer-base` and asserts a ceiling.
- `tests/bench/run.mjs` gains a `base` case beside `presences`: grouping and
  path-building for the busiest cell at three zooms, printed, never
  asserted. `STATUS.md` records the ratio measured on the run's own machine.
- The map redraws on every pan; the signature is what keeps a pan from
  rebuilding the world. A browser test pans and asserts the layer's element
  count is unchanged and its first path node is the same node.

## What this run must not do

- **No new hex value, no new token, no new type size.** Every colour is a
  variable in `src/style.css` already.
- **Nothing above the hierarchy.** No base layer is ever drawn over the
  territories, the marks, the chain or the selected actor, and none of them
  is clickable, focusable or in the tab order.
- **No new data.** No record, no geometry, no manifest field except
  `manifest.categories` (the ids in use, which the build already knows).
  `data/geo/` is not touched.
- **No fetch for a layer that is off or below its zoom**, and no fetch
  before the first paint.
- **No labels.** They are M38's, and the placer must be written once.
- **No glyphs.** They are the glyph run's; this run leaves the "events by
  category" rows without them and the glyph run adds them
  (`docs/glyphs-brief.md`). If the glyph run has already landed, the rows
  carry the glyphs and this brief's item 3.4 says so.
- **No map library, no tile server, no runtime dependency, no build step.**
- Do not touch `src/map/projection.js`. M39 owns the projection and it has
  already run.

## Tests

1. **`tests/base-layer.test.mjs`** (Node, no browser) — `createBaseLayer`
   against a fake group and a synthetic manifest layer: below `minZoom` it
   draws nothing and calls `load` never; above it, it asks for the far file
   once and draws on arrival; a feature whose `z` is above `k` is not drawn;
   an equal signature rebuilds nothing (the same element nodes come back); a
   rejected fetch is not remembered and the next render asks again; a
   `"point"` layer draws circles and a `"polygon"` layer draws paths; a
   layer with no cells and no world file draws nothing and throws nothing.
2. **`tests/grid.test.mjs`** extended — `cellsFor` over the boxes
   `viewBboxIn` really produces at `k = 1, 4, 8` from `tests/viewport.test.mjs`'s
   own fixtures, including one that crosses the seam.
3. **`tests/render-key.test.mjs`** — the map's key changes when a base file
   lands and when a layer is switched, and does not change when the reader
   pans within one cell at one bucket.
4. **`tests/state.test.mjs`** — `defaultState().layers` is the eight;
   `?layers=territories,events` parses to those two; `?layers=rivers`
   round-trips; a token nobody recognises is dropped; `events:war` still
   parses beside them.
5. **`tests/map-browser.test.mjs`**, in the shape its existing tests have
   (`{ skip }`, `withBrowser` at 1400 × 620, `open(page, url('?fixtures=1'),
   READY)`, `page.eval` returning plain JSON, `waitFor` on a predicate and
   never a timer):
   - the base map is drawn under the territories and over the coastlines —
     the `.layer-base` group's index among `.viewport`'s children is between
     `.layer-land` and `.layer-presences`;
   - at the whole world no cell has been fetched
     (`performance.getEntriesByType('resource')` names no `geo/base/*/`
     file);
   - zoomed in, the cells of the viewport and no others are fetched, and the
     element count under `.layer-base` is under its ceiling;
   - a click on a river selects nothing and clears what was held, exactly as
     a click on the sea does;
   - turning `rivers` off empties its group and adds no request; turning it
     on again draws from cache;
   - `?layers=territories,events` opens with no base layer drawn and the two
     boxes unchecked.
6. **`tests/phone-browser.test.mjs`** — under 720 px with the options drawer
   open, the layer control shows four targets (`territories`, `events`, and
   the two `<summary>` elements), every one at least `--touch` tall; opening
   "base map" reveals five checkboxes; the drawer still scrolls.
7. `tools/screens.mjs` gains `m37-base-world` and `m37-base-lisbon` to
   `SHOTS` (`?bbox=` doing the zooming, since the state is the URL), and the
   two PNGs are committed under `docs/screens/`.
8. `tests/site.test.mjs` unchanged and green — `base.js` named in
   `CLAUDE.md`'s layout tree in the commit that adds it, no hex value in
   `src/`, every module importable without a DOM.
9. `node tools/validate.mjs --index` byte-identical, with both indexes
   rebuilt in the same commit as anything that changes them; `node --test`
   green with `CHROME` set.

## The two sub-runs

- **M37a — the layers.** `src/map/layers/base.js`, `atlas.loadBase`, the
  groups in `map.js`, the shared detail ladder, the render key, the styles,
  the zoom and cell logic. No control: the layers are all on and there is no
  way to turn one off yet, which is what `?layers=` already means for a name
  it does not know. Tests 1, 2, 3, 5 (first four bullets), 8, 9. Done line
  `M37a done`.
- **M37b — the control and the URL.** `LAYERS` widened,
  `manifest.categories`, the control rebuilt in `main.js` with the two
  `<details>`, the swatches, the phone layout, `about.html`'s paragraph on
  what the control is and that it is the map's only legend,
  `CONTRIBUTING.md` untouched, `ARCHITECTURE.md`'s `layers` paragraph and
  module table. Tests 4, 5 (last two bullets), 6, 7, 9. Done lines
  `M37b done` and then `M37 done`.

## Done when

- Six base layers are drawn on the real data, under the territories and over
  the coastlines, appearing at the zooms the manifest names and never above
  the emphasis hierarchy.
- At the whole world the base map costs no request before the first paint
  and no cell at all; zoomed to a country, only the viewport's cells are
  fetched, and the DOM under `.layer-base` stays under its ceiling.
- The layer control is built from the manifest: two rows and two collapsed
  groups, the base layers with their swatches beside the glyph run's
  categories, and four targets on a phone.
- `?layers=` carries every one of them; `?layers=territories,events` parses
  and opens with the base map off; every existing `?layers=` link parses.
- No base feature is clickable, focusable or in the tab order, and a click on
  one behaves exactly as a click on the sea.
- Two screenshots under `docs/screens/m37-*.png`.
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set; `ARCHITECTURE.md` and `CLAUDE.md`'s layout tree updated.
- `STATUS.md` carries this run's deviations, numbered on from the last, and
  the literal line `M37 done`.

## Deviations this brief takes, numbered on from 506

The run copies these into `STATUS.md` as its own and numbers anything
further from 527.

521. **One layer module, not six.** The six kinds differ in a class name and
     a geometry type; six modules would be five copies of `land.js`, and the
     one thing they must agree about — the order they are drawn in — is the
     manifest's, not the code's.
522. **An old `?layers=` link turns the base layers off.** A link that named
     a subset before rivers existed is read as "these and nothing else". The
     alternative makes turning a base layer off inexpressible. Nothing is
     published and no such link is in circulation.
523. **`coast` is not in `LAYERS`.** The near coastline is the coastline;
     a switch for it would be a switch for a level of detail, and the
     coastlines are always drawn (plan decision 14).
524. **The category toggles are not this run's**, though decision 14 puts
     them in the same control: `docs/glyphs-brief.md` §4 builds them, with
     `manifest.categories` and a glyph a row, and runs first. This run adds
     the base-map group beside them. Whichever of the two is second finds
     its neighbour already there and leaves it alone.
525. **A base file that will not load is dropped without a word.** The
     territories' note exists because a stale border says something false; a
     missing river is absent and says nothing.
526. **The detail ladder moves out of `presences.js` into a shared export.**
     Two ladders would drift, and how much detail a zoom is worth is one
     question about the map, not one per layer.

Run protocol: `docs/run-protocol.md` in full — the gate, the claim, a push
after every commit, validator and tests green at every commit, and
`M37a done`, `M37b done`, `M37 done` each as its own line under
`## Milestones landed`.

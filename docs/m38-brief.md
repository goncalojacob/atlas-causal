# Build brief — M38: the base map's labels

M37 drew rivers, lakes, mountains, physical regions and cities and named none
of them: a map of unlabelled dots is a decoration. This run gives them names —
one shared placer for every label the map draws, event labels beating city
labels beating physical features, the modern name, the local name and the
dated name a place record carries, and the halo scaled by zoom as the marks'
labels already are. Runs on `m0` after M37, in two gated sub-runs, from
`docs/plan-2026-09-05.md` decisions 6 and 9 and
`docs/review-2026-09-05-plan.md` finding 27 ("two label placers will collide →
one shared placer with priorities").

Read `CLAUDE.md` (the azulejo direction: no new hex value, and type sizes come
from the scale in `style.css` and nowhere else; the layout tree), `STATUS.md`,
`ARCHITECTURE.md` (revision 23: `data/geo/base/`, the layer order, the
emphasis hierarchy, the place record's `historicalNames` at ~1163–1172 —
"Nothing reads it yet — the base map's label layer will, so that a city is
labelled by the year on the slider"), `docs/run-protocol.md`,
`docs/m36-brief.md` and `docs/m37-brief.md` **including their amendments**,
`docs/m30a-brief.md` §2 (`historicalNames`), `docs/plan-2026-09-05.md`
decisions 6 and 9, `docs/map-block-plan.md`, then
`src/map/layers/events.js` (`drawLabels`, `LABEL_SIZE`, `LABEL_HALO`,
`LABEL_ZOOM`, `LABEL_LIMIT`, `LABEL_CHARS`, `shorten`, the spread labels),
`src/map/layers/base.js`, `src/map/map.js`, `src/util/window.js`
(`resolveWindow` — the year a label is dated to), `src/util/dates.js`,
`src/attributes.js` (`labelOf`, `LOADING_LABEL`), `src/util/esc.js`,
`src/style.css` (`.map .mark-label` at ~637, the type scale at ~123–135),
`data/imports/naturalearth-places.json`, `tests/map-browser.test.mjs`,
`tools/screens.mjs` — and this file including its "Amendments after review"
if one is present, which override the body where they differ (run protocol
§3).

The gate line is the literal `M37 done` on `origin/m0`.

## 1. `src/map/labels.js` — one placer, pure

There is one placer on this map and there is never a second. It is pure, it
touches no DOM, and both callers hand it the same shape:

```js
placeLabels(candidates, { k, view, limits })
// candidate: { id, text, x, y, priority, weight }
// → [{ id, text, x, y, box }] in draw order
```

- **Order.** By `priority` ascending, then `weight` descending, then `id` —
  deterministic, so the same picture places the same labels twice.
  Priorities: **0 events, 1 cities, 2 physical features** (plan decision 9:
  "event labels beating city labels beating region labels"). A mountain peak
  is a physical feature; a river and a lake are labelled as physical
  features too, along their own geometry's label point.
- **Collision.** Greedy: a label whose box overlaps one already placed is
  **skipped, not nudged**, which is `events.js`'s existing rule and the
  reason labels never drift away from the thing they name. The box estimate
  is `events.js`'s, moved here unchanged — an em is about half the font
  size, and the box only has to be good enough to keep two labels apart.
- **Limits, per priority**, so a hundred cities can never crowd out the
  events: events 12 (`LABEL_LIMIT` today, unchanged), cities 24, features 8.
  Passed in; the placer holds no number of its own but the box arithmetic.
- **Off screen is not a candidate.** A label whose anchor is outside `view`
  is dropped before ordering, exactly as `drawLabels` drops it today.

`events.js`'s `drawLabels` is deleted and its behaviour moves here. Its
**spread** labels stay where they are: those are positions around an opened
stack, not competitors for space on the map.

## 2. One label round, in `map.js`

`map.js` gains a `<g class="layer layer-labels">` **after** `eventsGroup` and
a label round at the end of `draw()`: it asks the base layer and the events
layer for their candidates (`labelCandidates()`, a pure list, no drawing),
calls `placeLabels` once, and draws the result itself.

Drawing them in one group is the only way one placer can be true: two layers
each placing their own would be the two placers finding 27 warned about, with
a different name. The class on an event's label stays **`.mark-label`**, so
every selector and browser test that names it goes on matching; what changes
is which group it hangs in. A city's label is `.city-label`, a physical
feature's `.feature-label`.

- **Size and halo.** One size for all three, `11`, which is `--text-xs` and
  is what `LABEL_SIZE` already is; `font-size: 11 / k` and
  `stroke-width: LABEL_HALO / k` on every label, so a label is the same size
  on screen at four times in as at one and the paper halo behind it does not
  grow with the zoom (`events.js`'s comment, which is the reason it is done
  that way). A physical feature is told apart by `--ink-soft` and
  `--tracking-label`, not by a size nobody put in the scale.
- **`pointer-events: none`** on the whole group, no `data-id`, no `tabindex`.
  A label is not a control; the mark or the dot under it takes every click,
  and `map.js`'s "a click on the sea puts down what the reader was holding"
  must go on working under a label.
- **Zoom.** Event labels from `LABEL_ZOOM = 4`, unchanged. City and feature
  labels from the feature's own `zl` where M36's import wrote one and `z + 1`
  otherwise — a dot appears before its name, which is what every map does.
  M38a extends `tools/import/features.mjs` with `zl` (one small integer per
  feature; Natural Earth's own label rank where the committed file has one,
  `z + 1` where it does not), re-runs `naturalearth.mjs` — it is offline and
  idempotent — and reprints the budget table. The budget does not move
  measurably and the run says so with the number.
- **The render key** gains nothing: labels are a function of what is already
  in the key (the transform, the window, the layers, the shards arrived).
  If a label depends on the window's far end — and a dated one does — that
  is `resolveWindow(s, atlas.extent)`, which is in the key already.

## 3. The three kinds of name

**A city's label is one name, and the rest is in its title.** A map with two
names on every city is unreadable at twenty-four labels a screen, so:

- **On the face of the map**, in this order of preference: the **dated name**
  from the place record's `historicalNames` whose interval contains the far
  end of the reader's window; failing that, the **modern name** Natural Earth
  gives.
- **In the `<title>`** — what a hover says — all of them: the modern name,
  the local-language name where Natural Earth gives one that differs, and
  every dated name with its years ("Lourenço Marques, 1895–1976"). One line,
  built by a pure function, everything through `esc()`.
- `to: null` in `historicalNames` means still current. A window whose far end
  falls in no dated interval falls back to the modern name; a place record
  with no `historicalNames` is the modern name and nothing else. **Nothing is
  invented**: a city the atlas has no dated name for is not given one because
  the year suggests it.

Which place record a Natural Earth city is remains **data, not code**:
`data/imports/naturalearth-places.json`, written by M36c, matched on
`wikidata` first and never guessed. A place record with no city in the
import map is labelled where it stands from the place record itself — the
atlas names it, so the map names it — at priority 1 beside the cities, and
this is how a town Natural Earth has never heard of gets on the map.

**A physical feature's label** is its Natural Earth name at its label point,
and there is no dated name for a desert: `historicalNames` is a field on a
place record and physical features are not records.

## What this run must not do

- **No second placer.** Not in `events.js`, not in `base.js`, not "just for
  the spread".
- **No new hex value, no new type size.** One size, `--text-xs`, which is
  what the map already uses; colour from `--ink` and `--ink-soft`, halo from
  `--paper`.
- **No label is a control.** No `data-id`, no `tabindex`, no click handler,
  no hit area.
- **No invented name.** A dated name comes from a place record a person
  wrote or will review; the local name comes from the source file; nothing
  is transliterated, translated or inferred.
- **No new record and no new field on a record.** `historicalNames` exists
  since M30a; this run reads it and writes nothing under `data/` but the
  re-run base map (`zl`) and the regenerated index.
- **No new fetch before the first paint**, and no fetch at all for a layer
  that is off or below its zoom. A label costs no request of its own: it is
  in the file the dot came from.
- Do not touch the projection, the emphasis hierarchy, or the territories.

## Tests

1. **`tests/labels.test.mjs`** (Node, pure) — order by priority then weight
   then id; an event label placed where a city label wanted the same box and
   the city skipped, never moved; per-priority limits respected
   independently; a candidate outside `view` dropped; the same input twice
   gives the same output; a text of zero length placed like any other; the
   box arithmetic matches what `events.js` computed before the move (a
   regression fixture of ten candidates and their boxes).
2. **`tests/base-labels.test.mjs`** — the name chosen: the dated name when
   the window's far end is inside its interval, the modern name when it is
   not, the modern name when the place has no `historicalNames`, and the
   modern name when the interval is `to: null` and the year is after `from`;
   the title lists modern, local and every dated name with years; a name
   with `<` and `&` in it comes out escaped; a place record with no Natural
   Earth match still becomes a candidate.
3. **`tests/import-naturalearth.test.mjs`** extended — `zl` written for
   every feature, from the label rank where the fixture file has one and
   `z + 1` where it does not; the import still byte-identical on a second
   run.
4. **`tests/map-browser.test.mjs`**, in the shape its existing tests have —
   at `k = 1` no city label is in the DOM; zoomed to Portugal, Lisbon's
   label is drawn once and its `<title>` names the place record's variants;
   an event label and a city label never overlap, and where they compete the
   event's is the one drawn; the halo's `stroke-width` at `k = 8` is an
   eighth of what it is at `k = 1`; a click at a label's centre selects the
   mark under it, or nothing where there is no mark; `.mark-label` is still
   found by the selector the existing tests use.
5. `tools/screens.mjs` gains `m38-labels-iberia` and `m38-labels-world`;
   both PNGs committed under `docs/screens/`.
6. `tests/site.test.mjs` green — `labels.js` in `CLAUDE.md`'s layout tree in
   the commit that adds it, no hex value, importable without a DOM.
7. `node tools/validate.mjs --index` byte-identical after the import re-run,
   both indexes rebuilt in that commit; `node --test` green with `CHROME`
   set.

## The two sub-runs

- **M38a — the placer, and the cities by their modern names.**
  `src/map/labels.js`; `drawLabels` moved out of `events.js`; the
  `layer-labels` group and the label round in `map.js`; `labelCandidates()`
  on both layers; `zl` in `features.mjs` and the import re-run; city labels
  from the modern name, with their `<title>`. Tests 1, 3, 4 (bullets 1, 2,
  5, 6), 6, 7. Done line `M38a done`.
- **M38b — the dated names, the local names and the physical features.**
  `historicalNames` read by year; the full `<title>`; place records with no
  Natural Earth match labelled from the record; physical feature, river,
  lake and peak labels at priority 2; `about.html` on why a city may carry
  the name it had in the year on the band, and that the atlas invents none;
  `ARCHITECTURE.md`'s note that `historicalNames` now has a reader. Tests 2,
  4 (bullets 3, 4), 5. Done lines `M38b done` and then `M38 done`.

## Done when

- One placer places every label the map draws, and `grep` finds no second
  one.
- At `k = 1` there are no city or feature labels; zoomed to Iberia there are,
  and no two of them overlap.
- An event's label wins its box against a city's; a city's wins against a
  desert's.
- Lisbon is labelled from `data/places/lisbon.json` and its title names every
  variant the record holds; a city with a dated name in a place record is
  labelled by the year the band's far end is at, and a city with none keeps
  its modern name.
- Every label's font size and halo are divided by `k`, and the halo at
  `k = 8` is an eighth of what it is at `k = 1`.
- No label is clickable, focusable or in the tab order.
- Two screenshots under `docs/screens/m38-*.png`.
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set; `ARCHITECTURE.md`, `about.html` and `CLAUDE.md`'s layout tree
  updated.
- `STATUS.md` carries this run's deviations, numbered on from the last, and
  the literal line `M38 done`.

## Deviations this brief takes, numbered on from 506

The run copies these into `STATUS.md` as its own and numbers anything
further from 532.

527. **Labels leave the layers and are drawn in one group of their own.**
     One placer cannot be true while two layers each place their own, and
     finding 27 asked for one placer. `.mark-label` keeps its class so every
     existing selector and browser test still matches; only its parent group
     changes.
528. **A city carries one name on the map and all of them in its title.**
     Decision 9 asks for the modern name and the local name; two names on
     twenty-four labels is an unreadable map. The face takes the dated name
     where a place record gives one for the year and the modern name
     otherwise; the local name and every dated name with its years are what
     a hover says. **Owner question** — the alternative is both names on the
     face, at half the labels per screen.
529. **A label's zoom is `zl`, a second small integer per feature**, written
     by re-running M36's import rather than derived at draw time: a dot
     appears before its name, and how much before is Natural Earth's
     judgement where the file records one.
530. **One type size for all three kinds of label**, `--text-xs`, which is
     what the map already uses; a physical feature is told apart by colour
     and letterspacing. Inventing a second size for the map would be a size
     that is not in the scale.
531. **A river and a lake are labelled as physical features**, at priority 2
     and along their own geometry, rather than getting a priority each. They
     compete with deserts for the same space and losing to a city is the
     right outcome for all three.

Run protocol: `docs/run-protocol.md` in full — the gate, the claim, a push
after every commit, validator and tests green at every commit, and
`M38a done`, `M38b done`, `M38 done` each as its own line under
`## Milestones landed`.

# Build brief — M30c: a parent event looks like one, on every view, always

Asked by the owner on 8 September 2026: "it should be possible to
distinguish in the map, timeline and graph the parent events." M30b-2 gave a
parent a *behaviour* in two views — a bracket over its parts on the timeline
where the parts share one lane, a collapsed badge on the graph while the
reader is zoomed out — and nothing on the map. Neither is a *look*: a parent
whose parts are spread over lanes, or under `group: none`, or at a zoom
where nothing collapses, is drawn exactly like any other event. This run
gives a parent one look, the same on the three views, at every zoom and
under every grouping, and leaves the two behaviours as they are.

**Read**, in this order: `CLAUDE.md` (the visual direction: azulejo, no new
hex value, sizes from the tokens; the hierarchy of emphasis — selected
cobalt over every hue, the walked chain madder over that), `STATUS.md`,
`docs/run-protocol.md`, `docs/m30b-brief.md` A7–A9 and what M30b-2 recorded,
`src/map/layers/events.js` (`appendMark`, `MARK_RADIUS`, `BADGE_SIZE`, the
label halo), `src/timeline.js` (the bars layer, `reuse`, `large.js` and the
brackets layer), `src/graph-view/graph-view.js` (the node markup, the
`collapsed` class, the badge), `src/graph-view/collapse.js`, `src/data.js`
(`atlas.childrenOf`), `src/style.css` (`.mark`, `.bar`, `.node`, the tokens),
`tests/map-browser.test.mjs`, `tests/timeline-browser.test.mjs`,
`tests/graph-browser.test.mjs`, `tests/site.test.mjs` (no hex outside
`:root`; every module named in `CLAUDE.md`), and the fixtures' parent with
two children (M30a-3).

## 1. The one look

A parent — an active event that `atlas.childrenOf` lists at least one active
child for — is drawn with a **second, thinner outline outside its own**, a
ring, in the same colour the mark would have had, at a fixed gap from it.
That is the whole convention: a ring says "there is more inside". It is
drawn under the hierarchy of emphasis, so a selected parent is a cobalt ring
around a cobalt mark and a parent on the walked chain a madder ring around
a madder mark; the lens dims it with its mark; a retracted or merged event
is never a parent for this purpose.

- **Map** (`src/map/layers/events.js`): a `<circle class="ring">` appended
  beside the mark's `<circle>`, radius `MARK_RADIUS + RING_GAP` in user
  units, `fill: none`, stroke width scaled by `1 / k` like the label halo, no
  `data-id` and no `tabindex`, so every selector that names `circle.mark`,
  `circle.hit` or `circle[data-mark]` still holds and the keyboard path is
  untouched. A cluster that holds a parent gets no ring: a cluster is a
  count, not a record.
- **Timeline** (`src/timeline.js`): a bar of a parent is drawn with a
  second, thinner `<rect class="ring">` two pixels outside it on every side,
  `fill: none`, in the bars layer through the same `reuse` pool, under every
  grouping including `none`. The bracket of M30b-2 stays as it is where it
  is drawn; the ring is what a reader sees where the bracket is not.
- **Graph** (`src/graph-view/graph-view.js`): a node of a parent carries the
  ring at every zoom; the collapsed badge stays and sits on top of it when
  the parts are inside.

`RING_GAP` is one named constant per view, in the units that view's marks
use; the stroke is `var(--line-strong)` or the mark's own token, never a new
value. The class `ring` is the same word on the three views, and
`style.css` styles it once per view under the existing selectors.

## 2. What a ring means, said once

The event card already says "N parts" (M30b-1). `about.html`'s "How to read
it" gains one sentence: a mark with a ring around it is an event with parts;
open it to see them, and "Focus on this" keeps them. `ARCHITECTURE.md`'s
paragraph on parts gains the same sentence.

## 2b. "Focus only on this" goes

Asked by the owner on 8 September 2026: the control is unnecessary. The
lens control (`ctx.lensControl` in `src/panel/panel.js`) keeps **one**
button, "Focus on this", which adds the record to the foci as it does today;
the "only" variant, the `focusAll`-clearing path it took and its tests are
removed, and the `?focus=` grammar is unchanged (a reader who wants one focus
clears the others from the lens bar). The parent's card keeps the one line
saying what the focus would keep. `about.html` and `ARCHITECTURE.md` stop
naming the removed control.

## 3. Tests

- `tests/map-browser.test.mjs`: the fixture parent's mark has a sibling
  `circle.ring` and a leaf's has none; the ring is not focusable; the halo
  test still passes.
- `tests/timeline-browser.test.mjs`: the parent's bar has a `rect.ring`
  under `group: none` and under `group: region`; the element-churn test
  (fewer than ten added and removed on a state change) still passes.
- `tests/graph-browser.test.mjs`: the parent's node has the ring at a zoom
  where nothing collapses and keeps it when collapsed.
- `tests/site.test.mjs` unchanged and green.

## 4. What this run must not do

No new hex value; no size outside the constants and tokens; no change to
`collapse.js`, `large.js` or the brackets; no data touched; the index
rebuilt only if a code change alters it, byte-identical at the end;
nothing merged into `main`.

## Done when

A parent event is told from a leaf at a glance on the map, the timeline and
the graph, at any zoom and under any grouping, by the same ring; the three
browser tests above pass with `CHROME` set; `node --test` green, the skipped
count reported; the "Focus only on this" control is gone from every card and
no test names it; `node tools/validate.mjs --index` byte-identical;
`about.html` and `ARCHITECTURE.md` say what a ring means; `STATUS.md`
carries the literal line `M30c done`.

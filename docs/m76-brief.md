# Build brief — M76: the band follows the selection, the fields go, the graph shows every date

Three instructions from the owner on 21 September, given after seeing M75 on
the public site. Each is quoted; each is the authority for its section.

## 1. The band's profile follows the selection

> **"If for example I select portugal, the map timeline I use to pick the
> dates should show only those events."**

"The map timeline I use to pick the dates" is M75's strip — the two-handled
band on the map. Today it draws its profile over `bandEvents`, which is
`emphasis.js`'s `shown`, so on paper a selection already narrows it. **The
owner says it does not look narrowed when Portugal is selected**, and this
milestone starts by finding out why on the real page, not by arguing from the
code. The candidates, in the order to check:

- **The scale is the corpus's.** The profile is drawn at `density.js`'s
  absolute logarithmic scale over `centuryCounts(atlas.activeEvents)`, so
  Portugal's events are a thin sliver against the world's columns and the
  band looks like the world with less ink. If this is it, the profile over
  a selection is drawn at the selection's own scale — full height for its
  busiest century — and the two years on the row say so.
- **The masthead's hint is what the reader sees.** It sits on the same row
  as the years, it is over the corpus by design (M75, deviation 1000), and a
  reader sees two profiles disagreeing. Section 2 removes it on the map.
- **Selecting Portugal is not a lens on the page the owner used.** Check
  the three ways in: the territory polygon, the search box, and a place or
  actor card. Each must give `shown` = Portugal's events (M48 §2, M54).

Whatever the cause, the test is the sentence: **with Portugal selected, every
column of the band is Portugal's events and nothing else**, on all three ways
in. Selecting an event narrows it to that event and its parts (M65). With
nothing selected it is the resting picture, as now.

## 2. The exact-year fields go

> **"Picking up the dates exactly is unnecessary."** — **"This can be
> removed."**

The masthead's two number fields (`window-control.js`, `from` / `to`) go, and
with them the masthead's density hint on the map, because the band is the one
control there and two profiles on one row is what section 1 is about. Keep:
the count in view, the "show the world" pin, the standing line. The band's
double-click-to-decade and arrow keys stay, so a precise year is still
reachable without typing. **`?from=` and `?to=` in the URL are unchanged** —
a link still opens on its window.

On the timeline view the band is a view of its own already; on the graph see
section 3. If the timeline still needs a way to set the window without the
fields, its own band is that way; say so.

## 3. The graph shows every date

> **"I think the graph can always show all dates, then one can zoom in and
> out and pan to look at different times."**

The graph stops obeying the window. Today `graph-view.js` fades what is
outside it, draws the window as a shaded band across the picture, and rests
the camera on the window. All three go: **every event in `shown` is drawn in
full whatever the window says**, no window band, and the camera at rest fits
the whole of `shown`. Zoom and pan already exist (M61) and are how a reader
looks at a period; they are unchanged. The lens, the walk framing (M74),
labels, confidence and the category switches are unchanged.

The window still exists as state — the map and the timeline read it — and the
graph ignores it. If a test asserts the graph's window band or the fade, the
test changes first (711, 717).

## 4. What this run must not do

No new record, no historical claim, no new hex value, token or type size.
`window-band.js`'s gestures are unchanged; `lanes.js`, `cluster.js`,
`emphasis.js`'s contract (`shown`) unchanged. First paint not slower; say the
numbers against M75's. `validate --index` clean. Nothing merged into `main`;
ignore `docs/drafts/`.

**Numbering.** Lane A's deviations in M75 ran 999–1004 and lane B's in M42
run 950 upward and had reached 1005: the blocks overlap. **Lane A numbers
from 1100 upward from this milestone**; the overlap is recorded, not
rewritten.

## 5. Tests

1. With `?actor=portugal` the band's profile is over Portugal's events only:
   a century Portugal has no event in draws no column. Same via the search
   box and via a territory click.
2. The band's profile over a selection reaches full height for the
   selection's busiest century.
3. No `input[data-window]` in the document; `?from=1900&to=1999` still opens
   on that window; dragging a handle still moves the window and the map
   answers during the drag (M64's test).
4. On the graph, an event outside the window is drawn as one inside it; no
   `.window-band` in the graph; the resting camera fits every drawn node.
5. No test pins a count or a pixel.

## 6. Done when

The three sentences hold on the real page; screenshots
`docs/screens/m76-*.png` at desktop and phone width, restoring every other
picture `tools/screens.mjs` rewrites; `STATUS.md` says which of section 1's
candidates it was, what first paint costs against M75, what the timeline
does for the window now; tests green; `M76 done`.

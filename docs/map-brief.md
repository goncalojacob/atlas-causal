# Build brief — map usability: clusters, level of detail, clicks

Written 2 September 2026, from the owner's first use of the atlas with
real data. Read, completely and in this order, before touching anything:
`CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md` (revision 4), `docs/m2-brief.md`
(rules of engagement), then this file. Rules of engagement are those of
`docs/m4-brief.md`: branch `m0`, small English commits, **push after every
commit**, validator and tests green at every commit, deviations recorded
in `STATUS.md` numbered on from 28, no new hex values, no dependencies, no
build step, no map library, nothing merged, no repository settings
changed, no historical record touched.

## What the owner saw

Thirty-seven of the sixty events sit on the same coordinates (Lisbon,
−9.14 38.72); Luanda and Dili have two each. The map draws one circle per
event at the same point, so the owner sees one dot on Lisbon, can only
click whichever circle was appended last, and cannot tell that anything
is underneath. Zooming in changes nothing, because coincident points
never separate. Separately, the marks are small (r = 4/k) and the "a drag
must not select" guard in `map.js` never fires: `pointerup` sets `drag =
null` before the `click` event arrives, so `drag?.moved` is always
undefined and a drag that ends on a mark selects it.

## What to build

**1. Weight, at index time.** `build-index.mjs` gives every topology event
a `weight`: in-degree + out-degree + number of actors. Deterministic,
documented in `ARCHITECTURE.md` as the measure the map uses for "bigger",
and explicitly *not* an editorial judgement — a later `prominence` field
may override it, and the extension-points table says so. The
determinism test covers it.

**2. Clustering, at render time**, in a new pure module
`src/map/cluster.js` tested under `node --test`: given projected points
with weights and the zoom factor `k`, group points closer than a
screen-constant distance (`D / k`, with `D` chosen so touching marks
merge at k = 1) into clusters; each cluster's representative is its
heaviest member; each cluster reports its members, its centre, and
whether its members are *coincident* (all within an epsilon that no zoom
can separate). Greedy, ordered by weight then id, so the result is stable.

**3. Level of detail.** `layers/events.js` renders clusters, not events:
one mark for the representative, with a small count badge ("+36") drawn
from the tokens when the cluster has more than one member. As `k` grows,
`D / k` shrinks and clusters split on their own — zooming in shows more.
Events that are selected, on the walked path, endpoints of a drawn edge,
or of the selected actor are **always drawn individually**, never hidden
in a cluster, so the chain is always visible. Chain and consequence lines
go to the event's own point.

**4. Coincident clusters.** Zoom never separates Lisbon's 37, so:
- Clicking a cluster that *can* split zooms the map on it (multiply `k`,
  centre on the cluster; a short transition is fine, respect
  `prefers-reduced-motion`).
- Clicking a cluster that is coincident **spreads** it: members arranged
  in a ring (or spiral beyond ~12) at a screen-constant radius around
  the point, each its own clickable mark with its title, and a thin leg
  to the centre. Clicking a spread member selects it; clicking the map
  elsewhere, or zooming, collapses the spread. A spread survives
  re-render (year slider) as long as the cluster still exists.
- Either kind of click also lists the cluster's members in the panel —
  "N events here", chronological, with year and title, each a link —
  so there is a keyboard path and a way to see the stack at once.

**5. Hit targets and labels.** Each drawn mark gets an invisible larger
circle behind it (about 10/k) so clicks land. At `k ≥ 4` (tune it) the
representatives of the heaviest clusters on screen get a text label,
placed to the right, skipped when it would overlap a label already
placed. Labels use the existing type tokens.

**6. The drag guard.** Keep the "moved" flag in a variable that outlives
`pointerup`, cleared after the click has been judged, so a drag never
selects and a clean click always does.

**7. Docs and tests.** `ARCHITECTURE.md`: `cluster.js` in the module
table, `weight` in the index section, `prominence` as a reserved
override; `STATUS.md`. Tests: `cluster.js` (merging, splitting with `k`,
coincidence detection, stability), the weight in the index, the site
smoke test still passing. Verify in headless Chromium against the real
data: at k = 1 Lisbon shows one badge with 37; clicking it spreads;
clicking a spread member selects it and the URL carries it; zooming from
Portugal to the Iberian peninsula separates Lisbon from Braga and
Alvor; the drag guard holds.

Done when the owner can see, click and reach every event on the map.

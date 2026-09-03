# Build brief — M6: the import mapping as data, the time window, timeline stacking, search

Written 3 September 2026. Read, completely and in this order, before
creating any file: `CLAUDE.md`, `STATUS.md` (all deviations, and "Decided
on 2026-09-03"), `ARCHITECTURE.md` (revision 6 — you write revision 7),
`CONTEXT.md`, `docs/m2-brief.md` (rules of engagement), `docs/map-brief.md`,
`docs/m5-brief.md`, then this file.

Rules of engagement as in every brief since `docs/m4-brief.md`: branch
`m0`, small English commits, **push after every commit**, validator and
tests green at every commit, deviations recorded in `STATUS.md` numbered on
from 45, no new hex values outside `src/style.css`, no dependencies in the
browser, no build step, no map library, nothing merged, no repository
settings changed. Historical text only under the test-dataset exception in
`CLAUDE.md`, marked as such, and only where this brief says.

## Part 1 — the import's actor mapping becomes data

Today `tools/import/cshapes.mjs` holds `ACTOR_MAP` in code. Move it to
**`data/imports/cshapes-actors.json`**, validated by a new
`schema/v1/import-map.json` (subset keywords only), so a contributor can
correct a territory's actor by editing one entry through the ordinary
pull-request path and a maintainer re-runs the import.

Shape, to be refined as you build but keeping these ideas:

```json
{
  "schema": 1,
  "source": "cshapes-2-0",
  "entries": {
    "750": {
      "actor": "british-india",
      "names": ["British India", "India (British)"],
      "splits": [
        { "from": "1947-08-15", "actor": "republic-of-india" }
      ],
      "note": "The Republic is a hand-made actor; the colony is not the same actor."
    }
  }
}
```

- An entry without `splits` maps the whole code to one actor (created by
  the import if it does not exist, reused if it does). `splits` cut the
  code's presences by date into different actors, in order; the first
  segment belongs to `actor`.
- Codes absent from the file get the default the tool uses today
  (a generated actor from `country_name`), and the tool **reports** them.
- Validator: file shape; actor ids are slugs; split dates are ISO and
  strictly increasing; a split's actor is not the entry's own. Whether a
  code exists in CShapes is checked at import time, loudly.
- Tonight's file: **split 750 into `british-india` → `republic-of-india`
  (from 1947-08-15) and 850 into `dutch-east-indies` → `indonesia` (from
  1949-12-27; check CShapes's own date for the code and use that if it
  differs, saying so)**. The hand-made `republic-of-india` and `indonesia`
  keep only what follows independence; the six
  `presence-outside-actor-when` warnings disappear. The new colonial
  actors are import-authored and CC BY-NC-SA like the others.
- The tool gains `--report`: for every code whose presences mix
  dependency and independent status without a split in the file, print
  the code, the actor, and the first date CShapes shows it independent.
  Put that report — 99 entries or so — into `STATUS.md` under a heading
  "Entities that could be split", so the owner can split them in batches
  later by editing the file.
- `CONTRIBUTING.md`: a section "Correcting a territory" — which file,
  what an entry means, that a maintainer re-runs the import, and that
  the outlines themselves are never edited by hand.

## Part 2 — the two sentences

Under the test-dataset exception, add one sentence to the `summary` of:

- `east-timor-invasion-1975`: that the territories layer keeps East Timor
  as a Portuguese colony until 16 July 1976, the date CShapes gives for
  Indonesia's formal annexation, so the map and this event answer different
  questions — who held the ground, and who administered it.
- `guinea-bissau-declares-independence-1973`: that the layer ends the
  colony on 9 September 1974, the eve of Portuguese recognition, whereas
  this event is the unilateral declaration of 24 September 1973 — a year
  in which two states claimed the same ground.

Hedge as the existing summaries do. Outlines untouched. Remove the
corresponding items from `STATUS.md` → Next.

## Part 3 — a time window instead of an accumulating year

The map today shows every event that has *started* by the slider year.
Replace the single year with a **window**:

- State: `{ from, to }` replaces `year`; URL `?from=1960&to=1975`. A legacy
  `?year=X` in a shared link is read as `to = X` with `from` at the data's
  first year, so old links keep meaning something. Default when the URL
  says nothing: **the whole span of the loaded data**.
- The timeline draws the window as a **band** with two handles: drag a
  handle to move one end, drag the band to slide it, arrow keys nudge the
  focused handle, double-click a year in a lane to snap the band to that
  decade. The band is the only time control; the map's year slider goes.
- The map shows events whose interval **overlaps the window**. The walked
  chain, the selected event, and the selected actor's events are always
  drawn, faded when outside the window (a class, a token — no new hex).
  Edge lines follow their endpoints.
- **Territories are drawn for the window's last year** (`to`); the band
  carries a small marker at that end saying "borders as of 1975". Sliding
  the band moves both.
- Timeline scale: the lanes zoom to the window with some margin, so
  narrowing the window is also zooming the timeline; the scale stays
  injected (`timeline-scale.js`), just parameterised by the window.
- `data.js`: nothing structural; one shard per `to` as today.
- Tests: state parse/format with `from`/`to` and the legacy `year`; the
  overlap filter; the scale. `ARCHITECTURE.md`: state shape, the rule
  "events by overlap, territories by `to`", in the module table and the
  data-flow text.

## Part 4 — timeline stacking

Events in one lane that would overlap at the current width merge into a
single bar with a `+n` badge, using `src/map/cluster.js` in one dimension
(move it to `src/cluster.js` if that reads better; keep it pure and keep its
tests). Narrowing the window splits stacks. Clicking a stacked bar lists its
members in the panel exactly as a map cluster does (reuse that panel code).
The selected event and the walked chain are never stacked.

## Part 5 — search by name

A box in the header of `index.html`: `/` focuses it, typing filters as you
type, arrow keys move, Enter selects, Escape clears. It searches event
titles, actor names and variants, and imported actors (so "Angola" finds
both the actor and its events), diacritic-insensitive, prefix first then
substring, results grouped as events / actors with the year or dates beside
each. Selecting an event that lies outside the window widens the window to
include it. The matching lives in a pure `src/search.js` with tests; the
box in `src/search-box.js`. Basic ARIA (combobox/listbox roles, live
region for the count). Works in `?fixtures=1`.

## Done when

The six warnings are gone and the validator is clean; the mapping file
exists with the two splits and the report of the rest is in `STATUS.md`;
the two summaries carry their sentence; the map obeys the window and the
band works with mouse and keyboard; stacks on the timeline split as the
window narrows; `/`, type "sal", Enter opens Salazar; all verified in
headless Chromium against the real data and `?fixtures=1`; tests green;
`ARCHITECTURE.md` revision 7 with its dated note; `STATUS.md` updated,
including a line "M6 done" the next run looks for; an "M6" section on PR
#1.

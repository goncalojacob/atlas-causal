# Build brief — M14: choose what the lanes are

Written 3 September 2026, from the owner's use of the timeline and the
graph view: both group events by continent, and the owner wants to choose
the grouping and which groups are shown. Runs after M13. Read, in this
order: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md` (current revision; you
write the next), `CONTEXT.md`, `docs/run-protocol.md`, `docs/m2-brief.md`,
`docs/m6-brief.md`, `docs/m7-brief.md`, `docs/m9-brief.md`, `docs/m11-brief.md`,
then this file. Rules of engagement as in every brief since
`docs/m4-brief.md`; no historical text at all.

## What changes

The timeline's lanes and the graph view's bands are the same thing: a
**grouping** of events. Today it is fixed to the region lanes in
`data/regions.json`. It becomes a choice, shared by both views and kept in
the URL.

- **`group`** in the state and URL: `region` (default; today's behaviour,
  lanes from `regions.json`, unchanged), `place` (one lane per place record
  that has events), `actor` (one lane per actor), `none` (a single lane —
  the timeline as one strip, the graph as one band).
- **`lanes`** in the state and URL, optional: an ordered list of lane ids
  to show, e.g. `?group=actor&lanes=salazar,estado-novo,paigc`. When absent,
  the views show the lanes with the most events in the window, capped at
  twelve, plus one lane **"Other"** for the rest; when present, exactly
  those lanes in that order, plus "Other" only if something falls outside.
- **A lane picker** in the header next to the Map | Graph toggle: the
  grouping as a select, and a list of the available lanes for that
  grouping with checkboxes and drag-to-reorder (or up/down buttons —
  keyboard first), search within the list for long ones (311 actors).
  Choosing lanes writes `lanes`; clearing returns to the automatic top
  twelve. Selecting an actor, a place or a source elsewhere does not
  change the grouping.
- **Where an event goes** when the grouping is `actor` and the event has
  several actors: in the lane of its highest-weight actor among the shown
  lanes; if none of its actors is shown, in "Other". The panel's event
  card says which lane it is drawn in and why. Do not draw ghost copies.
  For `place`, an event has exactly one place, or none (→ "Other").
- **A pure module** `src/lanes.js`: `lanesFor(group, topology, window,
  chosen)` → the ordered lanes with their members, and `laneOf(event,
  lanes)`. Tested: the cap, the ordering by count, "Other", explicit
  selection, the actor rule, stability across runs. `timeline.js` and the
  graph layout take lanes from it instead of from `regions.json`; the
  region lanes remain the `region` case of the same function so nothing
  about the default changes.
- The clusters on the timeline and the graph's bands follow the lanes as
  they do today; stacking is per lane.
- `about.html`: a paragraph on grouping. `ARCHITECTURE.md`: `group` and
  `lanes` in the state, `lanes.js` in the module table, the actor rule as
  a decision.

## Done when

`?group=place` shows one lane per place with the busiest first and the
rest in "Other"; `?group=actor&lanes=salazar,paigc` shows exactly two
lanes plus "Other"; `?group=none` shows one; the default URL is unchanged
and draws the five region lanes as before; the graph view's bands follow
the same choice; the picker round-trips through the URL; tests green;
verified in headless Chromium with the counts asserted (five lanes at
default, twelve plus Other at `?group=actor`, two plus Other with the
explicit list); `STATUS.md` with the literal line `M14 done`; an "M14"
section on PR #1.

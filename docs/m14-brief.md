# Build brief — M14: the lens, and what the lanes are

Written 3 September 2026 with the owner. Runs after M13. Read, in this
order: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md` (current revision; you
write the next), `CONTEXT.md`, `docs/run-protocol.md`, `docs/m2-brief.md`,
`docs/m6-brief.md`, `docs/m7-brief.md`, `docs/m9-brief.md`,
`docs/m11-brief.md`, then this file. Rules of engagement as in every brief
since `docs/m4-brief.md`; no historical text at all.

## Decisions this implements

- The timeline's lanes and the graph view's bands are one thing: a
  **grouping** of events. It becomes a choice, and the default is **no
  grouping**, with the layout doing the work.
- An event is drawn in **exactly one lane**, by a mechanical rule the
  interface states. Never duplicated across lanes.
- **Filtering is separate from grouping**: a lens that keeps only the
  events involving one actor, place or source, in all three views.

## Part 1 — the lens

`focus` in the state and URL: `?focus=actor:salazar`, `?focus=place:lisbon`,
`?focus=source:russell-2000-henry`. With a focus, the map, the graph and the
timeline show **only** the events involving that record (actor in
`actors[]`, place equal, source cited by the event or by an edge at the
event); edges between two shown events are drawn; everything else is
removed, not dimmed — dimming is what selection does, and the two must read
differently. The actor, place and source cards get a control "show only
these" / "show everything"; the header shows the active lens with a way to
clear it. The window, the chain, the horizon and search all keep working
inside the lens; search results outside it are listed but marked. Pure
function `lensFor(focus, topology)` → the set of event ids, tested.

## Part 2 — grouping

`group` in the state and URL: `none` (default), `actor`, `place`, `region`.
`lanes`, optional: an ordered explicit list of lane ids.

- **`none`**: no named lanes. The timeline **packs** events into as many
  unlabelled rows as needed so that nothing overlaps at the current width,
  keeping the events of the walked chain and of the same place adjacent
  where it can; stacking still applies within a row when the window is
  wide. The graph view drops its bands and lets the barycentre pass place
  nodes freely. This is what a visitor sees first.
- **`actor`**: one lane per actor. Which actors: the twelve with the most
  events in the window, ordered by that count, plus **"Other"**; or, when
  `lanes` is set, exactly those actors in that order, plus "Other" only if
  something falls outside. An event with several actors goes in the lane
  of its **heaviest actor among the lanes shown** (actor weight already
  exists); if none of its actors has a lane, "Other".
- **`place`**: one lane per place, same top-twelve rule; an event has one
  place or none ("Other").
- **`region`**: today's five lanes from `regions.json`, unchanged, no
  "Other".
- The event card always says where the event is drawn and why: "Drawn in
  the Estado Novo lane (heaviest of its actors); also involves Salazar,
  PIDE."
- **The picker** in the header next to Map | Graph: the grouping as a
  select; for `actor` and `place`, the list of available lanes for the
  current window with checkboxes and up/down reordering, keyboard first,
  with a search box inside for long lists; choosing writes `lanes`,
  clearing returns to the automatic twelve. Selecting an actor or place
  elsewhere never changes the grouping.
- **`src/lanes.js`**, pure and tested: `lanesFor(group, topology, window,
  lens, chosen)` → ordered lanes with members; `laneOf(event, lanes)`;
  `packRows(events, scale, width)` for `none`. Tests: the cap, ordering by
  count, "Other", explicit lists, the heaviest-actor rule, packing with no
  overlaps, stability across runs. `timeline.js` and the graph layout take
  lanes from it; `regions.json` is read only inside the `region` case.
- Stacking and clusters follow the lanes as today.

## Docs

`about.html`: a paragraph on the lens and the grouping, and the one-lane
rule. `ARCHITECTURE.md`: `focus`, `group`, `lanes` in the state; `lanes.js`
in the module table; the decisions above under "Decisions taken"; a note
that `region` may return as the default when the data is world-scale.

## Done when

The default URL draws the timeline as packed unlabelled rows with no
overlapping bars at full width and the graph without bands; `?group=actor`
shows twelve lanes plus "Other" ordered by count; `?group=actor&lanes=salazar,paigc`
shows exactly those two plus "Other"; `?group=place` one lane per place;
`?group=region` the five lanes as before; `?focus=actor:salazar` draws only
Salazar's events (assert the count against `eventsByActor`) in all three
views; the picker round-trips through the URL; the event card states its
lane; tests green; verified in headless Chromium with these counts;
`STATUS.md` with the literal line `M14 done`; an "M14" section on PR #1.

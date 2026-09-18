# Build brief — M65: choosing an event is a filter, not a highlight

The owner, 18 September:

> **"In case it wasn't clear before: everywhere, graph, map and timeline you
> should only see the main events. Then, when you click on a specific event, in
> both the map, graph and timeline the other unrelated events are hidden and
> only the children events and direct connections are shown"**

Read that as a correction, because it is one. The atlas has been **dimming**
what is not chosen and showing everything by default. The owner is asking for
**hiding**, in all three views at once.

## 1. The two rules

**At rest, every view shows only the main events.** An event is *main* when it
has no parent. M48 already built this filter for the graph and it has been a
no-op for a week because there was no hierarchy; M62 wrote one. **The map and
the timeline must obey the same rule, from the same place, so that the three
cannot disagree.**

**Choosing an event hides everything unrelated.** What stays: **the chosen
event, its children, and its direct connections** — one hop along an edge,
either direction. **Its parent stays too**: what an event is part of is not
clutter, and a reader who has walked down into a regime must be able to see
the regime. Everything else is gone from all three views, not faded.

**Clearing the selection restores the resting picture.** There must be an
obvious way back, and it is the one that already exists.

## 2. Say this number out loud before building

**242 of 309 events are main.** Filing fifty events under five umbrellas (M62)
moved the resting picture from 309 to 242 — a cut of about a fifth. **"Only the
main events" will not feel like much until far more of the 242 have somewhere
to hang.** That is a records problem and not this milestone's, but this
milestone must state it in `STATUS.md` with the number, so that the next
decision is made knowing it.

## 3. Use the lens that exists

`src/lens.js` already computes three sets — `set`, `near`, `shown` — and all
three views already read them. **This is a change to what those sets mean and
to who is told to hide rather than fade. Do not grow a second filtering path**;
a map that hides by one rule and a graph that hides by another is the fault
this milestone exists to prevent.

**Dimming does not disappear.** It still says *related, not chosen* inside what
is shown. What changes is that unrelated is now absent rather than pale.

## 4. What this changes that is not obvious

- **`?selected=` links written before this milestone will show less than they
  did.** That is the intended behaviour and is worth a line in `STATUS.md`.
- **The counts in the masthead must still be true.** "N of N events in view"
  now counts against the resting picture, not the whole corpus; say which.
- **M54's territorial rule survives**: a place's card lists everything that
  happened inside that outline whatever the window is. **A territorial
  selection is not an event selection** and must not be narrowed to one hop.
- **A main event with no children and no edges shows only itself** when chosen.
  That is correct and must not be special-cased into showing more.

## 5. What this run must not do

No new record and no historical claim. **No new hex value, token or type size.**
No change to `lanes.js` or `cluster.js`. **First paint must not get slower** —
the resting picture is smaller, so say what it costs before and after. `validate
--index` clean; tests before the behaviour they judge (711, 717). Nothing merged
into `main`; ignore `docs/drafts/`.

## 6. Tests

1. At rest, **each of the three views draws only main events** — asserted as a
   property of what is drawn, not as a list of ids.
2. Choosing an event leaves **it, its children, its parent and its one-hop
   neighbours** and nothing else, **in all three views**.
3. Clearing the selection **restores exactly the resting picture**.
4. A main event with neither children nor edges shows **only itself**.
5. The three views **agree on what is hidden**, asserted from the shared source.
6. M54's territorial listing is **unchanged**.
7. No test pins a count.

## 7. Done when

The three views rest on main events only and narrow together on a choice;
`STATUS.md` carries the 242-of-309 number and what first paint costs;
screenshots under `docs/screens/m65-*.png` at rest and chosen, every other
picture restored; tests green; `M65 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

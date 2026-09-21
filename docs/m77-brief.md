# Build brief — M77: the graph read clearly, the timeline's titles, and grouping removed

Three instructions from the owner on 21 September, with two screenshots.
Each is quoted; each is the authority for its section.

## 1. The graph under a narrative is clouded

> **"When I select the narrative, this is what I see on the graph. It looks
> clouded and there are too many labels on top that don't really need to be
> always visible. Investigate a way to show things more clearly on the graph,
> in a way that is easier to understand."**

The screenshot is `docs/screens/owner-2026-09-21-graph.png` (commit it from
the description below if the file is not there; the assistant will add it to
`m0`). What it shows, read from the picture:

- **A row of nodes along the top edge**, their labels cut off by the frame,
  fanned to by long dotted and dashed edges from the walk's nodes. These are
  the neighbourhood the lens keeps around the walk — the one hop — pinned at
  the top of the layout.
- **Truncated labels on the walk itself** — "Dutch Br…", "The B…", "The
  Rev…" — where the steps are close together, so the sentence the walk is
  cannot be read.
- **Five edge styles and two opacities crossing each other** through the
  walk, drawn in full for edges that are not the walk's.
- **A large note over the picture**: "The map is looking at part of the
  world. The graph has no viewport of its own…", which is about the lanes
  and not about what the reader asked.

This section is an **investigation first**: the run measures what is on the
page with a narrative open — how many nodes, how many of them are the walk's,
how many labels, how many are truncated, how many edges are not the walk's —
and writes it into `STATUS.md` before changing anything. Then it chooses,
argues and builds. The direction the owner gave is plain: **fewer things
always visible**. What must hold afterwards:

- **With a narrative open, the walk is the picture.** Its steps are named in
  full, in reading order, and its edges are the ones drawn in ink. Anything
  else on the page is there to be found, not to be read: no label until hover
  or focus, and drawn faint.
- **A label that cannot be shown in full is not shown truncated.** Either
  the layout makes room for it (M61's rule: the same size on screen at every
  zoom) or it waits for hover.
- **The note goes** from the graph. If the sentence matters, it belongs in
  the lanes' own control.
- **The legend stays**, and the `Export this view` button.

The same must read well with an event selected (M65) and at rest, but the
narrative case is the one the owner showed and the one to measure and
screenshot before and after.

## 2. The timeline shows the main events with their titles

> **"The timeline has too many events. As it is right now it is useless.
> For it to be useful it should only show parent and main events and the
> title for the events. For example, sometimes historians call interwar
> period for the years between WW1 and WW2, you could only show that for
> Europe (there are other important events for other parts of the world of
> course) and then when you click on it it can show you everything that
> happened during that time."**

The screenshot is `docs/screens/owner-2026-09-21-timeline.png`: bars and
marks in twelve rows with no titles except two umbrella names at the top,
and `+1`, `+2` badges where the grouping packed things.

Two halves. **The records half is lane B's** — M42's amendment A6 asks the
imports to file the world's events under period umbrellas (the interwar
period for Europe is the owner's example), so the resting count of main
events comes down. **This milestone is the display half**, and it must make
the timeline readable at whatever count lane B leaves it:

- **Every bar the timeline draws at rest carries its title.** No packed rows,
  no `+N` badges, no unlabelled marks. If the titles do not fit, the rows
  are taller and the timeline scrolls; a title never disappears to make room.
- **At rest it is the main events** (M65, unchanged) — and the owner's word
  "parent" means the same thing: an event with children, drawn as a bar that
  says it can be opened.
- **Clicking an umbrella opens it**: the timeline narrows to that event and
  what happened during it — its children (M65) — each with its title. This
  already exists as the lens; make sure the timeline's bar is a click target
  that sets it, and that the way back is one click.
- The window, the band and the lanes are unchanged.

## 3. Grouping is removed

> **"Right now the grouping function is useless, let's simplify the platform
> and remove it."**

`src/grouping.js` — the picker in the header (no grouping / one lane per
actor / per place / per region) and its panel — goes, and with it the `group`
state and the reordering of lanes. Read `src/lanes.js` for what it still
needs from the state once `group` is gone: the timeline keeps its lanes, and
the default arrangement becomes the only one. A `?group=` in an old link is
read into nothing (deviation 848's rule). `src/main.js` and `src/lens.js`
lose their imports. If a test asserts the picker, the test changes first
(711, 717).

## 4. What this run must not do

No new record and no historical claim — the umbrellas are lane B's. No new
hex value, token or type size. `emphasis.js`'s `shown` contract, the lens,
the band and M76's changes are unchanged. First paint not slower; numbers
against M76's. `validate --index` clean; nothing merged into `main`; ignore
`docs/drafts/`. **Lane A numbers deviations on from where M76 stops (1100
upward).**

## 5. Tests

1. With a narrative open on the graph, every node of the walk is labelled
   in full and no label on the page is truncated.
2. With a narrative open, no node outside the walk carries a visible label
   until hovered or focused.
3. The graph has no note about the map's viewport.
4. Every bar on the resting timeline has a title; no `+N` badge exists.
5. Clicking a bar with children narrows the timeline to it and its
   children, each titled; one click returns.
6. No grouping control in the document; `?group=actor` in the URL opens the
   atlas with the default lanes and no error.
7. No test pins a count or a pixel.

## 6. Done when

The graph under a narrative reads as the walk; the timeline's bars are
titled and open on click; grouping is gone. Screenshots `docs/screens/m77-*`
before and after for the graph and the timeline at desktop and phone width,
restoring every other picture `tools/screens.mjs` rewrites. `STATUS.md`: the
measurement of section 1 before and after, what was chosen and why. Tests
green; `M77 done`.

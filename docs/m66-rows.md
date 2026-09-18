# M66 — how tall a timeline row may grow

M60 gave the timeline a whole view. Its rows kept the heights they had when it
was a strip along the bottom of the map — 22 px packed, 34 px for a named lane,
and a lane never grew past them — so on the owner's own 1440 × 900 window the
twenty rows ended 297 px above the bottom of the pane and the rest was drawn as
one enormous last lane. It reads as a drawing that stopped early.

The rule keeps its shape: never below the floor a row of its kind needs, and
past that the pane scrolls rather than draw a row two pixels high. What changed
is that the height a row would settle for is no longer the ceiling when there
is room going spare. `laneHeightFor` in `src/timeline.js` is the whole of it,
and `tests/timeline-rows.test.mjs` holds it.

## The cap, measured

Four caps, on the repository's own records, at the two windows the owner works
in. `room / rows` is what the pane offers each row; the cap binds only where it
is under that.

| cap | 900 px window, 20 packed rows | 1400 px window, 20 packed rows | the bar inside the row |
|---|---|---|---|
| none (before) | 22 px, 297 px left under the bottom row | 22 px, 797 px left | 8 px |
| 34 | 34 px, 57 px left | 34 px, 557 px left | 18 px |
| **44** | **36.85 px, nothing left** | **44 px, 357 px left** | **20.85 / 28 px** |
| 62 | 36.85 px, nothing left | 61.85 px, nothing left | 20.85 / 46 px |

34 is not a cap at all on a tall window — it is the height a named lane already
wanted, and it leaves 557 px of the 1400 px window under the bottom row.

62 fills both windows, and that is the trouble with it: a bar is the row less
the air around it, so a row of 62 draws a 46 px bar, and an event of a single
year is about 6 px wide at this width. A point event comes out a column half a
finger tall and taller than it is wide, which says "long" about something that
lasted a day. The 1400 px picture at 62 is what settled this.

**44.** A row of 44 px is the target size WCAG 2.5.5 asks for at AAA, and the
bar inside it is 28 px — above the 24 px that 2.5.8 asks at AA, which is the
"easy to hit" the brief wanted — while still reading as a bar and not a column.
On the window the owner actually uses the cap never binds at all: 20 rows in a
795 px pane divide out at 36.85 px and the drawing fills the pane exactly.

## Before and after

Every number read off the drawing, at 1440 px wide.

| window | grouping | lane before | lane after | left under the bottom row, before → after |
|---|---|---|---|---|
| 900 | none, 20 rows | 22 | 36.85 | 297 → 0 |
| 1400 | none, 20 rows | 22 | 44 | 797 → 357 |
| 900 | region, 5 lanes | 34 | 44 | 567 → 517 |
| 1400 | region, 5 lanes | 34 | 44 | 1067 → 1017 |
| 250 | none, 6 rows at the floor | 14.5 | 14.5 | 0 → 0 |
| 250 | a reader's own four lanes | 22 | 22 | the pane scrolls, as before |

Five lanes in a tall window are the case the cap does not fix, and will not: a
region lane 247 px tall with one 18 px bar floating in the middle of it is the
"three stripes" the brief refused. What is under the bottom row there is the
last lane carrying the remainder, which is how the drawing has ended since the
lanes were first laid into a measured pane.

Nothing below the floor moved: a pane with less room than the rows need
squeezes them to it and scrolls, exactly as I6 wrote it.

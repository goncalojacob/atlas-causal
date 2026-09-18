# M61 — how much room a graph label has, and how much of it it used

The owner, 18 September, with a screenshot of the graph zoomed in: *"When I
zoom in on the graph the text remains too small"*. In the picture
`The depopulation of indigen…` sits with empty space to its right, and so do
half the nodes on screen.

The text is not too small. It is needlessly abbreviated, and this document is
the measurement that says by how much, taken before anything was changed.

## 0. The fault, in one line of code

`src/graph-view/graph-view.js`, before M61:

```js
function shorten(text, chars = LABEL_CHARS) {
  return text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text;
}
```

`LABEL_CHARS` is 28 at every zoom. A label holds its size **on screen** at
every zoom, as the map's marks do, so in the picture's own units it gets
smaller and smaller as the reader zooms in — while the gaps between the nodes
stay exactly where the arrangement put them. Zoom in and the room around a
node grows; the cut does not move.

## 1. How it was measured

A headless Chromium at 1440 × 900 on `?view=graph&from=1900&to=1999`, driven
over the DevTools protocol the way `tests/browser.mjs` drives it — the same
page a reader gets, not a fixture. Three zooms, reached with the wheel over
one mark so that the three pictures are of the same place:

- **the world view**, `k = 1`, which is what a double click returns to;
- **a continent**, `k ≈ 3.5`, eight notches in;
- **a handful of nodes**, `k = 8`, which is `MAX_ZOOM`.

The mark the wheel is held over is the one with the longest name on screen:
`the-base-reforms-rally-1964`, *"The base reforms rally at the Central do
Brasil, 1964"* — 53 characters, which is the same shape of name as the one in
the owner's screenshot.

A fourth line is added throughout: **the arrival view**, `k = 2`, which is
where `fitToWindow` leaves a reader who opens that link and touches nothing.
It is not one of the three zooms the brief asks for, but it is the picture
most readers actually see, and it is where the counts are worst.

What is counted, per zoom:

| | |
| --- | --- |
| **marks** | circles in the DOM, stacks included |
| **labels** | `text.node-label` in the DOM |
| **truncated** | labels ending in an ellipsis |
| **mean / max chars** | the length of the text actually drawn |
| **overlapping** | pairs of labels whose rectangles **on the screen** intersect — measured with `getBoundingClientRect`, not with the drawing's own estimate of its boxes |
| **clipped** | labels running off the pane, whose text the reader cannot read because it is not on the screen |

## 2. Today

| zoom | marks | labels | truncated | mean | max | overlapping | clipped |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| world, `k = 1` | 122 | 14 | **6 of 14** | 22.0 | 28 | 0 | 2 |
| arrival, `k = 2` | 128 | 123 | **60 of 123** | 23.3 | 28 | **136** | 12 |
| continent, `k = 3.5` | 62 | 55 | **27 of 55** | 23.1 | 28 | **14** | 6 |
| handful, `k = 8` | 19 | 19 | **10 of 19** | 22.5 | 28 | 3 | 3 |

Two things in that table, and the second was not in the brief.

**Half the labels are cut at every zoom, and the share does not fall as the
reader zooms in** — 43 %, 49 %, 53 %. That is the fault the owner reported:
`MAX_ZOOM` is eight times in and the name is cut where it was cut at the world
view. Nothing is ever longer than 28 characters, because nothing can be.

**The zoomed-in picture is already drawing names on top of one another**, and
by a lot: 136 pairs at the arrival view. At or above `LABEL_ALL_ZOOM` every
mark on screen is named, and a label with no free side is drawn over its
neighbour rather than dropped — deliberately, because "a name that disappeared
because a neighbour got there first would be the wrong kind of tidy". At 123
labels in a pane that is what it costs. Twelve more run off the edge of the
pane altogether.

## 3. What the room actually is

Before choosing a rule, three candidate definitions of "the room a node has"
were measured at the same three zooms, in characters — the distance from where
the label's text starts to the nearest obstacle on that side, divided by what
a character takes at that zoom.

| obstacle | world, `k = 1` | continent, `k = 3.5` |
| --- | --- | --- |
| the pane's edge | 15 to 118 chars | 0 to 148 |
| the nearest **label** already placed in the same line of text | mostly nothing in the way | mostly nothing in the way |
| the nearest **mark** in the same line of text | **0 to 7 chars for 11 of 14 labels** | mostly nothing in the way |

The third line is why the marks cannot be the obstacle. At the world view the
picture is 122 marks deep and a label crosses several of them; a rule that
stopped every label at the next mark would cut eleven of the fourteen names at
the world view to nothing at all. The graph has always drawn a name across
marks that carry no name of their own, and the owner's complaint is that names
are too short, not that they are too bold.

So the room is **the labels, not the marks**, plus the pane's edge — with one
exception, measured in §4: the mark of a node that is *itself going to be
named* has to be left a side to write from, or the long name buys its length
with its neighbour's name.

## 4. What is not the room: the slice

The room alone does not answer the world view. A node at the left of the
picture with nothing in its line has over a hundred characters of room at
`k = 1`, and using them would make the world view busier than it is today —
which the brief forbids in as many words.

What holds it is the one part of the old rule worth keeping. `LABEL_CHARS` was
28 characters at `k = 1`, and 28 characters at `k = 1` is a **width**: about
190 units of the picture, slack included. A label never takes more of the
picture than that. At the world view it binds and nothing grows; at every zoom
past it the same slice of the picture is more characters on the screen, which
is exactly the room the zoom opened — 56 characters at `k = 2`, 230 at
`k = 8`.

The rule, then, in one sentence: **a label is cut to the smaller of the room
around it and the slice of the picture it has always been allowed, counted in
characters at the zoom it is drawn at** — and to the whole name when the whole
name fits in that.

## 5. After

The same measurement, same page, same three zooms, same mark under the wheel,
on `764b1e28`:

| zoom | marks | labels | truncated | mean | max | overlapping | clipped |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| world, `k = 1` | 122 | 14 | 7 of 14 | 19.5 | 28 | 0 | 0 |
| arrival, `k = 2` | 128 | 74 | 35 of 74 | 19.9 | 47 | 0 | 0 |
| continent, `k = 3.5` | 62 | 45 | 14 of 45 | 23.8 | 59 | 0 | 0 |
| handful, `k = 8` | 19 | 17 | 2 of 17 | 27.5 | 59 | 0 | 0 |

Against §2, zoom by zoom:

| | world | arrival | continent | handful |
| --- | --- | --- | --- | --- |
| truncated | 6 → 7 of 14 | 60 → 35 | **27 → 14** of 55/45 | **10 → 2** of 19/17 |
| share cut | 43 % → 50 % | 49 % → 47 % | **49 % → 31 %** | **53 % → 12 %** |
| longest name drawn | 28 → 28 | 28 → **47** | 28 → **59** | 28 → **59** |
| labels over labels | 0 → 0 | **136 → 0** | **14 → 0** | **3 → 0** |
| labels off the pane | 2 → 0 | 12 → 0 | 6 → 0 | 3 → 0 |
| labels drawn | 14 → 14 | 123 → 74 | 55 → 45 | 19 → 17 |

**The complaint is answered where it was made.** Eight times in, one label in
eight is cut where it was one in two, and the longest name on screen is drawn
whole at 59 characters where the picture would give it 28. `The base reforms
rally at the Central do Brasil, 1964` is in `docs/screens/m61-labels-close.png`
with nothing after it.

**The world view is the picture it was.** The same fourteen names, none of
them longer than the constant they were cut at. Two are shorter: the mean falls
from 22.0 to 19.5 because the pane's edge is room now, and a name that used to
run off the screen is cut where the screen ends rather than clipped mid-word by
the browser. Nothing there is readable that was not readable before — the two
labels that were clipped are the two that shrank.

**Nothing is drawn over anything.** 136 pairs at the arrival view, 14 at a
continent, 3 at `MAX_ZOOM`: nil at all four. This was not in the brief's
complaint and is the larger of the two faults.

**What it costs: names.** 123 labels at the arrival view become 74, 55 become
45, 19 become 17. A mark whose line of text is full on both sides is not named
at all now, where before it was named on top of its neighbour — those 136
overlapping pairs *were* those labels. The mark keeps its title, so the name is
one hover away, and the reader who wants it closer has the wheel. It is a
deliberate trade and it is the one the brief asks for: "where two nodes are
close, the shorter cut is the right one".

## 6. What it costs to draw

Median of seven loads, and of twenty-four wheel notches, on this machine,
before and after — the same instrument, the page driven the same way:

| | before | after |
| --- | ---: | ---: |
| first mark in the DOM | 242 ms, 234 ms | 242 ms, 234 ms |
| first label in the DOM | 341 ms, 270 ms | 292 ms, 281 ms |
| one wheel notch at `k = 1` | 5.9 ms, 6.7 ms | 6.0 ms, 6.2 ms |
| one wheel notch at `k = 3.5` | 2.1 ms | 1.8 ms, 1.9 ms |
| one wheel notch at `k = 8` | 0.7 ms | 0.6 ms |

**First paint does not move.** It is not where the work is: the labels are
drawn where they were drawn, the pass is the same one loop over the same
candidates, and what it does inside that loop — two scans of what is already
placed rather than one, plus a scan of the marks that will be named — is of
the same order as the collision test it replaces. The two numbers that do move
are the notches at the closer zooms, and they move down: fewer labels are built
and inserted, because the ones that used to be drawn over a neighbour are not
drawn at all.

## 7. What was not changed, and one thing worth a look

The zoom gate is untouched: below `LABEL_ALL_ZOOM` only the heaviest marks on
screen are named, and `LABEL_LIMIT` is what it was. The font is untouched, and
so is its size — `docs/screens/m61-labels-*.png` are three pictures of text at
one size in a picture at three zooms, which is the rule of the brief's §2 and
is asserted rather than assumed in `tests/graph-labels-browser.test.mjs`.

One thing the close view now makes obvious and this milestone did not touch:
**the halo behind a label is in the picture's units and the text is not.**
`.graph .node-label` carries `stroke-width: 3` in `src/style.css`, inside the
group the zoom scales, so at `k = 8` the paper behind a name is drawn eight
times as thick as at the world view while the letters are the same size. It
was there before M61 — the before-and-after shots have the same blot — but
there are more names in the close view now, so there is more of it. It is a
style, which this milestone was told not to touch, and it is a change of one
number when somebody wants it.


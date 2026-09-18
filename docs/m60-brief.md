# Build brief — M60: the timeline becomes a view, not a strip

The owner, 18 September, after using the atlas:

> **"I don't think the bottom timeline on the map is still necessary, I think
> something to choose the timeline is enough"**

They are right that it should not permanently eat the bottom of the map. They
are not asking for the timeline to be deleted, and it must not be.

## 1. What the strip actually is, measured before touching it

`src/timeline.js` is **960 lines** and does more than pick a window. Read it
whole, and its head comments especially — they record decisions that must
survive this milestone:

- it lays events into **lanes**, asking `src/lanes.js`, **the same file the
  graph asks**, so the two pictures cannot disagree about which lane an event
  is in;
- it **clusters** bars that would overlap at the current width, by the same
  `cluster.js` the map uses, in one dimension;
- **what the reader is working with is never stacked** — the selected event,
  the walked path, the selected actor's events;
- the lanes stay on the **whole extent of the data** whatever the window is.
  Zooming them to the window *was tried and rejected*: a handle at the edge of
  its own scale has no room to widen into, so narrowing once would be a trap.
  **Do not undo that.**

So it does two jobs, and only the first is what the owner is asking about:

1. **Setting the window** — the band and its two handles.
2. **Showing the distribution** — where history is dense, what a narrative's
   walk looks like in time, which events cluster. **A control cannot replace
   this**, which is why the answer is not to delete it.

## 2. What to build

**The timeline becomes the third view.** The masthead already carries
`Map | Graph`; add **`Timeline`** beside them, and give it the whole pane when
chosen — lanes, clusters, band and all, exactly what the strip draws today.

**And a compact window control goes in the masthead**, where M48 put the graph
filters and the layer switches, so map and graph get their full height back.
It shows the window's **from and to**, and lets the reader change them.

**If a small density hint can be drawn beside it from the palette that
exists** — so a reader still sees where events cluster without leaving the map
— do it. **If it cannot be done without a new token, hex value or type size,
ship the control without it and say so in `STATUS.md`.** A plain control that
tells the truth beats a picture that needed a new colour.

## 3. What must carry over, and will break if it does not

- **The window is URL state.** `from` and `to` already are; they stay, and the
  view choice joins them, so a link opens on the picture its sender saw.
- **M54's rule**: a territorial selection lists everything and **fades** what
  is outside the window rather than removing it — *"a place's faded rows
  follow the band without rebuilding the card"* is a test and it must still
  pass, with the control standing where the band stood.
- **The "N of N events in view" count** lives on the strip today. It must land
  somewhere a reader still sees.
- **The resize handle** (`#split-timeline`) is for a strip that is always
  there. Decide what it means now and say so; do not leave it half-alive.
- Switching views **must not change the window**.

## 4. What this run must not do

No new record and no historical claim. No new runtime dependency, build step,
map library or tiles. **No new hex value, token or type size.** No change to
`lanes.js` or `cluster.js` — the graph shares them. **First paint must not get
slower**; say what it costs before and after.

## 5. Tests

1. Choosing **Timeline** gives the timeline the pane, with its lanes and
   clusters as they are today.
2. **Switching between the three views leaves the window unchanged**, and the
   view is in the URL.
3. The masthead control **sets `from` and `to`**, and a reload restores them.
4. **The map pane is taller than it was** with the strip present — assert the
   property, not a pixel count.
5. M54's fading test still passes.
6. No test pins a count of events.

## 6. Done when

The three views switch and the window survives switching; the control sets the
window and is in the URL; the map has its height; the count and the fading rule
both still reach the reader; screenshots under `docs/screens/m60-*.png` of all
three views with every other picture restored; `STATUS.md` says what first
paint costs and what you did about the density hint and the resize handle;
`validate --index` clean; tests green; `M60 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

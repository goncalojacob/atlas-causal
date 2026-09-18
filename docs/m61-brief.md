# Build brief — M61: a graph label says as much as the room allows

The owner, 18 September, with a screenshot of the graph zoomed in:

> **"When I zoom in on the graph the text remains too small"**

In the picture, `The depopulation of indigen…` sits with empty space to its
right, and so do half the nodes on screen. **The text is not really too small —
it is needlessly abbreviated.** The room is there and nothing uses it.

## 1. The cause, read before writing this

`src/graph-view/graph-view.js`:

```js
function shorten(text, chars = LABEL_CHARS) {
  return text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text;
}
```

**`LABEL_CHARS` is a constant and the space around a node is not.** Zoom in,
the arrangement spreads, the gap between nodes grows — and the label is still
cut at the same character count it would take at the world view.

## 2. What must not change, and why

The same file says labels **hold their size on screen at any zoom, as the map's
marks do**. **That is right and it stays.** Text that scales with the zoom is
enormous at close range and unreadable at distance, and the map already settled
this question for its own marks; the graph must not answer it differently.

The zoom gate stays too — *below a certain zoom only the heaviest nodes on
screen are named* — because that is about crowding, not about length.

**So this milestone changes what a label is cut to, and nothing else.**

## 3. What to build

**The cut follows the room.** How much a node has depends on the arrangement at
the current zoom — the distance to its neighbours, and the pane's edge. Work
that out and let the label use it, to the full name when the full name fits.

- **Measure before you choose the rule**, as M51 and M58 did: how many labels
  are truncated at the world view, at a continent, and zoomed to a handful of
  nodes, before and after. Put it in `docs/m61-labels.md`.
- **A label must never overlap its neighbour.** Where two nodes are close, the
  shorter cut is the right one and the reader is not worse off than today.
- **No new hex value, token or type size**, and no change to the font. This is
  a length, not a style.

## 4. What this run must not do

No new record and no historical claim. **No change to `lanes.js`,
`cluster.js`, or the layout in `src/graph-view/layout*.js`** — the arrangement
is not what is wrong. No new runtime dependency, build step, map library or
tiles. **First paint must not get slower**; the labels are drawn where they
are drawn. Nothing merged into `main`; ignore `docs/drafts/`.

## 5. Tests

1. At a zoom where a node has room, **its label is the full name**, with no
   ellipsis.
2. At the world view, labels are **no longer than they are today** and none
   overlaps its neighbour.
3. The font size in the DOM is **the same at every zoom** — the rule of §2,
   asserted rather than assumed.
4. No test pins a count of labels or a character count.

## 6. Done when

`docs/m61-labels.md` carries the before-and-after at three zooms; a zoomed node
shows its whole name; nothing overlaps; screenshots under
`docs/screens/m61-*.png` at the same three zooms with every other picture
restored; `validate --index` clean; tests green; `M61 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

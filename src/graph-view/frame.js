// Where the camera starts, when the reader has asked the graph a question.
//
// Pure: a list of laid-out nodes, the sets of ids worth framing, and the
// rectangle the reader can actually see. Out comes the same `{ x, y, k }` the
// viewport is translated and scaled by, or null where there is nothing to
// frame. **Nothing here decides where a node goes** — `layout.js` does, and
// this file does not so much as read an edge; it decides only which part of
// the finished drawing is on the screen at the moment it first appears (M74).
//
// It exists because the graph draws what falls inside that rectangle and
// nothing else (I6's cull), so the opening rectangle decides what a reader
// sees of their own question. Where the layout happens to put a narrative's
// walk is a fact about the arrangement, not about the choice: the owner's
// twelve-step argument about the colonial war lost two thirds of its steps off
// the edge when new edges moved the picture under it, while the map and the
// timeline — which have no camera — went on drawing all of it.
//
// The rule is one sentence: **the widest of the wanted sets that fits is the
// one framed, and the narrowest is the fallback.** A lens is offered widest
// first — everything it draws, then the focus alone — so an event chosen with
// a small ring is framed with its ring, and one whose ring is larger than the
// pane is framed on the event, with as much of the ring as the pane reaches.
// The zoom is clamped to the view's own limits either way, so a set too large
// for the screen is drawn as far out as the graph goes and no further: what
// falls outside is outside, and the frame says nothing about it.
//
// Since M81 that rectangle is filled in **two directions and not one**: the
// zoom fits the stacks to the height, and the stretch fits the time extent to
// the width. The owner, 22 September, looking at World War II opened on the
// graph: *"On the graph it should expand more horizontally when I zoom in,
// otherwise it looks weird and hard to see."* A lens on a six-year war is tall
// and narrow, so the one zoom that fitted both was the height's, and four
// fifths of the pane stayed empty while the column stayed a column.

// The rectangle a set of nodes stands in, or null where the arrangement holds
// none of them. An id the arrangement does not carry is skipped rather than
// counted at the origin: the layout covers the band and one period either side
// of it (arrangement.js), so a lens may perfectly well name an event that has
// no coordinates in this picture.
export function boundsOf(nodes, ids) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let found = false;
  for (const node of nodes) {
    if (!ids.has(node.id)) continue;
    found = true;
    if (node.x < x0) x0 = node.x;
    if (node.x > x1) x1 = node.x;
    if (node.y < y0) y0 = node.y;
    if (node.y > y1) y1 = node.y;
  }
  return found ? {
    x0, y0, x1, y1,
  } : null;
}

// How far in a rectangle of this size may be drawn to sit inside that much
// room — **once in each direction** (M81). A set of one has no size and asks
// for an infinite zoom; the cap is the answer, and it is the caller's — the
// same one the window fit has used since deviation 54, so opening on a lens and
// opening on a narrow band go as far in as each other and no further.
//
// Two numbers rather than one, because the two directions carry different
// things. The height is the stacks, and it is what `k` fits: a mark, a label
// and the room between two rows are all measured in `k` and nothing else. The
// width is time, and what fits it is `k` and the stretch together.
function fitsOf(bounds, room, max) {
  const width = bounds.x1 - bounds.x0;
  const height = bounds.y1 - bounds.y0;
  return {
    toHeight: height > 0 ? room.height / height : max,
    toWidth: width > 0 ? room.width / width : max,
  };
}

// `wanted` is the sets to frame, widest first. `box` is what the reader can
// see, in the SVG's own units, and `pad` the room left around the frame —
// which is in those same units, because a mark keeps its size on the screen at
// every zoom (its radius is divided by k and the viewport multiplies by it).
// So a node framed at the edge of the box is a node half off the screen, and
// the padding is what makes "on screen" mean the whole mark.
//
// `maxStretch` is how far time may be drawn wider than the arrangement laid it
// (stretch.js). One — the default, and what this did before M81 — is the
// uniform frame: x and y scaled by the one `k`.
//
// Out comes `{ k, s, x, y }`. A node of the arrangement is drawn at
// `x + node.x * s * k` across and `y + node.y * k` down, which is what the view
// does: it stretches the picture's own coordinates and then scales them
// uniformly, so a mark is still a circle and a label is still set at one size.
export function frameFor(nodes, wanted, box, { min, max, pad = 0, maxStretch = 1 }) {
  const room = { width: (box.x1 - box.x0) - pad * 2, height: (box.y1 - box.y0) - pad * 2 };
  if (!(room.width > 0) || !(room.height > 0)) return null;
  let chosen = null;
  for (const ids of wanted) {
    const bounds = boundsOf(nodes, ids);
    if (!bounds) continue;
    const fits = fitsOf(bounds, room, max);
    chosen = { bounds, ...fits, k: Math.min(max, fits.toHeight, fits.toWidth) };
    // The first one that fits is the answer; the last one there is, clamped
    // below, is what is left when none of them does.
    if (chosen.k >= min) break;
  }
  if (!chosen) return null;
  const k = Math.min(max, Math.max(min, chosen.k));
  // And the width the zoom left over is spent on time rather than left blank.
  // This is the whole of what M81 changes here: a lens on a six-year war is
  // twenty-seven marks in a column, so what binds is the height, and a camera
  // that stopped at the height left four fifths of the pane empty and the
  // column as tight as it ever was. The stretch fills it, up to the cap the
  // caller names; where the set is already as wide as the pane, `toWidth / k`
  // is one and nothing is stretched at all.
  const s = Math.min(maxStretch, Math.max(1, chosen.toWidth / k));
  const centre = {
    x: (chosen.bounds.x0 + chosen.bounds.x1) / 2,
    y: (chosen.bounds.y0 + chosen.bounds.y1) / 2,
  };
  return {
    k,
    s,
    x: (box.x0 + box.x1) / 2 - centre.x * s * k,
    y: (box.y0 + box.y1) / 2 - centre.y * k,
  };
}

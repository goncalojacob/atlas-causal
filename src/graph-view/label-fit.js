// How long a graph label is allowed to be, which is not a number of
// characters. It is pure — no DOM, no state, no zoom of its own — so what the
// drawing does about room can be asserted without a browser.
//
// The fault it exists to fix: a label was cut at a constant `LABEL_CHARS`,
// and the space around a node is not constant. A label holds its size on
// screen at every zoom, as the map's marks do (graph-view.js), so the same
// name takes less and less of the picture as the reader zooms in — and the
// gaps between the nodes stay where the arrangement put them. Zoomed in, the
// room is there and the constant was still cutting the name at the width it
// would have needed at the world view. That is what the owner saw: `The
// depopulation of indigen…` with empty space to its right.
//
// So the cut follows the room, and the room is two things:
//
//   - **the nearest label already placed in the same line of text**, which is
//     what keeps a label off its neighbour. Cutting to the room and placing
//     are therefore the same act: a label that had to be cut to fit cannot
//     then overlap what it was cut to fit beside;
//   - **the edge of the pane**, because a name that runs off the screen is
//     not a longer name, it is a clipped one.
//
// And one bound that is not room: **a label never takes more of the picture
// than it did at the world view.** `SLICE` is the width `LABEL_CHARS` took at
// k = 1, in the graph's own units, and it is the whole of the old rule that
// survives. At the world view it binds and the picture is the one that was
// there before; at every zoom past it the same slice of the picture is more
// characters on screen, which is exactly the room the zoom opened.

export const LABEL_SIZE = 11;
// What the cut used to be, everywhere, at every zoom. It is a width now.
export const LABEL_CHARS = 28;
// How much of the font size a character takes, on average: the estimate the
// box has always been made with, and the same number the map's placer uses
// (map/labels.js, `EM`). An estimate of the stylesheet, not a second one.
export const EM = 0.55;
// An em is an average, and a name is not: digits, capitals and the ellipsis
// are all wider than one. Measured on this corpus, a label's own letters run
// up to about a tenth over what the average says, and a short one up to a
// character over on top of that — which is what put two names on each other
// at the arrival view while every box said they were clear. The box carries
// both, because a box a character too wide costs a neighbour a character and
// a box a character too narrow costs the reader both names.
export const SLACK = 1.1;
export const SLACK_CHARS = 1;
// Under this, what is left of a name says nothing — five letters and an
// ellipsis — and the mark's own title still carries the whole of it. A side
// with less room than this has no room, which is the same answer the drawing
// gave before when a label collided: the other side, or no label.
export const MIN_CHARS = 6;
// A character's width and a line's half-height, in the graph's own units at
// this zoom. Both shrink as the reader zooms in, because the text does not.
//
// **`size` since M88 §1** (the third review, finding B1). The text is written
// at `LABEL_SIZE` divided by the zoom, which is one size on screen at every
// zoom — and one size on screen is not one size in every *pane*: a phone
// scales the whole picture down and the names with it, and eleven units came
// out four pixels. The drawing answers that by writing the names larger in the
// picture's own units, so they land at the floor on screen; every box measured
// here has to be measured at the size the text will actually be written at, or
// the placer would fit eleven-unit boxes and draw twenty-unit words in them.
// Defaulted, so every caller that has one size goes on having it.
export const charWidth = (k, size = LABEL_SIZE) => (size * EM) / k;
// Exported since M77: the placer beside this file writes a label on a line of
// its own when its own line is taken, and the half-height of a line is what
// says which line a box is in. One number, in one place.
export const halfLine = (k, size = LABEL_SIZE) => (size * 0.7) / k;

// What a label of so many characters takes across the picture, slack and all.
export const boxWidth = (chars, k, size = LABEL_SIZE) => (chars * SLACK + SLACK_CHARS) * charWidth(k, size);
// The slice of the picture a label is allowed: what the old constant cut took
// at the world view, so that at k = 1 the answer is that constant exactly.
export const SLICE = boxWidth(LABEL_CHARS, 1);

// Where the text of a label starts: clear of the mark it names, on the side
// it is written. `gap` is in units of the screen, as every size in the
// drawing is, and is divided by the zoom like the rest of them.
export const textStart = (node, right, k, gap) => node.x + (right ? 1 : -1) * (gap / k);

// Rough, and deliberately so: the box only has to be good enough to keep two
// labels off each other, and it is made of the text that will actually be
// drawn rather than of what was allowed — a name that came out shorter than
// its room leaves the rest of that room to its neighbour.
export function labelBox(node, chars, right, k, gap) {
  const width = boxWidth(chars, k);
  const x = textStart(node, right, k, gap);
  return {
    x0: right ? x : x - width,
    x1: right ? x + width : x,
    y0: node.y - halfLine(k),
    y1: node.y + halfLine(k),
    x,
    right,
  };
}

// How far this label may run on this side before it would touch something:
// the labels already placed in its own line of text, the marks of the nodes
// that are going to be named in it, and the pane's edge. Negative when there
// is nothing at all — the text would start inside a label already there.
//
// `named` is what keeps the picture's names rather than its longest name. The
// heaviest label is placed first and, with only the labels already placed in
// its way, it would run straight over the mark of a lighter neighbour and
// leave it nowhere to write from: the neighbour then has no label at all, and
// a longer name bought with a neighbour's name is a bad trade. Stopping
// before the mark costs the long label the last few characters and leaves the
// short one its own side to be written on.
export function roomOn(node, right, { k, gap, box, placed = [], named = [] }) {
  const x = textStart(node, right, k, gap);
  const y0 = node.y - halfLine(k);
  const y1 = node.y + halfLine(k);
  let limit = right ? box.x1 : box.x0;
  for (const other of placed) {
    // Not in this line of text, so it is not in the way however close it is.
    if (other.y1 <= y0 || y1 <= other.y0) continue;
    if (right) {
      if (other.x1 > x) limit = Math.min(limit, other.x0);
    } else if (other.x0 < x) {
      limit = Math.max(limit, other.x1);
    }
  }
  for (const other of named) {
    if (other === node || Math.abs(other.y - node.y) > halfLine(k)) continue;
    const edge = textStart(other, !right, k, gap);
    if (right) {
      if (edge > x) limit = Math.min(limit, edge);
    } else if (edge < x) {
      limit = Math.max(limit, edge);
    }
  }
  return right ? limit - x : x - limit;
}

// That room in characters, at this zoom, under the slice. The inverse of
// `boxWidth`: how many characters a box of this width would hold.
export function charsFor(room, k) {
  return Math.floor((Math.min(room, SLICE) / charWidth(k) - SLACK_CHARS) / SLACK);
}

// A name cut to what the room allows, or nothing when the room is not worth a
// name. The ellipsis counts towards the length, as it always did.
export function shorten(text, chars) {
  return text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text;
}

// What to draw on one side of a mark, or null when that side has no room.
export function fitOn(name, node, right, { k, gap, box, placed = [], named = [] }) {
  const chars = charsFor(roomOn(node, right, { k, gap, box, placed, named }), k);
  if (chars < MIN_CHARS) return null;
  const text = shorten(name, chars);
  return { text, right, rect: labelBox(node, text.length, right, k, gap) };
}

// And which side. The right, as it always was, unless the left can show more
// of the name — which is the old rule about collisions read through the room:
// a side a label does not fit on is a side with no room, and a side with more
// room is where the reader gets more of the name.
export function fitLabel(name, node, { k, gap, box, placed = [], named = [] }) {
  const right = fitOn(name, node, true, { k, gap, box, placed, named });
  const left = fitOn(name, node, false, { k, gap, box, placed, named });
  if (!right) return left;
  if (!left) return right;
  return left.text.length > right.text.length ? left : right;
}

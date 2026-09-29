// Which marks on the graph are named, and where each name is written.
//
// One rule, and it is the whole of this file: **a name is drawn whole or it is
// not drawn at all.** Until M77 a label was cut to the room beside its mark
// (label-fit.js, M61), which is an honest answer to "how much of this name
// fits" and the wrong answer to "what does the reader learn from it". The
// owner, 21 September, looking at the graph with a narrative open: *"It looks
// clouded and there are too many labels on top that don't really need to be
// always visible."* The measurement behind that sentence is in STATUS.md —
// eight of fourteen labels cut to `The Ab…`, `The Rev…`, `Dutch B…`, and four
// of a twenty-eight-step argument named in full. Five letters and an ellipsis
// is not a name; it is ink where a name should be.
//
// So a label that does not fit waits for the reader to hover the mark, whose
// title carries the whole of it and always did. What "fit" means gained one
// freedom to make that affordable: **a label may be written on a nearby line
// of text rather than on its own.** The picture is wide and thinly stacked,
// there are tens of free lines above and below any mark, and a name one line
// off its mark still plainly belongs to it — where a name cut to six letters
// belongs to nothing.
//
// And **which marks are named is a different question from where the name
// goes**, so it is answered separately here too:
//
//   with a lens on   the focus set, and nothing else. A lens is a question the
//                    reader asked; the events it keeps are the answer and the
//                    ring around them is context. Names in reading order, so
//                    the first step of a walk has first pick of the room;
//   at rest          the heaviest marks on screen, as before, capped below the
//                    zoom at which every mark is named.
//
// Pure: nodes, a zoom and a rectangle in, a list of placements out. No DOM, no
// state, no atlas.

import {
  LABEL_SIZE, SLICE, boxWidth, textStart, halfLine,
} from './label-fit.js';

// How far apart two lines of labels sit, as a multiple of the type size. A
// little over the line height the halo needs, so two names on neighbouring
// lines are two lines and not a thicket.
export const LINE = 1.5;
export const lineHeight = (k, size = LABEL_SIZE) => (size * LINE) / k;
// How far from its own line a label may be written: as far as the picture
// goes. The events on screen are what the reader is looking at and every one
// of them is to be named, and what makes that legible is the leader the
// drawing puts under a label that had to move (graph-view.js). The walk of a
// narrative is 22 of 28 marks on one line of the layout — measured, STATUS.md
// — with the whole field free above and below it, so the room is there and
// this is what reaches it.
//
// It was two answers until M82: two lines at rest and eighteen inside a lens,
// on the argument that the resting picture wanted "a few anchors" rather than
// every name. What that bought was the reviewer's first screen of the graph —
// two hundred unlabelled circles and a dozen names. The field above a mark is
// as free at rest as it is under a lens, so there is one answer now (A1).
export const ROWS_AWAY = 2;
export const LENS_ROWS_AWAY = 18;

// The box a whole name takes on one side of a mark, on a line `dy` away from
// the mark's own. Rough, as label-fit.js's is and for the same reason: it only
// has to be good enough to keep two names off each other.
export function labelBoxAt(node, name, right, { k, gap, dy = 0, size = LABEL_SIZE }) {
  const width = boxWidth(name.length, k, size);
  const x = textStart(node, right, k, gap);
  const y = node.y + dy;
  return {
    x0: right ? x : x - width,
    x1: right ? x + width : x,
    y0: y - halfLine(k, size),
    y1: y + halfLine(k, size),
    x,
    y,
    right,
  };
}

const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

// Inside the rectangle the reader can actually see. A name that runs off the
// pane is a clipped name, which is the very thing this file refuses to draw.
const withinView = (box, view) => box.x0 >= view.x0 && box.x1 <= view.x1
  && box.y0 >= view.y0 && box.y1 <= view.y1;

// A box may not be written across a mark that is going to be named: that mark
// needs its own side to write from, and a name laid over a circle is two
// things the reader has to take apart (label-fit.js says the same about the
// room it measures).
function coversAMark(box, node, marks, k, size = LABEL_SIZE) {
  const reach = halfLine(k, size);
  for (const other of marks) {
    if (other === node) continue;
    if (other.x >= box.x0 && other.x <= box.x1
      && other.y >= box.y0 - reach && other.y <= box.y1 + reach) return true;
  }
  return false;
}

// The lines a label is offered, nearest first and its own line first of all:
// 0, then one above and one below, then two, and so on. Above before below
// only because something has to come first and a picture drawn twice must be
// drawn the same way.
function* offsets(rows, k, size = LABEL_SIZE) {
  yield 0;
  for (let i = 1; i <= rows; i += 1) {
    yield -i * lineHeight(k, size);
    yield i * lineHeight(k, size);
  }
}

// Whether a label ended up somewhere other than on its mark's own line, and
// therefore needs the thin leader that ties it back (graph-view.js draws it).
export const movedAway = (node, rect, k, size = LABEL_SIZE) => Math.abs(rect.y - node.y) > halfLine(k, size);

// Where one name goes, or null when there is nowhere for the whole of it.
//
// `capped` is M61's slice — the share of the picture a label was allowed at
// the world view — and it is what keeps a fifty-character name out of a
// picture of everything until the reader zooms in. A lens is not capped: the
// reader has asked about these events and the atlas answers with their names.
export function placeOne(name, node, {
  k, gap, view, placed = [], marks = [], rows = ROWS_AWAY, capped = true, size = LABEL_SIZE,
}) {
  if (capped && boxWidth(name.length, k, size) > SLICE) return null;
  for (const dy of offsets(rows, k, size)) {
    for (const right of [true, false]) {
      const box = labelBoxAt(node, name, right, { k, gap, dy, size });
      if (!withinView(box, view)) continue;
      if (placed.some((other) => overlaps(box, other))) continue;
      if (coversAMark(box, node, marks, k, size)) continue;
      return { text: name, right, rect: box };
    }
  }
  return null;
}

// Every name that can be written whole, in the order it is offered: each one
// takes the room it needs and the next is placed around it. The order is the
// caller's — reading order inside a lens, heaviest first at rest — so what a
// crowded picture keeps is what the reader came for.
export function placeLabels(candidates, {
  k, gap, view, rows = ROWS_AWAY, capped = true, size = LABEL_SIZE,
}) {
  const placed = [];
  const marks = candidates.map((c) => c.node);
  const out = [];
  for (const { node, name } of candidates) {
    if (typeof name !== 'string' || name.length === 0) continue;
    const found = placeOne(name, node, {
      k, gap, view, placed, marks, rows, capped, size,
    });
    if (!found) continue;
    placed.push(found.rect);
    out.push({ node, ...found });
  }
  return out;
}

// Which marks are offered a name, and in what order.
//
// `focus` is the lens's own set of event ids, or null at rest. `order` is the
// reading order of that set — a narrative's steps, in the order the narrator
// put them — and anything it does not name keeps the weight order behind it.
export function naming(nodes, {
  focus = null, order = null, limit = Infinity, all = false,
}) {
  const byWeight = [...nodes].sort(
    (a, b) => b.weight - a.weight || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
  if (!focus) return all ? byWeight : byWeight.slice(0, limit);
  const kept = byWeight.filter((n) => focus.has(n.representative.id));
  if (!order) return kept;
  const at = new Map(order.map((id, i) => [id, i]));
  return kept.sort((a, b) => {
    const ai = at.get(a.representative.id) ?? Infinity;
    const bi = at.get(b.representative.id) ?? Infinity;
    return ai - bi || b.weight - a.weight || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  });
}

// Where the map's camera starts when the reader has asked it a question.
//
// The map had no camera at all: the world at `k = 1` until the reader panned,
// and a link that named a box (`fitTo`). So a lens drew its marks wherever the
// projection happens to put them, which on a portrait phone is off the screen:
// `?focus=actor:nigeria` at 390 px showed Russia's east, China, South-East Asia
// and Australia, and not one mark, because Nigeria is in Africa and the crop
// keeps the Pacific (`docs/review-2026-09-26.md`, A2). The graph has answered
// this since M74 — *the widest of the wanted sets that fits is the one framed,
// and the narrowest is the fallback* — and what a reader asked for being on the
// screen is not a fact about which picture they asked it of.
//
// So the arithmetic is the graph's own (`graph-view/frame.js`) and there is no
// second copy of it: two cameras that could disagree about how a set of marks is
// put inside a rectangle would be the fault M74 fixed, written twice. What is
// here is the map's own share — which marks, and the one rule that is about the
// map and not about the graph: on a phone with nothing asked, the whole world.
//
// Pure but for the projection it is handed: a list of ids, the atlas's own
// points, and the rectangle the reader can see. Out comes the `{ x, y, k }` the
// viewport is translated and scaled by, or null where there is nothing to frame.

import { frameFor } from '../graph-view/frame.js';

// The marks a set of ids stands for, in the projection's own units — which are
// the units the transform is applied in, so the frame is in them too.
//
// An event whose place the atlas cannot resolve has no mark on the map and is
// not a thing to frame: it is in the corner's count and on the timeline
// (map.js, `drawCorner`). An id that is not an event — a lens set holds only
// events, but `shown` is composed — is skipped for the same reason.
export function markNodes(atlas, ids, projection) {
  const nodes = [];
  for (const id of ids ?? []) {
    const event = atlas.events.get(id);
    const where = event ? atlas.pointOf(event) : null;
    if (!where || !Number.isFinite(where.lon) || !Number.isFinite(where.lat)) continue;
    const [x, y] = projection.project([where.lon, where.lat]);
    nodes.push({ id, x, y });
  }
  return nodes;
}

// The camera a set of wanted sets asks for, widest first. `maxStretch` is not
// offered: the map's two axes are longitude and latitude and stretching one of
// them would be a different projection, which is the one thing `projection.js`
// is for. `s` comes back as 1 and is dropped, because the map's transform is
// three numbers and a fourth in it would be a number nothing applies.
export function frameOn(nodes, wanted, box, { min, max, pad = 0 }) {
  const at = frameFor(nodes, wanted, box, { min, max, pad, maxStretch: 1 });
  return at ? { x: at.x, y: at.y, k: at.k } : null;
}

// Which sets the map offers the frame, widest first, or null where there is
// nothing to frame — which is the resting picture on anything but a phone, where
// the whole world at `k = 1` is already the answer and moving the camera for it
// would be the map flying somewhere nobody asked it to go.
//
// Under a lens: everything the lens draws, then the focus alone. That is the
// graph's own list (graph-view.js), and it is what makes an event chosen with a
// small ring framed with its ring and one whose ring is wider than the pane
// framed on the event.
export function wantedSets(working) {
  if (!working?.lens) return null;
  return [working.shown, working.lensFocus].filter((set) => set && set.size > 0);
}

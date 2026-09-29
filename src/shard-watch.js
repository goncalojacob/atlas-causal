// A control that names records, and the count of centuries it last drew at.
//
// Since I4 a title arrives with its attribute shard and not with the picture,
// so everything that prints one has to be drawn twice: once out of the core,
// where the name is not there yet, and again when it is. `main.js` does that
// from one callback (`redrawForShards`), booked on the animation frame after a
// landing — and the third review found the front card greeting a reader with
// `how-the-colonial-war-ended-the-regime · 0 steps` on three loads in eight
// (`docs/review-2026-09-26.md`, A1). Whatever happened to that one frame — the
// tab hidden when it was due, a landing that arrived while a redraw was already
// booked, a throw earlier in the same function — left the card on the ids it was
// born with, for as long as it stayed open.
//
// One callback is a single point of failure; the count is a fact. So a control
// that names records keeps the shard count it last drew at and compares it to
// the atlas's own whenever it is nudged — by `main.js`, by a state change, or by
// the tab coming back — and draws again when it has moved. Every nudge is then
// idempotent: a control asked to look twice for one landing draws once, and one
// that missed the landing altogether draws at the reader's next breath.
//
// `visibilitychange` is the one the callback cannot cover at all: an animation
// frame is not run while the document is hidden, so a shard that lands in a
// background tab has no frame to be drawn in and the redraw is simply never
// made. And the count cannot be trusted there either — the atlas's own settle,
// which is what moves it, is deferred by a frame too (data.js, `deferBatch`), so
// the rows can be in the records with the count still standing where it was. So
// the tab coming back **draws**, rather than asking whether it needs to: it is
// the one moment where the answer to that question is itself unreliable, and a
// redraw is cheap. The three callers are a card with no input in it and two
// controls that put the reader's keyboard back where it was, so drawing one more
// time than necessary costs nothing at all.
//
// A leaf module: it knows the render-key's integer and the two things a browser
// gives it, and nothing about what any of the three controls draw.

import { shardsArrived } from './render-key.js';

// `draw` is called when the count has moved since it last was — never on the
// first `check()` alone, because every caller has already drawn itself by then.
// A caller with its own guard (the chips compare the names they drew) may be
// called for a landing that changes nothing of theirs; deciding that is theirs
// and not this module's.
export function createShardWatch(atlas, draw, { state = null, doc = null } = {}) {
  let seen = shardsArrived(atlas);

  function check() {
    const now = shardsArrived(atlas);
    if (now === seen) return false;
    seen = now;
    draw();
    return true;
  }

  // A control that has just drawn itself for its own reasons — the intro when
  // the "?" opens it — is up to date, whatever it was before.
  function drawn() {
    seen = shardsArrived(atlas);
  }

  state?.subscribe(check);
  doc?.addEventListener?.('visibilitychange', () => {
    if (doc.hidden) return;
    seen = shardsArrived(atlas);
    draw();
  });

  return { check, drawn, seen: () => seen };
}

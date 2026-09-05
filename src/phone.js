// The atlas on a phone.
//
// Below PHONE_WIDTH the three panes cannot stand side by side, so the layout
// stacks: the view on top, the timeline at a fixed height under it, and the
// panel as a sheet that comes up from the bottom edge when a record is opened
// and is pushed back down to its grip when it is in the way. The arrangement
// itself is CSS — this file sets three classes and one length, never a
// layout — so the whole phone rule lives in one media query, and the pane
// sizes of M24, which that query does not mention, are ignored at this width.
//
// Nothing here is state. How tall the sheet is, and whether the options are
// unfolded, say nothing about what the atlas is showing: they never reach the
// store and never reach the URL, exactly as the pane sizes and the open
// section do not. A phone and a desktop opening the same link see the same
// records.
//
// The pure half — what raises the sheet, and what a drag ends as — is
// separate from the pointer handling, so node --test holds the decisions
// without a DOM. Left and right are never named: the sheet moves along the
// block axis only, which is what a language written right to left would keep
// (docs/i18n-design.md).

import { OPENINGS } from './state.js';

// Around 720: two columns of the type scale's measure plus a map worth
// looking at do not fit under it, and it is above every phone in portrait
// and below every tablet in landscape.
export const PHONE_WIDTH = 720;
export const PHONE_QUERY = `(max-width: ${PHONE_WIDTH}px)`;

// How far the grip has to travel before the drag is read as a decision
// rather than as a thumb resting on it.
export const DRAG_THRESHOLD = 56;

// Is a record open at all? `step` is not one of these on its own: it is a
// position inside a narrative, and the narrative beside it is the opening.
const CARDS = OPENINGS.filter((key) => key !== 'step');

export function hasOpening(state = {}) {
  return CARDS.some((key) => state[key]);
}

// The sheet comes up when what is open changes to something. Not on every
// change of state: panning the map or dragging the band must not throw the
// panel over the picture the reader is moving.
//
// And nothing inside a narrative raises it. A step is a position, not an
// opening, and everything that moves with it — the selection, the walk, the
// window — is derived from it (narrative-mode.js); the card's own text says
// the map, the graph and the timeline follow the step, so throwing the sheet
// over all three at every arrow key covered exactly what the reader was being
// told to watch (health review A, finding 32). Opening the narrative raises
// the sheet once; from there the grip is the control.
export function raisesSheet(before = {}, after = {}) {
  if (!hasOpening(after)) return false;
  if (after.narrative && before.narrative === after.narrative) return false;
  return CARDS.some((key) => (before[key] ?? null) !== (after[key] ?? null));
}

// A drag of the grip, ended. `dy` is downward-positive, as clientY is.
// A press that never moved is a tap and toggles; a drag decides by where it
// went, so a sheet dragged down a long way closes and one nudged and let go
// springs back.
export function afterDrag(dy, open, threshold = DRAG_THRESHOLD) {
  if (Math.abs(dy) < 4) return !open;
  if (open) return dy < threshold;
  return dy < -threshold;
}

export function createPhone({
  state,
  sheet = null,
  grip = null,
  tools = null,
  options = null,
  body = globalThis.document?.body ?? null,
  media = globalThis.matchMedia ? globalThis.matchMedia(PHONE_QUERY) : null,
} = {}) {
  let open = false;
  let previous = Object.fromEntries(OPENINGS.map((key) => [key, state?.get()?.[key] ?? null]));

  const setOpen = (next) => {
    open = Boolean(next);
    sheet?.classList.toggle('open', open);
    sheet?.classList.toggle('peek', !open);
    grip?.setAttribute('aria-expanded', String(open));
    sheet?.style.removeProperty('--sheet-drag');
  };

  const setOptions = (next) => {
    tools?.classList.toggle('options-open', Boolean(next));
    options?.setAttribute('aria-expanded', String(Boolean(next)));
  };

  const isPhone = () => Boolean(media?.matches);

  // Leaving the phone width puts everything back: the desktop layout has no
  // sheet and no options button, and a class left behind would style a page
  // the media query is no longer talking about.
  const applyWidth = () => {
    body?.classList.toggle('phone', isPhone());
    if (!isPhone()) {
      setOptions(false);
      sheet?.style.removeProperty('--sheet-drag');
    }
  };
  applyWidth();
  setOpen(hasOpening(state?.get() ?? {}));
  setOptions(false);

  media?.addEventListener?.('change', applyWidth);

  state?.subscribe?.((s) => {
    const now = Object.fromEntries(OPENINGS.map((key) => [key, s[key] ?? null]));
    if (raisesSheet(previous, now)) setOpen(true);
    previous = now;
  });

  options?.addEventListener('click', () => {
    setOptions(!tools?.classList.contains('options-open'));
  });

  // The grip. A button, so the tap is a click and the keyboard reaches it
  // without a keydown handler; the drag is pointer events on top of that,
  // and the flag is what stops a drag from also counting as the tap — the
  // same guard the map and the graph need for a pan that ends on a mark.
  let drag = null;
  let dragged = false;
  if (grip) {
    grip.addEventListener('pointerdown', (e) => {
      if (!isPhone()) return;
      drag = { y: e.clientY, pointerId: e.pointerId, height: sheet?.getBoundingClientRect().height ?? 0 };
      dragged = false;
      sheet?.classList.add('dragging');
      try { grip.setPointerCapture(e.pointerId); } catch { /* no such pointer any more */ }
    });
    grip.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (Math.abs(dy) > 4) dragged = true;
      // Downward only when it is up, upward only when it is down: the sheet
      // never leaves the screen and never rises past its own height.
      const clamped = open
        ? Math.min(Math.max(0, dy), drag.height)
        : Math.max(Math.min(0, dy), -drag.height);
      sheet?.style.setProperty('--sheet-drag', `${Math.round(clamped)}px`);
    });
    const end = (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.y;
      try { grip.releasePointerCapture(drag.pointerId); } catch { /* already released */ }
      drag = null;
      sheet?.classList.remove('dragging');
      // A press that never moved is a tap, and a tap is the click that
      // follows: deciding it here as well would toggle the sheet twice and
      // leave it exactly where it started.
      if (dragged) setOpen(afterDrag(dy, open));
      else sheet?.style.removeProperty('--sheet-drag');
    };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
    grip.addEventListener('click', () => {
      // A drag has already decided. Cleared here, once this click has been
      // judged, so the next clean tap is one — the guard the map and the
      // graph need for a pan that ends on a mark.
      if (dragged) {
        dragged = false;
        return;
      }
      setOpen(!open);
    });
  }

  return {
    isPhone,
    isOpen: () => open,
    // What the map and the timeline call when a tap opens a list of records
    // rather than a record: a cluster and the narrative list are shown by the
    // panel directly and never pass through the store, so nothing else would
    // raise the sheet over them.
    open: () => setOpen(true),
    close: () => setOpen(false),
    setOptions,
  };
}

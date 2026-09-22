// The one way out of a card, and there is no other.
//
// The owner, 22 September, on a source's card whose heading line read
// *"Norrie MacQueen · 1997 · BOOK · close · Focus on this"*: *"Here you can
// see the 'close' button. Instead it should be a simple cross on the top right
// corner."*
//
// It was worse than one badly placed word. Three cards said it as "close" — a
// source, a place and an office — the actor's said "stop highlighting", and an
// event, a link and a narrative had no way out at all; every one of the four
// stood in the middle of a line of metadata, between the type of a book and
// "Focus on this", which is not where a reader looking for the way out of a
// card looks. It is the same fault M82 found in the four names for leaving a
// lens (A7): one act said four ways, none of them where the hand goes.
//
// So it is one control now, the same on every card, in the corner every
// interface a reader has ever used puts it in.
//
// **The markup is here and not in the cards**, because seven copies of one
// button are seven buttons that can drift apart, and because a card that had
// to be handed its own cross could be handed a different one. **The act is
// here too**: what a cross takes away is whichever card stands at the top of
// the panel's own precedence, so the control does not have to know which card
// it was clicked on and `panel.js` does not keep a second list of which
// parameter each kind writes.
//
// No new hex value, token or type size: the cross is the multiplication sign
// set in the type the card is already in, on the tokens the panel already
// spends (`src/style.css`, `.panel .card-close`).

// The accessible name, which is the word a screen reader says and the word the
// tests ask for. The glyph beside it is decoration and is hidden from both.
export const CLOSE_LABEL = 'Close';

// The panel's own precedence, top first: exactly the order `render()` draws
// in (panel.js). The card on top is the one the reader can see, so that is the
// one a cross takes away. Written here and not read off `CARDS` in state.js,
// whose order is the URL's and says nothing about which card wins.
export const CARD_ORDER = Object.freeze([
  'narrative', 'edge', 'selected', 'source', 'office', 'place', 'actor',
]);

// The cross itself. One line, so that every card's heading is the card's and
// the way out is the atlas's.
export function closeControlHtml() {
  return `<button type="button" class="card-close" data-action="close-card" `
    + `aria-label="${CLOSE_LABEL}" title="${CLOSE_LABEL}"><span aria-hidden="true">×</span></button>`;
}

// What closing writes, as a patch. Pure, so the precedence can be asserted
// without a DOM and without a store.
//
// `null` when no card is open: a cross is not drawn then, and a click that
// arrived anyway must not push a history entry for nothing.
export function closes(state = {}) {
  const open = CARD_ORDER.find((key) => state?.[key]);
  if (!open) return null;
  // The walk goes with the event it ends at. A chain is the path *into* the
  // record being read; a path with nothing at the end of it is not a path the
  // reader could go on following, and the store already leaves the horizon
  // behind when the selection changes (state.js, `leftBehind`).
  if (open === 'selected') return { selected: null, chain: [] };
  return { [open]: null };
}

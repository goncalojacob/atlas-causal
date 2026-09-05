// The collapsible sections a card is made of, and which one of them is open.
//
// A card is a head, a summary, and then everything else — consequences,
// causes, the other branches, the citations, the narratives — behind a header
// that says how many there are before it is opened. The count is the point:
// it lets the reader decide whether to open a section without opening it, and
// it is where a dispute is announced, because a disagreement hidden inside a
// closed section would be a disagreement presented as settled.
//
// One is open at a time. The panel is a narrow column; two open sections put
// the second one a screenful below the first, which is the reading problem
// this exists to fix.
//
// Which one is open is a preference and not state: it says nothing about what
// the atlas is showing, so it stays out of the URL and lives in localStorage,
// per reader, per browser, the way the pane sizes do (panes.js).
//
// The pure half — which section a card opens on, and how a count reads — is
// separate from the toggling, so node --test holds it without a DOM.

import { esc } from '../util/esc.js';

export const STORAGE_KEY = 'atlas-causal.card-section';
// Everything closed is a choice a reader can make, and it has to survive a
// reload as much as an open section does. An *absent* key is a different
// thing — "this reader has never chosen" — and is what the default rule
// below answers; hence a stored empty string rather than a removed key.
export const NONE = '';

// Our own keys, and the only thing ever interpolated into an attribute
// selector below. A stored value from a version that wrote something else
// must not be able to reach querySelector.
const KEY = /^[a-z][a-z0-9-]*$/;

export function readOpenSection(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return typeof raw === 'string' && (raw === NONE || KEY.test(raw)) ? raw : null;
  } catch {
    // A browser with storage turned off still reads cards; it just forgets.
    return null;
  }
}

export function writeOpenSection(storage, key) {
  try {
    storage?.setItem(STORAGE_KEY, key ?? NONE);
    return true;
  } catch {
    return false;
  }
}

// Which section a card opens on. The arrival decides first, because it is
// what the reader just did: walking a chain is a question about what happens
// next, and reaching an event from a source's card is a question about what
// the claim rests on. Only when the arrival says nothing does the reader's
// own remembered choice stand, and only when there is no choice either does
// the card fall back to its consequences — which is what this atlas is for.
export function openSection(keys, { chain = [], source = null, remembered = null } = {}) {
  const has = (key) => keys.includes(key);
  if (chain.length > 0 && has('consequences')) return 'consequences';
  if (source && has('sources')) return 'sources';
  if (remembered === NONE) return null;
  if (remembered && has(remembered)) return remembered;
  if (has('consequences')) return 'consequences';
  return keys[0] ?? null;
}

// "9", or "9, 1 disputed". A dispute is counted in the header rather than
// only in the row, so that a closed section still says there is an argument
// inside it. A section of one thing has no count worth showing — the link the
// reader followed to get here is one link — but it still says so when that
// one thing is disputed.
export function countLabel(count, disputed = 0) {
  if (count === null || count === undefined) return disputed > 0 ? `${disputed} disputed` : '';
  return disputed > 0 ? `${count}, ${disputed} disputed` : String(count);
}

// A native <button> for the header, so Enter and Space work without this
// file knowing a key exists, and aria-expanded/aria-controls so that a
// screen reader is told what the button does and to what.
// What goes inside a section's body. Its own function because a section can
// be rewritten in place — a place's list of events is re-faded when the band
// moves (panel.js) — and the hint has to be assembled the same way both
// times or the rewrite would quietly drop it.
export function sectionBodyHtml({ hint = '', body = '' }) {
  return `${hint ? `<p class="hint">${esc(hint)}</p>` : ''}${body}`;
}

export function sectionHtml({
  key, label, count = null, disputed = 0, open = false, hint = '', body = '',
}) {
  const id = `card-section-${key}`;
  const text = countLabel(count, disputed);
  const counted = text ? `<span class="count${disputed > 0 ? ' disputed' : ''}">${esc(text)}</span>` : '';
  return `<section class="card-section${open ? ' open' : ''}" data-section="${esc(key)}">
    <h2 class="section-head"><button type="button" class="section-toggle" data-action="section"
      data-section="${esc(key)}" id="${esc(id)}-head" aria-controls="${esc(id)}"
      aria-expanded="${open ? 'true' : 'false'}"><span class="section-marker" aria-hidden="true"></span><span
      class="section-label">${esc(label)}</span>${counted}</button></h2>
    <div class="section-body" id="${esc(id)}" role="region" aria-labelledby="${esc(id)}-head"${open ? '' : ' hidden'}>
      ${sectionBodyHtml({ hint, body })}
    </div>
  </section>`;
}

// Opening one closes the rest; clicking the open one closes it. Done in the
// DOM rather than by re-rendering the card: the summary and the citations
// were fetched, and a re-render would throw them away and ask again.
// Returns what ended up open, which is what gets remembered.
export function toggleSection(container, key, storage = globalThis.localStorage) {
  if (!container || !KEY.test(String(key ?? ''))) return null;
  let opened = NONE;
  for (const section of container.querySelectorAll('.card-section')) {
    const button = section.querySelector('.section-toggle');
    const body = section.querySelector('.section-body');
    const open = section.dataset.section === key && button?.getAttribute('aria-expanded') !== 'true';
    if (open) opened = key;
    if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) body.hidden = !open;
    section.classList.toggle('open', open);
  }
  writeOpenSection(storage, opened);
  return opened;
}

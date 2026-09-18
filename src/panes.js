// The edge between the view and the panel, and how wide the panel is.
//
// There used to be two of them: the timeline was a strip along the bottom of
// the map and a reader could drag how tall it was. M60 made the timeline a
// view, so there is no strip to resize and no height to remember — the
// picture that is up has the whole pane. The handle is gone rather than left
// half-alive, and a size stored by a reader who had it is simply not read.
//
// A size here is a preference and not state: it says nothing about what the
// atlas is showing, so it stays out of the URL — a link is what somebody is
// looking at, not how they have arranged their window — and lives in
// localStorage, per reader, per browser. The layout itself is CSS: this file
// writes two custom properties on the grid and nothing else, so the phone
// layout, whose media query does not mention them, ignores every size a
// reader ever chose on a desktop.
//
// The pure half — what a size is allowed to be, and how it is read and
// written — is separate from the pointer handling, so node --test holds the
// arithmetic without a DOM.

import { PHONE_QUERY } from './phone.js';

export const STORAGE_KEY = 'atlas-causal.panes';
// What must be left of each pane for it to be worth drawing at all. The
// panel's minimum is a line of prose at the type scale's measure; the map's
// is about a continent.
export const MIN_PANEL = 260;
export const MIN_MAIN = 320;

const round = (n) => Math.round(Number(n));

export function clampPanel(px, containerWidth) {
  const max = Math.max(MIN_PANEL, containerWidth - MIN_MAIN);
  return round(Math.min(max, Math.max(MIN_PANEL, px)));
}

// Null for the panel means "as the stylesheet has it", which is what a
// double-click on a handle restores. Anything that is not a number is read as
// null rather than refused: a stored value from a version that wrote
// something else must not stop the atlas from opening.
export function readSizes(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { panel: null };
    const parsed = JSON.parse(raw);
    const one = (v) => (Number.isFinite(v) && v > 0 ? round(v) : null);
    // A `timeline` written by a version that had the strip is left where it
    // is and read into nothing: an old preference must not stop the atlas
    // from opening, and it has nothing left to apply to.
    return { panel: one(parsed?.panel) };
  } catch {
    return { panel: null };
  }
}

export function writeSizes(storage, sizes) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ panel: sizes.panel ?? null }));
    return true;
  } catch {
    // A browser with storage turned off still resizes; it just forgets.
    return false;
  }
}

// The one property the grid is written in terms of. Removing it is how the
// stylesheet's own value comes back, so a default is never a number this file
// had to guess.
export function applySizes(layout, sizes) {
  if (!layout?.style) return;
  if (sizes.panel === null || sizes.panel === undefined) layout.style.removeProperty('--panel-width');
  else layout.style.setProperty('--panel-width', `${round(sizes.panel)}px`);
}

// --- the handles ----------------------------------------------------------

// How far an arrow key moves an edge, and how far with shift held.
const STEP = 16;
const BIG_STEP = 64;

export function createPanes(layout, {
  panelHandle,
  storage = globalThis.localStorage,
  onResize = () => {},
  media = globalThis.matchMedia ? globalThis.matchMedia(PHONE_QUERY) : null,
} = {}) {
  let sizes = readSizes(storage);

  // Below the phone width there is no pane to size: the view takes the screen
  // and the panel is a sheet, and the sheet's grip is the one control over how
  // much of it the panel takes (phone.js). The preference used to rely on the
  // media query never naming the property (health review A, finding 32); now
  // the size is not applied at all, the edge leaves the tab order, and a drag
  // or an arrow key on it does nothing. The stored size is untouched and comes
  // back whole at the width it was chosen for.
  const isPhone = () => Boolean(media?.matches);
  const apply = () => {
    applySizes(layout, isPhone() ? { panel: null } : sizes);
    if (panelHandle?.setAttribute) {
      panelHandle.setAttribute('tabindex', isPhone() ? '-1' : '0');
      panelHandle.setAttribute('aria-hidden', String(isPhone()));
    }
  };
  apply();
  media?.addEventListener?.('change', () => {
    apply();
    onResize(sizes);
  });

  const box = () => layout.getBoundingClientRect();
  const set = (patch, { remember = true } = {}) => {
    if (isPhone()) return;
    sizes = { ...sizes, ...patch };
    apply();
    if (remember) writeSizes(storage, sizes);
    onResize(sizes);
  };

  // The panel is measured from the right edge: it is the pane on the far side
  // of the handle, so the number the reader is dragging is the one that gets
  // stored.
  const panelAt = (clientX) => clampPanel(box().right - clientX, box().width);

  const bind = (handle, { at, key }) => {
    if (!handle) return;
    let pointerId = null;
    handle.addEventListener('pointerdown', (e) => {
      if (isPhone()) return;
      pointerId = e.pointerId;
      try { handle.setPointerCapture(pointerId); } catch { /* no such pointer any more */ }
      handle.classList.add('dragging');
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (pointerId === null) return;
      // Not remembered on every frame: one write when the reader lets go.
      set({ [key]: at(e.clientX) }, { remember: false });
    });
    const end = () => {
      if (pointerId === null) return;
      try { handle.releasePointerCapture(pointerId); } catch { /* already released */ }
      pointerId = null;
      handle.classList.remove('dragging');
      if (!isPhone()) writeSizes(storage, sizes);
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    // A double-click puts the edge back where the stylesheet had it, which is
    // the only way back to a default the reader never chose.
    handle.addEventListener('dblclick', () => set({ [key]: null }));
    handle.addEventListener('keydown', (e) => {
      if (isPhone()) return;
      const step = e.shiftKey ? BIG_STEP : STEP;
      const delta = { ArrowLeft: step, ArrowRight: -step }[e.key];
      if (delta === undefined) {
        if (e.key !== 'Home') return;
        e.preventDefault();
        set({ [key]: null });
        return;
      }
      e.preventDefault();
      // With no size chosen yet the pane's own measurement is the starting
      // point: the first arrow key nudges what is on screen, not a default
      // this file would otherwise have to guess.
      const measured = layout.querySelector('.panel')?.getBoundingClientRect();
      const current = sizes[key] ?? (measured?.width ?? MIN_PANEL);
      set({ [key]: clampPanel(current + delta, box().width) });
    });
  };

  bind(panelHandle, { at: panelAt, key: 'panel' });

  return { get: () => ({ ...sizes }), set, reset: () => set({ panel: null }) };
}

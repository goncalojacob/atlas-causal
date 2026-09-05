// The two edges between the three panes, and how wide the panes are.
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
export const MIN_TIMELINE = 90;
// The timeline may take most of the window but never all of it: a drag that
// could push the map off the screen entirely would be a way to lose the map
// with no way to find it again.
export const MAX_TIMELINE_SHARE = 0.75;

const round = (n) => Math.round(Number(n));

export function clampPanel(px, containerWidth) {
  const max = Math.max(MIN_PANEL, containerWidth - MIN_MAIN);
  return round(Math.min(max, Math.max(MIN_PANEL, px)));
}

export function clampTimeline(px, containerHeight) {
  const max = Math.max(MIN_TIMELINE, containerHeight * MAX_TIMELINE_SHARE);
  return round(Math.min(max, Math.max(MIN_TIMELINE, px)));
}

// Null for either pane means "as the stylesheet has it", which is what a
// double-click on a handle restores. Anything that is not a number is read as
// null rather than refused: a stored value from a version that wrote
// something else must not stop the atlas from opening.
export function readSizes(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { panel: null, timeline: null };
    const parsed = JSON.parse(raw);
    const one = (v) => (Number.isFinite(v) && v > 0 ? round(v) : null);
    return { panel: one(parsed?.panel), timeline: one(parsed?.timeline) };
  } catch {
    return { panel: null, timeline: null };
  }
}

export function writeSizes(storage, sizes) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ panel: sizes.panel ?? null, timeline: sizes.timeline ?? null }));
    return true;
  } catch {
    // A browser with storage turned off still resizes; it just forgets.
    return false;
  }
}

// The two properties the grid is written in terms of. Removing one is how the
// stylesheet's own value comes back, so a default is never a number this file
// had to guess.
export function applySizes(layout, sizes) {
  if (!layout?.style) return;
  if (sizes.panel === null || sizes.panel === undefined) layout.style.removeProperty('--panel-width');
  else layout.style.setProperty('--panel-width', `${round(sizes.panel)}px`);
  if (sizes.timeline === null || sizes.timeline === undefined) {
    layout.style.removeProperty('--timeline-height');
    layout.style.removeProperty('--timeline-max');
  } else {
    layout.style.setProperty('--timeline-height', `${round(sizes.timeline)}px`);
    // The cap in the stylesheet is there so packed rows cannot push the map
    // off the screen on their own. A reader who has dragged the edge has said
    // what they want instead, so it goes.
    layout.style.setProperty('--timeline-max', 'none');
  }
}

// --- the handles ----------------------------------------------------------

// How far an arrow key moves an edge, and how far with shift held.
const STEP = 16;
const BIG_STEP = 64;

export function createPanes(layout, {
  panelHandle,
  timelineHandle,
  storage = globalThis.localStorage,
  onResize = () => {},
  media = globalThis.matchMedia ? globalThis.matchMedia(PHONE_QUERY) : null,
} = {}) {
  let sizes = readSizes(storage);

  // Below the phone width there are no panes to size: the view and the
  // timeline are stacked and the panel is a sheet, and the sheet's grip is
  // the one control over how much of the screen it takes (phone.js). The two
  // preferences used to ignore each other and rely on the media query never
  // naming the properties (health review A, finding 32); now the sizes are
  // not applied at all, the edges leave the tab order, and a drag or an arrow
  // key on one does nothing. The stored size is untouched and comes back
  // whole at the width it was chosen for.
  const isPhone = () => Boolean(media?.matches);
  const apply = () => {
    applySizes(layout, isPhone() ? { panel: null, timeline: null } : sizes);
    for (const handle of [panelHandle, timelineHandle]) {
      if (!handle?.setAttribute) continue;
      handle.setAttribute('tabindex', isPhone() ? '-1' : '0');
      handle.setAttribute('aria-hidden', String(isPhone()));
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

  // The panel is measured from the right edge and the timeline from the
  // bottom: both are the pane on the far side of the handle, so the number
  // the reader is dragging is the one that gets stored.
  const panelAt = (clientX) => clampPanel(box().right - clientX, box().width);
  const timelineAt = (clientY) => clampTimeline(box().bottom - clientY, box().height);

  const bind = (handle, { at, key, axis }) => {
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
      set({ [key]: at(axis === 'x' ? e.clientX : e.clientY) }, { remember: false });
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
      const towards = axis === 'x'
        ? { ArrowLeft: step, ArrowRight: -step }
        : { ArrowUp: step, ArrowDown: -step };
      const delta = towards[e.key];
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
      const pane = layout.querySelector(axis === 'x' ? '.panel' : '.timeline-area');
      const measured = pane?.getBoundingClientRect();
      const current = sizes[key]
        ?? (axis === 'x' ? (measured?.width ?? MIN_PANEL) : (measured?.height ?? MIN_TIMELINE));
      set({ [key]: axis === 'x' ? clampPanel(current + delta, box().width) : clampTimeline(current + delta, box().height) });
    });
  };

  bind(panelHandle, { at: panelAt, key: 'panel', axis: 'x' });
  bind(timelineHandle, { at: timelineAt, key: 'timeline', axis: 'y' });

  return { get: () => ({ ...sizes }), set, reset: () => set({ panel: null, timeline: null }) };
}

// The lens chips in the header: which records are in focus, one chip each
// with its own ×, and the two controls that belong to the whole list.
//
// It was the back half of `src/grouping.js` until M77. The front half — the
// picker that chose one lane per actor, per place or per region, and the
// panel that let a reader tick and reorder those lanes — is gone, with the
// `group` state and the named lanes behind it. The owner, 21 September:
// *"Right now the grouping function is useless, let's simplify the platform
// and remove it."* The chips were never part of it; they are the header's
// account of the lens, and a lens the reader cannot see they are inside
// would make the atlas look like it had lost half its records.

import { html } from './util/dom.js';
import { esc } from './util/esc.js';
import { lensLabels, withoutFocus, FOCUS_NONE, BACK_LABEL } from './lens.js';

const LENS_KIND = Object.freeze({
  actor: 'actor', place: 'place', source: 'source', event: 'event', region: 'region', narrative: 'narrative',
});

export function createLensChips(container, { atlas, state }) {
  const badge = html('span', { class: 'lens-chips', hidden: 'hidden' });
  container.append(badge);

  // What was drawn last, and what the keyboard was standing on when it was
  // thrown away (M88 §7, the third review, finding B7).
  //
  // `render` rewrites the whole list on every state change, and the reader's
  // own button is among the elements it replaces: pressing "all of these" with
  // the keyboard dropped the focus to the top of the document. The graph has
  // answered this since M83 (B5) by remembering *which record* named the
  // focused element and finding its match after the redraw; here the element
  // is named by `data-action` and, for a chip's ×, by `data-focus`.
  //
  // Two halves, and the first is what makes the second rare: a render that
  // would draw what is already on screen is skipped, so the notifications that
  // change nothing about the chips — a band nudge, a category toggled, a
  // century landing that names nothing here — do not touch the focus at all.
  let drawn = null;
  const focusedHere = () => {
    const active = badge.ownerDocument?.activeElement;
    if (!active || !badge.contains(active)) return null;
    return {
      action: active.getAttribute('data-action'),
      focus: active.getAttribute('data-focus'),
    };
  };
  // Back to the same control, or — where it was a chip's × and that chip is
  // gone, which is what the press did — to the next chip's ×, and then to
  // "show everything", which is the one control that is always there.
  const restore = (was) => {
    if (!was) return;
    const exact = was.focus
      ? badge.querySelector(`[data-focus="${CSS.escape(was.focus)}"]`)
      : badge.querySelector(`[data-action="${CSS.escape(was.action ?? '')}"]`);
    const next = exact
      ?? (was.action === 'unfocus' ? badge.querySelector('.lens-drop') : null)
      ?? badge.querySelector('[data-action="clear-focus"]');
    next?.focus?.({ preventScroll: true });
  };

  function render(s) {
    const foci = lensLabels(atlas, s);
    // Whether this is the same list drawn again: the chips and the one switch
    // that has a state of its own.
    const key = JSON.stringify([foci.map((lens) => [lens.kind, lens.focus, lens.name ?? null]), Boolean(s.focusAll)]);
    if (key === drawn) return;
    drawn = key;
    const was = focusedHere();
    // A focus whose record has resolved but whose century has not landed has no
    // name yet, and the chip says so: the core's fallback is the record's id,
    // and a slug in a chip would be read as what the thing is called
    // (lens.js, index2 review finding 21). The header is drawn again when the
    // shard arrives (main.js).
    badge.hidden = foci.length === 0;
    badge.innerHTML = foci.length === 0 ? '' : `
      ${foci.map((lens) => {
        const name = lens.name ?? 'loading…';
        return `<span class="lens-badge">
        <span class="lens-kind">${esc(LENS_KIND[lens.kind] ?? lens.kind)}</span>
        <span class="lens-name">${esc(name)}</span>
        <button type="button" class="lens-drop" data-action="unfocus" data-focus="${esc(lens.focus)}"
          aria-label="${esc(`Remove ${name}`)}" title="${esc(`Remove ${name}`)}">×</button>
      </span>`;
      }).join('')}
      ${foci.length > 1 ? `<button type="button" class="link small lens-all" data-action="focus-all"
        aria-pressed="${s.focusAll ? 'true' : 'false'}"
        title="Events that every focus keeps, rather than events any of them keeps">all of these</button>` : ''}
      <button type="button" class="link small" data-action="clear-focus">${esc(BACK_LABEL)}</button>`;
    restore(was);
  }

  // The chips' own buttons. "Show everything" writes `none` rather than
  // clearing the parameter, because an absent parameter is what asks for the
  // one-focus lens on an open actor or place (lens.js): clearing it would put
  // back the lens the reader has just said no to.
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const s = state.get();
    if (el.dataset.action === 'clear-focus') state.set({ focus: FOCUS_NONE, focusAll: false });
    else if (el.dataset.action === 'focus-all') state.set({ focusAll: !s.focusAll });
    else if (el.dataset.action === 'unfocus') {
      const [kind, id] = String(el.dataset.focus).split(':');
      // From what is actually on, which may be the implicit one-focus lens:
      // dropping its chip is the reader saying no to it, and that is `none`.
      const now = lensLabels(atlas, s).map((f) => f.focus).join(',');
      state.set({ focus: withoutFocus(now, kind, id) });
    }
  });

  state.subscribe(render);
  render(state.get());
  return { render };
}

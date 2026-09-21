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
import { lensLabels, withoutFocus, FOCUS_NONE } from './lens.js';

const LENS_KIND = Object.freeze({
  actor: 'actor', place: 'place', source: 'source', event: 'event', region: 'region', narrative: 'narrative',
});

export function createLensChips(container, { atlas, state }) {
  const badge = html('span', { class: 'lens-chips', hidden: 'hidden' });
  container.append(badge);

  function render(s) {
    const foci = lensLabels(atlas, s);
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
          aria-label="${esc(`Stop focusing on ${name}`)}" title="${esc(`Stop focusing on ${name}`)}">×</button>
      </span>`;
      }).join('')}
      ${foci.length > 1 ? `<button type="button" class="link small lens-all" data-action="focus-all"
        aria-pressed="${s.focusAll ? 'true' : 'false'}"
        title="Events that every focus keeps, rather than events any of them keeps">all of these</button>` : ''}
      <button type="button" class="link small" data-action="clear-focus">show everything</button>`;
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

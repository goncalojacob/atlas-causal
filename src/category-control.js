// The category switches, from the masthead and on every view.
//
// Deviation 858, written down by M60 and not fixed by it: the switches lived in
// the layer control, which is the map's legend; `main.js` hides the legend on
// the graph, because the graph has no coastlines; the timeline, arriving as a
// view of its own, followed the graph's rule. So a category could be switched
// off on the map and stayed off in the lanes — `emphasis.js` has decided that
// for all three views since M65 — but could not be switched off *from* them.
// M65 then made the categories narrow the resting picture everywhere, and a
// reader on the lanes or the graph was looking at a filtered picture with no
// way to see or to change the filter.
//
// So the switches move out to where the window, the grouping and the count
// already are (M48, M60, M64): a masthead control, shown whatever is being
// drawn. Two things it must never become:
//
//   * **a second copy.** The legend does not keep one. Switching a category off
//     here is the same act it was in the legend, writing the same `?layers=`
//     tokens, and `tests/m68.test.mjs` asserts that structurally the way M64
//     asserted there is one band: one module writes `data-category`.
//   * **a second half of the list.** A `?layers=` list has two halves — the
//     map's own layers, which the legend owns, and the events layer's tokens,
//     which these switches own — and either control changing one must leave the
//     other exactly where the reader put it. `layersFrom` below is how: it is
//     the assembly both controls call, and each passes its own half and reads
//     the other out of the state it is about to replace.
//
// What it costs at first paint is the rows it used to cost inside the legend,
// in a different box: the same markup, built from the same manifest, in the
// same pass.

import { esc } from './util/esc.js';
import {
  categoriesChecked, categoriesShown, eventsOn, eventsTokens,
} from './categories.js';
import { GLYPH_BOX, glyphId } from './map/glyphs.js';
import { LAYERS } from './state.js';

// The whole `?layers=` list, from the two halves that write it: `on`, the
// switchable layers still on — with `events` meaning the events layer is on at
// all — and `categories`, the categories still on out of `all`, the ones in use.
//
// **In `LAYERS` order**, and not in the order of whichever boxes were read:
// that is how `formatState` recognises the state at rest and writes no
// `?layers=` at all. And `land` always goes, because it has no switch and is
// always on — since M37b a list that is missing a name is that name switched
// off (deviation 522), so leaving it out would turn the coastlines off.
//
// Every category off writes no token and takes the events layer with it:
// "no category and the events that have none" is a state `?layers=` cannot
// say, and a control that wrote a link the atlas could not read back would be
// worse than one that says plainly that everything is off (deviation 586).
export function layersFrom({ on, categories, all }) {
  const out = [];
  for (const id of LAYERS) {
    if (id !== 'events') {
      if (id === 'land' || on.has(id)) out.push(id);
      continue;
    }
    if (!on.has('events')) continue;
    // A corpus where nothing carries a category has no switches, and then the
    // bare token is the only thing the events layer can be written as.
    if (all.length === 0) { out.push('events'); continue; }
    out.push(...eventsTokens({ on: categories, all }));
  }
  return out;
}

export function createCategoryControl(group, { atlas, state }) {
  if (!group) return;
  // The categories **in use**, from the manifest, and not the twelve the
  // vocabulary allows: four of the twelve have a record today, and eight
  // switches that hide nothing are eight lies about what the atlas holds.
  // Empty draws no `<details>` at all — nothing is drawn that has no data
  // under it (glyphs-brief §4).
  const categories = categoriesShown(atlas.manifest);
  if (categories.length === 0) return;
  const all = categories.map((c) => c.id);

  // Each row carries its own symbol, which is the whole of the map's legend
  // for the categories and there is no other (plan decision 14; about.html
  // says so in words). Collapsed, so the phone drawer keeps one target and not
  // thirteen. Built rather than written into index.html because a label comes
  // from `data/categories.json`, and everything from `data/` is untrusted.
  const row = ({ id, label, count }) => `<label title="${esc(`${count} event${count === 1 ? '' : 's'}`)}">`
    + `<input type="checkbox" data-layer="${esc(`events:${id}`)}" data-category="${esc(id)}" checked>`
    + `<svg class="glyph" viewBox="0 0 ${GLYPH_BOX} ${GLYPH_BOX}" aria-hidden="true"><use href="#${esc(glyphId(id))}"></use></svg>`
    + ` ${esc(label)}</label>`;

  // The `id` on the block is what lets the group be opened by an anchor:
  // `#events-by-category` in a link makes the browser open the `<details>` that
  // contains it.
  group.innerHTML = '<details><summary>events by category</summary>'
    + `<div class="categories" id="events-by-category">${categories.map(row).join('')}</div></details>`;

  const boxes = () => [...group.querySelectorAll('input[data-category]')];

  // What the switches say, as a `?layers=` list. The map's own layers are read
  // out of the state and written back untouched — they are the legend's half,
  // and this control has no opinion about them.
  const layersFromBoxes = () => {
    const layers = state.get().layers;
    const on = new Set(layers);
    // `events` is not always in the list while the layer is on: since A11 the
    // bare token is replaced by one `events:<id>` per category still on, and
    // `eventsOn` is the one function that knows that.
    if (eventsOn(layers)) on.add('events');
    const kept = boxes().filter((b) => b.checked).map((b) => b.dataset.category);
    return layersFrom({ on, categories: kept, all });
  };

  for (const box of boxes()) {
    box.addEventListener('change', () => state.set({ layers: layersFromBoxes() }));
  }

  const render = (layers) => {
    const ticked = new Set(categoriesChecked(layers, all));
    for (const box of boxes()) box.checked = ticked.has(box.dataset.category);
  };
  render(state.get().layers);
  state.subscribe((s) => render(s.layers));
}

// Bootstrap only: load, wire views. ?fixtures=1 reads tests/fixtures/data/
// instead of data/, so the interface can be seen working before any record
// exists. Fixtures are synthetic and the page says so.

import { loadAtlas } from './data.js';
import { createState, parseState } from './state.js';
import { createMap } from './map/map.js';
import { createTimeline } from './timeline.js';
import { createPanel } from './panel.js';
import { fromAstronomical } from './util/dates.js';
import { esc } from './util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const panelEl = document.getElementById('panel');

try {
  const atlas = await loadAtlas({
    dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/',
    landFile: fixtures ? 'data/geo/land-present.json' : null,
  });

  const initial = parseState(window.location.search);
  if (initial.year === null && atlas.extent) initial.year = fromAstronomical(atlas.extent.max);
  const state = createState(initial, { window });

  document.getElementById('fixtures-badge').hidden = !fixtures;
  document.body.classList.toggle('fixtures', fixtures);

  createMap(document.getElementById('map'), { atlas, state });
  createTimeline(document.getElementById('timeline'), { atlas, state });
  createPanel(panelEl, { atlas, state, fixtures });

  for (const box of document.querySelectorAll('input[data-layer]')) {
    box.checked = state.get().layers.includes(box.dataset.layer);
    box.addEventListener('change', () => {
      const layers = [...document.querySelectorAll('input[data-layer]')].filter((b) => b.checked).map((b) => b.dataset.layer);
      state.set({ layers });
    });
  }
  state.subscribe((s) => {
    for (const box of document.querySelectorAll('input[data-layer]')) box.checked = s.layers.includes(box.dataset.layer);
  });
} catch (error) {
  panelEl.innerHTML = `<section class="intro"><h2>Could not load the atlas</h2><p><code>${esc(error.message)}</code></p>
    <p>Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p></section>`;
  throw error;
}

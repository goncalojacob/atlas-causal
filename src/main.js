// Bootstrap only: load, wire views. ?fixtures=1 reads tests/fixtures/data/
// instead of data/, so the interface can be seen working before any record
// exists. Fixtures are synthetic and the page says so.

import { loadAtlas } from './data.js';
import { createState, parseState } from './state.js';
import { createMap } from './map/map.js';
import { createGraphView } from './graph-view/graph-view.js';
import { createTimeline } from './timeline.js';
import { createPanel } from './panel.js';
import { createSearchBox } from './search-box.js';
import { esc } from './util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const panelEl = document.getElementById('panel');

try {
  const atlas = await loadAtlas({
    dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/',
    landFile: fixtures ? 'data/geo/land-present.json' : null,
  });

  // Nothing is filled in here: a window bound left null means "as far as the
  // data goes", and each view resolves it against the atlas it was given. An
  // empty URL is therefore the whole span, and stays an empty URL.
  const state = createState(parseState(window.location.search), { window });

  document.getElementById('fixtures-badge').hidden = !fixtures;
  document.body.classList.toggle('fixtures', fixtures);

  // The panel is built first because the map hands it the members of a
  // cluster of marks the reader clicks on.
  const panel = createPanel(panelEl, { atlas, state, fixtures });
  createMap(document.getElementById('map'), { atlas, state, onCluster: (cluster) => panel.showCluster(cluster) });
  createTimeline(document.getElementById('timeline'), { atlas, state, onCluster: (cluster) => panel.showCluster(cluster) });
  createSearchBox(document.getElementById('search'), { atlas, state });

  // The graph view takes the map's slot behind the toggle. It is built the
  // first time it is asked for, not at load: a reader who never leaves the
  // map never pays for the layout.
  const mapArea = document.getElementById('map');
  const graphArea = document.getElementById('graph');
  const layersGroup = document.querySelector('.bar .layers');
  let graph = null;
  const showView = (view) => {
    const graphOn = view === 'graph';
    if (graphOn && !graph) graph = createGraphView(graphArea, { atlas, state });
    mapArea.hidden = graphOn;
    graphArea.hidden = !graphOn;
    // The layer switches belong to the map: the graph has no coastlines.
    if (layersGroup) layersGroup.hidden = graphOn;
    for (const button of document.querySelectorAll('[data-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    }
  };
  for (const button of document.querySelectorAll('[data-view]')) {
    button.addEventListener('click', () => state.set({ view: button.dataset.view }));
  }
  state.subscribe((s) => showView(s.view));
  showView(state.get().view);

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

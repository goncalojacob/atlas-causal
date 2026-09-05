// Bootstrap only: load, wire views. ?fixtures=1 reads tests/fixtures/data/
// instead of data/, so the interface can be seen working before any record
// exists. Fixtures are synthetic and the page says so.

import { loadAtlas, loadSearchShard } from './data.js';
import { createState, parseState } from './state.js';
import { chainEdges, retractedSteps } from './chain.js';
import { createMap } from './map/map.js';
import { createGraphView } from './graph-view/graph-view.js';
import { createTimeline } from './timeline.js';
import { createPanel } from './panel/panel.js';
import { createSearchBox } from './search-box.js';
import { createGrouping } from './grouping.js';
import { createPanes } from './panes.js';
import { createPhone } from './phone.js';
import { createReadingMode, openingState } from './narrative-mode.js';
import { parseFocus } from './lens.js';
import { bindNarrativeKeys } from './panel/narrative.js';
import { esc } from './util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const panelEl = document.getElementById('panel');
const dataRoot = fixtures ? 'tests/fixtures/data/' : 'data/';

try {
  // The spine, not the topology: the same atlas out of the smaller of the two
  // files the index emits (ARCHITECTURE.md, "The spine, the search shard and
  // the citers"). Nothing below knows which it came from.
  const atlas = await loadAtlas({
    dataRoot,
    landFile: fixtures ? 'data/geo/land-present.json' : null,
    spine: true,
  });
  // Started here and never awaited: the search shard is not needed to draw
  // anything, and blocking the first frame on it would trade the whole of
  // what the spine just saved.
  const shard = loadSearchShard({ dataRoot, manifest: atlas.manifest });

  // Nothing is filled in here: a window bound left null means "as far as the
  // data goes", and each view resolves it against the atlas it was given. An
  // empty URL is therefore the whole span, and stays an empty URL.
  // A link that names a narrative opens with the walk already derived, so no
  // view is ever built on a state the reading mode has not seen. Everything
  // downstream is given the wrapper, not the store: it is where the step
  // becomes a selection, a chain and a window (narrative-mode.js).
  // `restore` is the same derivation applied on the browser's Back and
  // Forward: a popstate onto a narrative's URL is a step, and the selection,
  // the chain and the window have to be computed from it again.
  //
  // A link somebody was sent can name a step the project has since withdrawn,
  // and `?chain=` is checked for shape and never for status. The walk is cut
  // at that step here, once, so the URL, the breadcrumb and the three
  // pictures all describe the same argument; the panel is told, so that a
  // reader handed a shorter walk than the one they were sent is not handed it
  // silently (chain.js).
  const opened = parseState(window.location.search);
  const walk = chainEdges(atlas, opened.chain).map((edge) => edge.id);
  const cut = retractedSteps(atlas, opened.chain) > 0;
  const sameWalk = (s) => s.selected === opened.selected
    && s.chain.length === walk.length && walk.every((id, i) => s.chain[i] === id);

  const store = createState(openingState(atlas, { ...opened, chain: walk }), {
    window,
    restore: (s) => openingState(atlas, s),
  });
  const state = createReadingMode(store, atlas);

  document.getElementById('fixtures-badge').hidden = !fixtures;
  document.body.classList.toggle('fixtures', fixtures);

  // Every view measures its own box, so all three are told whenever the shape
  // of the layout changes: an edge dragged, or the panel coming and going.
  const layout = document.querySelector('.layout');
  // Declared before the panel because the panel decides, on its first card,
  // whether there is a panel at all, and that changes the width the map has.
  let map = null;
  let timeline = null;
  let graph = null;
  const remeasure = (options = {}) => {
    const s = state.get();
    map?.render(s, options);
    timeline?.render(s, options);
    graph?.render(s, options);
  };

  // A lens on a source is the one thing the three views draw that the atlas
  // does not have in hand at load: which records cite a book is one file per
  // source since H3b (lens.js). It is fetched when a focus asks for it, and
  // the views are forced to redraw when it lands — nothing in the state has
  // changed by then, so their own keys would say there is nothing to do.
  const askedFor = new Set();
  const fetchLensCiters = (s) => {
    const focus = parseFocus(s.focus);
    if (!focus || focus.kind !== 'source' || askedFor.has(focus.id)) return;
    if (atlas.citersOf(focus.id)) return;
    askedFor.add(focus.id);
    atlas.loadCiters(focus.id).then(() => remeasure({ force: true }), () => {});
  };

  // The panel is built first because the map hands it the members of a
  // cluster of marks the reader clicks on.
  //
  // With nothing open there is no panel: a column of "Pick an event" beside
  // the picture is a third of the width spent saying nothing, and the map is
  // what a reader who has opened nothing is looking at. The pane collapses,
  // the view takes its width, and opening anything brings it back — with
  // whatever width the reader had dragged it to, since that preference
  // applies only while the panel is shown (owner, 5 September).
  const panel = createPanel(panelEl, {
    atlas, state, fixtures, walkWasCut: (s) => cut && sameWalk(s),
    onCard: (shown) => {
      if (layout.classList.contains('panel-empty') === !shown) return;
      layout.classList.toggle('panel-empty', !shown);
      remeasure();
    },
  });

  // Under 720px the panel is a sheet over the view rather than a column
  // beside it. It raises itself when what is open changes, which covers every
  // way into a record; a cluster's list is shown by the panel directly and
  // never reaches the store, so it says so here.
  const phone = createPhone({
    state,
    sheet: document.getElementById('sheet'),
    grip: document.getElementById('sheet-grip'),
    tools: document.getElementById('masthead-tools'),
    options: document.getElementById('options-button'),
  });
  const showCluster = (cluster) => { panel.showCluster(cluster); phone.open(); };

  map = createMap(document.getElementById('map'), { atlas, state, onCluster: showCluster });
  timeline = createTimeline(document.getElementById('timeline'), { atlas, state, onCluster: showCluster });
  createSearchBox(document.getElementById('search'), { atlas, state, fixtures, shard });
  createGrouping(document.getElementById('grouping'), { atlas, state });
  bindNarrativeKeys(document, { atlas, state });

  // The graph view takes the map's slot behind the toggle. It is built the
  // first time it is asked for, not at load: a reader who never leaves the
  // map never pays for the layout.
  const mapArea = document.getElementById('map');
  const graphArea = document.getElementById('graph');
  const layersGroup = document.querySelector('.bar .layers');
  const showView = (view) => {
    const graphOn = view === 'graph';
    if (graphOn && !graph) {
      graph = createGraphView(graphArea, { atlas, state, onCluster: showCluster });
    }
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

  // The edges between the panes. The sizes are a preference and not state:
  // they are remembered per reader in localStorage and never in the URL. The
  // views are told to redraw, because each of them measures its own box.
  createPanes(layout, {
    panelHandle: document.getElementById('split-panel'),
    timelineHandle: document.getElementById('split-timeline'),
    onResize: remeasure,
  });

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

  state.subscribe(fetchLensCiters);
  fetchLensCiters(state.get());
} catch (error) {
  panelEl.innerHTML = `<section class="intro"><h2>Could not load the atlas</h2><p><code>${esc(error.message)}</code></p>
    <p>Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p></section>`;
  throw error;
}

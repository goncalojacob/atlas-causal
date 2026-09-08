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
import { createIntro } from './intro.js';
import { createReadingMode, openingState } from './narrative-mode.js';
import { parseFocus, lensSet } from './lens.js';
import { resolveWindow } from './util/window.js';
import { bindNarrativeKeys } from './panel/narrative.js';
import { esc } from './util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const panelEl = document.getElementById('panel');
const dataRoot = fixtures ? 'tests/fixtures/data/' : 'data/';

try {
  // The core, whole: the graph and what a mark, a bar and a lane need, which is
  // the file every page loads because convergence cannot be answered from a
  // window (docs/index2-plan.md, D4). What a card, a label or a strip reads —
  // the titles, the roles, the notes, the counts — is in the attribute shards,
  // one per century, asked for below and never waited for. Nothing else in this
  // file knows the shape any of it arrived in.
  const atlas = await loadAtlas({
    dataRoot,
    landFile: fixtures ? 'data/geo/land-present.json' : null,
    from: 'core',
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
  // First contact: the narratives, what most of the atlas hangs on, and what
  // "follow the consequences" actually means here. Shown on a first visit
  // with nothing open, and brought back by the "?" in the masthead
  // (intro.js; health review A, finding 17).
  createIntro(document.getElementById('intro'), {
    atlas, state, toggle: document.getElementById('intro-button'),
  });
  const grouping = createGrouping(document.getElementById('grouping'), { atlas, state });
  bindNarrativeKeys(document, { atlas, state });

  // The graph view takes the map's slot behind the toggle. It is built the
  // first time it is asked for, not at load: a reader who never leaves the
  // map never pays for the layout.
  const mapArea = document.getElementById('map');
  const graphArea = document.getElementById('graph');
  const layersGroup = document.querySelector('.bar .layers');
  // The layer switches, built here rather than written into index.html. Two
  // of the three `LAYERS` are switches: the coastlines are always drawn now
  // (plan decision 14) and `land` has no row, though it is still a member so
  // that an old `?layers=` link parses into the same three. The twelve
  // category switches under "events" arrive with the glyphs (M32b brief, A2),
  // out of `atlas.manifest.categoriesAllowed`, inside a collapsed `<details>`
  // so the phone drawer keeps one hit target instead of fifteen — which is
  // why the control is generated at all: a category's label is written in
  // `data/categories.json`, and everything from `data/` is untrusted input.
  const LAYER_ROWS = [
    { id: 'territories', label: 'territories' },
    { id: 'events', label: 'events' },
  ];
  layersGroup.innerHTML = LAYER_ROWS
    .map(({ id, label }) => `<label><input type="checkbox" data-layer="${esc(id)}" checked> ${esc(label)}</label>`)
    .join('');
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

  // --- the attribute shards ------------------------------------------------
  //
  // The picture is drawn out of the core, and the names on it arrive a century
  // at a time. Nothing here waits: a bar and a mark are drawn unlabelled and
  // labelled when their shard lands (attributes.js), which is the discipline
  // `loadGeometry`, `loadCiters` and `loadExplanations` already follow. What
  // makes the redraw happen is the shard count in each view's key
  // (render-key.js), so this asks and then tells the views to look again.
  // The three pictures, the card, and the header's chips: a lens chip names a
  // record too, and it is drawn in the masthead rather than by the panel.
  const shardLanded = () => { remeasure(); panel.refresh(); grouping.render(state.get()); };
  const askFor = (shards) => {
    for (const shard of shards) atlas.loadAttributes(shard).then(shardLanded, () => {});
  };

  // The window's shards, and the lens's: both are on screen, so both are held
  // outside the LRU cap while they are (data.js, ATTRIBUTE_SHARD_CAP). The new
  // pin is taken before the old is released, so a shard the reader is still
  // looking at is never dropped and fetched again as the band moves.
  //
  // The cap is what keeps a session that has scrubbed across six centuries from
  // holding six centuries; what the reader is looking at now is not that. At
  // the whole extent this is every shard, which is what "a reader at the whole
  // extent gets the picture and then the titles" means (i4-brief §1).
  let releaseWindow = null;
  const onScreenShards = (s) => {
    const wanted = [...atlas.attributeShardsIn(resolveWindow(s, atlas.extent))];
    const lens = lensSet(atlas, s);
    if (lens) {
      for (const shard of atlas.attributeShardsOf(lens)) {
        if (!wanted.some((w) => w.key === shard.key)) wanted.push(shard);
      }
    }
    return wanted;
  };
  const holdWindow = (s) => {
    const wanted = onScreenShards(s);
    const release = atlas.pinAttributes(wanted);
    releaseWindow?.();
    releaseWindow = release;
    askFor(wanted);
  };
  state.subscribe(holdWindow);
  holdWindow(state.get());

  // And then the rest, in year order, once the picture is on screen — unpinned,
  // so a reader who never leaves 1974 does not end up holding the corpus. A
  // frame and then a turn of the loop: `requestAnimationFrame` runs before the
  // paint it belongs to, and the timeout after it.
  requestAnimationFrame(() => setTimeout(() => askFor(atlas.attributeShards), 0));
} catch (error) {
  panelEl.innerHTML = `<section class="intro"><h2>Could not load the atlas</h2><p><code>${esc(error.message)}</code></p>
    <p>Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p></section>`;
  throw error;
}

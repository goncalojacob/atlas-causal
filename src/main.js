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
import { createLensChips } from './lens-chips.js';
import { createPanes } from './panes.js';
import { createPhone } from './phone.js';
import { createIntro } from './intro.js';
import { createReadingMode, openingState } from './narrative-mode.js';
import { activeFoci, parseFocus, lensSet } from './lens.js';
import { workingSet } from './emphasis.js';
import { resolveWindow } from './util/window.js';
import { bindNarrativeKeys } from './panel/narrative.js';
import { esc } from './util/esc.js';
import { createLayerControl } from './layer-control.js';
import { createCategoryControl } from './category-control.js';
import { createGraphFilters } from './graph-filters.js';
import { createWindowControl } from './window-control.js';
import { createMapBand } from './map-band.js';

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
  });
  // **Asked for when the box is focused, and not before** (M83, A13). It is
  // never awaited and never drawn out of, so starting it here cost the first
  // frame nothing in *time* — but it is 762 KB on the wire against a core of
  // 192 KB, the largest single thing the page fetches, and it is fetched on
  // every visit for a reader who may never type. A reader who does type has
  // focused the box first, and the shard is a fold of the whole atlas that
  // arrives in well under the time it takes to type a word; until it lands the
  // box answers out of the atlas, exactly as it does when the file fails
  // (search-box.js). The promise is made once and kept, so a second focus is
  // not a second fetch.
  let searching = null;
  const shard = () => {
    searching ??= loadSearchShard({ dataRoot, manifest: atlas.manifest });
    return searching;
  };

  // Nothing is filled in here: a window bound left null means "as far as the
  // data goes", and each view resolves it against the atlas it was given. An
  // empty URL is therefore the whole span, and stays an empty URL.
  //
  // M43b: *which* span an empty URL is, is the atlas's answer and no longer
  // always the whole extent. Over 1890–2025 the whole extent is one picture;
  // over 1415–2025 it is six centuries at once, every bar a few pixels wide
  // and nothing in particular to read. So a corpus that is long and lopsided
  // carries an opening window — the century that holds most of it — and
  // `resolveWindow` hands it back for the two null bounds (util/window.js,
  // `opensOn`). Nothing about the URL changes: the empty one stays empty, and
  // it still means "as far as the data goes", which is now a question the data
  // answers rather than one the extent answers alone.
  //
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
  // And the two controls in the masthead and over the map that read the same
  // answer the pictures do (M83, B2). `createWindowControl` and `createMapBand`
  // have always returned a `render`; this file dropped both on the floor and
  // left them subscribed to the store alone. But `lensView` answers again after
  // the state has stopped moving — when an actor's grounds land, when a
  // source's citers do, when a narrative's steps arrive with their century —
  // and `main.js` knows this and forces the views for exactly that reason. The
  // band's profile is `shown ∩ the lens's own half` and the masthead's count is
  // `workingSet`, so both go stale in the same places, and neither is a picture
  // a reader can refresh by dragging something they cannot see is wrong.
  let windowControl = null;
  let mapBand = null;
  const remeasure = (options = {}) => {
    const s = state.get();
    map?.render(s, options);
    timeline?.render(s, options);
    graph?.render(s, options);
    windowControl?.render(s, options);
    mapBand?.render(s, options);
  };

  // A lens on a source is the one thing the three views draw that the atlas
  // does not have in hand at load: which records cite a book is one file per
  // source since H3b (lens.js). It is fetched when a focus asks for it, and
  // the views are forced to redraw when it lands — nothing in the state has
  // changed by then, so their own keys would say there is nothing to do.
  //
  // **And a request that failed is asked again** (M83, B15). The id went into
  // `askedFor` before the fetch and came out of it never: one dropped request
  // on a slow connection left a source's lens empty — *draws nothing and says
  // so* — for the rest of the session, although `data.js` drops a failed
  // promise precisely so that the next ask is a new attempt.
  const askedFor = new Set();
  const fetchLensCiters = (s) => {
    const focus = parseFocus(s.focus);
    if (!focus || focus.kind !== 'source' || askedFor.has(focus.id)) return;
    if (atlas.citersOf(focus.id)) return;
    askedFor.add(focus.id);
    atlas.loadCiters(focus.id).then(
      () => remeasure({ force: true }),
      () => { askedFor.delete(focus.id); },
    );
  };

  // And a lens on an actor is the other one: since M48 it keeps the events on
  // that actor's ground as well as the events that name it, which is one file
  // the build worked out against the presence outlines (grounds.js). Asked for
  // when a focus of that kind is actually on — an atlas nobody has selected a
  // polity in never fetches it, and first paint costs what it did — and the
  // views are forced to redraw when it lands, because nothing in the state has
  // changed by then.
  //
  // Since M54 it is two files and one ask: the dated join above, and the
  // territorial one beside it — every event inside the union of that actor's
  // outlines, at any date, which is what a reader who clicks a territory is
  // asking (M54 §2). Neither is at first paint and neither is waited for.
  //
  // **An open actor asks even when its lens is empty**, which is the hole M54
  // found in M48's own rule: `activeFoci` hides a lens that keeps nothing, and
  // an actor whose events are *all* on its ground and none of them named — a
  // CShapes polity, which is 350 of the 412 — keeps nothing until the file
  // lands. Waiting for a lens that the file is what creates is waiting for
  // ever. A page with no actor open still asks for nothing.
  //
  // **And the flag is put back where either file failed** (M83, B15). It was
  // set before `allSettled`, which cannot reject, so a dropped request left a
  // polity's lens at its `actors` list alone for the rest of the session. The
  // next state change asks again, which is the one thing the reader can do
  // about it without knowing anything is wrong.
  let askedGrounds = false;
  const opensAnActor = (s) => Boolean(s.actor) && atlas.resolve(s.actor)?.kind === 'actor';
  const fetchLensGrounds = (s) => {
    if (askedGrounds || (atlas.groundsLoaded() && atlas.territoriesLoaded())) return;
    if (!activeFoci(atlas, s).some((f) => f.kind === 'actor') && !opensAnActor(s)) return;
    askedGrounds = true;
    // Both, and **one arrival**: two redraws would rebuild the card twice, and
    // a reader whose second rebuild landed between their pointer going down
    // and coming up would lose what they had open. `allSettled`, so that a
    // file that failed still lets the other one be drawn.
    //
    // The card and the chips as well as the pictures, which is the whole of
    // what `shardLanded` does below and for the same reason: nothing in the
    // state has changed, so every key downstream says there is nothing to do.
    // The card in particular carries the lens it was drawn under (panel.js,
    // `keyOf`), and one written while an actor's lens was still empty would be
    // rebuilt by the reader's next nudge of the band.
    Promise.allSettled([atlas.loadGrounds(), atlas.loadTerritories()]).then((settled) => {
      if (settled.some((one) => one.status === 'rejected')) askedGrounds = false;
      remeasure({ force: true });
      panel.refresh({ force: true });
      lensChips.render(state.get());
    });
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
  createSearchBox(document.getElementById('search'), { atlas, state, fixtures, shard });
  // First contact: the narratives, what most of the atlas hangs on, and what
  // "follow the consequences" actually means here. Shown on a first visit
  // with nothing open, and brought back by the "?" in the masthead
  // (intro.js; health review A, finding 17).
  const intro = createIntro(document.getElementById('intro'), {
    atlas, state, toggle: document.getElementById('intro-button'),
  });
  const lensChips = createLensChips(document.getElementById('lens-chips'), { atlas, state });
  bindNarrativeKeys(document, { atlas, state });

  // The graph and the timeline take the map's slot behind the toggle. Each is
  // built the first time it is asked for, not at load: a reader who never
  // leaves the map never pays for the layout, and since M60 never pays for the
  // lanes either — the timeline used to be drawn on every load whether it was
  // being read or not, because it was a strip along the bottom of the map.
  const mapArea = document.getElementById('map');
  const graphArea = document.getElementById('graph');
  const timelineArea = document.getElementById('timeline');
  const layersGroup = document.querySelector('.bar .layers');
  const graphFiltersGroup = document.querySelector('.bar .graph-filters');
  // The layer switches, which are the map's legend and the map's alone; built
  // rather than written into index.html because a layer's id comes from the
  // manifest and everything from `data/` is untrusted input (layer-control.js).
  createLayerControl(layersGroup, { atlas, state });
  // And the category switches, which are nobody's one picture: they narrow the
  // lanes and the graph exactly as they narrow the map (emphasis.js, M65), so
  // since M68 they stand in the masthead beside the window and are never
  // hidden. One module owns them and the legend keeps no copy
  // (category-control.js).
  createCategoryControl(document.getElementById('categories'), { atlas, state });
  // And the graph's own two, which are the other half of the same idea: what
  // is drawn at all. They swap with the layer switches below.
  createGraphFilters(graphFiltersGroup, { state });
  // The window of time, on every view: its two ends to read and to type, the
  // density of the corpus beside them, and the count of what the map is
  // looking at. It stands where the band stood before M60 made the timeline a
  // view — the band is still there, on the timeline, and the two write the
  // same two fields of the state.
  windowControl = createWindowControl(document.getElementById('window-control'), { atlas, state });
  // And the same window as a band over the map — on it, from first paint, on
  // every visit since M75: the owner, 21 September, *"The dates two-handled
  // band should not be hidden."* The two write the same `from` and `to`: typing
  // is for when the reader knows the year, the band for when they do not and
  // want to sweep for it with the map answering as they go. There is nothing to
  // press and nothing remembered, so this line costs its drawing here rather
  // than on a click that may never come (map-band.js).
  mapBand = createMapBand(mapArea, { atlas, state });

  // The composer (M71), which is the one control on this page whose module is
  // not loaded with the page. Everything else in this file is a few kilobytes
  // beside the index; the composer brings the schema validator, the rules and
  // the contribution form's record builder with it, which is the whole of what
  // "first paint must not get slower" is about here. A reader who never writes
  // a narrative pays for the `<button>` in the masthead and nothing else.
  const composeButton = document.getElementById('compose-button');
  let composer = null;
  // The import is started once and held: a second press while the module is
  // still on the wire would otherwise build a second composer over the first,
  // both subscribed to the state and only one of them on the page.
  let composerLoading = null;
  composeButton?.addEventListener('click', () => {
    if (composer) { composer.toggle(); return; }
    composerLoading ??= import('./compose/composer.js').then(({ createComposer }) => {
      composer = createComposer(layout, {
        atlas, state, toggle: composeButton, onLayout: () => remeasure({ force: true }),
      });
      composer.open();
    });
  });

  // Which of the three panes was hidden the last time the view changed, so that
  // one coming back can be told to draw again (B1, below).
  const wasHidden = { map: false, graph: true, timeline: true };
  const showView = (view) => {
    const graphOn = view === 'graph';
    const timelineOn = view === 'timeline';
    // Hidden first and built after, so whichever picture is being made for the
    // first time measures the pane it is about to be drawn in rather than a
    // pane that is still `hidden` and therefore measures nothing.
    mapArea.hidden = graphOn || timelineOn;
    graphArea.hidden = !graphOn;
    timelineArea.hidden = !timelineOn;
    if (graphOn && !graph) {
      graph = createGraphView(graphArea, { atlas, state, onCluster: showCluster });
    }
    if (timelineOn && !timeline) {
      timeline = createTimeline(timelineArea, { atlas, state });
    }
    // The layer switches belong to the map: the graph has no coastlines and
    // the timeline no territories. And the degree floor belongs to the graph,
    // for the same reason the other way round — the map draws every event
    // whatever the graph is organising.
    if (layersGroup) layersGroup.hidden = graphOn || timelineOn;
    if (graphFiltersGroup) graphFiltersGroup.hidden = !graphOn;
    for (const button of document.querySelectorAll('[data-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    }
    // **And whatever has just come back is drawn for the pane it came back to**
    // (M83, B1). The three views subscribe to the store inside their own
    // constructors, which is before this subscription; so on `view: 'map'` the
    // map renders while `mapArea` is still hidden, `getScreenCTM()` is null,
    // `visibleBox()` answers the nominal 960 × 540, and the render key is
    // stamped with a rectangle nobody is looking at — marks in the letterbox
    // margins culled and the labels placed for the wrong box. The map's own
    // observer then found the size unchanged (it never forgot the size it had
    // before it was hidden) and returned. Forcing the picture that has just been
    // unhidden is the half of the fix that does not depend on an observer
    // firing at all; the other half is in `map.js`, which now forgets the size
    // when it measures nothing.
    if (!mapArea.hidden && wasHidden.map) map?.render(state.get(), { force: true });
    if (!graphArea.hidden && wasHidden.graph) graph?.render(state.get(), { force: true });
    if (!timelineArea.hidden && wasHidden.timeline) timeline?.render(state.get(), { force: true });
    wasHidden.map = mapArea.hidden;
    wasHidden.graph = graphArea.hidden;
    wasHidden.timeline = timelineArea.hidden;
  };
  for (const button of document.querySelectorAll('[data-view]')) {
    button.addEventListener('click', () => state.set({ view: button.dataset.view }));
  }
  state.subscribe((s) => showView(s.view));
  showView(state.get().view);

  // The edge between the view and the panel. The size is a preference and not
  // state: it is remembered per reader in localStorage and never in the URL.
  // The views are told to redraw, because each of them measures its own box.
  createPanes(layout, {
    panelHandle: document.getElementById('split-panel'),
    onResize: remeasure,
  });

  state.subscribe(fetchLensCiters);
  fetchLensCiters(state.get());
  state.subscribe(fetchLensGrounds);
  fetchLensGrounds(state.get());

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
  const shardLanded = () => {
    remeasure(); panel.refresh(); lensChips.render(state.get());
    // And the card over the view on a first visit, which quotes the titles of
    // the narratives and the events it offers: until the century carrying one
    // has landed there is no title, and a slug where a name goes on the front
    // page is what M82 is about (intro.js, A3).
    intro.refresh();
    // And the composer's step list, where a step is named by the record's
    // title once its century is in and by its id until then (attributes.js).
    composer?.refresh();
  };
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
    const wanted = [...atlas.attributeShardsIn(resolveWindow(s, atlas.extent, atlas.opens))];
    // **The graph is not windowed since M76**, and the pinning was still the
    // band's. The owner asked for a picture that always shows all dates, so the
    // graph draws every century while `attributeShardsIn` pinned the two or
    // three the band covers; the rest are fetched unpinned, the cap of four
    // evicts the oldest of them, and every record carried only by an evicted
    // shard is stripped of its title (data.js, `evictIfOver`). The graph then
    // holds marks it has drawn and can never name — measured on
    // `?view=graph&from=1900&to=1999` as three of eighty-seven, the same three
    // every round, still reading "still loading" ten seconds later (M78,
    // docs/m78-flakes.md). What a view draws is what is on screen, so the
    // shards of what the graph draws are pinned while it is the view.
    if (s.view === 'graph') {
      for (const shard of atlas.attributeShardsOf(workingSet(atlas, s).shown)) {
        if (!wanted.some((w) => w.key === shard.key)) wanted.push(shard);
      }
    }
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

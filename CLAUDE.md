# Atlas causal

Map and timeline of Portuguese expansion, 1415 to 1580. You pick an event,
follow its consequences, and see which other branches fed into the same
endpoint. First slice of a larger project about human history.

See `CONTEXT.md` for the reasoning behind the constraints below,
`ARCHITECTURE.md` for the target structure, and `STATUS.md` for where the
project stands right now. Read `STATUS.md` first in every new session and
update it whenever a decision is taken or a milestone moves. It is the
position and nothing else since H8; the run-by-run account behind it, and
deviations 1 to 297, are in `docs/history/status-2026-09-05.md`.

Everything is in English: interface, data, code, comments, commit messages.
(Decided 2026-09-01; Portuguese returns later as an i18n overlay.) Talk to me
in whichever language I use.

## Hard constraints

These are not preferences. Ask before breaking any of them.

- **No runtime dependencies.** No npm packages shipped to the browser, no CDN
  script tags. Plain ES modules loaded natively.
- **No build step.** `python3 -m http.server 8000` and it runs. If you think we
  need Vite, say why and wait.
- **No map tiles and no map library.** Coastlines are a local GeoJSON drawn as
  SVG with our own projection in `src/map.js`. No MapLibre, no Leaflet, no API
  keys, no tile servers. This keeps hosting free and keeps modern borders off a
  historical map.
- **No database.** Data is JSON files in the repo, validated on every commit.
- **No AI-generated historical claims.** Every edge explanation is written by a
  person. This one is not negotiable.
  One exception, decided by the owner on 2026-09-02: the 20th–21st century
  Portugal records under `data/` are a **test dataset drafted by the
  assistant**. Each carries `origin: { "tool": "assistant" }`, which says who
  wrote it, and `review: { "status": "draft" }`, which says nobody has read
  it; the name in `authors` is attribution and decides nothing (H5b). They
  exist to exercise the model and the interface, must be reviewed or rewritten
  by a person before the site goes public, and are not a precedent for any
  other period.
  Extended by the owner on 2026-09-03 to the same period's places, relations
  between actors and one example narrative drafted on 3–4 September 2026, all
  carrying the same draft marker and queued for the review dashboard.
  Extended by the owner on 2026-09-05, twice more, under the same marker
  and the same review obligation: (a) to **events elsewhere in the world,
  1890–2025, that a Portuguese record connects to** — the wars, crises,
  treaties and movements the Portuguese events answer to — drafted with
  their actors and edges as the Portuguese ones were (M40); and (b) to
  **imported world events at scale** (M42), which carry
  `origin: { "tool": "wikidata" }`, `review.flags: ["imported-facts"]` and a
  summary quoting the source's description, exist to stress the platform, and
  are not this atlas's account of anything until a person signs them.
  `review.html` is where the exception is retired, one record at a time: it
  lists everything whose `review.status` is `draft` — whoever wrote it, so a
  contribution or a later import that arrives unread is in the same queue —
  and signing puts the reviewer in `authors` and in `review.signedBy` and the
  status at `reviewed`. `node tools/validate.mjs` prints what is left.
  **An import never rewrites a record whose `review.status` is `reviewed`**:
  it reports and leaves the file alone.

## Commands

```bash
node tools/validate.mjs            # schemas, cross-record rules, region derivation
node tools/validate.mjs --index    # also: data/index/ and the prerendered pages are byte-identical to a fresh build (main only)
node tools/build-index.mjs         # regenerate data/index/ and the prerendered pages after touching data/
node tools/build-palette.mjs       # regenerate data/geo/palette.json after touching the territories; before build-index, which names it
CHROME=... node tools/screens.mjs  # the screenshots under docs/screens/, through a headless browser's own command line
node tools/build-regions.mjs       # regenerate data/geo/regions.json from Natural Earth 110m, and --seam-report; rarely
node tools/import/naturalearth.mjs --source vendor/natural-earth/10m --budget   # the base map: data/geo/land-present.json and data/geo/base/; offline, rarely
node tools/import/cshapes.mjs --source cshapes_2_gw.topojson [--report]  # territories, 1886-2019; rarely
node tools/import/basemaps.mjs --source vendor/historical-basemaps --check  # territories, 1400-1885, from the snapshots; rarely
node tools/import/cshapes.mjs --relations   # the successions the split table states; no topology needed, and it runs here
node tools/import/wikidata.mjs --reconcile|--import|--candidates   # NOT here: no network in this sandbox — it runs in the Action, on an import/** branch
node tools/new-record.mjs event|edge|source|actor|place|relation|narrative …   # scaffold a record; the text is yours to write
node tools/migrate/apply.mjs       # the migration chain of src/validate/migrate.js applied to data/; in the same commit as any migration that changes bytes
node tools/seed-review-flags.mjs   # STATUS.md's "Dates to verify" onto the records as review flags; once
node --test                        # every test under tests/ (Node 22 takes no directory argument)
node --test $(node tools/suites.mjs --pure) && node --test --test-concurrency=1 $(node tools/suites.mjs --browser)   # the same tests the way the check runs them since M63: the suites that start a browser one at a time (docs/m63-load.md)
python3 -m http.server 8000        # then http://localhost:8000/ — add ?fixtures=1 for the synthetic graph
node tools/serve.mjs               # the same, plus the one write endpoint review.html saves through; loopback only, never deployed
```

Run the validator after any change to `data/`. It must pass before you say a
task is done.

## Layout

The full target tree, with what is reserved and why, is in `ARCHITECTURE.md`.
What exists:

```
data/events/<id>.json      one file per event; data/edges/, data/sources/, data/actors/, data/places/ likewise
data/places/<id>.json      somewhere events happen; an event points at one and takes its point and lane from it
data/relations/<id>.json   a dated, typed link between two actors; id from--to--type, like an edge
data/offices/<id>.json     a post held one person after another, belonging to an actor; asserts that the post exists and nothing more
data/tenures/<id>.json     one person's turn at one office, with its own years and sources; a free slug, since one person may hold one office three times
data/narratives/<id>.json  a signed walk through records already here; ordered steps of { ref, text }
data/presences/<id>.json   who held which ground and when; imported, CC BY-NC-SA 4.0 from CShapes (1886 on) or GPL-3.0 from Historical Basemaps (1400-1885)
data/imports/<source>.json which actor a source's entity becomes, and where one code is two actors. Keyed by the source's own code, or by its own name where — as in Historical Basemaps — it numbers nothing and the file says `"keys": "name"`
data/imports/wikidata-seeds.json  the items, queries and class table the Wikidata import is pointed at; contributor-editable
data/imports/wikidata-state.json  where a cut-off import stopped, one cursor per mode; written by the tool
data/imports/naturalearth-places.json  which Natural Earth city a place record is, keyed by NE_ID; written by tools/import/naturalearth.mjs --places, which matches on wikidata and then on an exact fold of the name where one candidate survives and is near the record's own point, and lists everything it refused in docs/naturalearth-places.md for a person. An entry added there by hand is kept. Not in the deploy artifact, so the import copies `place` onto the city itself
data/regions.json          timeline lanes: id, label, order
data/roles.json            the 31 roles an actor line may take; a closed vocabulary in data, enforced on an active event by rule 25
data/categories.json       the twelve kinds of event; a closed vocabulary in data, offered by the form and the review editor, and drawn as one symbol per category over the mark and at the left of the bar since the glyph run (src/map/glyphs.js). `category` is a core column, so a toggle narrows on the frame it is clicked
data/geo/land-present.json the coastline at the far level: Natural Earth 10m since M36a, public domain, generated by tools/import/naturalearth.mjs; the only base-map bytes at first paint
data/geo/base/<layer>/<cell>.json  the base map at the near level, generated by tools/import/naturalearth.mjs: one file per non-empty cell of the fixed 60x45 degree grid, keys x0y0..x5y3, fetched when the viewport enters the cell. `coast` is lines, so no cut ring is ever stroked as a ring
data/geo/regions.json      one polygon per lane, still 110m, generated by tools/build-regions.mjs
data/geo/presences/        outlines sharded by period, generated by tools/import/cshapes.mjs; each shard also carries `arcs`, its own list of the inland borders between those territories, held once and named by index from the features on either side — the map fills the outline and strokes only these, so the coast on the picture is Natural Earth's and never CShapes'
data/geo/palette.json      which of the eight hues each actor's territory is drawn in, generated by tools/build-palette.mjs
data/index/manifest.json   GENERATED, never cached: the index's generation, counts, the hashed names below, lanes and one box per lane, roles in use, the categories in use with a count each, the two vocabularies, officesByEvent and tenuresByOffice, land epochs, presence shards, attribute shards, history shards
data/index/presences-<hash>.json  GENERATED: who held which ground and when, without the outlines; the same rows over an id table of its own, because it is fetched on its own. Fetched by the territory layer and not at first paint; absent where a dataset has no presences
data/index/core-<hash>.json       GENERATED: the graph, loaded whole by every page but sources.html — every record as a positional row over the file's own id table, with the closed vocabularies as integers and the columns named in the file: ids, statuses, an event's year bounds, place, lane, weight and its actors' ids, an edge's five slots, an actor's type and years, a place's point, the ids each relation, office and tenure joins, and the merges list
data/index/attributes-<key>-<hash>.json  GENERATED: the other half — title, when verbatim, revised, citesCount, identity, scope, category, roles and notes, names, a place's label and precision. One file per century, plus `place` and `null`; fetched for the window and never waited for, so a bar and a mark are drawn unlabelled and labelled when their century lands. The two writer pages hold every one of them, because their rules read the whole atlas
data/index/grounds-<hash>.json     GENERATED: which polities each event happened inside, as integers into an id table of its own; fetched when a lens on an actor asks and never at first paint, absent where no event is inside any territory
data/index/search-<hash>.json     GENERATED: what the search box scans, folded at build time; fetched beside the core and never waited for
data/index/citers-<hash>/<source-id>.json  GENERATED: the records that cite that one source; fetched when a reader opens it
data/index/sources-<hash>.json    GENERATED: every source's bibliographic fields and citationCount, and no citer rows
data/index/review-<hash>.json     GENERATED: the draft queue and the validator's warnings, for review.html
data/index/history-<kind>-<key>-<hash>.json  GENERATED: what changed at each version of each record, out of the repository's own commits, keyed by record id inside. One file per kind and century, filed by the same key the attribute shards use; fetched by review.html when a reviewer opens a record, and one file serves every record of its kind and century (I5)
data/index/               all of it committed on main by deploy.yml; byte-identical to a fresh build
data/LICENSE  data/geo/LICENSE   CC BY-SA 4.0 for records; per source for geometry
schema/common/             interval, place, provenance (the envelope), confidence
schema/v1/                 event, edge, source, actor, place, relation, narrative, presence, region, bundle; import-map, import-places, import-seeds, import-state and wikipedia-lead are tool-side
index.html                 the atlas; no build step, plain ES modules
contribute.html            the contribution form; not linked from the atlas while contributions are closed
about.html                 what it is, how to read confidence and a dispute, the licences
sources.html               the bibliography, written into the file by the build from the sources index
narratives.html            every narrative as a card, grouped by the centuries it crosses; written into the file by the build
review.html                the review queue; a maintainer's page, unlinked, and the only one that can write
README.md  CONTRIBUTING.md for people reading the repository
src/main.js                bootstrap only: load, wire views; ?fixtures=1 reads tests/fixtures/data/
src/layer-control.js       the map's whole legend and there is no other: `territories` and `events` as rows, then the collapsed "base map" group, one toggle and one swatch per switchable layer of `manifest.base.layers`. Three targets in the phone drawer and not nineteen. Built rather than written into index.html because every id comes from `data/`. It writes only its own half of `?layers=` — the events half is the category switches' and is carried over untouched, through the one assembly both controls call (`layersFrom`)
src/category-control.js    the category switches, in the masthead and on every view since M68: one collapsed `<details>` with one toggle and one glyph per category in use. **One module owns the switches** — the legend keeps no second copy, because the categories narrow the lanes and the graph exactly as they narrow the map (deviation 858). `layersFrom` is where the whole `?layers=` list is assembled, in `LAYERS` order, from the two halves that write it, so the two controls cannot disagree about one state
src/categories.js          pure: what a `?layers=` list says about categories — whether the events layer is on at all, which categories are still on, which switches it ticks, and the tokens a toggle writes — and the labels and counts the manifest carries. The removal itself is one line in emphasis.js, where the lens is
src/origin.js              who wrote a record and how far it has been read: a leaf module with the two closed vocabularies — the writers `origin.tool` may name, the two `review.status` values — and the predicates the licence hole, the review queue and the two imports read instead of matching an author's name against a string
src/licensing.js           which licence covers which directory, whom each asks to be named, and the one line an NC-derived card and entry page owe it. The manifest's `licenses` block and the table at the head of `data/LICENSE` are the same thing said twice more, and a test holds the three together
src/kinds.js               the record kinds: a leaf module, one entry per kind — directory, schema file, licences, identity and body, its citation, actor and step lists, its form fields' names, its URL parameter and its labels. Everything that used to list the kinds imports it
src/vocab.js               the closed vocabularies: a leaf module with the edge types, the relation types, the groupings and the lens kinds, and the id patterns built from them. `state.js` imports it rather than copying it
src/references.js          where an id may stand in a record: the table beside the registry of every reference field, of `review.citations`'s keys, of the two references inside a full entry and of the files under `data/imports/`, and the structural rewrite over it. A tenth kind is a row here rather than a branch in `tools/migrate/ids.mjs`; `tests/registry.test.mjs` fails on an id-shaped field the schemas have and this table does not
src/emphasis.js            pure: `workingSet(atlas, state)` — the selection, the walked path, the consequences, the converging branches, the open actor, an open narrative's walk, the horizon and the lens, as id sets, with the lens applied to all of them. The three views draw from it instead of each assembling it. `shown` is what a view may draw and is never null since M65: the lens, or — with no lens — the resting picture of the main events, narrowed by the categories still on
src/lens.js                pure: which foci are on — the reader's `?focus=` list, or the record whose card is open as a lens of one — the events they reach, the one-hop ring drawn dimmed, and the four ways a control writes the parameter. An actor or place with no events is not a lens, and the implicit one never removes the selection, the chain, the consequences or an open horizon. Since M65 it also holds the two rules of what a view draws: `restingSet` — the **main events**, those that are part of no other, which is the picture at rest — and the chosen event as a lens of one, ahead of an open place or actor and behind a narrative being read, with `parentsOf` keeping what a lens's events are part of in the picture, dimmed
src/grounds.js             pure: which polities an event happened inside — the actor named in `actors`, the actor whose dated territory holds its place, and that actor's sovereign where the presence is a dependency. Worked out against the outlines by `tools/build-index.mjs` and written to `data/index/grounds-<hash>.json`, never at render time: selecting a polity must not cost a point-in-polygon. Containment is geometry and not a claim
src/large.js               pure: which events are large — `scope` written by a person, or parts falling in more than one region lane, judged against the region lanes always and never the reader's grouping — and which parents get a bracket over their parts. The timeline's band, the map's wash and its corner line all read this one answer
src/parts.js               pure: whether an event has parts — an active record `childrenOf` lists at least one active child for. The ring the map, the timeline and the graph draw around a parent's mark reads this one answer, at every zoom and under every grouping
src/chain.js               pure: the walked chain as edges, where a withdrawal cut it, and how many steps it lost. A step names its edge through `resolve()` where the id is not one the atlas holds now, so a `?chain=` shared before a rename still walks
src/walk.js                pure: the walk the atlas assembles rather than the reader clicking it out — the best path into an endpoint from where the question starts, as edge ids, with a provenance beside it saying the atlas put it together, on what day and to answer what. Built out of `shortestPaths`, `pathTo`, `pathCost` and `subgraph` and adding no traversal, so the chain it hands back is the chain the reader would have walked. A walk lives in the session and never enters `data/`; the Why mode (M35) is what will ask for one
src/render-key.js          pure: whether two states draw the same picture, per view; the one place a view asks "has anything I draw changed?" — and the count of attribute-shard arrivals every one of the four keys carries, since a century landing changes what is drawn and the state cannot see it
src/attributes.js          pure: which records are on screen when one is open, and therefore which attribute shards a card or an entry page pins while it is; and what a view may print as a name, which is nothing until the record's century has landed
src/window-band.js         the band and its two handles, once: the shade, the handles, the year each stands on, the profile of where the events are (`density.js`), what window a gesture may ask for, and every gesture that moves one — a handle dragged, the ground slid, the wheel, the arrow keys, the double-click that snaps to a decade. The timeline draws from it and so does the strip M64 opens over the map; two bands that could disagree about one window would be worse than the fault M64 fixes. `bandEvents` is what a band is a band over — M65's `shown`, and never the whole corpus
src/map-band.js            the band on the map, on demand (M64): a toggle at the top-left corner of the map pane and the slim strip it opens over it, built the first time it is opened and not before. Closed on a first visit and remembered per reader the way the panel's width is (`panes.js`); never in the URL, because a link is the picture its sender saw and not the controls they had open
src/window-control.js      the window of time from the masthead, on every view: the two ends as numbers to read and to type, a density hint of one column per century at the density strip's own scale, and the "N of N events in view" count with the pin that gives the world back — counted against the resting picture since M65 and not against the corpus. Writes `from` and `to`; pure halves — `windowPatch` and `densityColumns` — hold the clamping and the columns
src/graph-filters.js       the graph's own two controls, beside the map's layer switches and shown where those are hidden: the degree floor (how many active links an event needs to be drawn) and top level only. Writes `degree` and `tops`; `graph-view/arrangement.js` is where they are applied, outside a lens and never inside one
src/grouping.js            pure: which band a record belongs to under each grouping, and the bands in order
src/lanes.js               the one file that decides what a lane is: the region lanes, an actor's, a place's, and where a bar goes in one
src/panes.js               the one edge a reader can drag — how wide the panel is — remembered per reader and never in the URL. The timeline's edge went with the strip (M60)
src/share.js               a record's own address on the atlas and in the form, and `parseEdit` for `<kind>/<id>`; nothing of what the reader did to get there
src/intro.js               the card over the view on a first visit, and the "?" that brings it back; the only thing in localStorage
src/density.js             pure: the strip under the lanes — how many events fall in each column of the part of the window the bars do not reach
src/explanations.js        the explanation shards by period: which one an edge's prose is in, fetched when a card asks for it
src/markdown.js            pure: the subset an entry's body may use, its citations and its record links; raw HTML is shown as the characters typed
src/timeline-scale.js      pure: years ⇄ pixels for the timeline, and the ticks a span asks for
src/state.js               { from, to, view, focus, group, lanes, degree, tops, selected, source, place, actor, office, chain, horizon, layers, narrative, step, bbox } ⇄ URL; `degree` and `tops` are what the graph draws and nothing else reads them; a null bound is "as far as the data goes", and `layers` is the three names, the base map's five (`rivers`, `lakes`, `physical`, `mountains`, `cities`, and not `coast`), and a category of events as `events:<id>` beside them. A link naming a subset means "these and nothing else", so an old `?layers=territories,events` opens with the base map off
src/spine.js               the index's row encoding, once: `SPINE_COLUMNS` — one column list per kind, what each slot is and what a trimmed one means — with `CORE_COLUMNS` and `ATTRIBUTE_COLUMNS` beside it, which are one partition of it (I3), and the encoder and decoder that read all three forwards and backwards. A record in `data/index/` is a positional row over the file's own id table with the closed vocabularies as integers, and a tenth kind is a row in that table
src/data.js                manifest → the core (whole) → the attribute shards behind it, filled into the records in place → record text on demand; aliases, adjacency by edge and by relation, events by actor and by place, an event's point through its place, one geometry shard per year
src/graph.js               consequences, ancestors, convergence, shortest paths outward; pure, ordered by type then confidence
src/horizon.js             pure: what the selected event had led to by a year, and the set the views light
src/narrative.js           pure: what a step of a narrative is about, the chain at it, the window it needs;  narrative-mode.js  applies that to the store and remembers what reading replaced
src/citation.js            pure: a source as a citation, its identifiers as links, the bibliography's order
src/wikipedia.js           pure: which article a record's identity offers, and the URL it becomes
src/cluster.js             pure: which marks overlap at this zoom, over a grid; the timeline uses it in one dimension. zoomBucket() is how often the map is willing to ask
src/search.js              pure: titles, every name of an actor or a place, and a source's title and creators, folded and ranked;  search-box.js  the input and the keys
src/map/projection.js      lon/lat ⇄ SVG (equirectangular); the only file a projection change touches. CENTRAL_MERIDIAN is 150E and SEAM the 30W the geometry is cut at; `k = 1` is the whole world in 960 units, and that is the unit every zoom threshold in the data is written in
src/map/grid.js            pure: the fixed 60x45 degree grid the base map is cut on — 6 columns by 4 rows, keys `x0y0`..`x5y3`, origin -180 in data longitudes and not the seam. cellsFor(box) is which cells the viewport overlaps, wrapping a box that crosses the antimeridian. Not a tile scheme: one grid at one resolution, and the zoom never decides which cell is fetched
src/map/map.js             SVG scaffold, pan/zoom, click into a cluster, and the one round that draws every label
src/map/labels.js          pure: the one label placer and there is never a second. placeLabels(candidates, { k, view, limits }) orders by priority (0 events, 1 cities, 2 physical features), then weight, then id, and skips a label whose box hits one already placed rather than nudging it away from what it names. Holds the size, the halo and the box arithmetic and no other number
src/map/names.js           pure: what a thing on the map is called and in what year. The face carries the dated name from a place record's historicalNames for the far end of the band and the modern name otherwise; the title carries every name it has, with the years of each. Also the atlas's own places, the thirteen of twenty-six Natural Earth has no city for, labelled from the record itself. Invents nothing
src/map/glyphs.js          pure but for the elements it builds: one `<symbol>` per category of `data/categories.json`, in one `<defs>` the document holds once, and the `<use class="glyph">` the map draws over a mark and the timeline at the left of a bar. Stroke only, `currentColor`, no colour of its own; never a replacement for `circle.mark`, and nothing at all for an event with no category
src/map/layers/land.js     coastlines, always drawn and no longer a switch;  layers/base.js  the base map — one module for the six layers of `manifest.base` (coast, rivers, lakes, physical, mountains, cities), far file then cells, a signature that keeps a pan from rebuilding the world, and nothing about a layer in code that the manifest could carry;  layers/presences.js  territories, drawn as a filled outline and a stroke along its inland borders alone (M39b);  layers/events.js  marks, clusters and chain lines;  layers/regions.js  the wash a large event is drawn as, over the polygons of its lane
src/graph-view/layout.js   pure: where every node goes — x is the year, y is bands and a barycentre pass
src/graph-view/graph-view.js  the graph drawn: nodes, the five edge types, the window shaded, pan/zoom
src/graph-view/arrangement.js  pure: which events an arrangement is of — the band, its margin and whatever the reader is holding beyond it — and the key it is filed under
src/graph-view/layout-runner.js  which of the two paths a layout takes, and the fallback: the Worker above 600 events, the synchronous call below it and whenever a thread is absent or fails
src/graph-view/layout-worker.js  the layout on a thread of its own; it fetches nothing, so no data root can be got wrong there
src/graph-view/layout-message.js  pure: what crosses to that thread and back — ids, years, weights and lanes, and no records
src/graph-view/label-fit.js  pure: how long a label may be — the room to the next one and to the pane's edge, under the slice of the picture a label took at the world view; the cut follows the zoom because the text does not
src/timeline.js            the third view since M60: one lane per region; the window as a band with two handles; bars stack. It is chosen from the masthead and given the whole pane, where it used to be a strip along the bottom of the map
src/panel/panel.js         the shell: container, clicks, load token, what the cards share
src/panel/event.js         one card each: event.js, source.js, place.js, actor.js, office.js, cluster.js, narrative.js;  horizon.js  the "led to by year X" section; the actor card also lists its relations, both ways round
src/panel/office.js        the office card — the actor it belongs to, its category, every turn at it in order — and the tenure strip the actor card draws from the same list
src/panel/sections.js      the shape every card shares: a collapsible section per question, its count in the header, and which one opens
entry/<id>.html            GENERATED: the static rendering of a record that carries a body, canonical to entry.html?id=
src/entry/entry.js         pure: a record's full entry as markup, from the record and what it cites;  preview.js  the same prose as one paragraph, for a card;  main.js  bootstrap for entry.html
src/sources/main.js        bootstrap for sources.html;  bibliography.js  the list as markup, pure
src/narratives/main.js     bootstrap for narratives.html;  list.js  the cards, grouped by the centuries each account crosses, pure
src/phone.js               under 720px: what raises the panel's sheet over the view, what a drag of its grip ends as; the layout is one media query in style.css
src/contribute/reorder.js  one row of an ordered list moved up or down, with Alt+arrow; the form and the review editor share it
src/contribute/bundle.js   the pure half of the form: fields, bundle assembly, duplicate search
src/contribute/picker.js   the record picker: a scan over every record of a kind, ranked, with the kind, the years, the place and the degree beside each name
src/contribute/form.js     the form itself; submit.js copies the bundle and opens the issue
src/contribute/main.js     bootstrap for contribute.html
src/review/queue.js        pure: what is still unreviewed, with the validator's warnings against each;  sign.js  the signature, the retraction and what it carries;  save.js  which of the two paths a save takes;  citations.js  which citations somebody has checked against the source
src/review/editor.js       one record in the contribution form's own fields, validated on every keystroke;  main.js  bootstrap for review.html
src/review/claim.js        pure: who is reading a record now, when the claim expires, and taking one or letting it go
src/review/history.js      pure: a record's versions from its committed states, and the diff between two of them
src/review/row.js          one row of the queue as markup;  list.js  the windowed list under it, which draws the rows on screen and not the queue
src/validate/schema.js     JSON Schema subset validator; fails closed on unknown keywords
src/validate/rules.js      cross-record invariants 2–19 and the warnings; pure. `resolveId(id, universe)` is where a former id becomes the record it names, the way `resolve()` in data.js does
src/validate/migrate.js    the migration chain: ordered { version, name, up, down }, pure, no fs; applied on read by tools/lib/read.mjs and to disk by tools/migrate/apply.mjs
src/validate/core.js       validate(records, topology, schemas); buildTopology, buildSpine, and buildCore/buildAttributeShards for the split I3 writes beside it — the topology is in memory only, the rest are the files
src/validate/schemas.js    the schema file list, for the browser: it cannot scan a directory
src/fonts/                 EB Garamond and Public Sans, self-hosted, SIL OFL; README.md says which file came from where
src/util/dates.js          toAstronomical() and interval formatting; the only place years are compared
src/util/simplify.js       Douglas-Peucker, quantization and ring pruning; the import simplifies the arcs with it and the map simplifies an outline again by zoom
src/util/window.js         a null bound is the data's own; what overlaps the window; the "map at Y" rule
src/util/geo.js            point-in-polygon and nearest-lane region derivation
src/util/esc.js  dom.js    esc() and safeUrl(); SVG/HTML element helpers
src/util/memo.js           the caches: keyed, weak on the object they are about, and cleared with it
src/util/viewport.js       pure: which events a map box holds, with what the reader is holding exempt from it
src/style.css              azulejo tokens; every colour is a variable here
tools/validate.mjs         CLI over core, plus the disk-only checks and --index
tools/build-index.mjs      deterministic index: manifest + the hashed core, attribute shards, presence index, search shard, citer directory, sources, review and history files; and, since H8, the prerendered pages — lib/prerender.mjs is their pure half
tools/lib/history.mjs      each record's versions, from the commits that touched its file, and the shards they are filed into by kind and century; a shallow clone is refused and the file says `revised` instead
tools/lib/colour.mjs       the eight hues a territory may be drawn in, and the assignment no two neighbours share
tools/screens.mjs          the screenshots, through headless Chromium's own command line; it finds the browser, and tests/browser.mjs asks it where
tools/suites.mjs           which test files start a browser and which do not, read off the files themselves rather than listed: the check runs the eighteen that do one at a time and the other 129 in parallel, which is what stopped a different browser test dropping every run (docs/m63-load.md)
tools/build-regions.mjs    Natural Earth 110m → data/geo/regions.json, and the seam report; the coastline left it in M36a
tools/new-record.mjs       scaffold a record of any written kind; --new-place writes an event and its place at once
tools/migrate-places.mjs   one-time: every event's `where` → a place record; kept as documentation
tools/migrate/led-to-tenures.mjs  one-time: the twelve `led` relations → six offices, twelve tenures and twelve tombstones; kept as documentation
tools/migrate/roles.mjs    one-time: every actor line's free-text role → one of the 31 of `data/roles.json`, the phrase it was kept beside it as the line's `note`; the table is `docs/roles-mapping.md` and a test holds it there; kept as documentation
tools/migrate/ids.mjs      correcting an id: the record renamed, its former id appended to `aliases`, every reference rewritten, the derived id of every edge and relation that touches it carried with it, the index and the palette rebuilt and the validator run. Refuses a taken id, a tombstone and a record an import created; `--dry-run` prints the plan
tools/migrate/categories.mjs  one-time: the `category` of an imported event, read off its title with the class table of `data/imports/wikidata-seeds.json`; only where `origin.tool` is `wikidata`, never `other`, never over an existing one; kept as documentation
tools/migrate/backfill-standing.mjs  one-time: the standing of a record an import created before its import said `draft` — `review.status: draft`, because nobody has read it, with `standing-backfilled` and `imported-by-<tool>` beside it. Standing and not content: `review` is the only key it writes, and it refuses a record that has a status or a signature, one that is not active, and one with no `origin.tool`; kept as documentation
tools/seed-review-flags.mjs  one-time: STATUS.md's "Dates to verify" onto the records as review flags
tools/serve.mjs            the local server: the repository, plus PUT /__records/<kind>/<id> and GET /__status; 127.0.0.1 only, never deployed
tools/lib/store.mjs        the server's atlas between saves: the save queue, the topology patched as each save lands, the index rebuilt behind the answer
tools/bundle-to-files.mjs  issue body → data/<kind>s/<id>.json; ids slug-checked before any path
tools/lookup-sources.mjs   what the catalogues say a DOI or ISBN names; a review aid, never a gate
tools/overlap.mjs          how much of two presences' ground is the same, as intersection over the area of the smaller. A sweep by lines of latitude: the crossings of every ring give longitude intervals by parity, weighted by cos(lat). No projection and no library, because measuring that two outlines cover the same land is reading two records and not deciding between them (M51)
tools/m51-overlaps.mjs     the 26 pairs at the 1885/1886 seam through that measure, as the table `docs/m51-overlaps.md` carries; `--json` for the test that holds the file to the ground. Finds its presences by id, never by their `actor` field, which a join rewrites
tools/lib/span.mjs         the sentence a Historical Basemaps summary carries about its own interval, and where it points once a join or a cited dissolution moves the end it describes
tools/lib/order.mjs        writes a record's keys in the order the schema declares them, so an envelope added to a record that had none lands where every other record keeps it and not at the end of the file
tools/m59-singletons.mjs   the same measure asked backwards, for the records at that seam with no counterpart to pair with: for each actor ending in 1885, which actor beginning in 1886 stands on its ground. Returns jaccard beside the M51 ratio, because intersection over the smaller reads 1.0000 for a container as well as for a twin (M59)
tools/m59-join.mjs         the joins M59 makes from that measurement: one record absorbs another, its presences move, and nothing is redrawn
tools/m59-ends.mjs         what is left of 1885 after the joins — the dissolutions Wikidata dates, and the mark that says the rest end at the source's horizon and not at a dissolution
tools/import/cshapes.mjs   CShapes 2.0 → actors, presences, geometry shards, and the `succeeded` relation each split in data/imports/cshapes-actors.json states; it also asks the topology which of its arcs are inland borders — shared by two entities that existed at the same time — and writes them as the shard's arc list. topojson.mjs is its pure half (arcUsers is that question) and simplify.mjs the name it knows src/util/simplify.js by
tools/import/basemaps.mjs  Historical Basemaps -> the territories before 1886: one presence per polity per snapshot, `confidence: probable` because a border drawn for one year and assumed until the next is a claim, and one shard per snapshot interval. No `arcs`: GeoJSON has no topology, so there is no shared border to stroke and the outlines are filled and hatched instead. Where it meets CShapes at 1886, CShapes wins and the snapshot is dropped
tools/import/wikidata.mjs  identifiers and records from Wikidata; injectable fetch layer, tested on fixtures, additive on disk
tools/import/identity.mjs  the additive rule both imports obey: fill a gap, never change a value, never sign
tools/import/geometry.mjs  clipToBox (Sutherland-Hodgman, holes kept, lines cut into their runs) and splitAtMeridian over it: where the geometry is cut at the projection's seam
tools/import/source.mjs    reading a vendored source: gunzipped where the name says so, and the sha256 is of the decompressed bytes, which is the file as it was downloaded
tools/import/grid.mjs      three lines: the name the import knows src/map/grid.js by, as simplify.mjs is for the simplifier
tools/import/naturalearth.mjs  Natural Earth 10m -> the base map's data: data/geo/land-present.json at the far level and data/geo/base/<layer>/<cell>.json at the near, the tolerance of each stepped up until its cap holds. --survey prints the property keys a committed file actually has, --budget the tolerance, bytes, points kept and points dropped per layer, --check the sha256 of the decompressed sources. Offline: a fetch in it is a bug, not a fallback
tools/import/features.mjs  pure: Natural Earth's properties -> this atlas's fields, one frozen table per layer, every property name read off the committed file with --survey and never guessed; and the one monotone table from NE's tile zoom to our `k`, everything on the map by k = 16
tools/import/places.mjs    pure: which Natural Earth city a `data/places/` record is. Two signals and no third - `wikidata`, then an exact fold of the name where exactly one city survives it and is within a degree of the point the record already gives. A match is never guessed: everything refused is listed for a person, and a place record with no city is not an error
tools/import/layers.mjs    pure: how one Natural Earth layer becomes a world file and a file per cell. What a cell holds is decided per layer: rivers are lines clipped to it, lakes and physical regions whole features by bbox overlap carrying the id M37 draws each once by, peaks points. A cut edge is never part of a stroked ring
vendor/                    INPUTS: the sources the geometry imports run on, gzipped, never data, never served, never in deploy.yml's allowlist
tools/import/cache/        GENERATED: Wikipedia leads with their revision; never published, never data, not under data/
tools/lib/read.mjs         all filesystem access for the tools, everything under data/imports/ included
tests/                     node --test, zero deps; tests/fixtures/data/ is the synthetic graph
.github/ISSUE_TEMPLATE/    contribution.yml, correction.yml, config.yml (no blank issues)
.github/workflows/         validate.yml on pull requests; contribution.yml on the `accepted` label; deploy.yml on main; import-wikidata.yml on import/** — the only job with a network
```

## The data model

Ten record kinds: `event`, `edge`, `source`, `actor`, `place`, `relation`,
`office`, `tenure`, `presence`, `narrative`. An actor is a person, polity,
institution or people; events name the actors *of* the event with the role
each played and, optionally, a note beside it (`actors: [{ actor, role,
note }]`). An **office** is a post held one person after another and belongs
to an actor; a **tenure** is one person's turn at one, with its own dates and
sources.

**Two closed vocabularies live in data, not in code**: `data/roles.json` (the
owner's 31 roles) and `data/categories.json` (the twelve kinds of event —
`war`, `treaty`, `election` and so on). Adding one is an edit to a file
somebody can argue with, never a code change. Both are read into the topology
and into the manifest. A role outside `data/roles.json` is **rule 25**, an
error, on an active event: M32b-1 applied the mapping of
`docs/roles-mapping.md` and re-filed the 163 phrases that were in use, keeping
each one as the `note` beside its role. A category outside
`data/categories.json` is still the **warning** `category-unknown`, because
most of the corpus carries no category at all. A missing file means no check
at all, never an empty closed set. An event's `scope` (`regional | worldwide`) is the exception that
stays in code: it says how the atlas draws an event rather than what the event
was. The contribution form and the review dashboard write all of this since
M30b-3 — `parent` chosen from the events, `scope` and `category` as selects,
and the actor row as three columns — the actor, the role
as a closed `<select>` of `data/roles.json` since M32b-1, and the note beside
it, which is where the phrase a role cannot hold now lives.

An event may be **part of** another with `parent` — a battle inside a war, a
decree inside a revolution. It is a display fact and never an argument:
`parent` does not enter the adjacency, so consequences, ancestors, convergence
and the horizon stay edge-only. Rule 24 holds it together and a child dated
outside its parent is a warning. An actor is never on the timeline alone, so
it has no lane; nor is a lane required of an event any more — one with neither
a place nor a region warns `no-lane` and is drawn in none.

A **place** is somewhere events happen. An event carries `place: "<id>"` and
no coordinates of its own, so a town is written once however many events
happen there and can be read as a thing with a history (`?place=lisbon`). A
place cites nothing — where a town is is a fact, not an argument — and the
timeline lane is derived from its point, with an override on the place for
somewhere no lane polygon reaches and an override on the event for an event
that belongs somewhere other than where it happened. A place is not a
territory: what ground an actor held is a presence.

Which actor an imported territory belongs to is **data, not code**:
`data/imports/cshapes-actors.json`, keyed by the source's own entity code,
with `splits` for a code that is more than one actor over its life (British
India and the Republic; the Dutch East Indies and Indonesia). Correcting a
territory is an edit to that file and a re-run of the import — **never** a
hand-edited presence record or outline. `CONTRIBUTING.md` → "Correcting a
territory" is the contributor's version of this paragraph.

A **presence** says which ground an actor held and when, with an outline
under `data/geo/presences/`. Territories were imported from CShapes 2.0 and
carry **CC BY-NC-SA 4.0**, which `data/LICENSE` does not cover: never copy
anything out of a presence, an imported actor record or a geometry shard
into a CC BY-SA record. `NC_ORIGINS` in `src/origin.js` is the whole of that
exception — one line per import allowed to create actors, keyed on
`origin.tool` and not on a name in `authors` — and the validator enforces it.
Which licence covers which directory, and whom each asks to be named, is
`src/licensing.js`, the manifest's `licenses` block and the table at the head
of `data/LICENSE`; a card or an entry page carrying NC material says so.

A **relation** is a dated, typed link between two *actors* — the link an edge
cannot be, because an edge runs between events. `regime-of`, `succeeded`,
`member-of`, `part-of`, `allied-with`: five to write, with which kind of actor
may stand at each end fixed by rule 19. A sixth, `led`, is **deprecated** and
kept: who led a body is an office somebody held (an `office` and a `tenure`),
because a relation's id is `from--to--type` and one person may lead one body
more than once. Its twelve records are tombstones since M30a-2, the type is
still in every vocabulary and pattern so that they keep validating, and rule
19 refuses an active relation of it. It cites at least one source, as
an edge does; a missing type is reported in `STATUS.md`, never replaced by a
generic one. Relations have no card of their own — they are read from the
actor card at either end.

A **narrative** is a signed walk through records that are already here: an
ordered list of steps, each naming one event or one edge and carrying the
narrator's own paragraph on why that step follows. It changes nothing it walks.
Reading one is a *mode* — `?narrative=<id>&step=<n>` is the whole of the URL,
and the selection, the chain and the window are derived from the step — because
a link to a narrative is a link to a place in an argument. Several narratives
may cross the same period and disagree; each is attributed and the reader
compares them.

An edge is a small historiographical argument, so `explanation` and `sources`
are required. Five edge types exist (`caused`, `enabled`, `reacted-to`,
`precondition-of`, `inspired`) specifically so everything does not collapse into
plain causation. Do not add a generic type.

An event, an actor and a place may carry **identity fields** — `wikidata`,
`wikipedia` (language → article title) and `sitelinks` — all optional, all
additive, and written by the import rather than by hand; the contribution
form derives only `wikidata`, from a pasted Wikidata URL, and the review
dashboard shows all three read-only. `sitelinks` is `{ count, on }`: a count
of somebody else's database changes without this record changing, so it is
stored as a snapshot with the day it was read. They are identifiers and never
evidence:
the card offers "Read more on Wikipedia" as a way *out* of the atlas, and
everything the atlas asserts stays in the record. **`sitelinks` feeds
nothing** — not the map, not `weight`, not `prominence`. An edge may not be
`consensus` when every supporting citation is a Wikipedia record (rule 22).

**What the Wikidata import may do** is narrow, and it is narrow on purpose.
It never writes an edge. On a record that already exists it fills in an
identity field that is absent, and — since I8, decided by the owner on
2026-09-06 as question 3 of `docs/index2-plan.md` — the other **names** the
item gives, under one further clause: only where the field is absent, only on
a record whose `review.status` is `draft`, and with `imported-names` added to
`review.flags` so the reviewer can see where they came from and take them
off. Nothing else: it never changes a value, never touches `summary`,
`title`, `when`, `place`, `actors` or `sources`, and never adds itself to
`authors` — the rule is `tools/import/identity.mjs` and `cshapes.mjs` obeys
it too. Records it *creates* carry its own author entry,
`review.flags: ["imported-facts"]`, and a summary that quotes the item's
description and says it is not this atlas's account of anything. Which
Wikidata class becomes which kind of record here is **data, not code**:
`data/imports/wikidata-seeds.json` → `classes`, and an item of a class nobody
has decided about is refused and listed rather than guessed at. The tool has
no network in this sandbox; it runs in `.github/workflows/import-wikidata.yml`,
on a branch called `import/…`, which commits to that branch and never to
`m0`.

A record's `review` block may also say which of its citations somebody has
opened and checked against the source (`review.citations`). That is a **flag
and not a gate**: it is counted by the validator, shown in the queue and on
the open record, and Sign warns about it and signs anyway. `flags` and `note`
are the reviewer's to clear and signing clears them; `citations` is their own
audit trail and **Sign keeps it**.

Why a record was withdrawn is `retraction: { on, reason }`, present exactly on
a retracted record and deleted by nothing — it lived in `review.note` until
H5b, where signing a tombstone erased the only account in the data of its
being one. `review.html` asks for the reason before it writes anything.

`confidence` separates consensus from debate. The interface shows the
difference. Presenting a disputed link as fact is the worst mistake this project
can make. When historians disagree, mark it `disputed` and say who disagrees in
`dispute` rather than picking a side.

## The convergence query

In `src/graph.js`. Given a target and the chain the user walked, it returns the
other ancestors of that target that are not on the walked path.

We exclude the walked path only, not everything descending from the starting
event. The wider exclusion was tried and always returned empty, because in a
connected graph nearly every node descends from the oldest one. Do not
"simplify" it back.

## Code conventions

- Vanilla JS, ES modules, no framework, no TypeScript for now.
- Data from `data/` is untrusted input; it becomes community contributions
  later. Escape it before putting it in the DOM. `esc()` in `src/util/esc.js`.
- Comments explain why, not what. In English.
- Small modules with one job. If `main.js` passes ~300 lines, split it.
- No dark mode yet. Visual direction is azulejo: cold white ground, cobalt
  drawing, one madder red accent for the path being followed, and — since
  M19 — **eight muted territory hues** on the map, with a lighter tint of
  each for dependencies. A hue says only "not the one beside it": which actor
  gets which is a graph colouring over the borders themselves
  (`tools/build-palette.mjs` → `data/geo/palette.json`), there is no legend by
  colour, and the hues sit *under* the hierarchy of emphasis — the selected
  actor is cobalt over every hue and the walked chain is madder over that.
  Colors are CSS variables in `src/style.css`; use them, do not add new hex
  values. Type is EB Garamond for what the atlas says and Public Sans for
  what the interface says, self-hosted in `src/fonts/` under the OFL; sizes
  come from the type scale in `style.css` and nowhere else.

## Working with me

- Propose a plan before multi-file changes and wait for me to agree.
- Do not add features I did not ask for.
- When a historical fact is involved and you are not sure, say so instead of
  filling it in. A wrong date that looks confident is worse than a gap.
- Small commits, one logical change each, messages in English.

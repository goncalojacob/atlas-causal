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
node tools/build-regions.mjs       # regenerate data/geo/ from Natural Earth; rarely
node tools/import/cshapes.mjs --source cshapes_2_gw.topojson [--report]  # territories, 1886-2019; rarely
node tools/import/wikidata.mjs --reconcile|--import|--candidates   # NOT here: no network in this sandbox — it runs in the Action, on an import/** branch
node tools/new-record.mjs event|edge|source|actor|place|relation|narrative …   # scaffold a record; the text is yours to write
node tools/migrate/apply.mjs       # the migration chain of src/validate/migrate.js applied to data/; in the same commit as any migration that changes bytes
node tools/seed-review-flags.mjs   # STATUS.md's "Dates to verify" onto the records as review flags; once
node --test                        # every test under tests/ (Node 22 takes no directory argument)
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
data/presences/<id>.json   who held which ground and when; imported, CC BY-NC-SA 4.0
data/imports/<source>.json which actor a source's entity becomes, and where one code is two actors
data/imports/wikidata-seeds.json  the items, queries and class table the Wikidata import is pointed at; contributor-editable
data/imports/wikidata-state.json  where a cut-off import stopped, one cursor per mode; written by the tool
data/regions.json          timeline lanes: id, label, order
data/roles.json            the 31 roles an actor line may take; a closed vocabulary in data, warned about and not yet enforced
data/categories.json       the twelve kinds of event; a closed vocabulary in data, drawn as a glyph per category from M30b
data/geo/land-present.json Natural Earth 110m coastlines, public domain, generated
data/geo/regions.json      one polygon per lane, generated by tools/build-regions.mjs
data/geo/presences/        outlines sharded by period, generated by tools/import/cshapes.mjs
data/geo/palette.json      which of the eight hues each actor's territory is drawn in, generated by tools/build-palette.mjs
data/index/manifest.json   GENERATED, never cached: counts, the hashed names below, lanes, roles in use, the two vocabularies, officesByEvent and tenuresByOffice, land epochs, presence shards
data/index/spine-<hash>.json      GENERATED: the graph, loaded whole by every page — every record's envelope, an event's title, when, place, lane, weight and actors, an edge as [from,to,type,confidence,status,revised], and not a word of the prose
data/index/search-<hash>.json     GENERATED: what the search box scans, folded at build time; fetched beside the spine and never waited for
data/index/citers-<hash>/<source-id>.json  GENERATED: the records that cite that one source; fetched when a reader opens it
data/index/sources-<hash>.json    GENERATED: every source's bibliographic fields and citationCount, and no citer rows
data/index/review-<hash>.json     GENERATED: the draft queue and the validator's warnings, for review.html
data/index/               all of it committed on main by deploy.yml; byte-identical to a fresh build
data/LICENSE  data/geo/LICENSE   CC BY-SA 4.0 for records; per source for geometry
schema/common/             interval, place, provenance (the envelope), confidence
schema/v1/                 event, edge, source, actor, place, relation, narrative, presence, region, bundle; import-map, import-seeds, import-state and wikipedia-lead are tool-side
index.html                 the atlas; no build step, plain ES modules
contribute.html            the contribution form; not linked from the atlas while contributions are closed
about.html                 what it is, how to read confidence and a dispute, the licences
sources.html               the bibliography, written into the file by the build from the sources index
narratives.html            every narrative as a card, grouped by the centuries it crosses; written into the file by the build
review.html                the review queue; a maintainer's page, unlinked, and the only one that can write
README.md  CONTRIBUTING.md for people reading the repository
src/main.js                bootstrap only: load, wire views; ?fixtures=1 reads tests/fixtures/data/
src/origin.js              who wrote a record and how far it has been read: a leaf module with the two closed vocabularies — the writers `origin.tool` may name, the two `review.status` values — and the predicates the licence hole, the review queue and the two imports read instead of matching an author's name against a string
src/licensing.js           which licence covers which directory, whom each asks to be named, and the one line an NC-derived card and entry page owe it. The manifest's `licenses` block and the table at the head of `data/LICENSE` are the same thing said twice more, and a test holds the three together
src/kinds.js               the record kinds: a leaf module, one entry per kind — directory, schema file, licences, identity and body, its citation, actor and step lists, its form fields' names, its URL parameter and its labels. Everything that used to list the kinds imports it
src/vocab.js               the closed vocabularies: a leaf module with the edge types, the relation types, the groupings and the lens kinds, and the id patterns built from them. `state.js` imports it rather than copying it
src/emphasis.js            pure: `workingSet(atlas, state)` — the selection, the walked path, the consequences, the converging branches, the open actor, an open narrative's walk, the horizon and the lens, as id sets, with the lens applied to all of them. The three views draw from it instead of each assembling it
src/lens.js                pure: which foci are on — the reader's `?focus=` list, or the record whose card is open as a lens of one — the events they reach, the one-hop ring drawn dimmed, and the four ways a control writes the parameter. An actor or place with no events is not a lens, and the implicit one never removes the selection, the chain or the consequences
src/chain.js               pure: the walked chain as edges, where a withdrawal cut it, and how many steps it lost
src/render-key.js          pure: whether two states draw the same picture, per view; the one place a view asks "has anything I draw changed?"
src/grouping.js            pure: which band a record belongs to under each grouping, and the bands in order
src/lanes.js               the one file that decides what a lane is: the region lanes, an actor's, a place's, and where a bar goes in one
src/panes.js               which of the three views is on screen and how the panes divide, from the state
src/share.js               a record's own address on the atlas and in the form, and `parseEdit` for `<kind>/<id>`; nothing of what the reader did to get there
src/intro.js               the card over the view on a first visit, and the "?" that brings it back; the only thing in localStorage
src/density.js             pure: the strip under the lanes — how many events fall in each column of the part of the window the bars do not reach
src/explanations.js        the explanation shards by period: which one an edge's prose is in, fetched when a card asks for it
src/markdown.js            pure: the subset an entry's body may use, its citations and its record links; raw HTML is shown as the characters typed
src/timeline-scale.js      pure: years ⇄ pixels for the timeline, and the ticks a span asks for
src/state.js               { from, to, view, selected, source, place, actor, chain, horizon, layers, narrative, step } ⇄ URL; a null bound is "as far as the data goes"
src/data.js                manifest → the spine (whole) → record text on demand; aliases, adjacency by edge and by relation, events by actor and by place, an event's point through its place, one geometry shard per year
src/graph.js               consequences, ancestors, convergence, shortest paths outward; pure, ordered by type then confidence
src/horizon.js             pure: what the selected event had led to by a year, and the set the views light
src/narrative.js           pure: what a step of a narrative is about, the chain at it, the window it needs;  narrative-mode.js  applies that to the store and remembers what reading replaced
src/citation.js            pure: a source as a citation, its identifiers as links, the bibliography's order
src/wikipedia.js           pure: which article a record's identity offers, and the URL it becomes
src/cluster.js             pure: which marks overlap at this zoom, over a grid; the timeline uses it in one dimension. zoomBucket() is how often the map is willing to ask
src/search.js              pure: titles, every name of an actor or a place, and a source's title and creators, folded and ranked;  search-box.js  the input and the keys
src/map/projection.js      lon/lat ⇄ SVG (equirectangular); the only file a projection change touches
src/map/map.js             SVG scaffold, pan/zoom, click into a cluster
src/map/layers/land.js     coastlines;  layers/presences.js  territories;  layers/events.js  marks, clusters and chain lines
src/graph-view/layout.js   pure: where every node goes — x is the year, y is bands and a barycentre pass
src/graph-view/graph-view.js  the graph drawn: nodes, the five edge types, the window shaded, pan/zoom
src/graph-view/arrangement.js  pure: which events an arrangement is of — the band, its margin and whatever the reader is holding beyond it — and the key it is filed under
src/graph-view/layout-runner.js  which of the two paths a layout takes, and the fallback: the Worker above 600 events, the synchronous call below it and whenever a thread is absent or fails
src/graph-view/layout-worker.js  the layout on a thread of its own; it fetches nothing, so no data root can be got wrong there
src/graph-view/layout-message.js  pure: what crosses to that thread and back — ids, years, weights and lanes, and no records
src/timeline.js            one lane per region; the window as a band with two handles; bars stack
src/panel/panel.js         the shell: container, clicks, load token, what the cards share
src/panel/event.js         one card each: event.js, source.js, place.js, actor.js, cluster.js, narrative.js;  horizon.js  the "led to by year X" section; the actor card also lists its relations, both ways round
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
src/validate/core.js       validate(records, topology, schemas); buildTopology and buildSpine — the topology is in memory only, the spine is the file
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
tools/build-index.mjs      deterministic index: manifest + the hashed spine, search shard, citer directory, sources and review files; and, since H8, the prerendered pages — lib/prerender.mjs is their pure half
tools/lib/history.mjs      each record's versions, from the commits that touched its file; a shallow clone is refused and the file says `revised` instead
tools/lib/colour.mjs       the eight hues a territory may be drawn in, and the assignment no two neighbours share
tools/screens.mjs          the screenshots, through headless Chromium's own command line; it finds the browser, and tests/browser.mjs asks it where
tools/build-regions.mjs    Natural Earth → data/geo/
tools/new-record.mjs       scaffold a record of any written kind; --new-place writes an event and its place at once
tools/migrate-places.mjs   one-time: every event's `where` → a place record; kept as documentation
tools/migrate/led-to-tenures.mjs  one-time: the twelve `led` relations → six offices, twelve tenures and twelve tombstones; kept as documentation
tools/seed-review-flags.mjs  one-time: STATUS.md's "Dates to verify" onto the records as review flags
tools/serve.mjs            the local server: the repository, plus PUT /__records/<kind>/<id> and GET /__status; 127.0.0.1 only, never deployed
tools/lib/store.mjs        the server's atlas between saves: the save queue, the topology patched as each save lands, the index rebuilt behind the answer
tools/bundle-to-files.mjs  issue body → data/<kind>s/<id>.json; ids slug-checked before any path
tools/lookup-sources.mjs   what the catalogues say a DOI or ISBN names; a review aid, never a gate
tools/import/cshapes.mjs   CShapes 2.0 → actors, presences, geometry shards; topojson.mjs is its pure half and simplify.mjs the name it knows src/util/simplify.js by
tools/import/wikidata.mjs  identifiers and records from Wikidata; injectable fetch layer, tested on fixtures, additive on disk
tools/import/identity.mjs  the additive rule both imports obey: fill a gap, never change a value, never sign
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
and into the manifest, and a role or a category outside them is a **warning**
(`role-unknown`, `category-unknown`) until M32b applies the mappings and turns
the first into an error. A missing file means no check at all, never an empty
closed set. An event's `scope` (`regional | worldwide`) is the exception that
stays in code: it says how the atlas draws an event rather than what the event
was.

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
identity field that is absent and nothing else: it never changes a value,
never touches `summary`, `title`, `when`, `place`, `actors` or `sources`, and
never adds itself to `authors` — the rule is `tools/import/identity.mjs` and
`cshapes.mjs` obeys it too. Records it *creates* carry its own author entry,
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

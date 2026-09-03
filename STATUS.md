# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-03, after M11 (`docs/m11-brief.md`): actors are linked to each other.
The **`relation` kind** — `regime-of`, `succeeded`, `member-of`, `part-of`,
`led`, `allied-with`, six and closed — is the first link in this model that
does not run between events, and it answers the open question this file has
carried since M5: the Estado Novo is a regime *of* Portugal, and now a record
says so. Twenty-eight relations were drafted under the same exception as the
rest of the test dataset; every one of them is assistant-written and unread by
a person.

## Phase

**M0 to M11 built, plus the map usability work, on branch `m0`, pull
request #1 open against `main`.** M12 is next in the order the run protocol
sets. M8 changed no structure and wrote no revision, as its brief allows.
`ARCHITECTURE.md` **revision 11** is the specification; its opening note says what changed and why (revision 4
added the `actor` kind; revision 5 added `cluster.js`, `weight` in the
index and `prominence` as a reserved override; revision 6 added the
`presence` kind, the CC BY-NC-SA licence and its one exception, and moved
the last four reserved names in the tree into use; revision 7 made an
import's actor mapping data, turned the year into a window, and moved
`map/cluster.js` to `cluster.js` because the timeline stacks with it too;
revision 8 added the graph view, the `view` state and a reserved line for
level of detail along the time axis; revision 9 made places records, took
`where` off events, added rule 18 and split the panel into one file per
card; revision 10 put each source's citers in the sources index, added the
source card, the bibliography page and the horizon, and put `source` and
`horizon` in the state; revision 11 added the `relation` kind, rule 19 and
the relations on the actor card).
The M5 brief asks for revision 5; the map work had already taken that
number.

`data/` holds a **test dataset, 20th–21st century Portugal** — **80
events, 91 edges, 59 actors, 28 relations, 25 places, 30 sources**, 1910 → 2025 — drafted by the
assistant on 2026-09-02 and 2026-09-03 at the owner's request as an exception to the
"written by a person" rule (recorded in `CLAUDE.md`). Every record says so
in `authors`. It validates with **0 errors and 2 warnings**, both of them
`degree-zero` and both deliberate (see M8 below), the index is
built, and the atlas renders it at `http://localhost:8000/` without
`?fixtures=1`. Twelve edges are `disputed` with dissenting citations; two
lanes derive by `nearest` (Goa, Macau — both correct); one **place** uses a
`region` override (the Azores, absent from the 110m coastline) and four
events keep the override they were written with (the Azores, Recife, the
Spanish border, Lisbon for the Spanish war), three of which now agree with
what their place derives and could be dropped. Every page still serves from `python3 -m http.server 8000`.

**Nothing in it has been read by a person.** See item 4 under Next, and
"Dates to verify" below.

`data/` also holds **710 presences and 252 imported polity actors**,
1886–2019, from **CShapes 2.0** — an import, not writing, under
**CC BY-NC-SA 4.0**, which `data/LICENSE` does not cover. See "The CShapes
import" below. Which actor each of them belongs to is
`data/imports/cshapes-actors.json`, a validated data file rather than a
table in the tool.

What exists and passes (`node tools/validate.mjs --index`: **0 errors, 2
warnings**, both `degree-zero` and both intended; `node --test`: 275 tests):

- **M0.** Licences (`LICENSE` MIT, `data/LICENSE` CC BY-SA 4.0,
  `data/geo/LICENSE` Natural Earth); `.nvmrc` = 22; `schema/common/` and
  `schema/v1/`; `src/validate/{schema,rules,core}.js`;
  `src/util/{dates,geo}.js`; `tools/{validate,build-index,build-regions,
  new-record}.mjs` and `tools/lib/read.mjs`; `data/geo/land-present.json`
  and `data/geo/regions.json` from Natural Earth v5.1.2; `data/index/` for
  the empty dataset; `tests/fixtures/data/` (twelve events, ten edges, four
  sources, three square lanes) with its own index; `validate.yml`,
  `deploy.yml`, `CODEOWNERS`, PR template.
- **M1.** `index.html`, `src/style.css` (azulejo tokens), `src/main.js`,
  `state.js`, `data.js`, `graph.js`, `map/projection.js` (equirectangular),
  `map/map.js`, `map/layers/{land,events}.js`, `timeline.js`,
  `timeline-scale.js`, `panel.js`, `util/{esc,dom}.js`. State
  `{ year, selected, actor, chain, layers }` in the query string (`actor`
  arrived in M4; `year` became the window `{ from, to }` in M6). Disputed
  edges dashed on the map and marked in the panel.
- **M2.** `contribute.html` and `src/contribute/{bundle,form,submit,main}.js`:
  the form builds a bundle, runs the same `validate()` the CLI runs against
  the loaded topology, shows each error next to the input that caused it, and
  keeps the submit control disabled until the bundle validates, every event
  and edge cites a source, and any near-match to an existing title has been
  acknowledged. `submit.js` copies the bundle and opens the issue template,
  prefilled only while the encoded body is under 6 KB.
  `.github/ISSUE_TEMPLATE/{contribution,correction,config}.yml`;
  `tools/bundle-to-files.mjs` with the hostile-input tests;
  `.github/workflows/contribution.yml` gated on the `accepted` label;
  `tools/lookup-sources.mjs` for the DOI/ISBN reading aid.
- **M3.** `about.html` (linked from the atlas header), `CONTRIBUTING.md`,
  `README.md`; `deploy.yml` re-checked against the current tree.
- **M4.** The **`actor` kind**, end to end. `schema/v1/actor.json`
  (`actorType`, `names`, `summary`, `when`, optional `where`, the usual
  envelope); an event's `actors` is now `[{ actor, role }]`; rule 14
  rewritten and rules 6, 10, 11 and 15 extended to actors, with two new
  warnings (`actor-unused`, `actor-outside-when`); the topology carries
  `actors` and the manifest counts them and lists the `roles` in use;
  `data.js` resolves actor ids and builds `eventsByActor`; `panel.js` shows
  an event's actors and an actor's card; the map and the timeline give an
  actor's events a cobalt emphasis, distinct from the madder path;
  `?actor=<id>` in the URL; the form has an actor record type and an
  actor-and-role row on events; `new-record.mjs actor …`; two synthetic
  actors in `tests/fixtures/`. `ARCHITECTURE.md` revision 4, and
  `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` updated.
- **Map usability** (`docs/map-brief.md`). `weight` on every topology
  event, derived at index time: active edges in and out plus the actors
  named — mechanical, not editorial, with `prominence` reserved as the
  override. `src/map/cluster.js` (`src/cluster.js` since M6), pure and
  tested: which marks overlap at
  the current zoom, which of them no zoom the map allows could ever part,
  where a cluster comes apart. `layers/events.js` renders clusters — one
  mark for the heaviest member, a `+n` badge for what is under it, an
  invisible larger hit circle behind every mark, and a label on the
  heaviest clusters on screen past `k = 4`; the selected event, the walked
  path, the endpoints of a drawn edge and the events of the selected actor
  are never put in a cluster. Clicking a cluster zooming can separate goes
  to the zoom where everything separable has separated; clicking a
  coincident one spreads its members on rings with a leg each. Either
  click lists the members in the panel, chronologically, which is the
  keyboard path in. **Two bugs fixed**: the drag guard never fired
  (`pointerup` cleared `drag` before the click arrived), and — worse —
  `setPointerCapture` on `pointerdown` retargeted every click to the SVG
  root, so **no mark on the map had ever been clickable**.

- **M5.** The **`presence` kind**, end to end. `schema/v1/presence.json`
  (`actor`, `presenceType`, `dependencyOf`, `dependencyKind`, `when`,
  `geometry {files, key}`, `capital`, `confidence`, the usual envelope);
  `CC-BY-NC-SA-4.0` in the licence enum and `endDate` on
  `common/interval.json`; **rule 17** and the reach of rules 3, 6, 10, 11
  and 12 into the new kind, with `IMPORT_AUTHORS` as the whole of the
  licence exception; two new warnings (`presence-outside-actor-when`, and
  `actor-unused` now counts territory); the topology carries presences
  without their coordinates and the manifest lists the shards;
  `tools/validate.mjs` checks the geometry files on disk.
  **`tools/import/`**: `topojson.mjs`, `simplify.mjs`, `cshapes.mjs` —
  offline, zero dependencies, idempotent, sha256-checked.
  **The site**: `src/map/layers/presences.js` under the events and over the
  land; `data.js` loads one geometry shard per year and caches it; the
  actor card lists an actor's territory over time and everything it held;
  `territories` in the layer state and in the header, default on.
  `about.html`, `README.md`, `CONTRIBUTING.md` and `data/geo/LICENSE` carry
  the attribution and the licence warning. Fixtures gain two synthetic
  polities, three presences and two geometry shards.

- **M6.** **The import's actor mapping as data.**
  `data/imports/cshapes-actors.json`, validated against a new
  `schema/v1/import-map.json` that the browser never fetches
  (`TOOL_SIDE` in `src/validate/schemas.js`); `readImportMaps()` in
  `tools/lib/read.mjs` and `checkImportMap()` in `tools/validate.mjs`;
  `tools/import/cshapes.mjs` reads it, cuts a code's features into segments
  by date, refuses a split date that is not a boundary CShapes itself draws
  and names the ones it has, and gained `--report`, which writes
  `docs/cshapes-entities.md`. **The six warnings are gone**: 750 is
  `british-india` to 1947-08-15 and `republic-of-india` after it, 850 is
  `dutch-east-indies` to 1945-08-17 and `indonesia` after it, all by
  re-running the import. `CONTRIBUTING.md` gains "Correcting a territory".
  **The two date disagreements** are said in the summaries of
  `east-timor-invasion-1975` and `guinea-bissau-declares-independence-1973`;
  no outline and no date was touched.
  **A window of time**: `{ from, to }` replaces `year` in `state.js`, either
  end null for the data's own bound, resolved by the views in a new pure
  `src/util/window.js`; `?from&to` in the URL and a legacy `?year=X`
  rewritten once at load. The map draws the events whose interval overlaps
  the window and the territories of its far end, clamped to the last year the
  outlines cover; the chain, the selected event and the selected actor's
  events are drawn outside the window too, faded. The map's year slider is
  gone. **The band**: the window drawn over the timeline's lanes with a
  handle at each end, dragging, sliding, arrow keys, a double-click that
  snaps to a decade, and a marker saying which year's borders the map has.
  **Stacking**: `map/cluster.js` becomes `src/cluster.js` and the timeline
  uses it in one dimension; only the events in the window stack together, so
  narrowing the band splits them. **Search**: `src/search.js` (pure, ranked,
  diacritic-insensitive, over titles and every one of an actor's names) and
  `src/search-box.js` (`/` to focus, arrows, Enter, Escape, combobox and
  listbox roles, a live count).
- **M7.** **The graph view.** `src/graph-view/layout.js` — pure: the topology,
  the lane list and the data's extent in, the coordinates of every node and
  every edge out. x is the year on the whole extent, the same scale the
  timeline keeps; y is one band per region and, inside a band, a layered
  barycentre pass over the events of each year, forwards then backwards.
  Every sweep's arrangement is scored by how many edges cross and the best
  wins, the plain id order included, so the pass can never leave the drawing
  more tangled than doing nothing would; ties break by id then weight and
  every list feeding a floating-point sum is sorted, so the picture does not
  depend on the order the records arrive in. `tests/graph-layout.test.mjs`
  asserts all of that, on a hand-built sample and on the whole atlas.
  `src/graph-view/graph-view.js` draws it: the bands and the year axis once;
  the five edge types by dash pattern and weight from tokens in `style.css`,
  each with its own arrowhead, disputed dashed over its type; the window as a
  shade with everything outside it faded, never hidden; the walked chain in
  madder, an actor's events in cobalt, and the convergence branches — the
  same list the panel shows — filled in, which is the one thing this view can
  say that the other two cannot. Pan, zoom, double-click to reset; labels for
  the heaviest nodes zoomed out and for every node on screen at zoom 2 and
  over. `view` joins the state and the URL (`?view=graph`, default `map`);
  the **Map | Graph** toggle in the header swaps the two in the same slot and
  the layer switches, which belong to the map, go with it. `about.html` gains
  a section on reading the graph and a key to the five line patterns, drawn
  with the same CSS rules as the graph itself so the two cannot drift apart.

- **M9.** **Places as records.** `schema/v1/place.json` — the envelope, a
  name list, a point and an optional lane override, with `sources` allowed to
  be empty because a place is a geographic fact rather than an argument (rule
  6's exemption, beside `source` and `region`). An event carries
  `place: "<id>"` and **no coordinates of its own**: the lane is derived from
  the place's point, the place's own override wins over the derivation and the
  event's override wins over both. **Rule 18** is what is left to check on a
  place — at least one name, no repeats — and rules 3, 10, 11 and 12 reach
  into it; a place no active event names is the warning `place-unused`.
  `tools/migrate-places.mjs`, kept in the repository and idempotent, grouped
  the sixty events by their exact coordinates and label into **22 places**
  (37 of them Lisbon) and rewrote every event; it was run over
  `tests/fixtures/data/` too, giving 11 synthetic places. **Two lanes were set
  by hand**, and both are the argument for the change: the Azores
  (`places/lajes`) and the synthetic `fixture-place-o` are outside every lane
  polygon, so the override that used to sit on one event now sits on the place
  where the derivation happens. `panel.js` became
  `src/panel/{panel,event,place,actor,cluster}.js` — a shell that owns the
  container, the clicks and the load token, and one file per card — before the
  place card was added to it. The card is `?place=lisbon`: names, the point and
  its precision, the lane, everything that happened there in order with the
  window applied and the rest faded, and the actors who turn up there most.
  Card precedence is `selected` > `place` > `actor`. Places join the search
  (`search.js`, `search-box.js`), the map and the cluster heading name them,
  the form has a place record type and picks one on an event, and
  `new-record.mjs` gained `place` and `--new-place`, the one command that
  writes two files. **Two older bugs fixed in passing**: the topology handed to
  the contribution form never carried the atlas's `actors` (empty actor row
  since M4, and an event naming an existing actor failed rule 14 in the
  browser), and `schema/v1/bundle.json`'s `oneOf` never listed `actor.json`.

- **M8.** **The test dataset carried to 2025.** Twenty events from the exit
  from the adjustment programme (17 May 2014) to the legislative election of
  18 May 2025, eighteen edges, seventeen actors — six persons and eleven
  institutions: the parties, the two banks, the central bank, the ECB and the
  Commission — three places (Saint-Denis, Pedrógão Grande and a point standing
  for the central-Portugal fire belt) and nineteen sources. Every event points
  at a place and carries no coordinates of its own; every lane derived from
  the point, so **not one `region` override was needed**. Two of the new edges
  are `disputed` with dissenting citations: what produced the recovery of
  2015–2019 (the IMF's evaluation against the political-science accounts), and
  how the result of 2024 should be read (a verdict on November 2023, or the
  end of a cycle). **Nothing was verified against a source**: the run cannot
  reach the web, so there are no `web` records and no `accessed` dates, the
  seventeen official documents are `primary` with a repository and a described
  document rather than a shelfmark, and **every date of the batch is under
  "Dates to verify"**. Two events are left with **no edges at all** — the
  European Championship final and the Iberian blackout — and are the dataset's
  two `degree-zero` warnings; see deviation 60. Part 5 of the brief needed no
  code: M6's clamp is right, and `?to=2025` was verified to draw the 2019
  outlines under the marker "borders as of 2019, the latest the source
  covers".

- **M11.** **Relations between actors.** `schema/v1/relation.json` — the
  envelope with **sources required as for an edge**, `from` and `to` (actor
  ids), a `type` from a closed six, `when`, and an optional short `note`. The
  id is derived, `from--to--type`, which is an edge id's shape with another
  vocabulary in the third part, so **`RELATION_ID` sits beside `EDGE_ID`** and
  the schema, `rules.js`, `bundle-to-files.mjs` and `state.js` each pick the
  pattern by kind — in `state.js` the walked chain now refuses a relation id
  by name, and its edge pattern names the five types instead of matching any
  hyphenated word. **Rule 19** is what only the pair can say: two different
  actors, the actor types each relation type allows (the table in the brief's
  amendment, and now in `ARCHITECTURE.md`), a succession between two of a
  kind, and no cycle in `regime-of` or in `succeeded`, **each on its own**.
  Rules 2, 3, 6, 11, 12 and 15 reach the kind, an actor standing in a relation
  is no longer `actor-unused`, and a relation dated entirely outside either
  actor's own dates is the new warning `relation-outside-actor-when` (the
  dataset raises none). The topology carries relations whole, the `note`
  included, and `data.js` builds adjacency by actor with each relation listed
  from **both ends**. The **actor card** groups them by type and direction:
  Portugal's card says "Regimes" and lists four, the Estado Novo's says
  "Regime of Portugal, 1933–1974" and then what belonged to it, who led it and
  who it was allied with; `allied-with` is symmetric and is the one type whose
  two directions are one group. A relation citing a source is a citer on that
  source's card, drawn as its two actors with the type between them. The form
  has a relation record type, `new-record.mjs relation <from> <to> <type>`
  scaffolds one, and the fixtures gained three synthetic relations.
  **The dataset gained 28 relations**: the four regimes of `portugal`, the two
  successions the import map splits, three bodies inside a regime, twelve
  people and what they led, five party memberships and two alliances the
  events already describe. **Nothing was verified against a source**; see
  "Dates to verify".

### The CShapes import

Source: **CShapes 2.0** (Schvitz, Girardin, Rüegger, Weidmann, Cederman &
Gleditsch, *Mapping the International System, 1886-2019*, Journal of
Conflict Resolution 66(1), 2022, doi:10.1177/00220027211013563), licence
**CC BY-NC-SA 4.0**.

The ETH site (`https://icr.ethz.ch`) is **not reachable from the build
environment** — the session proxy answers 403 — and neither are the CRAN
mirrors. The same file ships in the CRAN package, whose GitHub mirror the
git proxy does serve:

```bash
git clone --depth 1 https://github.com/cran/cshapes
xz -dc cshapes/inst/extdata/cshapes_2_gw.topojson.xz > cshapes_2_gw.topojson
node tools/import/cshapes.mjs --source cshapes_2_gw.topojson
```

The decompressed file is 7.6 MB, sha256
`9f73468bb56aae6a6b22bb5e56bf5f3e013b9ee17c641aba37db97bcb5c1c3bc`, which
the tool verifies before it writes anything (`--check` refuses instead of
warning). It is **TopoJSON**, not GeoJSON: one object `cshapes_2_gw`, a
GeometryCollection of 710 geometries over 6,329 shared arcs, no
`transform`. All of that is recorded in `data/geo/LICENSE`.

What came out:

| | |
|---|---|
| entities | 254 actor records over 252 codes (2 codes are split in two; `republic-of-india` and `indonesia` are reused, not rewritten) |
| presences | 710, one per feature |
| geometry shards | 5 — 1886–1913, 1914–1932, 1933–1945, 1946–1974, 1975–2019 |
| geometry on disk | 4.5 MB total; largest shard 1.11 MB (1914–1932); the world of one year about 700 KB |
| presence records | 636 KB across 710 files |
| imported actor records | 303 KB across 250 files |
| `status` values found | `independent` 365, `colony` 219, `protectorate` 62, `occupied` 39, `mandate` 23, `N/A` 2 |
| validator | 0 errors, 0 warnings (the six were the colony/successor question, answered in M6) |
| could still be split | 89 codes, listed in `docs/cshapes-entities.md` |

Simplification is Douglas–Peucker at 0.1°, or a sixth of an arc's own
extent when that is less, then quantization to three decimals. It runs on
the topology's **arcs**, before any polygon is decoded, so a border two
countries share stays one line and they still meet along it.

### Portugal's territories, checked by hand against the events

The layer agrees with the dataset in two places and disagrees in two, and
three Portuguese territories are simply not in CShapes at all. **Nothing
was edited on either side**; this is the list the brief asks for.

Agreement:

- **Angola.** CShapes ends the colony 1975-11-10; `angola-independence-1975`
  is dated 1975-11-11. The colony's last day and the state's first.
- **East Timor's independence.** CShapes starts East Timor again
  2002-05-20; `east-timor-independence-2002` is 2002-05-20. Exact.

Disagreement. **Resolved in M6 the way the owner chose**: one sentence in
each event's summary saying what the outline shows and why the dates differ.
Neither outline was touched, and neither date was changed.

- **East Timor, 1975–1976.** CShapes keeps East Timor a Portuguese colony
  until **1976-07-16**, and gives it to Indonesia from 1976-07-17 — the
  date of formal Indonesian annexation. The dataset's
  `east-timor-invasion-1975` is **1975-12-07**, the invasion. So the map
  draws East Timor as Portuguese for seven months after the event that
  says it was invaded. Both dates are defensible and they answer different
  questions (who administered it, who held it); the record and the outline
  should probably say which.
- **Guinea-Bissau, 1973–1974.** CShapes ends the colony **1974-09-09**,
  which is the eve of Portuguese recognition. The dataset's
  `guinea-bissau-declares-independence-1973` is **1973-09-24**, the
  unilateral declaration. Almost a year apart, and the choice between them
  is exactly the kind of thing this project is supposed to show rather
  than flatten.

Absent from CShapes entirely, so the layer draws nothing for them:

- **Portuguese India (Goa, Damão, Diu).** No entity. `goa-annexed-1961`
  (1961-12-18) therefore has no territory that changes hands, and India's
  outline does not change in 1961 either.
- **Macau.** No entity. `macau-handover-1999` (1999-12-20) has no
  territory.
- **São Tomé and Príncipe.** No entity, and no event in the dataset
  either.

Not in the dataset as events, but on the map: **Cape Verde** independent
1975-07-05 and **Mozambique** 1975-06-25.

Verified in headless Chromium against the real dataset: `?year=1911`
draws 149 outlines with the colonial world visible and dependencies
distinguishable from independent states; `?year=1950` draws 172;
`?year=1960&actor=portugal` fills Portugal and its five remaining colonies
and the card lists all eleven it ever held; `?year=1990&actor=portugal`
fills only Portugal; `?layers=land,events` draws none and fetches no
shard; `?fixtures=1` draws the two synthetic ones. No console errors on
any page.

Verified in headless Chromium, against `?fixtures=1`: the atlas renders
(marks, lanes, bars, panel); the form derives an id from a title, lists the
bundle's own sources alongside the atlas's, blocks on a near-match until it
is acknowledged, fires the arrow of time and the consensus rule in the
browser, shows the dispute fields only for a disputed edge, and produces the
bundle JSON; the actor entry renders its fields and the event's actor row
lists the actors of the atlas and of the bundle by name.

Verified in headless Chromium against the **real** dataset, for the map
work, driving a real pointer through the DevTools protocol so the guards
are exercised rather than bypassed: at `k = 1` the map draws 13 marks, and
the Lisbon mark carries `+42` (43 events under it); one click zooms to
`k = 2.74` and the mark becomes the 39 records that really share the
point; a second click spreads those 39, each with its own mark, title and
leg; clicking a spread member selects it and the URL carries it
(`?year=2011&selected=sidonio-pais-coup-1917`); a drag that ends on a mark
leaves the URL empty and the panel on the intro, while a clean click on
the same mark opens it; zooming out of Lisbon separates Alvor, Porto,
Braga and the point on the Spanish border (13 marks become 19) and labels
appear; an event selected from the timeline is drawn as its own mark and
not swallowed by the stack; the panel's list of a stack is 43 focusable
buttons; `?fixtures=1`, `about.html` and `contribute.html` still render
with a clean console.

Verified in headless Chromium against the **real** dataset: the card for a
person (`?actor=salazar` — 14 events) and for an institution
(`?actor=pvde-pide-dgs` — 2 events, with the hedged roles), and an event
view with an actor selected (`?selected=carnation-revolution-1974&actor=salazar`):
six actors listed on the event, the notice, and 14 marks emphasised on the
map.

Verified in headless Chromium for **M6**, against the real dataset and
`?fixtures=1`, driving a real pointer and real keys through the DevTools
protocol — sixteen assertions, all passing:

- `?from=1960&to=1975` draws 8 marks (3 of them clusters) for the 21 events
  whose interval overlaps that window, and **not one mark from outside it**.
- `?from=1960&to=1975&actor=salazar` draws 20 marks of which 11 carry
  `faded`, and the set that carries it is **exactly** the set outside the
  window — checked mark by mark against the topology, not counted by eye.
- The band: dragging the near handle 60 px gives `?from=1954&to=1975`,
  dragging the far one gives `?from=1954&to=1970`, and an arrow key on the
  focused handle moves it one year. The URL follows each.
- `?year=1975` becomes `?to=1975` in the address bar at load.
- At full width the Europe lane's heaviest stack carries `+7`, and clicking
  it lists **8** buttons in the panel. The stacks go 12 → 4 → 1 as the window
  narrows to 1960–1980 and then 1974–1975.
- `/`, "sal", Enter yields `?actor=salazar` and opens his card.
- `?from=1910&to=1911` says "borders as of 1911" and draws 149 outlines; the
  clamp past the last shard is unreachable with this dataset (its events stop
  in 2011, inside CShapes's 1886–2019), so it was checked against the
  fixtures, whose outlines stop in 1299: `?fixtures=1&from=1300&to=1400` says
  "borders as of 1299, the latest the source covers", and
  `?fixtures=1&from=1000&to=1050` says there are none before 1100 and draws
  none.
- `about.html`, `contribute.html` and `?fixtures=1` still render, and there
  is no console error on any page (the only 404 is `/favicon.ico`, which
  nothing asks for).

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agents, all reversible, all listed under Deviations.

## Decided on 2026-09-03 (owner) — all four built in M6

- **Split colony and successor state.** `british-india` and
  `dutch-east-indies` become their own actors; the pre-independence
  presences move to them; `republic-of-india` and `indonesia` keep only
  what follows independence. The same treatment for any other CShapes
  entity whose status changes under one code.
- **The actor mapping of the import becomes data, not code**, so a
  contributor can correct a territory's actor by editing one JSON file
  through the ordinary contribution path, without touching `tools/`.
- **The two date disagreements are resolved by one sentence in each
  event's summary** (`east-timor-invasion-1975`,
  `guinea-bissau-declares-independence-1973`), saying what the outline
  shows and why the dates differ. The imported outlines stay as the source
  has them.
- **Builds run in the cloud only, after 18:00 Europe/Lisbon.**

The first three are built (see M6 above). The fourth is a working
arrangement, not a thing to build: `docs/run-protocol.md` is how the
overnight runs and the hourly shepherd keep off each other's toes on `m0`.

## Next

1. **Owner: create the PAT.** `contribution.yml` needs the repository secret
   `CONTRIBUTION_PAT`: a fine-grained personal access token on this
   repository with *Contents: read and write* and *Pull requests: read and
   write*. Without it the workflow stops at its first step with a message
   saying exactly that. Write its expiry date into `CONTRIBUTING.md`, where
   there is a line waiting for it. (A PAT and not `GITHUB_TOKEN` because a
   pull request opened with `GITHUB_TOKEN` starts no workflows, so the
   contribution PR would arrive with no CI: review finding 2.)
2. **Owner: two repository settings the agent could not set** — the session
   proxy refuses repository-settings writes and the Pages API path (403 from
   the proxy, not a permissions error). Both are one command each with your
   own `gh`:
   - `gh api -X PATCH repos/goncalojacob/atlas-causal -f delete_branch_on_merge=true`
   - **Pages**: Settings → Pages → Source: **GitHub Actions**. Must be done
     before the first merge to `main`, or `deploy.yml` fails at
     `configure-pages`. The repository is private and Pages on a private
     repository needs a paid plan, so this may have to wait until it is
     public — the agent did not change visibility.
   If branch protection is on, let `github-actions[bot]` push to `main`: the
   deploy job commits the regenerated index.
3. **Owner: review and merge PR #1**
   (https://github.com/goncalojacob/atlas-causal/pull/1).
4. **Owner: review the test dataset before anything is public.** Every
   date, coordinate, name, role, explanation and confidence was written by
   the assistant from memory. "Dates to verify" below lists what is least
   certain, and **every date of the 2014–2025 batch is in it**. The two
   book and article records carry a WorldCat search URL as their
   identifier, not an ISBN; the seventeen `primary` records name a
   repository and a class of document rather than a shelfmark, because the
   run could not open a page to get one; and every citation has
   `locator: null` —
   replace with ISBNs and page or chapter references, or retract the
   record. The assistant's `authors` entry stays until a person has
   reviewed the record and signs it. Read in this order: the
   twelve `disputed` edges (a wrong dispute is the worst failure this project
   can have), then the roles where responsibility is contested — Wiriyamu,
   the 1961 Luanda attacks, Cabral's killing — then the **relations of M11**,
   whose leadership dates are all from memory and whose five `member-of`
   intervals are not membership dates at all (deviation 73) — then the dates.
5. **Owner: write the first records** of the 1415→ period.
   `node tools/new-record.mjs event <id> --title … --start … --place <place id>`
   — or `--new-place <id> --label … --lon … --lat …`, which writes the place
   and the event together — and `edge`, `source`, `actor`, `place`,
   `relation`. Fill in
   the text, then `node tools/validate.mjs` and `node tools/build-index.mjs`;
   open `http://localhost:8000/`. Set `region` **on the place** when the
   derived lane is wrong for everywhere that happens there (strait cities,
   islands absent at 110m), and on the event only when that event belongs to
   another lane than the one it happened in.
6. **Owner: test one bundle end to end** once the PAT exists — open
   `contribute.html`, build a bundle, file the issue, apply `accepted`, and
   check that the pull request arrives with green CI. That is the M2
   acceptance criterion and the one thing the agent cannot do for you.
7. **Owner: look at the map and say whether the numbers are right.** Open
   `http://localhost:8000/`, click the mark on Lisbon twice — the first
   click zooms it down to the records that share the point, the second
   spreads them in rings — and say whether the merge distance, the ring
   and the labels are where you want them (see the fourth open question,
   and deviations 29–33 for why each is what it is).
8. **Owner: look at the territories layer and say whether it reads.** Open
   `http://localhost:8000/?year=1911`, then drag the slider to 1975 and
   watch Africa. Then `?actor=portugal`. The four numbers that decide how
   it looks are at the top of `tools/import/` — `TOLERANCE` (0.1) and
   `MIN_AREA` in `cshapes.mjs`, `MIN_DETAIL` (6) in `simplify.mjs`, and the
   five period cuts in `SHARDS`. Changing any of them means re-running the
   import, which is one command and reproducible.
9. **Owner: rename the three places whose ids came out mechanical** —
   `near-villanueva-del-fresno`, `tete-district` and `recife` — if you want
   them shorter, and add the variant names you know (`lisbon` has only
   "Lisbon"; "Lisboa" would make the search find it either way). Renaming is
   the file, its `id`, and the `place` on the events that point at it. See
   deviation 58.
10. **Owner: the `?year=1911` in item 8 is now `?from=1886&to=1911`.** The
   slider went in M6 and the timeline's band replaced it; a legacy `?year=X`
   link still opens, read as the window's far end. Item 8 reads the same
   either way.
11. **Not yet: publishing the templates.** `contribute.html` is deliberately
   not linked from the atlas or from `about.html`; both pages say
   contributions are not open. Opening them is the owner's call (see the
   first open question).

## Open questions

- **Answered in M6: a colony and the state that followed it are two
  actors.** The owner decided it on 3 September and M6 built it. Entity 750
  is `british-india` until 1947-08-15 and `republic-of-india` after it, 850
  is `dutch-east-indies` until 1945-08-17 and `indonesia` after it, and the
  six warnings are gone. What is still open is the *rest* of them: 89 more
  CShapes codes are given both as somebody's dependency and as their own
  state under one id, listed in `docs/cshapes-entities.md`. Splitting one is
  an entry in `data/imports/cshapes-actors.json` and a re-run of the import;
  which of them are two things and which are one is a historical judgement
  and the agent does not make it.
- **Answered in M11: "regime of state" is a relation, and the project has
  one now.** `data/relations/`, `schema/v1/relation.json` and rule 19: a
  dated, typed link between two actors, with six closed types and its own id
  pattern. `estado-novo--portugal--regime-of` is a record, and Portugal's card
  lists its four regimes. What is still open is the **vocabulary**: six types
  covered everything the test dataset implied, and the next period will say
  whether it needs a seventh. A missing type is to be reported here, never
  replaced by a generic one.
- **Two CShapes features carry `status: "N/A"`** — Morocco, 1904-01-02 to
  1904-10-02 and 1904-10-03 to 1912-11-26, both with `owner` equal to their
  own code. The import reads them as independent, which is what `owner`
  says; the dataset's documentation does not explain the value. Worth a
  look if Morocco ever matters to a record here.
- **Danzig and West New Guinea have a `dependencyKind` and no
  `dependencyOf`.** Their CShapes `owner` codes (0 and 1) name no entity in
  the file: the League of Nations and the United Nations. The map draws
  them as dependencies and the hover says "mandate of an administration
  that is not a state on this map". If international administrations should
  be actors, that is a decision, not an import.
- **The territories layer covers 1886–2019 and nothing else**, so the
  atlas's own period — 1415 to 1580 — has no territories at all. That is
  the honest state of it: there is no equivalent dataset for the fifteenth
  century, and `presenceType` keeps `polity`, `sphere-of-influence` and
  `archaeological-culture` unused for when diffuse zones are drawn by hand.
- **Does the role vocabulary close, and to what?** Roles on
  `actors[].role` are free text for now; the manifest lists the 62 in use
  across the test dataset, which is what a decision should be made from.
  Some are plainly general (`leader`, `target`, `signatory`,
  `belligerent`, `deposed`); some are one-offs written to hedge
  (`claimed responsibility`, `alleged accomplice`). A closed enum would
  make the panel groupable and search possible; it would also force the
  hedges out of the role and into the summary, which may be the right
  place for them. The agent did not decide this.
- When contributions open to strangers. `CONTEXT.md` argues: after the
  1580–1640 chain coheres and a few hundred of the owner's own records exist.
  Owner: "we'll decide later."
- Source records have no field for the container of a chapter or article
  (journal, edited volume). `locator` and the DOI cover locating it; the
  owner decides whether a `container` field is wanted before records exist.
- The Natural Earth `CONTINENT` attribute puts all of Russia in `europe`,
  Turkey and the Caucasus in `asia`, Greenland in `americas`. Overridable
  per record with `region`; acceptable for v1?
- Map semantics: the map shows events whose start is at or before the
  slider year; the timeline always shows everything. Is that the intended
  reading of "look at a map at a given moment"?
- **The map's four numbers are tuned to this dataset and are the owner's
  to judge by eye**, all at the top of their file: `MERGE_DISTANCE` (16)
  and `SPREAD_RADIUS`/`SPREAD_GAP` (46/24) in `src/map/cluster.js`,
  `LABEL_ZOOM` (4) and `LABEL_LIMIT` (12) in `layers/events.js`. Lowering
  the merge distance makes the badges smaller and the map busier; raising
  it makes one click cover more ground. Nothing else depends on them.
  See deviation 29 for why 16.
- Nearest-lane tolerance is 3° (`NEAREST_TOLERANCE` in `src/util/geo.js`).
  A point in the Strait of Gibraltar (Ceuta) derives by nearest and may land
  on `europe`; Azores and Madeira are absent from 110m Natural Earth. Such
  events need `region` set by hand; the validator says so when nothing is in
  reach, but not when the nearest guess is merely wrong — the owner should
  glance at `regionMethod: "nearest"` entries in the topology index.

## Deviations

Where `ARCHITECTURE.md` or a brief could not be built as written, the
closest thing that keeps the invariants was built. Each is one edit to
reverse. 1–12 are from M0/M1, 13–21 from M2/M3.

1. **Bibliographic authors of a source are `creators`.** The envelope's
   `authors[{name, github}]` is the record's contributors on every kind
   (principle 4, invariant 12, and the Action sets it from the issue
   opener), so the Source example's `"authors": ["Peter Russell"]` had no
   room. `creators: [string]` holds the authors of the work; rule 9
   compares those.
2. **Edge ids do not match the slug regex.** `from--to--type` contains
   `--`, which `^[a-z0-9]+(-[a-z0-9]+)*$` forbids. `schema/v1/edge.json`
   has its own pattern: three slugs joined by `--`, the third one of the
   five types. Still path-safe; rule 2 also checks the id equals
   `${from}--${to}--${type}`.
3. **`node --test tests/` is `node --test`.** Node 22 takes glob patterns,
   not a directory, and errors on `tests/`. The default patterns find
   `tests/*.test.mjs`. CI and `CLAUDE.md` use the bare form.
4. **Region derivation has a nearest-lane fallback.** Point-in-polygon
   first; if the point is in no polygon but within 3° of one, the nearest
   lane, recorded as `regionMethod: "nearest"` in the topology; beyond
   that, `validate.mjs` errors and `build-index.mjs` refuses to write until
   the record sets `region`. Without this, most port cities fail at 110m.
5. **Modules not in the tree:** `src/util/geo.js` (geometry, pure),
   `src/util/dom.js` (SVG/HTML element helpers shared by the views),
   `tools/lib/read.mjs` (every filesystem access of the tools, so
   `src/validate` stays free of `fs`).
6. **Schema files may carry `$schema`, `$id`, `title`, `description`.**
   Annotations without validation semantics, listed in `schema.js`.
   Everything else outside the fourteen keywords fails closed, tested.
7. **The topology index carries a little more than listed.** Events and
   edges also have `aliases` and `supersededBy` (the index is what resolves
   them) and events have `regionMethod`; the manifest also embeds
   `regions` and the `land` list. Text fields stay out.
8. **Rules slightly stricter than the list, in the list's spirit:** a
   `dispute` block on a non-disputed edge is an error (rule 8); an active
   record cannot cite a merged or retracted source (rule 11); `creators`
   must be non-empty (rule 13); "non-trivial" text is at least 40
   characters (`MIN_TEXT_LENGTH`).
9. **`data/geo/*.json` are compact JSON**, keys sorted, no indentation;
   the index files are indented. Pretty-printed coordinates tripled the
   size for no reader.
10. **`build-regions.mjs` downloads GeoJSON, not shapefiles.** The upstream
    repository publishes GeoJSON at the pinned tag v5.1.2, so no converter
    was needed. `--source <dir>` reads local copies when offline.
11. **Fixture mode borrows the real coastlines.** `tests/fixtures/data/`
    has square lane polygons but no land file; `main.js` passes
    `data/geo/land-present.json` as the land layer in `?fixtures=1` so the
    synthetic marks sit on a recognisable map. Everything else in fixture
    mode is synthetic and the header says so.
12. **`chain` in the URL is a list of edge ids**, not event ids: two events
    can be joined by up to five parallel edges of different types, and the
    panel must know which one was walked to show its confidence and
    dispute.
13. **`src/contribute/` has four files, not two.** `bundle.js` holds the
    pure half — the field list, bundle assembly, the duplicate search,
    `validateBundle` — so it is testable under `node --test`, as the brief
    asks; `main.js` is the page's bootstrap, because `tests/site.test.mjs`
    requires every module under `src/` except a `main.js` to import without
    a DOM. `form.js` and `submit.js` are as specified.
14. **`src/validate/schemas.js` lists the schema files.** The site never
    scans directories and has no build step, so the browser cannot discover
    `schema/` the way `tools/lib/read.mjs` does. `tests/schemas.test.mjs`
    asserts the list is exactly what is on disk, so a schema file added
    without touching the list fails CI rather than the form.
15. **The catalogue check is `tools/lookup-sources.mjs`, not inline YAML.**
    The brief puts the DOI/ISBN lookup in `contribution.yml`; as a tool it
    has tests for what it looks up and how it reports, and the workflow step
    stays two lines with `continue-on-error: true`.
16. **Near-matches must be acknowledged, not merely shown.** "Before
    allowing a new event it searches existing titles and aliases" is
    implemented as a blocking checkbox next to the near-matches, not as a
    refusal: a genuine near-match is sometimes a different event, and only
    the contributor can say. The submit control stays disabled until it is
    ticked.
17. **The bundle textarea is not `render:`-ed** in the issue templates.
    A rendered textarea is the one field URL prefill cannot be relied on
    for, and prefill is what makes the form-to-issue hop work.
    `bundle-to-files.mjs` accepts the JSON fenced, unfenced, or embedded in
    an issue-form body, with a brace-balanced scan that respects strings.
18. **An edge's `type` and `confidence` start unselected.** Defaulting
    `confidence` to the first value would make every edge start as
    `consensus`; an unselected required field says "required" instead.
    Review finding 13 is about exactly this drift.
19. **`loadAtlas({ landFile: false })`** loads no coastlines: the form needs
    the topology and nothing that is only drawn. One line in `data.js`.
20. **`contribution.yml` also runs `node --test`** before it pushes a
    branch. Not in the brief's step list; it is seconds, and it means a
    contribution PR is never opened from a tree whose tests fail.
21. **`delete_branch_on_merge` and Pages could not be set.** Both calls come
    back 403 from the session's API proxy — "Repository settings writes are
    not permitted through this proxy" and "Access to this GitHub API path is
    not permitted through this proxy" — which is the environment, not the
    token's permissions. Left for the owner, with the commands, under Next.

22–28 are from M4.

22. **An actor's `names` being non-empty is a rule, not a schema
    keyword.** The subset validator implements fourteen keywords and
    `minItems` is not one of them (adding it would widen the subset for
    one field). Rule 14 checks it instead, and `schema/v1/actor.json` says
    so in its description.
23. **Rule 14 is stricter than the brief in two places, in its spirit.**
    The same actor may appear twice in one event only under *different*
    roles — "deposed" and "signatory" are two facts, "leader" twice is a
    mistake — and an actor's `names` may not repeat a name. Both would
    otherwise pass silently and produce a duplicated line in the panel.
24. **`?actor=` is a second dimension, not an alternative to
    `?selected=`.** The brief says the URL carries the selected actor "the
    same way it carries a selected event"; carrying it *instead* would
    mean the highlight died the moment you opened one of the actor's
    events, which is the opposite of what the highlight is for. So both
    can be set: choosing an actor clears the selected event and the chain
    (as choosing an event already cleared the chain), choosing an event
    keeps the actor, and the panel shows the event when there is one and
    the card otherwise.
25. **The actor card lives in `panel.js`, not its own module.** It shares
    the citation rendering, the event links, the lane labels and the
    load-token discipline with the event view; splitting it would have
    meant threading five closures across a module boundary. `panel.js` is
    now ~390 lines and still has one job. The ~300-line rule in
    `CLAUDE.md` names `main.js` only, but this is the file to watch next.
26. **The form's actor search is a `<select>` of names, not a search
    box.** "Searches the loaded topology's actors (and the bundle's) by
    name" is implemented the way the form already picks events and
    sources: one control listing every active actor, and every actor in
    the bundle being written, by display name and type. A separate
    free-text search would be a second idiom in the same form.
27. **The topology's actor entries carry no `where`.** The brief lists the
    fields — `{ id, actorType, name, names, when, status, aliases,
    supersededBy }` — and `where` is not among them, so the panel fetches
    the record for the seat, as it already does for the summary and the
    sources. Actors are not drawn on the map, so nothing needs it before
    the card opens.
28. **Roles are stored as written and normalised only for comparison.**
    The brief says the validator "lowercases and trims"; doing that to the
    stored value would edit a contributor's record. Instead the
    normalisation (trim, lowercase, collapse inner spaces) is what rule 14
    compares duplicates on and what `build-index.mjs` collects for the
    manifest's `roles`, while the record keeps the text as filed.

29–34 are from the map usability work (`docs/map-brief.md`).

29. **The badge counts what is under the mark, not what shares its
    coordinates.** The brief expects "at k = 1 Lisbon shows one badge with
    37". It shows **+42** — 43 events — because at k = 1 the merge
    threshold also catches Belém and Parque das Nações (0.23 and 0.26 SVG
    units away), Alvor (6.1), the point on the Spanish border (7.3), Porto
    (9.1) and Braga (10.6). Making the badge say 37 would mean a merge
    distance under 0.23, which would leave every one of those drawn on top
    of the Lisbon stack with nothing to say so — the bug the brief exists
    to fix. So the badge answers "how many events are under this mark",
    which is the question the reader is asking, and the panel lists all 43
    on the first click. Reverse by lowering `MERGE_DISTANCE` in
    `cluster.js`.
30. **A click on the Lisbon mark at k = 1 zooms; the spread is the second
    click.** Follows from 29 and from the brief's own rule 4: that cluster
    *can* be split, so it is zoomed, and rule 4 says a splittable cluster
    zooms. One click takes it from 43 to the 39 that share the point, the
    second spreads those. Every one of the 43 is already reachable from
    the panel on the first click.
31. **`COINCIDENT_EPSILON` is derived, `MERGE_DISTANCE / DEEPEST_ZOOM`,
    and `MAX_ZOOM` now comes from `cluster.js`.** The brief says
    coincident means "within an epsilon that no zoom can separate", and
    that is only definable against the deepest zoom the map allows. A
    fixed small epsilon was tried first and was wrong on the real data:
    Belém and Parque das Nações are a fraction of a unit from the Lisbon
    stack, so they merged with it at every zoom while counting as
    separable, and the cluster could therefore never be spread — 39
    records permanently unreachable. `map.js` takes its `MAX_ZOOM` from
    `cluster.js` so the two cannot drift.
32. **A splittable cluster zooms to `coreZoom`, not by a fixed factor.**
    The brief says "multiply `k`". Multiplying peels off one neighbour per
    click — five clicks from the Lisbon blob to the stack. `coreZoom` is
    the zoom at which every member that *can* leave has left, so one click
    does it. The fixed multiplier survives as the fallback for a cluster
    that has nothing separable to shed.
33. **The cluster's mark sits on its representative's point, not on its
    centre.** The cluster reports `centre` (the mean of its members) and
    that is what the zoom aims at, but the mark is drawn on a real event's
    coordinates, so a cluster of two coastal cities is not a dot in the
    sea. Marks also went from `r = 4` to `r = 5`; the hit target is 10, as
    the brief asks.
34. **The brief's item 6 was two bugs, not one.** The `moved` flag dying
    before the click was real and is fixed as described. Underneath it,
    `setPointerCapture` on `pointerdown` retargeted `pointerup` — and with
    it the `click` — to the SVG root, so a click on a mark arrived with
    the mark nowhere in its event path and **nothing on the map had ever
    been selectable by clicking**. The capture is now taken on the first
    `pointermove` past the drag threshold: a click never captures, a pan
    still does.

35–45 are from M5 (`docs/m5-brief.md`).

35. **`common/interval.json` gains an optional `endDate`.** The brief says
    a presence's `when` carries "the exact dates the source gives"; the
    interval had one `date` field and CShapes dates both ends of every
    feature. `endDate` is additive, optional, in the same shape and
    calendar, and no existing record has one.
36. **`geometry` is `{ files, key }`, not one path.** The brief says "path
    under `data/geo/presences/` of the file that holds the outline, plus
    the feature key". It also says a feature is "duplicated into every
    shard its interval touches", and one path cannot name several files.
    So `files` is the list, sorted, and rule 17 checks every one of them
    exists, holds the key, and that between them they cover every year the
    presence claims — a stricter check than one path would have allowed.
37. **Five period shards, not the brief's four.** 1914–1945 in one piece
    came to 1.4 MB, and the interwar years hold the most entities. The cut
    is 1886–1913, 1914–1932, 1933–1945, 1946–1974, 1975–2019; the largest
    shard is now 1.11 MB. Cutting further does not help: 1914–1922 alone is
    still 1.0 MB, because the entities in it are large and span the window.
38. **Imported actors live in `data/actors/`, flat, not
    `data/actors/cshapes/`.** The brief offers the sub-directory as the
    cleaner option. It is not, here: the site derives a record's path from
    its id (`data/actors/<id>.json` in `data.js`), so a sub-directory would
    have meant a second path rule in `data.js` and `panel.js` and a record
    whose id no longer tells you where it is. The isolation the
    sub-directory was for is done instead by `IMPORT_AUTHORS` in rule 12: a
    CC-BY-NC-SA actor must name an import in its `authors`, and the list is
    one line per import. Tested both ways round.
39. **A `dependencyKind` may stand without a `dependencyOf`.** The rule was
    written as a pairing in both directions and the data broke it: Danzig's
    `owner` is 0 and West New Guinea's is 1, neither of which is an entity
    in the file, because both were international administrations. Dropping
    the kind would have lost a fact the source states; inventing an actor
    for the League of Nations would have invented a state. The other
    direction still holds — a dependency always says how it was held.
40. **Simplification is per-arc adaptive, not one tolerance.** A flat 0.1°
    band deleted **Malta, Bahrain and the Maldives** outright — countries
    smaller than the tolerance flatten into a line. Each arc is now
    simplified at 0.1° or a sixth of its own extent, whichever is less
    (`MIN_DETAIL` in `simplify.mjs`). It costs about a third more bytes
    across the world. The tool errors rather than writing a feature that
    lost every polygon, which is how the three were caught.
41. **Simplification runs on the topology's arcs, before decoding.** The
    brief expects GeoJSON ("GeoJSON parsing is JSON") and the file is
    TopoJSON, which stores every border once and every polygon as indices
    into it. Simplifying the arcs makes two countries' shared border one
    line that is simplified once; decoding first and simplifying the rings
    would have torn every shared border apart. `tools/import/topojson.mjs`
    is the fifty lines that needed, and it is tested.
42. **Dependencies are drawn with a tint, not a hatch.** The brief allows
    either. A hatch is an SVG `<pattern>`, and a pattern inside the map's
    zoomed viewport scales with the zoom, so the hatch would open up as the
    reader zooms in. The tint is the same token at a different opacity, and
    a `disputed` presence is **dashed**, which is already what a disputed
    edge looks like on this map — one idiom rather than two.
43. **The topology's presence entries carry a little more than the brief
    lists.** It names `{ id, actor, dependencyOf, when, presenceType,
    confidence, geometry }`; the entries also have `dependencyKind`,
    `capital`, `status`, `supersededBy` and `aliases`. Without `capital`
    the actor card would fetch twenty-four presence records to show
    twenty-four capitals; without `dependencyKind` the hover could not say
    "colony of". Same reasoning as deviation 7.
44. **One presence per actor is drawn in a year.** A border that moved in
    August leaves two presences of one actor sharing that year, because a
    year is the finest bound the model has (Angola has four such
    boundaries). Drawing both would put two nearly identical outlines on
    top of each other with an ambiguous hover, so `presencesAt()` draws the
    one that started later — the later state of affairs. Rule 17 allows the
    overlap; it only forbids the *same* outline twice.
45. **The import writes nothing at all rather than most of itself.** When
    any record it wants belongs to somebody else — a CShapes slug that
    collides with a hand-written actor — it reports and exits without
    touching the working tree, so a half-import never has to be unpicked.
    The fix for a collision is a line in `ACTOR_MAP`, never an overwrite.

`panel.js` was the file to watch (deviation 25) and M9 split it:
`src/panel/{panel,event,place,actor,cluster}.js`, a shell of about 200 lines
and one file per card, with everything shared — citations, the link to an
event, the lane's name, the load token — handed to the cards in one `ctx`
object. Every later card gets a file.

46– are from M6 (`docs/m6-brief.md`).

46. **Indonesia's split is 1945-08-17, not the brief's 1949-12-27.** The
    brief said to check CShapes's own date and use that if it differs. It
    differs: CShapes turns code 850 from `colony` to `independent` on
    1945-08-17, the proclamation, and 1949-12-27 is not a boundary the
    dataset draws at all — the two nearest are 1945-08-17 and 1949-12-29,
    the transfer of sovereignty being 1949-12-28/29 in the file. The
    amendment's rule (a split date must be the day after some feature's
    end) is enforced by the import, which names the boundaries it does
    have when it refuses one. Code 750 is 1947-08-15 as the brief said.
47. **An actor is reused only when the mapping file names it.** The brief
    says an entry's actor is "created by the import if it does not exist,
    reused if it does". Applied to every id the import derives from a
    country's name, that would silently attach imported territory to
    somebody's hand-written record the moment a slug happened to collide —
    which is the thing deviation 45 exists to stop. So the reuse is limited
    to ids the file names; a collision with an id nobody mapped still stops
    the whole import and asks for a decision.
48. **The report is 89 entities, not the brief's "99 or so".** Counted, not
    estimated: codes the file does not cut whose features are partly held by
    another entity and partly not. It is `docs/cshapes-entities.md`, per the
    amendment, with a pointer from here rather than the table itself.
49. **A renamed segment's summary quotes the source separately.** When the
    mapping file gives an actor its names, the import's summary says "the
    source calls it X; the names on this record are the ones the mapping
    file gives it" instead of the usual "it is called X, then Y over that
    time". The old sentence would have put the file's names in the
    dataset's mouth: CShapes calls entity 750 "India" throughout, colony and
    republic alike.
50. **Search's "widen to include" can narrow the window to one year.** The
    amendment defines it as the same action as "map at Y" — `to = Y;
    from = min(from, Y)` — and that is what was built. The consequence is
    worth seeing before it surprises anyone: choosing an event *earlier* than
    the window's near end moves both ends onto its year, so the window
    collapses to that one year rather than stretching back to reach it.
    Selecting the 1974 revolution from `?from=1990&to=2000` gives
    `?from=1974&to=1974`. Reversing it is one line in `windowAt`
    (`src/util/window.js`) and would change every "map at Y" with it, which
    is presumably why the amendment tied them together.
51. **The band does not zoom the lanes, so a stack splits by losing
    members.** Straight from the amendment ("the timeline does not zoom"):
    the scale stays on the whole extent, only the events inside the window
    stack with each other, and narrowing the band therefore takes members out
    of a stack rather than pulling the bars apart. It is why the counts go
    12 → 4 → 1 above. The events outside the band stack among themselves and
    are drawn faded, so a narrow window does not leave fifty overlapping
    grey bars in one lane.

52. **Ten disputed edges, not the brief's eight.** The amendment's numbers to
    assert say "73 `.edge` elements, 8 of them with a `disputed` class". The
    dataset has **ten** edges at `confidence: disputed`, counted from
    `data/index/`, and the graph draws ten dashed lines. The verification
    asserts ten; nothing was changed to make eight true.
53. **The map's transform handling was not factored into `src/viewport.js`.**
    The brief offers it as an option ("if you factor…"). The map's pan and
    zoom are entangled with cluster spreading and the animated zoom into a
    cluster, and pulling them out would have been a refactor of the map in a
    milestone about the graph. The graph view has its own forty lines of the
    same idiom, with the same pointer-capture and drag-guard comments
    pointing at deviation 34. Sharing them is still worth doing, and is one
    obvious cleanup for whoever next touches either file.
54. **The initial fit to the window is capped, and skipped for a wide one.**
    The amendment says the initial view fits the window. Filling the width
    with a two-year window would mean a zoom of ten, and since the zoom is
    uniform that would push the outer bands off the screen — and the bands
    are the frame the picture is read against. So the first drawing zooms to
    the window up to **2**, and not at all when the window is more than 60%
    of the data, where the right first view of the whole graph is the whole
    graph. `?from=1972&to=1976&view=graph` opens at 2; a plain `?view=graph`
    opens at 1.
55. **A click is resolved to the nearest node, not to the circle on top.**
    Two adjacent years are about eight units apart on this dataset, so a
    hit target of the map's size — or even a mark's own stroke — covered the
    neighbouring node's centre and made it unclickable at rest: the first
    attempt could select 25 November and then could not select the
    constitution eight units to its right. The graph view therefore has no
    hit circles at all. It reads the click into graph coordinates through the
    SVG's own matrix and picks the nearest node centre within reach, which is
    both simpler and exact. Marks were also brought down a little
    (heaviest 6.5, selected 7.5) so that nothing a node draws reaches its
    neighbour.
56. **In the graph view, clicking a consequence of the open event walks the
    chain.** On the map a click always selects afresh and clears the path.
    The brief's numbers to assert require "the walked chain after clicking
    two connected nodes", which cannot happen under the map's rule, and in a
    picture of the whole web following an arrow with the eye and clicking its
    head is the obvious gesture. So: if the clicked node is a direct
    consequence of the one already open, the step is appended to the chain —
    exactly what the panel's follow button does; otherwise the click selects
    and clears, as on the map. Said in `about.html`.

57–59 are from M9 (`docs/m9-brief.md`).

57. **A place's `sources` is a required key that may be empty.** The brief
    says "sources optional". Every record in this project carries the same
    envelope keys, and making one kind's optional would mean two shapes for
    the same envelope; so the key is required, the value may be `[]`, and it
    is rule 6 that exempts the kind — beside `source` and `region`, which is
    where the brief puts it. Reversing it is removing one name from a
    `required` list.
58. **The migration's ids are mechanical, and three of them want a person.**
    The amendment's rule — the slug of the label's first comma-separated
    segment — gives `near-villanueva-del-fresno`, `tete-district` and
    `recife` (from "Recife, at the end of the voyage"). All three are
    accurate and none is what a person would have typed. The tool prints the
    whole mapping for exactly this, and renaming a place is a file rename, an
    `id` and the `place` on the events that point at it.
59. **`new-record.mjs` can write two files.** `--new-place <id>` scaffolds the
    place and the event that happens at it in one command, because the
    alternative is asking for coordinates on an event that no longer has any.
    Nothing else in the tool writes more than one record, and `scaffold()` is
    still one record in, one out; `scaffoldAll()` is the pair.

60– are from M8 (`docs/m8-brief.md`).

60. **Two events are wired to nothing, against the brief's "at least one
    edge".** `euro-2016-final` and `iberian-blackout-2025` have no edge in
    either direction, and the validator says so twice under `degree-zero`.
    Neither could be given one without inventing the claim: no source in this
    bibliography argues a consequence for the final of a football match, and
    what caused the blackout was still being examined when the record was
    written. A `disputed` edge would not have helped — it asserts that a link
    exists and is argued about, which is a stronger claim than the evidence
    carries. Both summaries say plainly that the event stands alone and why.
    The brief's "Done when" asks for 0 errors and does not mention warnings,
    so the dataset still passes; reversing this is one edge each, the day
    somebody can cite one.
61. **No `web` sources, and seventeen `primary` records that name a class of
    document rather than a shelfmark.** Straight from the amendment: the run
    cannot open a page, so an `accessed` date would be a false statement in
    the one field that exists to say the page was seen. Rule 13 requires a
    `primary` record to carry both `repository` and `reference`, so the
    `reference` says what the document is and when it was issued — "official
    results, legislative election of 2025-05-18", "deliberation of the Board
    of Directors of 3 August 2014" — which is true and findable, rather than a
    number the run would have had to guess. The review's first job on these is
    to replace each with the real citation.
62. **One source record covers two government appointments.**
    `dre-government-appointments-2015-2024` stands behind both `geringonca-2015`
    and `montenegro-government-2024`, because the two decrees are the same kind
    of document in the same series and the run knows neither number. Splitting
    it in two is one file each once the numbers are known.
63. **`banco-de-portugal` is an actor and `banco-de-portugal-2014-bes-resolution`
    a source.** Ids are unique per record, not per prefix, and nothing in the
    tree derives one from the other; noted only because the pair reads like a
    collision and is not.
64. **The events of 2024 and 2025 are written short.** The brief asks for less
    text and more hedging on the recent end, and that is what is there: the
    summaries state what happened and stop, and the readings that would need a
    source — what the 2024 result meant, whether the blackout touched the
    campaign — are either in a `disputed` edge or left out.

65. **The bibliography is `sources.html`, not a section of `about.html`.**
    The brief allows either and says which decides it: thirty entries with
    their citation counts would swamp the prose on `about`, and the list only
    grows. `about.html` links to it, and the header of the atlas does too.
66. **The horizon is "open" when a year was chosen, not when the section
    is.** The brief's body lights the reachable set "while the horizon is
    open"; its amendment says the default year is never written to the URL.
    Both hold only if *open* means `horizon !== null` — a `<details>` element
    the reader unfolded is DOM state the map and the timeline cannot see, and
    writing the default year to make it visible is exactly what the amendment
    forbids. So the section is always on the event card, drawn folded with
    the window's far end filled in and its list inside; unfolding it costs
    nothing and lights nothing; typing a year lights the set on all three
    views. One edit to reverse: the `chosen` flag in `panel/horizon.js`.
67. **The sources index grew from 27 KB to 231 KB.** Carrying every citer of
    every source is what makes a source card and a bibliography cost no
    further request, and it is 3.5 KB → 17 KB gzipped against the topology's
    43 KB. It is dominated by the 710 presences citing one dataset record; if
    it ever matters, the fix is to summarise a kind that cites in bulk rather
    than to drop the field.
68. **A citer that is a tombstone is not counted.** `citationsBySource`
    skips records whose `status` is not `active`, so a retracted event's
    citation does not appear on the source card or in the bibliography's
    count. It matches the validator's own `no-citers` warning; the cost is
    that a source cited only by tombstones reads as cited by nothing, which
    is what the atlas draws.
69. **An edge citer opens as a walked step, not as a card.** An edge has no
    card of its own anywhere in the atlas, so a citation made by one is drawn
    as `from — type → to` and clicking it selects the far end with that edge
    as a one-step chain: the panel then names both ends and loads the
    argument, which is everything an edge card would have shown.
70. **A stack takes the horizon's band from its nearest member.** Forty
    events share a point in Lisbon; pulling every reachable one out of its
    cluster to light it would have put forty circles on one point. The stack
    is lit instead, at the band of the closest event under it, and a
    reachable event outside the window is drawn (rather than hidden by the
    band) but still allowed to join a stack.

71– are from M11 (`docs/m11-brief.md`).

71. **The graph view does not draw relations.** The brief allows the second
    layer "only if it stays readable — otherwise the card is enough. Record
    the choice." It is not drawn, and the reason is the view's own rule: x is
    the year. A relation has an interval, but the actors at its ends are not
    nodes there and putting them in would mean deciding where an actor sits
    on a scale of events. The card says it better, in both directions, with
    the dates and the note. Reversing this is a layer in `graph-view.js` and
    nothing in the data.
72. **The topology carries a relation's `note`.** Text stays out of the index
    everywhere else — an event's summary, an actor's summary — and this is the
    exception, for the same reason a presence carries its `capital`
    (deviation 43): a relation has no card of its own, so an actor's card
    would otherwise fetch one record per relation to show a line of text. The
    schema caps the note at 200 characters, and the card escapes it like
    everything else from `data/`.
73. **A `member-of` interval is the span the atlas's own records show, not a
    membership record.** Nobody in this run could find out when António Costa
    joined the Socialist Party. Rather than invent a year or leave the type
    unused, the five `member-of` relations start at the first year the atlas
    shows the person acting for the party and say so in the `note`; the end is
    open because nothing here says they left. Replacing them with real dates
    is one edit each.
74. **The two successions cite the CShapes dataset record.** The dates are the
    boundaries the import map draws inside codes 750 and 850, which is where
    they were decided in M6, and the only honest source for them is the
    dataset that draws them. A *citation* of `cshapes-2-0` is not a copy out
    of an NC record: nothing from a presence, an imported actor or an outline
    was carried into these CC BY-SA records, and rule 12 still holds on all
    of them.
75. **No relation was written for a type the dataset could not support.** All
    six types are used, but only where an event record or an actor record
    already said the thing: `led` where the dataset gives the role,
    `allied-with` only for the two alliances events describe (NATO in 1949,
    the EEC in 1986). Nothing was written for the MFA's leadership or for
    the Junta, where responsibility is exactly what historians argue about.

## Dates to verify

Everything below was written from memory and is where the owner's review
should look first. The record's own summary says so in the worst cases.

**Events, dates the assistant is least sure of:**

- `pimenta-de-castro-government-1915` — the appointment is given as
  January 1915; the day is not recorded.
- `monarchy-of-the-north-1919` — proclaimed 19 January, and given here as
  collapsing on 13 February. Both ends want checking, and so does whether
  the parallel Lisbon rising belongs in the same record.
- `legiao-portuguesa-founded-1936` — 30 September 1936, from the founding
  decree; check the Diário do Governo.
- `exposicao-mundo-portugues-1940` — 23 June to 2 December 1940.
- `constitutional-revision-1959` — August 1959; the month is a guess and
  the number of the law is not recorded here at all.
- `santa-maria-hijacking-1961` — 22 January to 2 February 1961.
- `botelho-moniz-coup-attempt-1961` — 13 April 1961.
- `delgado-assassinated-1965` — 13 February 1965 is the killing; the
  bodies were found in April. Check which date the sources use.
- `wiriyamu-massacre-1972` — 16 December 1972.
- `imf-agreement-1978` — May 1978.
- `imf-agreement-1983` — September 1983.
- `constitutional-revision-1982` — 30 September 1982.
- `soares-elected-president-1986` — 16 February 1986 (second round).
- `cavaco-absolute-majority-1987` — 19 July 1987.
- `expo-98` — 22 May to 30 September 1998.
- `bpn-nationalisation-2008` — 2 November 2008.

**The whole 2014–2025 batch, every date of it.** Nothing in M8 was checked
against a source: the run could not reach one. The dates as filed are:

- `troika-programme-ends-2014` 2014-05-17 · `bes-resolution-2014` 2014-08-03 ·
  `legislative-election-2015` 2015-10-04 · `geringonca-2015` 2015-11-26 ·
  `marcelo-elected-president-2016` 2016-01-24 · `euro-2016-final` 2016-07-10.
- `pedrogao-grande-fires-2017` 2017-06-17 to 2017-06-24 (the end date is the
  least certain of the two, and so is the figure of 66 dead) ·
  `october-fires-2017` 2017-10-15 to 2017-10-16 ("about forty-five" dead is a
  memory, not a count).
- `legislative-election-2019` 2019-10-06 · `covid-state-of-emergency-2020`
  2020-03-18 to 2020-05-02 (both ends, and the claim that it was the first
  under the 1976 constitution) · `marcelo-reelected-2021` 2021-01-24 (and
  "turnout below forty per cent") · `legislative-election-2022` 2022-01-30.
- `world-youth-day-2023` 2023-08-01 to 2023-08-06 (and the 2019 designation
  date in the source record) · `costa-resigns-2023` 2023-11-07 (and what the
  communiqué actually said, which the summary hedges) ·
  `legislative-election-2024` 2024-03-10 (and "about two seats", and Chega's
  twelve to fifty) · `montenegro-government-2024` 2024-04-02 ·
  `fiftieth-anniversary-25-april-2024` 2024-04-25.
- `government-falls-2025` 2025-03-11 · `iberian-blackout-2025` 2025-04-28 (and
  "around midday") · `legislative-election-2025` 2025-05-18 (and that the
  emigrant circles settled second place).

**The 2014–2025 actors**, founding and birth years all from memory:
`antonio-costa` 1961, `pedro-passos-coelho` 1964, `marcelo-rebelo-de-sousa`
1948, `luis-montenegro` 1973, `andre-ventura` 1983, `ricardo-salgado` 1944;
`partido-socialista` 1973, `psd` 1974, `cds-pp` 1974, `pcp` 1921,
`bloco-de-esquerda` 1999, `chega` 2019, `banco-espirito-santo` 1869–2014,
`novo-banco` 2014, `banco-de-portugal` 1846, `european-central-bank` 1998,
`european-commission` 1958. Only two carry a birthplace (Lisbon, for Costa and
for Rebelo de Sousa); the other four persons have `where: null` rather than a
guess. The three new places' coordinates are approximate, and
`central-portugal` is a point invented to stand for a burned belt that no town
names.

**The sources of the batch.** Two are works — the IMF's ex post evaluation of
the 2011 programme (2016) and Costa Pinto and Pequito Teixeira's *Political
Institutions and Democracy in Portugal* (2019); the exact titles, subtitles and
years want checking, and neither has an ISBN or a DOI in the record. The other
seventeen are official documents cited by repository and description, with no
number: see deviation 61.

**The relations of M11, every date of them.** The four `regime-of` intervals
and the three `part-of` ones follow the actor records they join, so they are
only as good as those. The rest were written from memory and are listed here
in full: `salazar` led the Estado Novo **1932–1968**; `marcelo-caetano`
**1968–1974**; `amilcar-cabral` led the PAIGC **1956–1973**;
`eduardo-mondlane` FRELIMO **1962–1969**; `mario-soares` the PS **1973–1986**;
`alvaro-cunhal` the PCP **1961–1992**; `cavaco-silva` the PSD **1985–1995**;
`marcelo-rebelo-de-sousa` **1996–1999**; `pedro-passos-coelho`
**2010–2018**; `antonio-costa` the PS **2014–2024**; `luis-montenegro` the PSD
**2022–**; `andre-ventura` Chega **2019–**. The five `member-of` intervals are
not membership dates at all (deviation 73). The two alliances are
`estado-novo`–NATO **1949–1974** and `third-portuguese-republic`–EEC
**1986–1993**, the second ending where the EEC actor record does.

**Actors, dates and places:**

- Birth and death years for `gomes-da-costa` (1863–1929),
  `paiva-couceiro` (1861–1944) and `pimenta-de-castro` (1846–1918) are the
  least certain of the twenty persons. Their `where` is deliberately
  `null`: the assistant would have been guessing.
- Founding years of the movements: `paigc` 1956 (founded under another
  name and renamed — check which year the record should carry), `mpla`
  1956, `fnla` 1962, `unita` 1966, `fretilin` 1974 (formed as ASDT and
  renamed the same year), `frelimo` 1962.
- `armed-forces-movement` is given 1973–1975 and
  `council-of-the-revolution` 1975–1982; both are conventions rather than
  dates in a document.
- `frelimo`'s seat is given as Maputo, though it was founded in Dar es
  Salaam; `eduardo-mondlane`'s birthplace is a point in Gaza province at
  `region` precision, not a village.
- `european-economic-community` is closed at 1993 (Maastricht). Whether
  the record should instead be open and renamed is an editorial choice.

Verified in headless Chromium for **M11**, against the real dataset, the
fixtures and the form — every assertion passing:

- `?actor=portugal` opens the card with **Relations 4**, one group headed
  **Regimes**, and the four regimes in order with their dates and notes:
  First Republic 1910–1926, Military Dictatorship 1926–1933, Estado Novo
  1933–1974, Third Republic 1974–ongoing. Each is a link.
- `?actor=salazar` shows **Led — Estado Novo, 1932–1968**, with the note that
  says why it starts a year before the regime does.
- Clicking the Estado Novo from Portugal's card gives `?actor=estado-novo`,
  whose relations read **Regime of · Parts of it · Led by · Allied with** —
  the same records, from the other end.
- `?actor=british-india` says **Succeeded by** and `?actor=indonesia`
  **Successor of**, which is the same pair of records read both ways.
- `contribute.html?fixtures=1` → **Add relation** gives the six fields (From,
  To, Type, Start year, End year, Note), the type list is exactly the closed
  six, and filling it in produces
  `fixture-actor-one--fixture-actor-two--member-of` in the bundle preview with
  no error on the entry.
- No console error on the atlas, `?fixtures=1`, `about.html`,
  `contribute.html` or `sources.html`.

Verified in headless Chromium for **M7**, against the real dataset and
`?fixtures=1`, driving real pointer, wheel and drag events through the
DevTools protocol — twenty-five assertions, all passing:

- `?view=graph` draws **60** `.node` and **73** `.edge` elements, each edge
  with its own arrowhead, **10** of them dashed as disputed, in **five**
  bands, with the map hidden and the Graph button pressed.
- The five types come out with five distinct line signatures (dash pattern
  and weight), read off `getComputedStyle`, not off the source.
- Sorting the nodes by their x sorts them by year, and every node sits in the
  band of its region — checked node by node against the topology.
- `?from=1960&to=1975&view=graph` fades **39** of the 60, and the set that
  carries `faded` is **exactly** the set outside the window; the window band
  is drawn.
- Clicking 25 November selects it and the panel opens it; clicking the
  constitution, which it leads to, appends the step —
  `?view=graph&selected=constitution-1976&chain=25-november-1975--constitution-1976--enabled`
  — and the chain is madder in the graph; switching to the map with the
  toggle shows the same chain madder there, and the URL drops `view=`.
- `?view=graph&selected=25-november-1975` highlights **16** converging nodes
  and 16 converging edges, the same 16 the panel's convergence section counts;
  25 April (`carnation-revolution-1974`) highlights **11**, likewise matching
  the panel.
- `/`-less search from the graph view: "sal" and Enter gives
  `?view=graph&actor=salazar` and emphasises his **14** events.
- A plain `?view=graph` opens unzoomed; `?from=1972&to=1976&view=graph` opens
  at zoom 2. Zoomed out, 14 labels; wheeled to 2.1, all **12** nodes on
  screen are named. A drag pans and does not select the node it ends on.
- `?fixtures=1&view=graph` draws the synthetic graph's 11 active events and 9
  active edges (one event is a tombstone and one edge retracted).
- No console error on the atlas, `about.html`, `contribute.html` or the
  fixture graph (the only 404 is `/favicon.ico`, which nothing asks for).

Verified in headless Chromium for **M10**, against the real dataset and
`?fixtures=1`, driving real clicks and typing through the DevTools protocol —
thirty assertions, all passing:

- Clicking the title in a citation on 25 April opens
  `?source=maxwell-1995-making-of-portuguese-democracy`, whose card lists
  **37 citers** — 12 events, 17 links, 8 actors — which is exactly the
  `citationCount` the sources index carries for it. Every one of the
  thirty-one sources was checked the same way in `node --test`.
- A dissenting citation is marked as one: `cne-legislative-2024` draws its
  7 citers with one **dissenting** badge, the citation an edge made from its
  `dispute.sources`.
- The precedence holds: `?source=…&actor=salazar` shows the source and keeps
  the actor in the URL; `?selected=…&source=…` shows the event and keeps the
  source; an unknown source says "Not found".
- `sources.html` lists **31 entries**, "31 sources, 31 of them cited, carrying
  1366 citations between them", and a title opens that source in the atlas.
  `sources.html?fixtures=1` lists the fixtures' 4.
- `?selected=carnation-revolution-1974&horizon=2011` opens the horizon folded
  out, lists **23** events, and lights **9 marks** on the map and **11 bars**
  on the timeline (the rest are inside stacks, lit at their nearest member's
  band: 5 near, 3 mid, 3 far) and **23 nodes** in the graph view.
- Choosing the constitution walks the three-step path to it — the URL carries
  the chain, the panel draws 4 steps and then **14** other branches into that
  endpoint, which is convergence asked from the other direction.
- The default horizon is folded, filled in with **2025**, and lights nothing.
  Typing 1976 writes `?horizon=1976` and narrows the list to 11; "back to the
  window's end" removes the parameter again.
- Searching "telo" offers a **Sources** group above an **Actors** one and
  opens `?source=telo-2007-historia-contemporanea`.
- `?fixtures=1`, `about.html` and `contribute.html` still render, and there is
  no console error on any page (the only 404 is `/favicon.ico`, which nothing
  asks for).

Verified in headless Chromium for **M9**, against the real dataset and
`?fixtures=1`, driving real clicks and keys through the DevTools protocol —
twenty-five assertions, all passing:

- The map is unchanged to the eye: **13 marks** at `k = 1` and the Lisbon mark
  still carries **+42**, exactly as before the migration.
- `?place=lisbon` opens the card and lists **37 events**, with the actors who
  turn up there most. `?place=lisbon&from=1960&to=1975` keeps all 37 in the
  list and fades the ones outside the window rather than hiding them.
- The place is reached three ways: the place name on an open event
  (`?selected=carnation-revolution-1974` → "Lisbon" → `?place=lisbon`), the
  heading of a stack of marks on the map, and the search ("lisbo" offers a
  **Places** group; Enter opens the card).
- The precedence holds: `?place=lisbon&actor=salazar` shows the place,
  `?place=lisbon&selected=…` shows the event and keeps `place=` in the URL, and
  an unknown place says "Not found".
- The graph view still draws its 60 nodes; `?fixtures=1` still draws; the form
  offers every place in the atlas on an event and can add a new one.
- No console error on any page (the only 404 is `/favicon.ico`, which nothing
  asks for).

Verified in headless Chromium for **M8**, against the real dataset, the
fixtures and the three static pages — sixteen assertions, all passing:

- `?to=2025` draws **181 outlines** and says "borders as of 2019, the latest
  the source covers"; `?to=2019` draws the same 181. The clamp M6 built is
  right, and this is the first time the dataset could reach past the last
  shard to prove it. Part 5 of the brief needed no code.
- The timeline reaches 2025: the window handle's `aria-valuemax` is 2025.
- `?from=2014&to=2025` draws **two marks**, one of them a Lisbon cluster
  carrying `+18`, and nothing else — exactly the twenty new events, nineteen
  of them within merge distance of Lisbon and the twentieth at Saint-Denis.
- The graph view draws **80 nodes and 91 edges**, **12** of them dashed as
  disputed.
- `?selected=government-falls-2025` opens the confidence vote in the panel,
  `?place=saint-denis` opens the new place (48.94, 2.36, city, Europe), and
  `?actor=chega` opens a party added in this batch.
- `about.html`, `contribute.html` and `?fixtures=1` still render, and there is
  no console error on any page (the only 404 is `/favicon.ico`, which nothing
  asks for).

## Where things live

- Repo: `~/atlas-causal`, branch `m0`.
- Pull request #1: https://github.com/goncalojacob/atlas-causal/pull/1 — its
  body is about **54 KB** against GitHub's 64 KB limit. Each milestone that
  adds a section pays for it by cutting an older one to a summary that points
  here: M8 cut M5's, M11 cut M7's. There is room for roughly one more section
  before the next run has to cut again — M6's and M5's summaries are the
  shortest, so M9's or M10's is the one to cut next.
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).
- Build briefs: `docs/m0-brief.md`, `docs/m2-brief.md`, `docs/m4-brief.md`,
  `docs/map-brief.md`, `docs/m5-brief.md`, `docs/m6-brief.md` and the M7–M13
  briefs beside them; the adversarial review is `docs/review-2026-09-01.md`
  and the plan review `docs/review-2026-09-03-plan.md`. The run protocol the
  overnight runs follow is `docs/run-protocol.md`.
- **Which CShapes entities could be split into a colony and a successor
  state**: `docs/cshapes-entities.md`, 89 of them, generated by
  `node tools/import/cshapes.mjs --source <file> --report`. Splitting one is
  an entry in `data/imports/cshapes-actors.json` and a re-run of the import;
  never a hand-edited presence.
- The CShapes source file is **not in the repository** (7.6 MB, and not
  ours to redistribute). `data/geo/LICENSE` and the header of
  `tools/import/cshapes.mjs` say exactly where it came from and what its
  sha256 is; the tool refuses a file that is not that one.

## Uncommitted

Nothing.

## Milestones landed

M6 started 2026-09-03T17:06:55Z by scheduled
M6 done

M7 started 2026-09-03T18:20:47Z by shepherd
M7 done

M9 started 2026-09-03T19:20:45Z by shepherd
M9 done

M8 started 2026-09-03T20:22:00Z by shepherd
M8 done

M10 started 2026-09-03T21:21:00Z by shepherd
M10 done

M11 started 2026-09-03T22:21:09Z by shepherd
M11 done

# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-02, after M5 (`docs/m5-brief.md`): the `presence` kind, the
CShapes 2.0 import, and the territories layer on the map.

## Phase

**M0 to M5 built, plus the map usability work, on branch `m0`, pull
request #1 open against `main`.** `ARCHITECTURE.md` **revision 6** is the
specification; its opening note says what changed and why (revision 4
added the `actor` kind; revision 5 added `map/cluster.js`, `weight` in the
index and `prominence` as a reserved override; revision 6 added the
`presence` kind, the CC BY-NC-SA licence and its one exception, and moved
the last four reserved names in the tree into use). The M5 brief asks for
revision 5; the map work had already taken that number.

`data/` holds a **test dataset, 20th–21st century Portugal** — **60
events, 73 edges, 42 actors, 11 sources**, 1910 → 2011 — drafted by the
assistant on 2026-09-02 at the owner's request as an exception to the
"written by a person" rule (recorded in `CLAUDE.md`). Every record says so
in `authors`. It validates with **0 errors and 0 warnings**, the index is
built, and the atlas renders it at `http://localhost:8000/` without
`?fixtures=1`. Eight edges are `disputed` with dissenting citations; two
lanes derive by `nearest` (Goa, Macau — both correct); four events use a
`region` override (the Azores, Recife, the Spanish border, Lisbon for the
Spanish war). Every page still serves from `python3 -m http.server 8000`.

**Nothing in it has been read by a person.** See item 4 under Next, and
"Dates to verify" below.

`data/` also holds **710 presences and 250 imported polity actors**,
1886–2019, from **CShapes 2.0** — an import, not writing, under
**CC BY-NC-SA 4.0**, which `data/LICENSE` does not cover. See "The CShapes
import" below.

What exists and passes (`node tools/validate.mjs --index`, `node --test`:
177 tests):

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
  arrived in M4). Disputed edges
  dashed on the map and marked in the panel.
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
  override. `src/map/cluster.js`, pure and tested: which marks overlap at
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
| entities | 252 (250 new actors; India → `republic-of-india` and Indonesia → `indonesia` reuse existing records) |
| presences | 710, one per feature |
| geometry shards | 5 — 1886–1913, 1914–1932, 1933–1945, 1946–1974, 1975–2019 |
| geometry on disk | 4.5 MB total; largest shard 1.11 MB (1914–1932); the world of one year about 700 KB |
| presence records | 636 KB across 710 files |
| imported actor records | 303 KB across 250 files |
| `status` values found | `independent` 365, `colony` 219, `protectorate` 62, `occupied` 39, `mandate` 23, `N/A` 2 |
| validator | 0 errors, 6 warnings (all one thing — see the open questions) |

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

Disagreement, for the owner to resolve:

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

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agents, all reversible, all listed under Deviations.

## Decided on 2026-09-03 (owner), not yet built

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
   certain. The eleven source records carry a WorldCat search URL as their
   identifier, not an ISBN, and every citation has `locator: null` —
   replace with ISBNs and page or chapter references, or retract the
   record. The assistant's `authors` entry stays until a person has
   reviewed the record and signs it. Read in this order: the eight
   `disputed` edges (a wrong dispute is the worst failure this project can
   have), then the roles where responsibility is contested — Wiriyamu,
   the 1961 Luanda attacks, Cabral's killing — then the dates.
5. **Owner: write the first records** of the 1415→ period. `node tools/new-record.mjs event <id>
   --title … --start … --lon … --lat … --label …` (and `edge`, `source`,
   `actor`), fill in the text, then `node tools/validate.mjs` and
   `node tools/build-index.mjs`; open `http://localhost:8000/`. Use `region`
   on the record whenever the derived lane is wrong (strait cities, islands
   absent at 110m).
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
8. **Owner: the two date disagreements in "Portugal's territories" above.**
   East Timor 1975-12-07 against CShapes's 1976-07-16, and Guinea-Bissau
   1973-09-24 against CShapes's 1974-09-09. Neither side was edited. Decide
   what the atlas should say and where — probably in the event's summary,
   since the outline is an import and should stay as the source has it.
9. **Owner: look at the territories layer and say whether it reads.** Open
   `http://localhost:8000/?year=1911`, then drag the slider to 1975 and
   watch Africa. Then `?actor=portugal`. The four numbers that decide how
   it looks are at the top of `tools/import/` — `TOLERANCE` (0.1) and
   `MIN_AREA` in `cshapes.mjs`, `MIN_DETAIL` (6) in `simplify.mjs`, and the
   five period cuts in `SHARDS`. Changing any of them means re-running the
   import, which is one command and reproducible.
10. **Not yet: publishing the templates.** `contribute.html` is deliberately
   not linked from the atlas or from `about.html`; both pages say
   contributions are not open. Opening them is the owner's call (see the
   first open question).

## Open questions

- **Is a colony and the state that followed it one actor or two?** The
  six validator warnings are all this: CShapes entity 750 is British India
  *and* the Republic of India, and 850 is the Dutch East Indies *and*
  Indonesia. The brief said to map both onto the actors the dataset already
  has, so the pre-independence presences now hang off `republic-of-india`
  and `indonesia` and fall outside those actors' dates — which the
  validator says, as a warning, six times. Splitting them into
  `british-india` and `dutch-east-indies` would be truer and would cost two
  lines in `ACTOR_MAP`; it would also mean the atlas has two records for
  what a reader may think of as one country. The agent did not decide this.
- **"Regime of state" is a relation this project does not have.**
  `portugal` is a state actor created by the import; `first-portuguese-republic`,
  `estado-novo` and `third-portuguese-republic` are regimes *of* that state,
  written by hand. Nothing links them, on purpose: the honest link is an
  edge between actors, and edges in this model run between events only.
  That is a real extension — a second edge kind, or an `actorEdges` file —
  and faking it now (an alias, a `names` entry, a shared id) would put a
  claim in the data that no schema checks. Left undone and named here.
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

`panel.js` is now about 470 lines and is still the file to watch
(deviation 25). The actor card gained the territory section rather than a
module of its own for the same reason it had no module of its own before:
it shares the citation rendering, the event links and the load-token
discipline with the event view.

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

## Where things live

- Repo: `~/atlas-causal`, branch `m0`.
- Pull request #1: https://github.com/goncalojacob/atlas-causal/pull/1
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).
- Build briefs: `docs/m0-brief.md`, `docs/m2-brief.md`, `docs/m4-brief.md`,
  `docs/map-brief.md`, `docs/m5-brief.md`; the adversarial review is
  `docs/review-2026-09-01.md`.
- The CShapes source file is **not in the repository** (7.6 MB, and not
  ours to redistribute). `data/geo/LICENSE` and the header of
  `tools/import/cshapes.mjs` say exactly where it came from and what its
  sha256 is; the tool refuses a file that is not that one.

## Uncommitted

Nothing.

# Build brief — M5: territories over time, from CShapes 2.0

Written 2 September 2026. Read, completely and in this order, before
creating any file: `CLAUDE.md`, `STATUS.md` (all deviations), `ARCHITECTURE.md`
(revision 4 — you write revision 5), `CONTEXT.md` (especially "No borders,
only coastlines, for now" and why), `docs/m2-brief.md` (rules of
engagement), `docs/map-brief.md` (the map work that landed just before
this; build on it, do not undo it), then this file.

Rules of engagement as in `docs/m4-brief.md`: branch `m0`, small English
commits, **push after every commit**, validator and tests green at every
commit, deviations recorded in `STATUS.md` numbered on from the last one,
no new hex values outside `src/style.css`, no dependencies in the browser,
no build step for the site, no map library, nothing merged, no repository
settings changed, no historical record of the test dataset touched except
where this brief says so.

## The decision this implements

The owner chose **CShapes 2.0** (Schvitz, Girardin, Rüegger, Weidmann,
Cederman, Gleditsch — *Journal of Conflict Resolution*, 2022; data at
https://icr.ethz.ch/data/cshapes/) as the first geometry source: borders
and capitals of independent states **and dependencies** from 1886 to
2019, with the dates of every change. Its licence is **CC BY-NC-SA 4.0**,
which is incompatible with the project's CC BY-SA 4.0 data licence. The
architecture already isolates imported geometry for exactly this reason:
everything derived from CShapes lives under its own licence, in its own
directories, attributed in the interface, and is never merged into a
CC BY-SA record. If the ETH site cannot be reached from your environment,
the CRAN package `cshapes` ships the same data; use whatever copy you can
verify is version 2.0, record where it came from, and stop rather than
substitute another dataset.

Fields in the data (from the package reference): `cntry_name`, `gwcode`
(Gleditsch–Ward code), `start`, `end` (dates of territorial validity),
`status` (independent or dependency), `owner` (sovereign of a dependency),
`capname`, `caplong`, `caplat`, `b_def`, `fid`. Inspect the file and record
the exact values you find for `status`.

## Part 1 — the `presence` kind

`schema/v1/presence.json`: the envelope (so a presence cites a source —
here the dataset record), plus:

- `actor`: id of an actor record; must resolve.
- `presenceType`: `state | polity | sphere-of-influence |
  archaeological-culture` (from `ARCHITECTURE.md`). CShapes entities are
  all `state`.
- `dependencyOf`: `null` or an actor id — the sovereign, from `owner`.
  New field; add it to `ARCHITECTURE.md`.
- `when`: `common/interval.json`, years from `start`/`end`, with `date`
  carrying the exact dates the source gives.
- `geometry`: path under `data/geo/presences/` of the file that holds the
  outline, plus the feature key inside it.
- `capital`: `null` or a `common/place.json` from `capname`/`caplong`/
  `caplat`.
- `confidence`: as edges — `consensus` for CShapes state borders in this
  period; the field exists so hand-made presences can say `disputed`.

**Licence.** Add `CC-BY-NC-SA-4.0` to the licence enum in
`schema/common/provenance.json`. Validator: records under
`data/presences/` may carry it; records under `data/events|edges|sources|
actors` may not, **except** actor records the import creates (see Part
2), which live in `data/actors/` but carry the NC-SA licence and an
`authors` entry naming the import — document this exception, or put
imported actors in `data/actors/cshapes/` if you judge a sub-directory
cleaner (record the choice as a deviation either way). `data/geo/LICENSE`
gains a CShapes section: licence, attribution, citation, and the sentence
that this layer is not covered by `data/LICENSE`.

**Rules**: `actor` and `dependencyOf` resolve to active actors; `geometry`
file and key exist; interval rules; a presence's interval within its
actor's `when` is a warning when violated; two presences of one actor may
not overlap in time unless their geometry differs (CShapes has exactly one
feature per entity per interval; assert it).

## Part 2 — the import tool

`tools/import/cshapes.mjs`, offline, zero dependencies (write what you
need: GeoJSON parsing is JSON; simplification is a hundred lines):

1. Download or read (`--source <file>`) CShapes 2.0 as GeoJSON. Record the
   URL, version and SHA-256 of the file you used in `data/geo/LICENSE` and
   in the dataset source record.
2. **Source record** `data/sources/cshapes-2-0.json`: type `dataset`,
   creators the six authors, title, year 2022, url, and the article DOI
   `10.1177/00220027211013563` as identifier.
3. **Actors.** One `polity` actor per distinct CShapes entity (by
   `gwcode`, with `cntry_name` and its variants over time in `names`,
   `when` from the earliest `start` to the latest `end` or `null` if it
   reaches 2019, `where` the last capital, sources = the dataset).
   A small mapping table in the tool links CShapes entities to actors
   the test dataset already has, so they are reused and not duplicated:
   at least India → `republic-of-india`, Indonesia → `indonesia`. Do
   **not** map Portugal to the regime polities (`first-portuguese-republic`,
   `estado-novo`, `third-portuguese-republic`) — those are regimes; create
   a `portugal` state actor, and note in `STATUS.md` that the relation
   "regime of state" is a future edge type on actors, not something to
   fake now. Imported actors carry `authors: [{ "name": "CShapes 2.0
   import (tools/import/cshapes.mjs)", "github": null }]`.
4. **Presences.** One per CShapes feature (`fid`): `actor` from the
   mapping, `dependencyOf` from `owner`, `when` from the dates, `capital`
   from the capital fields, `confidence: consensus`, sources = the dataset.
   Id: `<actor-id>-<start-year>` with a suffix if two features of one
   actor start the same year.
5. **Geometry.** Simplify each polygon with Visvalingam–Whyatt or
   Douglas–Peucker to a tolerance comparable to Natural Earth 110 m (tune
   so the world of one year is well under 1 MB uncompressed), quantize
   coordinates to three decimals, drop rings that collapse. Write
   **shards by period** — 1886–1913, 1914–1945, 1946–1974, 1975–2019, or
   whatever cut keeps each shard small — as `data/geo/presences/
   <from>-<to>.json`, a feature duplicated into every shard its interval
   touches. Compact JSON, sorted keys, deterministic (the freshness test
   must hold). The manifest lists the shards with their year ranges.
6. The tool is idempotent: it rewrites exactly the files it owns and
   nothing else, and refuses to touch a record whose `authors` do not
   name the import.
7. Tests with a **synthetic** GeoJSON fixture: date parsing (including
   the 2019 open end), the actor mapping, id derivation, simplification
   preserving topology at the chosen tolerance, quantization, shard
   assignment, determinism.

Run the tool and commit its output. Say in `STATUS.md` how many entities,
presences, shards and bytes resulted.

## Part 3 — the site

- `src/map/layers/presences.js`, drawn **under** the events layer and over
  the land layer: for the current year, every presence whose interval
  contains it. Honesty in the rendering: `state` presences as a thin
  cobalt outline with a very faint fill; dependencies with a lighter
  outline and a subtle hatch or tint that ties them to their owner on
  hover; a `disputed` presence hatched. No rainbow of colours: the
  azulejo direction is cobalt on white, and "who was where" is answered
  by hover and selection, not by a legend of forty hues. Hover shows the
  actor's name (and "dependency of X"); click selects the actor
  (`?actor=`), which the panel shows with its card, and the actor's
  presences — and those of its dependencies — fill in `cobalt-soft` while
  selected. Use the existing tokens; add tokens only if you must, in
  `style.css`, with a comment.
- The layer is toggleable through the existing `layers` state (add a
  checkbox `territories` next to the others in `index.html`); default on.
- `data.js` loads the manifest's presence shards on demand for the
  current year and caches them; the year slider swaps shards without
  reloading the topology. The topology carries presences as
  `{ id, actor, dependencyOf, when, presenceType, confidence, geometry }`
  so the panel can list an actor's territory over time without geometry.
- Panel: the actor card lists the actor's presences chronologically —
  "territory shown on the map 1911–1974", capital — and each dependency
  it held, with links.
- Timeline: unchanged.
- `about.html`: a section on territories — that the layer is CShapes 2.0,
  its licence and attribution, that it covers 1886–2019 only, and what
  the outline styles mean. `README.md` and `CONTRIBUTING.md` mention the
  layer and its licence.

## Part 4 — the Portuguese territories, checked by hand

CShapes should already contain Portugal's dependencies (Angola,
Mozambique, Portuguese Guinea, Cape Verde, São Tomé and Príncipe,
Portuguese India, Macau, Portuguese Timor) with their end dates. Verify
each against the events already in the test dataset (`goa-annexed-1961`,
`angola-independence-1975`, `east-timor-invasion-1975`,
`macau-handover-1999`, the Guinea-Bissau declaration and recognition). Where
CShapes and an event disagree on a date, do not edit either: list the
disagreement in `STATUS.md` → Open questions for the owner, with both
values and their sources. Link the presences to the actors the dataset
has where a mapping is unambiguous (`republic-of-india`, `indonesia`);
create the rest.

## Docs

`ARCHITECTURE.md` revision 5 with a dated note at the top: presence moves
from ○ to ●, `dependencyOf` and `capital` added, the licence enum and
per-directory rule, geometry sharding by period, the presences layer,
`tools/import/` now real. Update the tree, the data model, invariants,
extension points, milestones (M5), decisions. `CLAUDE.md` layout.

Done when: the map, scrubbed from 1886 to 2019, shows the world's borders
changing, with Portugal's African and Asian territories changing colour as
they leave; hovering names them; clicking opens the actor; the layer can
be switched off; every presence validates; the import is reproducible from
the recorded file; tests cover the tool and the rules; `about.html` carries
the attribution; `STATUS.md` says what the owner reviews next, including
any date disagreements found in Part 4.

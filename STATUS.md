# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-01, by the agent building M0/M1 (`docs/m0-brief.md`), at the end of
M1.

## Phase

**M0 and M1 built, on branch `m0`, pull request #1 open against `main`.**
`ARCHITECTURE.md` revision 3 is still the specification.
`data/events|edges|sources` are empty: no record has been written, by
design — the owner writes every record. The site renders the synthetic
fixture graph from `python3 -m http.server 8000` at
`http://localhost:8000/?fixtures=1` (verified in headless Chrome: map,
timeline, panel, chain in the URL, convergence, disputed-link notice).

What exists and passes (`node tools/validate.mjs --index`, `node --test`:
87 tests, CI green on the PR):

- **M0.** Licences (`LICENSE` MIT, `data/LICENSE` CC BY-SA 4.0,
  `data/geo/LICENSE` Natural Earth); `.nvmrc` = 22; `schema/common/` and
  `schema/v1/`; `src/validate/{schema,rules,core}.js`;
  `src/util/{dates,geo}.js`; `tools/{validate,build-index,build-regions,
  new-record}.mjs` and `tools/lib/read.mjs`; `data/geo/land-present.json`
  and `data/geo/regions.json` from Natural Earth v5.1.2; `data/index/` for
  the empty dataset; `tests/fixtures/data/` (twelve events, ten edges, four
  sources, three square lanes) with its own index; `validate.yml`,
  `deploy.yml`, `CODEOWNERS`, PR template; `CLAUDE.md` updated.
- **M1.** `index.html`, `src/style.css` (azulejo tokens), `src/main.js`,
  `state.js`, `data.js`, `graph.js`, `map/projection.js` (equirectangular),
  `map/map.js`, `map/layers/{land,events}.js`, `timeline.js`,
  `timeline-scale.js`, `panel.js`, `util/{esc,dom}.js`. State
  `{ year, selected, chain, layers }` in the query string; `chain` is the
  list of edge ids walked. Disputed edges dashed on the map and marked in
  the panel; arriving through one shows a notice and the dispute text.

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agent, all reversible, all listed under Deviations:
`creators` on source records; edge-id shape; nearest-lane fallback; helper
modules; the map shows events that have started by the slider year.

## Next

1. **Owner: review and merge PR #1**
   (https://github.com/goncalojacob/atlas-causal/pull/1). Before the first
   merge to `main`, enable **Settings → Pages → Source: GitHub Actions**,
   otherwise `deploy.yml` fails at `configure-pages`; if branch protection
   is on, let `github-actions[bot]` push to `main` (it commits the
   regenerated index).
2. **Owner: write the first records.** `node tools/new-record.mjs event
   <id> --title … --start … --lon … --lat … --label …` (and `edge`,
   `source`), fill in the text, then `node tools/validate.mjs` and
   `node tools/build-index.mjs`; open `http://localhost:8000/`. Use
   `region` on the record whenever the derived lane is wrong (strait
   cities, islands absent at 110m).
3. **Owner, at M2: create the scoped PAT** (contents + pull-requests on this
   repo) for `contribution.yml`; note its expiry in `CONTRIBUTING.md`.
   M2 itself (`contribute.html`, issue templates, `bundle-to-files.mjs`) is
   not started.
4. Reconcile the two `CLAUDE.md` lines listed under Open questions.

## Open questions

- When contributions open to strangers. `CONTEXT.md` argues: after the
  1580–1640 chain coheres and a few hundred of the owner's own records exist.
  Owner: "we'll decide later."
- The scoped PAT for `contribution.yml` has to be created by the owner in
  GitHub settings at M2; its expiry goes in `CONTRIBUTING.md`.
- `CLAUDE.md` still says "Comments explain why, not what. In Portuguese."
  and names the edge types and `disputada` in Portuguese under "The data
  model". The brief said to keep every line outside Commands and Layout, so
  they were kept; they contradict the everything-in-English decision.
  Owner to reconcile (code, data and interface use the English names).
- `ARCHITECTURE.md` shows `"github": "gjacob"`; the GitHub account is
  `goncalojacob`, which is what `CODEOWNERS` uses. Records should carry the
  real handle.
- Source records have no field for the container of a chapter or article
  (journal, edited volume). `locator` and the DOI cover locating it; the
  owner decides whether a `container` field is wanted before records exist.
- The Natural Earth `CONTINENT` attribute puts all of Russia in `europe`,
  Turkey and the Caucasus in `asia`, Greenland in `americas`. Overridable
  per record with `region`; acceptable for v1?
- Nearest-lane tolerance is 3° (`NEAREST_TOLERANCE` in `src/util/geo.js`).
  A point in the Strait of Gibraltar (Ceuta) derives by nearest and may land
  on `europe`; Azores and Madeira are absent from 110m Natural Earth. Such
  events need `region` set by hand; the validator says so when nothing is in
  reach, but not when the nearest guess is merely wrong — the owner should
  glance at `regionMethod: "nearest"` entries in the topology index.
- Map semantics: the map shows events whose start is at or before the
  slider year; the timeline always shows everything. Is that the intended
  reading of "look at a map at a given moment"?

## Deviations

Where `ARCHITECTURE.md` or the brief could not be built as written, the
closest thing that keeps the invariants was built. Each is one edit to
reverse.

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

## Where things live

- Repo: `~/atlas-causal` (this directory), branch `m0`.
- Pull request #1: https://github.com/goncalojacob/atlas-causal/pull/1
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).

## Uncommitted

Nothing.

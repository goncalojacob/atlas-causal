# Build brief — M0 and M1 scaffolding

Written 1 September 2026 for the agent building the first code. Read, in
this order and completely, before creating any file: `CLAUDE.md`,
`STATUS.md`, `ARCHITECTURE.md`, `CONTEXT.md`, `docs/review-2026-09-01.md`.
`ARCHITECTURE.md` revision 3 is the specification; this brief only orders
the work and sets the rules of engagement.

## Rules of engagement

- Work on branch `m0`, in small commits, one logical change each, messages
  in English, ending with the Co-Authored-By line the harness gives you.
  Open one pull request against `main` titled "M0: skeleton, schemas,
  validator, CI" when M0 is done; keep pushing to the same branch for M1.
- Never write a record into `data/events/`, `data/edges/` or
  `data/sources/`. **No AI-generated historical claims, ever.** The owner
  writes every record. Test fixtures live in `tests/fixtures/` and must be
  unmistakably synthetic (`fixture-event-a`, "Fixture event A"), never
  plausible history.
- No runtime dependencies, no build step for the site, no map library, no
  CDN. Plain ES modules. `python3 -m http.server 8000` from the repo root
  must serve a working page at the end of M1.
- `node tools/validate.mjs` and `node --test tests/` must pass at every
  commit. If something in `ARCHITECTURE.md` turns out to be unbuildable as
  written, do the closest thing that keeps its invariants, and record the
  deviation in `STATUS.md` under a new "Deviations" heading with the reason.
  Do not silently reinterpret.
- When done, or when blocked, update `STATUS.md` (phase, next, open
  questions, deviations) so the owner can resume from it without reading
  the PR. That file is the handoff.

## M0 — skeleton, schemas, validator, CI

Deliver, in this order:

1. **Layout.** The ● tree from `ARCHITECTURE.md`, without reserved folders
   and without `.gitkeep`. `.nvmrc` pinned to the Node LTS major CI will use.
   `.gitattributes` already exists.
2. **Licences.** Root `LICENSE` = MIT, copyright Gonçalo Jacob 2026.
   `data/LICENSE` = CC BY-SA 4.0 full text. `data/geo/LICENSE` = a short
   file stating Natural Earth is public domain, with the URL.
3. **Schemas** in `schema/common/` and `schema/v1/`, JSON Schema draft
   2020-12 spelling, using only the keyword subset the validator implements
   (below). Files: `interval.json`, `place.json`, `provenance.json`,
   `confidence.json`; `event.json`, `edge.json`, `source.json`,
   `region.json`, `bundle.json`. Follow the field shapes in
   `ARCHITECTURE.md` exactly — envelope with `status`, `supersededBy`,
   `aliases`, `authors[{name, github}]`, `license` enum, `sources`; interval
   with `end: null`, `date`, `calendar`; `dispute { text, sources }`; source
   identifiers per type.
4. **`src/validate/schema.js`** — a JSON Schema subset validator, pure, no
   `fs`: `type, enum, const, required, properties, additionalProperties,
   items, pattern, minimum, maximum, minLength, maxLength, oneOf, $ref`
   (relative refs within `schema/`). **Fails closed:** any keyword outside
   the subset in a schema file is a validation error of the schema itself.
   Test that explicitly.
5. **`src/validate/rules.js`** — the cross-record invariants 2–15 from
   `ARCHITECTURE.md` "Invariants the validator enforces", plus the three
   warnings. `src/util/dates.js` with `toAstronomical()`; all year
   arithmetic goes through it. Rules that need the whole graph (references,
   DAG, aliases uniqueness, consensus author overlap) take a topology
   object, so the same code runs in the browser later.
6. **`src/validate/core.js`** — `validate(records, topology) → { errors,
   warnings }`, composing schema + rules.
7. **`tools/validate.mjs`** — CLI: reads `data/`, builds the topology,
   runs `core`, prints errors and warnings, exit code 1 on any error. Also
   checks, when `--index` is passed, that `data/index/` is byte-identical to
   a fresh build (invariant 16; used only on `main`).
8. **`tools/build-index.mjs`** — writes `data/index/manifest.json`,
   `topology-<hash>.json`, `sources-<hash>.json` as specified. Recursive
   key sort, code-unit string comparison, trailing newline, content hash in
   the file name, old hashed files removed. Test byte-determinism by
   building twice and comparing.
9. **`tools/build-regions.mjs`** and **`data/geo/land-present.json`** —
   download Natural Earth 110m `ne_110m_admin_0_countries` and
   `ne_110m_land` (public domain), convert to GeoJSON if needed (write the
   converter; no dependencies), simplify nothing further, and produce
   `data/geo/land-present.json` and `data/geo/regions.json` with one
   polygon per lane. Lanes for v1, in `data/regions.json`: `europe`,
   `africa`, `asia`, `americas`, `oceania`. Build the lane polygons as
   unions of country polygons by continent attribute; a union that is just
   a multipolygon of the member countries is acceptable. Region derivation
   in `build-index.mjs` uses point-in-polygon against these; an event with
   `region` set uses it as an override. If the download is impossible in
   your environment, stop, record it in `STATUS.md`, and continue with the
   rest.
10. **`tools/new-record.mjs`** — scaffolds an event, edge or source file
    with the envelope filled in from arguments.
11. **Tests** in `tests/` with `node --test`, zero dependencies: schema
    subset (including fail-closed), every rule with a passing and a failing
    fixture, `dates.js`, `build-index` determinism, `projection.js` round
    trip once it exists.
12. **CI**: `.github/workflows/validate.yml` (on pull_request: validator +
    tests) and `.github/workflows/deploy.yml` (on push to main, one job:
    build-index → commit if changed → upload the same checkout → deploy to
    Pages; `concurrency: { group: deploy, cancel-in-progress: false }`).
    `CODEOWNERS` for `data/` and `.github/`. `PULL_REQUEST_TEMPLATE.md`
    with the review checklist from `ARCHITECTURE.md`. Do **not** create
    `contribution.yml` or the issue templates — that is M2 and needs a PAT
    the owner has to create.
13. **`CLAUDE.md`**: replace the superseded "Layout" and "Commands"
    sections with the real ones. Keep every other line.

M0 is done when the validator passes on the empty dataset, all tests pass,
`build-index` produces a manifest with zero records, and the PR is open.

## M1 — the site, against fixtures

Continue on the same branch. Build `src/` as specified in the "Site
modules" table: `state.js`, `data.js`, `graph.js`, `map/projection.js`,
`map/map.js`, `map/layers/land.js`, `map/layers/events.js`, `timeline.js`,
`timeline-scale.js`, `panel.js`, `util/esc.js`, `style.css`, `index.html`.

- Projection: equirectangular or a simple Robinson-style approximation —
  your choice, documented in `projection.js`. It must be invertible for
  click handling.
- Visual direction from `CLAUDE.md`: cold white ground, cobalt drawing, one
  madder red accent for the followed path. Colours as CSS variables only.
  Disputed edges dashed; confidence and `status` visible in the panel.
- State `{ year, selected, chain, layers }` in the URL query string;
  shareable links.
- `graph.js`: consequences, ancestors, convergence exactly as `CONTEXT.md`
  describes (exclude only the walked path — do not "simplify" it). Results
  ordered by type, then confidence. Unit-tested against fixtures.
- `data.js`: loads the manifest, then the topology whole, then record files
  on demand; resolves aliases and `supersededBy`.
- Escape all data before it reaches the DOM (`esc()`); `url` fields are
  only rendered as links when `http(s)`.
- Because `data/` is empty, add a `?fixtures=1` mode that loads
  `tests/fixtures/` instead, so the owner can see the interface working
  before writing records. Fixtures stay synthetic.

M1 is done when the page renders the fixture graph with map, timeline,
panel, chain and convergence, from `python3 -m http.server 8000`, and
`STATUS.md` says exactly what the owner should do next (write records;
create the PAT for M2).

# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-01, by the agent building M2/M3 (`docs/m2-brief.md`), at the end of
M3.

## Phase

**M0, M1, M2 and M3 built, on branch `m0`, pull request #1 open against
`main`.** `ARCHITECTURE.md` revision 3 is still the specification.
`data/events|edges|sources` are empty: no record has been written, by
design — the owner writes every record. Every page serves from
`python3 -m http.server 8000`; with no records yet, `?fixtures=1` on the
atlas and on the form loads the synthetic set in `tests/fixtures/data/`.

What exists and passes (`node tools/validate.mjs --index`, `node --test`:
120 tests):

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
  `{ year, selected, chain, layers }` in the query string. Disputed edges
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

Verified in headless Chromium, against `?fixtures=1`: the atlas renders
(marks, lanes, bars, panel); the form derives an id from a title, lists the
bundle's own sources alongside the atlas's, blocks on a near-match until it
is acknowledged, fires the arrow of time and the consensus rule in the
browser, shows the dispute fields only for a disputed edge, and produces the
bundle JSON.

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agents, all reversible, all listed under Deviations.

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
4. **Owner: write the first records.** `node tools/new-record.mjs event <id>
   --title … --start … --lon … --lat … --label …` (and `edge`, `source`),
   fill in the text, then `node tools/validate.mjs` and
   `node tools/build-index.mjs`; open `http://localhost:8000/`. Use `region`
   on the record whenever the derived lane is wrong (strait cities, islands
   absent at 110m).
5. **Owner: test one bundle end to end** once the PAT exists — open
   `contribute.html`, build a bundle, file the issue, apply `accepted`, and
   check that the pull request arrives with green CI. That is the M2
   acceptance criterion and the one thing the agent cannot do for you.
6. **Not yet: publishing the templates.** `contribute.html` is deliberately
   not linked from the atlas or from `about.html`; both pages say
   contributions are not open. Opening them is the owner's call (see the
   first open question).

## Open questions

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

## Where things live

- Repo: `~/atlas-causal`, branch `m0`.
- Pull request #1: https://github.com/goncalojacob/atlas-causal/pull/1
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).

## Uncommitted

Nothing.

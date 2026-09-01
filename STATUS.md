# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-01, by the agent building M0/M1 (`docs/m0-brief.md`), at the end of
M0.

## Phase

**M0 built, on branch `m0`, pull request open against `main`; M1 starting
on the same branch.** `ARCHITECTURE.md` revision 3 is still the
specification. `data/events|edges|sources` are empty: no record has been
written, by design — the owner writes every record.

What exists and passes (`node tools/validate.mjs --index`, `node --test`:
61 tests):

- Licences: `LICENSE` (MIT), `data/LICENSE` (CC BY-SA 4.0 legal code),
  `data/geo/LICENSE` (Natural Earth, public domain, URL and version).
  `.nvmrc` = 22.
- `schema/common/` (interval, place, provenance, confidence) and
  `schema/v1/` (event, edge, source, region, bundle).
- `src/validate/schema.js` — subset validator, fails closed, tested;
  `src/validate/rules.js` — invariants 2–15 plus the three warnings, each
  with a passing and a failing test; `src/validate/core.js` —
  `validate(records, topology, schemas)` and `buildTopology`.
- `src/util/dates.js` (`toAstronomical` and friends), `src/util/geo.js`
  (point-in-polygon, nearest lane).
- `tools/validate.mjs` (with `--index`), `tools/build-index.mjs`
  (byte-deterministic, tested), `tools/build-regions.mjs` (ran once;
  `data/geo/land-present.json` and `data/geo/regions.json` committed),
  `tools/new-record.mjs`, `tools/lib/read.mjs`.
- `data/index/` for the empty dataset (manifest with zero records) and
  `tests/fixtures/data/` with its own index: a synthetic graph of twelve
  events, ten edges, four sources, three square lanes.
- `.github/workflows/validate.yml`, `deploy.yml`, `CODEOWNERS`,
  `PULL_REQUEST_TEMPLATE.md`.
- `CLAUDE.md` commands and layout updated.

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agent, all reversible, all listed under Deviations:
`creators` on source records; edge-id shape; nearest-lane fallback; the two
helper modules.

## Next

1. Owner: review and merge the M0 pull request (link below). Before the
   first merge to `main`, enable **Settings → Pages → Source: GitHub
   Actions**, otherwise `deploy.yml` fails at `configure-pages`; and let
   `github-actions[bot]` push to `main` if branch protection is on.
2. Agent (same branch, in progress): M1 — `src/` site against
   `tests/fixtures/` via `?fixtures=1`.
3. Owner: write the first events, edges and sources with
   `node tools/new-record.mjs`, then `node tools/validate.mjs` and
   `node tools/build-index.mjs`.
4. Owner, at M2: create the scoped PAT for `contribution.yml`; note its
   expiry in `CONTRIBUTING.md`.

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
  Owner to reconcile (the code and data use the English names).
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
  Azores and Madeira are absent from 110m Natural Earth, so an event there
  needs `region` set by hand; the validator says so.

## Deviations

Where `ARCHITECTURE.md` could not be built as written, the closest thing
that keeps its invariants was built. Each is one edit to reverse.

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
5. **Two modules not in the tree:** `src/util/geo.js` (geometry, pure, so
   the browser form can derive a lane one day) and `tools/lib/read.mjs`
   (every filesystem access of the tools, so `src/validate` stays free of
   `fs`).
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

## Where things live

- Repo: `~/atlas-causal` (this directory), branch `m0`.
- Pull request: "M0: skeleton, schemas, validator, CI" on GitHub.
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).

## Uncommitted

Nothing.

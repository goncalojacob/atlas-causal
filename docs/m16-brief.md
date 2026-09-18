# Build brief — M16: the Wikidata import tool and its Action

Written 4 September 2026 after `docs/review-2026-09-04-plan.md`. Runs
after M15. Read, in this order: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`,
`CONTEXT.md`, `docs/run-protocol.md` (with today's amendments),
`docs/m2-brief.md`, `docs/m5-brief.md` and `tools/import/cshapes.mjs` (the
precedent), `docs/m15-brief.md`, `docs/review-2026-09-04-plan.md`, then
this file. Rules of engagement as always. **This sandbox has no network**:
the tool is written and tested here against recorded fixtures; its first
real execution is in the GitHub Action, which does have network.

## The seeds file

`data/imports/wikidata-seeds.json`, contributor-editable, validated by a
new `schema/v1/import-seeds.json` (tool-side only: add it to the
tool-side list in `src/validate/schemas.js`, teach `readImportMaps` /
`validate.mjs` to dispatch on the file's `kind`, fix
`tests/schemas.test.mjs`):

```json
{ "schema": 1, "kind": "import-seeds", "source": "wikidata",
  "items": ["Q192914"],
  "queries": [ { "name": "elections-1890-1899", "sparql": "…" } ],
  "reconcile": true }
```

## The tool — `tools/import/wikidata.mjs`, zero dependencies

- **Fetch layer injectable** (`fetchJson` passed in), so tests run on
  recorded responses under `tests/fixtures/wikidata/`. A named User-Agent
  constant `atlas-causal import (+https://github.com/goncalojacob/atlas-causal)`,
  serial requests with a fixed delay, `maxlag=5` on API calls, retry with
  backoff on 429/503, a printed call budget the tool refuses to exceed.
- **Modes**: `--reconcile` (match existing hand-written records to items;
  see M17), `--import` (create records for seeds), `--candidates` (write
  a list only, nothing under `data/`; see M18). Batches of 25 items with a
  cursor `data/imports/wikidata-state.json`; every batch leaves the tree
  validating.
- **What it reads** per item: labels and descriptions (en, pt), `P31`,
  `P580`/`P582`/`P585`/`P571`/`P576`/`P569`/`P570`, `P625`, `P276`/`P17`/`P131`,
  `P710`, sitelinks; the Wikipedia lead section (en, pt) through the REST
  summary endpoint.
- **What it writes**, per-field and **additive**: creates event, actor,
  place records where none exists for the item; on existing records it
  writes `wikidata`, `wikipedia`, `sitelinks` **only when absent** and
  never modifies a non-empty value of any field; it never touches
  `summary`, `title`, `when`, `place`, `actors`, `sources` where present;
  it never writes edges. Created records carry
  `authors: [{ "name": "Wikidata import (tools/import/wikidata.mjs)", "github": null }]`,
  `review: { "flags": ["imported-facts"] }`, sources `wikidata` with the
  item id as locator; enrichment adds **no** `authors` entry. Actors get
  `actorType` from `P31` (human → person; country/state → polity;
  organisation → institution); ambiguous → listed, not created.
- **Places**: matched by `wikidata`, else created from `P625`; the tool
  derives the lane itself (the same functions `build-index.mjs` uses) and,
  where none derives, sets `region` from `P17` mapped to a lane, or
  refuses the event and lists it. Nothing may leave `build-index.mjs`
  unable to run.
- **Leads** stored under `tools/import/cache/wikipedia/<QID>.<lang>.json`
  as `{ qid, lang, title, revid, fetched, license: "CC-BY-SA-4.0", url,
  historyUrl, text }`, schema-checked by `validate.mjs`, **excluded from
  the Pages upload** (a step in `deploy.yml` removes `tools/import/cache`
  before `upload-pages-artifact`), attributed in `data/LICENSE` and
  `about.html`.
- `tools/import/cshapes.mjs` carries `wikidata`, `wikipedia`, `sitelinks`
  forward from disk the way it carries `created`; test.
- A printed report of everything created, enriched, refused.

## The Action — `.github/workflows/import-wikidata.yml`

Triggered on **push to branches `import/**`** (not `workflow_dispatch`:
the default branch has no workflows). The job: checkout the branch, run
the tool with the mode named in the branch (`import/reconcile-…`,
`import/candidates-…`, `import/run-…`), run `node tools/validate.mjs`
**and** `node --test`, run `node tools/build-index.mjs`, commit per batch
with the default token to **the same branch, never `m0`**, `timeout-minutes:
90`, and on failure `git checkout -- data/` before exiting non-zero. A
cloud run that wants an import pushes `import/<mode>-<date>` from `m0`,
polls the branch until the Action's final commit ("import: done") appears
or the run fails, then `git merge --ff-only` into `m0` — its own commit,
per the protocol amendment.

## Docs

`ARCHITECTURE.md` next revision: `tools/import/wikidata.mjs`, the seeds
schema, the cache, the Action and its trigger, the additive rule.
`CLAUDE.md` commands and layout. `CONTRIBUTING.md`: how to propose a seed.

## Done when

Tests cover the fetch layer with fixtures, each mode, the additive rule,
the place/lane derivation, the cursor and resume, the seeds schema, and
`cshapes.mjs` carrying the fields forward; the Action file lints as YAML
and the workflow test in `tests/workflows.test.mjs` covers it (no `run:`
interpolation, branch guard, validate-before-commit); validator and tests
green; `STATUS.md` with the literal line `M16 done`; an "M16" section on
PR #1. **The tool is not run for real in this milestone.**

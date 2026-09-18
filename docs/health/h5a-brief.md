# Build brief — H5a: aliases everywhere, and the migration chain

Health cycle; runs on its own branch `h5`, in parallel with H1 on `m0`.
Read `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`, `docs/run-protocol.md`,
`docs/health-plan-2026-09-05.md` (decisions 2 and 3, milestone H5a),
`docs/health-review-2026-09-05-A.md` findings 20, 21, 25, and
`docs/review-2026-09-05-health-plan.md` findings 5, 16, 19, 24. **Never
commit `data/index/`** on this branch (the assistant rebuilds it after the
merge); `node tools/validate.mjs` without `--index` is the gate here.

1. **Aliases resolve everywhere.** One helper in `src/validate/rules.js`
   (`resolveId(id, universe)`) used by rule 3, `narrativeSteps` and
   `citationsOf`, so a narrative step or a `review.citations` key written
   against a former id resolves the way `data.js`'s `resolve()` does.
   Tests with a fixture rename.
2. **The migration chain.** `src/validate/migrate.js`: a pure, ordered
   array of `{ version, name, up(record), down(record) }`, no `fs`, loadable
   by the browser; `tools/lib/read.mjs` applies `up` on read so the
   validator, the index builder and the round-trip test see one shape;
   `tools/migrate/apply.mjs` rewrites disk (every record under `data/`,
   idempotent, validated before writing) and is run in the same commit as
   any migration that changes bytes. `core.js` accepts `schema ≤
   SCHEMA_VERSION`; `SCHEMA_VERSION` stays 1.
3. **Migration 001** is additive and changes no byte of any current
   record (it establishes the chain; H5b's fields ride on it). **Migration
   002** is trivial and reversible (say, normalising key order in
   `review`), proves `up`/`down` and the on-disk writer on the fixtures,
   and is then **reverted by 003** so the dataset is byte-identical at the
   end of the run — the chain is tested, the tree is unchanged.
4. **`--index` on the PR gate** for branches touching `data/`
   (`.github/workflows/validate.yml`).
5. `ARCHITECTURE.md`: the migration convention; `CONTRIBUTING.md`: one
   paragraph.

Done when: the alias tests pass; `node tools/migrate/apply.mjs` on a
scratch copy of the fixtures applies 002 and 003 and leaves bytes equal;
`node tools/validate.mjs` clean; `node --test` green; `git diff --stat
origin/m0 -- data/` shows no change; deviations; the literal line
`H5a done`.

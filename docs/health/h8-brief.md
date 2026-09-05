# Build brief — H8: generated pages and the artifact

Health cycle, last run before the review of the result. Read
`docs/health-plan-2026-09-05.md` (decision 4, H8),
`docs/health-review-2026-09-05-A.md` findings 15, 35,
`docs/health-review-2026-09-05-B.md` findings 29, 35,
`docs/review-2026-09-05-health-plan.md` findings 9, 24. Code only.

1. **Prerendering**: `tools/build-index.mjs` writes `sources.html`'s and
   `narratives.html`'s lists and `entry/<id>.html` for every event, actor
   or place that carries a `body`, from the same pure functions, the
   scripts only enhancing; `entry.html?id=` stays the address and the
   prerendered page carries a canonical link to it; the build prints the
   file count and bytes; `--index` byte-compares them.
2. **The artifact**: `deploy.yml` uploads an allowlist — the html files,
   `src/`, `schema/`, `data/` minus `imports/`, `tests/fixtures/data/`;
   `review.html` shows a banner when not on localhost.
3. **`STATUS.md`** cut to about a hundred lines (position, next, open
   questions, the milestone lines) with the rest moved verbatim to
   `docs/history/status-2026-09-05.md`; `CLAUDE.md` still says to read
   it first.

Done when: the build prints its table; a prerendered entry renders
without JavaScript; the artifact's contents are listed in
`ARCHITECTURE.md`; `node --test` and the validator green; `H8 done`.

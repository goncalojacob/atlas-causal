# Build brief — H3b: the pages switch to the spine

Health cycle. Read what H3a's brief lists, plus `docs/health/h3a-brief.md`
and what H3a recorded in `STATUS.md`; `docs/review-2026-09-05-health-plan.md`
findings 1, 2, 7, 23, 28(b). Code only; `data/index/` regenerated only if
a file's content changes (it should not); this run owns it.

One page per commit, each pushed, each page fully working on the spine
before the next starts, in this order:

1. **The atlas** (`index.html`): `main.js` loads the spine and the shards
   the window needs; views draw the window's events plus a margin of one
   period, out-of-window events as a faded stub (the timeline) or
   nothing beyond the margin (map, graph), and this is recorded in
   `ARCHITECTURE.md` as a change from M6; each view has an explicit
   render key and skips a render whose key is unchanged; the store still
   notifies synchronously.
2. **entry.html**: the record file plus the spine for its links.
3. **narratives.html** and **sources.html**: from the spine and the
   sources index.
4. **contribute.html**: the search shard for pickers and duplicate
   search; the spine for validation (rule fields only).
5. **review.html**: the spine, the review index, the citers on demand for
   `retractionPlan`.
6. Records served with `?v=<revised>` from the spine's `revised` (add it
   to the spine in this run).

Done when: every browser test passes on the spine; the old topology is
not fetched by any page (assert in a browser test that no request for
`topology-` is made); `node --test` and the validator green; the literal
line `H3b done`.

# Build brief — H6b: the reviewer

Health cycle; after H6a. Read `docs/health-plan-2026-09-05.md` (H6b),
`docs/health-review-2026-09-05-B.md` finding 7,
`docs/health-review-2026-09-05-A.md` findings 8, 31,
`docs/review-2026-09-05-health-plan.md` finding 19. Code only.

1. **A virtual list** in `review.html` over digests sharded by kind
   (`review-<kind>-<hash>.json`), rows created for the viewport only.
2. **Sort keys**: flags, degree, age, kind; a filter per flag and per
   `origin.tool`.
3. **Edge in context**: an edge row shows both endpoints' summaries and
   their status.
4. **History and diff**: a generated per-record history file
   (`data/index/history/<id>.json`, the signatures and the fields each
   changed, built by `build-index` from git when available and from the
   record's `revised` otherwise); the editor shows a diff against the
   draft before Sign.
5. **An optional claim**: `review.claimedBy` with a date, shown in the
   list, expiring after a week.

Done when: the list at 20k synthetic drafts renders under 500 ms and a
keystroke under 50 ms in the bench; `node --test` and the validator
green; `H6b done`.

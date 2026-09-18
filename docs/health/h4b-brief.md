# Build brief — H4b: the graph view's hot paths

Health cycle; after H3c; may run in parallel with H4a on a side branch
(different files). Read `docs/health-plan-2026-09-05.md` (H4b),
`docs/health-review-2026-09-05-B.md` finding 3,
`docs/health-review-2026-09-05-A.md` finding 2,
`docs/review-2026-09-05-health-plan.md` findings 13 and 14,
`src/graph-view/layout.js`, `graph-view.js` and their tests. Code only.

1. **Crossing count pruned, not replaced.** Keep `crosses()` and the
   promise "never worse than doing nothing"; prune candidate pairs by a
   sweep over x with bounding boxes so only segments whose spans overlap
   are tested; the counts are identical (assert against the naive count
   on the fixtures and the seeded 300-event graph). Early stop only when
   two sweeps bring no improvement — never by time.
2. **Window only, memoised.** `layoutGraph` and `stackLayout` run on the
   window's events plus the margin; memoised on the arrangement key fixed
   in H1b; `stackLayout` reuses H4a's grid through `cluster.js`.
3. **No Worker** unless the bench still shows a frame over 100 ms at 20k
   synthetic events after 1 and 2; if it does, a `type: 'module'` Worker
   with a synchronous fallback that `node --test` covers, `fixtures` and
   the data root passed in explicitly, and only ids, years, weights and
   lanes posted across.

Done when: determinism tests unchanged and green; crossing counts equal
the naive ones; the graph tab at 5k synthetic edges lays out under 1 s
in the bench (numbers in `STATUS.md`); `H4b done`.

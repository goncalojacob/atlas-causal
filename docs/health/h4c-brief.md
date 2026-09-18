# Build brief — H4c: the timeline, the queries and search

Health cycle; after H4a and H4b. Read `docs/health-plan-2026-09-05.md`
(H4c), `docs/health-review-2026-09-05-B.md` findings 19, 22, 23,
`docs/health-review-2026-09-05-A.md` findings 12, 18, 19,
`docs/review-2026-09-05-health-plan.md` findings 14, 23. Code only.

1. **Timeline packing** by a sorted one-dimensional sweep; window only
   plus the margin; the SVG's nodes kept and updated rather than rebuilt;
   a density strip per row beyond the neighbourhood (one `<path>`); the
   lanes' scale unchanged (M6 stands).
2. **Horizon and convergence memoised** in `horizon.js` and `graph.js`
   keyed by (adjacency, selected, year) and (adjacency, target, path);
   `pathTo` lazy; one `workingSet` (H2) computed per state change and
   shared by the views; the never-stacked set capped.
3. **Search** debounced; the search shard (H3a) used for the scan; the
   scan moved to a `type: 'module'` Worker with a synchronous fallback
   only if it passes 50 ms at 20k in the bench.

Done when: the timeline's wheel notch at 20k synthetic events under
100 ms in the bench; `node --test` and the validator green; `H4c done`.

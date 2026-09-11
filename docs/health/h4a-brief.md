# Build brief — H4a: clustering and the map's hot paths

Health cycle; after H3c. Read `docs/health-plan-2026-09-05.md` (decision
9, H4a), `docs/health-review-2026-09-05-B.md` findings 2, 24,
`docs/health-review-2026-09-05-A.md` finding 13,
`docs/review-2026-09-05-health-plan.md` finding 12, `src/cluster.js` and
its tests. Code only.

1. **The grid.** `clusterPoints` buckets points in cells strictly wider
   than the threshold and keeps: the single globally sorted seed walk
   (`byWeightThenId`); members re-sorted by `byWeightThenId` before
   `centre` and `weight` are reduced; the exact `<=` predicate on every
   candidate. A test compares grid against the greedy implementation
   (kept in the test file) over several thousand points at several `k`,
   including `centre` and member order.
2. **Once at rest.** During the zoom animation only the transform
   changes; clustering runs at rest, cached per (event set, zoom bucket
   rounded down), with `coreZoom` exempt from bucketing so a splittable
   cluster still splits on click. The clustered set is the same as today
   (every placed event in the window); only drawing is culled by the
   viewport.
3. **Presences.** An interval index over `when`; path strings cached per
   (feature, projection signature); `simplify.mjs` applied by zoom level
   at load; the first shard deferred until the land has drawn.
4. `tests/bench/run.mjs` (no `.test.` in the name) with a seeded
   generator scaled from `tests/graph-layout.test.mjs`'s; before/after
   numbers for `clusterPoints` at 14k and 70k points in `STATUS.md`.

Done when: the identity test passes; the map's wheel notch at 20k
synthetic events is under 50 ms in the bench; `node --test` and the
validator green; `H4a done`.

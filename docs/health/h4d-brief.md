# Build brief — H4d: the tools' hot paths

Health cycle; may run in parallel with H4c on a side branch (tools only).
Read `docs/health-plan-2026-09-05.md` (H4d),
`docs/health-review-2026-09-05-B.md` findings 4, 5, 27, 32,
`docs/health-review-2026-09-05-A.md` finding 11,
`docs/review-2026-09-05-health-plan.md` findings 26, 27. Code only;
`data/index/` byte-identical at the end.

1. **Validator indexes.** `checkRules` builds once per call: active edges
   by endpoint, referrers by actor and by place, presences by actor,
   `nameKey` per source; rules 11 and 17 become lookups; schema patterns
   precompiled in `createValidator`. The browser's form validates the
   bundle's records against a prebuilt universe.
2. **Once, not twice.** `validate --index` passes records, topology and
   warnings into `buildIndex`; reads with bounded concurrency; the
   palette compared by input hash and rebuilt only when the territories
   changed.
3. **`serve.mjs`**: a save queue (one write at a time); the in-memory
   records and topology patched synchronously so the next validation is
   correct; the response sent after the write; the index rebuilt in the
   background; `/__status` reporting "index rebuilding"; the dashboard
   showing it.
4. **The bench**: `tests/bench/run.mjs` timing `checkRules`,
   `build-index` and `validate --index` on the seeded 20k set with 40 %
   tombstones; numbers before and after in `STATUS.md`.

Done when: `checkRules` at 20k with 40 % tombstones under 3 s;
`validate --index` on the real dataset under 3 s; two concurrent Saves
serialise correctly in a test; `H4d done`.

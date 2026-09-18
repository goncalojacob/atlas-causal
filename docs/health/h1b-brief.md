# Build brief — H1b: render keys, URL writes, Back

Health cycle. Read `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/health-plan-2026-09-05.md` (decision 9, milestone H1b),
`docs/health-review-2026-09-05-B.md` findings 12 and 14,
`docs/health-review-2026-09-05-A.md` findings 3, 5 and 6, and
`docs/review-2026-09-05-health-plan.md` findings 7, 14, 22 and 23. Code
only; `data/` and `data/index/` untouched.

1. **The panel's render key** is the openings (`selected`, `source`,
   `place`, `actor`, `narrative`, `step`) plus `chain`, `horizon` and the
   resolved window. A change outside the key does not rebuild the card;
   the horizon year, the "map at" hints and the faded rows update in
   place. An open `<details>` survives a wheel notch; a cluster's member
   list survives the `bbox` write that follows a zoom.
2. **URL writes coalesce.** Replace-type writes (pan, zoom, band drag,
   layers) happen at most once per animation frame or on pointer-up, in a
   try/catch; `notify` stays synchronous — the store's contract does not
   change and no test becomes a timing test.
3. **Back restores the picture.** On `popstate`, the whole state is taken
   from the URL with `defaultState()` as the defaults, then written back
   normalised. Reading mode is untouched: the narrative URL stays
   `narrative` and `step` (review finding 22).
4. **The graph's arrangement key** covers the narrative lens (`lensSet`
   returns null under a narrative) and lane *membership*, not lane ids.

Done when: browser tests for 1 (open a details, drag the band, it stays
open and the horizon count changed; open a cluster, zoom, the list is
still there), 3 (open an event, open an actor, narrow the band, Back →
URL and band agree); a unit test for 4; `node --test` and the validator
green; deviations in `STATUS.md`; the literal line `H1b done`.

# Build brief — H1a: four one-line defects, and the NUL byte

Health cycle, first run. Read `CLAUDE.md`, `STATUS.md` (top 80 lines and
the last deviation number), `docs/run-protocol.md`,
`docs/health-plan-2026-09-05.md` (decisions 8 and 9, milestone H1a),
`docs/health-review-2026-09-05-B.md` findings 8, 9, 13, 34 and
`docs/health-review-2026-09-05-A.md` finding 14, and
`docs/review-2026-09-05-health-plan.md` findings 6 and 28(a). Code only;
no historical text; no record under `data/` changes; `data/index/`
untouched.

One commit per item, each with a test, pushed at once:

1. **Search widens only when needed.** `src/search-box.js`: when the
   chosen event's year lies inside the current window, leave `from`/`to`
   alone; widen only when it is outside. `windowAt` in `src/util/window.js`
   is the "map at Y" control and is **not** changed; its test stands.
2. **The horizon does not leak.** In `src/state.js` (or the select paths),
   a change of `selected` to a different id clears `horizon`. Clicking
   empty ground, which clears the selection, clears it too.
3. **A failed fetch is not cached.** `src/data.js`: a rejected record or
   geometry promise is removed from the cache, so the next attempt fetches
   again; `presences.js` says once that territories failed instead of
   swallowing it.
4. **A shared chain is filtered to active edges** after load, and the
   panel says so when steps were dropped (`src/state.js` or the panel's
   chain resolution; `atlas.edges.get` is status-blind).
5. **The NUL separator** in `src/validate/rules.js` (the actor x role key
   uses U+0000) becomes the unit separator U+001F, so `grep` works on the
   file again; note it in `docs/run-protocol.md`'s amendments.

Done when: five commits, each with its test; the browser test for item 1
selects an event inside the window from search and asserts the URL's
`from`/`to` are unchanged; validator and `node --test` green; a deviation
block in `STATUS.md` numbered on from the last; the literal line
`H1a done` under `## Milestones landed`.

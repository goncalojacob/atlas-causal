# Build brief — H7: the reader

Health cycle; after H5b and H3c. Read `docs/health-plan-2026-09-05.md`
(decisions 5, 6, 7, H7), `docs/health-review-2026-09-05-B.md` findings
17, 18, 28, 30, `docs/health-review-2026-09-05-A.md` findings 16, 17,
`docs/review-2026-09-05-health-plan.md` findings 8, 20, 21. Code only,
except the intro card's text, which quotes existing records and says
nothing historical of its own.

1. **The intro card** on first visit, as a dismissible card over the
   view (the panel is hidden when nothing is open since H1c): the
   narratives, the heaviest events by `weight`, one "follow the
   consequences" walkthrough, "start here" opening the first narrative at
   step 1; a small "?" control brings it back.
2. **Search over `names`** (H5b) and the summary's first sentence at low
   rank; years beside actors in results.
3. **The actor card** shows predecessor and successor events along
   `succeeded`, so the state actor is not empty when the colony holds the
   events.
4. **Ranking as an ordering**: `shortestPaths` untouched; the horizon list
   and convergence ordered by a cost of confidence and type, convergence
   grouped by depth with counts; the walked chain unchanged.
5. **`subgraph(atlas, ids, depth)`** in `graph.js` returning events,
   edges, actors and relations with a bundled fetch of the explanations
   by period (`explanations-<period>-<hash>.json` emitted by the index);
   narrative steps may cite an actor, a relation or a presence (schema,
   rule, card); `?walk=` reserved in the state (parsed, not yet used).

Done when: a browser test opens the atlas with nothing selected and sees
the intro; "carnation" finds the revolution; `?actor=angola` lists events
along `succeeded`; the horizon list's order is by the cost and the chain
is unchanged (test); `subgraph` tested on the fixtures; `H7 done`.

# Review of the plan of 5 September 2026 — findings

An independent Opus reviewer read the plan (`docs/plan-2026-09-05.md`),
the architecture, the schemas, the validator, the state, the lanes, the
timeline, the graph layout, the data layer, the events layer, the index
builder and the records, and returned thirty findings. The owner answered
the four that were decisions; the rest are folded into the plan's revision
of 02:30 Lisbon and into the briefs that follow. Kept here in short form
so a brief can cite a number.

1. A tenure cannot be a `led` relation: the id from--to--type allows one
   tenure per person and actor. → `tenure` is a kind of its own (owner).
2. The two existing `led` records name the regime polity; ten more are
   party leaderships. → `led` retired, all twelve migrated (owner).
3. A ninth kind touches ~15 frozen lists (`KINDS`, `ALLOWED_LICENSES`,
   `KIND_DIRS`, `SCHEMA_FILES`, bundle `oneOf`, `data.js`, `buildTopology`,
   manifest counts, `FIELDS`/`CITATION_LISTS`/`ACTOR_LISTS`/`STEP_LISTS`,
   `new-record.mjs`, `data/LICENSE`, `IDENTITY_KINDS`, `BODY_KINDS`,
   rule 15). → the M30a brief carries the list as a checklist.
4. Rule numbers 2–23 are taken; "the one-edge rule" is an editorial bar,
   not a rule. → rules 24 (parent), 25 (roles), 26 (office/tenure); the
   `degree-zero` warning counts `startedBy`.
5. `place` is already optional (M9; 229 records). → only the unplaced
   count is new.
6. Continents already stopped being the default lane (M14). → M33 is
   removal of `region` from `GROUPS` (duplicated in `state.js` and
   `lanes.js`) and the addition of `office`.
7. "Region as a filter" has nowhere to live. → `region` joins `FOCUS`
   and `lens.js`.
8. Rule 10 still requires `region` on placeless events. → optional
   everywhere (owner).
9. Dated names as `names` items break rule 18, the topology, search,
   the form and the i18n design. → sibling `historicalNames`.
10. `parent` in the causal queries is unrepresentable in `?chain=`. →
    display-only (owner).
11. Interval containment undefined for `{min,max}`, open ends, BCE. →
    reuse `span()`, warning not error.
12. Precedence of semantic collapse over M25's geometric stacks unstated.
    → semantic first, geometric on the result, never-hide rule shared;
    M30a's review after `M25 done`.
13. `weight` does not know parenthood. → derived `subtreeWeight`.
14. `startedBy` unchecked. → rules 3 and 11, and a warning outside `when`.
15. Reinstating an election is not a status flip. → clear the retraction
    note, re-check references, recount.
16. The Offices grouping is a dated join. → `officesByEvent` in the
    topology; `lanes.js` stays a lookup.
17. Sixty prime ministers do not fit a strip. → `cluster.js` in one
    dimension with a badge.
18. Rule 19 lets the wrong office through. → `tenure.office.of` must be
    the tenure's actor; `when` must overlap the office's.
19. Overlapping tenures are legal. → said in the brief.
20. The closed role list must reach the browser's validator; `manifest.roles`
    already means roles in use. → `rolesAllowed` in the topology.
21. The actor line's `note` must be in the topology or the actor card
    cannot show it. → in the topology.
22. The i18n overlay cannot carry per-element notes. → index-addressed
    translatable field added to the design.
23. The base-map fetch is impossible in a sandbox run. → a GitHub Action
    on `import/**`, tool tested offline.
24. 15 MB is below the raw size of the layers named. → a per-layer,
    per-zoom output budget with an order of sacrifice.
25. Zoom-and-region shards are tiles in all but name. → recorded as the
    rule's boundary (owner: fine, as long as public domain).
26. Matching a place record to a Natural Earth city must be data. →
    `data/imports/naturalearth-places.json`, `wikidata` first.
27. Two label placers will collide. → one shared placer with priorities.
28. M30 is too big for one run. → M30a schema, M30b interface.
29. An office record is unreachable. → `?office=`, a card, search.
30. Three backlog items were dropped and the continent question was
    wrongly claimed closed. → the three are M28's; the question stays
    open in the backlog.

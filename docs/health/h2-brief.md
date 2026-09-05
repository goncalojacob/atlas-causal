# Build brief — H2: the registry

Health cycle. Read `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`,
`docs/run-protocol.md`, `docs/health-plan-2026-09-05.md` (decision 9,
milestone H2), `docs/health-review-2026-09-05-A.md` findings 9, 27, 28,
`docs/health-review-2026-09-05-B.md` finding 19, and
`docs/review-2026-09-05-health-plan.md` finding 17. Code only; no URL
changes; no record on disk changes; `data/index/` byte-identical at the
end.

- `src/kinds.js`: a **leaf module** (imports nothing, or only `util/`)
  that is the one list of record kinds and, per kind, the directory, the
  schema file, the licences it may carry, whether it takes identity
  fields and a body, its citation lists, actor lists and step lists for
  the bundle, and its form fields' names.
- `src/vocab.js`: a leaf module with the edge types (label, order), the
  relation types (label, order, endpoint kinds), the groups, the focus
  kinds, and the id patterns built from them.
- `state.js`, `validate/rules.js`, `validate/core.js`, `lens.js`,
  `lanes.js`, `contribute/bundle.js`, `contribute/form.js`,
  `review/queue.js`, `entry/entry.js`, `citation.js`, `markdown.js`,
  `tools/lib/read.mjs`, `tools/new-record.mjs`,
  `tools/bundle-to-files.mjs`, `tools/import/wikidata.mjs` import from
  them; the duplicated regexes and `GROUPS` go. `validate/schemas.js`
  stays (it lists non-kind schema files and its order is tested).
- `src/emphasis.js`: `workingSet(atlas, state)` → `{ selected, path,
  consequences, converging, actor, narrative, reachable, lens }` as id
  sets, consumed by the map, the timeline and the graph in place of their
  three hand-built versions.
- Tests: the registry's vocabularies equal the enums in `schema/**`;
  `KINDS` equals the directory map; `workingSet` on the fixtures; every
  existing test still green.
- `ARCHITECTURE.md`: the extension-points table now says "add to the
  registry, add the schema file, add the enum" for a kind.

Done when: the two consistency tests exist and pass; `git grep` finds no
second definition of `EDGE_ID`, `RELATION_ID`, `GROUPS` or the focus
regex; `node tools/validate.mjs --index` reports the index byte-identical;
`node --test` green; deviations; the literal line `H2 done`.

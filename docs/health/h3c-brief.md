# Build brief — H3c: the old topology removed

Health cycle. Read H3a's and H3b's briefs and their `STATUS.md` records.
`tools/build-index.mjs` stops emitting `topology-<hash>.json`; `data.js`
loses `loadAtlas` in favour of the spine loader (keep the name if it is
cheaper for callers); every reference in tests, tools, workflows and docs
follows; `ARCHITECTURE.md`'s index section and `CLAUDE.md`'s layout
lines describe the spine and the shards; the manifest's `counts` and the
Wikidata import's `build-index` step still work. `data/index/` regenerated
once. Done when: `git grep topology-` finds only history; `node
tools/validate.mjs --index` byte-identical; `node --test` green; the
literal line `H3c done`.

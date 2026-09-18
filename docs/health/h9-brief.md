# Build brief — H9: the corrective run after the closing review

The closing Fable review of the health cycle
(`docs/health-review-2026-09-06-result.md`) found the state "not acceptable
as it stands; acceptable after one short corrective run". This is that
run. Read `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`, the review's
§3 (regressions R1–R21) and §5.1, then this file. Code only; no historical
text; `data/index/` regenerated where a fix changes it (this run owns it).
One commit per item, each with a test, pushed at once.

Two decisions the assistant took on the review's owner questions (the
owner may overrule tomorrow):

- **R8.** An open actor or place with no lens set still narrows the
  pictures to its events and their one-hop ring (the owner's own
  description), **but**: the selected event, the walked chain and the
  selected event's consequences are always drawn; and an actor or place
  with **no events at all** is not a lens — the atlas stays whole and the
  card says the actor has no events here.
- **R2/R12.** A contribution's pull request carries **neither**
  `data/index/` nor the prerendered pages: `contribution.yml` stops
  running `build-index` and `--index`, adds only the records, and
  `validate.yml` runs `--index` only when the pull request itself touched
  `data/index/`; `deploy.yml` rebuilds both on `main` as it already does.
  `deploy.yml`'s header and `workflows.test.mjs` say so again.

Items, in this order:

1. **R7** — `src/graph-view/graph-view.js`: hoist the `let transform`
   declaration above the first `arrange()`; a browser test opens the graph
   from `?from=1970&to=1980&view=graph` and from a narrative step and
   asserts no console error and a drawn graph.
2. **R8** — as decided above; `src/lens.js`/`src/emphasis.js`; browser
   tests: `?actor=angola` draws the whole atlas with the card's notice;
   `?actor=regenerator-party` then two walked hops keeps the selected
   event drawn.
3. **R10** — `tools/new-record.mjs`, `tools/import/wikidata.mjs`,
   `tools/import/cshapes.mjs` write `review.status: "draft"` (and
   `origin` where the creator is a tool); a validator **warning** on a
   record with neither `review.status` nor a signature; a test that a
   freshly scaffolded and a freshly imported record appear in the queue.
4. **R1** — `deploy.yml` checks out with `fetch-depth: 0`;
   `tools/lib/history.mjs` falls back to `revised` explicitly and says so
   in the file when the clone is shallow; the `history/` exemption in
   `compareIndex` goes; the fixture's histories regenerated.
5. **R2/R12** — as decided above.
6. **R3** — the picker test asserts warm keystrokes (the second and later)
   under 100 ms and reports the cold one without asserting it.
7. **R4** — `tests/bench/run.mjs` runs its cases only when it is the
   entry module (`import.meta.url` check); the 20k dataset is written only
   under `--dataset <dir>` or the scratch directory the harness is told;
   a `layout` case that reproduces H4b's numbers.
8. **R20** — the contribution form: a new record whose derived id already
   exists is reported as "this would replace <title>" and never "the
   bundle validates" without the acknowledgement; the duplicate search
   includes the record with that id.
9. **R21** — Claim reads the name box at click time;
   `review.html?open=<kind>/<id>` opens that record or says it is not in
   the queue.
10. **R9** — the panel's render key includes the lens; **R11** — the
    timeline lights the horizon's reachable set beyond the margin as the
    hint promises; **R13** — `tools/lib/store.mjs` invalidates on a file
    change (mtime or `fs.watch`) before a save.
11. **R5** — the spine and the search shard serialised compact (no
    indentation); the index regenerated; sizes in `STATUS.md`.
12. **R19/R18** — `CLAUDE.md`'s layout tree names every module under
    `src/` and `tools/`; the four sentences the review lists as
    contradicting the code corrected.

Done when: every item has its test; `node tools/validate.mjs --index`
byte-identical (with the history exemption gone) and `node --test` green
with `CHROME` set; a browser run from `?narrative=<id>&step=3` opens the
graph; `?actor=angola` is not blank; `STATUS.md` records the run; the
literal line `H9 done`.

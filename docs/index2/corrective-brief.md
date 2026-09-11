# Build brief — the index cycle's corrective run

Written by the closing reviewer of the second index cycle on 9 September 2026 (`docs/review-2026-09-09-index2-closing.md`, section 6). One run, on `m0`, before the map block. The assistant's sweep of 9–10 September ran every test file alone in a fresh clone with a headless Chrome and none hung, so the hang is the runner's: the two unbounded waits below are what turns it into a named failure.

## The run

**Gate.** Waits for the literal line `M44-0 done` in `STATUS.md` on `m0`
(already present). Runs on `m0`. Read `CLAUDE.md`, `STATUS.md` (deviations
445, 543, 551 and the I7 block), `docs/run-protocol.md`, then
`tests/browser.mjs`, `.github/workflows/validate.yml`, `tools/lib/history.mjs`
and `tests/history.test.mjs`. No record under `data/` is created or edited.
No historical claim is written. `data/index/` is not rebuilt.

**1. Bound the two waits in `tests/browser.mjs`.** `connect()` awaits a
WebSocket handshake with no bound; `withBrowser`'s `server.close()` waits for
every connection Chromium leaves behind. Give each a named timeout that
rejects with a sentence saying which wait it was and what was open, so a
hang becomes a failure with a name. Keep the existing per-test timeouts
deviation 543 added to `walk-browser`. Do not change what any test asserts.

**2. Give `node --test` a bound in the Action.** `.github/workflows/
validate.yml`'s Tests step runs `node --test` with no `--test-timeout`,
unlike `import-wikidata.yml`. Add `--test-timeout=120000`. **State plainly in
`STATUS.md` that this turns a hang into a red check rather than a green one,
that it is the owner's to overrule, and that item 1 is what should make it
never fire.** If `tests/workflows.test.mjs` pins the Tests step's command
line, update it in the same commit.

**3. Prove the hang is gone, or say what is left.** Run `node --test` whole
on `m0` and record the count and the wall time in `STATUS.md` against the
1,229 tests / 124 s measured on 9 September. Push and read the GitHub check;
if it is still not green, do not widen - record what the bounded run says the
hang is, by test name, which is the thing no run has been able to do so far.

**4. Give the renamed record's history the test amendment I7 A1 asked for.**
`tools/lib/history.mjs` merges the states under every alias's former path
(commit `44adf37`) and no test holds it. In `tests/history.test.mjs`, beside
the shallow-clone case, build a scratch repository: commit a record, commit a
change to it, `git mv` it to a new path and append the former id to
`aliases`, commit that, then assert `recordHistories` still lists the
versions from before the rename and that `from` is not `revised`.

**5. Cap the region grouping** (deviation 513) **only if it is one call.**
`lanesFor` already takes a `cap` option (dev. 514) and the region grouping
does not pass it. If passing it is a one-line change that leaves
`tests/timeline-browser.test.mjs` green, make it and record the before/after
row counts as the I6 table does. If it is not, leave it and say why in a
deviation.

**Not in this run.** The writer pages' whole-corpus load, the search shard,
`layoutGraph`, the manifest's size, the drafts backfill, and the PR-body
question - all of them are decisions or cycles, not corrections.

**Done when.** The two waits are bounded and named; `validate.yml` passes
`--test-timeout=120000` and `STATUS.md` says what that changes and that the
owner may overrule it; a full `node --test` count and wall time are recorded;
the rename-history test exists and passes; deviation 513 is fixed or
explained; `node tools/validate.mjs --index` is byte-identical without a
rebuild; every deviation from this brief is numbered on from 551 in
`STATUS.md`; and the last line of the `STATUS.md` commit body is the literal
line:

`Index cycle 2 corrective run done`

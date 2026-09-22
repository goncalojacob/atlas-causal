# Build brief — M78: the browser suite honest under load, round two

Not an owner instruction; the assistant's, from what the check did on 21
September. **The check is honest since M63, and today it was red seven times
on trees that were green elsewhere**, every time on a browser test and never
on a wrong value that survived a second look:

| when | branch | test | how it failed |
| --- | --- | --- | --- |
| 07:19 | main (M74 tree) | `spine-pages` — bars named before the last century lands | `waitFor` ran out |
| 10:49 | main (M75 tree) | `graph-labels-browser` 32 — named in full | `waitFor` ran out (12 s) |
| 10:57 | main, deploy | `spine-pages` 186 — every bar named | `waitFor` ran out |
| 11:08 | main, rerun | `compose-browser` 1 — clicked events become the steps | the whole file hit `--test-timeout` |
| 15:26 | m0 (M77 tree) | `m77-browser` 97 — every bar carries its title | seven bars unnamed at the assertion |
| 15:33 | m0, rerun | `m74-browser` 79 — a pane that changes size frames the walk | a step still on screen after the resize |
| 15:35 | m0, rerun 2 | (see `STATUS.md` when this brief is read) | |

The same trees passed on `m75`, `m76`, `m77` and on `m0` at 10:40, and
`m42`'s check — the same suite over a tree without M74–M77 — has passed
every time today. `git diff origin/m77 origin/m0` was empty when 97 and 79
failed. So it is the tests that race, not the atlas that regresses, and the
races are in the newest tests most of all.

## 1. What M63 established, and what has changed since

`docs/m63-load.md`: at the default concurrency three browser files ran on
four cores and a page still fetching when its `waitFor` ran out dropped a
different test every run; the fix was two passes with the browser files
serial (`tools/suites.mjs`), and two real defects in the atlas were found
under the noise. **Since then the browser files have gone from 18 to 29**
and every display milestone has added tests whose `waitFor` waits for a
*proxy* of the thing asserted:

- `m77-browser` 97 waits for the count of `text.bar-label` to be the same on
  two polls 50 ms apart, then asserts no bar is unnamed. A count is stable
  between two shards. **The wait must be the assertion itself**: no bar
  without a label, or the shard count the atlas says it is waiting on.
- `m74-browser` 79 resizes the pane and asserts a step is off screen. If the
  reframe is on the next animation frame or after a resize observer, the
  assertion can run first. **Wait for the reframe** — the camera's own
  signal — before asserting.
- The M63-era tests with a 12 s `waitFor` (32, 186, 1) hit it on a runner
  that had run twenty browsers before them. Whether those waits are for the
  right thing, and whether a warm-up or a longer bound is honest, is for
  the measurement to say.

## 2. What to do

1. **Reproduce first, on the sandbox, the way M63 did**: run the browser
   pass (`node tools/suites.mjs --browser`, serial) **five times** on the
   claimed commit and record which tests drop and how, in
   `docs/m78-flakes.md`. If the sandbox cannot make it happen, drive the
   runner: `validate.yml` has `workflow_dispatch`; run it on `m78` five
   times and read the logs. A rate is the deliverable of this step.
2. **Fix every racing test so its wait is the thing it asserts**, one commit
   per test, each commit's message saying what the proxy was and what it
   waits for now. `tests/browser.mjs` may gain a helper if three tests need
   the same wait; it does not gain a longer default timeout.
3. **If a wait exposes a real defect in the atlas** — a bar that never gets
   its title, a reframe that never comes — that is the atlas's, and it is
   fixed here with its test (M63 found two). Say which.
4. **Re-measure**: five consecutive green browser passes on the sandbox
   and five green `workflow_dispatch` runs on the runner, in the same file.

## 3. What this run must not do

No display change except a defect found in step 3, said so. No new record.
No change to `--test-timeout`, to the two-pass arrangement or to what a test
asserts — only to what it waits for. No test pins a count or a pixel. No test
is skipped, deleted or marked `todo` to make the pass green. Lane A numbers
deviations on from where M77 stopped.

## 4. Done when

`docs/m78-flakes.md` has the before rate, the list of tests changed with what
each waited for and waits for now, any atlas defect found, and the after
rate: **five of five green on both machines**. `STATUS.md` section; the
`pr-sections.md` section; `M78 done`.

# What the check is contending for

M63. The branch's check has been red since 17 September on a different browser
test each time, never on a wrong value and always on a `waitFor` that ran out.
Deviations 826, 844 and 876 established that it is not a regression and not one
test. This is the measurement that says what it *is*, taken before anything was
changed, so that the fix is chosen by a number rather than by a guess.

## The machine

The measurements below were taken on the sandbox that runs these builds: **4
cores, 16 GB of memory**, node v22.22.2 (`.nvmrc` says 22), Chromium 1194
headless. GitHub's `ubuntu-latest` is the same shape — the `What this runner
has` step of `validate.yml` prints `nproc`, `free -m` and node's own
`availableParallelism()` at the head of every run, so the comparison is in the
log of the check itself and not taken on trust.

That the sandbox reproduces the red is the first finding: **two of the three
full runs at the default settings failed here**, on two different tests, with
nothing changed between them. Everything below follows from being able to make
it happen on demand.

## How many browsers are open at once

`node --test` with no concurrency flag runs `availableParallelism() - 1` test
files at a time: **3 here, and 3 on the runner**. The suite is 147 files, of
which **18 start a browser** — 17 drive one over the DevTools protocol
(`tests/browser.mjs`) and `tests/entry-browser.test.mjs` renders with
`--dump-dom` — and **129 are pure**. The browser files hold 123 `withBrowser`
calls between them, and *each call launches its own Chromium and kills it
again*: a full run opens and closes about 130 browsers.

Sampled every 0.5 s through a full run, counting one browser per live
`--user-data-dir=/tmp/atlas-cdp-…` profile:

| simultaneous browsers | share of the run |
| --- | --- |
| 1 | 22 % |
| 2 | 57 % |
| 3 | 15 % |
| 4 | 7 % |

**The peak is four**: three browser suites scheduled together, plus one still
dying from the test before. Each Chromium is about six processes, so the peak
is **25 chrome processes** — on 4 cores, beside up to three node workers that
are themselves building indexes and parsing the whole corpus.

Memory is not the constraint and never was. Peak total RSS across the machine
was **3.4 GB**, with **14.2 GB still available** at the tightest moment of the
worst run. **The contended resource is the four cores.** A page that is
fetching its shards while three other browsers and three node workers are on
those cores does not answer inside `waitFor`'s 200 tries × 50 ms, and the test
that gives way is whichever one happened to be at that point in its file —
which is exactly the "different test each run" that 826 and 844 recorded.

## The number that decides it

Full runs, on an unchanged head, `node --test --test-timeout=120000`:

| run | how it ran | wall | result |
| --- | --- | --- | --- |
| A | default (3 files at once) | 189 s | **red** — `a drag of the band leaves the open explanation open…`, `the source card fetches its own citer file…` |
| A2 | default | 187 s | **red** — `the three views switch, the view is in the URL…`, `the source card fetches its own citer file…` |
| A3 | default | 179 s | green, 1,712 of 1,712 |
| B | `--test-concurrency=1`, everything | **379 s** | **green**, 1,712 of 1,712 |

**A full run at concurrency 1 is green and costs 2.0× the wall-clock** — 379 s
against 189 s. That is the single number the brief asked for, and it says the
contention is real and removable. It also says that paying it across the whole
suite is paying it where it is not owed: the 129 pure files have no browser in
them and no reason to run one at a time.

So the two halves were measured apart:

| pass | files | tests | how it ran | wall | result |
| --- | --- | --- | --- | --- | --- |
| C | the 17 driven browser suites | 176 | `--test-concurrency=1` | 154 s | green |
| D | the 129 pure suites | 1,536 | default | 90 s | green |

176 + 1,536 = 1,712, which is the whole suite: the two passes are a partition
and nothing is left unrun. **154 + 90 = 244 s** — 29 % more than the red run
costs today, and 135 s less than serialising everything.

## What was chosen, and what was not

**The browser suites run one at a time; the pure suites keep running in
parallel.** `tools/suites.mjs` is what tells the two apart, by reading each
file for an import of `tests/browser.mjs` or a call to `findChrome` — not a
list of names anybody has to maintain, so a browser suite written next month is
in the serial pass the day it is written.

What was not chosen, and why:

- **Raising the waits.** Tried in M62's run and recorded in deviation 844: with
  the one wait at `{ tries: 400 }` the explanation test passed and the failure
  moved to another test. It moves the symptom because the cause is the cores.
- **`continue-on-error`, a retry of the suite, or a `skip`.** A check that does
  not run the tests cannot report a head that is broken, which is the thing
  this milestone exists to undo. The suite is at 1,712 tests and 0 skipped
  before this change and at 1,712 and 0 skipped after it.
- **Serialising everything** (run B). Honest, and 135 s a run more expensive
  than serialising only what needs it.
- **A quarantine list.** The brief allows one only if the cause cannot be
  removed. It can be removed.

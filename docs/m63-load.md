# What the check is contending for

M63. The branch's check had been red since 17 September on a different browser
test every run, never on a wrong value and always on a `waitFor` that ran out.
Deviations 826, 844 and 876 established that it is not a regression and not one
test. This is the measurement that says what it *is*, taken before anything was
changed, so that the fix is chosen by a number rather than by a guess.

**It turned out to be five things and not one.** The load the brief named is
the first and the largest, and it is what hid the other four: with the
contention removed, the same suite still dropped a test in two of three runs,
and each of those was its own defect — two of them in the atlas itself.

## The machine

The measurements below were taken on the sandbox that runs these builds: **4
cores, 16 GB of memory**, node v22.22.2 (`.nvmrc` says 22), Chromium 1194
headless. GitHub's `ubuntu-latest` is the same shape — `validate.yml` prints
`nproc`, `free -m` and node's own `availableParallelism()` at the head of every
run and the cores and memory again at the end of the Tests step, so the
comparison is in the log of the check itself and not taken on trust.

That the sandbox reproduces the red is the first finding: **two of the three
full runs at the default settings failed here**, on two different tests, with
nothing changed between them. Everything below follows from being able to make
it happen on demand.

## 1. How many browsers are open at once

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
those cores does not answer inside `waitFor`'s 200 tries × 50 ms.

### The number that decides it

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
| D | the other 130 files | 1,536 | default | 90 s | green |

176 + 1,536 = 1,712, which is the whole suite: the two passes are a partition
and nothing is left unrun. (`tests/entry-browser.test.mjs` and its two tests
moved into the serial pass afterwards, on the rule below, so the passes as the
check runs them are 178 and 1,534.) **154 + 90 = 244 s** — 29 % more than the red run
costs today, and 135 s less than serialising everything.

**What was chosen: the browser suites run one at a time, the pure suites keep
running in parallel.** `tools/suites.mjs` is what tells the two apart, by
reading each file for an import of `tests/browser.mjs` or a call to
`findChrome` — not a list of names anybody has to maintain, so a browser suite
written next month is in the serial pass the day it is written. It refuses to
hand over an empty pass, because `node --test` with no files goes back to
discovering them all.

## 2. What was left when the contention was gone

Three consecutive serial browser passes, nothing else on the machine:

| pass | wall | result |
| --- | --- | --- |
| 1 | 176 s | **red** — `index.html asks for the core exactly 1 time(s)` |
| 2 | 175 s | **red** — `the source card fetches its own citer file…` |
| 3 | 158 s | green |

Two of three. Both failures are in `tests/spine-pages.test.mjs`, and neither is
load. They were measured one at a time, on the page, with the same driven
browser the suite uses.

**The source card forgot the rows the reader had asked for.** Clicking *Show
the remaining 926* expands the citers list, and every attribute shard that
lands rebuilds the card (`shardLanded` in `main.js` calls `panel.refresh()`).
The rebuild drew 200 rows again. Watched with a MutationObserver over twelve
presses: five rounds had **one** rebuild after the click and kept their 1,126
rows; one had **thirteen** and ended at 200. That last one is the test, and it
is also a reader losing a list they opened because a file arrived. Fixed in
`src/panel/source.js`: the card remembers which source is open wide. After it,
rounds with seven rebuilds behind the click keep all 1,126 rows.

**A rule was sampled at two different instants.** M62's lane-polygon assertion
reads the request list when the page becomes ready and counts the washes a
round trip later — and the shapes are fetched at about that same instant. Three
probes of `index.html` at the moment of readiness: the request was recorded
twice and not the third time, and the wash was on screen in none of them. A
page whose file landed between the two reads therefore failed for *drawing a
wash it never asked for*. The rule is unchanged and still asserted both ways;
both halves now come back from one evaluation, where a wash cannot be on screen
before the file it is filled from.

## 3. And what was left after that

The next ten-run attempt dropped `tests/m60-browser.test.mjs` twice more, and
the one after it dropped `tests/spine-pages.test.mjs` once in ten. None of the
three was load either.

**The browser was slowing the page down.** `tests/browser.mjs` launched
Chromium with `--headless --disable-gpu --no-sandbox` and nothing else. A
headless window can be taken for occluded or backgrounded, and a backgrounded
renderer has its timers throttled and its animation frames stopped — and the
atlas defers every replace-type write of the address bar to an animation frame
(`state.js`, `write`, so that a forty-frame drag is not forty history calls).
A frame that never comes is a URL that never changes. Five flags now say
otherwise: `--disable-background-timer-throttling`,
`--disable-backgrounding-occluded-windows`, `--disable-renderer-backgrounding`,
`--disable-ipc-flooding-protection` and `--disable-dev-shm-usage` — the last
because /dev/shm is 64 MB on a GitHub runner and a renderer that fills it dies
rather than slows. Measured after: animation frames arrive **sixty a second for
a minute, with no gap over 117 ms**.

**`show the world` was undone by a timer waiting behind it.** The map publishes
its own viewport to the state a moment after the reader stops moving
(`scheduleBbox`, `BBOX_SETTLE`), and the pane changing size — which is what
switching to the timeline is — schedules one too. The pin sets `bbox: null`;
the timer then fired and put the box straight back. Twelve presses before the
fix: **two left the address bar with the box still in it, and every one of the
twelve had the box back in the state**. After it, twelve of twelve clear and
stay clear. That is the check's `timed out waiting for the world back` — the
browser suite reporting a real defect that nobody could read as one.

**And one test still raced a frame it could wait for.** The view-switch test
read `location.search` immediately after clicking a view; the URL is written on
the next animation frame. It lost about one run in four, always as `the URL
says graph` with the view before it still there. One awaited frame between the
click and the read; what it asserts is untouched.

**The last one: a page that was ready before it had painted.** A paint timing
is recorded when the compositor has presented a frame, a frame or two behind
the elements a readiness expression looks for — so `sources.html never reported
a first contentful paint` dropped **one run in ten** on a page that was
perfectly well drawn. It is the harness's to fix and not the test's: `open()`
in `tests/browser.mjs` now waits for the paint as well as for the readiness
expression. A page that never paints still reaches the test, which has its own
assertion about that and a better sentence for it than a timeout.

## 4. What was not done

- **Raising the waits.** Tried in M62's run and recorded in deviation 844: with
  the one wait at `{ tries: 400 }` the explanation test passed and the failure
  moved to another test. It moves the symptom because the causes are elsewhere.
- **`continue-on-error`, a retry of the suite, or a `skip`.** A check that does
  not run the tests cannot report a head that is broken, which is the thing
  this milestone exists to undo. The suite is at **1,712 tests and 0 skipped**
  before this change and at 1,712 and 0 skipped after it.
- **Serialising everything** (run B). Honest, and 135 s a run more expensive
  than serialising only what needs it.
- **A quarantine list.** The brief allows one only if the cause cannot be
  removed. Five causes were found and all five were removed.

## 5. Ten runs on an unchanged head

Ten consecutive full runs of the check's own two passes — the pure suites at
the default concurrency, then the browser suites at `--test-concurrency=1` —
with nothing changed between them.

**On `9453aa49`, ten of ten green**, 1,712 tests and 0 skipped every time:

| run | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| wall | 266 s | 267 s | 268 s | 267 s | 270 s | 264 s | 261 s | 260 s | 263 s | 262 s |

Mean **265 s**, spread 260–270 s.

The ten before them, on `987e9ea7`, are the honest half of this: **nine green
and one red**, and the red is the paint timing above, found by this very
exercise and fixed in the head the ten above ran on.

| run | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| wall | 270 s | 266 s | 271 s | 268 s | 266 s | 267 s | 263 s | 269 s | 267 s | 265 s |
| | ok | ok | ok | ok | ok | ok | ok | ok | **`sources.html never reported a first contentful paint`** | ok |

## 6. What the check costs now

| | before | after |
| --- | --- | --- |
| here, a full run | 179–189 s, **red about two runs in three** | 260–270 s, green |
| the runner's Tests step | 247 s on the last green run of the old arrangement (run 895); 327 s on the red one after it | **314 s** (run 901); 346 s and 405 s on the two before it |

**The check is about 40 % dearer here and about 27 % dearer on the runner, and
it is green.** Three consecutive runs of `validate` on this branch — 898, 900
and 901, on three different heads — are successes, which had not happened since
17 September.

**The standing instruction to ignore the check can be dropped from the next
brief.** What it was protecting against is gone: a red check now means a test
has something to say, and the four kinds of thing this milestone found are each
either removed or reported at the point where they are true. What it cost to
keep it — a milestone unable to see its own regressions, twice — is the reason
the instruction should not come back without a measurement behind it.

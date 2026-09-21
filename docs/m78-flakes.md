# What the browser suite was racing

M78, and the second time this has been asked. `docs/m63-load.md` is the first:
the check had been red since 17 September on a different browser test every
run, and the answer was five separate things, of which the largest was
contention for four cores and two of the others were defects in the atlas.

The check has been honest since then. On 21 September it went red seven times
on trees that were green elsewhere — every time a browser test, never a wrong
value that survived a second look, and `git diff origin/m77 origin/m0` was
empty when two of them failed. The browser files have gone from 18 to 29 since
M63, and the brief's reading was that **it is the tests that race, not the
atlas that regresses, and the races are in the newest tests most of all**.

That reading is right about the tests and wrong about the atlas: the measuring
found one defect in the atlas as well, and it is the one that made a test look
the flakiest.

## The machine, and what was run

The sandbox these builds run on: **4 cores, 16 GB**, node v22.22.2, Chromium
1194 headless — the same shape as `ubuntu-latest`, which `validate.yml` prints
at the head and foot of every run. The pass measured is the check's own second
one, the browser suites one at a time:

```
node --test --test-timeout=120000 --test-concurrency=1 $(node tools/suites.mjs --browser)
```

29 browser files, 228 tests, 0 skipped.

## 1. Before: three of five red, here

Five consecutive browser passes on the claimed commit `21677710`, nothing
changed between them:

| pass | wall | tests | result |
| --- | --- | --- | --- |
| 1 | 249 s | 228, 0 skipped | **red** — `m77-browser` 95, `the pointer names it (still loading)` |
| 2 | 248 s | 228, 0 skipped | green |
| 3 | 246 s | 228, 0 skipped | green |
| 4 | 245 s | 228, 0 skipped | **red** — `timeline-browser` 214, `after the window was made short: the pane holds the drawing and nothing else — 295 !== 280` |
| 5 | 244 s | 228, 0 skipped | **red** — `m77-browser` 95, `the pointer names it (still loading)` |

**Three of five, on two tests, neither of which the brief had named.** That the
sandbox reproduces it on demand is the first finding, as it was in M63, and
everything below follows from it.

On the runner, the same commit: run 1150 (push) and run 1152
(`workflow_dispatch`) both green. The runner's seven reds of 21 September are
the brief's table and were on earlier trees; nothing here re-runs them.

## 2. Where the headroom actually is

Before changing any wait, the obvious question: are these waits running out of
time, or ending too early? `until` — the poll every wait in the suite is
written over — was instrumented to print how many of its 200 polls each wait
actually used, and one full browser pass was run under it. **366 waits.**

| polls used, of 200 | waits |
| --- | --- |
| 0 | 282 |
| 1 | 58 |
| 2–3 | 15 |
| 4–6 | 10 |
| ran out | 1 |

**The worst honest wait in the whole pass used 6 polls of 200** — 300 ms of a
ten-second bound. Not one wait in the suite is anywhere near its bound on this
machine, so a longer bound would have bought nothing here, and none was taken:
`tests/browser.mjs` keeps the same 200 × 50 ms it had, and `--test-timeout`
and the two-pass arrangement are untouched.

That is also the answer to the brief's question about the M63-era 12 s waits in
`spine-pages` 186, `graph-labels-browser` 32 and `compose-browser` 1. Two of
them do not want a longer bound; see §5.

The one that ran out is the second defect of §4.

## 3. The races, measured one at a time

Each was measured on the page before anything was changed.

**A title arrives with its century.** This is the shape behind most of what
follows. The picture is drawn out of the core and the names arrive a shard at a
time behind it (`src/attributes.js`): a bar, a mark and a node are drawn
unlabelled and labelled when their century lands, and until then the control
says `still loading`. So **a count of labels is the same number on either side
of a shard landing**, and a count that has not moved in 50 ms says nothing at
all about whether anything has been named. Six of the tests below waited on
exactly that.

### `m77-browser` 95 — the mark the pointer names

Three of five passes. The test hovers the first mark *outside* an open
narrative's walk and asserts the pointer names it; it waited for "a label
exists", which the walk's own twenty-eight labels satisfy at once.

Three rounds of the page watched every 100 ms:

| | walk drawn | some label | off-walk marks still loading | last name in |
| --- | --- | --- | --- | --- |
| round 0 | 355 ms | 355 ms | 87 of 87 | 651 ms |
| round 1 | 329 ms | 329 ms | 87 of 87 | 626 ms |
| round 2 | 397 ms | 397 ms | 10 of 13 | 639 ms |

Round 2 is the failure exactly: both of the test's waits are satisfied at
397 ms with ten of the thirteen off-walk marks unnamed. A mark with no name is
a mark the hover layer draws nothing over, so `on` is 0 and the assertion is
read against a page nobody asked to be ready.

### `timeline-browser` 214 — the rows after a resize

One of five. A MutationObserver over the svg's `height`, three rounds, one
resize from a 900 px window to a 400 px one:

| round | the writes |
| --- | --- |
| 0 | `280` against a pane already at `295`, then `295`, 2 ms later |
| 1 | the same, 4 ms apart |
| 2 | the same, 3 ms apart |

**One resize lays the rows out twice**, and the first of the two is measured
against a pane the timeline has already left. The test waited for "the height
is not the tall one", which the first write satisfies, and `fits` then read
`scrollHeight 295` against `svgHeight 280`.

### `m74-browser` 79 — the reframe

A MutationObserver over the graph viewport's `transform`, three rounds:

| round | at the opening size | after the resize |
| --- | --- | --- |
| 0 | 417 ms, 421 ms | 460 ms |
| 1 | 395 ms, 399 ms | 511 ms |
| 2 | 393 ms, 398 ms | 434 ms |

**The camera moves twice at the opening size**, 4 ms apart, after the walk is
already drawn — the arrangement lands and the frame is taken again. The test
read `before` between those two and waited for "the transform is not `before`",
which the second of them satisfies without the resize having been taken up at
all. The walk is then asserted against a camera framed for the pane the page
opened in, and a step is off the screen.

### `graph-labels-browser` 32 — which mark is the longest

`LONGEST` reads every mark's own title to find the longest name on the page,
and a title arrives with its century. Six rounds of `?view=graph&from=1900&to=1999`:

| rounds | the mark picked | its length | marks still loading |
| --- | --- | --- | --- |
| 0, 2, 5 | `constitutional-revision-1982` | 57 | 37 of 83 |
| 1, 3, 4 | `2022-portuguese-social-democratic-party-leadership-election-…` | 59 | 3 of 83 |

The test then opens that event, zooms on to it and waits ten seconds for a
label carrying exactly that name — **a different question every run**, and the
wait that ran out on the runner at 10:49.

The `3 of 83` in the settled rows is §4.

### `timeline-browser` 225 and the rest of `fits` — the first layout

`READY` is a lane existing, which is as true of the first layout as of the
settled one: the masthead wraps and a scrollbar comes and goes, so the timeline
is laid out twice on an ordinary visit with nothing resized. One run in six
read `a 1400 px window: the pane holds the drawing and nothing else — 1295 !==
1276`. Six tests read `FIT` and hand it to `fits`; all six could read the
first layout.

### `timeline-browser` 217 — the band's label

One run in twenty-four, as `and says which event it is: '' !== 'Fixture event
F'`. The band is drawn out of the core and its label out of the shard; the test
waited for the rect.

### `m77-browser` 94 and 98 — the same proxy, not yet caught

94 waits for the count of the walk's marks to be unchanged 50 ms apart and then
asserts every step is named. 98 waits for the count of bars to be unchanged
after a click and then asserts the picture has narrowed *and* is named. Neither
had dropped yet; both are the same wait as 95's and 97's.

### `map-browser` 126 — the link, found by the re-measurement

One browser pass in five of the *first* re-measurement, as `the link says so:
null`. The test clicks the rivers switch and reads `?layers=` straight after
the drawing has answered; the address bar is written on the next animation
frame instead, so that a forty-frame drag is not forty history calls
(`state.js`). Two tests higher up the same file already wait for the link and
say why in a comment; this one did not.

A re-measurement that finds one more is the measurement doing its job, and it
is the reason the after rate below is five of five and not four.

## 4. The two defects in the atlas

### The first: the graph draws marks it can never name

**Since M76 the graph is not windowed, and the shards held on screen still
were.** The owner asked on 21 September for a picture that always shows all
dates, so the graph draws every century — while `onScreenShards` in `main.js`
pinned the shards the *band* covers. The rest are fetched unpinned, the cap of
four evicts the oldest of them, and every record carried only by an evicted
shard is stripped of its title (`data.js`, `evictIfOver`). The graph is left
holding marks it has drawn and can never name.

Measured on `?view=graph&from=1900&to=1999`, three rounds, sampled at 0, 1, 4
and 10 seconds:

| | marks | still loading at 0 s | at 1 s | at 4 s | at 10 s |
| --- | --- | --- | --- | --- | --- |
| round 0 | 87 | 40 | 3 | 3 | 3 |
| round 1 | 87 | 40 | 3 | 3 | 3 |
| round 2 | 87 | 40 | 3 | 3 | 3 |

All twelve attribute shards had landed. The three are the same three every
round — `indigenous-depopulation-of-the-greater-antilles`,
`portuguese-landfall-in-brazil-1500` and
`governorate-general-of-brazil-1549` — and they are in the files the page
fetched. That is a reader looking at a picture the atlas has the names for and
will not say, and it is also what made `graph-labels-browser` 32 pick a
different mark run to run.

**Fixed in `src/main.js`**: what the graph draws is pinned while the graph is
the view. At the whole extent that is every shard, which is what a reader at
the whole extent already holds; the map and the timeline are untouched, because
there the band still decides what is drawn. After it, `still loading` is 0 in
every round at every sample. The test is in `spine-pages.test.mjs` — *the graph
names every mark it draws, however narrow the band* — and it fails on the
commit before the fix and passes on it.

### The second: the timeline stops laying itself out

This is §6 of the first draft of this file — *one thing seen once and not
reproduced* — and it is here because the re-measurement saw it again, which is
what a re-measurement is for.

The symptom: the window is made short, made tall again, and the rows stay at
the short pane's height **for ever**, with the pane scrolling a drawing three
times smaller than itself. Red as `back at 900 px: the pane holds the drawing
and nothing else — 795 !== 295`, in one browser pass in five.

It was not reproduced at first: 12 rounds idle, 25 under load, 60 under load
with the test's interleaving, 8 full runs of the file. What all of those had in
common is a browser reused between rounds. **With a fresh browser each round,
as the suite itself uses, it came back at one round in thirty**; the observer's
own decisions, recorded in the page:

    observed 1280x295   queued=false  last=1280x795
    draw     now=1280x795              last=1280x795   -> equal, no render
    observed 1280x795   queued=false  last=1280x795
    draw     now=1280x795              last=1280x795   -> equal, no render

The ResizeObserver in `src/timeline.js` kept a string of the pane's size and
skipped the render when it had not moved — reading that size **live, a frame
after the observation**. When the pane comes back to the remembered size in
between, the observation is thrown away. And the atlas draws the timeline from
more than one place: `remeasure` in `main.js` draws it too, so the pane can be
observed at 295, drawn at 295 by that other path, and be back at 795 by the
time the frame runs. The observer reads "unchanged", and the rows are left laid
out for a pane nobody is in, with nothing that will ever ask again.

**Fixed in `src/timeline.js`**: `render` already asks the right question — its
key carries the pane's width and height and is set by whoever last drew, from
any path — so the guard was both redundant and wrong. A frame later,
unconditionally, is the loop protection M77 added and the whole of the guard.

| | stuck | rounds |
| --- | --- | --- |
| before | 3 | 90 |
| after | 0 | 60 |

Its test is `timeline-browser` 215, which is what caught it.

These two are the only display changes M78 makes.

## 5. What was not changed, and why

**`spine-pages` 186 and `compose-browser` 1 were left alone.** 186's two waits
are already its assertions — every attribute shard has arrived, and no bar is
unnamed — and the instrumented pass puts both at 0 polls of 200 here. Its
runner failures and `compose-browser` 1's are a different mechanism, and one
the repository has already written down: M42's deviation 1009, the same
afternoon, records `withBrowser`'s own thirty-second deadline firing on the
*first* browser test of a file with `duration_ms 30107`, a browser that never
answered rather than a wait for the wrong thing. It was reproduced here once,
at six times the check's own load — six pure passes beside the browser pass —
as `the page never answered: 30 s waiting for …` in `timeline-browser`'s
*a parent's bar is ringed in the packed rows and when it is held*, at
`duration_ms 31004`.
That deadline is `tests/browser.mjs`'s and a candidate for its own measurement;
raising it is not this milestone's to do, and the brief rules out a longer
default bound.

**Nothing was skipped, deleted or marked `todo`.** 228 tests and 0 skipped
before this milestone and 229 and 0 after it — the one added is the defect's.

**No bound was raised**, no test's assertion was changed, and no test pins a
count or a pixel: every number compared below is read off the page and compared
with another read off the page.

## 6. After: five of five, on both machines

Five consecutive browser passes on the sandbox, on the finished tree
(`7fc97ed6`), nothing changed between them:

| pass | wall | tests | result |
| --- | --- | --- | --- |
| 1 | 248 s | 229, 0 skipped | green |
| 2 | 250 s | 229, 0 skipped | green |
| 3 | 251 s | 229, 0 skipped | green |
| 4 | 248 s | 229, 0 skipped | green |
| 5 | 249 s | 229, 0 skipped | green |

And five `workflow_dispatch` runs of `validate.yml` on `m78`, on the same
tree — both passes, the records validated, 1,680 pure tests and 229 browser
tests each:

| run | started | conclusion |
| --- | --- | --- |
| 1164 | 17:45 | success |
| 1165 | 17:56 | success |
| 1166 | 18:05 | success |
| 1167 | 18:16 | success |
| 1168 | 18:25 | success |

The two `push` runs on that head, 1160 and the one for this file, are green
beside them and are not counted in the five.

**Three of five red before, five of five green after, on both machines.** The
wall time is unchanged — 244–251 s here, against the 244–249 s of the red
arrangement — because nothing was made to wait longer: every wait that moved
moved to a condition that is true *later* than the proxy only when the proxy
was lying.

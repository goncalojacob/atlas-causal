# M85 — the first review's remainder: the first picture, the words on the controls, the public pages, and two structural clean-ups

Lane A, on the branch `m85`, gated on `M84 done` on `m0`. Written 22
September 2026 by the assistant under the standing orders
(`docs/assistant-standing-orders.md`, §4: display fixes and structural
improvements from the reviews are briefed and landed without asking).
Everything here is from `docs/review-2026-09-22.md` — part A's findings 4,
12, 14, 15, 16 and 17 and part B's 13 and 14, the ones M82, M83 and M84 did
not take — plus one test the day's landings showed to be brittle. Nothing
here changes what the atlas says about history.

## 1. The first picture is the whole span (A4)

**Seen.** `opensOn()` in `src/util/window.js` opens a crowded corpus on its
densest century, so the resting map is 1900–1999: nothing of 1492–1899, one
mark at Lisbon carrying "+46", and Africa, Asia, Russia and Central Asia
nearly empty. The owner's goal is the whole world since 1492; the resting
picture said "Portugal in the 20th century".

**Do.** At rest the window is the corpus's whole extent (`atlas.extent`,
1492 to the present), main events only, which M65 already makes cheap: every
view draws the main events over the whole span, the band spans the whole
axis, and the reader narrows from there. `opensOn()` and `crowded()` go, or
stay for nothing — say which, and take their tests with them where they
assert the century. A stack's label is a count in the words the map's stack
title already uses, never a bare "+46" that reads as a typo. The masthead
count (M83 B3) says the count of that picture.

**Tests, first.** The resting state's resolved window equals the data
extent; the first paint on the fixtures draws main events from more than one
century on each view; no label on a stack matches `/^\+\d+$/`.

## 2. The graph's control speaks the reader's language (A12)

`src/graph-filters.js` says "draws [two links or more ▾]". M83 (B10) removed
"top level only". Measure whether the degree floor still changes the resting
picture now that M65 rests on main events; if it does, the control says what
it does — "Show events with at least 2 connections" — and if it does not,
the control goes and `STATUS.md` says so with the measurement. Test: the
control's visible text contains no "links or more", or there is no control.

## 3. The intro's claim is computed (A14)

`src/intro.js` line 118: "Every link carries a written explanation and its
sources." Compute it: the count of active edges with a non-empty explanation
and at least one source, against the count of active edges. If every edge
has both, the sentence stays and a test holds it against the index; if not,
the sentence says "N of the M links carry a written explanation and their
sources", from the manifest, and the same test holds the numbers. No number
is pinned in the test.

## 4. Two labels (A15)

`src/timeline.js` 851–854 prints "borders as of YYYY" on a view that draws
no borders: the line is the map's and appears there only. `src/share.js` 159:
the button says "Export as SVG"; its title stays. Tests: the timeline's
masthead never contains "borders as of"; the button's text says what the
file is.

## 5. The about page is one screen (A16)

`about.html` is 40,000 characters of design essay that opens with "thirty-seven
of the records in the current test dataset happened in Lisbon". It becomes
one screen — what the atlas is, who makes it, where the records come from
and what the confidence values mean, the licence, what is coming — in words
that `README.md` and the intro already use, with the essay kept whole and
unedited under it as `essay.html`, linked from the about page's foot. No
sentence about history is written; the one-screen page says only what the
repository already says of itself. Test: `about.html` is under a bound the
run states in its `STATUS.md` section and links to `essay.html`; `essay.html`
holds the former text byte for byte after its head.

## 6. The bibliography groups the base maps (A17)

`sources.html` (written by `tools/build-index.mjs`) says "65 sources …
11,901 citations" with historical-basemaps at 8,175 and CShapes most of the
rest, so a reader sees a map-dataset atlas. The page lists the map datasets
under their own heading, "Base maps and borders", with their own count, and
counts the historical works separately above them. Test: the two headings
exist and the two counts add up to the manifest's.

## 7. `emphasis.js` assembles once (B13)

`assemble` returns `pathIds`, `consequenceEdges`, `walkedEdges` and
`convergingEdges` beside the id sets it already computes, and `map.js`,
`timeline.js` and `graph-view.js` read them instead of rebuilding them
(review B13 cites the lines). The wheel factor `Math.exp(±deltaY * 0.0015)`
is one export, `WHEEL_FACTOR`, in `src/util/window.js`, imported by
`map.js` and `graph-view.js`. A stack's title is composed in one place. The
`shown` contract of `emphasis.js` is unchanged, and the tests that hold it
say so.

## 8. Rules held by shape, not by grep (B14)

`tests/m68.test.mjs` 102 and 113 and `tests/m76.test.mjs` 230 hold rules by
scanning source text. Keep the behavioural assertions; replace each source
scan by the module boundary it stands for (the legend takes what it draws as
an argument; the window control exposes no input) or drop it where the
behavioural test already holds the rule. `tests/m64.test.mjs`'s band rule is
held by `WHEEL_FACTOR` being imported, not by the absence of a string.

## 9. The band-drag test waits for what can redraw the card

`tests/panel-browser.test.mjs` 306 ("a drag of the band leaves the open
explanation open") waits for the attribute shards only; on 22 September a
shard of another kind landed after the drag, the panel drew the card again
for it, and pull request #20 went red on a commit the push run had passed.
Read `refresh` in `src/panel/panel.js`; either the panel patches rather than
rebuilds when a shard lands and the state is unchanged (which is the test's
own promise), or the test waits for every shard the panel can redraw for.
Say which in `STATUS.md` and why.

## Must not

No record, no historical claim, nothing under `data/`. No new hex value,
token or type size. `emphasis.js`'s `shown` contract unchanged. `validate
--index` clean; tests before behaviour (711, 717); no test pins a count or a
pixel — a test that reads the corpus derives its expectation from the corpus
it runs on (22 September's lesson, `docs/assistant-standing-orders.md` §4).
Lane A numbers deviations on from M84. Ignore `docs/drafts/`.

## Done when

Each of the nine sections is done, or refused in `STATUS.md` with the
measurement that refused it; screenshots `docs/screens/m85-first-screen.png`
(the atlas at rest, desktop) and `m85-about.png`, every other picture
`tools/screens.mjs` rewrites restored; the check on `m85` green; the
`STATUS.md` section; the section in `docs/history/pr-sections.md`; `M85 done`.

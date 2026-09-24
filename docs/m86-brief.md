# M86 — what a funder meets first: the second review's reader and display findings

Lane A, on the branch `m86`, gated on `M85 done` on `m0`. Written 24
September 2026 by the assistant under the standing orders (§4: display fixes
and structural improvements from the reviews are briefed and landed without
asking). Everything here is from `docs/review-2026-09-24.md`: part A's
findings 1, 2, 4, 6, 7, 8, 9, 10 and 11 and part B's 1, 2 and 3. Read each
finding at the lines it cites before touching anything. Nothing here changes
what the atlas says about history.

## 1. The provenance paragraph leaves the card body (A1)

580 of 858 active events carry a `summary` that quotes the article's lead
and then says, in the record, that nobody has read it and where review.html
is; `src/panel/event.js` puts it on the card verbatim, so the message the
demo flag removed from the chrome is in the first paragraph of most cards.
The card renders the quoted lead alone with one credit line ("From
Wikipedia, revision N →" linking the revision), and shows the provenance
sentences only under `?review=1` (`src/demo.js`). Detect the importer's
shape by its markers (the opening "The English Wikipedia article", the
"Wikidata item Q" sentence), never by length. Nothing in the record changes.
Test: with the flag off, no card's body contains "review.html" or "nobody has
read"; with it on, the provenance is there.

## 2. The first map has names (A2, A11)

`src/map/labels.js` `LABEL_ZOOM = 4` writes no name until the fourth zoom,
so the resting world is sixty numbered circles. At rest, at any zoom, the ten
heaviest clusters in view are labelled (the placer already takes `priority`
and `weight`; event labels get a floor of 1 instead of `LABEL_ZOOM`), and a
stack carries a badge only when it hides two or more (`src/cluster.js`
`stackBadge` returns '' for a stack of two; the double ring already says
"more than one here"). Test: the resting map at 1440 × 900 carries at least
one label; no badge reads "1 more".

## 3. The about page's paragraph (A4)

`about.html` says every explanation is written by a person and, in the same
paragraph, that the records are an unreviewed test dataset a person reviews
"before this site is public", on the public site. Three plain sentences
instead, saying only what the repository says of itself: records are drafted
from Wikipedia and Wikidata with an assistant; every link is cited; a person
is reading them, and each record's review state is shown under `?review=1`.
No sentence about history.

## 4. The timeline's right edge (A6)

`src/timeline.js` pads the domain by 4 % of the span (about 21 years each
side), so the axis runs to 2040 and the last names are cut by the pane.
Clamp the domain's right end to `extent.max + 1`, and anchor a label whose
bar ends within `labelRoom(name)` of the right edge to the left of its bar.
Test: no tick beyond the extent's last year; every resting label's box is
inside the pane.

## 5. Three card polish items (A8, A9, A10)

The source card labels a WorldCat link with its raw URL (`src/citation.js`
`label: source.url`): label with the host from `new URL(href).hostname` and
keep the URL in `title`. The card head prints "(gregorian)" and "the state's
own point" (`src/vocab.js`): omit the calendar when it is the default, and
omit the coarse place line when the card already says the map washes a
region. The map's key is closed on a first visit: open by default on a
desktop at rest, collapsed under the existing `max-width: 720px` breakpoint.

## 6. The graph after a drag (B1)

Since I6 only stacks inside the rectangle are in the DOM; a drag applies the
transform and nothing renders until the next wheel, click or state change,
so a reader who zooms and pans sees empty ground. On `pointerup` after a
move, render once (the key carries the rectangle); better, book one render
per animation frame during `pointermove`. Test (graph-browser): zoom, drag
half a pane, every stack inside the new rectangle is in the DOM.

## 7. A resize keeps the reader's camera (B2)

`frameCamera` keys on the question and the rectangle and re-fits on any
resize — a panel opening, a lens chip wrapping the masthead — so a camera the
reader wheeled is thrown away; that is PR #24's ring-ratio flake. When only
the rectangle changed and the camera was moved, keep it and translate so the
old centre stays centred; record which layout the camera was set on and let
a re-fit through only when the layout is new; show the waiting note whenever
a layout job is pending. Test: read k, wheel, assert the stroke against
1/k_before, after waiting for the lens chip and a transform equal across two
frames.

## 8. The degree control under a lens (B3)

Every selection is a lens, and the floor is off inside a lens, so "Show
events with at least 2 connections" does nothing from the first click until
the reader clicks the ground. Disable the control while a lens is on, with a
title that says why, or hide the group as the map's layers are hidden. Test:
with an event selected, the control is disabled or absent.

## 9. The pictures nobody has seen (A7)

Take `docs/screens/m86-graph.png` and `m86-timeline.png` at rest at
1440 × 900 and at phone width, after 2, 4 and 6; if the 1900s column of the
graph is a tangle, cap resting labels by weight as in 2. Restore every other
picture `tools/screens.mjs` rewrites.

## Must not

No record, no historical claim, nothing under `data/`. No new hex value,
token or type size. `emphasis.js`'s `shown` contract unchanged. `validate
--index` clean; tests before behaviour (711, 717); no test pins a count or a
pixel, and a test that reads the corpus derives its expectation from the
corpus it runs on. Lane A numbers deviations on from M85. Ignore
`docs/drafts/`.

## Done when

Each of the nine sections is done, or refused in `STATUS.md` with the
measurement that refused it; the screenshots of 9; the check on `m86` green;
the `STATUS.md` section; the section in `docs/history/pr-sections.md`;
`M86 done`.

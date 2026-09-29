# Build brief — M89: what a reader met on the third review

The third Fable review's part A (`docs/review-2026-09-26.md`, the live site
at snapshot 11, 25 September) met the site as a funder would on a laptop and
a phone. What it found that display code can fix is below, in the order a
funder meets it. Every section names the finding; the review's evidence is
the specification.

**Branch `m89`, never `m0`, `m42`, `m42b`, `m88` or `main`.** Gated on
`M88 done` on `origin/m0`. The 21 and 22 September amendments in
`docs/run-protocol.md` and `docs/assistant-standing-orders.md` apply. Tests
before behaviour (711, 717); no test pins a count or a pixel of position; a
test over the live corpus derives its expectation from the corpus; no new
hex value, token or type size; no runtime dependency, build step, map
library or database; nothing under `data/`, no record, no historical claim
— every section quotes only what the records say. Deviations continue from
M88's. `M89 done` on `STATUS.md` when all eleven are.

## 1. Nothing on the page prints an id where a title goes, and the intro redraws off the atlas (A1)

`src/intro.js`, `src/lens-chips.js`, the composer: while a title is missing
print `LOADING_LABEL` (`src/attributes.js`), never `e.id`; the intro, the
chips and the composer subscribe once and redraw when the atlas's attribute
count (`arrived`) has moved since they last drew, and check again on
`visibilitychange`, so a lost frame cannot leave the card on its slugs.
Browser test at rest after `settledShards`: no `.intro-go` text and no
`.lens-name` text equals its `data-id` or the loading label; a second test
hides the document (`document.hidden` faked) across a landing and asserts
the same after it is shown.

## 2. The phone's first map shows the world, and a lens frames its marks (A2)

`src/map/map.js`: on `PHONE` at rest, fit the whole world to the width and
give the spare height to the timeline strip and the sheet's grip, or keep
the cover crop but centre it on the events in view rather than the
projection's centre — pick the one whose screenshot reads better and say
which. On any lens, on any device, frame the camera on the lens's marks as
the graph's `frameCamera` frames its question. Tests: on `PHONE` at rest
more than one region's marks are inside the viewport; on `PHONE` with
`?focus=actor:nigeria` at least one event mark is inside the viewport. A
new `docs/screens/m89-map-phone.png`.

## 3. An umbrella's card says what its parts link to (A3, the card half)

`src/panel/event.js`: on an umbrella whose own outgoing links are zero, the
consequences section reads "The N events inside it link to M other events"
and lists them, read off the parts' edges; no edge is written, nothing is
claimed. Pure test over the live corpus: for every main event with children
and no edge of its own, the card's sentence names the count computed from
the parts' edges.

## 4. "What most of it hangs on" is picked with a rule, not by degree alone (A4, the list half)

`src/intro.js` `heaviest()`: the six by `subtreeWeight + weight`, at most
one per lane and none from the same century twice; a display rule that
quotes only records. Pure test over the live corpus: the six span at least
four lanes and no century repeats; a fixture test with a corpus of one
region asserts the fallback (fill by weight).

## 5. The resting timeline writes a name only where it fits (A5)

`src/timeline.js`: labels go through a placer like the map's `placeLabels`
(a name whose box hits a bar or another name is not written and the bar is
a stub), so the picture after 1900 has fewer names and every one readable;
or, if the afternoon allows, stretch the axis by density as the graph does
since M81 with tick labels saying where the stretch is — the placer first,
the stretch as a second commit if it is done. Test over the live corpus:
no two drawn label boxes intersect and no label box crosses another row's
bar; the last label is not cut at the right edge.

## 6. Badges go through the placer and every lane gets a name (A6)

`src/map/labels.js`, `src/cluster.js`: "N more" badges are placed with the
names (a badge that collides with a name or another badge is dropped; the
double ring already says "more than one here"); the resting names are
chosen with a floor of one per lane, the heaviest event of each of the five
regions always named, the rest by weight. Test over the live corpus: no
two drawn labels or badges intersect at 1280 wide; every lane with an event
in view has at least one name.

## 7. A year in the search box finds the events of that year (A7, the year half)

`src/search.js`, `src/search-box.js`: a query of four digits also matches
every entry whose `when` covers it, shown as its own group "Events in
1857", capped at the box's limit and ordered by weight. Pure test over the
live corpus: `search(entries, '1857').groups` includes the year group with
every active event whose span covers 1857 (computed in the test), capped.

## 8. The category control's count says what it kept and why (A8, the sentence half)

`src/category-control.js`: with a category chosen the count reads "35 wars,
and 151 events without a category still drawn" (numbers from the corpus in
view). Pure test over the live corpus deriving both numbers.

## 9. The essay page stops contradicting the about page (A9)

`essay.html`: the sentence "Nothing here is generated by a language model"
and its clause become the about page's paragraph (drafted with an
assistant, every link cited, review state under `?review=1`); "test
dataset" and the Lisbon count go; "the first slice is Portuguese expansion"
becomes "the first records were Portuguese expansion; the atlas now runs
1492 to 2026 over five regions". `review.html`'s "every record" sentence
likewise. Pure test: neither page contains "language model", "test
dataset" or "first slice".

## 10. The actor lens's chip says what it is showing (A10, the chip half)

`src/lens-chips.js`: "Japan: 38 events, and the 76 inside them", numbers
from the lens. What the lens holds is the owner's decision (§6, question
12) and does not change here. Pure test over the live corpus deriving the
two numbers for one actor.

## 11. The edges: the strip's years, the head line, the keys (A11)

`src/window-control.js` or its CSS: the strip's first year anchored `start`
and the last `end` inside the pane at every width and with the panel open;
`src/panel/event.js` and `src/style.css`: the head line wraps under
`max-width: 720px`; "no place: timeline only" becomes "no single place", or
nothing when a region is printed; the graph's and the timeline's keys open
at rest on a desktop as the map's is. Browser tests: the two year labels'
boxes are inside the pane at 1280 and 390 and with the panel open; the head
does not overflow the sheet on `PHONE`; the three keys are open at 1280.

## Noted, not asked

A12 (the first screen's 128 requests and 1.7 MB) needs nothing before the
demo; if the phone ever feels slow, drop `src/validate/rules.js` from the
front page's import graph and preload the core and the 1900s shard.

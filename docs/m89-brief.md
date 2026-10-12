# Build brief: M89, the display fixes from the third review's reader findings

Part A of the third Fable review (`docs/review-2026-09-26.md`) read the live
site at snapshot 11 on 25 September, as a funder would on a laptop and a
phone. This brief lists what it found that display code can fix, in the order
a funder meets it. Each section names its finding. The review's evidence is
the specification.

## Conditions of the run

The run works on branch `m89`. It never pushes to `m0`, `m42`, `m42b`, `m88`
or `main`. It starts once `M88 done` is on `origin/m0`. The 21 and 22
September amendments in `docs/run-protocol.md` and
`docs/assistant-standing-orders.md` apply.

- Tests come before behaviour (711, 717).
- No test pins a count or a pixel of position.
- A test over the live corpus derives its expectation from the corpus.
- No new hex value, token or type size.
- No runtime dependency, build step, map library or database.
- Nothing under `data/`, no record and no historical claim. Every section
  quotes only what the records say.

Deviations continue from M88's. The run writes `M89 done` on `STATUS.md` when
all eleven sections are done.

## 1. Nothing on the page prints an id where a title goes, and the intro redraws off the atlas (A1)

Files: `src/intro.js`, `src/lens-chips.js` and the composer. While a title is
missing, they print `LOADING_LABEL` (`src/attributes.js`) and never `e.id`.
The intro, the chips and the composer subscribe once. Each redraws when the
atlas's attribute count (`arrived`) has moved since it last drew, and checks
again on `visibilitychange`. A lost frame then cannot leave the card showing
slugs.

Tests. A browser test at rest after `settledShards` asserts that no
`.intro-go` text and no `.lens-name` text equals its `data-id` or the loading
label. A second test hides the document (`document.hidden` faked) while a
shard lands, and asserts the same after the test shows the document again.

## 2. The phone's first map shows the world, and a lens frames its marks (A2)

File: `src/map/map.js`. On `PHONE` at rest, choose one of two fixes:

1. Fit the whole world to the width, and give the spare height to the
   timeline strip and the sheet's grip.
2. Keep the cover crop, and centre it on the events in view instead of on
   the projection's centre.

Pick the one whose screenshot reads better and say which. On any lens and on
any device, frame the camera on the lens's marks, the way the graph's
`frameCamera` frames its question.

Tests. On `PHONE` at rest, the marks of more than one region are inside the
viewport. On `PHONE` with `?focus=actor:nigeria`, at least one event mark is
inside the viewport. Add a new `docs/screens/m89-map-phone.png`.

## 3. An umbrella's card says what its parts link to (A3, the card half)

File: `src/panel/event.js`. When an umbrella has no outgoing links of its
own, its consequences section reads "The N events inside it link to M other
events" and lists them. The card reads them off the parts' edges. It writes
no edge and claims nothing.

Test. A pure test over the live corpus checks every main event that has
children and no edge of its own. The card's sentence must name the count
computed from the parts' edges.

## 4. A rule picks "What most of it hangs on", with degree as one input (A4, the list half)

File: `src/intro.js`, function `heaviest()`. It picks six events by
`subtreeWeight + weight`, at most one per lane and never two from the same
century. This is a display rule and quotes only records.

Tests. A pure test over the live corpus checks that the six span at least four
lanes and that no century repeats. A fixture test with a corpus of one region
checks the fallback, which fills the six by weight.

## 5. The resting timeline writes a name only where it fits (A5)

File: `src/timeline.js`. Labels go through a placer like the map's
`placeLabels`. When a name's box hits a bar or another name, the placer drops
the name and the bar stays a stub. The picture after 1900 then has fewer
names, and every one is readable. If the afternoon allows, also stretch the
axis by density, as the graph has done since M81, with tick labels that show
where the stretch is. The placer comes first. The stretch, if done, is a
second commit.

Test over the live corpus. No two drawn label boxes intersect. No label box
crosses a bar in another row. The right edge does not cut the last label.

## 6. Badges go through the placer and every lane gets a name (A6)

Files: `src/map/labels.js` and `src/cluster.js`. The placer places the
"N more" badges together with the names. It drops a badge that collides with
a name or another badge, since the double ring already says "more than one
here". The placer chooses the resting names with a floor of one per lane: the
heaviest event of each of the five regions always has a name, and weight
decides the rest.

Test over the live corpus at 1280 wide. No two drawn labels or badges
intersect. Every lane with an event in view has at least one name.

## 7. A year in the search box finds the events of that year (A7, the year half)

Files: `src/search.js` and `src/search-box.js`. A query of four digits also
matches every entry whose `when` covers that year. These matches form their
own group, "Events in 1857", capped at the box's limit and ordered by weight.

Test. A pure test over the live corpus checks that
`search(entries, '1857').groups` includes the year group, holding every active
event whose span covers 1857 (computed in the test), capped.

## 8. The category control's count says what it kept and why (A8, the sentence half)

File: `src/category-control.js`. With a category chosen, the count reads "35
wars, and 151 events without a category still drawn". The numbers come from
the corpus in view.

Test. A pure test over the live corpus derives both numbers.

## 9. The essay page stops contradicting the about page (A9)

Changes to `essay.html`:

- The sentence "Nothing here is generated by a language model" and its clause
  become the about page's paragraph: drafted with an assistant, every link
  cited, review state shown under `?review=1`.
- Remove "test dataset" and the Lisbon count.
- "the first slice is Portuguese expansion" becomes "the first records were
  Portuguese expansion; the atlas now runs 1492 to 2026 over five regions".

Make the same change to the "every record" sentence in `review.html`.

Test. A pure test checks that neither page contains "language model", "test
dataset" or "first slice".

## 10. The actor lens's chip says what it is showing (A10, the chip half)

File: `src/lens-chips.js`. The chip reads "Japan: 38 events, and the 76 inside
them", with numbers from the lens. What the lens holds is the owner's
decision (§6, question 12), and this section does not change it.

Test. A pure test over the live corpus derives the two numbers for one actor.

## 11. The edges of the screen: the strip's years, the head line, the keys (A11)

- In `src/window-control.js` or its CSS, anchor the strip's first year at
  `start` and its last year at `end`. Both stay inside the pane at every
  width and with the panel open.
- In `src/panel/event.js` and `src/style.css`, the head line wraps under
  `max-width: 720px`.
- "no place: timeline only" becomes "no single place", or nothing when the
  card prints a region.
- The graph's key and the timeline's key open at rest on a desktop, as the
  map's key does.

Browser tests. The boxes of the two year labels are inside the pane at 1280
and 390 and with the panel open. The head does not overflow the sheet on
`PHONE`. The three keys are open at 1280.

## Noted and left for later

A12 (the first screen's 128 requests and 1.7 MB) needs nothing before the
demo. If the phone ever feels slow, drop `src/validate/rules.js` from the
front page's import graph, and preload the core and the 1900s shard.

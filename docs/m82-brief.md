# Build brief — M82: the first screen

From the review of 22 September (`docs/review-2026-09-22.md`, part A, the
reader's findings) and the owner's standing orders: the atlas is *"a demo
to show the platform"* to win funding, and a funder's first minute is what
this milestone is about. **Read part A whole** (findings A1–A17) and fix
the ones listed here, in this order. Each fix must hold on the phone as
well as the desktop.

1. **A3 — the site says what it is.** One sentence under the title on the
   first screen, in the reader's words: *"The history of the world since
   1492 as a graph: every event linked to what caused it and what it led
   to, with sources."* The intro card (`src/intro.js`) is rewritten in those
   words — no *walk*, *lens*, *focus*, *chip*, *other branches* before the
   first click — and the count line says what a main event is once, in a
   title or a first-visit hint.
2. **A2 — the review vocabulary goes off the demo.** The masthead's "N of M
   read", every card's "Unread: no person has checked this record", the
   "unchecked" tags on sources, and the "Discuss this record" / "Edit this
   record" links are hidden behind one flag that is off for the published
   site (the standing orders: review and contribution are deferred until
   funding). The narratives' author line reads as the atlas's own, not
   "assistant draft, unreviewed". Nothing under `data/` changes.
3. **A1 — the graph at rest is readable.** At rest the graph draws the main
   events only (M65 says so; the reviewer measured 154 nodes at the degree
   floor against 245 main — find which rule adds the rest and make rest
   mean rest), every drawn node carries its name (M77's rule extended to
   the resting picture: whole or on a nearby free line, never truncated,
   never omitted), time is stretched across the width by default (M81's
   axis at rest as under a lens), and the LINKS key collapses to a button
   on a phone.
4. **A5 — the "N events in this window have no place" banner** becomes a
   small note in the masthead's count line, not a box on the map.
5. **A6 — the timeline's headings collide and the axis is drawn twice**: the
   band's years no longer overprint the axis ticks, and two umbrella names
   on one row are laid out as M77 lays out titles.
6. **A10 — "Read the full entry →"** is shown only when an entry exists;
   the prerendered entry pages resolve or the link is not offered.
7. **A7, A8, A11 — a key on the map and the timeline; one name for "go
   back" everywhere (the card's own words, chosen once); the link card's
   heading is the two ends with the type between them, not the type alone.**
8. **A9 — on a phone the picture gets more than a third of the screen**: the
   sheet and the masthead give way to the view as the reviewer describes.

## What this run must not do

No new record, no historical claim, nothing under `data/`. No new hex
value, token or type size (a wording change is not a token). The lens, the
band, M79–M81 unchanged in behaviour. `validate --index` clean; tests before
behaviour (711, 717); no test pins a count or a pixel. Lane A numbers
deviations on from M81. Nothing merged into `main`; ignore `docs/drafts/`.

## Tests

One per numbered fix, asserting the property (a sentence exists under the
title; no element with the review vocabulary when the flag is off; every
resting graph node has a whole label; no `.map-unplaced` box; no two
timeline headings overlap; no entry link without an entry; a key exists on
each view; one back-word; the phone's view is over half the height).

## Done when

The eight hold on the real page; screenshots `docs/screens/m82-*` before and
after at desktop and phone width, restoring every other picture
`tools/screens.mjs` rewrites; `STATUS.md` section; `M82 done`.

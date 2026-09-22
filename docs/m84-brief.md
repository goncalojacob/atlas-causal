# Build brief — M84: the owner's feedback document

`docs/feedback-2026-09-22.md`, items 1 and 2; item 3 is M80 and is verified
here on the live page, not rebuilt.

## 1. A cross closes a card

> *"Here you can see the 'close' button. Instead it should be a simple
> cross on the top right corner."*

Every card in the panel — event, actor, place, source, narrative, edge —
closes with a text link "close" in its heading line (the picture: a source's
card, *"Norrie MacQueen · 1997 · BOOK · close · Focus on this"*). It
becomes **one cross (×) in the card's top right corner**, the same control
on every card, with an accessible name ("Close"), a keyboard path (it is a
button; Escape still closes as it does today if it does), and the size of a
touch target on a phone. The word "close" leaves the heading line; "Focus
on this" and the rest stay where they are. No new hex value, token or type
size: the cross is a glyph in the existing type, on the existing tokens.

## 2. The dimmed neighbours are told apart

> *"Regarding direct connections to events that are shown dimmed out, they
> are easily confused, I suggest showing them in a different colour."*

With an event open, the one-hop ring — the events directly connected to the
chosen one that are not its parts — is drawn dimmed (M65's `parentsOf` and
the ring), and reads as "greyed out, not here" rather than "connected to
this". Draw the ring in **a distinct colour from the existing palette**
(`style.css`'s tokens; the confidence and category inks are already there
to choose from — say which and why), on all three views, at full opacity
for the mark and its label, with the picture's own emphasis rules unchanged
otherwise: the chosen event and its parts in ink, the ring in the distinct
colour, everything else absent. The key on each view names the colour. **No
new hex value**: if no existing token reads as "connected, not chosen" the
run says so in `STATUS.md` and picks the closest, rather than adding one.

## 3. Verify M80 on the live page

Open a line on the graph at
https://goncalojacob.github.io/atlas-causal/?view=graph and confirm the
card shows type, ends, confidence, sources with locators, summary; note the
result in `STATUS.md`. If anything is missing, it is a fix here.

## What this run must not do

No new record, no historical claim, nothing under `data/`. No new hex
value, token or type size. `emphasis.js`'s `shown` contract unchanged.
`validate --index` clean; tests before behaviour (711, 717); no test pins a
count or a pixel. Lane A numbers deviations on from M83. Nothing merged
into `main`; ignore `docs/drafts/`.

## Tests

1. Every card kind has exactly one close control, a button named "Close",
   positioned in the card's top right, and no "close" text link.
2. With an event open, a ring mark's fill or stroke differs from a dimmed
   mark's and from the chosen mark's, on the map, the graph and the
   timeline, and the key names it.

## Done when

Both hold on the real page; screenshots `docs/screens/m84-*` before and
after (a card; an event open with its ring); `STATUS.md` section; `M84
done`.

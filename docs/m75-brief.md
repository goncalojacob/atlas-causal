# Build brief — M75: the band is always on the map

The owner, 21 September, after M60 moved the window to the masthead and M64
put it back behind a button: *"still don't like the way years are selected
when looking at the map, should be more intuitive"* — and, asked what shape
the fix should take: **"The dates two-handled band should not be hidden."**

## 1. What that settles

Two things, and both are the owner's call:

- **It is the band** — two handles, a range — not a single-year scrubber.
  M64's `src/window-band.js`, which the timeline view and the strip already
  share, is the right control; nothing is rebuilt.
- **It is not hidden.** The `dates` button goes. On the map the strip is
  present from first paint, every visit, with no mode to enter and nothing
  to remember. A reader arrives, sees the years, and drags.

## 2. What to build

**M64's strip, permanently open on the map view.** The 44-unit overlay it
draws — the two years on their own row, the shade and its handles, the
profile of where the events are — is the thing; what changes is that it no
longer waits to be asked for.

- **It stays an overlay, not a row of the grid.** M60's gain — the map pane
  is the whole layout's height — is kept, asserted as a property. This is not
  the old bottom strip coming back; it is a slim band drawn *over* the map's
  top edge, where M64 put it.
- **The map answers while the reader drags**, as M64 already asserts before
  `pointerup`.
- **The `dates` button and the remembered toggle go.** `panes.js` loses the
  key; a stored value from M64 is read into nothing, which is a preference
  with nowhere to apply and not an error (deviation 848's rule).
- **The masthead's number fields stay.** Typing is for when the year is
  known; the band is for when it is not; both write the same `from` and
  `to`. The masthead's density hint may go if the strip's profile makes it
  redundant beside it — measure whether a reader loses anything, and say.
- **The timeline and the graph are unchanged.** The timeline has the band
  as a view of its own; the graph has no place for it. The owner said *"when
  looking at the map."*
- **On a phone**, the strip is still not hidden. If 44 units over a
  390-pixel-wide map is too much, make it slimmer there and say so in
  `STATUS.md` — but do not put it behind a button again.

## 3. What this run must not do

No new record and no historical claim. **No new hex value, token or type
size.** No change to `lanes.js`, `cluster.js`, `emphasis.js` or
`window-band.js`'s gestures. **First paint must not get slower** — the strip
now costs its 3.4 ms at first paint rather than on first open; measure it
and say so, and if it is more than that, say why. `validate --index` clean;
tests before the behaviour they judge (711, 717). Nothing merged into
`main`; ignore `docs/drafts/`.

## 4. Tests

1. **A first visit to the map has the band on screen**, with no button
   pressed and nothing in storage.
2. The map pane is the layout's own height with the band present — the
   property, not a pixel.
3. Dragging a handle changes `from`/`to` **and the map answers during the
   drag** (M64's test, unchanged).
4. No `dates` control exists in the document; the masthead fields still
   set the window; the timeline view still draws its own band.
5. No test pins a count or a pixel.

## 5. Done when

The band is on the map from first paint on every visit; the button is gone;
the pane is still the layout's height; screenshots under
`docs/screens/m75-*.png` at desktop and phone width; `STATUS.md` says what
first paint costs now against M64's numbers; tests green; `M75 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

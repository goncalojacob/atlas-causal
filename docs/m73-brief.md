# Build brief — M73: a reader can see how sure the atlas is

The owner, 21 September: sources first (M72), *"then I think the confidence
visibility thing makes sense."* This is the second half.

## 1. What is already there and what a reader cannot see

Every edge carries `confidence` — `consensus`, `probable` or `disputed` — and
the card says it. **Nothing drawn says it.** On the graph an edge's line
encodes its *type* (the dash patterns per `--edge-*` token) and nothing about
whether the atlas is sure; a contested link and an established one are the
same line. The walk the map draws for a narrative is the same.

## 2. What to build

**Confidence is visible on every drawn edge, from one place.** One module
maps a confidence to what is drawn, and the graph's edges, the map's walk
lines and any other line that stands for an edge read it — so no two
pictures can disagree about which link is the shaky one.

- **Within the palette that exists.** Type already owns the dash pattern;
  confidence takes the dimension that is left — weight, or the opacity the
  dimmed state already uses — **using existing tokens only**. If three
  confidences cannot be told apart with what exists, draw two (`disputed`
  against the rest) and say so in `STATUS.md`. **No new hex value, token or
  type size.**
- **A `disputed` edge must read as doubtful at a glance** — that is the one
  the reader most needs to see.
- **The legend says what the difference means**, in the graph's existing
  legend, in one line.
- The card keeps saying it in words; this milestone adds the picture.

## 3. What this run must not do

No new record and no historical claim. No change to `lanes.js`, `cluster.js`
or `emphasis.js`. **First paint must not get slower.** `validate --index`
clean; tests before the behaviour they judge (711, 717). Nothing merged into
`main`; ignore `docs/drafts/`.

## 4. Tests

1. Three edges of three confidences render three **distinguishable** styles
   on the graph, asserted from computed style in the DOM, not from class
   names.
2. The map's walk line and the graph's edge for the same record agree,
   asserted from the shared module.
3. The style vocabulary uses only tokens `src/style.css` already declares —
   asserted the way M66 asserted the halo's colours.
4. No test pins a count.

## 5. Done when

A disputed edge looks disputed on the graph and on the map; the legend says
so; screenshots under `docs/screens/m73-*.png`; `STATUS.md` says what
dimension confidence took and what first paint costs; tests green; `M73 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

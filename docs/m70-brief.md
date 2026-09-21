# Build brief — M70: dead code out, standing in

Two small things the owner decided on 21 September.

## 1. The graph's semantic collapse is removed

M65 left M30c's fold as dead behaviour: at rest there are no parts in the
picture to fold, inside a lens nothing is folded, `collapseLayout` never runs,
and its tests still pass. **The owner: "Remove it."** Take out
`src/graph-view/collapse.js` and every branch that reaches it (`parts.js`,
`panel/event.js`, `panel/panel.js`, `graph-view.js`), and the tests that hold
it to a rule nothing follows. **What it said — *there is more inside this
one* — the resting rule says by hiding the parts, and the ring M30c put on the
mark stays**, because that is the part a reader still sees. Say in `STATUS.md`
what was removed and what the graph does now where it used to fold.

## 2. A reader can see what has been read

9,336 records are `draft` and 11,058 citations are unchecked, and the atlas
draws all of it by the owner's decision. **The owner: "Add a standing marker,
that's a good idea."** Two places, one source:

- **On the card.** Every record's card says its standing in one line — read by
  whom, or *unread* — from `review` and the signature, the same fields the
  validator counts. A citation that has not been checked against its source
  says so beside the citation.
- **In the masthead**, beside the count M64 put there: how many of the events
  in view have been read. Computed from the same fields, so the two cannot
  disagree.

**Nothing changes what is drawn.** A draft is still drawn. This is honesty on
the surface, not a filter — and it must not become one.

## 3. What this run must not do

No new record and no historical claim. **No new hex value, token or type
size.** No change to `lanes.js`, `cluster.js` or `emphasis.js`. **First paint
must not get slower.** `validate --index` clean; tests before the behaviour
they judge (711, 717). Nothing merged into `main`; ignore `docs/drafts/`.

## 4. Tests

1. No module under `src/` imports `collapse.js`, asserted structurally.
2. A draft record's card says *unread*; a reviewed one names its reviewer —
   from a fixture, not a count.
3. The masthead's read count and the cards agree, from the shared source.
4. A draft is still drawn.
5. No test pins a count.

## 5. Done when

The fold is gone; the marker is on the card and in the masthead; screenshots
under `docs/screens/m70-*.png`; `STATUS.md` says what was removed and what
first paint costs; tests green; `M70 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

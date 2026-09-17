# Build brief — M58: a long event's bar must not say "still loading" for ever

M50 found this and was forbidden to fix it, which was right — it was writing
records, not display. It is now the oldest known defect in the atlas.

## 1. The fault, in the words of the run that found it

> An attribute row is written into the shard of its event's **start** century,
> and a view fetches the shards its **window** covers. An event long enough to
> reach into the window from an earlier century is drawn — correctly, it is in
> the window — with its name in a file nobody asked for, and its bar reads
> "still loading" for ever.

Two records do it today: **`the-atlantic-slave-trade-to-brazil`**, whose row is
in `attributes-1500-1599` and whose interval runs to the 1860s, and
**`indigenous-depopulation-of-coastal-brazil`, 1500 to 1997**. M42's volume
would multiply them, and every long process the atlas will ever hold has this
shape.

Read `tools/build-index.mjs` (the attributes pass and how shards are named),
`src/attributes.js`, `src/large.js`, `src/timeline.js`, `tests/spine-pages.test.mjs`
(**which now states the rule and exempts exactly the bars it explains** — that
exemption comes out when this lands), and M50's account in `STATUS.md`.

## 2. What to decide, and it is a real choice

Either **the row goes in every shard its span touches** — simple, correct, and
it grows the index by however much the long events weigh — or **a view fetches
the shards its window covers plus an index of what reaches in from outside**.
**Measure both before choosing**: what the first costs in bytes over the
corpus as it stands, what the second costs in a second fetch. Write the
measurement and the choice into `docs/m58-shards.md` **before** changing the
build, the way M51 wrote its overlaps before joining anything.

**Neither answer is allowed to change what the reader sees except to fix it.**
A bar that said "still loading" says the event's name and draws.

## 3. What must stay true

No new record and no historical claim. No new runtime dependency, build step,
map library or tiles. **First paint must not get slower** — say what it costs
before and after. No new token, hex value or type size. `validate --index`
clean; the index rebuilt and committed with any change to how it is built;
tests before the behaviour they judge (711, 717).

## 4. Tests

1. An event whose span starts in one century and reaches into the window is
   drawn **with its name**, not as "still loading".
2. The two records above are the case, and the test names them by property —
   *an event whose start century differs from the window's* — **not by id**.
3. First paint fetches no more shards than it does today for a window that
   contains no long event.
4. No test pins a count.

## 5. Done when

`docs/m58-shards.md` carries the measurement and the choice; the exemption
comes out of `spine-pages`; both bars draw their names; `STATUS.md` says what
the index weighs before and after and what first paint costs; `validate
--index` clean; tests green; `M58 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

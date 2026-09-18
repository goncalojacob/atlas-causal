# Build brief — M62: the events that other events are part of

The owner, 18 September, on why the timeline is hard to read:

> **"the timeline has too many events and gets very confusing because most
> events don't have a parent. For example, a lot of portuguese political events
> before 1974 could have as a parent 'Portuguese Dictatorship' or something
> like that... This way everything would be way more organized"**

## 1. Measured, 18 September

**304 active events. 12 have a parent. 292 are top-level.** Everything is a
peer of everything, which is exactly what the owner is looking at.

And the reason is structural: **`estado-novo` exists as an *actor*. There is no
Estado Novo *event*.** The atlas has the regime as a thing that acts and
nothing that anything can be *part of*, so there is no parent to point at even
where the relation is obvious.

This also explains a milestone that has been reporting success while doing
nothing: **M48 built a top-level-only filter for the graph** and said plainly
that it hid ten nodes and was waiting for hierarchy. It has been a no-op for a
week — the filter is right and the hierarchy was never written.

## 2. The bar changes, and that is deliberate

**M47 wrote a parent only where the corpus already implied it**, and refused to
invent one from the assistant's own knowledge. That refusal was correct then
and it is why there are twelve. **This milestone creates the umbrella events
that were missing**, which is a larger and different job, and the owner has
asked for it.

**An umbrella is a real period with a sourced span, not a bucket invented for
tidiness.** Its dates come from Wikipedia or Wikidata under the owner's
decision of 16 September, cited on the record like any other claim. If a period
has no name a source will give it, **it is not an umbrella and you do not make
one up**.

## 3. The rule for a child, which a date alone cannot settle

**Inside the umbrella's span *and* inside its subject.** Ninety parentless
events start between 1926 and 1974 — and that window holds the **Wall Street
Crash**, the **Great Depression**, the **Holocaust** and **Vargas's Brazil**.
Filing those under Portuguese politics would be worse than leaving them flat.

So a child must also be the umbrella's own: its `actors` or its place put it
inside the regime, the war, the revolution that the umbrella names. **Where
that is arguable, leave the event top-level and list it** — a flat event is
honest, a wrongly-filed one is not.

**`parent` remains a display fact and never an argument** (`CLAUDE.md`): saying
the decree is part of the regime takes no edge and asserts no cause. **Rule 24**
holds the tree — one parent, the parent is an active event, no cycle — and a
child dated outside its parent is a warning you should not be producing.

## 4. Measure before you write, as M51 and M58 did

**`docs/m62-umbrellas.md` first, in its own commit**: the candidate umbrellas
the corpus crowds around, each with the span a source gives it, how many
parentless events fall inside its span, how many of those are also inside its
subject, and the verdict. **Then** create the umbrellas and attach the children.

Start where the crowd is thickest. The Portuguese political events before 1974
are the owner's own example and the obvious first; the colonial wars, the two
world wars and the Brazilian dictatorship are the others the corpus suggests.
**Do not try to file all 292.**

## 5. What this run must not do

No causal claim and no edge — this is `parent` and the umbrella records only.
**No invented date.** No new record type, confidence value, hex value, token or
type size. **No display change** — M48's filter and M60's views already read
`parent`; this milestone gives them something to read. `validate --index`
clean, **records first, rebuild, then the index** (deviation 798). Tests before
the records they judge (711, 717). Nothing merged into `main`.

## 6. Tests

1. Every umbrella created here has a **cited span**.
2. Every child's `actors` or place **intersects its umbrella's subject** —
   asserted as a property, not a list of ids.
3. Rule 24 holds: one parent, active, no cycle, and **no child dated outside
   its parent**.
4. The top-level count **falls**, and `STATUS.md` says from what to what.
5. No test pins a count of events or umbrellas.

## 7. Done when

`docs/m62-umbrellas.md` carries the candidates, the counts and the verdicts;
the umbrellas exist on cited spans; their children point at them; the
arguable ones are listed rather than filed; `STATUS.md` says how many events
are top-level now against 292; `validate --index` clean; tests green;
`M62 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

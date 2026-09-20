# Build brief — M67: the rest of the corpus finds its parents

The owner, 20 September: *"you can do everything that is left including what
was in the backlog."* The first thing left is the one M65 named out loud.

## 1. Why this is first

M65 made choosing an event a filter and put the resting picture at **the main
events only — 242 of 309**. It also said plainly that a cut of a fifth *"will
not feel like much until far more of the 242 have somewhere to hang."* That is
the state the owner is looking at now: the map, the graph and the timeline at
rest still draw 242 peers.

Measured on 20 September: of the 242 main events, **205 start in 1900 or
later** — 67 in 1900–1949, 84 in 1950–1999, 54 since 2000. **Forty-eight main
events name no actor and no place at all**, so no rule that reads a record can
file them anywhere; M62 found seven of those (the Portuguese presidential
elections) and this is the whole set.

## 2. Two jobs, in this order

**First, the forty-eight get their lines.** An event whose title says what it
is and whose record says nothing is one actor or one place away from being
filable. Write the line the record is missing — the actor that did it, the
place it happened — **from the source the record already cites**, and cite it
on the line. Where the record cites nothing usable, look it up under the
owner's decision of 16 September (Wikipedia and Wikidata, `probable`), and
where even that gives no actor the atlas has a record for, **leave it and list
it**. No new actor is created here to make a line possible; that is M42's job.

**Then, umbrellas round two.** M62's rule stands unchanged — **inside the
umbrella's span *and* inside its subject** — and its measure-first discipline
with it: `docs/m67-umbrellas.md`, in its own commit, before any record. The
candidates come from where the 242 crowd, which is the twentieth century, and
M62's own refusals are the map of what to look at again:

- **World War I** was refused because eight of sixteen events in its span
  named no actor. **After the first job those events have actors.** Re-measure
  it; if it now qualifies, build it, and if it still does not, say what the
  actor lines changed and what they did not.
- **The Cold War** was refused because "part of the Cold War" *is* the
  argument. **That refusal stands.** Do not re-open it.
- **The PREC** was refused on a disputed span. **That stands** until `parent`
  can carry a hedge, which it cannot.
- **The Brazilian chain** and **the Russian chain** M50–M53 wrote are the two
  other places events crowd; the Vargas era and the military dictatorship
  already stand as umbrellas, and the Empire, the First Republic and the
  Soviet period may. Measure them.

**Do not try to file all 242.** File what the rule files; list the rest.

## 3. What this run must not do

**No causal claim and no edge** — this is actor lines, place lines, `parent`
and umbrella records only. **No invented date and no invented actor.** No new
record type, confidence value, hex value, token or type size. **No display
change.** `validate --index` clean, records first, rebuild, then the index
(deviation 798). Tests before the records they judge (711, 717). Nothing
merged into `main`; ignore `docs/drafts/`.

## 4. Tests

1. Every actor or place line written here **cites a source**.
2. Every umbrella created here has a **cited span**, and every child is inside
   its span *and* its subject — the property, not a list.
3. Rule 24 holds and **no child is dated outside its parent**.
4. The count of main events **falls**, and the count of events with neither
   actor nor place **falls**; `STATUS.md` says both from what to what.
5. No test pins a count.

## 5. Done when

`docs/m67-umbrellas.md` carries the measurement; the forty-eight are lined or
listed; the umbrellas that qualified exist; `STATUS.md` says how many events
are main now against 242 and how many still name nothing; `validate --index`
clean; tests green; `M67 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

# Build brief — M59: the hundred and one that end at a file boundary

## 1. What is left of the seam

M51 closed the 26 pairs where an actor ending in 1885 had a counterpart
beginning in 1886. **101 actors still end in exactly 1885 and 105 still begin
in exactly 1886 with nothing to join them to.** Measured 17 September.

Those end dates are still false in exactly the way M51's were: 1885 is where
Historical Basemaps stops and 1886 is where CShapes starts, and **neither is a
fact about any polity**. The difference is that a singleton has no partner, so
the join that fixed the 26 is unavailable.

Read `docs/m49-actors.md` (the survey, which lists all of them),
`docs/m51-overlaps.md` (**the method: measure first, choose the cut from the
numbers, put everything near the cut to a person**), `docs/m52-brief.md` A1 and
M53's relaxation of it, `CLAUDE.md`, `schema/v1/actor.json`.

## 2. The three things a singleton can be, and they must be told apart

1. **A polity that really did end near then** — rare, and only Wikidata can
   say so. Cite it and leave the span.
2. **A polity that continued under a name the other import spells differently**
   — the pair M51's matcher missed. **Territory answers this**: run M51's
   overlap tool against every 1886-side actor and look for a match the name
   missed. A high overlap with a differently-named record is the same finding
   M51 acted on, reached by geometry instead of by string.
3. **A polity the later import simply does not carry** — colonies absorbed,
   entities CShapes never modelled. Its end date is then **the horizon of the
   source**, not a dissolution, and the honest thing is to say so on the record
   rather than to leave a bare `1885`.

**Do 1 and 2 where the evidence is there; for 3, mark rather than guess.** How
you mark it is yours to design, but **it must not be a new record type or a new
field invented for the occasion if an existing one will carry it** — look at
what `origin` and `sources` already say, and prefer making the existing note
explicit.

## 3. What must stay true

**No invented date.** Every date cites a QID and property or is copied from a
record with its own source. Rule 11: a record and everything naming it move in
one commit. Presences **move**; geometry is never redrawn. No display change.
`validate --index` clean, **records first, rebuild, then the index** (deviation
798). Tests before the records they judge (711, 717).

## 4. Tests

1. No active actor ends in exactly 1885 **without** either a cited dissolution,
   a join, or a mark saying the date is the source's horizon.
2. Every join this milestone makes rests on a measured overlap, and the
   measurement is in `docs/m59-singletons.md`.
3. No test pins a count of actors.

## 5. Done when

`docs/m59-singletons.md` accounts for all 101 and all 105; the ones territory
pairs are joined; the ones Wikidata dates are dated; the rest are marked as
ending at the source's horizon rather than at a dissolution; `validate --index`
clean; tests green; `M59 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

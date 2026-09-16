# M52 — Russia split on what is cited, and the successions whose dates meet

The owner's first complaint about this atlas was a chip reading **"Russia
(Soviet Union)"**: CShapes' entity `gwcode 365` carrying the Russian Empire,
the Soviet Union and the post-Soviet state under one actor. M51 closed the
1885/1886 seam and left this open. This milestone writes the part that is
cited, leaves visible the part that is not, and turns the owner's rule about
successions into a check the validator makes.

Two things are in this file because they are the same argument. A succession
is a claim that one polity took another's place; it is false when the dates do
not meet, and it is unwritable when no source gives the dates at all. Section
1 is the rule and the four relations it caught. Section 2 is Russia.

---

## 1. A succession's dates have to meet (amendments A1, A2, A3)

### 1.1 The rule

The owner, 16 September: *"I still don't agree that it can be marked as
successor event if the dates are not matching."*

A gap between a predecessor's end and a successor's start does not mean the
dates are imprecise. **It means something else held that ground in between,
and `succeeded` is then a false label rather than a rough one.** A test that
only forbids overlap passes every one of the four below.

So: **a `succeeded` relation is written only where the predecessor's end and
the successor's start meet** — the same year, or the year boundary between
them. Where they do not, the relation is not written, and what is missing is
named.

This is **rule 30** in `src/validate/rules.js`, over every active `succeeded`
relation, and it is documented in `ARCHITECTURE.md` beside rule 19 where the
other things a relation must satisfy are. What it does *not* refuse is the
other direction: a successor that begins before its predecessor ends leaves no
ground unexplained, and that pair is already reported by the warning
`relation-outside-actor-when`.

### 1.2 The audit

All 88 active `succeeded` relations, 16 September. **84 are contiguous** — 77
of them meet in the same year and 7 across a year boundary. Four are not:

| gap | predecessor | ends | successor | starts |
|---|---|---|---|---|
| +26 y | `east-timor-under-portugal` | 1976 | `east-timor` | 2002 |
| +11 y | `zambia-under-united-kingdom` | 1953 | `zambia` | 1964 |
| +4 y | `taiwan-under-japan` | 1945 | `taiwan` | 1949 |
| +3 y | `singapore-under-united-kingdom` | 1962 | `singapore` | 1965 |

No relation in the corpus runs the other way by more than nothing: there is no
active succession whose successor begins before its predecessor ends.

### 1.3 What was done, and what each one leaves open

**The four are retracted, and no actor was invented to fill the gaps.**
Retracting a false statement needs no source; making the true one does, and
each of these gaps has an occupant that a historian would name at once and
that this atlas has no record of. Naming them is its own work, with its own
sources. The reason is on each record's own `retraction` block, which is where
it belongs and where nothing deletes it; what follows is the index, and the
question each retraction leaves standing.

Both records of every pair, and all their territory, are untouched. What is
withdrawn is only the claim that one followed the other **directly**.

- **`east-timor-under-portugal--east-timor--succeeded`**, 1976 → 2002, a gap
  of 26 years. CShapes ends entity 860's Portuguese period on 1976-07-16 and
  begins the independent state on 2002-05-20. *The question:* what held East
  Timor between those two dates, and whether it is one record or two.
- **`zambia-under-united-kingdom--zambia--succeeded`**, 1953 → 1964, a gap of
  11 years. *The question:* what held that ground from 1953, and why CShapes
  draws a boundary in 1953 at all — the colony does not end there in any sense
  the atlas currently records.
- **`taiwan-under-japan--taiwan--succeeded`**, 1945 → 1949, a gap of 4 years.
  *The question:* who administered Taiwan between the end of the Japanese
  period and the date the atlas gives `taiwan`, and whether `taiwan`'s own 1949
  is the founding of anything or the arrival of a government that already
  existed elsewhere.
- **`singapore-under-united-kingdom--singapore--succeeded`**, 1962 → 1965, a
  gap of 3 years. *The question:* what Singapore was part of between 1962 and
  1965, and whether that is a succession, a membership or a dependency in this
  atlas's vocabulary.

Each is a real historical question with a real answer. None of them is a
question about a date, which is why none of them could be closed by adjusting
one.

---

## 2. Russia

Written in the commit that splits the records. Until then this file is
section 1 alone, which is the rule the split rests on.

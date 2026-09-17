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

> **The owner reversed this the next day, and §1.4 below is what happened to
> it.** Rule 30 is no longer a rule; the same arithmetic is now the warning
> `succession-gap`, and the four of §1.2 are active again. §1.1 to §1.3 are
> left as M52 wrote them, because they are the record of a decision that was
> taken and then changed, and rewriting them would hide the second half of
> that.

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

### 2.1 What Wikidata says, by QID and property

Read on 16 September. **No date below was authored here**, and no date is
written that is not in this table or already in the atlas.

| | inception P571 | dissolved P576 |
|---|---|---|
| **Russian Empire** `Q34266` | 1721-10-22 | 1917-09-01 |
| **Soviet Union** `Q15180` | 1922-12-30 *(normal)*, 1923-07-06 *(deprecated)* | 1991-12-26 |
| **Russia** `Q159` | 1263 *(preferred)*, 880, 1125, 1991-12-25 | — |

`Q15180`'s 1923-07-06 — the constitution — is **deprecated on Wikidata**. The
normal-rank 1922-12-30, the union treaty, is the one taken, and each record
says so.

### 2.2 What was written

**Three records where there was one and a half, and the chip stops lying.**

| record | name | when | where the dates come from |
|---|---|---|---|
| `russian-empire` | Russian Empire | 1721 – 1917 | `Q34266` P571 1721-10-22, P576 1917-09-01 |
| `soviet-union` | Soviet Union | 1922 – 1991 | `Q15180` P571 1922-12-30, P576 1991-12-26 |
| `russia-soviet-union` | Russia | 1991 – open | CShapes' own boundary, 1991-12-21 |

`russia-soviet-union` keeps its id and drops the parenthetical, exactly as
`turkey-ottoman-empire` did in M51: an id is immutable once written and the
name is what the reader sees. **No record is named "Russia (Soviet Union)" any
more**, and the old label is not kept as a variant either, because it names two
polities and search would offer it as though it were one.

### 2.3 No relation between the Empire and the Soviet Union

The Empire ends 1917-09-01 and the Soviet Union begins 1922-12-30. **Wikidata
asserts nothing holding that ground in between**, and by rule 30 — the owner's
own rule, one section above — a `succeeded` relation across five years would be
the false label it forbids. The gap is real history, a republic and a civil
war, and it is the finding rather than a defect to be smoothed.

**No relation is written into the post-1991 record either.** Its start is
CShapes' boundary, not a founding, and a succession from it would assert the
very judgement §2.4 leaves open.

So this milestone writes **no relation at all**.

### 2.4 The post-1991 record, and exactly what a person must decide

`russia-soviet-union` had to carry the post-1991 period: ending the Soviet
Union in 1991 leaves every presence and every event after that date without an
actor alive to hold it, which is a hard error, and five of the atlas's events
— the 2008 war, the 2014 war, the 2022 invasion, Bucha and the 2023 rebellion
— are on the far side of it.

**Its span begins where CShapes' own first post-Soviet period begins,
1991-12-21.** That number was already in the atlas, on the presence record
`russia-soviet-union-1991-f`, and it is cited to the dataset. It is **not a
claim about when a state was founded**.

**What a person must decide**, and it is one question:

> **When does the post-Soviet Russian state begin, and which item is it?**

The material for the decision:

1. `Q159` carries **four** inceptions and its **preferred** value is **1263**,
   not 1991. Choosing 1991 over the preferred value is a judgement, not a
   lookup, and this run does not make it.
2. `Q159`'s 1991-12-25 falls **one day before** the Soviet Union's dissolution
   on 1991-12-26. A succession written on those two numbers would have the
   successor beginning before the predecessor ended.
3. `Q159` is also the item a search for "Russia" returns beside `Q34266`, the
   Empire — which is why `docs/m49-actors.md` §7 could not choose one, and why
   `tools/import/wikidata.mjs` refuses to carry "Russian Federation" to the
   network at all: the guard accepts only a name the record already holds, and
   writing that name onto the record **is** the judgement being asked for.

Until that is answered the record says, on its face and in `review.note`, that
its inception is open and that 1991-12-21 is the dataset's boundary and not a
founding.

### 2.5 The territory: 24 periods, and where each went

Entity `gwcode 365` has 24 periods of territorial validity. **No outline was
redrawn and no period was cut.** Each period went to whoever held the ground
when the period *began*, which is the method M51 used on entity 640 — where a
period that begins under one record and runs past its end stays with the record
that began it. Presence ids do not change when a presence moves; only `actor`
does.

| periods | to | why |
|---|---|---|
| 3, from 1886-01-01 to 1917-12-05 | `russian-empire` | they begin while the Empire is alive |
| 19, from 1917-12-06 to 1991-12-20 | `soviet-union` | see below |
| 2, from 1991-12-21 | `russia-soviet-union` | CShapes' own post-Soviet boundary |

The last Empire period runs to 1917-12-05, three months past the Empire's
cited end. That is M51's `turkey-ottoman-empire-1920` case exactly: CShapes
draws no boundary on the day Wikidata gives, and cutting one there would be
this atlas inventing a border.

**The nine periods of the gap.** Nine of the nineteen periods given to
`soviet-union` *begin* before its cited inception of 1922-12-30, and eight of
those nine end before it too. They are flagged `m52-gap` on their own records
and listed here:

| presence | from | to |
|---|---|---|
| `russia-soviet-union-1917` | 1917-12-06 | 1918-02-15 |
| `russia-soviet-union-1918` | 1918-02-16 | 1918-03-02 |
| `russia-soviet-union-1918-b` | 1918-03-03 | 1918-03-10 |
| `russia-soviet-union-1918-c` | 1918-03-11 | 1918-11-10 |
| `russia-soviet-union-1918-d` | 1918-11-11 | 1920-02-01 |
| `russia-soviet-union-1920` | 1920-02-02 | 1920-09-01 |
| `russia-soviet-union-1920-b` | 1920-09-02 | 1920-10-27 |
| `russia-soviet-union-1920-c` | 1920-10-28 | 1921-03-17 |
| `russia-soviet-union-1921` | 1921-03-18 | 1940-03-11 |

*The question:* **whose ground was this?** CShapes draws entity 365
continuously across it; Wikidata names no polity holding it; and the atlas has
no record for a republic, for a civil war's contenders, or for any state
between the two. They sit on `soviet-union` rather than on `russian-empire`
because every one of them begins after the Empire's cited end of 1917-09-01,
and `soviet-union` is the record entity 365 runs continuously into — but that
is a placement and not an assertion, and the flag on each record says so. A
person who writes the missing actor moves nine `actor` fields and nothing else.

### 2.6 The events

Twenty active events named `russia-soviet-union`. **An event's `actors` entry
names the actor that held the role then**, so they were moved by their own
dates:

| to `russian-empire` (5) | to `soviet-union` (10) | left on `russia-soviet-union` (5) |
|---|---|---|
| `boxer-rebellion` 1899 | `october-revolution` 1917 † | `russo-georgian-war` 2008 |
| `russian-revolution-of-1905` 1905 | `russian-civil-war` 1917 † | `russo-ukrainian-war` 2014 |
| `treaty-of-portsmouth` 1905 | `treaty-of-brest-litovsk` 1918 † | `full-scale-russo-ukrainian-war` 2022 |
| `february-revolution` 1917 | `spanish-civil-war` 1936 | `bucha-massacre` 2022 |
| `world-war-i` 1914 ‡ | `molotov-ribbentrop-pact` 1939 | `wagner-group-rebellion` 2023 |
| | `world-war-ii` 1939 | |
| | `katyn-massacre` 1940 | |
| | `eastern-front` 1941 | |
| | `potsdam-conference` 1945 | |
| | `charter-of-the-united-nations` 1945 | |

**‡ `world-war-i` (1914–1918) went to `russian-empire`**, which is what held
the belligerent role on the day the event begins, and that is the rule. It is
listed here because the role outlives its holder: the Empire's cited end is
1917-09-01 and the atlas's own `treaty-of-brest-litovsk` is dated 1918-03-03,
so the entry names one polity where the history has more than one. Nothing
about the event's dates is wrong; the `actors` list is what would have to grow,
and that needs the actor §2.5 does not write.

**† The three marked events fall in the 1917–1922 gap** and name
`soviet-union`, which by its cited dates was not yet alive. Which polity acted
is a historical question and not a date one, so they are left and listed, as
M51 left the 1922 war of independence and the 1923 treaty:

- **`october-revolution`**, 1917-10-25, role `government`. The government
  overthrown was not the Empire's and not the Soviet Union's.
- **`russian-civil-war`**, 1917–1922, role `belligerent`. The atlas has one
  actor for a war with several sides.
- **`treaty-of-brest-litovsk`**, 1918-03-03, role `signatory`. Signed by a
  state the atlas does not hold a record of.

Each of the three is answered by the same missing actor as §2.5's nine
presences.

---

## 3. What this milestone did not do

- **It invented no actor**, for the four gaps of §1 or for the Russian gap of
  §2. That needs sources and is its own work.
- **It wrote no date that is not cited** to a QID and a property, or copied
  from a record that already carried it with its own source.
- **It drew no geometry and cut no period.** Every outline in `data/geo/` is
  byte for byte what it was.
- **It changed nothing the reader sees** beyond the names on the records
  themselves, which is the whole point of the milestone.

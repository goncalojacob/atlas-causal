# M53 — the polities the events need, and the rule that stopped forbidding

`docs/m53-brief.md` is the instruction; this is the account. `tests/m53.test.mjs`
reads this file, so nothing below is prose that once was true: a row in a table
here is a claim about `data/`, and the suite fails if the records stopped
agreeing with it.

The owner selected **Brazil** on the running atlas and saw three events where
four centuries belonged. M54 has since made the lens territorial, so the chain
is *findable*; this milestone fixes the records underneath it — the polities
that ought to exist, and the events that name nobody.

---

## 1. The contiguity rule, relaxed (amendment A1)

The owner, 17 September: *"Forget the continuity rule, you can write a
succession even if there is no dates continuity."*

M52 had taken the opposite instruction from the same person the day before,
made it **rule 30**, a hard validator error, and **retracted four successions**
to satisfy it. Both sentences are in the record and the second one wins; what
this milestone had to decide is what happens to the check itself.

### 1.1 The check is kept and demoted

It is **not deleted**. A gap between a predecessor's end and a successor's
start is still years in which something else held that ground, and that is
worth saying. What changed is **who decides**: saying it is the validator's
job, forbidding it is not.

So rule 30 became the warning **`succession-gap`**, in `src/validate/rules.js`,
over every active `succeeded` relation, documented in `ARCHITECTURE.md` where
rule 30 was. It stopped being numbered because in this validator **a rule is an
error**; a check that only reports belongs with the warnings, beside
`relation-outside-actor-when`, which looks at the same pair for another reason.

What it now warns about, unchanged from the arithmetic rule 30 used:

- the successor begins **more than one year** after the predecessor ends —
  meeting is the same year or the year boundary between them, a year being the
  finest bound this model has;
- or the predecessor **has not ended at all** and is nonetheless succeeded.

What it still does not report is the other direction. A successor that begins
before its predecessor ends leaves no ground unexplained.

**No test requires contiguity any more** (amendment A2). M52's `data/`-wide
assertion in `tests/m52.test.mjs` is deleted rather than weakened, and the test
that a succession's dates are **cited** stays exactly as it was. What replaced
the deleted one is the correspondence in §1.3 below and the fixture cases in
`tests/relation-rules.test.mjs`, which assert both halves of the change: no
error, and the warning exactly where the rule used to bite.

### 1.2 The four M52 withdrew are back

Restored from their own retracted records — same ids, same dates, same sources,
same two actors, `retraction` removed because rule 27 permits one only on a
retracted record. **Each carries its gap in its own `note`**, which is the shape
the relaxed check asks for: write the relation, and say what stood between.

| restored | gap | predecessor ends | successor begins |
|---|---|---|---|
| `east-timor-under-portugal--east-timor--succeeded` | 26 | 1976 | 2002 |
| `zambia-under-united-kingdom--zambia--succeeded` | 11 | 1953 | 1964 |
| `taiwan-under-japan--taiwan--succeeded` | 4 | 1945 | 1949 |
| `singapore-under-united-kingdom--singapore--succeeded` | 3 | 1962 | 1965 |

`docs/m52-russia.md` §1.2 carries the same four as the audit that found them,
and §1.1 there now points here. Neither file was rewritten to pretend the first
decision was never taken.

### 1.3 What the notes do not say, and why

Each note says how many years the gap is and that **the atlas names nobody for
it**. It does not name Indonesia, the Federation of Rhodesia and Nyasaland, the
Republic of China or Malaysia, though a historian would name each at once.
`CLAUDE.md` forbids this assistant writing a historical claim, and naming the
occupant of a gap is one. M52 was right about that and only wrong about the
remedy: the claim needs a source and a record of its own, and until it has one
the honest form is the gap stated and the occupant left open.

**Those four questions are still open**, in exactly the words
`docs/m52-russia.md` §1.3 put them. What changed is that the atlas no longer
withholds the succession while they wait.

---

## 2. The polities that were missing

### 2.1 What Wikidata says, by QID and property

Read on 17 September, from `Special:EntityData` over the same proxy the
milestone ran behind. Every date in §2 and §3 is one of these values or is
copied from a record that already carried its own source. Nothing here is
recalled.

| item | QID | P571 inception | P576 dissolved |
|---|---|---|---|
| Empire of Brazil | `Q217230` | 1822-09-07 | 1889-11-15 |
| Russian SFSR | `Q2184` | 1917-10-25 | 1991-12-25 |
| Russian Republic | `Q139319` | 1917-09-01 | 1917-10-25 |
| Kingdom of Portugal | `Q45670` | 1139-07-25 | 1910-10-05 |
| Saint-Domingue | `Q861551` | 1626 | 1804-01-01 |
| Captaincy General of Cuba | `Q2039931` | 1607 | 1898 |
| Colonial Brazil | `Q2088324` | 1500 | 1815 |
| State of Brazil | `Q11876909` | 1621-06-13 | 1815-01-01 |
| Viceroyalty of Brazil (the office) | `Q2920081` | 1763 | 1808 |
| United Kingdom of Portugal, Brazil and the Algarves | `Q903779` | 1815-12-16 | 1822-09-07 |

The last four are lookups this milestone made and did **not** turn into a
record of their own; §2.4 and §5 say why, and each is cited where it is used.

### 2.2 What was written

| record | name | span | provenance |
|---|---|---|---|
| `empire-of-brazil` | Empire of Brazil | 1822 – 1889 | Q217230, P571 and P576 |
| `russian-sfsr` | Russian Soviet Federative Socialist Republic | 1917 – 1991 | Q2184, P571 and P576 |
| `russian-republic` | Russian Republic | 1917 – 1917 | Q139319, P571 and P576 |

`when` carries integer years, as every other actor in this atlas does; the two
exact dates live in `sources` and in the record's own prose, which is the
convention M52 set for `russian-empire` and `soviet-union`.

### 2.3 Brazil's own start, and the one period that moved

`brazil` began **1886**. That is where CShapes begins, full stop — the record's
own imported summary says it "asserts nothing the dataset does not" — while
Wikidata dissolves the Empire on **1889-11-15**. Both could not be right, and
only one of them is a date about Brazil.

So `brazil` now begins **1889**, taken from `Q217230, P576` — from the record
either side of it, not invented here — and the succession
`empire-of-brazil--brazil--succeeded` carries that date.

**One CShapes period moved, and it had to be cut to move.** Entity 140's first
period runs 1886-01-01 to 1903-11-16 and therefore spans the Empire's end:

| presence | actor | from | to |
|---|---|---|---|
| `brazil-1886` | `empire-of-brazil` | 1886-01-01 | 1889-11-15 |
| `brazil-1889` | `brazil` | 1889-11-16 | 1903-11-16 |

**Both halves carry the same outline file and the same key, `57`.** No geometry
was redrawn and no border was invented: the Republic inherited the Empire's
borders, and the dataset draws one polygon for both, which is exactly what two
periods sharing a key say.

This is a **deviation from M52's method** and it is deliberate. M52 §2.5 gave
each period whole to whoever held the ground when the period *began*, and said
that cutting one at a Wikidata date "would be this atlas inventing a border".
That reasoning holds where the two records are different territories. Here they
are the same territory under two regimes, and moving the period whole would
have given the Empire fourteen years of ground after its own cited death and
left the Republic with none until 1903 — which is the very fault this milestone
was written to fix, since M54 made selecting a territory the way the atlas is
read. A cut that keeps the outline byte-for-byte asserts nothing about a
border; it asserts who held it, which is the question.

### 2.4 The Viceroyalty, and what a person must decide

`viceroyalty-of-brazil` ended **1877**, the last snapshot the Historical
Basemaps import read — the same kind of artefact as `brazil`'s 1886, and the
record's own summary says so. Its end is now **1815**, which is what Wikidata
states for the colonial entity on **two** items that agree: `Q2088324` (Colonial
Brazil) P576 1815, and `Q11876909` (State of Brazil) P576 1815-01-01.

**A third item carries this record's exact name and disagrees.** `Q2920081`,
the Viceroyalty of Brazil as an *office*, gives P571 1763 and P576 **1808**. It
is cited on the record and not taken. Which of the three this polygon is — the
office, the state, or the colony — is a judgement about what a basemaps label
means, which is M49's finding in one sentence, and it is not a lookup.

**Three things are left open here, and each is a person's decision:**

1. **Which item the record is**, per the paragraph above: 1808 or 1815.
2. **The record's start is still 1715**, the first snapshot, and no item was
   consulted for it. `Q2088324` would give 1500 and `Q2920081` 1763. Correcting
   an end and leaving a start is half a job, and the half that was done is the
   one the brief asked for.
3. **Brazilian ground from 1815 to 1886 belongs to records whose own dates have
   ended.** `viceroyalty-of-brazil-1815` runs to 1877 and its actor now ends in
   1815; `kingdom-of-brazil` (1878–1885) is a basemaps span that Wikidata's
   `Q3932042` dates 1815–1825 instead. The Empire of Brazil holds no ground at
   all before 1886. Re-homing those periods is the same shape of work as §2.3
   and needs a decision about the two datasets rather than another lookup, so
   this milestone lists it instead of doing it.

### 2.5 The successions written

| succession | gap | what its note says |
|---|---|---|
| `viceroyalty-of-brazil--empire-of-brazil--succeeded` | 7 years | the colony ends 1815 and the Empire begins 1822-09-07; `Q903779` holds a polity for those years and this atlas has no record of it |
| `empire-of-brazil--brazil--succeeded` | none | the Republic begins on the day the Empire ends, because its start was taken from that dissolution |
| `russian-empire--russian-republic--succeeded` | none | the same instant, 1917-09-01, on `Q34266` P576 and `Q139319` P571 |
| `russian-republic--russian-sfsr--succeeded` | none | the same instant, 1917-10-25, on `Q139319` P576 and `Q2184` P571 |

Three of the four meet exactly. The first does not, and under A1 that is no
longer a reason to withhold it: the gap is in the note, where a reader meets
it, and `succession-gap` reports it on every run.

---

## 3. The 1917 gap, closed by a lookup

M52 ended the Russian Empire on 1917-09-01 and began the Soviet Union on
1922-12-30, and wrote no relation across the five years between, because
"Wikidata asserts nothing holding that ground in between". Three events fell
into the hole and named `soviet-union` before it existed: the October
Revolution, the Russian Civil War and the Treaty of Brest-Litovsk.

Wikidata does assert something, on two items nobody had asked:

- **`Q139319`, the Russian Republic**, P571 1917-09-01 and P576 1917-10-25 —
  the same two instants the Empire ends on and the SFSR begins on;
- **`Q2184`, the Russian SFSR**, P571 1917-10-25 and P576 1991-12-25.

So the line from the Russian Empire runs unbroken to 1991 and every date on it
is cited: Empire → Republic → SFSR, two successions, neither with a gap. The
three events name **`russian-sfsr`**; §4 says which, and where each one went.

**No succession is written between the SFSR and the Soviet Union, in either
direction.** Their intervals overlap by sixty-nine years because the one was a
republic inside the other, and `succeeded` says that one took the other's
place. M52's rule that no relation joins the three records it split apart still
holds, and the SFSR is not one of them.

**Neither new record holds any territory.** CShapes draws entity 365
continuously across 1917–1922 under a single label and M52 gave those nine
periods to `soviet-union` with the flag `m52-gap` on each. Moving them here
would be a claim about which polity held which border in which month of the
civil war, which is not a lookup and not this milestone's work. The flags and
`docs/m52-russia.md` §2.5 still say what they say.

---

## 4. The events that named nobody

### 4.1 The fault, measured

`docs/m50-brief.md` asked its chain for reachability *within* the chain, two
edges, sources, cross-chain routing, a place and a date, and never asked
whether a chain event is reachable **from an actor** — though M48 had just made
the actor lens the main way to explore. So M50 wrote thirty-six events and left
thirty-five of them carrying `actors: []`.

| | chain events | all active events |
|---|---|---|
| **before M53** | 1 of 36 | 198 of 285 |
| **after M53** | 36 of 36 | 235 of 285 |
| **after M57** | 36 of 36 | 254 of 304 |
| **after M62** | 36 of 36 | 259 of 309 |
| **after M67** | 36 of 36 | 306 of 310 |
| **after M42** | 36 of 36 | 368 of 752 |

Counted the same way in both columns: **an event names at least one actor that
is alive in the year the event starts**. `cuban-revolution` was the one chain
event that already did. Over the corpus the figure moves by thirty-seven — the
thirty-five chain events, plus `october-revolution` and `russian-civil-war`,
which named a state that did not yet exist and now name one that did.

**Fifty active events still name nobody**, and every one of them carries
`actors: []` rather than a wrong name. They are not in either chain and are not
this milestone's to write; §5 lists the figure as what it is, an open count.

**The "after M57" row is the same measurement taken again.** `tests/m53.test.mjs`
holds the *last* row of this table against the live corpus, so a milestone that
writes events has to re-take the count rather than leave a stale one standing.
M57 added nineteen events and every one of them names an actor, which is why the
figure moves by nineteen in both columns and **the fifty that name nobody are
still the same fifty**. The two rules — alive at the start, and overlapping —
still give the same number, 254, so the sentence above about which rule was
counted by is still true of this row as well.

**The second "after M42" row is the curation fire of 22 September re-taking
the count — M42 has no done condition, so it writes a row each time it moves
the figure — and it is the first row where the two rules part.** This is the
entry that parts them. The curation fire of 22 September gave 44
actorless events the participants their Wikidata item names (P710), and one of
those lines is `croatian-war-of-independence` naming `croatia`. The war runs
**1991 to 1995** and the CShapes record `croatia` begins in **1992**, so the
war *overlaps* the polity without the polity being alive in the year the war
started. Counted by the rule this table states — alive at the start — the
figure is **368**; counted by overlap it is **369**. Both figures rose by one in batch 35, which gave `battle-of-mogadishu-1993` the two participants its item names and this atlas holds, and both rose by sixteen in the curation fire of 23 September, whose `P710` pass gave sixteen more actorless events the parties their items name; the **gap** is still the one entry this paragraph is about.

Nothing here is wrong. 1992 is where CShapes begins Croatia, which is a
recognition date and not the date a state began fighting for itself, and
Wikidata is right that Croatia was a party to the war. The difference is the
same one M56 was about, and the entry joins the list that milestone keeps
(`LATER` in `tests/m56.test.mjs`). The column above is still counted the way
its sentence says; it is the corpus that has stopped agreeing with itself, and
this paragraph is the run saying so rather than the reading being changed
underneath it.

**The "after M42" row is retaken at every batch of that milestone**, which is
why it moves without a new row being added: M42 is one milestone and the row is
its own. Batch 10 takes it to 306 of 393, batch 11 to 306 of 405, batch 12 to 306 of 411, batch 13 to 306 of 423, batch 14 to 306 of 435, batch 15 to 306 of 445, batch 16 to 306 of 451 and batch 17 to **306 of 474**. **M42b's batches move the same row**, because
A11 partitioned one milestone into two lanes and not into two measurements:
its batch 1 takes the denominator to 592, its batch 2 to 614, its batch 3 to
643, its batch 4 to 658, its batch 5 to 673 and its batch 6 to **722** — the
last of those with the two merges at the head of that fire inside it, which
brought `origin/m42`’s own batches across — and every one of them leaves the
numerator where it was. `origin/m42`'s own batches 37 and 38, nine imported
joins between them and none of which names an actor, then arrive on this branch
with the merge of 23 September, which is what takes the denominator to
**726** without a batch of this lane having run — and M42b's own batch 7, twenty-three records of the Spanish American wars of independence and none of them naming an actor, takes it to **749**: the count is of the corpus
and not of a branch. The numerator has not moved since
M67 and will not move by importing: every record the Wikidata sweep creates
carries `actors: []`, because the import writes identity and never an actor
line, and M67 A1 settled that an event with no actor and no place is not a
defect. So the gap this row shows is the gap between a corpus that is imported
and one that is written, and it widens by exactly the number of records each
batch keeps.

**The "after M62" row is that measurement taken a third time.** M62 wrote five
umbrella events — the Estado Novo, the First Republic, the Ditadura Nacional,
the Colonial War and the Brazilian dictatorship — so that the timeline's events
could be part of something (`docs/m62-umbrellas.md`). All five name actors, so
the figure moves by five in the whole-corpus column and not at all in the
chain's, and **the fifty that name nobody are still the same fifty** — seven of
them are the presidential elections M62 could not file for exactly that reason.
The two rules still give the same number, 259, though four of M62's own
`actors` entries are of the shape M56 is about: a party founded in 1912 is an
actor of a republic that began in 1910, and `tests/m56.test.mjs` lists all four.

**The "after M67" row is the one that closes the open count.** M67 wrote the
actor and place lines for forty-six of the forty-eight main events that named
nothing at all, read off the Wikidata item each record already cited
(`docs/m67-umbrellas.md`), and added one umbrella, the Empire of Brazil, which
names one. So the whole-corpus column moves by forty-seven and the chain's not
at all, and **the fifty that name nobody are down to four**: `20-july-plot` and
`covid-19-pandemic`, which §2.1 of that document explains,
`covid-19-pandemic-in-europe`, which is part of the pandemic and so not a main
event at all, and `tripartite-pact`, which carries a place and no actor. The
two rules still give the same number, 306.

**The "after M42" row is the count with the world put back into it, and it is
rewritten as each of that milestone's batches lands** — batch 39 of 23 September
takes the denominator to 752 and leaves the numerator at 368, because its three
imports carry `actors: []` as every imported record does. M42 adds active events
and does not add actor lines: everything it reinstates or imports is a
Wikidata record carrying `actors: []`, which is what `docs/m67-umbrellas.md`
§2.1 and M67's amendment A1 already settled — **an event with no actor and no
place is not a defect**, and inventing a line to make one filable is the thing
that document forbids. So the numerator stands where M67 left it and the
denominator grows: 306 of 358 after batch 6, against 306 of 310 before. The
filing pass of amendment A6 moved the numerator by one for the first time —
**307 of 477** — because `third-portuguese-republic-since-1974`, the one
umbrella of that pass written here rather than imported, names the republic
itself, and the two the import wrote name nothing, as the imports do. The
gap is not a regression in what M67 did; it is the new records arriving in the
state every imported record arrives in, and `review.html` is where a person
gives them their lines.

### 4.2 Where the entries came from

Every entry names an actor **the event's own summary already names**, and that
summary was written by M50 from the Wikipedia article the record cites at a
named revision (amendment A1 of M50: *"The historical claims should come from
wikipedia right now"*). Nothing was added to the atlas's claims about the past;
what was added is **which record in this atlas each name resolves to**, and a
`note` of at most 200 characters saying what that actor did, in the summary's
own terms.

The role comes from the closed list in `data/roles.json` — `signatory`,
`government`, `occupier`, `belligerent`, `host`, `supporter`, `opposition`,
`deposed`, `target` — and no role was added.

**The actor named is alive when the event starts, and every actor named
overlaps the event's interval.** Both are asserted in `tests/m53.test.mjs`, and
the first is the test M50 lacked. The two are different demands for the long
events: `the-atlantic-slave-trade-to-brazil` runs 1540 to the 1860s and names
both the Kingdom of Portugal, alive at its start, and the Empire of Brazil,
which enters in 1822 and is what the traffic was landing in at its end. A
process that outlives a state is named by the states it passed through, which
is the point of an interval.

### 4.3 The three events stranded in 1917

M52 dated `soviet-union` from 1922-12-30 and left three events naming it before
it existed. Each now names `russian-sfsr`, whose inception, 1917-10-25, is the
date of the first of them.

| event | was | is |
|---|---|---|
| `october-revolution` 1917 | `soviet-union` | `russian-sfsr` |
| `russian-civil-war` 1917 | `soviet-union` | `russian-sfsr` |
| `treaty-of-brest-litovsk` 1918 | `soviet-union` | `russian-sfsr` |

`treaty-of-brest-litovsk` keeps its four other signatories untouched. No other
event anywhere moved off `soviet-union`, and `docs/m52-russia.md` §2.6 still
accounts for every entry that named the old conflated record; these three are
the only rows of that table M53 changed.

---

## 5. What is left open, and the question each one asks

1. **The four gaps of §1.2.** Who held East Timor 1976–2002, Northern Rhodesia
   1953–1964, Taiwan 1945–1949 and Singapore 1962–1965. Each needs an actor
   with sources; the successions no longer wait on them.
2. **Which item `viceroyalty-of-brazil` is**, and its start — §2.4, points 1
   and 2. 1808 or 1815 for the end; 1715, 1763 or 1500 for the start.
3. **Brazilian ground from 1815 to 1886** — §2.4, point 3. The Empire of Brazil
   holds territory only from 1886, and the periods that cover the century
   before it belong to `viceroyalty-of-brazil` and `kingdom-of-brazil`, whose
   own dates have ended. Re-homing them is the §2.3 operation again and needs a
   decision about the two datasets.
4. **The seven years between the colony and the Empire.** `Q903779`, the United
   Kingdom of Portugal, Brazil and the Algarves, 1815-12-16 to 1822-09-07, is
   in Wikidata and not in this atlas. Writing it would close the one gap M53
   left in the Brazilian line. It was not written because the brief asked for
   the Russian Republic and not for this, and because it would want territory
   to be worth having.
5. **`chinese-civil-war` (1946–1950) names `taiwan` (1949–).** The entry is
   kept, says it enters in 1949, and the event is flagged `m53-open`. The
   record's own summary has the Nationalist government driven to Taiwan in
   1949, so the name is sourced and the overlap is real; what is open is
   whether the CShapes record `taiwan`, which begins 1949-12-08, is the polity
   that fought the war from 1946. That is the M49 question about a 1886-or-1949
   boundary, and naming the Republic of China needs a record of its own.
6. **Fifty active events name nobody**, all with `actors: []`. None is in
   either chain. The chain was not the only region with the fault, which is
   what §4.1 was measured to find out.
7. **`kingdom-of-portugal`, `saint-domingue` and `captaincy-general-of-cuba`
   hold no territory**, and each overlaps a record the territory imports drew
   for the same ground under another name. Whether those pairs are one record
   or two is M49's question, unanswered, and no relation was written between
   any of them.

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
| **after M42** | 36 of 36 | 400 of 1072 |

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
figure is **400**; counted by overlap it is **401**. Both figures rose by one in batch 35, which gave `battle-of-mogadishu-1993` the two participants its item names and this atlas holds, both rose by sixteen in the curation fire of 23 September, whose `P710` pass gave sixteen more actorless events the parties their items name, both rose by two in M42b batch 8, which gave `battle-of-cajamarca` and `siege-of-cusco` the `inca-empire` their items name as a participant and this atlas already held, both rose by one in M42b batch 9, which gave `guarani-war` the `kingdom-of-portugal` its item names as a participant (`P710` Q45670) and this atlas has held since M53, both rose by one again in M42's batch 40, whose `P710` pass gave `rhodesian-bush-war` the two participants its item names and this atlas holds, and by one again in M42's batch 42, whose `P710` pass gave `operation-green-sea` the three its item names, by three again in M42's batch 43, whose `P710` pass gave `operation-odyssey-dawn` twelve participants, `2003-invasion-of-iraq` five and `india-pakistan-war-of-1971` two, by one again in M42's batch 44, whose `P710` pass gave `battle-of-inchon` the one participant its item names and this atlas holds, and by one again in M42b batch 13, which gave `first-treaty-of-san-ildefonso` the `kingdom-of-portugal` its item names as a participant (`P710` Q45670), and both rose by one again in M42's batch 47, whose `P710` pass gave `battle-of-port-arthur` the two participants its item names — the Empire of Japan and the Russian Empire, read as `japan` and `russian-empire`, which is how `russo-japanese-war` itself already reads the same two items; the **gap** is still the one entry this paragraph is about, and `croatian-war-of-independence` is still the only event the two rules disagree about. **Both rose by one again on 24 September, when A14(6) divided `the-holocaust` into `the-persecution-of-the-jews-1933-1941` and `the-extermination-of-the-jews-1941-1945`: one record naming `nazi-germany` became two, and the active corpus rose by one with it.** **Both rose by two again in M42's batch 48, whose `P710` pass gave `challe-plan` and `evian-accords` the one participant their items name and this atlas holds — `Q142`, France, read as `france`; the other party each names, the ALN and the Provisional Government of the Algerian Republic, is not a record here. The active corpus rose by ten with the batch.** **Both rose by one again in M42's batch 49, the Russo-Japanese War finished as a chain, whose `P710` pass gave `battle-of-chemulpo-bay` the two participants its item names and this atlas holds — the Empire of Japan and the Russian Empire, read as `japan` and `russian-empire`, which is how `russo-japanese-war` and `battle-of-port-arthur` already read the same two items. The other six of the batch name no participant at all: their items carry no `P710`. The active corpus rose by seven with the batch.** **Neither rose in M42's batch 50, the Mali War read as a chain: not one of its eight items carries a `P710` at all, so all eight arrived with `actors: []` and there was nothing for the pass to map. The active corpus rose by eight with the batch, so the denominator moves and the numerator does not.** **Both rose by eight again in M42's batch 51, the Korean War read as a chain and the largest single move an import has made: eight of its nine items carry a `P710` and every participant they name that this atlas holds is one of four — `Q30` the United States, `Q145` the United Kingdom, `Q423` North Korea and `Q884` South Korea, read as `united-states-of-america`, `united-kingdom`, `korea-people-s-republic-of` and `korea-republic-of`, all four `belligerent`, which is how `korean-war` and `battle-of-inchon` already read the same items. `Q163098`, the Eighth United States Army, is the one participant named that is not a record here, and `Q18016068` the First Battle of Seoul is the one of the nine whose item carries no `P710` at all. The active corpus rose by nine with the batch.** **Neither rose in M42’s batch 52, the Mali War carried from 2013 to 2024: not one of its seven items carries a `P710` at all — the one row of the vein that does, `Q128007033` the Battle of Tinzaouaten, was refused for arriving edgeless and is not here — so all seven arrived with `actors: []` and there was nothing for the pass to map. The active corpus rose by seven with the batch, so the denominator moves and the numerator does not, as in batch 50.** **The denominator is 943 and not 907 because this row is re-taken on `m42b`, where the two import lanes stand merged: M42b's own batches wrote the events of the Americas and of Europe before 1900 that `m42` has not seen, and not one of the numerator's figures moved with them — the two lanes disagree about how many active events there are and about nothing else.** **Neither figure in the numerator moved in M42b batch 25 either, and the reason is deviation 1404: every one of its seventeen items names two to four `P710` participants and this atlas holds exactly one of them — `Q45670`, the Kingdom of Portugal, on eleven of the seventeen — so every list was partial and every list was withheld. The active corpus rose by seventeen with the batch, so the denominator moves to 960 and the numerator does not.** **The row reads 967 and not 960 because `m42`’s batch 52 was merged into this branch after batch 25 was written: seven more active events, none of them carrying a `P710` this atlas can map, so the denominator moves and the numerator does not.** **Neither figure moved in M42b batch 26 either, the Haitian Revolution read as a chain: of its fifteen items eight carry a `P710` at all, seven of those name at least one polity this atlas does not hold, and the one that names only held records — `Q3486058`, the Battle of Crête-à-Pierrot, whose participants are `Q142` France and `Q790` Haiti — names two CShapes actors that both begin in **1886**, eighty-four years after the battle. A participant that is not alive in the year of the event is not what this row counts and is not what the atlas should say, so the list was withheld and the record carries `actors: []`. The active corpus rose by fifteen with the batch, so the denominator moves to 982 and the numerator does not.** **Both rose by five again in M42's batch 53, the Korean War read forward from the invasion: five of its seven items carry a `P710` and every participant they name that this atlas holds is one of four — `Q30` the United States, `Q145` the United Kingdom, `Q423` North Korea and `Q884` South Korea, read as `united-states-of-america`, `united-kingdom`, `korea-people-s-republic-of` and `korea-republic-of`, all four `belligerent`, which is how `korean-war` and batch 51's nine already read the same items. `Q240670` the Korean People's Army and `Q163098` the Eighth United States Army are the two participants named that are not records here, and `Q4260079` Operation Pokpung and `Q5073209` the Chaplain–Medic massacre are the two of the seven whose items carry no `P710` at all. The active corpus rose by seven with the batch, so the denominator moves to 989.** **Neither figure moved in M42b batch 27 either, the COVID-19 pandemic in the Americas and two Colombian clashes: a national epidemic names no participants, and not one of the batch's eighteen items carries a `P710` at all, so all seventeen records arrived with `actors: []` and there was nothing for the pass to map. The active corpus rose by seventeen with the batch, so the denominator moves to 1,006 and the numerator does not.** **The row reads 397 of 1,010 and not 396 of 1,006 because `m42`'s batch 54 was merged into this branch after batch 27 was written: four more active events, one of which — `battle-of-tinzaouaten-2024` — names `mali`, the one of its four `P710` participants this atlas holds, so both figures in the numerator rise by one and the denominator by four.** **Neither figure moved in M42b batch 28 either, the Arauco War read as a chain: only one of its fifteen items carries a `P710` at all — `Q431806`, the war itself, which names `Q80702` and `Q178484` — and neither of this atlas's two Mapuche actors carries a Wikidata item, so the import could not match them and the list was withheld. The active corpus rose by fifteen with the batch, so the denominator moves to 1,025 and the numerator does not.** **Both rose by one again in M42's batch 54, the Mali War read at both ends: one of its four items carries a `P710` at all — `Q128007033`, the battle of Tinzaouaten, which names four participants, of which this atlas holds exactly one, `Q912` Mali, read as `mali` and `belligerent`. The other three it names — `Q28877411` JNIM, `Q36597284` the Wagner Group and `Q111207670` the CSP — are not records here, and the other three items of the batch carry no `P710` at all. That is the same partial list batches 48, 49, 51 and 53 wrote: the participants the atlas holds go on the record and the ones it does not are named here instead. The active corpus rose by four with the batch, so the denominator moves to 993.** **The row reads 400 of 1,029 and not 397 of 993 because `origin/m0` was merged into `m42` before batch 55, carrying M42b's batches 27 and 28 — thirty-two more active events, none of them naming a participant this atlas can map, so the denominator moves by thirty-two and the numerator does not. Both figures then rose by three in M42's batch 55, the Korean War's 1951 ridges read as a chain: three of its four items carry a `P710` at all, and every participant they name that this atlas holds is one of three — `Q30` the United States on all three, and `Q423` North Korea and `Q884` South Korea on `Q16898848` the Battle of the Punchbowl besides, read as `united-states-of-america`, `korea-people-s-republic-of` and `korea-republic-of`, all three `belligerent`, which is how `korean-war` and batches 51 and 53 already read the same items. `Q3354681`, Operation Commando, is the one of the four whose item carries no `P710` at all. The active corpus rose by four with the batch, so the denominator moves to 1,029.** **Neither figure moved in M42b batch 29 either, the War of the Austrian Succession read across the Continental land war: ten of its twenty-four items carry a `P710` at all, and of every polity those ten name this atlas holds exactly one — `Q34`, Sweden, on the Russo-Swedish War of 1741–1743 — which is a CShapes actor beginning in **1886**, a hundred and forty-five years after the war. That is deviation 1293's case again, and the list was partial besides: `Q34266`, the Russian Empire, is the other party and is not a record here. All twenty-four arrived with `actors: []`. The row reads 400 of 1,053 because this branch is where the two lanes stand merged: the twenty-four of batch 29 are M42b's and `m42` has not seen them, so the denominator moves by twenty-four and the numerator does not.** **The row reads 400 of 1,072 and not 400 of 1,053 because M42b batch 30 — the American Indian Wars, King Philip's War and the Beaver Wars read as a chain — added nineteen active events, and not one of them names a participant this atlas can map: ten of the nineteen items carry a `P710` at all, and of every polity and people those ten name this atlas holds exactly three — `Q30` the United States, `Q16` Canada and `Q96` Mexico — all of them CShapes actors beginning in **1886**, against a war the item itself dates from 1609 and battles of 1676. The rest, the Haudenosaunee, the Wendat, the Algonquin, the Nipmuc, the Narragansett, the Mohican and the Province of New York among them, are not records here at all. That is deviation 1293's case once more, and every list was partial besides, so every list was withheld and all nineteen arrived with `actors: []`. The denominator moves by nineteen and the numerator does not.**

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
**726** without a batch of this lane having run — and M42b's own batch 7, twenty-three records of the Spanish American wars of independence and none of them naming an actor, takes it to **749**; M42b's own batches 8 to 11 and, at the head of the fire of
23 September, the merge bringing `origin/m42`'s batches 39 to 42 across take it
to **373 of 790**, the numerator moving by the actor lines those batches read off
their items' own `P710` and not by anything written here; M42b's batch 12, five
imports of the Italian Wars and not one of them naming an actor, takes it to
**373 of 795**; the merge of `origin/m42`'s batch 45, six Libyan and Darfur
events of which not one item carries a `P710`, takes it to **378 of 817**; M42b's batch 14, five engagements of the Dutch–Portuguese War in
Brazil whose items name three participants between them and not one of which this atlas holds as an
actor, takes it to **378 of 822**; and the merge of `origin/m42`'s batch 46 — the
seven remaining events of the Libyan civil war's eastern front, of which again
not one item carries a `P710` — takes it to **378 of 829**; and M42b's batch 15,
five engagements of the Spanish conquest of the Aztec Empire of which one item
names three participants and this atlas holds none of them, takes it to
**378 of 834**; and the merge of `origin/m42`'s batch 47 — the seven
Russo-Japanese War records, the first batch of that lane in four to move the
numerator, because `Q1363925`, the naval Battle of Port Arthur, names the
Empire of Japan and the Russian Empire in its `P710` and this atlas holds an
actor for each — takes it to **379 of 841**; and M42b's batch 16, six engagements of the Rebellion of
Túpac Amaru II of which not one item carries a `P710` the atlas holds,
takes it to **379 of 847**: the count is of the corpus
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
rewritten as each of that milestone's batches lands** — M42b's batch 18 of the same day takes it to 858 and leaves the numerator at
**379** again, and for two reasons this time: two of its four items carry no
`P710` at all (`Q932845` the siege of Salvador and `Q122056040` the action in
the Bay of São Salvador), and the other two name `Q170072` the Dutch Republic,
`Q377350` the Iberian Union and `Q617066` the Dutch West India Company, for none
of which the atlas holds an actor. `Q377350` is also open question 2 of
`docs/m42b-pool.md`, so it is not a record a run may write on its own. M42b's batch 17 of 24 September takes the denominator to 854 and leaves the
numerator at **379**: its seven War of the League of Cambrai engagements all
arrived with `actors: []`, and not for want of a `P710` — every one of the seven
items names two to four participants, and the atlas holds an actor for none of
the nine polities between them (`Q4948` the Republic of Venice, `Q70972` the
Kingdom of France, `Q12548` the Holy Roman Empire, `Q170174` the Papal States,
`Q693570` Ferrara, `Q153529` Milan, `Q435583` the Old Swiss Confederacy,
`Q766543` and `Q21088788` the Spanish monarchy under its two items). That is
what §4.1 counts and it is the reason Europe's sixteenth century moves the
denominator and never the numerator. batch 44 of 23 September
takes the denominator to 778 and the numerator to **374**, its six events
carrying one actor line between them: `battle-of-inchon`'s
`united-states-of-america`, the one participant of its item's own `P710` this
atlas holds, the other five items naming no `P710` at all. Batch 43 earlier the
same day took the denominator to 772 and the numerator to 373, the largest move
by an import: three of its five take actor lines from their items' own `P710`
(`operation-odyssey-dawn` twelve, `2003-invasion-of-iraq` five,
`india-pakistan-war-of-1971` two), and every one of those lines names a polity
this atlas already held, which is the whole of what §4.1 counts. Batch 42 before
it took the denominator to 767 and the numerator to 370, because `operation-green-sea`
took three actor lines from its item's own `P710` (`portugal` as `invader`,
`guinea` and `paigc` as `target`), which is A12 (4) asked of a batch again; its
four other imports carry `actors: []`. Batch 41 before it
took the denominator to 762 and left the numerator at 369. Batch 40 before
it, of the same day, took the denominator to 757 and the numerator to 369, and
it is the first M42 batch to move the numerator by an import rather than by an
umbrella written here. `rhodesian-bush-war` arrived with `actors: []` like every other imported
record and then took two actor lines from its item's own `P710` participants,
which is what amendment A12 (4) asks of every batch: `south-africa` and
`frelimo`, both already held, both `supporter`, each with the article's own
phrase as the note. Batch 39 before it took the denominator to 752 and left the
numerator at 368, because its three imports carried `actors: []` and nothing
asked them for more. M42 adds active events
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

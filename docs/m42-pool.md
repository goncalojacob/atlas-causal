# M42 — the pool, measured

Amendment A1 says §0 of `docs/m42-brief.md` is stale and that the run's first
commit is the re-measurement. This is it. Every number here is printed by
`node tools/m42-pool.mjs`, which reads `data/` and nothing else; none of it is
typed from memory, and `--at <rev>` asks the same question of any earlier
commit.

Amendment A5 asks for **the largest connected component of the causal graph
before and after each batch**, because that is what *"chains throughout the
globe and time"* is as a number. Section 3 is that table, one row per batch,
appended as each batch lands.

## 1. The corpus, 21 September 2026, before M42 wrote anything

Measured at `m42`'s first commit, cut from `origin/m0` after M72 merged.

```
event records: 573 (active 310, retracted 244, merged 19)
active events: 310 — main 229, filed under a parent 81
  review status: draft 310
  written by: wikidata 165, assistant 145
edge records: 362, active 362, between two active events 362
components of the causal graph: 34
  largest: 254
  next: 7, 5, 5, 3, 3, 2, 2, 2, 2
  active events with no edge at all: 23
Portuguese 156, world 154
  hops to a Portuguese event: 0: 156, 1: 41, 2: 41, 3: 20, 4: 17, 5: 6,
                              6: 2, unreachable: 27
```

**What moved since the brief was written.** §0 said 250 active events and
249 drafts; there are **310**, all 310 draft. §0's 263 tombstones are 244 and
19 records have since been merged into others. M62 and M67 filed 81 of the
310 under a parent, which is why the main count is 229 and not 310 — and it
is the number amendment A3 is about.

**The causal graph is one large component and thirty-three fragments.**
254 of the 310 active events are in the largest; the next is seven. Twenty-
three active events carry no edge at all. So the atlas is already mostly one
chain — and what a batch has to do is join its records to *that*, not to each
other, which is A5's whole point and what M44 failed at.

**Portuguese reach is a measurement and not a gate** (brief §1). 156 of the
310 active events are Portuguese by the frozen rule of
`docs/m44-connections.md` §1; 27 active events cannot reach a Portuguese
event at all, which is the 23 with no edge plus four in fragments of their
own.

## 2. The pool to import from

Amendment A2: the **seeds** are exhausted, and they are.
`data/imports/wikidata-seeds.json` names **703 items** and
`data/imports/wikidata-state.json` records all 703 as walked, cursor at
2026-09-15, nothing pending. An `--import` run today would fetch nothing.

**The sweep is not exhausted.** `docs/wikidata-candidates.md`, written by
`node tools/import/wikidata.mjs --candidates` on 2026-09-06, holds **2,219
candidate rows** across 42 periods. 290 are ticked and all 290 have been
walked. Of the 2,219:

| | rows |
| --- | --: |
| total | 2,219 |
| ticked, and walked | 290 |
| whose item is on a record here now | — of 546 item ids on records, most came this way |
| **neither on a record nor in the seeds** | **1,586** |
| of those, `world-*` families | 1,253 |
| of those, `pt2-*` families | 333 |

So the pool this milestone draws on is **1,586 rows the tool has already
found and nobody has walked**, and the top of it by sitelinks is not thin:
the Armistice of Mudros, the Indo-Pakistani war of 1947, the Sino-Vietnamese
war, the Angolan civil war, the Locarno treaties, the Anglo-Irish treaty, the
Indonesian national revolution, the second Intifada, the Estonian war of
independence, the Greco-Italian war — every one of them at 45 sitelinks or
more and none of them here.

A fresh `--candidates` pass is run anyway, because A2 names it and because the
committed sweep's *"in the atlas"* column was computed against a `data/` two
weeks and four milestones old. Ticks are made against the fresh file where it
lands and against the committed one where it does not; either way they are the
same tool's output and the rule that picks them is written down before a box
is ticked.

## 3. The largest connected component, batch by batch

A5: a batch that grows the corpus and not the component has to say why.

| batch | what it was | active events | main | filed | active edges | largest component | isolated events |
| --- | --- | --: | --: | --: | --: | --: | --: |
| — | before M42 | 310 | 229 | 81 | 362 | 254 | 23 |
| 0 | the fifteen M44b retracted that the new bar puts back, and 18 edges | 325 | 237 | 88 | 380 | **268** | 22 |
| 1 | seven earlier tombstones — M40b's and M22's — that the new bar reaches, and 7 edges | 332 | 244 | 88 | 387 | **274** | 21 |
| 3 | the connection pass: 19 edges, both ends on records already here, no import | 332 | 244 | 88 | 406 | **301** | 11 |
| 4 | the twelve hinges walked, thirteen records, 8 edges | 345 | 257 | 88 | 414 | **315** | 17 |
| 5 | the nine tombstones those hinges unblock, 11 edges, one filing | 354 | 265 | 89 | 424 | **323** | 16 |
| 6 | the five batch 4 left bare: 4 tombstones back, 8 edges | 358 | 269 | 89 | 432 | **330** | 11 |
| 7 | the first sweep batch: 10 imported, 1 tombstone back, 18 edges, one filing | 369 | 279 | 90 | 450 | **349** | 11 |
| 8 | sets 3 and 4: 15 created, 9 kept and 6 retracted, 11 edges | 378 | 288 | 90 | 461 | **359** | 10 |
| 9 | the singletons §4b named: 8 edges, no import | 378 | 288 | 90 | 469 | **366** | 3 |
| 10 | sets 3 and 4 again: 16 created, 12 kept and 4 retracted, **3 tombstones back on their own named blockers**, 14 edges, three filings | 393 | 300 | 93 | 483 | **376** | 3 |
| 11 | sets 3 and 4 a third time: 15 created, 9 kept and 6 retracted, **3 more tombstones back**, 10 edges, one filing | 405 | 311 | 94 | 493 | **382** | 3 |
| 12 | **the tombstone pass**: one sweep row taken out of order, 5 tombstones back, 6 edges, one filing — corpus +6 and component +6 | 411 | 316 | 95 | 499 | **388** | 3 |
| 13 | sets 3 and 4 a fourth time: 16 created, **12 kept and 4 retracted**, no tombstone back, 14 edges, two filings — corpus +12 and component +12 | 423 | 326 | 97 | 513 | **400** | 3 |
| 14 | sets 3 and 4 a fifth time: 15 created and **one refused at the class table**, 12 kept and 3 retracted, 15 edges, three filings — corpus +12 and component +12 | 435 | 335 | 100 | 528 | **412** | 3 |
| 15 | sets 3 and 4 a sixth time: 16 created, 9 kept and 7 retracted, **1 tombstone back**, 11 edges, two filings — corpus +10 and component **+8**, the two missing being the Horn of Africa fragment | 445 | 343 | 102 | 539 | **420** | 3 |
| 16 | sets 3 and 4 a seventh time: 15 created and one refused at the class table, **6 kept and 9 retracted**, 7 edges, one filing — corpus +6 and component **+4**, the Horn fragment 4 → 6 | 451 | 348 | 103 | 546 | **424** | 3 |
| 17 | **set 0, the rows the tombstones name**: 15 created, **14 kept and 1 retracted**, **9 tombstones back**, 19 edges, one filing — corpus +23 and component **+9**, and the component *count* 12 → 18 | 474 | 370 | 104 | 565 | **433** | 3 |

## 4. The fifty M44b retracted, which are batch 0

Brief §2: they were retracted under a rule that no longer exists, and they are
the cheapest fifty events this milestone will ever get. **Fifty** event
records carry a `retraction.reason` naming M44b, and every one of those
reasons names the edge that could not be written under the Portuguese bar —
which is to say the corpus wrote down, fifty times, exactly what to do with
them once the bar changed. That work is section 2 of `docs/m42-connections.md`
and its counts are batch 0 in the table above: **fifteen came back**, on
eighteen edges, and twenty more of the fifty are listed there against the
record whose import would bring them back. The component moved because two of
those edges ran into the old corpus rather than between new records —
`philippine-american-war` had no edge at all and `lebanese-civil-war` and
`2006-lebanon-war` were a component of two — which is A5's whole instruction
tested on a batch that fetched nothing.

**And the fifty are not the whole vein.** The bar of brief §1 is not about
M44b, and the corpus holds 229 tombstones. Two hundred are M21's and M22's
Portuguese elections, robberies and local disasters, correctly withdrawn.
**M40b's twenty-eight are world events** — the Falklands, the Cultural
Revolution, Srebrenica, the Velvet revolution, the Holodomor, the
non-proliferation treaty — each withdrawn on 7 September with its reason
naming the record it was waiting for. Seven of those blockers have since
stopped being true, and batch 1 is them. One of the seven, the Ilinden rising,
was blocked only because M40b had the article's cached *lead* and not its
body: the sentence that argues the edge is in the article, and this run can
open it at a revision and cite it.

## 5. The rule the ticks follow, written before a box is ticked

M41a and M44a each wrote their tick rule into `docs/wikidata-candidates.md`
before ticking, so that the choice is a rule and not a hand and anybody can
recompute the list from that file plus `data/`. This is M42's, and it is
written here rather than there because the sweep's file is regenerated by the
tool and this has to survive that.

**M44a's rule was sitelinks with decade floors, and it produced 45 stranded
events.** That is the fault amendment A5 exists to stop repeating, and the
answer is not to abandon sitelinks — a world atlas does want the events most
of the world has written about — but to spend the first slots on **the records
the corpus has already asked for by name**. Section 1 above says the graph is
one component of 254 and thirty-one fragments; §5 of `docs/m42-connections.md`
says which record each of the thirty-five still-retracted events is waiting
for. Those two lists are what the first two sets buy.

The pool is the rows of `docs/wikidata-candidates.md` whose item is **on no
record here and in no `items` entry of `data/imports/wikidata-seeds.json`**,
recomputed against `data/` on the day of ticking and not read from the file's
own *"in the atlas"* column, which is computed when the sweep runs. Ties break
by the item id read as a number, so the same inputs give the same list twice.

The sets are taken in order, no row taken twice:

| set | what it keeps |
| --- | --- |
| 0 | **The rows the tombstones name**, added for batch 17 and written before that batch ticked a box. The row whose English label appears, verbatim and folded, inside the `retraction.reason` of a record that is retracted *now* — so the corpus has already asked for it by name, and it arrives with a neighbour waiting instead of needing one found. Computed over `data/events/*.json` on the day of ticking, never from a list; a match on a label the reason uses of a *different* thing with the same name is dropped by reading the sentence, and batch 17 dropped one that way. Ordered by sitelinks, ties by item id |
| 1 | **The named neighbours.** The row whose English label names a record that §5 of `docs/m42-connections.md` says a retracted event is waiting for: the dissolution of the Soviet Union, the revolutions of 1989, the breakup of Yugoslavia, the Bosnian war, the Rwandan genocide, the Angolan civil war, the Egyptian revolution of 2011, the Arab Spring, the second intifada, the Anglo-Irish treaty, the Troubles, the Treaty of Lisbon, the partition of India, the Berlin conference, the second Italo-Ethiopian war, the independence of South Sudan. Whole label first, then as a substring; where a label names more than one item, the higher sitelink count decides |
| 2 | **The bridges out of the fragments.** After set 1, the best by sitelinks whose label names a war, revolution, treaty or crisis that one of the atlas's own fragments argues to or from — the Ukrainian and Caucasian eight, the South Asian five, the Gaza three, the two Chinese, the two Gulf — read off §2 of `docs/m42-connections.md` |
| 3 | **Thin decades.** After sets 1–2, the best by sitelinks dated in each decade the corpus is thinnest in, so that no decade of the period is left with nothing |
| 4 | **Remainder to the cap**, the best remaining by sitelinks over the whole pool |

**Why set 0 exists, and why it is a rule and not a hand.** Sets 1 and 2 were
spent by batch 9, and from batch 10 the sweep has been sets 3 and 4 alone:
sitelinks and thin decades. Its yield across batches 13 to 16 runs twelve,
twelve, nine, **six** of sixteen, and §7 reads that fall as the ranking
reporting the shape of the corpus — once the rows a corpus of 450 has a
neighbour for are spent, sitelinks keep offering instruments nobody here signed
and wars in countries this atlas has never held. Set 0 is the cheap half of
what §7 told the next fire to do: *"the tick list is worth reading against the
216 reasons because that is where the next reinstatement actually comes from."*
It is set 1's question — which row does the corpus already want? — asked of the
retraction reasons themselves rather than of a list of sixteen labels somebody
typed once, so it recomputes as the corpus changes and it cannot run out while
the atlas keeps writing down what it is missing. **It is not a licence to keep
a record**: a set-0 row that earns no honest edge is retracted on arrival like
any other, and batch 17 retracted some.

**A tick is not a record.** Every row ticked is a row the import may write, and
what it writes is `origin: wikidata`, `review.status: draft`,
`review.flags: ["imported-facts"]` and a summary quoting the item's own
description — nothing this run composed. A record the import creates and the
connection pass cannot earn an honest edge for is retracted with its reason,
which is M40b's rule and the bar of brief §1; **nothing is written in order to
keep a record**, and a set-1 row is not exempt from that because the corpus
asked for it.

**The cap is what the Action can finish.** M44a's import ran in minutes and
M46's in two batches; deviation 442 is the six-hour runner that stopped this
repository for a day. Batches are sized to the same shape and each is merged,
indexed, validated and pushed before the next.

## 6. Batch 2's seeding — the hinges, pointed at by name

The tick rule of §5 is what picks volume out of the sweep. It is not what
picks the hinges, and the reason is worth writing down: **the sweep does not
carry them.** Applying §5's set 1 to the committed sweep finds five of the
sixteen named neighbours and misses the dissolution of the Soviet Union, the
revolutions of 1989, the breakup of Yugoslavia, the Bosnian war, the partition
of India, the Arab Spring, the Egyptian revolution of 2011 and the Troubles.
M44b said exactly this when it retracted the Romanian revolution: those
records "are on the brief's list of twelve named neighbours that the committed
candidate list does not carry because their Wikidata classes are not among the
queries'."

`data/imports/wikidata-seeds.json` → `items` is the answer the tool already
has. It is "the items, queries and class table the Wikidata import is pointed
at" and it is contributor-editable; M44a added 111 ids to it from ticks, and
naming an item by its id is the same act with the intermediate step removed.
**Twelve ids were resolved against Wikidata itself and added**, never guessed
from a label in a markdown table — which matters: matching *"Berlin
Conference"* by substring in the sweep returns `Q4892411`, a diplomatic
conference of 1954, and not `Q13582`, the conference of 1884 on the partition
of Africa.

| item | what it is | sitelinks | lane |
| --- | --- | --: | --- |
| `Q5167679` | dissolution of the Soviet Union | 90 | europe |
| `Q382861` | Revolutions of 1989 | 64 | europe |
| `Q4390259` | breakup of Yugoslavia | 57 | europe |
| `Q181533` | War in Bosnia and Herzegovina | 80 | europe |
| `Q815436` | The Troubles | 62 | europe |
| `Q541191` | Anglo-Irish Treaty | 48 | europe |
| `Q129053` | partition of India | 81 | asia |
| `Q49106` | Second Intifada | 48 | asia |
| `Q29198` | 2011 Egyptian revolution | 73 | africa |
| `Q12055176` | Angolan Civil War | 49 | africa |
| `Q207950` | 2011 South Sudanese independence referendum | 40 | africa |
| `Q13582` | Berlin Conference | 71 | — |

A lane is **where the event happened and not what it was about**, and it is a
display fact: which row of the timeline a bar sits in. `Q13582` takes none
here, because the conference sat in Berlin and was about Africa and this run
will not settle that with a table entry; the import derives it from the item's
own point or refuses it, and a refusal is listed.

**The one entry a reader should argue with is `Q5167679`.** The dissolution of
the Soviet Union is the case deviation 447 left open — ground that spans two
lanes — and it is given `europe` because every Soviet and Russian event this
atlas already draws is in `europe`: the February and October revolutions, the
civil war, the Molotov–Ribbentrop pact, Katyn, the war in Ukraine. Consistency
with the corpus, not a judgement about where the Soviet Union was. It is one
line in `lanes` to undo.

**`Q33761`, the Arab Spring, is not seeded and stays refused**, because it is
the same open question with no such precedent to follow: it ran across Africa
and Asia and this atlas has nothing like it. That is the brief's *"refuse and
list"* (§3), and the cost is named — `syrian-civil-war`, `libyan-civil-war`
and `2013-egyptian-coup-d-etat` each wait on it and are listed in
`docs/m42-connections.md` §5. `Q69163529`, the fall of the Berlin Wall, is
also not seeded: its only Wikidata classes are *historical event* and
*demolition*, and adding either to the class table would type anything at all.
The revolutions of 1989 carry that hinge instead.

**Ten classes were added to the class table**, each because a seeded item
carries it and the table did not: *dissolution of an administrative
territorial entity*, *revolutionary wave*, *ethnic conflict*, *war of
aggression*, *partition*, *sectarian violence*, *intifada*, *international
conference* and *independence referendum*. Every label is Wikidata's own, read
from the service — which the M40a entries beside them could not do, and each
of those says so: *"the label is what the candidate list called those items…
this sandbox has no network to read it with."* Four classes were deliberately
**not** added — *end cause*, *conflict*, *historical event* and *demolition* —
because a class that types anything types nothing.

**One cursor rewind**: `Q94916`, the Second Italo-Ethiopian war, is in
`runs.import.done` with no record, refused on an earlier walk for want of a
lane. It has one now, so it goes back into the walk — which is M44-0's and
M46's move, and deviation 546's rule that an item in `done` is silent and an
item walked again is named in every report.

## 7. Where the run stands, for the fire that picks it up

Eighteen batches are on `m42` and each was validated, indexed and pushed before
the next, so a killed run loses a batch and not the milestone.

| | what landed |
| --- | --- |
| batch 0 | the fifteen M44b retracted that the new bar puts back, 18 edges |
| batch 1 | seven earlier tombstones — M40b's and M22's — 7 edges |
| batch 2a | the twelve hinges seeded, ten classes, twelve lanes, one rewind |
| batch 3 | the connection pass: 19 edges, no import, component 274 → 301 |
| batch 4 | the hinges walked here: 13 records, 8 edges, component 301 → 315 |
| batch 5 | the nine tombstones they unblock: 11 edges, one filing, 315 → 323 |
| batch 6 | the five batch 4 left bare: 4 tombstones, 8 edges, 323 → 330 |
| batch 7 | the first sweep batch: 10 imports, 1 tombstone, 18 edges, 330 → 349 |
| batch 8 | sets 3 and 4: 15 created, 6 retracted, 11 edges, 349 → 359 |
| batch 9 | the singletons §4b named: 8 edges, no import, 359 → 366 |
| batch 10 | sets 3 and 4 again: 12 kept, 4 retracted, 3 reinstated, 14 edges, 366 → 376 |
| batch 11 | sets 3 and 4 again: 9 kept, 6 retracted, 3 reinstated, 10 edges, 376 → 382 |
| batch 12 | the Great Lakes joined: 1 import, 5 reinstated, 6 edges, 382 → 388 |
| batch 13 | sets 3 and 4 a fourth time: 12 kept, 4 retracted, 0 reinstated, 14 edges, 388 → 400 |
| batch 14 | sets 3 and 4 a fifth time: 12 kept, 3 retracted, 1 refused at the class table, 15 edges, 400 → 412 |
| batch 15 | the Horn of Africa opens: 9 kept, 7 retracted, 1 reinstated, 11 edges, 412 → 420 |
| batch 16 | the lowest yield of the run: 6 kept, 9 retracted, 1 refused, 7 edges, 420 → 424 |
| batch 17 | **set 0, the rows the tombstones name**: 14 kept, 1 retracted, **9 reinstated**, 19 edges, 424 → 433 |

**Where the milestone stands against its own done-condition.** The brief asks
for an order of magnitude more active events than the 250 it was written
against. The corpus holds **474**, up from 310, and its largest connected
component holds **433 of them**, up from 254 — so the connectedness is nearly
done and the volume is barely begun. **The volume is the sweep**: the rows the
tool has already found and nobody has walked, recomputed against `data/` at
every ticking rather than remembered. That recount stood at 1,557 on 21
September and again at batch 10, and batch 13 measures the same pool over the
`world` sections alone at **1,191 rows**, batch 14 at **1,175**, batch 15 at
**1,159**, batch 16 at **1,143** and batch 17 at **1,127**, sixteen fewer each
time, which is the
sixteen the batch before it spent; the two numbers are the same rule
asked of a slightly different set of sections, and the one to trust is whichever
the batch that is ticking has just computed. §5's tick rule, written before a
box was ticked, is how they are chosen. Batches 7, 8, 10, 11 and 13 are the ones
taken by that rule: sets 1 and 2 are spent, and from here the sweep is sets 3
and 4. **Batch 8 is what that costs**: sixteen rows ticked, fifteen
created, nine kept and six retracted, because a rule that picks by sitelinks and
by thin decades picks records this corpus has no neighbour for. **Batch 10 is
the same sixteen-row cap and it kept twelve**, and batch 13 kept twelve of
sixteen too, which puts the rate over four sweep batches at **ten to twelve kept
a batch**, not sixteen.

**Batch 10 found the other thing a sweep row can do, and it is worth more than
the row itself.** Three of its sixteen brought back a tombstone whose own
retraction named the missing record by name — the Heligoland–Zanzibar treaty
for `anglo-zanzibar-war`, the Mali war for `libyan-civil-war`, and the
Hay–Bunau-Varilla treaty for `thousand-days-war`, which **batch 8 of this same
run had retracted eight hours earlier**. The corpus writes down what it is
missing every time it withdraws a record, and a sweep row is worth reading
against those 215 notes and not only against the graph.

**The Action cannot land an import**, and two runs proved it — §2d has the
reading and deviation 987 the short form. Every batch from here is therefore
walked in this sandbox, through `tools/import/wikidata.mjs`, which answers
here now. The seeds are exhausted as fast as they are written: 741 items, 741
walked.

**A batch lands in two commits, not one** (deviation 798, re-learned as 982):
the records, then the rebuilt index.

**Batch 12 found the ratio between the two ways of growing this corpus, and a
run with time for one of them should know which it is choosing.** A sweep batch
adds ten or eleven records and opens a corner of the world the atlas has one or
two records of, so the corpus grows faster than the component and the component
*count* rises. A tombstone pass adds nothing new at all and every record it
touches already has a neighbour waiting: batch 12 grew the corpus by six and
the component by six, with the component count unmoved, because it was chosen
by reading the 213 retraction reasons rather than the sitelink ranking. **The
sweep is the volume; the tombstones are the connection.** Both are needed and
they are not interchangeable.

**Batch 13 qualifies that, and the qualification is the more useful half.** It
is a sweep batch and it grew the corpus by twelve and the component by twelve,
with the component count unmoved — the thing batch 12 said only a tombstone
pass could do. What bought it was not a better pick but a harder hand on the
four rows that had no neighbour: `sixth-cholera-pandemic`, `black-monday`,
`tigray-war` and `tajikistani-civil-war` were all retracted on arrival rather
than kept as a fragment of their own. **A sweep batch grows the component as
fast as it grows the corpus provided it is willing to retract a quarter of what
it fetched**, and a batch that keeps everything it fetches is what makes the
component count rise.

**The tombstone vein is thinning, but it is not spent.** Batch 13 and batch 14
both ran the scan first and it returned nothing to reinstate; eleven had come
back across batches 10 to 12. **Batch 15 brought back a twelfth**, and it did
so the other way about: not by scanning the reasons for a record that is
already active, but by importing the record a reason named. `tigray-war`'s
batch 13 retraction said *"it waits on a record of the Ethiopian Civil War"*,
and `Q257724` came up in set 3 of batch 15's own sixteen. So the scan is worth
running first because it costs nothing, and the tick list is worth reading
against the 216 reasons because that is where the next reinstatement actually
comes from.

**Batch 15 also found what a sweep costs when it opens a region rather than a
gap.** Corpus +10, component +8: the Ethiopian civil war and the Tigray war
joined the Ogaden war and the Somali civil war and made a fragment of four
rather than reaching the middle. That is not a failure to write an edge — §2o
lists what each end of the Horn cluster waits for, and the one record of the
five its infobox names that this atlas holds, `revolutions-of-1989`, is
forbidden by rule 4 against a war that began in 1974. **The Horn is the second
Sudan.** A sweep that opens a new corner of the world will keep producing
these, and the run should say which of the two it did rather than reporting one
number.

**Batch 16 is where the sweep's yield starts falling, and the number is worth
planning an hour against.** Across batches 13 to 16 it goes **twelve, twelve,
nine, six** kept of sixteen. That is §5's ordering reporting the shape of the
corpus rather than failing: sets 3 and 4 rank by sitelinks and by thin decade,
and once the rows a corpus of 450 records has a neighbour for are spent, what
the ranking keeps offering is **instruments nobody here signed and wars in
countries this atlas has never held**. Eight instruments have now been retracted
on arrival; §7.4's environment-shaped hole is the general case of it. **Plan on
about half a sweep batch from here**, and on the two things that are still
cheap: the tombstone notes, and reading the tick list against them before
importing.

**Batch 17 answers batch 16, and the answer is set 0.** The falling yield was
never the pool running out of records this corpus could join; it was the
*ordering* asking the wrong question. Sets 3 and 4 rank by sitelinks and thin
decade — how much of the world has written about a row — and say nothing about
whether this atlas has anywhere to put it. **Set 0 ranks by whether a record
here has already written down that it is missing.** Fourteen of fifteen kept
against six of fifteen, and nine tombstones back in one batch against eleven
across the previous eight. The rule is in §5 above, written before a box was
ticked, and it recomputes from `data/events/*.json` rather than from a list, so
it cannot go stale and it cannot run out while the atlas keeps writing down
what it is missing — **though the paragraph three below this one qualifies that
last clause sharply, and it was written by the same batch an hour later**: set 0
recomputes but it does not refill, and batch 17 took almost everything it had.

**What set 0 does not buy is reach, and batch 17 is where that shows.** Corpus
+23 and component +9: the other fourteen went into six new pairs and trios,
and the count of components rose from twelve to eighteen. The reason is
structural and worth writing down for the rule that follows: **a tombstone is a
note of what is missing, and its record lands where the tombstone was.** Where
the waiting tombstone already had a neighbour in the middle — the Korean war
behind `japan-korea-treaty-of-1907`, the Jameson raid behind
`first-matabele-war`, the Afghan war of 1989–1992 behind
`tajikistani-civil-war` — the import reaches the middle. Where the waiting
tombstone was itself outside it, two tombstones join each other and make a
fragment, honestly edged and still a fragment. **So set 0 should be ordered by
whether the waiting tombstone's other end is in the largest component**, which
`tools/m42-pool.mjs` already computes, and a batch that wants reach rather than
keep rate should take those rows first. That is the rule for the next fire to
write before it ticks (deviation 1007).

**Set 0 is spent in one batch, and that is the finding batch 17 could only
make by running it.** Recomputed after the batch, the rule returns **two rows
out of a pool of 1,112**, and neither is real: `Q1972326` is the Treaty of
Lausanne of 1912 that batch 17 already read and dropped, and `Q2229133`
(*Protocol I*) matches only because the label is a substring of the phrase
"protocol it reinstates" inside a reason written by that same batch — a false
positive of the matching rule, not a candidate. **Set 0 recomputes, but it does
not refill**: its size is bounded by how many *tombstone reasons name a record
the sweep happens to carry under that exact label*, and batch 17 took eleven of
the twelve that existed. It refills only as new retractions are written, a
handful a batch. So the next fire should **not** plan on set 0 as a vein; it
should plan on it as a filter to run first, free, and usually empty.

**What the tombstones still ask for is not in the sweep at all, and that is
batch 18.** Nineteen live tombstones carry an explicit *"It waits on …"* clause
and most name a record by name. Those names resolve on Wikidata in one lookup
each, and **the sweep does not carry them** — which is exactly what §6 says
about the hinges, and exactly why batch 2a seeded items directly instead of
ticking rows. The resolutions are done and written here so the next fire does
not repeat them:

| item | record | unlocks | class in the table? |
| --- | --- | --- | --- |
| `Q49101` | Suez Crisis, 29 Oct – 7 Nov 1956 | `1958-lebanon-crisis`, whose reason calls it *"the record its own background turns on"* | no — `Q1384277` *military expedition* |
| `Q154681` | Anschluss, 12–13 March 1938 | `austrian-civil-war` | no — `Q194465` *annexation*, `Q183366` *territory* |
| `Q65053343` | 2022 Brazilian general election, 2 Oct 2022 | `2023-brazilian-congress-attack`, the one-row gap batch 16 named | no — `Q76853179` *group of elections* |
| `Q518753` | Sharpeville massacre, 21 March 1960 | `soweto-uprising`, which waits on *"any South African record of the apartheid period"* | **yes** |
| `Q74200048` | Independence of Morocco, 18 Nov 1956 | `ifni-war`, which waits on *"Moroccan independence in 1956"* | no — `Q37055` *independence* |
| `Q592550` | British expedition to Tibet, Dec 1903 – Sep 1904 | `treaty-of-lhasa`, which waits on it by name | no — `Q1384277`, `Q831663` *military campaign*, `Q467011` *invasion* |
| `Q751149` | Earth Summit, Rio, 3–14 June 1992 | `aarhus-convention`, and §7.4's hole, which wants an environmental *event* | no — `Q625994` *convention* |
| `Q2120252` | Siamese revolution of 1932, 24 June 1932 | `1893-franco-siamese-crisis`, which waits on *"any Siamese or Indochinese neighbour before 1946"* | **yes**, and it is a pool row too |

Three more were looked up and are **not** batch 18's, with the reason written
down rather than left to be rediscovered: `Q783910` *Austrofascism* and
`Q167634` *perestroika* are a political system and a movement, not events, and
neither carries a date this atlas could use as an interval; `Q191703`, the
Organisation of African Unity, is an **actor**, and an actor cannot carry the
edge `african-charter-on-human-and-peoples-rights` is waiting for, because an
edge runs between events. `Q2629473` (UN resolution 1514), `Q6895819` (the
Moldovan declaration of independence) and `Q1639868` (the Rivonia trial) each
name no date at all on Wikidata, and deviation 989's rule stands: **no date is
invented and none is widened**, so each would have to be written by a person or
dated from its article by one.

**So batch 18 has a class-table question in front of it, and it is a real
question.** Six of the eight carry a class `data/imports/wikidata-seeds.json`
does not name. Deviation 1005 says a class missing from the table is not a hole
to be filled on the way past — but 1005 was about a sweep batch where *nothing
was blocked*, and here six records are blocked and the question is properly
posed. The precedent for posing it is §6: batch 2a, pointed at named records
rather than at the sweep, **added ten classes and said which**. Batch 18 should
do the same and name every one in its own section: *military expedition*,
*annexation*, *group of elections*, *independence*, *military campaign*,
*invasion*, *convention*. `CLAUDE.md` is why they go in the file and not in
code — each is a decision somebody can argue with.

**And batch 18 is the reach batch set 0 was not.** Every one of the eight has a
neighbour in the largest component and not merely a tombstone: Suez into the
Arab–Israeli records, the Anschluss into `world-war-ii` and `treaty-of-sevres`'s
decade, the 2022 election into `the-2018-brazilian-general-election`, Sharpeville
into `second-boer-war`'s country, Morocco into `french-conquest-of-morocco`, the
Tibet expedition into `british-russian-convention`, Rio into the ozone pair and
`covid-19-pandemic`'s decade. That is deviation 1007's ordering applied: **take
the hinge whose waiting tombstone is not the only thing it can reach.**

**What the next fire does**, in this order:

0. **Read the tombstones first**, which costs no fetch, and read them *twice*:
   once as batch 13 did, for a retracted record whose reason names a record
   that is active now, and once as **set 0** does, for a pool row whose label a
   reason names. The first came back empty in batches 13, 14 and 17; the second
   is what gave batch 17 nine reinstatements. The scan below is the first. `node -e` over
   `data/events/*.json` picking the retracted records whose `retraction.reason`
   names a record that is active now is twenty lines and found eleven
   reinstatements across batches 10 to 12 and **none in batch 13**. The four
   that came up and were *not* taken are named in §5b with what each still
   waits for, and `portuguese-european-constitution-referendum` and
   `transnistria-war` are there for reasons no batch can clear — a ballot that
   never happened, and a date rule 4 refuses. Batch 13 also read the reasons
   against its own subjects rather than only against the id list, which is the
   stronger form of the scan: `may-coup` and `1907-romanian-peasants-revolt`
   both came up and neither was unlocked.
1. **A set-0 batch, then a sweep batch.** Tick by §5's rule — set 0 first,
   ordered as the paragraph above says, and sets 3 and 4 only to fill the cap — add the ids to
   `data/imports/wikidata-seeds.json` → `items` with a lane and a class each,
   walk them here, and connect every one of them the same day. The rate at
   which this milestone can go is **the rate at which a person can read the
   sentence that argues each edge**, which batches 3 to 6 put at roughly ten
   to twenty records. It is not the rate at which records can be fetched, and
   a batch that fetches a hundred and argues eight has not done the work.
2. **Every batch re-measures** `docs/m53-polities.md` §4.1 and names its bare
   records in §2 of `docs/m42-connections.md`. Those two obligations are what
   the runner cannot discharge and a run can, and skipping them is what turns
   a green tree red two commits later.
3. **The fragments no import reaches**, when a batch has room. §4b's list is
   spent: batch 8 took `entente-cordiale` and batch 9 took seven of the nine
   presidential singletons. What is left outside the largest component after
   batch 10 is the Sudanese five, the Madeiran three, the fires pair, the two
   new pairs batch 10 opened — Panama/Colombia and Libya/Mali — and three
   records with no edge: `1923-portuguese-presidential-election`,
   `1951-portuguese-presidential-election` and `iberian-blackout-2025`. §2i and
   §2j say what each waits for, and none of them waits on a fetch.
4. **The environment-shaped hole**, which batch 10 found and which costs the
   sweep two of its best rows every time it reaches one. `paris-agreement`,
   `ramsar-convention`, `united-nations-convention-on-the-law-of-the-sea` and
   the Stockholm convention are tombstones for the same reason: the instrument
   decided nothing this corpus holds. **Batch 17 made the first dent and it
   shows the shape of the hole exactly.** `montreal-protocol` came back on
   `vienna-convention-for-the-protection-of-the-ozone-layer`, which is the
   convention it is a protocol *to* — so the atlas now holds an environmental
   pair joined to each other and to nothing else — while `aarhus-convention`,
   imported in the same batch, was retracted on arrival as the ninth such
   instrument, because an information-access convention has nothing to do with
   chlorofluorocarbons. **Two environmental treaties do not make an
   environmental corner.** What the hole actually wants is an environmental
   *event*: the Rio Earth Summit of 1992, which `aarhus-convention`'s reason
   names, or the discovery of the ozone hole, which the Montreal article puts
   eighteen months before the protocol. Until one of those is a record, §2j's
   reading stands.
5. **Sudan is the one fragment a sweep row cannot reach**, and §2g says why:
   records joined to each other and to nothing else. Batch 10 tested that
   reading against two more pages — the first Sudanese civil war's and
   Darfur's — and neither relates a Sudanese record to anything else this atlas
   holds, so the fragment grew to five and stayed a fragment. It waits on a
   page, not on a fetch.

## Filing pass (A6)

*21 September, by the scheduled run, before any further import. Amendment A6
is the owner's, with a screenshot of the timeline at 474 active events:*
**"the timeline has too many events. As it is right now it is useless. For it
to be useful it should only show parent and main events and the title for the
events. For example, sometimes historians call interwar period for the years
between WW1 and WW2, you could only show that for Europe … and then when you
click on it it can show you everything that happened during that time."**

**The main count before the pass: 474 active events, 370 of them main.** By
lane and century, which is the measurement A6 asks for:

| century | europe | asia | africa | americas |
| --- | --- | --- | --- | --- |
| 15th | 1 | 0 | 0 | 4 |
| 16th | 1 | 0 | 0 | 3 |
| 17th | 1 | 0 | 0 | 6 |
| 18th | 1 | 0 | 0 | 3 |
| 19th | 8 | 6 | 6 | 11 |
| **20th** | **135** | **52** | **30** | **31** |
| 21st | 43 | 15 | 8 | 5 |
| **all** | **190** | **73** | **44** | **63** |

**After it: 477 active events, 267 main** — three umbrellas written, 106 main
events filed under them, and no other record touched.

| century | europe | asia | africa | americas |
| --- | --- | --- | --- | --- |
| 15th | 1 | 0 | 0 | 4 |
| 16th | 1 | 0 | 0 | 3 |
| 17th | 1 | 0 | 0 | 6 |
| 18th | 1 | 0 | 0 | 3 |
| 19th | 8 | 6 | **1** | 11 |
| **20th** | **71** | 52 | 30 | 31 |
| 21st | **9** | 15 | 8 | 5 |
| **all** | **92** | **73** | **39** | **63** |

Europe's twentieth century falls from 135 to 71 and its twenty-first from 43
to 9, which is the part of the picture the owner was looking at. **Asia and
the Americas are untouched and that is this pass's own unfinished half**;
§"What the filing pass leaves" below says what each waits on. The target A6
sets — main events in the low tens per century — is met for Europe after 1974
and is not met anywhere else.

**The largest connected component is unchanged at 433**, and it must be: a
filing writes `parent` and `parent` is a display fact that takes no edge
(`CLAUDE.md`). A5's number moves on a batch, not on a filing.

### The three umbrellas, each on a span its source gives

| id | item | span | lane | where it came from |
| --- | --- | --- | --- | --- |
| `interwar-period` | Q154611 | 1918-11-11 – 1939-09-11 | europe | the Wikidata import, walked here |
| `scramble-for-africa` | Q179848 | 1885 – 1914 | africa | the Wikidata import, walked here |
| `third-portuguese-republic-since-1974` | Q1259200 | since 1974-04-25 | europe | written here on M62's pattern |

The first two are the import's own work: the items were added to
`data/imports/wikidata-seeds.json` with a lane each, and `--import` walked
them, so their spans, titles and summaries are Wikidata's and nothing in them
was written here. One class was added to the seeds file for the pass, as
batch 2a and batch 18 added theirs: **Q230533 *decolonization***, and it is
not used yet — see the refusal below.

**`third-portuguese-republic-since-1974` could not come from the import**, and
the reason is worth writing down: Q1259200 is an *instance of republic*, so
the class table reads it as the **actor** this atlas already holds
(`third-portuguese-republic`), and an actor cannot be a parent. It is written
here instead, exactly as M62 wrote `first-portuguese-republic-1910-1926` and
`estado-novo-1933-1974`: `origin.tool: assistant`, `review.status: draft`,
flagged `summary-drafted`, and **its span taken from the sources and not from
memory** — the item's own description ("period in the history of Portugal
since the Carnation Revolution on 25 April 1974") and the article's lead,
both cited on the record with the revision each was read at. It is the third
of the four Portuguese regime umbrellas and the one M62 did not write.

**Both imported umbrellas name neither an actor nor a place**, which
`tests/m67.test.mjs` asks to be accounted for and M67's amendment A1 already
answered in general: a period has no single actor and no one place, and a line
written to give it one would be a claim the source does not make. The import
wrote none because the items give none.

### What was filed, and under which

**Under `interwar-period`, 28** — every main event of the europe lane whose
years fall inside 1918–1939, less the four refused below. The rule is A6's:
in the span and in the region. The peace settlement of the war that ends the
day the period begins goes here and nowhere else, because this atlas dates
`world-war-i` 1914–1918 and rule 4 would refuse an edge from a war to a
treaty signed after it; the period is the honest home for Versailles, Sèvres,
Trianon and Neuilly.

`estonian-war-of-independence`, `paris-peace-conference`, `treaty-of-neuilly-sur-seine`, `treaty-of-versailles`, `kapp-putsch`, `svalbard-treaty`, `treaty-of-sevres`, `treaty-of-tartu`, `treaty-of-trianon`, `anglo-irish-treaty`, `peace-of-riga`, `irish-civil-war`, `march-on-rome`, `treaty-of-rapallo`, `beer-hall-putsch`, `population-exchange-between-greece-and-turkey`, `treaty-of-lausanne`, `locarno-treaties`, `coup-28-may-1926`, `kellogg-briand-pact`, `constitution-1933`, `baltic-entente`, `german-polish-declaration-of-non-aggression`, `anti-comintern-pact`, `spanish-civil-war`, `first-vienna-award`, `munich-agreement`, `slovak-hungarian-war`

**Under `scramble-for-africa`, 6** — every main event of the africa lane
inside 1885–1914, with nothing refused. The partition wars of southern and
eastern Africa are what the article is about.

`first-matabele-war`, `first-italo-ethiopian-war`, `jameson-raid`, `anglo-zanzibar-war`, `second-matabele-war`, `second-boer-war`

**Under `third-portuguese-republic-since-1974`, 72** — the europe lane inside
the span *and* inside the subject, which here is Portugal: the event's place
is Portuguese, or its actors are the republic, its parties, its presidents
and prime ministers, its banks and its utilities. Fifty years of elections,
governments, referendums, bailouts, fires and crises.

`spinola-resigns-1974`, `25-november-1975`, `alvor-agreement-1975`, `constituent-assembly-election-1975`, `coup-attempt-11-march-1975`, `nationalisations-1975`, `1976-azorean-regional-election`, `1976-madeira-regional-legislative-election`, `1976-portuguese-local-elections`, `constitution-1976`, `eanes-elected-1976`, `edp-created-1976`, `legislative-election-1976`, `eec-application-1977`, `treaty-of-friendship-and-cooperation-between-spain-and-portugal`, `imf-agreement-1978`, `1979-portuguese-legislative-election`, `1979-portuguese-local-elections`, `1980-portuguese-legislative-election`, `1980-portuguese-presidential-election`, `constitutional-revision-1982`, `1983-portuguese-legislative-election`, `imf-agreement-1983`, `1985-portuguese-legislative-election`, `treaty-of-accession-1985`, `eec-accession-1986`, `soares-elected-president-1986`, `1987-european-parliament-election-in-portugal`, `cavaco-absolute-majority-1987`, `1991-portuguese-legislative-election`, `1995-portuguese-legislative-election`, `schengen-in-force-1995`, `1996-portuguese-presidential-election`, `cplp-founding-1996`, `1998-portuguese-abortion-referendum`, `expo-98`, `portuguese-regionalisation-referendum-1998`, `euro-adoption-1999`, `2001-portuguese-local-elections`, `2002-portuguese-legislative-election`, `2005-portuguese-legislative-election`, `2006-portuguese-presidential-election`, `2007-portuguese-abortion-referendum`, `bpn-nationalisation-2008`, `2009-portuguese-legislative-election`, `crisis-portugal`, `2011-portuguese-legislative-election`, `2011-portuguese-socialist-party-leadership-election`, `2014-portuguese-socialist-party-prime-ministerial-primary`, `bes-resolution-2014`, `geringonca-2015`, `legislative-election-2015`, `marcelo-elected-president-2016`, `october-fires-2017`, `pedrogao-grande-fires-2017`, `legislative-election-2019`, `covid-state-of-emergency-2020`, `2022-portuguese-social-democratic-party-leadership-election`, `marcelo-reelected-2021`, `2022-portuguese-social-democratic-party-leadership-election-q111182017`, `legislative-election-2022`, `2023-madeiran-regional-election`, `costa-resigns-2023`, `world-youth-day-2023`, `2024-madeiran-regional-election`, `fiftieth-anniversary-25-april-2024`, `legislative-election-2024`, `montenegro-government-2024`, `2025-madeiran-regional-election`, `government-falls-2025`, `iberian-blackout-2025`, `legislative-election-2025`

### What was refused, and why

**Four candidates of the interwar period's own span.** Three are refused on
the period's own start date, which is 11 November 1918 and not 1 January:

- `armistice-of-mudros` — 30 October 1918, twelve days before the period
  begins. It is an act of the war and not of what followed it.
- `german-revolution-of-1918-1919` — begins 4 November 1918, a week before.
  M67 already read Q170306's `part of` as the *revolutions of 1917–1923*, and
  that is where it belongs when this atlas holds one.
- `polish-ukrainian-war` — begins 1 November 1918, ten days before.
- `ditadura-nacional-1926-1933` — **a period inside a period**, which A6
  refuses: "do not nest periods more than one deep". It keeps its three
  children and stays main, as `first-portuguese-republic-1910-1926`,
  `estado-novo-1933-1974` and `the-holocaust` do; the last two also outlive
  the span.

**One act refused under the Third Republic**, on M67's judgement 1, which A6
leaves standing: a period named for a form of government does not contain the
act that created it. `carnation-revolution-1974` stays main, as
`republic-proclaimed-1910` and `coup-28-may-1926` do for the republics they
made and unmade.

**Thirteen multilateral instruments in the lane and in the span, refused on
M67's judgement 2**: the author is another state or a body of states, with
Portugal one signatory among many. `maastricht-treaty`, `treaty-of-lisbon`,
`treaty-of-nice`, `amsterdam-treaty`, `single-european-act`,
`treaty-establishing-a-constitution-for-europe`, `schengen-agreement`,
`good-friday-agreement`, `rome-statute-of-the-international-criminal-court`,
`budapest-memorandum`, `treaty-on-the-final-settlement-with-respect-to-germany`,
`vienna-convention-for-the-protection-of-the-ozone-layer` and `louvre-accord`.
**Portugal's own acts on the same subjects are filed**, and the distinction is
the whole of the judgement: `eec-application-1977`, `treaty-of-accession-1985`,
`eec-accession-1986`, `schengen-in-force-1995`, `euro-adoption-1999`,
`1987-european-parliament-election-in-portugal` and `cplp-founding-1996` are
things the Portuguese republic did, not things done to it.

**Seventeen European events of the span that are not Portugal's**:
`revolutions-of-1989`, `romanian-revolution-1989`,
`1991-soviet-coup-d-etat-attempt`, `belovezh-accords`,
`dissolution-of-the-soviet-union`, `breakup-of-yugoslavia`,
`croatian-war-of-independence`, `yugoslav-wars`, `kosovo-war`, `the-troubles`,
`1993-russian-constitutional-crisis`, `orange-revolution`, `euromaidan`,
`russo-ukrainian-war`, `wagner-group-rebellion`,
`2001-insurgency-in-macedonia` and `2008-kosovo-declaration-of-independence`.
They are in the lane and in the span and outside the subject, and they are
exactly what a European period after 1989 would take. **There is no such
umbrella here yet** and one is not invented: the pass refuses to write a
period no article names.

**One umbrella refused for want of a date, and it is the one Africa most
wants.** *Decolonisation of Africa*, Q1146918, is the obvious umbrella for
the thirty African records between 1950 and 1975 — the Algerian war, the two
Sudanese wars, the Portuguese colonial war, the Guinean ballots, the Zanzibar
revolution. **Wikidata dates its start to the decade** (precision 8, "1950s"),
and the import refuses a date it cannot read as a year: deviation 989's rule
is that no date is invented and none is widened. Its class Q230533 is now in
the seeds table so that the next attempt is not blocked twice, and what it
waits on is a year from the article or from a person, not a fetch.

### What the filing pass leaves

**Asia (73 main) and the Americas (63 main) are not filed**, and neither is
Africa before 1885 or after 1914. The pass ran the two lanes where the crowd
was thickest and the periods were named; the rest is the same job and needs
the same thing — **a period Wikipedia has an article for, with a span and a
region**. What the measurement suggests, for the fire that picks this up:

- **the Americas.** Brazil is two thirds of the lane and its periods are
  already half written here: `empire-of-brazil-1822-1889`,
  `the-1930-revolution-and-the-vargas-era` and
  `brazilian-military-dictatorship-1964-1985` exist as umbrellas, and what is
  missing between and after them is the Old Republic — which **M67 refused by
  name** and A6 does not overrule, because M67's ground was the subject test
  and not the article — and the *Nova República* since 1985.
- **Asia.** No one period covers it and none should: the lane holds the
  Chinese revolutions, the two Indochina wars, the partition of India, the
  Arab–Israeli conflict and the Afghan wars. The Arab–Israeli conflict
  (Q8669, from 1948) is the one umbrella of the lane with an article, a start
  date and a subject a record can be tested against, and it is a conflict
  rather than a period, which A6 allows in the way it allows a war.
- **the Cold War stays refused**, as M67 refused it: *"part of the Cold War"*
  is a historiographical argument and an argument belongs in an edge with a
  confidence, not in a `parent` that carries no hedge. A6 legitimises a period
  **with a region**, and the Cold War's region is the world.

**Round two was stopped by the Wikimedia API and not by a judgement**
(deviation 1013). The Brazilian *Nova República* — `Q2920526`, "History of
Brazil (1985–present)", the pt article's own title — is the one further
umbrella this pass had read far enough to write: it completes the Brazilian
chain the corpus already holds (`empire-of-brazil-1822-1889`,
`the-1930-revolution-and-the-vargas-era`, `brazilian-military-dictatorship-1964-1985`)
and would take `the-1988-brazilian-constitution`, `operation-car-wash-2014`,
`the-impeachment-of-dilma-rousseff-2016`, `the-2018-brazilian-general-election`,
`lula-returns-to-the-presidency-2023` and `the-commodity-boom-and-the-chinese-buyer`.
Its item carries **no start date**, so like the Third Republic it must be
written by hand from the article, and the article API answered *"You are
making too many requests"* for as long as this fire asked. **A record whose
citation cannot be read is not written**, so it waits for the next fire, which
should spend its article calls before its Wikidata ones.

**What the next fire does.** The pass is written down, so the gate of STEP 3
is satisfied and **the batches resume** — batch 18, the eight hinges §7
resolves, each imported, connected and **filed as it lands**. The two
umbrellas above are the filing work still owed, and neither blocks a batch.

**The main count must not rise from here.** Every batch after this pass
reports it and files what it imports as it imports it; a batch that leaves it
higher than it found it says why (A3, with A6's teeth).

## Batch 18 — the hinges the tombstones name, and the two umbrellas they forced

*21 September, the fire after the filing pass. §7 resolved these eight before
this fire started and the resolutions held: all eight items answered, all eight
carry a date, and nothing had to be looked up twice.*

| | |
| --- | --- |
| imported | 8 |
| kept | 7 |
| retracted on arrival | 1 (`sharpeville-massacre`) |
| tombstones back | 7 |
| edges written | 13 |
| umbrellas written | 2 |
| main events filed | 17 |
| corpus | 477 → **493** active |
| **main** | 267 → **266** |
| largest connected component | 433 → **441** |
| components | 21 → 26 |

**The main count fell, which is what A6 asks of every batch from here.**
Sixteen of the batch's records would have arrived main; two umbrellas and
seventeen filings more than cover them. The two umbrellas are the ones the
filing pass's own §"What the filing pass leaves" nominated by name, so nothing
here is a period this run invented.

### The seven classes added, and the one refused

`Q1384277` military expedition, `Q194465` annexation, `Q76853179` group of
elections, `Q37055` independence, `Q831663` military campaign, `Q467011`
invasion, `Q625994` convention — and `Q11422542` international conflict for
the Arab–Israeli umbrella, eight in all. Every label and description is read
from the item over the network, as batch 2a's ten were. **`Q183366` territory
is refused**: an area of land is not an event, and the Anschluss carries it
beside `Q194465`, so adding it as anything but an event would make that item's
classes disagree and refuse it. One known class is enough, which is what
`classify` does.

`Q625994` is the one worth reading twice. Wikidata glosses it "meeting of a
group of individuals and/or companies in a certain field", so the Earth Summit
is a **conference and not a treaty**, and the entry carries no category rather
than the one the word suggests — `Q154278` is the precedent for leaving it
unset.

### The one refusal, which is the batch's most useful finding

**`sharpeville-massacre` was imported to unlock `soweto-uprising` and does
not.** The uprising's reason asks for "any South African record of the
apartheid period"; Sharpeville is one; no article argues the link. Both stay
retracted and §5a's reading is the general case: **the record a tombstone asks
for and the sentence an edge needs are two different things**, and a reason
written as "it waits on any X" is a weaker promise than one that names a
record. Of the nineteen live "It waits on …" clauses, the ones that name a
record by name are the ones that pay: seven of seven here.

### What this batch says about the interval rule

`suez-crisis` arrived starting in 1957 and ending in 1956, which rule 15
refused. Q49101 carries a span (P580/P582, 29 October to 7 November 1956) and a
stray point in time (P585, March 1957), and `intervalFor` prefers the point in
time to the span for an event. **The record was corrected to the same item's
own span** — no date invented, none widened, deviation 989 untouched — and
flagged `m42-interval-corrected`. It is the first time this run has seen the
preference produce an inverted interval, and it will happen again: any item
with both a span and a later point in time is the same shape. A fire that
imports one should check rule 15 before it writes an edge, because the
validator catches it and nothing else does.

### What the next fire does

1. **The eleven remaining "It waits on …" tombstones**, which §7's table did
   not resolve. Three were looked up and refused there (Austrofascism,
   perestroika, the OAU) and three more name no date at all (UN resolution
   1514, the Moldovan declaration, the Rivonia trial). What is left is worth a
   lookup pass of its own, and it is the vein batch 18 proves: **seven of
   seven kept, against six of fifteen in batch 16.**
2. **File before importing.** Batch 18 had to write two umbrellas in the same
   hour as thirteen edges to keep main from rising, which is the wrong order.
   Africa's decolonisation still waits on a year, Europe after 1989 still has
   no umbrella and its seventeen records are still main, and Asia's seventy-odd
   main events now have one umbrella covering five of them. **A fire that
   spends its whole hour on filing would be a fire well spent**, and A6 puts it
   ahead of volume.
3. **The environmental corner is now three records and still not joined**:
   `earth-summit` and `aarhus-convention` as a pair, the ozone pair beside it,
   and no article naming one from the other. §7.4 stands, with the first half
   of its answer delivered — the *event* it asked for exists now.

## Batch 19 — the tombstone pass, and where the filing can come from without a new period

*21 September, the same fire as batch 18, after it was pushed.*

| | |
| --- | --- |
| imported | 0 |
| tombstones back | 3 |
| tombstones refused again | 2 |
| edges written | 2 |
| main events filed | 6 |
| corpus | 493 → **496** active |
| **main** | 266 → **263** |
| largest connected component | 441 → **442** |

**No fetch bought any of this.** The three records were on disk as tombstones,
the six filings were main events waiting for an umbrella the atlas already
held, and the only network calls were the three articles read to argue two
edges and the one call that read six items' `part of`.

**The finding worth carrying forward is the filing half.** The filing pass
wrote *"there is no such umbrella here yet and one is not invented: the pass
refuses to write a period no article names"*, and it was right about the
period and wrong about the filing. **Six of the seventeen European records it
named have a parent here already** — not a period, but an event this atlas
holds as a main record, named by the child's own `part of` on Wikidata. The
revolutions of 1989 take the Romanian revolution and the Soviet coup attempt;
the Yugoslav wars take the Croatian war, the Kosovo war and the Macedonian
insurgency; the dissolution of the Soviet Union takes the Belovezh accords.
**That is a filing rule a fire can run in ten minutes with one API call, and
it invents nothing**: ask each main event's item for `part of`, keep the
answers that are main events here, refuse the ones that would nest a second
deep, and file. It should be run over the whole corpus before the next period
is written.

**And what it cannot do is worth saying too.** `revolutions-of-1989` is
`part of` the **Cold War**, which M67 refused and A6 does not overrule;
`yugoslav-wars` is part of the breakup of Yugoslavia and
`dissolution-of-the-soviet-union` part of the revolutions of 1989, and acting
on either would nest three levels. The rule stops where A6's one-deep clause
does, and the seventeen are now eleven.

**Two tombstones were read and refused again**, with the reason each still
waits on: `libyan-civil-war-q16911838`, whose article never names the war of
2011, and `sharpeville-massacre` with `soweto-uprising` from batch 18. Eleven
live *"It waits on …"* clauses are left after this batch, and the scan that
finds them is twenty lines over `data/events/*.json`.

## Batch 20 — the `part of` pass, run over the whole corpus

*21 September, the third batch of the same fire, and the rule batch 19 found
turned into a pass.*

| | |
| --- | --- |
| main events asked | 218 of 263 (those carrying a Wikidata id) |
| API calls | 5 |
| answers naming a record here | 20 |
| filed | 5 |
| refused | 15 — one lane, eleven dates, three depths |
| corpus | 496 active, unchanged |
| **main** | 263 → **258** |
| largest connected component | 442, unchanged and necessarily so |

**This is the cheapest filing there is and it is nearly spent.** Twenty
answers out of 218 items, five of them usable: the corpus does not carry many
main events whose item names another main event here as its whole. The pass
should be **re-run after every import batch**, because each new record brings
its own `part of` and may also become the parent an older record was waiting
for — it costs five calls — but it will not be what gets Asia's seventy main
events down to the low tens per century. That still needs periods, and periods
still need articles.

**The refusals are the more interesting half and they are listed record by
record in `docs/m67-umbrellas.md` §7.** Eleven are the atlas's own dates
disagreeing with the source's containment, and eight of those are not
mistakes on either side: **a `part of` statement is a claim about subject, not
about time.** One is the lane, which is A6's own rule refusing an African war
a place under a European period. Three are depth.

**One defect was found and left visible rather than filed over**:
`the-troubles` is dated `1998–1998` in this atlas, for a conflict of thirty
years. Filing `good-friday-agreement` under it would have buried that. It is
not this batch's to fix — the record's interval came from an import and a
person should set it — and it is written here so the next fire can.

## Batch 21 — the parents the corpus names, imported as umbrellas

*21 September, the fire after batch 20. Batch 20 ran the `part of` pass and
kept only the answers this atlas already held; the twenty answers it threw
away are the other half of the same question, and **the useful ones are the
parents the corpus names and does not have**. Three of them are periods A6
allows, so this batch imported them and filed under them.*

| | |
| --- | --- |
| main events asked for `part of` | 213 of 258 (those carrying a Wikidata id) |
| API calls | 5 for the statements, 1 for the labels, 8 in the import |
| distinct parents named | 89 — 14 held here, **75 not** |
| imported as umbrellas | **3** |
| main events filed under them | **10** |
| refused | 6 filings and 19 candidate parents, each with its reason below |
| corpus | 496 → **499** active |
| **main** | 258 → **251** |
| largest connected component | 442, **unchanged** |
| components | 27 → 30 |

**The main count fell by seven, which is what A6 asks of every batch from
here**, and it fell without a period being invented: each of the three
umbrellas is an item the atlas's own records name as the thing they are part
of, and each was written by `tools/import/wikidata.mjs` from the item's own
fields — its title, its description, its span. Nothing in the three records
was composed here.

**The component did not move, and it cannot.** A filing writes `parent` and
`parent` is a display fact that takes no edge; the three new records are
umbrellas, and `tests/m42-filing.test.mjs` refuses an edge that runs to one.
So the component count rises by three — three records that are on no chain —
while the largest component stays at 442. That is A5 answered rather than
dodged: this batch bought readability, not reach, and the reach is what the
next sweep batch is for.

### The three umbrellas, each named by the records it takes

| id | item | span the item gives | lane | how many named it |
| --- | --- | --- | --- | --- |
| `afghan-conflict` | Q1519107 | 1978-04-27, no end | asia | 4 |
| `indochina-wars` | Q2342102 | 1946 – 1989 | asia | 2 |
| `arab-spring` | Q33761 | 2010-12-17 – 2012-12 | africa | 3 |

All three carry an English article, a span and a region, which is A6's whole
test, and each is a conflict or a wave rather than a form of government, so
M67's judgement 1 does not bite. `arab-spring` had been walked by an earlier
import and left no record; its item was **rewound** in
`data/imports/wikidata-state.json` so that this batch could walk it again,
which is the one state edit here and is noted as deviation 1024.

### What was filed, and why each

**Under `afghan-conflict`, five.** Four carry `part of` Q1519107 on their own
items — `soviet-afghan-war`, `afghan-civil-war-q1980081`,
`afghan-civil-war-q12302518`, `war-in-afghanistan-2001-2021` — so the filing
is the source's claim and not this run's. The fifth, `saur-revolution`, is
filed on A6's span-and-subject rule with the article behind it: the item dates
the conflict's start to 27 April 1978, which is the revolution's own date, and
the English article at revision 1370427137 says *"all-out fighting did not
erupt until after 1978, when the Saur Revolution violently overthrew"* the
government. The opening act of a conflict is inside it; the act that created
or destroyed a *form of government* is the case M67's judgement 1 keeps out,
and this is not one.

**Under `indochina-wars`, three.** `first-indochina-war` carries `part of`
Q2342102. `laotian-civil-war` and `sino-vietnamese-war` are filed on span and
subject: both are inside 1946–1989 and both are wars in former French
Indochina, which the article at revision 1373921212 defines as *"the current
states of Vietnam, Laos, and Cambodia"*.

**Under `arab-spring`, two.** `2011-egyptian-revolution` and
`libyan-civil-war` both carry `part of` Q33761, and both are in the umbrella's
own lane.

### What was refused, and why

**Two filings refused on depth**, which is A6's "do not nest periods more than
one deep" as batch 18 read it: `vietnam-war` (which already holds a child
here) under `indochina-wars`, and `gaza-war` under anything. A war is its own
umbrella and keeps its children.

**One filing refused on a date, and it is this batch's `the-troubles`.**
`cambodian-vietnamese-war` is dated `1989–1991` here, and its own summary
quotes the item's description: *"1978–1989 interstate war"*. The record's
interval and the record's summary contradict each other, which means the
import read a later pair of dates off the item than the one the description
names. It is the second instance of deviation 1022 and it is left visible for
the same reason: the interval came from an import and a person should set it.
Filing it under a series that ends in 1989 would have buried that.

**One filing refused on the lane**: `2011-yemeni-revolution` carries `part of`
Q33761 and is drawn in the asia lane, while `arab-spring` is drawn in africa —
the Arab Spring began in Tunisia and deposed three rulers in Africa, so africa
is the lane it belongs in. A6 gives the filing rule as the region, and
`tests/m42-filing.test.mjs` holds every child to its umbrella's lane. It is
the same refusal batch 20 made of an African war under a European period, and
it is the price of a rule that is one lane wide. **A period whose subject
crosses two lanes cannot take both halves**, and that is worth the owner's
attention rather than a workaround here (deviation 1023).

**Two filings refused on the subject**: `insurgency-in-khyber-pakhtunkhwa`
names Q185729 and not the Afghan conflict, and it is Pakistan's;
`2013-egyptian-coup-d-etat` is a year past the Arab Spring's end.

**Nineteen candidate parents refused**, every one of them named by a record
here:

- **Q8683 *Cold War*, which 17 main events name — by far the largest.**
  Refused, as M67 refused it and as the filing pass refused it again: A6
  legitimises a period **with a region**, and the Cold War's region is the
  world. Q185729 *War on Terrorism* (5) and Q17510383 *Second Cold War* (2)
  are the same refusal, and the second is a term rather than a period.
- **Q1146918 *decolonisation of Africa* (3), which Africa most wants.** Still
  refused. Its P580 is the decade 1950 and not a year, the English article's
  own lead gives no crisper start than the article title's, and deviation 989
  is that no date is invented and none is widened. What it waits on is a year
  from a person, and the seeds table already carries its class so that the
  attempt is cheap when that year exists.
- **Q7318933 *revolutions of 1917–1923* (3)** — an article and a span in its
  own title, but the item carries no P580 and no P582 at all, so the import
  can write nothing and a hand-written span would be read off a title. Its
  three candidates (`october-revolution`, `russian-civil-war`,
  `german-revolution-of-1918-1919`) are all umbrellas here already, so two of
  the three would have been refused on depth in any case.
- **Q1975306 *post-Soviet conflicts* (3)**, **Q40719 *Conflicts in the Horn of
  Africa* (2)** and **Q364610 *Congolese Civil War* (2)** — a category, a
  Wikimedia list article and a disambiguation page. None is an event or a
  period.
- **Q819264 *colour revolution* (3)** — a term of political science with no
  span and no region; **Q1147615 *international human rights law* (2)** and
  **Q491271 *history of Japan–Korea relations* (2)** — a body of law and a
  bilateral relationship, neither an event.
- **Q13581596 *Brazilian Republic* (2)** and **Q17748736 *Second Portuguese
  Republic* (2)** — periods that would each contain periods this atlas
  already holds (`brazilian-military-dictatorship-1964-1985` and
  `nova-republica-brazil-since-1985`; `ditadura-nacional-1926-1933` and
  `estado-novo-1933-1974`), which is nesting two deep.
- **Q4783165 *Arab Cold War* (2)**, **Q796498 *Third Indochina War* (2)** and
  **Q124373310 *Middle Eastern crisis (2023–present)* (2)** — each would sit
  between an umbrella here and its children, so each is a second period on the
  same ground.
- **Q118144130 *Franco–Moroccan conflicts* (2)**, **Q116301618
  *Spanish–Moroccan conflicts* (2)** and **Q133098437 (2)** — **no article at
  all**, which A6 refuses outright: "the run does not invent a period that has
  no article", and an item with no sitelink is the same hole seen from the
  other side.

### What the next fire does

**The `part of` pass is now worth running in both directions and it is still
cheap**: five calls for the statements and one for the labels of everything
they name. Batch 20 kept the answers already here; this batch imported three
of the ones that were not. **What is left of the 75 is thin** — the list above
is every parent that two or more main events name, and the rest are named
once each — so the next fire should spend its hour on a sweep batch and not on
this question again until a batch of imports has brought new statements with
it.

**Where the readability target stands.** Main by lane and century after this
batch, which is the measurement A6 asks for:

| century | europe | asia | africa | americas | no lane |
| --- | --- | --- | --- | --- | --- |
| **20th** | **61** | **42** | **29** | 18 | 23 |
| 21st | 7 | 13 | 8 | — | 3 |
| 19th | 4 | 7 | 1 | 4 | 11 |
| all | 72 | 62 | 38 | 22 | 57 |

Asia's twentieth century falls from 47 to 42 and nothing else moves. **Europe's
sixty-one is now the largest single crowd** and most of it is multilateral
instruments the filing pass refused under M67's judgement 2 — conventions,
treaties and protocols whose author is a body of states. They are the honest
remainder of A6's target and no period will take them; what would is a
different umbrella entirely, and nobody has asked for one.

## Batch 22 — the Arab Spring's own origin, which nothing here held

*21 September, the second batch of the same fire, and it is batch 17's rule
read off a new umbrella: **a record that names what it is missing is worth
more than a row that ranks well.** Batch 21 wrote `arab-spring` and filed two
events under it; the article it was written from says where the wave began,
and the corpus did not hold it.*

| | |
| --- | --- |
| imported | **1** — `tunisian-revolution` (Q46959) |
| classes added | 1 — Q3109572 *civil resistance* |
| edges written | **3** |
| filed | 1, under `arab-spring` |
| corpus | 499 → **500** active |
| **main** | 251, **unchanged** — the import arrived main and was filed in the same batch |
| largest connected component | 442 → **445** |
| components | 30 → **29** |

**This is the shape A5 and A6 ask for together**, and it is worth naming
because the two amendments usually pull against each other: an import that
files itself leaves the main count where it found it, and an import chosen
because a fragment needs it moves the component by more than itself. One
record joined three: `libyan-civil-war` and `mali-war` were a component of two
and are now on the main chain, and `tunisian-revolution` is on it with them.

**The three edges, each quoting the article it rests on.** The Arab Spring's
own lead, at revision 1373656404, is the spine of all three: *"It began in
Tunisia in response to the death of Mohamed Bouazizi by self-immolation. From
Tunisia, the protests initially spread to five other countries: Libya, Egypt,
Yemen, Syria and Bahrain."*

- `tunisian-revolution --inspired--> 2011-egyptian-revolution`. Egypt's own
  article gives the occasion as National Police Day and the grievance as
  police brutality and does not name Tunisia, so what the edge asserts is the
  spread the first article states.
- `tunisian-revolution --inspired--> libyan-civil-war`. The war's article says
  it was ignited by protests in Benghazi *"inspired by the Arab Spring"*.
- `tunisian-revolution --inspired--> 2011-yemeni-revolution`. Yemen's article
  is the most cautious of the three — it says the uprising *"occurred
  concurrently with the Arab Spring"* — and the edge is written at the
  strength that supports.

All three are `inspired` and `probable`. **None is `caused`**: not one of the
four articles says a Tunisian event brought about a foreign one, and rule 22
would refuse `consensus` to a citation list that is one encyclopedia twice
over.

**Two fragments were read and left alone, with what each waits on.** The Horn
of Africa's six (`ethiopian-civil-war`, `eritrean-war-of-independence`,
`eritrean-ethiopian-war`, `ogaden-war`, `somali-civil-war`, `tigray-war`) and
Sudan's five (`first-sudanese-civil-war`, `second-sudanese-civil-war`,
`war-in-darfur`, `2011-south-sudanese-independence-referendum`,
`south-sudanese-civil-war`) are the two largest fragments left, and the leads
of all three articles read for them — the Ethiopian civil war at revision
1375950588, the Ogaden war at 1373903527, the first Sudanese civil war at
1375454294 — **name no event this atlas holds outside their own fragment**.
The Tunisian move worked because the umbrella's article named the missing
record in its first sentence; neither of these does, and the hinge each wants
is a paragraph further into an article than a summary endpoint returns. That
is a fetch a later fire can spend, and it is not a judgement about history.

**Also read and refused a bridge**: `british-expedition-to-tibet` and
`treaty-of-lhasa` are a pair of two, and `british-russian-convention` is the
obvious third — but the convention's lead, at revision 1358051340, is about
the Great Game and Persia and never mentions Tibet. An edge written on that
lead would be this run's argument and not the source's.

## Where the run stands after batch 25, for the fire that picks it up

*22 September, 00:05, after a fire that landed five batches on `m42`.*

| | |
| --- | --- |
| corpus | **520 active**, from 496 at the start of the fire |
| **main** | **251**, from 258 — and unchanged across batches 22, 23, 24 and 25 |
| largest connected component | **462**, from 442 |
| components | 30, from 27 |
| imported this fire | 24 records (3 umbrellas, 1 origin, 20 filed children) |
| edges written | 23 |
| filings | 31 — 21 of the new records, and 10 main events that were already here |
| the sweep pool, world sections | 1,109 rows → **1,087** |

**The rule that worked, and it is the one to run first next time.** Batches 23
to 25: **take the pool row whose item names a parent this atlas already
holds.** It costs nine API calls over the 700 best rows of the world pool, it
returns 57 such rows, and a record imported that way **arrives filed**, so the
main count cannot rise — it did not move once in four batches. Fifteen of the
twenty landed with an edge to something that was already here; the two whose
parent was an umbrella landed as a fragment of their own, which is deviation
1031 and the rule's own limit.

**What is left of that vein**: roughly forty of the 57 rows are untaken, and
the scan has only been run over the first 700 rows of a pool of about 1,100.
The next fire should re-run `part of` over the rest before it ticks anything
by sitelinks, and it should re-run the whole scan after each batch, because a
record imported today is a parent tomorrow.

**What the fire did not do**, and what the next one should weigh:

- **Asia's twentieth century is 42 main events and Europe's is 61**, against
  A6's "low tens per century". Europe's are mostly multilateral instruments
  the filing pass refused under M67's judgement 2, and no period will take
  them.
- **The Horn of Africa (7) and Sudan (5) are still fragments**, and the leads
  of their articles name no record this atlas holds. What they want is a
  paragraph deeper into an article than the summary endpoint returns, which is
  a fetch and not a judgement.
- **Six records carry an interval shorter than their own summary**
  (deviation 1032). Each refuses a filing the source asserts, and repairing
  them is the clearest afternoon's work a person could do here.
- **`Q2587808` and `Q4499410`** — the Holocaust in Poland and in Ukraine —
  are refused for want of a date the item will give as a year, which is the
  same hole the decolonisation of Africa sits in.

## Batch 26 — the `part of` vein re-scanned over the whole pool

*22 September, the first batch of the fire that picked the run up at 02:06.
The previous fire's own note said what to do first: **re-run `part of` over
the rest of the pool before ticking anything by sitelinks.** This is that, and
the vein is half again as large as the 700-row scan made it look.*

| | |
| --- | --- |
| open world rows scanned | **1,088** — unticked, not already in the atlas, not in the import state's `done` list |
| rows whose `part of` names an active record here | **83** (57 over the best 700 rows before) |
| of those, filing cleanly on depth and the parent's dates | **57** |
| taken this batch | 11 |
| created | **11** |
| filed | **10** |
| edges written | **9** |
| classes added to the seeds table | 2 — `Q511866` mutiny, `Q217901` capitulation |
| lanes named for a placeless row | 2 — `Q118514`, `Q4126381` |
| corpus | 520 → **531** active |
| **main** | 251 → **252** |
| largest connected component | 462 → **470** |
| components | 30 → **33** |
| the sweep pool, world sections | 1,088 rows → **1,077** |
| API calls | 8 SPARQL for the scan, 1 for the dates, 2 for the corpus pass, 20 for the import, 6 article leads |

**The scan is the finding and it is worth stating on its own.** Over the best
700 rows the previous fire found 57 such rows; over all 1,088 there are 83.
The rows that rank *badly* by sitelinks are more likely to name a parent this
atlas holds, not less — a rising inside a war is written about in fewer
languages than the war and is filed under it by Wikidata all the same. **A
scan that stops at the best rows is measuring sitelinks and not the vein.**
Forty-six of the 57 clean rows are still untaken.

**What the eleven are, and what each earned.**

| the record | filed under | the edge it earned |
| --- | --- | --- |
| `revolution-in-the-kingdom-of-poland` | `russian-revolution-of-1905` | none |
| `moscow-uprising-of-1905` | `russian-revolution-of-1905` | `moscow-uprising-of-1905 --enabled--> october-revolution` |
| `odz-insurrection` | `russian-revolution-of-1905` | none |
| `potemkin-mutiny` | `russian-revolution-of-1905` | none |
| `revolt-of-czechoslovak-legion` | `russian-civil-war` | `treaty-of-brest-litovsk --precondition-of--> revolt-of-czechoslovak-legion` |
| `junker-mutiny` | `october-revolution` | `october-revolution --reacted-to--> junker-mutiny` |
| `second-guangzhou-uprising` | `xinhai-revolution` | `second-guangzhou-uprising --precondition-of--> xinhai-revolution` |
| `iraqi-civil-war-of-2006-2008` | `iraq-war` | `iraqi-insurgency --caused--> iraqi-civil-war-of-2006-2008` |
| `first-shaba-war` | `angolan-civil-war` | `angolan-civil-war --enabled--> first-shaba-war` |
| `argentine-surrender-in-the-falklands-war` | `falklands-war` | `falklands-war --caused--> argentine-surrender-in-the-falklands-war` |
| `2011-bahraini-uprising` | **not filed** | `tunisian-revolution --inspired-->` and `2011-egyptian-revolution --inspired-->` it |

**Nine of the ten filings are under an ordinary event and not a period**,
which is what deviation 1031 asked the later batches to prefer, and it is what
paid: eight of the nine edges run to a record that was already on the main
chain. The three that earned no edge are the 1905 Russian cluster —
`revolution-in-the-kingdom-of-poland`, `odz-insurrection`, `potemkin-mutiny` —
and they are three of the three new components. Their articles say only that
each was *part of* the revolution of 1905, which is the filing and not an
argument; the Potemkin item has no English article at all, at seven sitelinks.
**Nothing was written to keep them**, which is brief §1's bar, and the
components count says out loud what that costs.

**The main count rose by one and the reason is a rule.**
`2011-bahraini-uprising` could only go under `arab-spring`, which refuses it
twice: its own article, at revision 1374892677, dates the uprising *"from 2011
until 2014"* while this atlas's Arab Spring closes in 2012, and Bahrain is in
the **asia** lane while `arab-spring` is an **africa**-lane period. The second
refusal is deviation 1023 arriving a second time. The `part of` pass was
re-run over the corpus to find a filing that would hold the count — it offered
`2011-yemeni-revolution` under `arab-spring`, `tests/m42-filing.test.mjs`
refused it on exactly the same lane rule, and the filing was taken back rather
than argued with. The other six answers of that pass are refusals already on
the record: `lebanese-civil-war`, `vietnam-war` and
`dissolution-of-the-soviet-union` on depth, `good-friday-agreement` on the
`the-troubles` defect, `second-italo-ethiopian-war` on the lane and
`soviet-japanese-border-conflicts` on five days. **The next batch files before
it imports.**

**Two classes and two lanes were added to the seeds file, and one lane was
corrected by hand.** `Q511866` *mutiny* takes the `revolution` category, which
is the one case in `data/categories.json` that needs no argument — that
category's own description names a mutiny in its list. `Q217901`
*capitulation* follows `Q107706` *armistice* into `treaty`. The two lanes are
deviation 1029's one-line fix for a placeless row. The correction is
`junker-mutiny`, whose lane the import derived as **asia** from the item's
country point although the item's own description says Petrograd; the record
now says `europe` and its `regionNote` says who changed it and why. Nothing
else on any imported record was touched and no date was changed.

## Where the run stands after batch 26, for the fire that picks it up

*22 September, 03:00.*

| | |
| --- | --- |
| corpus | **531 active** |
| **main** | **252** |
| largest connected component | **470** |
| components | 33 |
| the sweep pool, world sections | **1,077** open rows |
| the `part of` vein | **46 of 57 clean rows untaken** |

**Run the scan first and file before importing.** The scan of this batch is in
`/tmp` and not in the repository, and it is nine lines: read the unticked
world rows out of `docs/wikidata-candidates.md`, ask the query service for
`wdt:P361` over them in chunks of 150, keep the rows whose answer is a
`wikidata` id on an active event here, then drop the ones whose parent is
itself filed or whose dates fall outside it. It cost eight calls over 1,088
rows. **A batch must file before it imports from here**, because this one
ended a main event up.

**What is still open, in the order a fire should weigh it:**

- **Forty-six clean rows of the vein**, which is four or five batches at this
  size, and every one of them arrives filed.
- **Seven imported intervals now read shorter than the record's own summary**
  (deviation 1037 adds `revolt-of-czechoslovak-legion` to deviation 1032's
  six). Each refuses a filing or an edge the source itself asserts, and
  repairing them is still the clearest afternoon's work a person could do
  here.
- **The Arab Spring's asian half** — `2011-bahraini-uprising`,
  `2011-yemeni-revolution` — cannot be filed at all while the wave is an
  africa-lane period. That is the owner's to decide and no batch can.
- **The Horn of Africa (7) and Sudan (5) are still fragments**, unchanged since
  batch 22, and what they want is a paragraph deeper into an article than the
  summary endpoint returns.

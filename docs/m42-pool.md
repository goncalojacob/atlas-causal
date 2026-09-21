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
what it is missing. **The next fire should run set 0 again**, not sets 3 and 4.

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

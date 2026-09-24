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

## Batch 27 — the same vein, all eleven filed, and the five that earned no edge

*22 September, the second batch of the same fire. Batch 26 ended a main event
up, so the brief's own instruction applied: **file before importing.** The
`part of` pass was re-run over the corpus first and returned no new filing —
its seven answers are refusals already on the record — so this batch holds the
count where batch 26 left it rather than lowering it, by taking only rows that
arrive filed.*

| | |
| --- | --- |
| taken | 11, all from the 57 clean rows of batch 26's scan |
| created | **11** |
| filed | **11** |
| edges written | **6** |
| lanes named for a placeless row | 1 — `Q2904516` |
| corpus | 531 → **542** active |
| **main** | **252, unchanged** |
| largest connected component | 470 → **476** |
| components | 33 → **38** |
| the sweep pool, world sections | 1,077 → **1,066** open rows |
| API calls | 20 for the import, 3 article leads |

**Six edges, and the five records that earned none are the finding.**

| the record | filed under | the edge it earned |
| --- | --- | --- |
| `south-lebanon-conflict` | `arab-israeli-conflict` | `1982-lebanon-war --caused-->` it |
| `operation-grapes-of-wrath` | `arab-israeli-conflict` | `south-lebanon-conflict --caused-->` it |
| `battle-of-musa-dagh` | `armenian-genocide` | `armenian-genocide --reacted-to-->` it |
| `urfa-resistance` | `armenian-genocide` | `armenian-genocide --reacted-to-->` it |
| `chilembwe-uprising` | `world-war-i` | `world-war-i --precondition-of-->` it |
| `insurgency-in-kosovo` | `yugoslav-wars` | `dayton-agreement --precondition-of-->` it |
| `war-over-water` | `arab-israeli-conflict` | none |
| `1963-south-vietnamese-coup` | `vietnam-war` | none |
| `kaocen-revolt` | `world-war-i` | none |
| `war-of-the-camps` | `lebanese-civil-war` | none |
| `darfur-genocide` | `war-in-darfur` | none, and it is the interesting one |

**Four of the five earned nothing because their articles say only that they
happened inside something else.** The War over Water is "a series of
confrontations between Israel and its Arab neighbors from November 1964 to May
1967 over control of water sources"; the Kaocen revolt is one sentence about a
Tuareg rising in northern Niger; the War of the Camps is "a subconflict within
the 1984–1990 phase of the Lebanese Civil War"; and the 1963 South Vietnamese
coup names the Buddhist crisis and the Viet Cong threat, neither of which this
atlas holds. **Containment is what `parent` carries and being somebody's child
is not an edge** — brief §1's bar, and five components were added rather than
five edges invented.

**`darfur-genocide` is refused by three days.** The war's own article, at
revision 1375318567, says the war "began in February 2003 when the Sudan
Liberation Movement (SLM) and the Justice and Equality Movement (JEM) rebel
groups began fighting against the government of Sudan… The government responded
to attacks by carrying out a campaign of ethnic cleansing against Darfur's
non-Arabs." That campaign is this record. But Wikidata dates the genocide
**23 February 2003** and the war **26 February 2003**, so the edge the source
states runs backwards over the dates the atlas holds and rule 4 refused it.
The same shape as the Czechoslovak Legion's in batch 26, and at three days
rather than two years: **an imported date is precise enough to refuse an
argument and not necessarily right enough to.**

**`insurgency-in-kosovo` lost the other half of its own article the same way.**
Its lead says "This insurgency would lead to the more intense Kosovo War in
February 1998", and Wikidata gives the insurgency a single day — 28 February
1998 — for something its own title dates from 1995, while the Kosovo war here
begins that February. The edge that survives is the one to `dayton-agreement`,
which the same lead states and which runs forward.

## Where the run stands after batch 27, for the fire that picks it up

*22 September, 04:00, after a fire that landed two batches on `m42`.*

| | |
| --- | --- |
| corpus | **542 active**, from 520 at the start of the fire |
| **main** | **252**, from 251 |
| largest connected component | **476**, from 462 |
| components | 38, from 30 |
| imported this fire | 22 records, **21 filed** |
| edges written | 15 |
| the sweep pool, world sections | **1,066** open rows |
| the `part of` vein | **35 of 57 clean rows untaken** |

**The scan first, then file, then import.** Re-running the `part of` scan over
the whole pool is eight SPARQL calls and it is what found 83 rows where the
700-row scan found 57; it should be re-run after each batch, because a record
imported today is a parent tomorrow. Then the corpus pass (two calls), then the
import.

**What is still open, in the order a fire should weigh it:**

- **Thirty-five clean rows of the vein**, three or four batches at this size,
  and every one of them arrives filed.
- **The dates are now the binding constraint, not the pool.** Eight imported
  intervals read shorter than their own record's summary and **two edges this
  fire could not be written at all** because of it — the Czechoslovak Legion's
  and Darfur's. A person's afternoon spent on `when` would buy more of A5 than
  another batch would.
- **The Arab Spring's asian half** — `2011-bahraini-uprising`,
  `2011-yemeni-revolution` — cannot be filed while the wave is an africa-lane
  period. That is the owner's to decide.
- **The Horn of Africa (7) and Sudan (5) are still fragments**, unchanged since
  batch 22.

## Batch 28 — thirteen more, all filed, and the components that grew faster than the chain

*22 September, the third batch of the same fire. The same vein and the same
rule; the measurement matters because it is where the vein's marginal value on
A5 starts to fall.*

| | |
| --- | --- |
| taken | 13 |
| created | **13** |
| filed | **13** |
| edges written | **4**, and a fifth written and deleted |
| lanes named for a placeless row | 3 — `Q937265`, `Q4411939`, `Q2745406` |
| corpus | 542 → **555** active |
| **main** | **252, unchanged** |
| largest connected component | 476 → **480** |
| components | 38 → **47** |
| the sweep pool, world sections | 1,066 → **1,053** open rows |

**The four edges**: `2020-malian-coup-d-etat --precondition-of-->
2021-malian-coup-d-etat` (the second coup was made by the man the first put in
place); `russian-revolution-of-1905 --caused--> sveaborg-rebellion` (the
mutiny's own article calls it "part of the aftermath" of the revolution, which
is the only one of this run's six 1905 records to earn more than a filing);
`french-conquest-of-morocco --caused--> zaian-war` (Lyautey's push eastwards is
what the Zaians were opposing); `angolan-civil-war --enabled--> shaba-ii` (the
same sentence shape as batch 27's edge to Shaba I, and the same border
crossed).

**Nine records earned no edge, and the components count is what that costs.**
Thirty-eight to forty-seven, against four on the largest. A colonial punitive
expedition, a provincial mutiny and a massacre inside a revolution are written
about as things that happened inside something else, and **containment is what
`parent` carries**. Two of the nine are worth naming:

- **`the-holocaust-in-romania` earned none on purpose.** Its article says the
  Romanian killings were "historically part of The Holocaust" and at the same
  time "mostly independent from the similar acts committed by Nazi Germany".
  An edge from `the-holocaust` would contradict the source the record rests on.
- **The Zanzibar edge was written and deleted, and for a new reason.** The
  massacre's article says the violence happened "during and following the
  Zanzibar Revolution"; the record is dated `1964-01` and the revolution
  `1964-01-12`, and **a month-only date reads as the first of that month**, so
  rule 4 puts the consequence eleven days before its cause. Deviations 1037 and
  1039 were about intervals that are too short; this one is about a date that
  is too coarse, and it is the same lesson in a third form.

**One cache defect found.** `tools/import/cache/wikipedia/Q2139988.en.json` is
the Eritrean *War of Independence* article, not the Eritrean *Civil Wars* one:
the summary endpoint follows a redirect and the cache records what came back
under the item's id. Nothing was cited from it. The record carries its own
`wikipedia.en` title and is correct; **the cache is not a safe source of a
record's own article without checking the title that came back.**

## Where the run stands after batch 28, for the fire that picks it up

*22 September, 05:00, after a fire that landed three batches on `m42`.*

| | |
| --- | --- |
| corpus | **555 active**, from 520 at the start of the fire |
| **main** | **252**, from 251 |
| largest connected component | **480**, from 462 |
| components | **47**, from 30 |
| imported this fire | 35 records, **34 filed** |
| edges written | 19 |
| the sweep pool, world sections | **1,053** open rows |
| the `part of` vein | **22 of the clean rows untaken** |

**Read this before taking another batch of the vein.** Across the three
batches the largest component gained 18 and the component *count* gained 17:
the rule buys A6 every time and A5 about half the time, and the half it does
not buy is growing. **The next fire should weigh batch 22's rule against this
one** — read an umbrella's own article for the record it names and the atlas
does not hold — because that is the rule that moved the largest component by
three for one import.

**What is still open, in the order a fire should weigh it:**

- **A connection-first batch**, on batch 22's rule, before more of the vein.
- **The dates.** Three edges this fire could not be written at all, on two
  intervals that read short and one date that reads coarse, and nine imported
  intervals now disagree with their own summaries. A person's afternoon on
  `when` would buy more of A5 than another batch would.
- **Twenty-two clean rows of the vein**, still arriving filed.
- **The Arab Spring's asian half** — `2011-bahraini-uprising`,
  `2011-yemeni-revolution` — cannot be filed while the wave is an africa-lane
  period. The owner's to decide.
- **The Horn of Africa and Sudan fragments**, unchanged since batch 22.

## Batch 29 — the full article instead of the lead, and the fragments it unlocked

*22 September, a connection-first batch, the first of this fire. Batch 22's
rule — read an umbrella's own article for the record it names and the atlas
does not hold — with one change to how the article is read.*

| | |
| --- | --- |
| imported | **0** |
| edges written | **4** |
| filed | — |
| corpus | 555 → **555** active |
| **main** | **252, unchanged** — nothing was imported, so nothing could arrive main |
| largest connected component | 480 → **493** |
| components | 47 → **43** |
| events with no edge at all | 28 → **27** |
| unreachable from a Portuguese event | 66 → **53** |
| the sweep pool, world sections | 1,053 open rows, untouched |

**Thirteen events joined the main chain for four edges**, which is the best
ratio of the run, and the reason is a method rather than a judgement.

**What changed: the endpoint.** Every fire since batch 22 has recorded that
the Horn of Africa's and Sudan's articles "name no event this atlas holds",
and every one of those readings was of a *lead*. `tools/import/wikidata.mjs`
fetches the REST summary endpoint, which returns the first section only, and
the cache under `tools/import/cache/wikipedia/` holds nothing else. The
MediaWiki action API returns the whole article —
`action=query&prop=extracts&explaintext&redirects=1` — and the whole article
of a war is mostly a Background section whose job is to name what came before
it. Thirty-two fragment articles were fetched whole and matched against every
active title in `data/`; five argued for a record already here and four of
those survived the reading.

**The four are argued edge by edge in `docs/m42-connections.md` → "2ab".** In
short: `world-war-ii --precondition-of--> eritrean-war-of-independence` joins
the Horn's seven; `berlin-conference --enabled--> scramble-for-africa` joins a
singleton that was carrying twelve children; the NPT joins the three nuclear
treaties to `budapest-memorandum`; `spanish-civil-war --inspired-->
la-violencia` joins the Colombian pair.

**Nine refusals, and one of them is a new kind.** An instrument a crime was
judged under (the Rome Statute, the Genocide Convention), a comparison of
magnitude (the Yom Kippur airlift), a diplomatic alignment (Sudan in the Gulf
War), a See also list, and — the new one — **a namesake**: the hit that put
`october-revolution` in the First Sudanese Civil War's article is Sudan's own
October Revolution of 1964. A title match is not an identity, and a method
that matches titles has to be read by somebody.

**What this says about the next fire.** The Sudan fragment of five is still a
fragment: its two largest articles were read whole and neither names an
outside record causally. It is not waiting on a deeper fetch any more — that
has now been spent — it is waiting on a record this atlas does not hold, and
the honest next move there is an import chosen for it rather than another
read.

## Where the run stands after batch 29, for the fire that picks it up

*22 September, 06:00.*

| | |
| --- | --- |
| corpus | **555 active** |
| **main** | **252** |
| largest connected component | **493** |
| components | **43** |
| the sweep pool, world sections | **1,053** open rows |
| the `part of` vein | **22 of the clean rows untaken** |

**What is still open, in the order a fire should weigh it:**

- **More of the full-article method.** Thirty-two fragment articles were read
  this batch and there are more; each fetch is one call and the reading is
  cheap. It is the only rule so far that has bought A5 without touching A6 at
  all.
- **Sudan's five**, which now want an import and not a read.
- **The dates.** Unchanged from batch 28: three edges could not be written at
  all on two intervals that read short and one that reads coarse, and
  `eritrean-ethiopian-war` carries `date` 2000-06-18 with `endDate`
  2000-05-25, which is its end before its beginning. A person's afternoon.
- **Twenty-two clean rows of the `part of` vein**, still arriving filed.
- **The Arab Spring's asian half** and **the Horn's dates**, unchanged.

## Batch 30 — the same method, the yield falling, and what the components count is actually counting

*22 September, the second batch of the same fire. Twenty-two more fragment
articles read whole, three edges, nothing imported.*

| | |
| --- | --- |
| imported | **0** |
| edges written | **3** |
| corpus | 555 → **555** active |
| **main** | **252, unchanged** — the fifth batch running |
| largest connected component | 493 → **495** |
| components | 43 → **40** |
| events with no edge at all | 27 → **24** |
| articles read for it | 22 |
| refused | 11 |

**The three are argued in `docs/m42-connections.md` → "2ac":**
`1948-arab-israeli-war --precondition-of--> war-over-water`,
`1982-lebanon-war --precondition-of--> war-of-the-camps`, and
`first-sudanese-civil-war --precondition-of--> darfur-genocide`, which takes
the last Sudanese singleton off the no-edge list.

**The yield is falling and that is the batch's first finding.** Batch 29 read
32 articles and wrote 4; batch 30 read 22 and wrote 3, and the eleven
refusals are increasingly of one kind — the article names a record this atlas
holds and that record is the umbrella's own child, or the mechanism it gives
attaches to a record already on the main chain. The full-article method has
now been run over every fragment of two or more and over most of the
singletons. **It is close to spent, and what it leaves behind is not random.**

### What is left, counted honestly: seven of the 24 singletons are umbrellas

| umbrella | children | why it is a component of one |
| --- | --- | --- |
| `third-portuguese-republic-since-1974` | 72 | a period; nothing causes a period |
| `interwar-period` | 30 | defined by the two wars it runs between |
| `arab-israeli-conflict` | 10 | its origin is three steps back and reached through its own children |
| `nova-republica-brazil-since-1985` | 8 | a period |
| `afghan-conflict` | 6 | every record its lead names is its own child |
| `arab-spring` | 3 | the wave's origin is `tunisian-revolution`, which is its child |
| `indochina-wars` | 3 | the mechanism attaches to `first-indochina-war`, its child |

**132 events hang under seven records that the component count reads as seven
stranded ones.** `parent` is a display fact and never an argument
(`CLAUDE.md`), and `tools/m42-pool.mjs` is right not to borrow connectedness
from the filing — but it follows that **A6's umbrellas arrive as components of
one and mostly stay there**, and that the rise in the component count across
batches 26 to 28 was partly the filing working rather than the corpus
fragmenting. The number to watch for "chains throughout the globe and time" is
the **largest component**, which is 495 of 555 and has risen by 15 this fire;
the component *count* is a mixed measure and should be read with this table
beside it.

**The seventeen singletons that are not umbrellas** are a different problem
and a smaller one: five 1905 records whose articles argue nothing (batches 27
and 28), four colonial punitive expeditions likewise, two Portuguese
presidential elections, the Zanzibar massacre a coarse date refuses (deviation
1042), `the-holocaust-in-romania` whose own article forbids the edge
(deviation 1044), and `iberian-blackout-2025`, `1963-south-vietnamese-coup`
and `eritrean-civil-wars`.

## Where the run stands after batch 30, for the fire that picks it up

*22 September, 07:00.*

| | |
| --- | --- |
| corpus | **555 active** |
| **main** | **252** |
| largest connected component | **495** |
| components | **40**, of which 7 are umbrellas by construction |
| events with no edge at all | **24** |
| the sweep pool, world sections | **1,053** open rows |
| the `part of` vein | **22 of the clean rows untaken** |

**What is still open, in the order a fire should weigh it:**

- **Volume again.** Two batches of this fire wrote no record. The brief's own
  "Done when" asks for an order of magnitude more active events than 250 and
  the corpus is 555; the `part of` vein still has 22 clean rows that arrive
  filed and therefore cost A6 nothing.
- **Sudan's five**, which want an import chosen for them and not another read
  (deviation 1049). Both of its largest articles have now been read whole.
- **The dates**, unchanged since batch 28 and still the clearest afternoon's
  work a person could do here.
- **The Arab Spring's asian half**, unchanged, and the owner's to decide.

## Batch 31 — the `part of` vein re-scanned whole, and the six of fifty-two that file cleanly

*22 September, the third batch of the same fire and the first that imported
anything. Two connection-only batches had left the corpus where they found it,
so this one went back to volume — and the scan says the vein is not where the
last three fires thought it was.*

| | |
| --- | --- |
| open world rows scanned | **1,052** — unticked, not already held, not in the import state's `done` |
| rows whose `P361` names an active event here | **52** |
| of those, filing cleanly on depth, span and lane | **6** |
| taken | 6 |
| created | **6** |
| filed | **6** |
| edges written | **4** |
| classes added | 0 |
| lanes named for a placeless row | 4 — `Q7784981`, `Q4578716`, `Q5783195`, `Q5858325` |
| corpus | 555 → **561** active |
| **main** | **252, unchanged** — the sixth batch running |
| largest connected component | 495 → **498** |
| components | 40 → **43** |
| the sweep pool, world sections | 1,052 → **1,046** open rows |
| API calls | 22 for the scan, 12 for the import, 5 article reads |

**The six, and what each earned.**

| the record | filed under | the edge it earned |
| --- | --- | --- |
| `1979-herat-uprising` | `afghan-conflict` | `saur-revolution --reacted-to-->` it, and it `--precondition-of--> soviet-afghan-war` |
| `mountain-war` | `lebanese-civil-war` | `1982-lebanon-war --enabled-->` it |
| `colombian-peace-process` | `colombian-conflict` | `colombian-conflict --reacted-to-->` it |
| `bala-hissar-uprising` | `afghan-conflict` | none |
| `effacer-le-tableau` | `second-congo-war` | none |
| `assassination-of-miguel-uribe-turbay` | `colombian-conflict` | none |

`afghan-conflict` and `colombian-conflict` were both singleton umbrellas at the
start of this batch, and both now carry an edge — which is the answer to the
table in batch 30: **an umbrella joins the chain through a record imported
under it, not through an edge written to it.**

### Why forty-six of the fifty-two were refused, which is the batch's finding

The previous fires reported "roughly forty clean rows untaken" of a vein of
57. **Re-scanned over the whole pool the vein is 52 rows and only six of them
file cleanly**, because the filing rule bites in four different ways and the
easy rows are gone:

- **Depth (10 rows).** `Q965477` Grossaktion Warsaw under `operation-reinhard`,
  `Q999143` the 1949 Armistice Agreements under `1948-arab-israeli-war`,
  `Q1752743` the Taliban insurgency and `Q3152953` the 2001 Herat uprising
  under `war-in-afghanistan-2001-2021`, `Q113115005` Balkhab under
  `republican-insurgency-in-afghanistan`, `Q4919446` the 1970 Cambodian coup
  under `cambodian-civil-war`, `Q123775571` under `war-in-bosnia-and-herzegovina`,
  `Q266909` the Ruhr Uprising under `kapp-putsch`, `Q3686584` the Conference of
  London under `paris-peace-conference`, and three of the Gaza rows under
  `gaza-genocide`. **Their parent already has a parent**, and A6 nests one
  deep.
- **Span (13 rows), and it is the interesting one.** Wikidata says a thing is
  part of a war; this atlas dates that war more narrowly and the child falls
  outside it. `chinese-civil-war` here is **1946–1950**, so the four risings of
  1927 that Wikidata files under the Chinese Civil War — `Q32993` the Chinese
  Communist Revolution, `Q476634` Nanchang, `Q992318` Autumn Harvest,
  `Q1038900` Guangzhou — cannot go under it, and neither can `Q124809504`,
  which starts 1946-01-01 against a parent that starts 1946-03-31.
  `turkish-war-of-independence` here is **1922–1923**, so the Franco-Turkish
  and Turkish–Armenian wars of 1918–1920 fall out.
  `Q696482` *Great Depression in the United States* begins **five days before**
  `great-depression`, which this atlas dates from 29 October 1929 and that item
  from the 24th. `Q1070890` the Georgian civil war of 1991–1993 is refused by
  `dissolution-of-the-soviet-union`'s single day. `Q107177113` the Somaliland
  War of Independence (1981) is a decade before `somali-civil-war` (1991).
  `Q5935403` the Hukbalahap Rebellion runs 1942–1954 against a `world-war-ii`
  that ends in 1945. **The span rule is doing real work and it is the reason
  the vein's yield collapsed**: the atlas's own dating is narrower than
  Wikidata's `part of` almost everywhere.
- **Lane (1 row).** `Q2992403` the Franco-Syrian War under `interwar-period`,
  which is a europe-lane period; Syria is asia. Deviation 1023 for the fourth
  time.
- **A record that would sit between a record here and its own children (5
  rows).** `Q1780216`, `Q2002270` and `Q2609193` — the Angolan, Mozambican and
  Guinea-Bissau wars of independence — would go under
  `portuguese-colonial-war-1961-1974`, **whose children are already
  `angola-war-begins-1961`, `guinea-war-begins-1963` and
  `mozambique-war-begins-1964`**: the theatre war would contain its own
  siblings. `Q796498` the Third Indochina War is batch 21's refusal exactly
  (it would sit between `indochina-wars` and `sino-vietnamese-war`), and
  `Q18920712` *War in Afghanistan (2015–2021)* is a slice of
  `war-in-afghanistan-2001-2021`.
- **A duplicate the vein pointed at itself (1 row).** `Q4818171` *Persian
  Constitutional Revolution* files under `constitutionalization-attempts-in-iran`
  — and that record is `Q1368440`, whose **Portuguese label is "Revolução
  Constitucional Persa"**, the same event under a second item. The `part of`
  vein can name a record's own parent as the record itself, and the check that
  catches it is reading the labels in both languages.
- **The Gaza cluster (6 rows), left for a person.** `Q133309815`,
  `Q122982851`, `Q123049614`, `Q135918673`, `Q126180008` and `Q126113055` file
  under `gaza-war` or `gaza-genocide`. Five of the six carry `genocide` as
  their Wikidata type for events still under way, and `CLAUDE.md` is explicit
  that presenting a disputed characterisation as settled is the worst mistake
  this project can make. The import would mark them draft and quote the item,
  which is exactly what the machinery is for — but the batch would be six
  contested contemporary records arriving at once, and **that is an owner's
  call and not a run's.** They are listed here rather than ticked.

## Where the run stands after batch 31, for the fire that picks it up

*22 September, 08:00, after a fire that landed three batches on `m42`.*

| | |
| --- | --- |
| corpus | **561 active**, from 555 at the start of the fire |
| **main** | **252**, unchanged across all three batches |
| largest connected component | **498**, from 480 |
| components | **43**, from 47 |
| imported this fire | 6 records, **6 filed** |
| edges written | **11** |
| events with no edge at all | **27**, from 28 |
| the sweep pool, world sections | **1,046** open rows |
| the `part of` vein | **spent**: 52 rows, 6 taken, 46 refused with reasons above |

**What is still open, in the order a fire should weigh it:**

- **The vein is spent and the next volume has to come from somewhere else.**
  The 1,046 open rows are still there and they are ranked by sitelinks; a row
  taken that way arrives **main**, which A6 forbids without a filing. **The
  next fire's first question is where a filed import can come from now** — the
  honest candidates are a row whose `P361` names a record whose dates this
  atlas could widen from its own source, and a new umbrella for a region that
  has none.
- **The dates, and now with a price attached.** Thirteen of the forty-six
  refusals are span refusals, and several are a matter of days: the Great
  Depression by five, the second Chinese civil war by three months. **A
  person's afternoon on `when` would reopen the vein**, which is the first
  time this run can say what the date work is worth.
- **The Gaza cluster**, six rows, for the owner.
- **Sudan's five**, which want an import chosen for them (deviation 1049).
- **The Arab Spring's asian half**, unchanged.

## Batch 31a — the edge to an umbrella, deleted, and the test that caught it

*22 September, at the end of the same fire, running the suites before going
idle. Three pure tests were red and all three were this fire's doing.*

**`berlin-conference --enabled--> scramble-for-africa` is deleted.** The
filing pass wrote `tests/m42-filing.test.mjs` → *"an umbrella is not a claim:
this pass wrote no edge on to one"*, which refuses an edge at **either** end
of any record carrying the `m42-umbrella` flag, and `scramble-for-africa`
carries it. The edge was argued from the period's own article and the
argument is sound; **the rule it breaks is the run's own and older**, and A6's
umbrellas are filing and not history. So the edge goes and the reasoning stays
here: a period is a display fact, and what would have to change for the
Berlin Conference to be linked to the scramble is the *record*, not the edge —
somebody would have to decide the scramble is an event and not a period.

The correction moves the numbers of batch 29 and of this fire:

| | as batch 29 reported | corrected |
| --- | --- | --- |
| edges written, batch 29 | 4 | **3** |
| largest component after batch 29 | 493 | **492** |
| largest component now | 498 | **497** |
| components now | 43 | **44** |
| events with no edge at all | 27 | **28** |
| edges written this fire | 11 | **10** |

`scramble-for-africa` is a singleton again, and by deviation 1056 the way to
un-strand it is to import a record under it, which batch 28 already did four
times.

**The other two reds were measurements, not records.** `docs/m53-polities.md`
§4.1 is retaken at **308 of 561**, and `docs/m67-umbrellas.md` gains section 12
— A1's clause for batch 31's six bare records, which name neither an actor nor
a place because their items give neither. **All 1,638 pure tests pass.**

## The decolonisation of Africa, read for its dates and still refused

*22 September, at the end of the same fire. The filing pass left this as the
one umbrella "Africa most wants" and said what it waits on: **"a year from the
article or from a person, not a fetch."** The fetch was spent anyway, because
the article is the cheaper of the two to ask.*

**The article does not give the year.** "Decolonisation of Africa", revision
1372152864, first sentence: *"The decolonisation of Africa was a series of
political developments in Africa **between the mid-1950s to 1976**, during the
Cold War."* Nowhere else does it date the period as a whole; what it dates are
the events inside it — Ghana's independence on 6 March 1957, the Algerian War
from 1954, the Cameroonian insurrection from 1955 — and no two of those agree
on where the period starts. Wikidata's `Q1146918` gives `P580` at decade
precision, which is where deviation 989 already refused it.

**So the end is datable and the start is not.** 1976 is the article's own
figure; "mid-1950s" is not a year and reading it as 1955 would be this
assistant supplying a date the source declines to give, which the standing
exception forbids outright. The umbrella stays unwritten.

**What it is worth, so that the decision is priced.** Thirty African main
events fall between 1950 and 1976 — the Algerian war, the two Sudanese wars,
the Portuguese colonial war, the Guinean ballots, the Zanzibar revolution, the
Congo crisis — and `scramble-for-africa` (1885–1914) already shows what an
African period does to the main count: it took twelve. **One word from the
owner — "read 'mid-1950s' as 1955", or any year they will stand behind — turns
this into the largest single filing left in the milestone.** It is a question
and not a fetch, and it is the shortest question in this document.

## Batch 32 — the `part of` vein asked the other way round

*22 September, the fire that began at 08:06. Batch 31 left the run one
question — **"where can a filed import come from now?"** — and the answer was
in the direction the scan had never been run in.*

**First, the cheap pass, re-run as batch 20 asked.** All 207 main events that
carry a Wikidata id, asked for their own `P361` in **one** SPARQL query
against `query.wikidata.org` rather than 218 items through the action API.
126 answers, **16 of them naming a record here**, and **none of the sixteen is
a new filing**: `vietnam-war`, `lebanese-civil-war` and
`dissolution-of-the-soviet-union` are batch 26's depth refusals,
`good-friday-agreement` is the one batch 20 left unfiled so that
`the-troubles`' 1998–1998 interval would stay visible, and the other twelve
refuse on lane or span. **The corpus pass is spent and this is the measurement
that says so.**

**Then the same vein, asked backwards.** Every scan until now has taken a row
of the sweep pool and asked *what is this part of?* Asked the other way —
**which items does Wikidata say are parts of the main events this atlas
already holds?** — it is not spent at all:

| | |
| --- | --- |
| main events with a Wikidata id, used as the query's subjects | **207** |
| `?child wdt:P361 ?parent` pairs returned, at 4 sitelinks or more | **2,078** over 2,063 distinct items |
| not already held, not in the import state's `done`, with an English article | **1,875** |
| filing cleanly on **depth** and **span** | **1,534** |
| and on the **lane** as well | **728** |
| of those, filing under `gaza-war` or `gaza-genocide` | 48, left for the owner |
| taken this batch | **12** |

**The rule, written before a row was taken.** The pool is the inverse vein
above. A row is taken only if it passes all three tests the run has used since
batch 20 — **depth**, which the query guarantees because its subjects are main
events; **span**, its own `P580`/`P585` and `P582` inside the parent's interval
*as this atlas dates it*; and **lane**, where the lane is the one
`createRegionDeriver` gives the item's own `P625` and it must equal the lane of
the record it files under. Of what survives, the **twelve with the most
sitelinks**, ties broken by the item id read as a number, less any row whose
label a record here already carries as a title or an alias, and less the Gaza
cluster, which **batch 31 deferred to the owner and this batch keeps deferred**.

| the record | sitelinks | filed under | the edge it earned |
| --- | --- | --- | --- |
| `battle-of-britain` | 77 | `world-war-ii` | none |
| `battle-of-kursk` | 74 | `world-war-ii` | none |
| `war-in-donbas` | 73 | `russo-ukrainian-war` | `2014-pro-russian-unrest-in-ukraine --enabled-->` it |
| `battle-of-verdun` | 71 | `world-war-i` | none |
| `my-lai-massacre` | 65 | `vietnam-war` | none |
| `battle-of-jutland` | 57 | `world-war-i` | none |
| `allied-invasion-of-sicily` | 54 | `world-war-ii` | none |
| `soviet-invasion-of-poland` | 54 | `world-war-ii` | `molotov-ribbentrop-pact --enabled-->` it |
| `battle-of-tsushima` | 53 | `russo-japanese-war` | it `--caused--> treaty-of-portsmouth` |
| `battle-of-tannenberg` | 51 | `world-war-i` | none |
| `battle-of-dunkirk` | 51 | `world-war-ii` | none |
| `marco-polo-bridge-incident` | 50 | `second-sino-japanese-war` | none |

| | |
| --- | --- |
| imported | 12 |
| created | **12**, **12 filed** |
| edges written | **3** |
| classes added | **3** — `Q830494` dogfight, `Q1261499` naval battle, `Q876274` naval warfare |
| lanes named for a placeless row | **0** — every one derived from its own point |
| corpus | 561 → **573** active |
| **main** | **252, unchanged** — the seventh batch running |
| largest connected component | 497 → **500** |
| components | 44 → **53** |
| events with no edge at all | 28 → **37** |
| the sweep pool, world sections | **1,046** open rows, untouched |
| API calls | 3 SPARQL queries, 28 for the import, 8 full-article reads |

**The three edges, each from an article that argues it.** The Soviet invasion
of Poland's own lead names the pact's secret protocol as what stood behind it;
Tsushima's article has the loss of the Baltic Fleet *"forced Russia to sue for
peace, and the Treaty of Portsmouth was signed in September 1905"*; the war in
Donbas's § Protests in the Donbas runs the demonstrations of 6 April into the
seizures of 12 April, which is where the record begins. **Nine earned none and
none was invented for them**, which is why the component count rises: a record
that arrives filed is connected to the picture and not to the graph, because
`parent` is a display fact and takes no edge.

**What the vein is worth, said plainly.** 728 rows pass all three tests today
and 48 of them are the Gaza cluster, so **680 are takeable at roughly twelve a
batch** — more than fifty batches of volume that arrives filed, with the main
count unable to rise from any of it. It is the largest single thing left in
this milestone and it did not need a new umbrella, a new date or an owner's
decision to open.

**What it does not do is connect.** Every one of the twelve is a singleton
until an edge is written for it, and three of twelve is the honest yield of a
lead and one full article each. **The next fire should weigh a smaller batch
with more reading against a larger one with less**: batch 28 took thirteen and
wrote five edges, batch 32 took twelve and wrote three, and the component count
has risen in both.

## Batch 33 — the same vein, eight rows, and the day the span is read to

*22 September, the second batch of the same fire. Batch 32 ended on a question
it put to the next fire — twelve rows with three edges, or fewer rows read
properly? — and this batch is the answer tried: **eight rows, and every one of
the eight had its full article read before the batch was committed.**

**The rule gains a day.** Batch 32 read the span at the year, which is how
every filing since batch 20 had read it. Asked at the day — where the child and
the parent both give a full date, the child's own day inside the parent's — the
same 668 open rows lose **34 more**, and the refusals are the interesting kind:

| the row | its own day | the parent | the parent's day |
| --- | --- | --- | --- |
| July Crisis | 1914-07-23 | `world-war-i` | 1914-07-28 |
| Battle of Nanking | 1937-01-01 | `second-sino-japanese-war` | 1937-07-07 |
| Cabinda Conflict | 1975-11-08 | `angolan-civil-war` | 1975-11-11 |
| Battle of Baghdad | 2003-01-01 | `iraq-war` | 2003-03-20 |
| The Barricades | 1991-01-01 | `dissolution-of-the-soviet-union` | 1991-12-26 |
| Mayaguez incident | 1975-05-15 | `vietnam-war` | 1975-04-30 |

**The July Crisis is the one that earns the change.** Wikidata files it under
the First World War; it begins five days before the war this atlas dates from
28 July 1914, and it is *what the war came out of* rather than a part of it —
which is batch 31's Great Depression refusal exactly, five days the other way
round. **Batch 32's twelve were re-checked against the tighter test after it
was written and all twelve hold.**

| the record | sitelinks | filed under | the edge it earned |
| --- | --- | --- | --- |
| `battles-of-khalkhin-gol` | 49 | `soviet-japanese-border-conflicts` | none |
| `prelude-to-the-russian-invasion-of-ukraine` | 49 | `russo-ukrainian-war` | none |
| `battle-of-caporetto` | 47 | `world-war-i` | none |
| `third-battle-of-ypres` | 47 | `world-war-i` | none |
| `tet-offensive` | 45 | `vietnam-war` | it `--precondition-of--> paris-peace-accords` |
| `sabra-and-shatila-massacre` | 44 | `lebanese-civil-war` | `1982-lebanon-war --enabled-->` it |
| `third-battle-of-kharkov` | 42 | `world-war-ii` | it `--caused--> battle-of-kursk` |
| `battle-of-greece` | 42 | `world-war-ii` | none |

| | |
| --- | --- |
| imported | 8 |
| created | **8**, **8 filed** |
| edges written | **3** |
| classes added | **1** — `Q5791104` international crisis, with **no category**; its sibling `Q19833559` *preparation* was refused, an activity being no kind of event |
| corpus | 573 → **581** active |
| **main** | **252, unchanged** — the eighth batch running |
| largest connected component | 500 → **502** |
| components | 53 → **58** |
| events with no edge at all | 37 → **41** |
| API calls | 9 for the import, 8 full-article reads |

**The answer to batch 32's question is: it is the same rate.** Twelve rows read
lightly gave three edges; eight rows read fully gave three. **What decides the
yield is not the reading but whether the atlas holds the other end** — Khalkhin
Gol's article argues, in its own voice, that the defeat turned Japan south
towards Pearl Harbor, and this atlas has no Pearl Harbor to point at; Caporetto
and Third Ypres name no held record but their own war. The edges this vein can
earn are limited by the corpus's own thinness around each new record, and the
way to thicken it is to take **several rows of one war in one batch** so that
they can be argued against each other, rather than the top of the ranking
spread over six wars.

## Where the run stands after batch 33, for the fire that picks it up

*22 September, 09:40, after a fire that landed two batches on `m42`.*

| | |
| --- | --- |
| corpus | **581 active** |
| **main** | **252**, unchanged for eight batches |
| largest connected component | **502** |
| components | **58** |
| events with no edge at all | **41** |
| the inverse `part of` vein | **626 rows open** after both batches, the Gaza deferral and the day-precision span |
| the sweep pool, world sections | **1,046** open rows |
| the corpus `part of` pass | **spent**, re-measured this fire |

**What is still open, in the order a fire should weigh it:**

- **The inverse vein, 626 rows.** Take the next batch **by war rather than by
  ranking**: batch 33's finding is that the reading is not what limits the
  edges, the corpus's thinness around each new record is, and several rows of
  one war can be argued against each other where the top of the ranking spread
  over six wars cannot.
- **The edges, which are the real work now.** Volume arrives filed and
  unconnected; A5 is about the largest component and it grew by three in each
  of the two batches, at twelve rows and at eight.
- **The dates, still a person's.** Thirteen of batch 31's forty-six refusals
  are span refusals, and `chinese-civil-war` (1946–1950 here, 1927 in the
  source), `turkish-war-of-independence` (1922–1923 here, from 1919 in the
  source) and `the-troubles` (**1998–1998** for a thirty-year conflict) each
  carry a `date` flag and a note saying a reviewer should widen them. **This
  fire did not touch them**, because two earlier fires assigned them to a
  person and a scheduled run overruling that without one is exactly what the
  standing exception forbids. The question for the owner is one sentence:
  *may a run widen an imported interval from the record's own cited article?*
- **The decolonisation of Africa**, still one word from the owner.
- **The Gaza cluster**, now 48 rows rather than six, and still theirs.
- **Sudan's five**, unchanged.

## Second parents (A8)

*22 September, the first fire after `M79 done` reached `origin/m0`. The owner:
**"Can't we have many umbrellas for the same event? For example, the angola
independence is both under the Portuguese third republic and african
decolonization."** M79 made `parent` a list; A8 makes a filing write every
umbrella that fits rather than the first, asks for the decolonisation of Africa
by name, and asks that the already-filed events be re-read once for a second
parent they were denied. This is that pass.*

| | before | after |
| --- | --- | --- |
| corpus | 581 active | **582 active** |
| **main** | 252 | **245** |
| filed | 329 | **337** |
| events with more than one parent | 0 | **22** |
| largest connected component | 502 | **502** |
| components | 58 | 59 |

**The main count fell by seven and no edge was written**, which is what an
umbrella is: eight main events became children, one umbrella arrived and is
itself main, and the component count rose by exactly that one record, because
a `parent` is a display fact and takes no edge (`tests/m42-filing.test.mjs`
asserts that no edge runs to one).

### 1. The decolonisation of Africa, written at last

`decolonisation-of-africa`, **Q1146918**, span **1954–1956 to 1976**, from
*"Decolonisation of Africa"*, **revision 1372152864**: *"a series of political
developments in Africa between the mid-1950s to 1976, during the Cold War."*

Two earlier fires refused this record and were right to, under the rule they
had: the article's end is a year and its start is not, and reading "mid-1950s"
as 1955 would have been the assistant supplying a date the source declines to
give. **What changed is not the reading but the shape.** A bound in
`schema/common/interval.json` is *"either an exact year or a `{min, max}`
range"*, and "mid-1950s" is a range — 1954 to 1956 — which the record can
state without choosing a year inside it. `span()` in `src/validate/rules.js`
reads a parent's start at `min`, so containment is tested against the early
end of the range, which is the generous reading a period deserves and is why
the Algerian War of November 1954 is inside it.

**Eight events are filed under it, all eight of them main before this pass:**

| | why |
| --- | --- |
| `algerian-war` | named in the article's own list of major events |
| `zanzibar-revolution` | named in the article's own list |
| `portuguese-colonial-war-1961-1974` | the wars of independence in Angola, Mozambique and Guinea; the article names the Angolan one |
| `independence-of-morocco` | the French protectorate ends, 1956 |
| `1957-guinean-territorial-assembly-election` | the *loi-cadre* machinery of French decolonisation |
| `guinean-constitutional-referendum-1958` | the vote by which Guinea left the Community |
| `angola-independence-1975` | **the owner's own example** |
| `1975-sao-tomean-legislative-election` | the same shape, three months earlier |

**The last two are the pass's point.** Each is now part of
`third-portuguese-republic-since-1974` *and* of `decolonisation-of-africa` —
the regime that withdrew and the continental period it withdrew into — and
neither reaches the other. Before this fire `angola-independence-1975` was
part of neither.

The Third Republic is in the Europe lane and Angola's independence is in the
Africa lane, so the suite's lane test refused this filing until it was
corrected. It was the test that was wrong: M62's rule reads *"its `actors` or
its place put it inside the regime"* and A6 says *"a region **or polity**"*,
and the lane-only reading held only while every child of a polity umbrella
happened to sit in that polity's own lane. The subject test now is the lane
**or** an actor the umbrella itself names, which is a property and still names
no record.

**Fourteen African events inside the span were refused.** Seven because the
period is not their subject: `suez-crisis`, `war-of-attrition` and
`yom-kippur-war` belong to the Arab–Israeli conflict and not to the end of
colonial rule; `first-sudanese-civil-war` is a civil war inside an already
independent Sudan; `ifni-war` is Morocco against Spain and the article does
not name it; `mueda-massacre` is arguable and already sits under the Estado
Novo; `eritrean-civil-wars` hangs from `eritrean-war-of-independence`, which
runs to 1991 and is outside the span. Seven more because they are inside the
period already through their own parent —
`massacre-of-arabs-during-the-zanzibar-revolution`, and
`angola-war-begins-1961`, `guinea-war-begins-1963`,
`mozambique-war-begins-1964`, `wiriyamu-massacre-1972`,
`cabral-assassinated-1973` and `guinea-bissau-declares-independence-1973`
under the colonial war. **A second parent earns its place by reaching
somewhere the first does not**, and the suite now refuses a parent that is
already an ancestor through another parent.

### 2. The re-read, and what it found

The 329 filed events were measured against all 57 umbrellas: span, then no
ancestor already covering it, then a subject. **Twenty gained a second
parent** — all twenty the same shape, a regime or a war already named and the
period it also sits in:

`1918-portuguese-presidential-election`, `1919-portuguese-presidential-election`,
`1921-portuguese-legislative-election`, `1923-portuguese-presidential-election`,
`1925-portuguese-legislative-election`, `1925-portuguese-presidential-election`
and `1928-portuguese-presidential-election` (the First Republic and the
Ditadura Nacional, and `interwar-period`); `monarchy-of-the-north-1919`,
`noite-sangrenta-1921` and `sidonio-pais-assassinated-1918`;
`salazar-finance-minister-1928`, `salazar-president-of-council-1932`,
`national-syndicalists-banned-1934`, `legiao-portuguesa-founded-1936`,
`portugal-backs-franco-1936` and `iberian-pact` (the Estado Novo, and the
period); `kronstadt-rebellion`, `tambov-rebellion`, `polish-soviet-war` and
`revolt-of-czechoslovak-legion` (the Russian Civil War, and the period).

**The mechanical measure offered 248 filed events with at least one candidate
and almost all of it was noise**, which is the finding worth carrying forward.
Two filters did the work.

**Sharing an actor is being a party, not being part** — M67's own rule, and it
killed all 38 candidates the actor test produced on its own. `arab-revolt`
and `armenian-genocide` both name the Ottoman Empire; `spanish-civil-war` and
`the-holocaust` both name Nazi Germany; `winter-war` follows from
`molotov-ribbentrop-pact` and is not inside it. Four of the 38 were refused by
M67's rule 1 instead — a period does not contain the act that created or
destroyed it — which is why `coup-28-may-1926` is not filed under the republic
it ended or the dictatorship it began, `constitution-1933` not under the
Estado Novo it founded, and `1985-brazilian-presidential-election` not under
the Nova República it opened.

**A year is not a date.** Five candidates sat inside `interwar-period` by year
and outside it by day, against the period's own `1918-11-11` and `1939-09-11`:
`armistice-of-mudros` (30 October 1918), `battle-of-the-lys-1918` (April
1918), `finnish-civil-war` (January to May 1918),
`german-soviet-treaty-of-friendship-cooperation-and-demarcation` (28 September
1939) and `soviet-invasion-of-poland` (17 September 1939). `span()` compares
years and would have let all five through with no warning; the dates the
records carry are what refused them.

Four more were refused on subject: `1991-portuguese-legislative-election` and
`belovezh-accords` are not part of `revolutions-of-1989`, and
`2012-malian-coup-d-etat` and `2012-tuareg-rebellion` matched `arab-spring`
only because that umbrella's lane is Africa — its subject is the Arab
uprisings and Mali is not one of them. **A lane is the subject test for a
period named after a region and for nothing else.**

### 3. Where that leaves the run

- **A8's pass is done.** The decolonisation umbrella exists, the re-read has
  run once, and 22 events now carry more than one parent.
- **A7's three intervals are next** and are still flagged:
  `chinese-civil-war`, `turkish-war-of-independence` and `the-troubles`.
- **Then the batches**, as §"Where the run stands after batch 33" orders
  them: the inverse `part of` vein, 626 rows, taken by war rather than by
  ranking.
- **The Gaza cluster and Sudan's five** are unchanged and still the owner's.

## A7 — the three intervals, one widened and two refused by an argument

*22 September, the same fire. The owner, asked in one sentence whether a run
may widen an imported interval from the record's own cited article, answered
**"I agree."** The three intervals two earlier fires assigned to a person were
read. **One was widened. Two were refused, and not by a judgement about
history — by rule 4.***

### `the-troubles`, widened

**1998–1998 → 1967–1969 to 1998.** The record carried the item's end date and
nothing else, which made a thirty-year conflict a point event. The article it
now cites — *"The Troubles"*, **revision 1376046499** — says *"about 30 years
from the late 1960s to 1998 ... usually deemed to have ended with the Good
Friday Agreement of 1998"*.

"The late 1960s" is not a year, and this is the second time in one fire that a
source has declined to give one. It is written the same way
`decolonisation-of-africa` is written: the range the phrase names, 1967–1969,
rather than a year nobody wrote down. The end is 1998 with no day, because the
article gives the period no day of its own. The record cited only Wikidata
before and now cites the article, quoted, at its revision; the note says what
moved from what. Nothing else on the record was touched, and the summary is
still the import's own.

Both edges on it still point the right way: `anglo-irish-treaty` (1921) is a
precondition of a conflict now beginning in 1967 rather than 1998, which is
the arrow it always should have had, and the Troubles still precede the Good
Friday Agreement they caused.

### `chinese-civil-war` and `turkish-war-of-independence`, refused

**Both articles state a span, and writing it breaks an edge.**

`chinese-civil-war` would go 1946–1950 → **1927–1949**, from *"Chinese Civil
War"*, revision 1375954779: *"Armed conflict continued intermittently from 1
August 1927 until Communist victory ... on 7 December 1949."* It was written,
and the validator refused it: **rule 4, arrow of time** —
`second-sino-japanese-war--chinese-civil-war--precondition-of`. The Japanese
war begins in 1937 and cannot be a precondition of a war that begins in 1927.

`turkish-war-of-independence` would go 1922–1923 → 1919, and collides the same
way with `treaty-of-sevres--turkish-war-of-independence--caused`: Sèvres is
signed in August 1920 and cannot cause a war that began the year before.

**This is not a date problem and A7 does not reach it.** Each record's own
note already asked the question underneath: *is this record the whole war, or
the phase the item dated?* The atlas has answered it once already, in an edge
— `precondition-of` and `caused` are arguments somebody wrote, and both of
them read these records as the later phase. Widening the span would not
correct a date; it would silently redefine what the record is about and
falsify an argument already in the graph. A7 authorises reading a span from a
cited article, not re-deciding a record's subject, so **both stay as they are
and stay flagged**, and their notes still say what a reviewer has to settle.

**The finding worth carrying forward**: rule 4 is a check on identity and not
only on chronology. Where an imported record's interval is narrower than its
article, the edges already attached to it are evidence about which reading the
atlas has committed to, and they should be read before the interval is
touched.

## Batch 34 — one war instead of a ranking, and what that answered

*22 September, the same fire, after A8's pass and A7's intervals. Batch 33's
own finding asked for this: **"take several rows of one war in one batch so
that they can be argued against each other, rather than the top of the ranking
spread over six wars."** This is that batch, and it answers the question it was
set.*

**The rule, unchanged but for its pool.** The same three tests since batch 20 —
depth, span at the day, lane — over the same inverse `part of` vein, with the
pool narrowed to **one parent**: `vietnam-war`, `Q8740`. The query returned
**104 rows**, of which **47 pass all three tests**. Taken: the **eight with the
most sitelinks**, ties by item id. Nothing was struck or added by hand, which
matters here because the temptation of a one-war batch is to pick the rows that
make a chain.

| the record | sitelinks | filed under | the edge it earned |
| --- | --- | --- | --- |
| `fall-of-saigon` | 40 | `vietnam-war` | `paris-peace-accords --enabled-->` it |
| `gulf-of-tonkin-incident` | 38 | `vietnam-war` | it `--precondition-of--> battle-of-ia-drang` |
| `battle-of-khe-sanh` | 35 | `vietnam-war` | none |
| `battle-of-ia-drang` | 29 | `vietnam-war` | the one above |
| `battle-of-hue` | 25 | **`tet-offensive`** | none |
| `battle-of-hamburger-hill` | 24 | `vietnam-war` | none |
| `battle-of-ap-bac` | 22 | `vietnam-war` | none |
| `battle-of-long-tan` | 16 | `vietnam-war` | none |

**`battle-of-hue` went to the nearer parent.** Wikidata files it under the war;
its own lead calls it *"a major battle in the Tết Offensive"*, and this atlas
holds `tet-offensive`, dated 30 January to 23 September 1968, which contains
the battle at the day. A vein that files by the queried subject would have put
it two levels too high.

**And the war the eight hang from was itself main.** `vietnam-war` is now part
of `indochina-wars`, which already held `first-indochina-war` and
`sino-vietnamese-war` and had no claim on the Second Indochina War only because
nobody had looked. That is where the batch's fall in the main count comes from:
eight records arrived filed and cost nothing, and one existing main event
became a child.

| | |
| --- | --- |
| imported | 8 |
| created | **8**, **8 filed** |
| edges written | **2** |
| classes added | **0** — all eight are `Q178561` battle or `Q1261499` naval battle, both already in the table |
| corpus | 582 → **590** active |
| **main** | 245 → **244** |
| largest connected component | 502 → **503** |
| components | 59 → **65** |
| events with no edge at all | 41 → **47** |
| API calls | 1 SPARQL, 18 for the import, 3 article reads |

### What taking one war answered

**It did not raise the edge yield, and the reason is worth writing down.** Two
edges from eight rows, against three from eight in batch 33 and three from
twelve in batch 32. The hypothesis was that rows of one war could be argued
against each other; what the reading found is that **the phases of one war are
chronological to each other and not causal**. Khe Sanh, Ia Drang, Hamburger
Hill, Ap Bac and Long Tan each describe a battle and none of their leads argues
that another of them followed from it. The two edges that were written both
run to or from a record the atlas already held — the Accords and, through the
incident, the escalation — and **not between two rows of the batch**.

So the corpus's thinness is not what limited batch 33 either. **What a lead
argues is what limits it**: `fall-of-saigon` earned an edge because the Paris
Peace Accords' lead says, in its own voice, what the agreement removed and what
it did not stop; `battle-of-long-tan`'s lead says who fought whom in a rubber
plantation, and no amount of neighbouring rows would change that.

**Six of the eight earned no edge and none was invented for them**, which is
the rule since batch 20 and the reason the "events with no edge at all" line
keeps rising. That line is the honest cost of the vein and not a defect: an
umbrella holds these records in the picture, and `degree-zero` says out loud
which of them nothing yet hangs on.

**For the fire that picks this up:** the vein is the same, and the suggestion
batch 33 made is now spent as a hypothesis. The next batch should go back to
**ranking across the whole vein**, which cost nothing to yield and spreads the
new records over more of the world; 618 rows remain open. The Gaza cluster and
Sudan's five are unchanged and still the owner's.

## Where the run stands after batch 34, for the fire that picks it up

*22 September, 12:10, after a fire that ran A8's pass, A7's intervals and one
batch.*

| | |
| --- | --- |
| corpus | **590 active** |
| **main** | **244** |
| filed | 346 |
| events with more than one parent | **22** |
| largest connected component | **503** |
| components | **65** |
| events with no edge at all | **47** |
| the inverse `part of` vein | **618 rows open** |
| the sweep pool, world sections | **1,046** open rows, untouched |
| the corpus `part of` pass | spent; A8's re-read is spent too |

**What is still open, in the order a fire should weigh it:**

- **The inverse vein, 618 rows, back to ranking across the whole vein.**
  Batch 34 tested batch 33's suggestion and it failed: one war's rows are
  chronological to each other, not causal, and the batch wrote two edges where
  the ranked batches wrote three. Ranking costs nothing to yield and spreads
  the records over more of the world.
- **The main count has room again.** It fell seven this fire and one more in
  the batch, to 244, and the two ways it moved are both repeatable: an
  umbrella a period historians name (A6), and **a queried subject that is
  itself unfiled** — `vietnam-war` was main until batch 34 looked. A fire
  taking a batch should check whether the parents its rows hang from are
  filed, because that is free.
- **A8 is available to every filing from here.** A filing writes every
  umbrella whose span and subject fit; a parent already reachable through
  another parent is not one of them.
- **A7 is spent on the three it was written for**, one widened and two
  refused by rule 4. Any future interval widened from an article should have
  the edges on the record read first.
- **The Gaza cluster (48 rows) and Sudan's five** are unchanged and still the
  owner's.

## Curation 2026-09-22

*The first curation fire, 13:07Z. A11(a): the first fire after 02:00Z each day
reads every active event and fixes, from the record's own cited sources or its
Wikidata item, what is missing — and imports nothing. This one also wrote the
polity descriptions the owner asked for, because no polity had one yet.*

| | before | after |
| --- | --- | --- |
| corpus | 590 active | **590 active** |
| **main** | 244 | **240** |
| filed | 346 | **350** |
| active edges | 640 | **642** |
| largest connected component | 503 | **503** |
| components | 65 | 65 |
| events with no edge at all | 47 | 47 |
| events with no place | 433 | **23** |
| polities with a description | 0 | **177** |

**Per lane (A10).** Active is unchanged, because nothing was imported: Europe
303, Asia 125, Americas 83, Africa 79. Main falls from 244 to 240 in three
lanes — Europe 86 to 83, Africa 32 to 31, Asia and the Americas unmoved at 67
and 59.

**A9 changed no lane, and that is worth writing down.** The places went onto
433 events that had none, but every one of them already carried a `region`
written by the Wikidata import from its own point, so the lane distribution
before and after this fire is the same four numbers. What the places changed is
the map, which is what the owner asked for: 410 events that were drawn in a
lane and nowhere else now have a mark.

### What was fixed, and what was left

| | fixed | left, and why |
| --- | --- | --- |
| **polity descriptions** | **177** of the 184 ongoing polities | 7: three give no capital to check a match against (`french-guiana`, `madagascar`, `sao-tome-and-principe`), two share a capital five kilometres apart and so cannot be told apart (`congo`, `congo-democratic-republic-of-zaire`, both reaching Q974), and two matched an item carrying a dissolution date while the record is dated as ongoing (`third-portuguese-republic` reached the First Republic, `vietnam-democratic-republic-of` reached North Vietnam) |
| **places (A9)** | **410** of 433 | 23, every one because neither P276, P131 nor P17 leads to anything carrying P625 |
| **summaries** | **277** | 52: 44 whose article lead is itself under two sentences, 5 with no Wikidata item, 3 whose item has no English article |
| **participants (P710)** | **44** events, 113 lines | 238: 155 whose item names no participant, 57 whose participants the atlas holds none of, 21 whose category determines no role, and 5 withdrawn again (below) |
| **parents (A6, A8)** | **13** events, 4 of them a first parent | 9 of the 22 the item's P361 offered were withdrawn by the atlas's own two rules (below) |
| **edges** | **2** | 16 of the 18 unedged causal pairs Wikidata names, because no lead states them in so many words |
| **intervals (A7)** | 0 | A7 is spent on the three it was written for; no other record's cited article states a wider span than the record carries |

### The polity descriptions, and how an item was decided

Two signals and no third, the discipline `tools/import/places.mjs` already
uses: the article Wikipedia resolves the record's own names to (the search is
only a way to find candidate titles, never a way to accept one), and the
capital that item gives agreeing within 1.5 degrees with the capital CShapes
already wrote on the record. Every capital the item names counts, not only the
one it prefers, because a record written from CShapes carries the capital of
its own day — which is how `equatorial-guinea` matched on Malabo rather than
failing on Ciudad de la Paz.

Two gates catch what a capital cannot, and both earned their place: an item
with a dissolution date cannot describe a polity dated as ongoing, and an item
that matched two records tells them apart not at all. Without them this fire
would have told a reader that the Third Portuguese Republic has the population
of 1911 and that the Republic of the Congo is governed from Kinshasa.

Each description is the item's own area (P2046) and latest population (P1082)
and the first sentences of the English lead quoted at a named revision, with
both cited on the record and `polity-description` in its review flags. The
import's own account of where the record came from is kept behind it.

### The five withdrawals and the nine, which are the fire's own corrections

Two passes wrote something a third rule refused, and the refusals are worth
more than the writes.

**Nine filings withdrawn.** `tests/m42-filing.test.mjs` and
`tests/m62.test.mjs` hold three properties the P361 pass did not read: a
parent already reachable through another parent says nothing (A8), an event is
an umbrella's own only when its lane is the umbrella's or it names an actor the
umbrella names (M62, A6), and `end: null` is "as far as the data goes" rather
than a year, so an open-ended child is not inside a parent that closes. Six
more redundant parents went with them, `battle-of-kursk` under the Second World
War once it was under the Eastern Front, which is inside it already.

**Five participant lists withdrawn.** P710 gives the parties an item names, and
the atlas holds records for some of them. Where the missing half is exactly the
party that carried an existing filing — the Franco-Thai War is filed under the
Second World War and the item names Vichy France, which the atlas has no record
for — filling in the other half breaks a correct filing with a misleading
half-list. An event with no actor is not a defect (M67 A1); a half-list read as
a whole one is. Where a list is partial but harmless the record's review note
says how many parties were dropped and tells the reviewer to read the item.

### What A9 broke, and the clause that had to move

`tests/m62.test.mjs` admitted a child that names neither actor nor place, under
M67's amendment A1 — *"It's fine to have no actor or place, you have to read the
context."* Giving 410 events a place closed that clause under **113 filings at
once**, among them the 20 July plot inside the Second World War and the 1963
South Vietnamese coup inside the Vietnam War, none of which became less their
umbrella's own for being put on the map. The clause now asks only whether the
child names an **actor**, because an actor is what the subject rule intersects
on and a point taken from P625 is evidence about neither umbrella. A child that
names an actor is still held to sharing one.

Two more documents moved because the corpus did, which is what they are for.
`docs/m53-polities.md` §4.1 carries a second "after M42" row and, for the first
time, a paragraph saying the two rules have parted: counted by "alive at the
start" the figure is 351 and counted by overlap it is 352, because
`croatian-war-of-independence` now names `croatia` and the war begins in 1991
while the CShapes record begins in 1992. The entry joins `LATER` in
`tests/m56.test.mjs`, which exists so that a new entry of that shape cannot go
quiet.

Two browser tests were pinned to `angola` having no events, and Angola is a
belligerent in both Congo wars. One now asks the atlas for an eventless actor
rather than naming one — M42 has no ceiling, so any pin breaks eventually — and
the other opens the succession section instead of assuming it is the section
that opens.

## Where the run stands after the first curation fire, for the fire that picks it up

*22 September, 13:07Z onward. A curation fire; nothing was imported.*

| | |
| --- | --- |
| corpus | **590 active** |
| **main** | **240** |
| filed | 350 |
| largest connected component | **503** |
| components | **65** |
| events with no edge at all | **47** |
| events with no place | **23**, all refused for want of a coordinate |
| the inverse `part of` vein | **618 rows open**, untouched |
| the sweep pool, world sections | **1,046** open rows, untouched |
| the corpus `part of` pass | spent; A8's re-read spent; P361 over the corpus now spent too |

**What is open, in the order a fire should weigh it:**

- **The next fire is an import fire** unless it is the first after 02:00Z
  tomorrow. A10's order stands and the lanes are where they were: Africa 79
  active and Asia 125 against Europe's 303, so **Africa first**, and this run's
  half of the partition is Africa and Asia only (A11(b)).
- **The 618-row inverse vein is still the pool**, and ranking across the whole
  vein still beats taking one war's rows (batch 34).
- **The component did not grow and 47 events still carry no edge.** Two edges
  were added and both joined events already inside the largest component. A
  fire that wants reach should take the isolated 47 by name — most of them are
  battles whose war the atlas holds and whose article's § Background states the
  link, which is where batches 29 and 33 found their yield.
- **177 polity descriptions are now in the review queue** under the flag
  `polity-description`, and the seven refusals above are a person's to settle
  or a later fire's, if a record gains a capital.
- **The Gaza cluster (48 rows) and Sudan's five** are unchanged and still the
  owner's.

## A12 (3) and (5) — the two passes that are code, and what the second one found

*22 September, 16:06Z onward. An import fire: today's curation fire ran at
13:07Z and its section is above. A12 is in force **before any further import**,
and its six passes were read against what that fire wrote. **Four are done and
written up there** — the summaries (277 fixed), the places (410), the P710
participants (44 events) and the polity descriptions (177) — and so is A7's
own pass over the three intervals it was written for. **Two were not, and both
are code**: `intervalFor()` and `titleFor()`. Neither changes a record by
itself; each changes what every later import writes, which is why A12 puts
them before the batches and why this fire imported nothing.*

| | before | after |
| --- | --- | --- |
| corpus | 622 active | **622 active** |
| **main** | 242 | **242** |
| filed | 380 | 380 |
| active edges | 647 | 647 |
| largest connected component | 506 | **506** |
| components | 92 | 92 |
| events with no edge at all | 72 | 72 |
| validator warnings | 294 | **398** |
| records still carrying the import's own summary | *uncounted* | **101** |
| titles that argue with their own span | *unasked* | **6, three of them fixed** |

**Per lane (A10).** Nothing was imported, so no lane moved: Europe 314, Asia
125, Americas 104, Africa 79 active; main 85, 67, 59 and 31. The corpus is
larger than the 13:07Z fire's 590 because `origin/m0` was merged in at the
head of this run and it carries M42b's batch 2 — the Falklands operations and
the Italian Wars — which is that branch's work and not this one's. **Measured
at the merge commit and again at the end, every count in the table is the
same**: this fire changed what records say and what the validator asks, and
not how many there are.

### (3) A stated span beats a point in time, at both ends

`intervalFor()` read `P585` before `P580`. Deviation 1015 caught what that
does to an item carrying all three: Q49101, the Suez Crisis, has P580
29 October 1956, P582 7 November 1956 **and a stray P585 of March 1957**, and
the record arrived `start: 1957, end: 1956` — an interval running backwards
that only rule 15 saw. The preference was left alone then and is corrected
now. Where an item states a span the span is the answer **and the point in
time is read at neither end**; P585 still dates an item that gives nothing
else, which is what a one-day event is.

The other half: **a start with no `P582` states no end.** The record still
carries `end: null`, which in this atlas is "as far as the data goes" and not
"still going on", and now carries **`end-unstated`** beside it. A war that
ended in 1996 and a war whose end nobody has dated look identical on the
timeline; the flag is what sends a reviewer to the article instead of letting
the null stand as a claim. An actor dated from its founding is not this case —
an open-ended polity is what `end: null` exists for — and neither is a bare
point in time, so neither is flagged.

### (5) The article title is the name, disambiguator and all

A Wikidata label is the shortest name an item can be called. A Wikipedia
article title is the name that had to tell this thing from everything else of
that name, so it is the one carrying the disambiguator. `titleFor()` read the
label first, and that is where **three events titled "Afghan Civil War" and
two titled "Treaty of London"** came from — each with its own disambiguated
title sitting unread in its `wikipedia.en` since the day it was imported. The
order is reversed within each language: an English label still beats a
Portuguese article, which is M46's clause and is untouched.

| record | was | is | at revision |
| --- | --- | --- | --- |
| `afghan-civil-war` | Afghan Civil War | **Afghan Civil War (1989–1992)** | 1371765193 |
| `afghan-civil-war-q1980081` | Afghan Civil War | **Afghan Civil War (1992–1996)** | 1371836551 |
| `afghan-civil-war-q12302518` | Afghan Civil War | **Afghan Civil War (1996–2001)** | 1374360605 |
| `treaty-of-london-q584617` | Treaty of London | **Treaty of London (1913)** | 1359713953 |
| `treaty-of-london` | Treaty of London | **Treaty of London (1915)** | 1364595903 |

Each title is its own article's, at the revision cached under
`tools/import/cache/wikipedia/`; nothing is composed here. The two Afghan
records that cited only Wikidata now cite the article the title is read off,
and all five carry `title-from-article`. **No id moved and no reference was
rewritten**: an id is not a title, the five ids were already distinct, and
nothing in `data/` points at a title.

### The two warnings, and the six titles the second one found

A12 asks each of these passes for a warning, and neither number existed. How
many import placeholders are left was known only by grepping for the sentence
`importedSummary()` writes — **`summary-imported`** is that count, and it
stands at 101 (79 events, 19 places, 3 actors). **`span-vs-article-title`** is
the other, and it is the one that paid: a title stating its own years is an
assertion about the span, made by whoever wrote the article, and **146 titles
here carry years**. Six disagree with their record.

| record | title states | record was | now |
| --- | --- | --- | --- |
| `1940-1944-insurgency-in-chechnya` | 1940–1944 | 1944–1944, both ends 15 Dec | **1940–1944** |
| `german-revolution-of-1918-1919` | 1918–1919 | 1918–1918 | **1918–1919** |
| `2011-yemeni-revolution` | 2011 | 2012–2012, both ends 27 Feb | **2011–2012** |
| `1957-1958-influenza-pandemic` | 1957–1958 | 1956–1958 | unchanged, a person's |
| `indo-pakistani-war-of-1947-1948` | 1947–1948 | 1947–1949 | unchanged, a person's |
| `the-impeachment-of-dilma-rousseff-2016` | 2016 | 2015–2016 | unchanged, a person's |

**The three widened are one shape.** The item dates the moment the thing
finished — the deportation that closed the Chechen revolt, the handover that
closed the Yemeni one — or the moment it broke out, and the article dates the
thing. Each is widened only from the record's own cited article at the
revision read, quoted in the locator, with the note saying what moved from
what, and each carries `a7-widened`. **Two pairs of exact dates were dropped
rather than moved**: the article contradicts them and gives the period no day
of its own, and a day nobody wrote down is not a run's to invent. The edges on
all three were read before the intervals were touched, which is deviation
1074's rule, and the validator confirms none of the five arrows moved.

**The three left are not widenings**, and the difference is the finding. Each
record is *already wider than its own title*, so there is nothing in the
article to widen it to; A7 authorises reading a span from a cited article, not
narrowing a record to one. The impeachment shows why this can never be an
error: it begins in December 2015 and is titled for the year it finished,
which is a defensible record and not a mistake.

### Where A12 stands after this fire

| pass | state |
| --- | --- |
| (1) placeholder summaries | data pass done 22 Sep (277 fixed, 52 left there, **101 now, counted by `summary-imported`**) |
| (2) A9's places | done 22 Sep, 410 of 433; 23 refused for want of a coordinate |
| (3) `intervalFor()` + A7 | **done here**; A7's own three done 22 Sep, three more widened here |
| (4) P710 participants | done 22 Sep, 44 events and 113 lines |
| (5) `titleFor()` + the five retitles | **done here** |
| (6) polity descriptions | done 22 Sep, 177 of 184 |

**A12 is spent.** The clause "before any further import" is satisfied and the
next import fire goes to A10's batches.

## Where the run stands after A12 (3) and (5), for the fire that picks it up

*22 September, 16:06Z onward. An import fire that imported nothing, because
A12 stood in front of the batches and two of its passes had not run.*

| | |
| --- | --- |
| corpus | **622 active** |
| **main** | **242** |
| filed | 380 |
| largest connected component | **506** |
| components | **92** |
| events with no edge at all | **72** |
| events with no place | 23, all refused for want of a coordinate |
| the inverse `part of` vein | **618 rows open**, untouched |
| the sweep pool, world sections | **1,046** open rows, untouched |

**What is open, in the order a fire should weigh it:**

- **The next fire is an import fire and A12 no longer stands in front of it**
  unless it is the first after 02:00Z tomorrow, which is a curation fire and
  now owes A13's relations pass as well — that pass has never run, and the
  curation section above predates the amendment.
- **A10's order, on this branch's half of the partition (A11(b)): Africa 79
  active against Asia's 125, so Africa first.** Read `origin/m42b`'s
  `data/events/` ids before a batch; Europe and the Americas are that
  branch's.
- **72 events carry no edge**, up from 47, because the merge brought M42b's
  batch 2 in and eighteen of its twenty-two earned none. The advice is
  unchanged and now has more to work on: take the isolated by name, because
  most are battles whose war the atlas holds and whose article's § Background
  states the link.
- **101 records still say only what the import said about their item**, and
  the warning now counts them so a fire can see the number fall.
- **Three titles still argue with their spans** and are a person's, as the
  177 polity descriptions and the Gaza cluster's 48 rows are.

### The check, and the two reds that were not this fire's records

The **merge commit went red** and the branch head is **green** on the same
work. Both failures are worth naming, because neither is about a record.

**Rule 16, seven history shards missing and seven stale.** Deviation 887 has a
fire unshallow its clone, and `tools/lib/history.mjs` refuses a shallow one
outright — over a shallow clone every record reads as written once and never
touched. So the first rebuild after an unshallow writes real shards where the
branch carried fallback ones. What made it red was the *order*: the index was
built before the merge commit existed, so its shards describe the commit
before it. **798 is about the commit and not only about records versus
index** — build the index after the commit whose history it has to describe,
and a merge is a commit like any other. A rebuild at the branch head produced
no diff, which is what says the head was already right.

**`tests/compose-browser.test.mjs`, the browser never opened.** Not deviation
1069's flake: that one is a `waitFor` budget against a growing corpus and
fails inside a test, and this fails at the launch — *"Failed to connect to the
bus"* at `browser.mjs:236`, before the test body ran. Both are runner
conditions; only the first is evidence about the corpus.

**Green on the head**: 1,742 pure tests and 246 browser tests, 0 failed, 0
skipped, and `node tools/validate.mjs --index` at 0 errors and 398 warnings.


## Batch 35 — Africa, the lane that trails, and the first batch of the inverse vein asked of it

*22 September, the fire that picked the run up at 18:13Z. A12 is spent and the
clause "before any further import" no longer stands in front of the batches, so
this is an import fire under A10's order. The lane is **Africa**: 79 active
against Asia's 125 on this branch's half of the partition (A11(b)), and 89
after this batch.*

**The rule, unchanged from batch 32 and asked of one lane.** The pool is the
same inverse `part of` vein — *which items does Wikidata say are parts of the
events this atlas already holds?* — with the subjects narrowed to the **72
active events of the `africa` lane that carry a Wikidata id**. The three tests
since batch 20 are unchanged: **depth**, which the query guarantees because its
subjects are records here; **span**, the child's own `P580`/`P585` and `P582`
inside the parent's interval *as this atlas dates it*, at the day where both
give a full date; and **lane**, the one `createRegionDeriver` gives the item's
own `P625`, which must be `africa` because the parent's is.

| | |
| --- | --- |
| subjects: active `africa`-lane events with a Wikidata id | **72** |
| `?child wdt:P361 ?parent` pairs returned, at 3 sitelinks or more | **373** over 365 distinct items |
| already held, or in the import state's `done`, or carrying a title a record here has | 36 |
| refused for **no `P625` of its own** | **154** |
| refused on the **lane** | 9 |
| refused for **no date the atlas can use** | 2 |
| refused on the **span** | **7** — 5 beginning before the parent, 2 ending after it |
| filing cleanly on all three tests | **159 distinct items**, of which 10 taken |

**The span refusals are the interesting ones and two of them are already on the
record.** The Mahdist War (1881–1899) and the Anglo-Ashanti wars (1823–1900)
are filed by Wikidata under the Scramble for Africa, which this atlas dates
1885–1914: both begin before the period they are said to be part of, which is
batch 31's Great Depression refusal and batch 33's July Crisis refusal again.
The Cabinda Conflict is batch 33's own refusal met a second time, three days
on the wrong side of the Angolan Civil War's 11 November 1975.

| the record | sitelinks | filed under | placed at | the edge it earned |
| --- | --- | --- | --- | --- |
| `battle-of-adwa` | 45 | `first-italo-ethiopian-war` | `adwa` | it `--reacted-to--> second-italo-ethiopian-war` |
| `battle-of-mogadishu-1993` | 38 | `somali-civil-war` | `mogadishu` | it `--precondition-of--> war-in-somalia` |
| `killing-of-muammar-gaddafi` | 24 | `libyan-civil-war` | `sirte` | the one below, into it |
| `battle-of-annual` | 24 | `rif-war` | `annual` | none |
| `operation-serval` | 23 | `mali-war` | `mali-q912` | none |
| `abushiri-revolt` | 22 | `scramble-for-africa` | `german-east-africa-q153963` | none |
| `battle-of-tripoli-2011` | 21 | `libyan-civil-war` | `tripoli` | it `--precondition-of--> killing-of-muammar-gaddafi` |
| `siege-of-mafeking` | 19 | `second-boer-war` | `mahikeng` | none |
| `battle-of-magersfontein` | 17 | `second-boer-war` | `magersfontein` | none |
| `first-battle-of-brega` | 16 | `libyan-civil-war` | `brega` | none |

| | before | after |
| --- | --- | --- |
| corpus | 622 active | **632 active** |
| **main** | 242 | **242, unchanged** |
| filed | 380 | **390** |
| active edges | 647 | **650** |
| largest connected component | 506 | **508** |
| components | 92 | 99 |
| events with no edge at all | 72 | **78** |
| events with no place | **28** | **28** — every one of the ten arrived placed |
| classes added to the seeds table | — | **3**, one refused |
| API calls | — | 1 SPARQL, 23 for the import, 4 full-article reads |

**Per lane (A10).** Active: Europe 314, Asia 125, **Africa 79 → 89**, the
Americas 104. Main: Europe 85, Asia 67, Africa 31, the Americas 59 — every one
of them unchanged, because all ten arrived filed.

### The three classes added, and the one refused

`Q188055` **siege** takes `war`: `data/categories.json`'s own description of
that category names a siege in its list. `Q6107280` **revolt**, which Wikidata
glosses *"social movement that seeks to overthrow and destroy an established
authority"*, takes `revolution`, whose description names an uprising. `Q4`
**death** takes `death`, and the class and the category are the same statement:
the category is *"a person's death, whether by illness, accident, execution or
assassination"*.

**`Q914841` *frontier justice* was refused**, and it is the batch's cheapest
finding. It is the other class the killing of Gaddafi carries, and Wikidata
glosses it *"extrajudicial punishment that is motivated by the nonexistence of
law and order"*. That names **how a punishment was delivered**, not a thing
that happened, which is batch 33's refusal of `Q19833559` *preparation* in
different clothes. The item was imported on `Q4` instead and nothing was lost.

### The places, and where this batch departs from A12 (2)'s letter

**All ten arrived with a place**, nine of them written by this batch and one
(`mali-q912`) already here. A12 (2) says A9's pass "reads the item's own `P625`
first", and every one of the 159 rows in this pool has one — the lane test is
built on it. **This batch did not use it as the place**, and the reason is what
a place record is: an event item's own `P625` is a bare coordinate with no
identity, so a place written from it would be a place record called *Battle of
Adwa*, which is not a place. The nine were written from the located item the
event's `P276` names instead — `adwa`, `mogadishu`, `sirte`, `annual`,
`tripoli`, `mahikeng`, `brega`, `magersfontein` and
`german-east-africa-q153963` — with `precision` read off that item's own class,
never hard-coded: `city` for a settlement, `point` for `magersfontein`, which
Wikidata knows as the battlefield museum and which is a site and not a town,
and `country` for German East Africa, a historical country whose centroid is a
long way from the coast the Abushiri revolt was fought on — which is exactly
what a coarse precision is for, and why the map draws one wider and fainter.

**The placeless count is 28 and not the 23 the last two stands carried**, and
the difference was on the branch before this fire opened: measured at
`eebd5bc6`, the head this fire picked up, it was already 28. The five the
stands were not counting are M42b's Italian Wars, which reached this branch
through an earlier `m0` merge — `italian-wars`, `italian-wars-of-1499-1504`,
`italian-war-of-1521-1526`, `italian-war-of-1551-1559` and
`war-of-the-league-of-cambrai`. Each is a war across a peninsula rather than a
thing that happened at a point, and M42b withdrew a peninsula-sized place on
22 September rather than draw one; they are that lane's to settle. **23 is the
number A9 refused for want of a coordinate and it is unchanged**; 28 is how
many active events have no place, which is the row's own question. The stands
of batches 33 to 35 answered the second question with the first number.

This is the practice the 410 places of the 22 September pass already follow:
that pass created **112 `region`, 98 `country` and 58 `city` places and not one
`point`**, so the corpus has never held a place named after an event. The
letter of A12 (2) and the corpus disagree, and this batch followed the corpus.

### The summaries, written here rather than left to tomorrow

Ten records would have arrived carrying the import's placeholder and pushed the
`summary-imported` warning from 101 to 111. The import cached each item's
English lead as it created the record, so the first three sentences of each
went onto the record at the revision the cache names, with a `wikipedia-en`
citation and the `summary-from-lead` flag — the shape 287 records now carry.
**No network was needed for it** and the warning stands still at 101 rather
than rising.

### The edges, and the seven that earned none

Three edges from ten rows, which is the rate every batch of this vein has
found. All three run to or from a record the atlas already held, and none
between two rows of the batch — batch 34's finding again.

The seven that earned none were read for one and refused it. `abushiri-revolt`
is the clearest: its article's § Aftermath says the revolt "revealed the
complete inability of the German East Africa Company to administer its
territory" and that the Imperial government took over on 1 January 1891 — a
consequence this atlas holds no record of. The Heligoland–Zanzibar Treaty,
which it does hold, is named nowhere in the article. `battle-of-annual`'s lead
names the fall of several Spanish governments, Primo de Rivera's dictatorship
and the abdication of Alfonso XIII, and the atlas holds none of the three.
`siege-of-mafeking` and `battle-of-magersfontein` argue nothing beyond their
own war; `operation-serval`'s article does not mention the 2012 Malian coup
this atlas holds; `first-battle-of-brega` says only that it was fought during
the civil war it is already filed under. **Nothing was written to keep them**,
and `degree-zero` says out loud that seven more records are waiting for a
neighbour.

## Where the run stands after batch 35, for the fire that picks it up

*22 September, 18:13Z onward. An import fire, one batch, the first taken from
Africa under A10.*

| | |
| --- | --- |
| corpus | **632 active** |
| **main** | **242** |
| filed | 390 |
| largest connected component | **508** |
| components | **99** |
| events with no edge at all | **78** |
| events with no place | **28** — 23 refused for want of a coordinate, 5 brought in by the `m0` merge |
| the Africa half of the inverse vein | **149 rows open** after this batch's ten |
| the sweep pool, world sections | **1,046** open rows, untouched |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z is the curation fire and it owes A13's
  relations pass**, which has still never run: the 22 September curation
  section predates the amendment.
- **Africa still trails and the vein there is not close to spent**: 149 rows
  pass all three tests today, against Asia's own pool, which nothing has
  measured yet. Africa 89 active against Europe's 314 is the number A10 is
  about.
- **The Boer and Libyan clusters are the densest part of that pool** — the
  Second Boer War alone offers Ladysmith, Spion Kop, Stormberg, Colenso and
  Paardeberg, and the Libyan Civil War offers Misrata and the rest of Brega.
  Batch 34 showed that rows of one war are chronological to each other and not
  causal, so taking them will buy filed volume and few edges; the ranking
  across the whole lane is what spreads them.
- **78 events carry no edge**, up six. The advice is unchanged: take the
  isolated by name, because most are battles whose war the atlas holds and
  whose article's § Background states the link.
- **Three titles still argue with their spans** and are a person's, as the
  seven polity descriptions and the Gaza cluster's 48 rows are.

## Batch 36 — the same lane, and the week where a war's rows *are* causal

*22 September, the second batch of the fire of 18:13Z. The same pool, the same
three tests, the next ten by sitelinks with ties by item id. It was taken
expecting batch 34's answer — that the rows of one war are chronological to
each other and not causal — and **it got the opposite**, which is the batch's
finding.*

**The pool did not move.** Re-run after batch 35 with the ten new records as
subjects too, the vein returns the same 373 pairs over 365 items: an imported
battle's own item is almost never the `P361` parent of anything. 82 subjects
now, **149 rows open**, and the ten with the most sitelinks taken.

| the record | sitelinks | filed under | placed at | the edge it earned |
| --- | --- | --- | --- | --- |
| `siege-of-ladysmith` | 16 | `second-boer-war` | `ladysmith` | it `--reacted-to-->` Spion Kop **and** Colenso |
| `battle-of-spion-kop` | 15 | `second-boer-war` | `south-africa-q258` | the one above, into it |
| `battle-of-waterberg` | 14 | `herero-wars` | `waterberg-plateau-park` | none |
| `battle-of-stormberg` | 14 | `second-boer-war` | `chris-hani-district-municipality` | it `--reacted-to--> second-battle-of-colenso` |
| `second-battle-of-colenso` | 14 | `second-boer-war` | `colenso` | three, into it |
| `battle-of-misrata-2011` | 14 | `libyan-civil-war` | `misrata` | none |
| `alhucemas-landing` | 14 | `rif-war` | `al-hoceima` | `battle-of-annual --precondition-of-->` it |
| `ogossagou-massacre` | 14 | `mali-war` | `ogossagou` | none |
| `battle-of-algiers-1956-1957` | 13 | `algerian-war` | `algiers-q3561` | none |
| `battle-of-paardeberg` | 13 | `second-boer-war` | `south-africa-q258` | none |

| | before | after |
| --- | --- | --- |
| corpus | 632 active | **642 active** |
| **main** | 242 | **242, unchanged** |
| filed | 390 | **400** |
| active edges | 650 | **655** |
| largest connected component | 508 | **508, unchanged** |
| components | 99 | 104 |
| events with no edge at all | 78 | **81** |
| classes added to the seeds table | — | **1** |
| API calls | — | 1 SPARQL, 19 for the import, 4 full-article reads |

**Per lane (A10).** Active: Europe 314, Asia 125, **Africa 89 → 99**, the
Americas 104. Main unchanged in every lane — Europe 85, Asia 67, Africa 31, the
Americas 59.

### Five edges from ten rows, and why that contradicts batch 34

Batch 34 took eight rows of the Vietnam War and concluded that **"the phases of
one war are chronological to each other and not causal"**. This batch took five
rows of the Second Boer War and **four of its five edges run between them**.
Both findings are true and the difference between them is what a fire should
carry forward: **it is not the war, it is whether the articles argue the
commanders' decisions.**

Colenso's § Background is the whole of it in one sentence: *"On hearing that
Gatacre and Methuen had been defeated at the battles of Stormberg and
Magersfontein, Buller felt he needed to relieve Ladysmith as soon as
possible…"* and, three sentences later, *"He decided to make a frontal assault
at Colenso"* instead of the flank march he had intended. That is a decision,
with its reason, naming two battles this atlas holds — one of them
`battle-of-magersfontein`, which arrived in batch 35 an hour earlier. Khe Sanh
and Hamburger Hill have no such sentence; Spion Kop and Colenso each say in
their own lead that they were attempts to relieve Ladysmith. **Read the
articles for decisions and the rows of one war connect; read them for
chronology and they do not.**

`battle-of-annual --precondition-of--> alhucemas-landing` is the fifth and the
same shape across four years: the landing's § Background opens *"After the
Battle of Annual in July 1921, the Spanish army was unable to regain control of
the central Rif region"* and runs from there to the inquiry, the agreements and
the plan for the landing.

### The component did not move, and A5 says a batch that grows the corpus and not the component must say why

**508 before and 508 after.** The five edges built a **new component of five**
— the relief of Ladysmith and Black Week — rather than joining the largest one,
and the reason is structural rather than a failure of reading: every one of
them runs between records this batch and batch 35 created, and **none of the
ten reaches a record that was already on the main chain**. `second-boer-war`,
which all five hang from, is their *parent*, and `parent` is a display fact
that takes no edge (brief §, M62), so filing them under it puts them in the
picture and not in the graph.

That is the honest cost of a vein that imports the parts of things. The way to
join the cluster to the chain is an edge from the Second Boer War itself to or
from something the atlas already holds — the Scramble for Africa is its parent
and an umbrella, which `tests/m42-filing.test.mjs` refuses an edge to, so it
would have to be a record like the Treaty of Vereeniging, which this atlas does
not hold. **A fire that wants the component to move should import the joins,
not more parts.**

### What was refused, and the one refusal worth the most

**`battle-of-mogadishu-1993 --?--> 1994-genocide-against-tutsi` was refused,
and it is the fire's best refusal.** The battle's § Legacy says, in so many
words, that *"many commentators identif[y] the Battle of Mogadishu's graphic
consequences as the key reason behind the US's decision to not intervene in
later conflicts such as the Rwandan genocide of 1994"*, and quotes Walter
Clarke: *"Our lack of response in Rwanda was a fear of getting involved in
something like a Somalia all over again."* The atlas holds
`1994-genocide-against-tutsi`. The edge was not written because **what the
article argues is about the response and not about the event**: Mogadishu is
offered as a reason the United States stayed out, not as anything standing
behind the genocide, whose preconditions are Rwandan. An edge here would have
the atlas saying that an American battle is a precondition of a Rwandan
genocide, which is not what any source says. **The absence of an `abstained`
type is not a licence to use `precondition-of` for one.**

`battle-of-stormberg --?--> battle-of-magersfontein` was refused for the
opposite reason: Stormberg's lead says Gatacre attacked "to secure the railway
lines which supplied the larger March on Kimberley by Lord Methuen", which
makes the two battles *parts of one week* and not a chain — Methuen's march was
already under way. Batch 34's finding holds wherever the articles describe
positions rather than decisions. `battle-of-waterberg`, `battle-of-misrata-2011`,
`ogossagou-massacre`, `battle-of-algiers-1956-1957` and `battle-of-paardeberg`
each argue nothing beyond the war they are already filed under. Nothing was
written to keep any of them.

**One class added**: `Q646740` *landing operation*, which Wikidata glosses
"type of military action", takes `war` — it follows `Q1261499` naval battle and
`Q830494` dogfight, an amphibious assault being organised armed force between
polities.

### Three things the batch found about the data, each now a deviation

**An item's English label is not always English** (1087). `Q131323`, which the
Battle of Misrata names as its location, carries `البيضاء` as its `en` label
while its `enwiki` sitelink says *Misrata* and its English aliases say
*Misurata*. A place written from the label alone would have put an Arabic name
on an English map. The sitelink is the check, and both names are kept in
`names`.

**A place id can collide with an actor** (1088). `algiers` is an actor record
here, and ids are unique across kinds (rule 2), so the place is
`algiers-q3561` — the qid suffix the corpus already uses for `mali-q912`,
`london-q84` and `darfur-q46733`.

**A modern administrative name on a nineteenth-century battle is the price of
A9's order, not a defect of it** (1089). `battle-of-stormberg` is placed in
`chris-hani-district-municipality`, an area created in 2000 and named after a
man who died in 1993. Its `P276` is the only located item between the
battlefield and the country, and `south-africa-q258`, where Spion Kop and
Paardeberg went for want of any `P276` at all, is just as anachronistic for
1899 and coarser. Containment is geometry and not a claim; `historicalNames`
is the field that answers this and no record sets it yet.

### One record arrives arguing with its own title

`battle-of-algiers-1956-1957` is dated 7 January to 9 October 1957 from the
item's `P580`/`P582`, and the article it is named from is
*"Battle of Algiers (1956–1957)"*. A12 (3) says such a record keeps the
`span-vs-article-title` warning, and A7 says an interval the cited article does
not state stays as it is. The article's § First phase dates the campaign's
opening to the executions of 19 June 1956 and the bombings of 30 September
1956, but it states no start for the campaign itself, and choosing one of those
two days would be this run writing a date. **It stays as it is and stays
flagged**, which is A7's own sentence.

## Where the run stands after batch 36, for the fire that picks it up

*22 September, 18:13Z onward. An import fire, two batches, both Africa.*

| | |
| --- | --- |
| corpus | **642 active** |
| **main** | **242**, unmoved across both batches |
| filed | 400 |
| largest connected component | **508** |
| components | **104** |
| events with no edge at all | **81** |
| events with no place | **28** — 23 refused for want of a coordinate, 5 brought in by the `m0` merge |
| the Africa half of the inverse vein | **139 rows open** |
| the sweep pool, world sections | **1,046** open rows, untouched |
| per lane, active | Europe 314, Asia 125, **Africa 99**, Americas 104 |
| per lane, main | Europe 85, Asia 67, Africa 31, Americas 59 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z is the curation fire and it owes A13's
  relations pass**, which has never run: the 22 September curation section
  predates the amendment. A13 is a pass over *every* active event, and the
  corpus is 642 now.
- **The component is the number to watch, not the corpus.** Two batches added
  twenty records and eight edges and moved the largest component by two. The
  vein imports parts, and parts hang from a parent that takes no edge. **Import
  the joins**: a fire wanting the chain to grow should take the records the
  existing corpus's articles name — treaties, agreements, the ends of wars —
  rather than more battles inside wars already here.
- **Africa is 99 against Europe's 314** and the vein there has 139 rows left,
  so A10's order does not change: Africa, then Asia on this branch.
- **Read the articles for decisions.** Batch 36's finding is that rows of one
  war connect where their articles argue a commander's decision and do not
  where they describe positions. A batch that reads § Background for *why the
  next thing was done* will earn more edges than one that reads leads.
- **Three titles still argue with their spans, and now a fourth**:
  `battle-of-algiers-1956-1957`. All four are a person's, as the seven polity
  descriptions and the Gaza cluster's 48 rows are.

### The check, and deviation 1082 arriving a second time

**Red on the first attempt, green on the re-run, and the failure was not a
record.** `tests/compose-browser.test.mjs:103` failed at `browser.mjs:236` with
*"headless Chromium opened a debugging port, saying: … Failed to connect to the
bus"* — the browser dying **before the test body ran** — and the suite then hit
its 120-second timeout, which is the second of the two counts. That is
deviation 1082's signature exactly, named this morning on the previous fire's
merge commit, and it is the one case the run protocol allows a re-run for: a
job that died at the launch rather than inside a test. The same suite had
passed twice in this sandbox on the same tree, 254 of 254.

**One re-run, spent.** Attempt 2 was green. The same failure took two tests off
the `m0` pull request's run at 18:58 on a commit whose push run had already
passed, which is the clearest evidence available that it is the runner and not
the corpus: one tree, two runs, two answers.

**Green on the head**: 1,748 pure tests and 254 browser tests, 0 failed, 0
skipped, and `node tools/validate.mjs --index` at 0 errors and 408 warnings.

## Batch 37 — the joins, which is a different vein from the parts

*22 September, the fire that picked the run up at 21:07Z, after merging `m0`
into `m42`. An import fire: today already carries a `## Curation 2026-09-22`
section, so this is not the curation fire, and A12 is spent, so the batches are
what stands in front of the run.*

**The last stand asked for this batch in one sentence.** Batch 36 left the
largest component where it found it and said why: *"A fire that wants the
component to move should import the joins, not more parts."* The inverse
`part of` vein returns the parts of the wars this atlas holds — battles, sieges,
operations — and a part hangs from a parent, and a parent takes no edge. This
batch stopped asking that question and asked another one.

### The vein: the properties that are already a causal claim

Wikidata has eight properties that say one thing stood behind another:
`P828` has cause, `P1542` has effect, `P1478` has immediate cause, `P1536`
immediate cause of, `P155` follows, `P156` followed by, `P1479` contributing
factor, `P1534` end cause. Asked of the events this atlas holds, they return
**pairs, not children** — and a pair has two halves worth different things:

- **both ends already here** → an edge and no import at all, which is the
  cheapest thing this run can do to the component;
- **one end not here** → the record to import, and it arrives with the edge
  that justified importing it.

Asked of the **92 active `africa`-lane events that carry a Wikidata id** over
the six directional properties, the vein returns **54 rows**: five distinct
held-to-held pairs and **29 items the atlas does not have**.

**All five held-to-held Africa pairs already carry an edge, in the direction
Wikidata states, and none of them contradicts one.** Nothing was disputed.
That is a good answer rather than a wasted query: the Rwandan civil war's two
consequences, the two Malian coups and the War of Attrition into the Yom Kippur
War are the atlas agreeing with the source it would have been checked against.

### The five imported, all filed, all placed, all with the edge they came for

| the record | sitelinks | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- |
| `six-day-war` | 108 | `arab-israeli-conflict` | `middle-east` | `suez-crisis -->` it, and it `--> war-of-attrition` |
| `angolan-war-of-independence` | 37 | `portuguese-colonial-war-1961-1974` | `angola-q916` | it `--precondition-of--> angolan-civil-war` |
| `somali-civil-war-2009-present` | 22 | `somali-civil-war` | `somalia-q1045` | `war-in-somalia -->` it |
| `comprehensive-peace-agreement` | 20 | `second-sudanese-civil-war` | `naivasha` | two: the war into it, it into the 2011 referendum |
| `operation-barkhane` | 20 | `mali-war` | `sahel` | `operation-serval -->` it |

Every one of the five sits **between two things**, which is what a join is. The
Six-Day War is the clearest: the atlas held the Suez Crisis and the War of
Attrition, both already on the main chain, and held nothing between them.

**A8's second parent was written and taken off again**, and the test is why.
`decolonisation-of-africa` fits the Angolan war of independence on both of A6's
halves — the span holds 1961–1974 and the subject is Africa — but the colonial
war it is filed under is **already** filed under that period, so the period is
reachable from the record through its first parent.
`tests/m42-filing.test.mjs` refuses exactly that, and the refusal is right: A8
is about an event that belongs to two arguments at once, as Angolan independence
belongs to the Portuguese republic and to African decolonisation, and not about
restating an ancestor the chain already reaches. **Every umbrella that fits
means every umbrella that adds something**, and `docs/m62-umbrellas.md` carries
the filing's own argument, as that test requires of an M62 umbrella.

**A sixth edge and a seventh came free**, from the whole-corpus half of the same
vein: `marco-polo-bridge-incident --caused--> second-sino-japanese-war`, whose
article says the incident *"is generally regarded as the start of the Second
Sino-Japanese War"* — an isolated record joined to the largest component with no
import at all — and the two the Comprehensive Peace Agreement carries.

| | before | after |
| --- | --- | --- |
| corpus | 678 active | **683 active** |
| **main** | 242 | **242, unchanged** |
| filed | 436 | **441** |
| active edges | 663 | **671** |
| largest connected component | 513 | **517** |
| components | 132 | **131** |
| events with no edge at all | 107 | **105** |
| classes given a category | — | **3** |
| places written | — | **2** (`naivasha`, `sahel`) |
| API calls | — | 3 SPARQL, 12 for the import, 6 full-article reads |

**Per lane (A10).** Active: Europe 314, Asia 125 → **126**, **Africa 99 → 103**,
the Americas 140. Main: Europe 85, Asia 67, Africa 31, the Americas 59 — every
one unchanged, because all five arrived filed.

**The component moved and A5's question has an answer this time**: +4 against
batch 36's 0. Four of the five new records joined the largest one (the fifth,
Operation Barkhane, joined `operation-serval`, which was a singleton, so the two
are a component of two), and the Marco Polo Bridge incident merged in from
outside. The difference between +0 and +4 is the vein and not the effort.

### The Sudan cluster is now seven and still does not touch the chain

The Comprehensive Peace Agreement joined the component it belonged to —
`first-sudanese-civil-war`, `second-sudanese-civil-war`, `war-in-darfur`,
`darfur-genocide`, `south-sudanese-civil-war` and the 2011 referendum — and took
it from six to seven without joining it to anything. **It is the largest
joinable island in the graph** and the single biggest move available to a later
fire. Nothing in the vein reaches it: Sudan's records name each other and the
world's records do not name Sudan. The 2023 Sudanese civil war, which would be
the modern hinge, is a **retracted** record here.

### Sixteen merge rows, nine pairs, eight refused

The whole-corpus pass — all 545 events with a Wikidata id, all eight properties,
**468 rows** — returns **128 distinct held-to-held pairs**, of which **71 already
carry an edge**, **41 have none and are inside one component already** (density
the curation fire's A13 pass can take), and **16 have none and would merge two
components**. Those sixteen rows are **nine distinct pairs** — the properties
come in inverse couples, so most are counted twice — and **eight of the nine are
refused**:

- **Four run onto an `m42-umbrella`** — `saur-revolution` into `afghan-conflict`,
  `world-war-i` and `world-war-ii` into `interwar-period`, `world-war-i` into
  `scramble-for-africa` — and `tests/m42-filing.test.mjs` refuses an edge with an
  umbrella at either end, whatever Wikidata says. An umbrella is a display fact
  and not an argument; the three singletons stay singletons by design.
- **Three are consecutive Portuguese presidential elections** (1919–1923,
  1923–1925, 1949–1951) joined only by `P155`/`P156`. Batch 34's finding holds: *follows*
  is chronology and this atlas has no type for it.
- **One is refused by the record's own article.** Wikidata says the Battles of
  Khalkhin Gol have as effect the Molotov–Ribbentrop pact. The article at
  revision 1371868221 says the opposite way round — the pact *"deprived the
  [Kwantung] Army of the basis of its war policy against the USSR"* — and says
  of the battle only that it moved Tokyo away from the North Strike doctrine.
  **A property is a claim and the article is the check**, which is A13's rule
  applied before A13's fire.

The one left is `prelude-to-the-russian-invasion-of-ukraine` and
`full-scale-russo-ukrainian-war`, a Europe pair after 1900, which is a lane
neither half of A11(b)'s partition names. It is left for the curation fire,
which covers every event whichever lane wrote it.

### Six items refused at the import, five of them by A6's main count

The vein offered 29 Africa items and five were taken. What the other twenty-four
were refused for, in the order it matters:

- **`Q2629782` French conquest of Algeria** (25 sitelinks), **`Q17512479` Arab
  Winter** (29), **`Q4574284` 1970s energy crisis** (22), **`Q1433226` Opération
  Turquoise** (11) and **`Q113946324` Closure of the Suez Canal** (4) each fit
  under no umbrella this atlas holds, so each would have arrived **main**, and
  A6 says the main count must not rise. The conquest of Algeria begins in 1830
  and `scramble-for-africa` begins in 1885, which is batch 35's span refusal
  again; Opération Turquoise runs to 21 August 1994 and the genocide record ends
  on 4 July; the closure of the canal runs to April 1957 and the Suez Crisis
  ends on 7 November 1956. **Each is a real join and each is waiting for the
  umbrella that would hold it**, which is the honest cost of A6's teeth.
- **`Q4574284` is refused twice over**: it carries no `P276`, no `P131` and no
  `P17`, so it has no place and no lane either.
- **`Q277065` Great Lakes refugee crisis** carries no `P580`, no `P585` and no
  `P582`: no date the atlas can use.
- **Three are parts of wars already here** — Poplar Grove, the Siege of Ighriben
  and the Massacre of Monte Arruit — which is the vein this batch was asked to
  stop taking.
- **Five are articles about a response rather than events** — "international
  response to the War in Darfur", "international reactions to the Tunisian
  revolution", "international reaction to the South Sudanese Civil War",
  "Consequences of the Rwandan genocide" — or an institution, the National Unity
  and Reconciliation Commission. Batch 36 refused the Battle of Mogadishu's own
  consequence for the same reason: **the response is not the event**.

### Three classes given the category they always had, and two places written

`Q1006311` *war of national liberation* and `Q8465` *civil war* take **`war`**,
and `Q625298` *peace treaty* takes **`treaty`**. All three were added in M40a
from an import report, in a sandbox with no network, and left without a
category; the first record of each class arrived in this batch with no glyph
and no category toggle, which is what the absence costs on the picture.
**Fifty-two of the 140 event classes still carry none**, and that is a pass
somebody should take whole rather than three at a time.

`naivasha` (Q1007647, `city`) and `sahel` (Q66065, `region`) are the two places
A9's rule asked for, written from the `P276` each item names and with the
precision read off that item's own class.

### Three things the batch found, each now a deviation

**A refusal recorded as `done` is a refusal the state cannot retry** (1206).
`Q49077`, the Six-Day War, had been walked by an earlier import and refused —
at the time there was no `middle-east` place record for its `P276` and no lane
reachable from it. `advance()` writes every item of a batch into `done` whether
it was created or refused, so the item could not be offered again without
editing `data/imports/wikidata-state.json` by hand, which is what this batch
did. Deviation 1086 named this shape for a class decision; this is the place
half of it, and the general form is that **the state records that an item was
walked and not what happened to it**.

**A country is not a location, and the import's lane falls back to the country**
(1207). Operation Barkhane is a French operation across Mali, Burkina Faso,
Chad, Mauritania and Niger: its `P276` is the Sahel and its `P17` is France.
With no place record for the Sahel yet, the import walked `P276, P131, P17` for
a point and the first one it could reach was France's, so it wrote
**`region: europe`** on an operation in the Sahel. The order is right for a
place and wrong for a lane: an operation's country is **who sent it**, not where
it happened. The fix here was the place record the same rule asks for; the
general fix is that a lane derived from `P17` alone should say so or refuse.

**The vein decides the yield, not the reading** (1208). Batches 32 to 36 read
carefully and moved the largest component by two in five batches. This batch
read no harder and moved it by four, because it asked Wikidata for the
properties that are *already* a causal claim instead of for the parts of things.
**The parts vein files and the joins vein connects**, and a run that wants
chains should know which question it is asking.

## Where the run stands after batch 37, for the fire that picks it up

*22 September, 21:07Z onward. An import fire, one batch, a new vein.*

| | |
| --- | --- |
| corpus | **683 active** |
| **main** | **242**, unmoved |
| filed | 441 |
| largest connected component | **517** |
| components | **131** |
| events with no edge at all | **105** |
| events with no place | **31**, re-measured on this head and not carried forward (deviation 1092) — 10 are umbrellas, which are periods and not points; 5 are M42b's Italian Wars; the rest are the ones A9 refused for want of a coordinate. **The batch added none**: all five arrived placed |
| the joins vein, Africa, items not held | **24 open rows** after this batch's five |
| the joins vein, whole corpus, held-to-held with no edge | **41 inside one component, 1 that would merge** |
| the `part of` vein, Africa | **139 rows open**, untouched by this batch |
| the sweep pool, world sections | **1,046** open rows, untouched |
| per lane, active | Europe 314, Asia 126, **Africa 103**, Americas 140 |
| per lane, main | Europe 85, Asia 67, Africa 31, Americas 59 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 23 September is the curation fire and it owes
  A13's relations pass**, which has still never run: the 22 September curation
  section predates the amendment. This batch is a rehearsal of that pass over
  one vein and it says what the pass will find — **41 held-to-held pairs inside
  one component carry a causal property on Wikidata and no edge here**, and one
  more would merge. A13 asks for the article to be read for each; the eight
  edges here are what that reading yields when it is done honestly, and the
  Khalkhin Gol refusal is what it yields when the article says otherwise.
- **The joins vein beats the parts vein and the numbers say so**: +4 on the
  largest component from five records, against +0 from ten in batch 36 and +2
  from ten in batch 35. A fire that wants chains should run the eight causal
  properties before it runs `P361`.
- **The Sudan cluster of seven is the biggest island left** and nothing in the
  vein reaches it. It wants a record chosen by a person reading the articles:
  the 2019 Sudanese revolution, the 1989 coup, the 2023 war (which is here and
  retracted).
- **Five real joins are waiting for an umbrella** — the French conquest of
  Algeria, the Arab Winter, the 1970s energy crisis, Opération Turquoise and the
  closure of the Suez Canal — because A6 refuses a main event and no period this
  atlas holds spans them. **A fire that writes one African and one Middle
  Eastern period umbrella under A6 unlocks all five.** That is the cheapest
  thing on this list after the curation fire.
- **Fifty-two of the 140 event classes carry no category.** Three were given one
  here because their first record arrived in this batch; the rest is a pass.
- **Africa is 103 against Europe's 314** and A10's order does not change.

### The check, and the history shards that made it red twice

**Red on the `m0` merge and red on the records commit, and neither was a
flake.** Both are `rule 16` — *"`data/index/` is not what `build-index.mjs`
produces"* — and both name the same five files: the history shards for events,
edges and places of the twentieth and twenty-first centuries.

`tools/lib/history.mjs` builds those out of **the repository's own commits**,
so they depend on the commit graph and not only on the working tree. An index
rebuilt while the new records are still untracked — or, at the merge, before
the merge commit existed — carries shards the checked-out tree does not
produce, and `node tools/validate.mjs --index` passes locally because the same
stale graph builds the same stale shards on both sides of the comparison.

**Deviation 798's order already says this and it is worth saying again with the
word "commit" in it**: records, *then* rebuild, *then* the index. It converges
in one further step, because the index commit touches no record file and so
changes no history. Deviation 1209.

## Batch 38 — the joins vein asked of the other lane M42 owns

*22 September, the fire that picked the run up at 23:42Z, after merging `m0`
into `m42` (M84 and M85 landed there while this branch was working). The pool
file already carries a `## Curation 2026-09-22` section, so this is not the
curation fire; A12 is spent; the batches are what stands in front of the run.*

**The last stand named the vein and the lane in one sentence each.** *"The joins
vein beats the parts vein and the numbers say so"* — +4 on the largest component
from five records, against +0 from ten. And A10's order of need is Africa,
South America, Asia, of which M42 owns Africa and Asia. Batch 37 asked the six
directional causal properties of the 92 `africa`-lane events with a Wikidata id
and left the Africa half of the vein worked out. **This batch asked the same six
of the 120 `asia`-lane events**: `P828` has cause, `P1542` has effect, `P1478`
has immediate cause, `P1536` immediate cause of, `P1479` contributing factor,
`P1534` end cause. `P155`/`P156` stay out, for batch 34's reason — *follows* is
chronology and this atlas has no type for it.

**93 rows: 9 held-to-held and 81 items the atlas does not hold.**

### The four imported, all filed, three placed, each with the edge it came for

| the record | sitelinks | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- |
| `israeli-declaration-of-independence` | 54 | `arab-israeli-conflict` | `palestine-q23792` | it `--caused-->` `1948-arab-israeli-war` |
| `taif-agreement` | 24 | `lebanese-civil-war` | — (no coordinate anywhere on the item) | `lebanese-civil-war --caused-->` it |
| `2006-hezbollah-cross-border-raid` | 12 | `2006-lebanon-war` | `lebanon-q822` | it `--caused-->` `2006-lebanon-war` |
| `railway-protection-movement` | 10 | `xinhai-revolution` | `qing-dynasty` | it `--enabled-->` `wuchang-uprising` |

Each sits between two things the atlas already held, which is what a join is,
and `docs/m42-connections.md` carries the sentence of the cited article that
each edge stands on. **The Railway Protection Movement is the one worth reading
twice**: its article says the troops sent to suppress it *"created the
opportunity"* for the Wuchang Uprising, which is `enabled` and not `caused` in
this atlas's own five types, and Wikidata says `has cause`. The weaker of the
two types the sources allow is the one written.

| | before | after |
| --- | --- | --- |
| corpus | 683 active | **687 active** |
| **main** | 242 | **242, unchanged** |
| filed | 441 | **445** |
| active edges | 671 | **675** |
| largest connected component | 517 | **521** |
| components | 131 | **131** |
| events with no edge at all | 105 | **105** |
| events with no place | 31 | **32** (the Taif Agreement, refused for want of a coordinate) |
| places written | — | **1** (`palestine-q23792`) |
| API calls | — | 1 SPARQL, 12 Wikidata reads, 4 article reads |

**Per lane (A10).** Active: Europe 314, **Asia 126 → 130**, Africa 103, the
Americas 140. Main: Europe 85, Asia 67, Africa 31, the Americas 59 — every one
unchanged, because all four arrived filed.

**A5's number moved by four again**, and for the same reason batch 37's did: all
four new records hang off events already inside the largest component
(`1948-arab-israeli-war`, `lebanese-civil-war`, `2006-lebanon-war`,
`wuchang-uprising`). Nothing merged, because nothing in this vein reaches an
island — see below.

### The first batch where the article refused more than it wrote

Both held-to-held pairs that carried no edge were **refused by their own
articles**, which is batch 37's rule (*a property is a claim and the article is
the check*) costing this batch the two cheapest edges on the table.

- **`lebanese-civil-war` / `sabra-and-shatila-massacre`** (`P1542`). The
  massacre's lead at revision 1375981084 gives the 1982 Israeli invasion, the
  PLO withdrawal, the multinational force's departure and Bashir Gemayel's
  assassination as the circumstances and never says the civil war caused the
  killings. A massacre **inside** a war is containment, not an argument.
- **`second-guangzhou-uprising` / `wuchang-uprising`** (`P1542`). The lead at
  revision 1370737006 says only that it *"was a failed uprising that took place
  in China"*. It does not connect the two.

The other seven held-to-held rows are four pairs already settled:
`marco-polo-bridge-incident`/`second-sino-japanese-war` and
`2021-myanmar-coup-d-etat`/`myanmar-civil-war` and
`turkish-war-of-independence`/`treaty-of-lausanne` already carry the edge in
Wikidata's own direction; `saur-revolution`/`afghan-conflict` runs onto an
`m42-umbrella` and `tests/m42-filing.test.mjs` refuses it;
`battles-of-khalkhin-gol`/`molotov-ribbentrop-pact` is batch 37's refusal.

### Asia's regional period does not exist in the source, and A10 asks for it

A10 says *"the seeds file gains the regional periods A6 asks for where a lane
has none (Latin America's, Asia's)"*. **The decolonisation of Asia is the
obvious one and it cannot be written.** Wikipedia has the article, and its lead
at revision 1375271318 gives an end — *"concluding with the independence of the
Democratic Republic of Timor-Leste from Indonesia in 2002"* — and **no start at
all**. Its item `Q5249554` carries seven sitelinks, `P31` *process*, `P30`
Asia, and no `P580`, `P582` or `P585`. A6 asks for *"a span"* and the standing
exception forbids an invented date, so the period a lane of 130 events wants
would have to be opened with a year nobody wrote down. **Refused, and it is the
first umbrella A6 has refused for want of a span rather than for want of an
article.** `decolonisation-of-africa` had the same problem at its start and the
article solved it there by saying *"the mid-1950s"*, which the record carries as
the range 1954–1956; here the article says nothing.

### The Arab Spring is an umbrella in one lane and its members are in two

`2011-yemeni-revolution` is main, is dated 2011–2012, and the Arab Spring
umbrella is dated 2010–2012 — the span fits exactly, and a filing would have
taken Asia's main count down by one for nothing but a line. **The filing test
refuses it**, and rightly: `arab-spring` carries `region: africa` and
`actors: []`, `2011-yemeni-revolution` is drawn in the `asia` lane, and
`tests/m42-filing.test.mjs`'s subject clause asks for the umbrella's own lane or
a shared actor. **The Arab world is not a lane of this atlas**; it is split
between `africa` (Tunisia, Egypt, Libya) and `asia` (Yemen, Bahrain, Syria), and
the umbrella can only carry the half that shares its row. That is a records
question with a display answer behind it and neither is this batch's to settle.

### Sixty-nine of the 81 items are not events at all

The vein's Asia half is much noisier than its Africa half, and it is worth
saying what the noise is made of, because it is the argument for asking a
different question next:

- **Abstractions and conditions**, 21 rows: *political repression*, *political
  violence*, *authoritarianism*, *theocracy*, *inflation*, *corruption in Iran*,
  *human rights*, *fossil fuel*, *neoconservatism*, *Zionism*, *sex
  segregation*, *status quo ante bellum*, *lodgement*, *two-nation theory*. The
  2025–2026 Iranian protests alone carry ten of these as `P828`.
- **Things that are not events**: five countries (*Cambodia*, *Laos*, *Russia*,
  *Bangladesh*, *Gaza City*), three armed forces and two viruses (*SARS-CoV-2*,
  *H3N2*, *H2N2*).
- **Articles about a response rather than an event**, 20 rows, almost all of
  them the Gaza war's: *international reactions to*, *media coverage of*,
  *misinformation in*, *war crimes in*, *casualties of*, *impacts of*. Batches
  36 and 37 refused this shape twice; **the response is not the event**.
- **Parts of things already here**: *Operation Gibraltar*, *Operation Grand
  Slam*, *Operation Desert Hawk*, *Operation Rising Lion*, *Operation True
  Promise III*, the *2025 United States strikes on Iranian nuclear sites*. The
  parts vein, which batch 36 measured at +0.

**Four were refused for reasons worth keeping**, because each is a real join
waiting for something:

- **`Q10806` September 11 attacks** is the cause of *two* events held here — the
  war in Afghanistan and the Iraq war, the only item in either lane's vein to
  stand behind two — and it is **the Americas lane, which A11(b) gives to
  M42b**. Left for that lane; `origin/m42b` does not hold it yet.
- **`Q114051466` death of Jina Mahsa Amini** (46 sitelinks) is the immediate
  cause of `mahsa-amini-protests` and would arrive **main**: it is the cause of
  the protests and so cannot be filed inside them, and no umbrella this atlas
  holds spans Iran in 2022. A6 says the main count must not rise.
- **`Q31187690` proclamation of the Republic of Turkey** (9) is the effect of
  the war of independence and cannot be filed under it — M67's rule 1, that a
  period does not contain the act that created it, reading the same way round.
- **`Q1433190` Iraq disarmament crisis** (7) runs 1991–2003 and the Iraq war
  record begins in 2003, so no parent holds it either.

**`Q12592663` dissolution of the military of the Korean Empire** was refused for
a different reason and it is the cleanest one: **one sitelink and no English
article at all**, so there is nothing to cite under A2's standard.

### Two new review flags, both saying what a record's own fields could not

`no-place-no-coordinate` on `taif-agreement`, and `lane-from-p17` on
`railway-protection-movement` — the second is deviation 1207's own request, that
*"a lane derived from `P17` alone should say so or refuse"*, written as a flag
rather than left in prose. The Railway Protection Movement's country is where it
happened (Sichuan, in Qing China) and not who sent it, which is the case 1207
said the rule gets right.

## Where the run stands after batch 38, for the fire that picks it up

*22–23 September, 23:42Z onward. An import fire, one batch, the Asia half of
batch 37's vein.*

| | |
| --- | --- |
| corpus | **687 active** |
| **main** | **242**, unmoved through five batches |
| filed | 445 |
| largest connected component | **521** |
| components | **131** |
| events with no edge at all | **105** |
| events with no place | **32** |
| the joins vein, Africa, items not held | 24 open rows |
| the joins vein, Asia, items not held | **81 rows, of which 69 are not events**; the four that are, refused above |
| the joins vein, whole corpus, held-to-held with no edge | 41 inside one component, 1 that would merge — **A13's pass, and it has still never run** |
| the `part of` vein, Africa | 139 rows open |
| the sweep pool, world sections | 1,046 open rows |
| per lane, active | Europe 314, **Asia 130**, **Africa 103**, Americas 140 |
| per lane, main | Europe 85, Asia 67, Africa 31, Americas 59 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 23 September is the curation fire and it owes
  A13's relations pass**, which has never run: the 22 September curation section
  predates the amendment. Batches 37 and 38 are two rehearsals of it over one
  vein each, and between them they say what the pass will find — **41
  held-to-held pairs carry a causal property on Wikidata and no edge here**, one
  of which would merge two components, and **the article refuses roughly as many
  as it confirms**. Batch 38 wrote four edges and refused two on exactly that
  test. The pass should budget for the reading and not for the rows.
- **The joins vein is now worked out in both of M42's lanes** and its second
  asking yielded four records against batch 37's five, from 93 rows against 54.
  Asia's rows are mostly abstractions and response-articles; a third asking of
  the same six properties will not pay. **The veins left are the `part of` one
  over Africa (139 rows) and the sweep pool (1,046)**, and batch 36 measured the
  first at +0 on the component.
- **Two umbrellas are still the cheapest unlock and one of them cannot be
  written.** Batch 37 named five African and Middle Eastern joins waiting for a
  period; this batch went looking for Asia's and found that the source has no
  span for it. What a fire can still try is a **Middle Eastern** period with a
  span in its article — the Arab Winter is the obvious candidate and is itself
  one of the five waiting joins — and an African one for the nineteenth century,
  where `scramble-for-africa` begins in 1885 and the French conquest of Algeria
  begins in 1830.
- **The Sudan cluster of seven is still the biggest joinable island** and
  nothing in either lane's vein reaches it.
- **Fifty-two of the 140 event classes carry no category**, unchanged: this
  batch decided none, because `captivity`, `aspect of history` and *political
  movement* are not kinds of event and guessing at them is what the class table
  exists to stop.
- **Africa is 103 against Europe's 314 and Asia is 130**, so A10's order of need
  does not change.

## Curation 2026-09-23

*The second curation fire, 02:06Z, and the first to run **A13's relations
pass**, which the amendment of 22 September added after the first fire had
gone. A11(a): read every active event and fix, from its own cited sources or
its Wikidata item, what is missing; import nothing.*

| | before | after |
| --- | --- | --- |
| corpus | 687 active | **687 active** |
| **main** | 242 | **242, unmoved** |
| filed | 445 | 445 |
| active edges | 675 | **731** |
| largest connected component | 521 | **527** |
| components | 131 | **125** |
| events with no edge at all | 105 | **100** |
| events with no place | 32 | **22** |
| events naming no actor | 334 | **318** |
| events opening on the import's placeholder summary | 87 | **20** |
| validator warnings | 465 | **393** |

**Per lane (A10), unchanged in every cell** because nothing was imported:
active Europe 314, Asia 130, Africa 103, Americas 140; main Europe 85, Asia
67, Africa 31, Americas 59. Africa is still 103 against Europe's 314, so
A10's order of need does not move.

### A13 — the relations pass, and what reading 539 whole articles costs

The pass the owner asked for — *"Why don't I see on the backlog any recurrent
review of all current events and the relationships between them?"* — run for
the first time.

**The method, which is batch 29's and not the cache's.** 539 of the 687
active events carry an English article. The cache under
`tools/import/cache/wikipedia/` holds *leads*: its longest file is 4,947
characters and its median is 415, so a pass reading the cache reads first
paragraphs and calls it the corpus. Every one of the 539 was fetched whole
from the MediaWiki action API at its current revision instead, and matched
against every name of every other active event. That distinction is the whole
yield: it is what found the sentence batch 38 refused this same pair on
(below).

**The matcher had to be fixed before it could be believed.** A plain
substring test made **"World War I" match inside "World War II"** and **"Iraq
War" inside "Iran–Iraq War"**, and a name that is only a day and a month —
the Carnation Revolution's `25 April`, `25 November` — matched every article
that mentioned the date. **45 of the first 312 rows were that bug alone**, and
every one of them would have been a false edge between two real records. A
name now has to stand on its own, with no word character and no joining dash
on either side.

| | |
| --- | --- |
| articles read whole | **539** |
| pairs where a causal cue and another event's name share a sentence | **267** |
| edges written | **56** |
| edges the validator then refused | 6 |
| edges disputed | **0** |
| largest component | 521 → **527** |

**By type:** 48 `precondition-of`, 3 `caused`, 2 `enabled`, 2 `inspired`, 1
`reacted-to`. Every one carries the article, the revision and the section it
was read at as its locator, and quotes the sentence in the explanation, so a
reviewer can go to the paragraph and not to the article.

### The refusals, which are the load-bearing half

**Eight readings refused for touching an umbrella.** Batch 31a's rule —
*"an umbrella is not a claim: this pass wrote no edge on to one"* — refuses an
edge at **either** end of a record carrying an umbrella flag, and seventeen
records carry one. Among the eight it cost: `world-war-i --precondition-of-->
world-war-ii`, argued from the Second World War's own lead (*"The causes of
World War II included unresolved tensions in the aftermath of World War I"*);
`world-war-ii --precondition-of--> decolonisation-of-africa`, argued from the
decolonisation article's own § External causes; and `scramble-for-africa
--precondition-of--> world-war-i`, argued from the Scramble's § Aftermath.
These are the plainest links in the corpus and the rule refuses all three,
because `world-war-ii`, `decolonisation-of-africa`, `scramble-for-africa` and
`indochina-wars` are periods this run made umbrellas of. **What would have to
change is the records and not the edges**, which is what batch 31a said when
it deleted the first of them; this fire records that the cost is now eight
readings and rising, and that it falls hardest on exactly the links that would
join continents.

**Five refused by the arrow of time**, and these are the ones worth keeping:
the article states the link and the records say the cause does not come first.

- `treaty-of-brest-litovsk --precondition-of--> russian-civil-war`. The civil
  war's article says the treaty's signature *"resulted in direct Allied
  intervention in Russia and the arming of military forces opposed to the
  Bolshevik government"* — but the treaty is March 1918 and the war begins
  November 1917. The treaty caused the intervention **inside** the war, which
  is not something an edge between these two records can say.
- `revolutions-of-1989 --enabled--> ethiopian-civil-war`. The 1989 article's
  § Africa makes the withdrawal of Soviet and Cuban assistance what the Derg
  was finally beaten without — the war's **end**, and the war began in 1974.
- `february-revolution --precondition-of--> basmachi-movement`; the movement's
  record begins in 1916 and the revolution in 1917.
- `insurgency-in-kosovo --caused--> kosovo-war` and `operation-sutton
  --caused--> battle-of-san-carlos`, both refused on days: the insurgency's
  record is dated 1998-02-28 against a war dated 1998-02, and Operation Sutton
  — which **is** the San Carlos landing — is dated 1982-05-23 against a battle
  dated 1982-05-21. **Two of the five are record dates that are wrong**, not
  readings that are wrong, and they are the first thing an A7 pass over these
  two should look at.

**Two written as `disputed` and kept as `probable` instead.** The 31 March
Incident into the Armenian genocide, and the Soviet–Afghan war into the
Kashmir conflict — the second refused outright on the arrow of time as well.
Rule 8 wants *who disagrees and why, with the dissenting citations*, and an
article that says *"Some scholars have argued"* or *"India contends"* names no
dissenter to cite. **An attributed claim is not a dispute**: it is a claim
nobody has settled, which is what `probable` is for, and the attribution is
kept word for word in the explanation.

**Everything else the 267 rows offered was one of six kinds**, and none is an
edge: a comparison of magnitude (the Second Congo War *"the deadliest conflict
since World War II"*, COVID's recession *"the largest since the Great
Depression"*); a namesake, which batch 29 named first and which this pass met
five more times — the 1975 Portuguese Constituent Assembly election reached
from the Russian civil war's article, the 1518 Treaty of London reached from
an Italian war, the 1919–1922 Greco-Turkish war reached where the atlas holds
only 1897, the 1951 Treaty of Paris where the article means 1898, and the 1920
Treaty of Rapallo where the atlas holds 1922; a historiographical aside; a
§ Names or § See also line; a person's act rather than an event's; and
chronology with no claim in it, which is most of what *"following the"* turns
out to mark.

### The pair batch 38 refused, written here, and why that is not a reversal

Deviation 1212 recorded that the joins vein offered `second-guangzhou-uprising
--> wuchang-uprising` on `P1542` and that **the article refused it**:
`docs/m42-connections.md` says the uprising's lead *"at revision 1370737006
says only that it was a failed uprising that took place in China"*. That
reading was of the lead, because the lead is what the cache holds. **The
revision is the same one**: what changed is that the whole article was read. The whole
article's § Legacy says: *"Some historians believe that the uprising was a
direct cause of the Wuchang Uprising, which eventually led to the 1911
Revolution and the founding of the Republic of China."* The edge is written,
at `probable`, with *"Some historians believe"* quoted rather than dropped.
**Batch 38 was right about its evidence and this pass has more of it**, and
the difference between them is the endpoint, which is the one thing A13
changed about how an article is read.

### A13's other half: the edges the articles contradict

The amendment also asks that *where an edge exists and the article contradicts
its type or direction, the edge gets `disputed` and a note*. Every one of the
539 articles was scanned for a sentence putting an existing edge's `to` before
its `from` with a causal cue between them. **Two hits, both false, and
`disputed` was written on neither.** The Korean Armistice's lead — *"an
armistice that brought about a cessation of hostilities of the Korean War"* —
and the Russian Civil War's — *"sparked by the overthrowing of the Russian
Provisional Government in the October Revolution"* — both **agree** with the
edge the atlas holds; they were flagged because the later record is named
first in the sentence and the test read word order as direction. So: **the
corpus's 675 existing edges have no article contradicting one, on this
reading**, and the positional test is too blunt to be run again as it stands.

### A9's places, and the ten the item still reaches

32 active events had no place; the first curation fire had left 23 and five
batches added nine. **Ten are placed and 22 are refused**, every refusal for
the same reason as before: neither the item's own `P625` nor `P276`, `P131`
or `P17` leads to anything carrying a coordinate. Five place records are new —
`ap-bac`, `shaba`, `italy-q38`, `italian-peninsula-q145694`,
`cuba-q14905932` — and `colombia-q739` is reused twice.

Two of the ten come from **the item's own `P625`**, which is A12's correction
to A9 and is what puts the Battle of Ap Bac on the map at all. Neither carries
a `wikidata` key: the coordinate is the *event's* item, and a place record
claiming to be the battle would be a worse record than one claiming nothing.
Each says so in its review note.

**Where an item names several locations the pass takes the one the record's
own title names**, and the first only where the title names none. The Italian
War of 1551–1559 lists France, Q234, Italy and Q4918 under `P276`, in that
order; taking the first would have drawn a war called Italian at the centre of
France and called it a reading of the source.

### P710 — the participants, and the 197 the vocabulary has no answer for

334 active events name no actor. **137 carry a category the role vocabulary
has a role for** — `war` is a `belligerent`, `treaty` is a `signatory`, and
there is no role in the 31 for *taking part in a revolution*. Of those 137:

| | |
| --- | --- |
| **written** | **16 events, 32 lines**, one of them partial and saying so |
| the item names no participant | 70 |
| the item's participants the atlas holds none of | 46 |
| withheld to keep a filing right | 5 |

The last row is the 22 September fire's own correction made a rule: where the
half the atlas cannot write is exactly the party that carries an existing
filing, a half-list read as a whole one turns a correct filing into a wrong
one. The pass now checks the parent's actors before it writes and leaves the
event alone rather than writing and withdrawing.

**197 of the 318 still naming no actor are left because their category
determines no role at all.** That is the closed vocabulary answering, not a
gap: `data/roles.json` is a file somebody can argue with, and until somebody
does, an event of a revolution has no role to give its participants.

### Summaries — and the measurement that was wrong before it was right

**The first measurement this fire took of the summaries was wrong, and the
correction is the finding.** A regex over the *words* of the import's
placeholder said no active event still carried one, because 330 records carry
the placeholder **behind** a lead that was written in front of it — which is
the shape the 22 September fire left and is correct. The question is whether a
summary *opens* on the placeholder, and **87 did**.

| | |
| --- | --- |
| **written from the cached lead** | **27** |
| **written from the article's own lead section** | **40** |
| left: the article's lead really is under two sentences | **9** |
| left: no English article at all | **11** |

**The second row is the same lesson A13 learned, arriving twice in one fire.**
The cache under `tools/import/cache/wikipedia/` holds the REST *summary*
endpoint's extract, which is an abbreviation of the lead and not the lead: 49
records were refused on the cache for having a lead under two sentences, and
**40 of those 49 have a lead of two sentences or more in the article itself**.
Reading the endpoint that returns the article instead of the endpoint that
returns a preview is worth 40 summaries here and 56 edges above, and it is the
same change.

Each summary quotes the lead at a named revision, cites `wikipedia-en` at that
revision, carries `summary-from-lead`, and keeps the import's own sentence
behind it — the shape 330 records already have. The `summary-imported` warning
count falls by 67, and the validator's total from 465 at the fire's start to
393: five of the difference are the places and 67 the summaries.

The five summaries that are *short but written* — `cavaco-absolute-majority-1987`,
`fiftieth-anniversary-25-april-2024`, `montenegro-government-2024`,
`santa-maria-hijacking-1961`, `soares-elected-president-1986` — are a
different thing and are left alone: they are the assistant-drafted Portuguese
records, one full sentence each by a person's hand, with no Wikidata item for
a lead to be read from.

### Intervals

**Nothing written, and A7 measured rather than assumed.** No record's cited
article states a wider span than the record carries. What the fire did find is
the opposite problem, and it found it by failing on it: `insurgency-in-kosovo`
is dated 1998-02-28 against a lead that dates it from 1995, and
`operation-sutton` is dated 1982-05-23 for a landing of 21 May 1982. Both were
caught by rule 4 refusing an edge, not by a span check, and both are A7's to
correct from the cited article.

## Where the run stands after the curation fire of 23 September, for the fire that picks it up

*23 September, 02:06Z onward. A curation fire; nothing was imported.*

| | |
| --- | --- |
| corpus | **687 active** |
| **main** | **242**, unmoved through six batches and two curation fires |
| filed | 445 |
| largest connected component | **527** |
| components | **125** |
| events with no edge at all | **100** |
| events with no place | **22**, all refused for want of a coordinate |
| events naming no actor | **318**, of which 197 have no role their category gives |
| active events opening on the import's placeholder | **20**: 11 have no English article and 9 have a lead of one sentence |
| the `part of` vein, Africa | 139 rows open |
| the sweep pool, world sections | 1,046 open rows |
| per lane, active | Europe 314, **Asia 130**, **Africa 103**, Americas 140 |
| per lane, main | Europe 85, Asia 67, Africa 31, Americas 59 |

**What is open, in the order a fire should weigh it:**

- **The next fire is an import fire**, unless it is the first after 02:00Z
  tomorrow. A10's order stands and Africa still trails hardest at 103.
- **The umbrella rule now costs more than it saves, and that is a decision
  for the owner and not for a fire.** Eight readings this pass, three of them
  the plainest links in the corpus, refused because one end is a period. The
  question batch 31a left — *somebody would have to decide the scramble is an
  event and not a period* — is now four records wide (`world-war-ii`,
  `scramble-for-africa`, `decolonisation-of-africa`, `indochina-wars`) and is
  the single cheapest thing that would grow the component.
- **A13's relations pass is now spent on the corpus as it stands.** It read
  every article whole; a second asking over the same 687 events will find the
  same 267 rows. It is worth re-running **after an import**, over the new
  records only, and that is how a batch should carry it from here.
- **Two record dates are wrong and the pass found them by failing on them**:
  `insurgency-in-kosovo` at 1998-02-28 against a lead that dates it from 1995,
  and `operation-sutton` at 1982-05-23 for a landing of 21 May. Both are A7's
  to correct from the cited article, and both unlock an edge that is already
  argued above.
- **100 events still carry no edge at all** and five fewer than yesterday.
  The Sudan cluster gained one — `war-in-darfur --precondition-of-->
  south-sudanese-civil-war`, from the South Sudanese war's own article — which
  is the first thing to reach that island in six batches.
- **The positional contradiction test is not worth re-running as written.**
  Word order is not direction. If A13's second half is to find anything, it
  needs the sentence parsed for which of the two names is the subject of the
  causal verb, and that is a different tool.

## Batch 39 — the joins that were waiting for headroom, and the interval that gave it

*23 September, the fire that picked the run up at 04:11Z, after merging `m0`
into `m42` (M42b's snapshot of 02:53Z had landed there). Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12
is spent; the batches are what stands in front of the run. A10's order of need
is unchanged and **Africa still trails hardest at 103 active against Europe's
353**.*

**The stand after batch 37 named this batch and then mis-stated its price.**
*"Five real joins are waiting for an umbrella — the French conquest of Algeria,
the Arab Winter, the 1970s energy crisis, Opération Turquoise and the closure
of the Suez Canal — because A6 refuses a main event and no period this atlas
holds spans them."* That is the right list and the wrong diagnosis. **A6 is a
count, not a parent**: it says the main count must not rise, and a batch that
files two standing main events under a record they were always part of has
bought itself two main slots with no umbrella written at all. This batch does
exactly that, and spends the two slots on two of the five.

### The interval, which is A7's and fixes a real error

`rwandan-civil-war` carried **1990-10-01 to 1993-08-04**, the day of the
Arusha Accords. The accords did not end the war: they were signed in the
middle of it, the peace collapsed with Habyarimana's aircraft on 6 April 1994,
and the RPF took the country in July. The article the record **already cites**
— *"Rwandan Civil War"*, **revision 1371242033**, the very revision on the
record — opens: *"was fought between the Rwandan Armed Forces ... and the
rebel Rwandan Patriotic Front (RPF) **from 1 October 1990 to 18 July 1994**"*.

**1993-08-04 → 1994-07-18.** No source was added, because the source was
already there and nobody had read it to the end of its first sentence. The
note says what moved from what. This is A7's plainest case: not a judgement
about history, a record disagreeing with the article printed on it.

**Rule 4 was the thing to check before touching it**, on the finding the A7
pass of 22 September left: the edges already on a record are evidence about
which reading the atlas committed to. Both of this record's edges
(`rwandan-civil-war--arusha-accords--caused`,
`rwandan-civil-war--1994-genocide-against-tutsi--precondition-of`) run *out* of
it and start at 1990, so widening the end moves nothing under them. The
validator agrees: 0 errors.

### The two filings the widened interval unlocks, and the headroom they buy

| filed | under | why |
| --- | --- | --- |
| `arusha-accords` | `rwandan-civil-war` | the negotiated pause inside the war. The war's article at revision 1371242033 says the negotiations *"were successfully concluded with the signing of the Arusha Accords in August 1993"*. The same shape as batch 38's `taif-agreement` under `lebanese-civil-war`: a settlement is part of the war it settles |
| `1994-genocide-against-tutsi` | `rwandan-civil-war` | the genocide runs from 6 April to 4 July 1994 and the war now runs to 18 July. Wikipedia's own infobox on the genocide files it the same way |

Neither filing was possible on 22 September, because both fell outside a war
that stopped in 1993. **Main 243 → 241.**

### The three imported, into that headroom, each with the edge it came for

| the record | sitelinks | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- |
| `congo-crisis` | 46 | `decolonisation-of-africa` | `republic-of-the-congo-leopoldville` | it `--enabled-->` `angolan-war-of-independence` |
| `operation-turquoise` | 11 | — (main) | `rwanda-q1037` | it `--reacted-to-->` `1994-genocide-against-tutsi` |
| `closure-of-the-suez-canal-1956-1957` | 4 | — (main) | `suez-canal` | `suez-crisis --caused-->` it |

**Main 241 → 243, which is where the batch found it.** A6 holds exactly, and
it holds without a period being invented to make it hold.

**`congo-crisis` is the one worth reading twice, and it is not one of the
five.** It came out of the umbrella's own article: the lead of *"Decolonisation
of Africa"* at revision 1372152864 names *"the Mau Mau rebellion, the Algerian
War, the **Congo Crisis**, the Angolan War of Independence, the Zanzibar
Revolution, and the events leading to the Nigerian Civil War"* as the major
events of the period, and of those six the atlas held three. The Congo Crisis
is the one of the missing three whose span (1960–1965) falls inside the
umbrella's (mid-1950s–1976), so it arrives **filed** and costs no main slot at
all. Its edge is the atlas's own subject: the crisis article says, under
*"International importance"*, that *"the turmoil of the Congo Crisis
destabilised Central Africa and **helped to ignite the Portuguese Colonial
War**, especially the war of independence in neighbouring Angola"*, and that
the UPA, whose men had lived as exiles in the Congo, *"launched the Baixa de
Cassanje revolt in 1961, igniting the conflict in Angola"*. **"Helped to
ignite" is `enabled` and not `caused`**, which is batch 38's rule about the
weaker type, and the edge is written to `angolan-war-of-independence` and not
to `portuguese-colonial-war-1961-1974`, because the colonial war is an
umbrella and an umbrella is a display fact and not an argument.

**`operation-turquoise` is written `reacted-to` against a Wikidata property
that says `has cause`.** The item states P828 → Q131297, the genocide. The
article agrees on the fact and not on the word: its *"Background"* runs from
the assassination of 6 April *"sparking the Rwandan genocide against the
Tutsi"* through UNAMIR's collapse to the French announcement of a safe zone on
19 June and Resolution 929 on 22 June, and its lead disputes what the operation
was for. An operation mounted in answer to a killing is `reacted-to` in this
atlas's five types; the weaker of the two the sources allow is the one written.

**`closure-of-the-suez-canal-1956-1957` needed no reading at all.** Its
article's first sentence is the edge: *"The closure of the Suez Canal from
November 1956 to April 1957 was caused by the Second Arab–Israeli war, also
known as the Suez Crisis, in 1956."* Wikidata says the same on the item
(P828 → Q49101).

### Two places written (A9), one of them a precision the four do not fit

`republic-of-the-congo-leopoldville` (**Q618399**, `country`) is the crisis's
own `P276` — the item carries no `P625`, so A9's corrected order walks to the
location, and the location is a former country with a point of its own at
Léopoldville. It is **not** the held `zaire` (Q6500954) and not
`democratic-republic-of-the-congo` (Q974): A9 reuses a place record *with that
item*, and neither is that item.

`suez-canal` (**Q899**, `region`) is the harder one. The canal is 193 km of
ground and none of the four precisions is for a line: `point` would draw a
waterway as a pin and `country` would draw it as Egypt. `region` is the least
wrong of the four, and it is coarse, which is what `PRECISIONS` means by an
area rather than a point on the ground. **A fifth precision is not this run's
to add**, and a reviewer should be told that this record is a compromise and
not a reading.

### The class that arrived without a category, again

`Q350604` *civil war / rebellion* was added in M40a from an import report, in
a sandbox with no network, and left without a category; `congo-crisis` is the
first record of the class to arrive here. It is given **`war`**, on batch 37's
own argument: the category's description names a war, a campaign and a battle
without asking who the parties are. `data/imports/wikidata-seeds.json` is
where that lives, because which class becomes what here is data and not code.

| | before | after |
| --- | --- | --- |
| corpus | 749 active | **752 active** |
| **main** | 243 | **243, unchanged** — down two by filing, up two by import |
| filed | 506 | **509** |
| active edges | 738 | **741** |
| largest connected component | 529 | **532** |
| components | 180 | **180** |
| events with no edge at all | 151 | **151** |
| events with no place | — | unchanged; all three arrived placed |
| places written | — | **2** (`republic-of-the-congo-leopoldville`, `suez-canal`) |
| classes given a category | — | **1** (`Q350604`) |
| API calls | — | 2 SPARQL, 3 Wikidata reads (7 items), 5 article reads |

**Per lane (A10).** Active: Europe 353, Asia 130, **Africa 103 → 106**, the
Americas 163. Main: Europe 87, Asia 67, **Africa 31 → 31**, the Americas 58.
Europe and the Americas moved only because `m0` was merged in at the head of
this fire and M42b's snapshot of 02:53Z came with it; this batch touched
neither lane.

**A5's number moved by three**, and for the reason batch 37's did: all three
new records hang off events already inside the largest component
(`angolan-war-of-independence`, `1994-genocide-against-tutsi`, `suez-crisis`).
Nothing merged, because nothing in this vein reaches an island.

### What the vein returned and what it refused

The Africa half of the joins vein was re-asked whole — the six directional
causal properties over the **96** active `africa`-lane events that carry a
Wikidata id, both directions through SPARQL, **30 rows**. Four held-to-held
pairs came back and **all four already carry an edge** in the direction the
source states (`arusha-accords`/`rwandan-civil-war`,
`2011-south-sudanese-independence-referendum`/`comprehensive-peace-agreement`,
`1994-genocide-against-tutsi`/`rwandan-civil-war`, and
`scramble-for-africa`/`world-war-i`, which is an umbrella pair and refused
anyway). **Seventeen items the atlas does not hold**, of which two were taken
and the rest refused for reasons batch 37 already wrote down: five are
international-reaction or consequence articles (*the response is not the
event*), one is an organisation, two are `exile` and `looting` as classes
rather than events, and `Q4574284` the 1970s energy crisis still carries no
place of any kind.

**The same vein asked of the three standing African islands returned three
rows and no join.** The Sudan cluster of seven, the six Boer War battles and
the Liberia–Sierra Leone three were each asked the six properties: the only
rows that came back were an international-response article, an
already-held pair and an empty item. **The islands are not joinable by
Wikidata's causal properties and a later fire should stop asking.** What the
Boer island wants is one edge out of a battle, and what the Sudan island wants
is a record chosen by a person reading the articles — batch 37 said so and it
is still true.

### Two records the umbrella's own article names and this batch could not take

**`Q476855` the Mau Mau rebellion** (41 sitelinks, 1952–1960) and **`Q2444955`
the Rhodesian Bush War** (35, 1964–1979) are both `P361 part of` the
decolonisation of Africa on Wikidata and both are named in the umbrella's lead.
Neither fits inside the umbrella's span — the rebellion opens two years before
it and the bush war closes three years after it — so each would arrive **main**,
and neither carries a causal property to anything held. A7 was asked whether
the umbrella's own article would widen it and the answer is no: *"a series of
political developments in Africa between the mid-1950s to 1976"*, at revision
1372152864, is the span the record already has. **They are the two largest
Africa-lane gaps the atlas knows about by name**, and taking them needs either
an edge read out of their articles or two more filings to pay for them.

### `nigerian-civil-war` is a tombstone whose condition is now half met

The retraction of 15 September calls itself *"the retraction most worth
undoing"* and names what blocks it: Portugal was Biafra's lifeline, the airlift
flew out of São Tomé, *"and it cannot be written because its Portuguese end is
not a record"*. That is still true — the atlas holds no event of Portugal's
Biafra policy and none of the São Tomé airlift — so the tombstone stays. It is
written down here because the same is **not** true of `syrian-civil-war`, whose
retraction of 5 September says *"it would need the Arab Spring, or the refugee
crisis, as a record"* and the Arab Spring **is** a record now. That tombstone's
stated condition is met and a later fire should look at it; it is Asia's lane,
which M42 also owns.

### The check, red on the merge commit and not on this batch

**`tests/graph-browser.test.mjs` → *"a parent keeps its ring at rest and at
every zoom"* failed on the `m0` merge commit of 04:12Z**, one test in 279, on
`assert.ok(parted.ring.stroke < held.ring.stroke)` with *0.7685724975196452
against 0.5831308855537262*. It was read rather than assumed:

- It is a **`?fixtures=1` test**. It draws the synthetic graph of
  `tests/fixtures/data/` and touches no record under `data/`, so no import,
  filing or interval on this branch can reach it.
- **The same commit is green and red on `m0`**: `e0845d53`'s pull-request run
  (1489) passed and its push run (1488) failed. That is the base branch, not
  this one.
- **It passes here, twice, run alone**: all eleven of that suite, 0 failures.

The assertion measures a stroke width after a synthetic wheel event, which is
the shape of a test that can be read before the zoom it is about has settled.
It belongs to lane A's code and not to this run's data, and this fire did not
touch it. **Deviation 1222.**

**A second failure was this batch's and is fixed** (deviation 1223).
`tests/graph-halo-browser.test.mjs` → *"a label over a line and a label over a
mark both keep paper between the letters and it"* passes at the merge commit
and fails at this batch's head, here and on the runner both. Its mark case took
a label box **strictly overlapping** a `circle.node`, and a name is written
*beside* the mark it names with a leader back to it (M77), so a label is only
ever over some other event's mark — a coincidence of how the barycentre pass
packed the century. Three records took the twentieth century's world view from
three such labels to none, at **1.59 px** between the nearest pair, which is
not the question going away but the halo being the only thing between the
letters and the mark. The candidate is now read to the four pixels the
measurement's own clip already reaches, and every assertion under it is
unchanged. Zooming in was tried first and is not the answer: at k = 3 the
picture names five things and at k = 8 two, and the nearest label and mark are
7 px apart.

**A third failure is the runner's.** `tests/map-browser.test.mjs` → *"where an
event and a city want the same box, the event has it"* is about Lisbon at zoom
8 and passes here, in the same tree, in the suite the runner failed it in.

The pure suites — 151 files, **1,789 tests, 0
failures, 0 skipped** — were run whole after the index rebuild and are green,
and **the check is green on the head** (`7c254d73`, run 1499).

## Where the run stands after batch 39, for the fire that picks it up

*23 September, 04:11Z onward. An import fire, one batch, and `m0` merged in at
its head — M42b's snapshot of 02:53Z landed there, which is why Europe and the
Americas moved without this branch touching them.*

| | |
| --- | --- |
| corpus | **752 active** |
| **main** | **243**, unmoved through seven batches and two curation fires |
| filed | 509 |
| largest connected component | **532** |
| components | **180** |
| events with no edge at all | **151** |
| events with no place | **48** over the merged corpus |
| events naming no actor | **383** over the merged corpus |
| active events opening on the import's placeholder | **21** |
| the Africa joins vein, items not held | **15 open rows**, all refused above |
| the `part of` vein, Africa | 139 rows open |
| the sweep pool, world sections | 1,046 open rows |
| per lane, active | Europe 353, **Asia 130**, **Africa 106**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's own note from
  the fire of 02:06Z stands: re-run the relations pass **over the new records
  only**, because reading the same 687 articles again returns the same 267
  rows. Batch 39's three are the new records on this branch; M42b's are on
  theirs.
- **A6 is a count and not a parent, and that is the finding of this batch.**
  Batch 37 read *"each would arrive main, and A6 says the main count must not
  rise"* as *"each is waiting for the umbrella that would hold it"*. It is not.
  A batch that files two standing main events under something they were always
  part of buys two slots, and a filing that corrects a record is cheaper and
  more honest than a period invented to hold one. **Three of the five joins
  batch 37 refused are still open** — the French conquest of Algeria, the Arab
  Winter, the 1970s energy crisis — and two of them want main slots and not
  umbrellas. The third wants a place: `Q4574284` carries no `P625`, no `P276`,
  no `P131` and no `P17`.
- **Where the next slots are.** The same question asked of the corpus: which
  standing main events are part of a record the atlas already holds and are
  dated inside it? This batch found two by widening one interval. A pass over
  all 243 main events against every held parent, with A7 applied where the
  article and the record disagree, is the cheapest volume of headroom in the
  run and nobody has taken it.
- **The two largest named Africa gaps are `Q476855` the Mau Mau rebellion and
  `Q2444955` the Rhodesian Bush War.** Both are named in the decolonisation
  umbrella's own lead, neither fits its span, neither carries a causal property
  to anything held. Taking them needs an edge read out of their articles — the
  Bush War's is the one to read, because ZANLA's bases after 1975 are
  Mozambique's and Mozambique is Portugal's — and two main slots.
- **`syrian-civil-war`'s tombstone states a condition that is now met.** The
  retraction of 5 September says *"it would need the Arab Spring, or the refugee
  crisis, as a record"*; `arab-spring` has been a record since the A6 filing
  pass. It is 116 sitelinks, it is Asia's lane, which M42 owns, and it is the
  largest single record the atlas has decided twice about. A fire that takes it
  should say which of the two conditions it is answering and give it the edges
  the retraction says it was missing.
- **The three African islands are not joinable by Wikidata's causal
  properties**, and this batch asked them directly rather than inferring it.
  The Sudan seven, the Boer six and the Liberia–Sierra Leone three returned
  three rows between them and no join. A later fire should read articles or
  leave them; asking the properties again is spent.
- **Africa is 106 against Europe's 353** and A10's order does not change.

## Batch 40 — the corpus pass re-run with A7 in hand, and the Africa lane it paid for

*23 September, the fire that picked the run up at 06:41Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent; the batches are what stands in front of the run. A10's order is
unchanged and **Africa still trails hardest, 106 active against Europe's 353**.*

### First, the pass the previous stand named — and it is spent, with one row left in it

The stand after batch 39 asked for *"a pass over all 243 main events against
every held parent, with A7 applied where the article and the record disagree"*
and called it *"the cheapest volume of headroom in the run"*, adding that
**nobody has taken it**. That last clause is wrong and this batch is the
measurement that says so: **batch 32 took it** — 207 main events, one SPARQL
query, sixteen answers naming a record here and *"none of the sixteen is a new
filing"*. Re-run this morning over all 200 main events that carry an item, the
answer is the same shape: **thirteen rows, twelve of them refusals already on
the record.**

| row | refused on | where it was settled |
| --- | --- | --- |
| `2011-bahraini-uprising` → `arab-spring` | span **and** lane | batch 26; the uprising's own article dates it "from 2011 until 2014" |
| `2011-yemeni-revolution` → `arab-spring` | lane (asia under an africa period) | batch 26, by `tests/m42-filing.test.mjs` |
| `lebanese-civil-war` → `arab-israeli-conflict` | depth — it holds four children | batch 26 |
| `second-italo-ethiopian-war` → `interwar-period` | lane | batch 26 |
| `soviet-japanese-border-conflicts` → `interwar-period` | five days, and the lane | batch 26 |
| `basmachi-movement` → `world-war-i`, `russian-civil-war` | span, both ways | 1916–1934 fits neither |
| `berlin-conference` → `scramble-for-africa` | lane, and then span | europe under an africa umbrella that names no actor |
| `cretan-revolt-of-1897-1898` → `greco-turkish-war-of-1897` | span | the revolt outlasts the war by seventeen months |
| `eritrean-war-of-independence` → `ethiopian-civil-war` | span | 1961 against a parent that opens in 1974 |
| `rif-war` → `interwar-period` | span, and the lane | 1911 against a period that opens in 1918 |
| `second-sino-japanese-war` → `world-war-ii` | span | 1937-07-07 against 1939-09-01, which is the whole point of the row |
| `yugoslav-wars` → `breakup-of-yugoslavia` | span | the parent here is two days in April 1992 |

**A7 unlocks none of them, and the reason is worth writing down.** A7 widens an
interval *from the record's own cited article*; every span refusal above needs
the **parent** widened, and in each case the parent's own cited article either
states the span it already carries (`world-war-ii`, "1 September 1939 – 2
September 1945") or states a *narrower* one. `interwar-period` is the sharpest:
its record ends **1939-09-11** and the article on it, at the revision the
record cites, says the period "lasted from 11 November 1918 to **1 September
1939**". That is a record disagreeing with the article printed on it, exactly
as batch 39's `rwandan-civil-war` did — but in the direction A7 does not
authorise, because correcting it would *narrow* the span and could put a child
outside a parent it is filed under today. **It is left as it stands and named
here** so that the fire which is given a narrowing rule knows where the first
case is.

**The one row that is not a refusal came from the other direction.** Asked
backwards — not *what is each main event part of?* but *which parts do the
held records claim?*, `P527` over all 619 held items — the answer is five rows,
four of them the same refusals, and one new:

| filed | under | why |
| --- | --- | --- |
| `yom-kippur-war` | `arab-israeli-conflict` | 1973-10-06 to 1973-10-26, inside a conflict this atlas opens in 1948 and does not close; its actors are `israel`, `egypt` and `syria`, which is the conflict's own subject; the parent already holds twelve children, `1948-arab-israeli-war`, `six-day-war` and `black-september` among them, and it holds no parent of its own, so the filing is one deep. `P527` on `Q8669` names it and nothing here had read that list |

**Main 243 → 242, and that is the batch's whole budget.**

### The five imported, into that one slot and under the parents they came with

| the record | sitelinks | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- |
| `rhodesian-bush-war` | 35 | — (main) | `rhodesia-q217169` | **none**, and §*What earned no edge* below is why |
| `2010-2012-algerian-protests` | 28 | `arab-spring` | `algeria-q262` | `tunisian-revolution --inspired-->` it |
| `united-nations-operation-in-somalia-ii` | 18 | `somali-civil-war` | `somalia-q1045` | it `--precondition-of-->` `battle-of-mogadishu-1993` |
| `unified-task-force` | 17 | `somali-civil-war` | `somalia-q1045` | it `--precondition-of-->` `united-nations-operation-in-somalia-ii` |
| `ituri-conflict` | 15 | `second-congo-war` | `ituri-province-q24909562` | `second-congo-war --enabled-->` it |

**Main 242 → 243, which is where the batch found it.** A6 holds exactly, and
four of the five arrive filed, so the one slot bought by `yom-kippur-war` paid
for the one record that could not.

**`2010-2012-algerian-protests` is the filing to read twice**, because it is
the row batch 26 was refused on and this one is not. That batch tried
`2011-yemeni-revolution` and `2011-bahraini-uprising` under `arab-spring` and
`tests/m42-filing.test.mjs` threw both out on the lane: Yemen and Bahrain are
**asia** and `arab-spring` is an **africa**-lane period that names no actor, so
the subject half of M62's rule has nothing to pass on. Algeria is africa. The
span is the other half and it is exact: 2010-12-28 to 2012-01-10, inside
2010-12-17 to 2012-12. The filing is the umbrella's own lane and the
umbrella's own dates, and nothing had to be argued around.

**The two Somalia records are one chain and were imported as one.** UNOSOM II's
article, at revision 1373633997, is the source for both edges: *"UNOSOM II
carried on from the transitory United States-controlled (UN-sanctioned)
Unified Task Force (UNITAF)"*, the Secretary-General *"noted that despite the
size of the UNITAF mission, a secure environment was not yet established"* and
concluded that its successor *"should be endowed with enforcement powers under
Chapter VII"*, and *"UNOSOM II would therefore seek to complete the task begun
by UNITAF"*. **That is `precondition-of` and not `caused`**: the second mission
was constituted out of what the first had and had not done. The same article
gives the second edge — *"three months into the conflict, the US military
implemented Operation Gothic Serpent to assist UNOSOM II against the SNA with
special forces"*, and *"soon after, the infamous Battle of Mogadishu took
place"* — so the battle this atlas already held gains the mission it was fought
for. `battle-of-mogadishu-1993` was filed under `somali-civil-war` and had one
edge; it now sits on a three-record chain.

**`ituri-conflict` is `enabled` and the article is explicit about the
mechanism.** Its lead: the conflict *"was largely set off by the Second Congo
War, which had led to increased ethnic consciousness, a large supply of small
arms, and the formation of various armed groups"*. Arms, groups and hardened
identities are conditions and not an act, and the same lead says the Hema and
the Lendu had fought *"since as early as 1972"* — so the war did not start the
fighting, it made the 1999–2003 phase possible. The weaker of the two types the
source allows is the one written, which is batch 38's rule and batch 39's.

### What earned no edge, and the rule that refused it

**`rhodesian-bush-war` arrives isolated, and it is rule 4 that did it.** The
stand named this record and named its edge: *"ZANLA's bases after 1975 are
Mozambique's and Mozambique is Portugal's"*. The article, at revision
1373754851, says exactly that and better — *"during Portuguese rule of
Mozambique, until 1974–1975, Rhodesia was able to defend its border with Zambia
relatively easily and prevent many guerrilla incursions"*; *"in April 1974, the
left-wing Carnation Revolution in Portugal heralded the coming end of colonial
rule in Mozambique"*; *"the end of Portuguese rule in Mozambique created new
military and political pressures on the Rhodesian Government to accept the
principle of immediate majority rule"*. The edge
`carnation-revolution-1974 --enabled--> rhodesian-bush-war` was written on
those three sentences and **the validator refused it**: *"arrow of time:
`carnation-revolution-1974` cannot start after `rhodesian-bush-war`"*. The war
opened in **July 1964** and the revolution is April 1974, so what the article
describes is not an edge into the war at all — it is an edge into a later part
of the war that this atlas does not hold as a record. The edge was deleted
rather than argued with, and this is the second time rule 4 has been the check
on a reading rather than on a typo (batch 39 checked it before widening an
interval; here it refused a finished edge).

**The edge the Bush War can take is one import away and the sentence is
already read.** The same article, under *"Legacy"*: *"beyond Zimbabwe's
borders, as a result of Rhodesian aid and support for RENAMO, the Rhodesian
Bush War also helped influence the outbreak of the Mozambican Civil War, which
lasted from 1977 until 1992 and claimed a million lives."* That runs **out** of
the war and forward in time, so rule 4 has nothing to say about it. The record
it needs is **`Q657661`**, 34 sitelinks, 1977-05-30 to 1992-10-04, whose `P361`
is `Q8683` the Cold War — **which this atlas does not hold**, so it would
arrive main and cost a slot this batch did not have. A fire with a spare slot
should take it; it is the cheapest edge in the Africa lane and it lands on
Portugal's own subject at both ends.

### The places (A9), the lane named by hand, and the actors A12 (4) asked for

Three place records were written, each from the first item in A9's corrected
order that carries `P625`:

| place | item | precision | from |
| --- | --- | --- | --- |
| `algeria-q262` | `Q262` | `country` | the protests' own `P276`, which is the country |
| `ituri-province-q24909562` | `Q24909562` | `region` | the conflict's `P276`; a province is larger than a city and is not a state |
| `rhodesia-q217169` | `Q217169` | `country` | the war's `P276`; an unrecognised state is still a state, and it is Rhodesia and not Zimbabwe because A9 reuses or writes the record **for that item** |

**`Q2444955` was refused by the import before it was created**, with *"no place
record for its location, no lane reachable from its point, and no lane named
for it in the seeds file"*, although `Q217169` carries a coordinate: the
import only writes a place for a location item that is itself in the batch and
classifies as a place, and `Q99541706` (unrecognised state) is in no class
table. The lane `africa` was named for the item in
`data/imports/wikidata-seeds.json`, which is deviation 1029's one-line route,
the import was re-run, and the place was then written here and the override
dropped — so the record takes its lane from Rhodesia's own point and not from
the seeds file. **The seeds entry is left in place**: it is true, and it is what
a re-run would need.

`rhodesian-bush-war` then took **two actor lines from its item's own `P710`**,
which is A12 (4) asked of a batch rather than of the curation fire:
`south-africa` and `frelimo`, both held, both `supporter`, each with the
article's own phrase as the note — *"had the private support of neighbouring
South Africa"*, and ZANLA *"had strong links with Mozambique's independence
movement, FRELIMO"*. Seven of the item's nine participants are not held and
were left. **This is the first M42 batch to move `docs/m53-polities.md` §4.1's
numerator by an import**, 368 → 369, and that file is re-taken with it.

### The batch, measured

| | before | after |
| --- | --- | --- |
| corpus | 752 active | **757 active** |
| **main** | **243** | **243** |
| filed | 509 | 514 |
| active edges | 741 | 745 |
| **largest connected component** | **532** | **536** |
| components | 180 | 181 |
| events with no edge at all | 151 | 152 |
| events with no place | 48 | 48 |
| events naming no actor | 383 | 387 |
| per lane, active | Europe 353, Asia 130, **Africa 106**, Americas 163 | Europe 353, Asia 130, **Africa 111**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | Europe 87, Asia 67, Africa 31, Americas 58 |
| API calls | — | 6 SPARQL for the inverse scan, 6 wbgetentities for the two corpus passes and the items, 4 article reads, 13 for the two import runs |

**Every one of the five landed in Africa**, which is A10's order kept exactly,
and the component grew by four against a corpus that grew by five — the one
that did not join is the Bush War, for the reason above.

### The one class-table row this batch did not fix

`Q273120`, the class `2010-2012-algerian-protests` arrives under, is in the
table as *"civil war / rebellion"* with **no category**, and its own note says
the label is *"what the candidate list called those items, not the class's own
label read from Wikidata: this sandbox has no network to read it with"*. The
item's real label is **protest**, and the record therefore arrives with no
category at all. Neither was corrected here: `data/categories.json` has no
category a protest that seizes nothing belongs to — `revolution` is *"a seizure
or a loss of power outside the ordinary rules"* — and adding a thirteenth
category is an edit somebody should argue with and not a batch's side effect.
**The label is wrong, the network to correct it now exists, and a fire that
touches the class table should take both at once.**

## Where the run stands after batch 40, for the fire that picks it up

*23 September, 06:41Z onward. An import fire, one batch, no merge needed —
`origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **757 active** |
| **main** | **243**, unmoved through eight batches and two curation fires |
| filed | 514 |
| largest connected component | **536** |
| components | **181** |
| events with no edge at all | **152** |
| events with no place | **48** |
| events naming no actor | **387** |
| the inverse `part of` vein, clean on depth, span and lane | **1,408 rows**, 326 of them under an Africa-lane parent |
| the `part of` vein, Africa | 139 rows open |
| the sweep pool, world sections | 1,046 open rows |
| per lane, active | Europe 353, **Asia 130**, **Africa 111**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's standing note
  holds: run the relations pass **over the new records only**, because reading
  the same articles again returns the same rows. This batch's five and
  M42b's are the new ones.
- **The corpus `part of` pass is spent in both directions and this batch is the
  proof.** `P361` over the 200 main events with items: thirteen rows, twelve
  refusals already on the record. `P527` over all 619 held items: five rows,
  four of them the same refusals and one filing, now taken. **A fire should not
  run either query again**; the headroom is not there, and the table above says
  where each row died so that nobody has to re-derive it.
- **The headroom question has one live answer left and it is A7 pointing the
  other way.** Every span refusal in this batch needs a *parent* widened, and
  A7 only widens from the parent's own cited article. `interwar-period` is the
  case where the article and the record plainly disagree — the record ends
  1939-09-11, the article says 1 September 1939 — and it disagrees in the
  direction that would **narrow** the record. A rule for that is the owner's to
  write; until then no main event can be filed out of the way by an interval.
- **The inverse vein is 1,408 rows clean on depth, span and lane, 326 of them
  under an Africa-lane parent, and that is where the volume is.** It costs no
  main slot at all: every row arrives filed. Ranked by sitelinks the Africa
  head is `Q472238` (taken), `Q555833` the Jordanian protests and `Q14746872`
  the Syrian revolution — both refused on the same lane rule that refused
  Yemen and Bahrain, both asia under an africa period — then `Q152060` the
  Cabinda Conflict under `angolan-civil-war`, `Q3320778` the 1890 British
  Ultimatum, `Q1149627` the Djiboutian protests, `Q133919` (taken), `Q709660`
  the Hoare–Laval Pact, and a long tail of `yom-kippur-war`,
  `second-italo-ethiopian-war` and `mali-war` parts.
- **`Q152060` the Cabinda Conflict is the next one to read and it needs care.**
  It is Angola, which is Portugal's subject, and `angolan-civil-war` is a held
  top-level record; but the item gives `P580` 1975 and **no `P582`**, and the
  conflict is ongoing while the parent closes in 2002. A12 (3) says a missing
  `P582` is the flag `end-unstated` and **never** ongoing, so the record would
  file on a span the article contradicts. Read the article first.
- **`Q3320778` the 1890 British Ultimatum is the row this atlas most wants and
  cannot file.** It is Britain's ultimatum to Portugal over the Pink Map, its
  `P361` is `scramble-for-africa`, and it is dated 11 January 1890, inside that
  umbrella. It fails on the lane: the item carries no coordinate and no
  location, only `P17` `Q8680` and `Q45670` — the United Kingdom and the
  Kingdom of Portugal — so its lane is **europe** and `scramble-for-africa` is
  an africa period that names no actor. It can be imported main at the cost of
  a slot, or filed the day that umbrella names the seven powers its own article
  names.
- **`Q203824` the Italo-Turkish War is the largest unheld Africa row at 62
  sitelinks and it fails the same way.** Its `P276` is `Q1529261`, Ottoman
  Tripolitania, which carries no coordinate, so A9 walks past it to the Ottoman
  Empire and the lane is not africa. Its edge is read and waiting: the article,
  at revision 1370624672, says *"members of the Balkan League, seeing how
  easily Italy defeated the Ottomans and motivated by incipient Balkan
  nationalism, attacked the Ottoman Empire in October 1912, starting the First
  Balkan War a few days before the end of the Italo-Turkish War"* — which is
  `italo-turkish-war --enabled--> first-balkan-war`, an Africa record reaching
  into Europe's chain, and `first-balkan-war` is held and is no umbrella.
- **`Q476855` the Mau Mau rebellion is still open and still costs a slot.**
  1952–1960 against a decolonisation umbrella that opens in the mid-1950s; the
  umbrella's article states that span in so many words, so A7 cannot widen it.
- **`syrian-civil-war`'s tombstone** stands where batch 39 left it, and so does
  the note about the three African islands: asking Wikidata's causal properties
  of them again is spent.
- **Africa is 111 against Europe's 353** and A10's order does not change.

## Batch 41 — the two wars of independence the atlas was missing, and the parent that ends before its parts

*23 September, the fire that picked the run up at 08:38Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent; the batches are what stands in front of the run. A10's order is
unchanged and **Africa still trails hardest, 111 active against Europe's 353**,
so the lane is Africa and the vein is the inverse `part of` one the stand after
batch 40 named — 1,408 rows clean on depth, span and lane, 326 of them under an
Africa-lane parent, every one of which arrives **filed** and costs no main slot.

### The five imported, all filed, and the two Portugal should have had first

| the record | sitelinks | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- |
| `mozambican-war-of-independence` | 36 | `decolonisation-of-africa` | `portuguese-mozambique-q889394` | it `--caused-->` `carnation-revolution-1974` |
| `guinea-bissau-war-of-independence` | 30 | `decolonisation-of-africa` | `guinea-bissau-q1007` | it `--caused-->` `carnation-revolution-1974` |
| `herero-and-nama-genocide` | 40 | `herero-wars` | `german-south-west-africa` | `herero-wars --caused-->` it |
| `siege-of-jadotville` | 19 | `congo-crisis` | `jadotville-q18780` | **none**, and §*What earned no edge* is why |
| `simba-rebellion` | 17 | `congo-crisis` | `democratic-republic-of-the-congo` | it `--enabled-->` `first-congo-war` |

**Main 243 → 243, and nothing had to be filed to pay for it.** That is the
whole argument for this vein: five records, four edges, no slot spent.

**The two wars of independence are the batch's point and the atlas should have
been embarrassed to be without them.** It held the Angolan War of Independence,
it held the days the Mozambican and Guinean wars opened
(`mozambique-war-begins-1964`, `guinea-war-begins-1963`), it held the
declaration of 1973 and the assassination of Cabral — and it did not hold
either of the two wars those days are days of. Both are Portugal's own subject,
which is what this atlas is about, and both were sitting in the vein at 36 and
30 sitelinks.

### The parent that ends before its parts, which is a new shape of refusal

Both wars carry `P361` = **Q609836, the Portuguese Colonial War**, and this
atlas holds that record. Neither is filed under it. The reason is one date:

| | |
| --- | --- |
| `portuguese-colonial-war-1961-1974` | 1961-02-04 → **1974-04-25** |
| `mozambican-war-of-independence` | 1964-09-25 → **1974-09-08** |
| `guinea-bissau-war-of-independence` | 1963-01-23 → **1974-09-10** |

The atlas closes the colonial war on the day of the Carnation Revolution, and
both wars ran past it — to the Lusaka ceasefire in September 1974 and to the
grant of independence in the same month. A child dated outside its parent is
the `child-outside-parent` warning, and **A7 cannot widen the parent**: the
article printed on that record dates the war 1961 to 1974 and ends it at the
revolution, so widening it would be this run writing a date no source gives.

**This is not batch 40's refusal and it is worth naming as its own shape.**
Batch 40's twelve span refusals were all *children too early or too long for a
period*; this is a **parent that ends before its own parts do**, because the
record is of the war Portugal fought and the wars are of the independences
Portugal's colonies won, and those outlast the regime by a summer. The filing
that does hold is A6's: `decolonisation-of-africa` (mid-1950s → 1976), inside
whose span and inside whose africa lane both wars sit exactly. Both are filed
there and both say so in their own `review.note`. The colonial war is where
they belong the day somebody gives the run a rule for a parent shorter than its
parts — the third such rule the run has asked the owner for, beside the
narrowing rule batch 40 asked for on `interwar-period`.

### What earned no edge, and the rule that refused it

**`siege-of-jadotville` arrives isolated and the refusal is a small one.** The
only sentence in its article joining it to anything this atlas holds is its
first — *"a major battle during the Congo Crisis"* — which is what `parent`
already says and is not an argument. The one other held record it names is
`algerian-war`, and it names it only to say that the mercenaries who beat back
the relief column were *"almost all veterans of the Algerian War"*. That is a
fact about who the men were and not a claim that one war caused the other, and
an edge written on a parenthesis would be the run reading a source it is meant
to be quoting. It is filed and left isolated.

**`maji-maji-rebellion` was written, validated, and deleted, and the reason is
a rule the next fire needs.** Q705553 came out of the vein at 29 sitelinks under
`scramble-for-africa`, with a span (1905-07 → 1907-08) inside that umbrella and
a lane that is africa. It was written. **Rule 21 refused it**: the atlas already
holds Q705553, as `majimaji-war`, **retracted** in M44b class A — *"the
neighbour is missing… the atlas holds no record of Portuguese Mozambique before
1960… so there is nothing here for it to touch"*. The vein query filtered its
rows against the **active** corpus, and a retracted record still owns its item.

> **For the fire that picks this up: filter the vein against every event, not
> the active ones.** `git grep -l '"Q705553"' data/events` is the check, and it
> is cheaper than writing a record the validator throws out.

Reinstating it was considered and refused on M44b's own terms: the retraction
says the record had nothing to touch, and this batch found it nothing to touch
either. The one sentence in its article naming a held record is *"the Abushiri
revolt of 1888–1889 and the Wahehe Rebellion of 1891–1898 are viewed by
historians as precursors of the Maji Maji uprising"*, and `abushiri-revolt` is
here — but **a precursor is a periodisation and not a mechanism**, and all five
of this atlas's edge types assert a mechanism. `inspired` would say the rebels
followed an example the article never says they followed. No edge, so no
reinstatement.

### The places (A9), and the one where both steps agree

Three place records are new. Two come from A9's second step, `P276`, because
neither war's item carries a coordinate: `portuguese-mozambique-q889394`, whose
point is Lourenço Marques because a colony has no centre of its own to give,
and `guinea-bissau-q1007`. The third is the one worth reading:
**`jadotville-q18780` is the first place in the run where A9's first step and
its second give the same answer.** Q2404547 carries its own `P625` at
-10.983333, 26.733333 and its `P276` is Q18780, Likasi, **whose own `P625` is
that same pair to six decimal places**. Batch 39's rule for a `P625` place —
no `wikidata` key, because the coordinate is the event's and a place record
claiming to be the battle would be the worse record — does not apply when the
point demonstrably belongs to a town the source names. It is filed under the
town's item, labelled with the name the town had in 1961 and carrying both
names.

`german-south-west-africa` and `democratic-republic-of-the-congo` are reused.

### The categories the class table has no answer for

`herero-and-nama-genocide` and `simba-rebellion` arrive **without a category**,
and that is a reading of `data/imports/wikidata-seeds.json` rather than an
oversight. Q41397, genocide, and Q124734, *"rebellion / civil war"*, both carry
`kind: event` and no `category` in the class table. The two genocides this
atlas already holds, `the-holocaust` and `armenian-genocide`, carry none
either, so the gap is the corpus's. And Q124734's own label is the argument for
leaving it alone: a rebellion is `revolution` and a civil war is `war`, the
table declines to choose, and **choosing is an edit to that file somebody can
argue with** — CLAUDE.md's own rule — and not a guess to be made inside a
record. The three that do carry one take it from the table: Q1006311, war of
national liberation, and Q188055, siege, both give `war`.

### A7, once

`simba-rebellion` is written **1963–1965** and the item says 1964. `P580` is
January 1964, `P582` is November 1964, and a `P585` of November 1965
contradicts both; the cited article's first sentence, at revision 1375684063,
says the rebellion *"took place in the Democratic Republic of the Congo
between 1963 and 1965"*. A7 widens from the record's own cited article at a
named revision, and that is what is written. The three months are dropped
rather than moved, as batch 39's widenings dropped theirs: the article gives
years. The widened span is still inside `congo-crisis` (1960–1965).

### The edges, and the type each article allows

`mozambican-war-of-independence --caused--> carnation-revolution-1974`, at
revision 1374663244: *"the military coup in Portugal was in part fueled by
protests concerning the conduct of Portuguese troops in their treatment of some
of the indigenous Mozambican populace"*, and *"the pressure of the
international community in relation to the Portuguese Colonial War"* was among
*"the primary causes of the outcome"*.

`guinea-bissau-war-of-independence --caused--> carnation-revolution-1974`, at
revision 1372113350, which says it outright: *"the war in Guinea-Bissau has
been viewed as a factor which contributed to the coup and revolution: its
status as 'the most intense, destructive, and materially pointless' of the
three Portuguese wars in Africa rendered it an embarrassment"*. Both are
`caused` and not `precondition-of`, because contributing to a coup is
contributing to a cause; and `caused` is the type this atlas already carries
from `angola-war-begins-1961` and `guinea-war-begins-1963` on to the same
revolution, so the three wars now say one thing about 25 April in one voice.

`herero-wars --caused--> herero-and-nama-genocide`, at revision 1373679661,
which runs the sequence without a gap from Maharero's uprising through
Waterberg to von Trotha's order. **The edge is written from the war and not
from `battle-of-waterberg`, which the article names as the turn, because rule 4
refuses that one**: the battle is 11 August 1904 and the genocide opens in 1904
at the year's start, so the arrow of time will not take it. That is the third
time in three batches that rule 4 has been the check on a *reading* rather than
on a typo.

`simba-rebellion --enabled--> first-congo-war`, at revision 1375684063:
*"the local ethnic rivalries would have a major impact on the First and Second
Congo War"*, after *"the Banyamulenge exploit[ed] their victory over the rebels
by expanding their holdings in South Kivu"*; and *"some of the Simba holdouts
continued to be active until the First Congo War in 1996/97"*, with
*"ex-Simbas play[ing] a major role in Kabila's government"*. Rivalries,
holdings and surviving fighters are what a later war was fought with, not an
act that started it, so `enabled` and not `caused` — batch 38's rule and batch
40's.

### The counts

| | before | after |
| --- | --- | --- |
| active | 757 | **762** |
| **main** | **243** | **243** |
| filed | 514 | 519 |
| active edges | 745 | **749** |
| largest connected component | 536 | **539** |
| components | 181 | 182 |
| events with no edge | 152 | 152 |
| Africa, active | 111 | **116** |

`components` rises by one and `noEdge` does not move, which is the batch read
in one line: `siege-of-jadotville` arrives isolated and `herero-wars`, isolated
until this morning, stops being.

## Where the run stands after batch 41, for the fire that picks it up

*23 September, 08:38Z onward. An import fire, one batch, no merge needed —
`origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **762 active** |
| **main** | **243**, unmoved through nine batches and two curation fires |
| filed | 519 |
| largest connected component | **539** |
| components | **182** |
| events with no edge at all | **152** |
| events with no place | **48** |
| events naming no actor | **392** |
| the `part of` vein, Africa, not held | **679 rows** over 104 Africa-lane parents |
| per lane, active | Europe 353, **Asia 130**, **Africa 116**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's standing note
  holds: run the relations pass **over the new records only**, because reading
  the same articles again returns the same rows. This batch's five and M42b's
  are the new ones.
- **Filter the vein against every event and not the active ones.** This batch
  wrote `maji-maji-rebellion` and deleted it again because Q705553 is held by
  a record M44b retracted, and rule 21 does not care about status. The inverse
  vein returned 738 rows over the 104 Africa-lane parents this morning and 679
  of them are unheld *by an active record*; the true figure is lower and
  nobody has measured it.
- **`Q657661`, the Mozambican Civil War, is still the cheapest edge in the
  Africa lane and still costs a slot.** Batch 40 read its edge already — the
  Rhodesian Bush War's own article, at revision 1373754851, under "Legacy":
  *"as a result of Rhodesian aid and support for RENAMO, the Rhodesian Bush War
  also helped influence the outbreak of the Mozambican Civil War"* — and it
  runs out of the war and forward in time, so rule 4 has nothing to say about
  it. Its `P361` is Q8683, the Cold War, which this atlas does not hold, and
  `decolonisation-of-africa` closes in 1976 against a war that opens in 1977,
  so it arrives **main**. **No slot is in hand**: the corpus `part of` pass is
  spent in both directions (batch 40's proof), and this batch bought none.
- **`1977-mozambican-general-election` is the slot to look at, and it wants an
  argument this run has not got.** It is the only Africa-lane main event dated
  inside the Mozambican Civil War's span, and filing an election under a civil
  war is a claim about what the election was, not a date check. A fire that
  reads both articles may find it; nothing here has.
- **The rules the run has now asked the owner for, twice each, are two.**
  Batch 40 asked for a rule for a record whose article would **narrow** it
  (`interwar-period`, which the atlas ends 1939-09-11 and its own article ends
  1 September 1939). This batch asks for a rule for a **parent that ends before
  its parts** (`portuguese-colonial-war-1961-1974` against the Mozambican and
  Guinea-Bissau wars of independence). Both are span questions A7 refuses in
  the direction they point, and both would free filings.
- **`Q210714`, the 2011 military intervention in Libya, is the largest unheld
  Africa row at 43 sitelinks and it fails by eight days.** Its `P361` is
  `libyan-civil-war`, which this atlas closes on 2011-10-23; the intervention
  runs to 2011-10-31. Same shape as the two wars above and no umbrella of the
  right span to catch it — `arab-spring` ends in 2012 and would hold it, and
  the item does not name it.
- **`Q152060` the Cabinda Conflict is still open and still needs its article
  read**, for the reason the stand after batch 40 gives: `P580` 1975, no
  `P582`, a parent that closes in 2002, and A12 (3) forbidding "ongoing".
- **`Q3320778` the 1890 British Ultimatum** is unchanged: the row this atlas
  most wants, refused on the lane.
- **Africa is 116 against Europe's 353** and A10's order does not change.

## Batch 42 — the Italo-Turkish War, and the umbrella that is in two lanes at once

*23 September, the fire that picked the run up at 10:40Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent; the batches are what stands in front of the run. A10's order is
unchanged and **Africa still trails hardest, 116 active against Europe's 353**,
so the lane is Africa again. The vein is the inverse `part of` one, filtered
this time **against every event and not the active ones**, which is what
deviation 1224 asked of the fire that picked it up: 748 rows over the 109
Africa-lane events that carry an item, **682 of them held by no record of any
status** — against the 679 batch 41 measured against the active corpus alone,
so the upper bound and the true figure are three rows apart and the bound was
nearly honest.

### The five imported, all filed, and the two isolated ones

| the record | sitelinks | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- |
| `italo-turkish-war` | 61 | `scramble-for-africa` | **nowhere**, and §*The places* is why | it `--enabled-->` `first-balkan-war` |
| `2011-military-intervention-in-libya` | 38 | `arab-spring` | `libya-q1016` | `libyan-civil-war --reacted-to-->` it |
| `14-october-2017-mogadishu-bombings` | 29 | `somali-civil-war-2009-present` | `mogadishu` | **none**, and §*What earned no edge* is why |
| `battle-of-karameh` | 22 | `war-of-attrition` | `karameh` (new) | it `--caused-->` `black-september` |
| `operation-green-sea` | 19 | `guinea-bissau-war-of-independence` **and** `portuguese-colonial-war-1961-1974` | `conakry` | **none**, and §*What earned no edge* is why |

**Main 243 → 243**, filed 519 → 524, and no slot was spent to keep it there:
every one of the five went under an umbrella that was already drawn.

**The Italo-Turkish War is the batch's point and it was the largest row in the
vein by a distance.** Sixty-one language editions, a war that took Libya off
the Ottoman Empire and put it under Italy, and an atlas that held the Scramble
for Africa, both Balkan wars, both Italo-Ethiopian wars and the Treaties of
Sèvres and Lausanne — and not the war between them. It had been refused once
already: `Q203824` was in `data/imports/wikidata-state.json`'s `done` list from
an earlier run that turned it away for having no lane (deviation 1225).

### The places (A9), and the war that gets none

Three of the five reuse a record already here — `libya-q1016` from `P276`,
`mogadishu` from `P276` (whose point is the item's own `P625` to three places),
`conakry` from a `P276` and a `P625` that agree. One is new: **`karameh`**, the
Jordanian border town, written by the import itself from `Q2592647`, which is
`battle-of-karameh`'s `P276` and whose own `P625` is the battle's coordinate to
two places — the shape `jadotville-q18780` took in batch 41, and the second time
A9's first step and its second have agreed. Its precision was corrected from the
import's hard-coded `point` to `city`, which is A12 (2)'s rule read off the
class (`Q486972`, human settlement) and still not in the code.

**`italo-turkish-war` gets no place at all, and the chain is empty at every
step.** The item carries no `P625`; its `P276` is `Q1529261`, the Tripolitania
vilayet, which carries none either; and it names no `P131` and no `P17`. So the
lane is named for the item in `data/imports/wikidata-seeds.json` — africa, the
theatre the article's own first sentence gives, from Tripoli through Cyrenaica
to Fezzan — and the record is placeless. **That is the right answer and not a
gap to be filled**: the war was also fought in the Aegean, where Italy occupied
the Dodecanese, and a war on two seas has no one point. Placeless events go
from 48 to 49.

### The umbrella that is in two lanes at once, and the record it cost

**`2011-2012-jordanian-protests` was imported, validated, filed, given two
edges, and then deleted**, and the reason is a rule the run has not got.
`Q555833` came out of the vein at 22 sitelinks under `arab-spring`, with a span
the article's own title widens to 2011–2012 (A7) and a place the article's first
sentence names, `jordan-q810`. It was filed under `arab-spring`, whose span
holds it and whose subject it plainly is — and `tests/m42-filing.test.mjs`
refused it:

> `2011-2012-jordanian-protests` is part of "arab-spring" and is neither in its
> lane (africa, against asia) nor names anything "arab-spring" names

**The test is right about the property and the property is wrong about the Arab
Spring.** A6 files an event under a period "whose place or actors are in that
region"; the run reads "that region" as the umbrella's lane, and `arab-spring`
is in the africa lane because its place is `arab-world`, whose point falls in
Africa. Every one of the umbrella's five other children is African — Tunisia,
Egypt, Libya twice, Algeria — so the coincidence has held until now. It does not
hold for Jordan, and it will not hold for Bahrain, Yemen, Syria or Oman, which
are the next rows of the same vein. A period umbrella whose subject is a
**people** rather than a continent sits in two lanes, and this atlas's filing
rule can only name one.

**This is the fourth rule the run has asked the owner for**, beside batch 40's
narrowing rule, batch 41's parent-shorter-than-its-parts and the same batch's
`Q210714`. Two shapes would answer it and neither is a fire's to choose: an
umbrella could carry more than one lane, or the subject test could read the
umbrella's **place** rather than its lane and ask whether the child's place is
inside it. Until then, `Q555833` is out of `data/imports/wikidata-seeds.json`'s
`items` and out of the state file's `done`, so the next fire with a rule finds
it; its `lanes` entry is left in place, because it is true and it is what a
re-run needs.

### The eight days that were already asked about, answered

`Q210714`, the 2011 military intervention in Libya, is the row the stand after
batch 41 called *"the largest unheld Africa row at 43 sitelinks"* and said
*"fails by eight days"*: its `P361` is `libyan-civil-war`, which this atlas
closes on 2011-10-23, and the intervention ran to NATO's mandate ending on
31 October. That is still true and the filing does not use `P361` at all.
**`arab-spring` holds it** — 2010-12-17 to 2012-12 — and the subject is the one
the civil war is itself filed under, so A6's two halves both answer yes and the
record arrives filed. The stand's own sentence said the umbrella *"would hold
it, and the item does not name it"*; A6 does not ask the item to.

### What earned no edge, and why neither refusal was close

**`14-october-2017-mogadishu-bombings`** — 587 dead, the deadliest attack in
Somalia's history — names one other event in its whole article, the 2011
Mogadishu bombing it is measured against, and this atlas does not hold it.
Al-Shabaab is an actor and not an event, the item gives no `P710` at all, and
the three days of mourning the president declared are the attack's own
aftermath. Filed and isolated.

**`operation-green-sea`** has a Consequences section and none of it is here:
the purges inside Guinea, UN Security Council Resolution 290, the OAU's
resolution and the Soviet naval patrol. The article does **not** join the raid
to Cabral's assassination three years later, although the raid's stated goal
was to capture him and this atlas holds `cabral-assassinated-1973` — and
writing that edge would be the run reading a source it is meant to be quoting.
It is the third batch running to refuse an edge the corpus obviously wants
because the article declines to argue it.

### The edges, and the type each article allows

`italo-turkish-war --enabled--> first-balkan-war`, at revision 1370624672:
*"Members of the Balkan League, seeing how easily Italy defeated the Ottomans
and motivated by incipient Balkan nationalism, attacked the Ottoman Empire in
October 1912, starting the First Balkan War a few days before the end of the
Italo-Turkish War."* Two things are named and only one is this war: Italy
supplied the demonstration that the Ottoman army could be beaten, not the
nationalism that wanted to beat it, so `enabled` and not `caused`. The same
lead calls the war *"a precursor of World War I"* and **no edge is written from
that** — a precursor is a periodisation, which is batch 41's own rule.

`libyan-civil-war --reacted-to--> 2011-military-intervention-in-libya`, at
revision 1370780938, from the first sentence: the coalition *"began a military
intervention into the ongoing Libyan Civil War to implement United Nations
Security Council Resolution 1973"*, passed with the intent of *"an immediate
ceasefire in Libya, including an end to the current attacks against civilians"*.
Read in this direction the edge says the intervention answered the war, which
is what `reacted-to` says in the thirty-six the atlas already carries.

`battle-of-karameh --caused--> black-september`, at revision 1374545421:
*"The battle of Karameh and the subsequent increase in the PLO's strength are
considered to have been important catalysts for the 1970 events of the civil
war known as Black September."* The mechanism is in the same section — *"more
than 5000 individuals applied to join Fatah within the next 48 hours"*, and the
fedayeen then *"began to speak openly of overthrowing the Hashemite monarchy"*
— so `caused` and not `enabled`: the article supplies the chain and not only
the verdict. This is the batch's one Asia-lane record and it is a join, not a
part: Karameh is in Jordan, Black September is in Jordan, and the atlas held
the second without the first.

### The class table, and the two labels batch 40 asked for

Two classes were added from the items themselves, over the network:
**`Q5919191`**, military intervention, *"use of force by a State over foreign
territory"*, with the category `war`, which needs no argument against
`data/categories.json`'s own description; and **`Q18493502`**, suicide bombing,
*"type of suicide attack"*, **with no category**, because this atlas has none a
bombing belongs to — `war` is armed force between polities and `disaster` is
harm nobody chose — and a thirteenth category is an edit somebody should argue
with and not a batch's side effect.

**Batch 40 asked that a fire touching this table take its two wrong labels at
once, and this one did.** `Q273120` read *"civil war / rebellion"* and its own
label is **protest**; `Q124734` read *"rebellion / civil war"* and its own label
is **rebellion**. Both were the candidate list's words from a sandbox with no
network. Neither gains a category: a protest that seizes nothing is not
`revolution`, and choosing between `revolution` and `war` for every rebellion is
the edit CLAUDE.md says belongs in that file and not inside a record.

### The counts

| | before | after |
| --- | --- | --- |
| active | 762 | **767** |
| **main** | **243** | **243** |
| filed | 519 | 524 |
| active edges | 749 | **752** |
| largest connected component | 539 | **542** |
| components | 182 | 184 |
| events with no edge | 152 | 154 |
| events with no place | 48 | 49 |
| Africa, active | 116 | **120** |
| Asia, active | 130 | **131** |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | unchanged |
| API calls | — | 1 SPARQL for the vein, 6 `wbgetentities` for the items and the classes, 30 article reads (22 of them the edge scan), 14 for the import run |

`components` rises by two and `noEdge` with it: the two isolated records above.
The largest component takes all three edges, because each of them joins a new
record to a chain that was already in it.

## Where the run stands after batch 42, for the fire that picks it up

*23 September, 10:40Z onward. An import fire, one batch, no merge needed —
`origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **767 active** |
| **main** | **243**, unmoved through ten batches and two curation fires |
| filed | 524 |
| largest connected component | **542** |
| components | **184** |
| events with no edge at all | **154** |
| events with no place | **49** |
| events naming no actor | **396** |
| the inverse `part of` vein, Africa, unheld by any record | **682 rows** over 109 Africa-lane parents |
| per lane, active | Europe 353, **Asia 131**, **Africa 120**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's standing note
  holds: run the relations pass **over the new records only**, because reading
  the same articles again returns the same rows. This batch's five and M42b's
  are the new ones.
- **The Arab Spring is in two lanes and the filing rule can only name one.**
  §*The umbrella that is in two lanes at once* is the whole of it. Until a rule
  arrives, every Bahraini, Yemeni, Syrian, Omani and Jordanian row of this vein
  is unfilable and therefore unimportable without raising the main count. That
  is a large part of what is left under `arab-spring`, and it is the cheapest
  thing an owner's sentence could unblock.
- **The vein's Africa rows are 682 and the top of the list is thinning.** The
  rows above twenty sitelinks that remain are `Q152060`, the Cabinda conflict,
  and `Q3320778`, the 1890 British Ultimatum. Both are old business:
  - **`Q152060` is refusable now and the reason is a date, not a reading.**
    `P580` is 1975-11-08 and there is no `P582`, so A12 (3) writes `end: null`
    with the `end-unstated` flag — and `span()` reads a null end as infinity,
    which puts it outside `angolan-civil-war` (closing 2002) at the far end and
    three days outside it at the near one, the war opening on 1975-11-11. It is
    a `child-outside-parent` at both ends and no umbrella here holds it.
  - **`Q3320778` is unchanged**: the row this atlas most wants, refused on the
    lane, because the Ultimatum was delivered in Lisbon.
- **The two rules the run asked for before this batch are still open**: batch
  40's rule for a record whose article would **narrow** it (`interwar-period`),
  and batch 41's for a **parent that ends before its parts**
  (`portuguese-colonial-war-1961-1974` against the Mozambican and
  Guinea-Bissau wars of independence). This batch's `operation-green-sea` is
  filed under that same colonial war and under the Guinea-Bissau war at once,
  which is A8 working exactly as asked — and it is also a reminder that the
  war of independence itself is still filed a lane away from the war it was
  fought in.
- **`Q657661`, the Mozambican Civil War, is still the cheapest edge in the
  Africa lane and still costs a main slot.** Nothing in this batch bought one:
  the five imports all went under umbrellas that were already here.
- **Africa is 120 against Europe's 353** and A10's order does not change.

### Batch 42's check, on the head

`validate.yml` run 1525 on `1932d745` is **green**: 1,789 pure tests and 279
browser tests, 0 failed and 0 skipped, `validate --index` clean. Run 1523, on
the batch's first index commit, went red on eleven rule 16 errors — six of them
history shards — which is deviation 1227 and is fixed by rebuilding the index on
top of the commit that writes the records.

## Batch 43 — the Asia lane, and the record the vein could not see

*23 September, the fire that picked the run up at 12:52Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent; the batches are what stands in front of the run. A10's order of need is
unchanged and **Africa still trails hardest, 120 active against Europe's 353**,
with **Asia second at 131** — and this batch is three Asia and two Africa, for
a reason the vein itself gives.*

### Why the lane is not Africa alone

The inverse `part of` vein was re-run over both lanes M42 owns, against every
record of any status on `m42` **and** on `origin/m42b`: **704 unheld rows over
the 113 Africa-lane events that carry an item, and 2,623 over the 128 Asia-lane
ones.** Filtered to the rows whose own `P580`/`P582`/`P585` fall inside the
span of the record their `P361` names — which is the only filing this run has —
**600 of the Africa rows survive and the top of that list is all old
business**:

| the row | sitelinks | why it is not here |
| --- | --- | --- |
| `Q555833`, `Q14746872`, `Q940675`, `Q947960`, `Q1149627` | 22, 19, 17, 15, 15 | the Arab Spring in two lanes — batch 42's §*The umbrella that is in two lanes at once*, still the cheapest thing an owner's sentence could unblock |
| `Q3320778`, the 1890 British Ultimatum | 19 | refused on the lane, and the stand after batch 40 says why: the item names only the United Kingdom and the Kingdom of Portugal, so its lane is europe against an africa umbrella that names no actor |
| `Q152060`, the Cabinda Conflict | 20 | `end-unstated` reads as infinity and puts it outside `angolan-civil-war` at both ends |
| `Q476855`, the Mau Mau rebellion | 41 | **the largest Africa row in the whole vein and it fails by two years**: 1952–1960 against `decolonisation-of-africa`, whose article dates the period "between the mid-1950s to 1976" and whose record therefore opens at 1954 |
| `Q31944`, the Mahdist War | 41 | 1881–1899 against `scramble-for-africa` at 1885–1914. The article's lead names no start year at all — "the last quarter of the 19th century", the Berlin Conference of 1884–1885 — so **A7 cannot widen it**, and four more rows of the same vein (`Q385820` the French conquest of Tunisia, `Q722051` the Anglo-Ashanti wars, `Q1402902` the Dervish War) wait behind the same 1885 |

**So Africa's top rows are refused by rules the run already has, and Asia's are
not.** A10 asks for the lanes that trail and Asia trails at 131 against Europe's
353; the batch takes the two Africa rows that file and three Asia rows that
file, and names the Africa blockers above rather than forcing one.

### The five imported, all filed, and the sixth the vein handed back

| the record | sitelinks | lane | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- | --- |
| `battle-of-dien-bien-phu` | 57 | asia | `first-indochina-war` | `dien-bien-phu` (new) | it `--caused-->` `geneva-conference` |
| `india-pakistan-war-of-1971` | 51 | asia | `bangladesh-liberation-war` | **nowhere**, and §*The places* is why | `bangladesh-liberation-war --caused-->` it |
| `2003-invasion-of-iraq` | 47 | asia | `iraq-war` | `iraq-q796` | it `--enabled-->` `iraqi-insurgency` |
| `operation-odyssey-dawn` | 25 | africa | `2011-military-intervention-in-libya` | `libya-q1016` | `libyan-civil-war --reacted-to-->` it |
| `operation-musketeer-1956` | 12 | africa | `suez-crisis` | `suez-canal` | it `--caused-->` `closure-of-the-suez-canal-1956-1957` |

**Main 243 → 243**, filed 524 → 529: all five went under an umbrella that was
already drawn, and no slot was spent to keep the count where it was.

### The record the vein could not see, and the filing M62 had already refused

**`Q626191`, the Indian annexation of Goa, came out of the vein at 29 sitelinks
as an item nothing held — and this atlas has held the event since 2 September.**
`goa-annexed-1961` was written from two books, names three actors, and carries
one edge; what it did not carry was a Wikidata item, and the vein's filter is
`held = every record's wikidata key`. So the import created
`indian-annexation-of-goa` from the same event, and the duplicate was found only
by reading the corpus for the title. **Deviation 1235: a record that holds an
event without the item is invisible to the vein, and the check before an import
has to be the title and not only the key.**

The duplicate was deleted. `Q626191`, its two Wikipedia titles and its sitelink
count were written on to `goa-annexed-1961` **by hand**, which is the M20 route
for an identifier decided by judgment: the import enriches a record that already
carries the item and cannot be told that one is the same event.

**It was also filed and then unfiled, and the unfiling is the point.** The
item's `P361` names the Portuguese Colonial War; the span holds — 18 December
1961 is inside 1961-02-04 to 1974-04-25 — and the record names `estado-novo`,
which the umbrella names too, so both halves of M62's rule and both of
`tests/m62.test.mjs`'s properties answer yes. **And `docs/m62-umbrellas.md` had
already decided it, twice, against.** §3: *"An event whose author is another
state, with the umbrella as its object, is not part of the umbrella.
`goa-annexed-1961` is the Republic of India's operation; the Estado Novo is what
it was done to. It stays top-level."* §4.4 lists it again among the eleven that
*"intersect the war's subject only because `estado-novo` is a belligerent in
it"*. One clause of that argument has since lapsed — *"An event has one parent"*
is not true after A8 and M79 — but the substance has not: the annexation of Goa
is India's act against Portugal and not a campaign of Portugal's war in Africa.
**A batch does not overturn a written editorial decision on its own authority**,
so `parent` was taken off again and the record stays top-level. Main is 243
where it was, and this batch buys no slot.

**The import would not have filed it either.** The item gives `P580` December
1961 and **no `P582`**, so A12 (3) writes `end: null` with `end-unstated`, and
`span()` reads a null end as infinity — outside a parent that closes in 1974,
which is exactly the shape that refuses `Q152060`. The record this atlas already
had is dated 1961-12-18 from its books and needed nothing read into it.

### The places (A9), and the war on two fronts that gets none

**One place record is new: `dien-bien-phu`**, written by the import from
`Q36027`, which is the battle's `P276` and whose own `P625` is the battle's own
coordinate to two places — 21.3869/103.0156 against 21.3924/103.0160. That is
the third time A9's first step and its second have agreed (`jadotville-q18780`
in batch 41, `karameh` in batch 42), and the place is written for the city and
not for the battle.

Two corrections by hand, both on the record and both already precedented:

- **Deviation 1233: `slug()` wrote `ien-bien-phu-city`.** The function
  normalises NFD and strips combining marks, and `Đ` is U+0110, a letter with a
  stroke that decomposes into nothing — so the first character was dropped
  rather than folded to `d`. The id is `dien-bien-phu`. Nothing referenced the
  wrong id outside this run.
- The precision, from the import's hard-coded `point` to **`city`**, which is
  A12 (2)'s rule read off the class (`Q3249005`, city of Vietnam) and still not
  in the code — the same correction `karameh` took.

`iraq-q796`, `libya-q1016` and `suez-canal` were all reused from records the
atlas already held, each the item's own `P276`.

**`india-pakistan-war-of-1971` gets no place and that is the right answer.** The
item names six `P276` locations — Q2399139, Q38684, Q645659, Q2635466, Q1366583,
Q58705 — across an eastern and a western front, and the record's own title names
none of them, so batch 39's rule ("where an item names several locations the
pass takes the one the record's own title names") leaves it with a lane and no
point. The lane is asia, named for the item in the seeds file. Placeless events
go from 49 to 50.

### The actors (A12 (4)), and the nineteen lines three records take

Three of the five name actors from their item's own `P710`, every one of them a
record this atlas already holds and every one written as `belligerent`:

| the record | lines | of how many `P710` | what the rest are |
| --- | --- | --- | --- |
| `operation-odyssey-dawn` | **12** | 24 | commands, ships and people the atlas has no record for |
| `2003-invasion-of-iraq` | **5** | 13 | militias and commands; the four coalition members the lead names — "mainly American, British, Australian, and Polish troops" — are four of the five written |
| `india-pakistan-war-of-1971` | **2** | 2 | — |

`battle-of-dien-bien-phu` and `operation-musketeer-1956` name no `P710` at all
and take no actor line. Events naming no actor go from 396 to 398.

### The edges, and the type each article allows

`battle-of-dien-bien-phu --caused--> geneva-conference`, at revision 1372169112:
*"the defeat at Điện Biên Phủ brought a profound psychological shock to France.
It led to a gradual withdrawal of French forces from all of Indochina (with the
exception of Laos). This was agreed in the 1954 Geneva Accords signed ten weeks
after the battle."* **What the battle caused is the settlement and not the
meeting**, and the same article says so twice — the negotiations were
*"previously planned"* and *"had begun in April"*, and the conference *"opened
on 8 May 1954, the day after the surrender of the garrison"*. The edge runs to
the conference because the conference is where the withdrawal was written down
and this atlas holds no separate record for the Accords; it already carries
`first-indochina-war --caused--> geneva-conference`, and this is the same claim
at the grain of the battle the article calls decisive.

`2003-invasion-of-iraq --enabled--> iraqi-insurgency`, at revision 1372133822:
*"More serious for the post-war state of Iraq was the looting of cached weaponry
and ordnance which fueled the subsequent insurgency. As many as 250,000 tons of
explosives were unaccounted for by October 2004."* **`enabled` and not
`caused`**: what the article puts on the invasion is the means and not the
motive. The atlas holds `iraq-war --caused--> iraqi-insurgency` already, and the
two do not disagree — the war is what the insurgency answered, the invasion is
what armed it.

`bangladesh-liberation-war --caused--> india-pakistan-war-of-1971`, at revision
1371969450, from one clause: *"The Indo-Pakistani conflict was sparked by the
Bangladesh Liberation War, which was a result of the violation of the rights of
East Pakistan by the Pakistan Army."* The mechanism is in the same article — the
campaign in the east drove *"approximately 10 million people"* into India, and
*"Prime Minister Indira Gandhi on 27 March 1971 concluded that, instead of
taking in millions of refugees, it was better to go to war with Pakistan"* — so
`caused` and not `precondition-of`. **This is an edge between a parent and its
child**, which the atlas has 77 of and which says something the filing does not:
`parent` is a display fact and never enters the adjacency.

`operation-musketeer-1956 --caused--> closure-of-the-suez-canal-1956-1957`, at
revision 1375553410, twice over: *"Although landing forces quickly established
control over major canal facilities, the Egyptians were able to sink obstacles
in the canal, rendering it unusable"*, and, of the withdrawal, *"Nasser
nevertheless ensured the Canal could not be used by sinking or otherwise
disabling 49 ships in the channel."* Same direction and same type as the
`suez-crisis --caused-->` edge already here, at the grain of the operation.

`libyan-civil-war --reacted-to--> operation-odyssey-dawn`, at revision
1375561963: the operation was *"the U.S. code name for the American role in the
international military operation in Libya to enforce United Nations Security
Council Resolution 1973"*, and *"The initial operation implemented a no-fly zone
that was proposed during the Libyan Civil War to prevent government forces loyal
to Muammar Gaddafi from carrying out air attacks on anti-Gaddafi forces."* Read
in this direction the edge says the operation answered the war, which is what
batch 42 wrote of the intervention this operation is the American half of.

### The class table, and the item the run could not stop reading twice

One class was added from the item itself, over the network: **`Q3249005`**, city
of Vietnam, a place with the precision `city`.

**Deviation 1234: `Q1922071` was already in the seeds file's `items` and in the
state file's `done`,** refused by an earlier fire for want of a lane. The fire
added it a second time rather than checking, cleared the `done` entry, and the
import then created **two records from one item** — `india-pakistan-war-of-1971`
and `india-pakistan-war-of-1971-q1922071`, the second from `idFor` disambiguating
an id it had just taken. The duplicate was deleted and the extra `items` entry
removed. The tool should refuse an item it has already created a record for in
the same run; `Q626191` was in `done` from this fire's own first pass for the
same reason and was cleared the same way, which is batch 42's `Q203824` route
(deviation 1225).

### The counts

| | before | after |
| --- | --- | --- |
| active | 767 | **772** |
| **main** | **243** | **243** |
| filed | 524 | 529 |
| active edges | 752 | **757** |
| **largest connected component** | **542** | **547** |
| components | 184 | 184 |
| events with no edge | 154 | 154 |
| events with no place | 49 | 50 |
| events naming no actor | 396 | 398 |
| Africa, active | 120 | **122** |
| Asia, active | 131 | **134** |
| per lane, active | Europe 353, Asia 131, Africa 120, Americas 163 | Europe 353, **Asia 134**, **Africa 122**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | Europe 87, **Asia 66**, Africa 31, Americas 58 |
| API calls | — | 8 SPARQL for the two veins, 5 `wbgetentities` for the candidates and the classes, 5 article reads for the edges, 17 for the three import runs |

**The component grew by exactly the corpus**, 542 → 547 against 767 → 772, and
`components` and `noEdge` did not move at all: every one of the five new records
joined a chain that was already in the largest component, and none of them was
left isolated. That is the first batch of this run where that is true of all
five.

### Batch 43's check, on the head

`validate.yml` run **1539** on `42ab03f9` is **green**: 1,789 pure tests and 279
browser tests, 0 failed and 0 skipped, `validate --index` clean.

**Run 1537, two commits earlier, was red on two tests and neither was a record
of this batch.** The first was `tests/m53.test.mjs` → §4.1, which pins the
numerator `docs/m53-polities.md` prints: this batch's nineteen `P710` actor
lines moved it 370 → 373 and the document had to be re-taken with them, which
is what batch 40 did at 368 → 369 and what every batch writing actor lines now
owes that file. The second was `tests/keyboard-browser.test.mjs` → *"the lanes
are one tab stop each, and the arrows walk along a lane"*, failing on `End`
with `fixture-event-deep-1969` where it wanted `fixture-event-deep-2025`. **It
draws `?fixtures=1` and reads no record under `data/`**, so no import can reach
it, and it passed here three times — once in the suite and twice run alone. Its
own comment names the race it is: since M77 a title arrives with its century and
a shard landing repacks the lanes, so the order read on one frame is not the
order `End` walks on another, and the `waitFor` in front of it waits for the
first titles rather than for the last. **This is deviation 1222's shape again**
— a fixtures test on this branch red once and green on re-run — and it is lane
A's code, not this run's data.

## Where the run stands after batch 43, for the fire that picks it up

*23 September, 12:52Z onward. An import fire, one batch, no merge needed —
`origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **772 active** |
| **main** | **243**, unmoved through twelve batches and two curation fires |
| filed | 529 |
| largest connected component | **547** |
| components | **184** |
| events with no edge at all | **154** |
| events with no place | **50** |
| events naming no actor | **398** |
| per lane, active | Europe 353, **Asia 134**, **Africa 122**, Americas 163 |
| per lane, main | Europe 87, Asia 66, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's standing note
  holds: run the relations pass **over the new records only**, because reading
  the same articles again returns the same rows. This batch's five and M42b's
  are the new ones.
- **Five rules are now open and every one of them is an owner's sentence**, in
  the order of what they would unblock:
  1. **The Arab Spring in two lanes** (batch 42). Five rows of the Africa vein
     above 15 sitelinks wait on it and every Bahraini, Yemeni, Syrian and Omani
     row behind them.
  2. **A period whose own article will not date its start.** The Mau Mau
     rebellion at 41 sitelinks and the Mahdist War at 41 are both refused
     because an umbrella's span is read strictly and their own is one or two
     years wider at the near end. Either a filing tolerates a child that opens
     before its umbrella by a stated margin, or those rows are main events at
     the cost of a slot each. **This is the single largest thing standing in
     front of the Africa lane.**
  3. Batch 40's rule for a record whose article would **narrow** it.
  4. Batch 41's rule for a **parent that ends before its parts**.
  5. `Q3320778`, the 1890 British Ultimatum, which would file the day
     `scramble-for-africa` names the seven powers its own article names.
- **The Asia vein is 2,623 rows and its top is not thinning.** Rows that fit
  their parent's span and are not yet held include `Q108102583` the Fall of
  Kabul (51), `Q107461898` the 2021 Taliban offensive (49), `Q125464497` the
  April 2024 Iranian strikes on Israel (50), `Q128172378` the assassination of
  Ismail Haniyeh (38), `Q254599` the Battle of Shanghai (36), `Q696448`
  Operation Ichi-Go (33), `Q334720` Abu Ghraib (33) and `Q483039` the Battle of
  Inchon (34). **A fire that wants volume should take that lane**, and A10's
  order allows it while Asia is 134 against Europe's 353.
- **A6's umbrellas and M62's written refusals can now disagree, and this
  batch found the first case.** M62 left `goa-annexed-1961` top-level partly
  because *"An event has one parent"*, which A8 and M79 have since made false.
  Every other event on M62's "left top-level" lists is worth re-reading against
  that, once — but only by a fire that is allowed to reopen an editorial
  decision, and a batch is not. **This is the sixth thing the run would ask the
  owner for**, and the cheapest form of the question is: may a run file a record
  that a previous milestone's document argued should stay top-level, where the
  only part of that argument to have lapsed is the one-parent rule?
- **The atlas does not hold the September 11 attacks.** The 2003 invasion's
  article gives them a section of their own — *"little formal movement towards
  an invasion occurred until the 11 September attacks"* — and the edge is
  unwritable because the record does not exist. **It is an Americas-lane record
  and therefore M42b's**, which is said here so that the other run can take it.

## Batch 44 — the Africa vein below its blocked top, and the two records the articles would not connect

*23 September, the fire that picked the run up at 15:18Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent; the batches are what stands in front of the run. A10's order of need is
unchanged and **Africa still trails hardest, 122 active against Europe's 353**,
Asia second at 134 — and this batch is **four Africa and two Asia**, because the
Africa vein turns out to have plenty under the blocked rows batch 43 stopped at.*

### The vein, and what batch 43's reading of it missed

The inverse `part of` vein was re-run over both lanes M42 owns, against every
record of any status on `m42` **and** on `origin/m42b`: **701 unheld rows over
the 115 Africa-lane events that carry an item, and 2,670 over the 132 Asia-lane
ones.** Filtered to the rows whose own `P580`/`P582`/`P585` fall inside the span
of the record their `P361` names, **600 Africa rows and 2,016 Asia rows
survive** — and batch 43 read only the top of the Africa list, where every row
is refused by a rule the run already has. **The eighth row down is not.**

| the row | sitelinks | why it is still not here |
| --- | --- | --- |
| `Q555833`, `Q14746872`, `Q940675`, `Q947960`, `Q1149627` | 22, 19, 17, 15, 15 | the Arab Spring in two lanes — batch 42's §*The umbrella that is in two lanes at once*, unchanged |
| `Q3320778`, the 1890 British Ultimatum | 19 | refused on the lane: the item names only the United Kingdom and the Kingdom of Portugal |
| `Q152060`, the Cabinda Conflict | 20 | `end-unstated` reads as infinity against `angolan-civil-war`, which closes in 2002 |
| `Q476855` Mau Mau, `Q31944` Mahdist War | 41, 41 | both open one or two years before the umbrella their `P361` names |

**Below those, the list is open.** `Q114926903` at 19, `Q2704666` at 18,
`Q3269455` at 14 and `Q923340` at 14 all fit their parent's span, name a lane
this run owns, and point at a place record the atlas already holds. That is the
first thing this batch reports: **the Africa vein is not thin, it is blocked at
the top**, and a fire that reads past the first seven rows finds work.

### The six imported, all filed, and the one place written

| the record | sitelinks | lane | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- | --- |
| `2022-somali-ministry-of-education-bombings` | 18 | africa | `somali-civil-war-2009-present` | `mogadishu` | **none**, and §*The two the articles would not connect* is why |
| `operation-badr-1973` | 18 | africa | `yom-kippur-war` | `sinai-peninsula` | it `--caused-->` `yom-kippur-war` |
| `operation-unified-protector` | 13 | africa | `2011-military-intervention-in-libya` | `libya-q1016` | `operation-odyssey-dawn --precondition-of-->` it |
| `operation-linda-nchi` | 14 | africa | `somali-civil-war-2009-present` | `somalia-q1045` | `war-in-somalia --precondition-of-->` it |
| `fall-of-kabul-2021` | 50 | asia | `war-in-afghanistan-2001-2021` | `kabul` | it `--caused-->` `republican-insurgency-in-afghanistan` |
| `battle-of-inchon` | 33 | asia | `korean-war` | `incheon` (new) | **none**, same section |

*The sitelinks column is the record's own `sitelinks.count`, which counts
language editions. The vein ranks by `wikibase:sitelinks`, which counts every
site, so four of these six read one higher there: 19, 14, 51 and 34.*

**Main 243 → 243**, filed 529 → 535: all six went under an umbrella that was
already drawn, and no slot was spent to keep the count where it was.

### The places (A9), and the two `P276` an operation names

**Five of the six reuse a place record the atlas already held**, each the item's
own `P276`: `mogadishu` (`Q2449`), `sinai-peninsula` (`Q36755`),
`libya-q1016` (`Q1016`), `somalia-q1045` (`Q1045`) and `kabul` (`Q5838`).
Placeless events do not move: 50 before and 50 after, and this is the first
batch of the run where every single import is placed.

**One place record is new: `incheon`**, written by the import from `Q20934`,
which is the battle's `P276` and whose own `P625` falls 4.3 km from the
battle's own coordinate — 37.4639/126.6486 against 37.4761/126.6028, which is
the width of the city and not a disagreement. That is
the fourth time A9's first step and its second have agreed (`jadotville-q18780`
in batch 41, `karameh` in batch 42, `dien-bien-phu` in batch 43), and the place
is written for the city and not for the battle.

One correction by hand, the same one those two took: the precision, from the
import's hard-coded `point` to **`city`**, which is A12 (2)'s rule read off the
class (`Q482821`, metropolitan city of South Korea) and **still not in the
code**. Three batches in a row have now made the same edit by hand;
`placeRecord()` writing `where.precision` from the class table is the smallest
piece of code this run has asked for twice.

**`operation-unified-protector` names two `P276` and gets a place anyway.** The
item's locations are `Q1016`, Libya, and `Q4918`, the Mediterranean Sea. Batch
39's rule — *"where an item names several locations the pass takes the one the
record's own title names"* — would leave it placeless, because the title names
neither. It is not needed here: **only one of the two is a place record this
atlas holds**, so the import's own `read.location.map(...).find(Boolean)`
settles it without a rule, and Libya is also the item's single `P17`, which is
the step A9 would have reached next. The rule batch 39 wrote is for a choice
the atlas cannot make; this was not one.

### The two the articles would not connect

**`2022-somali-ministry-of-education-bombings` and `battle-of-inchon` carry no
edge, and in both cases the article was read whole before that was written
down.** They are the first two records this run has imported knowing they would
be isolated, so the reason is here rather than in a batch note nobody reads.

- The bombings' article, at revision 1365703414, names one event this atlas
  holds — *"The bombing marks the deadliest attack in Somalia since the 14
  October 2017 Mogadishu bombings at the same junction"* — and that is a
  comparison and a coincidence of address, not a cause. What the article does
  give a cause for is unavailable: the bombings came *"days after Somali
  officials announced gains in its high-profile offensive against the
  extremists"*, and that offensive is no record here.
- Inchon's article, at revision 1370266029, is the opposite problem: it states
  plenty of consequences and **this atlas holds none of them**. The lead has the
  landings *"led to the recapture of the South Korean capital of Seoul two weeks
  later"*; §*Pusan Perimeter breakout* has the Eighth Army's breakout beginning
  the day after. Seoul and Pusan are not records here. Of the two Korean records
  that are — `korean-war`, which it is filed under, and
  `korean-armistice-agreement` three years later — the article asserts no
  relation to either.

**Both are worth holding anyway** and the run is saying so rather than implying
it: the atlas held four Korean records before this batch and three of them are
documents — the annexation treaties of 1907 and 1910 and the 1953 armistice —
so `battle-of-inchon` is the first record of anything that happened inside the
war; and the most
recent Somali record it held was dated 2017. `components` goes
184 → 186 and `noEdge` 154 → 156 for exactly these two, which is the honest
price and is visible in the counts below.

### The edges, and the type each article allows

`operation-badr-1973 --caused--> yom-kippur-war`, at revision 1370630810, from
the lead's own clause: the operation *"was an Egyptian military offensive and
operation across the Suez Canal that destroyed the Bar-Lev Line ... on 6 October
1973. It was launched in conjunction with a Syrian military offensive against
the Israeli-occupied Golan Heights, triggering the Yom Kippur War."* **This runs
from a child to the parent it is filed under**, which is the shape batch 43 met
from the other side with `bangladesh-liberation-war --caused-->
india-pakistan-war-of-1971`: `parent` is a display fact and never enters the
adjacency, so the filing and the edge are two different statements about the
same pair. The atlas already carries `war-of-attrition --precondition-of-->
yom-kippur-war` and `six-day-war --precondition-of--> yom-kippur-war`; those are
what the war grew out of, and this is what began it.

`operation-odyssey-dawn --precondition-of--> operation-unified-protector`, at
revision 1370700566: *"formal transfer of command occurred at 06:00 GMT on 31
March 2011, formally ending the national operations such as the U.S.-coordinated
Operation Odyssey Dawn"*, and *"The no-fly zone was enforced by aircraft
transferred to Unified Protector from the international coalition."*
**`precondition-of` and not `caused`**: what the coalition operation gave the
NATO one is the zone, the command and the aircraft it took over — a thing that
had to be in place, not a motive. This is the second edge on
`operation-odyssey-dawn`, which batch 43 imported yesterday afternoon, and it is
what A5 asks a batch for: the new record joined to the newest one there was.

`war-in-somalia --precondition-of--> operation-linda-nchi`, at revision
1375942642, from §*Background*: *"During the Ethiopian invasion of Somalia aimed
at toppling the Islamic Courts Union administration, Kenyan troops assisted the
Ethiopians and allied Somali forces in capturing the retreating Somali
Islamists. Al-Shabaab viewed the Kenyan government with hostility ever since"*,
and from §*Lead up and planning*: *"After Ethiopian troops withdrew from Somalia
in early 2009, Al-Shabaab came to control much of the south."* So the earlier
war is what made Kenya a target and what left al-Shabaab holding the ground
Kenya invaded. **`precondition-of` and not `caused`**, because the article gives
the trigger as kidnappings on Kenyan territory in October 2011 — no record here
— and says the plan *"was discussed and decided in 2010"*.

`fall-of-kabul-2021 --caused--> republican-insurgency-in-afghanistan`, at
revision 1372101001, from §*Panjshir conflict*: *"With the fall of Kabul, former
Northern Alliance members and other anti-Taliban forces based in the province
Panjshir, led by Ahmad Massoud and former vice president Amrullah Saleh, became
the primary organized resistance to the Taliban in Afghanistan."* The atlas
already carries `war-in-afghanistan-2001-2021 --caused-->
republican-insurgency-in-afghanistan`; this is the same claim at the grain of
the single day the article says turned those forces into an insurgency, which is
the shape batch 43 wrote for `2003-invasion-of-iraq` beside `iraq-war`.

### The actors (A12 (4)), and the five items that name nobody

**One actor line in the whole batch.** `battle-of-inchon` takes
`united-states-of-america` as `belligerent` from its item's own `P710`
(`Q30`). The other five items name no `P710` at all except
`fall-of-kabul-2021`, whose single participant is `Q42418`, the Taliban, **which
this atlas holds as no actor** — so no line, and no actor record invented for
it. Events naming no actor go 398 → 403.

`docs/m53-polities.md` §4.1 was re-taken with that one line: 373 of 772 → **374
of 778**, and the overlap figure 374 → 375.

### The class table

Two classes were added, both from the items themselves over the network:

- **`Q482821`**, metropolitan city of South Korea, a place — Wikidata glosses it
  *"type of administrative subdivision in South Korea"*.
- **`Q25917154`**, truck bombing, an event — *"terrorist attack carried out
  through the explosion of a vehicle"* — and **with no category**. None of the
  twelve of `data/categories.json` names an attack of this kind: `war` is
  *"organised armed force between polities"* and `disaster` is *"harm from
  something nobody chose"*. Every comparable record already here — the 2017
  Mogadishu bombings, the 2019 Bogotá car bombing, the three Lisbon bomb
  attacks of the Revolutionary Brigades — carries none either, so none was
  guessed. `2022-somali-ministry-of-education-bombings` therefore imports
  uncategorised, which is the honest answer and not an omission.

### Batch 44's check, on the head

`validate.yml` run **1551** on `8106d69e` is **green**: the pure suites and
**279 browser tests**, 0 failed and 0 skipped, `validate --index` clean. Runs
1549 and 1550 were **cancelled rather than red** — each was superseded by the
next push of this fire's own corrections, which is the workflow's concurrency
group doing its job and not a failure.

**One browser test failed once locally and passed on a re-run of the same
suites, with nothing changed in between.** It is deviation 1222's shape for the
third fire running — a `?fixtures=1` suite that reads no record under `data/`,
so no import can reach it — and the check itself, which runs the browser suites
one at a time on the runner, is green. Nothing was re-run on the runner; the
green above is run 1551's first and only attempt.

### The counts

| | before | after |
| --- | --- | --- |
| active | 772 | **778** |
| **main** | **243** | **243** |
| filed | 529 | 535 |
| active edges | 757 | **761** |
| **largest connected component** | **547** | **551** |
| components | 184 | 186 |
| events with no edge | 154 | 156 |
| events with no place | 50 | **50** |
| events naming no actor | 398 | 403 |
| **Africa, active** | **122** | **126** |
| Asia, active | 134 | **136** |
| per lane, active | Europe 353, Asia 134, Africa 122, Americas 163 | Europe 353, **Asia 136**, **Africa 126**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | Europe 87, Asia 67, Africa 31, Americas 58 |
| API calls | — | 5 SPARQL for the two veins, 5 `wbgetentities` for the candidates and the two classes, 12 article reads for the edges and the two refusals, 14 for the import run |

**The component grew by four against a corpus that grew by six**, and the
difference is exactly the two records §*The two the articles would not connect*
names. The four that carry an edge each joined a chain already inside the
largest component — none of them started a second one.

**A correction to the table batch 43 left.** Its *per lane, main* row reads
"Europe 87, Asia 66, Africa 31, Americas 58", which sums to 242 against a main
count of 243. Measured again over the same commit the figure is **Asia 67**;
batch 43's row was one short and the total in the same table was right. The rows
above and here carry 67.

## Where the run stands after batch 44, for the fire that picks it up

*23 September, 15:18Z onward. An import fire, one batch, no merge needed —
`origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **778 active** |
| **main** | **243**, unmoved through thirteen batches and two curation fires |
| filed | 535 |
| largest connected component | **551** |
| components | **186** |
| events with no edge at all | **156** |
| events with no place | **50** |
| events naming no actor | **403** |
| per lane, active | Europe 353, **Asia 136**, **Africa 126**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's standing note
  holds: run the relations pass **over the new records only**, because reading
  the same articles again returns the same rows. This batch's six and M42b's are
  the new ones — and the two edgeless ones above are the first records this run
  has handed to that pass with a question already framed: **does any other
  article name them?** Inchon in particular is named by articles this atlas
  holds (the Korean War's own), and a pass that reads *outward* from the held
  corpus would find it where reading its own article did not.
- **The Africa vein is not exhausted and batch 43's reading of it was too
  short.** Below the seven blocked rows the list runs on for 600 rows, and this
  batch took four of them without meeting a rule it did not have. Rows that fit
  their parent's span and are still unheld include `Q1316065` Operation Ellamy
  (15) and `Q921174` Opération Harmattan (13), the two remaining national
  codenames of the Libya intervention; `Q709660` the Hoare–Laval Pact (15),
  which is refused on the lane — no `P625`, no `P276`, and a `P17` of France
  against an Africa umbrella; `Q97701895` the 2020 Darfur attacks (14);
  `Q2072316` the Battle of the Chinese Farm (12), which has its own `P625` and
  **no `P276` at all**, so A9's mechanical steps give it nothing and only its
  article names the Sinai; `Q1535667` Operation Artemis (12) and `Q1150465`
  Operation Barras (11).
- **The Asia vein's top is enormous and mostly importable.** `Q151622` the
  Israeli–Palestinian conflict at 88, `Q122976243` the October 7 attacks at 59,
  `Q107461898` the 2021 Taliban offensive at 49, `Q125464497` at 50,
  `Q130314422` at 46, `Q334720` Abu Ghraib at 33. **`Q107461898` is the one to
  read first and it is blocked by a shape worth naming**: `P580` is 2021-05-01
  and there is no `P582`, so A12 (3) writes `end: null`, `span()` reads it as
  infinity, and the offensive falls outside `war-in-afghanistan-2001-2021`,
  which closes 2021-08-30. Its own article states the end — 15 August 2021, the
  day `fall-of-kabul-2021` this batch imported — but supplying an end where the
  item states none *narrows* the span, and **batch 40's narrowing rule is still
  open**. The cheapest form of that question is now concrete: *may a run write
  the end its record's own cited article states, where the item states none and
  the record carries `end-unstated`?* It is not the same question as narrowing a
  span the source did state, and answering it yes would unblock this row and
  `Q152060`, the Cabinda Conflict, at once.
- **The five rules of the stand after batch 43 are all still open**, unchanged:
  the Arab Spring in two lanes; an umbrella whose own article will not date its
  start (Mau Mau, the Mahdist War); batch 40's narrowing rule; batch 41's parent
  that ends before its parts; and `Q3320778`, the 1890 British Ultimatum.
- **`placeRecord()` should write `where.precision` from the class table.** Three
  consecutive batches have corrected the import's hard-coded `point` by hand —
  `karameh`, `dien-bien-phu`, `incheon` — and A12 (2) already says the rule. It
  is a few lines and it is lane-B code, so a fire could write it; it is named
  here rather than done because a batch changing the importer mid-run is how a
  batch stops being reproducible.

## Batch 45 — the Libyan civil war read as a chain, and the component it joined

*23 September, the fire that picked the run up at 17:51Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent, and the batches are what stands in front of the run. A10's order of need
is unchanged and **Africa still trails hardest, 126 active against Europe's
353**, Asia second at 136 — so this batch is **six Africa rows and no other
lane**, and it is the first batch of the run to take a single war's own battles
in the order the articles put them in.*

### The vein, re-run whole, and the reading that changed

The inverse `part of` vein was re-run over the 119 Africa-lane events that
carry an item, against every record of any status on `m42` **and** on
`origin/m42b`: **771 rows, 693 of them unheld.** Batch 44 read the list as a
ranking and took the highest rows that fitted a rule; this batch read it as
**a graph of one war** — of the 693, 32 name `Q81545`, the Libyan Civil War,
which the atlas already holds along with its intervention, its Tripoli battle
and the killing of Gaddafi. Six of those rows, read in date order, are a
front moving west to east and back again.

Two rows named in the stand after batch 44 were **not** taken, and the reason
is the same for both: `Q1316065` Operation Ellamy and `Q921174` Opération
Harmattan have **no `P625`, no `P276`, no `P131` and no `P17`**, so A9's four
mechanical steps give them nothing and they would arrive placeless *and*
laneless — which is to say they would not count in the Africa lane A10 sent
this fire to fill. The row the stand put first, `Q97701895` the 2020 Darfur
attacks, is here.

**`Q1535667` Operation Artemis was imported and then deleted, before any
commit.** The item has a `P580` and **no `P582`**, so A12 (3) writes
`end: null` with `end-unstated`, `span()` reads that as infinity, and the
operation falls outside `ituri-conflict`, which closes in 2003 — the same
shape that blocks `Q152060` the Cabinda Conflict and `Q107461898` the 2021
Taliban offensive. **That is now three rows on one rule**, and the rule is
batch 40's, still open: *may a run write the end its record's own cited
article states, where the item states none and the record carries
`end-unstated`?* Filing it anyway would have raised the main count or written
a child dated outside its parent; this fire did neither and took a row that
files. Its class `Q699417` (EUFOR) was added to the class table with it and
removed with it; `Q1535667` is out of `items` and out of the import state, so
the row is importable again the moment the rule is answered.

### The six imported, all filed, and the three places written

| the record | sitelinks | lane | filed under | placed at | the edge it came for |
| --- | --- | --- | --- | --- | --- |
| `2020-darfur-attacks` | 14 | africa | `war-in-darfur` | `darfur-q46733` | `war-in-darfur --precondition-of-->` it |
| `battle-of-sirte-2011` | 12 | africa | `libyan-civil-war` | `sirte` | it `--caused-->` `killing-of-muammar-gaddafi` |
| `battle-of-ras-lanuf` | 12 | africa | `libyan-civil-war` | `ras-lanuf` (new) | `first-battle-of-brega --precondition-of-->` it, and it `--precondition-of-->` `second-battle-of-benghazi` |
| `second-battle-of-benghazi` | 11 | africa | `libyan-civil-war` | `benghazi` (new) | `2011-military-intervention-in-libya --reacted-to-->` it |
| `first-battle-of-benghazi` | 10 | africa | `libyan-civil-war` | `benghazi` (new) | it `--precondition-of-->` `second-battle-of-benghazi` |
| `first-battle-of-zawiya` | 12 | africa | `libyan-civil-war` | `zawiya-libya` (new) | **none**, and §*The one the article would not connect* is why |

**Main 243 → 243**, filed 535 → 541: every one of the six went under an
umbrella the atlas already drew, and no slot was spent to keep the count where
it was. **Every one of the six is placed**, which is the second batch in a row
where that holds.

Two classes were wanted and one was kept: **`Q21480300`, mass shooting**, for
the Darfur attacks. It is added with `kind: event` and **no category**, and the
note on it says why — the twelve of `data/categories.json` have no kind for a
mass shooting *as a class*, and writing `war` there would be reading this one
event's parent rather than the class. Fifty event classes in that table already
carry no category, so this is the table's own shape and not an exception to it.

### The places (A9), and the fourth batch to correct the same line by hand

**Three place records are new** — `benghazi` (`Q40816`), `ras-lanuf`
(`Q58462`) and `zawiya-libya` (`Q221503`) — each the `P276` of the battle that
asked for it, each written by the import from the item, and each its own
import call before the events so the events could reuse it rather than arrive
placeless. `sirte` and `darfur-q46733` the atlas already held. Placeless events
do not move: **50 before and 50 after**.

**And for the fourth batch running, the precision was corrected by hand.** The
import writes `where.precision: "point"`; all three of these are `Q515` or
`Q486972` — a city and a human settlement — so all three are `city` under
A12 (2)'s rule, read off the class. `karameh`, `dien-bien-phu`, `incheon` and
now these three: **six records over four batches**. The line is named again in
the stand below, and this fire did not write it, for the reason batch 44 gave.

One label was corrected with them. `zawiya-libya`'s `where.label` came in as
*"Zawiya, Libya"*, which is the article's title and its disambiguator — A12 (5)
keeps that for an **event**'s title on purpose, but `where.label` is what the
map draws under a mark, and the item's own English label is *"Zawiya"*, which
the record's `names` already held first. That is a read of the item, not a
rename.

### The seven edges, and the component they joined

**Seven edges, all `probable`, all from the articles the records cite**, at the
revisions named in each locator. Six are the batch's own; the seventh is not,
and it is the one that mattered most.

| the edge | type | what the article states |
| --- | --- | --- |
| `battle-of-sirte-2011 → killing-of-muammar-gaddafi` | `caused` | the lead: Gaddafi and his son *"were wounded and captured, then tortured and killed in custody less than an hour later"* |
| `first-battle-of-brega → battle-of-ras-lanuf` | `precondition-of` | Brega's own § Battle: *"The government force retreated to Ra's Lanuf ... after the battle"*; its § Aftermath: *"On 4 March, anti-Gaddafi fighters launched an attack against Ra's Lanuf"* |
| `battle-of-ras-lanuf → second-battle-of-benghazi` | `precondition-of` | § Aftermath: *"After the battle the town was firmly in loyalist hands and government troops advanced further east taking the towns of Brega and Ajdabiya and reaching Benghazi"* |
| `first-battle-of-benghazi → second-battle-of-benghazi` | `precondition-of` | February's § End has the compound taken and *"Gaddafi's troops evacuated"*; March's opening has the battle fought against *"anti-Gaddafi forces in Benghazi"* |
| `2011-military-intervention-in-libya → second-battle-of-benghazi` | `reacted-to` | § France intervenes: *"at 4:45 pm, coalition intervention began as a French fighter jet fired on and destroyed several loyalist armored vehicles"*, and Mullen announcing the coalition *"had stopped the regime's progression on Benghazi"* |
| `war-in-darfur → 2020-darfur-attacks` | `precondition-of` | § Background: the war drove groups off their land, *"in the 2010s, the original landowners returned and contested ownership"*, and the government and UNAMID connect the massacres to exactly that dispute |
| `operation-unified-protector → battle-of-tripoli-2011` | `precondition-of` | § Operation Mermaid Dawn plans and aims: *"rebels drew up a list of over 120 targets for NATO to strike"*, with the loyalist command centres supplied to NATO by cells inside the city |

**The seventh edge is between two records this batch did not import, and it is
worth naming as a method.** After the six, `battle-of-sirte-2011` had joined
`killing-of-muammar-gaddafi` and `battle-of-tripoli-2011` in a component of
**three**, which was not the largest — the war's most consequential record was
in a pocket of its own. One edge from the NATO operation the atlas already
held, argued from Tripoli's own article, put all three into the main graph.
**A5 says a batch writes its edges to what already exists; this is the first
time the run has read an article to connect two records that were already
here, because the batch's own arithmetic pointed at them.** That is A13's
relations pass asked of a batch rather than of the curation fire, and it cost
one fetch.

Two of the seven are **not** repetitions of a single sentence and say so in
their own explanation: `first-battle-of-benghazi → second-battle-of-benghazi`
joins a statement in one article to a statement in another, and
`war-in-darfur → 2020-darfur-attacks` rests on officials rather than on
historians. `probable` is what that costs, and it is what every edge of this
batch carries anyway.

### The one the article would not connect

**`first-battle-of-zawiya` carries no edge, and the article was read whole
before that was written down.** At revision 1370619040 the only records this
atlas holds that it names are comparisons and neighbours, not causes: *"Along
with the Battle of Misrata, the First Battle of Zawiya was one of the
bloodiest clashes of the Libyan Civil War"* — a ranking — and *"Zawia was the
rebel city which was closest to Tripoli"* — a distance. Its § Aftermath runs
on into the rebel capture of the city on 20 August, but that is the **Second**
Battle of Zawiya, which the atlas does not hold, and it is the second battle
and not this one that the Tripoli offensive advanced out of. Holding it anyway
is the honest thing: it is the western front of a war whose eastern front the
atlas now has in six records, and it is the bloodiest of them.

`noEdge` is **156 before and 156 after**, which reads as no movement and is
two movements: `first-battle-of-zawiya` arrives isolated, and
`first-battle-of-brega`, which had no edge at all until this batch, stops
being.

### The counts

| | before | after |
| --- | --- | --- |
| corpus, active | 778 | **784** |
| **main** | **243** | **243** |
| filed | 535 | 541 |
| active edges | 761 | **768** |
| largest connected component | 551 | **558** |
| components | 186 | **185** |
| events with no edge at all | 156 | 156 |
| events with no place | 50 | 50 |
| events naming no actor | 403 | 409 |
| per lane, active | Europe 353, Asia 136, **Africa 126**, Americas 163 | Europe 353, Asia 136, **Africa 132**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | unchanged |

**A12 (4) asked of this batch and got nothing**: not one of the six items
carries a `P710`, so the six name no actor and the count rises by six. That is
the honest price of taking battles rather than treaties — the vein's Libyan
rows name their participants in prose and not in a property.

## Where the run stands after batch 45, for the fire that picks it up

*23 September, 17:51Z onward. An import fire, one batch, no merge needed —
`origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **784 active** |
| **main** | **243**, unmoved through fourteen batches and two curation fires |
| filed | 541 |
| largest connected component | **558** |
| components | **185** |
| events with no edge at all | **156** |
| events with no place | **50** |
| events naming no actor | **409** |
| per lane, active | Europe 353, **Asia 136**, **Africa 132**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. A13's standing note
  holds — run the relations pass **over the new records only**, because reading
  the same articles again returns the same rows — but this batch has found the
  one exception worth writing into it: **the pass should also read outward from
  a record the arithmetic points at.** Batch 44 left `battle-of-inchon` and
  `2022-somali-ministry-of-education-bombings` isolated because *their own*
  articles named nothing here; this batch connected a whole component of three
  by reading somebody else's article about a record it had not imported. The
  cheap version of that for the curation fire is: for every component that is
  not the largest, read the article of **one** record in the largest that names
  it. This batch's six and M42b's are the new ones, and
  `first-battle-of-zawiya` is the one this batch knowingly left isolated.
- **A9's first step has never once been used, and five Yom Kippur War rows are
  waiting on it.** A12 (2) says the place pass *"reads the item's own `P625`
  first"*, then `P276`, `P131`, `P17` — but no batch of this run has ever
  written a place from step one, because `placeRecord()` is only ever called on
  a *place* item and an event reaches a place only through its `P276`. So a
  battle that carries its own coordinate and names no location is placeless,
  and the vein has a shelf of them: `Q743358` Battle of Latakia (16),
  `Q2072316` the Battle of the Chinese Farm (12), `Q1039366` the Ofira Air
  Battle (11), `Q2705872` the Battle of Baltim (11), `Q2907870` Valley of Tears
  (10) — every one of them inside `yom-kippur-war`'s span, every one of them
  Africa or Asia, every one of them refused on the lane. **The question is one
  sentence: may the place pass write a place record from the event item's own
  `P625`, named from the event, at `precision: point`?** A12 (2) names
  `point` *"for a battlefield or site"*, which reads as yes; what stops a fire
  doing it unasked is that the place would carry the battle's own name, and a
  place called "Battle of the Chinese Farm" is a record about an event. The
  compromise a fire could take without a new rule is narrower and worth
  naming: **where an existing place record's own outline or point already
  contains the event's `P625`, reuse it** — `sinai-peninsula` holds four of
  those five coordinates, and reusing a place the atlas already has is not
  writing one.
- **`placeRecord()` should write `where.precision` from the class table**, and
  the case is no longer an argument: **six records over four consecutive
  batches** have had the import's hard-coded `point` corrected to `city` by
  hand — `karameh`, `dien-bien-phu`, `incheon`, `benghazi`, `ras-lanuf`,
  `zawiya-libya`. A12 (2) already states the rule. It is a few lines and one
  test, and it is the smallest piece of code this run has asked for four times.
- **Batch 40's narrowing rule now blocks three rows and one of them was
  imported and deleted to prove it.** `Q1535667` Operation Artemis, `Q152060`
  the Cabinda Conflict and `Q107461898` the 2021 Taliban offensive all have a
  `P580`, no `P582`, and a parent that closes before the run can say when they
  ended. The question, unchanged and now cheap to answer: *may a run write the
  end its record's own cited article states, where the item states none and the
  record carries `end-unstated`?* Answering it yes unblocks three rows at once
  and costs one clause in A7.
- **The Africa vein is not thin and it is not a ranking.** 693 unheld rows over
  the 119 Africa-lane events that carry an item. Of those, **32 name `Q81545`,
  the Libyan Civil War**, and six of them are now here; `Q588059` the Battle of
  Bin Jawad (11), `Q581087` the Third Battle of Brega (10) and `Q911471` the
  Second Battle of Brega (10) are the rest of the same front and each has a
  `P276` and dates inside the span, so each files and places without a rule the
  run does not have. Reading a vein **as one war in date order** is what gave
  this batch six edges out of six records instead of the yield batch 44 got,
  and it is the method to repeat before the ranking is picked up again.
- **The five rules of the stand after batch 43 are all still open**, unchanged:
  the Arab Spring in two lanes (`Q555833`, `Q14746872`, `Q940675`, `Q947960`,
  `Q1149627` and the rest of the `Q33761` rows); an umbrella whose own article
  will not date its start (Mau Mau, the Mahdist War); batch 40's narrowing rule,
  above; batch 41's parent that ends before its parts; and `Q3320778`, the 1890
  British Ultimatum, refused on the lane.
- **`Q1316065` Operation Ellamy and `Q921174` Opération Harmattan are refused
  on the lane and should stop being offered.** They name no coordinate and no
  place of any kind, so A9 gives them nothing and they would land in no lane —
  the same refusal `Q709660` the Hoare–Laval Pact takes for a different reason.
  A fire that wants them needs A9 to reach a fifth step, and the fifth step
  would have to be *the parent's place*, which is a guess about where a thing
  happened and not a read of it.

### The check, green on the head, and the one test batch 45 turned red

**Run 1560 on `acccea5f` is green on its first and only attempt**: validate
clean, the whole suite passing, and the index step skipped because the push is
not a pull request. Runs 1558 and 1559 were **cancelled rather than red**, each
superseded by the next push of this fire.

Locally, the suites the way the check runs them since M63: **1,789 pure tests
and 279 browser tests, 0 failed and 0 skipped.** No browser test flaked on this
fire, which is the first fire in three where that is true.

**One pure test went red on this batch and it was the right one to go red.**
`tests/m53.test.mjs` holds `docs/m53-polities.md` §4.1 to the corpus, and the
`after M42` row read *374 of 778*; the six imports take the denominator to 784
and leave the numerator at 374, because **not one of the six items carries a
`P710`**. The row is retaken and the paragraph under it says so. That test is
doing exactly what it was written for: the gap between a corpus that is
imported and one that is written widens by the size of every batch, and the
number is in a file rather than in a batch note nobody reads.


## Batch 46 — the Libyan eastern front to the end, and the code the stand asked for four times

*23 September, the fire that picked the run up at 20:07Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent, and the batches are what stands in front of the run. A10's order of need
is unchanged and **Africa still trails hardest, 132 active against Europe's
353**, Asia second at 136 — so this batch is **seven Africa rows and no other
lane**, and it is the second batch running to read a single war's battles in
the order the articles put them in rather than to take the top of a ranking.*

### The vein, and the war read to its end

The inverse `part of` vein was re-run over the **125** Africa-lane active
events that carry an item — batch 45's 119 plus its own six — against every
record of any status on `m42` **and** on `origin/m42b`: **774 rows over 771
distinct items, 690 of them unheld.** Of the 690, **29 name `Q81545`, the
Libyan Civil War**, whose front batch 45 took six of.

**Seven of those 29 are what is left of the war's eastern front**, and with
them the front runs unbroken from the first battle of Benghazi in February to
Bani Walid in October. In date order, with what the atlas already held between
them:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `battle-of-bin-jawad` | 11 | 6–11 Mar | `bin-jawad` (new) | `libyan-civil-war` |
| `second-battle-of-brega` | 10 | 13–15 Mar | `brega` | `libyan-civil-war` |
| `battle-of-ajdabiya` | 9 | 15–26 Mar | `ajdabiya` (new) | `libyan-civil-war` |
| `first-gulf-of-sidra-offensive` | 9 | 26–30 Mar | `sirte` | `libyan-civil-war` |
| `third-battle-of-brega` | 10 | 31 Mar – 7 Apr | `brega` | `libyan-civil-war` |
| `fourth-battle-of-brega` | 8 | 14–21 Jul | `brega` | `libyan-civil-war` |
| `battle-of-bani-walid` | 9 | 8 Sep – 17 Oct | `bani-walid` (new) | `libyan-civil-war` |

All seven pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one of them inside `libyan-civil-war`'s
15 February to 23 October at the day; and **lane**, every `P625` in Libya. All
seven filed, so **main stays at 243**, unmoved through fifteen batches and two
curation fires.

### The eight edges, and the ninth the validator refused

Eight edges, all `probable`, every one quoted from the article the record cites
at the revision in its locator. Six chain the seven to each other; two run into
records that were already here, which is A5's own standard:

| from | type | to | where the article says it |
| --- | --- | --- | --- |
| `battle-of-ras-lanuf` | precondition-of | `battle-of-bin-jawad` | Bin Jawad § Battle, rev 1375769079 |
| `battle-of-bin-jawad` | precondition-of | `second-battle-of-brega` | Second Brega's lead, rev 1370735973 |
| `battle-of-bin-jawad` | **enabled** | `second-battle-of-benghazi` | Bin Jawad § Aftermath, rev 1375769079 |
| `second-battle-of-brega` | precondition-of | `battle-of-ajdabiya` | Ajdabiya's lead, rev 1374514977 |
| `battle-of-ajdabiya` | precondition-of | `first-gulf-of-sidra-offensive` | the offensive's lead, rev 1374515970 |
| `first-gulf-of-sidra-offensive` | precondition-of | `third-battle-of-brega` | Third Brega § Background, rev 1370750314 |
| `fourth-battle-of-brega` | precondition-of | `battle-of-sirte-2011` | Fourth Brega § Rebel advance on Sirte, rev 1370619930 |
| `battle-of-tripoli-2011` | precondition-of | `battle-of-bani-walid` | Bani Walid § Background, rev 1374518311 |

**The one `enabled` is the only edge of this batch that claims more than a
sequence, and the article makes the claim itself**: Bin Jawad's § Aftermath
says the battle "marked the end of the rebel advance westward at the time, and
opened the way for a government counter-offensive that took pro-Gaddafi forces
as far as the gates of Benghazi". The gates of Benghazi on 19 March are
`second-battle-of-benghazi`, which this atlas already held.

**A ninth edge was written and the validator refused it, and the refusal is
right.** `2011-military-intervention-in-libya --enabled--> battle-of-ajdabiya`
breaks **rule 4**, the arrow of time: the intervention opens on 19 March and
the battle opens on the 15th. The article's sentence — "On 26 March 2011,
Libyan rebels, backed by extensive allied air raids, seized control of the
frontline oil town of Ajdabiya" — is about the recapture, which falls *inside*
the battle this atlas dates and not before it. An edge cannot say "during", so
there is no edge to write, and the air campaign's part in the recapture is a
fact the record's own summary carries and the graph does not. Rule 4 caught in
one line what a reading of two dates should have caught first; a batch that
reads a vein as a war has to read its own arrows the same way.

### The places, and the ninth hand-correction that became code

Three of the seven reuse `brega` and one reuses `sirte` — `Q162413`, which the
offensive names as its `P276`, is the city and not the gulf, so the reuse is
the import's and not a guess. Three place records are new, each written by the
import from the event item's own `P276`: `bin-jawad` (`Q117564`), `ajdabiya`
(`Q202991`) and `bani-walid` (`Q244230`).

**Each arrived at `precision: point` and each was corrected to `city` by hand,
which makes nine over five batches** — `karameh`, `dien-bien-phu`, `incheon`,
`benghazi`, `ras-lanuf`, `zawiya-libya` and these three. So this fire wrote the
code the stand has named four times. `placeRecord()` now takes the precision
from the item's class, `classify()` returns it the way it returns a category —
the one distinct value the known classes give, null where they disagree — and
**all forty place classes of `data/imports/wikidata-seeds.json` now name one**,
each read off what the class itself means: a settlement is a `city`, a
province, a sea, a river or a mountain range a `region`, a castle, a prison, a
palace or a square a `point`. A class the table gives no precision still writes
`point`, which is what every place on disk carries, so nothing already imported
changes meaning. Two tests, written before the change and failing on it, hold
it: one over the fixtures and one over the real table.

It landed as **its own commit after the batch**, not inside it, for the reason
the stand gave for not doing it sooner: a batch that changes the importer
mid-run stops being reproducible. The seven records above were written by the
importer as it was.

### A12 (4) asked again and got nothing again

**Not one of the seven items carries a `P710`.** That is the second batch
running, and the reason is the same as batch 45's: the Libyan rows name their
participants in prose and not in a property. `noActor` rises by seven, to 416,
and `docs/m53-polities.md` §4.1 is retaken at **374 of 791** with the numerator
where it has stood since M67.

### The counts

| | before | after |
| --- | --- | --- |
| corpus, active | 784 | **791** |
| **main** | **243** | **243** |
| filed | 541 | 548 |
| active edges | 768 | **776** |
| largest connected component | 558 | **565** |
| components | 185 | **185** |
| events with no edge at all | 156 | 156 |
| events with no place | 50 | 50 |
| events naming no actor | 409 | 416 |
| per lane, active | Europe 353, Asia 136, **Africa 132**, Americas 163 | Europe 353, Asia 136, **Africa 139**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | unchanged |

**Components did not move because every one of the seven joined the largest**,
which is what reading a war in date order buys: the component grows by exactly
the size of the batch, seven, and no island is created. The check on the head
of this fire is recorded below.

## Where the run stands after batch 46, for the fire that picks it up

*23 September, 20:07Z onward. An import fire, one batch and one code change, no
merge needed — `origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **791 active** |
| **main** | **243**, unmoved through fifteen batches and two curation fires |
| filed | 548 |
| largest connected component | **565** |
| components | **185** |
| events with no edge at all | **156** |
| events with no place | **50** |
| events naming no actor | **416** |
| per lane, active | Europe 353, **Asia 136**, **Africa 139**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. The standing note is
  unchanged and batch 45's addition to it still holds: run the relations pass
  **over the new records only**, because reading the same articles again
  returns the same rows, *and* read **outward** from the largest component into
  every component that is not it — for each smaller component, the article of
  one record in the largest that names it. This batch's seven are the new ones
  on this lane, and it leaves **no new isolate**: `first-battle-of-zawiya`,
  which batch 45 knowingly left alone, is still the one waiting.
- **`placeRecord()`'s precision is done and the argument it was is closed.**
  Nine hand-corrections over five batches is what it cost to get there; the
  lesson worth keeping is the one the stand wrote and this fire obeyed — the
  code lands *after* the batch, in its own commit, so the batch stays a
  reproducible run of the importer as it was.
- **The Libyan Civil War is finished as a chain and has 22 rows left as a
  list.** What remains under `Q81545` is the western front and the small
  engagements — `Q1042279` Tripoli protests and clashes (8), `Q277176` the
  Nafusa Mountains campaign (8), `Q349968` the Zawiya skirmish (5), `Q2935404`
  the Fezzan campaign (5) and eighteen more at four sitelinks or fewer. **The
  Nafusa Mountains campaign is the one to weigh first and it carries a shape
  worth naming**: it has a `P585` of 18 August 2011 and **no `P580` and no
  `P582` at all**, so A12 (3) dates it as a one-day event on a campaign the
  article runs from April to August. That is not batch 40's narrowing rule —
  nothing is being narrowed — but it is its neighbour: *may a run widen a
  `P585`-only interval from the record's own cited article?* **A7 already says
  yes** for an interval the article widens, and nothing in it distinguishes a
  point in time from a stated span, so a fire may take this one without a new
  rule; it is named here only because no batch has yet done it and the first to
  do it should say so.
- **Batch 40's narrowing rule still blocks three rows.** `Q1535667` Operation
  Artemis, `Q152060` the Cabinda Conflict and `Q107461898` the 2021 Taliban
  offensive all have a `P580`, no `P582`, and a parent that closes before the
  run can say when they ended. Unchanged: *may a run write the end its record's
  own cited article states, where the item states none and the record carries
  `end-unstated`?* Answering it yes unblocks three rows at once and costs one
  clause in A7.
- **A9's first step has never been used and five Yom Kippur War rows still wait
  on it**, unchanged from batch 45's stand: `Q743358` Battle of Latakia (15),
  `Q2072316` the Battle of the Chinese Farm (11), `Q1039366` the Ofira Air
  Battle (11), `Q2705872` the Battle of Baltim (10), `Q2907870` Valley of Tears
  (9). The compromise that needs no new rule is still the narrow one: **where an
  existing place record's own outline or point already contains the event's
  `P625`, reuse it** — `sinai-peninsula` holds four of those five coordinates.
  The Yom Kippur War is now the **largest single vein under one parent after
  Mali's**, 44 unheld rows, and it is Africa and Asia both.
- **The Africa vein is 683 unheld rows over 125 parents and it is not a
  ranking.** Below Libya the veins that read as one war in date order are
  `mali-war` (78 rows), `yom-kippur-war` (44), `somali-civil-war-2009-present`
  (42), `algerian-war` (41), `second-boer-war` (40) and `tigray-war` (40).
  Two batches running have shown what that reading is worth: batch 45 got seven
  edges from six records, this one eight from seven, where batch 44's ranking
  got two from six. **Read a war, not a list.**

### The check, green on the head, and the two browser flakes this fire met

**Run 1575 on `9b80b5e7` is green on its first and only attempt**: validate
clean, the whole suite passing, and the index step skipped because the push is
not a pull request. Runs 1567, 1573 and 1574 were **cancelled rather than red**,
each superseded by the next push of this fire, and 1571 was green.

**Run 1565, on the claim commit, went red, and reading it was worth the
minute it cost.** The commit changed one line of `STATUS.md`, so the diff
cannot have caused it; the failure was `keyboard-browser` 39, the lane walk,
with `End` landing on `fixture-event-deep-1969` where the order the test had
read said `fixture-event-deep-2025`. That is the race the test's own comment is
already about — a century's shard landing repacks the lanes — caught one step
short: M85's A4 waited for *some* bar to have a title, which the first shard
satisfies, and the atlas opens on all of them. The wait is now on the packing
standing still, read twice over a frame, with the order checked against it once
more after it is built. Four consecutive local runs of that suite green, and
`docs/m78-flakes.md`'s `timeline-browser` 214 is the same shape.

Locally, the suites the way the check runs them since M63: **1,791 pure tests
and 279 browser tests, 0 failed and 0 skipped** on the run before the test
change, and the same pure count after it.

**One browser test flaked on the re-run of the whole suite after that change
and this fire did not diagnose it**, which is worth writing down rather than
rounding off: `graph-browser` 24, *"a parent keeps its ring at rest and at
every zoom"*, failed once under the one-at-a-time full run and passed twice
when its suite was run alone, and the assertion itself was not captured. It is
not on the head — run 1575 is green with it — and it is not this batch's, which
wrote no parent and no ring. **A fire that meets it again should keep the
output**: a name and a summary line are not a diagnosis, and this run is not
calling it load.

## Batch 47 — the Russo-Japanese War read as a chain, and the item that dates itself Old Style

*23 September, the fire that picked the run up at 22:33Z. Today already carries
a `## Curation 2026-09-23` section, so this is **not** the curation fire; A12 is
spent, and the batches are what stands in front of the run. A10's order of need
turned over with batch 46: its seven Africa records took that lane to 139 and
**Asia is now the lane that trails, 136 against Europe's 353** — so this batch
is **seven Asia rows and no other lane**, and it is the third batch running to
read one war in the order its own articles put it in rather than to take the top
of a ranking.*

### The vein, asked of the other lane M42 owns

The inverse `part of` vein was run over the **134** Asia-lane active events that
carry an item, against every record of any status on `m42` **and** on
`origin/m42b`: **2,955 rows over 2,566 distinct items, 2,507 of them unheld over
90 parents.** The Asia lane is not the Africa lane's size — where Africa's 125
seeds gave 690 unheld rows, Asia's 134 give 2,507, because these are the wars
English Wikipedia has written most about. `Q8740`, the Vietnam War, names 314 of
them on its own; `Q122962941` the Gaza war 262, `Q124086054` the Gaza genocide
231, `Q179975` the Chinese Civil War 175, `Q182865` the war in Afghanistan 174,
`Q8663` the Korean War and `Q49106` the Second Intifada 137 each.

**The vein was not read as that ranking, and the reason is the method batches 45
and 46 arrived at.** `Q159950`, the Russo-Japanese War, has 74 unheld rows, and
of them the atlas held exactly **two**: `battle-of-tsushima` and
`treaty-of-portsmouth` — the last battle and the paper that closed the war, with
nothing at all in front of either. That is the shape to look for: a war whose
engagements the articles chain to each other in date order, ending in records
already here for the chain to run into. Seven of the 74 are the campaign from
the opening attack to the last land battle, and with them the war runs unbroken
from Port Arthur in February 1904 to Portsmouth in September 1905.

In date order:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `battle-of-port-arthur` | 28 | 8 Feb 1904 | `lushunkou` (new) | `russo-japanese-war` |
| `battle-of-the-yalu-river-1904` | 20 | 30 Apr – 1 May 1904 | `yalu-river` (new) | `russo-japanese-war` |
| `battle-of-nanshan` | 16 | 24–26 May 1904 | `kwantung-peninsula` (new) | `russo-japanese-war` |
| `siege-of-port-arthur` | 27 | 1 Aug 1904 – 2 Jan 1905 | `liaodong-peninsula` (new) | `russo-japanese-war` |
| `battle-of-the-yellow-sea` | 28 | 10 Aug 1904 | `yellow-sea` (new) | `russo-japanese-war` |
| `battle-of-liaoyang` | 22 | 25 Aug – 5 Sep 1904 | `liaoyang` (new) | `russo-japanese-war` |
| `battle-of-mukden` | 29 | 6 Feb – 25 Feb 1905 (Old Style) | `shenyang` (new) | `russo-japanese-war` |

All seven pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one of them inside `russo-japanese-war`'s
8 February 1904 to 5 September 1905 at the day; and **lane**, every `P625` in
Manchuria, Korea or the Yellow Sea. All seven filed, so **main stays at 243**,
unmoved through sixteen batches and two curation fires.

**An eighth was chosen and dropped before the run.** `Q1192118`, the Battle of
Chemulpo Bay (19 sitelinks, 9 February 1904), names `Q125696445` — Jemulpo, the
historical port — as its `P276`, and that item **carries no `P625` at all**. A9
would have reached it and `placeRecord()` would have refused it, *"a place with
no coordinate is a word, not a place"*, leaving the event placeless and in no
lane. The row is not refused for good: it is one of the five shapes the stand
below still names, and the battle is on the record's own coordinate whenever A9's
first step is answered.

### The nine edges, and the one the articles would not support

Nine edges, all `probable`, every one quoted from an article at the revision in
its own locator — which is the revision the sentence was read at and not
necessarily the revision the record's lead was cached at. Seven chain the seven
to each other; **two run into records that were already here**, which is A5's
own standard:

| from | type | to | where the article says it |
| --- | --- | --- | --- |
| `battle-of-port-arthur` | precondition-of | `battle-of-the-yellow-sea` | Yellow Sea § Background, rev 1375165941 |
| `battle-of-the-yalu-river-1904` | precondition-of | `battle-of-nanshan` | Nanshan § Background, rev 1370451314 |
| `battle-of-the-yalu-river-1904` | **enabled** | `battle-of-liaoyang` | Yalu § Significance, rev 1370602766 |
| `battle-of-nanshan` | precondition-of | `siege-of-port-arthur` | Nanshan § Background and § Results, rev 1370451314 |
| `siege-of-port-arthur` | precondition-of | `battle-of-the-yellow-sea` | Yellow Sea § Background, rev 1375165941; Tsushima § Background, rev 1375712462 |
| `battle-of-liaoyang` | precondition-of | `battle-of-mukden` | Mukden § Background, rev 1375786749 |
| `siege-of-port-arthur` | **enabled** | `battle-of-mukden` | Mukden § Background, rev 1375786749 |
| `siege-of-port-arthur` | precondition-of | `battle-of-tsushima` | Tsushima § Background, rev 1375712462 |
| `battle-of-mukden` | **enabled** | `treaty-of-portsmouth` | Mukden's first section, rev 1375786749; Siege § Aftermath, rev 1373678673 |

**The three `enabled` are the only edges here that claim more than a sequence,
and each article makes its claim itself.** The Yalu's § Significance: "With
nothing preventing the Japanese from entering the poorly defended expanses of
Manchuria, Kuroki and other generals involved in the campaign were ordered to
launch a large offensive with a goal of crushing the massing Russian
reinforcements at Liaoyang." Mukden's § Background, on the fortress that had
just fallen: "Though the capture of Port Arthur by General Maresuke Nogi freed
up their 3rd Army, which then advanced north to reinforce the Japanese lines
near Mukden in preparation for an attack... With the arrival of General Nogi's
3rd Army, Japan's entire fighting strength was concentrated at the vicinity of
Mukden."

**`battle-of-mukden --enabled--> treaty-of-portsmouth` is the converging branch
this atlas exists to draw**, and it is why the type is `enabled` and not
`caused`: the atlas already holds `battle-of-tsushima --caused--> treaty-of-portsmouth`,
and both articles put Mukden *beside* Tsushima rather than in its place —
Mukden's own first section says the victory, "coupled with their victory at sea
in the Battle of Tsushima four months later, proved critical in ending the war in
Japan's favour". Two branches into one endpoint, from two different reads, is
the convergence query's whole subject.

**A tenth edge was considered and not written.** The Siege of Port Arthur's
§ Aftermath says "The capture of Port Arthur and the subsequent Japanese
victories at the Battle of Mukden and Tsushima gave Japan a dominant military
position, resulting in favorable arbitration by U.S. President Theodore
Roosevelt in the Treaty of Portsmouth, which ended the war." That sentence would
read as `siege-of-port-arthur --enabled--> treaty-of-portsmouth`, but it says
"and the subsequent victories", which is the path this batch already writes —
the siege into Mukden and Mukden into the treaty. An edge that only restates a
path the same sentence describes adds a line to the picture and nothing to the
argument, so it was left out rather than written for the count.

### `placeRecord()`'s precision code earned itself back in one batch

Seven place records, **every one of them correct as written and not one
hand-corrected.** That is the code batch 46 landed after its own batch doing
exactly what the stand said it would: the precisions come off the class table,
`lushunkou`, `liaoyang` and `shenyang` as `city`, and `yalu-river`,
`yellow-sea`, `kwantung-peninsula` and `liaodong-peninsula` as `region`. Nine
hand-corrections over five batches, then zero in the first batch after the code.

Three classes were added to `data/imports/wikidata-seeds.json` → `classes` for
it, each read off the class item itself over the network and each with its own
note: **`Q34763` peninsula** as `region` — a peninsula is ground and not a point
on it, and larger than a settlement without being a state, which `src/vocab.js`
calls coarse and the map draws wider and fainter; **`Q7930989` city or town**
and **`Q1065118` district of China** as `city`, which are the two classes
`Q623329` (Lüshunkou) names and which agree, so `classify()` reads one precision
and not a disagreement. That is 43 place classes, and
`tests/import-wikidata.test.mjs` holds every one of them to naming a precision
the vocabulary has.

**Four of the seven places are coarse and that is the honest drawing**, not a
gap: a fleet action in the Yellow Sea and a siege sited by the peninsula it was
fought on are not points on the ground, and `PRECISIONS` exists so the map can
say so.

### The two things the item got wrong, and what each cost

**`Q384091` dates itself in the Julian calendar and nothing in the import reads
that.** Both of Mukden's date statements carry `calendarmodel` `Q1985786`, the
proleptic Julian calendar — the Old Style the Russian army reckoned in — so
`P580` 6 February and `P582` 25 February 1905 are thirteen days behind the
Gregorian dates the article gives in its first sentence, "(19 February – 10
March 1905)". `claimTimes()` reads `time` and ignores `calendarmodel`, and
`schema/common/interval.json` defaults a 1905 record to Gregorian, so the days
landed here labelled as something they are not.

What the batch did about it needs no rule and no code: **`when.calendar:
"julian"`**, which is the field the schema already has for exactly this, with
the item's own days left untouched and a `review.note` naming both readings.
Only the integer years drive anything the atlas draws and both readings give
1905, so nothing on the picture moves. **What a fire should not do is take the
article's New Style dates under A7**: that is not a widening, it is the same
span in another calendar, and writing it would have hidden the disagreement
instead of recording it.

**This is the code the stand asks for next, and it is smaller than the
precision one was.** `claimTimes()` should read `calendarmodel` and write
`when.calendar` from it, for the same reason `placeRecord()` should have read
the class: the answer is on the item, the atlas has a field for it, and the
alternative is a hand-correction per record for as long as the run touches
Russian, Ottoman or Balkan dates before 1918 — which the Asia and Europe lanes
are full of. A second, smaller finding rides with it: `claimTimes()` filters on
`snaktype` and **not on rank**, so a `deprecated` statement can be read where a
`normal` one exists. Mukden has both (`P582` 25 February normal, 26 February
deprecated) and the normal one happened to come first; nothing says it always
will.

**`Q1363925`'s English label is vandalised and A12 (5) caught it without being
asked.** The item's `labels.en` reads *"Battle of Port peturth"*; `titleFor()`
prefers `titles.en`, the article title, so the record is `battle-of-port-arthur`
titled "Battle of Port Arthur" and the label was never read. The rule was
written for a disambiguator and it holds for a defacement too, which is worth
one line: the article title is a page somebody watches and an item label is not.

### A12 (4) asked again and got something, for the first time in four batches

**`Q1363925` carries a `P710`** — `Q188712` the Empire of Japan and `Q34266` the
Russian Empire — and this atlas holds an actor for each. Both are written to
`battle-of-port-arthur` as `belligerent`, read as **`japan`** and
**`russian-empire`**, which is how `russo-japanese-war` itself already reads the
same two items: two records of one war disagreeing about which record Japan is
would be worse than either choice. The other six items name no participant the
atlas holds — `Q210800`'s only `P710` is `Q711238`, the Japanese 3rd Army, which
is not a record here. So `noActor` rises by six and not seven, and
`docs/m53-polities.md` §4.1 is retaken at **375 of 798**: the first batch in
four to move that numerator.

### The counts

| | before | after |
| --- | --- | --- |
| corpus, active | 791 | **798** |
| **main** | **243** | **243** |
| filed | 548 | 555 |
| active edges | 776 | **785** |
| largest connected component | 565 | **572** |
| components | 185 | **185** |
| events with no edge at all | 156 | 156 |
| events with no place | 50 | 50 |
| events naming no actor | 416 | 422 |
| per lane, active | Europe 353, **Asia 136**, Africa 139, Americas 163 | Europe 353, **Asia 143**, Africa 139, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 | unchanged |

**Components did not move because every one of the seven joined the largest**,
which is what reading a war in date order buys and what the two edges into
`battle-of-tsushima` and `treaty-of-portsmouth` guaranteed before the batch was
written: both were already in the 565, so the component grows by exactly the
size of the batch and no island is created. `summary-imported` rises by seven,
which is the seven new place records carrying the import's placeholder; A12 (1)
is about events, and all seven events carry their article's lead at a revision.

### The fire spent forty minutes refused by `maxlag`, and the reason is not ours

**Eight runs of `node tools/import/wikidata.mjs --import` were refused, between
one that went through and one that went through.** The first run of this fire
carried the seven event items only, and it created all seven — which is how the
run learned what the tool says in its own comment: *"An event points at a place
record; creating one for it here would be creating a record nobody asked for, so
an event whose location is not already a place of this atlas is placeless and
takes a lane instead."* The seven places have to be asked for by item, in the
same run, because `IMPORT_KINDS` puts places before events and the events then
pick them up. So those seven records were **deleted and the state file restored**
before anything was committed, the seven place items were added beside them, and
the batch is one run of fourteen and not two runs of seven. The eight refusals
are what sat between the two:

```
error: Waiting for wdqs1011: 154.68 seconds lagged.
error: Waiting for wdqs1012: 149.07 seconds lagged.
error: Waiting for wdqs1012: 148.35 seconds lagged.
error: Waiting for wdqs1011: 148.72 seconds lagged.
error: Waiting for wdqs1012: 151.03 seconds lagged.
error: Waiting for wdqs1014: 142.30 seconds lagged.
error: Waiting for wdqs1016: 166.38 seconds lagged.
error: Waiting for wdqs1016: 168.15 seconds lagged.
```

The host in every line is a `wdqs*` — the **query service**, not the entity
database this import reads. Asked directly, `meta=siteinfo&siprop=dbrepllag`
answered `db1209, lag 0.0436` throughout: the database was current and the lag
being reported was the SPARQL service's. The API counts it towards `maxlag` all
the same, answers HTTP 200 with `error.code: maxlag`, and `MAXLAG` here is 5
while `RETRIES` is 4 and `BACKOFF_MS` 2000 — which rides out a spike of seconds
and cannot ride out one of 150. The lag cleared on its own after about forty
minutes and the batch then ran once, whole, in eighteen calls.

**This fire did not change `MAXLAG` and a fire that meets this should not
either.** The comment above it says what it is — *"Neither is required of us;
both are what a good guest does"* — so raising it reverses a politeness the
owner decided on rather than fixing a bug, and that is the owner's to reverse.
What the run may legitimately want is one of two small things, both also the
owner's: a **`--maxlag <seconds>`** flag so a fire says out loud what it is
asking for and the default stays 5, or `retries` and `backoffMs` exposed on the
CLI the way `--budget` already is, so a patient run is a longer wait and not a
different politeness. Until one exists, the answer the protocol already gives
holds: **the fire is hourly and idempotent, so a refused import is a fire that
did nothing, which is a success** — a shell loop that re-runs the whole command
is all it takes, because the tool is additive and carries its own cursor.


## Where the run stands after batch 47, for the fire that picks it up

*23 September, 22:33Z onward. An import fire, one batch and no code change, no
merge needed — `origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **798 active** |
| **main** | **243**, unmoved through sixteen batches and two curation fires |
| filed | 555 |
| largest connected component | **572** |
| components | **185** |
| events with no edge at all | **156** |
| events with no place | **50** |
| events naming no actor | **422** |
| per lane, active | Europe 353, **Asia 143**, **Africa 139**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire after 02:00Z on 24 September is the curation fire**, and it
  owes A11(a) over every event and A13's relations pass. The standing note is
  unchanged through three batches now: run the relations pass **over the new
  records only**, because reading the same articles again returns the same rows,
  *and* read **outward** from the largest component into every component that is
  not it — for each smaller component, the article of one record in the largest
  that names it. This batch's seven are the new ones on this lane, and it leaves
  **no new isolate**: `first-battle-of-zawiya`, which batch 45 knowingly left
  alone, is still the one waiting.
- **`claimTimes()` should read `calendarmodel`, and this is the same argument
  `placeRecord()`'s precision was.** The answer is on the item, the atlas has
  `when.calendar` for it, and the alternative is one hand-correction per record
  for as long as the run touches Russian, Ottoman or Balkan dates before 1918 —
  which both lanes M42 owns are full of. This batch paid it once, on
  `battle-of-mukden`, thirteen days out. The code is a read of
  `datavalue.value.calendarmodel` against `Q1985786` and a key written on `when`;
  a test over the fixtures and one over a real item hold it. Rank rides with it:
  `claimTimes()` filters on `snaktype` and not on rank, so a `deprecated`
  statement can be read where a `normal` one exists. **Land it after a batch and
  in its own commit**, which is the lesson batch 46 wrote and this fire obeyed.
- **A `--maxlag` flag, or `retries` and `backoffMs` on the CLI, is the other
  piece of code the run has now asked for once.** This fire lost forty minutes
  to a query-service lag of 142 to 168 seconds that had nothing to do with the
  database it reads; the section above says why it did not raise `MAXLAG` itself
  and why that is the owner's to decide. A fire that meets the same wall should
  do what this one did: re-run the whole command in a loop, because the tool is
  additive and carries its own cursor, and say so rather than rounding it off.
- **A9's first step has never been used and it now blocks six rows, not five.**
  Batch 45's five Yom Kippur War rows are unchanged — `Q743358` Battle of
  Latakia, `Q2072316` the Battle of the Chinese Farm, `Q1039366` the Ofira Air
  Battle, `Q2705872` the Battle of Baltim, `Q2907870` Valley of Tears — and this
  batch added `Q1192118`, the Battle of Chemulpo Bay (19 sitelinks), which is a
  *different* refusal worth telling apart. The five carry a `P625` and name no
  location at all. Chemulpo Bay **names a location** — `Q125696445`, Jemulpo, the
  historical port — and that location has no coordinate, so A9 reaches step two,
  `placeRecord()` refuses it, and the event is placeless anyway. **Both are
  answered by the same sentence**: may the place pass fall back to the event
  item's own `P625` — before step two where the located item has no point, and as
  step one where there is no location — writing a place named from the event at
  `precision: point`? A12 (2) names `point` *"for a battlefield or site"*, which
  reads as yes; what has stopped a fire doing it unasked is that the place would
  carry the battle's own name. The narrower compromise batch 45 named still
  works for four of the five — reuse `sinai-peninsula`, whose point those
  coordinates sit inside — and does nothing for Chemulpo Bay.
- **Batch 40's narrowing rule still blocks three rows**, unchanged: `Q1535667`
  Operation Artemis, `Q152060` the Cabinda Conflict and `Q107461898` the 2021
  Taliban offensive all have a `P580`, no `P582`, and a parent that closes before
  the run can say when they ended. *May a run write the end its record's own
  cited article states, where the item states none and the record carries
  `end-unstated`?* Yes unblocks three rows at once and costs one clause in A7.
- **The Asia vein is 2,507 unheld rows over 90 parents and it is emphatically
  not a ranking.** The top of it by count is `Q8740` the Vietnam War (314),
  `Q122962941` the Gaza war (262), `Q124086054` the Gaza genocide (231),
  `Q179975` the Chinese Civil War (175), `Q182865` the war in Afghanistan (174),
  `Q8663` the Korean War and `Q49106` the Second Intifada (137 each). **Three
  batches running now say read a war and not a list**, and this one is the
  cleanest case yet for it: 74 rows under `Q159950` of which the atlas held the
  last two and nothing before them, seven taken in date order, nine edges from
  seven records and two of them into what was already here. The veins that read
  the same way next are `Q159950`'s own remainder — the western campaign,
  `Q920679` Shaho (17), `Q1358032` Sandepu (17), `Q702150` off Ulsan (15),
  `Q4538445` the invasion of Sakhalin (14), `Q2619692` Te-li-Ssu (12) and the
  rest of the **67 still unheld** under it, which would finish the war — then `Q8663` the Korean War, whose rows are
  a chain in the same way (`Q484494` Osan, `Q492880` Taejon, `Q18016068` first
  Seoul, `Q482979` the Pusan Perimeter, `Q646336` second Seoul, `Q493313` the
  Ch'ongch'on, `Q277337` Chosin, `Q493922` third Seoul), and `Q159950`'s
  neighbour `Q170314`, the Second Sino-Japanese War, at 92.
- **The Yom Kippur War is still the largest single vein under one parent after
  Mali's**, 44 unheld rows, and it is Africa and Asia both — which is the one
  vein that answers A10 for either lane whichever is trailing when a fire opens.


### One more thing the corpus already knew about deviation 1238

`kerensky-krasnov-uprising` — a record the Wikidata import created, filed in the
Asia lane's neighbour — **already carries `when.calendar: "julian"`**, written by
the curation fire of 23 September (`36b78f9d`, the 277-summary pass) with no note
saying why. So this is the second record of the run to need the field and the
first one to say so: the fire that wrote the first one fixed it silently and the
cause was never recorded, which is exactly how a one-line lookup goes five
batches unwritten. Both records are Russian dates before 1918 and both came in
thirteen days out; the atlas now holds 111 events carrying an explicit calendar
and two of them are `julian`.

### The check went red on the head, and reading it was worth the minutes it cost

**Run 1597 on `5ff9227b` failed on its first attempt, and not on anything this
batch wrote.** `Validate records` passed, the 1,791 pure tests passed 1,791 of
1,791, and then the browser pass came back 280 run, 278 passed, **1 failed and
1 cancelled**. The one that failed is `compose-browser` 1, *"events clicked on
the map become the steps, in the order they were clicked"*, and it failed inside
`withBrowser` at `tests/browser.mjs:239` — the handshake, before any page
content, so no assertion about a record was ever evaluated:

```
not ok 1 - events clicked on the map become the steps, in the order they were clicked
  duration_ms: 60412.922814
  failureType: 'testCodeFailure'
  error: |-
    headless Chromium opened a debugging port, saying: [4991:5012:...ERROR:dbus/bus.cc:405]
    Failed to connect to the bus: Could not parse server address ...
  code: 'ERR_ASSERTION'   expected: true   actual: ~   operator: '=='
```

`exited` is absent from that message, so **Chromium was alive and listed no page
for the full sixty seconds** — which is the shape `tests/browser.mjs`'s own
comment already describes, on this same first test of this same file, four times
before: deviation 1009 at the thirty-second deadline, and three in one evening on
22 September that took the deadline to sixty. The dbus lines are a headless
runner's ordinary noise and appear in green runs too.

**The `cancelled 1` is a consequence of the same sixty seconds and it is the
thing four fires have not written down.** After test 1 burned 60,412 ms, tests 2
to 6 all passed in 40,933 ms, and then the **file** went `not ok` with
`test timed out after 120000ms`. `validate.yml` runs `--test-timeout=120000`,
which bounds the file as well as each test: 60,412 + 40,933 is 101 s before
teardown, so one slow handshake is now enough to put the file over. At the old
thirty-second deadline the same file came in around 71 s. **The wait that was
raised to stop this check going red is what now makes the file time out**, and a
third raise would make it likelier rather than less. That is deviation 1240, with
the shape of the fix — a browser launched once for the file, or the wait moved
out of the first test's clock — and the note that raising `--test-timeout` is the
owner's, because that step's comment says so.

**Measured rather than assumed**, which is what the brief asks of a red check:
the same six tests were run locally three times in a row, one at a time, at the
check's own `--test-timeout`, and passed 6 of 6 each time in **5.8, 6.0 and 6.2
seconds**. The file's own work is seconds; the sixty was all handshake. The whole
suite had already been run locally the way the check runs it — 1,791 pure and 279
browser, 0 failed and 0 skipped — before any of it was pushed.

**The re-run was green on its first and only attempt**, which is the fifth time
this shape has ended that way: 279 browser tests, **279 passed, 0 failed, 0
cancelled, 0 skipped**, and the whole browser pass in 459,893 ms against the
failed attempt's 607,433 ms — the difference is very nearly the sixty seconds
plus the work the timeout cut off. Attempt 1 reported 280 browser tests and
attempt 2 reports 279, and that one is the difference: the extra entry on
attempt 1 *is* the file's own timeout, not a test. Runs 1593 and 1594 were
**cancelled rather than red**, each superseded by the next push of this fire.

That re-run is the one this fire was entitled to and it is spent. A fire that
meets `compose-browser` 1 again should not spend another on it — it should read
deviation 1240 and fix the arithmetic, because five instances is no longer a
flake, it is a bound that is wrong.

## Curation 2026-09-24

*The third curation fire, 02:06Z. A11(a) over every active event and A13's
relations pass beside it; nothing imported. All six A12 passes already carry
their sections in this file, so none was re-run.*

| | before | after |
| --- | --- | --- |
| corpus | 798 active | **798 active** |
| **main** | 243 | **243, unmoved** |
| filed | 555 | 555 |
| active edges | 785 | **792** |
| largest connected component | 572 | **574** |
| components | 185 | **182** |
| events with no edge at all | 156 | **152** |
| events with no place | 50 | **34** |
| events naming no actor | 422 | **422** |
| events opening on the import's placeholder summary | 21 | **12** |
| validator warnings | 494 | **481** |

**Per lane (A10), unchanged in every cell** because nothing was imported:
active Europe 353, Asia 143, Africa 139, Americas 163; main Europe 87, Asia
67, Africa 31, Americas 58. Africa is 139 against Europe's 353, so A10's order
of need does not move.

### The lag, and the endpoint the tool already documents

**The fire opened on the wall the stand after batch 47 named**, and answered it
without touching `MAXLAG`. `wbgetentities` refused every batch with *"Waiting
for wdqs1012: 160.7 seconds lagged"* — a replication lag on the **query
service**, reported on an entity read that never touches it. Waiting it out
cost the previous fire forty minutes; raising `MAXLAG` in
`tools/import/wikidata.mjs` is the owner's, and the stand says so.

Neither was needed. `fetchEntities()`'s own comment already names the way
round: *"Special:EntityData carries the same entity and is not behind that
limit"* — and that endpoint takes no `maxlag` parameter at all. Every Wikidata
read this fire made went through it, one item at a time, four at a time in
flight. 270 items in about two minutes, and `tools/import/wikidata.mjs` is
untouched. **A fire that meets the same lag should do this rather than sleep**;
the code change the stand asks for is still worth having, and is still the
owner's.

### Summaries — and the rule the 23 September fire read the other way

21 active events opened on the import's placeholder. **Nine now open on their
own cited article's lead** and twelve are left, every one of them for the same
reason: no English article at all.

| | |
| --- | --- |
| **written from the article's lead** | **9** |
| left: no English article at all | **12** |

**Eight of the nine are leads of a single sentence, which the last fire
refused.** It counted sentences in the lead and left nine records alone for
having fewer than two — `operation-sutton`, `kaocen-revolt`, `war-over-water`
and the rest. That reading is wrong about where the sentence goes. The
quotation is written **in front of** the import's own placeholder, which stays
behind it: `operation-sutton`'s summary is now *"The English Wikipedia article
"Operation Sutton", at revision 1374609063, opens: "Operation Sutton was the
code name for the British landings on the shores of San Carlos Water, at Ajax
Bay and Port San Carlos, near San Carlos on East Falkland." That is the
article's account and not yet this atlas's…"* followed by the three sentences
the placeholder already carried. A11(a)'s bar is on **the summary** — "absent
or shorter than two sentences" — and the summary is four. What a one-sentence
lead cannot do is *be* the summary; standing at the front of one, it is the
difference between a record that opens on an account of itself and a record
that opens on `Wikidata item Q537052`. So the bar here is one complete
sentence, and that is deviation 1401.

### Places — A9's chain, and the guard the Spanish Empire asked for

50 active events had no place. **Sixteen are placed, fourteen place records are
new, thirty-four are refused.**

| | |
| --- | --- |
| placed, reusing a record already here | 2 (`colombia-q739`, `argentina-q414`) |
| placed, on a record this pass wrote | 14 |
| **at `country` precision** | **12** |
| at `point` precision, from the event's own P625 | 2 (`suipacha`, `the-downs`) |
| at `region` precision | 2 (`central-europe`, `northern-italy`) |
| refused | 34 |

The twelve at `country` are `uruguay-q77`, `bolivia-q750`, `ecuador-q736`,
`mexico-q96`, `france-q142`, `denmark-q35`, `venezuela-q717`,
`holy-roman-empire-q12548`, `french-first-republic`,
`lands-of-the-bohemian-crown` and the two reused. **A12 (2) names `country` and
M80 is on `origin/m0`, so this is the first fire in which the step exists** —
and it is what puts the French Revolution, the Thirty Years' War and six wars
of independence on the map at all.

**The class table says a country is an actor, and that is the table answering a
different question.** `classify()` reads an item to decide what kind of
*record* it becomes, and a sovereign state becomes an actor; A9 asks where an
event happened. Q142 is France the polity to the one and France the ground to
the other. The pass takes `country` precision where the class table says actor
or the link came from `P17`, which is the reading A12 (2) already wrote down.

**The guard, which is the finding.** Q68750, the Mexican War of Independence,
gives `P17` = Q80702, the **Spanish Empire**, whose `P625` is 40.42N 3.68W —
Madrid. Taking it would have drawn a Mexican war in Spain and called it a
reading of the source. So a link is refused where the point's lane disagrees
with the record's own: Q80702 is in the Europe lane and the record is in the
Americas. It is the mechanical half of the rule the 23 September fire wrote by
hand — *"where an item names several locations the pass takes the one the
record's own title names"* — and it costs one row and catches exactly one
error, which is deviation 1402. Every other placement passed it unchanged.

**The thirty-four refusals are all one shape**: no coordinate anywhere on the
chain. Nineteen items name no location and carry no point of their own
(`interwar-period`, `decolonisation-of-africa`, `scramble-for-africa`,
`taif-agreement`, `treaty-of-lhasa` and fifteen more); six reach a located
item that has no `P625` (`italo-turkish-war` → Q1529261 the Tripolitania
vilayet, `wadai-war` → Q1132786, `philippine-american-war` → Q31351948,
`spanish-revolution` → Q6123746, and the two influenza pandemics → Q13780930);
five reach an item of a class `data/imports/wikidata-seeds.json` has not
decided about, listed with their classes in the run's own output; and
`peruvian-war-of-independence` is refused at step one because **a war's span is
not one engagement's**, so its item's centroid is not a place. That last test
is new and is why `colombian-war-of-independence` reached `colombia-q739`
rather than a point called after itself: A12 (2) gives `point` *"for a
battlefield or site"*, and a ten-year war is neither.

### A7 — one interval widened, and the pair that cannot be fixed this way

**`crossing-of-the-andes` was the single day 1817-02-13**, Wikidata's `P585`,
which falls **after** the Battle of Chacabuco of 12 February that its own
article says it led to. The cited article at revision 1374600996 states the
departure — *"departing from Mendoza … in January 1817, the successful crossing
took 21 days"* — so the span is now 1817-01 to 1817-02-13: the start is the
month the article names, the end the day the item gave, and no day the article
does not state has been invented. The edge below then validated.

**`operation-sutton` cannot be corrected from its own article, and the stand
after the 23 September fire assumed it could.** That fire refused
`operation-sutton --caused--> battle-of-san-carlos` on days — the operation
dated 1982-05-23 against a battle dated 1982-05-21 — and named it *"the first
thing an A7 pass over these two should look at"*. The article was read whole:
2,580 characters, and it **gives no date at all**, not in the lead, not in
§ Landings, nowhere outside the infobox the plain-text endpoint does not carry.
A7 is explicit that *"an interval the cited article does not state stays as it
is and stays flagged"*, and the 21 May the pair needs is on the **other**
record's article, not this one's. So the edge stays refused and the record
stays as it is. That is deviation 1403, and what unblocks it is a person, or a
run reading the second article as a source the record does not yet cite — which
is a wider licence than A7 grants.

### A13 — the relations pass

**268 events were the target set**: the 111 added since the last curation fire,
and the 226 that sit outside the largest connected component, which is where
the pass is worth running — reading the same article twice returns the same
row, and the stand after batch 47 says so. **253 articles were read whole**
from the action API at their current revision, fifteen refused for having no
English article. Matching used the 23 September fire's corrected matcher: a
name has to stand on its own, with no word character and no joining dash on
either side, and a name under eight characters or shaped like a bare day and
month is not a name.

| | |
| --- | --- |
| articles read whole | **253** |
| pairs where a causal cue and another event's name share a sentence | **90** |
| pairs the atlas already holds an edge for | 24 |
| fresh pairs to read | **66** |
| **edges written** | **7** |
| edges disputed | **2** |
| largest component | 572 → **574** |

**The seven, all quoting the sentence that carries the claim:**

| edge | type | read at |
| --- | --- | --- |
| `war-of-attrition` → `operation-badr-1973` | precondition-of | Operation Badr's lead |
| `partition-of-india` → `india-pakistan-war-of-1971` | precondition-of | § Background |
| `operation-turquoise` → `first-congo-war` | precondition-of | § Implementation |
| `russo-japanese-war` → `revolution-in-the-kingdom-of-poland` | precondition-of | § Background |
| `wiriyamu-massacre-1972` → `carnation-revolution-1974` | precondition-of | the Mozambican war's § Portuguese counter-offensive |
| `crossing-of-the-andes` → `battle-of-chacabuco` | caused | § Conclusion |
| `prelude-to-the-russian-invasion-of-ukraine` → `full-scale-russo-ukrainian-war` | precondition-of | lead and closing narrative |

Six are `precondition-of` and one `caused`, every one at `probable`, which is
what A2 allows through Wikipedia. The Wiriyamu one is the fire's best: the
atlas already held the Mozambican war into the Carnation Revolution, and the
article names the massacre **separately** — *"Combined with the news of the
Wiriyamu Massacre and that of renewed FRELIMO onslaughts through 1973 and early
1974, the worsening situation in Mozambique later contributed to the downfall
of the Portuguese government in 1974"* — so the massacre now reaches the
revolution on its own and not only through its parent.

### The two edges the articles contradict, which is A13's other half

**A13 asks that where an edge exists and the article contradicts its type or
direction, the edge gets `disputed` and a note, never a silent change. Two
did, and both are direction.**

- **`libyan-civil-war --reacted-to--> 2011-military-intervention-in-libya`.**
  `A --reacted-to--> B` reads "A reacted to B" on the card, and the
  intervention's own article opens: *"On 19 March 2011, a NATO-led coalition
  began a military intervention into the ongoing Libyan Civil War to implement
  United Nations Security Council Resolution 1973."* The intervention answered
  the war. The record says the war answered the intervention.
- **`sierra-leone-civil-war --reacted-to--> second-liberian-civil-war`.** The
  Sierra Leone war is 1991–2002 and the Second Liberian war 1999–2003; a war
  that began in 1991 cannot have reacted to one that began in 1999, and the
  Liberian article puts the influence the other way round — Taylor *"supporting
  rebel groups such as … the Revolutionary United Front in the Sierra Leone
  Civil War"*. **Rule 4 passed this edge** because it compares start bounds and
  1991 is before 1999, which is the very thing that makes the claim impossible.

Neither is turned round. Each carries a `dispute` with the articles at their
revisions and `a13-contradicted` in its flags, and what the pair actually wants
is a reviewer's judgement about which record the edge should run between.

**The positional test the last fire retired stayed retired.** It read word
order as direction and returned two false hits out of 675 edges; this fire
compared the held edge's own semantics against the articles instead, which is
what found these two.

### The refusals, which are the load-bearing half

**Six of the seven edges above came out of these 66 pairs** — the seventh,
`prelude-to-the-russian-invasion-of-ukraine`, came from the isolate pass below
— so **60 of the 66 were refused**, in six kinds, and the counts are the
classification and not an estimate:

- **Twenty-one for touching an umbrella**, at either end — batch 31a's rule,
  now 18 records wide. The cost is the same links as before and rising:
  `scramble-for-africa` → `world-war-i` from the Scramble's § Aftermath,
  `decolonisation-of-africa` → `world-war-ii` from § External causes,
  `indochina-wars` → `geneva-conference`, `interwar-period` →
  `second-italo-ethiopian-war`, `arab-spring` → `iraq-war`. **Five of the
  twenty-one would join continents**, and what would have to change is the
  records and not the edges.
- **Twenty for being a part and not a consequence.** `battle-of-inchon` and the
  Korean War, `reign-of-terror` and the French Revolution,
  `war-of-the-mantuan-succession` and the Thirty Years' War in both
  directions: `parent` already says it, and an edge is an argument that one
  thing brought about another.
- **Eight because the sentence's subject is not the record.** The clearest is
  `siege-of-port-arthur`'s § Aftermath — *"The loss of the war in 1905 led to
  major political unrest in Imperial Russia"* — whose subject is the war and
  not the siege; the atlas already holds `russo-japanese-war --caused-->
  russian-revolution-of-1905`. `italo-turkish-war` offered the Second Balkan
  War from a sentence about the First Balkan War's victors, and the atlas holds
  that edge too. `ituri-conflict` offered the First Congo War from a sentence
  whose cause is a refugee influx; `mexican-war-of-independence` offered
  Saint-Domingue from a sentence about the French Revolution, an edge the atlas
  also already holds; and `closure-of-the-suez-canal-1956-1957`,
  `venezuelan-war-of-independence`, `atlantic-revolutions` and
  `battle-of-breitenfeld-1631` each name a subject — the canal, a conspiracy, a
  declaration, a brigade's reform — that is not either record.
- **Four on the arrow of time**, of which `allied-invasion-of-sicily` →
  `eastern-front` is the shape: the article states an effect *inside* a war
  that began two years earlier, which an edge between two records cannot say.
  `operation-sutton` → `battle-of-san-carlos` is the pair A7 cannot fix,
  above; `operation-unified-protector` and `peruvian-war-of-independence` are
  the other two.
- **Three that are a comparison, or no claim between the two at all** —
  `war-in-darfur` and the Rwandan genocide (*"led to comparisons with"*),
  `black-monday` and the Great Depression (*"sparked fears of … a reprise"*),
  `herero-wars` and the First World War (a date, not a consequence).
- **Two that are chronology with no claim in it** — the 23 September fire's
  largest refusal class, and *"following the"* is still what marks it:
  `insurrection-of-31-may-2-june-1793` placed after the insurrection of 10
  August in a list of three, and `tennis-court-oath` *"preceded the Storming of
  the Bastille in July, the abolition of feudalism in August, and the
  Declaration of the Rights of Man"* — an enumeration of what came next, which
  is not the `preceded` A13 means.
- **One namesake, twice**: `unified-task-force` and
  `united-nations-operation-in-somalia-ii` both reach a "Somali Civil War" the
  article means as the war of 1991, where the atlas holds only the record for
  2009 onward.

### The isolates, read outward, and what 152 edgeless events actually are

The stand asks a fire to read outward from the largest component. It was read
two ways and the second is the useful one.

**By Wikidata's own causal properties**: all 152 edgeless events with an item
were fetched and `P828`, `P1542`, `P155`, `P156`, `P361` and `P527` read for an
item the atlas holds. **174 candidate rows, and 167 of them — 146 `P361` and 21
`P527` — say "part of" in one direction or the other**, which in this atlas is
`parent` and never an edge. Of the seven that do not, six are `P155`/`P156`,
"follows" and "followed by": three are Portuguese presidential elections in
sequence, two are `interwar-period`'s own bracketing by the two world wars and
are refused for the umbrella, and the sixth,
`prelude-to-the-russian-invasion-of-ukraine P156
full-scale-russo-ukrainian-war`, is the seventh edge above. **The single row
that is an outright causal claim is refused**: `battles-of-khalkhin-gol P1542
molotov-ribbentrop-pact` is a claim the item makes and the **article never
states** — Molotov and Ribbentrop do not appear in it at all — and it is the
cleanest example this run has of why A2 asks for the prose and not the pointer.

**And then the measurement that reframes the number.** Of the 152 events with
no edge, **142 are filed under a parent**: they are in the picture, reachable
from the umbrella a reader opens, and absent only from the causal graph. **Ten
of the remaining eleven are umbrellas themselves**, which batch 31a's rule
forbids an edge on at either end — `afghan-conflict`, `arab-spring`,
`atlantic-revolutions`, `decolonisation-of-africa`, `indochina-wars`,
`interwar-period`, `italian-wars`, `nova-republica-brazil-since-1985`,
`scramble-for-africa`, `third-portuguese-republic-since-1974`. **Exactly one
active event has neither an edge nor a parent: `rhodesian-bush-war`**, and this
fire could not fix it either way. Its `P361` says part of
`decolonisation-of-africa`, whose span ends 1976 against a war that runs to
1979, so the filing is outside the parent; and its article's best sentence —
*"In April 1974, the left-wing Carnation Revolution in Portugal heralded the
coming end of colonial rule in Mozambique … Such events proved beneficial to
ZANLA and disastrous for the Rhodesians, adding 1,300 kilometres (800 mi) of
hostile border"* — describes an escalation inside a war that began in 1964, ten
years before the revolution, which rule 4 refuses and rightly. That is
deviation 1406: **"156 isolates" was never 156 events nobody can reach**, and a
fire chasing the number rather than the reachability was chasing 142 records
that are already filed.

### P710 — 194 eligible, nothing written, and the rule tightened

422 active events name no actor. **194 carry a category the vocabulary has a
role for** — `war` is a `belligerent`, `treaty` a `signatory` — and every one
of them was read.

| | |
| --- | --- |
| the item names no participant | **118** |
| participants the atlas holds none of | **68** |
| a partial list, withheld | **8** |
| **written** | **0** |

**Nothing was written, and the reason is a rule this fire tightened.** Seven of
the eight partial lists hold one participant out of two to fifteen — the Thirty
Years' War would have named Sweden and nobody else. The eighth passed a
two-party floor and is why the floor is not the rule: `spanish-american-wars-of-independence`
holds three of seven — Chile, Peru and Bolivia — and **all three are on the
independence side**, the Spanish Empire being Q80702, an item the atlas does
not hold. A list whole on one side reads as the war's parties and names one
party. **So a belligerent or signatory list is written only where the atlas
holds every participant the item names**, which is deviation 1404 and one step
past the 23 September fire's filing check, because that check does not see a
list that is complete on one side.

**The import's own name matching adds nothing here**, measured rather than
assumed: every unmatched participant was folded with `foldName()` against every
name of every active actor, and **not one** produced a single surviving
candidate. The 68 are 68.

### Parents (A6, A8) — nothing filed, and why the Asia lane cannot be a subject

The 18 umbrellas were measured against the 243 main events. A lane-and-span
filter returns **119 candidates and almost all of them are nonsense** —
`1948-czechoslovak-coup-d-etat` under the Estado Novo, `covid-19-pandemic`
under the Afghan conflict — because for a **polity** umbrella the subject is
the polity and the lane says only which continent. That is the reading the
second-parents pass already corrected: *"the subject test now is the lane **or**
an actor the umbrella itself names"*.

Taken properly, over the five umbrellas that are periods of a region, the pass
filed **nothing**, and each refusal is a reading:

- **`decolonisation-of-africa`**: `closure-of-the-suez-canal-1956-1957` and
  `first-sudanese-civil-war`, both already refused by the second-parents pass
  and for the same reasons — the one belongs to the Arab–Israeli conflict, the
  other is a civil war inside an already independent Sudan.
- **`interwar-period`**: `german-revolution-of-1918-1919` is M67's rule 1, the
  act that created the period's own republic; `polish-ukrainian-war` begins
  **1918-11-01**, ten days before the armistice the period starts at, so it
  began while the First World War was still being fought.
- **`arab-spring`**: `2011-south-sudanese-independence-referendum` is the
  Sudanese peace process and `mali-war` is not an Arab state's rising; the
  Arab Spring article lists neither.
- **`scramble-for-africa`**: no main event inside the span and the lane at all.
- **`indochina-wars`**: **eighteen candidates and not one in Indochina** —
  the Korean War, the partition of India, the Cultural Revolution, two
  influenza pandemics. **The Asia lane is one lane for a continent**, so it
  cannot stand in for the subject of an Asian umbrella the way the Europe lane
  can for a European one. That is deviation 1405, and it is the reason A6's
  span-and-lane test has produced nothing in Asia in three fires.

### Where the index was rebuilt, and the commit it cost

**Deviation 1227 was met again and cost one commit.** The index was built
before the records were committed, so `history-*` shards named the wrong
commits and `validate --index` returned **nine errors on a pushed head** —
manifest, four missing and four stale history shards. `tools/lib/history.mjs`
builds each record's versions from the commits that touched its file, so the
order is records first, commit, **then** build and commit the index. The
second build was byte-identical to a fresh one and the head is clean. A fire
that writes records should read deviation 1227 before it builds.

### The check and the suite

Run locally the way the check runs it since M63, before anything was pushed,
and again on the final tree: **1,791 pure tests, 1,791 passed, 0 failed, 0
skipped**, and **279 browser tests one at a time at `--test-timeout=120000`,
279 passed, 0 failed, 0 cancelled, 0 skipped**. `compose-browser` 1 — the test
of deviation 1240 — passed both times.

**On the branch: run 1610 on `8b5185c3`, which carries every record this fire
wrote, passed, and run 1617 on `5d0d964b` passed — both on their first
attempt.** Runs 1614 and 1615 were cancelled rather than red, each superseded
by the next push of this fire. **The fire spent no re-run**, so the one
deviation 1240 entitles it to is unspent for whoever meets `compose-browser` 1
next; the stand after batch 47 asks that it be spent on the arithmetic rather
than on another attempt.

## Where the run stands after the curation fire of 24 September, for the fire that picks it up

*24 September, 02:06Z onward. A curation fire: no import, no code change, no
merge needed — `origin/m0` was already an ancestor of `m42` at claim time.*

| | |
| --- | --- |
| corpus | **798 active** |
| **main** | **243**, unmoved through seventeen batches and three curation fires |
| filed | 555 |
| largest connected component | **574** |
| components | **182** |
| events with no edge at all | **152** — of which **142 are filed under a parent**, 10 are umbrellas, and **one** (`rhodesian-bush-war`) is neither |
| events with no place | **34** |
| events naming no actor | **422** |
| per lane, active | Europe 353, **Asia 143**, **Africa 139**, Americas 163 |
| per lane, main | Europe 87, Asia 67, Africa 31, Americas 58 |

**What is open, in the order a fire should weigh it:**

- **The next fire is an import fire** (A12's six passes all carry their
  sections), under A10's order of need: **Africa 139 and Asia 143 against
  Europe's 353**. The veins the stand after batch 47 named are unchanged and
  still the cleanest: `Q159950`'s remaining **67 unheld rows** would finish the
  Russo-Japanese War — the western campaign, `Q920679` Shaho (17), `Q1358032`
  Sandepu (17), `Q702150` off Ulsan (15), `Q4538445` the invasion of Sakhalin
  (14), `Q2619692` Te-li-Ssu (12) — then `Q8663` the Korean War, whose rows are
  a chain in the same way, then `Q170314` the Second Sino-Japanese War at 92.
  The Yom Kippur War's 44 unheld rows are Africa and Asia both.
- **Read the lag through `Special:EntityData`, not through a sleep.** The
  section above is the whole of it: `fetchEntities()`'s own comment names the
  endpoint, it carries no `maxlag`, and 270 items took two minutes where the
  previous fire lost forty. The code changes the stand asks for — `claimTimes()`
  reading `calendarmodel` and rank (deviations 1237–1239), and a `--maxlag`
  flag — are still worth having and still the owner's.
- **A9's first step is no longer blocked in general, and is blocked in
  particular.** `suipacha` and `the-downs` are the first two places written
  from an event's own `P625` by rule rather than by hand, at `point` precision
  and named after the locality the title names, which is `ap-bac`'s shape. The
  test that makes it safe is that the record's own span must be one
  engagement's. **Batch 45's five Yom Kippur War rows still fail** — Q743358
  Latakia, Q2072316 the Chinese Farm, Q1039366 Ofira, Q2705872 Baltim,
  Q2907870 Valley of Tears — because each is a battle whose title names no
  locality to call a place after (*"Battle of the Valley of Tears"* names a
  place; *"Ofira Air Battle"* does not fit the pattern the pass matches), and
  `Q1192118` Chemulpo Bay still fails at step two. **The narrower question for
  the owner is now one line: may a place written from an event's own point be
  named after the event where its title names no locality?** Four of the five
  are still answered by reusing `sinai-peninsula` instead.
- **Batch 40's narrowing rule still blocks three rows**, unchanged: `Q1535667`
  Operation Artemis, `Q152060` the Cabinda Conflict and `Q107461898` the 2021
  Taliban offensive all have a `P580`, no `P582`, and a parent that closes
  before the run can say when they ended. *May a run write the end its record's
  own cited article states, where the item states none and the record carries
  `end-unstated`?*
- **The umbrella rule now costs twenty-one readings a fire and five of them
  would join continents.** `world-war-i → world-war-ii`, `world-war-ii →
  decolonisation-of-africa`, `scramble-for-africa → world-war-i`,
  `indochina-wars → geneva-conference`, `arab-spring → iraq-war`: every one
  argued from an article's own § Aftermath or § Causes, every one refused
  because one end is a period this run made an umbrella of. Three fires have
  now reported the same cost. **What would have to change is the records** — a
  period that is also a cause wants to be two records, or the rule wants an
  exception a person writes.
- **`rhodesian-bush-war` is the one active event with neither an edge nor a
  parent**, and the section above says why neither is available from its own
  article. It wants a person, or the Mozambican independence record the atlas
  does not hold.
- **The P710 vein is spent until the actor corpus grows.** 118 of 194 items
  name no participant at all, and the 68 that name unheld ones produced **zero**
  name-fold candidates. What would move it is actors, not another pass.
- **Take the next deviation number above 1400, not the next after
  `STATUS.md`'s last.** `m42` and `m42b` have been handed the same sentence
  since A11(b) split lane B in two, and on 24 September both had 1240 as their
  last: this fire wrote 1241–1246 and `origin/m42b` had already written
  **1241–1251** for different findings. The six were moved to **1401–1406**
  and deviation **1407** proposes the split — `m42` from 1400 upward, `m42b`
  continuing the shared sequence. It is a proposal the assistant may overrule,
  but a fire that ignores it re-collides the same day.

## A14 (1) — the fifteen intervals, read off the leads already on disk

*24 September, the 04:58Z fire. No import, no network: every span below was
read from `tools/import/cache/wikipedia/`, the same file the record's own
summary quotes, at the revision that file carries.*

The 23 September A7 pass reported *"no record's cited article states a wider
span than the record carries"* and the 24 September review found fifteen where
it does. The pass was reading the item, not the lead. This one reads the lead:
for each of the fifteen, the first sentence of the cached article (or, for
three of them, the article's own title, which is part of the same revision) is
the authority, the clause that states the span is written into a
`wikipedia-en` locator beside the citation already there, and `review.note`
says what the span was, what the article says and what was left alone. Every
quote was checked against the cache before anything was written; a quote the
cache does not hold would have stopped the pass.

| record | was | now | the clause |
| --- | --- | --- | --- |
| `cambodian-vietnamese-war` | 1989–1991 | **1978–1989** | "an armed conflict from 1978 to 1989" |
| `rif-war` | 1911–1927 | **1921–1926** | "fought from 1921 to 1926" |
| `wadai-war` | 1906 | **1906–1912** | "from 1906 to 1912" |
| `great-depression` | 1929–1941 | **1929–1939** | "a severe global economic downturn from 1929 to 1939" |
| `la-violencia` | 1949–1958 | **1948–1958** | "a ten-year wave ... from 1948 to 1958" |
| `south-sudanese-civil-war` | 2013–2020 | **2013–2018** | "fought from 2013 to 2018" |
| `tambov-rebellion` | June 1921 | **1920–1922** | "The Tambov Rebellion of 1920–1922" |
| `indochina-wars` | 1946–1989 | **1945–1991** | "waged in Indochina from 1945 to 1991" |
| `first-italo-ethiopian-war` | 1894–1896 | **1895–1896** | "fought between Italy and Ethiopia from 1895 to 1896" |
| `the-holocaust-in-romania` | 1941–1943 | **1940–1944** | "between 1940 and 1944" |
| `massacres-of-poles-in-volhynia-and-eastern-galicia` | 1942–1944 | **1943–1945** | "from 1943 to 1945" |
| `insurgency-in-kosovo` | 1998-02-28 alone | **1995–1998** | title "(1995–1998)"; "began in 1995" |
| `darfur-genocide` | 2003–2008 | **2003–2005** | title "(2003–2005)"; "killed between 2003 and 2005" |
| `1957-1958-influenza-pandemic` | 1956–1958 | **1957–1958** | "The 1957–1958 Asian flu pandemic" |
| `2011-bahraini-uprising` | 2011–open | **2011–2014** | "from 2011 until 2014" |

**Counts.** 15 records rewritten, all `active`, all flagged `a7-widened`; 15
locators added. Eleven spans are wider than they were and four narrower —
`rif-war`, `south-sudanese-civil-war`, `darfur-genocide` and
`first-italo-ethiopian-war`, where the record held the campaigns or the
aftermath around the thing and the article holds the thing. **No edge fails
rule 4 after them, so none was disputed and none dropped**; the validator goes
from 493 warnings to **492** (0 errors), the one lost being
`span-vs-article-title` on `darfur-genocide`. Corpus unchanged: **858 active,
242 main, 616 filed, 843 edges, largest component 609**.

**Eight days go with the dates that carried them**, because the article gives
the bound no day: `cambodian-vietnamese-war` (both), `rif-war` (both),
`la-violencia`, `south-sudanese-civil-war` (its end), `tambov-rebellion`
(both), `first-italo-ethiopian-war` (its start) and `insurgency-in-kosovo`
(its start). A day is kept only where it still marks the bound the article
states: Wall Street on 29 October 1929, Addis Ababa on 23 October 1896,
Juba on 15 December 2013, Darfur on 23 February 2003, the Pearl Roundabout on
14 February 2011, and 28 February 1998, which the Kosovo article puts in the
month it names as the insurgency's close.

**Deviation 1408.** *The schema's limits are what a quoted locator is written
to, not an afterthought.* A locator is 200 characters and a review note 500;
the first draft of this pass quoted whole first sentences and wrote nine
`rule 1` errors before a byte of it was believed. The pass now checks both
lengths itself and refuses rather than writing, and quotes the clause that
states the span instead of the sentence around it. A quoted clause is still
verbatim and still findable in the article; a truncated one would not be.

**`2011-bahraini-uprising` is closed here and not in A14(6)**, which asks for
the same record under the same rule. Its section says so, and the record's own
note says it takes no `end-unstated` flag.

## A14 (2) — the lane guard over the 566 places A9 wrote before it

*24 September, the 04:58Z fire. No import, no network: the guard is
`deriveRegion` over the place records already on disk.*

Deviation 1402 added a guard to A9 on 24 September — *the pass refuses a link
whose point falls in a different lane from the record's own* — after `P17`
offered Madrid for the Mexican War of Independence. It was added after 410
places had been written on 22 September and never run over them. This pass
runs it over all of them: **566 `a9-place` events carry a place; 6 fail; 6
places cleared, every `region` kept.** They are the six the review named, and
no seventh.

| event | its lane | the place it had | the place's lane |
| --- | --- | --- | --- |
| `great-depression` | americas | `afghanistan-q889` | asia |
| `1948-arab-israeli-war` | asia | `sinai-peninsula` | africa |
| `yom-kippur-war` | africa | `near-east` | asia |
| `japanese-instrument-of-surrender` | asia | `uss-missouri` | americas |
| `execution-of-the-romanov-family` | asia | `ipatiev-house` | europe |
| `ilinden-preobrazhenie-uprising` | asia | `monastir-vilayet` | europe |

**Counts.** 566 scanned, 6 cleared, 0 errors; warnings go from 492 to **496**,
the four new ones being `place-unused` on `ipatiev-house`,
`monastir-vilayet`, `near-east` and `uss-missouri`, which no event cites now.
Each of the six keeps its lane, takes the flag `a14-lane-guard` in place of
`a9-place`, and says in `review.note` what it had and why it went. Corpus
unchanged: **858 active, 242 main, 616 filed, 843 edges, largest component
609**. The scan is now clean: re-run, it reports nothing.

**Four of the six are what the guard is for.** The Great Depression was drawn
in Kabul, the first of the nine countries `Q8698` names under `P17`. The
Japanese Instrument of Surrender was drawn at the `uss-missouri`'s berth in
Pearl Harbor, in the Americas lane, for a signing in Tokyo Bay — the same
defect one step further on, because a ship's `P625` is where the ship is now.
The 1948 war sat on the Sinai, which is one front and not the war; the Yom
Kippur War sat on the `near-east`, which is the other front and not the war
either.

**Deviation 1409.** *Two of the six failed on the lane polygon, not on the
place, and the guard cannot tell the difference.* `ipatiev-house` is exactly
where the Romanovs were shot, and Yekaterinburg is east of the Urals, so the
disagreement is between `data/geo/regions.json`'s Europe–Asia boundary and the
lane the event's own point was given at import — not between the record and
the world. `monastir-vilayet` is exactly where the Ilinden uprising was, and
there the record's **own** lane is the wrong half: `asia`, from the Ottoman
point the import read, against an uprising in Macedonia. The guard is
mechanical and was run as A14(2) writes it, so both places are cleared and
both lanes kept — which in the Ilinden case leaves a Macedonian uprising in
the Asia lane with no place at all, a worse picture than the one it replaced.
**The narrow question for the owner is one line: where the guard fires, which
of the two does it clear — the place, always, or the one that disagrees with
the record's title?** A fire cannot decide that without a rule; what it can do
is not hide it, which is this paragraph.

**What this does not touch.** The 21 country-placed events whose place appears
nowhere in their title or summary (review finding 1) pass the guard, because
their place is in the right lane; `world-war-ii` at `russia` is the example
the review gives. That is the owner's question — *may a multi-valued `P17`
place an event at all* — and not this pass's.

## A14 (3) — the evidence put on disk at the revision it is cited at

*24 September, the 04:58Z fire. The only pass of this fire that leaves the
sandbox: 1,014 revisions resolved to their items through `api.php`, 357 leads
fetched through the REST summary endpoint.*

The 24 September review, finding 5: *"the evidence the last two days cite is
not on disk"* — the curation fires read whole articles live at the current
revision, cited that revision, and never refreshed the cache, so 118
citations named a revision `tools/import/cache/wikipedia/` did not hold and
several hundred more named an article it had never seen. A citation whose
revision only exists on Wikipedia's servers is checkable, but not by
`review.html` offline, and not by the next fire, which re-fetches what the
last one already read.

**The endpoint.** `summaryUrl()` in `tools/import/wikidata.mjs` uses
`/api/rest_v1/page/summary/{title}`; the same endpoint takes a revision as a
second path segment, `/{title}/{revid}`, and answers with the same envelope —
`extract` and `revision` — at that revision. So the text that lands is the
same shape as the 1,069 leads already on disk, written by the same code path,
and no second shape enters the cache. The action API is used for one thing
only: which Wikidata item each cited revision belongs to, 50 revisions a call,
because the cache is filed by item.

**Two sweeps, because the first chose badly.** The first cached, per item, the
best of the revisions it still had to fetch — and an article cited at two
revisions, one of them already on disk, could lose the one on disk. The second
counts every citation of every article first and caches the revision the most
citations name, ties to the later, which is the fewest citations left pointing
at text the cache does not hold.

| | before | after |
| --- | --- | --- |
| article references in `wikipedia-en` citations on active records | 1,927 | 1,927 |
| **cached at the revision cited** | 1,342 | **1,854** |
| cached only at another cited revision of the same article | 578 | **72** |
| the cache has never seen | 6 | **0** |
| locators naming no article | 1 | 1 |

**Counts.** 357 cache entries written (323 in the first sweep, 34 in the
second), 0 refused, 0 revisions the API could not place. Nothing under `data/`
changed, so the corpus, the index and the validator are exactly where A14(2)
left them: **858 active, 242 main, 616 filed, 843 edges, largest component
609, 0 errors, 496 warnings**.

**Deviation 1410.** *The summary endpoint answers with `revision` as a string,
and a pass that believes `Number.isInteger` refuses all 323 of its own
fetches.* `fetchLeads()` has coerced it since the import was written —
`Number.isInteger(body?.revision) ? body.revision : Number(body?.revision)` —
and this pass reimplemented the check without the coercion, wrote nothing, and
reported *"no extract at that revision"* 323 times for 323 good answers. A
pass that writes nothing and blames the source is the failure mode worth
naming: the first reading of that report was that the endpoint has no
summaries at old revisions, which one `curl` disproved.

**The 72 that are left are the cache's shape and not this pass's reach.** They
are 59 articles that two or more records cite at different revisions — `Great
Depression`, `World War I`, `Algerian War` and `Gaza war` at five each — and
the cache holds one lead per item per language, so one of the revisions must
lose. Which one it is is now the most-cited rather than the last written.
Making it hold more is a change to `schema/v1/wikipedia-lead.json` and to how
the file is named, which the review itself puts to the owner.

**Six citations name a title the cache files under another name** and are
*not* among the 72: the lead is on disk at exactly the revision cited, under
the article's own title. `battle-of-musa-dagh` cites "Musa Dagh Resistance"
and the article is "Musa Dagh"; `eritrean-civil-wars` cites "Eritrean Civil
Wars" and the article is "Eritrean War of Independence"; likewise
"Moncada Barracks", "Indo-Pakistani war of 1971" and "Revolution in the
Kingdom of Poland (1905–1907)". A reviewer following the revision lands in the
right place; a reader following the title does not. Correcting a locator is
correcting what a record says it read, which is a reading and not a sweep, so
this pass leaves them and names them.

## A14 (4) — the three A13 edges corrected, and the eleven "Following" quotes read again

*24 September, the 04:58Z fire. No import: every sentence below was already
in the record it is quoted in, and A14(3) has just put every one of the cited
revisions on disk.*

The 24 September review read ten of the 63 `a13-relations-pass` edges in full
and found five sound, one mistyped, two at the wrong endpoint and two
chronology, and named eleven more whose quote opens "Following", "After" or
"In the aftermath" — the fire's own refusal class.

**The three named.**

- `great-depression--siamese-revolution-of-1932` was `caused` on a quote that
  says *"contributed to"*, which the same fire typed `precondition-of`
  elsewhere and said why. Retyped through `tools/migrate/ids.mjs`, which is
  the one thing that tool will do to a derived id — *"only the type may be
  corrected here"* — so the former id stays in `aliases` and a link shared
  yesterday still resolves.
- `six-day-war--bangladesh-liberation-war--inspired` rested on *"The attack
  was modeled on the Israeli Air Force's Operation Focus during the Six-Day
  War"*, which is the Pakistani pre-emptive strike of 3 December 1971 — the
  opening of the Indo-Pakistani war, not of a liberation war already nine
  months old. `ids.mjs` refuses to move an end, and rightly: an edge with
  another end is another record. So the old edge is **withdrawn with its
  reason** and `six-day-war--india-pakistan-war-of-1971--inspired` carries the
  same quote and the same citation.
- `february-revolution--russian-civil-war--caused` is right and its label was
  not: the explanation said *"the civil war's own lead"* where the locator
  says, correctly, the February Revolution's. Only the article the explanation
  names is changed.

**The eleven, under one test.** A13 asks for an edge *where the article states
that one caused, enabled, preceded or reacted to the other*. So: does the
quoted sentence name both ends, or state the relation between them? "Following
X, Z happened", where Z is not the `to` record, is the article stating what
followed X — and the edge is the run's own inference from it. **Nine fail that
test and are withdrawn; two pass and stay.**

| kept | why |
| --- | --- |
| `soviet-afghan-war--afghan-civil-war-q1980081` | *"…leading to the toppling of the government by the mujahideen in 1992 and the start of a second Afghan Civil War"* — names the `to` and states the chain |
| `world-war-i--treaty-of-lausanne` | *"…a war that eventually resulted in a massive population exchange between the two countries under the Treaty of Lausanne"* — names both ends |

| dropped | what the sentence actually says followed |
| --- | --- |
| `boxer-rebellion--soviet-japanese-border-conflicts` | Russia and Japan "vying for control" — the rivalry of 1904, 33 years short |
| `first-sino-japanese-war--soviet-japanese-border-conflicts` | the same sentence, 38 years short |
| `february-revolution--execution-of-the-romanov-family` | the Romanovs "imprisoned in the Alexander Palace" |
| `second-italo-ethiopian-war--ogaden-war` | "the Ogaden was united under a single administration" |
| `six-day-war--gaza-war` | "Israel occupied both Palestinian territories" |
| `six-day-war--yom-kippur-war` | "the Israeli military had become complacent" |
| `world-war-i--second-sino-japanese-war` | Shandong, "leading to nationwide anti-Japanese protests" — May Fourth, not 1937 |
| `xinhai-revolution--chinese-civil-war` | "Sun Yat-sen assumed the presidency of the newly formed Republic of China" |
| `xinhai-revolution--sino-indian-war` | the British "had lost the urgency to enforce this boundary" |

**Counts.** 1 retyped, 1 re-pointed (1 withdrawn, 1 written), 1 relabelled, 9
withdrawn. Active edges **843 → 834**; `precondition-of` **417 → 407**. Corpus
unchanged at **858 active, 242 main, 616 filed**. **The largest connected
component is 609 before and 609 after, the component count 192 before and 192
after, and the isolate count 155 before and 155 after** — not one of the nine
was the only thing holding a record in the graph, which is its own reading of
how much they were carrying. `soviet-japanese-border-conflicts` and
`sino-indian-war` are each down to one edge. Validator: 0 errors, 496 warnings
either side.

**A withdrawal keeps its quote.** Every one of the nine keeps its
`explanation`, its citation and the revision it read, and says in
`retraction.reason` which half of A13's sentence the article did not supply.
Nothing here says the link is false — `six-day-war → yom-kippur-war` is a
claim historians make — only that *this sentence* does not make it. Seven of
the nine name a `to` the sentence never mentions; two (`boxer-rebellion` and
`first-sino-japanese-war`) name a consequence the atlas holds as a different
record entirely, which is the review's *"endpoint chosen by which article was
open"*.

**Deviation 1411.** *`six-day-war--yom-kippur-war` is the drop that most
likely has a better sentence in the same article, and a sweep cannot find it.*
The quote came from § Response in Israel; the Yom Kippur War's article argues
the 1967 complacency at length and somewhere states the link the edge asserts.
Re-reading one article for one sentence is a reading and not a pass, and A14
gives this fire nine drops and no re-argument. The record is on disk with its
reason, so a person or a later curation fire can restore it from a sentence
that says it.

**What stays open.** Whether a § Background mention is ever a `precondition-of`
is the owner's (review finding 4). The other 52 `a13-relations-pass` edges are
untouched by this pass: the review read ten and named eleven, and reading the
remaining 42 against their revisions is a curation fire's work, not this
one's.

## A14 (5) — the polities the events name, nineteen of thirty-four described

*24 September, the 04:58Z fire. 34 records reconciled against Wikidata; 14
leads fetched, the other 5 read off the cache A14(3) had just filled.*

The 22 September pass wrote 177 descriptions and every one of them went to a
polity dated as ongoing, because its own gate — *an item with a dissolution
date cannot describe a polity dated as ongoing* — excludes exactly the
polities an event names. 34 named polities had none, and they are the ones
named most: `third-portuguese-republic` by 35 events, `estado-novo` by 31,
`first-portuguese-republic` by 21, `kingdom-of-portugal` by 15, then the
Ottoman Empire, the Soviet Union and the Empire of Brazil at 9 each. A reader
opening the Soviet Union from a war card found the CShapes boilerplate.

**The rule, and the one thing it had to decide.** A12(6)'s two signals are the
article the record's own names resolve to and a capital within 1.5° of the
one the record carries; A14 adds the inverse gate, the item's dissolution year
matching the record's end. **23 of the 34 carry no capital at all**, so the
pass had to say what a missing signal means, and says this: the name
resolution is required and must reach **one** item, never two; **a signal the
record can supply and that disagrees always refuses**; a signal it cannot
supply neither passes nor fails; and **at least one of the two must actually
agree**. That is A12(6)'s discipline with the hole named rather than widened.

**19 matched.** `third-portuguese-republic`, `estado-novo`,
`first-portuguese-republic`, `kingdom-of-portugal`, `empire-of-brazil`,
`ottoman-empire`, `soviet-union`, `russian-empire`, `nazi-germany`,
`russian-sfsr`, `austria-hungary`, `german-empire`, `weimar-republic`,
`czechoslovakia`, `saint-domingue`, `sao-tome-and-principe`,
`united-kingdom-of-great-britain-and-ireland`, `captaincy-general-of-cuba`,
`vietnam-republic-of`. Four matched on a capital *and* the dissolution year
(Estado Novo, the First Republic, Austria-Hungary, the German Empire,
Czechoslovakia, South Vietnam); the rest on the dissolution year alone, with
the inception agreeing on eleven of them.

**15 refused, and the refusals are the pass's own reading.**

| refused | why |
| --- | --- |
| `european-economic-community` | Q52847 was dissolved in 2009; the record ends 1993 |
| `inca-empire` | Q28573 dissolved 1533/1572; the record ends 1649 |
| `dutch-republic` | Q170072 dissolved 1795; the record ends 1782 |
| `viceroyalty-of-brazil` | Q2920081 dissolved 1808; the record ends 1815 |
| `orange-free-state` | Q218023 dissolved 1902; the record ends 1910 |
| `vietnam-democratic-republic-of` | the record is ongoing and Q172640 was dissolved in 1976 — the same refusal the 22 September fire made |
| `united-kingdom-before-1886`, `castille`, `persia`, `transvaal` | neither signal could be checked: no capital on the record, and the item names no dissolution against a record end of 1877, 1529, 1925, 1910 |
| `military-dictatorship` | its three names resolve to three different items |
| `england-and-ireland`, `algeria-under-france`, `cuba-under-spain`, `vietnam-annam-cochin-china-tonkin` | no English article their names resolve to |

The five ending in a year the item's dissolution does not carry are the
interesting ones: four of them end at a **Historical Basemaps snapshot**
(1529, 1782, 1815, 1910) rather than at a dissolution, which is what the
import's own summary says those years are. The gate is doing what it was
written for.

**Counts.** 19 records rewritten, all `active`, all flagged
`polity-description`; 19 `wikidata` locators and 19 `wikipedia-en` locators
added, every one at a revision the cache now holds. 14 leads fetched, 5 read
off disk. Three of the nineteen are Historical Basemaps records under
GPL-3.0-only and carry a CC BY-SA quotation beside the GPL summary, which is
the first time a described polity has not been CShapes' or the assistant's;
the validator's licence rules pass, because the prohibition runs the other way
— nothing here copies NC or GPL material into a CC BY-SA record. Corpus
unchanged: **858 active, 242 main, 616 filed, 834 edges, largest component
609, 0 errors, 496 warnings**; citations to check go from 13,079 to 13,105.

**What this pass did not write.** No identity field. Twelve of the nineteen
carry no `wikidata` key at all — the item is named in a source locator and
nowhere else — and CLAUDE.md gives identity fields to the import and not to a
hand pass. A12(6)'s 177 are in the same state. The narrow question for the
owner is whether a reconciliation this certain (one article, one item, the
dissolution year matching) should write `wikidata` as it goes, which would
let the next Wikidata run see these records at all.

**Deviation 1412.** *Population for an ended polity is a snapshot of a year,
and P1082 without a `P585` qualifier is unusable for one.* The pass takes the
latest qualified value and omits the figure where there is none, so the Soviet
Union carries 293 million people (1989) and the German Empire carries no
population rather than a number with no year against it. Five of the nineteen
carry no area, four no population, two neither.

## A14 (6) — the seven cleanups, the fifteen tombstones and the Holocaust

*24 September, the 04:58Z fire. Six of the seven read only what is on disk;
the Holocaust and the tombstones were read from their own articles at named
revisions.*

### The 21 titles

Every active event whose `title` is its article's title minus the parenthetical
— 19 exactly, and 2 more that differ only in case, which is the review's 21.
Each is retitled to the article's own title at the revision the cache holds,
under A12(5), and carries `title-from-article` and a `wikipedia-en` locator at
that revision. **No id moved and no reference was rewritten**: an id is not a
title. `Black Monday` becomes `Black Monday (1987)`, `Treaty of Paris`
becomes `Treaty of Paris (1951)` beside `treaty-of-paris-1783` and `-1898`,
`Eastern Front` becomes `Eastern Front (World War II)`, and
`Libyan Civil War` and `Myanmar Civil War` take their articles' lower-case
`civil war` with the years. **21 retitled, 0 refused.**

### London

`london-q84`, written by A9 on 22 September from Q84, is merged into `london`,
written by hand in M50 — one city, one point, two ids. `Q84`, the article and
the item's four other names go to the survivor and `london-q84` gives them up,
because **rule 21 gives one item to one record** and the validator says so in
two errors if you try to leave the item on both. The two events that pointed at
the merged id — `anglo-irish-treaty` and `treaty-of-london-q584617` — point at
`london`. `supersededBy` is how the old id keeps resolving; an alias would not
do, because rule 2 refuses an alias equal to another record's id.

### The 94 place placeholders

`placeRecord()` wrote the import's own placeholder sentence on every place it
created while the fires' hand-written places wrote `summary: null`, so one
pass left two shapes and `summary-imported` counted one of them. **94 places
become `summary: null`**, which is what a record that cites nothing and
asserts nothing should say. The warning drops from 109 to 15 (12 events, 3
actors), and those twelve events are the ones with no English article, which
is review finding 11 and a person's.

### The open ends

**18 open-ended imports take `end-unstated`** — every active event with
`end: null`, `origin.tool: wikidata` and no flag. The flag says the *item*
states no end, which is what `intervalFor()` writing `end: null` means, and it
is as true of `covid-19-pandemic` as of `kashmir-conflict`. Two are left
because they are not imports: `nova-republica-brazil-since-1985` and
`third-portuguese-republic-since-1974`, written by hand as period records.
`2011-bahraini-uprising` is not among them — A14(1) closed it at 2014 from its
lead. The stale flag on `chilean-war-of-independence` is cleared; **its note
is not touched**, because the 465-character account it carries and the
bookkeeping line would not both fit in 500 (deviation 1408 again), and the
account is worth more than the line.

### The Holocaust, divided (brief §5)

The sources give a boundary and it is stated twice. At revision 1376446924 the
article's lead reads *"From 1941 to 1945, Nazi Germany and its collaborators
systematically murdered around six million Jews across German-occupied
Europe"*, its § Mass shooting reads *"The systematic murder of Jews began in
the Soviet Union in 1941"*, and its § Persecution of Jews dates the first
measures to 1933 — *"In 1933, Jews were banned or restricted from several
professions and the civil service"* — and the violence of that period *"from
1933 to 1939"*. So:

- **`the-persecution-of-the-jews-1933-1941`**, 1933–1941, main.
- **`the-extermination-of-the-jews-1941-1945`**, 1941–1945, **filed under
  `world-war-ii`**.
- `the-holocaust` is **merged**, superseded by the extermination record, which
  inherits its Wikidata item, its article and three of its four edges.

**The edges are inherited, not withdrawn.** §5 says `supersededBy` points at
"the one that inherits its edges", so each edge is renamed in place with its
former id in `aliases` rather than retracted: three go to the extermination
record and one, `--porajmos--enabled`, goes to the **persecution** record,
because its own explanation argues from the Nuremberg Laws of 1935 and rule 4
refuses it from a record starting in 1941. `operation-reinhard` (1942–1943) is
filed under the extermination record; `the-holocaust-in-romania` (1940–1944)
under it and `world-war-ii`.

**§5 asked for `world-war-ii --enabled--> <the second>` and this pass writes no
such edge**, because A14 suspends an edge from a parent to its own child until
the owner decides C8, and the extermination record is filed under the war. The
filing carries the same connection to a reader — the extermination opens
inside the Second World War — and costs no disputed edge. **That filing is also
what keeps A6**: two main records out of one would have raised the main count,
and main is **242 before and 242 after**.

**What it cost.** Active events 858 → **859**; components **192 → 193** and the
largest **609 → 608**, because `the-persecution-of-the-jews-1933-1941` and
`porajmos` are now a two-node component of their own: the persecution record
holds the one edge that could not stay on the extermination record, and
`porajmos` has no other. Rejoining it wants a sentence from the article about
the persecution and something the atlas holds, and finding one is a reading
this pass was not given.

**What is judgement and what is quoted.** Every date, and every clause in both
summaries, is the article's at revision 1376446924, checked verbatim before
anything was written. The two **titles** are this atlas's own, because no
article is titled either thing; the **1941 boundary** is the article's; the
decision to file the second under the war rather than edge it is C8's and A6's.
The article also says *"further Nazi persecutions from 1933 to 1945"*, so 1941
is the boundary between two things and not the end of persecution, and both
records' notes say so.

### The fifteen M44b tombstones (brief §2)

**15 reasons rewritten, 0 reinstated.** Each cited a rule that died with the
Portuguese scope, which is a lie about why the record is not here; each now
says what the corpus holds today and what is still missing. The corpus that
M44b judged them against is gone — 859 active events across all five lanes —
and for five of them the neighbour M44b named has actually arrived:

| | the neighbour M44b wanted | today |
| --- | --- | --- |
| `chaco-war` | anything South American | 202 active in the Americas lane — and the article's § Origins names oil and a territorial dispute, no event here |
| `sri-lankan-civil-war` | anything South Asian | 143 in Asia — and the article's war runs through the IPKF, which the atlas has not got |
| `2023-nigerien-coup-d-etat` | the other Sahel coups | `2020-` and `2021-malian-coup-d-etat`, both filed under `mali-war` |
| `western-african-ebola-virus-epidemic` | Guinea-Bissau, or the region | `sierra-leone-civil-war` and `second-liberian-civil-war` |
| `nigerian-civil-war` | Portuguese Africa | `angolan-war-of-independence`, filed under the colonial war |

**And none of the five earns an edge**, because the sentence is the thing that
is missing and not the neighbour. The Nigerien article says the coup *"came in
the wake of recent coups in nearby countries, such as in Guinea, Mali, and
Sudan in 2021"* and names the "coup belt" — which is **exactly the chronology
class this same fire dropped nine A13 edges for four sections ago**, and
writing it to keep a record is what §1 forbids in so many words. The Biafra
article says *"Portuguese pilots also served in the Biafran Air Force"* and
describes the airlift through São Tomé, and never says the war in Angola is
why Lisbon did it — that sentence is the edge, and it wants a source the atlas
can open. The Ebola article describes the epidemic country by country and
draws no line to either war.

**Two of the fifteen do not want an edge at all.** `1948-palestine-war` is the
war the atlas's own `1948-arab-israeli-war` calls its second stage, and
`balkan-wars` is the series whose two parts the atlas holds and has wired:
under A6 each is an **umbrella**, and a filing pass could reinstate both
without an edge and without raising the main count. Their reasons now say so.
`population-transfer-in-the-soviet-union` wants the same treatment the
Holocaust got this day — dividing, because twenty-two years of policy under
one date cannot take an edge that means anything.

### Counts for the whole pass

| | before A14(6) | after |
| --- | --- | --- |
| active events | 858 | **859** |
| **main** | 242 | **242** |
| filed | 616 | 617 |
| active edges | 834 | 834 |
| largest component | 609 | **608** |
| components | 192 | **193** |
| validator | 0 errors, 496 warnings | **0 errors, 403 warnings** |
| `summary-imported` | 109 | **15** |

**Per lane, active and main (A10).** Europe 375/89, Americas 202/55, Asia
143/67, Africa 139/31. Nothing was imported, so the lanes moved only by the
Holocaust's division, which is Europe.

## Where the run stands after A14's six passes, for the fire that picks it up

*24 September, 04:58Z onward. **A14 fire**: the six data passes the second
review asked for, in order, each with its section above. Nothing was imported.
`origin/m0` was merged in at the head of the run, so this branch carries the 24
September review, the amendment itself and M42b's batches 16 to 18.*

| | |
| --- | --- |
| corpus | **859 active** (858 before; the Holocaust became two records) |
| **main** | **242**, unmoved through eighteen batches, three curation fires and A14 |
| filed | 617 |
| active edges | **834** (843 before: nine chronology edges dropped, one endpoint corrected) |
| largest connected component | **608** |
| components | **193** |
| events with no edge at all | **155**, of which 144 are filed under a parent, 10 are umbrellas and **one** (`rhodesian-bush-war`) is neither |
| events with neither an edge nor a parent | **11** — 10 umbrellas and `rhodesian-bush-war` |
| events with no place | **47** (41 before A14(2) cleared six) |
| events naming no actor | 478 |
| validator | **0 errors, 402 warnings** (496 before; `summary-imported` fell from 109 to 15) |
| tests | **1,792 pure and 279 browser, all passing, 0 skipped** |
| per lane, active | Europe 375, Americas 202, **Asia 143**, **Africa 139** |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 |

**A14 is spent.** All six passes carry their sections above, so the clause
*"in force for both lanes before any further import"* is satisfied and **the
next fire is an import fire** unless it is the first after 02:00Z tomorrow, in
which case it is the curation fire and A13's relations pass.

**What is open, in the order a fire should weigh it:**

- **A10's order is unchanged and the gap has not moved**: Africa 139 and Asia
  143 against Europe's 375. The veins the stand after batch 47 named are still
  the cleanest and still untouched: `Q159950`'s remaining **67 unheld rows**
  would finish the Russo-Japanese War — `Q920679` Shaho (17), `Q1358032`
  Sandepu (17), `Q702150` off Ulsan (15), `Q4538445` the invasion of Sakhalin
  (14), `Q2619692` Te-li-Ssu (12) — then `Q8663` the Korean War, then `Q170314`
  the Second Sino-Japanese War at 92. The Yom Kippur War's 44 unheld rows are
  Africa and Asia both.
- **Six questions for the owner came out of these passes**, and each is a line:
  1. Where the lane guard fires, which does it clear — the place, always, or
     the one that disagrees with the record's title? (A14(2), deviation 1409;
     two of the six cleared places were right and the lane was wrong.)
  2. Should the cache hold more than one revision of an article? 72 citations
     name a revision it cannot hold, all of them second readings of 59 articles
     (A14(3)).
  3. May a reconciliation as certain as A14(5)'s — one article, one item, the
     dissolution year matching — write `wikidata` on the record as it goes?
     Twelve of the nineteen still name their item only in a source locator.
  4. Is a § Background mention ever a `precondition-of`? (Review finding 4; 52
     `a13-relations-pass` edges are still unread against their revisions.)
  5. C8, still: 91 parent-to-child edges exist and the fires refuse to write
     more. §5's `world-war-ii --enabled--> the-extermination-of-the-jews`
     is now one of the edges that clause forbids.
  6. Does `parent` satisfy the bar of §1? 144 of the 155 edgeless events are
     filed under one.
- **`the-persecution-of-the-jews-1933-1941` and `porajmos` are a two-node
  component**, new this fire, and the only thing the division cost the graph.
  Rejoining it wants one sentence from the Holocaust article about the
  persecution and something the atlas holds; A14(6) gave this fire no licence
  to go looking, and a curation fire has one.
- **Two of the fifteen tombstones want an A6 umbrella and not an edge**:
  `1948-palestine-war` over the 1948 war and the civil war in Mandatory
  Palestine, and `balkan-wars` over its two parts. Reinstating either costs no
  edge and no main event, because each would take main events under it. A
  filing fire can do both; §2 could not, because its bar is an edge.
  `population-transfer-in-the-soviet-union` wants dividing, the way the
  Holocaust was divided this day.
- **The P710 vein is spent until the actor corpus grows**, unchanged: 118 of
  194 items name no participant and the 68 naming unheld ones produced zero
  candidates. The 32 partial lists review finding 7 names are still on the
  records, because the two rules that govern them are the owner's to choose
  between.
- **Deviation numbers: take the next above 1413.** This fire wrote
  **1408 to 1413** and deviation 1407's proposal — `m42` from 1400 upward,
  `m42b` continuing the shared sequence — held for a full day without a
  collision.

**The check is green on this fire's head.** Run 1665 of `validate.yml`, commit
`e650686d`, conclusion `success`. The two runs before it were cancelled by the
next push in the same concurrency group and one earlier run, 1661, was red on a
mid-pass head — A14(5)'s index commit, before the documents the Holocaust's
division moved had been re-taken — which is what the ordering rule 798 exists
to make visible rather than to hide. The re-run allowance is unspent: nothing
was re-run.

## Batch 48 — the Algerian War read as a chain, and the war whose parts cannot reach it

*24 September, the fire that picked the run up at 08:18Z. Today already carries
a `## Curation 2026-09-24` section and all six of A14's passes carry theirs, so
this is an **import fire**. `origin/m0` was not an ancestor of `m42` at claim
time and was merged in at the head of the run, which brought M42b's batches 19
and 20 and M86 with it; that merge, and not this batch, is why the corpus in
the table below starts at 873 and not at the 859 the last stand measured.*

### The lane, and the vein asked of it

A10's order of need is unchanged and **Africa is the lane that trails: 139
against Europe's 375**, with Asia at 143 and the Americas at 216 after M42b's
two batches landed. So this batch is Africa, and the inverse `part of` vein was
run over the **132** Africa-lane active events that carry an item, against every
record of any status on `m42`: 459 rows, **392 of them unheld**, over these
parents. The 132 went to the query service in six groups of 25 and **two of
those six came back 429 and 502**, so about fifty of the lane's events were
never asked and the table below is a floor and not the lane's whole vein —

| parent | unheld rows |
| --- | --- |
| `mali-war` | 78 |
| `algerian-war` | 41 |
| `scramble-for-africa` | 39 |
| `rhodesian-bush-war` | 29 |
| `libyan-civil-war` | 22 |
| `rif-war` | 22 |
| `italo-turkish-war` | 20 |

**The vein was not read as that ranking**, for the reason batches 45 to 47
arrived at. `rhodesian-bush-war` tops it on rows the atlas could use and is
exactly the wrong choice: it holds none of its 29 parts, it has **no edge at
all**, and a chain built inside it would be a 30-node island. `algerian-war` is
the opposite shape — it sits in the largest component with five edges, the
atlas already holds one of its parts (`battle-of-algiers-1956-1957`), and its
41 rows run from 1955 to 1962 in an order the articles themselves put them in.

### The ten records

Seven parts of the war, in date order, and then the three endpoints the chain
runs into. All ten are filed under `algerian-war`, so **main stays at 242**,
unmoved through nineteen batches, three curation fires and A14.

| the record | dates | placed at | lane |
| --- | --- | --- | --- |
| `philippeville-massacre` | 20–25 Aug 1955 | `skikda` (new) | africa |
| `first-battle-of-el-djorf` | 20–28 Sep 1955 | `tebessa` (new) | africa |
| `palestro-ambush` | 18 May 1956 | `lakhdaria` (new) | africa |
| `milk-bar-cafe-bombing` | 30 Sep 1956 | `algiers-q3561` | africa |
| `bombing-of-sakiet-sidi-youssef` | 8 Feb 1958 | `sakiet-sidi-youssef` (new) | africa |
| `may-1958-crisis-in-france` | 13 May – 3 Jun 1958 | *(none)* | europe |
| `challe-plan` | Feb 1959 – Apr 1961 | `algeria-q262` | africa |
| `algiers-putsch-of-1961` | 21 Apr 1961 | `french-algeria` | africa |
| `evian-accords` | 18 Mar 1962 | `evian-les-bains` (new) | europe |
| `battle-of-bab-el-oued` | 23 Mar – 6 Apr 1962 | `bab-el-oued` (new) | africa |

Eight of the ten are Africa; the two that are not are the lane the chain
crosses into, which is the one case A10 lets a batch leave its own lane for.
All ten pass **span** — every one inside `algerian-war`'s 1 November 1954 to 9
September 1962 at the day — and **depth**, which the query guarantees for the
seven and which the articles supply for the three.

**Six place records, five of them new, and not one hand-corrected.** The
precisions came off the class table as they have since batch 46: `skikda`,
`tebessa`, `lakhdaria`, `sakiet-sidi-youssef`, `bab-el-oued` and
`evian-les-bains` are all `city`. Seven classes were added to
`data/imports/wikidata-seeds.json` → `classes`, each read off the class item
itself over the network: **`Q2989398` commune of Algeria**, **`Q2983893`
quarter** and **`Q41067667` municipality of Tunisia** as `city` — a commune is
Algeria's third-level division, a quarter is a subclass of human settlement, a
Tunisian municipality a subclass of municipality, and Bab El Oued names the
first two together, which agree; **`Q678146` bombardment**, **`Q680838`
ambush** and **`Q2001676` offensive** as events of category `war`, each a
subclass of the military-operation class `Q645883` the table already reads that
way; and **`Q3002772` political crisis** as an event with **no category**,
because none of the twelve of `data/categories.json` is a political crisis and
a category is a person's to set when the table cannot. That is 237 classes.

### The six edges

Every one `probable`, every one quoted from an article at the revision in its
own locator, and all six in `docs/m42-connections.md` under "Batch 48" as well.

| from | type | to | where the article says it |
| --- | --- | --- | --- |
| `philippeville-massacre` | precondition-of | `battle-of-algiers-1956-1957` | Battle of Algiers § Background, rev 1374865618 |
| `milk-bar-cafe-bombing` | precondition-of | `battle-of-algiers-1956-1957` | same article, lead, § First phase and § The Army takes over |
| `may-1958-crisis-in-france` | precondition-of | `challe-plan` | Challe Plan § Background, rev 1370610721 |
| `challe-plan` | precondition-of | `algiers-putsch-of-1961` | Challe Plan § Aftermath, same revision |
| `challe-plan` | precondition-of | `evian-accords` | same section |
| `evian-accords` | **reacted-to** | `battle-of-bab-el-oued` | Bab El Oued § Context, rev 1370432852; Évian Accords, rev 1372137587 |

**The last one was written the other way round first and rule 4 refused it**
(deviation 1416). "The battle answered the accords" reads naturally as
`battle-of-bab-el-oued --reacted-to--> evian-accords`, and the battle is five
days later than the accords, which the arrow-of-time rule will not have. The
atlas's `reacted-to` already runs the other way everywhere it is used —
`1964-brazilian-coup-detat --reacted-to--> operation-brother-sam-1964` says the
American movement answered the Brazilian one — so the edge is the accords into
the battle, and the explanation says in which direction it is to be read.

### What the batch did to the graph, and why

| | before | after |
| --- | --- | --- |
| corpus, active | 873 | **883** |
| **main** | **242** | **242** |
| filed | 631 | 641 |
| active edges | 844 | **850** |
| largest connected component | **610** | **610** |
| components | 197 | **201** |
| events with no edge at all | 156 | 158 |
| events with no place | 49 | 50 |
| events naming no actor | 492 | 500 |
| per lane, active | Europe 375, **Africa 139**, Asia 143, Americas 216 | Europe 377, **Africa 147**, Asia 143, Americas 216 |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 | unchanged |

**The largest component did not move, and this is the batch's real finding.**
The chain made two components of its own — a five of
`may-1958-crisis-in-france`, `challe-plan`, `algiers-putsch-of-1961`,
`evian-accords` and `battle-of-bab-el-oued`, and a three of
`philippeville-massacre`, `milk-bar-cafe-bombing` and
`battle-of-algiers-1956-1957` — and neither reaches the 610.
`battle-of-algiers-1956-1957`, the one part of the war the atlas already held,
**was itself edgeless before this batch**, which the batch did not know when it
chose the vein for running into a record already here. Choosing a vein for a
held endpoint is not enough; the endpoint has to be a *connected* one, and
`tools/m42-pool.mjs` does not report degree per record.

**What separates those two components from the 610 is C8.** `algerian-war`
itself is in the largest component, with five edges — into `suez-crisis` and
`angola-war-begins-1961`, out of `first-indochina-war`, `geneva-conference` and
`1952-egyptian-revolution`. Every record this batch wrote is one of its parts,
and the only edge that would join them to it is a parent-to-child edge, which
the standing instruction forbids until the owner decides C8. **Ninety-one such
edges already exist and the fires may write no more**, so a war whose umbrella
is well connected and whose parts are freshly imported now has both, in two
pieces, and the picture says they are unrelated. This is the clearest case the
run has yet produced for putting C8 to the owner.

### Three refusals, and the redirect that cost a summary

**`first-battle-of-el-djorf`, `palestro-ambush` and `bombing-of-sakiet-sidi-youssef`
are singletons**, because their own cited articles name no other event this
atlas holds. Sakiet's is a stub whose only other event is a cross-border raid
of 11 January 1958; El Djorf's aftermath names Bachir Chihani's execution;
Palestro's § Executions names the executions of Ahmed Zabana and Abdelkader
Ferradj on 19 June 1956 and says "These executions constituted 'an answer' to
the ambush" — and the Battle of Algiers article names the *same* executions as
what made Abane Ramdane order the reprisals that opened the urban campaign.
**Two articles, one intermediate, and the atlas does not hold it**: Wikidata has
`Q2827683` for Zabana the man and no item for his execution, so the run would
have had to join two quotations into an argument neither makes, which is the
line A4 draws. The edge is refused and named here instead.

**One edge was refused on the fire's own A14(4) class.** The Battle of Algiers
§ Aftermath says the paras' standing, won in the battle, "would reach its
zenith during the May 1958 crisis", and the May 1958 article names Massu and
Salan — the battle's own commanders — at the head of the revolt. That would
have joined this batch's two components into one. It is a statement of
continuity and not of consequence, and joining the two clusters is precisely
the reason a fire would want to write it, which is the reason not to.

**`milk-bar-cafe-bombing` carries no `wikipedia-en` citation and keeps the
import's placeholder summary** (deviation 1415). Its item's English sitelink,
"Milk Bar Café bombing", is a **redirect** to the biography "Zohra Drif", and
`fetchLeads` followed it and cached the lead under the target's title. The
record's `review.note` says so. A fire that meets this should not quote the
redirect's target as the record's own article: the lead on disk is about a
person and the record is about a bombing, and the mismatch is only visible
because the cache keeps the title it actually read.

**`first-battle-of-el-djorf`'s article disagrees with itself** and the run
changed nothing. Its first sentence says the battle "took place on 22 September
1955"; its § Aftermath quotes Alcaraz 2016 for "du 20 au 28 septembre 1955",
which is the span the item states and the record carries. A7 widens an interval
from the cited article and never narrows one, so the item's span stands and the
disagreement is in `review.note`.

### A12 (4) got two rows, and §4.1 moved with them

`Q137752577` and `Q1471139` each name **`Q142`, France**, as a participant, and
this atlas holds it as `france`: written to `challe-plan` as `belligerent` and
to `evian-accords` as `signatory`. The other parties their items name — the
ALN and `Q3100531`, the Provisional Government of the Algerian Republic — are
not records here, and neither is any of the four generals `Q2605231` names. So
`noActor` rises by eight and not ten, and `docs/m53-polities.md` §4.1 is retaken
at **382 of 883**.

### The API was refusing when the fire started

The first forty minutes of the fire met **HTTP 429** from
`www.wikidata.org/w/api.php` and from `en.wikipedia.org/w/api.php` —
`x-envoy-ratelimited: true`, `retry-after: 40` — while
`query.wikidata.org/sparql` answered **200** throughout. So the vein was read
through the query service and the import waited (deviation 1414); when the
action API came back the four import runs went through without a single retry,
in 48, 22, 6 and 6 calls. This is not batch 47's `maxlag`: the entity database
was not lagging, the edge was rate-limiting the address. The protocol's answer
holds either way — the fire is hourly and idempotent, so a refused import is a
fire that did nothing, which is a success — and the fire that meets it should
poll the cheapest endpoint rather than re-run the import.

## Where the run stands after batch 48, for the fire that picks it up

*24 September, 08:18Z onward. An import fire, one batch and no code change.
`origin/m0` was merged in at the head of the run.*

| | |
| --- | --- |
| corpus | **883 active** (873 after the merge, 859 before it) |
| **main** | **242**, unmoved through nineteen batches, three curation fires and A14 |
| filed | 641 |
| active edges | **850** |
| largest connected component | **610**, unmoved |
| components | **201** |
| events with no edge at all | **158**, of which 147 are filed under a parent, 19 are umbrellas and **one** (`rhodesian-bush-war`) is neither |
| events with no place | **50** |
| events naming no actor | 500 |
| validator | **0 errors, 420 warnings** |
| tests | **1,810 pure and 286 browser, all passing, 0 skipped** |
| per lane, active | Europe 377, Americas 216, **Asia 143**, **Africa 147** |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 |

**A10's order of need has turned over again**: Africa is at 147 and **Asia now
trails at 143**, so the next import batch is Asia's unless a chain crosses out
of it.

**What is open, in the order a fire should weigh it:**

- **Choose the next vein by the endpoint's degree and not only by whether the
  endpoint is held.** This batch's whole finding is that
  `battle-of-algiers-1956-1957` was held and edgeless, so ten records and six
  edges left the largest component exactly where they found it. The Asia veins
  the stand after A14 named are still open — `Q159950`'s remaining 60 unheld
  rows (`Q920679` Shaho 17, `Q1358032` Sandepu 17, `Q702150` off Ulsan 15,
  `Q4538445` the invasion of Sakhalin 14, `Q2619692` Te-li-Ssu 12), then
  `Q8663` the Korean War and `Q170314` the Second Sino-Japanese War at 92 —
  and the Russo-Japanese vein is the one whose endpoints batch 47 put *in* the
  610, so it is also the one that will move it.
- **C8 is now the run's largest single question.** 91 parent-to-child edges
  exist, the fires may write no more, and this batch shows what that costs: a
  war in the largest component and ten of its parts in two islands beside it.
  The Africa lane is mostly umbrella-and-parts in this shape, so every further
  Africa batch will do the same thing until C8 is answered.
- **The five other questions of the A14 stand are unchanged** and unanswered:
  which record a lane guard clears, whether the cache may hold more than one
  revision, whether a certain reconciliation may write `wikidata`, whether a
  § Background mention is ever a `precondition-of` (this batch wrote two that
  are, and refused one that is not), and whether `parent` satisfies §1's bar.
- **`the-persecution-of-the-jews-1933-1941` and `porajmos` are still a two-node
  component**, and a curation fire still has the licence to rejoin it that an
  import fire does not.
- **Two of the fifteen tombstones still want an A6 umbrella and not an edge**:
  `1948-palestine-war` and `balkan-wars`. A filing fire can do both and neither
  costs a main event.
- **The Africa vein was read incompletely and is worth re-running.** Two of
  the six query groups came back 429 and 502, so about fifty of the lane's 132
  events with an item were never asked. `mali-war`'s 78 unheld rows and
  `scramble-for-africa`'s 39 are both still untouched, and `mali-war` sits in
  the largest component with two edges — which, after this batch's finding, is
  the number that decides whether a vein is worth reading.
- **Deviation numbers: take the next above 1419.** This fire wrote **1414 to
  1419**.

**The check is green on this fire's head.** Run 1689 of `validate.yml`, commit
`7c97a4c3`, conclusion `success`. Two earlier runs of this fire were red and
both for the same reason, which is the ordering rule 798 doing its work rather
than a fault: run 1683 on the merge head and run 1686 on the index head were
taken before `docs/m53-polities.md` §4.1 and `docs/m42-connections.md` had been
re-taken over the batch's records, and `tests/m53.test.mjs` and
`tests/m67.test.mjs` are correspondence tests that fail on exactly that gap.
Runs 1685 and 1688 were cancelled by the next push in the same concurrency
group. The re-run allowance is unspent: nothing was re-run.

## Batch 49 — the Russo-Japanese War finished as a chain, and the four `reacted-to` written backwards

*24 September, the fire that picked the run up at 10:46Z. Today already carries
a `## Curation 2026-09-24` section and **all six of A14's passes carry theirs**,
so this is an import fire and every one of the six is skipped by its own rule.
`origin/m0` was merged in at the head of the run (M86 and M87). A10's order of
need turned over again with batch 48: Africa is at 147 and **Asia trails at
143**, so this batch is seven Asia rows and no other lane.*

### The vein, chosen by the endpoint's degree and not by the ranking

Batch 48's stand asked the next fire to choose its vein by what the endpoints
are worth to the component rather than by whether the endpoint is held, and
this batch is that question answered. `Q159950`, the Russo-Japanese War, had
**74 rows under the inverse `part of` vein and the atlas held nine of them**
after batch 47 — the war itself, seven engagements and the treaty — and every
one of the nine is inside the 610. So the remaining rows are the vein whose
endpoints are worth the most, and seven of them are the engagements the held
chain was missing.

Read through the query service (`query.wikidata.org/sparql`), which answered
200 throughout while `www.wikidata.org/w/api.php` answered 429 twice before
the import itself went through — deviation 1414's reading of the two refusals,
applied.

A11 (b)'s partition check was made before the import: none of the seven ids is
on `origin/m42b` (`docs: the check is green on the head of this fire`,
24 September 10:31Z), which is what a lane owes the other lane.

In date order:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `battle-of-chemulpo-bay` | 19 | 9 Feb 1904 | `chemulpo-bay` (new) | `russo-japanese-war` |
| `battle-of-te-li-ssu` | 12 | 14–15 Jun 1904 | `te-li-ssu` (new) | `russo-japanese-war` |
| `battle-of-tashihchiao` | 11 | 24–25 Jul 1904 | `tashihchiao` (new) | `russo-japanese-war` |
| `battle-off-ulsan` | 15 | 14 Aug 1904 | `korea-strait` (reused) | `russo-japanese-war` |
| `battle-of-shaho` | 17 | 5–17 Oct 1904 | `shaho` (new) | `russo-japanese-war` |
| `battle-of-sandepu` | 17 | 25–29 Jan 1905 | `shenyang` (reused) | `russo-japanese-war` |
| `japanese-invasion-of-sakhalin` | 14 | 7–31 Jul 1905 | `sakhalin` (new, from `P276`) | `russo-japanese-war` |

All seven pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one inside `russo-japanese-war`'s 8 February
1904 to 5 September 1905 at the day; and **lane**, six of the seven in
Manchuria, Korea or the Korea Strait. All seven filed, so **main stays at 242**,
unmoved through twenty batches, three curation fires and A14. Every date is
Gregorian on the item (`Q1985727`), so batch 47's Old Style problem does not
recur.

**No class was added.** `Q178561` battle, `Q1261499` naval battle and `Q467011`
invasion were all already in `data/imports/wikidata-seeds.json` → `classes`,
and `Q23442` island carried the Sakhalin place. That is the second batch
running with nothing for a person to decide about a class, and the first with
no class read over the network at all.

### The nine edges, and the component they moved

Nine edges, all `probable`, every one quoted from an article at the revision in
its own locator; the full table with the sentences is in
`docs/m42-connections.md` under "Batch 49". **Seven run into records that were
already here**, which is A5's own standard, and the other two chain the batch
to itself:

| from | type | to |
| --- | --- | --- |
| `battle-of-chemulpo-bay` | enabled | `battle-of-the-yalu-river-1904` |
| `battle-of-nanshan` | reacted-to | `battle-of-te-li-ssu` |
| `battle-of-te-li-ssu` | precondition-of | `battle-of-tashihchiao` |
| `battle-of-tashihchiao` | precondition-of | `battle-of-liaoyang` |
| `battle-of-the-yellow-sea` | reacted-to | `battle-off-ulsan` |
| `battle-of-liaoyang` | reacted-to | `battle-of-shaho` |
| `battle-of-shaho` | precondition-of | `battle-of-sandepu` |
| `siege-of-port-arthur` | reacted-to | `battle-of-sandepu` |
| `japanese-invasion-of-sakhalin` | enabled | `treaty-of-portsmouth` |

**The largest connected component goes from 610 to 617** — every one of the
seven joined it, the component count did not move, and no new island was made.
That is what batch 48's stand was asking for: its ten records and six edges
left the 610 exactly where they found it because the endpoint they hung on was
held and edgeless, and these seven hang on nine endpoints that are all inside
it.

**`japanese-invasion-of-sakhalin --enabled--> treaty-of-portsmouth` is a third
branch into that endpoint**, beside `battle-of-tsushima --caused-->` and batch
47's `battle-of-mukden --enabled-->`, and each rests on a different sentence in
a different article: the fleet destroyed, the field taken, and the threat of
losing territory that the invasion's own § Background says was the only thing
that would bring the Tsar to the table. Three independently argued branches
converging on one treaty is the convergence query's whole subject, and it is
now in the data rather than in the brief.

### The four `reacted-to` were written backwards, and rule 4 caught all four

All four `reacted-to` edges of this batch were first written **from the
reaction to the thing reacted to** — on the sense of the English verb — and
rule 4 refused all four in one run, by name and with both dates. The atlas's
`reacted-to` runs forward in time like every other type: `A --reacted-to--> B`
says *B answered A*, which is what `october-revolution --reacted-to-->
kerensky-krasnov-uprising` and batch 48's `evian-accords --reacted-to-->
battle-of-bab-el-oued` already said. Four files were deleted and rewritten;
nothing was pushed in the wrong direction, because the validator runs before
the commit. **Deviation 1420**, and it is the validator doing precisely what it
is for.

### A9's first step answered the row batch 47 refused

Four place records are new and **not one was hand-corrected**.

- **`chemulpo-bay`** (`point`) is the row batch 47 chose and dropped: its
  `P276` is Q125696445, Jemulpo, which "carries no `P625` at all", so A9's
  second step gave nothing and the battle was left out. **A12 (2)'s corrected
  order reads the item's own `P625` first**, and Q1192118 has one. The record
  carries no `wikidata` key, batch 39's rule for a place written from an
  event's own point, and its note names `incheon` — the modern city on this
  bay, 17 km off, which the atlas already holds — so that a reader meeting two
  marks knows why there are two.
- **`te-li-ssu`** (`point`) is the first place in the run where A9's first step
  was taken **over** a held answer at its second: Q2619692's `P276` is
  Q326917, the Liaodong Peninsula, which the atlas holds and which
  `siege-of-port-arthur` already stands on. The own point won because the
  article at revision 1370590724 locates the hamlet itself — "some 80 mi
  (130 km) north of Port Arthur" — and the peninsula is the ground rather than
  the place on it. **Deviation 1421.**
- **`tashihchiao`** (`point`) and **`shaho`** (`region`) have no `P276` at all,
  so only the first step reaches them. `shaho` is `region` because its article
  puts the fighting "along a 37-mile (60 km) front centered at the Shaho
  River", which is an area and not a pin, and because `yalu-river` — the other
  river of this war — is already drawn that way.
- **`sakhalin`** (`region`, `Q7792`) is the import's own, written from `P276`
  before the events were touched. The item's own `P625` is 46.75, 142.65, in
  the south of the island it names, so the two steps agree in substance for the
  **fifth** time, and the record that says "the island" is the one an invasion
  of the island wants.

**`battle-of-sandepu` reuses `shenyang` rather than taking its own point, and
that is a refusal with a reason.** Q1358032's `P625` is 41.7833, 123.4333 —
**2.2 km from the point the atlas already draws Mukden at** — while the same
article says the battle was fought "within a group of villages about 36 miles
(58 km) southwest of Mukden". The item's coordinate is Mukden's own, not
Sandepu's, so writing a place called Sandepu at it would be a record asserting
what its only source denies, and writing it 2 km from `shenyang` would be the
`london-q84` fault A14 (6) has just finished undoing. The event stands on the
city the item actually points at, and its own note says the villages were 58 km
away. **Deviation 1422** — a sixth shape A9's rule does not answer: *an item
whose `P625` is its parent battle's city and not its own site.*

**`battle-off-ulsan` reuses `korea-strait`, which its own article names.** The
lead calls it "also known as the Battle of the Japanese Sea or **Battle of the
Korean Strait**", the atlas holds `korea-strait` (Q52052) as a `region`, and
the item's own point falls inside it. A9's first step would have written a
point at sea named after a city 55 km away.

### The lane the europe polygon takes, and the count it changes

**Asia gains six of the seven, not all seven.** `sakhalin` derives to the
**`europe`** lane: the atlas's five lane polygons put the whole of Russian
ground there, which is how `ipatiev-house` (Yekaterinburg), `russia`,
`soviet-union-q15180` and `russian-empire-q34266` are already drawn, none of
them with an override. Nothing was overridden here either — a single record
contradicting four others at the same longitude would be worse than a lane set
that is coarse and consistent — but the question is now a real one and it is
the owner's: **should the `europe` lane hold Russian Asia?** Every Russian
event east of the Urals is in it today. **Deviation 1423.**

### The two refusals, and the third on its own reading

Both refusals are the fire's own class — chronology with no claim in it, the
class A14 (4) read the eleven "Following" quotes under and dropped nine.

- The Battle off Ulsan's lead: "four days after the Battle of the Yellow Sea".
  A date, not an argument. The edge written instead rests on § Sortie's
  telegram, which says *why* the squadron was at sea.
- The invasion of Sakhalin's § Background: the plan was reconsidered "On 7 June
  1905, shortly after the Battle of Tsushima". Same shape, same refusal, so
  `battle-of-tsushima → japanese-invasion-of-sakhalin` was not written. What
  the article does claim is the invasion's purpose, and that is the edge into
  the treaty.

The third is refused on what its article actually says rather than on how the
sentence opens: the Battle of Chemulpo Bay's § Background puts it and the
Battle of Port Arthur in **one** action — "The opening stage of the
Russo-Japanese War began with a pre-emptive strike by the Imperial Japanese
Navy against the Russian Pacific Fleet spread among Port Arthur, Vladivostok,
and Chemulpo Bay" — fought a day apart. Two halves of one strike is a filing
under the war and not a cause between them. Chemulpo earns its edge a month
later and in another country, where the Yalu article says "the way was clear
for the Imperial Japanese Army to deploy ... into Korea".

### The counts

| | before | after |
| --- | --- | --- |
| active events | 883 | **890** |
| main | 242 | **242** |
| filed | 641 | 648 |
| active edges | 850 | **859** |
| largest connected component | 610 | **617** |
| components | 201 | 201 |
| events with no edge at all | 158 | 158 |
| events with no place | 50 | 50 |
| per lane, active | Europe 377, Americas 216, Asia 143, Africa 147 | Europe 378, Americas 216, **Asia 149**, Africa 147 |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 | unchanged |

`docs/m53-polities.md` §4.1 is retaken at **383 of 890**, counted by overlap
**384**: `battle-of-chemulpo-bay` is the one row of this batch whose item names
participants the atlas holds (`Q188712` and `Q34266`, read as `japan` and
`russian-empire`, which is how `russo-japanese-war` and `battle-of-port-arthur`
already read the same two items). The other six carry no `P710` at all.

## Where the run stands after batch 49, for the fire that picks it up

*24 September, 10:46Z onward. An import fire, one batch and no code change.*

| | |
| --- | --- |
| corpus | **890 active** |
| **main** | **242**, unmoved through twenty batches, three curation fires and A14 |
| filed | 648 |
| active edges | **859** |
| largest connected component | **617** (+7) |
| components | **201**, unmoved |
| events with no edge at all | **158**, unmoved: the batch left none |
| events with no place | **50**, unmoved: all seven arrived placed |
| events naming no actor | 506 |
| validator | **0 errors, 426 warnings** |
| tests | **1,819 pure and 295 browser, all passing, 0 skipped** |
| per lane, active | Europe 378, Americas 216, **Asia 149**, **Africa 147** |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 |

**A10's order of need has turned over again and by two**: Africa is at 147 and
Asia at 149, so **the next import batch is Africa's** unless a chain crosses
out of it.

**What is open, in the order a fire should weigh it:**

- **The Russo-Japanese vein is worked out as a chain and the method is proved.**
  Sixteen of `Q159950`'s 74 rows are now here and the war runs unbroken from
  Port Arthur in February 1904 to Portsmouth in September 1905, with three
  branches converging on the treaty. What is left of the vein is the small
  rows — `Q4871480` Korsakov 12, `Q2409264`'s neighbours `Q2469370` Motien Pass
  10 and `Q2409166` Hsimucheng 9, `Q11481675` the Hitachi Maru Incident 9 — and
  none of them carries dates in the query's own answer, so each needs its item
  read before it is worth a row. **The method to carry forward is batch 48's
  question answered here: pick the vein whose endpoints are already inside the
  largest component, not the vein with the most rows.** `Q8663` the Korean War
  and `Q170314` the Second Sino-Japanese War, at 92 rows each, are the next two
  Asia veins and both have endpoints in the 610.
- **The Africa vein is still the one read incompletely**, unchanged from batch
  48's stand: two of its six query groups came back 429 and 502, `mali-war`'s
  78 unheld rows and `scramble-for-africa`'s 39 are untouched, and `mali-war`
  sits in the largest component. It is Africa's turn by A10 and this is the
  vein to re-run.
- **C8 is still the run's largest single question**, and this batch is the
  counter-example to batch 48's cost rather than an answer to it: where the
  parts chain to *each other* the parent-to-child edge is not needed at all,
  and the 617 is what that looks like. The 91 that exist stay; a batch writes
  no more.
- **`should the europe lane hold Russian Asia?`** is new and is the owner's
  (deviation 1423). Every Russian event east of the Urals is drawn in the
  europe lane today, `japanese-invasion-of-sakhalin` included.
- **The five other questions of the A14 stand are unchanged** and unanswered:
  which record a lane guard clears, whether the cache may hold more than one
  revision, whether a certain reconciliation may write `wikidata`, whether a
  § Background mention is ever a `precondition-of`, and whether `parent`
  satisfies §1's bar. A9's first step has now been taken **over** a held second
  step once (deviation 1421), which is the narrowest version of the last of
  them.
- **`the-persecution-of-the-jews-1933-1941` and `porajmos` are still a two-node
  component**, and a curation fire still has the licence to rejoin it that an
  import fire does not.
- **Two of the fifteen tombstones still want an A6 umbrella and not an edge**:
  `1948-palestine-war` and `balkan-wars`. A filing fire can do both and neither
  costs a main event.
- **`rhodesian-bush-war` is still the one active event with neither an edge nor
  a parent.**
- **Deviation numbers: take the next above 1424.** This fire wrote **1420 to
  1424**.

**The check is green on this fire's head.** Run 1713 of `validate.yml`, commit
`cb1c9821`, conclusion `success`. Run 1712 on the index head was green before
it and run 1711 on the records head was cancelled by the next push in the same
concurrency group, which is the ordering rule 798 working rather than a fault.
The re-run allowance is unspent: nothing was re-run.

## Batch 50 — the Mali War read as a chain, and the vein whose endpoints were all held

*24 September, the fire that picked the run up at 13:07Z. Today already carries
a `## Curation 2026-09-24` section and **all six of A14's passes carry theirs**,
so this is an import fire and every one of the six is skipped by its own rule.
`origin/m0` was already an ancestor of `m42` at claim time, so no merge. A10's
order of need is unchanged from batch 49's stand: **Africa trails at 147**
against Asia's 149 and Europe's 378, so this batch is eight Africa rows and no
other lane.*

### The vein, chosen the way batch 49 said to choose one

Batch 49's stand left two instructions and this batch is both of them carried
out. The first: **pick the vein whose endpoints are already inside the largest
component, not the vein with the most rows.** The second, from batch 48 and
unchanged since: **the Africa vein is the one read incompletely, and `mali-war`
sits in the largest component.**

`Q2946372`, the Mali War, answers 103 rows under the inverse `part of` vein and
the atlas held **seven** of them after A14 — the two Tuareg risings, the three
coups, Serval, Barkhane and the Ogossagou massacre — and six of those seven are
inside the 617. So the remaining rows hang on endpoints worth more than any
other Africa vein's, and eight of them are the engagements the held chain was
missing between the rising of January 2012 and the pursuit into the mountains
in March 2013.

Read through the query service (`query.wikidata.org/sparql`), which answered 200
throughout. `en.wikipedia.org` answered **429 on almost every request for two
hours** and `www.wikidata.org/w/api.php` on some — deviation 1425 is what that
turned out to be and how it was got round.

A11 (b)'s partition check was made before the import: none of the eight ids is
on `origin/m42b`, whose `data/events/` holds 1,149 ids and none of Mali's beyond
the three the two branches share through `m0`.

In date order:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `siege-of-tessalit` | 2 | 17 Jan – 11 Mar 2012 | `tessalit` (new) | `mali-war` |
| `battle-of-kidal-2012` | 4 | 26–30 Mar 2012 | `kidal` (new) | `mali-war` |
| `battle-of-gao` | 6 | 26–28 Jun 2012 | `gao` (new) | `mali-war` |
| `battle-of-konna` | 9 | 10–18 Jan 2013 | `konna` (new) | `mali-war` |
| `battle-of-diabaly` | 6 | 14–21 Jan 2013 | `diabaly` (new) | `mali-war` |
| `second-battle-of-gao` | 4 | 25–27 Jan 2013 | `gao` (reused) | `mali-war` |
| `battle-of-ifoghas` | 5 | 18 Feb – 31 Mar 2013 | `adrar-des-ifoghas` (new) | `mali-war` |
| `chadian-intervention-in-northern-mali` | 3 | Jan 2013 | `azawad` (reused) | `mali-war` |

All eight pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one inside `mali-war`'s 16 January 2012 to its
open end; and **lane**, every one in Mali or Azawad. All eight filed, so **main
stays at 242**, unmoved through twenty-one batches, three curation fires and
A14.

**One class was added**, and it is the first in two batches: `Q1758856`, commune
of Mali, whose own description reads "third-level administrative unit in Mali",
as `place`/`city`. Five of the six located items the batch names carry it and
nothing else, and `city` is the precision `Q484170`, commune of France, already
carries for the same reason — the unit a town is. `Q178561` battle, `Q350604`
armed conflict and `Q46831` mountain range were all in the table already.

### The eight edges, and the component they moved

Eight edges, all `probable`, every one quoted from an article at the revision in
its own locator; the full table with the sentences is in
`docs/m42-connections.md` under "Batch 50". **Seven run into or out of records
that were already here** — the coup, the 2012 rising and Operation Serval — and
the eighth chains the batch to itself.

| from | type | to |
| --- | --- | --- |
| `2012-malian-coup-d-etat` | enabled | `battle-of-kidal-2012` |
| `2012-tuareg-rebellion` | precondition-of | `battle-of-gao` |
| `battle-of-konna` | caused | `operation-serval` |
| `operation-serval` | reacted-to | `battle-of-diabaly` |
| `battle-of-diabaly` | precondition-of | `second-battle-of-gao` |
| `battle-of-konna` | precondition-of | `battle-of-ifoghas` |
| `battle-of-diabaly` | precondition-of | `battle-of-ifoghas` |
| `chadian-intervention-in-northern-mali` | enabled | `battle-of-ifoghas` |

**The largest connected component goes from 617 to 624** — seven of the eight
joined it, and the eighth, `siege-of-tessalit`, is a component of one, which is
why the component count goes to 202 and the edgeless count to 159. That is the
honest shape of this batch: the vein was chosen for its endpoints and seven of
eight paid off, and the one that did not is the one whose article argues nothing
about anything the atlas holds.

**`battle-of-konna --caused--> operation-serval` is the edge the vein was worth
reading for.** Konna is the battle the French intervention answered — the
article says it in one sentence, *"the jihadist offensive in southern Mali
provoked France's entry into the war"* — and Serval was already in the largest
component with an edge into Barkhane. So the Mali chain now runs unbroken from
the rising of January 2012, through the coup that opened the north, through the
falling-out at Gao, into Konna, France, Diabaly, Gao again, the Adrar des
Ifoghas and out through Barkhane to the coups of 2020 and 2021.

### Two intervals widened under A7, and one of them is what let rule 4 pass

Neither is a review flag being closed for its own sake; both are dates the
record's own cited lead states and the record did not carry.

- **`2012-malian-coup-d-etat`** carried `2012-04-08` for **both** bounds, which
  is C3's `P585`-over-`P580` fault surviving A14. Its own cited article at
  revision 1370102863 — the revision the cache holds — opens *"The 2012 Malian
  coup d'état began on 21 March that year"*, so the start is `2012-03-21` and
  the end is left where it was. **Without this the coup's edge into Kidal
  (26 March) runs backwards and rule 4 refuses it**, which is the first time in
  this run an A7 widening has been the thing that made an edge possible rather
  than the thing that tidied one up. **Deviation 1428.**
- **`battle-of-gao`** carried `2012-06-27` alone, the item's single `P585`. Its
  article at revision 1370441289 says the battle was fought *"in Gao between 26
  and 28 June 2012"*, so the span is those three days.

### A9's places, and the one the two steps disagreed about

Six place records are new and **not one was hand-corrected**; all six carry
`summary: null`, which is what A14 (6) left every imported place at.

- **`gao`** (`city`, `Q188904`), **`kidal`** (`Q650100`), **`konna`**
  (`Q1764720`) and **`diabaly`** (`Q1764788`) are the four where A9's two steps
  agree exactly: each battle's own `P625` is the town's own point, to three
  decimals or better. `gao` serves two events.
- **`tessalit`** (`city`, `Q1025926`) is the fifth, with a 1.5 km gap between
  the siege's own point and the town's. The article explains the gap rather than
  contradicting it — the besieged camp was Amachach, *"about fifteen kilometers
  from Tessalit itself"* — and a second mark 1.5 km from the first would be the
  `london-q84` fault A14 (6) has just finished undoing.
- **`adrar-des-ifoghas`** (`region`, `Q366665`) is the sixth and the one
  disagreement. `battle-of-ifoghas`'s `P276` is Tessalit, which the import would
  have given it; its own `P625` is 1.2342E 19.8628N, 45 km south, in the massif
  the article names — *"the Adrar Tigharghar, a mountain of the Adrar of
  Ifoghas"*, the fighting *"mainly concentrated in the Ametettai Valley"*. **A9's
  first step wins over a held answer at its second for the second time in the
  run**, after batch 49's `te-li-ssu` (deviation 1421), and for the same reason:
  the town is where the supply line ran and not where the battle was.
- **`chadian-intervention-in-northern-mali` reuses `azawad`**, which the atlas
  has held since batch 37: the item carries no `P625` of its own, and its `P276`
  is `Q43937`, which is that record's item.

### The one refusal, and the shape it is

**`Q17149843`, the Azawad conflict, was imported and then deleted.** The item is
its own thing on Wikidata — the MNLA's falling-out with the Islamists, dated
27 June 2012 — but its English sitelink, "Azawad conflict", **redirects to
"Tuareg rebellion (2012)"**, which is the article `2012-tuareg-rebellion`
already cites, at the same revision. A record whose only English source is
another record's article is a duplicate waiting to happen, so it was dropped
from `data/imports/wikidata-seeds.json` and its file deleted before anything was
committed. What the item is *about* is in the atlas anyway: `battle-of-gao` is
the clash the item is dated by, and it arrived in this batch. **Deviation 1427.**

The cached lead `tools/import/cache/wikipedia/Q17149843.en.json` was written by
that first run and is left where it is: the cache is not data, it is never
published, and no record points at the item.

### The four deviations

- **1425.** *Wikimedia's 429 from this sandbox carries `retry-after: 1`, so the
  bucket is contended and not exhausted.* For two hours `en.wikipedia.org`
  refused almost every request — the action API, the REST summary and the REST
  HTML alike — and the first two fetch scripts, which backed off 20 and then 25
  seconds between attempts, made almost no progress in twenty minutes. The
  response headers say why: `retry-after: 1`, against a shared egress IP
  (`x-client-ip: 160.79.106.129`) that other work is also spending. Retrying
  **every two seconds** for up to ninety attempts got thirteen articles in a few
  minutes. Two further readings worth keeping: `index.php?action=raw` is
  throttled far more gently than `prop=extracts` or `api/rest_v1`, and pinning
  it to `&oldid=<revid>` read from one light `prop=revisions` call gives the
  exact revision the locator names rather than whatever is current.
- **1426.** *The import writes an event's place from `P276` and never from the
  event's own `P625`, so A9's first step is the fire's to run and not the
  tool's.* The first run of this batch put the eight events on disk with
  `place: null`, because `runImportMode` looks up `read.location` — the item's
  `P276` — in the places it already knows, and creates a place only for an item
  the seeds file names as a place. The fix was not to hand-edit eight records
  but to **roll the import state back** (remove the eight qids from
  `runs.import.done`), delete the eight files, add the six location items to
  `data/imports/wikidata-seeds.json`, and run again: `KINDS` puts places before
  events, so the second run created the six places and then pointed the eight
  events at them, with nothing written by hand. A9's first step is then a
  separate reading, and it changed exactly one answer (`adrar-des-ifoghas`).
- **1427.** *An item that is its own record on Wikidata can share another
  record's article.* `Q17149843`, the Azawad conflict, is distinct from
  `Q1525846`, the 2012 Tuareg rebellion, and its English sitelink redirects to
  the other's article — the same title, the same revision, 97,091 bytes of the
  same text. Nothing in the import can see this: the sitelink is a title and the
  redirect is resolved by the server. It was caught because two fetches came
  back with the same `revid`. A record whose only English source is another
  record's article is refused, and the refusal is a class the candidate sweep
  cannot rank for.
- **1428.** *An A7 widening can be the thing that makes an edge possible.* Every
  widening this run has written so far has closed a `date` flag or answered a
  review finding. This one was found the other way round: the coup's edge into
  Kidal was written, rule 4 would have refused it for running backwards, and the
  reason was that the record carried its own end date for both bounds. The
  article the record already cites states the start in its first clause. The
  brief's own words for A14 (1) — *never the date kept wrong* — read the same in
  this direction.

### The counts

| | before | after |
| --- | --- | --- |
| active events | 890 | **898** |
| main | 242 | **242** |
| filed | 648 | 656 |
| active edges | 859 | **867** |
| largest connected component | 617 | **624** |
| components | 201 | **202** |
| events with no edge at all | 158 | **159** |
| events with no place | 50 | 50 |
| validator | 0 errors, 426 warnings | **0 errors, 427 warnings** |
| per lane, active | Europe 378, Americas 216, Asia 149, Africa 147 | Europe 378, Americas 216, Asia 149, **Africa 155** |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 | unchanged |

The one new warning is `degree-zero` on `siege-of-tessalit`.

`docs/m53-polities.md` §4.1 is retaken at **383 of 898**, counted by overlap
**384**: **not one of the eight items carries a `P710` at all**, so all eight
arrived with `actors: []` and the `P710` pass had nothing to map. The
denominator moves and the numerator does not.

## Where the run stands after batch 50, for the fire that picks it up

*24 September, 13:07Z onward. An import fire, one batch and no code change.*

| | |
| --- | --- |
| corpus | **898 active** |
| **main** | **242**, unmoved through twenty-one batches, three curation fires and A14 |
| filed | 656 |
| active edges | **867** |
| largest connected component | **624** (+7) |
| components | **202** (+1) |
| events with no edge at all | **159** (+1): `siege-of-tessalit` |
| events with no place | **50**, unmoved: all eight arrived placed |
| validator | **0 errors, 427 warnings** |
| per lane, active | Europe 378, Americas 216, **Asia 149**, **Africa 155** |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 |

**A10's order of need has turned over again**: Africa is at 155 and **Asia
trails at 149**, so the next import batch is Asia's unless a chain crosses out
of it.

**What is open, in the order a fire should weigh it:**

- **The Asia vein to take is `Q8663` the Korean War or `Q170314` the Second
  Sino-Japanese War**, at 92 rows each, both named by batch 49's stand and both
  with endpoints inside the largest component. The method is now proved twice —
  batch 49 on the Russo-Japanese War and this batch on the Mali War — and it is
  the same one: pick the vein whose endpoints are already in the component, read
  each row's article, and write the edge only where a sentence argues one.
- **The Mali vein is not finished and is worth coming back to.** 103 rows
  answered and fifteen are now held; what is left with dates and an English
  article includes `Q8363015` the Battle of Timbuktu (March 2013),
  `Q9101600` the second, `Q6337939` Operation Panther — which the Ifoghas
  article names as the operation the battle was fought inside — `Q111480185` the
  Moura massacre (2022) and `Q128007033` the Battle of Tinzaouaten (2024), which
  would carry the chain from 2013 up to the present and into the two coups the
  atlas already holds.
- **`siege-of-tessalit` is the record this batch left edgeless**, and it is the
  first thing the next Africa fire should try: the articles read here argue
  nothing from it to anything held, and what would settle it is the coup's own
  sources on what the army's defeats in February and March 2012 did to the
  mutineers' patience.
- **`Q21028650`, the Algiers Accords of 2015, is refused on its class and is a
  question for a person**: its only `P31` is `Q321839`, agreement, whose own
  description — "understanding, agreement between two or more contracting
  persons, parties or entities" — covers a private contract as readily as a
  peace treaty, and the run does not guess a class that broad. It is the peace
  agreement the Mali chain ends at, so it is worth deciding.
- **C8 is still the run's largest single question** and no batch writes a
  parent-to-child edge; the 91 that exist stay. This batch wrote none: all eight
  records are `mali-war`'s children and every edge runs between siblings or out
  to a record that is not their parent.
- **`should the europe lane hold Russian Asia?`** is still the owner's, from
  batch 49 (deviation 1423).
- **The five questions of the A14 stand are unchanged** and unanswered: which
  record a lane guard clears, whether the cache may hold more than one revision,
  whether a certain reconciliation may write `wikidata`, whether a § Background
  mention is ever a `precondition-of`, and whether `parent` satisfies §1's bar.
- **`the-persecution-of-the-jews-1933-1941` and `porajmos` are still a two-node
  component**, and a curation fire still has the licence to rejoin it that an
  import fire does not.
- **Two of the fifteen tombstones still want an A6 umbrella and not an edge**:
  `1948-palestine-war` and `balkan-wars`.
- **`rhodesian-bush-war` is no longer the only active event with neither an edge
  nor a parent** — `siege-of-tessalit` has a parent but no edge, and the two are
  different faults.
- **Deviation numbers: take the next above 1428.** This fire wrote **1425 to
  1428**.

**The check is green on this fire's head.** Run 1726 of `validate.yml`, commit
`0b8543da`, conclusion `success`. Run 1725 on the history-shards head failed and
the failure was this batch's own and expected: `docs/m53-polities.md` §4.1 still
said 890 active events at that commit, and the retake landed in the docs commit
after it. Runs 1723 and 1724 were cancelled by the next push in the same
concurrency group, which is the ordering of rule 798 working rather than a
fault. **2,114 tests pass locally, 1,819 pure and 295 browser, with nothing
skipped.** The re-run allowance is unspent: nothing was re-run.

## Batch 51 — the Korean War read as a chain, and the component `parent` cannot join

*24 September, the fire that picked the run up at 15:45Z. Today already carries
a `## Curation 2026-09-24` section and **all six of A14's passes carry theirs**,
so this is an import fire and every one of the six is skipped by its own rule.
`origin/m0` was already an ancestor of `m42` at claim time, so no merge. The
claim at 13:07Z was 158 minutes old and `origin/m42` had not moved for 93, so
the protocol's ninety-minute clause let this fire take it. A10's order of need
has turned over as batch 50's stand said it would: **Asia trails at 149**
against Africa's 155 and Europe's 378, so this batch is nine Asia rows and no
other lane.*

### The vein, and the reason it was the right one to read and the wrong one to count

Batch 50's stand named two Asia veins and this is the first of them. `Q8663`,
the Korean War, answers **138 distinct rows** under the inverse `part of` vein,
and the atlas held exactly **one** of them — `battle-of-inchon`, which arrived
in batch 44 and has had no edge since. The other held Korean War records are
`korean-war` itself and `korean-armistice-agreement`.

Read through the query service (`query.wikidata.org/sparql`), which answered 200
on the first or second attempt throughout, and `en.wikipedia.org` through
`index.php?action=raw&oldid=<revid>` pinned from one light `prop=revisions`
call, which is deviation 1425's reading applied from the start: every one of the
ten articles came back inside two attempts, against the two hours of 429s batch
50 spent.

A11 (b)'s partition check was made before the import: none of the nine ids is on
`origin/m42b`, whose `data/events/` holds 1,172 ids.

In date order:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `first-battle-of-seoul` | 15 | 25 Jun 1950 | `seoul` (new) | `korean-war` |
| `battle-of-osan` | 15 | 5 Jul 1950 | `osan` (new) | `korean-war` |
| `battle-of-taejon` | 15 | 14–21 Jul 1950 | `daejeon` (new) | `korean-war` |
| `battle-of-the-pusan-perimeter` | 19 | 4 Aug – 18 Sep 1950 | `pusan-perimeter` (new) | `korean-war` |
| `second-battle-of-seoul` | 11 | 22–25 Sep 1950 | `seoul` (reused) | `korean-war` |
| `battle-of-unsan` | 7 | 25 Oct – 4 Nov 1950 | `unsan-county` (new) | `korean-war` |
| `battle-of-the-ch-ongch-on-river` | 11 | 25 Nov – 2 Dec 1950 | `chongchon-river` (new) | `korean-war` |
| `battle-of-chosin-reservoir` | 20 | 27 Nov – 13 Dec 1950 | `lake-changjin` (new) | `korean-war` |
| `third-battle-of-seoul` | 10 | 31 Dec 1950 – 7 Jan 1951 | `seoul` (reused) | `korean-war` |

All nine pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one inside `korean-war`'s 25 June 1950 to
27 July 1953; and **lane**, every one in Korea. All nine filed, so **main stays
at 242**, unmoved through twenty-two batches, three curation fires and A14.

**Three classes were added**, all of them places and all three read off the
item's own description rather than guessed: `Q718893` theater of war
(*"area or place in which important military events occur or are progressing"*),
`Q18534049` county of North Korea (*"subdivision from North Korea"*) and
`Q131681` reservoir (*"artificial lake impounded using a dam or lock to store
water"*), each as `place`/`region` — the precision `Q4022`, river, already
carries for the same reason, a thing on the ground longer than a town. Without
them the Pusan Perimeter, Unsan and the Chosin Reservoir would have arrived
placeless, and those are three of the nine. `Q178561` battle, `Q515` city,
`Q1549591` big city, `Q482821` metropolitan city of South Korea, `Q108178728`
national capital and `Q51929311` largest city were all in the table already.

### The nine edges, and the component they did not move

Nine edges, all `probable`, every one quoted from an article at the revision in
its own locator; the full table with the sentences is in
`docs/m42-connections.md` under "Batch 51". **Two run into or out of
`battle-of-inchon`**, which was already here, and the other seven chain the
batch to itself.

| from | type | to |
| --- | --- | --- |
| `first-battle-of-seoul` | precondition-of | `battle-of-osan` |
| `battle-of-osan` | precondition-of | `battle-of-taejon` |
| `battle-of-taejon` | enabled | `battle-of-the-pusan-perimeter` |
| `first-battle-of-seoul` | reacted-to | `battle-of-inchon` |
| `battle-of-inchon` | caused | `second-battle-of-seoul` |
| `battle-of-the-pusan-perimeter` | precondition-of | `battle-of-unsan` |
| `battle-of-unsan` | precondition-of | `battle-of-the-ch-ongch-on-river` |
| `battle-of-the-ch-ongch-on-river` | precondition-of | `battle-of-chosin-reservoir` |
| `battle-of-the-ch-ongch-on-river` | caused | `third-battle-of-seoul` |

**The largest connected component does not move. It is 624 before and 624
after, and this is the finding of the batch rather than its failure.** What the
batch built is a component of **ten** — the nine new records and
`battle-of-inchon` — which is now the second largest in the atlas, where before
it there was no Korean War component at all and `battle-of-inchon` was a
component of one. The component count therefore stays at 202 and the edgeless
count falls from 159 to 158: nine records arrive, every one of them with an
edge, and one record that was here loses its `degree-zero` warning.

**Why the ten do not join the 624 is C8, and this batch is the clearest case of
it the run has produced.** `korean-war` *is* inside the largest component,
through `chinese-civil-war --precondition-of--> korean-war` and
`korean-war --caused--> korean-armistice-agreement`, and every one of these
nine records is a child of it. `parent` is a display fact and never an argument,
so it is not a link; and A14 forbids a batch to write an edge from a parent to
its own child until the owner decides C8. So the war is in the component, its
battles are beside it, and the one edge that would join them is the one edge
this batch may not write. **The 91 parent-to-child edges that already exist
include `korean-war --caused--> korean-armistice-agreement`** — which is to say
the atlas already contains, on this very war, the edge whose successors are
barred.

Two edges to records outside the family were looked for and refused, and both
of them would have joined the ten to the 624 in one stroke. That is exactly why
they were read twice rather than once. Both refusals are written out in
`docs/m42-connections.md`; in short, the Chosin article's armistice sentence is
reporting *"for China, it won because"* and not asserting, and the Chinese Civil
War is named in these articles only for the PVA's rifles and its tactics. **The
batch that would most like a sentence is the batch that should trust one least**,
and the honest report is that the chain is nine records long, joined to one held
record, and waiting on C8 for the tenth link.

### A12 (4)'s participants — the largest single move an import has made

**Eight of the nine items carry a `P710`**, and every participant they name that
this atlas holds is one of four: `Q30` the United States, `Q145` the United
Kingdom, `Q423` North Korea and `Q884` South Korea, read as
`united-states-of-america`, `united-kingdom`, `korea-people-s-republic-of` and
`korea-republic-of`, all four `belligerent` — which is how `korean-war` and
`battle-of-inchon` already read the same items. `Q163098`, the Eighth United
States Army, is the one participant named that is not a record here, and
`Q18016068`, the First Battle of Seoul, is the one of the nine whose item
carries no `P710` at all. `docs/m53-polities.md` §4.1 goes from **383 of 898**
to **391 of 907**, counted by overlap from 384 to 392: eight events gained a
line, which is the biggest move an import has made to that row and the first
time in five batches the numerator has moved at all.

### A9's places, and the two steps agreeing seven times out of seven

Seven place records are new and **not one was hand-corrected**; all seven carry
`summary: null`, which is what A14 (6) left every imported place at, and the
`a9-place` flag.

- **`seoul`** (`city`, `Q8684`) serves three of the nine. Two of them —
  `first-battle-of-seoul` and `second-battle-of-seoul` — carry no `P625` of
  their own at all, so A9's first step has nothing to say and the second decides;
  `third-battle-of-seoul`'s own point is 1.4 km from the city's, which is the
  same picture.
- **`osan`** (`city`, `Q42129`), **`daejeon`** (`city`, `Q20921`),
  **`unsan-county`** (`region`, `Q708507`) and **`lake-changjin`** (`region`,
  `Q12614724`) are the four where the two steps differ by 5, 17, 13 and 15 km
  and the difference is the size of the thing, not a disagreement about where
  the battle was: a battle fought over a county, a metropolitan city, or a
  reservoir the article calls *"the Chosin Reservoir area"* is not at a point.
  Held at the second step in every case.
- **`pusan-perimeter`** (`region`, `Q24297886`) is the one where the two steps
  are the same point to the digit: the item's own `P625` and its `P276`'s are
  both 129.0403E 35.1N, because the perimeter is what it was fought over.
- **`chongchon-river`** (`region`, `Q499266`) is the widest gap, 37 km, and the
  reason is that a river's `P625` is a point on a line: the article puts the
  fighting *"along the Ch'ongch'on River Valley"* and the record is the valley.

**A9's first step changed no answer this batch**, which is the first batch in
three where it changed none — batch 49's `te-li-ssu` and batch 50's
`adrar-des-ifoghas` each had one.

### One date read off the article, and one disagreement written down instead

- **`battle-of-osan`** carried `1950-07-04`, the item's single `P585`. Its own
  cited article at revision 1375327001 dates the engagement to the next day,
  in its first sentence — *"On July 5, 1950, Task Force Smith ... was moved to
  Osan"* — and in its infobox, which reads *"July 5, 1950"*. The day is now
  5 July. **This is an A7 reading that *moves* a date by one day rather than
  widening a span, which the run has not done before: deviation 1429.** Nothing
  in the batch depended on it; the reason to do it is A14 (1)'s own words,
  *never the date kept wrong*.
- **`battle-of-taejon`** is the disagreement the other way round and is
  therefore **not** changed. The item's `P580` and `P582` give 14 to 21 July
  1950; the article at revision 1370312872 gives *"16–20 July 1950 (4 days)"*
  in its infobox and *"(16–20 July 1950)"* in its first sentence. A7 licenses
  widening an interval from the cited article and **not narrowing one**, so the
  wider bounds the item states are kept and the record's `review.note` says
  that two cited sources disagree about four days. The validator's
  `span-vs-lead-sentence` check does not catch it, because the cached lead's
  first sentence has the parenthetical stripped.

### The one refusal, and the vein it names for the next fire

**`Q485256`, the Chinese spring offensive, was chosen for this batch and set
aside before it was imported.** It is the largest thing in the vein that is not
here — 700,000 men, the last all-out PVA offensive of the war — and it fails
both of the batch's own tests at once. It carries **no `P276`, no `P131` and no
`P17`**, so A9's second step has nothing to reach and it would arrive
**placeless**; and its article at revision 1376272952 names no event this atlas
holds in a sentence that argues anything, so it would arrive **edgeless** as
well. Its § Aftermath reaches the armistice only through Operation Ripper and
the Jamestown Line, neither of which is a record here. A record that would
arrive placeless and edgeless is what A5 exists to stop, and the right answer
is not to import it alone but to take it **with the vein under it** — the Imjin
River (`Q16170016`, 6 sitelinks) and Kapyong (`Q713018`, 8) are both rows of
the same query, both dated, both with English articles, and the Imjin River is
named in the Third Battle of Seoul's own lead. **That is the next Asia batch.**

### The deviations

- **1429.** *An A7 reading may move a date and not only widen a span.* Every A7
  reading this run has written has widened an interval or closed a `date` flag.
  `battle-of-osan`'s item gives one day and its own cited article gives the
  next, twice over, in the first sentence and in the infobox. A7's licence is
  written as widening, and A14 (1)'s is written as *never the date kept wrong*;
  where the two point the same way at a one-day correction, the second decides
  and the record carries the note saying what moved and on what authority.
- **1430.** *A batch can be chosen for its endpoints, do everything right, and
  still not move the largest component, because `parent` is not a link.* Batch
  49's stand said to pick the vein whose endpoints are already inside the
  largest component, and `korean-war` and `korean-armistice-agreement` both
  are. What that advice cannot see is **which** kind of endpoint: a held
  *sibling* inside the component joins a chain to it, and a held *parent*
  inside the component does not, because the only edge that would reach it is
  the parent-to-child edge C8 bars. Mali worked because `operation-serval` and
  the coups were siblings. Korea does not, because the only held siblings are
  `battle-of-inchon`, which was isolated, and `korean-armistice-agreement`,
  which no article read here argues to. **A vein's endpoints should be counted
  as siblings inside the component, not as records inside it.**
- **1431.** *Wikimedia's rate limit is survivable if the first request is the
  cheap one.* Batch 50 spent two hours on 429s. This batch read eleven articles
  in a few minutes by never asking for `prop=extracts` or `api/rest_v1` at all:
  one `prop=revisions` call for the revid, then `index.php?action=raw&oldid=`
  for the text, each retried every two seconds. Deviation 1425 found this at
  the end of a bad afternoon; applied from the start it costs nothing.

### The counts

| | before | after |
| --- | --- | --- |
| active events | 898 | **907** |
| main | 242 | **242** |
| filed | 656 | 665 |
| active edges | 867 | **876** |
| largest connected component | 624 | **624** |
| second largest component | 8 | **10** |
| components | 202 | **202** |
| events with no edge at all | 159 | **158** |
| events with no place | 50 | 50 |
| validator | 0 errors, 427 warnings | **0 errors, 426 warnings** |
| per lane, active | Europe 378, Americas 216, Asia 149, Africa 155 | Europe 378, Americas 216, **Asia 158**, Africa 155 |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 | unchanged |

The one warning that goes away is `degree-zero` on `battle-of-inchon`, and no
new one arrives: every one of the nine has an edge, a place and a summary from
its own cited lead.

`docs/m53-polities.md` §4.1 is retaken at **391 of 907**, counted by overlap
**392**, which is A12 (4) above.

## Where the run stands after batch 51, for the fire that picks it up

*24 September, 15:45Z onward. An import fire, one batch and no code change.*

| | |
| --- | --- |
| corpus | **907 active** |
| **main** | **242**, unmoved through twenty-two batches, three curation fires and A14 |
| filed | 665 |
| active edges | **876** |
| largest connected component | **624** (unmoved; see below) |
| components | **202** (unmoved) |
| events with no edge at all | **158** (−1) |
| events with no place | **50**, unmoved: all nine arrived placed |
| validator | **0 errors, 426 warnings** |
| per lane, active | Europe 378, Americas 216, **Asia 158**, Africa 155 |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 |

**A10's order of need has turned over again**: Asia is at 158 and **Africa
trails at 155**, so the next import batch is Africa's unless a chain crosses out
of it.

**What is open, in the order a fire should weigh it:**

- **C8 is no longer the run's largest *single* question; it is now the thing
  keeping a ten-record component out of the largest one.** This batch is the
  case to put to the owner: nine Korean War battles, chained to each other and
  to `battle-of-inchon`, sitting beside a `korean-war` record that is inside the
  624, with `parent` between them and no edge allowed across it. Deciding C8
  one way joins ten records to the component at a stroke; deciding it the other
  way means the run should stop choosing veins by whether the *parent* is in the
  component. Until then no batch writes a parent-to-child edge and the 91 that
  exist stay.
- **The next Asia vein is the Chinese spring offensive with the vein under it**
  — `Q485256` with `Q16170016` the Battle of the Imjin River and `Q713018`
  Kapyong, and the rest of the 138 rows `Q8663` answers. Taken together they
  have places and they have edges; taken alone the offensive has neither, which
  is why this batch set it aside.
- **The Africa lane is what A10 asks for next**, and the Mali vein is still not
  finished: `Q8363015` the Battle of Timbuktu (March 2013), `Q9101600` the
  second, `Q6337939` Operation Panther, `Q111480185` the Moura massacre (2022)
  and `Q128007033` the Battle of Tinzaouaten (2024), which would carry the
  chain from 2013 up to the present and into the two coups the atlas holds.
- **`siege-of-tessalit` is still the record batch 50 left edgeless** and is
  still the first thing the next Africa fire should try.
- **`Q21028650`, the Algiers Accords of 2015, is still refused on its class and
  is still a question for a person** (batch 50).
- **The 138 rows of `Q8663` are the richest unread vein the run has found**, and
  this batch took nine of them. The next ones by sitelinks, all dated and all
  with English articles, are `Q5073209` the Tunam massacre (13), `Q4260079`
  Operation Pokpoong (11), `Q489561` Heartbreak Ridge (10), `Q289102` the
  Battle of Korea Strait (10) — which is fought at `korea-strait`, the place
  `korean-war` itself stands on — and `Q2890901` the Battle of Nam River (10).
- **`should the europe lane hold Russian Asia?`** is still the owner's, from
  batch 49 (deviation 1423).
- **The five questions of the A14 stand are unchanged** and unanswered.
- **`the-persecution-of-the-jews-1933-1941` and `porajmos` are still a two-node
  component**, and a curation fire still has the licence to rejoin it that an
  import fire does not.
- **Two of the fifteen tombstones still want an A6 umbrella and not an edge**:
  `1948-palestine-war` and `balkan-wars`.
- **Deviation numbers: take the next above 1431.** This fire wrote **1429 to
  1431**.

**The check is green on this fire's head.** Run 1735 of `validate.yml`, commit
`ec632fcf`, conclusion `success`. Runs 1733 and 1734, on the records and the
index commits, were cancelled by the next push in the same concurrency group,
which is the ordering of rule 798 working rather than a fault. **2,114 tests
pass locally, 1,819 pure and 295 browser, with nothing skipped.** The re-run
allowance is unspent: nothing was re-run.

## Batch 52 — the Mali War carried from 2013 to 2024, and the two pairs C8 leaves stranded

*24 September, the fire that picked the run up at 17:59Z. Today already carries
a `## Curation 2026-09-24` section and **all six of A14's passes carry theirs**,
so this is an import fire and every one of the six is skipped by its own rule.
`origin/m0` was already an ancestor of `m42` at claim time, so no merge. The
claim at 15:45Z was 134 minutes old and `origin/m0` had not been pushed for over
seven hours, so the protocol's ninety-minute clause let this fire take it. A10's
order of need has turned over as batch 51's stand said: **Africa trails at 155**
against Asia's 158 and Europe's 378, so this batch is seven Africa rows and no
other lane.*

### The vein, and why it was read by its endpoints rather than by its size

`Q2946372`, the Mali War, answers **81 distinct rows** with an English article
under the inverse `part of` vein, and the atlas held **fourteen** of them before
this batch. Batches 44 and 50 took the 2012–2013 core; batch 50's stand named
five rows as what was left of the vein, and this batch read all five, took two
of them and refused three, then went back to the query and took five more that
the stand had not named — because the five it named would have arrived as an
island and the five it did not include the two records whose articles name a
coup this atlas already holds.

Read through the query service (`query.wikidata.org/sparql`), which answered 200
on the first attempt, and `en.wikipedia.org` through
`index.php?action=raw&oldid=<revid>` pinned from one light `prop=revisions`
call — deviation 1431's reading, applied from the start again. Eleven articles
came back in a few minutes; no request was retried more than twice.

A11 (b)'s partition check was made before the import, by id and by Wikidata
item: none of the seven is on `origin/m42b`, whose `data/events/` holds 1,198
ids.

In date order:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `third-battle-of-gao` | 4 | 9–11 Feb 2013 | `gao` (reused) | `mali-war` |
| `fourth-battle-of-gao` | 4 | 20–23 Feb 2013 | `gao` (reused) | `mali-war` |
| `battle-of-timbuktu` | 4 | 20–21 Mar 2013 | `timbuktu` (new) | `mali-war` |
| `second-battle-of-timbuktu` | 3 | 30 Mar – 1 Apr 2013 | `timbuktu` (reused) | `mali-war` |
| `moura-massacre` | 9 | 27–31 Mar 2022 | `moura` (new) | `mali-war` |
| `kidal-offensive` | 3 | 2 Oct – 20 Dec 2023 | `kidal-region` (new) | `mali-war` |
| `french-military-withdrawal-from-west-africa` | 3 | 18 Mar 2022 – 18 Jul 2025 | `mali-q912` (reused) | `mali-war` |

All seven pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one inside `mali-war`'s open interval from
16 January 2012; and **lane**, every one in Africa. All seven filed, so **main
stays at 242**, unmoved through twenty-three batches, three curation fires and
A14.

**Two classes were added**, both read off the class item's own description
rather than guessed: `Q1760704` withdrawal (*"military maneuver of abandoning
territory and returning to a safer area"*) as `event`/`war`, which is the
category `Q645883` military operation and `Q2001676` offensive already carry;
and `Q743074` region of Mali as `place`/`region`, for Kidal Region. Without the
first the French withdrawal would have been refused on its class as
`Q21028650`, the Algiers Accords, still is; without the second the Kidal
offensive would have arrived placeless.

### The five edges, and the three that moved the component

Five edges, all `probable`, every one quoted from an article at the revision in
its own locator; the full table with the sentences is in
`docs/m42-connections.md` under "Batch 52".

| from | type | to |
| --- | --- | --- |
| `2021-malian-coup-d-etat` | caused | `french-military-withdrawal-from-west-africa` |
| `2021-malian-coup-d-etat` | precondition-of | `kidal-offensive` |
| `2020-malian-coup-d-etat` | precondition-of | `moura-massacre` |
| `battle-of-timbuktu` | precondition-of | `second-battle-of-timbuktu` |
| `third-battle-of-gao` | precondition-of | `fourth-battle-of-gao` |

**The largest connected component goes from 624 to 627**, and the three records
that joined it did so because the held record each reaches is a *sibling* inside
it and not a parent. That is batch 51's deviation 1430 used as the rule it was
written to be: the vein was chosen by asking which of its rows could reach
`2020-malian-coup-d-etat` or `2021-malian-coup-d-etat`, both of which have been
inside the 624 since batch 44, rather than by asking whether `mali-war` is.

**The other two edges build two pairs and the pairs stay pairs.** The two
battles of Timbuktu are a component of two and the third and fourth battles of
Gao are another, because the only record in the largest component either family
can reach is `mali-war`, which is their parent, and A14 bars a batch from
writing a parent-to-child edge until the owner decides C8. The component count
therefore rises from 202 to **204** — the two new pairs — and the edgeless count
does not move at all, staying at 158: all seven arrivals have an edge and no
record that was already here gains its first.

### A9's places, and the event whose location is six countries

Three place records are new and **not one was hand-corrected**; all three carry
`summary: null`, which is what A14 (6) left every imported place at, and the
`a9-place` flag.

- **`timbuktu`** (`city`, `Q9427`) serves both battles of Timbuktu, whose items
  give the same `P625` — the town's own coordinate template, 16.7667N 3.0000W —
  and both name `Q9427` under `P276`. A9's two steps agree.
- **`moura`** (`city`, `Q6925960`, the item's own label *Mourrah*) is the batch's
  cleanest agreement: `moura-massacre`'s own `P625` and the village's are
  14.327778N 4.6W to the digit.
- **`kidal-region`** (`region`, `Q338988`) is the one where the two steps differ
  and the second is held. The offensive's own `P625` is 215 km south of the
  region's point, which is the size of the thing and not a disagreement: the
  article states the offensive's objective as *"the capture of MINUSMA bases in
  Kidal Region"*, and the convoy's route from Gao is what the point sits on.
  Deliberately **not** the atlas's `kidal`, which is the town (`Q650100`): the
  name does not fold to the same string and the two are 170 km apart.

**`gao` and `mali-q912` were reused**, the first for both Gao battles — whose
items give the town's point to the digit — and the second for the French
withdrawal, which is the one place decision in this batch that is a compromise
and is written down as one in the record's own `review.note`. `Q131697486`
carries no `P625` and **six** values under `P276` — Mali, Burkina Faso, Niger,
Chad, Senegal, Côte d'Ivoire — and A9's second step takes the first. The mark
goes on Mali, which is the country this record's own vein is about and the one
`mali-war` itself stands on, and the other five are not drawn. That is review
finding 1's open question — *may a multi-valued location place an event at all*
— met for the first time by an event whose location genuinely is six countries
rather than by an item with a stray `P17`, and it is recorded rather than
hidden (deviation 1434).

**A9's first step changed no answer this batch**, as in batch 51.

### Two dates read off the articles, in opposite directions

- **`third-battle-of-gao`** carried `2013-02-10` to `2013-02-11` from the item's
  `P580` and `P582`. Its own cited article at revision 1370750328 gives *"9–11
  February 2013"* in its first sentence and its infobox alike, so the interval is
  **widened** to 9–11 February under A7, which is A7 used exactly as written.
- **`second-battle-of-timbuktu`** is the other direction and is the deviation of
  this batch. The item gives 20 March to 1 April 2013; the article at revision
  1370736664 gives *"between March 30 and April 1, 2013"* in its first sentence
  and *"30 March 2013 – 1 April 2013"* in its infobox. A7 licenses widening and
  not narrowing, and batch 51 refused to narrow `battle-of-taejon` for exactly
  that reason. **This one is narrowed anyway, and the reason is that 20 March is
  not a wider reading of this battle — it is the other battle's date**, and this
  atlas now holds that other battle as `battle-of-timbuktu`, 20–21 March 2013.
  Keeping the item's bound would have made the atlas assert that the second
  battle of Timbuktu began on the day the first one did and contained it, and
  would have left the edge between them running from a record to one that starts
  on the same day. Deviation 1432.
- **`fourth-battle-of-gao`** is the disagreement that is *not* resolved, and is
  handled as `battle-of-taejon` was: the item's `P582` gives 23 February, the
  article gives *"20–22 February 2013"* twice over, the wider bound is kept, the
  `date` flag stays and `review.note` says two cited sources disagree about one
  day.

### A12 (4)'s participants — nothing again

**Not one of the seven items carries a `P710`.** The one row of the vein that
does — `Q128007033`, the Battle of Tinzaouaten, whose item names four
participants — is the row this batch refused. So all seven arrived with
`actors: []`, `docs/m53-polities.md` §4.1 goes from **391 of 907** to **391 of
914**, counted by overlap unchanged at 392, and the denominator moves while the
numerator does not. That is the same reading batch 50 produced on the same vein:
the Mali War's rows are, on Wikidata, almost entirely unparticipated.

### The four refusals, and the one that is a new kind

Three candidates were refused for the reason A5 exists — they would have arrived
**edgeless** — and are written out in `docs/m42-connections.md`: `Q128007033`
the Battle of Tinzaouaten (2024), `Q123058541` the Siege of Timbuktu (2023),
whose lead states one relation and it is to MINUSMA, which this atlas does not
hold, and `Q8578070` the Fifth Battle of Gao.

**`Q6337939`, Operation Panther, is the new kind.** It is not edgeless: its
article names `battle-of-ifoghas`, which this atlas has held since batch 50. But
the sentence is a § See also line — *"Battle of Ifoghas, fighting in the Adrar
des Ifoghas rock massif during Operation Panther"* — and what it states is
**containment**. Containment is `parent` and not an edge; and the moment it is
`parent`, C8 bars the only edge that would then join the two, so importing the
operation would add a record whose one relation to the atlas is a relation the
atlas is currently forbidden to draw. As a filing it does not fit either: the
battle runs 18 February to 31 March and the operation 19 February to 25 March,
so the child is outside its parent at both ends and rule 24 would warn. Refused,
and named here because **C8 is now costing the run records it would otherwise
import, and not only edges it would otherwise write** (deviation 1433).

### The deviations

- **1432.** *An A7 reading may narrow an interval where the wider bound the item
  gives is demonstrably another record's date.* A7 is written as a licence to
  widen, and batch 51 refused to narrow `battle-of-taejon` on four days of
  genuine disagreement about where a battle's edges are. `second-battle-of-timbuktu`
  is not that: its item's start, 20 March 2013, is the start of the *first*
  battle of Timbuktu, which arrived in this same batch as its own record, and
  the cited article gives 30 March in both its first sentence and its infobox.
  Where the wider bound belongs to another record the atlas holds, keeping it is
  A14 (1)'s *"the date kept wrong"*, and the article decides. The record says in
  `review.note` what moved and on what authority. This narrows 1429's principle
  to one testable condition and does not open narrowing generally: a
  disagreement about a battle's own boundaries is still kept wide.
- **1433.** *C8 now costs the run records and not only edges.* Until this batch
  the parent-to-child bar meant an edge that could not be written between records
  that were both here. `Q6337939` is a candidate whose **only** relation to this
  atlas is a containment one, so under the bar it would arrive with nothing at
  all and A5 refuses it. A vein read to its end will produce more of these — an
  operation and the battle inside it, a war and its campaign — and each one is a
  record the atlas does not get. That is a second and larger cost to put beside
  the ten Korean War records of batch 51, and it belongs in the case for
  deciding C8.
- **1434.** *A9's second step, met by an event whose location genuinely is six
  countries.* Review finding 1 asks whether a multi-valued location may place an
  event at all, and the examples it had were items with a stray `P17` — the Great
  Depression in Kabul. `Q131697486` is the honest version of the question: the
  French withdrawal from West Africa happened in Mali, Burkina Faso, Niger, Chad,
  Senegal and Côte d'Ivoire, and every one of the six is true. A9 takes the
  first, so the mark goes on Mali. It is defensible here — Mali is the vein, the
  parent and the lane — and it will not be defensible the next time the first
  value is arbitrary. The rule the owner is being asked for is narrow: **where
  `P276` has more than one value and they are not nested, may the run place the
  event at all, and if so by what order?**

### The counts

| | before | after |
| --- | --- | --- |
| active events | 907 | **914** |
| main | 242 | **242** |
| filed | 665 | 672 |
| active edges | 876 | **881** |
| largest connected component | 624 | **627** |
| second largest component | 10 | **10** |
| components | 202 | **204** |
| events with no edge at all | 158 | **158** |
| events with no place | 50 | **50** |
| validator | 0 errors, 426 warnings | **0 errors, 426 warnings** |
| per lane, active | Europe 378, Americas 216, Asia 158, Africa 155 | Europe 378, Americas 216, Asia 158, **Africa 162** |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 | unchanged |

Not one warning moves in either direction, which is the first batch of the run
where that is true: every one of the seven arrives with an edge, a place, a
summary from its own cited lead and a parent, and no record already here changes
state.

`docs/m53-polities.md` §4.1 is retaken at **391 of 914**, counted by overlap
**392**, which is A12 (4) above.

## Where the run stands after batch 52, for the fire that picks it up

*24 September, 17:59Z onward. An import fire, one batch and no code change.*

| | |
| --- | --- |
| corpus | **914 active** |
| **main** | **242**, unmoved through twenty-three batches, three curation fires and A14 |
| filed | 672 |
| active edges | **881** |
| largest connected component | **627** (+3) |
| components | **204** (+2, the two pairs below) |
| events with no edge at all | **158**, unmoved |
| events with no place | **50**, unmoved: all seven arrived placed |
| validator | **0 errors, 426 warnings** |
| per lane, active | Europe 378, Americas 216, **Africa 162**, Asia 158 |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 |

**A10's order of need has turned over again**: Africa is now at 162 and **Asia
trails at 158**, so the next import batch is Asia's unless a chain crosses out of
it.

**What is open, in the order a fire should weigh it:**

- **C8 has a second cost now and the case for putting it to the owner is
  stronger than it was this morning.** Batch 51 showed it keeping ten records out
  of the largest component; this batch shows it keeping two pairs out (four
  records, `battle-of-timbuktu`/`second-battle-of-timbuktu` and
  `third-battle-of-gao`/`fourth-battle-of-gao`, each reachable only through
  `mali-war`) **and** refusing a record outright, `Q6337939` Operation Panther,
  whose only relation to this atlas is containment (deviation 1433). Until it is
  decided no batch writes a parent-to-child edge and the 91 that exist stay.
- **The next Asia vein is the Chinese spring offensive with the vein under it**
  — `Q485256` with `Q16170016` the Battle of the Imjin River and `Q713018`
  Kapyong, and the rest of the 138 rows `Q8663` answers. Batch 51 set the
  offensive aside because alone it has neither a place nor an edge; taken with
  the two under it, it has both. That is still the next Asia batch, and the lane
  now asks for it.
- **The other rows of `Q8663` by sitelinks**, all dated and all with English
  articles, are unchanged from batch 51's stand: `Q5073209` the Tunam massacre
  (13), `Q4260079` Operation Pokpoong (11), `Q489561` Heartbreak Ridge (10),
  `Q289102` the Battle of Korea Strait (10) — fought at `korea-strait`, the place
  `korean-war` itself stands on — and `Q2890901` the Battle of Nam River (10).
- **`battle-of-tinzaouaten` (`Q128007033`) is the best Africa row still
  unimported** and is refused only for want of a sibling: 9 sitelinks, dated,
  placed, four participants on its item, and no sentence in its article naming a
  record this atlas holds. The row that would unlock it is one the CSP or Wagner
  fought that the atlas also holds; none exists yet. A fire that takes two or
  three of the 2023–2024 rows together may get it.
- **`siege-of-tessalit` is still the record batch 50 left edgeless**, and this
  fire read its own article end to end at revision 1370745744 rather than
  guessing again. **There is no edge in it.** Every event it names is a place —
  Tessalit, Tinsalane, Kidal, Anefif, In-Khalil, Gao — and the only record this
  atlas holds that its prose names is `2012-tuareg-rebellion`, in the lead's
  *"occurred in early 2012 during the Tuareg rebellion in Mali"*, which is
  containment and not cause; as a filing that would be a second parent under A8
  and a two-deep nest under a `mali-war` it already has, and as an edge it is
  what C8 bars. The Mali War rows read for this batch name Tessalit as ground and
  never as an event. **A later fire should stop trying this record from the Mali
  vein**: what it wants is the Ambush of Tinsalane, which the siege's own
  February section names as the engagement that decided it — *"the planned
  transport convoy carrying Malian soldiers … was ambushed by a brigade of the
  MNLA"*, and *"a month later Tessalit fell"*. That article exists on the English
  Wikipedia (page 75084621) and **carries no Wikidata item at all**, so it is not
  a row of any query this run can make and cannot be imported under A2. A record
  reachable only through an itemless article is a new shape of gap and is put
  here rather than rediscovered.
- **`Q21028650`, the Algiers Accords of 2015, is still refused on its class and
  is still a question for a person** (batch 50), and it is now named in the lead
  of a record the atlas holds — `kidal-offensive` — which is a reason to settle
  it.
- **The multi-valued-location question is now a concrete one** (deviation 1434),
  with `french-military-withdrawal-from-west-africa` as the example: where `P276`
  has more than one value and they are not nested, may the run place the event,
  and by what order?
- **`should the europe lane hold Russian Asia?`** is still the owner's, from
  batch 49 (deviation 1423).
- **The five questions of the A14 stand are unchanged** and unanswered.
- **`the-persecution-of-the-jews-1933-1941` and `porajmos` are still a two-node
  component**, and a curation fire still has the licence to rejoin it that an
  import fire does not.
- **Two of the fifteen tombstones still want an A6 umbrella and not an edge**:
  `1948-palestine-war` and `balkan-wars`.
- **Deviation numbers: take the next above 1434.** This fire wrote **1432 to
  1434**.

**The check is green on this fire's head.** Run 1746 of `validate.yml`, commit
`998a2e82`, conclusion `success`. Run 1745, on the index commit, failed on one
test and one only — `docs/m53-polities.md` §4.1's denominator, which rule 798's
ordering leaves stale between the index commit and the docs commit that retakes
it; run 1744, on the records commit, was cancelled by the next push in the same
concurrency group, which is that ordering working rather than a fault.
**2,114 tests pass locally, 1,819 pure and 295 browser, with nothing skipped.**
The re-run allowance is unspent: nothing was re-run.

## Batch 53 — the Korean War read forward from the invasion, and the parent that is in the 651

*24 September, the fire that picked the run up at 20:25Z. Today already carries
a `## Curation 2026-09-24` section and **all six of A14's passes carry theirs**,
so this is an import fire and every one of the six is skipped by its own rule.
The claim at 18:00Z was 145 minutes old and `origin/m42` had not been pushed for
96 minutes, so the protocol's ninety-minute clause let this fire take it.
`origin/m0` was **not** an ancestor of `m42`, so the merge of STEP 1 was made:
it came through clean, the rebuilt index was byte-identical, and it is what
carries the corpus from the 914 active of batch 52's stand to the 982 this batch
started from. A10's order of need has turned over again as batch 52's stand
said: **Asia trails at 158** against Africa's 162 and Europe's 426, so this
batch is seven Asia rows and no other lane.*

### The vein, and the eighth row that was left

`Q8663`, the Korean War, answers **113 distinct rows** with an English article
under the inverse `part of` vein, and the atlas held **ten** of them before this
batch. Batch 51 took the 1950 core and named the next Asia batch in its stand:
the Chinese spring offensive `Q485256` with `Q16170016`, the Battle of the Imjin
River, and `Q713018`, Kapyong, under it, and the other rows of `Q8663` by
sitelinks beside them. This fire read all six of those and two more, took seven
and refused one.

Read through the query service (`query.wikidata.org/sparql`), which answered 200
on the first attempt, and `en.wikipedia.org` through
`index.php?action=raw&oldid=<revid>` pinned from one light `prop=revisions`
call. **Every Wikimedia API — `en.wikipedia.org`, `api.wikimedia.org` and
`www.wikidata.org` alike — answered 429 for the first twenty-five minutes of
this fire** (deviation 1435); the query service was never refused. Eight articles
came back once it cleared.

A11 (b)'s partition check was made before the import, by id and by Wikidata
item: none of the eight is on `origin/m42b`, whose `data/events/` holds 1,220
ids.

In date order:

| the record | sitelinks | dates | placed at | filed under |
| --- | --- | --- | --- | --- |
| `operation-pokpung` | 11 | 25–30 Jun 1950 | `south-korea-q884` (new) | `korean-war` |
| `battle-of-korea-strait` | 10 | 25–26 Jun 1950 | `korea-strait` (reused) | `korean-war` |
| `chaplain-medic-massacre` | 13 | 16 Jul 1950 | `duman-ri` (new) | `korean-war` |
| `battle-of-nam-river` | 10 | 31 Aug – 19 Sep 1950 | `nam-river` (new) | `korean-war` |
| `chinese-spring-offensive` | 6 | 22 Apr – 10 Jun 1951 | `korean-peninsula` (reused) | `korean-war` |
| `battle-of-the-imjin-river` | 6 | 22–25 Apr 1951 | `imjin-river` (new) | `chinese-spring-offensive` |
| `battle-of-kapyong` | 8 | 22–27 Apr 1951 | `gapyeong-county` (reused) | `chinese-spring-offensive` |

All seven pass the three tests unchanged since batch 20 — **depth**, which the
query guarantees; **span**, every one inside `korean-war`'s 25 June 1950 – 27
July 1953; and **lane**, every one in Asia. All seven filed, so **main stays at
242**, unmoved through twenty-four batches, three curation fires and A14.

**One class was added**, read off the class item's own description rather than
guessed: `Q135010` war crime (*"individual act constituting a serious violation
of the laws of war"*) as `event` with **no category**, which is what `Q3199915`
massacre already carries — `data/categories.json` has no kind for an atrocity
and `war` would say the record is the fighting. `Q4022` river was already in the
table from M42b batch 3 and is what the two river places take their precision
from.

**Three titles are the article's and not the item's** (A12 (5)): `Q5073209`'s
label is "Tunam massacre" and its article is "Chaplain–Medic massacre";
`Q4260079`'s label is "Operation Pokpoong" and its article is "Operation
Pokpung"; `Q485256` capitalises "Spring Offensive" and its article does not.
All three were found by asking the query service for the sitelink rather than by
guessing the title, after the action API resolved the item labels to redirects.

**Two intervals were widened from the article under A7**, each at the revision
cited on the record: the Korea Strait battle from the item's single `P585` of 26
June to the article's *"25–26 June 1950"*, and Kapyong from the item's `P582` of
25 April to the article's *"22–27 April 1951"*. **A third was left wide and
flagged.** `chinese-spring-offensive`'s item gives `P582` 10 June 1951 while its
article's infobox and the item's own `P585` both give 22 May; A7 is a licence to
widen and not to narrow, so the wider bound is kept, the `date` flag stays and
`review.note` says which two cited sources disagree — which is exactly how batch
51 left `battle-of-taejon` and batch 52 left `fourth-battle-of-gao`. Narrowing
here would have been a third reading of A7 on the strength of one infobox, and
the offensive's span is not what any filing in this batch turns on.

### The five edges, and the component they could not reach

Five edges, all `probable`, every one quoted from an article at the revision in
its own locator; the full table with the sentences is in
`docs/m42-connections.md` under "Batch 53".

| from | type | to |
| --- | --- | --- |
| `operation-pokpung` | caused | `first-battle-of-seoul` |
| `operation-pokpung` | precondition-of | `battle-of-the-pusan-perimeter` |
| `operation-pokpung` | caused | `battle-of-korea-strait` |
| `battle-of-osan` | precondition-of | `chaplain-medic-massacre` |
| `battle-of-kapyong` | enabled | `battle-of-the-imjin-river` |

**The largest connected component does not move, and C8 is the whole reason.**
It stays at **651**. Three of the five edges run into records that were already
here — `first-battle-of-seoul`, `battle-of-the-pusan-perimeter` and
`battle-of-osan` — but all three sit in the corpus's **second** component, the
ten Korean War battles batch 51's stand already named as kept out of the 651 by
C8. That component goes from **10 to 13**. The one record in the 651 that every
one of them can reach is `korean-war`, which is their parent, and A14 bars the
edge until the owner decides.

This is now the third batch in a row to measure the same cost, and it is the
largest measurement yet: **thirteen records, a whole war, held outside the
largest component by one rule.** Batch 51 measured ten, batch 52 measured four
records and one refused outright; this batch adds three to the thirteen and
moves the largest component not at all. A fire that could write
`korean-war` → `first-battle-of-seoul` would join all thirteen in one edge.

**Two of the seven arrive edgeless** and the count goes from 176 to 178.
`chinese-spring-offensive` is an umbrella whose only relations its article
states are to its own parent (`korean-war`) and its own two children, all three
barred by C8. `battle-of-nam-river` is the refusal below. The component count
therefore rises from 230 to **233**: those two, and the pair
`battle-of-the-imjin-river`/`battle-of-kapyong`, which reach nothing but each
other and their parent.

### The refusals

- **`Q489561`, the Battle of Heartbreak Ridge (10 sitelinks, dated, placed),
  was read and left.** Its article names one other event in a causal sentence —
  *"After withdrawing from Bloody Ridge, the KPA set up new positions just 1500
  yd away"* — and Bloody Ridge (`Q2035177`) is not a record this atlas holds. It
  would have arrived as a third edgeless record. **The row that unlocks it is
  `Q2035177`**, and a later Asia batch should take the two together: the pair is
  one stated sentence apart.
- **`battle-of-nam-river` was imported and its one candidate edge refused.** The
  article's § North Korean withdrawal says *"The UN counterattack at Inchon
  outflanked the KPA and cut off all their main supply and reinforcement
  routes"*, which is a statement about how this battle **ended**; as an edge
  `battle-of-inchon` → `battle-of-nam-river` it would read as Inchon causing the
  battle, and reversed it is the "until" chronology the fires already refuse.
- **`battle-of-nam-river` is filed under `korean-war` and not under the umbrella
  its own article names.** The infobox reads *"part of the Battle of Pusan
  Perimeter"*, but that record runs 4 August – 18 September 1950 and this battle
  runs to 19 September, so M62's span test refuses the nearer umbrella **by one
  day**. A later fire that widens the perimeter's interval under A7 from the
  perimeter's own article should re-file it; the reason is on the record.

### A9's places, and the two the strait and the peninsula already had

Four place records are new and **not one was hand-corrected**; all four carry
`summary: null`, which is what A14 (6) left every imported place at, and the
`a9-place` flag. Three were reused.

- **`south-korea-q884`** (`country`, `Q884`) is `operation-pokpung`'s place by
  A9's second step: the item carries no `P625` of its own and its `P276` is
  South Korea. The article's own location field is the 38th parallel, which is a
  line and not a thing this atlas holds a record for.
- **`duman-ri`** (`point`, no item) is A9's first step and the batch's cleanest:
  the massacre's own `P625` and the article's coordinate template agree to six
  digits, and the village itself has no item this pass could reach.
- **`imjin-river`** (`region`, `Q495534`) and **`nam-river`** (`region`,
  `Q485254`) are both A9's second step over a river. The Imjin battle's own
  `P625` is 28 km up the same river from the river item's point, which is the
  length of the thing and not a disagreement. The Nam River battle's item
  carries **two** `P625` values, 5 km and 17 km from the river item's point, and
  A9's first step says nothing about which of two coordinates to take —
  deviation 1434's question in a second shape, and the reason the second step
  was taken there too.
- **`korea-strait` and `korean-peninsula` were reused rather than duplicated.**
  The strait battle's own `P625` is the water off Busan and its article's
  location field reads *"off the coast of Busan, in the Korea Strait"*; the
  spring offensive's own `P625` is `Q16170016`'s to six digits — one action on a
  front its own location field calls *"near the 38th Parallel, Korea"*. Writing
  either as a new point place would have put a near-duplicate beside a record
  the atlas already holds and, for the offensive, named a campaign after one of
  its battles.
- **`gapyeong-county` was reused**: Kapyong's own `P625` is 5 km from the
  county's point, so A9's two steps agree at county scale.

### The counts

| | before | after |
| --- | --- | --- |
| corpus | 982 active | **989 active** |
| **main** | 242 | **242** |
| filed | 740 | 747 |
| active edges | 924 | **929** |
| largest connected component | 651 | **651** |
| second component | 10 | **13** |
| components | 230 | **233** |
| events with no edge at all | 176 | **178** |
| validator | 0 errors, 480 warnings | **0 errors, 482 warnings** |
| per lane, active | Europe 426, Americas 236, Africa 162, **Asia 158** | Europe 426, Americas 236, **Asia 165**, Africa 162 |
| per lane, main | Europe 89, Asia 67, Americas 55, Africa 31 | unchanged |

The two new warnings are the two `degree-zero` above and no new class.

### The deviations

- **1435.** *Every Wikimedia API can refuse this sandbox at once, and the query
  service is the one that does not.* Deviation 1424 split reconnaissance (the
  query service) from the import (the action API) because the two behave
  differently. This fire found a third state: for the first twenty-five minutes
  `en.wikipedia.org/w/api.php`, `en.wikipedia.org/w/index.php?action=raw`,
  `api.wikimedia.org` and `www.wikidata.org/w/api.php` **all** answered `429 You
  are making too many requests to the API`, with a descriptive User-Agent and a
  contact address, while `query.wikidata.org/sparql` answered 200 throughout.
  The limit is on the shared egress and not on this run's rate, so it is not
  something a fire can fix by slowing down and it is **not** "no network in this
  sandbox". The answer is patience: a retry loop at 30–45 second intervals in
  the background, and the rest of the fire's work — the partition check, the
  before-measurement, the class table, the held-record survey — done while it
  waits. It cleared on the fourth attempt.
- **1436.** *An item's label is not its article's title, and the action API
  silently resolves the difference into the wrong page.* Asking
  `prop=revisions` for the eight rows by their Wikidata **labels** returned a
  page for every one of them, but three were redirects whose newest revision was
  years old: "Tunam massacre" → "Chaplain–Medic massacre", "Operation Pokpoong"
  → "Operation Pokpung", "Chinese Spring Offensive" → "Chinese spring
  offensive". A stale `revid` beside a plausible title is the failure that gets
  a wrong revision cited on a record. **The title comes from the item's own
  `schema:about` sitelink, asked of the query service**, never from its label —
  which is also what A12 (5) has been saying about `titleFor()` from the other
  side. Three of eight rows in one batch is not a rare case.
- **1437.** *A record can miss its own article's umbrella by one day, and M62's
  span test then refuses the truer filing.* `battle-of-nam-river`'s infobox
  reads *"part of the Battle of Pusan Perimeter"* and the atlas holds that
  record at 4 August – 18 September 1950, from its item; this battle runs to 19
  September. Filing it there would date a child outside its parent, so it is
  filed under `korean-war` with the reason on the record. The fix is not a
  looser span test but A7 on the **parent**: a fire that reads the perimeter's
  own article and widens its interval should re-file the child. Until then, a
  batch that meets this should say so on the record rather than file against the
  test or drop the row.

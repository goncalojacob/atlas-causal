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

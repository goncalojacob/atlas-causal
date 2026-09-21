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
| 1 | **The named neighbours.** The row whose English label names a record that §5 of `docs/m42-connections.md` says a retracted event is waiting for: the dissolution of the Soviet Union, the revolutions of 1989, the breakup of Yugoslavia, the Bosnian war, the Rwandan genocide, the Angolan civil war, the Egyptian revolution of 2011, the Arab Spring, the second intifada, the Anglo-Irish treaty, the Troubles, the Treaty of Lisbon, the partition of India, the Berlin conference, the second Italo-Ethiopian war, the independence of South Sudan. Whole label first, then as a substring; where a label names more than one item, the higher sitelink count decides |
| 2 | **The bridges out of the fragments.** After set 1, the best by sitelinks whose label names a war, revolution, treaty or crisis that one of the atlas's own fragments argues to or from — the Ukrainian and Caucasian eight, the South Asian five, the Gaza three, the two Chinese, the two Gulf — read off §2 of `docs/m42-connections.md` |
| 3 | **Thin decades.** After sets 1–2, the best by sitelinks dated in each decade the corpus is thinnest in, so that no decade of the period is left with nothing |
| 4 | **Remainder to the cap**, the best remaining by sitelinks over the whole pool |

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

Three batches are on `m42` and each was validated, indexed and pushed before
the next, so a killed run loses a batch and not the milestone.

| | what landed |
| --- | --- |
| batch 0 | the fifteen M44b retracted that the new bar puts back, 18 edges |
| batch 1 | seven earlier tombstones — M40b's and M22's — 7 edges |
| batch 2a | the twelve hinges seeded, ten classes, twelve lanes, one rewind |

**Two Action runs are queued on `import-wikidata.yml`**, which takes them one
at a time (`concurrency: import-wikidata`, never cancelling):

- `import/candidates-2026-09-21`, the fresh sweep amendment A2 names, pushed
  at 00:52Z and still running. It writes `docs/wikidata-candidates.md` and
  nothing else. **It is not on the critical path**: the committed sweep holds
  1,586 unwalked rows and §5's rule reads either.
- `import/run-m42-2026-09-21`, the walk over the twelve hinges of §6, queued
  behind it.

**What the next fire does.** Fast-forward whichever import branch has
finished into `m42` — that merge is the run's own commit, by the amendment of
4 September — then the connection pass for what arrived: read the records,
write the edges to **what already exists** as well as to each other, file each
under a parent where M62's rule reaches, and reread the tombstones the new
records unblock. `docs/m42-connections.md` §5a and §5b name them against the
record each waits for, so the hinges arriving is a list of reinstatements
already written down: the dissolution of the Soviet Union and the revolutions
of 1989 unblock four, the breakup of Yugoslavia and the Bosnian war unblock
five, the Angolan civil war unblocks two. Then §3's row here, and the next
batch.

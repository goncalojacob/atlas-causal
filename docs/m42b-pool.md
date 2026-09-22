# M42b — the Americas, and Europe before 1900

The second records lane, opened 22 September on the branch `m42b` under
`docs/m42b-brief.md`: M42's brief and its eleven amendments with A11's
partition. **M42 takes Africa and Asia; this run takes the Americas, every
century from 1492, and Europe before 1900.** Deviations number from 1200.

This file is M42's `docs/m42-pool.md` for this lane: the measurement first,
then a section per batch with the main count, the per-lane and per-century
counts, the largest connected component before and after, and what was
refused.

## The measurement, before anything is imported

*22 September, 11:50Z, on `m42b` cut from `origin/m0` at `28978129`. `m42`
stands one batch further on (590 active, 244 main, component 503); nothing of
its batch 34 is here, and the two lanes are measured apart until the assistant
lands them.*

| | |
| --- | --- |
| event records | 819 |
| **active** | **582** |
| **main** (part of no active event) | **245** |
| filed (part of at least one) | 337 |
| active edges | 638 |
| **largest connected component** | **502** |
| components | 59 |
| events with no edge at all | 42 |
| every active event's `review.status` | `draft` |

### Per lane and per century (A10)

Active / main, over the topology the validator builds, so the lanes are the
atlas's own — a record's `region` override first, then the lane its place's
point falls in.

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 1 / 1 | — | — | 4 / 4 | — | — | 5 / 5 |
| 16th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 17th c. | 1 / 1 | — | — | 6 / 6 | — | — | 7 / 7 |
| 18th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 19th c. | 9 / 8 | 10 / 1 | 7 / 7 | 15 / 11 | — | — | 41 / 27 |
| 20th c. | 238 / 66 | 52 / 24 | 88 / 46 | 43 / 31 | — | — | 421 / 167 |
| 21st c. | 52 / 8 | 17 / 7 | 22 / 15 | 9 / 1 | — | — | 100 / 31 |
| **all** | **303 / 86** | **79 / 32** | **117 / 68** | **83 / 59** | **—** | **—** | **582 / 245** |

### What is this run's, read off that table

**The Americas hold 83 active events against Europe's 303**, and 59 of the 83
are main — the lane is both the thinnest of the four and the least filed, so
nearly every record it has stands alone on the resting timeline.

**Europe before 1900 is thirteen events.** One in the 15th century
(`treaty-of-tordesillas-1494`), one in the 16th
(`hereditary-captaincies-of-brazil-1534`, in Lisbon), one in the 17th
(`royal-african-company`), one in the 18th
(`the-british-industrial-revolution`), and nine in the 19th, of which eight
are main. The brief's *"one to eight main events each"* is exactly what is
here. **Those four cells — Europe's 15th to 18th centuries, one active event
apiece — are the thinnest in the whole atlas**, and the 16th, 17th and 18th
have no umbrella of any kind over them.

**Every pre-1900 record the atlas holds is Atlantic**: the Columbian voyages,
Brazil's cycles of sugar, gold and coffee, the Caribbean sugar islands, the
slave trade and the acts that ended it. There is no continental Europe before
1884 at all, and no North America before 1893.

### South and Central America against North America

The brief orders the `americas` lane *"South and Central America before North
America until they hold as many active events as North America"*. Measured by
the latitude of each event's place, splitting at the Rio Grande's mouth
(25.9°N):

| | active events with a place |
| --- | --- |
| South and Central America, and the Caribbean | **48** |
| North America | **8** |
| in the lane but placeless | 27 |

**The condition the brief sets is already met** — South and Central America
hold six times what North America holds — so the ordering does not bind this
run, and **North America is in fact the thinner half**. The 27 placeless are
mostly South American (Chile, Argentina, Brazil, Colombia) with a handful of
worldwide records that take the lane from an override; A9's place pass is
where they are read.

### What the first batches take, in the order a fire should weigh them

1. **Europe, the 16th century** — one active event, no umbrella.
2. **The Americas, the 16th and 18th centuries** — three each.
3. **Europe, the 17th and 18th centuries** — one each.
4. **The Americas, the 15th and 17th centuries** — four and six, all main.

The main count this run must not raise is **245**, and the component it must
not shrink is **502**.

## Batch 1 — the Italian Wars, and the Greco-Turkish War of 1897

*22 September, the first fire. Taken from the cells that trail most in this
partition: **Europe's 15th to 18th centuries**, one active event apiece and no
umbrella of any kind over the 16th, 17th or 18th; and **Europe's 19th**, where
the atlas held a war with none of its parts.*

**The rule, the same three tests M42's vein uses.** An item enters only if it
is `part of` something this atlas holds or is the umbrella that the cell
lacks; its span must sit inside the parent's at the year; its lane must be
this partition's. Ranked by sitelinks, ties by item id. Nothing was struck or
added by hand except the four refusals below, each for a stated reason.

### What arrived

| the record | sitelinks | filed under | placed at | the edge it earned |
| --- | --- | --- | --- | --- |
| `italian-wars` | 50 | — (the umbrella) | placeless (see deviation 1201) | none |
| `italian-war-of-1521-1526` | 31 | `italian-wars` | placeless (P276 is a country) | none |
| `war-of-the-league-of-cambrai` | 30 | `italian-wars` | placeless (see deviation 1201) | none |
| `italian-war-of-1551-1559` | 23 | `italian-wars` | placeless (P276 is a country) | none |
| `italian-wars-of-1499-1504` | 19 | `italian-wars` | placeless (P276 is a country) | none |
| `battle-of-st-quentin` | 17 | **`italian-war-of-1551-1559`** | `saint-quentin` | none |
| `italian-war-of-1536-1538` | 17 | `italian-wars` | `provence` | none |
| `battle-of-domokos` | — | `greco-turkish-war-of-1897` | `domokos` | none |
| `cretan-revolt-of-1897-1898` | — | **refused, see below** | `crete` | it `--caused-->` the war |
| `battle-of-velestino` | — | `greco-turkish-war-of-1897` | `velestino` | none |

Five place records came with them, each from the `P276` the event's own item
names: `provence` and `crete` at `region` precision, `saint-quentin`,
`domokos` and `velestino` at `city`. A sixth, `italian-peninsula`, was
written and then withdrawn — deviation 1201. The precision is read
off the class Wikidata gives the item — town and commune are settlements,
peninsula and region are not — and the import's own `point` was replaced by
it, which is what A9 asks for and what the import does not yet write.

**`battle-of-st-quentin` went to the nearer parent.** Wikidata files it under
the Italian Wars; its own lead calls it *"a decisive engagement of the Italian
War of 1551–1559"*, and that war is now here and contains 1557. A8 says a
parent already reachable through another parent is not a second parent, so it
has the one.

### The edge

`cretan-revolt-of-1897-1898 --caused--> greco-turkish-war-of-1897`,
`probable`, two locators. The war's lead names the cause — *"Its immediate
cause involved the status of the Ottoman province of Crete"* — and the
revolt's article supplies the other half under "Ottoman intervention": *"On
April 17, 1897, the Ottoman Empire officially declared war on Greece."* The
join between the two is made here and not in either article, which is why it
is `probable`; rule 22 would refuse `consensus` on two Wikipedia citations in
any case. It is the batch's one edge into what was already here, and it is
what moved the component.

### What was refused, and why

- **`Q15542964`, "Italian War of 1542–46 Un penesote"** — the item's English
  label carries what reads as vandalism, and the label is what this atlas
  would print as the title. Refused rather than silently tidied: correcting
  somebody else's label is not this run's to do from a sandbox, and inventing
  a title is not either.
- **`Q14905833` Farsala, `Q12880485` Livadeia, `Q16331940` Voukolies,
  `Q130425867` Pente Pigadia** — four battles of 1897 with no English
  Wikipedia article and a description that reads, in full, "1897 battle".
  The brief's own rule: where the import gives nothing usable the record is
  refused, not furnished.
- **Filing `cretan-revolt-of-1897-1898` under the war** — refused twice over.
  Its span (1897–1898) runs a year past the war's end, and its own lead never
  calls it part of the war; it calls it an insurrection against Ottoman rule
  that the Great Powers settled. The relation between them is causal, so it
  was written as an edge and not as a parent.
- **Filing `berlin-conference` under `scramble-for-africa`** — the one hit the
  `part of` pass over this partition's 40 main events with an item returned,
  and it fails at the year: the conference sat from November 1884, and the
  umbrella this atlas holds begins in 1885. The fix would be to widen the
  umbrella from its own cited article under A7, and `scramble-for-africa` is
  an Africa record and so M42's.
- **`Q2599571` "Crete eyalet" as the revolt's place**, in favour of `Q34374`
  Crete. A9 says the first located thing wins and the eyalet is first, but an
  Ottoman eyalet is a polity, and what ground a polity held is a presence in
  this atlas and never a place. Crete the island is the geography, and its
  point is also what corrected the lane: the import had derived `asia` for the
  revolt from the Ottoman Empire's own point.

### The counts

| | before | after |
| --- | --- | --- |
| corpus | 582 active | **592 active** |
| **main** | 245 | **247** |
| filed | 337 | 345 |
| active edges | 638 | 639 |
| **largest connected component** | **502** | **503** |
| components | 59 | 68 |
| events with no edge at all | 42 | 51 |
| imported | — | 10 events, 5 places, 0 actors |
| refused | — | 6 items and 2 filings |
| API calls | — | 31 for the two imports, 5 SPARQL, 3 article reads |

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 4 / 4 | — | — | 7 / 6 |
| 16th c. | 6 / 1 | — | — | 3 / 3 | — | — | 9 / 4 |
| 17th c. | 1 / 1 | — | — | 6 / 6 | — | — | 7 / 7 |
| 18th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 19th c. | 12 / 9 | 10 / 1 | 7 / 7 | 15 / 11 | — | — | 44 / 28 |
| 20th c. | 238 / 66 | 52 / 24 | 88 / 46 | 43 / 31 | — | — | 421 / 167 |
| 21st c. | 52 / 8 | 17 / 7 | 22 / 15 | 9 / 1 | — | — | 100 / 31 |
| **all** | **313 / 88** | **79 / 32** | **117 / 68** | **83 / 59** | **—** | **—** | **592 / 247** |

**Deviation 1200. The main count rose by two and A6 says a batch that does
that has to say why.** The two are `italian-wars` and
`cretan-revolt-of-1897-1898`, and they are different cases.

The umbrella is the first: Europe's 16th century had one active event and
nothing to file anything under, so the century could not be filled at all
without a top-level record to hang it from — the brief asks for exactly that
(*"write the regional period umbrellas a lane or century lacks"*). It is the
cheap direction of the trade and not the dear one: **ten records arrived and
the resting timeline gained two bars, not ten**. Every further record of the
Italian Wars — and the vein has six more rows already measured — now files
under it for nothing.

The revolt is the second and it is not a trade at all: it is a record whose
sources refuse to make it part of anything this atlas holds, so it stands on
the resting picture with an edge and no parent. That is the honest outcome and
it is what `degree-zero` and the main count are for.

**Deviation 1201. `italian-peninsula` was written as a place and withdrawn
before the fire ended.** A9's rule gave it: the Italian Wars' item names the
Italian Peninsula in `P276` and it carries a point, so a `region` place was
written and two records pointed at it. The map then wrote *"Italian
Peninsula"* across Rome — `tests/map-browser.test.mjs` caught it twice, on the
run's own check and here, and it is a real defect and not a flake: a label
placed at 42°N 14°E is a name written over the middle of Italy.

The fix is in the data and not in the placer, because this run may not touch
the display. **A point that stands for a whole country-sized region is the
case A9 itself holds back**: *"until `M80 done` is on `origin/m0`, an event
whose only located thing is its country stays placeless"*, and M80 is the
milestone that adds the `country` precision and the mark that draws a thing
that large. A peninsula the size of Italy is that case in everything but the
word, so the record was deleted, `Q145694` taken back out of the seeds and the
import's `done` list, and `italian-wars` and `war-of-the-league-of-cambrai`
left placeless in the `europe` lane as the import first wrote them. `provence`
and `crete` are the size of a province and an island and stay. **Five places,
not six; five of the ten events placed, not seven.**

**The batch grew the component by one and left nine records with no edge.**
That is the vein's known cost, measured again: the Italian Wars' phases are
chronological to each other and their leads argue no causation between them,
which is the same finding M42's batch 34 wrote down about the Vietnam War. The
umbrella holds them in the picture; nothing was invented to connect them.

## Where the run stands, for the fire that picks it up

*22 September, after batch 1.*

| | |
| --- | --- |
| corpus | **592 active** |
| **main** | **247** — the count the next batch must not raise |
| **largest connected component** | **503** |
| components | 68 |
| events with no edge at all | 51 |
| the inverse `part of` vein, this partition | **168 rows open**, 10 taken |
| Europe before 1900 | 23 active, 14 main |
| the `americas` lane | 83 active, 59 main — **untouched by batch 1** |

**What the next fire should weigh, in order:**

- **The Americas have not been touched and they are the larger half of this
  partition.** The vein already measured holds, in this lane alone: the
  Falklands War's twenty-odd operations and battles, the Cuban Revolution's
  eight, `colombian-conflict`'s thirty, `la-violencia`'s eight,
  `thousand-days-war`'s three, and `great-depression`'s national chapters.
  Every one of them files under a record this atlas already holds, so **a
  batch taken there costs nothing in main count** — which is the opposite of
  what batch 1 could do, and the reason to go there next.
- **The four American centuries before 1800 have no umbrella either**, and the
  obvious one will not import: `Q2088324` Colonial Brazil carries no `P580`
  or `P582` at all, so the tool refuses it for want of a date, and this run
  does not supply one. A fire wanting those cells should look for a period
  item that carries its own span rather than reading the span off an article
  to create a record with — A7 widens an imported interval and does not
  license writing one.
- **Europe's 17th and 18th centuries are still one event each.** They are the
  thinnest cells left, and neither has a vein: filling them means an umbrella
  first, at the same price batch 1 paid, so weigh them after the Americas.
- **The place pass (A9) is open across the whole atlas**, and M42 has not run
  it either — there is no `## Places (A9)` section on `m42`. Batch 1 placed
  its own seven and wrote six place records; 435 placeless events remain, and
  most of them need `M80 done` before their country can be a place.
- **`M80 done` is not on `origin/m0`**, so a country is not yet a place and
  three of batch 1's records are placeless for that reason alone. `M79 done`
  is, so A8's several parents are available and were used (the nearer parent
  rule above).

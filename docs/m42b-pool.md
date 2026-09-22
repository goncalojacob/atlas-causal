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

## Batch 2 — the Falklands War, filed and placed

*22 September, the second fire. Taken from the **`americas` lane**, which
batch 1 did not touch and which is the larger half of this partition: 83
active events against Europe's 313, and 59 of the 83 standing alone on the
resting timeline. The cell is the 20th century, where the lane held 43 active
events to Europe's 238.*

**Why the Falklands War and not another vein.** The inverse `part of` sweep
over this partition's 49 items with a Wikidata id returned **164 distinct
items, 161 of them new**, and the largest veins in it are
`colombian-conflict` (41), `falklands-war` (39),
`charter-of-the-united-nations` (25), `cuban-revolution` (16),
`great-depression` (13) and `la-violencia` (10). The Falklands vein was taken
first because **every row of it is dated inside 1982 and the umbrella this
atlas holds is dated 1982**: nothing had to be widened, nothing had to be
refused at the year, and the main count could not move. The Cuban Revolution's
vein was left where it is for the opposite reason — this atlas dates
`cuban-revolution` at 1959 and its battles run from 1953, so taking it means
widening the umbrella under A7 first, and `great-depression` and
`la-violencia` are both on A12's list of spans M42 is re-reading, which is
M42's pass and not this branch's.

### What arrived

Twenty-two events, every one filed under `falklands-war` and every one placed.

| the record | filed under | placed at | precision |
| --- | --- | --- | --- |
| `operation-rosary` | `falklands-war` | `stanley` | city |
| `invasion-of-south-georgia` | `falklands-war` | `grytviken` | city |
| `operation-algeciras` | `falklands-war` | `bay-of-gibraltar` | point |
| `operation-paraquet` | `falklands-war` | `south-georgia` | region |
| `operation-black-buck` | `falklands-war` | `falkland-islands` | region |
| `sinking-of-ara-general-belgrano` | `falklands-war` | `falkland-islands` | region |
| `raid-on-pebble-island` | `falklands-war` | `pebble-island` | region |
| `battle-of-san-carlos` | `falklands-war` | `san-carlos-water` | point |
| `operation-sutton` | `falklands-war` | `san-carlos-water` | point |
| `battle-of-seal-cove` | `falklands-war` | `falkland-islands` | region |
| `battle-of-goose-green` | `falklands-war` | `goose-green` | city |
| `mount-kent-skirmish` | `falklands-war` | `mount-kent` | point |
| `skirmish-at-top-malo-house` | `falklands-war` | `mount-simon` | point |
| `1982-british-army-gazelle-friendly-fire-incident` | `falklands-war` | `pleasant-peak` | point |
| `bluff-cove-air-attacks` | `falklands-war` | `falkland-islands` | region |
| `skirmish-at-many-branch-point` | `falklands-war` | `west-falkland` | region |
| `battle-of-mount-longdon` | `falklands-war` | `mount-longdon` | point |
| `battle-of-two-sisters` | `falklands-war` | `falkland-islands` | region |
| `battle-of-mount-harriet` | `falklands-war` | `falkland-islands` | region |
| `battle-of-mount-tumbledown` | `falklands-war` | `falkland-islands` | region |
| `battle-of-wireless-ridge` | `falklands-war` | `falkland-islands` | region |
| `operation-keyhole` | `falklands-war` | `thule-island` | region |

### Places (A9)

**Fourteen place records, every one from the first located thing its event's
item names that carries a `P625`** — `P276` in every case here, so the fallback
to `P131` and `P17` was never reached. Seven events took the archipelago
because Wikidata gives their item no location narrower than it: the four ridge
battles above Port Stanley are named hills with their own items, but no item
points its `P276` at them, and **A9 forbids inventing the point that would
place them**.

| precision | places | read off the class |
| --- | --- | --- |
| `city` | `stanley`, `goose-green`, `grytviken` | capital city, human settlement, whaling station — settlements |
| `point` | `bay-of-gibraltar`, `san-carlos-water`, `mount-kent`, `mount-simon`, `mount-longdon`, `pleasant-peak` | bay, mountain, hill — a site and not an area |
| `region` | `falkland-islands`, `south-georgia`, `west-falkland`, `pebble-island`, `thule-island` | island and archipelago — larger than a settlement and not a state |

No place took the `country` precision, although **`M80 done` is now on
`origin/m0`** and the precision is available for the first time — nothing in
this batch resolved to a state.

`falkland-islands` is the one that had to be weighed against deviation 1201.
Its item is a territory as well as an archipelago (`Q46395` British Overseas
Territory), and batch 1 refused the Crete eyalet for being a polity. It is
written here as a place all the same, at `region`, because what these battles
need is the island group and that is what the item's own point and description
give: *"archipelago in the South Atlantic Ocean"*. It is 250 km across — the
size of Crete, which batch 1 kept, and not the size of the Italian peninsula,
which it withdrew.

**Three places are outside every lane polygon** and carry a hand-written
`region` with the note rule 10 asks for: `grytviken`, `south-georgia` and
`thule-island` sit at 54°S and 59°S, below every region outline the atlas
draws. They take the `americas` lane, which is the lane the Falklands
themselves are in.

### The edges (A5, M72)

Four, each from what an article states in so many words, each `probable` —
rule 22 refuses `consensus` on a Wikipedia citation and none of these joins is
written whole in one source. **Two of the four run into records the atlas
already held**, which is what A5 asks a batch for.

| the edge | into what existed | what the source says |
| --- | --- | --- |
| `operation-rosary --caused--> falklands-war` | yes | *"The invasion served as a catalyst for the subsequent Falklands War."* |
| `battle-of-mount-tumbledown --caused--> argentine-surrender-in-the-falklands-war` | yes | *"…leading to the fall of Stanley and the surrender of Argentine forces on the islands."* |
| `invasion-of-south-georgia --caused--> operation-paraquet` | within the batch | the seizure of 3 April and the operation *"to recapture the island of South Georgia from Argentine military control"* |
| `operation-sutton --enabled--> battle-of-goose-green` | within the batch | Goose Green was *"within striking distance of San Carlos Water, where the British task force had positioned themselves after their amphibious landing"* |

`operation-rosary --caused--> falklands-war` is an edge from a part to its own
umbrella, and it is written on purpose: `parent` is a display fact that never
enters the adjacency, so the argument that the landing of 2 April set off what
followed has to be carried by the graph or not at all.

### What was refused, and why

- **`operation-sutton --precondition-of--> battle-of-san-carlos`, written and
  then deleted.** Rule 4 caught it: the landing ran 21–23 May and the air
  battle over the anchorage ran 21–25 May, so neither precedes the other. They
  are the same five days seen from the beach and from the air, and the arrow of
  time is right to refuse it.
- **`Q7164` the World Bank and `Q7804` the IMF**, the two largest rows of the
  whole sweep. They are `part of` the Bretton Woods system and they are
  institutions, not events; an actor is what they would be here, and this batch
  is an events batch.
- **`Q155801` FARC**, the largest row of the Colombian vein, for the same
  reason.
- **The twenty-five chapters and preambles of the UN Charter.** A chapter of a
  treaty is a division of a text, not an event, and not one of them carries a
  date.
- **Nine Falklands items with an article in one or two languages and no
  usable span**: two duplicate items for the sinking of HMS Sheffield
  (`Q59559767`, `Q68972231`), `Q68995930` the contested attack on HMS
  Invincible, `Q86083723`, `Q91168260`, `Q84762353`, `Q96638398`,
  `Q19597807` and `Q59640621`. The three "theater of war" items
  (`Q64918028`, `Q64918147`, `Q64995751`) are scopes and not events;
  `Q7097290` Operation Mikado was never executed and carries no date;
  `Q126478242` is an "aspect of history" and not a thing that happened; and
  `Q65114870` and `Q65115220` have no English label at all.
- **An edge from `raid-on-pebble-island` to the landings.** The obvious story
  — the SAS destroyed the aircraft that would have met the beachhead — is not
  in either lead, and this run does not write the edge a source does not state.

### The class table

Seven classes were added to `data/imports/wikidata-seeds.json` → `classes`,
each read off Wikidata rather than guessed, because the import refuses an item
whose class the table does not hold: `Q645883` military operation, `Q1546073`
covert operation, `Q476807` military raid, `Q650711` combat, `Q997267`
skirmish and `Q1303061` friendly fire, all `war`; and `Q744913` aviation
accident, `disaster`. **The Gazelle incident of 6 June carries the last two
at once and so takes no category at all** — `classify()` leaves a category
unset where the table disagrees rather than picking one, which is the right
answer here: an aviation accident is a disaster and friendly fire is war, and
nothing should choose between them on a record nobody has read.

### The counts

| | before | after |
| --- | --- | --- |
| corpus | 592 active | **614 active** |
| **main** | 247 | **247 — unchanged** |
| filed | 345 | 367 |
| active edges | 639 | 643 |
| **largest connected component** | **503** | **505** |
| components | 68 | 86 |
| events with no edge at all | 51 | 69 |
| placeless active events | 430 | 430 |
| imported | — | 22 events, 14 places, 0 actors |
| refused | — | 41 items and 1 edge |

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 4 / 4 | — | — | 7 / 6 |
| 16th c. | 6 / 1 | — | — | 3 / 3 | — | — | 9 / 4 |
| 17th c. | 1 / 1 | — | — | 6 / 6 | — | — | 7 / 7 |
| 18th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 19th c. | 12 / 9 | 10 / 1 | 7 / 7 | 15 / 11 | — | — | 44 / 28 |
| 20th c. | 238 / 65 | 51 / 23 | 88 / 46 | **64 / 31** | — | — | 441 / 165 |
| 21st c. | 52 / 8 | 17 / 7 | 22 / 15 | 9 / 1 | — | — | 100 / 31 |
| undated | 1 / 1 | 1 / 1 | — | — | — | — | 2 / 2 |
| **all** | **314 / 88** | **79 / 32** | **117 / 68** | **104 / 59** | **—** | **—** | **614 / 247** |

*Two active events carry no start year and fall in no century; batch 1's table
folded them into the 20th, which is why its europe row reads 238 / 66 where
this one reads 238 / 65 and 1 / 1. Nothing moved between them.*

**The main count did not rise.** Twenty-two events arrived and the resting
timeline gained no bar at all: every one of them is inside `falklands-war`,
which was already main and already drawn. This is the trade batch 1 said the
Americas would offer — *"a batch taken there costs nothing in main count"* —
and it is what an umbrella already in the corpus is worth.

**The component grew by two and eighteen records joined it with no edge.**
That is the same finding batch 1 wrote down and M42's batch 34 before it: the
phases of one war are chronological to each other and their leads argue no
causation between them. Two of the four edges reach records that were already
here, which is what moved the number; the other eighteen events are held in
the picture by their parent and nothing was invented to connect them.

**South and Central America against North America**, retaken: 69 active events
with a place south of 25.9°N, 8 north of it, 27 still placeless in the lane.
The brief's ordering still does not bind — the south holds nine times what the
north does — and North America is still the thinner half of the lane by a long
way.

## Batch 3 — the Colombian conflict's vein, filed and placed

*22 September, the third fire. Taken from the **`americas` lane** again, and
from the same partition's largest open vein: batch 2 measured
`colombian-conflict` at 41 rows against the Falklands' 39, and left it for a
fire that had the time. The cell is the 20th and 21st centuries of that lane,
where the lane held 64 and 9 active events against Europe's 238 and 52.*

**Why this vein and why now.** Batch 2's note ranked it first for the fire that
picked it up, on two grounds, and both held. It is free of the year problem:
`colombian-conflict` runs 1964 to an open end, and every dated row of the
sweep falls inside that, so nothing had to be widened under A7 and the main
count could not move. And its rows are spread over forty-five years rather
than eleven weeks, so the lane's timeline gains depth and not only bulk — the
twenty-one records that arrived run from 1980 to 2025.

The inverse `part of` sweep on `Q169072` returned **43 distinct items**, two of
which the atlas already held (`colombian-peace-process`,
`assassination-of-miguel-uribe-turbay`). `git fetch origin m42` was answered by
the merge at the head of this fire: `origin/m42` is an ancestor of `m42b` as of
`cb0e3e49`, so the whole of M42's corpus was on disk when the sweep was
compared against it and no item of the other lane's could be taken twice.

### What arrived

Twenty-one events. **Two of them are umbrellas of their own** — the phases the
Spanish and English Wikipedias name — and the other nineteen are filed under
whichever of the three fits closest.

| the record | filed under | placed at | precision |
| --- | --- | --- | --- |
| `colombian-conflict-between-1974-1990` | `colombian-conflict` | — (a period has no point) | — |
| `colombian-conflict-2018-present` | `colombian-conflict` | — (a period has no point) | — |
| `1980-dominican-embassy-siege-in-bogota` | `colombian-conflict-between-1974-1990` | `bogota` | city |
| `palace-of-justice-siege` | `colombian-conflict-between-1974-1990` | `bogota` | city |
| `honduras-and-la-negra-farms-massacre` | `colombian-conflict-between-1974-1990` | `uraba-choco` | region |
| `mondonedo-massacre` | `colombian-conflict` | `cundinamarca-department` | region |
| `siege-of-mitu` | `colombian-conflict` | `mitu` | city |
| `1999-2002-farc-government-peace-process` | `colombian-conflict` | `san-vicente-del-caguan` | city |
| `las-palmas-massacre` | `colombian-conflict` | `san-jacinto` | city |
| `boyaca-necklace-bomb-incident` | `colombian-conflict` | `chiquinquira` | city |
| `attack-on-cerro-montezuma` | `colombian-conflict` | `pueblo-rico` | city |
| `false-positives-in-colombia` | `colombian-conflict` | `colombia-q739` | country |
| `bombing-in-zona-rosa-of-bogota-of-2003` | `colombian-conflict` | `chapinero` | city |
| `house-bomb-attack-in-neiva` | `colombian-conflict` | `neiva` | city |
| `operation-jm` | `colombian-conflict` | `colombia-q739` | country |
| `operation-jaque` | `colombian-conflict` | `guaviare-department` | region |
| `andino-shopping-mall-attack` | `colombian-conflict` | `bogota` | city |
| `atentado-a-la-estacion-de-policia-de-barranquilla` | `colombian-conflict-2018-present` | `bolivar-department` | region |
| `catatumbo-campaign` | `colombian-conflict-2018-present` | `catatumbo-river` | region |
| `2019-bogota-car-bombing` | `colombian-conflict-2018-present` | `bogota` | city |
| `united-states-military-campaign-against-cartels` | `colombian-conflict-2018-present` | `caribbean-sea` | region |

One record the atlas already held was re-filed: `assassination-of-miguel-uribe-turbay`,
of June 2025, moves from `colombian-conflict` to `colombian-conflict-2018-present`,
which is inside it.

### The two umbrellas, and what A8 actually asked for

`colombian-conflict-between-1974-1990` (`Q76763052`, a *historical period*) and
`colombian-conflict-2018-present` (`Q118152947`, a *war phase*) are periods and
carry `m42-umbrella`, a lane and no place: A6's rule is that a period Wikipedia
names, with a span and a region, is a legitimate umbrella, and the same
paragraph is why neither is given a point on the map. Both are filed under
`colombian-conflict`, which is a war and not a period, so A6's "do not nest
periods more than one deep" is not touched.

**The first reading of A8 here was wrong and the suite caught it.** A8 says a
filing writes *every* umbrella whose span and subject fit, so the eight events
inside a phase were first written with both the phase and the conflict as
parents. `tests/m42-filing.test.mjs` refuses that — *"no parent of an event is
reachable through another of its parents"* — and it is right: the phase is
already inside the conflict, so naming the conflict as well widens the record
and tells a reader nothing the tree did not. Every event here carries **the
narrowest umbrella that holds it** and nothing above it. A8's list is for
umbrellas that reach a record by different routes, which is the owner's own
example — Angolan independence under the Portuguese Third Republic *and* under
the decolonisation of Africa, neither inside the other — and not for a chain of
containers.

### Places (A9)

**Fourteen place records, each from the first located thing its event's item
names that carries a `P625`**, with `precision` read off that item's own class
rather than the hard-coded `point` the import still writes:

| precision | places | read off the class |
| --- | --- | --- |
| `city` | `bogota`, `neiva`, `mitu`, `chiquinquira`, `pueblo-rico`, `san-jacinto`, `san-vicente-del-caguan`, `chapinero` | big city, city of Colombia, municipality of Colombia, locality — settlements |
| `region` | `cundinamarca-department`, `bolivar-department`, `guaviare-department`, `uraba-choco`, `catatumbo-river`, `caribbean-sea` | department of Colombia, subregion, river, sea — larger than a settlement and not a state |
| `country` | `colombia-q739` (already here, from M42's own place pass) | — |

`P276` answered for every one of them but three, where the item names only its
country: `operation-jm` and `colombian-conflict-2018-present` carry `P17`
Colombia alone, and `false-positives-in-colombia` names both Colombia and
Soacha under `P276`. The scandal is kept at the country: the article calls it
"a series of murders in Colombia" rather than an event at Soacha, and the
import's own choice was the country.

**Nothing was invented.** Four events of the vein carry their own `P625` and a
`P276` that is a whole department — `mondonedo-massacre` is the clearest — and
the department is what they were given, because A9 places an event at a thing
the atlas can name and not at a bare coordinate. The two periods are placeless
on purpose.

### Summaries (A12 C1)

**Sixteen of the twenty-one carry the cached English lead at a named revision**
in place of the import's placeholder, in the shape 277 records already have:
the first three sentences quoted, the revision in the locator, a `wikipedia-en`
citation added and the `summary-from-lead` flag. Five keep the placeholder
because the English Wikipedia has no article to quote: `mondonedo-massacre`,
`las-palmas-massacre`, `attack-on-cerro-montezuma` and both periods. Each of
the five has an article in Spanish, which this atlas does not cache and this
run did not translate.

### The edges (A5, M72)

Two, each from what a lead states in so many words, each `probable` — rule 22
refuses `consensus` on a Wikipedia citation — and **both running into records
the atlas already held**, which is what A5 asks of a batch.

| the edge | into what existed | what the source says |
| --- | --- | --- |
| `colombian-conflict --reacted-to--> 1999-2002-farc-government-peace-process` | yes | the process *"was a failed peace process … in an effort to bring to an end the ongoing Colombian armed conflict"* |
| `colombian-peace-process --enabled--> catatumbo-campaign` | yes | the campaign *"is an extension of the war on drugs and developed after the Colombian peace process of 2016"* |

The first is the same reading, and the same direction, as the edge this atlas
already carries between the conflict and the 2012–2016 negotiations, and the
two peace processes are seventeen years apart. The second is written at the
weakest type the vocabulary has because that is as far as the article goes: it
names the accord as what the campaign developed after and argues no mechanism,
and `enabled` says the earlier record made room for the later rather than
brought it about.

### What was refused, and why

- **Sixteen items of the vein with no date at all.** `Q335761` the taking of
  Miraflores, `Q402072` Las Delicias, `Q798637` Operation Casa Verde,
  `Q1032474` Girasoles, `Q1032901` the retaking of the demilitarized zone,
  `Q2268234` Operation Odiseo, `Q2269075` Quebrada El Billar, `Q2269121`
  Operation Dinastía, `Q2270085` Operation Némesis, `Q2270108` Operation
  Berlín, `Q3354631` Operation Anorí, `Q10341149` Operation Traira,
  `Q11202460` San Marino, `Q20537497` Tarazá, `Q115087946` and
  `Q8034813` the Workers Revolutionary Party. Every one of them is a real
  action of this war and Wikidata gives none of them a `P580` or a `P585`;
  the import refuses an item with no year and this run does not supply one,
  which is batch 2's ruling on nine Falklands items taken again.
- **`Q14186580` the 2013 Colombian clashes**, refused by the import itself:
  its item names no location the atlas could reach a lane through.
- **`Q155801` FARC**, the largest row of the sweep, as batch 2 already refused
  it: an actor is what it would be here and this is an events batch. Its two
  Wikidata classes — *terrorist organization* and *guerrilla organization* —
  are not in the class table, and adding either is a vocabulary decision on a
  record nobody has read, not a mechanical one.
- **`Q105799250` "Guerrilla Executions in Colombia"**, whose only class is
  *violence*. It is a topic article and not a thing that happened on a day.
- **`Q79227232` women's rights in the Colombian peace agreements**, refused by
  the class table: *human rights by country or territory* is a subject, not an
  event.
- **An edge from `2019-bogota-car-bombing` to `andino-shopping-mall-attack`.**
  The 2019 lead names the 2017 bombing — *"the first terrorist attack on the
  capital since the 2017 Centro Andino bombing"* — but that is a comparison and
  not a claim that one brought on the other. The same refusal batch 2 made over
  Pebble Island.

### The class table

Eleven classes were added to `data/imports/wikidata-seeds.json` → `classes`,
each read off Wikidata rather than guessed. Four are event classes: `Q188055`
siege and `Q105370834` war phase, both `war`; `Q20893947` suicide car bombing
and `Q1456892` peace process, neither with a category, because `bomb attack`
and `terrorist attack` carry none either and what a peace process is is not one
of the twelve. Seven are place classes, carrying no category at all:
`Q2555896` municipality of Colombia, `Q215655` department of Colombia,
`Q63209072` city of Colombia, `Q15701038` subregion of Antioquia Department,
`Q165` sea, `Q4022` river and `Q3257686` locality.

### The suites

`tests/m42-filing.test.mjs` now reads `docs/m42b-pool.md` beside
`docs/m42-pool.md`: the clause that a filing nobody argued in writing fails is
what makes this section load-bearing, and until this fire the suite could not
see the branch's own arguments at all. `docs/m53-polities.md` §4.1's "after
M42" row is retaken at 351 of 643, as that document says it is at every batch
of the milestone — the numerator does not move, because everything an import
writes carries `actors: []` and M67's amendment A1 says that is not a defect.

### The counts

| | before | after |
| --- | --- | --- |
| corpus | 622 active | **643 active** |
| **main** | 242 | **242 — unchanged** |
| filed | 380 | 401 |
| active edges | 647 | 649 |
| **largest connected component** | **506** | **508** |
| components | 92 | 111 |
| events with no edge at all | 72 | 91 |
| placeless active events | 28 | 30 |
| imported | — | 21 events, 14 places, 0 actors |
| refused | — | 19 items and 1 edge |

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 4 / 4 | — | — | 7 / 6 |
| 16th c. | 6 / 1 | — | — | 3 / 3 | — | — | 9 / 4 |
| 17th c. | 1 / 1 | — | — | 6 / 6 | — | — | 7 / 7 |
| 18th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 19th c. | 12 / 9 | 10 / 1 | 7 / 7 | 15 / 11 | — | — | 44 / 28 |
| 20th c. | 238 / 63 | 51 / 22 | 96 / 45 | **74 / 31** | — | — | 459 / 161 |
| 21st c. | 52 / 7 | 17 / 7 | 22 / 15 | **20 / 1** | — | — | 111 / 30 |
| undated | 1 / 1 | 1 / 1 | — | — | — | — | 2 / 2 |
| **all** | **314 / 85** | **79 / 31** | **125 / 67** | **125 / 59** | **—** | **—** | **643 / 242** |

*The corpus this batch found was not the one batch 2 left: the fire began by
merging `origin/m0` and `origin/m42`, which brought M42's own batches, its A12
passes and its place pass across. That is why the before column reads 622 and
242 where batch 2's after column read 614 and 247 — five events M42 filed are
main no longer, and the merge is where the difference came from, not this
batch.*

**The main count did not rise.** Twenty-one events arrived and the resting
timeline gained no bar: nineteen are inside `colombian-conflict`, which was
already main and already drawn, and the two that are not are the periods, which
are inside it too.

**The component grew by two and nineteen records joined it with no edge.** The
same finding batch 2 wrote down: the actions of one war are chronological to
each other and their leads argue no causation between them. Both edges reach
records that were already here, which is what moved the number; the other
nineteen events are held in the picture by their parent, and nothing was
invented to connect them.

**The `americas` lane passed Asia's active count and is now level with it** —
125 against 125, where batch 2 left it at 104 against 117. Its main count did
not move at all, which is what an umbrella already in the corpus is worth.
**South and Central America against North America**, retaken: 104 active events
with a place south of 25.9°N, 17 north of it, 4 still placeless in the lane.
The brief's ordering still does not bind.

## Where the run stands, for the fire that picks it up

*22 September, after batch 3.*

| | |
| --- | --- |
| corpus | **643 active** |
| **main** | **242** — the count the next batch must not raise |
| **largest connected component** | **508** |
| components | 111 |
| events with no edge at all | 91 |
| the inverse `part of` vein, this partition | **118 rows open**, 43 taken |
| Europe before 1900 | 23 active, 14 main |
| the `americas` lane | **125 active, 59 main** — 104 before batch 3 |

**What the next fire should weigh, in order:**

- **The Cuban Revolution's sixteen rows are now the largest vein left, and A7
  is what unlocks them.** This atlas dates `cuban-revolution` at 1959 alone;
  its own article dates it 26 July 1953 to 1 January 1959, and its battles —
  Moncada, Alegría de Pío, Santa Clara, Yaguajay, Verano — are all inside that
  wider span and outside the narrow one. A7 lets a run widen an imported
  interval from the record's own cited article at a named revision. Do that
  first, in its own commit, with the note A7 asks for; then the vein files
  itself and the main count cannot move.
- **`great-depression` and `la-violencia` are still A12's, not this branch's.**
  Both are named in M42's C3 span list. A batch that takes their children
  before M42 has widened them files children outside their parent.
- **The sixteen undated Colombian actions are the largest thing this fire left
  on the table**, and they are not refused for want of a source but for want of
  a date in Wikidata. A fire that wanted them would have to read each one's
  Spanish article for its day, which is reading a source and not inventing a
  date — but it is a per-record judgement and not a mechanical import, and no
  amendment has asked for it yet.
- **North America is still the thin half of the `americas` lane**: 17 active
  events against the south's 104. The brief's ordering — the south first until
  it holds as much as the north — has been satisfied for three batches running,
  so **a fire may now take a North American vein**, and the 19th and 20th
  centuries there are where the lane would gain most.
- **The four American centuries before 1800 still have no umbrella**, and batch
  1's finding stands: `Q2088324` Colonial Brazil carries no `P580` or `P582`,
  so the tool refuses it. A fire wanting those cells needs a period item that
  carries its own span.
- **Europe's 17th and 18th centuries are still one active event each** — the
  thinnest cells in the atlas — and filling either means writing an umbrella
  first, at batch 1's price.

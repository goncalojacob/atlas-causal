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

## Batch 4 — the Cuban Revolution's vein, widened first and then filled

*22 September, the fourth fire. Taken from the **`americas` lane** again, and
from the vein batch 3's note ranked first for whoever picked it up: sixteen
rows the atlas could not take while its umbrella was dated at a single day.
The cell is the 20th century of that lane.*

**A7 first, in its own commit.** This atlas dated `cuban-revolution` at 1959
alone, with the day Havana fell, so every action of the revolution's own
fighting fell outside its parent and rule 24 would have refused the filing.
The English article, at **revision 1373305240 — the revision the record already
cites** — states the span in its infobox, `26 July 1953 – 1 January 1959`, and
names the Moncada assault of 26 July 1953 in its lead. So the record now reads
1953 to 1959 with both days, carries the `a7-widened` flag and a note saying
what moved from what, and the vein files itself. Nothing else on the record
changed.

**The sweep.** The inverse `part of` sweep on `Q11264` returned **16 distinct
items and the atlas held none of them** — `origin/m42` had been merged into
this branch at the head of the fire, so M42's whole corpus was on disk when the
comparison was made and no item of the other lane's could be taken twice.
Fifteen were imported. Every one of the fifteen falls inside the widened span,
so the main count could not move.

### What arrived

| the record | filed under | placed at | precision |
| --- | --- | --- | --- |
| `attack-on-the-moncada-barracks` | `cuban-revolution` | `santiago-de-cuba` | city (already here) |
| `carlos-manuel-de-cespedes-barracks-attack-1953` | `cuban-revolution` | `bayamo` | city |
| `haitian-embassy-in-cuba-massacre` | `cuban-revolution` | — (see below) | — |
| `1956-cuartel-domingo-goicuria-assault` | `cuban-revolution` | `matanzas` | city |
| `santiago-de-cuba-uprising` | `cuban-revolution` | `santiago-de-cuba` | city (already here) |
| `battle-of-alegria-de-pio` | `cuban-revolution` | `alegria-de-pio` | city |
| `battle-of-la-plata-1957` | `cuban-revolution` | `bartolome-maso-cuba` | city |
| `havana-presidential-palace-attack-1957` | `cuban-revolution` | `havana` | city (already here) |
| `humboldt-7-massacre` | `cuban-revolution` | `havana` | city (already here) |
| `corynthia-expedition` | `cuban-revolution` | `mayari` | city |
| `cienfuegos-uprising` | `cuban-revolution` | `cienfuegos` | city |
| `operation-verano` | `cuban-revolution` | `sierra-maestra` | region |
| `battle-of-guisa` | `cuban-revolution` | `oriente-province` | region |
| `battle-of-yaguajay` | `cuban-revolution` | `yaguajay-cuba` | city |
| `battle-of-santa-clara` | `cuban-revolution` | `santa-clara-cuba` | city |

**Every one of the fifteen carries `cuban-revolution` and nothing above it**,
which is deviation 1203's rule applied from the start rather than caught by the
suite: the revolution is the narrowest umbrella the atlas holds for any of them
and there is no phase record between.

### Places (A9)

**Ten place records, each from the first located thing its event's item names
that carries a `P625`**, with `precision` read off that item's own class and
not the hard-coded `point` `placeRecord()` still writes:

| precision | places | read off the class |
| --- | --- | --- |
| `city` | `bayamo`, `matanzas`, `alegria-de-pio`, `bartolome-maso-cuba`, `mayari`, `cienfuegos`, `yaguajay-cuba`, `santa-clara-cuba` | city, locality, municipality of Cuba — settlements |
| `region` | `oriente-province`, `sierra-maestra` | province of Cuba, mountain range — larger than a settlement and not a state |

Four events were placed at records the atlas already held: `santiago-de-cuba`
twice and `havana` twice. Neither of those two carries a Wikidata item, so a
later sweep of `Q117040` or `Q1563` would create a second record for the same
town; **filling that identity gap is a job for a fire with `--reconcile`**, and
this one did not do it by hand.

**One place was named from the item's own Spanish label.** `Q16145269` carries
a label in Spanish alone, so the import fell back to the QID for the id, the
label and the names, and a place called `Q16145269` is a place a reader cannot
read. Its own field says `Alegría de Pío`, and reading it is reading the item:
the record is `alegria-de-pio`, the `title-not-english` flag stays, and a note
on the record says where the name came from. That is not the case of deviation
1201's refusal at `Q15542964`, which was somebody else's label needing
*correction*; nothing here was corrected or translated.

**One event is placeless and this is why.** `haitian-embassy-in-cuba-massacre`
names the embassy of Haiti in Cuba under `P276`, which carries no `P625`; it
has no `P131`; and its `P17` is `Q14905932`, the historical Republic of Cuba,
which is a *period* and not ground. The chain runs out with nothing to point
at, and A9 places an event at a thing the atlas can name or not at all. It has
no participant either, so `docs/m67-umbrellas.md` carries the A1 clause for it.

### Summaries (A12 C1)

**Twelve of the fifteen carry the cached English lead at a named revision** in
place of the import's placeholder, in the shape the corpus already uses: the
first three sentences quoted, the revision in the locator, a `wikipedia-en`
citation added and the `summary-from-lead` flag. Three keep the placeholder
because the English Wikipedia has no article to quote:
`carlos-manuel-de-cespedes-barracks-attack-1953`,
`1956-cuartel-domingo-goicuria-assault` and `haitian-embassy-in-cuba-massacre`.

### Actors (A12 C5)

**None.** Two of the fifteen carry `P710`: both name `Q218452` and
`Q14905932`, and the atlas holds neither as an actor — its `cuba` record is
`Q241`, a different item. C5 maps a participant *the atlas holds*, so nothing
was written, and M67 A1 settles that an event with no actor is not a defect.

### The edges (A5, M72)

**Six, each `probable` on the leads that support it** — rule 22 refuses
`consensus` on a Wikipedia citation — and **two of them run into records that
were already here**:

| edge | type | what the source states |
| --- | --- | --- |
| `attack-on-the-moncada-barracks` → `cuban-revolution` | `caused` | the attack of 26 July 1953 "is widely accepted as the beginning of the Cuban Revolution" |
| `cuban-revolution` → `operation-verano` | `reacted-to` | the 1958 offensive "was designed to crush Fidel Castro's revolutionary army, which had been growing in strength ... since their arrival ... in December 1956" |
| `operation-verano` → `battle-of-santa-clara` | `enabled` | Verano "failed in its objective", "left the Cuban army dispirited and demoralized", and "Castro ... soon launched his own offensive" |
| `santiago-de-cuba-uprising` → `battle-of-alegria-de-pio` | `precondition-of` | the failed uprising meant "the rebels had lost the element of surprise, and the military was put on high alert in the region" |
| `battle-of-alegria-de-pio` → `battle-of-la-plata-1957` | `precondition-of` | La Plata was "the first battle of the revolution ... which was a success for the rebels, who had previously suffered a heavy defeat at the Battle of Alegría de Pío" |
| `havana-presidential-palace-attack-1957` → `humboldt-7-massacre` | `caused` | the four men killed by Havana police on 20 April 1957 "had taken part in the Havana Presidential Palace attack" |

Two of the six were written after the first measurement, because the first four
moved the component by **one** and A5 says a batch that grows the corpus and
not the component has to say why. The answer was that the vein hung off
`cuban-revolution` by its *parent*, which by design is not adjacency, so only
Moncada reached the graph. The two added — the revolution to Verano, and
Alegría de Pío to La Plata — are the two the leads state plainly, and they
carried Verano and Santa Clara in with them.

### What was refused, and why

- **`Q4693758`, "land reform in Cuba"** — the sixteenth row of the sweep. It
  carries no `P580`, no `P582` and no `P585`, and its class `Q208128` is not in
  the table. A record with no date is not one this run writes.
- **The Landing of the Granma** — not refused on its merits but not reached:
  see deviation 1205. It is the hinge three of this vein's leads point at, and
  the fire that takes it joins the island of three that is left.
- **Filing any of the fifteen under a phase** — there is no phase record
  between them and the revolution, and this run did not write one: A6 asks for
  a period Wikipedia names with a span and a region, and the revolution's own
  article names its phases only as narrative sections.

### The counts (A10)

Active / main, over the topology the validator builds.

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 4 / 4 | — | — | 7 / 6 |
| 16th c. | 6 / 1 | — | — | 3 / 3 | — | — | 9 / 4 |
| 17th c. | 1 / 1 | — | — | 6 / 6 | — | — | 7 / 7 |
| 18th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 19th c. | 12 / 9 | 10 / 1 | 7 / 7 | 15 / 11 | — | — | 44 / 28 |
| 20th c. | 238 / 63 | 51 / 22 | 96 / 45 | 89 / 31 | — | — | 474 / 161 |
| 21st c. | 52 / 7 | 17 / 7 | 22 / 15 | 20 / 1 | — | — | 111 / 30 |
| undated | 1 / 1 | 1 / 1 | — | — | — | — | 2 / 2 |
| **all** | **314 / 85** | **79 / 31** | **125 / 67** | **140 / 59** | **—** | **—** | **658 / 242** |

| | before | after |
| --- | --- | --- |
| active | 643 | **658** |
| **main** | 242 | **242** |
| active edges | 649 | 655 |
| **largest connected component** | 508 | **511** |
| components | 111 | 120 |
| events with no edge at all | 91 | 98 |
| the `americas` lane | 125 / 59 | **140 / 59** |

*The before column is this branch's own head after batch 3 and after the two
merges at the head of this fire. Europe's 15th, 16th and 19th centuries read
higher than batch 3's table — 3, 6 and 12 against 1, 1 and 9 — and none of that
is this batch: it came across with `origin/m42` and `origin/m0`.*

**The main count did not rise.** Fifteen events arrived and the resting
timeline gained no bar: every one is inside `cuban-revolution`, which was
already main and already drawn.

**The component grew by three and twelve records joined with no edge.** The
same finding batches 2 and 3 wrote down, and it is a fact about the sources
rather than about the run: the actions of one revolution are chronological to
each other and their leads argue no causation between them. What is different
here is that three of the twelve are *not* isolated — they are an island of
three (`santiago-de-cuba-uprising`, `battle-of-alegria-de-pio`,
`battle-of-la-plata-1957`) that every lead ties to the Granma landing, which
this atlas does not hold and this fire could not fetch.

**South and Central America against North America**, retaken: **118 active
events with a place south of 25.9°N, 17 north of it, 5 placeless in the lane.**
Cuba is on the southern side of that line, so the brief's ordering still does
not bind and the north is still the thin half.

## Batch 5 — the Thirty Years' War, and Europe's seventeenth century

*22 September, the fifth fire. Taken from **the cell that trails most in this
partition and in the whole atlas**: Europe's 17th century, which held **one
active event** — `royal-african-company`, and it is dated 1660 — and no
umbrella of any kind. The 18th is the same size and needs the same treatment;
the 17th was taken first because the umbrella the century lacks is the one
with the largest vein behind it.*

**Why the Thirty Years' War and not the Granma.** The last fire's note put the
Landing of the Granma first, on the ground that it was one item and the hinge
of an island of three. **It is not an event item.** The English article
*"Landing of the Granma"* is the sitelink of `Q372672`, whose label is
*Granma*, whose description is *yacht*, and whose classes are the classes of a
ship; it carries no `P580`, no `P585` and no `P361`, and it is not among the
sixteen items that are `part of` `Q11264`. There is nothing here to import as
an event, and writing one from the article's title would be inventing the
record rather than reading it. **Deviation 1206.** The island of three stands.

**The rule, the same three tests the earlier batches use.** An item enters
only if it is `part of` something this atlas holds or is the umbrella the cell
lacks; its span must sit inside the parent's; its lane must be this
partition's. Ranked by sitelinks, ties by item id. The inverse `part of` sweep
on `Q2487` returned **171 items and the atlas held none of them**; the top
twenty that are Europe and are not this atlas's already were taken, and the
umbrella with them.

### What arrived

| the record | sitelinks | filed under | placed at |
| --- | --- | --- | --- |
| `thirty-years-war` | 124 | — (the umbrella) | placeless, see below |
| `battle-of-lutzen-1632` | 38 | `thirty-years-war` | `lutzen` |
| `battle-of-breitenfeld-1631` | 35 | `thirty-years-war` | `breitenfeld-leipzig` |
| `peace-of-prague-1635` | 34 | `thirty-years-war` | `prague-castle` |
| `torstenson-war` | 28 | `thirty-years-war` | placeless, see below |
| `battle-of-nordlingen-1634` | 27 | `thirty-years-war` | `nordlingen` |
| `edict-of-restitution` | 25 | `thirty-years-war` | placeless, see below |
| `smolensk-war` | 24 | `thirty-years-war` | `smolensk-voivodeship` |
| `bohemian-revolt` | 24 | `thirty-years-war` | placeless, see below |
| `battle-of-lutter` | 23 | `thirty-years-war` | `lutter-am-barenberge` |
| `battle-of-rain` | 20 | `thirty-years-war` | `rain-swabia` |
| `war-of-the-mantuan-succession` | 20 | `thirty-years-war` | placeless, see below |
| `siege-of-pilsen` | 18 | **`bohemian-revolt`** | `plzen` |
| `battle-of-breitenfeld-1642` | 17 | `thirty-years-war` | `breitenfeld-leipzig` |
| `battle-of-the-downs` | 16 | `thirty-years-war` | placeless, see below |
| `battle-of-lens` | 16 | `thirty-years-war` | `lens-pas-de-calais` |
| `battle-of-freiburg` | 15 | `thirty-years-war` | `freiburg-im-breisgau` |
| `battle-of-jankau` | 15 | `thirty-years-war` | `jankov-benesov-district` |
| `siege-of-stralsund-1628` | 15 | `thirty-years-war` | `stralsund` |
| `battle-of-prague-1648` | 15 | `thirty-years-war` | `prague` (already here) |

**Twenty events, twenty summaries.** Every one of the twenty has an English
article, so every one carries the cached lead at a named revision in place of
the import's placeholder, with the `wikipedia-en` citation beside it and the
`summary-from-lead` flag. No record in this batch shows the placeholder alone.

**Eleven new place records and one reused.** `lutzen`, `breitenfeld-leipzig`,
`nordlingen`, `lutter-am-barenberge`, `rain-swabia`, `plzen`,
`lens-pas-de-calais`, `freiburg-im-breisgau`, `jankov-benesov-district` and
`stralsund` at `city` precision, `prague-castle` at `point`,
`smolensk-voivodeship` at `region`; `battle-of-prague-1648` takes the `prague`
this atlas already held. The precision is read off the class Wikidata gives
each item and replaces the `point` the import still writes for everything.

**Which located item a battle takes, when the item names more than one.** The
corrected A9 order is the event's own `P625` first, then `P276`, `P131`,
`P17`. Fifteen of the twenty carry their own point, and where a battle's
`P276` and `P131` disagree the batch took **the located item whose own point
is nearest the event's own `P625`** — arithmetic over two coordinates Wikidata
already publishes, and no judgement. It matters once: Wikidata gives the
Battle of Lützen `P276` Leipzig (17 km away) and `P131` Lützen (1 km), and the
mark belongs at Lützen. Every other choice was the first candidate anyway, and
none of the eleven places sits more than 5 km from the event that names it.

### The five filed records that name neither an actor nor a place

M67's rule asks that a child filed under an umbrella with no actor line and no
place be argued for somewhere a person can read. These are the five, and the
reason is the same in four of them: **the located thing Wikidata names for
them is a country or larger**, which is the case deviation 1201 settled on
this branch — a point that stands for something country-sized is written on
the map across the middle of it.

- `thirty-years-war` — `P276` is `Q27509` *Central Europe*, a region of
  Europe. Placeless, as `italian-wars` is, and for the same reason.
- `torstenson-war` — `P276` is `Q35` *Denmark*.
- `bohemian-revolt` — `P276` is `Q686971` *Lands of the Bohemian Crown*, a
  monarchy and not a town.
- `war-of-the-mantuan-succession` — `P276` is `Q4345530` *Northern Italy*, the
  same class as the Italian Peninsula deviation 1201 withdrew.
- `edict-of-restitution` — it names no location at all beyond `P17`
  `Q12548`, the Holy Roman Empire. Its own lead says it was proclaimed in
  Vienna; Wikidata does not say so in a claim, and the atlas does not take a
  place out of prose.

`battle-of-the-downs` is the fifth of the four, and it is a different case:
it carries its own `P625`, but the only located item it names is `Q34640`, the
English Channel — **283 km from the event's own point**, and a sea besides.
The anchorage the battle is named for has no item here, so the record is
placeless rather than pinned to the wrong water. Its filing is also the one in
this batch that rests on the item and not on the article: Wikidata makes it
`part of` the Thirty Years' War, while its own lead says it *"took place on 21
October 1639, during the Eighty Years' War"* — a war this atlas does not hold.
Both are true of it in the ordinary telling; the filing follows the statement
that points at a record which exists.

### The edges, and why there are two

`bohemian-revolt --caused--> thirty-years-war` and
`bohemian-revolt --enabled--> siege-of-pilsen`, both `probable`, both on the
lead that states them:

- the revolt's article, revision 1372461973: *"an uprising of the Bohemian
  estates against the rule of the Habsburg dynasty **that began the Thirty
  Years' War**"*;
- the siege's article, revision 1370744459: *"**Following the Bohemian
  Revolt**, a Bohemian army under Ernst von Mansfeld captured Plzeň."*

**Eighteen of the twenty arrived with no edge at all, and the largest
connected component did not move.** A5 says a batch that grows the corpus and
not the component has to say why, and this batch can say it precisely, because
the war's own article says it for us. The Thirty Years' War's lead lists its
neighbours in exactly these words: *"**Related conflicts include** the Eighty
Years' War, the War of the Mantuan Succession, the Franco-Spanish War, the
Torstenson War, the Dutch–Portuguese War, and the Portuguese Restoration
War."* *Related* is the strongest word on offer, and it is not one of the five
edge types. The same holds one level down: eleven of the twelve battle leads
say only that the battle *took place during* the war and who beat whom, and
three of them are a single sentence long. This is the third fire to write the
finding down — batches 1, 3 and 4 each found it in their own vein — and it is
a fact about how encyclopaedia leads are written, not about the run: **a
war's parts are narrated in sequence, and sequence is not one of the five
things an edge may say.** Nothing was invented to connect them; the umbrella
is what holds them in the picture.

There is also nothing in the twenty leads that names a record this atlas
already held. The corpus's nearest neighbours in time are
`dutch-brazil-1630-1654`, `english-settlement-of-barbados-1627` and
`royal-african-company`, and none of the twenty articles mentions any of them.

### What was refused, and why

- **`Q372672`, the Granma** — deviation 1206 above: a yacht, not an event.
- **`Q1501724` Portuguese Restoration War** (33 sitelinks, the fourth-largest
  row in the vein) — it runs 1640 to 1688, forty years past the umbrella's
  end, so filing it under the Thirty Years' War would date a child outside its
  parent. It is a main event of its own or it is nothing, and a batch under
  the standing rule may not make it one. It is the best single row left in
  this vein and it is first on the next fire's list if that fire is willing to
  spend a main event on it.
- **`Q1340672` Hakkapeliitta** (20 sitelinks) — Finnish light cavalry. A kind
  of soldier is not a thing that happened.
- **`Q1615804` Hessian War** — 1567 to 1658, a span that contains the
  umbrella rather than sitting inside it.
- **`sweden` as an actor of the war** — Wikidata gives `Q2487` fifteen
  `P710` participants and exactly one of them is an actor this atlas holds:
  `Q34`, which is `data/actors/sweden.json`. **That record is dated 1886 to
  now**, because it came from CShapes and is the modern state. Naming it as a
  belligerent of a war that ended in 1648 is the fault `tests/m56.test.mjs`
  exists to catch, so the batch wrote no actor line at all. M67's amendment A1
  settles that this is not a defect.
- **Every item of the vein outside Europe** — `Q2890933` Puerto de Cavite and
  the rest of the Asian theatre are M42's lane, not this one.

### The numbers

| | before | after |
| --- | --- | --- |
| active | 678 | **698** |
| **main** | 242 | **243** |
| active edges | 663 | 665 |
| **largest connected component** | 513 | **513** |
| components | 132 | 150 |
| events with no edge at all | 107 | 124 |
| Europe's 17th century | 1 / 1 | **21 / 2** |

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 4 / 4 | — | — | 7 / 6 |
| 16th c. | 6 / 1 | — | — | 3 / 3 | — | — | 9 / 4 |
| 17th c. | 21 / 2 | — | — | 6 / 6 | — | — | 27 / 8 |
| 18th c. | 1 / 1 | — | — | 3 / 3 | — | — | 4 / 4 |
| 19th c. | 12 / 9 | 19 / 1 | 7 / 7 | 15 / 11 | — | — | 53 / 28 |
| 20th c. | 239 / 64 | 57 / 23 | 96 / 45 | 89 / 31 | — | — | 481 / 163 |
| 21st c. | 52 / 7 | 23 / 7 | 22 / 15 | 20 / 1 | — | — | 117 / 30 |
| **all** | **334 / 86** | **99 / 31** | **125 / 67** | **140 / 59** | **—** | **—** | **698 / 243** |

*The before column is this branch's own head after the two merges at the top
of this fire — `origin/m0` through M83 and `origin/m42` through its batch 36 —
and not batch 4's table, which measured a smaller corpus.*

**The main count rose by one and A6 says a batch that does that has to say
why.** The one is `thirty-years-war`, and it is the trade batch 1 made and
named: the century had one active event and nothing to hang anything from, so
it could not be filled at all without a top-level record. **Twenty records
arrived and the resting timeline gained one bar.** The 151 rows of this vein
that are still unimported now file under it for nothing, and so does the
Portuguese Restoration War if a later fire decides to pay for it.

### Deviations

**1206. The Landing of the Granma is not an event item, and the last fire's
note was wrong to rank it first.** Set out at the head of this section. The
lesson is narrower than it looks: **a Wikipedia article title is not evidence
that Wikidata holds an item for the thing the title names.** *"Landing of the
Granma"* is the English sitelink of the item for the boat. The previous fire
never resolved the title, because it was rate-limited before it could
(deviation 1205), and it wrote the recommendation from the three leads that
name the landing rather than from the item. Nothing was imported on it, so
nothing has to be undone; what is corrected is the note.

**1207. Four items were refused for want of a lane and re-asked, and the
tool's own `done` list was edited to re-ask them.** `peace-of-prague-1635`,
`smolensk-war`, `bohemian-revolt` and `war-of-the-mantuan-succession` were
refused on the first pass — *"no lane reachable from its point, and no lane
named for it in the seeds file"* — because the located things they name carry
no point the lane derivation reaches. The four are Europe by any reading, and
`data/imports/wikidata-seeds.json` → `lanes` is the table that exists for
exactly this. The entries were added there, which is data and not code; but
the import had already written the four into `runs.import.done` in
`data/imports/wikidata-state.json`, which is the tool's own file, and a
refused item is never asked again. The four ids were removed from that list
and the import re-run. **Written down because editing a file the tool writes
is not the ordinary path**, and because the ordinary path should exist: an
item refused for a gap the seeds file can close belongs back in `pending`, not
in `done`.

**1208. The Edict of Restitution's end was set to the day its own article
gives, against the `end-unstated` flag the import wrote.** `Q703097` carries
`P580` 6 March 1629 and no `P582`, so `intervalFor()` wrote `end: null` with
the flag — which is the corrected rule working as intended, and which the
atlas reads as *still going*. Filed under a war that ends in 1648, that made
the edict a child dated outside its parent, and `tests/m62.test.mjs` and
`tests/m67.test.mjs` both fail on it. The record names a **proclamation**, and
its own cited article dates that act and nothing else: *"The Edict of
Restitution was proclaimed by Ferdinand II, Holy Roman Emperor in Vienna, on 6
March 1629"* (revision 1285679503). So the end is that same day, the flag is
gone, and `review.note` says what was changed and why. **How long the edict
stayed in force is a different question and this record does not answer it** —
the Peace of Prague of 1635, which is also in this batch, is where a reviewer
would start on it. Reading a cited source is not inventing a date, which is
A7's own reasoning applied in the narrowing direction rather than the widening
one.

**1209. The index was rebuilt before the records were committed, and the check
went red on rule 16 for it — twice, once at the `origin/m42` merge and once at
this batch.** Deviation 798's order is *records first, rebuild, then commit the
index*, and the reason is `tools/lib/history.mjs`: a record's versions are read
out of **the commits that touched its file**, so an index built while the
records are still in the working tree is filed under history shard names that a
fresh build at the pushed commit does not reproduce. Rule 16 is what catches
it, and it catches it in CI rather than locally, because `validate --index`
against an uncommitted tree compares a build to itself. Three shards moved this
time — `history-edge-1600-1699`, `history-event-1600-1699` and
`history-place-place` — and the fix is one more rebuild and one more commit.
**The order in 798 is not a style rule and a fire that rebuilds first will go
red every time.** The merge commit `86e1144b` is red on the branch for exactly
this and is superseded rather than re-run.

## Batch 6 — the French Revolution, and Europe's eighteenth century

*22 September, the sixth fire. Taken from **the cell that trails most in this
partition**: Europe's 18th century, which held **one active event** —
`the-british-industrial-revolution` — and no umbrella of any kind. That is
exactly what the fifth fire's note said the sixth should take, and it is
batch 5's problem one century later with the same answer: the umbrella the
century lacks, and the vein behind it.*

**Two merges before anything was imported.** `origin/m0` (M84 and the M85
brief) and `origin/m42` (through its batch 37) were both ahead of this branch
and both came across, `data/index/` dropped and rebuilt rather than merged.
The merge is why this batch's *before* column reads 703 active and not batch
5's 698, and why Europe's 17th century reads 21 and not the 6 batch 5 left:
fifteen of that came with `origin/m42`.

**Why the French Revolution and not the War of the Spanish Succession.** The
fifth fire's note named three candidates for the century — the Spanish
Succession, the Seven Years' War and the French Revolution — and the last of
them is the one that is worth two things at once. Its inverse `part of` sweep
returned **56 items and this atlas held none of them**, which is the largest
vein of the three; and it is the one whose period umbrella, the Atlantic
Revolutions, reaches across the partition to a record the atlas already has.

### What arrived

Ranked by sitelinks, ties by item id, the same three tests the earlier batches
use: an item enters only if it is `part of` something this atlas holds or is
the umbrella the cell lacks, its span sits inside the parent's, and its lane is
this partition's.

| the record | sitelinks | filed under | placed at |
| --- | --- | --- | --- |
| `atlantic-revolutions` | 20 | — (the period umbrella) | placeless, see below |
| `french-revolution` | 173 | `atlantic-revolutions` | placeless, see below |
| `reign-of-terror` | 67 | `french-revolution` | placeless, see below |
| `storming-of-the-bastille` | 62 | `french-revolution` | `bastille` |
| `coup-of-18-brumaire` | 50 | `french-revolution` | `chateau-de-saint-cloud` |
| `tennis-court-oath` | 47 | `french-revolution` | `salle-du-jeu-de-paume` |
| `fall-of-maximilien-robespierre` | 38 | `french-revolution` | placeless, see below |
| `september-massacres` | 35 | `french-revolution` | `prison-de-l-abbaye` |
| `women-s-march-on-versailles` | 35 | `french-revolution` | `versailles-yvelines` |
| `insurrection-of-10-august-1792` | 34 | `french-revolution` | `paris` (already here) |
| `estates-general-of-1789` | 34 | `french-revolution` | `versailles-yvelines` |
| `flight-to-varennes` | 29 | `french-revolution` | placeless, see below |
| `coup-of-18-fructidor` | 27 | `french-revolution` | `tuileries-palace` |
| `civil-constitution-of-the-clergy` | 26 | `french-revolution` | placeless, see below |
| `champ-de-mars-massacre` | 25 | `french-revolution` | `champ-de-mars` |
| `13-vendemiaire` | 22 | `french-revolution` | `paris` (already here) |
| `execution-of-louis-xvi` | 21 | `french-revolution` | `place-de-la-concorde` |
| `insurrection-of-31-may-2-june-1793` | 18 | `french-revolution` | placeless, see below |
| `fete-de-la-federation` | 18 | `french-revolution` | `champ-de-mars` |

**Nineteen events, nineteen summaries.** Every one has an English article, so
every one carries the cached lead at a named revision in place of the import's
placeholder, with the `wikipedia-en` citation beside it and the
`summary-from-lead` flag. No record in this batch shows the placeholder alone.

### The Atlantic Revolutions, and why the main count did not rise

The umbrella over the umbrella is the piece of this batch that is not batch 5
again. `Q3108868` is a **revolutionary wave** with a stated span
(1765-03-22 to 1838-12-04) and an article of its own, which is A6's period
umbrella exactly: *"a period from the late-18th to the mid-19th centuries
during which a number of significant revolutionary movements occurred in most
of Europe and the Americas"* (*Age of Revolution*, revision 1374214786). Two
records are filed under it:

- `french-revolution` — inside the span, in Europe, and a revolutionary
  movement in the article's own words. M62's span-and-subject property, with
  the region as the subject, which is what A6 asks for.
- `haitian-revolution-1791-1804` — the same, and Wikidata says so outright:
  `Q689128` carries `P361` `Q3108868`. This atlas has held that record since
  M50 and it is in the `americas` lane, so **the umbrella crosses the
  partition**, which is the point of taking it.

**That is why the main count is unchanged at 243.** Two umbrellas arrived and
would have cost two; the Atlantic Revolutions took the French Revolution and
the Haitian Revolution out of the resting picture, which gives both back. The
seventeen of the vein were never main. Batches 1 and 5 each paid one main
event for their umbrella and wrote down why; this one paid none, and the
reason is the period umbrella rather than any restraint about the vein.

**The other two members of the wave were left.** The sweep on `Q3108868`
returned only `Q689128` and `Q1123201` (the Spanish American wars of
independence, 1808–1833, 45 sitelinks). The second is a good row and squarely
this partition's, but it is a vein of its own and not this batch's: it belongs
to the fire that takes the Americas' 19th century, where it will file under
the same umbrella at no cost in main events.

### Places (A9)

**Eight new place records, two reused.** The corrected order — the event's own
`P625` first, then `P276`, `P131`, `P17` — placed ten of the nineteen.
`versailles-yvelines` at `city` precision; `bastille`,
`chateau-de-saint-cloud`, `salle-du-jeu-de-paume`, `prison-de-l-abbaye`,
`tuileries-palace`, `champ-de-mars` and `place-de-la-concorde` at `point`,
which is what their classes say they are — a fortress, two palaces, a tennis
court, a prison and two public squares. `insurrection-of-10-august-1792` and
`13-vendemiaire` took the `paris` this atlas already held, through the
import's own reuse.

**Where the candidates disagreed, the nearest to the event's own point won**,
as batch 5 settled. It mattered once and awkwardly: the Coup of 18 Brumaire
carries its own `P625` in central Paris and names `Q662491` the Château de
Saint-Cloud (10 km) and `Q58296` the French First Republic (2 km). The
nearer of the two is a **state**, which is not a place of this atlas at all,
so the rule was read over the located items that are places and the château
took it — which is also where the coup happened.

**`september-massacres` is the one a reviewer should look at.** Its `P276`
names twenty locations — six Paris prisons and then Meaux, Lyon, Caen,
Reims, Versailles, Sens, Marseille, Toulon, Lorient and Gisors, because the
killings spread. The atlas takes `prison-de-l-abbaye`, which is the first in
`P276` order **and** the item whose point is the event's own `P625` to four
decimals. That is the rule applied without judgement, and it is still a
prison standing for a week of killings in a dozen towns. Nothing is wrong in
the data; it is thin, and it is flagged `a9-place` like every other.

### The nine that name neither an actor nor a place

M67's rule asks that a filed child with no actor line and no place, and a bare
main event, be argued for somewhere a person can read. These are this batch's,
and the reason is the same one in all of them: **Wikidata gives them no
location at all, or only a country**, which is the case deviation 1201 settled
on this branch.

- `atlantic-revolutions` — the bare main event. A revolutionary wave across
  two continents has no point on the ground, and its item names none; the
  Italian Wars and the Thirty Years' War are placeless on this branch for the
  same reason.
- `french-revolution` — `P276` and `P17` are both `Q142` France, a country.
  Placeless until a fire may write a country's point, which is deviation
  1201's line.
- `reign-of-terror` — `P276` is `Q58296`, the French First Republic: a state,
  not a town.
- `fall-of-maximilien-robespierre`, `flight-to-varennes`,
  `insurrection-of-31-may-2-june-1793` and `civil-constitution-of-the-clergy`
  — **these four carry no `P625`, no `P276`, no `P131` and no `P17`**. Their
  items say nothing whatever about where they happened, so they are placeless
  and they carry a lane named for them in `data/imports/wikidata-seeds.json`
  instead, which is what that file is for. The atlas does not take a place out
  of prose, and all four leads name Paris or Varennes in so many words.

### The edges (A5, M72)

Three, all `probable`, each on a lead that states it in so many words, each
citing the article at its revision with a `§ lead` locator and the Wikidata
item beside it:

- `storming-of-the-bastille --caused--> french-revolution` — *"Its fall was
  the flashpoint of the French Revolution"* (revision 1374060912);
- `flight-to-varennes --precondition-of--> champ-de-mars-massacre` — the
  massacre's lead, revision 1370703702, puts the decree *"after Louis and his
  family had unsuccessfully tried to flee France in the Flight to Varennes the
  month before"* and the crowd out against the decree. `precondition-of` and
  not `caused` because the decree stands between them and this atlas does not
  hold it;
- `execution-of-louis-xvi --reacted-to--> insurrection-of-31-may-2-june-1793`
  — *"the representatives in the National Convention, who in January had voted
  against the execution of King Louis XVI and since then had paralyzed the
  convention"* (revision 1370623840).

**The largest connected component did not move, and this batch can say exactly
why.** 517 before and 517 after. The three edges connect five of the new
records to each other and to nothing else, so the vein is an island of five
beside the fourteen that arrived with no edge at all — the same finding
batches 1, 3 and 5 wrote down, and the same reason: the episodes of one
revolution are chronological to each other and their leads argue no causation
between them.

**What would have joined it, and why it is not here.** The one edge that would
have hung the whole cluster on the 517 is
`french-revolution --> haitian-revolution-1791-1804`: the Haitian record's own
summary, written in M50 and citing *"Haitian Revolution"* revision 1375172946,
says Ogé's revolt *"pressed the French revolutionary government into granting
them citizenship in May 1791, and the clashes with the slave owners that
followed destabilised the colony"*. That is this atlas's paraphrase and not the
article, and the article's **lead** does not state the link — so the warrant
would have to come from the article's **body**, which this fire could not
read: `api.php` and the REST `page/html` endpoint answered 429 throughout, as
the fifth fire's note warned they would. **The edge was not written rather
than written on a paraphrase.** It is the first thing the next fire should do
if the rate limit has lifted, and it is worth a fire's first minutes: one
sourced edge moves the component by twenty.

### What was refused, and why

- **`Q207318` French Revolutionary Wars** (58 sitelinks) and **`Q249960`
  Chouannerie** (20) — both run past 1799 (to 1802 and 1800), so neither sits
  inside the umbrella's span. They would each cost a main event and belong to
  a fire that takes the Napoleonic period on purpose.
- **`Q219817` French Directory** and **`Q219825` National Convention** (56 and
  53) — governments, not events; they are actors of this atlas's kind or
  nothing, and no fire has asked for them.
- **`Q370029` the Great Fear** (24) — refused for its class. Its only `P31` is
  `Q3377832` *collective fear*, and that item **carries no description at
  all**. The seeds file's rule is that a class nobody has decided about is
  refused and listed rather than guessed at, and there is nothing here to
  read: deciding it would be deciding from the label alone. **Deviation
  1210.**
- **`Q2622002` abolition of feudalism in France** (20) — refused for the same
  kind of reason and it is worth being precise about. Its only `P31` is
  `Q322732` *abolition*, whose Wikidata description reads *"termination of
  criminal proceedings before its final conclusion or waiving of prosecution
  of a particular category of offences"* — the narrow legal-procedure sense,
  which does not describe the item that carries it. Mapping the class to `law`
  would have been reading the class's **name** and ignoring its gloss, which
  is the guess the table exists to prevent. **Deviation 1211.**

### The class table

Seventeen entries added, each with the gloss read off the class item itself
over the network and quoted in its note. Twelve for the events — `Q104708121`
storming, `Q381045` oath, `Q750215` mass murder, `Q5465517` food riot,
`Q124757` riot, `Q15238777` legislative term, `Q1430466` flight, `Q2571972`
decree, `Q10855380` public execution, `Q204933` decapitation, `Q180684`
conflict and `Q2627975` ceremony — and five for the places the A9 pass needed
before it could write them: `Q40357` prison, `Q16560` palace, `Q19860854`
destroyed building or structure, `Q805248` jeu de paume building and
`Q174782` square.

Four of the twelve take `other`, and that is the table being honest rather
than the run being lazy: an oath, a legislative term, a flight and a
generic conflict are none of the eleven named categories, and
`data/categories.json` says `other` is *"a category the atlas has too few of
to name yet, never a category nobody looked for"*.

**Four items were refused once and imported on the second run.** `Q12989672`,
`Q1192894`, `Q206979` and `Q15784403` name no location of any kind, so no lane
could be derived from a point and the import refused them — the case
`data/imports/wikidata-seeds.json` → `lanes` exists for, and deviation 447 has
been sitting in. Each was given `europe` there, taken back out of the state's
`done` list, and imported. **That is deviation 1207 again, not a new one** —
batch 5 did exactly this for four items and wrote it down as the path that
should not have to be taken. It is worth saying once more what it is not:
taking an id out of `wikidata-state.json`'s `done` after supplying what the
refusal asked for is a re-run of a refusal, not a re-import of a batch, and
the brief's *"a batch already pushed is never re-imported"* is untouched.

### One interval closed, from the record's own article (A7)

`civil-constitution-of-the-clergy` arrived with `end: null` and the
`end-unstated` flag, which is A12 C3's corrected rule working as intended:
Wikidata gives it `P580` 12 July 1790 and no `P582`. But `end: null` reads as
*"as far as the data goes"*, and that put the record **outside** the French
Revolution it is part of — `tests/m62.test.mjs` caught it, and it is a real
defect and not a flake. The end is taken from the article the record already
cites, at revision 1370659862, whose first words are *"a law passed on 12 July
1790 during the French Revolution"*: the event is the passing and it ends on
the day it happened, as `slave-trade-act-1807` does. The flag is cleared and
`review.note` says what was changed from what and why, which is A7's shape.
The article also says the schism that followed *"was not fully resolved until
1801"* — that is the schism and not this record. **This is deviation 1208
again**: batch 5 closed the Edict of Restitution's end the same way, for the
same reason, five hours earlier. Twice in two fires is the corrected
`intervalFor()` doing what A12 C3 asked and the filing rule catching what is
left, and a run that files an imported record under a dated parent should
expect to do it.

### The counts (A10)

Active / main, over the topology the validator builds.

| century | africa | americas | asia | europe | all |
| --- | --- | --- | --- | --- | --- |
| 15th c. | — | 4 / 4 | — | 3 / 2 | 7 / 6 |
| 16th c. | — | 3 / 3 | — | 6 / 1 | 9 / 4 |
| 17th c. | — | 6 / 6 | — | 21 / 2 | 27 / 8 |
| 18th c. | — | 3 / 2 | — | **20 / 2** | 23 / 4 |
| 19th c. | 19 / 1 | 15 / 11 | 7 / 7 | 12 / 9 | 53 / 28 |
| 20th c. | 57 / 22 | 89 / 31 | 97 / 45 | 238 / 63 | 481 / 161 |
| 21st c. | 26 / 7 | 20 / 1 | 22 / 15 | 52 / 7 | 120 / 30 |
| undated | 1 / 1 | — | — | 1 / 1 | 2 / 2 |
| **all** | **103 / 31** | **140 / 58** | **126 / 67** | **353 / 87** | **722 / 243** |

| | before | after |
| --- | --- | --- |
| active | 703 | **722** |
| **main** | 243 | **243** |
| active edges | 673 | 676 |
| **largest connected component** | 517 | **517** |
| components | 149 | 165 |
| events with no edge at all | 122 | 135 |
| Europe's 18th century | 1 / 1 | **20 / 2** |
| the `americas` lane | 140 / 59 | 140 / **58** |

*The before column is this branch's head after the two merges at the top of
this fire, not batch 5's numbers.*

**Europe's 18th century is no longer the thinnest cell in the atlas.** It went
from one active event to twenty and from no umbrella to two, and the century
that now trails in this partition is the Americas' 16th and 18th, at three
each.

**The `americas` lane lost a main event and gained no active one.** That is
the Haitian Revolution going under the Atlantic Revolutions, and it is the
only thing this batch did to that lane.

### Deviations

**1210.** `Q370029`, the Great Fear, refused because its only class carries no
description. A class nobody can read is not a class somebody decided about.

**1211.** `Q2622002`, the abolition of feudalism, refused because its only
class's Wikidata description describes something else — the criminal-procedure
sense of *abolition* — and mapping it on the strength of the class's name
would be the guess the table prevents.

**No others.** The lane re-ask and the closed end are **1207** and **1208**
again, not new numbers; the sections above say so where they happen. Batch 6
claims two deviations and no more.

## Batch 7 — the Spanish American wars of independence, and the Americas' 19th century

*23 September, the seventh fire. Taken from **the vein the sixth fire's note
named**: `Q1123201`, the Spanish American wars of independence, 1808–1833, 45
sitelinks, which Wikidata makes `part of` `Q3108868`, the Atlantic Revolutions
umbrella batch 6 wrote. It files under an umbrella that already exists, so it
costs no main event, and its own inverse `part of` vein is the Americas' 19th
century — the cell the brief's ordering points at, at 15 active events against
Europe's 12 and the lane's own 140.*

**Two merges before anything was imported.** `origin/m0` (M85) and
`origin/m42` (through its batch 38) were both ahead of this branch and both
came across, `data/index/` dropped and rebuilt rather than merged. The merge is
why this batch's *before* column reads 726 active and not batch 6's 722.

### The Haitian edge, which the sixth fire could not write

**The first thing this fire did, and the sixth fire's note said it should be.**
`api.php` is still rate-limiting this sandbox, but the REST `page/html`
endpoint answered, so the article's **body** was readable for the first time
since batch 5. The warrant is there and it is explicit. Under *Lasting change*
the article says: *"The Enlightenment ideals and the initiation of the French
Revolution were enough to inspire the Haitian Revolution, which evolved into
the most successful and comprehensive slave rebellion in history"*, and the
sentence before it, *"The call for modification of society was influenced by
the revolution in France"*; the section *Effects of the French Revolution*
carries the same claim in detail, with the Declaration of the Rights of Man
*"thus influenc[ing] the desire for freedom and equality in Saint-Domingue"*.

So `french-revolution --inspired--> haitian-revolution-1791-1804` is written,
`probable`, citing *"Haitian Revolution"* at revision **1376092092** with both
sections as locators. The type is `inspired` because that is the article's own
verb and the limit of what it asserts — the same section says *"The Revolution
in Haiti did not wait on the Revolution in France"*, which is the article
refusing the stronger claim.

**It moved the component by two, not by twenty.** The sixth fire's note
estimated twenty; the note was wrong about its own arithmetic, and it is worth
writing down why. `parent` is a display fact and never enters the adjacency, so
the eighteen episodes the French Revolution took as children in batch 6 are not
attached to it by any edge. By edges, `french-revolution` sat in a component of
**two**. The edge joined that two to the 521. **Deviation 1214**: a note that
estimates a component move should count edges and not children, because those
are the two different things the atlas is careful to keep apart everywhere else.

**This edge has one author where the rest of this branch's have two.**
Wikidata carries no causal statement between `Q6534` and `Q689128` at all — no
`P828`, no `P1478`, no `P1542` — so the `wikidata` citation every other edge on
this branch carries beside its `wikipedia-en` one has nothing to cite. M72's
second-author column reads one for this edge and the record says so in its own
explanation rather than in a footnote here.

### What arrived

Ranked by sitelinks, ties by item id, the same three tests the earlier batches
use: an item enters only if it is `part of` something this atlas holds or is
the umbrella the cell lacks, its span sits inside the parent's, and its lane is
this partition's. The sweep on `Q1123201` returned **40 rows and this atlas
held none of them**; twenty-three were taken, down to five sitelinks.

| the record | sitelinks | filed under | placed at |
| --- | --- | --- | --- |
| `spanish-american-wars-of-independence` | 45 | `atlantic-revolutions` | placeless, see below |
| `mexican-war-of-independence` | 54 | `spanish-american-wars-of-independence` | placeless, see below |
| `battle-of-ayacucho` | 32 | `peruvian-war-of-independence` | `ayacucho` |
| `argentine-war-of-independence` | 30 | `spanish-american-wars-of-independence` | `argentina-q414` (already here) |
| `peruvian-war-of-independence` | 25 | `spanish-american-wars-of-independence` | placeless, see below |
| `battle-of-chacabuco` | 21 | `argentine-war-of-independence`, `chilean-war-of-independence` | `santiago` |
| `chilean-war-of-independence` | 20 | `spanish-american-wars-of-independence` | `chile-q298` (already here) |
| `venezuelan-war-of-independence` | 20 | `spanish-american-wars-of-independence` | placeless, see below |
| `battle-of-junin` | 18 | `peruvian-war-of-independence` | `department-of-junin` |
| `colombian-war-of-independence` | 18 | `spanish-american-wars-of-independence` | placeless, see below |
| `bolivian-war-of-independence` | 18 | `spanish-american-wars-of-independence` | placeless, see below |
| `crossing-of-the-andes` | 16 | `spanish-american-wars-of-independence` | placeless, see below |
| `battle-of-rancagua` | 13 | `spanish-american-wars-of-independence` | `rancagua` |
| `battle-of-las-piedras-1811` | 11 | `spanish-american-wars-of-independence` | placeless, see below |
| `ecuadorian-war-of-independence` | 10 | `spanish-american-wars-of-independence` | placeless, see below |
| `battle-of-viluma` | 8 | `spanish-american-wars-of-independence` | `cochabamba-department` |
| `battle-of-suipacha` | 8 | `bolivian-war-of-independence`, `argentine-war-of-independence` | placeless, see below |
| `battle-of-tucuman` | 8 | `argentine-war-of-independence` | `san-miguel-de-tucuman` |
| `spanish-attempts-to-reconquer-mexico` | 7 | `spanish-american-wars-of-independence` | placeless, see below |
| `battle-of-buceo` | 6 | `spanish-american-wars-of-independence` | `montevideo` |
| `battle-of-ica` | 5 | `peruvian-war-of-independence` | `department-of-ica` |
| `battle-of-guayabos` | 5 | `spanish-american-wars-of-independence` | placeless, see below |
| `paraguay-campaign` | 5 | `spanish-american-wars-of-independence` | placeless, see below |

**Twenty-three events, twenty-two summaries.** Every one but
`battle-of-guayabos` has an English article, so every one but that carries the
cached lead at a named revision in place of the import's placeholder, with the
`wikipedia-en` citation beside it and the `summary-from-lead` flag.
`battle-of-guayabos` has no English Wikipedia article at all — only a Spanish
one — so it keeps the placeholder and the `summary-imported` warning A12's C1
asks to be left standing rather than papered over.

### Why the main count did not rise

**243 before, 243 after.** One umbrella arrived and it cost nothing, because
`Q1123201` is `part of` `Q3108868` and the Atlantic Revolutions were already
here: `spanish-american-wars-of-independence` was filed the moment it was
written. The other twenty-two were never main either — twelve under the wars
umbrella, ten under a national war inside it. This is the second batch running
where the period umbrella pays for itself, and the reason is the same: an
umbrella that files under an umbrella is free.

### The batch was imported three times, and the third time is the one on disk

**Deviation 1215.** The import walks places before events *within a batch
slice*, and the slice cap is 25. The first run put the twenty-three events in
before any place item existed, so eight of them came out placeless that should
not have been; the second run hit the same cap from the other side. The records
were deleted, the cursor in `data/imports/wikidata-state.json` was rewound for
exactly those items, the eight place items were imported on their own, and the
events were written last. **Nothing of the first two runs is on this branch and
nothing was pushed between them** — the batch that is here is the third. A fire
that means to import a vein and its places together should import the places
first and on purpose, not rely on the slice ordering.

### Places (A9)

**Eight placed, fifteen placeless; five new place records.**
`montevideo` at `city`, `san-miguel-de-tucuman` at `city`, `ayacucho`,
`rancagua`, `santiago` at `city`, and `department-of-junin`,
`department-of-ica` and `cochabamba-department` as the first-level
subdivisions they are. `argentina-q414` and `chile-q298` were reused.

The corrected order — the item's own `P625` first, then `P276`, `P131`,
`P17` — is what placed them, and `docs/m67-umbrellas.md` § "M42b batch 7"
argues for each of the thirteen that name neither an actor nor a place, which
is what M67 A1 asks. Two of those arguments are deviations and belong here too.

**Deviation 1212 — a colonial empire's point is its metropole.**
`mexican-war-of-independence` came out of the import in the **`europe` lane**.
Its item carries no `P625`; its `P276` is `Q19464773`, a UN subregion whose own
point is in Alberta; its `P17` is `Q80702`, the **Spanish Empire**, whose point
is Madrid. `laneFor()`'s country fallback took that point and derived Europe,
which is where an empire's capital is and not where its war was fought. The run
wrote `region: "americas"` over it with a `regionNote` saying so. **Every
record whose only located thing is the polity that ruled it is exposed to
this**, which is most of a colonial corpus; the fix is in the tool and not in
the records, and this fire did not make it.

**Deviation 1213 — a country is a place on three records and an actor on five.**
`Q717`, `Q750`, `Q736`, `Q77` and `Q96` matched the *actor* records
`venezuela`, `bolivia`, `ecuador`, `uruguay` and `mexico`, so the import
enriched their sitelinks and wrote no place; `Q414`, `Q298` and `Q739` are held
as the place records `argentina-q414`, `chile-q298` and `colombia-q739` beside
actors of the same name, so the wars that name those are placed. One rule, two
answers, for the same shape of fact. None of the three place records carries a
`precision` either, so M80's `country` precision is not on them.

### The edges (A5, M72)

**Two, and the batch says plainly that it wanted more.** The Haitian edge above,
and one inside the vein:

- `mexican-war-of-independence --reacted-to--> spanish-attempts-to-reconquer-mexico`
  — the attempts' lead, revision 1370748284, calls them *"efforts by the
  Spanish government to regain possession of its former colony of New Spain,
  resulting in episodes of war comprised in clashes between the newly born
  Mexican nation and Spain"*, and dates the first of them to 1821, the year the
  war ended. `probable`, with the Wikidata `P361` beside it.

**Nothing in the vein's twenty-three leads names an event this atlas already
holds.** That was checked mechanically, every lead against every active title,
and it returned nothing — the same finding batches 1, 3, 5 and 6 wrote down,
and the same reason: the episodes of one war are chronological to each other
and their leads argue no causation between them.

**The one body read this fire could afford did not yield an edge either, and
that is a finding worth keeping.** The Spanish American wars article, revision
1375550213, says *"Events in Spanish America transpired in the wake of the
successful Haitian Revolution and transition to independence in Brazil"* — and
this atlas holds both `haitian-revolution-1791-1804` and
`independence-of-brazil-1822`. **No edge was written from it.** "In the wake
of" is sequence, the same paragraph names *"a more direct cause"* elsewhere
(the Cortes of Cádiz, which the atlas does not hold), and the sentence about
Brazil asserts a **common** trigger — Napoleon's invasion of the Iberian
Peninsula — rather than a link between the two independences. None of the five
edge types says "these two had the same cause", and inventing a reading that
one of them does would be exactly the paraphrase batch 6 refused to write. The
Cortes of Cádiz is the record that would join this vein to the 523, and it is
the first thing the next fire should import.

- `crossing-of-the-andes --enabled--> chilean-war-of-independence` **was
  written and then removed**: settling the Chilean war's span to 1812–1827
  (below) put the crossing after its start, and rule 4's arrow of time refuses
  an edge whose `from` begins after its `to`. The claim is fine and the shape
  is wrong; the crossing is inside that war, which is what the filing already
  says.

### Intervals (A7, A12 C3)

Three were wrong and all three are settled, each from a source the record
already cites and each with the note on the record saying what changed from
what and why.

- **`mexican-war-of-independence`, 1800 → 1810.** Wikidata's `P580` for
  `Q68750` reads 1800-09-16, which is a decade early. The English article,
  revision **1371682352**, opens *"The Mexican War of Independence (Spanish:
  Guerra de Independencia de México, 16 September 1810 – 27 September 1821)"*
  and its infobox gives the same range. A7 exactly: the start is corrected from
  the article the record cites, the end is untouched.
- **`argentine-war-of-independence`, end 1816 → 1825.** `P582` gave 1816, the
  year independence was *declared*; the article, revision **1375018429**, opens
  *"a set of military events from 1810 to 1825"*. A widening, which is what A7
  is for.
- **`chilean-war-of-independence`, 1827 with no end → 1812–1827.** This one is
  not A7 and the record says so. `P580` alone gave 1827; the article's lead
  states no years at all, so A7 does not reach it. But the **same item's own
  English description**, which the record cites and its summary quotes, reads
  *"1812–1827 war between patriots and royalists"*, and this atlas holds
  battles of that war at 1814 and 1817. The span is settled from the cited item
  against itself — both endpoints are the item's own — and a `review.note` asks
  a reviewer for the article's infobox, which this fire could not fetch. It
  mattered structurally: at 1827 with no end the war was not dated inside its
  umbrella and could not hold `battle-of-chacabuco` as a second parent.

### Second parents (A8), and the one rule they have to obey

Four battles carry two parents and no battle carries three.
`battle-of-chacabuco` is under the Argentine and the Chilean wars;
`battle-of-suipacha` under the Bolivian and the Argentine; `battle-of-ayacucho`,
`battle-of-junin` and `battle-of-ica` under the Peruvian war alone.

**Every one of them first had `spanish-american-wars-of-independence` as well,
and every one of them lost it.** `tests/m42-filing.test.mjs` holds that no
parent of an event is reachable through another of its parents, and the wars
umbrella is reachable through every national war. **Deviation 1216**: A8 says
"every umbrella whose span and subject fit", and the filing rule that actually
holds is "every *nearest* umbrella" — a grandparent listed beside a parent is
not a second reading of the record, it is the same reading written twice.

### Where the numbers went

| | before | after |
| --- | --- | --- |
| active events | 726 | **749** |
| **main** | **243** | **243** |
| filed under a parent | 483 | 506 |
| active edges | 680 | 682 |
| **largest connected component** | 521 | **523** |
| components | 165 | 186 |
| events with no edge at all | 135 | 158 |
| place records | — | +5 |

### Deviation 1217 — the index must be rebuilt *after* the records are committed

**The check went red on this branch's merge commit and the reason is an
ordering nobody had written down.** `tools/lib/history.mjs` reads each
record's versions out of the commits that touched its file. An index built
while the records are still uncommitted is therefore **one version short for
every record in that commit**, and rule 16 — `data/index/` is byte-identical
to a fresh build — fails on the runner, which checks the tree out at
`fetch-depth: 0` and sees the commit the local build could not.

Run 1471 failed on exactly this: seven history shards missing or stale, all of
them for records the `origin/m42` merge had touched. Deviation **798** already
says *records first, rebuild, then commit the index*; what it does not say, and
what this fire learned the expensive way, is that **the rebuild goes after the
records' own `git commit` and not before it**. A rebuild that follows the
records into a commit of its own is correct, because a commit that touches only
`data/index/` changes no record's history.

### Per lane and per century (A10), after this batch

| century | europe | africa | asia | americas | all |
| --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 4 / 4 | 7 / 6 |
| 16th c. | 6 / 1 | — | — | 3 / 3 | 9 / 4 |
| 17th c. | 21 / 2 | — | — | 6 / 6 | 27 / 8 |
| 18th c. | 20 / 2 | — | — | 3 / 2 | 23 / 4 |
| 19th c. | 12 / 9 | 19 / 1 | 7 / 7 | **38 / 11** | 76 / 28 |
| 20th c. | 238 / 63 | 57 / 22 | 100 / 45 | 89 / 31 | 484 / 161 |
| 21st c. | 52 / 7 | 26 / 7 | 23 / 15 | 20 / 1 | 121 / 30 |
| no century | 1 / 1 | 1 / 1 | — | — | 2 / 2 |
| **all** | **353 / 87** | **103 / 31** | **130 / 67** | **163 / 58** | **749 / 243** |

**The Americas' 19th century went from 15 active to 38** and is no longer the
lane's thin cell; the Americas lane as a whole went from 140 to 163 and is
still the smallest of the four. Europe before 1900 is untouched at 62 active.

### What was refused, and why

- **Seventeen of the forty rows the sweep returned**, all at four sitelinks or
  fewer: `Q5778763` Battle of Tumusla, `Q10858446` Battle of Ibarra,
  `Q2889067` Second Battle of La Puerta, `Q5722315` Battle of Cerro de Pasco,
  `Q5722708` Battle of Moquegua, `Q5723065` Battle of Torata, `Q5742751`
  Campaigns of the South, `Q115454857` Pronunciamiento of Riego, `Q10858436`
  Battle of Chimbo, `Q10858449` Battle of Mocha, `Q3119146` war to the death,
  `Q6123901` Second Siege of Callao, `Q52696693` Los Andes vs Prueba,
  `Q55196779` British intervention in Spanish American independence,
  `Q5722589` Batalla de La Florida, `Q5853567` Expulsion of Spaniards from
  America and `Q5915146` Independence of Bolivia. Nothing is wrong with them;
  the batch stopped where the sitelinks did, and they are the next fire's if it
  wants the same vein deeper. `Q7806313`, a *timeline of* the Argentine war, is
  an article about an article and is refused on its face.
- **`Q653884` Hispanic America, `Q19464773` Northern America and Mexico,
  `Q211435` the Viceroyalty of Peru and `Q80702` the Spanish Empire** were not
  written as places, for the reasons under Places above: two are states and two
  are regions whose points stand for half a hemisphere.
- **`Q18` South America** was not written as a place either. It would have won
  the A9 order on `argentine-war-of-independence` over the `Q414` the record
  now has, which is a continent displacing a country.

### The classes and lanes this batch decided

Eight rows added to `data/imports/wikidata-seeds.json` → `classes`, every one
with the gloss read off the class item over the network rather than guessed:
`Q1192114` *military maneuver* as an event of category `war` (the Crossing of
the Andes), and `Q861184` *department of Peru*, `Q250050` *department of
Bolivia*, `Q5770918` *city of Argentina*, `Q108178728` *national capital*,
`Q51929311` *largest city*, `Q1422929` *primate city* and `Q1637706` *million
city* as places. Four lanes were named in `lanes`, all `americas`: `Q1123201`,
`Q8934`, `Q775606` and `Q7134668`, which between them carry no located thing
at all.

### The check is red on this branch's head, and what that is

**Run 1474, both attempts, on `d8bbdbac`.** Attempt 1 failed
`graph-browser.test.mjs:379` — *"a parent keeps its ring at rest and at every
zoom"*, `0.7685724975196452 against 0.5831308855537262`, the assertion that a
ring's stroke is thinner after a wheel notch than before it. Attempt 2 failed
**a different test**, `keyboard-browser.test.mjs:81` — *"the lanes are one tab
stop each, and the arrows walk along a lane"*, on the focused id. **Attempt 2
did not reproduce attempt 1's failure and attempt 1 did not reproduce attempt
2's.**

**Everything that fails is byte-identical to a green head.**
`git diff --name-only cdddf186 HEAD -- tests/ src/` is **empty**: `origin/m42`
carried the same `src/` and the same `tests/` — M85's changes to
`graph-browser.test.mjs` included — through a **green** run 1468 at 00:16Z
tonight. Both failing tests run on `?fixtures=1`, against
`tests/fixtures/data/`, which this batch does not touch. Locally the browser
pass is green 279 of 279, and `graph-browser.test.mjs` alone was run three
more times after the red check and was green all three.

**So this is not a regression in what the batch wrote, and the run is not
calling it a flake either.** A regression fails the same test twice; this
failed two different timing-sensitive assertions on two attempts of one
commit. That is the signature `docs/m63-load.md` is about, and the mitigation
that document prescribes — the browser suites run one at a time,
`--test-concurrency=1` — **is already in the workflow and is the last lever it
has**. The browser pass took **462s** on attempt 1 against the 380s of run
1471 earlier tonight on the same workflow: the runner is slower, or the work
is heavier, or both.

**What the run thinks is actually happening, said plainly so a person can
disagree with it.** Both failing assertions read the page **immediately after
dispatching an event**, with a wait for a node to exist but none for the
drawing to have settled — `graph-browser.test.mjs` reads `RING_AROUND` on the
line after the `WheelEvent` goes out, and the keyboard suite reads the focused
id after its keys. On a fast machine the redraw has happened; on a slow one it
has not. **The proposed patch is one line in each: wait on the state the
assertion is about — the drawing's `k` having changed, the focus having
moved — before reading it**, the way `waitFor` is used everywhere else in
those files.

**This run did not make that change, and the reason is the protocol and not
timidity.** Those are lane A's files, the fix is a test change with no record
in it, and a records fire rewriting another lane's browser tests on its own is
exactly the widening the brief forbids. **It is written here, in `STATUS.md`
and in the fire's notification, for the assistant or a lane-A fire to take.**
The records themselves are clean: `node tools/validate.mjs --index` reports
**0 errors**, and the full local suite is **2,068 tests, 2,068 passing, 0
skipped**.

## Batch 8 — the Spanish conquest, and the Americas' 16th century

*23 September, the eighth fire. Nine events, four places, two actors, five
edges.* The seventh fire left the Americas' 16th century as one of the two
thinnest cells in this partition — five active events, all of them Portuguese
Brazil or the Caribbean — and named the vein nobody in either lane had touched:
the Spanish conquest, with `Q1047607` the Spanish colonization of the Americas
as its obvious umbrella. This fire took it.

### What was imported

Thirteen items were put to `tools/import/wikidata.mjs --import` in two rounds,
the second for the places the first had nowhere to hang an event on (deviation
1215, unfixed and worked around). Eleven records came back:

| record | item | span | lane |
| --- | --- | --- | --- |
| `spanish-colonization-of-the-americas` | `Q1047607` | 1493–1898 | americas |
| `spanish-conquest-of-the-aztec-empire` | `Q828435` | 1519–1521 | americas |
| `fall-of-tenochtitlan` | `Q593267` | 1521 | americas |
| `spanish-conquest-of-the-inca-empire` | `Q636771` | 1532–1572 | americas |
| `battle-of-cajamarca` | `Q1425362` | 1532 | americas |
| `siege-of-cusco` | `Q2398589` | 1536–1537 | americas |
| `spanish-conquest-of-guatemala` | `Q2993582` | 1521–1697 | americas |
| `new-laws` | `Q1121487` | 1542 | europe |
| `valladolid-debate` | `Q1229264` | 1550–1551 | europe |
| `cortes-of-cadiz` (actor) | `Q1135591` | 1810–1814 | — |
| `council-of-the-indies` (actor) | `Q1127285` | 1524–1834 | — |

Four places were written in the second round, each from the item's own point:
`tenochtitlan` (`Q13695`), `cajamarca` (`Q205119`), `cusco` (`Q5582862`) and
`valladolid` (`Q8356`).

`new-laws` and `valladolid-debate` were seeded for the `americas` lane and the
import put them in `europe` instead, off the items' own points — the laws were
promulgated in Barcelona and the debate held in Valladolid. That is the import
reading the record over the seed and it is right; both cells are this
partition's, and Europe's 16th century was at six active events, which is the
third-thinnest cell here.

### What was refused

- **`Q27230923`, the Spanish conquest of the Muisca** — "it has no P31 at all,
  so nothing says what kind of thing it is". Nothing to decide about: the item
  says nothing about itself.
- **`Q975837`, the Spanish conquest of Yucatán** — no `P580`, `P582` or `P585`
  on the item at all. An undated event has nowhere on the timeline and the
  import is right to refuse it.
- **`Q1421412`, the Spanish Constitution of 1812** — the same refusal, and the
  costly one. See deviation 1220.

### Filing (A6, A8), and the main count

The main count was **243** before this fire and is **243** after it. Nine
events arrived; eight were filed on arrival and the ninth is the umbrella:

- under `spanish-colonization-of-the-americas`, whose article gives it
  1493–1898: `spanish-conquest-of-the-aztec-empire` ("a pivotal event that took
  place during the Spanish colonization of the Americas", its own lead at
  revision 1375547407), `spanish-conquest-of-the-inca-empire` ("one of the most
  important campaigns in the Spanish colonization of the Americas", revision
  1375586932), `spanish-conquest-of-guatemala` ("in a protracted conflict
  during the Spanish colonization of the Americas", revision 1371444057),
  `new-laws` (issued "by Charles V, Holy Roman Emperor and regard the Spanish
  colonization of the Americas", revision 1366305827) and `valladolid-debate`
  ("an intellectual and theological debate about the moral legitimacy of the
  conquest of the Americas", revision 1372190197). **Each of those five names
  the umbrella in its own article's own words**, which is M62's subject test
  met without an argument from this run.
- under `spanish-conquest-of-the-aztec-empire`: `fall-of-tenochtitlan`, which
  its lead calls "an important event in the Spanish conquest of the Mexica".
- under `spanish-conquest-of-the-inca-empire`: `battle-of-cajamarca`, of which
  the conquest's lead says the capture of Atahualpa there "was the first step
  in a long campaign", and `siege-of-cusco`, the Inca attempt of 1536–37 to
  take the city back, inside the conquest's span and its subject.
- and one record that was already here: **`the-cuban-sugar-boom` (1791–1886)**
  is now filed under `spanish-colonization-of-the-americas`. Cuba was Spanish
  for the whole of that boom, the span is wholly inside the umbrella's, and the
  record is the Spanish colonial economy in the Americas and nothing else.
  That filing is what holds the main count at 243 rather than 244: the umbrella
  is a new main event and this pays for it.

**`spanish-conquest-of-guatemala`, `spanish-conquest-of-the-aztec-empire`,
`spanish-conquest-of-the-inca-empire` and `new-laws` name neither an actor nor
a place**, and this paragraph is the argument M67 asks for. Their items carry
no `P625` the atlas can use and their `P276`/`P17` name polities and not
places: the Aztec Empire (`Q2608489`), the Inca Empire (`Q28573`), Guatemala
(`Q774`) and the Spanish Empire (`Q80702`). That is deviation 1213 exactly — a
country is a place record on some records of this atlas and an actor on
others — and it is unfixed. **`spanish-colonization-of-the-americas` is a main
event that names neither**, for the same reason and one more: it is a period
over two continents and four centuries, and there is no one point on the
ground it happened at. Its lane is the `americas` off the seed.

### The edges, and the component (A5, M72)

The largest connected component of the causal graph was **529** before this
fire and is **533** after it; components went from 180 to 185. Five edges, each
quoting the sentence of a cited article, at a named revision, that carries it:

| edge | type | from the article |
| --- | --- | --- |
| `the-first-columbian-voyage-1492` → `spanish-colonization-of-the-americas` | enabled | the colonization "began in 1493 … after the initial 1492 voyage of Genoese mariner Christopher Columbus under license from Queen Isabella I of Castile" |
| `spanish-colonization-of-the-americas` → `treaty-of-tordesillas-1494` | reacted-to | "Once the Spanish settlement in the Caribbean occurred, Spain and Portugal formalized a division of the world between them in the 1494 Treaty of Tordesillas" |
| `spanish-colonization-of-the-americas` → `spanish-conquest-of-the-aztec-empire` | enabled | "A well-connected settler in Cuba, Hernán Cortés received authorization in 1519 by the governor of Cuba to form an expedition" |
| `spanish-conquest-of-the-aztec-empire` → `new-laws` | reacted-to | "following the Spanish conquest of the Aztec Empire and the Spanish conquest of Peru, more stringent laws … were promulgated, known as the New Laws (1542)" |
| `spanish-conquest-of-the-inca-empire` → `new-laws` | reacted-to | the other half of the same sentence |

All five are `probable` and all five carry a locator. Three of them reach
records that were already here, which is what A5 asks of a batch; the third row
is the one that matters most to the number, because without it the conquest
vein was an island of three and the component would have grown by one alone.

**Two participants were written (A12's C5).** `battle-of-cajamarca` and
`siege-of-cusco` name `inca-empire` as a belligerent: Wikidata's `P710` names
the Inca Empire (`Q28573`) a participant of both, and this atlas already holds
that polity. The other participants their items name — the Crown of Castile
(`Q766543`) and the rest — the atlas does not hold, and none was invented.

### The class table

Eleven decisions were added to `data/imports/wikidata-seeds.json` → `classes`,
and **every label and gloss below was read off the class item itself over the
network**, never guessed from the item's name:

- events: `Q1361229` *conquest* (category `war`, because Wikidata's gloss
  "military subjugation of an enemy by force of arms" is `data/categories.json`'s
  own description of `war` in other words), `Q815962` *colonization* and
  `Q1377300` *first wave of European colonization* (no category — a period is
  none of the twelve, and they must agree with `Q1361229` about the kind or the
  item is refused for classes that disagree), `Q49371` *legislation* and
  `Q7755` *constitution* (category `law`, which `data/categories.json` describes
  as "a constitution, a statute, a decree or a court ruling"), and `Q1123131`
  *disputation* (no category: `other` is for a kind the atlas has too few of to
  name, not for one nobody looked at).
- a place: `Q2074737` *municipality of Spain*, on the precedent of `Q15284`
  *municipality* and `Q2555896` *municipality of Colombia*.
- actors, all `institution`: `Q11204` *legislature*, `Q2993893* *royal council*,
  `Q895526` *governing body*, `Q2994416` *consejo* and `Q41487` *court*. All
  four of the Council of the Indies' classes had to agree about the kind or the
  item would have been refused.

### Counts after this fire

| | before | after |
| --- | --- | --- |
| active events | 749 | **758** |
| main events | 243 | **243** |
| largest connected component | 529 | **533** |
| components | 180 | 185 |
| events with no edge at all | 151 | 156 |
| the `americas` lane | 163 active, 58 main | **170 active, 58 main** |
| the `europe` lane | 353 active, 87 main | **355 active, 87 main** |

Per century, the two lanes this partition owns:

| century | americas | europe |
| --- | --- | --- |
| 1400s | 3 active, 3 main | 3 active, 2 main |
| 1500s | **11 active, 5 main** (was 5) | **8 active, 1 main** (was 6) |
| 1600s | 6 active, 6 main | 21 active, 2 main |
| 1700s | 3 active, 1 main | 20 active, 2 main |
| 1800s | 38 active, 11 main | 12 active, 9 main |
| 1900s | 86 active, 31 main | 238 active, 63 main |
| 2000s | 23 active, 1 main | 52 active, 7 main |

### Deviations

**1218. The seventh fire's pool note gave the wrong item for the Cortes of
Cádiz, and the wrong item is a 1999 film.** The note recommended `Q753624` as
"the edge this partition is missing" and "nothing else available is worth as
much per request". `Q753624` is *Nobody Knows Anybody*, a 1999 film by Mateo
Gil. The Cortes of Cádiz is **`Q1135591`**. Nothing was imported under the
wrong id — the class check would have refused a film — but a fire that had
trusted the note would have spent its budget on it. **A QID a note recommends
is checked against its label before it is seeded**, which is what this fire did
and what cost one request.

**1219. The record the seventh fire wanted the edge from is an actor, not an
event.** `Q1135591`'s only `P31` is `Q11204`, *legislature* — "a kind of
deliberative assembly with the power to pass, amend, and repeal laws". A
legislature is a body and not something that happens, so the Cortes of Cádiz
entered this atlas as `cortes-of-cadiz`, an actor, **and an edge cannot run
from it**: an edge runs between events. The sentence the seventh fire found is
real and this fire read it at the revision the record cites — *"A more direct
cause of the Spanish American Wars of Independence were the unique developments
occurring within the Kingdom of Spain triggered by the Cortes of Cadiz"*,
"Spanish American wars of independence", revision 1375550213, § Background —
but the atlas has nowhere to put it as a link.

**1220. The event that would carry it, the Spanish Constitution of 1812, has no
date on its Wikidata item at all, and the import refuses it.** `Q1421412`
carries no `P580`, no `P582` and no `P585`; its only `P31` is `Q7755`,
*constitution*, which this fire added to the class table as an event of
category `law`. The same article states the link for the constitution in so
many words — *"In effect, the Spanish Constitution of 1812 adopted by the
Cortes of Cádiz served as the basis for independence in New Spain and Central
America"*, revision 1375550213 — so the edge is there to be written the moment
the record exists. **What it needs is a date the atlas can stand behind.** A7
widens an interval from the record's *own cited article*, and there is no
record yet to widen; the constitution's own article states the promulgation of
19 March 1812 in its first sentence, which is a reading of a source and not an
invention, but the import has no path that creates a record from an article
rather than from an item. **A fire that wants this edge has to decide which:
write the record from the article at a named revision and say so, or widen
Wikidata.** This run did neither rather than choose quietly.

**1221. Rule 4 refuses the one edge about indigenous depopulation that the
colonization article states.** The article says the indigenous population
"plummeted by an estimated 80% in the first century" and that "arguably the
most significant introduction was diseases brought to the Americas, which
devastated indigenous populations in a series of epidemics" (revision
1376245871). This atlas holds `indigenous-depopulation-of-the-greater-antilles`
(1492–1550). The edge `spanish-colonization-of-the-americas` → that record was
written and the validator refused it: *"arrow of time: cannot start after"* —
the umbrella starts in **1493**, which is where its own article begins the
colonization, and the depopulation record starts in **1492**. **The edge was
deleted rather than the date moved.** The one year is real: the depopulation
record dates itself from Columbus's landfall and the umbrella from the
settlement of the year after. A fire that wants this link has either to hang it
off a record inside the depopulation's span — the conquests all start later
still — or to re-read the depopulation record's own start, which is not this
run's to do because that record is not the import's.

## Batch 9 — the Spanish American eighteenth century, and the connection of the wars of independence

*23 September, the ninth fire. Seven events, five places, five edges, one
source, three fixes in the import itself.* The eighth fire left two things for
this one, in this order: **`spanish-american-wars-of-independence` carried no
edge at all and was a component of one**, the highest-value unconnected record
in the partition, and **the Americas' eighteenth century was the thinnest cell
here**, at three active events. This fire took both, and the first decided the
shape of the second.

### The three fixes in the tool, which are the eighth fire's refusals

**Deviation 1220 is settled, and it was settled in the import rather than by
hand.** `Q1421412`, the Spanish Constitution of 1812, carries no `P580`, no
`P582` and no `P585` — but it carries **`P577`, a publication date**, 1812 at
year precision, which for a constitution, a treaty text or a decree is the day
the thing came into the world. `intervalFor()` now reads it, **last**, behind
the span and behind the point in time, so nothing that was already answered
moves; `tests/import-wikidata.test.mjs` holds the order with a fixture item
(`Q9000015`) whose only date is a publication. The record exists, dated 1812,
and neither of deviation 1220's two costly options — writing a record from an
article, or editing Wikidata — was taken.

**A12 (2)'s other half had never reached the tool.** `placeRecord()` wrote
`precision: 'point'` for every place it ever made, so a department, a captaincy
and a historical region all arrived as points on the ground. Which precision a
class carries is the same editorial decision as which kind it is, so it now
lives **beside it in the class table** — `precision` on a place class of
`data/imports/wikidata-seeds.json`, declared in `schema/v1/import-seeds.json`
and read by `classify()` — and the default is still the point it always was.
Three places this fire had already written as points were deleted, their
cursor cleared and the items re-imported as `region`.

**A fourth actor for a polity the atlas already held was refused.** The import
wrote `viceroyalty-of-the-rio-de-la-plata-q210551` beside the
`viceroyalty-of-the-rio-de-la-plata` the Historical Basemaps import had left
(1783–1814, no Wikidata item): the names match exactly and the dates do not —
1776–1810 against 1783–1814 — so the tool refused the match and suffixed a
second record. **The duplicate was deleted and `Q210551` written onto the
record that was already there**, which is the additive rule of
`tools/import/identity.mjs` and is what stops the next sweep doing it again.
The same was done for `kingdom-of-portugal`, which now carries `Q45670`: that
is the `aztec-empire` and `inca-empire` failure the eighth fire warned about,
closed for two more polities.

### What was imported

| record | item | span | lane |
| --- | --- | --- | --- |
| `spanish-constitution-of-1812` | `Q1421412` | 1812 | europe |
| `rebellion-of-tupac-amaru-ii` | `Q1806552` | 1780–1783 | americas |
| `revolt-of-the-comuneros-new-granada` | `Q2095753` | 1781 | americas |
| `guarani-war` | `Q2427419` | 1754–1756 | americas |
| `inconfidencia-mineira` | `Q2558843` | 1789 | americas |
| `peninsular-war` | `Q152499` | 1808–1814 | europe |
| `napoleonic-wars` | `Q78994` | 1803–1815 | europe |

Five places: `santander-department` (`Q235166`), `misiones-orientales`
(`Q2628446`) and `minas-gerais-captaincy` (`Q9696269`), each `region` under the
new rule; `peru-q419` and `spain-q29`, written as the 22 September pass wrote
`colombia-q739` and `argentina-q414`, because A9's order reaches the country
when nothing finer is on the item. `peninsular-war` and `napoleonic-wars` found
their places in the atlas already (`iberian-peninsula`, `europe`). **No event
of this batch is placeless.**

**Every record carries the cached lead as its summary, at the revision the
cache names**, with the `wikipedia-en` citation and the `summary-from-lead`
flag — and so do the eleven of batch 8, which had arrived with the
placeholder. The `summary-imported` warning falls by seventeen.

### Two classes added, and one refusal

`Q20203507` *viceroyalty of the Spanish Empire* → actor, polity; `Q1620908`
*historical region* and `Q7468093` *captaincy of Brazil* → place, `region`.
Each label read from the class item itself over the network.

**`Q2734662`, the Bourbon Reforms, was refused and is worth the sentence.** Its
only `P31` is `Q1307214`, *form of government* — "Wikidata metaclass for
government in terms of organisational model or type" — which is not an event of
this atlas, and the item carries **no date of any kind**. The reforms are what
both risings of 1780–1781 were against, by their own articles' first
paragraphs, and the atlas cannot hold them from this item. A fire that wants
the Bourbon Reforms has to take them from the article, which is deviation
1220's problem again and does not have deviation 1220's answer.

### The edges, and the wars of independence connected

Six edges, every one of them to a record the atlas already held:

| from | to | type | why |
| --- | --- | --- | --- |
| `peninsular-war` | `spanish-american-wars-of-independence` | caused | "both conflicts were **triggered** by Napoleon's invasion of the Iberian Peninsula" |
| `peninsular-war` | `spanish-constitution-of-1812` | reacted-to | the constitution "emerged as a **response to the French occupation**" |
| `peninsular-war` | `independence-of-brazil-1822` | caused | the same sentence, the Brazilian half of it |
| `french-revolution` | `napoleonic-wars` | enabled | the wars "**originated in political forces arising from** the French Revolution" |
| `rebellion-of-tupac-amaru-ii` | `spanish-american-wars-of-independence` | precondition-of | "important elements of the **political background** in which the wars took place" |
| `revolt-of-the-comuneros-new-granada` | `spanish-american-wars-of-independence` | precondition-of | the same paragraph, which names both risings in one sentence |

**`spanish-american-wars-of-independence` is in the largest component**, which
is what this fire was for. The route is the one the eighth fire could not take:
not the Cortes of Cádiz, which is an actor and can carry no edge (deviation
1219), but the **Peninsular War**, which the wars' own article names in its
first paragraph and which is Europe before 1900 and therefore this partition's
to import. The constitution hangs off the same war, and the war off the
Napoleonic Wars, and those off the French Revolution, which was already in the
component. The largest component goes from **536 to 542**.

**The two `precondition-of` edges quote a sentence that hedges itself**, and
they quote it whole rather than choosing the half that suits: "The loss of high
offices to peninsulars and the eighteenth-century revolts in Spanish South
America were some of the direct causes of the wars of independence, which took
place decades later, but they have been considered important elements of the
political background in which the wars took place." `precondition-of` is the
weakest type that sentence supports; `caused` is not written from a sentence
whose second clause takes back its first.

**One second source, and the reason there is only one.** The paragraph those
two edges come from cites Lynch, Rodríguez and Kinsbruner. Only Kinsbruner is
given in full anywhere in the article — *Independence in Spanish America: Civil
Wars, Revolutions, and Underdevelopment*, University of New Mexico Press, 1994,
ISBN 978-0-8263-2177-0 — so that is the source record this fire wrote
(`m72-second-source`), cited with the page range the article's own reference
gives. The other two appear only in short form, and inventing a publisher and a
year to complete them would be inventing bibliography. **The confidence stays
`probable`**: A2 allows `consensus` through a work Wikipedia itself cites, and
this run cited that work without reading it, which is not the same thing.

### What earned no edge

`guarani-war` and `inconfidencia-mineira` are components of one. Both leads name
a cause and neither cause is a record here: the Guaraní War "was a result of the
1750 Treaty of Madrid", and the Inconfidência's "external inspiration was the
independence of thirteen British colonies in North America following the
American Revolutionary War". **The Treaty of Madrid (1750) has no article this
fire could resolve** — `Treaty_of_Madrid_(1750)` answers with the disambiguation
page `Q256055` — and the American Revolutionary War (`Q40949`, resolved and not
imported) is North America, which A10's order puts behind South and Central
America while those trail. Both are the next fire's, and the American
Revolutionary War would connect the Inconfidência, the Atlantic Revolutions and
the North American cell in one record.

`peninsular-war` → `transfer-of-the-portuguese-court-to-brazil-1807` is the
edge the article's own sentence offers and rule 4 refuses: the flight is dated
1807 and the war record 1808, because Wikidata dates the Peninsular War from
the Dos de Mayo and the invasion of Portugal was the year before. The edge to
`independence-of-brazil-1822` carries the same sentence instead and says so.

### Filing (A6, A8), and the main count

The main count was **243** before this fire and is **242** after it. Seven
events arrived; six were filed on arrival, and the seventh — `napoleonic-wars`
— is an umbrella and stayed main, so filing had to find two events already here
that belonged under one:

- `guarani-war` → `spanish-colonization-of-the-americas`
- `rebellion-of-tupac-amaru-ii` → `spanish-colonization-of-the-americas` **+**
  `atlantic-revolutions` (A8, two parents)
- `revolt-of-the-comuneros-new-granada` → the same two
- `inconfidencia-mineira` → `atlantic-revolutions`
- `spanish-constitution-of-1812` → `atlantic-revolutions`
- `peninsular-war` → `napoleonic-wars`, which its own lead lists among the
  seven conflicts the Napoleonic Wars are made of
- `transfer-of-the-portuguese-court-to-brazil-1807` → `atlantic-revolutions`
- `independence-of-brazil-1822` → `atlantic-revolutions`, which the wars'
  article puts beside Spanish America's in the same paragraph

### The actors, and `docs/m53-polities.md`

`P710` was read on every item and answered once: `Q2427419` names `Q45670`, the
Kingdom of Portugal, which this atlas holds, so `guarani-war` names
`kingdom-of-portugal` as a `belligerent`. `Q3399982`, the Kingdom of Spain of
1700–1873, and `Q46429`, the Guaraní people, are not records here — `spain`
begins in 1886 and the three Guaraní records are 1492–1499 snapshots — and
naming either would be naming the wrong thing. The other six items name no
participant at all. §4.1 of `docs/m53-polities.md` is re-taken at **371 of
768**, and the paragraph about the two counting rules with it.

### The counts

| | before | after |
| --- | --- | --- |
| corpus | 761 active | **768 active** |
| **main** | 243 | **242 — one lower** |
| filed | 518 | 526 |
| active edges | 746 | 752 |
| **largest connected component** | **536** | **542** |
| components | 185 | 186 |
| events with no edge at all | 156 | 157 |
| placeless active events | 53 | **53 — none of this batch is one** |
| imported | — | 7 events, 5 places, 0 actors kept |
| refused | — | 1 item, 1 edge, 1 duplicate actor |

| century | europe | africa | asia | americas | all |
| --- | --- | --- | --- | --- | --- |
| 15th c. | 3 / 2 | — | — | 5 / 5 | 8 / 7 |
| 16th c. | 8 / 1 | — | — | 9 / 3 | 17 / 4 |
| 17th c. | 21 / 2 | — | — | 6 / 6 | 27 / 8 |
| 18th c. | 20 / 2 | — | — | **7 / 1** | 27 / 3 |
| 19th c. | **15 / 10** | 19 / 1 | 7 / 7 | 38 / 9 | 79 / 27 |
| 20th c. | 239 / 64 | 61 / 23 | 100 / 45 | 89 / 31 | 489 / 163 |
| 21st c. | 52 / 7 | 26 / 7 | 23 / 15 | 20 / 1 | 121 / 30 |

*active / main, from `data/index/`. The lanes in whole: europe 358 / 88, africa
106 / 31, asia 130 / 67, americas 174 / 56, oceania 0.*

### Deviations

**1222. A publication date now dates a document, and it is read last.**
`Q1421412` was refused twice by two fires for having no `P580`, `P582` or
`P585`, and it carries `P577` — 1812, the year the Constitution of Cádiz was
published. `PROPERTIES.published` is `P577`, `readEntity` reads it and
`pickTimes` takes it **after** the point in time, so an item that states a span
or a `P585` is untouched and only an item that says nothing else is affected.
The test holds all three cases and the refusal of an item with no date at all.
**This fixes both branches** and M42 gets it by merge.

**1223. `placeRecord()` wrote `point` for everything, and the precision is the
class's to say.** A12 (2) asked for `city`, `region`, `country` and `point` by
the item's class and the pass that wrote the 410 places of 22 September did it
in a script of its own; the tool itself never learned it, so every place any
import wrote after that was a point. A place class of the seeds file may now
carry `precision`, the schema declares the four, `classify()` returns it and
`placeRecord()` defaults to `point`. Three classes carry one today — a
department of Colombia, a historical region, a captaincy of Brazil — all
`region`. **This fixes both branches too.**

**1224. The import writes a second actor where a name matches and the dates do
not.** `viceroyalty-of-the-rio-de-la-plata` is the case: Historical Basemaps
dates it 1783–1814 from the snapshots it was drawn in and Wikidata dates it
1776–1810 from its inception and dissolution, and `datesMatch` is right to
refuse a match on that. But the suffixed record it writes instead —
`…-q210551` — is a second polity for one polity, which is worse than either
date. **This fire deleted it and filled the identity gap on the record that was
there**, and did the same for `kingdom-of-portugal`. The general fix is not
written: a name that folds exactly, an `actorType` that agrees and spans that
overlap is not the same test as `datesMatch`, and changing what the import
considers a match is a decision about every import there will ever be, not a
batch's to take quietly. A fire that takes it should say so on both branches.

**1225. `Q1421412` was cleared from the import cursor, and that is the only way
a fixed refusal can be re-read.** `data/imports/wikidata-state.json` records
what the import has *processed*, not what it imported, so an item refused for a
reason since fixed is never looked at again. Removing the one line is the
smallest correction; a tool that told the two apart would be better and is
nobody's yet.

## Batch 10 — North America enters the atlas, and the wall in front of the fifteenth century

*23 September. The tenth fire on the branch.* It took the first thing batch 9's
note left, and it found that the second cannot be taken at all without a
decision that is the owner's.

### A10's North America clause, read again and spent

M42b's brief puts **South and Central America before North America until they
hold as many active events as North America**. Measured on this branch's head
before the batch, by the latitude of each `americas` event's place: **138
active events south of 30°N against 17 north of it**, with nineteen placeless.
The seventeen are almost all treaties signed on American soil — Bretton Woods,
San Francisco, the UN Charter — and not North American history. **South and
Central America hold eight times what North America holds, so the clause is
spent and North America is open**, which is what batch 9's note asked this fire
to say if it took the American Revolutionary War. It took it.

### What was imported

| record | item | span | lane | century |
| --- | --- | --- | --- | --- |
| `american-revolutionary-war` | `Q40949` | 1775–1783 | americas | 18th |
| `united-states-declaration-of-independence` | `Q127912` | 1776 | americas | 18th |
| `treaty-of-paris-1783` | `Q217450` | 1783 | europe | 18th |

**Three items put to `tools/import/wikidata.mjs --import`, three created, none
refused.** Every one carries the cached English lead as its summary, at the
revision the cache names, with the `wikipedia-en` citation and the
`summary-from-lead` flag; **no record of this batch shows the import's
placeholder**. The American Revolutionary War is the first event of North
America's own history this atlas holds.

### Europe's fifteenth century cannot be filled, and the reason is on the first screen

Batch 9's note called Europe's fifteenth century the thinnest cell in this
partition and told this fire to take it. **This fire imported the Hundred
Years' War, the Wars of the Roses, the Granada War and the late Middle Ages as
their umbrella, and then backed all four out.** The reason is
`src/intro.js` → `WHAT_IT_IS`:

> The history of the world **since 1492** as a graph: every event linked to
> what caused it and what it led to, with sources.

That sentence is on the masthead of `index.html`, in the intro card and at the
head of `about.html`, and **the year in it is not a period anybody decided on —
it is `atlas.extent.min`, the corpus's own earliest year**, which
`tests/m82.test.mjs` asserts against the live data; `tests/m85.test.mjs` pins
the same literal in `about.html`. The oldest active event in this atlas today
is `the-first-columbian-voyage-1492`, so the sentence is true.

**Every European event of the fifteenth century starts before 1492**, by
arithmetic: the Wars of the Roses in 1455, the Granada War in 1482, the Hundred
Years' War in 1337. Importing any one of them moves `atlas.extent.min` and
makes the sentence false, which turns two tests red and can only be answered by
editing two HTML pages, a source module and a test. **This run's brief says no
display change**, so the fire stopped rather than take that decision quietly.

**It is not a fifteenth-century problem. It is a floor.** Europe before 1900 is
this branch's partition with no lower bound written into it, and the corpus
cannot go below 1492 while that sentence says 1492. The question for the owner
is one line: *does the atlas begin in 1492, or does the sentence follow the
corpus wherever it goes?* Either answer unblocks the century; neither is a
run's to pick. Until it is answered **this branch's Europe is the 16th to 19th
centuries**, which is what M42b's brief describes it as in its own words.

The four records were written, validated, and removed; their items were taken
back out of `data/imports/wikidata-seeds.json` and out of the import cursor in
`data/imports/wikidata-state.json`, so **a later fire will import them again
rather than find them marked done and absent**. Nothing of them is left under
`data/`.

### Places

`treaty-of-paris-1783` found `paris` in the atlas already. The other two are
new place records, written the way the 22 September pass wrote the country
places — `origin.tool: assistant`, the `a9-place` flag, the point read off the
item's own `P625` and nothing else:

| place | item | precision | for |
| --- | --- | --- | --- |
| `eastern-united-states` | `Q1189650` | region | the American Revolutionary War |
| `independence-hall` | `Q390028` | point | the Declaration of Independence |

**No event of this batch is placeless**, and **the import placed one of the
three wrongly**: it gave the American Revolutionary War `caribbean-sea`, the
only one of `Q40949`'s five `P276` locations this atlas already held, though
*Eastern United States* is the first the item names and carries a `P625`
(deviation 1226). It was corrected from the article the record already cites —
"The conflict was fought in North America, the Caribbean, and the Atlantic
Ocean" — and the record says so in `review.note`.

### Filing (A3, A6, A8), and the main count

**The main count is 242 before the batch and 242 after it.** All three were
filed on arrival and **not one of them is a new main event**:

| record | filed under | why |
| --- | --- | --- |
| `american-revolutionary-war` | `atlantic-revolutions` | 1775–1783 inside 1765–1838, and the first revolution that umbrella is of |
| `united-states-declaration-of-independence` | `american-revolutionary-war` | adopted in 1776, in the war's second year, by the Congress the war was fought under |
| `treaty-of-paris-1783` | `american-revolutionary-war` | its own lead: it "officially ended the War of American Independence" |

### The edges (A5, M72)

Four, every one `probable` — rule 22 refuses `consensus` on a Wikipedia
citation — and each quoting the article it cites at a named revision. **Two run
into records the atlas already held**, which is what A5 asks of a batch, and
two put this batch's own new records into the graph:

| the edge | type | what the source says |
| --- | --- | --- |
| `american-revolutionary-war` → `inconfidencia-mineira` | `inspired` | the Inconfidência's own lead: "The external inspiration was the independence of thirteen British colonies in North America following the American Revolutionary War" |
| `american-revolutionary-war` → `french-revolution` | `inspired` | the French Revolution's article: "the American Revolution and the European revolts of the 1780s inspired public debate on issues such as patriotism, liberty, equality, and democracy" |
| `american-revolutionary-war` → `treaty-of-paris-1783` | `caused` | the treaty "officially ended the War of American Independence"; the war's article: Yorktown "led King George III and the Kingdom of Great Britain to negotiate an end to the war" |
| `united-states-declaration-of-independence` → `treaty-of-paris-1783` | `precondition-of` | the Declaration "explains why the Thirteen Colonies regarded themselves as independent sovereign states"; the treaty "recognized the Thirteen Colonies … to be free, sovereign, and independent unified states" |

**The French Revolution edge takes one step beyond its sentence and says so in
the record.** The article names *the American Revolution*, the broader
movement; this atlas holds its armed phase, which the war's own article calls
"the final eight years of the broader American Revolution". That identification
is why the edge is `probable` and not more.

**The last edge takes the weakest type of the five.** Neither article says the
treaty followed from the Declaration, so `precondition-of` is what the two
sentences support and the explanation says so rather than reaching for `caused`.

### The component (A5)

**The largest connected component goes from 546 to 550, and the number of
components falls from 187 to 186.** The American Revolutionary War joins
through the Inconfidência Mineira and the French Revolution, both already in
it; the Inconfidência was a component of one until this batch, which is the
hole batch 9's note named; and the treaty and the Declaration join through the
war. **All three new records are in the largest component**, and events with no
edge at all fall from 158 to 157.

### Actors

**No actor line was written.** `Q40949` names nine `P710` participants and this
atlas holds two of them, `united-states-of-america` and `spain` — and **both of
those records begin in 1886**, because they are CShapes polities. Naming either
on a war of 1775 would be a claim the records themselves refuse, so the three
events of this batch carry `actors: []`, which M67's A1 says is not a defect.
`Q127912` names one participant and `Q217450` five, and the atlas holds only
that same 1886 United States. `docs/m53-polities.md` §4.1 is re-taken at
**372 of 776**.

### Counts after this fire

| | before | after |
| --- | --- | --- |
| active events | 773 | **776** |
| main events | 242 | **242** |
| active edges | 756 | **760** |
| largest component | 546 | **550** |
| components | 187 | 186 |
| events with no edge | 158 | 157 |

**Per lane** (active / main): europe 359/88, americas 176/56, asia 130/67,
africa 111/31, oceania 0/0.

**Per century, in this partition** (active / main):

| | 15th | 16th | 17th | 18th | 19th |
| --- | --- | --- | --- | --- | --- |
| europe | 3/2 | 8/1 | 21/2 | 21/2 | 15/10 |
| americas | 5/5 | 9/3 | 6/6 | 9/1 | 38/9 |

Europe before 1900 is **68 active, 17 main**; the `americas` lane is **176
active, 56 main**.

### What was refused

**Nothing was refused by the import.** Four items this fire *wanted* and could
not use:

- **`Q212976`, `Q12551`, `Q127751`, `Q1552718`** — the late Middle Ages, the
  Hundred Years' War, the Wars of the Roses and the Granada War. All four
  imported cleanly and all four were backed out, for the reason in "Europe's
  fifteenth century cannot be filled" above. This is not a data problem.
- **`Q1061030`, the Alhambra Decree**, expelling the Jews from Spain in March
  1492. It carries a class the seeds table knows (`Q2571972`, decree) and **no
  date of any kind** — no `P580`, no `P585`, no `P577` — so there is nowhere on
  the timeline to put it.
- **`Q1728627`, the Capitulations of Santa Fe**, the contract for Columbus's
  voyage signed on 17 April 1492 outside Granada. It carries **no `P31` at
  all** and no date, so the tool has neither a kind nor a year.

The last two are deviation 1220's shape again — a record the atlas can only
take from an article and not from an item — and neither has deviation 1220's
answer. Both are 1492 or later and so are not blocked by the floor.

### Deviations

**1226. The import prefers a place record the atlas already holds over the
place the item names first.** `Q40949` lists five `P276` locations — Eastern
United States, the North Atlantic, the Caribbean Sea, the Mediterranean, Europe
— and four of them carry a `P625`. The import took the **Caribbean Sea**,
because `caribbean-sea` was the only one of the five this atlas already had a
place record for: `read.location.map((qid) => byItem.get('place:' + qid)).find(Boolean)`
walks the item's list but can only answer with a record that exists, and A9's
rule is about the item's order and not about what happens to be here. The
record was re-pointed at a new `eastern-united-states`, the first location the
item names. **The general fix is a change to what the import does when the
first located thing has no record yet, which is the same decision as deviation
1224's and belongs to a fire that will say so on both branches.**

**1227. A9 orders the properties, not the values inside one of them.** Backed
out with the fifteenth century, and worth keeping because it will come again:
`Q12551` lists Spain, France and England as `P276`, in that order, and Spain
carries a `P625`, so the import placed the Hundred Years' War in **Spain**.
Nothing in A9 is wrong — it says `P625`, then `P276`, then `P131`, then `P17`,
and says nothing about a `P276` with three values, because Wikidata's order
inside a property is not a ranking. **Where a location property lists several,
the run should take the one the record's own cited article names**; that is a
reading of a source and not a judgement.

**1228. The import still never creates a place for an event, so both of this
batch's places were written by hand.** The tool's event branch says so in a
comment — *"creating one for it here would be creating a record nobody asked
for"* — and A9 is the owner asking for it. The branch's workaround has been to
add the location item to the seeds with a place class so the place pass writes
it first, and that does not work for a country: `Q142`'s first class is
`Q3624078`, *sovereign state*, which the seeds table maps to an **actor**, so
France would have come out a polity and not a place. The places of this batch
were therefore written in the shape `spain-q29` and `peru-q419` already have.
**This is the same hole on both branches** and the fix is in `runImportMode`,
not in a batch.

**1229. The atlas's own first screen is a floor on the corpus, and no run can
raise it.** `WHAT_IT_IS` names `atlas.extent.min` and two tests hold it there.
That is a good design — a sentence that cannot come apart from its data — and
it means **the earliest year in `data/` is a display decision**, which an
import run is told not to take. Nothing is broken and nothing was changed; the
question is written up in "Europe's fifteenth century cannot be filled" above
and in "Where the run stands" below, for the owner.

## Batch 11 — the Dutch–Portuguese War, and the Americas' seventeenth century

*23 September. The eleventh fire on the branch.* It took the first thing batch
10's note left: **the Americas' seventeenth century, six active events and six
main, not one of them filed under anything**. It brought the umbrella that cell
was missing, two engagements to go under it, and — because it costs a main
event to take one and the count may not rise — the fifteenth century's umbrella
as well, which pays for itself the same way.

### Before the batch

The fire began by merging `origin/m42` (its batch 41) into this branch, which
is where 781 active and a largest component of 553 come from; `docs/m53-polities.md`
§4.1 was re-taken over the merged corpus at **372 of 781**.

| | before | after |
| --- | --- | --- |
| active | 781 | **785** |
| **main** | **242** | **242** |
| filed | 539 | 543 |
| active edges | 764 | 768 |
| **largest connected component** | **553** | **557** |
| components | 187 | 187 |
| events with no edge | 157 | 157 |

**The main count did not rise.** Two umbrellas arrived main and two events that
had been main were filed under them, which is the arithmetic A3 and A6 ask for.

### What was imported

| record | item | span | lane | century |
| --- | --- | --- | --- | --- |
| `dutch-portuguese-war` | `Q377269` | 1601–1661 | americas | 17th |
| `capture-of-bahia` | `Q3704801` | 1624 | americas | 17th |
| `recapture-of-bahia` | `Q3286392` | 1625 | americas | 17th |
| `voyages-of-christopher-columbus` | `Q18578423` | 1492–1504 | americas | 15th |

**Four items put to `tools/import/wikidata.mjs --import`, four created, one
refused on the first pass and created on the second** (see "The lane named for
one item"). Every one carries the **cached English lead as its summary**, at
the revision the cache names, with the `wikipedia-en` citation and the
`summary-from-lead` flag: `Dutch–Portuguese War` at 1374150566, `Capture of
Bahia` at 1370608303, `Recapture of Bahia` at 1373231929, `Voyages of
Christopher Columbus` at 1376021649. **No record of this batch shows the
import's placeholder.**

### One class added

`Q2401485` *expedition* — "discovery or research trip to a remote or
undeveloped region", read from the class item itself over the network — → event,
**no category**: `data/categories.json` has none for an expedition and `other`
would say less than nothing. It is here because `Q18578423` carries it and the
table did not. The two war classes the Dutch–Portuguese War carries,
`Q2659056` *colonial war* and `Q876274` *naval warfare*, were already in the
table from M40a and M42 batch 32.

### The lane named for one item

`Q377269`'s only location is `Q97`, the Atlantic Ocean, which reaches no lane,
so the import refused it: *"no place record for its location, no lane reachable
from its point, and no lane named for it in the seeds file; a placeless event
must carry a region"*. The seeds file's `lanes` map is keyed by the **event's
own** item and exists for exactly this, so `"Q377269": "americas"` was written
and the item re-run. **That is a lane and not a claim**: the war's own lead puts
it in "the Americas, Africa, and the East Indies", in that order, and the
American theatre is the whole of what this atlas holds of it. Its `regionNote`
says the lane was named in the seeds file, so a reader is not told the point
derived it.

### Filing (A3, A6, A8), and the main count

| child | umbrella | why it fits |
| --- | --- | --- |
| `dutch-brazil-1630-1654` (1630–1654) | `dutch-portuguese-war` (1601–1661) | inside the span; the colony is the war's American theatre |
| `capture-of-bahia` (1624) | `dutch-portuguese-war` | inside the span and the subject |
| `recapture-of-bahia` (1625) | `dutch-portuguese-war` | inside the span and the subject |
| `the-first-columbian-voyage-1492` (1492) | `voyages-of-christopher-columbus` (1492–1504) | the first of the four |

Nothing else in the corpus fits either span **and** subject: the fire measured
the 1601–1661 window and found `english-settlement-of-barbados-1627` and the
whole Thirty Years' War tree inside it, and neither is this war's. A8 allows a
second umbrella and none of the four earned one.

### Places

`capture-of-bahia` and `recapture-of-bahia` both point at **`salvador`**, the
place record this atlas already held, whose point is the one `Q36947` gives.
The recapture had derived that lane from its own `P625`; **the capture had been
filed in the European lane**, which is deviation 1230. Neither event needed a
new place record and none was written.

`dutch-portuguese-war` is **placeless with a named lane** — its only location is
an ocean — and `voyages-of-christopher-columbus` took `caribbean-sea`, the place
record the atlas already held for `Q1247`.

### The edges (A5, M72)

Four, all `probable`, each quoting the article it cites at a named revision:

| edge | type | sources |
| --- | --- | --- |
| `capture-of-bahia` → `recapture-of-bahia` | `reacted-to` | *Capture of Bahia* 1370608303, *Recapture of Bahia* 1373231929 |
| `capture-of-bahia` → `dutch-brazil-1630-1654` | `precondition-of` | *Dutch Brazil* 1375595876, *Capture of Bahia* 1370608303 |
| `dutch-portuguese-war` → `dutch-brazil-1630-1654` | `enabled` | *Dutch–Portuguese War* 1374150566, *Dutch Brazil* 1375595876 |
| `voyages-of-christopher-columbus` → `spanish-colonization-of-the-americas` | `enabled` | *Spanish colonization of the Americas* 1376245871, *Voyages of Christopher Columbus* 1376021649 |

Every one carries **two locators**, and every one was written to reach what the
atlas already had: all four new records are inside the largest component, which
is why it moved by exactly the four events added. No `consensus` was written —
A2 allows it only through a work Wikipedia itself cites, and none of these four
articles was read that far.

**The arrow of time is a rule and it caught one of these.** The first draft was
`recapture-of-bahia → capture-of-bahia --reacted-to`, reading the type off the
reactor; rule 4 refused it — *"arrow of time: `recapture-of-bahia` cannot start
after `capture-of-bahia`"* — and the edge was rewritten with the earlier event
as `from`. The type names the relation and `from` is always the earlier end.

### What was refused, and it is three records worth naming

**`Q2088324`, Colonial Brazil, refused by class, and it is the umbrella this
partition most wants.** Its only `P31` is `Q133156`, *colony* — "territory
under the political control of an overseas state" — which is a polity and not
an event, and the class table is right to have no event row for it. The article
is a period article: "the period from 1500 … until 1815". **Five main events of
this branch would fall inside that span and subject** —
`portuguese-landfall-in-brazil-1500`, `governorate-general-of-brazil-1549`,
`the-brazilian-sugar-cycle`, `the-brazilian-gold-cycle` and
`indigenous-depopulation-of-coastal-brazil` — so the umbrella is worth **four
main events** to whoever can write it. `Q2724951`, *Portuguese colonization of
the Americas*, is the same subject under a class that would pass
(`Q13418847`, *historical event*) and **carries no date of any kind**, so it
cannot be imported either. This is deviation 1220's case again, and the third
time this branch has met it.

**`Q10701282`, the Atlantic slave trade, refused by class.** Its only `P31` is
`Q17524420`, *aspect of history* — "topic viewed from a historical point of
view" — which is a metaclass over every "History of …" article there is.
Adding it as an event would type the whole of that shelf as events of this
atlas, and no batch should buy one umbrella at that price. It would have taken
`the-atlantic-slave-trade-to-brazil` and
`the-atlantic-slave-trade-to-the-caribbean`.

**`Q7634956`, Sugar plantations in the Caribbean, carries no `P31` at all** and
no date. It is already cited by `the-caribbean-sugar-revolution` as a source,
which is the right place for it.

### Counts after this fire

| lane | active | main |
| --- | --- | --- |
| europe | 359 | 88 |
| **americas** | **180** | **56** |
| asia | 130 | 67 |
| africa | 116 | 31 |

| cell | active before | active after | main before | main after |
| --- | --- | --- | --- | --- |
| americas, 15th | 5 | **6** | 5 | 5 |
| americas, 16th | 9 | 9 | 3 | 3 |
| **americas, 17th** | **6** | **9** | **6** | **6** |
| americas, 18th | 9 | 9 | 1 | 1 |
| americas, 19th | 38 | 38 | 9 | 9 |
| americas, 20th | 89 | 89 | 31 | 31 |
| americas, 21st | 20 | 20 | 1 | 1 |
| europe, 15th | 3 | 3 | 2 | 2 |
| europe, 16th | 8 | 8 | 1 | 1 |
| europe, 17th | 21 | 21 | 2 | 2 |
| europe, 18th | 21 | 21 | 2 | 2 |
| europe, 19th | 15 | 15 | 10 | 10 |

The Americas' seventeenth century is no longer the thinnest cell this branch
can act on, and it is no longer a cell with no umbrella: six of its nine are
main, against six of six before.

### Deviations

**1230. The import reads `P276` before `P17`, but it only ever fetches the
`P17` countries, so a `P276` location it did not fetch falls through to the
country.** `Q3704801`'s locations are `Q36947` (Salvador) by `P276` and then
`Q55` (the Netherlands), `Q2088324`, `Q155` by `P17`. A9's order was respected
— `read.location.concat(read.administrative, read.country)` puts Salvador
first — but `pointOf(qid)` can only answer for an entity in `entities` or
`countryEntities`, and Salvador is in neither, so the first thing with a point
was the Netherlands and **a Brazilian engagement was filed in the European
lane**. This is not deviation 1227 (an unranked `P276` with several values); it
is the list being ordered correctly over data that is not all there. **The fix
is to fetch the `P276` and `P131` items the way the countries are already
fetched**, and it belongs in `runImportMode` and not in a batch. The record was
re-pointed at `salvador`, which the atlas already held, with the reason in its
`review.note`.

**1231. A refusal is recorded as done, so fixing the cause of one does not
retry it.** `Q377269` was refused for want of a lane and written into
`data/imports/wikidata-state.json` → `runs.import.done` all the same; adding
`"Q377269": "americas"` to the seeds' `lanes` map changed nothing, because the
cursor had passed. The qid had to be taken out of `done` by hand before the
re-run created the record. **A refusal is not a completion** — the tool should
either keep refusals out of `done` or carry a `refused` list the next run
re-offers, so that editing the seeds file is enough to answer one.

**1232. A merge that brings in records must be committed before the index is
rebuilt, and this branch's merge commits have been doing it the other way
round.** `tools/lib/history.mjs` builds each record's versions **out of the
commits that touched its file**, so a history shard is a function of the
repository's history and not only of `data/`. The fire's merge of
`origin/m42` was resolved, the index rebuilt over the merged tree, and both
committed together — at which point the shards had been built from a history
that did not yet contain the merge commit, and the pushed tree said one thing
while `node tools/build-index.mjs` on the runner said another. Run 1517 of
`validate.yml` failed on seven rule 16 errors, six of them history shards
(`history-event-1900-1999`, `history-edge-1900-1999`, `history-place-place`,
stale and missing), with every one of the 279 browser tests passing in the
same run. **The batch's own two commits were in the right order** — records
first, then rebuild, then the index — which is deviation 798 saying this
already, and the head of the branch is byte-identical to a fresh build. The
rule is simply wider than 798 states it: **any commit that changes a record,
a merge commit included, has to exist before the index that describes it is
built.** The cure for a merge is three commits and not two: resolve and
commit the merge, rebuild, commit the index.

## Batch 12 — the Italian Wars' missing phases, and Europe's sixteenth century

*23 September. The twelfth fire on the branch.* It took the first thing batch
11's note left: **Europe's sixteenth century, eight active events and one
main**, the thinnest cell this branch can act on. It is a cell that already
has its umbrella — `italian-wars`, 1494–1559, with five phases filed under it
— so the cheapest honest growth here is not a new umbrella at all: it is the
phases and engagements that umbrella is missing. **Every record this batch
imported arrived filed**, so the main count did not move and no arithmetic was
needed to hold it there.

### Before the batch

The fire began by merging `origin/m42` (its batches 39 to 42) into this branch,
which is where 790 active and a largest component of 560 come from;
`docs/m53-polities.md` §4.1 was re-taken over the merged corpus at **373 of
790**, and 374 by the overlap rule.

| | before | after |
| --- | --- | --- |
| active | 790 | **795** |
| **main** | **242** | **242** |
| filed | 548 | 553 |
| active edges | 771 | 774 |
| **largest connected component** | **560** | **560** |
| components | 189 | 191 |
| events with no edge | 159 | 158 |

**The main count did not rise, and it did not have to be paid for.** Five
records arrived and all five were filed on arrival, three under `italian-wars`
and two under the phases their own leads name.

### What was imported

| record | item | span | lane | century |
| --- | --- | --- | --- | --- |
| `italian-war-of-1494-1495` | `Q1355145` | 1494–1495 | europe | 15th |
| `battle-of-marignano` | `Q330` | 1515 | europe | 16th |
| `battle-of-pavia` | `Q63468` | 1525 | europe | 16th |
| `war-of-the-league-of-cognac` | `Q1429256` | 1526–1530 | europe | 16th |
| `italian-war-of-1542-1546` | `Q15542964` | 1542–1546 | europe | 16th |

**Five items put to `tools/import/wikidata.mjs --import`, five created, none
refused and none ambiguous**, in eleven calls. Every one carries the **cached
English lead as its summary**, at the revision the cache names, with the
`wikipedia-en` citation and the `summary-from-lead` flag: *Italian War of
1494–1495* at 1372866209, *Battle of Marignano* at 1370449034, *Battle of
Pavia* at 1370271639, *War of the League of Cognac* at 1370750083, *Italian War
of 1542–1546* at 1370624570. **No record of this batch shows the import's
placeholder.**

**No class was added.** All five carry classes the table already holds — `Q198`
*war* and `Q178561` *battle*, both with the category `war`.

### Filing (A3, A6, A8), and the main count

| child | umbrella | why it fits, and where the article says so |
| --- | --- | --- |
| `italian-war-of-1494-1495` | `italian-wars` (1494–1559) | its own lead: "the opening phase of the Italian Wars" |
| `war-of-the-league-of-cognac` | `italian-wars` | the article's short description, "Seventh phase of the Italian Wars (1526–1530)", and its infobox `part_of = the French–Habsburg rivalry and Italian Wars` |
| `italian-war-of-1542-1546` | `italian-wars` | its own lead: "a conflict late in the Italian Wars"; and `P361` on `Q15542964` is `Q273348`, which is this atlas's `italian-wars` |
| `battle-of-pavia` | `italian-war-of-1521-1526` (1521–1526) | its own lead: "the decisive engagement of the Italian War of 1521–1526" |
| `battle-of-marignano` | `war-of-the-league-of-cambrai` (1508–1516) | its own lead: "the last major engagement of the War of the League of Cambrai"; and `P361` on `Q330` is `Q636365`, which is this atlas's record |

Each battle is filed under its phase and not also under `italian-wars`, which
is the shape `battle-of-st-quentin` has had since it was written: the
grandparent is reached through the parent, and A8's second umbrella is for a
record two umbrellas separately fit, not for a chain of three.

**`P361` was read as evidence and never as the answer.** Two of the five carry
it and it agrees with their leads; the other three do not carry it at all and
were filed from what their articles say in words.

### Places

The three wars took **`italy-q38`**, the country place this atlas already held
for `Q38`, which is what their items' own `P625` and `P17` both give: a war
fought the length of a peninsula has no narrower point that is not a choice.

**The two battles came out placeless with a lane derived from their own point,
and that is deviation 1230 again** — the import reaches for `P276` before
`P17` but only ever fetches the `P17` countries, so the town each battle names
is not there to read. Both were pointed by hand at a place record written from
the town item's own `P625` and names:

| event | town | item | point | precision |
| --- | --- | --- | --- | --- |
| `battle-of-pavia` | `pavia` | `Q6259` | 9.155, 45.18528 | city |
| `battle-of-marignano` | `melegnano` | `Q42932` | 9.32377, 45.35875 | city |

Both towns are `Q747074`, *comune of Italy*, which is a settlement, so `city`
and not `point`. The reason is in each record's `review.note`, on the two
places and on the two events, so a reader is not told the import did it.

### The edges (A5, M72)

Three, all `probable`, each quoting two articles at named revisions:

| edge | type | sources |
| --- | --- | --- |
| `battle-of-pavia` → `war-of-the-league-of-cognac` | `reacted-to` | *War of the League of Cognac* 1370750083, *Battle of Pavia* 1370271639 |
| `italian-war-of-1494-1495` → `italian-wars-of-1499-1504` | `precondition-of` | *Italian Wars of 1499–1504* 1372847284, *Italian War of 1494–1495* 1372866209 |
| `italian-war-of-1542-1546` → `italian-war-of-1551-1559` | `precondition-of` | *Italian War of 1542–1546* 1370624570, *Italian War of 1551–1559* 1370624572 |

Every one carries **two locators**. No `consensus` was written: A2 allows it
only through a work Wikipedia itself cites, and none of these articles was read
that far.

**Two of the three attach to records that had no edge at all** —
`italian-wars-of-1499-1504` and `italian-war-of-1551-1559` — which is why the
corpus grew by five and the events with no edge fell by one rather than rising
by five.

### Why the largest component did not move, which A5 asks a batch to say

**The whole Italian Wars tree is a set of components of its own, and this batch
did not join it to the 560.** `italian-wars` was a component of one before this
fire and the five phases under it were components of one each, because `parent`
is a display fact and never adjacency — that is the atlas's own rule and not a
defect. The three edges this batch wrote joined six of those records into three
components of two, which is why the component count rose by two while the
largest stood still.

**Joining that tree to the main body needs an edge no article this fire read
states.** The fire looked: the *Italian Wars* article at 1372847284 reaches the
Americas exactly once, in a paragraph about where the veterans went — "Many
conquistadors, such as Hernán Cortés, had considered Italy before opting to
serve in Spanish America … Experience in Italy was often considered a
prerequisite for military employment" — and that is a claim about the careers
of soldiers, not about one event bringing another about. **An edge written on
it would be a record kept by writing something**, which is the one thing M42's
brief says no batch may do. So the fire refused it and says so here.

**What would join them is named and not invented**: the Peace of
Cateau-Cambrésis of 1559 ends the Italian Wars and the article at 1372847284
reports historians reading it as "the beginning of a Spanish hegemony in
Italy"; the Eighty Years' War (`Q164432`, 1568-05-23 to 1648-01-30, classes
`Q6107280` *revolt* and `Q8465` *civil war*, both in the table) is what the
Dutch–Portuguese War's own article calls the thing that war is an extension of.
Either is importable. **Both arrive main, and this branch's rule is that the
main count may not rise**, so whichever fire takes one must bring the filing
that pays for it.

### What was refused

**`Q377350`, the Iberian Union, refused by this fire and not by the tool.** It
carries `P571` 1580-09-12 and `P576` 1640-12-01, which the import reads, but
its classes are two kinds at once — `Q3024240` *historical country* is an actor
of this atlas and `Q11514315` is an event — and `Q1102202` and `Q188800`
(*personal union*) are in the table under neither. A dynastic union of crowns
is a polity before it is an event, and which of the two it is here is an
editorial decision of the kind `data/imports/wikidata-seeds.json` exists to
hold. It is worth naming because the standing note asks for it: it is the third
umbrella Europe's sixteenth century reaches for.

**`Q673175`, the French Wars of Religion, 1562-04-02 to 1598-04-30, class
`Q104212151` *series of wars*, importable and not imported.** Nothing in this
corpus falls inside its span and subject, so it would arrive main with nothing
to file under it and the count would rise. It is the cleanest umbrella Europe's
sixteenth century is missing and **a fire that brings its children with it can
have it for nothing**.

**`Q15542964` carries a vandalised English label** — "Italian War of 1542–46 Un
penesote" — and nothing of it reached the record. `titleFor()` prefers the
article title over the label, so the record is titled *Italian War of
1542–1546*, and `namesFor()` wrote no names at all. Worth recording because the
next fire that reads a label straight will not be so lucky.

### Counts after this fire

| lane | active | main |
| --- | --- | --- |
| europe | **364** | 88 |
| americas | 180 | 56 |
| asia | 131 | 67 |
| africa | 120 | 31 |

| cell | active before | active after | main before | main after |
| --- | --- | --- | --- | --- |
| americas, 15th | 6 | 6 | 5 | 5 |
| americas, 16th | 9 | 9 | 3 | 3 |
| americas, 17th | 9 | 9 | 6 | 6 |
| americas, 18th | 9 | 9 | 1 | 1 |
| americas, 19th | 38 | 38 | 9 | 9 |
| americas, 20th | 89 | 89 | 31 | 31 |
| americas, 21st | 20 | 20 | 1 | 1 |
| europe, 15th | 3 | **4** | 2 | 2 |
| **europe, 16th** | **8** | **12** | **1** | **1** |
| europe, 17th | 21 | 21 | 2 | 2 |
| europe, 18th | 21 | 21 | 2 | 2 |
| europe, 19th | 15 | 15 | 10 | 10 |

Europe's sixteenth century is half again as full as it was and still has one
main event, which is the shape A6 asks for. **The thinnest cells this branch
can act on are now the Americas' 16th, 17th and 18th, at nine each.**

### Deviations

**1235. A fire has no wall clock unless it reads one, and this fire judged a
healthy check dead by counting its own polling rounds.** Run 1533 entered the
Tests step at 12:59:14. The fire polled it, waited, polled again, and each
round felt like time passing; by the sixth it had written "over an hour" into
a deviation and a report, and cancelled the run by pushing that deviation. The
clock said **13:10**. The step had been running **eight minutes** against a
local twelve, and the replacement run — the same tree, the same suites —
finished in nine minutes and forty seconds, green. **Nothing was wrong with
the check.** What the fire spent: a healthy run cancelled, the protocol's one
permitted re-run burned on a fault that did not exist, a false paragraph
committed to a repository whose whole premise is that its records are honest,
and a push notification telling an owner on holiday that GitHub Actions was
stalled and worth investigating. **The rule is one line: before calling
anything slow, stuck or late, run `date`.** Elapsed time is read, never felt,
and a job's own `started_at` subtracted from a real clock is the only measure
of it a fire has. The corollary is narrower and worth as much: **an
in-progress job's log returns 404, so a fire cannot see inside a running
check** — which means the only honest thing to say about one is how long it
has actually been running.

**1234. `git add -A data/index` is not the index, because the build writes
pages outside it.** `tools/build-index.mjs` has written `sources.html` and
`narratives.html` since H8, and the batch's three edges added sixteen citations
to the bibliography's counts. The index commit staged `data/index` alone and
left the rewritten page in the working tree, where the fire found it only
because it checked `git status` afterwards. `validate --index` did not catch
it: the page half of that check is `main` only, so a branch can carry a stale
prerendered page and still come back clean. **The rule 798 states as "rebuild,
then commit the index" is "commit everything the build wrote"** — the two pages
included.

**1233. A merge of a records branch and the index that describes it were one
commit again, and the fire caught it after pushing.** Deviation 1232, written
by batch 11 on this branch, says the cure is three commits and not two: resolve
and commit the merge, rebuild, commit the index. This fire merged
`origin/m42` and committed the rebuilt index with it, then rebuilt again over
the merge commit and pushed the difference — five history shards and the
manifest moved, which is the size of the error 1232 names. **1232 is a rule the
next fire should read before it merges, not after**: the merge is the first
thing a fire on this branch does and the index is rebuilt before anything has
been committed, which is the order that produces the fault every time.

## The thirteenth fire — two tool faults paid off, and no batch, 23 September

**Wikimedia refused every request this fire made, for the whole of it**, so
there was no batch. What the fire did instead is the two open deviations that
`docs/m42-brief.md` and this file both say belong to "one fire that imports
nothing": **1230**, which had cost three batches a hand repair each, and
**1231**, which had cost one. Both are fixed, both with their test first, and
every batch after this one is cheaper for it.

### Before anything: the merge, and the measurement

`origin/m42`'s batch 43 (the Asia lane) was merged in, `data/index/` dropped
and rebuilt rather than merged, and `docs/m53-polities.md` §4.1 re-taken over
the merged corpus at **376 of 800**, and 377 by the overlap rule. A zero-byte
`geneva-conference` left at the repository root by a shell expansion on `m42`
was removed here.

| | after the merge |
| --- | --- |
| active | **800** |
| **main** | **242** — unchanged, and no import could raise it |
| filed | 558 |
| active edges | 779 |
| **largest connected component** | **565** |
| components | 191 |
| events with no edge | 158 |

| lane | active | main |
| --- | --- | --- |
| europe | 364 | 88 |
| americas | 180 | 56 |
| asia | 134 | 67 |
| africa | 122 | 31 |

| cell | active | main |
| --- | --- | --- |
| americas, 15th | 6 | 5 |
| **americas, 16th** | **9** | 3 |
| **americas, 17th** | **9** | 6 |
| **americas, 18th** | **9** | 1 |
| americas, 19th | 38 | 9 |
| americas, 20th | 89 | 31 |
| americas, 21st | 20 | 1 |
| europe, 15th | 4 | 2 |
| europe, 16th | 12 | 1 |
| europe, 17th | 21 | 2 |
| europe, 18th | 21 | 2 |
| europe, 19th | 15 | 10 |

Europe before 1900 is **73 active, 17 main**, unchanged: batch 43 was Asia's.
The three thinnest cells in this partition are still the Americas' 16th, 17th
and 18th at nine each, and the 18th still has one main event of nine.

### What the network did, measured rather than felt

Deviation 1235 says to read a clock before calling anything late, so this fire
read one. **Twenty probes over twenty minutes, one a minute, every one of
them 429**, and not only on the endpoint the tool uses: `api.php`
(`wbsearchentities` and `wbgetentities`), `Special:EntityData`, the REST
summary endpoint on `en.wikipedia.org`, `api.wikimedia.org` and the Wikibase
REST API on `www.wikidata.org` all refused alike, with the body *"You are
making too many requests to the API."* The agent proxy reported no relay
failures and `bundleCoversEveryHost` true, so this is Wikimedia refusing the
sandbox's egress and not a fault here. `m42`'s twelfth fire of the day had
pushed 93 minutes earlier, which is the likeliest reason the shared address is
in the penalty box; nothing this branch can do about it either way.

**A batch was ready and is not written down as done.** The Americas'
eighteenth century was the cell to take — the Treaty of Madrid of 1750, which
`guarani-war`'s own cached lead says that war "was a result of" and which is
therefore an edge A5 would take on sight; the War of Jenkins' Ear and
Cartagena de Indias under it. None of it was imported, so none of it is
claimed. The next fire should try the network first and take that cell if it
answers.

### The filing pass, tried without the network and honestly refused

A6 asks a fire to file before it imports, and filing needs no network — the
span and the lane are already in the records. So the fire measured it: of the
**73 main events in this partition**, **43 fall inside the span and the lane of
some umbrella the atlas already holds**. Every one of them fails M62's *other*
half, the subject, and filing them would have been false:
`the-brazilian-gold-cycle` is not part of the **Spanish** colonization of the
Americas, `black-monday` is not part of the Colombian conflict, and
`petrobras-1953` is not part of the Cuban Revolution. Four more —
`proclamation-of-the-brazilian-republic-1889` under `empire-of-brazil-1822-1889`,
`1964-brazilian-coup-detat`, `operation-brother-sam-1964` and
`the-base-reforms-rally-1964` under `brazilian-military-dictatorship-1964-1985`
— fit span, lane *and* subject and are still refused, by M67's rule 1: a period
named for a form of government does not contain the act that created or
destroyed it.

**Nothing was filed, and that is the right answer rather than a shortfall.**
The umbrella this partition actually wants is a Portuguese one, and batch 12
already established that it cannot be had: *Colonial Brazil* (`Q2088324`) is
classed a polity, and *Portuguese colonization of the Americas* (`Q2724951`)
would pass the class table and carries no date at all. Seven Brazilian main
events are waiting on it.

### Deviation 1230, fixed

A9 reads the location first, then the administrative territory, then the
country — but `runImportMode` only ever fetched the last two, so `pointOf()`
could not answer for the town an event names by `P276` and the first point with
an answer was the country's. That is how a Brazilian engagement came out in the
European lane in batch 11 and how two battles came out placeless in batch 12.

The fix is one statement: all three properties are collected, not the last two.
A second fault in the same line went with it — the extra items were fetched in
**one call sliced at the batch size**, so past that cap they were silently not
there to read, which is the same gap one step further out; they are fetched in
chunks now.

The test came first (711, 717) and reproduces the deviation rather than
describing it. `Q9000016` is a new fixture: an event whose town is at (5,5) and
whose state is at (-140,-60), two lanes apart, with the town outside the batch.
Before the fix the record was written in the state's lane; the test asserted
`testland` and got `farland`, which is deviation 1230 in one line.

### Deviation 1231, fixed

`Q377269` was refused for want of a lane and written into
`wikidata-state.json` → `runs.import.done` all the same, so adding
`"Q377269": "americas"` to the seeds' `lanes` map changed nothing and the qid
had to be taken out of `done` by hand. A refusal is not a completion.

Each run of `--import` now carries what it refused in a **`refused` list of its
own**, and the next run offers those **first**, ahead of the untried, so that
editing the class table or the lanes map is enough to answer one. The state
file's schema gains the list as an optional property, so a file written before
this reads as having none.

**One refusal is settled rather than carried**: an item Wikidata does not have
cannot be answered by any edit to this repository, so it goes to `done` with
the completions instead of being asked about forever. Everything else names
something under `data/` that a person can change.

**The fix is forward-only and the file cannot say otherwise.** Refusals written
into `done` before today are indistinguishable there from completions, so the
ones already buried stay buried; only `Q377269` was ever dug out, by hand, and
this is what stops the next one needing that.

### Counts after this fire

Unchanged from the table above in every column — **800 active, 242 main, 558
filed, 779 active edges, largest component 565** — because the fire wrote no
record. The two commits that are not the merge touch
`tools/import/wikidata.mjs`, `tests/import-wikidata.test.mjs`,
`tests/fixtures/wikidata/entities.json` and `schema/v1/import-state.json` and
nothing under `data/`.

### The check, which went red twice on this head and is green

`validate.yml` run **1548** on `f7a79472` was red, and so was its re-run
(attempt 2), both times on the same assertion with the same two values:
`keyboard-browser.test.mjs` 81, *"the lanes are one tab stop each, and the
arrows walk along a lane"*, where `End` reached `fixture-event-deep-1969` and
the order read a frame earlier said `fixture-event-deep-2025`. The validator
passed in two seconds in both; only the Tests step failed, 278 of 279.

**It is not this fire's data and it is not a flake.** The test draws
`?fixtures=1` and reads `tests/fixtures/data/`, so nothing under `data/` can
reach it, and this fire's diff is `tools/import/wikidata.mjs`, its tests and
fixtures, `schema/v1/import-state.json` and two markdown files. It passed here
alone three times and in **two full browser passes run exactly as the check
runs them** — `node --test --test-concurrency=1 $(node tools/suites.mjs
--browser)`, 279 tests, 0 failed — so the sandbox does not reproduce it, and a
re-run on the runner does. `m42`'s batch 43 met the same failure with the same
two ids on its run 1537 and called it lane A's.

**The fix already existed in this repository and had not been ported here.**
The test's own comment names the race — a title arrives with its century, so a
shard landing repacks the rows — and `docs/m78-flakes.md` §3 measured that
exact shape and wrote `named(selector)` for it: *"a count of labels is the same
number on either side of a shard landing"*. The wait in front of this test
asked only that **some** label exist, which the first century satisfies at
once. `graph-labels-browser` and `m77-browser` already use `named()`; this
test does now. **No assertion changed, nothing was skipped and nothing
quarantined.** Run **1552** on `724baac6` is **success**.

### Deviations

**1238. A wait that asks whether a label exists asks nothing, and M78 said so
before this fire met it.** The cure was written in M78 and applied to the two
tests that were failing then, and the ones that were green kept the wait that
had been measured useless — so `keyboard-browser` 81 stayed on a count of
labels until the atlas began opening on every century and the count stopped
being a proxy for anything. **The rule: a browser test that reads a picture
waits with `named()`, whether or not it is currently red.** A fix that is
applied only where it is already hurting is a fix half made, and the half
that is left comes back as a red check on somebody else's branch three
milestones later.

**1237. A fire that cannot reach the network should find that out in its first
minutes and spend itself on the backlog, not on waiting.** This one probed
once a minute for fourteen minutes while doing the tool work in between, which
is the right shape: the probe is one call and costs nothing, and the two
deviations it paid off had each been waiting three batches for "a fire that
imports nothing". **The rule: probe once before STEP 3, and if it is 429, treat
the fire as that fire.** The backlog at the head of "Where the run stands" is
what it works from, in the order written there.

**1236. Deviation 1232 was broken again, by the fire that had it in front of
it.** 1233 says the cure is three commits and not two — resolve and commit the
merge, rebuild, commit the index — and 1233 also says *"1232 is a rule the next
fire should read before it merges, not after"*. This fire read the pool file
**after** merging, because STEP 1 of the standing prompt puts the merge before
STEP 2's reading, and so committed the merge and its index together for the
third fire running. It was caught and repaired inside the fire: five history
shards and the manifest moved, exactly the size 1233 measured. **The rule 1233
asked for is a rule about the prompt's own order**: the deviations a branch
carries have to be read before STEP 1's merge, because the merge is the first
thing a fire on this branch does.

## Batch 13 — the War of Jenkins' Ear, and the Americas' eighteenth century

*23 September. The fourteenth fire on the branch, and its thirteenth batch.*
It took what the thirteenth fire left mapped and unclaimed: **the Americas'
eighteenth century, nine active events and one main**, the thinnest cell in
this partition. The vein is the one the previous fire named — the Treaty of
Madrid of 1750, the War of Jenkins' Ear and the First Treaty of San Ildefonso
of 1777 — with one record added to it that the fire could not have planned for,
because it is the umbrella `P361` on the War of Jenkins' Ear points at.

**The network was intermittent and not closed.** The probe deviation 1237 asks
for found `Special:EntityData` and the SPARQL endpoint answering 200 while
`api.php` and the REST summaries answered 429, and the same REST call answered
200 on its third attempt: the import's own backoff (429 and 503 are retryable,
`backoffMs`) carried every call through. **Deviation 1237's rule held and cost
one minute**: a fire that probes knows in its first minutes which kind of fire
it is, and this one was not the thirteenth's.

### Before the batch

The fire merged `origin/m42` (its batch 44) into this branch first, which is
where 806 active and a largest component of 569 come from; `docs/m53-polities.md`
§4.1 was re-taken over the merged corpus at **377 of 806**, and 378 by the
overlap rule.

| | before | after |
| --- | --- | --- |
| active | 806 | **811** |
| **main** | **242** | **242** |
| filed | 564 | 569 |
| active edges | 783 | **787** |
| **largest connected component** | **569** | **569** |
| components | 193 | 194 |
| events with no edge | 160 | 159 |

**The main count did not rise, and it was paid for twice.** Five records
arrived; three were filed on arrival and two stayed main —
`war-of-the-austrian-succession`, which is an umbrella, and
`war-of-jenkins-ear`, whose filing the corpus refused (below) — so the filing
had to find two events already here that belonged under one:

- `the-end-of-the-amazon-rubber-monopoly` → `the-amazon-rubber-boom`. Both
  records cite the same article, *Amazon rubber cycle* at revision 1373636077,
  and the boom's own span ends in **1912**, which is the year of the event
  named for its end: the railway "finished in 1912 arrived too late; the price
  fell". An event named for the end of a cycle belongs under the record that is
  the cycle, and this is the plainest filing in the partition.
- `cuban-war-of-independence-1895-1898` → `spanish-colonization-of-the-americas`.
  Its own summary calls it "the last of three wars Cuba fought against Spain,
  after the Ten Years' War of 1868–78 and the Little War of 1879–80", and Cuba
  was Spanish until 1898, which is the year the umbrella ends at
  (`endDate` 1898-07-13). It is the same filing `the-cuban-sugar-boom` already
  has and the same reading that put `rebellion-of-tupac-amaru-ii` and
  `revolt-of-the-comuneros-new-granada` under that umbrella in batch 9: a
  revolt against Spanish rule inside Spanish America, in the span.

### What was imported

| record | item | span | lane | century |
| --- | --- | --- | --- | --- |
| `war-of-jenkins-ear` | `Q54434` | 1739–1748 | americas | 18th |
| `battle-of-cartagena-de-indias` | `Q2366970` | 1741 | americas | 18th |
| `treaty-of-madrid-13-january-1750` | `Q1422396` | 1750 | europe | 18th |
| `first-treaty-of-san-ildefonso` | `Q580765` | 1777 | europe | 18th |
| `war-of-the-austrian-succession` | `Q32929` | 1740–1748 | europe | 18th |

**Five items put to `tools/import/wikidata.mjs --import`, five created, none
refused and none ambiguous**, in twenty-four calls over two runs. Every one
carries the **cached English lead as its summary**, at the revision the cache
names, with the `wikipedia-en` citation and the `summary-from-lead` flag:
*War of Jenkins' Ear* at 1372109682, *Battle of Cartagena de Indias* at
1375974450, *Treaty of Madrid (13 January 1750)* at 1367898537, *First Treaty
of San Ildefonso* at 1372949821, *War of the Austrian Succession* at
1375907167. **No record of this batch shows the import's placeholder alone.**

**No class was added.** All five carry classes the table already holds — `Q198`
*war*, `Q1261499` *naval battle*, `Q188055` *siege* and `Q131569` *treaty*.
`Q580765` carries a second class, `Q4157074`, which the table does not hold;
`classify()` ignores an unknown class where a known one agrees, so nothing was
decided about it and nothing was added to the table for it.

### The fifth record, and why the batch grew by one

The vein the thirteenth fire mapped had three records in it. The fourth,
`battle-of-cartagena-de-indias`, is the engagement the War of Jenkins' Ear is
remembered for and it arrives filed under it, which is batch 12's pattern and
costs no main event. **The fifth is what `P361` on the War of Jenkins' Ear
names.** `P361` on `Q54434` is `Q32929`, and the article's own infobox says
`part_of = [[War of the Austrian Succession]]`, so the umbrella the item points
at was one record away — and it is a European 18th-century umbrella the branch
will want again: that cell held twenty-one active events and two main before
this batch, and both of those mains are umbrellas of another kind
(`atlantic-revolutions`, `the-british-industrial-revolution`).

**The lead disagrees with the infobox and the batch says so.** The War of
Jenkins' Ear article's first paragraph reads "It is considered a *related
conflict* of the 1740 to 1748 War of the Austrian Succession", and the wider
war's own lead lists it under "Related conflicts" too, while `P361` and the
infobox `part_of` say it is part of it. In the end the dates decided it and
neither reading was used as a filing (below); the disagreement is recorded here
so that a reviewer meets it rather than a conclusion.

### The filing the corpus refused, and what carries it instead

`war-of-jenkins-ear` runs **1739–1748** and `war-of-the-austrian-succession`
runs **1740–1748**, so the child would begin a year before its parent. The fire
filed it there, on `P361` and the infobox, wrote the batch note for it, and
then ran the tests. Rule 24's `child-outside-parent` is a warning, but `tests/m62.test.mjs` and `tests/m67.test.mjs` hold the whole
corpus at **zero** of them, in four assertions between them — *"no child is
dated outside its parent"* and *"the validator reports no rule 24 error and no
child outside its parent"*. The four failed, which is the corpus saying no.

**The filing came off and `war-of-jenkins-ear` is main.** What `P361` and the
infobox assert is carried by the **edge** instead, `war-of-jenkins-ear` →
`war-of-the-austrian-succession` `enabled`, which is where an argument belongs:
`parent` is a display fact, and the display cannot say a war is inside a war
that began a year after it. The second payment above is what that cost.

### Filing (A3, A6, A8), and the main count

| child | umbrella | why it fits, and where the article says so |
| --- | --- | --- |
| `battle-of-cartagena-de-indias` | `war-of-jenkins-ear` (1739–1748) | its own lead: the battle "took place during the 1739 to 1748 War of Jenkins' Ear"; and `P361` on `Q2366970` is `Q54434` |
| `treaty-of-madrid-13-january-1750` | `spanish-colonization-of-the-americas` (1493–1898) | its own lead: the treaty "established detailed territorial boundaries between Portuguese Brazil and the Spanish colonial territories to the south and west" |
| `first-treaty-of-san-ildefonso` | the same | its own lead: it "fixed borders between the colonial possessions in South America held by Spain and Portugal, primarily in the Río de la Plata region" |
| `the-end-of-the-amazon-rubber-monopoly` | `the-amazon-rubber-boom` (1879–1912) | the first payment above |
| `cuban-war-of-independence-1895-1898` | `spanish-colonization-of-the-americas` | the second payment above |

**`war-of-jenkins-ear` was not filed**, and the section above says why: the
evidence for its umbrella is good and the dates refuse it.

No record took a second parent under A8: each of the three fits one umbrella and
the two treaties fit it for the same reason, which is one umbrella and not two.

**Two of the three are filed under an umbrella in another lane**, which is the
shape `treaty-of-paris-1783` has had since it was written: the treaties were
signed in Spain and are drawn in the `europe` lane, and what they are part of
is a process in the Americas. A lane is where a thing happened; an umbrella is
what it is part of.

### Places (A9, as A12 corrects it)

The import reuses a place record and never creates one, so three were written
by hand from the item each event's `P276` names, with the point and the names
the item itself carries:

| event | place written | item | point | precision |
| --- | --- | --- | --- | --- |
| `battle-of-cartagena-de-indias` | `cartagena-de-indias` | `Q657461` | -75.52528, 10.42361 | city |
| `treaty-of-madrid-13-january-1750` | `madrid` | `Q2807` | -3.70333, 40.41694 | city |
| `first-treaty-of-san-ildefonso` | `royal-palace-of-la-granja-de-san-ildefonso` | `Q1540732` | -4.00458, 40.8975 | point |

The palace is the one `point` of the three: `Q1540732`'s classes are a museum
and two kinds of building, none of them a settlement, and A12 (2) takes the
precision from the class. `Q657461` is a municipality and a district of
Colombia and `Q2807` a municipality of Spain, so both are `city`. Each place
carries the `a9-place` flag and a `review.note` saying who wrote it and why,
so a reader is not told the import did it.

**`war-of-the-austrian-succession` took the place record this atlas already
held for `Q46`** — `europe` — which is what the import does when a `P276` item
is already a place here. **`war-of-jenkins-ear` is placeless and stays so**: its
item names six locations and no coordinate, and the import derived its lane
from their points. A war fought across New Granada, the Caribbean, Georgia and
the Pacific has no narrower point that is not a choice, and the run does not
make that choice for it.

### The actors (A12), and `docs/m53-polities.md`

`P710` was read on all five items and answered once. `Q580765` names `Q45670`,
the Kingdom of Portugal, which this atlas holds, so `first-treaty-of-san-ildefonso`
names `kingdom-of-portugal` as a `signatory`. Everything else the five items
name is not a record here, and naming the nearest thing would be naming the
wrong thing: `Q3399982` is the Kingdom of Spain of 1700–1873 and `spain` begins
in 1886; `Q161885` is the Kingdom of Great Britain, and the atlas's
`united-kingdom-of-great-britain-and-ireland` begins in 1801; `Q80702` and
`Q200464`, the Spanish and Portuguese empires, and `Q6037274`, Mosquitia, are
not records here at all. `docs/m53-polities.md` §4.1 was re-taken at **377 of
806** over the merged corpus before the batch, and at **378 of 811** after it:
the batch's one actor line is on a 1777 record naming a polity alive from 1139
to 1910, so it counts by both of the rules §4.1 states.

### The edges (A5, M72)

Three, all `probable`, each quoting two articles at named revisions:

| edge | type | sources |
| --- | --- | --- |
| `treaty-of-madrid-13-january-1750` → `guarani-war` | `caused` | *Treaty of Madrid (13 January 1750)* 1367898537, *Guaraní War* 1370622079 |
| `treaty-of-madrid-13-january-1750` → `first-treaty-of-san-ildefonso` | `precondition-of` | the same treaty article, *First Treaty of San Ildefonso* 1372949821 |
| `war-of-jenkins-ear` → `war-of-the-austrian-succession` | `enabled` | *Battle of Cartagena de Indias* 1375974450, *War of the Austrian Succession* 1375907167 |

Every one carries **two locators**. **No `consensus` was written**, and the
third edge is the one where it was nearly earned: the Battle of Cartagena de
Indias article attributes its reading of the aftermath to Reed Browning, *The
War of the Austrian Succession* (1993), pp. 58–66, which is a work Wikipedia
itself cites and so is exactly what A2 allows. It stays `probable` because the
work is **named** in the article and was not read here, which is the line A2
draws.

**A fourth edge was written and refused by the validator, and the refusal was
right.** `battle-of-cartagena-de-indias` → `war-of-the-austrian-succession`
`enabled` is the argument the Cartagena article makes in so many words — the
news of the defeat reached Europe in June 1741 and George II withdrew Britain's
guarantee of the Pragmatic Sanction — but the wider war is dated from the
Prussian invasion of Silesia in **December 1740**, six months earlier, and
**rule 4 refuses an edge whose `from` starts after its `to`**: *"arrow of time:
`battle-of-cartagena-de-indias` cannot start after
`war-of-the-austrian-succession`"*. The argument was moved onto
`war-of-jenkins-ear`, which begins in 1739 and can hold it, and the explanation
says why the type is `enabled` and not `caused` in the same sentence the
article's own dates force.

### Why the largest component did not move, which A5 asks a batch to say

**It did not move, and the reason is where the batch attached.** The two treaty
edges run to `guarani-war`, which was one of the 160 active events with no edge
at all: it was a component of one and is now a component of three, which lifts
the events-with-no-edge figure by one and the largest component by nothing. The
Jenkins vein is a second component of three, joined to the corpus by nothing —
`war-of-jenkins-ear`'s and the Cartagena battle's articles link to exactly one
record this atlas holds between them, `spanish-colonization-of-the-americas`,
and that is an umbrella and a parent question, not an edge.

**This is batch 12's finding again, in another tree, and it is a fact about the
corpus and not about the batch.** The Americas before 1800 are a set of small components: what
joins them to the largest component is a record in the nineteenth century that
neither the eighteenth-century articles nor the corpus has yet. The
`atlantic-revolutions` umbrella is where that join will come from, and the
record that makes it is an edge from a Spanish American record of this century
into the wars of independence — `first-treaty-of-san-ildefonso` to the
`argentine-war-of-independence` by way of the Banda Oriental is the shape of
it, and no article read in this batch states it.

### The check

Run **1557** on the merge commit `bf0d6cb8` is **red**, on eleven rule 16
errors and nothing else: `data/index/` is not what `build-index.mjs` produces,
five history shards missing and five stale. That is **deviation 1232 met a
fourth time** and it is written up below. All 279 browser tests passed in the
same run and the validator's only complaint was the index. Run **1562** on `ef86ee8a` is
**success** — the batch's own commits rebuilt the index with the merge already
committed. (Run 1561 on `0ceb70e9` was cancelled by that push, not red.)
Locally: `node tools/validate.mjs --index` clean, 0 errors and 493 warnings;
**1794 pure tests and 279 browser tests, 0 failed and 0 skipped**, the browser
half run one suite at a time the way the check runs it, and no flake on this
fire. The four pure tests that went red during the batch are the
`child-outside-parent` assertions of `tests/m62.test.mjs` and
`tests/m67.test.mjs`, which is what they are for, and one byte-identity test in
`tests/bundle.test.mjs`: a record edited through a plain `json.dump` came back
with `"parent": null` written out, where the canonical save omits the key. Both
were fixed in the fire.

### Deviations

**1239. `P361` names an umbrella; only the dates decide whether it can be a
parent, and the corpus is held at zero exceptions.** `war-of-the-austrian-succession`
is not in the thirteenth fire's map — it is what `P361` on the War of Jenkins'
Ear said when the fire read the item — and the fire imported it, filed the war
under it and wrote the batch note before running the tests. `child-outside-parent`
is a **warning** in the validator and the fire treated it as one to be accepted
and explained; `tests/m62.test.mjs` and `tests/m67.test.mjs` hold the corpus at
**zero** of them and four assertions failed. **The rule: a filing is checked
against both `when.start`s before it is written, and a warning the tests hold
at zero is not a warning a batch may accept.** Reading `P361` on every item is
still right and found a real umbrella; what it does not do is settle the
parent. The same sweep over all 41 of this partition's main events that carry a
Wikidata id found exactly two more `P361`s pointing at a record this atlas
holds — `berlin-conference` → `scramble-for-africa` and
`cretan-revolt-of-1897-1898` → `greco-turkish-war-of-1897` — and **both are
refused by the same dates**, 1884 against 1885 and 1898 against 1897. A fire
looking for a payment should not look there again.

**1241. Deviation 1232 was broken a fourth time, by the fire that had 1236 in
front of it.** 1233 says the cure is three commits and not two — resolve and
commit the merge, rebuild, commit the index — and 1236 says the deviations a
branch carries have to be read *before* STEP 1's merge, because the merge is
the first thing a fire on this branch does. This fire read them after, for the
same reason the thirteenth did: **the standing prompt puts the merge in STEP 1
and the reading in STEP 2**, and a fire that follows its prompt in order cannot
obey 1236. The merge commit `bf0d6cb8` carried its own rebuilt index and run
**1557** went red on **eleven rule 16 errors** — five history shards missing,
five stale, the manifest differing — with all 279 browser tests passing in the
same run. **The branch head is clean**, because the batch's own two commits are
in the right order and its index was rebuilt with the merge already committed.
**The rule 1236 asked for is a change to the prompt and nothing a fire can do
from inside it**: until STEP 1 says "read `docs/m42b-pool.md`'s deviations, then
merge", every fire that merges will break 1232 once and repair it in the same
fire. What a fire *can* do, and this one did not, is **rebuild and commit the
index as a second commit immediately after the merge commit** — which costs one
commit and no thought — rather than staging both together with `git add -A`.

**1240. Rule 4 is a date check and an argument check at once, and a batch
should meet it before it writes the edge.** The Cartagena aftermath is the
best-sourced causal claim in this batch and it cannot be written as an edge
from that battle, because the war it is about started six months earlier. The
fire wrote the edge, the validator refused it, and the argument moved one
record up the tree to where the dates allow it. **The rule: check the two
`when.start`s before drafting an explanation, not after** — the explanation is
the expensive half and it had to be rewritten around the record it could
attach to.

## Batch 14 — the Dutch–Portuguese War in Brazil, and the Americas' seventeenth century

*23 September, the fifteenth fire.*

### Before the batch

The fire merged `origin/m42` (its batch 45) into this branch first, which is
where 817 active and a largest component of 576 come from; `docs/m53-polities.md`
§4.1 was re-taken over the merged corpus at **378 of 817**.

| | before | after |
| --- | --- | --- |
| active | 817 | **822** |
| **main** | **242** | **242** |
| filed | 575 | 580 |
| active edges | 794 | **797** |
| **largest connected component** | **576** | **578** |
| components | 193 | 195 |
| events with no edge | 159 | 160 |

Per lane, before and after: `europe` 367/89 unchanged, `asia` 136/67 unchanged,
`africa` 132/31 unchanged, **`americas` 182 active and 55 main → 187 and 55**.
Per century in this partition, only one cell moved: **the Americas' 17th, 9
active and 6 main → 14 active and 6 main**. Europe before 1900 is 76 active and
18 main, untouched.

**The cell the batch took is the one the last fire named**, and for the reason
it named: nine active events, six of them umbrellas or umbrella-shaped records
standing alone, five of the six with no child at all. What that cell needed was
children, and a child arrives filed and costs no main event.

### What was imported

`P361` on `Q377269`, the Dutch–Portuguese War, is a list of forty-three items.
Most of them are M42's — Malacca, Mozambique, Hormuz, Elmina, Goa — and were
left alone. **Five are in Brazil, inside the war's span, and not in the corpus:**

| record | item | span | class | lane | century |
| --- | --- | --- | --- | --- | --- |
| `conquest-of-paraiba` | `Q121494180` | 1634-11-25 – 1634-12-25 | `Q1361229` conquest | americas | 17th |
| `campaign-of-porto-calvo` | `Q121754881` | 1637 | `Q831663` military campaign | americas | 17th |
| `battle-of-tabocas` | `Q4872481` | 1645-08-03 | `Q178561` battle | americas | 17th |
| `first-battle-of-guararapes` | `Q5452519` | 1648-04-19 | `Q178561` battle | americas | 17th |
| `second-battle-of-guararapes` | `Q3504102` | 1649-02-19 | `Q178561` battle | americas | 17th |

**Five put to `--import`, five created, none refused and none ambiguous**, in
thirteen calls. **No class was added**: all three classes were already in the
table. Every one carries the **cached English lead as its summary**, at the
revision the cache names, with the `wikipedia-en` citation and the
`summary-from-lead` flag: *Conquest of Paraíba* at 1370612312, *Campaign of
Porto Calvo* at 1373668892, *Battle of Tabocas* at 1370590318, *First Battle of
Guararapes* at 1370618669, *Second Battle of Guararapes* at 1370736242. **No
record of this batch shows the import's placeholder alone.**

### Filing (A3, A6, A8), and the main count

**All five fell inside `dutch-brazil-1630-1654` (1630–1654) and were filed there
on arrival, so the main count did not rise and nothing had to be paid for it.**

**A8 says every umbrella whose span and subject fit, and this batch learned what
that does not mean.** All five are also inside `dutch-portuguese-war`
(1601–1661), so the first filing named both — and
`tests/m42-filing.test.mjs` refused it: *"battle-of-tabocas is part of
`dutch-portuguese-war` and is inside it already through
`dutch-brazil-1630-1654`"*. `dutch-brazil-1630-1654` is itself a child of the
war, so naming the war as well says nothing the tree does not already say.
**A8's "every umbrella that fits" is every umbrella not reachable through
another**, and the corpus holds that at zero. The five carry the narrower one
alone.

### Places (A9, as A12 corrects it)

The import reuses a place record and never creates one, so four were written by
hand from the item each event's `P276` names, with the point and the names the
item itself carries:

| event | place written | item | point | precision |
| --- | --- | --- | --- | --- |
| `conquest-of-paraiba` | `paraiba` | `Q38088` | -36.81667, -7.15 | region |
| `campaign-of-porto-calvo` | `porto-calvo` | `Q1772636` | -35.39778, -9.045 | city |
| `battle-of-tabocas` | `vitoria-de-santo-antao` | `Q985685` | -35.3075, -8.12639 | city |
| `second-battle-of-guararapes` | `jaboatao-dos-guararapes` | `Q271393` | -35.015, -8.11278 | city |
| `first-battle-of-guararapes` | `jaboatao-dos-guararapes` | (the same record) | | city |

The precision is the located item's class, as A12 (2) asks: `Q485258` is a
state of Brazil, which is larger than a settlement and is not a state in the
sense the vocabulary means, so Paraíba is `region`; `Q3184121`, municipality of
Brazil, is `city`. **Five events gained a place and none stayed placeless.**

**Two of the five needed a reading, and both are on the record.**
`second-battle-of-guararapes` carries its own `P625`, which A12 (2) reads
first — and that point, -35.015556/-8.112222, is `Q271393`'s own point to three
decimals, so the mechanical rule and the named town give the same ground and the
place is the town. `first-battle-of-guararapes` carries **no point at all**, and
its `P276` is `Q40942`, the **state** of Pernambuco: read mechanically it would
have put a battle on a whole province. **It takes the town instead, from its own
cited article** — revision 1370618669 gives the location as *"Morro dos
Guararapes (present-day Jaboatão dos Guararapes, Pernambuco, Brazil)"* — which
is the standard A7 and A13 already use for a span and for an edge, and no
coordinate was invented: the point is `Q271393`'s. The record says so in its
`review.note` and carries `a9-place`.

**A `pernambuco` place record was written and then deleted.** It was the strict
reading of the first battle's `P276`, and once the battle took the town it was a
place no event referenced — a `place-unused` warning and nothing else. A batch
should not leave one behind.

### The actors (A12), and `docs/m53-polities.md`

`P710` was read on all five items and answered twice: `Q121494180` names
`Q200464` (the Portuguese Empire) and `Q617066` (the Dutch West India Company),
`Q121754881` names `Q377350` (the Iberian Union) and `Q617066` again. **This
atlas holds none of the three.** `kingdom-of-portugal` is `Q45670` and a
different item; the actor `dutch-brazil` runs 1650–1714, carries no Wikidata id
and is not the Company. Naming the nearest thing would be naming the wrong
thing, so **all five carry `actors: []`**, which M67 A1 settled is not a defect.
§4.1 was re-taken at **378 of 822**: the denominator moves by five and the
numerator by nothing.

### The edges (A5, M72)

Three, all `probable`, each quoting two articles at named revisions:

| edge | type | sources |
| --- | --- | --- |
| `dutch-brazil-1630-1654` → `conquest-of-paraiba` | `precondition-of` | *Conquest of Paraíba* 1370612312 § Details, *Dutch Brazil* 1371124077 |
| `capture-of-bahia` → `campaign-of-porto-calvo` | `enabled` | *Campaign of Porto Calvo* 1373668892 § Background, *Capture of Bahia* 1370608303 |
| `first-battle-of-guararapes` → `second-battle-of-guararapes` | `precondition-of` | *Second Battle of Guararapes* 1370736242 § Background, *First Battle of Guararapes* 1370618669 |

Every one carries **two locators**. **No `consensus` was written**, and the
second edge is where it was nearly earned: the Porto Calvo article attributes
the passage to Clemmy Manzo, *The Rough Guide to Brazil* (2014) and to Erik
Odegard, *Patronage, Patrimonialism, and Governors' Careers in the Dutch
Chartered Companies, 1630–1681* (2022), pp. 60–62 — works Wikipedia itself
cites, which is exactly what A2 allows. It stays `probable` because the works
are **named** in the article and were not read here, which is the line A2 draws
and the line batch 13 drew on Reed Browning.

**`battle-of-tabocas` arrives with no edge, and the sentence that would give it
one cannot be written.** Its article says the battle "was the first major
victory in the nine-year period of war that would lead to the retreat of the
Dutch from Northeastern Brazil" — and the record this atlas holds for that
retreat is the *end* of `dutch-brazil-1630-1654`, which **starts in 1630**,
fifteen years before Tabocas. **Rule 4 refuses an edge whose `from` starts after
its `to`**, and this is deviation 1240's case again, met before the explanation
was written rather than after. Nothing else in the corpus is both after 1645 and
named by that article. The one join that suggested itself — Tabocas to the First
Battle of Guararapes, because the Tabocas article calls Tabocas the first
victory of the insurrection and the Guararapes article says that battle "took
place during the Insurrection of Pernambuco" — **is a claim neither article
makes**, assembled from two of them, and the run did not write it.

### Why the largest component moved, which A5 asks a batch to say

**It moved by two, and the two are the two edges that reach backwards into the
existing corpus.** `capture-of-bahia` and `dutch-brazil-1630-1654` are both in
the largest component, so `conquest-of-paraiba` and `campaign-of-porto-calvo`
joined it on arrival: 576 → **578**. The Guararapes pair is a **new component of
two** and `battle-of-tabocas` a **component of one**, which is why the component
count rises by two and the no-edge figure by one.

**This is the first batch of this partition in four whose edges reached an
existing record rather than only its own**, and the reason is worth keeping:
batches 12 and 13 imported trees whose articles named nothing the atlas held,
while this one imported *into* a tree the atlas already had four records of. A
fire that wants the component to move should import under a record that is
already in it.

### The check

Committed on the head in the order 798 asks — the import fix and its test, then
the records, then the index rebuilt over the record commit, then this page, then
the eight cached leads the five records cite.
**`node tools/validate.mjs --index` is clean: 0 errors, 497 warnings.** The
tests were run the way M63's check runs them: **1795 pure and 279 browser, 2074
in all, 0 failed and 0 skipped.**

**Run 1581 on the head `8b9b3287` is green, first and only attempt.** Runs 1577,
1578 and 1580 were **cancelled** rather than red, each superseded by the next
push of this fire; nothing in this fire went red on any head.

### Deviations

**1242. The index has to be rebuilt after the merge *commit exists*, not merely
committed after it.** 1241 asked a fire to rebuild and commit the index as a
second commit immediately after the merge commit, and this fire did exactly
that — and still went to seven rule 16 errors, because it *built* the index
while the merge was still uncommitted. `tools/lib/history.mjs` reads each
record's versions out of the repository's own commits, so an index built before
the commit that changes records exists is stale about the history shards the
moment that commit lands: three missing, three stale, and the manifest differing.
**The order is resolve, commit, then build, then commit** — `build-index.mjs`
runs *after* `git commit`, never before it, and this is the same rule 798 states
for a batch, which is why a batch has never broken it. A third commit repaired
it here. Where 1233 says "three commits and not two" it should be read as three
commits *in that order*, and the ordering is the whole of it.

**1243. A `maxlag` refusal ended a run that `Special:EntityData` could have
served.** The first import attempt of this fire died on
*"Waiting for wdqs1012: 94.1 seconds lagged"*. `maxlag` is a refusal of the
action API and of nothing else — the API answers it with HTTP 200 and an error
in the body, and `Special:EntityData` takes no `maxlag` parameter at all — but
`fetchEntities` fell back to that endpoint only on a 429 or a 403, so the lag
was fatal where the rate limit was not. **The fallback now covers both**, after
the four retries are spent, so a lag that lifts is still waited out. Written
test-first. **The lag lifted by itself on the second attempt**, two minutes
later, so this fire did not need the fix and the batch would have landed
without it; the fires that lost a whole fire to the network would have.

**1244. "Every umbrella whose span and subject fit" is every umbrella not
reachable through another.** A8's wording reads as a list and the first filing
of this batch wrote one: both `dutch-brazil-1630-1654` and the
`dutch-portuguese-war` it is itself a child of. `tests/m42-filing.test.mjs`
holds the corpus at zero of those and caught all five. **A filing that names two
parents should check that neither reaches the other before it is written** — the
test is cheap and ran in a second, and this cost one edit of five records only
because the test was run after them and not before.

**1245. A place written for a reading that is then overturned has to be
deleted in the same batch.** `pernambuco` was written from the strict reading of
the first battle's `P276` and was referenced by nothing once that battle took
its town. `place-unused` is a warning and the fire would have passed carrying it.
**A batch's own leftovers are its own to remove.**

## Batch 15 — the Spanish conquest of the Aztec Empire, and the Americas' sixteenth century

*23 September, the sixteenth fire. The cell is **the Americas' sixteenth
century**, which the fifteenth fire left as the thinnest in this partition, and
the vein is the one batch 8 opened there.*

### Before the batch

The fire opened by merging `origin/m42`'s batch 46 — seven events of the Libyan
civil war's eastern front, none of them this lane's — and re-taking
`docs/m53-polities.md` §4.1 at **378 of 829**. The merge is also where this
fire lost half a tool and had to put it back: see deviation 1246.

| | before | after |
| --- | --- | --- |
| corpus | 829 active | **834 active** |
| **main** | **242** | **242** — unchanged, which is the rule |
| largest connected component | 585 | **591** |
| components | 195 | 194 |
| events with no edge at all | 160 | 159 |
| the `americas` lane | 187 active, 55 main | **192 active, 55 main** |
| the Americas' 16th century | 11 active, 5 main | **16 active, 5 main** |

### Per lane and per century (A10)

| century | europe | africa | asia | americas | oceania | no lane | all |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15th c. | 4 / 2 | — | — | 4 / 3 | — | — | 8 / 5 |
| 16th c. | 12 / 1 | — | — | **16 / 5** | — | — | 28 / 6 |
| 17th c. | 21 / 2 | — | — | 14 / 6 | — | — | 35 / 8 |
| 18th c. | 24 / 3 | — | — | 11 / 2 | — | — | 35 / 5 |
| 19th c. | 15 / 10 | 17 / 1 | 7 / 7 | 38 / 8 | — | — | 77 / 26 |
| 20th c. | 239 / 64 | 75 / 22 | 103 / 45 | 86 / 30 | — | — | 503 / 161 |
| 21st c. | 52 / 7 | 47 / 8 | 26 / 15 | 23 / 1 | — | — | 148 / 31 |
| **all** | **367 / 89** | **139 / 31** | **136 / 67** | **192 / 55** | **—** | **—** | **834 / 242** |

*Active / main, over the topology the validator builds. No active event carries
no start year.*

**South and Central America against North America**, the order the brief sets:
152 against 19 by the latitude of each event's place, splitting at the Rio
Grande's mouth. All five of this batch are south of that line — Tenochtitlan is
at 19.4°N — so the order is kept and is nowhere near being spent.

### How the five were found

One SPARQL query, and it is the cheapest thing this run has done: every item
whose `P361` is one of the three conquest umbrellas the atlas already holds —
`Q828435` the Aztec conquest, `Q636771` the Inca, `Q2993582` Guatemala — that
also has an English article. **Sixteen items came back, two of them records
this atlas already has.** Five were taken here; the other nine are listed under
"Where the run stands" for the fire after this one.

### What was imported

| record | item | date | class | lane | century |
| --- | --- | --- | --- | --- | --- |
| `massacre-in-the-great-temple-of-tenochtitlan` | `Q1131442` | 1520-05-22 | `Q3199915` massacre | americas | 16th |
| `battle-of-cempoala` | `Q97610233` | 1520-05-27 | `Q178561` battle | americas | 16th |
| `la-noche-triste` | `Q1308854` | 1520-06-30 – 1520-07-01 | `Q178561` battle | americas | 16th |
| `battle-of-otumba` | `Q2888038` | 1520-07-07 | `Q178561` battle | americas | 16th |
| `battle-of-colhuacatonco` | `Q112811996` | 1521-06-30 | `Q178561` battle | americas | 16th |

**Five put to `--import`, five created, none refused and none ambiguous**, in
twenty-five calls. **No class was added**: all three were already in the table.
Every one carries the **cached English lead as its summary**, at the revision
the cache names — *Massacre in the Great Temple of Tenochtitlan* at 1375661366,
*Battle of Cempoala* at 1370436634, *La Noche Triste* at 1370626402, *Battle of
Otumba* at 1370271351, *Battle of Colhuacatonco* at 1370437482 — with the
`wikipedia-en` citation and the `summary-from-lead` flag beside it. **No record
of this batch shows the import's placeholder alone.**

**`massacre-in-the-great-temple-of-tenochtitlan` carries no category**, and that
is a decision and not an omission. `Q3199915` *massacre* is in the class table
with no category, and none of the twelve of `data/categories.json` is one a run
should quietly give it: `war` is "a war, a campaign, a battle or a siege:
organised armed force between polities", and every account this batch read says
the Mexica at the feast were unarmed. Which category a massacre is belongs in
`data/categories.json` or in the class table, where somebody can argue with it.

### Filing (A3, A6, A8), and the main count

**All five fell inside an umbrella the atlas already held, so the main count did
not rise and nothing had to be paid for.**

Four are inside `spanish-conquest-of-the-aztec-empire` (1519-02 – 1521-08-13)
and file there. The fifth, `battle-of-colhuacatonco` of 30 June 1521, is also
inside `fall-of-tenochtitlan` (1521-05-26 – 1521-08-13), which is itself a child
of that war — so under deviation 1244 it names **the narrower one alone**: the
siege reaches the war, and saying both would say nothing the tree does not
already say. `tests/m42-filing.test.mjs` was run before the records were
written this time, not after, and passed on the first reading.

### Places (A9, as A12 corrects it)

The import reuses a place record and never creates one, so all five were
attached by hand. **Two place records were written and three events point at a
record the atlas already had.**

| event | place | item | point | precision |
| --- | --- | --- | --- | --- |
| `massacre-in-the-great-temple-of-tenochtitlan` | `tenochtitlan` | (existing, `Q13695`) | -99.13138889, 19.435 | point |
| `battle-of-cempoala` | `cempoala` (written) | `Q1053364` | -96.40411111, 19.44708333 | city |
| `la-noche-triste` | `tenochtitlan` | (existing) | | point |
| `battle-of-otumba` | `otompan` (written) | `Q1650771` | -98.75, 19.7 | city |
| `battle-of-colhuacatonco` | `tenochtitlan` | (existing) | | point |

**Five events gained a place and none stayed placeless.** The two new records
take their point, their names and their article from the item itself; the
precision is the item's own reading of what it is — `Q1053364` is the Totonac
city the Cempoala article calls "the city of Cempoala", `Q1650771` is an
*altepetl* Wikidata describes as a human settlement — and `city` is what the
vocabulary calls that.

**Three of the five needed a reading, and all three are on the record.**

- `massacre-in-the-great-temple-of-tenochtitlan` carries its own `P625`,
  -99.131388888/19.435, which A12 (2) reads first — and it is `tenochtitlan`'s
  own point to eight decimals. Its `P276` is the Templo Mayor, which stood in
  that city. The mechanical rule and the named place give the same ground.
- **`la-noche-triste`'s own `P625` is wrong and was refused.** It reads
  -109.23457/30.66411, which is in Sonora, some 1,400 km from the Valley of
  Mexico, in a state no account of the night places it in. A12 (2) puts the
  item's own point first; it does not ask a run to put an event where nothing
  says it happened. The cited article at revision 1370626402 says the Spanish
  "were driven out of the Mexica capital, Tenochtitlan", and that city is a
  record this atlas already holds, so the event points at it. **No coordinate
  was invented**: the point is `tenochtitlan`'s own. This is deviation 1247.
- `battle-of-colhuacatonco`'s own `P625`, -99.13528/19.44339, is 1.1 km from
  `tenochtitlan` and inside the same city — its article calls Colhuacatonco the
  neighbourhood most of the fighting happened in. A place is written once
  however many events happen there, so the event points at the city rather than
  at a district record nothing else in the atlas would ever use.

### The actors (A12), and `docs/m53-polities.md`

`P710` was read on all five items and answered once: `Q97610233` names
`Q5589753`, `Q126236` and `Q898658` — conquistadors, the Totonac people and the
Governorate of Cuba. **This atlas holds none of the three**, under those items
or any others, and naming the nearest thing would be naming the wrong thing. So
**all five carry `actors: []`**, which M67 A1 settled is not a defect. §4.1 was
re-taken at **378 of 834**: the denominator moves by five and the numerator by
nothing.

### The edges (A5, M72)

**Six, all `probable`, and every one of them quotes two articles at named
revisions — twelve locators across six edges.**

| edge | type | sources |
| --- | --- | --- |
| `spanish-conquest-of-the-aztec-empire` → `battle-of-cempoala` | `precondition-of` | *Battle of Cempoala* 1370436634 § Background, *Battle of Otumba* 1370271351 § Background |
| `battle-of-cempoala` → `la-noche-triste` | `precondition-of` | *La Noche Triste* 1370626402 § Cortés heads off Spanish punitive expedition, *Battle of Cempoala* 1370436634 § Aftermath |
| `massacre-in-the-great-temple-of-tenochtitlan` → `la-noche-triste` | `caused` | *Fall of Tenochtitlan* 1371683304 § Aztec revolt, *Massacre in the Great Temple of Tenochtitlan* 1375661366 |
| `la-noche-triste` → `battle-of-otumba` | `precondition-of` | *Battle of Otumba* 1370271351 § Background, *Fall of Tenochtitlan* 1371683304 § Battle of Otumba |
| `battle-of-otumba` → `fall-of-tenochtitlan` | `enabled` | *Battle of Otumba* 1370271351, *Fall of Tenochtitlan* 1371683304 § Aztecs regroup |
| `fall-of-tenochtitlan` → `battle-of-colhuacatonco` | `caused` | *Battle of Colhuacatonco* 1370437482, *Fall of Tenochtitlan* 1371683304 |

**No `consensus` was written.** The Colhuacatonco article carries a bibliography
of works Wikipedia itself cites, which is what A2 allows — and the edge stays
`probable` because those works are named there and were not read here, which is
the line A2 draws and the one batches 13 and 14 drew before it.

**The one edge this batch wanted and could not write is the one rule 4
refuses.** Both the Cempoala and the Massacre articles say the massacre
happened because Cortés had left the city to deal with Narváez: "Before he
departed, he entrusted one of his captains, Pedro de Alvarado, with governing
both the Spanish and Mexica. During his absence..." But what preceded the
massacre is the **departure**, and the record this atlas holds is the
**battle**, fought on 27 May — five days *after* the massacre of 22 May. Rule 4
refuses an edge whose `from` starts after its `to`, and it is right to: the
atlas does not hold the march, only its end. This is deviation 1240's shape for
the third time, and it was met before the explanation was written rather than
after.

**One claim was read and left alone.** The Cempoala article's § Smallpox
outbreak states that Narváez's soldiers carried smallpox into Cortés's force
and thence to Tenochtitlan, and that "the subsequent pandemic killed millions of
Native Americans". The atlas holds two depopulation records —
`indigenous-depopulation-of-the-greater-antilles` and
`indigenous-depopulation-of-coastal-brazil` — and **neither is Mexico**. An edge
from Cempoala to either would be this run deciding that one pandemic is another,
which is not reading an article.

### Why the largest component moved, which A5 asks a batch to say

**It moved by six, which is one more than the batch imported, and the sixth was
already here.** `spanish-conquest-of-the-aztec-empire` is in the largest
component — `spanish-colonization-of-the-americas` → it, `enabled` — and the
first edge of this batch reaches back into it. The other five then chain
forward: Cempoala to La Noche Triste to Otumba to `fall-of-tenochtitlan`, which
had been **a component of one** since it was written, and on to Colhuacatonco.
585 → **591**, components 195 → 194, no-edge events 160 → 159.

**This is batch 14's lesson applied deliberately rather than noticed
afterwards.** That batch found that a batch joins the largest component when it
attaches to a record already in it; this one looked for that record *before*
choosing what to import, and the umbrella the five file under turned out to be
it. **Filing and joining are still different things** — `parent` is not
adjacency, and it was the edge and not the filing that moved the number — but a
batch that files under an umbrella in the largest component has its join within
reach by construction.

### The check

Committed in the order 798 asks: the records, then the index rebuilt over the
record commit, then this page, then the cached leads.
**`node tools/validate.mjs --index` is clean: 0 errors, 499 warnings** — one
fewer than before the batch, because two events that had been placeless are not
any more.

### Deviations

**1246. Taking one side of a conflicted file keeps that side's fix and drops
the other's.** The merge of `origin/m42` conflicted in
`tools/import/wikidata.mjs`, where both branches had independently written
M42's A12 (2) — a place's precision off its class. `origin/m42`'s version was
the fuller one and was taken whole, with `git checkout --theirs`, which is the
right call for that change and the wrong one for the file: this branch's own
deviation 1243, the `Special:EntityData` fallback on a `maxlag` refusal, lived
twenty-five lines below it and went with the rest. **The fire then died twice on
a `maxlag`** before the loss was noticed — the third fault in a row to be found
by the network rather than by reading. `--theirs` on a file is a decision about
every change in it, not about the conflicted hunk: **a file taken wholesale has
to be read for what the other side put in it elsewhere**, and `git log` on that
branch's commits to it is the cheap way. The fix and its test were re-applied
over `origin/m42`'s version and are 74339645's, unchanged.

**1247. An item's own `P625` can be wrong, and A12's order is a preference and
not an instruction to place an event where nothing says it happened.**
`Q1308854`, *La Noche Triste*, carries -109.23457/30.66411 — Sonora, 1,400 km
from the Valley of Mexico, in a state no account of the night mentions. A12 (2)
corrected `placeRecord()` to read the item's own point first, and every batch
since has; read mechanically here it would have put the Spanish flight from
Tenochtitlan on the wrong side of Mexico. **The reading that overturns a point
is the same one batch 14 used to overturn a `P276`**: the record's own cited
article at a named revision, which says the Spanish "were driven out of the
Mexica capital, Tenochtitlan" — a place record this atlas already holds, so
nothing was invented and no coordinate was typed. **A point a run cannot square
with the article it is citing is a refusal, and the refusal goes on the
record**, in `review.note`, where a reviewer can disagree with it.

**1242, a second time, and the pool's own paragraph says so.** This fire
resolved the merge, **built the index, and only then committed** — all of it in
one commit — and went to seven rule 16 errors on the history shards, exactly as
the fifteenth fire did. The order is **resolve, commit, build, commit**, and
`tools/lib/history.mjs` reading the repository's own commits is the whole
reason. A second commit repaired it. The paragraph at the head of "Where the run
stands" has said this since the fifteenth fire; reading it is apparently not the
same as doing it, so it is repeated here with the fire that paid for it named.

## Where the run stands, for the fire that picks it up

*23 September, after the sixteenth fire and its fifteenth batch.*

| | |
| --- | --- |
| corpus | **834 active** |
| **main** | **242** — the count the next batch must not raise |
| **largest connected component** | **591** |
| components | 194 |
| events with no edge at all | 159 |
| Europe before 1900 | 76 active, 18 main |
| the `americas` lane | **192 active, 55 main** |
| the thinnest cells left, in this partition | the Americas' 18th (11 active, 2 main), the Americas' 15th (4, 3), Europe's 16th (12, 1) |
| the cell this batch moved | the Americas' 16th, 11 → 16 active and 5 main unchanged |

**The order of a fire on this branch, which deviation 1242 settles and two
fires running have now broken.** Resolve the merge and **commit it**; only then
`node tools/build-index.mjs`; then commit the index as its own commit. Building
before the merge commit exists costs seven rule 16 errors on the history shards
every time. The same order is 798's for a batch: records committed, then
rebuild, then commit the index.

**Read `git log origin/m42 -- <file>` before taking a conflicted file whole.**
Deviation 1246: `--theirs` on `tools/import/wikidata.mjs` cost this branch its
own `maxlag` fallback and two dead import attempts. The fix is back; the habit
is what the next fire needs.

**The network answered, and `maxlag` was standing.** `Special:EntityData` and
the SPARQL endpoint served throughout; `api.php` at Wikidata answered `maxlag`
— *"Waiting for wdqs1011: 148.7 seconds lagged"*, then *"wdqs1014: 144.6"* —
and killed two import attempts eight minutes apart. The third attempt, the
first with the fallback back in the file, finished in twenty-five calls.
**Whether the lag lifted in between or the fallback carried it, this run cannot
say**, and it matters less than the two attempts it cost: the lag of the
fifteenth fire lifted in two minutes and this one had not in eight. **A hand-written `curl` at `en.wikipedia.org`'s
`api.php` is refused outright** — *"You are making too many requests to the
API"* — and the import's own user-agent with a two-second delay between titles
gets through where a bare one does not. The article text this batch's edges
quote was fetched that way.

**Nine items are left in the vein this batch opened, and the query that found
them costs one call.** Every item whose `P361` is one of `Q828435` (the Aztec
conquest), `Q636771` (the Inca) or `Q2993582` (Guatemala) and that has an
English article. Sixteen came back; two are already records here; five are this
batch. **The nine, with where each files:**

| item | title | date | files under | century |
| --- | --- | --- | --- | --- |
| `Q3636661` | Battle of Vilcaconga | 1533-11-18 | `spanish-conquest-of-the-inca-empire` | 16th |
| `Q1612814` | Battle of Cusco | 1533-11-24 | `spanish-conquest-of-the-inca-empire` | 16th |
| `Q3636517` | Battle of Maraycalla | 1534-05 | `spanish-conquest-of-the-inca-empire` | 16th |
| `Q2338569` | Battle of Ollantaytambo | 1537-01 | `siege-of-cusco`, which is the narrower | 16th |
| `Q1612597` | Battle of Chupas | 1542-09-16 | `spanish-conquest-of-the-inca-empire` | 16th |
| `Q3119074` | Spanish conquest of the Kingdom of Q'umarkaj | 1524 | `spanish-conquest-of-guatemala` | 16th |
| `Q1615387` | Battle of Punta Quemada | 1525 | **not** the Inca conquest — it is outside 1532–1572; `spanish-colonization-of-the-americas` holds it | 16th |
| `Q3636591` | Battle of Puná | 1531-04 | the same: outside the Inca conquest, inside the colonization | 16th |
| `Q7573336` | Spanish conquest of Petén | 1618–1697 | `spanish-conquest-of-guatemala` | 17th |

**Seven of those nine are the Americas' sixteenth century again and none of them
costs a main event**, because every one falls inside an umbrella already here.
`spanish-conquest-of-the-inca-empire` is in the largest component, as the Aztec
conquest is, so a batch of them can join it the same way this one did — and
`battle-of-cajamarca` and `siege-of-cusco` are both **components of one** today
and would be carried in with it, as `fall-of-tenochtitlan` was.

**The two dates to check before importing `Q1615387` and `Q3636591`.** Both are
`P361` of the Inca conquest on Wikidata and both are dated *before* its 1532
start, so filing them there is a `child-outside-parent`. The reading this run
would take is that the atlas's `spanish-conquest-of-the-inca-empire` follows the
article's 1532–1572 and the two engagements belong to the voyages that preceded
it — but that is a reading, and the umbrella that certainly holds them is
`spanish-colonization-of-the-americas`, 1493–1898.

**The other veins named by the fifteenth fire are unchanged and still open.**
`Q4677306` and `Q4677341`, the two 1654 actions that end the Dutch–Portuguese
War in Brazil, file under the war itself and cost no main event.
`Q19019163` *Dutch invasions of Brazil* (1624–1654) is an umbrella whose span
already holds seven records here, so it is paid for on arrival — a fire that
takes it should check first that it does not sit between the war and Dutch
Brazil in the way deviation 1244 refuses. The Italian Wars tree is still twelve
active events joined to nothing, and the **Peace of Cateau-Cambrésis of 1559 is
still the named door**. The French Wars of Religion (`Q673175`) are still free
to whoever brings their children.

**The two questions for the owner are unchanged and both still block a
century.**

1. **Does the atlas begin in 1492, or does its first sentence follow the corpus
   wherever the corpus goes?** `WHAT_IT_IS` in `src/intro.js` names
   `atlas.extent.min` and two tests hold it there, so nothing on this branch can
   fill Europe's fifteenth century or anything earlier. A one-line answer
   unblocks four records already known to import cleanly (`Q212976`, `Q12551`,
   `Q127751`, `Q1552718`), and `italian-war-of-1494-1495` is the fifth record
   sitting against the wall.
2. **May a run take a period umbrella from an item whose class is a polity,
   where the article is plainly a period article?** Colonial Brazil (`Q2088324`)
   is the case and it is worth seven main events. `Q377350`, the **Iberian
   Union**, is a second case of the same shape. The class table is an editorial
   decision and the whole point of it living in `data/`, so the run will not
   decide either.

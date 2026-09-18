# M47 — the parent-child relations the corpus already implies

M30c gave a parent event a look of its own: a ring outside its mark on the
map, the timeline and the graph, decided once in `src/parts.js` so the three
views cannot disagree. The machinery works and is tested. **No record under
`data/` carried a `parent`** — `atlas.childrenOf` was empty, `isParent` was
false for all 250 active events, and no ring had ever been drawn on the
running atlas; the two records that exercised it were fixtures under
`tests/fixtures/data/`. This run writes the data.

It writes nothing about the world. `parent` is a **display fact and never an
argument**, in the schema's own words — "the larger event this one is part of:
a battle inside a war, a decree inside a revolution. One parent, so the events
form a tree" — and in the contribution form's, which calls the field "Part of"
and adds "a display fact and never an argument: what caused what is an edge".
Saying that the treaty is part of the war is not a historical claim; it takes
no `explanation` and no `sources`, because it argues nothing. The rule below
is what decides which of them the corpus already holds.

## The rule

**The rule comes first and is written down before a single `parent` is set,
so that every relation and every refusal below can be recomputed from `data/`
and this document alone.** A relation is written when, and only when, all
three hold.

### 1. The corpus says it, in membership words

One of the two records says the child is part of the larger one, in its own
title, summary, or an edge explanation that touches both:

- the **child** names the larger event and places itself inside it
  (*"took Russia out of the First World War"*, *"ended the Russo-Japanese
  War"*, *"where the Second World War in Europe was decided"*, a title of the
  form *X in Europe*); or
- the **parent** names the child as something it contains or consists of
  (*"The period contains the international programme of 2011 to 2014 … both
  of which this atlas holds as records of their own"*, *"The war's second
  phase … the invasion has a record of its own"*); or
- the **parent** names the force, the front or the operation the child record
  is about, and the child is an engagement of that force inside the parent's
  dates (*"sent an expeditionary corps to Flanders"* — and the child is that
  corps's battle in Flanders).

The words have to be words of membership: *part of*, *inside*, *within*, *a
phase of*, *the same epidemic*, *the war's own dead*, *contains*, *X in Y*.

### 2. Not in causal words, and not a reaction or a characterisation

**"Caused by" is not "part of".** A word that argues that one thing brought
another about — *caused*, *led to*, *came out of*, *made possible*, *counted
from*, *reacted to*, *the aftermath of*, *a continuation of* — is an edge's
business and never a parent's. The corpus carries 272 edges, all of them
`caused`, `precondition-of`, `enabled`, `inspired` or `reacted-to`, and **not
one of them is a parent**. Three consequences, each of which refuses a
candidate below:

- a **reaction** to an event is not a part of it (`portugal-backs-franco-1936`
  is held as `reacted-to` the Spanish Civil War);
- a **characterisation** of an event is not a part of it
  (`gaza-genocide` says of itself: "held apart from the war it is about");
- a record whose larger event the atlas does **not hold as a record** gets no
  parent, however plainly it names one (`hat-nipah-and-same-massacres` names
  "the war opened by the invasion of December 1975"; there is no such record).

An edge between the two records neither makes a parent nor forbids one. Where
both exist they say different things: `crisis-portugal --caused-->
troika-bailout-2011` argues that the crisis produced the request, and the
parent says the request is one of the things the crisis period is made of. The
edge is in the adjacency; the parent never is.

### 3. The records agree it fits

Mechanical, and checked after the fact by the validator:

- the child's interval lies inside the parent's — `when.start` and `when.end`,
  which is what rule 24's `child-outside-parent` warning reads;
- where both records carry actors, the child's are the parent's, or bodies the
  parent's own summary names. A war's peace treaty signed by five of its
  belligerents passes; two records sharing one great power does not.
- one parent only, so the events form a tree, and no chain closes on itself
  (rule 24).

**Where the rule leaves a case arguable, the case is refused and listed.** If
the argument for a relation comes from what I know about the past rather than
from what these records say, it is not this run's to write.

### How the candidates were found

Three passes over the 250 active events, each reproducible:

1. every event whose title or summary contains the exact title of another
   active event (38 pairs; it over-matches on substrings — "World War I" is
   inside "Second World War");
2. every event whose interval is strictly inside another's and which shares at
   least one actor with it (54 pairs);
3. every summary carrying a membership phrase — *part of*, *contains*,
   *inside it*, *a phase of*, *the same …*, *one of the …*, *episode of* (25
   hits, of which one — `crisis-portugal` — is an actual statement of
   containment).

Then every candidate read against the rule. A pass is a way of not missing a
case, never a reason to write one: `twelve-day-war` is inside `gaza-war` and
shares Israel with it, and is no part of it.

## The relations written

Ten: ten children and seven parents, sixteen records in all —
`full-scale-russo-ukrainian-war` is both a child and a parent.

| child | parent | what the records say |
| --- | --- | --- |
| `germany-declares-war-1916` | `world-war-i` | The parent's summary: "Portugal entered it in March 1916, when Germany declared war after the requisition of German ships in the Tagus". The child's: "the declaration brought it formally into the European war". An act by which a belligerent enters a war is an act of that war. |
| `battle-of-the-lys-1918` | `world-war-i` | The parent: Portugal "sent an expeditionary corps to Flanders". The child: "the Lys sector held by the 2nd Division of the Portuguese Expeditionary Corps", and "the officers who had been sent to Flanders". The child's actor is `portuguese-expeditionary-corps`; it is that corps's battle, inside the war's years. |
| `treaty-of-brest-litovsk` | `world-war-i` | The child: "the treaty took Russia out of the First World War". Every one of its five signatories — Russia, Germany, Austria-Hungary, the Ottoman Empire, Bulgaria — is a belligerent of the parent. |
| `eastern-front` | `world-war-ii` | The child: "was where the Second World War in Europe was decided: some thirty million of the war's dead, the great majority of German losses, and by most counts over four fifths of the fighting". The parent names the Soviet Union among the places the war was fought across; both of the child's actors are its belligerents. |
| `treaty-of-portsmouth` | `russo-japanese-war` | The child: "The treaty signed on 5 September 1905 at the naval yard at Kittery, Maine, ended the Russo-Japanese War." The parent's own `endDate` is that day. |
| `troika-bailout-2011` | `crisis-portugal` | The parent: "The period contains the international programme of 2011 to 2014 and the austerity that came with it, both of which this atlas holds as records of their own." This record is the request and the memorandum that opened that programme. |
| `troika-programme-ends-2014` | `crisis-portugal` | The same sentence. The child: "The three-year programme agreed with the European Commission, the European Central Bank and the IMF ended on 17 May 2014". |
| `full-scale-russo-ukrainian-war` | `russo-ukrainian-war` | The parent: "The war's second phase opened with the full-scale invasion of February 2022 and it continues. The record covers the whole of it from 2014; the invasion has a record of its own, because what changed in 2022 was not the war's existence but its scale." |
| `bucha-massacre` | `full-scale-russo-ukrainian-war` | The edge between them: "what a Russian army was doing in a commuter town thirty kilometres from Kyiv is answered entirely by the plan of 24 February", and "the killings were done during that occupation". The parent's summary names that operation: "the northern axis was abandoned in April". |
| `covid-19-pandemic-in-europe` | `covid-19-pandemic` | The child's title is the parent's event in Europe, and the edge between them says it: "The European epidemic is the same epidemic". The atlas keeps two records because the Portuguese chain runs through the European one, not because there are two epidemics. |

No relation produced a `child-outside-parent` warning: every child's years lie
inside its parent's. That the warning is silent on all ten is a check on the
set and not an accident — condition 3 is the same test the rule applies.

## The candidates refused

A refusal is a result. Each of these was considered and turned down, with the
clause that turned it down.

| candidate | proposed parent | why not |
| --- | --- | --- |
| `portugal-backs-franco-1936` | `spanish-civil-war` | Its title names the war and the war's summary lists what it did, but the atlas holds the relation as `reacted-to`: "Salazar's government did not have a Spanish policy before July 1936 and improvised one in a fortnight". A reaction to a war is not one of its parts (clause 2). |
| `wall-street-crash-of-1929` | `great-depression` | "is conventionally the date the Great Depression is counted from, though what it actually contributed to the Depression is one of the longest arguments in economic history". Counted from, contributed to: causal words, and the record says the size of the contribution is disputed (clause 2). |
| `treaty-of-versailles` | `paris-peace-conference` | The parent says "Five treaties came out of it", and there is a `caused` edge. Came out of is production, not membership; the child's own record never names the conference (clauses 1 and 2). |
| `treaty-of-trianon` | `paris-peace-conference` | The same, and it is dated outside: the conference ends 21 January 1920 and the treaty is of 4 June (clause 3). |
| `treaty-of-sevres` | `paris-peace-conference` | The same; signed 10 August 1920, after the conference the records close in January (clauses 1 and 3). |
| `treaty-of-lausanne` | `turkish-war-of-independence` | The war's `endDate` is the treaty's day, but the child never names the war, and the parent lists Lausanne among the things that followed the Greek defeat that "ended it" — a sequence of aftermath, not a containment (clause 1). |
| `warsaw-uprising` | `world-war-ii` | Inside the war's years, both actors its belligerents — and neither record names the other. The parent names no Polish force and no operation this record is about; the case would be made entirely from outside the corpus (clause 1). |
| `katyn-massacre`, `potsdam-conference`, `20-july-plot`, `munich-agreement`, `molotov-ribbentrop-pact`, `winter-war`, `tripartite-pact` | `world-war-ii` | Each is inside or beside the war and none of them says it is part of it. Molotov–Ribbentrop and Munich are dated before the parent begins; the Tripartite Pact names "the Axis Powers of World War Two", which places the powers and not the pact (clauses 1 and 3). |
| `the-holocaust` | `world-war-ii` | Its interval opens in 1933, six years before the parent's, "because that is when the persecution began" — the record is explicit that it is not bounded by the war (clause 3). |
| `second-sino-japanese-war` | `world-war-ii` | "merged into the Second World War after Pearl Harbor" — half of it, and from 1937, before the parent starts (clauses 1 and 3). |
| `arab-revolt`, `easter-rising`, `sayfo`, `armenian-genocide` | `world-war-i` | "during World War I" is where the Arab Revolt's record puts itself, and during is placement in time. The Rising is held by a `world-war-i --enabled-->` edge, which is the argument that it was timed against the war; the two genocides run past the war's end (clauses 1, 2 and 3). |
| `treaty-of-london` (1915) | `world-war-i` | A secret pact between the Entente and Italy, whose record never names the war; the atlas argues it as a `precondition-of` the Paris conference (clauses 1 and 2). |
| `february-revolution`, `october-revolution` | `world-war-i` | Inside the war's years and sharing Russia with it. `world-war-i --caused--> february-revolution` is the atlas's claim about them — "The revolution was made of the war's costs and out of its materials" — which is causation stated as plainly as it can be (clause 2). |
| `covid-state-of-emergency-2020` | `covid-19-pandemic-in-europe` | Its title says "of the pandemic", which dates the decree; it does not enrol it. A pandemic is not constituted by a state's decrees the way a war is constituted by its belligerents' acts, and the atlas holds the relation as `caused` (clause 2). |
| `bes-resolution-2014` | `crisis-portugal` | Inside the years, but the parent's containment sentence names the programme and the austerity, and this is neither (clause 1). |
| `wagner-group-rebellion` | `full-scale-russo-ukrainian-war` | Inside the years and sharing Russia. The record calls it "evidence of what the war had made possible inside Russia" — made possible, and inside Russia rather than inside the war (clauses 1 and 2). |
| `gaza-genocide` | `gaza-war` | "This record is the characterisation, held apart from the war it is about." The corpus refuses this one in as many words (clause 2). |
| `hat-nipah-and-same-massacres` | — | Names "the war opened by the invasion of December 1975". The atlas holds the invasion (one day, 7 December 1975) and the independence of 2002, and no record of the war between them. There is nothing to be part of (clause 1). |
| `angola-war-begins-1961`, `guinea-war-begins-1963`, `mozambique-war-begins-1964` | — | The three fronts of the colonial war, and `mozambique-war-begins-1964` calls itself "the front that made the war continental in scale". **The atlas holds no record of that war.** This is the largest gap the run found (clause 1). |
| `second-balkan-war` | `first-balkan-war` | "continuation of the First Balkan War": a successor, and dated after it ends (clauses 2 and 3). |
| `geneva-conference` | `first-indochina-war` / `korean-war` | "dealt with the aftermath of Korean War and First Indochina War" — aftermath, and two candidates where the field allows one (clauses 1 and 2). |
| `iberian-pact` | `spanish-civil-war` | "signed … a fortnight before the Spanish Civil War formally ended" names the war to date the treaty (clause 1). |
| `treaty-of-accession-1985` | `eec-accession-1986` | "the signature and the entry into force are six months and one constitutional threshold apart" — the records say they are two moments, not one inside the other (clauses 1 and 3). |
| `nationalisations-1975` | `coup-attempt-11-march-1975` | "Three days after the failed coup": after, and the proposed parent is a single day (clauses 2 and 3). |
| the 1911 decrees — `law-of-separation-1911`, `constitution-1911`, `universities-of-lisbon-and-porto-1911` | — | Decrees inside a revolution is the schema's own example, and `republic-proclaimed-1910` is a record of one day, not of the republic. There is no record of the First Republic to hang them on (clause 1). |

## The counts

Of the **250 active events**: **10 have a parent**, **7 are parents**, and
**234 are neither**. One event — `full-scale-russo-ukrainian-war` — is both,
so sixteen records are in a family and 234 are not.

The third number is the one that decides whether the display rule this
unblocks is worth building: **94 per cent of the atlas is top-level**, and a
rule that draws only top-level events by default would hide ten marks.

## What the shape of the corpus says

Seven parents, and **only one of them is Portuguese** — `crisis-portugal`, the
one Portuguese record that covers a stretch of years rather than a day. The
atlas's Portuguese spine is 1890 to 2025 in single days and single years: no
record of the First Republic, of the Estado Novo, of the Military
Dictatorship, of the colonial war, of the revolutionary period of 1974–75.
The events that would be the parents of a hundred Portuguese records **are not
in the corpus**, and until they are, the display rule this milestone unblocks —
draw only top-level events, open a parent to see its parts — will hide ten
events on a map of 250 and nothing at all on the part of it the atlas is
about. That is the finding this run leaves with the owner, and the reason the
third count matters.

## What a reader sees, now that there is something to see

The ring was drawn for the first time on the running atlas, and the corpus
answers differently on the three views.

- **The timeline**: five rings at the opening window, which is every parent
  whose bar is in it. No bracket: a bracket needs the parts of one parent to
  share a lane *and* the timeline to be grouped, and the opening view is
  `group=none`.
- **The graph**: two rings at the opening zoom. The other five parents are
  inside stacks, and a stack is a count and not a record, so it carries no
  ring — which is M30c's own rule (§1) and not a defect.
- **The map**: none. Six of the seven parents have no `place` — a world war
  is not a point — so the map has no mark to ring; the seventh,
  `crisis-portugal`, is at Lisbon and inside the Lisbon cluster at the opening
  zoom. `?selected=crisis-portugal` draws it with its ring, and that is the
  only ring the map can draw today.

**No event became large.** `src/large.js` makes an event large when its parts
fall in more than one region lane, and every one of the seven has its parts in
a single lane — even `russo-japanese-war`, whose one part is at Portsmouth in
the Americas. So the second thing `parent` turns on is still off, and nothing
gained a band or a wash.

### The defect this found in the graph

The two levels of detail compose — a part is folded into its parent, and the
stacking then runs on the nodes that are left — and **a stack's badge counts
the nodes under it, not the events inside those nodes**. So an event folded
twice is in no badge at all: the graph's promise that "nothing has been
dropped from the picture, only folded into it" fails for **eight of the 250
active events** at the opening zoom. It could not fail before, because no
event had parts. `tests/graph-browser.test.mjs` now computes that number from
the records and the drawn ids and asserts it exactly, so it cannot drift; the
fix belongs to the run that changes what the graph draws, and this one left
the graph alone.

## The check that stops this recurring

`parent` was not the only field with a reader and no writer, and nothing in
the repository was looking. `tools/validate.mjs` now warns about every
property the record schemas declare that some module under `src/` reads and
no record under `data/` sets. The fields come from the schemas, so the check
knows about one the day a schema gains it; it is a warning and never an
error, because an unwritten field is a gap and not a defect.

It names five today, and would have named `parent` as a sixth this morning:

| field | declared by | read in | what is waiting on it |
| --- | --- | --- | --- |
| `scope` | event | `src/large.js` and 6 others | a person's answer to "how big is this event": until one is written, an event is large only through the lanes of its parts |
| `historicalNames` | place | `src/map/names.js` and 3 others | M38b's dated place names; 0 of 26 places carry one |
| `body` | event, actor, place | `src/entry/entry.js` and 18 others | the long prose of a record, below the summary |
| `isbn` | source | `src/citation.js` and 4 others | a book's number in a bibliography of 34 sources |
| `container` | source | `src/citation.js` and 13 others | the journal or volume an article is in |

## What this run did not do

No new event, actor, edge or source; nothing written about the world. No
display change: `src/parts.js`, `src/map/`, `src/timeline.js` and the graph
are untouched, so the separate run that decides what a reader sees can tell
what the data did on its own. The two browser tests that moved are tests: the
graph's badge arithmetic, which the first parents in `data/` made false, and
the timeline's churn bound, which five ring rects pushed over by two.

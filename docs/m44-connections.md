# M44b — the proof that it connected

M44a imported 82 records. This file is the account of what each of them was
wired to, what it was retracted for, and what the wiring did to the part of the
atlas that was already here. The two numbers section 4b of `docs/m44-brief.md`
asks for are at the bottom, and they are recomputed from `data/` by the script
printed with them — never asserted from memory.

## 1. The rule, frozen before a hop was counted

Amendment A15 asks for this to be written out before the first hop is counted,
so that anybody can recompute every number below from `data/` and this page
alone. It was written into this file in the run's first commit, before any edge
was written.

**A Portuguese event** is an active event that satisfies at least one of:

- **(a)** its `place` is one of the seventeen Portuguese and
  Portuguese-administered places, listed in full below;
- **(b)** its `actors` name at least one of the Portuguese actors listed in
  full below;
- **(c)** its `title` matches `/\bPortugal|\bPortuguese/i`.

### (a) The seventeen places

`alvor`, `belem`, `boe`, `braga`, `central-portugal`, `chai`, `dili`, `lajes`,
`lisbon`, `luanda`, `macau`, `panaji`, `parque-das-nacoes`, `pedrogao-grande`,
`porto`, `tete-district`, `tite`.

The nine of `data/places/` that are **not** in the list, and why: `berlin`,
`flanders`, `near-villanueva-del-fresno`, `new-york`, `saint-denis`,
`stockholm`, `washington` are not Portuguese ground on any reading; `conakry`
is the Republic of Guinea, where the atlas places the assassination of Amílcar
Cabral, and was never Portuguese; `recife` is Brazil, where the atlas places
the Santa Maria in 1961, and was not Portuguese in 1961.

### (b) The Portuguese actors

Sixty-three ids, being every actor named by an active event that is a
Portuguese state, a Portuguese public figure, or a Portuguese party, bank or
body:

**Polities** — `portugal`, `first-portuguese-republic`, `military-dictatorship`,
`estado-novo`, `third-portuguese-republic`.

**People** — `carlos-i`, `luis-filipe`, `manuel-ii`, `joao-franco`,
`manuel-de-arriaga`, `afonso-costa`, `pimenta-de-castro`, `sidonio-pais`,
`paiva-couceiro`, `gomes-da-costa`, `oscar-carmona`, `salazar`,
`humberto-delgado`, `norton-de-matos`, `henrique-galvao`, `marcelo-caetano`,
`americo-tomas`, `antonio-de-spinola`, `otelo-saraiva-de-carvalho`,
`vasco-goncalves`, `ramalho-eanes`, `mario-soares`, `alvaro-cunhal`,
`cavaco-silva`, `pedro-passos-coelho`, `antonio-costa`,
`marcelo-rebelo-de-sousa`, `luis-montenegro`, `andre-ventura`,
`ricardo-salgado`.

**Institutions** — `regenerator-party`, `partido-republicano-portugues`,
`carbonaria`, `partido-democratico`, `republican-liberal-party`,
`democratic-leftwing-republican-party`, `portuguese-expeditionary-corps`,
`uniao-nacional`, `legiao-portuguesa`, `pvde-pide-dgs`, `mud`,
`people-s-monarchist-party`, `pcp`, `armed-forces-movement`,
`council-of-the-revolution`, `partido-socialista`, `psd`, `cds-pp`,
`bloco-de-esquerda`, `ecologist-party-the-greens`, `chega`,
`liberal-initiative`, `people-animals-nature`, `portuguese-democratic-movement`,
`banco-de-portugal`, `banco-espirito-santo`, `novo-banco`,
`redes-energeticas-nacionais`.

**Deliberately excluded, and the exclusion is the conservative choice.** The
liberation movements of the Portuguese colonies and their leaders — `paigc`,
`frelimo`, `mpla`, `fnla`, `unita`, `fretilin`, `mlstp`, `amilcar-cabral`,
`eduardo-mondlane` — are **not** on the list. They were not Portuguese, and
counting them would have enlarged the Portuguese set and made this round's bar
easier to clear rather than harder. No event loses its Portuguese standing by
the exclusion: every colonial-war record the atlas holds carries either a
Portuguese place (`tite`, `chai`, `boe`, `luanda`, `dili`, `tete-district`) or
a Portuguese actor of its own.

**Three actors were reinstated after this list was frozen** — `university-of-porto`,
`national-syndicalists` and `energias-de-portugal`, in section 3b below — and the
list is deliberately not reopened for them. Each is named by one new event, and
each of those events is Portuguese by rule (a) already, carrying the place
`lisbon`, so no number in this file depends on whether the three are on the
list or not.

### The reach bar

A record M44b keeps is **(P) Portuguese-reaching**: it carries at least one
honest edge, and a path of **active edges of length at most two**, in either
direction, joins it to a Portuguese event. Per amendment A12, **(B) is not a
second criterion**: a bridge is already (P), and what (B) names is the target —
a previously stranded world event that acquires Portuguese reach because of an
edge written here. That count is reported below and is what the round is for.

Hops are computed over **active events and active edges only**, undirected,
breadth-first from the record to the nearest Portuguese event.

### The rule the round wrote edges under

**Every edge written in M44b has at least one M44 record as an endpoint.**
This is the run's own discipline and not the brief's. It keeps the unstranding
number honest: a world event that stops being stranded here stops because a
record M44a imported was wired next to it, not because the run went round the
old corpus filling in edges that would have raised the number without importing
anything. Gaps in the old corpus that M44b could see but did not touch are
named in section 5, for the owner.

## 2. The check the measurement reproduces

Run against `data/` before a single edge of this round was written, the rule
above returns **145 Portuguese events and 65 world events** in the 210 active
records that predate M44a, and **45 of the 65 touch no Portuguese event at
all**. Those are exactly the numbers section 1 of `docs/m44-brief.md` measured
by hand on `2246f23`. The rule as written here is therefore the brief's rule,
and every number below is comparable with the brief's.


## 3. One row per kept record

Thirty of the eighty-two are kept. Every one of them carries at least one edge
written by hand in this round, and every one of them is joined to a Portuguese
event by a path of active edges of length one or two. The hop column is
recomputed from `data/` by the script in section 4 and is not asserted from
memory; a record with two edges has its hop count on its first row. The last
column is the first sentence of the edge's own `explanation`, which is where
the argument is written out in full.

| record | edge | other end | hops | the sentence that argues it |
|---|---|---|--:|---|
| `constitutionalization-attempts-in-iran` | → `precondition-of` | `iranian-revolution` | 2 | This edge states its own gap and should be read carefully. |
|  | ← `inspired` | `russian-revolution-of-1905` |  | Persia watched 1905 from next door and read it as an instruction. |
| `first-balkan-war` | → `precondition-of` | `assassination-of-archduke-franz-ferdinand` | 2 | Between October 1912 and May 1913 the Ottoman Empire lost nearly everything it still held in Europe, and the South Slav question took the shape it had in 1914: not a question of Ottoman misgovernment but of who would inherit, with Serbia doubled and Austria-Hungary facing a neighbour that spoke for the Slavs inside its own borders. |
|  | → `caused` | `second-balkan-war` |  | The second war was fought over the spoils of the first. |
| `second-balkan-war` | ← `caused` | `first-balkan-war` | 2 | The second war was fought over the spoils of the first. |
|  | → `precondition-of` | `assassination-of-archduke-franz-ferdinand` |  | The second war left Serbia larger again and Bulgaria hostile, and it is the point at which Vienna concluded that the Serbian problem would have to be settled rather than managed. |
| `sayfo` | ← `enabled` | `world-war-i` **(PT)** | 1 | The Sayfo was carried out under the cover of the war and by the state that was fighting it. |
| `treaty-of-london` | → `precondition-of` | `paris-peace-conference` **(PT)** | 1 | The secret treaty of April 1915 is what Italy brought to Paris and what Paris would not honour. |
| `easter-rising` | → `precondition-of` | `irish-civil-war` | 1 | This edge states its own gap. |
|  | ← `enabled` | `world-war-i` **(PT)** |  | The Rising was timed against the war and not against anything else. |
| `finnish-civil-war` | ← `precondition-of` | `october-revolution` | 1 | The Bolshevik seizure of power is the nearer of the two preconditions the atlas now holds. |
|  | ← `precondition-of` | `world-war-i` **(PT)** |  | Finland was a Russian grand duchy in 1914 and an independent state in a civil war by January 1918, and the war is what stands between the two. |
| `arab-revolt` | → `precondition-of` | `treaty-of-sevres` | 1 | Sèvres is where the Ottoman defeat the revolt helped to bring about was written down, and where what had been promised during it was disposed of. |
|  | ← `enabled` | `world-war-i` **(PT)** |  | The revolt is an operation of the war’s Middle Eastern theatre and could not have been anything else. |
| `german-revolution-of-1918-1919` | → `precondition-of` | `treaty-of-versailles` **(PT)** | 1 | The Allies would not sign with the Empire, and the revolution is what put something else in its place. |
|  | ← `caused` | `world-war-i` **(PT)** |  | The revolution began in the navy and it began over the war. |
| `irish-civil-war` | ← `precondition-of` | `easter-rising` | 2 | This edge states its own gap. |
| `march-on-rome` | → `inspired` | `beer-hall-putsch` | 1 | Munich in November 1923 was an attempt to do what Rome had done thirteen months earlier, and its organisers said so. |
|  | → `inspired` | `constitution-1933` **(PT)** |  | The corporative state the constitution of 1933 set up was built on a model Italy had made, and the model is the whole of what this edge claims. |
| `kellogg-briand-pact` | → `precondition-of` | `charter-of-the-united-nations` | 2 | The pact of 1928 is where the renunciation of war as an instrument of policy was first written into a general treaty, and it is the text the Charter of 1945 rewrote with an enforcement machinery behind it. |
| `winter-war` | ← `enabled` | `molotov-ribbentrop-pact` | 2 | The secret protocol of 23 August 1939 put Finland in the Soviet sphere, and that is what made the demands of October and the invasion of 30 November possible without a European war following. |
|  | ← `enabled` | `world-war-ii` |  | Finland fought alone because the war had already begun elsewhere. |
| `tripartite-pact` | ← `precondition-of` | `second-sino-japanese-war` | 2 | Japan signed in Berlin in September 1940 because it had been at war in China for three years and could not finish it. |
|  | ← `caused` | `world-war-ii` |  | The pact is made of the first year of the war. |
| `20-july-plot` | ← `caused` | `world-war-ii` | 2 | The plot of July 1944 was made by officers who had concluded that the war was lost and that a government able to negotiate had to exist before the Allies arrived. |
| `bretton-woods-system` | → `precondition-of` | `imf-agreement-1978` **(PT)** | 1 | The Fund Portugal went to in 1978 is the Bretton Woods institution, and the terms it went on are the Bretton Woods terms: a standby credit against a programme of demand restraint and exchange-rate correction, negotiated with a body created at a conference Portugal was not at in 1944. |
|  | ← `precondition-of` | `great-depression` |  | Bretton Woods was designed against the 1930s and against nothing else. |
| `greek-civil-war` | → `precondition-of` | `nato-founding-1949` **(PT)** | 1 | Greece is where the American commitment to defend Europe west of the Soviet line was first made and first paid for. |
| `1948-czechoslovak-coup-d-etat` | → `precondition-of` | `european-convention-on-human-rights` | 1 | The convention of 1950 was drafted as an alarm bell and its drafters said so. |
|  | → `precondition-of` | `nato-founding-1949` **(PT)** |  | Prague in February 1948 is the event that turned a discussion into a treaty. |
| `1948-arab-israeli-war` | → `caused` | `1952-egyptian-revolution` | 2 | The Free Officers were made in Palestine. |
|  | → `precondition-of` | `yom-kippur-war` |  | This edge states its own gap. |
| `genocide-convention` | ← `precondition-of` | `charter-of-the-united-nations` | 2 | The Charter is the machinery the convention was made in and the authority it was made under: the General Assembly resolved in December 1946 that genocide was a crime under international law, the Economic and Social Council had the text drafted, and the Assembly adopted it two years later. |
|  | ← `caused` | `the-holocaust` |  | The convention of 9 December 1948 was written because of what had been done in Europe between 1941 and 1945, and by a man who had lost his family in it. |
| `treaty-of-paris` | → `precondition-of` | `treaty-of-rome` | 2 | The Coal and Steel Community of 1951 is the institution the Community of 1957 was built on top of: the same six states, a High Authority that became a Commission, a Court, an Assembly, and the demonstration that supranational government of one sector could be made to work. |
| `convencao-das-nacoes-unidas-relativa-ao-estatuto-dos-refugiados` | ← `caused` | `world-war-ii` | 2 | The convention of 28 July 1951 was written for the displaced of that war and said so: as adopted it applied only to people who had become refugees as a result of events occurring before 1 January 1951, and the geographical reservation let a state limit it to Europe. |
| `treaty-of-san-francisco` | ← `precondition-of` | `korean-war` | 2 | Korea is why the peace with Japan was made in 1951 rather than later, and why it was made on those terms. |
|  | ← `caused` | `world-war-ii` |  | This is the peace that ended the war’s Pacific half, six years late and on terms the intervening years had changed. |
| `1952-egyptian-revolution` | ← `caused` | `1948-arab-israeli-war` | 2 | The Free Officers were made in Palestine. |
|  | → `precondition-of` | `algerian-war` |  | Cairo after 1952 is where the Algerian revolution was prepared and from where it was supplied. |
| `geneva-conference` | ← `caused` | `first-indochina-war` | 2 | The Indochinese half of the conference is the half that produced agreements, and it produced them because Dien Bien Phu fell on 7 May 1954, the day after the Indochina session opened. |
|  | → `precondition-of` | `algerian-war` |  | Three months separate the accords of 20 July 1954 from the risings of 1 November, and the connection between them is not a coincidence but it is not a simple cause either. |
|  | → `precondition-of` | `vietnam-war` |  | The line at the seventeenth parallel that the accords drew as a military demarcation became a border because the elections they provided for in 1956 were never held, and the war of the following twenty years was fought across it. |
|  | ← `caused` | `korean-war` |  | The conference of April to July 1954 was convened to settle what the armistice of Panmunjom had left open: the armistice had stopped the fighting and settled nothing about Korea’s future, and the Berlin conference of February 1954 agreed to take the Korean question to Geneva. |
| `1973-chilean-coup-d-etat` | → `inspired` | `1976-argentine-coup-d-etat` | 1 | The claim here is a shared doctrine and a demonstration, not a chain of command. |
|  | → `inspired` | `25-november-1975` **(PT)** |  | Chile is the case every side in Portugal argued from in 1975, and that is what this edge claims. |
| `1976-argentine-coup-d-etat` | ← `inspired` | `1973-chilean-coup-d-etat` | 2 | The claim here is a shared doctrine and a demonstration, not a chain of command. |
| `amsterdam-treaty` | → `precondition-of` | `euro-adoption-1999` **(PT)** | 1 | The single currency Portugal joined on 1 January 1999 was governed by rules settled at Amsterdam in June 1997: the stability and growth pact, agreed at that European Council and given legal form alongside the treaty, is what turned the Maastricht deficit criterion from a condition of entry into a standing obligation of membership, and it is the instrument Portuguese budgets were made against for the next fifteen years. |
|  | → `precondition-of` | `treaty-of-nice` |  | Nice exists because Amsterdam failed. |
|  | ← `precondition-of` | `maastricht-treaty` **(PT)** |  | Amsterdam is an amendment to Maastricht and was provided for by it: Maastricht wrote a review conference into its own text, and the intergovernmental conference that produced the treaty of October 1997 is that review. |
| `treaty-of-nice` | ← `precondition-of` | `amsterdam-treaty` | 2 | Nice exists because Amsterdam failed. |
| `mahsa-amini-protests` | ← `precondition-of` | `iranian-revolution` | 2 | The protests of September 2022 were against the republic the revolution founded and against one of its founding acts in particular. |
|  | → `precondition-of` | `2025-2026-iranian-protests` |  | The protests of 2022 and 2023 changed no leadership and left the government more firmly in place, which is what the record of them says; what they left was a repertoire, a slogan and a demonstration of how far the thing could be pushed and where it stopped. |

### 3b. The second shape — the actor reinstatements

Amendment A5: eleven of section 4c's rows un-retract an **actor**, not an
event, and an actor takes no edge. An actor is reinstated by being named in an
active event's `actors` with a role from `data/roles.json`, and rule 11 makes a
retracted actor referenced by an active event a hard error, so each
reinstatement and the event that names it are one commit. The two-hop bar is
about events and is not applied to an actor.

| record | the event that names it | role | the sentence that argues it |
|---|---|---|---|
| `university-of-porto` | `universities-of-lisbon-and-porto-1911` | `institution` | The provisional government created two new universities by decree on 22 March 1911, ending four centuries in which Coimbra had been the only one in the country. |
| `national-syndicalists` | `national-syndicalists-banned-1934` | `target` | The blue shirts had wanted what the Estado Novo would not have, and the suppression is where the difference between the Portuguese regime and the Italian one stops being a matter of interpretation: the Estado Novo destroyed its own fascists. |
| `energias-de-portugal` | `edp-created-1976` | `institution` | Electricidade de Portugal was constituted in 1976 as a single public undertaking out of the fourteen electricity companies the state had taken over the year before. |

Each of the three events also carries one edge, so that a reinstatement does
not leave a record standing alone: `republic-proclaimed-1910` **caused** the
university decree, `constitution-1933` is a **precondition-of** the ban, and
`nationalisations-1975` is a **precondition-of** the creation of EDP.

**Eight of the eleven stay retracted**, and the reason is §4c's own hard
constraint rather than connectability: the event that would name each of them
is a law, a merger or a sale whose date and instrument this run could not point
at in any of the thirty-four sources this atlas holds. They are in section 5.

## 4. The two numbers, recomputed from `data/`

Owner question 8 asked whether the connection claim should become a committed
validator warning; the brief's answer was not in M44, and that the script is
written, run, and its output pasted in. This is that output, run at the end of
the round against `data/` on the branch. The script itself is reproduced after
it; it reads `data/` and `git show` of `9e212b8b`, which is the branch head as
M44a left it, so that the 45 stranded events are identified in the corpus the
brief measured and then looked up again in the corpus this round made.

```
$ node .m44b-count.mjs
active events 243, active edges 270
Portuguese 148, world 95
M44 records still active: 30
  of them Portuguese-reaching within two hops: 30
  failing the bar: 0
  by hops: {"1":12,"2":18}

before M44b: 292 active events, 65 world events that predate M44a
  of them stranded (no Portuguese neighbour, the brief's 45): 45
  of the stranded, already within two hops before M44b: 11
  of the stranded, beyond two hops before M44b: 34

>>> STRANDED WORLD EVENTS THAT STOPPED BEING STRANDED: 2
      european-convention-on-human-rights: Infinity -> 2
      treaty-of-sevres: Infinity -> 2
>>> of the 45, gained a direct Portuguese neighbour: 0
>>> of the 45, brought nearer but still beyond two: 8
      chinese-civil-war: Infinity -> 4
      korean-war: Infinity -> 3
      russian-revolution-of-1905: 4 -> 3
      second-sino-japanese-war: Infinity -> 3
      the-holocaust: Infinity -> 3
      treaty-of-lausanne: Infinity -> 4
      treaty-of-portsmouth: 5 -> 4
      turkish-war-of-independence: Infinity -> 3
```

**The first number: 30 of 30.** Every M44 record still active is
Portuguese-reaching. Twelve of them are one hop from a Portuguese event and
eighteen are two. That number is 30 of 30 and not 30 of 82 because fifty
records were retracted rather than wired, which is the rule working and not the
rule being evaded.

**The second number: 2.** Two of the forty-five stranded world events stop
being stranded because of an edge written here — the European Convention on
Human Rights, which reaches Portugal through the Czechoslovak coup of 1948 and
Portugal's signature of the North Atlantic treaty, and the treaty of Sèvres,
which reaches it through the Arab revolt and the war of 1914. Both went from no
path at all to two hops.

**What the second number is really saying, and it is the round's finding.** Of
the 45, eleven were already within two hops before this round began — they had
no Portuguese neighbour but they had a Portuguese path — so the number that
could move was 34, not 45. Of those 34, two moved inside the bar and eight more
were brought nearer without reaching it. Twenty-four did not move at all.

The reason is structural and importing more world events will not fix it. A
stranded record reaches Portugal in two hops only if something adjacent to it is
adjacent to a Portuguese event, and the set of world events that are adjacent to
a Portuguese event is small: twenty before this round, and this round added
nothing to it, because **not one of the eighty-two imported records could be
given a direct edge to a Portuguese event except through a record that already
had one.** Twelve M44 records are one hop out, and every one of those twelve is
one hop out through an event the atlas already held — the war of 1914, the
Paris conference, the constitution of 1933, the North Atlantic treaty, the Fund
agreement of 1978, 25 November 1975, the euro. The world round cannot reach
Portugal by importing more world; it reaches Portugal by writing the Portuguese
records that the world touches. Section 5 names eleven of them.

## 5. What the round refused to write, and what the atlas needs

### 5a. The edges it refused

Three refusals are worth naming, because in each case an edge was available and
was not written.

1. **The Charter of the United Nations as a universal precondition.** Every
   multilateral instrument M44a imported can be joined to the Charter on the
   ground that the United Nations convened the conference that adopted it. That
   is true of a dozen records and argues about none of them, and it is exactly
   the "precondition-of from every twentieth-century war to the Cold War" the
   brief names. Three records — the Vienna convention on diplomatic relations,
   the Vienna convention on the law of treaties and the Outer Space treaty —
   were retracted rather than given it. The Charter edge **was** written twice,
   to the genocide convention and, as a war edge, to the refugee convention,
   and in both cases the explanation says what makes it an argument there.

2. **Goa and the Sino-Indian war.** The claim that Nehru's success at Goa in
   December 1961 emboldened the forward policy that produced the defeat of
   October 1962 would have joined the whole subcontinent to this atlas through
   a Portuguese event. It is contested, and no source in `data/sources/` carries
   it. Three records — `kashmir-conflict`, `sino-indian-war`, `kargil-war` —
   were retracted rather than wired on a claim this run had not read.

3. **The Greek civil war and Korea.** Containment was formulated for Greece in
   March 1947 and is what the United States acted on in Korea in June 1950, but
   the honest object in between is the Truman doctrine and NSC-68, which are not
   records here, and a `precondition-of` from the Greek civil war to the Korean
   war would say that without Greece there is no Korean war, which is false. The
   Korean war stays at three hops and the edge was not written.

### 5b. The Portuguese records the atlas needs, in the order the round missed them

Each of these is one record, each is Portuguese, and each would bring at least
one retracted or stranded record inside the bar. This is the owner's list §4c
asks for, and it is what §4 above says the next round should be made of.

1. **Portugal's Biafra policy and the São Tomé airlift, 1967–1970.** Would wire
   `nigerian-civil-war`, retracted class A, and is the single clearest case in
   the round.
2. **The Treaty of Lisbon, 13 December 2007.** Signed in Lisbon under the
   Portuguese presidency and the direct replacement for the constitutional
   treaty. Would wire `treaty-establishing-a-constitution-for-europe`,
   retracted class B, and would give the whole post-Nice European sequence a
   Portuguese end.
3. **The Portuguese presidency of the Community, January–June 1992, and the
   Cutileiro plan for Bosnia.** Would wire the four Yugoslav records retracted
   class A, and is the Portuguese end the whole Balkan 1990s wants.
4. **Portugal's ratification of the Istanbul convention, February 2013** — among
   the first in Europe. Would wire `convention-on-preventing-and-combating-violence-against-women-and-domestic-violence`.
5. **Portugal in NATO after the cold war** — any record of a deployment, IFOR,
   SFOR, KFOR or Afghanistan. Would give the alliance a Portuguese end after
   1949, which is where it currently stops, and would reach `kosovo-war`.
6. **The nationalisation of electricity, 1975.** The better of the two records
   M41b said `energias-de-portugal` needed; this round wrote the other one.
7. **The banking law that reopened Portuguese banking to private capital, 1983
   or 1984**, with its instrument named from the *Diário da República*. Would
   reinstate `banco-comercial-portugues` and `portuguese-investment-bank`.
8. **The privatisation of Portugal Telecom, 1995–2000**, and **the sale of PT
   Portugal to Altice, 2015**. Would reinstate `altice-portugal`, and with a
   record of the cable and mobile market of the 1990s would reach `nos`.
9. **The motorway programme of the 1980s and 1990s and the concession of
   Brisa.** Would reinstate `brisa-auto-estradas-de-portugal`. M41b already
   said this one would make a good record.
10. **The pulp and paper industry after 1975**, or the privatisation of
    Portucel. Would reinstate `semapa`, `altri` and `the-navigator-company`,
    three records of one industry that have been waiting for an event since
    M41b.
11. **Portuguese Mozambique and Portuguese Guinea before 1960** — the chartered
    companies, the Barue rising of 1902, the campaigns of pacification. Would
    reach `majimaji-war`, retracted class A, and would give Portuguese Africa a
    history before its wars.

### 5c. Gaps in the corpus this round saw and did not touch

Every edge written in M44b has as one endpoint either a record M44a imported or
one of the three records this round drafted. That discipline is the run's own
and it is why the number in section 4 means something: a world event that stops
being stranded here stops because a new record was wired next to it, not because
the run went round the old corpus filling in edges it could have written at any
time. Three such edges were seen and deliberately not written, and they are the
owner's to take:

- `world-war-i --caused--> february-revolution`. The February revolution stands
  at three hops from a Portuguese event although its cause is a record this
  atlas counts as Portuguese. One edge would put it at one.
- `world-war-ii --enabled--> the-holocaust`. The Holocaust stands at three hops
  after the edge this round wrote from it to the genocide convention. One edge
  would put it at two.
- `molotov-ribbentrop-pact --enabled--> katyn-massacre`. Katyn has no active
  edge at all and the pact is two hops out.

### 5d. Two records that need fixing before anybody signs them

- `croatian-war-of-independence`, retracted, carries a start of 12 November
  1995 and an end of 7 August 1995 — the Erdut agreement and the close of
  Operation Storm — for a war its own cached lead dates 1991 to 1995. Whoever
  un-retracts it must fix the dates first.
- `convencao-das-nacoes-unidas-relativa-ao-estatuto-dos-refugiados`, kept, has a
  Portuguese title and a Portuguese id because the import took the item's
  Portuguese label. `CLAUDE.md` says everything is in English. It was not
  renamed here, because renaming a record is not a wiring round's business and
  the corpus already holds at least one other record in the same position
  (`eleicoes-legislativas-regionais-na-madeira-em-1976`). It wants a small run
  of its own.

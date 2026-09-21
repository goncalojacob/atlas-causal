# M42 — every edge, and the sentence that argues it

`docs/m42-brief.md` §4: the connection pass is not one edge per record, it is
reading what arrived and writing the joins that matter, and **every edge
carries the sentence that argues it, one row each**. Amendment A5 adds the
number that says whether the writing worked: the largest connected component
of the causal graph, before and after each batch, which is in
`docs/m42-pool.md` §3.

## 1. The rule, frozen before an edge was written

**The bar** (brief §1): a record earns its place by carrying at least one
honest edge to anything already in the atlas. **Nothing is written in order to
keep a record.** A record that cannot earn an edge is retracted, or — where a
batch still to come will supply its neighbour — left retracted and listed in
§5 with what it is waiting for.

**The sourcing** is the owner's decision of 16 September, as M72 made it
concrete: Wikipedia and Wikidata, confidence `probable`, and `consensus` only
through a work Wikipedia itself cites for the very sentence stating the link.
Rule 9 counts the English and Portuguese editions as one author, correctly, so
**no edge written here is `consensus`** and none pretends to be. Every citation
written by this milestone carries a locator — the article, the revision it was
read at, and the section the sentence sits under — which is the standard M72
set and the only kind of page reference this run can honestly produce.

**The explanations** are paraphrase under that constraint. Every sentence in an
explanation below is a restatement of something the cited article says at the
cited revision; where an explanation says what the claim is *not*, that too is
read off the article. Nothing is supplied from the assistant's own knowledge of
the period, which is what `CLAUDE.md` forbids and what an edge explanation
would be worst place to break.

## 2. Batch 0 — the fifteen the new bar puts back

No import. These are records M44b withdrew for failing the Portuguese two-hop
rule, and each reason had already named the edge it was refusing. Eighteen
edges, seventeen of them with one end on a reinstated record and one —
`1948-arab-israeli-war --precondition-of--> lebanese-civil-war` — between two
records that were both already here, written because without it the Lebanese
pair stays a component of its own and A5's number does not move.

| edge | type | the argument, and where it is read |
| --- | --- | --- |
| `1948-arab-israeli-war` → `lebanese-civil-war` | precondition-of | The refugee population the war of 1948 displaced into Lebanon numbered more than 300,000 by 1975, and the PLO had made of the south an unofficial state within a state that "then played an important role in the Lebanese Civil War". *1982 Lebanon War, § PLO's objectives; Lebanese Civil War, § Background.* |
| `lebanese-civil-war` → `1982-lebanon-war` | enabled | Israel was arming Lebanese Christian militias against the PLO from 1976, with Bashir Gemayel's Phalange as its main partner; the 1982 war aims — destroy the PLO in Lebanon, install a pro-Israel Maronite government under Gemayel — are aims only the civil war made available. The article gives the attempt on Shlomo Argov as the casus belli, which is why this is enabling and not cause. *1982 Lebanon War, § PLO's objectives; Lebanese Civil War, § 1982 Israeli invasion.* |
| `1982-lebanon-war` → `2006-lebanon-war` | enabled | The occupation that followed 1982 "saw the emergence of Hezbollah", which waged a guerrilla war against it until the Israeli withdrawal of 2000; the 2006 war was fought between Hezbollah and Israel. *1982 Lebanon War, lead; Lebanese Civil War, § Shia Muslims.* |
| `winter-war` → `continuation-war` | caused | Several reasons have been proposed for the Finnish decision of June 1941 and regaining the territory lost in the Winter War is "regarded as the most common"; by September 1941 Finland had regained its post-Winter-War concessions in Karelia. `probable`, because the article itself says the reasons are several. *Continuation War, lead and § Winter War.* |
| `continuation-war` → `lapland-war` | caused | The September 1944 ceasefire obliged Finland to break with Germany and demand the withdrawal of all German troops by 15 September, with any remaining after the deadline to be expelled or disarmed. *Lapland War, § Prelude and lead.* |
| `greco-turkish-war-of-1897` → `first-balkan-war` | precondition-of | Greek awareness of the country's unpreparedness "laid the seeds for the Goudi coup of 1909", and Venizelos's reforms transformed the state, "leading it to victory in the Balkan Wars of 1912-1913". The claim is about the army Greece fought with, not about why the war began. *Greco-Turkish War (1897), § Aftermath.* |
| `kashmir-conflict` → `indo-pakistani-war-of-1965` | caused | In 1965 Pakistan attempted to infiltrate Indian-administered Kashmir to precipitate an insurgency, "resulting in another war"; the war's own article calls the Kashmir conflict the predominant issue dividing the two states. *Kashmir conflict, lead; India–Pakistan war of 1965, § Background.* |
| `kashmir-conflict` → `kargil-war` | caused | The conflict's article lists Kargil among its wars; the war's article says it was triggered by Pakistani troops infiltrating positions on the Indian side of the Line of Control in the disputed region. *Kashmir conflict, lead; Kargil War, lead.* |
| `sino-indian-war` → `indo-pakistani-war-of-1965` | enabled | Pakistan under Ayub Khan "believed the Indian Army would be unable to defend itself… as the Indian military had suffered a loss to China in 1962". The claim is about a belief the article attributes to the Pakistani leadership, hence `enabled` and `probable`. *India–Pakistan war of 1965, § Background.* |
| `russian-civil-war` → `kronstadt-rebellion` | caused | Mass disillusionment "induced by the years of war and exacerbated by the Bolshevik policy of war communism": grain requisitioning, bread rations cut by a third in January 1921, 155 peasant risings reported in February. The article calls Kronstadt the last major revolt against Bolshevik rule during the civil war. *Kronstadt rebellion, § Background.* |
| `treaty-of-lausanne` → `montreux-convention` | precondition-of | Lausanne demilitarised the Dardanelles in 1923 under an International Straits Commission; Turkey's note of April 1935 went to the signatories of Lausanne; and Montreux's own preamble says it replaces Lausanne's terms on the Straits. *Montreux Convention, § Background.* |
| `philippine-revolution` → `philippine-american-war` | precondition-of | Philippine nationalists "had proclaimed independence in June 1898 and constituted the First Philippine Republic in January 1899", neither recognised by the United States, tensions escalating to Manila on 4 February. The republic the Americans refused is what the revolution made. *Philippine–American War, lead; Philippine Revolution, lead.* |
| `spanish-american-war-1898` → `treaty-of-paris-1898` | caused | The treaty "marked the official end of the Spanish–American War" and is where Spain relinquished Cuba, Puerto Rico, Guam and the Philippines. *Treaty of Paris (1898), lead.* |
| `treaty-of-paris-1898` → `philippine-american-war` | caused | The war "emerged in early 1899 following the United States' annexation of the former Spanish colony of the Philippine Islands under the terms of the December 1898 Treaty of Paris". *Philippine–American War, lead.* |
| `the-holocaust` → `porajmos` | enabled | The supplementary decree to the Nuremberg Laws of 26 November 1935 classified Roma as "enemies of the race-based state", "thereby placing them in the same category as the Jews". The claim is that the law and apparatus were extended, not that one genocide caused the other: the article dates the persecution of Roma from 1933. *Romani Holocaust, lead.* |
| `the-holocaust` → `warsaw-ghetto-uprising` | reacted-to | The rising opposed "Nazi Germany's final effort to transport the remaining ghetto population to the gas chambers", and followed the Grossaktion Warsaw of 1942 in which more than a quarter of a million were deported to Treblinka. *Warsaw Ghetto Uprising, lead.* |
| `genocide-convention` → `rome-statute-of-the-international-criminal-court` | precondition-of | Resolution 260 of 1948 "was the first step toward the establishment of an international permanent criminal tribunal"; the convention's own article says its definition of genocide has been adopted by the International Criminal Court. *Rome Statute, § Background; Genocide Convention, lead.* |
| `rose-revolution` → `orange-revolution` | inspired | The Orange Revolution "is said to have been partly inspired by the Georgian Rose Revolution"; the contemporary version is an editorial of February 2004 on building on the Georgian success. `inspired` because example is the whole of the claim. *Rose Revolution, § International effects; Orange Revolution, § U.S. involvement in the revolution.* |

### What batch 0 did to the graph

Active events 310 → 325; active edges 362 → 380; **largest connected component
254 → 268**; components 34 → 32; active events with no edge 23 → 22.

Three of those are worth naming, because they are what A5 is asking for and
not merely more records:

- **`philippine-american-war` had no edge at all.** It was one of the
  twenty-three isolates. Two of batch 0's edges run into it and it is now in
  the main component, along with the revolution and the treaty that were
  retracted beside it.
- **`lebanese-civil-war` and `2006-lebanon-war` were a component of two.**
  With the 1982 war between them and the 1948 edge above them, all four are in
  the main component.
- **Everything else in the batch attached directly to the main component** —
  through `winter-war`, `russian-civil-war`, `the-holocaust`,
  `treaty-of-lausanne`, `first-balkan-war`, `genocide-convention` and
  `spanish-american-war-1898`, all of which were already in it.

Two did not, and saying so is the point of the measure:
**`rose-revolution`** joined the Ukrainian and Caucasian cluster of seven,
making it eight and no less separate; and **`kashmir-conflict`**,
**`kargil-war`** and **`sino-indian-war`** joined
`indo-pakistani-war-of-1965` and `bangladesh-liberation-war`, making a South
Asian component of five out of a pair. Neither is stranded by accident: the
record that joins the first to the atlas is the dissolution of the Soviet
Union and the record that joins the second is the partition of India, and both
are in the import pool.

## 2b. Batch 1 — the seven earlier tombstones the new bar reaches

Batch 0 read the fifty M44b withdrew. **The bar of §1 is not about M44b**, and
the corpus holds 229 tombstones, so the same question was asked of the rest.
Two hundred of them are M21's and M22's routine Portuguese elections, bank
robberies and local disasters, correctly withdrawn and not a vein. The vein is
**M40b's twenty-eight world events** — the Cultural Revolution, the Mexican
revolution, the Falklands, the Holodomor, Srebrenica, the Velvet revolution,
the non-proliferation treaty — every one of them a real record with a full
summary, withdrawn on 7 September because nothing here could be honestly
wired to it.

**Seven of those blockers have since stopped being true.** M40b named, for
each record, the record it was waiting for; four of those have been written by
milestones since, and one — the line from the Ilinden rising to the Young Turk
revolution — was blocked only because the atlas had cached article *leads* and
not article *bodies*, and this run can open the article at a revision and cite
the sentence. The other twenty-one stay retracted and §5b says what each still
waits for.

Seven edges. Six run into the main component; the seventh joins
`soviet-afghan-war`, which had no edge at all.

#### `treaty-of-lisbon`

Reinstated on `treaty-establishing-a-constitution-for-europe --caused--> treaty-of-lisbon`. M22 withdrew it for having no lane, on the ground that a treaty signed in Lisbon belongs to the history of what it settles rather than to Portugal. That reasoning is right and it is why the record is not filed as Portuguese; it is not a reason to have no record of the treaty at all once the atlas is a world atlas. It carries `region: europe`, as `maastricht-treaty`, `amsterdam-treaty` and `treaty-of-nice` already do.

Its retraction read, verbatim:

> Retracted in M22: the treaty signed by the twenty-seven member states at the Jerónimos on 13 December 2007, in force from 1 December 2009, which amended the Union's two founding treaties. It is an act of the Union rather than of Portugal, and the atlas has no lane for one; keeping it would mean inventing Portugal's particular part in it. The venue is not a causal fact: a treaty signed in Lisbon belongs to the history of what it settles.

#### `treaty-establishing-a-constitution-for-europe`

Reinstated on `treaty-of-nice --precondition-of--> treaty-establishing-a-constitution-for-europe` and `treaty-establishing-a-constitution-for-europe --caused--> treaty-of-lisbon`. M44b called this “the retraction the owner will most want to undo” and said one record would bring it inside the bar: the treaty of Lisbon. That record was here the whole time, retracted by M22 four milestones earlier, and the two come back together.

Its retraction read, verbatim:

> Retracted in M44b, class B, and it is the retraction the owner will most want to undo. The constitutional treaty argues from Nice, which this round wired at two hops, and forward to the treaty of Lisbon of 2007 — signed in Lisbon, under the Portuguese presidency, and the direct replacement for the text the French and Dutch referendums killed. The Lisbon treaty is the Portuguese end this record needs and it is not in this atlas. One record would bring the constitutional treaty inside the bar and it is a Portuguese one; it is named in docs/m44-connections.md.

#### `falklands-war`

Reinstated on `1976-argentine-coup-d-etat --precondition-of--> falklands-war`. The blocker the reason names — “none of the Argentine dictatorship” — stopped being true when `1976-argentine-coup-d-etat` was written.

Its retraction read, verbatim:

> Retracted in M40b: ten weeks in the South Atlantic in 1982 between Argentina and the United Kingdom. The atlas holds no record anywhere in South America outside Brazil, and none of the Argentine dictatorship, so the war's largest consequence — the collapse of the junta and the return to civilian rule in 1983 — is not a record here. There is no Portuguese link at all. It would need the Argentine transition as a record before it had an honest edge.

#### `lateran-treaty`

Reinstated on `march-on-rome --precondition-of--> lateran-treaty`. The blocker the reason names — “nor any other Italian or papal event before 2023” — stopped being true when `march-on-rome` was written. The Concordat of 1940 the reason asks for is still missing and is still the Portuguese edge this record wants.

Its retraction read, verbatim:

> Retracted in M40b: the settlement of the Roman question between Mussolini's Italy and the Holy See in February 1929. The link that would matter is the Portuguese one — the Concordat and Missionary Accord of 1940, negotiated in the same spirit — and the atlas holds no record of either, nor any other Italian or papal event before 2023. Wiring it would mean inventing a link across seventy years. It needs the Concordat of 1940 as a record first.

#### `anti-comintern-pact`

Reinstated on `anti-comintern-pact --precondition-of--> tripartite-pact`. The blocker the reason names — “no Pact of Steel, no Tripartite Pact” — stopped being true when `tripartite-pact` was written.

Its retraction read, verbatim:

> Retracted in M40b: the German-Japanese agreement of November 1936 against the Communist International, joined by Italy in 1937 and by Spain and Hungary in 1939. The atlas holds no record of the formation of the Axis — no Pact of Steel, no Tripartite Pact — and Portugal never adhered. Its clearest documented consequence, the fall of the Hiranuma cabinet in Tokyo when Berlin signed with Moscow in August 1939, is also not a record here, and an edge to it would in any case run backwards.

#### `ilinden-preobrazhenie-uprising`

Reinstated on `ilinden-preobrazhenie-uprising --precondition-of--> young-turk-revolution-of-1908`. The reason says the line from the rising to the Committee of Union and Progress “is real, but nothing this atlas holds argues it: the cached leads say only what the rising was”. The cached lead is not the article: the English article on the revolution of 1908 states the link in one sentence, under § Situation in Ottoman Macedonia, and this run could open it at a revision and cite it. That is the only thing that changed, and it is worth naming — several of the refusals in this file and in `docs/m40-retractions.md` were refusals to assert what a source says on a page nobody had read.

Its retraction read, verbatim:

> Retracted in M40b: the rising of the Internal Macedonian-Adrianople Revolutionary Organization against Ottoman rule, August to October 1903. The line historians draw from it to the Committee of Union and Progress is real, but nothing this atlas holds argues it: the cached leads say only what the rising was. It would need a work on the late Ottoman Balkans in the bibliography before the edge to 1908 could be written rather than assumed.

#### `war-in-afghanistan-2001-2021`

Reinstated on `soviet-afghan-war --precondition-of--> war-in-afghanistan-2001-2021`. The cause the reason asks for, 11 September 2001, is still not a record and no edge pretends otherwise. What is written instead is the precondition the article itself states, and its value is that `soviet-afghan-war` had no edge at all: it was one of the twenty-two isolates.

Its retraction read, verbatim:

> Retracted in M40b: twenty years of war from October 2001 to the Taliban's return in August 2021. Its cause is the attacks of 11 September 2001, which is not a record here — the War on Terrorism as a series was among the twenty-nine candidates the import refused for want of a lane — and its consequences in this dataset are none. Portugal sent forces under ISAF for most of the war and the atlas holds no record of that either. It would need 11 September first.

## 3. The main count, and why it moved up

Amendment A3: an import that leaves the main count higher than it found it has
to say why. Batch 0 leaves it at **237 against 229** and batch 1 at **244**,
fifteen higher than the milestone found it.

Seven of the fifteen were filed under a parent as they came back, under M62's
rule of inside the span *and* inside the subject: `continuation-war`,
`lapland-war` and `warsaw-ghetto-uprising` under `world-war-ii`;
`kronstadt-rebellion` under `russian-civil-war`; `1982-lebanon-war` under
`lebanese-civil-war`, which the article files it under as the third phase;
`kargil-war` under `kashmir-conflict`; and `treaty-of-paris-1898` under
`spanish-american-war-1898`, which is the filing `treaty-of-portsmouth` under
`russo-japanese-war` already set in this atlas.

The eight that stayed top-level are wars, treaties and a genocide that nothing
here contains: `greco-turkish-war-of-1897`, `kashmir-conflict` (itself an
umbrella, and the parent of one of the others), `montreux-convention`,
`philippine-revolution`, `porajmos`, `rome-statute-of-the-international-criminal-court`,
`rose-revolution`, `sino-indian-war`. `porajmos` is the one that was arguable
and is listed rather than filed, as M62 §3 requires: its article dates the
persecution of Roma from 1933, alongside the Jewish persecution rather than
inside it, so filing it under `the-holocaust` would assert with a display fact
something the source declines to assert.

**None of batch 1's seven took a parent**, and the reason is the same one in
every case: nothing in this corpus contains them. A treaty of the European
Union is part of no event here — `maastricht-treaty`, `amsterdam-treaty` and
`treaty-of-nice` are all top-level themselves, and the process they belong to
has no record and no sourced span, which is what M62 §2 says an umbrella needs.
The Falklands war is not part of the coup that preceded it; the Lateran treaty
is not part of the March on Rome; the Anti-Comintern pact is not part of the
Tripartite pact. The one that could take a parent is the war in Afghanistan of
2001, which its own article calls part of "the ongoing Afghan conflict" — and
that conflict is not a record here, so filing it would mean writing an umbrella
this run has no span for. It is listed rather than filed, as M62 §3 requires.

**So the main count rises with the corpus in these two batches, and A3's
warning is about an import.** The batch that imports is where filing as you go
has something to file into, and the umbrellas the world corpus wants — the
Cold War, the Yugoslav wars, the Arab Spring, the Afghan conflict — are
records in the pool rather than inventions. What would be wrong is to file
these seven under an umbrella made up to hold them.

## 4. What these batches refused to write

- **`budapest-memorandum`.** Its article says Russia violated the memorandum
  in 2014 and 2022. That is a relation between a treaty and a war, and it is
  not one of the five edge types; the honest edge is from the dissolution of
  the Soviet Union, which is not a record yet. Left retracted rather than given
  an edge of the wrong shape.
- **`treaty-establishing-a-constitution-for-europe`, in batch 0.** The Nice
  article does not connect the two and the constitutional treaty's own article
  traces its drafting to the Laeken European Council, so batch 0 left it
  retracted rather than write an edge it could not read. Batch 1 found the
  sentence in the *Lisbon* treaty's article instead, together with the record
  `docs/m44-connections.md` §5b said the atlas needed, which had been a
  tombstone here since M22. Both are active now; the refusal was right at the
  time and is recorded rather than quietly reversed.
- **`1994-genocide-against-tutsi` to the Rome statute.** The statute's article
  says the UN created the tribunals for Yugoslavia and Rwanda "meanwhile", on
  statutes quite similar to the Rome Statute's. That is a resemblance between
  instruments, not a claim that the genocide produced the court, and the
  tribunal that would carry the argument is not a record here — which is what
  M44b said when it refused the same edge from the other end.
- **The Goa claim, again.** M44b refused to write that Nehru's success in Goa
  emboldened the forward policy on the Chinese border, for want of a source
  this atlas holds. That refusal stands. The edge written for
  `sino-indian-war` runs the other way and is the one the article on the war of
  1965 makes.
- **An edge from `charter-of-the-united-nations`** to the Rome Statute, the
  outer space treaty or either Vienna convention. M44b's class C is right: an
  edge true of a dozen records argues nothing about any of them.

## 5a. The thirty-four of the fifty still retracted, and what each waits for

Not a verdict. A tombstone citing the retired rule is a lie about why the
record is not here (brief §2), so each of these is rewritten when the milestone
decides it — which for most of them is the batch that imports the neighbour
named below.

| record | what would bring it back |
| --- | --- |
| `1991-soviet-coup-d-etat-attempt`, `1993-russian-constitutional-crisis`, `budapest-memorandum`, `romanian-revolution-1989` | the dissolution of the Soviet Union, and the revolutions of 1989 |
| `yugoslav-wars`, `croatian-war-of-independence`, `dayton-agreement`, `kosovo-war` | the breakup of Yugoslavia and the Bosnian war |
| `rwandan-civil-war`, `arusha-accords`, `second-congo-war` | the Rwandan genocide, which reaches `genocide-convention`, and the Angolan civil war, which reaches `angola-independence-1975` |
| `2013-egyptian-coup-d-etat` | the Egyptian revolution of 2011, or the Arab Spring |
| `gaza-war-2008-2009` | the second intifada, or the disengagement of 2005 |
| `good-friday-agreement` | the Anglo-Irish treaty and the Troubles, which its reason already named |
| `first-italo-ethiopian-war`, `majimaji-war` | the partition of Africa — the Berlin conference — or the second Italo-Ethiopian war |
| `war-in-darfur`, `south-sudanese-civil-war` | the independence of South Sudan |
| `chaco-war`, `somali-civil-war`, `sri-lankan-civil-war`, `2006-thai-coup-d-etat`, `2021-myanmar-coup-d-etat`, `2023-nigerien-coup-d-etat` | a neighbour in a region this atlas does not reach at all |
| `nigerian-civil-war`, `convention-on-preventing-and-combating-violence-against-women-and-domestic-violence`, `western-african-ebola-virus-epidemic`, `european-charter-for-regional-or-minority-languages` | a Portuguese record that does not exist; the four of `docs/m44-connections.md` §5b |
| `1948-palestine-war`, `balkan-wars` | nothing: each is a second record of a war the atlas already holds under another id, and redundancy is not a reach failure |
| `outer-space-treaty`, `vienna-convention-on-diplomatic-relations`, `vienna-convention-on-the-law-of-treaties` | nothing available: M44b's class C, an edge that argues nothing, and the new bar does not lower that |
| `population-transfer-in-the-soviet-union` | nothing: withdrawn as a topic spanning twenty-two years rather than an event, which the new bar does not touch |

## 5b. M40b's twenty-one, and what each waits for

The other twenty-one of M40b's twenty-eight, with the record its own reason
names. Nothing here is a verdict either: each is reread when the batch that
imports its neighbour lands, and its reason is rewritten then.

| record | what would bring it back |
| --- | --- |
| `velvet-revolution`, `second-chechen-war`, `second-nagorno-karabakh-war`, `hungarian-revolution-of-1956` | the revolutions of 1989 and the dissolution of the Soviet Union |
| `srebrenica-massacre` | the Bosnian war |
| `1994-genocide-against-tutsi` | the Rwandan civil war, or the tribunal at Arusha |
| `syrian-civil-war`, `libyan-civil-war` | the Arab Spring, which the import refused for want of a lane |
| `sudanese-civil-war` | Darfur, or the Sudanese revolution of 2019 |
| `cultural-revolution` | the 1-2-3 incident of 1966–67 in Macau, which is the precise link its reason names |
| `2016-turkish-coup-d-etat-attempt` | the Turkish coups of 1960, 1971 and 1980 |
| `holodomor` | collectivisation and the grain procurement quotas |
| `mexican-revolution`, `anglo-zanzibar-war`, `january-6-united-states-capitol-attack`, `assassination-of-john-f-kennedy` | a neighbour in a place or a politics this atlas does not reach at all |
| `treaty-on-the-non-proliferation-of-nuclear-weapons`, `paris-agreement`, `ramsar-convention`, `convention-on-the-elimination-of-all-forms-of-discrimination-against-women`, `convention-on-the-rights-of-the-child`, `united-nations-convention-on-the-law-of-the-sea` | an event the instrument decided, which for each of these would be a national one this atlas does not hold |
| `russian-revolution` | nothing: the atlas holds February, October and the civil war as three records with edges of their own, and a fourth node over all three would double every path through them without adding an argument. Redundancy, not reach, and the new bar does not touch it |

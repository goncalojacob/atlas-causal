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

## 3. The main count, and why it moved up

Amendment A3: an import that leaves the main count higher than it found it has
to say why. Batch 0 leaves it at **237 against 229**, eight higher.

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

## 4. What batch 0 refused to write

- **`budapest-memorandum`.** Its article says Russia violated the memorandum
  in 2014 and 2022. That is a relation between a treaty and a war, and it is
  not one of the five edge types; the honest edge is from the dissolution of
  the Soviet Union, which is not a record yet. Left retracted rather than given
  an edge of the wrong shape.
- **`treaty-establishing-a-constitution-for-europe`.** The Nice article does
  not connect the two, and the constitutional treaty's own article traces its
  drafting to the Laeken European Council of December 2001, not to Nice. What
  it needs is the Treaty of Lisbon of 2007, which the atlas does not hold and
  which `docs/m44-connections.md` §5b already named as the second thing this
  atlas needs.
- **The Goa claim, again.** M44b refused to write that Nehru's success in Goa
  emboldened the forward policy on the Chinese border, for want of a source
  this atlas holds. That refusal stands. The edge written for
  `sino-indian-war` runs the other way and is the one the article on the war of
  1965 makes.
- **An edge from `charter-of-the-united-nations`** to the Rome Statute, the
  outer space treaty or either Vienna convention. M44b's class C is right: an
  edge true of a dozen records argues nothing about any of them.

## 5. The thirty-five still retracted, and what each waits for

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
| `treaty-establishing-a-constitution-for-europe` | the Treaty of Lisbon of 2007 |
| `first-italo-ethiopian-war`, `majimaji-war` | the partition of Africa — the Berlin conference — or the second Italo-Ethiopian war |
| `war-in-darfur`, `south-sudanese-civil-war` | the independence of South Sudan |
| `chaco-war`, `somali-civil-war`, `sri-lankan-civil-war`, `2006-thai-coup-d-etat`, `2021-myanmar-coup-d-etat`, `2023-nigerien-coup-d-etat` | a neighbour in a region this atlas does not reach at all |
| `nigerian-civil-war`, `convention-on-preventing-and-combating-violence-against-women-and-domestic-violence`, `western-african-ebola-virus-epidemic`, `european-charter-for-regional-or-minority-languages` | a Portuguese record that does not exist; the four of `docs/m44-connections.md` §5b |
| `1948-palestine-war`, `balkan-wars` | nothing: each is a second record of a war the atlas already holds under another id, and redundancy is not a reach failure |
| `outer-space-treaty`, `vienna-convention-on-diplomatic-relations`, `vienna-convention-on-the-law-of-treaties` | nothing available: M44b's class C, an edge that argues nothing, and the new bar does not lower that |
| `population-transfer-in-the-soviet-union` | nothing: withdrawn as a topic spanning twenty-two years rather than an event, which the new bar does not touch |

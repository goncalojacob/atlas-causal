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
| `the-persecution-of-the-jews-1933-1941` → `porajmos` | enabled | The supplementary decree to the Nuremberg Laws of 26 November 1935 classified Roma as "enemies of the race-based state", "thereby placing them in the same category as the Jews". The claim is that the law and apparatus were extended, not that one genocide caused the other: the article dates the persecution of Roma from 1933. *Romani Holocaust, lead.* **A14(6), 24 September: `the-holocaust` was divided at 1941 and this edge went to the persecution record, because it argues from the Nuremberg Laws of 1935 and rule 4 refuses it from a record starting in 1941.** |
| `the-extermination-of-the-jews-1941-1945` → `warsaw-ghetto-uprising` | reacted-to | The rising opposed "Nazi Germany's final effort to transport the remaining ghetto population to the gas chambers", and followed the Grossaktion Warsaw of 1942 in which more than a quarter of a million were deported to Treblinka. *Warsaw Ghetto Uprising, lead.* **A14(6), 24 September: `the-holocaust` was divided at 1941 and this edge went to the extermination record, which inherits it.** |
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

## 2c. Batch 3 — the connection pass, which imports nothing

Amendment A5: *volume must connect, not only file*, and the number it asks for
is the largest connected component. Batches 0 and 1 moved it by putting
records back. **This batch writes no record at all.** It reads the graph
instead: at its head the atlas drew 332 active events as **thirty-two
components** — one of 274 and thirty-one fragments beside it, twenty-one of
them events carrying no edge whatsoever — and asks of each fragment the
question §1 asks of a reinstatement. Is there a sentence, in an article this
atlas can open at a revision, that argues a line from this fragment to
something already in the corpus?

Nineteen times there was. Every end of every edge below is a record this
atlas already held, which is the practice deviation 979 opened and this batch
is made of: M44's discipline was that every edge have one end on a new
record, and that discipline is exactly what left forty-five events stranded.
A fragment is not made honest by an import; it is made honest by a source.

**What this batch does not touch.** No record was created, none was
reinstated, none was filed, and no `parent` was written — so the main count
cannot move, and §3 says so. Nine fragments are left standing and §4b says
what each waits for.

#### `first-sino-japanese-war --precondition-of--> russo-japanese-war`

The English article on the Russo-Japanese war, at revision 1375146144, opens
its own account with that war: at its end the Treaty of Shimonoseki of 1895
had ceded the Liaodong Peninsula and Port Arthur to Japan before the Triple
Intervention, in which Russia, Germany and France forced Japan to relinquish
the claim; Japan then feared Russia would impede its plans in mainland Asia
as Russia built the Trans-Siberian Railroad, made inroads in Korea and took
a lease of Liaodong and Port Arthur in 1898. `first-sino-japanese-war` had no
edge at all before this.

#### `russo-japanese-war --caused--> russian-revolution-of-1905`

The same article and revision: Russia's substantial casualties and losses for
a cause that ended in a humiliating defeat *contributed to* internal unrest
culminating in the 1905 Russian Revolution, during which the autocracy was
forced to make concessions. The article's own hedge is why this is `probable`.
This is the edge that joins the pair to the main component.

#### `first-sino-japanese-war --precondition-of--> boxer-rebellion`

The English article on the Boxer rebellion, at revision 1375554581, begins its
causes there: following the First Sino-Japanese war, villagers in North China
feared the expansion of foreign spheres of influence and resented Christian
missionaries who ignored local customs and used their power to protect their
followers in court. It carries `boxer-rebellion` and `xinhai-revolution`,
until now a component of two, in with it.

#### `treaty-of-brest-litovsk --precondition-of--> polish-soviet-war`

The English article on the Polish–Soviet war, at revision 1370704570: after
the collapse of the Central Powers and the Armistice of 11 November 1918,
Lenin's Soviet Russia annulled the Treaty of Brest-Litovsk and moved forces
westward to reclaim the Ober Ost regions the Germans had abandoned, Lenin
viewing the newly independent Poland as a critical route for spreading
revolution into Europe. `polish-soviet-war` is filed under `russian-civil-war`
already; a filing is not an argument, and this is the argument.

#### `iranian-revolution --caused--> iran-iraq-war`

The English article on the war, at revision 1375407163: in starting it the
Iraqi government under Saddam Hussein primarily wanted to prevent Khomeini,
Iran's leader following the 1979 revolution, from exporting Iran's new state
ideology to Iraq, and feared Iran would rally Iraq's Shia majority against the
Ba'athist government. The article names older border disputes beside it, which
is why the confidence is `probable`. `iran-iraq-war` had no edge at all.

#### `iran-iraq-war --precondition-of--> gulf-war`

The English article on the Gulf war, at revision 1375784270, § Background: by
the August 1988 ceasefire Iraq was heavily debt-ridden, most of it owed to
Saudi Arabia and Kuwait, fourteen billion dollars to Kuwait alone, and both
refused to forgive it; Kuwait was overproducing oil at least in part to repair
losses caused by Iranian attacks in the war, and the resulting price slump cost
Iraq seven billion dollars a year — what the Iraqi government called economic
warfare. It carries `gulf-war` and `iraq-war` in.

#### `coup-28-may-1926 --caused--> ditadura-nacional-1926-1933`

The English article on the Ditadura Nacional, at revision 1365513062, defines
the regime by the coup: it governed Portugal from the end of the First Republic
with the 28 May 1926 coup until the adoption of a new constitution in 1933.

#### `ditadura-nacional-1926-1933 --precondition-of--> estado-novo-1933-1974`

The English article on the Estado Novo, at revision 1375585347: it evolved from
the Ditadura Nacional formed after the coup of 28 May 1926 against the unstable
First Republic, and historians recognise the two together as the Second
Portuguese Republic. The article on the Ditadura Nacional says the same from
its own end.

#### `constitution-1933 --caused--> estado-novo-1933-1974`

The same two articles: the dictatorship lasted until the adoption of a new
constitution in 1933 *that ushered in* the Estado Novo, which the article on
the Estado Novo dates to its installation in that year.

#### `republic-proclaimed-1910 --caused--> first-portuguese-republic-1910-1926`

The English article on the First Republic, at revision 1370244290, bounds it by
the two events: it spans the sixteen years between the end of the constitutional
monarchy marked by the 5 October 1910 revolution and the 28 May 1926 coup.

#### `estado-novo-1933-1974 --precondition-of--> portuguese-colonial-war-1961-1974`

The English article on the colonial war, at revision 1372834694: unlike other
European nations during the 1950s and 1960s the Estado Novo did not withdraw
from its African territories, and the thirteen-year conflict from 1961 was
fought between Portugal's military and the nationalist movements that became
active there.

#### `portuguese-colonial-war-1961-1974 --precondition-of--> carnation-revolution-1974`

The English article on the revolution, at revision 1374066068: the coup of
25 April 1974 came in the midst of the colonial war, was organised by the
Armed Forces Movement of officers who opposed the regime, and resulted in an
end to that war; the article on the war says the Estado Novo was overthrown by
a military coup in 1974 and the change of government brought the conflict to an
end. Each article puts the other in its account and neither calls the war the
cause, which is why this is a precondition and `probable` — the strong claim,
that the war made the coup, is one a person should write from a historian and
not from an encyclopedia's framing.

#### `independence-of-brazil-1822 --caused--> empire-of-brazil-1822-1889`

The English article on the Empire, at revision 1374829984: on 7 September 1822
Pedro declared the independence of Brazil and, after a successful war against
his father's kingdom, was acclaimed on 12 October as Pedro I, first Emperor of
Brazil.

#### `empire-of-brazil-1822-1889 --precondition-of--> proclamation-of-the-brazilian-republic-1889`

The English article on the proclamation, at revision 1370705081: the coup of
15 November 1889 abolished the constitutional monarchy of the Empire of Brazil,
ended the reign of Pedro II and established the First Brazilian Republic.

#### `1964-brazilian-coup-detat --caused--> brazilian-military-dictatorship-1964-1985`

The English article on the dictatorship, at revision 1373177216: it was
established on 1 April 1964 after a coup by the Brazilian Armed Forces with
support from the United States government against President João Goulart, and
lasted twenty-one years, until 15 March 1985.

#### `marcelo-elected-president-2016 --precondition-of--> marcelo-reelected-2021`

The English article on the election of 2021, at revision 1371534929: the
incumbent, Marcelo Rebelo de Sousa, was re-elected for a second term by a
landslide of 60.7 per cent, winning every district and all 308 municipalities.
It carries a component of five in with it — `covid-19-pandemic`,
`covid-19-pandemic-in-europe`, `covid-state-of-emergency-2020` and
`world-youth-day-2023` beside `marcelo-reelected-2021`.

#### `2005-portuguese-legislative-election --precondition-of--> 2009-portuguese-legislative-election`

The English article on the election of 2009, at revision 1373358204: it came
after four years under a majority government of the Socialist Party, and the
Socialists under José Sócrates won the most votes and seats but failed to
repeat the overall majority obtained in 2005, losing eight per cent of the vote
and twenty-four seats. It carries in the component of five that holds
`1998-portuguese-abortion-referendum`, `2007-portuguese-abortion-referendum`,
`2001-portuguese-local-elections` and `2002-portuguese-legislative-election`.

#### `iranian-revolution --precondition-of--> twelve-day-war`

The English article on the war of June 2025, at revision 1375310571,
§ Background: Israel maintained a close relationship with the Pahlavi monarchy
until the Iranian Revolution, when the monarchy was ousted and replaced by an
anti-Western theocratic Islamic republic led by Khomeini, and ever since Iran's
government has repeatedly pledged to destroy Israel.

#### `1982-lebanon-war --precondition-of--> twelve-day-war`

The same section of the same revision dates the proxy conflict the war grew out
of: Israel has fought wars with Iranian proxies, including against Hezbollah,
since the 1982 Lebanon war. The two edges together carry `gaza-war`,
`gaza-genocide` and `twelve-day-war` in.

### What batch 3 did to the graph

| | before | after |
| --- | --: | --: |
| active events | 332 | 332 |
| main | 244 | 244 |
| filed under a parent | 88 | 88 |
| active edges | 387 | 406 |
| **largest connected component** | **274** | **301** |
| components | 32 | 17 |
| active events with no edge at all | 21 | 11 |
| active events that cannot reach a Portuguese event | 29 | 16 |

Nineteen edges, twenty-seven events joined. The corpus did not grow by a
single record and the picture the atlas draws at rest is the same 244 events
it drew before — which is A5 and A3 pulling in opposite directions, and A5
winning this batch on purpose.

## 4b. The nine fragments batch 3 left standing, and what each waits for

Named because a fragment nobody wrote down is a fragment the next run has to
find again.

- **The post-Soviet component of eight** — `russo-ukrainian-war`,
  `full-scale-russo-ukrainian-war`, `bucha-massacre`, `euromaidan`,
  `orange-revolution`, `rose-revolution`, `russo-georgian-war`,
  `wagner-group-rebellion` — waits on **the dissolution of the Soviet Union**,
  `Q5167679`, which batch 2a seeded and the queued walk brings. Every article
  read for it puts the dissolution at the head of the account, and nothing the
  atlas holds now stands in that place. It is the largest fragment and the
  clearest single thing the import is for.
- **The Indian subcontinent component of five** — `kashmir-conflict`,
  `kargil-war`, `indo-pakistani-war-of-1965`, `sino-indian-war`,
  `bangladesh-liberation-war` — waits on **the partition of India**, seeded in
  the same batch. `goa-annexed-1961` is in the corpus and in the main
  component, and was considered as an anchor; the article on the Sino-Indian
  war does not argue a line from it at the revision read, and an edge nobody's
  page argues is exactly what §1 forbids.
- **The Afghan pair** — `soviet-afghan-war`, `war-in-afghanistan-2001-2021` —
  waits on the September 11 attacks, which the atlas does not hold at all, or
  on the dissolution of the Soviet Union.
- **The Madeiran three** — `2023-madeiran-regional-election`,
  `2024-madeiran-regional-election`, `2025-madeiran-regional-election` — have
  `1976-madeira-regional-legislative-election` in the main component forty-seven
  years away, and nothing in between. Their own articles argue each from the
  one before it, which is the edge they already have.
- **The fires pair** — `october-fires-2017`, `pedrogao-grande-fires-2017` —
  waits on a record of the political consequence the articles name, which the
  atlas does not hold.
- `entente-cordiale`, `iberian-blackout-2025`,
  `1996-portuguese-presidential-election` and
  `2006-portuguese-presidential-election` stand alone. The last two are a
  chain of presidential elections the corpus holds only the ends of, and are
  the cheapest thing left for the next batch.

## 2d. Batch 4 — the thirteen hinges, walked here and not on the runner

**The Action cannot land an import, and two runs proved it.** Batch 2a seeded
twelve items and pushed `import/run-m42-2026-09-21`; run 30 of
`import-wikidata.yml` fetched them, created thirteen records — the twelve plus
the rewound `Q94916` — and then **threw the whole batch away**, because the
job runs the suite before it commits and two correspondence tests went red on
the records it had just written: `docs/m53-polities.md` §4.1 counts the active
events, and `docs/m67-umbrellas.md` is asked to say why each main event that
names nothing was left bare. A job cannot write a prose measurement, so every
import batch fails those two tests, restores `data/` and commits nothing. Run
29, the fresh `--candidates` sweep, died on a third of the same kind:
`CLAUDE.md`'s layout tree did not yet name `tools/m42-pool.mjs`, which the
commit *after* the one it ran on added. Deviation 987.

So the walk was run in this sandbox, **through the tool the brief names**,
`node tools/import/wikidata.mjs --import`: 13 items, 28 calls, 13 created, 0
enriched, 0 refused, and the twenty-six Wikipedia leads it cached are what the
edges below are argued from. Wikidata answers here now; deviation 731's
refusal at this sandbox's egress no longer holds (deviation 988).

**The thirteen, every one of them `origin.tool: wikidata`, `review.status:
draft`, `review.flags: ["imported-facts"]`, and every one naming no actor and
no place** — which M67's amendment A1 settles and `docs/m53-polities.md` §4.1
counts: `dissolution-of-the-soviet-union`, `revolutions-of-1989`,
`breakup-of-yugoslavia`, `war-in-bosnia-and-herzegovina`, `the-troubles`,
`anglo-irish-treaty`, `partition-of-india`, `second-intifada`,
`2011-egyptian-revolution`, `angolan-civil-war`,
`2011-south-sudanese-independence-referendum`, `berlin-conference`,
`second-italo-ethiopian-war`. None was given a line to make it filable, which
is the thing M67 forbids.

### The edges

#### `revolutions-of-1989 --caused--> dissolution-of-the-soviet-union`

The English article on the revolutions, at revision 1375849372: they were a
wave of liberal democratic movements that collapsed most Marxist–Leninist
governments in the Eastern Bloc, and were *a key factor* in the dissolution of
the Soviet Union. The article's own weighting, and the reason for `probable`.

#### `revolutions-of-1989 --precondition-of--> maastricht-treaty`

The English article on the treaty, at revision 1360900516: it was negotiated
against the background of the end of the Cold War and the re-unification of
Germany. The article on the revolutions says it is they that marked the end of
the Cold War. **This is the edge that joins the whole post-Soviet cluster to
the corpus** — neither article says the revolutions produced the treaty, which
is why it is a precondition.

#### `dissolution-of-the-soviet-union --precondition-of--> russo-ukrainian-war`

The English article on the war, at revision 1375351069, § Background, begins
there: after the dissolution of the Soviet Union in 1991 Ukraine and Russia
maintained ties, and in 1994 Ukraine gave up the former Soviet nuclear weapons
on its territory in return for the Budapest Memorandum, by which Russia, the
United Kingdom and the United States agreed to uphold its territorial
integrity and independence. It carries in the fragment of eight the atlas had
drawn apart from everything else — `russo-ukrainian-war`,
`full-scale-russo-ukrainian-war`, `bucha-massacre`, `euromaidan`,
`orange-revolution`, `rose-revolution`, `russo-georgian-war` and
`wagner-group-rebellion` — which `docs/m42-pool.md` named as the largest thing
waiting on this import.

#### `world-war-ii --precondition-of--> breakup-of-yugoslavia`

The English article on the breakup, at revision 1373988162, § Background, lists
among the elements that fostered the discord the formation of the Kingdom of
Yugoslavia, its first breakup, and the inter-ethnic and political wars and
genocide during the Second World War, beside the ideas of a Greater Albania, a
Greater Croatia and a Greater Serbia and the unilateral recognition of the
breakaway republics by a newly reunited Germany. One element among several,
named by the article.

#### `angola-independence-1975 --precondition-of--> angolan-civil-war`

The English article on the civil war, at revision 1371337338: the war began
immediately after Angola became independent from Portugal in November 1975, as
a power struggle between the MPLA and UNITA, two former anti-colonial guerrilla
movements with different roots in Angolan society and mutually incompatible
leaderships.

#### `anglo-irish-treaty --caused--> irish-civil-war`

The English article on the civil war, at revision 1374338052: it was waged
between the Provisional Government of Ireland and the anti-Treaty IRA **over
the Anglo-Irish Treaty**, the anti-Treaty side seeing it as a betrayal of the
Irish Republic proclaimed during the Easter Rising of 1916.

#### `anglo-irish-treaty --precondition-of--> the-troubles`

The treaty's article, at revision 1363486671, says it gave Northern Ireland an
option to opt out of the Irish Free State, which the Parliament of Northern
Ireland exercised; the article on the Troubles, at revision 1375596184, says
the conflict was fought over the status of Northern Ireland. The status the
later conflict was fought over is the one the treaty left open, and neither
article calls the treaty its cause.

#### `partition-of-india --caused--> kashmir-conflict`

The English article on the Kashmir conflict, at revision 1374133428: it started
after the partition of India in 1947, as both India and Pakistan claimed the
entirety of the former princely state of Jammu and Kashmir, and escalated into
three wars. It carries the subcontinent fragment of five with it.

### What batch 4 refused to write, and why

- **`breakup-of-yugoslavia --caused--> war-in-bosnia-and-herzegovina`**, which
  the breakup's own lead argues — "unresolved issues from the breakup caused a
  series of inter-ethnic Yugoslav wars from 1991 to 2001 which primarily
  affected Bosnia and Herzegovina" — **fails rule 4**: Wikidata gives the
  breakup the point date 27 April 1992, the proclamation of the Federal
  Republic, and the Bosnian war began on 6 April. The same date refuses the
  filing M62's rule reaches for, because M67 holds that no child is dated
  outside its parent. **Neither is corrected here**: widening an imported
  record's `when` to the span its article describes is a person's reading and
  not a tool's, and no date is invented in this atlas. `war-in-bosnia-and-
  herzegovina` therefore carries no edge and is the one record of the thirteen
  that earns nothing, listed here rather than quietly kept (deviation 989).
- **`second-italo-ethiopian-war`, `berlin-conference`, `second-intifada`,
  `2011-egyptian-revolution` and `2011-south-sudanese-independence-referendum`
  carry no edge yet.** Each waits on a reinstatement §5a already names against
  it: `first-italo-ethiopian-war` and `majimaji-war` for the two African
  records, `gaza-war-2008-2009` for the intifada, `2013-egyptian-coup-d-etat`
  for the revolution, `war-in-darfur` and `south-sudanese-civil-war` for the
  referendum. Those tombstones are the next batch, and they are now unblocked:
  the record each was waiting for is in `data/` as of this one.

### Why the main count went up, which amendment A3 asks

244 main before the import, **257 after**. Thirteen records arrived and twelve
of them are main, because a war, a treaty, a partition, a conference and a
referendum are not part of anything this atlas holds — M62's rule reads
`actors` and `place` and these have neither, and inventing a parent is as
forbidden as inventing a line. The one filing the rule does reach, the Bosnian
war, is refused by the imported date above against `breakup-of-yugoslavia`
and is made in batch 5 against `yugoslav-wars`, whose span holds it. The resting
picture is twelve events wider than it was, and every one of the twelve is a
hinge that a later batch files or that a reader meets at the top level, where
a world war and a partition belong.

## 2e. Batch 5 — the nine tombstones the hinges unblocked

§5a of this file was written before batch 4 and names, for each of the fifty
M44b withdrew, the record that would bring it back. Batch 4 wrote nine of
those records, so **this batch is a list the corpus made and not one this run
chose**: every reinstatement below is a record whose own retraction reason
names the neighbour that has just arrived, and the edge each carries is the
edge that reason said could not be written.

`docs/m44-retractions.md` → "Reinstated" carries all nine with the reason each
was withdrawn under, copied verbatim, which is amendment A11's procedure. Only
`status`, `review` and `retraction` were touched; not one summary, date, actor
or source was edited.

**Eleven edges, and one filing.**

- `1991-soviet-coup-d-etat-attempt --caused--> dissolution-of-the-soviet-union`,
  and `dissolution-of-the-soviet-union --precondition-of--> 1993-russian-constitutional-crisis`.
  The English article on the dissolution, at revision 1375840189, says the
  Soviet Union was formally dissolved on 26 December 1991, ending its federal
  government and Gorbachev's efforts to reform the Soviet political and
  economic system. The coup is four months before that date; the crisis of
  October 1993 is a contest over what replaced the government it ended.
- `dissolution-of-the-soviet-union --precondition-of--> budapest-memorandum`
  and `budapest-memorandum --precondition-of--> russo-ukrainian-war`. The
  article on the Russo-Ukrainian war, at revision 1375351069, § Background,
  says Ukraine gave up the former Soviet nuclear weapons on its territory in
  1994 and that Russia, the United Kingdom and the United States agreed in
  return to uphold its territorial integrity and independence through the
  Budapest Memorandum. The weapons are the ones the dissolution left there.
  **The memorandum's retraction reason said wiring it to two stranded records
  "would have left three where there were two"** — and it is the dissolution
  arriving that makes the cluster no longer stranded.
- `revolutions-of-1989 --caused--> romanian-revolution-1989`. The article on
  the revolutions, at revision 1375849372, describes a wave of liberal
  democratic movements that collapsed most Marxist–Leninist governments in the
  Eastern Bloc, some violently overthrown. **Its reason is the clearest
  statement in the corpus of what this milestone is for**: "until a candidates
  round with the right classes fetches them, 1989 cannot be wired here at all".
- `yugoslav-wars --precondition-of--> breakup-of-yugoslavia`, and from the wars
  to `croatian-war-of-independence` and to `kosovo-war`. The article on the
  wars, at revision 1373953860, says the conflicts both led up to and resulted
  from the breakup, which began in mid-1991; the article on the breakup, at
  revision 1373988162, says unresolved issues from it caused a series of wars
  that primarily affected Bosnia and Herzegovina, neighbouring parts of Croatia
  and, some years later, Kosovo. **Only the half of the first sentence running
  from the wars to the breakup can be drawn**, because of the point date
  deviation 989 describes; the other half waits on a person reading the
  record's dates.
- `war-in-bosnia-and-herzegovina --caused--> dayton-agreement`. The article on
  the Bosnian war, at revision 1375967053, says it ended on 21 November 1995
  when the Dayton Accords were initialed. This is the edge that gives batch 4's
  one record with nothing at all its place.
- `the-troubles --caused--> good-friday-agreement`. The article on the
  Troubles, at revision 1375596184, says the conflict lasted about thirty years
  from the late 1960s to 1998 and is usually deemed to have ended with the
  agreement of that year.
- **The filing**: `war-in-bosnia-and-herzegovina` is part of `yugoslav-wars`,
  whose 1991–2001 holds its 1992–1995. Deviation 989's filing refused itself
  against `breakup-of-yugoslavia`, whose imported point date of 27 April 1992
  falls after the war began; the Yugoslav wars are the right parent anyway, and
  they are a record again as of this batch.

### What batch 5 did to the graph

| | before | after |
| --- | --: | --: |
| active events | 345 | 354 |
| main | 257 | 265 |
| filed under a parent | 88 | 89 |
| active edges | 414 | 424 |
| **largest connected component** | **315** | **323** |
| active events with no edge at all | 17 | 16 |

Nine records back, eleven edges, and the component takes eight of the nine —
`dayton-agreement` and the Bosnian war arrive together. The main count rises by
eight because a war, a coup, a crisis and a memorandum are not part of anything
the atlas holds; the one that is, is filed.

**The six of the fifty still waiting are named in §5a and none of them moved**:
`rwandan-civil-war`, `arusha-accords` and `second-congo-war` on the Rwandan
genocide, and the three of M44b's class C that no bar reaches. Five of batch
4's thirteen still carry no edge and wait on the rest of §5a —
`first-italo-ethiopian-war` and `majimaji-war` for the two African records,
`gaza-war-2008-2009` for the second intifada, `2013-egyptian-coup-d-etat` for
the Egyptian revolution of 2011, and `war-in-darfur` with
`south-sudanese-civil-war` for the referendum. Every one of those five
tombstones is now unblocked by a record in `data/`; what they need is the
sentence that argues each edge, read at a revision, which is the next batch.

## 2f. Batch 6 — the five batch 4 left without an edge

Batch 4 imported thirteen records and eight of them earned an edge the same
day. §2d listed the other five against the tombstone §5a names for each, and
said the tombstones were now unblocked. This is that batch: **four
reinstatements and eight edges**, and four of the five are no longer bare.

- `berlin-conference --precondition-of--> second-boer-war` and
  `berlin-conference --precondition-of--> first-italo-ethiopian-war`. The
  English article on the conference, at revision 1369494326, § Aftermath,
  lists the African states independent as of 1895 and what became of them:
  the two Boer republics were annexed by the British Empire roughly a decade
  after the conference and conquered in the Second Boer War of 1899–1902;
  Ethiopia fended off an Italian invasion from Eritrea in the First
  Italo-Ethiopian War of 1895–1896 and fell to Italian occupation in 1936
  after defeat in the second. **`second-boer-war` is a record this atlas
  already held**, so this is the edge that gives the conference — and
  everything hanging off it — its place in the corpus rather than beside it.
- `first-italo-ethiopian-war --precondition-of--> second-italo-ethiopian-war`.
  The article on the war of 1935, at revision 1374151253, § Background, begins
  with the war of 1896: Italy began its attempts to colonise the Horn in the
  1880s, the first phase concluded with the defeat at Adwa on 1 March 1896,
  and Italy then abandoned its expansionist plans for decades.
- `1952-egyptian-revolution --precondition-of--> 2011-egyptian-revolution` and
  `2011-egyptian-revolution --precondition-of--> 2013-egyptian-coup-d-etat`.
  The article on the revolution of 2011, at revision 1374677056, § Background,
  traces the system it rose against to 1952: Mubarak inherited an authoritarian
  system imposed after the coup against King Farouk, which abolished the
  monarchy and made Egypt a military-dominated one-party state, and he was in
  the thirtieth year of his regime when the uprising began. The article on the
  coup, at revision 1369875339, § Background, writes the two years between
  Mubarak's resignation and the removal of Morsi. `1952-egyptian-revolution`
  was already here, so the pair joins the corpus rather than standing beside it.
- `second-intifada --precondition-of--> gaza-war` and
  `second-intifada --precondition-of--> gaza-war-2008-2009`. The article on the
  Gaza war, at revision 1375729607, § Background, names the First and Second
  Intifadas of 1987 and 2000, "with the latter's end seeing Israel's unilateral
  withdrawal from Gaza in 2005"; the article on the war of 2008–2009, at
  revision 1370620825, § Background, opens with the ceasefire Abbas and Sharon
  signed on 8 February 2005 to bring the intifada to an end, and dates its
  breakdown to June 2006.
- `2011-south-sudanese-independence-referendum --precondition-of--> south-sudanese-civil-war`.
  The article on the war, at revision 1374713494, says the peace agreement of
  2005 created an autonomous region with a promise of a referendum in 2011, and
  that **during the six years of autonomy the desire for independence kept the
  in-fighting within the SPLM in check**; the referendum passed with 98 per
  cent and the state existed from 9 July 2011, and the war broke out in
  December 2013. What the referendum removed is what the article names, and it
  does not call it the cause.

### What batch 6 did to the graph

| | before | after |
| --- | --: | --: |
| active events | 354 | 358 |
| main | 265 | 269 |
| active edges | 424 | 432 |
| **largest connected component** | **323** | **330** |
| components | 22 | 18 |
| active events with no edge at all | 16 | 11 |

Seven of the eight new joins land in the largest component; the eighth, the
South Sudanese pair, is a component of two, for the reason below.

### What batch 6 refused

- **`war-in-darfur` stays retracted.** Its reason says Sudan enters this atlas
  nowhere and that the record would have to be wired to the South Sudanese
  civil war and touch nothing else. The civil war is back, so the pair could
  now be written — and it would still touch nothing else, because the war in
  Darfur began in 2003, before the referendum, and no page read here argues a
  line from one to the other. The record that would change this is the Second
  Sudanese Civil War, which the atlas does not hold and which the sweep does.
- **`majimaji-war` stays retracted.** The rising of 1905 in German East Africa
  is a consequence of the scramble the Berlin conference regulated, and the
  conference is now a record — but **no article read here names both**. The
  conference's own aftermath lists what became of the independent states and
  the Maji Maji article says the war was triggered by German colonial policies
  designed to force the growing of cotton for export. Joining those two
  sentences would be this run's inference and not anybody's page, which §1
  forbids. It waits on a record of German East Africa, or on a page that says
  it.
- **`second-italo-ethiopian-war` carries no edge forward.** Its aftermath and
  its section on international reaction, both read at revision 1374151253,
  argue about Mussolini's standing and the League of Nations and name no event
  this atlas holds. The missing record is the Abyssinia crisis, or Italy's
  alignment with Germany, and neither is written here on this run's word.

## 2g. Batch 7 — the first sweep batch, and the treaties that end the wars the atlas holds

The seeds were exhausted after batch 2a, so this is the first batch taken from
the sweep by §5's tick rule, recomputed against `data/` on the day of ticking.
**Set 1 is empty**: of the sixteen named neighbours, fifteen are records now
and the sixteenth, the Arab Spring, is the refusal of deviation 975 and stays
refused. **Set 2 — the bridges out of the fragments named in §4b — gives
three**: `Q652285`, the India–Pakistan war of 1947–1948, for the South Asian
component; `Q1069736`, the Croat–Bosniak war, for the Bosnian pair; `Q842380`,
the Second Sudanese Civil War, which §2f named in as many words as the record
that would let `war-in-darfur` come back. **Set 4 takes the remaining seven by
sitelinks**, every one of them a treaty or an armistice that ends or amends
something this atlas already holds, which is why they connect on the day they
arrive rather than waiting for a neighbour.

Ten items seeded, ten walked, **ten created, none refused, 22 calls**. One
class was added to the class table and read from Wikidata itself — `Q107706`,
*armistice*, the only class `Q328499` carries — and five lanes were written for
the items whose own point the import cannot reach. One tombstone came back.

### The edges

Seventeen edges, and the eighteenth is the reinstatement's. Three carry a
second author, each a work the cited article hangs the very sentence on, which
is the standard M72 set; the rest cite the encyclopedia alone with the article,
the revision and the section, because for those sentences the article cites
nothing. **Every one is `probable`.** Three of them would satisfy rule 9 as
they stand, and none was promoted: M72's own test is that two authors say the
same thing, and this run did not open the second book to check that it does.

#### `world-war-i --caused--> armistice-of-mudros`

The Background of *"Armistice of Mudros"*, revision 1369160266: the Macedonian
front collapsed in September 1918 and Bulgaria sued for peace, leaving
Constantinople to be defended against an overland siege without Bulgarian help;
Talaat Pasha returned from Berlin and Sofia understanding the war was no longer
winnable and resigned with his ministry on 13 October; two days after taking
office Ahmed Izzet Pasha sent the captured British general Townshend to seek
terms. **Second author: Fromkin 2009, pp. 360–373**, which the article hangs
that account on.

#### `armistice-of-mudros --precondition-of--> treaty-of-sevres`

The same article's lead: the armistice was followed by the occupation of
Istanbul and the subsequent partitioning of the Ottoman Empire, and the Treaty
of Sèvres of 10 August 1920 imposed harsh terms. The armistice opened the
Straits and the capital; the terms are the treaty's.

#### `world-war-i --caused--> treaty-of-neuilly-sur-seine`

*"Treaty of Neuilly-sur-Seine"*, revision 1370636231, lead: a treaty between the
victorious Allies of the First World War and Bulgaria, one of the defeated
Central Powers, requiring Bulgaria to cede various territories, and one of the
series of treaties after the war — with Versailles, Saint-Germain, Trianon and
Sèvres — intended to diminish the strength of the defeated.

#### `polish-soviet-war --caused--> peace-of-riga`

*"Treaty of Riga"*, revision 1368931640, lead: signed in Riga on 18 March 1921
between Poland on one side and Soviet Russia and Soviet Ukraine on the other,
**ending the Polish–Soviet War of 1919 to 1921**.

#### `treaty-of-versailles --precondition-of--> locarno-treaties`

*"Locarno Treaties"*, revision 1373366462, lead: the five western European
states pledged to guarantee the inviolability of the borders between Germany
and France and Germany and Belgium **as defined in the Treaty of Versailles**,
and to observe the demilitarised Rhineland — with no guarantee of the eastern
border, which the article says left the path open to revising Versailles in the
east.

#### `winter-war --caused--> moscow-peace-treaty`

*"Moscow Peace Treaty"*, revision 1355516673, lead: signed by Finland and the
Soviet Union on 12 March 1940, it **marked the end of the 105-day Winter War**,
upon which Finland ceded border areas.

#### `moscow-peace-treaty --precondition-of--> continuation-war`

*"Continuation War"*, revision 1375847616, lead: the Winter War ended with the
Moscow Peace Treaty, and numerous reasons have been proposed for the Finnish
decision to invade, **regaining territory lost during the Winter War regarded as
the most common**. The article names other motives beside it, so the treaty is
where it starts and not the whole of what it says decided the war.

#### `treaty-of-rome --precondition-of--> single-european-act`

*"Single European Act"*, revision 1324525488, lead: **the first major revision of
the 1957 Treaty of Rome**, setting the objective of a single market by
31 December 1992 and reforming the legislative process.

#### `single-european-act --precondition-of--> maastricht-treaty`

The same article: **anticipating the 1992 Maastricht Treaty**, the signatories
declared themselves moved by the will to transform relations among their states
into a European Union.

#### `1991-soviet-coup-d-etat-attempt --precondition-of--> belovezh-accords`

*"Belovezha Accords"*, revision 1373420915, lead, quoting Shushkevich in 2006:
by December **the union had already been broken up by the putschists** who in
August 1991 tried to remove Gorbachev to prevent the transformation of the
Soviet Union into a confederation. A participant's account of why the three
met, reported as that and not as a settled finding.

#### `belovezh-accords --caused--> dissolution-of-the-soviet-union`

The same article's first sentence: the agreement **declared that the Soviet
Union had effectively ceased to exist** and established the Commonwealth of
Independent States in its place, signed near Viskuli on 8 December 1991 by the
leaders of three of the four republics that had signed the 1922 treaty creating
the USSR. The formal dissolution, which this atlas dates 26 December, followed.

#### `croatian-war-of-independence --precondition-of--> croat-bosniak-war`

*"Croat–Bosniak War"*, revision 1373788616, Background: from July 1991 to
January 1992, **during the Croatian War of Independence**, the JNA and Serb
paramilitaries used Bosnian territory to attack Croatia, and the Croatian
government began arming Croats in Herzegovina as early as October or November
1991, expecting the Serbs to spread the war into Bosnia and Herzegovina; by
late 1991 about 20,000 Bosnian Croats had enlisted in the Croatian National
Guard. **Second author: Goldstein 1999, p. 243.**

#### `war-in-bosnia-and-herzegovina --caused--> croat-bosniak-war`

*"Bosnian War"*, revision 1375967053, lead: the conflict was initially between
Yugoslav Army units, later the VRS, on one side and the ARBiH and the Croat HVO
on the other, and **tensions between Croats and Bosniaks increased throughout
late 1992, resulting in the escalation of the Croat–Bosniak war in early 1993**.
This is the edge that puts the Bosnian pair into the largest component: it runs
from a record that was stranded to one that is not.

#### `partition-of-india --caused--> indo-pakistani-war-of-1947-1948`

*"India–Pakistan war of 1947–1948"*, revision 1373782125, lead: the first of the
India–Pakistan wars **between the two newly independent nations**, precipitated
by Pakistan a few weeks after its independence to capture Kashmir and pre-empt
its ruler joining India.

#### `world-war-ii --precondition-of--> partition-of-india`

*"Partition of India"*, revision 1374133022, § *Labour victory in the UK
election, decision to decolonize: 1945*: the Attlee government's exchequer **had
been exhausted by the Second World War** and the British public did not appear
enthusiastic about costly distant involvements; late in 1945 the government
decided to end the British Raj. **Second author: Metcalf and Metcalf 2006,
p. 212** — *"though victorious in war, Britain had suffered immensely in the
struggle. It simply did not possess the manpower or economic resources required
to coerce a restive India."* **This is the edge that brings the South Asian
component of six into the corpus**, and it imports nothing: the partition was
already here and had nothing before it.

#### `soviet-afghan-war --precondition-of--> dissolution-of-the-soviet-union`

*"Soviet–Afghan War"*, revision 1375699993, lead: the decade-long confrontation
**has been cited by scholars as a significant factor contributing to the
dissolution of the Soviet Union in 1991**, which is why it is sometimes called
the Soviet Union's Vietnam. Reported as what scholars have said, and as one
factor among others. **This is the edge that brings the Afghan pair in**, and it
too imports nothing — §4b said the pair waited on the September 11 attacks *or*
on the dissolution, and the dissolution arrived in batch 4.

#### `second-sudanese-civil-war --precondition-of--> 2011-south-sudanese-independence-referendum`

*"Second Sudanese Civil War"*, revision 1375675485, lead: the war ran 1983 to
2005 and **resulted in the independence of South Sudan six years after it
ended**; *"2011 South Sudanese independence referendum"*, revision 1362366338,
lead: the vote was **one of the consequences of the 2005 Naivasha Agreement**.
Both citations are the encyclopedia, so this link rests on one author and says
so.

#### `second-sudanese-civil-war --precondition-of--> war-in-darfur`

*"War in Darfur"*, revision 1375318567, § *Origins of the conflict*: the article
gives several different explanations for the conflict that began in 2003 — land
disputes between herders and farmers, access to water, the two rebel groups
against Khartoum — and among them says **the Darfur crisis is also related to
the First and Second Sudanese civil wars**. The article relates them and does
not rank them, and the edge is written at the strength the page gives it.

### The one filing, and the ten left bare

**`croat-bosniak-war` is filed under `war-in-bosnia-and-herzegovina`**, and it
names neither an actor nor a place, so M67's amendment A1 asks for the argument
here. It is the record's own context and none of it is new: the English article
calls the war **"a war within a war" because it was part of the larger Bosnian
War**, its Wikidata item gives Bosnia and Herzegovina as its location, and its
span of 18 October 1992 to 23 February 1994 sits inside the Bosnian war's
6 April 1992 to 14 December 1995. Nothing else was written on the record —
**no actor line was invented to justify the filing**, which is the whole of A1.

The other ten — `armistice-of-mudros`, `treaty-of-neuilly-sur-seine`,
`peace-of-riga`, `locarno-treaties`, `moscow-peace-treaty`,
`single-european-act`, `belovezh-accords`,
`indo-pakistani-war-of-1947-1948`, `second-sudanese-civil-war` and
`war-in-darfur` — **name neither an actor nor a place and are left main**, which
A1 settles: bareness is not a defect. Seven of them are treaties, and a treaty
between states is the amendment's own case: it has no single actor and no one
place, and a line written to give it one would be a claim the record does not
support. The three wars could each be argued into something — the Indian one
into the Kashmir conflict, the Sudanese pair into each other — and **§3 of
`docs/m62-brief.md` says that where the filing is arguable the event stays
top-level and is listed**, which is what this paragraph is. No actor record was
created to make any of them filable.

### What batch 7 did to the graph

| | before | after |
| --- | --: | --: |
| active events | 358 | 369 |
| main | 269 | 279 |
| active edges | 432 | 450 |
| **largest connected component** | **330** | **349** |
| components | 18 | 15 |
| active events with no edge at all | 11 | 11 |
| active events unreachable from any Portuguese one | 13 | 5 |

**The component grew by nineteen and the corpus by eleven**, which is amendment
A5's question answered the right way round: eight of the nineteen are records
that were already here and stranded — the South Asian six, minus the partition
which the batch reached directly, and the Afghan pair — and they came in on two
edges that imported nothing at all. The eleven with no edge are unchanged and
are the same eleven: the Madeiran three now sit in a component of three, the
eight Portuguese presidential singletons and `entente-cordiale`,
`iberian-blackout-2025` and the fires pair are untouched by a world sweep and
are named in §4b as the cheapest thing left.

**The one place the corpus grew and the component did not** is Sudan. Both
Sudanese records join the South Sudanese pair, making a component of four, and
that component reaches nothing else: the referendum, the civil war, the war in
Darfur and the war that preceded all three are joined to each other and to
nothing this atlas holds. The record that would join them is the Berlin
conference's own aftermath in the Nile valley, or a Portuguese or European
event the pages relate to Sudan, and **no page read here names one**. It is
written down rather than fixed by an edge nobody argues.

## 2h. Batch 8 — sets 3 and 4, and the bar doing its work

Batch 7 spent what was left of sets 1 and 2, so this batch is §5's **set 3 and
set 4 and nothing else**: the two best by sitelinks in each of the five decades
the corpus is thinnest in — the 1900s at ten active events, the 1890s at
eleven, the 1930s and the 1950s at nineteen, the 2000s at twenty-one — then the
six best remaining by sitelinks over the whole pool. Sixteen rows, a cap the
same size as batch 7's read.

**This is the first batch where the rule picks records the corpus cannot use**,
and that is the rule working rather than failing. Sixteen items seeded,
**fifteen created, one refused** for want of a class nobody has decided about
(`Q475678`, the Mexican drug war, whose only classes are *asymmetric warfare*,
*irregular warfare* and *drug war*; the three are listed rather than added,
because the record would have been retracted for want of a neighbour in the
same breath). Of the fifteen, **nine earned an edge and six did not and are
retracted with their reasons**. Nothing was written in order to keep a record.

Two classes were added, both read from Wikidata itself: `Q154278`, *ethnic
cleansing*, with no category — the atlas holds the Holocaust, the Armenian
genocide and Katyn with none either — and `Q2380335`, *airstrike*, as `war`.
Eleven lanes were written for items whose own point the import cannot reach.

### The edges

Eleven, of which one imports nothing.

#### `the-amazon-rubber-boom --precondition-of--> treaty-of-petropolis`

*"Treaty of Petrópolis"*, revision 1370155152, lead: the treaty ended the Acre
War between Bolivia and Brazil over Acre, **"a desirable territory in
Bolivia-Brazil border during the contemporary rubber boom"**, Brazil taking it
for land between the Abuna and the Madeira, two million pounds and a railway
around the rapids. The boom is the record this atlas already held, and it is
what the article says made the ground worth a war. **The article dates the
signature 17 November 1903 and the record carries the item's own 11 November**;
neither was changed to match the other, which is deviation 989's rule.

#### `franco-russian-alliance --precondition-of--> world-war-i`

*"Franco-Russian Alliance"*, revision 1375457134, § History: Russia and France
**entered the war united by the treaty of alliance**, which forced Germany from
the first days to fight on two fronts, leading to the defeat at the Marne and
the collapse of the Schlieffen Plan. The article puts the alliance among the
causes of the shape the war took and not of its outbreak.

#### `munich-agreement --caused--> first-vienna-award` and `treaty-of-trianon --precondition-of--> first-vienna-award`

*"First Vienna Award"*, revision 1373350087, lead: the arbitration and the award
were **direct consequences of the previous month's Munich Agreement**, and
Hungary's claim was a claim for the revision of the 1920 Treaty of Trianon, some
of whose losses the award returned. Both ends were already here.

#### `vietnam-war --precondition-of--> laotian-civil-war`

*"Laotian Civil War"*, revision 1370626595, lead: the Kingdom of Laos was **a
covert theatre during the Vietnam War**, the North Vietnamese Army invaded in
1958 and 1959 to use the east for the Ho Chi Minh trail, and the Pathet Lao won
in December 1975 following North Vietnam's victory in April. **Not filed under
it**: the Laotian war ends 2 December 1975 and the Vietnam War 30 April 1975, so
a child would be dated outside its parent.

#### `world-war-ii --precondition-of--> deportation-of-the-crimean-tatars`

*"Deportation of the Crimean Tatars"*, revision 1375533569, lead: the Soviet
government presented the deportation as collective punishment for collaboration
with Nazi Germany — **noting that the 20,000 who collaborated with the Axis were
half the 40,000 who served in the Red Army** — while several modern scholars
believe it was part of a plan to reach the Dardanelles or to clear minorities
from the border regions. The war is the occasion the government gave, and the
article says plainly that scholars dispute it is the reason.

#### `world-war-ii --precondition-of--> indonesian-national-revolution`

*"Indonesian National Revolution"*, revision 1375837705, § Japanese surrender:
**the unconditional surrender of Japan on 15 August 1945** was received by the
pemuda groups, who pressed Sukarno and Hatta to proclaim independence two days
later. **Second author: Ricklefs 1991, p. 213**, one of the works the article
hangs that sentence on.

#### `world-war-ii --precondition-of--> austrian-state-treaty`

*"Austrian State Treaty"*, revision 1374482051, § Development: **the Allied
occupation of Austria began on 27 April 1945** and divided the country into four
zones, and the treaty of 15 May 1955 was signed among those occupying powers and
the Austrian government. The treaty ends the occupation the war produced.

#### `treaty-of-versailles --precondition-of--> treaty-of-rapallo`

*"Treaty of Rapallo (1922)"*, revision 1362703017, § Background: both states were
left vulnerable after the First World War, **Versailles led to German
disarmament and the cession of German territories**, and the article quotes the
reading that the victors' policies "left no alternative to Germany but to move
closer to Russia".

#### `vietnam-war --precondition-of--> sino-vietnamese-war`

*"Sino-Vietnamese War"*, revision 1375848359, § Background: the three wars in one
line — just as the First Indochina War and the Vietnam War arose from the
indecisive aftermath of political relations, **the Third Indochina War again
followed the unresolved problems of the earlier wars**. The immediate occasion
the lead gives, Vietnam's occupation of Cambodia, is not a record here.

#### `second-boer-war --precondition-of--> entente-cordiale`

**This one imports nothing and is the batch's other job.** *"Entente Cordiale"*,
revision 1370844455, § Background: the situation for Britain and France changed
in the last decade of the century, and **"the change had its roots in a British
loss of confidence after the Second Boer War and a growing fear of the strength
of Germany"**. §4b named `entente-cordiale` as one of four records standing
alone; this is the sentence that ends it, and the Boer war was here all along.

### The six retracted, and what each waits for

Each carries its reason in its own `retraction` block, which is where it
belongs, and each names the record that would bring it back.

| record | what it waits for |
| --- | --- |
| `may-coup` | a record of Serbia between 1903 and 1912, or a page arguing a line from the coup to the Balkan wars or to Sarajevo. Its Legacy section is a television series and a novel |
| `thousand-days-war` | the separation of Panama, or any Colombian or Andean record: the atlas holds none |
| `austrian-civil-war` | the Anschluss or the Dollfuss dictatorship. The atlas holds no Austrian record before the state treaty of 1955 |
| `transnistria-war` | a record of perestroika or of Moldovan independence. The record the pages argue from is the dissolution of the Soviet Union, which this atlas dates 26 December 1991 — **after the war's start of 2 November 1990, so rule 4 refuses the edge**, and no imported date was widened to make it fit |
| `anti-counterfeiting-trade-agreement` | a record of the trade order it belongs to. It carries **no lane either**: the item gives no point and names no country |
| `operation-rising-lion` | nothing. Its English sitelink redirects into *"List of attacks during the Twelve-Day War"*, and the Twelve-Day War is `twelve-day-war`, `Q134900605`, active here. A section of a list about a war the atlas already draws is not a second record |

### The nine left main, and the one that could have been filed

`treaty-of-petropolis`, `franco-russian-alliance`, `first-vienna-award`,
`laotian-civil-war`, `austrian-state-treaty`, `treaty-of-rapallo`,
`sino-vietnamese-war`, `deportation-of-the-crimean-tatars` and
`indonesian-national-revolution` name neither an actor nor a place and are
left main, which M67's amendment A1 settles. Five are treaties between states,
which is A1's own case. **`laotian-civil-war` is the one that could have been
filed** — its article calls Laos a covert theatre of the Vietnam War — and it
is not, because its end of 2 December 1975 falls outside the Vietnam War's
30 April 1975 and rule 24 would warn. The deportation is arguable under
`world-war-ii` and is listed rather than filed, as M62 §3 requires: the article
says the war was the justification the government gave and that scholars
dispute it, and a filing would assert with a display fact what the article
declines to assert.

### What batch 8 did to the graph

| | before | after |
| --- | --: | --: |
| active events | 369 | 378 |
| main | 279 | 288 |
| active edges | 450 | 461 |
| **largest connected component** | **349** | **359** |
| components | 15 | 14 |
| active events with no edge at all | 11 | 10 |
| active events unreachable from any Portuguese one | 5 | 4 |

**Nine records in and ten into the component**: the tenth is
`entente-cordiale`, which was already here. The corpus grew by nine and the
component by ten, which is the only shape A5 accepts without an explanation.

## 2i. Batch 9 — the singletons §4b called the cheapest thing left

**This batch imports nothing.** §7 item 3 of `docs/m42-pool.md` says the
fragments no import reaches are taken when a batch has room, and §4b named
them: four records standing alone, of which `entente-cordiale` fell to batch 8,
and eight Portuguese presidential elections the corpus holds only the ends of.
Nine of them are answered here, on sentences their own articles have carried
all along. **Eight edges, no record created, no record retracted.**

### The five the 1911 constitution reaches

`constitution-1911 --enabled--> may-1915-portuguese-presidential-election`,
`--> august-1915-portuguese-presidential-election`,
`--> 1918-portuguese-presidential-election`,
`--> 1919-portuguese-presidential-election` and
`--> 1925-portuguese-presidential-election`.

Each of the five English articles carries the same sentence — *"Following
Portugal's 1911 constitution, the Congress of the Republic must elect the
president in Lisbon instead of the Portuguese people"*, and in the May 1915
article *"Portugal's 1911 constitution stated that…"* — read at revisions
1273396087, 1340296036, 1273401624, 1362155033 and 1305366818. **The edge this
atlas already held is the same one**: `constitution-1911 --enabled-->
1911-portuguese-presidential-election`, written long before this milestone. The
edge carries the mechanism and nothing else: who won and why is the record's
own.

### The three that are about what happened

- `sidonio-pais-assassinated-1918 --caused--> 1918-portuguese-presidential-election`.
  The article, revision 1340296036: the election **was held two days after the
  assassination of President Sidónio Pais on 14 December 1918**; quorum failed
  at the first ballot and it was repeated, and João do Canto e Castro was
  elected succeeding the late president. The 1918 election is the one record
  here with two edges into it, which is right: the constitution says how, the
  assassination says why then.
- `1995-portuguese-legislative-election --precondition-of--> 1996-portuguese-presidential-election`.
  The article, revision 1371811573: the Social Democrats **"were coming from a
  clear defeat in the 1995 Portuguese legislative election"**, and their former
  leader Cavaco Silva ran against Jorge Sampaio, who won with nearly 54 per
  cent. The defeat is the position the right went in from and the article does
  not make it the cause of the outcome.
- `constitution-1976 --precondition-of--> 2006-portuguese-presidential-election`.
  The article, revision 1374338206, § Background: Sampaio was re-elected in the
  first round in 2001 and **"because he was term-limited, he was forbidden by
  the Constitution to run for a third consecutive term"**.

### The two this batch refused, and why

- **`1923-portuguese-presidential-election`**. Its article, revision 1361388277,
  says *"The Congress of the Republic elected the president in Lisbon instead of
  the Portuguese people"* — the same mechanism as the other five and **without
  naming the constitution**. Writing the constitution edge from that sentence
  would be supplying the attribution the page declines to make, so it is not
  written. It waits on a page that names the constitution, or on a record of
  Teixeira Gomes's presidency.
- **`1951-portuguese-presidential-election`**. Its article, revision 1273794926,
  gives the occasion as the death of President Óscar Carmona on 18 April 1951,
  which is not a record here, and says Rui Luís Gomes was removed from the
  ballot after being declared a communist by the Salazar dictatorship. It is
  **already filed under `estado-novo-1933-1974`**, as the presidential elections
  of 1949 and 1965 beside it are, so it is in the picture; it has no edge, and
  it waits on a record of Carmona's death or of the 1958 election law.

`iberian-blackout-2025`, the third record with no edge, is untouched: it is an
assistant-drafted record citing the grid operator's own report, and nothing
read here argues a line from it to anything this atlas holds.

### What batch 9 did to the graph

| | before | after |
| --- | --: | --: |
| active events | 378 | 378 |
| main | 288 | 288 |
| active edges | 461 | 469 |
| **largest connected component** | **359** | **366** |
| components | 14 | 7 |
| active events with no edge at all | 10 | 3 |

**Seven components became one and the corpus did not grow at all**, which is
the shape batch 3 had and the cheapest kind of batch this milestone writes.
What is left outside the largest component is now four things and not
fourteen: the Sudanese four, the Madeiran three, the fires pair, and three
records with no edge — `1923-portuguese-presidential-election`,
`1951-portuguese-presidential-election` and `iberian-blackout-2025`. Every one
of them is named above or in §2g with what it waits for.

## 2j. Batch 10 — sets 3 and 4 again, and three tombstones the imports unblock by name

Sets 1 and 2 were spent by batch 7, so this batch is §5's **set 3 and set 4**,
recomputed on 21 September against `data/` and not read from the sweep file's
own *"in the atlas"* column. The pool came out at **1,557 rows**, exactly the
number §5 of `docs/m42-pool.md` records, which is the check that the rule was
recomputed and not remembered. The five thinnest decades are the same five
batch 8 found — the 1900s at eleven active events, the 1890s at twelve, the
1930s at twenty, the 1950s and the 2000s at twenty-one — so set 3 is their two
best by sitelinks each, ten rows, and set 4 is the six best remaining over the
whole pool. Sixteen rows, the cap batch 8 used.

**Sixteen seeded, sixteen created, twelve kept and four retracted.** Four
classes were refused on the first pass and three were added from the item's own
label and description, read over the network: `Q13427116` *peasant revolt* as
`revolution`, `Q1464916` *declaration of independence* as `founding`, and
`Q21994376` *war of independence* as `war`. **`Q3771738`, *historical
document*, was not added** — it is the Kosovo declaration's other class, one
was enough to let the item through, and a historical document is not a kind of
event. Four lanes were written for items whose own point the import cannot
reach: Korea and the 1957 influenza to `asia`, Greece and Romania to `europe`.

**The three tombstones this batch brings back are the point of it.** Each was
retracted with a reason naming the record it waited for, and this batch's
imports are those records:

#### `anglo-zanzibar-war`

Reinstated on `heligoland-zanzibar-treaty --enabled--> anglo-zanzibar-war`. Its
retraction read, verbatim:

> Retracted in M40b: the shortest war on record, forty minutes on 27 August 1896 over who would succeed as Sultan of Zanzibar. The atlas holds no event in East Africa before 1953 and nothing about the British protectorate, so there is nothing the war can be argued to have changed here and nothing here that can be argued to have caused it. It would need a record of the 1890 protectorate agreement, or of the abolition of slavery in Zanzibar in 1897, before it had an honest edge.

The 1890 protectorate agreement is the Heligoland–Zanzibar treaty, and the
treaty's own article says Britain "immediately declared a protectorate over
Zanzibar" under it. The tombstone asked for a record by name and the sweep
produced it.

#### `libyan-civil-war`

Reinstated on `libyan-civil-war --precondition-of--> mali-war`. Its retraction
read, verbatim:

> Retracted in M40b: the rising against Gaddafi from February 2011 and the NATO-supported war that ended with his death in October. Its cause, the Arab Spring, was among the twenty-nine candidates the import refused for want of a lane; its consequences — the second Libyan war, the collapse of the state, the central Mediterranean route — are not records here, and neither is the Security Council's later refusal over Syria, which is the argument that would have run out of it.

One of those consequences is a record now. The Mali War article argues the
rebellion of January 2012 out of "the collapse of Gaddafi's Libya" and the
return of his Tuareg fighters with their weapons — so the record comes back on
a consequence and not on the Arab Spring, which is still refused (975).

#### `thousand-days-war`

Reinstated on `thousand-days-war --precondition-of--> hay-bunau-varilla-treaty`.
**Batch 8 of this same run retracted it eight hours earlier**, and its reason
ended: *"It waits on the separation of Panama, or on any record of the
region."* Set 3's best 1900s row is the treaty the separation produced. This is
the tick rule and the bar working together across two batches, and it is the
clearest case this milestone has that a retraction is a note of what is
missing rather than a verdict.

### The edges

Fourteen. Every one runs to a record that was already here, which is what
amendment A5 asks; none joins two of this batch's own imports to each other.

#### `donghak-peasant-revolution --caused--> first-sino-japanese-war`

*"Tonghak Peasant Revolution"*, revision 1375257262, § lead and § Siege of
Jeonju Fortress: the alarmed government asked the Qing for intervention, the
Qing sent 2,700 soldiers, and Japan — angered that the Qing had not notified it
as the Convention of Tientsin promised — **started the First Sino-Japanese
War**. The siege section says the same thing twice over: 1,500 Qing and 6,000
Japanese troops landed at Incheon on 3 May, and the Japanese question about the
Convention "soon caused the First Sino-Japanese War". The record's
`wikipedia.en` field carries the item's sitelink, *"Donghak Peasant
Revolution"*, which now redirects to the article cited here; the locator names
the article as it stands at that revision and not as Wikidata files it.

#### `berlin-conference --precondition-of--> heligoland-zanzibar-treaty`, `heligoland-zanzibar-treaty --enabled--> anglo-zanzibar-war` and `heligoland-zanzibar-treaty --precondition-of--> entente-cordiale`

*"Heligoland–Zanzibar Treaty"*, revision 1372103388, § Consequences, which is
three arguments in one paragraph. Backwards: the treaty served Caprivi's aims
for a settlement with the British, and **after the 1884 Berlin Conference
Germany had been losing out in the scramble for Africa**. Forwards: Britain
"immediately declared a protectorate over Zanzibar and, in the subsequent 1896
Anglo-Zanzibar War, gained full control of the sultanate" — `enabled` and not
`caused`, because the article gives the treaty as the position the war was
fought from and not as its cause. And further forward: Heligoland was
"strategically placed for control over the German Bight", which the Kiel Canal
had made essential to Wilhelm II's naval expansion, and **"Wilhelm's naval
policies aborted an accommodation with the British and ultimately led to a
rapprochement between Britain and France, sealed with the Entente cordiale in
1904"**. The last is `precondition-of` and nothing stronger: it is the naval
policy, not the treaty, that the article says drove Britain to France. The
paragraph carries **no footnote at all**, so all three rest on the encyclopedia
alone and none of them could be `consensus` under rule 22 even if this run
wanted it to be.

#### `thousand-days-war --precondition-of--> hay-bunau-varilla-treaty`

Two articles, because neither says the whole of it. *"Thousand Days' War"*,
revision 1370750751, § lead: the war's repercussions included **"the eventual
loss of the Department of Panama as an incorporated territory of the republic
in 1903"**, and the American navy was sent by Roosevelt's government to protect
United States interests in the canal's construction. *"Hay–Bunau-Varilla
Treaty"*, revision 1375195423, § Background: the United States intent to
influence the area **"led to the separation of Panama from Colombia in 1903 and
its establishment as an independent state"**. A treaty between Washington and
Panama was possible only because Panama had stopped being Colombian.

#### `treaty-of-versailles --precondition-of--> german-polish-declaration-of-non-aggression`

*"German–Polish declaration of non-aggression"*, revision 1363397316, § lead
and § Effect of the declaration: the declaration **"effectively normalised
relations between Poland and Germany, which had been strained by border
disputes arising from the territorial settlement in the Treaty of Versailles"**,
and until then Germany had withheld normalisation without first settling the
border question. What the declaration did was put the Versailles border aside
for ten years.

#### `molotov-ribbentrop-pact --precondition-of--> german-soviet-treaty-of-friendship-cooperation-and-demarcation`

*"German–Soviet Boundary and Friendship Treaty"*, revision 1375965836, § lead
and § Secret articles: the treaty is **"a second supplementary protocol of the
Molotov–Ribbentrop Pact of 23 August 1939"**, amended on 28 September after the
joint invasion and occupation of Poland, superseding the first treaty; its
secret articles redrew the spheres of interest the pact had dictated and moved
Lithuania into the Soviet sphere to compensate for Polish ground the Wehrmacht
had taken. **Filed under the pact as well**, which is the one place in this
batch where the umbrella and the edge are the same record: the pact runs
23 August 1939 to 22 June 1941, the supplement falls inside it, and a
supplementary protocol is inside its subject by definition.

#### `world-war-i --precondition-of--> estonian-war-of-independence`

*"Estonian War of Independence"*, revision 1370918612, § lead: the campaign was
**"the struggle of the newly established democratic state of Estonia for
independence in the aftermath of World War I"**, against the Soviet Russian
westward offensive of 1918–1919 and the Baltische Landeswehr, concluded in the
1920 Treaty of Tartu. **Not filed under `russian-civil-war`**: the article puts
it in the aftermath of one war and against an offensive out of the other, and
M62 §3 says an arguable filing is listed rather than made.

#### `world-war-ii --precondition-of--> greco-italian-war`

*"Greco-Italian War"*, revision 1370621958, § lead, which argues the Italian
move on Greece out of Italy's own belligerency: Italy declared war on France
and the United Kingdom on 10 June 1940 and had invaded France, British
Somaliland and Egypt by September; **this "was followed by a hostile press
campaign in Italy against Greece, accused of being a British ally"**, and the
provocations culminated in the sinking of the cruiser Elli and Mussolini's
ultimatum of 28 October. The same lead says the conflict **"began the Balkans
campaign of World War II"**, which is why the record is also **filed under the
war**.

#### `first-sudanese-civil-war --caused--> second-sudanese-civil-war`

*"First Sudanese Civil War"*, revision 1375454294, § lead and § Impact: the
Addis Ababa Agreement ended the war in 1972 but **"failed to completely dispel
the tensions"**, and **"the breakdown of the initial appeasement later led to a
reigniting of the north–south conflict during the Second Sudanese Civil War"**;
the aftermath section says infringements by the north increased unrest in the
mid-1970s, leading to the 1983 mutiny that sparked the second war. **This edge
grows the Sudanese fragment and does not bridge it** — §2g's finding stands,
and this batch confirms it from a new page: neither the first war's article nor
the Darfur article relates any Sudanese record to anything else this atlas
holds. The Sudanese component is four records and is now five.

#### `war-of-attrition --precondition-of--> yom-kippur-war`

*"War of Attrition"*, revision 1371500938, § Egyptian front: after Nasser's
death in September 1970 Sadat continued the ceasefire, rebuilding the army and
planning a full-scale attack across the Suez Canal, and **"these plans would
materialize three years later in the Yom Kippur War"**. **The paragraph carries
a `Citation needed` tag dated December 2025**, which is said here and in the
edge's own explanation rather than left for a reader to find: it is why the
edge is `probable` and would not be promoted even if a second author were added
to it.

#### `kosovo-war --precondition-of--> 2008-kosovo-declaration-of-independence`

*"2008 Kosovo declaration of independence"*, revision 1368774231, § Build-up and
§ Political background: after the war ended in 1999 the Security Council adopted
Resolution 1244, which put Kosovo under transitional United Nations
administration and **"envisioned an eventual UN-facilitated political process to
resolve the status of Kosovo"**; negotiations on the final status began in 2006
**"as envisaged under UN Security Council Resolution 1244 which ended the Kosovo
conflict of 1999"**. The declaration of 17 February 2008 is the end of that
process.

#### `libyan-civil-war --precondition-of--> mali-war` — the one `consensus` edge

*"Mali War"*, revision 1375920868, § Background: **"From February 2011, with the
collapse of Gaddafi's Libya, hundreds of his Tuareg fighters, many veterans of
the previous rebellions and now unemployed, returned to Mali with large
stockpiles of weapons"**; in October 2011 those returning fighters negotiated at
Zakak and formed the MNLA, which began the rebellion of 16 January 2012.

This is the only edge in the batch that is `consensus`, and it is promoted by
**M72's own three-part test and not because this run finds the claim
convincing**: rule 9 is satisfied by the work added, the work is scholarship
rather than an encyclopedia, and **the article hangs the very sentence stating
this link on that work**. The work is Miroiu and Alecu, *"Mali: Conflict, Social
Order and the Crime-Terror Nexus"*, *Conflict Studies Quarterly* 48 (July 2024),
pp. 58–71, doi:10.24193/csq.48.4, written into `data/sources/` with the
publisher and identifier the article's own citation template carries. It is the
batch's one second author, and it exists because the article had one to give;
the other thirteen edges rest on sentences that carry no footnote at all.

#### `revolution-of-dignity --caused--> russo-ukrainian-war`

*"Revolution of Dignity"*, revision 1375565667, § lead, in one sentence: **"The
revolution prompted Russia to occupy Crimea, starting the Russo-Ukrainian
war."* The third paragraph says the same at length — counter-revolutionary
protests in the south-east, the occupation and annexation of Crimea, and the
Russian-backed seizures that proclaimed Donetsk and Luhansk. **Filed under
`euromaidan`**, whose span it shares exactly (2013-11 to 2014-02-23) and whose
protests its own lead says it took place at the end of. The item is not a
duplicate of `euromaidan`: `Q15224558` and `Q15733401` are two items with two
English articles, the movement and its February culmination, which is the check
`operation-rising-lion` failed in batch 8 (994).

### The four retracted, and what each waits for

| record | what it waits for |
| --- | --- |
| `1907-romanian-peasants-revolt` | any Romanian record at all. Its article argues out of the 1864 land reforms and forward to the agricultural-contracts law of December 1907; this atlas holds neither, and no Balkan, Russian or imperial record the article names |
| `1957-1958-influenza-pandemic` | the 1918 pandemic, or the Hong Kong flu of 1968. Its article argues to both and to neither of this atlas's records; the only pandemic here is COVID-19, which the article does not mention |
| `montreal-protocol` | the Vienna Convention for the protection of the ozone layer, or the Kyoto Protocol |
| `stockholm-convention-on-persistent-organic-pollutants` | the Rotterdam or Basel conventions, or any environmental record a person has argued |

**The last two are one finding and it is worth the owner's attention.** This
atlas has an **environment-shaped hole**: `paris-agreement`, `ramsar-convention`
and `united-nations-convention-on-the-law-of-the-sea` are all tombstones in §5b
above, each retracted for the same reason — the instrument decided nothing this
corpus holds. Two of the sweep's best remaining rows by sitelinks fell into that
hole in the same batch. It is not the sweep failing: it is a real gap in what
the atlas is about, and until one environmental record is argued by a person
every environmental treaty the sweep offers will be retracted on arrival.

### The nine left main, and the three filed

Twelve records were kept and **three took a parent**, each under M62's rule of
inside the span *and* inside the subject: `greco-italian-war` under
`world-war-ii`, `german-soviet-treaty-of-friendship-cooperation-and-demarcation`
under `molotov-ribbentrop-pact`, and `revolution-of-dignity` under `euromaidan`.
The nine that stayed top-level are named here one by one, because M67's test
asks for every bare main event by name and a sentence about "treaties" is not
an argument about any of them:

| record | why it is nobody's part |
| --- | --- |
| `heligoland-zanzibar-treaty` | a bargain between two empires over four coasts; the scramble for Africa is a process this atlas has no record and no sourced span for, and `berlin-conference` is one conference inside it and not an umbrella over it |
| `hay-bunau-varilla-treaty` | the canal is not a record here, and the separation of Panama — which would be the umbrella — is not one either |
| `german-polish-declaration-of-non-aggression` | a bilateral declaration of 1934 that the article sets against the Versailles settlement; the interwar period is not a record here, and it ran to April 1939, outside the war's span |
| `donghak-peasant-revolution` | it *caused* the First Sino-Japanese War and began four months before it, so the war cannot contain it; the Joseon dynasty's collapse is no record here |
| `estonian-war-of-independence` | **the one that was arguable.** Its article sets it against the Soviet Russian westward offensive of 1918–1919, which is `russian-civil-war`'s ground, and calls it the aftermath of one war fought against an offensive out of the other. M62 §3 says an arguable filing is listed rather than made, and this is the listing |
| `first-sudanese-civil-war` | the north–south conflict it is the first half of is not a record here; `second-sudanese-civil-war` is its sequel, not its container |
| `war-of-attrition` | the Arab–Israeli conflict is not a record here, and the atlas holds its wars — 1948, 1973, Lebanon, Gaza — as separate records with edges between them and no node over them |
| `2008-kosovo-declaration-of-independence` | `kosovo-war` ended nine years before it and cannot contain it; the status process that produced it is a UN procedure, not an event here |
| `mali-war` | it began in 2012 and has no end date; nothing here contains it, and the Sahel insurgency is not a record |

**Every one of the fifteen new active records carries `actors: []`.** That is
M67 A1 and not a defect: an event with no actor and no place is not filable and
no line was invented to make one so. It is why §4.1 of `docs/m53-polities.md`
moves to **306 of 393** — the numerator does not move at all.

### What batch 10 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 378 | **393** |
| main | 288 | **300** |
| filed under a parent | 90 | **93** |
| active edges | 469 | **483** |
| largest connected component | 366 | **376** |
| components | 7 | 9 |
| active events with no edge | 3 | 3 |
| unreachable from any Portuguese event | 4 | 9 |

**The component grew by ten and the corpus by fifteen, and the five-record
difference is two new pairs and one fragment.** Amendment A5 asks a batch that
grows the corpus and not the component to say why, and this batch owes that
answer three times over:

- **`thousand-days-war` + `hay-bunau-varilla-treaty` is a component of two.**
  Neither article names anything else this atlas holds: the treaty's own
  aftermath runs to the Martyrs' Day riots of 1964 and the Torrijos–Carter
  treaties of 1977, and the war's runs back to the Colombian constitution of
  1886. It is the atlas's **first Panamanian and first Colombian ground**, and a
  pair standing alone is what a first record in a region looks like.
- **`libyan-civil-war` + `mali-war` is a component of two**, for the reason
  M40b's tombstone already gave: the Arab Spring is refused for want of a lane
  (975) and it is the record that would join Libya to Egypt and Tunisia.
- **The Sudanese fragment is now five** and §2g's reading is unchanged.

Nine components against seven is therefore the honest shape of a batch that
opened two new regions: **three of the nine are records this atlas had never
reached before**, and every other import in the batch went straight into the
largest component. Unreachable-from-Portuguese rises from four to nine for the
same reason and means the same thing.

## 2k. Batch 11 — sets 3 and 4 a third time, and three more tombstones back

The pool recomputed to **1,541 rows** on the same rule, sixteen fewer than batch
10's 1,557, which is the sixteen batch 10 spent. The thinnest five decades moved
— batch 10's imports took the 1890s and the 1900s off the floor, so the 1980s
joined at twenty-two — and set 3 is again their two best by sitelinks each, with
set 4's six best remaining over the whole pool. Sixteen rows.

**Sixteen ticked, fifteen created, nine kept and six retracted.** One item was
refused at import and could not be rescued: `Q276172`, the Jewish exodus from
the Muslim world, **has no date the atlas can use**. The sweep row prints
1930-01-01 because that is where the tool files an undated row in its decade
table; the item itself gives no year, and the article describes a movement over
half a century. A date was not invented, which is deviation 989's rule applied
to an absence rather than to a disagreement.

Two lanes were written — Matabeleland to `africa`, Turkestan to `asia` — and no
class was added, the first batch of this run that needed none.

### The three tombstones this batch brings back

**`somali-civil-war`**, retracted in M44b for wanting "a neighbour in a region
this atlas does not reach at all", comes back on
`ogaden-war --caused--> somali-civil-war`: the Ogaden war's own article ends its
lead saying the defeat of March 1978 left Somalia with a disorganized and
demoralized army and that "these conditions led to a revolt in the army which
eventually spiraled into the ongoing Somali Civil War". The region is reached
now, by one war.

**`cultural-revolution`**, retracted in M40b naming "the 1-2-3 incident of
1966–67 in Macau" as the precise link it wanted, comes back on something else:
`cultural-revolution --precondition-of--> sino-soviet-border-conflict`,
**`disputed`**. The Macau incident is still not a record here. The new bar asks
for one honest edge to anything in the atlas and this is one, with its
disagreement written down rather than smoothed over.

**`treaty-on-the-non-proliferation-of-nuclear-weapons`**, retracted in M40b for
wanting "an event the instrument decided", comes back on
`treaty-on-the-non-proliferation-of-nuclear-weapons --precondition-of--> treaty-on-the-prohibition-of-nuclear-weapons`.
It is still true that this atlas holds no event the NPT decided; what it holds
now is the treaty written **because** the NPT's prohibitions are partial, which
is the prohibition treaty's own first argument about itself.

That is **six tombstones in two batches**, every one of them found by reading a
sweep row against the 215 notes the corpus has written about what it is missing.

### The edges

Ten.

#### `russo-japanese-war --precondition-of--> british-russian-convention` and `british-russian-convention --precondition-of--> world-war-i`

*"Anglo-Russian Convention"*, revision 1358051340. § Background gives the two
reasons the article says overcame twenty years of British resistance to a deal
with Russia: the emergence of the German Empire as a world power, and **"the
defeat in 1905 of Russia by a nascent Asian power, the Empire of Japan, in the
Russo-Japanese War"**. The lead and § Persia give the consequence: the
convention "would eventually form a component of the Triple Entente" and "was
important in establishing a diplomatic alignment that endured until the First
World War". The alignment, not the war, is what the article says the convention
made.

#### `young-turk-revolution-of-1908 --enabled--> bulgarian-declaration-of-independence`

*"Bulgarian Declaration of Independence"*, revision 1375171159, § Background: a
unilateral declaration would normally have violated the Treaty of Berlin and been
unlikely to be approved by the Great Powers, but **"the chaos that ensued in the
Ottoman Empire following the Young Turk Revolution of 1908 provided suitable
conditions for the Bulgarian proclamation of independence"**, and the Powers had
turned to their own gains — Bosnia, the Arab provinces, the Straits. `enabled`
and not `caused`: the revolution made the declaration possible and did not ask
for it.

#### `korean-war --caused--> korean-armistice-agreement`

*"Korean Armistice Agreement"*, revision 1370487806, § lead: the armistice
"brought about a cessation of hostilities of the Korean War", signed on 27 July
1953 by the United Nations Command, the Korean People's Army and the Chinese
People's Volunteer Army. **Filed under the war as well**, which is the shape
`treaty-of-paris-1898` under `spanish-american-war-1898` already set here.

#### `cultural-revolution --precondition-of--> sino-soviet-border-conflict` — the batch's one `disputed` edge

*"Sino-Soviet border conflict"*, revision 1372863432, § lead: **"Historians have
suggested Mao provoked the clash to further the radical sentiments of the
Cultural Revolution or to elevate China's international standing towards the
Cold War's two superpowers."** That is a suggestion with an alternative beside
it and no historian named for either, and the same lead gives causes that are
not about the Cultural Revolution at all — the 1964 reopening of the
nineteenth-century demarcation, and the worsening of relations after the Soviet
invasion of Czechoslovakia in 1968. So the edge is `disputed` and its `dispute`
block says all of that, which is what `CLAUDE.md` asks for when the sources do
not agree: mark it and say who disagrees, rather than pick a side. **The record
is not filed under the Cultural Revolution**, although 1969 falls inside
1966–1976: a motive historians merely suggest is not a subject, and M62 §3 says
an arguable filing is listed rather than made.

#### `ogaden-war --caused--> somali-civil-war`

*"Ogaden War"*, revision 1373903527, § lead, quoted above.

#### `vietnam-war --precondition-of--> cambodian-vietnamese-war`

*"Cambodian–Vietnamese War"*, revision 1375855358, § Vietnam War and § Rise of
communism: during the Vietnam War the Vietnamese and Cambodian communists
"again had formed an alliance to fight anti-communist regimes in their
respective countries", the Vietnamese used Cambodian territory as a route and a
staging area against South Vietnam, both took power in April 1975 as the war
ended, and the Khmer Rouge — fearing a Vietnamese-dominated Indochinese
federation — purged Vietnamese-trained personnel and began attacking southern
Vietnam in May 1975.

**The second edge this article argues could not be written, and deviation 989 is
why.** § International response says the United States asked that Vietnam
withdraw from Cambodia and that China withdraw from Vietnam, "which it had
invaded on 17 February 1979 in the Sino-Vietnamese War", and § 1978 says the
Chinese divisions massed on the Vietnamese border "would eventually be deployed
in the brief Sino-Vietnamese War". The atlas holds `sino-vietnamese-war` at
1979. But **Wikidata dates this record 26 September 1989 to 23 October 1991** —
the withdrawal, not the war the article dates to 1978–1989 — so rule 4 refuses
an edge from 1989 to 1979. **No date was widened to make the edge possible**,
which is exactly what deviation 989 refused for the breakup of Yugoslavia. The
edge is waiting on a person correcting the record's interval, not on a page.

#### `black-september --precondition-of--> lebanese-civil-war`

*"Black September"*, revision 1370604477, § lead: after the fighting "Jordan
allowed the fedayeen to relocate to Lebanon via Syria, where they later became
involved in the Lebanese Civil War".

#### `world-war-i --precondition-of--> basmachi-movement`

*"Basmachi movement"*, revision 1374693404, § lead: **"The movement's roots lay
in the anti-conscription violence of 1916 which erupted when the Russian Empire
began to draft Muslims for army service in World War I."** The article names
that before the Bolsheviks and before Kokand. **The October Revolution edge the
same lead would carry was not written**: the movement is dated from 1916 and the
October Revolution from 1917, so rule 4 refuses it, and the article's own
sentence — "in the months following the October 1917 Revolution … the Russian
Civil War began" — describes what the movement grew into rather than what began
it.

#### `treaty-on-the-non-proliferation-of-nuclear-weapons --precondition-of--> treaty-on-the-prohibition-of-nuclear-weapons`

*"Treaty on the Prohibition of Nuclear Weapons"*, revision 1363091604, § Concept:
nuclear weapons, unlike chemical and biological weapons, landmines and cluster
munitions, "are not prohibited in a comprehensive and universal manner", because
**"the Non-Proliferation Treaty (NPT) of 1968 contains only partial
prohibitions"**. Its preamble cites the slow pace of disarmament and expresses
compliance with the NPT, and its Article 3 requires parties to keep the
safeguards built on the NPT model.

### The six retracted, and what each waits for

| record | what it waits for |
| --- | --- |
| `first-matabele-war` | any record in southern Africa between the Berlin conference and 1953. Its article argues out of the 1889 royal charter and the Pioneer Column and forward to the Second Matabele War; this atlas holds none of them |
| `panic-of-1893` | an American or Argentine record of the 1890s. Its one sentence naming something here — that it was the worst American depression "until the Great Depression of the 1930s" — is a comparison and not a link |
| `montevideo-convention` | the Seventh International Conference of American States, or the Good Neighbor Policy. A criterion of statehood is not an event that decided one, and the article relates the convention to no declaration this corpus holds |
| `universal-copyright-convention` | the Berne Convention, or any copyright record at all |
| `basel-convention` | **the same environmental hole batch 10 named**, for the third time: the article relates it to the Rotterdam and Stockholm conventions and to the IAEA regime, and the Stockholm convention is itself a batch 10 tombstone |
| `intermediate-range-nuclear-forces-treaty` | an event the treaty decided, or the Euromissile deployments it was negotiated over. The article never says it ended the Cold War, and saying so here would be this run's claim and not the article's |

### The nine left main, and the one filed

One record took a parent — `korean-armistice-agreement` under `korean-war` —
and the other eight are named here one by one, with `cambodian-vietnamese-war`
which is also bare:

| record | why it is nobody's part |
| --- | --- |
| `british-russian-convention` | a bilateral settlement of three buffer states; the Great Game is a period this atlas has no record and no sourced span for |
| `bulgarian-declaration-of-independence` | the Young Turk revolution *enabled* it and did not contain it; the Balkan crisis of 1908 is not a record here |
| `sino-soviet-border-conflict` | **the one that was arguable**: 1969 falls inside the Cultural Revolution's 1966–1976, but the only thing joining them is a motive the article says historians have suggested, and M62 §3 says an arguable filing is listed rather than made |
| `ogaden-war` | the Cold War in the Horn is not a record here, and `somali-civil-war` is its consequence and not its container |
| `cambodian-vietnamese-war` | the Third Indochina War, which its own lead says it was part of, is not a record here; `vietnam-war` ended in April 1975 and cannot contain a war the record dates from 1989 |
| `black-september` | the Arab–Israeli conflict is not a record here, for the reason §2j gave of `war-of-attrition` |
| `basmachi-movement` | it runs 1916 to 1934, beginning before `russian-civil-war` and ending twelve years after it, so nothing here contains it |
| `treaty-on-the-prohibition-of-nuclear-weapons` | it happened at the United Nations in New York, which is the place it carries; no event here contains it |
| `korean-armistice-agreement` | **filed**, under `korean-war` |

### What batch 11 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 393 | **405** |
| main | 300 | **311** |
| filed under a parent | 93 | **94** |
| active edges | 483 | **493** |
| largest connected component | 376 | **382** |
| components | 9 | 12 |
| unreachable from any Portuguese event | 9 | 15 |

**The component grew by six and the corpus by twelve, and amendment A5's
question now has a general answer rather than a case-by-case one.** Three of
this batch's edges made a pair standing on its own — Ogaden with Somalia, the
Cultural Revolution with the border conflict, the two nuclear treaties — and
none of the three could have been written any other way, because in each case
the only record in this atlas the article relates its subject to was a
tombstone that the same edge brought back.

**That is the shape of the sweep from here and it should be said plainly.** Sets
1 and 2 were the rows the corpus had asked for by name, and they joined the
middle. Sets 3 and 4 are the best remaining by sitelinks and by thin decade, and
what they increasingly find is **a corner of the world this atlas has one or two
records of**. Batch 10 opened Panama and the Sahel; batch 11 opened the Horn of
Africa, the Sino-Soviet border and nuclear disarmament. The ratio is still very
high — **382 of 405, 94.3 per cent, against 94.2 after batch 10 and 82 per cent
when the milestone began** — but the count of components will keep rising while
the volume does, and a run that treats that as a failure will start writing
edges to prevent it. That is what brief §1 forbids, and it is worth writing down
before a later batch is tempted.

## 2l. Batch 12 — one sweep row, five tombstones, and the Great Lakes joined

Batches 10 and 11 found that a sweep row is often worth more than itself,
because six tombstones came back on records those rows supplied. Batch 12 is
that finding pushed as far as it goes: **one import, five reinstatements, six
edges, and every one of the six new active records lands in the largest
connected component.**

**The row was taken out of the tick rule's order and this says so.** By §5 the
next sixteen are set 3's ten and set 4's six best by sitelinks, and
`Q838695`, the First Congo War, is **seventh** in set 4 at 44 sitelinks —
inside the rule's ordering and outside a cap of sixteen. It was taken anyway,
alone, because reading it against the tombstones showed it unlocks four of
them, and stretching the cap to seventeen to reach it would have been a hand
dressed as a rule. Deviation 1003 records it. Nothing was skipped: the sixteen
above it are still there, in order, for the next batch.

### What the article says, and why it is the key to a region

`docs/m44-connections.md` and §5a of this file have both said for a week that
the route out of the Great Lakes runs through Angola. `second-congo-war`'s
M44b retraction said it in as many words:

> Angola fought in this war, on Kabila's side and against the UNITA supply
> lines through Mobutu's Zaire, which is a genuine edge from the Great Lakes to
> the Portuguese-speaking world. **It cannot be written**: the atlas holds
> Angolan independence in 1975 and no record of the Angolan civil war that the
> intervention of 1998 was a continuation of.

`angolan-civil-war` came back in batch 0 of this run, so half of that is no
longer true. The other half is that the Second Congo War's own article never
says **why** Angola intervened — every mention of Angola in it is an account of
troop movements. The First Congo War's article has a section on it and states
the motive outright, which is why this one row and not the bigger war is what
the cluster hangs on.

### The edges

Six, and five of the six have at least one end that was a tombstone this
morning.

#### `angolan-civil-war --precondition-of--> first-congo-war`

*"First Congo War"*, revision 1374918500, § Angola: **"Angola chose to
participate in the First Congo War because members of Mobutu's government were
directly involved in supplying the Angolan rebel group, UNITA"**, and "Angola
entered the war on the side of the rebels and was determined to overthrow the
Mobutu government, which it saw as the only way to address the threat posed by
the Zairian-UNITA relationship". Luanda acted through the Katangese Tigres and
also deployed regular troops. **This is the edge the whole cluster hangs on**:
without it the five records below are a Great Lakes island, and with it they
are in the main component.

#### `1994-genocide-against-tutsi --precondition-of--> first-congo-war`

Same article, § lead and § Rwanda: Zaire's collapse by 1996 was "exacerbated by
long-standing internal strife and **the destabilizing effects of the 1994
Rwandan genocide, which had led to an influx of refugees and militant groups
into the country**", and Rwanda's "first and foremost" war aim was "the
suppression of génocidaires who had been launching attacks against the new
Rwandan state from Zaire", Kigali intervening to dismantle the camps they took
refuge in.

#### `first-congo-war --caused--> second-congo-war`

Same article, § lead: the war "set the stage for the Second Congo War
(1998–2003) due to tensions between Kabila and his former allies" — Kabila
distanced himself from his Rwandan and Ugandan backers, expelled foreign troops
and allied with Angola, Zimbabwe and Namibia, and **"these actions prompted a
second invasion from Rwanda and Uganda, triggering the Second Congo War in
1998"**.

#### `rwandan-civil-war --precondition-of--> 1994-genocide-against-tutsi` and `rwandan-civil-war --caused--> arusha-accords`

*"Rwandan genocide"*, revision 1375989507, § lead, which carries both in one
paragraph: the genocide "occurred from 7 April to 19 July 1994 **during the
Rwandan Civil War**"; hostilities rooted in the Hutu revolution of 1959–62 were
"exacerbated further due to the Rwandan Civil War, which began in 1990 when the
Rwandan Patriotic Front … invaded Rwanda from Uganda"; **"the war reached a
tentative peace with the Arusha Accords in 1993"**; and "the assassination of
President Juvénal Habyarimana on 6 April 1994 ignited the genocide". The first
edge is `precondition-of` and not `caused` precisely because the article names
the assassination as what ignited it. **The genocide is not filed under the
war** although the article says it happened during it: this atlas dates
`rwandan-civil-war` 1 October 1990 to 4 August 1993, and a child dated after
its parent ends is what rule 24 warns about.

#### `srebrenica-massacre --precondition-of--> dayton-agreement`

*"Bosnian War"*, revision 1375967053, § lead: **"after the Srebrenica and
Markale massacres, NATO intervened in 1995 with Operation Deliberate Force,
targeting the positions of the Army of the Republika Srpska, which proved key
in ending the war"**, and after the ceasefires of 14 September and 5 October,
"peace negotiations were held in Dayton, Ohio, and the war ended when the
Dayton Accords were initialed on 21 November 1995". Srebrenica is one of the
two massacres the article names as what brought NATO in, which is why this is a
precondition and not a cause. **Filed under `war-in-bosnia-and-herzegovina`**,
whose span of 6 April 1992 to 14 December 1995 contains July 1995 and whose
subject it plainly is — the massacre's own article calls it the killing "during
the Bosnian War", perpetrated by units of the VRS.

### The five reinstated, and what each was waiting for

| record | its own reason, and what made it untrue |
| --- | --- |
| `second-congo-war` | M44b: Angola's intervention "is a genuine edge … **it cannot be written**: the atlas holds Angolan independence in 1975 and no record of the Angolan civil war". `angolan-civil-war` came back in batch 0; the First Congo War supplies the sentence that states Angola's motive |
| `1994-genocide-against-tutsi` | M40b: "the atlas holds no record of the Rwandan civil war, the Arusha accords, the United Nations mission that was not reinforced, or **the wars in Congo that followed**". The wars in Congo are records now, and so are the other two, in the same batch |
| `rwandan-civil-war` | M44b, class A: it "can be argued to the Arusha accords … and to the genocide and the Congo wars, and the whole cluster reaches no Portuguese event". The Portuguese bar died with brief §1; the cluster now reaches Angola in one hop, which is as Portuguese as the Great Lakes get |
| `arusha-accords` | M44b, class A: "two records connected to each other and to nothing else is precisely the second atlas the brief was written to stop building". They are five records connected to the whole atlas now |
| `srebrenica-massacre` | M40b: "**It would need the Bosnian war as a record before it had an honest edge.**" `war-in-bosnia-and-herzegovina` is active, and is now its parent as well as the article the edge is read from |

Every one of these five reasons named what was missing, and none of them was
wrong when it was written. That is eleven tombstones this run has brought back
by reading the notes rather than by fetching anything.

### The one left main and bare

`first-congo-war` is the batch's only new record and it is top-level and carries
`actors: []`. It is nobody's part: the article calls the First and Second Congo
Wars "part of a continuous conflict" in the view of some historians, and that
conflict is not a record here — M62 §3 says an arguable filing is listed rather
than made, and a view some historians hold is exactly that. `actors: []` is
M67 A1 and not a defect. `docs/m53-polities.md` §4.1 accordingly moves to
**306 of 411**, its numerator standing still for the third batch running.

### What batch 12 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 405 | **411** |
| main | 311 | **316** |
| filed under a parent | 94 | **95** |
| active edges | 493 | **499** |
| largest connected component | 382 | **388** |
| components | 12 | **12** |
| unreachable from any Portuguese event | 15 | 15 |

**The corpus grew by six and the component grew by six**, which is the first
batch of this run where the two numbers are equal and the component count did
not move. That is what amendment A5 is asking for, and it is worth saying what
produced it: the batch was chosen by reading the tombstones rather than the
sitelink ranking, so every record it touched already had a neighbour waiting
for it. **The sweep grows the corpus and opens new corners; the tombstones grow
the component.** A run with time for one of the two should know which it is
choosing.

## 2m. Batch 13 — sets 3 and 4 a fourth time, and no tombstone came back

**Sixteen rows ticked, sixteen created, twelve kept and four retracted,
fourteen edges, two filings, and every one of the twelve lands in the largest
connected component.** The corpus grew by twelve and the component grew by
twelve; the component *count* did not move, and neither did the three events
with no edge at all.

**Step 0 of §7 was run first and it came back empty, which is a finding and
not a skipped step.** The scan over the 213 retraction reasons for one naming
a record that is active now returns two rows, and neither is a
reinstatement: `1910-portuguese-legislative-election` names
`republic-proclaimed-1910`, but it was retracted in M21 because the revolution
stopped the count and nothing followed from the ballot — the record it names
is the reason it is a tombstone, not the blocker it waits for — and
`operation-rising-lion` names `twelve-day-war`, which is the record batch 8
retracted it in favour of. A second scan, over the retraction reasons for this
batch's own subjects, found `may-coup` waiting on "a page that argues a line
from it to the Balkan wars" and `1907-romanian-peasants-revolt` waiting on "a
Romanian neighbour": the Treaty of Bucharest is a Romanian record and Romania
signed it, but the revolt's own article argues forward to the agricultural-
contracts law of 1907 and the leasing law of 1908 and no further, so nothing
was written. **Eleven tombstones have come back this way across batches 10 to
12 and none came back in batch 13**, which is what the vein running thin looks
like.

### The sixteen, and how they were chosen

§5's rule, recomputed against `data/` on the day: the sweep pool — the `world`
rows of `docs/wikidata-candidates.md` whose item is on no record here and in no
`items` entry of `data/imports/wikidata-seeds.json` — came out at **1,191
rows**, against the 1,541 batch 11 measured, because the pool is recomputed
and not remembered and because the count is now taken over the `world` sections
alone. Sets 1 and 2 are spent, so set 3 took the best by sitelinks in each of
the six thinnest decades of the corpus — the 1900s at 14 active events, the
1890s at 16, the 1930s and 2000s at 22, the 1950s and 1980s at 23 — and set 4
filled the remaining ten by sitelinks over the whole pool. Ties break by item
id read as a number. Nothing was struck or added by hand, and the cap is
sixteen, which is what the last four sweep batches have set it at.

Every one of the sixteen had a class already in the table of
`data/imports/wikidata-seeds.json`; six classes the items also carry were
unknown to it — `Q959265` cholera outbreak, `Q107637520` border conflict,
`Q321839` agreement, `Q750215` mass murder, `Q3882219` assassination,
`Q180684` conflict — and **none was added**, because each item was already
admitted by another of its classes and a class table is a decision about what
kind of record a class becomes, not a hole to be filled on the way past.

### The edges

Fourteen. Every one of them runs from a record this atlas already held into a
record this batch created, except `saur-revolution --caused--> soviet-afghan-war`,
which runs the other way, and `treaty-of-london-q584617 --precondition-of-->
second-balkan-war`, which runs out of a new record into an old one. **No edge
was written between two of this batch's own records**, which is the fault A5
exists to stop repeating.

#### `first-balkan-war --caused--> treaty-of-london-q584617` and `treaty-of-london-q584617 --precondition-of--> second-balkan-war`

The 1913 Treaty of London is the hinge between the two Balkan wars and the
article says so at both ends. *"Treaty of London (1913)"*, revision 1359713953,
§ lead: the treaty "dealt with the territorial adjustments arising out of the
conclusion of the First Balkan War". § Terms: **"the division of the
territories ceded to the Balkan League was not addressed in the Treaty, and
Serbia refused to carry out the division agreed with Bulgaria in their treaty
of March 1912. As a result of Bulgarian dissatisfaction with the *de facto*
military division of Macedonia, the Second Balkan War broke out between the
combatants on 16 June 1913."** The second edge is `precondition-of` and not
`caused` because what the article blames is what the treaty *left out*.
`hall-2000-balkan-wars` already existed as a source record — M72 wrote it —
and the article cites Hall for that very sentence, bare, so the locator is the
section heading, which is M72's own rule for a work cited without pages.

#### `second-balkan-war --caused--> treaty-of-bucharest`

*"Treaty of Bucharest (1913)"*, revision 1359715572, § lead: the treaty "was
concluded in the aftermath of the Second Balkan War and amended the previous
Treaty of London, which ended the First Balkan War". § Background says why
there was a treaty at all: Bulgaria, attacked from four sides at once and
"isolated and surrounded by a more powerful coalition of opponents", "was
forced to agree to a truce and to peace negotiations to be held in the Romanian
capital, Bucharest".

#### `young-turk-revolution-of-1908 --reacted-to--> 31-march-incident`

*"31 March incident"*, revision 1370103767, § lead: the uprising of April 1909
occurred "soon after the 1908 Young Turk Revolution, in which the Committee of
Union and Progress (CUP) had successfully restored the Constitution and ended
the absolute rule of Sultan Abdul Hamid II", and "is sometimes referred to as
an attempted countercoup or counterrevolution". The article is careful that
what the incident *was* is contested — from a spontaneous revolt of discontents
to a coordinated counter-revolution — and not at all that it was a reaction to
what 1908 had done, which is the only thing this edge claims. `31-march-incident`
is the fourth record this atlas holds for the late Ottoman crisis, after
`young-turk-revolution-of-1908`, `bulgarian-declaration-of-independence` and the
Balkan wars.

#### `october-revolution --precondition-of--> execution-of-the-romanov-family` and `russian-civil-war --caused--> execution-of-the-romanov-family`

*"Murder of the Romanov family"*, revision 1374973698. § lead gives the
custody: "Following the February Revolution in 1917, the Romanovs and their
servants had been imprisoned in the Alexander Palace before being moved to
Tobolsk, Siberia, **in the aftermath of the October Revolution**. They were next
moved to a house in Yekaterinburg, near the Ural Mountains, before they were
murdered in July 1918." The infobox files the killings as "part of the Red
Terror during the Russian Civil War", and the article gives the war as the
reason for the timing twice over: "some Western historians attribute the
execution order to the government in Moscow, specifically Vladimir Lenin and
Yakov Sverdlov, who wanted to prevent the rescue of the imperial family by the
approaching Czechoslovak Legion during the Russian Civil War", and, from the
other side, "in mid-July 1918, forces of the Czechoslovak Legion were closing
on Yekaterinburg… the Bolsheviks, falsely believing that the Czechoslovaks were
on a mission to rescue the family, panicked and executed their wards. The
Legions arrived less than a week later and on 25 July captured the city." Who
gave the order is disputed in that sentence and the edge does not decide it;
that the advance of the war is what brought the order is not disputed there at
all. The article hangs the Moscow reading on Gellately, p. 65, which is the new
source record `gellately-2007-lenin-stalin-hitler` and the second author M72
asks for.

#### `potsdam-conference --caused--> potsdam-declaration`

*"Potsdam Declaration"*, revision 1371052620, § lead: on 26 July 1945 Truman,
Churchill and Chiang Kai-shek "issued the document, which outlined the terms of
surrender for the Empire of Japan, **as agreed upon at the Potsdam
Conference**". § Drafting shows the conference doing the work — the American
delegation opened with a proclamation demanding unconditional surrender, "the
Potsdam Declaration went through many drafts until a version acceptable to all
was found", and Stalin declined to endorse it at Potsdam because the Soviet
Union was not yet at war with Japan. This is the third act of that conference
the atlas draws, and the declaration is **not** filed under it: a conference and
the ultimatum it issued are two records, not an umbrella and a part.

#### `world-war-ii --caused--> paris-peace-treaties`

*"Paris Peace Treaties, 1947"*, revision 1369078996, § lead: signed on 10
February 1947 "following the end of World War II in 1945", by which "the
victorious wartime Allied powers… negotiated the details of peace treaties with
the former (mostly minor) European Rome-Berlin-Tokyo Axis powers, namely Italy,
Romania, Hungary, Bulgaria, and Finland". What they settled is the war's own
ledger: reparations, minority rights, the end of the Italian colonial empire,
and the Italian–Yugoslav, Hungarian–Czechoslovak, Soviet–Romanian,
Hungarian–Romanian, French–Italian and Soviet–Finnish borders.
`paris-peace-treaties` is the second postwar settlement record here, beside
`potsdam-declaration`, and neither is filed under the war: §3.5 of
`docs/m67-umbrellas.md` already settled that the postwar order is not part of
the war, and 1947 is outside its span in any case.

#### `world-war-ii --reacted-to--> hague-convention-for-the-protection-of-cultural-property-in-the-event-of-armed-conflict`

*"Hague Convention for the Protection of Cultural Property in the Event of
Armed Conflict"*, revision 1374191348, § After World War II: **"With the
conclusion of the Second World War and the subsequent defeat of the Axis
powers, the atrocities which the Nazi leadership condoned, leading to the
removal of culturally significant items and the destruction of numerous others
could not be allowed to occur in future generations. This led the victorious
Allied forces to create provisions to ensure safeguards for culturally
significant items in times of war."** The same section records the war stopping
the previous attempt: a Dutch draft of 1939 went nowhere because "the start of
the Second World War in the same year prevented all further steps", and the
Netherlands submitted it again to UNESCO in 1948. This is the first instrument
of its kind to survive arrival here, and it survives because the article argues
it out of a war this atlas holds rather than out of other instruments it does
not — which is exactly the test §7.4's environment-shaped hole keeps failing.

#### `russo-japanese-war --precondition-of--> soviet-japanese-border-conflicts`

This is the batch's weakest edge and it is written as such. *"Soviet–Japanese
border conflicts"*, revision 1375520653: the article begins its own account of
how the conflicts came about at the Russo-Japanese war — the section is titled
**"Prelude from 1904 to 1932"** — and says the war ended with Russia suing for
peace, "thereby recognizing Japan's claims to Korea and agreeing to evacuate
Manchuria". The lead then makes that ground the quarrel: "the Japanese
expansion in Northeast China created a common border between Japanese-occupied
Manchuria and the Soviet Far East. This led to growing tensions with the Soviet
Union, with both sides often engaging in border violations." **The article
states the two halves and its own section title joins them**; the edge claims no
more than that, which is why it is `precondition-of` and `probable` rather than
`caused`.

**The edge the article argues and rule 4 forbids** is the one out of
`second-sino-japanese-war`: "in July 1937, the Japanese invaded China, starting
the Second Sino-Japanese War. **Soviet-Japanese relations were chilled by the
invasion**… during the first two years of the war, the Soviets heavily aided the
Chinese, increasing tension with Japan", cited to Coox, pp. 94 and 120. The
border conflicts are dated from 1932 by the import, so an edge out of a 1937
record into them is an arrow-of-time error, and **the date was not widened**,
which is deviation 989's rule. That is the third time in four sweep batches
that an imported interval has been the thing standing between an argued edge
and the file, and deviation 1001 already calls it the commonest reason.

#### `vietnam-war --precondition-of--> cambodian-civil-war`

*"Cambodian Civil War"*, revision 1375075951, § lead: "**the conflict was part
of the Vietnam War**. The North Vietnamese People's Army of Vietnam (PAVN) was
involved to protect its bases in eastern Cambodia, which were crucial to its
military effort in South Vietnam. This presence was initially tolerated by
Prince Norodom Sihanouk, the Cambodian head of state, but domestic resistance
combined with China and North Vietnam aiding the anti-government Khmer Rouge
caused him to request help from the Soviet Union to stop this" — hung on
Isaacs and Hardy, p. 90, which is the new source record
`isaacs-hardy-1988-pawns-of-war`. The coup of March 1970 followed "wide scale
protests in the capital against the PAVN presence in the country", and when the
new government demanded the PAVN leave, "they refused and, at the request of
the Khmer Rouge, invaded Cambodia". **No edge was written to
`cambodian-vietnamese-war`**, which the Khmer Rouge victory of April 1975 leads
to in every account: that record is dated by Wikidata from the withdrawal of
1989, and batch 11 already refused an edge on the same interval.

#### `saur-revolution --caused--> soviet-afghan-war`

*"Saur Revolution"*, revision 1370730356. The infobox lists "eventual Soviet
military intervention" among the revolution's own results, and the body
supplies the chain: the PDPA government that took power on 27–28 April 1978
executed Daoud and purged his supporters, and "between April 1978 and the
Soviet invasion of December 1979, Afghan communists executed 27,000 political
prisoners"; the Soviet Union "invaded Afghanistan in December 1979, citing the
Brezhnev Doctrine as basis of its military invasion", and "insurgent groups
fought Soviet troops and the PDPA government for more than nine years". On what
the Soviets were intervening in, the article cites Kaplan — the new source
record `kaplan-1990-soldiers-of-god`, pp. 115–116 — for the claim that "it was
the Saur Revolution and its harsh land reform program, rather than the December
1979 Soviet invasion 'as most people in the West suppose', that 'ignited' the
mujahideen revolt against the Kabul authorities". Gilles Dorronsoro is cited
immediately after, arguing it was the violence of the state rather than its
reforms: a disagreement about **which part** of the revolution did it and not
about whether it did, so the edge is `probable` and carries no `dispute` block.

#### `war-in-afghanistan-2001-2021 --caused--> insurgency-in-khyber-pakhtunkhwa`

*"Insurgency in Khyber Pakhtunkhwa"*, revision 1374407113. The infobox calls
the insurgency "the war on terror and the **spillover of the War in Afghanistan
(2001–2021)**", and the lead names the trigger: "the armed conflict began in
2004 when tensions rooted in the Pakistan Army's search for Al-Qaeda fighters
in its mountainous Waziristan region escalated into large-scale armed
resistance", with Pakistan's actions "presented as its contribution to the U.S.
war on terror". The Costs of War paper the article cites for its casualty
figures states the same beginning: "the war in Pakistan, which began as Al
Qaeda and the Taliban fled from Afghanistan into the northwest region of
Pakistan in 2001". **It is not filed under the Afghan war**: *spillover of* is
not *part of*, and its end is open where the parent's is 2021, which rule 24
would warn about.

#### `paris-peace-conference --enabled--> svalbard-treaty`

The batch's other thin edge, and the type is the honest one. *"Svalbard
Treaty"*, revision 1372436106, § Contents: "the Spitsbergen Treaty was signed
in Paris on 9 February 1920, **during the Versailles negotiations after World
War I**. In this treaty, international diplomacy recognized Norwegian
sovereignty" over an archipelago that had been "a territory free of a nation".
The article's own account of *why* a treaty was wanted is mining and not war —
"by the 20th century mineral deposits were found on the main island and
continual conflicts between miners and owners created the need for a
government" — so what the conference supplied was the table and not the motive,
and `enabled` is what says that and nothing more.

### The four retracted, and what each waits for

| record | what its article argues, and what is missing |
| --- | --- |
| `sixth-cholera-pandemic` | Revision 1337178480 relates the pandemic to exactly one record here and the wrong way about: "in 1913, there was a cholera outbreak in forces of the Romanian Army which were taking part in military operations of the Second Balkan War", which makes an outbreak inside the war part of the pandemic and not either the cause of the other — and rule 4 would refuse an edge from 1913 into a record starting 1899 in any case. Waits on a record of the 1913 Romanian Army cholera outbreak |
| `black-monday` | Revision 1375770077 argues the crash out of the Louvre Accord of February 1987, overvaluation, the US twin deficits, rising rates, the falling dollar and portfolio insurance hedging, none of which is a record here. The one record it names is `great-depression`, and only as a fear — the severity "sparked fears of… a reprise of the Great Depression", a comparison and not a consequence. Waits on the Louvre Accord |
| `tigray-war` | Revision 1374637577 begins its § Historical and political context at "the end of the Ethiopian Civil War in 1991" and runs through the EPRDF, the TPLF, the Oromo protests and Hailemariam Desalegn's resignation; its § Spillover reaches Sudan as a border conflict and sixty thousand refugees, touching none of the four Sudanese records. The Ethiopian records here are the two Italo-Ethiopian wars and `ogaden-war`, and the article argues a line to none. Waits on the Ethiopian Civil War |
| `tajikistani-civil-war` | Revision 1370749545 files the war under "the post-Soviet conflicts and spillover of the Afghan Civil War (1992–1996)", neither a record here, and argues it out of perestroika, the Islamic-democratic movement in the Tajik SSR and the 1991 presidential election. `dissolution-of-the-soviet-union` was read from its own side too, at revision 1375840189: it names Tajikistan for the Dushanbe riots of 1990 and a Kyrgyz border clash in 2021 and argues no line to this war. The obvious edge would be this run's inference. Waits on the Afghan Civil War of 1992–1996 |

**Two of the four are the batch's own answer to the tick rule.** Set 3 picks
the best by sitelinks in the thinnest decades, and the thinnest decades are
thin because the atlas has few neighbours there: `black-monday` came out of the
1980s and `sixth-cholera-pandemic` out of the 1890s, and both are the best
row their decade had. A rule that reaches into a thin decade will keep
returning records that have nothing here to be joined to, and that is the cost
of the floor rather than a fault in it.

### The ten left main, and the two filed

Two of the twelve were filed under a parent, both on M62's rule of inside the
span *and* inside the subject, and both on a sentence the article states rather
than on a date:

- **`cambodian-civil-war` under `vietnam-war`.** "The conflict was part of the
  Vietnam War" is the article's second sentence; 1967–1975 is inside
  1955-11-01 to 1975-04-30; the PAVN, the United States and South Vietnam are
  belligerents on both records. It names neither an actor nor a place — the
  filing is made on the record's context, which is what amendment A1 of
  `docs/m67-umbrellas.md` allows and this paragraph is the note it requires.
  **No actor line was invented to justify it.**
- **`execution-of-the-romanov-family` under `russian-civil-war`.** The
  article's infobox says "part of the Red Terror during the Russian Civil War";
  16–17 July 1918 is inside the war's span; the Ural Regional Soviet and the
  Bolsheviks who carried it out are the war's own side. It too names neither an
  actor nor a place, and the same note applies. The Red Terror would be the
  better umbrella and is not a record here; M62 §3 says file it under the one
  the atlas holds or leave it flat, and the civil war is the umbrella the
  article itself names.

The other ten are top-level and every one of them carries `actors: []`, which
is M67 A1 and not a defect: `31-march-incident`, `soviet-japanese-border-conflicts`,
`insurgency-in-khyber-pakhtunkhwa`,
`hague-convention-for-the-protection-of-cultural-property-in-the-event-of-armed-conflict`,
`potsdam-declaration`, `paris-peace-treaties`, `treaty-of-bucharest`,
`treaty-of-london-q584617`, `svalbard-treaty` and `saur-revolution`. **None of
the ten is anybody's part in this atlas.** Four are treaties or conventions and
a treaty is not part of the war it ends — `treaty-of-paris-1898` under
`spanish-american-war-1898` and `korean-armistice-agreement` under `korean-war`
are the two exceptions already here, and both are armistices signed inside
their war's own span, which none of these four is. `potsdam-declaration` is an
act of a conference the atlas draws as its own record, not a part of it.
`31-march-incident` would want an umbrella of the Second Constitutional Era,
`soviet-japanese-border-conflicts` one of the interwar period in Northeast Asia
and `insurgency-in-khyber-pakhtunkhwa` the war on terror; none of the three
exists, and M62 §3 says an arguable filing is listed rather than made.
`saur-revolution` is the umbrella-shaped one of the ten — it is where the
Afghan sequence starts — and it is filed under nothing for the same reason.

`docs/m53-polities.md` §4.1 accordingly moves to **306 of 423**, its numerator
standing still for the fourth batch running: the gap that row shows is the gap
between an imported corpus and a written one, and it widens by exactly the
number of records each batch keeps.

### What batch 13 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 411 | **423** |
| main | 316 | **326** |
| filed under a parent | 95 | **97** |
| active edges | 499 | **513** |
| largest connected component | 388 | **400** |
| components | 12 | **12** |
| active events with no edge | 3 | 3 |
| unreachable from any Portuguese event | 15 | 15 |

**The corpus grew by twelve and the component grew by twelve, with the
component count unmoved** — the second batch of this run where the two numbers
are equal, and the first sweep batch to manage it. Batch 12 got there by
reading the tombstones; batch 13 got there by refusing the four rows that had
no neighbour instead of keeping them as a fragment of their own. That is the
same result by the opposite hand, and it says something batch 12's finding did
not: **a sweep batch can grow the component as fast as it grows the corpus,
provided it is willing to retract a third of what it fetched.** Twelve of
sixteen kept is below batch 10's twelve of sixteen only in that four went out
rather than three; the rate over four sweep batches is now **ten to twelve kept
a batch**, and the component moves by the same number when the retractions are
made honestly.

## 2n. Batch 14 — sets 3 and 4 a fifth time, and the same twelve-for-twelve

**Sixteen rows ticked, fifteen created and one refused at the class table,
twelve kept and three retracted, fifteen edges, three filings.** Corpus +12,
component +12, component count unmoved, the three events with no edge still
three. That is batch 13's shape repeated, and two batches in a row is enough to
call it the rule rather than the accident: **a sweep batch grows the component
as fast as it grows the corpus when it retracts the rows that have no
neighbour.**

Step 0's tombstone scan ran first and returned nothing to reinstate, as in
batch 13.

### The sixteen, and the one the class table refused

§5's rule over a pool recomputed at **1,175 rows** — sixteen fewer than batch
13's 1,191, which is the sixteen batch 13 spent and the check that the rule is
recomputed and not remembered. Set 3 took the best by sitelinks in the six
thinnest decades (1900s at 15 active events, 1890s at 16, 1930s, 1980s and
2000s at 23, 1950s at 24) and set 4 filled the rest by sitelinks over the whole
pool.

**`Q1274389`, the People Power Revolution, was refused by the import**, because
none of its three classes — `Q3827292`, `Q61671409`, `Q751967` — is in the
class table of `data/imports/wikidata-seeds.json`, and **none was added**, which
is deviation 1005's rule applied the moment it cost something: a class table is
a decision somebody argues with, and adding three entries in the middle of a
sweep batch to keep one record would be deciding three questions nobody asked.
The row is reported here and stays untaken. It is the third item this milestone
has lost at the class table, after `Q475678` and `Q3771738` in batch 8.

### The edges

Fifteen. Every one runs from a record the atlas already held into one of the
twelve, except `declaration-by-united-nations --precondition-of-->
charter-of-the-united-nations`, which runs the other way, and none runs between
two of this batch's own records.

**Five of the fifteen run out of `world-war-ii`**, which is what a sweep of the
1940s finds, and the five are not the same kind of claim: the armistice of June
1940 and the Slovak uprising are acts inside the war and are filed under it;
the Volhynian massacres are `enabled` by it, because what the war supplied was
the collapse of the state and the article credits the killing to the UPA; the
Declaration by United Nations is the alliance putting its name to paper; and
the Fourth Geneva Convention `reacted-to` it. Only the first two are filed.

#### `estonian-war-of-independence --caused--> treaty-of-tartu`

*"Treaty of Tartu (Estonia–Russia)"*, revision 1368812511, § lead: the treaty
of 2 February 1920 between the Republic of Estonia and Soviet Russia, **"ending
the 1918–1920 Estonian War of Independence"**, in which "Bolshevik Russia
recognized the independence of the newly established state of Estonia".
§ Significance calls it "the *birth certificate* of the Republic of Estonia
because it was the first *de jure* recognition of the state".
`estonian-war-of-independence` came back in batch 10 and was one of the two
records batch 11 listed as arguable rather than filed; this is its second edge.

#### `world-war-ii --caused--> declaration-by-united-nations` and `declaration-by-united-nations --precondition-of--> charter-of-the-united-nations`

*"Declaration by United Nations"*, revision 1369044189, § lead. On the first:
it "was the main treaty that formalized the Allies of World War II and was
signed by 47 national governments between 1942 and 1945. On 1 January 1942,
during the Arcadia Conference in Washington D.C., the Allied 'Big Four' — the
United States, the United Kingdom, the Soviet Union, and China — signed a short
document which later came to be known as the United Nations Declaration, and
the next day the representatives of 22 other nations added their signatures."
On the second: **"the Declaration by United Nations became the basis of the
United Nations (UN), which was formalized in the UN Charter, signed by 50
countries on 26 June 1945."** Same name, same signatories, three years apart.

#### `world-war-ii --caused--> armistice-of-22-june-1940`

*"Armistice of 22 June 1940"*, revision 1370957537: **"following the decisive
German victory in the Battle of France, the armistice established a German
occupation zone in Northern and Western France that encompassed about
three-fifths of France's European territory, including all English Channel and
Atlantic Ocean ports."** § Battle of France is the account of how it came to be
signed — the best French armies lost in the northern encirclement, the
government to Bordeaux on 10 June, Paris an open city the same day, Reynaud's
resignation on 16 June and Pétain prime minister.

#### `world-war-ii --caused--> slovak-national-uprising`

*"Slovak National Uprising"*, revision 1374904143, § lead: it "was an attempted
insurrection organised by the Slovak resistance during the Second World War. It
was directed on the one hand against **the German invasion of Slovakia by the
Wehrmacht, which began on 29 August 1944**, and on the other against the Slovak
collaborationist regime of the Ludaks under Jozef Tiso." Carried out by parts of
the Slovak army under a council linked to the Czechoslovak government-in-exile
in London and supported by Soviet and Slovak partisans; it ended after sixty
days with the fall of Banská Bystrica.

#### `world-war-ii --enabled--> massacres-of-poles-in-volhynia-and-eastern-galicia`

*"Massacres of Poles in Volhynia and Eastern Galicia"*, revision 1372344283.
The infobox subheader reads "Part of the Eastern Front of World War II" and the
first sentence says the killings "were carried out in **German-occupied
Poland** by the Ukrainian Insurgent Army (UPA), with the support of parts of the
local Ukrainian population, against the Polish minority". The occupation is the
war's: "in September 1939, Poland was invaded by Nazi Germany and the Soviet
Union. The eastern part of Poland was annexed by the Soviet Union; Volhynia and
Eastern Galicia were attached to the Ukrainian SSR." `enabled` rather than
`caused`, because what the war supplied was the collapse of the state that had
governed those provinces and the article credits the killing to the UPA.

#### `world-war-ii --reacted-to--> fourth-geneva-convention`

*"Fourth Geneva Convention"*, revision 1375615781. The article is a commentary
on the convention's articles and not a history of its drafting, and the edge
claims only what that commentary states: **"the prohibition on scientific
experiments was added, in part, in response to experiments by German and
Japanese doctors during World War II of whom Josef Mengele was the most
infamous"**, and, on the article forbidding collective punishment, "by
collective punishment, the drafters of the Geneva Conventions had in mind the
reprisal killings of World War I and World War II". The convention of 12 August
1949 "was the first to deal with humanitarian protections for civilians during
war". This is the second instrument this milestone has kept on an edge out of
the war that produced it, after the 1954 Hague convention in batch 13, and the
two together say what the environment-shaped hole of §7.4 is missing: an
instrument survives arrival here when its article argues it out of an event this
atlas holds.

#### `treaty-of-lausanne --caused--> population-exchange-between-greece-and-turkey` and `turkish-war-of-independence --precondition-of--> population-exchange-between-greece-and-turkey`

*"Population exchange between Greece and Turkey"*, revision 1372041572. The
lead: the exchange "stemmed from the 'Convention Concerning the Exchange of
Greek and Turkish Populations' signed at Lausanne, Switzerland, on 30 January
1923", and the article quotes the historian Dinah Shelton that **"the Lausanne
Treaty of 1923 completed the process of the forcible transfer of the Greeks"**.
The Convention and the Treaty are two instruments of one settlement and this
atlas holds only the Treaty, whose own record already says it "gave legal form
to the compulsory exchange of Orthodox Christians and Muslims between Greece and
Turkey" — both ends saying the same thing, which is why the edge is `caused`
although the record it runs from is dated six months after the Convention.
§ Historical background argues the exchange out of the fighting instead:
**"the Greek–Turkish population exchange came out of the Turkish and Greek
militaries' treatment of the Christian minorities and Muslim majorities,
respectively, in Asia Minor during the Greco-Turkish War (1919–1922)"**, a
Greek occupation that "unleashed further massacres both of these Christians and
now also of Muslims as both armies sought to secure their rule by eliminating
any inhabitants whose existence could justify unfavorable borders". This atlas
draws that war as `turkish-war-of-independence`, whose record names the Greek
army in western Anatolia and the recapture of Smyrna, so the second edge is
`precondition-of` and the identification is said here rather than assumed.

#### `potsdam-conference --precondition-of--> treaty-on-the-final-settlement-with-respect-to-germany`

*"Treaty on the Final Settlement with Respect to Germany"*, revision
1369082326. § Background: "on 1 August 1945, the Potsdam Agreement, promulgated
in the Potsdam Conference, among other things agreed on the initial terms under
which the Allies of World War II would govern Germany", with a provisional
German–Polish border to be finalised by **"a peace settlement for Germany to be
accepted by the Government of Germany when a government adequate for the purpose
is established"**. The lead: the Two Plus Four Agreement **"supplanted the 1945
Potsdam Agreement: in it, the Four Powers renounced all rights they had held
with regard to Germany, allowing for its reunification as a fully sovereign
state the following year."** Forty-five years is a long edge and the article is
what makes it one: the 1990 treaty answers a question the 1945 conference
wrote down and left open. `potsdam-conference` now carries two of this
milestone's edges, the other being batch 13's `potsdam-declaration`.

#### `german-polish-declaration-of-non-aggression --precondition-of--> baltic-entente`

*"Baltic Entente"*, revision 1363789006, § Formation. The article names the
obstacle and what removed it: the union was wanted from 1918, but "it was not
until 1934 that establishing the union was possible. Lithuania remained
reluctant to the idea because its international political strategy contradicted
those of Latvia and Estonia… **However, in 1934, the Soviet–Polish
Non-Aggression Pact and the German–Polish Non-Aggression Pact both resulted in
the collapse of the Lithuanian foreign policy and forced a change of
position.**" The German–Polish declaration of 26 January 1934 is one of the two
the sentence names and the atlas does not hold the other; the entente followed
on 12 September of the same year.

#### `philippine-revolution --caused--> philippine-declaration-of-independence` and `spanish-american-war-1898 --enabled--> philippine-declaration-of-independence`

*"Philippine Declaration of Independence"*, revision 1358972217, § History. The
first: "in 1896, the Philippine Revolution began. In December 1897, the Spanish
government and the revolutionaries signed a truce, the Pact of Biak-na-Bato,
requiring that the Spaniards pay the revolutionaries $MXN800,000 and that
Aguinaldo and other leaders go into exile in Hong Kong" — and the declaration
of 12 June 1898 "was proclaimed by Filipino revolutionary forces general Emilio
Aguinaldo". The second: **"in April 1898, shortly after the beginning of the
Spanish–American War, Commodore George Dewey… sailed into Manila Bay… On May 1,
1898, the US defeated the Spaniards in the Battle of Manila Bay. Emilio
Aguinaldo decided to return to the Philippines to help American forces defeat
the Spaniards. The US Navy agreed to transport him back aboard the USS
*McCulloch*."** `enabled` and not `caused`, because the article is equally plain
that the war did not ratify the declaration: "the declaration was never
recognized by either the US or Spain. Instead, Spain ceded the Philippines to
the United States in the 1898 Treaty of Paris." This joins the Philippine
cluster — `philippine-revolution`, `philippine-american-war`,
`spanish-american-war-1898`, `treaty-of-paris-1898` — which batch 0 first
brought into the component.

#### `entente-cordiale --enabled--> french-conquest-of-morocco`

*"French conquest of Morocco"*, revision 1374837625, § Background: an earlier
attempt to agree with Spain "failed in 1902 because of disagreement over the
limits of the future Spanish zone", and then **"the Franco-British agreement
reached on 8 April 1904 involved the recognition of the predominant position of
France in Morocco in exchange for France's recognition of the permanency of
Britain's position in Egypt"**, which "also specified a zone to be entrusted to
Spain when it became necessary for France to occupy Morocco". The article hangs
that sentence on Trout 1969, p. 171, which is the new source record
`trout-1969-moroccos-saharan-frontiers` and the second author M72 asks for. The
article then records Germany refusing the arrangement — "since 1904 the German
Empire directed its efforts towards the internationalization of the Moroccan
question", and Wilhelm II at Tangier on 31 March 1905 — which is the first
Moroccan crisis and not a record here.

#### `treaty-of-rome --precondition-of--> merger-treaty`

*"Merger Treaty"*, revision 1340086782, § lead: the treaty of 8 April 1965
"unified the executive institutions of the European Coal and Steel Community
(ECSC), European Atomic Energy Community (Euratom) and the European Economic
Community (EEC)… It set out that the **Commission of the European Communities
should replace the High Authority of the ECSC, the Commission of the EEC and the
Commission of Euratom**, and that the Council of the European Communities should
replace the Special Council of Ministers of the ECSC, the Council of the EEC and
the Council of Euratom." This atlas's own record of the Treaty of Rome says that
treaty "created the European Economic Community… and institutions — a
Commission, a Council, an Assembly and a Court — with powers of their own":
those are two of the three sets of institutions the 1965 treaty merged. The
article is a four-kilobyte stub with no background section, and this is the only
edge it supports.

### The three retracted, and what each waits for

| record | what its article argues, and what is missing |
| --- | --- |
| `tulip-revolution` | Revision 1372025111 argues the revolution out of the Kyrgyz parliamentary elections of 2005 and allegations against Askar Akayev, none a record here. Its only line to a record this atlas holds is about the *name*: "it was Akayev himself who coined the term… using a color or floral term evoked similarity with the non-violent Rose Revolution in Georgia, the Orange Revolution in Ukraine (2004)" — and where it mentions the two again it is to contrast, "this is in contrast to the Ukrainian and Georgian revolutionary forces which demonstrated united fronts against the state". A shared name and an explicit contrast are not `inspired`; the word does not appear in the article. Waits on a page arguing the Kyrgyz opposition took either as a model |
| `1958-lebanon-crisis` | Revision 1370279391 argues the crisis out of the Arab Cold War — the Truman Doctrine, the Suez Crisis of 1956, Nasser and the United Arab Republic — and this atlas holds none of them; the Lebanese civil war appears only in its See also. Its nearest reach to a record here is "after the end of World War II in 1945, the United States and Soviet Union were the two major world powers", which is the class of claim §4 refuses. Waits on the Suez Crisis |
| `colombian-conflict` | Revision 1375841708: the conflict "is historically rooted in the conflict known as *La Violencia*, which was triggered by the 1948 assassination of liberal political leader Jorge Eliécer Gaitán", and neither La Violencia nor the Bogotazo is a record here. The atlas's one Colombian record is `thousand-days-war`, which batch 10 brought back and which this article does not mention at all. Waits on La Violencia |

### The nine left main, and the three filed

Three were filed under `world-war-ii` on M62's rule of inside the span *and*
inside the subject, each on a sentence the article states:

- **`armistice-of-22-june-1940`.** Signed 22 June 1940, inside 1939-09-01 to
  1945-09-02; the parties are Nazi Germany and the French Third Republic, both
  belligerents. It is an armistice signed inside its own war's span, which is
  the shape `korean-armistice-agreement` under `korean-war` already set here and
  which batch 13 named as the exception the four treaties it left main did not
  fit. It names neither an actor nor a place, so the filing is made on the
  record's context, which amendment A1 of `docs/m67-umbrellas.md` allows and
  this paragraph is the note it requires. **No actor line was invented.**
- **`slovak-national-uprising`.** August–October 1944, inside the span; its
  article calls it an insurrection "during the Second World War" against the
  Wehrmacht's invasion of Slovakia. It is the fourth record filed under the war
  beside `warsaw-uprising`, `warsaw-ghetto-uprising` and `20-july-plot`, and it
  names neither an actor nor a place; the same note applies.
- **`massacres-of-poles-in-volhynia-and-eastern-galicia`.** 1942–1944, inside
  the span; the article's own infobox reads "Part of the Eastern Front of World
  War II" and the killings were carried out in German-occupied Poland. Same
  note.

The other nine are top-level and every one carries `actors: []`, which is M67
A1 and not a defect: `treaty-of-tartu`, `declaration-by-united-nations`,
`fourth-geneva-convention`, `population-exchange-between-greece-and-turkey`,
`treaty-on-the-final-settlement-with-respect-to-germany`, `baltic-entente`,
`philippine-declaration-of-independence`, `french-conquest-of-morocco` and
`merger-treaty`. **None of the nine is anybody's part in this atlas.** Five are
treaties or conventions whose war either is not a record here or is not the war
they sit inside; `population-exchange-between-greece-and-turkey` would want the
Lausanne settlement as an umbrella and the atlas holds the treaty as a record
rather than the settlement as a period; `french-conquest-of-morocco` runs
1907–1937 and is nobody's part; `philippine-declaration-of-independence` would
want the Philippine Revolution, whose record ends in 1898 with the declaration
inside it — an arguable filing, and M62 §3 says list it rather than make it,
because the declaration is what the article treats as the revolution's outcome
and not as an episode within it. `baltic-entente` is the one that would most
like an umbrella of the interwar Baltic and there is none.

`docs/m53-polities.md` §4.1 accordingly moves to **306 of 435**, its numerator
standing still for the fifth batch running.

### What batch 14 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 423 | **435** |
| main | 326 | **335** |
| filed under a parent | 97 | **100** |
| active edges | 513 | **528** |
| largest connected component | 400 | **412** |
| components | 12 | **12** |
| active events with no edge | 3 | 3 |
| unreachable from any Portuguese event | 15 | 15 |

Twelve and twelve again. **Two sweep batches in a row have grown the component
by exactly what they grew the corpus by**, and the thing they have in common is
not the pick — batch 13's sixteen were treaties and wars, batch 14's were
treaties and wars and revolutions — but the willingness to retract. Seven of
the thirty-two rows across the two batches went out on arrival with the missing
record named, and one more was refused at the class table before it was ever
written. The rate stands at **twelve kept a batch** over the two.

## 2o. Batch 15 — the Horn of Africa opens, and does not join

**Sixteen rows ticked and created, nine kept, seven retracted, one tombstone
reinstated, eleven edges, two filings.** Corpus +10 and component **+8**, which
is the first sweep batch since batch 11 where the two numbers differ, and
amendment A5 asks why.

**Why: `ethiopian-civil-war` and `tigray-war` went into a fragment and not into
the middle.** The Ogaden war and the Somali civil war have been a component of
two since batch 11 joined them; this batch put the Ethiopian civil war and the
Tigray war beside them and made it a component of **four**, the second-largest
fragment in the atlas after the Sudanese five. That is a corner of the world
opening, which is what a sweep batch does, and it is not a failure to write an
edge: **there is no honest edge out of it and §2p below says what each end of
it waits for.**

### The Horn of Africa, and why it stays a fragment

`ethiopian-civil-war` is the record batch 13's `tigray-war` retraction named by
name — *"it waits on a record of the Ethiopian Civil War, which is the record
its own background starts from"* — and the Tigray article's own § Historical and
political context opens exactly there, so the reinstatement was written the
moment the record existed. That is the twelfth tombstone this milestone has
brought back on its own note.

What the cluster cannot do is reach the rest of the atlas. The civil war's
infobox files it under "the Eritrean War of Independence, the Ethiopian–Somali
conflict, the Oromo conflict, **the Cold War, and the Revolutions of 1989**".
Two of those five are classes rather than events; two are wars this atlas does
not hold; and the fifth, `revolutions-of-1989`, **is a record here and rule 4
forbids the edge** — a war that began on 12 September 1974 cannot be caused by
1989, and the date was not widened, which is deviation 989's rule. The body
offers no other reach: the Soviet Union and Cuba appear as intervening powers
and not as records, and the sentence that would most like to be an edge —
"the Soviet Union began ending its support for the Derg in the late-1980s and
the government was overwhelmed by the increasingly victorious rebel groups" —
names no event. The article never mentions either Italo-Ethiopian war, which
are the two records here a reader would expect it to reach.

**So the Horn is the second Sudan** (§2g): records joined to each other and to
nothing else, waiting on a page rather than on a fetch. The nearest missing
record is the Eritrean War of Independence, and importing it would make the
fragment five rather than join it.

### The sixteen

§5's rule over a pool recomputed at **1,159 rows**, sixteen fewer than batch
14's 1,175. Set 3 took the thinnest six decades (1900s at 16 active events,
1890s at 17, 1980s and 2000s at 23, 1930s and 1950s at 24) and set 4 the rest
by sitelinks. All sixteen passed the class table this time.

### The edges

Eleven. Nine run from a record the atlas already held into one of this batch's;
`jameson-raid --precondition-of--> second-boer-war` runs the other way, and
`ethiopian-civil-war --enabled--> ogaden-war` and
`ethiopian-civil-war --precondition-of--> tigray-war` are the pair inside the
Horn fragment.

#### `ethiopian-civil-war --enabled--> ogaden-war` and `ethiopian-civil-war --precondition-of--> tigray-war`

*"Ethiopian Civil War"*, revision 1375950588, § Somali insurgency and Ogaden
War — a subsection of § War, which is where the article puts the Ogaden war in
its own account: "by June 1977, the Western Somali Liberation Front (WSLF) had
been successful in forcing the Ethiopian army out of much of the Ogaden…
President of Somalia Siad Barre decided to intensify the war by involving the
Somali army as he believed it would allow the WSLF to press home their growing
victories… **On 13 July 1977, the Ogaden War was triggered when the Somali
Democratic Republic invaded the Ogaden region in order to assist the WSLF.**"
`enabled` and not `caused`: what the civil war supplied was an Ethiopian army
already losing ground, and the article credits the invasion to Barre.

The second edge is read from the other end. *"Tigray war"*, revision 1374637577,
§ Historical and political context: **"following the end of the Ethiopian Civil
War in 1991, Ethiopia became a dominant-party state under the rule of the
Ethiopian People's Revolutionary Democratic Front (EPRDF)… The founding and
most influential member was the Tigray People's Liberation Front (TPLF), led by
Meles Zenawi."** The civil war's own infobox says the same from its side —
among its results, "installation of the TPLF-led transitional government which
would later become the EPRDF government in Ethiopia". The party that lost power
in 2018 and fought in 2020 is the one that won in 1991.

#### `world-war-ii --enabled--> operation-reinhard`

*"Operation Reinhard"*, revision 1367661549. The lead: it "was the codename of
the secret German plan **in World War II** to exterminate Polish Jews in the
General Government district of German-occupied Poland. This deadliest phase of
the Holocaust was marked by the introduction of extermination camps."
§ Background dates the decision to the war's turn east: **"after the
German–Soviet war began, the Nazis undertook their European-wide 'Final
Solution to the Jewish Question'. In January 1942, during a secret meeting of
German leaders chaired by Reinhard Heydrich, Operation Reinhard was drafted"**,
and within months the camps at Bełżec, Sobibór and Treblinka were built.
`enabled`, because the war supplied the occupied territory and the secrecy and
the article credits the plan to the men who drafted it.

#### `world-war-i --precondition-of--> polish-ukrainian-war`

*"Polish–Ukrainian War"*, revision 1372213817. The infobox reads "part of the
Ukrainian War of Independence and **the aftermath of World War I**", and the
lead says how: **"the war started in Eastern Galicia after the dissolution of
the Austro-Hungarian Empire and spilled over into the Chełm and Volhynia
regions formerly belonging to the Russian Empire."** Two empires had governed
that ground in 1914 and neither existed in November 1918, which is what the two
sides fought over. This is the fourth record the atlas draws out of the
collapse of 1918, beside `polish-soviet-war`, `estonian-war-of-independence`
and `treaty-of-tartu`.

#### `world-war-ii --enabled--> anglo-iraqi-war`

*"Anglo-Iraqi War"*, revision 1372842948. The short description calls it "a
1941 campaign during World War II" and the infobox files it under "the
Mediterranean and Middle East theatre of World War II", with Nazi Germany
listed as giving military support to the Iraqi side. § Mandatory Iraq gives the
quarrel, and dates it to 1930: Britain governed Iraq under a League of Nations
mandate until 1932 and before granting independence "concluded the Anglo-Iraqi
Treaty of 1930, which included permission to establish military bases for
British use, and allowed unrestricted movement of British forces through the
country upon request… **the conditions of the treaty were imposed by the
British to ensure control of Iraqi petroleum. Many Iraqis resented these
conditions.**" The grievance is older than the war; what the war supplied was a
Britain that could be fought and an Axis that would help.

#### `munich-agreement --precondition-of--> slovak-hungarian-war` and `first-vienna-award --precondition-of--> slovak-hungarian-war`

*"Slovak–Hungarian War"*, revision 1370747590, § Prelude, which argues both in
four sentences. On the first: **"after the Munich Pact, which weakened Czech
lands to the west, Hungarian forces remained poised threateningly on the Slovak
border"** — a bluff, the article says, "but had been encouraged by Germany". On
the second: Germany and Italy "pressured the Czechoslovak government to accept
their joint Arbitration of Vienna. On 2 November 1938, it found largely in
favour of Hungary and obliged Czechoslovakia to cede to Hungary 11,833 km² of
the south part of Slovakia… The partition also cost Košice, Slovakia's second
largest city." And then: **"the First Vienna Award did not fully satisfy
Hungary, which carried out 22 border clashes between 2 November 1938 and 12
January 1939."** Two months after the last of those the war began. Two
preconditions on one record, argued by one section, is the shape this atlas is
for.

#### `jameson-raid --precondition-of--> second-boer-war`

*"Jameson Raid"*, revision 1370624782, § lead, in those words: **"the raid was
a contributory cause of the Second Boer War."** What it contributed is listed
just before — the raid of 29 December 1895 "was intended to trigger an uprising
by the primarily British expatriate and settler workers (known as Uitlanders)
in the Transvaal, but it failed", and its results "included embarrassment of
the British government; the replacement of Cecil Rhodes as prime minister of
the Cape Colony; and **the strengthening of Boer dominance of the Transvaal and
its gold mines**". `precondition-of`, because "contributory cause" is what the
article claims and no more. This is the batch's one edge into a record the
atlas has held since M40, and the only southern African edge in the corpus.

#### `kosovo-war --precondition-of--> 2001-insurgency-in-macedonia`

*"2001 insurgency in Macedonia"*, revision 1375673043, § lead: the conflict
"began in the Republic of Macedonia in 2001 when the ethnic Albanian National
Liberation Army (NLA) insurgent group, **formed from veterans of the Kosovo War
and insurgency in the Preševo Valley**, attacked Macedonian security forces at
the end of January 2001, and ended with the Ohrid Agreement, signed on 13
August of that same year". The article is careful about motive — "there were
also claims that the NLA ultimately wished to see Albanian-majority areas
secede from the country" — and the edge claims only the continuity of fighters
the lead states. It is the seventh record of the Yugoslav wars' aftermath here.

#### `soviet-afghan-war --precondition-of--> afghan-civil-war`

*"Afghan Civil War (1989–1992)"*, revision 1371765193. The article defines this
war by the end of the last one: it "took place between **the Soviet withdrawal
from Afghanistan on 15 February 1989 which ended the Soviet–Afghan War**, and
27 April 1992, the day after the proclamation of the Peshawar Accords". Its
whole § Background (1978–1989) is the earlier war — the mujahideen revolt of
October 1978, the 1979 invasion, nine years in which "between 500,000 and 2
million Afghans were killed", and Gorbachev's withdrawal of May 1988 to
February 1989 — and the combatants of 1989 are the two sides that war left
standing. **It does not clear `tajikistani-civil-war`**, which batch 13
retracted waiting on "the Afghan Civil War of 1992–1996": that is the *next*
phase and a different record, and the Tajik article names it by its dates.

#### `2011-egyptian-revolution --inspired--> 2011-yemeni-revolution`

*"Yemeni revolution"*, revision 1375746838. **"By February, opposition leader
Tawakel Karman called for a 'Day of Rage' in the mold of mass nationwide
demonstrations that helped to topple the government of Tunisia and put pressure
on the government of President Hosni Mubarak in Egypt"**, and **"after Mubarak
quit power in Egypt, demonstrators celebrating the revolution and calling for a
similar uprising in Yemen were attacked by police and pro-Saleh tribesmen."**
The infobox lists among the causes "inspiration from concurrent regional
protests" and files the revolution under the Arab Spring, which this atlas does
not hold for want of a lane the owner has not decided (975). `inspired` is the
type for exactly this and the article supports no stronger one: the Yemeni
protests began in January 2011, before Mubarak fell. **This is the milestone's
first `inspired` edge** and the fifth type's first use in it.

### The seven retracted, and what each waits for

| record | what its article argues, and what is missing |
| --- | --- |
| `japan-korea-treaty-of-1907` | Revision 1369056589, eight kilobytes, argues out of the Eulsa Treaty of 1905 and the Hague Secret Emissary Affair and forward to the treaty of 1910 — none a record here. The Russo-Japanese war, which this atlas holds and which every history puts behind the 1905 protectorate, is **not mentioned in the article at all**. Waits on the Eulsa Treaty |
| `ifni-war` | Revision 1370623332 argues out of the Hispano-Moroccan war of 1859–1860 and Moroccan independence in 1956 — "after Morocco achieved independence in 1956, it sought to claim Spain's remaining possessions in West Africa" — and forward to the Treaty of Angra de Cintra, the return of Ifni in 1969 and the Green March of 1975. `french-conquest-of-morocco`, which batch 14 imported and which ends in 1937, is not mentioned. Waits on Moroccan independence |
| `international-convention-on-the-elimination-of-all-forms-of-racial-discrimination` | Revision 1372930206 traces the convention to a General Assembly resolution of December 1960 "following incidents of antisemitism in several parts of the world". The only record here it names is `charter-of-the-united-nations`, as the instrument such hatred violates rather than as something the convention answered — a legal citation and not a consequence. Waits on the 1960 resolution |
| `ottawa-treaty` | Revision 1354825098, a hundred and eighteen kilobytes on what the treaty obliges and who has signed, argues it out of the landmine problem in general and the International Campaign to Ban Landmines, and names no war this atlas holds. The sixth instrument this milestone has retracted for §7.4's reason, generalised |
| `soweto-uprising` | Revision 1369412868 files it under "the internal resistance to apartheid" and argues out of the Bantu Education policy and the Afrikaans-medium decree, forward to international condemnation and the Transkei bantustan. This atlas holds no South African record but `second-boer-war`, and the article names neither it nor the Angolan and Mozambican independences of 1975. Waits on any South African record of the apartheid period |
| `nepalese-civil-war` | Revision 1375833499 has **no background section at all**: its § Overview begins with the United Left Front of January 1990 and its timeline runs year by year from 1996. Every actor in it is Nepali; the atlas's South Asian records are the partition of India, the Indo-Pakistani wars, Kargil and the Sino-Indian war, and none is mentioned. Waits on any Himalayan neighbour |
| `assassination-of-charlie-kirk` | Revision 1375772690, an account of a killing eleven days ago and of the reaction to it, naming no event this atlas holds. **It is also a record whose article is being rewritten hourly**, so a revision cited today is not the article a reader will open |

**The last of the seven is worth a sentence about the rule rather than about
the record.** Set 4 ranks by sitelinks and a story in the news accumulates them
fast: that is how a row eleven days old came to be among the sixteen best
remaining in a pool of 1,159. The rule is not wrong — an atlas of the world
does want what the world has written about — but a sitelink count is a
measurement of attention and attention is fastest when it is newest. A batch
that finds a fortnight-old event at the top of its set 4 should retract it and
say so, which is what this one did.

### The nine left main, the two filed, and the one reinstated

Two were filed, both on a sentence the article states and neither naming an
actor or a place, which is M67 A1 and A1's note obligation:

- **`operation-reinhard` under `the-holocaust`.** The article's second sentence
  calls it "this deadliest phase of the Holocaust"; March 1942 to November 1943
  is inside the Holocaust's 1933–1945; the perpetrators are the same. **No actor
  line was invented.**
- **`anglo-iraqi-war` under `world-war-ii`.** The infobox files it under "the
  Mediterranean and Middle East theatre of World War II" and the short
  description calls it "a 1941 campaign during World War II"; May 1941 is inside
  the war's span; Britain and Nazi Germany are on the two sides. Same note.

`tigray-war` came back active with `m42-reinstated` on it and no new record
written; its retraction reason was correct when it was written and the record it
named now exists.

The other nine are top-level and every one carries `actors: []`:
`ethiopian-civil-war`, `polish-ukrainian-war`, `slovak-hungarian-war`,
`jameson-raid`, `2001-insurgency-in-macedonia`, `afghan-civil-war`,
`2011-yemeni-revolution`, and the two the batch put into the Horn fragment are
among them. **None is anybody's part in this atlas.**
`2001-insurgency-in-macedonia` would want `yugoslav-wars`, which ends before it
begins; `afghan-civil-war` and `2011-yemeni-revolution` would want the Afghan
conflict and the Arab Spring as umbrellas and the atlas holds neither;
`slovak-hungarian-war` sits between Munich and the outbreak of the world war
and is inside neither; `jameson-raid` precedes the Boer war rather than
belonging to it, which is what `precondition-of` says and `parent` would deny.

`docs/m53-polities.md` §4.1 accordingly moves to **306 of 445**.

### What batch 15 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 435 | **445** |
| main | 335 | **343** |
| filed under a parent | 100 | **102** |
| active edges | 528 | **539** |
| largest connected component | 412 | **420** |
| components | 12 | **12** |
| active events with no edge | 3 | 3 |
| unreachable from any Portuguese event | 15 | 17 |

**Ten and eight**, and the two that are missing are the Horn of Africa. The
unreachable count rising by two is the same two records said another way. This
is the honest shape of a sweep that opens a region the atlas has never had:
the component does not move, a fragment does, and the run says which.

## 2p. Batch 16 — the worst yield of the run, and what it is telling the rule

**Sixteen rows ticked, fifteen created and one refused at the class table, six
kept and nine retracted, seven edges, one filing.** Corpus +6, component +4,
Horn fragment 4 → 6. **Six of sixteen is the lowest keep rate of any sweep
batch**, against twelve, twelve and nine before it, and the reason is not bad
luck: §5's pool has been walked down from 1,586 to 1,143 over ten batches and
what is left at the top of it by sitelinks is increasingly **instruments and
very recent events**, which are the two classes this atlas has nothing to join.

`Q1366688`, the Trans-Pacific Partnership, was refused at the class table —
its one class `Q252550` is not in `data/imports/wikidata-seeds.json` and none
was added, which is deviation 1005 — and four of the nine retracted are
instruments: the ADR road-haulage agreement, the African Charter, the UN
Convention Against Corruption, and, at one remove, the Treaty of Lhasa. **That
is eight instruments this milestone has now retracted on arrival**, and §7.4's
environment-shaped hole is the general case of it: *an instrument that decided
nothing this corpus holds has nothing here to be joined to.*

### The edges

Seven. Four run into the main component and three into the Horn.

#### `eritrean-war-of-independence --precondition-of--> ethiopian-civil-war`

*"Ethiopian Civil War"*, revision 1375950588: **"groups like the Eritrean
Peoples Liberation Front (EPLF) and the Western Somali Liberation Front (WSLF)
had already been fighting against the Ethiopian Empire in the northern Eritrean
War of Independence and southern Ogaden insurgency"**, and the Derg "used large
scale counterinsurgency military campaigns and the Qey Shibir (Red Terror) to
repress the rebels". *"Eritrean War of Independence"*, revision 1374058781,
files itself under the civil war in turn — its infobox reads "part of
Opposition to Haile Selassie, **the Ethiopian Civil War**, the Cold War, the
Sino-Soviet split, the conflicts in the Horn of Africa, and the Revolutions of
1989" — but it begins in 1961 and the civil war in 1974, so it is a precondition
of it and **no `parent` was written**, a child dated outside its parent being a
warning rule 24 would raise.

#### `eritrean-war-of-independence --precondition-of--> eritrean-ethiopian-war` and `ethiopian-civil-war --precondition-of--> eritrean-ethiopian-war`

*"Eritrean–Ethiopian War"*, revision 1372677015, § lead, one sentence carrying
both: **"from 1961 until 1991, Eritrea fought a 30-year war of independence
against Ethiopia; during this period, the Ethiopian Civil War also began on 12
September 1974, when the Derg staged a coup d'état against Emperor Haile
Selassie. Both conflicts lasted until 1991 when the Ethiopian People's
Revolutionary Democratic Front (EPRDF) – a coalition of rebel groups led by the
Tigray People's Liberation Front (TPLF) – overthrew the Derg government, and
installed a transitional government in the Ethiopian capital Addis Ababa."**
Eritrea's independence is what made the border of 1998 a border between states,
and the governments on both sides of it in 1998 are the two that won in 1991.
Both edges are `precondition-of` and claim no motive: the article gives the
war's own cause as the border and the town of Badme.

**The Horn fragment is now six** — the Eritrean war of independence, the
Eritrean–Ethiopian war, the Ethiopian civil war, the Tigray war, the Ogaden war
and the Somali civil war — and §2o's reading is unchanged and now better tested:
importing the record its infobox named grew the fragment and did not join it, as
§2o said it would. **It is the largest fragment in the atlas**, past the Sudanese
five. What all six wait on is the same thing: a page that argues a line from the
Horn to anything else this corpus holds, and none of the six articles has one.

#### `heligoland-zanzibar-treaty --precondition-of--> zanzibar-revolution`

*"Zanzibar Revolution"*, revision 1375266442, § Background, which names the
treaty: Zanzibar was "formally separated from German East Africa in 1890" and
"had become fully independent in 1963… as a result of Britain giving up its
protectorate over it", and, again, **"in 1890 during Ali ibn Sa'id's reign,
Zanzibar became a British protectorate after the Heligoland–Zanzibar Treaty
separated British and German territory in Central Africa during the Scramble
for Africa"**. What the revolution of 12 January 1964 overthrew was the Sultan
the protectorate had left in place a month before, the Arab minority having
"succeeded in retaining the hold on power it had inherited" through the
elections that preceded independence. Seventy-four years is a long edge and the
article is what makes it one. `heligoland-zanzibar-treaty` is a batch 10 import
and `anglo-zanzibar-war` a batch 10 reinstatement; this is the third record of
that cluster and the first since.

#### `spanish-civil-war --caused--> spanish-revolution`

*"Spanish Revolution of 1936"*, revision 1369913897, § lead: it **"was a social
revolution that began at the outbreak of the Spanish Civil War in 1936,
following the attempted coup to overthrow the Second Spanish Republic and arming
of the worker movements and formation of militias to fight the Nationalists"**,
and featured "takeover of power at local levels by the Spanish workers'
organizations and social movements, seizure and reorganization of economic
facilities directed by trade union groups and local committees". Its infobox
reads "part of the Spanish Civil War" and its end is the war's — "end of
revolutionary management principles with the victory of the Nationalists and the
dissolution of the Republic" — so it is filed under the war as well as edged
from it.

#### `white-revolution --precondition-of--> iranian-revolution`

*"White Revolution"*, revision 1364402941. The article ends the White Revolution
at the revolution that overthrew its author — the reforms were "launched on 26
January 1963 by the Shah, Mohammad Reza Pahlavi, and **ended with his overthrow
in 1979**" — and names who they turned against him: **"the revolution also
aroused the antagonism of the *Ulama* (Islamic clergy) led by Ruhollah Khomeini,
the future leader of the 1979 Islamic Revolution, who opposed the erosion of
their traditional bases of power"**, together with "a high failure rate for new
farms and an exodus of agricultural workers to Iran's major cities". It adds
that the criticism came "from two main groups: the clergy, and the landlords".
`precondition-of`: the article says the reforms made the opposition that later
led the revolution, not that they caused it.

#### `french-conquest-of-morocco --reacted-to--> rif-war`

The conquest's own article — *"French conquest of Morocco"*, revision
1374837625 — carries the Rif war as a section of itself and describes it as a
reaction: **"Sultan Yusef's reign, from 1912 to 1927, was turbulent and marked
with frequent uprisings against Spain and France. The most serious of these was
a Berber uprising in the Rif Mountains, led by Abd el-Krim**, who managed to
establish a republic in the Rif. Though this rebellion began in the
Spanish-controlled area in the north, it reached the French-controlled area. A
coalition of France and Spain finally defeated the rebels in 1926." The Rif
war's own article agrees on the ground: the Spanish advance "began in 1911 with
the Larache landing", and after the Treaty of Fez "the northern Moroccan area
was adjudicated to Spain as a protectorate. The Riffian populations strongly
resisted the Spanish." **`rif-war` is not filed under the conquest** although
1911–1927 falls inside 1907–1937: the rising was principally against Spain and
the record here is of the *French* conquest, which is exactly the arguable case
M62 §3 says to list rather than file. `french-conquest-of-morocco` is a batch 14
import and this is its second edge.

### The nine retracted, and what each waits for

| record | what its article argues, and what is missing |
| --- | --- |
| `treaty-of-lhasa` | Revision 1305728166: signed "following the British expedition to Tibet of 1903–1904… and was followed by the Anglo-Chinese Convention of 1906", neither a record here, with Younghusband's purpose framed as the Great Game. `british-russian-convention` of 1907, which this atlas holds and which settled Tibet between the two empires, **is not mentioned at all**. Waits on the British expedition to Tibet |
| `1893-franco-siamese-crisis` | Revision 1374343940 argues out of French Indochina's expansion up the Mekong and forward to the Franco-Siamese treaty of October 1893. The atlas holds nothing of mainland Southeast Asia before `first-indochina-war` of 1946. Waits on any Siamese or Indochinese neighbour |
| `agreement-concerning-the-international-carriage-of-dangerous-goods-by-road` | Revision 1363643181 is an account of what the 1957 agreement classifies and how its annexes are revised, and argues it out of nothing at all. §7.4's reason applied to a road-haulage treaty |
| `african-charter-on-human-and-peoples-rights` | Revision 1308579780 traces the charter to a 1979 Organisation of African Unity decision; the OAU is not a record here. Waits on a record of African decolonisation or of the OAU |
| `united-nations-convention-against-corruption` | Revision 1348358226, forty kilobytes on chapters, review mechanism and states parties; no event this atlas holds appears in it |
| `sierra-leone-civil-war` | Revision 1375466974 files it under "the West African Crisis and **spillover of the First and Second Liberian Civil Wars**", with Charles Taylor's Greater Liberia a combatant. No Liberian record here, and the article does not mention `mali-war`, the atlas's one West African record of the period. Waits on the First Liberian Civil War |
| `libyan-civil-war-q16911838` | **The surprise of the batch.** Revision 1374738410, two hundred and twenty-six kilobytes, has a background section titled "Background of discontent with General National Congress" and argues the war of 2014 out of the GNC elected in 2012, the failure of its parties to compromise, the political isolation law and the extension of its own mandate — and **never argues a line back to the war of 2011**, which this atlas holds. The only mention of it is a hatnote distinguishing two articles, and a hatnote is not a claim. Waits on a page that argues the second Libyan war out of the first |
| `myanmar-civil-war` | Revision 1375700231: the war "began following the military coup on 1 February 2021", and the older insurgencies go back to the 1962 coup and the 8888 uprising. The atlas holds nothing at all of Burma or Myanmar. Waits on the 2021 coup |
| `2023-brazilian-congress-attack` | **The one a Portuguese-language atlas should mind.** Revision 1372449713 gives the causes as "false allegations of electoral fraud in the 2022 Brazilian general election promoted by former President Jair Bolsonaro and his allies", and its § Background is that election and the January 6 Capitol attack of 2021. This atlas holds `the-2018-brazilian-general-election` **and not the 2022 one**. The article does link the rioters' call for a "military intervention" to the coup of 1964, but as a gloss on a phrase rather than as a claim about influence, and an edge read off a wikilink target is not an edge read off a sentence. Waits on the 2022 Brazilian general election, which is a one-row gap a later batch can close |

### The five left main and the one filed

`spanish-revolution` is filed under `spanish-civil-war`: 19 July 1936 onwards is
inside 1936-07-18 to 1939-04-01, the article's own infobox says "part of the
Spanish Civil War", and the militias and workers' organisations that made it are
the Republic's side of the war. It names neither an actor nor a place, so the
filing is made on the record's context, which is amendment A1 of
`docs/m67-umbrellas.md` and this paragraph is the note it requires. **No actor
line was invented.**

The other five are top-level and carry `actors: []`:
`eritrean-war-of-independence`, `eritrean-ethiopian-war`, `zanzibar-revolution`,
`white-revolution` and `rif-war`. The first would want the Ethiopian civil war
and is dated thirteen years before it; the second would want the Horn's own
period and there is none; `zanzibar-revolution` and `white-revolution` are
nobody's part here; and `rif-war`'s case is argued above.

`docs/m53-polities.md` §4.1 accordingly moves to **306 of 451**.

### What batch 16 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 445 | **451** |
| main | 343 | **348** |
| filed under a parent | 102 | **103** |
| active edges | 539 | **546** |
| largest connected component | 420 | **424** |
| components | 12 | **12** |
| active events with no edge | 3 | 3 |
| unreachable from any Portuguese event | 17 | 19 |

**Six and four**, with the missing two in the Horn again. Read across batches 13
to 16 the sweep's yield is **twelve, twelve, nine, six**, and the fall is what
§5's ordering does as the pool is walked down: sets 3 and 4 rank by sitelinks
and by thin decades, and once the rows a corpus of 450 records has a neighbour
for are spent, what the ranking keeps offering is treaties nobody here signed
and wars in countries this atlas has never held. **That is not an argument for
changing the rule** — it is the rule reporting the shape of the corpus, which is
what it is for — but it is the number a run should plan its hour against:
**about half a sweep batch now.**

## 2q. Batch 17 — set 0, and what reading the tick list against the tombstones buys

**Sixteen rows taken by the rule, fifteen ticked and one refused before the
fetch, fifteen created, fourteen kept and one retracted, nine tombstones back,
nineteen edges, one filing.** Corpus +23, component +9, component count 12 → 18.

This is the first batch under **set 0 of §5 of `docs/m42-pool.md`**, written
before a box was ticked and computed over `data/events/*.json` on the day: the
pool rows whose English label appears inside the `retraction.reason` of a record
that is retracted now. Twelve rows matched. One was dropped by reading the
sentence — `Q1972326` is the **Treaty of Lausanne of 1912**, which ended the
Italo-Turkish war, and the reason that named "the treaty of Lausanne in 1923"
was `2016-turkish-coup-d-etat-attempt`'s, about a different treaty the atlas
already holds as `treaty-of-lausanne`. So set 0 contributed eleven, and set 4
topped the batch up to sixteen with the best remaining by sitelinks, in item-id
order at the 38-sitelink tie: `Q161141`, `Q278960`, `Q301336`, `Q638903` and
`Q665554`.

**`Q638903` was refused before the fetch**: it is the 5 October 1910 revolution
in Portugal, which this atlas has held since its first week as
`republic-proclaimed-1910`. That record carries no `wikidata`, which is why the
pool did not know it was held, and importing the item would have written a
second record of one event. The right repair is the additive one — put `Q638903`
on the record that exists — and it is not this batch's, because
`tools/import/identity.mjs` fills a gap on a record the import can *find*, and
it finds by id. It is written down here instead (**deviation 1006**).

### The nine tombstones, which are what set 0 is for

Each was retracted with a reason naming the record it waited for, and this
batch imported that record. None was reinstated because it looked reinstatable:
the sweep row and the reason are the same sentence read from two ends.

| back | it waited for | now |
| --- | --- | --- |
| `japan-korea-treaty-of-1907` | the 1910 annexation its own article argues forward to | `japan-korea-treaty-of-1910` |
| `first-matabele-war` | the Second Matabele War its article argues forward to | `second-matabele-war` |
| `tajikistani-civil-war` | "a record of the Afghan Civil War of 1992–1996" | `afghan-civil-war-q1980081` |
| `sierra-leone-civil-war` | "the First Liberian Civil War" | `first-liberian-civil-war` |
| `colombian-conflict` | "a record of La Violencia" | `la-violencia` |
| `1957-1958-influenza-pandemic` | the Hong Kong flu of 1968–1970 | `hong-kong-flu` |
| `black-monday` | "a record of the Louvre Accord" | `louvre-accord` |
| `panic-of-1893` | the Baring crisis its article lists first among the causes | `baring-crisis` |
| `montreal-protocol` | "the 1985 Vienna Convention for the protection of the ozone layer" | `vienna-convention-for-the-protection-of-the-ozone-layer` |

**Nine in one batch, against the eleven batches 10 to 12 found between them and
the none of batches 13 and 14.** The vein §7 called thinning was not thinning;
it was being asked the wrong way round. Scanning the reasons for a record that
has *already* become active finds what earlier batches happened to import.
Choosing the import *from* the reasons finds it on purpose.

### Step 0, the tombstone scan, which ran first and came back empty

Thirty-four retracted records name an active record somewhere in their reason,
and every one was read. None was unlocked by a record that was already here:
the four §5b keeps on the list — `velvet-revolution`, `second-chechen-war`,
`second-nagorno-karabakh-war`, `hungarian-revolution-of-1956` — each still names
a different missing record (the first Chechen war, the first Nagorno-Karabakh
war, the fall of the Wall), and none of those is a record or a pool row this
batch could take. One near-miss is worth writing down, because it is the shape
of the mistake set 0 could make: `tajikistani-civil-war`'s reason names "the
Afghan Civil War of 1992–1996", and the atlas already held an `afghan-civil-war`
— **but that record is `Q2405009`, the war of 1989–1992, a different war.** The
tombstone came back on the record imported for it and not on the one whose title
looked right.

### The edges

Nineteen. **Nine ends land in the main component and ten open six new pairs and
trios**, which is the whole of what §4b below has to say about this batch.

#### Into the main component

`treaty-of-versailles --precondition-of--> kapp-putsch`. The English article
puts the trigger in the treaty: Germany "was required to reduce its land forces
to a maximum of 100,000 men... Freikorps units were expected to be disbanded",
and it is the order to disband the Marine Brigade under that ceiling that
Lüttwitz refused. Second source: Sturm 2011, the work the article hangs that
sentence on.

`german-revolution-of-1918-1919 --reacted-to--> kapp-putsch`. The article's
first paragraph: the putsch's "goal was to undo the German Revolution of
1918–1919, overthrow the Weimar Republic, and establish an autocratic
government."

`potsdam-declaration --precondition-of--> japanese-instrument-of-surrender`.
The declaration is formally the "Proclamation Defining Terms for Japanese
Surrender"; the instrument formalises the acceptance of those terms. The edge
claims that the declaration set what a surrender would have to say, and not
that it is what made Japan surrender.

`japan-korea-treaty-of-1907 --precondition-of--> japan-korea-treaty-of-1910`,
from the 1910 article's own sentence naming the 1905 and 1907 treaties it
completes. The 1905 Eulsa treaty is not a record here and no edge is written
for it.

`japan-korea-treaty-of-1910 --precondition-of--> korean-war`. The Korean War's
article opens its background at the annexation and gives it a section,
"Japanese colonization (1910–1945)". Second source: Schnabel 1972, pp. 3, 18,
22. **This is the edge that puts the Korean pair in the middle rather than
beside it**, and it was found by reading the article at the far end, not the
near one.

`jameson-raid --precondition-of--> second-matabele-war`: "Only a few months
earlier... Jameson had sent most of his troops and armaments to fight the
Transvaal Republic in the ill-fated Jameson Raid. This left the country nearly
defenceless."

`first-matabele-war --precondition-of--> second-matabele-war`, which is what
both articles argue and what the 1893 record's own retraction reason said it
was waiting for.

`afghan-civil-war --precondition-of--> afghan-civil-war-q1980081`: "The war
immediately followed the 1989–1992 civil war with the Mujahideen victory and
dissolution of the Republic of Afghanistan in April 1992."

`afghan-civil-war-q1980081 --caused--> afghan-civil-war-q12302518`, in the
article's own words: "The events of this war lead to the Afghan Civil War
(1996–2001)."

`afghan-civil-war-q1980081 --enabled--> tajikistani-civil-war`. The Tajik
article's infobox files the war as part of "the post-Soviet conflicts and
spillover of the Afghan Civil War (1992–1996)". **An infobox `part_of` is not a
hatnote** — batch 16 refused `libyan-civil-war-q16911838` because a hatnote is a
disambiguation device and asserts nothing — it is the article stating what the
war was part of. The claim is spillover, so the type is `enabled`; the prose
does not argue the Afghan war as the Tajik war's origin and neither does this
edge.

#### Opening a corner rather than reaching the middle

`first-liberian-civil-war --enabled--> sierra-leone-civil-war` (second source:
Gberie 2005, p. 56), `first-liberian-civil-war --precondition-of-->
second-liberian-civil-war` and `sierra-leone-civil-war --reacted-to-->
second-liberian-civil-war` make **a West African trio**. Nothing in any of the
three articles reaches a record this atlas holds: no Gaddafi, no ECOWAS record,
no Special Court, and `mali-war` — the one other West African record — is named
by none of them.

`la-violencia --precondition-of--> colombian-conflict` (second source: Leech
2009, pp. 242–247) makes **a Colombian pair that does not join the Colombian
records already here**. La Violencia's article does not mention the Thousand
Days' War at all, and `thousand-days-war` and `hay-bunau-varilla-treaty` remain
their own fragment of two. The atlas now holds four Colombian events in two
disconnected pieces, which is honest and is worth a reader's seeing.

`1957-1958-influenza-pandemic --precondition-of--> hong-kong-flu` (second
source: Jester, Uyeki and Jernigan 2020) rests on descent of the virus and not
on resemblance between pandemics: the 1968 virus "was descended from H2N2
(which caused the Asian flu pandemic in 1957–1958) through antigenic shift".
`covid-19-pandemic` is in the middle and neither article argues a line to it.

`louvre-accord --precondition-of--> black-monday` (second source: Cohen 2007,
p. 65) is the article's explicitly *second* explanation of the crash, which is
why it is `probable`.

`baring-crisis --precondition-of--> panic-of-1893`, first in the panic
article's own list of causes.

`vienna-convention-for-the-protection-of-the-ozone-layer --precondition-of-->
montreal-protocol`: "20 nations, including most major CFC producers, signed the
Vienna Convention, which established a framework for negotiating international
regulations on ozone-depleting substances." **This is the atlas's first
environmental pair**, and §7.4's hole is exactly why it is only a pair.

`partial-nuclear-test-ban-treaty --precondition-of-->
treaty-on-the-non-proliferation-of-nuclear-weapons` takes the nuclear fragment
from two records to three: "The PTBT has been considered the stepping stone to
the Treaty on the Non-Proliferation of Nuclear Weapons (NPT) of 1968, which
explicitly referred to the progress provided by the PTBT."

### The one retracted, and what it waits for

`aarhus-convention` — eleven kilobytes that argue the convention out of
principle 10 of the Rio Declaration and forward to nothing. The Rio Declaration
is not a record here; the two environmental records this same batch brings are
about chlorofluorocarbons, which an information-access convention answered
nothing about. **The ninth environmental instrument retracted on arrival.** It
waits on a record of the Rio Earth Summit of 1992.

### The one filed

`japanese-instrument-of-surrender` under `world-war-ii`, whose span ends on the
day the instrument was signed. It is the batch's only available filing: the
other twenty-two are wars, pandemics, financial crises and instruments that are
not part of any record this atlas holds. §3 below is where that is argued.

### The fourteen kept, and the one refused

Kept: `japanese-instrument-of-surrender`, `kapp-putsch`,
`japan-korea-treaty-of-1910`, `second-matabele-war`,
`afghan-civil-war-q1980081`, `afghan-civil-war-q12302518`,
`partial-nuclear-test-ban-treaty`,
`vienna-convention-for-the-protection-of-the-ozone-layer`, `la-violencia`,
`first-liberian-civil-war`, `second-liberian-civil-war`, `hong-kong-flu`,
`louvre-accord`, `baring-crisis`. Retracted: `aarhus-convention`. Refused
before the fetch: `Q638903` and `Q1972326`.

### What batch 17 did to the graph

| | before | after |
| --- | --- | --- |
| active events | 451 | **474** |
| main | 348 | **370** |
| filed under a parent | 103 | **104** |
| active edges | 546 | **565** |
| largest connected component | 424 | **433** |
| components | 12 | **18** |
| active events with no edge | 3 | 3 |
| unreachable from any Portuguese event | 19 | 33 |

**Fourteen of fifteen kept, against six of fifteen in batch 16.** Set 0 more
than doubles the yield, and the reason is structural rather than lucky: a row
chosen because a tombstone names it arrives with a neighbour already written
down, so the connection pass is reading one page to confirm a link the corpus
proposed, not searching a page for any link at all.

**But the component grew by nine while the corpus grew by twenty-three, and
A5 asks about that.** The answer is in the table above the edges: nine of the
twenty-three joined the middle and fourteen did not, because **a tombstone is
a note of what is missing, and where the tombstone was is where its record
lands.** Nine of the nine that reached the middle are records whose waiting
neighbour was itself in the middle — the Korean war, the Jameson raid, the
Versailles treaty, the Afghan civil war of 1989–1992, the Potsdam declaration.
The other six pairs and trios are records whose waiting neighbour was *also* a
tombstone, and two tombstones joined to each other are a fragment however
honest the edge between them. **Set 0 buys keep rate; it does not by itself buy
reach.** A batch that wants reach should order set 0 by whether the waiting
tombstone's other end is in the largest component, which is a question
`tools/m42-pool.mjs` can already answer, and that is the rule the next fire
should write before it ticks (**deviation 1007**).

The count of components rising from twelve to eighteen is the same fact said
the other way, and it is the number batch 12 predicted: *"a sweep batch adds
ten or eleven records and opens a corner of the world the atlas has one or two
records of, so the corpus grows faster than the component and the component
count rises."* Six new corners in one batch — West Africa, Colombia's
mid-century, the influenza pandemics, the 1987 monetary crisis, the ozone
treaties and the test-ban treaty — is the most this milestone has opened at
once, and every one of them is a corner a person can now write into rather than
a gap nobody had a record for.

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

**Batch 7 leaves it at 279 against 269**, ten higher, and the arithmetic is
eleven records in and one filed: `croat-bosniak-war` under
`war-in-bosnia-and-herzegovina`, argued in §2g. The other ten are seven
treaties, two wars and a reinstated war, and §2g says of each why it stayed
top-level — seven because a treaty between states is part of no event here, and
three because the filing is arguable and M62 §3 says an arguable filing is
listed rather than made. **The count moved because the corpus did, and the one
record that could be filed was.**

**Batch 8 leaves it at 288 against 279**, nine higher, and nine records came
in: none took a parent and §2h says why for each, `laotian-civil-war` at
length, because it is the one the article would file and the dates refuse.

**Batch 9 leaves it at 288, exactly where batch 8 did**: it created no record
and retracted none, so A3 has nothing to ask of it.

**Batch 10 leaves it at 300 against 288**, twelve higher, and the arithmetic is
fifteen records in and three filed. Twelve came from the sweep and three came
back from the tombstones — `anglo-zanzibar-war`, `libyan-civil-war` and
`thousand-days-war` — and a reinstated record is main again because it was main
before it was withdrawn. The three filed are argued in §2j:
`greco-italian-war` under `world-war-ii`, the German–Soviet boundary treaty
under `molotov-ribbentrop-pact`, and `revolution-of-dignity` under
`euromaidan`. The nine left main are four treaties between states, three wars, a
peasant revolution and a war of independence, and **`estonian-war-of-independence`
is the one that was arguable and is listed rather than filed**, as M62 §3
requires. The count moved because the corpus did, and every record that could
be filed was.

**Batch 11 leaves it at 311 against 300**, eleven higher, and the arithmetic is
twelve records in — nine kept from the sweep and three back from the tombstones
— and one filed, `korean-armistice-agreement` under `korean-war`.
`sino-soviet-border-conflict` is this batch's arguable filing and is listed
rather than made, for the reason §2k gives.

**Batch 12 leaves it at 316 against 311**, five higher against six records in,
because one of the six took a parent: `srebrenica-massacre` under
`war-in-bosnia-and-herzegovina`. `first-congo-war` is the batch's only new
record and §2l says why it is nobody's part; the other four are records that
were main before they were withdrawn. §4.1 of `docs/m53-polities.md` moves to
**306 of 411**. As in batch 10 every one of the new
records carries `actors: []`, so `docs/m53-polities.md` §4.1 moves to **306 of
405** with its numerator standing still: the gap that row shows is the gap
between an imported corpus and a written one, and it widens by exactly the
number of records each batch keeps.

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
| ~~`rwandan-civil-war`, `arusha-accords`, `second-congo-war`~~ | **all three came back in batch 12**, on the Angolan civil war this row named: §2l has the edges |
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
| `velvet-revolution`, `second-chechen-war`, `second-nagorno-karabakh-war`, `hungarian-revolution-of-1956` | the revolutions of 1989 and the dissolution of the Soviet Union, both of which are records now — but each of these four names a *different* missing record in its own reason (the first Chechen war, the first Nagorno-Karabakh war, the fall of the Wall), and no page read so far argues one of them from the two the atlas has. Re-read at every batch |
| ~~`srebrenica-massacre`~~ | **came back in batch 12**, on the Bosnian war its reason named: filed under it and edged to Dayton |
| ~~`1994-genocide-against-tutsi`~~ | **came back in batch 12**, with the Rwandan civil war its reason named |
| `syrian-civil-war` | the Arab Spring, which the import refused for want of a lane. **`libyan-civil-war` was here until batch 10** and came back on `libyan-civil-war --precondition-of--> mali-war`: its reason named its consequences, and one of them is a record now |
| `sudanese-civil-war` | Darfur, or the Sudanese revolution of 2019 |
| `cultural-revolution` | the 1-2-3 incident of 1966–67 in Macau, which is the precise link its reason names |
| `2016-turkish-coup-d-etat-attempt` | the Turkish coups of 1960, 1971 and 1980 |
| `holodomor` | collectivisation and the grain procurement quotas |
| `mexican-revolution`, `january-6-united-states-capitol-attack`, `assassination-of-john-f-kennedy` | a neighbour in a place or a politics this atlas does not reach at all. **`anglo-zanzibar-war` was here until batch 10**: its reason asked for the 1890 protectorate agreement by name and the sweep produced it |
| `treaty-on-the-non-proliferation-of-nuclear-weapons`, `paris-agreement`, `ramsar-convention`, `convention-on-the-elimination-of-all-forms-of-discrimination-against-women`, `convention-on-the-rights-of-the-child`, `united-nations-convention-on-the-law-of-the-sea` | an event the instrument decided, which for each of these would be a national one this atlas does not hold |
| `russian-revolution` | nothing: the atlas holds February, October and the civil war as three records with edges of their own, and a fourth node over all three would double every path through them without adding an argument. Redundancy, not reach, and the new bar does not touch it |

## The filing pass (A6) — the two records it leaves bare, and why

*21 September. The pass itself is in `docs/m42-pool.md` § "Filing pass (A6)";
this section exists because a main event that names neither an actor nor a
place is argued for here or in `docs/m67-umbrellas.md`, and `tests/m67.test.mjs`
holds the obligation.*

The pass wrote three period umbrellas and filed 106 main events under them. It
wrote **no edge**: `parent` is a display fact and takes none, so the largest
connected component is unchanged at 433 and §2's bare-record measurement is
unmoved by it.

**Two of the three name neither an actor nor a place**, and both were created
by the Wikidata import from the item's own fields:

- **`interwar-period`** (Q154611). The item gives no participant, no country
  and no coordinate — a period between two wars is not a thing anybody did in
  one place. M67's amendment A1 is the general answer and the owner's own:
  *"It's fine to have no actor or place, you have to read the context."* An
  actor line written to fill the gap would be a claim the item does not make.
- **`scramble-for-africa`** (Q179848). The same, and more sharply: the item's
  own description is *"1880s–1900s Western European colonisation of Africa"*,
  which is half a continent and seven powers. Naming one of them would be
  picking a side of the thing the record exists to hold.

**`third-portuguese-republic-since-1974` is not bare**: it names the republic
itself, which is the one actor line a period named for a polity can honestly
carry.

## 2r. Batch 18 — the eight records the live tombstones name, and the two umbrellas they made necessary

*21 September. Batch 17 found that set 0 recomputes but does not refill, and
§7 of `docs/m42-pool.md` resolved the alternative before this fire started:
nineteen live tombstones carry an explicit "It waits on …" clause and most
name a record by name, and the sweep does not carry those names. This batch is
the eight of them whose item resolves with a date. Six carried a class the
table did not name; those seven classes are listed in the pool file's own
batch 18 section, with the one refused.*

### The eight imported, and the one refused on arrival

`suez-crisis`, `anschluss`, `2022-brazilian-general-election`,
`sharpeville-massacre`, `independence-of-morocco`,
`british-expedition-to-tibet`, `earth-summit`, `siamese-revolution-of-1932`.

**`sharpeville-massacre` is retracted on arrival**, and it is the batch's one
refusal. It was imported to unlock `soweto-uprising`, whose reason asks for
"any South African record of the apartheid period" — and it is one. The
article does not argue the link: the uprising's own English article, at
revision 1369412868, gives its cause as the Afrikaans Medium Decree of 1974
and names Sharpeville once, inside a paragraph describing a 1999 BBC
broadcast, which is a gloss. The massacre's article, at revision 1375931445,
argues forward to UN Security Council Resolution 134, to the departure from
the Commonwealth in 1961, to the banning of the PAC and the ANC and to the
founding of Poqo and Umkhonto we Sizwe, and not to 1976; none of the five is a
record here. "Internal resistance to apartheid", at revision 1373723428, puts
the two in one sequence without relating them, which is §4's own class of
refusal. **`soweto-uprising` therefore stays retracted too**, and the pair is
the clearest case this run has produced of the difference between the record a
tombstone asks for and the sentence an edge needs.

**`suez-crisis`'s interval was corrected by hand before anything else touched
it**, and the correction is the item's own: Q49101 carries both a span
(P580 29 October 1956, P582 7 November 1956) and a stray point in time
(P585, March 1957), and `intervalFor` prefers the point in time, so the
import wrote a record starting in 1957 and ending in 1956, which rule 15
refused. The record now carries the span the same item gives. No date was
invented and none widened; the record is flagged `m42-interval-corrected`
so a reviewer can see where the interval came from.

### The thirteen edges

#### Into the largest component

- `1952-egyptian-revolution --precondition-of--> suez-crisis`. The Suez
  article, at revision 1374851403, has a section headed The Egyptian
  Revolution inside its own account of how the crisis came about: the Free
  Officers overthrew King Farouk in July 1952 and the republic they made is
  what nationalised the canal four years later.
- `suez-crisis --precondition-of--> 1958-lebanon-crisis`. The Lebanese
  crisis's article, at revision 1370279391, makes Suez the split the crisis
  was fought across: two ministers resigned over Chamoun's refusal to condemn
  the invasion of Egypt, and that "caused Muslim opposition groups to form the
  National Union Front in 1957". Not the general Arab Cold War background the
  same article also gives — a named consequence.
- `austrian-civil-war --precondition-of--> anschluss`. The civil war's
  article, at revision 1375005540, states it under Long term and hedges it as
  a later judgement: "Austria's ability to resist National Socialism was
  decidedly weakened by the Austrian Civil War and its consequences."
- `anschluss --precondition-of--> munich-agreement`. One sentence of the
  Anschluss article, at revision 1374499407: "After the Anschluss, Hitler
  targeted Czechoslovakia, provoking an international crisis which led to the
  Munich Agreement in September 1938."
- `anschluss --precondition-of--> austrian-state-treaty`. The same article:
  with the Anschluss "the Republic of Austria ceased to exist as an
  independent state", and it remained under the Allied Commission "until 1955,
  when the Austrian State Treaty restored its sovereignty".
- `the-2018-brazilian-general-election --precondition-of--> 2022-brazilian-general-election`
  and `2022-brazilian-general-election --caused--> lula-returns-to-the-presidency-2023`.
  The 2022 article, at revision 1375252300, introduces the contest as the 2018
  one still being settled — Bolsonaro elected in 2018, Lula's 2018 candidacy
  disallowed and his rights restored by 2021 — and states the result: Lula
  "was elected president of Brazil for a third, non-consecutive term".
- `2022-brazilian-general-election --reacted-to--> 2023-brazilian-congress-attack`.
  The attack's article, at revision 1372449713, gives the election as what the
  mob was answering: supporters "alleged that the 2022 Brazilian general
  election suffered from widespread electoral fraud that caused Bolsonaro's
  loss", and "the military helped oversee the election and found no signs of
  fraud".
- `independence-of-morocco --caused--> ifni-war`. The war's article, at
  revision 1370623332: "After Morocco achieved independence in 1956, it sought
  to claim Spain's remaining possessions in West Africa." Eleven months
  separate the independence from the incursions.
- `wall-street-crash-of-1929 --precondition-of--> siamese-revolution-of-1932`.
  The revolution's article, at revision 1370738350, names the crash and
  traces it to the men who made the coup: the budget cuts that followed it
  angered "most of the country's educated elite" and "the officer corps was
  especially disgruntled".
- `1893-franco-siamese-crisis --precondition-of--> entente-cordiale`. The
  crisis's article, at revision 1374343940, counts the Entente among its own
  consequences: France and Britain "put aside their many differences with the
  Entente Cordiale, ending this dispute in southeastern Asia".

#### Opening a corner rather than reaching the middle

- `british-expedition-to-tibet --caused--> treaty-of-lhasa`. Both articles say
  it: the treaty's, at revision 1305728166, that it "was signed following the
  British expedition to Tibet of 1903–1904"; the expedition's, at revision
  1370606386, by what means — "the Commission forced remaining Tibetan
  officials to sign the Convention of Lhasa". A pair, joined to each other and
  to nothing else: `british-russian-convention` of 1907, which this atlas
  holds and which settled Tibet between the two empires, is named in neither
  article.
- `earth-summit --inspired--> aarhus-convention`. The Earth Summit's article,
  at revision 1368901985, lists what it produced, the Rio Declaration among
  them; the convention's, at revision 1367239958, quotes the UN
  Secretary-General calling it "by far the most impressive elaboration of
  principle 10 of the Rio Declaration". Inspired and not caused: Rio declared
  the principle, it did not negotiate the convention. **This is the first dent
  in §7.4's environment-shaped hole that is an environmental *event* rather
  than a tenth instrument** — and it is still a pair, because neither article
  names `vienna-convention-for-the-protection-of-the-ozone-layer` or
  `montreal-protocol`.

### The seven put back

`1958-lebanon-crisis`, `austrian-civil-war`, `2023-brazilian-congress-attack`,
`ifni-war`, `treaty-of-lhasa`, `aarhus-convention` and
`1893-franco-siamese-crisis`, each on the edge above it and each carrying
`m42-reinstated`. Six were brought back by the record their own reason named;
`1893-franco-siamese-crisis` was not. Its reason asked for "any Siamese or
Indochinese neighbour before 1946" and `siamese-revolution-of-1932` is one,
but the two articles do not relate — so what brought it back is its own
Consequences section naming the Entente Cordiale, a record this atlas has held
since batch 8 and nobody had read that paragraph against.

### The two umbrellas, which are this batch's filing half

A6 says the main count must not rise, so a batch of sixteen new active records
has to file sixteen. Two regions had nowhere to put them and
`docs/m42-pool.md` had already nominated both:

- **`nova-republica-brazil-since-1985`**, written here on M62's pattern
  because Q2920526 carries no start date, from the English article at revision
  1371710443 and the Portuguese at revision 72521647. It takes eight:
  `the-1988-brazilian-constitution`,
  `the-commodity-boom-and-the-chinese-buyer`, `operation-car-wash-2014`,
  `the-impeachment-of-dilma-rousseff-2016`,
  `the-2018-brazilian-general-election`, `2022-brazilian-general-election`,
  `lula-returns-to-the-presidency-2023` and `2023-brazilian-congress-attack`.
  `1985-brazilian-presidential-election` is **not** among them: it is the act
  that made the republic, which M67's judgement 1 keeps outside, and it is
  already filed under the dictatorship it ended.
- **`arab-israeli-conflict`** (Q8669), the Wikidata import's own work, which
  `docs/m42-pool.md` named as the one umbrella the asia lane has with an
  article, a start date and a testable subject. It takes five:
  `1948-arab-israeli-war`, `black-september`, `2006-lebanon-war`,
  `second-intifada` and `gaza-war-2008-2009`. Two of the five are the source's
  own claim — Q154288 and Q49104 both carry `part of` Q8669 — and the other
  three point at sub-conflicts of it.

Three more were filed under umbrellas that already existed: `anschluss` and
`austrian-civil-war` into `interwar-period`, both inside its span and in its
lane; `armistice-of-mudros` into `world-war-i`, which the filing pass had
already argued when it refused the armistice from the interwar period as "an
act of the war and not of what followed it"; and `gaza-genocide` into
`gaza-war`, which is Q124086054's own `part of`.

**`gaza-war` itself was left main on purpose.** Filing it under
`arab-israeli-conflict` with `gaza-genocide` under it would nest three deep,
and A6 allows one.

## 2s. Batch 19 — a tombstone pass, and the post-1989 filing the pass could not do

*21 September, the same fire as batch 18. No import: every record here was
already on disk, three of them as tombstones and six as main events waiting
for an umbrella the atlas already held. Batch 12 found the ratio between the
two ways of growing this corpus — the sweep is the volume, the tombstones are
the connection — and this is the second kind.*

### The two edges

- `2021-myanmar-coup-d-etat --caused--> myanmar-civil-war`. The war's article,
  at revision 1375700231, opens on the coup: "The Myanmar civil war began
  following the military coup on 1 February 2021. The seizure of power
  triggered mass anti-coup demonstrations and a violent crackdown by the
  Tatmadaw (Myanmar armed forces), which significantly escalated the country's
  longstanding insurgencies." The insurgencies are older and the article says
  so; what it dates to February 2021 is the war. **Both ends were tombstones**
  — the coup was withdrawn as having no neighbour in a region this atlas does
  not reach, the war as waiting on the coup by name — so one edge brings back
  two records and makes a pair, not a reach. §7's own reading of batch 17.
- `rose-revolution --inspired--> tulip-revolution`. The Tulip Revolution's
  article, at revision 1372025111, names the transmission and the man who
  carried it: "Givi Targamadze, a former member of the Liberty Institute of
  Georgia … consulted Ukrainian opposition leaders on the technique of
  nonviolent struggle. He later advised leaders of the Kyrgyz opposition
  during the Tulip Revolution." Its reason asked for exactly this — "a page
  that argues the Kyrgyz opposition took the Georgian or Ukrainian revolution
  as a model" — and the same section records that Akayev coined the name
  against those precedents. `inspired` and not `caused`: what crossed was a
  technique and a name.

### The three put back

`2021-myanmar-coup-d-etat`, `myanmar-civil-war`, `tulip-revolution`, each
carrying `m42-reinstated`.

**`2021-myanmar-coup-d-etat` gained a `review.status` it did not have.** It is
an M44b-era record whose `review` block carried flags and no status, so
reinstating it put an unread record on no dashboard — the validator's `unread`
warning. `draft` is what `tools/migrate/backfill-standing.mjs` writes for
exactly this shape, and nothing else on the record was touched.

### The two refused, with the reason each still waits on

- **`libyan-civil-war-q16911838`** waits on "a page that argues the second
  Libyan war out of the first", and its own article, at revision 1374738410,
  is not that page: its background is the General National Congress's
  paralysis, the political isolation law and the 2014 election, it never names
  the war of 2011 and it mentions Gaddafi only as the regime the isolation law
  barred from office. The reason stands as written.
- **`sharpeville-massacre`** and **`soweto-uprising`**, from batch 18 above.

### The post-1989 filing, on the source's own `part of`

The filing pass named seventeen European events of the Third Republic's span
that are not Portugal's and said there was no umbrella here for them. **Six of
them have one after all**, and it is not a period this run invented: it is a
`part of` statement on the record's own Wikidata item, pointing at an event
this atlas already holds as a main record.

| filed | under | the item's own claim |
| --- | --- | --- |
| `romanian-revolution-1989` | `revolutions-of-1989` | Q204213 → Q382861 |
| `1991-soviet-coup-d-etat-attempt` | `revolutions-of-1989` | Q221382 → Q382861 |
| `croatian-war-of-independence` | `yugoslav-wars` | Q68969 → Q242352 |
| `kosovo-war` | `yugoslav-wars` | Q190029 → Q242352 |
| `2001-insurgency-in-macedonia` | `yugoslav-wars` | Q817137 → Q242352 |
| `belovezh-accords` | `dissolution-of-the-soviet-union` | Q76986 → Q5167679 |

**Two further `part of` claims were read and not acted on**, both because they
would nest a second deep and A6 allows one: `yugoslav-wars` is part of
`breakup-of-yugoslavia` (Q242352 → Q4390259) and
`dissolution-of-the-soviet-union` is part of `revolutions-of-1989`
(Q5167679 → Q382861). Filing either would put a war inside a breakup inside
nothing, with three levels under it. `revolutions-of-1989` itself carries
`part of` the **Cold War**, which M67 refused and A6 does not overrule.

Corpus 493 → 496 active, **main 266 → 263**, largest component 441 → 442.

## 2t. Batch 20 — the `part of` pass, and what a date refuses

*21 September, the third batch of the fire. No import, no edge, no fetch but
five `wbgetentities` calls: every main event carrying a Wikidata id was asked
for `part of`, and the answers naming a record this atlas holds were filed
where the dates allow and refused where they do not.* `docs/m67-umbrellas.md`
§7 is the table, both halves of it. Five filed — `afghan-civil-war`,
`indo-pakistani-war-of-1947-1948`, `indo-pakistani-war-of-1965`,
`suez-crisis` and `war-of-attrition` — and fifteen refused: one on the lane,
eleven on a date and three on depth.

**The largest connected component does not move and cannot**: `parent` takes
no edge. Main 263 → **258**.

**The lane refusal is the one A6 itself wrote.** `second-italo-ethiopian-war`
carries `part of` the interwar period and is an African war; the period is
European here, because the owner's example was a period shown *for Europe*. A
period's subject is its region and the claim is true of the calendar only.

**What the date refusals are worth reading for** is that eight of the eleven are
the atlas's own dates disagreeing with the source's containment by a margin
that is not a mistake: the Basmachi movement really does outlive the Russian
civil war, the Rif war really does begin before the interwar period, and the
second Sino-Japanese war really does begin two years before this atlas dates
the Second World War. **A `part of` statement is a claim about subject and not
about time**, and rule 24 is what keeps the two apart here. The exception is
`the-troubles`, dated `1998–1998` in this atlas for a conflict of thirty
years: that one is a defect in a record and is left visible rather than filed
over.

## 2u. Batches 21 and 22 — three umbrellas the corpus named, and the origin one of them needed

*21 September. Batch 21 imported the three parents the atlas's own main events
name and A6 allows — `afghan-conflict`, `indochina-wars` and `arab-spring` —
and filed ten main events under them; the whole measurement, with every
refusal, is `docs/m42-pool.md` → "Batch 21", and the bareness of the three
umbrellas is accounted for in `docs/m67-umbrellas.md` §8. **No edge was
written for any of it**, because a filing is a display fact and a period is
not something an event causes.*

**Batch 22 is where the edges are, and there are three.** The article batch 21
wrote `arab-spring` from opens on the record this atlas did not hold: *"It
began in Tunisia in response to the death of Mohamed Bouazizi by
self-immolation. From Tunisia, the protests initially spread to five other
countries: Libya, Egypt, Yemen, Syria and Bahrain."* So `tunisian-revolution`
(Q46959) was imported, filed under `arab-spring` in the same batch — Tunisia
is in the africa lane and 18 December 2010 is inside the period's span — and
three edges were written out of it:

- **`tunisian-revolution --inspired--> 2011-egyptian-revolution`.** The Arab
  Spring's lead names Egypt among the five the protests reached. Egypt's own
  article, at revision 1374677056, gives the occasion as National Police Day
  and the grievance as police brutality and never names Tunisia, so the edge
  asserts the spread the first article states and nothing about a cause inside
  Egypt.
- **`tunisian-revolution --inspired--> libyan-civil-war`.** The war's article,
  at revision 1374512354: *"The war was ignited by protests in Benghazi
  beginning on 15 February 2011 inspired by the Arab Spring."* It credits the
  wave, and the wave's own article says where the wave started.
- **`tunisian-revolution --inspired--> 2011-yemeni-revolution`.** The most
  cautious of the three, and written at the strength the source gives: Yemen's
  article, at revision 1375746838, says the uprising *"occurred concurrently
  with the Arab Spring"* and lists its own grievances first.

All three are `inspired` and `probable`. **Not one article says a Tunisian
event brought about a foreign one**, so none is `caused`; and rule 22 would
refuse `consensus` to three citations that are one encyclopedia.

**What it bought**: `libyan-civil-war` and `mali-war` were a component of two
and are on the main chain now; the largest component goes 442 → **445** and
the count of components 30 → 29, while the main count stays at 251 because the
import was filed in the batch that made it.

## 2v. Batch 23 — the rows whose parent this atlas already holds

*21 September, the third batch of the same fire. Batch 21 asked the corpus's
own main events what they are part of; this batch asks the **sweep pool** the
same question, which is a tick rule §5 does not have and which A3 and A6
between them make the obvious one: **a row whose item names a parent this
atlas holds arrives filed, so the main count cannot rise by importing it.***

Of the 250 best rows of the world pool by sitelinks, **19 name a parent that
is an active record here**. Ten were taken, eight landed, and each of the
eight earned an edge — the bar of §1 of the brief, which a filing does not
satisfy on its own: **a record that cannot earn an honest edge is retracted,
and being somebody's child is not an edge.**

| the record | filed under | the edge it earned |
| --- | --- | --- |
| `paris-peace-accords` | `vietnam-war` | `vietnam-war --caused--> paris-peace-accords` |
| `wuchang-uprising` | `xinhai-revolution` | `wuchang-uprising --caused--> xinhai-revolution` |
| `tambov-rebellion` | `russian-civil-war` | `russian-civil-war --caused--> tambov-rebellion` |
| `georgian-uprising-on-texel` | `world-war-ii` | `world-war-ii --caused--> georgian-uprising-on-texel` |
| `2014-pro-russian-unrest-in-ukraine` | `russo-ukrainian-war` | `revolution-of-dignity --caused--> 2014-pro-russian-unrest-in-ukraine` |
| `2020-malian-coup-d-etat` | `mali-war` | `mali-war --caused--> 2020-malian-coup-d-etat` |
| `iraqi-insurgency` | `iraq-war` | `iraq-war --caused--> iraqi-insurgency` |
| `republican-insurgency-in-afghanistan` | `afghan-conflict` | `war-in-afghanistan-2001-2021 --caused--> republican-insurgency-in-afghanistan` |

**Every explanation quotes the article it rests on, at the revision it was
read at**, and two of them are worth reading for what they refuse to say.
`mali-war --caused--> 2020-malian-coup-d-etat` rests on the coup's own
§Background — the protesters "were displeased with the government's management
of the ongoing insurgency, alleged government corruption, the ongoing COVID-19
pandemic, and a floundering economy" — and the war is **one of four**
grievances named, which is why the edge is `probable` and why no edge was
written from `covid-19-pandemic`, which the same sentence names.
`russian-civil-war --caused--> tambov-rebellion` is the argument this atlas
already carries from the same war to the Kronstadt rebellion, read off the
child's own §Background in the same encyclopedia.

**Two rows were taken and did not land, and both refusals are the tool's:**
`Q780845` the Franco-Thai War, refused for want of a lane — it names no place
record, its point reaches no lane polygon and the seeds file named none for it
— and `Q2587808` "The Holocaust in Poland", refused because the item carries
**no date the atlas can use**, which is deviation 989 doing its job.

**Nine of the nineteen were refused before the import ran**, and the reasons
are worth keeping because they are all dates or duplicates rather than
judgements:

- **Three would duplicate records this atlas already holds.** `Q1780216` the
  Angolan War of Independence, `Q2609193` the Guinea-Bissau war and
  `Q2002270` the Mozambican war each begin on the day of a record here —
  `angola-war-begins-1961`, `guinea-war-begins-1963`,
  `mozambique-war-begins-1964` — and each is the Portuguese colonial war in
  one theatre, which `portuguese-colonial-war-1961-1974` already is.
- **Four are refused on this atlas's own dates.** `Q957586` the
  Turkish–Armenian war of 1920 against `turkish-war-of-independence`, dated
  `1922–1923` here; `Q32993` the Chinese Communist Revolution and `Q476634`
  the Nanchang uprising, both of 1927, against `chinese-civil-war`, dated
  `1946–1950` here; `Q1070890` the Georgian civil war of 1991–1993 against
  `dissolution-of-the-soviet-union`, dated `1991–1991`. **Three more records
  whose interval an import read short**, after `the-troubles` and
  `cambodian-vietnamese-war`: the pattern is now five and it is the clearest
  piece of work a person could do in this corpus.
- **Two are refused on the lane**, which is deviation 1023 again: `Q242864`
  the 2011 Bahraini uprising under `arab-spring`, and `Q2992403` the
  Franco-Syrian war of 1920 under `interwar-period`. Both are in their
  parent's span and neither is in its lane.

## 2w. Batch 24 — the same rule, deeper into the pool, and the edges it found

*21 September, the fourth batch of the same fire. Batch 23's rule — **take the
row whose item names a parent this atlas already holds** — run over rows 250
to 700 of the world pool by sitelinks, which hold 38 more such rows. Eleven
taken, seven landed, seven filed, and **eight edges**, because two of the
seven earned one each from a different direction.*

| the record | filed under | the edges it earned |
| --- | --- | --- |
| `franco-thai-war` | `world-war-ii` | `armistice-of-22-june-1940 --enabled--> franco-thai-war`, `1893-franco-siamese-crisis --precondition-of--> franco-thai-war` |
| `2012-malian-coup-d-etat` | `mali-war` | `2012-tuareg-rebellion --caused--> 2012-malian-coup-d-etat` |
| `2012-tuareg-rebellion` | `mali-war` | `libyan-civil-war --enabled--> 2012-tuareg-rebellion` |
| `kerensky-krasnov-uprising` | `russian-civil-war` | `october-revolution --reacted-to--> kerensky-krasnov-uprising` |
| `foibe-massacres` | `world-war-ii` | `world-war-ii --caused--> foibe-massacres` |
| `treaty-of-peace-with-italy` | `paris-peace-treaties` | `world-war-ii --caused--> treaty-of-peace-with-italy` |
| `war-in-somalia` | `somali-civil-war` | `somali-civil-war --caused--> war-in-somalia` |

**The Franco-Thai war is what this rule is for.** Its § Background names two
records this atlas already holds and nothing in it was this run's idea: *"Fall
of France and the Armistice of 22 June 1940 led to the creation of Vichy
Regime in Southern France. Vichy government then inherited its control over
French colonial territories in both Africa and Asia. With weakened status of
the French state both Phibun and the Japanese Empire saw opportunities in
Indochina"*, and *"The events of Franco-Siamese Crisis of 1893 … ended with
Siam losing the territories of Laos and Cambodia to France."* One import, two
edges, and `1893-franco-siamese-crisis` — the corpus's own loneliest record,
the leaf deviation 1020's browser test picks — stops being a leaf.

**The Tuareg rebellion carries the other kind of find.** Its lead says the MNLA
*"was formed by former insurgents and a significant number of heavily armed
Tuaregs who fought in the Libyan Civil War"*, which is the mechanism behind an
edge this atlas already had between Libya and Mali, now written where it
belongs and as `enabled` rather than `caused`, because the same sentence dates
the Tuareg claim to 1916.

**One record needed its calendar written down.** `kerensky-krasnov-uprising`
carries Wikidata's dates, which are the Julian ones the article gives in
brackets — *"between 8 and 13 November 1917 [O.S. 26 and 31 October]"* — so
the record says `when.calendar: julian`. Without it the rising is dated before
the revolution it answered and rule 4 refuses the edge; with it, the arrow of
time is the arrow the sources describe. **Nothing else on the record was
touched and no date was changed.**

**Four of the eleven did not land, and the tool refused all four**:
`Q74109` (World War II in Albania), `Q714706` (the 1940–1944 insurgency in
Chechnya) and `Q1208479` (the Georgian–Ossetian conflict of 1918–1920) for
want of a lane — no place record, no lane from their point, none named in the
seeds file — and `Q4499410` ("The Holocaust in Ukraine") for want of a date.
The first three are a one-line fix in `data/imports/wikidata-seeds.json` for a
later fire, which is exactly how `franco-thai-war` landed in this batch after
being refused in batch 23.

## 2x. Batch 25 — the three the lane refused, and a pair that is honestly a fragment

*22 September, the fifth batch of the same fire and the smallest. Three of its
five rows are the ones batch 24's tool refused for want of a lane, landed by
the one line deviation 1029 describes; the other two are a pair of wars in
Dahomey that the scramble for Africa was waiting for.*

| the record | filed under | the edge it earned |
| --- | --- | --- |
| `world-war-ii-in-albania` | `world-war-ii` | `world-war-ii --caused--> world-war-ii-in-albania` |
| `1940-1944-insurgency-in-chechnya` | `world-war-ii` | `world-war-ii --enabled--> 1940-1944-insurgency-in-chechnya` |
| `georgian-ossetian-conflict-1918-1920` | `russian-civil-war` | `february-revolution --enabled--> georgian-ossetian-conflict-1918-1920` |
| `first-franco-dahomean-war` | `scramble-for-africa` | `first-franco-dahomean-war --precondition-of--> second-franco-dahomean-war` |
| `second-franco-dahomean-war` | `scramble-for-africa` | the same edge, from the other end |

**Two of the three edges are `enabled` and the reason is the same both times**:
the rising in Chechnya began in 1940 and the land question in South Ossetia is
older than 1917, so what the war and the revolution gave each was an opening
and not a cause. The articles say as much — *"peaked in 1942 during the German
invasion of North Caucasus"*, *"during the 1917 February Revolution the
Bolsheviks found the Ossetians very receptive to the idea of class conflict"* —
and the type is written to what they say.

**The Dahomean pair is a fragment and it is said out loud.** Both wars are
filed under `scramble-for-africa`, which is an A6 umbrella and takes no edge,
and the only edge either earned runs between them. That is batch 17's finding
again — *"a tombstone is a note of what is missing, and its record lands where
the tombstone was"* — in the filing rule's version: a row whose parent is an
**umbrella** arrives filed and still lands outside the chain. The pair is
honestly edged, the component count rose by one, and what would join them to
the atlas is a record of the French conquest of West Africa that nothing here
holds.

**The sixth short interval turned up in the same batch.**
`world-war-ii-in-albania` carries Wikidata's 1942–1944 while its own article
dates the war there from April 1939, and `1940-1944-insurgency-in-chechnya`
carries a single day in December 1944 for a revolt its own title dates
1940–1944. Both are filed inside the war either way and both are left visible,
for the reason deviation 1022 gives.

## 2y. Batch 26 — the whole pool scanned, and nine edges from ten filings

*22 September, the first batch of the fire that picked the run up at 02:06.
The rule is batches 23 to 25's — take the pool row whose item names a parent
this atlas already holds — asked of all 1,088 open world rows rather than the
best 700. The measurement and the refusals are in `docs/m42-pool.md` →
"Batch 26"; what belongs here is the nine edges and the two that could not be
written.*

**Nine edges, each quoting one sentence of one article at one revision.**

#### `tunisian-revolution --inspired--> 2011-bahraini-uprising`
#### `2011-egyptian-revolution --inspired--> 2011-bahraini-uprising`

Both rest on the same sentence of the uprising's own article, at revision
1374892677: *"The protests were inspired by the unrest of the 2011 Arab Spring
and protests in Tunisia and Egypt and escalated to daily clashes after the
Bahraini government repressed the revolt with the support of the Gulf
Cooperation Council's Peninsula Shield Force."* **Two edges and not one**,
because the article names two protests and choosing between them would be this
atlas putting a word in its mouth. Both are `inspired` and `probable`, for the
reason batch 22 gave for the same wave: an example spreading is not a Tunisian
or an Egyptian event bringing about a Bahraini one, and nothing read here says
it was.

#### `moscow-uprising-of-1905 --enabled--> october-revolution`

The uprising's article, revision 1370628753: *"The uprising ended in defeat for
the revolutionaries and provoked a swift counter-revolution that lasted until
1907… The Moscow revolutionaries gained experience during the uprising that
helped them succeed years later in the October Revolution of 1917."* What the
article describes is men who knew how to do it twelve years later, which is an
opening and not a cause — `enabled`. It says *"helped them succeed"* and not
that October would not have happened without it, and the confidence is written
to that. **This is the one edge of the 1905 cluster**, and it is the one
because it is the only sentence in the four articles that says a 1905 event
did something to a later one rather than that it was part of 1905.

#### `treaty-of-brest-litovsk --precondition-of--> revolt-of-czechoslovak-legion`

The revolt's article, revision 1370706945: the revolt *"was a reaction to a
threat initiated by the Bolsheviks partly as a consequence of the Treaty of
Brest-Litovsk."* A legion raised to fight Germany stranded in a Russia that had
just left that war. The article's own word is *"partly"*, so the type is
`precondition-of` and the confidence `probable`.

#### `october-revolution --reacted-to--> junker-mutiny`

The mutiny's article is one sentence, at revision 1375165370: *"The Junker
mutiny was a Russian counterrevolutionary mutiny of military school cadets in
Petrograd against the Bolsheviks in October 1917."* A rising against the men
who had taken power days before is the plainest case `reacted-to` exists for.
**Written from the revolution to the mutiny and not the other way**: rule 4
holds every edge to the arrow of time and this atlas's convention for the type
puts the thing reacted to first — the same direction
`1964-brazilian-coup-detat --reacted-to--> operation-brother-sam-1964` was
written in.

#### `second-guangzhou-uprising --precondition-of--> xinhai-revolution`

The revolution's article, revision 1375425258: *"The revolution was the
culmination of a decade of agitation, revolts, and uprisings."* Huang Xing's
failed rising at Canton in April 1911, six months before Wuchang, is one of
them, and the item says so too. **Neither article names this uprising as a
cause**, and the edge is written at the strength that supports:
`precondition-of`, `probable`, not `caused`.

#### `iraqi-insurgency --caused--> iraqi-civil-war-of-2006-2008`

The civil war's article, revision 1373449147: *"In February 2006, the
insurgency against the coalition and government escalated into a sectarian
civil war after the bombing of Al-Askari Shrine, considered a holy site in
Twelver Shi'ism."* One conflict escalating into another is what `caused` is for
here. `probable` and not `consensus`, because the only citation is an
encyclopedia article and that is rule 22.

#### `angolan-civil-war --enabled--> first-shaba-war`

Shaba I's article, revision 1373218991: *"The conflict began when the Front for
the National Liberation of the Congo (FNLC), a group of about 2,000 Katangan
Congolese soldiers who were veterans of the Congo Crisis, the Angolan War of
Independence, and the Angolan Civil War, crossed the border into Shaba from
Angola."* Angola was the ground they stood on and the war was where they
learned the trade; it is not what made them invade Zaire. `enabled`.

#### `falklands-war --caused--> argentine-surrender-in-the-falklands-war`

The war's article, revision 1375590484: *"The conflict lasted 74 days and ended
with an Argentine surrender on 14 June, which formally returned possession to
Britain."* The record is filed inside the war as well; the filing says the
surrender happened inside it and the edge says the war is what brought it
about, which are not the same claim.

### The two that could not be written, and why that is the honest answer

**`revolt-of-czechoslovak-legion --enabled--> russian-civil-war` was written
and then deleted.** The article states it plainly — *"One major secondary
consequence of victories by the Legion over the Bolsheviks was to catalyze
anti-Bolshevik activity in Siberia … likely protracting the Russian Civil
War"* — and rule 4 refused it, because the import gave the revolt **1920** for
a revolt the same article dates from May 1918, and the civil war begins in
1917. **The edge the source asserts cannot run forward in time over the dates
this atlas holds.** That is the seventh interval to read shorter than its own
record (deviation 1037) and it is left visible rather than repaired, for the
reason deviation 1022 gives. The record earns instead the Brest-Litovsk edge,
which the same paragraph supports and which validates.

**The 1905 cluster earned three filings and no edge.**
`revolution-in-the-kingdom-of-poland` (revision 1370706988) says *"A major part
of the Russian Revolution of 1905 took place in the Russian Partition of
Poland"*; `odz-insurrection` (revision 1370751757) says the rising was *"one of
the largest disturbances in the Russian-controlled Congress Poland during the
Russian Revolution of 1905"*; and `potemkin-mutiny` has **no English article at
all** — seven sitelinks, and the battleship's own article (revision 1370827020)
says only that *"She became famous during the Revolution of 1905, when her crew
mutinied against their officers."* Every one of those sentences is
containment, which `parent` already carries, and **being somebody's child is
not an edge** — brief §1's bar, and the reason three components were added
rather than three edges invented.

## 2z. Batch 27 — six edges, and the five records the sources would not give one

*22 September, the second batch of the same fire and the same vein. Eleven
rows, eleven filings, six edges. The measurement is in `docs/m42-pool.md` →
"Batch 27".*

#### `1982-lebanon-war --caused--> south-lebanon-conflict`

The conflict's own article, at revision 1370747846: it "took place in
Israeli-occupied southern Lebanon from 1982 or 1985 until Israel's withdrawal
in 2000… Israel officially names the conflict the Security Zone in Lebanon
Campaign and deems it to have begun on 30 September 1982, after the end of its
'Operation Peace for Galilee'." The occupation the 1982 war left behind is
what the fifteen years of fighting were over.

#### `south-lebanon-conflict --caused--> operation-grapes-of-wrath`

The operation's article, revision 1372784188, gives the aim and the tally it
answered: "a seventeen-day campaign of the Israel Defense Forces (IDF) against
Hezbollah in 1996 which attempted to end the Iran-backed group's rocket attacks
on northern Israeli civilian centres… Prior to the operation, Hezbollah had
launched 151 rockets from Lebanon into Israel."

#### `armenian-genocide --reacted-to--> battle-of-musa-dagh`
#### `armenian-genocide --reacted-to--> urfa-resistance`

Musa Dagh's article (revision 1370628972): "In 1915, it was the location of a
successful Armenian resistance to the Armenian genocide." Urfa's (revision
1370748893): the resistance "was an effort by some Ottoman Armenians in Urfa to
defend themselves against the Armenian genocide launched by the Ottoman
Empire. The resistance was quelled following German intervention." Both are
`reacted-to` and written in this atlas's direction for the type — the thing
reacted to first. The second sentence of the Urfa lead is why neither is
`enabled`: they changed nothing about the thing they answered.

#### `world-war-i --precondition-of--> chilembwe-uprising`

The uprising's article, revision 1375916516: the rebels "were motivated by
grievances against the British colonial system, which included forced labour,
racial discrimination and new demands imposed on the African population
following the outbreak of World War I." The war is one grievance of three the
article names, so `precondition-of` and not `caused`.

#### `dayton-agreement --precondition-of--> insurgency-in-kosovo`

The insurgency's article, revision 1370623741: "The Insurgency in Kosovo began
in 1995, following the Dayton Agreement that ended the Bosnian War. In 1996,
the Kosovo Liberation Army (KLA) began attacking Serbian governmental buildings
and police stations."

### The two an imported date refused, and the four the sources never offered

**`war-in-darfur --caused--> darfur-genocide` was written and deleted.** The
war's own article (revision 1375318567) says the government "responded to
attacks by carrying out a campaign of ethnic cleansing against Darfur's
non-Arabs", and that campaign is exactly what the genocide record is. Wikidata
dates the genocide 23 February 2003 and the war 26 February 2003, so rule 4
refused the edge for three days. **An imported date can be precise enough to
refuse an argument without being right enough to.**

**`insurgency-in-kosovo --caused--> kosovo-war` could not be written either.**
The insurgency's own lead ends "This insurgency would lead to the more intense
Kosovo War in February 1998", and the record carries a single day — 28 February
1998 — for something its title dates from 1995, while the Kosovo war here begins
that same February.

**Four records earned nothing because their articles claim nothing.**
`war-over-water` is "a series of confrontations between Israel and its Arab
neighbors from November 1964 to May 1967 over control of water sources";
`kaocen-revolt` is a single sentence about a Tuareg rising in northern Niger;
`war-of-the-camps` is "a subconflict within the 1984–1990 phase of the Lebanese
Civil War"; `1963-south-vietnamese-coup` names the Buddhist crisis and the Viet
Cong threat, and this atlas holds neither. Each of those sentences is
containment, which `parent` already carries. **Five components were added
rather than five edges invented**, which is deviation 1031's warning read in
the other direction: the vein files reliably and edges only where a source
argues.

## 2aa. Batch 28 — four edges, and the nine the articles would not argue for

*22 September, the third batch of the same fire. Thirteen rows, thirteen
filings, four edges and a fifth deleted. The measurement is in
`docs/m42-pool.md` → "Batch 28".*

#### `2020-malian-coup-d-etat --precondition-of--> 2021-malian-coup-d-etat`

The 2021 coup's article, revision 1370424554: "Assimi Goïta, the head of the
junta that led the 2020 Malian coup d'état, announced that N'daw and Ouane were
stripped of their powers… It is the country's third coup d'état in ten years,
following the 2012 and 2020 military takeovers, with the latter having happened
only nine months earlier." The transitional government the first coup created
is what the second deposed. `precondition-of`, because the article does not
say the first brought the second about.

#### `russian-revolution-of-1905 --caused--> sveaborg-rebellion`

The rebellion's article, revision 1370749115: "The mutiny was part of the
aftermath of the Russian Revolution of 1905, which by summer 1906 had
effectively been suppressed in most other regions of the Russian Empire."
**The only one of this run's six 1905 records to earn an edge**, and it earned
it on the word "aftermath": every other 1905 article this run read says only
that the thing was part of the revolution, which is what `parent` carries.

#### `french-conquest-of-morocco --caused--> zaian-war`

The war's article, revision 1370751428: it was fought "during the French
conquest of Morocco. Morocco had become a French protectorate in 1912, and
Resident-General Louis-Hubert Lyautey sought to extend French influence
eastwards through the Middle Atlas mountains towards French Algeria. This was
opposed by the Zaians." The conquest is what was being opposed, which is more
than the war happening inside it.

#### `angolan-civil-war --enabled--> shaba-ii`

Shaba II's article, revision 1370737989: "The conflict broke out on 11 May 1978
after 6,500 rebels from the Congolese National Liberation Front (FNLC), a
Katangese separatist militia, crossed the border from Angola into Zaire in an
attempt to achieve the province's secession." The same border and the same
militia as batch 27's edge to Shaba I, and the same type for the same reason:
the secession they wanted was their own.

### The one deleted, the one refused on principle, and the seven that had nothing

**`zanzibar-revolution --caused--> massacre-of-arabs-during-the-zanzibar-revolution`
was written and deleted.** The massacre's article (revision 1374125732) says the
violence was committed "during and following the Zanzibar Revolution… by Black
African militiamen under the Afro-Shirazi Party and Umma Party", which is the
revolution's own militia and more than containment. The record is dated
`1964-01` and the revolution `1964-01-12`, and **a month-only date reads as the
first of that month**, so rule 4 puts the consequence eleven days before its
cause. Deviations 1037 and 1039 were intervals that read short; this is a date
that reads coarse, and it is the third form of one problem.

**`the-holocaust-in-romania` earned none on purpose, and it is the clearest
case this run has found of a filing and an edge being different claims.** Its
article (revision 1375965594) says the Romanian killings were "historically part
of The Holocaust" and in the same sentence "mostly independent from the similar
acts committed by Nazi Germany, Romania being the only ally of the Third Reich
that carried out a genocidal campaign without the intervention of Heinrich
Himmler's SS." **The filing says the first; the absence of an edge says the
second.** Writing one anyway would have been this atlas contradicting the
source it rests on.

**Seven had nothing to argue with.** `bambatha-rebellion` names the Union of
South Africa of 1910, which this atlas does not hold; `benin-expedition-of-1897`,
`herero-wars`, `wadai-war`, `1920-georgian-coup-attempt`, `sevastopol-uprising`
(no English article at all) and `eritrean-civil-wars` say only what they were
and where. Nothing was written to keep them.

## 2ab. Batch 29 — four edges, nothing imported, and the paragraph the summary endpoint never returns

*22 September, a connection-first batch on batch 22's rule, read one paragraph
deeper. No record was imported, so the main count could not move; the whole
batch is four edges. The measurement is in `docs/m42-pool.md` → "Batch 29".*

**What made it possible is a method and not a judgement.** Every fire since
batch 22 has left the Horn of Africa and Sudan alone with the same sentence:
the leads of their articles name no event this atlas holds. That is true, and
it is true only of the leads. The REST summary endpoint the import uses returns
the first section; `action=query&prop=extracts&explaintext` returns the whole
article, and the whole article of a war is mostly a Background section whose
job is to name what came before it. Fetching the full text of thirty-two
fragment articles and matching them against every active title in `data/`
turned up four articles that argue for a record already here — and a fifth
class of hit worth as much, which is the refusals below.

#### `world-war-ii --precondition-of--> eritrean-war-of-independence`

The war's own article, revision 1374058781, lead: "Eritrea was an Italian
colony from the 1880s until the Italians were defeated by the Allies in World
War II in 1941. Afterward, Eritrea briefly became a British Military
Administration until 1951. The United Nations convened after the war to decide
Eritrea's future, voting in favor of a federation between Eritrea and
Ethiopia." And the Background section: "In 1952, the United Nations decided to
federate Eritrea with Ethiopia … Haile Selassie dissolved the federation and
annexed Eritrea, triggering a thirty-year armed struggle in Eritrea."

`precondition-of` and not `caused` or `enabled`, because what the source
asserts is a standing condition and not an act: the defeat of Italy put
Eritrea's disposition in the United Nations' hands, and the federation it
decided on is the thing whose dissolution the article says triggered the war.
Nine years and an annexation lie between, and the edge asserts none of them.

**This is the batch's whole value on A5.** It joins the seven-record Horn of
Africa fragment — `ethiopian-civil-war`, `eritrean-war-of-independence`,
`eritrean-ethiopian-war`, `ogaden-war`, `somali-civil-war`, `war-in-somalia`,
`tigray-war` — to the main chain, and it is the fragment batch 22 read three
leads for and put down.

#### `berlin-conference --enabled--> scramble-for-africa`

The period's own article, revision 1373841219, opens on the conference: "The
1884–1885 Berlin Conference regulated European colonisation and trade in
Africa, and is seen as emblematic of the 'scramble'." And in the section it
gives it: "the diplomats in Berlin laid down the rules of competition by which
the great powers were to be guided in seeking colonies … The Berlin Conference
transformed Africa's colonization from informal economic penetration to
systematic political control through its 'effective occupation' principle."

`enabled` and not `caused`, because the same article says the scramble was
already under way when the conference met — "The occupation of Egypt and the
acquisition of the Congo were the first major moves in what came to be a
precipitous scramble for African territory". Berlin supplied the rule it ran
under, not its beginning. `scramble-for-africa` was a component of one
carrying twelve children.

#### `treaty-on-the-non-proliferation-of-nuclear-weapons --precondition-of--> budapest-memorandum`

The treaty's article, revision 1375952857, in the section it gives Ukraine:
"Ukraine acceded to the NPT in 1994 as a non-nuclear-weapon state, and
committed to remove all former Soviet nuclear weapons from its territory. In
recognition of Ukraine's decision, the UK, the United States and Russia
provided security assurances to Ukraine under the Budapest Memorandum of 1994."

`precondition-of`, and `probable` rather than anything firmer **because the
same article states the sequence the other way round a hundred lines earlier**
— the republics "joined the NPT by 1994 following the signature of the
Budapest Memorandum on Security Assurances". Both sentences are in the source
and they do not agree about which came first; the edge takes the one in the
section devoted to the question and says here that the other exists. It joins
the three nuclear treaties, which were a component of their own.

#### `spanish-civil-war --inspired--> la-violencia`

The Colombian article, revision 1373312674, under its own heading on the
causes of the violence: "The atrocities that were committed at the outset of
the Spanish Civil War in 1936 were seen by both sides as a possible precedent
for Colombia, causing both sides to fear that it could also happen in their
country; this belief also spurred the credibility of the conspiracies and it
also served as a rationale for violence."

What crossed the Atlantic is an example and the fear of it, which is what
`inspired` is for in this vocabulary. The word carries no approval: what the
precedent was used to justify is mass killing. It joins the Colombian pair.

### The refusals, which are half of what the method found

- **`ogaden-war` and `second-italo-ethiopian-war`.** The Ogaden article's
  background does run through the 1935 war and the British military
  administration that followed it, but it gives the dispute's origin as
  Menelik II's invasions of the 1880s and the Anglo-Ethiopian treaty of 1897,
  neither of which this atlas holds. An edge from 1935 would be this run
  choosing a link in a chain the source starts elsewhere.
- **`ogaden-war` and `yom-kippur-war`.** The only mention is a measurement:
  the Soviet airlift to Ethiopia was "second in magnitude only to the colossal
  October 1973 resupplying of Syrian forces during the Yom Kippur War". A
  comparison of size is not a link.
- **`war-in-darfur` and `rome-statute-of-the-international-criminal-court`,
  `genocide-convention`, `1994-genocide-against-tutsi`, `the-holocaust`.** Four
  hits in one article and not one of them a cause. The Rome Statute is the
  instrument al-Bashir was charged under, the Genocide Convention supplies the
  definition the Pre-Trial Chamber applied, and Rwanda and the Holocaust
  appear in comparisons and in a survivors' open letter. **An instrument used
  to judge an event is not an event that caused it.**
- **`second-sudanese-civil-war` and `gulf-war`.** "During 1990 and 1991, the
  Sudanese government supported Saddam Hussein in the Gulf War. This changed
  American attitudes toward the country." A diplomatic alignment during a war
  elsewhere, with consequences for aid; the source nowhere says one war acted
  on the other.
- **`first-sudanese-civil-war` and `october-revolution`.** The hit is Sudan's
  own October Revolution of 1964 — "In October 1964 Abboud resigned over the
  massive scale of civil disobedience" — and this atlas's `october-revolution`
  is Russia's of 1917. **A title match is not an identity**, and this is the
  first time the method produced a false one.
- **`2021-myanmar-coup-d-etat` and `covid-19-pandemic`.** Three mentions: a
  charge for campaigning against pandemic rules, a conviction for violating
  pandemic protocols, and an IMF emergency package released days before the
  coup. Incidental every time.
- **`arab-spring` and `iraq-war`.** The mention is about the term: "In the
  aftermath of the Iraq War, it was used by various commentators and bloggers
  who anticipated a major Arab movement towards democratization." The name's
  history is not the wave's.
- **`british-expedition-to-tibet` and `russo-japanese-war`.** "The defeats the
  Russians experienced in the Russo-Japanese War that began in February 1904
  further altered perceptions of the balance of power in Asia" — a war that
  began after the expedition did, changing how the expedition was read. Not a
  cause of it.
- **`sierra-leone-civil-war` and `second-congo-war`.** The only occurrence is
  in the See also list.

**Nine refusals against four edges**, and the shape of them is worth keeping:
the full-text method finds four or five times as many candidate pairs as the
lead did, and most of what it adds is an instrument, a comparison, a See also
list or a namesake. The reading is the work; the fetch only makes it possible.

## 2ac. Batch 30 — the method run out, three edges and eleven refusals

*22 September, the second batch of the same fire and the same method: the full
article rather than the lead. Twenty-two more fragment articles read, three
edges, nothing imported. The measurement is in `docs/m42-pool.md` → "Batch
30".*

#### `1948-arab-israeli-war --precondition-of--> war-over-water`

The confrontations' article, revision 1370750282, opens its history with the
war: "Following the 1948 Arab–Israeli War, the 1949 Armistice Agreements
created three demilitarized zones on the Israel-Syria border. The southernmost,
and also the largest, stretched from the south-eastern part of the Sea of
Galilee eastwards to the Yarmuk River … The issue of water sharing from the
Jordan–Yarmuk system turned out to be a major problem between Israel, Syria
and Jordan." The armistice drew the ground the water was fought over.
`precondition-of`: the source makes the war the origin of the line, not of the
fight.

#### `1982-lebanon-war --precondition-of--> war-of-the-camps`

The siege's Background, revision 1373013393, runs from the invasion to the
siege without branching: the 1982 invasion "succeeded in driving thousands of
Palestinian fighters … out of Southern Lebanon and West Beirut"; "Arafat's
Fatah forces quietly returned to Lebanon over the next two years, ensconcing
themselves in the many refugee camps in Beirut and the South"; "As more
Palestinians regrouped in the South, Assad's anxiety grew … This time, Assad
recruited the more powerful Shia Amal Movement militia headed by Nabih Berri
to dislodge Arafat's loyalists." **Every step of that is the source's and the
compression into one link is this atlas's**, which is what `precondition-of`
and `probable` are for here.

#### `first-sudanese-civil-war --precondition-of--> darfur-genocide`

Revision 1373825853, § Background: "After Sudan gained independence from the
United Kingdom in 1956, various conflicts broke out across the country,
including the First Sudanese Civil War … These conflicts, combined with
limited state investment in western regions such as Darfur, increased the
feelings of marginalization within some local communities." The article gives
environmental change first place among the causes and this second; the edge
takes the second and claims no more for it than the article does. It takes
`darfur-genocide` off the list of events with no edge at all and joins it to
Sudan's five, which is still a fragment.

### The eleven refusals

- **`indochina-wars` and `world-war-ii`.** The umbrella's lead does say "During
  the aftermath of World War II and the Cold War, the Indochina wars … were a
  series of wars", and the mechanism it gives — the Japanese surrender of 15
  August 1945, the August Revolution, the fall of the Empire of Vietnam — is
  real. **But the mechanism attaches to `first-indochina-war`, which this
  atlas already holds and which is already on the main chain.** An edge to the
  umbrella instead would be this run choosing the more impressive endpoint.
- **`afghan-conflict` and anything.** Its article's lead names four records
  this atlas holds and **every one of them is its own child**
  (`saur-revolution`, `soviet-afghan-war`, `war-in-afghanistan-2001-2021`,
  and the two civil wars). The act it says the conflict began with — the 1973
  coup that deposed Zahir Shah — this atlas does not hold.
- **`arab-israeli-conflict` and `world-war-i`.** The lead roots the conflict in
  the dissolution of the Ottoman Empire after the First World War and the
  Mandate that followed. It is true and it is three steps, and the atlas
  already reaches all three through the umbrella's own children. **An edge
  from a world war to a conflict umbrella is the shape the brief's §1 warns
  about** — "a `precondition-of` from every twentieth-century war to the Cold
  War would clear any queue and say nothing true" — and this run wrote two
  edges from a world war today already.
- **`treaty-of-lhasa` and `british-russian-convention`.** The Anglo-Russian
  Convention appears in the Convention of Lhasa's See also list and nowhere
  else. **Batch 22 refused this pair from the other side**, reading the
  convention's own lead; the two refusals agree.
- **`kaocen-revolt` and `world-war-i`.** Also a See also list ("Military
  operations in North Africa during World War I"). The lead gives the Sanusiya
  declaration of jihad from Kufra in October 1914 as what Kaocen rallied to,
  and this atlas does not hold it.
- **`sino-soviet-border-conflict` and `cultural-revolution`.** The article
  argues it twice — "Tensions at first built slowly, but the Cultural
  Revolution made them rise much faster" — and the two are already one
  component, so nothing was written that was not there.
- **`south-sudanese-civil-war` and `covid-19-pandemic`**, **`interwar-period`
  and `world-war-i`**, **`baring-crisis`, `louvre-accord`, `aarhus-convention`,
  `hay-bunau-varilla-treaty`, `thousand-days-war` and anything at all.** The
  pandemic appears in South Sudan as one of three compounding pressures on a
  famine; the interwar period's article names the two wars *definitionally*,
  as the dates it runs between, which is a definition and not an argument; and
  the last five have articles of two to eleven thousand characters that name
  no other record here.

**Three edges from twenty-two articles, against four from thirty-two in batch
29.** The method's yield is falling as the easy fragments go, and what is left
is mostly umbrellas — which is the finding of the batch and is in
`docs/m42-pool.md`.

## 2ad. Batch 31 — four edges for six imports, and the three that earned none

*22 September, the third batch of the same fire and the first that imported
anything. Six rows of the `part of` vein, all filed. The measurement, and the
forty-six refusals, are in `docs/m42-pool.md` → "Batch 31".*

#### `saur-revolution --reacted-to--> 1979-herat-uprising`

The uprising's article, revision 1370623531. Lead: it "included both a popular
uprising and a mutiny of ethnic Tajik Afghan Army troops against the Democratic
Republic of Afghanistan (DRA) … the deadliest incident in the 1978-1979 period
following the Saur Revolution and before the start of the Soviet occupation in
December 1979." Background: "The events in Herat took place in the wider
context of unrest against the communist reforms implemented by the DRA, of
which the principal was agrarian reform … Starting in May 1978 in Nuristan,
spontaneous uprisings took place throughout Afghanistan against the DRA and its
policies." And the article reports the Soviet Politburo's own assessment "that
it was caused by the DRA regime". The revolution installed the regime the
rising rose against, which is what `reacted-to` says here.

#### `1979-herat-uprising --precondition-of--> soviet-afghan-war`

The same article, § Aftermath: "the Soviets did increase their military
assistance in the following months … Despite this, the situation of the Afghan
armed forces continued to deteriorate, with mutinies occurring in Jalalabad,
Asmar, Ghazni, Nahrin, and in August 1979, the Bala Hissar uprising on a
fortress in Kabul. Though these were all put down, the weakness of the military
contributed significantly to the spread of the insurgency. On December 24,
1979, under Leonid Brezhnev, the Soviet Union deployed the 40th Army,
commencing the start of the Soviet–Afghan War." Herat is the first and largest
of those mutinies and the one the Soviets were asked for help with and refused.
`precondition-of`: the article makes the army's weakness what spread the
insurgency, not this rising by itself.

#### `1982-lebanon-war --enabled--> mountain-war`

Revision 1371504591, § Background: "In the wake of the June 1982 Israeli
invasion of Lebanon, the main Maronite Christian ally of Israel, the Lebanese
Forces (LF) militia … sought to expand its area of influence in Lebanon. The LF
tried to take advantage of Israel Defense Forces (IDF) advances to begin
deploying troops in areas where they had not been present before … With the
tacit backing of the IDF, Lebanese Forces' units … moved into the
Christian-populated areas of the western Chouf … However, this brought them
into confrontation with the local Druze community, who viewed the LF as
intruders on their territory." The invasion put the Lebanese Forces on ground
they had not held; the confrontation there is this war.

#### `colombian-conflict --reacted-to--> colombian-peace-process`

Revision 1375561117, first sentence: the process "refers to the negotiations
between the Government of Colombia under President Juan Manuel Santos and the
Revolutionary Armed Forces of Colombia (FARC–EP) aimed at ending the
decades-long Colombian conflict." A peace process is what a war is answered
with.

### The three that earned none

- **`bala-hissar-uprising`.** Its own English article is 1,534 characters and
  says what happened and nothing about why; the Herat article names it only in
  a list of mutinies. An edge from `saur-revolution` would have been the
  Herat argument applied to a record whose own source does not make it.
- **`effacer-le-tableau`.** "a military operation carried out **during** the
  Second Congo War by the Movement for the Liberation of the Congo and Rally
  for Congolese Democracy-National against the government-aligned Rally for
  Congolese Democracy-Movement for Liberation." That is containment, which is
  what the filing carries.
- **`assassination-of-miguel-uribe-turbay`.** The article, at revision
  1345275508, names no other event this atlas holds. It is filed under
  `colombian-conflict` because Wikidata says it is part of it, and the filing
  is the whole of what is claimed.

## 2ae. The edge that was deleted, and why it was right to delete it

*22 September, at the end of the fire.* `berlin-conference --enabled-->
scramble-for-africa`, written in batch 29 and argued in § 2ab above, **is
deleted**. `tests/m42-filing.test.mjs` refuses any edge at either end of a
record carrying the `m42-umbrella` flag — *"an umbrella is not a claim"* — and
`scramble-for-africa` is one of the three umbrellas the filing pass created.

The argument the edge rested on is not withdrawn: the period's own article
does say the conference "laid down the rules of competition by which the great
powers were to be guided in seeking colonies" and "transformed Africa's
colonization from informal economic penetration to systematic political
control". What is withdrawn is the claim that **that sentence can be an edge
in this atlas**, and the reason is A6's own: a period is a filing, a way of
making the resting timeline readable, and it is not a thing that happens to
other things. Batch 29 wrote the edge without checking the rule the same run
had written; the suite caught it before the check did.

## 2af. Batch 35 — the three edges Africa's first batch of the vein earned

*22 September, the fire of 18:13Z. Ten records from the inverse `part of` vein
asked of the `africa` lane; three edges, each from an article that argues it in
its own voice, and seven records that earned none and were left to say so.*

**`battle-of-adwa --reacted-to--> second-italo-ethiopian-war`.** Read in this
direction the edge says the second war answered the first war's defeat. Adwa's
own article, § Significance at revision 1375956865, carries two historians
saying so — Tripodi, that *"some of the roots of the rise of Fascism in Italy
went back to this defeat and to the perceived need to 'avenge' the defeat"*,
and Levine, that Adwa *"became a national trauma which demagogic leaders strove
to avenge. It also played no little part in motivating Italy's revanchist
adventure in 1935"* — beside Mussolini's own words on taking Addis Ababa in May
1936, *"Adua è vendicata"*. The Second Italo-Ethiopian War's article agrees
from the other end, § Background at revision 1374151253, calling Adwa, taken on
6 October 1935, *"a symbolic place for the Italian army as it was the site of
their defeat"*. `reacted-to` and not `caused`: what the two articles argue is a
motive forty years later, not a chain of events, and this atlas already holds
the war-to-war link as `first-italo-ethiopian-war --precondition-of-->
second-italo-ethiopian-war`. The finer edge says something the coarser one does
not — *why* the second war was fought where it was fought.

**`battle-of-mogadishu-1993 --precondition-of--> war-in-somalia`.** The
battle's own article, § Legacy at revision 1376073635, states the link and
states its strength: *"Fears of committing large numbers of US troops to
Somalia in the years following the battle in part led to the CIA using Somali
warlords as proxies against the Islamic Courts Union in the 2000s, and backing
the Ethiopian military during the invasion of Somalia that followed."* That
invasion, from December 2006, is `war-in-somalia`. `precondition-of` is
deliberately the weakest of the five types: the article says the aversion the
battle left behind shaped which instrument the United States reached for
thirteen years later, not that the battle caused the war, and *"in part"* is
the article's own hedge and is kept.

**`battle-of-tripoli-2011 --precondition-of--> killing-of-muammar-gaddafi`.**
The killing's article opens its account of what happened with the fall of the
capital, § Events at revision 1375974277: *"After the fall of Tripoli to forces
of the opposition NTC in August 2011, Gaddafi and his family escaped the Libyan
capital… In fact, Gaddafi had fled in a small convoy to Sirte on the day
Tripoli fell"* — and it was at Sirte, two months later, that he was caught and
killed. The Tripoli article's own lead, revision 1374512796, says the same
thing from its end: the battle was the National Transitional Council
*"attempting to overthrow Gaddafi and take control of the capital"*. Losing the
capital is what put him in the town where he died, and the articles argue no
more than that.

**All three are `probable`.** Every citation is Wikipedia, and rule 22 refuses
`consensus` to an edge whose support is Wikipedia alone; none of the three
pretends otherwise.

**The seven that earned none** — `battle-of-annual`, `operation-serval`,
`abushiri-revolt`, `siege-of-mafeking`, `battle-of-magersfontein`,
`first-battle-of-brega` and, on its own account, `killing-of-muammar-gaddafi`,
which is the far end of an edge and the near end of none — were each read for
one and refused it, with the reasons in `docs/m42-pool.md` under batch 35.
Nothing was written to keep them.

## 2ag. Batch 36 — five edges, four of them inside one week of one war

*22 September, the second batch of the same fire. Batch 34 concluded that the
phases of one war are chronological to each other and not causal; this batch
took five rows of the Second Boer War and four of its five edges run between
them. Both are true, and what separates them is whether the articles argue the
commanders' decisions.*

**`siege-of-ladysmith --reacted-to--> battle-of-spion-kop`.** Spion Kop's own
lead, revision 1374078287, says what the battle was for: it was fought *"during
the campaign by the British to relieve the besieged city Ladysmith during the
initial months of the Second Boer War"*, on a hilltop *"about 38 km (24 mi)
west-southwest of Ladysmith"*. The edge says the battle answered the siege and
nothing more.

**`siege-of-ladysmith --reacted-to--> second-battle-of-colenso`.** The same
claim six weeks earlier, from Colenso's § Background at revision 1370736054:
Buller *"assumed command of his largest detachment and proposed to lead it to
the relief of a besieged British force in Ladysmith, in Natal"*, and the Boers
*"had retired north of the Tugela River at Colenso and dug in there, blocking
the road and railway line to Ladysmith"*.

**`battle-of-stormberg --reacted-to--> second-battle-of-colenso`** and
**`battle-of-magersfontein --reacted-to--> second-battle-of-colenso`.** One
sentence of the same section carries both, and it names both battles: *"On
hearing that Gatacre and Methuen had been defeated at the battles of Stormberg
and Magersfontein, Buller felt he needed to relieve Ladysmith as soon as
possible and resume overall command of the forces in South Africa"* — and, the
paragraph goes on, *"He decided to make a frontal assault at Colenso"* rather
than the flank march at Potgieter's Drift he had intended. What is claimed is
that the two defeats are why Colenso was fought the way it was fought, not that
either caused the battle, which is why the type is `reacted-to`. Both are
written rather than one standing for the pair, because the atlas holds both —
`battle-of-magersfontein` having arrived in batch 35 an hour earlier.

**`battle-of-annual --precondition-of--> alhucemas-landing`.** The landing's
§ Background at revision 1370427911 opens with the defeat — *"After the Battle
of Annual in July 1921, the Spanish army was unable to regain control of the
central Rif region. It undertook a containment policy… In parallel, the
Minister of War ordered the creation of an inquiry commission"* — and runs from
there to the agreements that included *"the plan for a Spanish landing on the
Alhucemas bay"*. It also says the target was older than the defeat: *"All
Spanish land operations, included the Disaster of Annual in 1921, were aimed at
the occupation of Alhucemas"*. `precondition-of` is the exact claim: Annual is
the situation the landing was planned out of, not its cause.

**All five are `probable`** (rule 22), and all five edges together moved the
largest connected component by nothing, because every one of them runs between
records these two batches created. `docs/m42-pool.md` under batch 36 says why
and what would move it.

**The refusal worth more than the five.** The Battle of Mogadishu's § Legacy
says that *"many commentators identif[y] the Battle of Mogadishu's graphic
consequences as the key reason behind the US's decision to not intervene in
later conflicts such as the Rwandan genocide of 1994"*, and this atlas holds
`1994-genocide-against-tutsi`. No edge was written, because what the article
argues is about the **response** and not about the event: Mogadishu is offered
as a reason the United States stayed out, not as anything standing behind the
genocide. `battle-of-stormberg`, `battle-of-waterberg`,
`battle-of-misrata-2011`, `ogossagou-massacre`, `battle-of-algiers-1956-1957`
and `battle-of-paardeberg` earned nothing further and nothing was written to
keep them.

## Batch 37 — eight edges from the joins vein

*22 September, 21:07Z. The vein is the eight Wikidata properties that are
already a causal claim rather than `P361`; `docs/m42-pool.md` under batch 37
says why that changes the yield. Every edge below was read from the article the
record cites, at the revision named, and every one is `probable` (rule 22).*

**`suez-crisis --precondition-of--> six-day-war`.** The Six-Day War's
§ Background at revision 1375500255 says the 1956 crisis *"ultimately result[ed]
in the reopening of the Straits of Tiran to Israel and the deployment of the
United Nations Emergency Force (UNEF) along the Egypt–Israel border"*, and that
Israel held to its *"post-1956 position that another Egyptian closure of the
Straits of Tiran to Israeli shipping would be a definite casus belli"*. In May
1967 Nasser closed them again and *"ordered the immediate withdrawal of all UNEF
personnel"*. `precondition-of` is the exact claim: the crisis built the
arrangement whose undoing the article gives as the war's occasion.

**`six-day-war --precondition-of--> war-of-attrition`.** The same article's
§ Aftermath carries one sentence under the heading *War of Attrition*: *"After
the war, Egypt initiated clashes along the Suez Canal in what became known as
the War of Attrition."* The canal is the line the June war drew.

**`angolan-war-of-independence --precondition-of--> angolan-civil-war`.** The
war of independence's § Alvor Agreement at revision 1370428662 says the accord
*"ended the war for independence while marking the transition to civil war"*,
and that *"the coalition government established by the Alvor Agreement soon fell
as nationalist factions, doubting one another's commitment to the peace process,
tried to take control of the colony by force"*. The three movements that fought
Portugal are the parties of the war that followed.

**`war-in-somalia --precondition-of--> somali-civil-war-2009-present`.** The
lead of *Somali Civil War (2009–present)* at revision 1374631534 says that
*"during the insurgency that followed the 2006 Ethiopian invasion of Somalia,
al-Shabaab rose to prominence and made major territorial gains"*, that the
Transitional Federal Government *"was on the verge of collapse"* weeks before
the occupation ended, and that the Ethiopian withdrawal of early 2009 and Sharif
Ahmed's election marked *"a new phase of the civil war"*.

**`second-sudanese-civil-war --caused--> comprehensive-peace-agreement`** and
**`comprehensive-peace-agreement --precondition-of-->
2011-south-sudanese-independence-referendum`.** The agreement's lead at revision
1372495468 carries both in three sentences: it was *"an accord signed on 9
January 2005, by the Sudan People's Liberation Movement (SPLM) and the
Government of Sudan"*, it *"was meant to end the Second Sudanese Civil War"*,
and it *"also set a timetable for a Southern Sudanese independence referendum"*.
The vote of January 2011 is the one the accord scheduled.

**`marco-polo-bridge-incident --caused--> second-sino-japanese-war`.** The
incident's lead at revision 1370745067 says fighting *"broke out while the
Japanese complaint was still under negotiation"* on the night of 7 July 1937,
and that the incident *"is generally regarded as the start of the Second
Sino-Japanese War"*. Both ends were already here and an isolated record joined
the largest component with nothing imported.

**`operation-serval --precondition-of--> operation-barkhane`.** Barkhane's
§ Background at revision 1370630875 says that *"following the end of Operation
Serval, France recognised the need to provide stability in the wider Sahel
region"*, that Barkhane *"was launched in order to assure the Sahel nations'
security"*, and that *"the operation is the successor of Operation Serval, the
French military mission in Mali, and Operation Epervier, the mission in Chad"*.

**The refusal worth the most.** Wikidata says (`P1542`) that the Battles of
Khalkhin Gol have as their effect the Molotov–Ribbentrop pact, which would have
joined an isolated record to the largest component for nothing. The article at
revision 1371868221 says it the other way round — the pact *"deprived the
[Kwantung] Army of the basis of its war policy against the USSR"* — and of the
battle says only that its defeat, with Chinese resistance and the pact,
*"moved the Imperial General Staff in Tokyo away from the policy of the North
Strike Group"*. **A property is a claim and the article is the check**, which is
amendment A13's rule applied a fire before A13's own.

## Batch 38 — the joins vein asked of the Asia lane

The same six directional properties batch 37 asked of Africa (`P828`, `P1542`,
`P1478`, `P1536`, `P1479`, `P1534`), asked now of the **120 active `asia`-lane
events that carry a Wikidata id**: 93 rows, of which **9 are held-to-held** and
**81 name an item the atlas does not have**.

**`israeli-declaration-of-independence --caused--> 1948-arab-israeli-war`.** The
declaration's lead at revision 1372097190 places it *"at the end of the civil
war phase and beginning of the Arab–Israeli War of the 1948 Palestine war"* and
says the state it declared *"would come into effect on termination of the
British Mandate at midnight that day"*. Wikidata states the same link in the
same direction (`Q49092`, `P828`).

**`lebanese-civil-war --caused--> taif-agreement`.** The agreement's lead at
revision 1369818876 says it *"was reached to provide the basis for the ending of
the civil war and the return to political normalcy in Lebanon"* and *"was
designed to end the 15 year-long Lebanese Civil War"*.

**`taif-agreement` is filed inside `lebanese-civil-war` and names neither an
actor nor a place**, so the filing is argued here, which is where M67's weaker
test asks for it. The record is placeless because its item carries no `P625`,
no `P276`, no `P131` and no `P17` at all, and A9 writes a place from a
coordinate or writes none; what puts it inside the war is not a point but the
article's own sentence — the accord is the war's settlement, signed on 22
October 1989 and ratified on 5 November, inside a war this atlas dates
1975–1990. Its lane is written on the record with a note saying the same thing:
the accord was *"negotiated in Taif, Saudi Arabia"* and ends a war drawn in the
`asia` lane.

**`2006-hezbollah-cross-border-raid --caused--> 2006-lebanon-war`.** The raid's
lead at revision 1370102562 says that after the ambush *"Israel refused and
launched a large-scale ground and air campaign across Lebanon in response to
the Hezbollah raid. This marked the start of the 2006 Lebanon War."* The raid is
also filed as part of that war, which is Wikidata's own `P361` and a display
fact; the edge is the separate claim that the campaign answered it.

**`railway-protection-movement --enabled--> wuchang-uprising`.** The movement's
lead at revision 1361142110 says *"the mobilization of imperial troops from
neighboring Hubei Province to suppress the Railway Protection Movement created
the opportunity for revolutionaries in Wuhan to launch the Wuchang Uprising"*.
**`enabled` and not `caused`**, because that is the sentence's own shape: what
the movement produced was the opening — a garrison sent out of Wuhan — and not
the decision to rise. Wikidata records it as the uprising's cause (`Q339291`,
`P828`); the atlas reads it at the weaker of the two types the sources allow.

### The two held-to-held pairs the articles refused

Batch 37's rule — **a property is a claim and the article is the check** — cost
this batch both of the free edges the vein offered, which is the first time it
has refused more than it wrote.

- **`lebanese-civil-war` and `sabra-and-shatila-massacre`** (`P1542`, has
  effect). The massacre's lead at revision 1375981084 says nothing of the kind:
  it gives the 1982 Israeli invasion, the PLO withdrawal, the withdrawal of the
  multinational force and Bashir Gemayel's assassination as the circumstances,
  and never says the civil war caused the killings. What the article describes
  is a massacre **inside** the war, which is containment and not an argument.
- **`second-guangzhou-uprising` and `wuchang-uprising`** (`P1542`, has effect).
  The uprising's lead at revision 1370737006 says only that it *"was a failed
  uprising that took place in China"*, led by Huang Xing against the Qing in
  Canton. It does not connect the two, and an edge written on the property alone
  would be this atlas asserting what neither article says.

## The curation fire of 23 September — A13's relations pass, 56 edges

*The first run of the pass amendment A13 added: every active event's cited
article, read whole at its current revision, for any other event the atlas
holds. 539 articles, 267 pairs where a causal cue shares a sentence with
another event's name, 56 edges.* `docs/m42-pool.md` → `## Curation
2026-09-23` carries the counts, the refusals and the method; this file
carries the edges.

**The locator on every one of them is the article, the revision and the
section**, and the explanation quotes the sentence, so a reviewer goes to the
paragraph rather than to the article. That is the same standard batches 29
to 38 wrote to, at the scale A13 asks for.

### The pair batch 38 refused, and why this is not a reversal

Above, under "The two held-to-held pairs the articles refused", this file says
of **`second-guangzhou-uprising` and `wuchang-uprising`** that *"the
uprising's lead at revision 1370737006 says only that it was a failed uprising
that took place in China"*. That is true of the lead, and the lead is all the
cache under `tools/import/cache/wikipedia/` holds — its longest file is 4,947
characters and its median is 415.

The whole article, **at that same revision 1370737006**, § Legacy, says:

> They were commemorated as the "72 martyrs." Some historians believe that the
> uprising was a direct cause of the Wuchang Uprising, which eventually led to
> the 1911 Revolution and the founding of the Republic of China.

So `second-guangzhou-uprising --caused--> wuchang-uprising` is written, at
`probable`, with *"Some historians believe"* kept in the explanation rather
than dropped. **Batch 38 was right about its evidence; this pass has more of
it**, and the difference between them is not a newer revision and not a
better judgement — it is the same revision read whole instead of read to the
end of its first paragraph.

### The five the arrow of time refused

Rule 4 is the second reader here, and what it caught is worth more than four
of the five edges it cost.

- **`treaty-of-brest-litovsk` and `russian-civil-war`.** The civil war's
  article says the treaty's signature *"resulted in direct Allied intervention
  in Russia and the arming of military forces opposed to the Bolshevik
  government"*. The treaty is March 1918 and the war begins November 1917: what
  the article describes is a cause operating **inside** the war, which is the
  same shape as the Sabra and Shatila refusal above and not an edge between
  these two records.
- **`revolutions-of-1989` and `ethiopian-civil-war`.** The 1989 article's
  § Africa makes the withdrawal of Soviet and Cuban assistance what the Derg
  was finally beaten without — the war's **end**, and the war began in 1974.
- **`february-revolution` and `basmachi-movement`.** The movement's record
  begins in 1916.
- **`insurgency-in-kosovo` and `kosovo-war`**, and **`operation-sutton` and
  `battle-of-san-carlos`.** Both refused on days rather than on years, and
  **both are record dates that are wrong**: the insurgency is dated 1998-02-28
  against its own lead's *"began in 1995"*, and Operation Sutton — which **is**
  the San Carlos landing of 21 May 1982 — is dated 1982-05-23 against a battle
  dated 1982-05-21. Correcting those two from the cited article writes two
  edges that are already argued.

### The eight the umbrella rule refused

Batch 31a's rule stands and this file records what it now costs. Three of the
eight are the plainest links the corpus has:

- **`world-war-i` and `world-war-ii`**, from the Second World War's own lead:
  *"The causes of World War II included unresolved tensions in the aftermath of
  World War I and the rise of fascism in Europe and militarism in Japan."*
- **`world-war-ii` and `decolonisation-of-africa`**, from the decolonisation
  article's § External causes: *"Italy, a colonial power, lost its African
  empire … as a result of World War II."*
- **`scramble-for-africa` and `world-war-i`**, from the Scramble's § Aftermath:
  *"The tensions between the imperial powers led to a succession of crises,
  which exploded in August 1914, when previous rivalries and alliances created
  a domino situation that drew the major European nations into World War I."*

Each is refused because one end carries an umbrella flag. The arguments are
kept here because the records, not the edges, are what would have to change.

## Batch 42 — three edges, and the two the articles would not argue for

*23 September, the Africa batch of the inverse `part of` vein, run with the
filter over every record and not the active ones. Five imports, three edges,
and the largest connected component 539 → 542. Full account in
`docs/m42-pool.md` under "Batch 42".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `italo-turkish-war` → `first-balkan-war` | `enabled` | *"Members of the Balkan League, seeing how easily Italy defeated the Ottomans and motivated by incipient Balkan nationalism, attacked the Ottoman Empire in October 1912, starting the First Balkan War a few days before the end of the Italo-Turkish War."* — "Italo-Turkish War", revision 1370624672 |
| `libyan-civil-war` → `2011-military-intervention-in-libya` | `reacted-to` | *"On 19 March 2011, a NATO-led coalition began a military intervention into the ongoing Libyan Civil War to implement United Nations Security Council Resolution 1973"*, passed with the intent of *"an immediate ceasefire in Libya, including an end to the current attacks against civilians"* — "2011 military intervention in Libya", revision 1370780938 |
| `battle-of-karameh` → `black-september` | `caused` | *"The battle of Karameh and the subsequent increase in the PLO's strength are considered to have been important catalysts for the 1970 events of the civil war known as Black September"*, after *"more than 5000 individuals applied to join Fatah within the next 48 hours"* — "Battle of Karameh", revision 1374545421 |

All three are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus.

**Two refusals, and one of them is the third of its kind in three batches.**
`14-october-2017-mogadishu-bombings` names one other event in its whole article
— the 2011 Mogadishu bombing it is measured against — and this atlas does not
hold it. `operation-green-sea` has a Consequences section naming the purges
inside Guinea, UN Security Council Resolution 290, the OAU resolution and the
Soviet naval patrol, none of them here; it does **not** join the raid to
`cabral-assassinated-1973`, although capturing Cabral was the raid's stated
goal and the atlas holds his assassination. The edge the corpus wants is not
the edge the source argues, and the source is what is being quoted.

**One edge of the lead was refused on type rather than on evidence.** The
Italo-Turkish War's lead also calls the war *"a precursor of World War I"*.
A precursor is a periodisation and not a mechanism, and all five of this
atlas's edge types assert a mechanism — batch 41's rule, applied again.

## Batch 48 — the Algerian War read as a chain

*24 September, the import fire that picked the run up at 08:18Z. The Africa
lane trails at 139 against Europe's 375, so the batch is taken from it; the
full note, the refusals and the counts are in `docs/m42-pool.md` under
"Batch 48".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `philippeville-massacre` → `battle-of-algiers-1956-1957` | `precondition-of` | *"On 20 August 1955, violence broke out around Philippeville, drastically escalating the conflict."* — "Battle of Algiers (1956–1957)", revision 1374865618, § Background |
| `milk-bar-cafe-bombing` → `battle-of-algiers-1956-1957` | `precondition-of` | *"On the evening of 30 September 1956, a trio of female FLN militants ... carried out the first series of bomb attacks on three civilian targets in European Algiers"*, and, in the lead, *"Reprisals followed and the violence escalated, leading the French Governor-General to deploy the French Army in Algiers to suppress the FLN"* — same article and revision, § First phase and lead |
| `may-1958-crisis-in-france` → `challe-plan` | `precondition-of` | *"Tensions finally culminated in the May 1958 crisis, which saw General Charles de Gaulle take power and establish the French Fifth Republic. ... In early 1959, De Gaulle resorted to a decisive military offensive"* — "Challe Plan", revision 1370610721, § Background |
| `challe-plan` → `algiers-putsch-of-1961` | `precondition-of` | *"De Gaulle therefore put his efforts into seeking a political solution. The Colons and part of the army resisted this move, which nearly resulted in a civil war; Challe himself was one of the heads of the Algiers Putsch"* — same article and revision, § Aftermath |
| `challe-plan` → `evian-accords` | `precondition-of` | *"The Challe plan, despite military success, failed to achieve its ultimate goal and the FLN were not defeated. ... De Gaulle therefore put his efforts into seeking a political solution."* — same article, revision and section |
| `evian-accords` → `battle-of-bab-el-oued` | `reacted-to` | *"The OAS decided to dig in at their stronghold of Bab El Oued ... to fight the Evian Agreements by force"* — "Battle of Bab El Oued", revision 1370432852, § Context; and *"One of the primary forces of opposition to the signing of the Evian Accords ... was the Secret Army Organisation (OAS)"* — "Évian Accords", revision 1372137587 |

All six are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. The last runs from the accords to the battle and not the other way
round, because rule 4 reads the arrow of time and the atlas's `reacted-to`
says *the later record answered the earlier one* — which is what both articles
say happened in the five days between 18 and 23 March 1962.

**`may-1958-crisis-in-france` names neither an actor nor a place, and it is
filed under `algerian-war` all the same.** Its item gives no `P710` and no
`P276`, `P131` or own `P625`; the only located thing it names is `Q69829`, the
French Fourth Republic, whose point is Paris and which this atlas holds as
neither a place nor an actor, so the record takes the `europe` lane from that
point and stays placeless. It is filed under the Algerian War because its own
cited article, at revision 1373489110, calls it *"a political crisis in France
during the turmoil of the Algerian War"* and carries the category *"1958 in
the Algerian War"* — the reading is the article's and not the item's, which
states no `P361` at all, and the record's `review.note` says so. Without the
filing it would have been the 243rd main event, which A6 forbids; with it, the
one French record of an Africa batch sits where the source puts it.

## Batch 49 — the Russo-Japanese War finished as a chain

*24 September, the import fire that picked the run up at 10:46Z. Today already
carries a `## Curation 2026-09-24` section and all six of A14's passes have
theirs, so this is an import fire; A10's order of need puts **Asia** at the
front, trailing at 143 against Europe's 377. The full note, the refusals and
the counts are in `docs/m42-pool.md` under "Batch 49".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `battle-of-chemulpo-bay` → `battle-of-the-yalu-river-1904` | `enabled` | *"After the success of the Imperial Japanese Navy at the Battle of Chemulp'o Bay on 9 February 1904, the way was clear for the Imperial Japanese Army to deploy the 2nd, the 12th, and the Guards Divisions of the Japanese 1st Army ... into Korea."* — "Battle of Yalu River", revision 1370602766, § Background |
| `battle-of-nanshan` → `battle-of-te-li-ssu` | `reacted-to` | *"After the loss to the Japanese at the Battle of Nanshan, the Russian Viceroy Yevgeni Alekseyev came under extreme political pressure to make a military advance"*, and *"General Kuropatkin was reluctantly forced to mount an offensive from Liaoyang in the general direction of Port Arthur"* — "Battle of Te-li-Ssu", revision 1370590724, § Background |
| `battle-of-te-li-ssu` → `battle-of-tashihchiao` | `precondition-of` | *"the 1st Siberian Army Corps under Lieutenant General Georg von Stackelberg (consisting of surviving forces from the disaster at Telissu, which had retreated north towards Liaoyang, but which had received new orders diverting them to Kaiping)"* — "Battle of Tashihchiao", revision 1370590643, § Preparations by the Russians |
| `battle-of-tashihchiao` → `battle-of-liaoyang` | `precondition-of` | *"The town of Tashihchiao was of strategic importance ... Control of both was essential for further advances by Japanese forces towards Liaoyang and Mukden."* — same article and revision, first section |
| `battle-of-the-yellow-sea` → `battle-off-ulsan` | `reacted-to` | *"A telegram from the First Pacific Squadron at Port Arthur reached Vladivostok on the afternoon of 11 August 1904, stating that Admiral Wilgelm Vitgeft had decided to attempt to break through the Japanese blockade, and therefore Vice Admiral Jessen was ordered to sortie the Vladivostok Cruiser Squadron to assist."* — "Battle off Ulsan", revision 1370603310, § Sortie |
| `battle-of-liaoyang` → `battle-of-shaho` | `reacted-to` | *"After the Battle of Liaoyang the situation for General Alexei Kuropatkin ... became increasingly unfavorable ... Although he needed to reverse the tide of the war"* — "Battle of Shaho", revision 1370589119, § Background; and *"the Japanese had failed to take advantage of their victory at Liaoyang, allowing the Russians to retreat in good order and to soon launch a counterattack during the Battle of Shaho"* — "Battle of Mukden", revision 1375786749, § Background |
| `battle-of-shaho` → `battle-of-sandepu` | `precondition-of` | *"the Japanese advance on Mukden was paused, as both sides dug in to prepare for the next confrontation at the Battle of Sandepu (Heikoutai)"* — "Battle of Shaho", revision 1370589119, § Aftermath |
| `siege-of-port-arthur` → `battle-of-sandepu` | `reacted-to` | *"[Kuropatkin] was concerned about the impending arrival of the battle-hardened Japanese Third Army under General Nogi Maresuke to the front after the fall of Port Arthur on 2 January 1905"*, and *"Kuropatkin issued orders for the Second Manchurian Army to attack ... before Nogi's Third Army could arrive"* — "Battle of Sandepu", revision 1370588463, § Background and § The Battle of Sandepu |
| `japanese-invasion-of-sakhalin` → `treaty-of-portsmouth` | `enabled` | *"Roosevelt agreed with the Japanese assessment that the invasion and occupation of Sakhalin was now necessary, as only the threat of direct loss of Russian territory would bring Tsar Nicholas II to consider a negotiated settlement to the war."* — "Japanese invasion of Sakhalin", revision 1371432298, § Background |

All nine are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **All four `reacted-to` run from the earlier record to the later
one**, which is rule 4's arrow of time and the reading batch 48 wrote down:
the atlas's `reacted-to` says *the later record answered the earlier one*. All
four were first written the other way round, on the sense of the English verb,
and rule 4 refused all four in one run — which is the validator doing exactly
what it is for, and is deviation 953.

**`japanese-invasion-of-sakhalin --enabled--> treaty-of-portsmouth` is the
third branch into that endpoint**, beside `battle-of-tsushima --caused-->` and
batch 47's `battle-of-mukden --enabled-->`. The three are not a repetition:
Tsushima destroyed the fleet, Mukden took the field, and the invasion is the
one the article names as the thing that would bring the Tsar to the table —
*"only the threat of direct loss of Russian territory"*. A convergence of three
independently argued branches on one treaty is the query this atlas was built
around, and it now exists in the data.

**Two refusals, both chronology with no claim in it.** The Battle off Ulsan's
lead says it took place *"four days after the Battle of the Yellow Sea"*, which
is a date and not an argument; the edge written instead rests on the telegram in
§ Sortie, which says why the squadron was at sea. The Japanese invasion of
Sakhalin's § Background says the plan was reconsidered *"On 7 June 1905, shortly
after the Battle of Tsushima"* — the same shape as the eleven "Following" quotes
A14 (4) read again and dropped nine of, so `battle-of-tsushima →
japanese-invasion-of-sakhalin` was not written. What the article does claim
about the invasion is its purpose, and that is the edge above.

**A third was refused on its own reading.** The Battle of Chemulpo Bay's
§ Background puts it and the Battle of Port Arthur in one action — *"The opening
stage of the Russo-Japanese War began with a pre-emptive strike by the Imperial
Japanese Navy against the Russian Pacific Fleet spread among Port Arthur,
Vladivostok, and Chemulpo Bay"* — which makes them two halves of one strike
fought a day apart, and that is a filing under the war and not a cause between
them. The edge Chemulpo earns is the one the Yalu article argues, a month later
and in another country.

## Batch 50 — the Mali War read as a chain

*24 September, the import fire that picked the run up at 13:07Z. Today already
carries a `## Curation 2026-09-24` section and all six of A14's passes have
theirs, so this is an import fire; A10's order of need puts **Africa** at the
front, trailing at 147 against Europe's 378. The full note, the refusals and
the counts are in `docs/m42-pool.md` under "Batch 50".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `2012-malian-coup-d-etat` → `battle-of-kidal-2012` | `enabled` | *"Inspired in part by the diversion caused by the military coup, Tuareg rebels in the country's north launched incursions deeper into Mali, seizing towns and bases formerly held by government forces"*, and *"As military forces were engaged in consolidating their hold on the capital, the rebels were able to push southward with little opposition."* — "2012 Malian coup d'état", revision 1370102863, § Aftermath |
| `2012-tuareg-rebellion` → `battle-of-gao` | `precondition-of` | *"After the end of hostilities with the Malian Army, however, Tuareg nationalists and Islamists struggled to reconcile their conflicting visions for the intended new state. On 27 June, Islamists from the Movement for Oneness and Jihad in West Africa (MOJWA) clashed with the MNLA in the Battle of Gao"* — "Tuareg rebellion (2012)", revision 1370751541, lead; and *"Tensions then started between the MNLA and Islamist movements over the use of sharia law within the territory"* — "Battle of Gao", revision 1370441289, § Background |
| `battle-of-konna` → `operation-serval` | `caused` | *"However, the jihadist offensive in southern Mali provoked France's entry into the war. On January 11, the French army launched Operation Serval."* — "Battle of Konna", revision 1375363074, § Jihadist coalition advances in Sevare and Mopti and Operation Serval |
| `operation-serval` → `battle-of-diabaly` | `reacted-to` | *"On 13 January, the French Air Force bombarded major Islamist towns throughout northern Mali. As a result of this hundreds of Islamists fled to the Mauritania border, where they launched a counterattack on the western town of Diabaly."* — "Battle of Diabaly", revision 1370438795, § Background |
| `battle-of-diabaly` → `second-battle-of-gao` | `precondition-of` | *"A few days after taking the towns of Konna and Diabaly, the French and Malian forces continued their progress on Timbuktu and Gao"*, and *"After the capture of Diabaly, the special forces advanced in Gao, the largest city in northern Mali"* — "Second Battle of Gao", revision 1370736225, § Prelude |
| `battle-of-konna` → `battle-of-ifoghas` | `precondition-of` | *"After being defeated in January in the Battle of Konna and the Battle of Diabaly, the jihadists abandoned Timbuktu and retreated into the Adrar Tigharghar, a mountain of the Adrar of Ifoghas in northeastern Mali, which has been their sanctuary for years. The French started quickly a pursuit"* — "Battle of Ifoghas", revision 1370443583, lead |
| `battle-of-diabaly` → `battle-of-ifoghas` | `precondition-of` | the other half of the same sentence, same article and revision |
| `chadian-intervention-in-northern-mali` → `battle-of-ifoghas` | `enabled` | *"France was also seeking the help of Chad's President Idriss Déby. He agreed to deploy his army in the Adrar of Ifoghas. On February 3, the first Chadian soldiers arrived in Kidal."* — "Battle of Ifoghas", revision 1370443583, § Deployment of Franco-Chadian forces in the Kidal region; and *"the Chadian army launched a joint military operation with the support of French war jets on an Islamists base ... hidden in the mountains of the Adrar des Ifoghas"* — "Chadian intervention in northern Mali", revision 1370610691, § Timeline |

All eight are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **Seven of the eight run into or out of a record that was already
here** — the coup, the rebellion, Operation Serval — which is A5's own
standard, and the eighth (`battle-of-diabaly → second-battle-of-gao`) chains
the batch to itself.

**The one `reacted-to` runs forward in time**, as batch 49 wrote down:
`operation-serval --reacted-to--> battle-of-diabaly` says *Diabaly answered
Serval*, which is what the article's word "counterattack" says. Written that
way at the first attempt; rule 4 refused nothing this batch.

**`battle-of-ifoghas` is a convergence of three branches**, and each rests on a
different sentence: two defeats that drove the jihadists into the massif, and
the Chadian column that went in after them. The atlas's convergence query is
what that shape is for.

**Two edges rest on one sentence, and that is deliberate.** The Ifoghas lead
names Konna *and* Diabaly as the defeats behind the retreat, gives them equal
weight, and neither alone is what it says; writing one edge naming both would
be a claim the article does not make. The Gao prelude names both too, but its
next sentence singles Diabaly out — *"After the capture of Diabaly, the special
forces advanced in Gao"* — so only that one is written there.

**Three refusals, all the fire's own class: chronology with no claim in it.**

- The Diabaly article's § Order of battle: *"The jihadist offensive on Diabaly
  was launched parallel with that of Battle of Konna."* Parallel is not
  consequent, so `battle-of-konna → battle-of-diabaly` was not written even
  though the Konna article says eighty of the vanguard's pick-ups "were then
  detached to take part in the Battle of Diabaly". Two prongs of one offensive
  is a filing under the war, which both records have.
- The Tessalit article's first line: *"The siege of Tessalit occurred in early
  2012 during the Tuareg rebellion in Mali."* "During" is a filing and not an
  argument.
- The coup's § Background names the rebellion in general — *"weeks of protests
  of the government's handling of a nomad-led rebellion in the country's
  north"* — and no source read here names the fall of Tessalit as what broke
  the army's patience, so `siege-of-tessalit → 2012-malian-coup-d-etat` was not
  written. **`siege-of-tessalit` is therefore the one record of this batch with
  no edge at all**, and the stand says so rather than reaching for a sentence
  that is not there.

## Batch 51 — the Korean War read as a chain, and the component `parent` cannot join

*24 September, the import fire that picked the run up at 15:45Z. Today already
carries a `## Curation 2026-09-24` section and all six of A14's passes have
theirs, so this is an import fire; A10's order of need puts **Asia** at the
front, trailing at 149 against Africa's 155 and Europe's 378. The full note,
the refusals and the counts are in `docs/m42-pool.md` under "Batch 51".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `first-battle-of-seoul` → `battle-of-osan` | `precondition-of` | *"The North Koreans had captured South Korea's capital, Seoul, by June 28, which forced the government and its shattered army to retreat further south"*, and the column Task Force Smith met was *"advancing from Seoul"* — "Battle of Osan", revision 1375327001, § Outbreak of war and § Infantry column |
| `battle-of-osan` → `battle-of-taejon` | `precondition-of` | *"Within a week, the 24th Infantry Division had been pushed back to Taejon where it was again defeated in the Battle of Taejon"* — "Battle of Osan", revision 1375327001, § Aftermath; read with *"The 24th Infantry Division's regiments were already exhausted from the previous two weeks of delaying actions"* — "Battle of Taejon", revision 1370312872, lead |
| `battle-of-taejon` → `battle-of-the-pusan-perimeter` | `enabled` | *"the 24th Infantry Division achieved a strategic victory by delaying the North Koreans, providing time for other U.S. divisions to establish a defensive perimeter around Pusan further south. The delay imposed at Taejon probably prevented a U.S. rout during the subsequent Battle of Pusan Perimeter"*, and the order itself — *"ordered General Dean to hold Taejon until the 20th so that the 1st Cavalry Division and 25th Infantry Division could establish defensive lines along the Naktong River, forming the Pusan Perimeter"* — "Battle of Taejon", revision 1370312872, lead and § Second North Korean attack |
| `first-battle-of-seoul` → `battle-of-inchon` | `reacted-to` | *"Days after the beginning of the war, General of the Army Douglas MacArthur, the US Army officer in command of all UN forces in Korea, envisioned an amphibious assault to retake the Seoul area. The city had fallen in the first days of the war in the First Battle of Seoul."* — "Battle of Inchon", revision 1370266029, § Planning |
| `battle-of-inchon` → `second-battle-of-seoul` | `caused` | *"The operation involved some 75,000 troops and 261 naval vessels and led to the recapture of the South Korean capital of Seoul two weeks later"*, where the article's own link on "recapture" points at this record — "Battle of Inchon", revision 1370266029, lead |
| `battle-of-the-pusan-perimeter` → `battle-of-unsan` | `precondition-of` | *"After breaking out of the Pusan Perimeter at the south-east tip of the Korean peninsula in September, the UNC offensive pursued the Korean People's Army (KPA) through South Korea, into North Korea, and toward the Sino-Korean border"*, and *"In response to the rapid KPA collapse and the UNC advance toward the Chinese border, Chairman Mao Zedong ordered the People's Liberation Army's North East Frontier Force to be reorganized into the People's Volunteer Army (PVA) for the upcoming intervention in Korea"* — "Battle of Unsan", revision 1370276047, § Background |
| `battle-of-unsan` → `battle-of-the-ch-ongch-on-river` | `precondition-of` | *"the PVA 13th Army Group surprised and defeated the Republic of Korea Army (ROK) II Corps and the US 1st Cavalry Division in a series of battles around Onjong and Unsan, destroying the right flank of the US Eighth Army while forcing the UN forces to retreat back to the Ch'ongch'on River"*, and *"Because of the earlier UN defeat at the Battle of Unsan, the US 25th Infantry Division expected to encounter heavy PVA resistance during its advance"* — "Battle of the Ch'ongch'on River", revision 1374278822, § Background and § Actions at Ipsok |
| `battle-of-the-ch-ongch-on-river` → `battle-of-chosin-reservoir` | `precondition-of` | *"At the same time, the US Eighth Army on the Korean western front was forced into full retreat at the Battle of the Ch'ongch'on River, and MacArthur ordered Almond to withdraw the US X Corps to the port of Hungnam"* — "Battle of Chosin Reservoir", revision 1370109047, § Battle / Actions at Yudam-ni |
| `battle-of-the-ch-ongch-on-river` → `third-battle-of-seoul` | `caused` | *"Immediately after the PVA 13th Army's victory over the Eighth Army at the Ch'ongch'on River, Chinese Communist Party chairman Mao Zedong started to contemplate another offensive against the UN forces on the urging of North Korean Premier Kim Il Sung"* — "Third Battle of Seoul", revision 1370750418, § Background |

All nine are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **Two of the nine run into or out of a record that was already
here** — both of them `battle-of-inchon`, which until this batch had no edge at
all and was one of the 159 events the validator warned `degree-zero` about. The
other seven chain the batch to itself, in one line from the fall of Seoul in
June 1950 to its third fall in January 1951.

**The one `reacted-to` runs forward in time**, as batches 49 and 50 wrote down:
`first-battle-of-seoul --reacted-to--> battle-of-inchon` says *the landing
answered the loss of the capital*, which is what the two consecutive sentences
of the Inchon article's § Planning say. Rule 4 refused nothing this batch.

**`battle-of-the-ch-ongch-on-river` is the branching point**, and both branches
rest on a sentence of the article at the other end: the western defeat pulled
the X Corps out of the Chosin Reservoir, and it is what Mao was answering when
he ordered the offensive that took Seoul for the third time.

**Two edges were looked for and not written.**

- **`battle-of-chosin-reservoir → korean-armistice-agreement`.** The Chosin
  article does carry a sentence that would join this chain to the largest
  connected component in one stroke — for China the battle *"drove a vastly
  technologically superior foe from the battlefield, and eventually forced it
  to sign an armistice agreement some three years later"*. But the article is
  reporting how one side remembers the battle, in a quotation inside a
  quotation, and not asserting it: the clause it belongs to is *"for China, it
  won because"*. An edge written on that sentence would be reading a party's
  memory as the article's argument, and the fact that it would have moved the
  component is the reason to be careful rather than the reason to write it.
- **`chinese-civil-war → battle-of-unsan`**, which would have done the same
  thing. The Ch'ongch'on article names the civil war only for the PVA's
  equipment — *"Because the Chinese had captured large numbers of Nationalist
  weapons during the Chinese Civil War, most of the PVA men used US-made small
  arms"* — and the Chosin article only for its tactics. Neither says the civil
  war is why the intervention happened, and the Chinese Civil War article's own
  two mentions of Korea at revision 1372330605 run the other way, about what
  the Korean War did to Taiwan. The claim is not in the sources read here.

## Batch 52 — the Mali War carried from 2013 to 2024

*24 September, the import fire that picked the run up at 17:59Z. Today already
carries a `## Curation 2026-09-24` section and all six of A14's passes have
theirs, so this is an import fire; A10's order of need had turned over again and
puts **Africa** at the front, trailing at 155 against Asia's 158 and Europe's
378. The full note, the four refusals and the counts are in `docs/m42-pool.md`
under "Batch 52".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `2021-malian-coup-d-etat` → `french-military-withdrawal-from-west-africa` | `caused` | *"As a result of the 2021 Malian coup d'état, French President Emmanuel Macron announced the end of the operation and his intentions to remove troops incrementally."* The operation is Operation Barkhane, which the same paragraph has just called *"less successful than its predecessor"* — "French military withdrawal from West Africa (2022–2025)", revision 1371499896, § Mali |
| `2021-malian-coup-d-etat` → `kidal-offensive` | `precondition-of` | *"The offensive was part of a renewed conflict between the Malian junta that took power in 2021 and former Tuareg rebel groups that had signed the Algiers Agreement in 2015"*, and § Background on the same ground: the CSP-PSD formed in April 2021, *"just a month later"* Goïta's coup took power, and *"Goita and the CSP-PSD got off to a rocky start"* — "Kidal offensive", revision 1370625765, lead and § Background |
| `2020-malian-coup-d-etat` → `moura-massacre` | `precondition-of` | France *"announced after the 2020 Malian coup d'état their intention to gradually reduce the number of French forces and withdraw them from the country. Mali has since looked for other ways to acquire foreign help, and has received help from Wagner Group, a Russian private military company"*, and the lead names Wagner, with the Malian army, as who carried the massacre out — "Moura massacre", revision 1370628775, § Background and lead |
| `battle-of-timbuktu` → `second-battle-of-timbuktu` | `precondition-of` | *"French forces expected a second attack on the city following the jihadist's failed first incursion. The French 1st Marine Infantry Regiment received reinforcements from the 92nd Infantry Regiment and the 126th Infantry Regiment."* The whole § Background is the first battle, under `{{Main articles|Battle of Timbuktu}}` — "Second Battle of Timbuktu", revision 1370736664, § Background |
| `third-battle-of-gao` → `fourth-battle-of-gao` | `precondition-of` | *"Ten days after the Third Battle of Gao, the Jihadists launched another offensive to retake the city on 20 February 2013."* Read with both leads — the third *"a raid on the city"* whose *"raiders were defeated"*, the fourth *"an attempt by rebel MOJWA forces to retake the city"* — the sentence states a second attempt by the same force at the same objective and not only a date — "Fourth Battle of Gao", revision 1370619931, § February 20–22 attack |

All five are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **Three of the five run out of a record that was already here**, and
both of those records — the coups of 2020 and 2021 — are inside the largest
connected component, so the component goes from 624 to 627. That is deviation
1430's lesson applied: the three that joined it are joined to *siblings* inside
it and not to their own parent.

**Two of the five are pairs and stay pairs.** The two battles of Timbuktu and
the third and fourth battles of Gao are each a component of two, because the
only record inside the largest component that either family could reach is
`mali-war`, which is their parent, and C8 bars the edge. Neither the first
Timbuktu article nor the third Gao article names any other record this atlas
holds; the fourth Gao article names only the third, and the second Timbuktu
article only the first. The pairs are honest and the sentences are the
articles' own; what is missing is a sibling, not an argument.

**Four candidates were read and refused, three of them for arriving edgeless.**

- **`Q128007033`, the Battle of Tinzaouaten (July 2024)**, is the largest thing
  in the vein that is not here — 9 sitelinks, the Wagner Group's worst defeat in
  Mali — and its article at revision 1373950868 names no event this atlas holds
  in a sentence that argues anything. Its § Prelude begins with a convoy on 20
  July and reaches nothing earlier; its § Aftermath is the diplomatic break with
  Ukraine and the Sahel states' reprisals, none of them records here. The Kidal
  offensive's article, read for the other half, names Tinzaouaten once — a drone
  strike of December 2023 — and not this battle. It is dated, placed and worth
  having, and the right way to get it is with a sibling it can reach.
- **`Q123058541`, the Siege of Timbuktu (2023)**, states one relation in its
  lead and only one: *"The siege began after the withdrawal of MINUSMA, the
  United Nations mission to Mali during the Mali War."* MINUSMA is not a record
  of this atlas, so the sentence has no `from`.
- **`Q8578070`, the Fifth Battle of Gao (March 2013)**, names neither the fourth
  battle nor anything else the atlas holds: its article at revision 1370618201
  is five sentences and opens on the day itself.
- **`Q6337939`, Operation Panther**, is the one refused for the opposite
  reason. Its article names `battle-of-ifoghas`, which this atlas holds, but the
  sentence is a § See also line — *"Battle of Ifoghas, fighting in the Adrar des
  Ifoghas rock massif during Operation Panther"* — and what it states is
  containment, not cause. Containment is `parent`, and C8 bars the edge a parent
  would then be barred from; and as a parent the spans do not fit either, since
  the battle begins a day before the operation and ends six days after it, which
  rule 24 would warn about. A record whose only link to the atlas is a link the
  atlas may not draw is not this batch's to import.

## Batch 53 — the Korean War read forward from the invasion

*24 September, the import fire that picked the run up at 20:25Z. Today carries
a `## Curation 2026-09-24` section and all six of A14's passes carry theirs, so
this is an import fire. A10's order of need had turned over again and puts
**Asia** at the front, trailing at 158 against Africa's 162 and Europe's 426.
The full note, the refusals and the counts are in `docs/m42-pool.md` under
"Batch 53".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `operation-pokpung` → `first-battle-of-seoul` | `caused` | North Korean forces *"launched the blitzkrieg by crossing the 38th parallel north and swarming South Korea at 04:00"* and *"rushed to encircle and eventually capture Seoul, the capital of South Korea, from the ROK within a week"*; the next paragraph closes it — *"the DPRK captured Seoul within three days on 28 June"* — "Operation Pokpung", revision 1373958261, lead |
| `operation-pokpung` → `battle-of-the-pusan-perimeter` | `precondition-of` | heavy losses *"were inflicted on the DPRK's II Corps by the ROK's 6th Infantry Division, stalling the DPRK's advance in the east, ceasing the blitzkrieg at the Battle of the Pusan Perimeter"* — "Operation Pokpung", revision 1373958261, lead |
| `operation-pokpung` → `battle-of-korea-strait` | `caused` | *"The Korean War began on 25 June 1950 with a massive North Korean invasion across the 38th parallel and into the south. Around twenty hours after the beginning of the invasion, a North Korean steamer was assigned to insert highly-trained commandos … near the port of Busan"* — "Battle of Korea Strait", revision 1376104466, § Background |
| `battle-of-osan` → `chaplain-medic-massacre` | `precondition-of` | *"Advance elements of the 24th Infantry Division were badly defeated in the Battle of Osan on July 5"*, after which the division *"was systematically pushed south"* and on 12 July its commander *"ordered the division's 19th, 21st and 34th infantry regiments to cross the Geum River"*; the lead names the victims as *"troops of the US 19th Infantry Regiment, 24th Infantry Division"* — "Chaplain–Medic massacre", revision 1363525691, lead and § Delaying action |
| `battle-of-kapyong` → `battle-of-the-imjin-river` | `enabled` | Commander *"Wen Yuchen of the 40th Army was given the mission of destroying the ROK 6th Division while blocking any UN reinforcements towards the Imjin River at Kapyong"*, the offensive opening on 22 April on two fronts, *"the main thrust across the Imjin River in the western sector"* and *"the secondary effort"* further east — "Battle of Kapyong", revision 1376150205, § Chinese spring offensive |

All five are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **Three of the five run into records that were already here** —
`first-battle-of-seoul`, `battle-of-the-pusan-perimeter` and `battle-of-osan`,
all three inside the corpus's **second** component and not its largest, because
the only record in the 651 that any of them can reach is `korean-war`, their own
parent, which C8 bars. So the largest component does not move and the second
goes from 10 to 13.

**Four edges were read and refused**, each because the sentence is chronology
and not a claim, which is the refusal class the curation fires already use:
`battle-of-korea-strait` → `battle-of-inchon` (*"It would remain so until the
US-led United Nations landings at Inchon"*); `battle-of-inchon` →
`battle-of-nam-river` (*"The UN counterattack at Inchon outflanked the KPA and
cut off all their main supply and reinforcement routes"* — a statement about how
the Nam River fight ended, which as an edge would read as Inchon causing the
battle); `battle-of-nam-river` → `battle-of-inchon` (*"they were able to hold
the line … until the Inchon attack and Pusan breakout"*); and
`chinese-spring-offensive` → `korean-armistice-agreement` (*"the armistice
negotiations that began on 10 July 1951 at Kaesong forced both sides to dig
in"* — about the front, not about the 1953 agreement).

## Batch 54 — the Mali War read at both ends, 2012 and 2024

*24 September, the import fire that picked the run up at 22:37Z. Today carries
a `## Curation 2026-09-24` section and all six of A14's passes carry theirs, so
this is an import fire. A10's order of need had turned over again and puts
**Africa** at the front, trailing at 162 against Asia's 165 and Europe's 426.
The full note, the refusals and the counts are in `docs/m42-pool.md` under
"Batch 54".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `siege-of-tessalit` → `tinsalane-ambush` | `precondition-of` | the rebels *"fought against a convoy of the Malian army who came to reinforce the troops besieged in Tessalit"*, and *"a convoy of Malian soldiers and militia departed the cities of Kidal and Anfif and moved towards Tessalit to strengthen the military forces of the besieged city. However, this convoy was ambushed by an MNLA brigade in Tinsalane"* — "Tinsalane ambush", revision 1370751066, lead and § The ambush |
| `raid-on-dioura-2023` → `kidal-offensive` | `reacted-to` | *"The CSP-PSD began a series of raids against Malian and Wagner military bases throughout September; Bourem, Léré, Dioura, Bamba, and Taoussa were all pillaged between September 12 and October 3"*, and then *"In response to the attacks, the Malian junta launched airstrikes on Kidal on October 2"* — "Kidal offensive", revision 1370625765, § Prelude |
| `kidal-offensive` → `abeibara-massacres` | `precondition-of` | *"Malian and Wagner forces launched an offensive on the Tuareg rebel capital of Kidal, capturing it in November 2023. Remaining CSP-PSD fighters fled to the rural towns of Abeïbara, Tinzaouaten, and the Adrar des Ifoghas mountains"*, and the June 2024 convoys *"left the towns of Kidal and Tessalit, and settled in Imaswaqassen, a village four kilometers from Abeibara"* — "Abeïbara massacres", revision 1326919232, § Background |
| `kidal-offensive` → `battle-of-tinzaouaten-2024` | `precondition-of` | the same sentence names Tinzaouaten — *"Remaining CSP-PSD fighters fled to the rural towns of Abeïbara, Tinzaouaten, and the Adrar des Ifoghas mountains"* — and the battle's own prelude is the column arriving: on 20 July 2024 a FAMa and Wagner convoy *"engaged in a series of search operations in northern Mali, mainly looking for Tuareg rebels who held territory in the strongholds of Inafarak and Tinzaouten"* — "Abeïbara massacres", revision 1326919232, § Background, with "Battle of Tinzaouaten (2024)", revision 1373950868, § Prelude beside it |

All four are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **All four run into a record that was already here**, which is what
A5 asks of a batch, and three of the four run into `kidal-offensive`, which has
been inside the largest component since batch 52 — so the component goes from
651 to 654. The fourth runs into `siege-of-tessalit`, which was a singleton:
batches 50 and 52 both read its own article end to end for an edge and found
none, and the edge that reaches it was in a different article all along.

**The `reacted-to` was written forward**, as batch 49's deviation 1424 asks:
`A --reacted-to--> B` says *B answered A*, so the raid is the `from` and the
offensive it provoked is the `to`.

**Five edges were read and refused**, each because the sentence is chronology
and not a claim, which is the refusal class the curation fires already use:
`kidal-offensive` → `battle-of-tinzaouaten-2024` drawn from the battle's own
article (its prelude names no held record at all, and its "See also" naming the
Labbezanga attack is a list and not a claim — the edge as written rests on the
Abeïbara article instead); `siege-of-timbuktu` → anything (*"The siege began
after the withdrawal of MINUSMA"*, and no record here is that withdrawal);
`operation-barkhane` → `labbezanga-attack` (*"the junta kicked the French of
Operation Barkhane out a year prior"*, which dates the background and claims
nothing about the raid); `abeibara-massacres` →
`battle-of-tinzaouaten-2024` (the two articles do not name each other, and a
month between them is not an argument); and `2012-tuareg-rebellion` →
`tinsalane-ambush` (containment, which is the filing this record already has and
which C8 bars as an edge).

## Batch 55 — the Korean War's 1951 ridges, and the singleton the prelude reached

*25 September, the import fire that picked the run up at 04:48Z. Today already
carries a `## Curation 2026-09-25` section and all six of A14's passes carry
theirs, so this is an import fire and every one of the six is skipped by its own
rule. A10's order of need puts **Asia** at the front, trailing at 165 against
Africa's 166 and Europe's 426, so this batch is four Asia rows and no other
lane. The full note, the refusals and the counts are in `docs/m42-pool.md` under
"Batch 55".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `battle-of-bloody-ridge` → `battle-of-the-punchbowl` | `caused` | *"The deterioration of the situation on Bloody Ridge led General Byers on 28 August to alter his approach and he decided upon a limited advance along the whole Corps' front, starting on 31 August … Thus, Byers rearranged divisional objectives along the Corps' front. The seizure of the northwest rim of the Punchbowl was assigned to the ROK 5th Division and the northeast rim was given to the U.S. 1st Marine Division"* — "Battle of Bloody Ridge", revision 1370434649, § Battle |
| `battle-of-bloody-ridge` → `battle-of-heartbreak-ridge` | `precondition-of` | *"After withdrawing from Bloody Ridge, the Korean People's Army (KPA) set up new positions just 1,500 yards (1,400 m) away on a 7-mile (11 km) long hill mass. If anything, these defenses were even more formidable than on Bloody Ridge"* — "Battle of Heartbreak Ridge", revision 1376272103, lead, with the same sentence closing "Battle of Bloody Ridge", revision 1370434649, § Aftermath |
| `battle-of-heartbreak-ridge` → `operation-commando` | `enabled` | *"With the successful conclusion of the Touchdown operation, X Corps had removed the sag in the Punchbowl area … Advances of over 5 miles along this front shortened the X Corps' lines and brought them into phase with those of U.S. IX Corps to the west. The Eighth Army then planned a more ambitious follow-up, Operation Commando"* — "Battle of Heartbreak Ridge", revision 1376272103, § Aftermath |
| `chinese-spring-offensive` → `battle-of-the-punchbowl` | `precondition-of` | *"The Chinese People's Volunteer Army (PVA) Spring Offensive was stopped by 20 May 1951 and UN forces counterattacked forcing the PVA back to Line Kansas along the southern edge of the Punchbowl by 20 June"* — "Battle of the Punchbowl", revision 1370601885, § Prelude |

All four are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus. **The fourth runs into a record that was already here**, which is
what A5 asks of a batch: `chinese-spring-offensive` has been edgeless since it
was written, and the sentence that reaches it is in an article none of the
earlier Korean batches had read. The other three are the chain the batch was
taken for, and it is a chain and not a star: Bloody Ridge is the cause of one
battle and the precondition of another, and the second of those enables the
operation that ends the war of manoeuvre.

**`operation-commando` names neither an actor nor a place, and is filed under
`korean-war` even so.** Its item, `Q3354681`, carries no `P710` for A12 (4) to
map, no `P625` of its own, and no `P17`; its `P276` is the Jamestown Line,
`Q6146251`, which carries no coordinate either — so A9's chain reaches nothing
with a point and the record takes the Asia lane alone, as the one of the four
with no place. The filing is the item's own `P361` on `Q8663`, the Korean War,
and the article's first sentence says the same thing in words: *"Operation
Commando was an offensive undertaken by United Nations Command (UN) forces
during the Korean War between 3–12 October 1951."* The atlas holds
`united-nations` and `united-states-of-america` as actors and neither is on the
record, because neither is on the item: A12 (4) maps participants an item names
and this run writes no historical claim of its own, so who fought stays where
the article has it until an item or a person says otherwise.

**Three edges were read and refused**, each because the sentence is chronology
or containment rather than a claim, which is the refusal class the curation
fires use: `battle-of-the-punchbowl` → `battle-of-heartbreak-ridge` (the
Punchbowl's own lead has *"this was followed by the Battle of Heartbreak Ridge
northwest of the Punchbowl from September–October 1951"*, which is a date and
not an argument — the claim about Heartbreak Ridge's ground is in the other two
articles and is where the edge is written instead); `korean-war` →
`battle-of-bloody-ridge` and the same for each of the four (containment, which
is the filing these records already have and which C8 bars as an edge); and
`operation-commando` → anything in the largest component (its aftermath names
`Operation Polecharge` and its background `Operation Minden`, and this atlas
holds neither).

## Batch 56 — the Ménaka week of November 2012, and the component the loss of Gao rejoined

*25 September, the import fire that picked the run up at 07:07Z. Today already
carries a `## Curation 2026-09-25` section and all six of A14's passes carry
theirs, so this is an import fire and every one of the six is skipped by its own
rule. A10's order of need puts **Africa** at the front, trailing at 166 against
Asia's 169 and Europe's 426, so this batch is four Africa rows and no other
lane. The full note, the refusals and the counts are in `docs/m42-pool.md` under
"Batch 56".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `battle-of-gao` → `tagarangabotte-ambush` | `precondition-of` | *"On November 16, MNLA forces launched an offensive to retake the city of Gao, but they came up against the Islamists forces of MUJAO and AQIM between Ansongo and Gao. On the morning of the first day, Tuareg independence forces were successful in the Ambush of Tagarangabotte 50 kilometers east of Ansongo"* — "Battle of In-Delimane (2012)", revision 1370443727, § The battle |
| `battle-of-gao` → `battle-of-in-delimane-2012` | `precondition-of` | *"On November 16, MNLA forces launched an offensive to retake the city of Gao … the same day MUJAO attack elements of the MNLA in the village of Idelimane 80 kilometers from Ménaka, the last bastion of the MNLA"* — "Battle of In-Delimane (2012)", revision 1370443727, § The battle |
| `battle-of-gao` → `second-battle-of-menaka` | `precondition-of` | *"On 16 November 2012, during the MNLA (Movement for the National Liberation of Azawad) failed offensive to reclaim its former city-base of Gao recently taken by Islamists groups, Islamists launch a counter-attack of their own targeted at the MNLA stronghold of Ménaka, north of Gao, the last bastion under MNLA control"* — "Second Battle of Ménaka", revision 1370736445, § Background |
| `battle-of-in-delimane-2012` → `second-battle-of-menaka` | `enabled` | *"On 19 November, following its victory against the MNLA at the Battle of Idelimane, MUJAO continues its push and attacks the city of Menaka"* — "Second Battle of Ménaka", revision 1370736445, § Battle, with *"Next, the Battle of Ménaka followed"* closing "Battle of In-Delimane (2012)", revision 1370443727, § Aftermath |

All four are `probable`: Wikipedia alone, which rule 22 will not let stand as
consensus.

**Three of the four run into a record that was already here, and the largest
connected component moves** — 662 to 665. The three Korean batches, 51, 53 and
55, each connected every record they wrote and moved it by nothing, because
every edge those veins offered ran from a parent to its own child; the two Mali
batches between them, 52 and 54, each moved it. Here the reach is sideways
again. The record the three new ones reach is `battle-of-gao`, the June 2012
battle in which the MNLA lost the city, and it is a sibling under `mali-war` and
not an ancestor, so C8 has nothing to say about it.

**`precondition-of` and not `caused`, on all three.** The articles say what the
November fighting was *for* — an offensive to retake a city lost five months
earlier — and do not say that the June battle brought the November one about.
That is the distinction the type vocabulary exists for, and a run that collapses
it would be making the argument itself.

**The fourth edge is the one inside the week**, and the one that took the most
reading. The Ménaka article puts the victory at Idelimane as what the push onto
the town went on from; the Idelimane article closes on the same sequence from
its own side. It is written `enabled` and not `caused` because neither article
says the battle at Idelimane brought the attack on Ménaka about — MUJAO was
already moving on Ménaka when the two forces met, which is the Tagarangabotte
article's own first sentence.

**`fifth-battle-of-gao` arrives with no edge at all, and the batch says so
rather than reaching for one.** Its article at revision 1370618201 is four
sentences of narrative about a single night's raid; it names no other event this
atlas holds, and the four earlier Gao battles are a numbered series and not a
claim. A series number is not an argument, so no edge is written from the fourth
battle to the fifth. It is the one record of the batch outside the largest
component and the one new `degree-zero` warning.

**Four edges were read and refused.** `tagarangabotte-ambush` →
`battle-of-in-delimane-2012`, which both articles set side by side in the same
day — *"The success of the MNLA, however, seems to have been only temporary and
insufficient to stop the Islamist offensive … the same day the MUJAO attacked
elements of the MNLA in the village of Idelimane"* — is a statement that the
ambush **failed** to prevent what followed, which is chronology and the absence
of an effect, not an effect; the refusal class A14 (4) drew is exactly this one.
`mali-war` → each of the four is containment, which is the filing these records
already have and which C8 bars as an edge. `fourth-battle-of-gao` →
`fifth-battle-of-gao` is the series number above. And `second-battle-of-menaka`
→ `2012-tuareg-rebellion` was read and left: the Ménaka article's infobox gives
*"Dissolution of the State of Azawad"* as the result, but Azawad is a polity and
the rebellion is the event, and an edge between them would be this run deciding
that the one ended the other.

## Batch 57 — the Easter Offensive and the road to Paris, and the riddle a fire may not settle

*25 September, the import fire that picked the run up at 09:23Z. Today already
carries a `## Curation 2026-09-25` section and all six of A14's passes carry
theirs, so this is an import fire and every one of the six is skipped by its own
rule. A10's order of need had turned over at batch 56: **Asia** trails at 169
against Africa's 170, so this batch is five Asia rows and no other lane, taken
from the Vietnam War vein. The full note, the refusals and the counts are in
`docs/m42-pool.md` under "Batch 57".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `easter-offensive` → `paris-peace-accords` | `enabled` | *"The final major breakthrough came on October 8, 1972. Prior to this, North Vietnam had been disappointed by the results of its Nguyen Hue Offensive (known in the West as the Easter Offensive), which had resulted in the United States countering with 'Operation Linebacker', a significant air bombing campaign that blunted the North's drive in the South as well as inflicting damage in the North"* — "Paris Peace Accords", revision 1376485436, § Breakthrough and agreement |
| `easter-offensive` → `operation-pocket-money` | `reacted-to` | *"Its purpose was to halt or slow the transportation of supplies and materials for the Nguyen Hue Offensive (known in the West as the Easter Offensive), an invasion of the Republic of Vietnam (South Vietnam), by forces of the People's Army of Vietnam (PAVN), that had been launched on 30 March"* — "Operation Pocket Money", revision 1370698649, lead |
| `operation-linebacker-ii` → `paris-peace-accords` | `enabled`, **disputed** | *"US officials claimed that the operation had succeeded in forcing North Vietnam's Politburo to return to negotiating, citing the Paris Peace Accords signed shortly after the operation"* — "Operation Linebacker II", revision 1374115791, § Outcome and assessments, Diplomatic |
| `first-battle-of-quang-tri` → `second-battle-of-quang-tri` | `precondition-of` | *"While the North Vietnamese tried to consolidate their rule over the liberated zones, South Vietnamese General Ngô Quang Trưởng was drawing up a plan to retake the province. The stage was set for the Second Battle of Quảng Trị"* — "First Battle of Quảng Trị", revision 1375790239, § Aftermath |
| `battle-of-khe-sanh` → `tet-offensive` | `enabled`, **disputed** | *"Historians have observed that the Battle of Khe Sanh may have distracted American and South Vietnamese attention from the buildup of Viet Cong (VC) forces in the south before the early 1968 Tet Offensive"* — "Siege of Khe Sanh", revision 1376490321, § Analysis |

**The fifth edge is between two records the atlas already held**, written under
A5's clause that a batch writes its edges to what already exists as well as to
itself. `battle-of-khe-sanh` had been a singleton since it was imported: every
link its article offers runs to `tet-offensive`, and until this fire nobody had
written the one it argues. It is the only edge of the batch that touches no new
record, and it is the reason the largest connected component moves by four and
not by three.

**Two of the five are `disputed`, and both are disputed for the same reason:
the article states the claim and then names who denies it.** `operation-linebacker-ii`
→ `paris-peace-accords` carries Pierre Asselin's reading — *"Hanoi agreed to
resume talks only because the bombing had crippled their country"* — against
A. J. Langguth's, that the Christmas bombings were *"pointless"* because the
agreement of 23 January 1973 was essentially the one reached on 8 October 1972.
`battle-of-khe-sanh` → `tet-offensive` carries what John Prados and Ray Stubbe
call the **riddle of Khe Sanh**: *"Either the Tet Offensive was a diversion
intended to facilitate PAVN/VC preparations for a war-winning battle at Khe
Sanh, or Khe Sanh was a diversion to mesmerize Westmoreland in the days before
Tet."* Read the second way the arrow points the other direction. That is exactly
the case `CLAUDE.md` reserves `disputed` for, and neither dispute is a fire's to
settle: the atlas says both readings and names who holds each.

**Four edges were read and refused.**

- **`operation-pocket-money` → `operation-linebacker-ii`.** Both are American
  air campaigns against North Vietnam in 1972 and the second is often read as
  the sequel to the first, but the article the atlas cites makes Linebacker II
  follow from the stalling of the talks in December — *"The intransigence of
  Thiệu and his demand for the U.S. not to abandon his nation after any
  agreement, as well as new demands by Hanoi, caused the stalling of peace talks
  in December. That led Nixon to launch Operation Linebacker II"* — and names
  neither the mining nor the offensive as its cause. Sharing an enemy and a year
  is not an argument.
- **`easter-offensive` → each of the two Quảng Trị battles**, which is
  containment and is the filing those two records already carry; C8 bars it as
  an edge.
- **`battle-of-pork-chop-hill` → `korean-armistice-agreement`**, from the Korean
  vein this fire read first: *"Less than three weeks after the Battle of Pork
  Chop Hill, the Korean Armistice Agreement was signed by the UN, PVA and North
  Korean Korean People's Army, ending the hostilities."* That is a date and not
  a claim, and it is the refusal class A14 (4) drew — a sentence that opens on
  how long afterwards a thing happened says nothing about why.

## Batch 58 — the Congo Crisis from the dismissal to the coup, and the word the article uses

*25 September, the same fire, continuing under STEP 3's "each imported,
connected, filed, placed, validated, rebuilt and pushed before the next". Batch
57 put Asia at 174 against Africa's 170, so A10's order of need turned back and
this batch is four **Africa** rows, taken from the Congo Crisis vein by
deviation 1449's rule: `Q1773926` holds `simba-rebellion` inside the largest
connected component, and all four arrivals stand beside it rather than under it.
The full note, the refusals and the counts are in `docs/m42-pool.md` under
"Batch 58".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `dissolution-of-the-lumumba-government` → `assassination-of-patrice-lumumba` | `enabled` | *"Following the September 1960 coup led by Mobutu Sese Seko, Lumumba and his political retinue were detained by Mobutu's forces in December 1960. After a month of imprisonment near Léopoldville, he was transferred to Belgium-aligned Katanga in mid-January"* — "Assassination of Patrice Lumumba", revision 1376437618, lead |
| `assassination-of-patrice-lumumba` → `kwilu-rebellion` | `precondition-of` | *"When Lumumba was assassinated in early 1961, Mulele became a prominent and vocal advocate for his government and beliefs. In 1962, Mulele joined a group of fellow rebels and ex-politicians named the National Committee of Liberation"* — "Kwilu rebellion", revision 1370626353, § Background |
| `assassination-of-patrice-lumumba` → `simba-rebellion` | `precondition-of` | *"The rebellion, located in the east of the country, was led by the followers of Patrice Lumumba, who had been ousted from power in 1960 by Joseph Kasa-Vubu and Joseph-Désiré Mobutu and subsequently killed in January 1961 in Katanga"* — "Simba rebellion", revision 1375684063, lead |
| `kwilu-rebellion` → `simba-rebellion` | `caused` | *"As violence increased and attacks became more frequent, it sparked similar uprisings throughout the country, triggering the Simba rebellion"* — "Kwilu rebellion", revision 1370626353, § Rebel activity 1963–1965 |
| `simba-rebellion` → `second-mobutu-coup-detat` | `precondition-of` | *"By 1965, with the Kwilu and Simba rebellions largely quelled, the alliance between Kasa-Vubu and Tshombe had outlived its usefulness ... Kasa-Vubu moved to remove Tshombe from power, which led to a political split between the two"* — "Second Mobutu coup d'état", revision 1371883429, § Background |

**`caused` is written once and it is written because the source writes it.** This
run has put `caused` on very few of its imported edges and the reason has always
been that an article that says a thing followed another has not said it was
caused by it. The Kwilu article says *triggering*, of a named event, in its own
narrative voice, and nothing weaker would have been honest to that sentence.

**Two of the five edges have a held record at one end and two more reach one.**
`assassination-of-patrice-lumumba` → `simba-rebellion` and `kwilu-rebellion` →
`simba-rebellion` both end on a record the atlas already had; `simba-rebellion` →
`second-mobutu-coup-detat` begins on one. That is the shape deviation 1449 is
about, and it is why four arrivals joined the largest component and none of them
had to reach it through an umbrella.

**Three edges were read and refused.**

- **`congo-crisis` → each of the four.** Containment, which is the filing all
  four already carry, and C8 bars it as an edge. The Second Mobutu coup's lead
  states the relation the other way round — *"It marked the end of the years-long
  Congo Crisis"* — and an edge from a child to the umbrella it ends would be the
  same rule read backwards.
- **`kwilu-rebellion` ↔ `simba-rebellion` as concurrency.** Both articles also
  say the two risings were *contemporaneous* and *concurrent*, and on that
  sentence alone there would be no edge in either direction: two things happening
  at once is not one causing the other. The edge above rests on the other
  sentence, which names one and says what it did.
- **`assassination-of-patrice-lumumba` → `second-mobutu-coup-detat`.** The coup
  article says Tshombe *"was suspected by many to be complicit in Lumumba's
  assassination, thus tarnishing his public image"*, which is a reason Kasa-Vubu
  moved against Tshombe five years later. It is a reported suspicion about a
  person's standing and not a statement that the killing conditioned the coup,
  and the chain the article does argue — through the rebellions — is already an
  edge here.

## Batch 59 — the Gao counterattacks of February and March 2013, and the third article that names two records for them

*25 September, the fire that claimed at 12:08Z. Africa and Asia were tied at 174
active events each, so A10's order of need gives the batch to **Africa** and
deviation 1449 decides the vein: ranked by how many of the records a vein already
holds sit inside the largest connected component, the Mali War (`Q2946372`) is
the strongest vein in the atlas at **22**, ahead of the Cold War's 21 and the
Vietnam War's 10. Two rows arrive and four edges are written, two of them
between records the atlas already held. The full note, the refusals and the
counts are in `docs/m42-pool.md` under "Batch 59".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `second-battle-of-gao` → `third-battle-of-gao` | `reacted-to` | *"Gao was captured by French and Malian troops on 27 January 2013 ... the Movement for Oneness and Jihad in West Africa and Mulathamen remained in the Gao region. They tried to take back the city, in two attempted operations before, first on 10 February, and then again on 20 February, but their attacks failed"* — "Battle of Imenas", revision 1370265996, § Background and deployment |
| `second-battle-of-gao` → `fourth-battle-of-gao` | `reacted-to` | the same sentence, whose "20 February" is linked to the fourth battle as its "10 February" is linked to the third |
| `fourth-battle-of-gao` → `battle-of-imenas` | `precondition-of` | *"However, French and Malian forces, wished to secure the region, and fully expel the MUJAO-Mulathamen coalition from the Gao and its regions, so they began interrogating captured jihadists to learn information about the positions and the number of the jihadists. Finally the staff of Operation Serval estimated that about 100 fighters divided into several small groups were located east of Gao ... French code-named Operation Doro was launched on 27 February"* — "Battle of Imenas", revision 1370265996, § Background and deployment |
| `battle-of-imenas` → `battle-of-tin-keraten` | `precondition-of` | *"After the victory of the Battle of Iminenas, the French and Malian forces continued their war against the Islamist Jihadist coalition of MOJWA, AQIM, Ansar Dine and Al-Mulathamen ... The next target of the Franco-Malian forces was the wadi of Tin Keraten, located north-east of Imenas, 100 kilometers east of Gao"* — "Battle of Tin Keraten", revision 1370591104, § Background |

**Two of the four edges have no arrival at either end, and they are why the
component moved by four and not by two.** `second-battle-of-gao` →
`third-battle-of-gao` and → `fourth-battle-of-gao` join a two-node component the
atlas has carried since batch 56 to the 673, and both rest on a sentence in a
**third** article — the one this batch imported. Neither Gao article names the
other: the third's lead calls itself "a raid on the city" and the fourth's "an
attempt by rebel MOJWA forces to retake the city", and neither says from whom.
The Imenas background says it, with the wikilinks to prove which records it means.
**A batch's best edge can be one that runs between two records it did not
import, found only because the article it was reading for something else knew
both of them.** That is batch 57's Khe Sanh lesson with two records rescued
instead of one.

**`reacted-to` is written twice and the second is redundant to the graph.**
`third-battle-of-gao` → `fourth-battle-of-gao` has been here since batch 56, so
the fourth already reaches the 673 once the third does, and
`second-battle-of-gao` → `fourth-battle-of-gao` opens no path. It is written
because the sentence names two attempts and the second of them is about that
record: a reader opening the fourth battle should find the capture it answered on
its own card, and not only one hop away. Nothing in the count depends on it.

**Four edges were read and refused.**

- **`battle-of-in-khalil` → `operation-serval`**, on the In Khalil article's
  *"The MUJAO immediately claimed responsibility for both bombings and said it
  specifically targeted the MNLA for their part in siding with the French
  intervention"* (revision 1370443719). The sentence argues a reaction and names
  what was answered — but it names it as "the French intervention", in plain
  words and with no wikilink, and deciding that those three words are
  `operation-serval` is an identification a person should make and not a run.
  The row was not imported.
- **`battle-of-anoumalane` → `battle-of-tinzaouaten-2024`**, on *"The battle was
  the largest defeat for Malian and allied Russian forces since the battle of
  Tinzaouaten nearly one year earlier"* (revision 1370432110). A comparison of
  two defeats by size, which says less than chronology does: it does not even
  claim the second followed from the first. The row was not imported.
- **`battle-of-tinzaouaten-2024` → `mali-fuel-blockade`**, on *"Following a
  setback at the Battle of Tinzaouaten in 2024 ... the Wagner Group was replaced
  by the Russian Africa Corps ... Following 2024, JNIM opened a new front to
  isolate Bamako"* ("2026 Mali offensives", revision 1376558898, § Background).
  Two sentences opening on "Following" with nothing between them but the year:
  A14 (4)'s refusal class exactly, and the consequence the first one does argue —
  Wagner replaced by the Africa Corps — is not an event this atlas holds.
- **`mali-war` → any of the four Gao and Imenas records.** Containment, which is
  the filing they already carry, and C8 bars it as an edge.

## Batch 60 — the Manchurian road and the sea around it, and the vein where every held record is inside the component

*25 September, the same fire, continuing under STEP 3's "each imported,
connected, filed, placed, validated, rebuilt and pushed before the next". Batch
59 put Africa at 176 against Asia's 174, so A10's order of need turned over and
this batch is five **Asia** rows. Deviation 1450's ranking picked the vein:
`Q159950`, the Russo-Japanese War, holds **fifteen** records here and **all
fifteen are inside the largest connected component** — the only vein in the atlas
with no held record outside it. Five free rows are all that is left of it, all
five are dated, and every one names a held record in prose. The full note, the
refusals and the counts are in `docs/m42-pool.md` under "Batch 60".*

| edge | type | the sentence it rests on |
| --- | --- | --- |
| `battle-of-te-li-ssu` → `battle-of-motien-pass` | `precondition-of` | *"Keller, already weakened by the loss of men at the Battle of Te-li-Ssu, was further forced to give up two more regiments to Kuropatkin's defenses at Haicheng"* — "Battle of Motien Pass", revision 1370269908, § Preliminary movements |
| `battle-of-tashihchiao` → `battle-of-hsimucheng` | `precondition-of` | *"Following its defeat at the Battle of Tashihchiao, the 2nd Siberian Corps under General Zasulich retreated to the village of Hsimungcheng"* — "Battle of Hsimucheng", revision 1370443278, § Prelude |
| `battle-of-hsimucheng` → `battle-of-liaoyang` | `enabled` | *"General Zasulich exercised his standing order from General Alexei Kuropatkin to withdraw to Haicheng, and the Japanese forces were thus able to link up for the next push north towards Liaoyang"* — same article, § Description of battle |
| `battle-of-the-yellow-sea` → `battle-of-korsakov` | `precondition-of` | *"it met defeat in the Battle of the Yellow Sea on 10 August 1904. The Russian squadron broke up during the engagement ... Novik ... was among the ships that fled south"* — "Battle of Korsakov", revision 1370446023, lead and § Preliminary moves |
| `battle-of-port-arthur` → `hitachi-maru-incident` | `precondition-of` | *"At the start of the Russo-Japanese War, the bulk of the Russian Pacific Fleet was blockaded within the confines of Port Arthur by the Imperial Japanese Navy. However, the Russian subsidiary naval base at Vladivostok ... remained largely undamaged and unblockaded"* — "Hitachi Maru Incident", revision 1370622816, § Background |
| `siege-of-port-arthur` → `raid-on-yingkou` | `reacted-to` | *"With the surrender of Port Arthur, the course of the war radically changed as the Japanese no longer had to fight on 2 fronts ... In response, the Russian command, led by Pavel Mishchenko, developed a planned raid to prevent the joining of Japanese troops"* — "Raid on Yingkou", revision 1370706175, § Background |

**Six edges for five arrivals and every one of the five joined the component**,
which is the first batch of this run where that is true. The reason is the vein
and not the reading: when every record a vein already holds is inside the 677,
any edge at all puts the arrival inside it too. Deviation 1450's table says which
veins those are before a fire opens an article.

**One `reacted-to`, and the article supplies the word.** `siege-of-port-arthur` →
`raid-on-yingkou` rests on "In response", which is the strongest connective this
run has been given for that type: the Yingkou background states the Japanese plan
that followed the surrender and then the Russian raid built to stop it. Written in
the direction **deviation 1420** settled — the surrender at `from`, the raid that
answered it at `to`.

**One "Following" sentence was kept and it is the first this run has kept.**
A14 (4) drew a refusal class around eleven edges whose quotes opened on
"Following", "After" or "In the aftermath", and the test it drew was whether the
sentence *makes a claim*. `battle-of-tashihchiao` → `battle-of-hsimucheng` opens
on the word and then names a unit, a defeat and a retreat: *"Following its defeat
at the Battle of Tashihchiao, the 2nd Siberian Corps under General Zasulich
retreated to the village of Hsimungcheng."* It is why the Russians were on that
ground at all, which is what `precondition-of` says. **The refusal class is about
sentences that say only how long afterwards, not about the word they open with.**

**Three edges were read and refused.**

- **`battle-of-the-yalu-river-1904` → `battle-of-motien-pass`.** The same
  paragraph that argues Te-li-Ssu also says *"General Fyodor Keller had assumed
  command of the Russian Eastern Force from General Zasulich after the Battle of
  Yalu River"*, which is a change of commander dated by a battle and not a claim
  about the pass. The Te-li-Ssu sentence in the same paragraph says what the
  earlier fighting cost the force, and that is the edge.
- **`first-sino-japanese-war` → `battle-of-motien-pass`.** The article has Keller
  observing *"that the Japanese strategy was similar to that of the First
  Sino-Japanese War"*, which is a Russian general's analogy reported as his
  reasoning. An earlier war a commander compared this one to is not a condition of
  the battle, and reading it as one would be this run deciding what the analogy
  was worth.
- **`hitachi-maru-incident` → `battle-off-ulsan`.** The Hitachi Maru article names
  the Ulsan battle, where the same Vladivostok squadron was broken up two months
  later, but only in listing what became of the ships. It states no claim that the
  raid brought the hunt about, and the edge would be this run supplying the link
  between a sortie and the squadron's later destruction.

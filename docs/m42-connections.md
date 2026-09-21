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

# M57 — the ledger of claims for "Who was buying"

Every historical claim this milestone writes, and the source it rests on.
`docs/m57-brief.md` is the instruction; this is the account. `tests/m57.test.mjs`
reads this file, so nothing here is prose that once was true: an event or an
edge of this milestone that is not listed below fails the suite, and so does a
row that names no source record.

The owner asked for this on 17 September:

> the whole colonization history led to Brazil being a producer of certain
> goods, and when the US rose they wanted to have control over several of them
> they decided to intervene when Brazil elected a socialist government. I want
> to have a narrative that reflects all of this

## The thesis

**Brazil has been organised around exporting commodities since 1500, and the
identity of the buyer kept changing — Portugal, then Britain, then the United
States, now China. Each change was political.** That is what makes it a
narrative and not a chronology, and it is what the four movements below are
movements of. The narrative record is `who-was-buying`.

## What `probable` means in these tables

It means the cited sources support the link and this run found no dissent in
them. It does not mean the link is half-believed. M50's amendment A2, which
rule 22 will not catch: **Wikipedia is one source however many of its articles
are read**, so a link resting on it alone is `probable` however settled the
history is. Promotion to `consensus` means a work Wikipedia itself cites, with
a page — never a second Wikipedia article repeating the first. **Not one edge
in this milestone is `consensus`, and that is amendment A2 working rather than
failing.** Thirty-two are `probable` and one is `disputed`.

Every event below cites the article and the revision it was read at, so a
reviewer can open the same text this run read. No claim here was written
without a source, and no source here is the assistant.

## The four movements

**I — Portugal buys, 1494 to 1822.** Already in the atlas in full, from M50:
Tordesillas, the landfall, the captaincies, the governorate, the sugar cycle,
the Atlantic trade, the gold cycle, the transfer of the court, independence.
This milestone adds nothing to it; the narrative walks it out of M50's records.

**II — Britain buys, 1810 to 1930.** The atlas held the Strangford treaty, the
Aberdeen Act, the Queirós law, the Lei Áurea and the Republic. What was missing
is what Brazil actually sold in those years, and **without it the thesis has a
hole**: the coffee cycle, the Amazon rubber boom, and the collapse of 1912 when
plantations grown from seed taken out of Brazil in 1876 undercut it.

**III — the United States buys, 1941 to 1985.** The hinge. American finance for
Brazil's first integrated steelworks, against air bases in the Northeast and
wartime latex — strategic commodities exchanged for industrial capital. Then
Petrobras, the profit remittance law, the base reforms, Operation Brother Sam,
the coup the atlas already held, the dictatorship's foreign-capital boom, the
debt it left, and the election that ended it.

**IV — China buys, 1988 to 2023.** The constitution of 1988, the commodity
supercycle that is also called the China boom, Lava Jato, 2016, 2018, 2023.

## The reading of the brief's tests

Two of §6's properties needed a reading before they could be code. Both are
here so they can be argued with.

**"Four hops or fewer" is measured per movement**, the way `tests/m50.test.mjs`
measured it per chain, and over the *whole* active graph rather than a
movement's own edges — a reader who leaves this milestone's records and comes
back has still walked a path the atlas drew, and half of what holds these
movements together is what M50 wrote.

The alternative reading — four hops between any two of the nineteen events,
across all four movements — **was measured and not taken.** It is not
satisfiable honestly. It would need a single event that every one of the
nineteen is two hops from, and no such event exists between 1830 and 2023; the
only way to manufacture one is to write edges the sources do not support, and
§5 forbids that before it asks for anything else. **The figure is therefore
written down instead of asserted: the greatest distance between any two of
this milestone's nineteen events is 5 hops**, between
`lula-returns-to-the-presidency-2023` and `operation-brother-sam-1964`. Of the
171 pairs, **160 are within four hops and 11 are at five**: 22 pairs at one hop,
36 at two, 61 at three, 41 at four. Within each movement the property holds at
four, and it is asserted. That every event of this milestone reaches every
other by *some* path is asserted too, unbounded.

**The actor-overlap rule stays M56's.** That milestone holds it corpus-wide —
*no active event names an actor whose whole life falls outside it* — over every
active event, these nineteen included, and it exists precisely so that a later
milestone does not write a fifth copy of the rule. What this milestone's suite
adds is the half M56 cannot state: an event that names nobody passes M56 by
having nothing to check, so `tests/m57.test.mjs` asserts that every event here
**names at least one actor**. The two together are the brief's §6.5.

## The events

| event | movement | when | place | source records | articles, at the revision read |
|---|---|---|---|---|---|
| `the-brazilian-coffee-cycle` | II | 1830 to 1930 | `sao-paulo` | `wikipedia-en` | Coffee production in Brazil (1371259594) |
| `the-amazon-rubber-boom` | II | 1879 to 1912 | `manaus` | `wikipedia-en` | Amazon rubber cycle (1373636077) |
| `the-end-of-the-amazon-rubber-monopoly` | II | 1912 | `manaus` | `wikipedia-en` | Amazon rubber cycle (1373636077) |
| `companhia-siderurgica-nacional-1941` | III | 1941-04-09 (1941) | `volta-redonda` | `wikipedia-en`, `wikipedia-pt` | Companhia Siderúrgica Nacional (1369475395); Companhia Siderúrgica Nacional (72948718); Brazil in World War II (1373489318); Getúlio Vargas (1373660809) |
| `us-air-bases-in-the-brazilian-northeast-1942` | III | 1942-03-02 (1942 to 1944–1945) | `parnamirim` | `wikipedia-en` | Brazil in World War II (1373489318); Getúlio Vargas (1373660809) |
| `the-rubber-battle-1942` | III | 1942 to 1945 | `manaus` | `wikipedia-en` | Amazon rubber cycle (1373636077); Rubber soldiers (1276596979) |
| `petrobras-1953` | III | 1953-10-03 (1953) | `rio-de-janeiro` | `wikipedia-en`, `wikipedia-pt` | Petrobras (1372204096); Petrobras (72337059) |
| `profit-remittance-law-1962` | III | 1962-09-03 (1962) | `brasilia` | `wikipedia-pt`, `wikipedia-en` | Reformas de base (72119911); João Goulart (1366723860); 1964 Brazilian coup d'état (1374834512) |
| `the-base-reforms-rally-1964` | III | 1964-03-13 (1964) | `rio-de-janeiro` | `wikipedia-pt`, `wikipedia-en` | Reformas de base (72119911); João Goulart (1366723860); 1964 Brazilian coup d'état (1374834512) |
| `operation-brother-sam-1964` | III | 1964-03-31 (1964) | `washington` | `wikipedia-en` | Operation Brother Sam (1372915756); 1964 Brazilian coup d'état (1374834512) |
| `the-brazilian-miracle-1968-1973` | III | 1968 to 1973 | `sao-paulo` | `wikipedia-en` | Brazilian Miracle (1349557960) |
| `the-brazilian-debt-crisis-1982` | III | 1982 to 1989 | `brasilia` | `wikipedia-en` | Latin American debt crisis (1356110819); Brazilian Miracle (1349557960) |
| `1985-brazilian-presidential-election` | III | 1985-01-15 (1985) | `brasilia` | `wikipedia-en` | 1985 Brazilian presidential election (1344763908); Diretas Já (1360480962) |
| `the-1988-brazilian-constitution` | IV | 1988-10-05 (1988) | `brasilia` | `wikipedia-en` | Constitution of Brazil (1375080943) |
| `the-commodity-boom-and-the-chinese-buyer` | IV | 2000 to 2014 | `brasilia` | `wikipedia-en` | 2000s commodities boom (1368808962); Brazil–China relations (1364321291) |
| `operation-car-wash-2014` | IV | 2014 to 2021 | `brasilia` | `wikipedia-en` | Operation Car Wash (1371266803) |
| `the-impeachment-of-dilma-rousseff-2016` | IV | 2015-12-02 (2015 to 2016) | `brasilia` | `wikipedia-en` | Impeachment of Dilma Rousseff (1369411417) |
| `the-2018-brazilian-general-election` | IV | 2018-10-07 (2018) | `brasilia` | `wikipedia-en` | 2018 Brazilian general election (1361748195) |
| `lula-returns-to-the-presidency-2023` | IV | 2023-01-01 (2023) | `brasilia` | `wikipedia-en` | 2022 Brazilian general election (1375252300); Brazil–China relations (1364321291) |

## The edges

Every edge is `probable` except the one that is `disputed`, and the reason is
amendment A2 above and not doubt about the history.

| edge | type | confidence | source records | articles, at the revision read |
|---|---|---|---|---|
| `1964-brazilian-coup-detat--1985-brazilian-presidential-election--precondition-of` | precondition-of | probable | `wikipedia-en` | 1985 Brazilian presidential election (1344763908) |
| `1964-brazilian-coup-detat--operation-brother-sam-1964--reacted-to` | reacted-to | probable | `wikipedia-en` | Operation Brother Sam (1372915756) |
| `1964-brazilian-coup-detat--the-1988-brazilian-constitution--reacted-to` | reacted-to | probable | `wikipedia-en` | Constitution of Brazil (1375080943) |
| `1964-brazilian-coup-detat--the-brazilian-debt-crisis-1982--precondition-of` | precondition-of | probable | `wikipedia-en` | Latin American debt crisis (1356110819); Brazilian Miracle (1349557960) |
| `1964-brazilian-coup-detat--the-brazilian-miracle-1968-1973--enabled` | enabled | probable | `wikipedia-en` | Brazilian Miracle (1349557960) |
| `1985-brazilian-presidential-election--the-1988-brazilian-constitution--caused` | caused | probable | `wikipedia-en` | Constitution of Brazil (1375080943); 1985 Brazilian presidential election (1344763908) |
| `companhia-siderurgica-nacional-1941--petrobras-1953--inspired` | inspired | probable | `wikipedia-en`, `wikipedia-pt` | Companhia Siderúrgica Nacional (1369475395); Petrobras (72337059) |
| `companhia-siderurgica-nacional-1941--the-rubber-battle-1942--precondition-of` | precondition-of | probable | `wikipedia-en` | Companhia Siderúrgica Nacional (1369475395); Amazon rubber cycle (1373636077) |
| `companhia-siderurgica-nacional-1941--us-air-bases-in-the-brazilian-northeast-1942--caused` | caused | probable | `wikipedia-en` | Brazil in World War II (1373489318); Getúlio Vargas (1373660809) |
| `operation-car-wash-2014--lula-returns-to-the-presidency-2023--precondition-of` | precondition-of | probable | `wikipedia-en` | 2022 Brazilian general election (1375252300) |
| `operation-car-wash-2014--the-2018-brazilian-general-election--precondition-of` | precondition-of | probable | `wikipedia-en` | 2018 Brazilian general election (1361748195) |
| `operation-car-wash-2014--the-impeachment-of-dilma-rousseff-2016--precondition-of` | precondition-of | probable | `wikipedia-en` | Impeachment of Dilma Rousseff (1369411417); Operation Car Wash (1371266803) |
| `petrobras-1953--operation-car-wash-2014--precondition-of` | precondition-of | probable | `wikipedia-en` | Operation Car Wash (1371266803) |
| `petrobras-1953--the-base-reforms-rally-1964--precondition-of` | precondition-of | probable | `wikipedia-pt` | Reformas de base (72119911); Petrobras (72337059) |
| `petrobras-1953--the-commodity-boom-and-the-chinese-buyer--enabled` | enabled | probable | `wikipedia-en` | Brazil–China relations (1364321291); Petrobras (1372204096) |
| `profit-remittance-law-1962--operation-brother-sam-1964--caused` | caused | disputed | `wikipedia-en` | 1964 Brazilian coup d'état (1374834512) |
| `profit-remittance-law-1962--the-base-reforms-rally-1964--precondition-of` | precondition-of | probable | `wikipedia-pt`, `wikipedia-en` | Reformas de base (72119911); João Goulart (1366723860) |
| `the-1930-revolution-and-the-vargas-era--companhia-siderurgica-nacional-1941--caused` | caused | probable | `wikipedia-en`, `wikipedia-pt` | Companhia Siderúrgica Nacional (1369475395); Companhia Siderúrgica Nacional (72948718) |
| `the-1930-revolution-and-the-vargas-era--the-rubber-battle-1942--caused` | caused | probable | `wikipedia-en` | Amazon rubber cycle (1373636077); Rubber soldiers (1276596979) |
| `the-1930-revolution-and-the-vargas-era--us-air-bases-in-the-brazilian-northeast-1942--enabled` | enabled | probable | `wikipedia-en` | Brazil in World War II (1373489318) |
| `the-1988-brazilian-constitution--the-impeachment-of-dilma-rousseff-2016--precondition-of` | precondition-of | probable | `wikipedia-en` | Impeachment of Dilma Rousseff (1369411417); Constitution of Brazil (1375080943) |
| `the-2018-brazilian-general-election--lula-returns-to-the-presidency-2023--precondition-of` | precondition-of | probable | `wikipedia-en` | 2022 Brazilian general election (1375252300) |
| `the-amazon-rubber-boom--the-end-of-the-amazon-rubber-monopoly--precondition-of` | precondition-of | probable | `wikipedia-en` | Amazon rubber cycle (1373636077) |
| `the-amazon-rubber-boom--the-rubber-battle-1942--precondition-of` | precondition-of | probable | `wikipedia-en` | Amazon rubber cycle (1373636077); Rubber soldiers (1276596979) |
| `the-atlantic-slave-trade-to-brazil--the-brazilian-coffee-cycle--enabled` | enabled | probable | `wikipedia-en` | Coffee production in Brazil (1371259594) |
| `the-base-reforms-rally-1964--1964-brazilian-coup-detat--precondition-of` | precondition-of | probable | `wikipedia-en`, `wikipedia-pt` | 1964 Brazilian coup d'état (1374834512); Reformas de base (72119911) |
| `the-brazilian-coffee-cycle--companhia-siderurgica-nacional-1941--precondition-of` | precondition-of | probable | `wikipedia-pt`, `wikipedia-en` | Companhia Siderúrgica Nacional (72948718); Companhia Siderúrgica Nacional (1369475395) |
| `the-brazilian-coffee-cycle--the-1930-revolution-and-the-vargas-era--precondition-of` | precondition-of | probable | `wikipedia-en` | Coffee production in Brazil (1371259594) |
| `the-brazilian-debt-crisis-1982--1985-brazilian-presidential-election--precondition-of` | precondition-of | probable | `wikipedia-en` | Diretas Já (1360480962); 1985 Brazilian presidential election (1344763908) |
| `the-brazilian-miracle-1968-1973--the-brazilian-debt-crisis-1982--caused` | caused | probable | `wikipedia-en` | Brazilian Miracle (1349557960); Latin American debt crisis (1356110819) |
| `the-commodity-boom-and-the-chinese-buyer--the-impeachment-of-dilma-rousseff-2016--precondition-of` | precondition-of | probable | `wikipedia-en` | Impeachment of Dilma Rousseff (1369411417); 2000s commodities boom (1368808962) |
| `the-end-of-the-amazon-rubber-monopoly--the-rubber-battle-1942--precondition-of` | precondition-of | probable | `wikipedia-en` | Amazon rubber cycle (1373636077); Rubber soldiers (1276596979) |
| `the-impeachment-of-dilma-rousseff-2016--the-2018-brazilian-general-election--precondition-of` | precondition-of | probable | `wikipedia-en` | 2018 Brazilian general election (1361748195) |

## The link that is disputed, and why

`profit-remittance-law-1962--operation-brother-sam-1964--caused`, confidence
**`disputed`**.

The claim is the owner's own question: **whether the United States backed the
1964 coup because of what Brazil produced, or out of Cold War anticommunism
with the economics secondary.** It is contested by serious historians, the
atlas has exactly one mechanism for telling a reader that, and this is the
claim that mechanism was built for. Writing it flat would turn the atlas into
an opinion.

**The reading the edge states** — cited to `wikipedia-en`, "1964 Brazilian coup
d'état", revision 1374834512. That article's account of the deterioration in
relations names the Profit Remittance Act **first** among the factors, beside
Brizola's expropriations of American companies, the nationalisation of an ITT
subsidiary, the difficulty of American credits and "economic reasons". Law
4,131 capped remittance of profits on foreign capital at ten per cent a year
and, on that article's account, changed the accounting of the large foreign
companies outright. The same article records that Marxist scholarship of the
1960s and 1970s placed heavy emphasis on the American factor, and summarises
Dreifuss's *1964: A Conquista do Estado* (1981), which reads the coup as the
project of entrepreneurs linked to international capital who concluded that to
secure their interests they would have to "conquer the State".

**The reading against it** — cited to `wikipedia-en`, "Operation Brother Sam",
revision 1372915756, a different article read at its own revision so that the
two readings do not rest on the same page. Anti-communism is considered a
fundamental element of the coup both in the scholarship and among the military;
Lincoln Gordon feared a "major disaster" that "might make Brazil the China of
the 1960s"; Kennedy's hostility dated from Goulart's refusal to join an
invasion of Cuba; Washington was also worried by the Peasant Leagues and by
Cuban support for the guerrillas found in 1962. A literature review of 2018
defines the American role as increasing the chances of a rebellion occurring
and succeeding while finding the dynamics of the crisis **fundamentally
Brazilian**, and a Brazilian crisis with American influence weighing for the
opposition is described as the opinion of several historians. Carlos Fico's
criticism of Dreifuss is that the book does not distinguish destabilisation
from conspiracy.

**What settles it is that nothing settles it.** The coup article says in as
many words that at some point the United States decided to favour Goulart's
deposition but that *the chronology and the reasons are controversial*. Both
readings are named, both are sourced, and the atlas leaves the weighing to the
reader — with the profit remittance law and the task force both sitting in the
graph as evidence that can be weighed.

## The narrative

`who-was-buying`, twenty-eight steps, window 1500 to 2024. Each step names the
event or the edge it stands on. **Step 18 of 28 is the disputed link**, so a
reader following the walk meets M50's banner — *"You arrived here through a
disputed link"* — two thirds of the way through the argument rather than as a
curiosity, and the step's own text tells them to read the argument under the
link before taking the step.

The walk breaks its chain three times on purpose and says so each time: at the
Amazon rubber boom, which is not downstream of coffee; at the rubber battle of
1942, reached from the collapse of 1912 nine steps back rather than from the
step before it; and at Operation Car Wash, reached from Petrobras in 1953. The
summary says what a second narrative would argue with — the weight this one
puts on the buyer against the weight it could have put on Brazilian politics
making its own choices.

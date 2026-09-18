# M20 — the ambiguous Wikidata matches, resolved by judgment

Every section of `docs/m17-ambiguous.md` decided, on the owner's instruction
of 4 September 2026: *"solve the ambiguous issues yourself, for now this
is a
demo, I'll review later."* The 113 sections there are 113 hand-written
records
the reconcile pass would not match mechanically.

What was done to a record that is matched here, and nothing else: its
`wikidata` was set to the item id below and
`"wikidata-assigned-by-assistant"` was added to `review.flags`. Titles,
sitelinks and everything else come from the import, not from here. **The
flag
is how the owner finds these**: `review.html` filters by it, and signing a
record clears it. Nothing below was verified against a source — these are
judgments about which item a record means, read off the candidates the pass
printed, and every one of them is reversible by clearing the field.

Two rules held throughout. An item already carried by another record of the
same kind was not reused (rule 21, uniqueness). And no id was written that
the pass did not print: where the right item plainly exists on Wikidata but
was not among the candidates read — the Carnation Revolution is the loudest
case — the record is left unmatched rather than filled in from memory.

## Summary

| | records |
| --- | ---: |
| Matched to an item | 23 |
| Left unmatched, candidates read and rejected | 9 |
| Left unmatched, the pass found no candidate at all | 81 |
| **Total** | **113** |

## Matched

The item, then why it and not the others in that section.

### `banco-de-portugal` → [Q378372](https://www.wikidata.org/wiki/Q378372) — Banco de Portugal

The item is the central bank itself, founded 1846, and the record's dates
are the same; the other two are bank *buildings* in Porto and Braga. The
pass rejected it only because its class (central bank, Q66344) is not in
the seeds file's class list.

### `berlin` → [Q64](https://www.wikidata.org/wiki/Q64) — Berlin

The record is a point at 13.40, 52.52 — the city, which is where the item
sits. Rejected on class alone; the family name and the town in Connecticut
are neither at those coordinates nor the place the 1884–85 conference is
in the atlas for.

### `european-central-bank` → [Q8901](https://www.wikidata.org/wiki/Q8901) — European Central Bank

The central bank of the euro area, 1998–, which is the record word for
word; the other two candidates are a 2014 data breach and a
scholarly-article item. Rejected on class alone.

### `european-commission` → [Q8880](https://www.wikidata.org/wiki/Q8880) — European Commission

The executive of the Union, 1958–, matching the record's dates; the rivals
are the office of Commissioner and one particular portfolio, which are
roles and not the institution.

### `european-economic-community` → [Q52847](https://www.wikidata.org/wiki/Q52847) — European Economic Community

The item is the Community founded by the Treaty of Rome, which is what the
record is about; the rivals are a book chapter and a border. The pass
rejected it for being classed an organisation while the record calls
itself a polity — that disagreement is the record's own editorial choice,
already carrying a `claim` flag, and it is not evidence that the item is a
different thing.

### `expo-98` → [Q1139414](https://www.wikidata.org/wiki/Q1139414) — Expo '98

The 1998 world's fair in Lisbon: same year, same city, same event. The
apostrophe is why the name match failed and the class (world's fair) is
why the test did. The other candidate is an unlabelled exhibition.

### `fnla` → [Q907051](https://www.wikidata.org/wiki/Q907051) — National Liberation Front of Angola

The record's own summary says the movement was formed in 1962 out of the
UPA and the PDA; Wikidata's 1954 start is the UPA's, which is exactly the
ambiguity the record's `date` flag already names. Nothing else called FNLA
is an Angolan movement — the rivals are two bacterial genes.

### `imf` → [Q7804](https://www.wikidata.org/wiki/Q7804) — International Monetary Fund

The institution, founded 1944–45; the record's 1945 is within the year.
The rivals are a bibliographic item and the post of Managing Director.

### `law-of-separation-1911` → [Q10316960](https://www.wikidata.org/wiki/Q10316960) — Law of Separation of Church and State

The item's own description gives 20 April 1911 and calls it Portuguese and
anticlerical — the record's date to the day. It was the only candidate,
rejected on class (a law is not in the seeds file's event classes).

### `legiao-portuguesa` → [Q2405862](https://www.wikidata.org/wiki/Q2405862) — Portuguese Legion

Both bounds agree — 1936–1974 — and the description names the Second
Republic's paramilitary body. The two rivals are the 1807 military unit
and a disambiguation page.

### `lisbon` → [Q597](https://www.wikidata.org/wiki/Q597) — Lisbon

The record is a city-precision point at -9.14, 38.72; Q597 is the
municipality and capital city. Q207199 is the district, a larger
administrative area the record's precision rules out.

### `luanda` → [Q3897](https://www.wikidata.org/wiki/Q3897) — Luanda

13.23, -8.84 is the city, not either province; the two provinces (one of
them Lunda Norte, a different name entirely) were the only things that
could have been confused with it.

### `macau` → [Q14773](https://www.wikidata.org/wiki/Q14773) — Macau

113.54, 22.20 is the territory on the Pearl River, not the commune in
Gironde and not a family name.

### `macau-handover-1999` → [Q847839](https://www.wikidata.org/wiki/Q847839) — transfer of sovereignty over Macau

The only candidate, and it is the same event to the year: the transfer
from Portugal to China in 1999. Rejected on class only.

### `new-york` → [Q60](https://www.wikidata.org/wiki/Q60) — New York City

-73.97, 40.75 is Manhattan. The pass rejected it because the record's
single name, "New York", is not the item's label "New York City" — but the
state (Q1384) is not at that point and the magazine is not a place.

### `noite-sangrenta-1921` → [Q641898](https://www.wikidata.org/wiki/Q641898) — Bloody Night

Its description — the radical revolt in Lisbon, 1921 — is the night of 19
October the record describes; "Noite Sangrenta" is the Portuguese name of
it. The other candidate is a television programme that took the name in
2010.

### `pcp` → [Q769829](https://www.wikidata.org/wiki/Q769829) — Portuguese Communist Party

Founded 1921 and still open, which is the record exactly; the rival is the
Communist Party (Reconstructed) of 1981, a different party. Rejected on
class alone.

### `pedrogao-grande` → [Q1013094](https://www.wikidata.org/wiki/Q1013094) — Pedrógão Grande

Three items share the name — municipality, civil parish, town. The
record's precision is `region` and it stands for the ground the June 2017
fire covered, which is the municipality's.

### `porto` → [Q36433](https://www.wikidata.org/wiki/Q36433) — Porto

-8.61, 41.15 is the Portuguese municipality; the rivals are a family name
and Porto Alegre in Brazil.

### `portuguese-expeditionary-corps` → [Q1634975](https://www.wikidata.org/wiki/Q1634975) — Portuguese Expeditionary Corps

The corps that fought in the First World War, 1917–1918 against the
record's 1916–1919 — the difference is whether the corps is dated from its
formation or from its arrival in Flanders, and the record's summary says
it was sent from January 1917. The two rivals are divisions *within* it.

### `pvde-pide-dgs` → [Q958917](https://www.wikidata.org/wiki/Q958917) — PIDE

The record deliberately holds one institution under three successive
names, and this is the item for the name it is best known by; its
description names the Estado Novo's secret police. Wikidata's 1945–1969
bounds are the PIDE period alone, which is why the tool balked. Worth the
owner's eye: if Wikidata later carries separate PVDE and DGS items, this
record maps onto three of them, not one. The rivals are two items for a
Turkish flatbread.

### `sidonio-pais-assassinated-1918` → [Q23020255](https://www.wikidata.org/wiki/Q23020255) — assassination of Sidónio Pais

The only candidate: the 1918 murder in Lisbon, the record's event to the
year. Rejected on class only.

### `third-portuguese-republic` → [Q1259200](https://www.wikidata.org/wiki/Q1259200) — Third Portuguese Republic

The only candidate, same name, same start — the regime opened on 25 April
1974. Rejected because its class (Q7270, republic) is not in the seeds
file's list.

## Unmatched, having read the candidates

The pass printed candidates for these and none of them is the record.

### `25-november-1975`

The search ran on the record's title, "25 November", so every candidate is
a calendar item — the day of the year, its Orthodox liturgical
counterpart, a Friday in 2019. None of them is the Portuguese events of 25
November 1975. If an item for those exists it was never read here, and I
will not write an id I have not seen.

### `boe`

The record is a point in south-eastern Guinea-Bissau, where independence
was declared in 1973. The candidates are a commune in Lot-et-Garonne, the
Boeing Company and a family name.

### `carnation-revolution-1974`

Same as 25 November: the title "25 April" made this a search for a date,
and the candidates are the day of the year and one particular Friday in
2014. The revolution's own item, whatever it is, was not among the items
read.

### `central-portugal`

The nearest candidate, the Centro NUTS II region, is a real administrative
area; this record is not one. Its own `place` flag says it is a point
invented to stand for the belt of the Centre *and* the North that burned
in October 2017. Tying it to Centro would assert a boundary the record
explicitly refuses. It should be resolved by naming real places, not by
matching this one.

### `constitution-1911`

The only candidate is a Wikimedia disambiguation page, which is never a
record's item.

### `military-dictatorship`

The candidates are the general concept of military dictatorship and two
other countries' regimes — Brazil 1964–1985 and the Chilean junta. The
Portuguese Ditadura Militar of 1926–1933 is not among them.

### `partido-democratico`

Every candidate is a Democratic Party somewhere else — the United States,
Uganda, Italy. The Portuguese party of 1912–1926 is not among the items
read; its Portuguese name would have to be searched for, and this pass
searched the record's first name, the English one.

### `republic-proclaimed-1910`

The candidates are a painting by Benedito Calixto, the Brazilian
proclamation of 1889 and the German one of 1918. Nothing here is Portugal,
5 October 1910.

### `tite`

The record is a place in Guinea-Bissau. The candidates are a Brazilian
football manager, a family name and a district in Aceh.

## Unmatched, no candidate to judge

For these 81 the search returned nothing to decide between: Wikidata's
search
was given the record's own name — for an event, the title the atlas wrote —
and most of those titles are descriptions somebody composed here ("Beginning
of the war in Angola", "The revision that abolishes the Council of the
Revolution") rather than labels any item carries. That is a limitation of
how
the pass searches, not evidence that the item does not exist; several of
these
certainly have one. Resolving them needs a search on Portuguese labels and
on
aliases, which is work for a later reconcile pass, not a judgment anybody
can
make from this file.

| record | kind | searched for |
| --- | --- | --- |
| `alvor` | place | Alvor, Algarve |
| `alvor-agreement-1975` | event | The Alvor Agreement |
| `angola-independence-1975` | event | Independence of Angola |
| `angola-war-begins-1961` | event | Beginning of the war in Angola |
| `armed-forces-movement` | actor | Armed Forces Movement |
| `azores-agreement-1943` | event | Anglo-Portuguese agreement on Azores bases |
| `belem` | place | Belém, Lisbon |
| `bes-resolution-2014` | event | Resolution of Banco Espírito Santo |
| `botelho-moniz-coup-attempt-1961` | event | Botelho Moniz's failed move against Salazar |
| `bpn-nationalisation-2008` | event | Nationalisation of the Banco Português de Negócios |
| `cabral-assassinated-1973` | event | Assassination of Amílcar Cabral |
| `caetano-succeeds-salazar-1968` | event | Marcelo Caetano succeeds Salazar |
| `cavaco-absolute-majority-1987` | event | Cavaco Silva's absolute majority |
| `chai` | place | Chai, Cabo Delgado |
| `constituent-assembly-election-1975` | event | Constituent Assembly election |
| `constitution-1933` | event | Constitution of 1933 |
| `constitution-1976` | event | Constitution of 1976 |
| `constitutional-revision-1959` | event | The revision that ends direct presidential elections |
| `constitutional-revision-1982` | event | The revision that abolishes the Council of the Revolution |
| `costa-resigns-2023` | event | António Costa resigns |
| `council-of-the-revolution` | actor | Council of the Revolution |
| `coup-28-may-1926` | event | Coup of 28 May |
| `coup-attempt-11-march-1975` | event | The failed coup of 11 March |
| `covid-state-of-emergency-2020` | event | First state of emergency of the pandemic |
| `delgado-assassinated-1965` | event | Humberto Delgado murdered by the PIDE |
| `delgado-candidacy-1958` | event | Humberto Delgado's presidential candidacy |
| `eanes-elected-1976` | event | Ramalho Eanes elected president |
| `east-timor-independence-2002` | event | Independence of East Timor |
| `east-timor-invasion-1975` | event | Indonesia invades East Timor |
| `eec-accession-1986` | event | Portugal joins the EEC |
| `eec-application-1977` | event | Portugal applies to join the EEC |
| `euro-2016-final` | event | Portugal wins the European Championship |
| `euro-adoption-1999` | event | Portugal adopts the euro |
| `exposicao-mundo-portugues-1940` | event | Exhibition of the Portuguese World |
| `fiftieth-anniversary-25-april-2024` | event | Fifty years of 25 April |
| `flanders` | place | Flanders, near Laventie |
| `geringonca-2015` | event | The PS minority government of 2015 |
| `germany-declares-war-1916` | event | Germany declares war on Portugal |
| `goa-annexed-1961` | event | India annexes Goa, Daman and Diu |
| `government-falls-2025` | event | The government loses a confidence vote |
| `guinea-bissau-declares-independence-1973` | event | PAIGC declares the independence of Guinea-Bissau |
| `guinea-war-begins-1963` | event | Beginning of the war in Guinea |
| `iberian-blackout-2025` | event | The Iberian blackout |
| `imf-agreement-1978` | event | First stabilisation agreement with the IMF |
| `imf-agreement-1983` | event | Second stabilisation agreement with the IMF |
| `lajes` | place | Lajes, Terceira |
| `legiao-portuguesa-founded-1936` | event | Foundation of the Portuguese Legion |
| `legislative-election-1976` | event | First legislative election under the constitution |
| `legislative-election-2015` | event | Legislative election of 2015 |
| `legislative-election-2019` | event | Legislative election of 2019 |
| `legislative-election-2022` | event | Legislative election of 2022 |
| `legislative-election-2024` | event | Legislative election of 2024 |
| `legislative-election-2025` | event | Legislative election of 2025 |
| `marcelo-elected-president-2016` | event | Marcelo Rebelo de Sousa elected president |
| `marcelo-reelected-2021` | event | Marcelo Rebelo de Sousa re-elected |
| `monarchy-of-the-north-1919` | event | The Monarchy of the North |
| `montenegro-government-2024` | event | The Montenegro government takes office |
| `mozambique-war-begins-1964` | event | Beginning of the war in Mozambique |
| `nationalisations-1975` | event | Nationalisation of banks and insurance |
| `nato-founding-1949` | event | Portugal signs the North Atlantic Treaty |
| `near-villanueva-del-fresno` | place | near Villanueva del Fresno, Spain |
| `october-fires-2017` | event | The fires of October 2017 |
| `parque-das-nacoes` | place | Parque das Nações, Lisbon |
| `pedrogao-grande-fires-2017` | event | The Pedrógão Grande fires |
| `pimenta-de-castro-government-1915` | event | Pimenta de Castro's authoritarian government |
| `portugal-backs-franco-1936` | event | Portugal supports the Nationalists in the Spanish Civil War |
| `portugal-e-o-futuro-1974` | event | Publication of Portugal e o Futuro |
| `recife` | place | Recife, at the end of the voyage |
| `revolt-14-may-1915` | event | The revolt of 14 May restores the Democrats |
| `salazar-finance-minister-1928` | event | Salazar becomes Minister of Finance |
| `salazar-president-of-council-1932` | event | Salazar becomes President of the Council |
| `santa-maria-hijacking-1961` | event | The seizure of the liner Santa Maria |
| `sidonio-pais-coup-1917` | event | Sidónio Pais's coup |
| `soares-elected-president-1986` | event | Mário Soares elected president |
| `spinola-resigns-1974` | event | Spínola resigns the presidency |
| `tete-district` | place | Tete district, Mozambique |
| `troika-bailout-2011` | event | Request for financial assistance |
| `troika-programme-ends-2014` | event | Exit from the adjustment programme |
| `un-admission-1955` | event | Portugal admitted to the United Nations |
| `wiriyamu-massacre-1972` | event | The Wiriyamu massacre |
| `world-youth-day-2023` | event | World Youth Day in Lisbon |


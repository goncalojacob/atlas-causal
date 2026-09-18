# M59 — the hundred that end at a file boundary, measured one by one

M51 had pairs: an actor ending in 1885 with a same-named counterpart
beginning in 1886, and a question — *are these two records the same polity?*
— that the ground could answer. What is left has no counterpart to ask about.
So this milestone asks the question backwards: **for each record that ends in
1885, which 1886-side record is standing on its ground?** Geometry proposes
the partner the name never found.

Regenerate every number below with `node tools/m59-singletons.mjs`;
`tests/m59.test.mjs` asserts that the ratios in these tables are the ones the
tool measures, so this file cannot drift from the data.

## 1. Re-measured, 18 September

The brief counted 101 and 105 on 17 September and said to measure again,
because M51, M53 and M55 have all moved actors since. **On the records as this
milestone found them:**

- **100** active actors end in exactly **1885**.
- **104** active actors begin in exactly **1886**.

One left each side between the two counts. Those two numbers are the state
before this milestone acted; what they are after it is in `STATUS.md`, which
is where a count belongs. Every measurement below is from those same records,
and none of it moves when the verdicts are carried out: a ratio here is a fact
about two outlines, and joining two records does not redraw either.

## 2. What is measured, and the second quantity M51 did not need

For each 1885-side record: its **last presence before the seam**, against the
**first presence after it** of every one of the 104 records that begin in
1886. `tools/overlap.mjs` does the arithmetic, exactly as in M51 — a sweep by
lines of latitude, longitude intervals by parity, weighted by cos(lat), no
projection and no library. Bounding boxes that do not touch are skipped
without a sweep; that is the only reason 10,400 comparisons finish in
twenty-five seconds.

Two quantities come back, and M59 needs both:

- **`overlap`** — intersection over the area of the **smaller**, which is
  M51's quantity and M51's cut of 0.50 still reads it.
- **`jaccard`** — intersection over the **union**.

M51 never needed the second because its pairs were already name-matched, so a
high overlap could only mean identity. A singleton's best territorial match is
usually not its twin but its **container**, and `overlap` cannot tell those
apart: it reads **1.0000** for two identical outlines *and* for a small
polity wholly inside a large one. `lunda` measures 1.0000 against the Congo
Free State and is a piece of it. `jaccard` falls with the difference in size
and stays high only when the ground is the same ground in both directions —
Lunda's is **0.0373**.

**This measures territory, not time.** It says nothing about when anything
began or ended, and no date in this file was authored here.

### Two presences in one year, and the union that must not be taken

`guinea-bissau-under-portugal` has two presences beginning in 1886 (keys 218
and 219), and `namibia-under-south-africa` two more. They are successive
drawings of the same year — one valid 1886–1886 and the other 1886–1942 — not
two halves of a territory.

Merging them into one MultiPolygon is wrong in both directions, and the first
draft of the tool did it. Two coincident rings **annihilate** under the
even-odd rule, because a point inside both crosses an even number of times:
Portuguese Guinea measured 0.0572 against the drawing the tool saw and
**0.0000** against the union of the two. Where they had not coincided, the
larger area would simply have been counted twice.

So each drawing is measured on its own and the best-matching one is the row.
Nothing is unioned, simplified or redrawn, and every row names the two
presences it compared.

## 3. The distribution, and why no cut in it decides anything

Of the 100, **60** overlap some 1886-side record at all and **40** overlap
none. The 60, by `jaccard`, in tenths:

```
0.0–0.1  ################################  32
0.1–0.2  ####                               4
0.2–0.3                                     0
0.3–0.4  ###                                3
0.4–0.5  ##                                 2
0.5–0.6  #####                              5
0.6–0.7  #                                  1
0.7–0.8  ###                                3
0.8–0.9  ########                           8
0.9–1.0  ##                                 2
```

M51 chose its cut from the numbers because the numbers offered one: an empty
band **0.727** wide against a widest-within-cluster gap of **0.066**, eleven
times wider, so that moving the cut anywhere from 0.10 to 0.79 changed not one
verdict. **This distribution offers nothing of the kind.** Its three widest
gaps are:

| gap | between | and |
|---|---|---|
| 0.1735 | `asante` 0.3389 | `futa-jalon` 0.1654 |
| 0.1159 | `annam` 0.6978 | `romania` 0.5819 |
| 0.0957 | `harer-egypt` 0.4583 | `ibadan` 0.3626 |

The widest is **1.5 times** the next, where M51's was eleven times the next.
There is no empty band and no knee: it is a gradient with three shallow
notches in it, and a cut drawn at any of them would be a number fitted to the
cases either side of it — the thing `NEAR_ZOOM` did and `NEAR_SPAN` had to
undo.

**So M59 does not draw one.** M51's own instruction is what this distribution
calls for: *put everything near the cut to a person.* Here everything is near
the cut, and geometry is demoted from verdict to **filter**. It narrows 100
records to the 24 with `jaccard` ≥ 0.3389 that could possibly have a partner,
and then **the name decides**, by M51 §4's rule and nothing looser. The two
tests are not symmetric and were never meant to be: geometry can only ever
*refuse* a pair or *nominate* one, and a nomination is not a finding.

That asymmetry does real work here. `portuguese-guinea` against
`guinea-bissau-under-portugal` is the pair every string matcher would make —
and the outlines share **0.0572** of the smaller, because Historical Basemaps
draws the colony a degree north of where CShapes draws it. The name proposes
and the ground refuses, which is the answer M51 got on `harer-egypt` reached
from the other side.

## 4. The 60 that overlap something, by jaccard

`overlap` is M51's quantity, intersection over the smaller; `jaccard` is
intersection over the union. Areas are in equator-equivalent square degrees
and cancel in both ratios.

| jaccard | overlap | 1885 side | best 1886-side match | area 1885 | area 1886 | last before | first after |
|---|---|---|---|---|---|---|---|
| 0.9655 | 0.9881 | `manchu-empire` | `china` | 890.643 | 900.984 | `manchu-empire-1880` | `china-1886` |
| 0.9095 | 0.9717 | `dutch-guiana` | `surinam-under-netherlands` | 12.109 | 11.643 | `dutch-guiana-1880` | `surinam-under-netherlands-1886` |
| 0.8975 | 0.9518 | `british-raj` | `british-india` | 380.628 | 376.048 | `british-raj-1880` | `british-india-1886` |
| 0.8839 | 0.9578 | `italy` | `italy-sardinia` | 24.091 | 23.133 | `italy-1880` | `italy-sardinia-1886` |
| 0.8790 | 0.9717 | `ceylon` | `sri-lanka-ceylon-under-united-kingdom` | 4.803 | 5.174 | `ceylon-1880` | `sri-lanka-ceylon-under-united-kingdom-1886` |
| 0.8681 | 0.9457 | `french-guiana` | `french-guyana` | 6.524 | 6.753 | `french-guiana-1880` | `french-guyana-1886` |
| 0.8585 | 0.9428 | `sweden-norway` | `sweden` | 63.233 | 60.743 | `sweden-norway-1880` | `sweden-1886` |
| 0.8260 | 0.9416 | `maori` | `new-zealand-under-united-kingdom` | 20.137 | 21.779 | `maori-1880` | `new-zealand-under-united-kingdom-1886` |
| 0.8137 | 0.8996 | `imperial-japan` | `japan` | 29.964 | 30.118 | `imperial-japan-1880` | `japan-1886` |
| 0.8063 | 0.8983 | `united-kingdom-of-great-britain-and-ireland` | `united-kingdom` | 25.202 | 24.894 | `united-kingdom-of-great-britain-and-ireland-1880` | `united-kingdom-1886` |
| 0.7977 | 0.9293 | `netherlands-indies` | `dutch-east-indies` | 137.198 | 150.138 | `netherlands-indies-1880` | `dutch-east-indies-1886` |
| 0.7573 | 0.9292 | `bosnia-herzegovina-before-1886` | `bosnia` | 3.883 | 3.358 | `bosnia-herzegovina-before-1886-1880` | `bosnia-1886` |
| 0.7183 | 0.8679 | `rattanakosin-kingdom` | `thailand` | 68.184 | 63.353 | `rattanakosin-kingdom-1880` | `thailand-1886` |
| 0.6978 | 0.9431 | `annam` | `vietnam-annam-cochin-china-tonkin` | 23.692 | 30.67 | `annam-1880` | `vietnam-annam-cochin-china-tonkin-1886` |
| 0.5819 | 0.9277 | `romania` | `rumania` | 15.763 | 10.356 | `romania-1880` | `rumania-1886` |
| 0.5686 | 0.9674 | `french-indochina` | `cambodia-kampuchea-under-france` | 17.613 | 10.554 | `french-indochina-1880` | `cambodia-kampuchea-under-france-1886` |
| 0.5619 | 0.7236 | `basutoland` | `lesotho-under-united-kingdom` | 2.409 | 2.437 | `basutoland-1880` | `lesotho-under-united-kingdom-1886` |
| 0.5492 | 0.9589 | `british-guiana` | `guyana-under-united-kingdom` | 9.952 | 16.968 | `british-guiana-1880` | `guyana-under-united-kingdom-1886` |
| 0.5018 | 0.9913 | `spanish-guinea` | `equatorial-guinea-under-spain` | 1.099 | 2.162 | `spanish-guinea-1880` | `equatorial-guinea-under-spain-1886` |
| 0.4824 | 0.9411 | `papua-new-guinea-before-1886` | `papua` | 34.325 | 18.142 | `papua-new-guinea-before-1886-1880` | `papua-1886` |
| 0.4583 | 0.7449 | `harer-egypt` | `british-somaliland-somaliland-republic` | 10.249 | 14.044 | `harer-egypt-1880` | `british-somaliland-somaliland-republic-1886` |
| 0.3626 | 0.7189 | `ibadan` | `lagos` | 3.448 | 5.867 | `ibadan-1880` | `lagos-1886` |
| 0.3525 | 0.9619 | `gold-coast-gb` | `ghana-under-united-kingdom` | 2.097 | 5.642 | `gold-coast-gb-1880` | `ghana-under-united-kingdom-1886` |
| 0.3389 | 0.5940 | `asante` | `ghana-under-united-kingdom` | 4.189 | 5.642 | `asante-1880` | `ghana-under-united-kingdom-1886` |
| 0.1654 | 0.3216 | `futa-jalon` | `guinea-bissau-under-portugal` | 3.276 | 2.587 | `futa-jalon-1880` | `guinea-bissau-under-portugal-1886-b` |
| 0.1508 | 1.0000 | `sultanate-of-utetera` | `congo-democratic-republic-of-zaire-under-belgium` | 24.659 | 163.518 | `sultanate-of-utetera-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.1196 | 0.4705 | `oyo` | `lagos` | 1.724 | 5.867 | `oyo-1880` | `lagos-1886` |
| 0.1103 | 1.0000 | `ato-trading-confederacy` | `oil-rivers-protectorate` | 1.142 | 10.354 | `ato-trading-confederacy-1880` | `oil-rivers-protectorate-1886` |
| 0.0920 | 0.4628 | `teke` | `congo-under-france` | 6.219 | 27.929 | `teke-1880` | `congo-under-france-1886` |
| 0.0834 | 0.6283 | `arabia` | `oman` | 179.799 | 25.114 | `arabia-1880` | `oman-1886` |
| 0.0814 | 0.8670 | `benin-before-1886` | `oil-rivers-protectorate` | 0.984 | 10.354 | `benin-before-1886-1880` | `oil-rivers-protectorate-1886` |
| 0.0782 | 0.8876 | `griqualand-west` | `cape-colony` | 4.327 | 48.651 | `griqualand-west-1880` | `cape-colony-1886` |
| 0.0713 | 0.7435 | `ngwato` | `botswana-under-united-kingdom` | 2.473 | 25.157 | `ngwato-1880` | `botswana-under-united-kingdom-1886` |
| 0.0638 | 0.3447 | `dahomey` | `german-togoland` | 2.739 | 0.577 | `dahomey-1880` | `german-togoland-1886` |
| 0.0577 | 0.9946 | `malaya` | `perak` | 25.982 | 1.508 | `malaya-1880` | `perak-1886` |
| 0.0453 | 0.8674 | `opobo` | `oil-rivers-protectorate` | 0.545 | 10.354 | `opobo-1880` | `oil-rivers-protectorate-1886` |
| 0.0389 | 0.4454 | `yeke` | `congo-democratic-republic-of-zaire-under-belgium` | 15.022 | 163.509 | `yeke-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0373 | 1.0000 | `lunda` | `congo-democratic-republic-of-zaire-under-belgium` | 6.1 | 163.51 | `lunda-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0263 | 0.3268 | `zululand` | `transvaal` | 2.076 | 24.356 | `zululand-1880` | `transvaal-1886` |
| 0.0260 | 0.0703 | `bokhara-khanate` | `khiva` | 14.421 | 8.129 | `bokhara-khanate-1880` | `khiva-1886` |
| 0.0241 | 0.8054 | `kuba` | `congo-democratic-republic-of-zaire-under-belgium` | 4.929 | 163.512 | `kuba-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0232 | 0.2637 | `calabar` | `oil-rivers-protectorate` | 0.973 | 10.354 | `calabar-1880` | `oil-rivers-protectorate-1886` |
| 0.0230 | 0.4076 | `swaziland` | `transvaal` | 1.422 | 24.356 | `swaziland-1880` | `transvaal-1886` |
| 0.0168 | 0.0572 | `portuguese-guinea` | `guinea-bissau-under-portugal` | 1.052 | 2.587 | `portuguese-guinea-1880` | `guinea-bissau-under-portugal-1886-b` |
| 0.0139 | 0.3832 | `yaka` | `congo-democratic-republic-of-zaire-under-belgium` | 6.081 | 163.512 | `yaka-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0129 | 0.0687 | `congo-before-1886` | `congo-under-france` | 6.364 | 27.929 | `congo-before-1886-1880` | `congo-under-france-1886` |
| 0.0121 | 0.0806 | `trucial-oman` | `oman` | 4.372 | 25.112 | `trucial-oman-1880` | `oman-1886` |
| 0.0094 | 0.9757 | `luba` | `congo-democratic-republic-of-zaire-under-belgium` | 1.569 | 163.511 | `luba-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0093 | 0.0244 | `kanem-bornu` | `kamerun` | 24.963 | 41.387 | `kanem-bornu-1880` | `kamerun-1886` |
| 0.0079 | 0.0553 | `kingdom-of-brazil` | `bolivia` | 649.248 | 107.262 | `kingdom-of-brazil-1880` | `bolivia-1886` |
| 0.0074 | 0.0326 | `kong-empire` | `ghana-under-united-kingdom` | 19.364 | 5.642 | `kong-empire-1880` | `ghana-under-united-kingdom-1886` |
| 0.0052 | 0.0213 | `central-asian-khanates` | `bokhara` | 4.997 | 15.691 | `central-asian-khanates-1880` | `bokhara-1886` |
| 0.0041 | 0.0900 | `barotse` | `congo-democratic-republic-of-zaire-under-belgium` | 7.856 | 163.511 | `barotse-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0032 | 0.9587 | `taiwan-before-1886` | `china` | 2.987 | 900.978 | `taiwan-before-1886-1880` | `china-1886` |
| 0.0027 | 0.0147 | `lozi` | `namibia-under-south-africa` | 14.819 | 66.84 | `lozi-1880` | `namibia-under-south-africa-1886-b` |
| 0.0007 | 0.0085 | `mirambo-unyanyembe-ukimbu` | `congo-democratic-republic-of-zaire-under-belgium` | 13.643 | 163.509 | `mirambo-unyanyembe-ukimbu-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0002 | 0.7745 | `polynesians` | `chile` | 0.013 | 59.295 | `polynesians-1880` | `chile-1886` |
| 0.0001 | 0.0027 | `bunyoro` | `congo-democratic-republic-of-zaire-under-belgium` | 4.711 | 163.511 | `bunyoro-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |
| 0.0001 | 0.8216 | `hong-kong` | `china` | 0.092 | 900.978 | `hong-kong-1880` | `china-1886` |
| 0.0000 | 0.0002 | `burundi-before-1886` | `congo-democratic-republic-of-zaire-under-belgium` | 1.303 | 163.511 | `burundi-before-1886-1880` | `congo-democratic-republic-of-zaire-under-belgium-1886` |

## 5. The 40 that overlap nothing at all

Forty of the hundred touch no 1886-side record anywhere — not weakly, not
partially: their outlines and every 1886 outline are disjoint, and most are
rejected on bounding boxes before a sweep is run. Islands, peoples and
polities the later dataset simply does not carry.

This is the brief's case 3 arriving as a measurement rather than as a guess.
For these there is no partner to have missed, no name to have spelled
differently, and nothing for a cut to decide. Their 1885 is the file boundary
and can be nothing else.

| 1885 side | span |
|---|---|
| `american-samoa` | 1878–1885 |
| `antigua-and-barbuda` | 1715–1885 |
| `borgu-states` | 1878–1885 |
| `brunei-before-1886` | 1650–1885 |
| `buganda` | 1815–1885 |
| `cotonou` | 1878–1885 |
| `dendi-kingdom` | 1878–1885 |
| `dominica` | 1715–1885 |
| `futa-toro` | 1878–1885 |
| `gambia-before-1886` | 1878–1885 |
| `greenland` | 1878–1885 |
| `imerina` | 1878–1885 |
| `ivory-coast` | 1878–1885 |
| `kingdom-of-hawaii` | 1815–1885 |
| `mbailundu` | 1878–1885 |
| `montserrat` | 1715–1885 |
| `mossi-states` | 1492–1885 |
| `ndebele` | 1878–1885 |
| `netherlands-antilles` | 1715–1885 |
| `nguni` | 1878–1885 |
| `niue` | 1878–1885 |
| `northern-territory-uk` | 1878–1885 |
| `ovimbundu` | 1878–1885 |
| `qatar-before-1886` | 1878–1885 |
| `rabih-az-zubayr` | 1878–1885 |
| `rwanda-before-1886` | 1815–1885 |
| `saint-barthelemy` | 1715–1885 |
| `saint-kitts-and-nevis` | 1815–1885 |
| `saint-martin` | 1715–1885 |
| `samoa` | 1878–1885 |
| `shona` | 1878–1885 |
| `sokoto-caliphate` | 1878–1885 |
| `sultanate-of-damagaram` | 1878–1885 |
| `sultanate-of-zanzibar` | 1880–1885 |
| `tonga` | 1878–1885 |
| `tukular-caliphate` | 1878–1885 |
| `united-states-virgin-islands` | 1878–1885 |
| `wadai-empire` | 1878–1885 |
| `wallis-and-futuna-islands` | 1878–1885 |
| `wassoulou-empire` | 1878–1885 |

## 6. The verdict on all 100

Three things happen to a record here, and the first two are the brief's cases
2 and 1. **Every one of the hundred gets exactly one of them.**

### Joined on territory and name — 7

Geometry nominated; M51 §4's stem rule agreed. Each of these is a polity that
continued under a name the other import spells differently, which is what the
26 of M51 were, reached from the other side. Each join is one record spanning
both periods and one merged into it with `supersededBy`, and no date is
authored: the interval is the 1885 record's own start and the 1886 record's
own end, both already in the atlas and each already carrying its source.

| survivor | merged | overlap | jaccard | what the two names are |
|---|---|---|---|---|
| `french-guiana` | `french-guyana` | 0.9457 | 0.8681 | Guiana and Guyana are one word in two spellings |
| `british-guiana` | `guyana-under-united-kingdom` | 0.9589 | 0.5492 | the same word in the same two spellings, under the sovereign the 1886 id already states in its own fields |
| `rumania` | `romania` | 0.9277 | 0.5819 | Rumania is Romania in the older English spelling |
| `ceylon` | `sri-lanka-ceylon-under-united-kingdom` | 0.9717 | 0.8790 | the parenthetical is the same polity's other name, as "Madagascar (Malagasy)" was in M51 |
| `british-india` | `british-raj` | 0.9518 | 0.8975 | the British Raj and British India are two English names for one polity |
| `netherlands-indies` | `dutch-east-indies` | 0.9293 | 0.7977 | Netherlands and Dutch are one adjective in two forms, and the Indies are the same Indies |
| `dutch-guiana` | `surinam-under-netherlands` | 0.9717 | 0.9095 | Dutch Guiana is the colony the other import files as Surinam |

The surviving id is the one more records already pointed at, which is M51's
rule. It leaves `rumania` carrying an archaic spelling and `dutch-guiana`
running to 1975, two handles M56's rule would want moved; renaming is that
milestone's business and not this one's, and both are noted in the backlog
rather than done here.

Two of the seven are corroborated from outside the join. `netherlands-indies`
takes 1945 from `dutch-east-indies`, and Wikidata's `Q188161` gives P576
1945-08-17 for the same polity; `ceylon` takes 1948, and `Q2670092` puts the
Dominion of Ceylon's inception at 1948-02-04, the day the record it is joined
to ends. Neither date came from Wikidata — both were already in the atlas —
but neither is contradicted by it.

### Dated from Wikidata — 17

The brief's case 1: the polity really did end, Wikidata says when, and the
record now says so with the item and the property on its `sources`. The 1885
is gone because it was never a fact; what replaces it is cited, not
remembered. `docs/m59-dates.md` is the lookup, `docs/m59-subjects.txt` the
list it was asked.

| actor | 1885 becomes | item | property |
|---|---|---|---|
| `basutoland` | 1966 | [`Q2340665`](https://www.wikidata.org/wiki/Q2340665) Basutoland | P576 1966 |
| `bokhara-khanate` | 1920 | [`Q746558`](https://www.wikidata.org/wiki/Q746558) Emirate of Bukhara | P576 1920-10-07 |
| `buganda` | 1966 | [`Q473748`](https://www.wikidata.org/wiki/Q473748) Buganda | P576 1966 |
| `bunyoro` | 1899 | [`Q889897`](https://www.wikidata.org/wiki/Q889897) Bunyoro | P576 1899 |
| `dendi-kingdom` | 1901 | [`Q761103`](https://www.wikidata.org/wiki/Q761103) Dendi Kingdom | P576 1901 |
| `imerina` | 1897 | [`Q1071439`](https://www.wikidata.org/wiki/Q1071439) Merina Kingdom | P576 1897 |
| `imperial-japan` | 1947 | [`Q188712`](https://www.wikidata.org/wiki/Q188712) Empire of Japan | P576 1947-05-03 |
| `kingdom-of-hawaii` | 1895 | [`Q156418`](https://www.wikidata.org/wiki/Q156418) Kingdom of Hawaiʻi | P576 1895-01-24 |
| `kong-empire` | 1898 | [`Q1587244`](https://www.wikidata.org/wiki/Q1587244) Kong Empire | P576 1898 |
| `oyo` | 1905 | [`Q849623`](https://www.wikidata.org/wiki/Q849623) Oyo Empire | P576 1905 |
| `sokoto-caliphate` | 1903 | [`Q600524`](https://www.wikidata.org/wiki/Q600524) Sokoto Caliphate | P576 1903 |
| `sultanate-of-damagaram` | 1899 | [`Q4154364`](https://www.wikidata.org/wiki/Q4154364) Sultanate of Damagaram | P576 1899 |
| `sultanate-of-utetera` | 1887 | [`Q60775599`](https://www.wikidata.org/wiki/Q60775599) Tippu Tip's state | P576 1887 |
| `united-kingdom-of-great-britain-and-ireland` | 1927 | [`Q174193`](https://www.wikidata.org/wiki/Q174193) United Kingdom of Great Britain and Ireland | P576 1927-04-12 |
| `wadai-empire` | 1909 | [`Q1132786`](https://www.wikidata.org/wiki/Q1132786) Ouaddai Empire | P576 1909 |
| `wassoulou-empire` | 1898 | [`Q568712`](https://www.wikidata.org/wiki/Q568712) Samorian state | P576 1898-09-29 |
| `zululand` | 1897 | [`Q729768`](https://www.wikidata.org/wiki/Q729768) Zulu Kingdom | P576 1897 |

Only `end` moves. The `start` on every one of them is still the first snapshot
the dataset draws, which is a horizon too — the brief asks about the 1885 end
and that is what this milestone answers; a start is another milestone's
question and writing one here on a P571 nobody asked for would be exactly the
overreach the seam is being cleared of.

**The lookup returned 21 dissolutions and four are refused, on one rule: an
item whose P571 is later than the record's last snapshot is not the polity the
record draws.** `Q2670092`, the Dominion of Ceylon, begins in 1948; `Q25227`,
the Netherlands Antilles, in 1954 — against a record the dataset draws from
1715; and `Q185682`, French Indochina, in 1887, two years after the last
outline this record has. A match is not a date and a date is not a verdict.
Ceylon and the Netherlands Indies are joined instead, and the Netherlands
Antilles and French Indochina are marked.

### Marked as the source's horizon — 76

Everything else. There is no partner and no dissolution, so the end stays
**1885** — moving it would be the invented date the brief forbids — and the
record says on its own face what that 1885 is.

**The mark is not a new record type and not a new field.** `review.flags` and
`review.note` are what M51 used to say why a record is what it is, and they
carry this too: the flag is `source-horizon` and the note says that 1885 is
where Historical Basemaps stops, that no 1886-side record stands on this
ground under any name, and that Wikidata gives no dissolution to cite.

The import's own summary already came close — every one of the hundred carries
the sentence *"The interval on this record is the span those snapshots cover,
X to 1885, and not a claim about when this polity began or ended."* That is
true and it is general; what it does not say is that the 1885 in particular is
a file boundary, and 1885 is the number a reader takes for a fact. The mark
makes the existing note explicit rather than replacing it, which is what the
brief asked for.

## 7. The thirteen questions geometry asked and the name refused

These are marked with the rest — the mark is what the record says, and none of
them has a date to cite — but the measurement found something on their ground
and it would be lost if only the flag were left. Each is a question for a
person, in the shape M51 left `italy` and `annam`.

| pair | overlap | jaccard | the question |
|---|---|---|---|
| `manchu-empire` / `china` | 0.9881 | 0.9655 | the highest jaccard in the table, and the two names are a dynasty and a country. Is CShapes' `china` the Qing continuing, or one record for three regimes 1886 to today? |
| `italy` / `italy-sardinia` | 0.9578 | 0.8839 | M51's question, unchanged: which of the two the 1886 record is, and if it is a succession, on what sourced date |
| `sweden-norway` / `sweden` | 0.9428 | 0.8585 | the 1885 name holds a second polity's, which M51 §4 refuses to reduce. The union ended; `sweden` is one of its two crowns |
| `maori` / `new-zealand-under-united-kingdom` | 0.9416 | 0.8260 | the clearest case of the ground proposing what the name must refuse: a people measured against the colony drawn over them |
| `bosnia-herzegovina-before-1886` / `bosnia` | 0.9292 | 0.7573 | one record against two — `herzegovina` shares 0.8289 of the smaller with the same outline. A split, not a join |
| `rattanakosin-kingdom` / `thailand` | 0.8679 | 0.7183 | a rename with a real date behind it, and nobody has supplied the date |
| `annam` / `vietnam-annam-cochin-china-tonkin` | 0.9431 | 0.6978 | M51's question, unchanged: containment or identity, and what becomes of the two territories the 1886 name lists that have no 1885 record at all |
| `french-indochina` / `cambodia-kampuchea-under-france` | 0.9674 | 0.5686 | the 1885 outline holds the 1886 one and more. Containment again, and `Q185682` says the union began in 1887, after both snapshots |
| `spanish-guinea` / `equatorial-guinea-under-spain` | 0.9913 | 0.5018 | almost all of the 1885 ground is inside the 1886 record, which is twice its size. The colonial name against the independence name, with the outlines disagreeing about how much |
| `papua-new-guinea-before-1886` / `papua` | 0.9411 | 0.4824 | one record against two: `new-guinea-german-new-guinea-kaiser-wilhelmsland` shares 0.8245 of the smaller with the same outline |
| `gold-coast-gb` / `ghana-under-united-kingdom` | 0.9619 | 0.3525 | Basutoland's shape exactly — the colonial name and the independence name — but no `Q` gave a dissolution, and the 1886 outline is nearly three times the 1885 one |
| `asante` / `ghana-under-united-kingdom` | 0.5940 | 0.3389 | and the same 1886 record again, from a second 1885 record. Two of them cannot both be it |
| `harer-egypt` / `british-somaliland-somaliland-republic` | 0.7449 | 0.4583 | M49 named this record as the string matcher's false pair on "Egypt" and M51's ground agreed at 0.0000. Geometry now offers it a different partner, and that one is a protectorate Harar was never part of. A nomination is not a finding |

## 8. Where the seam stands after this milestone

The count the brief asks for, which is the one that says whether the seam is
closed, is in `STATUS.md`. What this document can say is what changed and what
did not:

- 7 of the hundred are joined and are no longer two records.
- 17 carry a cited dissolution and no longer end at a file boundary.
- 76 still end in 1885 and now say why.
- 13 of those 76 carry a question this milestone could not answer and would
  not guess at.

**Nothing here was decided by a number alone.** Geometry refused
`portuguese-guinea` its obvious partner and offered `maori` one it could not
have; both times the other test overruled it. That is the whole reason there
are two.

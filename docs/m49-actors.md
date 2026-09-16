# M49 — the actors at the 1885/1886 seam

The owner, 16 September, on seeing a chip reading **"Russia (Soviet Union)"**:

> **"they should be taken as different actors because effectively Soviet Union
> stopped being Soviet Union and went to being Russia"**

This file is the survey that milestone was told to write before it changed a
single record: every actor at the seam, both ids, both spans, and the verdict.

**Every verdict in this file is still open, and the reason is stated once
here.** The brief allows exactly one source for the dates this milestone
turns on — Wikidata, P571 for inception and P576 for dissolution — and
Wikidata cannot be reached from the sandbox the scheduled run executes in.
The run of 16 September established that and wrote the rest of the survey
around it; section 3 says what that run tried and what a person must do.
No date in this file is supplied from anywhere else. That is not caution,
it is the rule: `CLAUDE.md` forbids the assistant writing historical claims,
and the brief repeats it as "**no invented date, ever — the whole milestone
turns on this**".

So what follows is the half of the survey that can be taken from the
repository without asserting anything: what each dataset says, where the two
meet, and, for each pair, the exact question that has to be put to Wikidata.

## 1. The seam, measured

Two imports meet at 1885/1886 and neither knows the other exists.

- **123 actors are active and end in exactly 1885.** All 123 come from the
  Historical Basemaps import (`tools/import/basemaps.mjs`). 1885 is not a
  date that dataset records. It is where the import stopped extending the
  last snapshot it read: the records themselves say so, in the summary the
  import wrote on each one — *"the interval on this record is the span those
  snapshots cover … and not a claim about when this polity began or ended"*.
- **128 actors are active and begin in exactly 1886.** All 128 come from the
  CShapes 2.0 import (`tools/import/cshapes.mjs`). 1886 is where CShapes
  begins, full stop; every one of these records carries a `gwcode` locator
  and a summary saying it "asserts nothing the dataset does not".

**Neither boundary is a historical fact.** Both are where a file ends. The
atlas nonetheless currently asserts, of every same-polity pair among them,
that the thing ceased to exist in 1885 and a different thing appeared in
1886.

CShapes conflates in the other direction at the same time: `gwcode 365`
carries the Russian Empire, the Soviet Union and the Russian Federation under
the single label the owner saw, `russia-soviet-union`, 1886 to open.

## 2. How the pairs below were found, and what that is worth

The correspondence in section 4 is **generated from ids and names**, not
asserted. Two records are listed as a candidate pair when a normalised form
of one's id or names matches the other's — stripping `-before-1886` from the
basemaps side, `-under-<power>` from the CShapes side, and reading the
parenthetical alternates CShapes puts in a label (`Iran (Persia)` yields both
`iran` and `persia`).

That found **26 candidate pairs of the 123**. The brief expected "at least
39", and the gap is the point: **name matching is not the method, it is only
a way of ordering the work.** Three kinds of error are already visible in the
26, and a person will find more:

- **A false pair.** `harer-egypt` ("Harer (Egypt)", 1878–1885) matches
  `egypt-under-united-kingdom` on the token `egypt`. Harer is not Egypt. The
  row is kept in the table with this said against it rather than silently
  dropped, because a reader checking the table should see what the matching
  did.
- **One-to-many, which the matcher cannot express.**
  `bosnia-herzegovina-before-1886` (1878–1885) has two candidates on the 1886
  side, `bosnia` (gwcode 3461) and `herzegovina` (gwcode 3462). Its id
  normalises to `bosnia-herzegovina`, which neither carries, so it matched
  **neither** and sits in section 5 as though it had no counterpart. A pair
  that is really one-to-two is neither a join nor a simple split.
- **Unions, where the matcher is least entitled to an answer.**
  `sweden-norway` (1815–1885) and `sweden` (1886–open) share a token and are
  not thereby the same subject; the same goes for
  `united-kingdom-of-great-britain-and-ireland` (1815–1885) and
  `united-kingdom` (1886–open). Both are unmatched below. When a union began
  and when it ended *is* the historical question, and it is precisely the
  question a string comparison must not be allowed to settle.

The remaining **97 on the 1885 side** and **103 on the 1886 side** are listed
in full in sections 5 and 6. A record appearing there means only that no name
match was found — **not** that it has no counterpart. Reading the two lists
side by side, these obvious candidates the matcher missed are where a person
should start: `manchu-empire` / `china`, `imperial-japan` / `japan`,
`rattanakosin-kingdom` / `thailand`, `kingdom-of-brazil` / `brazil`,
`british-raj` / `british-india`, `romania` / `rumania`, `netherlands-indies` /
`dutch-east-indies`, `ceylon` / `sri-lanka-ceylon-under-united-kingdom`,
`bosnia-herzegovina-before-1886` / `bosnia` + `herzegovina`, and `malaya`
against the Malay entities (`perak`, `selangore`, `straits-settlements`,
`unfederated-malay-states`). Pairing any of them is still a judgement, and
the judgement is inseparable from the dates, so it waits with the rest.

## 3. Why no verdict was written, and what a person must do

The run of 16 September, on the branch `m49`, reached Wikidata this way and
failed:

```
$ curl -sS "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q34&format=json"
curl: (56) CONNECT tunnel failed, response 403
```

Every Wikimedia host behaves the same way from this sandbox —
`www.wikidata.org`, `query.wikidata.org`, `en.wikipedia.org`,
`commons.wikimedia.org` all refuse at the egress proxy with
`Host not in allowlist`. GitHub hosts answer normally, which is why the
repository's own tooling works and this document could be written at all.
The brief's amendment A3 states that "Wikidata is reachable from the cloud
sandbox"; **for this environment that is not true**, and A3 is the assumption
that has to be revisited rather than worked around.

Nothing on disk substitutes for it. `data/imports/wikidata-seeds.json` is a
list of 703 QIDs and carries no claims; `tools/import/cache/` holds Wikipedia
lead paragraphs only; no actor record in `data/actors/` carries a `wikidata`
field at all — **0 of the 123 and 0 of the 128**. So there is no cached P571
or P576 anywhere in the repository to read.

**One of these unblocks the milestone.** They are listed in the order that
costs the owner least:

1. **Allow the Wikimedia hosts in the environment's network policy** —
   `www.wikidata.org` and `query.wikidata.org` are enough. The next scheduled
   fire then answers the table itself, with no other change.
2. **Fetch the dates on a GitHub runner**, where Wikidata is reachable, and
   commit the answers. `.github/workflows/import-wikidata.yml` already runs
   `tools/import/wikidata.mjs` against the live service on a push to an
   `import/**` branch, under the protocol's amendment of 4 September. It has
   no mode that fetches P571/P576 for a given list, so this costs a small new
   mode — **which the brief's "no new import" forbids a run to write on its
   own initiative**, and so needs the owner to say yes.
3. **Answer the pairs by hand**, in this file, in the `verdict` column. The
   tables below are laid out so that a person can do it a row at a time, and
   a partly-answered file is worth having: whatever is filled in, the next
   run carries out, and leaves the rest.

Until one of those happens, **no record is changed**. The joins, the splits,
the successions and Russia all wait on dates, and a seam left honest is
better than a seam closed by guesswork.

## 4. The 26 candidate pairs

The `verdict` for every row is **open — awaiting Wikidata**. What has to be
asked of Wikidata is the same three questions each time: the QID of the
1885-side subject, the QID of the 1886-side subject, and whether P571/P576 on
those items put an end between them. If they are one subject, the two records
are **joined** — one record spanning both periods, the other merged with
`supersededBy`, every presence and reference moved, and **no** succession
relation, because nothing succeeded anything. If they are two, they are
**split** — true dates, a `succeeded` relation in `data/relations/` of the
shape `brunei-under-united-kingdom--brunei--succeeded.json`, and each presence
assigned to whoever held that ground then.


| 1885-side id | name | span | 1886-side id | name | span | CShapes locator | verdict |
|---|---|---|---|---|---|---|---|
| `algeria-fr` | Algeria (FR) | 1878–1885 | `algeria-under-france` | Algeria under France | 1886–1962 | gwcode 615 | open — awaiting Wikidata |
| `angola-portugal` | Angola (Portugal) | 1878–1885 | `angola-under-portugal` | Angola under Portugal | 1886–1975 | gwcode 540 | open — awaiting Wikidata |
| `annam` | Annam | 1815–1885 | `vietnam-annam-cochin-china-tonkin` | Vietnam (Annam/Cochin China/Tonkin) | 1886–1954 | gwcode 815 | open — awaiting Wikidata |
| `belize-before-1886` | Belize | 1650–1885 | `belize-under-united-kingdom` | Belize under United Kingdom | 1886–1981 | gwcode 80 | open — awaiting Wikidata |
| `bhutan-before-1886` | Bhutan | 1650–1885 | `bhutan-under-united-kingdom` | Bhutan under United Kingdom | 1886–1948 | gwcode 760 | open — awaiting Wikidata |
| `congo-before-1886` | Congo | 1492–1885 | `congo-under-france` | Congo under France | 1886–1960 | gwcode 484 | open — awaiting Wikidata |
| `egypt-before-1886` | Egypt | 1715–1885 | `egypt-under-united-kingdom` | Egypt under United Kingdom | 1886–1922 | gwcode 651 | open — awaiting Wikidata |
| `fiji-before-1886` | Fiji | 1878–1885 | `fiji-under-united-kingdom` | Fiji under United Kingdom | 1886–1970 | gwcode 950 | open — awaiting Wikidata |
| `gabon-before-1886` | Gabon | 1878–1885 | `gabon-under-france` | Gabon under France | 1886–1960 | gwcode 481 | open — awaiting Wikidata |
| `germany` | Germany | 1878–1885 | `germany-prussia` | Germany (Prussia) | 1886–1945 | gwcode 255 | open — awaiting Wikidata |
| `harer-egypt` | Harer (Egypt) | 1878–1885 | `egypt-under-united-kingdom` | Egypt under United Kingdom | 1886–1922 | gwcode 651 | open — awaiting Wikidata |
| `iceland-before-1886` | Iceland | 1878–1885 | `iceland-under-denmark` | Iceland under Denmark | 1886–1942 | gwcode 395 | open — awaiting Wikidata |
| `italy` | Italy | 1878–1885 | `italy-sardinia` | Italy/Sardinia | 1886–open | gwcode 325 | open — awaiting Wikidata |
| `madagascar` | Madagascar | 1400–1885 | `madagascar-malagasy` | Madagascar (Malagasy) | 1886–open | gwcode 580 | open — awaiting Wikidata |
| `malta-before-1886` | Malta | 1878–1885 | `malta-under-united-kingdom` | Malta under United Kingdom | 1886–1964 | gwcode 338 | open — awaiting Wikidata |
| `mozambique-before-1886` | Mozambique | 1878–1885 | `mozambique-under-portugal` | Mozambique under Portugal | 1886–1975 | gwcode 541 | open — awaiting Wikidata |
| `new-south-wales-uk` | New South Wales (UK) | 1878–1885 | `new-south-wales` | New South Wales | 1886–1900 | gwcode 901 | open — awaiting Wikidata |
| `ottoman-empire` | Ottoman Empire | 1400–1885 | `turkey-ottoman-empire` | Turkey (Ottoman Empire) | 1886–open | gwcode 640 | open — awaiting Wikidata |
| `persia` | Persia | 1783–1885 | `iran-persia` | Iran (Persia) | 1886–open | gwcode 630 | open — awaiting Wikidata |
| `philippines-before-1886` | Philippines | 1492–1885 | `philippines-under-united-states-of-america` | Philippines under United States of America | 1886–1946 | gwcode 840 | open — awaiting Wikidata |
| `queensland-uk` | Queensland (UK) | 1878–1885 | `queensland` | Queensland | 1886–1900 | gwcode 905 | open — awaiting Wikidata |
| `senegal-fr` | Senegal (FR) | 1878–1885 | `senegal-under-france` | Senegal under France | 1886–1959 | gwcode 433 | open — awaiting Wikidata |
| `sierra-leone-before-1886` | Sierra Leone | 1815–1885 | `sierra-leone-under-united-kingdom` | Sierra Leone under United Kingdom | 1886–1961 | gwcode 451 | open — awaiting Wikidata |
| `south-australia-uk` | South Australia (UK) | 1878–1885 | `south-australia` | South Australia | 1886–1900 | gwcode 903 | open — awaiting Wikidata |
| `victoria-uk` | Victoria (UK) | 1878–1885 | `victoria` | Victoria | 1886–1900 | gwcode 904 | open — awaiting Wikidata |
| `western-australia-uk` | Western Australia (UK) | 1878–1885 | `western-australia` | Western Australia | 1886–1900 | gwcode 902 | open — awaiting Wikidata |
`harer-egypt` is the false pair named in section 2; it is listed because the
matcher produced it, not because it is one.

## 5. The 97 on the 1885 side with no name match

All are Historical Basemaps records. The last column is what
`data/imports/basemaps-actors.json` already recorded about the id when M43
wrote it — the repository's own note, quoted, not a new judgement. Where it
reads that "whether they are one polity is a historical judgement nobody here
has made", that is the same judgement this milestone is waiting on.

| id | name | span | the name the source draws | what `basemaps-actors.json` recorded |
|---|---|---|---|---|
| `american-samoa` | American Samoa | 1878–1885 | — | — |
| `antigua-and-barbuda` | Antigua and Barbuda | 1715–1885 | — | — |
| `arabia` | Arabia | 1878–1885 | — | — |
| `asante` | Asante | 1715–1885 | — | — |
| `ato-trading-confederacy` | Ato trading confederacy | 1878–1885 | — | — |
| `barotse` | Barotse | 1878–1885 | — | — |
| `basutoland` | Basutoland | 1878–1885 | — | — |
| `benin-before-1886` | Benin | 1400–1885 | Benin | data/actors/benin.json carries this name and is a different question: it runs from 1960, and this source draws the name in 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1878, 1880. Whether they are one polity is a historical judgement nobody he |
| `bokhara-khanate` | Bokhara Khanate | 1878–1885 | — | — |
| `borgu-states` | Borgu States | 1878–1885 | — | — |
| `bosnia-herzegovina-before-1886` | Bosnia-Herzegovina | 1878–1885 | Bosnia-Herzegovina | data/actors/bosnia-herzegovina.json carries this name and is a different question: it runs from 1992, and this source draws the name in 1878, 1880. Whether they are one polity is a historical judgement nobody here has made, so they are two  |
| `british-guiana` | British Guiana | 1783–1885 | — | — |
| `british-raj` | British Raj | 1878–1885 | — | — |
| `brunei-before-1886` | Brunei | 1650–1885 | Brunei | data/actors/brunei.json carries this name and is a different question: it runs from 1984, and this source draws the name in 1650, 1700, 1715, 1783, 1800, 1815, 1878, 1880. Whether they are one polity is a historical judgement nobody here ha |
| `buganda` | Buganda | 1815–1885 | — | — |
| `bunyoro` | Bunyoro | 1815–1885 | — | — |
| `burundi-before-1886` | Burundi | 1815–1885 | Burundi | data/actors/burundi.json carries this name and is a different question: it runs from 1962, and this source draws the name in 1815, 1878, 1880. Whether they are one polity is a historical judgement nobody here has made, so they are two recor |
| `calabar` | Calabar | 1878–1885 | — | — |
| `central-asian-khanates` | central Asian khanates | 1530–1885 | — | — |
| `ceylon` | Ceylon | 1650–1885 | — | — |
| `cotonou` | Cotonou | 1878–1885 | — | — |
| `dahomey` | Dahomey | 1783–1885 | — | — |
| `dendi-kingdom` | Dendi Kingdom | 1878–1885 | — | — |
| `dominica` | Dominica | 1715–1885 | — | — |
| `dutch-guiana` | Dutch Guiana | 1878–1885 | — | — |
| `french-guiana` | French Guiana | 1878–1885 | — | — |
| `french-indochina` | French Indochina | 1878–1885 | — | — |
| `futa-jalon` | Futa Jalon | 1878–1885 | — | — |
| `futa-toro` | Futa Toro | 1878–1885 | — | — |
| `gambia-before-1886` | Gambia | 1878–1885 | Gambia | data/actors/gambia.json carries this name and is a different question: it runs from 1965, and this source draws the name in 1878, 1880. Whether they are one polity is a historical judgement nobody here has made, so they are two records unti |
| `gold-coast-gb` | Gold Coast (GB) | 1878–1885 | — | — |
| `greenland` | Greenland | 1878–1885 | — | — |
| `griqualand-west` | Griqualand West | 1878–1885 | — | — |
| `hong-kong` | Hong Kong | 1650–1885 | — | — |
| `ibadan` | Ibadan | 1878–1885 | — | — |
| `imerina` | Imerina | 1878–1885 | — | — |
| `imperial-japan` | Imperial Japan | 1878–1885 | — | — |
| `ivory-coast` | Ivory Coast | 1878–1885 | — | — |
| `kanem-bornu` | Kanem-Bornu | 1400–1885 | — | — |
| `kingdom-of-brazil` | Kingdom of Brazil | 1878–1885 | — | — |
| `kingdom-of-hawaii` | Kingdom of Hawaii | 1815–1885 | — | — |
| `kong-empire` | Kong Empire | 1783–1885 | — | — |
| `kuba` | Kuba | 1878–1885 | — | — |
| `lozi` | Lozi | 1783–1885 | — | — |
| `luba` | Luba | 1530–1885 | — | — |
| `lunda` | Lunda | 1530–1885 | — | — |
| `malaya` | Malaya | 1650–1885 | — | — |
| `manchu-empire` | Manchu Empire | 1650–1885 | — | — |
| `maori` | Maori | 1400–1885 | Maori | One name under 2 spellings, drawn in different snapshots over the same ground (166E to 179E, 47S to 35S). Merged on that evidence; the folding would have merged them anyway and this makes it a decision. |
| `mbailundu` | Mbailundu | 1878–1885 | — | — |
| `mirambo-unyanyembe-ukimbu` | Mirambo Unyanyembe Ukimbu | 1878–1885 | — | — |
| `montserrat` | Montserrat | 1715–1885 | — | — |
| `mossi-states` | Mossi States | 1492–1885 | — | — |
| `ndebele` | Ndebele | 1878–1885 | — | — |
| `netherlands-antilles` | Netherlands Antilles | 1715–1885 | — | — |
| `netherlands-indies` | Netherlands Indies | 1878–1885 | — | — |
| `nguni` | Nguni | 1878–1885 | — | — |
| `ngwato` | Ngwato | 1878–1885 | — | — |
| `niue` | Niue | 1878–1885 | — | — |
| `northern-territory-uk` | Northern Territory (UK) | 1878–1885 | — | — |
| `opobo` | Opobo | 1878–1885 | — | — |
| `ovimbundu` | Ovimbundu | 1878–1885 | — | — |
| `oyo` | Oyo | 1492–1885 | — | — |
| `papua-new-guinea-before-1886` | Papua New Guinea | 1492–1885 | Papua New Guinea | data/actors/papua-new-guinea.json carries this name and is a different question: it runs from 1975, and this source draws the name in 1492, 1500, 1715, 1783, 1800, 1878, 1880. Whether they are one polity is a historical judgement nobody her |
| `polynesians` | Polynesians | 1400–1885 | — | — |
| `portuguese-guinea` | Portuguese Guinea | 1650–1885 | — | — |
| `qatar-before-1886` | Qatar | 1878–1885 | Qatar | data/actors/qatar.json carries this name and is a different question: it runs from 1971, and this source draws the name in 1878, 1880. Whether they are one polity is a historical judgement nobody here has made, so they are two records until |
| `rabih-az-zubayr` | Rabih az-Zubayr | 1878–1885 | — | — |
| `rattanakosin-kingdom` | Rattanakosin Kingdom | 1783–1885 | — | — |
| `romania` | Romania | 1878–1885 | — | — |
| `russian-empire` | Russian Empire | 1783–1885 | — | — |
| `rwanda-before-1886` | Rwanda | 1815–1885 | Rwanda | data/actors/rwanda.json carries this name and is a different question: it runs from 1962, and this source draws the name in 1815, 1878, 1880. Whether they are one polity is a historical judgement nobody here has made, so they are two record |
| `saint-barthelemy` | Saint Barthelemy | 1715–1885 | — | — |
| `saint-kitts-and-nevis` | Saint Kitts and Nevis | 1815–1885 | — | — |
| `saint-martin` | Saint Martin | 1715–1885 | — | — |
| `samoa` | Samoa | 1878–1885 | — | — |
| `shona` | Shona | 1878–1885 | — | — |
| `sokoto-caliphate` | Sokoto Caliphate | 1878–1885 | — | — |
| `spanish-guinea` | Spanish Guinea | 1878–1885 | — | — |
| `sultanate-of-damagaram` | Sultanate of Damagaram | 1878–1885 | — | — |
| `sultanate-of-utetera` | Sultanate of Utetera | 1878–1885 | — | — |
| `sultanate-of-zanzibar` | Sultanate of Zanzibar | 1880–1885 | — | — |
| `swaziland` | Swaziland | 1878–1885 | — | — |
| `sweden-norway` | Sweden–Norway | 1815–1885 | — | — |
| `taiwan-before-1886` | Taiwan | 1492–1885 | Taiwan | data/actors/taiwan.json carries this name and is a different question: it runs from 1949, and this source draws the name in 1492, 1500, 1878, 1880. Whether they are one polity is a historical judgement nobody here has made, so they are two  |
| `teke` | Teke | 1878–1885 | — | — |
| `tonga` | Tonga | 1878–1885 | — | — |
| `trucial-oman` | Trucial Oman | 1878–1885 | — | — |
| `tukular-caliphate` | Tukular Caliphate | 1878–1885 | — | — |
| `united-kingdom-of-great-britain-and-ireland` | United Kingdom of Great Britain and Ireland | 1815–1885 | — | — |
| `united-states-virgin-islands` | United States Virgin Islands | 1878–1885 | — | — |
| `wadai-empire` | Wadai Empire | 1878–1885 | — | — |
| `wallis-and-futuna-islands` | Wallis and Futuna Islands | 1878–1885 | — | — |
| `wassoulou-empire` | Wassoulou Empire | 1878–1885 | — | — |
| `yaka` | Yaka | 1878–1885 | — | — |
| `yeke` | Yeke | 1878–1885 | — | — |
| `zululand` | Zululand | 1878–1885 | — | — |
## 6. The 103 on the 1886 side with no name match

All are CShapes 2.0 records, each beginning in 1886 because that is where the
dataset begins.

| id | name | span | CShapes locator |
|---|---|---|---|
| `afghanistan` | Afghanistan | 1886–open | gwcode 700 |
| `alaska` | Alaska | 1886–1959 | gwcode 3 |
| `argentina` | Argentina | 1886–open | gwcode 160 |
| `austria-hungary` | Austria-Hungary | 1886–1918 | gwcode 300 |
| `bahamas-under-united-kingdom` | Bahamas under United Kingdom | 1886–1973 | gwcode 31 |
| `barbados-under-united-kingdom` | Barbados under United Kingdom | 1886–1966 | gwcode 53 |
| `belgium` | Belgium | 1886–open | gwcode 211 |
| `bokhara` | Bokhara | 1886–1920 | gwcode 7020 |
| `bolivia` | Bolivia | 1886–open | gwcode 145 |
| `bosnia` | Bosnia | 1886–1908 | gwcode 3461 |
| `botswana-under-united-kingdom` | Botswana under United Kingdom | 1886–1966 | gwcode 571 |
| `brazil` | Brazil | 1886–open | gwcode 140 |
| `british-bechuanaland` | British Bechuanaland | 1886–1895 | gwcode 5612 |
| `british-india` | British India | 1886–1947 | gwcode 750 |
| `british-somaliland-somaliland-republic` | British Somaliland (Somaliland Republic) | 1886–1960 | gwcode 521 |
| `bulgaria` | Bulgaria | 1886–open | gwcode 355 |
| `cambodia-kampuchea-under-france` | Cambodia (Kampuchea) under France | 1886–1953 | gwcode 811 |
| `canada` | Canada | 1886–open | gwcode 20 |
| `cape-colony` | Cape Colony | 1886–1910 | gwcode 561 |
| `cape-verde-under-portugal` | Cape Verde under Portugal | 1886–1975 | gwcode 402 |
| `chile` | Chile | 1886–open | gwcode 155 |
| `china` | China | 1886–open | gwcode 710 |
| `colombia` | Colombia | 1886–open | gwcode 100 |
| `congo-democratic-republic-of-zaire-under-belgium` | Congo, Democratic Republic of (Zaire) under Belgium | 1886–1960 | gwcode 490 |
| `costa-rica` | Costa Rica | 1886–open | gwcode 94 |
| `cuba-under-spain` | Cuba under Spain | 1886–1898 | gwcode 40 |
| `denmark` | Denmark | 1886–open | gwcode 390 |
| `djibouti-under-france` | Djibouti under France | 1886–1977 | gwcode 522 |
| `dominican-republic` | Dominican Republic | 1886–open | gwcode 42 |
| `dutch-east-indies` | Dutch East Indies | 1886–1945 | gwcode 850 |
| `east-timor-under-portugal` | East Timor under Portugal | 1886–1976 | gwcode 860 |
| `ecuador` | Ecuador | 1886–open | gwcode 130 |
| `el-salvador` | El Salvador | 1886–open | gwcode 92 |
| `equatorial-guinea-under-spain` | Equatorial Guinea under Spain | 1886–1968 | gwcode 411 |
| `eritrea-under-italy-sardinia` | Eritrea under Italy/Sardinia | 1886–1941 | gwcode 531 |
| `ethiopia` | Ethiopia | 1886–open | gwcode 530 |
| `france` | France | 1886–open | gwcode 220 |
| `french-guyana` | French Guyana | 1886–open | gwcode 120 |
| `german-solomon-islands` | German Solomon Islands | 1886–1899 | gwcode 9401 |
| `german-togoland` | German Togoland | 1886–1922 | gwcode 460 |
| `ghana-under-united-kingdom` | Ghana under United Kingdom | 1886–1957 | gwcode 452 |
| `greece` | Greece | 1886–open | gwcode 350 |
| `guadeloupe` | Guadeloupe | 1886–open | gwcode 65 |
| `guatemala` | Guatemala | 1886–open | gwcode 90 |
| `guinea-bissau-under-portugal` | Guinea-Bissau under Portugal | 1886–1974 | gwcode 404 |
| `guyana-under-united-kingdom` | Guyana under United Kingdom | 1886–1966 | gwcode 110 |
| `haiti` | Haiti | 1886–open | gwcode 41 |
| `herzegovina` | Herzegovina | 1886–1908 | gwcode 3462 |
| `honduras` | Honduras | 1886–open | gwcode 91 |
| `jamaica-under-united-kingdom` | Jamaica under United Kingdom | 1886–1962 | gwcode 51 |
| `japan` | Japan | 1886–open | gwcode 740 |
| `kamerun` | Kamerun | 1886–1919 | gwcode 470 |
| `khiva` | Khiva | 1886–1920 | gwcode 7030 |
| `korea` | Korea | 1886–1945 | gwcode 730 |
| `lagos` | Lagos | 1886–1906 | gwcode 4781 |
| `lesotho-under-united-kingdom` | Lesotho under United Kingdom | 1886–1966 | gwcode 570 |
| `liberia` | Liberia | 1886–open | gwcode 450 |
| `luxembourg` | Luxembourg | 1886–open | gwcode 212 |
| `martinique` | Martinique | 1886–open | gwcode 66 |
| `mauritius-under-united-kingdom` | Mauritius under United Kingdom | 1886–1968 | gwcode 590 |
| `mexico` | Mexico | 1886–open | gwcode 70 |
| `montenegro` | Montenegro | 1886–open | gwcode 341 |
| `morocco` | Morocco | 1886–open | gwcode 600 |
| `namibia-under-south-africa` | Namibia under South Africa | 1886–1990 | gwcode 565 |
| `natal` | Natal | 1886–1910 | gwcode 562 |
| `nepal` | Nepal | 1886–open | gwcode 790 |
| `netherlands` | Netherlands | 1886–open | gwcode 210 |
| `new-caledonia-and-dependencies` | New Caledonia and Dependencies | 1886–open | gwcode 930 |
| `new-guinea-german-new-guinea-kaiser-wilhelmsland` | New Guinea (German New Guinea) (Kaiser Wilhelmsland) | 1886–1949 | gwcode 912 |
| `new-zealand-under-united-kingdom` | New Zealand under United Kingdom | 1886–1907 | gwcode 920 |
| `newfoundland` | Newfoundland | 1886–1948 | gwcode 21 |
| `nicaragua` | Nicaragua | 1886–open | gwcode 93 |
| `oil-rivers-protectorate` | Oil Rivers Protectorate | 1886–1898 | gwcode 4782 |
| `oman` | Oman | 1886–open | gwcode 698 |
| `orange-free-state` | Orange Free State | 1886–1910 | gwcode 564 |
| `papua` | Papua | 1886–1949 | gwcode 911 |
| `paraguay` | Paraguay | 1886–open | gwcode 150 |
| `perak` | Perak | 1886–1896 | gwcode 8201 |
| `peru` | Peru | 1886–open | gwcode 135 |
| `portugal` | Portugal | 1886–open | gwcode 235 |
| `puerto-rico` | Puerto Rico | 1886–open | gwcode 6 |
| `reunion` | Reunion | 1886–open | gwcode 585 |
| `rumania` | Rumania | 1886–open | gwcode 360 |
| `russia-soviet-union` | Russia (Soviet Union) | 1886–open | gwcode 365 |
| `selangore` | Selangore | 1886–1896 | gwcode 8202 |
| `serbia` | Serbia | 1886–open | gwcode 340 |
| `spain` | Spain | 1886–open | gwcode 230 |
| `spanish-west-africa` | Spanish West Africa | 1886–1958 | gwcode 610 |
| `sri-lanka-ceylon-under-united-kingdom` | Sri Lanka (Ceylon) under United Kingdom | 1886–1948 | gwcode 780 |
| `straits-settlements` | Straits Settlements | 1886–1946 | gwcode 827 |
| `surinam-under-netherlands` | Surinam under Netherlands | 1886–1975 | gwcode 115 |
| `sweden` | Sweden | 1886–open | gwcode 380 |
| `switzerland` | Switzerland | 1886–open | gwcode 225 |
| `tasmania` | Tasmania | 1886–1900 | gwcode 906 |
| `thailand` | Thailand | 1886–open | gwcode 800 |
| `transvaal` | Transvaal | 1886–1910 | gwcode 563 |
| `trinidad-and-tobago-under-united-kingdom` | Trinidad and Tobago under United Kingdom | 1886–1962 | gwcode 52 |
| `tunisia-under-france` | Tunisia under France | 1886–1955 | gwcode 616 |
| `unfederated-malay-states` | Unfederated Malay States | 1886–1946 | gwcode 822 |
| `united-kingdom` | United Kingdom | 1886–open | gwcode 200 |
| `united-states-of-america` | United States of America | 1886–open | gwcode 2 |
| `uruguay` | Uruguay | 1886–open | gwcode 165 |
| `venezuela` | Venezuela | 1886–open | gwcode 101 |
## 7. Russia, which is the owner's example

The chip the owner saw is `data/actors/russia-soviet-union.json`: one record,
`names[0]` = "Russia (Soviet Union)", `when` 1886 to open, sourced to
`gwcode 365`, summary "Entity 365 in the Gleditsch–Ward state list … 24
periods of territorial validity, from 1886 to where the dataset stops, in
2019". Beside it sits `data/actors/russian-empire.json`, from Basemaps,
1783–1885.

What the brief asks for is three actors and two successions: the Empire, the
Soviet Union and the Federation, with the territory divided between them and
the presences moved. **Three of the four dates that needs are historical
claims**, and the two successions are dated events in their own right. Not one
of them may come from the assistant, and Wikidata is the only source the brief
allows. So Russia is where this milestone would have started changing records,
and it is the clearest illustration of why it stopped instead.

The 24 territorial periods on `gwcode 365` are on disk and do not need
Wikidata; they are what the presences will be divided along once the two
boundary dates are known.

## 8. What the next run should do

1. Re-test egress first — one `curl` to `https://www.wikidata.org/w/api.php`.
   If it answers, the blocker is gone: fill in section 4 row by row, commit in
   batches, and carry on into the joins.
2. If it still refuses, **do not start over and do not widen the matching into
   a judgement**. Check whether a person has filled in verdicts here; carry out
   whatever is filled in and leave the rest.
3. Do not touch a record while the verdict column reads "open". Rule 11 makes
   a half-done join a hard error, and there is no deadline here worth that.

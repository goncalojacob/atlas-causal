# M49 — the actors at the 1885/1886 seam

The owner, 16 September, on seeing a chip reading **"Russia (Soviet Union)"**:

> **"they should be taken as different actors because effectively Soviet Union
> stopped being Soviet Union and went to being Russia"**

This file is the survey that milestone was told to write before it changed a
single record: every actor at the seam, both ids, both spans, and the verdict.

**Every verdict in this file is now answered, and all 26 read "for a
person".** That is the finding, not a failure to reach one. Wikidata was
asked — on a GitHub runner, where it answers — about all 83 subjects in
`docs/m49-subjects.txt`, and the replies are in `docs/m49-dates.md`, cited
item by item. What they show is that **the question cannot be settled by
asking Wikidata about the names these two datasets use.** Section 3 says
exactly why, and section 4a writes out, pair by pair, what a person has to
decide.

No date in this file is supplied from anywhere else. That is not caution,
it is the rule: `CLAUDE.md` forbids the assistant writing historical claims,
and the brief repeats it as "**no invented date, ever — the whole milestone
turns on this**".

So what follows is what can be said without asserting anything: what each
dataset says, where the two meet, what Wikidata answered when asked, and what
is left for a person.

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

## 3. What Wikidata answered, and why it does not settle the seam

The blocker the run of 16 September recorded is gone. Wikidata is still
refused at the scheduled run's egress proxy — `www.wikidata.org`,
`query.wikidata.org` and `en.wikipedia.org` all return
`CONNECT tunnel failed, response 403`, body `Host not in allowlist`, re-checked
this day (deviation 741) — but the lookup no longer runs there. Brief
amendment A4 authorises the route the survey listed second: a `--dates` mode on
`tools/import/wikidata.mjs`, run by `.github/workflows/import-wikidata.yml` on
a push to `import/dates-…`, **on a GitHub runner, where Wikidata answers**. It
is a lookup and not an import: it creates no record, keeps no cursor and writes
nothing under `data/`.

It ran. **83 subjects asked, 199 calls, 41 matched to exactly one item, 40 of
those carrying a P571.** Everything it saw is in `docs/m49-dates.md`, including
every item it threw out and why.

And the answers do not settle the seam. Three things came back, and each is a
finding in its own right.

**1. The names in these two datasets resolve to the modern states, whose
inception is independence.** Thirteen of the 26 pairs matched — cleanly, the
same single item from both sides — and in every one of them that item is the
country as it exists now, dated from when it became sovereign:
`Q262` Algeria P571 1962, `Q916` Angola 1975, `Q242` Belize 1981, `Q971` Congo
1960, `Q712` Fiji 1970, `Q1000` Gabon 1960, `Q1019` Madagascar 1960, `Q233`
Malta 1964, `Q1029` Mozambique 1975, `Q1041` Senegal 1960, `Q917` Bhutan 1907,
`Q189` Iceland 1918. The thirteenth, `Q928` Philippines, is no better for a
different reason: it carries **four** competing P571 values (1565, 1901-07-04,
1935-11-15, 1946-07-04), which is a disagreement and not a date.

**Not one of those twelve inceptions is before 1885**, so not one
of them can say what stood on that ground in 1885, or whether it stopped. An
item whose life begins after the seam is evidence that the item is *not* the
polity either record describes — a colony in 1878 and a colony in 1886 are not
the sovereign state that replaced them. Reading "same name, no P576" as a join
would assert that colonial Algeria and the Algerian Republic are one continuous
actor from 1878 to today; the same reasoning would join the Russian Empire to
the Russian Federation, which is the exact mistake the owner asked to have
undone.

**2. Where the seam records name a polity of their own period, the match is
ambiguous — and the tool refused to break the tie.** `iran-persia` survived
`Q794` (Iran) and `Q63158027` (Qajar Iran); `turkey-ottoman-empire` survived
`Q43` and `Q12560`; `germany-prussia` survived `Q183`, `Q38872` and `Q27306`;
`egypt-before-1886` and `egypt-under-united-kingdom` both survived `Q79` and
`Q127861`. Two items surviving is not an answer that needs sharpening, it is
the historical question itself — is the 1886 record the empire or the republic
that followed it — and a string comparison must not be allowed to settle it.

**3. Four dates did come back, whole and cited, and every one of them
contradicts the seam rather than confirming it.**

| subject | item | P571 | P576 |
|---|---|---|---|
| `ottoman-empire` | [`Q12560`](https://www.wikidata.org/wiki/Q12560) Ottoman Empire | 1299-07-29 / 1300 / 1302-07-27 | **1922-11-17** |
| `persia` | [`Q63158027`](https://www.wikidata.org/wiki/Q63158027) Qajar Iran | **1789** | **1925** |
| `russian-empire` | [`Q34266`](https://www.wikidata.org/wiki/Q34266) Russian Empire | **1721-10-22** | **1917-09-01** |
| `imperial-japan` | [`Q188712`](https://www.wikidata.org/wiki/Q188712) Empire of Japan | **1868-01-03** | **1947-05-03** |

Each of those four polities began before 1885 and ended well after 1886. The
records for them stop at 1885 because the Historical Basemaps import stopped
extending its last snapshot, and nothing on the 1886 side picks any of them up
under its own name. So these are the four places where the atlas is most
plainly wrong — and still not places this run may act, because the record on
the 1886 side that would receive the ground did not resolve to an item, so
there is no evidence about *which* actor holds 1886 onward.

**What a person has to supply is not a date; it is a subject.** The two
datasets name "Algeria", "Egypt", "Turkey (Ottoman Empire)". The items that
would settle the seam are the polities of that period — French Algeria, the
Khedivate, the Empire as distinct from the Republic — and **those names are
nowhere in this repository**, so nothing here may search for them: `--dates`
refuses an alternate the record does not carry, by design, so that a run cannot
introduce a name from nowhere and call the answer evidence. Add them to a
record's `names`, or write the QID pair into section 4a by hand, and the next
fire answers the rest without asking anything else.

Until then, **no record is changed**. The joins, the splits, the successions
and Russia all wait on that, and a seam left honest is better than a seam
closed by guesswork.

## 4. The 26 candidate pairs

Wikidata has now been asked about every row, and **the `verdict` for every one
of the 26 is "for a person"** — with, in each cell, the item or items the
lookup saw and the property the verdict rests on. Section 4a sorts them into
the four kinds of question they actually are, and section 3 says why none of
them came out otherwise.

The three questions put to Wikidata were the same each time: the QID of the
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
| `algeria-fr` | Algeria (FR) | 1878–1885 | `algeria-under-france` | Algeria under France | 1886–1962 | gwcode 615 | for a person — both ids → [`Q262`](https://www.wikidata.org/wiki/Q262), P571 1962-07-05 and 1962-07-03; the item is the modern state and its inception is after the seam |
| `angola-portugal` | Angola (Portugal) | 1878–1885 | `angola-under-portugal` | Angola under Portugal | 1886–1975 | gwcode 540 | for a person — both ids → [`Q916`](https://www.wikidata.org/wiki/Q916), P571 1975-11-11 and 1992-08-25; the item is the modern state and its inception is after the seam |
| `annam` | Annam | 1815–1885 | `vietnam-annam-cochin-china-tonkin` | Vietnam (Annam/Cochin China/Tonkin) | 1886–1954 | gwcode 815 | for a person — `annam` survived 3 items (`Q430309`, `Q1034173`, `Q10841085`) and `vietnam-annam-cochin-china-tonkin` 4; neither came down to one |
| `belize-before-1886` | Belize | 1650–1885 | `belize-under-united-kingdom` | Belize under United Kingdom | 1886–1981 | gwcode 80 | for a person — both ids → [`Q242`](https://www.wikidata.org/wiki/Q242), P571 1981-09-21; the item is the modern state and its inception is after the seam |
| `bhutan-before-1886` | Bhutan | 1650–1885 | `bhutan-under-united-kingdom` | Bhutan under United Kingdom | 1886–1948 | gwcode 760 | for a person — both ids → [`Q917`](https://www.wikidata.org/wiki/Q917), P571 1907-12-17 and 1949-08-08; both are after the seam |
| `congo-before-1886` | Congo | 1492–1885 | `congo-under-france` | Congo under France | 1886–1960 | gwcode 484 | for a person — both ids → [`Q971`](https://www.wikidata.org/wiki/Q971) "Republic of the Congo", P571 1960; the item is the modern state and its inception is after the seam |
| `egypt-before-1886` | Egypt | 1715–1885 | `egypt-under-united-kingdom` | Egypt under United Kingdom | 1886–1922 | gwcode 651 | for a person — both ids survived 2 items, `Q79` and `Q127861`; neither side came down to one |
| `fiji-before-1886` | Fiji | 1878–1885 | `fiji-under-united-kingdom` | Fiji under United Kingdom | 1886–1970 | gwcode 950 | for a person — both ids → [`Q712`](https://www.wikidata.org/wiki/Q712), P571 1970; the item is the modern state and its inception is after the seam |
| `gabon-before-1886` | Gabon | 1878–1885 | `gabon-under-france` | Gabon under France | 1886–1960 | gwcode 481 | for a person — both ids → [`Q1000`](https://www.wikidata.org/wiki/Q1000), P571 1960; the item is the modern state and its inception is after the seam |
| `germany` | Germany | 1878–1885 | `germany-prussia` | Germany (Prussia) | 1886–1945 | gwcode 255 | for a person — `germany` → [`Q183`](https://www.wikidata.org/wiki/Q183), which carries **seven** P571 values (800, 843 read as 641, 1867-07-01, 1871-01-01, 1918, 1933, 1949-05-23); `germany-prussia` survived 3 items (`Q183`, `Q38872`, `Q27306`) |
| `harer-egypt` | Harer (Egypt) | 1878–1885 | `egypt-under-united-kingdom` | Egypt under United Kingdom | 1886–1922 | gwcode 651 | for a person, and **not a pair** — the match is the false one §2 names; `harer-egypt` survived `Q79` and `Q127861` on the token "Egypt" alone |
| `iceland-before-1886` | Iceland | 1878–1885 | `iceland-under-denmark` | Iceland under Denmark | 1886–1942 | gwcode 395 | for a person — both ids → [`Q189`](https://www.wikidata.org/wiki/Q189), P571 1918-12-01 and 1944-06-17; both are after the seam |
| `italy` | Italy | 1878–1885 | `italy-sardinia` | Italy/Sardinia | 1886–open | gwcode 325 | for a person — `italy` survived 4 items (`Q38`, `Q172579`, `Q223936`, `Q838931`) and `italy-sardinia` none; the label "Italy/Sardinia" matches nothing on Wikidata |
| `madagascar` | Madagascar | 1400–1885 | `madagascar-malagasy` | Madagascar (Malagasy) | 1886–open | gwcode 580 | for a person — both ids → [`Q1019`](https://www.wikidata.org/wiki/Q1019), P571 1960; the item is the modern state and its inception is after the seam |
| `malta-before-1886` | Malta | 1878–1885 | `malta-under-united-kingdom` | Malta under United Kingdom | 1886–1964 | gwcode 338 | for a person — both ids → [`Q233`](https://www.wikidata.org/wiki/Q233), P571 1964-09-21; the item is the modern state and its inception is after the seam |
| `mozambique-before-1886` | Mozambique | 1878–1885 | `mozambique-under-portugal` | Mozambique under Portugal | 1886–1975 | gwcode 541 | for a person — both ids → [`Q1029`](https://www.wikidata.org/wiki/Q1029), P571 1975-06-25; the item is the modern state and its inception is after the seam |
| `new-south-wales-uk` | New South Wales (UK) | 1878–1885 | `new-south-wales` | New South Wales | 1886–1900 | gwcode 901 | for a person — **nothing** survived on either side; "New South Wales" returns no item the class table types as a polity |
| `ottoman-empire` | Ottoman Empire | 1400–1885 | `turkey-ottoman-empire` | Turkey (Ottoman Empire) | 1886–open | gwcode 640 | for a person — but the one date here is real: `ottoman-empire` → [`Q12560`](https://www.wikidata.org/wiki/Q12560), P571 1299-07-29/1300/1302-07-27, **P576 1922-11-17**. `turkey-ottoman-empire` survived `Q43` and `Q12560` and came down to neither |
| `persia` | Persia | 1783–1885 | `iran-persia` | Iran (Persia) | 1886–open | gwcode 630 | for a person — but the one date here is real: `persia` → [`Q63158027`](https://www.wikidata.org/wiki/Q63158027) "Qajar Iran", **P571 1789, P576 1925**. `iran-persia` survived `Q794` and `Q63158027` and came down to neither |
| `philippines-before-1886` | Philippines | 1492–1885 | `philippines-under-united-states-of-america` | Philippines under United States of America | 1886–1946 | gwcode 840 | for a person — both ids → [`Q928`](https://www.wikidata.org/wiki/Q928), which carries **four** P571 values (1565, 1901-07-04, 1935-11-15, 1946-07-04) and no P576 |
| `queensland-uk` | Queensland (UK) | 1878–1885 | `queensland` | Queensland | 1886–1900 | gwcode 905 | for a person — **nothing** survived on either side |
| `senegal-fr` | Senegal (FR) | 1878–1885 | `senegal-under-france` | Senegal under France | 1886–1959 | gwcode 433 | for a person — both ids → [`Q1041`](https://www.wikidata.org/wiki/Q1041), P571 1960; the item is the modern state and its inception is after the seam |
| `sierra-leone-before-1886` | Sierra Leone | 1815–1885 | `sierra-leone-under-united-kingdom` | Sierra Leone under United Kingdom | 1886–1961 | gwcode 451 | for a person — both ids survived 2 items, `Q1044` and `Q14920623`; neither side came down to one |
| `south-australia-uk` | South Australia (UK) | 1878–1885 | `south-australia` | South Australia | 1886–1900 | gwcode 903 | for a person — **nothing** survived on either side |
| `victoria-uk` | Victoria (UK) | 1878–1885 | `victoria` | Victoria | 1886–1900 | gwcode 904 | for a person — **nothing** survived on either side |
| `western-australia-uk` | Western Australia (UK) | 1878–1885 | `western-australia` | Western Australia | 1886–1900 | gwcode 902 | for a person — **nothing** survived on either side |
`harer-egypt` is the false pair named in section 2; it is listed because the
matcher produced it, not because it is one.

## 4a. The question, pair by pair

Every verdict above is "for a person". They are not all the same question, and
a person answering them one at a time should know which kind each is. Four
kinds, and what each needs.

**A — the item is the modern state (13 pairs):** `algeria`, `angola`, `belize`,
`bhutan`, `congo`, `fiji`, `gabon`, `iceland`, `madagascar`, `malta`,
`mozambique`, `philippines`, `senegal`.

> *The question:* which Wikidata item is the polity on each side — French
> Algeria rather than Algeria, the Colony of Fiji rather than Fiji? Both
> records matched the modern state, whose P571 is its independence, and an
> item that begins in 1962 says nothing about 1885. **What to write here** is
> the QID for the 1885-side subject and the QID for the 1886-side subject; if
> they are the same item and its P571 is before 1885 with no P576 before 1886,
> the pair is a **join**, and if they are two items whose P576 and P571 meet,
> it is a **split**. Adding the period name to the record's `names` is enough
> for `--dates` to find it on the next run, because the tool will only search
> for a name the record carries.

**B — two items survived and the tie is the history (7 pairs):** `annam` /
`vietnam-…`, `egypt-before-1886` / `egypt-under-united-kingdom`, `germany` /
`germany-prussia`, `italy` / `italy-sardinia`, `ottoman-empire` /
`turkey-ottoman-empire`, `persia` / `iran-persia`, and
`sierra-leone-before-1886` / `sierra-leone-under-united-kingdom`.

> *The question:* of the items the search returned, which one is this record?
> `iran-persia` survived `Q794` (Iran) and `Q63158027` (Qajar Iran); choosing
> between them *is* the decision of whether the 1886 record is the Qajar state
> or the modern one, and no string comparison may make it. **What to write
> here** is one QID per side. The candidates, with everything the tool threw
> out and why, are under each id in `docs/m49-dates.md`.

**C — nothing survived (5 pairs):** the Australian colonies,
`new-south-wales`, `queensland`, `south-australia`, `victoria` and
`western-australia`.

> *The question:* are these actors at all, in this atlas's sense? Nothing the
> search returned is typed as a polity by
> `data/imports/wikidata-seeds.json` → `classes`, which is the repository's own
> editorial table. Either they are subnational and the pair is a different kind
> of question, or the class table needs a class it does not have. **What to
> write here** is which, and that is an editorial decision, not a date.

**D — not a pair at all (1):** `harer-egypt` / `egypt-under-united-kingdom`.

> Section 2 named it as the matcher's false pair and the lookup agrees: the
> only reason the two ever met is the token "Egypt". **What to write here** is
> that it is struck, and what `harer-egypt` should be paired with instead, if
> anything.

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
the presences moved. The lookup was asked for all three — `russian-empire`,
and `russia-soviet-union` three times: as its label stands and once for each
of the two names that label itself contains. **Two of the three came back, and
the third did not.**

| subject | item | P571 inception | P576 dissolved |
|---|---|---|---|
| `russian-empire` | [`Q34266`](https://www.wikidata.org/wiki/Q34266) Russian Empire | **1721-10-22** (day) | **1917-09-01** (day) |
| `russia-soviet-union` narrowed to "Soviet Union" | [`Q15180`](https://www.wikidata.org/wiki/Q15180) Soviet Union | **1922-12-30** (day); 1923-07-06 (day) | **1991-12-26** (day) |
| `russia-soviet-union` narrowed to "Russia" | — | — | — |
| `russia-soviet-union` as it stands | — | — | — |

The Federation is the one that did not. Narrowed to "Russia" the search
survived two items, `Q159` and `Q34266`, and the tool refused to choose — which
is correct, because "Russia" names both the Federation and the Empire, and
picking is the judgement. Taken whole, "Russia (Soviet Union)" survived three,
`Q159`, `Q34266` and `Q15180`: that is the conflation the owner saw, shown from
the outside by a tool that has no way to resolve it either.

**So the split cannot be written, and here is exactly what is missing.**

- **The Federation has no QID and no P571 here.** Its `when.start` would have
  to come from somewhere, and the only candidate in hand is `Q15180`'s P576,
  1991-12-26 — the Union's dissolution, which is not the Federation's
  inception. Writing one as the other is an inference, and the brief's "no
  invented date, ever" outranks finishing.
- **The Empire's dates and the Union's do not meet.** `Q34266` ends 1917-09-01
  and `Q15180` begins 1922-12-30. Five years stand between them, and a
  `succeeded` relation whose two actors leave a gap is a claim about what held
  that ground — the fourth actor this milestone was not asked to invent. What
  a person decides here is whether the gap gets a record or the relation spans
  it.
- **`Q15180` carries two inceptions**, 1922-12-30 and 1923-07-06, which is the
  treaty and the constitution. One of them has to be chosen, and the choice is
  a person's.

What a person writes here is three QIDs and, for the middle one, which P571.
Then the presences follow mechanically: the 24 territorial periods on
`gwcode 365` are on disk, need no source, and are what the ground is divided
along once the boundary dates are settled.

## 8. What the lookup found beyond the 26

The subject list also asked about the pairs section 2 said a person should
start from. **None of them is a candidate pair and this run pairs none of
them** — the judgement stays where section 2 left it. They are recorded here
because a dated item beside an id is what a person needs in front of them.

| id | item | P571 | P576 |
|---|---|---|---|
| `imperial-japan` | [`Q188712`](https://www.wikidata.org/wiki/Q188712) Empire of Japan | 1868-01-03 | 1947-05-03 |
| `netherlands-indies` **and** `dutch-east-indies` | [`Q188161`](https://www.wikidata.org/wiki/Q188161) Dutch East Indies | 1800-01-01 | 1945-08-17; 1949-12-27 |
| `united-kingdom-of-great-britain-and-ireland` | [`Q174193`](https://www.wikidata.org/wiki/Q174193) | 1801-01-01 | 1927-04-12 |
| `ceylon` | [`Q2670092`](https://www.wikidata.org/wiki/Q2670092) Dominion of Ceylon | 1948-02-04 | 1972-05-22 |
| `thailand` | [`Q869`](https://www.wikidata.org/wiki/Q869) | 1768-12-28; 1238 | — |
| `brazil` | [`Q155`](https://www.wikidata.org/wiki/Q155) | 1822-09-07; 1549 | — |
| `rumania` | [`Q218`](https://www.wikidata.org/wiki/Q218) Romania | 1330 | — |
| `bosnia-herzegovina-before-1886` | [`Q225`](https://www.wikidata.org/wiki/Q225) | 1992-03-06 | — |
| `sweden` | [`Q34`](https://www.wikidata.org/wiki/Q34) | **none** | — |

`manchu-empire`, `china`, `japan`, `rattanakosin-kingdom`,
`kingdom-of-brazil`, `british-raj`, `british-india`, `romania`,
`sri-lanka-ceylon-under-united-kingdom`, `bosnia`, `herzegovina`,
`sweden-norway`, `united-kingdom`, `malaya`, `perak`, `selangore`,
`straits-settlements` and `unfederated-malay-states` all came back doubtful;
their candidates are in `docs/m49-dates.md`.

Two rows there are worth a person's eye before the rest. **`netherlands-indies`
and `dutch-east-indies` resolved, independently, to the same item, and that
item spans the seam**: P571 1800-01-01 is before 1885 and every P576 is after
1886. That is the one pair in all 83 subjects whose evidence points at a join
— and it is not one of the 26, its two P576 values disagree, and pairing it was
always listed as a judgement, so it waits for a person to say yes. **`sweden`
carries no P571 at all**, which is worth knowing before anyone asks Wikidata to
settle `sweden-norway`.

## 9. What the next run should do

The lookup is done and there is nothing left a run can ask. What remains needs
a person, and until it comes **no record is changed**.

1. **Read section 4a.** It sorts the 26 into four kinds and says what each one
   needs. Kinds A and B need one QID per side; kind C needs an editorial answer
   about `data/imports/wikidata-seeds.json` → `classes`; kind D needs striking.
2. **Section 7 is Russia**, which is the owner's own example and where a
   decision buys the most: three QIDs and, for the Soviet Union, which of its
   two P571 values.
3. **The cheapest way to answer is to give a record the period name.**
   `--dates` searches only for names a record carries, on purpose, so adding
   "French Algeria" to `algeria-under-france`'s `names` is enough to let the
   next `import/dates-…` run answer that row by itself. Writing the QID pair
   into section 4a by hand does the same.
4. **Do not start over, and do not widen the matching into a judgement.** The
   survey, the lookup and the verdicts stand; carry out whatever a person has
   filled in and leave the rest.
5. **Do not touch a record while its verdict reads "for a person".** Rule 11
   makes a half-done join a hard error, and there is no deadline here worth
   that.

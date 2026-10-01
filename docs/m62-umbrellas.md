# M62 — the candidate umbrellas, measured before any were written

The owner, 18 September:

> **"the timeline has too many events and gets very confusing because most
> events don't have a parent. For example, a lot of portuguese political events
> before 1974 could have as a parent 'Portuguese Dictatorship' or something
> like that... This way everything would be way more organized"**

**At the head this run started from: 304 active events, 12 with a parent, 292
top-level.** This document is the measurement M51 and M58 made a habit of — the
candidates, the span a source gives each one, how many parentless events fall
inside that span, how many of those are also inside its *subject*, and the
verdict — and it was written and committed before a single record was.

## 1. Why there was nothing to point at

`estado-novo` exists as an **actor** (`data/actors/estado-novo.json`), and
there is no Estado Novo **event**. The atlas has had the regime as a thing that
*acts* and nothing that anything can be *part of*. The same is true of the
First Republic, the Ditadura Nacional and the Portuguese Colonial War: each is
an actor or a phrase in a summary, none is a record with a span.

That is also why **M48's top-level-only filter has been a no-op for a week**.
The filter is right. The hierarchy was never written.

## 2. What counts as an umbrella here

**A real period with a sourced span, not a bucket invented for tidiness.**
The span comes from Wikipedia or Wikidata, cited on the record like any other
claim (the owner's decision of 16 September). A period no source will name and
bound is not an umbrella and none was invented for one.

Events carry no `confidence` — that field is an edge's — so the standard
rule 9 sets for a consensus edge is met here the only way a record can meet it:
**the span is cited to the item that states it**, and the record says which.
Each of the five below cites Wikidata for the two dates and both Wikipedia
editions by revision for the prose those dates come out of.

## 3. What counts as a child, which a date alone cannot settle

**Inside the umbrella's span *and* inside its subject.** The window
1926–1974 alone holds 90 parentless events, among them the **Wall Street
Crash**, the **Great Depression**, the **Holocaust** and **Vargas's Brazil**.
Filing those under Portuguese politics would be worse than leaving them flat.

So the child must also be the umbrella's own: **its `actors` or its place put
it inside** the regime, the war, the period the umbrella names. That test is
*necessary and not sufficient* — the measurement below shows why. It puts
`charter-of-the-united-nations` inside the Second World War (it shares five
belligerents) and `us-air-bases-in-the-brazilian-northeast-1942` inside it too
(it shares `united-states-of-america`). Neither is part of the war. The
property is what the tests can assert; the filing is a judgement, and the
judgement is written down here case by case.

Two rules of judgement were used throughout, and both are stated so they can
be argued with:

- **A period named for a form of government does not contain the act that
  created or destroyed it.** Before the coup the regime did not exist; after
  the revolution it did not. So `republic-proclaimed-1910`, `coup-28-may-1926`,
  `constitution-1933`, `carnation-revolution-1974`, `1964-brazilian-coup-detat`
  and `operation-brother-sam-1964` stay top-level, on the boundary between two
  periods rather than inside either. **A war is different**: a war is made of
  its fighting, so it does contain its first action, and
  `angola-war-begins-1961` is filed inside the Colonial War.
- **An event whose author is another state, with the umbrella as its object,
  is not part of the umbrella.** `goa-annexed-1961` is the Republic of India's
  operation; the Estado Novo is what it was done to. It stays top-level.

Where a call was arguable it was **left top-level and listed**. A flat event is
honest; a wrongly filed one is not.

## 4. The five umbrellas created

Spans are Wikidata's `start time`/`inception` and `end time`/`dissolved`,
day-precision in every case, read 18 September 2026.

| umbrella | span | source | parentless in span | also in subject | filed |
| --- | --- | --- | --- | --- | --- |
| `first-portuguese-republic-1910-1926` | 1910-10-05 – 1926-05-28 | Q167360 | 48 | 16 | **14** |
| `ditadura-nacional-1926-1933` | 1926-05-29 – 1933-03-19 | Q2729197 | 7 | 5 | **3** |
| `estado-novo-1933-1974` | 1933-03-19 – 1974-04-25 | Q824489 | 80 | 33 | **24** |
| `portuguese-colonial-war-1961-1974` | 1961-02-04 – 1974-04-25 | Q609836 | 28 | 17 | **6** |
| `brazilian-military-dictatorship-1964-1985` | 1964-04-01 – 1985-03-15 | Q1370527 | 55 | 5 | **2** |

### 4.1 First Portuguese Republic, 1910–1926

*Q167360; "First Portuguese Republic", en revision 1370244290, which dates it
"between the end of the period of constitutional monarchy marked by the
5 October 1910 revolution and the 28 May 1926 coup d'état"; pt "Primeira
República Portuguesa", revision 72349802.*

**Subject:** the politics and government of the First Republic — its
governments, its parties, its elections, its coups and its risings.

**Filed (14):** `1911-portuguese-constituent-national-assembly-election`,
`1911-portuguese-presidential-election`, `constitution-1911`,
`law-of-separation-1911`, `universities-of-lisbon-and-porto-1911`,
`1915-portuguese-legislative-election`, `pimenta-de-castro-government-1915`,
`revolt-14-may-1915`, `sidonio-pais-coup-1917`,
`sidonio-pais-assassinated-1918`, `monarchy-of-the-north-1919`,
`1921-portuguese-legislative-election`, `noite-sangrenta-1921`,
`1925-portuguese-legislative-election`.

**Left top-level, and why:**

- `republic-proclaimed-1910` and `coup-28-may-1926` — the two boundary acts.
- **Six presidential elections of the Republic name no actor and no place at
  all**: `may-1915-`, `august-1915-`, `1918-`, `1919-`, `1923-` and
  `1925-portuguese-presidential-election`. Their titles say plainly what they
  are, but a title is not what the rule reads, and nothing *on the record*
  puts them inside the subject. They are the clearest finding of this
  measurement: six records one actor line away from being filable, and that
  line is a records milestone's work, not this one's.
- The other 26 inside the window are the Great War, the Balkan wars, the
  Russian revolutions and the peace treaties. None is Portuguese politics.

### 4.2 Ditadura Nacional, 1926–1933

*Q2729197; "Ditadura Nacional", en revision 1365513062: the regime that
governed Portugal "from the end of the First Portuguese Republic with the
28 May 1926 coup d'état, until the adoption of a new constitution in 1933";
pt revision 72710910.*

**Subject:** the military dictatorship between the Republic and the Estado
Novo — the actor `military-dictatorship`, Carmona, Gomes da Costa, and Salazar
before 1933.

**Filed (3):** `1928-portuguese-presidential-election`,
`salazar-finance-minister-1928`, `salazar-president-of-council-1932`.

**Left top-level:** `coup-28-may-1926` and `constitution-1933`, the two
boundary acts; `wall-street-crash-of-1929` and `kellogg-briand-pact`, which
fall in the window and are not Portuguese politics — the exact trap the brief
names.

Three children is thin, and it was written anyway: without it the Portuguese
spine has a seven-year hole between two regimes the atlas does hold, and the
alternative is filing 1926–1933 under a regime that did not yet exist.

### 4.3 Estado Novo, 1933–1974

*Q824489, inception 1933-03-19, dissolved 1974-04-25; "Estado Novo
(Portugal)", en revision 1372069303 — "the corporatist Portuguese state
installed in 1933", which "evolved from the Ditadura Nacional … formed after
the coup d'état of 28 May 1926"; pt revision 72805786.*

**Subject:** Portuguese politics and government under the regime — its own
acts, the acts of its police and its single party, its foreign policy signed in
its own name, its colonial administration, and the opposition inside Portuguese
politics that it ran against.

**Filed (24):** `national-syndicalists-banned-1934`,
`legiao-portuguesa-founded-1936`, `portugal-backs-franco-1936`, `iberian-pact`,
`exposicao-mundo-portugues-1940`, `azores-agreement-1943`,
`1945-portuguese-legislative-election`, `1949-portuguese-presidential-election`,
`nato-founding-1949`, `batepa-massacre`, `un-admission-1955`,
`delgado-candidacy-1958`, `constitutional-revision-1959`, `mueda-massacre`,
`efta-accession-1960`, `santa-maria-hijacking-1961`,
`botelho-moniz-coup-attempt-1961`, `1965-portuguese-presidential-election`,
`delgado-assassinated-1965`, `caetano-succeeds-salazar-1968`,
`1969-portuguese-legislative-election`, `1972-portuguese-presidential-election`,
`1973-portuguese-legislative-election`, `portugal-e-o-futuro-1974`.

Three of those are multilateral instruments and were read record by record
rather than by their place: `nato-founding-1949` is titled *"Portugal signs
the North Atlantic Treaty"*, `un-admission-1955` *"Portugal admitted to the
United Nations"* and `efta-accession-1960` *"Portugal joins the European Free
Trade Association"*. Each record's own subject is the regime's act, not the
institution's founding, and that is why they are filed and the founding of
NATO would not have been.

**Left top-level, and why:**

- `constitution-1933` and `carnation-revolution-1974` — the two boundary acts.
- `goa-annexed-1961` — India's operation, with the regime as its object.
- `1951-portuguese-presidential-election` — no actor and no place on the
  record, the same fault as the six above.
- The six events of the Colonial War, which go to their own umbrella.
- 46 others in the window: the Second World War, the Cold War's wars, the
  Brazilian records, the Holocaust. The window is 41 years long and most of
  what falls in it has nothing to do with Portugal.

### 4.4 Portuguese Colonial War, 1961–1974

*Q609836, start 1961-02-04, end 1974-04-25; "Portuguese Colonial War", en
revision 1372834694; pt "Guerra Colonial Portuguesa", revision 72993312.*

**Subject:** the war in Angola, Guinea and Mozambique — the regime and its
forces on one side, the MPLA, the PAIGC and FRELIMO on the other.

**Filed (6):** `angola-war-begins-1961`, `guinea-war-begins-1963`,
`mozambique-war-begins-1964`, `wiriyamu-massacre-1972`,
`cabral-assassinated-1973`, `guinea-bissau-declares-independence-1973`.

**Eleven of the seventeen the actor test returns are the regime's own
politics** — the elections of 1965, 1969, 1972 and 1973,
`caetano-succeeds-salazar-1968`, `botelho-moniz-coup-attempt-1961`,
`santa-maria-hijacking-1961`, `delgado-assassinated-1965`, `goa-annexed-1961`,
`carnation-revolution-1974`, `portugal-e-o-futuro-1974` — and they intersect
the war's subject only because `estado-novo` is a belligerent in it. An event
has one parent; theirs is the regime, not the war.

**Not nested inside the Estado Novo**, though it falls inside its years:
Wikidata ends both on 1974-04-25, and the war it was is not a part of the
regime in the way a decree is. It stays a top-level umbrella of its own.

**Left top-level:** `alvor-agreement-1975` and `angola-independence-1975`,
which are dated after the span the source gives the war and would be the
warning this milestone is meant not to produce; `spinola-resigns-1974` and the
rest of 1974–75, which belong to what came after.

### 4.5 Brazilian military dictatorship, 1964–1985

*Q1370527, start 1964-04-01; "Military dictatorship in Brazil", en revision
1373177216: "established on 1 April 1964 … It lasted 21 years, until 15 March
1985"; pt "Ditadura militar brasileira", revision 72895311. Wikidata's
`dissolved` is year-precision, so the end date is the English article's.*

**Subject:** Brazil under military rule.

**Filed (2):** `the-brazilian-miracle-1968-1973`,
`1985-brazilian-presidential-election`.

**Left top-level:** `1964-brazilian-coup-detat` and `operation-brother-sam-1964`,
the founding act and the American operation that was part of it — both straddle
1 April 1964; `the-base-reforms-rally-1964`, 13 March 1964, three weeks before
the regime existed; `the-brazilian-debt-crisis-1982`, which runs to 1989 and
would be dated outside its parent.

**Two children is the thinnest of the five**, and it is here because it is a
real period with a sourced span that the Brazilian records will attach to, and
because the only way to make it look fuller would be to file the coup inside
the regime the coup created.

## 5. The two umbrellas that already existed and gained children

| umbrella | span | parentless in span | by the actor test | filed |
| --- | --- | --- | --- | --- |
| `world-war-ii` | 1939–1945 | 16 | 8 | **3** |
| `the-1930-revolution-and-the-vargas-era` | 1930–1945 | 26 | 3 | **3** |

**World War II already held one child**, `eastern-front`, which M47 gave it out
of what the corpus implied — the one umbrella in the atlas that was already
doing this job. **It gains** `warsaw-uprising`, `katyn-massacre` and
`potsdam-conference`. It does **not** gain the five others the actor test
returns, and they are the clearest demonstration that the test is necessary
and not sufficient:

- `charter-of-the-united-nations` — the postwar order, not the war.
- `molotov-ribbentrop-pact` — signed 23 August 1939, nine days before the war
  the source dates from 1 September.
- `companhia-siderurgica-nacional-1941`, `the-rubber-battle-1942` and
  `us-air-bases-in-the-brazilian-northeast-1942` — they intersect only through
  `united-states-of-america`. Their subject is Vargas's Brazil, and that is
  where they are filed.

Two more were refused on dates rather than subject: **`the-holocaust`
(1933–1945)** and **`second-sino-japanese-war` (1937–1945)** both begin before
the war does, and each would be a `child-outside-parent` warning.

**The Vargas era gains** exactly those three Brazilian records, which is the
brief's own example handled the right way round: the events the 1926–1974
window would have swept into Portuguese politics have a Brazilian parent of
their own.

## 6. The candidates refused

**World War I — nothing qualifies, and the umbrella already exists.** Sixteen
parentless events fall in 1914–1918. **Eight of them name no actor at all.**
The two the actor test returns are `assassination-of-archduke-franz-ferdinand`,
which is dated 28 June 1914, a month before the war the record dates from
28 July, and `february-revolution`, whose subject is the Russian Revolution and
not the war. The rest are the Portuguese politics of the First Republic, and
they went there. The Great War keeps the three children M47 gave it.

**"Portuguese dictatorship", as one period 1926–1974.** This is the owner's own
phrase and it is the one thing here that was not built as asked. No source
names a single period by that span: Wikipedia and Wikidata both give two, the
Ditadura Nacional and the Estado Novo, divided at the constitution of
19 March 1933. Building one umbrella would have meant inventing a span. The
atlas holds both, and the timeline shows the regime the owner meant — in two
pieces, which is what the sources say it was.

**The Third Portuguese Republic, 1974–.** Refused. It is the present
constitutional order and still open, `third-portuguese-republic` sits on
twenty-odd records as an actor, and filing them all under one node would
replace a flat list of Portuguese events with a single trunk carrying the same
flat list. It reorganises nothing.

**The PREC, 1974–1976 or 1975.** Refused on the span, which the sources do not
agree on. Wikidata (Q3130521) gives 11 March – 25 November 1975. The Portuguese
article (revision 72883458) gives, in one paragraph, the broad sense — from
25 April 1974 to the constitution of April 1976 — and the narrow one, the
Verão Quente of 1975. Four events would qualify under one reading and not the
other. An umbrella whose dates two sources disagree about would file events by
a date the atlas cannot defend, and `parent` does not have a `disputada` to
mark it with.

**The Cold War, 1947–1991.** Refused. Ninety-seven parentless events fall in
the span; the actor test returns five — `korean-war`, `vietnam-war`,
`gulf-war`, `1964-brazilian-coup-detat`, `operation-brother-sam-1964` — and
every one of those five is a case where "part of the Cold War" *is* the
historiographical argument. That argument belongs in an edge with an
explanation and a confidence, which is exactly what `parent` is forbidden to
be.

## 7. The result

**55 events found a parent**; **five umbrellas were created**; **no umbrella
was invented without a source for its dates**. Top-level goes from **292 of
304** to **242 of 309**, and events with a parent from **12 to 67**.

Nothing here is a causal claim and no edge was written. `parent` stays a
display fact: saying the decree is part of the regime asserts no cause, and
M48's filter and M60's views now have something to read.


## 8. Addendum, 20 September 2026 — the records this measurement said it could not file

M62 closed §4.1 with a finding rather than a filing: **six presidential
elections of the Republic name no actor and no place at all**, and *"that line
is a records milestone's work, not this one's"*. `1951-` was the seventh, in
§4.3. **M67 is that milestone** (`docs/m67-umbrellas.md`): it wrote each of them
the line the record was missing, out of the Wikidata item the record already
cited, and then filed them under the umbrellas this document had already
measured and argued for. Nothing about the umbrellas or the judgements above
changed; the records caught up with them.

**`first-portuguese-republic-1910-1926` gained six:**
`may-1915-portuguese-presidential-election`,
`august-1915-portuguese-presidential-election`,
`1918-portuguese-presidential-election`,
`1919-portuguese-presidential-election`,
`1923-portuguese-presidential-election` and
`1925-portuguese-presidential-election` — each now naming
`first-portuguese-republic`, which is this umbrella's own actor, and each
inside 1910-10-05 – 1926-05-28. **`estado-novo-1933-1974` gained**
`1951-portuguese-presidential-election` on the same ground.

**`world-war-ii` gained `winter-war` and `20-july-plot`.** Neither is from
§4.1's list. The Winter War named nothing until M67 gave it `finland` and
`soviet-union` from Q134949, and that item also puts it inside the Second
World War. **`20-july-plot` still names neither an actor nor a place and is
filed all the same**, under amendment A1 of M67's brief — the owner, 21
September: *"It's fine to have no actor or place, you have to read the
context."* Its context is on the record: Q105570 gives `part of` World War II,
its summary quotes the item's *"attempt to assassinate Adolf Hitler, 1944"*,
and 20 July 1944 is inside the war's span. The subject property of §3 cannot be
asked of a record with nothing on it, so `tests/m62.test.mjs` admits that case
and the filing note carries it instead; nothing else about §3 moved. The five
this document refused for the war are still refused, `bretton-woods-system`
with them.

The two boundary acts, `republic-proclaimed-1910` and `coup-28-may-1926`, are
where §4.1 left them, and so is every other refusal above.

## M42 batch 37 — one filing into `portuguese-colonial-war-1961-1974`

**`portuguese-colonial-war-1961-1974` gained `angolan-war-of-independence`**,
which M42's joins vein imported on 22 September. The filing is the plainest this
document holds: Wikidata's `P361` for the item (Q1780216) is Q609836, which is
the record this umbrella already carries as its own identifier, and the two
spans are the **same day at both ends** — 4 February 1961 to 25 April 1974. The
subject property of §3 holds as well: the war of independence is one of the
three theatres the umbrella is an umbrella over, and `angola-war-begins-1961`,
already filed here, is its opening day.

**A second parent was written and then taken off**, which is worth recording
because amendment A8 asks a filing to write *every* umbrella that fits.
`decolonisation-of-africa` fits on both tests — the span holds 1961–1974 and the
subject is Africa — but the colonial war is **already** filed under it, so the
period is reachable from the record through its first parent.
`tests/m42-filing.test.mjs` refuses that ("no parent of an event is reachable
through another of its parents") and the refusal is right: A8 is about an event
that belongs to two arguments at once, as Angolan independence belongs to the
Portuguese republic and to African decolonisation, and not about restating an
ancestor the chain already reaches. **Every umbrella that fits means every
umbrella that adds something.**

## M42 batch 42 — a second filing into `portuguese-colonial-war-1961-1974`

**`portuguese-colonial-war-1961-1974` gained `operation-green-sea`**, the
Portuguese amphibious raid on Conakry of 22 November 1970, which M42's inverse
`part of` vein imported on 23 September. Both of §3's tests hold. The span is
not in doubt: the raid is one night inside 4 February 1961 to 25 April 1974.
The subject holds the way the Angolan war of independence's did — the raid was
mounted from Portuguese Guinea by Portuguese officers against the PAIGC's
headquarters and the government sheltering them, which is the umbrella's own
war in one of its three theatres — and the record says so in its actors:
`portugal` as `invader`, `guinea` and `paigc` as `target`, each read off the
article's first two sentences at revision 1372115645.

**This is the batch's A8 case and it is the owner's own shape.** The raid is
also part of `guinea-bissau-war-of-independence`, which Wikidata's `P361` names
(Q2609193) and which the atlas imported the day before. That war is **not**
filed under the colonial war: it ran to 10 September 1974 and the colonial war
closes on 25 April, so the umbrella is shorter than its part and rule 24 would
warn (batch 41). The colonial war is therefore not reachable from the raid
through its first parent, `tests/m42-filing.test.mjs` admits the second, and
both are written. The raid belongs to two arguments at once — the war Portugal
fought and the war Guinea-Bissau won — which is exactly what A8 was asked for.

## A14 (6), 24 September — `world-war-ii` gained `the-extermination-of-the-jews-1941-1945`

**`the-holocaust` was divided at 1941** under the brief's §5 and the amendment
A14(6), into `the-persecution-of-the-jews-1933-1941`, which stays a main event,
and **`the-extermination-of-the-jews-1941-1945`, which is filed under
`world-war-ii`**. Both of §3's tests hold.

**The span is not in doubt** and it is the cited article's own, at revision
1376446924: the lead reads *"From 1941 to 1945, Nazi Germany and its
collaborators systematically murdered around six million Jews across
German-occupied Europe"* and § Mass shooting reads *"The systematic murder of
Jews began in the Soviet Union in 1941"*. 1941–1945 is inside 1939–1945.

**The subject holds** the way `eastern-front`'s does: the record names
`nazi-germany` as `perpetrator` and the umbrella names `nazi-germany`, and the
ground is German-occupied Europe, which is the war's own. M67's rule 1 does not
reach it — this is not an act that created or destroyed a form of government.

**Why a filing and not the edge §5 asked for.** §5 was written on 16 September
and says `world-war-ii --enabled--> <the second>` becomes datable and true once
the record starts in 1941. It does; and A14 suspends an edge from a parent to
its own child until the owner decides the 22 September C8, so the edge is not
written. The filing carries the same thing to a reader — the extermination
opens inside the Second World War — and it is also what keeps A6: two main
records out of one would have raised the main count, and main is 242 before
and 242 after.

**`the-holocaust-in-romania` is filed under `world-war-ii` and under neither
half.** It runs 1940–1944 (A14(1) widened it from its own lead the same day),
which straddles the boundary: rule 24 refuses it inside the extermination
record and 1944 puts it outside the persecution record. The war contains it and
the two halves do not, which is the honest filing and not a convenience.

## Curation 1 October 2026 — ten filings, and the half of the corpus the screen had never looked at

The 30 September fire read the **202 main events** that carry an item for
`P361`. This one read **all 1,238 events that carry one**, because an event
already filed can still be filed under a *nearer* umbrella, and nothing had
ever asked. 52 candidates came out of `filedUnder()`; **37 of them were the
grandparent of a parent the record already holds** — a reduction `filedUnder()`
cannot make, because it reduces among the umbrellas it chooses and is handed
nothing about the ones the record carries. That is right at import time, where
a new record has no parents, and wrong on a held one.

**Where the nearer umbrella arrives, the farther one comes off**, which is
deviation 1316's rule: a parent reached through another is not a second
umbrella.

| record | now part of | and no longer | why |
| --- | --- | --- | --- |
| `2011-military-intervention-in-libya` | `libyan-civil-war` | `arab-spring` | The item's `P361` names the civil war, whose span contains the intervention; the civil war is itself filed under the Arab Spring. |
| `battle-of-mogadishu-1993` | `operation-gothic-serpent` | `somali-civil-war` | The battle is the action that ended the operation, and the operation is filed under the civil war. |
| `battle-of-nam-river` | `battle-of-the-pusan-perimeter` | `korean-war` | August–September 1950 on the Naktong is the perimeter, which is filed under the war. |
| `battle-of-pavia` | `italian-campaign-of-1524-1525` | `italian-war-of-1521-1526` | Pavia closed the campaign, and the campaign is filed under the war. |
| `valtellina-war` | `bundner-wirren` | `thirty-years-war` | The Valtellina war is one part of the Grisons troubles, which are filed under the Thirty Years' War. |
| `guinea-bissau-war-of-independence` | `portuguese-colonial-war-1961-1974` | `decolonisation-of-africa` | One of the colonial war's three theatres; the colonial war is filed under the decolonisation. |
| `mozambican-war-of-independence` | `portuguese-colonial-war-1961-1974` | `decolonisation-of-africa` | The same, for the second of the three. |
| `operation-green-sea` | `guinea-bissau-war-of-independence` | `portuguese-colonial-war-1961-1974` | Not a filing of its own: filing the Guinea-Bissau war under the colonial war made this record's two parents nest, one step down. |

**And three that gained a second umbrella rather than a nearer one**, where
neither reaches the other and A8's "every umbrella that fits" means both:

| record | parents now | why |
| --- | --- | --- |
| `finnish-civil-war` | `russian-civil-war`, `world-war-i` | The item's `P361` names the First World War, whose span (to 11 November 1918) contains the civil war's (27 January – 15 May 1918). Neither umbrella is inside the other. |
| `goa-annexed-1961` | `estado-novo-1933-1974`, `portuguese-colonial-war-1961-1974` | The item's `P361` names the colonial war and December 1961 is inside it. Whether Goa belongs beside the three African theatres is a reviewer's question; this filing is the item's claim and not a reading. |
| `second-battle-of-guararapes` | `dutch-brazil-1630-1654`, `insurrection-of-pernambuco` | The item's `P361` names the insurrection, whose span contains 1649. The insurrection and Dutch Brazil are siblings under the Dutch–Portuguese war and neither reaches the other. |

**`a filing propagates one step down`, which is this fire's finding here.**
Filing `guinea-bissau-war-of-independence` under the colonial war did not touch
`operation-green-sea`, and it made that record's own parent list redundant all
the same. `tests/m42-filing.test.mjs` caught it on the very next run. A pass
that files a record has to re-ask the question of everything beneath it.

**Refused: `iberian-pact` under `world-war-ii`.** The item's `P361` names the
war and rule 24's year arithmetic contains it — 1939 inside 1939–1945 — but the
pact was signed on **17 March 1939** and the war began on 1 September. The
record already carries `interwar-period`, which is where that March belongs.
The containment a filing needs is the one the dates state and not the one the
years allow.

**And the four A6 lane-rule filings are unchanged and still the owner's**:
`2011-yemeni-revolution` under `arab-spring`, and `rif-war`,
`second-italo-ethiopian-war` and `soviet-japanese-border-conflicts` under
`interwar-period`. `tests/m42-filing.test.mjs` refuses each — a period umbrella
names no actor, so it can only take children in its own lane — and the question
of what a period's lane should be is the line the 30 September fire left.

**Main is 229 before and 229 after.** It has not risen.

## Batch 77 — one filing, argued from the umbrella's own article

*1 October, the import fire that claimed at 06:17Z.*

| record | parent | why that umbrella |
| --- | --- | --- |
| `rwandan-revolution` | `decolonisation-of-africa` | The umbrella's **own cited article** names it as the step by which the Belgian trusteeship ended: *"Following the Rwandan Revolution, the trusteeship became the independent states of the Republic of Rwanda and the Kingdom of Burundi in 1962"* (`"Decolonisation of Africa"`, revision 1372152864, § Belgium). The span half holds on the dates and not only the years — 1 November 1959 to September 1961, inside the article's own "mid-1950s to 1976" — and the subject half is the lane, which is `africa` for both. |

The item carries no `P361`, so the filing is this fire's and is argued from the
article the umbrella already cites rather than from Wikidata. It is the shape
batch 76 used for `fashoda-incident`, with the difference that the sentence is
in the **umbrella's** article rather than the child's: a period's own article
naming an episode is the period's author saying what the period contains, which
is the strongest filing argument this atlas can read.

Nothing propagates one step down: the record is new and has no children.

**Main is 229 before and 229 after.** The imported record arrives filed, which
is what A6 asks of an import.

## Batch 78 — the Malayan Emergency, filed on three readings that agree

*1 October, the same import fire.*

| record | parent | why that umbrella |
| --- | --- | --- |
| `malayan-emergency` | `decolonisation-of-asia` | Three things say it and none contradicts the others. The **item's own `P361`** names `Q230533`, decolonization, of which this atlas's Asian record is the umbrella. The **record's own lead** says what the war was for: *"The MNLA fought to win Malayan independence from the British Empire and to establish a communist state"* (`"Malayan Emergency"`, revision 1373880340). And the **umbrella's own cited article** names the Emergency in the note to its decolonisation table — *"The Malayan Communist Party fought in the Malayan Emergency between June 1948 – 12 July 1960"* (`"Decolonisation of Asia"`, revision 1375271318, § Notes) — against the row `Malaya (1957)`. Span 16 June 1948 to 12 July 1960, inside the umbrella's 1898–2002; lane `asia` for both, derived from the place's own point. |

The item's other `P361` is `Q8683`, the Cold War, and **this atlas holds no Cold
War record at all** — A15(13) names one and nothing on this branch carries
`Q8683`. So A8's "every umbrella that fits" writes one parent here and not two,
and whether the Cold War should be a record of this atlas is a question for
whoever reads that gap rather than a filing this fire could make.

Nothing propagates one step down: the record is new and has no children.

**Main is 229 before and 229 after.**

## Batch 79 — the Cambodian genocide, and the weakest of the three filings

*1 October, the same import fire.*

| record | parent | why that umbrella |
| --- | --- | --- |
| `cambodian-genocide` | `indochina-wars` | By span and lane it is the only umbrella that fits: 17 April 1975 to 7 January 1979, inside the umbrella's 1945–1991, lane `asia` for both. `cambodian-civil-war` ends on the very day the genocide begins and `cambodian-vietnamese-war` begins three years into it, so neither contains it. The argument is the umbrella's own article, whose subject is *"a series of wars which were waged in Indochina from 1945 to 1991, by communist forces"* and which names the regime that conducted the genocide as a party to those wars: *"The Cambodian–Vietnamese War began when Vietnam invaded Cambodia and deposed the genocidal Khmer Rouge regime"* (`"Indochina wars"`, revision 1373921212). |

**This is the weakest of this fire's three filings and it is worth saying so.**
The umbrella's article links the Cambodian genocide on the adjective *genocidal*
and not on its own title, so the sentence names the thing by what it was rather
than by what it is called here. What carries the filing is not that sentence
alone but that the war the sentence is about — `cambodian-vietnamese-war` — is
itself filed under this umbrella, and the genocide's own article says the
genocide precipitated it. A genocide filed under the war it belongs to is this
atlas's established practice: `herero-and-nama-genocide` sits under
`herero-wars` and `massacre-of-arabs-during-the-zanzibar-revolution` under
`zanzibar-revolution`.

A reviewer who disagrees should move it rather than unfile it: the alternative
is a main event, and A6 refuses that without a reason.

**Main is 229 before and 229 after.**

## Batch 80 — the 12-3 incident, filed where the item says nothing

The item `Q3182793` carries **no `P361` at all**, so the import filed nothing and
the record arrived as a main event. This is the filing that kept it from being
one, and the whole of its argument is the record's own place and span against two
candidate umbrellas rather than an item's claim.

| record | parent | why |
| --- | --- | --- |
| `12-3-incident` | `estado-novo-1933-1974` | Macau in December 1966 was Portuguese, and the Estado Novo's span (19 March 1933 to 25 April 1974) contains the incident's (18 November 1966 to 28 January 1967). `goa-annexed-1961` is the precedent and it is close: an action against Portuguese territory in Asia, inside the regime, filed under this umbrella among others. |

**Two umbrellas that fit on the years were refused, and for different reasons.**
`portuguese-colonial-war-1961-1974` contains 1966 on the dates, but the colonial
war is the three African theatres and Macau was not one of them: the years fit
and the war does not, which is rule 24's arithmetic passing where the reading
fails. `cultural-revolution` contains the span too (16 May 1966 to 6 October
1976) and would have been the easy filing, but the Cultural Revolution is what
*inspired* the incident and not what the incident was part of — the article says
"inspired by" — so it is the edge and not the parent. In this data model that
distinction is the model: `parent` is part-of and is display, an edge is the
argument. Filing it there would also have barred the edge under A14's standing
C8 rule, which is a consequence of the reading and not a reason for it.

**Main is 229 before and 229 after.**

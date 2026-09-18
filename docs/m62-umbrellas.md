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

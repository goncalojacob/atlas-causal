# M44b — what was withdrawn, and what was put back

M44a imported 82 records. M44b kept 30, merged 2 into records the atlas already
held, and retracted 50. Every reason is in the record's own `retraction` block,
which is where it belongs and where nothing deletes it; this file is the index,
with the classes and the counts, and it also carries the reasons of the records
this round **un-retracted**, which the records themselves no longer hold.

A retraction here is a success of the milestone and not a failure of it.
Nothing was written in order to keep a record.

## Reinstated

Amendment A11: reinstating a record deletes its `retraction` block, because
rule 27 makes a retraction on a non-retracted record an error. The reason is
copied here verbatim, in the same commit, so that the account of the withdrawal
survives the undoing of it.

### `second-congo-war`

Reinstated in M42 batch 12 on `first-congo-war --caused--> second-congo-war`
and, one hop behind it, `angolan-civil-war --precondition-of--> first-congo-war`.
Its reason named the missing record exactly — "no record of the Angolan civil
war" — and `angolan-civil-war` came back in batch 0 of the same run. What the
reason could not know is that the Second Congo War's own article never says
*why* Angola intervened; the First Congo War's article has a section on it and
states the motive outright, which is why one sweep row and not the bigger war
is what the cluster hangs on.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A. Angola fought in this war, on Kabila's side and
> against the UNITA supply lines through Mobutu's Zaire, which is a genuine
> edge from the Great Lakes to the Portuguese-speaking world. It cannot be
> written: the atlas holds Angolan independence in 1975 and no record of the
> Angolan civil war that the intervention of 1998 was a continuation of. Named
> in docs/m44-connections.md as work the atlas needs.

### `rwandan-civil-war`

Reinstated in M42 batch 12 on
`rwandan-civil-war --precondition-of--> 1994-genocide-against-tutsi` and
`rwandan-civil-war --caused--> arusha-accords`. Its reason said the route from
the Great Lakes to this atlas runs through Angola's civil war and Angola's
intervention in Congo, and that the atlas held Angolan independence and nothing
after it. Both halves of that route are records now, and the cluster reaches
Angola in three hops rather than being wired to itself.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A. The war of 1990 to 1994 can be argued to the
> Arusha accords, which M44a also imported, and to the genocide and the Congo
> wars, and the whole cluster reaches no Portuguese event: the route from the
> Great Lakes to this atlas runs through Angola's civil war and Angola's
> intervention in Congo, and the atlas holds the independence of Angola in 1975
> and nothing after it. Retracting the cluster together is more honest than
> wiring it to itself and calling it connected.

### `arusha-accords`

Reinstated in M42 batch 12 on `rwandan-civil-war --caused--> arusha-accords`,
with the war it ended, as it was retracted with it. Its reason was that two
records connected to each other and to nothing else is the second atlas M44's
brief existed to stop building; they are five records connected to the whole
atlas now, and the reason was right to refuse them when they were two.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the Rwandan civil war it ended. The accords'
> only neighbour here would have been that war, which is retracted in the same
> commit for want of any Portuguese reach; two records connected to each other
> and to nothing else is precisely the second atlas the brief was written to
> stop building.

### `somali-civil-war`

Reinstated in M42 batch 11 on `ogaden-war --caused--> somali-civil-war`. Its
reason said nothing in this atlas touched Somalia, which was true; the Ogaden
war of 1977–78 is the sweep row that made it untrue, and the war's own article
ends its lead saying the defeat left Somalia with a disorganized and demoralized
army whose revolt "eventually spiraled into the ongoing Somali Civil War".

Its M44b retraction read, verbatim:

> Retracted in M44b, class A: the neighbour is missing. Nothing in this atlas
> touches Somalia — not the collapse of 1991, not the intervention of 1992, not
> the piracy of the 2000s — and no edge to a Portuguese event can be argued
> without inventing one.

### `first-italo-ethiopian-war`

Reinstated on `berlin-conference --precondition-of--> first-italo-ethiopian-war` and `first-italo-ethiopian-war --precondition-of--> second-italo-ethiopian-war`. Its reason named exactly what was missing — "no Berlin conference, no British ultimatum of 1890, no Mapa Cor-de-Rosa, no Italian invasion of 1935 that was fought to avenge this defeat" — and batch 4 wrote two of the four. The British ultimatum and the Pink Map are still missing and are still worth writing.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A: the neighbour is missing. The only route from
> Adwa to anything Portuguese runs through the partition of Africa, and this
> atlas holds none of it — no Berlin conference, no British ultimatum of
> 1890, no Mapa Cor-de-Rosa, no Italian invasion of 1935 that was fought to
> avenge this defeat. Every edge that could be written here would have to be
> written to something that is not a record, and an edge from an Italian
> defeat in Ethiopia to a Portuguese event would be an invention. The record
> is sound and the atlas around it is not there yet.

### `2013-egyptian-coup-d-etat`

Reinstated on `2011-egyptian-revolution --precondition-of--> 2013-egyptian-coup-d-etat`. Its reason ends "the missing record is 2011", and 2011 arrived in batch 4.

Its M44b retraction read, verbatim:

> Retracted in M44b, class B. July 2013 argues from the Egyptian revolution
> of 2011 and the Arab Spring, neither of which is a record here — the Arab
> Spring is among the twenty-two that M44a’s import refused again for want
> of a lane — and from the revolution of 1952, which this round wired at two
> hops and which leaves 2013 at three. The missing record is 2011.

### `gaza-war-2008-2009`

Reinstated on `second-intifada --precondition-of--> gaza-war-2008-2009`. Its reason named the second intifada and the disengagement of 2005 as the records it needed; the intifada arrived in batch 4, and the article on the 2008 war opens its background with that intifada’s end.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A. Its neighbours are the Gaza records of 2023,
> which the atlas holds and which reach no Portuguese event, and the second
> intifada and the disengagement of 2005, which it does not hold. Retracted
> rather than wired into a cluster that is stranded itself.

### `war-in-darfur`

Reinstated on `second-sudanese-civil-war --precondition-of--> war-in-darfur`.
Its reason said Sudan enters this atlas nowhere and that the record would have
to be wired to the South Sudanese civil war and would touch nothing else; §2f
of `docs/m42-connections.md` refused to put it back on those terms when the
civil war returned, and named the missing record by name. Batch 7 imported it.
The pair is still a small component that reaches nothing else, and §2g says so
rather than writing an edge nobody argues.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A: the neighbour is missing. Sudan enters this
> atlas nowhere. The record would have to be wired to the South Sudanese civil
> war, imported in the same batch and retracted in the same commit, and the
> pair would touch nothing else.

### `south-sudanese-civil-war`

Reinstated on `2011-south-sudanese-independence-referendum --precondition-of--> south-sudanese-civil-war`. Its reason named the independence of South Sudan as the record it lacked. The referendum arrived in batch 4, and the article on the war says the desire for independence is what kept the in-fighting in check for the six years before it. The war in Darfur, withdrawn beside it, is **not** put back, and docs/m42-connections.md §2f says why.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the war in Darfur and the independence of
> South Sudan, which is not a record here. Both of the neighbours it has are
> the wrong side of the same gap.

### `1991-soviet-coup-d-etat-attempt`

Reinstated on `1991-soviet-coup-d-etat-attempt --caused--> dissolution-of-the-soviet-union`. The neighbour its reason named is now a record.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A. The coup of August 1991 argues to the
> dissolution of the Soviet Union in December, which is one of the twelve
> named neighbours the committed candidate list does not hold, and to the
> Russian records of the 1990s, which reach no Portuguese event. Nothing
> else in this atlas is within reach of it.

### `1993-russian-constitutional-crisis`

Reinstated on `dissolution-of-the-soviet-union --precondition-of--> 1993-russian-constitutional-crisis`. The reason said it "belongs with the dissolution of the Soviet Union", and the dissolution is here.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A. October 1993 belongs with the dissolution of
> the Soviet Union and the Russian 1990s, and this atlas holds neither. The
> Russian records it does hold — the revolutions of 1917, the civil war, the
> war in Ukraine — are three hops or more from any Portuguese event
> themselves, so an edge into them would connect a stranded record to a
> stranded cluster.

### `budapest-memorandum`

Reinstated on `dissolution-of-the-soviet-union --precondition-of--> budapest-memorandum` and `budapest-memorandum --precondition-of--> russo-ukrainian-war`. The reason said the memorandum argues forward to the Russo-Ukrainian war and that both ends were stranded. The dissolution joins that cluster to the corpus, so neither end is stranded now.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A. The memorandum of 1994 argues forward to the
> Russo-Ukrainian war of 2014 and to the full-scale war of 2022, which are
> both records here and both reach no Portuguese event at all; the atlas
> holds nothing of Portugal and Ukraine, neither the Ukrainian emigration to
> Portugal after 2001 nor any Portuguese act after February 2022. Wiring the
> memorandum to two stranded records would have left three where there were
> two.

### `romanian-revolution-1989`

Reinstated on `revolutions-of-1989 --caused--> romanian-revolution-1989`. Its reason is the clearest statement in the corpus of what this milestone was for: "until a candidates round with the right classes fetches them, 1989 cannot be wired here at all". Batch 2a seeded the class, batch 4 fetched it.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, and it is the clearest case in the round for
> owner question 2. December 1989 in Romania is one of the revolutions of
> 1989 and cannot be argued from anything else, and this atlas holds not one
> of the others: no fall of the Berlin wall, no round table in Poland, no
> Czechoslovak November, no German reunification, no dissolution of the
> Soviet Union. All of those are on the brief’s list of twelve named
> neighbours that the committed candidate list does not carry because their
> Wikidata classes are not among the queries’. Until a candidates round with
> the right classes fetches them, 1989 cannot be wired here at all.

### `yugoslav-wars`

Reinstated on `yugoslav-wars --precondition-of--> breakup-of-yugoslavia`. The bar it was measured against was a Portuguese end, and the bar of this milestone is any end the atlas already holds. The Portuguese records its reason names as missing — the presidency of 1992, the Cutileiro plan, the deployments after Dayton — are still missing, and are still worth writing.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, and with the three Yugoslav records M44a
> imported beside it. The Portuguese edges are there in the history and not
> in the data: Portugal held the presidency of the Community in the first
> half of 1992, when José Cutileiro chaired the Lisbon talks on Bosnia, and
> Portuguese contingents served in the forces that followed Dayton and
> Kosovo. The atlas holds no record of the 1992 presidency, of the Cutileiro
> plan or of any Portuguese deployment, so the edge has no Portuguese end.
> Retracted for the want of it, and the missing records are named in
> docs/m44-connections.md.

### `croatian-war-of-independence`

Reinstated on `yugoslav-wars --precondition-of--> croatian-war-of-independence`. Its dates are the 1991–1995 M44c restored; the two imported days were neither the beginning nor the end of the war and were removed rather than replaced. Whoever reviews it supplies precise dates from a source they have opened.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the Yugoslav cluster, and a second thing
> should be said about this record while it is being withdrawn: its dates
> were wrong as imported. It carried a start of 12 November 1995 and an end
> of 7 August 1995 — the Erdut agreement and the close of Operation Storm —
> for a war the record’s own cached lead dates from 1991 to 1995. M44c
> corrected the span to 1991–1995, the two years the record already carried
> in its own summary, and removed `date` and `endDate` rather than replace
> them: neither imported date is the war's beginning or its end, and this
> run had no source it could read for the real ones. A day the atlas has not
> verified is worse than an honest year. Whoever un-retracts it supplies the
> precise dates from a source they have opened, if the record wants them at
> all.

### `dayton-agreement`

Reinstated on `war-in-bosnia-and-herzegovina --caused--> dayton-agreement`. The war it ended is a record as of batch 4, which is exactly what its reason said was missing.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the Yugoslav cluster. Dayton ended the
> Bosnian war, which this atlas does not hold either — it is one of the
> brief’s twelve named neighbours that the committed candidate list cannot
> reach. A peace agreement whose war is missing and whose region reaches no
> Portuguese record has no edge to carry.

### `kosovo-war`

Reinstated on `yugoslav-wars --precondition-of--> kosovo-war`. The reason asks for "a record of Portugal in NATO after the cold war", and that is still missing and still worth writing. What has changed is that the campaign of 1999 no longer needs a Portuguese end to be argued at all.

Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the Yugoslav cluster. NATO’s campaign of
> 1999 is the point at which a Portuguese edge is nearest — Portugal was a
> member and took part — and the atlas holds Portugal’s signature of the
> North Atlantic treaty in 1949 and nothing of the alliance afterwards. An
> edge from 1999 back to 1949 would run against the arrow of time as well as
> against sense. What is missing is a record of Portugal in NATO after the
> cold war.

### `good-friday-agreement`

Reinstated on `the-troubles --caused--> good-friday-agreement`. Both records its reason named as missing — the Anglo-Irish treaty and the Troubles — arrived in batch 4.

Its M44b retraction read, verbatim:

> Retracted in M44b, class B. Its neighbours in this atlas are the Easter
> Rising and the Irish civil war, and the civil war is itself two hops out,
> which puts the agreement at three. The records that would shorten the
> chain are the ones the Easter Rising edge already names as missing — the
> War of Independence, the Anglo-Irish treaty — and the Troubles, which the
> atlas does not hold at all. Ireland reaches Portugal here only through the
> war of 1914, and 1998 is too far along that line.

### `university-of-porto`

Reinstated by `universities-of-lisbon-and-porto-1911`, which names it in
`actors` with the role `institution`. Its M41b retraction read, verbatim:

> Retracted in M41b: the university founded on 22 March 1911, the second
> largest in the country. The Republic created the universities of Lisbon and
> Porto by decree in its first year, and that is a real consequence of the
> records this atlas already holds — the proclamation of October 1910, the
> constitution and the law of separation of 1911. But the atlas has no record
> of the decree, and an actor cannot be joined to an event nobody has written.

The atlas now has the record of the decree.

### `national-syndicalists`

Reinstated by `national-syndicalists-banned-1934`, which names it in `actors`
with the role `target`. Its M41b retraction read, verbatim:

> Retracted in M41b: the National Syndicalist Movement, founded in February
> 1932 by Francisco Rolão Preto, the nearest thing to a fascist movement
> Portugal produced and suppressed by the Estado Novo in 1934. The atlas holds
> the regime it was absorbed and banned by, and holds nothing about the
> suppression itself: not the ban, not the exile of Rolão Preto, not the revolt
> of 1935, and no record of the man. It would need one of those, and it is the
> retraction here most worth undoing.

The atlas now has the first of the three. The exile of Rolão Preto, the revolt
of 1935 and a record of the man are still missing, and M41b was right that this
was the retraction most worth undoing.

### `energias-de-portugal`

Reinstated by `edp-created-1976`, which names it in `actors` with the role
`institution`. Its M41b retraction read, verbatim:

> Retracted in M41b: EDP, the electricity utility founded in 1976 out of the
> merger of fourteen nationalised companies. The link to the atlas is real and
> it has no record to hang on: the nationalisations this atlas holds are those
> of March 1975, a year earlier, and EDP was not an actor in them but a body
> made afterwards out of what they took. It would need an event for the
> creation of EDP in 1976, or for the nationalisation of electricity that
> followed the banks over that summer.

The atlas now has the first of the two. The nationalisation of electricity
itself is still missing, and it is the better record of the pair.

### The eight that stay retracted

Amendment A5 names eleven retracted actors. Three are above. The other eight
stay retracted, and the reason is the same for all of them and is the one §4c
of the brief set as its hard constraint: **a record is written only if a source
already in `data/sources/` carries it.** In each of these cases the event that
would name the actor is a law, a merger or a sale whose date and instrument
this run could not point at in any of the thirty-four sources this atlas holds,
and a record of "the banking law of the mid-1980s" that cannot say which law it
is would be a gap dressed as a record. They are listed with the work each one
needs in §5 of `docs/m44-connections.md`.

`banco-comercial-portugues`, `portuguese-investment-bank`, `altice-portugal`,
`nos`, `brisa-auto-estradas-de-portugal`, `semapa`, `altri`,
`the-navigator-company`.

### M42, the fifteen the new bar puts back

M44b’s bar was that a record reach a Portuguese event within two hops, and
`docs/m42-brief.md` §1 retires it with the Portuguese scope: **a record earns
its place by carrying at least one honest edge to anything already in the
atlas**. Fifteen of the fifty clear that bar today, every one of them on an
edge its own retraction reason had already named and refused for reach alone.
The other thirty-five are in `docs/m42-connections.md` §5, with what each is
waiting for; a reason that still cites the retired rule is rewritten when the
milestone decides that record, not before.

Each reason is copied verbatim below, in the same commit that deleted the
`retraction` block it came from, which is amendment A11’s procedure.

#### `1982-lebanon-war`

Reinstated on `lebanese-civil-war --enabled--> 1982-lebanon-war` and `1982-lebanon-war --enabled--> 2006-lebanon-war`, and the pair the 2006 war made with the civil war is joined to the rest of the atlas by `1948-arab-israeli-war --precondition-of--> lebanese-civil-war`. Its M44b retraction read, verbatim:

> Retracted in M44b, class A. The war of 1982 argues from the Lebanese civil war, which this atlas holds and which itself reaches no Portuguese event, and to the massacres and the occupation, which it does not hold. Nothing in the chain arrives anywhere Portuguese, and the 1948 war that the Israeli records here do connect through is thirty-four years and two wars away.

#### `continuation-war`

Reinstated on `winter-war --caused--> continuation-war`, which is the edge the reason itself names. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. Finland’s second war argues from the Winter war, which this round wired at two hops from a Portuguese event, and that leaves this one at three. The link that would shorten it is Barbarossa, and the atlas holds the Eastern front at two hops itself. Finland reaches this atlas through 1918 and 1939 and no further; the record is sound and one link too far out.

#### `lapland-war`

Reinstated on `continuation-war --caused--> lapland-war`. Its M44b retraction read, verbatim:

> Retracted in M44b, class B, with the Continuation war it followed. Its only neighbours are that war and the Moscow armistice, the first retracted in this commit and the second not a record here, so it stands at four hops from anything Portuguese on the best route available.

#### `greco-turkish-war-of-1897`

Reinstated on `greco-turkish-war-of-1897 --precondition-of--> first-balkan-war`, which is the edge the reason calls honest and one link too long. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. The honest edge is to the First Balkan war — the defeat of 1897 is what produced the Greek army reform and, through the Goudi coup, the Venizelos who made the Balkan League — and the First Balkan war stands at two hops from the nearest Portuguese event, which leaves this one at three. The bar of this round is two. The record is good and the chain to it is one link too long; what would shorten it is a record of the Greek 1909, which the atlas does not hold.

#### `kashmir-conflict`

Reinstated on `kashmir-conflict --caused--> indo-pakistani-war-of-1965` and `kashmir-conflict --caused--> kargil-war`. Its M44b retraction read, verbatim:

> Retracted in M44b, class A. The conflict argues to the Indo-Pakistani wars, one of which is a record here and reaches no Portuguese event, and to the partition of India, which is not. The one place where India and Portugal meet in this atlas is Goa in 1961, and the claim that would join them — that Nehru’s success in Goa emboldened the forward policy on the Chinese border — is contested, and no source this atlas holds carries it. Rather than write a disputed edge from a source nobody here has read, the record is withdrawn.

Its span was `1947–1947`, an end the import invented for a conflict its own article says began with the partition of 1947 and has not ended. The end is now `null` and the article is cited on the record for it; no day was supplied, because none was read.

#### `kargil-war`

Reinstated on `kashmir-conflict --caused--> kargil-war`. Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the Kashmir conflict it belongs to. Its only neighbour here would be the conflict record retracted in the same commit and the Indo-Pakistani war of 1965, which reaches no Portuguese event.

#### `kronstadt-rebellion`

Reinstated on `russian-civil-war --caused--> kronstadt-rebellion`. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. March 1921 argues to the October revolution and the Russian civil war, which are two and three hops from anything Portuguese, and forward to the New Economic Policy, which is not a record here. Every route is one link too long. The record that would fix it is the NEP, or any Portuguese event of the reception of Bolshevism — the atlas holds the PCP as an actor and no event of its founding.

#### `montreux-convention`

Reinstated on `treaty-of-lausanne --precondition-of--> montreux-convention`, which is the edge the reason calls honest. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. The honest edge is to the treaty of Lausanne, whose straits regime Montreux revised, and Lausanne reaches no Portuguese event at all; the Turkish cluster in this atlas — Sèvres, the war of independence, Lausanne — is joined to the rest of it only through the Sèvres edge this round wrote, which leaves Montreux at four hops. The straits question at Potsdam would be the other route and the atlas records nothing of it.

#### `philippine-revolution`

Reinstated on `philippine-revolution --precondition-of--> philippine-american-war`. Its M44b retraction read, verbatim:

> Retracted in M44b, class A: the neighbour is missing. The revolution belongs with the Spanish-American war and the treaty of Paris of 1898, and the war is not a record here. Its one possible bearing on Portugal — 1898 as the year in which a weak colonial empire was dismembered, while Britain and Germany secretly agreed how Portugal’s might be — runs through the Anglo-German convention of August 1898, which the atlas does not hold either. The treaty of Windsor of 1899 is here and is the Portuguese answer to that convention, but with the convention missing there is no honest edge between them.

The reason says “the war is not a record here”. It is now: `spanish-american-war-1898` and `philippine-american-war` are both active, imported after M44b wrote that sentence, and `philippine-american-war` had no edge at all until this one.

#### `treaty-of-paris-1898`

Reinstated on `spanish-american-war-1898 --caused--> treaty-of-paris-1898` and `treaty-of-paris-1898 --caused--> philippine-american-war`. Its M44b retraction read, verbatim:

> Retracted in M44b, class A: the neighbour is missing, and it is the same missing neighbour as the Philippine revolution’s. The treaty settles a war this atlas does not hold. Its Portuguese bearing would run through the Anglo-German convention of August 1898 on the partition of the Portuguese colonies, which is what the treaty of Windsor of 1899 already here was the answer to; without the convention there is nothing between the two but a date. Naming that link without a source this atlas holds would be exactly the confident sentence the brief forbids.

The same correction as the Philippine revolution’s: the war the treaty settles is a record now. The Anglo-German convention of August 1898 is still missing and the edge to the treaty of Windsor is still not written, exactly as the reason says.

#### `porajmos`

Reinstated on `the-holocaust --enabled--> porajmos`. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. The Romani genocide argues to the Holocaust, which this atlas holds and which reaches no Portuguese event within two hops even after the edge this round wrote from it to the genocide convention. There is nothing dishonest about the record and nothing to hang it on: what is missing is any Portuguese record of the war’s persecutions — Sousa Mendes and the visas of 1940 are not in this atlas — and until one is here the whole of the Nazi genocide sits outside the Portuguese reach the round requires.

Left top-level rather than filed under the Holocaust: the article dates the persecution of Roma from 1933, alongside the Jewish persecution rather than inside it, and M62’s rule says an arguable filing is left flat and listed.

#### `rome-statute-of-the-international-criminal-court`

Reinstated on `genocide-convention --precondition-of--> rome-statute-of-the-international-criminal-court`, which is the neighbour the reason calls honest. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. The honest neighbour is the genocide convention, which this round wired at two hops, leaving the statute at three; the other candidates are the tribunals for Yugoslavia and Rwanda, which are not records here, and the Yugoslav wars, retracted in this same commit. An edge from the Charter of the United Nations would be available and would argue nothing, which is what class C below refuses.

#### `rose-revolution`

Reinstated on `rose-revolution --inspired--> orange-revolution`, which is the record the reason names. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. Georgia in 2003 argues forward to the Orange revolution of 2004, which this atlas holds and which reaches no Portuguese event at all. The colour revolutions are a cluster here with no way out of themselves; wiring a third record into them would have made the cluster larger and no less stranded.

#### `sino-indian-war`

Reinstated on `sino-indian-war --enabled--> indo-pakistani-war-of-1965` — not the Goa claim the reason refused, which stays refused. Its M44b retraction read, verbatim:

> Retracted in M44b, class A, with the Kashmir conflict and the Kargil war. The border war of 1962 has its Portuguese edge ten months behind it in the annexation of Goa, and the argument that links them is one about Indian military policy that this atlas holds no source for. It is not being written on a guess. What the atlas needs is a work on Indian foreign policy of the 1950s and 1960s in data/sources.

The reason refused a claim about Goa and Indian military policy for want of a source, and that refusal stands: the edge written here is the one the article on the war of 1965 makes, that Pakistan believed India weak after its defeat by China.

#### `warsaw-ghetto-uprising`

Reinstated on `the-holocaust --reacted-to--> warsaw-ghetto-uprising`. Its M44b retraction read, verbatim:

> Retracted in M44b, class B. April 1943 argues to the Holocaust, which it rose against, and to the Warsaw uprising of 1944, which it is not the same as; both are here and both are out of Portuguese reach. An edge to the Second World War would be true and would say nothing, which is the edge this round refuses to write. Retracted for reach, with the same missing Portuguese record as the Porajmos.

### M42, the sixteenth: the one batch 0 could not place

Batch 0 left `treaty-establishing-a-constitution-for-europe` retracted because the edge it wanted was to the treaty of Lisbon of 2007 and the atlas had no such record. **It had one all along**, retracted by M22 four milestones before M44b, and batch 1 put both back together. The full account is §2b of `docs/m42-connections.md`.

Reinstated on `treaty-of-nice --precondition-of--> treaty-establishing-a-constitution-for-europe` and `treaty-establishing-a-constitution-for-europe --caused--> treaty-of-lisbon`, both read off the English article on the Lisbon treaty at revision 1366118806. Its M44b retraction read, verbatim:

> Retracted in M44b, class B, and it is the retraction the owner will most want to undo. The constitutional treaty argues from Nice, which this round wired at two hops, and forward to the treaty of Lisbon of 2007 — signed in Lisbon, under the Portuguese presidency, and the direct replacement for the text the French and Dutch referendums killed. The Lisbon treaty is the Portuguese end this record needs and it is not in this atlas. One record would bring the constitutional treaty inside the bar and it is a Portuguese one; it is named in docs/m44-connections.md.

## The fifty retractions, by class

Every reason is in the record's own `retraction` block. This is the index.

### Class A — the neighbour is missing (32)

The record's honest edge runs to an event this atlas does not hold, and there
is nothing else here to attach it to. This is the class the brief predicted and
it is the largest.

`first-italo-ethiopian-war`, `philippine-revolution`, `treaty-of-paris-1898`,
`majimaji-war`, `chaco-war`, `nigerian-civil-war`, `sri-lankan-civil-war`,
`romanian-revolution-1989`, `rwandan-civil-war`, `arusha-accords`,
`second-congo-war`, `somali-civil-war`, `yugoslav-wars`,
`croatian-war-of-independence`, `kosovo-war`, `dayton-agreement`,
`1991-soviet-coup-d-etat-attempt`, `1993-russian-constitutional-crisis`,
`budapest-memorandum`, `european-charter-for-regional-or-minority-languages`,
`1982-lebanon-war`, `gaza-war-2008-2009`, `war-in-darfur`,
`south-sudanese-civil-war`, `2006-thai-coup-d-etat`, `2021-myanmar-coup-d-etat`,
`2023-nigerien-coup-d-etat`, `western-african-ebola-virus-epidemic`,
`convention-on-preventing-and-combating-violence-against-women-and-domestic-violence`,
`kashmir-conflict`, `sino-indian-war`, `kargil-war`.

Four of these name a Portuguese record that would have wired them and does not
exist: Portugal's Biafra policy and the São Tomé airlift; the Portuguese
presidency of 1992 and the Cutileiro plan; the ratification of the Istanbul
convention; Portuguese Mozambique before 1960. They are §5b of
`docs/m44-connections.md`. Three more — the Romanian revolution, the Dayton
agreement, the Egyptian coup of 2013 — are blocked on the twelve named
neighbours of owner question 2 that the committed candidate list cannot reach.

### Class B — it reaches this atlas, but not Portugal (15)

Every honest edge available lands on a record that is itself three hops or more
from a Portuguese event, so keeping it would have meant keeping a record that
does not meet the round's bar. In each case the reason says which record would
shorten the chain.

`greco-turkish-war-of-1897`, `kronstadt-rebellion`,
`population-transfer-in-the-soviet-union`, `montreux-convention`, `porajmos`,
`warsaw-ghetto-uprising`, `continuation-war`, `lapland-war`,
`1948-palestine-war`, `good-friday-agreement`,
`rome-statute-of-the-international-criminal-court`,
`treaty-establishing-a-constitution-for-europe`, `2013-egyptian-coup-d-etat`,
`rose-revolution`, `balkan-wars`.

`balkan-wars` is the one of the fifteen retracted for a different reason: the
same import wrote records of both wars it names and this round wired both, so a
third record of the series would argue nothing its parts do not.

### Class C — the only edge available argues nothing (3)

`vienna-convention-on-diplomatic-relations`,
`vienna-convention-on-the-law-of-treaties`, `outer-space-treaty`.

Three multilateral instruments whose sole possible neighbour in this atlas is
the Charter of the United Nations, on the ground that the United Nations
convened the conference that adopted them. That is true of a dozen records and
argues about none of them. This is the class the brief's warning about "a
precondition-of from every twentieth-century war to the Cold War" is about, and
it is the class this round is most pleased to have.

## The two merges

`carnation-revolution` into `carnation-revolution-1974`, and `boer-wars` into
`second-boer-war`. Neither is a retraction: both are records of something the
atlas already held, and the `merged` status names the survivor rather than
leaving an anonymous tombstone. Both keep their Wikidata item, so rule 21 still
sees one item and one record of a kind.

The Carnation Revolution merge is the more interesting of the two. M44a's tick
rule tested candidate rows against `data/` by item and by label, and the
atlas's record of 25 April carries no item and is titled "25 April", so neither
test reached it. Deviation 670 caught exactly this for the proclamation of the
Republic and struck the row by hand; it did not catch this one. A future import
round wanting to avoid a third case should test the date as well as the label.

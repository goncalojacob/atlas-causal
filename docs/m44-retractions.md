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

# M50 — the two worked chains, and where they touch

What this milestone built, and the decisions it took while building it.
`docs/m50-brief.md` is the instruction; this is the account. The tests in
`tests/m50.test.mjs` read this file, so nothing here is prose that once was
true: a row in a table below is a claim about `data/`, and the suite fails if
the records stopped agreeing with it.

## Why two chains and not one

The brief's §2. Two colonial chains do not connect because both are colonial —
that is a theme, not an edge. They connect where the **same record** appears in
both: a treaty, a company, a war, a law. So the chains are two lists of events
that overlap in exactly four places, and those four are marked `shared` below.

The rule that follows, and the one the suite states negatively: **no active
edge may join a Brazil-only event straight to a Caribbean-only one.** Every
path from one chain to the other goes through a record both chains name. That
is what "routed through a shared record" means here, and it is checked rather
than promised.

## The reading of the brief's tests

Three of §8's six properties needed a reading before they could be code, and
the readings are here so they can be argued with.

**"Four hops or fewer" is measured over the whole active graph**, not over the
chain's own edges. A reader who leaves the chain and comes back has still
walked a path the atlas drew. In practice the property is secured by a single
shape: **every event in a chain is two hops or fewer from its chain's centre**
— `the-atlantic-slave-trade-to-brazil` for one and
`the-atlantic-slave-trade-to-the-caribbean` for the other — which puts any pair
at four. That both chains turn out to have a slave-trade record at the centre
is not a device. It is what the sources say the two economies were organised
around, and it is why the centres were chosen after the reading rather than
before.

**"A dated `when`"** is read as: the interval is in time rather than vague —
both bounds are years — and where a record gives a day, the day falls inside
the interval it belongs to. The first draft of the test also asked every
one-year event for its day, and the record that broke it is
`transfer-of-the-colonial-capital-to-rio-de-janeiro-1763`, whose source says
"in 1763" and no more. Asking for a day there would have been a demand on the
sources, answerable only by inventing one. What went in its place is stricter
and is about this run rather than about the past: **every chain event cites a
Wikipedia article at a named revision**, so a reviewer can open the exact text
this run read.

**"Every cross-chain edge passes through a record both chains name"** is read
as: the edge has an endpoint that is a shared record, and its other endpoint is
in a chain. An edge between two shared records is not a cross-link; it is
inside the overlap.

## The Brazil chain

Centre: `the-atlantic-slave-trade-to-brazil`.

| event | |
|---|---|
| `treaty-of-tordesillas-1494` | shared |
| `portuguese-landfall-in-brazil-1500` | |
| `indigenous-depopulation-of-coastal-brazil` | |
| `hereditary-captaincies-of-brazil-1534` | |
| `governorate-general-of-brazil-1549` | |
| `the-brazilian-sugar-cycle` | |
| `dutch-brazil-1630-1654` | shared |
| `the-atlantic-slave-trade-to-brazil` | centre |
| `the-brazilian-gold-cycle` | |
| `transfer-of-the-colonial-capital-to-rio-de-janeiro-1763` | |
| `the-british-industrial-revolution` | shared |
| `transfer-of-the-portuguese-court-to-brazil-1807` | |
| `slave-trade-act-1807` | shared |
| `strangford-treaty-1810` | |
| `independence-of-brazil-1822` | |
| `aberdeen-act-1845` | |
| `eusebio-de-queiros-law-1850` | |
| `lei-aurea-1888` | |
| `proclamation-of-the-brazilian-republic-1889` | |
| `the-1930-revolution-and-the-vargas-era` | |
| `1964-brazilian-coup-detat` | |

## The Caribbean chain

Centre: `the-atlantic-slave-trade-to-the-caribbean`.

| event | |
|---|---|
| `the-first-columbian-voyage-1492` | |
| `treaty-of-tordesillas-1494` | shared |
| `spanish-conquest-of-cuba-1511` | |
| `indigenous-depopulation-of-the-greater-antilles` | |
| `english-settlement-of-barbados-1627` | |
| `dutch-brazil-1630-1654` | shared |
| `the-caribbean-sugar-revolution` | |
| `the-atlantic-slave-trade-to-the-caribbean` | centre |
| `royal-african-company` | |
| `the-british-industrial-revolution` | shared |
| `saint-domingue-and-the-french-sugar-colony` | |
| `haitian-revolution-1791-1804` | |
| `slave-trade-act-1807` | shared |
| `slavery-abolition-act-1833` | |
| `the-cuban-sugar-boom` | |
| `cuban-war-of-independence-1895-1898` | |
| `spanish-american-war-1898` | |
| `platt-amendment-1901` | |
| `cuban-revolution` | |

## The cross-links

Each row is one active edge with an endpoint in the overlap. `through` is the
shared record the link passes through, and it is always one of the two ends.

| from | to | through | what the shared record carries |
|---|---|---|---|
| `treaty-of-tordesillas-1494` | `portuguese-landfall-in-brazil-1500` | `treaty-of-tordesillas-1494` | the meridian that made the coast Portuguese |
| `treaty-of-tordesillas-1494` | `the-atlantic-slave-trade-to-brazil` | `treaty-of-tordesillas-1494` | one crown east *and* west of the line: Guinea and Brazil |
| `treaty-of-tordesillas-1494` | `spanish-conquest-of-cuba-1511` | `treaty-of-tordesillas-1494` | the Castilian title the conquest of the Antilles rested on |
| `the-brazilian-sugar-cycle` | `dutch-brazil-1630-1654` | `dutch-brazil-1630-1654` | the sugar coast the Company came for |
| `governorate-general-of-brazil-1549` | `dutch-brazil-1630-1654` | `dutch-brazil-1630-1654` | the royal colony that made it worth taking |
| `dutch-brazil-1630-1654` | `the-caribbean-sugar-revolution` | `dutch-brazil-1630-1654` | the planters and the sugar technique that left Pernambuco in 1654 |
| `the-brazilian-gold-cycle` | `the-british-industrial-revolution` | `the-british-industrial-revolution` | where the Minas gold went, and whether it mattered |
| `the-atlantic-slave-trade-to-the-caribbean` | `the-british-industrial-revolution` | `the-british-industrial-revolution` | the Williams question, from the Caribbean side |
| `slave-trade-act-1807` | `aberdeen-act-1845` | `slave-trade-act-1807` | the Act the Royal Navy enforced against Brazil |
| `slave-trade-act-1807` | `slavery-abolition-act-1833` | `slave-trade-act-1807` | the Act the British emancipation was built on |

## The arrow that is not here

The one the reader will expect, and the one §2 forbids: **`cuban-revolution` →
`1964-brazilian-coup-detat`**. It is a real historiographical argument — the
Alliance for Progress was Washington's answer to Havana, and it is the frame
American policy towards Brazil was written inside — but the atlas holds no
record that **both** chains name which carries it. Writing it anyway would be
an arrow between two colonial chains asserted on a resemblance, which is the
one thing this milestone was told not to build.

The temptation is concrete and not abstract, which is why it is worth naming.
Wikipedia's account of 1964 has Goulart, in the year before the coup,
"opposing the sanctions proposed by the U.S. against Cuba", and has American
policy allying itself with his opponents. A reader who walks the Caribbean
chain to 1959 and the Brazil chain to 1964 will see it. The atlas can show
them both and can refuse to draw a line between them that it cannot source
through a record it holds.

So it is not written, and this paragraph is what stands in its place. Closing
it properly means a record both chains name — the Alliance for Progress, or the
Organization of American States, or the sugar quota — researched, placed and
dated on its own. That is a milestone, not a line in this one.

Each chain reaches the twentieth century on its own: Brazil through the Vargas
era to 1964, the Caribbean through 1898 and the Platt Amendment to 1959. The
owner's objective — colonisation legible as the ground of a present politics —
is served by each chain being walkable to its own present, not by an arrow
between them that no source supports.

## The type the brief named and the schema does not have

The brief's §4 says "`caused`, `enabled`, `constrained` are different claims".
The schema has five edge types and `constrained` is not one of them
(`caused`, `enabled`, `reacted-to`, `precondition-of`, `inspired`), and §7
forbids adding one. Where the brief would have said `constrained`, this
milestone wrote `precondition-of`, which is the weakest of the five and is the
one that says *this had to be true first* without saying *this brought it
about*. It is used heavily and deliberately: of the edges here, the ones that
claim a cause are the minority.

## Where the research beat the spine

The brief's §3 says its list of subjects carries no dates on purpose and that
where the research says the spine is wrong, the research wins and the brief is
amended to say so. Three places where it did.

**The Methuen Treaty is not in this chain.** It was the obvious candidate for
the channel by which Brazilian gold reached London, and it cannot be an edge
here: Wikipedia dates it 1703 and dates the gold rush from 1695, so an edge
claiming the gold brought the treaty about would run the arrow of time
backwards in argument if not in years — the treaty was a wartime alliance and
a wine-and-textiles bargain struck inside the War of the Spanish Succession,
and the sources do not put Minas in its making. Rule 4 permits
`gold → Methuen` and the sources do not, which is a useful demonstration that
the validator is not the historian. What replaced it is
`transfer-of-the-colonial-capital-to-rio-de-janeiro-1763`, which the same
article explains in exactly the terms an edge needs: the capital moved because
Rio was nearer the mines and had a harbour the gold could leave from.

**The gold cycle lost the dates in its id.** It was to be
`brazilian-gold-cycle-1695-1760`; the sources give 1695 for the strike and
"the second half of the eighteenth century" for the decline, so the record is
`the-brazilian-gold-cycle` and the imprecision lives in `when`, where a
`{min, max}` bound can hold it, rather than in a slug that cannot.

**No event in these chains names an actor.** Every polity record the atlas
holds for Portugal, Spain, Britain or Brazil carries the span of the territory
import that created it — `portugal` begins in 1886, `castile` ends in 1491 —
because those spans are map frames and not lifetimes. Naming `portugal` on a
record of 1500 would assert that a thing beginning in 1886 was present, and
rewriting those actors is M52's work and not this run's. The events carry
places instead, and M48's ground containment finds them for the actors whose
territory they stand in, which is how selecting Portugal already reaches
eighty events rather than eight. What this costs is stated plainly in
`STATUS.md`: the cross-links here are routed through shared *events*, and no
cross-link in this milestone is carried by a shared actor.

## Confidence, and amendment A2

Almost everything here is `probable`. Wikipedia is one source however many
articles are read, so an edge resting on it alone cannot be `consensus` —
rule 22 catches only the case where *every* citation is a Wikipedia record, and
A2 is stricter than rule 22 on purpose. `tests/m50.test.mjs` states A2 as a
test over these chains, because the validator will not.

Where an edge is `consensus`, it is because a named scholarly work that
Wikipedia itself cites was read into `data/sources/` as its own record and a
second author was found who agrees. Where two such authors disagree, the edge
is `disputed` and carries both. `docs/m50-claims.md` is the ledger.

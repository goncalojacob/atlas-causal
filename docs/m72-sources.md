# M72 — the sources on every link, measured

The owner, 21 September: *"First I think each link should have sources
associated with it, then I think the confidence visibility thing makes
sense."* This is the measurement that first half starts from, written and
committed before the run touched a record, as M51, M58 and M62 did.

`node tools/m72-sources.mjs` prints both tables off `data/`; nothing here is
typed by hand.

## Before

Active edges: **362**. Citations on them: **660**. Source records: **35**.

| sources on the edge | edges |
| --- | --- |
| 1 | 81 |
| 2 | 264 |
| 3 | 17 |

| distinct authors across those sources | edges |
| --- | --- |
| 1 | 223 |
| 2 | 92 |
| 3 | 19 |
| 4 | 26 |
| 5 | 2 |

| | citations |
| --- | --- |
| with a locator | 361 |
| without a locator | 299 |

| confidence | edges |
| --- | --- |
| `consensus` | 61 |
| `probable` | 282 |
| `disputed` | 19 |

Edges satisfying rule 9 (two cited sources by different authors): **132**.
Edges resting on one source: **81**. Edges with more than one source but
all by one author: **149**.

### What the numbers say

**Every active edge already names a source.** The thin part is not absence,
it is what a reader can do with what is named.

- **81 edges rest on one source.** Seventy are `probable` and eleven are
  `disputed`; none is `consensus`, because rule 9 would refuse it. Of the 81,
  **27 cite only `wikipedia-en`** — the ones where the article's own reference
  list is the obvious place to look for a second work.
- **149 edges name two or three sources and still have only one author**,
  almost all of them the `wikipedia-en` / `wikipedia-pt` pair. Rule 9 counts
  the two editions as one author, correctly: they are one encyclopedia. So
  **230 of 362 edges cannot be `consensus` as they stand**, and only 132
  satisfy rule 9 at all.
- **299 of 660 citations carry no locator**, and the split is total: every
  `wikipedia-en` and `wikipedia-pt` citation carries article and revision,
  and **every citation of a book, article or primary document carries
  `null`**. *"Maxwell 1995"* is a title on a shelf; *"Maxwell 1995,
  pp. 112–118"* is a citation.

The nineteen `disputed` edges carry 24 further citations in `dispute.sources`,
of which 8 have a locator. Those are counted nowhere above: the tables are
about `sources`, the supporting citations, which is what rule 9 reads.

### Where a locator can honestly come from

This run cannot open Maxwell 1995. It can open what the cited Wikipedia
article says, at the revision the edge names, and it can read the footnote
that article hangs on the sentence stating the claim. That is the owner's
decision of 16 September — *a work Wikipedia itself cites* — and it is the
only route to a page number here. Where the article cites the work with
pages, the pages go on the citation. Where it cites the work bare, the
section heading the claim sits under is the locator. **Where the article
cites the work not at all, the citation keeps its `null`**, and the edge is
listed rather than padded. A page number nobody can check is worse than none.

## After
Active edges: **362**. Citations on them: **676**. Source records: **50**.

| sources on the edge | edges |
| --- | --- |
| 1 | 65 |
| 2 | 280 |
| 3 | 17 |

| distinct authors across those sources | edges |
| --- | --- |
| 1 | 207 |
| 2 | 107 |
| 3 | 20 |
| 4 | 26 |
| 5 | 2 |

| | citations |
| --- | --- |
| with a locator | 377 |
| without a locator | 299 |

| confidence | edges |
| --- | --- |
| `consensus` | 68 |
| `probable` | 275 |
| `disputed` | 19 |

Edges satisfying rule 9 (two cited sources by different authors): **148**.
Edges resting on one source: **65**. Edges with more than one source but
all by one author: **149**.

### What moved, and what did not

Sixteen edges were given a second source and sixteen locators were written.
**Edges resting on one source: 81 → 65. Citations with a locator: 361 → 377.
`consensus`: 61 → 68. Nothing was demoted, and no edge lost a citation.**
Fifteen source records were written, every one a work the cited article's own
citation template names, with the publisher and identifier that template
carries and the check digit of every ISBN verified before the record was.

The seven promotions are listed under the rule they were promoted by. **None
was promoted because this run found the claim convincing.** The test each had
to pass: rule 9 is satisfied by the work added, the work is scholarship rather
than an encyclopedia, and **the cited article hangs the very sentence stating
this edge's link on that work** — so what promotes the edge is two authors
saying the same thing, and the second author is speaking through the article's
own footnote.

| edge | the work, and the sentence it carries |
| --- | --- |
| `world-war-i --enabled--> easter-rising` | Caulfield 1995, p. 18 — the IRB met on 5 September 1914 and elected to rise before the war ended and to seek German help |
| `world-war-i --caused--> german-revolution-of-1918-1919` | Mommsen 1996, p. 11 — the population saw the Emperor as responsible for the suffering and the outcome, and calls for abdication grew |
| `world-war-i --precondition-of--> finnish-civil-war` | Upton 1980, pp. 62–144 — "the main factor behind the Finnish Civil War was a political crisis arising out of World War I" |
| `treaty-of-london --precondition-of--> paris-peace-conference` | Burgwyn 1997, pp. 7–8 — Wilson held Italian ambitions in check by self-determination, and "Pact of London plus Fiume" followed |
| `1964-brazilian-coup-detat --reacted-to--> operation-brother-sam-1964` | Parker 1977, pp. 109, 115 — the disband order at 17:22 on 2 April, and the task force's return |
| `the-atlantic-slave-trade-to-brazil --enabled--> the-brazilian-coffee-cycle` | Eakin 1998, pp. 33–34 — the early coffee industry was dependent on slaves, and the planters turned to immigrants when the traffic was outlawed in 1850 |
| `the-baptist-war-1831 --caused--> slavery-abolition-act-1833` | Craton 1982, pp. 319–323 — the inquiries held because of the losses of 1831 contributed greatly to abolition |

Nine more edges took a source and kept the confidence a person gave them,
because the work answers the surrounding facts and not the link: Gaunt 2006 on
the Ottoman mobilisation, Tauber 2014 on the rebels' goal, Upton 1980 on the
Finnish rivalry of 1917, Hall 2000 on Serbia after the second Balkan war,
Fifer 1970 on the rubber price, Fausto 1999 on valorisation, Watson 1970 on
the Barbadian tobacco years, Seibert 2005 on Batepá, and Ferreira and Gomes
2014 on the Profit Remittance Act — that last on an edge that is `disputed`
and stays so, because a second source does not settle a disagreement the
record exists to hold open.

### The sixty-five that still rest on one source

**Fifty-three of them already rest on a work of scholarship** — MacQueen on
Portuguese decolonisation (14), Telo on contemporary Portugal (13), Costa
Pinto and Pequito Teixeira on the parties (7), Reis on the slump (4), and the
rest one or two each. They are thin, not unsourced, and this run could not
thicken them: the route the owner's decision of 16 September opens is *a work
Wikipedia itself cites for the claim*, and for these claims Wikipedia cites
nothing. The English articles on Wiriyamu and Mueda are three-kilobyte stubs;
"Transfer of sovereignty over Macau" and "Portugal and NATO" likewise. Where
the Portuguese colonial war is covered at length, **the work cited is
MacQueen's own** — the 1999 Portuguese edition, whose pages are not the 1997
English edition's, so they cannot even be borrowed as a locator.

**Twelve still rest on `wikipedia-en` alone**, and each was looked at:

| edge | why nothing was added |
| --- | --- |
| `petrobras-1953 → operation-car-wash-2014` | the article is sourced to news reports, not to scholarship |
| `operation-car-wash-2014 → the-2018-brazilian-general-election` | the same |
| `operation-car-wash-2014 → lula-returns-to-the-presidency-2023` | the same |
| `the-impeachment-of-dilma-rousseff-2016 → the-2018-brazilian-general-election` | the same |
| `the-2018-brazilian-general-election → lula-returns-to-the-presidency-2023` | the same |
| `covid-19-pandemic → covid-19-pandemic-in-europe` | the same, at very great length |
| `1964-brazilian-coup-detat → 1985-brazilian-presidential-election` | the article carries no paged citation at all |
| `1964-brazilian-coup-detat → the-1988-brazilian-constitution` | the same |
| `1964-brazilian-coup-detat → the-brazilian-miracle-1968-1973` | the same |
| `first-balkan-war → assassination-of-archduke-franz-ferdinand` | Hall 2000 is cited through p. 74 and not for the aftermath this edge is about |
| `german-revolution-of-1918-1919 → treaty-of-versailles` | the National Assembly's vote is cited to a web page, and the monographs are cited without pages |
| `the-1930-revolution-and-the-vargas-era → us-air-bases-in-the-brazilian-northeast-1942` | the 1942 exchange is cited to a document collection about the Havana meeting of 1940 |

A news report is a fact somebody checked and not an argument somebody made, and
an atlas that cited one for a causal link would be padding rather than
sourcing. These twelve stay as they are, and saying so is the point.

### The 299 citations with no locator, which are still 299

Not one moved, and the reason is worth writing down rather than repeating the
count. **The split measured at the start was total and it has not changed**:
every Wikipedia citation carries article and revision because the import wrote
it that way, and every citation of a book, article or primary document carries
`null` because a person wrote the book's name from memory of the field and not
from a page.

The brief allows a locator "on every existing source where the cited article
makes the locator findable". Measured: **only 26 active edges carry both a
located `wikipedia-en` citation and a bare one**, across 24 different articles
— and those articles are on the Spanish Civil War, the Maastricht Treaty, the
Second Boer War. They do not cite Telo, Rosas or Ramos, because an English
encyclopedia article on the Treaty of Rome has no reason to. The remaining 273
bare citations sit on edges that name no article this run could open.

So the honest answer is that **these locators are not on the internet this run
can reach; they are in the books**. Whoever has Maxwell 1995 on a shelf can
write "pp. 112–118" in an afternoon, and `review.html` is where that happens,
one record at a time. What this run could do instead was make sure that every
citation it *wrote* carries one, and all sixteen do.

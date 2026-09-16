# M50 — the ledger of claims

Amendment A1 to `docs/m50-brief.md` settled where the historical claims of this
milestone come from: **Wikipedia**, with named scholarly works where a link
needed more than an encyclopedia could give. §6's narrowing survives that
choice — *every claim written under the exception is listed in one file so it
can be reviewed as a body rather than hunted for* — and this is the file.

One row per causal edge in the two chains. The sources column names the source
records the edge cites; the reading is what was taken from them. The
corresponding rows for the events themselves are in the records, whose
`sources` carry the article and the revision they were read at, so that a
reviewer can open the same text this run read.

`tests/m50.test.mjs` holds this file to the records: an edge in a chain that is
not listed here fails the suite, and so does a row naming a source that is not
a source record.

## What `probable` means in this table

It means: the cited sources support the link and this run found no dissent in
them. It does not mean the link is half-believed. Amendment A2: Wikipedia is
one source however many articles are read, so a link resting on it alone is
`probable` however settled the history is. A reader who wants to know whether a
`probable` edge is contested or merely single-sourced has the explanation and
the citation to go on, which is the argument for the edge carrying its own
justification in the first place.

## The edges

| edge | confidence | sources | the reading |
|---|---|---|---|
| `treaty-of-tordesillas-1494--portuguese-landfall-in-brazil-1500--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the line of 1494 is what a landfall in 1500 could be a claim under |
| `treaty-of-tordesillas-1494--the-atlantic-slave-trade-to-brazil--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | one crown east and west of the line: the Guinea coast and the Brazilian coast |
| `portuguese-landfall-in-brazil-1500--the-atlantic-slave-trade-to-brazil--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the coast had to be Portuguese before the traffic could land on it |
| `hereditary-captaincies-of-brazil-1534--governorate-general-of-brazil-1549--caused` | probable | `wikipedia-en`, `wikipedia-en` | the captaincies failed and the crown took the colony back in hand |
| `hereditary-captaincies-of-brazil-1534--the-atlantic-slave-trade-to-brazil--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the grants of 1534 are the property the plantation was built on |
| `governorate-general-of-brazil-1549--dutch-brazil-1630-1654--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the Dutch took a colony the crown had already made worth taking |
| `the-brazilian-sugar-cycle--the-atlantic-slave-trade-to-brazil--caused` | probable | `wikipedia-en`, `wikipedia-en` | the mills are what the traffic was for |
| `the-brazilian-sugar-cycle--dutch-brazil-1630-1654--caused` | probable | `wikipedia-en`, `wikipedia-en` | the Company came for the sugar coast and wrecked it in holding it |
| `the-atlantic-slave-trade-to-brazil--the-brazilian-gold-cycle--enabled` | probable | `wikipedia-en`, `wikipedia-en` | half a million enslaved Africans in the mining region against 400,000 Portuguese |
| `the-brazilian-gold-cycle--transfer-of-the-colonial-capital-to-rio-de-janeiro-1763--caused` | probable | `wikipedia-en`, `wikipedia-en` | the capital followed the gold to the harbour it shipped from |

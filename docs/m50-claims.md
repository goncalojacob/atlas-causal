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
| `the-brazilian-gold-cycle--transfer-of-the-portuguese-court-to-brazil-1807--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the court fled to the richest colony, and the mines are what had made it rich |
| `transfer-of-the-colonial-capital-to-rio-de-janeiro-1763--transfer-of-the-portuguese-court-to-brazil-1807--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the capital the court moved into had been made a capital forty-four years earlier |
| `transfer-of-the-portuguese-court-to-brazil-1807--strangford-treaty-1810--caused` | probable | `wikipedia-en`, `wikipedia-en` | the navy that carried the court was paid in tariffs and an abolition clause |
| `transfer-of-the-portuguese-court-to-brazil-1807--independence-of-brazil-1822--caused` | probable | `wikipedia-en`, `wikipedia-en` | a colony that had been the seat of the empire would not be a colony again |
| `strangford-treaty-1810--aberdeen-act-1845--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the 1845 Act enforces a promise first given in 1810 and inherited in 1826 |
| `independence-of-brazil-1822--aberdeen-act-1845--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | there is no Anglo-Brazilian convention to lapse until there is a Brazil |
| `the-atlantic-slave-trade-to-brazil--aberdeen-act-1845--caused` | probable | `wikipedia-en`, `wikipedia-en` | a trade that would not stop under Brazilian law was stopped under British guns |
| `aberdeen-act-1845--eusebio-de-queiros-law-1850--caused` | probable | `wikipedia-en`, `wikipedia-en` | five years of seizures, and then the law of 1831 was re-enacted and meant |
| `eusebio-de-queiros-law-1850--lei-aurea-1888--caused` | probable | `wikipedia-en`, `wikipedia-en` | an institution that could not be resupplied took thirty-eight years to die |
| `the-atlantic-slave-trade-to-brazil--lei-aurea-1888--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | what the Golden Law abolished is the thing three centuries of landings had made |
| `lei-aurea-1888--proclamation-of-the-brazilian-republic-1889--caused` | probable | `wikipedia-en`, `wikipedia-en` | abolition without compensation cost the Empire the class that had held it up |
| `the-atlantic-slave-trade-to-brazil--proclamation-of-the-brazilian-republic-1889--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the class the Empire rested on is the class the traffic created |
| `proclamation-of-the-brazilian-republic-1889--the-1930-revolution-and-the-vargas-era--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the Old Republic is the thing 1930 overthrew, and 1889 is what made it |
| `portuguese-landfall-in-brazil-1500--indigenous-depopulation-of-coastal-brazil--caused` | probable | `wikipedia-en`, `wikipedia-en` | contact, and then a decline from two or three million to three hundred thousand |
| `indigenous-depopulation-of-coastal-brazil--the-atlantic-slave-trade-to-brazil--caused` | probable | `wikipedia-en`, `wikipedia-en` | the labour force the colony began with was dying, and it turned to the Atlantic for another |
| `the-1930-revolution-and-the-vargas-era--1964-brazilian-coup-detat--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the parties, the blocs and the quarrel of 1964 all come out of the Vargas settlement |
| `proclamation-of-the-brazilian-republic-1889--1964-brazilian-coup-detat--precondition-of` | probable | `wikipedia-en`, `wikipedia-en`, `wikipedia-en` | the army as moderating power, a pattern beginning in 1889 and broken in 1964 |
| `the-first-columbian-voyage-1492--treaty-of-tordesillas-1494--caused` | probable | `wikipedia-en`, `wikipedia-en` | the treaty was made to settle the quarrel the voyage started |
| `the-first-columbian-voyage-1492--indigenous-depopulation-of-the-greater-antilles--caused` | probable | `wikipedia-en`, `wikipedia-en` | the thirty years after the landfall killed eight or nine of every ten Taíno |
| `indigenous-depopulation-of-the-greater-antilles--the-atlantic-slave-trade-to-the-caribbean--caused` | probable | `wikipedia-en`, `wikipedia-en` | the labour that was already there had been destroyed, so labour was imported |
| `indigenous-depopulation-of-the-greater-antilles--the-caribbean-sugar-revolution--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the sugar islands were planted in a vacancy the previous century had made |
| `english-settlement-of-barbados-1627--the-caribbean-sugar-revolution--precondition-of` | probable | `wikipedia-en` | an English island with cleared ground, thirteen years before the cane |
| `english-settlement-of-barbados-1627--the-atlantic-slave-trade-to-the-caribbean--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | six people on the first ship, and sixty on the median estate fifty years later |
| `dutch-brazil-1630-1654--the-caribbean-sugar-revolution--caused` | probable | `wikipedia-en`, `wikipedia-en`, `wikipedia-en` | the mill, the cauldrons, the planters and the credit went from Pernambuco to Barbados |
| `the-caribbean-sugar-revolution--the-atlantic-slave-trade-to-the-caribbean--caused` | probable | `wikipedia-en`, `wikipedia-en` | a crop with economies of scale, and a traffic sized to it |
| `the-caribbean-sugar-revolution--royal-african-company--caused` | probable | `wikipedia-en`, `wikipedia-en` | a company chartered for gold that went into people, because of what the islands wanted |
| `the-atlantic-slave-trade-to-the-caribbean--royal-african-company--caused` | probable | `wikipedia-en`, `wikipedia-en` | the English crown chartering its way into a traffic other people were running |
| `the-atlantic-slave-trade-to-the-caribbean--saint-domingue-and-the-french-sugar-colony--enabled` | probable | `wikipedia-en`, `wikipedia-en` | a new colony could buy into a traffic that was already running |
| `saint-domingue-and-the-french-sugar-colony--haitian-revolution-1791-1804--caused` | probable | `wikipedia-en`, `wikipedia-en` | the richest and most enslaved colony in the Caribbean, and what its majority did |
| `the-atlantic-slave-trade-to-the-caribbean--haitian-revolution-1791-1804--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the traffic assembled the majority; the majority is what rose |
| `the-atlantic-slave-trade-to-the-caribbean--the-british-industrial-revolution--enabled` | disputed | `wikipedia-en`, `wikipedia-en`, `wikipedia-en` | Williams’s thesis that slave-grown sugar financed British industry, against Engerman and Richardson on the size of the profits |
| `the-brazilian-gold-cycle--the-british-industrial-revolution--enabled` | disputed | `wikipedia-en`, `wikipedia-en`, `wikipedia-en` | Minas gold spent in Lisbon on manufactures it could not make — and whether that mattered in Manchester |
| `the-british-industrial-revolution--slave-trade-act-1807--enabled` | disputed | `wikipedia-en`, `wikipedia-en` | the decline thesis, against Drescher’s Econocide and the abolition of a trade at its peak |
| `slave-trade-act-1807--aberdeen-act-1845--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | a state that had closed its own trade could then press other states to close theirs |
| `the-atlantic-slave-trade-to-the-caribbean--the-baptist-war-1831--precondition-of` | probable | `wikipedia-en`, `wikipedia-en`, `wikipedia-en` | three enslaved people for every planter is the ground the strike stood on |
| `the-baptist-war-1831--slavery-abolition-act-1833--caused` | probable | `wikipedia-en` | the rebellion, the two inquiries, and the Act twenty months later |
| `slave-trade-act-1807--slavery-abolition-act-1833--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | the trade first, the institution twenty-six years later, and the machinery in between |
| `haitian-revolution-1791-1804--the-cuban-sugar-boom--caused` | probable | `wikipedia-en`, `wikipedia-en` | Saint-Domingue stopped producing and the market moved to Cuba — and so did the fear |
| `the-atlantic-slave-trade-to-the-caribbean--the-cuban-sugar-boom--enabled` | probable | `wikipedia-en`, `wikipedia-en`, `wikipedia-en` | the last market of the traffic, working until 1886 |
| `the-cuban-sugar-boom--cuban-war-of-independence-1895-1898--caused` | probable | `wikipedia-en`, `wikipedia-en` | abolition, consolidation, and a colony no longer trading with the power that held it |
| `cuban-war-of-independence-1895-1898--spanish-american-war-1898--caused` | probable | `wikipedia-en`, `wikipedia-en` | the last three months of one war are the whole of the other |
| `the-cuban-sugar-boom--spanish-american-war-1898--precondition-of` | probable | `wikipedia-en`, `wikipedia-en` | American money owned the sugar and wanted peace — which is still why Cuba was America’s to intervene in |
| `spanish-american-war-1898--platt-amendment-1901--caused` | probable | `wikipedia-en`, `wikipedia-en` | the terms on which the occupation of 1898 agreed to leave |

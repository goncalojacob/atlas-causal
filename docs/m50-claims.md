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

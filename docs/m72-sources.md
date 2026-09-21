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


Written at the end of the run.
